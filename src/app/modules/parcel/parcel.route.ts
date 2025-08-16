import express from "express";
import { validateRequest } from "../../../middlewares/validateRequest";
import { auth } from "../../middlewares/authMiddleware"; 
import {
  createParcelZodSchema,
  updateParcelZodSchema,
  changeStatusZodSchema,
} from "./parcel.validation";
import {
  createParcel,
  getAllParcels,
  getSingleParcel,
  confirmDelivery,
  cancelParcel,
  blockParcel,
  adminChangeStatus,
  getMyParcels,
  getIncomingParcels,
} from "./parcel.controller";
import { UserRole } from "../user/user.interface";

const router = express.Router();

/**
 * Create parcel (SENDER)
 * sender comes from token
 */
 
router.post(
  "/",
  auth(UserRole.SENDER),
  validateRequest(createParcelZodSchema),
  createParcel
);

/**
 * ADMIN: list all parcels (paginated)
 */
router.get("/", auth(UserRole.ADMIN), getAllParcels);

/**
 * Get single parcel (ADMIN or parcel owner/receiver)
 */
router.get(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SENDER, UserRole.RECEIVER),
  getSingleParcel
);

/**
 * RECEIVER confirms delivery
 */
router.patch(
  "/confirm/:id",
  auth(UserRole.RECEIVER),
  confirmDelivery
);

/**
 * SENDER cancels own parcel (not delivered)
 */
router.patch(
  "/cancel/:id",
  auth(UserRole.SENDER),
  cancelParcel
);

/**
 * ADMIN blocks a parcel
 */
router.patch(
  "/block/:id",
  auth(UserRole.ADMIN),
  blockParcel
);

/**
 * ADMIN can set status to PENDING / IN_TRANSIT
 */
router.patch(
  "/status/:id",
  auth(UserRole.ADMIN),
  validateRequest(changeStatusZodSchema),
  adminChangeStatus
);

/**
 * SENDER: my created parcels
 */
router.get("/me/sent", auth(UserRole.SENDER), getMyParcels);

/**
 * RECEIVER: incoming parcels for me
 */
router.get("/me/incoming", auth(UserRole.RECEIVER), getIncomingParcels);

export const ParcelRoutes = router;
