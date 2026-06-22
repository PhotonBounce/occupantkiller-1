// ============================================================
//  heat-vision.js — Thermal infrared vision with enemy heat signatures
//  Toggleable with N key. Shows enemy heat blobs and hot zone overlays.
//  Public API: init(scene, camera), update(), activate(), deactivate(), reset()
// ============================================================
window.HeatVision = (function () {
  'use strict';

  var _active = false;
  var _scene = null;
  var _camera = null;
  var _canvas = null;
  var _container = null;
  var _hudBadge = null;
  var _blobPool = [];
  var _activeBlobCount = 0;
  var _cooldownUntil = 0;
  var _audioCtx = null;
  var _humNode = null;
  var _humGain = null;
  var COOLDOWN_MS = 8000;
  var HEAT_RANGE = 30;
  var BLOB_W = 60;
  var BLOB_H = 80;
  var MAX_BLOBS = 64;

  // ── Internal helpers ──────────────────────────────────────

  function _getCanvas() {
    if (_canvas) return _canvas;
    _canvas = document.querySelector('canvas');
    return _canvas;
  }

  function _getContainer() {
    if (_container) return _container;
    _container = document.getElementById('game-container') || document.body;
    return _container;
  }

  function _getAudioCtx() {
    if (_audioCtx) return _audioCtx;
    try {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      window._audioCtx = _audioCtx;
    } catch (e) {
      _audioCtx = null;
    }
    return _audioCtx;
  }

  function _playHumOn() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      if (_humNode) { _humNode.stop(); _humNode = null; }
      _humGain = ctx.createGain();
      _humGain.gain.setValueAtTime(0, ctx.currentTime);
      _humGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.3);
      _humGain.connect(ctx.destination);
      _humNode = ctx.createOscillator();
      _humNode.type = 'sine';
      _humNode.frequency.setValueAtTime(100, ctx.currentTime);
      _humNode.connect(_humGain);
      _humNode.start();
    } catch (e) {}
  }

  function _playClickOff() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      if (_humNode) {
        _humGain.gain.setValueAtTime(_humGain.gain.value, ctx.currentTime);
        _humGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
        var h = _humNode;
        setTimeout(function () { try { h.stop(); } catch (e) {} }, 200);
        _humNode = null;
        _humGain = null;
      }
      // short click
      var g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.12, ctx.currentTime);
      g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      g2.connect(ctx.destination);
      var osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.connect(g2);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  }

  function _ensureHudBadge() {
    if (_hudBadge) return _hudBadge;
    _hudBadge = document.createElement('div');
    _hudBadge.id = 'heat-vision-badge';
    _hudBadge.style.cssText = [
      'display:none',
      'position:fixed',
      'top:30px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(255,100,0,0.18)',
      'border:1px solid #ff6600',
      'color:#ff6600',
      'padding:3px 14px',
      'border-radius:4px',
      'font-size:12px',
      'z-index:201',
      'pointer-events:none',
      'font-family:monospace',
      'letter-spacing:1px',
      'text-shadow:0 0 8px rgba(255,100,0,0.7)'
    ].join(';');
    _hudBadge.textContent = '🌡 HEAT';
    document.body.appendChild(_hudBadge);
    return _hudBadge;
  }

  function _acquireBlob() {
    var el;
    if (_activeBlobCount < _blobPool.length) {
      el = _blobPool[_activeBlobCount];
    } else if (_blobPool.length < MAX_BLOBS) {
      el = document.createElement('div');
      el.style.cssText = [
        'position:fixed',
        'pointer-events:none',
        'z-index:196',
        'border-radius:50%',
        'display:none',
        'mix-blend-mode:screen'
      ].join(';');
      document.body.appendChild(el);
      _blobPool.push(el);
    } else {
      return null;
    }
    _activeBlobCount++;
    return el;
  }

  function _hideExcessBlobs(count) {
    for (var i = count; i < _blobPool.length; i++) {
      _blobPool[i].style.display = 'none';
    }
    _activeBlobCount = count;
  }

  function _colorForHp(hp, maxHp) {
    var ratio = (maxHp > 0) ? (hp / maxHp) : 1;
    if (ratio > 0.5) return '#FF2200';  // full HP — bright red
    if (ratio > 0.25) return '#FF8800'; // half HP — orange
    return '#FFFF00';                   // low HP — yellow (cooler)
  }

  function _applyBlobStyle(el, x, y, w, h, color, alpha) {
    el.style.display = 'block';
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.style.left = Math.round(x - w / 2) + 'px';
    el.style.top = Math.round(y - h / 2) + 'px';
    el.style.opacity = String(alpha);
    el.style.background = 'radial-gradient(ellipse at 50% 40%, ' + color + ' 0%, rgba(255,80,0,0.6) 50%, transparent 100%)';
  }

  function _worldToScreen(pos3) {
    if (!_camera || !THREE) return null;
    var v = new THREE.Vector3(pos3.x, pos3.y, pos3.z);
    v.project(_camera);
    if (v.z > 1 || v.z < -1) return null; // behind camera or beyond far plane
    var w = window.innerWidth;
    var h = window.innerHeight;
    return {
      x: (v.x + 1) / 2 * w,
      y: (-v.y + 1) / 2 * h
    };
  }

  function _getEnemies() {
    if (window.Enemies && typeof window.Enemies.getAll === 'function') {
      return window.Enemies.getAll();
    }
    return [];
  }

  function _getHotZones() {
    var zones = [];
    var lists = [window._acidZones, window._gasZones, window._napalmZones];
    for (var li = 0; li < lists.length; li++) {
      var list = lists[li];
      if (!list) continue;
      for (var zi = 0; zi < list.length; zi++) {
        zones.push(list[zi]);
      }
    }
    return zones;
  }

  function _playerPos() {
    if (window._camera) {
      return window._camera.position;
    }
    if (_camera) return _camera.position;
    return null;
  }

  function _distSq(a, b) {
    var dx = a.x - b.x;
    var dy = (a.y || 0) - (b.y || 0);
    var dz = (a.z || 0) - (b.z || 0);
    return dx * dx + dy * dy + dz * dz;
  }

  // ── Screen filter ────────────────────────────────────────

  function _applyScreenFilter() {
    var c = _getCanvas();
    if (c) {
      c.style.filter = 'hue-rotate(180deg) saturate(0) contrast(1.5) brightness(0.3)';
    }
  }

  function _removeScreenFilter() {
    var c = _getCanvas();
    if (c) {
      c.style.filter = '';
    }
  }

  // ── Public API ───────────────────────────────────────────

  function init(scene, camera) {
    _scene = scene || window._gameScene || null;
    _camera = camera || window._camera || null;
    _ensureHudBadge();
    window._heatVisionActive = false;
    window._heatVisionAccuracyBonus = 0;

    document.addEventListener('keydown', function (e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.code === 'KeyN' || e.key === 'n' || e.key === 'N') {
        if (_active) {
          deactivate();
        } else {
          var now = Date.now();
          if (now < _cooldownUntil) {
            var remaining = Math.ceil((_cooldownUntil - now) / 1000);
            if (window.HUD && typeof window.HUD.showToast === 'function') {
              window.HUD.showToast('HEAT VISION COOLDOWN: ' + remaining + 's');
            }
            return;
          }
          activate();
        }
      }
    });
  }

  function activate() {
    if (_active) return;
    _active = true;
    window._heatVisionActive = true;
    window._heatVisionAccuracyBonus = 0.1;

    // resolve camera/scene lazily in case they weren't ready at init
    if (!_camera) _camera = window._camera || null;
    if (!_scene) _scene = window._gameScene || null;

    _applyScreenFilter();
    var badge = _ensureHudBadge();
    badge.style.display = 'block';

    _playHumOn();

    if (window.HUD && typeof window.HUD.showToast === 'function') {
      window.HUD.showToast('HEAT VISION ON');
    }
  }

  function deactivate() {
    if (!_active) return;
    _active = false;
    window._heatVisionActive = false;
    window._heatVisionAccuracyBonus = 0;

    _cooldownUntil = Date.now() + COOLDOWN_MS;

    _removeScreenFilter();
    var badge = _ensureHudBadge();
    badge.style.display = 'none';

    _hideExcessBlobs(0);
    _playClickOff();

    if (window.HUD && typeof window.HUD.showToast === 'function') {
      window.HUD.showToast('HEAT VISION OFF — 8s cooldown');
    }
  }

  function update() {
    // Refresh scene/camera refs each frame in case they become available later
    if (!_camera) _camera = window._camera || null;
    if (!_scene) _scene = window._gameScene || null;

    if (!_active) {
      _hideExcessBlobs(0);
      return;
    }

    var blobIdx = 0;
    var pPos = _playerPos();
    var heatRangeSq = HEAT_RANGE * HEAT_RANGE;

    // ── Enemy heat blobs ───────────────────────────────────
    var enemies = _getEnemies();
    for (var ei = 0; ei < enemies.length; ei++) {
      var enemy = enemies[ei];
      if (!enemy) continue;

      var ePos = enemy.position || (enemy.mesh && enemy.mesh.position) || null;
      if (!ePos) continue;

      // range check
      if (pPos && _distSq(pPos, ePos) > heatRangeSq) continue;

      var screen = _worldToScreen(ePos);
      if (!screen) continue;

      var hp = (enemy.hp !== undefined) ? enemy.hp : (enemy.health !== undefined ? enemy.health : 100);
      var maxHp = (enemy.maxHp !== undefined) ? enemy.maxHp : (enemy.maxHealth !== undefined ? enemy.maxHealth : 100);
      var color = _colorForHp(hp, maxHp);

      var el = _acquireBlob();
      if (!el) break;
      _applyBlobStyle(el, screen.x, screen.y, BLOB_W, BLOB_H, color, 0.82);
      blobIdx++;
    }

    // ── Hot zone blobs (acid / gas / napalm) ──────────────
    var zones = _getHotZones();
    for (var zi = 0; zi < zones.length; zi++) {
      var zone = zones[zi];
      if (!zone) continue;

      var zPos = zone.position || zone;
      if (!zPos || zPos.x === undefined) continue;

      if (pPos && _distSq(pPos, zPos) > heatRangeSq) continue;

      var zScreen = _worldToScreen(zPos);
      if (!zScreen) continue;

      var zEl = _acquireBlob();
      if (!zEl) break;
      // hot zones: yellow-green
      _applyBlobStyle(zEl, zScreen.x, zScreen.y, BLOB_W, BLOB_H, '#AAFF00', 0.6);
      blobIdx++;
    }

    // hide unused blobs
    _hideExcessBlobs(blobIdx);
  }

  function reset() {
    _active = false;
    window._heatVisionActive = false;
    window._heatVisionAccuracyBonus = 0;
    _cooldownUntil = 0;
    _removeScreenFilter();
    var badge = _ensureHudBadge();
    if (badge) badge.style.display = 'none';
    _hideExcessBlobs(0);
    if (_humNode) {
      try { _humNode.stop(); } catch (e) {}
      _humNode = null;
      _humGain = null;
    }
  }

  return { init: init, update: update, activate: activate, deactivate: deactivate, reset: reset };

})();
