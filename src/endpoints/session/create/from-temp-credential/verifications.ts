
import { db } from '../../../../database';
import { verifyEmail } from '../../../../database/queries/user/verify-email';
import { verifyPhone } from '../../../../database/queries/user/verify-phone';
import { GetCredentialRecord } from '../../../../database/queries/credential/get-temp-credential';
import { VerificationType } from '../../../../reference-data';
import { PoolConnection } from 'mysql2';

export const processVerifications = async (connection: PoolConnection, credential: GetCredentialRecord) => {
	switch (credential.verification_type) {
		case VerificationType.Email:
			await db.runQuery(connection, verifyEmail, {
				userId: credential.user_id,
				email: credential.verification_value
			});
			break;

		case VerificationType.Phone:
			await db.runQuery(connection, verifyPhone, {
				userId: credential.user_id,
				phone: credential.verification_value
			});
			break;
	}
};
