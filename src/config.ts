
import { PoolConfig } from 'mysql2';
import { Options as HasherOptions, argon2id } from 'argon2';

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

	refTables: {
		refreshInterval: number;
	};

	session: {
		/** Session TTL in minutes */
		ttl: number;
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

	refTables: {
		refreshInterval: 1000 * 60 * 60 * 24
	},

	session: {
		ttl: 30
	},

	password: {
		ttl: 180
	}
};
