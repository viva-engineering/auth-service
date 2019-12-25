
import { format } from 'mysql2';
import { PreparedWriteQuery } from '@viva-eng/database';
import { config } from '../../../config';

export interface VerifyEmailParams {
	userId: string;
	email: string;
}

/**
 * Query that updates a user record to have a new email value and the email
 * verified flag set
 *
 *     update user
 *     set email = ?,
 *       email_verified = 1
 *     where id = ?
 */
export const verifyEmail = new PreparedWriteQuery<VerifyEmailParams>({
	description: 'update user set email = ?, email_verified = 1 where id = ?',
	prepared: `
		update user
		set email = ?,
			email_verified = 1
		where id = ?
	`,

	prepareParams(params: VerifyEmailParams) {
		return [ params.email, params.userId ];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
