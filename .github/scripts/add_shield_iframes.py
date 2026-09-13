from pathlib import Path

game = Path('game.js')
s = game.read_text(encoding='utf-8')

def rep(old, new, label):
    global s
    if old not in s:
        raise SystemExit(f'missing target: {label}')
    s = s.replace(old, new, 1)

rep("""    shield: false, magnet: 0, giant: 0, fever: 0,
    runT: 0, squash: 0, damageUntil: 0
""", """    shield: false, invincible: 0, magnet: 0, giant: 0, fever: 0,
    runT: 0, squash: 0, damageUntil: 0
""", 'player invincible state')

rep("""      shield:false, magnet:0, giant:0, fever:0, runT:0, squash:0,
      damageUntil:0
""", """      shield:false, invincible:0, magnet:0, giant:0, fever:0, runT:0, squash:0,
      damageUntil:0
""", 'reset invincible state')

rep("""    player.giant = Math.max(0, player.giant - dt);
    player.fever = Math.max(0, player.fever - dt);
""", """    player.giant = Math.max(0, player.giant - dt);
    player.fever = Math.max(0, player.fever - dt);
    player.invincible = Math.max(0, player.invincible - dt);
""", 'invincible timer update')

rep("""      if (o.type === 'kuri' && rectHit(pbox, o, 4)) {
        if (player.giant > 0 || player.fever > 0) {
""", """      if (o.type === 'kuri' && rectHit(pbox, o, 4)) {
        if (player.invincible > 0) {
          burst(o.x + o.w/2, o.y + o.h/2, '#bff7ff', 8, 125);
          objects.splice(i, 1);
          beep(560, .035, 'sine', .016);
          continue;
        }
        if (player.giant > 0 || player.fever > 0) {
""", 'invincible collision')

rep("""        if (player.shield) {
          player.shield = false;
          resetCombo();
          flash = .16;
          shake = 6;
          burst(o.x + o.w/2, o.y + o.h/2, '#8de8ff', 14, 150);
          objects.splice(i, 1);
          beep(240, .12, 'sawtooth', .05);
          continue;
        }
""", """        if (player.shield) {
          player.shield = false;
          player.invincible = 1.25;
          resetCombo();
          flash = .12;
          shake = 6;
          burst(o.x + o.w/2, o.y + o.h/2, '#8de8ff', 18, 165);
          popText('無敵！', player.x + player.w*.55, player.y - 12, '#d9fbff', .7, 18);
          objects.splice(i, 1);
          beep(240, .10, 'sawtooth', .045);
          setTimeout(() => beep(680, .07, 'sine', .025), 70);
          continue;
        }
""", 'shield break i-frames')

rep("""    if(p.fever>0){ctx.shadowColor='#ffd33d';ctx.shadowBlur=18;}
    if(p.shield){
""", """    if(p.invincible>0){
      const blink = .58 + .42 * Math.abs(Math.sin(performance.now() * .022));
      ctx.globalAlpha = blink;
      ctx.shadowColor = '#bff7ff';
      ctx.shadowBlur = 12;
    }
    if(p.fever>0){ctx.shadowColor='#ffd33d';ctx.shadowBlur=18;}
    if(p.shield){
""", 'invincible blink')

game.write_text(s, encoding='utf-8')

index = Path('index.html')
h = index.read_text(encoding='utf-8')
if '20260913-1638' not in h:
    raise SystemExit('missing cache version')
h = h.replace('20260913-1638', '20260913-1651')
index.write_text(h, encoding='utf-8')
