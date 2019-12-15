
import { server } from '../../../server';
import { bodyParser } from '@celeri/body-parser';
import { config } from '../../../config';
import { authenticate } from '../../../middlewares/authenticate';

server
	.get<void, {}>('/session/introspect')
	.use(authenticate({ required: true, allowNoEmailVerification: true, allowNoPassword: true, allowExpiredPassword: true }))
	.use(async ({ req, res }) => {
		const payload = JSON.stringify({
			userId: req.user.userId,
			userCode: req.user.userCode,
			userRole: req.user.userRole,
			email: req.user.email,
			preferredLanguage: req.user.preferredLanguage,
			applicationId: req.user.applicationId,
			token: req.user.token,
			hasPassword: req.user.hasPassword,
			passwordExpired: req.user.passwordExpired
		});

		res.writeHead(200, { 'content-type': 'application/json' });
		res.write(payload);
		res.end();
	});
