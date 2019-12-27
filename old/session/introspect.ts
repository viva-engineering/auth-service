
import { PreparedSelectQuery } from '@viva-eng/database';
import { UserRole, CredentialType, credentialTypes } from '../../../reference-data';

export interface IntrospectSessionParams {
	token: string;
}

export interface IntrospectSessionRecord {
	user_id: string;
	username: string;
	user_code: string;
	display_name: string;
	email: string;
	email_verified: 0 | 1
	preferred_language: string;
	is_elevated: 0 | 1;
	session_ttl: string;
	application_id: string;
	user_role: UserRole;
	password_ttl: string;
	app_cred_ttl?: string;
}

/**
 * Query that loads all the relavent user / session information for a given active session
 *
 *     select
 *       user.id as user_id,
 *       user.username as username,
 *       user.display_name as display_name,
 *       user.email as email,
 *       user.email_verified as email_verified,
 *       user.user_code as user_code,
 *       user.preferred_language as preferred_language,
 *       sess.is_elevated as is_elevated,
 *       timestampdiff(second, sess.expiration_timestamp, now()) as session_ttl,
 *       sess.application_id as application_id,
 *       role.description as user_role,
 *       timestampdiff(second, cred.expiration_timestamp, now()) password_ttl,
 *       timestampdiff(second, app_cred.expiration_timestamp, now()) app_cred_tll
 *     from session sess
 *     left outer join user user
 *       on user.id = sess.user_id
 *     left outer join user_role role
 *       on role.id = user.user_role_id
 *     left outer join credential cred
 *       on cred.user_id = user.id
 *       and cred.credential_type_id = ?
 *     where sess.id = ?
 */
export const introspectSession = new PreparedSelectQuery<IntrospectSessionParams, IntrospectSessionRecord>({
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
			sess.is_elevated as is_elevated,
			timestampdiff(second, now(), sess.expiration_timestamp) as session_ttl,
			sess.application_id as application_id,
			role.description as user_role,
			timestampdiff(second, now(), cred.expiration_timestamp) password_ttl,
			timestampdiff(second, now(), app_cred.expiration_timestamp) app_cred_tll
		from session sess
		left outer join user user
			on user.id = sess.user_id
		left outer join user_role role
			on role.id = user.user_role_id
		left outer join credential cred
			on cred.user_id = user.id
			and cred.credential_type_id = ?
		left outer join credential app_cred
			on app_cred.application_id = sess.application_id
			and app_cred.user_id = user.id
		where sess.id = ?
	`,

	async prepareParams(params: IntrospectSessionParams) {
		return [
			credentialTypes.byDescription[CredentialType.Password],
			params.token
		];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
