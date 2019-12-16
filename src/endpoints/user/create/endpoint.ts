
import { server } from '../../../server';
import { bodyParser } from '@celeri/body-parser';
import { validateBody, Req } from './params';
import { createRegistration } from './service';

server
	.post<void, Req>('/user')
	.use(bodyParser({ maxSize: '1kb' }))
	.use(validateBody)
	.use(async ({ req, res }) => {
		await createRegistration(req.body.username, req.body.password);

		res.writeHead(201, { 'content-type': 'application/json' });
		res.end();
	});
