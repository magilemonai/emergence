// WO-09 — beds and the createAudio wiring, driven headlessly with a fake document and a fake store.
// No AudioContext here: this pins the crossfade envelope, the reversed buffer, the persisted keys and
// the fact that nothing sounds before start().
import { createBeds, crossfadeGains, reverseBuffer, BED_FILE, CROSSFADE_S } from '../audio/beds.js';
import { createAudio, KEY_ON, KEY_BED, KEY_SFX, KEY_VOICES, SFX_PROFILE } from '../audio/index.js';
import { AUDIO } from '../audio/synth.js';

function fakeDoc() {
  const made = [];
  const body = { appendChild(x) { made.push(x); } };
  return {
    body: body, made: made,
    createElement() {
      return { src: '', loop: false, preload: '', volume: 0, className: '', playing: false,
        play() { this.playing = true; return { catch() {} }; }, pause() { this.playing = false; } };
    }
  };
}
function fakeStore(seed) {
  const m = Object.assign({}, seed || {});
  return { map: m, getItem(k) { return k in m ? m[k] : null; }, setItem(k, v) { m[k] = v; } };
}

export async function run(t) {
  /* ---------- the crossfade envelope ---------- */
  let g = crossfadeGains(0);
  t.near(g.out, 1, 1e-9, 'a fade starts on the old bed');
  t.near(g.in, 0, 1e-9, 'the new bed starts silent');
  g = crossfadeGains(1);
  t.near(g.in, 1, 1e-9, 'a fade ends on the new bed');
  t.near(g.out, 0, 1e-9, 'the old bed ends silent');
  let flat = true;
  for (let k = 0; k <= 1.0001; k += 0.02) {
    const x = crossfadeGains(k);
    if (Math.abs(x.in * x.in + x.out * x.out - 1) > 1e-9) flat = false;
  }
  t.ok(flat, 'the crossfade holds equal power across the whole 1.2s');
  t.eq(crossfadeGains(2).in, 1, 'the fade parameter is clamped');

  /* ---------- the bed player ---------- */
  const doc = fakeDoc();
  const beds = createBeds({ doc: doc, base: '../assets/' });
  beds.setVol(0.15);
  beds.setOn(true);
  beds.set(1, true);
  t.eq(beds.key, 1, 'setBed selects the Origins track');
  t.ok(doc.made[0].src.indexOf(BED_FILE[1]) >= 0, 'the Origins bed points at the Suno track');
  t.near(beds.els[1].volume, 0.15, 1e-9, 'the locked bed plays at the persisted level');
  t.eq(beds.els[1].playing, true, 'the bed is playing once the player is on');

  beds.set(2, false);
  t.near(beds.els[2].volume, 0, 1e-9, 'the incoming bed enters silent');
  t.near(beds.els[1].volume, 0.15, 1e-9, 'the outgoing bed is still at level when the fade starts');
  const half = CROSSFADE_S / 2;
  for (let i = 0; i < 30; i++) beds.tick(half / 30);
  t.near(beds.els[2].volume, 0.15 * Math.SQRT1_2, 0.002, 'halfway through, the new bed is at equal power');
  t.near(beds.els[1].volume, 0.15 * Math.SQRT1_2, 0.002, 'halfway through, the old bed matches it');
  for (let i = 0; i < 40; i++) beds.tick(half / 30);
  t.near(beds.els[2].volume, 0.15, 1e-9, 'the fade lands on full level');
  t.eq(beds.els[1].playing, false, 'the old bed stops when the fade completes');
  t.near(beds.fade, 1, 1e-9, 'the fade is complete after 1.2s');

  beds.setVol(0.9);
  t.near(beds.els[2].volume, AUDIO.bedMax, 1e-9, 'a bed never passes the 0.2 ceiling');
  beds.setOn(false);
  t.eq(beds.els[2].volume, 0, 'the music toggle silences the bed');
  t.eq(beds.els[2].playing, false, 'the music toggle pauses the bed');
  t.eq(Object.keys(BED_FILE).length, 7, 'five strata plus the surface plus the rupture bed');
  t.ok(BED_FILE.rupture.indexOf('unmoored') >= 0, 'the rupture crosses to Unmoored Presence');

  /* ---------- the reversed surface buffer ---------- */
  const ctx = {
    createBuffer(ch, len, rate) {
      const data = []; for (let c = 0; c < ch; c++) data.push(new Float32Array(len));
      return { numberOfChannels: ch, length: len, sampleRate: rate, getChannelData: (c) => data[c] };
    }
  };
  const src = { numberOfChannels: 1, length: 4, sampleRate: 44100, getChannelData: () => Float32Array.from([1, 2, 3, 4]) };
  const rev = reverseBuffer(ctx, src);
  t.eq(Array.from(rev.getChannelData(0)), [4, 3, 2, 1], 'the surface buffer runs backwards');
  t.eq(rev.sampleRate, 44100, 'reversing keeps the sample rate, so half speed is the playbackRate');

  /* ---------- createAudio, before any gesture ---------- */
  const store = fakeStore({ [KEY_ON]: 'on', [KEY_BED]: '0.15', [KEY_SFX]: '0.6' });
  const state = { t: 0, era: 1, log: [], nodes: {}, nodeOrder: [], edges: [], eras: {} };
  const sim = { state: state };
  const a = createAudio({ sim: sim, world: null, doc: fakeDoc(), win: {}, store: store, base: '../assets/' });
  t.eq(a.started, false, 'audio is silent until start');
  t.eq(a.ctx, null, 'no AudioContext exists before the first gesture');
  t.eq(a.music, true, 'the persisted music choice is read at boot');
  t.eq(a.vol.bed, 0.15, 'the bed level comes from the v3 key');
  t.eq(a.vol.sfx, 0.6, 'the sfx level comes from the v3 key');
  t.eq(a.vol.voices, 0.15, 'the voices knob defaults to the bed level');
  a.tick(0.016); a.sfx('buy'); a.setBed(3); a.rupture();
  t.eq(a.started, false, 'driving the api before start stays silent');
  t.eq(a.start(), false, 'start reports failure when the runtime has no AudioContext');

  const v = a.setVol({ bed: 0.2, voices: 0.1, sfx: 0.3 });
  t.eq(v, { bed: 0.2, voices: 0.1, sfx: 0.3 }, 'setVol returns the three knobs');
  t.eq(store.map[KEY_BED], '0.2', 'the bed knob persists under the v3 key');
  t.eq(store.map[KEY_SFX], '0.3', 'the sfx knob persists under the v3 key');
  t.eq(store.map[KEY_VOICES], '0.1', 'the voices knob persists under its own key');
  a.setVol({ bed: 5, voices: -2 });
  t.eq(a.vol.bed, 1, 'a knob is clamped at 1');
  t.eq(a.vol.voices, 0, 'a knob is clamped at 0');
  t.eq(a.setMusic(false), false, 'the rail toggle turns music off');
  t.eq(store.map[KEY_ON], 'off', 'the music toggle persists under the v3 key');
  t.eq(a.setMusic(true), true, 'the rail toggle turns music back on');
  t.eq(store.map[KEY_ON], 'on', 'the music toggle persists on');
  t.eq(KEY_ON, 'emergence_v3_music', 'the music key is the one v3 and v4 wrote');
  t.eq(KEY_BED, 'emergence_v3_musvol', 'the bed key is the one v3 and v4 wrote');
  t.eq(KEY_SFX, 'emergence_v3_sfxvol', 'the sfx key is the one v3 and v4 wrote');

  const info = a.info();
  t.eq(info.ctx, 'none', 'info reports no context before start');
  t.eq(info.voices.length, 0, 'no voices exist before start');
  t.ok(info.bpm >= AUDIO.bpmMin, 'the tempo starts at the floor');

  /* ---------- every sfx profile stays under the ceiling ---------- */
  let loud = 0;
  for (const era of Object.keys(SFX_PROFILE)) {
    for (const kind of Object.keys(SFX_PROFILE[era])) {
      const p = SFX_PROFILE[era][kind];
      if (p.g > AUDIO.masterMax) loud++;
      t.ok(p.f0 > 0 && p.dur > 0, 'sfx ' + era + '.' + kind + ' has a real pitch and length');
    }
  }
  t.eq(loud, 0, 'no sfx profile passes the 0.2 gain ceiling');
}
