import { Request, Response,NextFunction } from "express";
import httpStatus from "http-status";
 
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuthService } from "./auth.service";
import AppError from "../../../errorHelpers/appError";
import bcrypt from 'bcryptjs'
import { User } from "../user/user.model";
import { IUser } from "../user/user.interface";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken"
import { envVars } from "../../config";
 


const credentialsLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const loginInfo = await AuthService.credentialsLogin(req.body)
   interface AuthTokens {
    accessToken?: string;
    refreshToken?: string;
}

const setAuthCookie = (res: Response, tokenInfo: AuthTokens) => {
    if (tokenInfo.accessToken) {
        res.cookie("accessToken", tokenInfo.accessToken, {
            httpOnly: true,
            secure: false
        })
    }

    if (tokenInfo.refreshToken) {
        res.cookie("refreshToken", tokenInfo.refreshToken, {
            httpOnly: true,
            secure: false,
        })
    }
}
 setAuthCookie(res, loginInfo)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User Logged In Successfully",
        data: loginInfo,
    })
})




// ✅ Refresh Token Controller
const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await AuthService.getNewAccessToken(refreshToken);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New access token generated",
    data: result,
  });
});

// ✅ Reset Password Controller
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const authUser = req.user as { _id: string; email: string; role: string };

  const result = await AuthService.changePassword(authUser._id, oldPassword, newPassword);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successful",
    data: result,
  });
});


// ✅ Logout Controller
const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await AuthService.logoutUser(refreshToken);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logout successful",
    data: result,
  });
});

export const AuthController = {
  credentialsLogin,
  refreshToken,
  changePassword,
  logoutUser,
};
