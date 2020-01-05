
import { db } from '../../../../database';
import { logger } from '../../../../logger';
import { createSession } from '../../../../redis/session';
import { AuthenticatedUser } from '../../../../middlewares/authenticate';
import { generateSessionKey } from '../../../../utils/random-keys';
import { HttpError } from '@celeri/http-error';

enum ErrorCodes {
	UnexpectedError = 'UNEXPECTED_ERROR'
}

export const authenticateWithSession = async (user: AuthenticatedUser) => {
	try {
		const token = await generateSessionKey();
		const ttl = await createSession(token, user.userId, user.userRole, user.applicationId || '');

		return { token, ttl };
	}

	catch (error) {
		if (error instanceof HttpError) {
			throw error;
		}

		logger.warn('Unexpected error while processing authentication', { error });

		throw new HttpError(500, 'Unexpected error', {
			code: ErrorCodes.UnexpectedError
		});
	}
};
