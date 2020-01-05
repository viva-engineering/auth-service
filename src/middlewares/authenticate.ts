
import { db } from '../database';
import { MiddlewareInput, Request } from '@celeri/http-server';
import { MiddlewareFunction } from '@celeri/middleware-pipeline';
import { HttpError } from '@celeri/http-error';
import { UserRole } from '../reference-data';
import { Session, introspectSession } from '../redis/session';

export interface AuthenticatedUser {
	userId: string;
	userRole: UserRole;
	applicationId: string;
	token: string;
	isElevated: boolean;
	ttl: number;
}

declare module '@celeri/http-server' {
	interface Request {
		user?: AuthenticatedUser;
	}
}

interface AuthenticateParams {
	required?: true;
	rejectApplication?: true;
	requireElevated?: true;
	requireRole?: UserRole | UserRole[];
}

enum ErrorCodes {
	NoToken = 'NO_TOKEN_PROVIDED',
	MultipleTokens = 'MULTIPLE_TOKENS_PROVIDED',
	NonBearerToken = 'NON_BEARER_TOKEN',
	InvalidToken = 'INVALID_TOKEN_PROVIDED',
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
		? (user: Session) => roleSet.has(user.userRole)
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
		const session = await introspectSession(token);

		if (! session) {
			throw new HttpError(401, 'Invalid authentication token provided', {
				code: ErrorCodes.InvalidToken
			});
		}

		if (params.rejectApplication && session.applicationId) {
			throw new HttpError(403, 'Cannot perform that action through an application', {
				code: ErrorCodes.ApplicationNotAllowed
			});
		}

		if (params.requireElevated && ! session.isElevated) {
			throw new HttpError(403, 'This action requires an elevated session', {
				code: ErrorCodes.NeedsElevated
			});
		}

		if (! validateRole(session)) {
			throw new HttpError(403, 'Not authorized', {
				code: ErrorCodes.NotAuthorized
			});
		}

		req.user = {
			userId: session.userId,
			userRole: session.userRole,
			isElevated: session.isElevated,
			applicationId: session.applicationId,
			token: token,
			ttl: session.ttl
		};
	};
};
