
import { format } from 'mysql';
import { db, Bit } from '../database';
import { SelectQuery } from '@viva-eng/database';
import { MiddlewareInput, Request } from '@celeri/http-server';
import { MiddlewareFunction } from '@celeri/middleware-pipeline';
import { HttpError } from '@celeri/http-error';
import { UserRole, CredentialType, credentialTypes } from '../reference-data';

export interface AuthenticatedUser {
	userId: string;
	userCode: string;
	userRole: UserRole;
	email: string;
	preferredLanguage: string;
	applicationId: string;
	token: string;
	hasPassword: boolean;
	passwordExpired: boolean;
}

declare module '@celeri/http-server' {
	interface Request {
		user?: AuthenticatedUser;
	}
}

interface AuthenticateParams {
	required?: true;
	allowNoEmailVerification?: true;
	allowNoPassword?: true;
	allowExpiredPassword?: true;
	rejectApplication?: true;
}

interface GetSessionParams {
	token: string;
}

interface GetSessionRecord {
	user_id: string;
	user_code: string;
	email: string;
	email_verified: Bit
	preferred_language: string;
	is_expired: Bit;
	application_id: string;
	user_role: UserRole;
	has_password: Bit;
	password_expired: Bit;
}

enum ErrorCodes {
	NoToken = 'NO_TOKEN_PROVIDED',
	MultipleTokens = 'MULTIPLE_TOKENS_PROVIDED',
	NonBearerToken = 'NON_BEARER_TOKEN',
	InvalidToken = 'INVALID_TOKEN_PROVIDED',
	EmailNotVerified = 'EMAIL_NOT_VERIFIED',
	NoPassword = 'NO_PASSWORD_ASSIGNED',
	PasswordExpired = 'PASSWORD_EXPIRED',
	ApplicationNotAllowed = 'APPLICATION_NOT_ALLOWED'
}

/**
 * Middleware that attempts to authenticate the user by looking for an Authorization header
 * bearing a valid session token. If successful, the user data will be stored in `req.user`
 */
export const authenticate = (params: AuthenticateParams = { }) : MiddlewareFunction<MiddlewareInput<any, Request>> => {
	return async ({ req, res }) => {
		const tokenHeader = req.headers['authorization'];

		if (! tokenHeader) {
			if (params.required) {
				throw new HttpError(401, 'Authentication required', {
					code: ErrorCodes.NoToken
				});
			}

			return;
		}

		if (Array.isArray(tokenHeader)) {
			throw new HttpError(400, 'Recieved multiple authorization headers', {
				code: ErrorCodes.MultipleTokens
			});
		}

		if (! tokenHeader.startsWith('Bearer ')) {
			throw new HttpError(400, 'Recieved invalid authorization header; Expected bearer token', {
				code: ErrorCodes.NonBearerToken
			});
		}

		const token = tokenHeader.slice(7);
		const sessions = await db.query(getSession, { token });

		if (! sessions.results.length) {
			throw new HttpError(401, 'Invalid authentication token provided', {
				code: ErrorCodes.InvalidToken
			});
		}

		const session = sessions.results[0];

		if (session.is_expired === Bit.True) {
			throw new HttpError(401, 'Invalid authentication token provided', {
				code: ErrorCodes.InvalidToken
			});
		}

		if (! params.allowNoEmailVerification && session.email_verified === Bit.False) {
			throw new HttpError(401, 'Cannot perform that action until email is verified', {
				code: ErrorCodes.EmailNotVerified
			});
		}

		if (! params.allowNoPassword && session.has_password === Bit.False) {
			throw new HttpError(401, 'Cannot perform that action until a password is assigned', {
				code: ErrorCodes.NoPassword
			});
		}

		if (! params.allowExpiredPassword && session.password_expired=== Bit.True) {
			throw new HttpError(401, 'Cannot perform that action until password is updated', {
				code: ErrorCodes.PasswordExpired
			});
		}

		if (params.rejectApplication && session.application_id) {
			throw new HttpError(401, 'Cannot perform that action through an application', {
				code: ErrorCodes.ApplicationNotAllowed
			})
		}

		req.user = {
			userId: session.user_id,
			userCode: session.user_code,
			userRole: session.user_role,
			email: session.email,
			preferredLanguage: session.preferred_language,
			applicationId: session.application_id,
			token: token,
			hasPassword: Boolean(session.has_password),
			passwordExpired: Boolean(session.password_expired)
		};
	};
};

const queryTemplate = `
	select
		user.id as user_id,
		user.email as email,
		user.email_verified as email_verified,
		user.user_code as user_code,
		user.preferred_language as preferred_language,
		sess.expiration_timestamp < now() as is_expired,
		sess.application_id as application_id,
		role.description as user_role,
		cred.id is not null as has_password,
		cred.expiration_timestamp < now() as password_expired
	from session sess
	left outer join user user
		on user.id = sess.user_id
	left outer join user_role role
		on role.id = user.user_role_id
	left outer join credential cred
		on cred.user_id = user.id
		and cred.credential_type_id = ?
	where sess.id = ?
`;

export const getSession = new SelectQuery<GetSessionParams, GetSessionRecord>({
	description: 'select ... from session, user, credential where id = ?',

	maxRetries: 2,

	isRetryable() {
		return false;
	},

	async compile(params: GetSessionParams) {
		await credentialTypes.loaded;

		return format(queryTemplate, [
			credentialTypes.byDescription[CredentialType.Password],
			params.token
		]);
	}
});
