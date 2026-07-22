# atomic-agy

[Atomic VCS](https://atomic.dev) integration for [Antigravity CLI (`agy`)](https://antigravity.google/) (Google).

Automatic turn recording with AI provenance, intent tracking, and knowledge graph skills.

## What it does

- **1 session = 1 view** — a draft view is created automatically when you start an agy conversation
- **Every turn records with provenance** — vendor, session, turn number, timing, decision graph
- **Tool completions tracked** — each tool call captured into the provenance accumulator
- **Session attestation** — created when the agent goes idle, covering everything the session recorded
- **Intent workflow** — AGENTS.md prompt guides problem-first development with vault intents
- **KG-first code discovery** — the agent learns `atomic vault query search`/`neighbors` before grep-and-read

## Install

### Quick start

```bash
git clone https://github.com/atomicdotdev/atomic-agy
cd atomic-agy
./install.sh
```

### From npm (once published)

```bash
npx atomic-agy
```

### What install does

1. **Plugin** — installs `plugin/` (hooks + 3 skills) via agy's native
   `agy plugin install`, staging it into `~/.gemini/config/plugins/atomic/`
   and registering it so `agy plugin list` / `agy plugin disable atomic` work.
   Re-run `./install.sh` after `git pull` to refresh the staged copy.
2. **Hooks (fallback)** — if agy is not on PATH but `atomic` is, the hook
   wiring is merged from `hooks/agy.atomic-hooks.json` via
   `atomic agent enable --hooks`. The manifest in this repo is the source of
   truth — updating the wiring never requires rebuilding `atomic`.
3. **AGENTS.md** — symlinked to agy's global context slot
   (`~/.gemini/GEMINI.md`) for live updates on pull, without clobbering an
   existing file. Copy it per-project for repo-local context (see Usage).

## Prerequisites

- [Atomic VCS](https://atomic.dev) installed and on your PATH (`atomic --version`)
- [Antigravity CLI (`agy`)](https://antigravity.google/docs/cli/getting-started) installed and signed in
- A project with an `.atomic/` repository (`atomic init`)

## Usage

```bash
cd my-project
atomic init                                     # if not already an atomic repo
cp /path/to/atomic-agy/AGENTS.md .              # add agent instructions
agy                                             # start agy — hooks activate automatically
```

The hooks automatically:

1. Track the conversation when the model is invoked (`PreInvocation`)
2. Capture each completed tool call (`PostToolUse`)
3. Record the turn's changes with full AI attestation when the agent goes idle (`Stop`)

You never need to run `atomic add` or `atomic record` — the hooks handle it.

## Notes on agy 1.1.4

- Hooks only fire when delivered through the plugin mechanism (this repo's
  `plugin/`). A project-level `.agents/hooks.json` is loaded by agy but its
  handlers never execute — that is why installation goes through
  `agy plugin install`.
- agy runs plugin hooks with the plugin directory as the working directory.
  The installed hook commands therefore carry no `test -d .atomic` guard —
  `atomic agent hooks agy` resolves the repository from the `workspacePaths`
  field in each hook payload and exits quietly in non-Atomic workspaces.
- Hook payloads do not include the user prompt, model name, or token usage.
  Change messages fall back to file summaries and attestations show zeros
  until enriched; the transcript path is stored on every session for future
  enrichment.

## Uninstall

```bash
./install.sh --uninstall
# or
node install.js --uninstall
```

Removes the staged plugin and the global AGENTS.md symlink (only if it points
at this repo). Project-level `AGENTS.md` copies are left untouched.

## License

Apache-2.0
