
import { PoolConfig } from 'mysql2';
import { Options as HasherOptions, argon2id } from 'argon2';
import { cast } from '@viva-eng/config-loader';
import { RedisDB, RedisConfig } from '@viva-eng/redis-utils';

export interface Config {
	http: {
		port: number;
		address: string;
	};

	logging: {
		colors: boolean;
		output: 'json' | 'pretty';
		logLevel: 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly';
		stackTraceLimit?: number;
	};

	hashing: HasherOptions & { raw?: false };

	database: {
		master: PoolConfig;
		replica: PoolConfig;
	};

	redis: {
		host: string;
		port: number;
		password: string;
		dbs: {
			session: RedisDB;
			tempCredential: RedisDB;
		},
		poolOptions: RedisConfig['pool'];
	};

	refTables: {
		refreshInterval: number;
	};

	ttls: {
		/** Session TTL in seconds */
		session: number;

		/** Elevated session TTL in seconds */
		elevatedSession: number;

		/** Temp credentials TTL in seconds */
		tempCredential: number;

		/** New password credential TTL in days */
		password: number;

		/** Application credential TTL in days */
		appCredential: number;
	}
}

export const config: Config = {
	http: {
		port: cast.number(process.env.auth_srv_http_port, 8080),
		address: cast.string(process.env.auth_srv_http_addr, '0.0.0.0')
	},

	logging: {
		colors: cast.bool(process.env.auth_srv_logging_color, false),
		output: 'pretty',
		logLevel: cast.string(process.env.auth_srv_logging_level, 'info'),
		stackTraceLimit: cast.number(process.env.auth_srv_logging_stack_length, 10),
	},

	hashing: {
		type: argon2id,
		timeCost: cast.number(process.env.auth_srv_hashing_time_cost),
		memoryCost: cast.number(process.env.auth_srv_hashing_memory_cost),
		hashLength: cast.number(process.env.auth_srv_hashing_hash_length)
	},

	database: {
		master: {
			host: cast.string(process.env.db_users_master_host),
			port: cast.number(process.env.db_users_master_port),
			user: cast.string(process.env.auth_srv_db_users_user),
			password: cast.string(process.env.auth_srv_db_users_pass),
			database: cast.string(process.env.db_users_database),
			connectionLimit: cast.number(process.env.auth_srv_db_users_master_connection_limit, 100),
			supportBigNumbers: true,
			bigNumberStrings: true,
			dateStrings: true,
			charset: 'utf8mb4_unicode_ci'
		},
		replica: {
			host: cast.string(process.env.db_users_replica_host),
			port: cast.number(process.env.db_users_replica_port),
			user: cast.string(process.env.auth_srv_db_users_user),
			password: cast.string(process.env.auth_srv_db_users_pass),
			database: cast.string(process.env.db_users_database),
			connectionLimit: cast.number(process.env.auth_srv_db_users_replica_connection_limit, 100),
			supportBigNumbers: true,
			bigNumberStrings: true,
			dateStrings: true,
			charset: 'utf8mb4_unicode_ci'
		}
	},

	redis: {
		host: cast.string(process.env.redis_host),
		port: cast.number(process.env.redis_port),
		password: cast.string(process.env.redis_pass),
		dbs: {
			session: cast.number(process.env.redis_db_session),
			tempCredential: cast.number(process.env.redis_db_temp_credential)
		},
		poolOptions: {
			min: cast.number(process.env.auth_srv_redis_pool_min),
			max: cast.number(process.env.auth_srv_redis_pool_max)
		}
	},

	refTables: {
		refreshInterval: cast.number(process.env.auth_srv_ref_data_refresh_interval)
	},

	ttls: {
		session: cast.number(process.env.auth_srv_ttl_session),
		elevatedSession: cast.number(process.env.auth_srv_ttl_elevated_session),
		tempCredential: cast.number(process.env.auth_srv_ttl_temp_credential),
		password: cast.number(process.env.auth_srv_ttl_password),
		appCredential: cast.number(process.env.auth_srv_ttl_app_credential)
	}
};
