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
"""    const feverBefore = player.fever;\n    player.runT += dt * sp / 95;\n""",
"""    const feverBefore = player.fever;\n    const magnetBefore = player.magnet;\n    const giantBefore = player.giant;\n    const slowBefore = player.timeSlow;\n    const wingBefore = player.wing;\n    player.runT += dt * sp / 95;\n""",
'power timers before')

rep(
"""    player.invincible = Math.max(0, player.invincible - dt);\n    if (feverBefore > 0 && player.fever <= 0) {\n""",
"""    player.invincible = Math.max(0, player.invincible - dt);\n    if (magnetBefore > 0 && player.magnet <= 0) endPowerEffect('magnet');\n    if (giantBefore > 0 && player.giant <= 0) endPowerEffect('giant');\n    if (slowBefore > 0 && player.timeSlow <= 0) endPowerEffect('slow');\n    if (wingBefore > 0 && player.wing <= 0) endPowerEffect('wing');\n    if (feverBefore > 0 && player.fever <= 0) {\n      endPowerEffect('fever');\n""",
'power end triggers')

rep(
"""  function collectItem(o) {\n    scoreFloat += 15 * comboMultiplier();\n    score = Math.floor(scoreFloat);\n""",
"""  function collectItem(o) {\n    scoreFloat += 15 * comboMultiplier();\n    score = Math.floor(scoreFloat);\n    announceItemPickup(o.item);\n""",
'pickup announce')

rep(
"""      pickupPop(o, '#a7e9ff');\n      popText('TIME SLOW!', player.x + player.w*.7, player.y - 12, '#d8f7ff', .85, 18);\n      burst(o.x + o.w/2, o.y + o.h/2, '#a7e9ff', 16, 135);\n""",
"""      pickupPop(o, '#a7e9ff');\n      burst(o.x + o.w/2, o.y + o.h/2, '#a7e9ff', 16, 135);\n""",
'remove duplicate slow popup')

rep(
"""      pickupPop(o, '#f3e9ff');\n      popText('ふわっ！', player.x + player.w*.7, player.y - 12, '#fff0ff', .85, 18);\n      burst(o.x + o.w/2, o.y + o.h/2, '#ead9ff', 16, 130);\n""",
"""      pickupPop(o, '#f3e9ff');\n      burst(o.x + o.w/2, o.y + o.h/2, '#ead9ff', 16, 130);\n""",
'remove duplicate wing popup')

anchor = """  function drawFeverEffect() {\n"""
insert = r'''  function announceItemPickup(id) {
    const labels = {
      shield:['SHIELD!','#dff8ff'],
      magnet:['MAGNET!','#bfefff'],
      giant:['GIANT!','#ffe0a3'],
      slow:['TIME SLOW!','#d8f7ff'],
      wing:['WING!','#f5e9ff']
    };
    const data = labels[id];
    if (!data) return;
    popText(data[0], W*.5, H*.35, data[1], .8, 20);
    flash = Math.max(flash, .035);
    shake = Math.max(shake, id === 'giant' ? 3.2 : 1.8);
  }

  function endPowerEffect(id) {
    const colors = {
      magnet:'#75dcff', giant:'#ffc86a', slow:'#8ee8ff', wing:'#ead9ff', fever:'#ffd45c'
    };
    const color = colors[id] || '#ffffff';
    burst(player.x + player.w*.5, player.y + player.h*.5, color, id === 'fever' ? 16 : 9, id === 'fever' ? 145 : 95);
  }

  function drawActivePowerEffectsBehind() {
    const t = performance.now() * .001;
    const cx = player.x + player.w*.5;
    const cy = player.y + player.h*.48;

    if (player.timeSlow > 0) {
      const warn = player.timeSlow < 1.25 ? (.35 + .65*Math.abs(Math.sin(t*10))) : 1;
      ctx.save();
      ctx.strokeStyle = `rgba(120,225,255,${.16*warn})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(5, 5, W-10, H-10);
      for (let i=0;i<2;i++) {
        ctx.strokeStyle = `rgba(150,235,255,${(.17-i*.05)*warn})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 42+i*13 + Math.sin(t*3+i)*3, -1.2+t*.18, 1.8+t*.18);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (player.giant > 0) {
      const warn = player.giant < 1.25 ? (.35 + .65*Math.abs(Math.sin(t*10))) : 1;
      ctx.save();
      const g = ctx.createRadialGradient(cx, cy, 8, cx, cy, player.w*.95);
      g.addColorStop(0, `rgba(255,213,126,${.16*warn})`);
      g.addColorStop(1, 'rgba(255,185,82,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx,cy,player.w*.95,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    if (player.wing > 0) {
      const warn = player.wing < 1.25 ? (.35 + .65*Math.abs(Math.sin(t*10))) : 1;
      ctx.save();
      ctx.strokeStyle = `rgba(245,235,255,${.55*warn})`;
      ctx.lineWidth = 2;
      for (let i=0;i<4;i++) {
        const q = (t*1.7 + i*.27) % 1;
        const x = player.x - 10 - q*52;
        const y = cy + Math.sin(t*5+i)*10 + (i-1.5)*5;
        ctx.beginPath();
        ctx.moveTo(x,y);
        ctx.quadraticCurveTo(x-8,y-5,x-13,y+2);
        ctx.quadraticCurveTo(x-6,y+5,x,y);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (player.magnet > 0) {
      const warn = player.magnet < 1.25 ? (.35 + .65*Math.abs(Math.sin(t*10))) : 1;
      ctx.save();
      let shown = 0;
      for (const o of objects) {
        if (o.type !== 'coin' || shown >= 10) continue;
        const ox = o.x + o.w/2;
        const oy = o.y + o.h/2;
        const d = Math.hypot(cx-ox, cy-oy);
        if (d > 370) continue;
        const a = Math.max(.08, (1-d/370)*.48) * warn;
        ctx.strokeStyle = `rgba(94,214,255,${a})`;
        ctx.lineWidth = 1.5 + (1-d/370)*1.5;
        ctx.beginPath();
        ctx.moveTo(ox,oy);
        const mx=(ox+cx)/2, my=(oy+cy)/2-18;
        ctx.quadraticCurveTo(mx,my,cx,cy);
        ctx.stroke();
        shown++;
      }
      for (let i=0;i<2;i++) {
        const r = player.w*.72 + i*10 + Math.sin(t*6+i)*3;
        ctx.strokeStyle = `rgba(100,221,255,${(.35-i*.10)*warn})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx,cy,r,t*1.8+i, t*1.8+i+Math.PI*1.45);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawActivePowerEffectsFront() {
    const t = performance.now() * .001;
    const cx = player.x + player.w*.5;
    const cy = player.y + player.h*.48;

    if (player.shield) {
      ctx.save();
      const r = player.w*.70 + 8 + Math.sin(t*4)*2;
      ctx.fillStyle = 'rgba(142,232,255,.08)';
      ctx.strokeStyle = 'rgba(154,238,255,.72)';
      ctx.lineWidth = 2.3;
      ctx.shadowColor = '#8de8ff';
      ctx.shadowBlur = 9;
      ctx.beginPath();
      ctx.arc(cx,cy,r,0,Math.PI*2);
      ctx.fill();
      ctx.stroke();
      for (let i=0;i<3;i++) {
        const a = t*1.8 + i*Math.PI*2/3;
        ctx.fillStyle = 'rgba(220,251,255,.9)';
        ctx.beginPath();
        ctx.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r,2.3,0,Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (player.magnet > 0) {
      const warn = player.magnet < 1.25 ? (.35 + .65*Math.abs(Math.sin(t*10))) : 1;
      ctx.save();
      for (let i=0;i<4;i++) {
        const a=t*2.6+i*Math.PI/2;
        const r=player.w*.58+7;
        ctx.fillStyle=`rgba(167,238,255,${.72*warn})`;
        ctx.beginPath();
        ctx.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r,2.2,0,Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (player.giant > 0) {
      ctx.save();
      ctx.fillStyle='rgba(178,118,57,.24)';
      for (let i=0;i<4;i++) {
        const q=(t*2+i*.23)%1;
        ctx.beginPath();
        ctx.ellipse(player.x+player.w*.35-q*24, player.y+player.h+2-q*8, 8*(1-q)+2, 3*(1-q)+1, 0, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawFeverExtraEffect() {
    if (player.fever <= 0) return;
    const t = performance.now()*.001;
    const warn = player.fever < 1.35 ? (.3 + .7*Math.abs(Math.sin(t*11))) : 1;
    const cx=player.x+player.w*.48;
    const cy=player.y+player.h*.48;
    ctx.save();
    ctx.lineCap='round';
    for (let i=0;i<7;i++) {
      const y=cy-24+i*8+Math.sin(t*8+i)*2;
      const len=28+(i%3)*10+Math.sin(t*9+i)*5;
      ctx.strokeStyle=`rgba(255,205,75,${(.25+(i%2)*.09)*warn})`;
      ctx.lineWidth=2+(i%2);
      ctx.beginPath();
      ctx.moveTo(cx-12,y);
      ctx.lineTo(cx-12-len,y+2);
      ctx.stroke();
    }
    for (let i=0;i<5;i++) {
      const a=t*3.2+i*Math.PI*2/5;
      const r=player.w*.72+8+Math.sin(t*5+i)*4;
      ctx.fillStyle=`rgba(255,232,120,${.78*warn})`;
      ctx.beginPath();
      ctx.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.72,2.3+(i%2),0,Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

'''
if anchor not in s:
    raise SystemExit('missing fever anchor')
s = s.replace(anchor, insert + anchor, 1)

rep(
"""    drawPickupEffects();\n    drawPlayer();\n    drawLoadoutCosmetics();\n    drawFeverEffect();\n    drawRoarEffect();\n    drawRushWarpEffect();\n""",
"""    drawPickupEffects();\n    drawActivePowerEffectsBehind();\n    drawPlayer();\n    drawLoadoutCosmetics();\n    drawActivePowerEffectsFront();\n    drawFeverEffect();\n    drawFeverExtraEffect();\n    drawRoarEffect();\n    drawRushWarpEffect();\n""",
'draw effect sequence')

game.write_text(s, encoding='utf-8')

h = index.read_text(encoding='utf-8')
if '20260913-2228' not in h:
    raise SystemExit('missing cache version')
h = h.replace('20260913-2228', '20260913-2245')
index.write_text(h, encoding='utf-8')
