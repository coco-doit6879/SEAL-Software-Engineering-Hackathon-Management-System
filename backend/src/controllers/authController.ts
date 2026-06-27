import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { AppError } from '../middlewares/error';
import { AuthenticatedRequest } from '../middlewares/auth';
import { Role, UserStatus } from '@prisma/client';

const signToken = (id: string): string => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'your_jwt_super_secret_key_for_seal_hms',
    {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
    }
  );
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      email,
      password,
      fullName,
      isFptStudent,
      studentCode,
      university,
    } = req.body;

    if (!email || !password || !fullName) {
      return next(
        new AppError('Please provide email, password, and full name.', 400)
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return next(new AppError('Email is already in use.', 400));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with nesting profile for STUDENT
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        fullName,
        role: Role.STUDENT,
        status: UserStatus.APPROVED, // Approve by default for quick hackathon setup
        studentProfile: {
          create: {
            isFptStudent:
              isFptStudent !== undefined ? Boolean(isFptStudent) : true,
            studentCode: studentCode || 'UNASSIGNED',
            university: university || 'FPT University HCMC',
          },
        },
      },
      include: {
        studentProfile: true,
      },
    });

    // Generate token
    const token = signToken(newUser.id);

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password.', 400));
    }

    // Find user and include studentProfile if exists
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: true,
      },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return next(new AppError('Incorrect email or password.', 401));
    }

    // Generate token
    const token = signToken(user.id);

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('User not found on request.', 404));
    }

    // Fetch user details including studentProfile
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        studentProfile: true,
      },
    });

    if (!user) {
      return next(new AppError('User no longer exists.', 404));
    }

    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(200).json({
      status: 'success',
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    next(error);
  }
};
