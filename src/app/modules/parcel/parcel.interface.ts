 
import { Types } from "mongoose";

 
export enum ParcelStatus {
  REQUESTED = "Requested",
  APPROVED = "Approved",
  DISPATCHED = "Dispatched",
  PICKED = "Picked",
  IN_TRANSIT = "In Transit",
  HELD = "Held",
  DELIVERED = "Delivered",
  RETURNED = "Returned",
  CANCELLED = "Cancelled",
}

 
export interface StatusLog {
  status: ParcelStatus;
  timestamp: Date;
  location?: string;
  updatedBy?: Types.ObjectId;
  note?: string;
}

 
export interface ParcelDocument {
  _id?: Types.ObjectId;
  trackingId: string;
  sender: Types.ObjectId;
  receiver: {
    name: string;
    phone: string;
    address: string;
    userId?: Types.ObjectId;
  };
  parcelType: string;
  weight: number;
  deliveryAddress: string;
  currentStatus: ParcelStatus;
  parcelFee?: number;
  estimatedDeliveryDate?: Date;
  isCancelled: boolean;
  isDelivered: boolean;
  isBlocked?: boolean;
  statusLogs: StatusLog[];
  createdAt?: Date;
  updatedAt?: Date;
}

 
export interface CreateParcelDTO {
  receiver: {
    name: string;
    phone: string;
    address: string;
    userId?: string;
  };
  parcelType: string;
  weight: number;
  deliveryAddress: string;
}

 
export interface UpdateParcelStatusDTO {
  status: ParcelStatus;
  location?: string;
  note?: string;
}
