
import { format } from 'mysql2';
import { db, Bit } from '../../../../../database';
import { PreparedSelectQuery } from '@viva-eng/database';
import { CredentialType, credentialTypes } from '../../../../../reference-data';

export interface GetPasswordCredentialsParams {
	username: string;
}

export interface GetPasswordCredentialsRecord {
	user_id: string;
	username: string;
	user_email: string;
	cred_id: string;
	cred_digest: string;
	cred_compromised: Bit;
	recent_failures: number;
	cred_expired: Bit;
}

export const getPasswordCredentials = new PreparedSelectQuery<GetPasswordCredentialsParams, GetPasswordCredentialsRecord>({
	description: 'select ... from user, credential, credential_type where username = ?',
	prepared: `
		select
			user.id as user_id,
			user.username as username,
			user.email as user_email,
			cred.id as cred_id,
			cred.key_digest as cred_digest,
			cred.compromised as cred_compromised,
			cred.recent_failures as recent_failures,
			cred.expiration_timestamp < now() as cred_expired
		from user user
		left outer join credential cred
			on cred.user_id = user.id
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
