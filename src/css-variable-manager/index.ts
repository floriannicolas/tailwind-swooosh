import fs from "fs";
import { glob } from "glob";

class CssVariableManager {
  static getAllVariables(folderPath: string): Record<string, string> {
    const cssFiles = glob.sync(`${folderPath}/**/*.css`);
    const colorVariables: Record<string, string> = {};
    const regex = /--([a-zA-Z0-9\-_]+)\s*:\s*([^;]+);/g;

    cssFiles.forEach((file) => {
      if (fs.statSync(file).isFile()) {
        const content = fs.readFileSync(file, "utf8");
        const contentWithoutDarkMode = content.replace(
          /\.dark\s*{[^}]*}/gs,
          ""
        );
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

export { CssVariableManager };
