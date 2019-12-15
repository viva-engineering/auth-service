
import { format } from 'mysql';
import { WriteQuery } from '@viva-eng/database';
import { CredentialType, credentialTypes } from '../../../../reference-data';

export interface CreateEmailCredentialParams {
	userId: string;
	requestId: string;
	keyDigest: string;
}

const queryTemplate = `
	insert into credential
		(user_id, credential_type_id, request_id, key_digest, expiration_timestamp)
	values
		(?, ?, ?, ?, date_add(now(), interval 30 minute))
`;

export const createEmailCredential = new WriteQuery<CreateEmailCredentialParams>({
	description: 'insert into credential ...',

	maxRetries: 2,

	isRetryable() {
		return false;
	},

	async compile(params: CreateEmailCredentialParams) {
		await credentialTypes.loaded;

		return format(queryTemplate, [
			params.userId,
			credentialTypes.byDescription[CredentialType.Email],
			params.requestId,
			params.keyDigest
		]);
	}
});
