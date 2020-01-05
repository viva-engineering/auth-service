
import { format } from 'mysql2';
import { PreparedWriteQuery } from '@viva-eng/database';

export interface MarkCompromisedParams {
	credentialId: string;
}

export const markCompromised = new PreparedWriteQuery<MarkCompromisedParams>({
	description: 'update credential set compromised = 1 where id = ?',
	prepared: `
		update credential
		set compromised = 1
		where id = ?
	`,

	prepareParams(params: MarkCompromisedParams) {
		return [ params.credentialId ];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
