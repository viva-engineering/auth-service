
import { logger } from '../../../logger';
import { createTempCredential } from '../../../redis/temp-credential';
import { createTempCredential as generate, sendTempCredentialSMS } from '../../../utils/temp-credential'
import { HttpError } from '@celeri/http-error';

export const updateUserPhone = async (userId: string, phone: string) => {
	try {
		const cred = await generate();

		const ttl = await createTempCredential({
			userId,
			requestId: cred.requestId,
			secretKeyDigest: cred.digest,
			verifiesPhone: phone
		});

		await sendTempCredentialSMS(phone, cred.verificationKey);

		return { requestId: cred.requestId, ttl };
	}

	catch (error) {
		if (error instanceof HttpError) {
			throw error;
		}

		logger.error('Unexpected error occured while attempting to generate an SMS update request', { error });

		throw new HttpError(500, 'Unexpected error', {
			code: 'UNEXPECTED_ERROR'
		});
	}
};
