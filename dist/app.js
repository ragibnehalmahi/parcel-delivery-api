"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const routes_1 = __importDefault(require("./app/routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON payload'
        });
    }
    next();
});
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Welcome to parcel delivery app"
    });
});
app.use('/api/v1/', routes_1.default);
exports.default = app;
