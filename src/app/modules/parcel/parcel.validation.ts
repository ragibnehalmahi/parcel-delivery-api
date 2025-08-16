import { z } from "zod";

export const createParcelZodSchema = z.object({
  body: z.object({
    // sender comes from token; DO NOT allow in body for security
    receiver: z.string({ error: "Receiver is required" }),
    pickupLocation: z.string().min(1),
    dropoffLocation: z.string().min(1),
    weight: z.number().positive(),
    distance: z.number().positive(),
    note: z.string().max(500).optional(), // optional first note
  }),
});

export const updateParcelZodSchema = z.object({
  body: z.object({
    pickupLocation: z.string().min(1).optional(),
    dropoffLocation: z.string().min(1).optional(),
    weight: z.number().positive().optional(),
    distance: z.number().positive().optional(),
    note: z.string().max(500).optional(),
  }),
});

export const changeStatusZodSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "IN_TRANSIT", "DELIVERED", "CANCELLED", "BLOCKED"]),
    location: z.string().optional(),
    note: z.string().max(500).optional(),
  }),
});
