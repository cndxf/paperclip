import fs from "node:fs";
import path from "node:path";

const root = path.resolve("ui/src");
const categories = {
  ui: new Map(),
  config: new Map(),
  code: new Map(),
  testData: new Map(),
};

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(tsx|jsx)$/.test(entry.name) && !/(\.test|\.spec)\./.test(entry.name)) scan(file);
  }
}

function add(bucket, value, file) {
  if (!bucket.has(value)) bucket.set(value, new Set());
  bucket.get(value).add(file);
}

function scan(file) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(/(['"])([^'"\n\\]{3,})\1/g)) {
    const value = match[2].trim();
    if (!/[A-Za-z]{2}/.test(value) || value.length > 500) continue;
    if (!/^[A-Za-z][A-Za-z0-9 ,.!?/:;()&'’—+\-<>\[\]{}$%…]+$/.test(value)) continue;
    const before = source.slice(Math.max(0, match.index - 180), match.index);
    const technical =
      /(?:className|class=|import\s|from\s|route|path:|key:|value:|name:|id:|type:|status:|role:|href:|to:|method:|event:|field:|placeholderClass)/.test(before) &&
      !/(?:label|title|description|message|body|hint|placeholder|aria-label|children|toast|error)/.test(before);
    const codeLike = /^(?:https?:|wss?:|ws:|\/|[A-Z_][A-Z0-9_:-]*$|[a-z]+\/[a-z]+$|(?:GET|POST|PUT|PATCH|DELETE)\s|[A-Za-z_][A-Za-z0-9_]*\(|[A-Za-z_][A-Za-z0-9_]*:\s)/.test(value);
    const testLike = /(?:fixture|example|mock|seed|demo|test|sample)/i.test(file) || /^(?:Acme|Ada |Dotta|Agent Alpha|CEO|Engineer)/.test(value);
    add(codeLike ? categories.code : testLike ? categories.testData : technical ? categories.config : categories.ui, value, path.relative(process.cwd(), file));
  }
}

walk(root);
const toObject = (map) => Object.fromEntries([...map].sort(([a], [b]) => a.localeCompare(b)).map(([value, files]) => [value, [...files].sort()]));
const result = Object.fromEntries(Object.entries(categories).map(([key, map]) => [key, toObject(map)]));
fs.mkdirSync(".localization", { recursive: true });
fs.writeFileSync(".localization/dynamic-copy-categories.json", JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(Object.fromEntries(Object.entries(result).map(([key, values]) => [key, Object.keys(values).length])), null, 2));
