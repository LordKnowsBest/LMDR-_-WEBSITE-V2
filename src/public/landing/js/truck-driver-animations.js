/* =========================================
   TRUCK DRIVER PAGE — Animations Module
   Depends on: GSAP + ScrollTrigger (loaded in HTML head)
   ========================================= */
/* global gsap, ScrollTrigger */
var TruckDriverAnimations = (function () {
  'use strict';

  function init() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // Note: Wix iframes scroll at the parent level — ScrollTrigger never fires internally.
    // Animations use y/x transforms only (no opacity:0) so elements are always visible.

    gsap.from('.stat-item', {
      scrollTrigger: '.stats-grid',
      y: 20, duration: 0.6, stagger: 0.1, ease: 'power2.out'
    });

    gsap.utils.toArray('.gsap-fade-up').forEach(function (elem) {
      gsap.from(elem, {
        scrollTrigger: { trigger: elem, start: 'top 85%' },
        y: 30, duration: 0.7, ease: 'power2.out'
      });
    });

    // Step cards: fade+slide in without ScrollTrigger.
    // ScrollTrigger doesn't fire in Wix iframes (scroll is on parent frame),
    // and gsap.from() would pin cards at y:30 forever, clipping them below
    // the iframe boundary. Use fromTo so no initial y-offset is applied.
    gsap.fromTo('.step-card',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out', delay: 0.2 }
    );

    gsap.from('.benefit-card', {
      scrollTrigger: { trigger: '.benefit-card', start: 'top 85%' },
      x: -20, duration: 0.5, stagger: 0.12, ease: 'power2.out'
    });

    gsap.utils.toArray('.gsap-slide-right').forEach(function (elem) {
      gsap.from(elem, {
        scrollTrigger: { trigger: elem, start: 'top 80%' },
        x: -30, duration: 0.8, ease: 'power2.out'
      });
    });

    gsap.utils.toArray('.gsap-slide-left').forEach(function (elem) {
      gsap.from(elem, {
        scrollTrigger: { trigger: elem, start: 'top 80%' },
        x: 30, duration: 0.8, ease: 'power2.out'
      });
    });
  }

  return { init: init };
})();
