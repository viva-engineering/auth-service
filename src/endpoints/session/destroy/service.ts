
import { HttpError } from '@celeri/http-error';
import { destroySession } from '../../../redis/session';
import { logger } from '../../../logger';

enum ErrorCodes {
	UnexpectedError = 'UNEXPECTED_ERROR'
}

export const deleteUserSession = async (token: string) => {
	try {
		await destroySession(token);
	}

	catch (error) {
		logger.warn('Unexpected error while deleting session', { error });

		throw new HttpError(500, 'Unexpected Error', {
			code: ErrorCodes.UnexpectedError
		});
	}
};
