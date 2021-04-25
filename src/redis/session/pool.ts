
import { config } from '../../config';
import { logger } from '../../logger';
import { RedisPool } from '@viva-eng/redis-utils';
import { shutdown } from '../../utils/shutdown';

const { host, port } = config.redis;

export const sessionPool = new RedisPool({
	host: host,
	port: port,
	db: config.redis.dbs.session,
	password: config.redis.password,
	logger: logger,
	options: {
		// Need string numbers because user IDs are bigints
		string_numbers: true
	},
	pool: config.redis.poolOptions
});

shutdown.addOnShutdown(async () => {
	logger.verbose('Waiting for redis pool to close before shutting down...', { host, port, db: config.redis.dbs.session });

	await sessionPool.close();

	logger.verbose('Redis pool closed', { host, port, db: config.redis.dbs.session });
});
