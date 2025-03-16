"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDashCase = void 0;
const toDashCase = (str) => {
    return str
        .trim()
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase()
        .replace(/^-/, "");
};
exports.toDashCase = toDashCase;
