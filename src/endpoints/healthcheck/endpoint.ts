
import { hostname } from 'os';
import { db } from '../../database';
import { sessionPool } from '../../redis/session';
import { tempCredentialPool } from '../../redis/temp-credential';
import { server } from '../../server';

interface Healthcheck {
	status: 'available' | 'dependency failure',
	hostname: string
}

interface Dependency {
	available: boolean,
	[key: string]: any
}

interface FullHealthcheck extends Healthcheck {
	dependencies: {
		[name: string]: Dependency
	}
}

server
	.get('/healthcheck')
	.use(({ req, res }) => {
		const payload: Healthcheck = {
			status: 'available',
			hostname: hostname()
		};

		res.writeHead(200, { 'content-type': 'application/json' });
		res.end(JSON.stringify(payload));
	});

server
	.get('/healthcheck/full')
	.use(async ({ req, res }) => {
		const [ dbResult, redisSessionsResult, redisTempCredsResult ] = await Promise.all([
			db.healthcheck(),
			sessionPool.healthcheck(),
			tempCredentialPool.healthcheck()
		]);

		const dependencies: Dependency[] = [
			dbResult.master,
			dbResult.replica,
			redisSessionsResult,
			redisTempCredsResult
		];

		const available = dependencies.every((dependency) => dependency.available);
		const statusCode = available ? 200 : 503;

		const payload: FullHealthcheck = {
			status: available ? 'available' : 'dependency failure',
			hostname: hostname(),
			dependencies: {
				dbMaster: dbResult.master,
				dbReplica: dbResult.replica,
				redisSessions: redisSessionsResult,
				redisTempCreds: redisTempCredsResult
			}
		};

		res.writeHead(statusCode, { 'content-type': 'application/json' });
		res.end(JSON.stringify(payload));
	});
