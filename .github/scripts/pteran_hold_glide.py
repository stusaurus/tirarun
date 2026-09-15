from pathlib import Path

GAME=Path('game.js')
INDEX=Path('index.html')
STYLE=Path('style.css')
g=GAME.read_text()

# Pteran trait description: make control explicit.
g=g.replace("trait:'滑空', traitDesc:'Lvで滑空が強化。Lv5・10で空中走行SCOREボーナスも付く。'",
            "trait:'滑空', traitDesc:'空中で長押し中だけ滑空。指を離すと通常落下し、Lvで滑空ゲージが伸びる。'",1)

# Add glide capacity helper.
anchor="""  function pteranAirScoreBonus(lv) {
    return lv >= 10 ? 15 : lv >= 5 ? 8 : 0;
  }

"""
assert anchor in g
insert=anchor+"""  function pteranGlideMaxSeconds(lv) {
    return 1.8 + (lv - 1) * .18 + (lv >= 5 ? .35 : 0) + (lv >= 10 ? .45 : 0);
  }

"""
g=g.replace(anchor,insert,1)

# Summary includes controllable glide duration.
old="""    if (id === 'pteran') {
      const glide = Math.max(0, Math.round((520 - pteranFallCapForLevel(lv)) / 520 * 100));
      const air = pteranAirScoreBonus(lv);
      return `滑空強化 +${glide}%${air ? `・空中走行SCORE +${air}%` : ''}`;
    }
"""
new="""    if (id === 'pteran') {
      const glide = Math.max(0, Math.round((520 - pteranFallCapForLevel(lv)) / 520 * 100));
      const air = pteranAirScoreBonus(lv);
      return `長押し滑空 ${pteranGlideMaxSeconds(lv).toFixed(1)}秒・落下軽減 +${glide}%${air ? `・滑空中SCORE +${air}%` : ''}`;
    }
"""
assert old in g
g=g.replace(old,new,1)

# Pteran score bonus is earned only while actively controlling glide.
old="""    if (selectedCharacter === 'pteran' && player.y + player.h < groundY - 2) {
      return 1 + pteranAirScoreBonus(characterLevel('pteran')) / 100;
    }
"""
new="""    if (selectedCharacter === 'pteran' && player.glideActive) {
      return 1 + pteranAirScoreBonus(characterLevel('pteran')) / 100;
    }
"""
assert old in g
g=g.replace(old,new,1)

# Replace pteran effect HUD with a real-time glide gauge.
old="""    } else if (selectedCharacter === 'pteran') {
      const gliding = player.vy > 0 && player.descentTime >= .18 && player.y + player.h < groundY - 2;
      const air = pteranAirScoreBonus(lv);
      status = gliding ? `🪽 滑空中${air ? `　空中SCORE +${air}%` : ''}` : `🪽 滑空強化${air ? `　空中SCORE +${air}%` : ''}`;
      if (gliding) characterEffectHudEl.classList.add('active');
    }
    characterEffectHudEl.innerHTML = `<b>${ch.icon} ${ch.name} Lv.${lv}</b><span>${status}</span>`;
"""
new="""    } else if (selectedCharacter === 'pteran') {
      const air = pteranAirScoreBonus(lv);
      const maxGlide = pteranGlideMaxSeconds(lv);
      const ratio = Math.max(0, Math.min(1, player.glideEnergy / maxGlide));
      const airborne = player.y + player.h < groundY - 2;
      const prompt = player.glideActive ? '滑空中' : airborne ? (player.glideEnergy > .02 ? '長押しで滑空' : '滑空ゲージ0') : 'ジャンプ後 長押しで滑空';
      status = `🪽 ${prompt}${air && player.glideActive ? `　SCORE +${air}%` : ''}<i class=\"glideGauge\"><u style=\"width:${Math.round(ratio*100)}%\"></u></i><small>${player.glideEnergy.toFixed(1)} / ${maxGlide.toFixed(1)}秒</small>`;
      if (player.glideActive) characterEffectHudEl.classList.add('active');
    }
    characterEffectHudEl.innerHTML = `<b>${ch.icon} ${ch.name} Lv.${lv}</b><span>${status}</span>`;
"""
assert old in g
g=g.replace(old,new,1)

# Player state carries hold/energy/active glide.
old="""    timeSlow: 0, wing: 0,
    runT: 0, squash: 0, damageUntil: 0, descentTime: 0, hitElapsed: 0
"""
new="""    timeSlow: 0, wing: 0,
    runT: 0, squash: 0, damageUntil: 0, descentTime: 0, hitElapsed: 0,
    glideHeld: false, glideActive: false, glideEnergy: 0
"""
assert old in g
g=g.replace(old,new,1)

# Reset glide state and fill gauge at run start.
old="""      shield:false, invincible:0, magnet:0, giant:0, fever:0, timeSlow:0, wing:0, runT:0, squash:0,
      damageUntil:0, descentTime:0, hitElapsed:0
    });
"""
new="""      shield:false, invincible:0, magnet:0, giant:0, fever:0, timeSlow:0, wing:0, runT:0, squash:0,
      damageUntil:0, descentTime:0, hitElapsed:0,
      glideHeld:false, glideActive:false,
      glideEnergy:selectedCharacter === 'pteran' ? pteranGlideMaxSeconds(characterLevel('pteran')) : 0
    });
"""
assert old in g
g=g.replace(old,new,1)

# Pausing/damage should never leave a stuck hold.
g=g.replace("""    state = 'paused';
    pausePanel.hidden = false;
""","""    state = 'paused';
    player.glideHeld = false;
    player.glideActive = false;
    pausePanel.hidden = false;
""",1)
g=g.replace("""    player.hitElapsed = 0;
    player.descentTime = 0;
    player.vy = 0;
""","""    player.hitElapsed = 0;
    player.descentTime = 0;
    player.glideHeld = false;
    player.glideActive = false;
    player.vy = 0;
""",1)

# Pointer/keyboard input: tap still jumps, holding controls glide; release ends glide immediately.
old="""  function input(e) {
    if (e && e.type === 'keydown' && !['Space','ArrowUp'].includes(e.code)) return;
    if (e && e.cancelable) e.preventDefault();
    if (state === 'title' || state === 'over') {
      reset();
      return;
    }
    jump();
  }

  canvas.addEventListener('pointerdown', input, {passive:false});
"""
new="""  function input(e) {
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

  function releaseGlide(e) {
    if (e && e.cancelable) e.preventDefault();
    player.glideHeld = false;
    player.glideActive = false;
  }

  canvas.addEventListener('pointerdown', input, {passive:false});
  canvas.addEventListener('pointerup', releaseGlide, {passive:false});
  canvas.addEventListener('pointercancel', releaseGlide, {passive:false});
  addEventListener('pointerup', releaseGlide, {passive:false});
"""
assert old in g
g=g.replace(old,new,1)

# Keyboard release support.
old="""  addEventListener('keydown', input, {passive:false});
  addEventListener('keydown', e => {
"""
new="""  addEventListener('keydown', input, {passive:false});
  addEventListener('keyup', e => {
    if (['Space','ArrowUp'].includes(e.code)) releaseGlide(e);
  }, {passive:false});
  addEventListener('keydown', e => {
"""
assert old in g
g=g.replace(old,new,1)

# Replace automatic pteran glide physics with hold-to-glide + finite per-jump energy.
old="""    const wingLevel = Math.max(1, itemLevel('wing'));
    const pteranLevel = selectedCharacter === 'pteran' ? characterLevel('pteran') : 0;
    let gravity = 1850;
    if (player.wing > 0) {
      gravity = Math.max(620, 980 - (wingLevel - 1) * 90);
    } else if (pteranLevel > 0 && player.vy > 0) {
      gravity = pteranGravityForLevel(pteranLevel);
    }
    player.vy += gravity * dt;
    if (player.wing > 0 && player.vy > 0) {
      player.vy = Math.min(player.vy, Math.max(220, 340 - (wingLevel - 1) * 25));
    } else if (pteranLevel > 0 && player.vy > 0) {
      player.vy = Math.min(player.vy, pteranFallCapForLevel(pteranLevel));
      if (Math.random() < dt * 8) {
        particles.push({x:player.x + player.w*.20, y:player.y + player.h*.58, vx:-55-Math.random()*35, vy:(Math.random()-.5)*28, life:.24, color:'#d9f6ff', r:2+Math.random()*2});
      }
    }
    player.y += player.vy * dt;
"""
new="""    const wingLevel = Math.max(1, itemLevel('wing'));
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
assert old in g
g=g.replace(old,new,1)

# Recharge glide gauge whenever a new aerial segment starts from spring/platform/ground.
old="""        player.vy = -930;
        player.jumps = 1;
        player.squash = .12;
"""
new="""        player.vy = -930;
        player.jumps = 1;
        if (selectedCharacter === 'pteran') player.glideEnergy = pteranGlideMaxSeconds(characterLevel('pteran'));
        player.squash = .12;
"""
assert old in g
g=g.replace(old,new,1)
old="""        player.y = o.y - player.h;
        player.vy = 0;
        player.jumps = 0;
"""
new="""        player.y = o.y - player.h;
        player.vy = 0;
        player.jumps = 0;
        player.glideActive = false;
        if (selectedCharacter === 'pteran') player.glideEnergy = pteranGlideMaxSeconds(characterLevel('pteran'));
"""
assert old in g
g=g.replace(old,new,1)
old="""      player.y = groundY - player.h;
      player.vy = 0;
      player.jumps = 0;
    }

    player.descentTime = player.vy > 0 ? player.descentTime + dt : 0;
"""
new="""      player.y = groundY - player.h;
      player.vy = 0;
      player.jumps = 0;
      player.glideActive = false;
      if (selectedCharacter === 'pteran') player.glideEnergy = pteranGlideMaxSeconds(characterLevel('pteran'));
    }

    player.descentTime = player.vy > 0 ? player.descentTime + dt : 0;
"""
assert old in g
g=g.replace(old,new,1)

# Use glide pose only while actively gliding (or while the wing item is active).
old="""    if (selectedCharacter === 'pteran') {
      if (airborne) return player.descentTime >= .18 ? 'pteranGlide' : 'pteranJump';
      return Math.floor(player.runT * 2.15) % 2 ? 'pteranRun1' : 'pteranRun2';
    }
"""
new="""    if (selectedCharacter === 'pteran') {
      if (airborne) return (player.glideActive || player.wing > 0) ? 'pteranGlide' : 'pteranJump';
      return Math.floor(player.runT * 2.15) % 2 ? 'pteranRun1' : 'pteranRun2';
    }
"""
assert old in g
g=g.replace(old,new,1)

GAME.write_text(g)

# Cache bust.
h=INDEX.read_text()
assert '20260916-charlevel1' in h
h=h.replace('20260916-charlevel1','20260916-glide1')
INDEX.write_text(h)

# Gauge styling. Appending avoids disturbing existing UI rules.
s=STYLE.read_text()
s += "\n/* pteran-hold-glide-v1 */\n#characterEffectHud .glideGauge{display:block;width:112px;height:6px;margin:4px 0 2px;border-radius:999px;background:#dfe7ef;overflow:hidden;box-shadow:inset 0 1px 2px #0002}#characterEffectHud .glideGauge u{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#8bdcf0,#7b8fe8);transition:width .08s linear;text-decoration:none}#characterEffectHud span small{display:block;font-size:9px;opacity:.72;margin-top:1px}#characterEffectHud.active .glideGauge u{box-shadow:0 0 7px #9ae9ff}\n"
STYLE.write_text(s)
