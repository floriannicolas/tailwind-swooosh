import fs from "fs";
import { glob } from "glob";
import Color from "colorjs.io";
import nearestColor from "nearest-color";
import { CssVariableManager } from "../css-variable-manager";
import colornames from "./color-name-list/colornames.json";
import { toDashCase } from "../utils/string";
import { listenerCount } from "process";

const colors = colornames.reduce(
  (o: any, { name, hex }: { name: string; hex: string }) =>
    Object.assign(o, { [name]: hex }),
  {}
);
const nearest = nearestColor.from(colors) as unknown as (hex: string) => {
  name: string;
  value: string;
};

class ColorManager {
  static colorToName(color: string): string {
    const hex = ColorManager.colorToHex(color);
    return toDashCase(nearest(hex).name);
  }

  static detectColorType(color: string): string {
    if (color.startsWith("#")) return "Hex";
    if (color.startsWith("rgb(")) return "RGB";
    if (color.startsWith("rgba(")) return "RGBA";
    if (color.startsWith("hsl(")) return "HSL";
    if (color.startsWith("hsla(")) return "HSLA";
    if (color.startsWith("oklch(")) return "OKLCH";

    return "Unknown";
  }

  static colorToHex(color: string): string {
    const type = ColorManager.detectColorType(color);
    switch (type) {
      case "Hex":
        return color;
      case "RGB":
      case "RGBA":
      case "HSL":
      case "HSLA":
        const baseHex = new Color(color.replace(/_/gi, " ")).to("srgb");
        return baseHex.toString({ format: "hex" });
      case "OKLCH":
        const hex = new Color(color.replace(/_/gi, " ")).to("srgb");
        return hex.toString({ format: "hex" });
      default:
        return 'unknown';
    }
  }

  static extract(folderPath: string): string {
    // Regex to match Tailwind colors (e.g., bg-[#xxxxxx], text-[#xxxxxx], border-[#xxxxxx])
    const regex =
      /\b(?:bg|text|border|ring|shadow|outline)-\[(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})|rgb\(\d{1,3},\d{1,3},\d{1,3}\)|rgba\(\d{1,3},\d{1,3},\d{1,3},(?:0|1|0?\.\d+)\)|hsl\(\d{1,3},\d{1,3}%,\d{1,3}%\)|hsla\(\d{1,3},\d{1,3}%,\d{1,3}%,(?:0|1|0?\.\d+)\)|oklch\(\d{1,3}(?:\.\d+)?%?_+\d{1,3}(?:\.\d+)?_+\d{1,3}(?:\.\d+)?(?:_\/?_?(?:0|1|0?\.\d+))?\))\]/gi;
    const files = glob.sync(`${folderPath}/**/*.{tsx,ts,jsx,js}`);

    const colorUsage: Record<
      string,
      { type: string; count: number; files: Set<string> }
    > = {}; // Store color data

    files.forEach((file: any) => {
      if (fs.statSync(file).isFile()) {
        const content = fs.readFileSync(file, "utf8");
        let match;
        while ((match = regex.exec(content)) !== null) {
          const color = match[1];
          const colorType = ColorManager.detectColorType(color);

          if (!colorUsage[color]) {
            colorUsage[color] = { type: colorType, count: 0, files: new Set() };
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
        suggestedName: ColorManager.colorToName(color),
      }));

    // Calculate total occurrences for percentage calculation
    const totalUsage = sortedColors.reduce((acc, { count }) => acc + count, 0);

    // Format the output
    let output = sortedColors
      .map(({ color, count, files, suggestedName }) => {
        const percentage = ((count / totalUsage) * 100).toFixed(2);
        return `${color} → used ${count} times (${percentage}%) → suggested: --color-${suggestedName}\n  Found in:\n  - ${files.join(
          "\n  - "
        )}\n`;
      })
      .join("\n");

    // Add color variables (hex format)
    let colorVariables = "\n\nColor variables (hex format):\n";
    sortedColors.forEach(({ color, suggestedName }) => {
      color = color.replace(/_/gi, " ");
      colorVariables += `--color-${suggestedName}: ${color};\n`;
    });

    // Add color variables (OKLCH format)
    let colorVariablesOKLCH = "\n\nColor variables (oklch optimized format):\n";
    sortedColors.forEach(({ color, suggestedName }) => {
      color = color.replace(/_/gi, " ");
      const oklch = new Color(color).to("oklch");
      const oklchColor = oklch.toString();
      colorVariablesOKLCH += `--color-${suggestedName}: ${oklchColor}; /* ${color} */\n`;
    });

    return output + colorVariables + colorVariablesOKLCH;
  }

  static replace(folderPath: string, dryRun: boolean = false): void {
    const allCssVariables = CssVariableManager.getAllVariables(folderPath);

    const cssFiles = glob.sync(`${folderPath}/**/*.css`);
    const colorVariables: Record<string, string> = {};

    // CSS variable pattern: --color-name: #hex;
    const cssVarRegex = /--color-([a-zA-Z0-9\-_]+)\s*:\s*([^;]+);/g;

    cssFiles.forEach((file) => {
      if (fs.statSync(file).isFile()) {
        const content = fs.readFileSync(file, "utf8");
        const contentWithoutDarkMode = content.replace(
          /\.dark\s*{[^}]*}/gs,
          ""
        );
        let match;
        while ((match = cssVarRegex.exec(contentWithoutDarkMode)) !== null) {
          const varName = match[1];
          let color = match[2];
          const varRegex = /var\(--([a-zA-Z0-9\-_]+)\)/;
          const matchVar = color.match(varRegex);
          if (matchVar) {
            const varValue = allCssVariables[matchVar[1]];
            if (varValue) {
              color = varValue;
            }
          }
          const hexColor = ColorManager.colorToHex(color);
          if (hexColor && hexColor !== 'unknown') {
            colorVariables[hexColor.toLowerCase()] = varName;
          }
        }
      }
    });

    // If no variables found, we exit.
    if (Object.keys(colorVariables).length === 0) {
      console.log("No CSS variables found.");

      return;
    }

    console.log(
      `${Object.keys(colorVariables).length} color variables detected`
    );
    if (dryRun) {
      console.log("🔍 DRY RUN MODE: No files will be modified");
    }

    // Step 2: Replace colors in TSX/JSX/TS/JS files with variables
    const files = glob.sync(`${folderPath}/**/*.{tsx,ts,jsx,js}`);
    let totalReplacements = 0;
    let modifiedFiles = 0;
    const changesReport: Record<
      string,
      { original: string; replacement: string }[]
    > = {};

    files.forEach((file) => {
      if (fs.statSync(file).isFile()) {
        const content = fs.readFileSync(file, "utf8");
        let modifiedContent = content;
        let fileModified = false;
        const fileChanges: { original: string; replacement: string }[] = [];

        // Replace colors in Tailwind classes
        Object.entries(colorVariables).forEach(([hexColor, varName]) => {
          const pattern = new RegExp(
            `(bg|text|border|ring|shadow|outline)-\\[${hexColor}\\]`,
            "gi"
          );

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
            fs.writeFileSync(file, modifiedContent);
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
      console.log(
        `\n🔍 DRY RUN SUMMARY: Would replace ${totalReplacements} color instances in ${modifiedFiles} files`
      );
    } else {
      console.log(
        `✅ Replaced ${totalReplacements} color instances in ${modifiedFiles} files`
      );
    }
  }
}

export { ColorManager };
