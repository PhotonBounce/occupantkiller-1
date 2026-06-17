/* ============================================================
 *  SHIELD-BUBBLE.JS — Energy dome (F11)
 *
 *  5s protective energy sphere (r=3.5u) that follows the player.
 *  Any enemy within the dome takes 25 dmg/s + mild knockback.
 *  Visual: wireframe SphereGeometry + inner semi-transparent mesh
 *  + blue-purple PointLight. On enemy contact: sphere pulses white.
 *  1 per wave.
 * ============================================================ */
var ShieldBubble = (function () {
  'use strict';

  var DOME_RADIUS   = 3.5;
  var CONTACT_DMG   = 25;   /* dmg/s to enemies inside dome */
  var DURATION      = 5.0;
  var STOCK_MAX     = 1;

  var _stock        = STOCK_MAX;
  var _waveWas      = -1;
  var _init         = false;
  var _lastTs       = 0;
  var _active       = false;
  var _timeLeft     = 0;
  var _scene        = null;

  /* Dome meshes */
  var _wireframe    = null;
  var _wMat         = null;
  var _inner        = null;
  var _iMat         = null;
  var _domeLight    = null;
  var _hitFlashT    = 0;

  var _hintEl       = null;

  function _getScene() {
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch (e) {}
    }
    return _scene;
  }

  /* ── Hint ──────────────────────────────────── */
  function _buildHint() {
    _hintEl = document.createElement('div');
    _hintEl.id = 'shield-hint';
    Object.assign(_hintEl.style, {
      position: 'fixed', bottom: '167px', left: '12px',
      fontFamily: "'Courier New', monospace", fontSize: '9px',
      letterSpacing: '1.5px', color: 'rgba(140,140,255,0.55)',
      zIndex: 250, pointerEvents: 'none', whiteSpace: 'nowrap'
    });
    _hintEl.textContent = '[F11] SHIELD ×' + _stock;
    document.body.appendChild(_hintEl);
  }

  /* ── Build dome meshes ─────────────────────── */
  function _buildDome() {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    try {
      /* Wireframe outer */
      var geo  = new THREE.SphereGeometry(DOME_RADIUS, 12, 8);
      _wMat    = new THREE.MeshBasicMaterial({ color: 0x6688ff, wireframe: true, transparent: true, opacity: 0.6 });
      _wireframe = new THREE.Mesh(geo, _wMat);
      scene.add(_wireframe);

      /* Inner translucent fill */
      var geo2 = new THREE.SphereGeometry(DOME_RADIUS - 0.05, 12, 8);
      _iMat    = new THREE.MeshBasicMaterial({ color: 0x4455cc, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.BackSide });
      _inner   = new THREE.Mesh(geo2, _iMat);
      scene.add(_inner);

      _domeLight = new THREE.PointLight(0x8888ff, 3.5, DOME_RADIUS * 2 + 2);
      scene.add(_domeLight);
    } catch (err) {}
  }

  /* ── Remove dome meshes ────────────────────── */
  function _removeDome() {
    var scene = _getScene();
    if (!scene) return;
    if (_wireframe) { scene.remove(_wireframe); _wireframe.geometry.dispose(); _wMat.dispose(); _wireframe = null; _wMat = null; }
    if (_inner)     { scene.remove(_inner);     _inner.geometry.dispose();     _iMat.dispose(); _inner = null;     _iMat = null; }
    if (_domeLight) { scene.remove(_domeLight); _domeLight = null; }
  }

  /* ── Activate ─────────────────────────────── */
  function _activate() {
    if (_active) return;
    if (_stock <= 0) {
      try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('SHIELD — NO CHARGE'); } catch (e) {}
      return;
    }
    _stock--;
    _active   = true;
    _timeLeft = DURATION;
    _buildDome();
    _hintEl.textContent = '[F11] SHIELD ACTIVE';
    _hintEl.style.color = 'rgba(140,140,255,1.0)';
    try {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('🛡 ENERGY DOME — ' + DURATION + 's');
      if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.20, 0.12);
    } catch (e) {}
  }

  /* ── rAF tick ─────────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt   = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs  = ts;
    var tSec = ts / 1000;

    /* Restock */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas) {
          _waveWas = w; _stock = STOCK_MAX;
          if (_active) { _active = false; _timeLeft = 0; _removeDome(); }
          _hintEl.textContent = '[F11] SHIELD ×' + _stock;
          _hintEl.style.color = 'rgba(140,140,255,0.55)';
        }
      }
    } catch (e) {}

    if (!_active) return;

    _timeLeft -= dt;
    if (_timeLeft <= 0) {
      _active = false;
      _removeDome();
      _hintEl.textContent = '[F11] SHIELD ×' + _stock;
      _hintEl.style.color = _stock > 0 ? 'rgba(140,140,255,0.55)' : 'rgba(140,140,255,0.2)';
      try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('SHIELD DOWN'); } catch (e) {}
      return;
    }

    /* Follow player */
    var player = window.player;
    if (!player || !player.position) return;
    var px = player.position.x, py = player.position.y + 1.0, pz = player.position.z;

    if (_wireframe) _wireframe.position.set(px, py, pz);
    if (_inner)     _inner.position.set(px, py, pz);
    if (_domeLight) _domeLight.position.set(px, py, pz);

    /* Pulse dome */
    var prog  = _timeLeft / DURATION;
    var pulse = 0.5 + Math.sin(tSec * 3.5) * 0.15;
    if (_wMat) _wMat.opacity = (0.45 + pulse * 0.3) * prog;
    if (_iMat) _iMat.opacity = (0.08 + pulse * 0.08) * prog;

    /* Hit flash */
    if (_hitFlashT > 0) {
      _hitFlashT -= dt;
      if (_wMat) _wMat.color.setHex(_hitFlashT > 0 ? 0xffffff : 0x6688ff);
      if (_iMat) _iMat.color.setHex(_hitFlashT > 0 ? 0xffffff : 0x4455cc);
    }

    if (_domeLight) _domeLight.intensity = (2.5 + pulse * 1.0) * prog;

    /* Slow spin */
    if (_wireframe) { _wireframe.rotation.y += dt * 0.4; _wireframe.rotation.z += dt * 0.2; }

    /* Countdown hint */
    _hintEl.textContent = '[F11] SHIELD ' + Math.ceil(_timeLeft) + 's';

    /* Damage enemies inside dome */
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        var hit = false;
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || e.dead || !e.mesh) continue;
          var dx = e.mesh.position.x - px, dy = e.mesh.position.y - py, dz = e.mesh.position.z - pz;
          var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
          if (dist > DOME_RADIUS) continue;
          e.hp = Math.max(0, e.hp - CONTACT_DMG * dt);
          /* Knockback away from center */
          if (dist > 0.1) {
            e.mesh.position.x += (dx/dist) * 2.5 * dt;
            e.mesh.position.z += (dz/dist) * 2.5 * dt;
          }
          hit = true;
        }
        if (hit) _hitFlashT = 0.08;
      }
    } catch (err) {}
  }

  /* ── Key handler ──────────────────────────── */
  function _onKey(e) {
    if (e.code === 'F11' && !e.repeat) {
      e.preventDefault();
      _activate();
    }
  }

  /* ── Init ─────────────────────────────────── */
  function init() {
    if (_init) return;
    _init = true;
    _buildHint();
    window.addEventListener('keydown', _onKey);
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.ShieldBubble = ShieldBubble;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ShieldBubble.init(); });
} else {
  ShieldBubble.init();
}
