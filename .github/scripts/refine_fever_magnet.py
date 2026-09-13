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
"magnet: {name:'マグネット', icon:'🧲', desc:'近くのアイテムを引き寄せる', basic:true, maxLevel:1},",
"magnet: {name:'マグネット', icon:'🧲', desc:'近くのコインだけを引き寄せる', basic:true, maxLevel:1},",
'magnet description')

old_attract = """    if (player.magnet > 0 || player.fever > 0 || eventMode === 'bonus') {
      for (const o of objects) {
        if (o.type !== 'letter' && o.type !== 'item' && o.type !== 'bonus' && o.type !== 'coin') continue;
        if (o.type === 'bonus' && o.premium && eventMode === 'bonus' && player.magnet <= 0 && player.fever <= 0) continue;
        const cx = o.x + o.w / 2;
        const cy = o.y + o.h / 2;
        const px = player.x + player.w / 2;
        const py = player.y + player.h / 2;
        const dx = px - cx;
        const dy = py - cy;
        const dd = Math.hypot(dx, dy);
        const radius = eventMode === 'bonus' && player.magnet <= 0 && player.fever <= 0 ? 120 : 230;
        if (dd < radius) {
          o.x += dx * dt * 5.3;
          o.y += dy * dt * 5.3;
        }
      }
    }
"""
new_attract = """    // Magnet is intentionally a coin-only powerup. FEVER also vacuums coins,
    // while BONUS RUN keeps only its normal (non-premium) star assist.
    if (player.magnet > 0 || player.fever > 0 || eventMode === 'bonus') {
      for (const o of objects) {
        const coinPull = o.type === 'coin' && (player.magnet > 0 || player.fever > 0);
        const bonusAssist = o.type === 'bonus' && !o.premium && eventMode === 'bonus';
        if (!coinPull && !bonusAssist) continue;
        const cx = o.x + o.w / 2;
        const cy = o.y + o.h / 2;
        const px = player.x + player.w / 2;
        const py = player.y + player.h / 2;
        const dx = px - cx;
        const dy = py - cy;
        const dd = Math.hypot(dx, dy);
        const radius = coinPull ? (player.magnet > 0 ? 250 : 205) : 120;
        const pull = coinPull ? 6.0 : 5.0;
        if (dd < radius) {
          o.x += dx * dt * pull;
          o.y += dy * dt * pull;
        }
      }
    }
"""
rep(old_attract, new_attract, 'attraction logic')

rep(
"""      player.fever = 8;
      player.magnet = Math.max(player.magnet, 8);
      flash = .35;
""",
"""      player.fever = 8;
      flash = .10;
""",
'fever start')

anchor = """  function drawEventAtmosphere() {
"""
fever_fn = """  function drawFeverEffect() {
    if (player.fever <= 0) return;
    const t = performance.now() * .001;
    const pulse = .5 + .5 * Math.sin(t * 8.5);
    const cx = player.x + player.w * .5;
    const cy = player.y + player.h * .48;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const halo = ctx.createRadialGradient(cx, cy, 5, cx, cy, 62 + pulse * 8);
    halo.addColorStop(0, `rgba(255,247,174,${.30 + pulse*.08})`);
    halo.addColorStop(.45, `rgba(255,176,58,${.15 + pulse*.05})`);
    halo.addColorStop(1, 'rgba(255,128,40,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, 70 + pulse * 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const y = cy - 27 + i * 10 + Math.sin(t * 7 + i) * 3;
      const len = 34 + (i % 3) * 11 + pulse * 8;
      ctx.strokeStyle = `rgba(255,206,74,${.22 + (i%2)*.08})`;
      ctx.lineWidth = 2 + (i % 2);
      ctx.beginPath();
      ctx.moveTo(player.x - 7, y);
      ctx.lineTo(player.x - len, y + 2);
      ctx.stroke();
    }

    for (let i = 0; i < 7; i++) {
      const a = t * (1.7 + i*.05) + i * .9;
      const r = 30 + (i % 3) * 8;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a * 1.15) * r * .62;
      ctx.fillStyle = i % 2 ? '#fff0a0' : '#ffb33e';
      ctx.globalAlpha = .48 + .20 * pulse;
      ctx.beginPath();
      ctx.arc(x, y, 2.2 + (i%2), 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    const label = `🔥 FEVER ×3  ${player.fever.toFixed(1)}`;
    ctx.font = '900 17px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = Math.min(205, ctx.measureText(label).width + 34);
    ctx.fillStyle = '#fff4c9ee';
    roundedRect(W/2-w/2, H*.165, w, 36, 16);
    ctx.fill();
    ctx.strokeStyle = '#ffc24e';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#d97916';
    ctx.fillText(label, W/2, H*.165 + 18);
    ctx.restore();
  }

"""
if anchor not in s:
    raise SystemExit('missing fever draw anchor')
s = s.replace(anchor, fever_fn + anchor, 1)

rep(
"""    drawLoadoutCosmetics();
    drawRoarEffect();
    drawRushWarpEffect();
""",
"""    drawLoadoutCosmetics();
    drawFeverEffect();
    drawRoarEffect();
    drawRushWarpEffect();
""",
'fever draw call')

rep(
"""    if(player.fever>0){
      ctx.fillStyle='#ffd64a22';ctx.fillRect(0,0,W,H);
      ctx.font='900 26px system-ui';ctx.textAlign='center';ctx.fillStyle='#ff9b2f';
      ctx.fillText('FEVER ×3',W/2,H*.19);
    }

""",
""",
'old fever overlay')

game.write_text(s, encoding='utf-8')

html = index.read_text(encoding='utf-8')
old_v = '20260913-2014'
new_v = '20260913-2032'
if old_v not in html:
    raise SystemExit('missing cache version')
index.write_text(html.replace(old_v, new_v), encoding='utf-8')
