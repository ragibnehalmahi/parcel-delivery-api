import { Request,Response,NextFunction } from "express";
export const validateRequest =
  (schema: any) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body); // শুধু body পাঠাচ্ছি
      next();
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: error.errors || error.message,
      });
    }
  };

