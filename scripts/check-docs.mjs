import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";

const root = process.cwd();
const sourceRoot = join(root, "src");
const docsRoot = join(root, "src", "docs");
const markdownFiles = [];

function walk(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      walk(path);
    } else if (extname(path) === ".md") {
      markdownFiles.push(path);
    }
  }
}

walk(sourceRoot);

const broken = [];
const potentialSecrets = [];
const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
const secretPatterns = [
  {
    label: "private key material",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  },
  {
    label: "JWT-like token",
    pattern:
      /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/,
  },
  {
    label: "provider secret-like token",
    pattern: /\b(?:sk|re)_[A-Za-z0-9_-]{20,}\b/,
  },
  {
    label: "GitHub token-like value",
    pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  },
  {
    label: "AWS access key-like value",
    pattern: /\bAKIA[A-Z0-9]{16}\b/,
  },
  {
    label: "Google API key-like value",
    pattern: /\bAIza[A-Za-z0-9_-]{35}\b/,
  },
  {
    label: "Slack token-like value",
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  },
  {
    label: "database URL with embedded credentials",
    pattern: /\bpostgres(?:ql)?:\/\/[^:\s/]+:[^@\s/]+@/,
  },
  {
    label: "populated server-secret assignment",
    pattern:
      /\b(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_DB_URL|RESEND_API_KEY)\s*=\s*(?!<|your_|YOUR_|example\b)[^\s`]+/i,
  },
];

for (const file of markdownFiles) {
  const content = readFileSync(file, "utf8");
  const fileLabel = relative(root, file);

  for (const [index, line] of content.split("\n").entries()) {
    for (const { label, pattern } of secretPatterns) {
      if (pattern.test(line)) {
        potentialSecrets.push(`${fileLabel}:${index + 1} (${label})`);
      }
    }
  }

  for (const match of content.matchAll(linkPattern)) {
    const rawTarget = match[1].trim().replace(/^<|>$/g, "");
    const target = rawTarget.split("#")[0].split("?")[0];
    if (
      !target ||
      /^(https?:|mailto:|tel:)/.test(target) ||
      !target.endsWith(".md")
    ) {
      continue;
    }

    const resolved = target.startsWith("/docs/")
      ? resolve(docsRoot, target.slice("/docs/".length))
      : target.startsWith("/")
        ? resolve(sourceRoot, target.slice(1))
        : resolve(dirname(file), target);

    if (!existsSync(resolved)) {
      broken.push(
        `${fileLabel} -> ${rawTarget} (missing ${relative(root, resolved)})`,
      );
    }
  }
}

if (broken.length > 0 || potentialSecrets.length > 0) {
  if (broken.length > 0) {
    console.error("Broken documentation links:");
    for (const item of broken) console.error(`- ${item}`);
  }
  if (potentialSecrets.length > 0) {
    console.error("Potential secrets in public Markdown:");
    for (const item of potentialSecrets) console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log(
  `Public Markdown checks passed across ${markdownFiles.length} files.`,
);
