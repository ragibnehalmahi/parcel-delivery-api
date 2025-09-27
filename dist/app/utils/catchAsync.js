"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Catch async errors wrapper
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            // eslint-disable-next-line no-console
            console.error("Error in AsyncHandler:", error);
            next(error);
        });
    };
};
exports.default = catchAsync;
