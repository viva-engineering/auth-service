
import { format } from 'mysql2';
import { WriteQuery } from '@viva-eng/database';

export interface IncreaseFailuresParams {
	credentialId: string;
}

const queryTemplate = `
	update credential
	set recent_failures = recent_failures + 1
	where id = ?
`;

export const increaseFailures = new WriteQuery<IncreaseFailuresParams>({
	description: 'update credential set recent_failures = recent_failures + 1 where id = ?',

	maxRetries: 2,

	isRetryable() {
		return false;
	},

	compile(params: IncreaseFailuresParams) {
		return format(queryTemplate, [ params.credentialId ]);
	}
});

