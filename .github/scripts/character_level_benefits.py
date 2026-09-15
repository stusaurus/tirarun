from pathlib import Path

GAME = Path('game.js')
INDEX = Path('index.html')
STYLE = Path('style.css')

g = GAME.read_text()

# 1) HUD ref
old = "  const characterNoteEl = document.getElementById('characterNote');\n"
new = old + "  const characterEffectHudEl = document.getElementById('characterEffectHud');\n"
assert old in g, 'characterNote ref not found'
g = g.replace(old, new, 1)

# 2) Make level scaling explicit in catalog text.
repls = {
"trait:'スタンダード', traitDesc:'クセのない基本性能。今まで通りの操作感で遊べる。'":
"trait:'スタンダード', traitDesc:'Lvで走行SCOREが上昇。Lv5・10でCOMBO猶予も伸びる。'",
"trait:'ちいさな体', traitDesc:'当たり判定が小さく、コインを少し多く集められる。'":
"trait:'ちいさな体', traitDesc:'Lvでコインボーナスと小さな当たり判定がさらに強化される。'",
"trait:'ステゴンガード', traitDesc:'一定時間ごとに栗を1回だけ踏みつぶして無傷で進める。'":
"trait:'ステゴンガード', traitDesc:'Lvで再使用が短縮。Lv5でガード後無敵、Lv10で前方の栗も連鎖破壊。'",
"trait:'滑空', traitDesc:'落下がゆるやかになり、空中ルートを長く移動できる。'":
"trait:'滑空', traitDesc:'Lvで滑空が強化。Lv5・10で空中走行SCOREボーナスも付く。'",
}
for a,b in repls.items():
    assert a in g, f'catalog text not found: {a[:20]}'
    g = g.replace(a,b,1)

# 3) Level-benefit helpers after characterUpgradeCost.
anchor = """  function characterUpgradeCost(id) {
    const lv = characterLevel(id);
    return Math.max(1, Math.min(6, Math.ceil(lv / 2)));
  }

"""
assert anchor in g, 'characterUpgradeCost block not found'
helpers = anchor + """  function tiranonScoreBonus(lv) {
    return Math.max(0, Math.min(9, lv - 1));
  }

  function tiranonComboGrace(lv) {
    return lv >= 10 ? .40 : lv >= 5 ? .20 : 0;
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

  function characterEffectSummary(id, lv=characterLevel(id)) {
    if (id === 'tiranon') {
      const scoreBonus = tiranonScoreBonus(lv);
      const grace = tiranonComboGrace(lv);
      return `走行SCORE +${scoreBonus}%${grace ? `・COMBO猶予 +${grace.toFixed(1)}秒` : ''}`;
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
      return `滑空強化 +${glide}%${air ? `・空中走行SCORE +${air}%` : ''}`;
    }
    return '';
  }

  function characterRunScoreMultiplier() {
    if (selectedCharacter === 'tiranon') return 1 + tiranonScoreBonus(characterLevel('tiranon')) / 100;
    if (selectedCharacter === 'pteran' && player.y + player.h < groundY - 2) {
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
    characterEffectHudEl.classList.remove('ready','active');
    let status = '';
    if (selectedCharacter === 'tiranon') {
      const bonus = tiranonScoreBonus(lv);
      const grace = tiranonComboGrace(lv);
      status = `⭐ 走行SCORE +${bonus}%${grace ? `　COMBO +${grace.toFixed(1)}秒` : ''}`;
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
      const gliding = player.vy > 0 && player.descentTime >= .18 && player.y + player.h < groundY - 2;
      const air = pteranAirScoreBonus(lv);
      status = gliding ? `🪽 滑空中${air ? `　空中SCORE +${air}%` : ''}` : `🪽 滑空強化${air ? `　空中SCORE +${air}%` : ''}`;
      if (gliding) characterEffectHudEl.classList.add('active');
    }
    characterEffectHudEl.innerHTML = `<b>${ch.icon} ${ch.name} Lv.${lv}</b><span>${status}</span>`;
  }

"""
g = g.replace(anchor, helpers, 1)

# 4) Character cards show current and next-level benefit.
old = """      return `<div class=\"characterItem ${!unlocked?'locked':''} ${selected?'active':''} ${unavailable?'coming':''}\"><div class=\"characterPreview\">${preview}</div><div class=\"characterInfo\"><strong>${ch.name}</strong><small>${ch.desc}</small><small>特性：<b>${ch.trait}</b>｜${ch.traitDesc}</small><em>${status}</em><div class=\"characterActions\">${actions}</div></div></div>`;
"""
new = """      const effectNow = characterEffectSummary(id, lv);
      const effectNext = lv < ch.maxLevel ? characterEffectSummary(id, lv + 1) : '';
      const milestone = lv + 1 === 5 || lv + 1 === 10 ? ' ★節目強化' : '';
      return `<div class=\"characterItem ${!unlocked?'locked':''} ${selected?'active':''} ${unavailable?'coming':''}\"><div class=\"characterPreview\">${preview}</div><div class=\"characterInfo\"><strong>${ch.name}</strong><small>${ch.desc}</small><small>特性：<b>${ch.trait}</b>｜${ch.traitDesc}</small><small class=\"charLevelEffect\">Lv.${lv}効果：${effectNow}</small>${effectNext ? `<small class=\"charLevelNext\">次 Lv.${lv+1}${milestone}：${effectNext}</small>` : '<small class=\"charLevelNext max\">レベル効果 MAX</small>'}<em>${status}</em><div class=\"characterActions\">${actions}</div></div></div>`;
"""
assert old in g, 'character card return not found'
g = g.replace(old,new,1)

# 5) Selected level-up gives explicit feedback.
old = """      characterLevels[id] = lv + 1;
      saveProgress();
      updateProfileUi();
      renderCharacters();
      beep(880, .09, 'sine', .03);
"""
new = """      characterLevels[id] = lv + 1;
      saveProgress();
      updateProfileUi();
      renderCharacters();
      if (characterNoteEl) characterNoteEl.textContent = `LEVEL UP! ${ch.name} Lv.${lv+1}　${characterEffectSummary(id, lv+1)}`;
      updateCharacterEffectHud();
      beep(880, .09, 'sine', .03);
"""
assert old in g, 'character level-up handler not found'
g = g.replace(old,new,1)

# 6) Tiranon/pteran run-score level benefit.
old = "    scoreFloat += (worldSp * dt / 18) * (player.fever > 0 ? 3 : 1);\n"
new = "    scoreFloat += (worldSp * dt / 18) * (player.fever > 0 ? 3 : 1) * characterRunScoreMultiplier();\n"
assert old in g, 'run score line not found'
g = g.replace(old,new,1)

# 7) Pteran glide level scaling.
old = """    } else if (pteranLevel > 0 && player.vy > 0) {
      gravity = Math.max(1180, 1500 - (pteranLevel - 1) * 35);
    }
"""
new = """    } else if (pteranLevel > 0 && player.vy > 0) {
      gravity = pteranGravityForLevel(pteranLevel);
    }
"""
assert old in g, 'pteran gravity block not found'
g = g.replace(old,new,1)
old = """    } else if (pteranLevel > 0 && player.vy > 0) {
      player.vy = Math.min(player.vy, Math.max(360, 520 - (pteranLevel - 1) * 16));
"""
new = """    } else if (pteranLevel > 0 && player.vy > 0) {
      player.vy = Math.min(player.vy, pteranFallCapForLevel(pteranLevel));
"""
assert old in g, 'pteran fall cap block not found'
g = g.replace(old,new,1)

# 8) Mininon hitbox and coin bonus scale via shared helpers.
old = "    const mininonShrink = mininonLevel > 0 ? Math.min(.07, .03 + (mininonLevel - 1) * .004) : 0;\n"
new = "    const mininonShrink = mininonLevel > 0 ? mininonShrinkForLevel(mininonLevel) : 0;\n"
assert old in g, 'mininon shrink line not found'
g = g.replace(old,new,1)
old = "      mininonCoinMeter += gain * (.06 + (lv - 1) * .012);\n"
new = "      mininonCoinMeter += gain * mininonCoinBonusRate(lv);\n"
assert old in g, 'mininon coin line not found'
g = g.replace(old,new,1)

# 9) Tiranon combo milestone benefit.
old = "    comboTimer = near ? 2.15 : 1.72;\n"
new = "    const comboGrace = selectedCharacter === 'tiranon' ? tiranonComboGrace(characterLevel('tiranon')) : 0;\n    comboTimer = (near ? 2.15 : 1.72) + comboGrace;\n"
assert old in g, 'combo timer line not found'
g = g.replace(old,new,1)

# 10) Stegon cooldown, Lv5 safety, Lv10 chain break.
old = """          stegonGuardCooldown = Math.max(8.5, 16 - (lv - 1) * .75);
          const guardScore = 30 + lv * 5;
          scoreFloat += guardScore;
          score = Math.floor(scoreFloat);
          shake = Math.max(shake, 5);
          flash = Math.max(flash, .06);
          burst(o.x + o.w/2, o.y + o.h/2, '#f1b36b', 16, 185);
          popText(`ステゴンガード！ +${guardScore}`, player.x + player.w*.65, player.y - 14, '#ffe0a4', .85, 18);
          objects.splice(i, 1);
          beep(175, .09, 'square', .035);
"""
new = """          stegonGuardCooldown = stegonCooldownForLevel(lv);
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
"""
assert old in g, 'stegon guard block not found'
g = g.replace(old,new,1)

# 11) Update persistent character-effect HUD together with HUD.
old = """    wingBuff.style.display = player.wing > 0 ? 'block' : 'none';
  }
"""
new = """    wingBuff.style.display = player.wing > 0 ? 'block' : 'none';
    updateCharacterEffectHud();
  }
"""
assert old in g, 'updateHud tail not found'
g = g.replace(old,new,1)

GAME.write_text(g)

# HTML: persistent in-run character effect chip + cache bust.
h = INDEX.read_text()
old = """  </div>

  <div id=\"itemBar\">"""
new = """  </div>

  <div id=\"characterEffectHud\" hidden aria-live=\"polite\"></div>

  <div id=\"itemBar\">"""
assert old in h, 'itemBar anchor not found'
h = h.replace(old,new,1)
h = h.replace('20260915-polish2','20260916-charlevel1')
INDEX.write_text(h)

# CSS: visible but compact level effect; character menu current/next benefits.
css = STYLE.read_text()
css += """

/* character-level-benefits-v1 */
#characterEffectHud{position:absolute;right:calc(env(safe-area-inset-right) + 12px);bottom:calc(env(safe-area-inset-bottom) + 72px);z-index:5;max-width:min(62vw,290px);padding:7px 10px;border:2px solid #fff;border-radius:14px;background:#fffdf0e8;box-shadow:0 4px 14px #243f3620;pointer-events:none;text-align:left;line-height:1.18;backdrop-filter:blur(3px);transition:transform .12s,background .12s,box-shadow .12s}#characterEffectHud[hidden]{display:none}#characterEffectHud b{display:block;font-size:11px;color:#4b625a;white-space:nowrap}#characterEffectHud span{display:block;margin-top:2px;font-size:10px;font-weight:900;color:#75613e;white-space:nowrap}#characterEffectHud.ready{background:#fff4cfee;box-shadow:0 0 0 2px #ffd97488,0 4px 14px #243f3620;transform:scale(1.025)}#characterEffectHud.active{background:#e9f9ffee;box-shadow:0 0 0 2px #aeeaff88,0 4px 14px #243f3620;transform:scale(1.025)}.charLevelEffect{margin-top:6px!important;padding:5px 7px;border-radius:9px;background:#f0f8f3;color:#356858!important;font-weight:900}.charLevelNext{margin-top:4px!important;padding:5px 7px;border-radius:9px;background:#f4f0ff;color:#69549c!important;font-weight:900}.charLevelNext.max{background:#fff3cf;color:#8a6a26!important}@media(max-width:390px){#characterEffectHud{right:calc(env(safe-area-inset-right) + 8px);bottom:calc(env(safe-area-inset-bottom) + 68px);max-width:64vw;padding:6px 8px}#characterEffectHud b{font-size:10px}#characterEffectHud span{font-size:9px}}
"""
STYLE.write_text(css)
