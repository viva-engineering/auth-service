
import { format } from 'mysql2';
import { PreparedWriteQuery } from '@viva-eng/database';

export interface DestroyCredentialParams {
	credentialId: string;
}

export const destroyCredential = new PreparedWriteQuery<DestroyCredentialParams>({
	description: 'delete credential from credential where id = ?',
	prepared: `
		delete credential
		from credential
		where id = ?
	`,

	prepareParams(params: DestroyCredentialParams) {
		return [ params.credentialId ];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
