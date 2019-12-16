
import { server } from '../../../../server';
import { bodyParser } from '@celeri/body-parser';
import { validateBody, Req } from './params';
import { authenticateWithPassword } from './service';
import { config } from '../../../../config';

server
	.post<void, Req>('/session/from-password')
	.use(bodyParser({ maxSize: '1kb' }))
	.use(validateBody)
	.use(async ({ req, res }) => {
		const token = await authenticateWithPassword(req.body.username, req.body.password);
		const payload = JSON.stringify({ token, ttl: config.session.ttl * 60 });

		res.writeHead(201, { 'content-type': 'application/json' });
		res.write(payload);
		res.end();
	});
