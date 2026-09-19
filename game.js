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
  const pauseBtn = document.getElementById('pauseBtn');
  const pausePanel = document.getElementById('pausePanel');
  const resumeBtn = document.getElementById('resumeBtn');
  const shieldBuff = document.getElementById('shieldBuff');
  const magnetBuff = document.getElementById('magnetBuff');
  const giantBuff = document.getElementById('giantBuff');
  const feverBuff = document.getElementById('feverBuff');
  const timeBuff = document.getElementById('timeBuff');
  const wingBuff = document.getElementById('wingBuff');
  const coinHudEl = document.getElementById('coinHud');
  const goalHudEl = document.getElementById('goalHud');
  const distanceHudEl = document.getElementById('distanceHud');
  const cardEl = document.getElementById('card');
  const shopBtn = document.getElementById('shopBtn');
  const shopPanel = document.getElementById('shopPanel');
  const shopCloseBtn = document.getElementById('shopCloseBtn');
  const shopCoinsEl = document.getElementById('shopCoins');
  const shopSlotsEl = document.getElementById('shopSlots');
  const shopRankEl = document.getElementById('shopRank');
  const shopItemsEl = document.getElementById('shopItems');
  const shopNoteEl = document.getElementById('shopNote');
  const userHudEl = document.getElementById('userHud');
  const profileLevelEl = document.getElementById('profileLevel');
  const profileGemsEl = document.getElementById('profileGems');
  const profileTotalEl = document.getElementById('profileTotal');
  const profileNextEl = document.getElementById('profileNext');
  const profileProgressEl = document.getElementById('profileProgress');
  const characterBtn = document.getElementById('characterBtn');
  const characterPanel = document.getElementById('characterPanel');
  const characterCloseBtn = document.getElementById('characterCloseBtn');
  const characterItemsEl = document.getElementById('characterItems');
  const characterGemsEl = document.getElementById('characterGems');
  const characterNoteEl = document.getElementById('characterNote');
  const characterEffectHudEl = document.getElementById('characterEffectHud');

  const WORD = 'TIRAKURI';
  const LS_BEST = 'tirakuri-best-v2';
  const LS_COINS = 'tirakuri-coins-v1';
  const LS_RUNS = 'tirakuri-runs-v1';
  const LS_OWNED = 'tirakuri-owned-v1';
  const LS_LEVELS = 'tirakuri-levels-v1';
  const LS_LOADOUT = 'tirakuri-loadout-v1';
  const LS_TOTAL_SCORE = 'tirakuri-total-score-v1';
  const LS_USER_LEVEL = 'tirakuri-user-level-v1';
  const LS_GEMS = 'tirakuri-gems-v1';
  const LS_SELECTED_CHARACTER = 'tirakuri-selected-character-v1';
  const LS_CHARACTER_LEVELS = 'tirakuri-character-levels-v1';
  const LS_BEST_DISTANCE = 'tirakuri-best-distance-v1';

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function userLevelThreshold(level) {
    if (level <= 1) return 0;
    return Math.round((4000 * Math.pow(level - 1, 1.55)) / 500) * 500;
  }

  function userLevelFromScore(total) {
    let level = 1;
    while (level < 99 && total >= userLevelThreshold(level + 1)) level++;
    return level;
  }

  function gemRewardForLevel(level) {
    return level > 1 && level % 5 === 0 ? 3 : 1;
  }

  function gemsThroughLevel(level) {
    let total = 0;
    for (let lv = 2; lv <= level; lv++) total += gemRewardForLevel(lv);
    return total;
  }

  let best = Number(localStorage.getItem(LS_BEST) || 0);
  let bestDistance = Math.max(0, Number(localStorage.getItem(LS_BEST_DISTANCE) || 0));
  let wallet = Math.max(0, Number(localStorage.getItem(LS_COINS) || 0));
  let totalRuns = Math.max(0, Number(localStorage.getItem(LS_RUNS) || 0));
  const storedTotalScore = localStorage.getItem(LS_TOTAL_SCORE);
  let totalScore = Math.max(0, Number(storedTotalScore === null ? best : storedTotalScore) || 0);
  const calculatedUserLevel = userLevelFromScore(totalScore);
  let userLevel = Math.max(calculatedUserLevel, Number(localStorage.getItem(LS_USER_LEVEL) || 1) || 1);
  const storedGems = localStorage.getItem(LS_GEMS);
  let gems = Math.max(0, Number(storedGems === null ? gemsThroughLevel(userLevel) : storedGems) || 0);
  let runCoins = 0;
  let owned = readJson(LS_OWNED, {shield:true, magnet:true, giant:true, roar:false, slow:false, wing:false});
  let levels = readJson(LS_LEVELS, {shield:1, magnet:1, giant:1, roar:0, slow:0, wing:0});
  let loadout = readJson(LS_LOADOUT, ['shield','magnet','giant']);
  let selectedCharacter = localStorage.getItem(LS_SELECTED_CHARACTER) || 'tiranon';
  let characterLevels = readJson(LS_CHARACTER_LEVELS, {tiranon:1, mininon:1, stegon:1, pteran:1});

  const ITEM_CATALOG = {
    shield: {name:'シールド', icon:'🛡️', desc:'1回だけ栗を防ぐ', basic:true, rank:0, maxLevel:1},
    magnet: {name:'マグネット', icon:'🧲', desc:'近くのコインだけを引き寄せる', basic:true, rank:0, maxLevel:1},
    giant: {name:'巨大化', icon:'🍖', desc:'大きくなって栗を壊す', basic:true, rank:0, maxLevel:1},
    roar: {
      name:'ガオー！', icon:'🗣️', desc:'咆哮で前方の栗をまとめて吹き飛ばす',
      price:300, rank:1, maxLevel:5,
      upgradeCosts:[180,400,800,1400]
    },
    slow: {
      name:'タイムどんぐり', icon:'⏳', desc:'数秒間、栗とステージの流れをスローにする',
      price:500, rank:1, maxLevel:5,
      upgradeCosts:[300,650,1200,2000]
    },
    wing: {
      name:'プテランの羽', icon:'🪽', desc:'一定時間ふわっと浮いて、落下をゆっくりにする',
      price:750, rank:1, maxLevel:5,
      upgradeCosts:[420,850,1500,2400]
    }
  };

  const CHARACTER_CATALOG = {
    tiranon: {
      name:'ティラノン', icon:'🦖', unlockLevel:1, maxLevel:10,
      preview:'1218B0FC-C2A9-4661-8707-C27D900A8992.png',
      desc:'ティラクリの主人公。元気いっぱいに走るノン！',
      trait:'スタンダード', traitDesc:'Lvで走行SCOREが上昇。Lv5・10でCHAIN CLEARボーナスも伸びる。'
    },
    mininon: {
      name:'ミニノン', icon:'🐣', unlockLevel:3, maxLevel:10,
      preview:'97A7C3F6-D44A-4770-A6CF-55052F221207.png',
      desc:'黄色い幼稚園服で元気いっぱい。USER Lv.3で仲間入り！',
      trait:'ちいさな体', traitDesc:'Lvでコインボーナスと小さな当たり判定がさらに強化される。'
    },
    stegon: {
      name:'ステゴン', icon:'🦕', unlockLevel:6, maxLevel:10,
      preview:'8EF97C48-064E-4EDC-95DA-7EB00DA5F1D1.png',
      desc:'どっしり走る、やさしいステゴサウルス。',
      trait:'ステゴンガード', traitDesc:'Lvで再使用が短縮。Lv5でガード後無敵、Lv10で前方の栗も連鎖破壊。'
    },
    pteran: {
      name:'プテラン', icon:'🪽', unlockLevel:10, maxLevel:10,
      preview:'D1D9FF27-0E76-4D9C-8F0E-862356577F01.png',
      desc:'翼を広げて駆ける、空が得意な仲間。',
      trait:'滑空', traitDesc:'長押しで滑空、離すと急降下。急降下中に再長押しでふわっと再浮上。Lv5・10で操作性能UP。'
    }
  };

  owned = Object.assign({shield:true, magnet:true, giant:true, roar:false, slow:false, wing:false}, owned || {});
  owned.shield = owned.magnet = owned.giant = true;
  levels = Object.assign({shield:1, magnet:1, giant:1, roar:0, slow:0, wing:0}, levels || {});
  loadout = Array.isArray(loadout) ? loadout.filter((id, i, a) => ITEM_CATALOG[id] && owned[id] && a.indexOf(id) === i).slice(0,5) : [];
  if (!loadout.length) loadout = ['shield','magnet','giant'];
  characterLevels = Object.assign({tiranon:1, mininon:1, stegon:1, pteran:1}, characterLevels || {});
  for (const id of Object.keys(CHARACTER_CATALOG)) {
    characterLevels[id] = Math.max(1, Math.min(CHARACTER_CATALOG[id].maxLevel, Number(characterLevels[id] || 1)));
  }
  if (!CHARACTER_CATALOG[selectedCharacter] || CHARACTER_CATALOG[selectedCharacter].coming || userLevel < CHARACTER_CATALOG[selectedCharacter].unlockLevel) {
    selectedCharacter = 'tiranon';
  }

  function saveProgress() {
    localStorage.setItem(LS_COINS, String(wallet));
    localStorage.setItem(LS_RUNS, String(totalRuns));
    localStorage.setItem(LS_OWNED, JSON.stringify(owned));
    localStorage.setItem(LS_LEVELS, JSON.stringify(levels));
    localStorage.setItem(LS_LOADOUT, JSON.stringify(loadout));
    localStorage.setItem(LS_TOTAL_SCORE, String(totalScore));
    localStorage.setItem(LS_USER_LEVEL, String(userLevel));
    localStorage.setItem(LS_GEMS, String(gems));
    localStorage.setItem(LS_SELECTED_CHARACTER, selectedCharacter);
    localStorage.setItem(LS_CHARACTER_LEVELS, JSON.stringify(characterLevels));
  }

  function rankItems(rank) {
    return Object.entries(ITEM_CATALOG)
      .filter(([, item]) => !item.basic && (item.rank || 1) === rank)
      .map(([id]) => id);
  }

  function isRankComplete(rank) {
    const ids = rankItems(rank);
    return ids.length > 0 && ids.every(id => !!owned[id]);
  }

  function currentItemRank() {
    let rank = 1;
    while (rank < 20 && isRankComplete(rank)) rank++;
    return rank;
  }

  function isItemUnlocked(id) {
    const item = ITEM_CATALOG[id];
    if (!item) return false;
    if (item.basic) return true;
    return (item.rank || 1) <= currentItemRank();
  }

  function updateProfileUi() {
    const nextThreshold = userLevelThreshold(userLevel + 1);
    const currentThreshold = userLevelThreshold(userLevel);
    const span = Math.max(1, nextThreshold - currentThreshold);
    const progress = userLevel >= 99 ? 1 : Math.max(0, Math.min(1, (totalScore - currentThreshold) / span));
    if (userHudEl) userHudEl.textContent = `USER Lv.${userLevel}　💎 ${gems}`;
    if (profileLevelEl) profileLevelEl.textContent = `USER Lv.${userLevel}`;
    if (profileGemsEl) profileGemsEl.textContent = `💎 ${gems}`;
    if (profileTotalEl) profileTotalEl.textContent = `累計SCORE ${totalScore.toLocaleString()}`;
    if (profileNextEl) profileNextEl.textContent = userLevel >= 99 ? 'MAX LEVEL' : `次のUSER Lvまで ${(nextThreshold - totalScore).toLocaleString()}`;
    if (profileProgressEl) profileProgressEl.style.width = `${Math.round(progress * 100)}%`;
    if (shopRankEl) shopRankEl.textContent = `ITEM RANK ${currentItemRank()}`;
    if (characterGemsEl) characterGemsEl.textContent = `💎 ${gems}`;
    if (characterBtn && CHARACTER_CATALOG[selectedCharacter]) characterBtn.textContent = `${CHARACTER_CATALOG[selectedCharacter].icon} キャラ`;
  }

  function isCharacterUnlocked(id) {
    const ch = CHARACTER_CATALOG[id];
    return !!ch && userLevel >= ch.unlockLevel;
  }

  function characterLevel(id) {
    return Math.max(1, Number(characterLevels[id] || 1));
  }

  function characterUpgradeCost(id) {
    const lv = characterLevel(id);
    return Math.max(1, Math.min(6, Math.ceil(lv / 2)));
  }

  function tiranonScoreBonus(lv) {
    return Math.max(0, Math.min(9, lv - 1));
  }

  function tiranonChainBonusRate(lv) {
    return lv >= 10 ? .20 : lv >= 5 ? .10 : 0;
  }

  function mininonCoinBonusRate(lv) {
    return .06 + (lv - 1) * .012 + (lv >= 5 ? .04 : 0) + (lv >= 10 ? .04 : 0);
  }

  function mininonShrinkForLevel(lv) {
    return Math.min(.08, .03 + (lv - 1) * .004 + (lv >= 5 ? .008 : 0) + (lv >= 10 ? .008 : 0));
  }

  function stegonCooldownForLevel(lv) {
    return Math.max(8.8, 16 - (lv - 1) * .8);
  }

  function pteranGravityForLevel(lv) {
    return Math.max(1120, 1500 - (lv - 1) * 35 - (lv >= 5 ? 30 : 0) - (lv >= 10 ? 35 : 0));
  }

  function pteranFallCapForLevel(lv) {
    return Math.max(340, 520 - (lv - 1) * 16 - (lv >= 5 ? 15 : 0) - (lv >= 10 ? 20 : 0));
  }

  function pteranAirScoreBonus(lv) {
    return lv >= 10 ? 15 : lv >= 5 ? 8 : 0;
  }

  function pteranGlideMaxSeconds(lv) {
    return 1.8 + (lv - 1) * .18 + (lv >= 5 ? .35 : 0) + (lv >= 10 ? .45 : 0);
  }

  function pteranReopenCost(lv) {
    return Math.max(.20, .42 - (lv - 1) * .015 - (lv >= 5 ? .04 : 0) - (lv >= 10 ? .03 : 0));
  }

  function pteranReopenLift(lv) {
    return 70 + (lv - 1) * 6 + (lv >= 5 ? 25 : 0) + (lv >= 10 ? 35 : 0);
  }

  function pteranDiveFallCap(lv) {
    return Math.max(660, 780 - (lv - 1) * 8);
  }

  function characterEffectSummary(id, lv=characterLevel(id)) {
    if (id === 'tiranon') {
      const scoreBonus = tiranonScoreBonus(lv);
      const chainBonus = tiranonChainBonusRate(lv);
      return `走行SCORE +${scoreBonus}%${chainBonus ? `・CHAIN精算 +${Math.round(chainBonus*100)}%` : ''}`;
    }
    if (id === 'mininon') {
      return `コイン +${Math.round(mininonCoinBonusRate(lv)*100)}%・当たり判定 約${Math.round(mininonShrinkForLevel(lv)*100)}%縮小`;
    }
    if (id === 'stegon') {
      let text = `ガード再使用 ${stegonCooldownForLevel(lv).toFixed(1)}秒`;
      if (lv >= 5) text += '・発動後0.55秒無敵';
      if (lv >= 10) text += '・前方栗+1破壊';
      return text;
    }
    if (id === 'pteran') {
      const glide = Math.max(0, Math.round((520 - pteranFallCapForLevel(lv)) / 520 * 100));
      const air = pteranAirScoreBonus(lv);
      return `滑空 ${pteranGlideMaxSeconds(lv).toFixed(1)}秒・再浮上消費 ${pteranReopenCost(lv).toFixed(1)}秒・落下軽減 +${glide}%${air ? `・滑空中SCORE +${air}%` : ''}`;
    }
    return '';
  }

  function characterRunScoreMultiplier() {
    if (selectedCharacter === 'tiranon') return 1 + tiranonScoreBonus(characterLevel('tiranon')) / 100;
    if (selectedCharacter === 'pteran' && player.glideActive) {
      return 1 + pteranAirScoreBonus(characterLevel('pteran')) / 100;
    }
    return 1;
  }

  function updateCharacterEffectHud() {
    if (!characterEffectHudEl) return;
    const ch = CHARACTER_CATALOG[selectedCharacter];
    const lv = characterLevel(selectedCharacter);
    characterEffectHudEl.hidden = state !== 'playing' && state !== 'paused';
    if (characterEffectHudEl.hidden || !ch) return;
    characterEffectHudEl.classList.remove('ready','active','dive','boost');
    let status = '';
    if (selectedCharacter === 'tiranon') {
      const bonus = tiranonScoreBonus(lv);
      const chainBonus = tiranonChainBonusRate(lv);
      status = `⭐ 走行SCORE +${bonus}%${chainBonus ? `　CHAIN精算 +${Math.round(chainBonus*100)}%` : ''}`;
    } else if (selectedCharacter === 'mininon') {
      status = `🪙 +${Math.round(mininonCoinBonusRate(lv)*100)}%　回避判定 -${Math.round(mininonShrinkForLevel(lv)*100)}%`;
    } else if (selectedCharacter === 'stegon') {
      if (stegonGuardCooldown <= 0) {
        status = `🛡 ガード READY${lv >= 10 ? '　連鎖破壊' : lv >= 5 ? '　+無敵' : ''}`;
        characterEffectHudEl.classList.add('ready');
      } else {
        status = `🛡 ガード あと${stegonGuardCooldown.toFixed(1)}秒`;
      }
    } else if (selectedCharacter === 'pteran') {
      const air = pteranAirScoreBonus(lv);
      const maxGlide = pteranGlideMaxSeconds(lv);
      const ratio = Math.max(0, Math.min(1, player.glideEnergy / maxGlide));
      const airborne = player.jumps > 0 || player.y + player.h < groundY - 2 || Math.abs(player.vy) > 1;
      let prompt = 'ジャンプ後 長押しで滑空';
      if (player.pullupFx > .03) {
        prompt = 'ふわっ！ 再浮上';
        characterEffectHudEl.classList.add('boost');
      } else if (player.diveActive && airborne) {
        prompt = player.glideEnergy > .02 ? '急降下 ↓　長押しで再浮上' : '急降下 ↓';
        characterEffectHudEl.classList.add('dive');
      } else if (player.glideActive) {
        prompt = '滑空中　離すと急降下';
        characterEffectHudEl.classList.add('active');
      } else if (airborne) {
        prompt = player.glideEnergy > .02 ? '長押しで滑空' : '滑空ゲージ0';
      }
      status = `🪽 ${prompt}${air && player.glideActive ? `　SCORE +${air}%` : ''}<i class="glideGauge"><u style="width:${Math.round(ratio*100)}%"></u></i><small>残り ${player.glideEnergy.toFixed(1)} / ${maxGlide.toFixed(1)}秒</small>`;
    }
    characterEffectHudEl.innerHTML = `<b>${ch.icon} ${ch.name} Lv.${lv}</b><span>${status}</span>`;
  }

  function renderCharacters() {
    if (!characterItemsEl) return;
    if (characterGemsEl) characterGemsEl.textContent = `💎 ${gems}`;
    characterItemsEl.innerHTML = Object.entries(CHARACTER_CATALOG).map(([id, ch]) => {
      const unlocked = isCharacterUnlocked(id);
      const selected = selectedCharacter === id;
      const lv = characterLevel(id);
      const unavailable = !!ch.coming;
      let status = '';
      if (!unlocked) status = `🔒 USER Lv.${ch.unlockLevel}で解放`;
      else if (unavailable) status = 'COMING SOON・イラスト準備中';
      else status = `CHAR Lv.${lv} / ${ch.maxLevel}${selected ? '　使用中' : ''}`;
      const preview = ch.preview
        ? `<img src="${ch.preview}" alt="${ch.name}">`
        : `<span>${ch.icon}</span>`;
      let actions = '';
      if (unlocked && !unavailable) {
        actions += `<button data-char-action="select" data-id="${id}" class="${selected?'selected':''}">${selected?'使用中 ✓':'このキャラで走る'}</button>`;
        if (lv < ch.maxLevel) {
          const cost = characterUpgradeCost(id);
          actions += `<button data-char-action="level" data-id="${id}" ${gems < cost ? 'disabled' : ''}>Lv.UP 💎${cost}</button>`;
        } else {
          actions += `<button disabled>MAX Lv.10</button>`;
        }
      }
      const effectNow = characterEffectSummary(id, lv);
      const effectNext = lv < ch.maxLevel ? characterEffectSummary(id, lv + 1) : '';
      const milestone = lv + 1 === 5 || lv + 1 === 10 ? ' ★節目強化' : '';
      return `<div class="characterItem ${!unlocked?'locked':''} ${selected?'active':''} ${unavailable?'coming':''}"><div class="characterPreview">${preview}</div><div class="characterInfo"><strong>${ch.name}</strong><small>${ch.desc}</small><small>特性：<b>${ch.trait}</b>｜${ch.traitDesc}</small><small class="charLevelEffect">Lv.${lv}効果：${effectNow}</small>${effectNext ? `<small class="charLevelNext">次 Lv.${lv+1}${milestone}：${effectNext}</small>` : '<small class="charLevelNext max">レベル効果 MAX</small>'}<em>${status}</em><div class="characterActions">${actions}</div></div></div>`;
    }).join('');
    const selected = CHARACTER_CATALOG[selectedCharacter];
    if (characterNoteEl) characterNoteEl.textContent = `現在：${selected.name} Lv.${characterLevel(selectedCharacter)}　特性：${selected.trait}`;
    updateProfileUi();
  }

  function openCharacters() {
    if (state === 'playing' || state === 'damage') return;
    renderCharacters();
    shopPanel.hidden = true;
    cardEl.style.display = 'none';
    characterPanel.hidden = false;
  }

  function closeCharacters() {
    characterPanel.hidden = true;
    cardEl.style.display = 'block';
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

  function roundFlowGoal(value) {
    return Math.max(500, Math.ceil(value / 500) * 500);
  }

  function buildFlowGoals(startBest) {
    if (startBest < 2500) return [1500, 3000, 5000];
    const candidates = [
      roundFlowGoal(startBest * .55),
      roundFlowGoal(startBest * .75),
      roundFlowGoal(startBest * .90),
      roundFlowGoal(startBest + 1)
    ];
    const unique = [];
    for (const value of candidates) {
      if (value < 1500) continue;
      if (!unique.length || value > unique[unique.length - 1]) unique.push(value);
    }
    return unique.length ? unique : [roundFlowGoal(Math.max(1500, startBest + 1))];
  }

  function resetFlowGoals() {
    runBestAtStart = best;
    const round50 = value => Math.max(50, Math.round(value / 50) * 50);
    if (bestDistance < 500) {
      flowGoals = [250, 500, 850, 1300];
    } else {
      const raw = [
        round50(Math.max(250, bestDistance * .35)),
        round50(Math.max(500, bestDistance * .65)),
        round50(Math.max(750, bestDistance * .90)),
        round50(bestDistance + Math.max(250, bestDistance * .10))
      ];
      flowGoals = raw.filter((value, i) => i === 0 || value > raw[i-1]);
    }
    flowGoalIndex = 0;
    flowGoalStart = 0;
    nextScoreGoal = flowGoals[0] || 250;
    flowRestPatterns = 0;
    bestApproachShown = false;
    recordChase = false;
    newRecordAnnounced = false;
    newRecordTimer = 0;
  }

  function advanceFlowGoal() {
    const cleared = nextScoreGoal;
    const goalNo = flowGoalIndex + 1;
    const scoreBonus = 150 + Math.min(450, (goalNo - 1) * 75);
    const coinBonus = 2 + Math.min(4, Math.floor((goalNo - 1) / 2));
    scoreFloat += scoreBonus;
    score = Math.floor(scoreFloat);
    runCoins += coinBonus;
    flowGoalStart = cleared;
    flowGoalIndex++;
    if (flowGoalIndex < flowGoals.length) {
      nextScoreGoal = flowGoals[flowGoalIndex];
    } else {
      nextScoreGoal = Math.round((cleared + Math.max(650, cleared * .28)) / 50) * 50;
      flowGoals.push(nextScoreGoal);
    }
    flowRestPatterns = Math.max(flowRestPatterns, 1);
    popText(`RUN GOAL CLEAR! ${cleared.toLocaleString()}m  +${scoreBonus}  🪙+${coinBonus}`, W*.5, H*.30, '#fff0a6', 1.05, 20);
    burst(player.x + player.w/2, player.y + player.h/2, '#ffd25d', 20, 165);
    beep(820, .08, 'sine', .03);
    setTimeout(() => beep(1040, .08, 'sine', .024), 70);
  }

  function updateFlowGoals() {
    const meters = Math.floor(distance / 18);
    while (nextScoreGoal > 0 && meters >= nextScoreGoal) advanceFlowGoal();

    if (runBestAtStart > 0 && score < runBestAtStart) {
      const ratio = score / runBestAtStart;
      if (ratio >= .90 && !bestApproachShown) {
        bestApproachShown = true;
        popText(`BESTまであと ${Math.max(0, runBestAtStart - score).toLocaleString()}！`, W*.5, H*.27, '#ffe58a', .95, 19);
        beep(760, .07, 'sine', .025);
      }
      recordChase = ratio >= .97;
    } else if (runBestAtStart > 0 && score > runBestAtStart) {
      recordChase = true;
      if (!newRecordAnnounced) {
        newRecordAnnounced = true;
        newRecordTimer = 1.8;
        flowRestPatterns = Math.max(flowRestPatterns, 1);
        popText('NEW RECORD!', W*.5, H*.27, '#fff1a0', 1.25, 25);
        burst(player.x + player.w/2, player.y + player.h/2, '#ffd45c', 26, 210);
        beep(960, .10, 'square', .032);
        setTimeout(() => beep(1220, .13, 'sine', .028), 90);
      }
    } else {
      recordChase = false;
    }
  }

  bestEl.textContent = '/ ' + best;
  updateProfileUi();

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
  let runBestAtStart = best;
  let flowGoals = [];
  let flowGoalIndex = 0;
  let nextScoreGoal = 0;
  let flowGoalStart = 0;
  let flowRestPatterns = 0;
  let bestApproachShown = false;
  let recordChase = false;
  let newRecordAnnounced = false;
  let newRecordTimer = 0;
  let stegonGuardCooldown = 0;
  let mininonCoinMeter = 0;
  let recentNormalPatterns = [];
  let chainSectionPatterns = 0;
  let chainClears = 0;
  let rushMistakes = 0;
  let restartReadyAt = 0;
  const RUSH_WARP_DURATION = .95;
  const ROAR_FX_DURATION = .65;

  const spritePaths = {
    run1: '1218B0FC-C2A9-4661-8707-C27D900A8992.png',
    run2: 'BBCB72FB-8753-443F-8266-DE96E161B845.png',
    jump: '611DD895-B471-4366-B1DC-231EF0F51CF8.png',
    damage: 'DE619F5B-547D-4A02-866D-6E072FD3FF44.png',
    mininonRun1: '37BA91C1-A1B6-475F-80C7-99CA9C0F4227.png',
    mininonRun2: '634BE8E3-47BD-41B4-86E8-00583F529982.png',
    mininonJump: 'BF34325B-EA6D-4DCF-83A1-0F7A8326E6A5.png',
    mininonDamage: '72F50358-ABF9-4E2F-B676-133E5104CB8E.png',
    mininonFront: '97A7C3F6-D44A-4770-A6CF-55052F221207.png',
    stegonRun1: '8730184C-FBB1-4BDA-BF85-FF4F24AED3C7.png',
    stegonRun2: 'DCB091BC-7A59-435A-9F19-78285C56A4BF.png',
    stegonJump: 'DE557F47-D307-4934-B684-BE560F5B52D6.png',
    stegonFront: '8EF97C48-064E-4EDC-95DA-7EB00DA5F1D1.png',
    pteranRun1: '8E0967A2-6213-4014-AD0F-204E1BB3A89F.png',
    pteranRun2: '304EEA32-1229-4F79-B3FD-BF2B49632167.png',
    pteranJump: 'D364C13F-1755-481F-9D5B-0D980AEBD7A1.png',
    pteranGlide: '13E57C5F-73B3-4919-AEAD-F456E8A57EB3.png',
    pteranFront: 'D1D9FF27-0E76-4D9C-8F0E-862356577F01.png',
    kuri: 'A29A0A58-DA6B-49B8-AD9F-D595AE41741C.png',
    shield: '55E5A798-2A2D-466B-9A4C-6B865812C4D9.png',
    magnet: '43F86E52-798E-4091-ADAC-DEF03A44AD20.png',
    giant: '5428AE5F-D105-4FC1-B217-9EDA0009D7C5.png'
  };
  const sprites = {};
  const hitSprites = {};
  let hudTop = 20;
  const uiLaneTop = () => Math.max(H*.165, hudTop+104);
  // Remove only edge-connected near-white pixels. Enclosed cream/white details
  // stay intact; the original PNG is never modified. Cache once, not each frame.
  function transparentSprite(image) {
    const surface = document.createElement('canvas');
    const w = surface.width = image.naturalWidth;
    const h = surface.height = image.naturalHeight;
    const painter = surface.getContext('2d', {willReadFrequently:true});
    painter.drawImage(image, 0, 0);
    const pixels = painter.getImageData(0, 0, w, h);
    const data = pixels.data;
    const seen = new Uint8Array(w*h);
    const queue = new Int32Array(w*h);
    let head = 0, tail = 0;
    function visit(i) {
      if (seen[i]) return;
      seen[i] = 1;
      const k = i*4;
      const lo = Math.min(data[k], data[k+1], data[k+2]);
      const hi = Math.max(data[k], data[k+1], data[k+2]);
      if (data[k+3] < 16 || (lo >= 235 && hi-lo <= 20)) queue[tail++] = i;
    }
    for (let x=0; x<w; x++) { visit(x); visit((h-1)*w+x); }
    for (let y=1; y<h-1; y++) { visit(y*w); visit(y*w+w-1); }
    while (head < tail) {
      const i = queue[head++];
      data[i*4+3] = 0;
      if (i%w) visit(i-1);
      if (i%w < w-1) visit(i+1);
      if (i >= w) visit(i-w);
      if (i < w*(h-1)) visit(i+w);
    }
    painter.putImageData(pixels, 0, 0);
    return surface;
  }
  for (const [name, src] of Object.entries(spritePaths)) {
    const image = new Image();
    image.decoding = 'async';
    if (name === 'pteranRun2') {
      image.onload = () => {
        try { sprites[name] = transparentSprite(image); }
        catch (_) { sprites[name] = sprites.pteranRun1; }
      };
    } else sprites[name] = image;
    image.src = src;
  }

  const player = {
    x: 88, y: 0, w: 48, h: 48, vy: 0, jumps: 0,
    shield: false, invincible: 0, magnet: 0, giant: 0, fever: 0,
    timeSlow: 0, wing: 0,
    runT: 0, squash: 0, damageUntil: 0, descentTime: 0, hitElapsed: 0,
    glideHeld: false, glideActive: false, glideEnergy: 0,
    glideStarted: false, diveActive: false, pullupFx: 0
  };

  const stages = [
    {name:'はらっぱ',sky1:'#c7f1ee',sky2:'#fff4c9',hill:'#8fd5a7',far:'#bce5b7',ground:'#6ab67d',dirt:'#b98055'},
    {name:'まち',sky1:'#cde8ff',sky2:'#fff0da',hill:'#9ac6cf',far:'#c8d9d0',ground:'#70b683',dirt:'#ae7d5d'},
    {name:'ゆうやけ',sky1:'#ffd0a8',sky2:'#fff0c9',hill:'#d8a88a',far:'#efd0a2',ground:'#79ad73',dirt:'#a8775c'},
    {name:'ほしぞら',sky1:'#445477',sky2:'#8792ad',hill:'#5b7082',far:'#6e8191',ground:'#527b65',dirt:'#71584f'}
  ];

  function resize() {
    const r = canvas.getBoundingClientRect();
    hudTop = parseFloat(getComputedStyle(document.getElementById('hud')).paddingTop) || 20;
    W = Math.max(320, r.width);
    H = Math.max(520, r.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    groundY = H * 0.79;
    player.x = Math.max(72, W * 0.22);
    if (state !== 'playing' && state !== 'paused') player.y = groundY - player.h;
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
    document.body.classList.add('in-run');
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
    stegonGuardCooldown = 0;
    mininonCoinMeter = 0;
    recentNormalPatterns = [];
    chainSectionPatterns = 0;
    chainClears = 0;
    rushMistakes = 0;
    restartReadyAt = 0;
    resetFlowGoals();
    Object.assign(player, {
      y: groundY - 48, w:48, h:48, vy:0, jumps:0,
      shield:false, invincible:0, magnet:0, giant:0, fever:0, timeSlow:0, wing:0, runT:0, squash:0,
      damageUntil:0, descentTime:0, hitElapsed:0,
      glideHeld:false, glideActive:false, glideStarted:false, diveActive:false, pullupFx:0,
      glideEnergy:selectedCharacter === 'pteran' ? pteranGlideMaxSeconds(characterLevel('pteran')) : 0
    });
    overlay.style.display = 'none';
    pausePanel.hidden = true;
    pauseBtn.hidden = false;
    resultEl.style.display = 'none';
    updateHud();
  }

  function pauseGame() {
    if (state !== 'playing') return;
    state = 'paused';
    player.glideHeld = false;
    player.glideActive = false;
    player.diveActive = false;
    pausePanel.hidden = false;
    pauseBtn.hidden = true;
    if (audioCtx && audioCtx.state === 'running') audioCtx.suspend().catch(() => {});
  }

  function resumeGame() {
    if (state !== 'paused') return;
    state = 'playing';
    document.body.classList.add('in-run');
    last = performance.now();
    pausePanel.hidden = true;
    pauseBtn.hidden = false;
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  }

  function finishGame() {
    if (state !== 'playing' && state !== 'damage') return;
    state = 'over';
    document.body.classList.remove('in-run');
    pausePanel.hidden = true;
    pauseBtn.hidden = true;
    shake = 0;
    const oldUserLevel = userLevel;
    const unlockedBefore = new Set(Object.entries(CHARACTER_CATALOG).filter(([, ch]) => oldUserLevel >= ch.unlockLevel && !ch.coming).map(([id]) => id));
    const runMeters = Math.floor(distance / 18);
    const newBest = score > best;
    const newBestDistance = runMeters > bestDistance;
    if (newBest) {
      best = score;
      localStorage.setItem(LS_BEST, String(best));
    }
    if (newBestDistance) {
      bestDistance = runMeters;
      localStorage.setItem(LS_BEST_DISTANCE, String(bestDistance));
    }
    totalRuns += 1;
    totalScore += score;
    userLevel = Math.max(userLevel, userLevelFromScore(totalScore));
    let earnedGems = 0;
    for (let lv = oldUserLevel + 1; lv <= userLevel; lv++) earnedGems += gemRewardForLevel(lv);
    gems += earnedGems;
    const earnedCoins = runCoins;
    wallet += earnedCoins;
    runCoins = 0;
    saveProgress();
    updateProfileUi();
    const newlyUnlockedCharacters = Object.entries(CHARACTER_CATALOG)
      .filter(([id, ch]) => !ch.coming && isCharacterUnlocked(id) && !unlockedBefore.has(id))
      .map(([, ch]) => ch.name);
    bestEl.textContent = '/ ' + best;
    resultEl.style.display = 'block';
    const comboLine = comboPeak >= 3
      ? `<br><span style="font-size:13px;color:#8a6b3d">MAX CHAIN ${comboPeak}　CHAIN CLEAR ${chainClears}</span>`
      : '';
    const distanceLine = `<br><span style="font-size:15px;color:#4d7180">📏 DISTANCE ${runMeters.toLocaleString()}m　BEST ${bestDistance.toLocaleString()}m</span>`;
    const coinLine = `<br><span style="font-size:15px;color:#9a7119">🪙 +${earnedCoins}　所持 ${wallet}</span>`;
    const nextRemain = Math.max(0, nextScoreGoal - runMeters);
    const nextLine = `<br><span style="font-size:13px;color:#7b6845">🎯 RUN GOAL ${nextScoreGoal.toLocaleString()}m　あと${nextRemain.toLocaleString()}m</span>`;
    const levelLine = earnedGems > 0
      ? `<br><span style="font-size:14px;color:#7d62bd">LEVEL UP! USER Lv.${userLevel}　💎 +${earnedGems}</span>`
      : `<br><span style="font-size:12px;color:#7d7892">USER Lv.${userLevel}　累計SCORE ${totalScore.toLocaleString()}</span>`;
    const charUnlockLine = newlyUnlockedCharacters.length
      ? `<br><span style="font-size:14px;color:#3d8a78">NEW! ${newlyUnlockedCharacters.join('・')}が使用可能！</span>`
      : '';
    resultEl.innerHTML = `SCORE ${score}<br><span style="font-size:15px;color:#6a7c75">BEST SCORE ${best}</span>${distanceLine}${comboLine}${coinLine}${nextLine}${levelLine}${charUnlockLine}`;
    subtitleEl.textContent = newlyUnlockedCharacters.length ? '新しい仲間が増えたノン！' : earnedGems > 0 ? 'ユーザーレベルが上がったノン！' : newBest ? 'ベストスコアだノン！' : 'もう1回いくノン？';
    startBtn.textContent = 'もう一度あそぶ';
    restartReadyAt = performance.now() + 700;
    startBtn.disabled = true;
    renderShop();
    renderCharacters();
    overlay.style.display = 'grid';
    setTimeout(() => {
      if (state === 'over') startBtn.disabled = false;
    }, 700);
  }

  function renderShop() {
    if (!shopItemsEl) return;
    const rank = currentItemRank();
    const currentRankIds = rankItems(rank);
    const rankOwned = currentRankIds.filter(id => !!owned[id]).length;
    shopCoinsEl.textContent = `🪙 ${wallet}　💎 ${gems}`;
    shopSlotsEl.textContent = `装備 ${loadout.length} / 5`;
    if (shopRankEl) shopRankEl.textContent = `ITEM RANK ${rank}`;
    shopItemsEl.innerHTML = Object.entries(ITEM_CATALOG).map(([id, item]) => {
      const unlocked = isItemUnlocked(id);
      const has = !!owned[id];
      const equipped = isEquipped(id);
      const lv = itemLevel(id);
      let stateText = '';
      if (!unlocked) {
        stateText = `🔒 ITEM RANK ${item.rank || 1}`;
      } else if (!has) {
        stateText = `ITEM RANK ${item.rank || 1}　好きな順で解放OK　🪙${item.price}`;
      } else if (item.basic) {
        stateText = '初期アイテム';
      } else {
        stateText = `R${item.rank || 1}・Lv.${Math.max(1,lv)} / ${item.maxLevel}`;
      }

      let actions = '';
      if (unlocked && !has) {
        actions = `<button data-action="buy" data-id="${id}" ${wallet < item.price ? 'disabled' : ''}>解放 🪙${item.price}</button>`;
      } else if (has) {
        actions = `<button data-action="equip" data-id="${id}" class="${equipped?'equipped':''}">${equipped?'装備中 ✓':'装備する'}</button>`;
        if (item.maxLevel > 1 && lv < item.maxLevel) {
          const cost = item.upgradeCosts[Math.max(0,lv-1)];
          actions += `<button data-action="upgrade" data-id="${id}" ${wallet < cost ? 'disabled' : ''}>強化 🪙${cost}</button>`;
        }
      }
      return `<div class="shopItem ${unlocked?'':'locked'}"><div class="shopIcon">${item.icon}</div><div class="shopInfo"><strong>${item.name}</strong><small>${item.desc}</small><em>${stateText}</em><div class="shopActions">${actions}</div></div></div>`;
    }).join('');

    if (currentRankIds.length) {
      shopNoteEl.textContent = `ITEM RANK ${rank}　${rankOwned}/${currentRankIds.length} 解放。好きなアイテムから選べるノン！ 全部解放でRANK ${rank+1}へ。`;
    } else {
      shopNoteEl.textContent = `ITEM RANK ${rank}まで到達！ RANK ${rank}の新アイテムは今後追加予定だノン。`;
    }
    updateProfileUi();
    updateHud();
  }

  function openShop() {
    if (state === 'playing' || state === 'damage') return;
    renderShop();
    characterPanel.hidden = true;
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
    if (combo >= 10) return 5;
    if (combo >= 6) return 3;
    if (combo >= 3) return 2;
    return 1;
  }

  function settleChain() {
    if (combo <= 0) return;
    const chain = combo;
    comboPeak = Math.max(comboPeak, chain);
    const base = chain >= 10 ? 500 : chain >= 6 ? 250 : chain >= 3 ? 120 : 0;
    if (base > 0) {
      const bonusRate = selectedCharacter === 'tiranon' ? tiranonChainBonusRate(characterLevel('tiranon')) : 0;
      const bonus = Math.round(base * (1 + bonusRate));
      scoreFloat += bonus;
      score = Math.floor(scoreFloat);
      chainClears++;
      popText(`CHAIN CLEAR ${chain}! +${bonus}`, player.x + player.w*.6, player.y - 16, '#fff0a6', .9, 18);
      burst(player.x + player.w*.6, player.y + player.h*.35, '#ffe07a', 10 + Math.min(chain, 10), 125);
      beep(720 + Math.min(chain,10)*18, .07, 'sine', .025);
    }
    resetCombo();
  }

  function breakChain() {
    if (combo >= 3) {
      popText(`CHAIN BREAK ${combo}`, player.x + player.w*.6, player.y - 14, '#ffd0bd', .65, 15);
    }
    resetCombo();
  }

  function popText(text, x, y, color='#fff5a8', life=.75, size=17) {
    // One message per lane; newer pickups replace stale labels.
    if (text.startsWith('COMBO') || /KURI RUSH|BONUS RUN/.test(text)) return; // Persistent fixed counter handles combos.
    const lane = /GOAL CLEAR|NEW RECORD|BESTまで/.test(text) ? 'goal'
      : /RUSH|BONUS|ラッシュ|ボーナスタイム|TIRAKURI/.test(text) ? 'event' : 'pickup';
    if (lane === 'goal') { x = W*.5; y = uiLaneTop()+100; }
    else if (lane === 'event') { x = W*.5; y = uiLaneTop()+132; size = Math.min(size, 18); }
    else { x = Math.max(92, Math.min(W-92, player.x+player.w*.5)); y = player.y-38; size = Math.min(size, 16); }
    floatTexts = floatTexts.filter(f => f.lane !== lane);
    floatTexts.push({text, x, y, color, life, maxLife:life, size, lane});
  }

  function registerAvoid(o, near=false) {
    combo++;
    comboPeak = Math.max(comboPeak, combo);
    const mult = comboMultiplier();
    const gain = (near ? 45 : 18) * mult;
    scoreFloat += gain;
    score = Math.floor(scoreFloat);
    if (near) {
      popText(`ギリギリ！ +${gain}`, player.x + player.w*.7, player.y - 12, '#ffd55a', .85, 18);
      burst(player.x + player.w*.75, player.y + player.h*.45, '#ffd55a', 8, 100);
      beep(830, .05, 'square', .028);
    } else if (combo === 3 || combo === 6 || combo === 10) {
      popText(`CHAIN ×${mult}`, player.x + player.w*.8, player.y - 8, '#fff1a8', .8, 17);
      beep(650 + mult*70, .055, 'sine', .026);
    }
    o.passed = true;
  }

  function beginDamageGameOver() {
    if (state !== 'playing') return;
    resetCombo();
    state = 'damage';
    player.damageUntil = performance.now() + 560;
    player.hitElapsed = 0;
    player.descentTime = 0;
    player.glideHeld = false;
    player.glideActive = false;
    player.glideStarted = false;
    player.diveActive = false;
    player.pullupFx = 0;
    player.vy = 0;
    shake = 5;
    flash = 0;
    beep(135, .22, 'sawtooth', .06);
    burst(player.x + player.w * .72, player.y + player.h * .28, '#ff896d', 14, 150);

  }

  function jump() {
    if (state !== 'playing' || player.jumps >= 2) return;
    player.vy = player.jumps === 0 ? -720 : -635;
    player.jumps++;
    player.descentTime = 0;
    player.glideStarted = false;
    player.diveActive = false;
    player.pullupFx = 0;
    player.squash = .14;
    beep(player.jumps === 1 ? 520 : 680, .055, 'square', .035);
    burst(player.x + player.w * .35, player.y + player.h, '#ffffff', 5, 70);
  }

  function pteranIsAirborne() {
    return player.jumps > 0 || player.y + player.h < groundY - 2 || Math.abs(player.vy) > 1;
  }

  function reopenPteranGlide() {
    if (selectedCharacter !== 'pteran' || !pteranIsAirborne() || player.glideEnergy <= .02) return false;
    const lv = characterLevel('pteran');
    const cost = Math.min(player.glideEnergy, pteranReopenCost(lv));
    player.glideEnergy = Math.max(0, player.glideEnergy - cost);
    player.glideHeld = true;
    player.glideActive = false;
    player.glideStarted = true;
    player.diveActive = false;
    player.pullupFx = .24;
    player.vy = Math.min(player.vy, -pteranReopenLift(lv));
    player.descentTime = 0;
    burst(player.x + player.w*.30, player.y + player.h*.55, '#c9f5ff', 12, 120 + lv*4);
    popText('ふわっ！', player.x + player.w*.55, player.y - 8, '#d8f8ff', .42, 15);
    beep(720 + lv*8, .055, 'sine', .022);
    return true;
  }

  function input(e) {
    if (e && e.type === 'keydown' && !['Space','ArrowUp'].includes(e.code)) return;
    if (e && e.type === 'keydown' && e.repeat) return;
    if (e && e.cancelable) e.preventDefault();
    if (state === 'title') {
      reset();
      return;
    }
    if (state === 'over') return;
    if (state === 'playing' && selectedCharacter === 'pteran') {
      player.glideHeld = true;
      if (player.diveActive && pteranIsAirborne()) {
        reopenPteranGlide();
        return;
      }
    }
    jump();
  }

  function releaseGlide() {
    const canDive = state === 'playing' && selectedCharacter === 'pteran' && player.wing <= 0 &&
      player.glideStarted && pteranIsAirborne() && player.glideEnergy > .02;
    player.glideHeld = false;
    player.glideActive = false;
    player.pullupFx = 0;
    player.diveActive = !!canDive;
  }

  canvas.addEventListener('pointerdown', input, {passive:false});
  canvas.addEventListener('pointerup', releaseGlide, {passive:false});
  canvas.addEventListener('pointercancel', releaseGlide, {passive:false});
  addEventListener('pointerup', releaseGlide, {passive:false});
  pauseBtn.addEventListener('pointerdown', e => e.stopPropagation());
  pauseBtn.addEventListener('click', e => { e.stopPropagation(); pauseGame(); });
  resumeBtn.addEventListener('pointerdown', e => e.stopPropagation());
  resumeBtn.addEventListener('click', e => { e.stopPropagation(); resumeGame(); });
  pausePanel.addEventListener('pointerdown', e => e.stopPropagation());
  overlay.addEventListener('pointerdown', e => {
    if (e.target.closest && e.target.closest('#shopPanel,#characterPanel,#shopBtn,#characterBtn,#startBtn,#mute')) return;
    input(e);
  }, {passive:false});
  startBtn.addEventListener('pointerdown', e => e.stopPropagation());
  startBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (state === 'over' && performance.now() < restartReadyAt) return;
    closeShop();
    reset();
  });
  shopBtn.addEventListener('pointerdown', e => e.stopPropagation());
  shopBtn.addEventListener('click', e => { e.stopPropagation(); openShop(); });
  shopCloseBtn.addEventListener('pointerdown', e => e.stopPropagation());
  shopCloseBtn.addEventListener('click', e => { e.stopPropagation(); closeShop(); });
  shopPanel.addEventListener('pointerdown', e => e.stopPropagation());
  characterBtn.addEventListener('pointerdown', e => e.stopPropagation());
  characterBtn.addEventListener('click', e => { e.stopPropagation(); openCharacters(); });
  characterCloseBtn.addEventListener('pointerdown', e => e.stopPropagation());
  characterCloseBtn.addEventListener('click', e => { e.stopPropagation(); closeCharacters(); });
  characterPanel.addEventListener('pointerdown', e => e.stopPropagation());
  characterItemsEl.addEventListener('click', e => {
    const btn = e.target.closest('button[data-char-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const ch = CHARACTER_CATALOG[id];
    if (!ch || ch.coming || !isCharacterUnlocked(id)) return;
    if (btn.dataset.charAction === 'select') {
      selectedCharacter = id;
      saveProgress();
      renderCharacters();
      beep(720, .08, 'sine', .025);
      return;
    }
    if (btn.dataset.charAction === 'level') {
      const lv = characterLevel(id);
      if (lv >= ch.maxLevel) return;
      const cost = characterUpgradeCost(id);
      if (gems < cost) return;
      gems -= cost;
      characterLevels[id] = lv + 1;
      saveProgress();
      updateProfileUi();
      renderCharacters();
      if (characterNoteEl) characterNoteEl.textContent = `LEVEL UP! ${ch.name} Lv.${lv+1}　${characterEffectSummary(id, lv+1)}`;
      updateCharacterEffectHud();
      beep(880, .09, 'sine', .03);
      return;
    }
  });
  shopItemsEl.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const item = ITEM_CATALOG[id];
    if (!item) return;
    if (btn.dataset.action === 'buy') {
      if (!isItemUnlocked(id) || owned[id] || wallet < item.price) return;
      const rankBefore = currentItemRank();
      wallet -= item.price;
      owned[id] = true;
      levels[id] = Math.max(1, itemLevel(id));
      const hadRoom = loadout.length < 5;
      if (hadRoom && !loadout.includes(id)) loadout.push(id);
      saveProgress();
      const rankAfter = currentItemRank();
      renderShop();
      if (rankAfter > rankBefore) {
        shopNoteEl.textContent = `RANK ${rankBefore} COMPLETE! ITEM RANK ${rankAfter} が解放されたノン！`;
      } else if (!hadRoom) {
        shopNoteEl.textContent = '解放したノン！ 装備枠が5つ埋まっているので、1つ外してから装備してね。';
      }
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
  addEventListener('keyup', e => {
    if (['Space','ArrowUp'].includes(e.code)) releaseGlide(e);
  }, {passive:false});
  addEventListener('keydown', e => {
    if (!['Escape','KeyP'].includes(e.code)) return;
    e.preventDefault();
    if (state === 'playing') pauseGame();
    else if (state === 'paused') resumeGame();
  }, {passive:false});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') pauseGame();
  });
  muteBtn.addEventListener('pointerdown', e => e.stopPropagation());
  muteBtn.addEventListener('click', e => {
    e.stopPropagation();
    muted = !muted;
    muteBtn.textContent = muted ? '🔇' : '🔊';
  });

  function speed() {
    const eventBoost = eventMode === 'rush' ? 0 : eventMode === 'bonus' ? 12 : 0;
    // Keep at least 0.6s of visible approach on narrow screens. Use the base
    // body size so picking up meat does not abruptly change scrolling speed.
    const reactionCap = Math.max(275, (W - Math.max(72, W*.22) - 48 - 24) / .60);
    return Math.min(540, reactionCap, 275 + distance * .0062 + (player.fever > 0 ? 25 : 0) + eventBoost);
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

  function addCoinArc(x, y, count=5, spacing=34, rise=28, value=1) {
    const n = Math.max(1, count);
    for (let i=0; i<n; i++) {
      const q = n <= 1 ? 0 : i / (n-1);
      addCoin(x + i*spacing, y - Math.sin(q*Math.PI)*rise, value);
    }
  }

  function addBonusArc(x, y, count=5, spacing=42, rise=28, premium=false) {
    const n = Math.max(1, count);
    for (let i=0; i<n; i++) {
      const q = n <= 1 ? 0 : i / (n-1);
      addBonus(x + i*spacing, y - Math.sin(q*Math.PI)*rise, premium ? 2 : 1, premium && i === 0);
    }
  }

  function normalPatternLevel() {
    if (distance >= 15000) return 3;
    if (distance >= 8500) return 2;
    if (distance >= 3500) return 1;
    return 0;
  }

  function normalPatternFamily(id) {
    if ([1,5,8,11,21,23].includes(id)) return 'rhythm';
    if ([3,4,10,16,19,25].includes(id)) return 'steps';
    if ([9,17,20,22,27].includes(id)) return 'spring';
    if ([0,6].includes(id)) return 'single';
    return 'route';
  }

  function pickNormalPattern(level) {
    const pools = [
      [0,1,2,3,4,5,6,7],
      [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
      [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21],
      [5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27]
    ];
    let pool = pools[Math.max(0, Math.min(3, level))];
    if (distance < 900) pool = [0,1,7];
    else if (level > 0) {
      // Fade new layouts in across 1,800 distance instead of changing half
      // the selection pool on the first frame after a tier threshold.
      const threshold = [0,3500,8500,15000][level];
      const chance = .20 + .80 * Math.min(1, (distance-threshold)/1800);
      if (Math.random() > chance) pool = pools[level-1];
    }
    let candidates = pool.filter(id => !recentNormalPatterns.includes(id));
    if (!candidates.length) candidates = pool.slice();
    const previous = recentNormalPatterns[recentNormalPatterns.length-1];
    const varied = candidates.filter(id => normalPatternFamily(id) !== normalPatternFamily(previous));
    if (varied.length) candidates = varied;
    const id = candidates[Math.floor(Math.random() * candidates.length)];
    recentNormalPatterns.push(id);
    if (recentNormalPatterns.length > 3) recentNormalPatterns.shift();
    return id;
  }

  function spawnRestPattern() {
    const x = W + 90;
    const high = Math.random() < .45;
    if (high) {
      addPlatform(x + 30, groundY - 72, 170);
      for (let i=0; i<5; i++) addCoin(x + 48 + i*34, groundY - 112 - Math.sin(i/4*Math.PI)*24, 1);
      if (Math.random() < .36) addEquippedItem(x + 185, groundY - 128, ['shield','magnet','giant','slow','wing','roar']);
      addChestnut(x + 315, groundY - 32, .80);
    } else {
      for (let i=0; i<6; i++) addCoin(x + 20 + i*36, groundY - 88 - Math.sin(i/5*Math.PI)*26, 1);
      if (Math.random() < .32) addChestnut(x + 300, groundY - 31, .78);
    }
    flowRestPatterns = Math.max(0, flowRestPatterns - 1);
    nextPattern += 470 + Math.random() * 80;
  }

  function spawnNormalPattern() {
    const x = W + 90;
    const firstObject = objects.length;
    const level = normalPatternLevel();
    const id = pickNormalPattern(level);
    let patternWidth = 390;
    let customRewards = false;

    // 0-7: readable fundamentals. Every dangerous route has a clear, learnable answer.
    if (id === 0) {
      addChestnut(x + 30, groundY - 34, 1);
      addCoinArc(x + 8, groundY - 94, 4, 36, 25);
      patternWidth = 300;
      customRewards = true;
    } else if (id === 1) {
      addChestnut(x, groundY - 32, .90);
      addChestnut(x + 105, groundY - 38, 1.08);
      addCoinArc(x + 8, groundY - 104, 5, 34, 32);
      patternWidth = 315;
      customRewards = true;
    } else if (id === 2) {
      const py = groundY - 76;
      addPlatform(x + 25, py, 160);
      addChestnut(x + 118, py - 32, .90);
      addCoinArc(x + 40, py - 42, 4, 36, 18);
      patternWidth = 330;
      customRewards = true;
    } else if (id === 3) {
      addPlatform(x, groundY - 55, 94);
      addPlatform(x + 108, groundY - 102, 98);
      addPlatform(x + 222, groundY - 148, 112);
      addBonus(x + 257, groundY - 184, 2, true);
      patternWidth = 390;
      customRewards = true;
    } else if (id === 4) {
      addPlatform(x, groundY - 145, 112);
      addPlatform(x + 126, groundY - 100, 102);
      addPlatform(x + 242, groundY - 56, 104);
      addCoinArc(x + 20, groundY - 188, 7, 45, 18);
      patternWidth = 405;
      customRewards = true;
    } else if (id === 5) {
      addChestnut(x, groundY - 33, .88);
      // Three distinct single-jump beats, with a real landing between them.
      addChestnut(x + 260, groundY - 35, .96);
      addChestnut(x + 520, groundY - 33, .88);
      addCoinArc(x + 15, groundY - 100, 3, 32, 20);
      addCoinArc(x + 275, groundY - 100, 3, 32, 20);
      addCoinArc(x + 535, groundY - 100, 3, 32, 20);
      patternWidth = 650;
      customRewards = true;
    } else if (id === 6) {
      addChestnut(x + 80, groundY - 48, 1.35);
      addCoinArc(x + 35, groundY - 135, 5, 38, 32);
      patternWidth = 340;
      customRewards = true;
    } else if (id === 7) {
      addPlatform(x, groundY - 64, 130);
      addCoinArc(x + 14, groundY - 105, 4, 34, 18);
      addChestnut(x + 205, groundY - 34, .95);
      patternWidth = 355;
      customRewards = true;

    // 8-15: route choices, rhythm and landing decisions.
    } else if (id === 8) {
      addChestnut(x, groundY - 34, .90);
      addChestnut(x + 125, groundY - 40, 1.10);
      addChestnut(x + 260, groundY - 34, .92);
      addCoinArc(x + 20, groundY - 112, 8, 38, 42);
      patternWidth = 420;
      customRewards = true;
    } else if (id === 9) {
      addSpring(x, groundY - 12, 54, true);
      addPlatform(x + 100, groundY - 148, 235);
      addChestnut(x + 125, groundY - 34, .90);
      addChestnut(x + 260, groundY - 35, .95);
      addBonusArc(x + 120, groundY - 190, 5, 48, 25, true);
      patternWidth = 440;
      customRewards = true;
    } else if (id === 10) {
      addPlatform(x, groundY - 60, 92);
      addPlatform(x + 104, groundY - 116, 92);
      addPlatform(x + 208, groundY - 68, 92);
      addPlatform(x + 312, groundY - 132, 108);
      addBonus(x + 345, groundY - 168, 2, true);
      patternWidth = 480;
      customRewards = true;
    } else if (id === 11) {
      addChestnut(x, groundY - 34, .82);
      // Two short pairs: clear a pair, land, then choose the next takeoff.
      addChestnut(x + 82, groundY - 34, .82);
      addChestnut(x + 350, groundY - 34, .82);
      addChestnut(x + 432, groundY - 34, .82);
      addCoinArc(x + 8, groundY - 105, 4, 30, 24);
      addCoinArc(x + 358, groundY - 105, 4, 30, 24);
      patternWidth = 570;
      customRewards = true;
    } else if (id === 12) {
      addChestnut(x + 30, groundY - 34, .95);
      addPlatform(x + 88, groundY - 118, 255);
      addBonusArc(x + 108, groundY - 158, 5, 48, 22, true);
      addChestnut(x + 380, groundY - 34, 1.0);
      patternWidth = 500;
      customRewards = true;
    } else if (id === 13) {
      addPlatform(x, groundY - 82, 135);
      addPlatform(x + 164, groundY - 128, 145);
      addCoinArc(x + 16, groundY - 124, 7, 44, 28);
      addChestnut(x + 365, groundY - 34, .98);
      patternWidth = 475;
      customRewards = true;
    } else if (id === 14) {
      addPlatform(x + 35, groundY - 105, 315);
      addChestnut(x + 110, groundY - 139, .78);
      addChestnut(x + 258, groundY - 139, .78);
      addBonus(x + 186, groundY - 177, 2, true);
      patternWidth = 430;
      customRewards = true;
    } else if (id === 15) {
      addPlatform(x, groundY - 88, 155);
      addCoinArc(x + 14, groundY - 132, 4, 40, 22);
      addChestnut(x + 205, groundY - 34, 1.05);
      addChestnut(x + 342, groundY - 34, .88);
      patternWidth = 465;
      customRewards = true;

    // 16-21: advanced routes. Character specialties help, but no character is required.
    } else if (id === 16) {
      addPlatform(x, groundY - 70, 92);
      addPlatform(x + 120, groundY - 132, 98);
      addPlatform(x + 248, groundY - 192, 125);
      addBonusArc(x + 258, groundY - 230, 3, 42, 18, true);
      addChestnut(x + 410, groundY - 34, .95);
      patternWidth = 525;
      customRewards = true;
    } else if (id === 17) {
      addSpring(x, groundY - 12, 52, true);
      addPlatform(x + 92, groundY - 165, 320);
      addChestnut(x + 120, groundY - 34, .88);
      addChestnut(x + 240, groundY - 37, 1.02);
      addChestnut(x + 360, groundY - 34, .88);
      addBonusArc(x + 115, groundY - 207, 7, 46, 24, true);
      patternWidth = 510;
      customRewards = true;
    } else if (id === 18) {
      addChestnut(x, groundY - 34, .88);
      addPlatform(x + 95, groundY - 92, 120);
      addChestnut(x + 132, groundY - 126, .78);
      addChestnut(x + 278, groundY - 34, .92);
      addPlatform(x + 370, groundY - 120, 130);
      addBonus(x + 415, groundY - 158, 2, true);
      patternWidth = 555;
      customRewards = true;
    } else if (id === 19) {
      addPlatform(x, groundY - 172, 105);
      addPlatform(x + 122, groundY - 128, 105);
      addPlatform(x + 244, groundY - 88, 105);
      addPlatform(x + 366, groundY - 54, 110);
      addCoinArc(x + 14, groundY - 212, 10, 47, 20);
      patternWidth = 540;
      customRewards = true;
    } else if (id === 20) {
      // Long aerial reward lane: Pteran can hold it smoothly; others can still use the spring/platforms.
      addSpring(x, groundY - 12, 52, true);
      addPlatform(x + 92, groundY - 142, 125);
      addPlatform(x + 360, groundY - 112, 125);
      addChestnut(x + 165, groundY - 34, .82);
      addChestnut(x + 305, groundY - 36, .94);
      addChestnut(x + 505, groundY - 34, .84);
      addBonusArc(x + 120, groundY - 190, 10, 44, 48, true);
      patternWidth = 610;
      customRewards = true;
    } else if (id === 21) {
      // Tight rhythm feels especially forgiving with Mininon's smaller body, but jumping remains a safe answer.
      addChestnut(x, groundY - 32, .78);
      addChestnut(x + 102, groundY - 32, .78);
      addChestnut(x + 225, groundY - 34, .84);
      addCoin(x + 56, groundY - 62);
      addCoin(x + 164, groundY - 66);
      addCoinArc(x + 250, groundY - 105, 4, 34, 24);
      patternWidth = 415;
      customRewards = true;

    // 22-27: late-run mastery. Each has a safe read plus a richer specialist route.
    } else if (id === 22) {
      // Stegon can confidently stay low; everyone else has a clear spring escape above.
      addSpring(x, groundY - 12, 50, true);
      addPlatform(x + 100, groundY - 150, 340);
      for (let i=0; i<4; i++) addChestnut(x + 120 + i*112, groundY - 34 - (i%2)*4, .86 + (i%2)*.08);
      addBonusArc(x + 125, groundY - 190, 7, 48, 22, true);
      patternWidth = 565;
      customRewards = true;
    } else if (id === 23) {
      // Combo rhythm: Tiranon's longer combo grace makes this lane easier to maximize.
      for (let beat=0; beat<3; beat++) {
        addChestnut(x + beat*350, groundY - 32, .78);
        addChestnut(x + beat*350 + 76, groundY - 36, .94);
        addCoinArc(x + beat*350 + 8, groundY - 108, 4, 30, 25);
      }
      patternWidth = 910;
      customRewards = true;
    } else if (id === 24) {
      addPlatform(x, groundY - 62, 110);
      addChestnut(x + 145, groundY - 34, .90);
      addPlatform(x + 235, groundY - 142, 125);
      addChestnut(x + 395, groundY - 34, .96);
      addPlatform(x + 485, groundY - 82, 120);
      addBonus(x + 520, groundY - 120, 2, true);
      patternWidth = 650;
      customRewards = true;
    } else if (id === 25) {
      addPlatform(x, groundY - 175, 120);
      addBonusArc(x + 22, groundY - 215, 10, 48, -72, true);
      addChestnut(x + 455, groundY - 34, .92);
      addChestnut(x + 565, groundY - 34, .82);
      patternWidth = 680;
      customRewards = true;
    } else if (id === 26) {
      addChestnut(x, groundY - 34, .85);
      addPlatform(x + 105, groundY - 112, 125);
      addBonus(x + 145, groundY - 150, 2, true);
      addChestnut(x + 260, groundY - 36, 1.0);
      addPlatform(x + 355, groundY - 165, 150);
      addBonusArc(x + 374, groundY - 205, 3, 46, 18, true);
      addChestnut(x + 550, groundY - 33, .86);
      patternWidth = 670;
      customRewards = true;
    } else {
      addSpring(x, groundY - 12, 54, true);
      addPlatform(x + 100, groundY - 180, 410);
      addChestnut(x + 130, groundY - 34, .88);
      addChestnut(x + 255, groundY - 38, 1.08);
      addChestnut(x + 385, groundY - 34, .90);
      addChestnut(x + 535, groundY - 34, .82);
      // The spring is an entrance, not an automatic clear of the whole route.
      addChestnut(x + 380, groundY - 207, .78);
      addBonusArc(x + 125, groundY - 220, 8, 50, 32, true);
      if (!objects.some(o => o.type === 'letter')) addLetter(x + 475, groundY - 280);
      patternWidth = 670;
      customRewards = true;
    }

    // Keep the TIRAKURI hunt alive without placing letters directly on the ground-danger line.
    const letterAlreadyOnScreen = objects.some(o => o.type === 'letter');
    if (player.fever <= 0 && !letterAlreadyOnScreen && Math.random() < .18) {
      const lx = x + Math.min(patternWidth - 95, 90 + Math.random() * Math.max(80, patternWidth * .42));
      addLetter(lx, groundY - (155 + Math.random() * 72));
    }

    // Sparse generic rewards only on patterns that do not already draw a reward lane.
    if (!customRewards && Math.random() < .62) {
      addCoinArc(x + 34, groundY - 95 - Math.random()*30, 4 + Math.floor(Math.random()*2), 36, 28);
    }

    const specialItem = pickEquipped(['roar','slow','wing']);
    if (specialItem && Math.random() < .052) {
      const ix = x + Math.min(patternWidth - 80, 95 + Math.random() * 150);
      addItem(ix, groundY - (112 + Math.random() * 55), specialItem);
    }

    if (Math.random() < .088) {
      const ix = x + Math.min(patternWidth - 80, 120 + Math.random() * 150);
      addEquippedItem(ix, groundY - (130 + Math.random() * 75), ['shield','magnet','giant']);
    }

    // Preserve jump decisions as speed rises; scale spacing, never sprite sizes.
    const stretch = Math.max(1, speed()/330);
    const course = objects.slice(firstObject);
    for (const o of course) {
      o.x = x + (o.x-x)*stretch;
      if (o.type === 'platform') o.w *= stretch;
    }
    // Random items/letters must not sit inside an obstacle or platform.
    // Authored coin lines remain the optional, riskier route.
    for (const reward of course) {
      if (reward.type !== 'item' && reward.type !== 'letter') continue;
      for (let pass=0; pass<course.length; pass++) {
        let moved = false;
        for (const solid of course) {
          if (solid.type !== 'kuri' && solid.type !== 'platform') continue;
          if (reward.x < solid.x+solid.w+18 && reward.x+reward.w > solid.x-18 &&
              reward.y < solid.y+solid.h+12 && reward.y+reward.h > solid.y-24) {
            reward.y = solid.y - reward.h - 28;
            moved = true;
          }
        }
        if (!moved) break;
      }
    }
    // Leave a recovery window after the actual last platform/obstacle, including
    // airborne exits. The next course cannot steal that landing space.
    const end = Math.max(x + patternWidth*stretch,
      ...course.map(o => o.x+o.w));
    chainSectionPatterns++;
    if (chainSectionPatterns >= 3) {
      objects.push({type:'chainEnd', x:end+34, y:0, w:1, h:1});
      chainSectionPatterns = 0;
    }
    const rest = Math.max(level >= 3 ? 105 : level >= 2 ? 118 : 132, speed()*.45);
    nextPattern += end-x + rest + Math.random()*55;
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
    else if (flowRestPatterns > 0) spawnRestPattern();
    else spawnNormalPattern();
  }

  function startEvent(type) {
    settleChain();
    chainSectionPatterns = 0;
    objects = objects.filter(o => o.type !== 'chainEnd');
    eventMode = type;
    eventTimer = type === 'rush' ? 7.45 : 8.5;
    eventBanner = type === 'rush' ? '🌰 KURI RUSH!' : '⭐ BONUS RUN!';
    eventBannerTimer = 1.8;
    if (type === 'rush') {
      rushMistakes = 0;
      // Clear every dangerous chestnut in front of Tiranon, then leave a long
      // run-up so the first rush obstacle always enters visibly from offscreen.
      objects = objects.filter(o => o.type !== 'kuri' || o.x < player.x - 24);
      nextPattern = distance + W + 390;
      flash = 0;
      rushWarpTimer = RUSH_WARP_DURATION;
      shake = Math.max(shake, 2);
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
        flowRestPatterns = Math.max(flowRestPatterns, ended === 'rush' ? 2 : 1);
        if (ended === 'rush') {
          const perfect = rushMistakes === 0;
          const rushScore = perfect ? 1000 : 500;
          const rushCoins = perfect ? 20 : 10;
          scoreFloat += rushScore;
          score = Math.floor(scoreFloat);
          runCoins += rushCoins;
          flash = perfect ? .28 : .18;
          popText(perfect ? `PERFECT RUSH! +${rushScore}  🪙+${rushCoins}` : `RUSH CLEAR! +${rushScore}  🪙+${rushCoins}`, W*.5, H*.30, perfect ? '#fff2a8' : '#ffe0a0', 1.15, 21);
          burst(player.x + player.w/2, player.y + player.h/2, perfect ? '#ffd95f' : '#ffb45f', perfect ? 28 : 18, perfect ? 205 : 160);
          beep(perfect ? 920 : 760, .10, 'square', .032);
          if (perfect) setTimeout(() => beep(1180, .12, 'sine', .026), 80);
          settleChain();
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
    if (state === 'damage') {
      player.hitElapsed += dt;
      // Freeze for 90ms, then play recoil and hit particles before the result.
      if (player.hitElapsed > .09) {
        shake = Math.max(0, shake - dt*24);
        for (const p of particles) { p.life -= dt; p.x += p.vx*dt; p.y += p.vy*dt; }
        particles = particles.filter(p => p.life > 0);
      }
      if (player.hitElapsed >= .54) finishGame();
      return;
    }
    if (state !== 'playing') return;

    const sp = speed();
    const slowLevel = Math.max(1, itemLevel('slow'));
    const slowFactor = player.timeSlow > 0 ? Math.max(.46, .62 - (slowLevel - 1) * .04) : 1;
    const worldSp = sp * slowFactor;
    const prevBottom = player.y + player.h;

    distance += worldSp * dt;
    scoreFloat += (worldSp * dt / 18) * (player.fever > 0 ? 3 : 1) * characterRunScoreMultiplier();
    score = Math.floor(scoreFloat);
    updateFlowGoals();

    const feverBefore = player.fever;
    const magnetBefore = player.magnet;
    const giantBefore = player.giant;
    const slowBefore = player.timeSlow;
    const wingBefore = player.wing;
    player.runT += dt * sp / 95;
    player.squash = Math.max(0, player.squash - dt);
    player.magnet = Math.max(0, player.magnet - dt);
    player.giant = Math.max(0, player.giant - dt);
    player.fever = Math.max(0, player.fever - dt);
    player.timeSlow = Math.max(0, player.timeSlow - dt);
    player.wing = Math.max(0, player.wing - dt);
    player.invincible = Math.max(0, player.invincible - dt);
    if (magnetBefore > 0 && player.magnet <= 0) endPowerEffect('magnet');
    if (giantBefore > 0 && player.giant <= 0) endPowerEffect('giant');
    if (slowBefore > 0 && player.timeSlow <= 0) endPowerEffect('slow');
    if (wingBefore > 0 && player.wing <= 0) endPowerEffect('wing');
    if (feverBefore > 0 && player.fever <= 0) {
      endPowerEffect('fever');
      player.invincible = Math.max(player.invincible, 1.6);
      popText('無敵タイム！', player.x + player.w*.55, player.y - 12, '#d9fbff', .85, 18);
      burst(player.x + player.w/2, player.y + player.h/2, '#bff7ff', 14, 135);
      beep(700, .08, 'sine', .024);
    }

    rushWarpTimer = Math.max(0, rushWarpTimer - dt);
    roarFx = Math.max(0, roarFx - dt);
    newRecordTimer = Math.max(0, newRecordTimer - dt);
    if (selectedCharacter === 'stegon') stegonGuardCooldown = Math.max(0, stegonGuardCooldown - dt);
    else stegonGuardCooldown = 0;
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

    player.pullupFx = Math.max(0, player.pullupFx - dt);
    const wingLevel = Math.max(1, itemLevel('wing'));
    const pteranLevel = selectedCharacter === 'pteran' ? characterLevel('pteran') : 0;
    const pteranAirborne = pteranLevel > 0 && (player.jumps > 0 || player.y + player.h < groundY - 2 || Math.abs(player.vy) > 1);
    if (player.wing > 0 && pteranLevel > 0) player.diveActive = false;
    const pteranCanGlide = pteranAirborne && player.vy > 0 && player.descentTime >= .12 && player.glideHeld && !player.diveActive && player.glideEnergy > 0;
    const openingGlide = pteranCanGlide && !player.glideStarted;
    player.glideActive = !!pteranCanGlide;
    if (openingGlide) {
      player.glideStarted = true;
      player.pullupFx = .14;
      player.y -= 4 + Math.min(3, pteranLevel*.25);
      player.vy = Math.min(player.vy, 28);
      player.glideEnergy = Math.max(0, player.glideEnergy - .08);
      burst(player.x + player.w*.28, player.y + player.h*.58, '#d7f8ff', 7, 78);
      beep(690, .04, 'sine', .014);
    }
    let gravity = 1850;
    if (player.wing > 0) {
      gravity = Math.max(620, 980 - (wingLevel - 1) * 90);
    } else if (player.diveActive && pteranAirborne) {
      gravity = 2450;
    } else if (player.glideActive) {
      gravity = pteranGravityForLevel(pteranLevel);
    }
    player.vy += gravity * dt;
    if (player.wing > 0 && player.vy > 0) {
      player.vy = Math.min(player.vy, Math.max(220, 340 - (wingLevel - 1) * 25));
    } else if (player.diveActive && pteranAirborne && player.vy > 0) {
      player.vy = Math.min(player.vy, pteranDiveFallCap(pteranLevel));
      if (Math.random() < dt * 10) {
        particles.push({x:player.x + player.w*.35, y:player.y + player.h*.20, vx:-35-Math.random()*30, vy:-70-Math.random()*50, life:.20, color:'#d7e9ff', r:1.5+Math.random()*1.5});
      }
    } else if (player.glideActive) {
      player.glideEnergy = Math.max(0, player.glideEnergy - dt);
      if (player.glideEnergy <= 0) {
        player.glideActive = false;
        player.glideHeld = false;
        player.diveActive = false;
      }
      player.vy = Math.min(player.vy, pteranFallCapForLevel(pteranLevel));
      if (Math.random() < dt * 11) {
        particles.push({x:player.x + player.w*.20, y:player.y + player.h*.58, vx:-65-Math.random()*45, vy:(Math.random()-.5)*28, life:.26, color:'#d9f6ff', r:2+Math.random()*2});
      }
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
        player.glideStarted = false;
        player.diveActive = false;
        player.pullupFx = 0;
        if (selectedCharacter === 'pteran') player.glideEnergy = pteranGlideMaxSeconds(characterLevel('pteran'));
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
        player.glideHeld = false;
        player.glideActive = false;
        player.glideStarted = false;
        player.diveActive = false;
        player.pullupFx = 0;
        if (selectedCharacter === 'pteran') player.glideEnergy = pteranGlideMaxSeconds(characterLevel('pteran'));
      }
    }

    if (player.y + player.h >= groundY) {
      player.y = groundY - player.h;
      player.vy = 0;
      player.jumps = 0;
      player.glideHeld = false;
      player.glideActive = false;
      player.glideStarted = false;
      player.diveActive = false;
      player.pullupFx = 0;
      if (selectedCharacter === 'pteran') player.glideEnergy = pteranGlideMaxSeconds(characterLevel('pteran'));
    }

    player.descentTime = player.vy > 0 ? player.descentTime + dt : 0;
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
        const magnetActive = player.magnet > 0;
        const radius = coinPull ? (magnetActive ? 340 : 205) : 120;
        const pull = coinPull ? (magnetActive ? 11.5 : 6.0) : 5.0;
        if (dd < radius) {
          // Coins that have already passed Tiranon get an extra horizontal
          // catch-up boost so they do not trail behind until they disappear.
          const behindBoost = magnetActive && cx < px ? 1.7 : 1;
          o.x += dx * dt * pull * behindBoost;
          o.y += dy * dt * pull;
        }
      }
    }

    const mininonLevel = selectedCharacter === 'mininon' ? characterLevel('mininon') : 0;
    const mininonShrink = mininonLevel > 0 ? mininonShrinkForLevel(mininonLevel) : 0;
    const pbox = {
      x: player.x + player.w * (.18 + mininonShrink),
      y: player.y + player.h * (.12 + mininonShrink * .6),
      w: player.w * (.64 - mininonShrink * 2),
      h: player.h * (.78 - mininonShrink * 1.2)
    };

    const hurtbox = {...pbox};
    if (selectedCharacter === 'stegon') Object.assign(hurtbox, {
      x:player.x + player.w*.10, y:player.y + player.h*.34,
      w:player.w*.80, h:player.h*.54
    });
    if (selectedCharacter === 'pteran') Object.assign(hurtbox, {
      x:player.x + player.w*.20, y:player.y + player.h*.14,
      w:player.w*.60, h:player.h*.74
    });
    for (let i = objects.length - 1; i >= 0; i--) {
      const o = objects[i];
      if (o.x + o.w < -70) {
        objects.splice(i, 1);
        continue;
      }
      if (o.type === 'chainEnd') {
        if (o.x < player.x) {
          settleChain();
          objects.splice(i, 1);
        }
        continue;
      }
      if (o.type === 'platform' || o.type === 'spring') continue;

      if (o.type === 'kuri' && rectHit(hurtbox, o, 4)) {
        if (eventMode === 'rush') rushMistakes++;
        breakChain();
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
        if (selectedCharacter === 'stegon' && stegonGuardCooldown <= 0) {
          const lv = characterLevel('stegon');
          stegonGuardCooldown = stegonCooldownForLevel(lv);
          const guardScore = 30 + lv * 5;
          let chainScore = 0;
          if (lv >= 5) player.invincible = Math.max(player.invincible, .55);
          if (lv >= 10) {
            let chainTarget = null;
            let chainDist = Infinity;
            for (const target of objects) {
              if (target === o || target.type !== 'kuri') continue;
              const d = target.x - player.x;
              if (d > 0 && d < 280 && d < chainDist) { chainTarget = target; chainDist = d; }
            }
            if (chainTarget) {
              chainTarget.type = 'cleared';
              chainScore = 30;
              burst(chainTarget.x + chainTarget.w/2, chainTarget.y + chainTarget.h/2, '#ffd08a', 13, 175);
            }
          }
          scoreFloat += guardScore + chainScore;
          score = Math.floor(scoreFloat);
          shake = Math.max(shake, 5);
          flash = Math.max(flash, .06);
          burst(o.x + o.w/2, o.y + o.h/2, '#f1b36b', 16, 185);
          popText(`ステゴンガード！ +${guardScore + chainScore}${chainScore ? ' 連鎖！' : lv >= 5 ? ' +無敵' : ''}`, player.x + player.w*.65, player.y - 14, '#ffe0a4', .85, 18);
          objects.splice(i, 1);
          beep(175, .09, 'square', .035);
          setTimeout(() => beep(310, .07, 'sine', .022), 65);
          continue;
        }
        if (player.shield) {
          player.shield = false;
          player.invincible = 1.25;
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
        const near = verticalGap(hurtbox, o) <= 22;
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
      if (f.lane === 'pickup') f.y -= 24 * dt;
      if (f.life <= 0) floatTexts.splice(i, 1);
    }

    shake = Math.max(0, shake - dt * 24);
    flash = Math.max(0, flash - dt);
    updateHud();
  }

  function collectCoin(o) {
    const gain = Math.max(1, Number(o.value || 1));
    runCoins += gain;
    let mininonExtra = 0;
    if (selectedCharacter === 'mininon') {
      const lv = characterLevel('mininon');
      mininonCoinMeter += gain * mininonCoinBonusRate(lv);
      mininonExtra = Math.floor(mininonCoinMeter);
      if (mininonExtra > 0) {
        mininonCoinMeter -= mininonExtra;
        runCoins += mininonExtra;
        popText(`ミニノン 🪙+${mininonExtra}`, o.x + o.w/2, o.y - 8, '#fff0a6', .6, 14);
      }
    }
    scoreFloat += 5 * gain;
    score = Math.floor(scoreFloat);
    burst(o.x + o.w/2, o.y + o.h/2, '#ffd34e', mininonExtra ? 10 : 7, mininonExtra ? 120 : 90);
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
    announceItemPickup(o.item);
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
      burst(o.x + o.w/2, o.y + o.h/2, '#a7e9ff', 16, 135);
      beep(430, .12, 'sine', .035);
    }
    if (o.item === 'wing') {
      const lv = Math.max(1, itemLevel('wing'));
      player.wing = Math.max(player.wing, 4.5 + (lv - 1) * .75);
      player.vy = Math.min(player.vy, -260);
      pickupPop(o, '#f3e9ff');
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
    const meters = Math.floor(distance / 18);
    if (distanceHudEl) distanceHudEl.textContent = `📏 ${meters.toLocaleString()}m / BEST ${Math.max(bestDistance, meters).toLocaleString()}m`;
    if (userHudEl) userHudEl.textContent = `USER Lv.${userLevel}　💎 ${gems}`;
    if (goalHudEl) {
      const remain = Math.max(0, nextScoreGoal - meters);
      let sub = '';
      if (recordChase && runBestAtStart > 0 && score <= runBestAtStart) {
        sub = `<small>🔥 BEST SCOREまで ${Math.max(0, runBestAtStart-score).toLocaleString()}</small>`;
      } else if (newRecordTimer > 0) {
        sub = '<small>🏆 NEW BEST SCORE!</small>';
      }
      goalHudEl.innerHTML = `🎯 RUN GOAL ${nextScoreGoal.toLocaleString()}m　あと ${remain.toLocaleString()}m${sub}`;
      goalHudEl.classList.toggle('hot', remain <= 100 || recordChase || newRecordTimer > 0);
    }
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
    updateCharacterEffectHud();
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

  function drawSprite(name, x, y, w, h, hitFlash=false) {
    let image = sprites[name];
    if (!image || (image instanceof HTMLImageElement && (!image.complete || !image.naturalWidth))) return false;
    const iw = image.naturalWidth || image.width;
    const ih = image.naturalHeight || image.height;
    if (hitFlash) {
      if (!hitSprites[name]) {
        const tint = document.createElement('canvas');
        tint.width = iw; tint.height = ih;
        const paint = tint.getContext('2d');
        paint.drawImage(image, 0, 0);
        paint.globalCompositeOperation = 'source-atop';
        paint.fillStyle = 'rgba(255,55,55,.65)';
        paint.fillRect(0, 0, iw, ih);
        hitSprites[name] = tint;
      }
      image = hitSprites[name];
    }
    const scale = Math.min(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
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
    ctx.backgroundPass = true;
    ctx.fillRect(0,0,W,H);
    ctx.backgroundPass = false;

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
    ctx.save();
    ctx.shadowColor = 'rgba(255,247,220,.85)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetY = 1;
    const painted = drawSprite('kuri', o.x + o.w/2 - size/2, o.y + o.h - size, size, size);
    ctx.restore();
    if (painted) return;
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

  function currentPlayerSprite(airborne=false, damaged=false) {
    if (selectedCharacter === 'mininon') {
      if (damaged) return 'mininonDamage';
      if (airborne) return 'mininonJump';
      return Math.floor(player.runT * 2.2) % 2 ? 'mininonRun1' : 'mininonRun2';
    }
    if (selectedCharacter === 'stegon') {
      if (airborne) return 'stegonJump';
      return Math.floor(player.runT * 2.0) % 2 ? 'stegonRun1' : 'stegonRun2';
    }
    if (selectedCharacter === 'pteran') {
      if (airborne) return (player.glideActive || player.wing > 0) ? 'pteranGlide' : 'pteranJump';
      return Math.floor(player.runT * 2.15) % 2 ? 'pteranRun1' : 'pteranRun2';
    }
    if (damaged) return 'damage';
    if (airborne) return 'jump';
    return Math.floor(player.runT * 2.2) % 2 ? 'run1' : 'run2';
  }

  function currentPlayerVisualScale(spriteName) {
    if (selectedCharacter === 'mininon') return spriteName === 'mininonDamage' ? 1.76 : 1.74;
    if (selectedCharacter === 'stegon') return spriteName === 'stegonJump' ? 1.90 : 1.92;
    if (selectedCharacter === 'pteran') {
      if (spriteName === 'pteranGlide' || spriteName === 'pteranJump') return 1.90;
      return 1.86;
    }
    return spriteName === 'damage' ? 1.72 : 1.68;
  }

  function drawPlayer() {
    const p=player;
    const airborne=p.jumps > 0 || Math.abs(p.vy) > 1;
    ctx.save();
    const bob=!airborne?Math.sin(p.runT)*2:0;
    ctx.translate(p.x+p.w/2,p.y+p.h/2+bob);

    if (selectedCharacter === 'pteran' && airborne && p.diveActive) {
      ctx.translate(1, 2);
      ctx.rotate(.14);
    } else if (selectedCharacter === 'pteran' && airborne && p.pullupFx > 0) {
      const q = Math.min(1, p.pullupFx / .24);
      ctx.translate(0, -4*q);
      ctx.rotate(-.12*q);
      ctx.scale(1+.025*q, 1+.025*q);
    }

    if ((state === 'damage' || state === 'over') && player.damageUntil > 0 &&
        (selectedCharacter === 'stegon' || selectedCharacter === 'pteran')) {
      const recoil = Math.min(1, Math.max(0, (p.hitElapsed - .09) / .18));
      ctx.translate(-7*recoil, 2*recoil);
      ctx.rotate(-.18*recoil);
      ctx.scale(1-.08*recoil, 1-.08*recoil);

    }

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

    const spriteName = currentPlayerSprite(airborne, state === 'damage' || (state === 'over' && p.damageUntil > 0) || performance.now() < p.damageUntil);
    const visualSize = p.w * currentPlayerVisualScale(spriteName);
    // Both aerial poses use the same scale and the same torso anchor.
    const torsoY = spriteName === 'pteranGlide' ? .63 : .64;
    const spriteY = selectedCharacter === 'pteran' && airborne
      ? -p.h*.18 - visualSize*torsoY : p.h/2-visualSize;
    const hitFlash = state === 'damage' && p.hitElapsed < .28 && (selectedCharacter === 'stegon' || selectedCharacter === 'pteran');
    if (drawSprite(spriteName, -visualSize/2, spriteY, visualSize, visualSize, hitFlash)) {
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
    ctx.beginPath();ctx.rect(0,0,W,H);ctx.fill();
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

    ctx.restore();
  }

  function announceItemPickup(id) {
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
    roundedRect(W/2-w/2, uiLaneTop(), w, 36, 16);
    ctx.fill();
    ctx.strokeStyle = '#ffc24e';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#d97916';
    ctx.fillText(label, W/2, uiLaneTop() + 18);
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

  function drawRecordChaseEffect() {
    if (!recordChase && newRecordTimer <= 0) return;
    const pulse = .5 + .5 * Math.sin(performance.now() * .012);
    ctx.save();
    ctx.strokeStyle = `rgba(255,205,72,${.28 + pulse*.28})`;
    ctx.lineWidth = 3;
    roundedRect(5, 5, W-10, H-10, 20);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,244,171,${.12 + pulse*.14})`;
    ctx.lineWidth = 7;
    roundedRect(10, 10, W-20, H-20, 18);
    ctx.stroke();
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
      roundedRect(W-126, (uiLaneTop()+166), 112, 30, 11);
      ctx.fill();
      ctx.fillStyle = '#5a4a2b';
      ctx.fillText(`CHAIN ${combo}`, W-116, (uiLaneTop()+166)+7);
      if (mult > 1) {
        ctx.fillStyle = '#e58b2b';
        ctx.fillText(`×${mult}`, W-48, (uiLaneTop()+166)+7);
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
        roundedRect(W/2-w/2, (uiLaneTop()+40), w, 38, 17);
        ctx.fill();
        ctx.fillStyle = eventMode === 'rush' ? '#9b5630' : '#8b7220';
        ctx.fillText(label, W/2, (uiLaneTop()+40) + 19);
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
    drawRecordChaseEffect();
    drawRunUI();
    drawPickupEffects();
    drawActivePowerEffectsBehind();
    drawActivePowerEffectsFront();
    drawFeverEffect();
    drawFeverExtraEffect();
    drawRoarEffect();
    drawRushWarpEffect();

    for (const p of particles) {
      ctx.globalAlpha=Math.max(0,p.life/.7);
      ctx.fillStyle=p.color;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;


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

    drawPlayer();
    drawLoadoutCosmetics();


    if(flash>0){
      ctx.globalAlpha=Math.min(.07,flash*.4);ctx.fillStyle='#fff';ctx.beginPath();ctx.rect(0,0,W,H);ctx.fill();ctx.globalAlpha=1;
    }
    ctx.restore();
  }

  function loop(t) {
    // A click can reset last after this animation frame was queued.
    const dt = Math.max(0, Math.min(.032, (t-last)/1000 || 0));
    last = t;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  renderShop();
  requestAnimationFrame(loop);
})();
