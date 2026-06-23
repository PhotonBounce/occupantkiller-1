window.TankWarfare = (function () {
  'use strict';

  // ── state ──────────────────────────────────────────────────────────────────
  var scene, camera, renderer, clock;
  var active = false;
  var keysDown = {};
  var tKeyTime = 0, kKeyTime = 0;
  var ACTIVATION_WINDOW = 400;

  // player
  var playerTank = null;
  var playerHP = 500;
  var playerMaxHP = 500;
  var leftTrackDamaged = false;
  var rightTrackDamaged = false;
  var trackRepairTimer = 0;
  var trackRepairCooldown = 20;
  var hullYaw = 0;
  var turretYaw = 0;
  var mouseX = 0;

  // roles
  var ROLES = ['COMMANDER', 'GUNNER', 'LOADER', 'DRIVER'];
  var currentRole = 1; // GUNNER by default

  // shell types
  var SHELL_AP = 0, SHELL_HE = 1, SHELL_HEAT = 2;
  var currentShellType = SHELL_AP;
  var ammo = [8, 8, 8]; // AP, HE, HEAT

  // reload
  var reloadTime = 8.0;
  var reloadTimer = 0;
  var loaderBoost = false;

  // spotting
  var commanderSpotting = false;

  // smoke
  var smokeClouds = [];
  var smokeTimer = 0;
  var smokeCooldown = 30;
  var SMOKE_RADIUS = 8;

  // laser warning / flares
  var laserWarningActive = false;
  var laserWarningTimer = 0;
  var laserLight = null;
  var flares = [];

  // projectiles
  var projectiles = [];

  // enemies
  var enemyTanks = [];
  var infantryTeams = [];
  var commandPost = null;
  var killCount = 0;

  // resupply truck
  var resupplyTruck = null;
  var resupplySpawned = false;

  // berms (cover)
  var berms = [];

  // HUD element
  var hudEl = null;

  // geometry cache
  var geoCache = {};

  // ── geometry helpers ───────────────────────────────────────────────────────
  function boxGeo(w, h, d) {
    var key = 'box_' + w + '_' + h + '_' + d;
    if (!geoCache[key]) geoCache[key] = new THREE.BoxGeometry(w, h, d);
    return geoCache[key];
  }
  function cylGeo(rt, rb, h, segs) {
    var s = segs || 8;
    var key = 'cyl_' + rt + '_' + rb + '_' + h + '_' + s;
    if (!geoCache[key]) geoCache[key] = new THREE.CylinderGeometry(rt, rb, h, s);
    return geoCache[key];
  }
  function sphereGeo(r, ws, hs) {
    var w = ws || 8, hh = hs || 6;
    var key = 'sph_' + r + '_' + w + '_' + hh;
    if (!geoCache[key]) geoCache[key] = new THREE.SphereGeometry(r, w, hh);
    return geoCache[key];
  }
  function coneGeo(r, h, segs) {
    var s = segs || 6;
    var key = 'cone_' + r + '_' + h + '_' + s;
    if (!geoCache[key]) geoCache[key] = new THREE.ConeGeometry(r, h, s);
    return geoCache[key];
  }

  function mat(color, opts) {
    var params = { color: color };
    if (opts) {
      if (opts.emissive !== undefined) params.emissive = opts.emissive;
      if (opts.emissiveIntensity !== undefined) params.emissiveIntensity = opts.emissiveIntensity;
      if (opts.transparent !== undefined) params.transparent = opts.transparent;
      if (opts.opacity !== undefined) params.opacity = opts.opacity;
    }
    return new THREE.MeshLambertMaterial(params);
  }

  function mesh(geo, material) {
    return new THREE.Mesh(geo, material);
  }

  // ── player tank build ──────────────────────────────────────────────────────
  function buildPlayerTank() {
    var group = new THREE.Group();

    // hull 6×2×4
    var hull = mesh(boxGeo(6, 2, 4), mat(0x445544));
    hull.position.y = 1;
    group.add(hull);

    // turret 3×1.5×3
    var turretGroup = new THREE.Group();
    var turret = mesh(boxGeo(3, 1.5, 3), mat(0x445544));
    turret.position.y = 0;
    turretGroup.add(turret);

    // cannon  r=0.2 h=5
    var cannon = mesh(cylGeo(0.2, 0.2, 5), mat(0x223322));
    cannon.rotation.x = Math.PI / 2;
    cannon.position.z = -3.2;
    cannon.position.y = 0;
    turretGroup.add(cannon);

    // laser warning light on turret
    laserLight = new THREE.PointLight(0xFF0000, 0, 3);
    laserLight.position.set(0, 1.5, 0);
    turretGroup.add(laserLight);

    turretGroup.position.set(0, 2.75, -0.2);
    group.add(turretGroup);
    group.userData.turretGroup = turretGroup;

    // tracks: 4 CylinderGeometry, r=1.2, h=0.4 (2 per side)
    var trackPositions = [
      [-3.4, 0.8, -1.2],
      [-3.4, 0.8,  1.2],
      [ 3.4, 0.8, -1.2],
      [ 3.4, 0.8,  1.2]
    ];
    var tracks = [];
    for (var i = 0; i < trackPositions.length; i++) {
      var tp = trackPositions[i];
      var track = mesh(cylGeo(1.2, 1.2, 0.4, 10), mat(0x222222));
      track.rotation.z = Math.PI / 2;
      track.position.set(tp[0], tp[1], tp[2]);
      group.add(track);
      tracks.push(track);
    }
    group.userData.tracks = tracks;
    group.userData.leftTracks  = [tracks[0], tracks[1]];
    group.userData.rightTracks = [tracks[2], tracks[3]];

    group.position.set(0, 0, 10);
    return group;
  }

  // ── enemy tank build ───────────────────────────────────────────────────────
  function buildEnemyTank(px, pz) {
    var group = new THREE.Group();

    var hull = mesh(boxGeo(5, 1.8, 3.5), mat(0x554433));
    hull.position.y = 0.9;
    group.add(hull);

    var turretGrp = new THREE.Group();
    var turret = mesh(boxGeo(2.5, 1.2, 2.5), mat(0x554433));
    turretGrp.add(turret);

    var cannon = mesh(cylGeo(0.18, 0.18, 4.5), mat(0x332211));
    cannon.rotation.x = Math.PI / 2;
    cannon.position.z = -2.8;
    turretGrp.add(cannon);

    turretGrp.position.set(0, 2.3, 0);
    group.add(turretGrp);
    group.userData.turretGroup = turretGrp;

    // tracks
    var eTrackPos = [
      [-3.0, 0.7, -1.0],
      [-3.0, 0.7,  1.0],
      [ 3.0, 0.7, -1.0],
      [ 3.0, 0.7,  1.0]
    ];
    for (var i = 0; i < eTrackPos.length; i++) {
      var tp = eTrackPos[i];
      var track = mesh(cylGeo(1.0, 1.0, 0.35, 8), mat(0x222222));
      track.rotation.z = Math.PI / 2;
      track.position.set(tp[0], tp[1], tp[2]);
      group.add(track);
    }

    group.position.set(px, 0, pz);
    group.userData.hp = 300;
    group.userData.maxHP = 300;
    group.userData.shootTimer = 8 + Math.random() * 7;
    group.userData.dead = false;
    group.userData.turretYaw = 0;
    return group;
  }

  // ── infantry team build ────────────────────────────────────────────────────
  function buildInfantryTeam(px, pz) {
    var group = new THREE.Group();
    // 3 soldiers per team as simple box stacks
    for (var i = 0; i < 3; i++) {
      var body = mesh(boxGeo(0.5, 1.0, 0.4), mat(0x556644));
      body.position.set((i - 1) * 1.2, 0.5, 0);
      group.add(body);
      var head = mesh(sphereGeo(0.25, 6, 4), mat(0x886655));
      head.position.set((i - 1) * 1.2, 1.25, 0);
      group.add(head);
    }
    group.position.set(px, 0, pz);
    group.userData.hp = 60;
    group.userData.shootTimer = 10 + Math.random() * 4;
    group.userData.dead = false;
    return group;
  }

  // ── berm build ─────────────────────────────────────────────────────────────
  function buildBerm(px, pz, w, h, d) {
    var b = mesh(boxGeo(w, h, d), mat(0x887755));
    b.position.set(px, h / 2, pz);
    return b;
  }

  // ── command post ───────────────────────────────────────────────────────────
  function buildCommandPost() {
    var group = new THREE.Group();
    var base = mesh(boxGeo(6, 4, 6), mat(0x334433));
    base.position.y = 2;
    group.add(base);
    var antenna = mesh(cylGeo(0.1, 0.1, 3), mat(0x222222));
    antenna.position.set(0, 5.5, 0);
    group.add(antenna);
    group.position.set(-40, 0, -40);
    group.userData.hp = 400;
    group.userData.dead = false;
    return group;
  }

  // ── resupply truck ─────────────────────────────────────────────────────────
  function buildResupplyTruck() {
    var group = new THREE.Group();
    var cab = mesh(boxGeo(3, 2, 2.5), mat(0x667755));
    cab.position.set(-1.5, 1, 0);
    group.add(cab);
    var bed = mesh(boxGeo(5, 1.5, 2.5), mat(0x556644));
    bed.position.set(1.5, 0.75, 0);
    group.add(bed);
    // wheels
    var wPos = [[-2.5, 0.6, -1.4],[-2.5, 0.6, 1.4],[1.5, 0.6, -1.4],[1.5, 0.6, 1.4]];
    for (var i = 0; i < wPos.length; i++) {
      var w = mesh(cylGeo(0.6, 0.6, 0.4, 8), mat(0x111111));
      w.rotation.z = Math.PI / 2;
      w.position.set(wPos[i][0], wPos[i][1], wPos[i][2]);
      group.add(w);
    }
    group.position.set(80, 0, 0);
    group.userData.active = true;
    group.userData.speed = 8;
    return group;
  }

  // ── ground ─────────────────────────────────────────────────────────────────
  function buildGround() {
    var g = mesh(boxGeo(200, 0.2, 200), mat(0x556644));
    g.position.y = -0.1;
    return g;
  }

  // ── scene setup ────────────────────────────────────────────────────────────
  function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7AA0C0);
    scene.fog = new THREE.Fog(0x7AA0C0, 80, 200);

    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 500);

    clock = new THREE.Clock();

    // lights
    var ambient = new THREE.AmbientLight(0xCCDDCC, 0.7);
    scene.add(ambient);
    var sun = new THREE.DirectionalLight(0xFFFFEE, 1.0);
    sun.position.set(50, 80, 30);
    scene.add(sun);

    // ground
    scene.add(buildGround());

    // player tank
    playerTank = buildPlayerTank();
    scene.add(playerTank);

    // berms
    var bermData = [
      [15, -5,  10, 2.5, 5],
      [-15, 8,  8, 2.2, 4],
      [5, -20,  12, 3, 6],
      [-8, 15,  9, 2, 5]
    ];
    for (var i = 0; i < bermData.length; i++) {
      var bd = bermData[i];
      var b = buildBerm(bd[0], bd[1], bd[2], bd[3], bd[4]);
      scene.add(b);
      berms.push(b);
    }

    // enemy tanks
    var eTankPos = [
      [-30, -30],
      [ 30, -40],
      [-10, -50],
      [ 20, -20]
    ];
    for (var j = 0; j < eTankPos.length; j++) {
      var et = buildEnemyTank(eTankPos[j][0], eTankPos[j][1]);
      scene.add(et);
      enemyTanks.push(et);
    }

    // infantry teams
    var infPos = [
      [-25, -15],
      [ 25, -15],
      [-5,  -35],
      [ 15, -45]
    ];
    for (var k = 0; k < infPos.length; k++) {
      var it = buildInfantryTeam(infPos[k][0], infPos[k][1]);
      scene.add(it);
      infantryTeams.push(it);
    }

    // command post
    commandPost = buildCommandPost();
    scene.add(commandPost);

    // renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // HUD
    hudEl = document.createElement('div');
    hudEl.id = 'tw-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.72)',
      'color:#AAFFAA',
      'font:bold 13px monospace',
      'padding:8px 18px',
      'border:1px solid #4A8',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(hudEl);

    // crosshair
    var ch = document.createElement('div');
    ch.id = 'tw-crosshair';
    ch.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'width:20px',
      'height:20px',
      'margin:-10px 0 0 -10px',
      'border:2px solid rgba(0,255,100,0.7)',
      'border-radius:50%',
      'pointer-events:none',
      'z-index:9999'
    ].join(';');
    document.body.appendChild(ch);

    window.addEventListener('resize', onResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
  }

  // ── event handlers ─────────────────────────────────────────────────────────
  function onResize() {
    if (!active) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onMouseMove(e) {
    if (!active) return;
    mouseX += e.movementX * 0.003;
  }

  function onKeyDown(e) {
    var k = e.code;
    keysDown[k] = true;

    // activation tracking
    if (k === 'KeyT') tKeyTime = Date.now();
    if (k === 'KeyK') kKeyTime = Date.now();

    if (!active) return;

    if (k === 'Tab') {
      e.preventDefault();
      currentRole = (currentRole + 1) % ROLES.length;
    }
    if (k === 'KeyQ') {
      currentShellType = (currentShellType + 1) % 3;
    }
    if (k === 'Space' && currentRole === 1) { // GUNNER fires
      fireShell();
    }
    if (k === 'KeyG' && currentRole === 2) { // LOADER shortens reload
      loaderBoost = true;
    }
    if (k === 'KeyC' && currentRole === 0) { // COMMANDER spotting
      commanderSpotting = !commanderSpotting;
    }
    if (k === 'KeyS') { // smoke launchers (also WASD handled in update)
      fireSmokeGrenades();
    }
    if (k === 'KeyX') { // flare / countermeasure
      fireFlare();
    }
    if (k === 'KeyE') { // repair tracks
      tryRepairTracks();
    }
  }

  function onKeyUp(e) {
    keysDown[e.code] = false;
    if (e.code === 'KeyG') loaderBoost = false;
  }

  // ── activation check ───────────────────────────────────────────────────────
  function checkActivation() {
    if (active) return;
    var now = Date.now();
    if (keysDown['KeyT'] && keysDown['KeyK']) {
      if (Math.abs(tKeyTime - kKeyTime) <= ACTIVATION_WINDOW) {
        activate();
      }
    }
  }

  function activate() {
    if (active) return;
    active = true;
    setupScene();
    requestAnimationFrame(loop);
  }

  // ── shell firing ───────────────────────────────────────────────────────────
  function fireShell() {
    if (reloadTimer > 0) return;
    if (ammo[currentShellType] <= 0) return;

    ammo[currentShellType]--;
    reloadTimer = loaderBoost ? reloadTime * 0.6 : reloadTime;

    var tg = playerTank.userData.turretGroup;
    var origin = new THREE.Vector3();
    tg.getWorldPosition(origin);
    origin.y += 0.5;

    var totalYaw = hullYaw + turretYaw;
    var dir = new THREE.Vector3(
      -Math.sin(totalYaw),
      0,
      -Math.cos(totalYaw)
    );

    var shellGeo, shellMat, shellSpeed;
    if (currentShellType === SHELL_AP) {
      shellGeo = cylGeo(0.12, 0.12, 0.8, 6);
      shellMat = mat(0xCCCC44);
      shellSpeed = 70;
    } else if (currentShellType === SHELL_HE) {
      shellGeo = sphereGeo(0.22, 6, 4);
      shellMat = mat(0xCC6622);
      shellSpeed = 55;
    } else {
      shellGeo = cylGeo(0.15, 0.05, 1.2, 6);
      shellMat = mat(0xFF4400);
      shellSpeed = 40;
    }

    var shellMesh = mesh(shellGeo, shellMat);
    shellMesh.position.copy(origin);
    shellMesh.position.z -= 4;
    scene.add(shellMesh);

    projectiles.push({
      obj: shellMesh,
      vel: dir.clone().multiplyScalar(shellSpeed),
      type: currentShellType,
      life: 4.0,
      fromPlayer: true,
      heatCurve: currentShellType === SHELL_HEAT ? 0 : null
    });
  }

  // ── enemy fire ─────────────────────────────────────────────────────────────
  function enemyFireAt(et) {
    var origin = new THREE.Vector3();
    et.userData.turretGroup.getWorldPosition(origin);
    origin.y += 0.5;

    var playerPos = new THREE.Vector3();
    playerTank.getWorldPosition(playerPos);
    var dir = playerPos.clone().sub(origin).normalize();

    // 2s before AT missile hits, trigger laser warning
    laserWarningActive = true;
    laserWarningTimer = 2.0;

    var s = mesh(sphereGeo(0.2, 5, 4), mat(0xFFAA00));
    s.position.copy(origin);
    scene.add(s);

    projectiles.push({
      obj: s,
      vel: dir.clone().multiplyScalar(35),
      type: SHELL_AP,
      life: 5.0,
      fromPlayer: false
    });
  }

  // ── infantry RPG fire ──────────────────────────────────────────────────────
  function infantryFireRPG(inf) {
    var origin = new THREE.Vector3();
    inf.getWorldPosition(origin);
    origin.y += 1;

    var playerPos = new THREE.Vector3();
    playerTank.getWorldPosition(playerPos);
    var dir = playerPos.clone().sub(origin).normalize();

    var rpg = mesh(cylGeo(0.1, 0.05, 1.0, 5), mat(0xFF6600));
    rpg.position.copy(origin);
    scene.add(rpg);

    projectiles.push({
      obj: rpg,
      vel: dir.clone().multiplyScalar(28),
      type: SHELL_HE,
      life: 6.0,
      fromPlayer: false,
      isRPG: true,
      targetSide: Math.random() > 0.5 ? 'left' : 'right'
    });
  }

  // ── smoke grenades ─────────────────────────────────────────────────────────
  function fireSmokeGrenades() {
    if (smokeTimer > 0) return;
    smokeTimer = smokeCooldown;

    var positions = [[-4, 0], [-4, 2], [-4, -2], [4, 0], [4, 2], [4, -2]];
    for (var i = 0; i < positions.length; i++) {
      (function (idx) {
        var delay = idx * 0.15;
        var pPos = playerTank.position.clone();
        pPos.x += positions[idx][0];
        pPos.z += positions[idx][1];
        // place smoke cloud
        var smoke = mesh(sphereGeo(SMOKE_RADIUS * 0.5, 8, 6), mat(0xCCCCCC, { transparent: true, opacity: 0.45 }));
        smoke.position.set(pPos.x, 2, pPos.z);
        scene.add(smoke);
        smokeClouds.push({ obj: smoke, life: 15.0, radius: SMOKE_RADIUS });
      })(i);
    }
  }

  // ── flare ──────────────────────────────────────────────────────────────────
  function fireFlare() {
    var pos = playerTank.position.clone();
    pos.y += 4;
    var fl = mesh(sphereGeo(0.35, 8, 6), mat(0xFFFF00, { emissive: 0xFFCC00, emissiveIntensity: 1.5 }));
    fl.position.copy(pos);
    scene.add(fl);

    var flLight = new THREE.PointLight(0xFFFF88, 3, 20);
    fl.add(flLight);

    // smoke trail
    var smk = mesh(sphereGeo(2, 6, 4), mat(0xBBBBBB, { transparent: true, opacity: 0.35 }));
    smk.position.copy(pos);
    scene.add(smk);

    flares.push({
      obj: fl,
      smoke: smk,
      vel: new THREE.Vector3((Math.random() - 0.5) * 10, 8, (Math.random() - 0.5) * 10),
      life: 4.0
    });

    // cancel laser warning
    laserWarningActive = false;
    laserWarningTimer = 0;
    if (laserLight) laserLight.intensity = 0;
  }

  // ── track repair ───────────────────────────────────────────────────────────
  function tryRepairTracks() {
    if (!leftTrackDamaged && !rightTrackDamaged) return;
    if (trackRepairTimer > 0) return;
    trackRepairTimer = trackRepairCooldown;
  }

  // ── hit-check helper ───────────────────────────────────────────────────────
  function dist2(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return dx * dx + dz * dz;
  }

  // ── penetration angle damage ───────────────────────────────────────────────
  function calcPenetrationDamage(shooterPos, targetObj, baseDmg) {
    var tPos = new THREE.Vector3();
    targetObj.getWorldPosition(tPos);
    var toTarget = tPos.clone().sub(shooterPos).normalize();
    var fwd = new THREE.Vector3(
      -Math.sin(targetObj.rotation.y),
      0,
      -Math.cos(targetObj.rotation.y)
    );
    var dot = toTarget.dot(fwd); // 1 = frontal
    if (dot > Math.cos(Math.PI / 4)) return baseDmg; // frontal 80
    return baseDmg * 0.5; // angled 40
  }

  // ── hull-down check ────────────────────────────────────────────────────────
  function isHullDown() {
    for (var i = 0; i < berms.length; i++) {
      var b = berms[i];
      var bp = b.position;
      var pp = playerTank.position;
      var dx = Math.abs(pp.x - bp.x);
      var dz = Math.abs(pp.z - bp.z);
      var geo = b.geometry;
      var size = new THREE.Vector3();
      geo.computeBoundingBox();
      geo.boundingBox.getSize(size);
      if (dx < size.x / 2 + 1 && dz < size.z / 2 + 1) return true;
    }
    return false;
  }

  // ── HE explosion ───────────────────────────────────────────────────────────
  function doHEExplosion(pos, radius, dmg, fromPlayer) {
    // visual flash
    var flash = mesh(sphereGeo(radius * 0.3, 8, 6), mat(0xFF8800, { emissive: 0xFF4400, emissiveIntensity: 2, transparent: true, opacity: 0.8 }));
    flash.position.copy(pos);
    scene.add(flash);
    setTimeout(function () { scene.remove(flash); }, 400);

    if (fromPlayer) {
      // damage enemy tanks in radius
      for (var i = 0; i < enemyTanks.length; i++) {
        var et = enemyTanks[i];
        if (et.userData.dead) continue;
        var ep = new THREE.Vector3();
        et.getWorldPosition(ep);
        if (ep.distanceTo(pos) < radius) {
          et.userData.hp -= dmg * 0.6;
          if (et.userData.hp <= 0) destroyEnemy(et, i, 'tank');
        }
      }
      // damage infantry
      for (var j = 0; j < infantryTeams.length; j++) {
        var inf = infantryTeams[j];
        if (inf.userData.dead) continue;
        var ip = new THREE.Vector3();
        inf.getWorldPosition(ip);
        if (ip.distanceTo(pos) < radius) {
          inf.userData.hp -= dmg;
          if (inf.userData.hp <= 0) destroyEnemy(inf, j, 'inf');
        }
      }
      // command post
      if (commandPost && !commandPost.userData.dead) {
        var cp = new THREE.Vector3();
        commandPost.getWorldPosition(cp);
        if (cp.distanceTo(pos) < radius) {
          commandPost.userData.hp -= dmg * 0.4;
          if (commandPost.userData.hp <= 0) {
            scene.remove(commandPost);
            commandPost.userData.dead = true;
            killCount++;
          }
        }
      }
    }
  }

  function destroyEnemy(obj, idx, type) {
    if (obj.userData.dead) return;
    obj.userData.dead = true;
    scene.remove(obj);
    killCount++;
    if (type === 'tank') enemyTanks[idx] = obj;
    if (type === 'inf') infantryTeams[idx] = obj;

    // spawn resupply after 3 kills
    if (killCount >= 3 && !resupplySpawned) {
      resupplySpawned = true;
      resupplyTruck = buildResupplyTruck();
      scene.add(resupplyTruck);
    }
  }

  // ── player movement ────────────────────────────────────────────────────────
  function updatePlayer(dt) {
    if (!playerTank) return;

    var speed = 12;
    var turnSpeed = 1.2;
    var canMoveForward = true, canMoveBack = true;
    var canTurnLeft = true, canTurnRight = true;

    if (leftTrackDamaged && rightTrackDamaged) {
      canMoveForward = false;
      canMoveBack = false;
    }
    if (leftTrackDamaged && !rightTrackDamaged) {
      canTurnLeft = false;
    }
    if (rightTrackDamaged && !leftTrackDamaged) {
      canTurnRight = false;
    }

    // hull turn
    if ((keysDown['KeyA'] || keysDown['ArrowLeft']) && canTurnLeft) {
      hullYaw += turnSpeed * dt;
    }
    if ((keysDown['KeyD'] || keysDown['ArrowRight']) && canTurnRight) {
      hullYaw -= turnSpeed * dt;
    }

    // forward/back
    var moveVec = new THREE.Vector3(0, 0, 0);
    if ((keysDown['KeyW'] || keysDown['ArrowUp']) && canMoveForward) {
      moveVec.z = -speed * dt;
    }
    if ((keysDown['KeyS'] || keysDown['ArrowDown']) && canMoveBack) {
      moveVec.z = speed * dt;
    }

    // apply rotation to movement
    moveVec.applyEuler(new THREE.Euler(0, hullYaw, 0));
    playerTank.position.add(moveVec);
    playerTank.rotation.y = hullYaw;

    // turret tracks mouse
    turretYaw = mouseX;
    playerTank.userData.turretGroup.rotation.y = turretYaw;

    // camera follow
    var camOffset = new THREE.Vector3(0, 12, 18);
    camOffset.applyEuler(new THREE.Euler(0, hullYaw, 0));
    camera.position.lerp(playerTank.position.clone().add(camOffset), 0.12);
    camera.lookAt(playerTank.position.clone().add(new THREE.Vector3(0, 1.5, 0)));

    // track repair countdown
    if (trackRepairTimer > 0) {
      trackRepairTimer -= dt;
      if (trackRepairTimer <= 0) {
        leftTrackDamaged = false;
        rightTrackDamaged = false;
        trackRepairTimer = 0;
      }
    }
  }

  // ── enemy AI ───────────────────────────────────────────────────────────────
  function updateEnemies(dt) {
    var pp = new THREE.Vector3();
    playerTank.getWorldPosition(pp);

    for (var i = 0; i < enemyTanks.length; i++) {
      var et = enemyTanks[i];
      if (et.userData.dead) continue;

      var ep = new THREE.Vector3();
      et.getWorldPosition(ep);

      // rotate turret toward player
      var toPlayer = pp.clone().sub(ep);
      var angle = Math.atan2(-toPlayer.x, -toPlayer.z);
      et.userData.turretGroup.rotation.y = angle - et.rotation.y;

      // patrol: slowly circle
      et.rotation.y += 0.15 * dt;
      et.position.x += Math.sin(et.rotation.y) * 3 * dt;
      et.position.z += Math.cos(et.rotation.y) * 3 * dt;
      et.position.x = Math.max(-90, Math.min(90, et.position.x));
      et.position.z = Math.max(-90, Math.min(90, et.position.z));

      // shoot
      et.userData.shootTimer -= dt;
      if (et.userData.shootTimer <= 0) {
        et.userData.shootTimer = 8 + Math.random() * 7;
        if (ep.distanceTo(pp) < 80) {
          enemyFireAt(et);
        }
      }
    }

    // infantry teams
    for (var j = 0; j < infantryTeams.length; j++) {
      var inf = infantryTeams[j];
      if (inf.userData.dead) continue;

      inf.userData.shootTimer -= dt;
      if (inf.userData.shootTimer <= 0) {
        inf.userData.shootTimer = 12 + Math.random() * 4;
        var ip = new THREE.Vector3();
        inf.getWorldPosition(ip);
        if (ip.distanceTo(pp) < 60) {
          infantryFireRPG(inf);
        }
      }
    }
  }

  // ── projectile update ──────────────────────────────────────────────────────
  function updateProjectiles(dt) {
    var pp = new THREE.Vector3();
    playerTank.getWorldPosition(pp);
    var hullDown = isHullDown();

    for (var i = projectiles.length - 1; i >= 0; i--) {
      var p = projectiles[i];
      p.life -= dt;
      if (p.life <= 0) {
        scene.remove(p.obj);
        projectiles.splice(i, 1);
        continue;
      }

      // HEAT curves slightly
      if (p.heatCurve !== null) {
        p.vel.x += (Math.random() - 0.5) * 2 * dt;
      }

      p.obj.position.addScaledVector(p.vel, dt);

      if (p.fromPlayer) {
        // check enemy tanks
        for (var j = 0; j < enemyTanks.length; j++) {
          var et = enemyTanks[j];
          if (et.userData.dead) continue;
          var ep = new THREE.Vector3();
          et.getWorldPosition(ep);
          if (p.obj.position.distanceTo(ep) < 3.5) {
            // hit
            var baseDmg = p.type === SHELL_AP ? 80 : (p.type === SHELL_HEAT ? 70 : 45);
            var dmg = calcPenetrationDamage(p.obj.position, et, baseDmg);
            if (p.type === SHELL_HE) {
              doHEExplosion(p.obj.position.clone(), 8, 45, true);
            } else {
              et.userData.hp -= dmg;
              if (et.userData.hp <= 0) destroyEnemy(et, j, 'tank');
            }
            scene.remove(p.obj);
            projectiles.splice(i, 1);
            break;
          }
        }
        if (i >= projectiles.length || projectiles[i] !== p) continue;

        // check infantry
        for (var k = 0; k < infantryTeams.length; k++) {
          var inf = infantryTeams[k];
          if (inf.userData.dead) continue;
          var ip = new THREE.Vector3();
          inf.getWorldPosition(ip);
          if (p.obj.position.distanceTo(ip) < 3.0) {
            if (p.type === SHELL_HE) {
              doHEExplosion(p.obj.position.clone(), 8, 80, true);
            } else {
              inf.userData.hp -= 50;
              if (inf.userData.hp <= 0) destroyEnemy(inf, k, 'inf');
            }
            scene.remove(p.obj);
            projectiles.splice(i, 1);
            break;
          }
        }
        if (i >= projectiles.length || projectiles[i] !== p) continue;

        // command post
        if (commandPost && !commandPost.userData.dead) {
          var cp = new THREE.Vector3();
          commandPost.getWorldPosition(cp);
          if (p.obj.position.distanceTo(cp) < 5) {
            var cpDmg = p.type === SHELL_HE ? 120 : 80;
            commandPost.userData.hp -= cpDmg;
            if (p.type === SHELL_HE) doHEExplosion(p.obj.position.clone(), 8, 60, true);
            if (commandPost.userData.hp <= 0) {
              scene.remove(commandPost);
              commandPost.userData.dead = true;
              killCount++;
            }
            scene.remove(p.obj);
            projectiles.splice(i, 1);
          }
        }

      } else {
        // enemy projectile → check player
        var hitChance = hullDown ? 0.5 : 1.0;
        if (p.obj.position.distanceTo(pp) < 3.0 && Math.random() < hitChance) {
          var dmgToPlayer = p.isRPG ? 60 : 80;
          if (p.type === SHELL_HE) {
            doHEExplosion(p.obj.position.clone(), 8, 30, false);
            dmgToPlayer = 40;
          }
          // RPG near track
          if (p.isRPG) {
            if (p.targetSide === 'left') leftTrackDamaged = true;
            else rightTrackDamaged = true;
          }
          playerHP = Math.max(0, playerHP - dmgToPlayer);
          scene.remove(p.obj);
          projectiles.splice(i, 1);
        }
      }
    }
  }

  // ── smoke update ───────────────────────────────────────────────────────────
  function updateSmoke(dt) {
    if (smokeTimer > 0) smokeTimer -= dt;
    for (var i = smokeClouds.length - 1; i >= 0; i--) {
      var sc = smokeClouds[i];
      sc.life -= dt;
      if (sc.life <= 0) {
        scene.remove(sc.obj);
        smokeClouds.splice(i, 1);
      } else {
        sc.obj.material.opacity = 0.45 * (sc.life / 15.0);
      }
    }
  }

  // ── flare update ───────────────────────────────────────────────────────────
  function updateFlares(dt) {
    for (var i = flares.length - 1; i >= 0; i--) {
      var f = flares[i];
      f.life -= dt;
      if (f.life <= 0) {
        scene.remove(f.obj);
        scene.remove(f.smoke);
        flares.splice(i, 1);
      } else {
        f.obj.position.addScaledVector(f.vel, dt);
        f.vel.y -= 5 * dt;
        f.smoke.position.copy(f.obj.position);
        f.smoke.position.y -= 1;
      }
    }
  }

  // ── laser warning update ───────────────────────────────────────────────────
  function updateLaserWarning(dt) {
    if (!laserWarningActive) return;
    laserWarningTimer -= dt;
    if (laserWarningTimer <= 0) {
      laserWarningActive = false;
      if (laserLight) laserLight.intensity = 0;
      return;
    }
    // blink
    var blink = Math.sin(Date.now() * 0.015) > 0;
    if (laserLight) laserLight.intensity = blink ? 2.5 : 0;
  }

  // ── reload update ──────────────────────────────────────────────────────────
  function updateReload(dt) {
    if (reloadTimer > 0) {
      reloadTimer -= dt;
      if (reloadTimer < 0) reloadTimer = 0;
    }
  }

  // ── resupply truck update ──────────────────────────────────────────────────
  function updateResupplyTruck(dt) {
    if (!resupplyTruck || !resupplyTruck.userData.active) return;
    var tp = new THREE.Vector3();
    playerTank.getWorldPosition(tp);
    var rp = resupplyTruck.position.clone();
    var toPlayer = tp.sub(rp);
    if (toPlayer.length() < 5) {
      // resupply
      ammo[0] = 8; ammo[1] = 8; ammo[2] = 8;
      scene.remove(resupplyTruck);
      resupplyTruck.userData.active = false;
    } else {
      toPlayer.normalize();
      resupplyTruck.position.addScaledVector(toPlayer, resupplyTruck.userData.speed * dt);
      resupplyTruck.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
    }
  }

  // ── HUD update ─────────────────────────────────────────────────────────────
  function updateHUD() {
    if (!hudEl) return;
    var targetsLeft = 0;
    for (var i = 0; i < enemyTanks.length; i++) {
      if (!enemyTanks[i].userData.dead) targetsLeft++;
    }
    if (commandPost && !commandPost.userData.dead) targetsLeft++;

    var reloadStr = reloadTimer > 0 ? reloadTimer.toFixed(1) + 's' : 'RDY';
    var trackStr = '';
    if (leftTrackDamaged) trackStr += ' [LEFT TRACK DMG]';
    if (rightTrackDamaged) trackStr += ' [RIGHT TRACK DMG]';
    if (trackRepairTimer > 0) trackStr += ' [REPAIRING:' + trackRepairTimer.toFixed(0) + 's]';

    var shellNames = ['AP', 'HE', 'HEAT'];
    var smokeStr = smokeTimer > 0 ? ' [SMOKE:' + smokeTimer.toFixed(0) + 's]' : ' [SMOKE RDY]';
    var laserStr = laserWarningActive ? ' [!LASER WARNING!]' : '';

    hudEl.textContent =
      'TANK [HP: ' + playerHP + '/' + playerMaxHP + ']' +
      ' [ROLE: ' + ROLES[currentRole] + ']' +
      ' [AMMO: AP ' + ammo[0] + '/HE ' + ammo[1] + '/HEAT ' + ammo[2] + ']' +
      ' [SHELL: ' + shellNames[currentShellType] + ']' +
      ' [RELOAD: ' + reloadStr + ']' +
      ' | TARGETS: ' + targetsLeft +
      trackStr + smokeStr + laserStr;

    // win/lose
    if (playerHP <= 0) {
      hudEl.textContent = '*** TANK DESTROYED *** Press R to reset';
      hudEl.style.color = '#FF4444';
    } else if (targetsLeft === 0) {
      hudEl.textContent = '*** MISSION COMPLETE *** All targets destroyed!';
      hudEl.style.color = '#44FFAA';
    }
  }

  // ── main loop ──────────────────────────────────────────────────────────────
  function loop() {
    if (!active) return;
    requestAnimationFrame(loop);
    var dt = clock.getDelta();
    dt = Math.min(dt, 0.05);

    updatePlayer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateSmoke(dt);
    updateFlares(dt);
    updateLaserWarning(dt);
    updateReload(dt);
    updateResupplyTruck(dt);
    updateHUD();

    renderer.render(scene, camera);
  }

  // ── public API ─────────────────────────────────────────────────────────────
  function init(container) {
    // optional container
    if (container && renderer) {
      container.appendChild(renderer.domElement);
    }
  }

  function update(dt) {
    // external step — no-op when running its own RAF loop
  }

  function reset() {
    if (!active) return;

    // clear scene objects
    for (var i = 0; i < projectiles.length; i++) scene.remove(projectiles[i].obj);
    for (var i = 0; i < smokeClouds.length; i++) scene.remove(smokeClouds[i].obj);
    for (var i = 0; i < flares.length; i++) { scene.remove(flares[i].obj); scene.remove(flares[i].smoke); }
    for (var i = 0; i < enemyTanks.length; i++) scene.remove(enemyTanks[i]);
    for (var i = 0; i < infantryTeams.length; i++) scene.remove(infantryTeams[i]);
    for (var i = 0; i < berms.length; i++) scene.remove(berms[i]);
    if (playerTank) scene.remove(playerTank);
    if (commandPost) scene.remove(commandPost);
    if (resupplyTruck) scene.remove(resupplyTruck);

    projectiles = [];
    smokeClouds = [];
    flares = [];
    enemyTanks = [];
    infantryTeams = [];
    berms = [];

    playerHP = 500;
    hullYaw = 0;
    turretYaw = 0;
    mouseX = 0;
    currentRole = 1;
    currentShellType = SHELL_AP;
    ammo = [8, 8, 8];
    reloadTimer = 0;
    leftTrackDamaged = false;
    rightTrackDamaged = false;
    trackRepairTimer = 0;
    smokeTimer = 0;
    laserWarningActive = false;
    laserWarningTimer = 0;
    killCount = 0;
    resupplySpawned = false;
    resupplyTruck = null;
    laserLight = null;
    commandPost = null;

    // rebuild
    playerTank = buildPlayerTank();
    scene.add(playerTank);

    var bermData = [
      [15, -5, 10, 2.5, 5],
      [-15, 8, 8, 2.2, 4],
      [5, -20, 12, 3, 6],
      [-8, 15, 9, 2, 5]
    ];
    for (var i = 0; i < bermData.length; i++) {
      var bd = bermData[i];
      var b = buildBerm(bd[0], bd[1], bd[2], bd[3], bd[4]);
      scene.add(b);
      berms.push(b);
    }

    var eTankPos = [[-30,-30],[30,-40],[-10,-50],[20,-20]];
    for (var j = 0; j < eTankPos.length; j++) {
      var et = buildEnemyTank(eTankPos[j][0], eTankPos[j][1]);
      scene.add(et);
      enemyTanks.push(et);
    }

    var infPos = [[-25,-15],[25,-15],[-5,-35],[15,-45]];
    for (var k = 0; k < infPos.length; k++) {
      var it = buildInfantryTeam(infPos[k][0], infPos[k][1]);
      scene.add(it);
      infantryTeams.push(it);
    }

    commandPost = buildCommandPost();
    scene.add(commandPost);

    if (hudEl) hudEl.style.color = '#AAFFAA';
  }

  // listen for reset key (R) and activation
  document.addEventListener('keydown', function (e) {
    if (e.code === 'KeyR' && active) reset();
    checkActivation();
  });
  document.addEventListener('keyup', function () {
    checkActivation();
  });

  return { init: init, update: update, reset: reset };
})();
