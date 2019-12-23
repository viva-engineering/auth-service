
import { db } from '../../../database';
import { logger } from '../../../logger';
import { hash } from '../../../utils/hasher';
import { createApplication } from '../../../database/queries/application/create';
import { generateApplicationId, generateApplicationSecretKey } from '../../../utils/random-keys';
import { TransactionType } from '@viva-eng/database';
import { HttpError } from '@celeri/http-error';

enum ErrorCodes {
	UnexpectedError = 'UNEXPECTED_ERROR'
}

export const createApplicationRecord = async (name: string, userId: string) => {
	try {
		const [ applicationId, secretKey ] = await Promise.all([
			generateApplicationId(),
			generateApplicationSecretKey()
		]);

		const digest = await hash(secretKey);

		await db.query(createApplication, {
			id: applicationId,
			name: name,
			digest: digest,
			ownerId: userId
		});

		return {
			applicationId,
			secretKey
		};
	}

	catch (error) {
		if (error instanceof HttpError) {
			throw error;
		}

		logger.warn('Unexpected error while creating application', { error });

		throw new HttpError(500, 'Unexpected error', {
			code: ErrorCodes.UnexpectedError
		});
	}
};
