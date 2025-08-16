import { Request, Response, NextFunction } from "express";
import { ZodObject } from "zod";

export const validateRequest =
  (schema: ZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: error.errors || error.message,
      });
    }
  };
