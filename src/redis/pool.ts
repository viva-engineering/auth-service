
export type RedisDB = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

import { config } from '../config';
import { logger } from '../logger';
import { createPool, Factory, Pool } from 'generic-pool';
import { createClient, ClientOpts, RedisClient, Callback } from 'redis';
import { shutdown } from '../utils/shutdown';
import { formatDuration } from './utils';

let nextId = 1;
const clientIds: WeakMap<RedisClient, number> = new WeakMap();

interface CommandRunner<T> {
	(client: RedisClient, callback: Callback<T>): void;
}

export interface HealthcheckResult {
	available: boolean,
	url: string,
	timeToAcquire?: string,
	duration?: string,
	warning?: string,
	info?: string
}

export class RedisPool {
	public readonly host: string;
	public readonly port: number;
	public readonly db: RedisDB;

	protected readonly pool: Pool<RedisClient>;

	constructor(db: RedisDB, options?: Partial<ClientOpts>) {
		const { host, port } = config.redis;

		this.host = host;
		this.port = port;
		this.db = db;

		logger.verbose('Creating new redis pool', { host, port, db });

		shutdown.addOnShutdown(async () => {
			logger.verbose('Waiting for redis pool to close before shutting down...', { host, port, db });

			await this.close();

			logger.verbose('Redis pool closed', { host, port, db });
		});

		this.pool = createNewPool(db, options);
	}

	public acquire(priority?: number) {
		return this.pool.acquire(priority);
	}

	public release(client: RedisClient) {
		this.pool.release(client);
	}

	public ping<T extends string>(message?: T) {
		return this.exec<T>((client, callback) => {
			client.ping(message || 'ping', callback);
		});
	}

	public set(key: string, value: string, expiration?: number) {
		return this.exec<'OK'>((client, callback) => {
			if (expiration) {
				client.set(key, value, 'EX', expiration, callback);
			}

			else {
				client.set(key, value, callback);
			}
		});
	}

	public get<T = string>(key: string) {
		return this.exec<T>((client, callback) => {
			client.get(key, callback as Callback<any>);
		});
	}

	public del(keys: string[]) {
		return this.exec<number>((client, callback) => {
			client.del(...keys, callback);
		});
	}

	public hmset(key: string, ...values: (string | number)[]) {
		return this.exec<'OK'>((client, callback) => {
			client.hmset(key, ...values, callback);
		});
	}

	public hgetall<T extends object>(key: string) {
		return this.exec<T>((client, callback) => {
			client.hgetall(key, callback as Callback<object>);
		});
	}

	public multi(commands: any[][]) {
		return this.exec<any[]>((client, callback) => {
			client.multi(commands).exec(callback);
		});
	}

	public batch(commands: any[][]) {
		return this.exec<any[]>((client, callback) => {
			client.batch(commands).exec(callback);
		});
	}

	public async close() {
		await this.pool.drain();
		await this.pool.clear();
	}

	public async healthcheck() {
		const start = process.hrtime();
		const result: HealthcheckResult = {
			url: `redis://${this.host}:${this.port}/${this.db}`,
			available: true
		};

		const client = await this.acquire();
		const timeToAcquire = process.hrtime(start);

		await new Promise((resolve) => {
			client.ping((error) => {
				const duration = process.hrtime(start);

				result.duration = formatDuration(duration);
				result.timeToAcquire = formatDuration(timeToAcquire);

				if (error) {
					result.available = false;
					result.info = error.message;
				}

				if (duration[0] > 0 || duration[1] / 10e5 > 50) {
					result.warning = 'Connection slower than 50ms';
				}

				resolve();
			});
		});

		this.release(client);

		return result;
	}

	private exec<T>(run: CommandRunner<T>) : Promise<T> {
		return new Promise(async (resolve, reject) => {
			const client = await this.acquire();
			const callback: Callback<T> = (error, results) => {
				this.release(client);

				if (error) {
					reject(error);
				}

				resolve(results);
			};

			run(client, callback);
		});
	}
}

const createNewPool = (db: RedisDB, options?: Partial<ClientOpts>) => {
	const { host, port } = config.redis;

	const factory: Factory<RedisClient> = {
		create() {
			const clientId = nextId++;

			logger.debug('Creating new redis client', { host, port, db, clientId });

			return new Promise((resolve, reject) => {
				const client = createClient({
					host, port, db,
					password: config.redis.password,
					...(options || { })
				});

				clientIds.set(client, clientId);

				let fulfilled = false;

				client.on('error', (error) => {
					logger.error('Redis client encountered an error', { host, port, db, clientId, error });

					if (! fulfilled) {
						fulfilled = true;
						reject(error);
					}
				});

				client.on('ready', () => {
					logger.debug('New redis client ready', { host, port, db, clientId });
					fulfilled = true;
					resolve(client);
				});
			});
		},
		destroy(client: RedisClient) {
			const clientId = clientIds.get(client);

			logger.debug('Destroying redis client', { host, port, db, clientId });

			return new Promise((resolve, reject) => {
				client.quit(() => resolve());
			});
		},
		validate(client: RedisClient) {
			return new Promise((resolve, reject) => {
				client.ping((error) => {
					resolve(! error);
				});
			});
		}
	};

	return createPool(factory, config.redis.poolOptions);
};
