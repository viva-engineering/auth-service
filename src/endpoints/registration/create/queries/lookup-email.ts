
import { format } from 'mysql2';
import { Bit } from '../../../../database';
import { PreparedSelectQuery } from '@viva-eng/database';

export interface LookupEmailParams {
	email: string;
}

export interface LookupEmailRecord {
	id: string;
	email: string;
	email_verified: Bit;
}

export const lookupEmail = new PreparedSelectQuery<LookupEmailParams, LookupEmailRecord>({
	description: 'select ... from user where email = ?',
	prepared: `
		select
			user.id as id,
			user.email as email,
			user.email_verified as email_verified
		from user user
		where user.email = ?
	`,

	prepareParams(params: LookupEmailParams) {
		return [ params.email ];
	},

	maxRetries: 2,

	isRetryable() {
		return false;
	}
});
