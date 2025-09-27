"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUsersQuerySchema = exports.UpdateUserSchema = exports.CreateUserSchema = void 0;
const zod_1 = require("zod");
exports.CreateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Name is required"),
    email: zod_1.z.string().email("Invalid email"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    role: zod_1.z.nativeEnum({
        ADMIN: "ADMIN",
        SENDER: "SENDER",
        RECEIVER: "RECEIVER",
    }).optional(),
});
exports.UpdateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    avatarUrl: zod_1.z.string().url().optional(),
    role: zod_1.z.nativeEnum({
        ADMIN: "ADMIN",
        SENDER: "SENDER",
        RECEIVER: "RECEIVER",
    }).optional(),
    verified: zod_1.z.boolean().optional(),
});
exports.ListUsersQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().positive().optional(),
    limit: zod_1.z.coerce.number().positive().optional(),
    role: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
});
