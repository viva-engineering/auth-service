
import { format } from 'mysql2';
import { PreparedSelectQuery } from '@viva-eng/database';
import { UserRole } from '../../../reference-data';

export interface GetCredentialParams {
	username: string;
	applicationId: string;
}

export interface GetCredentialRecord {
	cred_id: string;
	cred_digest: string;
	cred_ttl: string;
	cred_recent_failures: number;
	user_id: string;
	user_role: UserRole;
	application_id: string;
	application_secret_digest: string;
}

export const getApplicationCredential = new PreparedSelectQuery<GetCredentialParams, GetCredentialRecord>({
	description: 'select ... from user, credential, application where username = ? and application_id = ?',
	prepared: `
		select
			cred.id as id,
			cred.key_digest as cred_digest,
			timestampdiff(second, now(), cred.expiration_timestamp) as cred_ttl,
			cred.recent_failures as cred_recent_failures,
			cred.user_id as user_id,
			role.description as user_role,
			app.id as application_id,
			app.secret_key_digest as application_secret_digest
		from user user
		left outer join credential cred
			on cred.user_id = user.id
		left outer join application app
			on app.id = cred.application_id
		left outer join user_role role
			on role.id = user.user_role_id
		where user.username = ?
			and app.id = ?
	`,

	prepareParams(params: GetCredentialParams) {
		return [
			params.username,
			params.applicationId
		];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
