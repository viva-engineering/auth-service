
import { format } from 'mysql2';
import { PreparedWriteQuery } from '@viva-eng/database';

export interface CreateUserParams {
	username: string;
	userCode: string;
}

/**
 * Query that creates a new user record
 *
 *     insert into user
 *       (username, user_code)
 *     values
 *       (?, ?)
 */
export const createUser = new PreparedWriteQuery<CreateUserParams>({
	description: 'insert into user ...',
	prepared: `
		insert into user
			(username, user_code)
		values
			(?, ?)
	`,

	prepareParams(params: CreateUserParams) {
		return [ params.username, params.userCode ]
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});

