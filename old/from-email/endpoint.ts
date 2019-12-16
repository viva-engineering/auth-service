
import { server } from '../../../../server';
import { bodyParser } from '@celeri/body-parser';
import { validateBody, Req } from './params';
import { authenticateWithEmailCode } from './service';
import { config } from '../../../../config';

server
	.post<void, Req>('/session/from-email')
	.use(bodyParser({ maxSize: '1kb' }))
	.use(validateBody)
	.use(async ({ req, res }) => {
		const token = await authenticateWithEmailCode(req.body.requestId, req.body.verificationKey);
		const payload = JSON.stringify({ token, ttl: config.session.ttl * 60 });

		res.writeHead(201, { 'content-type': 'application/json' });
		res.write(payload);
		res.end();
	});
