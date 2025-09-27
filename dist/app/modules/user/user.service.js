"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserServices = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const appError_1 = __importDefault(require("../../../errorHelpers/appError"));
const user_interface_1 = require("./user.interface");
const user_model_1 = require("./user.model");
const config_1 = require("../../config");
/**
 * Create a new user
 */
const createUser = async (payload) => {
    const { email, password, ...rest } = payload;
    if (!email || !password) {
        throw new appError_1.default("Email and password are required", http_status_codes_1.default.BAD_REQUEST);
    }
    const isUserExist = await user_model_1.User.findOne({ email });
    if (isUserExist) {
        throw new appError_1.default("User already exists", http_status_codes_1.default.BAD_REQUEST);
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const newUser = await user_model_1.User.create({ ...rest, email, password: hashedPassword });
    return newUser;
};
/**
 * Update user details
 */
const updateUser = async (userId, payload, authUser) => {
    const existingUser = await user_model_1.User.findById(userId);
    if (!existingUser) {
        throw new appError_1.default("User not found", http_status_codes_1.default.NOT_FOUND);
    }
    // Prevent email update
    if (payload.email) {
        throw new appError_1.default("Email cannot be updated", http_status_codes_1.default.BAD_REQUEST);
    }
    // Role-based restrictions
    if (payload.role) {
        if (authUser.role === user_interface_1.UserRole.SENDER || authUser.role === user_interface_1.UserRole.RECEIVER) {
            throw new appError_1.default("You are not authorized to change roles", http_status_codes_1.default.FORBIDDEN);
        }
        if (payload.role === user_interface_1.UserRole.ADMIN && authUser.role !== user_interface_1.UserRole.ADMIN) {
            throw new appError_1.default("You are not authorized to promote to admin", http_status_codes_1.default.FORBIDDEN);
        }
    }
    // Status changes restricted
    if (payload.status || payload.isDeleted || payload.isVerified) {
        if (authUser.role !== user_interface_1.UserRole.ADMIN) {
            throw new appError_1.default("You are not authorized to change user status", http_status_codes_1.default.FORBIDDEN);
        }
    }
    // Hash password if updated
    if (payload.password) {
        payload.password = await bcryptjs_1.default.hash(payload.password, Number(config_1.envVars.BCRYPT_SALT_ROUND));
    }
    const updatedUser = await user_model_1.User.findByIdAndUpdate(userId, payload, {
        new: true,
        runValidators: true,
    });
    return updatedUser;
};
/**
 * Get all users
 */
const getAllUsers = async () => {
    const users = await user_model_1.User.find({});
    const totalUsers = await user_model_1.User.countDocuments();
    return {
        data: users,
        meta: {
            total: totalUsers,
        },
    };
};
exports.UserServices = {
    createUser,
    getAllUsers,
    updateUser,
};
