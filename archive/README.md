# archive/ — nothing here is ever edited or deleted

Every prior version of EMERGENCE is preserved here in full, runnable in place. New versions are
built as ADDITIONAL files at the repo root; when one ships, the one it replaces lands here first.

| Version | What it was | Files | Verify |
|---|---|---|---|
| **v2** (shipped 2026-06-16 → 2026-07-01) | the pre-Flow-Board single-file game | `emergence-v2-final.html` + `test-emergence-v2.js` | `node archive/test-emergence-v2.js` (200 green) |
| **r6 iteration 1** (2026-06-30) | the incremental UI pass that preceded the v3 rebuild | `emergence-r6-iteration1.html` | open in a browser |
| **v3 "Flow Board"** (shipped live 2026-07-01, archived 2026-09-06) | one screen per era, color rail, flow connectors | `v3/` — the built artifact `emergence-v3-final.html`, the modular source (`emergence-v3-unified.html` + `v3-kit/`), its suite, tools, design docs, and the five standalone slices in `v3/slices/` | `node archive/v3/test-v3.js` (92 green) |

Git tags mark the same points: `v3.0-flow-board-live` (the v3 ship + handoff docs).

The archived builds reference `assets/` relative to their own directory. To open one in a browser,
copy it next to the repo-root `assets/` folder (or symlink `assets` into the archive directory).
Tests and headless probes don't need assets.
