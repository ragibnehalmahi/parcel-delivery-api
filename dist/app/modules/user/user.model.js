"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
// src/modules/user/user.model.ts
const mongoose_1 = require("mongoose");
const user_interface_1 = require("./user.interface");
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUND) || 10;
/** Sub-schema: coordinates (no _id) */
const CoordinatesSchema = new mongoose_1.Schema({
    lat: { type: Number },
    lng: { type: Number },
}, { _id: false });
/** Sub-schema: location (embed coordinates schema) */
const UserLocationSchema = new mongoose_1.Schema({
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String },
    coordinates: CoordinatesSchema,
}, { _id: false });
/** Auth provider sub-schema */
const AuthProviderSchema = new mongoose_1.Schema({
    provider: { type: String, required: true },
    providerId: { type: String, required: true },
}, { _id: false });
/** Main user schema */
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, default: null },
    picture: { type: String, default: null },
    address: { type: String, default: null },
    role: {
        type: String,
        enum: Object.values(user_interface_1.UserRole),
        default: user_interface_1.UserRole.SENDER,
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(user_interface_1.UserStatus),
        default: user_interface_1.UserStatus.ACTIVE,
    },
    isDeleted: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    authProviders: { type: [AuthProviderSchema], default: [] },
    location: { type: UserLocationSchema, default: null },
}, {
    timestamps: true,
    versionKey: false,
    toJSON: {
        transform(doc, ret) {
            const obj = ret;
            if (obj.password !== undefined)
                obj.password = undefined;
            return obj;
        },
    },
});
exports.User = (0, mongoose_1.model)("User", UserSchema);
