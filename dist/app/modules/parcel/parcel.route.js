"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParcelRoutes = void 0;
const express_1 = __importDefault(require("express"));
const parcel_controller_1 = require("./parcel.controller");
const authMiddleware_1 = require("../../middlewares/authMiddleware"); // Assuming auth middleware exists
const validate_1 = require("../../middlewares/validate"); // Assuming a validate middleware exists
const user_interface_1 = require("../user/user.interface"); // Assuming UserRole is imported
const parcel_validation_1 = require("./parcel.validation"); // Assuming createParcelValidation exists
const router = express_1.default.Router();
// Create parcel (Sender only)
router.post("/", (0, authMiddleware_1.auth)(user_interface_1.UserRole.SENDER), (0, validate_1.validate)(parcel_validation_1.createParcelValidation), parcel_controller_1.ParcelController.createParcel);
// Get all parcels (Admin only)
router.get("/", (0, authMiddleware_1.auth)(user_interface_1.UserRole.ADMIN), parcel_controller_1.ParcelController.getAllParcels);
// Get my parcels (Sender only)
router.get("/my-parcels", (0, authMiddleware_1.auth)(user_interface_1.UserRole.SENDER), parcel_controller_1.ParcelController.getMyParcels);
// Get incoming parcels (Receiver only)
router.get("/incoming-parcels", (0, authMiddleware_1.auth)(user_interface_1.UserRole.RECEIVER), parcel_controller_1.ParcelController.getIncomingParcels);
// Get single parcel (Sender, Receiver, Admin)
router.get("/:id", (0, authMiddleware_1.auth)(user_interface_1.UserRole.SENDER, user_interface_1.UserRole.RECEIVER, user_interface_1.UserRole.ADMIN), parcel_controller_1.ParcelController.getSingleParcel);
// Cancel parcel (Sender only)
router.patch("/:id/cancel", (0, authMiddleware_1.auth)(user_interface_1.UserRole.SENDER), parcel_controller_1.ParcelController.cancelParcel);
// Update parcel status (Admin only)
router.patch("/:id/status", (0, authMiddleware_1.auth)(user_interface_1.UserRole.ADMIN), (0, validate_1.validate)(parcel_validation_1.updateParcelStatusValidation), parcel_controller_1.ParcelController.updateParcelStatus);
// Delete parcel (Admin only)
router.delete("/:id", (0, authMiddleware_1.auth)(user_interface_1.UserRole.ADMIN), parcel_controller_1.ParcelController.deleteParcel);
// Confirm delivery (Receiver only)
router.patch("/:id/confirm-delivery", (0, authMiddleware_1.auth)(user_interface_1.UserRole.RECEIVER), parcel_controller_1.ParcelController.confirmDelivery);
exports.ParcelRoutes = router;
