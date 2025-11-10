import express from "express";
import {UserControllers } from "./user.controller";
import { auth } from "../../middlewares/authMiddleware";
import { UserRole } from "./user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { CreateUserSchema } from "./user.validation";

const router = express.Router();

// Create user (open route)
router.post("/register",validateRequest(CreateUserSchema), UserControllers.createUser);
router.get(
  "/me",
  auth(UserRole.ADMIN, UserRole.SENDER, UserRole.RECEIVER), // All authenticated roles
  UserControllers.getMyProfile
);
// Get all users (admin only)
router.get(
  "/allusers",
  auth(UserRole.ADMIN), // Only admins can get all users
  UserControllers.getAllUsers
);
router.get("/search", UserControllers.searchUserByEmail);
// Update user (requires authentication)
router.patch(
  "/:id/",
  auth(UserRole.ADMIN), // Admin, sender, receiver can update (restrictions in service)
  UserControllers.updateUser
);
 router.patch(
  "/:id/status",
  auth(UserRole.ADMIN), // only admin can change user status
  UserControllers.updateUserStatus
);
export const UserRouter = router;
