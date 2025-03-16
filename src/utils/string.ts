export const toDashCase = (str: string): string => {
  return str
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .replace(/^-/, "");
};
