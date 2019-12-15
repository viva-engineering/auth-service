
import { db } from '../../../../database';
import { logger } from '../../../../logger';
import { hash } from '../../../../utils/hasher';
import { AuthenticatedUser } from '../../../../middlewares/authenticate';
import { HttpError } from '@celeri/http-error';
import { TransactionType } from '@viva-eng/database';
import { createCredential } from './queries/create-credential';

enum ErrorCodes {
	PasswordExists = 'PASSWORD_ALREADY_EXISTS',
	UnexpectedError = 'UNEXPECTED_ERROR'
}

export const createPasswordCredential = async (user: AuthenticatedUser, password: string) => {
	if (user.hasPassword) {
		throw new HttpError(409, 'Password already exists for account', {
			code: ErrorCodes.PasswordExists
		});
	}

	const digest = await hash(password);

	try {
		await db.query(createCredential, {
			userId: user.userId,
			keyDigest: digest
		});
	}

	catch (error) {
		if (error instanceof HttpError) {
			throw error;
		}

		logger.warn('Unexpected error while creating password credential', { error });

		throw new HttpError(500, 'Unexpected error', {
			code: ErrorCodes.UnexpectedError
		});
	}
};
