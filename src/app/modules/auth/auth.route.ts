import express from "express";
import { AuthControllers } from "./auth.controller";
import { auth } from "../../middlewares/authMiddleware";
import { UserRole } from "../user/user.interface"

const router = express.Router();

// Login
router.post("/login", AuthControllers.credentialsLogin);

// Refresh token
router.post("/refresh-token", AuthControllers.getNewAccessToken);

// Logout
router.post("/logout", AuthControllers.logout);

// Reset password (only logged-in users)
//router.post("/reset-password", auth(UserRole.ADMIN, UserRole.SENDER, UserRole.RECEIVER), AuthControllers.resetPassword);

// Admin-only example endpoint
router.get("/admin-secret", auth(UserRole.ADMIN), (req, res) => {
  res.json({
    success: true,
    message: "Welcome Admin! This is a protected admin route.",
  });
});

export const AuthRoutes = router;
