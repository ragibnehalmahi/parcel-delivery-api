import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { config } from "../../config/env";
import AppError from "../../../errorHelpers/appError";
import { IAuthProvider, IUser, UserRole, UserStatus } from "./user.interface";
import { User } from "./user.model";
import { generateAuthTokens } from "../auth/auth.service";
/**
 * Create a new user
 */
const createUser = async (payload: Partial<IUser>) => {
  const { email, password, ...rest } = payload;

  if (!email || !password) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email and password are required");
  }

  const isUserExist = await User.findOne({ email });
  if (isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User already exists");
  }

  const hashedPassword = await bcryptjs.hash(
    password as string,
    Number(config.BCRYPT_SALT_ROUND)
  );

  const authProvider: IAuthProvider = {
    provider: "credentials",
    providerId: email as string,
  };

  const user = await User.create({
    email,
    password: hashedPassword,
    authProviders: [authProvider],
    role: rest.role || UserRole.SENDER,
    status: rest.status || UserStatus.ACTIVE,
    ...rest,
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateAuthTokens(user);

  return {
    user,
    tokens: {
      accessToken,
      refreshToken
    }
  };
};


/**
 * Update user details
 */
const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  const existingUser = await User.findById(userId);

  if (!existingUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Prevent email update
  if (payload.email) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email cannot be updated");
  }

  // Role-based restrictions
  if (payload.role) {
    if (decodedToken.role === UserRole.SENDER || decodedToken.role === UserRole.RECEIVER) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to change roles");
    }

    if (payload.role === UserRole.ADMIN && decodedToken.role !== UserRole.ADMIN) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to promote to admin");
    }
  }

  // Status changes restricted
  if (payload.status || payload.isDeleted || payload.isVerified) {
    if (decodedToken.role !== UserRole.ADMIN) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to change user status");
    }
  }

  // Hash password if updated
  if (payload.password) {
    payload.password = await bcryptjs.hash(
      payload.password,
      Number(config.BCRYPT_SALT_ROUND)
    );
  }

  const updatedUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });

  return updatedUser;
};

/**
 * Get all users
 */
const getAllUsers = async () => {
  const users = await User.find({});
  const totalUsers = await User.countDocuments();
  return {
    data: users,
    meta: {
      total: totalUsers,
    },
  };
};

export const UserServices = {
  createUser,
  getAllUsers,
  updateUser,
};
