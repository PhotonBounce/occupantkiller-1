// chemical-warfare.js — Chemical gas grenade / cloud tactical module
// Key: Ctrl+C to throw chemical grenade (3 charges per level)
// IIFE module — no let/const anywhere
window.ChemicalWarfare = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────
  var MAX_ACTIVE       = 2;       // max simultaneous gas clouds
  var CHARGES_PER_LEVEL = 3;      // grenade charges reset each level
  var PARTICLE_COUNT   = 8;       // spheres per cloud
  var PARTICLE_RADIUS  = 0.9;     // SphereGeometry radius
  var GAS_COLOR        = 0x88FF00;// green-yellow
  var GAS_OPACITY      = 0.3;
  var EXPAND_RADIUS    = 5;       // final cloud radius in world units
  var EXPAND_TIME      = 3;       // seconds to reach full radius
  var PERSIST_TIME     = 20;      // seconds cloud persists at full size
  var FADE_TIME        = 3;       // seconds to fade after persist
  var TOTAL_LIFE       = EXPAND_TIME + PERSIST_TIME + FADE_TIME;
  var THROW_DISTANCE   = 6;       // units ahead of player
  var ENEMY_DAMAGE_PER_SEC = 3;   // damage/s to enemies
  var ENEMY_SLOW_FACTOR    = 0.4; // fraction of normal speed
  var PLAYER_DAMAGE_PER_SEC = 2;  // damage/s to unmasked player
  var SCREEN_TINT_FILTER   = 'sepia(0.4) saturate(2) hue-rotate(40deg) brightness(0.85)';
  var ARC_PEAK         = 3;       // units of arc height during throw
  var GRENADE_TRAVEL_TIME = 0.6;  // seconds for grenade to travel

  // ── State ──────────────────────────────────────────────────────────────────
  var _scene     = null;
  var _camera    = null;
  var _charges   = CHARGES_PER_LEVEL;
  var _clouds    = [];
  var _grenades  = [];   // in-flight grenade objects
  var _keyBound  = false;
  var _hudEl     = null;
  var _tintActive = false;
  var _audioCtx  = null;
  var _hissNode  = null;
  var _chokeNode = null;
  var _chokeActive = false;

  // Public readable zone array
  window._gasZones = [];

  // ── Init ───────────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene   = scene;
    _camera  = camera;
    _charges = CHARGES_PER_LEVEL;
    _clouds  = [];
    _grenades = [];
    window._gasZones = [];
    _tintActive = false;
    _removeTint();
    _ensureHUD();
    _updateHUD();
    _bindKey();
  }

  // ── Key binding (Ctrl+C) ───────────────────────────────────────────────────
  function _bindKey() {
    if (_keyBound) return;
    _keyBound = true;
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyC' || e.key === 'c' || e.key === 'C')) {
        // Only intercept if not selecting text (no text selected)
        if (window.getSelection && window.getSelection().toString().length > 0) return;
        e.preventDefault();
        deployGas();
      }
    });
  }

  // ── Deploy grenade ─────────────────────────────────────────────────────────
  function deployGas() {
    if (!_scene || !_camera) return;
    if (_charges <= 0)             { _flashHUD('No charges!'); return; }
    if (_clouds.length >= MAX_ACTIVE) { _flashHUD('Max gas clouds active!'); return; }

    _charges--;
    _updateHUD();

    // Determine throw target: 6 units ahead of camera on XZ plane
    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);
    dir.y = 0;
    if (dir.lengthSq() < 0.001) dir.set(0, 0, -1);
    dir.normalize();

    var startPos = _camera.position.clone();
    var endPos = new THREE.Vector3(
      startPos.x + dir.x * THROW_DISTANCE,
      0.05,
      startPos.z + dir.z * THROW_DISTANCE
    );

    // Build a small grenade mesh
    var grenadeGeo = new THREE.SphereGeometry(0.12, 6, 6);
    var grenadeMat = new THREE.MeshBasicMaterial({ color: 0x445500 });
    var grenadeMesh = new THREE.Mesh(grenadeGeo, grenadeMat);
    grenadeMesh.position.copy(startPos);
    _scene.add(grenadeMesh);

    var grenade = {
      mesh:      grenadeMesh,
      startPos:  startPos.clone(),
      endPos:    endPos.clone(),
      age:       0,
      travelTime: GRENADE_TRAVEL_TIME
    };
    _grenades.push(grenade);

    _playHissSound();
  }

  // ── Build a gas cloud at a position ───────────────────────────────────────
  function _buildCloud(pos) {
    var particles = [];
    var geo = new THREE.SphereGeometry(PARTICLE_RADIUS, 6, 6);
    var mat = new THREE.MeshBasicMaterial({
      color:       GAS_COLOR,
      transparent: true,
      opacity:     GAS_OPACITY,
      depthWrite:  false
    });

    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var mesh = new THREE.Mesh(geo, mat.clone());
      // Fibonacci sphere distribution
      var phi   = Math.acos(1 - (2 * (i + 0.5)) / PARTICLE_COUNT);
      var theta = Math.PI * (1 + Math.sqrt(5)) * i;
      var ox = Math.sin(phi) * Math.cos(theta);
      var oy = Math.abs(Math.sin(phi) * Math.sin(theta));
      var oz = Math.cos(phi);
      mesh.userData.offset = { x: ox, y: oy, z: oz };
      mesh.position.set(pos.x, pos.y, pos.z);
      _scene.add(mesh);
      particles.push(mesh);
    }

    return {
      pos:           new THREE.Vector3(pos.x, pos.y, pos.z),
      particles:     particles,
      age:           0,
      currentRadius: 0
    };
  }

  // ── Update (called every frame with delta in seconds) ──────────────────────
  function update(delta) {
    if (!delta || delta <= 0) delta = 0.016;

    // Wind
    var windX = (typeof window._windX === 'number') ? window._windX : 0;
    var windZ = (typeof window._windZ === 'number') ? window._windZ : 0;

    // ── Advance in-flight grenades ─────────────────────────────────────────
    var aliveGrenades = [];
    for (var gi = 0; gi < _grenades.length; gi++) {
      var g = _grenades[gi];
      g.age += delta;
      var t = g.age / g.travelTime;
      if (t >= 1) {
        // Land: remove grenade mesh, spawn cloud
        _scene.remove(g.mesh);
        g.mesh.geometry.dispose();
        g.mesh.material.dispose();
        var cloud = _buildCloud(g.endPos);
        _clouds.push(cloud);
      } else {
        // Arc interpolation
        var ix = g.startPos.x + (g.endPos.x - g.startPos.x) * t;
        var iz = g.startPos.z + (g.endPos.z - g.startPos.z) * t;
        var iy = g.startPos.y + ARC_PEAK * 4 * t * (1 - t); // parabola
        g.mesh.position.set(ix, iy, iz);
        aliveGrenades.push(g);
      }
    }
    _grenades = aliveGrenades;

    // ── Update gas clouds ──────────────────────────────────────────────────
    var newClouds = [];
    window._gasZones = [];
    var playerInGas = false;

    for (var ci = 0; ci < _clouds.length; ci++) {
      var cloud = _clouds[ci];
      cloud.age += delta;

      // Wind drift
      cloud.pos.x += windX * delta;
      cloud.pos.z += windZ * delta;

      // Radius expansion
      var radius;
      if (cloud.age < EXPAND_TIME) {
        radius = EXPAND_RADIUS * (cloud.age / EXPAND_TIME);
      } else {
        radius = EXPAND_RADIUS;
      }
      cloud.currentRadius = radius;

      // Opacity: fade in, persist, fade out
      var opacity;
      if (cloud.age < EXPAND_TIME) {
        opacity = GAS_OPACITY * (cloud.age / EXPAND_TIME);
      } else if (cloud.age < EXPAND_TIME + PERSIST_TIME) {
        opacity = GAS_OPACITY;
      } else {
        var fp = (cloud.age - EXPAND_TIME - PERSIST_TIME) / FADE_TIME;
        opacity = GAS_OPACITY * (1 - fp);
        if (opacity < 0) opacity = 0;
      }

      // Position particles
      for (var pi = 0; pi < cloud.particles.length; pi++) {
        var p = cloud.particles[pi];
        var off = p.userData.offset;
        p.position.set(
          cloud.pos.x + off.x * radius,
          cloud.pos.y + off.y * radius,
          cloud.pos.z + off.z * radius
        );
        p.material.opacity = opacity;
      }

      // Publish zone
      window._gasZones.push({
        x:      cloud.pos.x,
        z:      cloud.pos.z,
        radius: cloud.currentRadius,
        age:    cloud.age
      });

      // Check if player camera is inside this cloud
      if (_camera) {
        var dx = _camera.position.x - cloud.pos.x;
        var dz = _camera.position.z - cloud.pos.z;
        var distSq = dx * dx + dz * dz;
        if (distSq < radius * radius) {
          playerInGas = true;
        }
      }

      // Damage / slow enemies inside cloud
      _affectEnemies(cloud, delta);

      // Keep cloud if still alive
      if (cloud.age < TOTAL_LIFE) {
        newClouds.push(cloud);
      } else {
        _destroyCloud(cloud);
      }
    }
    _clouds = newClouds;

    // ── Player gas effects ─────────────────────────────────────────────────
    var hasMask = (window._hasGasMask === true);
    if (playerInGas && !hasMask) {
      // Apply damage to player
      _damagePlayer(PLAYER_DAMAGE_PER_SEC * delta);
      // Screen tint
      _applyTint();
      // Choking sound
      _startChokeSound();
    } else {
      _removeTint();
      _stopChokeSound();
    }
  }

  // ── Affect enemies inside a cloud ─────────────────────────────────────────
  function _affectEnemies(cloud, delta) {
    var enemies = window._enemies || window._activeEnemies || [];
    if (!Array.isArray(enemies)) return;
    for (var ei = 0; ei < enemies.length; ei++) {
      var enemy = enemies[ei];
      if (!enemy) continue;
      var ex = 0, ez = 0;
      if (enemy.position) {
        ex = enemy.position.x;
        ez = enemy.position.z;
      } else if (enemy.mesh && enemy.mesh.position) {
        ex = enemy.mesh.position.x;
        ez = enemy.mesh.position.z;
      } else {
        continue;
      }
      var ddx = ex - cloud.pos.x;
      var ddz = ez - cloud.pos.z;
      if (ddx * ddx + ddz * ddz < cloud.currentRadius * cloud.currentRadius) {
        // Damage
        if (typeof enemy.takeDamage === 'function') {
          enemy.takeDamage(ENEMY_DAMAGE_PER_SEC * delta);
        } else if (typeof enemy.health === 'number') {
          enemy.health -= ENEMY_DAMAGE_PER_SEC * delta;
        }
        // Slow movement
        if (typeof enemy.speed === 'number') {
          enemy._chemSlowedSpeed = enemy._chemSlowedSpeed || enemy.speed;
          enemy.speed = enemy._chemSlowedSpeed * ENEMY_SLOW_FACTOR;
          enemy._chemSlowTimer = 0.5; // refresh slow duration
        }
        if (typeof enemy.moveSpeed === 'number') {
          enemy._chemSlowedMoveSpeed = enemy._chemSlowedMoveSpeed || enemy.moveSpeed;
          enemy.moveSpeed = enemy._chemSlowedMoveSpeed * ENEMY_SLOW_FACTOR;
          enemy._chemSlowMoveTimer = 0.5;
        }
      }
    }
  }

  // ── Damage player ──────────────────────────────────────────────────────────
  function _damagePlayer(amount) {
    if (typeof window._playerHealth === 'number') {
      window._playerHealth = Math.max(0, window._playerHealth - amount);
    } else if (window.GameManager && typeof window.GameManager.damagePlayer === 'function') {
      window.GameManager.damagePlayer(amount);
    }
  }

  // ── Destroy a cloud (remove meshes) ───────────────────────────────────────
  function _destroyCloud(cloud) {
    for (var i = 0; i < cloud.particles.length; i++) {
      var p = cloud.particles[i];
      if (_scene) _scene.remove(p);
      p.geometry.dispose();
      p.material.dispose();
    }
    cloud.particles = [];
  }

  // ── Screen tint ────────────────────────────────────────────────────────────
  function _applyTint() {
    if (_tintActive) return;
    _tintActive = true;
    var canvas = document.getElementById('c') ||
                 document.querySelector('canvas');
    if (canvas) canvas.style.filter = SCREEN_TINT_FILTER;
  }

  function _removeTint() {
    if (!_tintActive) return;
    _tintActive = false;
    var canvas = document.getElementById('c') ||
                 document.querySelector('canvas');
    if (canvas) canvas.style.filter = '';
  }

  // ── Audio ──────────────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (_audioCtx) return _audioCtx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) _audioCtx = new AC();
    } catch (e) { /* no audio */ }
    return _audioCtx;
  }

  function _playHissSound() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      // White noise burst shaped like a hiss
      var bufSize = ctx.sampleRate * 0.8;
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;

      // High-pass filter to make it hiss-like
      var hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 3000;

      var gainNode = ctx.createGain();
      gainNode.gain.value = 0.4;

      src.connect(hpf);
      hpf.connect(gainNode);
      gainNode.connect(ctx.destination);
      src.start();
    } catch (e) { /* ignore */ }
  }

  function _startChokeSound() {
    if (_chokeActive) return;
    _chokeActive = true;
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      // Periodic choking: low-freq noise gated by an LFO
      var bufSize = ctx.sampleRate * 2;
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      _chokeNode = ctx.createBufferSource();
      _chokeNode.buffer = buf;
      _chokeNode.loop = true;

      var lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 600;

      var lfo = ctx.createOscillator();
      lfo.frequency.value = 1.5; // 1.5 Hz gating = choking rhythm
      var lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.15;
      lfo.connect(lfoGain);

      var gainNode = ctx.createGain();
      gainNode.gain.value = 0.2;
      lfoGain.connect(gainNode.gain);

      _chokeNode.connect(lpf);
      lpf.connect(gainNode);
      gainNode.connect(ctx.destination);
      _chokeNode.start();
      lfo.start();

      _hissNode = { chokeNode: _chokeNode, lfo: lfo, gainNode: gainNode };
    } catch (e) { _chokeActive = false; }
  }

  function _stopChokeSound() {
    if (!_chokeActive) return;
    _chokeActive = false;
    try {
      if (_hissNode) {
        if (_hissNode.chokeNode) _hissNode.chokeNode.stop();
        if (_hissNode.lfo) _hissNode.lfo.stop();
        _hissNode = null;
      }
      if (_chokeNode) {
        _chokeNode.stop();
        _chokeNode = null;
      }
    } catch (e) { /* already stopped */ }
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'chem-warfare-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:16px',
      'right:16px',
      'color:#88FF00',
      'font-family:monospace',
      'font-size:15px',
      'font-weight:bold',
      'text-shadow:0 0 6px #44aa00,0 0 2px #000',
      'pointer-events:none',
      'z-index:9999',
      'user-select:none',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) _ensureHUD();
    _hudEl.textContent = '☣ GAS \xD7' + _charges;
  }

  function _flashHUD(msg) {
    if (!_hudEl) _ensureHUD();
    var prev = _hudEl.textContent;
    _hudEl.textContent = msg;
    _hudEl.style.color = '#ffee44';
    setTimeout(function () {
      _hudEl.textContent = prev;
      _hudEl.style.color = '#88FF00';
    }, 1200);
  }

  // ── Reset (called between levels) ─────────────────────────────────────────
  function reset() {
    // Remove all in-flight grenades
    for (var gi = 0; gi < _grenades.length; gi++) {
      if (_grenades[gi].mesh && _scene) {
        _scene.remove(_grenades[gi].mesh);
        _grenades[gi].mesh.geometry.dispose();
        _grenades[gi].mesh.material.dispose();
      }
    }
    _grenades = [];

    // Remove all clouds
    for (var ci = 0; ci < _clouds.length; ci++) {
      _destroyCloud(_clouds[ci]);
    }
    _clouds = [];

    window._gasZones = [];
    _charges = CHARGES_PER_LEVEL;
    _tintActive = false;
    _removeTint();
    _stopChokeSound();
    _updateHUD();
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    init:      init,
    update:    update,
    deployGas: deployGas,
    reset:     reset
  };

})();
