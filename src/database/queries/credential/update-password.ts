
import { format } from 'mysql2';
import { PreparedWriteQuery } from '@viva-eng/database';
import { config } from '../../../config';

export interface UpdatePasswordParams {
	credentialId: string;
	digest: string;
}

export const updatePassword = new PreparedWriteQuery<UpdatePasswordParams>({
	description: 'update credential set key_digest = ? where id = ?',
	prepared: `
		update credential
		set key_digest = ?,
			expiration_timestamp = date_add(now(), interval ${config.ttls.password} day)
		where id = ?
	`,

	prepareParams(params: UpdatePasswordParams) {
		return [ params.digest, params.credentialId ];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
