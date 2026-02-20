/* =========================================
   TRUCK DRIVER PAGE — Animations Module
   Depends on: GSAP + ScrollTrigger (loaded in HTML head)
   ========================================= */
var TruckDriverAnimations = (function () {
  'use strict';

  function init() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    gsap.from('.gsap-stat-item', {
      scrollTrigger: '.stats-grid',
      y: 30, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power2.out'
    });

    gsap.utils.toArray('.gsap-fade-up').forEach(function (elem) {
      gsap.from(elem, {
        scrollTrigger: { trigger: elem, start: 'top 85%' },
        y: 40, opacity: 0, duration: 0.8, ease: 'power2.out'
      });
    });

    gsap.from('.step-card', {
      scrollTrigger: { trigger: '.step-card', start: 'top 80%' },
      y: 50, opacity: 0, duration: 0.6, stagger: 0.2, ease: 'back.out(1.2)'
    });

    gsap.from('.benefit-card', {
      scrollTrigger: { trigger: '.benefit-card', start: 'top 85%' },
      x: -30, opacity: 0, duration: 0.6, stagger: 0.15, ease: 'power2.out'
    });

    gsap.utils.toArray('.gsap-slide-right').forEach(function (elem) {
      gsap.from(elem, {
        scrollTrigger: { trigger: elem, start: 'top 80%' },
        x: -50, opacity: 0, duration: 1, ease: 'power2.out'
      });
    });

    gsap.utils.toArray('.gsap-slide-left').forEach(function (elem) {
      gsap.from(elem, {
        scrollTrigger: { trigger: elem, start: 'top 80%' },
        x: 50, opacity: 0, duration: 1, ease: 'power2.out'
      });
    });
  }

  return { init: init };
})();
