"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanFolderAndReplaceColorsByVariables = exports.scanFolderAndExtractColors = void 0;
const fs_1 = __importDefault(require("fs"));
const glob_1 = require("glob");
const colorjs_io_1 = __importDefault(require("colorjs.io"));
const nearest_color_1 = __importDefault(require("nearest-color"));
const colornames_json_1 = __importDefault(require("./color-name-list/colornames.json"));
// Regex to match Tailwind colors (e.g., bg-[#xxxxxx], text-[#xxxxxx], border-[#xxxxxx])
const regex = /\b(?:bg|text|border|ring|shadow|outline)-\[#([0-9a-fA-F]{6})\]/g;
const toDashCase = (str) => {
    if (!str)
        return null;
    return str
        .trim()
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase()
        .replace(/^-/, "");
};
const colors = colornames_json_1.default.reduce((o, { name, hex }) => Object.assign(o, { [name]: hex }), {});
const nearest = nearest_color_1.default.from(colors);
const getColorName = (hex) => {
    return toDashCase(nearest(hex).name);
};
// Scan all TSX/JSX/TS/JS files in the specified folder and extract colors
const scanFolderAndExtractColors = (folderPath) => {
    const files = glob_1.glob.sync(`${folderPath}/**/*.{tsx,ts,jsx,js}`);
    const colorUsage = {}; // Store color data
    files.forEach((file) => {
        if (fs_1.default.statSync(file).isFile()) {
            const content = fs_1.default.readFileSync(file, "utf8");
            let match;
            while ((match = regex.exec(content)) !== null) {
                const color = `#${match[1]}`;
                if (!colorUsage[color]) {
                    colorUsage[color] = { count: 0, files: new Set() };
                }
                colorUsage[color].count += 1;
                colorUsage[color].files.add(file);
            }
        }
    });
    // Sort colors by usage count (descending order)
    const sortedColors = Object.entries(colorUsage)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([color, data]) => ({
        color,
        count: data.count,
        files: Array.from(data.files),
        suggestedName: getColorName(color),
    }));
    // Calculate total occurrences for percentage calculation
    const totalUsage = sortedColors.reduce((acc, { count }) => acc + count, 0);
    // Format the output
    let output = sortedColors
        .map(({ color, count, files, suggestedName }) => {
        const percentage = ((count / totalUsage) * 100).toFixed(2);
        return `${color} → used ${count} times (${percentage}%) → suggested: --color-${suggestedName}\n  Found in:\n  - ${files.join("\n  - ")}\n`;
    })
        .join("\n");
    // Add color variables (hex format)
    let colorVariables = "\n\nColor variables (hex format):\n";
    sortedColors.forEach(({ color, suggestedName }) => {
        colorVariables += `--color-${suggestedName}: ${color};\n`;
    });
    // Add color variables (OKLCH format)
    let colorVariablesOKLCH = "\n\nColor variables (oklch optimized format):\n";
    sortedColors.forEach(({ color, suggestedName }) => {
        const oklch = new colorjs_io_1.default(color).to("oklch");
        const oklchColor = oklch.toString();
        colorVariablesOKLCH += `--color-${suggestedName}: ${oklchColor}; /* ${color} */\n`;
    });
    // Write results to `tailwind-swooosh-color-usage.txt`
    fs_1.default.writeFileSync("./tailwind-swooosh-color-usage.txt", output + colorVariables + colorVariablesOKLCH);
    console.log("✅ Analysis complete! Results saved in tailwind-swooosh-color-usage.txt");
};
exports.scanFolderAndExtractColors = scanFolderAndExtractColors;
const scanFolderAndReplaceColorsByVariables = (folderPath) => {
    const files = glob_1.glob.sync(`${folderPath}/**/*.{tsx,ts,jsx,js}`);
    console.log("TODO : replace colors by variables in files");
};
exports.scanFolderAndReplaceColorsByVariables = scanFolderAndReplaceColorsByVariables;
