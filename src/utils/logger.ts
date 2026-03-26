/**
 * Isomorphic Logger
 *
 * Works on both server (Node.js) and client (browser with console)
 * Winston is only used on the server side via a separate import
 */

// Define Logger interface for compatibility
export interface LoggerInterface {
	info: (message: string, meta?: Record<string, unknown>) => void;
	warn: (message: string, meta?: Record<string, unknown>) => void;
	error: (message: string, meta?: Record<string, unknown>) => void;
	debug: (message: string, meta?: Record<string, unknown>) => void;
	verbose: (message: string, meta?: Record<string, unknown>) => void;
	child: (meta: Record<string, unknown>) => LoggerInterface;
}

// Console-based logger implementation (browser-safe)
class ConsoleLogger implements LoggerInterface {
	private service: string;

	constructor(service: string = 'the-roundtable') {
		this.service = service;
	}

	private formatMessage(level: string, message: string, meta?: Record<string, unknown>): string {
		const timestamp = new Date().toISOString();
		const metaStr = meta && Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
		return `${timestamp} [${this.service}] ${level}: ${message} ${metaStr}`;
	}

	info(message: string, meta?: Record<string, unknown>): void {
		console.log(this.formatMessage('info', message, meta));
	}

	warn(message: string, meta?: Record<string, unknown>): void {
		console.warn(this.formatMessage('warn', message, meta));
	}

	error(message: string, meta?: Record<string, unknown>): void {
		console.error(this.formatMessage('error', message, meta));
	}

	debug(message: string, meta?: Record<string, unknown>): void {
		if (process.env.NODE_ENV === 'development') {
			console.debug(this.formatMessage('debug', message, meta));
		}
	}

	verbose(message: string, meta?: Record<string, unknown>): void {
		if (process.env.NODE_ENV === 'development') {
			console.log(this.formatMessage('verbose', message, meta));
		}
	}

	child(meta: Record<string, unknown>): LoggerInterface {
		const childService = (meta.service as string) || this.service;
		return new ConsoleLogger(childService);
	}
}

// Create logger factory function (browser-safe)
export function createLogger(service: string): LoggerInterface {
	return new ConsoleLogger(service);
}

// Create main logger
const logger: LoggerInterface = new ConsoleLogger('the-roundtable');

// Export
export { logger };

// Export Logger alias
export const Logger = ConsoleLogger;

// Log levels for reference
export const logLevels = {
	error: 0,
	warn: 1,
	info: 2,
	http: 3,
	verbose: 4,
	debug: 5,
	silly: 6
};

export default createLogger;
