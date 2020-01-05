
import { logger } from '../../../logger';
import { createTempCredential } from '../../../redis/temp-credential';
import { createTempCredential as generate, sendTempCredentialEmail } from '../../../utils/temp-credential'
import { HttpError } from '@celeri/http-error';

export const updateUserEmail = async (userId: string, email: string) => {
	try {
		const cred = await generate();

		const ttl = await createTempCredential({
			userId,
			requestId: cred.requestId,
			secretKeyDigest: cred.digest,
			verifiesEmail: email
		});

		await sendTempCredentialEmail(email, cred.verificationKey);

		return { requestId: cred.requestId, ttl };
	}

	catch (error) {
		if (error instanceof HttpError) {
			throw error;
		}

		logger.error('Unexpected error occured while attempting to generate an email update request', { error });

		throw new HttpError(500, 'Unexpected error', {
			code: 'UNEXPECTED_ERROR'
		});
	}
};
