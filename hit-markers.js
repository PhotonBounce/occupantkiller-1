// hit-markers.js — Hit marker visual feedback system
// Self-initializing IIFE, no game-manager.js changes required for setup.
// Displays crosshair-style markers at screen center on enemy hits.

window.HitMarkers = (function() {

  var _container = null;
  var _activeMarkers = [];
  var _cssInjected = false;

  // ── CSS injection ──────────────────────────────────────────────────────────
  function _injectCSS() {
    if (_cssInjected) return;
    _cssInjected = true;

    var style = document.createElement('style');
    style.textContent = [
      /* Container */
      '#hitMarkerContainer {',
      '  position: fixed;',
      '  top: 0; left: 0;',
      '  width: 100%; height: 100%;',
      '  pointer-events: none;',
      '  z-index: 600;',
      '  overflow: hidden;',
      '}',

      /* Base hit marker div — centred on screen */
      '.hit-marker {',
      '  position: absolute;',
      '  width: 20px; height: 20px;',
      '  left: 50%; top: 50%;',
      '  transform: translate(-50%, -50%);',
      '}',

      /* Four lines via child divs */
      '.hit-marker-line {',
      '  position: absolute;',
      '  background: white;',
      '}',

      /* Horizontal lines */
      '.hit-marker-line.left  { width: 6px; height: 2px; top: 50%; left:  0px; transform: translateY(-50%); }',
      '.hit-marker-line.right { width: 6px; height: 2px; top: 50%; right: 0px; transform: translateY(-50%); }',

      /* Vertical lines */
      '.hit-marker-line.top    { width: 2px; height: 6px; left: 50%; top:    0px; transform: translateX(-50%); }',
      '.hit-marker-line.bottom { width: 2px; height: 6px; left: 50%; bottom: 0px; transform: translateX(-50%); }',

      /* Headshot — gold, slightly larger marker */
      '.hit-marker-headshot .hit-marker-line { background: #ffd700; }',
      '.hit-marker-headshot { width: 26px; height: 26px; }',

      /* Headshot text label */
      '.hit-marker-headshot-text {',
      '  position: absolute;',
      '  left: 50%; top: calc(50% - 22px);',
      '  transform: translateX(-50%);',
      '  color: #ffd700;',
      '  font-family: Arial, sans-serif;',
      '  font-size: 11px;',
      '  font-weight: bold;',
      '  letter-spacing: 2px;',
      '  white-space: nowrap;',
      '  text-shadow: 0 0 6px #ffd700;',
      '}',

      /* Kill — red lines */
      '.hit-marker-kill .hit-marker-line { background: #ff2200; }',

      /* Kill expanding ring */
      '.hit-marker-kill-ring {',
      '  position: absolute;',
      '  left: 50%; top: 50%;',
      '  transform: translate(-50%, -50%);',
      '  border: 2px solid #ff2200;',
      '  border-radius: 50%;',
      '  box-shadow: 0 0 8px #ff2200;',
      '}',

      /* Screen-edge red flash overlay for kills */
      '.hit-marker-kill-flash {',
      '  position: fixed;',
      '  top: 0; left: 0;',
      '  width: 100%; height: 100%;',
      '  background: rgba(200, 0, 0, 0.15);',
      '  pointer-events: none;',
      '}'
    ].join('\n');

    document.head.appendChild(style);
  }

  // ── Container setup ─────────────────────────────────────────────────────────
  function _ensureContainer() {
    if (_container) return;
    _container = document.getElementById('hitMarkerContainer');
    if (!_container) {
      _container = document.createElement('div');
      _container.id = 'hitMarkerContainer';
      document.body.appendChild(_container);
    }
  }

  // ── Internal: build the 4-line cross element ─────────────────────────────
  function _buildCross(extraClass) {
    var marker = document.createElement('div');
    marker.className = 'hit-marker' + (extraClass ? ' ' + extraClass : '');

    var dirs = ['left', 'right', 'top', 'bottom'];
    for (var i = 0; i < dirs.length; i++) {
      var line = document.createElement('div');
      line.className = 'hit-marker-line ' + dirs[i];
      marker.appendChild(line);
    }
    return marker;
  }

  // ── Animate element from opacity 1 → 0, then remove ─────────────────────
  function _fadeAndRemove(el, durationMs) {
    el.style.opacity = '1';
    el.style.transition = 'opacity ' + (durationMs / 1000).toFixed(2) + 's linear';
    // Force reflow so transition triggers
    void el.offsetWidth;
    el.style.opacity = '0';

    var record = { el: el, removeAt: Date.now() + durationMs };
    _activeMarkers.push(record);

    // Fallback hard-remove via timeout
    setTimeout(function() {
      _removeEl(el);
    }, durationMs + 50);
  }

  function _removeEl(el) {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
    // Also purge from _activeMarkers
    for (var i = _activeMarkers.length - 1; i >= 0; i--) {
      if (_activeMarkers[i].el === el) {
        _activeMarkers.splice(i, 1);
        break;
      }
    }
  }

  // ── Public: flash(isHeadshot, isKill) ────────────────────────────────────
  function flash(isHeadshot, isKill) {
    _ensureContainer();

    if (isKill) {
      _doKill();
    } else if (isHeadshot) {
      _doHeadshot();
    } else {
      _doNormal();
    }
  }

  // Normal hit — white lines, 0.2 s fade
  function _doNormal() {
    var marker = _buildCross();
    _container.appendChild(marker);
    _fadeAndRemove(marker, 200);
  }

  // Headshot — gold lines, HEADSHOT text, 0.35 s fade
  function _doHeadshot() {
    var wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.left = '50%';
    wrapper.style.top = '50%';
    wrapper.style.transform = 'translate(-50%, -50%)';
    wrapper.style.pointerEvents = 'none';

    var marker = _buildCross('hit-marker-headshot');
    wrapper.appendChild(marker);

    var text = document.createElement('div');
    text.className = 'hit-marker-headshot-text';
    text.textContent = 'HEADSHOT';
    wrapper.appendChild(text);

    _container.appendChild(wrapper);
    _fadeAndRemove(wrapper, 350);
  }

  // Kill — red lines + expanding ring + screen edge flash
  function _doKill() {
    var wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.left = '50%';
    wrapper.style.top = '50%';
    wrapper.style.transform = 'translate(-50%, -50%)';
    wrapper.style.pointerEvents = 'none';

    var marker = _buildCross('hit-marker-kill');
    wrapper.appendChild(marker);

    // Ring element — starts at 0×0 and expands to 60×60 over 0.4 s
    var ring = document.createElement('div');
    ring.className = 'hit-marker-kill-ring';
    ring.style.width = '0px';
    ring.style.height = '0px';
    ring.style.opacity = '1';
    wrapper.appendChild(ring);
    _container.appendChild(wrapper);

    // Trigger ring expansion on next paint
    requestAnimationFrame(function() {
      ring.style.transition = 'width 0.4s ease-out, height 0.4s ease-out, opacity 0.4s ease-out';
      ring.style.width = '60px';
      ring.style.height = '60px';
      ring.style.opacity = '0';
    });

    _fadeAndRemove(wrapper, 400);

    // Brief full-screen red edge flash
    var flash = document.createElement('div');
    flash.className = 'hit-marker-kill-flash';
    flash.style.opacity = '1';
    _container.appendChild(flash);
    _fadeAndRemove(flash, 100);
  }

  // ── Public shortcuts ──────────────────────────────────────────────────────
  function flashHeadshot() {
    flash(true, false);
  }

  function flashKill() {
    flash(false, true);
  }

  // ── Public: update(delta) — clean expired markers ────────────────────────
  function update(delta) {
    var now = Date.now();
    for (var i = _activeMarkers.length - 1; i >= 0; i--) {
      if (now >= _activeMarkers[i].removeAt) {
        _removeEl(_activeMarkers[i].el);
      }
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    _injectCSS();
    _ensureContainer();
  }

  // ── Global hook so game-manager.js can call without direct import ─────────
  window._onHitFlash = function(isHeadshot, isKill) {
    if (window.HitMarkers) window.HitMarkers.flash(isHeadshot, isKill);
  };

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init: init, flash: flash, flashHeadshot: flashHeadshot, flashKill: flashKill, update: update };

})();
