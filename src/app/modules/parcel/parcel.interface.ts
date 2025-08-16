import { Types } from "mongoose";

export enum ParcelStatus {
  PENDING = "PENDING",
  IN_TRANSIT = "IN_TRANSIT",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  BLOCKED = "BLOCKED",
}

export interface IStatusLog {
  status: ParcelStatus;
  timestamp: Date;
  updatedBy: Types.ObjectId; // who changed status (sender/receiver/admin)
  note?: string;
  location?: string;
}

export interface IParcel {
  _id?: Types.ObjectId;

  // relations
  sender: Types.ObjectId;
  receiver: Types.ObjectId;

  // core fields
  pickupLocation: string;
  dropoffLocation: string;
  weight: number;   // kg
  distance: number; // km

  deliveryFee: number;

  // lifecycle
  status: ParcelStatus;
  statusLogs: IStatusLog[];

  // flags
  isBlocked?: boolean;
  isDeleted?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}
