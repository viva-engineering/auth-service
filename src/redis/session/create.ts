
import { sessionPool } from './pool';
import { config } from '../../config';
import { UserRole } from '../../reference-data';

const normalTTL = config.ttls.session;
const elevatedTTL = config.ttls.elevatedSession;

export const createSession = async (token: string, userId: string, userRole: UserRole, applicationId: string = '') => {
	const hmset = [
		'hmset', token,
		'token', token,
		'user_id', userId,
		'application_id', applicationId,
		'user_role', userRole,
		'is_elevated', '0'
	];

	const expire = [ 'expire', token, normalTTL ];

	await sessionPool.multi([ hmset, expire ]);

	return normalTTL;
};

export const createElevatedSession = async (token: string, userId: string, userRole: UserRole, applicationId: string = '') => {
	const hmset = [
		'hmset', token,
		'token', token,
		'user_id', userId,
		'application_id', applicationId,
		'user_role', userRole,
		'is_elevated', '1'
	];

	const expire = [ 'expire', token, elevatedTTL ];

	await sessionPool.multi([ hmset, expire ]);

	return elevatedTTL;
};
