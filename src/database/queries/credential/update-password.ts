
import { format } from 'mysql2';
import { PreparedWriteQuery } from '@viva-eng/database';
import { config } from '../../../config';

export interface UpdatePasswordParams {
	credentialId: string;
	digest: string;
}

/**
 * Query that updates a password credential record with a new password
 *
 *     update credential
 *     set key_digest = ?,
 *       expiration_timestamp = date_add(now(), interval ? day)
 *     where id = ?
 */
export const updatePassword = new PreparedWriteQuery<UpdatePasswordParams>({
	description: 'update credential set key_digest = ? where id = ?',
	prepared: `
		update credential
		set key_digest = ?,
			expiration_timestamp = date_add(now(), interval ${config.password.ttl} day)
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
