window.TrainHijack = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // ── state ──────────────────────────────────────────────────────────────────
  var _active = false;
  var _scene, _camera, _renderer, _container;
  var _lastTTime = 0, _lastHTime = 0;
  var _keys = {};
  var _mouseDX = 0, _mouseDY = 0;
  var _yaw = 0, _pitch = 0;
  var _playerPos, _playerHP, _playerCar;
  var _enemies = [];
  var _hostages = [];
  var _bullets = [];
  var _scenery = [];
  var _trainCars = [];
  var _vestibules = [];
  var _clock;
  var _trainTimer = 480; // 8 minutes in seconds
  var _hostagesRescued = 0;
  var _bombDefused = false;
  var _bombDefuseProgress = 0;
  var _brakeActive = false;
  var _brakePullProgress = 0;
  var _bombDetonated = false;
  var _gameOver = false;
  var _gameWon = false;
  var _lastTime = 0;
  var _worldOffset = 0;
  var _shootCooldown = 0;
  var _eHoldTime = 0;
  var _eHolding = false;
  var _warningFlash = 0;
  var _shakeX = 0, _shakeY = 0;
  var _hudEl = null;
  var _overlayEl = null;
  var _trainSpeed = 220; // km/h display

  var CAR_LENGTH = 20;
  var CAR_COUNT = 8;
  var CAR_WIDTH = 4;
  var CAR_HEIGHT = 4;
  var BOMB_CAR = 5; // cargo car index
  var LOCO_CAR = 7; // locomotive index

  // ── key handlers ───────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    _keys[e.code] = true;

    if (e.code === 'KeyT') _lastTTime = performance.now();
    if (e.code === 'KeyH') {
      _lastHTime = performance.now();
      if (!_active && (_lastHTime - _lastTTime) < 400 && _lastTTime > 0) {
        _activate();
      }
    }

    if (!_active) return;
    if (e.code === 'Escape') _deactivate();
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
    if (e.code === 'KeyE') {
      _eHolding = false;
      _eHoldTime = 0;
    }
  }

  function _onMouseMove(e) {
    if (!_active) return;
    _mouseDX += e.movementX || 0;
    _mouseDY += e.movementY || 0;
  }

  function _onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0) _shoot();
  }

  function _onPointerLockChange() {
    if (!_active) return;
    if (document.pointerLockElement !== _container) {
      // pointer unlocked but game still active — try relock
    }
  }

  // ── geometry helpers ───────────────────────────────────────────────────────
  function _box(w, h, d, color) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function _lineBox(w, h, d, color) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var edges = new THREE.EdgesGeometry(geo);
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(edges, mat);
  }

  function _cylinder(rt, rb, h, segs, color) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function _sphere(r, color) {
    var geo = new THREE.SphereGeometry(r, 8, 6);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function _cone(r, h, segs, color) {
    var geo = new THREE.ConeGeometry(r, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'th-hud';
    _hudEl.style.cssText = [
      'position:fixed;top:10px;left:50%;transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7);color:#0f0;font:bold 13px monospace',
      'padding:6px 14px;border:1px solid #0a0;border-radius:4px',
      'pointer-events:none;z-index:10001;white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);

    _overlayEl = document.createElement('div');
    _overlayEl.id = 'th-overlay';
    _overlayEl.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%',
      'display:flex;align-items:center;justify-content:center',
      'font:bold 32px monospace;color:#fff;text-align:center',
      'pointer-events:none;z-index:10002;display:none'
    ].join(';');
    document.body.appendChild(_overlayEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var mins = Math.floor(_trainTimer / 60);
    var secs = Math.floor(_trainTimer % 60);
    var timeStr = mins + ':' + (secs < 10 ? '0' : '') + secs;
    var bombStr = _bombDefused ? '<span style="color:#0f0">DEFUSED</span>'
      : '<span style="color:#f00">ARMED ' + timeStr + '</span>';
    var brakeStr = _brakeActive
      ? '<span style="color:#0f0">PULLED</span>'
      : '<span style="color:#fa0">ACTIVE</span>';
    var terrorCount = 0;
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].hp > 0) terrorCount++;
    }
    _hudEl.innerHTML = 'TRAIN HIJACK | HOSTAGES: ' + _hostagesRescued + '/6 RESCUED | BOMB: ' +
      bombStr + ' | BRAKE: ' + brakeStr + ' | SPEED: ' + _trainSpeed + 'km/h | TERRORISTS: ' +
      terrorCount + ' | HP: ' + _playerHP;
    if (_warningFlash > 0) {
      _hudEl.style.borderColor = '#f00';
      _hudEl.style.color = '#f66';
    } else {
      _hudEl.style.borderColor = '#0a0';
      _hudEl.style.color = '#0f0';
    }
  }

  function _showOverlay(msg, color) {
    if (!_overlayEl) return;
    _overlayEl.style.display = 'flex';
    _overlayEl.style.background = 'rgba(0,0,0,0.8)';
    _overlayEl.innerHTML = '<div style="color:' + (color || '#fff') + '">' + msg + '</div>';
  }

  function _hideOverlay() {
    if (_overlayEl) _overlayEl.style.display = 'none';
  }

  // ── world building ─────────────────────────────────────────────────────────
  function _buildTrain() {
    for (var i = 0; i < CAR_COUNT; i++) {
      var carGroup = new THREE.Group();
      var zPos = -i * (CAR_LENGTH + 0.5);

      // car body
      var body = _box(CAR_WIDTH, CAR_HEIGHT, CAR_LENGTH, 0x445566);
      carGroup.add(body);

      // roof
      var roof = _box(CAR_WIDTH + 0.2, 0.3, CAR_LENGTH + 0.2, 0x334455);
      roof.position.y = CAR_HEIGHT / 2 + 0.15;
      carGroup.add(roof);

      // floor
      var floor = _box(CAR_WIDTH - 0.1, 0.2, CAR_LENGTH - 0.1, 0x223344);
      floor.position.y = -CAR_HEIGHT / 2 + 0.1;
      carGroup.add(floor);

      // windows - LineSegments frames on each side
      for (var w = 0; w < 4; w++) {
        var wFrame = _lineBox(0.1, 1.0, 1.6, 0x88aacc);
        wFrame.position.set(CAR_WIDTH / 2, 0.3, -8 + w * 4.5);
        carGroup.add(wFrame);
        var wFrame2 = _lineBox(0.1, 1.0, 1.6, 0x88aacc);
        wFrame2.position.set(-CAR_WIDTH / 2, 0.3, -8 + w * 4.5);
        carGroup.add(wFrame2);
      }

      // car-specific interior
      if (i === 0) {
        _buildPassengerInterior(carGroup);
      } else if (i === 1) {
        _buildPassengerInterior(carGroup);
      } else if (i === 2) {
        _buildDiningInterior(carGroup);
      } else if (i === 3) {
        _buildPassengerInterior(carGroup);
      } else if (i === 4) {
        _buildPassengerInterior(carGroup);
      } else if (i === BOMB_CAR) {
        _buildCargoInterior(carGroup);
      } else if (i === 6) {
        _buildPassengerInterior(carGroup);
      } else if (i === LOCO_CAR) {
        _buildLocomotiveInterior(carGroup);
      }

      carGroup.position.set(0, 0, zPos);
      _scene.add(carGroup);
      _trainCars.push({ group: carGroup, index: i, z: zPos });

      // vestibule connector
      if (i < CAR_COUNT - 1) {
        var vest = _box(2.5, 2.5, 0.6, 0x334466);
        vest.position.set(0, -0.75, zPos - CAR_LENGTH / 2 - 0.3);
        _scene.add(vest);
        _vestibules.push({ mesh: vest, fromCar: i, toCar: i + 1, z: zPos - CAR_LENGTH / 2 - 0.3 });
      }

      // undercarriage / wheels
      for (var axle = 0; axle < 2; axle++) {
        var axleZ = zPos + (axle === 0 ? -CAR_LENGTH / 4 : CAR_LENGTH / 4);
        for (var side = -1; side <= 1; side += 2) {
          var wheel = _cylinder(0.6, 0.6, 0.3, 8, 0x222222);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(side * (CAR_WIDTH / 2 + 0.15), -CAR_HEIGHT / 2 - 0.4, axleZ - zPos);
          carGroup.add(wheel);
        }
      }
    }
  }

  function _buildPassengerInterior(g) {
    // seats in pairs
    for (var row = 0; row < 4; row++) {
      for (var side = -1; side <= 1; side += 2) {
        var seat = _box(0.8, 0.4, 0.9, 0x4455aa);
        seat.position.set(side * 1.2, -1.3, -7 + row * 4);
        g.add(seat);
        var back = _box(0.8, 0.8, 0.15, 0x3344aa);
        back.position.set(side * 1.2, -0.8, -7 + row * 4 + 0.4);
        g.add(back);
      }
    }
  }

  function _buildDiningInterior(g) {
    // tables
    for (var t = 0; t < 3; t++) {
      var table = _box(2.0, 0.1, 1.2, 0x886644);
      table.position.set(0, -0.9, -6 + t * 5);
      g.add(table);
      var leg1 = _box(0.15, 0.7, 0.15, 0x664422);
      leg1.position.set(-0.8, -1.3, -6 + t * 5);
      g.add(leg1);
      var leg2 = _box(0.15, 0.7, 0.15, 0x664422);
      leg2.position.set(0.8, -1.3, -6 + t * 5);
      g.add(leg2);
      // scattered food items
      var food = _sphere(0.12, 0xdd8833);
      food.position.set(-0.3, -0.82, -6 + t * 5 + 0.2);
      g.add(food);
      var cup = _cylinder(0.08, 0.06, 0.22, 6, 0xdddddd);
      cup.position.set(0.4, -0.79, -6 + t * 5 - 0.1);
      g.add(cup);
    }
    // chairs
    for (var c = 0; c < 3; c++) {
      for (var cs = -1; cs <= 1; cs += 2) {
        var chair = _box(0.55, 0.35, 0.5, 0x7766aa);
        chair.position.set(cs * 1.2, -1.15, -6 + c * 5);
        g.add(chair);
      }
    }
  }

  function _buildCargoInterior(g) {
    // crates
    var cratePositions = [
      [-1, -1.3, -7], [1, -1.3, -7], [0, -1.3, -3],
      [-1.3, -1.3, 1], [1.3, -1.3, 5], [-0.5, -1.3, 8]
    ];
    for (var ci = 0; ci < cratePositions.length; ci++) {
      var cp = cratePositions[ci];
      var crate = _box(1.2, 1.0, 1.0, 0x886644);
      crate.position.set(cp[0], cp[1], cp[2]);
      g.add(crate);
      var crateEdge = _lineBox(1.22, 1.02, 1.02, 0xaa8855);
      crateEdge.position.set(cp[0], cp[1], cp[2]);
      g.add(crateEdge);
    }
    // bomb device — red cylinder with wires
    var bombBase = _cylinder(0.35, 0.35, 0.7, 8, 0xaa2222);
    bombBase.position.set(0, -1.1, 3);
    g.add(bombBase);
    var bombTop = _cone(0.2, 0.35, 6, 0xff4444);
    bombTop.position.set(0, -0.7, 3);
    g.add(bombTop);
    var bombLight = _sphere(0.1, 0xff0000);
    bombLight.position.set(0, -0.6, 3);
    g.add(bombLight);
  }

  function _buildLocomotiveInterior(g) {
    // control panel - LineSegments
    var panel = _lineBox(3.0, 1.5, 0.2, 0x00ff88);
    panel.position.set(0, 0.2, -8.5);
    g.add(panel);
    // gauges
    for (var gi = 0; gi < 4; gi++) {
      var gauge = _sphere(0.15, 0x00ffaa);
      gauge.position.set(-1.2 + gi * 0.8, 0.5, -8.45);
      g.add(gauge);
    }
    // throttle lever
    var throttleBase = _box(0.2, 0.15, 0.2, 0x445566);
    throttleBase.position.set(-1.0, -0.5, -7.5);
    g.add(throttleBase);
    var throttleStick = _cylinder(0.05, 0.05, 0.8, 6, 0x88aa66);
    throttleStick.position.set(-1.0, -0.1, -7.5);
    throttleStick.rotation.z = 0.4;
    g.add(throttleStick);
    // emergency brake - red lever
    var brakeBase = _box(0.2, 0.15, 0.2, 0xaa2222);
    brakeBase.position.set(1.0, -0.5, -7.5);
    g.add(brakeBase);
    var brakeHandle = _cylinder(0.08, 0.08, 0.7, 6, 0xff2222);
    brakeHandle.position.set(1.0, -0.12, -7.5);
    g.add(brakeHandle);
    var brakeKnob = _sphere(0.12, 0xff4444);
    brakeKnob.position.set(1.0, 0.24, -7.5);
    g.add(brakeKnob);
    // driver seat
    var driverSeat = _box(0.9, 0.35, 0.8, 0x334455);
    driverSeat.position.set(0, -1.3, -7);
    g.add(driverSeat);
    // front window frame
    var frontWin = _lineBox(3.2, 2.0, 0.1, 0x88ccff);
    frontWin.position.set(0, 0.3, -9.9);
    g.add(frontWin);
  }

  function _buildScenery() {
    // passing scenery
    var sceneryDefs = [
      { x: -20, color: 0x223322, sx: 3, sy: 8, sz: 5 },
      { x: 20, color: 0x334433, sx: 4, sy: 6, sz: 4 },
      { x: -25, color: 0x445544, sx: 2, sy: 12, sz: 3 },
      { x: 22, color: 0x223322, sx: 5, sy: 4, sz: 6 },
      { x: -18, color: 0x556655, sx: 3, sy: 5, sz: 3 },
      { x: 26, color: 0x334433, sx: 6, sy: 9, sz: 5 },
      { x: -30, color: 0x445544, sx: 2, sy: 7, sz: 2 },
      { x: 18, color: 0x223322, sx: 4, sy: 3, sz: 7 },
      { x: -22, color: 0x2a4422, sx: 5, sy: 11, sz: 4 },
      { x: 30, color: 0x336633, sx: 3, sy: 6, sz: 3 }
    ];
    for (var i = 0; i < 40; i++) {
      var def = sceneryDefs[i % sceneryDefs.length];
      var s = _box(def.sx, def.sy, def.sz, def.color);
      var zOff = (i * 12) - 60;
      s.position.set(def.x + (Math.random() * 4 - 2), def.sy / 2 - 3.5, zOff);
      _scene.add(s);
      _scenery.push(s);
    }
  }

  function _spawnEnemies() {
    // 12 terrorists, 4 elite, 2 bomber twins
    var terrorDefs = [
      { car: 0, x: -1, z: -5, hp: 80, type: 'terror', color: 0x222222 },
      { car: 0, x: 1, z: 3, hp: 80, type: 'terror', color: 0x222222 },
      { car: 1, x: -1.2, z: -6, hp: 80, type: 'terror', color: 0x222222 },
      { car: 1, x: 1.2, z: 4, hp: 80, type: 'terror', color: 0x222222 },
      { car: 2, x: 0, z: -5, hp: 120, type: 'elite', color: 0x333322 },
      { car: 2, x: 1, z: 2, hp: 80, type: 'terror', color: 0x222222 },
      { car: 3, x: -1, z: -3, hp: 80, type: 'terror', color: 0x222222 },
      { car: 3, x: 1, z: 5, hp: 120, type: 'elite', color: 0x333322 },
      { car: 4, x: -1.2, z: -7, hp: 80, type: 'terror', color: 0x222222 },
      { car: 4, x: 0.8, z: 1, hp: 80, type: 'terror', color: 0x222222 },
      { car: 5, x: -1, z: -6, hp: 150, type: 'bomber', color: 0xaa2222 },
      { car: 5, x: 1, z: 4, hp: 150, type: 'bomber', color: 0xaa2222 },
      { car: 6, x: -1, z: -4, hp: 80, type: 'terror', color: 0x222222 },
      { car: 6, x: 1.2, z: 3, hp: 120, type: 'elite', color: 0x333322 },
      { car: 6, x: -0.5, z: 7, hp: 80, type: 'terror', color: 0x222222 },
      { car: 7, x: -1, z: -5, hp: 80, type: 'terror', color: 0x222222 },
      { car: 7, x: 1, z: -1, hp: 120, type: 'elite', color: 0x333322 },
      { car: 7, x: 0, z: 6, hp: 80, type: 'terror', color: 0x222222 }
    ];

    for (var i = 0; i < terrorDefs.length; i++) {
      var def = terrorDefs[i];
      var grp = new THREE.Group();
      // body
      var body = _box(0.7, 1.2, 0.5, def.color);
      grp.add(body);
      // head
      var head = _sphere(0.3, def.color === 0xaa2222 ? 0xcc3333 : 0x333333);
      head.position.y = 0.9;
      grp.add(head);
      // gun
      var gun = _box(0.1, 0.1, 0.7, 0x111111);
      gun.position.set(0.4, 0.2, -0.3);
      grp.add(gun);

      var carZ = -def.car * (CAR_LENGTH + 0.5);
      grp.position.set(def.x, -0.6, carZ + def.z);
      _scene.add(grp);

      _enemies.push({
        group: grp,
        hp: def.hp,
        maxHp: def.hp,
        type: def.type,
        car: def.car,
        localX: def.x,
        localZ: def.z,
        shootTimer: 1 + Math.random() * 2,
        moveTimer: 0,
        alive: true,
        alerted: false
      });
    }
  }

  function _spawnHostages() {
    var hostDefs = [
      { car: 0, x: 1.2, z: 7 },
      { car: 1, x: -1.2, z: -7 },
      { car: 2, x: 0, z: 7 },
      { car: 3, x: 1.2, z: -6 },
      { car: 4, x: -1.0, z: 6 },
      { car: 6, x: 0.8, z: -8 }
    ];
    for (var i = 0; i < hostDefs.length; i++) {
      var def = hostDefs[i];
      var grp = new THREE.Group();
      var body = _box(0.6, 1.0, 0.4, 0xddaa66);
      grp.add(body);
      var head = _sphere(0.28, 0xffcc99);
      head.position.y = 0.75;
      grp.add(head);
      var carZ = -def.car * (CAR_LENGTH + 0.5);
      grp.position.set(def.x, -0.75, carZ + def.z);
      _scene.add(grp);
      _hostages.push({
        group: grp,
        car: def.car,
        rescued: false,
        x: def.x,
        z: carZ + def.z
      });
    }
  }

  // ── shoot ──────────────────────────────────────────────────────────────────
  function _shoot() {
    if (_shootCooldown > 0 || _gameOver || _gameWon) return;
    _shootCooldown = 0.15;

    // Raycast from camera forward
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(_pitch, _yaw, 0, 'YXZ'));

    var origin = _camera.position.clone();
    var closest = null;
    var closestDist = 60;

    for (var i = 0; i < _enemies.length; i++) {
      var en = _enemies[i];
      if (!en.alive || en.hp <= 0) continue;
      var ep = en.group.position;
      var toE = ep.clone().sub(origin);
      var dot = toE.dot(dir);
      if (dot < 0 || dot > 60) continue;
      var proj = origin.clone().add(dir.clone().multiplyScalar(dot));
      var dist = proj.distanceTo(ep);
      if (dist < 1.2 && dot < closestDist) {
        closestDist = dot;
        closest = en;
      }
    }

    if (closest) {
      var nearBomber = false;
      if (closest.type === 'bomber') {
        // warn
        _warningFlash = 1.5;
        nearBomber = true;
      }
      var dmg = 40;
      closest.hp -= dmg;
      if (closest.hp <= 0) {
        closest.alive = false;
        closest.hp = 0;
        if (nearest) {} // suppress unused
        if (closest.type === 'bomber' && !_bombDefused) {
          _bombDetonated = true;
          _triggerLose('BOMB DETONATED!<br>MISSION FAILED');
        } else {
          closest.group.visible = false;
        }
      }
      // spawn hit flash
      var flash = _sphere(0.15, 0xff4400);
      flash.position.copy(closest.group.position).add(new THREE.Vector3(0, 0.5, 0));
      _scene.add(flash);
      _bullets.push({ mesh: flash, life: 0.12 });
    }

    // muzzle flash
    var mFlash = _sphere(0.08, 0xffcc44);
    mFlash.position.copy(_camera.position).add(dir.clone().multiplyScalar(0.5));
    _scene.add(mFlash);
    _bullets.push({ mesh: mFlash, life: 0.06 });
  }

  // ── game logic ─────────────────────────────────────────────────────────────
  function _triggerWin() {
    _gameWon = true;
    _showOverlay('MISSION COMPLETE!<br><span style="font-size:18px;color:#0f0">All hostages rescued, bomb defused, train stopped.<br>Press ESC to exit.</span>', '#0f0');
  }

  function _triggerLose(msg) {
    _gameOver = true;
    _showOverlay(msg + '<br><span style="font-size:18px;color:#f88">Press ESC to exit.</span>', '#f44');
  }

  function _checkWin() {
    if (_hostagesRescued >= 6 && _bombDefused && _brakeActive) {
      _triggerWin();
    }
  }

  function _interactE(dt) {
    if (!_keys['KeyE']) {
      _eHolding = false;
      _eHoldTime = 0;
      return;
    }
    _eHolding = true;

    var pp = _camera.position;

    // Check hostage rescue
    for (var i = 0; i < _hostages.length; i++) {
      var h = _hostages[i];
      if (h.rescued) continue;
      var dist = pp.distanceTo(h.group.position);
      if (dist < 3.5) {
        h.rescued = true;
        _hostagesRescued++;
        h.group.visible = false;
        return;
      }
    }

    // Check bomb defuse (car 5)
    var carZ5 = -BOMB_CAR * (CAR_LENGTH + 0.5);
    var bombWorldPos = new THREE.Vector3(0, -1.1, carZ5 + 3);
    if (pp.distanceTo(bombWorldPos) < 4.5 && !_bombDefused) {
      _eHoldTime += dt;
      if (_eHoldTime >= 6.0) {
        _bombDefused = true;
        _eHoldTime = 0;
      }
      return;
    }

    // Check brake pull (locomotive)
    var locoZ = -LOCO_CAR * (CAR_LENGTH + 0.5);
    var brakeWorldPos = new THREE.Vector3(1.0, -0.12, locoZ - 7.5);
    if (pp.distanceTo(brakeWorldPos) < 4.5 && !_brakeActive) {
      _eHoldTime += dt;
      if (_eHoldTime >= 3.0) {
        _brakeActive = true;
        _trainSpeed = 0;
        _eHoldTime = 0;
      }
      return;
    }

    _eHoldTime = 0;
  }

  function _updateEnemies(dt) {
    var pp = _camera.position;
    for (var i = 0; i < _enemies.length; i++) {
      var en = _enemies[i];
      if (!en.alive || en.hp <= 0) continue;

      var dist = pp.distanceTo(en.group.position);
      if (dist < 15) en.alerted = true;

      if (en.alerted) {
        // rotate toward player
        var dx = pp.x - en.group.position.x;
        var dz = pp.z - en.group.position.z;
        en.group.rotation.y = Math.atan2(dx, dz);

        // shoot at player
        en.shootTimer -= dt;
        if (en.shootTimer <= 0) {
          var shootInterval = en.type === 'elite' ? 1.8 : 2.5;
          if (en.type === 'bomber') shootInterval = 3.0;
          en.shootTimer = shootInterval + Math.random() * 0.8;
          if (dist < 20) {
            var accuracy = en.type === 'elite' ? 0.6 : 0.35;
            if (Math.random() < accuracy) {
              var dmg2 = en.type === 'elite' ? 18 : 12;
              _playerHP -= dmg2;
              if (_playerHP <= 0) {
                _playerHP = 0;
                _triggerLose('YOU WERE KILLED<br>MISSION FAILED');
              }
            }
          }
        }

        // patrol small movement
        en.moveTimer -= dt;
        if (en.moveTimer <= 0) {
          en.moveTimer = 1.5 + Math.random();
          var mx = (Math.random() - 0.5) * 0.8;
          var mz = (Math.random() - 0.5) * 0.8;
          en.group.position.x = Math.max(-1.6, Math.min(1.6, en.group.position.x + mx));
          en.group.position.z += mz;
        }
      }
    }
  }

  function _updatePlayer(dt) {
    var moveSpeed = 6.0;
    var fwd = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, _yaw, 0));
    var right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, _yaw, 0));

    var move = new THREE.Vector3();
    if (_keys['KeyW'] || _keys['ArrowUp']) move.add(fwd);
    if (_keys['KeyS'] || _keys['ArrowDown']) move.sub(fwd);
    if (_keys['KeyA'] || _keys['ArrowLeft']) move.sub(right);
    if (_keys['KeyD'] || _keys['ArrowRight']) move.add(right);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(moveSpeed * dt);
      _camera.position.add(move);
    }

    // clamp to train interior bounds (X within car width, Y fixed)
    _camera.position.x = Math.max(-1.5, Math.min(1.5, _camera.position.x));
    _camera.position.y = 0.5; // eye height above floor

    // Determine current car from Z
    var pz = _camera.position.z;
    _playerCar = 0;
    for (var c = 0; c < CAR_COUNT; c++) {
      var carCenterZ = -c * (CAR_LENGTH + 0.5);
      if (pz <= carCenterZ + CAR_LENGTH / 2 && pz >= carCenterZ - CAR_LENGTH / 2) {
        _playerCar = c;
        break;
      }
    }

    // Clamp Z within train extent + vestibule passage
    var trainFront = 0 + CAR_LENGTH / 2;
    var trainBack = -(CAR_COUNT - 1) * (CAR_LENGTH + 0.5) - CAR_LENGTH / 2;
    _camera.position.z = Math.max(trainBack, Math.min(trainFront, _camera.position.z));

    // mouse look
    var sens = 0.002;
    _yaw -= _mouseDX * sens;
    _pitch -= _mouseDY * sens;
    _pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, _pitch));
    _mouseDX = 0;
    _mouseDY = 0;
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;
  }

  function _updateScenery(dt) {
    // Scroll scenery to simulate train movement
    if (_brakeActive) return;
    var scrollSpeed = 30 * dt;
    for (var i = 0; i < _scenery.length; i++) {
      _scenery[i].position.z += scrollSpeed;
      if (_scenery[i].position.z > 80) {
        _scenery[i].position.z -= 160;
      }
    }
    // camera shake for speed wobble
    var wobble = _brakeActive ? 0 : 0.03;
    _shakeX = (Math.random() - 0.5) * wobble;
    _shakeY = (Math.random() - 0.5) * wobble * 0.4;
  }

  function _updateBullets(dt) {
    for (var i = _bullets.length - 1; i >= 0; i--) {
      _bullets[i].life -= dt;
      if (_bullets[i].life <= 0) {
        _scene.remove(_bullets[i].mesh);
        _bullets.splice(i, 1);
      }
    }
  }

  // ── main update ────────────────────────────────────────────────────────────
  function _update(timestamp) {
    if (!_active) return;
    requestAnimationFrame(_update);

    var dt = Math.min((timestamp - _lastTime) / 1000, 0.05);
    _lastTime = timestamp;

    if (!_gameOver && !_gameWon) {
      // countdown timer
      if (!_brakeActive) {
        _trainTimer -= dt;
        if (_trainTimer <= 0) {
          _trainTimer = 0;
          _triggerLose('TRAIN DERAILED!<br>MISSION FAILED');
          return;
        }
      }

      // speed display
      if (!_brakeActive) {
        _trainSpeed = Math.round(220 + Math.sin(timestamp * 0.001) * 5);
      }

      _updatePlayer(dt);
      _updateEnemies(dt);
      _interactE(dt);
      _updateScenery(dt);
      _updateBullets(dt);

      if (_shootCooldown > 0) _shootCooldown -= dt;
      if (_warningFlash > 0) _warningFlash -= dt;

      _checkWin();
    }

    // apply shake
    var baseX = _camera.position.x;
    var baseY = _camera.position.y;
    _camera.position.x += _shakeX;
    _camera.position.y += _shakeY;

    _renderer.render(_scene, _camera);

    _camera.position.x = baseX;
    _camera.position.y = baseY;

    _updateHUD();
  }

  // ── init / activate ────────────────────────────────────────────────────────
  function _activate() {
    if (_active) return;
    _active = true;

    _container = document.createElement('div');
    _container.id = 'th-container';
    _container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:10000;background:#000;';
    document.body.appendChild(_container);

    _renderer = new THREE.WebGLRenderer({ antialias: true });
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _renderer.setClearColor(0x112211);
    _container.appendChild(_renderer.domElement);

    _scene = new THREE.Scene();
    _scene.fog = new THREE.Fog(0x335533, 20, 120);

    _camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    _camera.position.set(0, 0.5, 5); // start in first car
    _camera.rotation.order = 'YXZ';

    // lighting
    var ambient = new THREE.AmbientLight(0x334433, 0.8);
    _scene.add(ambient);
    var dirLight = new THREE.DirectionalLight(0x88aacc, 0.6);
    dirLight.position.set(5, 10, 5);
    _scene.add(dirLight);
    // interior point lights per car
    for (var li = 0; li < CAR_COUNT; li++) {
      var ptLight = new THREE.PointLight(0xaabbaa, 0.5, 25);
      ptLight.position.set(0, 1.5, -li * (CAR_LENGTH + 0.5));
      _scene.add(ptLight);
    }

    // ground/track
    var ground = _box(200, 0.3, 300, 0x223322);
    ground.position.set(0, -3.0, -80);
    _scene.add(ground);
    // rail tracks
    for (var rail = -1; rail <= 1; rail += 2) {
      var track = _box(0.2, 0.1, 280, 0x445544);
      track.position.set(rail * 1.0, -2.85, -80);
      _scene.add(track);
    }

    _playerHP = 100;
    _playerCar = 0;
    _hostagesRescued = 0;
    _bombDefused = false;
    _brakeActive = false;
    _gameOver = false;
    _gameWon = false;
    _trainTimer = 480;
    _trainSpeed = 220;
    _enemies = [];
    _hostages = [];
    _bullets = [];
    _scenery = [];
    _trainCars = [];
    _vestibules = [];
    _yaw = 0;
    _pitch = 0;
    _mouseDX = 0;
    _mouseDY = 0;
    _eHoldTime = 0;
    _eHolding = false;
    _warningFlash = 0;
    _shakeX = 0;
    _shakeY = 0;
    _shootCooldown = 0;

    _buildTrain();
    _buildScenery();
    _spawnEnemies();
    _spawnHostages();
    _createHUD();

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup', _onKeyUp);
    document.addEventListener('mousemove', _onMouseMove);
    document.addEventListener('mousedown', _onMouseDown);
    document.addEventListener('pointerlockchange', _onPointerLockChange);

    _container.addEventListener('click', function () {
      _container.requestPointerLock();
    });
    _container.requestPointerLock();

    window.addEventListener('resize', _onResize);

    _lastTime = performance.now();
    requestAnimationFrame(_update);
  }

  function _onResize() {
    if (!_active || !_renderer || !_camera) return;
    _camera.aspect = window.innerWidth / window.innerHeight;
    _camera.updateProjectionMatrix();
    _renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function _deactivate() {
    if (!_active) return;
    _active = false;

    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup', _onKeyUp);
    document.removeEventListener('mousemove', _onMouseMove);
    document.removeEventListener('mousedown', _onMouseDown);
    document.removeEventListener('pointerlockchange', _onPointerLockChange);
    window.removeEventListener('resize', _onResize);

    if (document.exitPointerLock) document.exitPointerLock();

    if (_renderer) {
      _renderer.dispose();
      _renderer = null;
    }
    if (_container && _container.parentNode) {
      _container.parentNode.removeChild(_container);
      _container = null;
    }
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
      _hudEl = null;
    }
    if (_overlayEl && _overlayEl.parentNode) {
      _overlayEl.parentNode.removeChild(_overlayEl);
      _overlayEl = null;
    }

    _scene = null;
    _camera = null;
    _enemies = [];
    _hostages = [];
    _bullets = [];
    _scenery = [];
    _trainCars = [];
    _vestibules = [];
  }

  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    document.addEventListener('keydown', function (e) {
      if (e.code === 'KeyT') _lastTTime = performance.now();
      if (e.code === 'KeyH') {
        _lastHTime = performance.now();
        if (!_active && (_lastHTime - _lastTTime) < 400 && _lastTTime > 0) {
          _activate();
        }
      }
      if (e.code === 'Escape' && _active) _deactivate();
    });
  }

  function update() { /* called externally if needed, main loop is self-driven */ }

  function reset() {
    _deactivate();
    _lastTTime = 0;
    _lastHTime = 0;
  }

  return { init: init, update: update, reset: reset };
})();
