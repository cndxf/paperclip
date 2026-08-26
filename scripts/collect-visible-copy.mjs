#!/usr/bin/env node
/**
 * Builds an inventory of static, user-visible English copy from the React UI.
 * It deliberately ignores code-like values so the fallback localizer never
 * changes commands, URLs, identifiers, or runtime configuration fields.
 */
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourceRoot = path.join(root, "ui/src");
const output = path.join(root, ".localization/en-visible-copy-values.json");
const candidates = new Set();

function isSourceFile(file) {
  return file.endsWith(".tsx") || file.endsWith(".jsx");
}

function shouldSkip(file) {
  return /(?:\.test\.|\.spec\.|UxLab|DesignGuide|\.stories\.)/.test(file);
}

function isVisibleCopy(value) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length < 2 || normalized.length > 360) return false;
  if (!/[A-Za-z]{2}/.test(normalized)) return false;
  // A JSX text node cannot contain TypeScript declarations. This removes false
  // positives where a generic closing `>` was paired with a later JSX `<`.
  if (/[;{}=]|=>|\b(?:const|let|return|interface|type|function|class|Map|Set|Record|Promise|Array)\b/.test(normalized)) return false;
  if (/^(?:https?:\/\/|[./~]|[A-Za-z_][\w-]*(?:\.[\w-]+){1,}|--?[\w-]+=|\w+\s*=>)/.test(normalized)) return false;
  if (/\b(?:curl|npm|pnpm|npx|git|docker|node|bash|zsh)\b/i.test(normalized)) return false;
  if (/^[A-Z0-9_./:@ -]+$/.test(normalized) && !/\s/.test(normalized)) return false;
  return true;
}

function add(value) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (isVisibleCopy(normalized)) candidates.add(normalized);
}

async function visit(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return visit(file);
    if (!isSourceFile(file) || shouldSkip(file)) return;
    const source = await fs.readFile(file, "utf8");
    for (const match of source.matchAll(/>([A-Za-z][^<>{\n]{1,360})</g)) add(match[1]);
    for (const match of source.matchAll(/(?:placeholder|title|aria-label|alt|label)=(?:"([^"]+)"|'([^']+)')/g)) add(match[1] ?? match[2]);
  }));
}

await visit(sourceRoot);
const result = {
  generatedAt: new Date().toISOString(),
  description: "Static user-visible copy from React text nodes and text attributes.",
  count: candidates.size,
  candidates: [...candidates].sort((a, b) => a.localeCompare(b)),
};
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, `${JSON.stringify(result, null, 2)}\n`);
console.log(`Collected ${result.count} visible-copy candidates.`);
