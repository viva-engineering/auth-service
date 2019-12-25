
import { server } from '../../../../server';
import { bodyParser } from '@celeri/body-parser';
import { validateBody, Req } from './params';
import { authenticateWithTempCredential } from './service';
import { config } from '../../../../config';

server
	.post<void, Req>('/session/from-temp-credential')
	.use(bodyParser({ maxSize: '1kb' }))
	.use(validateBody)
	.use(async ({ req, res }) => {
		const token = await authenticateWithTempCredential(req.body.requestId, req.body.verificationKey, req.body.elevated);
		const ttlMinutes = req.body.elevated ? config.session.ttlElevated : config.session.ttl;
		const payload = JSON.stringify({ token, ttl: ttlMinutes * 60 });

		res.writeHead(201, { 'content-type': 'application/json' });
		res.write(payload);
		res.end();
	});
