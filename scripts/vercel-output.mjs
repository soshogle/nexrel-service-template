#!/usr/bin/env node
/**
 * Build Output API v3 - creates .vercel/output for correct deployment
 * Static files -> .vercel/output/static (served by CDN first)
 * Single handler -> .vercel/output/functions/index.func (handles all non-static)
 * No symlinks: one function receives all /api/* and SPA routes with original path
 */
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, ".vercel", "output");

function copyRecursive(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const name of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, name);
    const destPath = path.join(destDir, name);
    if (fs.statSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 1. Static files from public -> .vercel/output/static (CDN serves these first)
const staticDir = path.join(outputDir, "static");
const publicDir = path.join(root, "public");
if (!fs.existsSync(publicDir)) {
  console.error("ERROR: public not found. Run build first.");
  process.exit(1);
}
copyRecursive(publicDir, staticDir);
// Move main script to end of body, remove crossorigin (can cause issues)
const indexPath = path.join(staticDir, "index.html");
let html = fs.readFileSync(indexPath, "utf-8");
const scriptMatch = html.match(/<script type="module" crossorigin src="(\/assets\/[^"]+\.js)"><\/script>/);
if (scriptMatch) {
  html = html.replace(scriptMatch[0], "");
  html = html.replace("</body>", `<script type="module" src="${scriptMatch[1]}"></script>\n</body>`);
  fs.writeFileSync(indexPath, html);
}
// Add minimal test pages for debugging (bypass gitignore)
fs.writeFileSync(path.join(staticDir, "test.html"), '<!DOCTYPE html><html><body><div id="out">OK</div><script>document.getElementById("out").textContent="Static OK";</script></body></html>');
fs.writeFileSync(path.join(staticDir, "test-module.html"), '<!DOCTYPE html><html><body><div id="out">OK</div><script type="module">document.getElementById("out").textContent="Module OK";</script></body></html>');
console.log("Copied public -> .vercel/output/static");

// 2. Single root handler -> .vercel/output/functions/index.func (handles / and all non-static)
const functionsDir = path.join(outputDir, "functions");
// Remove old api/ from previous symlink-based setup
const oldApiDir = path.join(functionsDir, "api");
if (fs.existsSync(oldApiDir)) {
  fs.rmSync(oldApiDir, { recursive: true });
}
const funcDir = path.join(functionsDir, "index.func");
fs.mkdirSync(funcDir, { recursive: true });
const apiSrc = path.join(root, "api", "index.js");
if (!fs.existsSync(apiSrc)) {
  console.error("ERROR: api/index.js not found. Run build first.");
  process.exit(1);
}
fs.copyFileSync(apiSrc, path.join(funcDir, "index.js"));
copyRecursive(publicDir, path.join(funcDir, "public"));
// Dependencies: esbuild uses --packages=external. Use server-only deps to stay under 250MB.
const tempDir = path.join(os.tmpdir(), "nexrel-vercel-" + Date.now());
const nodeModulesDest = path.join(funcDir, "node_modules");
if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });
const pkgPath = path.join(root, "package.vercel.json");
if (!fs.existsSync(pkgPath)) {
  console.error("ERROR: package.vercel.json not found.");
  process.exit(1);
}
fs.copyFileSync(pkgPath, path.join(tempDir, "package.json"));
const { execSync } = await import("child_process");
execSync("npm install --legacy-peer-deps", {
  cwd: tempDir,
  stdio: "pipe",
  env: { ...process.env, NODE_ENV: "production" },
});
copyRecursive(path.join(tempDir, "node_modules"), nodeModulesDest);
fs.rmSync(tempDir, { recursive: true });
console.log("Copied server-only node_modules to function");

fs.writeFileSync(
  path.join(funcDir, "package.json"),
  JSON.stringify({ type: "module" }, null, 2)
);
fs.writeFileSync(
  path.join(funcDir, ".vc-config.json"),
  JSON.stringify({
    runtime: "nodejs20.x",
    handler: "index.js",
    launcherType: "Nodejs",
    maxDuration: 120,
  }, null, 2)
);
console.log("Created single handler at .vercel/output/functions/index.func");

// 3. config.json - static first, API to function, SPA fallback on filesystem miss
// API routes MUST be rewritten before filesystem
// Explicit SPA routes ensure /market-appraisal, /properties, etc. never 404
const config = {
  version: 3,
  routes: [
    { src: "^/$", dest: "/index.html" },
    { src: "^/api/(.*)$", dest: "/index?__path=api/$1" },
    { handle: "filesystem" },
    { handle: "miss" },
    // SPA fallback: route MUST have check: true after handle: miss (Vercel requirement)
    { src: "^(?!\\/api\\/)(?!\\/assets\\/)(?!\\/favicon)(?!\\/index\\.html$)(.*)", dest: "/index?__path=$1", check: true },
  ],
};
fs.writeFileSync(
  path.join(outputDir, "config.json"),
  JSON.stringify(config, null, 2)
);
console.log("Created .vercel/output/config.json");

console.log("Build Output API v3 complete");
