from pathlib import Path

repo = Path('.')
game = repo / 'game.js'
index = repo / 'index.html'
style = repo / 'style.css'

s = game.read_text(encoding='utf-8')

def rep(old, new, label):
    global s
    if old not in s:
        raise SystemExit(f'missing target: {label}')
    s = s.replace(old, new, 1)

rep(
"""  const shopCoinsEl = document.getElementById('shopCoins');
  const shopSlotsEl = document.getElementById('shopSlots');
  const shopItemsEl = document.getElementById('shopItems');
  const shopNoteEl = document.getElementById('shopNote');
""",
"""  const shopCoinsEl = document.getElementById('shopCoins');
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
""",
'profile refs')

rep(
"""  const LS_OWNED = 'tirakuri-owned-v1';
  const LS_LEVELS = 'tirakuri-levels-v1';
  const LS_LOADOUT = 'tirakuri-loadout-v1';
""",
"""  const LS_OWNED = 'tirakuri-owned-v1';
  const LS_LEVELS = 'tirakuri-levels-v1';
  const LS_LOADOUT = 'tirakuri-loadout-v1';
  const LS_TOTAL_SCORE = 'tirakuri-total-score-v1';
  const LS_USER_LEVEL = 'tirakuri-user-level-v1';
  const LS_GEMS = 'tirakuri-gems-v1';
""",
'new storage keys')

rep(
"""  let best = Number(localStorage.getItem(LS_BEST) || 0);
  let wallet = Math.max(0, Number(localStorage.getItem(LS_COINS) || 0));
  let totalRuns = Math.max(0, Number(localStorage.getItem(LS_RUNS) || 0));
  let runCoins = 0;
""",
"""  function userLevelThreshold(level) {
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
  let wallet = Math.max(0, Number(localStorage.getItem(LS_COINS) || 0));
  let totalRuns = Math.max(0, Number(localStorage.getItem(LS_RUNS) || 0));
  const storedTotalScore = localStorage.getItem(LS_TOTAL_SCORE);
  let totalScore = Math.max(0, Number(storedTotalScore === null ? best : storedTotalScore) || 0);
  const calculatedUserLevel = userLevelFromScore(totalScore);
  let userLevel = Math.max(calculatedUserLevel, Number(localStorage.getItem(LS_USER_LEVEL) || 1) || 1);
  const storedGems = localStorage.getItem(LS_GEMS);
  let gems = Math.max(0, Number(storedGems === null ? gemsThroughLevel(userLevel) : storedGems) || 0);
  let runCoins = 0;
""",
'user progression state')

rep(
"""    shield: {name:'シールド', icon:'🛡️', desc:'1回だけ栗を防ぐ', basic:true, maxLevel:1},
    magnet: {name:'マグネット', icon:'🧲', desc:'近くのコインだけを引き寄せる', basic:true, maxLevel:1},
    giant: {name:'巨大化', icon:'🍖', desc:'大きくなって栗を壊す', basic:true, maxLevel:1},
""",
"""    shield: {name:'シールド', icon:'🛡️', desc:'1回だけ栗を防ぐ', basic:true, rank:0, maxLevel:1},
    magnet: {name:'マグネット', icon:'🧲', desc:'近くのコインだけを引き寄せる', basic:true, rank:0, maxLevel:1},
    giant: {name:'巨大化', icon:'🍖', desc:'大きくなって栗を壊す', basic:true, rank:0, maxLevel:1},
""",
'basic ranks')

rep("price:300, unlockBest:3500, unlockRuns:3, maxLevel:5,", "price:300, rank:1, maxLevel:5,", 'roar rank')
rep("price:500, unlockBest:7500, unlockRuns:8, maxLevel:5,", "price:500, rank:1, maxLevel:5,", 'slow rank')
rep("price:750, unlockBest:13000, unlockRuns:15, maxLevel:5,", "price:750, rank:1, maxLevel:5,", 'wing rank')

rep(
"""    localStorage.setItem(LS_LEVELS, JSON.stringify(levels));
    localStorage.setItem(LS_LOADOUT, JSON.stringify(loadout));
  }

  function isItemUnlocked(id) {
    const item = ITEM_CATALOG[id];
    if (!item) return false;
    if (item.basic) return true;
    return best >= (item.unlockBest || 0) && totalRuns >= (item.unlockRuns || 0);
  }
""",
"""    localStorage.setItem(LS_LEVELS, JSON.stringify(levels));
    localStorage.setItem(LS_LOADOUT, JSON.stringify(loadout));
    localStorage.setItem(LS_TOTAL_SCORE, String(totalScore));
    localStorage.setItem(LS_USER_LEVEL, String(userLevel));
    localStorage.setItem(LS_GEMS, String(gems));
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
    if (profileNextEl) profileNextEl.textContent = userLevel >= 99 ? 'MAX LEVEL' : `次Lvまで ${(nextThreshold - totalScore).toLocaleString()}`;
    if (profileProgressEl) profileProgressEl.style.width = `${Math.round(progress * 100)}%`;
    if (shopRankEl) shopRankEl.textContent = `ITEM RANK ${currentItemRank()}`;
  }
""",
'rank and profile helpers')

rep(
"""  bestEl.textContent = '/ ' + best;

  let W = 390;
""",
"""  bestEl.textContent = '/ ' + best;
  updateProfileUi();

  let W = 390;
""",
'initial profile ui')

old_finish = """    const unlockBefore = new Set(
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
"""
new_finish = """    const oldUserLevel = userLevel;
    const newBest = score > best;
    if (newBest) {
      best = score;
      localStorage.setItem(LS_BEST, String(best));
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
    bestEl.textContent = '/ ' + best;
    resultEl.style.display = 'block';
"""
rep(old_finish, new_finish, 'finish progression')

rep(
"""    const unlockNames = newlyUnlocked.map(x => `「${x.item.name}」`).join('・');
    const unlockLine = newlyUnlocked.length
      ? `<br><span style=\"font-size:14px;color:#d66f2c\">NEW! ${unlockNames}がショップに入荷！</span>`
      : '';
    resultEl.innerHTML = `SCORE ${score}<br><span style=\"font-size:15px;color:#6a7c75\">BEST ${best}</span>${comboLine}${coinLine}${nextLine}${unlockLine}`;
    subtitleEl.textContent = newlyUnlocked.length ? '新しいアイテムを解放したノン！' : newBest ? 'ベストスコアだノン！' : 'もう1回いくノン？';
""",
"""    const levelLine = earnedGems > 0
      ? `<br><span style=\"font-size:14px;color:#7d62bd\">LEVEL UP! USER Lv.${userLevel}　💎 +${earnedGems}</span>`
      : `<br><span style=\"font-size:12px;color:#7d7892\">USER Lv.${userLevel}　累計SCORE ${totalScore.toLocaleString()}</span>`;
    resultEl.innerHTML = `SCORE ${score}<br><span style=\"font-size:15px;color:#6a7c75\">BEST ${best}</span>${comboLine}${coinLine}${nextLine}${levelLine}`;
    subtitleEl.textContent = earnedGems > 0 ? 'ユーザーレベルが上がったノン！' : newBest ? 'ベストスコアだノン！' : 'もう1回いくノン？';
""",
'finish result level')

start = s.index("  function renderShop() {")
end = s.index("\n  function openShop() {", start)
new_render = r'''  function renderShop() {
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
'''
s = s[:start] + new_render + s[end:]

rep(
"""    if (btn.dataset.action === 'buy') {
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
""",
"""    if (btn.dataset.action === 'buy') {
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
""",
'buy rank transition')

rep(
"""    coinHudEl.textContent = `🪙 ${wallet + runCoins}`;
    if (goalHudEl) {
""",
"""    coinHudEl.textContent = `🪙 ${wallet + runCoins}`;
    if (userHudEl) userHudEl.textContent = `USER Lv.${userLevel}　💎 ${gems}`;
    if (goalHudEl) {
""",
'user hud update')

game.write_text(s, encoding='utf-8')

h = index.read_text(encoding='utf-8')
h = h.replace(
"""      <div id=\"coinHud\">🪙 0</div>\n      <div id=\"goalHud\">NEXT 1,500　あと 1,500</div>\n""",
"""      <div id=\"coinHud\">🪙 0</div>\n      <div id=\"userHud\">USER Lv.1　💎 0</div>\n      <div id=\"goalHud\">NEXT 1,500　あと 1,500</div>\n""",
1)
h = h.replace(
"""      <div id=\"subtitle\">ワンタップで、どこまでいける？</div>\n      <div id=\"result\"></div>\n""",
"""      <div id=\"subtitle\">ワンタップで、どこまでいける？</div>\n      <div id=\"profileBar\">\n        <div class=\"profileTop\"><strong id=\"profileLevel\">USER Lv.1</strong><span id=\"profileGems\">💎 0</span></div>\n        <div class=\"profileMeta\"><span id=\"profileTotal\">累計SCORE 0</span><span id=\"profileNext\">次Lvまで 4,000</span></div>\n        <div class=\"profileTrack\"><i id=\"profileProgress\"></i></div>\n      </div>\n      <div id=\"result\"></div>\n""",
1)
h = h.replace(
"""        <div><strong>ティラクリショップ</strong><small id=\"shopSlots\">装備 3 / 5</small></div>\n""",
"""        <div><strong>ティラクリショップ</strong><small id=\"shopSlots\">装備 3 / 5</small><small id=\"shopRank\">ITEM RANK 1</small></div>\n""",
1)
h = h.replace(
"""        コインを集めて新アイテムを購入・強化！<br>\n        アイテムは最大5つまで装備できるノン\n""",
"""        コインで好きなアイテムを解放・強化！<br>\n        累計スコアでUSER Lvが上がると💎がもらえるノン\n""",
1)
if '20260913-2245' not in h:
    raise SystemExit('missing cache version')
h = h.replace('20260913-2245', '20260913-2310')
index.write_text(h, encoding='utf-8')

css = style.read_text(encoding='utf-8')
css += r'''

/* meta-progression-v1 */
#userHud{margin-top:4px;font-size:10px;color:#69598d;font-weight:900;white-space:nowrap}#profileBar{margin:-8px 0 14px;padding:10px 12px;background:#f6f2ff;border:1px solid #e5daf8;border-radius:15px;text-align:left}.profileTop,.profileMeta{display:flex;align-items:center;justify-content:space-between;gap:10px}.profileTop strong{font-size:14px;color:#5d4a8d}.profileTop span{font-size:13px;font-weight:900;color:#7b61b2}.profileMeta{margin-top:4px;font-size:10px;font-weight:800;color:#7b7890}.profileTrack{height:7px;margin-top:7px;border-radius:999px;background:#e4ddf2;overflow:hidden}.profileTrack i{display:block;width:0;height:100%;border-radius:inherit;background:linear-gradient(90deg,#9b82d1,#7356b5);transition:width .3s ease}#shopRank{color:#7b61b2!important;font-weight:900}.shopItem:not(.locked) .shopInfo em{color:#8b6b28}.shopItem.locked .shopInfo em{color:#8b8792}@media(max-width:380px){#profileBar{padding:9px 10px}.profileMeta{font-size:9px}}
'''
style.write_text(css, encoding='utf-8')
