
import { format } from 'mysql';
import { WriteQuery } from '@viva-eng/database';

export interface DeleteCredentialParams {
	credentialId: string;
}

const queryTemplate = `
	delete credential
	from credential
	where id = ?
`;

export const deleteCredential = new WriteQuery<DeleteCredentialParams>({
	description: 'delete credential from credential where id = ?',

	maxRetries: 2,

	isRetryable() {
		return false;
	},

	compile(params: DeleteCredentialParams) {
		return format(queryTemplate, [ params.credentialId ]);
	}
});

