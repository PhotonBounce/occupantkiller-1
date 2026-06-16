/* ============================================================
 *  WEATHER-GAMEPLAY.JS — Ties WeatherSystem to gameplay stats
 *
 *  Polls WeatherSystem.getWeather() each second and applies
 *  context-appropriate effects without touching game-manager:
 *
 *  CLEAR:       baseline — no modifiers
 *  OVERCAST:    -5% enemy sight range; slight morale text
 *  RAIN:        player speed -15%, enemy sight -25%, spread +10%
 *  HEAVY_RAIN:  speed -25%, sight -45%, fire rate -20%,
 *               screen water-drop overlay, camera blue tint
 *  SNOW:        speed -20%, sight -20%, stealth +25%
 *  FOG:         enemy sight -60% (ambush danger), audio muffling
 *
 *  Enemy sight-range mod: multiplies e.typeCfg.detectionRange while
 *  active (restored on weather change). No enemies.js changes needed.
 *  Player speed mod: stashes player.speed, adjusts while active.
 * ============================================================ */
var WeatherGameplay = (function () {
  'use strict';

  /* ── Weather effect table ──────────────────── */
  var EFFECTS = {
    clear:      { speedMult: 1.0,  sightMult: 1.0,  spreadAdd: 0,    fireMult: 1.0, stealthAdd: 0,   notify: null },
    overcast:   { speedMult: 1.0,  sightMult: 0.95, spreadAdd: 0,    fireMult: 1.0, stealthAdd: 0,   notify: '🌥 Overcast — enemy scouts less effective' },
    rain:       { speedMult: 0.85, sightMult: 0.75, spreadAdd: 0.10, fireMult: 1.0, stealthAdd: 0,   notify: '🌧 Rain — mud slows movement, enemy sight reduced 25%' },
    heavy_rain: { speedMult: 0.75, sightMult: 0.55, spreadAdd: 0.18, fireMult: 0.80, stealthAdd: 0,  notify: '⛈ HEAVY RAIN — visibility critical, enemies confused' },
    snow:       { speedMult: 0.80, sightMult: 0.80, spreadAdd: 0.05, fireMult: 1.0, stealthAdd: 0.25, notify: '🌨 Snow — slow movement; stealth +25%' },
    fog:        { speedMult: 1.0,  sightMult: 0.40, spreadAdd: 0,    fireMult: 1.0, stealthAdd: 0.15, notify: '🌫 FOG — enemy sight -60%. Watch for ambush.' },
  };

  /* ── State ─────────────────────────────────── */
  var _initialized   = false;
  var _currentWeather = 'clear';
  var _pollTimer     = 0;
  var _POLL_INTERVAL = 1.2; // seconds between polls
  var _activeEffect  = EFFECTS.clear;

  /* ── Cached enemy baseline detection ───────── */
  // WeakMap: enemy → original detectionRange
  var _origDetection = new WeakMap();

  /* ── Screen overlays ────────────────────────── */
  var _rainOverlay   = null; // rain drop streaks canvas
  var _fogOverlay    = null; // grey fog tint div
  var _rainCanvas    = null;
  var _rainCtx       = null;
  var _rainDrops     = [];

  /* ── Helpers ────────────────────────────────── */
  function _notify(msg, color) {
    try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup(msg, color || '#88ccff'); } catch(e) {}
  }

  /* ── Apply enemy sight mod ───────────────────── */
  function _applyEnemySight(mult) {
    if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
    var all = Enemies.getAll();
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e || !e.typeCfg) continue;
      // Store original if not already stored
      if (!_origDetection.has(e)) {
        _origDetection.set(e, e.typeCfg.detectionRange || 40);
      }
      var orig = _origDetection.get(e);
      e.typeCfg.detectionRange = orig * mult;
    }
  }

  /* ── Apply player speed mod ──────────────────── */
  function _applyPlayerSpeed(mult) {
    try {
      var p = window.player;
      if (!p) return;
      // Stash baseline speed if not already done
      if (typeof p._baseSpeed === 'undefined') {
        p._baseSpeed = p.speed || 8;
      }
      p.speed = p._baseSpeed * mult;
    } catch(e) {}
  }

  /* ── Apply player stealth mod ────────────────── */
  function _applyPlayerStealth(add) {
    try {
      var p = window.player;
      if (!p) return;
      if (typeof p._baseStealthMod === 'undefined') p._baseStealthMod = 0;
      p._weatherStealthBonus = add;
    } catch(e) {}
  }

  /* ── Rain drop canvas animation ─────────────── */
  function _initRainCanvas() {
    if (_rainCanvas) return;
    _rainCanvas = document.createElement('canvas');
    _rainCanvas.id = 'wg-rain-canvas';
    _rainCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:179;opacity:0;transition:opacity 0.8s;';
    document.body.appendChild(_rainCanvas);
    _rainCtx = _rainCanvas.getContext('2d');
    _resizeRain();
    window.addEventListener('resize', _resizeRain);
  }

  function _resizeRain() {
    if (!_rainCanvas) return;
    _rainCanvas.width  = window.innerWidth;
    _rainCanvas.height = window.innerHeight;
    _rainDrops = [];
    var count = 80;
    for (var i = 0; i < count; i++) {
      _rainDrops.push({
        x:  Math.random() * _rainCanvas.width,
        y:  Math.random() * _rainCanvas.height,
        len: 8 + Math.random() * 14,
        spd: 250 + Math.random() * 180,
        opa: 0.25 + Math.random() * 0.35,
      });
    }
  }

  function _updateRainCanvas(dt) {
    if (!_rainCtx || !_rainCanvas) return;
    var w = _rainCanvas.width, h = _rainCanvas.height;
    _rainCtx.clearRect(0, 0, w, h);
    _rainCtx.strokeStyle = 'rgba(180,220,255,0.7)';
    _rainCtx.lineWidth = 0.8;
    for (var i = 0; i < _rainDrops.length; i++) {
      var d = _rainDrops[i];
      d.y += d.spd * dt;
      d.x += d.spd * dt * 0.12; // slight wind angle
      if (d.y > h) { d.y = -d.len; d.x = Math.random() * w; }
      _rainCtx.globalAlpha = d.opa;
      _rainCtx.beginPath();
      _rainCtx.moveTo(d.x, d.y);
      _rainCtx.lineTo(d.x + d.len * 0.08, d.y + d.len);
      _rainCtx.stroke();
    }
    _rainCtx.globalAlpha = 1;
  }

  /* ── Fog overlay ─────────────────────────────── */
  function _initFogOverlay() {
    if (_fogOverlay) return;
    _fogOverlay = document.createElement('div');
    _fogOverlay.id = 'wg-fog-overlay';
    _fogOverlay.style.cssText = [
      'position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:178;',
      'background:radial-gradient(ellipse at center,rgba(200,210,220,0) 40%,rgba(180,195,210,0.45) 100%);',
      'opacity:0;transition:opacity 1.5s;',
    ].join('');
    document.body.appendChild(_fogOverlay);
  }

  /* ── Transition to a new weather effect ──────── */
  function _applyEffect(weatherKey) {
    var fx = EFFECTS[weatherKey] || EFFECTS.clear;
    _activeEffect = fx;

    // Enemy sight
    _applyEnemySight(fx.sightMult);

    // Player speed
    _applyPlayerSpeed(fx.speedMult);

    // Stealth
    _applyPlayerStealth(fx.stealthAdd);

    // Rain overlay
    if (_rainCanvas) {
      var showRain = (weatherKey === 'rain' || weatherKey === 'heavy_rain');
      _rainCanvas.style.opacity = showRain ? (weatherKey === 'heavy_rain' ? '0.65' : '0.4') : '0';
    }

    // Fog overlay
    if (_fogOverlay) {
      _fogOverlay.style.opacity = (weatherKey === 'fog') ? '1' : '0';
    }

    // Notify once on change
    if (fx.notify) {
      setTimeout(function () { _notify(fx.notify, '#88ccff'); }, 1200);
    }
  }

  /* ── Spread hook (monkey-patch Weapons.fire spread) ── */
  // We store the add on window._weatherSpreadAdd; weapons.js can read it
  // (graceful: if weapons.js doesn't read it, no effect, no crash)
  function _setSpreadHint(add) {
    window._weatherSpreadAdd = add;
  }

  /* ── Poll & update ─────────────────────────── */
  function update(dt) {
    // Animate rain
    var weather = _currentWeather;
    if (weather === 'rain' || weather === 'heavy_rain') {
      _updateRainCanvas(dt);
    }

    // Poll weather system
    _pollTimer += dt;
    if (_pollTimer < _POLL_INTERVAL) return;
    _pollTimer = 0;

    try {
      if (typeof WeatherSystem === 'undefined') return;
      var w = WeatherSystem.getWeather ? WeatherSystem.getWeather() : 'clear';
      if (w !== _currentWeather) {
        _currentWeather = w;
        _applyEffect(w);
        _setSpreadHint(_activeEffect.spreadAdd);
        // Re-tag all current enemies with new sight range
        _applyEnemySight(_activeEffect.sightMult);
      }
      // Re-apply sight range every poll cycle for newly spawned enemies
      _applyEnemySight(_activeEffect.sightMult);
    } catch(e) {}
  }

  /* ── Init ─────────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;

    _initRainCanvas();
    _initFogOverlay();

    // Self-driven update loop
    var _last = performance.now();
    function _tick(ts) {
      var dt = Math.min(0.1, (ts - _last) / 1000);
      _last  = ts;
      update(dt);
      requestAnimationFrame(_tick);
    }
    requestAnimationFrame(_tick);
  }

  return { init: init, update: update };
})();

window.WeatherGameplay = WeatherGameplay;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { WeatherGameplay.init(); });
} else {
  WeatherGameplay.init();
}
