(() => {
  'use strict';

  // Final readability pass: push scenery back a little and lift only Tiranon.
  // Loaded after theme.js + visibility.js so gameplay logic and artwork stay untouched.
  const proto = CanvasRenderingContext2D.prototype;
  const previousFillRect = proto.fillRect;
  const previousDrawImage = proto.drawImage;

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

  proto.fillRect = function(x, y, w, h) {
    const fullCanvas =
      x === 0 && y === 0 &&
      w >= this.canvas.clientWidth * 0.9 &&
      h >= this.canvas.clientHeight * 0.9;

    const result = Reflect.apply(previousFillRect, this, arguments);

    if (fullCanvas) {
      // Small neutral-dark veil: enough to separate the mint character,
      // but mild enough to keep the soft picture-book atmosphere.
      this.save();
      this.globalCompositeOperation = 'source-over';
      this.fillStyle = 'rgba(36, 46, 43, 0.075)';
      Reflect.apply(previousFillRect, this, [x, y, w, h]);
      this.restore();
    }

    return result;
  };

  proto.drawImage = function(image, ...args) {
    if (!isPlayerSprite(image)) {
      return Reflect.apply(previousDrawImage, this, [image, ...args]);
    }

    // Lift Tiranon slightly relative to the toned-down scenery.
    // Keep the boost small so mint, yellow and facial features remain natural.
    this.save();
    const previousFilter = this.filter;
    this.filter = 'brightness(1.09) saturate(1.07) contrast(1.025)';
    const result = Reflect.apply(previousDrawImage, this, [image, ...args]);
    this.filter = previousFilter;
    this.restore();
    return result;
  };
})();
