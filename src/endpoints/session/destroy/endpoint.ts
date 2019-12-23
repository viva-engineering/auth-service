
import { server } from '../../../server';
import { deleteUserSession } from './service';
import { bodyParser } from '@celeri/body-parser';
import { config } from '../../../config';
import { authenticate } from '../../../middlewares/authenticate';

server
	.delete<void, {}>('/session')
	.use(authenticate({ required: true, allowExpiredPassword: true }))
	.use(async ({ req, res }) => {
		await deleteUserSession(req.user.token);

		res.writeHead(200);
		res.end();
	});
