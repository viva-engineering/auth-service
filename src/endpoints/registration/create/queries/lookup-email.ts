
import { format } from 'mysql';
import { Bit } from '../../../../database';
import { SelectQuery } from '@viva-eng/database';

export interface LookupEmailParams {
	email: string;
}

export interface LookupEmailRecord {
	id: string;
	email: string;
	email_verified: Bit;
}

const queryTemplate = `
	select
		user.id as id,
		user.email as email,
		user.email_verified as email_verified
	from user user
	where user.email = ?
`;

export const lookupEmail = new SelectQuery<LookupEmailParams, LookupEmailRecord>({
	description: 'select ... from user where email = ?',

	maxRetries: 2,

	isRetryable() {
		return false;
	},

	compile(params: LookupEmailParams) {
		return format(queryTemplate, [ params.email ]);
	}
});
