from pathlib import Path

path = Path('game.js')
s = path.read_text(encoding='utf-8')


def rep(old, new, label):
    global s
    if old not in s:
        raise SystemExit(f'missing replacement target: {label}')
    s = s.replace(old, new, 1)


rep("""  function comboMultiplier() {
    if (combo >= 12) return 5;
    if (combo >= 7) return 3;
    if (combo >= 3) return 2;
    return 1;
  }
""", """  function comboMultiplier() {
    if (combo >= 16) return 5;
    if (combo >= 9) return 3;
    if (combo >= 4) return 2;
    return 1;
  }
""", 'combo thresholds')

rep("    comboTimer = 2.7;\n", "    comboTimer = near ? 2.15 : 1.72;\n", 'combo timer')
rep("    } else if (combo === 3 || combo === 7 || combo === 12) {\n", "    } else if (combo === 4 || combo === 9 || combo === 16) {\n", 'combo milestones')

rep("""    const eventBoost = eventMode === 'rush' ? 34 : eventMode === 'bonus' ? 12 : 0;
    return Math.min(540, 275 + distance * .0062 + (player.fever > 0 ? 25 : 0) + eventBoost);
""", """    const eventBoost = eventMode === 'rush' ? 48 : eventMode === 'bonus' ? 12 : 0;
    return Math.min(555, 275 + distance * .0062 + (player.fever > 0 ? 25 : 0) + eventBoost);
""", 'rush speed')

rep("""  function addSpring(x, y=groundY-12, w=52) {
    objects.push({type:'spring', x, y, w, h:12, used:false});
  }
""", """  function addSpring(x, y=groundY-12, w=52, route=false) {
    objects.push({type:'spring', x, y, w, h:12, used:false, route});
  }
""", 'route spring')

rep("""  function addBonus(x, y) {
    objects.push({type:'bonus', x, y, w:24, h:24});
  }
""", """  function addBonus(x, y, value=1, routeCue=false) {
    const premium = value > 1;
    objects.push({
      type:'bonus', x, y,
      w: premium ? 28 : 24,
      h: premium ? 28 : 24,
      value, premium, routeCue
    });
  }
""", 'premium bonus')

rep("""      addSpring(x, groundY - 12, 54);
      addPlatform(x + 105, groundY - 152, 190);
      addChestnut(x + 125, groundY - 34, .94);
      addChestnut(x + 220, groundY - 36, 1.0);
      addBonus(x + 145, groundY - 190);
      addBonus(x + 205, groundY - 190);
      addBonus(x + 265, groundY - 190);
""", """      addSpring(x, groundY - 12, 54, true);
      addPlatform(x + 105, groundY - 152, 210);
      addChestnut(x + 125, groundY - 34, .94);
      addChestnut(x + 230, groundY - 36, 1.0);
      addBonus(x + 140, groundY - 190, 2, true);
      addBonus(x + 193, groundY - 205, 2);
      addBonus(x + 246, groundY - 205, 2);
      addBonus(x + 299, groundY - 190, 2);
      if (!objects.some(o => o.type === 'letter') && Math.random() < .35) {
        addLetter(x + 277, groundY - 236);
      } else if (Math.random() < .30) {
        addItem(x + 285, groundY - 218, Math.random() < .55 ? 'magnet' : 'shield');
      }
""", 'high route pattern 6')

rep("""      addPlatform(x, groundY - 58, 90);
      addPlatform(x + 100, groundY - 105, 90);
      addPlatform(x + 200, groundY - 152, 110);
      addBonus(x + 238, groundY - 188);
      addChestnut(x + 320, groundY - 34, 1);
""", """      addPlatform(x, groundY - 58, 90);
      addPlatform(x + 100, groundY - 105, 90);
      addPlatform(x + 200, groundY - 152, 120);
      addBonus(x + 210, groundY - 188, 2, true);
      addBonus(x + 252, groundY - 201, 2);
      addBonus(x + 294, groundY - 188, 2);
      if (Math.random() < .34) addItem(x + 255, groundY - 236, Math.random() < .5 ? 'shield' : 'magnet');
      addChestnut(x + 340, groundY - 34, 1);
""", 'high route pattern 7')

rep("""      addSpring(x, groundY - 12, 48);
      addPlatform(x + 98, groundY - 170, 230);
      addChestnut(x + 130, groundY - 34, .9);
      addChestnut(x + 235, groundY - 36, 1.05);
      addBonus(x + 150, groundY - 206);
      addBonus(x + 215, groundY - 206);
      if (Math.random() < .55) addItem(x + 285, groundY - 210, Math.random() < .5 ? 'magnet' : 'shield');
""", """      addSpring(x, groundY - 12, 50, true);
      addPlatform(x + 98, groundY - 170, 245);
      addChestnut(x + 132, groundY - 34, .9);
      addChestnut(x + 244, groundY - 36, 1.05);
      addBonus(x + 143, groundY - 206, 2, true);
      addBonus(x + 194, groundY - 221, 2);
      addBonus(x + 245, groundY - 221, 2);
      addBonus(x + 296, groundY - 206, 2);
      if (!objects.some(o => o.type === 'letter') && Math.random() < .42) addLetter(x + 302, groundY - 248);
      if (Math.random() < .72) addItem(x + 334, groundY - 212, Math.random() < .52 ? 'magnet' : 'shield');
""", 'high route pattern 9')

rep("""  function spawnRushPattern() {
    const x = W + 80;
    const kind = Math.floor(Math.random() * 4);
    if (kind === 0) {
      addChestnut(x, groundY - 34, .92);
      addChestnut(x + 84, groundY - 36, 1.02);
      addChestnut(x + 170, groundY - 34, .94);
    } else if (kind === 1) {
      addChestnut(x, groundY - 34, 1);
      addChestnut(x + 112, groundY - 54, 1.32);
    } else if (kind === 2) {
      addPlatform(x + 34, groundY - 82, 142);
      addChestnut(x, groundY - 34, .9);
      addChestnut(x + 198, groundY - 34, 1.0);
    } else {
      addChestnut(x, groundY - 34, .88);
      addChestnut(x + 72, groundY - 34, .88);
      addChestnut(x + 176, groundY - 38, 1.05);
    }
    nextPattern += 250 + Math.random() * 95;
  }
""", """  function spawnRushPattern() {
    const x = W + 70;
    const kind = Math.floor(Math.random() * 5);
    if (kind === 0) {
      addChestnut(x, groundY - 33, .86);
      addChestnut(x + 68, groundY - 37, 1.02);
      addChestnut(x + 142, groundY - 33, .88);
      addChestnut(x + 214, groundY - 39, 1.06);
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
      addChestnut(x + 252, groundY - 33, .86);
    } else {
      addChestnut(x, groundY - 34, 1.0);
      addChestnut(x + 104, groundY - 34, .88);
      addChestnut(x + 194, groundY - 55, 1.30);
      addChestnut(x + 292, groundY - 34, .9);
    }
    nextPattern += 225 + Math.random() * 55;
  }
""", 'stronger rush')

rep("""      addSpring(x, groundY - 12, 50);
      addPlatform(x + 95, groundY - 142, 215);
      for (let i=0; i<5; i++) addBonus(x + 120 + i*45, groundY - 180 - Math.sin(i/4*Math.PI)*26);
      if (Math.random() < .35) addItem(x + 300, groundY - 188, Math.random() < .5 ? 'magnet' : 'shield');
""", """      addSpring(x, groundY - 12, 50, true);
      addPlatform(x + 95, groundY - 142, 230);
      for (let i=0; i<6; i++) addBonus(x + 116 + i*43, groundY - 180 - Math.sin(i/5*Math.PI)*30, 2, i === 0);
      if (!objects.some(o => o.type === 'letter') && Math.random() < .38) addLetter(x + 287, groundY - 228);
      if (Math.random() < .48) addItem(x + 320, groundY - 190, Math.random() < .5 ? 'magnet' : 'shield');
""", 'bonus high route')

rep("""  function startEvent(type) {
    eventMode = type;
    eventTimer = type === 'rush' ? 7.5 : 8.5;
    eventBanner = type === 'rush' ? '🌰 KURI RUSH!' : '⭐ BONUS RUN!';
    eventBannerTimer = 1.7;
    nextPattern = Math.min(nextPattern, distance + W + 170);
    flash = .12;
    if (type === 'rush') {
      popText('栗ラッシュ！', W*.5, H*.32, '#ffcc7b', 1.0, 22);
      beep(260, .12, 'sawtooth', .035);
    } else {
      popText('ボーナスタイム！', W*.5, H*.32, '#fff1a0', 1.0, 22);
      beep(880, .12, 'square', .032);
    }
  }
""", """  function startEvent(type) {
    eventMode = type;
    eventTimer = type === 'rush' ? 8.0 : 8.5;
    eventBanner = type === 'rush' ? '🌰 KURI RUSH!' : '⭐ BONUS RUN!';
    eventBannerTimer = 1.8;
    nextPattern = Math.min(nextPattern, distance + W + (type === 'rush' ? 85 : 150));
    flash = .12;
    if (type === 'rush') {
      popText('栗ラッシュ！ よけきれ！', W*.5, H*.32, '#ffd08a', 1.1, 22);
      beep(250, .13, 'sawtooth', .04);
    } else {
      popText('ボーナスタイム！', W*.5, H*.32, '#fff1a0', 1.0, 22);
      beep(880, .12, 'square', .032);
    }
  }
""", 'event start')

rep("""  function updateEvents(dt) {
    eventBannerTimer = Math.max(0, eventBannerTimer - dt);
    if (eventMode !== 'normal') {
      eventTimer -= dt;
      if (eventTimer <= 0) {
        eventMode = 'normal';
        eventCooldown = 22 + Math.random() * 12;
        eventBanner = '';
        popText('NORMAL RUN', W*.5, H*.30, '#dff7ef', .7, 16);
      }
      return;
    }
    eventCooldown -= dt;
    if (eventCooldown <= 0 && player.fever <= 0) {
      startEvent(Math.random() < .56 ? 'rush' : 'bonus');
    }
  }
""", """  function updateEvents(dt) {
    eventBannerTimer = Math.max(0, eventBannerTimer - dt);
    if (eventMode !== 'normal') {
      eventTimer -= dt;
      if (eventTimer <= 0) {
        const ended = eventMode;
        eventMode = 'normal';
        eventCooldown = 22 + Math.random() * 12;
        eventBanner = '';
        if (ended === 'rush') {
          scoreFloat += 300;
          score = Math.floor(scoreFloat);
          flash = .18;
          popText('RUSH CLEAR! +300', W*.5, H*.30, '#ffe0a0', 1.0, 20);
          burst(player.x + player.w/2, player.y + player.h/2, '#ffb45f', 16, 150);
          beep(760, .09, 'square', .03);
        } else {
          popText('NICE BONUS!', W*.5, H*.30, '#fff5a8', .75, 17);
        }
      }
      return;
    }
    eventCooldown -= dt;
    if (eventCooldown <= 0 && player.fever <= 0) {
      startEvent(Math.random() < .56 ? 'rush' : 'bonus');
    }
  }
""", 'event clear reward')

rep("        popText('SUPER JUMP!', player.x + player.w*.8, player.y - 10, '#ffe66b', .75, 17);\n", "        popText(o.route ? 'HIGH ROUTE! ★×2' : 'SUPER JUMP!', player.x + player.w*.8, player.y - 10, '#ffe66b', o.route ? .9 : .75, 17);\n", 'route jump cue')

rep("""        const cx = o.x + o.w / 2;
        const cy = o.y + o.h / 2;
        const px = player.x + player.w / 2;
        const py = player.y + player.h / 2;
        const dx = px - cx;
        const dy = py - cy;
        const dd = Math.hypot(dx, dy);
        if (dd < (eventMode === 'bonus' ? 185 : 230)) {
          o.x += dx * dt * 5.3;
          o.y += dy * dt * 5.3;
        }
""", """        if (o.type === 'bonus' && o.premium && eventMode === 'bonus' && player.magnet <= 0 && player.fever <= 0) continue;
        const cx = o.x + o.w / 2;
        const cy = o.y + o.h / 2;
        const px = player.x + player.w / 2;
        const py = player.y + player.h / 2;
        const dx = px - cx;
        const dy = py - cy;
        const dd = Math.hypot(dx, dy);
        const radius = eventMode === 'bonus' && player.magnet <= 0 && player.fever <= 0 ? 120 : 230;
        if (dd < radius) {
          o.x += dx * dt * 5.3;
          o.y += dy * dt * 5.3;
        }
""", 'premium route magnet')

rep("""  function collectBonus(o) {
    const gain = 28 * Math.max(1, comboMultiplier());
    scoreFloat += gain;
    score = Math.floor(scoreFloat);
    burst(o.x + o.w/2, o.y + o.h/2, '#ffe36d', 8, 100);
    beep(720 + Math.random()*90, .035, 'sine', .018);
  }
""", """  function collectBonus(o) {
    const value = o.value || 1;
    const gain = 28 * value * Math.max(1, comboMultiplier());
    scoreFloat += gain;
    score = Math.floor(scoreFloat);
    burst(o.x + o.w/2, o.y + o.h/2, o.premium ? '#ffd04b' : '#ffe36d', o.premium ? 11 : 8, 110);
    if (o.routeCue) {
      popText(`HIGH ROUTE +${gain}`, o.x + o.w/2, o.y - 10, '#ffe66b', .8, 17);
      beep(900, .06, 'sine', .025);
    } else {
      beep(720 + Math.random()*90, .035, 'sine', .018);
    }
  }
""", 'premium scoring')

rep("""  function drawBonus(o) {
    const cx = o.x + o.w/2;
    const cy = o.y + o.h/2;
    ctx.save();
    ctx.shadowColor = '#ffd84d';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffe36d';
    ctx.beginPath();
    ctx.arc(cx, cy, o.w*.48, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#fff7bd';
    ctx.font = '900 13px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', cx, cy+1);
    ctx.restore();
  }
""", """  function drawBonus(o) {
    const cx = o.x + o.w/2;
    const cy = o.y + o.h/2;
    ctx.save();
    ctx.shadowColor = o.premium ? '#ffb933' : '#ffd84d';
    ctx.shadowBlur = o.premium ? 16 : 10;
    ctx.fillStyle = o.premium ? '#ffd44f' : '#ffe36d';
    ctx.beginPath();
    ctx.arc(cx, cy, o.w*.48, 0, Math.PI*2);
    ctx.fill();
    if (o.premium) {
      ctx.strokeStyle = '#fff3a6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, o.w*.61, 0, Math.PI*2);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff7bd';
    ctx.font = o.premium ? '900 14px system-ui' : '900 13px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', cx, cy-1);
    if (o.premium) {
      ctx.font = '900 8px system-ui';
      ctx.fillText('×2', cx, cy+9);
    }
    ctx.restore();
  }
""", 'premium bonus visual')

atmosphere = """  function drawEventAtmosphere() {
    if (eventMode !== 'rush') return;
    ctx.save();
    const pulse = .5 + Math.sin(performance.now() * .012) * .5;
    ctx.fillStyle = `rgba(150, 65, 25, ${0.045 + pulse * 0.018})`;
    ctx.fillRect(0, 0, W, groundY);
    ctx.strokeStyle = `rgba(255, 221, 170, ${0.18 + pulse * 0.08})`;
    ctx.lineWidth = 2;
    for (let i=0; i<9; i++) {
      const y = H*.27 + ((i*63 + distance*1.45) % Math.max(90, groundY-H*.27-25));
      const x = W - ((i*91 + distance*1.9) % (W+180));
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 48, y - 8);
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(255, 122, 53, ${0.035 + pulse * .02})`;
    ctx.fillRect(0, groundY - 8, W, 8);
    ctx.restore();
  }

"""
marker = "  function drawRunUI() {\n"
if marker not in s:
    raise SystemExit('missing drawRunUI marker')
s = s.replace(marker, atmosphere + marker, 1)

rep("      const label = eventMode === 'rush' ? '🌰 KURI RUSH' : eventMode === 'bonus' ? '⭐ BONUS RUN' : eventBanner;\n", """      const label = eventMode === 'rush'
        ? `🌰 KURI RUSH  ${Math.max(0,eventTimer).toFixed(1)}`
        : eventMode === 'bonus'
          ? `⭐ BONUS RUN  ${Math.max(0,eventTimer).toFixed(1)}`
          : eventBanner;
""", 'event countdown label')

rep("""    drawBackground();

    for (const o of objects) if (o.type==='platform') drawPlatform(o);
""", """    drawBackground();
    drawEventAtmosphere();

    for (const o of objects) if (o.type==='platform') drawPlatform(o);
""", 'rush atmosphere call')

path.write_text(s, encoding='utf-8')

index = Path('index.html')
h = index.read_text(encoding='utf-8')
h = h.replace('20260913-1330', '20260913-1435')
index.write_text(h, encoding='utf-8')
