
import { server } from '../../../server';
import { bodyParser } from '@celeri/body-parser';
import { validateBody, Req } from './params';
import { createRegistration } from './service';

server
	.post<void, Req>('/registration')
	.use(bodyParser({ maxSize: '1kb' }))
	.use(validateBody)
	.use(async ({ req, res }) => {
		const result = await createRegistration(req.body.email);
		const payload = JSON.stringify({
			requestId: result.requestId,
			verificationKey_REMOVE_ME: result.verificationKey
		});

		res.writeHead(201, { 'content-type': 'application/json' });
		res.write(payload);
		res.end();
	});
