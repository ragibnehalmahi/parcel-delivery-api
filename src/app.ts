import express from 'express';
import cors from 'cors';
import { ParcelRoutes } from './app/modules/parcel/parcel.route'; 
//ort { globalErrorHandler } from './middlewares/globalErrorHandler';
import { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { UserRouter } from './app/modules/user/user.route';
import { AuthRoutes } from './app/modules/auth/auth.route';
import router from './app/routes';

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload'
    });
  }
  next();
});

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to parcel delivery app"
  });
});

app.use('/api/v1/', router);
 

 

export default app;

