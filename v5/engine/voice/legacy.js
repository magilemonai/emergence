// engine/voice/legacy.js — what run 2 says on the era cards (SPEC The turn §6: the cards are subtly wrong).
export default {
  remembers: (name) => String(name || 'it') + ' remembers',
  run: (n) => 'run ' + (n || 2)
};
