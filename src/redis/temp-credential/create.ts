
import { tempCredentialPool } from './pool';
import { config } from '../../config';
import { UserRole } from '../../reference-data';
import { TempCredentialRecord } from './types';

const ttl = config.ttls.tempCredential;

export const createTempCredential = async (credential: TempCredentialRecord) => {
	const hmset = [
		'hmset', credential.requestId,
		'digest', credential.secretKeyDigest,
		'user_id', credential.userId,
		'verifies_email', credential.verifiesEmail || '',
		'verifies_phone', credential.verifiesPhone || '',
		'attempts', 0
	];

	const expire = [ 'expire', credential.requestId, ttl ];

	await tempCredentialPool.multi([ hmset, expire ]);

	return ttl;
};
