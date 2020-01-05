
import { server } from '../../../../server';
import { bodyParser } from '@celeri/body-parser';
import { validateBody, Req } from './params';
import { authenticateWithPassword } from './service';

server
	.post<void, Req>('/session/from-password')
	.use(bodyParser({ maxSize: '1kb' }))
	.use(validateBody)
	.use(async ({ req, res }) => {
		const result = await authenticateWithPassword(req.body.username, req.body.password, req.body.elevated);
		const payload = JSON.stringify(result);

		res.writeHead(201, { 'content-type': 'application/json' });
		res.write(payload);
		res.end();
	});
