/* ============================================================
 *  LEAN-SYSTEM.JS — Corner peek / lean mechanic
 *  Keys: [ (BracketLeft) = lean left, ] (BracketRight) = lean right
 *  Exports: window.LeanSystem  { init, update, reset }
 *  Globals written:
 *    window._leanOffset        -1 (left) | 0 (center) | 1 (right)
 *    window._leanAccuracyPenalty  0.15 when fully leaned, else 0
 * ============================================================ */
window.LeanSystem = (function () {
  'use strict';

  /* ── Config ──────────────────────────────────────────────── */
  var CFG = {
    LEAN_OFFSET_UNITS: 0.6,
    LEAN_TILT_RAD:    0.12,
    LERP_SPEED:       8,
    AUDIO_VOL:        0.1,
    ACCURACY_PENALTY: 0.15
  };

  /* ── State ───────────────────────────────────────────────── */
  var _keys        = {};
  var _leanTarget  = 0;
  var _leanCurrent = 0;
  var _wasLeaning  = false;
  var _audioCtx    = null;
  var _canvas      = null;
  var _hudEl       = null;
  var _inited      = false;

  /* ── Helpers ─────────────────────────────────────────────── */
  function _lerp(a, b, t) { return a + (b - a) * t; }
  function _clamp01(v)    { return v < 0 ? 0 : (v > 1 ? 1 : v); }

  /* ── Audio: clothing rustle noise burst ──────────────────── */
  function _playRustle() {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (_audioCtx.state === 'suspended') { _audioCtx.resume(); }
      var bufSize = Math.floor(_audioCtx.sampleRate * 0.08);
      var buffer  = _audioCtx.createBuffer(1, bufSize, _audioCtx.sampleRate);
      var data    = buffer.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize) * 0.5;
      }
      var src  = _audioCtx.createBufferSource();
      src.buffer = buffer;
      var gain = _audioCtx.createGain();
      gain.gain.setValueAtTime(CFG.AUDIO_VOL, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.08);
      src.connect(gain);
      gain.connect(_audioCtx.destination);
      src.start();
    } catch (e) { /* fail silently */ }
  }

  /* ── HUD: tilt arrow DOM element ────────────────────────── */
  function _ensureHud() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'lean-system-arrow';
    _hudEl.style.cssText = 'position:fixed;bottom:110px;left:14px;font-size:22px;color:#00ccff;font-family:monospace;z-index:202;pointer-events:none;display:none;text-shadow:0 0 8px rgba(0,200,255,0.7);transition:opacity 0.15s';
    document.body.appendChild(_hudEl);
  }

  function _updateHud(dir) {
    if (!_hudEl) _ensureHud();
    if (!_hudEl) return;
    if (dir === 0) {
      _hudEl.style.display = 'none';
    } else {
      _hudEl.style.display = 'block';
      _hudEl.textContent = dir < 0 ? '◄' : '►';
    }
  }

  /* ── Canvas chromatic aberration CSS filter ──────────────── */
  function _findCanvas() {
    if (_canvas) return _canvas;
    var gc = document.getElementById('game-container');
    if (gc) { var c = gc.querySelector('canvas'); if (c) { _canvas = c; return c; } }
    var all = document.getElementsByTagName('canvas');
    if (all && all.length) { _canvas = all[0]; return _canvas; }
    return null;
  }

  function _setCanvasFilter(dir) {
    var cv = _findCanvas();
    if (!cv) return;
    cv.style.filter = (Math.abs(_leanCurrent) > 0.85 && dir !== 0) ? 'hue-rotate(2deg)' : '';
  }

  /* ── Key listeners ───────────────────────────────────────── */
  function _onKeyDown(e) { _keys[e.code] = true; }
  function _onKeyUp(e)   { _keys[e.code] = false; }

  /* ── Public API ──────────────────────────────────────────── */
  function init() {
    if (_inited) return;
    _inited = true;
    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keyup',   _onKeyUp,   false);
    window._leanOffset          = 0;
    window._leanAccuracyPenalty = 0;
    _ensureHud();
  }

  function update(dt) {
    if (!_inited) return;

    var blocked   = !!(window._sprinting || window._sliding);
    var wantLeft  = !!_keys['BracketLeft'];
    var wantRight = !!_keys['BracketRight'];

    if (blocked)              { _leanTarget = 0;  }
    else if (wantLeft && !wantRight)  { _leanTarget = -1; }
    else if (wantRight && !wantLeft)  { _leanTarget = 1;  }
    else                      { _leanTarget = 0;  }

    var nowLeaning = (_leanTarget !== 0);
    if (nowLeaning && !_wasLeaning) { _playRustle(); }
    _wasLeaning = nowLeaning;

    var lerpT    = _clamp01(CFG.LERP_SPEED * dt);
    _leanCurrent = _lerp(_leanCurrent, _leanTarget, lerpT);

    window._leanOffset          = _leanTarget;
    window._leanAccuracyPenalty = (Math.abs(_leanCurrent) > 0.1) ? CFG.ACCURACY_PENALTY : 0;

    var cam = _getCamera();
    if (cam) {
      var sideOffset = _leanCurrent * CFG.LEAN_OFFSET_UNITS;
      var cosY = Math.cos(cam.rotation.y);
      var sinY = Math.sin(cam.rotation.y);
      if (cam._leanBaseX === undefined) { cam._leanBaseX = cam.position.x; }
      if (cam._leanBaseZ === undefined) { cam._leanBaseZ = cam.position.z; }
      cam.position.x = cam._leanBaseX + sideOffset * cosY;
      cam.position.z = cam._leanBaseZ - sideOffset * sinY;
      cam.rotation.z = -_leanCurrent * CFG.LEAN_TILT_RAD;
    }

    _updateHud(_leanTarget);
    _setCanvasFilter(_leanTarget);
  }

  function reset() {
    _leanTarget  = 0;
    _leanCurrent = 0;
    _wasLeaning  = false;
    _keys        = {};
    window._leanOffset          = 0;
    window._leanAccuracyPenalty = 0;
    var cam = _getCamera();
    if (cam) {
      cam.rotation.z = 0;
      if (cam._leanBaseX !== undefined) { cam.position.x = cam._leanBaseX; }
      if (cam._leanBaseZ !== undefined) { cam.position.z = cam._leanBaseZ; }
      delete cam._leanBaseX;
      delete cam._leanBaseZ;
    }
    _updateHud(0);
    var cv = _findCanvas();
    if (cv) { cv.style.filter = ''; }
  }

  /* ── Camera accessor ─────────────────────────────────────── */
  function _getCamera() {
    if (window.GameManager && typeof GameManager.getCamera === 'function') {
      return GameManager.getCamera();
    }
    return window._camera || null;
  }

  return { init: init, update: update, reset: reset };
})();
