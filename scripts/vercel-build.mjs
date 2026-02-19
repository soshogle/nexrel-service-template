#!/usr/bin/env node
import { execSync } from "child_process";

console.log("[vercel-build] CWD:", process.cwd(), "Node:", process.version);
const steps = [
  ["Step 1: Vite", "npx vite build"],
  ["Step 2: Esbuild", "npx esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outfile=api/index.js"],
  ["Step 3: Copy", "node scripts/copy-public.mjs"],
];

for (const [name, cmd] of steps) {
  console.log("\n>>> " + name + "\n");
  try {
    execSync(cmd, { stdio: "inherit", cwd: process.cwd() });
  } catch (err) {
    console.error("\n!!! FAILED: " + name + " (exit " + (err.status ?? 1) + ")");
    process.exit(1);
  }
}
console.log("\n>>> Build complete\n");
