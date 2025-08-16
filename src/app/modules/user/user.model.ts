// src/modules/user/user.model.ts
import { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser, IUserLocation, UserRole, UserStatus } from "./user.interface";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUND) || 10;

/**
 * Create a Mongoose Document type that includes IUser plus instance methods
 */
export type UserDocument = Document & IUser & {
  comparePassword(candidatePassword: string): Promise<boolean>;
};

/** Sub-schema: coordinates (no _id) */
const CoordinatesSchema = new Schema(
  {
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
);

/** Sub-schema: location (embed coordinates schema) */
const UserLocationSchema = new Schema<IUserLocation>(
  {
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String },
    coordinates: CoordinatesSchema,
  },
  { _id: false }
);

/** Auth provider sub-schema */
const AuthProviderSchema = new Schema(
  {
    provider: { type: String, required: true },
    providerId: { type: String, required: true },
  },
  { _id: false }
);

/** Main user schema */
const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, default: null },
    picture: { type: String, default: null },
    address: { type: String, default: null },

    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.SENDER,
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
    },

    isDeleted: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },

    authProviders: { type: [AuthProviderSchema], default: [] },

    

    // Embed location schema directly — Mongoose accepts a Schema object here
    location: { type: UserLocationSchema, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
 toJSON: {
  transform(doc, ret) {
    const obj = ret as any;
    if (obj.password !== undefined) obj.password = undefined;
    return obj;
  },
},

  }
);

/** Hash password before save when modified */
UserSchema.pre<UserDocument>("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashed = await bcrypt.hash(this.password, salt);
    this.password = hashed;
    return next();
  } catch (err) {
    return next(err as Error);
  }
});

/** Instance method to compare password */
UserSchema.methods.comparePassword = async function (candidatePassword: string) {
  // Note: when fetching user for auth, use .select('+password')
  return bcrypt.compare(candidatePassword, this.password);
};

/** Indexes */
//UserSchema.index({ email: 1 });

export const User = model<UserDocument>("User", UserSchema);
