"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const mongoose_1 = require("mongoose");
const appError_1 = __importDefault(require("../../../errorHelpers/appError"));
const user_model_1 = require("../user/user.model");
const user_interface_1 = require("../user/user.interface");
// Helper function to generate JWT tokens
const generateToken = (payload, secret, expiresIn) => {
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn });
};
// Main login function
const credentialsLogin = async (payload) => {
    const { email, password } = payload;
    // Check if user exists and select password field
    const existingUser = await user_model_1.User.findOne({ email }).select("+password");
    if (!existingUser) {
        throw new appError_1.default("Email does not exist", http_status_codes_1.default.BAD_REQUEST);
    }
    // Check if password exists (important for select+password)
    if (!existingUser.password) {
        throw new appError_1.default("User password not found", http_status_codes_1.default.INTERNAL_SERVER_ERROR);
    }
    // Check if password is valid
    const isPasswordMatched = await bcryptjs_1.default.compare(password, existingUser.password);
    if (!isPasswordMatched) {
        throw new appError_1.default("Incorrect Password", http_status_codes_1.default.BAD_REQUEST);
    }
    // Create JWT payload
    const jwtPayload = {
        userId: existingUser._id,
        email: existingUser.email,
        role: existingUser.role,
    };
    // Generate tokens
    const accessToken = generateToken(jwtPayload, process.env.JWT_ACCESS_SECRET, process.env.JWT_ACCESS_EXPIRES || '1h');
    const refreshToken = generateToken(jwtPayload, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRES || '7d');
    // Remove password from user object before returning
    const { password: pass, ...rest } = existingUser.toObject();
    return {
        accessToken,
        refreshToken,
        user: rest,
    };
};
// Refresh Token Service
const getNewAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new appError_1.default("Refresh token is required", http_status_codes_1.default.BAD_REQUEST);
    }
    try {
        // Verify refresh token with REFRESH_SECRET
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        // Here we can take the userId from the decoded payload
        const user = await user_model_1.User.findById(decoded.userId).select("+status +role +email");
        if (!user) {
            throw new appError_1.default("User not found", http_status_codes_1.default.NOT_FOUND);
        }
        // Check user status
        if (user.status === user_interface_1.UserStatus.BLOCKED ||
            user.status === user_interface_1.UserStatus.DELETED ||
            user.status === user_interface_1.UserStatus.INACTIVE) {
            throw new appError_1.default("User is blocked, deleted or inactive", http_status_codes_1.default.FORBIDDEN);
        }
        // Issue new access token with ACCESS_SECRET
        const newAccessToken = generateToken({
            userId: user._id,
            email: user.email,
            role: user.role,
        }, process.env.JWT_ACCESS_SECRET, process.env.JWT_ACCESS_EXPIRES || "1h");
        return {
            user,
            accessToken: newAccessToken,
            refreshToken,
        };
    }
    catch (err) {
        throw new appError_1.default("Invalid refresh token", http_status_codes_1.default.UNAUTHORIZED);
    }
};
// Reset Password Service
const changePassword = async (userId, oldPassword, newPassword) => {
    // find user by id with password field
    const user = await user_model_1.User.findById(userId).select("+password");
    if (!user) {
        throw new appError_1.default("User not found", http_status_codes_1.default.NOT_FOUND);
    }
    // check status
    if (user.status === user_interface_1.UserStatus.BLOCKED ||
        user.status === user_interface_1.UserStatus.DELETED ||
        user.status === user_interface_1.UserStatus.INACTIVE) {
        throw new appError_1.default("User is blocked, deleted or inactive", http_status_codes_1.default.FORBIDDEN);
    }
    // check old password
    const isOldPasswordValid = await bcryptjs_1.default.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
        throw new appError_1.default("Old password incorrect", http_status_codes_1.default.UNAUTHORIZED);
    }
    // check if new password same as old
    const isSame = await bcryptjs_1.default.compare(newPassword, user.password);
    if (isSame) {
        throw new appError_1.default("New password cannot be same as old", http_status_codes_1.default.BAD_REQUEST);
    }
    // hash and save
    user.password = await bcryptjs_1.default.hash(newPassword, Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
    await user.save();
    return { message: "Password reset successful" };
};
// Logout Service
const tokenSchema = new mongoose_1.Schema({
    token: { type: String, required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });
const TokenModel = (0, mongoose_1.model)('Token', tokenSchema);
const logoutUser = async (refreshToken) => {
    // remove refresh token from DB
    await TokenModel.findOneAndDelete({ token: refreshToken });
    return { message: "Logout successful" };
};
exports.AuthService = {
    credentialsLogin,
    getNewAccessToken,
    changePassword,
    logoutUser,
};
