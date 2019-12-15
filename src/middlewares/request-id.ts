
import { generateRequestId } from '../utils/random-keys';

declare module '@celeri/http-server' {
	interface Request {
		requestId: string;
	}
}

export const requestIdMiddleware = async ({ req, res }) => {
	req.requestId = await generateRequestId();
};
