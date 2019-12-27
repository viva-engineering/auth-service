
import { db } from '../../../../database';
import { logger } from '../../../../logger';
import { verify } from '../../../../utils/hasher';
import { generateSessionKey } from '../../../../utils/random-keys';
import { createSession, createElevatedSession } from '../../../../redis/session';
import { reduceFailures } from '../../../../database/queries/credential/reduce-failures';
import { markCompromised } from '../../../../database/queries/credential/mark-compromised';
import { increaseFailures } from '../../../../database/queries/credential/increase-failures';
import { verifyPasswordByUsername } from '../../../../utils/verify-password';
import { getPasswordCredentials } from '../../../../database/queries/credential/get-password-by-username';
import { TransactionType } from '@viva-eng/database';
import { HttpError } from '@celeri/http-error';

const maxFailures = 5;

enum ErrorCodes {
	AuthenticationFailed = 'AUTHENTICATION_FAILED',
	CredentialLocked = 'CREDENTIAL_LOCKED_FOR_RECENT_FAILURES',
	PasswordExpired = 'PASSWORD_EXPIRED',
	UnexpectedError = 'UNEXPECTED_ERROR'
}

export const authenticateWithPassword = async (username: string, password: string, elevated: boolean) => {
	const connection = await db.startTransaction(TransactionType.ReadWrite);

	let commit = async () => {
		commit = async () => { };

		await db.commitTransaction(connection);
		connection.release();
	};

	try {
		const credentialRecords = await db.runQuery(connection, getPasswordCredentials, { username });

		if (! credentialRecords.results.length) {
			throw new HttpError(401, 'Authentication failed', {
				code: ErrorCodes.AuthenticationFailed
			});
		}

		const credential = credentialRecords.results[0];

		if (credential.cred_compromised) {
			await db.runQuery(connection, markCompromised, { credentialId: credential.cred_id });
			await db.runQuery(connection, increaseFailures, { credentialId: credential.cred_id });
			await commit();

			throw new HttpError(423, 'Credential locked', {
				code: ErrorCodes.CredentialLocked
			});
		}

		const passwordValid = await verify(credential.cred_digest, password);

		if (! passwordValid) {
			await db.runQuery(connection, increaseFailures, { credentialId: credential.cred_id });

			if (credential.recent_failures >= maxFailures) {
				await db.runQuery(connection, markCompromised, { credentialId: credential.cred_id });
				await commit();

				throw new HttpError(423, 'Credential locked', {
					code: ErrorCodes.CredentialLocked
				});
			}

			await commit();

			throw new HttpError(401, 'Authentication failed', {
				code: ErrorCodes.AuthenticationFailed
			});
		}

		if (parseInt(credential.cred_ttl, 10) <= 0 && ! elevated) {
			throw new HttpError(401, 'Password expired', {
				code: ErrorCodes.PasswordExpired
			});
		}

		await commit();

		const token = await generateSessionKey();
		const create = elevated ? createElevatedSession : createSession;

		await create(token, credential.user_id, credential.user_role);

		return token;
	}

	catch (error) {
		await commit();

		if (error instanceof HttpError) {
			throw error;
		}

		logger.warn('Unexpected error while processing authentication', { error });

		throw new HttpError(500, 'Unexpected error', {
			code: ErrorCodes.UnexpectedError
		});
	}
};
