import httpStatus from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { envVars } from '../config/env';
import { User } from '../modules/user/user.model';
import { UserStatus, IUser } from '../modules/user/user.interface';
import AppError from '../../errorHelpers/appError';
 
import { verifyToken,generateToken } from './jwt';

// Generate access and refresh tokens from a user object
export const createUserTokens = (user: Partial<IUser>) => {
  const jwtPayload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateToken(
    jwtPayload,
    envVars.JWT_ACCESS_SECRET,
    envVars.JWT_ACCESS_EXPIRES
  );

  const refreshToken = generateToken(
    jwtPayload,
    envVars.JWT_REFRESH_SECRET,
    envVars.JWT_REFRESH_EXPIRES
  );

  return {
    accessToken,
    refreshToken,
  };
};

// Generate a new access token using a valid refresh token
export const createNewAccessTokenWithRefreshToken = async (
  refreshToken: string
): Promise<string> => {
  const decoded = verifyToken(
    refreshToken,
    envVars.JWT_REFRESH_SECRET
  ) as JwtPayload;

  const user = await User.findOne({ email: decoded.email });

  if (!user) {
    throw new AppError(  'User does not exist');
  }

  if (user.status === UserStatus.BLOCKED || user.status === UserStatus.INACTIVE) {
    throw new AppError(  `User is ${user.status}`);
  }

  if ((user as any).isDeleted) {
    throw new AppError(  'User is deleted');
  }

  const jwtPayload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };

  const newAccessToken = generateToken(
    jwtPayload,
    envVars.JWT_ACCESS_SECRET,
    envVars.JWT_ACCESS_EXPIRES
  );

  return newAccessToken;
};
 
