
import { format } from 'mysql2';
import { PreparedWriteQuery } from '@viva-eng/database';
import { CredentialType, credentialTypes } from '../../../../../reference-data';
import { config } from '../../../../../config';

export interface CreateCredentialParams {
	userId: string;
	keyDigest: string;
}

export const createCredential = new PreparedWriteQuery<CreateCredentialParams>({
	description: 'insert into credential ...',
	prepared: `
		insert into credential
			(user_id, credential_type_id, key_digest, expiration_timestamp)
		values
			(?, ?, ?, date_add(now(), interval ${config.password.ttl} day))
	`,

	async prepareParams(params: CreateCredentialParams) {
		await credentialTypes.loaded;

		return [
			params.userId,
			credentialTypes.byDescription[CredentialType.Password],
			params.keyDigest
		];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
