window.RebelUprising = (function () {
  'use strict';

  // ── state ────────────────────────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;
  var _active = false;

  // activation key tracking
  var _keyR = false;
  var _keyU = false;
  var _rTime = 0;
  var _uTime = 0;
  var ACTIVATE_WINDOW = 400; // ms

  // regime morale 0-100
  var _regimeMorale = 80;

  // city structures
  var _buildings = [];
  var _checkpoints = []; // {mesh, alive, pos}
  var _billboards = []; // {mesh, hacked, hackTimer, hackProgress, light}
  var _palace = null;
  var _palaceGates = [];
  var _palaceGatesOpen = false;
  var _radioTower = null;
  var _radioDestroyed = false;
  var _dictator = null;
  var _dictatorCaptured = false;

  // rebel squad
  var _rebels = []; // {mesh, specialty, alive, selected, order, hp, maxHp}
  var _selectedRebel = -1; // 0-3

  // regime forces
  var _soldiers = [];
  var _vehicles = []; // armored
  var _helicopter = null;
  var _airstrikeTimer = 0;
  var _airstrikeWarned = false;
  var _eliteGuards = [];

  // civilians
  var _civilians = [];
  var _civilianSupport = 0; // 0-100

  // HUD
  var _hud = null;
  var _toast = null;

  // hackable billboard state
  var _hackingBillboard = null;
  var _hackTimer = 0;

  // palace assault state
  var _palaceAssaultActive = false;
  var _eliteSpawned = false;

  // patrol timers
  var _vehicleSpawnDone = false;
  var _heliSpawnDone = false;

  // update accumulator
  var _t = 0;

  // ── helpers ──────────────────────────────────────────────────────────────────
  function _pos() {
    return _camera ? _camera.position : new THREE.Vector3();
  }

  function _dist(a, b) {
    return a.distanceTo(b);
  }

  function _randRange(lo, hi) {
    return lo + Math.random() * (hi - lo);
  }

  function _showToast(txt, col) {
    if (!_toast) return;
    _toast.textContent = txt;
    _toast.style.color = col || '#fff';
    _toast.style.opacity = '1';
    clearTimeout(_toast._hide);
    _toast._hide = setTimeout(function () { _toast.style.opacity = '0'; }, 2500);
  }

  function _clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function _boxMesh(w, h, d, color) {
    return new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshLambertMaterial({ color: color })
    );
  }

  // ── city construction ─────────────────────────────────────────────────────────
  function _buildCity() {
    // Capital city center — scattered buildings in a rough grid
    var buildingColors = [0x554433, 0x665544, 0x443322];
    var bPositions = [
      [-20, 0, -20], [-10, 0, -20], [10, 0, -20], [20, 0, -20],
      [-20, 0, -10], [20, 0, -10],
      [-20, 0, 10],  [20, 0, 10],
      [-15, 0, 0],   [15, 0, 0],
      [-22, 0, 5],   [22, 0, 5],
      [-8, 0, -15],  [8, 0, -15],
      [-8, 0, 15],   [8, 0, 15]
    ];
    for (var i = 0; i < bPositions.length; i++) {
      var bw = _randRange(3, 7);
      var bh = _randRange(5, 14);
      var bd = _randRange(3, 7);
      var col = buildingColors[i % buildingColors.length];
      var bm = _boxMesh(bw, bh, bd, col);
      bm.position.set(bPositions[i][0], bh / 2, bPositions[i][2]);
      _scene.add(bm);
      _buildings.push({ mesh: bm, hp: 60 + Math.floor(Math.random() * 40) });
    }

    // Regime checkpoints — 4x3x2, at 4 intersections
    var cpPositions = [[-12, 0, -12], [12, 0, -12], [-12, 0, 12], [12, 0, 12]];
    for (var ci = 0; ci < 4; ci++) {
      var cpGroup = new THREE.Group();
      var cpBase = _boxMesh(4, 3, 2, 0x334433);
      cpBase.position.y = 1.5;
      cpGroup.add(cpBase);
      // barrier pole
      var pole = _boxMesh(0.2, 2, 0.2, 0x223322);
      pole.position.set(2, 2.5, 0);
      cpGroup.add(pole);
      cpGroup.position.set(cpPositions[ci][0], 0, cpPositions[ci][2]);
      _scene.add(cpGroup);
      _checkpoints.push({ mesh: cpGroup, alive: true, pos: new THREE.Vector3(cpPositions[ci][0], 0, cpPositions[ci][2]) });
    }

    // Propaganda billboards — 6 around city with PointLight
    var bbPositions = [
      [-25, 0, 0], [25, 0, 0],
      [0, 0, -25], [0, 0, 25],
      [-18, 0, 18], [18, 0, -18]
    ];
    for (var bi = 0; bi < 6; bi++) {
      var bbGroup = new THREE.Group();
      var pole2 = _boxMesh(0.3, 6, 0.3, 0x553322);
      pole2.position.y = 3;
      bbGroup.add(pole2);
      var board = _boxMesh(5, 3, 0.3, 0x553322);
      board.position.y = 6.5;
      bbGroup.add(board);
      var light = new THREE.PointLight(0xFFAA00, 1.0, 12);
      light.position.y = 7.5;
      bbGroup.add(light);
      bbGroup.position.set(bbPositions[bi][0], 0, bbPositions[bi][2]);
      _scene.add(bbGroup);
      _billboards.push({ mesh: bbGroup, hacked: false, hackTimer: 0, light: light });
    }

    // Dictator palace — 20x12x15 at north
    var palaceGroup = new THREE.Group();
    var palaceBody = _boxMesh(20, 12, 15, 0x445533);
    palaceBody.position.y = 6;
    palaceGroup.add(palaceBody);
    // Gate left/right pillars
    var gateL = _boxMesh(1, 5, 1, 0x334422);
    gateL.position.set(-5, 2.5, 7.8);
    palaceGroup.add(gateL);
    var gateR = _boxMesh(1, 5, 1, 0x334422);
    gateR.position.set(5, 2.5, 7.8);
    palaceGroup.add(gateR);
    // Gate barrier (closed)
    var gateMesh = _boxMesh(10, 4, 0.4, 0x334433);
    gateMesh.position.set(0, 2, 7.8);
    palaceGroup.add(gateMesh);
    _palaceGates.push(gateMesh);
    palaceGroup.position.set(0, 0, -45);
    _scene.add(palaceGroup);
    _palace = palaceGroup;

    // Dictator office / capture target inside palace
    var dictMesh = _boxMesh(1.5, 1.5, 1.5, 0x220033);
    dictMesh.scale.set(1.5, 1.5, 1.5);
    dictMesh.position.set(0, 2, -45);
    dictMesh._isDictator = true;
    _scene.add(dictMesh);
    _dictator = { mesh: dictMesh, alive: true };

    // Radio tower — CylinderGeometry
    var rtGroup = new THREE.Group();
    var rtBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.8, 12, 8),
      new THREE.MeshLambertMaterial({ color: 0x556644 })
    );
    rtBody.position.y = 6;
    rtGroup.add(rtBody);
    var rtLight = new THREE.PointLight(0xFF2200, 1.0, 10);
    rtLight.position.y = 12;
    rtGroup.add(rtLight);
    rtGroup.position.set(-30, 0, -35);
    _scene.add(rtGroup);
    _radioTower = { mesh: rtGroup, hp: 80, alive: true };
  }

  // ── rebel squad ───────────────────────────────────────────────────────────────
  function _buildRebels() {
    var specialties = ['Sniper', 'Demo', 'Medic', 'Scout'];
    var colors = [0x334422, 0x334422, 0x334422, 0x334422];
    var offsets = [[-2, 0, 2], [2, 0, 2], [-2, 0, 4], [2, 0, 4]];
    for (var i = 0; i < 4; i++) {
      var m = _boxMesh(0.6, 1.8, 0.6, colors[i]);
      var playerPos = _pos();
      m.position.set(playerPos.x + offsets[i][0], playerPos.y, playerPos.z + offsets[i][2]);
      _scene.add(m);
      var scoutLight = null;
      if (specialties[i] === 'Scout') {
        scoutLight = new THREE.PointLight(0x44FF44, 0, 20);
        m.add(scoutLight);
      }
      _rebels.push({
        mesh: m,
        specialty: specialties[i],
        alive: true,
        selected: false,
        order: null,
        orderTarget: null,
        hp: 100,
        maxHp: 100,
        healTimer: 0,
        scoutLight: scoutLight,
        _scoutPulse: 0
      });
    }
  }

  // ── regime soldiers ───────────────────────────────────────────────────────────
  function _spawnSoldier(x, y, z) {
    var m = _boxMesh(0.5, 1.7, 0.5, 0x334433);
    m.position.set(x, y + 0.85, z);
    _scene.add(m);
    _soldiers.push({ mesh: m, alive: true, hp: 40, patrol: true, alertTimer: 0, _dir: Math.random() * Math.PI * 2 });
  }

  function _spawnSoldiersAtCheckpoints() {
    for (var ci = 0; ci < _checkpoints.length; ci++) {
      if (!_checkpoints[ci].alive) continue;
      var cp = _checkpoints[ci].pos;
      for (var s = 0; s < 3; s++) {
        _spawnSoldier(cp.x + _randRange(-3, 3), 0, cp.z + _randRange(-3, 3));
      }
    }
  }

  // ── armored vehicles ──────────────────────────────────────────────────────────
  function _spawnArmoredVehicles() {
    var positions = [[-15, 0, 0], [15, 0, 0], [0, 0, 15]];
    for (var i = 0; i < 3; i++) {
      var vGroup = new THREE.Group();
      var vBody = _boxMesh(4, 2, 2, 0x334433);
      vBody.position.y = 1;
      vGroup.add(vBody);
      var vTurret = _boxMesh(1.5, 0.8, 1.5, 0x223322);
      vTurret.position.set(0, 2.2, 0);
      vGroup.add(vTurret);
      var vGun = _boxMesh(2, 0.3, 0.3, 0x223322);
      vGun.position.set(1.5, 2.4, 0);
      vGroup.add(vGun);
      vGroup.position.set(positions[i][0], 0, positions[i][2]);
      vGroup._dir = Math.random() * Math.PI * 2;
      _scene.add(vGroup);
      _vehicles.push({ mesh: vGroup, hp: 200, alive: true, _timer: 0 });
    }
    _vehicleSpawnDone = true;
    _showToast('REGIME ARMORED VEHICLES DEPLOYED', '#FF4444');
  }

  // ── helicopter gunship ────────────────────────────────────────────────────────
  function _spawnHelicopter() {
    var hGroup = new THREE.Group();
    var hBody = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.0, 2, 8),
      new THREE.MeshLambertMaterial({ color: 0x223322 })
    );
    hBody.position.y = 0;
    hGroup.add(hBody);
    var hTail = _boxMesh(3, 0.4, 0.4, 0x223322);
    hTail.position.set(2.5, 0, 0);
    hGroup.add(hTail);
    var hRotor = _boxMesh(4, 0.15, 0.6, 0x334433);
    hRotor.position.y = 1.2;
    hGroup.add(hRotor);
    var hLight = new THREE.PointLight(0xFF2200, 1.5, 30);
    hLight.position.y = -1;
    hGroup.add(hLight);
    hGroup.position.set(0, 20, -10);
    hGroup._angle = 0;
    hGroup._rotorAngle = 0;
    _scene.add(hGroup);
    _helicopter = { mesh: hGroup, hp: 300, alive: true, light: hLight };
    _heliSpawnDone = true;
    _showToast('REGIME HELICOPTER GUNSHIP INBOUND', '#FF2200');
  }

  // ── palace assault ────────────────────────────────────────────────────────────
  function _openPalaceGates() {
    if (_palaceGatesOpen) return;
    _palaceGatesOpen = true;
    for (var i = 0; i < _palaceGates.length; i++) {
      _scene.remove(_palaceGates[i]);
    }
    _showToast('PALACE GATES BREACHED — STORM THE PALACE!', '#44FF44');
  }

  function _spawnEliteGuards() {
    if (_eliteSpawned) return;
    _eliteSpawned = true;
    for (var i = 0; i < 15; i++) {
      var m = _boxMesh(0.6, 1.9, 0.6, 0x223322);
      m.position.set(
        _randRange(-8, 8),
        0.95,
        -45 + _randRange(-6, 6)
      );
      _scene.add(m);
      _eliteGuards.push({ mesh: m, alive: true, hp: 80, _moveTimer: Math.random() * 2 });
    }
    _showToast('15 ELITE GUARDS DEFENDING THE PALACE!', '#FF4444');
  }

  // ── civilians ─────────────────────────────────────────────────────────────────
  function _addCivilians(count) {
    var positions = [
      [-5, 0, 5], [5, 0, 5], [0, 0, 8], [-8, 0, 3], [8, 0, 3],
      [-3, 0, -8], [3, 0, -8], [6, 0, 8], [-6, 0, 8], [0, 0, 12]
    ];
    for (var i = 0; i < count && i < positions.length; i++) {
      var m = _boxMesh(0.5, 1.6, 0.5, 0xFFDDCC);
      m.position.set(positions[i][0], 0.8, positions[i][2]);
      _scene.add(m);
      _civilians.push({ mesh: m, alive: true, shielding: true });
    }
  }

  // ── surrender flags ───────────────────────────────────────────────────────────
  function _triggerRegimeCollapse() {
    _showToast('REGIME HAS COLLAPSED! SOLDIERS SURRENDERING!', '#44FF44');
    // White flag for each surviving soldier
    for (var i = 0; i < _soldiers.length; i++) {
      var s = _soldiers[i];
      if (!s.alive) continue;
      var flag = _boxMesh(0.8, 0.6, 0.05, 0xFFFFFF);
      flag.position.set(0.4, 1.5, 0);
      s.mesh.add(flag);
      s._surrendered = true;
      s.patrol = false;
    }
  }

  // ── morale management ─────────────────────────────────────────────────────────
  function _dropMorale(amount) {
    _regimeMorale = _clamp(_regimeMorale - amount, 0, 100);
    if (_regimeMorale === 0 && !_palace._collapsed) {
      _palace._collapsed = true;
      _triggerRegimeCollapse();
    }
  }

  // ── billboard hacking ─────────────────────────────────────────────────────────
  function _tryHackBillboard() {
    var playerPos = _pos();
    for (var i = 0; i < _billboards.length; i++) {
      var bb = _billboards[i];
      if (bb.hacked) continue;
      var bbPos = bb.mesh.position;
      if (_dist(playerPos, bbPos) < 6) {
        _hackingBillboard = bb;
        _hackTimer = 0;
        _showToast('HACKING BILLBOARD... (hold E, 8s)', '#44FFAA');
        return;
      }
    }
  }

  function _hackedCount() {
    var n = 0;
    for (var i = 0; i < _billboards.length; i++) if (_billboards[i].hacked) n++;
    return n;
  }

  function _checkpointsAlive() {
    var n = 0;
    for (var i = 0; i < _checkpoints.length; i++) if (_checkpoints[i].alive) n++;
    return n;
  }

  function _rebelsAlive() {
    var n = 0;
    for (var i = 0; i < _rebels.length; i++) if (_rebels[i].alive) n++;
    return n;
  }

  function _civilianSupportLabel() {
    if (_civilianSupport < 33) return 'LOW';
    if (_civilianSupport < 66) return 'MED';
    return 'HIGH';
  }

  // ── HUD ───────────────────────────────────────────────────────────────────────
  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'rebel-uprising-hud';
    _hud.style.cssText = [
      'position:fixed', 'top:10px', 'left:50%', 'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)', 'border:1px solid #446633',
      'border-radius:4px', 'padding:5px 12px',
      'color:#88ff88', 'font-family:monospace', 'font-size:12px',
      'pointer-events:none', 'z-index:9000', 'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hud);

    _toast = document.createElement('div');
    _toast.id = 'rebel-uprising-toast';
    _toast.style.cssText = [
      'position:fixed', 'top:38%', 'left:50%', 'transform:translate(-50%,-50%)',
      'font-family:monospace', 'font-size:15px', 'font-weight:bold',
      'text-shadow:0 0 8px currentColor', 'pointer-events:none',
      'z-index:9001', 'opacity:0', 'transition:opacity 0.5s'
    ].join(';');
    document.body.appendChild(_toast);
  }

  function _updateHUD() {
    if (!_hud) return;
    var morale = Math.round(_regimeMorale);
    var rebels = _rebelsAlive();
    var hacked = _hackedCount();
    var cps = _checkpointsAlive();
    var support = _civilianSupportLabel();
    var sel = _selectedRebel >= 0 && _rebels[_selectedRebel]
      ? ' [SEL:' + _rebels[_selectedRebel].specialty + ']' : '';
    _hud.textContent =
      'UPRISING [REGIME MORALE: ' + morale + '%] [REBELS: ' + rebels + '/4]' +
      ' [BILLBOARDS: ' + hacked + '/6] [CHECKPOINTS: ' + cps + '/4]' +
      ' | CIVILIAN SUPPORT: ' + support + sel;
  }

  // ── rebel AI ──────────────────────────────────────────────────────────────────
  function _updateRebels(dt) {
    var playerPos = _pos();
    var time = Date.now() * 0.001;
    for (var i = 0; i < _rebels.length; i++) {
      var r = _rebels[i];
      if (!r.alive) continue;

      // Medic heals player (tracked via window._playerHp)
      if (r.specialty === 'Medic') {
        r.healTimer -= dt;
        if (r.healTimer <= 0) {
          r.healTimer = 1.0;
          if (r.mesh.position.distanceTo(playerPos) < 6) {
            if (window._playerHp !== undefined) {
              window._playerHp = Math.min((window._playerMaxHp || 100), window._playerHp + 5);
            }
          }
        }
      }

      // Scout pulses PointLight
      if (r.specialty === 'Scout' && r.scoutLight) {
        r._scoutPulse += dt * 2;
        r.scoutLight.intensity = 0.5 + 0.5 * Math.sin(r._scoutPulse);
        // highlight nearby enemies
        for (var s = 0; s < _soldiers.length; s++) {
          var sol = _soldiers[s];
          if (!sol.alive || !sol.mesh) continue;
          if (r.mesh.position.distanceTo(sol.mesh.position) < 20) {
            sol._highlighted = true;
          }
        }
      }

      // Follow player if no order
      if (!r.order || r.order === 'hold') {
        if (r.order !== 'hold') {
          var offset = new THREE.Vector3(
            (i % 2 === 0 ? -1 : 1) * (1.5 + Math.floor(i / 2)),
            0,
            2 + Math.floor(i / 2) * 1.5
          );
          var target = playerPos.clone().add(offset);
          var diff = target.clone().sub(r.mesh.position);
          if (diff.length() > 0.5) {
            diff.normalize().multiplyScalar(4 * dt);
            r.mesh.position.add(diff);
          }
        }
        // Sniper fires at soldiers within range
        if (r.specialty === 'Sniper') {
          for (var si2 = 0; si2 < _soldiers.length; si2++) {
            var sol2 = _soldiers[si2];
            if (!sol2.alive) continue;
            if (r.mesh.position.distanceTo(sol2.mesh.position) < 30) {
              sol2.hp -= 15 * dt;
              if (sol2.hp <= 0) {
                sol2.alive = false;
                _scene.remove(sol2.mesh);
                _dropMorale(3);
              }
              break;
            }
          }
        }
        continue;
      }

      // Execute order
      if (r.order === 'attack' && r.orderTarget) {
        var tpos = r.orderTarget;
        var toTarget = tpos.clone().sub(r.mesh.position);
        if (toTarget.length() > 2) {
          toTarget.normalize().multiplyScalar(4 * dt);
          r.mesh.position.add(toTarget);
        } else {
          // attack nearby soldiers / checkpoint
          for (var sk = 0; sk < _soldiers.length; sk++) {
            var solK = _soldiers[sk];
            if (!solK.alive) continue;
            if (r.mesh.position.distanceTo(solK.mesh.position) < 5) {
              solK.hp -= 30 * dt;
              if (solK.hp <= 0) {
                solK.alive = false;
                _scene.remove(solK.mesh);
                _dropMorale(3);
              }
            }
          }
          // destroy nearby checkpoint
          for (var ck = 0; ck < _checkpoints.length; ck++) {
            var cp = _checkpoints[ck];
            if (!cp.alive) continue;
            if (r.mesh.position.distanceTo(cp.pos) < 6) {
              cp.alive = false;
              _scene.remove(cp.mesh);
              _dropMorale(10);
              _showToast('CHECKPOINT DESTROYED!', '#FFAA00');
              r.order = null;
            }
          }
        }
      }

      if (r.order === 'plant' && r.orderTarget) {
        if (r.specialty === 'Demo') {
          var toPlant = r.orderTarget.clone().sub(r.mesh.position);
          if (toPlant.length() > 2) {
            toPlant.normalize().multiplyScalar(4 * dt);
            r.mesh.position.add(toPlant);
          } else {
            // Place charge — explode after 3s
            r._chargeTimer = (r._chargeTimer || 0) + dt;
            if (r._chargeTimer >= 3) {
              r._chargeTimer = 0;
              r.order = null;
              // destroy checkpoint near target
              for (var cpi = 0; cpi < _checkpoints.length; cpi++) {
                var cp2 = _checkpoints[cpi];
                if (!cp2.alive) continue;
                if (r.orderTarget.distanceTo(cp2.pos) < 8) {
                  cp2.alive = false;
                  _scene.remove(cp2.mesh);
                  _dropMorale(12);
                  _showToast('DEMO CHARGE DETONATED!', '#FF8800');
                }
              }
            }
          }
        }
      }

      if (r.order === 'scout') {
        // Move ahead of player
        var ahead = playerPos.clone().add(new THREE.Vector3(0, 0, -15));
        var toAhead = ahead.clone().sub(r.mesh.position);
        if (toAhead.length() > 2) {
          toAhead.normalize().multiplyScalar(5 * dt);
          r.mesh.position.add(toAhead);
        }
      }
    }
  }

  // ── regime soldier AI ─────────────────────────────────────────────────────────
  function _updateSoldiers(dt) {
    var playerPos = _pos();
    for (var i = _soldiers.length - 1; i >= 0; i--) {
      var s = _soldiers[i];
      if (!s.alive) { _soldiers.splice(i, 1); continue; }
      if (s._surrendered) continue;

      // Shoot civilians if support is high (international incident)
      if (_civilianSupport > 60 && Math.random() < 0.001) {
        for (var ci = 0; ci < _civilians.length; ci++) {
          var civ = _civilians[ci];
          if (!civ.alive) continue;
          if (s.mesh.position.distanceTo(civ.mesh.position) < 10 && Math.random() < 0.02) {
            civ.alive = false;
            _scene.remove(civ.mesh);
            _dropMorale(10); // international incident
            _showToast('REGIME SHOOTS CIVILIAN! INT\'L INCIDENT! -10 MORALE', '#FF2222');
          }
        }
      }

      // Patrol
      s._dir += (Math.random() - 0.5) * 1.5 * dt;
      s.mesh.position.x += Math.sin(s._dir) * 2.5 * dt;
      s.mesh.position.z += Math.cos(s._dir) * 2.5 * dt;
      s.mesh.rotation.y = s._dir;

      // Chase player if close
      var distToPlayer = s.mesh.position.distanceTo(playerPos);
      if (distToPlayer < 20) {
        var toPlayer = playerPos.clone().sub(s.mesh.position).normalize().multiplyScalar(3 * dt);
        s.mesh.position.add(toPlayer);
        // Damage player
        if (distToPlayer < 2) {
          if (window._playerHp !== undefined) {
            window._playerHp = Math.max(0, window._playerHp - 8 * dt);
          }
        }
      }
    }
  }

  // ── vehicle AI ────────────────────────────────────────────────────────────────
  function _updateVehicles(dt) {
    for (var i = _vehicles.length - 1; i >= 0; i--) {
      var v = _vehicles[i];
      if (!v.alive) { _scene.remove(v.mesh); _vehicles.splice(i, 1); continue; }
      // Patrol circle
      v.mesh._dir += 0.3 * dt;
      v.mesh.position.x += Math.sin(v.mesh._dir) * 5 * dt;
      v.mesh.position.z += Math.cos(v.mesh._dir) * 5 * dt;
      v.mesh.rotation.y = v.mesh._dir;
    }
  }

  // ── helicopter AI ─────────────────────────────────────────────────────────────
  function _updateHelicopter(dt) {
    if (!_helicopter || !_helicopter.alive) return;
    var h = _helicopter.mesh;
    h._angle += 0.4 * dt;
    h.position.x = Math.sin(h._angle) * 25;
    h.position.z = Math.cos(h._angle) * 25;
    h.position.y = 20;
    h._rotorAngle += 10 * dt;
    // rotor spin visual (first child is body, second tail, third rotor)
    if (h.children[2]) h.children[2].rotation.y = h._rotorAngle;
    // Damage player if close
    var playerPos = _pos();
    if (h.position.distanceTo(playerPos) < 15) {
      if (window._playerHp !== undefined) {
        window._playerHp = Math.max(0, window._playerHp - 20 * dt);
      }
    }
  }

  // ── airstrike warning ─────────────────────────────────────────────────────────
  function _tickAirstrike(dt) {
    if (_regimeMorale > 20) return;
    if (_radioDestroyed) return;
    _airstrikeTimer += dt;
    if (!_airstrikeWarned && _airstrikeTimer > 5) {
      _airstrikeWarned = true;
      _showToast('REGIME CALLING AIRSTRIKE! DESTROY THE RADIO TOWER!', '#FF0000');
    }
    if (_airstrikeTimer > 20) {
      _airstrikeTimer = 0;
      _airstrikeWarned = false;
      // Airstrike hits player area
      if (window._playerHp !== undefined) {
        window._playerHp = Math.max(0, window._playerHp - 50);
      }
      _showToast('AIRSTRIKE HITS! DESTROY THE RADIO TOWER!', '#FF0000');
    }
  }

  // ── elite guards AI ───────────────────────────────────────────────────────────
  function _updateEliteGuards(dt) {
    var playerPos = _pos();
    for (var i = _eliteGuards.length - 1; i >= 0; i--) {
      var eg = _eliteGuards[i];
      if (!eg.alive) { _scene.remove(eg.mesh); _eliteGuards.splice(i, 1); continue; }
      eg._moveTimer -= dt;
      if (eg._moveTimer <= 0) {
        eg._moveTimer = 1 + Math.random();
      }
      var distToP = eg.mesh.position.distanceTo(playerPos);
      if (distToP < 30) {
        var toP = playerPos.clone().sub(eg.mesh.position).normalize().multiplyScalar(3.5 * dt);
        eg.mesh.position.add(toP);
        if (distToP < 2 && window._playerHp !== undefined) {
          window._playerHp = Math.max(0, window._playerHp - 15 * dt);
        }
      }
    }
  }

  // ── interaction (E key) ───────────────────────────────────────────────────────
  function _handleInteract() {
    var playerPos = _pos();

    // Dictator capture
    if (_dictator && _dictator.alive && !_dictatorCaptured && _palaceAssaultActive) {
      if (playerPos.distanceTo(_dictator.mesh.position) < 5) {
        _dictatorCaptured = true;
        _dictator.alive = false;
        _scene.remove(_dictator.mesh);
        _dropMorale(100); // collapse
        _showToast('DICTATOR ARRESTED! REGIME COLLAPSES!', '#44FF44');
        return;
      }
    }

    // Radio tower destroy (melee proxy — E to sabotage when near)
    if (_radioTower && _radioTower.alive) {
      if (playerPos.distanceTo(_radioTower.mesh.position) < 5) {
        _radioTower.hp -= 40;
        if (_radioTower.hp <= 0) {
          _radioTower.alive = false;
          _radioDestroyed = true;
          _scene.remove(_radioTower.mesh);
          _showToast('RADIO TOWER DESTROYED! NO AIRSTRIKE!', '#44FF44');
          _dropMorale(5);
        }
        return;
      }
    }

    // Billboard hack start/continue
    _tryHackBillboard();

    // Give order to selected rebel
    if (_selectedRebel >= 0 && _selectedRebel < _rebels.length) {
      var r = _rebels[_selectedRebel];
      if (!r.alive) return;
      // Determine order based on what's near player
      var orderGiven = false;
      for (var ci = 0; ci < _checkpoints.length; ci++) {
        var cp = _checkpoints[ci];
        if (!cp.alive) continue;
        if (playerPos.distanceTo(cp.pos) < 10) {
          if (r.specialty === 'Demo') {
            r.order = 'plant';
            r.orderTarget = cp.pos.clone();
            _showToast(r.specialty + ': PLANT CHARGE AT CHECKPOINT', '#FFAA00');
          } else {
            r.order = 'attack';
            r.orderTarget = cp.pos.clone();
            _showToast(r.specialty + ': ATTACK CHECKPOINT', '#FF8800');
          }
          orderGiven = true;
          break;
        }
      }
      if (!orderGiven) {
        // Scout ahead
        r.order = 'scout';
        r.orderTarget = null;
        _showToast(r.specialty + ': SCOUT AHEAD', '#44FFAA');
      }
    }
  }

  // ── key handlers ──────────────────────────────────────────────────────────────
  var _eKeyHeld = false;
  var _eKeyTimer = 0;

  function _onKeyDown(e) {
    var now = Date.now();
    if (e.code === 'KeyR') { _keyR = true; _rTime = now; }
    if (e.code === 'KeyU') { _keyU = true; _uTime = now; }

    // Check activation
    if (_keyR && _keyU && !_active) {
      if (Math.abs(_rTime - _uTime) <= ACTIVATE_WINDOW) {
        _activate();
        return;
      }
    }

    if (!_active) return;

    // Select rebel 1-4
    if (e.code === 'Digit1') { _selectedRebel = 0; _showToast('REBEL 1: SNIPER SELECTED', '#44FF44'); }
    if (e.code === 'Digit2') { _selectedRebel = 1; _showToast('REBEL 2: DEMO SELECTED', '#44FF44'); }
    if (e.code === 'Digit3') { _selectedRebel = 2; _showToast('REBEL 3: MEDIC SELECTED', '#44FF44'); }
    if (e.code === 'Digit4') { _selectedRebel = 3; _showToast('REBEL 4: SCOUT SELECTED', '#44FF44'); }

    // Hold position
    if (e.code === 'KeyH' && _selectedRebel >= 0 && _rebels[_selectedRebel]) {
      _rebels[_selectedRebel].order = 'hold';
      _showToast(_rebels[_selectedRebel].specialty + ': HOLD POSITION', '#88FFAA');
    }

    // E key — interact / give order
    if (e.code === 'KeyE') {
      _eKeyHeld = true;
      _eKeyTimer = 0;
      _handleInteract();
    }
  }

  function _onKeyUp(e) {
    if (e.code === 'KeyR') _keyR = false;
    if (e.code === 'KeyU') _keyU = false;
    if (e.code === 'KeyE') { _eKeyHeld = false; _hackingBillboard = null; _hackTimer = 0; }
  }

  // ── billboard hack tick ───────────────────────────────────────────────────────
  function _tickBillboardHack(dt) {
    if (!_eKeyHeld || !_hackingBillboard) return;
    _hackTimer += dt;
    // Progress bar toast
    var pct = Math.floor((_hackTimer / 8) * 100);
    if (_hackTimer < 8) {
      _toast.textContent = 'HACKING... ' + pct + '%';
      _toast.style.color = '#44FFAA';
      _toast.style.opacity = '1';
      return;
    }
    // Complete hack
    var bb = _hackingBillboard;
    bb.hacked = true;
    bb.light.color.setHex(0x44FF44);
    bb.light.intensity = 1.5;
    // Change billboard color to rebel green
    bb.mesh.children[1].material.color.setHex(0x224422);
    _hackingBillboard = null;
    _hackTimer = 0;
    _eKeyHeld = false;

    var hacked = _hackedCount();
    _civilianSupport = _clamp(_civilianSupport + 15, 0, 100);
    _dropMorale(6);
    _showToast('BILLBOARD HACKED! (' + hacked + '/6) CIVILIAN SUPPORT RISING!', '#44FF44');

    // Add civilians if support crosses threshold
    if (hacked === 2) _addCivilians(3);
    if (hacked === 4) _addCivilians(3);
    if (hacked === 6) _addCivilians(4);
  }

  // ── activation ────────────────────────────────────────────────────────────────
  function _activate() {
    if (_active) return;
    _active = true;

    _buildHUD();
    _buildCity();
    _buildRebels();
    _spawnSoldiersAtCheckpoints();
    _showToast('REBEL UPRISING ACTIVATED! LIBERATE THE CITY!', '#44FF44');
  }

  // ── main update ───────────────────────────────────────────────────────────────
  function update(dt) {
    if (!_active) return;
    _t += dt;

    // Regime response — spawn vehicles at morale 60
    if (_regimeMorale <= 60 && !_vehicleSpawnDone) {
      _spawnArmoredVehicles();
    }
    // Helicopter at morale 40
    if (_regimeMorale <= 40 && !_heliSpawnDone) {
      _spawnHelicopter();
    }
    // Palace assault mode at morale < 20
    if (_regimeMorale < 20 && !_palaceAssaultActive) {
      _palaceAssaultActive = true;
      _openPalaceGates();
      _spawnEliteGuards();
    }

    _updateRebels(dt);
    _updateSoldiers(dt);
    _updateVehicles(dt);
    _updateHelicopter(dt);
    _tickAirstrike(dt);
    _tickBillboardHack(dt);

    if (_palaceAssaultActive) {
      _updateEliteGuards(dt);
    }

    _updateHUD();
  }

  // ── init / reset ──────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene = scene || window._gameScene;
    _camera = camera || window._camera;
    _active = false;
    _regimeMorale = 80;
    _keyR = false;
    _keyU = false;
    _rTime = 0;
    _uTime = 0;
    _buildings = [];
    _checkpoints = [];
    _billboards = [];
    _palace = null;
    _palaceGates = [];
    _palaceGatesOpen = false;
    _radioTower = null;
    _radioDestroyed = false;
    _dictator = null;
    _dictatorCaptured = false;
    _rebels = [];
    _selectedRebel = -1;
    _soldiers = [];
    _vehicles = [];
    _helicopter = null;
    _airstrikeTimer = 0;
    _airstrikeWarned = false;
    _eliteGuards = [];
    _civilians = [];
    _civilianSupport = 0;
    _hackingBillboard = null;
    _hackTimer = 0;
    _palaceAssaultActive = false;
    _eliteSpawned = false;
    _vehicleSpawnDone = false;
    _heliSpawnDone = false;
    _eKeyHeld = false;
    _eKeyTimer = 0;
    _t = 0;

    if (_hud && _hud.parentNode) _hud.parentNode.removeChild(_hud);
    if (_toast && _toast.parentNode) _toast.parentNode.removeChild(_toast);
    _hud = null;
    _toast = null;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup', _onKeyUp);
  }

  function reset() {
    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup', _onKeyUp);
    // Remove scene objects
    var i;
    for (i = 0; i < _buildings.length; i++) { if (_scene) _scene.remove(_buildings[i].mesh); }
    for (i = 0; i < _checkpoints.length; i++) { if (_scene) _scene.remove(_checkpoints[i].mesh); }
    for (i = 0; i < _billboards.length; i++) { if (_scene) _scene.remove(_billboards[i].mesh); }
    for (i = 0; i < _rebels.length; i++) { if (_scene) _scene.remove(_rebels[i].mesh); }
    for (i = 0; i < _soldiers.length; i++) { if (_scene && _soldiers[i].mesh) _scene.remove(_soldiers[i].mesh); }
    for (i = 0; i < _vehicles.length; i++) { if (_scene) _scene.remove(_vehicles[i].mesh); }
    for (i = 0; i < _civilians.length; i++) { if (_scene) _scene.remove(_civilians[i].mesh); }
    for (i = 0; i < _eliteGuards.length; i++) { if (_scene && _eliteGuards[i].mesh) _scene.remove(_eliteGuards[i].mesh); }
    if (_palace && _scene) _scene.remove(_palace);
    if (_radioTower && _scene) _scene.remove(_radioTower.mesh);
    if (_dictator && _scene) _scene.remove(_dictator.mesh);
    if (_helicopter && _scene) _scene.remove(_helicopter.mesh);
    if (_hud && _hud.parentNode) _hud.parentNode.removeChild(_hud);
    if (_toast && _toast.parentNode) _toast.parentNode.removeChild(_toast);
    _active = false;
  }

  return { init: init, update: update, reset: reset };
})();
