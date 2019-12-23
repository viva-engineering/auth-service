
import { Bit } from '../../index';
import { PreparedSelectQuery } from '@viva-eng/database';
import { UserRole, CredentialType, credentialTypes } from '../../../reference-data';

export interface IntrospectSessionParams {
	token: string;
}

export interface IntrospectSessionRecord {
	user_id: string;
	username: string;
	user_code: string;
	email: string;
	email_verified: Bit
	preferred_language: string;
	is_expired: Bit;
	application_id: string;
	user_role: UserRole;
	password_expired: Bit;
}

export const introspectSession = new PreparedSelectQuery<IntrospectSessionParams, IntrospectSessionRecord>({
	description: 'select ... from session, user, credential where id = ?',
	prepared: `
		select
			user.id as user_id,
			user.username as username,
			user.email as email,
			user.email_verified as email_verified,
			user.user_code as user_code,
			user.preferred_language as preferred_language,
			sess.expiration_timestamp < now() as is_expired,
			sess.application_id as application_id,
			role.description as user_role,
			cred.expiration_timestamp < now() as password_expired
		from session sess
		left outer join user user
			on user.id = sess.user_id
		left outer join user_role role
			on role.id = user.user_role_id
		left outer join credential cred
			on cred.user_id = user.id
			and cred.credential_type_id = ?
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
