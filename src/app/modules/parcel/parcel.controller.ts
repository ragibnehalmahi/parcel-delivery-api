import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ParcelService } from "./parcel.service";
import { ParcelStatus } from "./parcel.interface";
//import { JwtPayload } from "jsonwebtoken";
//import { decodedToken } from "../../../../src/utils/";
import { UserRole } from "../user/user.interface";
//import {decodeToken} from "../../../../src/utils/"
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../../config/env";
import AppError from "../../../errorHelpers/appError";
import { IUser } from "../user/user.interface";
//import httpStatus from "http-status-codes"

 
 

export const decodedToken = (token: string): { userId: string; role: string; email: string } => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    return {
      userId: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };
  } catch (error) {
    throw new AppError(401,`Invalid token: ${error}` );
  }
};
// JWT payload টাইপ
type JwtUser = { userId: string; role: UserRole };

// 📦 Create parcel
export const createParcel = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  if (!token) throw new Error("Unauthorized: No token provided");

  const decode = decodedToken(token as string);
  if (!decode) throw new Error("Unauthorized: Invalid token");

  const senderId = decode.userId;
  const parcel = await ParcelService.createParcel(req.body, senderId);

  sendResponse(res, {
    success: true,
    status: httpStatus.CREATED,
    message: "Parcel created successfully",
    data: parcel,
  });
});

// 📦 Get all parcels (pagination)
export const getAllParcels = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await ParcelService.getAllParcels(page, limit);

  sendResponse(res, {
    success: true,
    status: httpStatus.OK,
    message: "Parcels retrieved successfully",
    data: result.data,
    metadata: result.meta,
  });
});

// 📦 Get single parcel (auth required)
export const getSingleParcel = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  if (!token) throw new Error("Unauthorized: No token provided");

  const decode = decodedToken(token as string);
  if (!decode) throw new Error("Unauthorized: Invalid token");

  const result = await ParcelService.getSingleParcel(req.params.id, decode as JwtUser);

  sendResponse(res, {
    success: true,
    status: httpStatus.OK,
    message: "Parcel retrieved successfully",
    data: result,
  });
});

// 📦 Confirm delivery
export const confirmDelivery = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  if (!token) throw new Error("Unauthorized: No token provided");

  const decode = decodedToken(token as string);
  if (!decode) throw new Error("Unauthorized: Invalid token");

  const result = await ParcelService.confirmDelivery(req.params.id, decode.userId);

  sendResponse(res, {
    success: true,
    status: httpStatus.OK,
    message: "Delivery confirmed successfully",
    data: result,
  });
});

// 📦 Cancel parcel
export const cancelParcel = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  if (!token) throw new Error("Unauthorized: No token provided");

  const decode = decodedToken(token as string);
  if (!decode) throw new Error("Unauthorized: Invalid token");

  const result = await ParcelService.cancelParcel(req.params.id, decode.userId);

  sendResponse(res, {
    success: true,
    status: httpStatus.OK,
    message: "Parcel cancelled successfully",
    data: result,
  });
});

// 📦 Block parcel
export const blockParcel = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  if (!token) throw new Error("Unauthorized: No token provided");

  const decode = decodedToken(token as string);
  if (!decode) throw new Error("Unauthorized: Invalid token");

  const result = await ParcelService.blockParcel(req.params.id, decode.userId);

  sendResponse(res, {
    success: true,
    status: httpStatus.OK,
    message: "Parcel blocked successfully",
    data: result,
  });
});

// 📦 Admin change status
export const adminChangeStatus = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  if (!token) throw new Error("Unauthorized: No token provided");

  const decode = decodedToken(token as string);
  if (!decode) throw new Error("Unauthorized: Invalid token");

  const { status, location, note } = req.body as {
    status: ParcelStatus;
    location?: string;
    note?: string;
  };

  const result = await ParcelService.adminChangeStatus(
    req.params.id,
    decode.userId,
    status,
    { location, note }
  );

  sendResponse(res, {
    success: true,
    status: httpStatus.OK,
    message: "Parcel status updated successfully",
    data: result,
  });
});

// 📦 Get my parcels
export const getMyParcels = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  if (!token) throw new Error("Unauthorized: No token provided");

  const decode = decodedToken(token as string);
  if (!decode) throw new Error("Unauthorized: Invalid token");

  const data = await ParcelService.getMyParcels(decode.userId);

  sendResponse(res, {
    success: true,
    status: httpStatus.OK,
    message: "My parcels retrieved successfully",
    data,
  });
});

// 📦 Get incoming parcels for receiver
export const getIncomingParcels = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  if (!token) throw new Error("Unauthorized: No token provided");

  const decode = decodedToken(token as string);
  if (!decode) throw new Error("Unauthorized: Invalid token");

  const data = await ParcelService.getIncomingParcels(decode.userId);

  sendResponse(res, {
    success: true,
    status: httpStatus.OK,
    message: "Incoming parcels retrieved successfully",
    data,
  });
});
