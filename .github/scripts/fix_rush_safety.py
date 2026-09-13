from pathlib import Path


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f"missing replacement target: {label}")
    return text.replace(old, new, 1)


game = Path("game.js")
s = game.read_text(encoding="utf-8")

s = replace_once(
    s,
    """    const eventBoost = eventMode === 'rush' ? 20 : eventMode === 'bonus' ? 12 : 0;
    return Math.min(540, 275 + distance * .0062 + (player.fever > 0 ? 25 : 0) + eventBoost);
""",
    """    const eventBoost = eventMode === 'rush' ? 0 : eventMode === 'bonus' ? 12 : 0;
    return Math.min(540, 275 + distance * .0062 + (player.fever > 0 ? 25 : 0) + eventBoost);
""",
    "rush speed boost",
)

s = replace_once(
    s,
    """  function spawnRushPattern() {
    const x = W + 70;
    const kind = Math.floor(Math.random() * 5);
    if (kind === 0) {
      addChestnut(x, groundY - 33, .86);
      addChestnut(x + 68, groundY - 37, 1.02);
      addChestnut(x + 142, groundY - 33, .88);
    } else if (kind === 1) {
      addChestnut(x, groundY - 33, .9);
      addChestnut(x + 90, groundY - 50, 1.22);
      addChestnut(x + 188, groundY - 33, .92);
    } else if (kind === 2) {
      addPlatform(x + 42, groundY - 82, 150);
      addChestnut(x, groundY - 33, .86);
      addChestnut(x + 92, groundY - 116, .88);
      addChestnut(x + 205, groundY - 34, 1.0);
    } else if (kind === 3) {
      addChestnut(x, groundY - 33, .84);
      addChestnut(x + 72, groundY - 33, .84);
      addChestnut(x + 168, groundY - 42, 1.10);
    } else {
      addChestnut(x, groundY - 34, 1.0);
      addChestnut(x + 104, groundY - 34, .88);
      addChestnut(x + 194, groundY - 55, 1.30);
    }
    nextPattern += 315 + Math.random() * 70;
  }
""",
    """  function spawnRushPattern() {
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
""",
    "rush patterns",
)

s = replace_once(
    s,
    """  function startEvent(type) {
    eventMode = type;
    eventTimer = type === 'rush' ? 7.0 : 8.5;
    eventBanner = type === 'rush' ? '🌰 KURI RUSH!' : '⭐ BONUS RUN!';
    eventBannerTimer = 1.8;
    nextPattern = Math.min(nextPattern, distance + W + (type === 'rush' ? 175 : 150));
    flash = .12;
    if (type === 'rush') {
      popText('栗ラッシュ！ よけきれ！', W*.5, H*.32, '#ffd08a', 1.1, 22);
      beep(250, .13, 'sawtooth', .04);
    } else {
      popText('ボーナスタイム！', W*.5, H*.32, '#fff1a0', 1.0, 22);
      beep(880, .12, 'square', .032);
    }
  }
""",
    """  function startEvent(type) {
    eventMode = type;
    eventTimer = type === 'rush' ? 6.5 : 8.5;
    eventBanner = type === 'rush' ? '🌰 KURI RUSH!' : '⭐ BONUS RUN!';
    eventBannerTimer = 1.8;
    if (type === 'rush') {
      // Clear every dangerous chestnut in front of Tiranon, then leave a long
      // run-up so the first rush obstacle always enters visibly from offscreen.
      objects = objects.filter(o => o.type !== 'kuri' || o.x < player.x - 24);
      nextPattern = distance + W + 300;
      flash = 0;
      popText('栗ラッシュ！ 準備！', W*.5, H*.32, '#ffd08a', 1.0, 22);
      beep(250, .13, 'sawtooth', .04);
    } else {
      nextPattern = Math.min(nextPattern, distance + W + 150);
      flash = .12;
      popText('ボーナスタイム！', W*.5, H*.32, '#fff1a0', 1.0, 22);
      beep(880, .12, 'square', .032);
    }
  }
""",
    "rush safe start",
)

game.write_text(s, encoding="utf-8")

index = Path("index.html")
h = index.read_text(encoding="utf-8")
if "20260913-1525" not in h:
    raise SystemExit("missing cache version")
h = h.replace("20260913-1525", "20260913-1538")
index.write_text(h, encoding="utf-8")
