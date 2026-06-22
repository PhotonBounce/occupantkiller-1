// ============================================================
//  riot-shield.js — Player-holdable ballistic shield
//  Alt+R to equip/unequip; RMB to raise shield.
//  Public API: init, update, equip, unequip, reset
// ============================================================
window.RiotShield = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────── */
  var MAX_HP          = 120;
  var SPEED_EQUIPPED  = 0.7;   // multiplier when shield held
  var SPEED_RAISED    = 0.45;  // multiplier when shield raised (RMB)
  var DAMAGE_REDUCE   = 0.85;  // fraction of damage blocked
  var DROP_CHANCE     = 0.15;  // 15 % from armored enemies
  var PUSH_RADIUS     = 1.5;   // units around player to push
  var PUSH_FORCE      = 3;     // units pushed back
  var SHARD_COUNT     = 8;

  /* ── Private state ──────────────────────────────────────────── */
  var _scene     = null;
  var _camera    = null;
  var _equipped  = false;
  var _hp        = MAX_HP;
  var _shattered = false;

  /* Three.js objects */
  var _shieldMesh  = null;   // PlaneGeometry panel attached to camera
  var _shards      = [];     // { mesh, vel, spin, life }

  /* Audio */
  var _audioCtx = null;

  /* Mouse right-button state */
  var _rmb = false;

  /* ── DOM HUD ────────────────────────────────────────────────── */
  var _hudEl      = null;
  var _hudBarEl   = null;
  var _hudFillEl  = null;
  var _hudIconEl  = null;

  /* ── Helpers ────────────────────────────────────────────────── */
  function _getScene()  { return _scene  || window._gameScene  || null; }
  function _getCamera() { return _camera || window._camera     || null; }

  function _toast(msg) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
    }
  }

  function _getAudio() {
    if (_audioCtx) return _audioCtx;
    try {
      _audioCtx = window._audioCtx ||
        new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { _audioCtx = null; }
    return _audioCtx;
  }

  /* ── Procedural audio ───────────────────────────────────────── */
  function _playClang() {
    var ctx = _getAudio();
    if (!ctx) return;
    try {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.22);
    } catch (e) {}
  }

  function _playShatter() {
    var ctx = _getAudio();
    if (!ctx) return;
    try {
      var buf  = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      var src  = ctx.createBufferSource();
      var gain = ctx.createGain();
      src.buffer = buf;
      src.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      src.start(ctx.currentTime);
    } catch (e) {}
  }

  /* ── HUD creation ───────────────────────────────────────────── */
  function _createHUD() {
    if (_hudEl) return;

    /* Outer container — bottom-left */
    _hudEl = document.createElement('div');
    _hudEl.id = 'riotShieldHUD';
    _hudEl.style.cssText = [
      'position:fixed;',
      'bottom:16px;left:12px;',
      'display:none;',
      'z-index:4200;',
      'pointer-events:none;',
      'font-family:monospace;',
    ].join('');

    /* Shield silhouette icon using CSS */
    _hudIconEl = document.createElement('div');
    _hudIconEl.style.cssText = [
      'width:80px;height:110px;',
      'background:rgba(20,40,80,0.6);',
      'border:2px solid #4488FF;',
      'border-radius:10px 10px 40% 40%;',
      'display:flex;flex-direction:column;',
      'align-items:center;justify-content:flex-start;',
      'padding-top:6px;',
      'box-sizing:border-box;',
    ].join('');

    var iconLabel = document.createElement('div');
    iconLabel.style.cssText = 'color:#4488FF;font-size:11px;font-weight:bold;text-align:center;line-height:1.2;';
    iconLabel.textContent = '🛡 SHIELD';
    _hudIconEl.appendChild(iconLabel);

    /* HP text */
    var hpText = document.createElement('div');
    hpText.id = 'riotShieldHPText';
    hpText.style.cssText = 'color:#88ccff;font-size:10px;margin-top:4px;';
    hpText.textContent = MAX_HP + 'HP';
    _hudIconEl.appendChild(hpText);

    /* HP bar */
    var barOuter = document.createElement('div');
    barOuter.style.cssText = [
      'margin-top:6px;',
      'width:60px;height:6px;',
      'background:rgba(0,0,0,0.5);',
      'border:1px solid rgba(68,136,255,0.4);',
      'border-radius:3px;overflow:hidden;',
    ].join('');

    _hudFillEl = document.createElement('div');
    _hudFillEl.style.cssText = [
      'width:100%;height:100%;',
      'background:linear-gradient(90deg,#2255cc,#4488ff);',
      'border-radius:3px;transition:width 0.15s;',
    ].join('');

    barOuter.appendChild(_hudFillEl);
    _hudIconEl.appendChild(barOuter);
    _hudBarEl = hpText;

    _hudEl.appendChild(_hudIconEl);
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var show = _equipped && !_shattered;
    _hudEl.style.display = show ? 'block' : 'none';
    if (!show) return;

    var pct = Math.max(0, _hp / MAX_HP * 100);
    if (_hudFillEl) _hudFillEl.style.width = pct + '%';
    if (_hudBarEl) _hudBarEl.textContent = Math.max(0, _hp) + 'HP';

    /* Colour shifts as HP drops */
    if (_hudFillEl) {
      if (pct > 50) {
        _hudFillEl.style.background = 'linear-gradient(90deg,#2255cc,#4488ff)';
      } else if (pct > 25) {
        _hudFillEl.style.background = 'linear-gradient(90deg,#886600,#ffcc00)';
      } else {
        _hudFillEl.style.background = 'linear-gradient(90deg,#880000,#ff2222)';
      }
    }
  }

  /* ── Three.js shield mesh (attached to camera) ───────────────── */
  function _buildShieldMesh() {
    if (!window.THREE) return null;
    var geo = new THREE.PlaneGeometry(0.8, 1.1);
    var mat = new THREE.MeshBasicMaterial({
      color: 0x142850,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthTest: false,
    });
    var mesh = new THREE.Mesh(geo, mat);
    /* Position in front of camera — lower-left area */
    mesh.position.set(-0.28, -0.2, -0.5);
    mesh.renderOrder = 999;
    return mesh;
  }

  function _attachShield() {
    var cam = _getCamera();
    if (!cam || !window.THREE) return;
    if (_shieldMesh) { _detachShield(); }
    _shieldMesh = _buildShieldMesh();
    if (_shieldMesh) cam.add(_shieldMesh);
  }

  function _detachShield() {
    var cam = _getCamera();
    if (_shieldMesh) {
      if (cam) cam.remove(_shieldMesh);
      if (_shieldMesh.geometry) _shieldMesh.geometry.dispose();
      if (_shieldMesh.material) _shieldMesh.material.dispose();
      _shieldMesh = null;
    }
  }

  /* ── Raised state feedback on mesh ──────────────────────────── */
  function _updateShieldRaisedVisual() {
    if (!_shieldMesh) return;
    if (_rmb) {
      /* Shield raised — move up slightly */
      _shieldMesh.position.set(-0.28, 0.05, -0.5);
      _shieldMesh.material.opacity = 0.88;
    } else {
      _shieldMesh.position.set(-0.28, -0.2, -0.5);
      _shieldMesh.material.opacity = 0.72;
    }
  }

  /* ── Shard shatter effect ────────────────────────────────────── */
  function _triggerShatter() {
    _playShatter();
    var sc = _getScene();
    var cam = _getCamera();
    if (!sc || !cam || !window.THREE) return;

    /* Base position: in front of camera */
    var camPos = new THREE.Vector3();
    cam.getWorldPosition(camPos);
    var camDir = new THREE.Vector3();
    cam.getWorldDirection(camDir);
    var origin = camPos.clone().addScaledVector(camDir, 0.8);

    for (var i = 0; i < SHARD_COUNT; i++) {
      var geo  = new THREE.BoxGeometry(0.1, 0.1, 0.02);
      var mat  = new THREE.MeshBasicMaterial({
        color: 0x2255bb,
        transparent: true,
        opacity: 0.8,
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(origin);

      /* Random outward velocity */
      var vel = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 4 + 1,
        (Math.random() - 0.5) * 6
      );

      _shards.push({ mesh: mesh, vel: vel, spin: Math.random() * 8 - 4, life: 1.2 });
      sc.add(mesh);
    }

    _toast('Shield shattered!');
  }

  /* ── Enemy push mechanic ─────────────────────────────────────── */
  function _doPush() {
    var player = window.player;
    if (!player) return;
    var playerPos = player.position || (player.mesh && player.mesh.position);
    if (!playerPos) return;

    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      var ePos = e.position || (e.mesh && e.mesh.position) || (e.group && e.group.position);
      if (!ePos) continue;
      var dx = ePos.x - playerPos.x;
      var dz = ePos.z - playerPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < PUSH_RADIUS && dist > 0.01) {
        var nx = dx / dist;
        var nz = dz / dist;
        ePos.x += nx * PUSH_FORCE;
        ePos.z += nz * PUSH_FORCE;
        /* propagate to mesh/group if needed */
        if (e.mesh && e.mesh.position !== ePos) {
          e.mesh.position.x += nx * PUSH_FORCE;
          e.mesh.position.z += nz * PUSH_FORCE;
        }
        if (e.group && e.group.position !== ePos) {
          e.group.position.x += nx * PUSH_FORCE;
          e.group.position.z += nz * PUSH_FORCE;
        }
      }
    }
  }

  /* ── Shield drop from armored enemy ─────────────────────────── */
  function _onArmoredEnemyDied() {
    if (_equipped && !_shattered) return; /* already have one */
    if (Math.random() > DROP_CHANCE) return;
    /* Give the player a fresh shield */
    _shattered = false;
    _hp = MAX_HP;
    window._shieldHP = _hp;
    _toast('Picked up riot shield from enemy drop!');
  }

  /* ── Public: equip / unequip ─────────────────────────────────── */
  function equip() {
    if (_equipped) return;
    if (_shattered) {
      _toast('Shield is broken — find a replacement!');
      return;
    }
    _equipped = true;
    window._shieldEquipped = true;

    /* Apply speed penalty via global multiplier */
    if (typeof window._playerSpeedMult !== 'undefined') {
      window._playerSpeedMult = (window._playerSpeedMult || 1) * SPEED_EQUIPPED;
    } else {
      window._playerSpeedMult = SPEED_EQUIPPED;
    }

    _attachShield();
    _updateHUD();
    _toast('Riot shield equipped [RMB = raise]');
  }

  function unequip() {
    if (!_equipped) return;
    _equipped = false;
    window._shieldEquipped = false;
    window._shieldRaised   = false;
    _rmb = false;

    /* Restore speed: divide out the equipped multiplier */
    if (typeof window._playerSpeedMult !== 'undefined') {
      window._playerSpeedMult = window._playerSpeedMult / SPEED_EQUIPPED;
    }

    _detachShield();
    _updateHUD();
    _toast('Riot shield unequipped');
  }

  /* ── Damage intercept (called by game damage pipeline) ──────── */
  function _interceptDamage(dmg) {
    if (!_equipped || !_rmb || _shattered) return dmg;

    var blocked = dmg * DAMAGE_REDUCE;
    var passed  = dmg - blocked;
    _hp -= blocked;
    window._shieldHP = _hp;
    _playClang();

    if (_hp <= 0) {
      _hp = 0;
      _shattered = true;
      window._shieldHP = 0;
      _detachShield();
      _triggerShatter();
      _equipped = false;
      window._shieldEquipped = false;
      window._shieldRaised   = false;
      _rmb = false;
      /* Restore speed */
      if (typeof window._playerSpeedMult !== 'undefined') {
        window._playerSpeedMult = window._playerSpeedMult / SPEED_EQUIPPED;
      }
    }
    return passed;
  }

  /* ── Key & mouse listeners ───────────────────────────────────── */
  function _onKeyDown(e) {
    /* Alt+R */
    if (e.altKey && (e.key === 'r' || e.key === 'R')) {
      e.preventDefault();
      if (_equipped) { unequip(); } else { equip(); }
    }
  }

  function _onMouseDown(e) {
    if (e.button !== 2) return;
    if (!_equipped || _shattered) return;
    _rmb = true;
    window._shieldRaised = true;

    /* Apply extra speed penalty when raised */
    var ratio = SPEED_RAISED / SPEED_EQUIPPED;
    if (typeof window._playerSpeedMult !== 'undefined') {
      window._playerSpeedMult = window._playerSpeedMult * ratio;
    }
  }

  function _onMouseUp(e) {
    if (e.button !== 2) return;
    if (!_rmb) return;
    _rmb = false;
    window._shieldRaised = false;

    /* Restore speed from raised penalty */
    if (_equipped && !_shattered) {
      var ratio = SPEED_RAISED / SPEED_EQUIPPED;
      if (typeof window._playerSpeedMult !== 'undefined') {
        window._playerSpeedMult = window._playerSpeedMult / ratio;
      }
    }
  }

  /* ── Public: init ────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene  || window._gameScene  || null;
    _camera = camera || window._camera     || null;

    _createHUD();

    document.addEventListener('keydown',   _onKeyDown,  false);
    document.addEventListener('mousedown', _onMouseDown, false);
    document.addEventListener('mouseup',   _onMouseUp,  false);

    /* Hook into global damage pipeline */
    var prevDmgHook = window._playerTookDamage;
    window._playerTookDamage = function (dmg) {
      var remaining = _interceptDamage(dmg);
      if (prevDmgHook) return prevDmgHook(remaining);
      return remaining;
    };

    /* Expose shield HP globally */
    window._shieldHP       = _hp;
    window._shieldEquipped = false;
    window._shieldRaised   = false;

    /* Hook armored enemy death for drops */
    var prevEnemyDied = window._onArmoredEnemyDied;
    window._onArmoredEnemyDied = function () {
      _onArmoredEnemyDied();
      if (prevEnemyDied) prevEnemyDied();
    };

    console.log('[RiotShield] initialised. Alt+R to equip.');
  }

  /* ── Public: update (call every frame with delta seconds) ─────── */
  function update(dt) {
    /* Shard animation */
    var sc = _getScene();
    for (var i = _shards.length - 1; i >= 0; i--) {
      var s = _shards[i];
      s.life -= dt;
      if (s.life <= 0) {
        if (sc) sc.remove(s.mesh);
        if (s.mesh.geometry) s.mesh.geometry.dispose();
        if (s.mesh.material) s.mesh.material.dispose();
        _shards.splice(i, 1);
        continue;
      }
      s.mesh.position.x += s.vel.x * dt;
      s.mesh.position.y += s.vel.y * dt;
      s.mesh.position.z += s.vel.z * dt;
      s.vel.y -= 9.8 * dt; /* gravity */
      s.mesh.rotation.z += s.spin * dt;
      s.mesh.material.opacity = Math.max(0, s.life / 1.2 * 0.8);
    }

    /* Update shield visual when raised / lowered */
    if (_equipped && !_shattered && _shieldMesh) {
      _updateShieldRaisedVisual();
    }

    /* Push mechanic — while raised and moving forward */
    if (_equipped && !_shattered && _rmb) {
      _doPush();
    }

    /* Sync globals */
    window._shieldHP       = _hp;
    window._shieldEquipped = _equipped && !_shattered;
    window._shieldRaised   = _rmb && _equipped && !_shattered;

    _updateHUD();
  }

  /* ── Public: reset ───────────────────────────────────────────── */
  function reset() {
    unequip();
    _hp        = MAX_HP;
    _shattered = false;
    _rmb       = false;

    /* Remove lingering shards */
    var sc = _getScene();
    for (var i = 0; i < _shards.length; i++) {
      if (sc) sc.remove(_shards[i].mesh);
      if (_shards[i].mesh.geometry) _shards[i].mesh.geometry.dispose();
      if (_shards[i].mesh.material) _shards[i].mesh.material.dispose();
    }
    _shards = [];

    window._shieldHP       = _hp;
    window._shieldEquipped = false;
    window._shieldRaised   = false;
    _updateHUD();
  }

  /* ── Public API ──────────────────────────────────────────────── */
  return {
    init:    init,
    update:  update,
    equip:   equip,
    unequip: unequip,
    reset:   reset,
  };

})();
