/* OccupantKiller microsite — scroll parallax + hero tilt (additive, safe).
   Purely visual transforms; if this file fails to load, nothing is hidden. */
(function () {
  'use strict';
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var grid   = document.querySelector('.grid-bg');
  var scan   = document.querySelector('.scanlines');
  var badge  = document.querySelector('.hero-badge');
  var shot   = document.querySelector('.hero-shot');
  var hero   = document.querySelector('.hero');
  var hovering = false;

  // ── Scroll parallax: drift the background grid + lift the hero badge ──
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || window.pageYOffset || 0;
      if (grid)  grid.style.transform  = 'translate3d(0,' + (y * 0.12).toFixed(1) + 'px,0)';
      if (scan)  scan.style.transform  = 'translate3d(0,' + (y * 0.05).toFixed(1) + 'px,0)';
      if (badge) badge.style.transform = 'translate3d(0,' + (y * -0.05).toFixed(1) + 'px,0)';
      if (shot && !hovering) shot.style.transform = 'translate3d(0,' + (y * -0.04).toFixed(1) + 'px,0)';
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  // ── Mouse tilt on the hero gameplay frame (desktop only) ──
  if (hero && shot && !('ontouchstart' in window)) {
    hero.addEventListener('mousemove', function (e) {
      hovering = true;
      var r = hero.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - 0.5;
      var dy = (e.clientY - r.top) / r.height - 0.5;
      shot.style.transition = 'transform .18s ease-out';
      shot.style.transform =
        'perspective(1000px) rotateY(' + (dx * 5).toFixed(2) + 'deg) rotateX(' + (-dy * 4).toFixed(2) + 'deg)';
    });
    hero.addEventListener('mouseleave', function () {
      hovering = false;
      shot.style.transition = 'transform .35s ease';
      shot.style.transform = '';
    });
  }

  onScroll();
})();
