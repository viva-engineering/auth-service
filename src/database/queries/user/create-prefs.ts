
import { format } from 'mysql2';
import { PreparedWriteQuery } from '@viva-eng/database';

export interface CreateUserPrefsParams {
	userId: string;
}

export const createUserPrefs = new PreparedWriteQuery<CreateUserPrefsParams>({
	description: 'insert into user_preferences ...',
	prepared: `
		insert into user_preferences
			(user_id)
		values
			(?)
	`,

	prepareParams(params: CreateUserPrefsParams) {
		return [ params.userId ]
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});

