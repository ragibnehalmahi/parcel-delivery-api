 
import { Types } from "mongoose";

 export enum UserRole {
  ADMIN = "ADMIN",
  SENDER = "SENDER",
  RECEIVER = "RECEIVER",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED",
  DELETED = "DELETED",
}

 
export interface IAuthProvider {
  provider: string;
  providerId: string;
}

 
export interface IUserLocation {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

 
export interface IUser {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone: string;
  picture?: string | null;
  address?: string | null;
  role: UserRole;
  status?: UserStatus;
  isDeleted?: boolean;
  isVerified?: boolean;
  authProviders?: IAuthProvider[];
   location?:IUserLocation;

   
  comparePassword?(candidatePassword: string): Promise<boolean>;
}
