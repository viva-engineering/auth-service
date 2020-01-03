
import { db } from '../../../../database';
import { logger } from '../../../../logger';
import { verify } from '../../../../utils/hasher';
import { generateSessionKey } from '../../../../utils/random-keys';
import { createSession } from '../../../../redis/session';
import { destroyCredential } from '../../../../database/queries/credential/destroy-credential';
import { getApplicationCredential } from '../../../../database/queries/credential/get-application-credential';
import { TransactionType } from '@viva-eng/database';
import { HttpError } from '@celeri/http-error';

enum ErrorCodes {
	AuthenticationFailed = 'AUTHENTICATION_FAILED',
	CredentialExpired = 'CREDENTIAL_EXPIRED',
	UnexpectedError = 'UNEXPECTED_ERROR'
}

export const authenticateWithApplication = async (username: string, applicationId: string, applicationSecret: string, userSecret: string) => {
	const connection = await db.startTransaction(TransactionType.ReadWrite);

	let commit = async () => {
		commit = async () => { };

		await db.commitTransaction(connection);
		connection.release();
	};

	try {
		const credentialRecords = await db.runQuery(connection, getApplicationCredential, { username, applicationId });

		if (! credentialRecords.results.length) {
			throw new HttpError(401, 'Authentication failed', {
				code: ErrorCodes.AuthenticationFailed
			});
		}

		const credential = credentialRecords.results[0];

		if (parseInt(credential.cred_ttl, 10) <= 0) {
			await db.runQuery(connection, destroyCredential, {
				credentialId: credential.cred_id
			});

			throw new HttpError(401, 'Authentication failed', {
				code: ErrorCodes.AuthenticationFailed
			});
		}

		const [ userSecretValid, appSecretValid ] = await Promise.all([
			verify(credential.cred_digest, userSecret),
			verify(credential.application_secret_digest, applicationSecret)
		]);

		if (! userSecretValid || ! appSecretValid) {
			throw new HttpError(401, 'Authentication failed', {
				code: ErrorCodes.AuthenticationFailed
			});
		}

		await commit();

		const token = await generateSessionKey();

		await createSession(token, credential.user_id, credential.user_role, applicationId);

		return token;
	}

	catch (error) {
		await commit();

		if (error instanceof HttpError) {
			throw error;
		}

		logger.error('Unexpected error while attempting to authenticate with application key', { error });

		throw new HttpError(500, 'Unexpected error', {
			code: ErrorCodes.UnexpectedError
		});
	}
};
