#!/usr/bin/env node

const {
  TailwindSwooosh,
} = require("../dist/main");

const args = process.argv.slice(2);
let command = null;
let folderPath = ".";
let dryRun = false;
let targets = ['color'];

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
  -d, --dry-run          Show what would be changed without making actual changes (with --replace)
  -h, --help             Show this help message
  -t, --target           Target(s) to extract or replace, separated with comma (by default: color)

Examples:
  tailwind-swooosh                    Extract colors from current directory
  tailwind-swooosh ./my-project       Extract colors from specified directory
  tailwind-swooosh -r ./my-project    Replace colors in specified directory
  tailwind-swooosh -r -d ./my-project Preview color replacements without making changes
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
  } else if (arg === "-d" || arg === "--dry-run") {
    dryRun = true;
  } else if (arg === "-t=" || arg === "--target=") {
    targets = args.replace(/^--target=/, "").replace(/^-t=/, "").split(",");
  } else if (!arg.startsWith("-")) {
    // If it's not a flag, assume it's a folder path
    folderPath = arg;
  }
}

// Run the appropriate command or show help if no command specified
if (command === "extract") {
  console.log(`Swooosh extracting "${targets.join(', ')}" from ${folderPath}...`);
  TailwindSwooosh.extract(targets, folderPath);
} else if (command === "replace") {
  console.log(`Swooosh replacing "${targets.join(', ')}" with variables in ${folderPath}${dryRun ? ' (dry run)' : ''}...`);
  TailwindSwooosh.replace(targets, folderPath, dryRun);
} else {
  // No command specified, show help
  showHelp();
}
