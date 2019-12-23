
import { format } from 'mysql2';
import { Bit } from '../../index';
import { PreparedSelectQuery } from '@viva-eng/database';

export interface LookupUsernameParams {
	username: string;
}

export interface LookupUsernameRecord {
	id: string;
	username: string;
}

export const lookupUsername = new PreparedSelectQuery<LookupUsernameParams, LookupUsernameRecord>({
	description: 'select ... from user where username = ?',
	prepared: `
		select
			user.id as id,
			user.username as username
		from user user
		where user.username = ?
	`,

	prepareParams(params: LookupUsernameParams) {
		return [ params.username ];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
