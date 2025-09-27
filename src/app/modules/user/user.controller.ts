/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
 
import { UserServices } from "./user.service";
import AppError from "../../../errorHelpers/appError";
 // Create a new user
 
const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await UserServices.createUser(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User Created Successfully",
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    }
  });
});

 
 //Update a user
 
const updateUser = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as { _id: string; role: string; status: string };

   
  const { id } = req.params;

  const updatedUser = await UserServices.updateUser(id, req.body, authUser);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User updated successfully",
    data: updatedUser,
  });
});



 
 //Get all users
 
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.getAllUsers();

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All users fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});
const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  // req.user comes from auth middleware
  const userId = (req as any).user._id; 
  
  const user = await UserServices.getMyProfile(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Profile retrieved successfully",
    data: user,
  });
});
 
export const UserControllers = {
  createUser,
  getAllUsers,
  updateUser,
  getMyProfile
};

