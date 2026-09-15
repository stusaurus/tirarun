from pathlib import Path

GAME = Path('game.js')
INDEX = Path('index.html')

g = GAME.read_text()

# Use the front-facing art in the character selector.
g = g.replace("preview:'8730184C-FBB1-4BDA-BF85-FF4F24AED3C7.png'", "preview:'8EF97C48-064E-4EDC-95DA-7EB00DA5F1D1.png'", 1)
g = g.replace("preview:'8E0967A2-6213-4014-AD0F-204E1BB3A89F.png'", "preview:'D1D9FF27-0E76-4D9C-8F0E-862356577F01.png'", 1)

old = """    stegonChar: '8730184C-FBB1-4BDA-BF85-FF4F24AED3C7.png',
    pteranChar: '8E0967A2-6213-4014-AD0F-204E1BB3A89F.png',"""
new = """    stegonRun1: '8730184C-FBB1-4BDA-BF85-FF4F24AED3C7.png',
    stegonRun2: 'DCB091BC-7A59-435A-9F19-78285C56A4BF.png',
    stegonJump: 'DE557F47-D307-4934-B684-BE560F5B52D6.png',
    stegonFront: '8EF97C48-064E-4EDC-95DA-7EB00DA5F1D1.png',
    pteranRun1: '8E0967A2-6213-4014-AD0F-204E1BB3A89F.png',
    pteranRun2: '304EEA32-1229-4F79-B3FD-BF2B49632167.png',
    pteranJump: 'D364C13F-1755-481F-9D5B-0D980AEBD7A1.png',
    pteranGlide: '13E57C5F-73B3-4919-AEAD-F456E8A57EB3.png',
    pteranFront: 'D1D9FF27-0E76-4D9C-8F0E-862356577F01.png',"""
assert old in g, 'old stegon/pteran sprite paths not found'
g = g.replace(old, new, 1)

old = """  function currentPlayerSprite(airborne=false, damaged=false) {
    if (selectedCharacter === 'mininon') {
      if (damaged) return 'mininonDamage';
      if (airborne) return 'mininonJump';
      return Math.floor(player.runT * 2.2) % 2 ? 'mininonRun1' : 'mininonRun2';
    }
    if (selectedCharacter === 'stegon') return 'stegonChar';
    if (selectedCharacter === 'pteran') return 'pteranChar';
    if (damaged) return 'damage';
    if (airborne) return 'jump';
    return Math.floor(player.runT * 2.2) % 2 ? 'run1' : 'run2';
  }

  function currentPlayerVisualScale(spriteName) {
    if (selectedCharacter === 'mininon') return spriteName === 'mininonDamage' ? 1.76 : 1.74;
    if (selectedCharacter === 'stegon') return 1.92;
    if (selectedCharacter === 'pteran') return 1.86;
    return spriteName === 'damage' ? 1.72 : 1.68;
  }"""
new = """  function currentPlayerSprite(airborne=false, damaged=false) {
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
      if (airborne) return player.vy > 55 ? 'pteranGlide' : 'pteranJump';
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
      if (spriteName === 'pteranGlide') return 1.98;
      if (spriteName === 'pteranJump') return 1.90;
      return 1.86;
    }
    return spriteName === 'damage' ? 1.72 : 1.68;
  }"""
assert old in g, 'currentPlayerSprite block not found'
g = g.replace(old, new, 1)

GAME.write_text(g)

h = INDEX.read_text()
old_token = '20260915-1955'
assert old_token in h, 'cache token not found'
h = h.replace(old_token, '20260915-2110')
INDEX.write_text(h)
