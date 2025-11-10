import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload, TokenExpiredError } from "jsonwebtoken";
import { UserRole, UserStatus } from "../modules/user/user.interface";
import { envVars } from "../config";

export type AuthenticatedRequest = Request & {
  user: { _id: string; role: UserRole; status: UserStatus };
};

export const auth =
  (...allowedRoles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.cookies?.accessToken || req.headers?.authorization;

      console.log("🔹 Auth Header:", authHeader);
      console.log("🔹 Cookies:", req.cookies);

      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Missing or invalid token",
        });
      }

      // Handle both Bearer and cookie tokens
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;

      const decoded = jwt.verify(token, envVars.JWT_ACCESS_SECRET) as JwtPayload & {
        _id?: string;
        id?: string;
        userId?: string;
        role?: UserRole;
        status?: UserStatus;
      };

      const normalizedId = decoded._id || decoded.userId || decoded.id;

      if (!normalizedId || !decoded.role) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid token payload",
        });
      }

      (req as AuthenticatedRequest).user = {
        _id: normalizedId,
        role: decoded.role,
        status: decoded.status ?? UserStatus.ACTIVE,
      };

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
