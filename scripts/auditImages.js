#!/usr/bin/env node
/*
 * Auditoría de rutas de imágenes legacy.
 * Busca strings '/images/' usadas directamente y reporta si ya existen en assets.
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
  // imagen buscada debe coincidir al final de una ruta en assets
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
  console.log("No se encontraron rutas legacy /images/ en el código.");
  process.exit(0);
}

console.log("\n=== Auditoría de rutas /images/ ===");
for (const r of report) {
  console.log(`\nImagen: ${r.img}`);
  console.log(`  Ocurrencias: ${r.count}`);
  console.log(`  Ya en assets?: ${r.inAssets ? "SI" : "NO"}`);
  console.log("  Archivos:");
  r.files.forEach((f) => console.log("   -", f));
}

const pendientes = report.filter((r) => !r.inAssets);
if (pendientes.length) {
  console.log(
    `\nPendientes de mover a src/assets/images (${pendientes.length}):`,
  );
  pendientes.forEach((p) => console.log(" -", p.img));
}
console.log("\nFin auditoría.");
