import fs from "fs";
import { glob } from "glob";
import Color from "colorjs.io";
import nearestColor from "nearest-color";
import colornames from "./color-name-list/colornames.json";

// Regex to match Tailwind colors (e.g., bg-[#xxxxxx], text-[#xxxxxx], border-[#xxxxxx])
const regex = /\b(?:bg|text|border|ring|shadow|outline)-\[#([0-9a-fA-F]{6})\]/g;

const toDashCase = (str: string | null): string | null => {
  if (!str) return null;
  return str
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .replace(/^-/, "");
};

const colors = colornames.reduce(
  (o: any, { name, hex }: { name: string; hex: string }) =>
    Object.assign(o, { [name]: hex }),
  {}
);
const nearest = nearestColor.from(colors) as unknown as (hex: string) => {
  name: string;
  value: string;
};

const getColorName = (hex: string) => {
  return toDashCase(nearest(hex).name);
};

// Scan all TSX/JSX/TS/JS files in the specified folder and extract colors
const scanFolderAndExtractColors = (folderPath: string) => {
  const files = glob.sync(`${folderPath}/**/*.{tsx,ts,jsx,js}`);

  const colorUsage: Record<string, { count: number; files: Set<string> }> = {}; // Store color data

  files.forEach((file: any) => {
    if (fs.statSync(file).isFile()) {
      const content = fs.readFileSync(file, "utf8");
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
      return `${color} → used ${count} times (${percentage}%) → suggested: --color-${suggestedName}\n  Found in:\n  - ${files.join(
        "\n  - "
      )}\n`;
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
    const oklch = new Color(color).to("oklch");
    const oklchColor = oklch.toString();
    colorVariablesOKLCH += `--color-${suggestedName}: ${oklchColor}; /* ${color} */\n`;
  });

  // Write results to `tailwind-swooosh-color-usage.txt`
  fs.writeFileSync(
    "./tailwind-swooosh-color-usage.txt",
    output + colorVariables + colorVariablesOKLCH
  );
  console.log(
    "✅ Analysis complete! Results saved in tailwind-swooosh-color-usage.txt"
  );
};

const scanFolderAndReplaceColorsByVariables = (folderPath: string) => {
  const files = glob.sync(`${folderPath}/**/*.{tsx,ts,jsx,js}`);
  console.log(
    "TODO : replace colors by variables in files",
  );
}

export { scanFolderAndExtractColors, scanFolderAndReplaceColorsByVariables };
