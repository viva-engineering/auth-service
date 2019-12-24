
import { db } from '../../../../database';
import { logger } from '../../../../logger';
import { hash, verify } from '../../../../utils/hasher';
import { generateSessionKey } from '../../../../utils/random-keys';
import { getPasswordCredentials } from '../../../../database/queries/credential/get-password-by-user-id';
import { updatePassword as updatePasswordQuery } from '../../../../database/queries/credential/update-password';
import { verifyPasswordByUserId } from '../../../../utils/verify-password';
import { TransactionType } from '@viva-eng/database';
import { HttpError } from '@celeri/http-error';

export enum ErrorCodes {
	InvalidCredentials = 'INVALID_CREDENTAILS',
	UnexpectError = 'UNEXPECTED_ERROR'
}

export const updatePassword = async (userId: string, newPassword: string) => {
	const newDigest = await hash(newPassword);
	const connection = await db.startTransaction(TransactionType.ReadWrite);

	try {
		const credentials = await db.runQuery(connection, getPasswordCredentials, { userId });

		if (! credentials.results.length) {
			throw new HttpError(401, 'Invalid credentials', {
				code: ErrorCodes.InvalidCredentials
			});
		}

		const credential = credentials.results[0];

		await db.runQuery(connection, updatePasswordQuery, {
			credentialId: credential.cred_id,
			digest: newDigest
		});

		await db.commitTransaction(connection);
		connection.release();
	}

	catch (error) {
		await db.rollbackTransaction(connection);
		connection.release();

		if (error instanceof HttpError) {
			throw error;
		}

		logger.warn('Unexpected error attempting to update password', { error });

		throw new HttpError(500, 'Unexpected error', {
			code: ErrorCodes.UnexpectError
		});
	}
};
