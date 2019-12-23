
import { server } from '../../../server';
import { bodyParser } from '@celeri/body-parser';
import { validateBody, Req } from './params';
import { createApplicationRecord } from './service';
import { config } from '../../../config';
import { authenticate } from '../../../middlewares/authenticate';

server
	.post<void, Req>('/application')
	.use(authenticate({ required: true }))
	.use(bodyParser({ maxSize: '1kb' }))
	.use(validateBody)
	.use(async ({ req, res }) => {
		const result = await createApplicationRecord(req.body.name, req.user.userId);
		const payload = JSON.stringify(result);

		res.writeHead(201, { 'content-type': 'application/json' });
		res.write(payload);
		res.end();
	});
