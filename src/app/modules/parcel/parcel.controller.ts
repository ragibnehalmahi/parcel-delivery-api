import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import catchAsync from "../../utils/catchAsync"; 
import sendResponse from "../../utils/sendResponse"; 
import { ParcelService } from "./parcel.service";
 import  { decodedToken } from "../../utils/decodeToken";
import AppError from "../../../errorHelpers/appError";
import { JwtPayload } from "jsonwebtoken";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";
 
 

// Create parcel
const createParcel = catchAsync(async (req: Request, res: Response) => {
  // Ensure logged-in user
  const user = req.user as JwtPayload;
  if (!user || !user._id) {
    throw new AppError("Unauthorized: No user found", httpStatus.UNAUTHORIZED);
  }

  // Call Service
  const parcel = await ParcelService.createParcel(req.body, user._id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Parcel created successfully",
    data: parcel,
  });
});


// Get all parcels (Admin only)
const getAllParcels = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    status: req.query.status as string,
    isCancelled: req.query.isCancelled ? req.query.isCancelled === 'true' : undefined,
    isDelivered: req.query.isDelivered ? req.query.isDelivered === 'true' : undefined,
    isBlocked: req.query.isBlocked ? req.query.isBlocked === 'true' : undefined,
  };

  const parcels = await ParcelService.getAllParcels(filters);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Parcels retrieved successfully",
    data: parcels,
  });
});
const getDeliveredParcels = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await ParcelService.getDeliveredParcels(user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Delivered parcels fetched successfully",
    data: result,
  });
});
// Get my parcels (Sender)
export const getMyParcels = catchAsync(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;

  if (!user || !user._id) {
    throw new AppError("Unauthorized: User data not found.", httpStatus.UNAUTHORIZED);
  }

  console.log("🔹 Sender ID from token:", user._id);

  const parcels = await ParcelService.getMyParcels(user._id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message:
      parcels.length > 0
        ? "Your parcels retrieved successfully"
        : "No parcels found",
    data: parcels,
  });
});

 
const getIncomingParcels = catchAsync(async (req: Request, res: Response) => {
  
  const user = req.user; 
  if (!user) {
    throw new AppError("Unauthorized: No user found", httpStatus.UNAUTHORIZED);
  }

   
  const parcels = await ParcelService.getIncomingParcels(user._id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Incoming parcels retrieved successfully",
    data: parcels,
  });
});


// Get single parcel
const getSingleParcel = catchAsync(async (req: Request, res: Response) => {
   
  if (!req.user) {
    throw new AppError("Unauthorized: No user found",httpStatus.UNAUTHORIZED );
  }

  const parcel = await ParcelService.getSingleParcel(req.params.id, req.user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Parcel retrieved successfully",
    data: parcel,
  });
});


 
const cancelParcel = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError("Unauthorized: No user found", httpStatus.UNAUTHORIZED);
  }

  const parcel = await ParcelService.cancelParcel(req.params.id, user._id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Parcel cancelled successfully",
    data: parcel,
  });
});


// Update parcel status (Admin only)
const updateParcelStatus = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError("Unauthorized: No user found", httpStatus.UNAUTHORIZED);
  }

  const parcel = await ParcelService.updateParcelStatus(
    req.params.id,
    req.body,
    user._id    
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Parcel status updated successfully",
    data: parcel,
  });
});


// Delete parcel (Admin only)
const deleteParcel = catchAsync(async (req: Request, res: Response) => {
  const parcel = await ParcelService.deleteParcel(req.params.id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Parcel deleted successfully",
    data: parcel,
  });
});
// Confirm delivery (Receiver only)
const confirmDelivery = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError("Unauthorized: No user found", httpStatus.UNAUTHORIZED);
  }

  const { id } = req.params; // ✅ এখন এটা parcelId হবে
  const receiverId = user._id;

  const parcel = await ParcelService.confirmDelivery(id, receiverId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Parcel delivery confirmed successfully",
    data: parcel,
  });
});


 // 🔹 Public tracking controller
const trackParcel = async (req: Request, res: Response) => {
  try {
    const { trackingId } = req.params;

    const parcel = await ParcelService.getParcelByTrackingId(trackingId);

    if (!parcel) {
      return res.status(404).json({
        success: false,
        message: "Parcel not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: parcel,
    });
  } catch (error) {
    console.error("❌ Error in trackParcel:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while tracking parcel",
    });
  }
};
const getParcelStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await ParcelService.getParcelStats();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Parcel statistics fetched successfully",
    data: stats,
  });
});

const blockParcel = catchAsync(async (req: Request, res: Response) => {
  const parcel = await ParcelService.blockParcel(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Parcel blocked successfully",
    data: parcel,
  });
});

const unblockParcel = catchAsync(async (req: Request, res: Response) => {
  const parcel = await ParcelService.unblockParcel(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Parcel unblocked successfully",
    data: parcel,
  });
});

const updateParcel = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new AppError("Unauthorized", httpStatus.UNAUTHORIZED);
  const parcel = await ParcelService.updateParcel(req.params.id, user, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Parcel updated successfully",
    data: parcel,
  });
});

 
export const ParcelController = {
  createParcel,
  getAllParcels,
  getMyParcels,
    getIncomingParcels,
  getSingleParcel,
  cancelParcel,
  updateParcelStatus,
  deleteParcel,
  confirmDelivery,
  trackParcel,
   getDeliveredParcels,
getParcelStats,
  blockParcel,
  unblockParcel,
  updateParcel,
};
 

 
