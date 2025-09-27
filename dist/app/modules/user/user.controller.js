"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserControllers = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const user_service_1 = require("./user.service");
// Create a new user
const createUser = (0, catchAsync_1.default)(async (req, res) => {
    const user = await user_service_1.UserServices.createUser(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "User Created Successfully",
        data: {
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
            },
        }
    });
});
//Update a user
const updateUser = (0, catchAsync_1.default)(async (req, res) => {
    const authUser = req.user;
    const { id } = req.params;
    const updatedUser = await user_service_1.UserServices.updateUser(id, req.body, authUser);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "User updated successfully",
        data: updatedUser,
    });
});
//Get all users
const getAllUsers = (0, catchAsync_1.default)(async (req, res) => {
    const result = await user_service_1.UserServices.getAllUsers();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "All users fetched successfully",
        meta: result.meta,
        data: result.data,
    });
});
exports.UserControllers = {
    createUser,
    getAllUsers,
    updateUser,
};
