import express from "express";
import { ParcelController } from "./parcel.controller";
import { auth } from "../../middlewares/authMiddleware"; // Assuming auth middleware exists
import { validate } from "../../middlewares/validate"; // Assuming a validate middleware exists
import { UserRole } from "../user/user.interface"; // Assuming UserRole is imported
import { createParcelValidation ,updateParcelStatusValidation } from "./parcel.validation"; // Assuming createParcelValidation exists

const router = express.Router();

// ✅ Public tracking route (no auth middleware)
router.get("/track/:trackingId", ParcelController.trackParcel);
// Create parcel (Sender only)

router.post(
  "/",
  auth(UserRole.SENDER),
  validate(createParcelValidation),
  ParcelController.createParcel
);

// Get all parcels (Admin only)
router.get(
  "/",
  auth(UserRole.ADMIN),
  ParcelController.getAllParcels
);

// Get my parcels (Sender only)
router.get(
  "/my-parcels",
  auth(UserRole.SENDER),
  ParcelController.getMyParcels
);
// Get incoming parcels (Receiver only)
router.get(
  "/incoming-parcels",
  auth(UserRole.RECEIVER),
  ParcelController.getIncomingParcels
);

// Get single parcel (Sender, Receiver, Admin)
router.get(
  "/:id",
  auth(UserRole.SENDER, UserRole.RECEIVER, UserRole.ADMIN),
  ParcelController.getSingleParcel
);

// Cancel parcel (Sender only)
router.patch(
  "/:id/cancel",
  auth(UserRole.SENDER),
  ParcelController.cancelParcel
);

// Update parcel status (Admin only)
router.patch(
  "/:id/status",
  auth(UserRole.ADMIN),
  validate(updateParcelStatusValidation),
  ParcelController.updateParcelStatus
);

// Delete parcel (Admin only)
router.delete(
  "/:id",
  auth(UserRole.ADMIN),
  ParcelController.deleteParcel
);
// Confirm delivery (Receiver only)
 
router.patch(
  "/:id/confirm-delivery",
  auth(UserRole.RECEIVER),
  ParcelController.confirmDelivery
);
export const ParcelRoutes = router;