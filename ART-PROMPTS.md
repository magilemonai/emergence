# Art prompts — Eras 4 & 5 (generate in ChatGPT, then Claude keys + wires)

Eras 4-5 are **fully built and playable** with glyph fallbacks. These are the icon
sets to make them look finished. Same pipeline as before: generate in ChatGPT (higher
fidelity), Claude keys the baked checkerboard to alpha (PIL luminance threshold ~150-212)
and wires `UPICON`/`CAPMAP`/sigil paths.

**Per-era hue:** Era 4 Deep = **blue (#6ea8ff)**. Era 5 Foundation = **violet (#b78bff)**.
House style (match Eras 1-3): minimal **line-art**, single-hue glow on near-black, centered,
square, generous transparent margin, ~1024px, no text, no checkerboard if you can avoid it.

---

## Era 4 — Deep (blue #6ea8ff)

1. **Era 4 sigil** (`era4-sigil`) — emblem for the era bar. A neural lattice folding inward
   into a single bright node; concentric depth. Blue line-art, luminous, symmetrical,
   like a seal. (Mirror the era1/symbolic/statistical sigils.)

2. **Compute Node** (`icon-node`, the main building) — a stacked GPU/compute brick or a
   glowing tensor cube wired into a small grid. Blue line-art, single object, centered.

3. *(optional, nice-to-have)* three **training-run** glyphs, one per domain, same blue:
   - `run-vision` — an eye / aperture resolving into a grid of pixels.
   - `run-language` — interlocking glyphs / a token stream becoming a sentence.
   - `run-reasoning` — a branching chain of inference nodes / a small proof tree.

## Era 5 — Foundation (violet #b78bff)

4. **Era 5 sigil** (`era5-sigil`) — emblem of recursion/emergence. An ouroboros of light
   or a spiral feeding its own center; something that loops back on itself and brightens.
   Violet line-art, luminous, symmetrical seal.

5. Three **Emergent Capability** icons (violet line-art, single object each):
   - `cap-selfModel` — **Self-Modeling**: a figure containing a smaller copy of itself
     (mise en abyme) / a mirror reflecting a mirror.
   - `cap-transfer` — **Transfer Learning**: three nodes sharing one bright thread between
     them; knowledge flowing across domains.
   - `cap-worldModel` — **World Model**: a compressed globe / a dense knot of connections
     forming a sphere.

6. *(optional)* **The Emergent Agent** — a hero glyph for the finale: a form that clearly
   was *not* placed by a designer, coalescing out of the lattice. Violet→white core, the
   brightest asset in the game. Used at the emergence moment.

---

### Wiring checklist (Claude, once PNGs land in `images/` → keyed to `assets/`)
- `UPICON.node = 'assets/icon-node.png'` (Compute Node tile).
- `ERAS[4].sigil = 'assets/era4-sigil.png'`; `ERAS[5].sigil = 'assets/era5-sigil.png'`.
- Capability tiles: add a `CAPICON` map (`selfModel/transfer/worldModel`) read in `capTile()`.
- Optional run glyphs in `allocRow()`; optional agent glyph in `buildEmergence()`.
