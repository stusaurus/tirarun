from pathlib import Path

game = Path('game.js')
s = game.read_text(encoding='utf-8')

def rep(old, new, label):
    global s
    if old not in s:
        raise SystemExit(f'missing target: {label}')
    s = s.replace(old, new, 1)

rep("""  let eventBanner = '';
  let eventBannerTimer = 0;
""", """  let eventBanner = '';
  let eventBannerTimer = 0;
  let rushWarpTimer = 0;
  const RUSH_WARP_DURATION = .48;
""", 'warp state')

rep("""    eventBanner = '';
    eventBannerTimer = 0;
    Object.assign(player, {
""", """    eventBanner = '';
    eventBannerTimer = 0;
    rushWarpTimer = 0;
    Object.assign(player, {
""", 'warp reset')

rep("""      nextPattern = distance + W + 300;
      flash = 0;
      popText('栗ラッシュ！ 準備！', W*.5, H*.32, '#ffd08a', 1.0, 22);
      beep(250, .13, 'sawtooth', .04);
""", """      nextPattern = distance + W + 300;
      flash = 0;
      rushWarpTimer = RUSH_WARP_DURATION;
      popText('栗ラッシュ！ 準備！', W*.5, H*.32, '#dff8ff', .9, 22);
      beep(390, .08, 'sine', .035);
      setTimeout(() => beep(760, .11, 'sine', .028), 65);
""", 'start warp')

rep("""    if (comboTimer > 0) {
      comboTimer -= dt;
      if (comboTimer <= 0) resetCombo();
    }
    updateEvents(dt);
""", """    if (comboTimer > 0) {
      comboTimer -= dt;
      if (comboTimer <= 0) resetCombo();
    }
    rushWarpTimer = Math.max(0, rushWarpTimer - dt);
    updateEvents(dt);
""", 'warp timer update')

anchor = "  function drawEventAtmosphere() {\n"
warp_fn = r'''  function drawRushWarpEffect() {
    if (rushWarpTimer <= 0) return;
    const p = 1 - rushWarpTimer / RUSH_WARP_DURATION;
    const strength = Math.sin(Math.PI * Math.min(1, p));
    const cx = player.x + player.w * .52;
    const cy = player.y + player.h * .48;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const wash = ctx.createRadialGradient(cx, cy, 8, cx, cy, Math.max(W, H) * .75);
    wash.addColorStop(0, `rgba(232,255,255,${.22 * strength})`);
    wash.addColorStop(.34, `rgba(104,226,255,${.16 * strength})`);
    wash.addColorStop(1, `rgba(88,112,255,${.035 * strength})`);
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, W, H);

    ctx.lineCap = 'round';
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + p * .7;
      const r1 = 54 + ((i * 23 + p * 250) % 125);
      const r2 = r1 + 78 + strength * 70;
      const rgb = i % 2 ? '168,245,255' : '210,228,255';
      ctx.strokeStyle = `rgba(${rgb},${.16 + .25 * strength})`;
      ctx.lineWidth = 1.5 + (i % 3) * .7;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * .62);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2 * .62);
      ctx.stroke();
    }

    for (let i = 0; i < 3; i++) {
      const q = (p + i * .22) % 1;
      const radius = 24 + q * 115;
      ctx.strokeStyle = `rgba(202,250,255,${(1-q) * .36 * strength})`;
      ctx.lineWidth = 3 - q * 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius, radius * .55, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    const spriteName = player.y + player.h < groundY - 2
      ? 'jump'
      : Math.floor(player.runT * 2.2) % 2 ? 'run1' : 'run2';
    const visualSize = player.w * 1.68;
    for (let i = 2; i >= 1; i--) {
      ctx.globalAlpha = (.13 + i * .045) * strength;
      drawSprite(
        spriteName,
        player.x - visualSize * .10 - i * (18 + strength * 8),
        player.y + player.h - visualSize,
        visualSize,
        visualSize
      );
    }

    ctx.globalAlpha = .75 * strength;
    ctx.fillStyle = '#ecfeff';
    ctx.font = '900 18px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#58d9ff';
    ctx.shadowBlur = 10;
    ctx.fillText('WARP!', W * .5, H * .29 - p * 10);
    ctx.restore();
  }

'''
if anchor not in s:
    raise SystemExit('missing drawEventAtmosphere anchor')
s = s.replace(anchor, warp_fn + anchor, 1)

rep("""    drawPickupEffects();
    drawPlayer();

    for (const p of particles) {
""", """    drawPickupEffects();
    drawPlayer();
    drawRushWarpEffect();

    for (const p of particles) {
""", 'draw warp')

game.write_text(s, encoding='utf-8')

index = Path('index.html')
h = index.read_text(encoding='utf-8')
if '20260913-1538' not in h:
    raise SystemExit('missing cache version')
h = h.replace('20260913-1538', '20260913-1545')
index.write_text(h, encoding='utf-8')
