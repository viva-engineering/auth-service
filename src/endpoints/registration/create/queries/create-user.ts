
import { format } from 'mysql';
import { WriteQuery } from '@viva-eng/database';

export interface CreateUserParams {
	email: string;
	userCode: string;
}

const queryTemplate = `
	insert into user
		(email, user_code)
	values
		(?, ?)
`;

export const createUser = new WriteQuery<CreateUserParams>({
	description: 'insert into user ...',

	maxRetries: 2,

	isRetryable() {
		return false;
	},

	compile(params: CreateUserParams) {
		return format(queryTemplate, [ params.email, params.userCode ]);
	}
});

