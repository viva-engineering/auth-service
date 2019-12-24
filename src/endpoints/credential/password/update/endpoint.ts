
import { server } from '../../../../server';
import { bodyParser } from '@celeri/body-parser';
import { validateBody, Req } from './params';
import { updatePassword } from './service';
import { config } from '../../../../config';
import { authenticate } from '../../../../middlewares/authenticate';

server
	.put<void, Req>('/credential/password')
	.use(authenticate({ required: true, allowExpiredPassword: true, requireElevated: true }))
	.use(bodyParser({ maxSize: '1kb' }))
	.use(validateBody)
	.use(async ({ req, res }) => {
		await updatePassword(req.user.userId, req.body.newPassword);

		res.writeHead(200);
		res.end();
	});
