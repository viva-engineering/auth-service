
import { format } from 'mysql2';
import { PreparedWriteQuery } from '@viva-eng/database';

export interface RecordFailureParams {
	credentialId: string;
}

export const recordFailure = new PreparedWriteQuery<RecordFailureParams>({
	description: 'update credential set recent_failures = recent_failures + 1 where id = ?',
	prepared: `
		update credential
		set recent_failures = recent_failures + 1
		where id = ?
	`,

	prepareParams(params: RecordFailureParams) {
		return [ params.credentialId ];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
