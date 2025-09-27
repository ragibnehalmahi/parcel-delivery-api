
import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";
import AppError from "../../errorHelpers/appError";
import httpStatus from "http-status-codes";

// 🔹 Handle Zod validation errors centrally
const handleValidationError = (error: unknown, next: NextFunction) => {
  if (error instanceof ZodError) {
    const messages = error.issues.map((err) => {
      const field = err.path.join(".");
      return `${field}: ${err.message}`;
    });

    return next(
      new AppError(
        `Validation failed: ${messages.join(", ")}`,
        httpStatus.BAD_REQUEST
      )
    );
  }

  next(
    new AppError(
      "An unexpected error occurred during validation",
      httpStatus.INTERNAL_SERVER_ERROR
    )
  );
};

// 🔹 Generic validator middleware (body + query + params)
export const validate =
  (schema: ZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      handleValidationError(error, next);
    }
  };

// 🔹 Specific helper (if you want body/query/params individually)
export const validateBody =
  (schema: ZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      handleValidationError(error, next);
    }
  };

export const validateQuery =
  (schema: ZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.query);
      next();
    } catch (error) {
      handleValidationError(error, next);
    }
  };

export const validateParams =
  (schema: ZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.params);
      next();
    } catch (error) {
      handleValidationError(error, next);
    }
  };
