from pathlib import Path

p = Path('game.js')
s = p.read_text(encoding='utf-8')
old = """    totalRuns += 1;
    wallet += runCoins;
    saveProgress();
    const roarNowUnlocked = isItemUnlocked('roar');
"""
new = """    totalRuns += 1;
    const earnedCoins = runCoins;
    wallet += earnedCoins;
    runCoins = 0;
    saveProgress();
    const roarNowUnlocked = isItemUnlocked('roar');
"""
if old not in s:
    raise SystemExit('missing coin settlement target')
s = s.replace(old, new, 1)
old = """    const coinLine = `<br><span style=\"font-size:15px;color:#9a7119\">🪙 +${runCoins}　所持 ${wallet}</span>`;
"""
new = """    const coinLine = `<br><span style=\"font-size:15px;color:#9a7119\">🪙 +${earnedCoins}　所持 ${wallet}</span>`;
"""
if old not in s:
    raise SystemExit('missing result coin target')
s = s.replace(old, new, 1)
old = """  requestAnimationFrame(loop);
})();
"""
new = """  renderShop();
  requestAnimationFrame(loop);
})();
"""
if old not in s:
    raise SystemExit('missing initial render target')
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')
