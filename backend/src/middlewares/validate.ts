import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

/**
 * Generic Zod validation middleware.
 * Validates req.body, req.params, and/or req.query based on provided schemas.
 */
export const validate = (schema: {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params) as any;
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query) as any;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const path = issue.path.join('.') || '_root';
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(issue.message);
        }
        return next(ApiError.badRequest('Validation failed', formattedErrors));
      }
      next(error);
    }
  };
};
