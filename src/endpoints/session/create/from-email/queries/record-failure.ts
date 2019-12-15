
import { format } from 'mysql2';
import { WriteQuery } from '@viva-eng/database';

export interface RecordFailureParams {
	credentialId: string;
}

const queryTemplate = `
	update credential
	set recent_failures = recent_failures + 1
	where id = ?
`;

export const recordFailure = new WriteQuery<RecordFailureParams>({
	description: 'update credential set recent_failures = recent_failures + 1 where id = ?',

	maxRetries: 2,

	isRetryable() {
		return false;
	},

	compile(params: RecordFailureParams) {
		return format(queryTemplate, [ params.credentialId ]);
	}
});

