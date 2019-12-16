
import { server } from '../../../../server';
import { bodyParser } from '@celeri/body-parser';
import { validateBody, Req } from './params';
import { createPasswordCredential } from './service';
import { authenticate } from '../../../../middlewares/authenticate';

server
	.post<void, Req>('/credential/password')
	.use(authenticate({ required: true, allowNoEmailVerification: true, allowNoPassword: true }))
	.use(bodyParser({ maxSize: '1kb' }))
	.use(validateBody)
	.use(async ({ req, res }) => {
		await createPasswordCredential(req.user, req.body.password);

		res.writeHead(201);
		res.end();
	});
