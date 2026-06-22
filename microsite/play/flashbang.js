// ============================================================
//  flashbang.js — Flashbang grenade feature module
//  Alt+F: throw flashbang (3 per life)
//  Parabolic throw arc, lands 5 units ahead
//  On detonation: PointLight + white CSS overlay + ringing audio
//  Enemies within 8 units: stunned 4s + blinded (head shake)
//  HUD: "⚡ FLASH ×3" counter; 2s cooldown between throws
//  Public API: init(scene, camera), update(dt), throw(), reset()
// ============================================================
window.Flashbang = (function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;

  var _count = 3;             // flashbangs remaining this life
  var _cooldownLeft = 0;      // seconds until next throw allowed
  var COOLDOWN_S = 2;
  var MAX_COUNT = 3;

  var _active = [];           // in-flight / detonating flashbangs
  var _hudEl = null;          // HUD counter element

  // ── HUD ───────────────────────────────────────────────────
  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'flashbang-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:110px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ffffaa',
      'font-size:13px',
      'font-family:monospace',
      'z-index:200',
      'pointer-events:none',
      'text-shadow:0 0 6px rgba(255,255,100,0.7)',
      'letter-spacing:1px'
    ].join(';');
    _hudEl.textContent = '⚡ FLASH \xD7' + _count;
    var hud = document.getElementById('hud');
    if (hud) {
      hud.appendChild(_hudEl);
    } else {
      document.body.appendChild(_hudEl);
    }
  }

  function _updateHUD() {
    if (!_hudEl) _createHUD();
    _hudEl.textContent = '⚡ FLASH \xD7' + _count;
    _hudEl.style.opacity = (_count > 0) ? '1' : '0.4';
  }

  // ── Overlay (player screen flash) ─────────────────────────
  function _flashPlayerScreen() {
    var el = document.getElementById('flashbang-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'flashbang-overlay';
      el.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'right:0',
        'bottom:0',
        'background:#fff',
        'opacity:0',
        'pointer-events:none',
        'z-index:200',
        'transition:opacity 0.05s'
      ].join(';');
      document.body.appendChild(el);
    }
    // snap to full white
    el.style.transition = 'opacity 0.05s';
    el.style.opacity = '1';

    // fade to 0 over 3 s using stepped rAF reduction
    var start = performance.now();
    var DURATION = 3000;
    function fadeStep() {
      var elapsed = performance.now() - start;
      var frac = Math.max(0, 1 - elapsed / DURATION);
      el.style.transition = 'none';
      el.style.opacity = String(frac);
      if (frac > 0) {
        requestAnimationFrame(fadeStep);
      }
    }
    requestAnimationFrame(fadeStep);
  }

  // ── Ringing audio ─────────────────────────────────────────
  function _playRing() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 4000;
      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 3);
      osc.onended = function () {
        try { ctx.close(); } catch (e) {}
      };
    } catch (e) {
      // AudioContext may not be available (e.g. Node.js check env)
    }
  }

  // ── Detonate ──────────────────────────────────────────────
  function _detonate(data) {
    var pos = data.mesh.position.clone();

    // 1. Expose global active state
    window._flashbangActive = { timestamp: Date.now(), radius: 8 };

    // 2. Point light burst (0.2 s)
    var light = new THREE.PointLight(0xFFFFFF, 20, 15);
    light.position.copy(pos);
    _scene.add(light);
    setTimeout(function () {
      _scene.remove(light);
      window._flashbangActive = null;
    }, 200);

    // 3. Player screen overlay + audio (only if mesh is near camera)
    _flashPlayerScreen();
    _playRing();

    // 4. Stun + blind nearby enemies
    _stunEnemies(pos);

    // 5. Remove grenade mesh
    _scene.remove(data.mesh);
  }

  // ── Enemy stun / blind ────────────────────────────────────
  function _stunEnemies(pos) {
    var RADIUS = 8;
    var STUN_S = 4;
    var enemies = _getEnemies();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.position) continue;
      var dx = e.position.x - pos.x;
      var dy = e.position.y - pos.y;
      var dz = e.position.z - pos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist <= RADIUS) {
        e._stunned = true;
        e._blinded = true;
        e._stunTimer = STUN_S;
        // schedule head-shake un-blind animation
        _scheduleHeadShake(e, STUN_S);
      }
    }
  }

  function _getEnemies() {
    // Try common global arrays used across this codebase
    if (window.GameManager && Array.isArray(window.GameManager.enemies)) {
      return window.GameManager.enemies;
    }
    if (window._enemies && Array.isArray(window._enemies)) {
      return window._enemies;
    }
    if (window.enemies && Array.isArray(window.enemies)) {
      return window.enemies;
    }
    return [];
  }

  // Head-shake: oscillate rotation.z for 0.1 s intervals when un-blinding
  function _scheduleHeadShake(enemy, stunSeconds) {
    var shakeStart = Date.now() + stunSeconds * 1000 - 600; // start 0.6 s before recovery
    var shakeEnd = Date.now() + stunSeconds * 1000;
    var originalZ = (enemy.rotation) ? enemy.rotation.z : 0;
    var phase = 0;

    function shake() {
      var now = Date.now();
      if (now < shakeStart) {
        setTimeout(shake, shakeStart - now);
        return;
      }
      if (now > shakeEnd) {
        // restore
        if (enemy.rotation) enemy.rotation.z = originalZ;
        enemy._blinded = false;
        return;
      }
      if (enemy.rotation) {
        phase += 1;
        enemy.rotation.z = originalZ + (phase % 2 === 0 ? 0.15 : -0.15);
      }
      setTimeout(shake, 100);
    }
    shake();
  }

  // ── Grenade mesh (small sphere) ───────────────────────────
  function _makeGrenadeMesh() {
    var geo = new THREE.SphereGeometry(0.08, 8, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    return new THREE.Mesh(geo, mat);
  }

  // ── Throw logic (parabolic arc) ───────────────────────────
  function _throw() {
    if (!_scene || !_camera) return false;
    if (_count <= 0) return false;
    if (_cooldownLeft > 0) return false;

    _count -= 1;
    _cooldownLeft = COOLDOWN_S;
    _updateHUD();

    // Start position: camera position
    var startPos = _camera.position.clone();
    startPos.y -= 0.2; // slight drop from eye level

    // Forward direction in XZ plane
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);
    dir.y = 0;
    if (dir.lengthSq() < 0.0001) { dir.z = -1; }
    dir.normalize();

    // Land 5 units ahead of camera XZ
    var landPos = new THREE.Vector3(
      startPos.x + dir.x * 5,
      startPos.y,        // same height as start (lands at ground approx)
      startPos.z + dir.z * 5
    );

    var mesh = _makeGrenadeMesh();
    mesh.position.copy(startPos);
    _scene.add(mesh);

    var FLIGHT_S = 0.7;  // seconds of flight
    var data = {
      mesh: mesh,
      startPos: startPos.clone(),
      landPos: landPos.clone(),
      elapsed: 0,
      duration: FLIGHT_S,
      detonated: false
    };
    _active.push(data);
    return true;
  }

  // ── Update loop ───────────────────────────────────────────
  function update(dt) {
    // tick cooldown
    if (_cooldownLeft > 0) {
      _cooldownLeft -= dt;
      if (_cooldownLeft < 0) _cooldownLeft = 0;
    }

    // advance active grenades
    for (var i = _active.length - 1; i >= 0; i--) {
      var d = _active[i];
      if (d.detonated) {
        _active.splice(i, 1);
        continue;
      }
      d.elapsed += dt;
      var t = Math.min(d.elapsed / d.duration, 1);

      // Lerp XZ
      d.mesh.position.x = d.startPos.x + (d.landPos.x - d.startPos.x) * t;
      d.mesh.position.z = d.startPos.z + (d.landPos.z - d.startPos.z) * t;

      // Parabolic Y arc: rises then falls
      var ARC_HEIGHT = 2.0;
      d.mesh.position.y = d.startPos.y + ARC_HEIGHT * 4 * t * (1 - t);

      // Detonate on landing
      if (t >= 1) {
        d.detonated = true;
        _detonate(d);
        _active.splice(i, 1);
      }
    }
  }

  // ── Key handler ───────────────────────────────────────────
  function _onKeyDown(e) {
    // Alt+F
    if (e.altKey && (e.code === 'KeyF' || e.key === 'f' || e.key === 'F')) {
      e.preventDefault();
      _throw();
    }
  }

  // ── init ─────────────────────────────────────────────────
  function init(scene, camera) {
    _scene = scene;
    _camera = camera;
    _count = MAX_COUNT;
    _cooldownLeft = 0;
    _active = [];
    _hudEl = null;
    _createHUD();
    _updateHUD();
    window.removeEventListener('keydown', _onKeyDown);
    window.addEventListener('keydown', _onKeyDown);
  }

  // ── reset (call on new life / respawn) ───────────────────
  function reset() {
    _count = MAX_COUNT;
    _cooldownLeft = 0;
    // clear any in-flight grenades
    for (var i = 0; i < _active.length; i++) {
      if (_scene && _active[i].mesh) {
        try { _scene.remove(_active[i].mesh); } catch (ex) {}
      }
    }
    _active = [];
    _updateHUD();
  }

  // ── Public API ────────────────────────────────────────────
  return {
    init: init,
    update: update,
    'throw': _throw,
    reset: reset
  };

}());
