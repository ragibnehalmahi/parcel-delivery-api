"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParcelService = void 0;
const mongoose_1 = require("mongoose");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const appError_1 = __importDefault(require("../../../errorHelpers/appError"));
const parcel_model_1 = require("./parcel.model");
const user_model_1 = require("../user/user.model");
const mongoose_2 = __importDefault(require("mongoose"));
const parcel_interface_1 = require("./parcel.interface");
const user_interface_1 = require("../user/user.interface"); // Assuming UserRole is imported
// Generate a unique tracking ID
const generateTrackingId = () => {
    const date = new Date();
    const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TRK-${datePart}-${randomPart}`;
};
// Calculate parcel fee based on weight and type
const calculateParcelFee = (weight, parcelType) => {
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
const createParcel = async (payload, senderId) => {
    const trackingId = generateTrackingId();
    const parcelFee = calculateParcelFee(payload.weight, payload.parcelType);
    // FIX: Look up the receiver's user ID using their phone number
    const receiverUser = await user_model_1.User.findOne({ phone: payload.receiver.phone });
    const initialStatusLog = {
        status: parcel_interface_1.ParcelStatus.REQUESTED,
        timestamp: new Date(),
        note: "Parcel created by sender",
    };
    const parcelData = {
        trackingId,
        sender: new mongoose_1.Types.ObjectId(senderId),
        receiver: {
            name: payload.receiver.name,
            phone: payload.receiver.phone,
            address: payload.receiver.address,
            userId: receiverUser ? receiverUser._id : undefined
        },
        parcelType: payload.parcelType,
        weight: payload.weight,
        deliveryAddress: payload.deliveryAddress,
        currentStatus: parcel_interface_1.ParcelStatus.REQUESTED,
        parcelFee,
        estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        statusLogs: [initialStatusLog],
    };
    const parcel = await parcel_model_1.ParcelModel.create(parcelData);
    return parcel;
};
// Get all parcels (Admin only)
const getAllParcels = async (filters = {}) => {
    const query = {};
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
    const parcels = await parcel_model_1.ParcelModel.find(query)
        .populate("sender", "name email phone")
        .populate("receiver.userId", "name email phone")
        .sort({ createdAt: -1 });
    return parcels;
};
// Get my parcels (Sender only)
const getMyParcels = async (senderId) => {
    const parcels = await parcel_model_1.ParcelModel.find({ sender: new mongoose_1.Types.ObjectId(senderId) })
        .populate("sender", "name email phone")
        .populate("receiver.userId", "name email phone")
        .sort({ createdAt: -1 });
    return parcels;
};
const getIncomingParcels = async (receiverId) => {
    const parcels = await parcel_model_1.ParcelModel.find({
        "receiver.userId": new mongoose_1.Types.ObjectId(receiverId)
    })
        .populate("sender", "name email phone")
        .populate("receiver.userId", "name email phone")
        .sort({ createdAt: -1 });
    return parcels;
};
// Get single parcel with authorization
const getSingleParcel = async (parcelId, user) => {
    const parcel = await parcel_model_1.ParcelModel.findById(parcelId)
        .populate("sender", "name email phone")
        .populate("receiver.userId", "name email phone");
    if (!parcel) {
        throw new appError_1.default("Parcel not found", http_status_codes_1.default.NOT_FOUND);
    }
    // Authorization check
    const isSender = parcel.sender._id.toString() === user.userId;
    const isReceiver = parcel.receiver.userId?.toString() === user.userId;
    const isAdmin = user.role === user_interface_1.UserRole.ADMIN;
    if (!isSender && !isReceiver && !isAdmin) {
        throw new appError_1.default("Access denied", http_status_codes_1.default.FORBIDDEN);
    }
    return parcel;
};
const cancelParcel = async (parcelId, userId) => {
    const parcel = await parcel_model_1.ParcelModel.findById(parcelId);
    if (!parcel) {
        throw new appError_1.default("Parcel not found", http_status_codes_1.default.NOT_FOUND);
    }
    // ✅ sender check (ObjectId safe compare)
    if (!new mongoose_2.default.Types.ObjectId(userId).equals(parcel.sender)) {
        throw new appError_1.default("Only sender can cancel this parcel", http_status_codes_1.default.FORBIDDEN);
    }
    if (parcel.currentStatus !== parcel_interface_1.ParcelStatus.REQUESTED) {
        throw new appError_1.default("Cannot cancel parcel after approval", http_status_codes_1.default.BAD_REQUEST);
    }
    const statusLog = {
        status: parcel_interface_1.ParcelStatus.CANCELLED,
        timestamp: new Date(),
        note: "Cancelled by sender",
    };
    parcel.currentStatus = parcel_interface_1.ParcelStatus.CANCELLED;
    parcel.isCancelled = true;
    parcel.statusLogs.push(statusLog);
    await parcel.save();
    return parcel;
};
// Update parcel status (Admin only)
const updateParcelStatus = async (parcelId, payload, adminId) => {
    const parcel = await parcel_model_1.ParcelModel.findById(parcelId);
    if (!parcel) {
        throw new appError_1.default("Parcel not found", http_status_codes_1.default.NOT_FOUND);
    }
    if (parcel.isCancelled) {
        throw new appError_1.default("Cannot update cancelled parcel", http_status_codes_1.default.BAD_REQUEST);
    }
    if (parcel.isDelivered) {
        throw new appError_1.default("Cannot update delivered parcel", http_status_codes_1.default.BAD_REQUEST);
    }
    const statusLog = {
        status: payload.status,
        timestamp: new Date(),
        location: payload.location,
        note: payload.note,
        updatedBy: new mongoose_1.Types.ObjectId(adminId),
    };
    parcel.currentStatus = payload.status;
    if (payload.status === parcel_interface_1.ParcelStatus.DELIVERED) {
        parcel.isDelivered = true;
    }
    parcel.statusLogs.push(statusLog);
    await parcel.save();
    return parcel;
};
// Delete parcel (Admin only)
const deleteParcel = async (parcelId) => {
    const parcel = await parcel_model_1.ParcelModel.findByIdAndDelete(parcelId);
    if (!parcel) {
        throw new appError_1.default("Parcel not found", http_status_codes_1.default.NOT_FOUND);
    }
    return parcel;
};
const confirmDelivery = async (parcelId, receiverId) => {
    const parcel = await parcel_model_1.ParcelModel.findById(parcelId);
    // Check 1: Parcel exists
    if (!parcel) {
        throw new appError_1.default("Parcel not found", http_status_codes_1.default.NOT_FOUND);
    }
    // Check 2: User is the intended receiver
    // This uses the 'userId' that was saved during parcel creation
    if (parcel.receiver.userId?.toString() !== receiverId) {
        throw new appError_1.default("You are not authorized to confirm this delivery", http_status_codes_1.default.FORBIDDEN);
    }
    // Check 3: Parcel is in a deliverable state (Dispatched or In Transit)
    if (![parcel_interface_1.ParcelStatus.IN_TRANSIT, parcel_interface_1.ParcelStatus.DISPATCHED].includes(parcel.currentStatus)) {
        throw new appError_1.default("Parcel not in a deliverable state", http_status_codes_1.default.BAD_REQUEST);
    }
    // Check 4: Parcel is not already delivered or cancelled
    if (parcel.isDelivered) {
        throw new appError_1.default("Parcel already delivered", http_status_codes_1.default.BAD_REQUEST);
    }
    if (parcel.isCancelled) {
        throw new appError_1.default("Cannot deliver cancelled parcel", http_status_codes_1.default.BAD_REQUEST);
    }
    // Update parcel status and add a new status log
    const statusLog = {
        status: parcel_interface_1.ParcelStatus.DELIVERED,
        timestamp: new Date(),
        note: "Delivery confirmed by receiver",
        updatedBy: new mongoose_1.Types.ObjectId(receiverId), // Link log to the receiver's ID
    };
    parcel.currentStatus = parcel_interface_1.ParcelStatus.DELIVERED;
    parcel.isDelivered = true;
    parcel.statusLogs.push(statusLog);
    await parcel.save();
    return parcel;
};
exports.ParcelService = {
    createParcel,
    getAllParcels,
    getMyParcels,
    getIncomingParcels,
    getSingleParcel,
    cancelParcel,
    updateParcelStatus,
    deleteParcel,
    confirmDelivery
};
