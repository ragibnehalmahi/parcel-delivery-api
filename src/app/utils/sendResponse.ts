//status code
//data
//message
//success
//meta

import { Response } from "express";

interface TMeta {
  total: number;
}
interface IApiResponse<T> {
  statusCode: number;
  success?: boolean;
  message: string;
  data?: T;
  meta?: TMeta;
}

const sendResponse = <T>(res: Response, data: IApiResponse<T>) => {
  res.status(data.statusCode).json({
    success: data.success ?? true,
    message: data.message,
    data: data.data,
    meta: data.meta,
  });
};

export default sendResponse;