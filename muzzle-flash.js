/* ============================================================
 *  MUZZLE-FLASH.JS — Dynamic PointLight flash on every shot
 *
 *  Patches Tracers.spawnTracer: each bullet spawns a brief
 *  orange PointLight (intensity 3.8, range 5u) at the fire
 *  origin that decays in 0.065s. Adds real-time lighting
 *  to walls/terrain/enemies on every shot. Max 3 concurrent.
 * ============================================================ */
var MuzzleFlash = (function () {
  'use strict';

  var MAX_LIGHTS  = 3;
  var DURATION    = 0.065;
  var INTENSITY   = 3.8;
  var RANGE       = 5;

  var _lights     = [];   /* { light, t } */
  var _scene      = null;
  var _init       = false;
  var _patched    = false;
  var _origTracer = null;
  var _lastTs     = 0;

  function _getScene() {
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch (e) {}
    }
    return _scene;
  }

  /* ── Flash a light at position ─────────── */
  function _flash(pos) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    try {
      /* Reuse oldest light slot if at cap */
      if (_lights.length >= MAX_LIGHTS) {
        var oldest = _lights.shift();
        scene.remove(oldest.light);
      }
      var light = new THREE.PointLight(0xff8822, INTENSITY, RANGE);
      light.position.copy(pos);
      scene.add(light);
      _lights.push({ light: light, t: DURATION });
    } catch (err) {}
  }

  /* ── Patch spawnTracer ──────────────────── */
  function _patch() {
    if (_patched) return;
    if (typeof Tracers === 'undefined' || !Tracers.spawnTracer) return;
    _origTracer = Tracers.spawnTracer;
    Tracers.spawnTracer = function (from, to, color, width) {
      if (_origTracer) _origTracer.call(Tracers, from, to, color, width);
      if (from) _flash(from);
    };
    _patched = true;
  }

  /* ── rAF tick ───────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _patch();
    var scene = _getScene();
    for (var i = _lights.length - 1; i >= 0; i--) {
      var l = _lights[i];
      l.t -= dt;
      l.light.intensity = Math.max(0, l.t / DURATION) * INTENSITY;
      if (l.t <= 0) {
        if (scene) scene.remove(l.light);
        _lights.splice(i, 1);
      }
    }
  }

  function init() {
    if (_init) return;
    _init = true;
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.MuzzleFlash = MuzzleFlash;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { MuzzleFlash.init(); });
} else {
  MuzzleFlash.init();
}
