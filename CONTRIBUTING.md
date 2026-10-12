# Contributing

## Layout

| Path | Role |
|---|---|
| `shared/` | Single source of truth: taxonomy, spacing, platforms, legal audit. Edit only here. |
| `skills/<skill>/` | One skill: `SKILL.md` and `scripts/`. `references/` is a generated copy of `shared/`. |
| `figma/` | Condensed single-file versions for the Figma in-app agent. Maintained by hand. |
| `tools/figma-run/` | Optional runner for figma-console, outside the plugin. |
| `.claude-plugin/` | Plugin and marketplace manifests. The version is synced, never hand-edited. |

## Workflow

1. Edit `shared/`.
2. Run `./sync.sh`. It copies `shared/` into each skill's `references/` (spacing skills receive only `espacamento*.md`; typography skills receive none of them) and builds `dist/*.skill`. Commit `references/`, because the plugin installs from git. `dist/` stays out of git.
3. If the taxonomy, size floors or spacing scale changed, update `figma/tipografia-semantica-agente.md` or `figma/espacamento-semantico.md` by hand. The sync warns when the condensed file is older than its source.
4. Run `pnpm changeset` and describe the change. Every pull request needs one; CI checks it.

CI also runs `./sync.sh` and fails when `skills/*/references` differ from `shared/`.

## Release

A merge to `main` with pending changesets opens the "Version Packages" pull request. Merging that pull request bumps the version in `package.json`, `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, creates the tag and the GitHub Release, and attaches the three `.skill` files.

Validate the manifests locally with `claude plugin validate .`. It warns that `CLAUDE.md` at the plugin root is not loaded as context. That is expected: the file serves people working on this repository, and installed users never see it.
