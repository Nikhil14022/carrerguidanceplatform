// A lightweight, centralized logger to handle different log levels.
// In a full production app, this can be swapped out for Pino, Winston, or Datadog without changing the rest of the app.

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
    private log(level: LogLevel, message: string, meta?: any) {
        const timestamp = new Date().toISOString();
        const logData = {
            timestamp,
            level: level.toUpperCase(),
            message,
            ...(meta && { meta })
        };

        // Serialize object so it logs cleanly
        const logString = JSON.stringify(logData);

        switch (level) {
            case 'debug':
                if (process.env.NODE_ENV !== 'production') console.debug(logString);
                break;
            case 'info':
                console.info(logString);
                break;
            case 'warn':
                console.warn(logString);
                break;
            case 'error':
                // Log to console, or trigger Sentry/Datadog here
                console.error(logString);
                break;
        }
    }

    debug(message: string, meta?: any) {
        this.log('debug', message, meta);
    }

    info(message: string, meta?: any) {
        this.log('info', message, meta);
    }

    warn(message: string, meta?: any) {
        this.log('warn', message, meta);
    }

    error(message: string, error?: Error | unknown, meta?: any) {
        const errorMeta = error instanceof Error
            ? { errorMessage: error.message, stack: error.stack, ...meta }
            : { error, ...meta };

        this.log('error', message, errorMeta);
    }
}

export const logger = new Logger();
