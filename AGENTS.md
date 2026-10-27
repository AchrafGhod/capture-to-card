# Agent instructions

Personal project **capture-to-card** — explorer-to-card composition (frontend only). Hero morph is implemented (WAAPI + FLIP); skeleton reveal is not.

## Must

- Keep scope small: demo scene + component folder; no backend or global state libraries.
- Match decisions in `docs/C-ENGINEERING-DECISIONS.md`; update that file after durable technical choices.
- Use skills under `.agents/skills/` for architecture, quality, or Git/PR work.
- **Never** `git commit`, `git push`, publish to npm, or deploy unless the owner explicitly asks. Prepare the diff and a commit message, then wait.

## Should

- Prefer plain CSS and one animation approach (see engineering doc); do not add Motion and GSAP together.
- Preserve visual continuity goals in `docs/B-MOTION-STORYBOARD.md`.
- Run `pnpm run format:check`, `pnpm run lint`, `pnpm run test`, and `pnpm run build` after substantive changes; record bundle notes in `docs/D-QUALITY-AND-PERFORMANCE.md`.
- Format with `pnpm run format` (Prettier; options in `.prettierrc.json`). Do not hand-edit style to fight the formatter — CI runs `format:check`.

## Must not

- Copy proprietary data, secrets, or domain-coupled UI wholesale from other products.
- Import or paste third-party transition-pack source without license compliance.

## Docs map

| File                                | Role                        |
| ----------------------------------- | --------------------------- |
| `docs/A-PROJECT-BRIEF.md`           | Intent and scope            |
| `docs/B-MOTION-STORYBOARD.md`       | Motion beats                |
| `docs/C-ENGINEERING-DECISIONS.md`   | Technical decisions         |
| `docs/D-QUALITY-AND-PERFORMANCE.md` | Measurement and quality bar |
