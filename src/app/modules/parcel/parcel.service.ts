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
  StatusLog,
} from "./parcel.interface";
import { UserRole } from "../user/user.interface";

// Generate tracking ID
const generateTrackingId = (): string => {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TRK-${datePart}-${randomPart}`;
};

// Calculate fee
const calculateParcelFee = (weight: number, parcelType: string): number => {
  const baseFee = 50;
  const weightFee = weight * 10;
  let typeMultiplier = 1;

  switch (parcelType.toLowerCase()) {
    case 'fragile': typeMultiplier = 1.5; break;
    case 'express': typeMultiplier = 2.0; break;
    case 'document': typeMultiplier = 0.8; break;
  }

  return Math.round((baseFee + weightFee) * typeMultiplier);
};

// ✅ Create parcel
export const createParcel = async (
  payload: any,
  senderId: string
): Promise<ParcelDocument> => {
  const trackingId = generateTrackingId();
  const parcelFee = calculateParcelFee(payload.weight, payload.parcelType);

  // Optional: find receiver user if exists
  const receiverUser = await User.findOne({ phone: payload.receiverPhone });

  const initialStatusLog: StatusLog = {
    status: ParcelStatus.REQUESTED,
    timestamp: new Date(),
    note: "Parcel created by sender",
  };

  // ✅ Now mapping flat payload
  const parcelData: Partial<ParcelDocument> = {
    trackingId,
    sender: new Types.ObjectId(senderId),
    receiver: {
      name: payload.receiverName,
      phone: payload.receiverPhone,
      address: payload.receiverAddress,
      userId: receiverUser ? receiverUser._id : undefined,
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


// ✅ Get all parcels (Admin)
const getAllParcels = async (filters: any = {}): Promise<ParcelDocument[]> => {
  const query: any = {};

  if (filters.status) query.currentStatus = filters.status;
  if (filters.isCancelled !== undefined) query.isCancelled = filters.isCancelled;
  if (filters.isDelivered !== undefined) query.isDelivered = filters.isDelivered;
  if (filters.isBlocked !== undefined) query.isBlocked = filters.isBlocked;

  const parcels = await ParcelModel.find(query)
    .populate("sender", "name email phone")
    .populate("receiver.userId", "name email phone")
    .sort({ createdAt: -1 });

  return parcels;
};

// ✅ Get sender’s parcels
const getMyParcels = async (senderId: string) => {
  return await ParcelModel.find({ sender: new Types.ObjectId(senderId) })
    .populate("sender", "name email phone")
    .populate("receiver.userId", "name email phone")
    .sort({ createdAt: -1 });
};

// ✅ Get receiver incoming parcels
const getIncomingParcels = async (receiverId: string) => {
  return await ParcelModel.find({ "receiver.userId": new Types.ObjectId(receiverId) })
    .populate("sender", "name email phone")
    .populate("receiver.userId", "name email phone")
    .sort({ createdAt: -1 });
};

// ✅ Get delivered parcels
const getDeliveredParcels = async (user: any) => {
  const filter: any = { currentStatus: "Delivered" };
  if (user.role === "sender") filter.sender = new Types.ObjectId(user._id);
  if (user.role === "receiver") filter["receiver.userId"] = new Types.ObjectId(user._id);

  return await ParcelModel.find(filter)
    .populate("sender", "name email phone")
    .populate("receiver.userId", "name email phone")
    .sort({ updatedAt: -1 });
};

// ✅ Get single parcel with access control
const getSingleParcel = async (parcelId: string, user: any) => {
  const parcel = await ParcelModel.findById(parcelId)
    .populate("sender", "name email phone")
    .populate("receiver.userId", "name email phone");

  if (!parcel) throw new AppError("Parcel not found", httpStatus.NOT_FOUND);

  const isSender = parcel.sender._id.toString() === user.userId;
  const isReceiver = parcel.receiver.userId?.toString() === user.userId;
  const isAdmin = user.role === UserRole.ADMIN;

  if (!isSender && !isReceiver && !isAdmin) {
    throw new AppError("Access denied", httpStatus.FORBIDDEN);
  }

  return parcel;
};

// ✅ Cancel parcel (Sender)
const cancelParcel = async (parcelId: string, userId: string) => {
  const parcel = await ParcelModel.findById(parcelId);
  if (!parcel) throw new AppError("Parcel not found", httpStatus.NOT_FOUND);
  if (!new mongoose.Types.ObjectId(userId).equals(parcel.sender)) {
    throw new AppError("Only sender can cancel this parcel", httpStatus.FORBIDDEN);
  }
  if (parcel.currentStatus !== ParcelStatus.REQUESTED) {
    throw new AppError("Cannot cancel after approval", httpStatus.BAD_REQUEST);
  }

  parcel.currentStatus = ParcelStatus.CANCELLED;
  parcel.isCancelled = true;
  parcel.statusLogs.push({
    status: ParcelStatus.CANCELLED,
    timestamp: new Date(),
    note: "Cancelled by sender",
  });

  await parcel.save();
  return parcel;
};

// ✅ Update status (Admin)
const updateParcelStatus = async (parcelId: string, payload: UpdateParcelStatusDTO, adminId: string) => {
  const parcel = await ParcelModel.findById(parcelId);
  if (!parcel) throw new AppError("Parcel not found", httpStatus.NOT_FOUND);
  if (parcel.isCancelled) throw new AppError("Cannot update cancelled parcel", httpStatus.BAD_REQUEST);
  if (parcel.isDelivered) throw new AppError("Cannot update delivered parcel", httpStatus.BAD_REQUEST);

  parcel.currentStatus = payload.status;
  if (payload.status === ParcelStatus.DELIVERED) parcel.isDelivered = true;

  parcel.statusLogs.push({
    status: payload.status,
    timestamp: new Date(),
    note: payload.note,
    updatedBy: new Types.ObjectId(adminId),
  });

  await parcel.save();
  return parcel;
};

// ✅ Block & Unblock parcel (Admin)
const blockParcel = async (parcelId: string) => {
  const parcel = await ParcelModel.findById(parcelId);
  if (!parcel) throw new AppError("Parcel not found", httpStatus.NOT_FOUND);
  parcel.isBlocked = true;
  await parcel.save();
  return parcel;
};

const unblockParcel = async (parcelId: string) => {
  const parcel = await ParcelModel.findById(parcelId);
  if (!parcel) throw new AppError("Parcel not found", httpStatus.NOT_FOUND);
  parcel.isBlocked = false;
  await parcel.save();
  return parcel;
};

// ✅ Update parcel (Sender or Admin)
const updateParcel = async (parcelId: string, user: any, payload: Partial<CreateParcelDTO>) => {
  const parcel = await ParcelModel.findById(parcelId);
  if (!parcel) throw new AppError("Parcel not found", httpStatus.NOT_FOUND);

  if (user.role !== UserRole.ADMIN && parcel.sender.toString() !== user._id) {
    throw new AppError("Not authorized to update parcel", httpStatus.FORBIDDEN);
  }

  Object.assign(parcel, payload);
  await parcel.save();
  return parcel;
};

// ✅ Parcel Stats (Admin)
const getParcelStats = async () => {
  const total = await ParcelModel.countDocuments();
  const delivered = await ParcelModel.countDocuments({ isDelivered: true });
  const cancelled = await ParcelModel.countDocuments({ isCancelled: true });
  const inTransit = await ParcelModel.countDocuments({ currentStatus: ParcelStatus.IN_TRANSIT });
  const requested = await ParcelModel.countDocuments({ currentStatus: ParcelStatus.REQUESTED });

  return { total, delivered, cancelled, inTransit, requested };
};

const deleteParcel = async (parcelId: string) => {
  const parcel = await ParcelModel.findByIdAndDelete(parcelId);
  if (!parcel) throw new AppError("Parcel not found", httpStatus.NOT_FOUND);
  return parcel;
};
// ✅ FIXED confirmDelivery function
export const confirmDelivery = async (
  parcelId: string,
  userId: string
): Promise<ParcelDocument> => {
  // 🔹 আগে trackingId দিয়ে খুঁজছিলে — এখন parcelId দিয়ে খুঁজবে
  const parcel = await ParcelModel.findById(parcelId);

  if (!parcel) {
    throw new AppError("Parcel not found", httpStatus.NOT_FOUND);
  }

  // 🔹 Already delivered check
  if (parcel.currentStatus === ParcelStatus.DELIVERED || parcel.isDelivered) {
    throw new AppError("Parcel already delivered", httpStatus.BAD_REQUEST);
  }

  // 🔹 Update delivery info
  parcel.currentStatus = ParcelStatus.DELIVERED;
  parcel.isDelivered = true;

  // 🔹 Add log
  const deliveryLog: StatusLog = {
    status: ParcelStatus.DELIVERED,
    timestamp: new Date(),
    updatedBy: new Types.ObjectId(userId),
    note: "Parcel delivered successfully",
  };

  parcel.statusLogs.push(deliveryLog);
  await parcel.save();

  return parcel;
};


/**
 * ✅ Get Parcel by Tracking ID (Public / Authenticated)
 */
export const getParcelByTrackingId = async (
  trackingId: string
): Promise<ParcelDocument> => {
  const parcel = await ParcelModel.findOne({ trackingId })
    .populate("sender", "name email phone")
    .populate("receiver.userId", "name email phone");

  if (!parcel) {
    throw new AppError("Parcel not found", httpStatus.NOT_FOUND);
  }

  return parcel;
};

export const ParcelService = {
  createParcel,
  confirmDelivery,
  getAllParcels,
  getMyParcels,
  getIncomingParcels,
  getParcelByTrackingId,
  getSingleParcel,
  cancelParcel,
  updateParcelStatus,
  blockParcel,
  unblockParcel,
  updateParcel,
  getParcelStats,
  deleteParcel,
  getDeliveredParcels,
};
