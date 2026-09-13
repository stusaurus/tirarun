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
"  const coinHudEl = document.getElementById('coinHud');\n",
"  const coinHudEl = document.getElementById('coinHud');\n  const goalHudEl = document.getElementById('goalHud');\n",
'goal HUD element')

rep(
"  let rushWarpTimer = 0;\n  let roarFx = 0;\n  const RUSH_WARP_DURATION = .95;\n",
"  let rushWarpTimer = 0;\n  let roarFx = 0;\n  let runBestAtStart = best;\n  let flowGoals = [];\n  let flowGoalIndex = 0;\n  let nextScoreGoal = 0;\n  let flowGoalStart = 0;\n  let flowRestPatterns = 0;\n  let bestApproachShown = false;\n  let recordChase = false;\n  let newRecordAnnounced = false;\n  let newRecordTimer = 0;\n  const RUSH_WARP_DURATION = .95;\n",
'flow state variables')

anchor = "  bestEl.textContent = '/ ' + best;\n"
flow_functions = r'''  function roundFlowGoal(value) {
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
    flowGoals = buildFlowGoals(runBestAtStart);
    flowGoalIndex = 0;
    flowGoalStart = 0;
    nextScoreGoal = flowGoals[0] || 1500;
    flowRestPatterns = 0;
    bestApproachShown = false;
    recordChase = false;
    newRecordAnnounced = false;
    newRecordTimer = 0;
  }

  function advanceFlowGoal() {
    const cleared = nextScoreGoal;
    flowGoalStart = cleared;
    flowGoalIndex++;
    if (flowGoalIndex < flowGoals.length) {
      nextScoreGoal = flowGoals[flowGoalIndex];
    } else {
      nextScoreGoal = roundFlowGoal(cleared + Math.max(1800, cleared * .14));
      flowGoals.push(nextScoreGoal);
    }
    flowRestPatterns = Math.max(flowRestPatterns, 1);
    popText(`GOAL CLEAR! ${cleared.toLocaleString()}`, W*.5, H*.31, '#fff0a6', .95, 21);
    burst(player.x + player.w/2, player.y + player.h/2, '#ffd25d', 18, 160);
    beep(820, .08, 'sine', .03);
    setTimeout(() => beep(1040, .08, 'sine', .024), 70);
  }

  function updateFlowGoals() {
    while (nextScoreGoal > 0 && score >= nextScoreGoal) advanceFlowGoal();

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

'''
if anchor not in s:
    raise SystemExit('missing flow function anchor')
s = s.replace(anchor, flow_functions + anchor, 1)

rep(
"    runCoins = 0;\n    Object.assign(player, {\n",
"    runCoins = 0;\n    resetFlowGoals();\n    Object.assign(player, {\n",
'flow reset')

rep(
"    const coinLine = `<br><span style=\"font-size:15px;color:#9a7119\">🪙 +${earnedCoins}　所持 ${wallet}</span>`;\n",
"    const coinLine = `<br><span style=\"font-size:15px;color:#9a7119\">🪙 +${earnedCoins}　所持 ${wallet}</span>`;\n    const nextRemain = Math.max(0, nextScoreGoal - score);\n    const nextLine = `<br><span style=\"font-size:13px;color:#7b6845\">NEXT ${nextScoreGoal.toLocaleString()}まで あと${nextRemain.toLocaleString()}</span>`;\n",
'finish next line')
rep(
"    resultEl.innerHTML = `SCORE ${score}<br><span style=\"font-size:15px;color:#6a7c75\">BEST ${best}</span>${comboLine}${coinLine}${unlockLine}`;\n",
"    resultEl.innerHTML = `SCORE ${score}<br><span style=\"font-size:15px;color:#6a7c75\">BEST ${best}</span>${comboLine}${coinLine}${nextLine}${unlockLine}`;\n",
'finish result')

rest_anchor = "  function spawnNormalPattern() {\n"
rest_fn = r'''  function spawnRestPattern() {
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

'''
if rest_anchor not in s:
    raise SystemExit('missing rest pattern anchor')
s = s.replace(rest_anchor, rest_fn + rest_anchor, 1)

rep(
"  function spawnPattern() {\n    if (eventMode === 'rush') spawnRushPattern();\n    else if (eventMode === 'bonus') spawnBonusPattern();\n    else spawnNormalPattern();\n  }\n",
"  function spawnPattern() {\n    if (eventMode === 'rush') spawnRushPattern();\n    else if (eventMode === 'bonus') spawnBonusPattern();\n    else if (flowRestPatterns > 0) spawnRestPattern();\n    else spawnNormalPattern();\n  }\n",
'flow rest selection')

rep(
"        eventBanner = '';\n        if (ended === 'rush') {\n",
"        eventBanner = '';\n        flowRestPatterns = Math.max(flowRestPatterns, ended === 'rush' ? 2 : 1);\n        if (ended === 'rush') {\n",
'post event breather')

rep(
"    scoreFloat += (worldSp * dt / 18) * (player.fever > 0 ? 3 : 1);\n    score = Math.floor(scoreFloat);\n\n    const feverBefore = player.fever;\n",
"    scoreFloat += (worldSp * dt / 18) * (player.fever > 0 ? 3 : 1);\n    score = Math.floor(scoreFloat);\n    updateFlowGoals();\n\n    const feverBefore = player.fever;\n",
'flow update')

rep(
"    roarFx = Math.max(0, roarFx - dt);\n    updateEvents(dt);\n",
"    roarFx = Math.max(0, roarFx - dt);\n    newRecordTimer = Math.max(0, newRecordTimer - dt);\n    updateEvents(dt);\n",
'new record timer')

rep(
"    coinHudEl.textContent = `🪙 ${wallet + runCoins}`;\n",
"    coinHudEl.textContent = `🪙 ${wallet + runCoins}`;\n    if (goalHudEl) {\n      const remain = Math.max(0, nextScoreGoal - score);\n      if (recordChase && runBestAtStart > 0 && score <= runBestAtStart) {\n        goalHudEl.textContent = `🔥 BESTまであと ${Math.max(0, runBestAtStart-score).toLocaleString()}`;\n      } else if (newRecordTimer > 0) {\n        goalHudEl.textContent = '🏆 NEW RECORD!';\n      } else {\n        goalHudEl.textContent = `NEXT ${nextScoreGoal.toLocaleString()}　あと ${remain.toLocaleString()}`;\n      }\n      goalHudEl.classList.toggle('hot', recordChase || newRecordTimer > 0);\n    }\n",
'goal HUD update')

runui_anchor = "  function drawRunUI() {\n"
record_fn = r'''  function drawRecordChaseEffect() {
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

'''
if runui_anchor not in s:
    raise SystemExit('missing run UI anchor')
s = s.replace(runui_anchor, record_fn + runui_anchor, 1)

rep(
"    drawRunUI();\n\n    if(flash>0){\n",
"    drawRecordChaseEffect();\n    drawRunUI();\n\n    if(flash>0){\n",
'record chase draw')

game.write_text(s, encoding='utf-8')

html = index.read_text(encoding='utf-8')
old_hud = "      <div id=\"coinHud\">🪙 0</div>\n"
new_hud = "      <div id=\"coinHud\">🪙 0</div>\n      <div id=\"goalHud\">NEXT 1,500　あと 1,500</div>\n"
if old_hud not in html:
    raise SystemExit('missing index goal HUD anchor')
html = html.replace(old_hud, new_hud, 1)
old_v = '20260913-2110'
new_v = '20260913-2140'
if old_v not in html:
    raise SystemExit('missing index cache version')
html = html.replace(old_v, new_v)
index.write_text(html, encoding='utf-8')

css = style.read_text(encoding='utf-8')
addition = "\n/* flow-state-v1 */\n#goalHud{margin-top:5px;padding-top:5px;border-top:1px solid #d9cfa4;font-size:10px;line-height:1.2;color:#75613a;font-weight:900;white-space:nowrap;transition:color .18s,transform .18s}#goalHud.hot{color:#d87818;transform:scale(1.03);text-shadow:0 1px 0 #fff2b5}.stat{min-width:142px}\n"
if '/* flow-state-v1 */' not in css:
    css += addition
style.write_text(css, encoding='utf-8')
