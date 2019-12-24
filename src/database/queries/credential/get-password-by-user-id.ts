
import { format } from 'mysql2';
import { db, Bit } from '../../index';
import { PreparedSelectQuery } from '@viva-eng/database';
import { CredentialType, credentialTypes } from '../../../reference-data';

export interface GetPasswordCredentialsParams {
	userId: string;
}

export interface GetPasswordCredentialsRecord {
	cred_id: string;
	cred_digest: string;
	cred_compromised: Bit;
	recent_failures: number;
	cred_expired: Bit;
}

/**
 * Query that fetches the necessary user / credential information to validate a password credential
 *
 *     select
 *       cred.id as cred_id,
 *       cred.key_digest as cred_digest,
 *       cred.compromised as cred_compromised,
 *       cred.recent_failures as recent_failues,
 *       cred.expiration_timestamp < now() as cred_expired
 *     from credential cred
 *     where cred.user_id = ?
 *       and cred.credential_type_id = ?
 */
export const getPasswordCredentials = new PreparedSelectQuery<GetPasswordCredentialsParams, GetPasswordCredentialsRecord>({
	description: 'select ... from credential where user_id = ?',
	prepared: `
		select
			cred.id as cred_id,
			cred.key_digest as cred_digest,
			cred.compromised as cred_compromised,
			cred.recent_failures as recent_failures,
			cred.expiration_timestamp < now() as cred_expired
		from user user
		left outer join credential cred
			on cred.user_id = user.id
		where user.id = ?
			and cred.credential_type_id = ?
	`,

	async prepareParams(params: GetPasswordCredentialsParams) {
		await credentialTypes.loaded;

		return [
			params.userId,
			credentialTypes.byDescription[CredentialType.Password]
		];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});