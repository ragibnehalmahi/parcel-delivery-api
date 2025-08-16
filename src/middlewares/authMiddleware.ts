 import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import { User } from '../app/modules/user/user.model';
import { UserRole, UserStatus } from  '../app/modules/user/user.interface';
//import AppError from '../errorHelpers/AppError';
//import { UserRole } from '../app/modules/user/user.interface';
// appError.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string
  ) {
    super(message);
  }
}
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;     // Changed from userId to _id to match your interface
        role: UserRole;
        status: UserStatus;
      };
    }
  }
}

export const authMiddleware = (...requiredRoles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Get token and check if it exists
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Please login to access this resource');
      }

      // 2. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        userId: string;
        role: UserRole;
        iat: number;
        exp: number;
      };

      // 3. Check if user still exists
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'User no longer exists');
      }

      // 4. Check if user is blocked
      if (user.status === UserStatus.BLOCKED) {
        throw new AppError(httpStatus.FORBIDDEN, 'Your account is blocked');
      }

      // 5. Check role permissions
      if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          'You do not have permission to access this resource'
        );
      }

      // 6. Attach user to request
     req.user = {
  _id: user._id.toString(),  // Must be _id
  role: user.role,
  status: user.status
};

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        next(new AppError(httpStatus.UNAUTHORIZED, 'Token expired. Please login again'));
      } else if (error instanceof jwt.JsonWebTokenError) {
        next(new AppError(httpStatus.UNAUTHORIZED, 'Invalid token. Please login again'));
      } else {
        next(error);
      }
    }
  };
};