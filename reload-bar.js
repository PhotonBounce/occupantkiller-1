/* ============================================================
 *  RELOAD-BAR.JS — Circular reload progress indicator (passive)
 *
 *  When the player's clip hits 0 (empty magazine), a circular arc
 *  appears below the crosshair and sweeps around based on an
 *  estimated reload duration (weapon-class aware).
 *
 *  When the clip refills (reload complete), the arc turns green
 *  and shows a brief "READY" text pulse before fading.
 *
 *  Estimated reload durations (seconds):
 *    Sniper → 3.2s    Shotgun → 3.0s    Default → 2.0s
 *
 *  No keybind — completely passive.
 *  z-index 452 (above hit-marker 451).
 * ============================================================ */
var ReloadBar = (function () {
  'use strict';

  var RELOAD_EST = {
    SNIPER:  3.2,
    SHOTGUN: 3.0,
    DEFAULT: 2.0,
  };

  var RING_R   = 30;   /* px radius of the arc */
  var RING_W   = 3.5;
  var FADE_OUT = 0.35; /* seconds for the READY flash before hide */

  var _canvas    = null;
  var _ctx       = null;
  var _init      = false;
  var _frameN    = 0;
  var _lastTs    = 0;

  var _state     = 'idle';   /* idle | reloading | ready */
  var _reloadT   = 0;        /* elapsed since reload start */
  var _reloadDur = 2.0;
  var _readyT    = 0;        /* countdown for READY flash */
  var _prevClip  = null;

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = [
      'position:fixed;top:0;left:0;',
      'width:100%;height:100%;',
      'pointer-events:none;z-index:452;',
    ].join('');
    document.body.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');
    _resize();
    window.addEventListener('resize', _resize);
  }

  function _resize() {
    if (!_canvas) return;
    _canvas.width  = window.innerWidth;
    _canvas.height = window.innerHeight;
  }

  function _getReloadDur() {
    try {
      if (typeof Weapons !== 'undefined' && Weapons.getCurrentType) {
        var t = (Weapons.getCurrentType() || '').toUpperCase();
        if (t.indexOf('SNIPER') >= 0)  return RELOAD_EST.SNIPER;
        if (t.indexOf('SHOTGUN') >= 0) return RELOAD_EST.SHOTGUN;
      }
    } catch (e) {}
    return RELOAD_EST.DEFAULT;
  }

  function _draw(dt) {
    if (!_ctx || _state === 'idle') return;

    var W  = _canvas.width;
    var H  = _canvas.height;
    var CX = W / 2;
    var CY = H / 2 + 54;   /* below crosshair */
    var ctx = _ctx;

    ctx.clearRect(0, 0, W, H);

    if (_state === 'reloading') {
      var prog = Math.min(1, _reloadT / _reloadDur);

      /* Background ring */
      ctx.beginPath();
      ctx.arc(CX, CY, RING_R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth   = RING_W;
      ctx.stroke();

      /* Progress arc */
      var start = -Math.PI / 2;
      var end   = start + prog * Math.PI * 2;
      var col   = prog > 0.75
        ? 'rgba(80, 255, 140, 0.85)'
        : 'rgba(255, 200, 50, 0.85)';
      ctx.beginPath();
      ctx.arc(CX, CY, RING_R, start, end);
      ctx.strokeStyle = col;
      ctx.lineWidth   = RING_W;
      ctx.lineCap     = 'round';
      ctx.shadowColor = col;
      ctx.shadowBlur  = 6;
      ctx.stroke();
      ctx.shadowBlur  = 0;

      /* RELOADING label */
      ctx.fillStyle   = 'rgba(200,210,200,0.60)';
      ctx.font        = '8px "Courier New"';
      ctx.textAlign   = 'center';
      ctx.fillText('RELOADING', CX, CY + RING_R + 12);

    } else if (_state === 'ready') {
      /* READY flash — alpha fades out */
      var alpha = _readyT / FADE_OUT;

      ctx.beginPath();
      ctx.arc(CX, CY, RING_R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(80, 255, 140, ' + (alpha * 0.85).toFixed(2) + ')';
      ctx.lineWidth   = RING_W;
      ctx.shadowColor = 'rgba(80, 255, 140, 0.5)';
      ctx.shadowBlur  = 10;
      ctx.stroke();
      ctx.shadowBlur  = 0;

      ctx.fillStyle = 'rgba(80, 255, 140, ' + alpha.toFixed(2) + ')';
      ctx.font = 'bold 9px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText('READY', CX, CY + 3);
    }
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

    /* Weapon state scan (every 3 frames) */
    if (_frameN % 3 === 0) {
      try {
        if (typeof Weapons !== 'undefined' && Weapons.getState && Weapons.getCurrent) {
          var st  = Weapons.getState();
          var cur = Weapons.getCurrent();
          var isMelee = (typeof Weapons.getCurrentType === 'function'
            && (Weapons.getCurrentType() || '').toUpperCase().indexOf('MELEE') >= 0);

          if (!isMelee && st && cur) {
            var clip = st.clip;

            if (_prevClip !== null) {
              /* Clip went empty → start reload */
              if (clip === 0 && _prevClip > 0 && _state === 'idle') {
                _state     = 'reloading';
                _reloadT   = 0;
                _reloadDur = _getReloadDur();
              }
              /* Clip refilled → reload complete */
              if (_state === 'reloading' && clip > 0 && _prevClip === 0) {
                _state  = 'ready';
                _readyT = FADE_OUT;
              }
            }
            _prevClip = clip;
          } else if (isMelee) {
            /* Melee — clear any lingering state */
            if (_state !== 'idle') { _state = 'idle'; _ctx.clearRect(0,0,_canvas.width,_canvas.height); }
          }
        }
      } catch (e) {}
    }

    /* Progress timers */
    if (_state === 'reloading') {
      _reloadT += dt;
      if (_reloadT >= _reloadDur * 1.5) {
        /* Safety: if clip never refilled, stop after 1.5× estimate */
        _state = 'idle';
        _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
        return;
      }
    } else if (_state === 'ready') {
      _readyT -= dt;
      if (_readyT <= 0) {
        _state = 'idle';
        _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
        return;
      }
    }

    _draw(dt);
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildCanvas();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.ReloadBar = ReloadBar;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ReloadBar.init(); });
} else {
  ReloadBar.init();
}