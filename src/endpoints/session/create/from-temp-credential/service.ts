
import { db } from '../../../../database';
import { logger } from '../../../../logger';
import { generateSessionKey } from '../../../../utils/random-keys';
import { verifyTempCredential } from '../../../../utils/temp-credential';
import { createSession, createElevatedSession } from '../../../../redis/session';
import { updateEmail } from '../../../../database/queries/user/update-email';
import { updatePhone } from '../../../../database/queries/user/update-phone';
import { getUserDetails } from '../../../../database/queries/user/get-details';
import { lookupTempCredential } from '../../../../redis/temp-credential';
import { HttpError } from '@celeri/http-error';

enum ErrorCodes {
	InvalidCredentials = 'INVALID_CREDENTIALS',
	InvalidRequestId = 'INVALID_CREDENTIAL_REQUEST_ID',
	UnexpectedError = 'UNEXPECTED_ERROR'
}

export const authenticateWithTempCredential = async (requestId: string, verificationKey: string, elevated: boolean = false) => {
	const token = await generateSessionKey();

	try {
		const credential = await lookupTempCredential(requestId);

		if (! credential) {
			throw new HttpError(401, 'Invalid credential request ID', {
				code: ErrorCodes.InvalidRequestId
			});
		}

		const isValid = await verifyTempCredential(requestId, verificationKey, credential.secretKeyDigest);

		if (! isValid) {
			throw new HttpError(401, 'Invalid credentials', {
				code: ErrorCodes.InvalidCredentials
			});
		}

		if (credential.verifiesEmail) {
			await db.query(updateEmail, {
				userId: credential.userId,
				email: credential.verifiesEmail
			});
		}

		if (credential.verifiesPhone) {
			await db.query(updatePhone, {
				userId: credential.userId,
				phone: credential.verifiesPhone
			});
		}

		const user = await db.query(getUserDetails, { userId: credential.userId });
		const create = elevated ? createElevatedSession : createSession;
		const ttl = await create(token, credential.userId, user.results[0].user_role);

		return { token, ttl };
	}

	catch (error) {
		if (error instanceof HttpError) {
			throw error;
		}

		logger.warn('Unexpected error while attmpting to create a session from temp credentials', { error });

		throw new HttpError(500, 'Unexpected error', {
			code: ErrorCodes.UnexpectedError
		});
	}
};
