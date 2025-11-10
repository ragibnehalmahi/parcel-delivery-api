
import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";
import AppError from "../../errorHelpers/appError";
import httpStatus from "http-status-codes";

// 🔹 Handle Zod validation errors centrally
// const handleValidationError = (error: unknown, next: NextFunction) => {
//   if (error instanceof ZodError) {
//     const messages = error.issues.map((err) => {
//       const field = err.path.join(".");
//       return `${field}: ${err.message}`;
//     });

//     return next(
//       new AppError(
//         `Validation failed: ${messages.join(", ")}`,
//         httpStatus.BAD_REQUEST
//       )
//     );
//   }

//   next(
//     new AppError(
//       "An unexpected error occurred during validation",
//       httpStatus.INTERNAL_SERVER_ERROR
//     )
//   );
// };
const handleValidationError = (error: unknown, next: NextFunction): void => {
  // Mocking constants for completeness, replace with your actual imports
  const httpStatus = { BAD_REQUEST: 400, INTERNAL_SERVER_ERROR: 500 };
  
  // NOTE: You must ensure 'AppError' is imported/defined correctly in your environment.
  // Example placeholder for AppError (if needed):
  // class AppError extends Error { statusCode: number; constructor(message: string, statusCode: number) { super(message); this.statusCode = statusCode; } }

  if (error instanceof ZodError) {
    const messages = error.issues.map((err) => {
      const field = err.path.join(".");
      let message = err.message;

      // --- ENHANCEMENT: Simplify error message for missing required fields ---
      // If Zod reports 'invalid_type' and the expected value was not received (like 'undefined'),
      // we simplify the message from "Invalid input: expected object, received undefined"
      // to just "is required."
      if (
        err.code === 'invalid_type' && 
        (message.includes('received undefined') || message.includes('received null'))
      ) {
        message = 'is required';
      } 
      // Fallback for other issues (min length, invalid format, etc.)
      else if (message.includes('Invalid input')) {
        // Clean up other generic Zod messages if possible
        message = message.replace('Invalid input', 'Invalid value');
      }

      return `${field}: ${message}`;
    });

    // Return the formatted validation error to the Express error handler
    return next(
      new AppError(
        `Validation failed: ${messages.join(", ")}`,
        httpStatus.BAD_REQUEST
      )
    );
  }

  // Handle non-Zod errors (unexpected server errors)
  next(
    new AppError(
      // Use the error's message if it exists, otherwise use a generic message
      error instanceof Error ? error.message : "An unexpected error occurred during validation",
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
