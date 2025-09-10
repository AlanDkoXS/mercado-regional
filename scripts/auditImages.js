#!/usr/bin/env node
/*
 * Legacy image path audit.
 * Searches for '/images/' strings used directly and reports if they already exist in assets.
 */
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const root = process.cwd();
const SRC = join(root, "src");
const ASSETS = join(root, "src/assets/images");

const extsCode = [".astro", ".ts", ".tsx", ".js", ".md", ".mdx"];

const found = new Map();

const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else {
      if (!extsCode.some((e) => p.endsWith(e))) continue;
      const txt = readFileSync(p, "utf8");
      // Search for '/images/...' strings in code
      const regex = /(['"`])(\/images\/[^'"`\s)]+)\1/g;
      let m;
      while ((m = regex.exec(txt))) {
        const img = m[2];
        const list = found.get(img) || [];
        list.push(p.replace(root + "/", ""));
        found.set(img, list);
      }
    }
  }
};

walk(SRC);

const assetFiles = new Set();
const collectAssets = (dir) => {
  try {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      const st = statSync(p);
      if (st.isDirectory()) collectAssets(p);
      else assetFiles.add(p);
    }
  } catch {}
};
collectAssets(ASSETS);

const toAssetEnd = (img) => {
  // The searched image must match the end of a path in assets
  const filename = img.split("/").pop();
  for (const file of assetFiles) {
    if (file.endsWith(filename)) return true;
  }
  return false;
};

const report = [];
for (const [img, files] of found.entries()) {
  report.push({ img, count: files.length, inAssets: toAssetEnd(img), files });
}

report.sort((a, b) => a.img.localeCompare(b.img));

if (!report.length) {
  console.log("No legacy /images/ paths found in the code.");
  process.exit(0);
}

console.log("\n=== /images/ path audit ===");
for (const r of report) {
  console.log(`\nImage: ${r.img}`);
  console.log(`  Occurrences: ${r.count}`);
  console.log(`  Already in assets?: ${r.inAssets ? "YES" : "NO"}`);
  console.log("  Files:");
  r.files.forEach((f) => console.log("   -", f));
}

const pending = report.filter((r) => !r.inAssets);
if (pending.length) {
  console.log(
    `\nPending to move to src/assets/images (${pending.length}):`,
  );
  pending.forEach((p) => console.log(" -", p.img));
}
console.log("\nEnd of audit.");
