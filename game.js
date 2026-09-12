(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('startBtn');
  const resultEl = document.getElementById('result');
  const subtitleEl = document.getElementById('subtitle');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const lettersEl = document.getElementById('letters');
  const muteBtn = document.getElementById('mute');
  const shieldBuff = document.getElementById('shieldBuff');
  const magnetBuff = document.getElementById('magnetBuff');
  const giantBuff = document.getElementById('giantBuff');
  const feverBuff = document.getElementById('feverBuff');

  const WORD = 'TIRAKURI';
  const LS_BEST = 'tirakuri-best-v2';
  let best = Number(localStorage.getItem(LS_BEST) || 0);
  bestEl.textContent = '/ ' + best;

  let W = 390;
  let H = 700;
  let dpr = 1;
  let groundY = 550;
  let state = 'title';
  let last = performance.now();
  let distance = 0;
  let score = 0;
  let scoreFloat = 0;
  let nextPattern = 0;
  let objects = [];
  let particles = [];
  let pickupEffects = [];
  let collected = 0;
  let shake = 0;
  let flash = 0;
  let muted = false;
  let audioCtx = null;

  const spritePaths = {
    run1: '1218B0FC-C2A9-4661-8707-C27D900A8992.png',
    run2: 'BBCB72FB-8753-443F-8266-DE96E161B845.png',
    jump: '611DD895-B471-4366-B1DC-231EF0F51CF8.png',
    damage: 'DE619F5B-547D-4A02-866D-6E072FD3FF44.png',
    kuri: 'A29A0A58-DA6B-49B8-AD9F-D595AE41741C.png',
    shield: '55E5A798-2A2D-466B-9A4C-6B865812C4D9.png',
    magnet: '43F86E52-798E-4091-ADAC-DEF03A44AD20.png',
    giant: '5428AE5F-D105-4FC1-B217-9EDA0009D7C5.png'
  };
  const sprites = {};
  for (const [name, src] of Object.entries(spritePaths)) {
    const image = new Image();
    image.decoding = 'async';
    image.src = src;
    sprites[name] = image;
  }

  const player = {
    x: 88, y: 0, w: 48, h: 48, vy: 0, jumps: 0,
    shield: false, magnet: 0, giant: 0, fever: 0,
    runT: 0, squash: 0, damageUntil: 0
  };

  const stages = [
    {name:'はらっぱ',sky1:'#c7f1ee',sky2:'#fff4c9',hill:'#8fd5a7',far:'#bce5b7',ground:'#6ab67d',dirt:'#b98055'},
    {name:'まち',sky1:'#cde8ff',sky2:'#fff0da',hill:'#9ac6cf',far:'#c8d9d0',ground:'#70b683',dirt:'#ae7d5d'},
    {name:'ゆうやけ',sky1:'#ffd0a8',sky2:'#fff0c9',hill:'#d8a88a',far:'#efd0a2',ground:'#79ad73',dirt:'#a8775c'},
    {name:'ほしぞら',sky1:'#445477',sky2:'#8792ad',hill:'#5b7082',far:'#6e8191',ground:'#527b65',dirt:'#71584f'}
  ];

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(320, r.width);
    H = Math.max(520, r.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    groundY = H * 0.79;
    player.x = Math.max(72, W * 0.22);
    if (state !== 'playing') player.y = groundY - player.h;
  }
  addEventListener('resize', resize, {passive:true});
  resize();

  function beep(freq=440, duration=.06, type='sine', vol=.04) {
    if (muted) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + duration);
      o.stop(audioCtx.currentTime + duration);
    } catch (_) {}
  }

  function reset() {
    state = 'playing';
    last = performance.now();
    distance = 0;
    score = 0;
    scoreFloat = 0;
    nextPattern = W + 300;
    objects = [];
    particles = [];
    pickupEffects = [];
    collected = 0;
    shake = 0;
    flash = 0;
    Object.assign(player, {
      y: groundY - 48, w:48, h:48, vy:0, jumps:0,
      shield:false, magnet:0, giant:0, fever:0, runT:0, squash:0,
      damageUntil:0
    });
    overlay.style.display = 'none';
    resultEl.style.display = 'none';
    updateHud();
  }

  function finishGame() {
    if (state !== 'playing' && state !== 'damage') return;
    state = 'over';
    shake = 10;
    if (score > best) {
      best = score;
      localStorage.setItem(LS_BEST, String(best));
    }
    bestEl.textContent = '/ ' + best;
    resultEl.style.display = 'block';
    resultEl.innerHTML = `SCORE ${score}<br><span style="font-size:15px;color:#6a7c75">BEST ${best}</span>`;
    subtitleEl.textContent = score >= best && score > 0 ? 'ベストスコアだノン！' : 'もう1回いくノン？';
    startBtn.textContent = 'もう一度あそぶ';
    overlay.style.display = 'grid';
  }

  function beginDamageGameOver() {
    if (state !== 'playing') return;
    state = 'damage';
    player.damageUntil = performance.now() + 560;
    player.vy = 0;
    shake = 11;
    flash = .16;
    beep(135, .22, 'sawtooth', .06);
    burst(player.x + player.w * .72, player.y + player.h * .28, '#ffd85a', 10, 150);
    setTimeout(() => {
      if (state === 'damage') finishGame();
    }, 540);
  }

  function jump() {
    if (state !== 'playing' || player.jumps >= 2) return;
    player.vy = player.jumps === 0 ? -720 : -635;
    player.jumps++;
    player.squash = .14;
    beep(player.jumps === 1 ? 520 : 680, .055, 'square', .035);
    burst(player.x + player.w * .35, player.y + player.h, '#ffffff', 5, 70);
  }

  function input(e) {
    if (e && e.type === 'keydown' && !['Space','ArrowUp'].includes(e.code)) return;
    if (e && e.cancelable) e.preventDefault();
    if (state === 'title' || state === 'over') {
      reset();
      return;
    }
    jump();
  }

  canvas.addEventListener('pointerdown', input, {passive:false});
  overlay.addEventListener('pointerdown', e => {
    if (e.target === muteBtn || e.target === startBtn) return;
    input(e);
  }, {passive:false});
  startBtn.addEventListener('pointerdown', e => e.stopPropagation());
  startBtn.addEventListener('click', e => { e.stopPropagation(); reset(); });
  addEventListener('keydown', input, {passive:false});
  muteBtn.addEventListener('pointerdown', e => e.stopPropagation());
  muteBtn.addEventListener('click', e => {
    e.stopPropagation();
    muted = !muted;
    muteBtn.textContent = muted ? '🔇' : '🔊';
  });

  function speed() {
    return Math.min(520, 275 + distance * .0065 + (player.fever > 0 ? 25 : 0));
  }

  function addChestnut(x, y, scale=1) {
    objects.push({type:'kuri', x, y, w:38*scale, h:34*scale});
  }
  function addPlatform(x, y, w=150) {
    objects.push({type:'platform', x, y, w, h:18});
  }
  function addLetter(x, y) {
    objects.push({type:'letter', letter:WORD[collected], x, y, w:30, h:30});
  }
  function addItem(x, y, item) {
    objects.push({type:'item', item, x, y, w:34, h:34});
  }

  function spawnPattern() {
    const x = W + 90;
    const r = Math.random();

    if (r < .24) {
      addChestnut(x, groundY - 34, 1);
    } else if (r < .42) {
      addChestnut(x, groundY - 32, .92);
      addChestnut(x + 72, groundY - 38, 1.1);
    } else if (r < .63) {
      const py = groundY - 76;
      addPlatform(x, py, 145);
      if (Math.random() < .65) addChestnut(x + 83, py - 32, .92);
    } else if (r < .80) {
      addPlatform(x, groundY - 58, 100);
      addPlatform(x + 115, groundY - 110, 105);
      if (Math.random() < .55) addChestnut(x + 150, groundY - 144, .88);
    } else {
      addPlatform(x, groundY - 105, 118);
      addPlatform(x + 132, groundY - 55, 118);
      addChestnut(x + 168, groundY - 89, .9);
    }

    const letterAlreadyOnScreen = objects.some(o => o.type === 'letter');
    if (player.fever <= 0 && !letterAlreadyOnScreen && Math.random() < .18) {
      addLetter(x + 55 + Math.random() * 100, groundY - (145 + Math.random() * 85));
    }

    if (Math.random() < .085) {
      const q = Math.random();
      addItem(
        x + 95,
        groundY - (125 + Math.random() * 90),
        q < .45 ? 'shield' : q < .75 ? 'magnet' : 'giant'
      );
    }

    nextPattern += 390 + Math.random() * 210;
  }

  function rectHit(a, b, pad=0) {
    return a.x + pad < b.x + b.w &&
      a.x + a.w - pad > b.x &&
      a.y + pad < b.y + b.h &&
      a.y + a.h - pad > b.y;
  }

  function update(dt) {
    if (state !== 'playing') return;

    const sp = speed();
    const prevBottom = player.y + player.h;

    distance += sp * dt;
    scoreFloat += (sp * dt / 18) * (player.fever > 0 ? 3 : 1);
    score = Math.floor(scoreFloat);

    player.runT += dt * sp / 95;
    player.squash = Math.max(0, player.squash - dt);
    player.magnet = Math.max(0, player.magnet - dt);
    player.giant = Math.max(0, player.giant - dt);
    player.fever = Math.max(0, player.fever - dt);

    const targetSize = player.giant > 0 ? 76 : 48;
    if (Math.abs(player.w - targetSize) > .5) {
      const oldBottom = player.y + player.h;
      player.w += (targetSize - player.w) * Math.min(1, dt * 10);
      player.h = player.w;
      player.y = oldBottom - player.h;
    } else {
      player.w = player.h = targetSize;
    }

    player.vy += 1850 * dt;
    player.y += player.vy * dt;

    for (const o of objects) {
      if (o.type !== 'platform') continue;
      const bottom = player.y + player.h;
      if (
        player.vy >= 0 &&
        prevBottom <= o.y + 10 &&
        bottom >= o.y &&
        player.x + player.w * .78 > o.x &&
        player.x + player.w * .18 < o.x + o.w
      ) {
        player.y = o.y - player.h;
        player.vy = 0;
        player.jumps = 0;
      }
    }

    if (player.y + player.h >= groundY) {
      player.y = groundY - player.h;
      player.vy = 0;
      player.jumps = 0;
    }

    for (const o of objects) o.x -= sp * dt;

    if (player.magnet > 0 || player.fever > 0) {
      for (const o of objects) {
        if (o.type !== 'letter' && o.type !== 'item') continue;
        const cx = o.x + o.w / 2;
        const cy = o.y + o.h / 2;
        const px = player.x + player.w / 2;
        const py = player.y + player.h / 2;
        const dx = px - cx;
        const dy = py - cy;
        const dd = Math.hypot(dx, dy);
        if (dd < 230) {
          o.x += dx * dt * 5.3;
          o.y += dy * dt * 5.3;
        }
      }
    }

    const pbox = {
      x: player.x + player.w * .18,
      y: player.y + player.h * .12,
      w: player.w * .64,
      h: player.h * .78
    };

    for (let i = objects.length - 1; i >= 0; i--) {
      const o = objects[i];
      if (o.x + o.w < -70) {
        objects.splice(i, 1);
        continue;
      }
      if (o.type === 'platform') continue;

      if (o.type === 'kuri' && rectHit(pbox, o, 4)) {
        if (player.giant > 0 || player.fever > 0) {
          burst(o.x + o.w/2, o.y + o.h/2, '#a8673e', 12, 180);
          objects.splice(i, 1);
          scoreFloat += 25;
          score = Math.floor(scoreFloat);
          beep(190, .04, 'square', .03);
          continue;
        }
        if (player.shield) {
          player.shield = false;
          flash = .16;
          shake = 6;
          burst(o.x + o.w/2, o.y + o.h/2, '#8de8ff', 14, 150);
          objects.splice(i, 1);
          beep(240, .12, 'sawtooth', .05);
          continue;
        }
        beginDamageGameOver();
        return;
      }

      if ((o.type === 'letter' || o.type === 'item') && rectHit(pbox, o, -2)) {
        if (o.type === 'letter') collectLetter(o);
        else collectItem(o);
        objects.splice(i, 1);
      }
    }

    if (distance + W > nextPattern) spawnPattern();

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
      p.vx *= .985;
      if (p.life <= 0) particles.splice(i, 1);
    }

    for (let i = pickupEffects.length - 1; i >= 0; i--) {
      pickupEffects[i].life -= dt;
      if (pickupEffects[i].life <= 0) pickupEffects.splice(i, 1);
    }

    shake = Math.max(0, shake - dt * 24);
    flash = Math.max(0, flash - dt);
    updateHud();
  }

  function collectLetter(o) {
    if (o.letter !== WORD[collected]) return;
    collected++;
    burst(o.x + o.w/2, o.y + o.h/2, '#ffd85a', 14, 145);
    beep(620 + collected * 45, .075, 'sine', .045);
    if (collected >= WORD.length) {
      collected = 0;
      player.fever = 8;
      player.magnet = Math.max(player.magnet, 8);
      flash = .35;
      burst(player.x + player.w/2, player.y + player.h/2, '#ffca43', 28, 240);
      beep(920, .22, 'square', .04);
    }
  }

  function pickupPop(o, color) {
    pickupEffects.push({
      item: o.item,
      x: o.x + o.w / 2,
      y: o.y + o.h / 2,
      life: .34,
      maxLife: .34,
      color
    });
  }

  function collectItem(o) {
    if (o.item === 'shield') {
      player.shield = true;
      pickupPop(o, '#8de8ff');
      beep(760, .11, 'sine', .04);
      burst(o.x + o.w/2, o.y + o.h/2, '#8de8ff', 16, 145);
    }
    if (o.item === 'magnet') {
      player.magnet = 8;
      pickupPop(o, '#ff9b9b');
      beep(520, .11, 'sine', .04);
      burst(o.x + o.w/2, o.y + o.h/2, '#ef8d8d', 16, 145);
    }
    if (o.item === 'giant') {
      player.giant = 6;
      pickupPop(o, '#ffd27a');
      beep(250, .14, 'square', .04);
      burst(o.x + o.w/2, o.y + o.h/2, '#ffd27a', 18, 165);
    }
  }

  function updateHud() {
    scoreEl.textContent = score;
    bestEl.textContent = '/ ' + Math.max(best, score);
    let html = '';
    for (let i=0; i<WORD.length; i++) {
      html += `<span style="color:${i<collected?'#f39b22':'#61766f'};opacity:${i<collected?1:.55}">${WORD[i]}</span>${i<WORD.length-1?' ':''}`;
    }
    lettersEl.innerHTML = html;
    shieldBuff.style.display = player.shield ? 'block' : 'none';
    magnetBuff.style.display = player.magnet > 0 ? 'block' : 'none';
    giantBuff.style.display = player.giant > 0 ? 'block' : 'none';
    feverBuff.style.display = player.fever > 0 ? 'block' : 'none';
  }

  function burst(x, y, color, n=8, power=120) {
    for (let i=0; i<n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = power * (.35 + Math.random() * .75);
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: .35 + Math.random() * .45,
        color,
        r: 2 + Math.random() * 4
      });
    }
  }

  function roundedRect(x,y,w,h,r) {
    ctx.beginPath();
    ctx.roundRect(x,y,w,h,r);
  }

  function drawSprite(name, x, y, w, h) {
    const image = sprites[name];
    if (!image || !image.complete || !image.naturalWidth) return false;
    const scale = Math.min(w / image.naturalWidth, h / image.naturalHeight);
    const dw = image.naturalWidth * scale;
    const dh = image.naturalHeight * scale;
    ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    return true;
  }

  function drawBackground() {
    const meters = Math.floor(distance / 18);
    const st = stages[Math.floor(meters / 450) % stages.length];
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0, st.sky1);
    grad.addColorStop(1, st.sky2);
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H);

    const dark = st.name === 'ほしぞら';
    if (dark) {
      ctx.fillStyle = '#fffbd9';
      for (let i=0;i<22;i++) {
        const x = (i*83 - distance*.02) % (W+80);
        const y = 40 + (i*47)%220;
        ctx.globalAlpha = .4 + (i%4)*.13;
        ctx.fillRect((x+W+80)%(W+80)-20, y, 2, 2);
      }
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(W*.78,H*.15,28,0,Math.PI*2);
      ctx.fillStyle = '#fff2b4';
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(W*.78,H*.15,30,0,Math.PI*2);
      ctx.fillStyle = '#fff4a7';
      ctx.fill();
    }

    ctx.fillStyle = st.far;
    ctx.beginPath();
    ctx.moveTo(0,groundY);
    for (let x=0;x<=W+80;x+=80) {
      const off = (distance*.055)%80;
      ctx.lineTo(x-off, groundY-75-28*Math.sin((x+distance*.055)/115));
    }
    ctx.lineTo(W,groundY);
    ctx.fill();

    ctx.fillStyle = st.hill;
    ctx.beginPath();
    ctx.moveTo(0,groundY);
    for (let x=0;x<=W+120;x+=60) {
      const off = (distance*.11)%60;
      ctx.lineTo(x-off, groundY-36-18*Math.sin((x+distance*.11)/82));
    }
    ctx.lineTo(W,groundY);
    ctx.fill();

    ctx.fillStyle = st.ground;
    ctx.fillRect(0,groundY,W,H-groundY);
    ctx.fillStyle = st.dirt;
    ctx.fillRect(0,groundY+16,W,H-groundY-16);

    ctx.fillStyle = '#ffffff3b';
    for (let i=0;i<12;i++) {
      let x=(i*91-distance*.6)%(W+90);
      x=(x+W+90)%(W+90)-30;
      ctx.fillRect(x,groundY+6+(i%2)*22,20+(i%3)*10,3);
    }
  }

  function drawPlatform(o) {
    ctx.fillStyle = '#7fbd79';
    roundedRect(o.x,o.y,o.w,o.h,8);
    ctx.fill();
    ctx.fillStyle = '#c19467';
    ctx.fillRect(o.x+5,o.y+12,o.w-10,10);
    ctx.fillStyle = '#ffffff55';
    ctx.fillRect(o.x+10,o.y+3,Math.max(8,o.w*.24),3);
  }

  function drawKuri(o) {
    const size = Math.max(o.w, o.h) * 1.34;
    if (drawSprite('kuri', o.x + o.w/2 - size/2, o.y + o.h - size, size, size)) return;
    const cx=o.x+o.w/2, cy=o.y+o.h/2;
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(-.08);
    ctx.fillStyle='#7d472d';
    ctx.beginPath();
    ctx.moveTo(-o.w*.43,o.h*.12);
    ctx.quadraticCurveTo(-o.w*.25,-o.h*.56,0,-o.h*.48);
    ctx.quadraticCurveTo(o.w*.33,-o.h*.5,o.w*.44,o.h*.1);
    ctx.quadraticCurveTo(0,o.h*.66,-o.w*.43,o.h*.12);
    ctx.fill();
    ctx.fillStyle='#c6814a';
    ctx.beginPath();
    ctx.moveTo(-o.w*.4,o.h*.08);
    ctx.quadraticCurveTo(0,o.h*.38,o.w*.4,o.h*.08);
    ctx.quadraticCurveTo(.15*o.w,.55*o.h,-.15*o.w,.5*o.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle='#6c3d29';
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(-5,-o.h*.43);
    ctx.lineTo(0,-o.h*.62);
    ctx.lineTo(5,-o.h*.44);
    ctx.stroke();
    ctx.restore();
  }

  function drawBubble(o,label,bg='#fff') {
    ctx.fillStyle=bg;
    ctx.beginPath();
    ctx.arc(o.x+o.w/2,o.y+o.h/2,o.w*.58,0,Math.PI*2);
    ctx.fill();
    ctx.strokeStyle='#ffffff';
    ctx.lineWidth=3;
    ctx.stroke();
    ctx.fillStyle='#315b50';
    ctx.font='900 19px system-ui';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText(label,o.x+o.w/2,o.y+o.h/2+1);
  }

  function drawPlayer() {
    const p=player;
    const airborne=p.y+p.h<groundY-2;
    ctx.save();
    const bob=!airborne?Math.sin(p.runT)*2:0;
    ctx.translate(p.x+p.w/2,p.y+p.h/2+bob);
    let sx=1,sy=1;
    if(p.squash>0){sx=1.08;sy=.92;}
    ctx.scale(sx,sy);

    if(p.fever>0){ctx.shadowColor='#ffd33d';ctx.shadowBlur=18;}
    if(p.shield){
      ctx.strokeStyle='#8de8ff';ctx.lineWidth=5;ctx.globalAlpha=.7;
      ctx.beginPath();ctx.arc(0,0,p.w*.84,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    }

    const spriteName = state === 'damage' || performance.now() < p.damageUntil
      ? 'damage'
      : airborne
        ? 'jump'
        : Math.floor(p.runT * 2.2) % 2 ? 'run1' : 'run2';
    const visualSize = p.w * (spriteName === 'damage' ? 1.72 : 1.68);
    if (drawSprite(spriteName, -visualSize/2, p.h/2-visualSize, visualSize, visualSize)) {
      ctx.restore();
      return;
    }

    ctx.fillStyle='#76cbb4';
    ctx.beginPath();
    ctx.moveTo(-p.w*.30,p.h*.06);
    ctx.quadraticCurveTo(-p.w*.78,p.h*.18,-p.w*.68,p.h*.38);
    ctx.quadraticCurveTo(-p.w*.38,p.h*.28,-p.w*.18,p.h*.19);
    ctx.closePath();ctx.fill();

    ctx.fillStyle='#f2ad48';
    for(let i=0;i<3;i++){
      const x=-p.w*.17+i*p.w*.15;
      ctx.beginPath();
      ctx.moveTo(x,-p.h*.34);
      ctx.lineTo(x+p.w*.08,-p.h*.58+(i===1?-2:3));
      ctx.lineTo(x+p.w*.14,-p.h*.31);
      ctx.closePath();ctx.fill();
    }

    ctx.fillStyle='#78cdb7';
    ctx.beginPath();ctx.ellipse(-p.w*.02,p.h*.05,p.w*.35,p.h*.39,-.2,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(p.w*.18,-p.h*.16,p.w*.34,p.h*.28,.1,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#82d5be';
    ctx.beginPath();ctx.ellipse(p.w*.34,-p.h*.08,p.w*.27,p.h*.16,.02,0,Math.PI*2);ctx.fill();

    ctx.fillStyle='#fff';
    ctx.beginPath();ctx.arc(p.w*.25,-p.h*.24,p.w*.09,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#203c35';
    ctx.beginPath();ctx.arc(p.w*.28,-p.h*.24,p.w*.038,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#3b7668';
    ctx.beginPath();ctx.arc(p.w*.43,-p.h*.11,p.w*.025,0,Math.PI*2);ctx.fill();

    ctx.strokeStyle='#3f6d62';ctx.lineWidth=Math.max(2,p.w*.035);ctx.lineCap='round';
    ctx.beginPath();ctx.arc(p.w*.30,-p.h*.06,p.w*.12,.25,1.6);ctx.stroke();
    ctx.strokeStyle='#66bba5';ctx.lineWidth=p.w*.11;
    ctx.beginPath();ctx.moveTo(p.w*.16,p.h*.08);ctx.lineTo(p.w*.30,p.h*.18);ctx.stroke();

    ctx.strokeStyle='#5db39d';ctx.lineWidth=p.w*.14;ctx.lineCap='round';
    const leg=Math.sin(p.runT)*p.w*.10;
    ctx.beginPath();
    ctx.moveTo(-p.w*.10,p.h*.28);ctx.lineTo(-p.w*.16+leg,p.h*.46);
    ctx.moveTo(p.w*.12,p.h*.28);ctx.lineTo(p.w*.15-leg,p.h*.46);
    ctx.stroke();
    ctx.restore();
  }

  function drawPickupEffects() {
    for (const fx of pickupEffects) {
      const progress = 1 - fx.life / fx.maxLife;
      const pop = 1 + Math.sin(Math.PI * progress) * .28;
      const base = 46;
      const size = base * pop;
      const alpha = Math.max(0, Math.min(1, fx.life / .18));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = fx.color;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, 24 + progress * 18, 0, Math.PI * 2);
      ctx.stroke();
      drawSprite(fx.item, fx.x - size/2, fx.y - size/2, size, size);
      ctx.restore();
    }
  }

  function draw() {
    ctx.save();
    if (shake > 0) ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
    drawBackground();

    for (const o of objects) if (o.type==='platform') drawPlatform(o);
    for (const o of objects) {
      if (o.type==='kuri') drawKuri(o);
      if (o.type==='letter') drawBubble(o,o.letter,'#ffe48a');
      if (o.type==='item') {
        const pad = 6;
        if (!drawSprite(o.item, o.x-pad, o.y-pad, o.w+pad*2, o.h+pad*2)) {
          drawBubble(
            o,
            o.item==='shield'?'S':o.item==='magnet'?'M':'G',
            o.item==='shield'?'#bfeeff':o.item==='magnet'?'#ffd0d0':'#c9f2a9'
          );
        }
      }
    }

    drawPickupEffects();
    drawPlayer();

    for (const p of particles) {
      ctx.globalAlpha=Math.max(0,p.life/.7);
      ctx.fillStyle=p.color;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;

    if(player.fever>0){
      ctx.fillStyle='#ffd64a22';ctx.fillRect(0,0,W,H);
      ctx.font='900 26px system-ui';ctx.textAlign='center';ctx.fillStyle='#ff9b2f';
      ctx.fillText('FEVER ×3',W/2,H*.19);
    }
    if(flash>0){
      ctx.globalAlpha=Math.min(.65,flash*2.1);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
    }
    ctx.restore();
  }

  function loop(t) {
    const dt = Math.min(.032, (t-last)/1000 || 0);
    last = t;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
