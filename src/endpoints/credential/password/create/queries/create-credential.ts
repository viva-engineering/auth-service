
import { format } from 'mysql2';
import { WriteQuery } from '@viva-eng/database';
import { CredentialType, credentialTypes } from '../../../../../reference-data';
import { config } from '../../../../../config';

export interface CreateCredentialParams {
	userId: string;
	keyDigest: string;
}

const queryTemplate = `
	insert into credential
		(user_id, credential_type_id, key_digest, expiration_timestamp)
	values
		(?, ?, ?, date_add(now(), interval ${config.password.ttl} day))
`;

export const createCredential = new WriteQuery<CreateCredentialParams>({
	description: 'insert into credential ...',

	maxRetries: 2,

	isRetryable() {
		return false;
	},

	async compile(params: CreateCredentialParams) {
		await credentialTypes.loaded;

		return format(queryTemplate, [
			params.userId,
			credentialTypes.byDescription[CredentialType.Password],
			params.keyDigest
		]);
	}
});
