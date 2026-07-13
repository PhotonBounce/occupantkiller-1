/* ───────────────────────────────────────────────────────────────────────────
   arms-smuggler.js — Arms Smuggler FPS Mini-Game
   API: window.ArmsSmuggler = { init, update, reset }
   Controls:
     A + S (together, within 400ms) → activate game
     WASD            → move
     Mouse           → look
     Click           → shoot
     E (hold 4s)     → secure crate / pickup briefcase
     C               → operate crane (at crane controls)
     F               → board speedboat (at dock end)
     R               → enter bomb defuse code digit
   ─────────────────────────────────────────────────────────────────────────── */
window.ArmsSmuggler = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _renderer = null;
  var _clock    = null;
  var _container = null;

  /* ── Active flag ───────────────────────────────────────────────────────── */
  var _active = false;

  /* ── Input ─────────────────────────────────────────────────────────────── */
  var _keys = {};
  var _mouse = { x: 0, y: 0, buttons: 0 };
  var _mouseDown = false;

  /* ── Activation chord A+S within 400ms ────────────────────────────────── */
  var _aTime = 0;
  var _sTime = 0;
  var CHORD_WINDOW = 400;

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _player = {
    pos: null,
    yaw: 0,
    pitch: 0,
    hp: 100,
    maxHp: 100,
    speed: 8,
    hasBriefcase: false,
    isDead: false
  };

  /* ── Enemies ───────────────────────────────────────────────────────────── */
  var _enemies = [];

  /* ── Game objects ──────────────────────────────────────────────────────── */
  var _crates = [];
  var _briefcase = null;
  var _briefcaseSecured = false;
  var _briefcasePickedUp = false;
  var _bombCode = '';
  var _bombDefused = false;
  var _bombTimer = 300; // 5 minutes
  var _bombMesh = null;
  var _bombLight = null;
  var _speedboat = null;
  var _craneControls = null;
  var _crane = null;
  var _craneContainer = null;
  var _craneContainerDropped = false;
  var _droppedContainerMesh = null;
  var _craneOperating = false;
  var _craneDropping = false;
  var _craneDropVel = 0;

  /* ── Bomb code input ───────────────────────────────────────────────────── */
  var _defuseInput = '';
  var _defusePromptVisible = false;

  /* ── Secure crate ──────────────────────────────────────────────────────── */
  var _eHoldTimer = 0;
  var _eHoldTarget = null;
  var _securingCrate = false;
  var _pickingUpBriefcase = false;

  /* ── Cache secured count ───────────────────────────────────────────────── */
  var _cacheSecured = 0;

  /* ── Viktor ────────────────────────────────────────────────────────────── */
  var _viktor = null;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _gameOver = false;
  var _gameWon = false;
  var _missionTime = 0;
  var _escaping = false;
  var _escaped = false;

  /* ── Raycaster ─────────────────────────────────────────────────────────── */
  var _raycaster = null;
  var _shootCooldown = 0;

  /* ── HUD element ───────────────────────────────────────────────────────── */
  var _hud = null;
  var _defuseOverlay = null;
  var _messageEl = null;
  var _messageTimer = 0;

  /* ── Faction conflict ──────────────────────────────────────────────────── */
  var _factionFightTimer = 0;
  var _factionFighting = false;

  /* ── Pointer lock ──────────────────────────────────────────────────────── */
  var _pointerLocked = false;

  /* ── Shooting flash ────────────────────────────────────────────────────── */
  var _muzzleFlash = null;
  var _muzzleFlashTimer = 0;

  /* ── Projectiles (visual tracers) ─────────────────────────────────────── */
  var _bullets = [];

  /* ── Explosion particles ───────────────────────────────────────────────── */
  var _explosions = [];

  /* ── Ambient light ref ─────────────────────────────────────────────────── */
  var _ambientLight = null;
  var _dirLight = null;

  /* ════════════════════════════════════════════════════════════════════════
     HELPER GEOMETRY BUILDERS
  ════════════════════════════════════════════════════════════════════════ */

  function makeMesh(geo, color, emissive, emissiveIntensity) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (emissive !== undefined) {
      mat.emissive = new THREE.Color(emissive);
      mat.emissiveIntensity = emissiveIntensity || 0.5;
    }
    return new THREE.Mesh(geo, mat);
  }

  function makeBox(w, h, d, color, emissive, emissiveIntensity) {
    return makeMesh(new THREE.BoxGeometry(w, h, d), color, emissive, emissiveIntensity);
  }

  function makeCylinder(rt, rb, h, seg, color) {
    return makeMesh(new THREE.CylinderGeometry(rt, rb, h, seg || 8), color);
  }

  function makeSphere(r, color) {
    return makeMesh(new THREE.SphereGeometry(r, 8, 6), color);
  }

  function makeCone(r, h, seg, color) {
    return makeMesh(new THREE.ConeGeometry(r, h, seg || 8), color);
  }

  function makeLineBox(w, h, d, color) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var edges = new THREE.EdgesGeometry(geo);
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(edges, mat);
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENVIRONMENT BUILDER
  ════════════════════════════════════════════════════════════════════════ */

  function buildEnvironment() {
    /* ── Ground / Water ── */
    var water = makeBox(200, 1, 200, 0x1a3344);
    water.position.set(0, -0.5, 0);
    _scene.add(water);

    /* ── Main dock platform ── */
    var dock = makeBox(80, 1.5, 60, 0x445544);
    dock.position.set(0, 0.75, 0);
    _scene.add(dock);

    /* ── Secondary dock extension ── */
    var dockExt = makeBox(20, 1.5, 80, 0x445544);
    dockExt.position.set(-30, 0.75, -10);
    _scene.add(dockExt);

    /* ── Pier / walkway ── */
    var pier = makeBox(8, 1, 40, 0x556655);
    pier.position.set(35, 0.75, -10);
    _scene.add(pier);

    /* ── Cargo ships ── */
    buildShip(-35, -5, 0x334433);
    buildShip(-35, 25, 0x334433);
    buildShip(10, -30, 0x2a3a2a);

    /* ── Shipping containers stacked ── */
    buildContainers();

    /* ── Cranes ── */
    buildCrane(20, 0, 20);

    /* ── Warehouse ── */
    buildWarehouse();

    /* ── Dock fence / railing ── */
    buildRailings();

    /* ── Speedboat at dock end ── */
    buildSpeedboat();

    /* ── Lamps ── */
    buildLamps();
  }

  function buildShip(x, z, color) {
    var hull = makeBox(14, 4, 40, color);
    hull.position.set(x, 0.5, z);
    _scene.add(hull);

    var deck = makeBox(12, 1, 38, 0x2a3322);
    deck.position.set(x, 2.5, z);
    _scene.add(deck);

    var bridge = makeBox(6, 5, 8, 0x334433);
    bridge.position.set(x, 5.5, z + 12);
    _scene.add(bridge);

    var funnel = makeCylinder(0.8, 1, 4, 8, 0x222222);
    funnel.position.set(x + 1, 9, z + 12);
    _scene.add(funnel);

    /* Mast */
    var mast = makeBox(0.3, 8, 0.3, 0x223322);
    mast.position.set(x, 6, z - 10);
    _scene.add(mast);
  }

  function buildContainers() {
    var colors = [0x557744, 0x443355, 0x774433, 0x446677, 0x774455, 0x557733];
    var positions = [
      { x: 5,  z: 5,  stack: 2 },
      { x: 12, z: 5,  stack: 1 },
      { x: 5,  z: 14, stack: 3 },
      { x: 12, z: 14, stack: 2 },
      { x: -5, z: 5,  stack: 1 },
      { x: -5, z: 14, stack: 2 },
      { x: 19, z: 8,  stack: 1 },
      { x: -12,z: 8,  stack: 2 }
    ];
    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      for (var s = 0; s < p.stack; s++) {
        var c = makeBox(6, 3, 2.5, colors[(i + s) % colors.length]);
        c.position.set(p.x, 1.5 + s * 3, p.z);
        _scene.add(c);
        /* Wire outline on containers */
        var outline = makeLineBox(6, 3, 2.5, 0x000000);
        outline.position.copy(c.position);
        _scene.add(outline);
      }
    }
  }

  function buildWarehouse() {
    /* Walls */
    var wh = makeBox(30, 8, 20, 0x556655);
    wh.position.set(-5, 4, -20);
    _scene.add(wh);

    /* Roof */
    var roof = makeBox(31, 0.5, 21, 0x445544);
    roof.position.set(-5, 8.25, -20);
    _scene.add(roof);

    /* Door opening (visual only - dark box) */
    var door = makeBox(4, 5, 0.5, 0x111111);
    door.position.set(-5, 2.5, -10.2);
    _scene.add(door);

    /* Weapon crates inside warehouse - rows */
    var crateColors = [0x445533, 0x334422, 0x556644];
    var cratePositions = [
      { x: -10, z: -18 }, { x: -7, z: -18 }, { x: -4, z: -18 },
      { x: -10, z: -22 }, { x: -7, z: -22 }, { x: -4, z: -22 },
      { x:  0,  z: -18 }, { x:  3,  z: -18 },
      { x:  0,  z: -22 }, { x:  3,  z: -22 }
    ];
    for (var i = 0; i < cratePositions.length; i++) {
      var cp = cratePositions[i];
      var crate = makeBox(2.5, 2, 2, crateColors[i % 3]);
      crate.position.set(cp.x, 2, cp.z);
      _scene.add(crate);
    }

    /* 4 lockable weapon caches */
    var cachePositions = [
      { x: -12, z: -16 },
      { x: -12, z: -24 },
      { x:  5,  z: -16 },
      { x:  5,  z: -24 }
    ];
    for (var j = 0; j < 4; j++) {
      var cp2 = cachePositions[j];
      var cacheMesh = makeBox(3, 2.5, 3, 0x667733);
      cacheMesh.position.set(cp2.x, 2.25, cp2.z);
      _scene.add(cacheMesh);
      /* Glow outline */
      var cacheOutline = makeLineBox(3.1, 2.6, 3.1, 0xffff00);
      cacheOutline.position.copy(cacheMesh.position);
      _scene.add(cacheOutline);
      _crates.push({
        mesh: cacheMesh,
        outline: cacheOutline,
        secured: false,
        pos: cacheMesh.position.clone()
      });
    }

    /* Bomb device in warehouse center */
    _bombMesh = makeCylinder(0.5, 0.5, 1.5, 12, 0x333333);
    _bombMesh.position.set(-5, 1.75, -20);
    _scene.add(_bombMesh);

    _bombLight = new THREE.PointLight(0xff2200, 2, 6);
    _bombLight.position.copy(_bombMesh.position);
    _bombLight.position.y += 1;
    _scene.add(_bombLight);

    /* Bomb top detail */
    var bombTop = makeBox(0.8, 0.4, 0.8, 0x444444);
    bombTop.position.set(-5, 2.7, -20);
    _scene.add(bombTop);

    /* Inside warehouse ambient */
    var whLight = new THREE.PointLight(0xaabbaa, 1, 25);
    whLight.position.set(-5, 7, -20);
    _scene.add(whLight);
  }

  function buildCrane(x, y, z) {
    var group = new THREE.Group();

    /* Base */
    var base = makeBox(4, 2, 4, 0x667744);
    base.position.set(0, 1, 0);
    group.add(base);

    /* Vertical column */
    var col = makeBox(1.5, 18, 1.5, 0x556633);
    col.position.set(0, 10, 0);
    group.add(col);

    /* Horizontal arm */
    var arm = makeBox(20, 1, 1, 0x667744);
    arm.position.set(5, 19, 0);
    group.add(arm);

    /* Vertical support diagonal - use LineSegments */
    var diagGeo = new THREE.BufferGeometry();
    var diagVerts = new Float32Array([
      0, 19, 0,
      10, 19, 0,
      0, 19, 0,
      -1, 8, 0
    ]);
    diagGeo.setAttribute('position', new THREE.BufferAttribute(diagVerts, 3));
    var diagLines = new THREE.LineSegments(diagGeo, new THREE.LineBasicMaterial({ color: 0x556633 }));
    group.add(diagLines);

    /* Crane hook cable */
    var cable = makeBox(0.15, 8, 0.15, 0x333333);
    cable.position.set(12, 15, 0);
    group.add(cable);

    /* Crane hook */
    var hook = makeBox(0.8, 0.8, 0.8, 0x888888);
    hook.position.set(12, 11, 0);
    group.add(hook);

    /* Crane control booth */
    var booth = makeBox(2.5, 2.5, 2.5, 0x445533);
    booth.position.set(-2, 10, 0);
    group.add(booth);

    group.position.set(x, y, z);
    _scene.add(group);
    _crane = group;

    /* Control position marker */
    var ctrlMarker = makeBox(1.5, 0.3, 1.5, 0x88ff88);
    ctrlMarker.position.set(x - 4, 0.15, z);
    _scene.add(ctrlMarker);
    _craneControls = { pos: new THREE.Vector3(x - 4, 1.5, z) };

    /* Container hanging from crane - will be dropped */
    _craneContainer = makeBox(5, 3, 2.5, 0x774433);
    _craneContainer.position.set(x + 12, 11, z);
    _scene.add(_craneContainer);
  }

  function buildRailings() {
    var railPos = [
      { x: 40, z: 0, rx: 0, rz: 0, w: 0.3, h: 1.2, d: 60 },
      { x: -40,z: 0, rx: 0, rz: 0, w: 0.3, h: 1.2, d: 60 },
      { x: 0,  z: 30, rx: 0, rz: 0, w: 80, h: 1.2, d: 0.3 }
    ];
    for (var i = 0; i < railPos.length; i++) {
      var r = railPos[i];
      var rail = makeBox(r.w, r.h, r.d, 0x556655);
      rail.position.set(r.x, 1.75, r.z);
      _scene.add(rail);
    }
  }

  function buildSpeedboat() {
    var hull = makeBox(6, 1.5, 12, 0x334455);
    hull.position.set(30, 0.75, -25);
    _scene.add(hull);

    var cabin = makeBox(3, 2, 4, 0x445566);
    cabin.position.set(30, 2.5, -22);
    _scene.add(cabin);

    var bow = makeCone(3, 3, 4, 0x334455);
    bow.rotation.x = -Math.PI / 2;
    bow.position.set(30, 0.75, -31);
    _scene.add(bow);

    /* Engine outline */
    var engineOutline = makeLineBox(6.2, 1.6, 12.2, 0x00ffff);
    engineOutline.position.set(30, 0.75, -25);
    _scene.add(engineOutline);

    _speedboat = { pos: new THREE.Vector3(30, 1.5, -25), mesh: hull };
  }

  function buildLamps() {
    var lampPos = [
      { x: 20, z: -5 }, { x: -20, z: -5 },
      { x: 20, z: 20 }, { x: -20, z: 20 },
      { x: 0,  z: -15 }
    ];
    for (var i = 0; i < lampPos.length; i++) {
      var lp = lampPos[i];
      var pole = makeBox(0.3, 8, 0.3, 0x445544);
      pole.position.set(lp.x, 4, lp.z);
      _scene.add(pole);

      var lampHead = makeBox(1.5, 0.5, 1.5, 0xffffaa);
      lampHead.position.set(lp.x, 8.25, lp.z);
      _scene.add(lampHead);

      var pt = new THREE.PointLight(0xffffcc, 1.5, 20);
      pt.position.set(lp.x, 8, lp.z);
      _scene.add(pt);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     VIKTOR'S BRIEFCASE
  ════════════════════════════════════════════════════════════════════════ */

  function buildBriefcase() {
    var bcMesh = makeBox(1.2, 0.7, 0.3, 0xCC9922);
    bcMesh.position.set(-3, 1.5, -23);
    _scene.add(bcMesh);

    var bcLight = new THREE.PointLight(0xffcc44, 2, 5);
    bcLight.position.copy(bcMesh.position);
    bcLight.position.y += 0.5;
    _scene.add(bcLight);

    /* Briefcase outline */
    var bcOutline = makeLineBox(1.3, 0.8, 0.4, 0xffcc00);
    bcOutline.position.copy(bcMesh.position);
    _scene.add(bcOutline);

    _briefcase = {
      mesh: bcMesh,
      light: bcLight,
      outline: bcOutline,
      pos: bcMesh.position.clone(),
      carried: false,
      secured: false
    };
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENEMY BUILDER
  ════════════════════════════════════════════════════════════════════════ */

  function buildEnemy(x, z, type) {
    var color, hp, faction;
    if (type === 'smuggler') {
      color = 0x443322;
      hp = 80;
      faction = 'smuggler';
    } else if (type === 'agent') {
      color = 0x334444;
      hp = 90;
      faction = 'agent';
    } else if (type === 'viktor') {
      color = 0x332211;
      hp = 350;
      faction = 'smuggler';
    }

    var group = new THREE.Group();

    /* Body */
    var body = makeBox(0.8, 1.2, 0.5, color);
    body.position.y = 0.8;
    group.add(body);

    /* Head */
    var head = makeSphere(0.3, color);
    head.position.y = 1.75;
    group.add(head);

    /* Arms */
    var armL = makeBox(0.2, 0.8, 0.2, color);
    armL.position.set(-0.55, 0.8, 0);
    group.add(armL);
    var armR = makeBox(0.2, 0.8, 0.2, color);
    armR.position.set(0.55, 0.8, 0);
    group.add(armR);

    /* Legs */
    var legL = makeBox(0.3, 0.8, 0.3, color);
    legL.position.set(-0.25, 0, 0);
    group.add(legL);
    var legR = makeBox(0.3, 0.8, 0.3, color);
    legR.position.set(0.25, 0, 0);
    group.add(legR);

    if (type === 'viktor') {
      /* Viktor has a hat */
      var hat = makeBox(0.7, 0.5, 0.7, 0x221100);
      hat.position.y = 2.1;
      group.add(hat);
      /* Gold watch detail */
      var watch = makeBox(0.2, 0.1, 0.15, 0xcc9900);
      watch.position.set(0.6, 1.0, 0);
      group.add(watch);
    }

    group.position.set(x, 1, z);
    _scene.add(group);

    var hp_bar_bg = makeBox(1.2, 0.15, 0.05, 0x333333);
    hp_bar_bg.position.set(0, 2.5, 0);
    group.add(hp_bar_bg);

    var hp_bar = makeBox(1.2, 0.15, 0.06, 0x00ff00);
    hp_bar.position.set(0, 2.5, 0);
    group.add(hp_bar);

    var enemy = {
      group: group,
      hp: hp,
      maxHp: hp,
      type: type,
      faction: faction,
      alive: true,
      state: 'patrol',
      patrolTarget: new THREE.Vector3(x + (Math.random() - 0.5) * 10, 1, z + (Math.random() - 0.5) * 10),
      patrolTimer: 2 + Math.random() * 3,
      alertTimer: 0,
      attackTimer: 1 + Math.random() * 2,
      factionFightTarget: null,
      hpBar: hp_bar,
      hpBarBg: hp_bar_bg,
      deathTimer: 0
    };

    if (type === 'viktor') {
      _viktor = enemy;
    }

    return enemy;
  }

  function spawnEnemies() {
    _enemies = [];

    /* 10 smugglers */
    var smugglerSpawns = [
      { x: -8,  z: 10 }, { x: 0,   z: 15 }, { x: 8,   z: 10 },
      { x: -15, z: 5  }, { x: 15,  z: 5  }, { x: -10, z: -5 },
      { x: 10,  z: -5 }, { x: -3,  z: -12}, { x: 3,   z: -12},
      { x: 0,   z: -18}
    ];
    for (var i = 0; i < smugglerSpawns.length; i++) {
      var e = buildEnemy(smugglerSpawns[i].x, smugglerSpawns[i].z, 'smuggler');
      _enemies.push(e);
    }

    /* Viktor */
    var viktor = buildEnemy(-5, -22, 'viktor');
    _enemies.push(viktor);

    /* 8 foreign agents */
    var agentSpawns = [
      { x: -25, z: -8 }, { x: -30, z: 0  }, { x: -25, z: 8  },
      { x: -35, z: -5 }, { x: -20, z: -2 }, { x: -28, z: 15 },
      { x: -22, z: 12 }, { x: -32, z: 10 }
    ];
    for (var j = 0; j < agentSpawns.length; j++) {
      var ae = buildEnemy(agentSpawns[j].x, agentSpawns[j].z, 'agent');
      _enemies.push(ae);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER SETUP
  ════════════════════════════════════════════════════════════════════════ */

  function setupPlayer() {
    _player.pos = new THREE.Vector3(0, 1.7, 20);
    _player.yaw = 0;
    _player.pitch = 0;
    _player.hp = 100;
    _player.hasBriefcase = false;
    _player.isDead = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    _hud = document.createElement('div');
    _hud.style.cssText = [
      'position:absolute',
      'top:10px',
      'left:10px',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:13px',
      'pointer-events:none',
      'background:rgba(0,0,0,0.55)',
      'padding:8px 12px',
      'border:1px solid #00ff88',
      'border-radius:4px',
      'line-height:1.7',
      'z-index:100',
      'display:none'
    ].join(';');
    _container.appendChild(_hud);

    /* Crosshair */
    var ch = document.createElement('div');
    ch.style.cssText = [
      'position:absolute',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:20px',
      'height:20px',
      'pointer-events:none',
      'z-index:100',
      'display:none'
    ].join(';');
    ch.innerHTML = '<svg width="20" height="20"><line x1="10" y1="0" x2="10" y2="8" stroke="#fff" stroke-width="1.5"/><line x1="10" y1="12" x2="10" y2="20" stroke="#fff" stroke-width="1.5"/><line x1="0" y1="10" x2="8" y2="10" stroke="#fff" stroke-width="1.5"/><line x1="12" y1="10" x2="20" y2="10" stroke="#fff" stroke-width="1.5"/></svg>';
    ch.id = '_asmCrosshair';
    _container.appendChild(ch);

    /* Message overlay */
    _messageEl = document.createElement('div');
    _messageEl.style.cssText = [
      'position:absolute',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#ffff00',
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'pointer-events:none',
      'text-align:center',
      'text-shadow:2px 2px 4px #000',
      'z-index:200',
      'display:none'
    ].join(';');
    _container.appendChild(_messageEl);

    /* Defuse overlay */
    _defuseOverlay = document.createElement('div');
    _defuseOverlay.style.cssText = [
      'position:absolute',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#ff4400',
      'font-family:monospace',
      'font-size:18px',
      'font-weight:bold',
      'background:rgba(0,0,0,0.8)',
      'padding:20px',
      'border:2px solid #ff4400',
      'border-radius:6px',
      'text-align:center',
      'z-index:300',
      'display:none',
      'pointer-events:none'
    ].join(';');
    _container.appendChild(_defuseOverlay);

    /* Activation hint */
    var hint = document.createElement('div');
    hint.id = '_asmHint';
    hint.style.cssText = [
      'position:absolute',
      'bottom:20px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#aaffaa',
      'font-family:monospace',
      'font-size:14px',
      'background:rgba(0,0,0,0.6)',
      'padding:6px 14px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:100'
    ].join(';');
    hint.textContent = '[ARMS SMUGGLER] Press A+S to start';
    _container.appendChild(hint);
  }

  function updateHUD() {
    if (!_hud || !_active) return;

    var hostileCount = 0;
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].alive) hostileCount++;
    }

    var bombStr;
    if (_bombDefused) {
      bombStr = 'DISARMED';
    } else {
      var bm = Math.floor(_bombTimer / 60);
      var bs = Math.floor(_bombTimer % 60);
      bombStr = 'ARMED ' + _pad2(bm) + ':' + _pad2(bs);
    }

    var mm = Math.floor(_missionTime / 60);
    var ms = Math.floor(_missionTime % 60);
    var timerStr = _pad2(mm) + ':' + _pad2(ms);

    var briefStr = _briefcaseSecured ? 'SECURED' : (_player.hasBriefcase ? 'CARRYING' : 'NOT FOUND');
    var viktorStr = (_viktor && _viktor.alive) ? 'ALIVE' : 'DEAD';

    _hud.innerHTML =
      'ARMS SMUGGLER<br>' +
      'CACHE: ' + _cacheSecured + '/4 SECURED<br>' +
      'BRIEFCASE: ' + briefStr + '<br>' +
      'BOMB: ' + bombStr + '<br>' +
      'VIKTOR: ' + viktorStr + '<br>' +
      'TIMER: ' + timerStr + '<br>' +
      'HOSTILES: ' + hostileCount + '<br>' +
      'HP: ' + Math.max(0, Math.floor(_player.hp));
  }

  function _pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function showMessage(msg, duration) {
    if (!_messageEl) return;
    _messageEl.innerHTML = msg;
    _messageEl.style.display = 'block';
    _messageTimer = duration || 3;
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT
  ════════════════════════════════════════════════════════════════════════ */

  function setupInput() {
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mouseup', onMouseUp, false);
    _container.addEventListener('click', requestPointerLock, false);
    document.addEventListener('pointerlockchange', onPointerLockChange, false);
    document.addEventListener('keypress', onKeyPress, false);
  }

  function requestPointerLock() {
    if (_active && !_pointerLocked) {
      _container.requestPointerLock();
    }
  }

  function onPointerLockChange() {
    _pointerLocked = (document.pointerLockElement === _container);
  }

  function onKeyDown(e) {
    var k = e.key.toUpperCase();
    _keys[k] = true;

    /* A+S chord detection */
    var now = Date.now();
    if (k === 'A') _aTime = now;
    if (k === 'S') _sTime = now;
    if (!_active && _keys['A'] && _keys['S']) {
      if (Math.abs(_aTime - _sTime) <= CHORD_WINDOW) {
        activateGame();
        return;
      }
    }

    if (!_active) return;

    /* Bomb defuse code input */
    if (_defusePromptVisible) {
      if (e.key >= '0' && e.key <= '9') {
        _defuseInput += e.key;
        updateDefuseOverlay();
        if (_defuseInput.length >= 4) {
          checkBombCode();
        }
      }
      if (e.key === 'Backspace') {
        _defuseInput = _defuseInput.slice(0, -1);
        updateDefuseOverlay();
      }
      if (e.key === 'Escape') {
        _defusePromptVisible = false;
        _defuseOverlay.style.display = 'none';
      }
    }

    /* C key - crane */
    if (k === 'C') {
      if (!_craneContainerDropped) {
        var dist = _player.pos.distanceTo(_craneControls.pos);
        if (dist < 3) {
          if (!_craneOperating) {
            _craneOperating = true;
            showMessage('CRANE ACTIVATED<br>Press C again to drop container', 2);
          } else {
            _craneDropping = true;
            _craneOperating = false;
            showMessage('DROPPING CONTAINER!', 2);
          }
        }
      }
    }

    /* F key - board speedboat */
    if (k === 'F') {
      var bdist = _player.pos.distanceTo(_speedboat.pos);
      if (bdist < 5) {
        tryEscape();
      }
    }
  }

  function onKeyUp(e) {
    var k = e.key.toUpperCase();
    _keys[k] = false;
  }

  function onKeyPress(e) {
    /* unused now but kept */
  }

  function onMouseMove(e) {
    if (!_active || !_pointerLocked) return;
    var dx = e.movementX || 0;
    var dy = e.movementY || 0;
    _player.yaw   -= dx * 0.002;
    _player.pitch -= dy * 0.002;
    _player.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, _player.pitch));
  }

  function onMouseDown(e) {
    if (!_active) return;
    _mouseDown = true;
    if (e.button === 0 && _pointerLocked) {
      shootRay();
    }
  }

  function onMouseUp(e) {
    _mouseDown = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     SHOOT / RAYCASTER
  ════════════════════════════════════════════════════════════════════════ */

  function shootRay() {
    if (!_active || _player.isDead || _gameOver) return;
    if (_shootCooldown > 0) return;
    _shootCooldown = 0.15;

    /* Muzzle flash */
    _muzzleFlash.visible = true;
    _muzzleFlashTimer = 0.05;

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(_player.pitch, _player.yaw, 0, 'YXZ'));

    _raycaster.set(_player.pos.clone(), dir);

    /* Collect enemy meshes */
    var targets = [];
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].alive) {
        _enemies[i].group.traverse(function(child) {
          if (child.isMesh) targets.push(child);
        });
      }
    }

    var hits = _raycaster.intersectObjects(targets, false);
    if (hits.length > 0) {
      var hitObj = hits[0].object;
      /* Find which enemy was hit */
      for (var j = 0; j < _enemies.length; j++) {
        var en = _enemies[j];
        if (!en.alive) continue;
        var isHit = false;
        en.group.traverse(function(child) {
          if (child === hitObj) isHit = true;
        });
        if (isHit) {
          var dmg = 25 + Math.random() * 15;
          damageEnemy(en, dmg, true);
          spawnHitParticle(hits[0].point);
          break;
        }
      }
    }

    /* Tracer round */
    var tracerEnd = _player.pos.clone().add(dir.clone().multiplyScalar(60));
    spawnBullet(_player.pos.clone(), tracerEnd);
  }

  function spawnBullet(from, to) {
    var geo = new THREE.BufferGeometry();
    var verts = new Float32Array([
      from.x, from.y, from.z,
      to.x,   to.y,   to.z
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    var mat = new THREE.LineBasicMaterial({ color: 0xffff88 });
    var line = new THREE.LineSegments(geo, mat);
    _scene.add(line);
    _bullets.push({ mesh: line, life: 0.08 });
  }

  function spawnHitParticle(pos) {
    for (var i = 0; i < 4; i++) {
      var p = makeSphere(0.08, 0xff4400);
      p.position.copy(pos);
      _scene.add(p);
      _explosions.push({
        mesh: p,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          Math.random() * 3,
          (Math.random() - 0.5) * 4
        ),
        life: 0.4
      });
    }
  }

  function spawnExplosion(pos, radius) {
    for (var i = 0; i < 12; i++) {
      var p = makeBox(0.3 + Math.random() * 0.4, 0.3, 0.3, 0xff6600);
      p.position.copy(pos);
      _scene.add(p);
      _explosions.push({
        mesh: p,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          2 + Math.random() * 6,
          (Math.random() - 0.5) * 8
        ),
        life: 1.0
      });
    }
    var light = new THREE.PointLight(0xff6600, 4, radius * 2);
    light.position.copy(pos);
    _scene.add(light);
    _explosions.push({ mesh: light, vel: new THREE.Vector3(), life: 0.5, isLight: true });
  }

  /* ════════════════════════════════════════════════════════════════════════
     DAMAGE
  ════════════════════════════════════════════════════════════════════════ */

  function damageEnemy(enemy, dmg, playerShot) {
    if (!enemy.alive) return;
    enemy.hp -= dmg;
    updateEnemyHPBar(enemy);

    /* Faction conflict trigger */
    if (playerShot && !_factionFighting) {
      var otherFaction = (enemy.faction === 'smuggler') ? 'agent' : 'smuggler';
      var roll = Math.random();
      if (roll < 0.4) {
        startFactionFight(enemy.faction, otherFaction);
      }
    }

    /* Alert nearby enemies */
    for (var i = 0; i < _enemies.length; i++) {
      var en = _enemies[i];
      if (!en.alive) continue;
      if (en.group.position.distanceTo(enemy.group.position) < 20) {
        en.state = 'attack';
        en.alertTimer = 15;
      }
    }

    if (enemy.hp <= 0) {
      killEnemy(enemy);
    }
  }

  function killEnemy(enemy) {
    enemy.alive = false;
    enemy.hp = 0;
    /* Make enemy fall */
    enemy.group.rotation.z = Math.PI / 2;
    enemy.group.position.y = 0.4;
    /* Tint red */
    enemy.group.traverse(function(child) {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.color.setHex(0x440000);
      }
    });
    updateEnemyHPBar(enemy);
  }

  function updateEnemyHPBar(enemy) {
    if (enemy.hpBar) {
      var pct = Math.max(0, enemy.hp / enemy.maxHp);
      enemy.hpBar.scale.x = pct;
      enemy.hpBar.position.x = -(1.2 * (1 - pct)) / 2;
      if (pct > 0.5) {
        enemy.hpBar.material.color.setHex(0x00ff00);
      } else if (pct > 0.25) {
        enemy.hpBar.material.color.setHex(0xffaa00);
      } else {
        enemy.hpBar.material.color.setHex(0xff2200);
      }
    }
  }

  function damagePlayer(dmg) {
    if (_player.isDead || _gameOver) return;
    _player.hp -= dmg;
    if (_player.hp <= 0) {
      _player.hp = 0;
      _player.isDead = true;
      endGame(false, 'You were killed in action.');
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     FACTION FIGHT
  ════════════════════════════════════════════════════════════════════════ */

  function startFactionFight(att, def) {
    _factionFighting = true;
    _factionFightTimer = 8 + Math.random() * 6;
    showMessage('FACTION CONFLICT!<br>Smugglers vs Agents!', 2);

    /* Set some enemies to fight each other */
    for (var i = 0; i < _enemies.length; i++) {
      var en = _enemies[i];
      if (!en.alive) continue;
      if (en.faction === att) {
        /* Find a target from other faction */
        for (var j = 0; j < _enemies.length; j++) {
          if (_enemies[j].alive && _enemies[j].faction === def) {
            en.factionFightTarget = _enemies[j];
            en.state = 'factionFight';
            break;
          }
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BOMB DEFUSE
  ════════════════════════════════════════════════════════════════════════ */

  function tryDefuseBomb() {
    if (_bombDefused) return;
    var distToBomb = _player.pos.distanceTo(_bombMesh.position);
    if (distToBomb < 3) {
      if (!_briefcasePickedUp && !_player.hasBriefcase) {
        showMessage('Get Viktor\'s briefcase first to find the code!', 2);
        return;
      }
      _defusePromptVisible = true;
      _defuseInput = '';
      updateDefuseOverlay();
      _defuseOverlay.style.display = 'block';
    }
  }

  function updateDefuseOverlay() {
    var dots = '';
    for (var i = 0; i < 4; i++) {
      if (i < _defuseInput.length) {
        dots += _defuseInput[i];
      } else {
        dots += '_';
      }
      if (i < 3) dots += ' ';
    }
    _defuseOverlay.innerHTML =
      'BOMB DEFUSE<br>' +
      'Enter 4-digit code (from Viktor\'s briefcase):<br><br>' +
      '<span style="font-size:28px;letter-spacing:8px">' + dots + '</span><br><br>' +
      'Code: <span style="color:#ffcc00">' + _bombCode + '</span><br>' +
      '[Type digits, Backspace to clear, Esc to cancel]';
  }

  function checkBombCode() {
    if (_defuseInput === _bombCode) {
      _bombDefused = true;
      _defusePromptVisible = false;
      _defuseOverlay.style.display = 'none';
      if (_bombLight) {
        _bombLight.color.setHex(0x00ff44);
        _bombLight.intensity = 1;
      }
      showMessage('BOMB DEFUSED!', 3);
    } else {
      showMessage('WRONG CODE! Try again.', 2);
      _defuseInput = '';
      updateDefuseOverlay();
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     E-HOLD INTERACTIONS
  ════════════════════════════════════════════════════════════════════════ */

  function updateEHold(delta) {
    if (!_keys['E']) {
      _eHoldTimer = 0;
      _eHoldTarget = null;
      _securingCrate = false;
      _pickingUpBriefcase = false;
      return;
    }

    /* Check briefcase pickup */
    if (!_player.hasBriefcase && _briefcase && !_briefcase.secured) {
      var bdist = _player.pos.distanceTo(_briefcase.pos);
      if (bdist < 2.5) {
        if (_eHoldTarget !== 'briefcase') {
          _eHoldTarget = 'briefcase';
          _eHoldTimer = 0;
          _pickingUpBriefcase = true;
        }
        _eHoldTimer += delta;
        if (_eHoldTimer >= 1.5) {
          _player.hasBriefcase = true;
          _briefcase.mesh.visible = false;
          _briefcase.outline.visible = false;
          _briefcase.light.visible = false;
          showMessage('BRIEFCASE SECURED!<br>Find bomb code inside.', 2);
          _eHoldTimer = 0;
          _eHoldTarget = null;
          _pickingUpBriefcase = false;
          return;
        }
        return;
      }
    }

    /* Check crate securing */
    for (var i = 0; i < _crates.length; i++) {
      var crate = _crates[i];
      if (crate.secured) continue;
      var cdist = _player.pos.distanceTo(crate.pos);
      if (cdist < 3) {
        if (_eHoldTarget !== i) {
          _eHoldTarget = i;
          _eHoldTimer = 0;
          _securingCrate = true;
        }
        _eHoldTimer += delta;
        if (_eHoldTimer >= 4) {
          crate.secured = true;
          crate.outline.material.color.setHex(0x00ff88);
          _cacheSecured++;
          showMessage('CACHE SECURED! [' + _cacheSecured + '/4]', 2);
          _eHoldTimer = 0;
          _eHoldTarget = null;
          _securingCrate = false;
        }
        return;
      }
    }

    /* Check bomb defuse prompt */
    var distToBomb2 = _player.pos.distanceTo(_bombMesh.position);
    if (distToBomb2 < 3) {
      tryDefuseBomb();
      _keys['E'] = false; // prevent repeat
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CRANE OPERATION
  ════════════════════════════════════════════════════════════════════════ */

  function updateCrane(delta) {
    if (_craneContainerDropped || !_craneContainer) return;

    if (_craneDropping) {
      _craneDropVel += 20 * delta;
      _craneContainer.position.y -= _craneDropVel * delta;

      if (_craneContainer.position.y <= 2) {
        _craneContainer.position.y = 2;
        _craneContainerDropped = true;
        _craneDropping = false;
        _droppedContainerMesh = _craneContainer;

        /* AoE damage */
        var dropPos = _craneContainer.position;
        spawnExplosion(dropPos, 10);
        for (var i = 0; i < _enemies.length; i++) {
          var en = _enemies[i];
          if (!en.alive) continue;
          var dist = en.group.position.distanceTo(dropPos);
          if (dist < 8) {
            damageEnemy(en, 80, false);
          }
        }
        /* Player AoE */
        if (_player.pos.distanceTo(dropPos) < 8) {
          damagePlayer(40);
        }
        showMessage('CONTAINER DROPPED!', 2);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ESCAPE
  ════════════════════════════════════════════════════════════════════════ */

  function tryEscape() {
    if (_gameOver) return;
    if (!_player.hasBriefcase && !_briefcaseSecured) {
      showMessage('Need the briefcase to escape!', 2);
      return;
    }
    if (_cacheSecured < 3) {
      showMessage('Secure at least 3 weapon caches first! [' + _cacheSecured + '/3]', 2);
      return;
    }
    if (!_bombDefused) {
      showMessage('Defuse the bomb before escaping!', 2);
      return;
    }
    _escaping = true;
    endGame(true, 'MISSION COMPLETE!<br>Evidence secured. Escaped via speedboat.');
  }

  /* ════════════════════════════════════════════════════════════════════════
     WIN / LOSE
  ════════════════════════════════════════════════════════════════════════ */

  function endGame(won, msg) {
    _gameOver = true;
    _gameWon = won;

    var color = won ? '#00ff88' : '#ff2200';
    var ch = document.getElementById('_asmCrosshair');
    if (ch) ch.style.display = 'none';

    showMessage(
      '<span style="color:' + color + '">' + msg + '</span><br>' +
      '<span style="font-size:14px;color:#fff">Press A+S to restart</span>',
      999
    );

    if (document.exitPointerLock) document.exitPointerLock();
    _pointerLocked = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENEMY AI UPDATE
  ════════════════════════════════════════════════════════════════════════ */

  function updateEnemies(delta) {
    for (var i = 0; i < _enemies.length; i++) {
      var en = _enemies[i];
      if (!en.alive) continue;

      var distToPlayer = en.group.position.distanceTo(_player.pos);

      /* Face HP bar toward camera */
      if (en.hpBar) {
        en.hpBarBg.quaternion.copy(_camera.quaternion);
        en.hpBar.quaternion.copy(_camera.quaternion);
      }

      /* Alert if player close */
      if (distToPlayer < 18 && en.state === 'patrol') {
        en.state = 'attack';
        en.alertTimer = 20;
      }

      /* Faction fight state */
      if (en.state === 'factionFight' && en.factionFightTarget) {
        var tgt = en.factionFightTarget;
        if (!tgt.alive) {
          en.state = 'attack';
          en.factionFightTarget = null;
        } else {
          var ftDist = en.group.position.distanceTo(tgt.group.position);
          if (ftDist > 1.5) {
            var ftDir = tgt.group.position.clone().sub(en.group.position).normalize();
            en.group.position.add(ftDir.multiplyScalar(3 * delta));
          }
          en.attackTimer -= delta;
          if (en.attackTimer <= 0) {
            damageEnemy(tgt, 10 + Math.random() * 10, false);
            en.attackTimer = 1 + Math.random() * 1.5;
          }
          en.group.lookAt(tgt.group.position);
        }
      } else if (en.state === 'attack') {
        en.alertTimer -= delta;
        if (en.alertTimer <= 0 && distToPlayer > 25) {
          en.state = 'patrol';
        }

        /* Move toward player */
        if (distToPlayer > 2.5) {
          var dir2 = _player.pos.clone().sub(en.group.position).normalize();
          dir2.y = 0;
          en.group.position.add(dir2.multiplyScalar(2.5 * delta));
        }
        en.group.lookAt(new THREE.Vector3(_player.pos.x, en.group.position.y, _player.pos.z));

        /* Attack player */
        if (distToPlayer < 15) {
          en.attackTimer -= delta;
          if (en.attackTimer <= 0) {
            var baseDmg = (en.type === 'viktor') ? 18 : 8;
            var acc = (distToPlayer < 5) ? 0.9 : 0.45;
            if (Math.random() < acc) {
              damagePlayer(baseDmg + Math.random() * 5);
            }
            en.attackTimer = (en.type === 'viktor') ? 1.5 : 1.2;
          }
        }
      } else if (en.state === 'patrol') {
        en.patrolTimer -= delta;
        if (en.patrolTimer <= 0 || en.group.position.distanceTo(en.patrolTarget) < 1) {
          en.patrolTarget = new THREE.Vector3(
            en.group.position.x + (Math.random() - 0.5) * 12,
            1,
            en.group.position.z + (Math.random() - 0.5) * 12
          );
          en.patrolTimer = 2 + Math.random() * 3;
        }
        var pDir = en.patrolTarget.clone().sub(en.group.position).normalize();
        pDir.y = 0;
        en.group.position.add(pDir.multiplyScalar(1.5 * delta));
        en.group.lookAt(en.patrolTarget);
      }

      /* Clamp enemy to ground */
      en.group.position.y = 1;
    }

    /* Faction fight timer */
    if (_factionFighting) {
      _factionFightTimer -= delta;
      if (_factionFightTimer <= 0) {
        _factionFighting = false;
        /* All enemies now attack player */
        for (var j = 0; j < _enemies.length; j++) {
          if (_enemies[j].alive && _enemies[j].state === 'factionFight') {
            _enemies[j].state = 'attack';
            _enemies[j].alertTimer = 20;
            _enemies[j].factionFightTarget = null;
          }
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function updatePlayer(delta) {
    if (_player.isDead || _gameOver) return;

    var moveDir = new THREE.Vector3(0, 0, 0);
    if (_keys['W']) moveDir.z -= 1;
    if (_keys['S'] && !(_keys['A'] && Math.abs(_aTime - _sTime) <= CHORD_WINDOW && !_active)) moveDir.z += 1;
    if (_keys['A']) moveDir.x -= 1;
    if (_keys['D']) moveDir.x += 1;

    /* S is allowed for movement when game is active */
    if (_active && _keys['S']) moveDir.z += 1;

    if (moveDir.length() > 0) {
      moveDir.normalize();
      var yawQuat = new THREE.Quaternion();
      yawQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), _player.yaw);
      moveDir.applyQuaternion(yawQuat);
      _player.pos.add(moveDir.multiplyScalar(_player.speed * delta));
    }

    /* Clamp player to dock area */
    _player.pos.x = Math.max(-45, Math.min(45, _player.pos.x));
    _player.pos.z = Math.max(-45, Math.min(35, _player.pos.z));
    _player.pos.y = 1.7;

    /* Update camera */
    _camera.position.copy(_player.pos);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _player.yaw;
    _camera.rotation.x = _player.pitch;

    /* Muzzle flash position */
    if (_muzzleFlash) {
      var fwd = new THREE.Vector3(0, -0.15, -1.5);
      fwd.applyEuler(new THREE.Euler(_player.pitch, _player.yaw, 0, 'YXZ'));
      _muzzleFlash.position.copy(_player.pos).add(fwd);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PARTICLES UPDATE
  ════════════════════════════════════════════════════════════════════════ */

  function updateParticles(delta) {
    /* Bullets */
    for (var i = _bullets.length - 1; i >= 0; i--) {
      _bullets[i].life -= delta;
      if (_bullets[i].life <= 0) {
        _scene.remove(_bullets[i].mesh);
        _bullets.splice(i, 1);
      }
    }

    /* Explosions */
    for (var j = _explosions.length - 1; j >= 0; j--) {
      var exp = _explosions[j];
      exp.life -= delta;
      if (exp.life <= 0) {
        _scene.remove(exp.mesh);
        _explosions.splice(j, 1);
      } else {
        if (!exp.isLight) {
          exp.mesh.position.add(exp.vel.clone().multiplyScalar(delta));
          exp.vel.y -= 9 * delta;
          exp.mesh.material.opacity = exp.life;
          exp.mesh.material.transparent = true;
        } else {
          exp.mesh.intensity = exp.life * 4;
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BOMB TIMER UPDATE
  ════════════════════════════════════════════════════════════════════════ */

  function updateBomb(delta) {
    if (_bombDefused || _gameOver) return;

    _bombTimer -= delta;

    /* Flash bomb light */
    if (_bombLight) {
      var flashRate = Math.max(0.2, _bombTimer / 300);
      var t = Date.now() / 1000;
      _bombLight.intensity = (Math.sin(t * Math.PI * 2 / flashRate) > 0) ? 3 : 0.5;
    }

    if (_bombTimer <= 0) {
      _bombTimer = 0;
      spawnExplosion(new THREE.Vector3(-5, 4, -20), 20);
      /* Destroy briefcase if in warehouse */
      if (!_player.hasBriefcase && _briefcase) {
        _briefcase.mesh.visible = false;
        _briefcase.outline.visible = false;
        _briefcase.light.visible = false;
      }
      endGame(false, 'BOMB EXPLODED!<br>Evidence destroyed. Mission failed.');
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BRIEFCASE UPDATE (carried by player)
  ════════════════════════════════════════════════════════════════════════ */

  function updateBriefcase(delta) {
    if (!_briefcase) return;
    if (_player.hasBriefcase) {
      /* Briefcase follows player */
      var fwd2 = new THREE.Vector3(0.4, -0.3, -0.6);
      fwd2.applyEuler(new THREE.Euler(_player.pitch, _player.yaw, 0, 'YXZ'));
      /* Briefcase stays in world but hidden (already hidden on pickup) */

      /* Check if at dock exit for securing briefcase */
      var exitPos = new THREE.Vector3(30, 1.7, 20);
      if (_player.pos.distanceTo(exitPos) < 5 && !_briefcaseSecured) {
        _briefcaseSecured = true;
        showMessage('BRIEFCASE SECURED AT DOCK!', 2);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     MAIN ACTIVATE
  ════════════════════════════════════════════════════════════════════════ */

  function activateGame() {
    if (_active) {
      /* Restart */
      resetInternal();
      return;
    }

    _active = true;
    _gameOver = false;
    _gameWon = false;
    _missionTime = 0;
    _bombTimer = 300;
    _bombDefused = false;
    _cacheSecured = 0;
    _factionFighting = false;
    _factionFightTimer = 0;
    _escaped = false;

    /* Generate bomb code from Viktor's briefcase */
    _bombCode = '';
    for (var i = 0; i < 4; i++) {
      _bombCode += Math.floor(Math.random() * 10);
    }

    setupPlayer();
    buildEnvironment();
    buildBriefcase();
    spawnEnemies();

    /* Muzzle flash */
    _muzzleFlash = new THREE.PointLight(0xffff00, 4, 3);
    _muzzleFlash.visible = false;
    _scene.add(_muzzleFlash);

    /* Show HUD */
    _hud.style.display = 'block';
    var ch = document.getElementById('_asmCrosshair');
    if (ch) ch.style.display = 'block';
    var hint = document.getElementById('_asmHint');
    if (hint) hint.style.display = 'none';

    /* Request pointer lock */
    setTimeout(function() {
      _container.requestPointerLock();
    }, 100);

    showMessage('ARMS SMUGGLER<br>Intercept the arms deal!<br>Find briefcase, secure 3+ caches,<br>defuse bomb, escape via speedboat.', 4);
  }

  function resetInternal() {
    /* Remove all scene objects except lights */
    while (_scene.children.length > 0) {
      var child = _scene.children[0];
      _scene.remove(child);
    }

    /* Re-add lights */
    _scene.add(_ambientLight);
    _scene.add(_dirLight);

    /* Reset state */
    _enemies = [];
    _crates = [];
    _briefcase = null;
    _briefcaseSecured = false;
    _briefcasePickedUp = false;
    _bombDefused = false;
    _bombTimer = 300;
    _bombMesh = null;
    _bombLight = null;
    _craneContainerDropped = false;
    _craneContainer = null;
    _craneDropping = false;
    _craneDropVel = 0;
    _craneOperating = false;
    _crane = null;
    _viktor = null;
    _cacheSecured = 0;
    _gameOver = false;
    _gameWon = false;
    _missionTime = 0;
    _escaped = false;
    _bullets = [];
    _explosions = [];
    _factionFighting = false;
    _factionFightTimer = 0;
    _defusePromptVisible = false;
    _defuseInput = '';
    _defuseOverlay.style.display = 'none';
    _eHoldTimer = 0;
    _eHoldTarget = null;

    if (_messageEl) {
      _messageEl.style.display = 'none';
    }

    /* Generate new bomb code */
    _bombCode = '';
    for (var i = 0; i < 4; i++) {
      _bombCode += Math.floor(Math.random() * 10);
    }

    setupPlayer();
    buildEnvironment();
    buildBriefcase();
    spawnEnemies();

    _muzzleFlash = new THREE.PointLight(0xffff00, 4, 3);
    _muzzleFlash.visible = false;
    _scene.add(_muzzleFlash);

    var ch = document.getElementById('_asmCrosshair');
    if (ch) ch.style.display = 'block';

    showMessage('ARMS SMUGGLER<br>RESTARTED', 3);
  }

  /* ════════════════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════════════════ */

  function init(container) {
    _container = container;

    /* Scene */
    _scene = new THREE.Scene();
    _scene.background = new THREE.Color(0x112233);
    _scene.fog = new THREE.Fog(0x112233, 60, 150);

    /* Camera */
    _camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      300
    );
    _camera.position.set(0, 1.7, 20);

    /* Renderer */
    _renderer = new THREE.WebGLRenderer({ antialias: true });
    _renderer.setSize(container.clientWidth, container.clientHeight);
    _renderer.shadowMap.enabled = false;
    container.appendChild(_renderer.domElement);

    /* Lights */
    _ambientLight = new THREE.AmbientLight(0x334455, 0.8);
    _scene.add(_ambientLight);
    _dirLight = new THREE.DirectionalLight(0xaabbcc, 1.2);
    _dirLight.position.set(10, 30, 10);
    _scene.add(_dirLight);

    /* Moon */
    var moonLight = new THREE.DirectionalLight(0x4466aa, 0.4);
    moonLight.position.set(-20, 40, -10);
    _scene.add(moonLight);

    /* Clock */
    _clock = new THREE.Clock();

    /* Raycaster */
    _raycaster = new THREE.Raycaster();
    _raycaster.far = 80;

    /* HUD */
    buildHUD();

    /* Input */
    setupInput();

    /* Resize */
    window.addEventListener('resize', function() {
      _camera.aspect = container.clientWidth / container.clientHeight;
      _camera.updateProjectionMatrix();
      _renderer.setSize(container.clientWidth, container.clientHeight);
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     UPDATE (called every frame from host)
  ════════════════════════════════════════════════════════════════════════ */

  function update(delta) {
    if (!_renderer || !_scene || !_camera) return;

    /* Use internal clock if no delta provided */
    if (delta === undefined) {
      delta = _clock.getDelta();
    }
    delta = Math.min(delta, 0.05); /* cap delta */

    if (_active && !_gameOver) {
      _missionTime += delta;

      updatePlayer(delta);
      updateEnemies(delta);
      updateBomb(delta);
      updateBriefcase(delta);
      updateEHold(delta);
      updateCrane(delta);
      updateParticles(delta);

      /* Shoot cooldown */
      if (_shootCooldown > 0) _shootCooldown -= delta;

      /* Muzzle flash */
      if (_muzzleFlashTimer > 0) {
        _muzzleFlashTimer -= delta;
        if (_muzzleFlashTimer <= 0) {
          _muzzleFlash.visible = false;
        }
      }

      /* Message timer */
      if (_messageTimer > 0) {
        _messageTimer -= delta;
        if (_messageTimer <= 0) {
          _messageEl.style.display = 'none';
        }
      }

      /* Bomb blink */
      if (_bombMesh && !_bombDefused) {
        var brate = Math.max(1, 10 - (300 - _bombTimer) / 30);
        var bt = Date.now() / 1000;
        _bombMesh.rotation.y = bt * 2;
      }

      /* E-hold progress display */
      if (_securingCrate || _pickingUpBriefcase) {
        var prog = Math.floor((_eHoldTimer / (_securingCrate ? 4 : 1.5)) * 100);
        /* Show securing progress in HUD temporarily */
        if (_securingCrate) {
          _hud.innerHTML += '<br><span style="color:#ffff00">SECURING: ' + prog + '%</span>';
        } else {
          _hud.innerHTML += '<br><span style="color:#ffcc00">PICKING UP: ' + prog + '%</span>';
        }
      }

      /* Crane proximity hint */
      if (_craneControls && !_craneContainerDropped) {
        var crDist = _player.pos.distanceTo(_craneControls.pos);
        if (crDist < 3) {
          if (!_craneOperating) {
            _hud.innerHTML += '<br><span style="color:#aaffff">[C] Operate Crane</span>';
          } else {
            _hud.innerHTML += '<br><span style="color:#ffaa00">[C] Drop Container</span>';
          }
        }
      }

      /* Speedboat proximity hint */
      if (_speedboat) {
        var sdist = _player.pos.distanceTo(_speedboat.pos);
        if (sdist < 5) {
          _hud.innerHTML += '<br><span style="color:#00ffff">[F] Board Speedboat</span>';
        }
      }

      /* Bomb proximity hint */
      if (_bombMesh) {
        var bdist2 = _player.pos.distanceTo(_bombMesh.position);
        if (bdist2 < 3 && !_bombDefused) {
          _hud.innerHTML += '<br><span style="color:#ff4400">[E] Defuse Bomb (need briefcase)</span>';
        }
      }

      updateHUD();
    } else if (!_gameOver) {
      /* Pre-game: animate camera slowly */
      var t2 = Date.now() / 1000;
      _camera.position.set(
        Math.sin(t2 * 0.1) * 15,
        5,
        Math.cos(t2 * 0.1) * 15
      );
      _camera.lookAt(0, 2, 0);
    }

    _renderer.render(_scene, _camera);
  }

  /* ════════════════════════════════════════════════════════════════════════
     RESET (external API)
  ════════════════════════════════════════════════════════════════════════ */

  function reset() {
    _active = false;
    _gameOver = false;
    _gameWon = false;
    _keys = {};
    _mouseDown = false;
    _aTime = 0;
    _sTime = 0;
    _pointerLocked = false;

    if (document.exitPointerLock) document.exitPointerLock();

    if (_renderer && _container) {
      while (_scene.children.length > 0) {
        _scene.remove(_scene.children[0]);
      }
      _scene.add(_ambientLight);
      _scene.add(_dirLight);
    }

    _enemies = [];
    _crates = [];
    _briefcase = null;
    _briefcaseSecured = false;
    _briefcasePickedUp = false;
    _bombDefused = false;
    _bombTimer = 300;
    _bombMesh = null;
    _bombLight = null;
    _craneContainerDropped = false;
    _craneContainer = null;
    _craneDropping = false;
    _craneDropVel = 0;
    _craneOperating = false;
    _crane = null;
    _viktor = null;
    _cacheSecured = 0;
    _missionTime = 0;
    _escaped = false;
    _bullets = [];
    _explosions = [];
    _factionFighting = false;
    _defusePromptVisible = false;
    _defuseInput = '';

    if (_defuseOverlay) _defuseOverlay.style.display = 'none';
    if (_messageEl) _messageEl.style.display = 'none';
    if (_hud) _hud.style.display = 'none';

    var ch = document.getElementById('_asmCrosshair');
    if (ch) ch.style.display = 'none';

    var hint = document.getElementById('_asmHint');
    if (hint) hint.style.display = 'block';

    if (_clock) _clock.start();
  }

  /* ── Public API ─────────────────────────────────────────────────────── */
  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();
