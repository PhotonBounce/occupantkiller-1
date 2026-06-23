/* ───────────────────────────────────────────────────────────────────────────
   black-ops-extraction.js — Black Ops Extraction Mini-Game
   API: window.BlackOpsExtraction = { init, update, reset }
   Controls:
     B + X (simultaneous, 400ms window) → activate mission
     W / A / S / D  → move player
     Mouse          → look / aim
     E              → subdue HVT (when within 2 units) / board helicopter rope
     H              → call extraction helicopter
     F              → drive jeep (when near gate)
     Space / Click  → shoot
   ─────────────────────────────────────────────────────────────────────────── */
window.BlackOpsExtraction = (function () {
  'use strict';

  /* ── Scene references ───────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Game state ─────────────────────────────────────────────────────────── */
  var _active        = false;
  var _score         = 0;
  var _hvtStatus     = 'LOCATED';   // 'LOCATED' | 'CAPTURED' | 'ELIMINATED'
  var _exfilMode     = 'NONE';      // 'NONE' | 'HELO' | 'VEHICLE'
  var _missionClear  = false;
  var _missionFailed = false;

  /* ── Input ──────────────────────────────────────────────────────────────── */
  var _keys     = {};
  var _mouseX   = 0;
  var _mouseY   = 0;
  var _yaw      = 0;
  var _pitch    = 0;

  /* ── Activation combo ───────────────────────────────────────────────────── */
  var _bPressTime   = 0;
  var _xPressTime   = 0;
  var COMBO_WINDOW  = 0.4;   // seconds

  /* ── Player ─────────────────────────────────────────────────────────────── */
  var _playerMesh      = null;
  var _playerPos       = { x: -60, y: 1, z: 0 };
  var _playerHP        = 100;
  var _playerSpeed     = 8;
  var _crawling        = false;   // inside vent shaft

  /* ── HVT (High Value Target) ────────────────────────────────────────────── */
  var _hvtMesh         = null;
  var _hvtPos          = { x: 0, y: 1.4, z: 0 };
  var _hvtFollowing    = false;
  var _hvtAlive        = true;
  var _hvtSpeed        = 4;

  /* ── Compound ───────────────────────────────────────────────────────────── */
  var _compoundMesh    = null;
  var _towers          = [];    // 4 corner guard towers
  var _tripwires       = [];    // laser LineSegments { line, triggered, pos1, pos2 }
  var _alarmActive     = false;
  var _alarmLight      = null;

  /* ── Guards / patrols ───────────────────────────────────────────────────── */
  var _guards          = [];    // { mesh, pos, dir, angle, patrolPath, patrolIdx, alive, alertTimer }
  var _NUM_GUARDS      = 6;

  /* ── Detection ──────────────────────────────────────────────────────────── */
  var _detectionLevel  = 0;     // 0–100
  var DETECT_FOV_RAD   = Math.PI / 3;  // 60°
  var DETECT_RANGE     = 25;

  /* ── Bullets / shots ────────────────────────────────────────────────────── */
  var _bullets         = [];    // { mesh, vel, life }

  /* ── Helicopter exfil ───────────────────────────────────────────────────── */
  var _helo            = null;
  var _heloState       = 'ORBITING';  // 'ORBITING'|'INBOUND'|'HOVERING'|'GONE'
  var _heloCalled      = false;
  var _heloArrivalTimer= 0;
  var _heloHoverTimer  = 0;
  var _heloAngle       = 0;
  var HELO_ORBIT_RADIUS= 40;
  var HELO_ALTITUDE    = 40;
  var HELO_ARRIVAL_TIME= 30;
  var HELO_HOVER_TIME  = 20;
  var _heloRopes       = [];    // LineSegments

  /* ── Vehicle escape ─────────────────────────────────────────────────────── */
  var _jeep            = null;
  var _jeepPos         = { x: 7.5, y: 0.5, z: -10 };
  var _jeepDriving     = false;
  var _extractCircle   = null;
  var EXTRACT_POS      = { x: 80, y: 0, z: 0 };

  /* ── QRF timer ──────────────────────────────────────────────────────────── */
  var _qrfTimer        = 8 * 60;  // 8 minutes in seconds
  var _qrfArrived      = false;
  var _qrfSoldiers     = [];

  /* ── Vent shaft ─────────────────────────────────────────────────────────── */
  var _ventShaft       = null;
  var _ventShaftPos    = { x: 0, y: 0, z: -7.5 };  // north wall of compound

  /* ── HUD ────────────────────────────────────────────────────────────────── */
  var _hud             = null;

  /* ── Timing ─────────────────────────────────────────────────────────────── */
  var _lastTime        = 0;

  /* ════════════════════════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function _dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = (a.z !== undefined ? a.z : 0) - (b.z !== undefined ? b.z : 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3D(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function _makeMeshLambert(geo, color, emissive, emissiveIntensity) {
    var opts = { color: color };
    if (emissive !== undefined) {
      opts.emissive = emissive;
      opts.emissiveIntensity = emissiveIntensity || 0.4;
    }
    return new THREE.MeshLambertMaterial(opts);
  }

  function _formatTime(seconds) {
    var s = Math.max(0, Math.floor(seconds));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return (m < 10 ? '0' + m : '' + m) + ':' + (r < 10 ? '0' + r : '' + r);
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'bo-extract-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.72)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 16px',
      'border:1px solid #00FF88',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hud);
    _updateHUD();
  }

  function _updateHUD() {
    if (!_hud) return;
    var det = Math.round(_detectionLevel);
    var qrf = _formatTime(_qrfTimer);
    var exfil = _exfilMode === 'NONE' ? 'PENDING' : _exfilMode;
    _hud.textContent = 'BLACK OPS  [HVT: ' + _hvtStatus + ']  [DETECTION: ' + det + '%]  [EXFIL: ' + exfil + ']  |  QRF: ' + qrf;
  }

  function _removeHUD() {
    if (_hud && _hud.parentNode) {
      _hud.parentNode.removeChild(_hud);
    }
    _hud = null;
  }

  /* ════════════════════════════════════════════════════════════════════════
     MESH BUILDERS
  ════════════════════════════════════════════════════════════════════════ */

  function _buildPlayerMesh() {
    var geo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    var mat = _makeMeshLambert(geo, 0x223322);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    return mesh;
  }

  function _buildHVTMesh() {
    /* CylinderGeometry commander at 1.4x scale */
    var geo = new THREE.CylinderGeometry(0.4, 0.4, 2, 8);
    var mat = _makeMeshLambert(geo, 0x222244, 0x222244, 0.2);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(1.4, 1.4, 1.4);
    mesh.position.set(_hvtPos.x, _hvtPos.y, _hvtPos.z);
    return mesh;
  }

  function _buildCompound() {
    /* Fortified compound BoxGeometry 15x5x15 */
    var geo = new THREE.BoxGeometry(15, 5, 15);
    var mat = _makeMeshLambert(geo, 0x444433);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 2.5, 0);
    _scene.add(mesh);
    return mesh;
  }

  function _buildTowers() {
    var offsets = [
      { x:  9, z:  9 },
      { x: -9, z:  9 },
      { x:  9, z: -9 },
      { x: -9, z: -9 }
    ];
    var towers = [];
    for (var i = 0; i < offsets.length; i++) {
      var geo  = new THREE.BoxGeometry(2, 8, 2);
      var mat  = _makeMeshLambert(geo, 0x555544);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(offsets[i].x, 4, offsets[i].z);
      _scene.add(mesh);
      towers.push(mesh);
    }
    return towers;
  }

  function _buildTripwires() {
    /* Laser tripwires across compound gates (south and east openings) */
    var gates = [
      { p1: { x: -7.5, y: 1, z:  8 }, p2: { x:  7.5, y: 1, z:  8 } },  // south gate
      { p1: { x:  8,   y: 1, z: -7.5 }, p2: { x:  8, y: 1, z:  7.5 } }  // east gate
    ];
    var wires = [];
    for (var i = 0; i < gates.length; i++) {
      var pts = [
        new THREE.Vector3(gates[i].p1.x, gates[i].p1.y, gates[i].p1.z),
        new THREE.Vector3(gates[i].p2.x, gates[i].p2.y, gates[i].p2.z)
      ];
      var geo  = new THREE.BufferGeometry().setFromPoints(pts);
      var mat  = new THREE.LineBasicMaterial({ color: 0xFF2200, linewidth: 2 });
      var line = new THREE.LineSegments(geo, mat);
      _scene.add(line);
      wires.push({
        line:      line,
        triggered: false,
        p1:        gates[i].p1,
        p2:        gates[i].p2
      });
    }
    return wires;
  }

  function _buildGuards() {
    var guards = [];
    /* 6 patrols around and inside compound */
    var spawnData = [
      { x:  5, z:  5, angle: 0 },
      { x: -5, z:  5, angle: Math.PI },
      { x:  5, z: -5, angle: Math.PI / 2 },
      { x: -5, z: -5, angle: -Math.PI / 2 },
      { x: 12, z:  0, angle: Math.PI },
      { x: -12, z: 0, angle: 0 }
    ];
    for (var i = 0; i < spawnData.length; i++) {
      var d   = spawnData[i];
      var geo = new THREE.BoxGeometry(0.7, 1.7, 0.7);
      var mat = _makeMeshLambert(geo, 0x664422);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(d.x, 0.85, d.z);
      _scene.add(mesh);
      /* Simple patrol path: two waypoints */
      var patrolPath = [
        { x: d.x + 4, z: d.z },
        { x: d.x - 4, z: d.z }
      ];
      guards.push({
        mesh:       mesh,
        pos:        { x: d.x, y: 0.85, z: d.z },
        facingAngle: d.angle,
        patrolPath: patrolPath,
        patrolIdx:  0,
        alive:      true,
        alertTimer: 0
      });
    }
    return guards;
  }

  function _buildVentShaft() {
    /* CylinderGeometry at north wall, scale.y 0.5 to look like a crawl shaft */
    var geo  = new THREE.CylinderGeometry(0.8, 0.8, 4, 8);
    var mat  = _makeMeshLambert(geo, 0x333333);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.scale.y = 0.5;
    mesh.rotation.z = Math.PI / 2;  // horizontal shaft
    mesh.position.set(_ventShaftPos.x, 1, _ventShaftPos.z);
    _scene.add(mesh);
    return mesh;
  }

  function _buildHelo() {
    var group = new THREE.Group();
    /* Fuselage */
    var bodyGeo = new THREE.BoxGeometry(6, 2, 2.5);
    var bodyMat = _makeMeshLambert(bodyGeo, 0x445566);
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);
    /* Tail boom */
    var tailGeo = new THREE.BoxGeometry(4, 0.6, 0.6);
    var tailMat = _makeMeshLambert(tailGeo, 0x334455);
    var tail    = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(-4.5, 0, 0);
    group.add(tail);
    /* Landing skids */
    var skidGeo = new THREE.BoxGeometry(5, 0.2, 0.2);
    var skidMat = _makeMeshLambert(skidGeo, 0x222233);
    var skidL   = new THREE.Mesh(skidGeo, skidMat);
    skidL.position.set(0, -1.2, 1);
    group.add(skidL);
    var skidR   = new THREE.Mesh(skidGeo, skidMat);
    skidR.position.set(0, -1.2, -1);
    group.add(skidR);
    group.position.set(
      HELO_ORBIT_RADIUS, HELO_ALTITUDE, 0
    );
    _scene.add(group);
    return group;
  }

  function _buildHeloRopes() {
    /* Two ropes hanging from helo */
    var ropes = [];
    var offsets = [ -1, 1 ];
    for (var i = 0; i < offsets.length; i++) {
      var pts = [
        new THREE.Vector3(offsets[i], 0, 0),
        new THREE.Vector3(offsets[i], -12, 0)
      ];
      var geo  = new THREE.BufferGeometry().setFromPoints(pts);
      var mat  = new THREE.LineBasicMaterial({ color: 0xBBAA88 });
      var line = new THREE.LineSegments(geo, mat);
      ropes.push(line);
    }
    return ropes;
  }

  function _buildJeep() {
    var geo  = new THREE.BoxGeometry(3, 1.5, 5);
    var mat  = _makeMeshLambert(geo, 0x334433);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(_jeepPos.x, _jeepPos.y, _jeepPos.z);
    _scene.add(mesh);
    return mesh;
  }

  function _buildExtractionCircle() {
    var geo  = new THREE.BoxGeometry(6, 0.1, 6);
    var mat  = _makeMeshLambert(geo, 0x00FF88, 0x00FF88, 0.6);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(EXTRACT_POS.x, 0.05, EXTRACT_POS.z);
    _scene.add(mesh);
    return mesh;
  }

  function _buildQRFSoldier(pos) {
    var geo  = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    var mat  = _makeMeshLambert(geo, 0x882222);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, 0.9, pos.z);
    _scene.add(mesh);
    return { mesh: mesh, pos: { x: pos.x, y: 0.9, z: pos.z }, alive: true };
  }

  function _buildBullet(origin, dir) {
    var geo  = new THREE.BoxGeometry(0.1, 0.1, 0.5);
    var mat  = _makeMeshLambert(geo, 0xFFDD00, 0xFFDD00, 1.0);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(origin.x, origin.y, origin.z);
    _scene.add(mesh);
    return {
      mesh: mesh,
      vel:  { x: dir.x * 40, y: dir.y * 40, z: dir.z * 40 },
      life: 2.0
    };
  }

  /* ════════════════════════════════════════════════════════════════════════
     ALARM
  ════════════════════════════════════════════════════════════════════════ */

  function _triggerAlarm() {
    if (_alarmActive) return;
    _alarmActive = true;
    _alarmLight  = new THREE.PointLight(0xFF0000, 3, 60);
    _alarmLight.position.set(0, 8, 0);
    _scene.add(_alarmLight);
    /* Alert all guards */
    for (var i = 0; i < _guards.length; i++) {
      _guards[i].alertTimer = 30;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     DETECTION CONES
  ════════════════════════════════════════════════════════════════════════ */

  function _updateDetection(dt) {
    var detected = false;
    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (!g.alive) continue;

      var dx   = _playerPos.x - g.pos.x;
      var dz   = _playerPos.z - g.pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > DETECT_RANGE) continue;

      /* Angle of player relative to guard facing */
      var angleToPlayer = Math.atan2(dx, dz);
      var diff = angleToPlayer - g.facingAngle;
      /* Normalise to -PI..PI */
      while (diff >  Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;

      if (Math.abs(diff) < DETECT_FOV_RAD / 2) {
        /* In LOS – if crawling detection is halved */
        var increment = (_crawling ? 0.5 : 1.0) * (1 - dist / DETECT_RANGE);
        _detectionLevel = _clamp(_detectionLevel + increment * 30 * dt, 0, 100);
        detected = true;
        if (_detectionLevel >= 100) {
          _triggerAlarm();
        }
      }
    }
    if (!detected) {
      _detectionLevel = _clamp(_detectionLevel - 5 * dt, 0, 100);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     TRIPWIRE CHECK
  ════════════════════════════════════════════════════════════════════════ */

  function _checkTripwires() {
    for (var i = 0; i < _tripwires.length; i++) {
      var tw = _tripwires[i];
      if (tw.triggered) continue;
      var p1 = tw.p1;
      var p2 = tw.p2;
      /* Determine if player crosses the line segment */
      var minX = Math.min(p1.x, p2.x) - 0.5;
      var maxX = Math.max(p1.x, p2.x) + 0.5;
      var minZ = Math.min(p1.z, p2.z) - 0.5;
      var maxZ = Math.max(p1.z, p2.z) + 0.5;
      if (_playerPos.x > minX && _playerPos.x < maxX &&
          _playerPos.z > minZ && _playerPos.z < maxZ) {
        tw.triggered = true;
        /* Change colour to show triggered */
        tw.line.material.color.setHex(0x880000);
        _triggerAlarm();
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     GUARD AI
  ════════════════════════════════════════════════════════════════════════ */

  function _updateGuards(dt) {
    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (!g.alive) continue;

      var target;
      if (_alarmActive || g.alertTimer > 0) {
        /* Chase player */
        target = _playerPos;
        g.alertTimer = Math.max(0, g.alertTimer - dt);
      } else {
        /* Patrol */
        target = g.patrolPath[g.patrolIdx];
      }

      var dx   = target.x - g.pos.x;
      var dz   = target.z - g.pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.3) {
        var speed = _alarmActive ? 5 : 3;
        var nx    = dx / dist;
        var nz    = dz / dist;
        g.pos.x  += nx * speed * dt;
        g.pos.z  += nz * speed * dt;
        g.facingAngle = Math.atan2(nx, nz);
        g.mesh.position.set(g.pos.x, g.pos.y, g.pos.z);
        g.mesh.rotation.y = -g.facingAngle;
      } else {
        if (!_alarmActive) {
          /* Next patrol waypoint */
          g.patrolIdx = (g.patrolIdx + 1) % g.patrolPath.length;
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     HVT FOLLOW
  ════════════════════════════════════════════════════════════════════════ */

  function _updateHVT(dt) {
    if (!_hvtAlive || !_hvtFollowing) return;
    var dx   = _playerPos.x - _hvtPos.x;
    var dz   = _playerPos.z - _hvtPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 2.5) {
      var nx   = dx / dist;
      var nz   = dz / dist;
      _hvtPos.x += nx * _hvtSpeed * dt;
      _hvtPos.z += nz * _hvtSpeed * dt;
      if (_hvtMesh) _hvtMesh.position.set(_hvtPos.x, _hvtPos.y, _hvtPos.z);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     HELICOPTER
  ════════════════════════════════════════════════════════════════════════ */

  function _updateHelo(dt) {
    if (!_helo) return;

    if (_heloState === 'ORBITING') {
      _heloAngle += 0.3 * dt;
      _helo.position.x = Math.cos(_heloAngle) * HELO_ORBIT_RADIUS;
      _helo.position.z = Math.sin(_heloAngle) * HELO_ORBIT_RADIUS;
      _helo.position.y = HELO_ALTITUDE;

      if (_heloCalled) {
        _heloState = 'INBOUND';
        _heloArrivalTimer = HELO_ARRIVAL_TIME;
        _exfilMode = 'HELO';
      }
    } else if (_heloState === 'INBOUND') {
      _heloArrivalTimer -= dt;
      /* Fly toward player position */
      var tx = _playerPos.x;
      var tz = _playerPos.z;
      var ty = HELO_ALTITUDE;
      var hdx = tx - _helo.position.x;
      var hdz = tz - _helo.position.z;
      var hd  = Math.sqrt(hdx * hdx + hdz * hdz);
      if (hd > 1) {
        _helo.position.x += (hdx / hd) * 15 * dt;
        _helo.position.z += (hdz / hd) * 15 * dt;
      }
      _helo.position.y += (ty - _helo.position.y) * 2 * dt;

      if (_heloArrivalTimer <= 0 || hd < 2) {
        _heloState = 'HOVERING';
        _heloHoverTimer = HELO_HOVER_TIME;
        /* Attach ropes */
        for (var r = 0; r < _heloRopes.length; r++) {
          _helo.add(_heloRopes[r]);
        }
      }
    } else if (_heloState === 'HOVERING') {
      _heloHoverTimer -= dt;
      /* Hover in place above player */
      _helo.position.x += (_playerPos.x - _helo.position.x) * dt;
      _helo.position.z += (_playerPos.z - _helo.position.z) * dt;

      if (_heloHoverTimer <= 0) {
        /* Remove ropes and leave */
        for (var r2 = 0; r2 < _heloRopes.length; r2++) {
          _helo.remove(_heloRopes[r2]);
        }
        _heloState = 'GONE';
        _heloCalled = false;
        _exfilMode  = 'NONE';
      }
    }
    /* Slow rotation of rotor implied by spinning the whole helo slightly */
    _helo.rotation.y += 3 * dt;
  }

  /* ════════════════════════════════════════════════════════════════════════
     JEEP / VEHICLE
  ════════════════════════════════════════════════════════════════════════ */

  function _updateJeep(dt) {
    if (!_jeep || !_jeepDriving) return;
    /* Drive toward extraction circle */
    var dx   = EXTRACT_POS.x - _jeepPos.x;
    var dz   = EXTRACT_POS.z - _jeepPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 1) {
      var nx = dx / dist;
      var nz = dz / dist;
      _jeepPos.x += nx * 20 * dt;
      _jeepPos.z += nz * 20 * dt;
      /* Player rides jeep */
      _playerPos.x = _jeepPos.x;
      _playerPos.z = _jeepPos.z;
      _jeep.position.set(_jeepPos.x, _jeepPos.y, _jeepPos.z);
      if (_playerMesh) _playerMesh.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    } else {
      /* Reached extraction */
      _jeepDriving = false;
      _triggerMissionSuccess('VEHICLE');
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     QRF
  ════════════════════════════════════════════════════════════════════════ */

  function _spawnQRF() {
    _qrfArrived = true;
    var edgePositions = [
      { x: 100, z:  0 }, { x:-100, z:  0 },
      { x:   0, z:100 }, { x:   0, z:-100 },
      { x:  80, z: 80 }, { x: -80, z: 80 },
      { x:  80, z:-80 }, { x: -80, z:-80 }
    ];
    for (var i = 0; i < edgePositions.length; i++) {
      var s = _buildQRFSoldier(edgePositions[i]);
      _qrfSoldiers.push(s);
    }
  }

  function _updateQRFSoldiers(dt) {
    for (var i = 0; i < _qrfSoldiers.length; i++) {
      var s = _qrfSoldiers[i];
      if (!s.alive) continue;
      var dx   = _playerPos.x - s.pos.x;
      var dz   = _playerPos.z - s.pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 1) {
        s.pos.x += (dx / dist) * 6 * dt;
        s.pos.z += (dz / dist) * 6 * dt;
        s.mesh.position.set(s.pos.x, s.pos.y, s.pos.z);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BULLETS
  ════════════════════════════════════════════════════════════════════════ */

  function _fireBullet() {
    var dir = {
      x:  Math.sin(_yaw)  * Math.cos(_pitch),
      y: -Math.sin(_pitch),
      z: -Math.cos(_yaw)  * Math.cos(_pitch)
    };
    var origin = { x: _playerPos.x, y: _playerPos.y + 0.8, z: _playerPos.z };
    var b = _buildBullet(origin, dir);
    _bullets.push(b);
  }

  function _updateBullets(dt) {
    for (var i = _bullets.length - 1; i >= 0; i--) {
      var b = _bullets[i];
      b.life -= dt;
      b.mesh.position.x += b.vel.x * dt;
      b.mesh.position.y += b.vel.y * dt;
      b.mesh.position.z += b.vel.z * dt;

      /* Check guard hits */
      for (var g = 0; g < _guards.length; g++) {
        var guard = _guards[g];
        if (!guard.alive) continue;
        var bd = _dist3D(b.mesh.position, guard.pos);
        if (bd < 1.2) {
          guard.alive = false;
          guard.mesh.visible = false;
          b.life = 0;
          break;
        }
      }

      /* Check HVT hit for ELIMINATE */
      if (_hvtAlive && _hvtMesh) {
        var hd = _dist3D(b.mesh.position, _hvtPos);
        if (hd < 1.5) {
          _hvtAlive    = false;
          _hvtStatus   = 'ELIMINATED';
          _score      += 500;
          _hvtMesh.visible = false;
          b.life = 0;
        }
      }

      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _bullets.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function _updatePlayer(dt) {
    var moved    = false;
    var spd      = _playerSpeed;
    var forward  = { x: -Math.sin(_yaw), z:  Math.cos(_yaw) };
    var right    = { x:  Math.cos(_yaw), z:  Math.sin(_yaw) };

    var mx = 0;
    var mz = 0;

    if (_keys['w'] || _keys['W'] || _keys['ArrowUp'])    { mx += forward.x; mz += forward.z; moved = true; }
    if (_keys['s'] || _keys['S'] || _keys['ArrowDown'])  { mx -= forward.x; mz -= forward.z; moved = true; }
    if (_keys['a'] || _keys['A'] || _keys['ArrowLeft'])  { mx -= right.x;   mz -= right.z;   moved = true; }
    if (_keys['d'] || _keys['D'] || _keys['ArrowRight']) { mx += right.x;   mz += right.z;   moved = true; }

    if (moved) {
      var ml = Math.sqrt(mx * mx + mz * mz);
      if (ml > 0) {
        _playerPos.x += (mx / ml) * spd * dt;
        _playerPos.z += (mz / ml) * spd * dt;
      }
    }

    /* Vent shaft check – slow crawl */
    var ventDist = _dist2D(_playerPos, _ventShaftPos);
    _crawling = ventDist < 3;
    if (_crawling) {
      if (_playerMesh) _playerMesh.scale.y = 0.5;
    } else {
      if (_playerMesh) _playerMesh.scale.y = 1;
    }

    if (_playerMesh) {
      _playerMesh.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
      _playerMesh.rotation.y = _yaw;
    }

    /* Camera follows player */
    if (_camera) {
      _camera.position.x = _playerPos.x + Math.sin(_yaw) * 10;
      _camera.position.y = _playerPos.y + 6;
      _camera.position.z = _playerPos.z - Math.cos(_yaw) * 10;
      _camera.lookAt(_playerPos.x, _playerPos.y + 1, _playerPos.z);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     INTERACTIONS
  ════════════════════════════════════════════════════════════════════════ */

  function _checkInteractions() {
    /* CAPTURE — E key near HVT */
    if ((_keys['e'] || _keys['E']) && _hvtAlive && !_hvtFollowing) {
      var distToHVT = _dist2D(_playerPos, _hvtPos);
      if (distToHVT <= 2) {
        _hvtFollowing = true;
        _hvtStatus    = 'CAPTURED';
        _score       += 200;
        /* Flash HVT mesh green briefly */
        if (_hvtMesh) _hvtMesh.material.color.setHex(0x00FF00);
      }
    }

    /* CALL HELO — H key */
    if (_keys['h'] || _keys['H']) {
      if (!_heloCalled && _heloState === 'ORBITING') {
        _heloCalled = true;
      }
    }

    /* BOARD HELO — E key near rope when hovering */
    if ((_keys['e'] || _keys['E']) && _heloState === 'HOVERING') {
      var distToHelo2D = _dist2D(_playerPos, {
        x: _helo.position.x,
        z: _helo.position.z
      });
      if (distToHelo2D < 6) {
        if (_hvtFollowing && _hvtStatus === 'CAPTURED') {
          _triggerMissionSuccess('HELO');
        }
      }
    }

    /* DRIVE JEEP — F key near jeep */
    if (_keys['f'] || _keys['F']) {
      if (!_jeepDriving && _jeep) {
        var distToJeep = _dist2D(_playerPos, _jeepPos);
        if (distToJeep < 4) {
          _jeepDriving = true;
          _exfilMode   = 'VEHICLE';
        }
      }
    }

    /* Reached extraction circle on foot */
    if (!_jeepDriving) {
      var distToCircle = _dist2D(_playerPos, EXTRACT_POS);
      if (distToCircle < 4 && (_hvtFollowing || _hvtStatus === 'ELIMINATED')) {
        _triggerMissionSuccess('VEHICLE');
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     MISSION OUTCOME
  ════════════════════════════════════════════════════════════════════════ */

  function _triggerMissionSuccess(mode) {
    if (_missionClear) return;
    _missionClear = true;
    _exfilMode = mode;
    /* Bonus for capturing alive */
    if (_hvtStatus === 'CAPTURED') _score += 1000;
    console.log('[BlackOpsExtraction] Mission success via', mode, '– score:', _score);
    if (_hud) {
      _hud.style.color = '#00FF88';
      _hud.textContent = 'MISSION COMPLETE  |  EXFIL: ' + mode + '  |  SCORE: ' + _score;
    }
    setTimeout(function () { _cleanup(); }, 8000);
  }

  function _triggerMissionFailed(reason) {
    if (_missionFailed || _missionClear) return;
    _missionFailed = true;
    console.log('[BlackOpsExtraction] Mission failed:', reason);
    if (_hud) {
      _hud.style.color = '#FF2200';
      _hud.textContent = 'MISSION FAILED  |  ' + reason;
    }
    setTimeout(function () { _cleanup(); }, 6000);
  }

  /* ════════════════════════════════════════════════════════════════════════
     CLEANUP
  ════════════════════════════════════════════════════════════════════════ */

  function _cleanup() {
    if (!_scene) return;

    /* Remove meshes */
    var toRemove = [];
    if (_playerMesh)   toRemove.push(_playerMesh);
    if (_hvtMesh)      toRemove.push(_hvtMesh);
    if (_compoundMesh) toRemove.push(_compoundMesh);
    if (_helo)         toRemove.push(_helo);
    if (_jeep)         toRemove.push(_jeep);
    if (_extractCircle) toRemove.push(_extractCircle);
    if (_ventShaft)    toRemove.push(_ventShaft);
    if (_alarmLight)   toRemove.push(_alarmLight);

    for (var i = 0; i < _towers.length;    i++) toRemove.push(_towers[i]);
    for (var i = 0; i < _guards.length;    i++) toRemove.push(_guards[i].mesh);
    for (var i = 0; i < _qrfSoldiers.length; i++) toRemove.push(_qrfSoldiers[i].mesh);
    for (var i = 0; i < _bullets.length;   i++) toRemove.push(_bullets[i].mesh);
    for (var i = 0; i < _tripwires.length; i++) toRemove.push(_tripwires[i].line);

    for (var j = 0; j < toRemove.length; j++) {
      _scene.remove(toRemove[j]);
    }

    _removeHUD();
    _removeListeners();

    /* Reset all state */
    _active        = false;
    _playerMesh    = null;
    _hvtMesh       = null;
    _compoundMesh  = null;
    _helo          = null;
    _jeep          = null;
    _extractCircle = null;
    _ventShaft     = null;
    _alarmLight    = null;
    _towers        = [];
    _guards        = [];
    _tripwires     = [];
    _bullets       = [];
    _qrfSoldiers   = [];
    _heloRopes     = [];
    _alarmActive   = false;
    _heloCalled    = false;
    _heloState     = 'ORBITING';
    _jeepDriving   = false;
    _missionClear  = false;
    _missionFailed = false;
    _hvtStatus     = 'LOCATED';
    _exfilMode     = 'NONE';
    _detectionLevel= 0;
    _qrfTimer      = 8 * 60;
    _qrfArrived    = false;
    _hvtFollowing  = false;
    _hvtAlive      = true;
    _score         = 0;
    _crawling      = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     EVENT LISTENERS
  ════════════════════════════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    var k = e.key;
    _keys[k] = true;

    /* Combo tracking: B + X within 400ms */
    var now = performance.now() / 1000;
    if (k === 'b' || k === 'B') _bPressTime = now;
    if (k === 'x' || k === 'X') _xPressTime = now;

    if ((k === 'x' || k === 'X') && _bPressTime > 0 && (now - _bPressTime) <= COMBO_WINDOW) {
      if (!_active) _launch();
    }
    if ((k === 'b' || k === 'B') && _xPressTime > 0 && (now - _xPressTime) <= COMBO_WINDOW) {
      if (!_active) _launch();
    }

    /* Fire */
    if (k === ' ' && _active) {
      e.preventDefault();
      _fireBullet();
    }
  }

  function _onKeyUp(e) {
    _keys[e.key] = false;
  }

  function _onMouseMove(e) {
    if (!_active) return;
    var cx = window.innerWidth  / 2;
    var cy = window.innerHeight / 2;
    _mouseX = (e.clientX - cx) / cx;
    _mouseY = (e.clientY - cy) / cy;
    _yaw    -= _mouseX * 0.03;
    _pitch   = _clamp(_pitch + _mouseY * 0.02, -Math.PI / 4, Math.PI / 4);
  }

  function _onClick() {
    if (_active) _fireBullet();
  }

  function _addListeners() {
    document.addEventListener('keydown',   _onKeyDown);
    document.addEventListener('keyup',     _onKeyUp);
    document.addEventListener('mousemove', _onMouseMove);
    document.addEventListener('click',     _onClick);
  }

  function _removeListeners() {
    document.removeEventListener('keydown',   _onKeyDown);
    document.removeEventListener('keyup',     _onKeyUp);
    document.removeEventListener('mousemove', _onMouseMove);
    document.removeEventListener('click',     _onClick);
  }

  /* ════════════════════════════════════════════════════════════════════════
     LAUNCH
  ════════════════════════════════════════════════════════════════════════ */

  function _launch() {
    if (_active) return;
    if (!_scene) {
      console.warn('[BlackOpsExtraction] No scene – call init() first');
      return;
    }
    _active        = true;
    _score         = 0;
    _hvtStatus     = 'LOCATED';
    _exfilMode     = 'NONE';
    _missionClear  = false;
    _missionFailed = false;
    _detectionLevel= 0;
    _qrfTimer      = 8 * 60;
    _qrfArrived    = false;
    _alarmActive   = false;
    _heloCalled    = false;
    _heloState     = 'ORBITING';
    _heloAngle     = 0;
    _jeepDriving   = false;
    _hvtFollowing  = false;
    _hvtAlive      = true;
    _crawling      = false;
    _yaw           = 0;
    _pitch         = 0;
    _bPressTime    = 0;
    _xPressTime    = 0;

    _playerPos   = { x: -60, y: 1, z: 0 };
    _hvtPos      = { x: 0, y: 1.4, z: 0 };
    _jeepPos     = { x: 7.5, y: 0.5, z: -10 };

    /* Build world */
    _compoundMesh  = _buildCompound();
    _towers        = _buildTowers();
    _tripwires     = _buildTripwires();
    _guards        = _buildGuards();
    _ventShaft     = _buildVentShaft();
    _playerMesh    = _buildPlayerMesh();
    _hvtMesh       = _buildHVTMesh();
    _helo          = _buildHelo();
    _heloRopes     = _buildHeloRopes();
    _jeep          = _buildJeep();
    _extractCircle = _buildExtractionCircle();

    _scene.add(_playerMesh);
    _scene.add(_hvtMesh);

    _buildHUD();
    _lastTime = performance.now() / 1000;

    console.log('[BlackOpsExtraction] Activated. Locate HVT at compound. H=call helo, E=subdue, F=jeep.');
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene  || null;
    _camera = camera || null;
    _canvas = canvas || null;
    _addListeners();
    console.log('[BlackOpsExtraction] Ready. Press B+X simultaneously to activate.');
  }

  function update(timestamp) {
    if (!_active || _missionClear || _missionFailed) return;

    var now = timestamp / 1000;
    var dt  = Math.min(now - _lastTime, 0.1);
    _lastTime = now;

    /* QRF countdown */
    _qrfTimer -= dt;
    if (_qrfTimer <= 0 && !_qrfArrived) {
      _qrfTimer = 0;
      _spawnQRF();
    }

    /* QRF soldiers overwhelm player */
    if (_qrfArrived) {
      var qrfClose = 0;
      for (var q = 0; q < _qrfSoldiers.length; q++) {
        if (_dist2D(_playerPos, _qrfSoldiers[q].pos) < 2) qrfClose++;
      }
      if (qrfClose >= 3) {
        _triggerMissionFailed('QRF OVERWHELMED');
        return;
      }
    }

    _updatePlayer(dt);
    _updateGuards(dt);
    _updateDetection(dt);
    _checkTripwires();
    _checkInteractions();
    _updateHVT(dt);
    _updateHelo(dt);
    _updateJeep(dt);
    _updateBullets(dt);
    _updateQRFSoldiers(dt);
    _updateHUD();

    /* Alarm light pulse */
    if (_alarmLight) {
      _alarmLight.intensity = 2 + Math.sin(now * 8) * 1.5;
    }
  }

  function reset() {
    _cleanup();
    console.log('[BlackOpsExtraction] Reset.');
  }

  return { init: init, update: update, reset: reset };

}());
