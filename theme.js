(() => {
  'use strict';

  const proto = CanvasRenderingContext2D.prototype;
  const nativeFillRect = proto.fillRect;
  const nativeFill = proto.fill;
  const nativeRoundRect = proto.roundRect;
  let inTheme = false;
  let lastRoundRect = null;

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
    ['#6ab67d', ['#4b8f61', '#8bd49b']],
    ['#70b683', ['#4e8e64', '#8ed0a0']],
    ['#79ad73', ['#597f55', '#9bcb8d']],
    ['#527b65', ['#385848', '#71967f']]
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

  function drawGroundAccent(ctx, x, y, w, style) {
    const palette = groundColors.get(style);
    if (!palette) return;
    const [dark, light] = palette;
    themed(ctx, () => {
      ctx.fillStyle = light;
      nativeFillRect.call(ctx, x, y, w, 8);
      ctx.fillStyle = dark;
      nativeFillRect.call(ctx, x, y + 8, w, 3);

      ctx.strokeStyle = dark;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let gx = 18; gx < w; gx += 58) {
        ctx.beginPath();
        ctx.moveTo(gx, y + 7);
        ctx.lineTo(gx + 4, y + 1);
        ctx.moveTo(gx + 5, y + 7);
        ctx.lineTo(gx + 10, y + 2);
        ctx.stroke();
      }
    });
  }

  function drawDirtAccent(ctx, x, y, w, h, style) {
    const palette = dirtColors.get(style);
    if (!palette) return;
    const [dark, light] = palette;
    themed(ctx, () => {
      ctx.globalAlpha = .42;
      ctx.fillStyle = light;
      for (let i = 0; i < 8; i++) {
        const px = (i * 79 + 31) % Math.max(90, w);
        const py = y + 18 + (i % 3) * 28;
        ctx.beginPath();
        ctx.ellipse(px, py, 7 + (i % 2) * 4, 3, -.18, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = dark;
      for (let i = 0; i < 7; i++) {
        const px = (i * 97 + 54) % Math.max(100, w);
        const py = y + 34 + (i % 2) * 34;
        ctx.beginPath();
        ctx.ellipse(px, py, 5 + (i % 3), 2.5, .2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
  }

  function drawPlatformAccent(ctx, rr) {
    themed(ctx, () => {
      ctx.strokeStyle = '#45664f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      nativeRoundRect.call(ctx, rr.x, rr.y, rr.w, rr.h, rr.r);
      ctx.stroke();

      ctx.strokeStyle = '#eef7d2';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      const points = [rr.x + 18, rr.x + rr.w * .48, rr.x + rr.w - 24];
      for (const px of points) {
        ctx.beginPath();
        ctx.moveTo(px, rr.y + 5);
        ctx.lineTo(px + 3, rr.y + 1);
        ctx.moveTo(px + 4, rr.y + 5);
        ctx.lineTo(px + 8, rr.y + 2);
        ctx.stroke();
      }
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
          this.globalAlpha = farColors.has(style) ? .34 : .5;
          this.lineWidth = farColors.has(style) ? 2 : 3;
          this.stroke();
          this.globalAlpha = 1;
        });
      }

      if (rr && style === '#7fbd79') drawPlatformAccent(this, rr);
    }

    lastRoundRect = null;
    return result;
  };

  proto.fillRect = function(x, y, w, h) {
    const style = typeof this.fillStyle === 'string' ? this.fillStyle.toLowerCase() : '';
    const result = Reflect.apply(nativeFillRect, this, arguments);
    if (inTheme) return result;

    if (groundColors.has(style) && x === 0 && w > 250 && h > 70) {
      drawGroundAccent(this, x, y, w, style);
    }

    if (dirtColors.has(style) && x === 0 && w > 250 && h > 50) {
      drawDirtAccent(this, x, y, w, h, style);
    }

    if (style === '#c19467' && h === 10 && w > 35) {
      themed(this, () => {
        this.fillStyle = '#966946';
        nativeFillRect.call(this, x, y + h - 3, w, 3);
        this.globalAlpha = .45;
        this.fillStyle = '#e0b584';
        for (let px = x + 10; px < x + w - 5; px += 24) {
          this.beginPath();
          this.ellipse(px, y + 5, 3, 1.6, 0, 0, Math.PI * 2);
          this.fill();
        }
        this.globalAlpha = 1;
      });
    }

    return result;
  };
})();
