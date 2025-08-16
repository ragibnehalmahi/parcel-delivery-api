// src/helpers/jwtHelpers.ts
import jwt, { JwtPayload, Secret } from "jsonwebtoken";

const createToken = (
  payload: object,
  secret: Secret,
  expiresIn: string
): string => {
  return jwt.sign(payload, secret, { expiresIn }) as string ;
};

const verifyToken = (token: string, secret: Secret): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};

export const jwtHelpers = {
  createToken,
  verifyToken,
};
