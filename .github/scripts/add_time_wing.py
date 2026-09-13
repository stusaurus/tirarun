from pathlib import Path


game = Path('game.js')
index = Path('index.html')
style = Path('style.css')
s = game.read_text(encoding='utf-8')


def rep(old, new, label):
    global s
    if old not in s:
        raise SystemExit(f'missing target: {label}')
    s = s.replace(old, new, 1)


rep(
"""  const feverBuff = document.getElementById('feverBuff');
  const coinHudEl = document.getElementById('coinHud');
""",
"""  const feverBuff = document.getElementById('feverBuff');
  const timeBuff = document.getElementById('timeBuff');
  const wingBuff = document.getElementById('wingBuff');
  const coinHudEl = document.getElementById('coinHud');
""",
'new buff refs')

rep(
"""  let owned = readJson(LS_OWNED, {shield:true, magnet:true, giant:true, roar:false});
  let levels = readJson(LS_LEVELS, {shield:1, magnet:1, giant:1, roar:0});
""",
"""  let owned = readJson(LS_OWNED, {shield:true, magnet:true, giant:true, roar:false, slow:false, wing:false});
  let levels = readJson(LS_LEVELS, {shield:1, magnet:1, giant:1, roar:0, slow:0, wing:0});
""",
'progress defaults')

rep(
"""    roar: {
      name:'ガオー！', icon:'🗣️', desc:'咆哮で前方の栗をまとめて吹き飛ばす',
      price:300, unlockBest:2000, unlockRuns:3, maxLevel:5,
      upgradeCosts:[180,400,800,1400]
    }
  };

  owned = Object.assign({shield:true, magnet:true, giant:true, roar:false}, owned || {});
  owned.shield = owned.magnet = owned.giant = true;
  levels = Object.assign({shield:1, magnet:1, giant:1, roar:0}, levels || {});
""",
"""    roar: {
      name:'ガオー！', icon:'🗣️', desc:'咆哮で前方の栗をまとめて吹き飛ばす',
      price:300, unlockBest:2000, unlockRuns:3, maxLevel:5,
      upgradeCosts:[180,400,800,1400]
    },
    slow: {
      name:'タイムどんぐり', icon:'⏳', desc:'数秒間、栗とステージの流れをスローにする',
      price:500, unlockBest:5000, unlockRuns:8, maxLevel:5,
      upgradeCosts:[300,650,1200,2000]
    },
    wing: {
      name:'プテランの羽', icon:'🪽', desc:'一定時間ふわっと浮いて、落下をゆっくりにする',
      price:750, unlockBest:8000, unlockRuns:15, maxLevel:5,
      upgradeCosts:[420,850,1500,2400]
    }
  };

  owned = Object.assign({shield:true, magnet:true, giant:true, roar:false, slow:false, wing:false}, owned || {});
  owned.shield = owned.magnet = owned.giant = true;
  levels = Object.assign({shield:1, magnet:1, giant:1, roar:0, slow:0, wing:0}, levels || {});
""",
'catalog and merged defaults')

rep(
"""    const roarWasUnlocked = isItemUnlocked('roar');
    const newBest = score > best;
""",
"""    const unlockBefore = new Set(
      Object.keys(ITEM_CATALOG).filter(id => !ITEM_CATALOG[id].basic && isItemUnlocked(id))
    );
    const newBest = score > best;
""",
'unlock snapshot')

rep(
"""    saveProgress();
    const roarNowUnlocked = isItemUnlocked('roar');
    const unlockedRoar = !roarWasUnlocked && roarNowUnlocked && !owned.roar;
    bestEl.textContent = '/ ' + best;
""",
"""    saveProgress();
    const newlyUnlocked = Object.entries(ITEM_CATALOG)
      .filter(([id, item]) => !item.basic && !unlockBefore.has(id) && isItemUnlocked(id) && !owned[id])
      .map(([id, item]) => ({id, item}));
    bestEl.textContent = '/ ' + best;
""",
'generic unlock detection')

rep(
"""    const unlockLine = unlockedRoar
      ? `<br><span style=\"font-size:14px;color:#d66f2c\">NEW! 「ガオー！」がショップに入荷！</span>`
      : '';
    resultEl.innerHTML = `SCORE ${score}<br><span style=\"font-size:15px;color:#6a7c75\">BEST ${best}</span>${comboLine}${coinLine}${unlockLine}`;
    subtitleEl.textContent = unlockedRoar ? '新しいアイテムを解放したノン！' : newBest ? 'ベストスコアだノン！' : 'もう1回いくノン？';
""",
"""    const unlockNames = newlyUnlocked.map(x => `「${x.item.name}」`).join('・');
    const unlockLine = newlyUnlocked.length
      ? `<br><span style=\"font-size:14px;color:#d66f2c\">NEW! ${unlockNames}がショップに入荷！</span>`
      : '';
    resultEl.innerHTML = `SCORE ${score}<br><span style=\"font-size:15px;color:#6a7c75\">BEST ${best}</span>${comboLine}${coinLine}${unlockLine}`;
    subtitleEl.textContent = newlyUnlocked.length ? '新しいアイテムを解放したノン！' : newBest ? 'ベストスコアだノン！' : 'もう1回いくノン？';
""",
'generic unlock result')

rep(
"""    shopNoteEl.textContent = isItemUnlocked('roar')
      ? '新アイテムは購入後、最大5つまで装備できるノン！'
      : `次の入荷：ガオー！　BEST 2000 ＋ PLAY 3回`;
""",
"""    const nextLocked = Object.entries(ITEM_CATALOG).find(([id, item]) => !item.basic && !isItemUnlocked(id));
    if (nextLocked) {
      const [, item] = nextLocked;
      shopNoteEl.textContent = `次の入荷：${item.name}　BEST ${item.unlockBest} ＋ PLAY ${item.unlockRuns}回`;
    } else {
      shopNoteEl.textContent = '購入したアイテムから最大5つまで装備できるノン！';
    }
""",
'next shop unlock note')

rep(
"""      if (loadout.length < 5 && !loadout.includes(id)) loadout.push(id);
      saveProgress();
      renderShop();
      return;
""",
"""      const hadRoom = loadout.length < 5;
      if (hadRoom && !loadout.includes(id)) loadout.push(id);
      saveProgress();
      renderShop();
      if (!hadRoom) shopNoteEl.textContent = '購入したノン！ 装備枠が5つ埋まっているので、1つ外してから装備してね。';
      return;
""",
'full loadout purchase note')

rep(
"""    shield: false, invincible: 0, magnet: 0, giant: 0, fever: 0,
    runT: 0, squash: 0, damageUntil: 0
""",
"""    shield: false, invincible: 0, magnet: 0, giant: 0, fever: 0,
    timeSlow: 0, wing: 0,
    runT: 0, squash: 0, damageUntil: 0
""",
'player timers')

rep(
"""      shield:false, invincible:0, magnet:0, giant:0, fever:0, runT:0, squash:0,
      damageUntil:0
""",
"""      shield:false, invincible:0, magnet:0, giant:0, fever:0, timeSlow:0, wing:0, runT:0, squash:0,
      damageUntil:0
""",
'reset timers')

rep(
"""    if (isEquipped('roar') && Math.random() < .04) {
      addItem(x + 70 + Math.random() * 90, groundY - (105 + Math.random() * 65), 'roar');
    }
""",
"""    const specialItem = pickEquipped(['roar','slow','wing']);
    if (specialItem && Math.random() < .055) {
      addItem(x + 70 + Math.random() * 90, groundY - (105 + Math.random() * 65), specialItem);
    }
""",
'special item spawn pool')

rep(
"""    const sp = speed();
    const prevBottom = player.y + player.h;

    distance += sp * dt;
    scoreFloat += (sp * dt / 18) * (player.fever > 0 ? 3 : 1);
""",
"""    const sp = speed();
    const slowLevel = Math.max(1, itemLevel('slow'));
    const slowFactor = player.timeSlow > 0 ? Math.max(.46, .62 - (slowLevel - 1) * .04) : 1;
    const worldSp = sp * slowFactor;
    const prevBottom = player.y + player.h;

    distance += worldSp * dt;
    scoreFloat += (worldSp * dt / 18) * (player.fever > 0 ? 3 : 1);
""",
'world slow speed')

rep(
"""    player.magnet = Math.max(0, player.magnet - dt);
    player.giant = Math.max(0, player.giant - dt);
    player.fever = Math.max(0, player.fever - dt);
    player.invincible = Math.max(0, player.invincible - dt);
""",
"""    player.magnet = Math.max(0, player.magnet - dt);
    player.giant = Math.max(0, player.giant - dt);
    player.fever = Math.max(0, player.fever - dt);
    player.timeSlow = Math.max(0, player.timeSlow - dt);
    player.wing = Math.max(0, player.wing - dt);
    player.invincible = Math.max(0, player.invincible - dt);
""",
'timer updates')

rep(
"""    player.vy += 1850 * dt;
    player.y += player.vy * dt;
""",
"""    const wingLevel = Math.max(1, itemLevel('wing'));
    const gravity = player.wing > 0 ? Math.max(620, 980 - (wingLevel - 1) * 90) : 1850;
    player.vy += gravity * dt;
    if (player.wing > 0 && player.vy > 0) {
      player.vy = Math.min(player.vy, Math.max(220, 340 - (wingLevel - 1) * 25));
    }
    player.y += player.vy * dt;
""",
'wing physics')

rep(
"""    for (const o of objects) o.x -= sp * dt;
""",
"""    for (const o of objects) o.x -= worldSp * dt;
""",
'world object speed')

rep(
"""    if (o.item === 'giant') {
      player.giant = 6;
      pickupPop(o, '#ffd27a');
      beep(250, .14, 'square', .04);
      burst(o.x + o.w/2, o.y + o.h/2, '#ffd27a', 18, 165);
    }
    if (o.item === 'roar') {
""",
"""    if (o.item === 'giant') {
      player.giant = 6;
      pickupPop(o, '#ffd27a');
      beep(250, .14, 'square', .04);
      burst(o.x + o.w/2, o.y + o.h/2, '#ffd27a', 18, 165);
    }
    if (o.item === 'slow') {
      const lv = Math.max(1, itemLevel('slow'));
      player.timeSlow = Math.max(player.timeSlow, 3.8 + (lv - 1) * .65);
      pickupPop(o, '#a7e9ff');
      popText('TIME SLOW!', player.x + player.w*.7, player.y - 12, '#d8f7ff', .85, 18);
      burst(o.x + o.w/2, o.y + o.h/2, '#a7e9ff', 16, 135);
      beep(430, .12, 'sine', .035);
    }
    if (o.item === 'wing') {
      const lv = Math.max(1, itemLevel('wing'));
      player.wing = Math.max(player.wing, 4.5 + (lv - 1) * .75);
      player.vy = Math.min(player.vy, -260);
      pickupPop(o, '#f3e9ff');
      popText('ふわっ！', player.x + player.w*.7, player.y - 12, '#fff0ff', .85, 18);
      burst(o.x + o.w/2, o.y + o.h/2, '#ead9ff', 16, 130);
      beep(820, .10, 'sine', .03);
    }
    if (o.item === 'roar') {
""",
'new item collection')

rep(
"""    giantBuff.style.display = player.giant > 0 ? 'block' : 'none';
    feverBuff.style.display = player.fever > 0 ? 'block' : 'none';
""",
"""    giantBuff.style.display = player.giant > 0 ? 'block' : 'none';
    feverBuff.style.display = player.fever > 0 ? 'block' : 'none';
    timeBuff.style.display = player.timeSlow > 0 ? 'block' : 'none';
    wingBuff.style.display = player.wing > 0 ? 'block' : 'none';
""",
'new buff HUD')

rep(
"""      if (!drawSprite(fx.item, fx.x - size/2, fx.y - size/2, size, size) && fx.item === 'roar') {
        ctx.fillStyle = '#8d4b20';
        ctx.font = '900 13px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ガオ', fx.x, fx.y);
      }
""",
"""      if (!drawSprite(fx.item, fx.x - size/2, fx.y - size/2, size, size)) {
        const pickupLabels = {roar:'ガオ', slow:'時', wing:'羽'};
        if (pickupLabels[fx.item]) {
          ctx.fillStyle = fx.item === 'slow' ? '#2d7d98' : fx.item === 'wing' ? '#79629a' : '#8d4b20';
          ctx.font = '900 13px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pickupLabels[fx.item], fx.x, fx.y);
        }
      }
""",
'pickup fallback art')

rep(
"""          drawBubble(
            o,
            o.item==='shield'?'S':o.item==='magnet'?'M':o.item==='giant'?'G':'ガオ',
            o.item==='shield'?'#bfeeff':o.item==='magnet'?'#ffd0d0':o.item==='giant'?'#c9f2a9':'#ffd8a8'
          );
""",
"""          const labels = {shield:'S', magnet:'M', giant:'G', roar:'ガオ', slow:'時', wing:'羽'};
          const colors = {shield:'#bfeeff', magnet:'#ffd0d0', giant:'#c9f2a9', roar:'#ffd8a8', slow:'#c8f2ff', wing:'#eee0ff'};
          drawBubble(o, labels[o.item] || '?', colors[o.item] || '#fff');
""",
'item fallback art')

game.write_text(s, encoding='utf-8')

html = index.read_text(encoding='utf-8')
old_itembar = """    <div class=\"buff\" id=\"giantBuff\">⬆ 巨大化</div>
    <div class=\"buff\" id=\"feverBuff\">🔥 FEVER ×3</div>
"""
new_itembar = """    <div class=\"buff\" id=\"giantBuff\">⬆ 巨大化</div>
    <div class=\"buff\" id=\"feverBuff\">🔥 FEVER ×3</div>
    <div class=\"buff\" id=\"timeBuff\">⏳ タイムスロー</div>
    <div class=\"buff\" id=\"wingBuff\">🪽 プテランの羽</div>
"""
if old_itembar not in html:
    raise SystemExit('missing item bar')
html = html.replace(old_itembar, new_itembar, 1)
old_v = '20260913-2032'
new_v = '20260913-2110'
if old_v not in html:
    raise SystemExit('missing cache version')
index.write_text(html.replace(old_v, new_v), encoding='utf-8')

css = style.read_text(encoding='utf-8')
anchor = '#feverBuff{background:#fff0d8ef}#feverBuff::before{content:"🔥"}'
replacement = anchor + '#timeBuff{background:#e4f8ffef}#timeBuff::before{content:"⏳"}#wingBuff{background:#f3eaffef}#wingBuff::before{content:"🪽"}'
if anchor not in css:
    raise SystemExit('missing buff CSS anchor')
style.write_text(css.replace(anchor, replacement, 1), encoding='utf-8')
