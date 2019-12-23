
import { db } from '../../../database';
import { PoolConnection } from 'mysql2';
import { TransactionType } from '@viva-eng/database';
import { HttpError } from '@celeri/http-error';
import { deleteSession } from '../../../database/queries/session/destroy';
import { logger } from '../../../logger';

enum ErrorCodes {
	UnexpectedError = 'UNEXPECTED_ERROR'
}

export const deleteUserSession = async (token: string) => {
	try {
		await db.query(deleteSession, { token });
	}

	catch (error) {
		logger.warn('Unexpected error while deleting session', { error });

		throw new HttpError(500, 'Unexpected Error', {
			code: ErrorCodes.UnexpectedError
		});
	}
};
