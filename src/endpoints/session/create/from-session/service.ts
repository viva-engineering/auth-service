
import { db } from '../../../../database';
import { logger } from '../../../../logger';
import { createSession } from '../queries/create-session';
import { AuthenticatedUser } from '../../../../middlewares/authenticate';
import { generateSessionKey } from '../../../../utils/random-keys';
import { HttpError } from '@celeri/http-error';

enum ErrorCodes {
	UnexpectedError = 'UNEXPECTED_ERROR'
}

export const authenticateWithSession = async (user: AuthenticatedUser) => {
	try {
		const token = await generateSessionKey();
		const result = await db.query(createSession, {
			id: token,
			userId: user.userId,
			applicationId: user.applicationId
		});

		return token;
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
