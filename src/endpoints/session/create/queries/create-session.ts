
import { format } from 'mysql';
import { WriteQuery } from '@viva-eng/database';
import { config } from '../../../../config';

export interface CreateSessionParams {
	id: string;
	userId: string;
	applicationId?: string;
}

const queryTemplate = `
	insert into session
		(id, user_id, expiration_timestamp, application_id)
	values
		(?, ?, date_add(now(), interval ${config.session.ttl} minute), ?)
`;

export const createSession = new WriteQuery<CreateSessionParams>({
	description: 'insert into session ...',

	maxRetries: 2,

	isRetryable() {
		return false;
	},

	compile(params: CreateSessionParams) {
		return format(queryTemplate, [
			params.id,
			params.userId,
			params.applicationId
		]);
	}
});

