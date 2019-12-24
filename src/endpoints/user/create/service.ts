
import { db } from '../../../database';
import { PoolConnection } from 'mysql2';
import { TransactionType } from '@viva-eng/database';
import { createUser } from '../../../database/queries/user/create';
import { lookupUsername } from '../../../database/queries/user/lookup-username';
import { createCredential } from '../../../database/queries/credential/create-password';
import { HttpError } from '@celeri/http-error';
import { logger } from '../../../logger';
import { hash } from '../../../utils/hasher';
import { generateUserCode } from '../../../utils/random-keys';

enum ErrorCodes {
	UnexpectedError = 'UNEXPECTED_ERROR',
	UsernameAlreadyInUse = 'USERNAME_ALREADY_IN_USE'
}

/**
 * Creates a new user record, and stores the password credential record
 *
 * @param username The username to associate to the new account
 * @param password The password to associate to the new account
 */
export const createRegistration = async (username: string, password: string) => {
	const [ userCode, digest ] = await Promise.all([
		generateUserCode(),
		hash(password)
	]);

	const connection = await db.startTransaction(TransactionType.ReadWrite);

	try {
		const found = await db.runQuery(connection, lookupUsername, { username });

		if (found.results.length) {
			throw new HttpError(409, 'Username already in use', {
				code: ErrorCodes.UsernameAlreadyInUse
			});
		}

		const created = await db.runQuery(connection, createUser, { username, userCode });
		const userId = created.insertId as string;

		await db.runQuery(connection, createCredential, { userId, digest });

		await db.commitTransaction(connection);
		connection.release();
	}

	catch (error) {
		await db.rollbackTransaction(connection);
		connection.release();

		// If we already have an HttpError, just pass it up
		if (error instanceof HttpError) {
			throw error;
		}

		logger.warn('Unexpected error while processing registration', { error });

		// Otherwise, create a generic one
		throw new HttpError(500, 'An error occured while processing the registration', {
			code: ErrorCodes.UnexpectedError
		});
	}
};
