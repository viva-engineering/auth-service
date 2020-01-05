
import { format } from 'mysql2';
import { config } from '../../../config';
import { PreparedSelectQuery } from '@viva-eng/database';

export interface ReadApplicationParams {
	id: string;
}

export interface ReadApplicationRecord {
	id: string;
	name: string;
	active: '0' | '1';
	approved: '0' | '1';
	owner_user_id: string;
}

export const readApplication = new PreparedSelectQuery<ReadApplicationParams, ReadApplicationRecord>({
	description: 'select ... from application where id = ?',
	prepared: `
		select
			app.id as id,
			app.name as name,
			app.active as active,
			app.approved as approved,
			app.owner_user_id as owner_user_id
		from application app
		where app.id = ?
	`,

	prepareParams(params: ReadApplicationParams) {
		return [ params.id ];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
