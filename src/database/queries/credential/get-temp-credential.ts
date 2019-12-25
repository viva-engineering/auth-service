
import { format } from 'mysql2';
import { PreparedSelectQuery } from '@viva-eng/database';
import { CredentialType, credentialTypes } from '../../../reference-data';

export interface GetCredentialParams {
	requestId: string;
}

export interface GetCredentialRecord {
	cred_id: string;
	cred_digest: string;
	cred_request_id: string;
	cred_ttl: number;
	cred_compromised: 0 | 1;
	cred_recent_failures: number;
	user_id: string;
}

export const getTempCredential = new PreparedSelectQuery<GetCredentialParams, GetCredentialRecord>({
	description: 'select ... from credential, credential_type where credential_type = "email" and request_id = ?',
	prepared: `
		select
			cred.id as id,
			cred.key_digest as cred_digest,
			cred.request_id as cred_request_id,
			timestampdiff(second, cred.expiration_timestamp, now()) as cred_ttl,
			cred.compromised as cred_compromised,
			cred.recent_failures as cred_recent_failures,
			cred.user_id as user_id,
		from credential cred
		where cred.credential_type_id = ?
			and cred.request_id = ?
	`,

	async prepareParams(params: GetCredentialParams) {
		await credentialTypes.loaded;

		return [
			credentialTypes.byDescription[CredentialType.TempCredential],
			params.requestId
		];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
