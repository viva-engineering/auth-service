
import { format } from 'mysql2';
import { db } from '../../index';
import { PreparedSelectQuery } from '@viva-eng/database';
import { CredentialType, credentialTypes, UserRole } from '../../../reference-data';

export interface GetPasswordCredentialsParams {
	username: string;
}

export interface GetPasswordCredentialsRecord {
	user_id: string;
	username: string;
	cred_id: string;
	cred_digest: string;
	cred_compromised: 0 | 1;
	recent_failures: number;
	cred_ttl: string;
	user_role: UserRole;
}

/**
 * Query that fetches the necessary user / credential information to validate a password credential
 *
 *     select
 *       user.id as user_id,
 *       user.username as username,
 *       cred.id as cred_id,
 *       cred.key_digest as cred_digest,
 *       cred.compromised as cred_compromised,
 *       cred.recent_failures as recent_failues,
 *       timestampdiff(second, now(), cred.expiration_timestamp) as cred_ttl,
 *       role.description as user_role
 *     from user user
 *     left outer join credential cred
 *       on cred.user_id = user.id
 *     left outer join user_role role
 *       on role.id = user.user_role_id
 *     where user.username = ?
 *       and cred.credential_type_id = ?
 */
export const getPasswordCredentials = new PreparedSelectQuery<GetPasswordCredentialsParams, GetPasswordCredentialsRecord>({
	description: 'select ... from user, credential where username = ?',
	prepared: `
		select
			user.id as user_id,
			user.username as username,
			cred.id as cred_id,
			cred.key_digest as cred_digest,
			cred.compromised as cred_compromised,
			cred.recent_failures as recent_failures,
			timestampdiff(second, now(), cred.expiration_timestamp) as cred_ttl,
			role.description as user_role
		from user user
		left outer join credential cred
			on cred.user_id = user.id
		left outer join user_role role
			on role.id = user.user_role_id
		where user.username = ?
			and cred.credential_type_id = ?
	`,

	async prepareParams(params: GetPasswordCredentialsParams) {
		await credentialTypes.loaded;

		return [
			params.username,
			credentialTypes.byDescription[CredentialType.Password]
		];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
