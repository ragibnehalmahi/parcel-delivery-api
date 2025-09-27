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
  "/",
  auth(UserRole.ADMIN), // Only admins can get all users
  UserControllers.getAllUsers
);

// Update user (requires authentication)
router.patch(
  "/:id",
  auth(UserRole.ADMIN), // Admin, sender, receiver can update (restrictions in service)
  UserControllers.updateUser
);
 
export const UserRouter = router;
