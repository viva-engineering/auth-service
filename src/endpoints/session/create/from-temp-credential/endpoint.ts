
import { server } from '../../../../server';
import { bodyParser } from '@celeri/body-parser';
import { validateBody, Req } from './params';
import { authenticateWithTempCredential } from './service';
import { config } from '../../../../config';

server
	.post<void, Req>('/session/from-temp-credential')
	.use(bodyParser({ maxSize: '1kb' }))
	.use(validateBody)
	.use(async ({ req, res }) => {
		const result = await authenticateWithTempCredential(req.body.requestId, req.body.verificationKey, req.body.elevated);
		const payload = JSON.stringify(result);

		res.writeHead(201, { 'content-type': 'application/json' });
		res.write(payload);
		res.end();
	});
