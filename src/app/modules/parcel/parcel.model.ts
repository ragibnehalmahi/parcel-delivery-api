// src/modules/parcel/parcel.model.ts
import { model, Schema } from "mongoose";
import { ParcelDocument, ParcelStatus, StatusLog } from "./parcel.interface";

/**
 * Schema for parcel status logs
 */
const StatusLogSchema = new Schema<StatusLog>(
  {
    status: {
      type: String,
      enum: Object.values(ParcelStatus),
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    location: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

/**
 * Schema for main Parcel
 */
const ParcelSchema = new Schema<ParcelDocument>(
  {
    trackingId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      userId: { type: Schema.Types.ObjectId, ref: "User" },
    },
    parcelType: {
      type: String,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },
    currentStatus: {
      type: String,
      enum: Object.values(ParcelStatus),
      default: ParcelStatus.REQUESTED,
    },
    parcelFee: {
      type: Number,
    },
    estimatedDeliveryDate: {
      type: Date,
    },
    isCancelled: {
      type: Boolean,
      default: false,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    statusLogs: {
      type: [StatusLogSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
  }
);

export const ParcelModel = model<ParcelDocument>("Parcel", ParcelSchema);
