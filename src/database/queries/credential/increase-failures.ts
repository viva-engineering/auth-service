
import { format } from 'mysql2';
import { PreparedWriteQuery } from '@viva-eng/database';

export interface IncreaseFailuresParams {
	credentialId: string;
}

export const increaseFailures = new PreparedWriteQuery<IncreaseFailuresParams>({
	description: 'update credential set recent_failures = recent_failures + 1 where id = ?',
	prepared: `
		update credential
		set recent_failures = recent_failures + 1
		where id = ?
	`,

	prepareParams(params: IncreaseFailuresParams) {
		return [ params.credentialId ];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
