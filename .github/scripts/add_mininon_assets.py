from pathlib import Path

GAME = Path('game.js')
INDEX = Path('index.html')

g = GAME.read_text()

old = """    mininon: {\n      name:'ミニノン', icon:'🐣', unlockLevel:3, maxLevel:10, coming:true,\n      preview:null, desc:'USER Lv.3で仲間入り予定。イラスト準備中！'\n    },"""
new = """    mininon: {\n      name:'ミニノン', icon:'🐣', unlockLevel:3, maxLevel:10,\n      preview:'97A7C3F6-D44A-4770-A6CF-55052F221207.png',\n      desc:'黄色い幼稚園服で元気いっぱい。USER Lv.3で仲間入り！'\n    },"""
assert old in g, 'mininon catalog block not found'
g = g.replace(old, new, 1)

old = """    damage: 'DE619F5B-547D-4A02-866D-6E072FD3FF44.png',\n    stegonChar: '8730184C-FBB1-4BDA-BF85-FF4F24AED3C7.png',"""
new = """    damage: 'DE619F5B-547D-4A02-866D-6E072FD3FF44.png',\n    mininonRun1: '37BA91C1-A1B6-475F-80C7-99CA9C0F4227.png',\n    mininonRun2: '634BE8E3-47BD-41B4-86E8-00583F529982.png',\n    mininonJump: 'BF34325B-EA6D-4DCF-83A1-0F7A8326E6A5.png',\n    mininonDamage: '72F50358-ABF9-4E2F-B676-133E5104CB8E.png',\n    mininonFront: '97A7C3F6-D44A-4770-A6CF-55052F221207.png',\n    stegonChar: '8730184C-FBB1-4BDA-BF85-FF4F24AED3C7.png',"""
assert old in g, 'sprite paths insertion point not found'
g = g.replace(old, new, 1)

old = """  function currentPlayerSprite(airborne=false, damaged=false) {\n    if (selectedCharacter === 'stegon') return 'stegonChar';\n    if (selectedCharacter === 'pteran') return 'pteranChar';\n    if (damaged) return 'damage';\n    if (airborne) return 'jump';\n    return Math.floor(player.runT * 2.2) % 2 ? 'run1' : 'run2';\n  }\n\n  function currentPlayerVisualScale(spriteName) {\n    if (selectedCharacter === 'stegon') return 1.92;\n    if (selectedCharacter === 'pteran') return 1.86;\n    return spriteName === 'damage' ? 1.72 : 1.68;\n  }"""
new = """  function currentPlayerSprite(airborne=false, damaged=false) {\n    if (selectedCharacter === 'mininon') {\n      if (damaged) return 'mininonDamage';\n      if (airborne) return 'mininonJump';\n      return Math.floor(player.runT * 2.2) % 2 ? 'mininonRun1' : 'mininonRun2';\n    }\n    if (selectedCharacter === 'stegon') return 'stegonChar';\n    if (selectedCharacter === 'pteran') return 'pteranChar';\n    if (damaged) return 'damage';\n    if (airborne) return 'jump';\n    return Math.floor(player.runT * 2.2) % 2 ? 'run1' : 'run2';\n  }\n\n  function currentPlayerVisualScale(spriteName) {\n    if (selectedCharacter === 'mininon') return spriteName === 'mininonDamage' ? 1.76 : 1.74;\n    if (selectedCharacter === 'stegon') return 1.92;\n    if (selectedCharacter === 'pteran') return 1.86;\n    return spriteName === 'damage' ? 1.72 : 1.68;\n  }"""
assert old in g, 'current player sprite block not found'
g = g.replace(old, new, 1)

GAME.write_text(g)

h = INDEX.read_text()
h = h.replace('20260915-1900', '20260915-2015')
INDEX.write_text(h)
