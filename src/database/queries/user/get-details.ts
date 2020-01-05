
import { UserRole } from '../../../reference-data';
import { PreparedSelectQuery } from '@viva-eng/database';

export interface GetUserDetailsParams {
	userId: string;
}

export interface GetUserDetailsRecord {
	user_id: string;
	username: string;
	user_code: string;
	display_name: string;
	email: string;
	preferred_language: string;
	user_role: UserRole;
	password_ttl: string;
	app_cred_ttl?: string;
}

export const getUserDetails = new PreparedSelectQuery<GetUserDetailsParams, GetUserDetailsRecord>({
	description: 'select ... from session, user, credential where id = ?',
	prepared: `
		select
			user.id as user_id,
			user.username as username,
			pref.display_name as display_name,
			user.email as email,
			user.user_code as user_code,
			pref.preferred_language as preferred_language,
			role.description as user_role,
			timestampdiff(second, now(), cred.expiration_timestamp) password_ttl,
			timestampdiff(second, now(), app_cred.expiration_timestamp) app_cred_tll
		from user user
		left outer join user_preferences pref
			on pref.user_id = user.id
		left outer join user_role role
			on role.id = user.user_role_id
		left outer join credential cred
			on cred.user_id = user.id
		left outer join credential app_cred
			on app_cred.application_id = sess.application_id
			and app_cred.user_id = user.id
		where user.id = ?
	`,

	prepareParams(params: GetUserDetailsParams) {
		return [
			params.userId
		];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
