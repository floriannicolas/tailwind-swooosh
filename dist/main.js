"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TailwindSwooosh = void 0;
const fs_1 = __importDefault(require("fs"));
const color_1 = require("./color");
class TailwindSwooosh {
}
exports.TailwindSwooosh = TailwindSwooosh;
TailwindSwooosh.extract = (folderPath, types = []) => {
    let output = "";
    if (types.length === 0 || types.includes("color")) {
        output += color_1.ColorManager.extract(folderPath);
    }
    // Write results to `tailwind-swooosh-extract.txt`
    fs_1.default.writeFileSync("./tailwind-swooosh-extract.txt", output);
    console.log("✅ Analysis complete! Results saved in tailwind-swooosh-extract.txt");
};
TailwindSwooosh.replace = (folderPath, dryRun = false, types = []) => {
    if (types.length === 0 || types.includes("color")) {
        color_1.ColorManager.replace(folderPath, dryRun);
    }
};
