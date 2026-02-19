#!/usr/bin/env node
/**
 * Runs drizzle-kit migrate if DATABASE_URL is set.
 * Skips silently on preview deploys or local builds without DB.
 */
import { execSync } from "child_process";

if (process.env.DATABASE_URL) {
  execSync("npx drizzle-kit migrate", { stdio: "inherit" });
} else {
  console.log("Skipping db:migrate (DATABASE_URL not set)");
}
