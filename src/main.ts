import fs from "fs";
import { ColorManager } from "./color";

class TailwindSwooosh {
  static extract = (targets: string[] = [], folderPath: string = '.') => {
    let output = `Tailwind Swooosh extract results for target(s): ${targets.join(', ')} \n`;
       output += "__________________________________________________________________________________________________ \n\n";
    if (targets.length === 0 || targets.includes("color")) {
      output += ColorManager.extract(folderPath);
    }
  
    // Write results to `tailwind-swooosh-extract.txt`
    fs.writeFileSync("./tailwind-swooosh-extract.txt", output);
    console.log(
      "✅ Analysis complete! Results saved in tailwind-swooosh-extract.txt"
    );
  }

  static replace = (
    targets: string[] = [],
    folderPath: string = '.',
    dryRun: boolean = false    
  ) => {
    if (targets.length === 0 || targets.includes("color")) {
      ColorManager.replace(folderPath, dryRun);
    }
  }
}

export { TailwindSwooosh };
