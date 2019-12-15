
import { format } from 'mysql';
import { db, Bit } from '../../../../../database';
import { SelectQuery } from '@viva-eng/database';
import { CredentialType, credentialTypes } from '../../../../../reference-data';

export interface GetPasswordCredentialsParams {
	email: string;
}

export interface GetPasswordCredentialsRecord {
	user_id: string;
	user_email: string;
	cred_id: string;
	cred_digest: string;
	cred_compromised: Bit;
	recent_failures: number;
	cred_expired: Bit;
}

const queryTemplate = `
	select
		user.id as user_id,
		user.email as user_email,
		cred.id as cred_id,
		cred.key_digest as cred_digest,
		cred.compromised as cred_compromised,
		cred.recent_failures as recent_failures,
		cred.expiration_timestamp < now() as cred_expired
	from user user
	left outer join credential cred
		on cred.user_id = user.id
	where user.email = ?
		and cred.credential_type_id = ?
`;

export const getPasswordCredentials = new SelectQuery<GetPasswordCredentialsParams, GetPasswordCredentialsRecord>({
	description: 'select ... from user, credential, credential_type where email = ?',

	maxRetries: 2,

	isRetryable() {
		return false;
	},

	async compile(params: GetPasswordCredentialsParams) {
		await credentialTypes.loaded;

		return format(queryTemplate, [
			params.email,
			credentialTypes.byDescription[CredentialType.Password]
		]);
	}
});
