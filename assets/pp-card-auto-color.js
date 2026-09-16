/* ===========================================================================
   Auto-tint product card backgrounds.

   Every product card on the site shares snippets/product-card.liquid, and
   the pale background behind the packaging photo (.pp-card__media) was a
   small, fixed rotation of theme-setting colors (card_background_1-4),
   which is why most cards ended up landing on the same purple. This script
   samples the actual dominant hue of each product's own packaging photo
   (ignoring transparent, near-white, near-black and grey pixels — caps,
   labels, shadows) and tints the card background with a soft pastel of
   that hue instead, so a green box gets a pale green card, an orange box
   a pale peach card, etc.

   It samples via its own off-DOM probe image, so it does not wait on the
   on-page <img>'s native lazy-loading — the src is already present in the
   markup, so the color can be resolved and applied as soon as the card
   exists in the DOM, without depending on scroll position.

   Non-destructive: it only sets an inline background-color once a photo has
   actually been sampled. If a photo can't be sampled (blocked by CORS,
   fails to load, or has no clearly dominant color) the card simply keeps
   whatever background it already had from theme.css — nothing breaks.
   =========================================================================== */
(function () {
  var CACHE_KEY = 'ppCardAutoColorCache_v1';
  var memoryCache = {};
  var inFlight = {};

  try {
    var stored = sessionStorage.getItem(CACHE_KEY);
    if (stored) memoryCache = JSON.parse(stored) || {};
  } catch (e) {
    memoryCache = {};
  }

  function persistCache() {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache));
    } catch (e) {
      /* sessionStorage unavailable (private mode, etc.) — in-memory cache still works for this page view */
    }
  }

  function rgbToHueSatLight(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var l = (max + min) / 2;
    var d = max - min;
    if (d === 0) return { h: 0, s: 0, l: l };
    var s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    var h;
    if (max === r) h = ((g - b) / d) + (g < b ? 6 : 0);
    else if (max === g) h = ((b - r) / d) + 2;
    else h = ((r - g) / d) + 4;
    h *= 60;
    return { h: h, s: s, l: l };
  }

  function dominantHueFromImage(img) {
    var w = 48, h = 48;
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    var data = ctx.getImageData(0, 0, w, h).data; // throws if canvas is tainted

    var BIN_COUNT = 24; // 15 degrees per bin
    var bins = new Array(BIN_COUNT).fill(0);

    for (var i = 0; i < data.length; i += 4) {
      var a = data[i + 3];
      if (a < 200) continue; // transparent background around the packaging render

      var hsl = rgbToHueSatLight(data[i], data[i + 1], data[i + 2]);
      if (hsl.l > 0.9 || hsl.l < 0.1 || hsl.s < 0.15) continue; // near-white / near-black / grey — cap, text, shadow

      var bin = Math.floor(hsl.h / (360 / BIN_COUNT)) % BIN_COUNT;
      bins[bin] += hsl.s; // weight by saturation so vivid pixels outvote duller ones
    }

    var bestBin = -1, bestWeight = 0;
    for (var b = 0; b < BIN_COUNT; b++) {
      if (bins[b] > bestWeight) { bestWeight = bins[b]; bestBin = b; }
    }

    if (bestBin === -1) return null; // nothing sufficiently colorful found (e.g. all-white/grey packshot)

    return Math.round((bestBin + 0.5) * (360 / BIN_COUNT));
  }

  function pastelFromHue(hue) {
    return 'hsl(' + hue + ', 58%, 94%)';
  }

  function resolveColor(src, callback) {
    if (Object.prototype.hasOwnProperty.call(memoryCache, src)) {
      callback(memoryCache[src]);
      return;
    }
    if (inFlight[src]) {
      inFlight[src].push(callback);
      return;
    }
    inFlight[src] = [callback];

    function settle(color) {
      memoryCache[src] = color;
      persistCache();
      var callbacks = inFlight[src] || [];
      delete inFlight[src];
      for (var i = 0; i < callbacks.length; i++) callbacks[i](color);
    }

    var probe = new Image();
    probe.crossOrigin = 'anonymous';
    probe.onload = function () {
      var color = null;
      try {
        var hue = dominantHueFromImage(probe);
        if (hue !== null) color = pastelFromHue(hue);
      } catch (e) {
        color = null; // tainted canvas or other failure — leave existing background alone
      }
      settle(color);
    };
    probe.onerror = function () { settle(null); };
    probe.src = src;
  }

  function tintCard(media) {
    if (media.dataset.ppAutoColored) return; // already colored or in progress
    var img = media.querySelector('img');
    if (!img) return;
    var src = img.getAttribute('src');
    if (!src) return;

    media.dataset.ppAutoColored = 'pending';
    resolveColor(src, function (color) {
      if (color) {
        media.style.backgroundColor = color;
        media.dataset.ppAutoColored = '1';
      } else {
        delete media.dataset.ppAutoColored; // allow a retry later (e.g. src changes)
      }
    });
  }

  function scan(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var medias = scope.querySelectorAll('.pp-card__media');
    for (var i = 0; i < medias.length; i++) tintCard(medias[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { scan(document); });
  } else {
    scan(document);
  }

  // Theme editor re-renders a section without a full page load.
  document.addEventListener('shopify:section:load', function (evt) { scan(evt.target); });

  // Catches anything added later by theme/app JS (quick add, recommendations,
  // infinite scroll, search-as-you-type, etc.) without needing to know about
  // every place a card can appear.
  if ('MutationObserver' in window) {
    var observer = new MutationObserver(function (mutations) {
      for (var m = 0; m < mutations.length; m++) {
        var added = mutations[m].addedNodes;
        for (var n = 0; n < added.length; n++) {
          var node = added[n];
          if (node.nodeType !== 1) continue;
          if (node.matches && node.matches('.pp-card__media')) tintCard(node);
          if (node.querySelectorAll) scan(node);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
