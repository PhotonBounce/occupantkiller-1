window.AncientSiege = (function () {
  'use strict';

  // ── Activation state ─────────────────────────────────────────────────────
  var _active = false;
  var _scene = null;
  var _camera = null;
  var _renderer = null;
  var _animId = null;
  var _clock = null;

  // Key tracking for A+S simultaneous activation (within 400ms)
  var _keyTimes = {};
  var _ACTIVATION_WINDOW = 400;

  // ── Castle geometry groups ────────────────────────────────────────────────
  var _castleGroup = null;
  var _gateMesh = null;
  var _gateHP = 300;
  var _gateBreached = false;

  // ── Defenders ─────────────────────────────────────────────────────────────
  var _defenders = [];          // { mesh, hp, wall, isArcher, arrowTimer, fled }
  var _defenderKillCount = 0;
  var _moraleReduced = false;   // triggers when 4+ killed
  var _defendersFled = false;

  // ── Arrows ────────────────────────────────────────────────────────────────
  var _arrows = [];             // { mesh, vx, vy, vz, life }

  // ── Siege weapons ─────────────────────────────────────────────────────────
  // Catapult
  var _catapult = null;         // { group, frame, boulder, boulders, aiming, loaded }
  var _catapultBoulders = 6;
  var _activeBoulders = [];     // { mesh, vx, vy, vz, life }
  var _catapultAiming = false;

  // Battering ram
  var _ram = null;              // { group, log, x, hitTimer }
  var _ramPushers = 0;
  var _ramAdvancing = false;

  // Trebuchet
  var _trebuchet = null;        // { group, arm, counterweight, boulders, aiming }
  var _trebuchetBoulders = 4;
  var _activeTrebBoulders = []; // { mesh, vx, vy, vz, life }
  var _trebuchetAiming = false;

  // ── Scaling ladders ───────────────────────────────────────────────────────
  var _ladders = [];            // { mesh, x, z, side, climbing }
  var _MAX_LADDERS = 3;

  // ── Keep / boss ───────────────────────────────────────────────────────────
  var _keepBoss = null;         // { mesh, hp, swingTimer, alive }
  var _bossHP = 400;

  // ── Boiling oil ───────────────────────────────────────────────────────────
  var _oilTimer = 0;
  var _oilWarningActive = false;
  var _oilWarningTimer = 0;
  var _oilStream = null;        // mesh
  var _oilActive = false;
  var _oilDuration = 0;

  // ── Player state ──────────────────────────────────────────────────────────
  var _playerHP = 100;
  var _playerX = 0;
  var _playerZ = 30;
  var _playerY = 0;
  var _score = 0;
  var _missionComplete = false;

  // ── HUD element ───────────────────────────────────────────────────────────
  var _hudEl = null;

  // ── Keys held ─────────────────────────────────────────────────────────────
  var _keys = {};

  // ──────────────────────────────────────────────────────────────────────────
  // GEOMETRY HELPERS
  // ──────────────────────────────────────────────────────────────────────────

  function _makeBox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function _makeCylinder(rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function _makeSphere(r, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, 8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BUILD CASTLE
  // ──────────────────────────────────────────────────────────────────────────

  function _buildCastle() {
    _castleGroup = new THREE.Group();

    // Outer walls: rectangle  40x8x2
    // North wall
    var northWall = _makeBox(40, 8, 2, 0x8B7355, 0, 4, -21);
    _castleGroup.add(northWall);
    // South wall (has gate gap)
    var southWallL = _makeBox(18, 8, 2, 0x8B7355, -11, 4, 21);
    var southWallR = _makeBox(18, 8, 2, 0x8B7355, 11, 4, 21);
    _castleGroup.add(southWallL);
    _castleGroup.add(southWallR);
    // East wall
    var eastWall = _makeBox(2, 8, 40, 0x8B7355, 21, 4, 0);
    _castleGroup.add(eastWall);
    // West wall
    var westWall = _makeBox(2, 8, 40, 0x8B7355, -21, 4, 0);
    _castleGroup.add(westWall);

    // Corner towers
    var towers = [
      { x: -20, z: -20 },
      { x:  20, z: -20 },
      { x: -20, z:  20 },
      { x:  20, z:  20 }
    ];
    for (var i = 0; i < towers.length; i++) {
      var t = _makeCylinder(3, 3, 12, 10, 0x9B8365, towers[i].x, 6, towers[i].z);
      _castleGroup.add(t);
    }

    // Gate (south wall center)
    _gateMesh = _makeBox(4, 6, 2, 0x664433, 0, 3, 21);
    _gateMesh.userData.isGate = true;
    _castleGroup.add(_gateMesh);

    // Inner keep
    var keep = _makeBox(10, 14, 10, 0x7B6355, 0, 7, -8);
    _castleGroup.add(keep);

    // Ground plane
    var ground = _makeBox(80, 0.5, 80, 0x5A4A2A, 0, -0.25, 0);
    _castleGroup.add(ground);

    _scene.add(_castleGroup);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BUILD DEFENDERS
  // ──────────────────────────────────────────────────────────────────────────

  function _buildDefenders() {
    _defenders = [];
    // 12 soldiers on walls
    var wallPositions = [
      { x: -15, y: 9, z: -21 },
      { x: -5,  y: 9, z: -21 },
      { x:  5,  y: 9, z: -21 },
      { x:  15, y: 9, z: -21 },
      { x: -21, y: 9, z: -10 },
      { x: -21, y: 9, z:  5  },
      { x:  21, y: 9, z: -10 },
      { x:  21, y: 9, z:  5  },
      { x: -15, y: 9, z:  21 },
      { x:  15, y: 9, z:  21 },
      { x: -8,  y: 9, z: -21 },
      { x:  8,  y: 9, z: -21 }
    ];
    for (var i = 0; i < wallPositions.length; i++) {
      var p = wallPositions[i];
      var mesh = _makeBox(0.8, 1.8, 0.8, 0x334455, p.x, p.y, p.z);
      _scene.add(mesh);
      _defenders.push({
        mesh: mesh,
        hp: 60,
        wall: p,
        isArcher: true,
        arrowTimer: 2 + Math.random() * 2,
        fled: false,
        alive: true
      });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BUILD SIEGE WEAPONS
  // ──────────────────────────────────────────────────────────────────────────

  function _buildCatapult() {
    _catapult = { group: new THREE.Group(), boulders: _catapultBoulders, aiming: false };
    var frame = _makeBox(3, 2, 4, 0x8B6914, 0, 1, 0);
    _catapult.group.add(frame);
    var boulder = _makeSphere(0.6, 0x333333, 0, 2.5, -1.5);
    _catapult.boulder = boulder;
    _catapult.group.add(boulder);
    _catapult.group.position.set(_playerX - 5, 0, _playerZ + 3);
    _scene.add(_catapult.group);
  }

  function _buildBatteringRam() {
    _ram = { group: new THREE.Group(), x: 0, z: 28, hitTimer: 0 };
    var log = _makeBox(8, 2, 1.5, 0x8B6914, 0, 1, 0);
    _ram.log = log;
    _ram.group.add(log);
    _ram.group.position.set(0, 0, 28);
    _scene.add(_ram.group);
  }

  function _buildTrebuchet() {
    _trebuchet = { group: new THREE.Group(), boulders: _trebuchetBoulders, aiming: false };
    // Frame larger than catapult
    var frame = _makeBox(4, 3, 6, 0x8B6914, 0, 1.5, 0);
    _trebuchet.group.add(frame);
    // Counterweight
    var cw = _makeCylinder(1, 1, 2, 8, 0x555533, 0, 4.5, 1.5);
    _trebuchet.counterweight = cw;
    _trebuchet.group.add(cw);
    var boulder = _makeSphere(0.8, 0x333333, 0, 4, -2.5);
    _trebuchet.boulder = boulder;
    _trebuchet.group.add(boulder);
    _trebuchet.group.position.set(_playerX + 8, 0, _playerZ + 3);
    _scene.add(_trebuchet.group);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BUILD KEEP BOSS
  // ──────────────────────────────────────────────────────────────────────────

  function _buildKeepBoss() {
    var mesh = _makeBox(1.4, 2.52, 1.4, 0x1A1A4A, 0, 8, -8);
    _scene.add(mesh);
    _keepBoss = { mesh: mesh, hp: 400, swingTimer: 0, alive: true };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // HUD
  // ──────────────────────────────────────────────────────────────────────────

  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'ancient-siege-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#FFD700',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var aliveDefenders = 0;
    for (var i = 0; i < _defenders.length; i++) {
      if (_defenders[i].alive && !_defenders[i].fled) aliveDefenders++;
    }
    var morale = 'HIGH';
    if (_defenderKillCount >= 4) morale = 'LOW';
    if (aliveDefenders < 8) morale = 'BROKEN';

    var activeLadders = _ladders.length;
    var boulderCount = _catapultBoulders;

    var gateStr = _gateBreached ? 'BREACHED' : (_gateHP + '/300 HP');

    _hudEl.textContent = 'SIEGE [GATE: ' + gateStr + '] [DEFENDERS: ' + aliveDefenders +
      '] [BOULDERS: ' + boulderCount + '] [LADDERS: ' + activeLadders + '] | MORALE: ' + morale;

    if (_missionComplete) {
      _hudEl.textContent += ' | MISSION COMPLETE! +1000 SCORE';
    }
    if (_oilWarningActive) {
      _hudEl.textContent += ' | !! BOILING OIL WARNING !!';
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GATE DAMAGE
  // ──────────────────────────────────────────────────────────────────────────

  function _damageGate(amount) {
    if (_gateBreached) return;
    _gateHP -= amount;
    if (_gateHP <= 0) {
      _gateHP = 0;
      _gateBreached = true;
      if (_gateMesh && _gateMesh.parent) {
        _gateMesh.parent.remove(_gateMesh);
        _gateMesh = null;
      }
      // Defenders get more aggressive when gate breached
      for (var i = 0; i < _defenders.length; i++) {
        if (_defenders[i].alive) {
          _defenders[i].arrowTimer *= 0.6;
        }
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CATAPULT FIRE
  // ──────────────────────────────────────────────────────────────────────────

  function _fireCatapult() {
    if (!_catapult || _catapultBoulders <= 0) return;
    _catapultBoulders--;
    var startPos = _catapult.group.position.clone();
    startPos.y += 3;
    var boulder = _makeSphere(0.6, 0x333333, startPos.x, startPos.y, startPos.z);
    _scene.add(boulder);
    // Arc at 45° toward gate
    var dx = 0 - startPos.x;
    var dz = 21 - startPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    var speed = 12;
    var horizSpeed = speed * 0.707;
    _activeBoulders.push({
      mesh: boulder,
      vx: (dx / dist) * horizSpeed,
      vy: speed * 0.707,
      vz: (dz / dist) * horizSpeed,
      life: 4
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TREBUCHET FIRE
  // ──────────────────────────────────────────────────────────────────────────

  function _fireTrebuchet() {
    if (!_trebuchet || _trebuchetBoulders <= 0) return;
    _trebuchetBoulders--;
    var startPos = _trebuchet.group.position.clone();
    startPos.y += 5;
    var boulder = _makeSphere(0.8, 0x222222, startPos.x, startPos.y, startPos.z);
    _scene.add(boulder);
    var dx = 0 - startPos.x;
    var dz = -8 - startPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    var speed = 16;
    var horizSpeed = speed * 0.707;
    _activeTrebBoulders.push({
      mesh: boulder,
      vx: (dx / dist) * horizSpeed,
      vy: speed * 0.9,
      vz: (dz / dist) * horizSpeed,
      life: 5
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BATTERING RAM LOGIC
  // ──────────────────────────────────────────────────────────────────────────

  function _updateRam(dt) {
    if (!_ram) return;
    if (_ramAdvancing) {
      _ram.z -= 0.5 * dt;
      _ram.group.position.z = _ram.z;
      // When ram reaches gate
      if (_ram.z <= 21) {
        _ram.hitTimer += dt;
        if (_ram.hitTimer >= 2) {
          _ram.hitTimer = 0;
          _damageGate(20);
        }
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // LADDER PLANTING
  // ──────────────────────────────────────────────────────────────────────────

  function _plantLadder() {
    if (_ladders.length >= _MAX_LADDERS) return;
    // Plant on closest wall
    var mesh = _makeBox(0.3, 6, 0.3, 0x8B6914, _playerX, 3, _playerZ - 2);
    _scene.add(mesh);
    _ladders.push({ mesh: mesh, x: _playerX, z: _playerZ, climbing: false });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ARROWS FROM DEFENDERS
  // ──────────────────────────────────────────────────────────────────────────

  function _updateDefenders(dt) {
    var arrowInterval = _gateBreached ? 1.8 : 3;
    if (_moraleReduced) arrowInterval *= 1.3;

    // Check flee condition
    var aliveCount = 0;
    for (var i = 0; i < _defenders.length; i++) {
      if (_defenders[i].alive && !_defenders[i].fled) aliveCount++;
    }
    if (aliveCount < 8 && !_defendersFled) {
      _defendersFled = true;
      for (var j = 0; j < _defenders.length; j++) {
        var d = _defenders[j];
        if (d.alive && !d.fled) {
          d.fled = true;
          d.mesh.material.color.setHex(0x888888);
        }
      }
    }

    for (var k = 0; k < _defenders.length; k++) {
      var def = _defenders[k];
      if (!def.alive || def.fled) continue;
      def.arrowTimer -= dt;
      if (def.arrowTimer <= 0) {
        def.arrowTimer = arrowInterval + Math.random() * 1.5;
        // Shoot arrow downward toward player
        var arr = _makeSphere(0.15, 0x8B4513,
          def.mesh.position.x,
          def.mesh.position.y - 0.5,
          def.mesh.position.z
        );
        _scene.add(arr);
        var dx = _playerX - def.mesh.position.x;
        var dz = _playerZ - def.mesh.position.z;
        var dy = _playerY - def.mesh.position.y;
        var dist = Math.sqrt(dx * dx + dz * dz + dy * dy) || 1;
        var spd = 10;
        _arrows.push({
          mesh: arr,
          vx: (dx / dist) * spd,
          vy: (dy / dist) * spd,
          vz: (dz / dist) * spd,
          life: 3
        });
      }
    }
  }

  function _updateArrows(dt) {
    for (var i = _arrows.length - 1; i >= 0; i--) {
      var a = _arrows[i];
      a.mesh.position.x += a.vx * dt;
      a.mesh.position.y += a.vy * dt;
      a.mesh.position.z += a.vz * dt;
      a.vy -= 3 * dt; // gravity
      a.life -= dt;
      // Check if near player
      var dx = a.mesh.position.x - _playerX;
      var dz = a.mesh.position.z - _playerZ;
      var dy = a.mesh.position.y - _playerY;
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 1.2) {
        _playerHP -= 8;
        _scene.remove(a.mesh);
        _arrows.splice(i, 1);
        continue;
      }
      if (a.life <= 0 || a.mesh.position.y < -2) {
        _scene.remove(a.mesh);
        _arrows.splice(i, 1);
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BOULDER UPDATES
  // ──────────────────────────────────────────────────────────────────────────

  function _updateBoulders(dt) {
    var GRAVITY = -9.8;

    // Catapult boulders
    for (var i = _activeBoulders.length - 1; i >= 0; i--) {
      var b = _activeBoulders[i];
      b.mesh.position.x += b.vx * dt;
      b.mesh.position.y += b.vy * dt;
      b.mesh.position.z += b.vz * dt;
      b.vy += GRAVITY * dt;
      b.life -= dt;
      // Check gate hit
      if (!_gateBreached && _gateMesh) {
        var gdx = b.mesh.position.x - 0;
        var gdz = b.mesh.position.z - 21;
        var gdy = b.mesh.position.y - 3;
        if (Math.abs(gdx) < 3 && Math.abs(gdz) < 2 && Math.abs(gdy) < 4) {
          _damageGate(40);
          _scene.remove(b.mesh);
          _activeBoulders.splice(i, 1);
          continue;
        }
      }
      if (b.life <= 0 || b.mesh.position.y < -5) {
        _scene.remove(b.mesh);
        _activeBoulders.splice(i, 1);
      }
    }

    // Trebuchet boulders (2x damage)
    for (var j = _activeTrebBoulders.length - 1; j >= 0; j--) {
      var tb = _activeTrebBoulders[j];
      tb.mesh.position.x += tb.vx * dt;
      tb.mesh.position.y += tb.vy * dt;
      tb.mesh.position.z += tb.vz * dt;
      tb.vy += GRAVITY * dt;
      tb.life -= dt;
      // Check gate hit
      if (!_gateBreached && _gateMesh) {
        var tgdx = tb.mesh.position.x - 0;
        var tgdz = tb.mesh.position.z - 21;
        var tgdy = tb.mesh.position.y - 3;
        if (Math.abs(tgdx) < 3 && Math.abs(tgdz) < 2 && Math.abs(tgdy) < 4) {
          _damageGate(80); // 2x damage
          _scene.remove(tb.mesh);
          _activeTrebBoulders.splice(j, 1);
          continue;
        }
      }
      // Check wall hit for defenders
      for (var k = _defenders.length - 1; k >= 0; k--) {
        var def = _defenders[k];
        if (!def.alive) continue;
        var ddx = tb.mesh.position.x - def.mesh.position.x;
        var ddz = tb.mesh.position.z - def.mesh.position.z;
        var ddy = tb.mesh.position.y - def.mesh.position.y;
        if (Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz) < 2) {
          def.hp -= 80;
          if (def.hp <= 0) {
            def.alive = false;
            _scene.remove(def.mesh);
            _defenderKillCount++;
            if (_defenderKillCount >= 4) _moraleReduced = true;
          }
        }
      }
      if (tb.life <= 0 || tb.mesh.position.y < -5) {
        _scene.remove(tb.mesh);
        _activeTrebBoulders.splice(j, 1);
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BOILING OIL
  // ──────────────────────────────────────────────────────────────────────────

  function _updateOil(dt) {
    _oilTimer += dt;

    // Warning 5s before at 55s
    if (_oilTimer >= 55 && !_oilWarningActive && !_oilActive) {
      _oilWarningActive = true;
      _oilWarningTimer = 5;
    }

    if (_oilWarningActive) {
      _oilWarningTimer -= dt;
      if (_oilWarningTimer <= 0) {
        _oilWarningActive = false;
        _triggerOil();
      }
    }

    if (_oilActive) {
      _oilDuration -= dt;
      // Check player in kill zone (below west wall pour point)
      var px = _playerX;
      var pz = _playerZ;
      if (Math.abs(px - (-21)) < 4 && Math.abs(pz - 0) < 6) {
        _playerHP -= 15 * dt;
      }
      if (_oilDuration <= 0) {
        _oilActive = false;
        if (_oilStream && _oilStream.parent) {
          _oilStream.parent.remove(_oilStream);
          _oilStream = null;
        }
        _oilTimer = 0;
      }
    }
  }

  function _triggerOil() {
    _oilActive = true;
    _oilDuration = 5;
    // Visual: orange stream box from west wall
    _oilStream = _makeBox(0.3, 6, 0.3, 0xFF6600, -21, 5, 0);
    _scene.add(_oilStream);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BOSS LOGIC
  // ──────────────────────────────────────────────────────────────────────────

  function _updateBoss(dt) {
    if (!_keepBoss || !_keepBoss.alive) return;
    _keepBoss.swingTimer += dt;
    if (_keepBoss.swingTimer >= 2) {
      _keepBoss.swingTimer = 0;
      // Melee swing: check player within 2.5 radius of keep center
      var dx = _playerX - 0;
      var dz = _playerZ - (-8);
      if (Math.sqrt(dx * dx + dz * dz) < 2.5) {
        _playerHP -= 25;
      }
    }
  }

  function _checkBossKill() {
    if (!_keepBoss || !_keepBoss.alive) return;
    // For demo: press K near boss to attack
    if (_keys['k'] || _keys['K']) {
      var dx = _playerX - 0;
      var dz = _playerZ - (-8);
      if (Math.sqrt(dx * dx + dz * dz) < 4) {
        _keepBoss.hp -= 50;
        if (_keepBoss.hp <= 0) {
          _keepBoss.alive = false;
          _scene.remove(_keepBoss.mesh);
          _score += 1000;
          _missionComplete = true;
        }
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // LIGHTING
  // ──────────────────────────────────────────────────────────────────────────

  function _addLights() {
    var ambient = new THREE.AmbientLight(0xccaa88, 0.6);
    _scene.add(ambient);
    var sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(30, 60, 20);
    _scene.add(sun);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // INPUT
  // ──────────────────────────────────────────────────────────────────────────

  function _onKeyDown(e) {
    var k = e.key;
    _keys[k] = true;
    _keyTimes[k] = Date.now();

    // Catapult aim
    if (k === 'c' || k === 'C') {
      _catapultAiming = !_catapultAiming;
    }

    // Fire catapult or trebuchet
    if (k === ' ') {
      if (_catapultAiming) {
        _fireCatapult();
        _catapultAiming = false;
      } else if (_trebuchetAiming) {
        _fireTrebuchet();
        _trebuchetAiming = false;
      }
    }

    // Trebuchet aim
    if (k === 't' || k === 'T') {
      _trebuchetAiming = !_trebuchetAiming;
    }

    // Ram push
    if (k === 'r' || k === 'R') {
      _ramPushers++;
      if (_ramPushers >= 4) {
        _ramAdvancing = true;
      }
    }

    // Ladder
    if (k === 'l' || k === 'L') {
      _plantLadder();
    }

    // Boss kill
    if (k === 'k' || k === 'K') {
      _checkBossKill();
    }
  }

  function _onKeyUp(e) {
    _keys[e.key] = false;
    if (e.key === 'r' || e.key === 'R') {
      if (_ramPushers > 0) _ramPushers--;
      if (_ramPushers < 4) _ramAdvancing = false;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ACTIVATION KEY DETECTION (A+S within 400ms)
  // ──────────────────────────────────────────────────────────────────────────

  function _checkActivation(e) {
    _keyTimes[e.key] = Date.now();
    var aTime = _keyTimes['a'] || _keyTimes['A'] || 0;
    var sTime = _keyTimes['s'] || _keyTimes['S'] || 0;
    var now = Date.now();
    var aHeld = _keys['a'] || _keys['A'];
    var sHeld = _keys['s'] || _keys['S'];
    if ((e.key === 's' || e.key === 'S') && (aHeld || (now - aTime < _ACTIVATION_WINDOW))) {
      _toggleModule();
    } else if ((e.key === 'a' || e.key === 'A') && (sHeld || (now - sTime < _ACTIVATION_WINDOW))) {
      _toggleModule();
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PLAYER MOVEMENT
  // ──────────────────────────────────────────────────────────────────────────

  function _updatePlayer(dt) {
    var spd = 8;
    if (_keys['ArrowLeft'])  _playerX -= spd * dt;
    if (_keys['ArrowRight']) _playerX += spd * dt;
    if (_keys['ArrowUp'])    _playerZ -= spd * dt;
    if (_keys['ArrowDown'])  _playerZ += spd * dt;

    // Keep camera above player
    if (_camera) {
      _camera.position.x = _playerX;
      _camera.position.z = _playerZ + 18;
      _camera.position.y = 12;
      _camera.lookAt(_playerX, 0, _playerZ);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // MAIN LOOP
  // ──────────────────────────────────────────────────────────────────────────

  function _loop() {
    if (!_active) return;
    _animId = requestAnimationFrame(_loop);
    var dt = _clock.getDelta();
    if (dt > 0.1) dt = 0.1;

    _updatePlayer(dt);
    _updateDefenders(dt);
    _updateArrows(dt);
    _updateBoulders(dt);
    _updateRam(dt);
    _updateOil(dt);
    _updateBoss(dt);
    _updateHUD();

    _renderer.render(_scene, _camera);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ACTIVATE / DEACTIVATE
  // ──────────────────────────────────────────────────────────────────────────

  function _activate() {
    if (_active) return;
    _active = true;

    // Create scene
    _scene = new THREE.Scene();
    _scene.background = new THREE.Color(0x87CEEB);
    _scene.fog = new THREE.Fog(0x87CEEB, 60, 120);

    // Camera
    _camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    _camera.position.set(0, 12, 48);
    _camera.lookAt(0, 0, 0);

    // Renderer
    _renderer = new THREE.WebGLRenderer({ antialias: true });
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _renderer.domElement.id = 'ancient-siege-canvas';
    _renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:9000;';
    document.body.appendChild(_renderer.domElement);

    _clock = new THREE.Clock();

    _addLights();
    _buildCastle();
    _buildDefenders();
    _buildCatapult();
    _buildBatteringRam();
    _buildTrebuchet();
    _buildKeepBoss();
    _buildHUD();

    // Reset state
    _gateHP = 300;
    _gateBreached = false;
    _catapultBoulders = 6;
    _trebuchetBoulders = 4;
    _playerHP = 100;
    _playerX = 0;
    _playerZ = 30;
    _playerY = 0;
    _score = 0;
    _missionComplete = false;
    _defenderKillCount = 0;
    _moraleReduced = false;
    _defendersFled = false;
    _ramPushers = 0;
    _ramAdvancing = false;
    _oilTimer = 0;
    _oilWarningActive = false;
    _oilActive = false;

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup', _onKeyUp);
    window.addEventListener('resize', _onResize);

    _loop();
  }

  function _deactivate() {
    if (!_active) return;
    _active = false;

    if (_animId) { cancelAnimationFrame(_animId); _animId = null; }
    if (_renderer) {
      _renderer.domElement.parentNode && _renderer.domElement.parentNode.removeChild(_renderer.domElement);
      _renderer.dispose();
      _renderer = null;
    }
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
      _hudEl = null;
    }

    // Clean arrows
    for (var i = 0; i < _arrows.length; i++) {
      if (_arrows[i].mesh && _scene) _scene.remove(_arrows[i].mesh);
    }
    _arrows = [];
    for (var j = 0; j < _activeBoulders.length; j++) {
      if (_activeBoulders[j].mesh && _scene) _scene.remove(_activeBoulders[j].mesh);
    }
    _activeBoulders = [];
    for (var k = 0; k < _activeTrebBoulders.length; k++) {
      if (_activeTrebBoulders[k].mesh && _scene) _scene.remove(_activeTrebBoulders[k].mesh);
    }
    _activeTrebBoulders = [];
    _ladders = [];
    _defenders = [];

    _scene = null;
    _camera = null;
    _clock = null;
    _castleGroup = null;
    _gateMesh = null;
    _catapult = null;
    _ram = null;
    _trebuchet = null;
    _keepBoss = null;
    _oilStream = null;

    window.removeEventListener('keydown', _onKeyDown);
    window.removeEventListener('keyup', _onKeyUp);
    window.removeEventListener('resize', _onResize);
  }

  function _toggleModule() {
    if (_active) {
      _deactivate();
    } else {
      _activate();
    }
  }

  function _onResize() {
    if (!_camera || !_renderer) return;
    _camera.aspect = window.innerWidth / window.innerHeight;
    _camera.updateProjectionMatrix();
    _renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GLOBAL KEY LISTENER FOR ACTIVATION (A+S)
  // ──────────────────────────────────────────────────────────────────────────

  (function _initActivationListener() {
    var _globalKeys = {};
    var _globalKeyTimes = {};

    function _globalKeyDown(e) {
      _globalKeys[e.key] = true;
      _globalKeyTimes[e.key] = Date.now();

      var now = Date.now();

      if ((e.key === 's' || e.key === 'S')) {
        var aTime = _globalKeyTimes['a'] || _globalKeyTimes['A'] || 0;
        var aHeld = _globalKeys['a'] || _globalKeys['A'];
        if (aHeld || (now - aTime < _ACTIVATION_WINDOW && aTime > 0)) {
          _toggleModule();
        }
      }
      if ((e.key === 'a' || e.key === 'A')) {
        var sTime = _globalKeyTimes['s'] || _globalKeyTimes['S'] || 0;
        var sHeld = _globalKeys['s'] || _globalKeys['S'];
        if (sHeld || (now - sTime < _ACTIVATION_WINDOW && sTime > 0)) {
          _toggleModule();
        }
      }
    }

    function _globalKeyUp(e) {
      _globalKeys[e.key] = false;
    }

    window.addEventListener('keydown', _globalKeyDown);
    window.addEventListener('keyup', _globalKeyUp);
  }());

  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ──────────────────────────────────────────────────────────────────────────

  return {
    activate: _activate,
    deactivate: _deactivate,
    isActive: function () { return _active; },
    getScore: function () { return _score; },
    getPlayerHP: function () { return _playerHP; },
    getGateHP: function () { return _gateHP; },
    isGateBreached: function () { return _gateBreached; },
    isMissionComplete: function () { return _missionComplete; }
  };
}());
