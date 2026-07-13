window.HazardAcid = (function () {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────
  var _scene = null;
  var _pools = [];          // {x, z, radius, mesh, barrels[], bubbles[], light, spillTimer}
  var _playerInPool = null;
  var _toastEl = null;
  var _audioCtx = null;
  var _hissNode = null;
  var _tremoloNode = null;
  var _hissGain = null;
  var _hissActive = false;
  var _initialized = false;

  // Public – readable by other modules.
  window._acidZones = [];

  // Fixed world positions for the 3 base acid pools.
  var POOL_POSITIONS = [
    { x:  18, z:  12 },
    { x: -22, z:  -8 },
    { x:   4, z: -28 },
  ];

  var BASE_RADIUS    = 2;    // metres
  var SPILL_RADIUS   = 4;    // BASE_RADIUS + 2
  var SPILL_DURATION = 10;   // seconds
  var POOL_HEAL_TIME = 30;   // seconds for spill to shrink back
  var PLAYER_DPS     = 8;
  var ENEMY_DPS      = 12;
  var GAS_MASK_REDUCTION = 0.75;

  // ─── Geometry helpers ────────────────────────────────────────────────────

  function _getGroundY(x, z) {
    return (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight)
      ? VoxelWorld.getTerrainHeight(x, z)
      : 0;
  }

  function _makePoolMesh(x, z, radius) {
    var geo = new THREE.CircleGeometry(radius, 16);
    var mat = new THREE.MeshLambertMaterial({
      color: 0xAAFF00,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2; // lay flat
    var y = _getGroundY(x, z) + 0.02;
    mesh.position.set(x, y, z);
    return mesh;
  }

  function _makeBubbles(x, z, count) {
    var bubbles = [];
    var y = _getGroundY(x, z);
    for (var i = 0; i < count; i++) {
      var geo = new THREE.SphereGeometry(0.08, 4, 4);
      var mat = new THREE.MeshLambertMaterial({
        color: 0xCCFF33,
        transparent: true,
        opacity: 0.85,
      });
      var mesh = new THREE.Mesh(geo, mat);
      // Spread bubbles randomly within the pool radius.
      var angle  = Math.random() * Math.PI * 2;
      var spread = Math.random() * (BASE_RADIUS * 0.75);
      mesh.position.set(
        x + Math.cos(angle) * spread,
        y + 0.05,
        z + Math.sin(angle) * spread
      );
      mesh.userData.baseY  = y + 0.05;
      mesh.userData.speed  = 0.4 + Math.random() * 0.6;
      mesh.userData.phase  = Math.random() * Math.PI * 2;
      mesh.userData.height = 0.25 + Math.random() * 0.45;
      _scene.add(mesh);
      bubbles.push(mesh);
    }
    return bubbles;
  }

  function _makeBarrel(x, z, offsetX, offsetZ) {
    var geo = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 12);
    var mat = new THREE.MeshLambertMaterial({ color: 0x446600 });
    var mesh = new THREE.Mesh(geo, mat);
    var y = _getGroundY(x + offsetX, z + offsetZ) + 0.3;
    mesh.position.set(x + offsetX, y, z + offsetZ);
    mesh.userData.intact    = true;
    mesh.userData.poolIndex = -1; // set after pool is created
    _scene.add(mesh);
    return mesh;
  }

  function _makeLight(x, z) {
    var y = _getGroundY(x, z) + 1.0;
    var light = new THREE.PointLight(0xAAFF00, 0.6, 6);
    light.position.set(x, y, z);
    return light;
  }

  // ─── Pool creation ────────────────────────────────────────────────────────

  function _createPool(x, z) {
    if (!_scene) return;

    var mesh    = _makePoolMesh(x, z, BASE_RADIUS);
    var bubbles = _makeBubbles(x, z, 6);
    var light   = _makeLight(x, z);

    // Two barrels per pool, placed just outside the rim.
    var barrel1 = _makeBarrel(x, z,  BASE_RADIUS + 0.5,  0.3);
    var barrel2 = _makeBarrel(x, z, -(BASE_RADIUS + 0.4), 0.5);

    _scene.add(mesh);
    _scene.add(light);

    var pool = {
      x: x, z: z,
      radius: BASE_RADIUS,
      mesh: mesh,
      bubbles: bubbles,
      light: light,
      barrels: [barrel1, barrel2],
      spillTimer: 0,
      spilling: false,
    };

    barrel1.userData.poolIndex = _pools.length;
    barrel2.userData.poolIndex = _pools.length;

    _pools.push(pool);

    // Register in public _acidZones array.
    window._acidZones.push({ x: x, z: z, radius: BASE_RADIUS });
  }

  // ─── Toast / HUD ──────────────────────────────────────────────────────────

  function _ensureToast() {
    if (_toastEl) return;
    _toastEl = document.createElement('div');
    _toastEl.id = 'acid-burn-toast';
    _toastEl.style.cssText = [
      'position:fixed;top:32%;left:50%;transform:translateX(-50%);',
      'font-family:monospace;font-size:18px;font-weight:bold;',
      'color:#AAFF00;',
      'padding:8px 24px;',
      'background:rgba(0,0,0,0.75);',
      'border:2px solid #AAFF00;',
      'border-radius:4px;',
      'z-index:5100;pointer-events:none;',
      'display:none;',
      'text-shadow:0 0 8px #AAFF00;',
    ].join('');
    _toastEl.textContent = 'ACID BURN!';
    document.body.appendChild(_toastEl);
  }

  function _showAcidHUD() {
    _ensureToast();
    if (_toastEl) _toastEl.style.display = 'block';
    if (window._renderer && window._renderer.domElement) {
      window._renderer.domElement.style.filter =
        'hue-rotate(75deg) saturate(2) brightness(1.15)';
    }
  }

  function _hideAcidHUD() {
    if (_toastEl) _toastEl.style.display = 'none';
    if (window._renderer && window._renderer.domElement) {
      window._renderer.domElement.style.filter = '';
    }
  }

  // ─── AudioContext hiss with tremolo ───────────────────────────────────────

  function _startHiss() {
    if (_hissActive) return;
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      // Noise buffer (1 second of white noise).
      var bufSize = _audioCtx.sampleRate;
      var buf = _audioCtx.createBuffer(1, bufSize, _audioCtx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      _hissNode = _audioCtx.createBufferSource();
      _hissNode.buffer = buf;
      _hissNode.loop = true;

      // High-pass filter to make it a hiss, not a rumble.
      var hpf = _audioCtx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 3000;

      // Tremolo: LFO at 6 Hz modulating gain.
      _tremoloNode = _audioCtx.createOscillator();
      _tremoloNode.type = 'sine';
      _tremoloNode.frequency.value = 6;

      var tremoloGain = _audioCtx.createGain();
      tremoloGain.gain.value = 0.3; // tremolo depth

      var tremoloOffset = _audioCtx.createGain();
      tremoloOffset.gain.value = 0.4; // base level

      _hissGain = _audioCtx.createGain();
      _hissGain.gain.value = 0.18;

      _tremoloNode.connect(tremoloGain);
      tremoloGain.connect(_hissGain.gain);

      _hissNode.connect(hpf);
      hpf.connect(tremoloOffset);
      tremoloOffset.connect(_hissGain);
      _hissGain.connect(_audioCtx.destination);

      _hissNode.start();
      _tremoloNode.start();
      _hissActive = true;
    } catch (e) {
      // AudioContext may be blocked; silently ignore.
    }
  }

  function _stopHiss() {
    if (!_hissActive) return;
    try {
      if (_hissNode)    { _hissNode.stop();    _hissNode = null; }
      if (_tremoloNode) { _tremoloNode.stop(); _tremoloNode = null; }
    } catch (e) { /* already stopped */ }
    _hissActive = false;
  }

  // ─── Barrel rupture ───────────────────────────────────────────────────────

  function _ruptureBarrel(barrel) {
    if (!barrel.userData.intact) return;
    barrel.userData.intact = false;

    var pidx = barrel.userData.poolIndex;
    if (pidx < 0 || pidx >= _pools.length) return;
    var pool = _pools[pidx];

    // Change barrel appearance to "burst" yellow-green.
    if (barrel.material) {
      barrel.material.color.setHex(0xAAFF00);
      barrel.material.transparent = true;
      barrel.material.opacity = 0.5;
    }

    // Expand pool radius.
    pool.radius  = SPILL_RADIUS;
    pool.spilling = true;
    pool.spillTimer = SPILL_DURATION;

    _rescalePool(pool);

    // Update public acid zone record.
    var zoneIdx = _getAcidZoneIndex(pool.x, pool.z);
    if (zoneIdx >= 0) {
      window._acidZones[zoneIdx].radius = SPILL_RADIUS;
    }
  }

  function _getAcidZoneIndex(x, z) {
    for (var i = 0; i < window._acidZones.length; i++) {
      if (window._acidZones[i].x === x && window._acidZones[i].z === z) return i;
    }
    return -1;
  }

  function _rescalePool(pool) {
    // Recalculate scale from BASE_RADIUS so that scale 1 = BASE_RADIUS.
    var s = pool.radius / BASE_RADIUS;
    pool.mesh.scale.set(s, s, s);
  }

  // ─── Check if a bullet hit a barrel (call from weapons system if desired) ─

  function checkBarrelHit(bulletPos, radius) {
    if (!bulletPos) return false;
    radius = radius || 0.5;
    for (var i = 0; i < _pools.length; i++) {
      var pool = _pools[i];
      for (var j = 0; j < pool.barrels.length; j++) {
        var b = pool.barrels[j];
        if (!b.userData.intact) continue;
        var bp = b.position;
        var dx = bulletPos.x - bp.x;
        var dy = bulletPos.y - bp.y;
        var dz = bulletPos.z - bp.z;
        if (Math.sqrt(dx*dx + dy*dy + dz*dz) < radius) {
          _ruptureBarrel(b);
          return true;
        }
      }
    }
    return false;
  }

  // ─── Enemy escape logic ───────────────────────────────────────────────────

  function _nudgeEnemiesAway(pool) {
    // Attempt to push enemies out of the acid pool.
    // Compatible with window._enemies or window.Enemies arrays.
    var enemies = (window._enemies && window._enemies.length)
      ? window._enemies
      : (window.Enemies && window.Enemies.list ? window.Enemies.list : null);
    if (!enemies) return;

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.position) continue;
      var dx = e.position.x - pool.x;
      var dz = e.position.z - pool.z;
      var dist = Math.sqrt(dx*dx + dz*dz);
      if (dist < pool.radius) {
        // Push enemy outward.
        if (dist < 0.01) { dx = 1; dz = 0; dist = 1; }
        var pushSpeed = 4.0;
        e.position.x += (dx / dist) * pushSpeed * 0.016;
        e.position.z += (dz / dist) * pushSpeed * 0.016;
        // Apply DPS.
        if (e.hp !== undefined) {
          e.hp = Math.max(0, e.hp - ENEMY_DPS * 0.016);
        } else if (e.health !== undefined) {
          e.health = Math.max(0, e.health - ENEMY_DPS * 0.016);
        }
      }
    }
  }

  // ─── Update loop ──────────────────────────────────────────────────────────

  function update(delta, playerPos, playerRef) {
    if (!_initialized || !_scene) return;

    var t = performance.now() / 1000;

    // Animate bubbles.
    for (var pi = 0; pi < _pools.length; pi++) {
      var pool = _pools[pi];

      // Spill / heal logic.
      if (pool.spilling) {
        pool.spillTimer -= delta;
        if (pool.spillTimer <= 0) {
          pool.spilling = false;
          // Begin healing: shrink back over POOL_HEAL_TIME.
          pool.healTimer   = POOL_HEAL_TIME;
          pool.healingBack = true;
        }
      } else if (pool.healingBack) {
        pool.healTimer -= delta;
        var frac = Math.max(0, pool.healTimer / POOL_HEAL_TIME);
        pool.radius = BASE_RADIUS + (SPILL_RADIUS - BASE_RADIUS) * frac;
        _rescalePool(pool);
        // Update public zone.
        var zi = _getAcidZoneIndex(pool.x, pool.z);
        if (zi >= 0) window._acidZones[zi].radius = pool.radius;
        if (pool.healTimer <= 0) {
          pool.healingBack = false;
          pool.radius = BASE_RADIUS;
          _rescalePool(pool);
          if (zi >= 0) window._acidZones[zi].radius = BASE_RADIUS;
        }
      }

      // Pulsing light.
      if (pool.light) {
        pool.light.intensity = 0.4 + 0.35 * Math.sin(t * 2.5 + pi * 1.3);
      }

      // Bubble animation – rise and reset.
      var bubbles = pool.bubbles;
      for (var bi = 0; bi < bubbles.length; bi++) {
        var bub = bubbles[bi];
        var ud  = bub.userData;
        var rise = ((t * ud.speed + ud.phase) % (ud.height + 0.5));
        bub.position.y = ud.baseY + rise;
        // Fade as they rise.
        if (bub.material) {
          bub.material.opacity = Math.max(0, 0.85 - rise / (ud.height + 0.5));
        }
      }

      // Enemy damage / escape per pool.
      _nudgeEnemiesAway(pool);
    }

    // Player detection.
    if (!playerPos) return;

    var playerPool = null;
    for (var pi2 = 0; pi2 < _pools.length; pi2++) {
      var p = _pools[pi2];
      var dxp = playerPos.x - p.x;
      var dzp = playerPos.z - p.z;
      if (Math.sqrt(dxp*dxp + dzp*dzp) < p.radius) {
        playerPool = p;
        break;
      }
    }

    if (playerPool) {
      // Apply damage with gas-mask reduction.
      if (playerRef && playerRef.hp !== undefined) {
        var raw = PLAYER_DPS * delta;
        var dmg = window._hasGasMask ? raw * (1 - GAS_MASK_REDUCTION) : raw;
        playerRef.hp = Math.max(1, playerRef.hp - dmg);
        playerRef.lastDamageTime = 0;
      }
      _showAcidHUD();
      _startHiss();
      _playerInPool = playerPool;
    } else {
      if (_playerInPool) {
        _hideAcidHUD();
        _stopHiss();
        _playerInPool = null;
      }
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  function init(scene) {
    _scene = scene;
    _initialized = false;
    _pools = [];
    window._acidZones = [];

    for (var i = 0; i < POOL_POSITIONS.length; i++) {
      _createPool(POOL_POSITIONS[i].x, POOL_POSITIONS[i].z);
    }

    _initialized = true;
  }

  function reset() {
    _stopHiss();
    _hideAcidHUD();
    _playerInPool = null;

    for (var i = 0; i < _pools.length; i++) {
      var pool = _pools[i];
      if (_scene) {
        if (pool.mesh)  _scene.remove(pool.mesh);
        if (pool.light) _scene.remove(pool.light);
        for (var bi = 0; bi < pool.bubbles.length; bi++) {
          _scene.remove(pool.bubbles[bi]);
        }
        for (var bj = 0; bj < pool.barrels.length; bj++) {
          _scene.remove(pool.barrels[bj]);
        }
      }
    }

    _pools = [];
    window._acidZones = [];
    _initialized = false;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    checkBarrelHit: checkBarrelHit,
  };
})();
