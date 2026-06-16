/* ============================================================
 *  BINOCULARS.JS — Field scope / zoom optics
 *
 *  Hold Z to zoom the THREE.js camera FOV from 75° → 22°.
 *  While zoomed:
 *    • Enemies within 120u get distance + type labels on screen
 *    • Enemies held in view for 1.5s get "MARKED" status
 *      (glowing outline + show on minimap for 20s after unmarking)
 *    • Vignette oval mask for binocular aesthetic
 *    • Mouse sensitivity is temporarily reduced (×0.3)
 *  Release Z → smooth FOV restore.
 * ============================================================ */
var Binoculars = (function () {
  'use strict';

  /* ── Config ─────────────────────────────── */
  var CFG = {
    FOV_NORMAL:   75,
    FOV_ZOOMED:   22,
    FOV_SPEED:    6,      // transition speed (fov units/frame at 60fps ~= degrees/0.016s)
    LABEL_DIST:   120,
    MARK_DWELL:   1.5,    // seconds an enemy must be in view to get marked
    MARK_DURATION:20,     // seconds mark persists
    SENS_MULT:    0.25,   // look-speed reduction while zoomed
  };

  /* ── State ──────────────────────────────── */
  var _initialized  = false;
  var _held         = false;
  var _fov          = CFG.FOV_NORMAL;
  var _labelsEl     = null;
  var _vigEl        = null;
  var _dwellMap     = new WeakMap();  // enemy → { dwell, marked }
  var _sensApplied  = false;
  var _origSens     = null;

  /* ── Helpers ────────────────────────────── */
  function _getCamera()  { try { return window.GameManager && GameManager.getCamera  ? GameManager.getCamera()  : null; } catch(e){return null;} }
  function _getPlayer()  { try { return window.player || null; } catch(e){return null;} }

  /* Project world pos → screen {x,y,behind} */
  function _project(worldPos) {
    var cam = _getCamera();
    if (!cam || typeof THREE === 'undefined') return null;
    var v = worldPos.clone().project(cam);
    return { x: (v.x+1)*0.5*window.innerWidth, y: (-v.y+1)*0.5*window.innerHeight, behind: v.z > 1 };
  }

  /* Is a screen point roughly in the central oval (binocular view)? */
  function _inOval(sx, sy) {
    var cx = window.innerWidth * 0.5;
    var cy = window.innerHeight * 0.5;
    var rx = window.innerWidth * 0.38;
    var ry = window.innerHeight * 0.44;
    var dx = (sx - cx) / rx;
    var dy = (sy - cy) / ry;
    return (dx*dx + dy*dy) <= 1;
  }

  /* ── Update labels ──────────────────────── */
  function _updateLabels(dt) {
    if (!_labelsEl) return;
    _labelsEl.innerHTML = '';

    var player = _getPlayer();
    if (!player || !player.position) return;

    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      var all = Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh || e.dead) continue;

        var dx = e.mesh.position.x - player.position.x;
        var dz = e.mesh.position.z - player.position.z;
        var d  = Math.sqrt(dx*dx + dz*dz);
        if (d > CFG.LABEL_DIST) continue;

        var sp = _project(e.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0)));
        if (!sp || sp.behind) continue;

        var inView = _inOval(sp.x, sp.y);

        /* Dwell tracking for mark */
        var state = _dwellMap.has(e) ? _dwellMap.get(e) : { dwell: 0, marked: false, markTimer: 0 };
        if (inView && _held) {
          state.dwell += dt;
          if (state.dwell >= CFG.MARK_DWELL && !state.marked) {
            state.marked    = true;
            state.markTimer = CFG.MARK_DURATION;
          }
        } else {
          state.dwell = 0;
        }
        if (state.markTimer > 0) state.markTimer -= dt;
        if (state.markTimer <= 0 && state.marked) state.marked = false;
        _dwellMap.set(e, state);

        /* Label div */
        var typeName = (e.typeCfg && e.typeCfg.name) ? e.typeCfg.name : 'ENEMY';
        var marked   = state.marked || state.markTimer > 0;
        var label    = document.createElement('div');
        label.className = 'bino-label' + (marked ? ' bino-marked' : '');
        label.style.left = sp.x + 'px';
        label.style.top  = sp.y + 'px';
        label.innerHTML  = (marked ? '◆ ' : '◇ ') + typeName + '<br>' + Math.round(d) + 'u';
        if (inView && _held) _labelsEl.appendChild(label);
      }
    } catch(err) {}
  }

  /* ── Apply/restore look sensitivity ─────── */
  function _setSens(zoom) {
    try {
      /* Try to find the player look speed variable and scale it */
      if (zoom && !_sensApplied) {
        if (typeof window._lookSensitivity !== 'undefined') {
          _origSens = window._lookSensitivity;
          window._lookSensitivity = _origSens * CFG.SENS_MULT;
        }
        _sensApplied = true;
      } else if (!zoom && _sensApplied) {
        if (_origSens !== null && typeof window._lookSensitivity !== 'undefined') {
          window._lookSensitivity = _origSens;
          _origSens = null;
        }
        _sensApplied = false;
      }
    } catch(e) {}
  }

  /* ── Update ──────────────────────────────── */
  function update(dt) {
    var cam = _getCamera();

    /* Smooth FOV transition */
    var target = _held ? CFG.FOV_ZOOMED : CFG.FOV_NORMAL;
    if (Math.abs(_fov - target) > 0.2) {
      _fov += (_fov < target ? 1 : -1) * Math.min(Math.abs(_fov - target), CFG.FOV_SPEED * 60 * dt);
      if (cam) cam.fov = _fov;
      if (cam) cam.updateProjectionMatrix();
    } else if (cam && cam.fov !== target) {
      _fov = target;
      cam.fov = _fov;
      cam.updateProjectionMatrix();
    }

    /* Vignette opacity */
    if (_vigEl) {
      var vigTarget = _held ? 1 : 0;
      var vigCurrent = parseFloat(_vigEl.style.opacity) || 0;
      var vigNew = vigCurrent + (vigTarget - vigCurrent) * Math.min(1, dt * 10);
      _vigEl.style.opacity = vigNew.toFixed(3);
    }

    /* Labels — only while zoomed */
    if (_held && _labelsEl) {
      _updateLabels(dt);
    } else if (_labelsEl && !_held) {
      _labelsEl.innerHTML = '';
    }
  }

  /* ── Init ──────────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;
    if (typeof THREE === 'undefined') return;

    /* CSS */
    var style = document.createElement('style');
    style.textContent = [
      '#bino-vig{transition:none;pointer-events:none;}',
      '#bino-labels{position:fixed;top:0;left:0;pointer-events:none;z-index:305;width:100%;height:100%;}',
      '.bino-label{position:absolute;transform:translate(-50%,-100%);',
        'font-family:monospace;font-size:10px;text-align:center;line-height:1.3;',
        'color:rgba(68,255,136,0.85);text-shadow:0 0 6px rgba(0,255,100,0.5);',
        'padding:2px 5px;background:rgba(0,0,0,0.4);border:1px solid rgba(68,255,136,0.25);',
        'border-radius:2px;pointer-events:none;white-space:nowrap;}',
      '.bino-label.bino-marked{color:#ffcc44;border-color:rgba(255,200,0,0.5);',
        'text-shadow:0 0 8px rgba(255,200,0,0.5);}',
    ].join('');
    document.head.appendChild(style);

    /* Binocular vignette — two overlapping circular gradients */
    _vigEl = document.createElement('div');
    _vigEl.id = 'bino-vig';
    _vigEl.style.cssText = [
      'position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:302;opacity:0;',
      'background:radial-gradient(ellipse 38% 44% at 36% 50%,transparent 70%,#000 100%),',
                 'radial-gradient(ellipse 38% 44% at 64% 50%,transparent 70%,#000 100%),',
                 'linear-gradient(to right,#000 20%,transparent 30%,transparent 70%,#000 80%);',
    ].join('');
    document.body.appendChild(_vigEl);

    /* Label container */
    _labelsEl = document.createElement('div');
    _labelsEl.id = 'bino-labels';
    document.body.appendChild(_labelsEl);

    /* [Z] hint */
    var hint = document.createElement('div');
    hint.style.cssText = [
      'position:fixed;top:46px;right:80px;font-family:monospace;font-size:9px;',
      'color:rgba(68,255,136,0.35);pointer-events:none;z-index:210;letter-spacing:0.1em;',
    ].join('');
    hint.textContent = '[Alt+Z] BINO';
    document.body.appendChild(hint);

    /* Key handlers */
    window.addEventListener('keydown', function (e) {
      if (e.code === 'KeyZ' && e.altKey && !e.ctrlKey && !_held) {
        _held = true;
        _setSens(true);
      }
    });
    window.addEventListener('keyup', function (e) {
      if (e.code === 'KeyZ' && e.altKey) {
        _held = false;
        _setSens(false);
      }
    });

    /* rAF loop */
    var _last = performance.now();
    function _tick(ts) {
      var dt = Math.min(0.1, (ts - _last) / 1000);
      _last  = ts;
      update(dt);
      requestAnimationFrame(_tick);
    }
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.Binoculars = Binoculars;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { Binoculars.init(); });
} else {
  Binoculars.init();
}
