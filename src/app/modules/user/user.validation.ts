import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.nativeEnum({
    ADMIN: "ADMIN",
    SENDER: "SENDER",
    RECEIVER: "RECEIVER",
  }).optional(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  role: z.nativeEnum({
    ADMIN: "ADMIN",
    SENDER: "SENDER",
    RECEIVER: "RECEIVER",
  }).optional(),
  verified: z.boolean().optional(),
});

export const ListUsersQuerySchema = z.object({
  page: z.coerce.number().positive().optional(),
  limit: z.coerce.number().positive().optional(),
  role: z.string().optional(),
  state: z.string().optional(),
  search: z.string().optional(),
});
