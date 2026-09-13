(() => {
  'use strict';

  // Final readability pass. Loaded after theme.js and visibility.js.
  // Tone down only the completed full-screen background, then lift Tiranon a little.
  const proto = CanvasRenderingContext2D.prototype;
  const previousFillRect = proto.fillRect;
  const previousDrawImage = proto.drawImage;

  const playerSprites = [
    '1218B0FC-C2A9-4661-8707-C27D900A8992.png',
    'BBCB72FB-8753-443F-8266-DE96E161B845.png',
    '611DD895-B471-4366-B1DC-231EF0F51CF8.png',
    'DE619F5B-547D-4A02-866D-6E072FD3FF44.png'
  ];

  const tonePixel = document.createElement('canvas');
  tonePixel.width = 1;
  tonePixel.height = 1;
  const toneCtx = tonePixel.getContext('2d');
  toneCtx.fillStyle = '#1f2b28';
  toneCtx.fillRect(0, 0, 1, 1);

  function isPlayerSprite(image) {
    if (!image || typeof image.src !== 'string') return false;
    return playerSprites.some(name => image.src.endsWith(name));
  }

  function isFullCanvasPass(ctx, x, y, w, h) {
    const cssW = ctx.canvas.clientWidth || ctx.canvas.width || 1;
    const cssH = ctx.canvas.clientHeight || ctx.canvas.height || 1;
    return x === 0 && y === 0 && w >= cssW * 0.90 && h >= cssH * 0.90;
  }

  proto.fillRect = function(x, y, w, h) {
    const fullCanvas = isFullCanvasPass(this, x, y, w, h);
    const result = Reflect.apply(previousFillRect, this, arguments);

    if (fullCanvas) {
      // One last small step darker than the previous pass.
      // Ground, platforms, items and player are drawn later and keep their pop.
      this.save();
      this.globalCompositeOperation = 'source-over';
      this.globalAlpha = 0.20;
      this.filter = 'none';
      Reflect.apply(previousDrawImage, this, [tonePixel, 0, 0, 1, 1, x, y, w, h]);
      this.restore();
    }

    return result;
  };

  proto.drawImage = function(image, ...args) {
    if (!isPlayerSprite(image)) {
      return Reflect.apply(previousDrawImage, this, [image, ...args]);
    }

    // Small final lift so Tiranon separates from the toned background naturally.
    this.save();
    const inherited = this.filter && this.filter !== 'none' ? `${this.filter} ` : '';
    this.filter = `${inherited}brightness(1.14) saturate(1.10) contrast(1.04)`;
    const result = Reflect.apply(previousDrawImage, this, [image, ...args]);
    this.restore();
    return result;
  };
})();
