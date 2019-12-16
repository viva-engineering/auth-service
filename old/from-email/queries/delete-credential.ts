
import { format } from 'mysql2';
import { PreparedWriteQuery } from '@viva-eng/database';

export interface DeleteCredentialParams {
	credentialId: string;
}

export const deleteCredential = new PreparedWriteQuery<DeleteCredentialParams>({
	description: 'delete credential from credential where id = ?',
	prepared: `
		delete credential
		from credential
		where id = ?
	`,

	prepareParams(params: DeleteCredentialParams) {
		return [ params.credentialId ];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
