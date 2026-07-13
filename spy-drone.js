window.SpyDrone = (function () {
  'use strict';

  // ─── private state ────────────────────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;
  var _enemies  = null; // reference to enemies array (set in init)

  // Drone object: null when not deployed
  var _drone = null;
  /*
    _drone shape:
    {
      mesh       : THREE.Group,
      rotors     : [ THREE.Mesh, ... ],   // 4 rotor meshes to spin
      hp         : Number,                // 80 max
      position   : THREE.Vector3,         // drone world position (separate from player)
      battery    : Number,                // seconds remaining (60)
      reconLight : THREE.PointLight,      // dim blue for stealth
    }
  */

  var _state = {
    active      : false,   // drone is flying
    droneView   : false,   // player is looking through drone camera
    battery     : 60,      // seconds remaining
    cooldown    : 0,       // seconds until can re-deploy
    mouseDeltaX : 0,
    mouseDeltaY : 0
  };

  var _savedCameraPos    = null; // THREE.Vector3 snapshot before entering drone view
  var _savedCameraQuat   = null; // THREE.Quaternion snapshot

  // HUD element (injected once)
  var _hudEl = null;

  // Constants
  var BATTERY_MAX     = 60;
  var COOLDOWN_NORMAL = 90;
  var COOLDOWN_SHOT   = 30; // extra penalty on top of normal when destroyed
  var DRONE_HP        = 80;
  var DRONE_SPEED     = 8;   // units per second
  var MAX_ALTITUDE    = 15;  // above ground (y=0 assumed ground)
  var RECON_RANGE     = 20;  // reveal radius
  var REVEAL_DURATION = 8;   // seconds enemy stays revealed
  var STEALTH_DETECT  = 3;   // units — enemy notices drone only within this range
  var SCORE_BONUS     = 50;  // bonus per drone-spotted kill

  // ─── key state ────────────────────────────────────────────────────────────
  var _keys = {};

  // ─── helpers ──────────────────────────────────────────────────────────────

  function _notify(msg, color) {
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup(msg, color || '#00e5ff');
    }
  }

  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'spy-drone-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:110px',
      'right:18px',
      'background:rgba(0,0,0,0.72)',
      'color:#00e5ff',
      'font:bold 13px/1.4 monospace',
      'padding:6px 10px',
      'border-radius:6px',
      'border:1px solid #00e5ff44',
      'pointer-events:none',
      'display:none',
      'z-index:9999'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _batteryBar(seconds) {
    var total  = 10;
    var filled = Math.round((seconds / BATTERY_MAX) * total);
    var bar    = '';
    var i;
    for (i = 0; i < filled; i++)  { bar += '█'; }
    for (i = filled; i < total; i++) { bar += '░'; }
    return bar;
  }

  function _updateHUD() {
    if (!_hudEl) return;

    if (!_state.active && _state.cooldown <= 0) {
      _hudEl.style.display = 'none';
      return;
    }

    _hudEl.style.display = 'block';

    if (_state.cooldown > 0 && !_state.active) {
      _hudEl.textContent = '🛸 DRONE [COOLDOWN] ' + Math.ceil(_state.cooldown) + 's';
      _hudEl.style.color = '#ff6600';
      return;
    }

    var secs = Math.ceil(_state.battery);
    _hudEl.innerHTML = '🛸 DRONE [' + _batteryBar(_state.battery) + '] ' + secs + 's' +
      (_state.droneView ? ' &nbsp;<span style="color:#ffe600">DRONE-CAM</span>' : '') +
      '<br><span style="font-size:11px;color:#88ccff">Ctrl+Shift+D recall &nbsp; E toggle view</span>';
    _hudEl.style.color = _state.battery < 15 ? '#ff4400' : '#00e5ff';
  }

  function _buildDroneMesh() {
    var group = new THREE.Group();

    // Flat body
    var bodyGeo = new THREE.BoxGeometry(0.8, 0.15, 0.8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // 4 motor arms + rotors
    var rotors = [];
    var armOffsets = [
      [ 0.4, 0,  0.4],
      [-0.4, 0,  0.4],
      [ 0.4, 0, -0.4],
      [-0.4, 0, -0.4]
    ];
    var i;
    for (i = 0; i < 4; i++) {
      var off = armOffsets[i];

      // Motor arm (thin box from centre out to corner)
      var armGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.1, 6);
      var armMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      var arm    = new THREE.Mesh(armGeo, armMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(off[0], 0, off[2]);
      group.add(arm);

      // Rotor blade (flat disc)
      var rotorGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.02, 8);
      var rotorMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var rotor    = new THREE.Mesh(rotorGeo, rotorMat);
      rotor.position.set(off[0], 0.08, off[2]);
      group.add(rotor);
      rotors.push(rotor);
    }

    // Stealth point-light — very dim blue, only visible close up
    var reconLight = new THREE.PointLight(0x0044ff, 0.3, 4);
    reconLight.position.set(0, 0.1, 0);
    group.add(reconLight);

    return { group: group, rotors: rotors, reconLight: reconLight };
  }

  // ─── launch ───────────────────────────────────────────────────────────────

  function launch() {
    if (_state.active) {
      // Already flying — treat as recall
      recall();
      return;
    }
    if (_state.cooldown > 0) {
      _notify('🛸 DRONE recharging — ' + Math.ceil(_state.cooldown) + 's', '#ff6600');
      return;
    }
    if (!_scene || !_camera) {
      console.warn('[SpyDrone] Not initialised — call SpyDrone.init(scene, camera) first');
      return;
    }

    var meshData = _buildDroneMesh();

    // Start drone slightly above and in front of camera
    var spawnPos = _camera.position.clone();
    spawnPos.y += 2.5;
    spawnPos.x += _camera.getWorldDirection(new THREE.Vector3()).x * 2;
    spawnPos.z += _camera.getWorldDirection(new THREE.Vector3()).z * 2;

    meshData.group.position.copy(spawnPos);
    _scene.add(meshData.group);

    _drone = {
      mesh       : meshData.group,
      rotors     : meshData.rotors,
      reconLight : meshData.reconLight,
      hp         : DRONE_HP,
      position   : spawnPos.clone()
    };

    _state.active   = true;
    _state.droneView = false;
    _state.battery  = BATTERY_MAX;

    _notify('🛸 SPY DRONE LAUNCHED — 60s battery | E = toggle drone-cam', '#00e5ff');
    _createHUD();
    _updateHUD();
  }

  // ─── recall ───────────────────────────────────────────────────────────────

  function recall() {
    if (!_state.active || !_drone) return;

    // Exit drone view first
    if (_state.droneView) {
      _exitDroneView();
    }

    _scene.remove(_drone.mesh);
    _drone = null;
    _state.active    = false;
    _state.droneView = false;
    _state.cooldown  = COOLDOWN_NORMAL;

    _notify('🛸 DRONE RECALLED — ' + COOLDOWN_NORMAL + 's cooldown', '#ffaa00');
    _updateHUD();
  }

  // ─── view switching ───────────────────────────────────────────────────────

  function _enterDroneView() {
    if (!_drone || !_camera) return;
    _savedCameraPos  = _camera.position.clone();
    _savedCameraQuat = _camera.quaternion.clone();
    _state.droneView = true;
    // Snap camera immediately; update() will track drone
    _camera.position.copy(_drone.position);
    // Tilt slightly downward for recon look
    _camera.lookAt(
      _drone.position.x,
      _drone.position.y - 5,
      _drone.position.z
    );
    _notify('DRONE-CAM ACTIVE — E to return', '#ffe600');
  }

  function _exitDroneView() {
    if (!_camera) return;
    _state.droneView = false;
    if (_savedCameraPos)  { _camera.position.copy(_savedCameraPos); }
    if (_savedCameraQuat) { _camera.quaternion.copy(_savedCameraQuat); }
    _savedCameraPos  = null;
    _savedCameraQuat = null;
    _notify('RETURNED TO PLAYER VIEW', '#aaffcc');
  }

  // ─── recon — reveal nearby enemies ────────────────────────────────────────

  function _doRecon() {
    if (!_drone || !_enemies) return;
    var dronePos = _drone.position;
    var now      = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    var i;
    for (i = 0; i < _enemies.length; i++) {
      var enemy = _enemies[i];
      if (!enemy || !enemy.position) continue;
      var dx = enemy.position.x - dronePos.x;
      var dz = enemy.position.z - dronePos.z;
      var dy = enemy.position.y - dronePos.y;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < RECON_RANGE) {
        // Mark enemy as revealed
        enemy._spyDroneRevealed = true;
        enemy._spyDroneRevealedUntil = now + REVEAL_DURATION * 1000;
        enemy._spyDroneScoreBonus = SCORE_BONUS;

        // Add / refresh a flashing reveal light above the enemy (if not already there)
        if (!enemy._spyDroneLight && _scene) {
          var revealLight = new THREE.PointLight(0xffffff, 2.5, 6);
          revealLight.position.copy(enemy.position);
          revealLight.position.y += 2.5;
          _scene.add(revealLight);
          enemy._spyDroneLight = revealLight;
        }
      }

      // Check stealth detection threshold
      if (dist < STEALTH_DETECT && enemy.alert !== undefined) {
        enemy.alert = true;
      }
    }
  }

  // Remove expired reveal lights
  function _tickReconLights(nowMs) {
    if (!_enemies) return;
    var i;
    for (i = 0; i < _enemies.length; i++) {
      var enemy = _enemies[i];
      if (!enemy) continue;
      if (enemy._spyDroneLight) {
        if (!enemy._spyDroneRevealed || nowMs > enemy._spyDroneRevealedUntil) {
          // Expire
          if (_scene) { _scene.remove(enemy._spyDroneLight); }
          enemy._spyDroneLight    = null;
          enemy._spyDroneRevealed = false;
        } else {
          // Flash: toggle intensity on ~8Hz
          var flash = Math.sin(nowMs * 0.016) > 0;
          enemy._spyDroneLight.intensity = flash ? 2.5 : 0.8;
          // Track enemy position
          enemy._spyDroneLight.position.copy(enemy.position);
          enemy._spyDroneLight.position.y += 2.5;
        }
      }
    }
  }

  // ─── receive mouse delta from the input handler ───────────────────────────
  // game-manager.js (or whoever handles mousemove) should call
  //   SpyDrone.onMouseMove(dx, dy) while drone is active.
  function onMouseMove(dx, dy) {
    if (!_state.active) return;
    _state.mouseDeltaX += dx;
    _state.mouseDeltaY += dy;
  }

  // ─── damage (called externally when projectile hits drone) ────────────────
  function takeDamage(amount) {
    if (!_state.active || !_drone) return;
    _drone.hp -= (amount || 10);
    if (_drone.hp <= 0) {
      _destroyDrone();
    }
  }

  function _destroyDrone() {
    if (!_drone) return;

    // Small explosion effect
    if (typeof StageVFX !== 'undefined' && StageVFX.spawnExplosion) {
      StageVFX.spawnExplosion(_drone.position.clone(), 1.5);
    }

    // Exit drone view
    if (_state.droneView) { _exitDroneView(); }

    _scene.remove(_drone.mesh);
    _drone = null;
    _state.active    = false;
    _state.droneView = false;
    // Normal cooldown + 30s penalty
    _state.cooldown  = COOLDOWN_NORMAL + COOLDOWN_SHOT;

    _notify('🛸 DRONE DESTROYED! +' + COOLDOWN_SHOT + 's penalty cooldown', '#ff2200');
    _updateHUD();
  }

  // ─── keyboard wiring ──────────────────────────────────────────────────────

  function _onKeyDown(e) {
    // Ctrl+Shift+D — launch or recall
    if (e.ctrlKey && e.shiftKey && (e.code === 'KeyD' || e.key === 'D' || e.key === 'd')) {
      e.preventDefault();
      if (_state.active) {
        recall();
      } else {
        launch();
      }
      return;
    }

    // E — toggle drone camera (only while drone is active)
    if ((e.code === 'KeyE' || e.key === 'e' || e.key === 'E') && _state.active) {
      if (_state.droneView) {
        _exitDroneView();
      } else {
        _enterDroneView();
      }
    }
  }

  // ─── init ─────────────────────────────────────────────────────────────────

  function init(scene, camera, enemies) {
    _scene   = scene;
    _camera  = camera;
    _enemies = enemies || null;

    _createHUD();

    // Keyboard listener (guard against double-registration)
    if (!window._spyDroneKeyBound) {
      window.addEventListener('keydown', _onKeyDown, false);
      window._spyDroneKeyBound = true;
    }
  }

  // ─── update (called every frame from game-manager) ────────────────────────

  function update(delta) {
    var nowMs = (typeof performance !== 'undefined') ? performance.now() : Date.now();

    // Tick cooldown when drone is NOT active
    if (!_state.active) {
      if (_state.cooldown > 0) {
        _state.cooldown = Math.max(0, _state.cooldown - delta);
        _updateHUD();
      }
      _tickReconLights(nowMs);
      return;
    }

    // ── Drain battery ──
    _state.battery -= delta;
    if (_state.battery <= 0) {
      _state.battery = 0;
      _notify('🛸 DRONE BATTERY DEAD — recalled', '#ff4400');
      recall();
      return;
    }

    if (!_drone) return;

    // ── Spin rotors ──
    var ROTOR_SPEED = 15; // rad/s
    var r;
    for (r = 0; r < _drone.rotors.length; r++) {
      _drone.rotors[r].rotation.y += ROTOR_SPEED * delta;
    }

    // ── Move drone based on mouse delta + camera look direction ──
    var sensitivityH = 0.003; // radians per pixel
    var sensitivityV = 0.003;

    var dx = _state.mouseDeltaX * sensitivityH;
    var dy = _state.mouseDeltaY * sensitivityV;
    _state.mouseDeltaX = 0;
    _state.mouseDeltaY = 0;

    if (Math.abs(dx) > 0.0001 || Math.abs(dy) > 0.0001) {
      // Use camera's horizontal orientation for lateral movement
      var forward = new THREE.Vector3();
      _camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      var right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      // Horizontal movement from left/right mouse
      _drone.position.addScaledVector(right,   dx * DRONE_SPEED);
      // Vertical movement from up/down mouse (inverted so "up" raises drone)
      _drone.position.y -= dy * DRONE_SPEED;

      // Clamp altitude
      if (_drone.position.y > MAX_ALTITUDE) { _drone.position.y = MAX_ALTITUDE; }
      if (_drone.position.y < 1.0)          { _drone.position.y = 1.0; }
    }

    // Also allow WASD-style movement via held keys when in drone view
    if (_state.droneView) {
      var forwardDir = new THREE.Vector3();
      _camera.getWorldDirection(forwardDir);
      forwardDir.y = 0;
      forwardDir.normalize();

      var rightDir = new THREE.Vector3();
      rightDir.crossVectors(forwardDir, new THREE.Vector3(0, 1, 0)).normalize();

      var moveSpeed = DRONE_SPEED * delta;
      if (_keys['KeyW'] || _keys['ArrowUp'])    { _drone.position.addScaledVector(forwardDir,  moveSpeed); }
      if (_keys['KeyS'] || _keys['ArrowDown'])  { _drone.position.addScaledVector(forwardDir, -moveSpeed); }
      if (_keys['KeyA'] || _keys['ArrowLeft'])  { _drone.position.addScaledVector(rightDir,   -moveSpeed); }
      if (_keys['KeyD'] || _keys['ArrowRight']) { _drone.position.addScaledVector(rightDir,    moveSpeed); }
      if (_keys['KeyQ'])                        { _drone.position.y = Math.max(1, _drone.position.y - moveSpeed); }
      if (_keys['KeyR'])                        { _drone.position.y = Math.min(MAX_ALTITUDE, _drone.position.y + moveSpeed); }
    }

    // Sync mesh position
    _drone.mesh.position.copy(_drone.position);

    // Hover bob
    _drone.mesh.position.y += Math.sin(nowMs * 0.002) * 0.03;

    // ── Drone-camera tracking ──
    if (_state.droneView && _camera) {
      _camera.position.copy(_drone.position);
      // Slight downward angle for recon
      var lookTarget = new THREE.Vector3(
        _drone.position.x,
        _drone.position.y - 5,
        _drone.position.z
      );
      _camera.lookAt(lookTarget);
    }

    // ── Recon sweep every 0.5s (throttled) ──
    if (!_drone._lastReconTime || nowMs - _drone._lastReconTime > 500) {
      _doRecon();
      _drone._lastReconTime = nowMs;
    }

    // ── Tick reveal lights ──
    _tickReconLights(nowMs);

    // ── Update HUD ──
    _updateHUD();
  }

  // ─── reset (called on game restart) ──────────────────────────────────────

  function reset() {
    if (_drone) {
      if (_state.droneView) { _exitDroneView(); }
      if (_scene) { _scene.remove(_drone.mesh); }
      _drone = null;
    }

    // Clean up all reveal lights
    if (_enemies) {
      var i;
      for (i = 0; i < _enemies.length; i++) {
        var enemy = _enemies[i];
        if (enemy && enemy._spyDroneLight && _scene) {
          _scene.remove(enemy._spyDroneLight);
          enemy._spyDroneLight    = null;
          enemy._spyDroneRevealed = false;
        }
      }
    }

    _state.active    = false;
    _state.droneView = false;
    _state.battery   = BATTERY_MAX;
    _state.cooldown  = 0;
    _state.mouseDeltaX = 0;
    _state.mouseDeltaY = 0;

    _savedCameraPos  = null;
    _savedCameraQuat = null;

    _updateHUD();
  }

  // ─── key tracking for WASD in drone view ─────────────────────────────────
  (function () {
    function _onDown(e) { _keys[e.code] = true; }
    function _onUp(e)   { _keys[e.code] = false; }
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', _onDown, false);
      window.addEventListener('keyup',   _onUp,   false);
    }
  }());

  // ─── public API ──────────────────────────────────────────────────────────
  return {
    init       : init,
    update     : update,
    launch     : launch,
    recall     : recall,
    reset      : reset,
    takeDamage : takeDamage,
    onMouseMove: onMouseMove,
    isActive   : function () { return _state.active; },
    isDroneView: function () { return _state.droneView; }
  };
}());
