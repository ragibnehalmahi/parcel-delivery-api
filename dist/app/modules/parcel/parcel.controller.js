"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParcelController = exports.getMyParcels = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const parcel_service_1 = require("./parcel.service");
const appError_1 = __importDefault(require("../../../errorHelpers/appError"));
// Create parcel
const createParcel = (0, catchAsync_1.default)(async (req, res) => {
    // Ensure logged-in user
    const user = req.user;
    if (!user || !user._id) {
        throw new appError_1.default("Unauthorized: No user found", http_status_codes_1.default.UNAUTHORIZED);
    }
    // Call Service
    const parcel = await parcel_service_1.ParcelService.createParcel(req.body, user._id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "Parcel created successfully",
        data: parcel,
    });
});
// Get all parcels (Admin only)
const getAllParcels = (0, catchAsync_1.default)(async (req, res) => {
    const filters = {
        status: req.query.status,
        isCancelled: req.query.isCancelled ? req.query.isCancelled === 'true' : undefined,
        isDelivered: req.query.isDelivered ? req.query.isDelivered === 'true' : undefined,
        isBlocked: req.query.isBlocked ? req.query.isBlocked === 'true' : undefined,
    };
    const parcels = await parcel_service_1.ParcelService.getAllParcels(filters);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Parcels retrieved successfully",
        data: parcels,
    });
});
// Get my parcels (Sender)
exports.getMyParcels = (0, catchAsync_1.default)(async (req, res, next) => {
    if (!req.user) {
        throw new appError_1.default('Unauthorized: User data not found.', http_status_codes_1.default.UNAUTHORIZED);
    }
    const senderId = req.user.id;
    const parcels = await parcel_service_1.ParcelService.getMyParcels(senderId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: 'Your parcels retrieved successfully',
        data: parcels,
    });
});
const getIncomingParcels = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    if (!user) {
        throw new appError_1.default("Unauthorized: No user found", http_status_codes_1.default.UNAUTHORIZED);
    }
    const parcels = await parcel_service_1.ParcelService.getIncomingParcels(user._id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Incoming parcels retrieved successfully",
        data: parcels,
    });
});
// Get single parcel
const getSingleParcel = (0, catchAsync_1.default)(async (req, res) => {
    if (!req.user) {
        throw new appError_1.default("Unauthorized: No user found", http_status_codes_1.default.UNAUTHORIZED);
    }
    const parcel = await parcel_service_1.ParcelService.getSingleParcel(req.params.id, req.user);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Parcel retrieved successfully",
        data: parcel,
    });
});
const cancelParcel = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    if (!user) {
        throw new appError_1.default("Unauthorized: No user found", http_status_codes_1.default.UNAUTHORIZED);
    }
    const parcel = await parcel_service_1.ParcelService.cancelParcel(req.params.id, user._id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Parcel cancelled successfully",
        data: parcel,
    });
});
// Update parcel status (Admin only)
const updateParcelStatus = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    if (!user) {
        throw new appError_1.default("Unauthorized: No user found", http_status_codes_1.default.UNAUTHORIZED);
    }
    const parcel = await parcel_service_1.ParcelService.updateParcelStatus(req.params.id, req.body, user._id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Parcel status updated successfully",
        data: parcel,
    });
});
// Delete parcel (Admin only)
const deleteParcel = (0, catchAsync_1.default)(async (req, res) => {
    const parcel = await parcel_service_1.ParcelService.deleteParcel(req.params.id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Parcel deleted successfully",
        data: parcel,
    });
});
// Confirm delivery (Receiver only)
const confirmDelivery = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user; // Assuming your authentication middleware attaches the user to the request
    if (!user) {
        throw new appError_1.default("Unauthorized: No user found", http_status_codes_1.default.UNAUTHORIZED);
    }
    const { id } = req.params;
    const receiverId = user._id;
    const parcel = await parcel_service_1.ParcelService.confirmDelivery(id, receiverId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Parcel delivery confirmed successfully",
        data: parcel,
    });
});
exports.ParcelController = {
    createParcel,
    getAllParcels,
    getMyParcels: exports.getMyParcels,
    getIncomingParcels,
    getSingleParcel,
    cancelParcel,
    updateParcelStatus,
    deleteParcel,
    confirmDelivery
};
