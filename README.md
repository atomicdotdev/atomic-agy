# atomic-agy

[Atomic VCS](https://atomic.dev) integration for [Antigravity CLI (`agy`)](https://antigravity.google/) (Google).

Automatic turn recording with AI provenance, intent tracking, and knowledge graph skills.

> **Definitive source:** this repository lives on Atomic storage at `https://atomic.atomic.storage/workspaces/oss/projects/atomic-agy/code`. The GitHub repo is a mirror.

## Install

You need [Atomic VCS](https://atomic.dev) on your PATH and the [Antigravity CLI](https://antigravity.google/docs/cli/getting-started) installed and signed in. Then, in any project:

```bash
cd my-project
atomic init                      # if not already an atomic repo
atomic agent enable --agent agy
agy                              # hooks activate automatically
```

That's it. The enable command installs the Atomic plugin (hooks plus the
`atomic-vault`, `atomic-vcs`, and `code-intelligence` skills) into
`~/.gemini/config/plugins/atomic/` via agy's plugin mechanism, and writes a
managed instruction section into the project's `AGENTS.md` — no file copying
needed. `atomic agent disable --agent agy` removes everything cleanly.

No clone of this repository is required.

## What it does

- **1 session = 1 view** — a draft view is created automatically when you start an agy conversation
- **Every turn records with provenance** — vendor, session, turn number, timing, decision graph
- **Tool completions tracked** — each tool call captured into the provenance accumulator
- **Session attestation** — created when the agent goes idle, covering everything the session recorded
- **Intent workflow + KG-first discovery** — the managed `AGENTS.md` section teaches the agent problem-first development with vault intents and `atomic vault query` navigation

You never need to run `atomic add` or `atomic record` — the hooks handle it.

## What this repository is for

This repo is the **content home** of the integration — the pieces that can
evolve without an `atomic` binary release:

- `AGENTS.md` — the canonical instruction file (the standard shared across
  agent integrations, templated for agy)
- `plugin/` — the agy plugin bundle (`plugin.json`, `hooks.json`, and the
  three skills), installable directly with `agy plugin install plugin/`
- `hooks/agy.atomic-hooks.json` — the hook wiring manifest consumed by
  `atomic agent enable --hooks`
- `install.sh` / `install.js` — an alternative script-based install
  for setups that prefer it

The hook **handler** (`atomic agent hooks agy <verb>`) ships in the `atomic`
binary itself; this repo owns the content the handler serves.

## Alternative: development install from a checkout

```bash
git clone https://github.com/atomicdotdev/atomic-agy
cd atomic-agy
atomic agent enable --agent agy --from .
```

Or the legacy script path:

```bash
./install.sh          # agy plugin install + optional global AGENTS.md link
./install.sh --uninstall
```

The script additionally offers to symlink `AGENTS.md` into agy's global
context slot (`~/.gemini/GEMINI.md`) so the instructions apply in every agy
session, including non-Atomic projects. It never clobbers an existing file.

## Notes on agy 1.1.4

- Hooks only fire when delivered through the plugin mechanism. A
  project-level `.agents/hooks.json` is loaded by agy but its handlers never
  execute — that is why installation goes through the plugin.
- agy runs plugin hooks with the plugin directory as the working directory.
  The installed hook commands therefore carry no `test -d .atomic` guard —
  `atomic agent hooks agy` resolves the repository from the `workspacePaths`
  field in each hook payload and exits quietly in non-Atomic workspaces.
- Hook payloads do not include the user prompt, model name, or token usage.
  Change messages fall back to file summaries and attestations show zeros
  until enriched; the transcript path is stored on every session for future
  enrichment.

## License

Apache-2.0
