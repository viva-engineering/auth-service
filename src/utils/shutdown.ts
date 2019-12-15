
// 
// TODO: Move this to its own library
// 

import { logger } from '../logger';
import { Logger } from '@viva-eng/logger';
import { createInterface } from 'readline';

let shutdownTimeout: number = 30000;
let _isShuttingDown: boolean = false;

export interface OnShutdownCallback {
	(): Promise<void>;
}

export interface ShutdownConfig {
	logger: Logger;
	timeout: number;
}

export class ShutdownHandler {
	private shuttingDown: boolean = false;

	private readonly logger: Logger;
	private readonly timeout: number;
	private readonly handlers: OnShutdownCallback[] = [ ];

	constructor(config: ShutdownConfig) {
		process.on('SIGINT', this._shutdown);
		process.on('SIGTERM', this._shutdown);

		this.logger = config.logger;
		this.timeout = config.timeout;
	}

	/**
	 * Unregisters all listeners and destroys the shutdown handler
	 */
	public destroy() {
		process.removeListener('SIGINT', this._shutdown);
		process.removeListener('SIGTERM', this._shutdown);
	}

	/**
	 * Returns the shutdown status of the cluster. `true` for shutting down, `false` for running
	 */
	public get isShuttingDown() {
		return this.shuttingDown;
	}

	/**
	 * Adds a new listener, to be called when the server is preparing to shutdown
	 */
	public addOnShutdown(callback: OnShutdownCallback) {
		this.handlers.push(callback);
	}

	/**
	 * Removes an existing listener from the on shutdown handler list
	 */
	public removeOnShutdown(callback: OnShutdownCallback) {
		for (let i = 0; i < this.handlers.length; i++) {
			if (this.handlers[i] === callback) {
				this.handlers.splice(i--, 1);
			}
		}
	}

	/**
	 * Shuts down the process after allowing running tasks to clean up
	 *
	 * @param exitCode The exit code for the process to exit with
	 */
	public async shutdown(exitCode: number = 0) : Promise<never> {
		if (this.shuttingDown) {
			this.logger.warn('Already shutting down');

			return;
		}

		this.shuttingDown = true;

		this.logger.info('Beginning shutdown process', {
			exitCode,
			timeout: shutdownTimeout
		});

		const timeout = setTimeout(this.forceShutdown, shutdownTimeout, exitCode);
		const promises = this.handlers.slice().map((func) => func())

		await Promise.all(promises);

		clearTimeout(timeout);
		process.exit(exitCode);
	}

	private _shutdown = () => this.shutdown();

	private forceShutdown = (exitCode: number = 0, reason?: string) : void => {
		this.logger.warn('Forcing shutdown', { exitCode, reason });
		process.exit(exitCode);
	}
}

// On windows, we have to do some bullshit to catch the interupt signal
// directly from STDIN so we will be able to shutdown using Crtl+C
if (process.platform === 'win32') {
	const stdio = createInterface({
		input: process.stdin,
		output: process.stdout
	});

	stdio.on('SIGINT', () => {
		// When we catch the SIGINT here, we emit a fake SIGINT event on `process` to trigger
		// the other handler, and we also send an event down to all the workers to inform them
		// to do the same
		// @ts-ignore SIGINT is an "internal" event sort of, but we're gonna throw it anyway
		process.emit('SIGINT');
	});
}

export const shutdown = new ShutdownHandler({
	logger: logger,
	timeout: 30000
});
