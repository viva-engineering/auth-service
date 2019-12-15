
import { format } from 'mysql2';
import { PreparedWriteQuery } from '@viva-eng/database';
import { CredentialType, credentialTypes } from '../../../../reference-data';

export interface CreateEmailCredentialParams {
	userId: string;
	requestId: string;
	keyDigest: string;
}

export const createEmailCredential = new PreparedWriteQuery<CreateEmailCredentialParams>({
	description: 'insert into credential ...',
	prepared: `
		insert into credential
			(user_id, credential_type_id, request_id, key_digest, expiration_timestamp)
		values
			(?, ?, ?, ?, date_add(now(), interval 30 minute))
	`,

	async prepareParams(params: CreateEmailCredentialParams) {
		return [
			params.userId,
			credentialTypes.byDescription[CredentialType.Email],
			params.requestId,
			params.keyDigest
		];
	},

	maxRetries: 2,

	isRetryable() {
		return false;
	}
});
