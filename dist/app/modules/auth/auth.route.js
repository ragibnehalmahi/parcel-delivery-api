"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("./auth.controller");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const user_interface_1 = require("../user/user.interface");
const router = express_1.default.Router();
// Login
router.post("/login", auth_controller_1.AuthController.credentialsLogin);
// Refresh token
router.post("/refresh-token", auth_controller_1.AuthController.refreshToken);
// Logout
router.post("/logout", auth_controller_1.AuthController.logoutUser);
// Reset password (only logged-in users)
router.post("/change-password", (0, authMiddleware_1.auth)(user_interface_1.UserRole.ADMIN, user_interface_1.UserRole.SENDER, user_interface_1.UserRole.RECEIVER), auth_controller_1.AuthController.changePassword);
exports.AuthRoutes = router;
