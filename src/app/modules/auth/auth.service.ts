import bcrypt from "bcryptjs";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import httpStatus from "http-status-codes";
import { Schema, model } from "mongoose";

import AppError from "../../../errorHelpers/appError";
import { User } from "../user/user.model";
import { IUser, UserStatus } from "../user/user.interface";

// Helper function to generate JWT tokens
const generateToken = (payload: object, secret: string, expiresIn: string | number): string => {
  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
};

// Main login function
const credentialsLogin = async (payload: Partial<IUser>) => {
  const { email, password } = payload;

  // Check if user exists and select password field
  const existingUser = await User.findOne({ email }).select("+password");
  if (!existingUser) {
    throw new AppError("Email does not exist", httpStatus.BAD_REQUEST);
  }

  // Check if password exists (important for select+password)
  if (!existingUser.password) {
    throw new AppError("User password not found", httpStatus.INTERNAL_SERVER_ERROR);
  }

  // Check if password is valid
  const isPasswordMatched = await bcrypt.compare(password as string, existingUser.password as string);
  if (!isPasswordMatched) {
    throw new AppError("Incorrect Password", httpStatus.BAD_REQUEST);
  }

  // Create JWT payload
  const jwtPayload = {
    userId: existingUser._id,
    email: existingUser.email,
    role: existingUser.role,
  };

  // Generate tokens
  const accessToken = generateToken(
    jwtPayload,
    process.env.JWT_ACCESS_SECRET as string,
    process.env.JWT_ACCESS_EXPIRES as string || '1h'
  );

  const refreshToken = generateToken(
    jwtPayload,
    process.env.JWT_REFRESH_SECRET as string,
    process.env.JWT_REFRESH_EXPIRES as string || '7d'
  );

  // Remove password from user object before returning
  const { password: pass, ...rest } = existingUser.toObject();

  return {
    accessToken,
    refreshToken,
    user: rest,
  };
};

// Refresh Token Service
const getNewAccessToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError("Refresh token is required", httpStatus.BAD_REQUEST);
  }

  try {
    // Verify refresh token with REFRESH_SECRET
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string
    ) as JwtPayload;

    // Here we can take the userId from the decoded payload
    const user = await User.findById(decoded.userId).select("+status +role +email");

    if (!user) {
      throw new AppError("User not found", httpStatus.NOT_FOUND);
    }

    // Check user status
    if (
      user.status === UserStatus.BLOCKED ||
      user.status === UserStatus.DELETED ||
      user.status === UserStatus.INACTIVE
    ) {
      throw new AppError(
        "User is blocked, deleted or inactive",
        httpStatus.FORBIDDEN
      );
    }

    // Issue new access token with ACCESS_SECRET
    const newAccessToken = generateToken(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_ACCESS_SECRET as string,
      process.env.JWT_ACCESS_EXPIRES as string || "1h"
    );

    return {
      user,
      accessToken: newAccessToken,
      refreshToken,
    };
  } catch (err) {
    throw new AppError("Invalid refresh token", httpStatus.UNAUTHORIZED);
  }
};

// Reset Password Service
const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string
) => {
  // find user by id with password field
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  // check status
  if (
    user.status === UserStatus.BLOCKED ||
    user.status === UserStatus.DELETED ||
    user.status === UserStatus.INACTIVE
  ) {
    throw new AppError("User is blocked, deleted or inactive", httpStatus.FORBIDDEN);
  }

  // check old password
  const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password as string);
  if (!isOldPasswordValid) {
    throw new AppError("Old password incorrect", httpStatus.UNAUTHORIZED);
  }

  // check if new password same as old
  const isSame = await bcrypt.compare(newPassword, user.password as string);
  if (isSame) {
    throw new AppError("New password cannot be same as old", httpStatus.BAD_REQUEST);
  }

  // hash and save
  user.password = await bcrypt.hash(
    newPassword,
    Number(process.env.BCRYPT_SALT_ROUNDS) || 12
  );
  await user.save();

  return { message: "Password reset successful" };
};


// Logout Service
const tokenSchema = new Schema({
  token: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

const TokenModel = model('Token', tokenSchema);

const logoutUser = async (refreshToken: string) => {
  // remove refresh token from DB
  await TokenModel.findOneAndDelete({ token: refreshToken });
  return { message: "Logout successful" };
};

export const AuthService = {
  credentialsLogin,
  getNewAccessToken,
  changePassword,
  logoutUser,
};

