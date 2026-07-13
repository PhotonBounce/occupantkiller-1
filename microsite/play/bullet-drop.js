/**
 * bullet-drop.js — Bullet Drop Physics Module
 * Ukraine-conflict FPS (Three.js browser game)
 *
 * Applies realistic ballistic drop and wind drift to shots.
 * Intercepts window._onBulletFired hook (or polls window._lastShotData).
 * Renders a small ballistic arc indicator in the sniper scope overlay.
 * Shows a "↓ DROP" HUD element near the crosshair while ADS.
 *
 * IIFE pattern, all var (never let/const).
 * Exports: window.BulletDrop  { init, update, reset }
 *          window._getBulletDrop(weaponType, range) → { x, y }
 *
 * Globals read (optional):
 *   window._windX         — lateral wind speed m/s (default 0)
 *   window._windZ         — longitudinal wind speed m/s (default 0)
 *   window._sniperScoped  — true when sniper scope is active
 *   window._lastShotData  — { origin, direction, weaponType } set by game
 *   window._onBulletFired — hook called by game on each shot
 *   window._adsRange      — current ADS target range in metres (optional)
 */
window.BulletDrop = (function () {
  'use strict';

  /* ── Per-weapon muzzle velocities (m/s) ──────────────────────────── */
  var MUZZLE_VELOCITY = {
    SNIPER:   900,
    AMR:      900,
    SVD:      900,
    BARRETTM82: 900,
    AXMC:     900,
    PSG1:     900,
    RIFLE:    850,
    AK:       850,
    M4:       850,
    AR:       850,
    SMG:      400,
    PISTOL:   370,
    SHOTGUN:  280,
    DEFAULT:  800
  };

  /* Gravitational constant (m/s²) */
  var GRAVITY = 9.81;

  /* Wind drift coefficient — range * wind * this = x-offset metres */
  var WIND_DRIFT_K = 0.003;

  /* ADS range when none provided (metres) */
  var DEFAULT_ADS_RANGE = 100;

  /* ── Module state ──────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _inited   = false;

  /* HUD elements */
  var _dropHud     = null;   /* small div near crosshair */
  var _arcCanvas   = null;   /* canvas drawn inside sniper scope overlay */
  var _arcCtx      = null;

  /* Last processed shot */
  var _lastShotWeaponType = 'DEFAULT';

  /* ── Utility: resolve muzzle velocity for a given weapon type/id ──── */
  function _getMuzzleVelocity(weaponType) {
    if (!weaponType) return MUZZLE_VELOCITY.DEFAULT;
    var key = String(weaponType).toUpperCase();
    if (MUZZLE_VELOCITY[key] !== undefined) return MUZZLE_VELOCITY[key];
    /* substring matching */
    if (key.indexOf('SNIPER') !== -1 || key.indexOf('SVD') !== -1 ||
        key.indexOf('BARRETT') !== -1 || key.indexOf('AXMC') !== -1 ||
        key.indexOf('PSG') !== -1 || key.indexOf('AMR') !== -1) {
      return MUZZLE_VELOCITY.SNIPER;
    }
    if (key.indexOf('RIFLE') !== -1 || key.indexOf('AK') !== -1 ||
        key.indexOf('M4') !== -1 || key.indexOf('AR') !== -1 ||
        key.indexOf('LMG') !== -1 || key.indexOf('DMR') !== -1) {
      return MUZZLE_VELOCITY.RIFLE;
    }
    if (key.indexOf('SMG') !== -1 || key.indexOf('MP') !== -1 ||
        key.indexOf('UZI') !== -1 || key.indexOf('PP') !== -1) {
      return MUZZLE_VELOCITY.SMG;
    }
    if (key.indexOf('PISTOL') !== -1 || key.indexOf('GLOCK') !== -1 ||
        key.indexOf('DESERT') !== -1 || key.indexOf('REVOLVER') !== -1) {
      return MUZZLE_VELOCITY.PISTOL;
    }
    if (key.indexOf('SHOTGUN') !== -1 || key.indexOf('MOSSBERG') !== -1 ||
        key.indexOf('SPAS') !== -1 || key.indexOf('KS23') !== -1) {
      return MUZZLE_VELOCITY.SHOTGUN;
    }
    return MUZZLE_VELOCITY.DEFAULT;
  }

  /* ── Public API: getBulletDrop ─────────────────────────────────────── */
  /**
   * Returns { x, y } offsets in metres for a given weapon at a given range.
   * y is negative (drop below aim point).
   * x is lateral wind drift.
   */
  function _getBulletDrop(weaponType, range) {
    var mv   = _getMuzzleVelocity(weaponType);
    var r    = (typeof range === 'number' && range > 0) ? range : DEFAULT_ADS_RANGE;
    var windX = (typeof window._windX === 'number') ? window._windX : 0;
    /* dropY = -range² * g / (2 * mv²) */
    var dropY = -(r * r * GRAVITY) / (2 * mv * mv);
    var driftX = r * windX * WIND_DRIFT_K;
    return { x: driftX, y: dropY };
  }
  /* expose globally immediately so callers can use it before init */
  window._getBulletDrop = _getBulletDrop;

  /* ── HUD: create drop indicator ────────────────────────────────────── */
  function _createDropHud() {
    if (_dropHud) return;
    _dropHud = document.createElement('div');
    _dropHud.id = 'bullet-drop-hud';
    _dropHud.style.cssText = [
      'display:none',
      'position:fixed',
      'bottom:88px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#00e5ff',
      'font-size:10px',
      'font-family:monospace',
      'z-index:201',
      'pointer-events:none',
      'text-shadow:0 0 6px rgba(0,229,255,0.7)',
      'white-space:nowrap',
      'letter-spacing:1px'
    ].join(';');
    var hud = document.getElementById('hud');
    if (hud) {
      hud.appendChild(_dropHud);
    } else {
      document.body.appendChild(_dropHud);
    }
  }

  /* ── Sniper scope: create/update ballistic arc canvas overlay ─────── */
  function _ensureArcCanvas() {
    if (_arcCanvas) return;
    var scopeOverlay = document.getElementById('scope-overlay');
    if (!scopeOverlay) return;
    _arcCanvas = document.createElement('canvas');
    _arcCanvas.id = 'bullet-drop-arc';
    _arcCanvas.width  = 220;
    _arcCanvas.height = 110;
    _arcCanvas.style.cssText = [
      'position:absolute',
      'bottom:50%',
      'left:50%',
      'transform:translate(-50%,100%)',
      'pointer-events:none',
      'z-index:202',
      'opacity:0.72'
    ].join(';');
    scopeOverlay.appendChild(_arcCanvas);
    _arcCtx = _arcCanvas.getContext('2d');
  }

  function _drawArc(dropMetres) {
    _ensureArcCanvas();
    if (!_arcCtx) return;
    var w = _arcCanvas.width;
    var h = _arcCanvas.height;
    _arcCtx.clearRect(0, 0, w, h);

    /* Scale: w pixels = 300m range, h pixels = |dropMetres| (min 2m) */
    var maxDrop = Math.max(Math.abs(dropMetres), 2);
    var scaleY  = (h - 14) / maxDrop;

    _arcCtx.beginPath();
    _arcCtx.moveTo(0, 6);
    var steps = 40;
    for (var i = 0; i <= steps; i++) {
      var frac   = i / steps;
      var rangeI = frac * 300;
      var mv     = _getMuzzleVelocity(_lastShotWeaponType);
      var dropI  = -(rangeI * rangeI * GRAVITY) / (2 * mv * mv);
      var px     = frac * w;
      var py     = 6 + Math.abs(dropI) * scaleY;
      if (i === 0) { _arcCtx.moveTo(px, py); }
      else         { _arcCtx.lineTo(px, py); }
    }
    _arcCtx.strokeStyle = 'rgba(0,229,255,0.8)';
    _arcCtx.lineWidth   = 1.5;
    _arcCtx.setLineDash([4, 3]);
    _arcCtx.stroke();
    _arcCtx.setLineDash([]);

    /* Terminal dot */
    var endY = 6 + Math.abs(dropMetres) * scaleY;
    if (endY > h - 6) endY = h - 6;
    _arcCtx.beginPath();
    _arcCtx.arc(w, endY, 3, 0, 2 * Math.PI);
    _arcCtx.fillStyle = '#ff4444';
    _arcCtx.fill();

    /* Label */
    _arcCtx.fillStyle = '#00e5ff';
    _arcCtx.font      = '9px monospace';
    _arcCtx.fillText(Math.abs(dropMetres).toFixed(1) + 'm drop', 4, h - 3);
  }

  /* ── Hook: intercept _onBulletFired ───────────────────────────────── */
  function _installHook() {
    var _prevHook = window._onBulletFired;
    window._onBulletFired = function (origin, direction, weaponType) {
      _lastShotWeaponType = weaponType || 'DEFAULT';
      if (typeof _prevHook === 'function') {
        _prevHook(origin, direction, weaponType);
      }
    };
  }

  /* ── update: called each frame with dt (seconds) ─────────────────── */
  function update(dt) {
    if (!_inited) return;

    /* Determine current ADS range — prefer game-provided value */
    var range = (typeof window._adsRange === 'number' && window._adsRange > 0)
      ? window._adsRange
      : DEFAULT_ADS_RANGE;

    /* Poll _lastShotData if available */
    if (window._lastShotData && window._lastShotData.weaponType) {
      _lastShotWeaponType = window._lastShotData.weaponType;
    }

    /* Compute drop for current weapon/range */
    var drop = _getBulletDrop(_lastShotWeaponType, range);

    /* Update DROP HUD */
    if (_dropHud) {
      /* Show only when in ADS (heuristic: a scoped or ADS global) */
      var inAds = window._sniperScoped ||
                  window._adsActive    ||
                  window._isADS        ||
                  false;
      if (inAds) {
        var dropAbs   = Math.abs(drop.y);
        var windX     = (typeof window._windX === 'number') ? window._windX : 0;
        var windZ     = (typeof window._windZ === 'number') ? window._windZ : 0;
        var windTotal = Math.sqrt(windX * windX + windZ * windZ);
        var txt = '↓ DROP ' + dropAbs.toFixed(2) + 'm';
        if (windTotal > 0.01) {
          txt += '  DRIFT ' + (Math.abs(drop.x)).toFixed(2) + 'm';
        }
        _dropHud.textContent = txt;
        _dropHud.style.display = 'block';
      } else {
        _dropHud.style.display = 'none';
      }
    }

    /* Update sniper scope arc */
    if (window._sniperScoped) {
      _ensureArcCanvas();
      if (_arcCanvas) {
        _arcCanvas.style.display = 'block';
        _drawArc(drop.y);
      }
    } else {
      if (_arcCanvas) {
        _arcCanvas.style.display = 'none';
      }
    }
  }

  /* ── init ─────────────────────────────────────────────────────────── */
  function init(scene, camera) {
    if (_inited) return;
    _scene  = scene  || null;
    _camera = camera || null;

    /* Ensure wind globals exist */
    if (typeof window._windX === 'undefined') window._windX = 0;
    if (typeof window._windZ === 'undefined') window._windZ = 0;

    /* Create HUD elements */
    _createDropHud();

    /* Install shot hook */
    _installHook();

    _inited = true;
    console.log('[BulletDrop] init — muzzle velocities loaded, hook installed');
  }

  /* ── reset ────────────────────────────────────────────────────────── */
  function reset() {
    _lastShotWeaponType = 'DEFAULT';
    if (_dropHud)   _dropHud.style.display = 'none';
    if (_arcCanvas) {
      _arcCanvas.style.display = 'none';
      if (_arcCtx) _arcCtx.clearRect(0, 0, _arcCanvas.width, _arcCanvas.height);
    }
  }

  /* ── Auto-init on DOMContentLoaded if not done via GameManager ─────── */
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      if (!_inited) init(null, null);
    });
  }

  return { init: init, update: update, reset: reset };

})();
