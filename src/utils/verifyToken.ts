 import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config as envVars } from "../../src/app/config/env";
import { UserRole } from "../app/modules/user/user.interface";
import AppError from "../errorHelpers/appError";
import httpStatus from "http-status";

// Define a custom interface to extend the Request type
// interface AuthenticatedRequest extends Request {
//  user?: JwtPayload;
// }

export const verifyToken = (allowedRoles: UserRole | UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Check for authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        throw new AppError(httpStatus.UNAUTHORIZED, "No token provided");
      }

      // 2. Extract and verify token
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, envVars.JWT_ACCESS_SECRET) as JwtPayload;

      // 3. Attach user to request
      req.user = decoded;

      // 4. Handle role checking
      const rolesToCheck = Array.isArray(allowedRoles) 
        ? allowedRoles 
        : [allowedRoles];

      if (rolesToCheck.length > 0 && !rolesToCheck.includes(decoded.role)) {
        throw new AppError(httpStatus.FORBIDDEN, "Forbidden: insufficient permissions");
      }

      next();
    } catch (err) {
      // Handle specific JWT errors
      if (err instanceof jwt.JsonWebTokenError) {
        return next(new AppError(httpStatus.UNAUTHORIZED, "Invalid token"));
      }
      if (err instanceof jwt.TokenExpiredError) {
        return next(new AppError(httpStatus.UNAUTHORIZED, "Token expired"));
      }
      next(err);
    }
  };
};