"use strict";
//status code
//data
//message
//success
//meta
Object.defineProperty(exports, "__esModule", { value: true });
const sendResponse = (res, data) => {
    res.status(data.statusCode).json({
        success: data.success ?? true,
        message: data.message,
        data: data.data,
        meta: data.meta,
    });
};
exports.default = sendResponse;
