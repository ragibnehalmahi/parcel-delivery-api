// src/app/modules/auth/auth.service.ts

import bcrypt from "bcryptjs";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import httpStatus from "http-status-codes";
import { Schema, model } from "mongoose";
import AppError from "../../../errorHelpers/appError";
import { User } from "../user/user.model";
import { IUser, UserStatus } from "../user/user.interface";

// Helper: JWT generator
const generateToken = (payload: object, secret: string, expiresIn: string | number): string => {
  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
};

// ------------------ LOGIN FUNCTION ------------------
const credentialsLogin = async (payload: Partial<IUser> | undefined | null) => {
  console.log("🔑 Service: Received payload:", payload);

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError(
      "Invalid request payload. Ensure email and password are provided in JSON body.",
      httpStatus.BAD_REQUEST
    );
  }

  if (!payload.email || !payload.password) {
    throw new AppError("Email and password are required.", httpStatus.BAD_REQUEST);
  }

  const { email, password } = payload;

  const existingUser = await User.findOne({ email }).select("+password");
  if (!existingUser) {
    throw new AppError("Email does not exist", httpStatus.BAD_REQUEST);
  }

  if (!existingUser.password) {
    throw new AppError("User password not found", httpStatus.INTERNAL_SERVER_ERROR);
  }

  const isPasswordMatched = await bcrypt.compare(password as string, existingUser.password as string);
  if (!isPasswordMatched) {
    throw new AppError("Incorrect Password", httpStatus.BAD_REQUEST);
  }

  const jwtPayload = {
    userId: existingUser._id,
    email: existingUser.email,
    role: existingUser.role,
  };

  const accessToken = generateToken(
    jwtPayload,
    process.env.JWT_ACCESS_SECRET as string,
    process.env.JWT_ACCESS_EXPIRES || "1h"
  );

  const refreshToken = generateToken(
    jwtPayload,
    process.env.JWT_REFRESH_SECRET as string,
    process.env.JWT_REFRESH_EXPIRES || "7d"
  );

  const { password: pass, ...rest } = existingUser.toObject();

  return {
    accessToken,
    refreshToken,
    user: rest,
  };
};

// ------------------ REFRESH TOKEN FUNCTION ------------------
const getNewAccessToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError("Refresh token is required", httpStatus.BAD_REQUEST);
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string
    ) as JwtPayload;

    const user = await User.findById(decoded.userId).select("+status +role +email");
    if (!user) throw new AppError("User not found", httpStatus.NOT_FOUND);

    if (
      user.status === UserStatus.BLOCKED ||
      user.status === UserStatus.DELETED ||
      user.status === UserStatus.INACTIVE
    ) {
      throw new AppError("User is blocked, deleted or inactive", httpStatus.FORBIDDEN);
    }

    const newAccessToken = generateToken(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_ACCESS_SECRET as string,
      process.env.JWT_ACCESS_EXPIRES || "1h"
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

// ------------------ PASSWORD CHANGE FUNCTION ------------------
const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string
) => {
  const user = await User.findById(userId).select("+password");
  if (!user) throw new AppError("User not found", httpStatus.NOT_FOUND);

  if (
    user.status === UserStatus.BLOCKED ||
    user.status === UserStatus.DELETED ||
    user.status === UserStatus.INACTIVE
  ) {
    throw new AppError("User is blocked, deleted or inactive", httpStatus.FORBIDDEN);
  }

  const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password as string);
  if (!isOldPasswordValid) throw new AppError("Old password incorrect", httpStatus.UNAUTHORIZED);

  const isSame = await bcrypt.compare(newPassword, user.password as string);
  if (isSame) throw new AppError("New password cannot be same as old", httpStatus.BAD_REQUEST);

  user.password = await bcrypt.hash(
    newPassword,
    Number(process.env.BCRYPT_SALT_ROUNDS) || 12
  );
  await user.save();

  return { message: "Password reset successful" };
};

// ------------------ TOKEN MODEL ------------------
const tokenSchema = new Schema(
  {
    token: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const TokenModel = model("Token", tokenSchema);

// ------------------ UPDATED LOGOUT FUNCTION ------------------
const logoutUser = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError("No refresh token provided", httpStatus.BAD_REQUEST);
  }

  // ✅ Remove the token from DB
  const deleted = await TokenModel.findOneAndDelete({ token: refreshToken });
  if (!deleted) {
    throw new AppError("Invalid or already expired token", httpStatus.NOT_FOUND);
  }

  console.log("✅ Token removed successfully from DB");

  return { message: "Logout successful" };
};

// ------------------ EXPORT ------------------
export const AuthService = {
  credentialsLogin,
  getNewAccessToken,
  changePassword,
  logoutUser,
};


