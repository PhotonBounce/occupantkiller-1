window.ColosseumBattle = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // ── Activation key sequence: C then B within 400ms ──────────────────────────
  var _active = false;
  var _lastCTime = 0;
  var _scene, _camera, _renderer, _clock;

  // ── Game state ───────────────────────────────────────────────────────────────
  var STATE = { INACTIVE: 0, PLAYING: 1, REST: 2, BOSS: 3, WIN: 4, DEAD: 5 };
  var _state = STATE.INACTIVE;
  var _round = 0;
  var _enemies = [];
  var _projectiles = [];
  var _enemyProjectiles = [];
  var _healthPickups = [];
  var _trapdoorTimer = 0;
  var _restTimer = 0;
  var _crowdMultiplier = 1;
  var _lastKillTime = 0;
  var _score = 0;
  var _playerHP = 100;
  var _maxPlayerHP = 100;
  var _keys = {};
  var _mouse = { x: 0, y: 0, dx: 0, dy: 0, buttons: 0 };
  var _yaw = 0;
  var _pitch = 0;
  var _velocity = { x: 0, y: 0, z: 0 };
  var _onGround = true;
  var _shootCooldown = 0;
  var _gameContainer = null;
  var _hud = null;
  var _animFrame = null;
  var _gateOpen = false;
  var _gateTimer = 0;

  // ── Arena meshes ─────────────────────────────────────────────────────────────
  var _arenaFloor = null;
  var _arenaWalls = [];
  var _bleachers = [];
  var _trapdoors = [];
  var _firePits = [];
  var _emperorBox = null;
  var _weaponRacks = [];
  var _gateMesh = null;
  var _archLines = [];

  // ── Constants ────────────────────────────────────────────────────────────────
  var ARENA_RADIUS = 28;
  var ARENA_HEIGHT = 1;
  var WALL_HEIGHT = 10;
  var WALL_COUNT = 24;
  var PLAYER_SPEED = 8;
  var PLAYER_HEIGHT = 1.7;
  var GRAVITY = -18;
  var JUMP_SPEED = 7;
  var SHOOT_RATE = 0.25;
  var BULLET_SPEED = 40;
  var BULLET_DAMAGE = 25;
  var FIRE_PIT_DAMAGE = 15;
  var TRAPDOOR_INTERVAL = 30;
  var REST_DURATION = 10;
  var QUICK_KILL_WINDOW = 5;
  var MAX_MULTIPLIER = 6;

  // ── Round definitions ────────────────────────────────────────────────────────
  var ROUNDS = [
    { enemies: [ { type: 'gladiator', count: 3 } ] },
    { enemies: [ { type: 'gladiator', count: 4 }, { type: 'archer', count: 2 } ] },
    { enemies: [ { type: 'gladiator', count: 5 }, { type: 'champion', count: 2 } ] },
    { enemies: [ { type: 'champion', count: 4 }, { type: 'beast_handler', count: 2 } ] },
    { enemies: [ { type: 'boss', count: 1 } ] }
  ];

  var ENEMY_DEFS = {
    gladiator:     { hp: 80,  color: 0x886633, speed: 3.5, range: 1.8, damage: 8,  scale: 1.0, ranged: false },
    archer:        { hp: 90,  color: 0x775522, speed: 2.8, range: 18,  damage: 12, scale: 0.95,ranged: true  },
    champion:      { hp: 150, color: 0x554422, speed: 2.5, range: 1.8, damage: 18, scale: 1.2, ranged: false },
    beast_handler: { hp: 100, color: 0x443311, speed: 3.0, range: 2.2, damage: 14, scale: 1.1, ranged: false },
    boss:          { hp: 550, color: 0x331100, speed: 4.2, range: 2.0, damage: 22, scale: 1.4, ranged: false, shield: true }
  };

  // ── Key handler ──────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    _keys[e.code] = true;
    if (e.code === 'KeyC') { _lastCTime = performance.now(); }
    if (e.code === 'KeyB' && performance.now() - _lastCTime < 400) {
      if (!_active) { _startGame(); } else { _stopGame(); }
    }
    if (e.code === 'Space' && _active && _onGround) {
      _velocity.y = JUMP_SPEED;
      _onGround = false;
    }
    if (e.code === 'KeyR' && _active && (_state === STATE.WIN || _state === STATE.DEAD)) {
      reset();
      _startGame();
    }
  }

  function _onKeyUp(e) { _keys[e.code] = false; }

  function _onMouseMove(e) {
    if (!_active) return;
    _mouse.dx += e.movementX || 0;
    _mouse.dy += e.movementY || 0;
  }

  function _onMouseDown(e) {
    if (!_active) return;
    _mouse.buttons = e.buttons;
    if (e.button === 0 && _state === STATE.PLAYING) { _tryShoot(); }
  }

  function _onMouseUp(e) { _mouse.buttons = e.buttons; }

  function _onPointerLock() {
    if (_active) {
      _gameContainer.requestPointerLock();
    }
  }

  // ── Scene setup ──────────────────────────────────────────────────────────────
  function _buildScene() {
    _scene = new THREE.Scene();
    _scene.background = new THREE.Color(0x1a0a00);
    _scene.fog = new THREE.Fog(0x1a0a00, 30, 80);

    _camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    _camera.position.set(0, PLAYER_HEIGHT, 5);

    _renderer = new THREE.WebGLRenderer({ antialias: true });
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _renderer.shadowMap.enabled = true;
    _renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    _gameContainer.appendChild(_renderer.domElement);

    // Lighting
    var ambient = new THREE.AmbientLight(0x331100, 0.8);
    _scene.add(ambient);

    var sunLight = new THREE.DirectionalLight(0xffaa44, 1.2);
    sunLight.position.set(10, 30, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -40;
    sunLight.shadow.camera.right = 40;
    sunLight.shadow.camera.top = 40;
    sunLight.shadow.camera.bottom = -40;
    _scene.add(sunLight);

    var fillLight = new THREE.PointLight(0xff6600, 1.5, 40);
    fillLight.position.set(-10, 5, -10);
    _scene.add(fillLight);

    var fillLight2 = new THREE.PointLight(0xffaa00, 1.2, 35);
    fillLight2.position.set(10, 5, 10);
    _scene.add(fillLight2);

    _buildArena();
    _buildBleachers();
    _buildWalls();
    _buildEmperorBox();
    _buildWeaponRacks();
    _buildTrapdoors();
    _buildFirePits();
    _buildGate();
    _clock = new THREE.Clock();
  }

  // ── Arena floor (CylinderGeometry pit) ──────────────────────────────────────
  function _buildArena() {
    var floorGeo = new THREE.CylinderGeometry(ARENA_RADIUS, ARENA_RADIUS, ARENA_HEIGHT, 48);
    var floorMat = new THREE.MeshLambertMaterial({ color: 0xc8a060 });
    _arenaFloor = new THREE.Mesh(floorGeo, floorMat);
    _arenaFloor.position.y = -ARENA_HEIGHT / 2;
    _arenaFloor.receiveShadow = true;
    _scene.add(_arenaFloor);

    // Sand texture variation: scattered dark patches
    for (var i = 0; i < 30; i++) {
      var patchGeo = new THREE.CylinderGeometry(
        0.4 + Math.random() * 1.2, 0.4 + Math.random() * 1.2, 0.02, 8
      );
      var patchMat = new THREE.MeshLambertMaterial({
        color: Math.random() > 0.5 ? 0xb08040 : 0xa06828
      });
      var patch = new THREE.Mesh(patchGeo, patchMat);
      var angle = Math.random() * Math.PI * 2;
      var r = Math.random() * (ARENA_RADIUS - 3);
      patch.position.set(
        Math.cos(angle) * r,
        0.01,
        Math.sin(angle) * r
      );
      _scene.add(patch);
    }
  }

  // ── Bleachers (BoxGeometry tiers with spectator props) ──────────────────────
  function _buildBleachers() {
    var TIERS = 5;
    for (var tier = 0; tier < TIERS; tier++) {
      var r = ARENA_RADIUS + 2 + tier * 2.5;
      var seatsH = 1.5 + tier * 0.4;
      var seatsGeo = new THREE.BoxGeometry(r * 2, seatsH, r * 2);
      // We use ring segments so we approximate with many thin boxes
      var segCount = 32;
      for (var s = 0; s < segCount; s++) {
        var a0 = (s / segCount) * Math.PI * 2;
        var a1 = ((s + 1) / segCount) * Math.PI * 2;
        var midA = (a0 + a1) / 2;
        var segW = 2 * Math.sin(Math.PI / segCount) * r * 1.05;
        var segD = 2.4;
        var bleacherGeo = new THREE.BoxGeometry(segW, seatsH, segD);
        var bleacherMat = new THREE.MeshLambertMaterial({
          color: tier % 2 === 0 ? 0x8b7355 : 0x7a6344
        });
        var bleacher = new THREE.Mesh(bleacherGeo, bleacherMat);
        bleacher.position.set(
          Math.cos(midA) * (r + 1),
          -0.25 + tier * 0.5,
          Math.sin(midA) * (r + 1)
        );
        bleacher.rotation.y = -midA;
        bleacher.receiveShadow = true;
        bleacher.castShadow = true;
        _scene.add(bleacher);
        _bleachers.push(bleacher);
      }
    }

    // Spectator props (small colored boxes representing crowd heads)
    for (var c = 0; c < 120; c++) {
      var crowdAngle = Math.random() * Math.PI * 2;
      var crowdR = ARENA_RADIUS + 3 + Math.random() * 10;
      var crowdTier = Math.floor(Math.random() * 5);
      var headGeo = new THREE.SphereGeometry(0.25, 4, 4);
      var headColors = [0xffddcc, 0xffcc99, 0xeeaa77, 0xcc8855, 0x996644];
      var headMat = new THREE.MeshLambertMaterial({ color: headColors[Math.floor(Math.random() * 5)] });
      var head = new THREE.Mesh(headGeo, headMat);
      head.position.set(
        Math.cos(crowdAngle) * crowdR,
        crowdTier * 0.5 + 0.6,
        Math.sin(crowdAngle) * crowdR
      );
      _scene.add(head);
    }
  }

  // ── Arena walls (BoxGeometry curved segments) ────────────────────────────────
  function _buildWalls() {
    for (var w = 0; w < WALL_COUNT; w++) {
      var a = (w / WALL_COUNT) * Math.PI * 2;
      var aNext = ((w + 1) / WALL_COUNT) * Math.PI * 2;
      var midAngle = (a + aNext) / 2;
      // Skip one segment for the main gate (south)
      if (w === 0) continue;
      var segW = 2 * Math.sin(Math.PI / WALL_COUNT) * ARENA_RADIUS * 1.05;
      var wallGeo = new THREE.BoxGeometry(segW, WALL_HEIGHT, 1.2);
      var wallMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
      var wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(
        Math.cos(midAngle) * ARENA_RADIUS,
        WALL_HEIGHT / 2,
        Math.sin(midAngle) * ARENA_RADIUS
      );
      wall.rotation.y = -midAngle;
      wall.castShadow = true;
      wall.receiveShadow = true;
      _scene.add(wall);
      _arenaWalls.push(wall);
    }
  }

  // ── Gate with LineSegments arch ──────────────────────────────────────────────
  function _buildGate() {
    // Gate frame (BoxGeometry pillars)
    var pillarGeo = new THREE.BoxGeometry(0.8, WALL_HEIGHT, 1.2);
    var pillarMat = new THREE.MeshLambertMaterial({ color: 0x6b5335 });

    var pillarL = new THREE.Mesh(pillarGeo, pillarMat);
    pillarL.position.set(-2.2, WALL_HEIGHT / 2, ARENA_RADIUS);
    pillarL.castShadow = true;
    _scene.add(pillarL);

    var pillarR = new THREE.Mesh(pillarGeo, pillarMat);
    pillarR.position.set(2.2, WALL_HEIGHT / 2, ARENA_RADIUS);
    pillarR.castShadow = true;
    _scene.add(pillarR);

    // Gate door (BoxGeometry hatch)
    var gateGeo = new THREE.BoxGeometry(4, 5, 0.3);
    var gateMat = new THREE.MeshLambertMaterial({ color: 0x4a3520 });
    _gateMesh = new THREE.Mesh(gateGeo, gateMat);
    _gateMesh.position.set(0, 2.5, ARENA_RADIUS);
    _gateMesh.castShadow = true;
    _scene.add(_gateMesh);

    // Arch (LineSegments)
    var archPoints = [];
    var archSegs = 16;
    for (var i = 0; i <= archSegs; i++) {
      var angle = Math.PI * (i / archSegs);
      archPoints.push(Math.cos(angle) * 2.5, 5 + Math.sin(angle) * 2.0, ARENA_RADIUS + 0.1);
    }
    var archGeo = new THREE.BufferGeometry();
    var archVerts = [];
    for (var i = 0; i < archPoints.length / 3 - 1; i++) {
      archVerts.push(archPoints[i*3], archPoints[i*3+1], archPoints[i*3+2]);
      archVerts.push(archPoints[(i+1)*3], archPoints[(i+1)*3+1], archPoints[(i+1)*3+2]);
    }
    archGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(archVerts), 3));
    var archLine = new THREE.LineSegments(archGeo, new THREE.LineBasicMaterial({ color: 0xffd700, linewidth: 2 }));
    _scene.add(archLine);
    _archLines.push(archLine);
  }

  // ── Emperor's box ────────────────────────────────────────────────────────────
  function _buildEmperorBox() {
    var boxGeo = new THREE.BoxGeometry(10, 3, 5);
    var boxMat = new THREE.MeshLambertMaterial({ color: 0x6b4010 });
    _emperorBox = new THREE.Mesh(boxGeo, boxMat);
    _emperorBox.position.set(0, 4.5, -(ARENA_RADIUS + 4));
    _emperorBox.castShadow = true;
    _emperorBox.receiveShadow = true;
    _scene.add(_emperorBox);

    // Throne
    var throneGeo = new THREE.BoxGeometry(1.5, 2, 1.5);
    var throneMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
    var throne = new THREE.Mesh(throneGeo, throneMat);
    throne.position.set(0, 7, -(ARENA_RADIUS + 4));
    _scene.add(throne);

    // Ornate decorations (LineSegments)
    var decorVerts = [
      -5, 6, -(ARENA_RADIUS + 1.5),  5, 6, -(ARENA_RADIUS + 1.5),
      -5, 6, -(ARENA_RADIUS + 1.5), -5, 9, -(ARENA_RADIUS + 1.5),
       5, 6, -(ARENA_RADIUS + 1.5),  5, 9, -(ARENA_RADIUS + 1.5),
      -5, 9, -(ARENA_RADIUS + 1.5),  5, 9, -(ARENA_RADIUS + 1.5),
       0, 9, -(ARENA_RADIUS + 1.5),  0,11, -(ARENA_RADIUS + 1.5),
      -2, 10,-(ARENA_RADIUS + 1.5),  2,10, -(ARENA_RADIUS + 1.5)
    ];
    var decorGeo = new THREE.BufferGeometry();
    decorGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(decorVerts), 3));
    var decorLines = new THREE.LineSegments(decorGeo, new THREE.LineBasicMaterial({ color: 0xffd700 }));
    _scene.add(decorLines);

    // Emperor figure (simple box stack)
    var empBodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.5);
    var empMat = new THREE.MeshLambertMaterial({ color: 0xcc2222 });
    var empBody = new THREE.Mesh(empBodyGeo, empMat);
    empBody.position.set(0, 7.6, -(ARENA_RADIUS + 4));
    _scene.add(empBody);
    var empHeadGeo = new THREE.SphereGeometry(0.3, 6, 6);
    var empHead = new THREE.Mesh(empHeadGeo, new THREE.MeshLambertMaterial({ color: 0xffcc99 }));
    empHead.position.set(0, 8.5, -(ARENA_RADIUS + 4));
    _scene.add(empHead);
  }

  // ── Weapon racks ─────────────────────────────────────────────────────────────
  function _buildWeaponRacks() {
    var rackPositions = [
      { x: -ARENA_RADIUS + 3, z: 0 },
      { x:  ARENA_RADIUS - 3, z: 0 },
      { x: 0, z: -ARENA_RADIUS + 3 }
    ];
    for (var i = 0; i < rackPositions.length; i++) {
      var pos = rackPositions[i];
      var rackGeo = new THREE.BoxGeometry(3, 0.15, 0.5);
      var rackMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1a });
      var rack = new THREE.Mesh(rackGeo, rackMat);
      rack.position.set(pos.x, 1.5, pos.z);
      rack.castShadow = true;
      _scene.add(rack);
      _weaponRacks.push(rack);

      // Prop weapons (LineSegments swords)
      for (var w = 0; w < 3; w++) {
        var swordVerts = [
          pos.x + (w-1) * 0.9, 1.6, pos.z,
          pos.x + (w-1) * 0.9, 2.8, pos.z
        ];
        var sGeo = new THREE.BufferGeometry();
        sGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(swordVerts), 3));
        var sword = new THREE.LineSegments(sGeo, new THREE.LineBasicMaterial({ color: 0xcccccc }));
        _scene.add(sword);
      }

      // Support posts
      var postGeo = new THREE.BoxGeometry(0.15, 1.5, 0.15);
      var postMat = new THREE.MeshLambertMaterial({ color: 0x4a2a0a });
      for (var p = 0; p < 2; p++) {
        var post = new THREE.Mesh(postGeo, postMat);
        post.position.set(pos.x + (p === 0 ? -1.3 : 1.3), 0.75, pos.z);
        _scene.add(post);
      }
    }
  }

  // ── Trapdoors ────────────────────────────────────────────────────────────────
  function _buildTrapdoors() {
    var tdPositions = [
      { x: -8, z: -8 },
      { x:  8, z: -8 },
      { x: -8, z:  8 },
      { x:  8, z:  8 }
    ];
    for (var i = 0; i < tdPositions.length; i++) {
      var pos = tdPositions[i];
      var tdGeo = new THREE.BoxGeometry(2, 0.12, 2);
      var tdMat = new THREE.MeshLambertMaterial({ color: 0x3a2a10 });
      var td = new THREE.Mesh(tdGeo, tdMat);
      td.position.set(pos.x, 0.06, pos.z);
      td.castShadow = true;
      _scene.add(td);
      _trapdoors.push({ mesh: td, origY: 0.06, open: false, timer: 0, pos: pos });
    }
  }

  // ── Fire pits ─────────────────────────────────────────────────────────────────
  function _buildFirePits() {
    var fpPositions = [
      { x: -ARENA_RADIUS + 5, z: 5 },
      { x:  ARENA_RADIUS - 5, z: -5 }
    ];
    for (var i = 0; i < fpPositions.length; i++) {
      var pos = fpPositions[i];
      var fpGeo = new THREE.BoxGeometry(3, 0.5, 3);
      var fpMat = new THREE.MeshLambertMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.8 });
      var fp = new THREE.Mesh(fpGeo, fpMat);
      fp.position.set(pos.x, 0.25, pos.z);
      _scene.add(fp);
      _firePits.push({ mesh: fp, pos: pos });

      // Fire particle effect (cone geometry)
      for (var f = 0; f < 5; f++) {
        var flameGeo = new THREE.ConeGeometry(0.2 + Math.random()*0.3, 1.0 + Math.random()*0.8, 6);
        var flameMat = new THREE.MeshLambertMaterial({ color: 0xff6600, emissive: 0xff2200, emissiveIntensity: 1.0 });
        var flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.set(
          pos.x + (Math.random()-0.5)*2,
          0.9 + Math.random()*0.5,
          pos.z + (Math.random()-0.5)*2
        );
        flame.userData.isFlame = true;
        flame.userData.baseY = flame.position.y;
        flame.userData.speed = 1.5 + Math.random() * 2;
        flame.userData.phase = Math.random() * Math.PI * 2;
        _scene.add(flame);
        _firePits[i].flames = _firePits[i].flames || [];
        _firePits[i].flames.push(flame);
      }
    }
  }

  // ── Spawn enemy ──────────────────────────────────────────────────────────────
  function _spawnEnemy(type, spawnPos) {
    var def = ENEMY_DEFS[type];
    var pos = spawnPos || { x: (Math.random()-0.5)*10, z: ARENA_RADIUS - 4 };

    // Body
    var bodyGeo = new THREE.BoxGeometry(0.8 * def.scale, 1.4 * def.scale, 0.5 * def.scale);
    var bodyMat = new THREE.MeshLambertMaterial({ color: def.color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;

    // Head
    var headGeo = new THREE.SphereGeometry(0.3 * def.scale, 8, 8);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xffcc99 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.0 * def.scale;
    body.add(head);

    // Helmet (for champions/boss)
    if (type === 'champion' || type === 'boss') {
      var helmGeo = new THREE.CylinderGeometry(0.32 * def.scale, 0.34 * def.scale, 0.35 * def.scale, 8);
      var helmMat = new THREE.MeshLambertMaterial({ color: type === 'boss' ? 0x880000 : 0x888866 });
      var helm = new THREE.Mesh(helmGeo, helmMat);
      helm.position.y = 0.18 * def.scale;
      head.add(helm);
    }

    // Weapon (LineSegments)
    var weapVerts = def.ranged ?
      [ 0.5 * def.scale, 0, 0, 1.2 * def.scale, 0, 0 ] :  // arrow nocked
      [ 0.5 * def.scale, 0, 0, 0.5 * def.scale, 0.8 * def.scale, 0 ]; // sword up
    var weapGeo = new THREE.BufferGeometry();
    weapGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(weapVerts), 3));
    var weap = new THREE.LineSegments(weapGeo, new THREE.LineBasicMaterial({ color: 0xcccccc }));
    body.add(weap);

    // Shield for boss (BoxGeometry)
    var shieldMesh = null;
    if (type === 'boss') {
      var shieldGeo = new THREE.BoxGeometry(0.15, 1.2, 0.8);
      var shieldMat = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
      shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
      shieldMesh.position.set(-0.65 * def.scale, 0, 0);
      body.add(shieldMesh);
    }

    body.position.set(pos.x, 0.7 * def.scale, pos.z);
    _scene.add(body);

    var enemy = {
      mesh: body,
      type: type,
      hp: def.hp,
      maxHp: def.hp,
      speed: def.speed,
      range: def.range,
      damage: def.damage,
      ranged: def.ranged,
      shield: def.shield || false,
      shieldMesh: shieldMesh,
      dead: false,
      attackTimer: Math.random() * 2,
      strafeDir: Math.random() > 0.5 ? 1 : -1,
      strafeTimer: 0,
      flankPhase: 0,
      alertTimer: 0
    };
    _enemies.push(enemy);
    return enemy;
  }

  // ── Shoot (player) ───────────────────────────────────────────────────────────
  function _tryShoot() {
    if (_shootCooldown > 0) return;
    _shootCooldown = SHOOT_RATE;

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(_pitch, _yaw, 0, 'YXZ'));

    var bulletGeo = new THREE.SphereGeometry(0.08, 4, 4);
    var bulletMat = new THREE.MeshLambertMaterial({ color: 0xffff00, emissive: 0xaaaa00 });
    var bullet = new THREE.Mesh(bulletGeo, bulletMat);
    bullet.position.copy(_camera.position);

    _scene.add(bullet);
    _projectiles.push({
      mesh: bullet,
      vel: dir.multiplyScalar(BULLET_SPEED),
      life: 3.0
    });
  }

  // ── Enemy shoot ──────────────────────────────────────────────────────────────
  function _enemyShoot(enemy) {
    var dir = new THREE.Vector3();
    dir.subVectors(_camera.position, enemy.mesh.position).normalize();

    var bulletGeo = new THREE.ConeGeometry(0.06, 0.3, 4);
    var bulletMat = new THREE.MeshLambertMaterial({ color: 0x884400 });
    var bullet = new THREE.Mesh(bulletGeo, bulletMat);
    bullet.position.copy(enemy.mesh.position);
    bullet.position.y += 0.8;

    _scene.add(bullet);
    _enemyProjectiles.push({
      mesh: bullet,
      vel: dir.multiplyScalar(12),
      life: 2.5,
      damage: enemy.damage
    });
  }

  // ── Spawn round enemies ──────────────────────────────────────────────────────
  function _spawnRound(roundIdx) {
    var roundDef = ROUNDS[roundIdx];
    for (var g = 0; g < roundDef.enemies.length; g++) {
      var group = roundDef.enemies[g];
      for (var e = 0; e < group.count; e++) {
        var angle = (e / group.count) * Math.PI * 0.6 - Math.PI * 0.3;
        _spawnEnemy(group.type, {
          x: Math.sin(angle) * 5,
          z: ARENA_RADIUS - 3
        });
      }
    }
  }

  // ── Spawn trapdoor enemy ─────────────────────────────────────────────────────
  function _spawnTrapdoorEnemy(tdPos) {
    var types = ['gladiator', 'archer', 'champion', 'beast_handler'];
    var typeIdx = Math.min(_round, types.length - 1);
    _spawnEnemy(types[typeIdx], { x: tdPos.x, z: tdPos.z });
  }

  // ── Health pickup ─────────────────────────────────────────────────────────────
  function _spawnHealthPickup(pos) {
    var geo = new THREE.SphereGeometry(0.4, 8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: 0x00ff88, emissive: 0x00aa44 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, 0.6, pos.z);
    _scene.add(mesh);
    _healthPickups.push({ mesh: mesh, life: 15.0 });
  }

  // ── HUD creation ─────────────────────────────────────────────────────────────
  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'colosseum-hud';
    _hud.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'pointer-events:none', 'z-index:1000', 'font-family:Georgia,serif',
      'color:#ffddaa'
    ].join(';');
    _hud.innerHTML = [
      '<div id="col-round" style="position:absolute;top:20px;left:50%;transform:translateX(-50%);font-size:24px;text-align:center;text-shadow:2px 2px 4px #000"></div>',
      '<div id="col-hp" style="position:absolute;bottom:60px;left:20px;font-size:18px;text-shadow:1px 1px 3px #000"></div>',
      '<div id="col-mult" style="position:absolute;bottom:60px;right:20px;font-size:18px;text-align:right;text-shadow:1px 1px 3px #000"></div>',
      '<div id="col-shield" style="position:absolute;top:80px;left:50%;transform:translateX(-50%);font-size:16px;text-align:center;color:#ff4444;display:none;text-shadow:1px 1px 3px #000"></div>',
      '<div id="col-msg" style="position:absolute;top:45%;left:50%;transform:translate(-50%,-50%);font-size:36px;text-align:center;text-shadow:2px 2px 6px #000;display:none"></div>',
      '<div id="col-crosshair" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:20px;color:#ffffff;text-shadow:1px 1px 2px #000">+</div>',
      '<div id="col-keys" style="position:absolute;bottom:20px;left:50%;transform:translateX(-50%);font-size:13px;opacity:0.7;text-align:center">WASD: Move | Mouse: Aim | Click: Shoot | Space: Jump | R: Restart</div>'
    ].join('');
    document.body.appendChild(_hud);
  }

  function _updateHUD() {
    var roundEl = document.getElementById('col-round');
    var hpEl = document.getElementById('col-hp');
    var multEl = document.getElementById('col-mult');
    var shieldEl = document.getElementById('col-shield');

    if (!roundEl) return;

    var alive = 0;
    for (var i = 0; i < _enemies.length; i++) {
      if (!_enemies[i].dead) alive++;
    }

    if (_state === STATE.REST) {
      roundEl.textContent = 'REST — Next round in ' + Math.ceil(_restTimer) + 's';
    } else if (_state === STATE.WIN) {
      roundEl.textContent = 'VICTOR! Score: ' + _score;
    } else if (_state === STATE.DEAD) {
      roundEl.textContent = 'YOU DIED — Press R to restart';
    } else {
      roundEl.textContent = 'Round ' + (_round + 1) + '/5 — Enemies: ' + alive;
    }

    var hpPct = Math.max(0, _playerHP / _maxPlayerHP * 100).toFixed(0);
    hpEl.textContent = 'HP: ' + Math.ceil(_playerHP) + ' / ' + _maxPlayerHP;
    hpEl.style.color = _playerHP < 30 ? '#ff4444' : '#88ff88';

    multEl.textContent = 'Crowd x' + _crowdMultiplier.toFixed(1) + ' | Score: ' + _score;

    // Shield status for boss
    var boss = null;
    for (var b = 0; b < _enemies.length; b++) {
      if (_enemies[b].type === 'boss' && !_enemies[b].dead) { boss = _enemies[b]; break; }
    }
    if (boss) {
      shieldEl.style.display = 'block';
      shieldEl.textContent = 'MAXIMUS REX — Flank him! Shield blocks frontal attacks!';
    } else {
      shieldEl.style.display = 'none';
    }
  }

  function _showMessage(msg, color) {
    var el = document.getElementById('col-msg');
    if (!el) return;
    el.style.display = 'block';
    el.style.color = color || '#ffddaa';
    el.textContent = msg;
  }

  function _hideMessage() {
    var el = document.getElementById('col-msg');
    if (el) el.style.display = 'none';
  }

  // ── Distance helpers ─────────────────────────────────────────────────────────
  function _dist2(a, b) {
    var dx = a.x - b.x, dz = (a.z || 0) - (b.z || 0);
    return dx*dx + dz*dz;
  }

  function _dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }

  // ── Check if projectile is hitting enemy from front (for shield) ─────────────
  function _isFromFront(enemy, projectile) {
    var fwd = new THREE.Vector3(0, 0, -1);
    fwd.applyQuaternion(enemy.mesh.quaternion);
    var toProj = new THREE.Vector3();
    toProj.subVectors(projectile.mesh.position, enemy.mesh.position).normalize();
    return fwd.dot(toProj) > 0.5;
  }

  // ── Update player movement ───────────────────────────────────────────────────
  function _updatePlayer(dt) {
    // Mouse look
    var sensitivity = 0.0018;
    _yaw   -= _mouse.dx * sensitivity;
    _pitch -= _mouse.dy * sensitivity;
    _pitch = Math.max(-Math.PI/3, Math.min(Math.PI/3, _pitch));
    _mouse.dx = 0;
    _mouse.dy = 0;

    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;

    // WASD movement
    var moveX = 0, moveZ = 0;
    if (_keys['KeyW'] || _keys['ArrowUp'])    moveZ -= 1;
    if (_keys['KeyS'] || _keys['ArrowDown'])  moveZ += 1;
    if (_keys['KeyA'] || _keys['ArrowLeft'])  moveX -= 1;
    if (_keys['KeyD'] || _keys['ArrowRight']) moveX += 1;

    var len = Math.sqrt(moveX*moveX + moveZ*moveZ);
    if (len > 0) { moveX /= len; moveZ /= len; }

    var cosY = Math.cos(_yaw), sinY = Math.sin(_yaw);
    var wx = (cosY * moveX - sinY * moveZ) * PLAYER_SPEED;
    var wz = (sinY * moveX + cosY * moveZ) * PLAYER_SPEED;

    _velocity.x = wx;
    _velocity.z = wz;

    // Gravity
    _velocity.y += GRAVITY * dt;
    _camera.position.x += _velocity.x * dt;
    _camera.position.y += _velocity.y * dt;
    _camera.position.z += _velocity.z * dt;

    // Ground collision
    if (_camera.position.y < PLAYER_HEIGHT) {
      _camera.position.y = PLAYER_HEIGHT;
      _velocity.y = 0;
      _onGround = true;
    }

    // Arena boundary (soft clamp)
    var px = _camera.position.x, pz = _camera.position.z;
    var pr = Math.sqrt(px*px + pz*pz);
    if (pr > ARENA_RADIUS - 1.5) {
      var scale = (ARENA_RADIUS - 1.5) / pr;
      _camera.position.x = px * scale;
      _camera.position.z = pz * scale;
    }

    // Fire pit damage
    for (var f = 0; f < _firePits.length; f++) {
      var fp = _firePits[f];
      var fdx = _camera.position.x - fp.pos.x;
      var fdz = _camera.position.z - fp.pos.z;
      if (Math.abs(fdx) < 2 && Math.abs(fdz) < 2) {
        _playerHP -= FIRE_PIT_DAMAGE * dt;
      }
    }

    // Health pickup collision
    for (var h = _healthPickups.length - 1; h >= 0; h--) {
      var pickup = _healthPickups[h];
      var hd = _dist3(_camera.position, pickup.mesh.position);
      if (hd < 1.2) {
        _playerHP = Math.min(_maxPlayerHP, _playerHP + 35);
        _scene.remove(pickup.mesh);
        _healthPickups.splice(h, 1);
      }
    }

    if (_playerHP <= 0) {
      _playerHP = 0;
      _state = STATE.DEAD;
      _showMessage('YOU HAVE FALLEN', '#ff2222');
    }
  }

  // ── Update enemies ───────────────────────────────────────────────────────────
  function _updateEnemies(dt) {
    var playerPos = _camera.position;

    for (var i = _enemies.length - 1; i >= 0; i--) {
      var enemy = _enemies[i];
      if (enemy.dead) continue;

      var ep = enemy.mesh.position;
      var dx = playerPos.x - ep.x;
      var dz = playerPos.z - ep.z;
      var dist = Math.sqrt(dx*dx + dz*dz);

      // Face player
      enemy.mesh.rotation.y = Math.atan2(dx, dz);

      // Boss flanking behavior
      if (enemy.type === 'boss') {
        enemy.strafeTimer -= dt;
        if (enemy.strafeTimer <= 0) {
          enemy.strafeDir *= -1;
          enemy.strafeTimer = 1.5 + Math.random() * 1.5;
        }
        // Strafe around player
        var sAngle = Math.atan2(dx, dz) + Math.PI/2 * enemy.strafeDir;
        var strafeX = Math.sin(sAngle) * enemy.speed * 0.6 * dt;
        var strafeZ = Math.cos(sAngle) * enemy.speed * 0.6 * dt;
        ep.x += strafeX;
        ep.z += strafeZ;
      }

      // Move toward player if outside attack range
      if (dist > enemy.range) {
        var speed = enemy.speed * dt;
        ep.x += (dx / dist) * speed;
        ep.z += (dz / dist) * speed;
      }

      // Keep within arena
      var er = Math.sqrt(ep.x*ep.x + ep.z*ep.z);
      if (er > ARENA_RADIUS - 1) {
        ep.x = ep.x / er * (ARENA_RADIUS - 1);
        ep.z = ep.z / er * (ARENA_RADIUS - 1);
      }

      // Attack player
      enemy.attackTimer -= dt;
      if (enemy.attackTimer <= 0) {
        if (enemy.ranged && dist < enemy.range + 2) {
          _enemyShoot(enemy);
          enemy.attackTimer = 2.0 + Math.random();
        } else if (!enemy.ranged && dist < enemy.range + 0.5) {
          _playerHP -= enemy.damage;
          enemy.attackTimer = 1.2 + Math.random() * 0.6;
        } else {
          enemy.attackTimer = 0.3;
        }
      }

      // Bob animation
      ep.y = 0.7 * (enemy.type === 'boss' ? ENEMY_DEFS.boss.scale : 1.0) + Math.sin(Date.now() * 0.003 + i) * 0.04;
    }
  }

  // ── Update projectiles ───────────────────────────────────────────────────────
  function _updateProjectiles(dt) {
    // Player bullets
    for (var i = _projectiles.length - 1; i >= 0; i--) {
      var p = _projectiles[i];
      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt;
      p.mesh.position.z += p.vel.z * dt;
      p.life -= dt;

      var hit = false;
      for (var e = 0; e < _enemies.length; e++) {
        var enemy = _enemies[e];
        if (enemy.dead) continue;
        var d = _dist3(p.mesh.position, enemy.mesh.position);
        if (d < 0.9) {
          var dmg = BULLET_DAMAGE;
          // Boss shield block
          if (enemy.shield && _isFromFront(enemy, p)) {
            dmg = Math.floor(dmg * 0.5);
          }
          enemy.hp -= dmg;
          hit = true;

          if (enemy.hp <= 0) {
            _killEnemy(enemy, e);
          }
          break;
        }
      }

      if (hit || p.life <= 0 || p.mesh.position.y < -5) {
        _scene.remove(p.mesh);
        _projectiles.splice(i, 1);
      }
    }

    // Enemy bullets
    for (var j = _enemyProjectiles.length - 1; j >= 0; j--) {
      var ep = _enemyProjectiles[j];
      ep.mesh.position.x += ep.vel.x * dt;
      ep.mesh.position.y += ep.vel.y * dt;
      ep.mesh.position.z += ep.vel.z * dt;
      ep.life -= dt;

      var phit = false;
      var pd = _dist3(ep.mesh.position, _camera.position);
      if (pd < 0.8) {
        _playerHP -= ep.damage;
        phit = true;
      }

      if (phit || ep.life <= 0) {
        _scene.remove(ep.mesh);
        _enemyProjectiles.splice(j, 1);
      }
    }
  }

  // ── Kill enemy ───────────────────────────────────────────────────────────────
  function _killEnemy(enemy, idx) {
    enemy.dead = true;
    _scene.remove(enemy.mesh);

    // Crowd multiplier
    var now = performance.now() / 1000;
    if (now - _lastKillTime < QUICK_KILL_WINDOW) {
      _crowdMultiplier = Math.min(MAX_MULTIPLIER, _crowdMultiplier + 0.5);
    } else {
      _crowdMultiplier = Math.max(1, _crowdMultiplier - 0.5);
    }
    _lastKillTime = now;

    var baseScore = enemy.type === 'boss' ? 500 : 100;
    _score += Math.floor(baseScore * _crowdMultiplier);

    // Spawn drop
    if (Math.random() < 0.3) {
      _spawnHealthPickup({ x: enemy.mesh.position.x, z: enemy.mesh.position.z });
    }

    // Check round end
    var alive = 0;
    for (var i = 0; i < _enemies.length; i++) {
      if (!_enemies[i].dead) alive++;
    }

    if (alive === 0) {
      if (_round >= 4) {
        _state = STATE.WIN;
        _showMessage('FREEDOM! You defeated the Colosseum!\nScore: ' + _score, '#ffd700');
      } else {
        _state = STATE.REST;
        _restTimer = REST_DURATION;
        _showMessage('Round ' + (_round + 1) + ' Complete! Rest...', '#88ff88');
        // Spawn health pickups during rest
        for (var h = 0; h < 3; h++) {
          var angle = (h / 3) * Math.PI * 2;
          _spawnHealthPickup({ x: Math.cos(angle) * 6, z: Math.sin(angle) * 6 });
        }
        // Open gate
        _openGate();
      }
    }
  }

  // ── Gate animation ───────────────────────────────────────────────────────────
  function _openGate() {
    _gateOpen = true;
    _gateTimer = 0;
  }

  function _closeGate() {
    _gateOpen = false;
    if (_gateMesh) _gateMesh.position.y = 2.5;
  }

  // ── Trapdoors ────────────────────────────────────────────────────────────────
  function _openTrapdoors() {
    for (var i = 0; i < _trapdoors.length; i++) {
      var td = _trapdoors[i];
      td.open = true;
      td.timer = 2.0;
      _spawnTrapdoorEnemy(td.pos);
    }
  }

  function _updateTrapdoors(dt) {
    for (var i = 0; i < _trapdoors.length; i++) {
      var td = _trapdoors[i];
      if (td.open) {
        td.mesh.position.y = Math.max(-0.5, td.mesh.position.y - dt * 1.5);
        td.timer -= dt;
        if (td.timer <= 0) {
          td.open = false;
          td.mesh.position.y = td.origY;
        }
      }
    }
  }

  // ── Update fire animations ────────────────────────────────────────────────────
  function _updateFire(dt) {
    var t = Date.now() * 0.001;
    for (var f = 0; f < _firePits.length; f++) {
      var fp = _firePits[f];
      if (!fp.flames) continue;
      for (var fl = 0; fl < fp.flames.length; fl++) {
        var flame = fp.flames[fl];
        flame.position.y = flame.userData.baseY + Math.sin(t * flame.userData.speed + flame.userData.phase) * 0.2;
        flame.scale.y = 0.8 + Math.sin(t * flame.userData.speed * 1.3 + flame.userData.phase) * 0.2;
        flame.rotation.y += dt * 2;
      }
    }
  }

  // ── Update health pickups ─────────────────────────────────────────────────────
  function _updatePickups(dt) {
    var t = Date.now() * 0.001;
    for (var i = _healthPickups.length - 1; i >= 0; i--) {
      var pickup = _healthPickups[i];
      pickup.life -= dt;
      pickup.mesh.position.y = 0.6 + Math.sin(t * 2 + i) * 0.15;
      pickup.mesh.rotation.y += dt * 2;
      if (pickup.life <= 0) {
        _scene.remove(pickup.mesh);
        _healthPickups.splice(i, 1);
      }
    }
  }

  // ── Main update loop ─────────────────────────────────────────────────────────
  function update() {
    if (!_active || !_clock) return;
    var dt = Math.min(_clock.getDelta(), 0.05);

    if (_state === STATE.PLAYING || _state === STATE.BOSS) {
      _updatePlayer(dt);
      _updateEnemies(dt);
      _updateProjectiles(dt);
      _updateTrapdoors(dt);
      _updateFire(dt);
      _updatePickups(dt);

      // Shoot cooldown
      if (_shootCooldown > 0) _shootCooldown -= dt;
      if (_mouse.buttons & 1 && _shootCooldown <= 0) _tryShoot();

      // Trapdoor timer
      _trapdoorTimer -= dt;
      if (_trapdoorTimer <= 0) {
        _trapdoorTimer = TRAPDOOR_INTERVAL;
        _openTrapdoors();
      }

      // Gate animation
      if (_gateOpen && _gateMesh) {
        _gateTimer += dt;
        _gateMesh.position.y = Math.max(-2, 2.5 - _gateTimer * 3);
      }

      // Crowd multiplier decay
      var now2 = performance.now() / 1000;
      if (now2 - _lastKillTime > QUICK_KILL_WINDOW + 2) {
        _crowdMultiplier = Math.max(1, _crowdMultiplier - 0.2 * dt);
      }
    }

    if (_state === STATE.REST) {
      _updatePlayer(dt);
      _updateFire(dt);
      _updatePickups(dt);
      _restTimer -= dt;

      if (_gateOpen && _gateMesh) {
        _gateTimer += dt;
        _gateMesh.position.y = Math.max(-2, 2.5 - _gateTimer * 3);
      }

      if (_restTimer <= 0) {
        _hideMessage();
        _round++;
        _closeGate();
        _trapdoorTimer = TRAPDOOR_INTERVAL;
        _spawnRound(_round);
        _state = STATE.PLAYING;
      }
    }

    _updateHUD();
    _renderer.render(_scene, _camera);
    _animFrame = requestAnimationFrame(update);
  }

  // ── Window resize ─────────────────────────────────────────────────────────────
  function _onResize() {
    if (!_camera || !_renderer) return;
    _camera.aspect = window.innerWidth / window.innerHeight;
    _camera.updateProjectionMatrix();
    _renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ── Start / stop ─────────────────────────────────────────────────────────────
  function _startGame() {
    _active = true;
    _state = STATE.PLAYING;

    // Container
    _gameContainer = document.createElement('div');
    _gameContainer.id = 'colosseum-container';
    _gameContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:999;';
    document.body.appendChild(_gameContainer);

    _buildScene();
    _buildHUD();

    // Spawn first round
    _round = 0;
    _spawnRound(0);
    _trapdoorTimer = TRAPDOOR_INTERVAL;

    _gameContainer.addEventListener('click', _onPointerLock);
    window.addEventListener('resize', _onResize);

    _animFrame = requestAnimationFrame(update);
  }

  function _stopGame() {
    _active = false;
    if (_animFrame) { cancelAnimationFrame(_animFrame); _animFrame = null; }
    if (_renderer) { _renderer.dispose(); _renderer = null; }
    if (_gameContainer) { _gameContainer.remove(); _gameContainer = null; }
    if (_hud) { _hud.remove(); _hud = null; }
    _scene = null;
    _camera = null;
    window.removeEventListener('resize', _onResize);
    if (document.pointerLockElement) document.exitPointerLock();
  }

  // ── Public: reset ─────────────────────────────────────────────────────────────
  function reset() {
    _stopGame();
    _enemies = [];
    _projectiles = [];
    _enemyProjectiles = [];
    _healthPickups = [];
    _trapdoors = [];
    _firePits = [];
    _arenaWalls = [];
    _bleachers = [];
    _archLines = [];
    _weaponRacks = [];
    _round = 0;
    _state = STATE.INACTIVE;
    _playerHP = _maxPlayerHP;
    _crowdMultiplier = 1;
    _score = 0;
    _lastKillTime = 0;
    _trapdoorTimer = TRAPDOOR_INTERVAL;
    _gateOpen = false;
    _gateTimer = 0;
    _yaw = 0;
    _pitch = 0;
    _velocity = { x: 0, y: 0, z: 0 };
    _onGround = true;
    _shootCooldown = 0;
    _keys = {};
    _mouse = { x: 0, y: 0, dx: 0, dy: 0, buttons: 0 };
  }

  // ── Public: init ─────────────────────────────────────────────────────────────
  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup', _onKeyUp);
    window.addEventListener('mousemove', _onMouseMove);
    window.addEventListener('mousedown', _onMouseDown);
    window.addEventListener('mouseup', _onMouseUp);
  }

  // ── Boot ─────────────────────────────────────────────────────────────────────
  init();

  return { init: init, update: update, reset: reset };

}());
