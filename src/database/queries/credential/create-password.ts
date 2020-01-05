
import { format } from 'mysql2';
import { PreparedWriteQuery } from '@viva-eng/database';
import { config } from '../../../config';

export interface CreateCredentialParams {
	userId: string;
	digest: string;
}

export const createCredential = new PreparedWriteQuery<CreateCredentialParams>({
	description: 'insert into credential ...',
	prepared: `
		insert into credential
			(user_id, key_digest, expiration_timestamp)
		values
			(?, ?, date_add(now(), interval ${config.ttls.password} day))
	`,

	prepareParams(params: CreateCredentialParams) {
		return [
			params.userId,
			params.digest
		];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
