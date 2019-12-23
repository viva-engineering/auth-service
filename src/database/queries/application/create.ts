
import { format } from 'mysql2';
import { config } from '../../../config';
import { PreparedWriteQuery } from '@viva-eng/database';

export interface CreateApplicationParams {
	id: string;
	name: string;
	digest: string;
	ownerId: string;
}

/**
 * Query that creates a new application record in the database
 *
 *     insert into application
 *       (id, name, secret_key_digest, owner_user_id)
 *     values
 *       (?, ?, ?, ?)
 */
export const createApplication = new PreparedWriteQuery<CreateApplicationParams>({
	description: 'insert into application ...',
	prepared: `
		insert into application
			(id, name, secret_key_digest, owner_user_id)
		values
			(?, ?, ?, ?)
	`,

	prepareParams(params: CreateApplicationParams) {
		return [
			params.id,
			params.name,
			params.digest,
			params.ownerId
		];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
