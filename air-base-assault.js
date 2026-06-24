window.AirBaseAssault = (function () {
  'use strict';

  // ── constants ──────────────────────────────────────────────────────────────
  var ACTIVATION_SEQ = ['a', 'i'];
  var ACTIVATION_WINDOW = 400;
  var PLAYER_SPEED = 8;
  var PLAYER_HEIGHT = 1.7;
  var GRAVITY = -18;
  var JUMP_VEL = 7;
  var BULLET_SPEED = 80;
  var BULLET_LIFE = 1.5;
  var RIFLE_DAMAGE = 22;
  var PISTOL_DAMAGE = 14;
  var SHOTGUN_DAMAGE = 45;
  var RIFLE_RATE = 0.12;
  var PISTOL_RATE = 0.28;
  var C4_PLANT_TIME = 3.0;
  var TAXI_START_TIME = 90;
  var DETONATION_WINDOW = 60;
  var AAA_FIRE_INTERVAL = 6;
  var AAA_HP = 120;
  var AAA_DAMAGE = 35;
  var FUEL_AOE = 100;
  var BOSS_HP = 520;
  var SOLDIER_HP = 80;
  var PILOT_HP = 75;
  var RADAR_AWARE_BUFF = 2.2;
  var SIGHT_RANGE_BASE = 22;
  var PATROL_SPEED = 2.4;
  var CHASE_SPEED = 5.5;
  var ATTACK_RANGE = 14;

  // ── module state ──────────────────────────────────────────────────────────
  var active = false;
  var scene, camera, renderer, clock;
  var keys = {};
  var mouse = { dx: 0, dy: 0, fire: false };
  var yaw = 0, pitch = 0;
  var playerPos, playerVel;
  var playerHP = 100;
  var onGround = false;
  var gameOver = false;
  var winState = false;

  var bullets = [];
  var enemies = [];
  var explosions = [];
  var aaaEmplacements = [];
  var fuelTanks = [];
  var aircraft = [];
  var taxiAircraft = null;
  var radarMesh = null;

  var armedCount = 0;
  var plantingTarget = null;
  var plantTimer = 0;
  var lastChargedTime = -1;
  var detonationCountdown = -1;
  var taxiElapsed = 0;
  var taxiActive = false;
  var taxiDone = false;
  var radarActive = true;
  var baseAlerted = false;
  var alertTimer = 0;

  var fireTimer = 0;
  var currentWeapon = 'rifle';
  var weaponAmmo = { rifle: 90, pistol: 40, shotgun: 18 };

  var hudEl = null;
  var crosshairEl = null;
  var messageEl = null;
  var messageTimer = 0;

  var activationBuffer = [];
  var activationTimers = [];

  // ── activation handling ───────────────────────────────────────────────────
  function onKeyActivation(e) {
    var k = e.key.toLowerCase();
    activationBuffer.push(k);
    activationTimers.push(Date.now());
    if (activationBuffer.length > 2) {
      activationBuffer.shift();
      activationTimers.shift();
    }
    if (activationBuffer.length === 2 &&
        activationBuffer[0] === ACTIVATION_SEQ[0] &&
        activationBuffer[1] === ACTIVATION_SEQ[1] &&
        (activationTimers[1] - activationTimers[0]) <= ACTIVATION_WINDOW) {
      activationBuffer = [];
      activationTimers = [];
      if (!active) {
        startModule();
      }
    }
  }

  // ── init ──────────────────────────────────────────────────────────────────
  function init(sceneRef, cameraRef, rendererRef) {
    scene = sceneRef;
    camera = cameraRef;
    renderer = rendererRef;
    clock = new THREE.Clock();
    document.addEventListener('keydown', onKeyActivation);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    buildHUD();
  }

  function startModule() {
    active = true;
    reset();
    if (document.pointerLockElement === null) {
      renderer.domElement.requestPointerLock();
    }
    showMessage('MISSION: Destroy all aircraft and eliminate Wing Commander Rosk!', 5);
  }

  // ── reset / build world ───────────────────────────────────────────────────
  function reset() {
    // clear previous objects
    while (scene.children.length > 0) scene.remove(scene.children[0]);
    bullets = [];
    enemies = [];
    explosions = [];
    aaaEmplacements = [];
    fuelTanks = [];
    aircraft = [];
    taxiAircraft = null;
    radarMesh = null;
    armedCount = 0;
    plantingTarget = null;
    plantTimer = 0;
    lastChargedTime = -1;
    detonationCountdown = -1;
    taxiElapsed = 0;
    taxiActive = false;
    taxiDone = false;
    radarActive = true;
    baseAlerted = false;
    alertTimer = 0;
    fireTimer = 0;
    currentWeapon = 'rifle';
    weaponAmmo = { rifle: 90, pistol: 40, shotgun: 18 };
    playerHP = 100;
    gameOver = false;
    winState = false;
    yaw = 0;
    pitch = 0;
    playerPos = new THREE.Vector3(0, PLAYER_HEIGHT, 60);
    playerVel = new THREE.Vector3();
    onGround = false;

    buildLighting();
    buildTarmac();
    buildRunway();
    buildHangars();
    buildControlTower();
    buildFuelDepot();
    buildBarracks();
    buildAAAEmplacements();
    spawnEnemies();

    camera.position.copy(playerPos);
    camera.rotation.set(0, 0, 0);
  }

  // ── lighting ──────────────────────────────────────────────────────────────
  function buildLighting() {
    var amb = new THREE.AmbientLight(0x88aaaa, 0.6);
    scene.add(amb);
    var sun = new THREE.DirectionalLight(0xffffee, 0.9);
    sun.position.set(40, 80, 30);
    scene.add(sun);
    scene.background = new THREE.Color(0x7ab8d0);
    scene.fog = new THREE.Fog(0x7ab8d0, 80, 250);
  }

  // ── tarmac ────────────────────────────────────────────────────────────────
  function buildTarmac() {
    var geo = new THREE.BoxGeometry(200, 0.3, 240);
    var mat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var tarmac = new THREE.Mesh(geo, mat);
    tarmac.position.set(0, -0.15, 0);
    scene.add(tarmac);

    // taxiway markings
    var points = [];
    var i;
    for (i = -90; i <= 90; i += 20) {
      points.push(new THREE.Vector3(-30, 0.16, i), new THREE.Vector3(-10, 0.16, i));
    }
    var lGeo = new THREE.BufferGeometry().setFromPoints(points);
    var lMat = new THREE.LineBasicMaterial({ color: 0xddcc00 });
    scene.add(new THREE.LineSegments(lGeo, lMat));
  }

  // ── runway ────────────────────────────────────────────────────────────────
  function buildRunway() {
    var geo = new THREE.BoxGeometry(22, 0.32, 160);
    var mat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var rw = new THREE.Mesh(geo, mat);
    rw.position.set(60, 0.16, 0);
    scene.add(rw);

    // threshold markings
    var pts = [];
    var i;
    for (i = -10; i <= 10; i += 3) {
      pts.push(new THREE.Vector3(53 + i, 0.34, -75), new THREE.Vector3(53 + i, 0.34, -68));
      pts.push(new THREE.Vector3(53 + i, 0.34, 68), new THREE.Vector3(53 + i, 0.34, 75));
    }
    var lGeo = new THREE.BufferGeometry().setFromPoints(pts);
    var lMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    scene.add(new THREE.LineSegments(lGeo, lMat));

    // centerline
    var cPts = [];
    for (i = -70; i <= 70; i += 12) {
      cPts.push(new THREE.Vector3(60, 0.34, i), new THREE.Vector3(60, 0.34, i + 6));
    }
    var cGeo = new THREE.BufferGeometry().setFromPoints(cPts);
    scene.add(new THREE.LineSegments(cGeo, new THREE.LineBasicMaterial({ color: 0xffffff })));
  }

  // ── hangars ───────────────────────────────────────────────────────────────
  function buildHangars() {
    var hangarDefs = [
      { x: -50, z: -40 },
      { x: -50, z: 0 },
      { x: -50, z: 40 }
    ];
    var i;
    for (i = 0; i < hangarDefs.length; i++) {
      buildHangar(hangarDefs[i].x, hangarDefs[i].z, i);
    }
  }

  function buildHangar(cx, cz, idx) {
    var mat = new THREE.MeshLambertMaterial({ color: 0x667766 });
    // main shell
    var body = new THREE.Mesh(new THREE.BoxGeometry(26, 9, 22), mat);
    body.position.set(cx, 4.5, cz);
    scene.add(body);

    // door frame
    var doorMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
    var doorLeft = new THREE.Mesh(new THREE.BoxGeometry(6, 8, 0.4), doorMat);
    doorLeft.position.set(cx - 5, 4, cz + 11);
    scene.add(doorLeft);
    var doorRight = new THREE.Mesh(new THREE.BoxGeometry(6, 8, 0.4), doorMat);
    doorRight.position.set(cx + 5, 4, cz + 11);
    scene.add(doorRight);

    // aircraft inside hangar
    var ac = buildAircraft(cx, 0.4, cz);
    ac.userData.hangarIdx = idx;
    ac.userData.armed = false;
    ac.userData.c4Timer = 0;
    ac.userData.isArming = false;
    aircraft.push(ac);

    // one extra aircraft in first hangar
    if (idx === 0) {
      var ac2 = buildAircraft(cx - 1, 0.4, cz - 7);
      ac2.userData.hangarIdx = idx;
      ac2.userData.armed = false;
      ac2.userData.c4Timer = 0;
      ac2.userData.isArming = false;
      aircraft.push(ac2);
      // mark second one as the taxi aircraft
      taxiAircraft = ac2;
    }
  }

  function buildAircraft(x, y, z) {
    var group = new THREE.Group();

    // fuselage
    var fGeo = new THREE.BoxGeometry(2.2, 1.2, 8);
    var fMat = new THREE.MeshLambertMaterial({ color: 0x778877 });
    var fuselage = new THREE.Mesh(fGeo, fMat);
    group.add(fuselage);

    // wings (swept box)
    var wGeo = new THREE.BoxGeometry(9, 0.3, 3.5);
    var wMat = new THREE.MeshLambertMaterial({ color: 0x667766 });
    var wings = new THREE.Mesh(wGeo, wMat);
    wings.position.set(0, -0.1, 0.5);
    group.add(wings);

    // tail fins
    var tGeo = new THREE.BoxGeometry(0.25, 1.5, 2);
    var tMat = new THREE.MeshLambertMaterial({ color: 0x556655 });
    var tailV = new THREE.Mesh(tGeo, tMat);
    tailV.position.set(0, 1, -3.2);
    group.add(tailV);

    // engines (cylinders)
    var eGeo = new THREE.CylinderGeometry(0.35, 0.35, 2.5, 8);
    var eMat = new THREE.MeshLambertMaterial({ color: 0x334433 });
    var engL = new THREE.Mesh(eGeo, eMat);
    engL.rotation.x = Math.PI / 2;
    engL.position.set(-2.8, -0.4, 0.8);
    group.add(engL);
    var engR = new THREE.Mesh(eGeo, eMat);
    engR.rotation.x = Math.PI / 2;
    engR.position.set(2.8, -0.4, 0.8);
    group.add(engR);

    group.position.set(x, y, z);
    scene.add(group);
    group.userData.type = 'aircraft';
    return group;
  }

  // ── control tower ─────────────────────────────────────────────────────────
  function buildControlTower() {
    // base shaft
    var shaftGeo = new THREE.BoxGeometry(6, 18, 6);
    var shaftMat = new THREE.MeshLambertMaterial({ color: 0x556655 });
    var shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.set(20, 9, -30);
    scene.add(shaft);

    // glass cab
    var cabGeo = new THREE.BoxGeometry(8, 4, 8);
    var cabMat = new THREE.MeshLambertMaterial({ color: 0x334433 });
    var cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(20, 20, -30);
    scene.add(cab);

    // window lines on cab
    var wPts = [];
    var sides = [-3.9, 3.9];
    var i, s;
    for (i = 0; i < sides.length; i++) {
      s = sides[i];
      wPts.push(new THREE.Vector3(20 + s, 18.5, -26.1), new THREE.Vector3(20 + s, 21.8, -26.1));
      wPts.push(new THREE.Vector3(20 + s, 18.5, -33.9), new THREE.Vector3(20 + s, 21.8, -33.9));
      wPts.push(new THREE.Vector3(16.1, 18.5, -30 + s), new THREE.Vector3(16.1, 21.8, -30 + s));
      wPts.push(new THREE.Vector3(23.9, 18.5, -30 + s), new THREE.Vector3(23.9, 21.8, -30 + s));
    }
    var wGeo = new THREE.BufferGeometry().setFromPoints(wPts);
    var wMat = new THREE.LineBasicMaterial({ color: 0x88ddff });
    scene.add(new THREE.LineSegments(wGeo, wMat));

    // radar platform
    var platGeo = new THREE.BoxGeometry(4, 0.4, 4);
    var platMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
    var plat = new THREE.Mesh(platGeo, platMat);
    plat.position.set(20, 22.4, -30);
    scene.add(plat);

    // radar dish (cylinder as rotating dish)
    var dishGeo = new THREE.CylinderGeometry(0.1, 1.6, 0.4, 12);
    var dishMat = new THREE.MeshLambertMaterial({ color: 0x88aa88 });
    radarMesh = new THREE.Mesh(dishGeo, dishMat);
    radarMesh.position.set(20, 23.2, -30);
    scene.add(radarMesh);
  }

  // ── fuel depot ────────────────────────────────────────────────────────────
  function buildFuelDepot() {
    var tankPositions = [
      { x: -20, z: -60 }, { x: -12, z: -60 },
      { x: -20, z: -52 }, { x: -12, z: -52 }
    ];
    var tGeo = new THREE.CylinderGeometry(2.5, 2.5, 6, 12);
    var tMat = new THREE.MeshLambertMaterial({ color: 0x556655 });
    var i, tank, td;
    for (i = 0; i < tankPositions.length; i++) {
      td = tankPositions[i];
      tank = new THREE.Mesh(tGeo, tMat);
      tank.position.set(td.x, 3, td.z);
      scene.add(tank);
      tank.userData.hp = 60;
      tank.userData.exploded = false;
      fuelTanks.push(tank);
    }

    // connecting pipes
    var pipePts = [
      new THREE.Vector3(-20, 3, -60), new THREE.Vector3(-12, 3, -60),
      new THREE.Vector3(-12, 3, -60), new THREE.Vector3(-12, 3, -52),
      new THREE.Vector3(-12, 3, -52), new THREE.Vector3(-20, 3, -52),
      new THREE.Vector3(-20, 3, -52), new THREE.Vector3(-20, 3, -60)
    ];
    var pGeo = new THREE.BufferGeometry().setFromPoints(pipePts);
    var pMat = new THREE.LineBasicMaterial({ color: 0x445544 });
    scene.add(new THREE.LineSegments(pGeo, pMat));
  }

  // ── barracks ──────────────────────────────────────────────────────────────
  function buildBarracks() {
    var barGeo = new THREE.BoxGeometry(30, 5, 10);
    var barMat = new THREE.MeshLambertMaterial({ color: 0x556655 });
    var bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(0, 2.5, -60);
    scene.add(bar);

    // bunk room dividers
    var divPts = [];
    var i;
    for (i = -12; i <= 12; i += 6) {
      divPts.push(new THREE.Vector3(i, 0.3, -56), new THREE.Vector3(i, 4.8, -56));
      divPts.push(new THREE.Vector3(i, 0.3, -64), new THREE.Vector3(i, 4.8, -64));
    }
    var dGeo = new THREE.BufferGeometry().setFromPoints(divPts);
    var dMat = new THREE.LineBasicMaterial({ color: 0x778877 });
    scene.add(new THREE.LineSegments(dGeo, dMat));
  }

  // ── AAA emplacements ─────────────────────────────────────────────────────
  function buildAAAEmplacements() {
    buildAAA(30, -50);
    buildAAA(30, 50);
  }

  function buildAAA(x, z) {
    var group = new THREE.Group();

    // base platform
    var baseGeo = new THREE.BoxGeometry(5, 1, 5);
    var baseMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
    var base = new THREE.Mesh(baseGeo, baseMat);
    group.add(base);

    // quad gun mounts (4 cylinders)
    var gGeo = new THREE.CylinderGeometry(0.18, 0.18, 3, 6);
    var gMat = new THREE.MeshLambertMaterial({ color: 0x334433 });
    var offsets = [[-0.8, -0.8], [-0.8, 0.8], [0.8, -0.8], [0.8, 0.8]];
    var i, g, off;
    for (i = 0; i < offsets.length; i++) {
      off = offsets[i];
      g = new THREE.Mesh(gGeo, gMat);
      g.position.set(off[0], 2, off[1]);
      g.rotation.x = -Math.PI / 6;
      group.add(g);
    }

    group.position.set(x, 0.5, z);
    scene.add(group);

    aaaEmplacements.push({
      group: group,
      hp: AAA_HP,
      fireTimer: Math.random() * AAA_FIRE_INTERVAL,
      destroyed: false,
      pos: new THREE.Vector3(x, 1.5, z)
    });
  }

  // ── enemy spawning ────────────────────────────────────────────────────────
  function spawnEnemies() {
    var i, e;

    // 14 soldiers patrolling airfield
    var soldierPatrols = [
      [10, 20], [-5, 30], [15, 0], [-15, 15], [5, -20],
      [20, -10], [-20, -30], [0, 40], [25, 40], [-25, 40],
      [30, 10], [-30, 0], [10, -40], [-10, -40]
    ];
    for (i = 0; i < soldierPatrols.length; i++) {
      e = createEnemy('soldier', soldierPatrols[i][0], 0, soldierPatrols[i][1]);
      e.userData.patrolCenter = new THREE.Vector3(soldierPatrols[i][0], 0, soldierPatrols[i][1]);
      e.userData.patrolAngle = Math.random() * Math.PI * 2;
      enemies.push(e);
    }

    // 6 pilots in hangars
    var pilotSpots = [
      [-48, -42], [-52, -38], [-48, -2], [-52, 2], [-48, 38], [-52, 42]
    ];
    for (i = 0; i < pilotSpots.length; i++) {
      e = createEnemy('pilot', pilotSpots[i][0], 0, pilotSpots[i][1]);
      enemies.push(e);
    }

    // Boss: Wing Commander Rosk in control tower
    var boss = createEnemy('boss', 20, 18, -30);
    boss.userData.hp = BOSS_HP;
    boss.userData.maxHp = BOSS_HP;
    boss.userData.phase = 'rifle'; // rifle or sidearm
    enemies.push(boss);
  }

  function createEnemy(type, x, y, z) {
    var group = new THREE.Group();

    var bodyColor = type === 'boss' ? 0x223322 : (type === 'pilot' ? 0x334433 : 0x445544);
    var hp = type === 'boss' ? BOSS_HP : (type === 'pilot' ? PILOT_HP : SOLDIER_HP);

    // body
    var bGeo = new THREE.BoxGeometry(0.7, 1.1, 0.4);
    var bMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    var body = new THREE.Mesh(bGeo, bMat);
    body.position.y = 1.2;
    group.add(body);

    // head
    var hGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
    var hMat = new THREE.MeshLambertMaterial({ color: 0x998877 });
    var head = new THREE.Mesh(hGeo, hMat);
    head.position.y = 1.95;
    group.add(head);

    // legs
    var lgGeo = new THREE.BoxGeometry(0.25, 0.9, 0.25);
    var lgMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    var legL = new THREE.Mesh(lgGeo, lgMat);
    legL.position.set(-0.2, 0.45, 0);
    group.add(legL);
    var legR = new THREE.Mesh(lgGeo, lgMat);
    legR.position.set(0.2, 0.45, 0);
    group.add(legR);

    group.position.set(x, y, z);
    scene.add(group);

    group.userData.type = type;
    group.userData.hp = hp;
    group.userData.maxHp = hp;
    group.userData.alive = true;
    group.userData.state = 'patrol'; // patrol | chase | attack | dead
    group.userData.fireTimer = Math.random() * 1.5;
    group.userData.fireDamage = type === 'boss' ? RIFLE_DAMAGE : (type === 'pilot' ? PISTOL_DAMAGE : RIFLE_DAMAGE);
    group.userData.fireRate = type === 'pilot' ? PISTOL_RATE : RIFLE_RATE;
    group.userData.alertedByRadar = false;
    group.userData.patrolCenter = new THREE.Vector3(x, 0, z);
    group.userData.patrolAngle = Math.random() * Math.PI * 2;

    return group;
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'aba-hud';
    hudEl.style.cssText = 'position:fixed;top:12px;right:14px;color:#aaffaa;font:14px monospace;text-shadow:1px 1px 2px #000;pointer-events:none;z-index:9999;text-align:right;display:none;';
    document.body.appendChild(hudEl);

    crosshairEl = document.createElement('div');
    crosshairEl.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:20px;pointer-events:none;z-index:9999;display:none;';
    crosshairEl.textContent = '+';
    document.body.appendChild(crosshairEl);

    messageEl = document.createElement('div');
    messageEl.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);color:#ffff88;font:16px monospace;text-shadow:1px 1px 3px #000;pointer-events:none;z-index:9999;text-align:center;display:none;';
    document.body.appendChild(messageEl);
  }

  function updateHUD() {
    if (!hudEl) return;
    var aaaStat = aaaEmplacements.map(function (a, i) {
      return 'AAA' + (i + 1) + ':' + (a.destroyed ? 'DEAD' : a.hp + 'HP');
    }).join('  ');
    var taxiStr = '';
    if (!taxiDone && taxiActive) {
      var remaining = Math.max(0, 140 - taxiElapsed);
      taxiStr = '<br>TAXI: ' + remaining.toFixed(0) + 's TO RUNWAY';
    } else if (!taxiDone && !taxiActive) {
      taxiStr = '<br>TAXI START: T-' + Math.max(0, TAXI_START_TIME - taxiElapsed).toFixed(0) + 's';
    }
    var detStr = detonationCountdown > 0 ? '<br><span style="color:#ff4444">DETONATION: ' + detonationCountdown.toFixed(0) + 's</span>' : '';
    var bossEnemy = getBoss();
    var bossHP = bossEnemy ? bossEnemy.userData.hp : 0;
    var bossStr = bossEnemy && bossEnemy.userData.alive ? 'ROSK: ' + bossHP + '/' + BOSS_HP + 'HP' : 'ROSK: ELIMINATED';
    hudEl.innerHTML =
      'HP: ' + playerHP + '<br>' +
      'WEAPON: ' + currentWeapon.toUpperCase() + ' [' + weaponAmmo[currentWeapon] + ']<br>' +
      'AIRCRAFT ARMED: ' + armedCount + '/4<br>' +
      aaaStat + '<br>' +
      'RADAR: ' + (radarActive ? '<span style="color:#ff8888">ACTIVE</span>' : '<span style="color:#88ff88">DESTROYED</span>') + '<br>' +
      bossStr +
      taxiStr + detStr;
  }

  function showMessage(msg, duration) {
    if (!messageEl) return;
    messageEl.style.display = 'block';
    messageEl.textContent = msg;
    messageTimer = duration || 3;
  }

  // ── input ─────────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    keys[e.code] = true;
    if (e.code === 'KeyE' && active && !gameOver) tryPlantC4();
    if (e.code === 'Digit1') currentWeapon = 'rifle';
    if (e.code === 'Digit2') currentWeapon = 'pistol';
    if (e.code === 'Digit3') currentWeapon = 'shotgun';
  }

  function onKeyUp(e) { keys[e.code] = false; }

  function onMouseMove(e) {
    if (!active) return;
    mouse.dx += e.movementX || 0;
    mouse.dy += e.movementY || 0;
  }

  function onMouseDown(e) {
    if (e.button === 0) mouse.fire = true;
  }

  function onMouseUp(e) {
    if (e.button === 0) mouse.fire = false;
  }

  // ── C4 plant ─────────────────────────────────────────────────────────────
  function tryPlantC4() {
    var closest = null;
    var closestDist = 5;
    var i, ac, d;
    for (i = 0; i < aircraft.length; i++) {
      ac = aircraft[i];
      if (ac.userData.armed) continue;
      d = playerPos.distanceTo(ac.position);
      if (d < closestDist) {
        closestDist = d;
        closest = ac;
      }
    }
    if (closest) {
      plantingTarget = closest;
      plantTimer = 0;
      showMessage('Planting C4... hold E', 4);
    }
  }

  function updateC4Plant(dt) {
    if (!plantingTarget) return;
    if (!keys['KeyE']) {
      plantingTarget = null;
      plantTimer = 0;
      return;
    }
    var d = playerPos.distanceTo(plantingTarget.position);
    if (d > 5.5) {
      plantingTarget = null;
      plantTimer = 0;
      showMessage('Too far from aircraft!', 2);
      return;
    }
    plantTimer += dt;
    if (plantTimer >= C4_PLANT_TIME) {
      plantingTarget.userData.armed = true;
      armedCount++;
      // visual marker
      var mGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      var mMat = new THREE.MeshLambertMaterial({ color: 0xff3300 });
      var marker = new THREE.Mesh(mGeo, mMat);
      marker.position.copy(plantingTarget.position);
      marker.position.y += 1.5;
      scene.add(marker);
      showMessage('C4 planted! (' + armedCount + '/4)', 3);
      if (armedCount === 4) {
        lastChargedTime = 0;
        detonationCountdown = DETONATION_WINDOW;
        showMessage('ALL AIRCRAFT ARMED! ELIMINATE ROSK & ESCAPE!', 6);
      }
      plantingTarget = null;
      plantTimer = 0;
    }
  }

  // ── shooting ──────────────────────────────────────────────────────────────
  function fireBullet() {
    if (weaponAmmo[currentWeapon] <= 0) {
      showMessage('Out of ammo!', 1.5);
      return;
    }
    weaponAmmo[currentWeapon]--;

    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    var spreadCount = currentWeapon === 'shotgun' ? 6 : 1;
    var i, spread, bDir, bul;
    for (i = 0; i < spreadCount; i++) {
      spread = currentWeapon === 'shotgun' ? 0.08 : 0;
      bDir = dir.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread
      )).normalize();

      var bGeo = new THREE.SphereGeometry(0.06, 4, 4);
      var bMat = new THREE.MeshLambertMaterial({ color: 0xffdd44 });
      bul = new THREE.Mesh(bGeo, bMat);
      bul.position.copy(playerPos).addScaledVector(dir, 0.8);
      bul.position.y -= 0.1;
      scene.add(bul);

      bullets.push({
        mesh: bul,
        vel: bDir.multiplyScalar(BULLET_SPEED),
        life: BULLET_LIFE,
        damage: currentWeapon === 'shotgun' ? SHOTGUN_DAMAGE : (currentWeapon === 'rifle' ? RIFLE_DAMAGE : PISTOL_DAMAGE)
      });
    }
  }

  // ── update bullets ────────────────────────────────────────────────────────
  function updateBullets(dt) {
    var i, b, j, e, d, tank;
    for (i = bullets.length - 1; i >= 0; i--) {
      b = bullets[i];
      b.life -= dt;
      b.mesh.position.addScaledVector(b.vel, dt);

      var hit = false;

      // check enemies
      for (j = 0; j < enemies.length; j++) {
        e = enemies[j];
        if (!e.userData.alive) continue;
        d = b.mesh.position.distanceTo(e.position);
        if (d < 1.2) {
          damageEnemy(e, b.damage);
          hit = true;
          break;
        }
      }

      // check AAA
      if (!hit) {
        for (j = 0; j < aaaEmplacements.length; j++) {
          var aaa = aaaEmplacements[j];
          if (aaa.destroyed) continue;
          d = b.mesh.position.distanceTo(aaa.pos);
          if (d < 3) {
            aaa.hp -= b.damage;
            if (aaa.hp <= 0) destroyAAA(j);
            hit = true;
            break;
          }
        }
      }

      // check fuel tanks
      if (!hit) {
        for (j = 0; j < fuelTanks.length; j++) {
          tank = fuelTanks[j];
          if (tank.userData.exploded) continue;
          d = b.mesh.position.distanceTo(tank.position);
          if (d < 3) {
            tank.userData.hp -= b.damage;
            if (tank.userData.hp <= 0) triggerFuelExplosion(j);
            hit = true;
            break;
          }
        }
      }

      // check radar
      if (!hit && radarActive && radarMesh) {
        d = b.mesh.position.distanceTo(radarMesh.position);
        if (d < 2) {
          radarActive = false;
          showMessage('RADAR DESTROYED! Enemy awareness reduced.', 4);
          scene.remove(radarMesh);
          radarMesh = null;
          hit = true;
        }
      }

      if (hit || b.life <= 0 || b.mesh.position.y < -2) {
        scene.remove(b.mesh);
        bullets.splice(i, 1);
      }
    }
  }

  // ── damage & death ────────────────────────────────────────────────────────
  function damageEnemy(e, dmg) {
    e.userData.hp -= dmg;
    e.userData.state = 'chase';
    if (!baseAlerted) {
      baseAlerted = true;
      alertEnemies();
    }
    if (e.userData.hp <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    e.userData.alive = false;
    e.userData.state = 'dead';
    e.rotation.z = Math.PI / 2;
    e.position.y = -0.3;
    // flash red
    e.traverse(function (c) {
      if (c.isMesh) c.material = new THREE.MeshLambertMaterial({ color: 0x882200 });
    });
  }

  function alertEnemies() {
    var i, e;
    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (e.userData.alive && e.userData.state === 'patrol') {
        e.userData.state = 'chase';
      }
      if (e.userData.type === 'pilot') {
        e.userData.fireDamage = PISTOL_DAMAGE;
      }
    }
  }

  function getBoss() {
    var i;
    for (i = 0; i < enemies.length; i++) {
      if (enemies[i].userData.type === 'boss') return enemies[i];
    }
    return null;
  }

  function destroyAAA(idx) {
    aaaEmplacements[idx].destroyed = true;
    aaaEmplacements[idx].hp = 0;
    scene.remove(aaaEmplacements[idx].group);
    spawnExplosion(aaaEmplacements[idx].pos, 0xff6600, 4);
    showMessage('AAA emplacement ' + (idx + 1) + ' destroyed!', 3);
  }

  function triggerFuelExplosion(startIdx) {
    var i, tank, d;
    fuelTanks[startIdx].userData.exploded = true;
    scene.remove(fuelTanks[startIdx]);
    spawnExplosion(fuelTanks[startIdx].position, 0xff4400, 8);

    // chain explosion
    for (i = 0; i < fuelTanks.length; i++) {
      if (fuelTanks[i].userData.exploded) continue;
      d = fuelTanks[i].position.distanceTo(fuelTanks[startIdx].position);
      if (d < FUEL_AOE) {
        fuelTanks[i].userData.exploded = true;
        scene.remove(fuelTanks[i]);
        spawnExplosion(fuelTanks[i].position, 0xff6600, 6);
      }
    }

    // damage enemies in AoE
    for (i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e.userData.alive) continue;
      d = e.position.distanceTo(fuelTanks[startIdx].position);
      if (d < FUEL_AOE) {
        damageEnemy(e, 80);
      }
    }

    // damage player
    d = playerPos.distanceTo(fuelTanks[startIdx].position);
    if (d < FUEL_AOE) {
      playerHP -= Math.max(0, 80 - d);
      showMessage('FUEL EXPLOSION! ' + Math.max(0, Math.floor(80 - d)) + ' damage!', 3);
    }

    showMessage('FUEL DEPOT CHAIN EXPLOSION!', 4);
  }

  // ── explosions (visual) ───────────────────────────────────────────────────
  function spawnExplosion(pos, color, size) {
    var geo = new THREE.SphereGeometry(size * 0.4, 6, 6);
    var mat = new THREE.MeshLambertMaterial({ color: color, transparent: true, opacity: 0.9 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    explosions.push({ mesh: mesh, life: 1.2, maxLife: 1.2, size: size });
  }

  function updateExplosions(dt) {
    var i, ex, t;
    for (i = explosions.length - 1; i >= 0; i--) {
      ex = explosions[i];
      ex.life -= dt;
      t = ex.life / ex.maxLife;
      ex.mesh.material.opacity = t * 0.9;
      ex.mesh.scale.setScalar(1 + (1 - t) * 2);
      if (ex.life <= 0) {
        scene.remove(ex.mesh);
        explosions.splice(i, 1);
      }
    }
  }

  // ── enemy AI ──────────────────────────────────────────────────────────────
  function updateEnemies(dt) {
    var i, e, d, dir, sightRange, boss, bossAlive;
    boss = getBoss();
    bossAlive = boss && boss.userData.alive;

    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (!e.userData.alive) continue;

      d = e.position.distanceTo(playerPos);
      sightRange = SIGHT_RANGE_BASE * (radarActive ? RADAR_AWARE_BUFF : 1.0);

      // state transitions
      if (e.userData.state === 'patrol') {
        if (d < sightRange || baseAlerted) e.userData.state = 'chase';
      }
      if (e.userData.state === 'chase') {
        if (d < ATTACK_RANGE) e.userData.state = 'attack';
      }
      if (e.userData.state === 'attack') {
        if (d > ATTACK_RANGE * 1.5) e.userData.state = 'chase';
      }

      if (e.userData.state === 'patrol') {
        // patrol circle
        e.userData.patrolAngle += dt * 0.5;
        var px = e.userData.patrolCenter.x + Math.cos(e.userData.patrolAngle) * 6;
        var pz = e.userData.patrolCenter.z + Math.sin(e.userData.patrolAngle) * 6;
        dir = new THREE.Vector3(px - e.position.x, 0, pz - e.position.z).normalize();
        e.position.addScaledVector(dir, PATROL_SPEED * dt);
        e.lookAt(new THREE.Vector3(px, e.position.y, pz));

      } else if (e.userData.state === 'chase') {
        dir = new THREE.Vector3().subVectors(playerPos, e.position).setY(0).normalize();
        var spd = e.userData.type === 'boss' ? CHASE_SPEED * 0.6 : CHASE_SPEED;
        e.position.addScaledVector(dir, spd * dt);
        e.lookAt(new THREE.Vector3(playerPos.x, e.position.y, playerPos.z));

      } else if (e.userData.state === 'attack') {
        e.lookAt(new THREE.Vector3(playerPos.x, e.position.y, playerPos.z));
        e.userData.fireTimer -= dt;
        if (e.userData.fireTimer <= 0) {
          e.userData.fireTimer = e.userData.fireRate * (2 + Math.random());
          // boss uses AAA remote targeting
          if (e.userData.type === 'boss' && bossAlive) {
            fireAAAAtPlayer();
          }
          // direct fire damage
          if (d < ATTACK_RANGE) {
            var hitChance = e.userData.type === 'boss' ? 0.7 : 0.4;
            if (Math.random() < hitChance) {
              playerHP -= e.userData.fireDamage;
              if (playerHP <= 0) { playerHP = 0; triggerGameOver(false); }
            }
          }
        }
      }

      // boss phase switch
      if (e.userData.type === 'boss') {
        if (e.userData.hp < BOSS_HP * 0.4 && e.userData.phase === 'rifle') {
          e.userData.phase = 'sidearm';
          e.userData.fireDamage = PISTOL_DAMAGE * 1.4;
          e.userData.fireRate = PISTOL_RATE;
          showMessage('Rosk switches to sidearm — more aggressive!', 3);
        }
      }
    }
  }

  function fireAAAAtPlayer() {
    var i, aaa;
    for (i = 0; i < aaaEmplacements.length; i++) {
      aaa = aaaEmplacements[i];
      if (aaa.destroyed) continue;
      var d = playerPos.distanceTo(aaa.pos);
      if (d < 80) {
        playerHP -= AAA_DAMAGE * 0.6;
        if (playerHP <= 0) { playerHP = 0; triggerGameOver(false); }
        spawnExplosion(playerPos.clone().addScalar(Math.random() * 2 - 1), 0xff8800, 1.5);
        showMessage('AAA fire! -' + Math.floor(AAA_DAMAGE * 0.6) + ' HP', 1.5);
      }
    }
  }

  // ── AAA auto-fire ─────────────────────────────────────────────────────────
  function updateAAA(dt) {
    var i, aaa, boss;
    boss = getBoss();
    var bossAlive = boss && boss.userData.alive;
    // AAA only auto-fires if Rosk is NOT alive (when alive, Rosk aims them)
    if (bossAlive) return;

    for (i = 0; i < aaaEmplacements.length; i++) {
      aaa = aaaEmplacements[i];
      if (aaa.destroyed) continue;
      aaa.fireTimer -= dt;
      if (aaa.fireTimer <= 0) {
        aaa.fireTimer = AAA_FIRE_INTERVAL;
        var d = playerPos.distanceTo(aaa.pos);
        if (d < 80) {
          playerHP -= AAA_DAMAGE;
          if (playerHP <= 0) { playerHP = 0; triggerGameOver(false); }
          spawnExplosion(playerPos.clone(), 0xff6600, 2);
          showMessage('AAA burst! -' + AAA_DAMAGE + ' HP', 1.5);
        }
      }
    }
  }

  // ── taxi aircraft ─────────────────────────────────────────────────────────
  function updateTaxi(dt) {
    if (taxiDone) return;
    taxiElapsed += dt;

    if (!taxiActive && taxiElapsed >= TAXI_START_TIME) {
      taxiActive = true;
      showMessage('ALERT: Bomber taxiing to runway! Plant C4 NOW!', 5);
    }

    if (taxiActive && taxiAircraft) {
      if (taxiAircraft.userData.armed) {
        taxiDone = true;
        showMessage('Taxi bomber armed with C4!', 3);
        return;
      }
      // move towards runway
      var target = new THREE.Vector3(55, 0.4, taxiAircraft.position.z);
      var dir = new THREE.Vector3().subVectors(target, taxiAircraft.position).normalize();
      taxiAircraft.position.addScaledVector(dir, 8 * dt);
      if (taxiAircraft.position.x >= 54) {
        taxiDone = true;
        showMessage('BOMBER ESCAPED TO RUNWAY — MISSION COMPROMISED!', 5);
      }
    }
  }

  // ── radar rotation ────────────────────────────────────────────────────────
  function updateRadar(dt) {
    if (radarActive && radarMesh) {
      radarMesh.rotation.y += dt * 1.2;
    }
  }

  // ── player movement ───────────────────────────────────────────────────────
  function updatePlayer(dt) {
    // look
    var sensitivity = 0.002;
    yaw -= mouse.dx * sensitivity;
    pitch -= mouse.dy * sensitivity;
    pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, pitch));
    mouse.dx = 0;
    mouse.dy = 0;

    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    // movement
    var forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    var right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    var move = new THREE.Vector3();

    if (keys['KeyW'] || keys['ArrowUp']) move.addScaledVector(forward, 1);
    if (keys['KeyS'] || keys['ArrowDown']) move.addScaledVector(forward, -1);
    if (keys['KeyA'] || keys['ArrowLeft']) move.addScaledVector(right, -1);
    if (keys['KeyD'] || keys['ArrowRight']) move.addScaledVector(right, 1);

    if (move.lengthSq() > 0) move.normalize().multiplyScalar(PLAYER_SPEED);
    playerVel.x = move.x;
    playerVel.z = move.z;

    // gravity
    if (!onGround) playerVel.y += GRAVITY * dt;
    if (keys['Space'] && onGround) {
      playerVel.y = JUMP_VEL;
      onGround = false;
    }

    playerPos.addScaledVector(playerVel, dt);

    // ground collision
    if (playerPos.y <= PLAYER_HEIGHT) {
      playerPos.y = PLAYER_HEIGHT;
      playerVel.y = 0;
      onGround = true;
    } else {
      onGround = false;
    }

    // clamp to world
    playerPos.x = Math.max(-98, Math.min(98, playerPos.x));
    playerPos.z = Math.max(-118, Math.min(118, playerPos.z));

    camera.position.copy(playerPos);
  }

  // ── firing ────────────────────────────────────────────────────────────────
  function updateFiring(dt) {
    fireTimer -= dt;
    if (mouse.fire && fireTimer <= 0) {
      var rate = currentWeapon === 'rifle' ? RIFLE_RATE : (currentWeapon === 'pistol' ? PISTOL_RATE : 0.7);
      fireTimer = rate;
      fireBullet();
    }
  }

  // ── detonation countdown ──────────────────────────────────────────────────
  function updateDetonation(dt) {
    if (detonationCountdown <= 0) return;
    detonationCountdown -= dt;
    if (detonationCountdown <= 0) {
      // check win: boss dead + player near entrance (z > 55 area)
      var boss = getBoss();
      var bossDefeated = !boss || !boss.userData.alive;
      var nearEscape = playerPos.z > 52 && playerPos.x > -15 && playerPos.x < 15;
      if (armedCount >= 4 && bossDefeated && nearEscape) {
        triggerGameOver(true);
      } else if (armedCount >= 4 && bossDefeated) {
        showMessage('DETONATING... ESCAPE NOW!', 3);
        detonationCountdown = 8;
      } else {
        triggerGameOver(false);
      }
    }
  }

  // ── win/loss ──────────────────────────────────────────────────────────────
  function triggerGameOver(win) {
    if (gameOver) return;
    gameOver = true;
    winState = win;
    if (win) {
      // detonate all aircraft
      var i;
      for (i = 0; i < aircraft.length; i++) {
        spawnExplosion(aircraft[i].position, 0xff4400, 6);
        scene.remove(aircraft[i]);
      }
      showMessage('MISSION COMPLETE! Air base destroyed!', 0);
    } else {
      showMessage('MISSION FAILED. ' + (playerHP <= 0 ? 'You were eliminated.' : 'Objective failed.'), 0);
    }
    if (messageEl) {
      messageEl.style.color = win ? '#44ff44' : '#ff4444';
      messageEl.style.fontSize = '24px';
    }
  }

  // ── win check each frame ──────────────────────────────────────────────────
  function checkWinCondition() {
    if (gameOver) return;
    var boss = getBoss();
    var bossDefeated = !boss || !boss.userData.alive;
    var nearEscape = playerPos.z > 52 && playerPos.x > -18 && playerPos.x < 18;
    if (armedCount >= 4 && bossDefeated && nearEscape && detonationCountdown > 0 && detonationCountdown < DETONATION_WINDOW) {
      triggerGameOver(true);
    }
  }

  // ── message timer ─────────────────────────────────────────────────────────
  function updateMessages(dt) {
    if (!messageEl) return;
    if (messageTimer > 0) {
      messageTimer -= dt;
      messageEl.style.display = 'block';
      if (messageTimer <= 0 && !gameOver) {
        messageEl.style.display = 'none';
      }
    }
  }

  // ── hp regeneration (slight) ──────────────────────────────────────────────
  var hpRegenTimer = 0;
  function updateRegen(dt) {
    if (playerHP <= 0 || playerHP >= 100) return;
    hpRegenTimer += dt;
    if (hpRegenTimer >= 5) {
      hpRegenTimer = 0;
      playerHP = Math.min(100, playerHP + 2);
    }
  }

  // ── main update ───────────────────────────────────────────────────────────
  function update() {
    if (!active) return;
    var dt = Math.min(clock.getDelta(), 0.05);

    if (gameOver) {
      updateHUD();
      return;
    }

    updatePlayer(dt);
    updateFiring(dt);
    updateBullets(dt);
    updateEnemies(dt);
    updateAAA(dt);
    updateTaxi(dt);
    updateRadar(dt);
    updateC4Plant(dt);
    updateDetonation(dt);
    updateExplosions(dt);
    updateMessages(dt);
    updateRegen(dt);
    checkWinCondition();
    updateHUD();
  }

  // ── show/hide HUD on activation ───────────────────────────────────────────
  function showHUD(visible) {
    if (hudEl) hudEl.style.display = visible ? 'block' : 'none';
    if (crosshairEl) crosshairEl.style.display = visible ? 'block' : 'none';
    if (messageEl && !visible) messageEl.style.display = 'none';
  }

  // watch active state for HUD toggling
  var _prevActive = false;
  function _checkActive() {
    if (active !== _prevActive) {
      _prevActive = active;
      showHUD(active);
    }
  }

  // ── public API ────────────────────────────────────────────────────────────
  return {
    init: function (sceneRef, cameraRef, rendererRef) {
      init(sceneRef, cameraRef, rendererRef);
    },
    update: function () {
      _checkActive();
      update();
    },
    reset: function () {
      reset();
    }
  };
}());
