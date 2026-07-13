// warzone-hospital.js — WarzoneHospital module
// Activation: W+H simultaneous keypress (both keys within 400ms)
// Rules: var only, no let/const, IIFE window.WarzoneHospital

(function (window) {
  'use strict';

  // ─── Constants ────────────────────────────────────────────────────────────
  var ACTIVATION_WINDOW_MS = 400;
  var NUM_PATIENTS = 12;
  var CARRY_CAPACITY = 3;         // patients per evacuation trip
  var EVAC_DURATION_MS = 4 * 60 * 1000; // 4 minutes
  var PATIENT_CRITICAL_TTL = 60;  // seconds before untreated critical patient dies
  var SUPPLY_HEAL = 40;           // HP restored per medkit use
  var GENERATOR_MAX_HP = 100;
  var MORTAR_INTERVAL = 12000;    // ms between mortar barrages (wave 2)
  var MORTAR_RADIUS = 6;
  var MORTAR_DAMAGE = 80;
  var REPAIR_DURATION = 8000;     // ms to repair generator
  var WAR_CRIME_PENALTY = 500;
  var CARRY_RANGE = 3;            // units – how close player must be to pick up patient
  var USE_RANGE = 3;              // units – E interaction range

  // ─── Internal State ───────────────────────────────────────────────────────
  var _active = false;
  var _scene = null;
  var _camera = null;
  var _player = null;       // { mesh, position {x,y,z}, hp }
  var _keysDown = {};
  var _keyTimestamps = {};

  var _hospital = null;     // root group
  var _wards = [];          // 3 ward meshes
  var _generator = null;    // { mesh, hp, isDown }
  var _generatorHP = GENERATOR_MAX_HP;
  var _generatorDown = false;

  var _patients = [];       // array of patient objects
  var _supplyCrates = [];   // 5 crates
  var _waves = [];          // wave state objects
  var _currentWave = 0;     // 0=not started, 1/2/3
  var _wavesComplete = 0;
  var _enemies = [];
  var _mortarTeam = null;
  var _mortarTimer = 0;
  var _vehicle = null;

  var _evacuated = 0;
  var _evacPad = null;
  var _evacHeli = null;
  var _evacActive = false;
  var _evacEndTime = 0;
  var _carriedPatients = [];  // patients player is currently carrying (max CARRY_CAPACITY)

  var _score = 0;
  var _warCrimeFlashTimer = 0;
  var _warCrimeFlashDuration = 3000; // ms

  var _repairActive = false;
  var _repairProgress = 0;
  var _repairStartTime = 0;

  var _hudElement = null;
  var _warCrimeBanner = null;
  var _lastUpdateTime = 0;

  var _THREE = null; // cached THREE reference

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function _getThree() {
    if (_THREE) { return _THREE; }
    if (typeof THREE !== 'undefined') { _THREE = THREE; }
    else if (window.THREE) { _THREE = window.THREE; }
    return _THREE;
  }

  function _makeMesh(geo, color, castShadow, receiveShadow) {
    var T = _getThree();
    if (!T) { return null; }
    var mat = new T.MeshLambertMaterial({ color: color });
    var mesh = new T.Mesh(geo, mat);
    if (castShadow) { mesh.castShadow = true; }
    if (receiveShadow) { mesh.receiveShadow = true; }
    return mesh;
  }

  function _dist3(a, b) {
    var dx = (a.x || 0) - (b.x || 0);
    var dy = (a.y || 0) - (b.y || 0);
    var dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _posFromMesh(mesh) {
    if (!mesh) { return { x: 0, y: 0, z: 0 }; }
    return { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z };
  }

  function _clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function _rand(min, max) {
    return min + Math.random() * (max - min);
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────
  function _createHUD() {
    if (_hudElement) { return; }
    _hudElement = document.createElement('div');
    _hudElement.id = 'warzone-hospital-hud';
    _hudElement.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border:1px solid #00ff88',
      'border-radius:4px',
      'z-index:9999',
      'pointer-events:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudElement);

    _warCrimeBanner = document.createElement('div');
    _warCrimeBanner.id = 'warzone-hospital-warcrime';
    _warCrimeBanner.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(180,0,0,0.85)',
      'color:#ffffff',
      'font-family:monospace',
      'font-size:36px',
      'font-weight:bold',
      'padding:20px 40px',
      'border:3px solid #ff0000',
      'border-radius:6px',
      'z-index:10000',
      'pointer-events:none',
      'display:none',
      'text-align:center'
    ].join(';');
    _warCrimeBanner.textContent = 'WAR CRIME  -500 pts';
    document.body.appendChild(_warCrimeBanner);
  }

  function _destroyHUD() {
    if (_hudElement && _hudElement.parentNode) {
      _hudElement.parentNode.removeChild(_hudElement);
      _hudElement = null;
    }
    if (_warCrimeBanner && _warCrimeBanner.parentNode) {
      _warCrimeBanner.parentNode.removeChild(_warCrimeBanner);
      _warCrimeBanner = null;
    }
  }

  function _updateHUD() {
    if (!_hudElement) { return; }
    var critical = 0;
    var i;
    for (i = 0; i < _patients.length; i++) {
      if (_patients[i].critical && !_patients[i].dead) { critical++; }
    }
    var genStatus = _generatorDown ? 'DOWN' : 'OK';
    _hudElement.textContent = (
      'HOSPITAL [PATIENTS: ' + _patients.filter(function (p) { return !p.dead; }).length + '/' + NUM_PATIENTS + ']' +
      ' [CRITICAL: ' + critical + ']' +
      ' [WAVES: ' + _wavesComplete + '/3]' +
      ' [GENERATOR: ' + genStatus + ']' +
      ' | EVACUATED: ' + _evacuated + '/' + NUM_PATIENTS
    );

    // War crime flash
    if (_warCrimeFlashTimer > 0) {
      _warCrimeBanner.style.display = 'block';
    } else {
      _warCrimeBanner.style.display = 'none';
    }
  }

  // ─── War Crime ────────────────────────────────────────────────────────────
  function _triggerWarCrime(reason) {
    _score -= WAR_CRIME_PENALTY;
    _warCrimeFlashTimer = _warCrimeFlashDuration;
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('warzoneHospital:warCrime', { detail: { reason: reason, score: _score } }));
    }
  }

  // ─── Hospital Construction ────────────────────────────────────────────────
  function _buildHospital(scene) {
    var T = _getThree();
    if (!T) { return; }

    _hospital = new T.Group();
    _hospital.name = 'WarzoneHospital_Root';

    // Main building 30x8x20, color 0x997777
    var mainGeo = new T.BoxGeometry(30, 8, 20);
    var mainMesh = _makeMesh(mainGeo, 0x997777, true, true);
    mainMesh.position.set(0, 4, 0);
    mainMesh.name = 'hospital_main';
    _hospital.add(mainMesh);

    // Red cross on roof (cross shape using 2 boxes)
    var crossH = _makeMesh(new T.BoxGeometry(6, 0.4, 1.5), 0xFF2222, false, false);
    crossH.position.set(0, 8.2, 0);
    crossH.name = 'roof_cross_h';
    _hospital.add(crossH);

    var crossV = _makeMesh(new T.BoxGeometry(1.5, 0.4, 6), 0xFF2222, false, false);
    crossV.position.set(0, 8.2, 0);
    crossV.name = 'roof_cross_v';
    _hospital.add(crossV);

    // 3 wards 12x4x10, color 0x886666
    var wardConfigs = [
      { name: 'triage',   x: -21, z: 0 },
      { name: 'surgery',  x:  21, z: -8 },
      { name: 'recovery', x:  21, z:  8 }
    ];
    var w;
    for (w = 0; w < wardConfigs.length; w++) {
      var cfg = wardConfigs[w];
      var wardGeo = new T.BoxGeometry(12, 4, 10);
      var wardMesh = _makeMesh(wardGeo, 0x886666, true, true);
      wardMesh.position.set(cfg.x, 2, cfg.z);
      wardMesh.name = 'ward_' + cfg.name;
      _hospital.add(wardMesh);
      _wards.push(wardMesh);

      // Red cross on each ward roof
      var wCrossH = _makeMesh(new T.BoxGeometry(3, 0.3, 0.8), 0xFF2222, false, false);
      wCrossH.position.set(cfg.x, 4.2, cfg.z);
      _hospital.add(wCrossH);
      var wCrossV = _makeMesh(new T.BoxGeometry(0.8, 0.3, 3), 0xFF2222, false, false);
      wCrossV.position.set(cfg.x, 4.2, cfg.z);
      _hospital.add(wCrossV);
    }

    // Generator outside, 0x445544
    var genGeo = new T.BoxGeometry(3, 2, 2);
    var genMesh = _makeMesh(genGeo, 0x445544, true, true);
    genMesh.position.set(18, 1, 14);
    genMesh.name = 'generator';
    _hospital.add(genMesh);
    _generator = { mesh: genMesh, hp: GENERATOR_MAX_HP };

    scene.add(_hospital);
  }

  // ─── Patients ─────────────────────────────────────────────────────────────
  function _buildPatients(scene) {
    var T = _getThree();
    if (!T) { return; }

    var i;
    for (i = 0; i < NUM_PATIENTS; i++) {
      var hp = Math.floor(_rand(1, 100));

      // Stretcher
      var stretcher = _makeMesh(new T.BoxGeometry(2, 0.2, 0.8), 0x886644, false, true);
      var sx = _rand(-12, 12);
      var sz = _rand(-8, 8);
      stretcher.position.set(sx, 0.1, sz);
      scene.add(stretcher);

      // Patient on stretcher
      var patientMesh = _makeMesh(new T.BoxGeometry(1.6, 0.4, 0.6), 0xFFDDDD, false, false);
      patientMesh.position.set(sx, 0.4, sz);
      scene.add(patientMesh);

      _patients.push({
        id: i,
        mesh: patientMesh,
        stretcher: stretcher,
        hp: hp,
        maxHp: 100,
        critical: hp < 20,
        dead: false,
        carried: false,
        evacuated: false,
        criticalTimer: hp < 20 ? PATIENT_CRITICAL_TTL : 0,
        stabilized: false
      });
    }
  }

  // ─── Supply Crates ────────────────────────────────────────────────────────
  function _buildSupplyCrates(scene) {
    var T = _getThree();
    if (!T) { return; }

    var positions = [
      { x: -5, z: 12 },
      { x:  5, z: 12 },
      { x: 14, z: -5 },
      { x: -14, z: -3 },
      { x:  0, z: -14 }
    ];
    var i;
    for (i = 0; i < positions.length; i++) {
      var mesh = _makeMesh(new T.BoxGeometry(1.2, 1.2, 1.2), 0x44FF44, true, true);
      mesh.position.set(positions[i].x, 0.6, positions[i].z);
      scene.add(mesh);
      _supplyCrates.push({
        mesh: mesh,
        used: false,
        medkits: 2
      });
    }
  }

  // ─── Evacuation Pad & Helicopter ──────────────────────────────────────────
  function _buildEvacPad(scene) {
    var T = _getThree();
    if (!T) { return; }

    // Landing pad marker
    var padMesh = _makeMesh(new T.BoxGeometry(10, 0.1, 10), 0x00FF00, false, true);
    padMesh.position.set(30, 0.05, 0);
    scene.add(padMesh);
    _evacPad = { mesh: padMesh, position: { x: 30, y: 0, z: 0 } };

    // Helicopter (hidden until wave 3 complete)
    var heliMesh = _makeMesh(new T.BoxGeometry(8, 2, 4), 0x556655, true, false);
    heliMesh.position.set(30, 20, 0); // starts high
    heliMesh.visible = false;
    scene.add(heliMesh);
    _evacHeli = { mesh: heliMesh, landed: false };
  }

  // ─── Artillery for player counter-mortar ──────────────────────────────────
  var _playerArtillery = null;

  function _buildPlayerArtillery(scene) {
    var T = _getThree();
    if (!T) { return; }
    var mesh = _makeMesh(new T.BoxGeometry(2, 1.5, 3), 0x445566, true, true);
    mesh.position.set(-25, 0.75, 10);
    scene.add(mesh);
    _playerArtillery = { mesh: mesh, used: false };
  }

  // ─── Wave 1: 8 infantry attackers from north ──────────────────────────────
  function _spawnWave1() {
    var T = _getThree();
    if (!T) { return; }
    var i;
    for (i = 0; i < 8; i++) {
      var mesh = _makeMesh(new T.BoxGeometry(0.8, 1.8, 0.8), 0x334433, true, false);
      mesh.position.set(_rand(-15, 15), 0.9, -60 - i * 3);
      _scene.add(mesh);
      _enemies.push({
        mesh: mesh,
        hp: 60,
        dead: false,
        wave: 1,
        speed: 0.04,
        type: 'infantry'
      });
    }
  }

  // ─── Wave 2: Mortar team ──────────────────────────────────────────────────
  function _spawnWave2() {
    var T = _getThree();
    if (!T) { return; }

    // Mortar crew (visual only – projectiles handled via timer)
    var mortarMesh = _makeMesh(new T.CylinderGeometry(0.4, 0.6, 1.2, 8), 0x554444, true, false);
    mortarMesh.position.set(0, 0.6, -60);
    _scene.add(mortarMesh);

    _mortarTeam = {
      mesh: mortarMesh,
      hp: 80,
      dead: false,
      position: { x: 0, y: 0.6, z: -60 }
    };
    _mortarTimer = MORTAR_INTERVAL;
  }

  // ─── Wave 3: 12 attackers + vehicle ───────────────────────────────────────
  function _spawnWave3() {
    var T = _getThree();
    if (!T) { return; }
    var i;
    for (i = 0; i < 12; i++) {
      var mesh = _makeMesh(new T.BoxGeometry(0.8, 1.8, 0.8), 0x334433, true, false);
      mesh.position.set(_rand(-20, 20), 0.9, -80 - i * 4);
      _scene.add(mesh);
      _enemies.push({
        mesh: mesh,
        hp: 70,
        dead: false,
        wave: 3,
        speed: 0.05,
        type: 'infantry'
      });
    }

    // Vehicle 6x2.5x3, 0x334422 with mounted gun
    var vMesh = _makeMesh(new T.BoxGeometry(6, 2.5, 3), 0x334422, true, false);
    vMesh.position.set(0, 1.25, -90);
    _scene.add(vMesh);
    _vehicle = {
      mesh: vMesh,
      hp: 200,
      dead: false,
      speed: 0.03,
      gunCooldown: 0
    };
  }

  // ─── Mortar Impact ────────────────────────────────────────────────────────
  function _mortarImpact(tx, tz) {
    var T = _getThree();
    if (!T) { return; }

    // Deal damage to patients in radius
    var i;
    for (i = 0; i < _patients.length; i++) {
      var p = _patients[i];
      if (p.dead || p.evacuated) { continue; }
      var px = p.mesh.position.x;
      var pz = p.mesh.position.z;
      var dx = px - tx;
      var dz = pz - tz;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= MORTAR_RADIUS) {
        var dmg = Math.floor(MORTAR_DAMAGE * (1 - dist / MORTAR_RADIUS));
        p.hp -= dmg;
        if (p.hp <= 0) {
          p.hp = 0;
          p.dead = true;
          p.mesh.visible = false;
          p.stretcher.visible = false;
        } else if (p.hp < 20) {
          p.critical = true;
          if (!p.stabilized) { p.criticalTimer = PATIENT_CRITICAL_TTL; }
        }
      }
    }

    // Damage generator if in range
    var gx = _generator.mesh.position.x;
    var gz = _generator.mesh.position.z;
    var gdx = gx - tx;
    var gdz = gz - tz;
    if (Math.sqrt(gdx * gdx + gdz * gdz) <= MORTAR_RADIUS) {
      _generatorHP -= 40;
      if (_generatorHP <= 0) {
        _generatorHP = 0;
        _generatorDown = true;
        _generator.mesh.material.color.setHex(0x222222);
        // Increase critical patient death rate – mark patients for faster timer
        for (var j = 0; j < _patients.length; j++) {
          if (_patients[j].critical && !_patients[j].dead && !_patients[j].stabilized) {
            _patients[j].criticalTimer = _patients[j].criticalTimer * 0.5;
          }
        }
      }
    }

    // Visual flash (simple color flash on ground plane, removed quickly)
    var flashGeo = new T.BoxGeometry(MORTAR_RADIUS * 2, 0.1, MORTAR_RADIUS * 2);
    var flashMesh = _makeMesh(flashGeo, 0xFF4400, false, false);
    flashMesh.position.set(tx, 0.1, tz);
    _scene.add(flashMesh);
    setTimeout(function () {
      _scene.remove(flashMesh);
    }, 400);
  }

  // ─── Carry / Drag system ──────────────────────────────────────────────────
  function _tryPickupPatient() {
    if (!_player) { return; }
    if (_carriedPatients.length >= CARRY_CAPACITY) { return; }
    var i;
    for (i = 0; i < _patients.length; i++) {
      var p = _patients[i];
      if (p.dead || p.carried || p.evacuated) { continue; }
      var dist = _dist3(_posFromMesh(p.mesh), _posFromMesh(_player.mesh));
      if (dist <= CARRY_RANGE) {
        p.carried = true;
        _carriedPatients.push(p);
        break;
      }
    }
  }

  function _updateCarriedPatients() {
    if (!_player) { return; }
    var i;
    for (i = 0; i < _carriedPatients.length; i++) {
      var p = _carriedPatients[i];
      if (!p || p.dead) { continue; }
      // Snap patient/stretcher to player position offset
      p.mesh.position.x = _player.mesh.position.x + (i - 1) * 1.2;
      p.mesh.position.y = _player.mesh.position.y + 0.5;
      p.mesh.position.z = _player.mesh.position.z + 1.5;
      p.stretcher.position.x = p.mesh.position.x;
      p.stretcher.position.y = _player.mesh.position.y;
      p.stretcher.position.z = p.mesh.position.z;
    }
  }

  function _tryDropPatientsAtPad() {
    if (!_evacActive) { return; }
    if (!_evacHeli || !_evacHeli.landed) { return; }
    if (!_player) { return; }
    var dist = _dist3(_posFromMesh(_player.mesh), _evacPad.position);
    if (dist > USE_RANGE * 3) { return; }
    var i;
    for (i = _carriedPatients.length - 1; i >= 0; i--) {
      var p = _carriedPatients[i];
      if (!p.dead) {
        p.evacuated = true;
        p.carried = false;
        p.mesh.visible = false;
        p.stretcher.visible = false;
        _evacuated++;
      }
      _carriedPatients.splice(i, 1);
    }
  }

  // ─── Use (E) Interaction ──────────────────────────────────────────────────
  function _tryUseInteract() {
    if (!_player) { return; }
    var playerPos = _posFromMesh(_player.mesh);

    // Use supply crate
    var i;
    for (i = 0; i < _supplyCrates.length; i++) {
      var crate = _supplyCrates[i];
      if (crate.used || crate.medkits <= 0) { continue; }
      var dist = _dist3(_posFromMesh(crate.mesh), playerPos);
      if (dist <= USE_RANGE) {
        // Heal player
        if (_player.hp < 100) {
          _player.hp = _clamp(_player.hp + SUPPLY_HEAL, 0, 100);
          crate.medkits--;
          if (crate.medkits <= 0) { crate.used = true; crate.mesh.visible = false; }
          return;
        }
        // Stabilize nearby critical patient
        var j;
        for (j = 0; j < _patients.length; j++) {
          var pat = _patients[j];
          if (pat.dead || pat.evacuated || pat.stabilized || !pat.critical) { continue; }
          var pdist = _dist3(_posFromMesh(pat.mesh), playerPos);
          if (pdist <= USE_RANGE * 2) {
            pat.stabilized = true;
            pat.hp = _clamp(pat.hp + SUPPLY_HEAL, 0, 100);
            crate.medkits--;
            if (crate.medkits <= 0) { crate.used = true; crate.mesh.visible = false; }
            return;
          }
        }
      }
    }

    // Repair generator
    if (!_repairActive && _generatorDown) {
      var gpos = _posFromMesh(_generator.mesh);
      var gdist = _dist3(gpos, playerPos);
      if (gdist <= USE_RANGE) {
        _repairActive = true;
        _repairStartTime = Date.now();
        return;
      }
    }

    // Pick up patient if not already at capacity
    _tryPickupPatient();

    // Drop at evac pad
    _tryDropPatientsAtPad();
  }

  // ─── Enemy AI Update ──────────────────────────────────────────────────────
  function _updateEnemies(dt) {
    var hospitalPos = { x: 0, y: 0, z: 0 };
    var i;
    for (i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];
      if (e.dead) { continue; }
      // Move toward hospital
      var dx = hospitalPos.x - e.mesh.position.x;
      var dz = hospitalPos.z - e.mesh.position.z;
      var len = Math.sqrt(dx * dx + dz * dz);
      if (len > 2) {
        e.mesh.position.x += (dx / len) * e.speed * dt;
        e.mesh.position.z += (dz / len) * e.speed * dt;
      } else {
        // Reached hospital – damage it (no war crime for enemies damaging it)
      }
    }

    // Vehicle
    if (_vehicle && !_vehicle.dead) {
      var vdx = hospitalPos.x - _vehicle.mesh.position.x;
      var vdz = hospitalPos.z - _vehicle.mesh.position.z;
      var vlen = Math.sqrt(vdx * vdx + vdz * vdz);
      if (vlen > 10) {
        _vehicle.mesh.position.x += (vdx / vlen) * _vehicle.speed * dt;
        _vehicle.mesh.position.z += (vdz / vlen) * _vehicle.speed * dt;
      }
    }

    // Mortar team
    if (_mortarTeam && !_mortarTeam.dead) {
      _mortarTimer -= dt;
      if (_mortarTimer <= 0) {
        _mortarTimer = MORTAR_INTERVAL;
        // Fire at random hospital section
        var tx = _rand(-15, 15);
        var tz = _rand(-10, 10);
        _mortarImpact(tx, tz);
      }
    }
  }

  // ─── Critical Patient Timers ───────────────────────────────────────────────
  function _updatePatientTimers(dtSec) {
    var i;
    for (i = 0; i < _patients.length; i++) {
      var p = _patients[i];
      if (p.dead || p.evacuated || !p.critical || p.stabilized) { continue; }
      p.criticalTimer -= dtSec;
      if (_generatorDown) {
        // Surgery failure: extra 50% rate already applied at generator destruction
        // Apply additional tick penalty
        p.criticalTimer -= dtSec * 0.5;
      }
      if (p.criticalTimer <= 0) {
        p.dead = true;
        p.mesh.visible = false;
        p.stretcher.visible = false;
      }
    }
  }

  // ─── Generator Repair ─────────────────────────────────────────────────────
  function _updateRepair() {
    if (!_repairActive) { return; }
    var elapsed = Date.now() - _repairStartTime;
    if (elapsed >= REPAIR_DURATION) {
      _repairActive = false;
      _generatorDown = false;
      _generatorHP = GENERATOR_MAX_HP;
      _generator.mesh.material.color.setHex(0x445544);
    }
  }

  // ─── Evacuation Phase ─────────────────────────────────────────────────────
  function _startEvacuation() {
    _evacActive = true;
    _evacEndTime = Date.now() + EVAC_DURATION_MS;
    if (_evacHeli) {
      _evacHeli.mesh.visible = true;
    }
  }

  function _updateEvacuation(dt) {
    if (!_evacActive) { return; }
    // Land the helicopter
    if (_evacHeli && !_evacHeli.landed) {
      _evacHeli.mesh.position.y -= 0.02 * dt;
      if (_evacHeli.mesh.position.y <= 2) {
        _evacHeli.mesh.position.y = 2;
        _evacHeli.landed = true;
      }
    }
    // Check time limit
    if (Date.now() > _evacEndTime) {
      _evacActive = false; // time's up
    }
    // Drop patients at pad if player is near
    _tryDropPatientsAtPad();
  }

  // ─── Wave Progression ─────────────────────────────────────────────────────
  function _checkWaveComplete() {
    if (_currentWave === 1) {
      var allDead = true;
      var i;
      for (i = 0; i < _enemies.length; i++) {
        if (_enemies[i].wave === 1 && !_enemies[i].dead) { allDead = false; break; }
      }
      if (allDead && _enemies.some(function (e) { return e.wave === 1; })) {
        _wavesComplete = 1;
        _currentWave = 2;
        _spawnWave2();
      }
    } else if (_currentWave === 2) {
      if (_mortarTeam && _mortarTeam.dead) {
        _wavesComplete = 2;
        _currentWave = 3;
        _spawnWave3();
      }
    } else if (_currentWave === 3) {
      var w3done = true;
      var j;
      for (j = 0; j < _enemies.length; j++) {
        if (_enemies[j].wave === 3 && !_enemies[j].dead) { w3done = false; break; }
      }
      if (w3done && (!_vehicle || _vehicle.dead) && _enemies.some(function (e) { return e.wave === 3; })) {
        _wavesComplete = 3;
        _currentWave = 0;
        _startEvacuation();
      }
    }
  }

  // ─── Shoot at enemy (player damage dealing) ───────────────────────────────
  function _damageEnemy(enemy, amount) {
    if (!enemy || enemy.dead) { return; }
    enemy.hp -= amount;
    if (enemy.hp <= 0) {
      enemy.hp = 0;
      enemy.dead = true;
      enemy.mesh.visible = false;
      _score += 100;
    }
  }

  function _damageVehicle(amount) {
    if (!_vehicle || _vehicle.dead) { return; }
    _vehicle.hp -= amount;
    if (_vehicle.hp <= 0) {
      _vehicle.hp = 0;
      _vehicle.dead = true;
      _vehicle.mesh.visible = false;
      _score += 500;
    }
  }

  function _damageMortarTeam(amount) {
    if (!_mortarTeam || _mortarTeam.dead) { return; }
    _mortarTeam.hp -= amount;
    if (_mortarTeam.hp <= 0) {
      _mortarTeam.hp = 0;
      _mortarTeam.dead = true;
      _mortarTeam.mesh.visible = false;
      _score += 300;
    }
  }

  // Expose shoot for external game loop
  function _playerShoot(targetType, targetIndex, damage) {
    damage = damage || 30;
    if (targetType === 'infantry') {
      _damageEnemy(_enemies[targetIndex], damage);
    } else if (targetType === 'vehicle') {
      _damageVehicle(damage);
    } else if (targetType === 'mortar') {
      _damageMortarTeam(damage);
    } else if (targetType === 'patient' || targetType === 'hospital') {
      _triggerWarCrime(targetType);
    }
  }

  // Counter-mortar artillery use
  function _useArtillery() {
    if (!_playerArtillery || _playerArtillery.used) { return false; }
    if (!_player) { return false; }
    var dist = _dist3(_posFromMesh(_player.mesh), _posFromMesh(_playerArtillery.mesh));
    if (dist > USE_RANGE * 2) { return false; }
    // Destroy mortar team
    _damageMortarTeam(999);
    _playerArtillery.used = true;
    _playerArtillery.mesh.material.color.setHex(0x222222);
    return true;
  }

  // ─── Key Handlers ─────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    var key = e.key ? e.key.toUpperCase() : '';
    if (_keysDown[key]) { return; }
    _keysDown[key] = true;
    _keyTimestamps[key] = Date.now();

    // W+H activation check
    if (!_active) {
      if ((key === 'W' || key === 'H')) {
        var other = key === 'W' ? 'H' : 'W';
        if (_keysDown[other] && _keyTimestamps[other]) {
          var gap = Math.abs(_keyTimestamps[key] - _keyTimestamps[other]);
          if (gap <= ACTIVATION_WINDOW_MS) {
            WarzoneHospital.activate();
          }
        }
      }
      return;
    }

    // E key for interact
    if (key === 'E') {
      _tryUseInteract();
    }

    // F key to use artillery (counter-mortar)
    if (key === 'F') {
      _useArtillery();
    }
  }

  function _onKeyUp(e) {
    var key = e.key ? e.key.toUpperCase() : '';
    _keysDown[key] = false;
    _keyTimestamps[key] = 0;
  }

  // ─── Main Update Loop ─────────────────────────────────────────────────────
  function _update(timestamp) {
    if (!_active) { return; }

    var dt = timestamp - (_lastUpdateTime || timestamp);
    _lastUpdateTime = timestamp;

    var dtSec = dt / 1000;

    // War crime flash timer
    if (_warCrimeFlashTimer > 0) {
      _warCrimeFlashTimer -= dt;
      if (_warCrimeFlashTimer < 0) { _warCrimeFlashTimer = 0; }
    }

    // Update carried patients positions
    _updateCarriedPatients();

    // Enemy AI
    _updateEnemies(dt);

    // Patient timers
    _updatePatientTimers(dtSec);

    // Generator repair
    _updateRepair();

    // Evacuation
    _updateEvacuation(dt);

    // Wave progression
    _checkWaveComplete();

    // HUD
    _updateHUD();

    requestAnimationFrame(_update);
  }

  // ─── Scene Cleanup ────────────────────────────────────────────────────────
  function _clearScene() {
    if (!_scene) { return; }
    var i;

    if (_hospital) { _scene.remove(_hospital); _hospital = null; }
    _wards = [];

    for (i = 0; i < _patients.length; i++) {
      _scene.remove(_patients[i].mesh);
      _scene.remove(_patients[i].stretcher);
    }
    _patients = [];

    for (i = 0; i < _supplyCrates.length; i++) {
      _scene.remove(_supplyCrates[i].mesh);
    }
    _supplyCrates = [];

    for (i = 0; i < _enemies.length; i++) {
      _scene.remove(_enemies[i].mesh);
    }
    _enemies = [];

    if (_mortarTeam) { _scene.remove(_mortarTeam.mesh); _mortarTeam = null; }
    if (_vehicle) { _scene.remove(_vehicle.mesh); _vehicle = null; }
    if (_evacPad) { _scene.remove(_evacPad.mesh); _evacPad = null; }
    if (_evacHeli) { _scene.remove(_evacHeli.mesh); _evacHeli = null; }
    if (_playerArtillery) { _scene.remove(_playerArtillery.mesh); _playerArtillery = null; }
    if (_generator) { _generator = null; }
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  var WarzoneHospital = {

    activate: function (scene, camera, player) {
      if (_active) { return; }
      _active = true;
      _scene = scene || _scene;
      _camera = camera || _camera;
      _player = player || _player;

      _score = 0;
      _evacuated = 0;
      _currentWave = 1;
      _wavesComplete = 0;
      _carriedPatients = [];
      _generatorHP = GENERATOR_MAX_HP;
      _generatorDown = false;
      _repairActive = false;
      _evacActive = false;
      _warCrimeFlashTimer = 0;
      _mortarTimer = 0;

      _clearScene();

      if (_scene) {
        _buildHospital(_scene);
        _buildPatients(_scene);
        _buildSupplyCrates(_scene);
        _buildEvacPad(_scene);
        _buildPlayerArtillery(_scene);
        _spawnWave1();
      }

      _createHUD();
      _lastUpdateTime = 0;
      requestAnimationFrame(_update);

      if (typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('warzoneHospital:activated'));
      }
    },

    deactivate: function () {
      if (!_active) { return; }
      _active = false;
      _clearScene();
      _destroyHUD();

      if (typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('warzoneHospital:deactivated', {
          detail: { score: _score, evacuated: _evacuated }
        }));
      }
    },

    isActive: function () { return _active; },

    getScore: function () { return _score; },

    getState: function () {
      return {
        active: _active,
        score: _score,
        evacuated: _evacuated,
        wavesComplete: _wavesComplete,
        generatorDown: _generatorDown,
        patients: _patients.map(function (p) {
          return {
            id: p.id, hp: p.hp, dead: p.dead,
            critical: p.critical, evacuated: p.evacuated,
            carried: p.carried, stabilized: p.stabilized
          };
        })
      };
    },

    // Allow external game loop to register scene/camera/player before activation
    setScene: function (scene) { _scene = scene; },
    setCamera: function (camera) { _camera = camera; },
    setPlayer: function (player) { _player = player; },

    // Expose shoot for integration with main weapon system
    playerShoot: _playerShoot,

    // Expose E-key interact externally
    interact: _tryUseInteract,

    // Expose counter-artillery
    useArtillery: _useArtillery,

    // Damage enemy by mesh reference (for raycasting integration)
    damageEnemyByMesh: function (mesh, damage) {
      var i;
      for (i = 0; i < _enemies.length; i++) {
        if (_enemies[i].mesh === mesh) {
          _damageEnemy(_enemies[i], damage || 30);
          return true;
        }
      }
      if (_vehicle && _vehicle.mesh === mesh) {
        _damageVehicle(damage || 30);
        return true;
      }
      if (_mortarTeam && _mortarTeam.mesh === mesh) {
        _damageMortarTeam(damage || 30);
        return true;
      }
      // Check if hitting patient or hospital — war crime
      for (i = 0; i < _patients.length; i++) {
        if (_patients[i].mesh === mesh) {
          _triggerWarCrime('patient');
          return true;
        }
      }
      return false;
    },

    // Allow external code to trigger a mortar impact at position
    triggerMortarImpact: function (x, z) {
      _mortarImpact(x, z);
    }
  };

  // ─── Key listener registration ────────────────────────────────────────────
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup', _onKeyUp);
  }

  // ─── Export ───────────────────────────────────────────────────────────────
  window.WarzoneHospital = WarzoneHospital;

}(window));
