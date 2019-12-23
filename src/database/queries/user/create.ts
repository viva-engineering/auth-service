
import { format } from 'mysql2';
import { PreparedWriteQuery } from '@viva-eng/database';

export interface CreateUserParams {
	username: string;
	userCode: string;
}

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

