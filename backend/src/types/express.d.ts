import { Role, UserStatus } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        fullName: string;
        role: Role;
        status: UserStatus;
      };
    }
  }
}

export {};
