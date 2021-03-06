
import { server } from '../../../../server';
import { bodyParser } from '@celeri/body-parser';
import { authenticateWithSession } from './service';
import { config } from '../../../../config';
import { authenticate } from '../../../../middlewares/authenticate';

server
	.post<void, {}>('/session/from-session')
	.use(authenticate({ required: true }))
	.use(async ({ req, res }) => {
		const result = await authenticateWithSession(req.user);
		const payload = JSON.stringify(result);

		res.writeHead(201, { 'content-type': 'application/json' });
		res.write(payload);
		res.end();
	});
