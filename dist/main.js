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
const scanFolderAndReplaceColorsByVariables = (folderPath, dryRun = false) => {
    // Step 1: Scan CSS files to extract Tailwind color variables
    const cssFiles = glob_1.glob.sync(`${folderPath}/**/*.css`);
    const colorVariables = {};
    // CSS variable pattern: --color-name: #hex;
    const cssVarHexRegex = /--color-([a-zA-Z0-9-]+):\s*(#[0-9a-fA-F]{6})/g;
    cssFiles.forEach((file) => {
        if (fs_1.default.statSync(file).isFile()) {
            const content = fs_1.default.readFileSync(file, "utf8");
            const contentWithoutDarkMode = content.replace(/\.dark\s*{[^}]*}/gs, '');
            let match;
            while ((match = cssVarHexRegex.exec(contentWithoutDarkMode)) !== null) {
                const varName = match[1];
                const hexColor = match[2];
                colorVariables[hexColor.toLowerCase()] = varName;
            }
        }
    });
    const cssVarOklchRegex = /--color-([a-zA-Z0-9-]+):\s*oklch\(([^)]+)\)\s*;?/g;
    cssFiles.forEach((file) => {
        const content = fs_1.default.readFileSync(file, "utf8");
        const contentWithoutDarkMode = content.replace(/\.dark\s*{[^}]*}/gs, '');
        let match;
        while ((match = cssVarOklchRegex.exec(contentWithoutDarkMode)) !== null) {
            const varName = match[1];
            const oklchColor = `oklch(${match[2]})`;
            const hex = new colorjs_io_1.default(oklchColor).to("srgb");
            const hexColor = hex.toString({ format: "hex" });
            if (hexColor && varName) {
                colorVariables[hexColor.toLowerCase()] = varName;
            }
        }
    });
    // Detect color variables that reference other variables
    const cssVarRefRegex = /--color-([a-zA-Z0-9-]+):\s*var\(--([a-zA-Z0-9-]+)\)/g;
    const varReferences = {};
    // First pass: collect all variable references
    cssFiles.forEach((file) => {
        if (fs_1.default.statSync(file).isFile()) {
            const content = fs_1.default.readFileSync(file, "utf8");
            let match;
            while ((match = cssVarRefRegex.exec(content)) !== null) {
                const colorVarName = match[1];
                const referencedVarName = match[2];
                varReferences[colorVarName] = referencedVarName;
            }
        }
    });
    if (Object.keys(varReferences).length > 0) {
        let resolvedCount = 0;
        Object.entries(varReferences).forEach(([varName, referencedVarName]) => {
            // Searching for hex references
            const cssVarHexRegex = new RegExp(`--${referencedVarName}:\s*(#[0-9a-fA-F]{6})`, "g");
            cssFiles.forEach((file) => {
                if (fs_1.default.statSync(file).isFile()) {
                    const content = fs_1.default.readFileSync(file, "utf8");
                    const contentWithoutDarkMode = content.replace(/\.dark\s*{[^}]*}/gs, '');
                    let match;
                    while ((match = cssVarHexRegex.exec(contentWithoutDarkMode)) !== null) {
                        const hexColor = match[2];
                        colorVariables[hexColor.toLowerCase()] = varName;
                        resolvedCount++;
                    }
                }
            });
            // Searching for oklch references
            const cssVarOklchRegex = new RegExp(`--${referencedVarName}:\\s*oklch\\(([^)]+)\\)\\s*;?`, "g");
            cssFiles.forEach((file) => {
                const content = fs_1.default.readFileSync(file, "utf8");
                const contentWithoutDarkMode = content.replace(/\.dark\s*{[^}]*}/gs, '');
                let match;
                while ((match = cssVarOklchRegex.exec(contentWithoutDarkMode)) !== null) {
                    const oklchColor = `oklch(${match[1]})`;
                    const hex = new colorjs_io_1.default(oklchColor).to("srgb");
                    const hexColor = hex.toString({ format: "hex" });
                    if (hexColor && varName) {
                        colorVariables[hexColor.toLowerCase()] = varName;
                        resolvedCount++;
                    }
                }
            });
        });
        if (resolvedCount > 0) {
            console.log(`Resolved ${resolvedCount} variable references to their hex or oklch colors`);
        }
    }
    // If no variables found, we exit.
    if (Object.keys(colorVariables).length === 0) {
        console.log("No CSS variables found.");
        return;
    }
    console.log(`${Object.keys(colorVariables).length} color variables detected`);
    if (dryRun) {
        console.log("🔍 DRY RUN MODE: No files will be modified");
    }
    // Step 2: Replace colors in TSX/JSX/TS/JS files with variables
    const files = glob_1.glob.sync(`${folderPath}/**/*.{tsx,ts,jsx,js}`);
    let totalReplacements = 0;
    let modifiedFiles = 0;
    const changesReport = {};
    files.forEach((file) => {
        if (fs_1.default.statSync(file).isFile()) {
            const content = fs_1.default.readFileSync(file, "utf8");
            let modifiedContent = content;
            let fileModified = false;
            const fileChanges = [];
            // Replace colors in Tailwind classes
            Object.entries(colorVariables).forEach(([hexColor, varName]) => {
                const pattern = new RegExp(`(bg|text|border|ring|shadow|outline)-\\[${hexColor}\\]`, "gi");
                // Find all matches to report in dry run mode
                let match;
                const contentCopy = modifiedContent;
                while ((match = pattern.exec(contentCopy)) !== null) {
                    const original = match[0];
                    const replacement = `${match[1]}-${varName}`;
                    fileChanges.push({ original, replacement });
                }
                const replacement = `$1-${varName}`;
                if (pattern.test(modifiedContent)) {
                    modifiedContent = modifiedContent.replace(pattern, replacement);
                    fileModified = true;
                    totalReplacements++;
                }
            });
            if (fileModified) {
                if (fileChanges.length > 0) {
                    changesReport[file] = fileChanges;
                }
                if (!dryRun) {
                    fs_1.default.writeFileSync(file, modifiedContent);
                }
                modifiedFiles++;
            }
        }
    });
    if (dryRun) {
        console.log("\n📋 Changes that would be made:");
        Object.entries(changesReport).forEach(([file, changes]) => {
            console.log(`\n📄 ${file}:`);
            changes.forEach(({ original, replacement }) => {
                console.log(`  - ${original} → ${replacement}`);
            });
        });
        console.log(`\n🔍 DRY RUN SUMMARY: Would replace ${totalReplacements} color instances in ${modifiedFiles} files`);
    }
    else {
        console.log(`✅ Replaced ${totalReplacements} color instances in ${modifiedFiles} files`);
    }
};
exports.scanFolderAndReplaceColorsByVariables = scanFolderAndReplaceColorsByVariables;
