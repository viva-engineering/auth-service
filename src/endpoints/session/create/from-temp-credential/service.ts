
import { db } from '../../../../database';
import { logger } from '../../../../logger';
import { generateSessionKey } from '../../../../utils/random-keys';
import { verifyTempCredential } from '../../../../utils/temp-credential';
import { createSession, createElevatedSession } from '../../../../redis/session';
import { getTempCredential } from '../../../../database/queries/credential/get-temp-credential';
import { increaseFailures } from '../../../../database/queries/credential/increase-failures';
import { destroyCredential } from '../../../../database/queries/credential/destroy-credential';
import { TransactionType } from '@viva-eng/database';
import { HttpError } from '@celeri/http-error';
import { processVerifications } from './verifications';

const maxFailures = 5;

enum ErrorCodes {
	InvalidCredentials = 'INVALID_CREDENTIALS',
	InvalidRequestId = 'INVALID_CREDENTIAL_REQUEST_ID',
	PasswordExpired = 'PASSWORD_EXPIRED',
	UnexpectedError = 'UNEXPECTED_ERROR'
}

export const authenticateWithTempCredential = async (requestId: string, verificationKey: string, elevated: boolean = false) => {
	const token = await generateSessionKey();
	const connection = await db.startTransaction(TransactionType.ReadWrite);

	let commit = async () => {
		commit = async () => { };

		await db.commitTransaction(connection);
		connection.release();
	};

	try {
		const credentials = await db.runQuery(connection, getTempCredential, { requestId });

		if (! credentials.results.length) {
			throw new HttpError(401, 'Invalid credential request ID', {
				code: ErrorCodes.InvalidRequestId
			});
		}

		const credential = credentials.results[0];
		const isValid = await verifyTempCredential(requestId, verificationKey, credential.cred_digest);

		if (! isValid) {
			if (credential.cred_recent_failures >= maxFailures) {
				await db.runQuery(connection, destroyCredential, { credentialId: credential.cred_id });
			}

			else {
				await db.runQuery(connection, increaseFailures, { credentialId: credential.cred_id });
			}

			await commit();

			throw new HttpError(401, 'Invalid credentials', {
				code: ErrorCodes.InvalidCredentials
			});
		}

		await db.runQuery(connection, destroyCredential, { credentialId: credential.cred_id });
		await processVerifications(connection, credential);
		await commit();

		if (parseInt(credential.cred_ttl, 10) <= 0 && ! elevated) {
			await db.runQuery(connection, destroyCredential, { credentialId: credential.cred_id });
			await commit();

			throw new HttpError(401, 'Invalid credentials', {
				code: ErrorCodes.InvalidCredentials
			});
		}

		const create = elevated ? createElevatedSession : createSession;

		await create(token, credential.user_id, credential.user_role);

		return token;
	}

	catch (error) {
		await commit();

		if (error instanceof HttpError) {
			throw error;
		}

		logger.warn('Unexpected error while attmpting to create a session from temp credentials', { error });

		throw new HttpError(500, 'Unexpected error', {
			code: ErrorCodes.UnexpectedError
		});
	}
};
