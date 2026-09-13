(() => {
  'use strict';

  // Keep Tiranon readable against green scenery without changing the artwork itself.
  const proto = CanvasRenderingContext2D.prototype;
  const nativeDrawImage = proto.drawImage;

  const playerSprites = [
    '1218B0FC-C2A9-4661-8707-C27D900A8992.png',
    'BBCB72FB-8753-443F-8266-DE96E161B845.png',
    '611DD895-B471-4366-B1DC-231EF0F51CF8.png',
    'DE619F5B-547D-4A02-866D-6E072FD3FF44.png'
  ];

  function isPlayerSprite(image) {
    if (!image || typeof image.src !== 'string') return false;
    return playerSprites.some(name => image.src.endsWith(name));
  }

  proto.drawImage = function(image, ...args) {
    if (!isPlayerSprite(image)) {
      return Reflect.apply(nativeDrawImage, this, [image, ...args]);
    }

    // A darker, soft mint-gray shadow creates contrast against grass, trees and platforms.
    this.save();
    this.globalAlpha *= 0.82;
    this.shadowColor = 'rgba(38, 58, 54, 0.66)';
    this.shadowBlur = 8;
    this.shadowOffsetX = 1;
    this.shadowOffsetY = 2;
    Reflect.apply(nativeDrawImage, this, [image, ...args]);
    this.restore();

    // Keep only a tiny warm edge light so the sprite does not look outlined in white.
    this.save();
    this.globalAlpha *= 0.18;
    this.shadowColor = 'rgba(255, 248, 225, 0.48)';
    this.shadowBlur = 2;
    this.shadowOffsetX = 0;
    this.shadowOffsetY = 0;
    Reflect.apply(nativeDrawImage, this, [image, ...args]);
    this.restore();

    // Crisp original sprite on top.
    return Reflect.apply(nativeDrawImage, this, [image, ...args]);
  };
})();
