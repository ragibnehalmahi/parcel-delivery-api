import { z } from "zod";

export const createParcelValidation = z.object({
  body: z.object({
    receiverName: z.string().min(2, "Receiver name is required"),
    receiverPhone: z.string().min(10, "Valid phone number required"),
    receiverAddress: z.string().min(5, "Receiver address is required"),
    receiverUserId: z.string().optional(),
    parcelType: z.string().min(2, "Parcel type is required"),
    weight: z.number().positive("Weight must be positive"),
    deliveryAddress: z
      .string()
      .min(5, "Delivery address must be at least 5 characters"),
  }),
});

export const updateParcelStatusValidation = z.object({
  body: z.object({
    status: z.string(),
    location: z.string().optional(),
    note: z.string().optional(),
  }),
});
