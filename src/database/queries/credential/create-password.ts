
import { format } from 'mysql2';
import { PreparedWriteQuery } from '@viva-eng/database';
import { CredentialType, credentialTypes } from '../../../reference-data';
import { config } from '../../../config';

export interface CreateCredentialParams {
	userId: string;
	digest: string;
}

/**
 * Query that creates a new password credential record in the database
 *
 *     insert into credential
 *       (user_id, credential_type_id, key_digest, expiration_timestamp)
 *     values
 *       (?, ?, ?, date_add(now(), interval ? day))
 */
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
			params.digest
		];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
