
import { PoolConfig } from 'mysql2';
import { Options as HasherOptions, argon2id } from 'argon2';
import { RedisDB } from './redis/pool';
import { Options as PoolOptions } from 'generic-pool';

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
		},
		poolOptions: PoolOptions;
	};

	refTables: {
		refreshInterval: number;
	};

	session: {
		/** Session TTL in seconds */
		ttl: number;

		/** Elevated session TTL in seconds */
		ttlElevated: number;
	};

	password: {
		/** New password credential TTL in days */
		ttl: number;
	};
}

export const config: Config = {
	http: {
		port: 8080,
		address: '0.0.0.0'
	},

	logging: {
		colors: true,
		output: 'pretty',
		logLevel: 'verbose',
		stackTraceLimit: 100,
	},

	hashing: {
		type: argon2id,
		timeCost: 3,
		memoryCost: 2 ** 12,
		hashLength: 150
	},

	database: {
		master: {
			host: '127.0.0.1',
			port: 3306,
			user: 'viva_auth_service',
			password: 'q4juxuloKOguHAbIlo8oYO23sOraXA',
			database: 'viva_users',
			connectionLimit: 100,
			supportBigNumbers: true,
			bigNumberStrings: true,
			dateStrings: true
		},
		replica: {
			host: '127.0.0.1',
			port: 3306,
			user: 'viva_auth_service',
			password: 'q4juxuloKOguHAbIlo8oYO23sOraXA',
			database: 'viva_users',
			connectionLimit: 100,
			supportBigNumbers: true,
			bigNumberStrings: true,
			dateStrings: true
		}
	},

	redis: {
		host: 'localhost',
		port: 6379,
		password: 'wERolomONOtOyuKecA2oRuweM3MA24Y8di36XEB5P63I4ic6GIl5Y3tI6eqO',
		dbs: {
			session: 0
		},
		poolOptions: {
			min: 1,
			max: 30
		}
	},

	refTables: {
		refreshInterval: 1000 * 60 * 60 * 24
	},

	session: {
		ttl: 30 * 60,
		ttlElevated: 3 * 60
	},

	password: {
		ttl: 180
	}
};
