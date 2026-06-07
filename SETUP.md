# Running EMERGENCE in Claude Code (macOS)

A start-to-finish guide to get this project running locally with Claude Code on your
MacBook. Assumes you're starting from zero.

---

## 1. Make the project folder

Put the two files (`emergence.html` and `HANDOFF.md`) plus this guide in one folder. For
example:

```bash
mkdir -p ~/projects/emergence
cd ~/projects/emergence
# move the downloaded emergence.html and HANDOFF.md into this folder
```

(Optional but recommended) make it a git repo so you can revert balance experiments:

```bash
git init
git add .
git commit -m "Initial prototype: four-era scaffold"
```

This matters more than it sounds. You'll be changing numbers and playtesting constantly,
and `git stash` / `git checkout .` lets you throw away a bad tuning pass instantly.

---

## 2. Install Claude Code

The **native installer** is Anthropic's recommended method. It needs no Node.js and
auto-updates in the background. In Terminal:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Then restart your terminal (or run `source ~/.zshrc`) so the `claude` command is on your
PATH. Verify:

```bash
claude --version
claude doctor    # checks your install and reports any issues
```

If `claude` isn't found after reinstalling your shell, the installer puts the binary in
`~/.local/bin` — make sure that's in your PATH.

> Alternative (only if you specifically want npm-managed, e.g. version pinning):
> requires Node.js 18+, then `npm install -g @anthropic-ai/claude-code`. Do NOT use
> `sudo` with it; if you hit permission errors, use nvm instead. The native installer
> above avoids all of this.

---

## 3. Authenticate

You need a paid Anthropic plan (Claude Pro or Max) or Console API credits — Claude Code
is not on the free tier. First launch will prompt you to sign in:

```bash
cd ~/projects/emergence
claude
```

A browser window opens for a one-time OAuth login. Follow the prompts.

---

## 4. Start the session the right way

From inside the project folder, launch Claude Code and **point it at the handoff doc
first** so it loads all the design context before doing anything:

```
> Read HANDOFF.md and emergence.html. Don't change anything yet — just confirm you
  understand the design principles, the four-era structure, and where the tunable
  numbers live. Then tell me what you'd suggest as the first task.
```

This primes Claude Code with the full picture. It'll point you at the pacing-tuning work
(the #1 known gap).

### Optional: make the context persistent
Claude Code auto-loads a file named `CLAUDE.md` in the project root on every session. If
you want the handoff context loaded automatically each time, either rename or symlink it:

```bash
ln -s HANDOFF.md CLAUDE.md
```

Or run `/init` inside Claude Code to have it generate a fresh `CLAUDE.md` summarizing the
project. (Keeping HANDOFF.md as the source of truth and symlinking is cleaner.)

---

## 5. The playtest loop

The core dev rhythm for this project:

1. Open `emergence.html` in your browser (just double-click it, or `open emergence.html`
   from Terminal).
2. Play from a cold start. Watch the clock. Note where it drags or dumps too fast.
3. Tell Claude Code what you felt: "Era 2 took 4 minutes to unlock, too slow" or
   "Capability dumps so fast Era 4 opens instantly."
4. Claude Code adjusts `CFG` numbers, states the before/after.
5. Reload the browser tab. Re-play. Repeat.

Keep changes small and one at a time so each is easy to judge and revert.

> Tip: add `?dev=1` handling or a debug speed multiplier early if you get tired of
> clicking through the opening on every test. Ask Claude Code to add a dev-only fast-
> forward toggle — it'll save you a lot of time during balancing.

---

## 6. Useful Claude Code commands

- `claude` — start a session in the current folder
- `/init` — generate a CLAUDE.md project context file
- `/clear` — reset the conversation context (use between unrelated tasks)
- `claude doctor` — diagnose install/config issues
- `claude update` — force an update (native installer also auto-updates)

---

## First-session checklist

- [ ] Files in one folder, git initialized
- [ ] `claude --version` works
- [ ] Authenticated (browser OAuth done)
- [ ] Launched `claude` from the project folder
- [ ] Had it read HANDOFF.md + emergence.html before any edits
- [ ] Opened emergence.html in a browser and played the cold open
- [ ] Picked the first task (suggest: pacing tune, or add a dev fast-forward toggle first)
