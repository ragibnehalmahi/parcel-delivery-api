import { Schema, model, Types } from "mongoose";
import { IParcel, IStatusLog, ParcelStatus } from "./parcel.interface";

const StatusLogSchema = new Schema<IStatusLog>(
  {
    status: {
      type: String,
      enum: Object.values(ParcelStatus),
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    note: { type: String },
    location: { type: String },
  },
  { _id: false }
);

const ParcelSchema = new Schema<IParcel>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    pickupLocation: { type: String, required: true },
    dropoffLocation: { type: String, required: true },
    weight: { type: Number, required: true, min: 0 },
    distance: { type: Number, required: true, min: 0 },

    deliveryFee: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: Object.values(ParcelStatus),
      default: ParcelStatus.PENDING,
      required: true,
      index: true,
    },

    statusLogs: { type: [StatusLogSchema], default: [] },

    isBlocked: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// (optional) computed fee guard: keep as data-level check in service; model trusts service.

export const Parcel = model<IParcel>("Parcel", ParcelSchema);
