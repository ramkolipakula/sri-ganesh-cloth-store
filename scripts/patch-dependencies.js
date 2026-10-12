// Patch dependencies for Windows paths that contain apostrophes/single quotes (e.g. "amma's-arilova")
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// 1. Patch @tanstack/router-plugin code-splitter compilers.js
const routerPluginCompilerPath = path.join(
  root,
  "node_modules",
  "@tanstack",
  "router-plugin",
  "dist",
  "esm",
  "core",
  "code-splitter",
  "compilers.js",
);

if (fs.existsSync(routerPluginCompilerPath)) {
  let content = fs.readFileSync(routerPluginCompilerPath, "utf8");
  const target = "`const ${splitNodeMeta.localImporterIdent} = () => import('${splitUrl}')`";
  const replacement =
    "`const ${splitNodeMeta.localImporterIdent} = () => import(${JSON.stringify(splitUrl)})`";
  if (content.includes(target)) {
    content = content.replaceAll(target, replacement);
    fs.writeFileSync(routerPluginCompilerPath, content, "utf8");
    console.log("Successfully patched @tanstack/router-plugin code-splitter");
  }
}

// 2. Patch nitro virtual polyfills module
const nitroCommonPath = path.join(root, "node_modules", "nitro", "dist", "_build", "common.mjs");

if (fs.existsSync(nitroCommonPath)) {
  let content = fs.readFileSync(nitroCommonPath, "utf8");
  const target = "polyfills.map((p) => `import '${p}';`)";
  const replacement = "polyfills.map((p) => `import ${JSON.stringify(p)};`)";
  if (content.includes(target)) {
    content = content.replaceAll(target, replacement);
    fs.writeFileSync(nitroCommonPath, content, "utf8");
    console.log("Successfully patched nitro virtual polyfills template");
  }
}
