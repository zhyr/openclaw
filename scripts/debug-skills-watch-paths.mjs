#!/usr/bin/env node
/**
 * 独立脚本：模拟 skills refresh 的 watch 路径解析与 OrbStack 过滤逻辑，
 * 用于在本地验证各 watch target 的 realpath 与是否被过滤。
 * 用法: node scripts/debug-skills-watch-paths.mjs
 * 可选: WORKSPACE_DIR=/path node scripts/debug-skills-watch-paths.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const HOME = os.homedir();
const CONFIG_DIR = path.join(HOME, ".openclaw");
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || path.join(HOME, ".openclaw", "workspace-dev");
const ORBSTACK_SEGMENT = "OrbStack";

function resolveWatchPaths(workspaceDir, extraDirs = []) {
  const paths = [];
  if (workspaceDir.trim()) {
    paths.push(path.join(workspaceDir, "skills"));
    paths.push(path.join(workspaceDir, ".agents", "skills"));
  }
  paths.push(path.join(CONFIG_DIR, "skills"));
  paths.push(path.join(HOME, ".agents", "skills"));
  for (const d of extraDirs) {
    const expanded = d.startsWith("~") ? path.join(HOME, d.slice(1)) : d;
    paths.push(path.resolve(expanded));
  }
  return paths;
}

function toWatchGlobRoot(raw) {
  return raw.replaceAll("\\", "/").replace(/\/+$/, "");
}

function resolveWatchTargets(workspaceDir, extraDirs = []) {
  const targets = new Set();
  for (const root of resolveWatchPaths(workspaceDir, extraDirs)) {
    const globRoot = toWatchGlobRoot(root);
    targets.add(`${globRoot}/SKILL.md`);
    targets.add(`${globRoot}/*/SKILL.md`);
  }
  return Array.from(targets).toSorted((a, b) => a.localeCompare(b));
}

function watchTargetGlobRoot(target) {
  return target.replace(/\/\*\/SKILL\.md$/, "").replace(/\/SKILL\.md$/, "");
}

function filterTargetsAwayFromOrbStack(targets) {
  const filtered = [];
  for (const t of targets) {
    const root = watchTargetGlobRoot(t);
    const exists = fs.existsSync(root);
    if (!exists) {
      console.log(JSON.stringify({ target: t, root, skip: "root does not exist", kept: false }));
      continue;
    }
    let resolved = null;
    let err = null;
    try {
      resolved = fs.realpathSync.native(root);
    } catch (e) {
      err = e;
    }
    const wouldFilter = resolved != null && resolved.includes(ORBSTACK_SEGMENT);
    const kept = !wouldFilter;
    if (kept) {
      filtered.push(t);
    }
    console.log(
      JSON.stringify({
        target: t,
        root,
        exists: true,
        resolved: resolved ?? (err ? String(err.message) : "N/A"),
        wouldFilter,
        kept,
      }),
    );
  }
  return filtered;
}

console.log("WORKSPACE_DIR:", WORKSPACE_DIR);
console.log("CONFIG_DIR:", CONFIG_DIR);
console.log("HOME:", HOME);
console.log("");

const watchTargets = resolveWatchTargets(WORKSPACE_DIR);
console.log("resolveWatchTargets count:", watchTargets.length);
console.log("");

console.log("Per-target filter simulation:");
const filtered = filterTargetsAwayFromOrbStack(watchTargets);
console.log("");
console.log("targetsToWatch count after filter:", filtered.length);
console.log("targetsToWatch:", filtered);
