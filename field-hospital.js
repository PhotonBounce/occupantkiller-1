// field-hospital.js — Deployable forward aid station with triage mechanics
// Browser-based — IIFE, all var (no let/const), Three.js as global THREE
//
// Public API:
//   FieldHospital.init(scene, camera)
//   FieldHospital.update(delta)
//   FieldHospital.reset()

window.FieldHospital = (function () {
  'use strict';

  // ─────────────────────────────────────────────── constants
  var TENT_COLOR         = 0x2D6A4F;
  var CROSS_COLOR        = 0xFFFFFF;
  var TENT_HP_MAX        = 200;
  var TENT_WIDTH         = 8;
  var TENT_DEPTH         = 6;
  var TENT_HEIGHT        = 4;
  var TRIAGE_RADIUS      = 10;
  var TRIAGE_RADIUS_SQ   = TRIAGE_RADIUS * TRIAGE_RADIUS;
  var TENT_HEAL_TIME     = 2.0;   // seconds standing inside tent for full HP
  var REGEN_HP_PER_SEC   = 5;     // HP/s regen outside tent
  var REGEN_DURATION     = 10;    // seconds of outside regen
  var MAX_PATIENTS       = 4;     // max simultaneous patients
  var DOCTOR_HEAL_AMT    = 30;    // HP doctor heals per visit
  var DOCTOR_TREAT_TIME  = 3.0;   // seconds doctor stands over patient
  var DOCTOR_SPEED       = 4.0;   // units/second
  var MORPHINE_HP        = 50;
  var MORPHINE_SLOW_PCT  = 0.20;  // 20% speed reduction
  var MORPHINE_DURATION  = 30;    // seconds
  var BLOOD_TYPE_DMG     = 10;    // damage from incompatible transfusion
  var BLOOD_WRONG_CHANCE = 0.30;  // 30% chance wrong blood type
  var COLLAPSE_TIME      = 2.0;   // seconds to scale-to-zero on destroy
  var FIRE_PULSE_SPEED   = 4.0;

  // triage zone colors
  var TRIAGE_RED    = 0xFF2222;
  var TRIAGE_YELLOW = 0xFFDD00;
  var TRIAGE_GREEN  = 0x22CC44;

  // blood types
  var BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // ─────────────────────────────────────────────── state
  var _scene       = null;
  var _camera      = null;
  var _time        = 0;
  var _keysDown    = {};
  var _keyPressed  = {};

  // tent
  var _tent              = null;   // single tent object
  var _tentDeployed      = false;
  var _tentOnFire        = false;
  var _tentCollapsing    = false;
  var _tentCollapseTimer = 0;
  var _fireMesh          = null;

  // patient queue
  var _patients          = [];  // array of patient objects (max MAX_PATIENTS active)
  var _patientQueue      = [];  // waiting queue beyond capacity

  // player state
  var _playerHP         = 100;
  var _playerHPMax      = 100;
  var _bloodType        = 'O+';
  var _insideTentTimer  = 0;
  var _regenTimer       = 0;
  var _regenActive      = false;
  var _painSlowActive   = false;
  var _painSlowTimer    = 0;

  // supply crate
  var _supplyCrate       = null;
  var _medkitCount       = 0;
  var _morphineCount     = 0;

  // doctor NPC
  var _doctor            = null;
  var _doctorTarget      = null;
  var _doctorTreatTimer  = 0;
  var _doctorState       = 'idle'; // 'idle', 'moving', 'treating'

  // HUD elements
  var _hudEl             = null;
  var _queueEl           = null;
  var _toast             = null;
  var _bloodTypeEl       = null;

  // ─────────────────────────────────────────────── DOM helpers
  function _el(id, tag, styles, parent) {
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement(tag || 'div');
      el.id = id;
      (parent || document.body).appendChild(el);
    }
    Object.assign(el.style, styles || {});
    return el;
  }

  function _createHUD() {
    _hudEl = _el('fh-hud', 'div', {
      position: 'fixed',
      bottom: '14px',
      left: '14px',
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#fff',
      background: 'rgba(0,0,0,0.70)',
      padding: '7px 14px',
      borderRadius: '7px',
      border: '1px solid #2D6A4F',
      zIndex: '3200',
      pointerEvents: 'none',
      display: 'none'
    });

    _queueEl = _el('fh-queue', 'div', {
      position: 'fixed',
      bottom: '58px',
      left: '14px',
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#FFD700',
      background: 'rgba(0,0,0,0.70)',
      padding: '5px 12px',
      borderRadius: '7px',
      border: '1px solid #FFD700',
      zIndex: '3200',
      pointerEvents: 'none',
      display: 'none'
    });

    _bloodTypeEl = _el('fh-bloodtype', 'div', {
      position: 'fixed',
      top: '14px',
      right: '14px',
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#FF6666',
      background: 'rgba(0,0,0,0.70)',
      padding: '6px 12px',
      borderRadius: '7px',
      border: '1px solid #FF6666',
      zIndex: '3200',
      pointerEvents: 'none'
    });
    _bloodTypeEl.textContent = 'Blood: ' + _bloodType;

    _toast = _el('fh-toast', 'div', {
      position: 'fixed',
      top: '22%',
      left: '50%',
      transform: 'translateX(-50%)',
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#00ff88',
      background: 'rgba(0,0,0,0.82)',
      padding: '8px 22px',
      borderRadius: '8px',
      border: '1px solid #00ff88',
      zIndex: '5100',
      pointerEvents: 'none',
      display: 'none',
      letterSpacing: '1.5px',
      textAlign: 'center'
    });
  }

  function _showToast(msg, color, dur) {
    if (!_toast) return;
    _toast.textContent = msg;
    _toast.style.color = color || '#00ff88';
    _toast.style.borderColor = color || '#00ff88';
    _toast.style.display = 'block';
    clearTimeout(_toast._t);
    _toast._t = setTimeout(function () { _toast.style.display = 'none'; }, dur || 2200);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (_tentDeployed && _tent && !_tent.collapsed) {
      var active = _patients.length;
      _hudEl.style.display = 'block';
      _hudEl.innerHTML = '&#9877; FIELD HOSPITAL [Capacity: ' + active + '/' + MAX_PATIENTS + ']';
    } else {
      _hudEl.style.display = 'none';
    }

    if (_queueEl) {
      if (_patientQueue.length > 0) {
        _queueEl.style.display = 'block';
        _queueEl.textContent = 'QUEUE: ' + _patientQueue.length + ' patient(s) waiting';
      } else {
        _queueEl.style.display = 'none';
      }
    }
  }

  // ─────────────────────────────────────────────── tent mesh
  function _buildCrossMesh(color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var group = new THREE.Group();
    // Vertical bar
    var vBar = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.2, 0.25), mat);
    group.add(vBar);
    // Horizontal bar
    var hBar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 0.25), mat);
    group.add(hBar);
    return group;
  }

  function _buildTentMesh() {
    var group = new THREE.Group();
    var canvasMat = new THREE.MeshLambertMaterial({ color: TENT_COLOR });

    // Flat base floor (8 x 0.2 x 6)
    var baseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(TENT_WIDTH, 0.2, TENT_DEPTH),
      new THREE.MeshLambertMaterial({ color: 0x1A3D28 })
    );
    baseMesh.position.y = 0.1;
    group.add(baseMesh);

    // Body box (slightly shorter than full height, as base + body = total)
    var bodyMesh = new THREE.Mesh(
      new THREE.BoxGeometry(TENT_WIDTH, TENT_HEIGHT - 0.5, TENT_DEPTH),
      canvasMat
    );
    bodyMesh.position.y = 0.2 + (TENT_HEIGHT - 0.5) / 2;
    group.add(bodyMesh);

    // Roof slab (thin box on top, slightly wider)
    var roofMesh = new THREE.Mesh(
      new THREE.BoxGeometry(TENT_WIDTH + 0.4, 0.3, TENT_DEPTH + 0.4),
      new THREE.MeshLambertMaterial({ color: 0x1E4D38 })
    );
    roofMesh.position.y = TENT_HEIGHT - 0.3;
    group.add(roofMesh);

    // White cross on roof
    var crossGroup = _buildCrossMesh(CROSS_COLOR);
    crossGroup.position.set(0, TENT_HEIGHT + 0.05, 0);
    crossGroup.rotation.x = Math.PI / 2; // lay flat on roof
    group.add(crossGroup);

    // Doorway cutout suggestion — two thin pillars at front entrance
    var pillarMat = new THREE.MeshLambertMaterial({ color: 0x1A3D28 });
    var pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.3, TENT_HEIGHT - 0.5, 0.3), pillarMat);
    pillarL.position.set(-1.5, 0.2 + (TENT_HEIGHT - 0.5) / 2, TENT_DEPTH / 2);
    group.add(pillarL);
    var pillarR = new THREE.Mesh(new THREE.BoxGeometry(0.3, TENT_HEIGHT - 0.5, 0.3), pillarMat);
    pillarR.position.set(1.5, 0.2 + (TENT_HEIGHT - 0.5) / 2, TENT_DEPTH / 2);
    group.add(pillarR);

    // Triage zone markers inside tent (flat thin boxes on floor)
    // RED urgent — inner zone
    var redZone = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.05, 1.5),
      new THREE.MeshLambertMaterial({ color: TRIAGE_RED, transparent: true, opacity: 0.7 })
    );
    redZone.position.set(-2.5, 0.22, -1.5);
    group.add(redZone);

    // YELLOW delayed — middle zone
    var yellowZone = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.05, 1.5),
      new THREE.MeshLambertMaterial({ color: TRIAGE_YELLOW, transparent: true, opacity: 0.7 })
    );
    yellowZone.position.set(0, 0.22, -1.5);
    group.add(yellowZone);

    // GREEN minor — outer zone
    var greenZone = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.05, 1.5),
      new THREE.MeshLambertMaterial({ color: TRIAGE_GREEN, transparent: true, opacity: 0.7 })
    );
    greenZone.position.set(2.5, 0.22, -1.5);
    group.add(greenZone);

    // Store zone world-space offsets for assignment
    group._zoneOffsets = [
      { key: 'RED',    color: TRIAGE_RED,    offset: new THREE.Vector3(-2.5, 0.5, -1.5) },
      { key: 'YELLOW', color: TRIAGE_YELLOW, offset: new THREE.Vector3(0,    0.5, -1.5) },
      { key: 'GREEN',  color: TRIAGE_GREEN,  offset: new THREE.Vector3(2.5,  0.5, -1.5) }
    ];

    group._tentHP     = TENT_HP_MAX;
    group.collapsed   = false;
    group.onFire      = false;

    return group;
  }

  // ─────────────────────────────────────────────── supply crate mesh
  function _buildSupplyCrate() {
    var group = new THREE.Group();
    // Crate box
    var crateMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    var crate = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), crateMat);
    crate.position.y = 0.5;
    group.add(crate);
    // Red cross on front face
    var crossGroup = _buildCrossMesh(0xFF2222);
    crossGroup.position.set(0, 0.5, 0.51);
    group.add(crossGroup);
    // Lid hint (lighter box on top)
    var lidMat = new THREE.MeshLambertMaterial({ color: 0xAA9020 });
    var lid = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.12, 1.02), lidMat);
    lid.position.y = 1.06;
    group.add(lid);
    return group;
  }

  // ─────────────────────────────────────────────── doctor NPC mesh
  function _buildDoctorMesh() {
    var group = new THREE.Group();
    // White coat body (cylinder)
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.4, 8), bodyMat);
    body.position.y = 0.7;
    group.add(body);
    // Head (sphere)
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCC99 });
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), headMat);
    head.position.y = 1.6;
    group.add(head);
    // Red cross armband on right arm (small red box)
    var armbandMat = new THREE.MeshLambertMaterial({ color: 0xFF2222 });
    var armband = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.18, 0.15), armbandMat);
    armband.position.set(0.45, 0.9, 0);
    group.add(armband);
    // White coat detail — small white cross on armband
    var armbandCross = _buildCrossMesh(0xFFFFFF);
    armbandCross.scale.setScalar(0.12);
    armbandCross.position.set(0.46, 0.9, 0.08);
    group.add(armbandCross);
    return group;
  }

  // ─────────────────────────────────────────────── fire effect mesh
  function _buildFireMesh() {
    var mat = new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.85 });
    var mesh = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), mat);
    mesh._mat = mat;
    return mesh;
  }

  // ─────────────────────────────────────────────── helpers
  function _getPlayerPos() {
    return _camera ? _camera.position : new THREE.Vector3();
  }

  function _dist2(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return dx * dx + dz * dz;
  }

  function _dist3(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _isInsideTent(pos) {
    if (!_tent || _tent.collapsed) return false;
    var tp = _tent.mesh.position;
    var hw = TENT_WIDTH / 2;
    var hd = TENT_DEPTH / 2;
    return (
      pos.x >= tp.x - hw && pos.x <= tp.x + hw &&
      pos.z >= tp.z - hd && pos.z <= tp.z + hd &&
      pos.y >= tp.y && pos.y <= tp.y + TENT_HEIGHT
    );
  }

  function _isNearTent(pos, radius) {
    if (!_tent || _tent.collapsed) return false;
    return _dist2(pos, _tent.mesh.position) <= radius * radius;
  }

  function _triageZoneFor(hp) {
    if (hp < 33) return 'RED';
    if (hp < 66) return 'YELLOW';
    return 'GREEN';
  }

  function _getWoundedEntities() {
    // Try to pull wounded from global game entity lists
    var list = [];
    if (window._enemies) {
      for (var ei = 0; ei < window._enemies.length; ei++) {
        var e = window._enemies[ei];
        if (e && e.hp !== undefined && e.hp <= 0 && e.mesh) {
          list.push(e);
        }
      }
    }
    if (window._alliedWounded) {
      for (var ai = 0; ai < window._alliedWounded.length; ai++) {
        list.push(window._alliedWounded[ai]);
      }
    }
    return list;
  }

  // ─────────────────────────────────────────────── triage assignment
  function _assignTriageZone(entity) {
    if (!_tent || _tent.collapsed) return;
    var hp = (entity.hp !== undefined) ? entity.hp : 50;
    var zoneKey = _triageZoneFor(hp);
    entity._triageZone = zoneKey;
    // Position entity on the corresponding zone mat
    var zones = _tent.mesh._zoneOffsets;
    for (var zi = 0; zi < zones.length; zi++) {
      if (zones[zi].key === zoneKey) {
        var offset = zones[zi].offset;
        var tp = _tent.mesh.position;
        if (entity.mesh) {
          entity.mesh.position.set(
            tp.x + offset.x,
            tp.y + offset.y,
            tp.z + offset.z
          );
        }
        break;
      }
    }
  }

  function _autoAssignNearbyWounded() {
    if (!_tent || _tent.collapsed) return;
    var wounded = _getWoundedEntities();
    for (var wi = 0; wi < wounded.length; wi++) {
      var entity = wounded[wi];
      var epos = entity.mesh ? entity.mesh.position : null;
      if (!epos) continue;
      // Already assigned
      if (entity._triageZone) continue;
      // Check distance to tent
      if (_dist2(epos, _tent.mesh.position) > TRIAGE_RADIUS_SQ) continue;
      // Assign
      if (_patients.length < MAX_PATIENTS) {
        _patients.push(entity);
        _assignTriageZone(entity);
      } else if (_patientQueue.indexOf(entity) === -1) {
        _patientQueue.push(entity);
      }
    }
  }

  // ─────────────────────────────────────────────── deploy
  function _deployTent() {
    if (_tentDeployed) {
      _showToast('FIELD HOSPITAL ALREADY DEPLOYED', '#FFD700');
      return;
    }
    if (!_scene || !_camera) return;

    var ppos = _getPlayerPos();
    var tentMesh = _buildTentMesh();
    // Place tent a few units in front of player
    tentMesh.position.set(ppos.x + 4, 0, ppos.z);
    _scene.add(tentMesh);

    _tent = {
      mesh: tentMesh,
      hp: TENT_HP_MAX,
      collapsed: false,
      onFire: false
    };
    _tentDeployed    = true;
    _tentOnFire      = false;
    _tentCollapsing  = false;
    _tentCollapseTimer = 0;

    // Place supply crate next to tent
    var crateGroup = _buildSupplyCrate();
    crateGroup.position.set(ppos.x + 4 + TENT_WIDTH / 2 + 1.5, 0, ppos.z);
    _scene.add(crateGroup);
    _supplyCrate = {
      mesh: crateGroup,
      medkits: 2,
      morphine: 1,
      collected: false
    };
    _medkitCount   = 2;
    _morphineCount = 1;

    // Spawn doctor NPC
    var doctorMesh = _buildDoctorMesh();
    doctorMesh.position.set(ppos.x + 4 - 2, 0, ppos.z + 1);
    _scene.add(doctorMesh);
    _doctor = {
      mesh: doctorMesh,
      state: 'idle'
    };
    _doctorState      = 'idle';
    _doctorTarget     = null;
    _doctorTreatTimer = 0;

    _showToast('FIELD HOSPITAL DEPLOYED  [H=Deploy  E=Supplies]', '#00FF88', 3000);
    _updateHUD();
  }

  // ─────────────────────────────────────────────── supply crate interaction
  function _interactSupplyCrate() {
    if (!_supplyCrate || _supplyCrate.collected) {
      _showToast('NO SUPPLIES AVAILABLE', '#FF4444');
      return;
    }
    var ppos = _getPlayerPos();
    if (_dist2(ppos, _supplyCrate.mesh.position) > 9) {
      _showToast('GET CLOSER TO SUPPLY CRATE', '#FFD700');
      return;
    }

    // Grant 2x medkits, 1x morphine
    _medkitCount   += _supplyCrate.medkits;
    _morphineCount += _supplyCrate.morphine;
    _supplyCrate.collected = true;

    // Check blood type — 30% chance wrong transfusion
    if (Math.random() < BLOOD_WRONG_CHANCE) {
      _playerHP = Math.max(0, _playerHP - BLOOD_TYPE_DMG);
      window._playerHP = _playerHP;
      _showToast(
        'WRONG BLOOD TYPE! -' + BLOOD_TYPE_DMG + ' HP  (Type: ' + _bloodType + ')',
        '#FF2222',
        3000
      );
    } else {
      _showToast(
        '+2 MEDKITS  +1 MORPHINE collected  [Blood: ' + _bloodType + ']',
        '#00FF88'
      );
    }

    // Visually dim the crate
    _supplyCrate.mesh.traverse(function (child) {
      if (child.isMesh && child.material) {
        child.material.transparent = true;
        child.material.opacity = 0.35;
      }
    });
  }

  // ─────────────────────────────────────────────── medkit / morphine use
  function _useMedkit() {
    if (_medkitCount <= 0) {
      _showToast('NO MEDKITS', '#FF4444');
      return;
    }
    _medkitCount -= 1;
    _playerHP = Math.min(_playerHPMax, _playerHP + 40);
    window._playerHP = _playerHP;
    _showToast('+40 HP — MEDKIT USED  (' + _medkitCount + ' left)', '#00FF88');
  }

  function _useMorphine() {
    if (_morphineCount <= 0) {
      _showToast('NO MORPHINE', '#FF4444');
      return;
    }
    _morphineCount -= 1;
    _playerHP = Math.min(_playerHPMax, _playerHP + MORPHINE_HP);
    window._playerHP = _playerHP;
    _painSlowActive = true;
    _painSlowTimer  = MORPHINE_DURATION;
    // Signal movement system
    window._fieldHospitalSpeedMult = 1.0 - MORPHINE_SLOW_PCT;
    _showToast(
      '+' + MORPHINE_HP + ' HP (MORPHINE) — Speed -20% for 30s',
      '#FFD700',
      3000
    );
  }

  // ─────────────────────────────────────────────── tent healing
  function _updatePlayerHealing(dt) {
    if (!_tentDeployed || !_tent || _tent.collapsed) return;
    var ppos = _getPlayerPos();

    if (_isInsideTent(ppos)) {
      // Inside tent: accumulate time, full heal after 2s
      _insideTentTimer += dt;
      _regenActive = false;
      _regenTimer  = REGEN_DURATION; // reset outside regen window
      if (_insideTentTimer >= TENT_HEAL_TIME && _playerHP < _playerHPMax) {
        _playerHP = _playerHPMax;
        window._playerHP = _playerHP;
        _insideTentTimer = 0;
        _showToast('FULLY HEALED IN FIELD HOSPITAL', '#00FF88');
      }
    } else if (_isNearTent(ppos, TRIAGE_RADIUS)) {
      // Outside tent but within 10 units: regen 5 HP/s for 10s
      _insideTentTimer = 0;
      if (_regenTimer > 0) {
        _regenActive = true;
        if (_playerHP < _playerHPMax) {
          _playerHP = Math.min(_playerHPMax, _playerHP + REGEN_HP_PER_SEC * dt);
          window._playerHP = _playerHP;
        }
        _regenTimer = Math.max(0, _regenTimer - dt);
        if (_regenTimer <= 0) {
          _regenActive = false;
        }
      }
    } else {
      _insideTentTimer = 0;
      _regenActive     = false;
    }
  }

  // ─────────────────────────────────────────────── pain slow
  function _updatePainSlow(dt) {
    if (!_painSlowActive) return;
    _painSlowTimer -= dt;
    if (_painSlowTimer <= 0) {
      _painSlowActive = false;
      _painSlowTimer  = 0;
      window._fieldHospitalSpeedMult = 1.0;
    }
  }

  // ─────────────────────────────────────────────── doctor AI
  function _updateDoctor(dt) {
    if (!_doctor || !_tent || _tent.collapsed) return;
    var dmesh = _doctor.mesh;

    if (_doctorState === 'idle') {
      // Find a patient that needs healing
      for (var pi = 0; pi < _patients.length; pi++) {
        var p = _patients[pi];
        if (!p || !p.mesh) continue;
        var hp = (p.hp !== undefined) ? p.hp : 100;
        if (hp < 100 && !p._doctorTreating) {
          _doctorTarget    = p;
          _doctorState     = 'moving';
          _doctor.state    = 'moving';
          p._doctorTreating = true;
          break;
        }
      }
    } else if (_doctorState === 'moving') {
      if (!_doctorTarget || !_doctorTarget.mesh) {
        _doctorState = 'idle';
        return;
      }
      var targetPos = _doctorTarget.mesh.position;
      var dist = _dist3(dmesh.position, targetPos);
      if (dist > 1.0) {
        var dir = new THREE.Vector3(
          targetPos.x - dmesh.position.x,
          0,
          targetPos.z - dmesh.position.z
        ).normalize();
        dmesh.position.x += dir.x * DOCTOR_SPEED * dt;
        dmesh.position.z += dir.z * DOCTOR_SPEED * dt;
        // Face direction
        dmesh.rotation.y = Math.atan2(dir.x, dir.z);
      } else {
        _doctorState      = 'treating';
        _doctor.state     = 'treating';
        _doctorTreatTimer = 0;
      }
    } else if (_doctorState === 'treating') {
      _doctorTreatTimer += dt;
      // Bob slightly while treating
      if (dmesh) {
        dmesh.position.y = 0.1 * Math.sin(_time * 3.0);
      }
      if (_doctorTreatTimer >= DOCTOR_TREAT_TIME) {
        // Apply healing
        if (_doctorTarget && _doctorTarget.hp !== undefined) {
          _doctorTarget.hp = Math.min(100, _doctorTarget.hp + DOCTOR_HEAL_AMT);
        }
        if (_doctorTarget) {
          _doctorTarget._doctorTreating = false;
        }
        _doctorTarget    = null;
        _doctorState     = 'idle';
        _doctor.state    = 'idle';
        _doctorTreatTimer = 0;
        if (dmesh) dmesh.position.y = 0;
        // Move patients out of queue into active
        if (_patientQueue.length > 0 && _patients.length < MAX_PATIENTS) {
          var next = _patientQueue.shift();
          _patients.push(next);
          _assignTriageZone(next);
          _showToast('Patient admitted from queue', '#FFD700');
        }
      }
    }
  }

  // ─────────────────────────────────────────────── tent fire + collapse
  function _igniteTent() {
    if (!_tent || _tent.onFire || _tent.collapsed) return;
    _tent.onFire = true;
    _tentOnFire  = true;
    // Add fire sphere mesh on top of tent
    _fireMesh = _buildFireMesh();
    _fireMesh.position.set(
      _tent.mesh.position.x,
      _tent.mesh.position.y + TENT_HEIGHT / 2,
      _tent.mesh.position.z
    );
    _scene.add(_fireMesh);
    _showToast('FIELD HOSPITAL ON FIRE!', '#FF6600', 3000);
  }

  function _updateFire(dt) {
    if (!_tentOnFire || !_fireMesh) return;
    // Pulse orange
    var pulse = 0.6 + 0.4 * Math.sin(_time * FIRE_PULSE_SPEED);
    _fireMesh._mat.opacity = pulse;
    _fireMesh.scale.setScalar(0.8 + 0.4 * Math.sin(_time * FIRE_PULSE_SPEED * 0.7));
    // Move upward slightly
    _fireMesh.position.y = _tent.mesh.position.y + TENT_HEIGHT / 2 + 0.3 * Math.sin(_time * 2.5);
  }

  function _damageTent(amount) {
    if (!_tent || _tent.collapsed) return;
    _tent.hp -= amount;
    if (_tent.hp <= 0 && !_tent.onFire) {
      _igniteTent();
    }
    if (_tent.hp <= 0 && !_tentCollapsing) {
      _tentCollapsing    = true;
      _tentCollapseTimer = 0;
    }
  }

  function _updateCollapse(dt) {
    if (!_tentCollapsing || !_tent || _tent.collapsed) return;
    _tentCollapseTimer += dt;
    var t = _tentCollapseTimer / COLLAPSE_TIME;
    var s = Math.max(0, 1.0 - t);
    _tent.mesh.scale.setScalar(s);
    if (_fireMesh) {
      _fireMesh.scale.setScalar(s * 1.2);
    }
    if (t >= 1.0) {
      _tent.collapsed = true;
      _tentOnFire     = false;
      _scene.remove(_tent.mesh);
      if (_fireMesh) {
        _scene.remove(_fireMesh);
        _fireMesh = null;
      }
      _patients     = [];
      _patientQueue = [];
      _showToast('FIELD HOSPITAL DESTROYED!', '#FF2222', 3000);
      _updateHUD();
    }
  }

  // expose for external explosive systems
  window._fieldHospitalDamage = function (amount) {
    _damageTent(amount);
  };

  // ─────────────────────────────────────────────── key events
  function _onKeyDown(e) {
    _keysDown[e.key] = true;
    _keyPressed[e.key] = true;
  }
  function _onKeyUp(e) {
    _keysDown[e.key] = false;
  }

  // ─────────────────────────────────────────────── public API
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    // Read player HP from global if available
    _playerHP = (window._playerHP !== undefined) ? window._playerHP : 100;
    _playerHPMax = 100;

    // Assign random blood type (default O+)
    _bloodType = 'O+';
    if (window._playerBloodType) {
      _bloodType = window._playerBloodType;
    }
    window._playerBloodType = _bloodType;

    _createHUD();

    window.addEventListener('keydown', _onKeyDown, false);
    window.addEventListener('keyup',   _onKeyUp,   false);
  }

  function update(delta) {
    _time += delta;

    // Consume single-frame key presses
    var kp = _keyPressed;
    _keyPressed = {};

    // Sync player HP from global
    if (window._playerHP !== undefined) {
      _playerHP = window._playerHP;
    }

    // H key — deploy field hospital
    if (kp['h'] || kp['H']) {
      _deployTent();
    }

    // E key — interact with supply crate
    if (kp['e'] || kp['E']) {
      _interactSupplyCrate();
    }

    // Q key — use medkit (if in inventory)
    if (kp['q'] || kp['Q']) {
      _useMedkit();
    }

    // Z key — use morphine (if in inventory)
    if (kp['z'] || kp['Z']) {
      _useMorphine();
    }

    // Healing
    _updatePlayerHealing(delta);

    // Pain slow
    _updatePainSlow(delta);

    // Auto-assign nearby wounded to triage zones
    _autoAssignNearbyWounded();

    // Doctor AI
    _updateDoctor(delta);

    // Fire effect
    _updateFire(delta);

    // Tent collapse animation
    _updateCollapse(delta);

    // Write HP back to global
    window._playerHP = _playerHP;

    // HUD
    _updateHUD();
  }

  function reset() {
    if (_tent && _scene) {
      _scene.remove(_tent.mesh);
    }
    if (_fireMesh && _scene) {
      _scene.remove(_fireMesh);
    }
    if (_supplyCrate && _scene) {
      _scene.remove(_supplyCrate.mesh);
    }
    if (_doctor && _scene) {
      _scene.remove(_doctor.mesh);
    }

    _tent              = null;
    _tentDeployed      = false;
    _tentOnFire        = false;
    _tentCollapsing    = false;
    _tentCollapseTimer = 0;
    _fireMesh          = null;
    _supplyCrate       = null;
    _doctor            = null;
    _doctorTarget      = null;
    _doctorState       = 'idle';
    _doctorTreatTimer  = 0;

    _patients          = [];
    _patientQueue      = [];
    _medkitCount       = 0;
    _morphineCount     = 0;

    _playerHP          = 100;
    _insideTentTimer   = 0;
    _regenTimer        = 0;
    _regenActive       = false;
    _painSlowActive    = false;
    _painSlowTimer     = 0;

    _keysDown          = {};
    _keyPressed        = {};
    _time              = 0;

    window._playerHP              = _playerHP;
    window._fieldHospitalSpeedMult = 1.0;

    if (_hudEl)       { _hudEl.style.display = 'none'; }
    if (_queueEl)     { _queueEl.style.display = 'none'; }
    if (_toast)       { _toast.style.display = 'none'; }
    if (_bloodTypeEl) { _bloodTypeEl.textContent = 'Blood: ' + _bloodType; }
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };
})();
