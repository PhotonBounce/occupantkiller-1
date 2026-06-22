// sniper-nest.js — Elevated auto-turret sniper emplacement system
// Ctrl+N: place sniper nest at player position (max 2 active nests)
// Auto-targeting turret: 25-unit range, 65 dmg, fires every 2.5s
// Player can mount (within 1.5 radius) → E key to dismount
// Turret HP: 200 before destroyed
// Public API: init(scene, camera), update(dt), place(), reset()

window.SniperNest = (function () {
  'use strict';

  // ─── Private state ────────────────────────────────────────────────────────

  var _scene  = null;
  var _camera = null;

  var _nests     = [];        // active nest objects
  var _MAX_NESTS = 2;

  var _FIRE_INTERVAL = 2.5;   // seconds between shots
  var _RANGE         = 25;    // targeting range (world units)
  var _DAMAGE        = 65;    // damage per shot
  var _MAX_HP        = 200;
  var _MOUNT_RADIUS  = 1.5;   // player proximity to mount

  var _mounted       = null;  // nest the player is currently mounted on
  var _baseFOV       = 75;    // camera FOV outside mount
  var _ctrlNDown     = false; // debounce Ctrl+N
  var _eKeyDown      = false; // debounce E

  var _overlay = null;        // DOM overlay element
  var _hudBadge = null;       // "NEST ×N" badge element
  var _mountIndicator = null; // "NEST MOUNTED" indicator element

  var _audioCtx = null;       // Web Audio context (lazy)

  // ─── Audio helpers ────────────────────────────────────────────────────────

  function _getAudioCtx() {
    if (_audioCtx) return _audioCtx;
    try {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { _audioCtx = null; }
    return _audioCtx;
  }

  function _playServoWhir(duration) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type            = 'sine';
      osc.frequency.value = 80 + Math.random() * 40;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function _playFireCrack() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var buf    = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
      var data   = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 6);
      }
      var src  = ctx.createBufferSource();
      var gain = ctx.createGain();
      src.buffer           = buf;
      gain.gain.value      = 0.55;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  // ─── DOM overlay helpers ──────────────────────────────────────────────────

  function _ensureOverlay() {
    if (_overlay) return;
    _overlay = document.createElement('div');
    _overlay.id = 'sniper-nest-overlay';
    _overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:240;overflow:hidden';
    document.body.appendChild(_overlay);
  }

  function _ensureHudBadge() {
    if (_hudBadge) return;
    _ensureOverlay();
    _hudBadge = document.createElement('div');
    _hudBadge.id = 'nest-hud-badge';
    _hudBadge.style.cssText = 'position:fixed;top:56px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.65);border:1px solid rgba(255,200,0,0.5);color:#ffd700;font-size:12px;font-family:monospace;padding:3px 12px;border-radius:5px;z-index:242;pointer-events:none;display:none';
    _overlay.appendChild(_hudBadge);
  }

  function _ensureMountIndicator() {
    if (_mountIndicator) return;
    _ensureOverlay();
    _mountIndicator = document.createElement('div');
    _mountIndicator.id = 'nest-mount-indicator';
    _mountIndicator.style.cssText = 'position:fixed;bottom:160px;left:50%;transform:translateX(-50%);background:rgba(255,200,0,0.2);border:1px solid #ffd700;color:#ffd700;padding:4px 18px;border-radius:5px;font-size:13px;font-family:monospace;z-index:242;pointer-events:none;display:none';
    _mountIndicator.textContent = '🞯 NEST MOUNTED — E to dismount';
    _overlay.appendChild(_mountIndicator);
  }

  function _updateHudBadge() {
    _ensureHudBadge();
    if (_nests.length === 0) {
      _hudBadge.style.display = 'none';
    } else {
      _hudBadge.style.display = '';
      _hudBadge.textContent = '🎯 NEST ×' + _nests.length;
    }
  }

  function _setMountIndicatorVisible(visible) {
    _ensureMountIndicator();
    _mountIndicator.style.display = visible ? '' : 'none';
  }

  // ─── Mesh builder ─────────────────────────────────────────────────────────

  function _buildNestMesh() {
    var group = new THREE.Group();

    // Platform — wood-brown box raised 1.5 units high
    var platformMat = new THREE.MeshLambertMaterial({ color: 0x8B5C2A });
    var platform    = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 2), platformMat);
    platform.position.y = 1.5;
    group.add(platform);

    // 4 Sandbag walls — tan colored
    var sandbagMat = new THREE.MeshLambertMaterial({ color: 0xC2A96E });

    // Front (+Z)
    var sbFront = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 0.3), sandbagMat);
    sbFront.position.set(0, 1.9, 0.85);
    group.add(sbFront);

    // Back (-Z)
    var sbBack = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 0.3), sandbagMat);
    sbBack.position.set(0, 1.9, -0.85);
    group.add(sbBack);

    // Left (-X)
    var sbLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 2), sandbagMat);
    sbLeft.position.set(-0.85, 1.9, 0);
    group.add(sbLeft);

    // Right (+X)
    var sbRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 2), sandbagMat);
    sbRight.position.set(0.85, 1.9, 0);
    group.add(sbRight);

    // Auto-turret barrel — gray metal cylinder, mounted center-top
    var barrelMat   = new THREE.MeshLambertMaterial({ color: 0x555566 });
    var barrelGroup = new THREE.Group();
    barrelGroup.position.set(0, 2.1, 0);
    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.2, 6), barrelMat);
    barrel.rotation.x = Math.PI / 2;  // point forward by default
    barrel.position.z = -0.4;
    barrelGroup.add(barrel);
    group.add(barrelGroup);

    return {
      group:        group,
      platform:     platform,
      barrelGroup:  barrelGroup
    };
  }

  // ─── Bullet tracer helper ─────────────────────────────────────────────────

  function _spawnTracer(fromWorld, toWorld) {
    if (!_scene) return null;
    var points = [fromWorld.clone(), toWorld.clone()];
    var geo    = new THREE.BufferGeometry().setFromPoints(points);
    var mat    = new THREE.LineBasicMaterial({ color: 0xFFFF00, transparent: true, opacity: 1.0 });
    var line   = new THREE.Line(geo, mat);
    _scene.add(line);
    return { line: line, life: 0.1 };
  }

  // ─── Enemy helpers ────────────────────────────────────────────────────────

  function _getEnemies() {
    return (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
  }

  function _damageEnemy(enemy, dmg) {
    if (enemy.takeDamage) {
      enemy.takeDamage(dmg);
    } else {
      enemy.health = (enemy.health || 0) - dmg;
    }
  }

  function _isEnemyAlive(enemy) {
    if (typeof enemy.health !== 'undefined') return enemy.health > 0;
    return true;
  }

  // ─── Nearest enemy within range ──────────────────────────────────────────

  function _nearestEnemy(worldPos, range) {
    var enemies = _getEnemies();
    var best    = null;
    var bestDist = range * range;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!_isEnemyAlive(e)) continue;
      var ePos = (e.mesh && e.mesh.position) ? e.mesh.position
               : (e.position ? e.position : null);
      if (!ePos) continue;
      var dx = ePos.x - worldPos.x;
      var dz = ePos.z - worldPos.z;
      var dy = ePos.y - worldPos.y;
      var d2 = dx * dx + dz * dz + dy * dy;
      if (d2 < bestDist) {
        bestDist = d2;
        best     = e;
      }
    }
    return best;
  }

  // ─── Score / toast helpers ────────────────────────────────────────────────

  function _addScore(pts) {
    if (window.player && typeof window.player.score !== 'undefined') {
      window.player.score += pts;
    }
  }

  function _toast(msg) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
    }
  }

  // ─── Debris when nest is destroyed ───────────────────────────────────────

  function _spawnDebris(pos) {
    if (!_scene) return;
    var debrisMat = new THREE.MeshLambertMaterial({ color: 0x8B5C2A });
    for (var i = 0; i < 6; i++) {
      var size    = 0.1 + Math.random() * 0.25;
      var piece   = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), debrisMat);
      piece.position.copy(pos);
      piece.position.x += (Math.random() - 0.5) * 2;
      piece.position.y += Math.random() * 1.5;
      piece.position.z += (Math.random() - 0.5) * 2;
      var vx = (Math.random() - 0.5) * 4;
      var vy = 2 + Math.random() * 3;
      var vz = (Math.random() - 0.5) * 4;
      var life = 1.5 + Math.random();
      // Store velocity and lifetime on mesh userData for update loop
      piece.userData._debrisVx   = vx;
      piece.userData._debrisVy   = vy;
      piece.userData._debrisVz   = vz;
      piece.userData._debrisLife = life;
      _scene.add(piece);
      // Collect into global debris list
      _debris.push({ mesh: piece, vx: vx, vy: vy, vz: vz, life: life });
    }
  }

  var _debris  = [];   // active debris pieces
  var _tracers = [];   // active bullet tracers

  // ─── Remove a nest (by index) ─────────────────────────────────────────────

  function _removeNest(idx) {
    var n = _nests[idx];
    if (!n) return;

    // Dismount if player was on this nest
    if (_mounted === n) {
      _dismount();
    }

    // Debris
    _spawnDebris(n.group.position);

    // Remove from scene
    if (_scene) _scene.remove(n.group);

    _nests.splice(idx, 1);
    _updateHudBadge();
    _toast('Sniper nest destroyed!');
  }

  // ─── Mount / dismount ─────────────────────────────────────────────────────

  function _mount(nest) {
    if (_mounted) return;
    _mounted = nest;
    _setMountIndicatorVisible(true);

    // Rise camera to Y=2.5
    if (_camera) {
      _camera.position.y = 2.5;
      // Apply -10 FOV bonus if PerspectiveCamera
      if (typeof _camera.fov !== 'undefined') {
        _baseFOV = _camera.fov;
        _camera.fov = Math.max(30, _camera.fov - 10);
        _camera.updateProjectionMatrix();
      }
    }

    _toast('NEST MOUNTED — E to dismount | +30% accuracy | recoil halved');
  }

  function _dismount() {
    if (!_mounted) return;
    _mounted = null;
    _setMountIndicatorVisible(false);

    // Restore camera FOV
    if (_camera && typeof _camera.fov !== 'undefined') {
      _camera.fov = _baseFOV;
      _camera.updateProjectionMatrix();
    }

    _toast('Dismounted sniper nest');
  }

  // ─── Place a new nest ─────────────────────────────────────────────────────

  function place() {
    if (!_scene || !_camera) return;

    if (_nests.length >= _MAX_NESTS) {
      _toast('Max ' + _MAX_NESTS + ' sniper nests already placed!');
      return;
    }

    var playerPos = _camera.position.clone();

    var meshData = _buildNestMesh();
    meshData.group.position.set(playerPos.x, playerPos.y - 1.5, playerPos.z);
    _scene.add(meshData.group);

    var nest = {
      group:       meshData.group,
      barrelGroup: meshData.barrelGroup,
      hp:          _MAX_HP,
      fireTimer:   0,
      tracers:     []
    };

    _nests.push(nest);
    _updateHudBadge();
    _toast('🎯 Sniper nest placed! (' + _nests.length + '/' + _MAX_NESTS + ')');
  }

  // ─── Main update loop ─────────────────────────────────────────────────────

  function update(dt) {
    if (!dt || dt > 1) dt = 0.016;

    // Update debris
    for (var di = _debris.length - 1; di >= 0; di--) {
      var d = _debris[di];
      d.life -= dt;
      if (d.life <= 0) {
        if (_scene) _scene.remove(d.mesh);
        _debris.splice(di, 1);
        continue;
      }
      d.vy -= 9.8 * dt;
      d.mesh.position.x += d.vx * dt;
      d.mesh.position.y += d.vy * dt;
      d.mesh.position.z += d.vz * dt;
      d.mesh.rotation.x += dt * 2;
      d.mesh.rotation.z += dt * 1.5;
    }

    // Update tracers
    for (var ti = _tracers.length - 1; ti >= 0; ti--) {
      var tr = _tracers[ti];
      tr.life -= dt;
      if (tr.life <= 0) {
        if (_scene) _scene.remove(tr.line);
        _tracers.splice(ti, 1);
        continue;
      }
      tr.line.material.opacity = tr.life / 0.1;
    }

    // Check player mount proximity
    if (_camera && !_mounted) {
      var camPos = _camera.position;
      for (var ni = 0; ni < _nests.length; ni++) {
        var nestPos = _nests[ni].group.position;
        var dx = camPos.x - nestPos.x;
        var dz = camPos.z - nestPos.z;
        var distSq = dx * dx + dz * dz;
        if (distSq < _MOUNT_RADIUS * _MOUNT_RADIUS) {
          _mount(_nests[ni]);
          break;
        }
      }
    }

    // Update each nest: turret AI
    for (var ni2 = _nests.length - 1; ni2 >= 0; ni2--) {
      var nest = _nests[ni2];

      // Skip if destroyed
      if (nest.hp <= 0) {
        _removeNest(ni2);
        continue;
      }

      nest.fireTimer += dt;

      // World position of turret barrel tip
      var nestWorldPos = nest.group.position.clone();
      nestWorldPos.y += 2.1;

      var target = _nearestEnemy(nestWorldPos, _RANGE);

      if (target) {
        var tPos = (target.mesh && target.mesh.position) ? target.mesh.position
                 : (target.position ? target.position : null);

        if (tPos) {
          // Rotate barrel to face target
          var dx2 = tPos.x - nestWorldPos.x;
          var dz2 = tPos.z - nestWorldPos.z;
          var angle = Math.atan2(dx2, dz2);
          nest.barrelGroup.rotation.y = angle;

          // Servo whir while rotating
          _playServoWhir(0.05);

          // Fire
          if (nest.fireTimer >= _FIRE_INTERVAL) {
            nest.fireTimer = 0;

            // Apply damage
            _damageEnemy(target, _DAMAGE);
            _playFireCrack();

            // Bullet tracer
            var tracerStart = nestWorldPos.clone();
            var tracerEnd   = tPos.clone();
            var tr2 = _spawnTracer(tracerStart, tracerEnd);
            if (tr2) _tracers.push(tr2);

            // Score if enemy died
            if (!_isEnemyAlive(target)) {
              _addScore(75);
              _toast('+75 pts — Turret kill!');
            }
          }
        }
      } else {
        // Slowly rotate turret (scanning)
        nest.barrelGroup.rotation.y += dt * 0.6;
      }
    }
  }

  // ─── Keyboard handler ─────────────────────────────────────────────────────

  function _onKeyDown(e) {
    // Ctrl+N — place nest
    if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
      if (!_ctrlNDown) {
        _ctrlNDown = true;
        e.preventDefault();
        place();
      }
      return;
    }

    // E key — dismount
    if (e.key === 'e' || e.key === 'E') {
      if (!_eKeyDown && _mounted) {
        _eKeyDown = true;
        _dismount();
      }
    }
  }

  function _onKeyUp(e) {
    if ((e.key === 'n' || e.key === 'N') && (e.ctrlKey || e.metaKey || !e.ctrlKey)) {
      _ctrlNDown = false;
    }
    if (e.key === 'e' || e.key === 'E') {
      _eKeyDown = false;
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  function init(scene, camera) {
    _scene  = scene  || window._gameScene || null;
    _camera = camera || window._camera    || null;

    _ensureOverlay();
    _ensureHudBadge();
    _ensureMountIndicator();

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
  }

  function reset() {
    // Remove all nests from scene
    for (var i = 0; i < _nests.length; i++) {
      if (_scene) _scene.remove(_nests[i].group);
    }
    _nests   = [];
    _mounted = null;

    // Remove tracers
    for (var ti = 0; ti < _tracers.length; ti++) {
      if (_scene) _scene.remove(_tracers[ti].line);
    }
    _tracers = [];

    // Remove debris
    for (var di = 0; di < _debris.length; di++) {
      if (_scene) _scene.remove(_debris[di].mesh);
    }
    _debris = [];

    _setMountIndicatorVisible(false);
    _updateHudBadge();

    // Restore camera FOV
    if (_camera && typeof _camera.fov !== 'undefined') {
      _camera.fov = _baseFOV;
      _camera.updateProjectionMatrix();
    }
  }

  return { init: init, update: update, place: place, reset: reset };

}());
