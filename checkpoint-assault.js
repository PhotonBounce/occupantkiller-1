// ============================================================
//  checkpoint-assault.js — Browser-based Three.js checkpoint assault module
//  C+P keys to spawn checkpoint and start assault mission.
//  Features: searchlight, alarm system, breach options, vehicle, HUD.
//  Public API: init(scene, camera), update(delta, playerPos, keys, isCrouching), reset()
// ============================================================
window.CheckpointAssault = (function () {
  'use strict';

  // ── Module state ─────────────────────────────────────────
  var _scene = null;
  var _camera = null;
  var _active = false;

  // Key state
  var _keyCDown = false;
  var _keyPDown = false;

  // Checkpoint objects
  var _checkpointRoot = null;
  var _gate = null;
  var _gateHP = 100;
  var _gateFalling = false;
  var _gateFallProgress = 0;
  var _guardBooth = null;
  var _searchlightGroup = null;
  var _searchlightAngle = 0;
  var _searchlightTimer = 0;
  var _searchlightSweepDir = 1;
  var _beamCone = null;
  var _concreteBarriers = [];
  var _vehicleLane = null;

  // Guards
  var _guards = [];
  var _guardCount = 6;
  var _guardsAlive = 6;

  // Alarm
  var _alarmActive = false;
  var _alarmTimer = 0;
  var _sirenOscillator = null;
  var _sirenGain = null;
  var _audioCtx = null;
  var _reinforcementsTimer = 0;
  var _reinforcementsSpawned = false;

  // Radio antenna
  var _antenna = null;
  var _antennaHP = 50;
  var _antennaDestroyed = false;

  // Vehicle (truck)
  var _truck = null;
  var _truckHP = 150;
  var _truckDriving = false;
  var _truckExploded = false;
  var _truckPos = null;

  // Satchel charge
  var _satchelPlanted = false;
  var _satchelMesh = null;
  var _satchelTimer = 0;
  var _satchelPos = null;

  // Objective ring
  var _objectiveRing = null;
  var _objectiveReached = false;

  // Bonus objectives
  var _flagPole = null;
  var _flagCaptured = false;
  var _terminal = null;
  var _terminalHacked = false;
  var _terminalHackTimer = 0;
  var _terminalHacking = false;

  // HUD
  var _hudEl = null;

  // Spawn position
  var _spawnPos = null;

  // Explosions / particles
  var _particles = [];

  // Key handlers
  var _onKeyDown = null;
  var _onKeyUp = null;

  // Checkpoint position (world center)
  var CHECKPOINT_OFFSET_Z = -30;

  // ── HUD ──────────────────────────────────────────────────
  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'ca-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:14px',
      'left:14px',
      'font-family:monospace',
      'font-size:13px',
      'color:#00FFCC',
      'background:rgba(0,0,0,0.65)',
      'border:1px solid #00AA88',
      'padding:5px 12px',
      'border-radius:4px',
      'z-index:320',
      'pointer-events:none',
      'display:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD(playerPos) {
    if (!_hudEl) return;
    if (!_active) { _hudEl.style.display = 'none'; return; }
    var dist = 0;
    if (playerPos && _objectiveRing) {
      var dx = _objectiveRing.position.x - playerPos.x;
      var dz = _objectiveRing.position.z - playerPos.z;
      dist = Math.round(Math.sqrt(dx * dx + dz * dz));
    }
    var alarmStr = _alarmActive ? '<span style="color:#FF4444">ON</span>' : 'OFF';
    _hudEl.innerHTML =
      'CP ASSAULT &nbsp;[GUARDS: ' + _guardsAlive + '/' + _guardCount + ']' +
      '&nbsp;[ALARM: ' + alarmStr + ']' +
      '&nbsp;[OBJECTIVE: ' + dist + 'm]';
    _hudEl.style.display = 'block';
  }

  // ── Toast ─────────────────────────────────────────────────
  function _toast(msg, dur, color) {
    try {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast(msg, dur || 2500, color || '#00FFCC');
        return;
      }
    } catch (e) {}
    var t = document.createElement('div');
    t.style.cssText = [
      'position:fixed',
      'top:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:14px',
      'color:' + (color || '#00FFCC'),
      'background:rgba(0,0,0,0.75)',
      'border:1px solid ' + (color || '#00FFCC'),
      'padding:6px 18px',
      'border-radius:5px',
      'z-index:9999',
      'pointer-events:none'
    ].join(';');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, dur || 2500);
  }

  // ── Audio ─────────────────────────────────────────────────
  function _startSiren() {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (_sirenOscillator) { _sirenOscillator.stop(); _sirenOscillator = null; }
      _sirenOscillator = _audioCtx.createOscillator();
      _sirenGain = _audioCtx.createGain();
      _sirenOscillator.type = 'square';
      _sirenOscillator.frequency.setValueAtTime(880, _audioCtx.currentTime);
      _sirenGain.gain.setValueAtTime(0.18, _audioCtx.currentTime);
      _sirenOscillator.connect(_sirenGain);
      _sirenGain.connect(_audioCtx.destination);
      _sirenOscillator.start();
    } catch (e) {}
  }

  function _stopSiren() {
    try {
      if (_sirenOscillator) {
        _sirenOscillator.stop();
        _sirenOscillator = null;
      }
    } catch (e) {}
  }

  function _pulseSiren(t) {
    if (!_sirenOscillator || !_audioCtx || !_sirenGain) return;
    try {
      var pulse = 0.1 + 0.12 * Math.abs(Math.sin(t * 3.0));
      _sirenGain.gain.setValueAtTime(pulse, _audioCtx.currentTime);
      var freq = 800 + 160 * Math.abs(Math.sin(t * 1.5));
      _sirenOscillator.frequency.setValueAtTime(freq, _audioCtx.currentTime);
    } catch (e) {}
  }

  // ── Geometry helpers ──────────────────────────────────────
  function _makeMesh(geo, mat) {
    return new THREE.Mesh(geo, mat);
  }

  function _makeBox(w, h, d, color, opacity) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (opacity !== undefined && opacity < 1) {
      mat.transparent = true;
      mat.opacity = opacity;
    }
    return _makeMesh(new THREE.BoxGeometry(w, h, d), mat);
  }

  function _makeCyl(rt, rb, h, segs, color) {
    return _makeMesh(
      new THREE.CylinderGeometry(rt, rb, h, segs || 8),
      new THREE.MeshLambertMaterial({ color: color })
    );
  }

  // ── Spawn checkpoint ──────────────────────────────────────
  function _spawnCheckpoint(origin) {
    _checkpointRoot = new THREE.Group();
    _checkpointRoot.position.copy(origin);
    _scene.add(_checkpointRoot);

    // Vehicle lane (flat strip)
    _vehicleLane = _makeBox(6, 0.05, 30, 0x444444);
    _vehicleLane.position.set(0, 0.025, 0);
    _checkpointRoot.add(_vehicleLane);

    // Main gate barrier — striped red/white via alternating meshes
    var gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0.75, 0);
    var gateBody = _makeBox(5, 1.5, 0.3, 0x888888);
    gateGroup.add(gateBody);
    // Red stripes overlay
    for (var si = 0; si < 4; si++) {
      var stripe = _makeBox(0.55, 1.5, 0.32, 0xCC2222);
      stripe.position.x = -1.8 + si * 1.2;
      gateGroup.add(stripe);
    }
    _gate = gateGroup;
    _checkpointRoot.add(_gate);

    // Guard booth
    var booth = _makeBox(2, 2.5, 2, 0x667755);
    booth.position.set(3.5, 1.25, 0);
    _guardBooth = booth;
    _checkpointRoot.add(_guardBooth);

    // Booth window
    var boothWin = _makeBox(0.8, 0.6, 0.05, 0x88AACC, 0.6);
    boothWin.position.set(2.51, 1.5, 0);
    _checkpointRoot.add(boothWin);

    // Searchlight tower
    _searchlightGroup = new THREE.Group();
    _searchlightGroup.position.set(-4, 0, 0);

    var towerBase = _makeCyl(0.5, 0.5, 0.5, 8, 0x555544);
    towerBase.position.y = 0.25;
    _searchlightGroup.add(towerBase);

    var towerShaft = _makeCyl(0.4, 0.4, 8, 8, 0x666655);
    towerShaft.position.y = 4.5;
    _searchlightGroup.add(towerShaft);

    var towerTop = _makeBox(1.2, 0.6, 1.2, 0x555544);
    towerTop.position.y = 8.3;
    _searchlightGroup.add(towerTop);

    var lightMount = _makeCyl(0.2, 0.2, 0.4, 6, 0xFFEEAA);
    lightMount.rotation.x = Math.PI / 2;
    lightMount.position.set(0, 8.5, 0.6);
    _searchlightGroup.add(lightMount);

    // Beam cone
    _beamCone = _makeMesh(
      new THREE.CylinderGeometry(0.05, 1.5, 12, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xFFFF88, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
    );
    _beamCone.rotation.x = Math.PI / 2;
    _beamCone.position.set(0, 8.5, 7);
    _searchlightGroup.add(_beamCone);

    _checkpointRoot.add(_searchlightGroup);

    // Concrete barriers — 6 bunkers around perimeter
    var barrierPositions = [
      [-6, 0, -5], [-6, 0, 5],
      [6, 0, -5], [6, 0, 5],
      [0, 0, -8], [0, 0, 8]
    ];
    for (var bi = 0; bi < barrierPositions.length; bi++) {
      var bp = barrierPositions[bi];
      var barrier = _makeBox(1, 1, 2, 0x888877);
      barrier.position.set(bp[0], 0.5, bp[2]);
      _checkpointRoot.add(barrier);
      _concreteBarriers.push(barrier);
    }
    // East-side flanking gap: barriers at index 2 and 3 are spaced with a 2-unit gap

    // Radio antenna
    var antGroup = new THREE.Group();
    antGroup.position.set(5, 0, -6);
    var antMast = _makeCyl(0.15, 0.15, 5, 6, 0x999999);
    antMast.position.y = 2.5;
    antGroup.add(antMast);
    var antDish = _makeBox(0.8, 0.3, 0.8, 0x777777);
    antDish.position.y = 5.2;
    antGroup.add(antDish);
    _antenna = antGroup;
    _checkpointRoot.add(_antenna);

    // Truck at gate
    var truckGroup = new THREE.Group();
    truckGroup.position.set(-1, 1, -5);
    var truckBody = _makeBox(5, 2, 2.5, 0x556644);
    truckBody.position.y = 0;
    truckGroup.add(truckBody);
    var truckCabin = _makeBox(1.8, 0.9, 2.4, 0x445533);
    truckCabin.position.set(1.6, 0.95, 0);
    truckGroup.add(truckCabin);
    // Wheels
    var wheelOffsets = [[-1.5, -0.7, 1.4], [-1.5, -0.7, -1.4], [1.2, -0.7, 1.4], [1.2, -0.7, -1.4]];
    for (var wi = 0; wi < wheelOffsets.length; wi++) {
      var wo = wheelOffsets[wi];
      var wheel = _makeCyl(0.4, 0.4, 0.3, 8, 0x222222);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wo[0], wo[1], wo[2]);
      truckGroup.add(wheel);
    }
    _truck = truckGroup;
    _truckPos = new THREE.Vector3(-1, 1, -5);
    _checkpointRoot.add(_truck);

    // Objective ring (CylinderGeometry r=3 flat ring behind checkpoint)
    _objectiveRing = _makeMesh(
      new THREE.CylinderGeometry(3, 3, 0.15, 32, 1, false),
      new THREE.MeshBasicMaterial({ color: 0xFF2222, wireframe: true })
    );
    _objectiveRing.position.set(0, 0.1, -18);
    _checkpointRoot.add(_objectiveRing);

    // Checkpoint flag
    var flagGroup = new THREE.Group();
    flagGroup.position.set(4, 0, -3);
    var pole = _makeBox(0.1, 2, 0.1, 0xBBBBBB);
    pole.position.y = 1;
    flagGroup.add(pole);
    var flag = _makeBox(0.8, 0.5, 0.1, 0xFF4400);
    flag.position.set(0.45, 1.75, 0);
    flagGroup.add(flag);
    _flagPole = flagGroup;
    _checkpointRoot.add(_flagPole);

    // Computer terminal
    _terminal = _makeBox(0.5, 1, 0.3, 0x334455);
    _terminal.position.set(3.5, 0.5, -1.5);
    _checkpointRoot.add(_terminal);

    // Spawn 6 guards
    _spawnGuards(origin);
  }

  // ── Guards ────────────────────────────────────────────────
  function _spawnGuards(origin) {
    _guards = [];
    _guardsAlive = 6;

    var guardDefs = [
      // 2 at gate
      { x: -1, z: 1,  role: 'gate' },
      { x:  1, z: 1,  role: 'gate' },
      // 2 in booth
      { x: 3.5, z: 0.5, role: 'booth' },
      { x: 3.5, z: -0.5, role: 'booth' },
      // 2 elevated (tower positions)
      { x: -4.2, z: 0.3, role: 'tower' },
      { x: -3.8, z: -0.3, role: 'tower' }
    ];

    for (var gi = 0; gi < guardDefs.length; gi++) {
      var gd = guardDefs[gi];
      var guardMesh = _makeCyl(0.25, 0.25, 1.8, 8, 0x4A6A2A);
      guardMesh.position.set(gd.x, 0.9, gd.z);
      if (gd.role === 'tower') guardMesh.position.y = 9.2;
      _checkpointRoot.add(guardMesh);

      // Weapon stub
      var gun = _makeBox(0.08, 0.08, 0.6, 0x222222);
      gun.position.set(0.2, 0.3, -0.4);
      guardMesh.add(gun);

      var g = {
        mesh: guardMesh,
        hp: 80,
        dead: false,
        role: gd.role,
        aggressive: false,
        rushTarget: null,
        rushTimer: 0,
        fireTimer: 0,
        baseX: origin.x + gd.x,
        baseZ: origin.z + gd.z,
        alertPos: null
      };
      _guards.push(g);
    }
  }

  // ── Alarm ─────────────────────────────────────────────────
  function _triggerAlarm(lastPos) {
    if (_alarmActive) return;
    _alarmActive = true;
    _alarmTimer = 0;
    _reinforcementsTimer = 0;
    _reinforcementsSpawned = false;
    _startSiren();
    _toast('!! ALARM TRIGGERED !! Destroy antenna within 20s to cancel reinforcements!', 4000, '#FF4444');

    for (var gi = 0; gi < _guards.length; gi++) {
      var g = _guards[gi];
      if (!g.dead) {
        g.aggressive = true;
        g.alertPos = lastPos ? lastPos.clone() : null;
      }
    }
  }

  function _cancelAlarm() {
    if (!_alarmActive) return;
    _alarmActive = false;
    _stopSiren();
    _toast('Alarm cancelled — antenna destroyed!', 3000, '#00FFCC');
    for (var gi = 0; gi < _guards.length; gi++) {
      _guards[gi].aggressive = false;
    }
  }

  // ── Explosion ─────────────────────────────────────────────
  function _spawnExplosion(worldPos, radius) {
    for (var pi = 0; pi < 14; pi++) {
      var p = _makeBox(0.25, 0.25, 0.25, Math.random() > 0.5 ? 0xFF6600 : 0xFFFF00);
      p.position.copy(worldPos);
      _scene.add(p);
      _particles.push({
        mesh: p,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * radius * 2,
          Math.random() * radius * 1.5,
          (Math.random() - 0.5) * radius * 2
        ),
        life: 0.9 + Math.random() * 0.5,
        age: 0
      });
    }
  }

  function _explodeTruck() {
    if (_truckExploded) return;
    _truckExploded = true;
    var wp = new THREE.Vector3();
    _truck.getWorldPosition(wp);
    _spawnExplosion(wp, 5);
    _scene.remove(_truck);
    _truck = null;
    _toast('Truck destroyed!', 2000, '#FF6600');
  }

  // ── Gate breach ───────────────────────────────────────────
  function _startGateFall() {
    if (_gateFalling) return;
    _gateFalling = true;
    _toast('Gate breached!', 2000, '#FFFF00');
  }

  function _updateGateFall(delta) {
    if (!_gateFalling || !_gate) return;
    _gateFallProgress += delta * 0.7;
    if (_gateFallProgress >= 1) {
      _gateFallProgress = 1;
    }
    _gate.rotation.x = (_gateFallProgress) * (Math.PI / 2);
    _gate.position.y = 0.75 - _gateFallProgress * 0.75;
  }

  // ── Satchel ───────────────────────────────────────────────
  function _plantSatchel(playerPos) {
    if (_satchelPlanted) { _toast('Satchel already planted!', 1500, '#FFAA00'); return; }
    _satchelPlanted = true;
    _satchelTimer = 5.0;
    _satchelPos = playerPos.clone();
    _satchelMesh = _makeBox(0.3, 0.2, 0.15, 0x8B6914);
    _satchelMesh.position.copy(playerPos);
    _satchelMesh.position.y = 0.1;
    _scene.add(_satchelMesh);
    _toast('Satchel planted — detonating in 5s!', 3000, '#FFAA00');
  }

  function _updateSatchel(delta) {
    if (!_satchelPlanted) return;
    _satchelTimer -= delta;
    if (_satchelTimer <= 0) {
      _satchelPlanted = false;
      if (_satchelMesh) { _scene.remove(_satchelMesh); _satchelMesh = null; }
      if (_satchelPos) {
        _spawnExplosion(_satchelPos, 6);
        // Destroy gate if close
        if (_gate) {
          var gateWp = new THREE.Vector3();
          _gate.getWorldPosition(gateWp);
          var dx = gateWp.x - _satchelPos.x;
          var dz = gateWp.z - _satchelPos.z;
          if (Math.sqrt(dx * dx + dz * dz) < 8) {
            _startGateFall();
          }
        }
        _toast('BOOM! Satchel detonated!', 2500, '#FF6600');
      }
    }
  }

  // ── Searchlight ───────────────────────────────────────────
  function _updateSearchlight(delta, playerPos, isCrouching) {
    if (!_searchlightGroup) return;
    _searchlightTimer += delta;

    var sweepSpeed = 0.7;
    _searchlightAngle += sweepSpeed * _searchlightSweepDir * delta;
    if (_searchlightAngle > Math.PI * 0.5) { _searchlightAngle = Math.PI * 0.5; _searchlightSweepDir = -1; }
    if (_searchlightAngle < -Math.PI * 0.5) { _searchlightAngle = -Math.PI * 0.5; _searchlightSweepDir = 1; }

    _searchlightGroup.rotation.y = _searchlightAngle;

    // Flash beam color if alarm
    if (_beamCone) {
      _beamCone.material.opacity = _alarmActive ? 0.35 : 0.18;
      _beamCone.material.color.setHex(_alarmActive ? 0xFF4444 : 0xFFFF88);
    }

    // Check if player is in beam
    if (!playerPos || _alarmActive) return;
    var towerWorldPos = new THREE.Vector3();
    _searchlightGroup.getWorldPosition(towerWorldPos);
    var dx = playerPos.x - towerWorldPos.x;
    var dz = playerPos.z - towerWorldPos.z;
    var distToTower = Math.sqrt(dx * dx + dz * dz);
    if (distToTower > 20) return;

    // Beam direction in world space
    var beamDir = new THREE.Vector3(Math.sin(_checkpointRoot.rotation.y + _searchlightAngle), 0, Math.cos(_checkpointRoot.rotation.y + _searchlightAngle));
    var toPlayer = new THREE.Vector3(dx, 0, dz).normalize();
    var dot = beamDir.dot(toPlayer);
    var inBeam = dot > 0.82 && distToTower < 18;

    if (inBeam) {
      var detected = false;
      if (!isCrouching) {
        detected = true;
      } else {
        detected = Math.random() < 0.5;
      }
      if (detected) {
        _triggerAlarm(playerPos);
      }
    }
  }

  // ── Guard AI ──────────────────────────────────────────────
  function _updateGuards(delta, playerPos) {
    var alive = 0;
    for (var gi = 0; gi < _guards.length; gi++) {
      var g = _guards[gi];
      if (g.dead) continue;
      alive++;

      if (!g.mesh) continue;

      var gWorldPos = new THREE.Vector3();
      g.mesh.getWorldPosition(gWorldPos);

      if (g.aggressive) {
        // Rush to alert position or player
        var target = playerPos || g.alertPos;
        if (target) {
          var tdx = target.x - gWorldPos.x;
          var tdz = target.z - gWorldPos.z;
          var tdist = Math.sqrt(tdx * tdx + tdz * tdz);
          if (tdist > 1.5) {
            var spd = 4.0 * delta;
            g.mesh.position.x += (tdx / tdist) * spd;
            g.mesh.position.z += (tdz / tdist) * spd;
          }
        }
      }

      // Periodic turn toward player
      if (playerPos) {
        var lx = playerPos.x - gWorldPos.x;
        var lz = playerPos.z - gWorldPos.z;
        if (Math.abs(lx) > 0.01 || Math.abs(lz) > 0.01) {
          g.mesh.rotation.y = Math.atan2(lx, lz);
        }
      }
    }
    _guardsAlive = alive;
  }

  // ── Reinforcements ────────────────────────────────────────
  function _spawnReinforcements() {
    _reinforcementsSpawned = true;
    _toast('Reinforcements arriving!', 3000, '#FF2222');
    var origin = _checkpointRoot.position;
    for (var ri = 0; ri < 4; ri++) {
      var angle = (ri / 4) * Math.PI * 2;
      var rx = origin.x + Math.cos(angle) * 40;
      var rz = origin.z + Math.sin(angle) * 40;
      var rmesh = _makeCyl(0.25, 0.25, 1.8, 8, 0x8B0000);
      rmesh.position.set(rx, 0.9, rz);
      _scene.add(rmesh);
      _guards.push({
        mesh: rmesh,
        hp: 80,
        dead: false,
        role: 'reinforce',
        aggressive: true,
        alertPos: null,
        fireTimer: 0
      });
      _guardCount += 1;
    }
  }

  // ── Damage helpers ────────────────────────────────────────
  function _damageGuardNear(worldPos, radius, dmg) {
    for (var gi = 0; gi < _guards.length; gi++) {
      var g = _guards[gi];
      if (g.dead || !g.mesh) continue;
      var gp = new THREE.Vector3();
      g.mesh.getWorldPosition(gp);
      var dx = gp.x - worldPos.x;
      var dz = gp.z - worldPos.z;
      if (Math.sqrt(dx * dx + dz * dz) <= radius) {
        g.hp -= dmg;
        if (g.hp <= 0) {
          g.dead = true;
          g.mesh.visible = false;
        }
      }
    }
  }

  // ── Interaction checks ────────────────────────────────────
  function _checkInteractions(playerPos, keys, isCrouching) {
    if (!playerPos || !_checkpointRoot) return;
    var cpPos = _checkpointRoot.position;

    // Local player pos relative to checkpoint
    var lpx = playerPos.x - cpPos.x;
    var lpz = playerPos.z - cpPos.z;

    // Commandeer truck (E key within 2 units)
    if (keys['KeyE'] && _truck && !_truckDriving && !_truckExploded) {
      var tw = new THREE.Vector3();
      _truck.getWorldPosition(tw);
      var tdx = tw.x - playerPos.x;
      var tdz = tw.z - playerPos.z;
      if (Math.sqrt(tdx * tdx + tdz * tdz) < 2) {
        _truckDriving = true;
        _toast('Truck commandeered! Drive with WASD', 3000, '#FFFF00');
      }
    }

    // Frontal breach: player within 1 unit of gate
    if (!_gateFalling && _gate) {
      var distGate = Math.abs(lpz - 0) + Math.abs(lpx - 0);
      if (Math.sqrt(lpx * lpx + lpz * lpz) < 1.2) {
        _startGateFall();
      }
    }

    // Satchel plant (Shift+B)
    if (keys['ShiftLeft'] && keys['KeyB']) {
      _plantSatchel(playerPos);
    }

    // Hack terminal (H key within 1 unit)
    if (_terminal && !_terminalHacked) {
      var tw2 = new THREE.Vector3();
      _terminal.getWorldPosition(tw2);
      var tdx2 = tw2.x - playerPos.x;
      var tdz2 = tw2.z - playerPos.z;
      var distTerm = Math.sqrt(tdx2 * tdx2 + tdz2 * tdz2);
      if (distTerm < 1) {
        if (keys['KeyH'] && !_terminalHacking) {
          _terminalHacking = true;
          _terminalHackTimer = 5.0;
          _toast('Hacking terminal... 5s', 2000, '#00FFCC');
        }
      }
    }

    // Capture flag (within 1.5 units)
    if (_flagPole && !_flagCaptured) {
      var fw = new THREE.Vector3();
      _flagPole.getWorldPosition(fw);
      var fdx = fw.x - playerPos.x;
      var fdz = fw.z - playerPos.z;
      if (Math.sqrt(fdx * fdx + fdz * fdz) < 1.5) {
        _flagCaptured = true;
        // Change flag color
        var flagMesh = _flagPole.children[1];
        if (flagMesh) flagMesh.material.color.setHex(0x0066FF);
        _toast('FLAG CAPTURED! Bonus objective complete!', 3000, '#3399FF');
      }
    }

    // Antenna destroy check (proximity shoot — simplified: if player within 2 and alarm active)
    if (_antenna && !_antennaDestroyed && _alarmActive) {
      var aw = new THREE.Vector3();
      _antenna.getWorldPosition(aw);
      var adx = aw.x - playerPos.x;
      var adz = aw.z - playerPos.z;
      if (Math.sqrt(adx * adx + adz * adz) < 4) {
        // Simulate shooting via proximity
        _antennaHP -= 30;
        if (_antennaHP <= 0) {
          _antennaDestroyed = true;
          _scene.remove(_antenna);
          _antenna = null;
          _cancelAlarm();
        }
      }
    }

    // Objective ring reached
    if (_objectiveRing && !_objectiveReached) {
      var ow = new THREE.Vector3();
      _objectiveRing.getWorldPosition(ow);
      var odx = ow.x - playerPos.x;
      var odz = ow.z - playerPos.z;
      if (Math.sqrt(odx * odx + odz * odz) < 4) {
        _objectiveReached = true;
        _objectiveRing.material.color.setHex(0x00FF44);
        _toast('OBJECTIVE REACHED! Mission complete!', 5000, '#00FF44');
      }
    }
  }

  // ── Particle update ───────────────────────────────────────
  function _updateParticles(delta) {
    for (var pi = _particles.length - 1; pi >= 0; pi--) {
      var p = _particles[pi];
      p.age += delta;
      p.mesh.position.x += p.vel.x * delta;
      p.mesh.position.y += p.vel.y * delta - 4.9 * delta * delta;
      p.mesh.position.z += p.vel.z * delta;
      p.mesh.material.opacity = 1 - p.age / p.life;
      p.mesh.material.transparent = true;
      if (p.age >= p.life) {
        _scene.remove(p.mesh);
        _particles.splice(pi, 1);
      }
    }
  }

  // ── Terminal hack update ──────────────────────────────────
  function _updateTerminalHack(delta) {
    if (!_terminalHacking || _terminalHacked) return;
    _terminalHackTimer -= delta;
    if (_terminalHackTimer <= 0) {
      _terminalHacking = false;
      _terminalHacked = true;
      if (_terminal) _terminal.material.color.setHex(0x00FF88);
      _toast('Terminal HACKED! Bonus objective complete!', 3000, '#00FFCC');
    }
  }

  // ── Key handlers ──────────────────────────────────────────
  function _setupKeys() {
    _onKeyDown = function (e) {
      if (e.code === 'KeyC') { _keyCDown = true; _checkSpawnCombo(); }
      if (e.code === 'KeyP') { _keyPDown = true; _checkSpawnCombo(); }
    };
    _onKeyUp = function (e) {
      if (e.code === 'KeyC') _keyCDown = false;
      if (e.code === 'KeyP') _keyPDown = false;
    };
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup', _onKeyUp);
  }

  function _checkSpawnCombo() {
    if (_keyCDown && _keyPDown && !_active) {
      _active = true;
      var origin = new THREE.Vector3(0, 0, CHECKPOINT_OFFSET_Z);
      if (_camera) {
        origin.set(_camera.position.x, 0, _camera.position.z + CHECKPOINT_OFFSET_Z);
      }
      _spawnCheckpoint(origin);
      _toast('CHECKPOINT ASSAULT: Breach the checkpoint!', 3500, '#00FFCC');
    }
  }

  // ── Public API ────────────────────────────────────────────
  function init(sceneRef, cameraRef) {
    _scene = sceneRef;
    _camera = cameraRef;
    _createHUD();
    _setupKeys();
  }

  function update(delta, playerPos, keys, isCrouching) {
    if (!_active) return;
    if (!delta || delta <= 0 || delta > 0.5) delta = 0.016;

    _updateGateFall(delta);
    _updateSearchlight(delta, playerPos, isCrouching);
    _updateGuards(delta, playerPos);
    _updateSatchel(delta);
    _updateParticles(delta);
    _updateTerminalHack(delta);

    if (keys) _checkInteractions(playerPos, keys, isCrouching);

    // Alarm timer
    if (_alarmActive) {
      _alarmTimer += delta;
      _pulseSiren(_alarmTimer);
      _reinforcementsTimer += delta;
      if (!_reinforcementsSpawned && _reinforcementsTimer >= 15) {
        _spawnReinforcements();
      }
    }

    // Objective ring pulse
    if (_objectiveRing) {
      _objectiveRing.rotation.y += delta * 1.2;
    }

    // Truck drive (simple WASD if commandeered)
    if (_truckDriving && _truck && keys) {
      var truckSpd = 8 * delta;
      if (keys['KeyW']) { _truck.position.z -= truckSpd; }
      if (keys['KeyS']) { _truck.position.z += truckSpd; }
      if (keys['KeyA']) { _truck.position.x -= truckSpd; }
      if (keys['KeyD']) { _truck.position.x += truckSpd; }
    }

    // Truck HP check
    if (_truck && !_truckExploded) {
      if (_truckHP <= 0) _explodeTruck();
    }

    _updateHUD(playerPos);
  }

  function reset() {
    _active = false;
    _alarmActive = false;
    _gateFalling = false;
    _gateFallProgress = 0;
    _satchelPlanted = false;
    _truckDriving = false;
    _truckExploded = false;
    _reinforcementsSpawned = false;
    _objectiveReached = false;
    _flagCaptured = false;
    _terminalHacked = false;
    _terminalHacking = false;
    _antennaDestroyed = false;
    _guardsAlive = 6;
    _guardCount = 6;
    _keyCDown = false;
    _keyPDown = false;

    _stopSiren();

    if (_checkpointRoot) {
      _scene.remove(_checkpointRoot);
      _checkpointRoot = null;
    }

    for (var pi = 0; pi < _particles.length; pi++) {
      _scene.remove(_particles[pi].mesh);
    }
    _particles = [];
    _guards = [];
    _concreteBarriers = [];

    _gate = null;
    _guardBooth = null;
    _searchlightGroup = null;
    _beamCone = null;
    _vehicleLane = null;
    _truck = null;
    _antenna = null;
    _objectiveRing = null;
    _flagPole = null;
    _terminal = null;
    _satchelMesh = null;

    if (_satchelMesh && _scene) { _scene.remove(_satchelMesh); _satchelMesh = null; }

    if (_hudEl) _hudEl.style.display = 'none';
  }

  return { init: init, update: update, reset: reset };
})();
