
import { db } from '../../../database';
import { PoolConnection } from 'mysql';
import { TransactionType } from '@viva-eng/database';
import { lookupEmail } from './queries/lookup-email';
import { createUser } from './queries/create-user';
import { createEmailCredential } from './queries/create-email-credential';
import { HttpError } from '@celeri/http-error';
import { logger } from '../../../logger';
import { hash } from '../../../utils/hasher';
import { generateUserCode, generateVerificationKey, generateCredentialRequestId } from '../../../utils/random-keys';

enum ErrorCodes {
	UnexpectedError = 'UNEXPECTED_ERROR',
	EmailAlreadyInUse = 'EMAIL_ALREADY_IN_USE'
}

/**
 * Creates a new user record, and begins the flow for email verification by creating
 * a new email authentication credential
 *
 * @param email The email address to associate to the new account
 */
export const createRegistration = async (email: string) => {
	let userId: string;
	
	const [ userCode, requestId, verificationKey ] = await Promise.all([
		generateUserCode(),
		generateCredentialRequestId(),
		generateVerificationKey()
	]);

	const keyDigest = await hash(requestId + verificationKey);
	const connection = await db.startTransaction(TransactionType.ReadWrite);

	try {
		// If an incomplete registration already exists we'll use that. If, however, a
		// completed user exists with this email, we throw an error.
		userId = await checkForExistingUser(connection, email);

		// If that email isn't in use at all, than we generate a new user record
		if (! userId) {
			const created = await db.runQuery(connection, createUser, { email, userCode });

			userId = created.insertId as string;
		}

		await db.runQuery(connection, createEmailCredential, { userId, requestId, keyDigest });

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

	// TODO: Send email (Probably involves placing a message on a queue)

	return { email, requestId, verificationKey };
};

const checkForExistingUser = async (connection: PoolConnection, email: string) => {
	const result = await db.runQuery(connection, lookupEmail, { email });
	const foundUser = result.results[0];

	if (foundUser) {
		if (foundUser.email_verified) {
			throw new HttpError(409, 'Email address already in use', {
				code: ErrorCodes.EmailAlreadyInUse
			});
		}

		return foundUser.id;
	}
};
