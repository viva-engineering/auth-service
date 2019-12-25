
import { hash, verify } from './hasher';
import { generateCredentialRequestId, generateVerificationKey } from './random-keys';

export const createTempCredential = async () => {
	const [ requestId, verificationKey ] = await Promise.all([
		generateCredentialRequestId(),
		generateVerificationKey()
	]);

	const digest = await hash(`${requestId}${verificationKey}`);

	return {
		requestId,
		verificationKey,
		digest
	};
};

export const verifyTempCredential = (requestId: string, verificationKey: string, digest: string) => {
	return verify(digest, `${requestId}${verificationKey}`);
};
