
import { generateRequestId } from '../utils/random-keys';

declare module '@celeri/http-server' {
	interface Request {
		requestId: string;
		requestFlowId: string;
	}
}

export const requestIdMiddleware = async ({ req, res }) => {
	const requestFlowId = req.headers['x-request-flow-id'] || generateRequestId();

	[ req.requestId, req.requestFlowId ] = await Promise.all([
		generateRequestId(),
		requestFlowId
	]);
};
