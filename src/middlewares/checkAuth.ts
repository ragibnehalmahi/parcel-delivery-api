import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status-codes';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { verifyToken } from '../app/utils/jwt'; 
import { envVars } from '../app/config/env';
import AppError from '../errorHelpers/appError';

export const checkAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = req.headers.authorization;

    if (!accessToken) {
      throw new AppError( 'Unauthorized access');
    }

    const decoded = verifyToken(
      accessToken,
      envVars.JWT_ACCESS_SECRET
    ) as JwtPayload;

    // Attach user data to request for further use
    req.user = decoded;

    next();
  } catch (error) {
    next(error);
  }
};
