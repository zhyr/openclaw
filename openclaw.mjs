#!/usr/bin/env node

import module from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// https://nodejs.org/api/module.html#module-compile-cache
if (module.enableCompileCache && !process.env.NODE_DISABLE_COMPILE_CACHE) {
  try {
    module.enableCompileCache();
  } catch {
    // Ignore errors
  }
}

const isModuleNotFoundError = (err) =>
  err && typeof err === "object" && "code" in err && err.code === "ERR_MODULE_NOT_FOUND";

const openclawDir = path.dirname(fileURLToPath(import.meta.url));

const installProcessWarningFilter = async () => {
  // Keep bootstrap warnings consistent with the TypeScript runtime.
  for (const specifier of ["./dist/warning-filter.js", "./dist/warning-filter.mjs"]) {
    try {
      const mod = await import(specifier);
      if (typeof mod.installProcessWarningFilter === "function") {
        mod.installProcessWarningFilter();
        return;
      }
    } catch (err) {
      if (isModuleNotFoundError(err)) {
        continue;
      }
      throw err;
    }
  }
};

await installProcessWarningFilter();

const tryImport = async (specifier) => {
  try {
    await import(specifier);
    return true;
  } catch (err) {
    // Only swallow missing-module errors; rethrow real runtime errors.
    if (isModuleNotFoundError(err)) {
      return false;
    }
    throw err;
  }
};

// Resolve entry relative to this script so it works regardless of cwd
const entryJs = pathToFileURL(path.join(openclawDir, "dist", "entry.js")).href;
const entryMjs = pathToFileURL(path.join(openclawDir, "dist", "entry.mjs")).href;

if (await tryImport(entryJs)) {
  // OK
} else if (await tryImport(entryMjs)) {
  // OK
} else {
  const tried = path.join(openclawDir, "dist", "entry.js");
  throw new Error(
    `openclaw: missing dist/entry.(m)js (build output). Tried: ${tried}\n` +
      "Run from repo root: pnpm exec tsdown --no-clean",
  );
}
