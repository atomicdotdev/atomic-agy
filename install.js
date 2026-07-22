#!/usr/bin/env node

/**
 * atomic-agy install
 *
 * 1. Installs the agy plugin (hooks + skills) via agy's native plugin
 *    mechanism (`agy plugin install`), staging the bundle into
 *    ~/.gemini/config/plugins/atomic/ and registering it in agy's import
 *    manifest.
 * 2. Falls back to `atomic agent enable --hooks hooks/agy.atomic-hooks.json`
 *    (merge engine ships with the atomic binary) when agy is not on PATH —
 *    the manifest in this repo is the source of truth for the hook wiring,
 *    so schema changes never require an `atomic` rebuild.
 * 3. Symlinks AGENTS.md into agy's global context slot (~/.gemini/GEMINI.md)
 *    — never clobbering an existing non-symlink file.
 *
 * Usage:
 *   npx atomic-agy            # install from npm
 *   node install.js           # install from local checkout
 *   node install.js --silent  # postinstall
 *   node install.js --uninstall
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const silent = process.argv.includes("--silent");
const uninstall = process.argv.includes("--uninstall");

const PKG_DIR = __dirname;
const PLUGIN_SRC = path.join(PKG_DIR, "plugin");
const PLUGIN_STAGED = path.join(os.homedir(), ".gemini", "config", "plugins", "atomic");
const MANIFEST = path.join(PKG_DIR, "hooks", "agy.atomic-hooks.json");
const GLOBAL_GEMINI_MD = path.join(os.homedir(), ".gemini", "GEMINI.md");
const AGENTS_SRC = path.join(PKG_DIR, "AGENTS.md");

function log(msg) {
  if (!silent) console.log(msg);
}

function tryExec(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: silent ? "pipe" : "inherit" });
  } catch {
    return null;
  }
}

function hasCmd(name) {
  return tryExec(`${name} --version`) !== null;
}

function isOurSymlink(p) {
  try {
    return fs.lstatSync(p).isSymbolicLink() && fs.readlinkSync(p) === AGENTS_SRC;
  } catch {
    return false;
  }
}

function install() {
  log("Installing atomic-agy...");

  if (hasCmd("agy")) {
    tryExec(`agy plugin install "${PLUGIN_SRC}"`);
    log("  plugin: installed via 'agy plugin install'");
  } else {
    log("Warning: 'agy' not found on PATH.");
    log("  Install the Antigravity CLI first:");
    log("    curl -fsSL https://antigravity.google/cli/install.sh | bash");
  }

  if (hasCmd("atomic")) {
    if (!fs.existsSync(path.join(PLUGIN_STAGED, "hooks.json"))) {
      log("Installing hooks via atomic manifest merge...");
      tryExec(`atomic agent enable --hooks "${MANIFEST}"`);
    }
  } else {
    log("Warning: 'atomic' not found on PATH — hooks will no-op until it is installed.");
  }

  if (isOurSymlink(GLOBAL_GEMINI_MD)) {
    log("  agents: ~/.gemini/GEMINI.md already linked");
  } else if (fs.existsSync(GLOBAL_GEMINI_MD)) {
    log("  agents: ~/.gemini/GEMINI.md exists and is not ours — leaving it alone.");
  } else {
    fs.mkdirSync(path.dirname(GLOBAL_GEMINI_MD), { recursive: true });
    fs.symlinkSync(AGENTS_SRC, GLOBAL_GEMINI_MD);
    log("  agents: AGENTS.md → ~/.gemini/GEMINI.md (live updates on pull)");
  }

  log("");
  log("Done. Per-project setup:");
  log("  cd my-project");
  log("  atomic init                       # if not already an atomic repo");
  log(`  cp ${AGENTS_SRC} .                # add agent instructions`);
  log("  agy                               # hooks activate automatically");
}

function remove() {
  log("Uninstalling atomic-agy...");

  if (hasCmd("agy")) {
    tryExec("agy plugin uninstall atomic");
    log("  plugin: removed via 'agy plugin uninstall atomic'");
  } else if (fs.existsSync(PLUGIN_STAGED)) {
    fs.rmSync(PLUGIN_STAGED, { recursive: true, force: true });
    log("  plugin: removed ~/.gemini/config/plugins/atomic");
  }

  if (isOurSymlink(GLOBAL_GEMINI_MD)) {
    fs.rmSync(GLOBAL_GEMINI_MD);
    log("  agents: removed ~/.gemini/GEMINI.md symlink");
  }

  log("Done. Project-level AGENTS.md copies (if any) are left untouched.");
}

if (uninstall) {
  remove();
} else {
  install();
}
