import express from "express";
import { AuthController } from "./auth.controller";
import { auth } from "../../middlewares/authMiddleware";
import { UserRole } from "../user/user.interface"

const router = express.Router();

// Login
router.post("/login", AuthController.credentialsLogin);

// Refresh token
router.post("/refresh-token", AuthController.refreshToken);

// Logout
router.post("/logout", AuthController.logout);

// Reset password (only logged-in users)
router.post("/change-password", auth(UserRole.ADMIN, UserRole.SENDER, UserRole.RECEIVER), AuthController.changePassword);

 

export const AuthRoutes = router;
