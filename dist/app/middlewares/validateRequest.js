"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const validateRequest = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body); // শুধু body পাঠাচ্ছি
        next();
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: "Validation Error",
            errors: error.errors || error.message,
        });
    }
};
exports.validateRequest = validateRequest;
