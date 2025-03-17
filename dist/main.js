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
TailwindSwooosh.extract = (targets = [], folderPath = '.') => {
    let output = `Tailwind Swooosh extract results for target(s): ${targets.join(', ')} \n`;
    output += "__________________________________________________________________________________________________ \n\n";
    if (targets.length === 0 || targets.includes("color")) {
        output += color_1.ColorManager.extract(folderPath);
    }
    // Write results to `tailwind-swooosh-extract.txt`
    fs_1.default.writeFileSync("./tailwind-swooosh-extract.txt", output);
    console.log("✅ Analysis complete! Results saved in tailwind-swooosh-extract.txt");
};
TailwindSwooosh.replace = (targets = [], folderPath = '.', dryRun = false) => {
    if (targets.length === 0 || targets.includes("color")) {
        color_1.ColorManager.replace(folderPath, dryRun);
    }
};
