
import { db } from '../../../../database';
import { logger } from '../../../../logger';
import { verify } from '../../../../utils/hasher';
import { generateSessionKey } from '../../../../utils/random-keys';
import { getCredential } from './queries/get-credential';
import { deleteCredential } from './queries/delete-credential';
import { recordFailure } from './queries/record-failure';
import { createSession } from '../queries/create-session';
import { TransactionType } from '@viva-eng/database';
import { HttpError } from '@celeri/http-error';

const maxFailures = 3;

enum ErrorCodes {
	InvalidRequestId = 'INVALID_REQUEST_ID',
	CredentialExpired = 'CREDENTIAL_EXPIRED',
	TooManyAttempts = 'TOO_MANY_ATTEMPTS',
	InvalidVerificationKey = 'INVALID_VERIFICATION_KEY',
	UnexpectedError = 'UNEXPECTED_ERROR'
}

export const authenticateWithEmailCode = async (requestId: string, verificationKey: string) => {
	const connection = await db.startTransaction(TransactionType.ReadWrite);

	try {
		const credentials = await db.runQuery(connection, getCredential, { requestId });

		if (! credentials.results.length) {
			throw new HttpError(401, 'Invalid authentication request', {
				code: ErrorCodes.InvalidRequestId
			});
		}

		const credential = credentials.results[0];

		if (credential.is_expired) {
			await db.runQuery(connection, deleteCredential, { credentialId: credential.id });

			throw new HttpError(401, 'Credential expired', {
				code: ErrorCodes.CredentialExpired
			});
		}

		const keyIsValid = await verify(credential.key_digest, requestId + verificationKey);

		if (! keyIsValid) {
			if (credential.recent_failures >= maxFailures) {
				await db.runQuery(connection, deleteCredential, { credentialId: credential.id });

				throw new HttpError(401, 'Too many attempts', {
					code: ErrorCodes.TooManyAttempts
				});
			}

			await db.runQuery(connection, recordFailure, { credentialId: credential.id });

			throw new HttpError(401, 'Invalid verification key', {
				code: ErrorCodes.InvalidVerificationKey
			});
		}

		const token = await generateSessionKey();

		await db.runQuery(connection, deleteCredential, { credentialId: credential.id });
		await db.runQuery(connection, createSession, {
			id: token,
			userId: credential.user_id
		});

		await db.commitTransaction(connection);
		connection.release();

		return token;
	}

	catch (error) {
		// Even in the event of errors, we still want to commit the transaction here
		// to make sure things like expired record deletes get committed.
		await db.commitTransaction(connection);
		connection.release();

		if (error instanceof HttpError) {
			throw error;
		}

		logger.warn('Unexpected error while processing authentication', { error });

		throw new HttpError(500, 'Unexpected error', {
			code: ErrorCodes.UnexpectedError
		});
	}
};
