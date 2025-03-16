import fs from "fs";
import { ColorManager } from "./color";

class TailwindSwooosh {
  static extract = (folderPath: string, types: string[] = []) => {
    let output = "";
    if (types.length === 0 || types.includes("color")) {
      output += ColorManager.extract(folderPath);
    }
  
    // Write results to `tailwind-swooosh-extract.txt`
    fs.writeFileSync("./tailwind-swooosh-extract.txt", output);
    console.log(
      "✅ Analysis complete! Results saved in tailwind-swooosh-extract.txt"
    );
  }

  static replace = (
    folderPath: string,
    dryRun: boolean = false,
    types: string[] = []
  ) => {
    if (types.length === 0 || types.includes("color")) {
      ColorManager.replace(folderPath, dryRun);
    }
  }
}

export { TailwindSwooosh };
