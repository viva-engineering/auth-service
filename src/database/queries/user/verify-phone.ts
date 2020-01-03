
import { format } from 'mysql2';
import { PreparedWriteQuery } from '@viva-eng/database';
import { config } from '../../../config';

export interface VerifyPhoneParams {
	userId: string;
	phone: string;
}

/**
 * Query that updates a user record to have a new phone value and the phone
 * verified flag set
 *
 *     update user
 *     set phone = ?,
 *       phone_verified = 1
 *     where id = ?
 */
export const verifyPhone = new PreparedWriteQuery<VerifyPhoneParams>({
	description: 'update user set phone = ?, phone_verified = 1 where id = ?',
	prepared: `
		update user
		set phone = ?,
			phone_verified = 1
		where id = ?
	`,

	prepareParams(params: VerifyPhoneParams) {
		return [ params.phone, params.userId ];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
