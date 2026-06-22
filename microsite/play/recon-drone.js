/* ───────────────────────────────────────────────────────────────────────
   RECON DRONE — Ctrl+D deploys a tactical scout drone (2 uses per level)
   Standalone IIFE module, all var, Three.js game compatible
   ─────────────────────────────────────────────────────────────────────── */
window.ReconDrone = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────
  var DRONE_FLIGHT_HEIGHT   = 6;       // Y above player when airborne
  var ORBIT_RADIUS          = 10;      // radius of circular patrol path
  var REVEAL_RADIUS         = 15;      // enemy reveal radius (minimap)
  var DRONE_DURATION        = 25;      // seconds before auto-return
  var DRONE_USES_PER_LEVEL  = 2;
  var DRONE_HP              = 30;
  var BUZZ_FREQ             = 400;     // Hz, propeller fundamental
  var FEED_SIZE             = 80;      // camera feed canvas px
  var RISE_SPEED            = 3;       // units/s rising phase
  var ORBIT_SPEED           = 0.8;     // radians/s orbit

  // ── State ──────────────────────────────────────────────────────────────
  var _initialized     = false;
  var _scene           = null;
  var _camera          = null;
  var _renderer        = null;

  var _usesRemaining   = DRONE_USES_PER_LEVEL;
  var _active          = false;
  var _phase           = 'idle';   // 'idle' | 'rising' | 'orbiting' | 'returning' | 'falling'
  var _elapsed         = 0;
  var _orbitAngle      = 0;
  var _hp              = DRONE_HP;

  var _droneMesh       = null;
  var _rotors          = [];         // array of 4 rotor meshes
  var _smokeParticles  = [];
  var _smokeActive     = false;

  var _launchPos       = null;       // THREE.Vector3 where drone was launched from
  var _targetY         = 0;

  // Audio
  var _audioCtx        = null;
  var _buzzOscillator  = null;
  var _buzzGain        = null;
  var _buzzHarm2       = null;
  var _buzzHarm3       = null;

  // HUD elements
  var _badgeEl         = null;      // "RECON DRONE LAUNCHED [25s]" badge
  var _hudBadgeEl      = null;      // "🚁 RECON ×N" permanent badge
  var _feedCanvas      = null;      // 80×80 overhead camera feed
  var _feedCtx         = null;
  var _feedContainer   = null;

  // Expose active flag globally
  window._reconDroneActive = false;

  // ── Helpers ────────────────────────────────────────────────────────────
  function _getPlayer() {
    if (window.player) return window.player;
    if (window.GameState && window.GameState.player) return window.GameState.player;
    return null;
  }

  function _getEnemies() {
    if (window.enemies && Array.isArray(window.enemies)) return window.enemies;
    if (window.GameState && Array.isArray(window.GameState.enemies)) return window.GameState.enemies;
    return [];
  }

  function _getPlayerPos() {
    var p = _getPlayer();
    if (!p) return null;
    if (p.position) return p.position;
    return null;
  }

  function _vec3(x, y, z) {
    return new THREE.Vector3(x, y, z);
  }

  // ── Mesh creation ──────────────────────────────────────────────────────
  function _buildDroneMesh() {
    var group = new THREE.Group();

    // Body: flat box
    var bodyGeo  = new THREE.BoxGeometry(0.4, 0.1, 0.4);
    var bodyMat  = new THREE.MeshPhongMaterial({ color: 0x222222 });
    var body     = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    group.add(body);

    // 4 rotors at corners
    var rotorGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 8);
    var rotorMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
    var offsets  = [
      [ 0.22, 0.06,  0.22],
      [-0.22, 0.06,  0.22],
      [ 0.22, 0.06, -0.22],
      [-0.22, 0.06, -0.22]
    ];

    _rotors = [];
    for (var i = 0; i < offsets.length; i++) {
      var rotor = new THREE.Mesh(rotorGeo, rotorMat.clone());
      rotor.position.set(offsets[i][0], offsets[i][1], offsets[i][2]);
      group.add(rotor);
      _rotors.push(rotor);
    }

    return group;
  }

  // ── Audio ──────────────────────────────────────────────────────────────
  function _startBuzz() {
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      _buzzGain = _audioCtx.createGain();
      _buzzGain.gain.value = 0.0;
      _buzzGain.connect(_audioCtx.destination);

      _buzzOscillator = _audioCtx.createOscillator();
      _buzzOscillator.type = 'sawtooth';
      _buzzOscillator.frequency.value = BUZZ_FREQ;
      _buzzOscillator.connect(_buzzGain);
      _buzzOscillator.start();

      _buzzHarm2 = _audioCtx.createOscillator();
      _buzzHarm2.type = 'sawtooth';
      _buzzHarm2.frequency.value = BUZZ_FREQ * 2;
      var gain2 = _audioCtx.createGain();
      gain2.gain.value = 0.3;
      _buzzHarm2.connect(gain2);
      gain2.connect(_buzzGain);
      _buzzHarm2.start();

      _buzzHarm3 = _audioCtx.createOscillator();
      _buzzHarm3.type = 'square';
      _buzzHarm3.frequency.value = BUZZ_FREQ * 3;
      var gain3 = _audioCtx.createGain();
      gain3.gain.value = 0.15;
      _buzzHarm3.connect(gain3);
      gain3.connect(_buzzGain);
      _buzzHarm3.start();
    } catch (e) {
      // AudioContext unavailable
    }
  }

  function _updateBuzzVolume(dronePos) {
    if (!_buzzGain || !_audioCtx) return;
    var playerPos = _getPlayerPos();
    var vol = 0.0;
    if (_active && playerPos && dronePos) {
      var dx = dronePos.x - playerPos.x;
      var dy = dronePos.y - playerPos.y;
      var dz = dronePos.z - playerPos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      vol = Math.max(0, 1 - dist / 25) * 0.18;
    }
    _buzzGain.gain.setTargetAtTime(vol, _audioCtx.currentTime, 0.1);
  }

  function _stopBuzz() {
    try {
      if (_buzzOscillator) { _buzzOscillator.stop(); _buzzOscillator.disconnect(); }
      if (_buzzHarm2)      { _buzzHarm2.stop();      _buzzHarm2.disconnect(); }
      if (_buzzHarm3)      { _buzzHarm3.stop();      _buzzHarm3.disconnect(); }
      if (_buzzGain)       { _buzzGain.disconnect(); }
      if (_audioCtx)       { _audioCtx.close(); }
    } catch (e) {}
    _buzzOscillator = null;
    _buzzHarm2      = null;
    _buzzHarm3      = null;
    _buzzGain       = null;
    _audioCtx       = null;
  }

  // ── HUD ────────────────────────────────────────────────────────────────
  function _createHUD() {
    // Permanent "🚁 RECON ×N" badge
    _hudBadgeEl = document.createElement('div');
    _hudBadgeEl.id = 'reconDroneHudBadge';
    _hudBadgeEl.style.cssText = [
      'position:fixed',
      'top:54px',
      'left:12px',
      'background:rgba(0,0,0,0.65)',
      'color:#00e5ff',
      'font-family:monospace',
      'font-size:13px',
      'padding:3px 8px',
      'border:1px solid #00e5ff',
      'border-radius:4px',
      'z-index:8100',
      'pointer-events:none'
    ].join(';');
    _hudBadgeEl.textContent = '🚁 RECON ×' + _usesRemaining;
    document.body.appendChild(_hudBadgeEl);

    // "RECON DRONE LAUNCHED [25s]" active badge
    _badgeEl = document.createElement('div');
    _badgeEl.id = 'reconDroneBadge';
    _badgeEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,180,255,0.18)',
      'color:#00e5ff',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'padding:5px 16px',
      'border:1px solid #00e5ff',
      'border-radius:4px',
      'z-index:8200',
      'pointer-events:none',
      'display:none',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_badgeEl);

    // 80×80 camera feed container
    _feedContainer = document.createElement('div');
    _feedContainer.id = 'reconDroneFeed';
    _feedContainer.style.cssText = [
      'position:fixed',
      'bottom:12px',
      'left:12px',
      'width:' + FEED_SIZE + 'px',
      'height:' + FEED_SIZE + 'px',
      'background:#000',
      'border:2px solid #00e5ff',
      'box-shadow:0 0 10px rgba(0,229,255,0.4)',
      'z-index:8100',
      'display:none',
      'overflow:hidden'
    ].join(';');

    _feedCanvas = document.createElement('canvas');
    _feedCanvas.width  = FEED_SIZE;
    _feedCanvas.height = FEED_SIZE;
    _feedCanvas.style.cssText = 'display:block;width:100%;height:100%;';
    _feedCtx = _feedCanvas.getContext('2d');
    _feedContainer.appendChild(_feedCanvas);

    var feedLabel = document.createElement('div');
    feedLabel.style.cssText = [
      'position:absolute',
      'bottom:2px',
      'left:0',
      'right:0',
      'text-align:center',
      'font-family:monospace',
      'font-size:9px',
      'color:#00e5ff',
      'pointer-events:none'
    ].join(';');
    feedLabel.textContent = 'RECON CAM';
    _feedContainer.appendChild(feedLabel);

    document.body.appendChild(_feedContainer);
  }

  function _updateHUDBadge() {
    if (_hudBadgeEl) {
      _hudBadgeEl.textContent = '🚁 RECON ×' + _usesRemaining;
    }
  }

  function _showActiveBadge(secsLeft) {
    if (_badgeEl) {
      _badgeEl.textContent = 'RECON DRONE LAUNCHED [' + Math.ceil(secsLeft) + 's]';
      _badgeEl.style.display = 'block';
    }
    if (_feedContainer) _feedContainer.style.display = 'block';
  }

  function _hideActiveBadge() {
    if (_badgeEl) _badgeEl.style.display = 'none';
    if (_feedContainer) _feedContainer.style.display = 'none';
  }

  // ── Camera feed rendering ──────────────────────────────────────────────
  function _renderFeed() {
    if (!_feedCtx || !_droneMesh) return;
    var ctx = _feedCtx;
    var W = FEED_SIZE;
    var H = FEED_SIZE;

    ctx.fillStyle = '#000d1a';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,229,255,0.12)';
    ctx.lineWidth = 0.5;
    for (var gx = 0; gx <= W; gx += 16) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (var gy = 0; gy <= H; gy += 16) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    // Drone center dot (blue)
    var cx = W / 2;
    var cy = H / 2;
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    // Enemy dots (red)
    var dronePos = _droneMesh.position;
    var enemies  = _getEnemies();
    var scale    = (W / 2) / REVEAL_RADIUS;

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.position) continue;
      var ex = e.position.x - dronePos.x;
      var ez = e.position.z - dronePos.z;
      var dist = Math.sqrt(ex * ex + ez * ez);
      if (dist > REVEAL_RADIUS) continue;
      var px = cx + ex * scale;
      var py = cy + ez * scale;
      ctx.fillStyle = '#ff2222';
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sweep line
    ctx.strokeStyle = 'rgba(0,229,255,0.25)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(_orbitAngle) * (W / 2 - 2), cy + Math.sin(_orbitAngle) * (H / 2 - 2));
    ctx.stroke();
  }

  // ── Smoke trail ────────────────────────────────────────────────────────
  function _spawnSmoke(pos) {
    if (!_scene) return;
    var geo  = new THREE.SphereGeometry(0.08, 4, 4);
    var mat  = new THREE.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.7 });
    var puff = new THREE.Mesh(geo, mat);
    puff.position.copy(pos);
    puff.position.x += (Math.random() - 0.5) * 0.2;
    puff.position.z += (Math.random() - 0.5) * 0.2;
    puff._life = 1.0;
    _scene.add(puff);
    _smokeParticles.push(puff);
  }

  function _updateSmoke(dt) {
    for (var i = _smokeParticles.length - 1; i >= 0; i--) {
      var p = _smokeParticles[i];
      p._life -= dt * 1.2;
      p.material.opacity = Math.max(0, p._life * 0.7);
      p.position.y += dt * 0.5;
      p.scale.setScalar(1 + (1 - p._life) * 2);
      if (p._life <= 0) {
        _scene.remove(p);
        _smokeParticles.splice(i, 1);
      }
    }
  }

  // ── Small explosion ────────────────────────────────────────────────────
  function _explode(pos) {
    if (!_scene) return;
    for (var i = 0; i < 12; i++) {
      var geo  = new THREE.SphereGeometry(0.05, 4, 4);
      var mat  = new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? 0xff4400 : (i % 3 === 1 ? 0xffaa00 : 0xffff00),
        transparent: true,
        opacity: 1.0
      });
      var spark = new THREE.Mesh(geo, mat);
      spark.position.copy(pos);
      spark._vx = (Math.random() - 0.5) * 4;
      spark._vy = Math.random() * 3 + 1;
      spark._vz = (Math.random() - 0.5) * 4;
      spark._life = 0.6 + Math.random() * 0.4;
      _scene.add(spark);
      _smokeParticles.push(spark);
    }
  }

  // ── Enemy reveal ───────────────────────────────────────────────────────
  function _revealEnemies() {
    if (!_droneMesh) return;
    var pos     = _droneMesh.position;
    var enemies = _getEnemies();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.position) continue;
      var dx   = e.position.x - pos.x;
      var dz   = e.position.z - pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= REVEAL_RADIUS) {
        e._revealedByDrone = true;
      }
    }
  }

  // ── Deploy ─────────────────────────────────────────────────────────────
  function deploy() {
    if (_active || _usesRemaining <= 0 || !_scene) return;

    var playerPos = _getPlayerPos();
    if (!playerPos) return;

    _active               = true;
    window._reconDroneActive = true;
    _phase                = 'rising';
    _elapsed              = 0;
    _hp                   = DRONE_HP;
    _orbitAngle           = 0;
    _smokeActive          = false;

    _usesRemaining--;
    _updateHUDBadge();

    _launchPos = _vec3(playerPos.x, playerPos.y, playerPos.z);
    _targetY   = playerPos.y + DRONE_FLIGHT_HEIGHT;

    // Build and place mesh
    _droneMesh = _buildDroneMesh();
    _droneMesh.position.set(playerPos.x, playerPos.y + 0.5, playerPos.z);
    _scene.add(_droneMesh);

    _startBuzz();
    _showActiveBadge(DRONE_DURATION);
  }

  // ── Shot-down handler ──────────────────────────────────────────────────
  function takeDamage(amount) {
    if (!_active || _phase === 'falling') return;
    _hp -= (amount || 10);
    if (_hp <= 0) {
      _phase       = 'falling';
      _smokeActive = true;
      if (_droneMesh) {
        _explode(_droneMesh.position);
      }
    }
  }

  // ── Cleanup ────────────────────────────────────────────────────────────
  function _endDrone() {
    _active               = false;
    window._reconDroneActive = false;
    _phase                = 'idle';
    _smokeActive          = false;

    if (_droneMesh) {
      _scene.remove(_droneMesh);
      _droneMesh = null;
    }
    _rotors = [];
    _stopBuzz();
    _hideActiveBadge();
  }

  // ── Bullet hit check ──────────────────────────────────────────────────
  // Called externally: pass a THREE.Ray or bullet position to check hits
  function checkBulletHit(bulletPos, damageAmount) {
    if (!_active || !_droneMesh || _phase === 'falling' || _phase === 'idle') return false;
    var dp   = _droneMesh.position;
    var dx   = bulletPos.x - dp.x;
    var dy   = bulletPos.y - dp.y;
    var dz   = bulletPos.z - dp.z;
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < 0.5) {
      takeDamage(damageAmount || 10);
      return true;
    }
    return false;
  }

  // ── Update (call every frame) ──────────────────────────────────────────
  function update(dt) {
    if (!_active || !_droneMesh) {
      _updateSmoke(dt);
      return;
    }

    var playerPos = _getPlayerPos();
    dt = dt || 0.016;

    // Spin rotors
    for (var r = 0; r < _rotors.length; r++) {
      _rotors[r].rotation.y += dt * 25;
    }

    if (_phase === 'rising') {
      _droneMesh.position.y += RISE_SPEED * dt;
      if (_droneMesh.position.y >= _targetY) {
        _droneMesh.position.y = _targetY;
        _phase = 'orbiting';
      }
      _updateBuzzVolume(_droneMesh.position);

    } else if (_phase === 'orbiting') {
      _elapsed += dt;
      _orbitAngle += ORBIT_SPEED * dt;

      var baseX = _launchPos.x;
      var baseZ = _launchPos.z;
      _droneMesh.position.x = baseX + Math.cos(_orbitAngle) * ORBIT_RADIUS;
      _droneMesh.position.z = baseZ + Math.sin(_orbitAngle) * ORBIT_RADIUS;
      _droneMesh.position.y = _targetY;
      _droneMesh.rotation.y = -_orbitAngle;

      _revealEnemies();
      _updateBuzzVolume(_droneMesh.position);
      _renderFeed();
      _showActiveBadge(Math.max(0, DRONE_DURATION - _elapsed));

      if (_elapsed >= DRONE_DURATION) {
        _phase = 'returning';
      }

    } else if (_phase === 'returning') {
      // Fly back toward launch position horizontally, then descend
      var tx = _launchPos.x;
      var tz = _launchPos.z;
      var cx = _droneMesh.position.x;
      var cz = _droneMesh.position.z;
      var hdx = tx - cx;
      var hdz = tz - cz;
      var hdist = Math.sqrt(hdx * hdx + hdz * hdz);

      if (hdist > 0.3) {
        var spd = 4 * dt;
        _droneMesh.position.x += (hdx / hdist) * spd;
        _droneMesh.position.z += (hdz / hdist) * spd;
      } else {
        // Descend
        var groundY = playerPos ? (playerPos.y + 0.5) : 0.5;
        _droneMesh.position.y -= RISE_SPEED * dt;
        if (_droneMesh.position.y <= groundY) {
          _endDrone();
          return;
        }
      }
      _updateBuzzVolume(_droneMesh.position);

    } else if (_phase === 'falling') {
      _droneMesh.position.y -= 5 * dt;
      _droneMesh.rotation.x += dt * 3;
      _droneMesh.rotation.z += dt * 2;

      if (_smokeActive) {
        _spawnSmoke(_droneMesh.position);
      }

      if (_droneMesh.position.y < -2) {
        _endDrone();
      }
      _updateBuzzVolume(_droneMesh.position);
    }

    _updateSmoke(dt);
  }

  // ── Keyboard handler ───────────────────────────────────────────────────
  function _onKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      if (_usesRemaining > 0 && !_active) {
        deploy();
      }
    }
  }

  // ── Level reset ────────────────────────────────────────────────────────
  function reset() {
    _endDrone();
    _usesRemaining = DRONE_USES_PER_LEVEL;
    _smokeParticles = [];
    _updateHUDBadge();
    _hideActiveBadge();
  }

  // ── Init ───────────────────────────────────────────────────────────────
  function init(scene, camera, renderer) {
    if (_initialized) return;
    _initialized = true;
    _scene       = scene    || (window.GameState && window.GameState.scene)    || window.scene    || null;
    _camera      = camera   || (window.GameState && window.GameState.camera)   || window.camera   || null;
    _renderer    = renderer || (window.GameState && window.GameState.renderer) || window.renderer || null;

    _createHUD();
    _updateHUDBadge();

    document.addEventListener('keydown', _onKeyDown);
  }

  // ── Public API ─────────────────────────────────────────────────────────
  return {
    init:            init,
    update:          update,
    deploy:          deploy,
    reset:           reset,
    takeDamage:      takeDamage,
    checkBulletHit:  checkBulletHit
  };

})();
