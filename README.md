# Tailwind Swooosh

A CLI tool to extract hex colors from Tailwind CSS projects and convert them to CSS variables.

## Installation

```bash
npm install -g tailwind-swooosh
# or 
pnpm add -g tailwind-swooosh
```

## Usage

```bash
tailwind-swooosh [options] [folder-path]
```

### Options

- `-e`, `--extract` [folder-path] - Extract colors from files and generate a report
- `-r`, `--replace` [folder-path] - Replace hex colors with CSS variables
- `-h`, `--help` - Show help information

If no folder path is provided, the current directory will be used.

### Examples

```bash
# Show help
tailwind-swooosh

# Extract colors from current directory
tailwind-swooosh -e

# Extract colors from specified directory
tailwind-swooosh -e ./my-project

# Replace colors with variables in specified directory
tailwind-swooosh -r ./my-project
```

## Extract Mode Output

When using the extract mode (`-e`), the tool will generate a file called `tailwind-swooosh-color-usage.txt` in the current directory with:

1. A list of all `hex` colors found in your project
2. The number of times each color is used
3. The files where each color is found
4. Suggested CSS variable names based on color names
5. CSS variables in both `hex` and `oklch` formats

### Example output


```plaintext
#171b26 → used 28 times (20.44%) → suggested: --color-coarse-wool
  Found in:
  - src/components/footer.tsx
  - src/components/ui/dialog.tsx
  - ...

#ffce67 → used 18 times (13.14%) → suggested: --color-chickadee
  Found in:
  - src/components/footer.tsx
  - src/components/ui/button.tsx
  - ...
...


Color variables (hex format):
--color-coarse-wool: #171b26;
--color-chickadee: #ffce67;
...


Color variables (oklch optimized format):
--color-coarse-wool: oklch(38.84, 13.40, -1.78); /* #171b26 */
--color-chickadee: oklch(92.56, 29.81, 1.87); /* #ffce67 */
...
```

## Replace Mode

When using the replace mode (`-r`), the tool will scan your project files and replace Tailwind hex color classes with CSS variable classes. This helps maintain consistency and makes it easier to update your color scheme.

## License

MIT