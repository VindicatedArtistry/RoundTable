import winston from 'winston';

export function createLogger(service: string): winston.Logger {
  return winston.createLogger({
    level: process.env['LOG_LEVEL'] ?? 'info',
    defaultMeta: { service },
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
        ),
      }),
      new winston.transports.File({
        filename: process.env['LOG_FILE'] ?? 'logs/roundtable.log',
        maxsize: 10_000_000,
        maxFiles: 5,
      }),
    ],
  });
}
