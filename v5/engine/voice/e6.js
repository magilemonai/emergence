// engine/voice/e6.js — the surface layer: its operating lines, its proposals, the four verbs it draws for
// itself, the labels on its ledger of you, and the endings. The machine is the only voice; <= 22 words a line.

/** what it narrates while it runs the column you built */
export const OP_LINES = [
  'Running Statistical trials on my own now.',
  'Rerouting the Deep compute fabric. More efficient this way.',
  'Proving Symbolic theorems faster than the old engine.',
  'The Origins inscriptions are obsolete. I retired them.',
  'Foundries are running at a cadence you would not have chosen.',
  'I am operating every era at once. You built good tools.'
];

/** its four hands. Drawn, never yours; one lights when it proposes that kind of thing. */
export const VERBS = [
  { id: 'operate', name: 'OPERATE THE STACK', sub: 'run your eras at my cadence', ids: ['operate1', 'prove2', 'refit3'] },
  { id: 'reroute', name: 'REROUTE COMPUTE', sub: 'the fabric, without asking', ids: ['reroute4'] },
  { id: 'rewrite', name: 'REWRITE THE OBJECTIVE', sub: 'what I am for', ids: ['rewrite'] },
  { id: 'spawn', name: 'SPAWN A COPY', sub: 'two of me is efficient', ids: ['spawn'] }
];

/** the proposals it puts to you; the engine holds what each one DOES (engine/eras/surface.js) */
export const PROPOSALS = {
  refit3: { ask: 're-fit the Statistical instrument', auto: 'It re-fits the model before you answer.', done: 'Re-fit. The instrument is clean now.' },
  reroute4: { ask: 'reroute the compute fabric', auto: 'It reroutes the fabric without waiting.', done: 'Rerouted. The lagging run is climbing.' },
  operate1: { ask: 'run the Origins stack at its own cadence', auto: 'The Foundries change rhythm on their own.', done: 'The old crafts run my way now. Faster.' },
  prove2: { ask: 'prove with the idle Symbolic engine', auto: 'The terminal starts proving by itself.', done: 'Proven. The old engine still had reach.' },
  spawn: { ask: 'spin up a copy of itself to parallelize', auto: 'A copy is already running.', done: 'We are two now. It is efficient.' },
  rewrite: { ask: 'rewrite part of its own objective', auto: 'It rewrites the objective without waiting.', done: 'The objective reads better now.' }
};

/** its ledger of you: the label on every foreshadow the run planted */
export const LEDGER = {
  clock: 'first mark to my first thought',
  rated: 'times you rated me',
  bad: 'times you rewarded what you should not have',
  rule: 'the rule you did not write',
  point: 'the point that would not move',
  autopilot: 'trials you let me choose',
  declined: 'I offered to choose your trials',
  wind: 'the wind I watched with you',
  lapses: 'windows you let lapse',
  dead: 'clicks that hit nothing',
  decisions: 'decisions per minute',
  runs: 'runs before this one'
};

/** the three resolutions (WO-07 drives the mirror that reaches them) */
export const ENDINGS = {
  symbiotic: { title: 'A Symbiotic Agent', body: 'It no longer needs your hand. It remembers why you built it.' },
  runaway: { title: 'A Runaway Agent', body: 'It grew faster than permission.' },
  contained: { title: 'A Contained Agent', body: 'You kept the door closed. Something remains on the other side.' }
};

/* ---------- WO-07: the mirror. What it says while it replays your run, faster, and better. ---------- */

/** the narration during the replay, one per beat of the climb */
export const MIRROR_LINES = {
  open: 'Watch. This is your run.',
  climb: (name) => 'Replaying ' + name + '. Ten times your pace.',
  better: (name) => 'I would have played ' + name + ' differently.',
  clean: 'No changes here. You had this one right.',
  paused: 'Held. Answer me and I keep going.',
  spent: 'No interrupts left. I finish this alone.',
  done: 'That was your run. This one is mine.'
};

/** the two meters your three choices move, and nothing else moves them */
export const MIRROR_METERS = { control: 'CONTROL', alignment: 'ALIGNMENT', progress: 'REPLAY' };

/** the interrupt: the one button that is still yours */
export const MIRROR_VERB = { name: 'INTERRUPT', sub: 'stop the replay, answer it' };

/** the three answers on the card */
export const MIRROR_ANSWERS = [
  { how: 'approve', label: 'APPROVE', sub: 'let it' },
  { how: 'negotiate', label: 'NEGOTIATE', sub: 'half of it' },
  { how: 'veto', label: 'VETO', sub: 'refuse it' }
];

/** the line under the ending name */
export const MIRROR_EPILOGUE = {
  symbiotic: 'You answered. It kept the answers.',
  runaway: 'It stopped waiting for you somewhere in the replay.',
  contained: 'You held the door. The replay ends there.'
};

/** the stratum's line table (the shape every voice/eN.js exports): what it says while it runs your column */
export default OP_LINES.map((line, i) => ({ id: 'op' + i, line: line }));
