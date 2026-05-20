import { NextResponse, NextRequest } from 'next/server';
import { AppError } from './errors';
import { logger } from './logger';
import { ZodError } from 'zod';

type HandlerFunction = (req: NextRequest, context?: any) => Promise<NextResponse>;

/**
 * Higher-order function to wrap API route handlers.
 * Provides centralized error handling, logging, and standard response formatting.
 */
export function withErrorHandler(handler: HandlerFunction): HandlerFunction {
    return async (req: NextRequest, context?: any) => {
        try {
            // Execute the actual route handler
            return await handler(req, context);
        } catch (error: any) {
            const path = req.nextUrl.pathname;
            const method = req.method;

            // Handle Zod Validation Errors automatically
            if (error instanceof ZodError) {
                logger.warn(`Validation Error at ${method} ${path}`, { issues: error.issues });
                return NextResponse.json(
                    {
                        error: 'Validation Error',
                        code: 'VALIDATION_ERROR',
                        details: error.issues
                    },
                    { status: 400 }
                );
            }

            // Handle custom application errors
            if (error instanceof AppError) {
                if (error.statusCode >= 500) {
                    logger.error(`App Error at ${method} ${path}`, error, { errorCode: error.errorCode });
                } else {
                    logger.warn(`Client Error at ${method} ${path}`, {
                        message: error.message,
                        code: error.errorCode
                    });
                }

                return NextResponse.json(
                    {
                        error: error.message,
                        code: error.errorCode,
                        ...(error as any).details && { details: (error as any).details }
                    },
                    { status: error.statusCode }
                );
            }

            // Handle Prisma initialization/connection errors or unexpected crashes
            logger.error(`Unhandled Exception at ${method} ${path}`, error);

            return NextResponse.json(
                {
                    error: 'Internal Server Error',
                    code: 'INTERNAL_ERROR'
                },
                { status: 500 }
            );
        }
    };
}
