(() => {
  'use strict';

  const proto = CanvasRenderingContext2D.prototype;
  const nativeFillRect = proto.fillRect;
  const nativeFill = proto.fill;
  const nativeRoundRect = proto.roundRect;
  let inTheme = false;
  let lastRoundRect = null;
  let pendingPlatform = null;

  const farColors = new Map([
    ['#bce5b7', '#83b992'],
    ['#c8d9d0', '#93aaa0'],
    ['#efd0a2', '#d6aa78'],
    ['#6e8191', '#536776']
  ]);
  const hillColors = new Map([
    ['#8fd5a7', '#5ea879'],
    ['#9ac6cf', '#6f9faa'],
    ['#d8a88a', '#b98267'],
    ['#5b7082', '#405669']
  ]);
  const groundColors = new Map([
    ['#6ab67d', ['#3f8055', '#91d9a0', 'grass']],
    ['#70b683', ['#477f5b', '#95d3a3', 'city']],
    ['#79ad73', ['#54784f', '#a2d08e', 'sunset']],
    ['#527b65', ['#334f42', '#749781', 'night']]
  ]);
  const dirtColors = new Map([
    ['#b98055', ['#8f6042', '#d4a074']],
    ['#ae7d5d', ['#815f48', '#c99775']],
    ['#a8775c', ['#7b5846', '#c08e72']],
    ['#71584f', ['#513f39', '#8d6c60']]
  ]);

  function themed(ctx, fn) {
    inTheme = true;
    ctx.save();
    try { fn(); } finally {
      ctx.restore();
      inTheme = false;
    }
  }

  function scrollOffset(speed, span) {
    return (performance.now() * speed / 1000) % span;
  }

  function drawTuft(ctx, x, y, color, scale = 1) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 4 * scale, y - 7 * scale);
    ctx.moveTo(x + 1 * scale, y);
    ctx.lineTo(x + 2 * scale, y - 9 * scale);
    ctx.moveTo(x + 3 * scale, y);
    ctx.lineTo(x + 8 * scale, y - 6 * scale);
    ctx.stroke();
  }

  function drawTree(ctx, x, groundY, leaf, trunk, scale = 1, alpha = .72) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = trunk;
    ctx.strokeStyle = '#3f5547';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 4 * scale, groundY - 28 * scale, 8 * scale, 28 * scale, 3 * scale);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = leaf;
    ctx.strokeStyle = '#4d765e';
    ctx.lineWidth = 2.5;
    const blobs = [
      [x - 11 * scale, groundY - 33 * scale, 13 * scale],
      [x + 2 * scale, groundY - 39 * scale, 15 * scale],
      [x + 13 * scale, groundY - 31 * scale, 12 * scale]
    ];
    for (const [cx, cy, r] of blobs) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHouse(ctx, x, groundY, scale = 1, alpha = .58) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#61766f';
    ctx.fillStyle = '#f4d7a8';
    ctx.beginPath();
    ctx.roundRect(x - 18 * scale, groundY - 29 * scale, 36 * scale, 29 * scale, 4 * scale);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#c97563';
    ctx.beginPath();
    ctx.moveTo(x - 22 * scale, groundY - 28 * scale);
    ctx.lineTo(x, groundY - 47 * scale);
    ctx.lineTo(x + 22 * scale, groundY - 28 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#8fc4d0';
    ctx.fillRect(x - 11 * scale, groundY - 20 * scale, 8 * scale, 8 * scale);
    ctx.fillRect(x + 5 * scale, groundY - 20 * scale, 8 * scale, 8 * scale);
    ctx.fillStyle = '#8b674f';
    ctx.fillRect(x - 3 * scale, groundY - 13 * scale, 7 * scale, 13 * scale);
    ctx.restore();
  }

  function drawPine(ctx, x, groundY, scale = 1, alpha = .55) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#2f5145';
    ctx.strokeStyle = '#29463d';
    ctx.lineWidth = 2;
    ctx.fillRect(x - 2 * scale, groundY - 16 * scale, 4 * scale, 16 * scale);
    for (let i = 0; i < 3; i++) {
      const cy = groundY - (20 + i * 10) * scale;
      const half = (15 - i * 2) * scale;
      ctx.beginPath();
      ctx.moveTo(x, cy - 14 * scale);
      ctx.lineTo(x - half, cy + 10 * scale);
      ctx.lineTo(x + half, cy + 10 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawStageScenery(ctx, y, w, style) {
    const palette = groundColors.get(style);
    if (!palette) return;
    const stage = palette[2];
    const horizon = y + 1;
    const spacing = stage === 'city' ? 150 : 180;
    const offset = scrollOffset(stage === 'city' ? 52 : 44, spacing);

    themed(ctx, () => {
      for (let i = -1; i <= Math.ceil(w / spacing) + 1; i++) {
        const x = i * spacing - offset + 48;
        if (stage === 'grass') {
          drawTree(ctx, x, horizon, '#9fcea0', '#a77e58', .82, .52);
          ctx.fillStyle = '#7fb58b';
          ctx.globalAlpha = .45;
          ctx.beginPath();
          ctx.ellipse(x + 43, horizon - 7, 21, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        } else if (stage === 'city') {
          drawHouse(ctx, x, horizon, .8, .52);
          if (i % 2 === 0) drawHouse(ctx, x + 67, horizon, .62, .38);
        } else if (stage === 'sunset') {
          drawTree(ctx, x, horizon, '#aa8067', '#8c644d', .75, .42);
          ctx.strokeStyle = '#8c6b5b';
          ctx.globalAlpha = .34;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 45, horizon - 13);
          ctx.lineTo(x + 80, horizon - 13);
          ctx.moveTo(x + 53, horizon - 22);
          ctx.lineTo(x + 53, horizon);
          ctx.moveTo(x + 72, horizon - 22);
          ctx.lineTo(x + 72, horizon);
          ctx.stroke();
          ctx.globalAlpha = 1;
        } else if (stage === 'night') {
          drawPine(ctx, x, horizon, .78, .5);
          drawPine(ctx, x + 60, horizon, .55, .34);
          ctx.fillStyle = '#ffe99a';
          ctx.globalAlpha = .55;
          for (let k = 0; k < 3; k++) {
            ctx.beginPath();
            ctx.arc(x + 24 + k * 18, horizon - 45 - (k % 2) * 9, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
      }
    });
  }

  function drawGroundAccent(ctx, x, y, w, style) {
    const palette = groundColors.get(style);
    if (!palette) return;
    const [dark, light] = palette;
    themed(ctx, () => {
      ctx.fillStyle = light;
      nativeFillRect.call(ctx, x, y, w, 8);
      ctx.fillStyle = dark;
      nativeFillRect.call(ctx, x, y + 8, w, 3);

      const spacing = 54;
      const offset = scrollOffset(270, spacing);
      for (let gx = -spacing; gx < w + spacing; gx += spacing) {
        const px = gx - offset;
        drawTuft(ctx, px + 18, y + 7, dark, .78);
        if ((Math.floor((gx + spacing) / spacing) & 1) === 0) {
          ctx.fillStyle = '#efe1b5';
          ctx.strokeStyle = dark;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.ellipse(px + 39, y + 13, 4.2, 2.4, -.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
    });
  }

  function drawDirtAccent(ctx, x, y, w, h, style) {
    const palette = dirtColors.get(style);
    if (!palette) return;
    const [dark, light] = palette;
    themed(ctx, () => {
      const spacing = 84;
      const offset = scrollOffset(245, spacing);
      ctx.globalAlpha = .38;
      for (let i = -1; i < Math.ceil(w / spacing) + 2; i++) {
        const px = i * spacing - offset + 30;
        const row = Math.abs(i) % 3;
        const py = y + 22 + row * 28;
        ctx.fillStyle = light;
        ctx.beginPath();
        ctx.ellipse(px, py, 8 + (row % 2) * 3, 3.2, -.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.ellipse(px + 29, py + 16, 5.5, 2.6, .18, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
  }

  function drawPlatformIsland(ctx, rr) {
    themed(ctx, () => {
      const topY = rr.y;
      const bodyY = topY + 5;
      const bodyH = 27;

      ctx.fillStyle = '#aa7853';
      ctx.strokeStyle = '#4e5845';
      ctx.lineWidth = 3;
      ctx.beginPath();
      nativeRoundRect.call(ctx, rr.x + 3, bodyY, rr.w - 6, bodyH, 9);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#c99768';
      ctx.beginPath();
      nativeRoundRect.call(ctx, rr.x + 7, bodyY + 4, rr.w - 14, 8, 5);
      ctx.fill();

      ctx.fillStyle = '#6baa70';
      ctx.strokeStyle = '#45664f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      nativeRoundRect.call(ctx, rr.x, topY, rr.w, 13, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#a9dc8c';
      ctx.beginPath();
      nativeRoundRect.call(ctx, rr.x + 4, topY + 2, rr.w - 8, 5, 4);
      ctx.fill();

      ctx.strokeStyle = '#3f7752';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      for (let px = rr.x + 15; px < rr.x + rr.w - 8; px += 26) {
        drawTuft(ctx, px, topY + 5, '#3f7752', .65);
      }

      ctx.globalAlpha = .52;
      ctx.fillStyle = '#805b44';
      for (let px = rr.x + 20; px < rr.x + rr.w - 8; px += 31) {
        ctx.beginPath();
        ctx.ellipse(px, bodyY + 19 + ((px / 31) % 2) * 3, 3.4, 1.8, .2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
  }

  proto.roundRect = function(x, y, w, h, r) {
    if (!inTheme) lastRoundRect = {x, y, w, h, r};
    return Reflect.apply(nativeRoundRect, this, arguments);
  };

  proto.fill = function() {
    const style = typeof this.fillStyle === 'string' ? this.fillStyle.toLowerCase() : '';
    const rr = lastRoundRect;
    const result = Reflect.apply(nativeFill, this, arguments);

    if (!inTheme) {
      const outline = farColors.get(style) || hillColors.get(style);
      if (outline) {
        themed(this, () => {
          this.strokeStyle = outline;
          this.globalAlpha = farColors.has(style) ? .30 : .44;
          this.lineWidth = farColors.has(style) ? 2 : 3;
          this.stroke();
          this.globalAlpha = 1;
        });
      }

      if (rr && style === '#7fbd79') pendingPlatform = rr;
    }

    lastRoundRect = null;
    return result;
  };

  proto.fillRect = function(x, y, w, h) {
    const style = typeof this.fillStyle === 'string' ? this.fillStyle.toLowerCase() : '';
    const result = Reflect.apply(nativeFillRect, this, arguments);
    if (inTheme) return result;

    if (groundColors.has(style) && x === 0 && w > 250 && h > 70) {
      drawStageScenery(this, y, w, style);
      drawGroundAccent(this, x, y, w, style);
    }

    if (dirtColors.has(style) && x === 0 && w > 250 && h > 50) {
      drawDirtAccent(this, x, y, w, h, style);
    }

    if (style === '#c19467' && h === 10 && w > 35) {
      themed(this, () => {
        this.fillStyle = '#966946';
        nativeFillRect.call(this, x, y + h - 3, w, 3);
      });
    }

    if (style === '#ffffff55' && h === 3 && pendingPlatform) {
      const rr = pendingPlatform;
      pendingPlatform = null;
      drawPlatformIsland(this, rr);
    }

    return result;
  };
})();
