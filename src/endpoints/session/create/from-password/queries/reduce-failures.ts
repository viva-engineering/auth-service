
import { format } from 'mysql2';
import { WriteQuery } from '@viva-eng/database';

export interface ReduceFailuresParams {
	credentialId: string;
}

const queryTemplate = `
	update credential
	set recent_failures = floor(recent_failures / 2)
	where id = ?
`;

export const reduceFailures = new WriteQuery<ReduceFailuresParams>({
	description: 'update credential set recent_failures = floor(recent_failures / 2) where id = ?',

	maxRetries: 2,

	isRetryable() {
		return false;
	},

	compile(params: ReduceFailuresParams) {
		return format(queryTemplate, [ params.credentialId ]);
	}
});
