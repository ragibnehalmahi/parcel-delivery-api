"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateParcelStatusValidation = exports.createParcelValidation = void 0;
const zod_1 = require("zod");
exports.createParcelValidation = zod_1.z.object({
    body: zod_1.z.object({
        receiver: zod_1.z.object({
            name: zod_1.z.string().min(2, "Receiver name must be at least 2 characters"),
            phone: zod_1.z.string().min(10, "Valid phone number required"),
            address: zod_1.z.string().min(5, "Address must be at least 5 characters"),
            userId: zod_1.z.string().optional(),
        }),
        parcelType: zod_1.z.string().min(2, "Parcel type is required"),
        weight: zod_1.z.number().positive("Weight must be positive"),
        deliveryAddress: zod_1.z.string().min(5, "Delivery address must be at least 5 characters"),
    }),
});
exports.updateParcelStatusValidation = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.string(),
        location: zod_1.z.string().optional(),
        note: zod_1.z.string().optional(),
    }),
});
