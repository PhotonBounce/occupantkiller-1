/* ───────────────────────────────────────────────────────────────────────────
   air-assault.js — Air Assault Operations: helicopter insertion, air cavalry,
   and extraction into hot LZs
   API: window.AirAssault = { init, update, reset }
   Controls:
     A + A (double-tap)  → call air assault insertion
     Click               → mark LZ position
     Shift + A           → spawn gunship escort
     A + X (sequence)    → mark extraction LZ
   ─────────────────────────────────────────────────────────────────────────── */
window.AirAssault = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;
  var _player = null;   // optional player object { position: THREE.Vector3 }

  /* ── Insertion state ───────────────────────────────────────────────────── */
  var _insertionPhase  = 'idle';
  // idle | en_route | descending | hovering | departing | crashed
  var _insertionTimer  = 0;
  var _cooldownTimer   = 0;
  var COOLDOWN_TIME    = 300;   // 5-minute extraction cooldown (seconds)
  var HOVER_DURATION   = 10;    // seconds to hover at LZ

  /* ── LZ ────────────────────────────────────────────────────────────────── */
  var _lzPos           = null;  // THREE.Vector3
  var _lzHot           = false;
  var _lzMarker        = null;  // THREE.Mesh (circle on ground)
  var _extractionLZ    = null;  // THREE.Vector3
  var _extractionMarker= null;  // THREE.Mesh
  var _extractionReady = false;
  var _extractionUsed  = false;

  /* ── UH-60 helicopter ──────────────────────────────────────────────────── */
  var _heli            = null;  // THREE.Group
  var _heliHP          = 200;
  var HP_MAX           = 200;
  var _mainRotor       = null;
  var _tailRotor       = null;
  var _leftDoor        = null;
  var _rightDoor       = null;
  var _doorsOpen       = false;
  var _smokeParticles  = [];
  var _crashing        = false;
  var _crashAngle      = 0;
  var _crashTimer      = 0;
  var CRASH_DURATION   = 3;

  /* ── Flight path ───────────────────────────────────────────────────────── */
  var _heliStart       = null;  // THREE.Vector3 spawn at edge
  var _heliTarget      = null;  // THREE.Vector3 LZ at Y=2
  var _heliDepart      = null;  // THREE.Vector3 opposite edge
  var APPROACH_SPEED   = 15;    // units/s
  var DEPART_SPEED     = 20;
  var SPAWN_Y          = 25;

  /* ── Squad NPCs ────────────────────────────────────────────────────────── */
  var _squad           = [];    // array of { mesh, vx, vy, vz, landed, targetX, targetZ }
  var SQUAD_SIZE       = 4;

  /* ── Door gunner ───────────────────────────────────────────────────────── */
  var _gunnerActive    = false;
  var _gunnerCooldown  = 0;
  var _muzzleFlash     = null;
  var _tracers         = [];    // { line, life, maxLife }
  var GUNNER_RANGE     = 40;
  var GUNNER_FIRE_RATE = 0.08;  // seconds between shots

  /* ── Gunship escort ────────────────────────────────────────────────────── */
  var _escort          = null;  // THREE.Group
  var _escortActive    = false;
  var _escortAngle     = 0;
  var ESCORT_RADIUS    = 25;
  var ESCORT_Y         = 15;
  var _escortRockets   = [];    // { line, pos, dir, life }
  var _escortMainRotor = null;
  var _escortTailRotor = null;
  var _escortFireCool  = 0;
  var ESCORT_FIRE_INTERVAL = 2; // seconds between rocket volleys

  /* ── Explosion particles ───────────────────────────────────────────────── */
  var _explosionParticles = [];  // { mesh, vx, vy, vz, life, maxLife }

  /* ── Input ─────────────────────────────────────────────────────────────── */
  var _keysDown        = {};
  var _lastATime       = -999;  // for double-tap A detection
  var _aSequence       = false; // tracking A+X extraction sequence
  var _aXTimer         = 0;
  var _shiftHeld       = false;

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hudEl           = null;
  var _statusMsg       = '';
  var _etaDisplay      = 0;

  /* ── Enemies reference ─────────────────────────────────────────────────── */
  // We look for window.Enemies or window.enemies as an array of { mesh }
  function _getEnemies () {
    if (window.Enemies && Array.isArray(window.Enemies.list)) return window.Enemies.list;
    if (window.enemies && Array.isArray(window.enemies)) return window.enemies;
    return [];
  }

  /* ═══════════════════════════════════════════════════════════════════════
     HUD
     ═══════════════════════════════════════════════════════════════════════ */
  function _ensureHUD () {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'air-assault-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.65)',
      'color:#b0ffb0',
      'font-family:"Courier New",monospace',
      'font-size:13px',
      'font-weight:bold',
      'padding:6px 14px',
      'border:1px solid #3a7a3a',
      'border-radius:4px',
      'pointer-events:none',
      'display:none',
      'letter-spacing:1px',
      'z-index:9999'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD () {
    if (!_hudEl) return;
    if (_insertionPhase === 'idle' && !_escortActive) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';

    var status = 'IDLE';
    var eta    = '';
    var lzStr  = _lzHot ? 'HOT' : 'COLD';
    var escort = _escortActive ? 'ACTIVE' : 'NONE';

    if (_insertionPhase === 'en_route') {
      status = 'EN ROUTE';
      var s = Math.max(0, Math.round(_etaDisplay));
      var mm = Math.floor(s / 60);
      var ss = s % 60;
      eta = ' ' + (mm < 10 ? '0' + mm : mm) + ':' + (ss < 10 ? '0' + ss : ss);
    } else if (_insertionPhase === 'descending') {
      status = 'DESCENDING';
    } else if (_insertionPhase === 'hovering') {
      status = 'HOVERING';
    } else if (_insertionPhase === 'departing') {
      status = 'DEPARTING';
    } else if (_insertionPhase === 'crashed') {
      status = 'CRASHED';
    }

    _hudEl.innerHTML =
      'AIR ASSAULT' +
      ' &nbsp;[STATUS: ' + status + eta + ']' +
      ' &nbsp;[LZ: ' + lzStr + ']' +
      ' &nbsp;[ESCORT: ' + escort + ']';
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Mesh builders
     ═══════════════════════════════════════════════════════════════════════ */

  function _buildUH60 () {
    var group = new THREE.Group();

    /* fuselage — 5×2×2.5 */
    var fusMat = new THREE.MeshLambertMaterial({ color: 0x3A5A3A });
    var fusGeo = new THREE.BoxGeometry(5, 2, 2.5);
    var fuselage = new THREE.Mesh(fusGeo, fusMat);
    group.add(fuselage);

    /* side doors (left / right, small box against fuselage side) */
    var doorMat = new THREE.MeshLambertMaterial({ color: 0x2a4a2a });
    var doorGeo = new THREE.BoxGeometry(1.2, 0.9, 0.15);

    var leftDoor = new THREE.Mesh(doorGeo, doorMat);
    leftDoor.position.set(-0.4, -0.1, 1.3);
    group.add(leftDoor);

    var rightDoor = new THREE.Mesh(doorGeo, doorMat);
    rightDoor.position.set(-0.4, -0.1, -1.3);
    group.add(rightDoor);

    /* cockpit bubble */
    var cockpitGeo = new THREE.BoxGeometry(1.2, 0.8, 2.0);
    var cockpitMat = new THREE.MeshLambertMaterial({ color: 0x1a3a1a, transparent: true, opacity: 0.7 });
    var cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(2.5, 0.2, 0);
    group.add(cockpit);

    /* gunner window boxes (porthole-style) */
    var winMat = new THREE.MeshLambertMaterial({ color: 0x111111, transparent: true, opacity: 0.6 });
    var winGeo = new THREE.BoxGeometry(0.5, 0.4, 0.1);
    [-1, 0, 1].forEach(function (xoff) {
      var wL = new THREE.Mesh(winGeo, winMat);
      wL.position.set(xoff, 0.3, 1.28);
      group.add(wL);
      var wR = new THREE.Mesh(winGeo, winMat);
      wR.position.set(xoff, 0.3, -1.28);
      group.add(wR);
    });

    /* tail boom */
    var tailGeo = new THREE.BoxGeometry(3, 0.5, 0.5);
    var tailMesh = new THREE.Mesh(tailGeo, fusMat);
    tailMesh.position.set(-3.5, 0.2, 0);
    group.add(tailMesh);

    /* main rotor — CylinderGeometry radius 4 */
    var mainRotorGeo = new THREE.CylinderGeometry(4, 4, 0.12, 12, 1, false);
    var mainRotorMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a, side: THREE.DoubleSide });
    var mainRotor = new THREE.Mesh(mainRotorGeo, mainRotorMat);
    mainRotor.position.set(0, 1.2, 0);
    /* cut disc to look like blades: 2 thin box blades */
    var bladeMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var bladeGeo1 = new THREE.BoxGeometry(8.2, 0.08, 0.35);
    var blade1 = new THREE.Mesh(bladeGeo1, bladeMat);
    var blade2 = new THREE.Mesh(bladeGeo1, bladeMat);
    blade2.rotation.y = Math.PI / 2;
    var rotorHub = new THREE.Group();
    rotorHub.add(blade1);
    rotorHub.add(blade2);
    rotorHub.position.set(0, 1.25, 0);
    group.add(rotorHub);

    /* tail rotor — CylinderGeometry radius 1 */
    var tailRotorGeo = new THREE.CylinderGeometry(1, 1, 0.08, 8, 1, false);
    var tailRotor = new THREE.Mesh(tailRotorGeo, mainRotorMat);
    /* orient vertically (spin on Z axis) */
    var tailBladeGeo = new THREE.BoxGeometry(0.08, 2.1, 0.25);
    var tBlade1 = new THREE.Mesh(tailBladeGeo, bladeMat);
    var tBlade2 = new THREE.Mesh(tailBladeGeo, bladeMat);
    tBlade2.rotation.z = Math.PI / 2;
    var tailRotorHub = new THREE.Group();
    tailRotorHub.add(tBlade1);
    tailRotorHub.add(tBlade2);
    tailRotorHub.position.set(-5.1, 0.4, 0.3);
    group.add(tailRotorHub);

    /* skid landing gear */
    var skidMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var skidGeo = new THREE.BoxGeometry(3.5, 0.1, 0.12);
    var skidL = new THREE.Mesh(skidGeo, skidMat);
    skidL.position.set(-0.3, -1.1, 1.0);
    group.add(skidL);
    var skidR = new THREE.Mesh(skidGeo, skidMat);
    skidR.position.set(-0.3, -1.1, -1.0);
    group.add(skidR);
    /* skid struts */
    var strutGeo = new THREE.BoxGeometry(0.1, 0.5, 0.1);
    [-1, 0.8].forEach(function (xoff) {
      var sL = new THREE.Mesh(strutGeo, skidMat);
      sL.position.set(xoff, -0.8, 1.0);
      group.add(sL);
      var sR = new THREE.Mesh(strutGeo, skidMat);
      sR.position.set(xoff, -0.8, -1.0);
      group.add(sR);
    });

    /* door gunner: minigun box */
    var minigunGeo = new THREE.BoxGeometry(0.25, 0.25, 0.7);
    var minigunMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var minigun = new THREE.Mesh(minigunGeo, minigunMat);
    minigun.position.set(0, -0.5, 1.35);
    group.add(minigun);

    return {
      group:       group,
      rotorHub:    rotorHub,
      tailRotorHub:tailRotorHub,
      leftDoor:    leftDoor,
      rightDoor:   rightDoor,
      minigun:     minigun
    };
  }

  function _buildEscortHeli () {
    var group = new THREE.Group();
    var mat = new THREE.MeshLambertMaterial({ color: 0x111111 });

    /* narrower fuselage 3×1×2 */
    var fusGeo = new THREE.BoxGeometry(3, 1, 2);
    var fuselage = new THREE.Mesh(fusGeo, mat);
    group.add(fuselage);

    /* stub wings */
    var wingGeo = new THREE.BoxGeometry(0.5, 0.15, 1.8);
    var wingMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
    var wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.set(0, -0.3, 2.2);
    group.add(wingL);
    var wingR = new THREE.Mesh(wingGeo, wingMat);
    wingR.position.set(0, -0.3, -2.2);
    group.add(wingR);

    /* tail */
    var tailGeo = new THREE.BoxGeometry(2, 0.35, 0.35);
    var tail = new THREE.Mesh(tailGeo, mat);
    tail.position.set(-2.2, 0.1, 0);
    group.add(tail);

    /* main rotor blades */
    var bladeMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var bladeGeo = new THREE.BoxGeometry(6, 0.07, 0.3);
    var b1 = new THREE.Mesh(bladeGeo, bladeMat);
    var b2 = new THREE.Mesh(bladeGeo, bladeMat);
    b2.rotation.y = Math.PI / 2;
    var rotorHub = new THREE.Group();
    rotorHub.add(b1);
    rotorHub.add(b2);
    rotorHub.position.set(0, 0.7, 0);
    group.add(rotorHub);

    /* tail rotor */
    var tBladeGeo = new THREE.BoxGeometry(0.07, 1.4, 0.2);
    var tB1 = new THREE.Mesh(tBladeGeo, bladeMat);
    var tB2 = new THREE.Mesh(tBladeGeo, bladeMat);
    tB2.rotation.z = Math.PI / 2;
    var tailRotorHub = new THREE.Group();
    tailRotorHub.add(tB1);
    tailRotorHub.add(tB2);
    tailRotorHub.position.set(-3.3, 0.3, 0.25);
    group.add(tailRotorHub);

    return { group: group, rotorHub: rotorHub, tailRotorHub: tailRotorHub };
  }

  /* ═══════════════════════════════════════════════════════════════════════
     LZ Marker (circle ring on ground)
     ═══════════════════════════════════════════════════════════════════════ */
  function _buildLZMarker (color) {
    var geo = new THREE.RingGeometry(3.5, 4.5, 24);
    var mat = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Hot LZ detection
     ═══════════════════════════════════════════════════════════════════════ */
  function _checkHotLZ (lzPos) {
    var enemies = _getEnemies();
    var hot = false;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.mesh) continue;
      var dx = e.mesh.position.x - lzPos.x;
      var dz = e.mesh.position.z - lzPos.z;
      if (Math.sqrt(dx * dx + dz * dz) < 30) { hot = true; break; }
    }
    return hot;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Pilot voice (synthetic via Web Audio)
     ═══════════════════════════════════════════════════════════════════════ */
  function _pilotVoice (msg) {
    /* Show as on-screen toast */
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:22%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(180,0,0,0.82)',
      'color:#fff',
      'font-family:"Courier New",monospace',
      'font-size:18px',
      'font-weight:bold',
      'padding:8px 20px',
      'border:2px solid #ff4444',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:10000',
      'letter-spacing:2px'
    ].join(';');
    el.textContent = '⚠ PILOT: ' + msg;
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 4000);

    /* crude buzzer via Web Audio */
    try {
      var actx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = actx.createOscillator();
      var gain = actx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 420;
      gain.gain.setValueAtTime(0.18, actx.currentTime);
      gain.gain.linearRampToValueAtTime(0, actx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start();
      osc.stop(actx.currentTime + 0.8);
    } catch (err) { /* audio not available */ }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Spawn helicopter at map edge
     ═══════════════════════════════════════════════════════════════════════ */
  function _spawnHelicopter () {
    if (!_scene || !_lzPos) return;

    /* build mesh */
    var built = _buildUH60();
    _heli       = built.group;
    _mainRotor  = built.rotorHub;
    _tailRotor  = built.tailRotorHub;
    _leftDoor   = built.leftDoor;
    _rightDoor  = built.rightDoor;
    _heliHP     = HP_MAX;
    _doorsOpen  = false;
    _crashAngle = 0;
    _crashTimer = 0;
    _crashingLocal = false;

    /* pick an edge: X+ side */
    var edgeX   = 200;
    _heliStart  = new THREE.Vector3(edgeX, SPAWN_Y, _lzPos.z);
    _heliTarget = new THREE.Vector3(_lzPos.x, 2, _lzPos.z);
    _heliDepart = new THREE.Vector3(-edgeX, SPAWN_Y, _lzPos.z);

    _heli.position.copy(_heliStart);
    /* face direction of travel */
    _heli.rotation.y = Math.atan2(_lzPos.x - edgeX, 0) + Math.PI / 2;
    _scene.add(_heli);

    /* ETA estimate */
    var dist = _heliStart.distanceTo(_heliTarget);
    _etaDisplay = dist / APPROACH_SPEED;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Squad insertion
     ═══════════════════════════════════════════════════════════════════════ */
  function _insertSquad () {
    if (!_scene || !_lzPos || !_heli) return;
    var offsets = [
      { x: 5,  z: 0  },
      { x: -5, z: 0  },
      { x: 0,  z: 5  },
      { x: 0,  z: -5 }
    ];
    for (var i = 0; i < SQUAD_SIZE; i++) {
      var geo  = new THREE.CylinderGeometry(0.3, 0.3, 1.7, 8);
      var mat  = new THREE.MeshLambertMaterial({ color: 0x3a5a2a });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(_heli.position);
      mesh.position.y = _heli.position.y - 1;
      _scene.add(mesh);
      _squad.push({
        mesh:    mesh,
        vy:      -2,
        targetX: _lzPos.x + offsets[i].x,
        targetZ: _lzPos.z + offsets[i].z,
        landed:  false
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Explosion
     ═══════════════════════════════════════════════════════════════════════ */
  function _spawnExplosion (pos) {
    for (var i = 0; i < 18; i++) {
      var geo = new THREE.SphereGeometry(0.25 + Math.random() * 0.5, 5, 5);
      var mat = new THREE.MeshBasicMaterial({ color: i < 9 ? 0xff6600 : 0xffcc00 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      _scene.add(mesh);
      _explosionParticles.push({
        mesh: mesh,
        mat:  mat,
        vx:   (Math.random() - 0.5) * 18,
        vy:   Math.random() * 14 + 2,
        vz:   (Math.random() - 0.5) * 18,
        life: 0,
        maxLife: 1.5 + Math.random() * 1.0
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Smoke particle for damaged heli
     ═══════════════════════════════════════════════════════════════════════ */
  function _spawnSmoke (pos) {
    var geo = new THREE.SphereGeometry(0.4 + Math.random() * 0.4, 5, 5);
    var mat = new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.6 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.x += (Math.random() - 0.5);
    mesh.position.z += (Math.random() - 0.5);
    _scene.add(mesh);
    _smokeParticles.push({ mesh: mesh, mat: mat, vy: 2 + Math.random(), life: 0, maxLife: 1.2 });
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Gunner fire
     ═══════════════════════════════════════════════════════════════════════ */
  function _gunnerFire () {
    if (!_heli || !_scene) return;
    var enemies = _getEnemies();
    var heliPos = _heli.position;
    var nearest = null;
    var nearDist = Infinity;

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.mesh || e.dead) continue;
      var dx = e.mesh.position.x - heliPos.x;
      var dz = e.mesh.position.z - heliPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < GUNNER_RANGE && dist < nearDist) {
        nearDist = dist;
        nearest  = e;
      }
    }

    if (!nearest) return;

    /* tracer line */
    var from = heliPos.clone().add(new THREE.Vector3(0, -0.5, 1.35));
    var to   = nearest.mesh.position.clone();
    var pts  = [from, to];
    var geo  = new THREE.BufferGeometry().setFromPoints(pts);
    var mat  = new THREE.LineBasicMaterial({ color: 0xffff00 });
    var line = new THREE.LineSegments(geo, mat);
    _scene.add(line);
    _tracers.push({ line: line, life: 0, maxLife: 0.12 });

    /* muzzle flash */
    if (_muzzleFlash) {
      _muzzleFlash.visible = true;
      setTimeout(function () { if (_muzzleFlash) _muzzleFlash.visible = false; }, 60);
    } else {
      var fGeo = new THREE.SphereGeometry(0.3, 5, 5);
      var fMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      _muzzleFlash = new THREE.Mesh(fGeo, fMat);
      _muzzleFlash.position.copy(from);
      _scene.add(_muzzleFlash);
    }

    /* deal damage */
    if (nearest.hp !== undefined) {
      nearest.hp -= 15;
    }
    if (nearest.takeDamage) nearest.takeDamage(15);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Escort gunship: fire rockets
     ═══════════════════════════════════════════════════════════════════════ */
  function _escortFireRockets () {
    if (!_escort || !_scene || !_lzPos) return;
    var enemies = _getEnemies();
    var count = 0;
    for (var i = 0; i < enemies.length && count < 2; i++) {
      var e = enemies[i];
      if (!e || !e.mesh || e.dead) continue;
      var dx = e.mesh.position.x - _lzPos.x;
      var dz = e.mesh.position.z - _lzPos.z;
      if (Math.sqrt(dx * dx + dz * dz) > 80) continue;

      /* create rocket as LineSegments */
      var from = _escort.position.clone();
      var to   = e.mesh.position.clone();
      var dir  = to.clone().sub(from).normalize();
      var pts  = [from.clone(), from.clone().add(dir.clone().multiplyScalar(1.5))];
      var geo  = new THREE.BufferGeometry().setFromPoints(pts);
      var mat  = new THREE.LineBasicMaterial({ color: 0xff8800 });
      var line = new THREE.LineSegments(geo, mat);
      _scene.add(line);
      _escortRockets.push({ line: line, pos: from.clone(), dir: dir, target: e, life: 0, maxLife: 3 });
      count++;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Door animation
     ═══════════════════════════════════════════════════════════════════════ */
  function _openDoors () {
    if (_doorsOpen || !_leftDoor || !_rightDoor) return;
    _doorsOpen = true;
  }

  function _closeDoors () {
    if (!_doorsOpen || !_leftDoor || !_rightDoor) return;
    _doorsOpen = false;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Cleanup
     ═══════════════════════════════════════════════════════════════════════ */
  function _removeHeli () {
    if (_heli && _scene) {
      _scene.remove(_heli);
      _heli = null;
    }
    _mainRotor  = null;
    _tailRotor  = null;
    _leftDoor   = null;
    _rightDoor  = null;
  }

  function _removeSmoke () {
    for (var i = 0; i < _smokeParticles.length; i++) {
      if (_smokeParticles[i].mesh && _scene) _scene.remove(_smokeParticles[i].mesh);
    }
    _smokeParticles = [];
  }

  function _removeTracers () {
    for (var i = 0; i < _tracers.length; i++) {
      if (_tracers[i].line && _scene) _scene.remove(_tracers[i].line);
    }
    _tracers = [];
    for (var j = 0; j < _escortRockets.length; j++) {
      if (_escortRockets[j].line && _scene) _scene.remove(_escortRockets[j].line);
    }
    _escortRockets = [];
  }

  function _removeSquad () {
    for (var i = 0; i < _squad.length; i++) {
      if (_squad[i].mesh && _scene) _scene.remove(_squad[i].mesh);
    }
    _squad = [];
  }

  function _removeExplosions () {
    for (var i = 0; i < _explosionParticles.length; i++) {
      if (_explosionParticles[i].mesh && _scene) _scene.remove(_explosionParticles[i].mesh);
    }
    _explosionParticles = [];
  }

  function _removeLZMarkers () {
    if (_lzMarker && _scene)        _scene.remove(_lzMarker);
    if (_extractionMarker && _scene) _scene.remove(_extractionMarker);
    _lzMarker         = null;
    _extractionMarker = null;
  }

  function _removeEscort () {
    if (_escort && _scene) _scene.remove(_escort);
    _escort         = null;
    _escortActive   = false;
    _escortMainRotor = null;
    _escortTailRotor = null;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Place LZ marker by raycasting mouse against Y=0 plane
     ═══════════════════════════════════════════════════════════════════════ */
  function _raycastGround (event) {
    if (!_camera || !_canvas) return null;
    var rect = _canvas.getBoundingClientRect();
    var nx = ((event.clientX - rect.left) / rect.width)  * 2 - 1;
    var ny = -((event.clientY - rect.top)  / rect.height) * 2 + 1;
    var raycaster = new THREE.Raycaster();
    var mouse     = new THREE.Vector2(nx, ny);
    raycaster.setFromCamera(mouse, _camera);
    /* intersect Y=0 plane */
    var plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    var point = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, point);
    return point;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Call insertion
     ═══════════════════════════════════════════════════════════════════════ */
  var _crashingLocal = false;

  function _callInsertion () {
    if (!_lzPos) {
      _pilotVoice('MARK LZ FIRST');
      return;
    }
    if (_insertionPhase !== 'idle') return;
    if (_cooldownTimer > 0) {
      _pilotVoice('COOLDOWN ACTIVE');
      return;
    }

    /* hot LZ check */
    _lzHot = _checkHotLZ(_lzPos);
    if (_lzHot && Math.random() < 0.4) {
      _pilotVoice('HOT LZ, GOING AROUND');
      return;
    }

    _insertionPhase = 'en_route';
    _insertionTimer = 0;
    _spawnHelicopter();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Input handlers
     ═══════════════════════════════════════════════════════════════════════ */
  function _onKeyDown (e) {
    _keysDown[e.code] = true;
    _shiftHeld = e.shiftKey;

    /* A double-tap → call insertion */
    if (e.code === 'KeyA') {
      var now = performance.now() / 1000;
      if (now - _lastATime < 0.4) {
        /* double-tap */
        if (!e.shiftKey) {
          _callInsertion();
        }
      }
      _lastATime = now;

      /* A+X extraction sequence: arm the sequence */
      _aSequence = true;
      _aXTimer   = 0;
    }

    /* Shift + A → spawn escort */
    if (e.code === 'KeyA' && e.shiftKey) {
      _spawnEscort();
    }

    /* X while aSequence → mark extraction LZ */
    if (e.code === 'KeyX' && _aSequence) {
      _markExtractionLZ();
    }
  }

  function _onKeyUp (e) {
    _keysDown[e.code] = false;
    _shiftHeld = e.shiftKey;
  }

  function _onClick (event) {
    var pt = _raycastGround(event);
    if (!pt) return;
    _placeLZ(pt);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Place / update LZ
     ═══════════════════════════════════════════════════════════════════════ */
  function _placeLZ (pos) {
    if (!_scene) return;
    _lzPos = pos.clone();
    _lzPos.y = 0.05;
    if (_lzMarker) _scene.remove(_lzMarker);
    _lzMarker = _buildLZMarker(0x00ff44);
    _lzMarker.position.copy(_lzPos);
    _scene.add(_lzMarker);
    _lzHot = _checkHotLZ(_lzPos);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Mark extraction LZ
     ═══════════════════════════════════════════════════════════════════════ */
  function _markExtractionLZ () {
    if (!_scene || !_camera) return;
    /* Use camera look position or current LZ as extraction point */
    var pos = _lzPos ? _lzPos.clone() : new THREE.Vector3(0, 0, 0);
    pos.x += 5;
    pos.y = 0.05;
    _extractionLZ = pos.clone();
    if (_extractionMarker) _scene.remove(_extractionMarker);
    _extractionMarker = _buildLZMarker(0x00aaff);
    _extractionMarker.position.copy(pos);
    _scene.add(_extractionMarker);
    _extractionReady = true;
    _cooldownTimer = COOLDOWN_TIME;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Spawn escort gunship
     ═══════════════════════════════════════════════════════════════════════ */
  function _spawnEscort () {
    if (_escortActive || !_scene || !_lzPos) return;
    var built = _buildEscortHeli();
    _escort = built.group;
    _escortMainRotor = built.rotorHub;
    _escortTailRotor = built.tailRotorHub;
    _escort.position.set(_lzPos.x + ESCORT_RADIUS, ESCORT_Y, _lzPos.z);
    _scene.add(_escort);
    _escortActive = true;
    _escortAngle  = 0;
    _escortFireCool = ESCORT_FIRE_INTERVAL;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Damage callback (called by game when heli is hit)
     ═══════════════════════════════════════════════════════════════════════ */
  function _heliTakeDamage (amount) {
    if (!_heli || _insertionPhase === 'idle') return;
    _heliHP -= (amount || 20);
    if (_heliHP <= 0) {
      _heliHP = 0;
      if (!_crashingLocal) {
        _crashingLocal = true;
        _insertionPhase = 'crashed';
        _crashTimer = 0;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Update helpers
     ═══════════════════════════════════════════════════════════════════════ */
  function _updateRotors (delta) {
    if (_mainRotor) {
      _mainRotor.rotation.y += 2 * delta * 60;
    }
    if (_tailRotor) {
      _tailRotor.rotation.z += 2 * delta * 60;
    }
    if (_escortMainRotor) {
      _escortMainRotor.rotation.y += 2 * delta * 60;
    }
    if (_escortTailRotor) {
      _escortTailRotor.rotation.z += 2 * delta * 60;
    }
  }

  function _updateDoors (delta) {
    if (!_leftDoor || !_rightDoor) return;
    var targetZ  = _doorsOpen ? 2.2 : 1.3;
    var targetZ2 = _doorsOpen ? -2.2 : -1.3;
    _leftDoor.position.z  += (targetZ  - _leftDoor.position.z)  * 5 * delta;
    _rightDoor.position.z += (targetZ2 - _rightDoor.position.z) * 5 * delta;
  }

  function _updateSmoke (delta) {
    for (var i = _smokeParticles.length - 1; i >= 0; i--) {
      var s = _smokeParticles[i];
      s.life += delta;
      s.mesh.position.y += s.vy * delta;
      s.mat.opacity = 0.6 * (1 - s.life / s.maxLife);
      if (s.life >= s.maxLife) {
        if (_scene) _scene.remove(s.mesh);
        _smokeParticles.splice(i, 1);
      }
    }
  }

  function _updateTracers (delta) {
    for (var i = _tracers.length - 1; i >= 0; i--) {
      var t = _tracers[i];
      t.life += delta;
      if (t.life >= t.maxLife) {
        if (_scene) _scene.remove(t.line);
        _tracers.splice(i, 1);
      }
    }
  }

  function _updateExplosions (delta) {
    var GRAVITY = 9.8;
    for (var i = _explosionParticles.length - 1; i >= 0; i--) {
      var p = _explosionParticles[i];
      p.life += delta;
      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;
      p.vy -= GRAVITY * delta;
      var frac = 1 - p.life / p.maxLife;
      p.mat.opacity = frac;
      p.mat.transparent = true;
      if (p.life >= p.maxLife) {
        if (_scene) _scene.remove(p.mesh);
        _explosionParticles.splice(i, 1);
      }
    }
  }

  function _updateEscortRockets (delta) {
    var SPEED = 25;
    for (var i = _escortRockets.length - 1; i >= 0; i--) {
      var r = _escortRockets[i];
      r.life += delta;
      r.pos.addScaledVector(r.dir, SPEED * delta);

      /* update line geometry */
      var tail = r.pos.clone().sub(r.dir.clone().multiplyScalar(1.5));
      var positions = r.line.geometry.attributes.position;
      if (positions) {
        positions.setXYZ(0, tail.x, tail.y, tail.z);
        positions.setXYZ(1, r.pos.x, r.pos.y, r.pos.z);
        positions.needsUpdate = true;
      }

      /* check hit */
      if (r.target && r.target.mesh) {
        var dx = r.pos.x - r.target.mesh.position.x;
        var dy = r.pos.y - r.target.mesh.position.y;
        var dz = r.pos.z - r.target.mesh.position.z;
        if (Math.sqrt(dx*dx + dy*dy + dz*dz) < 2) {
          _spawnExplosion(r.pos.clone());
          if (r.target.hp !== undefined) r.target.hp -= 50;
          if (r.target.takeDamage) r.target.takeDamage(50);
          if (_scene) _scene.remove(r.line);
          _escortRockets.splice(i, 1);
          continue;
        }
      }
      if (r.life >= r.maxLife) {
        _spawnExplosion(r.pos.clone());
        if (_scene) _scene.remove(r.line);
        _escortRockets.splice(i, 1);
      }
    }
  }

  function _updateSquad (delta) {
    for (var i = 0; i < _squad.length; i++) {
      var s = _squad[i];
      if (s.landed) continue;
      s.vy -= 12 * delta;
      s.mesh.position.y += s.vy * delta;
      /* drift toward target */
      var dx = s.targetX - s.mesh.position.x;
      var dz = s.targetZ - s.mesh.position.z;
      s.mesh.position.x += dx * 2 * delta;
      s.mesh.position.z += dz * 2 * delta;
      if (s.mesh.position.y <= 0.85) {
        s.mesh.position.y = 0.85;
        s.vy = 0;
        s.landed = true;
      }
    }
  }

  function _updateEscort (delta) {
    if (!_escortActive || !_escort || !_lzPos) return;
    _escortAngle += 0.4 * delta;
    _escort.position.x = _lzPos.x + Math.cos(_escortAngle) * ESCORT_RADIUS;
    _escort.position.y = ESCORT_Y;
    _escort.position.z = _lzPos.z + Math.sin(_escortAngle) * ESCORT_RADIUS;
    _escort.rotation.y = -_escortAngle + Math.PI / 2;

    _escortFireCool -= delta;
    if (_escortFireCool <= 0) {
      _escortFireRockets();
      _escortFireCool = ESCORT_FIRE_INTERVAL;
    }
    _updateEscortRockets(delta);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Extraction check
     ═══════════════════════════════════════════════════════════════════════ */
  function _checkExtraction () {
    if (!_extractionReady || _extractionUsed || !_extractionLZ) return;
    if (!_player || !_player.position) return;
    var px = _player.position.x;
    var pz = _player.position.z;
    var dx = px - _extractionLZ.x;
    var dz = pz - _extractionLZ.z;
    if (Math.sqrt(dx*dx + dz*dz) < 5) {
      /* player in extraction circle */
      _extractionUsed = true;
      _extractionReady = false;
      _pilotVoice('EXTRACTION COMPLETE');
      /* notify game */
      if (window.GameEvents && window.GameEvents.emit) window.GameEvents.emit('extracted');
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Main update — flight state machine
     ═══════════════════════════════════════════════════════════════════════ */
  function update (delta) {
    if (!_scene) return;

    /* cooldown */
    if (_cooldownTimer > 0) {
      _cooldownTimer -= delta;
      if (_cooldownTimer < 0) _cooldownTimer = 0;
    }

    /* A+X sequence timeout */
    if (_aSequence) {
      _aXTimer += delta;
      if (_aXTimer > 1.0) _aSequence = false;
    }

    _updateRotors(delta);
    _updateDoors(delta);
    _updateSmoke(delta);
    _updateTracers(delta);
    _updateExplosions(delta);
    _updateSquad(delta);
    _updateEscort(delta);
    _checkExtraction();

    if (!_heli) {
      _updateHUD();
      return;
    }

    /* ── emit smoke when hp low ── */
    if (_heliHP < 100 && _insertionPhase !== 'idle' && _insertionPhase !== 'crashed') {
      if (Math.random() < 4 * delta) {
        _spawnSmoke(_heli.position.clone());
      }
    }

    /* ── flight state machine ── */
    if (_insertionPhase === 'en_route') {
      /* move toward LZ horizontally, descend to hover height */
      var target = new THREE.Vector3(_lzPos.x, SPAWN_Y, _lzPos.z);
      var diff   = target.clone().sub(_heli.position);
      var dist   = diff.length();
      var step   = APPROACH_SPEED * delta;
      _etaDisplay = dist / APPROACH_SPEED;

      if (dist < step + 0.1) {
        _heli.position.copy(target);
        _insertionPhase = 'descending';
        _insertionTimer = 0;
        _openDoors();
        _gunnerActive = true;
      } else {
        _heli.position.addScaledVector(diff.normalize(), step);
      }

    } else if (_insertionPhase === 'descending') {
      /* descend from SPAWN_Y to Y=2 */
      var descTarget = _lzPos.y !== undefined ? 2 : 2;
      _heli.position.y -= 8 * delta;
      if (_heli.position.y <= descTarget) {
        _heli.position.y = descTarget;
        _insertionPhase = 'hovering';
        _insertionTimer = 0;
        /* insert squad now */
        _insertSquad();
      }

    } else if (_insertionPhase === 'hovering') {
      _insertionTimer += delta;

      /* gunner fires */
      if (_gunnerActive) {
        _gunnerCooldown -= delta;
        if (_gunnerCooldown <= 0) {
          _gunnerFire();
          _gunnerCooldown = GUNNER_FIRE_RATE;
        }
      }

      if (_insertionTimer >= HOVER_DURATION) {
        _insertionPhase = 'departing';
        _insertionTimer = 0;
        _closeDoors();
        _gunnerActive = false;
        if (_muzzleFlash) { _muzzleFlash.visible = false; }
      }

    } else if (_insertionPhase === 'departing') {
      /* fly to opposite edge */
      var dTarget = _heliDepart ? _heliDepart : new THREE.Vector3(-200, SPAWN_Y, _lzPos.z);
      var dDiff   = dTarget.clone().sub(_heli.position);
      var dDist   = dDiff.length();
      _heli.position.y += 5 * delta; /* climb */
      _heli.position.x += (_heli.position.x < 0 ? -1 : 1) * DEPART_SPEED * delta;

      if (dDist < 5 || _heli.position.y > SPAWN_Y + 10 || Math.abs(_heli.position.x) > 220) {
        _removeHeli();
        _insertionPhase = 'idle';
        _gunnerActive   = false;
        /* start extraction cooldown */
        _cooldownTimer = COOLDOWN_TIME;
      }

    } else if (_insertionPhase === 'crashed') {
      _crashTimer += delta;
      /* spiral descent */
      _crashAngle += 2.5 * delta;
      _heli.rotation.z = Math.sin(_crashAngle) * 0.8;
      _heli.rotation.x = 0.3;
      _heli.position.y -= 6 * delta;
      _heli.position.x += Math.cos(_crashAngle) * 3 * delta;
      _heli.position.z += Math.sin(_crashAngle) * 3 * delta;

      /* heavy smoke during crash */
      if (Math.random() < 8 * delta) _spawnSmoke(_heli.position.clone());

      if (_heli.position.y <= 0 || _crashTimer >= CRASH_DURATION) {
        /* explosion on impact */
        _spawnExplosion(_heli.position.clone());
        _removeHeli();
        _insertionPhase = 'idle';
        _removeSmoke();
      }
    }

    _updateHUD();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Public: init
     ═══════════════════════════════════════════════════════════════════════ */
  function init (scene, camera, canvas, player) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas || (typeof document !== 'undefined' ? document.querySelector('canvas') : null);
    _player = player || null;

    _ensureHUD();

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', _onKeyDown);
      document.addEventListener('keyup',   _onKeyUp);
      if (_canvas) {
        _canvas.addEventListener('click', _onClick);
      } else {
        document.addEventListener('click', _onClick);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Public: reset
     ═══════════════════════════════════════════════════════════════════════ */
  function reset () {
    _removeHeli();
    _removeSmoke();
    _removeTracers();
    _removeSquad();
    _removeExplosions();
    _removeLZMarkers();
    _removeEscort();

    _insertionPhase  = 'idle';
    _insertionTimer  = 0;
    _cooldownTimer   = 0;
    _lzPos           = null;
    _lzHot           = false;
    _extractionLZ    = null;
    _extractionReady = false;
    _extractionUsed  = false;
    _gunnerActive    = false;
    _gunnerCooldown  = 0;
    _doorsOpen       = false;
    _aSequence       = false;
    _aXTimer         = 0;
    _crashingLocal   = false;

    if (_hudEl) _hudEl.style.display = 'none';
    if (_muzzleFlash && _scene) { _scene.remove(_muzzleFlash); _muzzleFlash = null; }
  }

  /* ── Public API ──────────────────────────────────────────────────────── */
  return {
    init:          init,
    update:        update,
    reset:         reset,
    placeLZ:       _placeLZ,
    callInsertion: _callInsertion,
    heliTakeDamage:_heliTakeDamage,
    spawnEscort:   _spawnEscort
  };
})();
