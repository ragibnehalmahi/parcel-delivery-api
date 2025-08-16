import httpStatus from "http-status-codes";
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs"; // Changed to bcryptjs for consistency
import AppError from "../../../errorHelpers/appError";
import { config } from "../../config/env";
import { User } from "../user/user.model";
import { IUser, UserRole } from "../user/user.interface";


// Function to handle user login and token generation
const credentialsLogin = async (payload: { email: string; password: string }) => {
  const { email, password } = payload;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError( httpStatus.NOT_FOUND,"User  not found",);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError(httpStatus.UNAUTHORIZED,"Invalid credentials", );
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(httpStatus.FORBIDDEN,"Your account is not active", );
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateAuthTokens(user);

  // Ensure password is not returned in the response
  user.password = "";

  return {
    user,
    accessToken,
    refreshToken,
  };
};

// Function to generate access and refresh tokens
const generateAuthTokens = (user: IUser) => {
  if (!user._id) {
    throw new AppError(httpStatus.BAD_REQUEST,"User  ID is missing while generating tokens", );
  }

  const accessTokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const accessToken = jwt.sign(
    accessTokenPayload,
    config.JWT_ACCESS_SECRET as string,
    { expiresIn: Number(config.JWT_ACCESS_EXPIRES) || 3600 } // Default to 1 hour
  );

  const refreshToken = jwt.sign(
    { id: user._id.toString() },
    config.JWT_REFRESH_SECRET as string,
    { expiresIn: Number(config.JWT_REFRESH_EXPIRES) || 604800 } // Default to 7 days
  );

  return { accessToken, refreshToken };
};

// Function to refresh access token using refresh token
const getNewAccessToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError(httpStatus.BAD_REQUEST,"Refresh token is required" );
  }

  try {
    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET as string) as JwtPayload;
    const user = await User.findById(decoded.id); // Changed from _id to id

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND,"User  not found" );
    }

    if (user.status !== "ACTIVE") {
      throw new AppError(httpStatus.FORBIDDEN,"Your account is not active" );
    }

    const newAccessToken = generateAuthTokens(user).accessToken;

    // Ensure password is not returned in the response
    user.password = "";

    return {
      user,
      accessToken: newAccessToken,
      refreshToken,
    };
  } catch (err) {
    throw new AppError(httpStatus.UNAUTHORIZED,"Invalid refresh token" );
  }
};

// Function to reset user password
// const resetPassword = async (oldPassword: string, newPassword: string, accessToken: JwtPayload) => {
//   const decoded = jwt.verify(accessToken, config.JWT_ACCESS_SECRET as string) as JwtPayload;
//   const user = await User.findById(decoded.id).select("+password"); // Ensure password is included for comparison

//   if (!user) {
//     throw new AppError(httpStatus.NOT_FOUND,"User  not found" );
//   }

//   const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
//   if (!isOldPasswordValid) {
//     throw new AppError(httpStatus.UNAUTHORIZED,"Old password is incorrect" );
//   }

//   const isNewPasswordSame = await bcrypt.compare(newPassword, user.password);
//   if (isNewPasswordSame) {
//     throw new AppError(httpStatus.BAD_REQUEST,"New password cannot be the same as the old password" );
//   }

//   user.password = await bcrypt.hash(newPassword, Number(config.BCRYPT_SALT_ROUND) || 12);
//   await user.save();

//   return { message: "Password reset successfully" };
// };

const resetPassword = async (
  oldPassword: string,
  newPassword: string,
  decodedToken: JwtPayload
): Promise<boolean> => {
  
  const user = await User.findById(decodedToken.id);


  if (!user) {
    throw new AppError(404,"User not found", );
  }

  const isOldPasswordMatch = await bcrypt.compare(oldPassword, user.password as string);
  if (!isOldPasswordMatch) {
    throw new AppError(403,"Old password doesn't match");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();  

  return true;
};
export const AuthServices = {
  credentialsLogin,
  getNewAccessToken,
  resetPassword,
};
