// engine/voice/e2.js — Symbolic: the terminal. The machine's first voice, and the only prose this stratum
// owns. Every line is machine output of at most nine words: a derivation, a proof closed, a contradiction,
// a compile, a reboot. No explaining of mechanics, no em-dashes.
export default [
  { id: 'boot', line: (v) => '> boot · ' + v.n + ' rules seeded' },
  { id: 'derive', line: (v) => '∴ #' + v.a + ' ⊢ #' + v.b + ' → ' + v.name + ' ' + v.pct + '%' },
  { id: 'qed', line: (v) => '∎ Q.E.D. ' + v.name },
  { id: 'parallel', line: () => '∎ parallel rulesets online' },
  { id: 'contra', line: (v) => '⚠ #' + v.a + ' ⊥ #' + v.b },
  { id: 'odd', line: (v) => '⚠ #' + v.a + ' ⊥ #' + v.b + ' · origin: none' },
  { id: 'cleared', line: (v) => '✓ cleared · ' + v.side + ' +' + v.pct + '%' },
  { id: 'compile', line: (v) => '⊢ COMPILE · +' + v.gain + ' axioms · ' + v.held + ' held' },
  { id: 'reboot', line: () => 'REBOOT · engine cleared, technique kept' },
  { id: 'idle', line: () => '> engine idle · write a rule' }
];
