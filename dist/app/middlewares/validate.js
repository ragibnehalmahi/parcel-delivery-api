"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validateBody = exports.validate = void 0;
const zod_1 = require("zod");
const appError_1 = __importDefault(require("../../errorHelpers/appError"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
// 🔹 Handle Zod validation errors centrally
const handleValidationError = (error, next) => {
    if (error instanceof zod_1.ZodError) {
        const messages = error.issues.map((err) => {
            const field = err.path.join(".");
            return `${field}: ${err.message}`;
        });
        return next(new appError_1.default(`Validation failed: ${messages.join(", ")}`, http_status_codes_1.default.BAD_REQUEST));
    }
    next(new appError_1.default("An unexpected error occurred during validation", http_status_codes_1.default.INTERNAL_SERVER_ERROR));
};
// 🔹 Generic validator middleware (body + query + params)
const validate = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    }
    catch (error) {
        handleValidationError(error, next);
    }
};
exports.validate = validate;
// 🔹 Specific helper (if you want body/query/params individually)
const validateBody = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync(req.body);
        next();
    }
    catch (error) {
        handleValidationError(error, next);
    }
};
exports.validateBody = validateBody;
const validateQuery = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync(req.query);
        next();
    }
    catch (error) {
        handleValidationError(error, next);
    }
};
exports.validateQuery = validateQuery;
const validateParams = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync(req.params);
        next();
    }
    catch (error) {
        handleValidationError(error, next);
    }
};
exports.validateParams = validateParams;
