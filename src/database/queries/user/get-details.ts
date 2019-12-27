
import { PreparedSelectQuery } from '@viva-eng/database';
import { UserRole, CredentialType, credentialTypes } from '../../../reference-data';

export interface GetUserDetailsParams {
	userId: string;
}

export interface GetUserDetailsRecord {
	user_id: string;
	username: string;
	user_code: string;
	display_name: string;
	email: string;
	email_verified: 0 | 1
	preferred_language: string;
	user_role: UserRole;
	password_ttl: string;
	app_cred_ttl?: string;
}

/**
 * Query that loads basic user details to be included as part of the session details
 * TODO: Do we want to cache these results? This will be hit a lot (at least once per authenticated operation)
 *
 *     select
 *       user.id as user_id,
 *       user.username as username,
 *       user.display_name as display_name,
 *       user.email as email,
 *       user.email_verified as email_verified,
 *       user.user_code as user_code,
 *       user.preferred_language as preferred_language,
 *       role.description as user_role,
 *       timestampdiff(second, now(), cred.expiration_timestamp) password_ttl,
 *       timestampdiff(second, now(), app_cred.expiration_timestamp) app_cred_tll
 *     from user user
 *     left outer join user_role role
 *       on role.id = user.user_role_id
 *     left outer join credential cred
 *       on cred.user_id = user.id
 *     and cred.credential_type_id = ?
 *     left outer join credential app_cred
 *       on app_cred.application_id = sess.application_id
 *       and app_cred.user_id = user.id
 *     where user.id = ?
 */
export const getUserDetails = new PreparedSelectQuery<GetUserDetailsParams, GetUserDetailsRecord>({
	description: 'select ... from session, user, credential where id = ?',
	prepared: `
		select
			user.id as user_id,
			user.username as username,
			user.display_name as display_name,
			user.email as email,
			user.email_verified as email_verified,
			user.user_code as user_code,
			user.preferred_language as preferred_language,
			role.description as user_role,
			timestampdiff(second, now(), cred.expiration_timestamp) password_ttl,
			timestampdiff(second, now(), app_cred.expiration_timestamp) app_cred_tll
		from user user
		left outer join user_role role
			on role.id = user.user_role_id
		left outer join credential cred
			on cred.user_id = user.id
			and cred.credential_type_id = ?
		left outer join credential app_cred
			on app_cred.application_id = sess.application_id
			and app_cred.user_id = user.id
		where user.id = ?
	`,

	async prepareParams(params: GetUserDetailsParams) {
		return [
			credentialTypes.byDescription[CredentialType.Password],
			params.userId
		];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
