window.FPVKamikaze = (function () {
  'use strict';

  // ─── private state ────────────────────────────────────────────────────────
  var _scene   = null;
  var _camera  = null;
  var _enemies = null;

  /*
    _drone shape:
    {
      mesh     : THREE.Group,
      blades   : [ THREE.Mesh, ... ],   // 4 spinning blade meshes
      led      : THREE.PointLight,
      hp       : Number,                // 50 max
      position : THREE.Vector3,
      battery  : Number,                // percent 0-100
      yaw      : Number,                // current horizontal facing angle (radians)
    }
  */
  var _drone = null;

  var _state = {
    active       : false,   // drone is airborne
    piloting     : false,   // player is in FPV view
    diving       : false,   // locked onto target, diving to detonate
    returning    : false,   // recalled, flying back to player
    battery      : 100,     // percent
    cooldown     : 0,       // seconds until re-deploy allowed
    mouseDeltaX  : 0,
    mouseDeltaY  : 0
  };

  // Camera save/restore for FPV switch
  var _savedCameraPos  = null;
  var _savedCameraQuat = null;

  // Dive target
  var _diveTarget = null;   // enemy object being dive-bombed

  // Return-to-player animation
  var _returnTimer  = 0;    // seconds elapsed
  var _returnStart  = null; // THREE.Vector3 drone start pos
  var _returnEnd    = null; // THREE.Vector3 player pos at recall time

  // Nearest enemy for HUD / auto-target
  var _nearestEnemy    = null;
  var _nearestDist     = Infinity;

  // FPV overlay elements
  var _fpvBorder    = null;
  var _fpvLabel     = null;
  var _fpvCrosshair = null;
  var _fpvHUD       = null;
  var _fpvTargetBox = null;

  // Small HUD (cooldown readout when not flying)
  var _cooldownEl = null;

  // Key state
  var _keys = {};

  // Motor whine audio node
  var _motorOscillator = null;
  var _motorGain       = null;
  var _audioCtx        = null;

  // Constants
  var DRONE_HP         = 50;
  var DRONE_SPEED      = 14;      // units per second in FPV flight
  var DIVE_SPEED       = 25;      // units per second when diving
  var AUTO_TARGET_RANGE = 6;      // auto-lock threshold (units)
  var DETONATE_RANGE   = 1.5;     // units from target to auto-detonate
  var DMG_INNER        = 200;     // within 3 units
  var DMG_MID          = 100;     // within 6 units
  var DMG_OUTER        = 50;      // within 10 units
  var BATTERY_DRAIN    = 1.5;     // % per second
  var BATTERY_MAX      = 100;
  var COOLDOWN_NORMAL  = 45;      // seconds
  var CRUISE_ALTITUDE  = 2;       // default Y while piloting
  var RETURN_TIME      = 2;       // seconds to fly back on recall

  // ─── helpers ──────────────────────────────────────────────────────────────

  function _notify(msg, color) {
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup(msg, color || '#ff4400');
    }
  }

  function _dist3(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // ─── mesh builder ─────────────────────────────────────────────────────────

  function _buildDroneMesh() {
    var group = new THREE.Group();

    // Body — black box
    var bodyGeo = new THREE.BoxGeometry(0.5, 0.12, 0.5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // 4 red motor housings at corners
    var motorOffsets = [
      [ 0.28, 0,  0.28],
      [-0.28, 0,  0.28],
      [ 0.28, 0, -0.28],
      [-0.28, 0, -0.28]
    ];
    var blades = [];
    var i;
    for (i = 0; i < 4; i++) {
      var off = motorOffsets[i];

      // Motor housing — red cylinder
      var motorGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 6);
      var motorMat = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
      var motor    = new THREE.Mesh(motorGeo, motorMat);
      motor.position.set(off[0], 0.02, off[2]);
      group.add(motor);

      // Spinning blade — translucent white flat disc
      var bladeGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.01, 6);
      var bladeMat = new THREE.MeshLambertMaterial({
        color       : 0xffffff,
        transparent : true,
        opacity     : 0.6
      });
      var blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.set(off[0], 0.07, off[2]);
      group.add(blade);
      blades.push(blade);
    }

    // Small red LED point-light underneath
    var led = new THREE.PointLight(0xFF0000, 0.5, 1);
    led.position.set(0, -0.08, 0);
    group.add(led);

    return { group: group, blades: blades, led: led };
  }

  // ─── FPV overlay ──────────────────────────────────────────────────────────

  function _createFPVOverlay() {
    if (_fpvBorder) return;

    // Thin black frame border
    _fpvBorder = document.createElement('div');
    _fpvBorder.id = 'fpv-kamikaze-border';
    _fpvBorder.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'bottom:0',
      'border:8px solid rgba(0,0,0,0.85)',
      'pointer-events:none',
      'display:none',
      'z-index:9000',
      'box-sizing:border-box'
    ].join(';');
    document.body.appendChild(_fpvBorder);

    // "FPV DRONE CAM" label
    _fpvLabel = document.createElement('div');
    _fpvLabel.id = 'fpv-kamikaze-label';
    _fpvLabel.style.cssText = [
      'position:fixed',
      'top:14px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ff3300',
      'font:bold 13px/1 monospace',
      'letter-spacing:2px',
      'text-shadow:0 0 6px #ff0000',
      'pointer-events:none',
      'display:none',
      'z-index:9001'
    ].join(';');
    _fpvLabel.textContent = 'FPV DRONE CAM';
    document.body.appendChild(_fpvLabel);

    // Targeting circle crosshair (replaces normal crosshair)
    _fpvCrosshair = document.createElement('div');
    _fpvCrosshair.id = 'fpv-kamikaze-crosshair';
    _fpvCrosshair.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:28px',
      'height:28px',
      'border:2px solid rgba(255,50,0,0.85)',
      'border-radius:50%',
      'pointer-events:none',
      'display:none',
      'z-index:9001',
      'box-sizing:border-box'
    ].join(';');
    // Small centre dot
    var dot = document.createElement('div');
    dot.style.cssText = [
      'position:absolute',
      'top:50%',
      'left:50%',
      'width:4px',
      'height:4px',
      'background:#ff3300',
      'border-radius:50%',
      'transform:translate(-50%,-50%)'
    ].join(';');
    _fpvCrosshair.appendChild(dot);
    document.body.appendChild(_fpvCrosshair);

    // FPV HUD readout (ALT / ENEMY DIST / BAT)
    _fpvHUD = document.createElement('div');
    _fpvHUD.id = 'fpv-kamikaze-hud';
    _fpvHUD.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)',
      'color:#ff4400',
      'font:bold 12px/1.5 monospace',
      'padding:4px 14px',
      'border-radius:5px',
      'border:1px solid #ff440044',
      'pointer-events:none',
      'display:none',
      'z-index:9001',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_fpvHUD);

    // Red targeting box (2D screen overlay — positioned by JS each frame)
    _fpvTargetBox = document.createElement('div');
    _fpvTargetBox.id = 'fpv-kamikaze-targetbox';
    _fpvTargetBox.style.cssText = [
      'position:fixed',
      'border:2px solid #ff0000',
      'pointer-events:none',
      'display:none',
      'z-index:9001',
      'width:40px',
      'height:40px',
      'box-sizing:border-box'
    ].join(';');
    document.body.appendChild(_fpvTargetBox);
  }

  function _showFPVOverlay() {
    if (_fpvBorder)    { _fpvBorder.style.display    = 'block'; }
    if (_fpvLabel)     { _fpvLabel.style.display      = 'block'; }
    if (_fpvCrosshair) { _fpvCrosshair.style.display  = 'block'; }
    if (_fpvHUD)       { _fpvHUD.style.display        = 'block'; }
  }

  function _hideFPVOverlay() {
    if (_fpvBorder)    { _fpvBorder.style.display    = 'none'; }
    if (_fpvLabel)     { _fpvLabel.style.display      = 'none'; }
    if (_fpvCrosshair) { _fpvCrosshair.style.display  = 'none'; }
    if (_fpvHUD)       { _fpvHUD.style.display        = 'none'; }
    if (_fpvTargetBox) { _fpvTargetBox.style.display  = 'none'; }
  }

  function _updateFPVHUD() {
    if (!_fpvHUD || !_drone) return;
    var alt  = _drone.position.y.toFixed(1);
    var bat  = Math.max(0, Math.ceil(_state.battery));
    var dist = _nearestDist < Infinity ? _nearestDist.toFixed(1) + 'u' : '---';
    _fpvHUD.innerHTML =
      'ALT: ' + alt + ' &nbsp;|&nbsp; ENEMY: ' + dist +
      ' &nbsp;|&nbsp; BAT: ' + bat + '%' +
      '<br><span style="font-size:10px;color:#ff8866">' +
      'WASD move &nbsp; Q/E alt &nbsp; CLICK/X detonate &nbsp; Ctrl+K recall' +
      '</span>';
  }

  // ─── cooldown HUD ─────────────────────────────────────────────────────────

  function _createCooldownEl() {
    if (_cooldownEl) return;
    _cooldownEl = document.createElement('div');
    _cooldownEl.id = 'fpv-kamikaze-cooldown';
    _cooldownEl.style.cssText = [
      'position:fixed',
      'bottom:140px',
      'right:18px',
      'background:rgba(0,0,0,0.72)',
      'color:#ff4400',
      'font:bold 13px/1.4 monospace',
      'padding:6px 10px',
      'border-radius:6px',
      'border:1px solid #ff440044',
      'pointer-events:none',
      'display:none',
      'z-index:9999'
    ].join(';');
    document.body.appendChild(_cooldownEl);
  }

  function _updateCooldownEl() {
    if (!_cooldownEl) return;
    if (_state.cooldown > 0 && !_state.active) {
      _cooldownEl.style.display  = 'block';
      _cooldownEl.style.color    = '#ff6600';
      _cooldownEl.textContent    = 'FPV [COOLDOWN] ' + Math.ceil(_state.cooldown) + 's';
    } else {
      _cooldownEl.style.display = 'none';
    }
  }

  // ─── audio ────────────────────────────────────────────────────────────────

  function _startMotorWhine() {
    try {
      if (_motorOscillator) return;
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      _motorOscillator = _audioCtx.createOscillator();
      _motorGain       = _audioCtx.createGain();
      _motorOscillator.type      = 'sawtooth';
      _motorOscillator.frequency.value = 420;   // high-pitched electric whine
      _motorGain.gain.value      = 0.08;
      _motorOscillator.connect(_motorGain);
      _motorGain.connect(_audioCtx.destination);
      _motorOscillator.start();
    } catch (e) {
      // Audio may not be available
    }
  }

  function _stopMotorWhine() {
    try {
      if (_motorOscillator) {
        _motorOscillator.stop();
        _motorOscillator.disconnect();
        _motorOscillator = null;
      }
      if (_motorGain) {
        _motorGain.disconnect();
        _motorGain = null;
      }
      if (_audioCtx) {
        _audioCtx.close();
        _audioCtx = null;
      }
    } catch (e) {
      // ignore
    }
  }

  function _playExplosionBoom() {
    try {
      var ctx  = new (window.AudioContext || window.webkitAudioContext)();
      var buf  = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
      var data = buf.getChannelData(0);
      var j;
      for (j = 0; j < data.length; j++) {
        data[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / data.length, 2);
      }
      var src  = ctx.createBufferSource();
      src.buffer = buf;
      var gain = ctx.createGain();
      gain.gain.value = 1.0;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {
      // ignore
    }
  }

  // ─── enter / exit FPV view ────────────────────────────────────────────────

  function _enterFPV() {
    if (!_drone || !_camera) return;
    _savedCameraPos  = _camera.position.clone();
    _savedCameraQuat = _camera.quaternion.clone();
    _state.piloting  = true;
    window._fpvActive = true;
    _camera.position.copy(_drone.position);
    _createFPVOverlay();
    _showFPVOverlay();
    _startMotorWhine();
    _notify('FPV CAM ACTIVE — WASD fly | Ctrl+K recall | X detonate', '#ff4400');
  }

  function _exitFPV() {
    if (!_camera) return;
    _state.piloting  = false;
    window._fpvActive = false;
    if (_savedCameraPos)  { _camera.position.copy(_savedCameraPos); }
    if (_savedCameraQuat) { _camera.quaternion.copy(_savedCameraQuat); }
    _savedCameraPos  = null;
    _savedCameraQuat = null;
    _hideFPVOverlay();
    _stopMotorWhine();
  }

  // ─── target scanning ──────────────────────────────────────────────────────

  function _scanNearestEnemy() {
    if (!_drone || !_enemies) {
      _nearestEnemy = null;
      _nearestDist  = Infinity;
      return;
    }
    var best     = null;
    var bestDist = Infinity;
    var i;
    for (i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];
      if (!e || e.alive === false || !e.position) continue;
      var d = _dist3(_drone.position, e.position);
      if (d < bestDist) {
        bestDist = d;
        best     = e;
      }
    }
    _nearestEnemy = best;
    _nearestDist  = bestDist;
  }

  // ─── detonation ───────────────────────────────────────────────────────────

  function _detonate(halfDamage) {
    if (!_drone) return;
    var pos = _drone.position.clone();

    // VFX explosion
    if (typeof StageVFX !== 'undefined' && StageVFX.spawnExplosion) {
      StageVFX.spawnExplosion(pos, 2.5);
    }

    // Boom audio
    _playExplosionBoom();

    // Deal damage to nearby enemies
    if (_enemies) {
      var mult = halfDamage ? 0.5 : 1.0;
      var i;
      for (i = 0; i < _enemies.length; i++) {
        var e = _enemies[i];
        if (!e || e.alive === false || !e.position) continue;
        var d = _dist3(pos, e.position);
        var dmg = 0;
        if (d <= 3)  { dmg = DMG_INNER; }
        else if (d <= 6)  { dmg = DMG_MID; }
        else if (d <= 10) { dmg = DMG_OUTER; }
        if (dmg > 0) {
          dmg = Math.round(dmg * mult);
          if (typeof e.takeDamage === 'function') {
            e.takeDamage(dmg);
          } else if (e.hp !== undefined) {
            e.hp -= dmg;
            if (e.hp <= 0) { e.alive = false; }
          }
        }
      }
    }

    _cleanupDrone(halfDamage ? 'DRONE DOWNED — half damage blast' : null);
  }

  // Remove drone mesh and reset state
  function _cleanupDrone(deathMsg) {
    if (_state.piloting) { _exitFPV(); }

    if (_drone) {
      if (_scene) { _scene.remove(_drone.mesh); }
      _drone = null;
    }

    _state.active    = false;
    _state.piloting  = false;
    _state.diving    = false;
    _state.returning = false;
    _diveTarget      = null;
    _returnTimer     = 0;
    _returnStart     = null;
    _returnEnd       = null;
    _nearestEnemy    = null;
    _nearestDist     = Infinity;
    _state.cooldown  = COOLDOWN_NORMAL;
    window._fpvActive = false;

    if (deathMsg) {
      _notify(deathMsg, '#ff2200');
    }
    _updateCooldownEl();
  }

  // ─── launch / recall ──────────────────────────────────────────────────────

  function launch() {
    // Ctrl+K while flying → recall drone
    if (_state.active) {
      _recallDrone();
      return;
    }

    if (_state.cooldown > 0) {
      _notify('FPV DRONE recharging — ' + Math.ceil(_state.cooldown) + 's', '#ff6600');
      return;
    }
    if (!_scene || !_camera) {
      console.warn('[FPVKamikaze] Not initialised — call FPVKamikaze.init(scene, camera) first');
      return;
    }

    var meshData = _buildDroneMesh();

    // Spawn just above and slightly in front of player camera
    var dir      = new THREE.Vector3();
    _camera.getWorldDirection(dir);
    var spawnPos = _camera.position.clone();
    spawnPos.y  += 0.5;
    spawnPos.x  += dir.x * 1.5;
    spawnPos.z  += dir.z * 1.5;

    meshData.group.position.copy(spawnPos);
    _scene.add(meshData.group);

    _drone = {
      mesh     : meshData.group,
      blades   : meshData.blades,
      led      : meshData.led,
      hp       : DRONE_HP,
      position : spawnPos.clone(),
      battery  : BATTERY_MAX,
      yaw      : Math.atan2(dir.x, dir.z)
    };

    _state.active    = true;
    _state.piloting  = false;
    _state.diving    = false;
    _state.returning = false;
    _state.battery   = BATTERY_MAX;
    _state.cooldown  = 0;
    _diveTarget      = null;
    _nearestEnemy    = null;
    _nearestDist     = Infinity;

    _createFPVOverlay();
    _createCooldownEl();

    // Immediately enter FPV
    _enterFPV();

    _notify('FPV KAMIKAZE LAUNCHED — fly and strike!', '#ff4400');
  }

  function _recallDrone() {
    if (!_state.active || !_drone) return;
    if (_state.diving) {
      // Mid-dive — can't abort
      _notify('LOCKED ON — cannot abort dive!', '#ff2200');
      return;
    }

    // Begin 2-second return animation
    _state.returning = true;
    _state.diving    = false;
    _diveTarget      = null;
    _returnTimer     = 0;
    _returnStart     = _drone.position.clone();
    _returnEnd       = _camera.position.clone();

    // Exit FPV immediately so player can see the drone return
    if (_state.piloting) { _exitFPV(); }

    _notify('FPV DRONE returning…', '#ffaa00');
  }

  // ─── self-destonate keybind (X while flying) ──────────────────────────────

  function _selfDetonate() {
    if (!_state.active || !_drone) return;
    if (_state.returning) {
      // Safe landing — no damage
      _cleanupDrone(null);
      _state.cooldown = COOLDOWN_NORMAL;
      _notify('FPV DRONE safely returned.', '#aaffcc');
      return;
    }
    _notify('SELF-DETONATED!', '#ff2200');
    _detonate(false);
  }

  // ─── mouse click while FPV active → begin dive ────────────────────────────

  function _onMouseClick(e) {
    if (!_state.active || !_state.piloting) return;
    if (_state.diving || _state.returning) return;
    e.preventDefault();
    _beginDive();
  }

  function _beginDive() {
    if (!_drone) return;
    // Dive towards nearest enemy if in range, else free-fly into whatever is ahead
    if (_nearestEnemy && _nearestDist <= AUTO_TARGET_RANGE) {
      _diveTarget  = _nearestEnemy;
    } else {
      _diveTarget = null;
    }
    _state.diving   = true;
    // Exit FPV to show the drone diving from outside (optional: could keep FPV)
    // Keep FPV — player watches from drone nose as it dives
    _notify('DIVE INITIATED!', '#ff0000');
  }

  // ─── keyboard handling ────────────────────────────────────────────────────

  function _onKeyDown(e) {
    _keys[e.code] = true;

    // Ctrl+K — launch or recall
    if (e.ctrlKey && (e.code === 'KeyK' || e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      launch();
      return;
    }

    // X — self-destonate in-flight
    if ((e.code === 'KeyX' || e.key === 'x' || e.key === 'X') && _state.active) {
      e.preventDefault();
      _selfDetonate();
      return;
    }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
  }

  // ─── receive mouse delta from game-manager ────────────────────────────────

  function onMouseMove(dx, dy) {
    if (!_state.active || !_state.piloting) return;
    _state.mouseDeltaX += dx;
    _state.mouseDeltaY += dy;
  }

  // ─── target box (2D screen-space) ─────────────────────────────────────────

  function _updateTargetBox() {
    if (!_fpvTargetBox) return;
    if (!_nearestEnemy || _nearestDist > AUTO_TARGET_RANGE || !_state.piloting) {
      _fpvTargetBox.style.display = 'none';
      return;
    }

    // Project enemy position to screen
    if (!_camera || !_nearestEnemy.position) {
      _fpvTargetBox.style.display = 'none';
      return;
    }

    var screenW = window.innerWidth;
    var screenH = window.innerHeight;

    // Build projection manually using camera matrices
    var pos = _nearestEnemy.position.clone();
    pos.project(_camera);

    if (pos.z > 1 || pos.z < -1) {
      _fpvTargetBox.style.display = 'none';
      return;
    }

    var sx = (pos.x * 0.5 + 0.5) * screenW;
    var sy = (1 - (pos.y * 0.5 + 0.5)) * screenH;

    _fpvTargetBox.style.display = 'block';
    _fpvTargetBox.style.left    = Math.round(sx - 20) + 'px';
    _fpvTargetBox.style.top     = Math.round(sy - 20) + 'px';
  }

  // ─── damage (called externally when projectile hits drone) ────────────────

  function takeDamage(amount) {
    if (!_state.active || !_drone) return;
    _drone.hp -= (amount || 10);
    if (_drone.hp <= 0) {
      _notify('DRONE SHOT DOWN — crash detonation!', '#ff2200');
      _detonate(true); // half damage on crash
    }
  }

  // ─── init ─────────────────────────────────────────────────────────────────

  function init(scene, camera, enemies) {
    _scene   = scene;
    _camera  = camera;
    _enemies = enemies || null;

    _createFPVOverlay();
    _createCooldownEl();

    // Key listeners (guard double-registration)
    if (!window._fpvKamikazeKeyBound) {
      window.addEventListener('keydown', _onKeyDown, false);
      window.addEventListener('keyup',   _onKeyUp,   false);
      window.addEventListener('click',   _onMouseClick, false);
      window._fpvKamikazeKeyBound = true;
    }

    window._fpvActive = false;
  }

  // ─── update (called every frame from game-manager) ────────────────────────

  function update(delta) {
    // Cooldown tick when idle
    if (!_state.active) {
      if (_state.cooldown > 0) {
        _state.cooldown = Math.max(0, _state.cooldown - delta);
        _updateCooldownEl();
      }
      return;
    }

    if (!_drone) return;

    var nowMs = (typeof performance !== 'undefined') ? performance.now() : Date.now();

    // ── Spin blades ──
    var BLADE_SPEED = 18; // rad/s
    var b;
    for (b = 0; b < _drone.blades.length; b++) {
      _drone.blades[b].rotation.y += BLADE_SPEED * delta;
    }

    // ── Battery drain ──
    _state.battery -= BATTERY_DRAIN * delta;
    if (_state.battery <= 0) {
      _state.battery = 0;
      _notify('FPV DRONE BATTERY DEAD — crash!', '#ff4400');
      _detonate(true); // half-damage crash
      return;
    }

    // ── Returning animation ──
    if (_state.returning) {
      _returnTimer += delta;
      var t = Math.min(1, _returnTimer / RETURN_TIME);

      // Lerp drone position from start back to player
      var lerped = new THREE.Vector3();
      lerped.lerpVectors(_returnStart, _returnEnd, t);
      _drone.position.copy(lerped);
      _drone.mesh.position.copy(lerped);

      if (t >= 1) {
        // Landed safely
        if (_scene) { _scene.remove(_drone.mesh); }
        _drone = null;
        _state.active    = false;
        _state.returning = false;
        _state.cooldown  = COOLDOWN_NORMAL;
        _returnTimer     = 0;
        _returnStart     = null;
        _returnEnd       = null;
        window._fpvActive = false;
        _notify('FPV DRONE safely landed — ' + COOLDOWN_NORMAL + 's cooldown', '#aaffcc');
        _updateCooldownEl();
      }
      return;
    }

    // ── Dive mode ──
    if (_state.diving) {
      var diveDir = new THREE.Vector3();

      if (_diveTarget && _diveTarget.position) {
        diveDir.subVectors(_diveTarget.position, _drone.position).normalize();
        // Check detonation range
        var distToTarget = _dist3(_drone.position, _diveTarget.position);
        if (distToTarget <= DETONATE_RANGE) {
          _detonate(false);
          return;
        }
      } else {
        // No target — dive forward in camera direction
        _camera.getWorldDirection(diveDir);
      }

      _drone.position.addScaledVector(diveDir, DIVE_SPEED * delta);
      _drone.mesh.position.copy(_drone.position);

      // Update FPV camera to follow nose
      if (_state.piloting && _camera) {
        _camera.position.copy(_drone.position);
        if (_diveTarget && _diveTarget.position) {
          _camera.lookAt(_diveTarget.position);
        } else {
          var ahead = _drone.position.clone().addScaledVector(diveDir, 5);
          _camera.lookAt(ahead);
        }
      }

      _updateFPVHUD();
      return;
    }

    // ── Normal FPV flight ──
    if (_state.piloting && _camera) {
      // Mouse look — yaw drone left/right
      var sensitivityH = 0.002;
      var sensitivityV = 0.002;
      var yawDelta   = _state.mouseDeltaX * sensitivityH;
      _state.mouseDeltaX = 0;
      _state.mouseDeltaY = 0;

      _drone.yaw -= yawDelta;

      // Forward / back / strafe from WASD
      var moveSpeed = DRONE_SPEED * delta;
      var yaw       = _drone.yaw;
      var fwdX      = Math.sin(yaw);
      var fwdZ      = Math.cos(yaw);
      var rightX    = Math.cos(yaw);
      var rightZ    = -Math.sin(yaw);

      if (_keys['KeyW'] || _keys['ArrowUp']) {
        _drone.position.x += fwdX * moveSpeed;
        _drone.position.z += fwdZ * moveSpeed;
      }
      if (_keys['KeyS'] || _keys['ArrowDown']) {
        _drone.position.x -= fwdX * moveSpeed;
        _drone.position.z -= fwdZ * moveSpeed;
      }
      if (_keys['KeyA'] || _keys['ArrowLeft']) {
        _drone.position.x -= rightX * moveSpeed;
        _drone.position.z -= rightZ * moveSpeed;
      }
      if (_keys['KeyD'] || _keys['ArrowRight']) {
        _drone.position.x += rightX * moveSpeed;
        _drone.position.z += rightZ * moveSpeed;
      }

      // Q/E altitude
      if (_keys['KeyQ']) {
        _drone.position.y = Math.max(0.5, _drone.position.y - moveSpeed);
      }
      if (_keys['KeyE']) {
        _drone.position.y = Math.min(30, _drone.position.y + moveSpeed);
      }

      // Drift back to cruise altitude when neither Q nor E held
      if (!_keys['KeyQ'] && !_keys['KeyE']) {
        var altDiff = CRUISE_ALTITUDE - _drone.position.y;
        _drone.position.y += altDiff * Math.min(1, delta * 2);
      }

      // Update camera to drone position, looking along yaw
      _camera.position.copy(_drone.position);
      var lookAhead = new THREE.Vector3(
        _drone.position.x + fwdX * 5,
        _drone.position.y,
        _drone.position.z + fwdZ * 5
      );
      _camera.lookAt(lookAhead);
    }

    // Sync mesh
    _drone.mesh.position.copy(_drone.position);
    // Slight hover bob (only when not diving)
    _drone.mesh.position.y += Math.sin(nowMs * 0.004) * 0.02;
    // Rotate mesh to match yaw
    _drone.mesh.rotation.y = _drone.yaw;

    // ── Scan nearest enemy ──
    _scanNearestEnemy();

    // ── Auto-target lock: dive if within DETONATE_RANGE automatically ──
    if (_nearestEnemy && _nearestDist <= DETONATE_RANGE && !_state.diving) {
      _diveTarget    = _nearestEnemy;
      _state.diving  = true;
    }

    // ── Target box overlay ──
    _updateTargetBox();

    // ── FPV HUD update ──
    _updateFPVHUD();
  }

  // ─── reset (called on game restart) ──────────────────────────────────────

  function reset() {
    if (_drone) {
      if (_state.piloting) { _exitFPV(); }
      if (_scene) { _scene.remove(_drone.mesh); }
      _drone = null;
    }

    _stopMotorWhine();
    _hideFPVOverlay();

    _state.active    = false;
    _state.piloting  = false;
    _state.diving    = false;
    _state.returning = false;
    _state.battery   = BATTERY_MAX;
    _state.cooldown  = 0;
    _state.mouseDeltaX = 0;
    _state.mouseDeltaY = 0;

    _diveTarget   = null;
    _returnTimer  = 0;
    _returnStart  = null;
    _returnEnd    = null;
    _nearestEnemy = null;
    _nearestDist  = Infinity;

    _savedCameraPos  = null;
    _savedCameraQuat = null;

    window._fpvActive = false;

    _updateCooldownEl();
  }

  // ─── public API ──────────────────────────────────────────────────────────
  return {
    init        : init,
    update      : update,
    launch      : launch,
    reset       : reset,
    takeDamage  : takeDamage,
    onMouseMove : onMouseMove,
    isActive    : function () { return _state.active; },
    isPiloting  : function () { return _state.piloting; }
  };
}());
