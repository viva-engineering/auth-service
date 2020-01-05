
import { server } from '../../../server';
import { bodyParser } from '@celeri/body-parser';
import { validateBody, Req } from './params';
import { updateUserEmail } from './service';
import { authenticate } from '../../../middlewares/authenticate';

server
	.put<void, Req>('/user/email')
	.use(bodyParser({ maxSize: '1kb' }))
	.use(authenticate({ required: true, requireElevated: true }))
	.use(validateBody)
	.use(async ({ req, res }) => {
		const result = await updateUserEmail(req.user.userId, req.body.email);
		const payload = JSON.stringify(result);

		res.writeHead(200, { 'content-type': 'application/json' });
		res.write(payload);
		res.end();
	});
