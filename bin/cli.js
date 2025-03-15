#!/usr/bin/env node

const {
  scanFolderAndExtractColors,
  scanFolderAndReplaceColorsByVariables,
} = require("../dist/main");

const args = process.argv.slice(2);
let command = null;
let folderPath = ".";

/**
 * Show help message
 */
const showHelp = () => {
  console.log(`
Tailwind Swooosh - Extract and manage Tailwind CSS hex colors

Usage:
  tailwind-swooosh [options] [path]

Options:
  -e, --extract [path]   Extract colors from files (default) and generate a report
  -r, --replace [path]   Replace hex colors with CSS variables
  -h, --help             Show this help message

Examples:
  tailwind-swooosh                    Extract colors from current directory
  tailwind-swooosh ./my-project       Extract colors from specified directory
  tailwind-swooosh -r ./my-project    Replace colors in specified directory
  `);
  process.exit(0);
};

// Process arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === "-h" || arg === "--help") {
    showHelp();
  } else if (arg === "-e" || arg === "--extract") {
    command = "extract";
    // Check if next argument is a path
    if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
      folderPath = args[i + 1];
      i++; // Skip the next argument since we've used it
    }
  } else if (arg === "-r" || arg === "--replace") {
    command = "replace";
    // Check if next argument is a path
    if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
      folderPath = args[i + 1];
      i++; // Skip the next argument since we've used it
    }
  } else if (!arg.startsWith("-")) {
    // If it's not a flag, assume it's a folder path
    folderPath = arg;
  }
}

// Run the appropriate command or show help if no command specified
if (command === "extract") {
  console.log(`Extracting colors from ${folderPath}...`);
  scanFolderAndExtractColors(folderPath);
} else if (command === "replace") {
  console.log(`Replacing colors with variables in ${folderPath}...`);
  scanFolderAndReplaceColorsByVariables(folderPath);
} else {
  // No command specified, show help
  showHelp();
}
