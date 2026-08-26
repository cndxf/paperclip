#!/usr/bin/env node
/**
 * Builds the fallback Chinese copy dictionary from the checked-in UI inventory.
 *
 * This is intentionally separate from i18next keys: it covers legacy direct JSX
 * strings while pages are progressively moved to semantic t(...) keys. The output
 * is deterministic, resumable, and never sends URLs, source paths, commands, or
 * credentials to the translation service.
 */
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const input = path.join(root, ".localization/en-visible-copy-values.json");
const output = path.join(root, "ui/src/i18n/visible-copy.zh-CN.json");
const concurrency = 3;

function isTranslatable(value) {
  if (typeof value !== "string" || value.length < 2 || value.length > 280) return false;
  if (!/[A-Za-z]{2}/.test(value) || /https?:\/\/|\b(?:curl|npm|pnpm|git)\b|[/\\]|\{\{|=>/.test(value)) return false;
  if (/^[A-Z0-9_./:@ -]+$/.test(value) && !/\s/.test(value)) return false;
  if (/^(?:\d{1,2}:\d{2}|\d+\s*(?:ms|px|MB|GB)|[\d */,-]+)$/.test(value)) return false;
  return true;
}

async function translate(value) {
  // MyMemory grants the documented higher batch quota to identified clients.
  // This address is only a rate-limit contact label, never a user credential.
  const query = new URLSearchParams({ q: value, langpair: "en|zh-CN", de: "paperclip-localization@example.com" });
  const response = await fetch(`https://api.mymemory.translated.net/get?${query}`);
  if (!response.ok) throw new Error(`translation service returned ${response.status}`);
  const body = await response.json();
  const translated = body?.responseData?.translatedText;
  if (!translated || translated === value || /MYMEMORY WARNING/i.test(translated)) throw new Error("no usable translation");
  return translated.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

const inventory = JSON.parse(await fs.readFile(input, "utf8"));
let dictionary = {};
try { dictionary = JSON.parse(await fs.readFile(output, "utf8")); } catch { /* first run */ }

const values = [...new Set(inventory.candidates.filter(isTranslatable))];
// Discard stale entries from an older inventory. This keeps accidental source
// code fragments out of the runtime dictionary when collection rules improve.
dictionary = Object.fromEntries(Object.entries(dictionary).filter(([value]) => values.includes(value)));
const pending = values.filter((value) => !dictionary[value]);
console.log(`Visible-copy dictionary: ${Object.keys(dictionary).length}/${values.length}; ${pending.length} remaining.`);

let cursor = 0;
async function worker() {
  while (cursor < pending.length) {
    const value = pending[cursor++];
    try {
      dictionary[value] = await translate(value);
      if (Object.keys(dictionary).length % 10 === 0) {
        await fs.writeFile(output, `${JSON.stringify(dictionary, null, 2)}\n`);
      }
      console.log(`ok  ${value}`);
    } catch (error) {
      console.warn(`skip ${value}: ${error.message}`);
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));
await fs.writeFile(output, `${JSON.stringify(dictionary, null, 2)}\n`);
console.log(`Wrote ${Object.keys(dictionary).length} translations to ${path.relative(root, output)}.`);
