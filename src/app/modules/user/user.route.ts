import express from "express";
import { UserControllers } from "./user.controller";
import { auth } from "../../middlewares/authMiddleware";
import { UserRole } from "./user.interface";

const router = express.Router();

// Create user (open route)
router.post("/", UserControllers.createUser);

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

// Admin-only special feature
router.get(
  "/admin/stats",
  auth(UserRole.ADMIN), // Only admins can access
  async (req, res) => {
    res.json({
      success: true,
      message: "Admin special feature accessed successfully!",
      data: {
        totalUsers: 1234,
        deletedUsers: 56,
        systemHealth: "All systems operational 🚀",
      },
    });
  }
);

export const UserRouter = router;
