# CompoMotion

A personal **motion study library** (repo folder still `capture-to-card` until rename). Original WAAPI + FLIP choreography — CSS + React copy surfaces are listed in the UI and not available yet.

## Studies

| Name            | Slug                | Status                                                           |
| --------------- | ------------------- | ---------------------------------------------------------------- |
| **Cell reveal** | `file-to-card`      | Live — **Animate** runs in-place cell build; card stays in Build |
| **Grid insert** | `collection-insert` | Live — FLIP from build card into slot 0 (button only)            |

The demo opens on **Library**. **Docs** is a short report (Introduction + Documentation). **Back** returns to Library. Not a published npm package or a screen-capture tool.

## Run locally

Node **v24.15.0**, pnpm **11.18.0** verified. **`http://127.0.0.1:5174/`** (`strictPort: true` in `vite.config.ts`).

```bash
pnpm install
pnpm dev
```

| Command             | Purpose          |
| ------------------- | ---------------- |
| `pnpm dev`          | Dev server       |
| `pnpm test`         | Vitest           |
| `pnpm lint`         | oxlint           |
| `pnpm format:check` | Prettier (CI)    |
| `pnpm build`        | Production build |

## Docs

| File                                | Role                             |
| ----------------------------------- | -------------------------------- |
| `docs/A-PROJECT-BRIEF.md`           | Studies, rename, copy roadmap    |
| `docs/B-MOTION-STORYBOARD.md`       | Poses, timing, skeleton fidelity |
| `docs/C-ENGINEERING-DECISIONS.md`   | Architecture                     |
| `docs/D-QUALITY-AND-PERFORMANCE.md` | Bundle + manual QA               |

## License

[MIT License](LICENSE). Third-party runtime deps: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
