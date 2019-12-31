
import { db } from '../../../../database';
import { PoolConnection } from 'mysql2';
import { TransactionType } from '@viva-eng/database';
import { readApplication } from '../../../../database/queries/application/read';
import { createCredential } from '../../../../database/queries/credential/create-application-credential';
import { HttpError } from '@celeri/http-error';
import { logger } from '../../../../logger';
import { hash } from '../../../../utils/hasher';
import { generateApplicationSecretKey } from '../../../../utils/random-keys';

enum ErrorCodes {
	AppNotFound = 'APPLICATION_NOT_FOUND',
	AppNotActive = 'APPLICATION_NOT_ACTIVE',
	UnexpectedError = 'UNEXPECTED_ERROR'
}

export const createApplicationCredential = async (userId: string, applicationId: string) => {
	try {
		const applicationRecords = await db.query(readApplication, { id: applicationId });

		if (! applicationRecords.results.length) {
			throw new HttpError(404, 'Application not found', {
				code: ErrorCodes.AppNotFound
			});
		}

		const application = applicationRecords.results[0];
		const applicationEnabled = application.active === '1' && application.approved === '1';

		if (! applicationEnabled && application.owner_user_id !== userId) {
			throw new HttpError(403, 'Application not active', {
				code: ErrorCodes.AppNotActive
			});
		}

		const secretKey = await generateApplicationSecretKey();
		const secretKeyDigest = await hash(secretKey);

		await db.query(createCredential, {
			userId,
			applicationId,
			digest: secretKeyDigest
		});

		return secretKey;
	}

	catch (error) {
		if (error instanceof HttpError) {
			throw error;
		}

		logger.error('Unexpected error while attempting to create an application credential', { error });

		throw new HttpError(500, 'Unexpected error', {
			code: ErrorCodes.UnexpectedError
		});
	}
};
