/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express"
import httpStatus from "http-status-codes"
import { JwtPayload } from "jsonwebtoken"
import { config } from "../../config/env"
import AppError from "../../../errorHelpers/appError"
import { catchAsync } from "../../utils/catchAsync"
import { sendResponse } from "../../utils/sendResponse"
import { setAuthCookie } from "../../utils/setCookie"
import { createUserTokens } from "../../utils/userTokens"
import { AuthServices } from "./auth.service"
import mongoose from "mongoose";

const credentialsLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const loginInfo = await AuthServices.credentialsLogin(req.body)

     

    setAuthCookie(res, loginInfo)

    sendResponse(res, {
        success: true,
         status: httpStatus.OK,
        message: "User Logged In Successfully",
        data: loginInfo,
    })
})
const getNewAccessToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        throw new AppError(httpStatus.BAD_REQUEST, "No refresh token recieved from cookies")
    }
    const tokenInfo = await AuthServices.getNewAccessToken(refreshToken as string)

     

    setAuthCookie(res, tokenInfo);

    sendResponse(res, {
        success: true,
         status: httpStatus.OK,
        message: "New Access Token Retrived Successfully",
        data: tokenInfo,
    })
})
const logout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    })
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    })

    sendResponse(res, {
        success: true,
         status: httpStatus.OK,
        message: "User Logged Out Successfully",
        data: null,
    })
})
// const resetPassword = catchAsync(async (req: Request, res: Response ) => {

//     const newPassword = req.body.newPassword;
//     const oldPassword = req.body.oldPassword;
//     const decodedToken = req.user

//     await AuthServices.resetPassword(oldPassword, newPassword, decodedToken as string);

//     sendResponse(res, {
//         success: true,
//          status: httpStatus.OK,
//         message: "Password Changed Successfully",
//         data: null,
//     })
// })
 const resetPassword = catchAsync( async (req: Request, res: Response, _next: NextFunction) => {
   
      
   const newPassword = req.body.newPassword;
   const oldPassword =req.body.oldPassword
   const decodateToken = req.user

 await AuthServices.resetPassword(oldPassword, newPassword, decodateToken as JwtPayload);

    sendResponse(res, {
      success: true,
      status: 200,
      message: "User password changed  successfully",
      data: null,
    });
  }
);
export const AuthControllers = {
    credentialsLogin,
    getNewAccessToken,
    logout,
    resetPassword
   
}