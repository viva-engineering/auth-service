
import { format } from 'mysql2';
import { PreparedWriteQuery } from '@viva-eng/database';

export interface CreateUserParams {
	email: string;
	userCode: string;
}

export const createUser = new PreparedWriteQuery<CreateUserParams>({
	description: 'insert into user ...',
	prepared: `
		insert into user
			(email, user_code)
		values
			(?, ?)
	`,

	prepareParams(params: CreateUserParams) {
		return [ params.email, params.userCode ]
	},

	maxRetries: 2,

	isRetryable() {
		return false;
	}
});

