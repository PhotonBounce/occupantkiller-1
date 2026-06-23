window.VehicleRepair = (function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  var _scene, _camera;
  var _vehicles = [];          // { mesh, hp, maxHp, systems, smoke, sound }
  var _repairTruck = null;     // { mesh, crane, hook, chest, targetVehicle, state, winchLine }
  var _medicNPC = null;        // { mesh, active, timer }
  var _repairState = null;     // active minigame state
  var _score = 0;
  var _playerHp = 100;
  var _keys = {};
  var _mousePressed = false;
  var _hud = null;             // DOM element container
  var _diagnosticHud = null;
  var _winchActive = false;
  var _winchTarget = null;
  var _qHeld = false;
  var _eHeld = false;          // for Q+E call
  var _callTruckTimer = 0;

  // Arrow sequence for task 3
  var ARROW_SEQ = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

  // ── HUD Setup ──────────────────────────────────────────────────────────────
  function _createHUD() {
    _hud = document.createElement('div');
    _hud.id = 'vr-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.82)',
      'border:2px solid #4caf50',
      'border-radius:8px',
      'padding:18px 28px',
      'color:#fff',
      'font-family:monospace',
      'font-size:15px',
      'min-width:320px',
      'display:none',
      'z-index:9999',
      'user-select:none'
    ].join(';');
    document.body.appendChild(_hud);

    _diagnosticHud = document.createElement('div');
    _diagnosticHud.id = 'vr-diag';
    _diagnosticHud.style.cssText = [
      'position:fixed',
      'top:60px',
      'right:20px',
      'background:rgba(0,20,0,0.88)',
      'border:1px solid #4caf50',
      'border-radius:6px',
      'padding:12px 18px',
      'color:#4caf50',
      'font-family:monospace',
      'font-size:13px',
      'display:none',
      'z-index:9998'
    ].join(';');
    document.body.appendChild(_diagnosticHud);
  }

  function _showHUD(html) {
    _hud.innerHTML = html;
    _hud.style.display = 'block';
  }

  function _hideHUD() {
    _hud.style.display = 'none';
  }

  function _showDiagnostic(vehicle) {
    var sys = vehicle.systems;
    var html = '<b>-- VEHICLE DIAGNOSTIC --</b><br>';
    html += 'ENGINE : ' + _bar(sys.engine) + ' ' + sys.engine + '%<br>';
    html += 'TRACKS : ' + _bar(sys.tracks) + ' ' + sys.tracks + '%<br>';
    html += 'TURRET : ' + _bar(sys.turret) + ' ' + sys.turret + '%<br>';
    html += 'RADIO  : ' + _bar(sys.radio)  + ' ' + sys.radio  + '%<br>';
    html += '<span style="color:#aaa;font-size:11px">Press V to close</span>';
    _diagnosticHud.innerHTML = html;
    _diagnosticHud.style.display = 'block';
  }

  function _bar(pct) {
    var filled = Math.round(pct / 10);
    var empty = 10 - filled;
    var color = pct > 60 ? '#4caf50' : pct > 30 ? '#ff9800' : '#f44336';
    return '<span style="color:' + color + '">' +
      '█'.repeat(filled) + '░'.repeat(empty) + '</span>';
  }

  function _hideDiagnostic() {
    _diagnosticHud.style.display = 'none';
  }

  // ── Vehicle Registry ───────────────────────────────────────────────────────
  function repairVehicle(vehicleMesh) {
    var v = {
      mesh: vehicleMesh,
      hp: vehicleMesh.userData.hp !== undefined ? vehicleMesh.userData.hp : 30,
      maxHp: vehicleMesh.userData.maxHp || 100,
      systems: {
        engine: vehicleMesh.userData.engineDmg !== undefined ? vehicleMesh.userData.engineDmg : 20,
        tracks: vehicleMesh.userData.tracksDmg !== undefined ? vehicleMesh.userData.tracksDmg : 45,
        turret: vehicleMesh.userData.turretDmg !== undefined ? vehicleMesh.userData.turretDmg : 70,
        radio:  vehicleMesh.userData.radioDmg  !== undefined ? vehicleMesh.userData.radioDmg  : 55
      },
      smoke: null,
      sound: null,
      stuck: vehicleMesh.userData.stuck || false,
      tasksCompleted: 0
    };
    _addSmoke(v);
    _vehicles.push(v);
    return v;
  }

  function _addSmoke(v) {
    // Particle-like smoke: a cluster of semi-transparent spheres that drift up
    var smokeGroup = new THREE.Group();
    var i;
    for (i = 0; i < 6; i++) {
      var sg = new THREE.SphereGeometry(0.18 + Math.random() * 0.14, 6, 6);
      var sm = new THREE.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.45 });
      var sp = new THREE.Mesh(sg, sm);
      sp.position.set((Math.random() - 0.5) * 0.5, 1.4 + i * 0.22, (Math.random() - 0.5) * 0.5);
      sp.userData.driftY = 0.3 + Math.random() * 0.2;
      sp.userData.life = Math.random();
      smokeGroup.add(sp);
    }
    v.mesh.add(smokeGroup);
    v.smoke = smokeGroup;
  }

  function _stopSmoke(v) {
    if (v.smoke) {
      v.mesh.remove(v.smoke);
      v.smoke = null;
    }
  }

  // ── Repair Truck ───────────────────────────────────────────────────────────
  function callRepairTruck(pos) {
    if (_repairTruck) return; // already exists

    var truckGroup = new THREE.Group();

    // Body
    var bodyGeo = new THREE.BoxGeometry(3, 1.2, 6);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.8;
    truckGroup.add(body);

    // Cab
    var cabGeo = new THREE.BoxGeometry(2.6, 1, 2);
    var cabMat = new THREE.MeshLambertMaterial({ color: 0x388e3c });
    var cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(0, 1.9, 2);
    truckGroup.add(cab);

    // Wheels
    var wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.35, 10);
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var wheelPositions = [
      [-1.55, 0.4, 2], [1.55, 0.4, 2],
      [-1.55, 0.4, 0], [1.55, 0.4, 0],
      [-1.55, 0.4, -2], [1.55, 0.4, -2]
    ];
    var wi;
    for (wi = 0; wi < wheelPositions.length; wi++) {
      var wm = new THREE.Mesh(wheelGeo, wheelMat);
      wm.rotation.z = Math.PI / 2;
      wm.position.set(wheelPositions[wi][0], wheelPositions[wi][1], wheelPositions[wi][2]);
      truckGroup.add(wm);
    }

    // Crane base
    var craneBase = new THREE.Group();
    var cBaseGeo = new THREE.BoxGeometry(0.6, 0.4, 0.6);
    var craneMat = new THREE.MeshLambertMaterial({ color: 0xf9a825 });
    var cBase = new THREE.Mesh(cBaseGeo, craneMat);
    craneBase.add(cBase);

    // Crane arm
    var craneArm = new THREE.Group();
    var armGeo = new THREE.BoxGeometry(0.2, 0.2, 2.5);
    var arm = new THREE.Mesh(armGeo, craneMat);
    arm.position.z = -1.25;
    craneArm.add(arm);
    craneArm.position.y = 0.3;
    craneBase.add(craneArm);

    // Hook
    var hookGeo = new THREE.SphereGeometry(0.12, 8, 8);
    var hookMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var hookMesh = new THREE.Mesh(hookGeo, hookMat);
    hookMesh.position.set(0, -0.3, -2.5);
    craneArm.add(hookMesh);

    craneBase.position.set(0, 1.85, -1.5);
    truckGroup.add(craneBase);

    // Tool chest
    var chestGeo = new THREE.BoxGeometry(0.8, 0.5, 0.6);
    var chestMat = new THREE.MeshLambertMaterial({ color: 0xd84315 });
    var chest = new THREE.Mesh(chestGeo, chestMat);
    chest.position.set(0.8, 1.55, -1.8);
    truckGroup.add(chest);

    // Spawn at world edge
    var spawnPos = pos ? pos.clone() : new THREE.Vector3(50, 0, 50);
    truckGroup.position.copy(spawnPos);

    _scene.add(truckGroup);

    _repairTruck = {
      mesh: truckGroup,
      crane: craneBase,
      craneArm: craneArm,
      hook: hookMesh,
      chest: chest,
      targetVehicle: null,
      state: 'idle',  // idle | driving | craning | done
      winchLine: null,
      cranePhase: 0,  // 0=extend 1=descend 2=lift 3=reposition 4=lower
      craneTimer: 0,
      driveTimer: 0,
      medic: null
    };

    // Medic NPC placeholder (spawns next to truck)
    var medicGeo = new THREE.CapsuleGeometry(0.22, 0.9, 4, 8);
    var medicMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    var medicMesh = new THREE.Mesh(medicGeo, medicMat);
    medicMesh.position.copy(spawnPos);
    medicMesh.position.x += 2;
    medicMesh.visible = false;
    _scene.add(medicMesh);
    _medicNPC = { mesh: medicMesh, active: false, timer: 0 };
  }

  // ── Minigame ───────────────────────────────────────────────────────────────
  var _mg = null; // minigame state

  function _startMinigame(vehicle) {
    _mg = {
      vehicle: vehicle,
      task: 0,         // 0-4
      phase: 'intro',  // intro | active | done
      timer: 0,
      // Task 1 - tighten bolts
      ePresses: 0,
      // Task 2 - weld joint
      fHeldTime: 0,
      fDown: false,
      // Task 3 - reconnect wires
      arrowIndex: 0,
      arrowSeq: _generateArrowSeq(),
      // Task 4 - pump fuel
      indicatorPos: 0,
      indicatorDir: 1,
      lmbHits: 0,
      // Task 5 - start engine
      gaugePos: 0,
      gaugeDir: 1,
      gaugeSpeed: 0.6 + Math.random() * 0.4,
      greenStart: 0.35,
      greenEnd: 0.65,
      taskDone: false,
      score: 0
    };
    _repairState = _mg;
    _showMinigameHUD();
  }

  function _generateArrowSeq() {
    var seq = [];
    var opts = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    var i;
    for (i = 0; i < 4; i++) {
      seq.push(opts[Math.floor(Math.random() * opts.length)]);
    }
    return seq;
  }

  function _arrowSymbol(key) {
    if (key === 'ArrowLeft')  return '←';
    if (key === 'ArrowRight') return '→';
    if (key === 'ArrowUp')    return '↑';
    if (key === 'ArrowDown')  return '↓';
    return '?';
  }

  function _showMinigameHUD() {
    if (!_mg) return;
    var t = _mg.task;
    var progress = Math.round((_mg.vehicle.tasksCompleted / 5) * 100);
    var filled = Math.round(progress / 5);
    var bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
    var html = '<div style="margin-bottom:8px"><b>FIELD REPAIR</b>';
    html += ' &nbsp; Score: <span style="color:#4caf50">' + _score + '</span></div>';
    html += '<div style="margin-bottom:6px">Progress: [<span style="color:#4caf50">' + bar + '</span>] ' + progress + '%</div>';

    if (t === 0) {
      html += '<div style="font-size:18px;margin:8px 0">TIGHTEN BOLTS</div>';
      html += '<div>Press <b>E</b> rapidly  <span style="color:#4caf50">' + _mg.ePresses + '/5</span></div>';
    } else if (t === 1) {
      var weldPct = Math.round((_mg.fHeldTime / 2) * 100);
      html += '<div style="font-size:18px;margin:8px 0">WELD JOINT</div>';
      html += '<div>Hold <b>F</b> for 2s  <span style="color:#ff9800">' + weldPct + '%</span></div>';
      html += '<div style="background:#333;height:10px;width:200px;margin-top:6px"><div style="background:#ff9800;height:10px;width:' + Math.min(weldPct * 2, 200) + 'px"></div></div>';
    } else if (t === 2) {
      html += '<div style="font-size:18px;margin:8px 0">RECONNECT WIRES</div>';
      html += '<div>Sequence: ';
      var ai;
      for (ai = 0; ai < _mg.arrowSeq.length; ai++) {
        var col = ai < _mg.arrowIndex ? '#4caf50' : ai === _mg.arrowIndex ? '#fff' : '#555';
        html += '<span style="color:' + col + ';font-size:20px">' + _arrowSymbol(_mg.arrowSeq[ai]) + '</span> ';
      }
      html += '</div>';
    } else if (t === 3) {
      html += '<div style="font-size:18px;margin:8px 0">PUMP FUEL</div>';
      html += '<div>Click when bar is in <b style="color:#4caf50">green zone</b>  Hits: ' + _mg.lmbHits + '/3</div>';
      var iPos = Math.round(_mg.indicatorPos * 180);
      html += '<div style="position:relative;background:#333;height:16px;width:200px;margin-top:6px;border-radius:3px">';
      html += '<div style="position:absolute;background:#4caf50;height:16px;left:70px;width:60px;border-radius:3px"></div>';
      html += '<div style="position:absolute;background:#fff;height:16px;width:6px;left:' + iPos + 'px;top:0;border-radius:2px"></div>';
      html += '</div>';
    } else if (t === 4) {
      html += '<div style="font-size:18px;margin:8px 0">START ENGINE</div>';
      html += '<div>Press <b>Space</b> when needle is in <b style="color:#4caf50">green zone</b></div>';
      var gPos = Math.round(_mg.gaugePos * 180);
      html += '<div style="position:relative;background:#333;height:16px;width:200px;margin-top:6px;border-radius:3px">';
      html += '<div style="position:absolute;background:#4caf50;height:16px;left:63px;width:54px;border-radius:3px"></div>';
      html += '<div style="position:absolute;background:#ffeb3b;height:16px;width:6px;left:' + gPos + 'px;top:0;border-radius:2px"></div>';
      html += '</div>';
    }

    html += '<div style="color:#888;font-size:11px;margin-top:10px">Press Esc to cancel</div>';
    _showHUD(html);
  }

  function _advanceTask() {
    _mg.vehicle.tasksCompleted++;
    _score += 25;
    _mg.taskDone = false;

    // Apply partial / full heal
    if (_mg.vehicle.tasksCompleted >= 5) {
      // Full repair
      _mg.vehicle.hp = _mg.vehicle.maxHp;
      _mg.vehicle.systems.engine = 100;
      _mg.vehicle.systems.tracks = 100;
      _mg.vehicle.systems.turret = 100;
      _mg.vehicle.systems.radio  = 100;
      _stopSmoke(_mg.vehicle);
      _score += 200;
      _showHUD('<div style="font-size:20px;color:#4caf50">VEHICLE FULLY REPAIRED</div><div>Score +200 | Total: ' + _score + '</div>');
      setTimeout(_hideHUD, 2500);
      _repairState = null;
      _mg = null;
      return;
    }

    if (_mg.vehicle.tasksCompleted >= 1 && _mg.vehicle.tasksCompleted <= 3) {
      _mg.vehicle.hp = Math.max(_mg.vehicle.hp, Math.round(_mg.vehicle.maxHp * 0.4));
    }

    _mg.task = _mg.vehicle.tasksCompleted;
    // Reset per-task state
    _mg.ePresses   = 0;
    _mg.fHeldTime  = 0;
    _mg.fDown      = false;
    _mg.arrowIndex = 0;
    _mg.arrowSeq   = _generateArrowSeq();
    _mg.lmbHits    = 0;
    _mg.indicatorPos = 0;
    _mg.indicatorDir = 1;
    _mg.gaugePos   = 0;
    _mg.gaugeDir   = 1;
    _mg.gaugeSpeed = 0.55 + Math.random() * 0.5;
    _showMinigameHUD();
  }

  // ── Input Handlers ─────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    _keys[e.code] = true;

    // Diagnostic toggle
    if (e.code === 'KeyV') {
      var nearV = _nearestVehicle(3.5);
      if (nearV) {
        if (_diagnosticHud.style.display === 'none') {
          _showDiagnostic(nearV);
        } else {
          _hideDiagnostic();
        }
      }
      return;
    }

    // Start repair
    if (e.code === 'KeyR') {
      if (!_repairState) {
        // Winch: W+R from repair truck
        if (_keys['KeyW'] && _repairTruck && _winchTarget) {
          _attachWinch();
          return;
        }
        var nearV2 = _nearestVehicle(3);
        if (nearV2) {
          _startMinigame(nearV2);
        }
      }
    }

    // Q held tracking for call-truck gesture Q+E
    if (e.code === 'KeyQ') _qHeld = true;

    // Minigame input
    if (_mg) {
      if (_mg.task === 0 && e.code === 'KeyE') {
        _mg.ePresses++;
        if (_mg.ePresses >= 5) _advanceTask();
        else _showMinigameHUD();
      }
      if (_mg.task === 1 && e.code === 'KeyF') {
        _mg.fDown = true;
      }
      if (_mg.task === 2) {
        if (e.code === _mg.arrowSeq[_mg.arrowIndex]) {
          _mg.arrowIndex++;
          if (_mg.arrowIndex >= 4) _advanceTask();
          else _showMinigameHUD();
        } else if (e.code.startsWith('Arrow')) {
          // Wrong key -- reset
          _mg.arrowIndex = 0;
          _showMinigameHUD();
        }
      }
      if (_mg.task === 4 && e.code === 'Space') {
        if (_mg.gaugePos >= _mg.greenStart && _mg.gaugePos <= _mg.greenEnd) {
          _advanceTask();
        } else {
          // Miss -- flash red
          _showHUD('<div style="color:#f44336;font-size:18px">MISS! Try again</div>');
          setTimeout(_showMinigameHUD.bind(null), 600);
        }
      }
      if (e.code === 'Escape') {
        _repairState = null;
        _mg = null;
        _hideHUD();
      }
    }

    // Tool chest interaction
    if (e.code === 'KeyE' && !_mg) {
      var nearChest = _nearToolChest(2.5);
      if (nearChest && _repairState) {
        // spare part: auto-complete current task
        _advanceTask();
      }
    }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
    if (e.code === 'KeyQ') _qHeld = false;
    if (_mg && _mg.task === 1 && e.code === 'KeyF') {
      _mg.fDown = false;
    }
  }

  function _onMouseDown(e) {
    if (e.button === 0) {
      _mousePressed = true;
      if (_mg && _mg.task === 3) {
        var normalized = _mg.indicatorPos; // 0-1
        var greenL = 70 / 200;  // green zone start fraction
        var greenR = 130 / 200; // green zone end fraction
        if (normalized >= greenL && normalized <= greenR) {
          _mg.lmbHits++;
          if (_mg.lmbHits >= 3) _advanceTask();
          else _showMinigameHUD();
        } else {
          _showHUD('<div style="color:#f44336;font-size:18px">MISS! Try again</div>');
          setTimeout(_showMinigameHUD.bind(null), 600);
        }
      }
    }
  }

  function _onMouseUp(e) {
    if (e.button === 0) _mousePressed = false;
  }

  // ── Proximity Helpers ──────────────────────────────────────────────────────
  function _nearestVehicle(range) {
    if (!_camera) return null;
    var camPos = _camera.position;
    var nearest = null;
    var nearDist = Infinity;
    var i;
    for (i = 0; i < _vehicles.length; i++) {
      var d = camPos.distanceTo(_vehicles[i].mesh.position);
      if (d < range && d < nearDist) {
        nearDist = d;
        nearest = _vehicles[i];
      }
    }
    return nearest;
  }

  function _nearToolChest(range) {
    if (!_repairTruck || !_camera) return false;
    var chestWorld = new THREE.Vector3();
    _repairTruck.chest.getWorldPosition(chestWorld);
    return _camera.position.distanceTo(chestWorld) < range;
  }

  function _nearRepairTruck(range) {
    if (!_repairTruck || !_camera) return false;
    return _camera.position.distanceTo(_repairTruck.mesh.position) < range;
  }

  // ── Winch ──────────────────────────────────────────────────────────────────
  function _attachWinch() {
    if (!_repairTruck || !_winchTarget) return;
    _winchActive = true;
    var lineMat = new THREE.LineBasicMaterial({ color: 0xffcc00 });
    var points = [
      _repairTruck.mesh.position.clone(),
      _winchTarget.mesh.position.clone()
    ];
    var lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    var winchLine = new THREE.Line(lineGeo, lineMat);
    _scene.add(winchLine);
    _repairTruck.winchLine = winchLine;
  }

  function _updateWinch(delta) {
    if (!_winchActive || !_winchTarget || !_repairTruck) return;
    var tv = _winchTarget.mesh;
    var rt = _repairTruck.mesh;
    var dir = new THREE.Vector3().subVectors(rt.position, tv.position).normalize();
    var dist = tv.position.distanceTo(rt.position);
    if (dist > 4) {
      tv.position.addScaledVector(dir, delta * 3);
      // Update winch line geometry
      if (_repairTruck.winchLine) {
        var pts = [rt.position.clone(), tv.position.clone()];
        _repairTruck.winchLine.geometry.setFromPoints(pts);
      }
    } else {
      _winchActive = false;
      _winchTarget.stuck = false;
      if (_repairTruck.winchLine) {
        _scene.remove(_repairTruck.winchLine);
        _repairTruck.winchLine = null;
      }
    }
  }

  // ── Repair Truck AI ────────────────────────────────────────────────────────
  function _updateRepairTruck(delta) {
    if (!_repairTruck) return;
    var rt = _repairTruck;

    if (rt.state === 'driving' && rt.targetVehicle) {
      var target = rt.targetVehicle.mesh.position;
      var pos    = rt.mesh.position;
      var dir    = new THREE.Vector3().subVectors(target, pos);
      var dist   = dir.length();
      if (dist > 5) {
        dir.normalize();
        rt.mesh.position.addScaledVector(dir, delta * 8);
        rt.mesh.lookAt(target.x, rt.mesh.position.y, target.z);
      } else {
        rt.state = 'craning';
        rt.cranePhase = 0;
        rt.craneTimer = 0;
      }
    } else if (rt.state === 'craning') {
      _updateCrane(delta, rt);
    }

    // CASEVAC
    if (_playerHp < 20 && _nearRepairTruck(5) && _medicNPC && !_medicNPC.active) {
      _medicNPC.active = true;
      _medicNPC.mesh.visible = true;
      _medicNPC.mesh.position.copy(rt.mesh.position);
      _medicNPC.mesh.position.x += 2;
      _medicNPC.timer = 0;
    }

    if (_medicNPC && _medicNPC.active) {
      _medicNPC.timer += delta;
      // Medic walks toward camera
      if (_camera && _medicNPC.timer < 3) {
        var camDir = new THREE.Vector3().subVectors(_camera.position, _medicNPC.mesh.position);
        camDir.y = 0;
        var mDist = camDir.length();
        if (mDist > 1.2) {
          camDir.normalize();
          _medicNPC.mesh.position.addScaledVector(camDir, delta * 2.5);
        } else if (_medicNPC.timer > 1) {
          // Apply field dressing
          _playerHp = Math.min((_playerHp + 50), 100);
          _showHUD('<div style="color:#4caf50;font-size:16px">Medic applied field dressing! HP +50</div>');
          setTimeout(_hideHUD, 2000);
          _medicNPC.active = false;
          _medicNPC.mesh.visible = false;
        }
      }
    }
  }

  function _updateCrane(delta, rt) {
    rt.craneTimer += delta;

    if (rt.cranePhase === 0) {
      // Extend arm
      if (rt.craneTimer < 1.5) {
        rt.craneArm.scale.z = 1 + rt.craneTimer / 1.5;
      } else {
        rt.craneArm.scale.z = 2;
        rt.cranePhase = 1;
        rt.craneTimer = 0;
      }
    } else if (rt.cranePhase === 1) {
      // Descend hook
      if (rt.craneTimer < 1.5) {
        rt.hook.position.y = -0.3 - rt.craneTimer * 1.2;
      } else {
        rt.hook.position.y = -2.1;
        rt.cranePhase = 2;
        rt.craneTimer = 0;
      }
    } else if (rt.cranePhase === 2) {
      // Lift vehicle
      if (rt.targetVehicle && rt.craneTimer < 2) {
        rt.targetVehicle.mesh.position.y = rt.craneTimer;
      } else if (rt.targetVehicle) {
        rt.targetVehicle.mesh.position.y = 2;
        rt.cranePhase = 3;
        rt.craneTimer = 0;
      }
    } else if (rt.cranePhase === 3) {
      // Reposition (move 2 units to the side)
      if (rt.targetVehicle && rt.craneTimer < 1.5) {
        rt.targetVehicle.mesh.position.x += delta * (10 / 1.5);
      } else {
        rt.cranePhase = 4;
        rt.craneTimer = 0;
      }
    } else if (rt.cranePhase === 4) {
      // Lower
      if (rt.targetVehicle && rt.craneTimer < 1.5) {
        rt.targetVehicle.mesh.position.y = 2 - rt.craneTimer * (2 / 1.5);
      } else {
        if (rt.targetVehicle) rt.targetVehicle.mesh.position.y = 0;
        rt.craneArm.scale.z = 1;
        rt.hook.position.y = -0.3;
        rt.state = 'done';
      }
    }
  }

  // ── Smoke Update ───────────────────────────────────────────────────────────
  function _updateSmoke(delta) {
    var i, j, sp;
    for (i = 0; i < _vehicles.length; i++) {
      var v = _vehicles[i];
      if (!v.smoke) continue;
      for (j = 0; j < v.smoke.children.length; j++) {
        sp = v.smoke.children[j];
        sp.userData.life += delta * 0.5;
        sp.position.y += delta * sp.userData.driftY;
        sp.material.opacity = 0.45 * (1 - sp.userData.life % 1);
        if (sp.userData.life % 1 > 0.95) {
          sp.position.y = 1.4;
          sp.userData.life = Math.random() * 0.3;
        }
      }
    }
  }

  // ── Q+E Call-truck gesture ─────────────────────────────────────────────────
  function _updateCallTruck(delta) {
    if (_keys['KeyQ'] && _keys['KeyE']) {
      _callTruckTimer += delta;
      if (_callTruckTimer > 1.5 && !_repairTruck) {
        var nearV = _nearestVehicle(30);
        var spawnPos = new THREE.Vector3(50, 0, 50);
        callRepairTruck(spawnPos);
        if (nearV && _repairTruck) {
          _repairTruck.targetVehicle = nearV;
          _repairTruck.state = 'driving';
          _winchTarget = nearV;
        }
        _callTruckTimer = 0;
        _showHUD('<div style="color:#4caf50">Repair truck dispatched!</div>');
        setTimeout(_hideHUD, 2000);
      }
    } else {
      _callTruckTimer = 0;
    }
  }

  // ── Minigame Update ────────────────────────────────────────────────────────
  function _updateMinigame(delta) {
    if (!_mg) return;

    if (_mg.task === 1) {
      if (_mg.fDown) {
        _mg.fHeldTime += delta;
        if (_mg.fHeldTime >= 2) {
          _advanceTask();
          return;
        }
      }
      _showMinigameHUD();
    }

    if (_mg.task === 3) {
      _mg.indicatorPos += delta * _mg.indicatorDir * 0.8;
      if (_mg.indicatorPos >= 1) { _mg.indicatorPos = 1; _mg.indicatorDir = -1; }
      if (_mg.indicatorPos <= 0) { _mg.indicatorPos = 0; _mg.indicatorDir =  1; }
      _showMinigameHUD();
    }

    if (_mg.task === 4) {
      _mg.gaugePos += delta * _mg.gaugeDir * _mg.gaugeSpeed;
      if (_mg.gaugePos >= 1) { _mg.gaugePos = 1; _mg.gaugeDir = -1; }
      if (_mg.gaugePos <= 0) { _mg.gaugePos = 0; _mg.gaugeDir =  1; }
      _showMinigameHUD();
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
    _createHUD();
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);
    window.addEventListener('mousedown', _onMouseDown);
    window.addEventListener('mouseup',   _onMouseUp);
  }

  function update(delta) {
    _updateMinigame(delta);
    _updateRepairTruck(delta);
    _updateSmoke(delta);
    _updateWinch(delta);
    _updateCallTruck(delta);
  }

  function reset() {
    _vehicles = [];
    _repairState = null;
    _mg = null;
    _winchActive = false;
    _winchTarget = null;
    _score = 0;
    _playerHp = 100;
    _callTruckTimer = 0;
    _keys = {};
    _mousePressed = false;
    _qHeld = false;
    _eHeld = false;

    if (_repairTruck) {
      _scene.remove(_repairTruck.mesh);
      if (_repairTruck.winchLine) _scene.remove(_repairTruck.winchLine);
      _repairTruck = null;
    }
    if (_medicNPC) {
      _scene.remove(_medicNPC.mesh);
      _medicNPC = null;
    }
    _hideHUD();
    _hideDiagnostic();
  }

  return {
    init: init,
    update: update,
    reset: reset,
    repairVehicle: repairVehicle,
    callRepairTruck: callRepairTruck
  };

})();
