
import { sessionPool } from './pool';
import { Session, StoredSession } from './types';

export const introspectSession = async (token: string) : Promise<Session> => {
	const results = await sessionPool.batch([
		[ 'hgetall', token ],
		[ 'ttl', token ]
	]);

	if (results[0] && results[1]) {
		const raw: StoredSession = results[0];

		return {
			token: raw.token,
			userId: raw.user_id,
			isElevated: raw.is_elevated === '1',
			applicationId: raw.application_id || null,
			userRole: raw.user_role,
			ttl: parseInt(results[1], 10)
		};
	}
};
