/*
 * assets/pp-pdp-cuddle-relocate.js
 *
 * On desktop (>=991px), physically moves the Cuddle Care Box section
 * (sections/pdp-cuddle-care-box.liquid, identified by its .pp-ccb content)
 * so it becomes the last child of the PDP gallery column
 * ([data-pdp-gallery] in sections/main-product.liquid). That way it
 * renders directly underneath the product images/thumbnails, filling
 * whatever height that column has left, with the product info column
 * sitting beside it — instead of appearing as its own full-width section
 * further down the page.
 *
 * On mobile/tablet (<991px) the section is restored to its original
 * position in the document, untouched. The move re-evaluates whenever the
 * viewport crosses the 991px breakpoint (e.g. resizing a desktop window),
 * not just once on load.
 *
 * Purely a DOM move — sections/pdp-cuddle-care-box.liquid still renders
 * itself exactly the way Shopify normally does; this script never edits
 * its markup, only where its wrapper element lives in the page.
 * Loaded only by sections/main-product.liquid (product pages).
 */
(function () {
  function init() {
    var gallery = document.querySelector('[data-pdp-gallery]');
    var box = document.querySelector('.pp-ccb');
    if (!gallery || !box) return;

    var section = box.closest('[id^="shopify-section-"]');
    if (!section || section === gallery) return;

    var originalParent = section.parentNode;
    var originalNext = section.nextSibling;
    var mq = window.matchMedia('(min-width: 991px)');

    function place() {
      if (mq.matches) {
        if (section.parentNode !== gallery) {
          gallery.appendChild(section);
        }
      } else if (section.parentNode !== originalParent) {
        originalParent.insertBefore(section, originalNext);
      }
    }

    place();

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', place);
    } else if (typeof mq.addListener === 'function') {
      mq.addListener(place);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
