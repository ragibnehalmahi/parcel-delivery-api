import { Request,Response,NextFunction } from "express";
import { success } from "zod";

export const globalErrorHandler = ( err : any,req: Request, res: Response, next: NextFunction)=>{
    const status = err.status || 500;
    const message = err.message || 'something  went wrong'
    res.status(status).json({success:false,message})

}