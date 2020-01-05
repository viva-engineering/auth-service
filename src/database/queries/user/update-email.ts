
import { format } from 'mysql2';
import { PreparedWriteQuery } from '@viva-eng/database';
import { config } from '../../../config';

export interface UpdateEmailParams {
	userId: string;
	email: string;
}

export const updateEmail = new PreparedWriteQuery<UpdateEmailParams>({
	description: 'update user set email = ? where id = ?',
	prepared: `
		update user
		set email = ?
		where id = ?
	`,

	prepareParams(params: UpdateEmailParams) {
		return [ params.email, params.userId ];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
