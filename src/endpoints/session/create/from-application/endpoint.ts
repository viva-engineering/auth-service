
import { server } from '../../../../server';
import { bodyParser } from '@celeri/body-parser';
import { validateBody, Req } from './params';
import { authenticateWithApplication } from './service';
import { config } from '../../../../config';

server
	.post<void, Req>('/session/from-application')
	.use(bodyParser({ maxSize: '2kb' }))
	.use(validateBody)
	.use(async ({ req, res }) => {
		const token = await authenticateWithApplication(
			req.body.username,
			req.body.applicationId,
			req.body.applicationSecret,
			req.body.applicationUserSecret
		);

		const payload = JSON.stringify({ token, ttl: config.session.ttl });

		res.writeHead(201, { 'content-type': 'application/json' });
		res.write(payload);
		res.end();
	});
