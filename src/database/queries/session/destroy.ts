
import { format } from 'mysql2';
import { PreparedWriteQuery } from '@viva-eng/database';

export interface DeleteSessionParams {
	token: string;
}

/**
 * Query that deletes a session record from the database
 *
 *     delete session
 *     from session
 *     where id = ?
 */
export const deleteSession = new PreparedWriteQuery<DeleteSessionParams>({
	description: 'delete session from session where id = ?',
	prepared: `
		delete session
		from session
		where id = ?
	`,

	prepareParams(params: DeleteSessionParams) {
		return [ params.token ]
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});