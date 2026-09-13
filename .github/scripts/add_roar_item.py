from pathlib import Path

game = Path('game.js')
s = game.read_text(encoding='utf-8')

def rep(old, new, label):
    global s
    if old not in s:
        raise SystemExit(f'missing target: {label}')
    s = s.replace(old, new, 1)

rep(
"""  let rushWarpTimer = 0;
  const RUSH_WARP_DURATION = .95;
""",
"""  let rushWarpTimer = 0;
  let roarFx = 0;
  let roarIntroduced = false;
  const RUSH_WARP_DURATION = .95;
  const ROAR_FX_DURATION = .65;
""",
'roar state')

rep(
"""    rushWarpTimer = 0;
    Object.assign(player, {
""",
"""    rushWarpTimer = 0;
    roarFx = 0;
    roarIntroduced = false;
    Object.assign(player, {
""",
'roar reset')

rep(
"""    if (Math.random() < .095) {
      const q = Math.random();
      addItem(
        x + 95 + Math.random() * 70,
        groundY - (125 + Math.random() * 90),
        q < .45 ? 'shield' : q < .75 ? 'magnet' : 'giant'
      );
    }

    nextPattern += 365 + Math.random() * 190;
""",
"""    if (!roarIntroduced && distance > 2400) {
      addItem(x + 68, groundY - 118, 'roar');
      roarIntroduced = true;
    } else if (Math.random() < .035) {
      addItem(x + 70 + Math.random() * 90, groundY - (105 + Math.random() * 65), 'roar');
    }

    if (Math.random() < .095) {
      const q = Math.random();
      addItem(
        x + 95 + Math.random() * 70,
        groundY - (125 + Math.random() * 90),
        q < .45 ? 'shield' : q < .75 ? 'magnet' : 'giant'
      );
    }

    nextPattern += 365 + Math.random() * 190;
""",
'roar spawn')

rep(
"""    rushWarpTimer = Math.max(0, rushWarpTimer - dt);
    updateEvents(dt);
""",
"""    rushWarpTimer = Math.max(0, rushWarpTimer - dt);
    roarFx = Math.max(0, roarFx - dt);
    updateEvents(dt);
""",
'roar timer')

rep(
"""    if (o.item === 'giant') {
      player.giant = 6;
      pickupPop(o, '#ffd27a');
      beep(250, .14, 'square', .04);
      burst(o.x + o.w/2, o.y + o.h/2, '#ffd27a', 18, 165);
    }
  }
""",
"""    if (o.item === 'giant') {
      player.giant = 6;
      pickupPop(o, '#ffd27a');
      beep(250, .14, 'square', .04);
      burst(o.x + o.w/2, o.y + o.h/2, '#ffd27a', 18, 165);
    }
    if (o.item === 'roar') {
      roarFx = ROAR_FX_DURATION;
      let blasted = 0;
      for (const target of objects) {
        if (target.type !== 'kuri') continue;
        if (target.x < player.x - 45 || target.x > W + 160) continue;
        target.type = 'cleared';
        blasted++;
        burst(target.x + target.w/2, target.y + target.h/2, '#ffb45f', 11, 185);
      }
      const gain = blasted * 35;
      scoreFloat += gain;
      score = Math.floor(scoreFloat);
      shake = Math.max(shake, 5);
      flash = Math.max(flash, .07);
      burst(player.x + player.w*.72, player.y + player.h*.38, '#ffe29a', 18, 185);
      popText(blasted ? `ガオーー！ 栗${blasted}個！ +${gain}` : 'ガオーー！', W*.5, H*.34, '#ffe09a', 1.0, 23);
      beep(150, .16, 'sawtooth', .045);
      setTimeout(() => beep(260, .12, 'square', .03), 80);
    }
  }
""",
'roar collect')

rep(
"""  function drawRushWarpEffect() {
""",
"""  function drawRoarEffect() {
    if (roarFx <= 0) return;
    const p = 1 - roarFx / ROAR_FX_DURATION;
    const cx = player.x + player.w*.58;
    const cy = player.y + player.h*.42;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i=0; i<3; i++) {
      const q = Math.min(1, p + i*.12);
      const r = 28 + q * Math.max(W, H) * .48;
      ctx.strokeStyle = `rgba(255,220,135,${(1-q)*.52})`;
      ctx.lineWidth = 8 - q*5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, -.55, .55);
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(255,183,82,${(1-p)*.08})`;
    ctx.fillRect(0,0,W,H);
    ctx.restore();
  }

  function drawRushWarpEffect() {
""",
'roar draw function')

rep(
"""          drawBubble(
            o,
            o.item==='shield'?'S':o.item==='magnet'?'M':'G',
            o.item==='shield'?'#bfeeff':o.item==='magnet'?'#ffd0d0':'#c9f2a9'
          );
""",
"""          drawBubble(
            o,
            o.item==='shield'?'S':o.item==='magnet'?'M':o.item==='giant'?'G':'ガオ',
            o.item==='shield'?'#bfeeff':o.item==='magnet'?'#ffd0d0':o.item==='giant'?'#c9f2a9':'#ffd8a8'
          );
""",
'roar item rendering')

rep(
"""    drawPickupEffects();
    drawPlayer();
    drawRushWarpEffect();
""",
"""    drawPickupEffects();
    drawPlayer();
    drawRoarEffect();
    drawRushWarpEffect();
""",
'roar draw call')

game.write_text(s, encoding='utf-8')

index = Path('index.html')
h = index.read_text(encoding='utf-8')
if '20260913-1700' not in h:
    raise SystemExit('missing cache version')
h = h.replace('20260913-1700', '20260913-1855')
index.write_text(h, encoding='utf-8')
