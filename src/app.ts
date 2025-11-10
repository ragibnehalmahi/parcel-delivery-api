import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import router from "./app/routes";

const app = express();

// ✅ Middleware order খুব গুরুত্বপূর্ণ

// 1️⃣ CORS config
app.use(
  cors({
    origin: ["http://localhost:5173"], // তোমার frontend URL
    credentials: true, // cookies পাঠানোর অনুমতি
  })
);

// 2️⃣ Body parsers (CORS এর পরেই)
app.use(express.json()); // <-- JSON body পার্স করবে
app.use(express.urlencoded({ extended: true })); // form data পার্স করবে

// 3️⃣ Cookie parser
app.use(cookieParser());

// ✅ Root route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to parcel delivery app 🚚",
  });
});

// ✅ Main router
app.use("/api/v1", router);

// ✅ Global JSON parse error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload",
    });
  }
  next(err);
});

export default app;

