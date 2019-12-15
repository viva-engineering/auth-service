
import { format } from 'mysql';
import { WriteQuery } from '@viva-eng/database';

export interface MarkCompromisedParams {
	credentialId: string;
}

const queryTemplate = `
	update credential
	set compromised = 1
	where id = ?
`;

export const markCompromised = new WriteQuery<MarkCompromisedParams>({
	description: 'update credential set compromised = 1 where id = ?',

	maxRetries: 2,

	isRetryable() {
		return false;
	},

	compile(params: MarkCompromisedParams) {
		return format(queryTemplate, [ params.credentialId ]);
	}
});
