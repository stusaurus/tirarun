(() => {
  'use strict';

  // Improve Tiranon's readability without changing the artwork itself.
  // This layer also softens only the town background so the mint body stands out better.
  const proto = CanvasRenderingContext2D.prototype;
  const nativeDrawImage = proto.drawImage;
  const nativeFillRect = proto.fillRect;
  const nativeFill = proto.fill;

  const playerSprites = [
    '1218B0FC-C2A9-4661-8707-C27D900A8992.png',
    'BBCB72FB-8753-443F-8266-DE96E161B845.png',
    '611DD895-B471-4366-B1DC-231EF0F51CF8.png',
    'DE619F5B-547D-4A02-866D-6E072FD3FF44.png'
  ];

  const stageColors = new Map([
    ['#bce5b7', 0], ['#8fd5a7', 0], ['#6ab67d', 0],
    ['#c8d9d0', 1], ['#9ac6cf', 1], ['#70b683', 1],
    ['#efd0a2', 2], ['#d8a88a', 2], ['#79ad73', 2],
    ['#6e8191', 3], ['#5b7082', 3], ['#527b65', 3]
  ]);

  let stageIndex = 0;

  function isPlayerSprite(image) {
    if (!image || typeof image.src !== 'string') return false;
    return playerSprites.some(name => image.src.endsWith(name));
  }

  function updateStageFromStyle(ctx) {
    const style = typeof ctx.fillStyle === 'string' ? ctx.fillStyle.toLowerCase() : '';
    if (stageColors.has(style)) stageIndex = stageColors.get(style);
  }

  proto.drawImage = function(image, ...args) {
    if (!isPlayerSprite(image)) {
      return Reflect.apply(nativeDrawImage, this, [image, ...args]);
    }

    // Dark mint-gray shadow gives separation from grass and buildings.
    this.save();
    this.globalAlpha *= 0.58;
    this.shadowColor = 'rgba(35, 68, 61, 0.62)';
    this.shadowBlur = 5;
    this.shadowOffsetX = 1;
    this.shadowOffsetY = 2;
    Reflect.apply(nativeDrawImage, this, [image, ...args]);
    this.restore();

    // Keep just a very small warm edge light; weaker than the previous white halo.
    this.save();
    this.globalAlpha *= 0.28;
    this.shadowColor = 'rgba(255, 248, 220, 0.72)';
    this.shadowBlur = 2.5;
    this.shadowOffsetX = 0;
    this.shadowOffsetY = 0;
    Reflect.apply(nativeDrawImage, this, [image, ...args]);
    this.restore();

    // Crisp original sprite on top.
    return Reflect.apply(nativeDrawImage, this, [image, ...args]);
  };

  proto.fill = function(...args) {
    updateStageFromStyle(this);
    return Reflect.apply(nativeFill, this, args);
  };

  proto.fillRect = function(x, y, w, h) {
    updateStageFromStyle(this);

    const isFullCanvas =
      x === 0 && y === 0 &&
      w >= this.canvas.clientWidth * 0.9 &&
      h >= this.canvas.clientHeight * 0.9;

    if (isFullCanvas && stageIndex === 1) {
      this.save();
      const prevFilter = this.filter;
      this.filter = 'saturate(0.84) brightness(0.99)';
      const result = Reflect.apply(nativeFillRect, this, arguments);
      this.filter = prevFilter;
      this.restore();
      return result;
    }

    return Reflect.apply(nativeFillRect, this, arguments);
  };
})();
