(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('startBtn');
  const resultEl = document.getElementById('result');
  const subtitleEl = document.getElementById('subtitle');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const lettersEl = document.getElementById('letters');
  const muteBtn = document.getElementById('mute');
  const shieldBuff = document.getElementById('shieldBuff');
  const magnetBuff = document.getElementById('magnetBuff');
  const giantBuff = document.getElementById('giantBuff');
  const feverBuff = document.getElementById('feverBuff');
  const timeBuff = document.getElementById('timeBuff');
  const wingBuff = document.getElementById('wingBuff');
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
  const LS_BEST = 'tirakuri-best-v2';
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
  let owned = readJson(LS_OWNED, {shield:true, magnet:true, giant:true, roar:false, slow:false, wing:false});
  let levels = readJson(LS_LEVELS, {shield:1, magnet:1, giant:1, roar:0, slow:0, wing:0});
  let loadout = readJson(LS_LOADOUT, ['shield','magnet','giant']);

  const ITEM_CATALOG = {
    shield: {name:'シールド', icon:'🛡️', desc:'1回だけ栗を防ぐ', basic:true, maxLevel:1},
    magnet: {name:'マグネット', icon:'🧲', desc:'近くのコインだけを引き寄せる', basic:true, maxLevel:1},
    giant: {name:'巨大化', icon:'🍖', desc:'大きくなって栗を壊す', basic:true, maxLevel:1},
    roar: {
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
  let H = 700;
  let dpr = 1;
  let groundY = 550;
  let state = 'title';
  let last = performance.now();
  let distance = 0;
  let score = 0;
  let scoreFloat = 0;
  let nextPattern = 0;
  let objects = [];
  let particles = [];
  let pickupEffects = [];
  let floatTexts = [];
  let collected = 0;
  let shake = 0;
  let flash = 0;
  let muted = false;
  let audioCtx = null;

  let combo = 0;
  let comboTimer = 0;
  let comboPeak = 0;
  let eventMode = 'normal';
  let eventTimer = 0;
  let eventCooldown = 20;
  let eventBanner = '';
  let eventBannerTimer = 0;
  let rushWarpTimer = 0;
  let roarFx = 0;
  const RUSH_WARP_DURATION = .95;
  const ROAR_FX_DURATION = .65;

  const spritePaths = {
    run1: '1218B0FC-C2A9-4661-8707-C27D900A8992.png',
    run2: 'BBCB72FB-8753-443F-8266-DE96E161B845.png',
    jump: '611DD895-B471-4366-B1DC-231EF0F51CF8.png',
    damage: 'DE619F5B-547D-4A02-866D-6E072FD3FF44.png',
    kuri: 'A29A0A58-DA6B-49B8-AD9F-D595AE41741C.png',
    shield: '55E5A798-2A2D-466B-9A4C-6B865812C4D9.png',
    magnet: '43F86E52-798E-4091-ADAC-DEF03A44AD20.png',
    giant: '5428AE5F-D105-4FC1-B217-9EDA0009D7C5.png'
  };
  const sprites = {};
  for (const [name, src] of Object.entries(spritePaths)) {
    const image = new Image();
    image.decoding = 'async';
    image.src = src;
    sprites[name] = image;
  }

  const player = {
    x: 88, y: 0, w: 48, h: 48, vy: 0, jumps: 0,
    shield: false, invincible: 0, magnet: 0, giant: 0, fever: 0,
    timeSlow: 0, wing: 0,
    runT: 0, squash: 0, damageUntil: 0
  };

  const stages = [
    {name:'はらっぱ',sky1:'#c7f1ee',sky2:'#fff4c9',hill:'#8fd5a7',far:'#bce5b7',ground:'#6ab67d',dirt:'#b98055'},
    {name:'まち',sky1:'#cde8ff',sky2:'#fff0da',hill:'#9ac6cf',far:'#c8d9d0',ground:'#70b683',dirt:'#ae7d5d'},
    {name:'ゆうやけ',sky1:'#ffd0a8',sky2:'#fff0c9',hill:'#d8a88a',far:'#efd0a2',ground:'#79ad73',dirt:'#a8775c'},
    {name:'ほしぞら',sky1:'#445477',sky2:'#8792ad',hill:'#5b7082',far:'#6e8191',ground:'#527b65',dirt:'#71584f'}
  ];

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(320, r.width);
    H = Math.max(520, r.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    groundY = H * 0.79;
    player.x = Math.max(72, W * 0.22);
    if (state !== 'playing') player.y = groundY - player.h;
  }
  addEventListener('resize', resize, {passive:true});
  resize();

  function beep(freq=440, duration=.06, type='sine', vol=.04) {
    if (muted) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + duration);
      o.stop(audioCtx.currentTime + duration);
    } catch (_) {}
  }

  function reset() {
    state = 'playing';
    last = performance.now();
    distance = 0;
    score = 0;
    scoreFloat = 0;
    nextPattern = W + 300;
    objects = [];
    particles = [];
    pickupEffects = [];
    floatTexts = [];
    collected = 0;
    shake = 0;
    flash = 0;
    combo = 0;
    comboTimer = 0;
    comboPeak = 0;
    eventMode = 'normal';
    eventTimer = 0;
    eventCooldown = 18 + Math.random() * 8;
    eventBanner = '';
    eventBannerTimer = 0;
    rushWarpTimer = 0;
    roarFx = 0;
    runCoins = 0;
    Object.assign(player, {
      y: groundY - 48, w:48, h:48, vy:0, jumps:0,
      shield:false, invincible:0, magnet:0, giant:0, fever:0, timeSlow:0, wing:0, runT:0, squash:0,
      damageUntil:0
    });
    overlay.style.display = 'none';
    resultEl.style.display = 'none';
    updateHud();
  }

  function finishGame() {
    if (state !== 'playing' && state !== 'damage') return;
    state = 'over';
    shake = 10;
    const unlockBefore = new Set(
      Object.keys(ITEM_CATALOG).filter(id => !ITEM_CATALOG[id].basic && isItemUnlocked(id))
    );
    const newBest = score > best;
    if (newBest) {
      best = score;
      localStorage.setItem(LS_BEST, String(best));
    }
    totalRuns += 1;
    const earnedCoins = runCoins;
    wallet += earnedCoins;
    runCoins = 0;
    saveProgress();
    const newlyUnlocked = Object.entries(ITEM_CATALOG)
      .filter(([id, item]) => !item.basic && !unlockBefore.has(id) && isItemUnlocked(id) && !owned[id])
      .map(([id, item]) => ({id, item}));
    bestEl.textContent = '/ ' + best;
    resultEl.style.display = 'block';
    const comboLine = comboPeak >= 3
      ? `<br><span style="font-size:13px;color:#8a6b3d">MAX COMBO ${comboPeak}</span>`
      : '';
    const coinLine = `<br><span style="font-size:15px;color:#9a7119">🪙 +${earnedCoins}　所持 ${wallet}</span>`;
    const unlockNames = newlyUnlocked.map(x => `「${x.item.name}」`).join('・');
    const unlockLine = newlyUnlocked.length
      ? `<br><span style="font-size:14px;color:#d66f2c">NEW! ${unlockNames}がショップに入荷！</span>`
      : '';
    resultEl.innerHTML = `SCORE ${score}<br><span style="font-size:15px;color:#6a7c75">BEST ${best}</span>${comboLine}${coinLine}${unlockLine}`;
    subtitleEl.textContent = newlyUnlocked.length ? '新しいアイテムを解放したノン！' : newBest ? 'ベストスコアだノン！' : 'もう1回いくノン？';
    startBtn.textContent = 'もう一度あそぶ';
    renderShop();
    overlay.style.display = 'grid';
  }

  function renderShop() {
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
        actions = `<button data-action="buy" data-id="${id}" ${wallet < item.price ? 'disabled' : ''}>購入 🪙${item.price}</button>`;
      } else if (has) {
        actions = `<button data-action="equip" data-id="${id}" class="${equipped?'equipped':''}">${equipped?'装備中 ✓':'装備する'}</button>`;
        if (item.maxLevel > 1 && lv < item.maxLevel) {
          const cost = item.upgradeCosts[Math.max(0,lv-1)];
          actions += `<button data-action="upgrade" data-id="${id}" ${wallet < cost ? 'disabled' : ''}>強化 🪙${cost}</button>`;
        }
      }
      return `<div class="shopItem ${unlocked?'':'locked'}"><div class="shopIcon">${item.icon}</div><div class="shopInfo"><strong>${item.name}</strong><small>${item.desc}</small><em>${stateText}</em><div class="shopActions">${actions}</div></div></div>`;
    }).join('');
    const nextLocked = Object.entries(ITEM_CATALOG).find(([id, item]) => !item.basic && !isItemUnlocked(id));
    if (nextLocked) {
      const [, item] = nextLocked;
      shopNoteEl.textContent = `次の入荷：${item.name}　BEST ${item.unlockBest} ＋ PLAY ${item.unlockRuns}回`;
    } else {
      shopNoteEl.textContent = '購入したアイテムから最大5つまで装備できるノン！';
    }
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
    combo = 0;
    comboTimer = 0;
  }

  function comboMultiplier() {
    if (combo >= 16) return 5;
    if (combo >= 9) return 3;
    if (combo >= 4) return 2;
    return 1;
  }

  function popText(text, x, y, color='#fff5a8', life=.75, size=17) {
    floatTexts.push({text, x, y, color, life, maxLife:life, size});
  }

  function registerAvoid(o, near=false) {
    combo++;
    comboPeak = Math.max(comboPeak, combo);
    comboTimer = near ? 2.15 : 1.72;
    const mult = comboMultiplier();
    const gain = (near ? 45 : 18) * mult;
    scoreFloat += gain;
    score = Math.floor(scoreFloat);
    if (near) {
      popText(`ギリギリ！ +${gain}`, player.x + player.w*.7, player.y - 12, '#ffd55a', .85, 18);
      burst(player.x + player.w*.75, player.y + player.h*.45, '#ffd55a', 8, 100);
      beep(830, .05, 'square', .028);
    } else if (combo === 4 || combo === 9 || combo === 16) {
      popText(`COMBO ×${mult}`, player.x + player.w*.8, player.y - 8, '#fff1a8', .8, 17);
      beep(650 + mult*70, .055, 'sine', .026);
    }
    o.passed = true;
  }

  function beginDamageGameOver() {
    if (state !== 'playing') return;
    resetCombo();
    state = 'damage';
    player.damageUntil = performance.now() + 560;
    player.vy = 0;
    shake = 11;
    flash = .16;
    beep(135, .22, 'sawtooth', .06);
    burst(player.x + player.w * .72, player.y + player.h * .28, '#ffd85a', 10, 150);
    setTimeout(() => {
      if (state === 'damage') finishGame();
    }, 540);
  }

  function jump() {
    if (state !== 'playing' || player.jumps >= 2) return;
    player.vy = player.jumps === 0 ? -720 : -635;
    player.jumps++;
    player.squash = .14;
    beep(player.jumps === 1 ? 520 : 680, .055, 'square', .035);
    burst(player.x + player.w * .35, player.y + player.h, '#ffffff', 5, 70);
  }

  function input(e) {
    if (e && e.type === 'keydown' && !['Space','ArrowUp'].includes(e.code)) return;
    if (e && e.cancelable) e.preventDefault();
    if (state === 'title' || state === 'over') {
      reset();
      return;
    }
    jump();
  }

  canvas.addEventListener('pointerdown', input, {passive:false});
  overlay.addEventListener('pointerdown', e => {
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
      const hadRoom = loadout.length < 5;
      if (hadRoom && !loadout.includes(id)) loadout.push(id);
      saveProgress();
      renderShop();
      if (!hadRoom) shopNoteEl.textContent = '購入したノン！ 装備枠が5つ埋まっているので、1つ外してから装備してね。';
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
  addEventListener('keydown', input, {passive:false});
  muteBtn.addEventListener('pointerdown', e => e.stopPropagation());
  muteBtn.addEventListener('click', e => {
    e.stopPropagation();
    muted = !muted;
    muteBtn.textContent = muted ? '🔇' : '🔊';
  });

  function speed() {
    const eventBoost = eventMode === 'rush' ? 0 : eventMode === 'bonus' ? 12 : 0;
    return Math.min(540, 275 + distance * .0062 + (player.fever > 0 ? 25 : 0) + eventBoost);
  }

  function addChestnut(x, y, scale=1) {
    objects.push({type:'kuri', x, y, w:38*scale, h:34*scale, passed:false});
  }
  function addPlatform(x, y, w=150) {
    objects.push({type:'platform', x, y, w, h:18});
  }
  function addSpring(x, y=groundY-12, w=52, route=false) {
    objects.push({type:'spring', x, y, w, h:12, used:false, route});
  }
  function addLetter(x, y) {
    objects.push({type:'letter', letter:WORD[collected], x, y, w:30, h:30});
  }
  function addItem(x, y, item) {
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
    const premium = value > 1;
    objects.push({
      type:'bonus', x, y,
      w: premium ? 28 : 24,
      h: premium ? 28 : 24,
      value, premium, routeCue
    });
  }

  function spawnNormalPattern() {
    const x = W + 90;
    const level = Math.min(3, Math.floor(distance / 4200));
    const available = [0,1,2,3,4].concat(level >= 1 ? [5,6,7] : []).concat(level >= 2 ? [8,9] : []);
    const id = available[Math.floor(Math.random() * available.length)];

    if (id === 0) {
      addChestnut(x, groundY - 34, 1);
    } else if (id === 1) {
      addChestnut(x, groundY - 32, .92);
      addChestnut(x + 78, groundY - 38, 1.08);
    } else if (id === 2) {
      const py = groundY - 76;
      addPlatform(x, py, 150);
      addChestnut(x + 88, py - 32, .92);
    } else if (id === 3) {
      addPlatform(x, groundY - 58, 100);
      addPlatform(x + 118, groundY - 110, 108);
      if (Math.random() < .7) addChestnut(x + 154, groundY - 144, .88);
    } else if (id === 4) {
      addPlatform(x, groundY - 112, 116);
      addPlatform(x + 132, groundY - 62, 120);
      addChestnut(x + 170, groundY - 96, .9);
    } else if (id === 5) {
      addChestnut(x, groundY - 34, .9);
      addChestnut(x + 112, groundY - 36, 1.0);
      addChestnut(x + 205, groundY - 32, .88);
    } else if (id === 6) {
      addSpring(x, groundY - 12, 54, true);
      addPlatform(x + 105, groundY - 152, 210);
      addChestnut(x + 125, groundY - 34, .94);
      addChestnut(x + 230, groundY - 36, 1.0);
      addBonus(x + 140, groundY - 190, 2, true);
      addBonus(x + 193, groundY - 205, 2);
      addBonus(x + 246, groundY - 205, 2);
      addBonus(x + 299, groundY - 190, 2);
      if (!objects.some(o => o.type === 'letter') && Math.random() < .35) {
        addLetter(x + 277, groundY - 236);
      } else if (Math.random() < .30) {
        addEquippedItem(x + 285, groundY - 218, ['magnet','shield']);
      }
    } else if (id === 7) {
      addPlatform(x, groundY - 58, 90);
      addPlatform(x + 100, groundY - 105, 90);
      addPlatform(x + 200, groundY - 152, 120);
      addBonus(x + 210, groundY - 188, 2, true);
      addBonus(x + 252, groundY - 201, 2);
      addBonus(x + 294, groundY - 188, 2);
      if (Math.random() < .34) addEquippedItem(x + 255, groundY - 236, ['shield','magnet']);
      addChestnut(x + 340, groundY - 34, 1);
    } else if (id === 8) {
      addChestnut(x, groundY - 35, 1.0);
      addChestnut(x + 92, groundY - 52, 1.28);
      addChestnut(x + 202, groundY - 34, .96);
      addBonus(x + 132, groundY - 155);
    } else {
      addSpring(x, groundY - 12, 50, true);
      addPlatform(x + 98, groundY - 170, 245);
      addChestnut(x + 132, groundY - 34, .9);
      addChestnut(x + 244, groundY - 36, 1.05);
      addBonus(x + 143, groundY - 206, 2, true);
      addBonus(x + 194, groundY - 221, 2);
      addBonus(x + 245, groundY - 221, 2);
      addBonus(x + 296, groundY - 206, 2);
      if (!objects.some(o => o.type === 'letter') && Math.random() < .42) addLetter(x + 302, groundY - 248);
      if (Math.random() < .72) addEquippedItem(x + 334, groundY - 212, ['magnet','shield']);
    }

    const letterAlreadyOnScreen = objects.some(o => o.type === 'letter');
    if (player.fever <= 0 && !letterAlreadyOnScreen && Math.random() < .20) {
      addLetter(x + 55 + Math.random() * 130, groundY - (145 + Math.random() * 85));
    }

    if (Math.random() < .58) {
      const n = 3 + Math.floor(Math.random() * 3);
      const baseY = groundY - 88 - Math.random() * 42;
      for (let i=0; i<n; i++) {
        addCoin(x + 34 + i*36, baseY - Math.sin(i / Math.max(1,n-1) * Math.PI) * 30, 1);
      }
    }

    const specialItem = pickEquipped(['roar','slow','wing']);
    if (specialItem && Math.random() < .055) {
      addItem(x + 70 + Math.random() * 90, groundY - (105 + Math.random() * 65), specialItem);
    }

    if (Math.random() < .095) {
      addEquippedItem(
        x + 95 + Math.random() * 70,
        groundY - (125 + Math.random() * 90),
        ['shield','magnet','giant']
      );
    }

    nextPattern += 365 + Math.random() * 190;
  }

  function spawnRushPattern() {
    const x = W + 95;
    const kind = Math.floor(Math.random() * 4);
    if (kind === 0) {
      addChestnut(x, groundY - 33, .86);
      addChestnut(x + 165, groundY - 36, .98);
    } else if (kind === 1) {
      addChestnut(x, groundY - 33, .84);
      addChestnut(x + 150, groundY - 42, 1.04);
      addChestnut(x + 305, groundY - 33, .88);
    } else if (kind === 2) {
      addPlatform(x + 55, groundY - 82, 160);
      addChestnut(x, groundY - 33, .84);
      addChestnut(x + 285, groundY - 34, .94);
    } else {
      addChestnut(x + 45, groundY - 34, .90);
      addChestnut(x + 220, groundY - 52, 1.12);
    }
    nextPattern += 430 + Math.random() * 90;
  }

  function spawnBonusPattern() {
    const x = W + 70;
    const high = Math.random() < .45;
    if (high) {
      addSpring(x, groundY - 12, 50, true);
      addPlatform(x + 95, groundY - 142, 230);
      for (let i=0; i<6; i++) addBonus(x + 116 + i*43, groundY - 180 - Math.sin(i/5*Math.PI)*30, 2, i === 0);
      if (!objects.some(o => o.type === 'letter') && Math.random() < .38) addLetter(x + 287, groundY - 228);
      if (Math.random() < .48) addEquippedItem(x + 320, groundY - 190, ['magnet','shield']);
    } else {
      for (let i=0; i<6; i++) addBonus(x + i*50, groundY - 95 - Math.sin(i/5*Math.PI)*48);
      if (Math.random() < .28 && !objects.some(o => o.type === 'letter')) addLetter(x + 250, groundY - 170);
    }
    nextPattern += 315 + Math.random() * 85;
  }

  function spawnPattern() {
    if (eventMode === 'rush') spawnRushPattern();
    else if (eventMode === 'bonus') spawnBonusPattern();
    else spawnNormalPattern();
  }

  function startEvent(type) {
    eventMode = type;
    eventTimer = type === 'rush' ? 7.45 : 8.5;
    eventBanner = type === 'rush' ? '🌰 KURI RUSH!' : '⭐ BONUS RUN!';
    eventBannerTimer = 1.8;
    if (type === 'rush') {
      // Clear every dangerous chestnut in front of Tiranon, then leave a long
      // run-up so the first rush obstacle always enters visibly from offscreen.
      objects = objects.filter(o => o.type !== 'kuri' || o.x < player.x - 24);
      nextPattern = distance + W + 390;
      flash = 0;
      rushWarpTimer = RUSH_WARP_DURATION;
      popText('栗ラッシュ！ 準備！', W*.5, H*.32, '#dff8ff', .9, 22);
      beep(390, .08, 'sine', .035);
      setTimeout(() => beep(760, .11, 'sine', .028), 65);
    } else {
      nextPattern = Math.min(nextPattern, distance + W + 150);
      flash = .12;
      popText('ボーナスタイム！', W*.5, H*.32, '#fff1a0', 1.0, 22);
      beep(880, .12, 'square', .032);
    }
  }

  function updateEvents(dt) {
    eventBannerTimer = Math.max(0, eventBannerTimer - dt);
    if (eventMode !== 'normal') {
      eventTimer -= dt;
      if (eventTimer <= 0) {
        const ended = eventMode;
        eventMode = 'normal';
        eventCooldown = 22 + Math.random() * 12;
        eventBanner = '';
        if (ended === 'rush') {
          scoreFloat += 300;
          score = Math.floor(scoreFloat);
          flash = .18;
          popText('RUSH CLEAR! +300', W*.5, H*.30, '#ffe0a0', 1.0, 20);
          burst(player.x + player.w/2, player.y + player.h/2, '#ffb45f', 16, 150);
          beep(760, .09, 'square', .03);
        } else {
          popText('NICE BONUS!', W*.5, H*.30, '#fff5a8', .75, 17);
        }
      }
      return;
    }
    eventCooldown -= dt;
    if (eventCooldown <= 0 && player.fever <= 0) {
      startEvent(Math.random() < .56 ? 'rush' : 'bonus');
    }
  }

  function rectHit(a, b, pad=0) {
    return a.x + pad < b.x + b.w &&
      a.x + a.w - pad > b.x &&
      a.y + pad < b.y + b.h &&
      a.y + a.h - pad > b.y;
  }

  function verticalGap(a, b) {
    if (a.y > b.y + b.h) return a.y - (b.y + b.h);
    if (b.y > a.y + a.h) return b.y - (a.y + a.h);
    return 0;
  }

  function update(dt) {
    if (state !== 'playing') return;

    const sp = speed();
    const slowLevel = Math.max(1, itemLevel('slow'));
    const slowFactor = player.timeSlow > 0 ? Math.max(.46, .62 - (slowLevel - 1) * .04) : 1;
    const worldSp = sp * slowFactor;
    const prevBottom = player.y + player.h;

    distance += worldSp * dt;
    scoreFloat += (worldSp * dt / 18) * (player.fever > 0 ? 3 : 1);
    score = Math.floor(scoreFloat);

    const feverBefore = player.fever;
    player.runT += dt * sp / 95;
    player.squash = Math.max(0, player.squash - dt);
    player.magnet = Math.max(0, player.magnet - dt);
    player.giant = Math.max(0, player.giant - dt);
    player.fever = Math.max(0, player.fever - dt);
    player.timeSlow = Math.max(0, player.timeSlow - dt);
    player.wing = Math.max(0, player.wing - dt);
    player.invincible = Math.max(0, player.invincible - dt);
    if (feverBefore > 0 && player.fever <= 0) {
      player.invincible = Math.max(player.invincible, 1.6);
      popText('無敵タイム！', player.x + player.w*.55, player.y - 12, '#d9fbff', .85, 18);
      burst(player.x + player.w/2, player.y + player.h/2, '#bff7ff', 14, 135);
      beep(700, .08, 'sine', .024);
    }

    if (comboTimer > 0) {
      comboTimer -= dt;
      if (comboTimer <= 0) resetCombo();
    }
    rushWarpTimer = Math.max(0, rushWarpTimer - dt);
    roarFx = Math.max(0, roarFx - dt);
    updateEvents(dt);

    const targetSize = player.giant > 0 ? 76 : 48;
    if (Math.abs(player.w - targetSize) > .5) {
      const oldBottom = player.y + player.h;
      player.w += (targetSize - player.w) * Math.min(1, dt * 10);
      player.h = player.w;
      player.y = oldBottom - player.h;
    } else {
      player.w = player.h = targetSize;
    }

    const wingLevel = Math.max(1, itemLevel('wing'));
    const gravity = player.wing > 0 ? Math.max(620, 980 - (wingLevel - 1) * 90) : 1850;
    player.vy += gravity * dt;
    if (player.wing > 0 && player.vy > 0) {
      player.vy = Math.min(player.vy, Math.max(220, 340 - (wingLevel - 1) * 25));
    }
    player.y += player.vy * dt;

    for (const o of objects) {
      if (o.type !== 'spring') continue;
      const bottom = player.y + player.h;
      const horizontal = player.x + player.w*.72 > o.x && player.x + player.w*.20 < o.x + o.w;
      if (!o.used && horizontal && player.vy >= 0 && bottom >= o.y && prevBottom <= o.y + 18) {
        o.used = true;
        player.y = o.y - player.h;
        player.vy = -930;
        player.jumps = 1;
        player.squash = .12;
        popText(o.route ? 'HIGH ROUTE! ★×2' : 'SUPER JUMP!', player.x + player.w*.8, player.y - 10, '#ffe66b', o.route ? .9 : .75, 17);
        burst(player.x + player.w*.45, o.y, '#ffd34f', 14, 160);
        beep(930, .08, 'square', .035);
      }
    }

    for (const o of objects) {
      if (o.type !== 'platform') continue;
      const bottom = player.y + player.h;
      if (
        player.vy >= 0 &&
        prevBottom <= o.y + 10 &&
        bottom >= o.y &&
        player.x + player.w * .78 > o.x &&
        player.x + player.w * .18 < o.x + o.w
      ) {
        player.y = o.y - player.h;
        player.vy = 0;
        player.jumps = 0;
      }
    }

    if (player.y + player.h >= groundY) {
      player.y = groundY - player.h;
      player.vy = 0;
      player.jumps = 0;
    }

    for (const o of objects) o.x -= worldSp * dt;

    // Magnet is intentionally a coin-only powerup. FEVER also vacuums coins,
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

    const pbox = {
      x: player.x + player.w * .18,
      y: player.y + player.h * .12,
      w: player.w * .64,
      h: player.h * .78
    };

    for (let i = objects.length - 1; i >= 0; i--) {
      const o = objects[i];
      if (o.x + o.w < -70) {
        objects.splice(i, 1);
        continue;
      }
      if (o.type === 'platform' || o.type === 'spring') continue;

      if (o.type === 'kuri' && rectHit(pbox, o, 4)) {
        if (player.invincible > 0) {
          burst(o.x + o.w/2, o.y + o.h/2, '#bff7ff', 8, 125);
          objects.splice(i, 1);
          beep(560, .035, 'sine', .016);
          continue;
        }
        if (player.giant > 0 || player.fever > 0) {
          burst(o.x + o.w/2, o.y + o.h/2, '#a8673e', 12, 180);
          objects.splice(i, 1);
          scoreFloat += 25 * comboMultiplier();
          score = Math.floor(scoreFloat);
          beep(190, .04, 'square', .03);
          continue;
        }
        if (player.shield) {
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
        beginDamageGameOver();
        return;
      }

      if ((o.type === 'letter' || o.type === 'item' || o.type === 'bonus' || o.type === 'coin') && rectHit(pbox, o, -2)) {
        if (o.type === 'letter') collectLetter(o);
        else if (o.type === 'item') collectItem(o);
        else if (o.type === 'coin') collectCoin(o);
        else collectBonus(o);
        objects.splice(i, 1);
        continue;
      }

      if (o.type === 'kuri' && !o.passed && o.x + o.w < pbox.x - 3) {
        const near = verticalGap(pbox, o) <= 22;
        registerAvoid(o, near);
      }
    }

    if (distance + W > nextPattern) spawnPattern();

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
      p.vx *= .985;
      if (p.life <= 0) particles.splice(i, 1);
    }

    for (let i = pickupEffects.length - 1; i >= 0; i--) {
      pickupEffects[i].life -= dt;
      if (pickupEffects[i].life <= 0) pickupEffects.splice(i, 1);
    }

    for (let i = floatTexts.length - 1; i >= 0; i--) {
      const f = floatTexts[i];
      f.life -= dt;
      f.y -= 24 * dt;
      if (f.life <= 0) floatTexts.splice(i, 1);
    }

    shake = Math.max(0, shake - dt * 24);
    flash = Math.max(0, flash - dt);
    updateHud();
  }

  function collectCoin(o) {
    const gain = Math.max(1, Number(o.value || 1));
    runCoins += gain;
    scoreFloat += 5 * gain;
    score = Math.floor(scoreFloat);
    burst(o.x + o.w/2, o.y + o.h/2, '#ffd34e', 7, 90);
    beep(760 + Math.min(5, runCoins % 6) * 28, .028, 'sine', .014);
  }

  function collectLetter(o) {
    if (o.letter !== WORD[collected]) return;
    collected++;
    scoreFloat += 20 * comboMultiplier();
    score = Math.floor(scoreFloat);
    burst(o.x + o.w/2, o.y + o.h/2, '#ffd85a', 14, 145);
    beep(620 + collected * 45, .075, 'sine', .045);
    if (collected >= WORD.length) {
      collected = 0;
      player.fever = 8;
      flash = .10;
      eventMode = 'normal';
      eventTimer = 0;
      eventCooldown = Math.max(eventCooldown, 10);
      burst(player.x + player.w/2, player.y + player.h/2, '#ffca43', 28, 240);
      popText('TIRAKURI FEVER!', W*.5, H*.30, '#ffca43', 1.1, 23);
      beep(920, .22, 'square', .04);
    }
  }

  function pickupPop(o, color) {
    pickupEffects.push({
      item: o.item,
      x: o.x + o.w / 2,
      y: o.y + o.h / 2,
      life: .34,
      maxLife: .34,
      color
    });
  }

  function collectItem(o) {
    scoreFloat += 15 * comboMultiplier();
    score = Math.floor(scoreFloat);
    if (o.item === 'shield') {
      player.shield = true;
      pickupPop(o, '#8de8ff');
      beep(760, .11, 'sine', .04);
      burst(o.x + o.w/2, o.y + o.h/2, '#8de8ff', 16, 145);
    }
    if (o.item === 'magnet') {
      player.magnet = 8;
      pickupPop(o, '#ff9b9b');
      beep(520, .11, 'sine', .04);
      burst(o.x + o.w/2, o.y + o.h/2, '#ef8d8d', 16, 145);
    }
    if (o.item === 'giant') {
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
  }

  function collectBonus(o) {
    const value = o.value || 1;
    const gain = 28 * value * Math.max(1, comboMultiplier());
    scoreFloat += gain;
    score = Math.floor(scoreFloat);
    burst(o.x + o.w/2, o.y + o.h/2, o.premium ? '#ffd04b' : '#ffe36d', o.premium ? 11 : 8, 110);
    if (o.routeCue) {
      popText(`HIGH ROUTE +${gain}`, o.x + o.w/2, o.y - 10, '#ffe66b', .8, 17);
      beep(900, .06, 'sine', .025);
    } else {
      beep(720 + Math.random()*90, .035, 'sine', .018);
    }
  }

  function updateHud() {
    scoreEl.textContent = score;
    bestEl.textContent = '/ ' + Math.max(best, score);
    coinHudEl.textContent = `🪙 ${wallet + runCoins}`;
    let html = '';
    for (let i=0; i<WORD.length; i++) {
      html += `<span style="color:${i<collected?'#f39b22':'#61766f'};opacity:${i<collected?1:.55}">${WORD[i]}</span>${i<WORD.length-1?' ':''}`;
    }
    lettersEl.innerHTML = html;
    shieldBuff.style.display = player.shield ? 'block' : 'none';
    magnetBuff.style.display = player.magnet > 0 ? 'block' : 'none';
    giantBuff.style.display = player.giant > 0 ? 'block' : 'none';
    feverBuff.style.display = player.fever > 0 ? 'block' : 'none';
    timeBuff.style.display = player.timeSlow > 0 ? 'block' : 'none';
    wingBuff.style.display = player.wing > 0 ? 'block' : 'none';
  }

  function burst(x, y, color, n=8, power=120) {
    for (let i=0; i<n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = power * (.35 + Math.random() * .75);
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: .35 + Math.random() * .45,
        color,
        r: 2 + Math.random() * 4
      });
    }
  }

  function roundedRect(x,y,w,h,r) {
    ctx.beginPath();
    ctx.roundRect(x,y,w,h,r);
  }

  function drawSprite(name, x, y, w, h) {
    const image = sprites[name];
    if (!image || !image.complete || !image.naturalWidth) return false;
    const scale = Math.min(w / image.naturalWidth, h / image.naturalHeight);
    const dw = image.naturalWidth * scale;
    const dh = image.naturalHeight * scale;
    ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    return true;
  }

  function drawBackground() {
    const meters = Math.floor(distance / 18);
    const st = stages[Math.floor(meters / 450) % stages.length];
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0, st.sky1);
    grad.addColorStop(1, st.sky2);
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H);

    const dark = st.name === 'ほしぞら';
    if (dark) {
      ctx.fillStyle = '#fffbd9';
      for (let i=0;i<22;i++) {
        const x = (i*83 - distance*.02) % (W+80);
        const y = 40 + (i*47)%220;
        ctx.globalAlpha = .4 + (i%4)*.13;
        ctx.fillRect((x+W+80)%(W+80)-20, y, 2, 2);
      }
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(W*.78,H*.15,28,0,Math.PI*2);
      ctx.fillStyle = '#fff2b4';
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(W*.78,H*.15,30,0,Math.PI*2);
      ctx.fillStyle = '#fff4a7';
      ctx.fill();
    }

    ctx.fillStyle = st.far;
    ctx.beginPath();
    ctx.moveTo(0,groundY);
    for (let x=0;x<=W+80;x+=80) {
      const off = (distance*.055)%80;
      ctx.lineTo(x-off, groundY-75-28*Math.sin((x+distance*.055)/115));
    }
    ctx.lineTo(W,groundY);
    ctx.fill();

    ctx.fillStyle = st.hill;
    ctx.beginPath();
    ctx.moveTo(0,groundY);
    for (let x=0;x<=W+120;x+=60) {
      const off = (distance*.11)%60;
      ctx.lineTo(x-off, groundY-36-18*Math.sin((x+distance*.11)/82));
    }
    ctx.lineTo(W,groundY);
    ctx.fill();

    ctx.fillStyle = st.ground;
    ctx.fillRect(0,groundY,W,H-groundY);
    ctx.fillStyle = st.dirt;
    ctx.fillRect(0,groundY+16,W,H-groundY-16);

    ctx.fillStyle = '#ffffff3b';
    for (let i=0;i<12;i++) {
      let x=(i*91-distance*.6)%(W+90);
      x=(x+W+90)%(W+90)-30;
      ctx.fillRect(x,groundY+6+(i%2)*22,20+(i%3)*10,3);
    }
  }

  function drawPlatform(o) {
    ctx.fillStyle = '#7fbd79';
    roundedRect(o.x,o.y,o.w,o.h,8);
    ctx.fill();
    ctx.fillStyle = '#c19467';
    ctx.fillRect(o.x+5,o.y+12,o.w-10,10);
    ctx.fillStyle = '#ffffff55';
    ctx.fillRect(o.x+10,o.y+3,Math.max(8,o.w*.24),3);
  }

  function drawSpring(o) {
    ctx.save();
    ctx.fillStyle = '#f8b93f';
    roundedRect(o.x, o.y, o.w, o.h, 6);
    ctx.fill();
    ctx.fillStyle = '#fff0a0';
    ctx.fillRect(o.x + 7, o.y + 2, o.w - 14, 3);
    ctx.strokeStyle = '#9c6b24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(o.x + 8, o.y + o.h);
    ctx.lineTo(o.x + 16, o.y + o.h + 7);
    ctx.lineTo(o.x + 25, o.y + o.h);
    ctx.lineTo(o.x + 34, o.y + o.h + 7);
    ctx.lineTo(o.x + 43, o.y + o.h);
    ctx.stroke();
    ctx.restore();
  }

  function drawKuri(o) {
    const size = Math.max(o.w, o.h) * 1.34;
    if (drawSprite('kuri', o.x + o.w/2 - size/2, o.y + o.h - size, size, size)) return;
    const cx=o.x+o.w/2, cy=o.y+o.h/2;
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(-.08);
    ctx.fillStyle='#7d472d';
    ctx.beginPath();
    ctx.moveTo(-o.w*.43,o.h*.12);
    ctx.quadraticCurveTo(-o.w*.25,-o.h*.56,0,-o.h*.48);
    ctx.quadraticCurveTo(o.w*.33,-o.h*.5,o.w*.44,o.h*.1);
    ctx.quadraticCurveTo(0,o.h*.66,-o.w*.43,o.h*.12);
    ctx.fill();
    ctx.fillStyle='#c6814a';
    ctx.beginPath();
    ctx.moveTo(-o.w*.4,o.h*.08);
    ctx.quadraticCurveTo(0,o.h*.38,o.w*.4,o.h*.08);
    ctx.quadraticCurveTo(.15*o.w,.55*o.h,-.15*o.w,.5*o.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle='#6c3d29';
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(-5,-o.h*.43);
    ctx.lineTo(0,-o.h*.62);
    ctx.lineTo(5,-o.h*.44);
    ctx.stroke();
    ctx.restore();
  }

  function drawBubble(o,label,bg='#fff') {
    ctx.fillStyle=bg;
    ctx.beginPath();
    ctx.arc(o.x+o.w/2,o.y+o.h/2,o.w*.58,0,Math.PI*2);
    ctx.fill();
    ctx.strokeStyle='#ffffff';
    ctx.lineWidth=3;
    ctx.stroke();
    ctx.fillStyle='#315b50';
    ctx.font='900 19px system-ui';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText(label,o.x+o.w/2,o.y+o.h/2+1);
  }

  function drawCoin(o) {
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
    const cx = o.x + o.w/2;
    const cy = o.y + o.h/2;
    ctx.save();
    ctx.shadowColor = o.premium ? '#ffb933' : '#ffd84d';
    ctx.shadowBlur = o.premium ? 16 : 10;
    ctx.fillStyle = o.premium ? '#ffd44f' : '#ffe36d';
    ctx.beginPath();
    ctx.arc(cx, cy, o.w*.48, 0, Math.PI*2);
    ctx.fill();
    if (o.premium) {
      ctx.strokeStyle = '#fff3a6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, o.w*.61, 0, Math.PI*2);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff7bd';
    ctx.font = o.premium ? '900 14px system-ui' : '900 13px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', cx, cy-1);
    if (o.premium) {
      ctx.font = '900 8px system-ui';
      ctx.fillText('×2', cx, cy+9);
    }
    ctx.restore();
  }

  function drawPlayer() {
    const p=player;
    const airborne=p.y+p.h<groundY-2;
    ctx.save();
    const bob=!airborne?Math.sin(p.runT)*2:0;
    ctx.translate(p.x+p.w/2,p.y+p.h/2+bob);
    let sx=1,sy=1;
    if(p.squash>0){sx=1.08;sy=.92;}
    ctx.scale(sx,sy);

    if(p.invincible>0){
      const blink = .58 + .42 * Math.abs(Math.sin(performance.now() * .022));
      ctx.globalAlpha = blink;
      ctx.shadowColor = '#bff7ff';
      ctx.shadowBlur = 12;
    }
    if(p.fever>0){ctx.shadowColor='#ffd33d';ctx.shadowBlur=18;}
    if(p.shield){
      ctx.strokeStyle='#8de8ff';ctx.lineWidth=5;ctx.globalAlpha=.7;
      ctx.beginPath();ctx.arc(0,0,p.w*.84,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    }

    const spriteName = state === 'damage' || performance.now() < p.damageUntil
      ? 'damage'
      : airborne
        ? 'jump'
        : Math.floor(p.runT * 2.2) % 2 ? 'run1' : 'run2';
    const visualSize = p.w * (spriteName === 'damage' ? 1.72 : 1.68);
    if (drawSprite(spriteName, -visualSize/2, p.h/2-visualSize, visualSize, visualSize)) {
      ctx.restore();
      return;
    }

    ctx.fillStyle='#76cbb4';
    ctx.beginPath();
    ctx.moveTo(-p.w*.30,p.h*.06);
    ctx.quadraticCurveTo(-p.w*.78,p.h*.18,-p.w*.68,p.h*.38);
    ctx.quadraticCurveTo(-p.w*.38,p.h*.28,-p.w*.18,p.h*.19);
    ctx.closePath();ctx.fill();

    ctx.fillStyle='#f2ad48';
    for(let i=0;i<3;i++){
      const x=-p.w*.17+i*p.w*.15;
      ctx.beginPath();
      ctx.moveTo(x,-p.h*.34);
      ctx.lineTo(x+p.w*.08,-p.h*.58+(i===1?-2:3));
      ctx.lineTo(x+p.w*.14,-p.h*.31);
      ctx.closePath();ctx.fill();
    }

    ctx.fillStyle='#78cdb7';
    ctx.beginPath();ctx.ellipse(-p.w*.02,p.h*.05,p.w*.35,p.h*.39,-.2,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(p.w*.18,-p.h*.16,p.w*.34,p.h*.28,.1,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#82d5be';
    ctx.beginPath();ctx.ellipse(p.w*.34,-p.h*.08,p.w*.27,p.h*.16,.02,0,Math.PI*2);ctx.fill();

    ctx.fillStyle='#fff';
    ctx.beginPath();ctx.arc(p.w*.25,-p.h*.24,p.w*.09,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#203c35';
    ctx.beginPath();ctx.arc(p.w*.28,-p.h*.24,p.w*.038,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#3b7668';
    ctx.beginPath();ctx.arc(p.w*.43,-p.h*.11,p.w*.025,0,Math.PI*2);ctx.fill();

    ctx.strokeStyle='#3f6d62';ctx.lineWidth=Math.max(2,p.w*.035);ctx.lineCap='round';
    ctx.beginPath();ctx.arc(p.w*.30,-p.h*.06,p.w*.12,.25,1.6);ctx.stroke();
    ctx.strokeStyle='#66bba5';ctx.lineWidth=p.w*.11;
    ctx.beginPath();ctx.moveTo(p.w*.16,p.h*.08);ctx.lineTo(p.w*.30,p.h*.18);ctx.stroke();

    ctx.strokeStyle='#5db39d';ctx.lineWidth=p.w*.14;ctx.lineCap='round';
    const leg=Math.sin(p.runT)*p.w*.10;
    ctx.beginPath();
    ctx.moveTo(-p.w*.10,p.h*.28);ctx.lineTo(-p.w*.16+leg,p.h*.46);
    ctx.moveTo(p.w*.12,p.h*.28);ctx.lineTo(p.w*.15-leg,p.h*.46);
    ctx.stroke();
    ctx.restore();
  }

  function drawLoadoutCosmetics() {
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
    for (const fx of pickupEffects) {
      const progress = 1 - fx.life / fx.maxLife;
      const pop = 1 + Math.sin(Math.PI * progress) * .28;
      const base = 46;
      const size = base * pop;
      const alpha = Math.max(0, Math.min(1, fx.life / .18));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = fx.color;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, 24 + progress * 18, 0, Math.PI * 2);
      ctx.stroke();
      if (!drawSprite(fx.item, fx.x - size/2, fx.y - size/2, size, size)) {
        const pickupLabels = {roar:'ガオ', slow:'時', wing:'羽'};
        if (pickupLabels[fx.item]) {
          ctx.fillStyle = fx.item === 'slow' ? '#2d7d98' : fx.item === 'wing' ? '#79629a' : '#8d4b20';
          ctx.font = '900 13px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pickupLabels[fx.item], fx.x, fx.y);
        }
      }
      ctx.restore();
    }
  }

  function drawRoarEffect() {
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

  function drawFeverEffect() {
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

  function drawEventAtmosphere() {
    if (eventMode !== 'rush') return;
    ctx.save();
    const pulse = .5 + Math.sin(performance.now() * .012) * .5;
    ctx.fillStyle = `rgba(150, 65, 25, ${0.045 + pulse * 0.018})`;
    ctx.fillRect(0, 0, W, groundY);
    ctx.strokeStyle = `rgba(255, 221, 170, ${0.18 + pulse * 0.08})`;
    ctx.lineWidth = 2;
    for (let i=0; i<9; i++) {
      const y = H*.27 + ((i*63 + distance*1.45) % Math.max(90, groundY-H*.27-25));
      const x = W - ((i*91 + distance*1.9) % (W+180));
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 48, y - 8);
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(255, 122, 53, ${0.035 + pulse * .02})`;
    ctx.fillRect(0, groundY - 8, W, 8);
    ctx.restore();
  }

  function drawRunUI() {
    if (combo >= 2) {
      const mult = comboMultiplier();
      ctx.save();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = '900 14px system-ui';
      ctx.fillStyle = '#fffdf1e8';
      roundedRect(14, 82, 112, 39, 13);
      ctx.fill();
      ctx.fillStyle = '#5a4a2b';
      ctx.fillText(`COMBO ${combo}`, 26, 90);
      if (mult > 1) {
        ctx.fillStyle = '#e58b2b';
        ctx.fillText(`×${mult}`, 94, 90);
      }
      ctx.restore();
    }

    if (eventMode !== 'normal' || eventBannerTimer > 0) {
      const label = eventMode === 'rush'
        ? `🌰 KURI RUSH  ${Math.max(0,eventTimer).toFixed(1)}`
        : eventMode === 'bonus'
          ? `⭐ BONUS RUN  ${Math.max(0,eventTimer).toFixed(1)}`
          : eventBanner;
      if (label) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '900 17px system-ui';
        const w = Math.min(210, ctx.measureText(label).width + 38);
        ctx.fillStyle = eventMode === 'rush' ? '#fff1dfeb' : '#fff9cdeb';
        roundedRect(W/2-w/2, H*.205, w, 38, 17);
        ctx.fill();
        ctx.fillStyle = eventMode === 'rush' ? '#9b5630' : '#8b7220';
        ctx.fillText(label, W/2, H*.205 + 19);
        ctx.restore();
      }
    }

    for (const f of floatTexts) {
      const a = Math.max(0, Math.min(1, f.life / Math.min(.25, f.maxLife)));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${f.size}px system-ui`;
      ctx.fillStyle = f.color;
      ctx.shadowColor = '#23443c99';
      ctx.shadowBlur = 5;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  }

  function draw() {
    ctx.save();
    if (shake > 0) ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
    drawBackground();
    drawEventAtmosphere();

    for (const o of objects) if (o.type==='platform') drawPlatform(o);
    for (const o of objects) if (o.type==='spring') drawSpring(o);
    for (const o of objects) {
      if (o.type==='kuri') drawKuri(o);
      if (o.type==='letter') drawBubble(o,o.letter,'#ffe48a');
      if (o.type==='bonus') drawBonus(o);
      if (o.type==='coin') drawCoin(o);
      if (o.type==='item') {
        const pad = 6;
        if (!drawSprite(o.item, o.x-pad, o.y-pad, o.w+pad*2, o.h+pad*2)) {
          const labels = {shield:'S', magnet:'M', giant:'G', roar:'ガオ', slow:'時', wing:'羽'};
          const colors = {shield:'#bfeeff', magnet:'#ffd0d0', giant:'#c9f2a9', roar:'#ffd8a8', slow:'#c8f2ff', wing:'#eee0ff'};
          drawBubble(o, labels[o.item] || '?', colors[o.item] || '#fff');
        }
      }
    }

    drawPickupEffects();
    drawPlayer();
    drawLoadoutCosmetics();
    drawFeverEffect();
    drawRoarEffect();
    drawRushWarpEffect();

    for (const p of particles) {
      ctx.globalAlpha=Math.max(0,p.life/.7);
      ctx.fillStyle=p.color;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;

    drawRunUI();

    if(flash>0){
      ctx.globalAlpha=Math.min(.65,flash*2.1);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
    }
    ctx.restore();
  }

  function loop(t) {
    const dt = Math.min(.032, (t-last)/1000 || 0);
    last = t;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  renderShop();
  requestAnimationFrame(loop);
})();