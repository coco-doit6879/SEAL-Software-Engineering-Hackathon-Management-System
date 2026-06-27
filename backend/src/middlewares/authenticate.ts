import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}

/**
 * JWT authentication middleware.
 * Reads the token from Authorization: Bearer <token>,
 * verifies it, queries the user from DB, and attaches
 * a minimal user object to req.user.
 * Rejects if user status is not APPROVED.
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extract token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('You are not logged in. Please provide a valid token.');
    }
    const token = authHeader.split(' ')[1];

    // 2. Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // 3. Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw ApiError.unauthorized('The user belonging to this token no longer exists.');
    }

    // 4. Check if user is approved
    if (user.status !== 'APPROVED') {
      throw ApiError.forbidden(
        'Your account is not approved yet. Please wait for coordinator approval.'
      );
    }

    // 5. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    next(ApiError.unauthorized('Invalid token. Please log in again.'));
  }
};
