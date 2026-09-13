(() => {
  'use strict';

  // Keep Tiranon readable against the green scenery without changing the artwork.
  // This wraps only the four player sprites and leaves obstacles/items/backgrounds untouched.
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

    // Soft warm halo: separates the mint body from grass/trees while preserving the original art.
    this.save();
    this.globalAlpha *= 0.92;
    this.shadowColor = 'rgba(255, 249, 224, 0.95)';
    this.shadowBlur = 7;
    this.shadowOffsetX = 0;
    this.shadowOffsetY = 1;
    Reflect.apply(nativeDrawImage, this, [image, ...args]);
    this.restore();

    // Crisp original sprite on top so the illustration itself does not look washed out.
    return Reflect.apply(nativeDrawImage, this, [image, ...args]);
  };
})();
