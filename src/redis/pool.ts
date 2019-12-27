
export type RedisDB = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

import { config } from '../config';
import { logger } from '../logger';
import { createPool, Factory, Pool } from 'generic-pool';
import { createClient, ClientOpts, RedisClient, Callback } from 'redis';
import { shutdown } from '../utils/shutdown';

export class RedisPool {
	protected readonly pool: Pool<RedisClient>;

	constructor(db: RedisDB, options?: Partial<ClientOpts>) {
		logger.verbose('Creating new redis pool', {
			host: config.redis.host,
			port: config.redis.port,
			db: db
		});

		shutdown.addOnShutdown(async () => {
			logger.verbose('Waiting for redus pool to close before shutting down...', {
				host: config.redis.host,
				port: config.redis.port,
				db: db
			});

			await this.close();

			logger.verbose('Redis pool closed', {
				host: config.redis.host,
				port: config.redis.port,
				db: db
			});
		});

		this.pool = createNewPool(db, options);
	}

	public acquire(priority?: number) {
		return this.pool.acquire(priority);
	}

	public release(client: RedisClient) {
		this.pool.release(client);
	}

	public set(key: string, value: string, expiration?: number) {
		return new Promise(async (resolve, reject) => {
			const client = await this.acquire();
			const callback: Callback<'OK'> = (error) => {
				this.release(client);

				if (error) {
					return reject(error);
				}

				resolve();
			};

			if (expiration) {
				client.set(key, value, 'EX', expiration, callback);
			}

			else {
				client.set(key, value, callback);
			}
		});
	}

	public get(key: string) : Promise<string> {
		return new Promise(async (resolve, reject) => {
			const client = await this.acquire();
			const callback: Callback<string> = (error, result) => {
				this.release(client);

				if (error) {
					return reject(error);
				}

				resolve(result);
			};

			client.get(key, callback);
		});
	}

	public del(keys: string[]) : Promise<number> {
		return new Promise(async (resolve, reject) => {
			const client = await this.acquire();
			const callback: Callback<number> = (error, count) => {
				this.release(client);

				if (error) {
					return reject(error);
				}

				resolve(count);
			};

			client.del(...keys, callback);
		});
	}

	public hmset<T extends object>(key: string, ...values: (string | number)[]) {
		return new Promise(async (resolve, reject) => {
			const client = await this.acquire();
			const callback: Callback<'OK'> = (error) => {
				this.release(client);

				if (error) {
					return reject(error);
				}

				resolve();
			};

			client.hmset(key, ...values, callback);
		});
	}

	public hgetall<T extends object>(key: string) : Promise<T> {
		return new Promise(async (resolve, reject) => {
			const client = await this.acquire();
			const callback: Callback<object> = (error, result) => {
				this.release(client);

				if (error) {
					return reject(error);
				}

				resolve();
			};

			client.hgetall(key, callback);
		});
	}

	public multi(commands: any[][]) : Promise<any[]> {
		return new Promise(async (resolve, reject) => {
			const client = await this.acquire();
			const callback: Callback<string[]> = (error, results) => {
				this.release(client);

				if (error) {
					return reject(error);
				}

				resolve(results);
			};

			client.multi(commands).exec(callback);
		})
	}

	public batch(commands: any[][]) : Promise<any[]> {
		return new Promise(async (resolve, reject) => {
			const client = await this.acquire();
			const callback: Callback<string[]> = (error, results) => {
				this.release(client);

				if (error) {
					return reject(error);
				}

				resolve(results);
			};

			client.batch(commands).exec(callback);
		})
	}

	public async close() {
		await this.pool.drain();
		await this.pool.clear();
	}
}

// 
// TODO: Add error handlers
// 

const createNewPool = (db: RedisDB, options?: Partial<ClientOpts>) => {
	const factory: Factory<RedisClient> = {
		create() {
			logger.debug('Creating new redis client', {
				host: config.redis.host,
				port: config.redis.port,
				db: db
			});

			return new Promise((resolve, reject) => {
				const client = createClient({
					host: config.redis.host,
					port: config.redis.port,
					password: config.redis.password,
					db: db,
					...(options || { })
				});

				let fulfilled = false;

				client.on('error', (error) => {
					logger.error('Redis client encountered an error', {
						host: config.redis.host,
						port: config.redis.port,
						db: db,
						error
					});

					if (! fulfilled) {
						fulfilled = true;
						reject(error);
					}
				});

				client.on('ready', () => {
					logger.debug('New redis client ready', {
						host: config.redis.host,
						port: config.redis.port,
						db: db
					});
					fulfilled = true;
					resolve(client);
				});
			});
		},
		destroy(client: RedisClient) {
			logger.verbose('Destroying redis client', {
				host: config.redis.host,
				port: config.redis.port,
				db: db
			});

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
