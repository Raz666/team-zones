import fs from "node:fs";
import path from "node:path";

type LoadEnvOptions = {
  path?: string;
};

export function loadEnvFile(options: LoadEnvOptions = {}): void {
  const candidates = options.path
    ? [options.path]
    : [
        path.resolve(process.cwd(), ".env"),
        path.resolve(__dirname, "..", "..", ".env"),
      ];

  const envPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!envPath) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    let trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    if (trimmed.startsWith("export ")) {
      trimmed = trimmed.slice("export ".length).trim();
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    const hasDoubleQuotes =
      value.startsWith("\"") && value.endsWith("\"") && value.length >= 2;
    const hasSingleQuotes =
      value.startsWith("'") && value.endsWith("'") && value.length >= 2;
    if (hasDoubleQuotes || hasSingleQuotes) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}
