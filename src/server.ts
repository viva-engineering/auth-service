
import './database';

import { requestLogger } from '@celeri/request-logger';
import { config } from './config';
import { logger } from './logger';
import { loadEndpoints } from './endpoints';
import { shutdown } from './utils/shutdown';
import { errorHandler } from './middlewares/error-handler';
import { requestIdMiddleware } from './middlewares/request-id';
import { createServer, Request, Response, MiddlewareInput } from '@celeri/http-server';
import { HttpError } from '@celeri/http-error';



// Keep track of running requests so we can wait for them all to finish before shutting down

const runningRequests: Set<Request> = new Set();

shutdown.addOnShutdown(async () => {
	const sleep = () => new Promise((resolve) => setTimeout(resolve, 100));

	logger.verbose('Waiting until all running HTTP requests complete before shutting down...');

	while (runningRequests.size) {
		await sleep();
	}

	logger.verbose('HTTP requests are all complete');
});



// Server

export const server = createServer({
	// 
});

server.server.listen(config.http.port, config.http.address, () => {
	logger.info('HTTP server is listening', {
		port: config.http.port,
		address: config.http.address
	});
});



// Generate request IDs

server.use(requestIdMiddleware);



// Logger

const loggerMiddleware = requestLogger({
	log: (message: string, req: Request, res: Response, duration: string, finished: boolean) => {
		const meta = {
			method: req.method,
			path: req.pathname,
			status: finished ? res.statusCode : null,
			duration,
			requestId: req.requestId,
			requestFlowId: req.requestFlowId,
			finished,
			userId: null,
			userRole: null,
			appId: null
		};

		if (req.user) {
			meta.userId = req.user.userId;
			meta.userRole = req.user.userRole;
			meta.appId = req.user.applicationId;
		}

		logger.info('Incomming request', meta);
	}
});

server.use(loggerMiddleware);



// If the log level is turned all the way up, log when new requests start, as well

if (config.logging.logLevel === 'silly') {
	server.use(({ req, res }) => {
		logger.silly('New incomming request starting', {
			method: req.method,
			path: req.url,
			requestId: req.requestId,
			requestFlowId: req.requestFlowId
		});
	});
}



// Shutdown handler

const shutdownMiddleware = ({ req, res }: MiddlewareInput<void, void>) => {
	// If we're currently shutting down, don't allow any new requests to start
	if (shutdown.isShuttingDown) {
		throw new HttpError(503, 'This server instance is currently shutting down. Please try the request again.');
	}

	runningRequests.add(req);
};

server.use(shutdownMiddleware);



// Router

const routerMiddleware = server.router({
	notFound: ({ req, res }) => {
		throw new HttpError(404, 'Not Found');
	}
});

server.use(routerMiddleware);



// Endpoints

loadEndpoints();



// Error handler

server.catch(errorHandler);



// Final request cleanup

const cleanupMiddleware = ({ req, res }: MiddlewareInput<void, void>) => {
	runningRequests.delete(req);
};

server.use(cleanupMiddleware);
