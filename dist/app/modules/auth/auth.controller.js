"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const auth_service_1 = require("./auth.service");
const credentialsLogin = (0, catchAsync_1.default)(async (req, res, next) => {
    const loginInfo = await auth_service_1.AuthService.credentialsLogin(req.body);
    const setAuthCookie = (res, tokenInfo) => {
        if (tokenInfo.accessToken) {
            res.cookie("accessToken", tokenInfo.accessToken, {
                httpOnly: true,
                secure: false
            });
        }
        if (tokenInfo.refreshToken) {
            res.cookie("refreshToken", tokenInfo.refreshToken, {
                httpOnly: true,
                secure: false,
            });
        }
    };
    setAuthCookie(res, loginInfo);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "User Logged In Successfully",
        data: loginInfo,
    });
});
// ✅ Refresh Token Controller
const refreshToken = (0, catchAsync_1.default)(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await auth_service_1.AuthService.getNewAccessToken(refreshToken);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "New access token generated",
        data: result,
    });
});
// ✅ Reset Password Controller
const changePassword = (0, catchAsync_1.default)(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const authUser = req.user;
    const result = await auth_service_1.AuthService.changePassword(authUser._id, oldPassword, newPassword);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Password reset successful",
        data: result,
    });
});
// ✅ Logout Controller
const logoutUser = (0, catchAsync_1.default)(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await auth_service_1.AuthService.logoutUser(refreshToken);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Logout successful",
        data: result,
    });
});
exports.AuthController = {
    credentialsLogin,
    refreshToken,
    changePassword,
    logoutUser,
};
