
import { sessionPool } from './pool';
import { config } from '../../config';
import { Session, StoredSession } from './types';
import { UserRole } from '../../reference-data';

const normalTTL = config.session.ttl;
const elevatedTTL = config.session.ttlElevated;

export const createSession = async (token: string, userId: string, userRole: UserRole, applicationId: string = '') => {
	await sessionPool.multi([
		[ 'hmset', token, 'token', token, 'user_id', userId, 'application_id', applicationId, 'user_role', userRole, 'is_elevated', '0' ],
		[ 'expire', token, normalTTL ]
	])
};

export const createElevatedSession = async (token: string, userId: string, userRole: UserRole, applicationId: string = '') => {
	await sessionPool.multi([
		[ 'hmset', token, 'token', token, 'user_id', userId, 'application_id', applicationId, 'user_role', userRole, 'is_elevated', '1' ],
		[ 'expire', token, elevatedTTL ]
	])
};
