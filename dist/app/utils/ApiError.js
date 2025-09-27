"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ApiError extends Error {
    constructor(statusCode, message, errors, isOperational = true, stack = "") {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.errors = errors;
        if (stack) {
            this.stack = stack;
        }
        else {
            Error.captureStackTrace(this, this.constructor);
        }
        // Maintain proper prototype chain
        Object.setPrototypeOf(this, ApiError.prototype);
    }
    // Predefined error types
    static badRequest(message, errors) {
        return new ApiError(400, message, errors);
    }
    static unauthorized(message = "Unauthorized") {
        return new ApiError(401, message);
    }
    static forbidden(message = "Forbidden") {
        return new ApiError(403, message);
    }
    static notFound(message = "Not Found") {
        return new ApiError(404, message);
    }
    static conflict(message = "Conflict") {
        return new ApiError(409, message);
    }
    static internal(message = "Internal Server Error", errors) {
        return new ApiError(500, message, errors);
    }
    // Validation error formatter
    static validationError(errors) {
        return new ApiError(422, "Validation Error", errors);
    }
}
exports.default = ApiError;
