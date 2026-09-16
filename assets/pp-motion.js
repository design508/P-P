// pp-motion.js
// New, additive behaviours only — never touches assets/theme.js. Everything
// here respects prefers-reduced-motion and bails out completely if the
// merchant has turned off "Enable motion and reveal effects".
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motionOff = () => document.body.classList.contains('pp-motion-off');

  // ---------------------------------------------------------------------
  // 1) Subtle scroll-linked parallax for the ambient background shapes.
  //    Purely decorative: sets one CSS custom property, read by the
  //    keyframes/transform in snippets/pp-ambient-motion.liquid.
  // ---------------------------------------------------------------------
  if (!reduceMotion) {
    let ticking = false;
    const updateScrollShift = () => {
      ticking = false;
      if (motionOff()) return;
      const shift = Math.max(-60, Math.min(60, window.scrollY * -0.04));
      document.documentElement.style.setProperty('--pp-scroll-shift', `${shift}px`);
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(updateScrollShift); }
    }, { passive: true });
    updateScrollShift();
  }

  // ---------------------------------------------------------------------
  // 2) Sticky add-to-cart bar: show it once the real Add to Cart button has
  //    scrolled fully above the viewport, hide it again once that button is
  //    back on screen. Reuses the existing data-sticky-atc / data-sticky-add
  //    markup and click handler already wired up in assets/theme.js — this
  //    only adds the show/hide logic.
  //
  //    Uses a plain scroll-position check (rAF-throttled, same pattern as
  //    the parallax above) instead of IntersectionObserver, so behaviour
  //    doesn't depend on IO callbacks firing in every browser context.
  // ---------------------------------------------------------------------
  const stickyBars = [];
  document.querySelectorAll('[data-sticky-atc]').forEach((bar) => {
    const root = bar.closest('[data-product-root]') || document;
    const target = root.querySelector('.pp-pdp__form [type="submit"], .pp-main-product form [type="submit"]');
    if (target) {
      stickyBars.push({ bar, target });
    } else {
      // No matching Add to Cart button found — fail open rather than
      // leaving the bar permanently hidden.
      bar.classList.add('is-visible');
    }
  });

  if (stickyBars.length) {
    let stickyTicking = false;
    const updateStickyBars = () => {
      stickyTicking = false;
      stickyBars.forEach(({ bar, target }) => {
        const scrolledPast = target.getBoundingClientRect().bottom < 0;
        bar.classList.toggle('is-visible', scrolledPast);
      });
    };
    window.addEventListener('scroll', () => {
      if (!stickyTicking) { stickyTicking = true; requestAnimationFrame(updateStickyBars); }
    }, { passive: true });
    window.addEventListener('resize', updateStickyBars);
    updateStickyBars();
  }
})();
