(() => {
  'use strict';

  // This file must load BEFORE theme.js.
  // theme.js captures drawImage at load time, so loading this first lets the
  // contrast pass affect the scenery images that theme.js draws internally.
  const proto = CanvasRenderingContext2D.prototype;
  const nativeDrawImage = proto.drawImage;

  const playerSprites = [
    '1218B0FC-C2A9-4661-8707-C27D900A8992.png',
    'BBCB72FB-8753-443F-8266-DE96E161B845.png',
    '611DD895-B471-4366-B1DC-231EF0F51CF8.png',
    'DE619F5B-547D-4A02-866D-6E072FD3FF44.png'
  ];

  const scenerySprites = [
    'A7BA4F1C-80DD-458C-9C82-CC34BACD83ED.png',
    '045F6B8F-3A48-43DE-9D49-E5C8EAC312DD.png',
    '210F6CF8-1C02-465D-B05F-A1299907CF78.png',
    '306923B0-212A-4007-95CC-3C3C9004229A.png',
    '413A55EB-0D5A-42A8-B2A9-B73004E49C9B.png',
    '6F3A7A09-617A-4F5B-90F7-A87EB9CC86FF.png',
    '89C0D311-B874-4C6C-94FE-FD1ECAE97BD3.png',
    'D801606A-CB2D-40C8-A994-0B7A55654E8D.png'
  ];

  function hasSprite(image, names) {
    if (!image || typeof image.src !== 'string') return false;
    return names.some(name => image.src.endsWith(name));
  }

  function drawWithFilter(ctx, image, args, filter) {
    ctx.save();
    const inherited = ctx.filter && ctx.filter !== 'none' ? `${ctx.filter} ` : '';
    ctx.filter = `${inherited}${filter}`;
    const result = Reflect.apply(nativeDrawImage, ctx, [image, ...args]);
    ctx.restore();
    return result;
  }

  proto.drawImage = function(image, ...args) {
    if (hasSprite(image, playerSprites)) {
      // Make the character clearly brighter and more vivid than the scenery.
      return drawWithFilter(
        this,
        image,
        args,
        'brightness(1.22) saturate(1.16) contrast(1.06)'
      );
    }

    if (hasSprite(image, scenerySprites)) {
      const ratio = image.naturalWidth && image.naturalHeight
        ? image.naturalWidth / image.naturalHeight
        : 1;

      // Vertical assets are the stage backgrounds: deliberately tone them down
      // enough that the change is obvious on a phone screen.
      // Ground/platform/decor are reduced more gently so hazards remain readable.
      const filter = ratio <= 0.85
        ? 'brightness(0.68) saturate(0.55) contrast(0.92)'
        : 'brightness(0.86) saturate(0.72) contrast(0.97)';

      return drawWithFilter(this, image, args, filter);
    }

    return Reflect.apply(nativeDrawImage, this, [image, ...args]);
  };
})();
