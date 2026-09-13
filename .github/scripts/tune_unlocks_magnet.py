from pathlib import Path

repo = Path('.')
game = repo / 'game.js'
index = repo / 'index.html'

s = game.read_text(encoding='utf-8')

def rep(old, new, label):
    global s
    if old not in s:
        raise SystemExit(f'missing target: {label}')
    s = s.replace(old, new, 1)

rep(
"""      price:300, unlockBest:2000, unlockRuns:3, maxLevel:5,""",
"""      price:300, unlockBest:3500, unlockRuns:3, maxLevel:5,""",
'roar unlock')
rep(
"""      price:500, unlockBest:5000, unlockRuns:8, maxLevel:5,""",
"""      price:500, unlockBest:7500, unlockRuns:8, maxLevel:5,""",
'slow unlock')
rep(
"""      price:750, unlockBest:8000, unlockRuns:15, maxLevel:5,""",
"""      price:750, unlockBest:13000, unlockRuns:15, maxLevel:5,""",
'wing unlock')

old = """        const radius = coinPull ? (player.magnet > 0 ? 250 : 205) : 120;
        const pull = coinPull ? 6.0 : 5.0;
        if (dd < radius) {
          o.x += dx * dt * pull;
          o.y += dy * dt * pull;
        }
"""
new = """        const magnetActive = player.magnet > 0;
        const radius = coinPull ? (magnetActive ? 340 : 205) : 120;
        const pull = coinPull ? (magnetActive ? 11.5 : 6.0) : 5.0;
        if (dd < radius) {
          // Coins that have already passed Tiranon get an extra horizontal
          // catch-up boost so they do not trail behind until they disappear.
          const behindBoost = magnetActive && cx < px ? 1.7 : 1;
          o.x += dx * dt * pull * behindBoost;
          o.y += dy * dt * pull;
        }
"""
rep(old, new, 'magnet pull')

game.write_text(s, encoding='utf-8')

h = index.read_text(encoding='utf-8')
if '20260913-2155' not in h:
    raise SystemExit('missing cache version')
h = h.replace('20260913-2155', '20260913-2228')
index.write_text(h, encoding='utf-8')
