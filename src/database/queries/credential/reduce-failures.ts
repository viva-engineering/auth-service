
import { format } from 'mysql2';
import { PreparedWriteQuery } from '@viva-eng/database';

export interface ReduceFailuresParams {
	credentialId: string;
}

export const reduceFailures = new PreparedWriteQuery<ReduceFailuresParams>({
	description: 'update credential set recent_failures = floor(recent_failures / 2) where id = ?',
	prepared: `
		update credential
		set recent_failures = floor(recent_failures / 2)
		where id = ?
	`,

	prepareParams(params: ReduceFailuresParams) {
		return [ params.credentialId ];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
