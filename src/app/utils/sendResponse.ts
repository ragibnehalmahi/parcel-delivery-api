import { Response } from "express";

interface Tresponse<T> {
  success: boolean;
  message: string;
  status: number;
  data?: T;
  metadata?: {
    totalCount?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
}

export const sendResponse = <T>(res: Response, response: Tresponse<T>) => {
  const { success, message, status, data, metadata } = response;

  return res.status(status).json({
    success,
    status,
    message,
    metadata,
    data,
  });
};