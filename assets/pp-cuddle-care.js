/* ===========================================================================
   Pups & Paws — Cuddle Care Box glue.

   Two jobs, both additive. Nothing here modifies the existing builder, the
   cart, or any bundle logic:

   1. PDP promo CTA — keeps ?variant= on the "Build My Cuddle Care Box" button
      pointed at whatever variant the shopper currently has selected.
   2. Builder preselection — reads ?variant= (priority) then ?product= and ticks
      the matching product by dispatching a real click on the existing choice
      button, so the count, slots, status text, line-item properties and the
      submit button all update through the builder's own code path.

   Loaded with defer AFTER assets/theme.js, so the builder has already
   initialised and drawn its state before any of this runs.
   =========================================================================== */
(function () {
  if (window.__ppCuddleCareInit) return;
  window.__ppCuddleCareInit = true;

  /* ---------------------------------------------------------------------
     1. PDP → builder CTA, kept in sync with the selected variant.
  --------------------------------------------------------------------- */
  function initCta(cta) {
    var base = cta.getAttribute('data-builder-url') || '/pages/build-your-own-box';
    var handle = cta.getAttribute('data-product-handle') || '';

    function readVariant() {
      var select = document.querySelector('[data-variant-select]');
      if (select && select.value) return select.value;
      var field = document.querySelector('.pp-pdp__form [name="id"]');
      if (field && field.value) return field.value;
      return cta.getAttribute('data-default-variant') || '';
    }

    function sync() {
      var id = readVariant();
      var url = base + (base.indexOf('?') > -1 ? '&' : '?');
      if (id) url += 'variant=' + encodeURIComponent(id) + '&';
      cta.href = url + 'product=' + encodeURIComponent(handle);
    }

    document.addEventListener('change', function (event) {
      var t = event.target;
      if (!t || !t.matches) return;
      if (t.matches('[data-variant-select]') || t.matches('.pp-pdp__form [name="id"]')) sync();
    });
    window.addEventListener('pageshow', sync);
    sync();
  }

  /* ---------------------------------------------------------------------
     2. Builder preselection.
        State is read from the DOM, which theme.js keeps authoritative via its
        draw() call, so this never duplicates or fights the builder's logic.
  --------------------------------------------------------------------- */
  function initBuilder(builder) {
    if (builder.getAttribute('data-preselect-enabled') === 'false') return;

    var params = new URLSearchParams(window.location.search);
    var wantedVariant = (params.get('variant') || '').trim();
    var wantedProduct = (params.get('product') || '').trim().toLowerCase();
    if (!wantedVariant && !wantedProduct) return;

    var choices = Array.prototype.slice.call(builder.querySelectorAll('[data-box-choice]'));
    var notice = builder.querySelector('[data-box-notice]');
    var required = Number(builder.getAttribute('data-required') || 0);

    function showNotice(text) {
      if (!notice || !text) return;
      notice.textContent = text;
      notice.hidden = false;
    }

    var match = null;

    /* Variant id wins, and any variant of the product counts — not just the
       first available one — so a shopper who switched variant still matches. */
    if (wantedVariant && /^\d+$/.test(wantedVariant)) {
      for (var i = 0; i < choices.length; i++) {
        var c = choices[i];
        if (c.getAttribute('data-variant-id') === wantedVariant) { match = c; break; }
        var all = (c.getAttribute('data-all-variant-ids') || '').split(',');
        for (var j = 0; j < all.length; j++) {
          if (all[j].trim() === wantedVariant) { match = c; break; }
        }
        if (match) break;
      }
    }

    /* Fallback: product handle. */
    if (!match && wantedProduct) {
      for (var k = 0; k < choices.length; k++) {
        if ((choices[k].getAttribute('data-product-handle') || '').toLowerCase() === wantedProduct) {
          match = choices[k];
          break;
        }
      }
    }

    /* Invalid id, deleted product, ineligible product or sold out: the builder
       still opens normally, with a quiet explanation. */
    if (!match || match.disabled) {
      showNotice(builder.getAttribute('data-ineligible-message') || '');
      return;
    }

    /* Duplicate protection. Checked against live DOM state rather than a stored
       flag, so refresh, back/forward and bfcache restores can never double-add. */
    var alreadySelected = match.classList.contains('is-selected') ||
                          match.getAttribute('aria-pressed') === 'true';
    var selectedCount = builder.querySelectorAll('[data-box-choice].is-selected').length;

    if (!alreadySelected && selectedCount < required) {
      match.click();
    }

    var template = builder.getAttribute('data-preselect-message') || '';
    showNotice(template.replace('[product]', match.getAttribute('data-product-title') || 'That product'));

    if (typeof match.scrollIntoView === 'function') {
      try { match.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
    }
  }

  function start() {
    document.querySelectorAll('[data-ccb-cta]').forEach(initCta);
    document.querySelectorAll('[data-build-box]').forEach(initBuilder);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
