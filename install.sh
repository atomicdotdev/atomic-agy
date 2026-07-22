#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GLOBAL_GEMINI_MD="$HOME/.gemini/GEMINI.md"

uninstall=false
[ "${1:-}" = "--uninstall" ] && uninstall=true

if [ "$uninstall" = true ]; then
  echo "Uninstalling atomic-agy..."

  if command -v agy &>/dev/null; then
    agy plugin uninstall atomic || true
    echo "  plugin: removed via 'agy plugin uninstall atomic'"
  else
    # agy not on PATH — remove the staged plugin manually.
    rm -rf "$HOME/.gemini/config/plugins/atomic"
    echo "  plugin: removed ~/.gemini/config/plugins/atomic"
  fi

  # Remove the global AGENTS.md symlink only if it points at this repo.
  if [ -L "$GLOBAL_GEMINI_MD" ] && [ "$(readlink "$GLOBAL_GEMINI_MD")" = "$SCRIPT_DIR/AGENTS.md" ]; then
    rm -f "$GLOBAL_GEMINI_MD"
    echo "  agents: removed ~/.gemini/GEMINI.md symlink"
  fi

  echo "Done. Project-level AGENTS.md copies (if any) are left untouched."
  exit 0
fi

echo "Installing atomic-agy..."

# 1. Install the agy plugin (hooks + skills) via agy's native plugin
#    mechanism. This stages the bundle into
#    ~/.gemini/config/plugins/atomic/ and registers it in agy's import
#    manifest, so `agy plugin list` / `agy plugin disable` work.
#    Re-run this script after `git pull` to refresh the staged copy.
if command -v agy &>/dev/null; then
  agy plugin install "$SCRIPT_DIR/plugin"
  echo "  plugin: installed via 'agy plugin install'"
else
  echo "Warning: 'agy' not found on PATH."
  echo "  Install the Antigravity CLI first:"
  echo "    curl -fsSL https://antigravity.google/cli/install.sh | bash"
  echo "  Then re-run this script (or run: agy plugin install \"$SCRIPT_DIR/plugin\")"
fi

# 2. Offer the merge-based alternative through the atomic binary, for users
#    who prefer `atomic agent enable`. The manifest in this repo is the
#    source of truth for the hook wiring either way — no `atomic` rebuild
#    needed when the wiring changes.
if command -v atomic &>/dev/null; then
  if [ ! -f "$HOME/.gemini/config/plugins/atomic/hooks.json" ]; then
    echo "Installing hooks via atomic manifest merge..."
    atomic agent enable --hooks "$SCRIPT_DIR/hooks/agy.atomic-hooks.json" || true
  fi
else
  echo "Warning: 'atomic' not found on PATH."
  echo "  Install Atomic VCS first: https://atomic.dev"
  echo "  The plugin hooks call 'atomic agent hooks agy ...' — they no-op"
  echo "  until atomic is installed."
fi

# 3. Symlink AGENTS.md into agy's global context slot (~/.gemini/GEMINI.md)
#    so the standard instructions apply in every agy session. The file is
#    shared with gemini-cli's global context, so we never clobber an
#    existing non-symlink file.
if [ -L "$GLOBAL_GEMINI_MD" ] && [ "$(readlink "$GLOBAL_GEMINI_MD")" = "$SCRIPT_DIR/AGENTS.md" ]; then
  echo "  agents: ~/.gemini/GEMINI.md already linked"
elif [ -e "$GLOBAL_GEMINI_MD" ]; then
  echo "  agents: ~/.gemini/GEMINI.md exists and is not ours — leaving it alone."
  echo "          Merge $SCRIPT_DIR/AGENTS.md into it manually if you want the"
  echo "          Atomic instructions globally."
else
  mkdir -p "$HOME/.gemini"
  ln -s "$SCRIPT_DIR/AGENTS.md" "$GLOBAL_GEMINI_MD"
  echo "  agents: AGENTS.md → ~/.gemini/GEMINI.md (live updates on pull)"
fi

echo ""
echo "Done. Per-project setup:"
echo "  cd my-project"
echo "  atomic init                       # if not already an atomic repo"
echo "  cp $SCRIPT_DIR/AGENTS.md .       # add agent instructions"
echo "  agy                               # hooks activate automatically"
