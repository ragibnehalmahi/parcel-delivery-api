import { Types } from "mongoose";
import httpStatus from "http-status";
import AppError from "../../../errorHelpers/appError";
import { Parcel } from "./parcel.model";
import { IParcel, ParcelStatus } from "./parcel.interface";
import { UserRole } from "../user/user.interface";

const BASE_FEE = 50;     // base currency units
const PER_KG_RATE = 20;  // per kg
const PER_KM_RATE = 10;  // per km

const calcDeliveryFee = (weight: number, distance: number) =>
  BASE_FEE + weight * PER_KG_RATE + distance * PER_KM_RATE;

/**
 * Create Parcel (sender from token)
 */
const createParcel = async (
  data: {
    receiver: string;
    pickupLocation: string;
    dropoffLocation: string;
    weight: number;
    distance: number;
    note?: string;
  },
  senderId: string
) => {
  const deliveryFee = calcDeliveryFee(data.weight, data.distance);

  const parcel = await Parcel.create({
    sender: new Types.ObjectId(senderId),
    receiver: new Types.ObjectId(data.receiver),
    pickupLocation: data.pickupLocation,
    dropoffLocation: data.dropoffLocation,
    weight: data.weight,
    distance: data.distance,
    deliveryFee,
    status: ParcelStatus.PENDING,
    statusLogs: [
      {
        status: ParcelStatus.PENDING,
        timestamp: new Date(),
        updatedBy: new Types.ObjectId(senderId),
        note: data.note,
      },
    ],
  });

  return parcel;
};

/**
 * Admin: Get paginated parcels
 */
const getAllParcels = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Parcel.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Parcel.countDocuments({ isDeleted: false }),
  ]);

  return {
    data,
    meta: { total, page, limit },
  };
};

/**
 * Role-restricted accessor:
 *  - Admin: any parcel
 *  - Sender: only own parcels
 *  - Receiver: only own parcels
 */
const getSingleParcel = async (
  id: string,
  user: { userId: string; role: UserRole }
) => {
  const parcel = await Parcel.findById(id);
  if (!parcel || parcel.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel not found");
  }

  const isSender = parcel.sender.toString() === user.userId;
  const isReceiver = parcel.receiver.toString() === user.userId;

  if (user.role !== UserRole.ADMIN && !isSender && !isReceiver) {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied");
  }

  return parcel;
};

/**
 * Receiver confirms delivery
 */
const confirmDelivery = async (id: string, receiverId: string) => {
  const parcel = await Parcel.findById(id);
  if (!parcel || parcel.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel not found");
  }

  if (parcel.receiver.toString() !== receiverId) {
    throw new AppError(httpStatus.FORBIDDEN, "Only the receiver can confirm delivery");
  }

  if (parcel.status === ParcelStatus.DELIVERED) {
    return parcel;
  }

  parcel.status = ParcelStatus.DELIVERED;
  parcel.statusLogs.push({
    status: ParcelStatus.DELIVERED,
    timestamp: new Date(),
    updatedBy: new Types.ObjectId(receiverId),
  });

  await parcel.save();
  return parcel;
};

/**
 * Sender cancels before delivered
 */
const cancelParcel = async (id: string, senderId: string) => {
  const parcel = await Parcel.findById(id);
  if (!parcel || parcel.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel not found");
  }

  if (parcel.sender.toString() !== senderId) {
    throw new AppError(httpStatus.FORBIDDEN, "Only the sender can cancel this parcel");
  }

  if (parcel.status === ParcelStatus.DELIVERED) {
    throw new AppError(httpStatus.BAD_REQUEST, "Delivered parcels cannot be cancelled");
  }

  parcel.status = ParcelStatus.CANCELLED;
  parcel.statusLogs.push({
    status: ParcelStatus.CANCELLED,
    timestamp: new Date(),
    updatedBy: new Types.ObjectId(senderId),
  });

  await parcel.save();
  return parcel;
};

/**
 * Admin: block parcel
 */
const blockParcel = async (id: string, adminId: string) => {
  const parcel = await Parcel.findById(id);
  if (!parcel || parcel.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel not found");
  }

  parcel.isBlocked = true;
  parcel.status = ParcelStatus.BLOCKED;
  parcel.statusLogs.push({
    status: ParcelStatus.BLOCKED,
    timestamp: new Date(),
    updatedBy: new Types.ObjectId(adminId),
    note: "Blocked by admin",
  });

  await parcel.save();
  return parcel;
};

/**
 * Admin: update status to PENDING / IN_TRANSIT (not delivered/cancelled/block here)
 */
const adminChangeStatus = async (
  id: string,
  adminId: string,
  status: ParcelStatus,
  opts?: { location?: string; note?: string }
) => {
  if (![ParcelStatus.PENDING, ParcelStatus.IN_TRANSIT].includes(status)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only PENDING or IN_TRANSIT can be set via this endpoint"
    );
  }

  const parcel = await Parcel.findById(id);
  if (!parcel || parcel.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel not found");
  }

  parcel.status = status;
  parcel.statusLogs.push({
    status,
    timestamp: new Date(),
    updatedBy: new Types.ObjectId(adminId),
    location: opts?.location,
    note: opts?.note,
  });

  await parcel.save();
  return parcel;
};

/**
 * Sender: get my parcels
 */
const getMyParcels = async (senderId: string) => {
  const parcels = await Parcel.find({
    sender: new Types.ObjectId(senderId),
    isDeleted: false,
  }).sort({ createdAt: -1 });

  return parcels;
};

/**
 * Receiver: incoming parcels
 */
const getIncomingParcels = async (receiverId: string) => {
  const parcels = await Parcel.find({
    receiver: new Types.ObjectId(receiverId),
    isDeleted: false,
  }).sort({ createdAt: -1 });

  return parcels;
};

export const ParcelService = {
  createParcel,
  getAllParcels,
  getSingleParcel,
  confirmDelivery,
  cancelParcel,
  blockParcel,
  adminChangeStatus,
  getMyParcels,
  getIncomingParcels,
};
