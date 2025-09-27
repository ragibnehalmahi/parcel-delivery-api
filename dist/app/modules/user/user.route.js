"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRouter = void 0;
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("./user.controller");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const user_interface_1 = require("./user.interface");
const validateRequest_1 = require("../../middlewares/validateRequest");
const user_validation_1 = require("./user.validation");
const router = express_1.default.Router();
// Create user (open route)
router.post("/register", (0, validateRequest_1.validateRequest)(user_validation_1.CreateUserSchema), user_controller_1.UserControllers.createUser);
// Get all users (admin only)
router.get("/", (0, authMiddleware_1.auth)(user_interface_1.UserRole.ADMIN), // Only admins can get all users
user_controller_1.UserControllers.getAllUsers);
// Update user (requires authentication)
router.patch("/:id", (0, authMiddleware_1.auth)(user_interface_1.UserRole.ADMIN), // Admin, sender, receiver can update (restrictions in service)
user_controller_1.UserControllers.updateUser);
exports.UserRouter = router;
