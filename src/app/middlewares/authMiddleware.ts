import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config/env"; // <-- adjust path if your file is ../config/env
import { UserRole, UserStatus } from "../modules/user/user.interface";

// Use an intersection type instead of extending Request to avoid conflicts
export type AuthenticatedRequest = Request & {
  user?: { _id: string; role: UserRole; status: UserStatus };
};

export const auth =
  (...allowedRoles: UserRole[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Missing or invalid token",
        });
      }

      const token = authHeader.split(" ")[1];

      const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload & {
        _id?: string;
        id?: string;
        userId?: string;
        role?: UserRole;
        status?: UserStatus;
      };

      // Normalize id field: support _id | userId | id
      const normalizedId =
        decoded._id || decoded.userId || decoded.id;

      if (!normalizedId || !decoded.role) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid token payload",
        });
      }

      // Ensure status exists (fallback if not present in token)
      const normalizedStatus = decoded.status ?? UserStatus.ACTIVE;

      // Attach to req.user using the expected shape
      req.user = {
        _id: normalizedId,
        role: decoded.role,
        status: normalizedStatus,
      };

      // Role-based access check (if roles provided)
      if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You do not have access to this resource",
        });
      }

      next();
    } catch {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or expired token",
      });
    }
  };
