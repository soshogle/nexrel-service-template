#!/usr/bin/env node
/**
 * Converts the Theodora knowledge base markdown to Word (.docx) format.
 * Run: node scripts/convert-kb-to-docx.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { convertMarkdownToDocx } from "@mohtasham/md-to-docx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const inputPath = join(root, "docs", "theodora-knowledge-base.md");
const outputPath = join(root, "docs", "theodora-knowledge-base.docx");

const markdown = readFileSync(inputPath, "utf-8");
const blob = await convertMarkdownToDocx(markdown);
const buffer = Buffer.from(await blob.arrayBuffer());
writeFileSync(outputPath, buffer);
console.log("Created:", outputPath);
