// combat-drone.js — Deployable micro-drone with FPV camera, recon, and attack
// Controls: C=deploy, D=recall, WASD=fly (FPV), Space=ascend, Ctrl=descend,
//           R=return to operator, A=attack (dive at target)
// Pure browser JS — no imports, THREE is a global

window.CombatDrone = (function () {
  'use strict';

  // ── Constants ────────────────────────────────────────────────────────────────
  var BATTERY_MAX      = 90;    // seconds of flight time
  var BATTERY_LOW_PCT  = 0.20;  // auto-return at 20%
  var MAX_ALTITUDE     = 25;    // units
  var MAX_RANGE        = 60;    // units before forced recall
  var DRONE_HP         = 30;
  var DRONE_SPEED      = 8;     // units/sec
  var ROTOR_SPIN       = 40;    // rad/sec
  var RECON_RADIUS     = 20;    // units
  var ATTACK_RADIUS    = 3;     // explosion blast radius
  var ATTACK_DAMAGE    = 80;    // HP
  var SHOOT_CHANCE     = 0.05;  // 5% per second enemy shoots at drone
  var FPV_W            = 320;
  var FPV_H            = 200;

  // ── State ────────────────────────────────────────────────────────────────────
  var _scene           = null;
  var _mainCamera      = null;
  var _playerRef       = null;   // { position: THREE.Vector3 }

  var _drone           = null;   // drone object when deployed
  var _deployed        = false;
  var _battery         = BATTERY_MAX;
  var _returning       = false;
  var _attackMode      = false;
  var _attackTarget    = null;
  var _payload         = null;   // { mesh, pos, vel, active }
  var _payloadUsed     = false;

  var _fpvCamera       = null;
  var _fpvRenderer     = null;
  var _fpvCanvas       = null;
  var _fpvContainer    = null;
  var _hudEl           = null;

  var _reconTagged     = [];
  var _reconMarkers    = [];    // { mesh, enemy }

  var _keysDown        = {};
  var _enemyShootTimer = 0;

  // ── Build Drone Mesh ─────────────────────────────────────────────────────────
  function _buildDroneMesh() {
    var group = new THREE.Group();

    // Body — BoxGeometry 0.6 × 0.15 × 0.6, dark gray
    var bodyGeo = new THREE.BoxGeometry(0.6, 0.15, 0.6);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Camera ball — SphereGeometry 0.12, red, front-centre
    var camGeo = new THREE.SphereGeometry(0.12, 8, 8);
    var camMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    var camBall = new THREE.Mesh(camGeo, camMat);
    camBall.position.set(0, 0, -0.32);
    group.add(camBall);

    // 4 motor arms at 45° angles with rotors
    var armMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var rotorMat = new THREE.MeshBasicMaterial({ color: 0x88aacc, transparent: true, opacity: 0.45 });

    group.userData.rotors = [];

    var armAngles = [
      Math.PI / 4,
      3 * Math.PI / 4,
      5 * Math.PI / 4,
      7 * Math.PI / 4
    ];

    for (var i = 0; i < 4; i++) {
      var angle = armAngles[i];
      var ax = Math.cos(angle) * 0.38;
      var az = Math.sin(angle) * 0.38;

      // Arm
      var armGeo = new THREE.BoxGeometry(0.05, 0.04, 0.38);
      var arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(ax * 0.5, 0.02, az * 0.5);
      arm.rotation.y = angle;
      group.add(arm);

      // Rotor disc — CylinderGeometry, radius 0.25, very thin
      var rotorGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.02, 10);
      var rotor = new THREE.Mesh(rotorGeo, rotorMat);
      rotor.position.set(ax, 0.05, az);
      group.add(rotor);
      group.userData.rotors.push(rotor);
    }

    // Running light
    var light = new THREE.PointLight(0x00ff44, 1.2, 4);
    light.position.set(0, 0.2, 0);
    group.add(light);

    return group;
  }

  // ── FPV Camera & Renderer ────────────────────────────────────────────────────
  function _buildFpvDisplay() {
    // Container div — top-right corner
    _fpvContainer = document.createElement('div');
    _fpvContainer.id = 'combat-drone-fpv';
    _fpvContainer.style.cssText = [
      'position:fixed',
      'top:10px',
      'right:10px',
      'width:' + FPV_W + 'px',
      'height:' + FPV_H + 'px',
      'border:2px solid #00ff44',
      'border-radius:4px',
      'overflow:hidden',
      'z-index:9000',
      'display:none',
      'background:#000',
      'box-shadow:0 0 12px #00ff44'
    ].join(';');

    // Scanline overlay using pseudo-element equivalent: repeating linear gradient
    _fpvContainer.style.backgroundImage =
      'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.18) 3px,rgba(0,0,0,0.18) 4px)';

    _fpvCanvas = document.createElement('canvas');
    _fpvCanvas.width = FPV_W;
    _fpvCanvas.height = FPV_H;
    _fpvCanvas.style.cssText = 'width:100%;height:100%;display:block;';
    _fpvContainer.appendChild(_fpvCanvas);

    // "FPV" label
    var label = document.createElement('div');
    label.style.cssText = [
      'position:absolute',
      'top:4px',
      'left:6px',
      'color:#00ff44',
      'font-family:monospace',
      'font-size:10px',
      'letter-spacing:1px',
      'pointer-events:none',
      'text-shadow:0 0 4px #00ff44'
    ].join(';');
    label.textContent = 'FPV DRONE CAM';
    _fpvContainer.appendChild(label);

    document.body.appendChild(_fpvContainer);

    // FPV Camera
    _fpvCamera = new THREE.PerspectiveCamera(80, FPV_W / FPV_H, 0.05, 200);

    // FPV Renderer
    _fpvRenderer = new THREE.WebGLRenderer({ canvas: _fpvCanvas, antialias: false });
    _fpvRenderer.setSize(FPV_W, FPV_H);
    _fpvRenderer.setPixelRatio(1);
  }

  // ── HUD ─────────────────────────────────────────────────────────────────────
  function _buildHud() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'combat-drone-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)',
      'border:1px solid #00ff44',
      'color:#00ff44',
      'font-family:monospace',
      'font-size:11px',
      'padding:5px 12px',
      'border-radius:4px',
      'z-index:9001',
      'pointer-events:none',
      'display:none',
      'white-space:nowrap',
      'letter-spacing:0.5px'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHud() {
    if (!_hudEl || !_deployed || !_drone) {
      if (_hudEl) _hudEl.style.display = 'none';
      return;
    }

    var battPct = Math.max(0, Math.floor((_battery / BATTERY_MAX) * 100));
    var signalStr = _getSignalStrength();
    var rangem = _drone ? Math.round(_getDroneRange()) : 0;

    var battColor = battPct > 50 ? '#00ff44' : (battPct > 20 ? '#ffaa00' : '#ff4444');
    var sigColor  = signalStr === 'STRONG' ? '#00ff44' : (signalStr === 'WEAK' ? '#ffaa00' : '#ff4444');

    _hudEl.style.display = 'block';
    _hudEl.innerHTML =
      'DRONE [<span style="color:' + battColor + '">BATT: ' + battPct + '%</span>] ' +
      '[<span style="color:' + sigColor + '">SIGNAL: ' + signalStr + '</span>] ' +
      '[RANGE: ' + rangem + 'm] ' +
      (_attackMode ? '<span style="color:#ff4444">| A=FIRE </span>' : '') +
      '| WASD=fly, R=return, A=attack';
  }

  // ── Signal Strength ──────────────────────────────────────────────────────────
  function _getSignalStrength() {
    // Check for EW jamming
    var jamming = (typeof window.ElectronicWarfare !== 'undefined' &&
                   typeof window.ElectronicWarfare.isJamming === 'function' &&
                   window.ElectronicWarfare.isJamming()) ||
                  (typeof window._ewJammingActive !== 'undefined' && window._ewJammingActive);

    if (jamming) return 'JAMMED';

    var dist = _getDroneRange();
    if (dist < 20) return 'STRONG';
    if (dist < 40) return 'GOOD';
    return 'WEAK';
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function _getDroneRange() {
    if (!_drone || !_drone.mesh || !_playerRef) return 0;
    var p = _playerRef.position;
    var d = _drone.mesh.position;
    var dx = d.x - p.x;
    var dy = d.y - p.y;
    var dz = d.z - p.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _getPlayerPos() {
    if (_playerRef && _playerRef.position) return _playerRef.position;
    // Fallback: try GameManager
    if (typeof window.GameManager !== 'undefined' && window.GameManager.getPlayer) {
      var pl = window.GameManager.getPlayer();
      if (pl && pl.position) return pl.position;
    }
    return new THREE.Vector3(0, 2, 0);
  }

  // ── Deploy / Recall ──────────────────────────────────────────────────────────
  function _deploy() {
    if (_deployed) {
      _notifyHud('DRONE ALREADY DEPLOYED', '#ffaa00');
      return;
    }
    if (_payloadUsed && _battery <= 0) {
      _notifyHud('DRONE EXPENDED — no payload, no battery', '#ff4444');
      return;
    }

    var pp = _getPlayerPos();
    var mesh = _buildDroneMesh();
    mesh.position.set(pp.x, pp.y + 2, pp.z);

    if (_scene) _scene.add(mesh);

    _drone = {
      mesh: mesh,
      hp: DRONE_HP,
      maxHp: DRONE_HP,
      hoverBob: 0
    };

    _deployed     = true;
    _returning    = false;
    _attackMode   = false;
    _attackTarget = null;
    _payload      = null;
    _payloadUsed  = false;

    if (_fpvContainer) _fpvContainer.style.display = 'block';
    _notifyHud('DRONE DEPLOYED — ' + Math.round(_battery) + 's battery', '#00ff44');

    // Init recon array
    if (!window._reconTagged) window._reconTagged = [];
    _reconTagged = window._reconTagged;
  }

  function _recall() {
    if (!_deployed || !_drone) return;
    _destroyDrone(false);
    _notifyHud('DRONE RECALLED', '#ffaa00');
  }

  function _destroyDrone(destroyed) {
    if (_drone && _drone.mesh && _scene) {
      _scene.remove(_drone.mesh);
    }
    _drone = null;
    _deployed = false;
    _returning = false;
    _attackMode = false;
    _attackTarget = null;

    // Clean up payload
    if (_payload && _payload.mesh && _scene) {
      _scene.remove(_payload.mesh);
    }
    _payload = null;

    // Clean up recon markers
    for (var i = 0; i < _reconMarkers.length; i++) {
      if (_reconMarkers[i].mesh && _scene) _scene.remove(_reconMarkers[i].mesh);
    }
    _reconMarkers = [];

    if (_fpvContainer) _fpvContainer.style.display = 'none';

    if (destroyed) {
      _notifyHud('DRONE DESTROYED!', '#ff4444');
      _battery = 0;
    }
  }

  // ── Notify HUD ───────────────────────────────────────────────────────────────
  function _notifyHud(msg, color) {
    if (typeof window.HUD !== 'undefined' && window.HUD.notifyPickup) {
      window.HUD.notifyPickup(msg, color || '#00ff44');
    }
  }

  // ── Recon — tag enemies within radius ────────────────────────────────────────
  function _doRecon() {
    if (!_deployed || !_drone || !_drone.mesh) return;

    var enemies = [];
    if (typeof window.Enemies !== 'undefined' && window.Enemies.getAll) {
      enemies = window.Enemies.getAll();
    }

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.mesh || (e.hp !== undefined && e.hp <= 0) || !e.alive) continue;

      var ep = e.mesh.position;
      var dp = _drone.mesh.position;
      var dx = ep.x - dp.x;
      var dy = ep.y - dp.y;
      var dz = ep.z - dp.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist > RECON_RADIUS) continue;

      // Add to recon tagged array if not already
      var alreadyTagged = false;
      for (var j = 0; j < _reconTagged.length; j++) {
        if (_reconTagged[j] === e) { alreadyTagged = true; break; }
      }
      if (!alreadyTagged) {
        _reconTagged.push(e);
        window._reconTagged = _reconTagged;

        // Spawn a marker above the enemy
        var markerGeo = new THREE.SphereGeometry(0.2, 6, 6);
        var markerMat = new THREE.MeshBasicMaterial({ color: 0xff8800 });
        var markerMesh = new THREE.Mesh(markerGeo, markerMat);
        markerMesh.position.set(ep.x, ep.y + 2.2, ep.z);
        if (_scene) _scene.add(markerMesh);
        _reconMarkers.push({ mesh: markerMesh, enemy: e });
      }
    }

    // Remove markers for dead enemies
    for (var k = _reconMarkers.length - 1; k >= 0; k--) {
      var rm = _reconMarkers[k];
      if (!rm.enemy || (rm.enemy.hp !== undefined && rm.enemy.hp <= 0) || !rm.enemy.alive) {
        if (rm.mesh && _scene) _scene.remove(rm.mesh);
        _reconMarkers.splice(k, 1);
      } else {
        // Keep marker on enemy
        rm.mesh.position.set(
          rm.enemy.mesh.position.x,
          rm.enemy.mesh.position.y + 2.2,
          rm.enemy.mesh.position.z
        );
      }
    }
  }

  // ── Attack — dive at target ───────────────────────────────────────────────────
  function _findNearestEnemy() {
    if (!_drone || !_drone.mesh) return null;
    var enemies = [];
    if (typeof window.Enemies !== 'undefined' && window.Enemies.getAll) {
      enemies = window.Enemies.getAll();
    }
    var nearest = null;
    var nearestDist = Infinity;
    var dp = _drone.mesh.position;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.mesh || (e.hp !== undefined && e.hp <= 0) || !e.alive) continue;
      var ep = e.mesh.position;
      var dx = ep.x - dp.x;
      var dy = ep.y - dp.y;
      var dz = ep.z - dp.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = e;
      }
    }
    return nearest;
  }

  function _launchAttack() {
    if (!_deployed || !_drone || _payloadUsed) {
      _notifyHud('NO PAYLOAD REMAINING', '#ff4444');
      return;
    }
    _attackTarget = _findNearestEnemy();
    if (!_attackTarget) {
      _notifyHud('NO TARGET IN RANGE', '#ffaa00');
      return;
    }
    _attackMode = true;
    _notifyHud('ATTACK! DIVING AT TARGET', '#ff4444');

    // Detach explosive payload — SphereGeometry
    var payGeo = new THREE.SphereGeometry(0.18, 6, 6);
    var payMat = new THREE.MeshLambertMaterial({ color: 0x886600 });
    var payMesh = new THREE.Mesh(payGeo, payMat);
    payMesh.position.copy(_drone.mesh.position);
    payMesh.position.y -= 0.2;
    if (_scene) _scene.add(payMesh);

    // Arc trajectory: initial velocity upward then toward target
    var dp = _drone.mesh.position;
    var ep = _attackTarget.mesh.position;
    var dx = ep.x - dp.x;
    var dz = ep.z - dp.z;
    var hDist = Math.sqrt(dx * dx + dz * dz);
    var tFlight = Math.max(0.8, hDist / 10);

    _payload = {
      mesh: payMesh,
      vel: new THREE.Vector3(
        dx / tFlight,
        4,   // initial upward arc
        dz / tFlight
      ),
      active: true,
      timer: 0
    };
  }

  function _updatePayload(delta) {
    if (!_payload || !_payload.active) return;

    _payload.timer += delta;
    // Gravity
    _payload.vel.y -= 9.8 * delta;
    _payload.mesh.position.addScaledVector(_payload.vel, delta);

    // Check if it hit the target or ground
    var explode = false;
    var blastPos = _payload.mesh.position.clone();

    if (_attackTarget && _attackTarget.mesh) {
      var tp = _attackTarget.mesh.position;
      var dx = tp.x - blastPos.x;
      var dy = tp.y - blastPos.y;
      var dz = tp.z - blastPos.z;
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 1.5) explode = true;
    }

    if (_payload.mesh.position.y < 0.5) explode = true;
    if (_payload.timer > 5) explode = true;

    if (explode) {
      _detonatePayload(blastPos);
    }
  }

  function _detonatePayload(pos) {
    if (!_payload) return;

    // Damage enemies in blast radius
    if (typeof window.Enemies !== 'undefined' && window.Enemies.getAll) {
      var enemies = window.Enemies.getAll();
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (!e || !e.mesh || !e.alive) continue;
        var ep = e.mesh.position;
        var dx = ep.x - pos.x;
        var dy = ep.y - pos.y;
        var dz = ep.z - pos.z;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < ATTACK_RADIUS) {
          var dmg = Math.round(ATTACK_DAMAGE * (1 - dist / ATTACK_RADIUS));
          if (e.hp !== undefined) e.hp -= dmg;
          if (typeof window.Enemies.damage === 'function') {
            try { window.Enemies.damage(e, dmg, false, 'DRONE'); } catch (_e) {}
          }
        }
      }
    }

    // Explosion visuals
    if (typeof window.Tracers !== 'undefined') {
      if (window.Tracers.spawnExplosion) window.Tracers.spawnExplosion(pos, ATTACK_RADIUS);
      else if (window.Tracers.spawnSmoke) window.Tracers.spawnSmoke(pos);
    }

    if (typeof window.Feedback !== 'undefined' && window.Feedback.screenShake) {
      window.Feedback.screenShake(0.6);
    }

    // Remove payload mesh
    if (_payload.mesh && _scene) _scene.remove(_payload.mesh);
    _payload = null;
    _payloadUsed = true;
    _attackMode = false;
    _attackTarget = null;

    // Drone is consumed
    _notifyHud('PAYLOAD DETONATED — DRONE EXPENDED', '#ff4444');
    _destroyDrone(false);
  }

  // ── Enemy Shooting at Drone ───────────────────────────────────────────────────
  function _updateEnemyFire(delta, enemies) {
    if (!_deployed || !_drone) return;
    _enemyShootTimer += delta;
    if (_enemyShootTimer < 1.0) return;
    _enemyShootTimer = 0;

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.mesh || (e.hp !== undefined && e.hp <= 0) || !e.alive) continue;

      var ep = e.mesh.position;
      var dp = _drone.mesh.position;
      var dx = dp.x - ep.x;
      var dy = dp.y - ep.y;
      var dz = dp.z - ep.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist > 40) continue; // too far to shoot

      if (Math.random() < SHOOT_CHANCE) {
        // Enemy hits the drone
        var dmg = 5 + Math.floor(Math.random() * 8);
        _drone.hp -= dmg;
        if (typeof window.HUD !== 'undefined' && window.HUD.notifyPickup) {
          window.HUD.notifyPickup('DRONE TAKING FIRE! HP: ' + _drone.hp + '/' + _drone.maxHp, '#ff4444');
        }
        if (_drone.hp <= 0) {
          _notifyHud('DRONE DESTROYED BY ENEMY FIRE!', '#ff4444');
          _destroyDrone(true);
          return;
        }
      }
    }
  }

  // ── Key Handlers ─────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    _keysDown[e.code] = true;
    _keysDown[e.key] = true;

    // C — deploy
    if (e.code === 'KeyC' && !e.repeat) {
      _deploy();
    }
    // D — recall
    if (e.code === 'KeyD' && !_deployed && !e.repeat) {
      // D only recalls when not in FPV (in FPV D is strafe-right)
      _recall();
    }
    // R — return to operator
    if (e.code === 'KeyR' && _deployed && !e.repeat) {
      _returning = !_returning;
      _notifyHud(_returning ? 'RETURNING TO OPERATOR' : 'MANUAL CONTROL', '#00ff88');
    }
    // A — attack mode (only when deployed)
    if (e.code === 'KeyA' && _deployed && !_payloadUsed && !e.repeat) {
      if (!_attackMode) {
        _launchAttack();
      }
    }
  }

  function _onKeyUp(e) {
    _keysDown[e.code] = false;
    _keysDown[e.key] = false;
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init(scene, camera, playerRef) {
    _scene      = scene;
    _mainCamera = camera;
    _playerRef  = playerRef || null;

    _buildFpvDisplay();
    _buildHud();

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup', _onKeyUp);

    if (!window._reconTagged) window._reconTagged = [];
    _reconTagged = window._reconTagged;
  }

  // ── Update ────────────────────────────────────────────────────────────────────
  function update(delta, enemies) {
    enemies = enemies || [];

    if (!_deployed || !_drone || !_drone.mesh) {
      _updateHud();
      return;
    }

    // Battery drain
    _battery -= delta;
    if (_battery <= 0) {
      _battery = 0;
      _notifyHud('DRONE BATTERY DEAD — EMERGENCY RETURN', '#ff4444');
      _recall();
      return;
    }

    // Auto-return at low battery
    if (_battery / BATTERY_MAX <= BATTERY_LOW_PCT && !_returning) {
      _returning = true;
      _notifyHud('LOW BATTERY — AUTO-RETURNING', '#ffaa00');
    }

    var pp = _getPlayerPos();
    var mesh = _drone.mesh;
    var pos = mesh.position;

    // Check range
    var rangeDist = _getDroneRange();
    if (rangeDist > MAX_RANGE) {
      _returning = true;
      _notifyHud('MAX RANGE EXCEEDED — RETURNING', '#ffaa00');
    }

    // Movement
    var moveX = 0;
    var moveY = 0;
    var moveZ = 0;

    if (_returning) {
      // Auto-pilot back to player
      var rx = pp.x - pos.x;
      var ry = (pp.y + 2) - pos.y;
      var rz = pp.z - pos.z;
      var rd = Math.sqrt(rx * rx + ry * ry + rz * rz);
      if (rd < 1.5) {
        // Arrived
        _recall();
        return;
      }
      var rspd = DRONE_SPEED * 0.8;
      moveX = (rx / rd) * rspd;
      moveY = (ry / rd) * rspd;
      moveZ = (rz / rd) * rspd;
    } else if (_attackMode && _attackTarget && _attackTarget.mesh) {
      // Dive at target
      var tp = _attackTarget.mesh.position;
      var tdx = tp.x - pos.x;
      var tdy = tp.y - pos.y;
      var tdz = tp.z - pos.z;
      var td = Math.sqrt(tdx * tdx + tdy * tdy + tdz * tdz);
      if (td > 1.0) {
        var dspd = DRONE_SPEED * 1.5;
        moveX = (tdx / td) * dspd;
        moveY = (tdy / td) * dspd;
        moveZ = (tdz / td) * dspd;
      }
    } else {
      // FPV manual control — WASD + Space/Ctrl
      // Get player/camera yaw for relative movement
      var yaw = 0;
      if (typeof window.CameraSystem !== 'undefined' && window.CameraSystem.getYaw) {
        yaw = window.CameraSystem.getYaw();
      } else if (_mainCamera) {
        // Extract yaw from main camera euler
        yaw = _mainCamera.rotation.y;
      }
      var fwdX = -Math.sin(yaw);
      var fwdZ = -Math.cos(yaw);
      var rgtX = Math.cos(yaw);
      var rgtZ = -Math.sin(yaw);

      if (_keysDown['KeyW'] || _keysDown['w']) { moveX += fwdX * DRONE_SPEED; moveZ += fwdZ * DRONE_SPEED; }
      if (_keysDown['KeyS'] || _keysDown['s']) { moveX -= fwdX * DRONE_SPEED; moveZ -= fwdZ * DRONE_SPEED; }
      // Note: D key is strafe right when deployed (not recall)
      if (_keysDown['KeyA'] && _attackMode === false) { moveX -= rgtX * DRONE_SPEED; moveZ -= rgtZ * DRONE_SPEED; }
      if (_keysDown['KeyD'] || _keysDown['d']) { moveX += rgtX * DRONE_SPEED; moveZ += rgtZ * DRONE_SPEED; }
      if (_keysDown['Space'] || _keysDown[' ']) { moveY += DRONE_SPEED * 0.6; }
      if (_keysDown['ControlLeft'] || _keysDown['Control']) { moveY -= DRONE_SPEED * 0.6; }
    }

    // Enforce max altitude
    if (pos.y + moveY * delta > MAX_ALTITUDE) {
      moveY = 0;
      pos.y = Math.min(pos.y, MAX_ALTITUDE);
    }

    // Enforce minimum altitude (don't go underground)
    var terrainH = 0;
    if (typeof window.VoxelWorld !== 'undefined' && window.VoxelWorld.getTerrainHeight) {
      terrainH = window.VoxelWorld.getTerrainHeight(pos.x, pos.z) + 0.5;
    }
    if (pos.y + moveY * delta < terrainH) {
      moveY = 0;
      pos.y = Math.max(pos.y, terrainH);
    }

    // Apply movement
    pos.x += moveX * delta;
    pos.y += moveY * delta;
    pos.z += moveZ * delta;

    // Hover bob when stationary
    _drone.hoverBob += delta * 1.5;
    if (Math.abs(moveX) < 0.01 && Math.abs(moveZ) < 0.01) {
      pos.y += Math.sin(_drone.hoverBob) * 0.03;
    }

    // Slight tilt based on movement
    mesh.rotation.z = -moveX * 0.04;
    mesh.rotation.x =  moveZ * 0.04;

    // Face movement direction
    if (Math.abs(moveX) > 0.1 || Math.abs(moveZ) > 0.1) {
      mesh.rotation.y = Math.atan2(moveX, moveZ);
    }

    // Spin rotors
    if (mesh.userData.rotors) {
      for (var ri = 0; ri < mesh.userData.rotors.length; ri++) {
        mesh.userData.rotors[ri].rotation.y += ROTOR_SPIN * delta;
      }
    }

    // Update FPV camera position
    if (_fpvCamera) {
      _fpvCamera.position.copy(pos);
      _fpvCamera.position.y += 0.05;
      _fpvCamera.rotation.copy(mesh.rotation);
      _fpvCamera.rotation.x -= 0.1; // slight downward tilt for FPV feel
    }

    // Recon scan
    _doRecon();

    // Enemy fire
    _updateEnemyFire(delta, enemies);

    // Payload in-flight update
    _updatePayload(delta);

    // Update HUD
    _updateHud();

    // Render FPV view
    _renderFpv();
  }

  // ── FPV Render ────────────────────────────────────────────────────────────────
  function _renderFpv() {
    if (!_fpvRenderer || !_fpvCamera || !_scene || !_deployed) return;

    // Temporarily hide the drone's own mesh so it doesn't obscure the FPV view
    var meshVisible = true;
    if (_drone && _drone.mesh) {
      meshVisible = _drone.mesh.visible;
      _drone.mesh.visible = false;
    }

    _fpvRenderer.render(_scene, _fpvCamera);

    if (_drone && _drone.mesh) {
      _drone.mesh.visible = meshVisible;
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────────
  function reset() {
    _destroyDrone(false);

    _battery      = BATTERY_MAX;
    _payloadUsed  = false;
    _keysDown     = {};
    _enemyShootTimer = 0;
    _reconTagged  = [];
    window._reconTagged = [];

    if (_fpvContainer) _fpvContainer.style.display = 'none';
    if (_hudEl) _hudEl.style.display = 'none';

    window.removeEventListener('keydown', _onKeyDown);
    window.removeEventListener('keyup', _onKeyUp);
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    reset: reset
  };

}());
