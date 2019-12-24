
import { server } from '../../../../server';
import { bodyParser } from '@celeri/body-parser';
import { validateBody, Req } from './params';
import { createApplicationCredential } from './service';
import { authenticate } from '../../../../middlewares/authenticate';

server
	.post<void, Req>('/credential/application')
	.use(authenticate({ required: true, requireElevated: true }))
	.use(bodyParser({ maxSize: '1kb' }))
	.use(validateBody)
	.use(async ({ req, res }) => {
		const secretKey = await createApplicationCredential(req.user.userId, req.body.applicationId);
		const payload = JSON.stringify({ secretKey });

		res.writeHead(201, { 'content-type': 'application/json' });
		// res.write(payload);
		res.end();
	});
