from pathlib import Path

GAME = Path('game.js')
INDEX = Path('index.html')

g = GAME.read_text()

old = """    tiranon: {\n      name:'ティラノン', icon:'🦖', unlockLevel:1, maxLevel:10,\n      preview:'1218B0FC-C2A9-4661-8707-C27D900A8992.png',\n      desc:'ティラクリの主人公。元気いっぱいに走るノン！'\n    },\n    mininon: {\n      name:'ミニノン', icon:'🐣', unlockLevel:3, maxLevel:10,\n      preview:'97A7C3F6-D44A-4770-A6CF-55052F221207.png',\n      desc:'黄色い幼稚園服で元気いっぱい。USER Lv.3で仲間入り！'\n    },\n    stegon: {\n      name:'ステゴン', icon:'🦕', unlockLevel:6, maxLevel:10,\n      preview:'8730184C-FBB1-4BDA-BF85-FF4F24AED3C7.png',\n      desc:'どっしり走る、やさしいステゴサウルス。'\n    },\n    pteran: {\n      name:'プテラン', icon:'🪽', unlockLevel:10, maxLevel:10,\n      preview:'8E0967A2-6213-4014-AD0F-204E1BB3A89F.png',\n      desc:'翼を広げて駆ける、空が得意な仲間。'\n    }"""
new = """    tiranon: {\n      name:'ティラノン', icon:'🦖', unlockLevel:1, maxLevel:10,\n      preview:'1218B0FC-C2A9-4661-8707-C27D900A8992.png',\n      desc:'ティラクリの主人公。元気いっぱいに走るノン！',\n      trait:'スタンダード', traitDesc:'クセのない基本性能。今まで通りの操作感で遊べる。'\n    },\n    mininon: {\n      name:'ミニノン', icon:'🐣', unlockLevel:3, maxLevel:10,\n      preview:'97A7C3F6-D44A-4770-A6CF-55052F221207.png',\n      desc:'黄色い幼稚園服で元気いっぱい。USER Lv.3で仲間入り！',\n      trait:'ちいさな体', traitDesc:'当たり判定が小さく、コインを少し多く集められる。'\n    },\n    stegon: {\n      name:'ステゴン', icon:'🦕', unlockLevel:6, maxLevel:10,\n      preview:'8730184C-FBB1-4BDA-BF85-FF4F24AED3C7.png',\n      desc:'どっしり走る、やさしいステゴサウルス。',\n      trait:'ステゴンガード', traitDesc:'一定時間ごとに栗を1回だけ踏みつぶして無傷で進める。'\n    },\n    pteran: {\n      name:'プテラン', icon:'🪽', unlockLevel:10, maxLevel:10,\n      preview:'8E0967A2-6213-4014-AD0F-204E1BB3A89F.png',\n      desc:'翼を広げて駆ける、空が得意な仲間。',\n      trait:'滑空', traitDesc:'落下がゆるやかになり、空中ルートを長く移動できる。'\n    }"""
assert old in g, 'character catalog block not found'
g = g.replace(old, new, 1)

old = """      return `<div class=\"characterItem ${!unlocked?'locked':''} ${selected?'active':''} ${unavailable?'coming':''}\"><div class=\"characterPreview\">${preview}</div><div class=\"characterInfo\"><strong>${ch.name}</strong><small>${ch.desc}</small><em>${status}</em><div class=\"characterActions\">${actions}</div></div></div>`;\n    }).join('');\n    const selected = CHARACTER_CATALOG[selectedCharacter];\n    if (characterNoteEl) characterNoteEl.textContent = `現在：${selected.name} Lv.${characterLevel(selectedCharacter)}　USER Lvが上がると使える仲間が増えるノン！`;"""
new = """      return `<div class=\"characterItem ${!unlocked?'locked':''} ${selected?'active':''} ${unavailable?'coming':''}\"><div class=\"characterPreview\">${preview}</div><div class=\"characterInfo\"><strong>${ch.name}</strong><small>${ch.desc}</small><small>特性：<b>${ch.trait}</b>｜${ch.traitDesc}</small><em>${status}</em><div class=\"characterActions\">${actions}</div></div></div>`;\n    }).join('');\n    const selected = CHARACTER_CATALOG[selectedCharacter];\n    if (characterNoteEl) characterNoteEl.textContent = `現在：${selected.name} Lv.${characterLevel(selectedCharacter)}　特性：${selected.trait}`;"""
assert old in g, 'character render block not found'
g = g.replace(old, new, 1)

old = """  let newRecordAnnounced = false;\n  let newRecordTimer = 0;\n  const RUSH_WARP_DURATION = .95;"""
new = """  let newRecordAnnounced = false;\n  let newRecordTimer = 0;\n  let stegonGuardCooldown = 0;\n  let mininonCoinMeter = 0;\n  const RUSH_WARP_DURATION = .95;"""
assert old in g, 'runtime variable insertion point not found'
g = g.replace(old, new, 1)

old = """    roarFx = 0;\n    runCoins = 0;\n    resetFlowGoals();"""
new = """    roarFx = 0;\n    runCoins = 0;\n    stegonGuardCooldown = 0;\n    mininonCoinMeter = 0;\n    resetFlowGoals();"""
assert old in g, 'reset insertion point not found'
g = g.replace(old, new, 1)

old = """    rushWarpTimer = Math.max(0, rushWarpTimer - dt);\n    roarFx = Math.max(0, roarFx - dt);\n    newRecordTimer = Math.max(0, newRecordTimer - dt);\n    updateEvents(dt);"""
new = """    rushWarpTimer = Math.max(0, rushWarpTimer - dt);\n    roarFx = Math.max(0, roarFx - dt);\n    newRecordTimer = Math.max(0, newRecordTimer - dt);\n    if (selectedCharacter === 'stegon') stegonGuardCooldown = Math.max(0, stegonGuardCooldown - dt);\n    else stegonGuardCooldown = 0;\n    updateEvents(dt);"""
assert old in g, 'timer update block not found'
g = g.replace(old, new, 1)

old = """    const wingLevel = Math.max(1, itemLevel('wing'));\n    const gravity = player.wing > 0 ? Math.max(620, 980 - (wingLevel - 1) * 90) : 1850;\n    player.vy += gravity * dt;\n    if (player.wing > 0 && player.vy > 0) {\n      player.vy = Math.min(player.vy, Math.max(220, 340 - (wingLevel - 1) * 25));\n    }\n    player.y += player.vy * dt;"""
new = """    const wingLevel = Math.max(1, itemLevel('wing'));\n    const pteranLevel = selectedCharacter === 'pteran' ? characterLevel('pteran') : 0;\n    let gravity = 1850;\n    if (player.wing > 0) {\n      gravity = Math.max(620, 980 - (wingLevel - 1) * 90);\n    } else if (pteranLevel > 0 && player.vy > 0) {\n      gravity = Math.max(1180, 1500 - (pteranLevel - 1) * 35);\n    }\n    player.vy += gravity * dt;\n    if (player.wing > 0 && player.vy > 0) {\n      player.vy = Math.min(player.vy, Math.max(220, 340 - (wingLevel - 1) * 25));\n    } else if (pteranLevel > 0 && player.vy > 0) {\n      player.vy = Math.min(player.vy, Math.max(360, 520 - (pteranLevel - 1) * 16));\n      if (Math.random() < dt * 8) {\n        particles.push({x:player.x + player.w*.20, y:player.y + player.h*.58, vx:-55-Math.random()*35, vy:(Math.random()-.5)*28, life:.24, color:'#d9f6ff', r:2+Math.random()*2});\n      }\n    }\n    player.y += player.vy * dt;"""
assert old in g, 'gravity block not found'
g = g.replace(old, new, 1)

old = """    const pbox = {\n      x: player.x + player.w * .18,\n      y: player.y + player.h * .12,\n      w: player.w * .64,\n      h: player.h * .78\n    };"""
new = """    const mininonLevel = selectedCharacter === 'mininon' ? characterLevel('mininon') : 0;\n    const mininonShrink = mininonLevel > 0 ? Math.min(.07, .03 + (mininonLevel - 1) * .004) : 0;\n    const pbox = {\n      x: player.x + player.w * (.18 + mininonShrink),\n      y: player.y + player.h * (.12 + mininonShrink * .6),\n      w: player.w * (.64 - mininonShrink * 2),\n      h: player.h * (.78 - mininonShrink * 1.2)\n    };"""
assert old in g, 'player hitbox block not found'
g = g.replace(old, new, 1)

old = """        if (player.shield) {\n          player.shield = false;\n          player.invincible = 1.25;"""
new = """        if (selectedCharacter === 'stegon' && stegonGuardCooldown <= 0) {\n          const lv = characterLevel('stegon');\n          stegonGuardCooldown = Math.max(8.5, 16 - (lv - 1) * .75);\n          const guardScore = 30 + lv * 5;\n          scoreFloat += guardScore;\n          score = Math.floor(scoreFloat);\n          shake = Math.max(shake, 5);\n          flash = Math.max(flash, .06);\n          burst(o.x + o.w/2, o.y + o.h/2, '#f1b36b', 16, 185);\n          popText(`ステゴンガード！ +${guardScore}`, player.x + player.w*.65, player.y - 14, '#ffe0a4', .85, 18);\n          objects.splice(i, 1);\n          beep(175, .09, 'square', .035);\n          setTimeout(() => beep(310, .07, 'sine', .022), 65);\n          continue;\n        }\n        if (player.shield) {\n          player.shield = false;\n          player.invincible = 1.25;"""
assert old in g, 'shield collision block not found'
g = g.replace(old, new, 1)

old = """  function collectCoin(o) {\n    const gain = Math.max(1, Number(o.value || 1));\n    runCoins += gain;\n    scoreFloat += 5 * gain;\n    score = Math.floor(scoreFloat);\n    burst(o.x + o.w/2, o.y + o.h/2, '#ffd34e', 7, 90);\n    beep(760 + Math.min(5, runCoins % 6) * 28, .028, 'sine', .014);\n  }"""
new = """  function collectCoin(o) {\n    const gain = Math.max(1, Number(o.value || 1));\n    runCoins += gain;\n    let mininonExtra = 0;\n    if (selectedCharacter === 'mininon') {\n      const lv = characterLevel('mininon');\n      mininonCoinMeter += gain * (.06 + (lv - 1) * .012);\n      mininonExtra = Math.floor(mininonCoinMeter);\n      if (mininonExtra > 0) {\n        mininonCoinMeter -= mininonExtra;\n        runCoins += mininonExtra;\n        popText(`ミニノン 🪙+${mininonExtra}`, o.x + o.w/2, o.y - 8, '#fff0a6', .6, 14);\n      }\n    }\n    scoreFloat += 5 * gain;\n    score = Math.floor(scoreFloat);\n    burst(o.x + o.w/2, o.y + o.h/2, '#ffd34e', mininonExtra ? 10 : 7, mininonExtra ? 120 : 90);\n    beep(760 + Math.min(5, runCoins % 6) * 28, .028, 'sine', .014);\n  }"""
assert old in g, 'collectCoin block not found'
g = g.replace(old, new, 1)

GAME.write_text(g)

h = INDEX.read_text()
assert '20260915-2015' in h, 'cache token not found'
h = h.replace('20260915-2015', '20260915-1955')
INDEX.write_text(h)
