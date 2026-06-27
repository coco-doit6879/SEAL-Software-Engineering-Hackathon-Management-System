import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

/**
 * Global Express error handler (4 params).
 * Distinguishes ApiError (operational) from unexpected errors.
 * Returns a consistent JSON response format.
 */
export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default to 500
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: Record<string, string[]> | undefined;
  let isOperational = false;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
    isOperational = err.isOperational;
  } else {
    // Unexpected error — log full details in dev
    console.error('UNEXPECTED ERROR:', err);
  }

  const response: Record<string, unknown> = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  // Include stack trace in development mode for debugging
  if (env.NODE_ENV === 'development' && !isOperational) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
