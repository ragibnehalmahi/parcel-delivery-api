"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParcelStatus = void 0;
var ParcelStatus;
(function (ParcelStatus) {
    ParcelStatus["REQUESTED"] = "Requested";
    ParcelStatus["APPROVED"] = "Approved";
    ParcelStatus["DISPATCHED"] = "Dispatched";
    ParcelStatus["PICKED"] = "Picked";
    ParcelStatus["IN_TRANSIT"] = "In Transit";
    ParcelStatus["HELD"] = "Held";
    ParcelStatus["DELIVERED"] = "Delivered";
    ParcelStatus["RETURNED"] = "Returned";
    ParcelStatus["CANCELLED"] = "Cancelled";
})(ParcelStatus || (exports.ParcelStatus = ParcelStatus = {}));
