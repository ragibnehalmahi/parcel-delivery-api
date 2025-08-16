import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync"; 
import { sendResponse } from "../../utils/sendResponse";
import { UserServices } from "./user.service";
import { UserRole } from "./user.interface";

/**
 * Create a new user
 */
const createUser = catchAsync(async (req: Request, res: Response) => {
  const { user, tokens } = await UserServices.createUser(req.body);

  // Set cookies
  res.cookie('accessToken', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  sendResponse(res, {
    success: true,
    status: httpStatus.CREATED,
    message: "User Created Successfully",
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      tokens
    }
  });
});

/**
 * Update a user
 */
const updateUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const verifiedToken = req.user; // from auth middleware
  const payload = req.body;

  const user = await UserServices.updateUser(
    userId,
    payload,
    verifiedToken as JwtPayload
  );

  sendResponse(res, {
    success: true,
    status: httpStatus.OK,
    message: "User Updated Successfully",
    data: user,
  });
});

/**
 * Get all users
 */
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.getAllUsers();

  sendResponse(res, {
    success: true,
    status: httpStatus.OK,
    message: "All Users Retrieved Successfully",
    data: result.data,
     metadata: {
        totalCount:  result.data.length,
      },
  });
});

/**
 * Admin-only special feature
 * Example: Get sensitive system stats or all deleted/blocked users
 */
 

   

export const UserControllers = {
  createUser,
  getAllUsers,
  updateUser,
 
};
