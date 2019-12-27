
import { format } from 'mysql2';
import { config } from '../../../config';
import { PreparedWriteQuery } from '@viva-eng/database';

export interface CreateElevatedSessionParams {
	id: string;
	userId: string;
}

/**
 * Query that creates a new session record with the elevated flag set
 *
 *     insert into session
 *       (id, user_id, expiration_timestamp, is_elevated)
 *     values
 *       (?, ?, date_add(now(), interval ? minute), 1)
 */
export const createElevatedSession = new PreparedWriteQuery<CreateElevatedSessionParams>({
	description: 'insert into session ...',
	prepared: `
		insert into session
			(id, user_id, expiration_timestamp, is_elevated)
		values
			(?, ?, date_add(now(), interval ${config.session.ttlElevated} minute), 1)
	`,

	prepareParams(params: CreateElevatedSessionParams) {
		return [
			params.id,
			params.userId
		];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
