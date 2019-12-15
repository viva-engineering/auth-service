
import { format } from 'mysql2';
import { Bit } from '../../../../../database';
import { SelectQuery } from '@viva-eng/database';
import { CredentialType, credentialTypes } from '../../../../../reference-data';

export interface GetCredentialParams {
	requestId: string;
}

export interface GetCredentialRecord {
	id: string;
	user_id: string;
	request_id: string;
	key_digest: string;
	is_expired: Bit;
	recent_failures: number;
	compromised: Bit;
}

const queryTemplate = `
	select
		cred.id as id,
		cred.user_id as user_id,
		cred.request_id as request_id,
		cred.key_digest as key_digest,
		cred.expiration_timestamp < now() as is_expired,
		cred.recent_failures as recent_failures,
		cred.compromised as compromised
	from credential cred
	where cred.credential_type_id = ?
		and cred.request_id = ?
`;

export const getCredential = new SelectQuery<GetCredentialParams, GetCredentialRecord>({
	description: 'select ... from credential, credential_type where credential_type = "email" and request_id = ?',

	maxRetries: 2,

	isRetryable() {
		return false;
	},

	async compile(params: GetCredentialParams) {
		await credentialTypes.loaded;

		return format(queryTemplate, [
			credentialTypes.byDescription[CredentialType.Email],
			params.requestId
		]);
	}
});
