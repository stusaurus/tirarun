(() => {
  'use strict';

  const proto = CanvasRenderingContext2D.prototype;
  const nativeFillRect = proto.fillRect;
  const nativeFill = proto.fill;
  const nativeRoundRect = proto.roundRect;
  const nativeDrawImage = proto.drawImage;

  const candidatePaths = [
    '045F6B8F-3A48-43DE-9D49-E5C8EAC312DD.png',
    '210F6CF8-1C02-465D-B05F-A1299907CF78.png',
    '306923B0-212A-4007-95CC-3C3C9004229A.png',
    '413A55EB-0D5A-42A8-B2A9-B73004E49C9B.png',
    '6F3A7A09-617A-4F5B-90F7-A87EB9CC86FF.png',
    '89C0D311-B874-4C6C-94FE-FD1ECAE97BD3.png',
    'D801606A-CB2D-40C8-A994-0B7A55654E8D.png'
  ];

  const stageFar = new Map([
    ['#bce5b7', 0], ['#c8d9d0', 1], ['#efd0a2', 2], ['#6e8191', 3]
  ]);
  const stageHill = new Map([
    ['#8fd5a7', 0], ['#9ac6cf', 1], ['#d8a88a', 2], ['#5b7082', 3]
  ]);
  const stageGround = new Map([
    ['#6ab67d', 0], ['#70b683', 1], ['#79ad73', 2], ['#527b65', 3]
  ]);
  const stageDirt = new Set(['#b98055', '#ae7d5d', '#a8775c', '#71584f']);

  const assets = {
    ground: null,
    platform: null,
    grass: null,
    rocks: null,
    backgrounds: [null, null, null, null]
  };

  const alphaBoundsCache = new WeakMap();
  let ready = false;
  let currentStage = 0;
  let previousStage = 0;
  let stageChangedAt = 0;
  let lastRoundRect = null;
  let skipPlatformRects = 0;
  let inTheme = false;
  let groundLineY = 0;

  function loadImage(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve({src, img});
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function sampleImage(img, lowerHalf = false) {
    const c = document.createElement('canvas');
    c.width = 28;
    c.height = 28;
    const g = c.getContext('2d', {willReadFrequently:true});
    const sy = lowerHalf ? img.naturalHeight * .45 : 0;
    const sh = lowerHalf ? img.naturalHeight * .55 : img.naturalHeight;
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(img, 0, sy, img.naturalWidth, sh, 0, 0, c.width, c.height);
    const data = g.getImageData(0, 0, c.width, c.height).data;
    let r=0, gg=0, b=0, n=0, green=0;
    for (let i=0; i<data.length; i+=4) {
      const a = data[i+3];
      if (a < 24) continue;
      const rr=data[i], gr=data[i+1], bb=data[i+2];
      r += rr; gg += gr; b += bb; n++;
      if (gr > rr + 8 && gr > bb + 8) green++;
    }
    if (!n) return {r:0,g:0,b:0,lum:0,warm:0,green:0};
    r/=n; gg/=n; b/=n;
    return {
      r, g:gg, b,
      lum: r*.2126 + gg*.7152 + b*.0722,
      warm: r - b,
      green: green/n
    };
  }

  function alphaBounds(img) {
    if (alphaBoundsCache.has(img)) return alphaBoundsCache.get(img);
    const maxSide = 240;
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d', {willReadFrequently:true});
    g.clearRect(0,0,w,h);
    g.drawImage(img,0,0,w,h);
    const d = g.getImageData(0,0,w,h).data;
    let minX=w, minY=h, maxX=-1, maxY=-1;
    for (let y=0; y<h; y++) {
      for (let x=0; x<w; x++) {
        if (d[(y*w+x)*4+3] > 20) {
          if (x<minX) minX=x;
          if (x>maxX) maxX=x;
          if (y<minY) minY=y;
          if (y>maxY) maxY=y;
        }
      }
    }
    const result = maxX < 0 ? {x:0,y:0,w:img.naturalWidth,h:img.naturalHeight} : {
      x: minX/scale,
      y: minY/scale,
      w: (maxX-minX+1)/scale,
      h: (maxY-minY+1)/scale
    };
    alphaBoundsCache.set(img, result);
    return result;
  }

  function classify(list) {
    const backgrounds = [];
    const decor = [];

    for (const entry of list) {
      if (!entry) continue;
      const img = entry.img;
      const ratio = img.naturalWidth / img.naturalHeight;
      if (ratio >= 2.55) assets.ground = img;
      else if (ratio >= 1.72 && ratio <= 2.35) assets.platform = img;
      else if (ratio >= 1.28 && ratio <= 1.72) decor.push(img);
      else if (ratio <= .78) backgrounds.push(img);
    }

    if (decor.length) {
      const ranked = decor.map(img => ({img, s: sampleImage(img)}));
      ranked.sort((a,b) => (b.s.g - (b.s.r+b.s.b)/2) - (a.s.g - (a.s.r+a.s.b)/2));
      assets.grass = ranked[0]?.img || null;
      assets.rocks = ranked[1]?.img || null;
    }

    if (backgrounds.length) {
      const rows = backgrounds.map(img => ({img, all:sampleImage(img), low:sampleImage(img,true)}));
      rows.sort((a,b) => a.all.lum - b.all.lum);
      const night = rows.shift();
      if (night) assets.backgrounds[3] = night.img;

      if (rows.length) {
        rows.sort((a,b) => b.all.warm - a.all.warm);
        const sunset = rows.shift();
        if (sunset) assets.backgrounds[2] = sunset.img;
      }

      if (rows.length === 1) {
        assets.backgrounds[0] = rows[0].img;
        assets.backgrounds[1] = rows[0].img;
      } else if (rows.length >= 2) {
        rows.sort((a,b) => b.low.green - a.low.green);
        assets.backgrounds[0] = rows[0].img;
        assets.backgrounds[1] = rows[1].img;
      }
    }

    if (!assets.backgrounds[1]) assets.backgrounds[1] = assets.backgrounds[0];
    if (!assets.backgrounds[0]) assets.backgrounds[0] = assets.backgrounds[1] || assets.backgrounds[2] || assets.backgrounds[3];
    if (!assets.backgrounds[2]) assets.backgrounds[2] = assets.backgrounds[1] || assets.backgrounds[0];
    if (!assets.backgrounds[3]) assets.backgrounds[3] = assets.backgrounds[2] || assets.backgrounds[0];
    if (!assets.rocks && decor.length > 1) assets.rocks = decor[1];

    ready = Boolean(assets.ground || assets.platform || assets.backgrounds.some(Boolean));
  }

  Promise.all(candidatePaths.map(loadImage)).then(classify);

  function setStage(index) {
    if (index === currentStage) return;
    previousStage = currentStage;
    currentStage = index;
    stageChangedAt = performance.now();
  }

  function drawCover(ctx, img, x, y, w, h, alpha=1) {
    if (!img || !img.complete || !img.naturalWidth) return false;
    const srcRatio = img.naturalWidth / img.naturalHeight;
    const dstRatio = w / h;
    let sx=0, sy=0, sw=img.naturalWidth, sh=img.naturalHeight;
    if (srcRatio > dstRatio) {
      sw = img.naturalHeight * dstRatio;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      sh = img.naturalWidth / dstRatio;
      sy = (img.naturalHeight - sh) * .42;
      sy = Math.max(0, Math.min(img.naturalHeight - sh, sy));
    }
    ctx.save();
    ctx.globalAlpha *= alpha;
    nativeDrawImage.call(ctx, img, sx, sy, sw, sh, x, y, w, h);
    ctx.restore();
    return true;
  }

  function drawStageBackground(ctx, x, y, w, h) {
    const img = assets.backgrounds[currentStage];
    if (!img) return false;
    const elapsed = performance.now() - stageChangedAt;
    const mix = stageChangedAt ? Math.min(1, elapsed / 450) : 1;
    const prev = assets.backgrounds[previousStage];
    if (prev && previousStage !== currentStage && mix < 1) {
      drawCover(ctx, prev, x, y, w, h, 1);
      drawCover(ctx, img, x, y, w, h, mix);
    } else {
      drawCover(ctx, img, x, y, w, h, 1);
    }
    return true;
  }

  function drawCropped(ctx, img, dx, dy, dw, dh) {
    if (!img || !img.complete || !img.naturalWidth) return false;
    const b = alphaBounds(img);
    nativeDrawImage.call(ctx, img, b.x, b.y, b.w, b.h, dx, dy, dw, dh);
    return true;
  }

  const sheetCells = [
    [.04,.05,.43,.40], [.53,.05,.43,.40],
    [.02,.50,.31,.44], [.345,.49,.31,.45], [.67,.50,.31,.44]
  ];

  function drawSheetCell(ctx, img, cellIndex, cx, baseY, width, alpha=1) {
    if (!img || !img.complete || !img.naturalWidth) return;
    const c = sheetCells[cellIndex % sheetCells.length];
    const sx = img.naturalWidth*c[0], sy=img.naturalHeight*c[1];
    const sw = img.naturalWidth*c[2], sh=img.naturalHeight*c[3];
    const ratio = sw/sh;
    const height = width/ratio;
    ctx.save();
    ctx.globalAlpha *= alpha;
    nativeDrawImage.call(ctx, img, sx,sy,sw,sh, cx-width/2, baseY-height, width,height);
    ctx.restore();
  }

  function drawGroundAsset(ctx, x, y, w, h) {
    groundLineY = y;
    if (!assets.ground) return false;
    const b = alphaBounds(assets.ground);
    const visibleRatio = b.w / b.h;
    const desiredH = Math.max(110, h + 10);
    const desiredW = desiredH * visibleRatio;
    const scale = desiredW > w ? 1 : (w/visibleRatio)/desiredH;
    const dh = desiredH * scale;
    const dw = dh * visibleRatio;
    let offsetX = 0;
    while (offsetX < w) {
      const tileW = Math.min(dw, w-offsetX);
      const srcW = b.w * (tileW/dw);
      nativeDrawImage.call(ctx, assets.ground, b.x,b.y,srcW,b.h, x+offsetX,y-8,tileW,dh);
      offsetX += tileW;
    }

    if (assets.grass) {
      drawSheetCell(ctx, assets.grass, 0, w*.12, y+3, 42, .82);
      drawSheetCell(ctx, assets.grass, 3, w*.61, y+4, 36, .78);
    }
    if (assets.rocks) {
      drawSheetCell(ctx, assets.rocks, 1, w*.36, y+33, 34, .60);
      drawSheetCell(ctx, assets.rocks, 4, w*.82, y+41, 28, .55);
    }
    return true;
  }

  function drawPlatformAsset(ctx, rr) {
    if (!assets.platform) return false;
    const visualH = Math.max(54, Math.min(78, rr.w*.48));
    const visualW = rr.w + 18;
    const dx = rr.x - 9;
    const dy = rr.y - 11;
    drawCropped(ctx, assets.platform, dx, dy, visualW, visualH);
    return true;
  }

  proto.roundRect = function(x,y,w,h,r) {
    if (!inTheme) lastRoundRect = {x,y,w,h,r};
    return Reflect.apply(nativeRoundRect, this, arguments);
  };

  proto.fill = function() {
    if (inTheme || !ready) return Reflect.apply(nativeFill, this, arguments);
    const style = typeof this.fillStyle === 'string' ? this.fillStyle.toLowerCase() : '';

    if (stageFar.has(style)) {
      setStage(stageFar.get(style));
      lastRoundRect = null;
      return;
    }
    if (stageHill.has(style)) {
      setStage(stageHill.get(style));
      lastRoundRect = null;
      return;
    }
    if (style === '#fff2b4' || style === '#fff4a7') {
      lastRoundRect = null;
      return;
    }

    const rr = lastRoundRect;
    if (rr && style === '#7fbd79' && drawPlatformAsset(this, rr)) {
      skipPlatformRects = 2;
      lastRoundRect = null;
      return;
    }

    const out = Reflect.apply(nativeFill, this, arguments);
    lastRoundRect = null;
    return out;
  };

  proto.fillRect = function(x,y,w,h) {
    if (inTheme || !ready) return Reflect.apply(nativeFillRect, this, arguments);
    const style = typeof this.fillStyle === 'string' ? this.fillStyle.toLowerCase() : '';

    if (x === 0 && y === 0 && w >= this.canvas.clientWidth*.9 && h >= this.canvas.clientHeight*.9) {
      if (drawStageBackground(this, x,y,w,h)) return;
    }

    if (stageGround.has(style) && x === 0 && w > 250 && h > 70) {
      setStage(stageGround.get(style));
      if (drawGroundAsset(this, x,y,w,h)) return;
    }
    if (stageDirt.has(style) && x === 0 && w > 250 && h > 50) return;
    if (style === '#ffffff3b' && groundLineY && y >= groundLineY) return;
    if (style === '#fffbd9' && w <= 3 && h <= 3) return;

    if (skipPlatformRects > 0 && (style === '#c19467' || style === '#ffffff55')) {
      skipPlatformRects--;
      return;
    }

    return Reflect.apply(nativeFillRect, this, arguments);
  };
})();
