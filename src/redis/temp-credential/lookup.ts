
import { tempCredentialPool } from './pool';
import { TempCredentialRecord } from './types';
import { destroyTempCredential } from './destroy';

export const lookupTempCredential = async (requestId: string) => {
	const results = await tempCredentialPool.multi([
		[ 'hincrby', requestId, 'attempts', 1 ],
		[ 'hgetall', requestId ]
	]);

	const raw = results[1];

	if (! raw || ! raw.user_id || ! raw.digest || parseInt(raw.attempts) > 3) {
		return destroyTempCredential(requestId);
	}

	const credential: TempCredentialRecord = {
		requestId,
		secretKeyDigest: raw.digest,
		userId: raw.user_id,
		verifiesEmail: raw.verifies_email,
		verifiesPhone: raw.verifies_phone
	};

	return credential;
};

