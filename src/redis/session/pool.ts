
import { config } from '../../config';
import { RedisPool } from '../pool';

export const sessionPool = new RedisPool(config.redis.dbs.session, {
	// Need string numbers because user IDs are bigints
	string_numbers: true
});
