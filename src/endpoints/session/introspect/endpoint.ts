
import { server } from '../../../server';
import { bodyParser } from '@celeri/body-parser';
import { config } from '../../../config';
import { authenticate } from '../../../middlewares/authenticate';

server
	.get<void, {}>('/session/introspect')
	.use(authenticate({ required: true }))
	.use(async ({ req, res }) => {
		const payload = JSON.stringify({
			userId: req.user.userId,
			userRole: req.user.userRole,
			isElevated: req.user.isElevated,
			applicationId: req.user.applicationId,
			token: req.user.token,
			ttl: req.user.ttl
		});

		res.writeHead(200, { 'content-type': 'application/json' });
		res.write(payload);
		res.end();
	});
