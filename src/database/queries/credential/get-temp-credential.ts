
import { format } from 'mysql2';
import { PreparedSelectQuery } from '@viva-eng/database';
import { CredentialType, credentialTypes, VerificationType, UserRole } from '../../../reference-data';

export interface GetCredentialParams {
	requestId: string;
}

export interface GetCredentialRecord {
	cred_id: string;
	cred_digest: string;
	cred_request_id: string;
	cred_ttl: string;
	cred_compromised: 0 | 1;
	cred_recent_failures: number;
	user_id: string;
	verification_type: VerificationType;
	verification_value: string;
	user_role: UserRole;
}

/**
 * Query that fetches a temporary credential record
 *
 *     select
 *       cred.id as id,
 *       cred.key_digest as cred_digest,
 *       cred.request_id as cred_request_id,
 *       timestampdiff(second, now(), cred.expiration_timestamp) as cred_ttl,
 *       cred.compromised as cred_compromised,
 *       cred.recent_failures as cred_recent_failures,
 *       cred.user_id as user_id,
 *       ver.description as verification_type,
 *       cred.verification_value as verification_value,
 *       role.description as user_role
 *     from credential cred
 *     left outer join verification_type ver
 *     	 on ver.id = cred.verification_type_id
 *     left outer join user user
 *       on user.id = cred.user_id
 *     left outer join user_role role
 *       on role.id = user.user_role_id
 *     where cred.credential_type_id = ?
 *     	 and cred.request_id = ?
 */
export const getTempCredential = new PreparedSelectQuery<GetCredentialParams, GetCredentialRecord>({
	description: 'select ... from credential where credential_type = "temp_credential" and request_id = ?',
	prepared: `
		select
			cred.id as id,
			cred.key_digest as cred_digest,
			cred.request_id as cred_request_id,
			timestampdiff(second, now(), cred.expiration_timestamp) as cred_ttl,
			cred.compromised as cred_compromised,
			cred.recent_failures as cred_recent_failures,
			cred.user_id as user_id,
			ver.description as verification_type,
			cred.verification_value as verification_value,
			role.description as user_role
		from credential cred
		left outer join verification_type ver
			on ver.id = cred.verification_type_id
		left outer join user user
			on user.id = cred.user_id
		left outer join user_role role
			on role.id = user.user_role_id
		where cred.credential_type_id = ?
			and cred.request_id = ?
	`,

	async prepareParams(params: GetCredentialParams) {
		await credentialTypes.loaded;

		return [
			credentialTypes.byDescription[CredentialType.TempCredential],
			params.requestId
		];
	},

	maxRetries: 2,
	isRetryable() {
		return false;
	}
});
