
import { logger } from '../logger';
import { BodyParserError } from '@celeri/body-parser';
import { errorHandler as middleware, HttpError } from '@celeri/http-error';
import { MiddlewareInput } from '@celeri/http-server';
import { ErrorMiddlewareFunction } from '@celeri/middleware-pipeline';

interface ErrorPayload {
	message: string;
	additionalInfo?: any;
}

const formatError = (error: HttpError) : ErrorPayload => {
	return {
		message: error.message,
		additionalInfo: error.meta
	};
};

export const errorHandler: ErrorMiddlewareFunction<MiddlewareInput<any, any>> = async ({ req, res, error }) => {
	if (error instanceof HttpError) {
		const payload = JSON.stringify(formatError(error));

		res.writeHead(error.statusCode, { 'content-type': 'application/json' });
		res.end(payload);

		return;
	}

	if (error instanceof BodyParserError) {
		return errorHandler({ req, res, error: new HttpError(error.code, error.message) });
	}

	logger.warn('The error handler caught something that was not an HttpError instance; This might be a bug', { error });

	return errorHandler({ req, res, error: new HttpError(500, 'An unexpected error has occured') });
};
