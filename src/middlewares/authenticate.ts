
import { db, Bit } from '../database';
import { MiddlewareInput, Request } from '@celeri/http-server';
import { MiddlewareFunction } from '@celeri/middleware-pipeline';
import { HttpError } from '@celeri/http-error';
import { UserRole, CredentialType } from '../reference-data';
import { introspectSession, IntrospectSessionRecord } from '../database/queries/session/introspect';
import { deleteSession } from '../database/queries/session/destroy';

export interface AuthenticatedUser {
	userId: string;
	userName: string;
	userCode: string;
	userRole: UserRole;
	displayName: string;
	email: string;
	preferredLanguage: string;
	applicationId: string;
	token: string;
	isElevated: boolean;
	ttl: {
		session: number;
		password: number;
		appCredential?: number;
	};
}

declare module '@celeri/http-server' {
	interface Request {
		user?: AuthenticatedUser;
	}
}

interface AuthenticateParams {
	required?: true;
	allowExpiredPassword?: true;
	rejectApplication?: true;
	requireElevated?: true;
	requireRole?: UserRole | UserRole[];
}

enum ErrorCodes {
	NoToken = 'NO_TOKEN_PROVIDED',
	MultipleTokens = 'MULTIPLE_TOKENS_PROVIDED',
	NonBearerToken = 'NON_BEARER_TOKEN',
	InvalidToken = 'INVALID_TOKEN_PROVIDED',
	EmailNotVerified = 'EMAIL_NOT_VERIFIED',
	PasswordExpired = 'PASSWORD_EXPIRED',
	ApplicationNotAllowed = 'APPLICATION_NOT_ALLOWED',
	NotAuthorized = 'NOT_AUTHORIZED',
	NeedsElevated = 'NEEDS_ELEVATED_SESSION'
}

/**
 * Middleware that attempts to authenticate the user by looking for an Authorization header
 * bearing a valid session token. If successful, the user data will be stored in `req.user`
 */
export const authenticate = (params: AuthenticateParams = { }) : MiddlewareFunction<MiddlewareInput<any, Request>> => {
	const roleSet = params.requireRole
		? Array.isArray(params.requireRole)
			? new Set(params.requireRole)
			: new Set([ params.requireRole ])
		: null;

	const validateRole = params.requireRole
		? (user: IntrospectSessionRecord) => roleSet.has(user.user_role)
		: () => true;

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
		const sessions = await db.query(introspectSession, { token });

		if (! sessions.results.length) {
			throw new HttpError(401, 'Invalid authentication token provided', {
				code: ErrorCodes.InvalidToken
			});
		}

		const session = sessions.results[0];

		const ttlSession = parseInt(session.session_ttl, 10);
		const ttlPassword = parseInt(session.password_ttl, 10);
		const ttlAppCred = session.app_cred_ttl ? parseInt(session.app_cred_ttl, 10) : null;

		if (ttlSession <= 0) {
			await db.query(deleteSession, { token });

			throw new HttpError(401, 'Invalid authentication token provided', {
				code: ErrorCodes.InvalidToken
			});
		}

		if (! params.allowExpiredPassword && ttlPassword <= 0) {
			throw new HttpError(401, 'Cannot perform that action until password is updated', {
				code: ErrorCodes.PasswordExpired
			});
		}

		if (params.rejectApplication && session.application_id) {
			throw new HttpError(401, 'Cannot perform that action through an application', {
				code: ErrorCodes.ApplicationNotAllowed
			});
		}

		if (params.requireElevated && ! session.is_elevated) {
			throw new HttpError(401, 'This action requires an elevated session', {
				code: ErrorCodes.NeedsElevated
			});
		}

		if (! validateRole(session)) {
			throw new HttpError(403, 'Not authorized', {
				code: ErrorCodes.NotAuthorized
			});
		}

		req.user = {
			userId: session.user_id,
			userName: session.username,
			userCode: session.user_code,
			userRole: session.user_role,
			displayName: session.display_name,
			email: session.email,
			isElevated: !! session.is_elevated,
			preferredLanguage: session.preferred_language,
			applicationId: session.application_id,
			token: token,
			ttl: {
				session: ttlSession,
				password: ttlPassword,
				appCredential: ttlAppCred
			}
		};
	};
};
