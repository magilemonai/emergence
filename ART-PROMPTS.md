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

---

## Era 1 — Origins TEXTURE OVERLAYS (from the carved-stone critique)

Procedural grain + ink + benches are wired. These PNGs add the final layer — irregular
edges and real sub-materials — that CSS can't fake. All **transparent PNG, ~1024px, no text**.
Drop in `images/`, I key (if needed) → `assets/` and wire with `::before`/`::after`.

1. `stone-edge-chips` — a **transparent chipped/worn rectangular border frame** (interior fully
   transparent, only the edge): chipped corners, rubbed highlights, small cracks. Warm grey-stone
   with faint bronze dust. Tiles over any panel/button edge to break the perfect rectangle. **Highest impact.**
2. `era1-record-clay` — a seamless **clay-tablet / parchment face** texture: dusty, light warm
   ochre, faint etched tally scratches. For The Record cards.
3. `era1-forge-basalt` — a seamless **dark basalt / charcoal face** texture: near-black, soot,
   a few faint ember specks low. For The Forge cards.
4. `era1-core-disk` — a **circular carved stone slab/anvil**: concentric construction rings, chips,
   a worn center, warm bronze edge light. The ritual focal object behind the evolving core.
5. `seal-discovered` — a small **bronze stamped wax/clay seal medallion** (line-art, transparent):
   the "DISCOVERED" status stamp for completed research, replacing the modern disabled button.
6. `carved-divider` — a thin **engraved bronze divider rule** with a small central sigil,
   transparent: section breaks in the research archive.

(All single-hue ochre/bronze on transparent. If a flat solid bg is easier, white-bg keys fine.)

---

---

## Era 2 — Symbolic: the CRT terminal (amber/green phosphor)

The world is a glowing cathode-ray terminal. Scanlines, phosphor glow, curved glass,
flicker — all done in CSS. These PNGs add the *physical screen* on top. House hue:
**amber phosphor (#ffcd6b)** with optional **green-phosphor (#7dffb0)** accents.
Transparent PNG unless noted, ~1024px, no text.

1. `crt-bezel` — a **dark monitor housing / bezel frame** (transparent screen interior):
   moulded plastic or brushed-metal CRT shell, gently rounded screen corners, a few
   vents, a tiny power LED, light wear/dust. This is the Tier-1 frame (the stone-edge
   equivalent) — it makes the era a physical screen you're looking *into*. **Highest impact.**
2. `crt-glass` — a faint **curved-glass overlay**: soft top-left reflection, a couple of
   smudges/scratches, and a vignette darkening the corners. Mostly transparent, sits over
   panels for the glass-under-light feel. Subtle.
3. `schematic-bg` — a seamless **logic-diagram / punch-card / circuit-schematic** texture in
   faint amber line-work on near-black: gates, nodes, wiring, register grids. Panel
   background (the Era-3 graph-paper equivalent, but for symbolic logic).
4. `boot-glyph` — a small **terminal boot sigil / cursor-crest**: a phosphor emblem (could
   riff on the existing symbolic sigil) shown at the prompt. Amber glow, transparent.

(Existing Era-2 icons — ruleset/daemon/axioms/inference/theorems/sigil — already read as
amber line-art and fit the phosphor world; no need to regenerate unless one bugs you.)

---

### Wiring checklist (Claude, once PNGs land in `images/` → keyed to `assets/`)
- `UPICON.node = 'assets/icon-node.png'` (Compute Node tile).
- `ERAS[4].sigil = 'assets/era4-sigil.png'`; `ERAS[5].sigil = 'assets/era5-sigil.png'`.
- Capability tiles: add a `CAPICON` map (`selfModel/transfer/worldModel`) read in `capTile()`.
- Optional run glyphs in `allocRow()`; optional agent glyph in `buildEmergence()`.
