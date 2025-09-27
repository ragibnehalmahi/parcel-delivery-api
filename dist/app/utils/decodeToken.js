"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodedToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const appError_1 = __importDefault(require("../../errorHelpers/appError"));
const http_status_1 = __importDefault(require("http-status"));
const decodedToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!decoded.userId || !decoded.role) {
            throw new appError_1.default("Invalid token payload - missing required fields", http_status_1.default.UNAUTHORIZED);
        }
        return decoded;
    }
    catch (err) {
        throw new appError_1.default("Invalid or expired token", http_status_1.default.UNAUTHORIZED);
    }
};
exports.decodedToken = decodedToken;
