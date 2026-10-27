---
name: capture-to-card-git-pr
description: >-
  Git, GitHub, and pull request workflow for the capture-to-card personal repo.
  Use when preparing a commit, branch, push, PR, labels, or merge onto main.
---

# capture-to-card Git and PRs

Do not apply engineering or motion rules from the other skills here. This skill is only the GitHub workflow.

## Identity and remote

Before any GitHub write:

1. Confirm you are in this repository (the `capture-to-card` working tree the owner opened).
2. Confirm the active `gh` account is **AchrafGhod**.
3. Confirm `origin` is `https://github.com/AchrafGhod/capture-to-card.git`.
4. Confirm local `user.email` is `achrafghod.pro@gmail.com` for this repo. Do not change global Git config.

If the account, remote, or email is wrong, stop.

## Commits

The project owner commits. Agents prepare the diff and a message, then wait.

- Never `git commit`, `git push`, publish, or merge unless the owner explicitly asks.
- Never `--force` on `main`.
- Never skip hooks.

Message form: `type: short reason` (why, not a file list).

| Type        | Use                              |
| ----------- | -------------------------------- |
| `feat:`     | User-visible capability          |
| `fix:`      | Defect                           |
| `refactor:` | Same behavior, clearer structure |
| `docs:`     | Documentation only               |
| `test:`     | Tests only                       |
| `chore:`    | Tooling, CI, ignore files        |

No ticket IDs. One purpose per commit.

## Branches

After the first `main` commit, do new work on a descriptive branch:

- `feat/shared-element-morph`
- `fix/import-object-url-leak`
- `chore/ci-node-version`

Do not mix unrelated work onto the branch.

## Pull requests

Open PRs against `main`. The body describes the **final** change, not the attempt history.

Use `.github/pull_request_template.md`. Drop empty sections on trivial changes. Do not check boxes you did not verify.

Labels that exist on `AchrafGhod/capture-to-card` (verified 2026-10-27):

| Name               | Use                                        |
| ------------------ | ------------------------------------------ |
| `enhancement`      | New capability                             |
| `bug`              | Defect                                     |
| `documentation`    | Docs only                                  |
| `accessibility`    | Keyboard, focus, semantics, assistive tech |
| `animation`        | Motion or visual transition                |
| `duplicate`        | Same as another issue/PR                   |
| `good first issue` | Small, well-scoped issue                   |
| `help wanted`      | Extra attention requested                  |
| `invalid`          | Not actionable                             |
| `question`         | Needs clarification                        |
| `wontfix`          | Will not be done                           |

Do not invent labels. Do not add status labels such as “need review”; use GitHub review and CI state.

Before suggesting a label, list them again if this table may be stale:

```bash
gh label list --repo AchrafGhod/capture-to-card
```

## Push and merge conventions

Team convention (not all of this is enforced by GitHub today):

- Work on a branch; open a PR to `main`.
- Prefer **squash merge**.
- Do not force-push `main`.
- Resolve relevant review comments before merge.
- CI on `push` and `pull_request` runs `format:check`, lint, test, and build (`.github/workflows/ci.yml`).

Observed GitHub settings (2026-10-27, empty remote, no `main` yet):

- Public repo, default branch name `main`.
- Squash, merge commit, and rebase are all enabled.
- Auto-merge off. Delete branch on merge off.
- **No branch protection** was configured (the `main` branch did not exist). Do not claim required reviews or required checks unless you re-check.

Re-check before stating a protection as fact:

```bash
gh api repos/AchrafGhod/capture-to-card/branches/main/protection
```

Do not change protections or collaborator access unless the owner asks.

## Before push

```bash
git status
git remote -v
gh auth status
pnpm run format:check
pnpm run lint
pnpm run test
pnpm run build
```

If `origin/main` has commits you do not expect, inspect them. Do not overwrite.

## Maintenance

When labels, merge settings, or CI change, update this skill and keep `AGENTS.md` to a one-line pointer.
