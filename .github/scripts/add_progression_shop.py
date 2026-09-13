from pathlib import Path

game = Path('game.js')
s = game.read_text(encoding='utf-8')


def rep(old, new, label):
    global s
    if old not in s:
        raise SystemExit(f'missing target: {label}')
    s = s.replace(old, new, 1)

# DOM refs for progression/shop.
rep(
"""  const giantBuff = document.getElementById('giantBuff');
  const feverBuff = document.getElementById('feverBuff');

  const WORD = 'TIRAKURI';
""",
"""  const giantBuff = document.getElementById('giantBuff');
  const feverBuff = document.getElementById('feverBuff');
  const coinHudEl = document.getElementById('coinHud');
  const cardEl = document.getElementById('card');
  const shopBtn = document.getElementById('shopBtn');
  const shopPanel = document.getElementById('shopPanel');
  const shopCloseBtn = document.getElementById('shopCloseBtn');
  const shopCoinsEl = document.getElementById('shopCoins');
  const shopSlotsEl = document.getElementById('shopSlots');
  const shopItemsEl = document.getElementById('shopItems');
  const shopNoteEl = document.getElementById('shopNote');

  const WORD = 'TIRAKURI';
""",
'dom refs')

# Persistent progression data.
rep(
"""  const LS_BEST = 'tirakuri-best-v2';
  let best = Number(localStorage.getItem(LS_BEST) || 0);
  bestEl.textContent = '/ ' + best;

  let W = 390;
""",
"""  const LS_BEST = 'tirakuri-best-v2';
  const LS_COINS = 'tirakuri-coins-v1';
  const LS_RUNS = 'tirakuri-runs-v1';
  const LS_OWNED = 'tirakuri-owned-v1';
  const LS_LEVELS = 'tirakuri-levels-v1';
  const LS_LOADOUT = 'tirakuri-loadout-v1';

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  let best = Number(localStorage.getItem(LS_BEST) || 0);
  let wallet = Math.max(0, Number(localStorage.getItem(LS_COINS) || 0));
  let totalRuns = Math.max(0, Number(localStorage.getItem(LS_RUNS) || 0));
  let runCoins = 0;
  let owned = readJson(LS_OWNED, {shield:true, magnet:true, giant:true, roar:false});
  let levels = readJson(LS_LEVELS, {shield:1, magnet:1, giant:1, roar:0});
  let loadout = readJson(LS_LOADOUT, ['shield','magnet','giant']);

  const ITEM_CATALOG = {
    shield: {name:'シールド', icon:'🛡️', desc:'1回だけ栗を防ぐ', basic:true, maxLevel:1},
    magnet: {name:'マグネット', icon:'🧲', desc:'近くのアイテムを引き寄せる', basic:true, maxLevel:1},
    giant: {name:'巨大化', icon:'🍖', desc:'大きくなって栗を壊す', basic:true, maxLevel:1},
    roar: {
      name:'ガオー！', icon:'🗣️', desc:'咆哮で前方の栗をまとめて吹き飛ばす',
      price:300, unlockBest:2000, unlockRuns:3, maxLevel:5,
      upgradeCosts:[180,400,800,1400]
    }
  };

  owned = Object.assign({shield:true, magnet:true, giant:true, roar:false}, owned || {});
  owned.shield = owned.magnet = owned.giant = true;
  levels = Object.assign({shield:1, magnet:1, giant:1, roar:0}, levels || {});
  loadout = Array.isArray(loadout) ? loadout.filter((id, i, a) => ITEM_CATALOG[id] && owned[id] && a.indexOf(id) === i).slice(0,5) : [];
  if (!loadout.length) loadout = ['shield','magnet','giant'];

  function saveProgress() {
    localStorage.setItem(LS_COINS, String(wallet));
    localStorage.setItem(LS_RUNS, String(totalRuns));
    localStorage.setItem(LS_OWNED, JSON.stringify(owned));
    localStorage.setItem(LS_LEVELS, JSON.stringify(levels));
    localStorage.setItem(LS_LOADOUT, JSON.stringify(loadout));
  }

  function isItemUnlocked(id) {
    const item = ITEM_CATALOG[id];
    if (!item) return false;
    if (item.basic) return true;
    return best >= (item.unlockBest || 0) && totalRuns >= (item.unlockRuns || 0);
  }

  function isEquipped(id) {
    return !!owned[id] && loadout.includes(id);
  }

  function itemLevel(id) {
    return Math.max(0, Number(levels[id] || 0));
  }

  function pickEquipped(allowed) {
    const pool = allowed.filter(isEquipped);
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }

  bestEl.textContent = '/ ' + best;

  let W = 390;
""",
'progress storage')

# Remove one-run forced roar introduction state; progression now controls it.
rep("""  let roarFx = 0;
  let roarIntroduced = false;
""", """  let roarFx = 0;
""", 'roar state')
rep("""    roarFx = 0;
    roarIntroduced = false;
""", """    roarFx = 0;
    runCoins = 0;
""", 'reset run coins')

# Replace finish screen with persistent coins/runs + unlock messaging.
rep(
"""    shake = 10;
    if (score > best) {
      best = score;
      localStorage.setItem(LS_BEST, String(best));
    }
    bestEl.textContent = '/ ' + best;
    resultEl.style.display = 'block';
    const comboLine = comboPeak >= 3
      ? `<br><span style=\"font-size:13px;color:#8a6b3d\">MAX COMBO ${comboPeak}</span>`
      : '';
    resultEl.innerHTML = `SCORE ${score}<br><span style=\"font-size:15px;color:#6a7c75\">BEST ${best}</span>${comboLine}`;
    subtitleEl.textContent = score >= best && score > 0 ? 'ベストスコアだノン！' : 'もう1回いくノン？';
    startBtn.textContent = 'もう一度あそぶ';
    overlay.style.display = 'grid';
""",
"""    shake = 10;
    const roarWasUnlocked = isItemUnlocked('roar');
    const newBest = score > best;
    if (newBest) {
      best = score;
      localStorage.setItem(LS_BEST, String(best));
    }
    totalRuns += 1;
    wallet += runCoins;
    saveProgress();
    const roarNowUnlocked = isItemUnlocked('roar');
    const unlockedRoar = !roarWasUnlocked && roarNowUnlocked && !owned.roar;
    bestEl.textContent = '/ ' + best;
    resultEl.style.display = 'block';
    const comboLine = comboPeak >= 3
      ? `<br><span style=\"font-size:13px;color:#8a6b3d\">MAX COMBO ${comboPeak}</span>`
      : '';
    const coinLine = `<br><span style=\"font-size:15px;color:#9a7119\">🪙 +${runCoins}　所持 ${wallet}</span>`;
    const unlockLine = unlockedRoar
      ? `<br><span style=\"font-size:14px;color:#d66f2c\">NEW! 「ガオー！」がショップに入荷！</span>`
      : '';
    resultEl.innerHTML = `SCORE ${score}<br><span style=\"font-size:15px;color:#6a7c75\">BEST ${best}</span>${comboLine}${coinLine}${unlockLine}`;
    subtitleEl.textContent = unlockedRoar ? '新しいアイテムを解放したノン！' : newBest ? 'ベストスコアだノン！' : 'もう1回いくノン？';
    startBtn.textContent = 'もう一度あそぶ';
    renderShop();
    overlay.style.display = 'grid';
""",
'finish progression')

# Shop functions before resetCombo.
rep(
"""  function resetCombo() {
""",
"""  function renderShop() {
    if (!shopItemsEl) return;
    shopCoinsEl.textContent = `🪙 ${wallet}`;
    shopSlotsEl.textContent = `装備 ${loadout.length} / 5`;
    shopItemsEl.innerHTML = Object.entries(ITEM_CATALOG).map(([id, item]) => {
      const unlocked = isItemUnlocked(id);
      const has = !!owned[id];
      const equipped = isEquipped(id);
      const lv = itemLevel(id);
      let stateText = '';
      if (!unlocked) {
        stateText = `🔒 BEST ${Math.min(best,item.unlockBest || 0)}/${item.unlockBest || 0}・PLAY ${Math.min(totalRuns,item.unlockRuns || 0)}/${item.unlockRuns || 0}`;
      } else if (!has) {
        stateText = `ショップ入荷中　🪙${item.price}`;
      } else {
        stateText = item.maxLevel > 1 ? `Lv.${Math.max(1,lv)} / ${item.maxLevel}` : '基本アイテム';
      }

      let actions = '';
      if (unlocked && !has) {
        actions = `<button data-action=\"buy\" data-id=\"${id}\" ${wallet < item.price ? 'disabled' : ''}>購入 🪙${item.price}</button>`;
      } else if (has) {
        actions = `<button data-action=\"equip\" data-id=\"${id}\" class=\"${equipped?'equipped':''}\">${equipped?'装備中 ✓':'装備する'}</button>`;
        if (item.maxLevel > 1 && lv < item.maxLevel) {
          const cost = item.upgradeCosts[Math.max(0,lv-1)];
          actions += `<button data-action=\"upgrade\" data-id=\"${id}\" ${wallet < cost ? 'disabled' : ''}>強化 🪙${cost}</button>`;
        }
      }
      return `<div class=\"shopItem ${unlocked?'':'locked'}\"><div class=\"shopIcon\">${item.icon}</div><div class=\"shopInfo\"><strong>${item.name}</strong><small>${item.desc}</small><em>${stateText}</em><div class=\"shopActions\">${actions}</div></div></div>`;
    }).join('');
    shopNoteEl.textContent = isItemUnlocked('roar')
      ? '新アイテムは購入後、最大5つまで装備できるノン！'
      : `次の入荷：ガオー！　BEST 2000 ＋ PLAY 3回`;
    updateHud();
  }

  function openShop() {
    if (state === 'playing' || state === 'damage') return;
    renderShop();
    cardEl.style.display = 'none';
    shopPanel.hidden = false;
  }

  function closeShop() {
    shopPanel.hidden = true;
    cardEl.style.display = 'block';
  }

  function resetCombo() {
""",
'shop functions')

# Make overlay/shop interactions safe.
rep(
"""  overlay.addEventListener('pointerdown', e => {
    if (e.target === muteBtn || e.target === startBtn) return;
    input(e);
  }, {passive:false});
  startBtn.addEventListener('pointerdown', e => e.stopPropagation());
  startBtn.addEventListener('click', e => { e.stopPropagation(); reset(); });
""",
"""  overlay.addEventListener('pointerdown', e => {
    if (e.target.closest && e.target.closest('#shopPanel,#shopBtn,#startBtn,#mute')) return;
    input(e);
  }, {passive:false});
  startBtn.addEventListener('pointerdown', e => e.stopPropagation());
  startBtn.addEventListener('click', e => { e.stopPropagation(); closeShop(); reset(); });
  shopBtn.addEventListener('pointerdown', e => e.stopPropagation());
  shopBtn.addEventListener('click', e => { e.stopPropagation(); openShop(); });
  shopCloseBtn.addEventListener('pointerdown', e => e.stopPropagation());
  shopCloseBtn.addEventListener('click', e => { e.stopPropagation(); closeShop(); });
  shopPanel.addEventListener('pointerdown', e => e.stopPropagation());
  shopItemsEl.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const item = ITEM_CATALOG[id];
    if (!item) return;
    if (btn.dataset.action === 'buy') {
      if (!isItemUnlocked(id) || owned[id] || wallet < item.price) return;
      wallet -= item.price;
      owned[id] = true;
      levels[id] = Math.max(1, itemLevel(id));
      if (loadout.length < 5 && !loadout.includes(id)) loadout.push(id);
      saveProgress();
      renderShop();
      return;
    }
    if (btn.dataset.action === 'equip') {
      if (!owned[id]) return;
      if (loadout.includes(id)) {
        loadout = loadout.filter(x => x !== id);
      } else if (loadout.length < 5) {
        loadout.push(id);
      } else {
        shopNoteEl.textContent = '装備できるアイテムは5つまでだノン！';
        return;
      }
      saveProgress();
      renderShop();
      return;
    }
    if (btn.dataset.action === 'upgrade') {
      const lv = itemLevel(id);
      if (!owned[id] || lv >= item.maxLevel) return;
      const cost = item.upgradeCosts[lv-1];
      if (wallet < cost) return;
      wallet -= cost;
      levels[id] = lv + 1;
      saveProgress();
      renderShop();
    }
  });
""",
'shop event listeners')

# Coin object + equipped item helper.
rep(
"""  function addItem(x, y, item) {
    objects.push({type:'item', item, x, y, w:34, h:34});
  }
  function addBonus(x, y, value=1, routeCue=false) {
""",
"""  function addItem(x, y, item) {
    objects.push({type:'item', item, x, y, w:34, h:34});
  }
  function addEquippedItem(x, y, allowed) {
    const item = pickEquipped(allowed);
    if (item) addItem(x, y, item);
  }
  function addCoin(x, y, value=1) {
    objects.push({type:'coin', x, y, w:22, h:22, value});
  }
  function addBonus(x, y, value=1, routeCue=false) {
""",
'coin helper')

# Respect loadout in existing item drops.
rep("""        addItem(x + 285, groundY - 218, Math.random() < .55 ? 'magnet' : 'shield');
""", """        addEquippedItem(x + 285, groundY - 218, ['magnet','shield']);
""", 'pattern6 item')
rep("""      if (Math.random() < .34) addItem(x + 255, groundY - 236, Math.random() < .5 ? 'shield' : 'magnet');
""", """      if (Math.random() < .34) addEquippedItem(x + 255, groundY - 236, ['shield','magnet']);
""", 'pattern7 item')
rep("""      if (Math.random() < .72) addItem(x + 334, groundY - 212, Math.random() < .52 ? 'magnet' : 'shield');
""", """      if (Math.random() < .72) addEquippedItem(x + 334, groundY - 212, ['magnet','shield']);
""", 'pattern9 item')

# Replace forced roar + generic random drop with coins + equipped drops.
rep(
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
""",
"""    if (Math.random() < .58) {
      const n = 3 + Math.floor(Math.random() * 3);
      const baseY = groundY - 88 - Math.random() * 42;
      for (let i=0; i<n; i++) {
        addCoin(x + 34 + i*36, baseY - Math.sin(i / Math.max(1,n-1) * Math.PI) * 30, 1);
      }
    }

    if (isEquipped('roar') && Math.random() < .04) {
      addItem(x + 70 + Math.random() * 90, groundY - (105 + Math.random() * 65), 'roar');
    }

    if (Math.random() < .095) {
      addEquippedItem(
        x + 95 + Math.random() * 70,
        groundY - (125 + Math.random() * 90),
        ['shield','magnet','giant']
      );
    }
""",
'coin and progression drops')

rep("""      if (Math.random() < .48) addItem(x + 320, groundY - 190, Math.random() < .5 ? 'magnet' : 'shield');
""", """      if (Math.random() < .48) addEquippedItem(x + 320, groundY - 190, ['magnet','shield']);
""", 'bonus item')

# Magnet also attracts coins.
rep("""        if (o.type !== 'letter' && o.type !== 'item' && o.type !== 'bonus') continue;
""", """        if (o.type !== 'letter' && o.type !== 'item' && o.type !== 'bonus' && o.type !== 'coin') continue;
""", 'coin magnet')

# Coin collision handling.
rep(
"""      if ((o.type === 'letter' || o.type === 'item' || o.type === 'bonus') && rectHit(pbox, o, -2)) {
        if (o.type === 'letter') collectLetter(o);
        else if (o.type === 'item') collectItem(o);
        else collectBonus(o);
        objects.splice(i, 1);
        continue;
      }
""",
"""      if ((o.type === 'letter' || o.type === 'item' || o.type === 'bonus' || o.type === 'coin') && rectHit(pbox, o, -2)) {
        if (o.type === 'letter') collectLetter(o);
        else if (o.type === 'item') collectItem(o);
        else if (o.type === 'coin') collectCoin(o);
        else collectBonus(o);
        objects.splice(i, 1);
        continue;
      }
""",
'coin collision')

# Coin collection function before collectLetter.
rep(
"""  function collectLetter(o) {
""",
"""  function collectCoin(o) {
    const gain = Math.max(1, Number(o.value || 1));
    runCoins += gain;
    scoreFloat += 5 * gain;
    score = Math.floor(scoreFloat);
    burst(o.x + o.w/2, o.y + o.h/2, '#ffd34e', 7, 90);
    beep(760 + Math.min(5, runCoins % 6) * 28, .028, 'sine', .014);
  }

  function collectLetter(o) {
""",
'collect coin')

# Upgrade-aware roar effect.
rep(
"""    if (o.item === 'roar') {
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
""",
"""    if (o.item === 'roar') {
      const lv = Math.max(1, itemLevel('roar'));
      roarFx = ROAR_FX_DURATION;
      let blasted = 0;
      const reach = W + 80 + lv * 55;
      for (const target of objects) {
        if (target.type !== 'kuri') continue;
        if (target.x < player.x - 45 || target.x > reach) continue;
        target.type = 'cleared';
        blasted++;
        burst(target.x + target.w/2, target.y + target.h/2, '#ffb45f', 11 + lv, 185 + lv*8);
      }
      const gainPer = 25 + lv * 10;
      const gain = blasted * gainPer;
      const coinBonus = lv >= 4 ? Math.floor(blasted / 2) : 0;
      runCoins += coinBonus;
      if (lv >= 3) player.invincible = Math.max(player.invincible, .35 + lv * .13);
      scoreFloat += gain;
      score = Math.floor(scoreFloat);
      shake = Math.max(shake, 5 + lv*.5);
      flash = Math.max(flash, .07);
      burst(player.x + player.w*.72, player.y + player.h*.38, '#ffe29a', 18 + lv*2, 185 + lv*10);
      const coinText = coinBonus ? ` 🪙+${coinBonus}` : '';
      popText(blasted ? `ガオーー！ 栗${blasted}個！ +${gain}${coinText}` : 'ガオーー！', W*.5, H*.34, '#ffe09a', 1.0, 23);
      beep(150, .16, 'sawtooth', .045);
      setTimeout(() => beep(260 + lv*18, .12, 'square', .03), 80);
    }
""",
'roar level effect')

# HUD shows persistent/run coins.
rep(
"""    scoreEl.textContent = score;
    bestEl.textContent = '/ ' + Math.max(best, score);
""",
"""    scoreEl.textContent = score;
    bestEl.textContent = '/ ' + Math.max(best, score);
    coinHudEl.textContent = `🪙 ${wallet + runCoins}`;
""",
'coin hud')

# Draw coin function before drawBonus.
rep(
"""  function drawBonus(o) {
""",
"""  function drawCoin(o) {
    const cx = o.x + o.w/2;
    const cy = o.y + o.h/2;
    ctx.save();
    ctx.shadowColor = '#ffcf3d';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffd54d';
    ctx.beginPath();
    ctx.arc(cx, cy, o.w*.46, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#f39a27';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff3a0';
    ctx.font = '900 12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('C', cx, cy+.5);
    ctx.restore();
  }

  function drawBonus(o) {
""",
'draw coin')

# Draw equipped cosmetic charm after player.
rep(
"""  function drawPickupEffects() {
""",
"""  function drawLoadoutCosmetics() {
    if (!isEquipped('roar')) return;
    const lv = Math.max(1, itemLevel('roar'));
    const bob = player.y + player.h >= groundY - 2 ? Math.sin(player.runT)*2 : 0;
    const x = player.x + player.w*.61;
    const y = player.y + player.h*.55 + bob;
    ctx.save();
    ctx.shadowColor = '#ff9e3d';
    ctx.shadowBlur = lv >= 3 ? 10 : 5;
    ctx.fillStyle = lv >= 5 ? '#ffd35a' : '#f5a544';
    ctx.beginPath();
    ctx.arc(x, y, 5 + Math.min(2,lv*.35), 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#fff1b0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x+1, y, 9 + lv, -.65, .65);
    ctx.stroke();
    if (lv >= 4) {
      ctx.beginPath();
      ctx.arc(x+2, y, 13 + lv, -.55, .55);
      ctx.globalAlpha = .65;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPickupEffects() {
""",
'cosmetic charm')

# Pickup pop fallback for roar and world item fallback.
rep(
"""      drawSprite(fx.item, fx.x - size/2, fx.y - size/2, size, size);
      ctx.restore();
""",
"""      if (!drawSprite(fx.item, fx.x - size/2, fx.y - size/2, size, size) && fx.item === 'roar') {
        ctx.fillStyle = '#8d4b20';
        ctx.font = '900 13px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ガオ', fx.x, fx.y);
      }
      ctx.restore();
""",
'roar pickup fallback')

rep(
"""      if (o.type==='letter') drawBubble(o,o.letter,'#ffe48a');
      if (o.type==='bonus') drawBonus(o);
      if (o.type==='item') {
""",
"""      if (o.type==='letter') drawBubble(o,o.letter,'#ffe48a');
      if (o.type==='bonus') drawBonus(o);
      if (o.type==='coin') drawCoin(o);
      if (o.type==='item') {
""",
'coin render')

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
            o.item==='shield'?'#bfeeff':o.item==='magnet'?'#ffd0d0':o.item==='giant'?'#c9f2a9':'#ffd9a6'
          );
""",
'roar world fallback')

rep(
"""    drawPickupEffects();
    drawPlayer();
    drawRushWarpEffect();
""",
"""    drawPickupEffects();
    drawPlayer();
    drawLoadoutCosmetics();
    drawRushWarpEffect();
""",
'cosmetic render')

game.write_text(s, encoding='utf-8')

# Update index UI.
index = Path('index.html')
h = index.read_text(encoding='utf-8')


def hrep(old, new, label):
    global h
    if old not in h:
        raise SystemExit(f'missing html target: {label}')
    h = h.replace(old, new, 1)

hrep(
"""      <strong id=\"score\">0</strong> <span id=\"best\">/ 0</span>
""",
"""      <strong id=\"score\">0</strong> <span id=\"best\">/ 0</span>
      <div id=\"coinHud\">🪙 0</div>
""",
'coin hud html')

hrep(
"""      <button id=\"startBtn\">タップしてスタート</button>
      <div id=\"tips\">
        栗を連続でよけるとCOMBO！ギリギリ回避は高得点。<br>
        KURI RUSH / BONUS RUN / ジャンプ台も出現
      </div>
    </div>
  </div>
""",
"""      <div id=\"menuBtns\">
        <button id=\"startBtn\">タップしてスタート</button>
        <button id=\"shopBtn\">🛒 ショップ</button>
      </div>
      <div id=\"tips\">
        コインを集めて新アイテムを購入・強化！<br>
        アイテムは最大5つまで装備できるノン
      </div>
    </div>
    <div id=\"shopPanel\" hidden>
      <div class=\"shopHead\">
        <div><strong>ティラクリショップ</strong><small id=\"shopSlots\">装備 3 / 5</small></div>
        <div><span id=\"shopCoins\">🪙 0</span><button id=\"shopCloseBtn\" aria-label=\"ショップを閉じる\">×</button></div>
      </div>
      <div id=\"shopItems\"></div>
      <div id=\"shopNote\"></div>
    </div>
  </div>
""",
'shop panel html')

if '20260913-1855' not in h:
    raise SystemExit('missing cache version')
h = h.replace('20260913-1855', '20260913-2008')
index.write_text(h, encoding='utf-8')

# Append shop styling.
style = Path('style.css')
css = style.read_text(encoding='utf-8')
marker = '/* progression-shop-v1 */'
if marker not in css:
    css += '''\n/* progression-shop-v1 */\n#coinHud{margin-top:4px;font-size:13px;color:#9a7119;font-weight:900}#menuBtns{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(108px,.8fr);gap:10px;align-items:stretch}#menuBtns #startBtn{width:auto}#shopBtn{border:0;border-radius:18px;background:#e9f7ec;color:#2f6656;font:inherit;font-weight:900;font-size:16px;padding:14px 12px;box-shadow:0 5px 0 #afd4bd;transform:translateY(-3px)}#shopBtn:active{transform:translateY(1px);box-shadow:0 1px 0 #afd4bd}#shopPanel[hidden]{display:none}#shopPanel{width:min(94%,470px);max-height:min(84vh,760px);overflow:auto;background:#fffdf3;border:3px solid #fff;border-radius:26px;padding:18px;box-shadow:0 14px 46px #315d4e35;text-align:left;overscroll-behavior:contain;pointer-events:auto}.shopHead{position:sticky;top:-18px;z-index:2;margin:-18px -18px 12px;padding:16px 16px 12px;background:#fffdf3f5;backdrop-filter:blur(5px);display:flex;justify-content:space-between;gap:12px;align-items:flex-start;border-bottom:1px solid #eadfc6}.shopHead>div:first-child{display:flex;flex-direction:column;gap:3px}.shopHead strong{font-size:20px;color:#2e8f75}.shopHead small{font-size:12px;color:#6d817a}.shopHead>div:last-child{display:flex;gap:8px;align-items:center}#shopCoins{font-weight:900;color:#9a7119;white-space:nowrap}#shopCloseBtn{border:0;width:34px;height:34px;border-radius:50%;background:#f1eadc;color:#725d43;font-size:22px;font-weight:900}.shopItem{display:grid;grid-template-columns:50px 1fr;gap:10px;padding:12px 10px;margin:8px 0;border:2px solid #e7dec8;border-radius:18px;background:#fff}.shopItem.locked{opacity:.58;filter:saturate(.65)}.shopIcon{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;background:#fff1cf;font-size:26px}.shopInfo{min-width:0}.shopInfo strong{display:block;color:#325f53;font-size:16px}.shopInfo small{display:block;margin-top:3px;color:#687a74;font-size:12px;line-height:1.4}.shopInfo em{display:block;margin-top:5px;color:#9b7136;font-size:11px;font-style:normal;font-weight:800}.shopActions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.shopActions button{border:0;border-radius:12px;padding:8px 10px;background:#ffbd56;color:#533714;font-weight:900;font-size:12px;box-shadow:0 3px 0 #dc9630}.shopActions button.equipped{background:#dff6e8;color:#2d6b57;box-shadow:0 3px 0 #acd6bd}.shopActions button:disabled{opacity:.42;box-shadow:none}#shopNote{text-align:center;margin-top:12px;padding:10px;border-radius:14px;background:#f5f0e2;color:#6f674f;font-size:12px;font-weight:800;line-height:1.45}@media(max-width:380px){#menuBtns{grid-template-columns:1fr}#shopBtn{padding:11px 12px}.shopHead strong{font-size:18px}}\n'''
style.write_text(css, encoding='utf-8')
