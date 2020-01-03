
import { options } from './utils/config-loader-options';
import { loadConfiguration } from '@viva-eng/config-loader';

loadConfiguration(options).then(() => {
	const { logger } = require('./logger') as typeof import('./logger');
	const { shutdown } = require('./utils/shutdown') as typeof import('./utils/shutdown');

	// Make sure node.js warnings get properly logged
	process.on('warning', (warning) => {
		logger.warn(warning.stack);
	});

	// Catch uncaught exceptions so we can shutdown gracefully
	process.on('uncaughtException', (error) => {
		logger.error('Uncaught Exception', { error });
		shutdown.shutdown(1);
	});

	// Catch unhandled rejections so we can shutdown gracefully
	process.on('unhandledRejection', (error) => {
		logger.error('Unhandled Rejection', { error });
		shutdown.shutdown(1);
	});

	// Start the server
	require('./server');
});
