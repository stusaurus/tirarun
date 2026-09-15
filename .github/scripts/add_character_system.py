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
"""  const profileNextEl = document.getElementById('profileNext');
  const profileProgressEl = document.getElementById('profileProgress');
""",
"""  const profileNextEl = document.getElementById('profileNext');
  const profileProgressEl = document.getElementById('profileProgress');
  const characterBtn = document.getElementById('characterBtn');
  const characterPanel = document.getElementById('characterPanel');
  const characterCloseBtn = document.getElementById('characterCloseBtn');
  const characterItemsEl = document.getElementById('characterItems');
  const characterGemsEl = document.getElementById('characterGems');
  const characterNoteEl = document.getElementById('characterNote');
""",
'character element refs')

rep(
"""  const LS_USER_LEVEL = 'tirakuri-user-level-v1';
  const LS_GEMS = 'tirakuri-gems-v1';
""",
"""  const LS_USER_LEVEL = 'tirakuri-user-level-v1';
  const LS_GEMS = 'tirakuri-gems-v1';
  const LS_SELECTED_CHARACTER = 'tirakuri-selected-character-v1';
  const LS_CHARACTER_LEVELS = 'tirakuri-character-levels-v1';
""",
'character storage keys')

rep(
"""  let levels = readJson(LS_LEVELS, {shield:1, magnet:1, giant:1, roar:0, slow:0, wing:0});
  let loadout = readJson(LS_LOADOUT, ['shield','magnet','giant']);

  const ITEM_CATALOG = {
""",
"""  let levels = readJson(LS_LEVELS, {shield:1, magnet:1, giant:1, roar:0, slow:0, wing:0});
  let loadout = readJson(LS_LOADOUT, ['shield','magnet','giant']);
  let selectedCharacter = localStorage.getItem(LS_SELECTED_CHARACTER) || 'tiranon';
  let characterLevels = readJson(LS_CHARACTER_LEVELS, {tiranon:1, mininon:1, stegon:1, pteran:1});

  const ITEM_CATALOG = {
""",
'character state')

rep(
"""  };

  owned = Object.assign({shield:true, magnet:true, giant:true, roar:false, slow:false, wing:false}, owned || {});
""",
"""  };

  const CHARACTER_CATALOG = {
    tiranon: {
      name:'ティラノン', icon:'🦖', unlockLevel:1, maxLevel:10,
      preview:'1218B0FC-C2A9-4661-8707-C27D900A8992.png',
      desc:'ティラクリの主人公。元気いっぱいに走るノン！'
    },
    mininon: {
      name:'ミニノン', icon:'🐣', unlockLevel:3, maxLevel:10, coming:true,
      preview:null, desc:'USER Lv.3で仲間入り予定。イラスト準備中！'
    },
    stegon: {
      name:'ステゴン', icon:'🦕', unlockLevel:6, maxLevel:10,
      preview:'8730184C-FBB1-4BDA-BF85-FF4F24AED3C7.png',
      desc:'どっしり走る、やさしいステゴサウルス。'
    },
    pteran: {
      name:'プテラン', icon:'🪽', unlockLevel:10, maxLevel:10,
      preview:'8E0967A2-6213-4014-AD0F-204E1BB3A89F.png',
      desc:'翼を広げて駆ける、空が得意な仲間。'
    }
  };

  owned = Object.assign({shield:true, magnet:true, giant:true, roar:false, slow:false, wing:false}, owned || {});
""",
'character catalog')

rep(
"""  if (!loadout.length) loadout = ['shield','magnet','giant'];

  function saveProgress() {
""",
"""  if (!loadout.length) loadout = ['shield','magnet','giant'];
  characterLevels = Object.assign({tiranon:1, mininon:1, stegon:1, pteran:1}, characterLevels || {});
  for (const id of Object.keys(CHARACTER_CATALOG)) {
    characterLevels[id] = Math.max(1, Math.min(CHARACTER_CATALOG[id].maxLevel, Number(characterLevels[id] || 1)));
  }
  if (!CHARACTER_CATALOG[selectedCharacter] || CHARACTER_CATALOG[selectedCharacter].coming || userLevel < CHARACTER_CATALOG[selectedCharacter].unlockLevel) {
    selectedCharacter = 'tiranon';
  }

  function saveProgress() {
""",
'character normalization')

rep(
"""    localStorage.setItem(LS_USER_LEVEL, String(userLevel));
    localStorage.setItem(LS_GEMS, String(gems));
  }
""",
"""    localStorage.setItem(LS_USER_LEVEL, String(userLevel));
    localStorage.setItem(LS_GEMS, String(gems));
    localStorage.setItem(LS_SELECTED_CHARACTER, selectedCharacter);
    localStorage.setItem(LS_CHARACTER_LEVELS, JSON.stringify(characterLevels));
  }
""",
'save character progress')

rep(
"""  function isEquipped(id) {
""",
"""  function isCharacterUnlocked(id) {
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
        ? `<img src=\"${ch.preview}\" alt=\"${ch.name}\">`
        : `<span>${ch.icon}</span>`;
      let actions = '';
      if (unlocked && !unavailable) {
        actions += `<button data-char-action=\"select\" data-id=\"${id}\" class=\"${selected?'selected':''}\">${selected?'使用中 ✓':'このキャラで走る'}</button>`;
        if (lv < ch.maxLevel) {
          const cost = characterUpgradeCost(id);
          actions += `<button data-char-action=\"level\" data-id=\"${id}\" ${gems < cost ? 'disabled' : ''}>Lv.UP 💎${cost}</button>`;
        } else {
          actions += `<button disabled>MAX Lv.10</button>`;
        }
      }
      return `<div class=\"characterItem ${!unlocked?'locked':''} ${selected?'active':''} ${unavailable?'coming':''}\"><div class=\"characterPreview\">${preview}</div><div class=\"characterInfo\"><strong>${ch.name}</strong><small>${ch.desc}</small><em>${status}</em><div class=\"characterActions\">${actions}</div></div></div>`;
    }).join('');
    const selected = CHARACTER_CATALOG[selectedCharacter];
    if (characterNoteEl) characterNoteEl.textContent = `現在：${selected.name} Lv.${characterLevel(selectedCharacter)}　USER Lvが上がると使える仲間が増えるノン！`;
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
""",
'character helpers')

rep(
"""    if (shopRankEl) shopRankEl.textContent = `ITEM RANK ${currentItemRank()}`;
  }
""",
"""    if (shopRankEl) shopRankEl.textContent = `ITEM RANK ${currentItemRank()}`;
    if (characterGemsEl) characterGemsEl.textContent = `💎 ${gems}`;
    if (characterBtn && CHARACTER_CATALOG[selectedCharacter]) characterBtn.textContent = `${CHARACTER_CATALOG[selectedCharacter].icon} キャラ`;
  }
""",
'profile character ui')

rep(
"""    const oldUserLevel = userLevel;
    const newBest = score > best;
""",
"""    const oldUserLevel = userLevel;
    const unlockedBefore = new Set(Object.entries(CHARACTER_CATALOG).filter(([, ch]) => oldUserLevel >= ch.unlockLevel && !ch.coming).map(([id]) => id));
    const newBest = score > best;
""",
'finish old unlocked chars')

rep(
"""    saveProgress();
    updateProfileUi();
    bestEl.textContent = '/ ' + best;
""",
"""    saveProgress();
    updateProfileUi();
    const newlyUnlockedCharacters = Object.entries(CHARACTER_CATALOG)
      .filter(([id, ch]) => !ch.coming && isCharacterUnlocked(id) && !unlockedBefore.has(id))
      .map(([, ch]) => ch.name);
    bestEl.textContent = '/ ' + best;
""",
'finish new character unlocks')

rep(
"""    const levelLine = earnedGems > 0
      ? `<br><span style=\"font-size:14px;color:#7d62bd\">LEVEL UP! USER Lv.${userLevel}　💎 +${earnedGems}</span>`
      : `<br><span style=\"font-size:12px;color:#7d7892\">USER Lv.${userLevel}　累計SCORE ${totalScore.toLocaleString()}</span>`;
    resultEl.innerHTML = `SCORE ${score}<br><span style=\"font-size:15px;color:#6a7c75\">BEST ${best}</span>${comboLine}${coinLine}${nextLine}${levelLine}`;
    subtitleEl.textContent = earnedGems > 0 ? 'ユーザーレベルが上がったノン！' : newBest ? 'ベストスコアだノン！' : 'もう1回いくノン？';
""",
"""    const levelLine = earnedGems > 0
      ? `<br><span style=\"font-size:14px;color:#7d62bd\">LEVEL UP! USER Lv.${userLevel}　💎 +${earnedGems}</span>`
      : `<br><span style=\"font-size:12px;color:#7d7892\">USER Lv.${userLevel}　累計SCORE ${totalScore.toLocaleString()}</span>`;
    const charUnlockLine = newlyUnlockedCharacters.length
      ? `<br><span style=\"font-size:14px;color:#3d8a78\">NEW! ${newlyUnlockedCharacters.join('・')}が使用可能！</span>`
      : '';
    resultEl.innerHTML = `SCORE ${score}<br><span style=\"font-size:15px;color:#6a7c75\">BEST ${best}</span>${comboLine}${coinLine}${nextLine}${levelLine}${charUnlockLine}`;
    subtitleEl.textContent = newlyUnlockedCharacters.length ? '新しい仲間が増えたノン！' : earnedGems > 0 ? 'ユーザーレベルが上がったノン！' : newBest ? 'ベストスコアだノン！' : 'もう1回いくノン？';
""",
'finish character unlock line')

rep(
"""    renderShop();
    overlay.style.display = 'grid';
""",
"""    renderShop();
    renderCharacters();
    overlay.style.display = 'grid';
""",
'finish render characters')

rep(
"""  function openShop() {
    if (state === 'playing' || state === 'damage') return;
    renderShop();
    cardEl.style.display = 'none';
    shopPanel.hidden = false;
  }
""",
"""  function openShop() {
    if (state === 'playing' || state === 'damage') return;
    renderShop();
    characterPanel.hidden = true;
    cardEl.style.display = 'none';
    shopPanel.hidden = false;
  }
""",
'open shop closes characters')

rep(
"""  overlay.addEventListener('pointerdown', e => {
    if (e.target.closest && e.target.closest('#shopPanel,#shopBtn,#startBtn,#mute')) return;
""",
"""  overlay.addEventListener('pointerdown', e => {
    if (e.target.closest && e.target.closest('#shopPanel,#characterPanel,#shopBtn,#characterBtn,#startBtn,#mute')) return;
""",
'overlay ignore character panel')

rep(
"""  shopCloseBtn.addEventListener('pointerdown', e => e.stopPropagation());
  shopCloseBtn.addEventListener('click', e => { e.stopPropagation(); closeShop(); });
  shopPanel.addEventListener('pointerdown', e => e.stopPropagation());
""",
"""  shopCloseBtn.addEventListener('pointerdown', e => e.stopPropagation());
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
      beep(880, .09, 'sine', .03);
      return;
    }
  });
""",
'character event handlers')

rep(
"""    damage: 'DE619F5B-547D-4A02-866D-6E072FD3FF44.png',
    kuri: 'A29A0A58-DA6B-49B8-AD9F-D595AE41741C.png',
""",
"""    damage: 'DE619F5B-547D-4A02-866D-6E072FD3FF44.png',
    stegonChar: '8730184C-FBB1-4BDA-BF85-FF4F24AED3C7.png',
    pteranChar: '8E0967A2-6213-4014-AD0F-204E1BB3A89F.png',
    kuri: 'A29A0A58-DA6B-49B8-AD9F-D595AE41741C.png',
""",
'character sprite paths')

rep(
"""  function drawPlayer() {
""",
"""  function currentPlayerSprite(airborne=false, damaged=false) {
    if (selectedCharacter === 'stegon') return 'stegonChar';
    if (selectedCharacter === 'pteran') return 'pteranChar';
    if (damaged) return 'damage';
    if (airborne) return 'jump';
    return Math.floor(player.runT * 2.2) % 2 ? 'run1' : 'run2';
  }

  function currentPlayerVisualScale(spriteName) {
    if (selectedCharacter === 'stegon') return 1.92;
    if (selectedCharacter === 'pteran') return 1.86;
    return spriteName === 'damage' ? 1.72 : 1.68;
  }

  function drawPlayer() {
""",
'player sprite helpers')

rep(
"""    const spriteName = state === 'damage' || performance.now() < p.damageUntil
      ? 'damage'
      : airborne
        ? 'jump'
        : Math.floor(p.runT * 2.2) % 2 ? 'run1' : 'run2';
    const visualSize = p.w * (spriteName === 'damage' ? 1.72 : 1.68);
""",
"""    const spriteName = currentPlayerSprite(airborne, state === 'damage' || performance.now() < p.damageUntil);
    const visualSize = p.w * currentPlayerVisualScale(spriteName);
""",
'draw selected character')

rep(
"""    const spriteName = player.y + player.h < groundY - 2
      ? 'jump'
      : Math.floor(player.runT * 2.2) % 2 ? 'run1' : 'run2';
    const visualSize = player.w * 1.68;
""",
"""    const spriteName = currentPlayerSprite(player.y + player.h < groundY - 2, false);
    const visualSize = player.w * currentPlayerVisualScale(spriteName);
""",
'warp selected character')

game.write_text(s, encoding='utf-8')

h = index.read_text(encoding='utf-8')
old = '''      <div id="menuBtns">
        <button id="startBtn">タップしてスタート</button>
        <button id="shopBtn">🛒 ショップ</button>
      </div>'''
new = '''      <div id="menuBtns">
        <button id="startBtn">タップしてスタート</button>
        <button id="characterBtn">🦖 キャラ</button>
        <button id="shopBtn">🛒 ショップ</button>
      </div>'''
if old not in h: raise SystemExit('missing menu buttons')
h = h.replace(old, new, 1)

old = '''    <div id="shopPanel" hidden>
      <div class="shopHead">
        <div><strong>ティラクリショップ</strong><small id="shopSlots">装備 3 / 5</small><small id="shopRank">ITEM RANK 1</small></div>
        <div><span id="shopCoins">🪙 0</span><button id="shopCloseBtn" aria-label="ショップを閉じる">×</button></div>
      </div>
      <div id="shopItems"></div>
      <div id="shopNote"></div>
    </div>'''
new = old + '''
    <div id="characterPanel" hidden>
      <div class="characterHead">
        <div><strong>キャラクター</strong><small>USER Lvで仲間が増える</small></div>
        <div><span id="characterGems">💎 0</span><button id="characterCloseBtn" aria-label="キャラクターを閉じる">×</button></div>
      </div>
      <div id="characterItems"></div>
      <div id="characterNote"></div>
    </div>'''
if old not in h: raise SystemExit('missing shop panel')
h = h.replace(old, new, 1)

h = h.replace('20260913-2310', '20260915-1900')
index.write_text(h, encoding='utf-8')

css = style.read_text(encoding='utf-8')
css += r'''

/* character-progression-v1 */
#menuBtns{grid-template-columns:minmax(0,1.35fr) minmax(86px,.72fr) minmax(86px,.72fr)}#characterBtn{border:0;border-radius:18px;background:#eef0ff;color:#5b4d8f;font:inherit;font-weight:900;font-size:15px;padding:14px 9px;box-shadow:0 5px 0 #c8c7ea;transform:translateY(-3px)}#characterBtn:active{transform:translateY(1px);box-shadow:0 1px 0 #c8c7ea}#characterPanel[hidden]{display:none}#characterPanel{width:min(94%,490px);max-height:min(84vh,780px);overflow:auto;background:#fffdf7;border:3px solid #fff;border-radius:26px;padding:18px;box-shadow:0 14px 46px #315d4e35;text-align:left;overscroll-behavior:contain;pointer-events:auto}.characterHead{position:sticky;top:-18px;z-index:2;margin:-18px -18px 12px;padding:16px 16px 12px;background:#fffdf7f5;backdrop-filter:blur(5px);display:flex;justify-content:space-between;gap:12px;align-items:flex-start;border-bottom:1px solid #e5ddcf}.characterHead>div:first-child{display:flex;flex-direction:column;gap:3px}.characterHead strong{font-size:20px;color:#5f538d}.characterHead small{font-size:12px;color:#7e7990}.characterHead>div:last-child{display:flex;gap:8px;align-items:center}#characterGems{font-weight:900;color:#765caf;white-space:nowrap}#characterCloseBtn{border:0;width:34px;height:34px;border-radius:50%;background:#f0ebf7;color:#695b87;font-size:22px;font-weight:900}.characterItem{display:grid;grid-template-columns:88px 1fr;gap:11px;padding:11px;margin:9px 0;border:2px solid #e5decd;border-radius:19px;background:#fff}.characterItem.active{border-color:#9d8bd2;box-shadow:0 0 0 2px #e9e1ff inset}.characterItem.locked{opacity:.54;filter:saturate(.68)}.characterItem.coming{background:#faf8f4}.characterPreview{width:88px;height:78px;border-radius:15px;background:#f5f2eb;display:grid;place-items:center;overflow:hidden}.characterPreview img{width:100%;height:100%;object-fit:contain}.characterPreview span{font-size:38px}.characterInfo{min-width:0}.characterInfo strong{display:block;color:#3e5e56;font-size:17px}.characterInfo small{display:block;margin-top:3px;color:#717c78;font-size:11px;line-height:1.4}.characterInfo em{display:block;margin-top:5px;color:#776599;font-size:11px;font-style:normal;font-weight:900}.characterActions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.characterActions button{border:0;border-radius:12px;padding:8px 10px;background:#e7ddff;color:#5d4a8d;font-weight:900;font-size:12px;box-shadow:0 3px 0 #c4b4e9}.characterActions button.selected{background:#dff6e8;color:#2d6b57;box-shadow:0 3px 0 #acd6bd}.characterActions button:disabled{opacity:.42;box-shadow:none}#characterNote{text-align:center;margin-top:12px;padding:10px;border-radius:14px;background:#f2eef9;color:#6f6781;font-size:12px;font-weight:800;line-height:1.45}@media(max-width:420px){#menuBtns{grid-template-columns:1fr 1fr}#menuBtns #startBtn{grid-column:1/-1}#characterBtn,#shopBtn{padding:11px 8px}.characterItem{grid-template-columns:76px 1fr}.characterPreview{width:76px;height:72px}}
'''
style.write_text(css, encoding='utf-8')
