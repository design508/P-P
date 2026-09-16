/* ===========================================================================
   Pups & Paws — Creator Club page behaviour.
   Additive, self-contained: touches only elements with data-ccc-* attributes
   or classes prefixed pp-ccc-, so it cannot affect any other page or section.
   =========================================================================== */
(function () {
  if (window.__ppCreatorClubInit) return;
  window.__ppCreatorClubInit = true;

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function motionAllowed() {
    return !prefersReducedMotion && !document.body.classList.contains('pp-motion-off');
  }

  /* ---------------------------------------------------------------------
     0. Tiny confetti burst helper — spawns a handful of .pp-confetti-piece
        spans near a given element, colours them from the palette passed
        in (or the CSS brand vars by default), animates them outward with
        the pp-confetti-pop keyframe declared in ccc-hero.liquid's inline
        styles (loaded on every Creator Club page view), then removes them.
        No-ops entirely when reduced motion / the "disable motion" theme
        setting is active, so it never fights those preferences.
  --------------------------------------------------------------------- */
  function spawnConfetti(originEl, colors) {
    if (!motionAllowed() || !originEl) return;
    var rect = originEl.getBoundingClientRect();
    var palette = colors && colors.length ? colors : ['#ff5a0a', '#47105d', '#ff2b78', '#61f46f', '#5b1a74'];
    var count = 12;
    for (var i = 0; i < count; i++) {
      var piece = document.createElement('span');
      piece.className = 'pp-confetti-piece';
      var angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      var distance = 40 + Math.random() * 46;
      var dx = Math.cos(angle) * distance;
      var dy = Math.sin(angle) * distance - 20;
      piece.style.left = (rect.left + rect.width / 2) + 'px';
      piece.style.top = (rect.top + rect.height / 2) + 'px';
      piece.style.background = palette[i % palette.length];
      piece.style.setProperty('--pp-confetti-dx', dx + 'px');
      piece.style.setProperty('--pp-confetti-dy', dy + 'px');
      piece.style.setProperty('--pp-confetti-rot', (Math.random() * 360 - 180) + 'deg');
      document.body.appendChild(piece);
      /* eslint-disable-next-line no-loop-func */
      (function (el) {
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 850);
      })(piece);
    }
  }

  /* ---------------------------------------------------------------------
     1. Smooth-scroll for hero / final-CTA buttons that target a section ID.
  --------------------------------------------------------------------- */
  function initSmoothScroll() {
    document.addEventListener('click', function (event) {
      var link = event.target.closest('[data-ccc-smooth-scroll]');
      if (!link) return;
      var href = link.getAttribute('href') || '';
      if (href.charAt(0) !== '#' || href.length < 2) return;
      var target = document.getElementById(href.slice(1));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      if (typeof target.focus === 'function') {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  }

  /* ---------------------------------------------------------------------
     1b. Hero "scroll for more" cue — nudges the viewport down by roughly
         one screen so visitors get a preview of the next section without
         having to find the right spot to scroll to themselves.
  --------------------------------------------------------------------- */
  function initScrollCue() {
    document.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-ccc-scroll-cue]');
      if (!btn) return;
      window.scrollBy({ top: window.innerHeight * 0.82, left: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      spawnConfetti(btn);
    });
  }

  /* ---------------------------------------------------------------------
     2. FAQ accordion — real buttons, aria-expanded/aria-controls, no page jump.
  --------------------------------------------------------------------- */
  function initFaq(list) {
    var triggers = Array.prototype.slice.call(list.querySelectorAll('[data-ccc-faq-trigger]'));
    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var expanded = trigger.getAttribute('aria-expanded') === 'true';
        var panelId = trigger.getAttribute('aria-controls');
        var panel = panelId ? document.getElementById(panelId) : null;
        if (!panel) return;
        trigger.setAttribute('aria-expanded', String(!expanded));
        if (expanded) {
          panel.style.maxHeight = panel.scrollHeight + 'px';
          requestAnimationFrame(function () { panel.style.maxHeight = '0px'; });
          panel.addEventListener('transitionend', function onEnd() {
            panel.hidden = true;
            panel.removeEventListener('transitionend', onEnd);
          });
        } else {
          panel.hidden = false;
          panel.style.maxHeight = '0px';
          requestAnimationFrame(function () {
            panel.style.maxHeight = panel.scrollHeight + 'px';
          });
          panel.addEventListener('transitionend', function onEnd() {
            panel.style.maxHeight = 'none';
            panel.removeEventListener('transitionend', onEnd);
          });
        }
      });
      trigger.addEventListener('keydown', function (event) {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        var idx = triggers.indexOf(trigger);
        var next = event.key === 'ArrowDown' ? triggers[idx + 1] : triggers[idx - 1];
        if (next) next.focus();
      });
    });
  }

  /* ---------------------------------------------------------------------
     3. Reels gallery — dot pagination, lazy media, single-autoplay.
  --------------------------------------------------------------------- */
  function initReels(section) {
    var track = section.querySelector('[data-ccc-reels-track]');
    var dotsWrap = section.querySelector('[data-ccc-reels-dots]');
    if (!track) return;
    var cards = Array.prototype.slice.call(track.children);

    /* Dot pagination, synced to scroll position. */
    if (dotsWrap && cards.length > 1) {
      cards.forEach(function (card, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'pp-ccc-reels__dot' + (i === 0 ? ' is-active' : '');
        dot.setAttribute('aria-label', 'Go to reel ' + (i + 1));
        dot.addEventListener('click', function () {
          card.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', inline: 'start', block: 'nearest' });
        });
        dotsWrap.appendChild(dot);
      });
      var dots = Array.prototype.slice.call(dotsWrap.children);
      var syncDots = function () {
        var trackRect = track.getBoundingClientRect();
        var closest = 0;
        var bestDist = Infinity;
        cards.forEach(function (card, i) {
          var d = Math.abs(card.getBoundingClientRect().left - trackRect.left);
          if (d < bestDist) { bestDist = d; closest = i; }
        });
        dots.forEach(function (d, i) { d.classList.toggle('is-active', i === closest); });
      };
      track.addEventListener('scroll', function () {
        window.requestAnimationFrame(syncDots);
      }, { passive: true });
    }

    /* Lazy-load embeds/videos only near the viewport; single-autoplay. */
    var activeMedia = null;
    function stopActive() {
      if (!activeMedia) return;
      if (activeMedia.tagName === 'VIDEO') activeMedia.pause();
      activeMedia = null;
    }

    function loadMedia(mediaEl) {
      if (mediaEl.dataset.ccLoaded) return;
      mediaEl.dataset.ccLoaded = 'true';
      var videoId = mediaEl.getAttribute('data-video-id');
      var igUrl = mediaEl.getAttribute('data-instagram-url');
      if (videoId && window.Shopify && Shopify.getVideoTag) {
        return; /* Shopify-hosted <video> is rendered server-side via video_tag when present. */
      }
      if (igUrl) {
        var wrap = document.createElement('blockquote');
        wrap.className = 'instagram-media';
        wrap.setAttribute('data-instgrm-permalink', igUrl);
        wrap.style.margin = '0';
        wrap.style.width = '100%';
        wrap.style.height = '100%';
        mediaEl.appendChild(wrap);
        if (!window.instgrm) {
          var s = document.createElement('script');
          s.async = true;
          s.src = 'https://www.instagram.com/embed.js';
          document.body.appendChild(s);
        } else {
          window.instgrm.Embeds.process();
        }
      }
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var mediaEl = entry.target;
          if (entry.isIntersecting) {
            loadMedia(mediaEl);
          } else if (mediaEl.dataset.ccLoaded && activeMedia && mediaEl.contains(activeMedia)) {
            stopActive();
          }
        });
      }, { root: null, rootMargin: '200px 0px', threshold: 0.01 });
      cards.forEach(function (card) {
        var mediaEl = card.querySelector('[data-ccc-reel-media]');
        if (mediaEl) io.observe(mediaEl);
      });
    }

    /* Play button: swap the cover image for a Shopify video, or reveal the embed. */
    track.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-ccc-reel-play]');
      if (!btn) return;
      var mediaEl = btn.closest('[data-ccc-reel-media]');
      if (!mediaEl) return;
      stopActive();
      var videoId = mediaEl.getAttribute('data-video-id');
      if (videoId) {
        var cover = mediaEl.querySelector('[data-ccc-reel-cover]');
        var video = document.createElement('video');
        video.controls = true;
        video.playsInline = true;
        video.autoplay = true;
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.src = mediaEl.getAttribute('data-video-src') || '';
        if (cover) cover.replaceWith(video);
        btn.hidden = true;
        activeMedia = video;
        video.addEventListener('ended', function () { activeMedia = null; });
      } else {
        loadMedia(mediaEl);
        btn.hidden = true;
      }
    });
  }

  /* ---------------------------------------------------------------------
     4. Reward tiers — a small confetti pop in that tier's own colour when
        a shopper hovers or focuses a tier card. Reads the card's own
        --pp-tier-border custom property (set inline per block) so the
        burst always matches the tier's actual colour with no extra
        configuration.
  --------------------------------------------------------------------- */
  function initTierConfetti(section) {
    var tiers = Array.prototype.slice.call(section.querySelectorAll('.pp-ccc-tier'));
    tiers.forEach(function (tier) {
      var fired = false;
      function fire() {
        if (fired) return;
        fired = true;
        var color = getComputedStyle(tier).getPropertyValue('--pp-tier-border').trim() || null;
        spawnConfetti(tier, color ? [color] : null);
        setTimeout(function () { fired = false; }, 1200);
      }
      tier.addEventListener('mouseenter', fire);
      tier.addEventListener('focusin', fire);
      tier.addEventListener('touchstart', fire, { passive: true });
    });
  }

  function start() {
    initSmoothScroll();
    initScrollCue();
    document.querySelectorAll('[data-ccc-faq]').forEach(initFaq);
    document.querySelectorAll('[data-ccc-reels]').forEach(initReels);
    document.querySelectorAll('.pp-ccc-tiers').forEach(initTierConfetti);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
