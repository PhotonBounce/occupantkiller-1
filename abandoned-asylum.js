window.AbandonedAsylum = (function () {
  'use strict';

  // ── state ──────────────────────────────────────────────────────────────────
  var scene, camera, renderer, clock;
  var enemies = [], projectiles = [], civilians = [], flickerLights = [];
  var bellHits = 0, bellAlerted = false;
  var blackoutTimer = 45, blackoutActive = false, blackoutElapsed = 0;
  var score = 0, playerHP = 100;
  var active = false;
  var lastAPress = -9999;
  var keyState = {};
  var playerVelocity = { x: 0, y: 0, z: 0 };
  var playerOnGround = true;
  var yaw = 0, pitch = 0;
  var container, hudEl;
  var raycaster;
  var malthus = null;
  var malthusInCircle = false;
  var malthusTP = 30;
  var cultistsSummoned = false;
  var freeing = null, freeTimer = 0;
  var gameWon = false, gameLost = false;
  var roomPositions = [];
  var ritualCirclePos = { x: 0, y: 0, z: 0 };
  var bellMesh = null;
  var allCollidables = [];

  // ── activation ─────────────────────────────────────────────────────────────
  function handleKeyDown(e) {
    keyState[e.code] = true;
    if (e.code === 'KeyA') {
      var now = performance.now();
      if (now - lastAPress < 400) {
        if (!active) activate();
      }
      lastAPress = now;
    }
    if (!active) return;
    if (e.code === 'KeyE') startFreeing();
    if (e.code === 'Space' && playerOnGround) { playerVelocity.y = 8; playerOnGround = false; }
  }

  function handleKeyUp(e) {
    keyState[e.code] = false;
    if (e.code === 'KeyE') cancelFreeing();
  }

  function handleMouseMove(e) {
    if (!active) return;
    yaw -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;
    pitch = Math.max(-1.2, Math.min(1.2, pitch));
  }

  function handleClick(e) {
    if (!active) return;
    if (document.pointerLockElement !== container) {
      container.requestPointerLock();
      return;
    }
    shoot();
  }

  // ── init ───────────────────────────────────────────────────────────────────
  function init(opts) {
    container = opts.container || document.body;
    renderer = opts.renderer;
    camera = opts.camera;
    scene = opts.scene;
    clock = new THREE.Clock();
    raycaster = new THREE.Raycaster();

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleClick);

    buildHUD();
  }

  function activate() {
    active = true;
    reset();
    buildWorld();
    camera.position.set(0, 1.7, 0);
    yaw = 0; pitch = 0;
    container.requestPointerLock();
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'asylum-hud';
    hudEl.style.cssText = 'position:fixed;top:10px;left:10px;color:#cfc;font:14px monospace;pointer-events:none;display:none;text-shadow:1px 1px 2px #000;z-index:999;';
    document.body.appendChild(hudEl);
  }

  function updateHUD() {
    if (!hudEl) return;
    if (!active) { hudEl.style.display = 'none'; return; }
    hudEl.style.display = 'block';
    var civiliansFree = 4 - civilians.filter(function(c){return !c.freed;}).length;
    var cultRemaining = enemies.filter(function(e){return e.hp > 0 && !e.isBoss;}).length;
    var malthusLoc = malthus ? (malthus.hp <= 0 ? 'DEFEATED' : malthus.room || 'BASEMENT') : 'UNKNOWN';
    var blackoutStr = blackoutActive ? ('BLACKOUT: ' + Math.ceil(10 - blackoutElapsed) + 's') : ('Next blackout: ' + Math.ceil(blackoutTimer) + 's');
    hudEl.innerHTML = [
      'HP: ' + playerHP,
      'Score: ' + score,
      'Civilians freed: ' + civiliansFree + '/4',
      'Cultists remaining: ' + cultRemaining,
      'Malthus: ' + malthusLoc,
      blackoutStr,
      bellAlerted ? '<span style="color:#f66">BELL RINGING — ENEMIES ALERTED</span>' : '',
      freeing ? 'Freeing... ' + Math.ceil(2 - freeTimer) + 's' : ''
    ].filter(Boolean).join('<br>');
  }

  // ── world ──────────────────────────────────────────────────────────────────
  function mat(color, opts) {
    var o = opts || {};
    return new THREE.MeshLambertMaterial({ color: color, side: o.side || THREE.FrontSide, wireframe: o.wire || false });
  }

  function box(w, h, d, color, opts) {
    var g = new THREE.BoxGeometry(w, h, d);
    var m = new THREE.Mesh(g, mat(color, opts));
    scene.add(m);
    if (!opts || !opts.noCollide) allCollidables.push(m);
    return m;
  }

  function cyl(rt, rb, h, segs, color) {
    var g = new THREE.CylinderGeometry(rt, rb, h, segs);
    var m = new THREE.Mesh(g, mat(color));
    scene.add(m);
    return m;
  }

  function addPointLight(x, y, z, color, intensity, dist) {
    var l = new THREE.PointLight(color, intensity, dist);
    l.position.set(x, y, z);
    scene.add(l);
    return l;
  }

  function buildWorld() {
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.Fog(0x050505, 5, 40);
    var ambient = new THREE.AmbientLight(0x111111);
    scene.add(ambient);

    roomPositions = [];

    // floor / ground plane
    var floor = box(200, 0.5, 200, 0x222222, {noCollide: true});
    floor.position.set(0, -0.25, 0);
    allCollidables.push(floor);

    // ── CORRIDOR WINGS ─────────────────────────────────────────────────────
    buildCorridor(0, 0, 0,  60, 4, 6);   // main east-west corridor
    buildCorridor(0, 0, -30, 6, 4, 60);  // main north-south corridor

    // ── RECEPTION AREA ─────────────────────────────────────────────────────
    buildReception(-20, 0, 0);
    roomPositions.push({ x: -20, y: 1.7, z: 0, name: 'reception' });

    // ── PADDED CELLS (4 cells for civilians) ──────────────────────────────
    buildPaddedCell(10, 0, -10, 0);
    buildPaddedCell(14, 0, -10, 1);
    buildPaddedCell(10, 0, -18, 2);
    buildPaddedCell(14, 0, -18, 3);
    roomPositions.push({ x: 10, y: 1.7, z: -14, name: 'cell wing' });

    // ── ELECTROSHOCK THERAPY ROOM ──────────────────────────────────────────
    buildTherapyRoom(20, 0, 10);
    roomPositions.push({ x: 20, y: 1.7, z: 10, name: 'therapy room' });

    // ── BELL TOWER ────────────────────────────────────────────────────────
    buildBellTower(0, 0, -50);
    roomPositions.push({ x: 0, y: 1.7, z: -50, name: 'bell tower' });

    // ── BASEMENT ─────────────────────────────────────────────────────────
    buildBasement(0, -8, -20);
    roomPositions.push({ x: 0, y: -6.3, z: -20, name: 'basement' });
    ritualCirclePos = { x: 0, y: -7.5, z: -20 };

    // ── ENEMIES ───────────────────────────────────────────────────────────
    spawnEnemies();

    // ── FLICKERING LIGHTS ─────────────────────────────────────────────────
    var fl1 = addPointLight(0, 3, 0, 0xffffaa, 1.0, 20);
    var fl2 = addPointLight(-20, 3, 0, 0xffffaa, 1.0, 20);
    var fl3 = addPointLight(10, 3, -14, 0xffffaa, 0.8, 15);
    var fl4 = addPointLight(20, 3, 10, 0xffffaa, 0.8, 15);
    var fl5 = addPointLight(0, 3, -50, 0xffffaa, 0.7, 20);
    flickerLights = [fl1, fl2, fl3, fl4, fl5];
  }

  function buildCorridor(x, y, z, w, h, d) {
    var b = box(w, h, d, 0x2a2020);
    b.position.set(x, y + h/2, z);
    // ceiling
    var c = box(w, 0.3, d, 0x1a1010, {noCollide:true});
    c.position.set(x, y + h, z);
    // barred windows
    buildBarredWindow(x + w/2 - 0.1, y + h/2 + 0.5, z - d/2 + 1);
    buildBarredWindow(x + w/2 - 0.1, y + h/2 + 0.5, z + d/2 - 1);
  }

  function buildBarredWindow(x, y, z) {
    var pts = [];
    var i;
    for (i = 0; i < 4; i++) {
      var bx = x, by = y + i * 0.3 - 0.45, bz1 = z - 0.5, bz2 = z + 0.5;
      pts.push(bx, by, bz1, bx, by, bz2);
    }
    for (i = 0; i < 3; i++) {
      var bz = z - 0.5 + i * 0.5;
      pts.push(x, y - 0.45, bz, x, y + 0.45, bz);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    var ls = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x888888 }));
    scene.add(ls);
  }

  function buildReception(x, y, z) {
    // walls
    var w1 = box(16, 5, 0.4, 0x2a2020); w1.position.set(x, y + 2.5, z - 8);
    var w2 = box(16, 5, 0.4, 0x2a2020); w2.position.set(x, y + 2.5, z + 8);
    var w3 = box(0.4, 5, 16, 0x2a2020); w3.position.set(x - 8, y + 2.5, z);
    var w4 = box(0.4, 5, 16, 0x2a2020); w4.position.set(x + 8, y + 2.5, z);
    // nurse desk
    var desk = box(5, 1, 2, 0x4a3020); desk.position.set(x, y + 0.5, z);
    var deskTop = box(5.2, 0.15, 2.2, 0x5a4030, {noCollide:true}); deskTop.position.set(x, y + 1.075, z);
    scene.add(deskTop);
    // overturned chairs
    var ch1 = box(0.6, 0.6, 0.6, 0x3a2010); ch1.position.set(x - 3, y + 0.3, z + 2); ch1.rotation.z = 0.8;
    var ch2 = box(0.6, 0.6, 0.6, 0x3a2010); ch2.position.set(x + 3, y + 0.3, z - 2); ch2.rotation.x = 1.1;
    var fl = addPointLight(x, y + 3, z, 0xddaa88, 0.8, 18);
    flickerLights.push(fl);
  }

  function buildPaddedCell(x, y, z, idx) {
    // cell walls — padded (white BoxGeometry)
    var w1 = box(4, 4, 0.3, 0xffffff); w1.position.set(x + 2, y + 2, z - 2);
    var w2 = box(4, 4, 0.3, 0xffffff); w2.position.set(x + 2, y + 2, z + 2);
    var w3 = box(0.3, 4, 4, 0xffffff); w3.position.set(x, y + 2, z);
    var w4 = box(0.3, 4, 4, 0xffffff); w4.position.set(x + 4, y + 2, z);
    // cage door (BoxGeometry bars)
    var door = box(0.2, 3.5, 2, 0x555555); door.position.set(x, y + 1.75, z);
    // civilian
    var civGeo = new THREE.BoxGeometry(0.5, 1.4, 0.3);
    var civMesh = new THREE.Mesh(civGeo, new THREE.MeshLambertMaterial({ color: 0xddbbaa }));
    civMesh.position.set(x + 2, y + 0.7, z);
    scene.add(civMesh);
    var civ = { mesh: civMesh, door: door, freed: false, pos: { x: x+2, y: y+0.7, z: z }, idx: idx };
    civilians.push(civ);
    addPointLight(x + 2, y + 3.5, z, 0x8888ff, 0.4, 8);
  }

  function buildTherapyRoom(x, y, z) {
    var w1 = box(12, 5, 0.4, 0x1a1a2a); w1.position.set(x, y + 2.5, z - 6);
    var w2 = box(12, 5, 0.4, 0x1a1a2a); w2.position.set(x, y + 2.5, z + 6);
    var w3 = box(0.4, 5, 12, 0x1a1a2a); w3.position.set(x - 6, y + 2.5, z);
    var w4 = box(0.4, 5, 12, 0x1a1a2a); w4.position.set(x + 6, y + 2.5, z);
    // ECT machine
    var mach = box(3, 2, 2, 0x223344); mach.position.set(x - 3, y + 1, z);
    var panel = box(1.5, 1, 0.1, 0x334455, {noCollide:true}); panel.position.set(x - 3, y + 1.5, z - 0.95);
    scene.add(panel);
    // metal table
    var table = box(2, 0.15, 0.7, 0x444444); table.position.set(x + 1, y + 0.8, z);
    // straps (LineSegments)
    var strapPts = [
      x+0.2, y+0.85, z-0.3,  x+0.2, y+0.85, z+0.3,
      x+1.0, y+0.85, z-0.35, x+1.0, y+0.85, z+0.35,
      x+1.8, y+0.85, z-0.3,  x+1.8, y+0.85, z+0.3
    ];
    var strapGeo = new THREE.BufferGeometry();
    strapGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(strapPts), 3));
    var straps = new THREE.LineSegments(strapGeo, new THREE.LineBasicMaterial({ color: 0x8b6914 }));
    scene.add(straps);
    addPointLight(x, y + 4, z, 0x6688ff, 0.6, 15);
    roomPositions.push({ x: x, y: y + 1.7, z: z, name: 'therapy room' });
  }

  function buildBellTower(x, y, z) {
    // base walls
    var w1 = box(10, 20, 0.5, 0x2a2015); w1.position.set(x, y + 10, z - 5);
    var w2 = box(10, 20, 0.5, 0x2a2015); w2.position.set(x, y + 10, z + 5);
    var w3 = box(0.5, 20, 10, 0x2a2015); w3.position.set(x - 5, y + 10, z);
    var w4 = box(0.5, 20, 10, 0x2a2015); w4.position.set(x + 5, y + 10, z);
    // spiral staircase steps (CylinderGeometry)
    var i;
    for (i = 0; i < 16; i++) {
      var angle = i * (Math.PI / 4);
      var sx = x + Math.cos(angle) * 3;
      var sz = z + Math.sin(angle) * 3;
      var sy = y + i * 1.0;
      var step = cyl(1.5, 1.5, 0.2, 8, 0x4a3a2a);
      step.position.set(sx, sy + 0.1, sz);
    }
    // bell at top (CylinderGeometry)
    bellMesh = cyl(1.5, 0.5, 2, 12, 0xaa8833);
    bellMesh.position.set(x, y + 17, z);
    bellMesh.userData.isBell = true;
    allCollidables.push(bellMesh);
    addPointLight(x, y + 12, z, 0xffeeaa, 0.5, 25);
  }

  function buildBasement(x, y, z) {
    // stone walls
    var w1 = box(20, 6, 0.5, 0x1a1a1a); w1.position.set(x, y + 3, z - 10);
    var w2 = box(20, 6, 0.5, 0x1a1a1a); w2.position.set(x, y + 3, z + 10);
    var w3 = box(0.5, 6, 20, 0x1a1a1a); w3.position.set(x - 10, y + 3, z);
    var w4 = box(0.5, 6, 20, 0x1a1a1a); w4.position.set(x + 10, y + 3, z);
    var bfloor = box(20, 0.4, 20, 0x111111, {noCollide:true}); bfloor.position.set(x, y + 0.2, z);
    allCollidables.push(bfloor);
    // pentagram ritual circle (LineSegments)
    buildPentagram(x, y + 0.25, z, 5);
    // basement light — red/ritual
    var bl = addPointLight(x, y + 4, z, 0xff1111, 0.4, 20);
    flickerLights.push(bl);
    addPointLight(x, y + 4, z, 0x440011, 1.0, 25);
    // staircase down
    var si;
    for (si = 0; si < 8; si++) {
      var stair = box(2, 0.2, 0.8, 0x2a2a2a);
      stair.position.set(x - 6, y + si * -0.8 + 0.1, z - 8 + si * 0.9);
    }
  }

  function buildPentagram(x, y, z, r) {
    var pts = [];
    var i;
    var verts = [];
    for (i = 0; i < 5; i++) {
      var a = (i * 2 * Math.PI / 5) - Math.PI / 2;
      verts.push({ x: x + Math.cos(a) * r, z: z + Math.sin(a) * r });
    }
    // star lines (connect every other vertex)
    for (i = 0; i < 5; i++) {
      var from = verts[i];
      var to = verts[(i + 2) % 5];
      pts.push(from.x, y, from.z, to.x, y, to.z);
    }
    // outer circle (30 segments)
    for (i = 0; i < 30; i++) {
      var a1 = (i / 30) * 2 * Math.PI;
      var a2 = ((i+1) / 30) * 2 * Math.PI;
      pts.push(x + Math.cos(a1)*r, y, z + Math.sin(a1)*r,
               x + Math.cos(a2)*r, y, z + Math.sin(a2)*r);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    var pent = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xff2200 }));
    scene.add(pent);
  }

  // ── enemy spawning ─────────────────────────────────────────────────────────
  function spawnEnemies() {
    var i;
    var spawnPoints = [
      {x:5,y:1,z:0}, {x:-5,y:1,z:0}, {x:0,y:1,z:5},
      {x:10,y:1,z:5}, {x:-10,y:1,z:5}, {x:15,y:1,z:-5},
      {x:-15,y:1,z:-5}, {x:20,y:1,z:0}, {x:-20,y:1,z:5},
      {x:0,y:1,z:-10}
    ];
    for (i = 0; i < 10; i++) {
      var sp = spawnPoints[i % spawnPoints.length];
      spawnCultMember(sp.x + (Math.random()-0.5)*3, sp.y, sp.z + (Math.random()-0.5)*3);
    }
    var enforcerPoints = [{x:5,y:1,z:-10},{x:-5,y:1,z:-10},{x:15,y:1,z:10},{x:-15,y:1,z:10},{x:0,y:1,z:-30}];
    for (i = 0; i < 5; i++) {
      var ep = enforcerPoints[i];
      spawnEnforcer(ep.x, ep.y, ep.z);
    }
    spawnMalthus(0, -6.3, -20);
  }

  function spawnCultMember(x, y, z) {
    var torso = box(0.6, 0.9, 0.4, 0x332233);
    torso.position.set(x, y + 1.0, z);
    var head = box(0.45, 0.45, 0.45, 0x332233, {noCollide:true});
    head.position.set(0, 0.67, 0);
    torso.add(head);
    var hood = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.5, 8), mat(0x221122));
    hood.position.set(0, 0.95, 0);
    torso.add(hood);
    scene.add(hood);
    var enemy = {
      mesh: torso, head: head, hp: 70, maxHp: 70,
      type: 'member', isBoss: false,
      state: 'patrol',
      patrolAngle: Math.random() * Math.PI * 2,
      alertedTimer: 0,
      attackCooldown: 0,
      throwCooldown: 3 + Math.random() * 2,
      pos: new THREE.Vector3(x, y + 1.0, z),
      alerted: false,
      bellAlert: false,
      room: 'corridor'
    };
    enemies.push(enemy);
    return enemy;
  }

  function spawnEnforcer(x, y, z) {
    var torso = box(0.7, 1.0, 0.45, 0x221122);
    torso.position.set(x, y + 1.0, z);
    var head = box(0.5, 0.5, 0.5, 0x332244, {noCollide:true});
    head.position.set(0, 0.75, 0);
    torso.add(head);
    var armor = box(0.75, 0.4, 0.5, 0x443355, {noCollide:true});
    armor.position.set(0, 0.2, 0);
    torso.add(armor);
    var enemy = {
      mesh: torso, head: head, hp: 100, maxHp: 100,
      type: 'enforcer', isBoss: false,
      state: 'patrol',
      patrolAngle: Math.random() * Math.PI * 2,
      alertedTimer: 0,
      attackCooldown: 0,
      shootCooldown: 4 + Math.random() * 2,
      pos: new THREE.Vector3(x, y + 1.0, z),
      alerted: false,
      bellAlert: false,
      room: 'corridor'
    };
    enemies.push(enemy);
    return enemy;
  }

  function spawnMalthus(x, y, z) {
    var torso = box(0.9, 1.2, 0.6, 0x110011);
    torso.position.set(x, y + 1.2, z);
    var head = box(0.55, 0.55, 0.55, 0x221122, {noCollide:true});
    head.position.set(0, 0.87, 0);
    torso.add(head);
    var robe = box(0.95, 1.4, 0.65, 0x0a000a, {noCollide:true});
    robe.position.set(0, -0.1, 0);
    torso.add(robe);
    var crownGeo = new THREE.CylinderGeometry(0.35, 0.3, 0.3, 8);
    var crown = new THREE.Mesh(crownGeo, mat(0x550055));
    crown.position.set(0, 1.2, 0);
    torso.add(crown);
    scene.add(crown);
    malthus = {
      mesh: torso, head: head, hp: 480, maxHp: 480,
      type: 'boss', isBoss: true,
      state: 'ritual',
      attackCooldown: 0,
      shootCooldown: 5,
      tpTimer: 30,
      pos: new THREE.Vector3(x, y + 1.2, z),
      alerted: true,
      invincible: true,
      room: 'basement',
      summoned: false
    };
    enemies.push(malthus);
  }

  // ── shooting / combat ──────────────────────────────────────────────────────
  function shoot() {
    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    raycaster.set(camera.position, dir);

    // check bell
    if (bellMesh) {
      var bellIntersects = raycaster.intersectObject(bellMesh);
      if (bellIntersects.length > 0) {
        bellHits++;
        if (bellHits >= 3 && !bellAlerted) {
          bellAlerted = true;
          var ei;
          for (ei = 0; ei < enemies.length; ei++) {
            enemies[ei].bellAlert = true;
            enemies[ei].alerted = true;
            enemies[ei].state = 'moveToBell';
          }
        }
        return;
      }
    }

    // check enemies
    var meshList = [];
    var i;
    for (i = 0; i < enemies.length; i++) {
      if (enemies[i].hp > 0) meshList.push(enemies[i].mesh);
    }
    var hits = raycaster.intersectObjects(meshList, true);
    if (hits.length > 0) {
      var hitMesh = hits[0].object;
      var ei2;
      for (ei2 = 0; ei2 < enemies.length; ei2++) {
        var en = enemies[ei2];
        if (en.hp <= 0) continue;
        if (en.mesh === hitMesh || en.mesh.getObjectById(hitMesh.id)) {
          if (en.isBoss && malthusInCircle) {
            // lure Malthus — he'll move
            malthus.state = 'flee';
            malthus.alerted = true;
          } else {
            en.hp -= 35;
            en.alerted = true;
            en.state = 'chase';
            if (en.hp <= 0) killEnemy(en);
          }
          break;
        }
      }
    }
  }

  function killEnemy(en) {
    en.hp = 0;
    en.mesh.visible = false;
    if (!en.isBoss) score += (en.type === 'enforcer') ? 200 : 100;
    // check Malthus half-HP summon
    if (en.isBoss) {
      score += 2000;
    }
  }

  function shootProjectile(from, dir, damage, speed, color) {
    var geo = new THREE.BoxGeometry(0.1, 0.1, 0.3);
    var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: color }));
    mesh.position.copy(from);
    scene.add(mesh);
    projectiles.push({
      mesh: mesh,
      velocity: dir.clone().multiplyScalar(speed),
      damage: damage,
      life: 4,
      fromEnemy: true
    });
  }

  // ── civilian freeing ───────────────────────────────────────────────────────
  function startFreeing() {
    if (freeing) return;
    var i;
    for (i = 0; i < civilians.length; i++) {
      var civ = civilians[i];
      if (civ.freed) continue;
      var dist = camera.position.distanceTo(new THREE.Vector3(civ.pos.x, civ.pos.y, civ.pos.z));
      if (dist < 3) {
        freeing = civ;
        freeTimer = 0;
        return;
      }
    }
  }

  function cancelFreeing() {
    freeing = null;
    freeTimer = 0;
  }

  // ── update loop ────────────────────────────────────────────────────────────
  function update() {
    if (!active) return;
    var dt = clock.getDelta();
    dt = Math.min(dt, 0.05);

    updatePlayer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateBlackout(dt);
    updateFlicker(dt);
    updateFreeing(dt);
    updateMalthus(dt);
    checkWinLose();
    updateHUD();
  }

  function updatePlayer(dt) {
    var speed = 6;
    var forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    var right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    var move = new THREE.Vector3();
    if (keyState['KeyW'] || keyState['ArrowUp'])    move.addScaledVector(forward, speed);
    if (keyState['KeyS'] || keyState['ArrowDown'])  move.addScaledVector(forward, -speed);
    if (keyState['KeyD'] || keyState['ArrowRight']) move.addScaledVector(right, speed);
    if (keyState['KeyA'] || keyState['ArrowLeft'])  move.addScaledVector(right, -speed);

    playerVelocity.x = move.x;
    playerVelocity.z = move.z;
    playerVelocity.y -= 20 * dt; // gravity

    var newPos = camera.position.clone();
    newPos.x += playerVelocity.x * dt;
    newPos.y += playerVelocity.y * dt;
    newPos.z += playerVelocity.z * dt;

    if (newPos.y < 1.7) {
      newPos.y = 1.7;
      playerVelocity.y = 0;
      playerOnGround = true;
    }
    // basement level check
    if (newPos.y < -6.3 && newPos.x > -12 && newPos.x < 12 && newPos.z > -32 && newPos.z < -8) {
      // allowed in basement
    } else if (newPos.y < 1.7 && !(newPos.y < -6.3)) {
      newPos.y = 1.7;
      playerVelocity.y = 0;
      playerOnGround = true;
    }

    camera.position.copy(newPos);
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
  }

  var flickerPhase = 0;
  function updateFlicker(dt) {
    flickerPhase += dt;
    var i;
    for (i = 0; i < flickerLights.length; i++) {
      var l = flickerLights[i];
      if (blackoutActive) {
        l.intensity = 0.05;
      } else {
        var base = 0.65 + 0.35 * Math.sin(flickerPhase * Math.PI / 2 + i * 1.3);
        var flicker = (Math.random() < 0.05) ? Math.random() * 0.4 : 0;
        l.intensity = Math.max(0.1, base - flicker);
      }
    }
  }

  function updateBlackout(dt) {
    if (blackoutActive) {
      blackoutElapsed += dt;
      if (blackoutElapsed >= 10) {
        blackoutActive = false;
        blackoutElapsed = 0;
        blackoutTimer = 45;
      }
    } else {
      blackoutTimer -= dt;
      if (blackoutTimer <= 0) {
        blackoutActive = true;
        blackoutElapsed = 0;
      }
    }
  }

  function updateFreeing(dt) {
    if (!freeing) return;
    freeTimer += dt;
    if (freeTimer >= 2) {
      freeing.freed = true;
      freeing.mesh.visible = false;
      if (freeing.door) { freeing.door.visible = false; }
      score += 500;
      freeing = null;
      freeTimer = 0;
    }
  }

  function updateMalthus(dt) {
    if (!malthus || malthus.hp <= 0) return;
    // check if in ritual circle
    var dx = malthus.pos.x - ritualCirclePos.x;
    var dz = malthus.pos.z - ritualCirclePos.z;
    var distCircle = Math.sqrt(dx*dx + dz*dz);
    malthusInCircle = distCircle < 5;
    malthus.invincible = malthusInCircle;

    // teleport
    malthus.tpTimer -= dt;
    if (malthus.tpTimer <= 0) {
      malthus.tpTimer = 30;
      var idx = Math.floor(Math.random() * roomPositions.length);
      var rp = roomPositions[idx];
      malthus.pos.set(rp.x, rp.y, rp.z);
      malthus.mesh.position.copy(malthus.pos);
      malthus.room = rp.name;
    }

    // summon cultists at 50% HP
    if (!malthus.summoned && malthus.hp < malthus.maxHp * 0.5) {
      malthus.summoned = true;
      var si;
      for (si = 0; si < 2; si++) {
        spawnCultMember(malthus.pos.x + (si-0.5)*3, malthus.pos.y - 1.2, malthus.pos.z + 2);
      }
    }
  }

  function updateEnemies(dt) {
    var i;
    var playerPos = camera.position.clone();
    for (i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (en.hp <= 0) continue;
      updateEnemy(en, dt, playerPos);
    }
  }

  function updateEnemy(en, dt, playerPos) {
    var dist = en.pos.distanceTo(playerPos);

    // aggro detection
    if (!en.alerted && dist < 12) {
      en.alerted = true;
      en.state = 'chase';
    }

    if (en.bellAlert) {
      en.state = 'moveToBell';
    }

    var speed = en.isBoss ? 3.5 : (en.type === 'enforcer' ? 2.5 : 3.0);

    if (en.state === 'patrol') {
      en.patrolAngle += dt * 0.5;
      var px = Math.cos(en.patrolAngle) * 2;
      var pz = Math.sin(en.patrolAngle) * 2;
      en.pos.x += px * dt * 1.5;
      en.pos.z += pz * dt * 1.5;
    } else if (en.state === 'chase') {
      var dir = new THREE.Vector3(playerPos.x - en.pos.x, 0, playerPos.z - en.pos.z).normalize();
      if (en.type === 'enforcer' && dist < 10) {
        // enforcers keep distance and shoot
        if (dist < 6) {
          en.pos.x -= dir.x * speed * dt;
          en.pos.z -= dir.z * speed * dt;
        }
      } else {
        en.pos.x += dir.x * speed * dt;
        en.pos.z += dir.z * speed * dt;
      }
      // attack
      en.attackCooldown -= dt;
      if (en.type === 'member') {
        en.throwCooldown -= dt;
        if (en.throwCooldown <= 0 && dist < 15) {
          en.throwCooldown = 4 + Math.random() * 2;
          var throwDir = new THREE.Vector3(playerPos.x - en.pos.x, playerPos.y - en.pos.y, playerPos.z - en.pos.z).normalize();
          shootProjectile(en.pos.clone().add(new THREE.Vector3(0, 0.8, 0)), throwDir, 15, 6, 0xffcc44);
        }
        if (en.attackCooldown <= 0 && dist < 2) {
          en.attackCooldown = 1.5;
          playerHP -= 10;
        }
      } else if (en.type === 'enforcer') {
        en.shootCooldown -= dt;
        if (en.shootCooldown <= 0 && dist < 18) {
          en.shootCooldown = 4 + Math.random() * 2;
          var sdir = new THREE.Vector3(playerPos.x - en.pos.x, playerPos.y - en.pos.y, playerPos.z - en.pos.z).normalize();
          shootProjectile(en.pos.clone().add(new THREE.Vector3(0, 0.8, 0)), sdir, 4, 0x44ccff);
        }
      } else if (en.isBoss) {
        en.shootCooldown -= dt;
        if (en.shootCooldown <= 0 && dist < 20) {
          en.shootCooldown = 3;
          var bdir = new THREE.Vector3(playerPos.x - en.pos.x, playerPos.y - en.pos.y, playerPos.z - en.pos.z).normalize();
          shootProjectile(en.pos.clone().add(new THREE.Vector3(0, 0.8, 0)), bdir, 25, 8, 0xff00ff);
        }
        if (!malthusInCircle) en.state = 'chase';
      }
    } else if (en.state === 'moveToBell') {
      var bellPos = new THREE.Vector3(0, 1.7, -50);
      var bdir2 = new THREE.Vector3(bellPos.x - en.pos.x, 0, bellPos.z - en.pos.z).normalize();
      en.pos.x += bdir2.x * speed * dt;
      en.pos.z += bdir2.z * speed * dt;
      if (en.pos.distanceTo(bellPos) < 3) {
        en.state = 'chase';
      }
    } else if (en.state === 'flee') {
      // Malthus fleeing circle
      var circlePos = new THREE.Vector3(ritualCirclePos.x, en.pos.y, ritualCirclePos.z);
      var fdir = new THREE.Vector3(en.pos.x - circlePos.x, 0, en.pos.z - circlePos.z).normalize();
      en.pos.x += fdir.x * speed * 1.5 * dt;
      en.pos.z += fdir.z * speed * 1.5 * dt;
      var ddx = en.pos.x - ritualCirclePos.x;
      var ddz = en.pos.z - ritualCirclePos.z;
      if (Math.sqrt(ddx*ddx + ddz*ddz) > 6) {
        en.state = 'chase';
      }
    } else if (en.state === 'ritual') {
      // Malthus stays in circle, rotates
      en.pos.x = ritualCirclePos.x + Math.cos(performance.now()/2000) * 2;
      en.pos.z = ritualCirclePos.z + Math.sin(performance.now()/2000) * 2;
    }

    en.mesh.position.copy(en.pos);
    // face player
    if (en.alerted) {
      var angle = Math.atan2(playerPos.x - en.pos.x, playerPos.z - en.pos.z);
      en.mesh.rotation.y = angle;
    }
  }

  function updateProjectiles(dt) {
    var toRemove = [];
    var i;
    for (i = 0; i < projectiles.length; i++) {
      var p = projectiles[i];
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.life -= dt;
      if (p.life <= 0) { toRemove.push(i); continue; }
      if (p.fromEnemy) {
        var d = p.mesh.position.distanceTo(camera.position);
        if (d < 0.8) {
          playerHP -= p.damage;
          toRemove.push(i);
        }
      }
    }
    for (i = toRemove.length - 1; i >= 0; i--) {
      var idx = toRemove[i];
      scene.remove(projectiles[idx].mesh);
      projectiles.splice(idx, 1);
    }
  }

  function checkWinLose() {
    if (gameWon || gameLost) return;
    if (playerHP <= 0) {
      gameLost = true;
      showEndScreen('You were consumed by the darkness. The cult prevails.', false);
      return;
    }
    var allCivsFreed = civilians.every(function(c){ return c.freed; });
    var malthusDown = malthus && malthus.hp <= 0;
    if (allCivsFreed && malthusDown) {
      gameWon = true;
      score += 5000;
      showEndScreen('The asylum is free. Prophet Malthus is no more.', true);
    }
  }

  function showEndScreen(msg, win) {
    var div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);color:' + (win ? '#8f8' : '#f88') + ';font:bold 2em monospace;z-index:2000;text-align:center;';
    div.innerHTML = '<div>' + (win ? 'ASYLUM CLEARED' : 'CONSUMED') + '</div><div style="font-size:0.5em;margin-top:20px;color:#ccc">' + msg + '</div><div style="font-size:0.5em;margin-top:10px;color:#fc8">Score: ' + score + '</div><div style="font-size:0.4em;margin-top:20px;color:#888">Press R to restart</div>';
    document.body.appendChild(div);
    var handler = function(e) {
      if (e.code === 'KeyR') {
        document.body.removeChild(div);
        document.removeEventListener('keydown', handler);
        reset();
        buildWorld();
        camera.position.set(0, 1.7, 0);
        gameWon = false;
        gameLost = false;
        active = true;
      }
    };
    document.addEventListener('keydown', handler);
    if (document.exitPointerLock) document.exitPointerLock();
    active = false;
  }

  // ── reset ──────────────────────────────────────────────────────────────────
  function reset() {
    // remove all enemy meshes and projectile meshes
    var i;
    for (i = 0; i < enemies.length; i++) {
      if (enemies[i].mesh) scene.remove(enemies[i].mesh);
    }
    for (i = 0; i < projectiles.length; i++) {
      if (projectiles[i].mesh) scene.remove(projectiles[i].mesh);
    }
    for (i = 0; i < civilians.length; i++) {
      if (civilians[i].mesh) scene.remove(civilians[i].mesh);
      if (civilians[i].door) scene.remove(civilians[i].door);
    }
    // remove all collidables and scene children we built
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }
    enemies = [];
    projectiles = [];
    civilians = [];
    flickerLights = [];
    allCollidables = [];
    roomPositions = [];
    bellHits = 0;
    bellAlerted = false;
    bellMesh = null;
    blackoutTimer = 45;
    blackoutActive = false;
    blackoutElapsed = 0;
    score = 0;
    playerHP = 100;
    malthus = null;
    malthusInCircle = false;
    malthusTP = 30;
    cultistsSummoned = false;
    freeing = null;
    freeTimer = 0;
    gameWon = false;
    gameLost = false;
    playerVelocity = { x: 0, y: 0, z: 0 };
    playerOnGround = true;
    flickerPhase = 0;
  }

  return { init: init, update: update, reset: reset };
}());
