import jwt, { JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHelpers/appError";
import httpStatus from "http-status";

interface CustomPayload extends JwtPayload {
  userId: string;
  role: string;
  email: string;
}

export const decodedToken = (token: string): CustomPayload => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as CustomPayload;

    if (!decoded.userId || !decoded.role) {
      throw new AppError("Invalid token payload - missing required fields", httpStatus.UNAUTHORIZED);
    }

    return decoded;
  } catch (err) {
    throw new AppError("Invalid or expired token", httpStatus.UNAUTHORIZED);
  }
};
