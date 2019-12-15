
import { config } from '../config';
import { PrettyFormat } from './pretty';
import { Logger, JsonFormat, StdoutOutput } from '@viva-eng/logger';

export const logger = new Logger({
	format: config.logging.output === 'json' ? JsonFormat : PrettyFormat,
	output: new StdoutOutput(),
	level: config.logging.logLevel,
	colors: config.logging.colors
});

if (config.logging.stackTraceLimit) {
	Error.stackTraceLimit = config.logging.stackTraceLimit;
}
