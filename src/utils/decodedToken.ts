import AppError from "../errorHelpers/appError";
import  jwt, { JwtPayload }  from "jsonwebtoken";

export const decodedToken = (token: string): { userId: string; role: string; email: string } => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    return {
      userId: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };
  } catch (error) {
    throw new AppError(401,`Invalid token: ${error}` );
  }
};