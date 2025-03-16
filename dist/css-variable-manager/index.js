"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CssVariableManager = void 0;
const fs_1 = __importDefault(require("fs"));
const glob_1 = require("glob");
class CssVariableManager {
    static getAllVariables(folderPath) {
        const cssFiles = glob_1.glob.sync(`${folderPath}/**/*.css`);
        const colorVariables = {};
        const regex = /--([a-zA-Z0-9\-_]+)\s*:\s*([^;]+);/g;
        cssFiles.forEach((file) => {
            if (fs_1.default.statSync(file).isFile()) {
                const content = fs_1.default.readFileSync(file, "utf8");
                const contentWithoutDarkMode = content.replace(/\.dark\s*{[^}]*}/gs, "");
                let match;
                while ((match = regex.exec(contentWithoutDarkMode)) !== null) {
                    const varName = match[1];
                    const value = match[2].trim();
                    colorVariables[varName] = value;
                }
            }
        });
        return colorVariables;
    }
}
exports.CssVariableManager = CssVariableManager;
