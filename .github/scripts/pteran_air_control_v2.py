from pathlib import Path

GAME = Path('game.js')
INDEX = Path('index.html')
STYLE = Path('style.css')

g = GAME.read_text()

# 1) Explain the richer Pteran control loop in the character catalog.
old = "trait:'滑空', traitDesc:'空中で長押し中だけ滑空。指を離すと通常落下し、Lvで滑空ゲージが伸びる。'"
new = "trait:'滑空', traitDesc:'長押しで滑空、離すと急降下。急降下中に再長押しでふわっと再浮上。Lv5・10で操作性能UP。'"
assert old in g, 'pteran trait text not found'
g = g.replace(old, new, 1)

# 2) Add dive/reopen helpers after glide capacity.
anchor = """  function pteranGlideMaxSeconds(lv) {
    return 1.8 + (lv - 1) * .18 + (lv >= 5 ? .35 : 0) + (lv >= 10 ? .45 : 0);
  }

"""
assert anchor in g, 'glide max helper not found'
helpers = anchor + """  function pteranReopenCost(lv) {
    return Math.max(.20, .42 - (lv - 1) * .015 - (lv >= 5 ? .04 : 0) - (lv >= 10 ? .03 : 0));
  }

  function pteranReopenLift(lv) {
    return 70 + (lv - 1) * 6 + (lv >= 5 ? 25 : 0) + (lv >= 10 ? 35 : 0);
  }

  function pteranDiveFallCap(lv) {
    return Math.max(660, 780 - (lv - 1) * 8);
  }

"""
g = g.replace(anchor, helpers, 1)

# 3) Show reopen cost in level effects so the upgrade is understandable.
old = """    if (id === 'pteran') {
      const glide = Math.max(0, Math.round((520 - pteranFallCapForLevel(lv)) / 520 * 100));
      const air = pteranAirScoreBonus(lv);
      return `長押し滑空 ${pteranGlideMaxSeconds(lv).toFixed(1)}秒・落下軽減 +${glide}%${air ? `・滑空中SCORE +${air}%` : ''}`;
    }
"""
new = """    if (id === 'pteran') {
      const glide = Math.max(0, Math.round((520 - pteranFallCapForLevel(lv)) / 520 * 100));
      const air = pteranAirScoreBonus(lv);
      return `滑空 ${pteranGlideMaxSeconds(lv).toFixed(1)}秒・再浮上消費 ${pteranReopenCost(lv).toFixed(1)}秒・落下軽減 +${glide}%${air ? `・滑空中SCORE +${air}%` : ''}`;
    }
"""
assert old in g, 'pteran summary block not found'
g = g.replace(old, new, 1)

# 4) HUD: distinguish glide, dive and reopen with real-time instructions.
old = """    characterEffectHudEl.classList.remove('ready','active');
"""
new = """    characterEffectHudEl.classList.remove('ready','active','dive','boost');
"""
assert old in g, 'effect hud class reset not found'
g = g.replace(old, new, 1)

old = """    } else if (selectedCharacter === 'pteran') {
      const air = pteranAirScoreBonus(lv);
      const maxGlide = pteranGlideMaxSeconds(lv);
      const ratio = Math.max(0, Math.min(1, player.glideEnergy / maxGlide));
      const airborne = player.y + player.h < groundY - 2;
      const prompt = player.glideActive ? '滑空中' : airborne ? (player.glideEnergy > .02 ? '長押しで滑空' : '滑空ゲージ0') : 'ジャンプ後 長押しで滑空';
      status = `🪽 ${prompt}${air && player.glideActive ? `　SCORE +${air}%` : ''}<i class=\"glideGauge\"><u style=\"width:${Math.round(ratio*100)}%\"></u></i><small>${player.glideEnergy.toFixed(1)} / ${maxGlide.toFixed(1)}秒</small>`;
      if (player.glideActive) characterEffectHudEl.classList.add('active');
    }
"""
new = """    } else if (selectedCharacter === 'pteran') {
      const air = pteranAirScoreBonus(lv);
      const maxGlide = pteranGlideMaxSeconds(lv);
      const ratio = Math.max(0, Math.min(1, player.glideEnergy / maxGlide));
      const airborne = player.jumps > 0 || player.y + player.h < groundY - 2 || Math.abs(player.vy) > 1;
      let prompt = 'ジャンプ後 長押しで滑空';
      if (player.pullupFx > .03) {
        prompt = 'ふわっ！ 再浮上';
        characterEffectHudEl.classList.add('boost');
      } else if (player.diveActive && airborne) {
        prompt = player.glideEnergy > .02 ? '急降下 ↓　長押しで再浮上' : '急降下 ↓';
        characterEffectHudEl.classList.add('dive');
      } else if (player.glideActive) {
        prompt = '滑空中　離すと急降下';
        characterEffectHudEl.classList.add('active');
      } else if (airborne) {
        prompt = player.glideEnergy > .02 ? '長押しで滑空' : '滑空ゲージ0';
      }
      status = `🪽 ${prompt}${air && player.glideActive ? `　SCORE +${air}%` : ''}<i class=\"glideGauge\"><u style=\"width:${Math.round(ratio*100)}%\"></u></i><small>残り ${player.glideEnergy.toFixed(1)} / ${maxGlide.toFixed(1)}秒</small>`;
    }
"""
assert old in g, 'pteran HUD block not found'
g = g.replace(old, new, 1)

# 5) Extend player state.
old = """    glideHeld: false, glideActive: false, glideEnergy: 0
"""
new = """    glideHeld: false, glideActive: false, glideEnergy: 0,
    glideStarted: false, diveActive: false, pullupFx: 0
"""
assert old in g, 'player glide state not found'
g = g.replace(old, new, 1)

# 6) Reset/pause/damage clear all air-control transient states.
old = """      glideHeld:false, glideActive:false,
      glideEnergy:selectedCharacter === 'pteran' ? pteranGlideMaxSeconds(characterLevel('pteran')) : 0
"""
new = """      glideHeld:false, glideActive:false, glideStarted:false, diveActive:false, pullupFx:0,
      glideEnergy:selectedCharacter === 'pteran' ? pteranGlideMaxSeconds(characterLevel('pteran')) : 0
"""
assert old in g, 'reset glide state not found'
g = g.replace(old, new, 1)

old = """    player.glideHeld = false;
    player.glideActive = false;
    pausePanel.hidden = false;
"""
new = """    player.glideHeld = false;
    player.glideActive = false;
    player.diveActive = false;
    pausePanel.hidden = false;
"""
assert old in g, 'pause glide reset not found'
g = g.replace(old, new, 1)

old = """    player.glideHeld = false;
    player.glideActive = false;
    player.vy = 0;
"""
new = """    player.glideHeld = false;
    player.glideActive = false;
    player.glideStarted = false;
    player.diveActive = false;
    player.pullupFx = 0;
    player.vy = 0;
"""
assert old in g, 'damage glide reset not found'
g = g.replace(old, new, 1)

# 7) Jump starts a fresh aerial phase. A second jump remains available until glide has actually started.
old = """    player.jumps++;
    player.descentTime = 0;
    player.squash = .14;
"""
new = """    player.jumps++;
    player.descentTime = 0;
    player.glideStarted = false;
    player.diveActive = false;
    player.pullupFx = 0;
    player.squash = .14;
"""
assert old in g, 'jump state block not found'
g = g.replace(old, new, 1)

# 8) Add controlled dive + reopen input. Tapping before the first glide can still double-jump.
old = """  function input(e) {
    if (e && e.type === 'keydown' && !['Space','ArrowUp'].includes(e.code)) return;
    if (e && e.type === 'keydown' && e.repeat) return;
    if (e && e.cancelable) e.preventDefault();
    if (state === 'title' || state === 'over') {
      reset();
      return;
    }
    if (state === 'playing' && selectedCharacter === 'pteran') player.glideHeld = true;
    jump();
  }

  function releaseGlide() {
    player.glideHeld = false;
    player.glideActive = false;
  }
"""
new = """  function pteranIsAirborne() {
    return player.jumps > 0 || player.y + player.h < groundY - 2 || Math.abs(player.vy) > 1;
  }

  function reopenPteranGlide() {
    if (selectedCharacter !== 'pteran' || !pteranIsAirborne() || player.glideEnergy <= .02) return false;
    const lv = characterLevel('pteran');
    const cost = Math.min(player.glideEnergy, pteranReopenCost(lv));
    player.glideEnergy = Math.max(0, player.glideEnergy - cost);
    player.glideHeld = true;
    player.glideActive = false;
    player.glideStarted = true;
    player.diveActive = false;
    player.pullupFx = .24;
    player.vy = Math.min(player.vy, -pteranReopenLift(lv));
    player.descentTime = 0;
    burst(player.x + player.w*.30, player.y + player.h*.55, '#c9f5ff', 12, 120 + lv*4);
    popText('ふわっ！', player.x + player.w*.55, player.y - 8, '#d8f8ff', .42, 15);
    beep(720 + lv*8, .055, 'sine', .022);
    return true;
  }

  function input(e) {
    if (e && e.type === 'keydown' && !['Space','ArrowUp'].includes(e.code)) return;
    if (e && e.type === 'keydown' && e.repeat) return;
    if (e && e.cancelable) e.preventDefault();
    if (state === 'title' || state === 'over') {
      reset();
      return;
    }
    if (state === 'playing' && selectedCharacter === 'pteran') {
      player.glideHeld = true;
      if (player.diveActive && pteranIsAirborne()) {
        reopenPteranGlide();
        return;
      }
    }
    jump();
  }

  function releaseGlide() {
    const canDive = state === 'playing' && selectedCharacter === 'pteran' && player.wing <= 0 &&
      player.glideStarted && pteranIsAirborne() && player.glideEnergy > .02;
    player.glideHeld = false;
    player.glideActive = false;
    player.pullupFx = 0;
    player.diveActive = !!canDive;
  }
"""
assert old in g, 'input/release glide block not found'
g = g.replace(old, new, 1)

# 9) Physics: opening float, controllable glide, release dive, re-open rise.
old = """    const wingLevel = Math.max(1, itemLevel('wing'));
    const pteranLevel = selectedCharacter === 'pteran' ? characterLevel('pteran') : 0;
    const pteranCanGlide = pteranLevel > 0 && player.vy > 0 && player.descentTime >= .12 && player.glideHeld && player.glideEnergy > 0;
    player.glideActive = !!pteranCanGlide;
    let gravity = 1850;
    if (player.wing > 0) {
      gravity = Math.max(620, 980 - (wingLevel - 1) * 90);
    } else if (player.glideActive) {
      gravity = pteranGravityForLevel(pteranLevel);
    }
    player.vy += gravity * dt;
    if (player.wing > 0 && player.vy > 0) {
      player.vy = Math.min(player.vy, Math.max(220, 340 - (wingLevel - 1) * 25));
    } else if (player.glideActive) {
      player.glideEnergy = Math.max(0, player.glideEnergy - dt);
      if (player.glideEnergy <= 0) player.glideActive = false;
      player.vy = Math.min(player.vy, pteranFallCapForLevel(pteranLevel));
      if (Math.random() < dt * 11) {
        particles.push({x:player.x + player.w*.20, y:player.y + player.h*.58, vx:-65-Math.random()*45, vy:(Math.random()-.5)*28, life:.26, color:'#d9f6ff', r:2+Math.random()*2});
      }
    }
    player.y += player.vy * dt;
"""
new = """    player.pullupFx = Math.max(0, player.pullupFx - dt);
    const wingLevel = Math.max(1, itemLevel('wing'));
    const pteranLevel = selectedCharacter === 'pteran' ? characterLevel('pteran') : 0;
    const pteranAirborne = pteranLevel > 0 && (player.jumps > 0 || player.y + player.h < groundY - 2 || Math.abs(player.vy) > 1);
    if (player.wing > 0 && pteranLevel > 0) player.diveActive = false;
    const pteranCanGlide = pteranAirborne && player.vy > 0 && player.descentTime >= .12 && player.glideHeld && !player.diveActive && player.glideEnergy > 0;
    const openingGlide = pteranCanGlide && !player.glideStarted;
    player.glideActive = !!pteranCanGlide;
    if (openingGlide) {
      player.glideStarted = true;
      player.pullupFx = .14;
      player.y -= 4 + Math.min(3, pteranLevel*.25);
      player.vy = Math.min(player.vy, 28);
      player.glideEnergy = Math.max(0, player.glideEnergy - .08);
      burst(player.x + player.w*.28, player.y + player.h*.58, '#d7f8ff', 7, 78);
      beep(690, .04, 'sine', .014);
    }
    let gravity = 1850;
    if (player.wing > 0) {
      gravity = Math.max(620, 980 - (wingLevel - 1) * 90);
    } else if (player.diveActive && pteranAirborne) {
      gravity = 2450;
    } else if (player.glideActive) {
      gravity = pteranGravityForLevel(pteranLevel);
    }
    player.vy += gravity * dt;
    if (player.wing > 0 && player.vy > 0) {
      player.vy = Math.min(player.vy, Math.max(220, 340 - (wingLevel - 1) * 25));
    } else if (player.diveActive && pteranAirborne && player.vy > 0) {
      player.vy = Math.min(player.vy, pteranDiveFallCap(pteranLevel));
      if (Math.random() < dt * 10) {
        particles.push({x:player.x + player.w*.35, y:player.y + player.h*.20, vx:-35-Math.random()*30, vy:-70-Math.random()*50, life:.20, color:'#d7e9ff', r:1.5+Math.random()*1.5});
      }
    } else if (player.glideActive) {
      player.glideEnergy = Math.max(0, player.glideEnergy - dt);
      if (player.glideEnergy <= 0) {
        player.glideActive = false;
        player.glideHeld = false;
        player.diveActive = false;
      }
      player.vy = Math.min(player.vy, pteranFallCapForLevel(pteranLevel));
      if (Math.random() < dt * 11) {
        particles.push({x:player.x + player.w*.20, y:player.y + player.h*.58, vx:-65-Math.random()*45, vy:(Math.random()-.5)*28, life:.26, color:'#d9f6ff', r:2+Math.random()*2});
      }
    }
    player.y += player.vy * dt;
"""
assert old in g, 'pteran physics block not found'
g = g.replace(old, new, 1)

# 10) Spring/landings reset the aerial-control phase and refill the gauge.
old = """        player.vy = -930;
        player.jumps = 1;
        if (selectedCharacter === 'pteran') player.glideEnergy = pteranGlideMaxSeconds(characterLevel('pteran'));
        player.squash = .12;
"""
new = """        player.vy = -930;
        player.jumps = 1;
        player.glideStarted = false;
        player.diveActive = false;
        player.pullupFx = 0;
        if (selectedCharacter === 'pteran') player.glideEnergy = pteranGlideMaxSeconds(characterLevel('pteran'));
        player.squash = .12;
"""
assert old in g, 'spring block not found'
g = g.replace(old, new, 1)

old = """        player.jumps = 0;
        player.glideActive = false;
        if (selectedCharacter === 'pteran') player.glideEnergy = pteranGlideMaxSeconds(characterLevel('pteran'));
"""
new = """        player.jumps = 0;
        player.glideHeld = false;
        player.glideActive = false;
        player.glideStarted = false;
        player.diveActive = false;
        player.pullupFx = 0;
        if (selectedCharacter === 'pteran') player.glideEnergy = pteranGlideMaxSeconds(characterLevel('pteran'));
"""
assert old in g, 'platform landing block not found'
g = g.replace(old, new, 1)

old = """      player.jumps = 0;
      player.glideActive = false;
      if (selectedCharacter === 'pteran') player.glideEnergy = pteranGlideMaxSeconds(characterLevel('pteran'));
"""
new = """      player.jumps = 0;
      player.glideHeld = false;
      player.glideActive = false;
      player.glideStarted = false;
      player.diveActive = false;
      player.pullupFx = 0;
      if (selectedCharacter === 'pteran') player.glideEnergy = pteranGlideMaxSeconds(characterLevel('pteran'));
"""
assert old in g, 'ground landing block not found'
g = g.replace(old, new, 1)

# 11) Give dive/reopen visible body motion. Glide still uses the existing glide sprite.
old = """    const bob=!airborne?Math.sin(p.runT)*2:0;
    ctx.translate(p.x+p.w/2,p.y+p.h/2+bob);

    if ((state === 'damage' || state === 'over') && player.damageUntil > 0 &&
"""
new = """    const bob=!airborne?Math.sin(p.runT)*2:0;
    ctx.translate(p.x+p.w/2,p.y+p.h/2+bob);

    if (selectedCharacter === 'pteran' && airborne && p.diveActive) {
      ctx.translate(1, 2);
      ctx.rotate(.14);
    } else if (selectedCharacter === 'pteran' && airborne && p.pullupFx > 0) {
      const q = Math.min(1, p.pullupFx / .24);
      ctx.translate(0, -4*q);
      ctx.rotate(-.12*q);
      ctx.scale(1+.025*q, 1+.025*q);
    }

    if ((state === 'damage' || state === 'over') && player.damageUntil > 0 &&
"""
assert old in g, 'draw player transform anchor not found'
g = g.replace(old, new, 1)

GAME.write_text(g)

# Cache bust the files touched by this patch.
h = INDEX.read_text()
assert '20260916-glide1' in h, 'glide1 cache token not found'
h = h.replace('20260916-glide1', '20260916-glide2')
INDEX.write_text(h)

s = STYLE.read_text()
s += "\n/* pteran-air-control-v2 */\n#characterEffectHud.dive{background:#eef2ffee;box-shadow:0 0 0 2px #a9bfff88,0 4px 14px #243f3620;transform:scale(1.025)}#characterEffectHud.dive .glideGauge u{background:linear-gradient(90deg,#9aa9ff,#6d7fd8)}#characterEffectHud.boost{background:#e9fbffee;box-shadow:0 0 0 2px #9be9ff99,0 4px 16px #5bbbd333;transform:scale(1.04)}#characterEffectHud.boost .glideGauge u{box-shadow:0 0 9px #8de9ff}\n"
STYLE.write_text(s)
