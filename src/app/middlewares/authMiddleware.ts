 
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload, TokenExpiredError } from "jsonwebtoken";
import { UserRole, UserStatus } from "../modules/user/user.interface";
import { envVars } from "../config";

// Custom request type (authenticated)
export type AuthenticatedRequest = Request & {
  user: { _id: string; role: UserRole; status: UserStatus };
};

// Auth middleware with role-based access control
export const auth =
  (...allowedRoles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Missing or invalid token",
        });
      }

      const token = authHeader.split(" ")[1];

      const decoded = jwt.verify(
        token,
        envVars.JWT_ACCESS_SECRET
      ) as JwtPayload & {
        _id?: string;
        id?: string;
        userId?: string;
        role?: UserRole;
        status?: UserStatus;
      };

      // Normalize ID (supports different key names)
      const normalizedId = decoded._id || decoded.userId || decoded.id;

      if (!normalizedId || !decoded.role) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid token payload",
        });
      }

      // Ensure status exists (default to ACTIVE)
      const normalizedStatus = decoded.status ?? UserStatus.ACTIVE;

      // Attach user info to request
      (req as AuthenticatedRequest).user = {
        _id: normalizedId,
        role: decoded.role,
        status: normalizedStatus,
      };

      // Role-based access check
      if (
        allowedRoles.length > 0 &&
        !allowedRoles.includes((req as AuthenticatedRequest).user.role)
      ) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: Role ${(req as AuthenticatedRequest).user.role} not allowed`,
        });
      }

      next();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Token expired",
        });
      }

      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or expired token",
      });
    }
  };
