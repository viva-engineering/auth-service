
import { db } from '../../../../database';
import { logger } from '../../../../logger';
import { verify } from '../../../../utils/hasher';
import { generateSessionKey } from '../../../../utils/random-keys';
import { getPasswordCredentials } from './queries/get-password-credentials';
import { increaseFailures } from './queries/increase-failures';
import { markCompromised } from './queries/mark-compromised';
import { reduceFailures } from './queries/reduce-failures';
import { createSession } from '../queries/create-session';
import { TransactionType } from '@viva-eng/database';
import { HttpError } from '@celeri/http-error';

const maxFailures = 5;

enum ErrorCodes {
	AuthenticationFailed = 'AUTHENTICATION_FAILED',
	CredentialLocked = 'CREDENTIAL_LOCKED_FOR_RECENT_FAILURES',
	UnexpectedError = 'UNEXPECTED_ERROR'
}

export const authenticateWithPassword = async (email: string, password: string) => {
	const connection = await db.startTransaction(TransactionType.ReadWrite);

	let commit = async () => {
		commit = async () => { };

		await db.commitTransaction(connection);
		connection.release();
	};

	try {
		const credentialRecords = await db.runQuery(connection, getPasswordCredentials, { email });

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

		const token = await generateSessionKey();

		await db.runQuery(connection, createSession, {
			id: token,
			userId: credential.user_id
		});

		await commit();

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
