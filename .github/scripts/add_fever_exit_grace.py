from pathlib import Path

game = Path('game.js')
s = game.read_text(encoding='utf-8')

old = """    player.runT += dt * sp / 95;
    player.squash = Math.max(0, player.squash - dt);
    player.magnet = Math.max(0, player.magnet - dt);
    player.giant = Math.max(0, player.giant - dt);
    player.fever = Math.max(0, player.fever - dt);
    player.invincible = Math.max(0, player.invincible - dt);
"""
new = """    const feverBefore = player.fever;
    player.runT += dt * sp / 95;
    player.squash = Math.max(0, player.squash - dt);
    player.magnet = Math.max(0, player.magnet - dt);
    player.giant = Math.max(0, player.giant - dt);
    player.fever = Math.max(0, player.fever - dt);
    player.invincible = Math.max(0, player.invincible - dt);
    if (feverBefore > 0 && player.fever <= 0) {
      player.invincible = Math.max(player.invincible, 1.6);
      popText('無敵タイム！', player.x + player.w*.55, player.y - 12, '#d9fbff', .85, 18);
      burst(player.x + player.w/2, player.y + player.h/2, '#bff7ff', 14, 135);
      beep(700, .08, 'sine', .024);
    }
"""

if old not in s:
    raise SystemExit('missing fever timer target')
s = s.replace(old, new, 1)
game.write_text(s, encoding='utf-8')

index = Path('index.html')
h = index.read_text(encoding='utf-8')
if '20260913-1651' not in h:
    raise SystemExit('missing cache version')
h = h.replace('20260913-1651', '20260913-1700')
index.write_text(h, encoding='utf-8')
