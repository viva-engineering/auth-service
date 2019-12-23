
import { config } from '../config';
import { logger } from '../logger';
import { shutdown } from '../utils/shutdown';
import { DatabasePool } from '@viva-eng/database';

logger.verbose('Initializing database pool', {
	master: config.database.master.host,
	replica: config.database.replica.host
});

export const db = new DatabasePool({
	master: config.database.master,
	replica: config.database.replica,
	logger: logger
});

export enum Bit {
	False = '0',
	True = '1'
}

shutdown.addOnShutdown(async () => {
	logger.verbose('Waiting for database pool to close before shutting down...');

	await db.destroy();

	logger.verbose('Database pool closed');
});
