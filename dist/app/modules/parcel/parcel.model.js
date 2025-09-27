"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParcelModel = void 0;
// src/modules/parcel/parcel.model.ts
const mongoose_1 = require("mongoose");
const parcel_interface_1 = require("./parcel.interface");
/**
 * Schema for parcel status logs
 */
const StatusLogSchema = new mongoose_1.Schema({
    status: {
        type: String,
        enum: Object.values(parcel_interface_1.ParcelStatus),
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    note: {
        type: String,
        trim: true,
    },
}, { _id: false });
/**
 * Schema for main Parcel
 */
const ParcelSchema = new mongoose_1.Schema({
    trackingId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiver: {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        address: { type: String, required: true, trim: true },
        userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
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
        enum: Object.values(parcel_interface_1.ParcelStatus),
        default: parcel_interface_1.ParcelStatus.REQUESTED,
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
}, {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
});
exports.ParcelModel = (0, mongoose_1.model)("Parcel", ParcelSchema);
