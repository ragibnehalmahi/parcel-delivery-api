"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const config_1 = require("./app/config");
//import { seedSuperAdmin } from "./utils/seedSuperAdmin";
let server;
const startServer = async () => {
    try {
        await mongoose_1.default.connect(config_1.envVars.DB_URL);
        console.log("Connected to DB!!");
        server = app_1.default.listen(config_1.envVars.PORT, () => {
            console.log(`Server is listening to port ${config_1.envVars.PORT}`);
        });
    }
    catch (error) {
        console.log(error);
    }
};
(async () => {
    await startServer();
    //await seedSuperAdmin()
})();
process.on("SIGTERM", () => {
    console.log("SIGTERM signal recieved... Server shutting down..");
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
process.on("SIGINT", () => {
    console.log("SIGINT signal recieved... Server shutting down..");
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
process.on("unhandledRejection", (err) => {
    console.log("Unhandled Rejecttion detected... Server shutting down..", err);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
process.on("uncaughtException", (err) => {
    console.log("Uncaught Exception detected... Server shutting down..", err);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
// Unhandler rejection error
// Promise.reject(new Error("I forgot to catch this promise"))
// Uncaught Exception Error
// throw new Error("I forgot to handle this local erro")
/**
 * unhandled rejection error
 * uncaught rejection error
 * signal termination sigterm
 */ 
