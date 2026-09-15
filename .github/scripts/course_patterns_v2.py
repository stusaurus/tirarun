from pathlib import Path
import re

GAME = Path('game.js')
INDEX = Path('index.html')
g = GAME.read_text()

# Remember recent normal patterns so the run does not feel repetitive.
old = "  let mininonCoinMeter = 0;\n  const RUSH_WARP_DURATION = .95;"
new = "  let mininonCoinMeter = 0;\n  let recentNormalPatterns = [];\n  const RUSH_WARP_DURATION = .95;"
assert old in g
g = g.replace(old, new, 1)

old = "    mininonCoinMeter = 0;\n    resetFlowGoals();"
new = "    mininonCoinMeter = 0;\n    recentNormalPatterns = [];\n    resetFlowGoals();"
assert old in g
g = g.replace(old, new, 1)

# Add small helpers for hand-authored reward lanes and fair pattern selection.
anchor = """  function addBonus(x, y, value=1, routeCue=false) {
    const premium = value > 1;
    objects.push({
      type:'bonus', x, y,
      w: premium ? 28 : 24,
      h: premium ? 28 : 24,
      value, premium, routeCue
    });
  }

"""
assert anchor in g
helpers = anchor + """  function addCoinArc(x, y, count=5, spacing=34, rise=28, value=1) {
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

  function pickNormalPattern(level) {
    const pools = [
      [0,1,2,3,4,5,6,7],
      [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
      [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21],
      [5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27]
    ];
    let candidates = pools[Math.max(0, Math.min(3, level))].filter(id => !recentNormalPatterns.includes(id));
    if (!candidates.length) candidates = pools[Math.max(0, Math.min(3, level))].slice();
    const id = candidates[Math.floor(Math.random() * candidates.length)];
    recentNormalPatterns.push(id);
    if (recentNormalPatterns.length > 3) recentNormalPatterns.shift();
    return id;
  }

"""
g = g.replace(anchor, helpers, 1)

# Replace the old 10-pattern generator with 28 readable, hand-authored patterns.
pattern = re.compile(r"  function spawnNormalPattern\(\) \{.*?\n  \}\n\n  function spawnRushPattern", re.S)
match = pattern.search(g)
assert match, 'spawnNormalPattern block not found'
replacement = r'''  function spawnNormalPattern() {
    const x = W + 90;
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
      addChestnut(x + 152, groundY - 35, .96);
      addChestnut(x + 305, groundY - 33, .88);
      addCoin(x + 76, groundY - 86);
      addCoin(x + 228, groundY - 86);
      patternWidth = 440;
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
      addChestnut(x + 145, groundY - 34, .82);
      addChestnut(x + 290, groundY - 34, .82);
      addChestnut(x + 435, groundY - 34, .82);
      addCoin(x + 68, groundY - 78);
      addCoin(x + 213, groundY - 78);
      addCoin(x + 358, groundY - 78);
      patternWidth = 555;
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
      for (let i=0; i<5; i++) addChestnut(x + i*124, groundY - 32 - (i%2)*4, .76 + (i%3)*.05);
      for (let i=0; i<4; i++) addCoin(x + 58 + i*124, groundY - 76 - (i%2)*8);
      patternWidth = 620;
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
      addBonusArc(x + 125, groundY - 220, 8, 50, 32, true);
      if (!objects.some(o => o.type === 'letter')) addLetter(x + 475, groundY - 260);
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

    // Wider authored patterns get more breathing room; late-game difficulty comes from the pattern itself,
    // not from the next pattern spawning on top of it.
    const rest = level >= 3 ? 105 : level >= 2 ? 118 : 132;
    nextPattern += Math.max(350, patternWidth + rest) + Math.random() * 55;
  }

  function spawnRushPattern'''
g = pattern.sub(replacement, g, count=1)

GAME.write_text(g)

# Cache bust all game assets together; script order stays unchanged.
h = INDEX.read_text()
assert '20260916-glide2' in h
h = h.replace('20260916-glide2', '20260916-course2')
INDEX.write_text(h)
