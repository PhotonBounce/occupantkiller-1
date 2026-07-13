// ============================================================
//  tank-commander.js — Browser-based Three.js Tank Commander
//
//  Controls:
//    T          = spawn tank at player position
//    K          = board nearest tank
//    W/S        = drive forward / backward
//    A/D        = rotate hull left / right
//    Mouse X    = rotate turret independently (azimuth)
//    LMB        = fire 120mm main gun
//    RMB hold   = fire coaxial MG (600 RPM)
//    E          = exit tank
//
//  Public API: { init(scene, camera, playerRef), update(dt), reset }
// ============================================================
window.TankCommander = (function () {
  'use strict';

  // ── Scene / camera references ────────────────────────────────
  var _scene  = null;
  var _camera = null;
  var _player = null;   // optional external player object with .position

  // ── Tank instances ───────────────────────────────────────────
  var _tanks       = [];    // all spawned tank objects
  var _activeTank  = null;  // tank the player is currently driving

  // ── Movement state ───────────────────────────────────────────
  var _speed     = 0;       // current forward speed m/s
  var _yaw       = 0;       // hull yaw radians
  var _turretYaw = 0;       // turret yaw relative to hull (mouse-driven)
  var _wheelSpin = 0;       // accumulated wheel rotation (visual)

  // ── Combat state ─────────────────────────────────────────────
  var _tankHP          = 500;
  var _tankMaxHP       = 500;
  var _mainGunCooldown = 0;     // seconds until next shot
  var _mainGunReload   = 8;     // seconds full reload
  var _mainGunAmmo     = 12;
  var _mgCooldown      = 0;
  var _mgRPM           = 600;
  var _mgInterval      = 60 / 600; // seconds between bursts
  var _recoilOffset    = 0;
  var _recoilVel       = 0;

  // ── Track damage ─────────────────────────────────────────────
  var _trackHPLeft   = 100;
  var _trackHPRight  = 100;
  var _trackMaxHP    = 100;

  // ── Projectiles / FX ─────────────────────────────────────────
  var _shells     = [];    // 120mm shells in flight
  var _tracers    = [];    // MG tracer line segments
  var _explosions = [];    // active explosion FX
  var _debris     = [];    // debris chunks from explosions
  var _craters    = [];    // crater meshes

  // ── Input ────────────────────────────────────────────────────
  var _keys      = { w: false, s: false, a: false, d: false };
  var _mouseDX   = 0;
  var _lmbDown   = false;
  var _rmbDown   = false;
  var _bound     = false;

  // ── Audio ─────────────────────────────────────────────────────
  var _audioCtx    = null;
  var _engineOsc   = null;
  var _engineGain  = null;
  var _engineMod   = null;
  var _prevSpeed   = 0;
  var _gearCooldown = 0;

  // ── HUD ───────────────────────────────────────────────────────
  var _hudEl      = null;
  var _promptEl   = null;
  var _reloadRing = null;

  // ── Camera offset (commander view) ───────────────────────────
  var _camYawOffset   = 0;   // azimuth offset from mouse
  var _mouseXAccum    = 0;   // accumulated mouse X for turret
  var _inCommView     = true; // always commander view when mounted

  // ── Constants ─────────────────────────────────────────────────
  var TANK_SPEED       = 4;      // max speed m/s
  var DRIVE_ACCEL      = 6;      // m/s²
  var DRIVE_FRICTION   = 4;      // deceleration m/s²
  var TURN_RATE        = 1.2;    // rad/s hull
  var TURRET_SENS      = 0.003;  // rad per pixel mouse X
  var CAM_BACK         = 0;      // commander view: no back offset
  var CAM_UP           = 1.5;    // up from turret hatch
  var ENTER_DIST       = 4;      // meters to board
  var MAIN_GUN_SPEED   = 80;     // m/s
  var MAIN_GUN_RADIUS  = 6;      // explosion radius
  var HP_SMOKE         = 250;    // HP below which smoke starts
  var HP_FIRE          = 100;    // HP below which fire starts

  // ═══════════════════════════════════════════════════════════
  //  MESH BUILDER
  // ═══════════════════════════════════════════════════════════
  function _buildTankMesh(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y + 0.9, z);

    var oliveMat = new THREE.MeshLambertMaterial({ color: 0x4A5240 });
    var darkMat  = new THREE.MeshLambertMaterial({ color: 0x2E3328 });
    var trackMat = new THREE.MeshLambertMaterial({ color: 0x1A1A0A });
    var steelMat = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });
    var rubberMat= new THREE.MeshLambertMaterial({ color: 0x111108 });

    // ── Hull ─────────────────────────────────────────────────
    var hullGeo = new THREE.BoxGeometry(5, 1.5, 3);
    var hull    = new THREE.Mesh(hullGeo, oliveMat);
    hull.position.y = 0.75;
    hull.castShadow    = true;
    hull.receiveShadow = true;
    group.add(hull);

    // ── Turret group (rotates with mouse) ────────────────────
    var turretGroup = new THREE.Group();
    turretGroup.position.set(0, 1.75, 0);  // sit on top of hull

    var turretGeo  = new THREE.BoxGeometry(2.5, 1, 2.5);
    var turretMesh = new THREE.Mesh(turretGeo, oliveMat);
    turretMesh.castShadow = true;
    turretGroup.add(turretMesh);

    // Hatch / commander cupola
    var hatchGeo  = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 8);
    var hatchMesh = new THREE.Mesh(hatchGeo, darkMat);
    hatchMesh.position.set(-0.4, 0.625, -0.3);
    turretGroup.add(hatchMesh);

    // ── Barrel ───────────────────────────────────────────────
    var barrelGroup = new THREE.Group();
    var barrelGeo   = new THREE.CylinderGeometry(0.15, 0.15, 4, 10);
    var barrel      = new THREE.Mesh(barrelGeo, steelMat);
    barrel.rotation.x = Math.PI / 2;   // point along +Z
    barrel.position.z = 2.0;           // extends forward 2 units from group center
    barrelGroup.add(barrel);
    turretGroup.add(barrelGroup);

    group.add(turretGroup);

    // ── Track assemblies (4: front-left, front-right, rear-left, rear-right) ─
    var trackAssemblies = [];
    var trackPositionsX = [-2.75, 2.75];   // left, right
    var trackPositionsZ = [0.9, -0.9];     // front, rear

    for (var ti = 0; ti < trackPositionsX.length; ti++) {
      var sideTracks = [];
      for (var tj = 0; tj < trackPositionsZ.length; tj++) {
        // Bogey wheel
        var bogeyGeo  = new THREE.BoxGeometry(0.5, 0.6, 0.5);
        var bogeyMesh = new THREE.Mesh(bogeyGeo, darkMat);
        bogeyMesh.position.set(trackPositionsX[ti], 0.25, trackPositionsZ[tj]);
        group.add(bogeyMesh);

        // Rubber track pad
        var padGeo  = new THREE.BoxGeometry(0.55, 0.15, 0.55);
        var padMesh = new THREE.Mesh(padGeo, rubberMat);
        padMesh.position.set(trackPositionsX[ti], 0.0, trackPositionsZ[tj]);
        group.add(padMesh);

        sideTracks.push({ bogey: bogeyMesh, pad: padMesh });
      }

      // Continuous track (rubber belt) along each side
      var beltGeo  = new THREE.BoxGeometry(0.4, 0.18, 3.2);
      var beltMesh = new THREE.Mesh(beltGeo, trackMat);
      beltMesh.position.set(trackPositionsX[ti], 0.09, 0);
      group.add(beltMesh);

      trackAssemblies.push({ bogeys: sideTracks, belt: beltMesh, side: ti });
    }

    // ── Exhaust pipe (rear) ───────────────────────────────────
    var exhGeo  = new THREE.CylinderGeometry(0.08, 0.1, 0.8, 6);
    var exhMesh = new THREE.Mesh(exhGeo, steelMat);
    exhMesh.rotation.z = Math.PI / 2;
    exhMesh.position.set(-1.8, 1.2, -1.6);
    group.add(exhMesh);

    // ── Antenna ───────────────────────────────────────────────
    var antGeo  = new THREE.CylinderGeometry(0.025, 0.025, 2.5, 4);
    var antMesh = new THREE.Mesh(antGeo, steelMat);
    antMesh.position.set(-1.2, 2.5, -0.8);
    group.add(antMesh);

    _scene.add(group);

    return {
      group:          group,
      hull:           hull,
      turretGroup:    turretGroup,
      barrelGroup:    barrelGroup,
      barrel:         barrel,
      trackAssemblies:trackAssemblies,
      hp:             500,
      yaw:            0,
      turretYaw:      0,
      smokeParticles: [],
      fireParticles:  [],
      smokeTimer:     0,
      fireTimer:      0
    };
  }

  // ═══════════════════════════════════════════════════════════
  //  HUD
  // ═══════════════════════════════════════════════════════════
  function _buildHUD() {
    // Main HUD bar
    _hudEl = document.createElement('div');
    _hudEl.id = 'tank-commander-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:14px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.72)',
      'color:#b8d060',
      'font-family:monospace',
      'font-size:14px',
      'padding:8px 22px',
      'border-radius:4px',
      'border:1px solid rgba(184,208,96,0.5)',
      'pointer-events:none',
      'display:none',
      'z-index:400',
      'text-align:center',
      'letter-spacing:0.05em',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);

    // Reload ring (canvas-based indicator)
    _reloadRing = document.createElement('canvas');
    _reloadRing.id  = 'tank-commander-ring';
    _reloadRing.width  = 60;
    _reloadRing.height = 60;
    _reloadRing.style.cssText = [
      'position:fixed',
      'bottom:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'display:none',
      'z-index:401',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(_reloadRing);

    // Proximity prompt
    _promptEl = document.createElement('div');
    _promptEl.id = 'tank-commander-prompt';
    _promptEl.style.cssText = [
      'position:fixed',
      'bottom:120px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.6)',
      'color:#ffe066',
      'font-family:monospace',
      'font-size:14px',
      'padding:6px 18px',
      'border-radius:4px',
      'border:1px solid rgba(255,224,102,0.5)',
      'pointer-events:none',
      'display:none',
      'z-index:400'
    ].join(';');
    document.body.appendChild(_promptEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;

    // Proximity prompt
    if (!_activeTank) {
      var nearTank = _findNearestTank();
      if (nearTank) {
        var ppos = _getPlayerPos();
        var dx = nearTank.group.position.x - ppos.x;
        var dz = nearTank.group.position.z - ppos.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < ENTER_DIST * 3) {
          _promptEl.style.display = 'block';
          _promptEl.innerHTML     = dist < ENTER_DIST
            ? '[K] Board Tank'
            : 'Tank nearby (' + dist.toFixed(0) + 'm)';
        } else {
          _promptEl.style.display = 'none';
        }
      } else {
        _promptEl.style.display = 'none';
      }
      _hudEl.style.display  = 'none';
      _reloadRing.style.display = 'none';
      return;
    }

    _promptEl.style.display = 'none';
    _hudEl.style.display    = 'block';

    var hp      = _activeTank.hp;
    var hpColor = hp < HP_FIRE ? '#ff3333' : hp < HP_SMOKE ? '#ffaa22' : '#88ff44';
    var reload  = _mainGunCooldown > 0
      ? 'RELOADING ' + _mainGunCooldown.toFixed(1) + 's'
      : 'READY';
    var reloadColor = _mainGunCooldown > 0 ? '#ff8800' : '#88ff44';
    var spd = Math.abs(_speed).toFixed(1);

    var trkLeft  = (_trackHPLeft / _trackMaxHP) * 100;
    var trkRight = (_trackHPRight / _trackMaxHP) * 100;
    var trkColor = (trkLeft < 50 || trkRight < 50) ? '#ff6600' : '#b8d060';

    _hudEl.innerHTML =
      'TANK [HP:<span style="color:' + hpColor + '">' + hp + '/' + _tankMaxHP + '</span>]' +
      ' [AMMO:' + _mainGunAmmo + ']' +
      ' [RELOAD:<span style="color:' + reloadColor + '">' + reload + '</span>]' +
      ' [SPEED:' + spd + ']' +
      ' [TRK:<span style="color:' + trkColor + '">' + trkLeft.toFixed(0) + '%/' + trkRight.toFixed(0) + '%</span>]' +
      ' &nbsp; [E]=Exit';

    // Reload ring
    if (_mainGunCooldown > 0) {
      _reloadRing.style.display = 'block';
      var ctx2d = _reloadRing.getContext('2d');
      ctx2d.clearRect(0, 0, 60, 60);
      ctx2d.strokeStyle = '#333';
      ctx2d.lineWidth   = 5;
      ctx2d.beginPath();
      ctx2d.arc(30, 30, 22, 0, Math.PI * 2);
      ctx2d.stroke();
      var pct = 1 - (_mainGunCooldown / _mainGunReload);
      ctx2d.strokeStyle = '#ff8800';
      ctx2d.beginPath();
      ctx2d.arc(30, 30, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
      ctx2d.stroke();
      ctx2d.fillStyle   = '#ffcc44';
      ctx2d.font        = '10px monospace';
      ctx2d.textAlign   = 'center';
      ctx2d.textBaseline= 'middle';
      ctx2d.fillText(_mainGunCooldown.toFixed(1) + 's', 30, 30);
    } else {
      _reloadRing.style.display = 'none';
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  AUDIO
  // ═══════════════════════════════════════════════════════════
  function _getAudio() {
    if (_audioCtx) return _audioCtx;
    try {
      _audioCtx = window._audioCtx ||
        new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
    return _audioCtx;
  }

  function _startEngine() {
    try {
      var ctx = _getAudio();
      if (!ctx) return;
      _engineOsc       = ctx.createOscillator();
      _engineOsc.type  = 'sawtooth';
      _engineOsc.frequency.value = 55;

      _engineMod       = ctx.createOscillator();
      _engineMod.type  = 'sine';
      _engineMod.frequency.value = 18;

      var modGain       = ctx.createGain();
      modGain.gain.value= 7;
      _engineMod.connect(modGain);
      modGain.connect(_engineOsc.frequency);

      _engineGain       = ctx.createGain();
      _engineGain.gain.value = 0.06;

      _engineOsc.connect(_engineGain);
      _engineGain.connect(ctx.destination);

      _engineOsc.start();
      _engineMod.start();
    } catch (e) {}
  }

  function _stopEngine() {
    try {
      if (_engineOsc) { _engineOsc.stop(); _engineOsc = null; }
      if (_engineMod) { _engineMod.stop(); _engineMod = null; }
      _engineGain = null;
    } catch (e) {}
  }

  function _updateEngine(dt) {
    try {
      if (!_engineOsc || !_engineGain) return;
      var spd01 = Math.min(Math.abs(_speed) / TANK_SPEED, 1);
      _engineOsc.frequency.value = 55 + spd01 * 35;
      _engineGain.gain.value     = 0.055 + spd01 * 0.04;
      _gearCooldown -= dt;
      if (_prevSpeed < 0.3 && Math.abs(_speed) > 1.2 && _gearCooldown <= 0) {
        _gearCooldown = 2;
        _playGearShift();
      }
      _prevSpeed = Math.abs(_speed);
    } catch (e) {}
  }

  function _playGearShift() {
    try {
      var ctx = _getAudio();
      if (!ctx) return;
      var osc   = ctx.createOscillator();
      var gain  = ctx.createGain();
      osc.type  = 'sawtooth';
      osc.frequency.value = 110;
      gain.gain.value     = 0.07;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.frequency.setTargetAtTime(200, ctx.currentTime, 0.1);
      gain.gain.setTargetAtTime(0, ctx.currentTime + 0.2, 0.04);
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  }

  function _playGunshot() {
    try {
      var ctx = _getAudio();
      if (!ctx) return;
      var buf  = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.4), ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
      }
      var src  = ctx.createBufferSource();
      var gain = ctx.createGain();
      src.buffer    = buf;
      gain.gain.value = 0.6;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  function _playExplosion() {
    try {
      var ctx = _getAudio();
      if (!ctx) return;
      var buf  = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.8), ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.2));
      }
      var src  = ctx.createBufferSource();
      var gain = ctx.createGain();
      src.buffer      = buf;
      gain.gain.value = 0.9;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  function _playMGShot() {
    try {
      var ctx = _getAudio();
      if (!ctx) return;
      var buf  = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
      }
      var src  = ctx.createBufferSource();
      var gain = ctx.createGain();
      src.buffer      = buf;
      gain.gain.value = 0.18;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  // ═══════════════════════════════════════════════════════════
  //  SHOOTING — MAIN GUN
  // ═══════════════════════════════════════════════════════════
  function _fireMainGun() {
    if (!_activeTank) return;
    if (_mainGunCooldown > 0) return;
    if (_mainGunAmmo <= 0) return;

    _mainGunAmmo--;
    _mainGunCooldown = _mainGunReload;

    // Muzzle flash light
    var flash = new THREE.PointLight(0xFFAA00, 8, 18);
    var worldBarrelTip = _getBarrelTip(_activeTank);
    flash.position.copy(worldBarrelTip);
    _scene.add(flash);

    // Small flash sphere
    var flashGeo  = new THREE.SphereGeometry(0.5, 6, 4);
    var flashMat  = new THREE.MeshBasicMaterial({ color: 0xFFCC44 });
    var flashMesh = new THREE.Mesh(flashGeo, flashMat);
    flashMesh.position.copy(worldBarrelTip);
    _scene.add(flashMesh);

    // Shell projectile (BoxGeometry)
    var shellGeo  = new THREE.BoxGeometry(0.12, 0.12, 0.8);
    var shellMat  = new THREE.MeshBasicMaterial({ color: 0xFFDD00 });
    var shellMesh = new THREE.Mesh(shellGeo, shellMat);
    shellMesh.position.copy(worldBarrelTip);

    // Direction: forward along turret + hull
    var totalYaw  = _activeTank.yaw + _activeTank.turretYaw;
    var dirX = Math.sin(totalYaw);
    var dirZ = Math.cos(totalYaw);
    shellMesh.rotation.y = totalYaw;
    _scene.add(shellMesh);

    _shells.push({
      mesh:    shellMesh,
      velX:    dirX * MAIN_GUN_SPEED,
      velY:    0,
      velZ:    dirZ * MAIN_GUN_SPEED,
      life:    2.5,
      maxLife: 2.5
    });

    // Recoil
    _recoilOffset = -0.35;
    _recoilVel    = 0;

    // Remove flash after 80ms
    window.setTimeout(function () {
      _scene.remove(flash);
      _scene.remove(flashMesh);
    }, 80);

    _playGunshot();
  }

  function _getBarrelTip(tank) {
    // World position of barrel tip
    var totalYaw = tank.yaw + tank.turretYaw;
    var turretWorldPos = new THREE.Vector3();
    tank.turretGroup.getWorldPosition(turretWorldPos);
    var tip = new THREE.Vector3(
      turretWorldPos.x + Math.sin(totalYaw) * 4.2,
      turretWorldPos.y,
      turretWorldPos.z + Math.cos(totalYaw) * 4.2
    );
    return tip;
  }

  // ═══════════════════════════════════════════════════════════
  //  SHOOTING — COAXIAL MG
  // ═══════════════════════════════════════════════════════════
  function _fireMG() {
    if (!_activeTank) return;
    if (_mgCooldown > 0) return;

    _mgCooldown = _mgInterval;

    var worldBarrelTip = _getBarrelTip(_activeTank);
    var totalYaw = _activeTank.yaw + _activeTank.turretYaw;
    var dirX = Math.sin(totalYaw);
    var dirZ = Math.cos(totalYaw);

    // 5 tracers per burst, spaced slightly
    for (var ti = 0; ti < 5; ti++) {
      var spread = (Math.random() - 0.5) * 0.04;
      var startPt = new THREE.Vector3(
        worldBarrelTip.x + Math.random() * 0.3,
        worldBarrelTip.y + (Math.random() - 0.5) * 0.2,
        worldBarrelTip.z + Math.random() * 0.3
      );
      var endPt = new THREE.Vector3(
        startPt.x + dirX * 40 + spread * 10,
        startPt.y + (Math.random() - 0.5) * 1.5,
        startPt.z + dirZ * 40 + spread * 10
      );

      var pts    = [startPt, endPt];
      var geo    = new THREE.BufferGeometry().setFromPoints(pts);
      var mat    = new THREE.LineBasicMaterial({ color: 0xFFFF88, transparent: true, opacity: 0.85 });
      var tracer = new THREE.LineSegments(geo, mat);
      _scene.add(tracer);

      _tracers.push({ mesh: tracer, mat: mat, life: 0.12 });
    }

    _playMGShot();
  }

  // ═══════════════════════════════════════════════════════════
  //  EXPLOSION
  // ═══════════════════════════════════════════════════════════
  function _spawnExplosion(pos, radius) {
    // Big flash light
    var light = new THREE.PointLight(0xFF6600, 12, radius * 4);
    light.position.copy(pos);
    _scene.add(light);

    // Fireball sphere
    var fbGeo  = new THREE.SphereGeometry(radius * 0.6, 8, 6);
    var fbMat  = new THREE.MeshBasicMaterial({ color: 0xFF8800 });
    var fbMesh = new THREE.Mesh(fbGeo, fbMat);
    fbMesh.position.copy(pos);
    _scene.add(fbMesh);

    // Debris — 12 chunks
    var debrisList = [];
    for (var di = 0; di < 12; di++) {
      var dGeo  = new THREE.BoxGeometry(
        0.15 + Math.random() * 0.3,
        0.15 + Math.random() * 0.3,
        0.15 + Math.random() * 0.3
      );
      var dMat  = new THREE.MeshLambertMaterial({ color: 0x555533 });
      var dMesh = new THREE.Mesh(dGeo, dMat);
      dMesh.position.copy(pos);
      _scene.add(dMesh);

      var angle = Math.random() * Math.PI * 2;
      var power = 4 + Math.random() * 8;
      debrisList.push({
        mesh: dMesh,
        vx:   Math.cos(angle) * power,
        vy:   3 + Math.random() * 6,
        vz:   Math.sin(angle) * power,
        life: 1.5 + Math.random() * 1.0
      });
    }

    // Crater (flat disc on ground)
    var craterGeo  = new THREE.CylinderGeometry(radius, radius * 1.2, 0.08, 16);
    var craterMat  = new THREE.MeshLambertMaterial({ color: 0x2A2210 });
    var craterMesh = new THREE.Mesh(craterGeo, craterMat);
    craterMesh.position.set(pos.x, 0.04, pos.z);
    _scene.add(craterMesh);
    _craters.push(craterMesh);

    _explosions.push({
      light:    light,
      fireball: fbMesh,
      life:     0.6,
      maxLife:  0.6
    });

    for (var bi = 0; bi < debrisList.length; bi++) {
      _debris.push(debrisList[bi]);
    }

    // Apply damage to active tank if nearby
    if (_activeTank) {
      var dp = _activeTank.group.position;
      var ex = pos.x - dp.x;
      var ez = pos.z - dp.z;
      var dist = Math.sqrt(ex * ex + ez * ez);
      if (dist < radius * 2) {
        var dmg = Math.floor(80 * (1 - dist / (radius * 2)));
        _activeTank.hp = Math.max(0, _activeTank.hp - dmg);
        _tankHP        = _activeTank.hp;
        // Damage tracks
        if (Math.random() > 0.5) {
          _trackHPLeft  = Math.max(0, _trackHPLeft  - Math.floor(dmg * 0.5));
        } else {
          _trackHPRight = Math.max(0, _trackHPRight - Math.floor(dmg * 0.5));
        }
      }
    }

    _playExplosion();
  }

  // ═══════════════════════════════════════════════════════════
  //  SMOKE / FIRE PARTICLES
  // ═══════════════════════════════════════════════════════════
  function _updateDamageEffects(tank, dt) {
    var hp = tank.hp;

    // Smoke at <= 250 HP
    if (hp <= HP_SMOKE) {
      tank.smokeTimer -= dt;
      if (tank.smokeTimer <= 0) {
        tank.smokeTimer = 0.2 + Math.random() * 0.2;
        var smokeGeo = new THREE.SphereGeometry(0.3 + Math.random() * 0.3, 5, 4);
        var smokeMat = new THREE.MeshBasicMaterial({
          color:       0x888888,
          transparent: true,
          opacity:     0.55
        });
        var smokeMesh = new THREE.Mesh(smokeGeo, smokeMat);
        var pos = tank.group.position;
        smokeMesh.position.set(
          pos.x + (Math.random() - 0.5) * 1.5,
          pos.y + 2.5 + Math.random() * 0.5,
          pos.z + (Math.random() - 0.5) * 1.5
        );
        _scene.add(smokeMesh);
        tank.smokeParticles.push({ mesh: smokeMesh, mat: smokeMat, life: 1.8 });
      }
    }

    // Fire at <= 100 HP
    if (hp <= HP_FIRE) {
      tank.fireTimer -= dt;
      if (tank.fireTimer <= 0) {
        tank.fireTimer = 0.06 + Math.random() * 0.04;
        var fireGeo = new THREE.SphereGeometry(0.2 + Math.random() * 0.25, 5, 4);
        var fireMat = new THREE.MeshBasicMaterial({
          color: Math.random() > 0.5 ? 0xFF5500 : 0xFFAA00,
          transparent: true,
          opacity: 0.85
        });
        var fireMesh = new THREE.Mesh(fireGeo, fireMat);
        var fpos = tank.group.position;
        fireMesh.position.set(
          fpos.x + (Math.random() - 0.5) * 1.2,
          fpos.y + 1.5 + Math.random() * 1.0,
          fpos.z + (Math.random() - 0.5) * 1.2
        );
        _scene.add(fireMesh);
        tank.fireParticles.push({ mesh: fireMesh, mat: fireMat, life: 0.4 });
      }
    }

    // Age smoke
    for (var si = tank.smokeParticles.length - 1; si >= 0; si--) {
      var sp = tank.smokeParticles[si];
      sp.life -= dt;
      sp.mesh.position.y += dt * 1.5;
      sp.mat.opacity = Math.max(0, 0.55 * (sp.life / 1.8));
      if (sp.life <= 0) {
        _scene.remove(sp.mesh);
        tank.smokeParticles.splice(si, 1);
      }
    }

    // Age fire
    for (var fi = tank.fireParticles.length - 1; fi >= 0; fi--) {
      var fp = tank.fireParticles[fi];
      fp.life -= dt;
      fp.mesh.position.y += dt * 2.0;
      fp.mat.opacity = Math.max(0, 0.85 * (fp.life / 0.4));
      if (fp.life <= 0) {
        _scene.remove(fp.mesh);
        tank.fireParticles.splice(fi, 1);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  PLAYER POSITION HELPER
  // ═══════════════════════════════════════════════════════════
  function _getPlayerPos() {
    if (_player && _player.position) return _player.position;
    if (_camera) return _camera.position;
    return new THREE.Vector3(0, 0, 0);
  }

  function _findNearestTank() {
    if (_tanks.length === 0) return null;
    var ppos = _getPlayerPos();
    var nearest = null;
    var nearDist = Infinity;
    for (var ti = 0; ti < _tanks.length; ti++) {
      var t  = _tanks[ti];
      var dx = t.group.position.x - ppos.x;
      var dz = t.group.position.z - ppos.z;
      var d  = Math.sqrt(dx * dx + dz * dz);
      if (d < nearDist) {
        nearDist = d;
        nearest  = t;
      }
    }
    return nearest;
  }

  // ═══════════════════════════════════════════════════════════
  //  SPAWN / BOARD / EXIT
  // ═══════════════════════════════════════════════════════════
  function _spawnTank() {
    var ppos = _getPlayerPos();
    var tank = _buildTankMesh(ppos.x + 4, 0, ppos.z + 4);
    _tanks.push(tank);
    console.log('[TankCommander] Tank spawned at', ppos.x + 4, 0, ppos.z + 4);
  }

  function _boardTank() {
    var nearest = _findNearestTank();
    if (!nearest) { console.log('[TankCommander] No tank found'); return; }

    var ppos = _getPlayerPos();
    var dx   = nearest.group.position.x - ppos.x;
    var dz   = nearest.group.position.z - ppos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > ENTER_DIST) {
      console.log('[TankCommander] Too far from tank (' + dist.toFixed(1) + 'm)');
      return;
    }

    _activeTank  = nearest;
    _tankHP      = nearest.hp;
    _yaw         = nearest.yaw;
    _turretYaw   = nearest.turretYaw;
    _speed       = 0;
    _trackHPLeft = 100;
    _trackHPRight= 100;
    _mainGunCooldown = 0;
    _mgCooldown  = 0;

    _startEngine();
    console.log('[TankCommander] Boarded tank');
  }

  function _exitTank() {
    if (!_activeTank) return;
    _activeTank.yaw      = _yaw;
    _activeTank.turretYaw= _turretYaw;
    _activeTank.hp       = _tankHP;
    _activeTank = null;
    _speed      = 0;
    _stopEngine();
    console.log('[TankCommander] Exited tank');
  }

  // ═══════════════════════════════════════════════════════════
  //  INPUT BINDING
  // ═══════════════════════════════════════════════════════════
  function _bindInput() {
    if (_bound) return;
    _bound = true;

    document.addEventListener('keydown', function (e) {
      var key = e.key.toLowerCase();
      if (key === 'w') _keys.w = true;
      if (key === 's') _keys.s = true;
      if (key === 'a') _keys.a = true;
      if (key === 'd') _keys.d = true;
      if (key === 't') _spawnTank();
      if (key === 'k') _boardTank();
      if (key === 'e' && _activeTank) _exitTank();
    });

    document.addEventListener('keyup', function (e) {
      var key = e.key.toLowerCase();
      if (key === 'w') _keys.w = false;
      if (key === 's') _keys.s = false;
      if (key === 'a') _keys.a = false;
      if (key === 'd') _keys.d = false;
    });

    document.addEventListener('mousemove', function (e) {
      _mouseDX += e.movementX || 0;
    });

    document.addEventListener('mousedown', function (e) {
      if (!_activeTank) return;
      if (e.button === 0) { _lmbDown = true; _fireMainGun(); }
      if (e.button === 2) { _rmbDown = true; }
    });

    document.addEventListener('mouseup', function (e) {
      if (e.button === 0) _lmbDown = false;
      if (e.button === 2) _rmbDown = false;
    });

    document.addEventListener('contextmenu', function (e) {
      if (_activeTank) e.preventDefault();
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  MAIN UPDATE
  // ═══════════════════════════════════════════════════════════
  function update(dt) {
    if (!_scene) return;

    // ── Turret yaw from mouse ─────────────────────────────────
    if (_activeTank && _mouseDX !== 0) {
      _turretYaw += _mouseDX * TURRET_SENS;
      _activeTank.turretYaw = _turretYaw;
      _mouseDX = 0;
    } else {
      _mouseDX = 0;
    }

    // ── Driving ───────────────────────────────────────────────
    if (_activeTank) {
      // Track damage speed penalty
      var trkDmgLeft  = _trackHPLeft  / _trackMaxHP;
      var trkDmgRight = _trackHPRight / _trackMaxHP;
      var avgTrk      = (trkDmgLeft + trkDmgRight) * 0.5;
      var spdMult     = avgTrk < 0.5 ? 0.5 : 1.0;
      var maxSpeed    = TANK_SPEED * spdMult;

      // Turning — track damage causes veering
      var leftRate  = TURN_RATE * trkDmgLeft;
      var rightRate = TURN_RATE * trkDmgRight;

      if (_keys.a) _yaw -= leftRate * dt;
      if (_keys.d) _yaw += rightRate * dt;

      // Veering from imbalanced tracks (only when moving)
      if (Math.abs(_speed) > 0.1) {
        var veer = (trkDmgLeft - trkDmgRight) * 0.4;
        _yaw += veer * dt;
      }

      // Speed
      if (_keys.w) {
        _speed = Math.min(_speed + DRIVE_ACCEL * dt, maxSpeed);
      } else if (_keys.s) {
        _speed = Math.max(_speed - DRIVE_ACCEL * dt, -maxSpeed * 0.5);
      } else {
        if (_speed > 0) {
          _speed = Math.max(_speed - DRIVE_FRICTION * dt, 0);
        } else if (_speed < 0) {
          _speed = Math.min(_speed + DRIVE_FRICTION * dt, 0);
        }
      }

      // Move hull
      var tank = _activeTank;
      tank.group.position.x += Math.sin(_yaw) * _speed * dt;
      tank.group.position.z += Math.cos(_yaw) * _speed * dt;
      tank.group.rotation.y  = _yaw;
      tank.yaw               = _yaw;

      // Turret rotation (relative to hull)
      tank.turretGroup.rotation.y = _turretYaw;

      // Recoil animation
      _recoilOffset *= (1 - dt * 6);
      if (Math.abs(_recoilOffset) < 0.01) _recoilOffset = 0;
      tank.barrelGroup.position.z = _recoilOffset;

      // Wheel spin
      _wheelSpin += _speed * dt * 0.8;
      for (var wi = 0; wi < tank.trackAssemblies.length; wi++) {
        var ass = tank.trackAssemblies[wi];
        for (var bj = 0; bj < ass.bogeys.length; bj++) {
          ass.bogeys[bj].bogey.rotation.x = _wheelSpin;
        }
      }

      // MG fire
      _mgCooldown -= dt;
      if (_rmbDown) _fireMG();

      // Cooldown
      if (_mainGunCooldown > 0) _mainGunCooldown -= dt;
      if (_mainGunCooldown < 0) _mainGunCooldown = 0;

      // Commander camera: positioned at turret hatch
      var totalYaw   = _yaw + _turretYaw;
      var turretWPos = new THREE.Vector3();
      tank.turretGroup.getWorldPosition(turretWPos);

      _camera.position.set(
        turretWPos.x - Math.sin(totalYaw) * 0.4,
        turretWPos.y + CAM_UP,
        turretWPos.z - Math.cos(totalYaw) * 0.4
      );

      // Camera looks along turret direction
      var lookTarget = new THREE.Vector3(
        turretWPos.x + Math.sin(totalYaw) * 20,
        turretWPos.y,
        turretWPos.z + Math.cos(totalYaw) * 20
      );
      _camera.lookAt(lookTarget);

      _updateEngine(dt);
      _updateDamageEffects(tank, dt);
    }

    // ── Shell flight ──────────────────────────────────────────
    for (var si = _shells.length - 1; si >= 0; si--) {
      var shell = _shells[si];
      shell.mesh.position.x += shell.velX * dt;
      shell.mesh.position.y += shell.velY * dt;
      shell.mesh.position.z += shell.velZ * dt;
      shell.life -= dt;

      if (shell.life <= 0 || shell.mesh.position.y < -1) {
        _spawnExplosion(shell.mesh.position.clone(), MAIN_GUN_RADIUS);
        _scene.remove(shell.mesh);
        _shells.splice(si, 1);
      }
    }

    // ── Tracer fade ───────────────────────────────────────────
    for (var tri = _tracers.length - 1; tri >= 0; tri--) {
      var tr = _tracers[tri];
      tr.life -= dt;
      tr.mat.opacity = Math.max(0, tr.life / 0.12);
      if (tr.life <= 0) {
        _scene.remove(tr.mesh);
        _tracers.splice(tri, 1);
      }
    }

    // ── Explosions fade ───────────────────────────────────────
    for (var ei = _explosions.length - 1; ei >= 0; ei--) {
      var ex = _explosions[ei];
      ex.life -= dt;
      var pct = ex.life / ex.maxLife;
      ex.light.intensity    = 12 * pct;
      ex.fireball.scale.setScalar(1 + (1 - pct) * 2);
      if (ex.fireball.material) {
        ex.fireball.material.opacity = pct;
        ex.fireball.material.transparent = true;
      }
      if (ex.life <= 0) {
        _scene.remove(ex.light);
        _scene.remove(ex.fireball);
        _explosions.splice(ei, 1);
      }
    }

    // ── Debris physics ────────────────────────────────────────
    for (var dbi = _debris.length - 1; dbi >= 0; dbi--) {
      var db = _debris[dbi];
      db.vy  -= 9.8 * dt;
      db.mesh.position.x += db.vx * dt;
      db.mesh.position.y += db.vy * dt;
      db.mesh.position.z += db.vz * dt;
      db.mesh.rotation.x += db.vx * dt * 0.5;
      db.mesh.rotation.z += db.vz * dt * 0.5;
      db.life -= dt;
      if (db.life <= 0 || db.mesh.position.y < -3) {
        _scene.remove(db.mesh);
        _debris.splice(dbi, 1);
      }
    }

    _updateHUD();
  }

  // ═══════════════════════════════════════════════════════════
  //  INIT / RESET
  // ═══════════════════════════════════════════════════════════
  function init(scene, camera, playerRef) {
    _scene  = scene;
    _camera = camera;
    _player = playerRef || null;
    _buildHUD();
    _bindInput();
    console.log('[TankCommander] Initialized. T=spawn tank, K=board, E=exit');
  }

  function reset() {
    // Remove all tanks
    for (var ti = 0; ti < _tanks.length; ti++) {
      _scene.remove(_tanks[ti].group);
    }
    _tanks      = [];
    _activeTank = null;

    // Remove shells
    for (var si = 0; si < _shells.length; si++) _scene.remove(_shells[si].mesh);
    _shells = [];

    // Remove tracers
    for (var tri = 0; tri < _tracers.length; tri++) _scene.remove(_tracers[tri].mesh);
    _tracers = [];

    // Remove explosions
    for (var ei = 0; ei < _explosions.length; ei++) {
      _scene.remove(_explosions[ei].light);
      _scene.remove(_explosions[ei].fireball);
    }
    _explosions = [];

    // Remove debris
    for (var dbi = 0; dbi < _debris.length; dbi++) _scene.remove(_debris[dbi].mesh);
    _debris = [];

    // Remove craters
    for (var ci = 0; ci < _craters.length; ci++) _scene.remove(_craters[ci]);
    _craters = [];

    // State reset
    _speed           = 0;
    _yaw             = 0;
    _turretYaw       = 0;
    _tankHP          = 500;
    _mainGunCooldown = 0;
    _mainGunAmmo     = 12;
    _mgCooldown      = 0;
    _trackHPLeft     = 100;
    _trackHPRight    = 100;
    _recoilOffset    = 0;
    _lmbDown         = false;
    _rmbDown         = false;

    _stopEngine();
  }

  return { init: init, update: update, reset: reset };
})();
