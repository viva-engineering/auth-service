
import { format } from 'mysql2';
import { config } from '../../../../config';
import { PreparedWriteQuery } from '@viva-eng/database';

export interface CreateSessionParams {
	id: string;
	userId: string;
	applicationId?: string;
}

export const createSession = new PreparedWriteQuery<CreateSessionParams>({
	description: 'insert into session ...',
	prepared: `
		insert into session
			(id, user_id, expiration_timestamp, application_id)
		values
			(?, ?, date_add(now(), interval ${config.session.ttl} minute), ?)
	`,

	prepareParams(params: CreateSessionParams) {
		return [
			params.id,
			params.userId,
			params.applicationId || null
		];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
