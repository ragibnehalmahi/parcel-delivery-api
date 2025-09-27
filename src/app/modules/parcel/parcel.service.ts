import { Types } from "mongoose";
import httpStatus from "http-status-codes";
import AppError from "../../../errorHelpers/appError";
import { ParcelModel } from "./parcel.model";
import { User } from "../user/user.model";
import mongoose from "mongoose";
import { 
  ParcelDocument, 
  ParcelStatus, 
  CreateParcelDTO, 
  UpdateParcelStatusDTO,
  StatusLog 
} from "./parcel.interface";
import { UserRole } from "../user/user.interface"; // Assuming UserRole is imported

// Generate a unique tracking ID
const generateTrackingId = (): string => {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TRK-${datePart}-${randomPart}`;
};

// Calculate parcel fee based on weight and type
const calculateParcelFee = (weight: number, parcelType: string): number => {
  const baseFee = 50;
  const weightFee = weight * 10;
  let typeMultiplier = 1;

  switch (parcelType.toLowerCase()) {
    case 'fragile':
      typeMultiplier = 1.5;
      break;
    case 'express':
      typeMultiplier = 2.0;
      break;
    case 'document':
      typeMultiplier = 0.8;
      break;
    default:
      typeMultiplier = 1.0;
  }

  return Math.round((baseFee + weightFee) * typeMultiplier);
};

// Create a new parcel
const createParcel = async (payload: CreateParcelDTO, senderId: string): Promise<ParcelDocument> => {
    const trackingId = generateTrackingId();
    const parcelFee = calculateParcelFee(payload.weight, payload.parcelType);

    // FIX: Look up the receiver's user ID using their phone number
    const receiverUser = await User.findOne({ phone: payload.receiver.phone });

    const initialStatusLog: StatusLog = {
        status: ParcelStatus.REQUESTED,
        timestamp: new Date(),
        note: "Parcel created by sender",
    };

    const parcelData: Partial<ParcelDocument> = {
        trackingId,
        sender: new Types.ObjectId(senderId),
        receiver: {
            name: payload.receiver.name,
            phone: payload.receiver.phone,
            address: payload.receiver.address,
            
            userId: receiverUser ? receiverUser._id :undefined
        },
        parcelType: payload.parcelType,
        weight: payload.weight,
        deliveryAddress: payload.deliveryAddress,
        currentStatus: ParcelStatus.REQUESTED,
        parcelFee,
        estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        statusLogs: [initialStatusLog],
    };

    const parcel = await ParcelModel.create(parcelData);
    return parcel;
};

// Get all parcels (Admin only)
const getAllParcels = async (filters: any = {}): Promise<ParcelDocument[]> => {
  const query: any = {};

  if (filters.status) {
    query.currentStatus = filters.status;
  }
  if (filters.isCancelled !== undefined) {
    query.isCancelled = filters.isCancelled;
  }
  if (filters.isDelivered !== undefined) {
    query.isDelivered = filters.isDelivered;
  }
  if (filters.isBlocked !== undefined) {
    query.isBlocked = filters.isBlocked;
  }

  const parcels = await ParcelModel.find(query)
    .populate("sender", "name email phone")
    .populate("receiver.userId", "name email phone")
    .sort({ createdAt: -1 });

  return parcels;
};

// Get my parcels (Sender only)
const getMyParcels = async (senderId: string): Promise<ParcelDocument[]> => {
  const parcels = await ParcelModel.find({ sender: new Types.ObjectId(senderId) })
    .populate("sender", "name email phone")
    .populate("receiver.userId", "name email phone")
    .sort({ createdAt: -1 });

  return parcels;
};
const getIncomingParcels = async (receiverId: string): Promise<ParcelDocument[]> => {
  const parcels = await ParcelModel.find({ 
    "receiver.userId": new Types.ObjectId(receiverId) 
  })
    .populate("sender", "name email phone")
    .populate("receiver.userId", "name email phone")
    .sort({ createdAt: -1 });

  return parcels;
};

// Get single parcel with authorization
const getSingleParcel = async (parcelId: string, user: any): Promise<ParcelDocument> => {
  const parcel = await ParcelModel.findById(parcelId)
    .populate("sender", "name email phone")
    .populate("receiver.userId", "name email phone");

  if (!parcel) {
    throw new AppError("Parcel not found", httpStatus.NOT_FOUND);
  }

  // Authorization check
  const isSender = parcel.sender._id.toString() === user.userId;
  const isReceiver = parcel.receiver.userId?.toString() === user.userId;
  const isAdmin = user.role === UserRole.ADMIN;

  if (!isSender && !isReceiver && !isAdmin) {
    throw new AppError("Access denied", httpStatus.FORBIDDEN);
  }

  return parcel;
};

 
const cancelParcel = async (parcelId: string, userId: string): Promise<ParcelDocument> => {
  const parcel = await ParcelModel.findById(parcelId);

  if (!parcel) {
    throw new AppError("Parcel not found", httpStatus.NOT_FOUND);
  }

  // ✅ sender check (ObjectId safe compare)
  if (!new mongoose.Types.ObjectId(userId).equals(parcel.sender)) {
    throw new AppError("Only sender can cancel this parcel", httpStatus.FORBIDDEN);
  }

  if (parcel.currentStatus !== ParcelStatus.REQUESTED) {
    throw new AppError("Cannot cancel parcel after approval", httpStatus.BAD_REQUEST);
  }

  const statusLog: StatusLog = {
    status: ParcelStatus.CANCELLED,
    timestamp: new Date(),
    note: "Cancelled by sender",
  };

  parcel.currentStatus = ParcelStatus.CANCELLED;
  parcel.isCancelled = true;
  parcel.statusLogs.push(statusLog);

  await parcel.save();
  return parcel;
};
 
// Update parcel status (Admin only)
const updateParcelStatus = async (
  parcelId: string,
  payload: UpdateParcelStatusDTO,
  adminId: string
): Promise<ParcelDocument> => {
  const parcel = await ParcelModel.findById(parcelId);

  if (!parcel) {
    throw new AppError("Parcel not found", httpStatus.NOT_FOUND);
  }

  if (parcel.isCancelled) {
    throw new AppError("Cannot update cancelled parcel", httpStatus.BAD_REQUEST);
  }

  if (parcel.isDelivered) {
    throw new AppError("Cannot update delivered parcel", httpStatus.BAD_REQUEST);
  }

  const statusLog: StatusLog = {
    status: payload.status,
    timestamp: new Date(),
    location: payload.location,
    note: payload.note,
    updatedBy: new Types.ObjectId(adminId),
  };

  parcel.currentStatus = payload.status;
  
  if (payload.status === ParcelStatus.DELIVERED) {
    parcel.isDelivered = true;
  }
  
  parcel.statusLogs.push(statusLog);
  await parcel.save();

  return parcel;
};

// Delete parcel (Admin only)
const deleteParcel = async (parcelId: string): Promise<ParcelDocument> => {
  const parcel = await ParcelModel.findByIdAndDelete(parcelId);

  if (!parcel) {
    throw new AppError("Parcel not found", httpStatus.NOT_FOUND);
  }

  return parcel;
};
const confirmDelivery = async (
  parcelId: string,
  receiverId: string
): Promise<ParcelDocument> => {
  const parcel = await ParcelModel.findById(parcelId);

  // Check 1: Parcel exists
  if (!parcel) {
    throw new AppError("Parcel not found", httpStatus.NOT_FOUND);
  }

  // Check 2: User is the intended receiver
  // This uses the 'userId' that was saved during parcel creation
  if (parcel.receiver.userId?.toString() !== receiverId) {
    throw new AppError(
      "You are not authorized to confirm this delivery",
      httpStatus.FORBIDDEN
    );
  }

  // Check 3: Parcel is in a deliverable state (Dispatched or In Transit)
  if (
    ![ParcelStatus.IN_TRANSIT, ParcelStatus.DISPATCHED].includes(
      parcel.currentStatus
    )
  ) {
    throw new AppError(
      "Parcel not in a deliverable state",
      httpStatus.BAD_REQUEST
    );
  }

  // Check 4: Parcel is not already delivered or cancelled
  if (parcel.isDelivered) {
    throw new AppError("Parcel already delivered", httpStatus.BAD_REQUEST);
  }
  if (parcel.isCancelled) {
    throw new AppError("Cannot deliver cancelled parcel", httpStatus.BAD_REQUEST);
  }

  // Update parcel status and add a new status log
  const statusLog: StatusLog = {
    status: ParcelStatus.DELIVERED,
    timestamp: new Date(),
    note: "Delivery confirmed by receiver",
    updatedBy: new Types.ObjectId(receiverId), // Link log to the receiver's ID
  };

  parcel.currentStatus = ParcelStatus.DELIVERED;
  parcel.isDelivered = true;
  parcel.statusLogs.push(statusLog);

  await parcel.save();
  return parcel;
};

 const getParcelByTrackingId = async (
  trackingId: string
): Promise<Partial<ParcelDocument>> => {
  const parcel = await ParcelModel.findOne(
    { trackingId },
    {
      trackingId: 1,
      currentStatus: 1,
      estimatedDeliveryDate: 1,
      statusLogs: 1,
      _id: 0,
    }
  );

  if (!parcel) {
    throw new AppError("Parcel not found", httpStatus.NOT_FOUND);
  }

  return parcel.toObject();
};

 

 

export const ParcelService = {
  createParcel,
  getAllParcels,
  getMyParcels,
  getIncomingParcels,
  getSingleParcel,
  cancelParcel,
  updateParcelStatus,
  deleteParcel,
  confirmDelivery,
  getParcelByTrackingId,
  // getPublicParcelDetails
};
 
