
import { config } from '../../config';
import { RedisPool } from '../pool';

export const tempCredentialPool = new RedisPool(config.redis.dbs.tempCredential, {
	// Need string numbers because user IDs are bigints
	string_numbers: true
});
