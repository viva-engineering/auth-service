
import { format } from 'mysql2';
import { PreparedWriteQuery } from '@viva-eng/database';
import { config } from '../../../config';

export interface UpdatePhoneParams {
	userId: string;
	phone: string;
}

export const updatePhone = new PreparedWriteQuery<UpdatePhoneParams>({
	description: 'update user set phone = ? where id = ?',
	prepared: `
		update user
		set phone = ?
		where id = ?
	`,

	prepareParams(params: UpdatePhoneParams) {
		return [ params.phone, params.userId ];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
