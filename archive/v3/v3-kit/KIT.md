# Flow-Board Component Kit (v3 · Phase 2)

> Extracted from the five verified v3 era-slices so Phase 3 can assemble ONE unified game.
> Canonical reference = `emergence-v3.html` (Origins — the Cody-validated slice, dead-clicks 18→1).
> This doc is the **contract**: what's shared (the kit), what each era customizes (divergence map),
> and what collides when the five IIFEs become one (merge hazards).

## Load-bearing rule (never violate)
BUILD-ONCE / update-in-place. `refresh()` must NEVER rewrite a live button's innerHTML every tick —
replacing the child under the pointer mid-click is the "dead-click" bug. Every value update goes
through the change-detected setters. Purchases call `refresh()`, never a full structural rebuild.

```js
const setTxt = (el,t)=>{ if(el && el._t!==t){ el.textContent=t; el._t=t; } };
const setHTML= (el,h)=>{ if(el && el._h!==h){ el.innerHTML=h; el._h=h; } };
const setDis = (el,d)=>{ if(el && el.disabled!==d) el.disabled=d; };
```
Confirmed byte-identical across all five slices.

---

## Kit layers (three tiers)

**Tier 1 — Chrome (theme-agnostic, shared verbatim).** Same in every era; only CSS vars change.
- Helpers: `$`, `fmt`, `esc`, `setTxt/setHTML/setDis`
- Overlays: `#fx`/`.float`+`floatNum`, `#tip`+tooltip system (`data-tip`), `#toasts`/`.toast`+`toast()`
- Instrumentation: `REC`/`rec`, `@deadclick` telemetry, `@scroll`, `runJSON`/`downloadRun`
- Dev: `#dev`/`#dbg`, `renderDev`/`updateDbg`/`toggleDev` (backtick), speed 1/3/10/50×, +res, new game+
- Audio: `playClick` (WebAudio), `#music` + `toggleMusic` + first-gesture resume
- Persistence: `save`/`load` (localStorage), `newGame` (snapshot-before-wipe)
- Loop: `tick()` (dt clamp + `S.speed` scale + before/after `RATES` snapshot)

**Tier 2 — Flow-Board primitives (shared structure, theme-driven skin).** Same CSS classes, each era
composes them differently and re-skins via vars.
- Rail: `.rail`/`.chip`/`.cdot`/`.cbody`/`.clab`/`.cval`/`.cps`(.pos/.neg/.zero)/`.rail-right`/`.rail-btn`
- Header: `header.era`/`.sig`/`.sub`/`.phase`
- Board grid: `.board` (verbs | pipeline | goal) / `.col-head`
- Verbs: `.verb`(.vname/.vyield) / `.side-btn`(.badge)
- Pipeline: `.lane`/`.lane-lab`/`.ldash`/`.pipe`/`.seg` + `.stock`/`.flow` connector/`.node`/`.buy`/`.pause`/`.auto`
- Connector engine: `FLOW`/`fIn`/`fOut`/`connGlow` + `connector(res)` builder (the "see systems affect each other" invention Cody validated)
- Goal: `.goal`(.ready wake) /`.gname`/`.gsub`/`.meter`/`.meter-lab`/`.fab`/`.locked`
- Standing controls: `.standing`/`.ctrl`/`.ctrl-lab`/`.lever`
- Event card: `.commission`(.show)/`.cm-*` (the timed decision card — generalizes to any era's event)
- Drawer: `#research`/`.rh`/`.rbody`/`.rsec`/`.disco`/`.cost-res` + `costHTML` per-requirement chips
- Builders: `connector(res)`, `stock(res,label)`, `node(key,name,tip)`, `nodeRefresh`, `autoRefresh`

**Tier 3 — Era mechanic modules (unique per era).** Each era owns its "fun primitive." Registered as
`{ id, theme, cfg, fresh(), produce(dt), build(), refresh() }`. The kit calls into these; they call kit
helpers. Populated from the divergence maps below.

---

## Theme-variable contract
Every era must define these on its `body.theme-N` / `.era-eN` block so Tier-1/2 render unchanged:
```
--bg --panel --panel-2 --line --edge --text --dim --dimmer --accent
--good --danger              (rail rate colors, buy-affordable, starved)
--era-font (display/Cinzel slot) + --body-font (EB Garamond slot)
per-resource hues: exposed via a JS HUE map, not CSS vars (see merge note)
texture: --stone-noise-equivalent (per-era background filter)
```
Origins values (reference): see `emergence-v3.html` `:root` lines 11-17.

---

## Canonical-form decisions (reconciling Tier-1 drift)
All five slices carry the same chrome, drifted in small ways. The kit adopts the **superset / bug-fixed**
form of each:
| Helper | Drift seen | Canonical form |
|---|---|---|
| `setTxt/setHTML/setDis` | byte-identical everywhere | keep verbatim (load-bearing) |
| `fmt` | Origins tops at M; Symbolic/Deep/Foundation add a `1e9→B` branch | **include the B branch** |
| `playClick` | per-era tone (chisel/phosphor/data-ping/industrial); Foundation generalized to `playSound(type)` w/ buy/event/milestone/glitch | **`playSound(type)`** + per-era oscillator profile in `ERA.sound` |
| `toast(head,body,kind)` | kind → `.event`/`.ev`/`.brk`/`.edu`; Symbolic renamed header `.th`→`.th2` to dodge theorem-card `.th` | header class = **`.toast-h`** (namespaced, no clash); kind maps to a themed border var |
| `connGlow` | `(res,active)` / `(res,full)` / `(k,thru,blocked)` / `(res)`; normalizer `/0.4`,`/1.5`,`/6` | **`connGlow(res,{thru,blocked,norm})`** — explicit optional, default derives from FLOW, per-connector `norm` |
| `save`/`load` | `{S}` vs `{S,t}`; flat vs nested merge | **`{S,t}`** + generic deep-merge of `fresh()` shape (handles nested sub-objects) |
| `newGame` | Origins snapshots run before wipe (run-2-bug fix); Statistical omits it | **always snapshot** (keep the fix) |
| `REC` | Origins has `t0`; others don't | keep `t0` |
| `@scroll` telemetry | Origins only | keep in kit |
| extras | Deep `setAttr` (SVG), Statistical `setText(id,t)` id-wrapper | **add both to kit** |
| `FLOW`/`fIn`/`fOut` | Foundation drops `fOut` (no converters); Symbolic inlines | keep full `fIn/fOut`; eras that don't consume just never call `fOut` |

## Divergence map (per era)
Verdict legend: ✅ reuse kit as-is · 🔶 kit primitive, era re-skins/recomposes · ➕ era-only (Tier-3 module).

### Symbolic (theme-2, VT323/Plex, phosphor)  — map-symbolic.md
- ✅ rail/chip (glyph, no img), header (no `.sig`), board (goal col 250), flow connector, tick/render/refresh split (build-once intact), tip/dev.
- 🔶 `.verb` (+`.vkey` keyboard hint), `.node` (2-col, no icon, no pause), `.stock` (+`.scap` inference cap), goal wakes **teal** (Era-3 tease), toast header renamed `.th2`.
- ➕ CRT chrome (`body::after` scanlines, `.tissue` explainer, `.disp`); **theorem tree** (`.theorems`/`.th`/`.thaim` driven by `TREE` w/ doctrine fork); **proof loop** (`.proof-active` meter, `selectProof`→`proofAcc`→`completeProof`); **Contradiction** card (`.contra`, replaces commission); `.path` goal checklist.
- Absent from kit: `.pause`, `.auto`, `#research` drawer, `.lever`/`.standing` (dead CSS present), `costHTML`, `fIn/fOut`, `node()` builder, `@scroll`.
- **Reach-back gap** (not a fake resource): consumes zero earlier resource; the Knowledge→Rules seed is simply un-wired — add in `openEra`.

### Statistical (theme-3, Space Grotesk/Plex, teal)  — map-statistical.md
- ✅ `.wrap`, flow connector **byte-identical**, `.lane`/`.seg`, `.buy`, tip/dev/float, ~90% of helpers byte-identical, render/refresh split.
- 🔶 rail (`.cps.pos`→`--insight`), `.stock`/`.chip` icon-or-glyph, `.node` (no pause), goal wakes **blue** (Deep tease) +`.gval`, adds `setText(id,t)`.
- ➕ **scatter canvas** (`drawScatter`, the hero — no Origins analog), pinned `.stage`, two-needle `.ntrack` readout, Focus dial (`.focus-ctrl`, replaces `.lever`), Experiment Board (`.exp-card` funded by Data, replaces `#research`), method pins (`.method-pin`), `.event-banner` (distribution shift, replaces commission), `.supply-bus` (Origins reach-back strip).
- Absent: `.verb` (→`.verb-run`), `.side-btn`, `.pause`, `.auto`, `.commission`, `#research`, `downloadRun`, `@scroll`, run-snapshot in `newGame` (**restore the fix**).

### Deep (theme-4, Rajdhani/Plex, blue) — MOST DIVERGENT — map-deep.md
- ✅ rail/chip, header, flow connector (`--thru`, near-identical), goal/meter/ready wake, tick→produce→RATES→refresh, tip/dev/float, dev fns. Adds `setAttr` (SVG).
- 🔶 `.board` (226/244), `.side-btn` → supply-bus producer grid, `.lane` → per-run card (`--rc` color), goal `.fab`→`.advance`.
- ➕ **triangular ternary mixer** (`.tri-mixer` drag — barycentric `setAllocFromXY`, handle snaps to pointer); run lanes (`.run-node`/`.rbadge`/`.rtrend`); **wind sparklines** (`.wind-fc` SVG, ~12s forecast); gauges (`.gauges`, cap/compute/heat) + `.heat-led`; `.event-banner` (drift/breakthrough); `.lock-btn` (freeze, replaces `.pause`); `.steer-btn` (Stabilizer); `.orch` ("what to do now"). **No canvas** — loss chamber is SVG sparklines.
- Absent: `.seg`, `.node`, `.buy`, `.pause`, `.auto`, `.standing`, `.commission`, `#research`, `stock()/node()` builders, `costHTML`.
- **RR5 hook `chainPerFoundry` is genuine — must survive the stand-in revert.**

### Foundation (theme-5, Inter/Space Grotesk, violet) — the finale — map-foundation.md
- ✅ rail/chip (glyph), header, board/col-head, lane/pipe/seg/stock, flow connector, `.buy` (+`.act`), meter base, toast/tip/dev, tick, render/refresh split, save/load, dead-click, music toggle.
- 🔶 `fmt` (+B), `connGlow` single-arg `/6`, `playClick`→`playSound(type)`, `toast` (+`.edu`, dwell 9s), two-bed crossfade music, board is **fully JS-built into empty `#board`** and swapped on phase change.
- ➕ **phase state machine** (`S.emerged`/`S.rupture` 0–3/`S.ending`): `buildPre`(rush-vs-prepare: Self-Improve vs Align) → `emerge()` → **rupture cinematic** (`runRupture`: `body.rupturing` + `#rupture` overlay + `.board.shatter`→`.assembling`) → `buildAftermath`(Constrain/Interpret/Delegate + **veto windows** `openVeto`/`PROPOSALS`) → `resolveEnding` (endcard + recap scorecard/grade). `.engine`+`.cap` replace `.node`; `.sys`+`.hero` replace `.goal`; hidden `S.agency`→Anomaly band.
- Absent: `.node`, `.goal`/`.fab`/wake, `.pause`/`.auto`, `.commission`, `#research`, `.standing`, `costHTML`, `floatNum` (`.float`/`#fx` **dormant**).
- **`RUPTURING` guard** already early-returns `render()`/`refresh()` during the cinematic — the kit's dispatch must honor an active-era "owns the DOM" flag.

---

## Merge hazards (5 IIFEs → 1) — consolidated
1. **Duplicate element ids** across slices: `rail, board, phase, goal, fabricate/advance, lanes, tip, fx, toasts, dev, dbg, music, musicBtn, rupture` + generated `rv-*/rp-*/cnt-*/buy-*/meter-*`. **Mitigation:** one shared **rail** (cross-era backbone resources, single id registry) + one **`#board`** that only the *active* era builds into (Foundation-style swap) → per-board ids never coexist. Rupture/overlays are singletons in the shell.
2. **Global const/fn collisions**: `S, CFG, render, refresh, tick, produce, FLOW, RATES, connector, stock, node, HUE, ICON, RAIL, BUYS, buildLanes, save, load`. **Mitigation:** kit owns the singletons (`S`, one `CFG`, one `render`/`refresh`/`tick` that **dispatch to the active era module**). Each era = a module object `{id, theme, cfg, fresh, produce, build, refresh, sound}`.
3. **CFG key clash** — Deep reuses Origins `foundryCost/scriptoriumCost/…` verbatim. **Mitigation:** every era's tunables live under `CFG.eN`; nothing shares a bare key.
4. **Palette on `:root`** (Symbolic/Deep/Foundation) + Foundation's vestigial `theme-5` class with no block. **Mitigation:** each era palette → scoped `body.theme-N` block; shell `setTheme(n)` switches the body class; `body.rupturing` is **additive** (never replaces the theme class).
5. **Hardcoded hue literals** (teal rgba in Statistical, run hues in Deep SVG gradients, rupture hexes in Foundation). **Mitigation:** convert re-skinnable ones to vars; keep deliberate **next-era tease** colors as a per-era `--tease` var.
6. **Duplicated resource registries** — `knowledge/silicon/data/insight` re-declare HUE/ICON per slice (colors agree). **Mitigation:** one shared `RES` registry `{key:{hue, icon|glyph, flavor}}`; stock/chip builders accept **both** an image path and a glyph char.
7. **Rupture overlay is page-global** (`#rupture` fixed inset:0 z9000, `body.rupturing` filters `<body>`). **Mitigation:** fires only while Foundation is the active era; overlay is a shell singleton; reduced-motion fast-path preserved.
8. **Music** — each slice hardcodes its bed (Foundation two). **Mitigation:** one `MUSIC` controller with all 5 beds + `music-unmoored-presence.mp3`, crossfading on era switch. The shipped `emergence.html` already has this controller — port it.
9. **Board grid dims** drift (first col 210–232, last 240–250). **Mitigation:** canonical `220px 1fr 244px`, breakpoint 940.

## Economy stand-ins to revert (Phase 3, task #3) — with exact seams
- **Statistical** — fake Foundry costs **Data** (`BUYS.foundry.res:'data'`) and *emits* Silicon (`produce`: `S.silicon += S.foundry*CFG.foundryRate*dt`) instead of consuming Metal+Knowledge. Also `modelSilicon:0.05` upkeep seam. → point Silicon draw at the real Origins Foundry output bus; drop the Data→Foundry buy.
- **Deep** — 4 flat local producers (`foundry→silicon, dataset→data, model→insight, scriptorium→knowledge`) replace the real Origins/Statistical stacks (self-flagged comment). Feedstock *mapping* is real (`CFG.feedstock`), starved-run **block** is real. → swap the 4 flats for the live upstream buses; **keep `chainPerFoundry` (RR5)**.
- **Foundation** — `capIncome:14` fakes incoming Capability (`produce`: `S.capability += capIncome*…*dt`); `seedBreadth:0.92` fakes carried vision/language/reasoning (`fresh`), driving the Scale climb; plus stub prior-era stocks `{gap,accuracy,foundry,knowledge,rules,ruleset}` the aftermath `PROPOSALS` read. → wire `capIncome`→live Deep Capability, `seedBreadth`→real Deep run states, stubs→live earlier-era resources.

---

## Recommended shell architecture (Phase 3) — "one live board + shared rail"
The v3 paradigm ("one screen per era") + Foundation's already-working full-JS board swap point to a single
architecture; adopting it now shapes the kit:
- **Persistent shared rail** across the top — cross-era backbone resources from one `RES` registry, condensable.
- **Era nav** (tab/collapse strip) switches the active era; `setTheme(n)` re-skins; `MUSIC` crossfades.
- **One `#board`** — the active era module's `build()` renders into it; `render()`/`refresh()`/`tick` **dispatch**
  to the active era; earlier eras keep producing in the background (living supply chain) so reach-back is real.
- **One `S`** = shared backbone resources + `S.eN` per-era sub-state; **one `CFG`** = `CFG.eN`; **one save key** (versioned).
- Overlays (`#tip`/`#toasts`/`#fx`/`#dev`/`#rupture`) are shell singletons.
- This is a recommendation to confirm when we start Phase 3, not a commitment made now. The extracted kit below
  is written to serve it (era-module interface + dispatching render), and would need only minor changes for a
  stacked/scroll model.

## Extracted kit files
- `kit.css` — Tier-1 chrome + Tier-2 primitives, theme-var-driven (the theme contract above). _next_
- `kit.js` — chrome helpers (canonical forms) + Tier-2 builders + the era-module interface + dispatching render/refresh/tick. _next_
- In Phase 3 both get inlined into the single `emergence-v3-unified.html` (single-file constraint).
