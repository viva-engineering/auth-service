
import { server } from '../../../server';
import { bodyParser } from '@celeri/body-parser';
import { config } from '../../../config';
import { authenticate } from '../../../middlewares/authenticate';

server
	.get<void, {}>('/session/introspect')
	.use(authenticate({ required: true, allowExpiredPassword: true }))
	.use(async ({ req, res }) => {
		const payload = JSON.stringify({
			userId: req.user.userId,
			userName: req.user.userName,
			userCode: req.user.userCode,
			userRole: req.user.userRole,
			email: req.user.email,
			preferredLanguage: req.user.preferredLanguage,
			isElevated: req.user.isElevated,
			applicationId: req.user.applicationId,
			token: req.user.token,
			sessionTTL: req.user.ttl.session,
			passwordTTL: req.user.ttl.password,
			appCredentialTTL: req.user.ttl.appCredential
		});

		res.writeHead(200, { 'content-type': 'application/json' });
		res.write(payload);
		res.end();
	});
