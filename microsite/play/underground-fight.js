window.UndergroundFight = (function () {
  'use strict';

  // ── state ────────────────────────────────────────────────────────────────────
  var scene, camera, renderer, clock;
  var keys = {};
  var mouse = { dx: 0, dy: 0, locked: false };
  var yaw = 0, pitch = 0;
  var playerVel = { x: 0, y: 0, z: 0 };
  var playerPos = { x: 0, y: 1.7, z: 40 };   // tunnel entry
  var onGround = false;
  var playerHP = 100;
  var score = 0;
  var evidenceCollected = 0;
  var bettingSlips = 0;
  var active = false;
  var gameOver = false;
  var won = false;
  var lastU = 0;
  var animFrame = null;
  var hud = null;

  var GRAVITY = -18;
  var MOVE_SPEED = 7;
  var SPRINT_MULT = 1.6;
  var JUMP_VEL = 7;
  var SHOOT_COOLDOWN = 0.25;
  var shootTimer = 0;
  var PLAYER_RADIUS = 0.4;
  var PIT_CENTER = { x: 0, z: 0 };
  var PIT_RADIUS = 8;
  var PIT_FLOOR_Y = -4;

  var enemies = [];
  var evidenceItems = [];
  var slipItems = [];
  var crowdPeople = [];
  var collidables = [];   // { mesh, halfX, halfZ, minY, maxY }
  var bullets = [];

  var donRizzuto = null;
  var humanShieldActivated = false;

  var EVIDENCE_REACH = 2.5;
  var COLLECT_TIME = 2.0;
  var collectingEvidence = null;
  var collectTimer = 0;

  // ── activation ───────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    keys[e.code] = true;
    if (e.code === 'KeyU') { lastU = performance.now(); }
    if (e.code === 'KeyF' && (performance.now() - lastU) < 400) {
      if (!active) startGame();
    }
    if (!active) return;
    if (e.code === 'Space') { e.preventDefault(); tryJump(); }
    if (e.code === 'KeyE') startCollect();
    if (e.code === 'KeyR') reload();
  }

  function onKeyUp(e) { keys[e.code] = false; }

  function onMouseMove(e) {
    if (!mouse.locked) return;
    mouse.dx += e.movementX;
    mouse.dy += e.movementY;
  }

  function onMouseDown(e) {
    if (!active) return;
    if (!mouse.locked) { requestPointerLock(); return; }
    if (e.button === 0) shoot();
  }

  function requestPointerLock() {
    renderer.domElement.requestPointerLock();
  }

  function onPointerLockChange() {
    mouse.locked = (document.pointerLockElement === renderer.domElement);
  }

  // ── HUD ──────────────────────────────────────────────────────────────────────
  function buildHUD() {
    hud = document.createElement('div');
    hud.id = 'uf-hud';
    hud.style.cssText = [
      'position:fixed', 'top:10px', 'left:10px',
      'color:#0ff', 'font:bold 14px monospace',
      'text-shadow:0 0 6px #0ff', 'pointer-events:none',
      'z-index:9999', 'line-height:1.8'
    ].join(';');
    document.body.appendChild(hud);

    var cross = document.createElement('div');
    cross.id = 'uf-cross';
    cross.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#fff', 'font-size:22px',
      'pointer-events:none', 'z-index:9999'
    ].join(';');
    cross.textContent = '+';
    document.body.appendChild(cross);

    var msg = document.createElement('div');
    msg.id = 'uf-msg';
    msg.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-80px)',
      'color:#ff0', 'font:bold 18px monospace',
      'text-align:center', 'pointer-events:none',
      'z-index:9999', 'text-shadow:0 0 8px #ff0'
    ].join(';');
    document.body.appendChild(msg);

    var intro = document.createElement('div');
    intro.id = 'uf-intro';
    intro.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#ff0', 'font:bold 20px monospace',
      'text-align:center', 'pointer-events:none',
      'z-index:9999', 'background:rgba(0,0,0,0.7)',
      'padding:20px 30px', 'border:2px solid #ff0',
      'line-height:2'
    ].join(';');
    intro.innerHTML = [
      'UNDERGROUND FIGHT',
      'Infiltrate the mob fighting ring — arrest Don Rizzuto!',
      '',
      'Press U then F (within 400ms) to start',
      '',
      'WASD — Move | Mouse — Look | LMB — Shoot',
      'Space — Jump | Shift — Sprint | E — Collect Evidence',
      'R — Restart (when dead)',
      '',
      'Collect 4 evidence files, defeat Don Rizzuto,',
      'then escape through the tunnel!'
    ].join('<br>');
    document.body.appendChild(intro);
  }

  function updateHUD() {
    if (!hud) return;

    var intro = document.getElementById('uf-intro');
    if (intro) intro.style.display = active ? 'none' : 'block';

    var activeCount = 0;
    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i].hp > 0 && !enemies[i].isDon) activeCount++;
    }
    var donHP = donRizzuto ? Math.max(0, donRizzuto.hp) : 0;
    var donMaxHP = donRizzuto ? donRizzuto.maxHP : 480;

    if (active) {
      hud.innerHTML = [
        '<span style="color:#f80">UNDERGROUND FIGHT</span>',
        'HP: <span style="color:' + (playerHP > 50 ? '#0f0' : playerHP > 25 ? '#ff0' : '#f00') + '">' + playerHP + '</span>',
        'Score: <span style="color:#ff0">' + score + '</span>',
        'Evidence: <span style="color:' + (evidenceCollected >= 4 ? '#0f0' : '#0ff') + '">' + evidenceCollected + '/4</span>',
        'Betting Slips: <span style="color:#0ff">' + bettingSlips + '/8</span>',
        'Enemies Active: <span style="color:#f44">' + activeCount + '</span>',
        'Don Rizzuto: <span style="color:' + (donHP <= 0 ? '#0f0' : '#f44') + '">' + donHP + '/' + donMaxHP + ' HP</span>',
        humanShieldActivated && donRizzuto && donRizzuto.hp > 0 ? '<span style="color:#f80">DON HIDING BEHIND FIGHTERS!</span>' : '',
        mouse.locked ? '' : '<span style="color:#ff0">[Click to capture mouse]</span>'
      ].join('<br>');
    } else {
      hud.innerHTML = '';
    }

    var msg = document.getElementById('uf-msg');
    if (msg) {
      if (gameOver && won) {
        msg.textContent = 'OPERATION SUCCESS — YOU ESCAPED!';
        msg.style.color = '#0f0';
        msg.style.textShadow = '0 0 12px #0f0';
      } else if (gameOver) {
        msg.textContent = 'YOU DIED — PRESS R TO RESTART';
        msg.style.color = '#f00';
        msg.style.textShadow = '0 0 12px #f00';
      } else if (collectingEvidence) {
        var pct = Math.floor((collectTimer / COLLECT_TIME) * 100);
        msg.textContent = 'Collecting evidence... ' + pct + '%';
        msg.style.color = '#ff0';
        msg.style.textShadow = '0 0 8px #ff0';
      } else if (active && evidenceCollected >= 4 && donRizzuto && donRizzuto.hp <= 0) {
        msg.textContent = 'ESCAPE THROUGH THE TUNNEL! (North)';
        msg.style.color = '#0f0';
        msg.style.textShadow = '0 0 12px #0f0';
      } else {
        msg.textContent = '';
      }
    }
  }

  // ── scene setup ──────────────────────────────────────────────────────────────
  function buildScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a12);
    scene.fog = new THREE.Fog(0x0a0a12, 20, 80);

    scene.add(new THREE.AmbientLight(0x202030, 1));
    var hemi = new THREE.HemisphereLight(0x334466, 0x221100, 0.4);
    scene.add(hemi);

    buildTunnel();
    buildArena();
    buildCrowdStands();
    buildVIPLounge();
    buildLockerRoom();
    buildBettingRoom();
    buildOffice();
    buildFloors();
    spawnEnemies();
    spawnEvidence();
    spawnSlips();
    spawnCrowd();
  }

  function makeMat(color, emissive) {
    return new THREE.MeshLambertMaterial({
      color: color,
      emissive: emissive || 0x000000
    });
  }

  function addBox(w, h, d, color, x, y, z, emissive, parent) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = makeMat(color, emissive);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    (parent || scene).add(mesh);
    return mesh;
  }

  function registerCollidable(mesh, halfX, halfZ, minY, maxY) {
    collidables.push({ mesh: mesh, halfX: halfX, halfZ: halfZ, minY: minY, maxY: maxY });
  }

  function addWall(w, h, d, color, x, y, z) {
    var m = addBox(w, h, d, color, x, y, z);
    registerCollidable(m, w / 2, d / 2, y - h / 2, y + h / 2);
    return m;
  }

  // ── TUNNEL ───────────────────────────────────────────────────────────────────
  function buildTunnel() {
    var tColor = 0x333344;
    // floor
    addBox(6, 0.3, 30, tColor, 0, -0.15, 25);
    // ceiling
    addBox(6, 0.3, 30, 0x222233, 0, 3.3, 25);
    // left wall
    addWall(0.3, 3.5, 30, tColor, -3, 1.75, 25);
    // right wall
    addWall(0.3, 3.5, 30, tColor, 3, 1.75, 25);
    // entry door frame
    addBox(6.4, 3.8, 0.3, 0x111122, 0, 1.9, 10.5);

    // support pillars in tunnel
    for (var ti = 0; ti < 4; ti++) {
      var tz = 15 + ti * 5;
      addBox(0.2, 3.0, 0.2, 0x444455, -2.5, 1.5, tz);
      addBox(0.2, 3.0, 0.2, 0x444455, 2.5, 1.5, tz);
      // cross beam
      addBox(5, 0.2, 0.2, 0x444455, 0, 3.0, tz);
    }

    // flickering light
    var tLight = new THREE.PointLight(0x4444ff, 1.5, 20);
    tLight.position.set(0, 2.8, 22);
    scene.add(tLight);

    var tLight2 = new THREE.PointLight(0x3333aa, 1.0, 15);
    tLight2.position.set(0, 2.8, 30);
    scene.add(tLight2);

    // "FIGHT CLUB" sign neon
    var signLight = new THREE.PointLight(0xff2200, 2, 10);
    signLight.position.set(0, 3.5, 18);
    scene.add(signLight);

    // arrow lights toward arena
    var arrowLight1 = new THREE.PointLight(0xff4400, 0.8, 6);
    arrowLight1.position.set(0, 1.0, 20);
    scene.add(arrowLight1);
    var arrowLight2 = new THREE.PointLight(0xff4400, 0.8, 6);
    arrowLight2.position.set(0, 1.0, 15);
    scene.add(arrowLight2);
  }

  // ── ARENA ────────────────────────────────────────────────────────────────────
  function buildArena() {
    // main arena floor
    addBox(50, 0.3, 50, 0x221a11, 0, -0.15, 0);

    // fight pit — sunken area in center
    addBox(16, 0.3, 16, 0x1a1208, 0, PIT_FLOOR_Y, 0);

    // pit walls (4 sides of the pit shaft)
    addWall(16.6, 4.5, 0.4, 0x2a1e10, 0, PIT_FLOOR_Y + 2.25, -8.2);
    addWall(16.6, 4.5, 0.4, 0x2a1e10, 0, PIT_FLOOR_Y + 2.25, 8.2);
    addWall(0.4, 4.5, 16.6, 0x2a1e10, -8.2, PIT_FLOOR_Y + 2.25, 0);
    addWall(0.4, 4.5, 16.6, 0x2a1e10, 8.2, PIT_FLOOR_Y + 2.25, 0);

    // pit edge trim (decorative)
    addBox(17, 0.2, 0.4, 0x554433, 0, 0.1, -8.5);
    addBox(17, 0.2, 0.4, 0x554433, 0, 0.1, 8.5);
    addBox(0.4, 0.2, 17, 0x554433, -8.5, 0.1, 0);
    addBox(0.4, 0.2, 17, 0x554433, 8.5, 0.1, 0);

    // rope barrier (LineSegments around pit top)
    buildRopeBarrier();

    // main arena overhead lights
    var arenaLight = new THREE.PointLight(0xffaa44, 3, 30);
    arenaLight.position.set(0, 8, 0);
    scene.add(arenaLight);

    var arenaLight2 = new THREE.PointLight(0xff6622, 2, 25);
    arenaLight2.position.set(5, 6, 5);
    scene.add(arenaLight2);

    var arenaLight3 = new THREE.PointLight(0xff8844, 1.5, 20);
    arenaLight3.position.set(-6, 7, -4);
    scene.add(arenaLight3);

    // scoreboard on wall
    addBox(6, 2, 0.2, 0x111111, 0, 5, -11);
    // scoreboard screen lines
    var sbGeo = new THREE.BufferGeometry();
    var sbV = new Float32Array([
      -2.8, 4.1, -10.8, 2.8, 4.1, -10.8,
      2.8, 4.1, -10.8, 2.8, 5.9, -10.8,
      2.8, 5.9, -10.8, -2.8, 5.9, -10.8,
      -2.8, 5.9, -10.8, -2.8, 4.1, -10.8
    ]);
    sbGeo.setAttribute('position', new THREE.Float32BufferAttribute(sbV, 3));
    scene.add(new THREE.LineSegments(sbGeo, new THREE.LineBasicMaterial({ color: 0x00ff44 })));
  }

  function buildRopeBarrier() {
    var segs = 32;
    var r = 9;
    var postH = 1.2;

    // 3 rope levels at different heights
    for (var rl = 0; rl < 3; rl++) {
      var off = rl * 0.35;
      var rverts = [];
      for (var ri = 0; ri < segs; ri++) {
        var a0 = (ri / segs) * Math.PI * 2;
        var a1 = ((ri + 1) / segs) * Math.PI * 2;
        rverts.push(Math.cos(a0) * r, 0.4 + off, Math.sin(a0) * r);
        rverts.push(Math.cos(a1) * r, 0.4 + off, Math.sin(a1) * r);
      }
      var ropeGeo = new THREE.BufferGeometry();
      ropeGeo.setAttribute('position', new THREE.Float32BufferAttribute(rverts, 3));
      var ropeMat = new THREE.LineBasicMaterial({ color: 0xddaa44 });
      scene.add(new THREE.LineSegments(ropeGeo, ropeMat));
    }

    // corner posts
    for (var pi = 0; pi < 8; pi++) {
      var pa = (pi / 8) * Math.PI * 2;
      addBox(0.1, postH, 0.1, 0x888866, Math.cos(pa) * r, postH / 2, Math.sin(pa) * r);
    }

    // corner pad decorations on 4 main posts
    for (var cp = 0; cp < 4; cp++) {
      var cpa = (cp / 4) * Math.PI * 2;
      var cpx = Math.cos(cpa) * r;
      var cpz = Math.sin(cpa) * r;
      addBox(0.25, 0.8, 0.25, 0xff2200, cpx, 0.4, cpz);
    }
  }

  // ── CROWD STANDS ─────────────────────────────────────────────────────────────
  function buildCrowdStands() {
    // tiered seating on 4 sides of the arena
    var sides = [
      { ox: 14, oz: 0, axisX: true },
      { ox: -14, oz: 0, axisX: true },
      { ox: 0, oz: 14, axisX: false },
      { ox: 0, oz: -14, axisX: false }
    ];

    for (var s = 0; s < 4; s++) {
      var sd = sides[s];
      for (var tier = 0; tier < 5; tier++) {
        var tileW = sd.axisX ? 1.0 : 20;
        var tileD = sd.axisX ? 20 : 1.0;
        var tx = sd.ox + (sd.axisX ? tier * 1.1 * Math.sign(sd.ox) : 0);
        var tz = sd.oz + (sd.axisX ? 0 : tier * 1.1 * Math.sign(sd.oz));
        var ty = tier * 0.6;
        addBox(tileW, 0.3, tileD, 0x3a2a1a, tx, ty, tz);
        // seat backs
        var backW = sd.axisX ? 0.15 : 20;
        var backD = sd.axisX ? 20 : 0.15;
        addBox(backW, 0.5, backD, 0x4a3a2a,
          tx + (sd.axisX ? -0.35 * Math.sign(sd.ox) : 0),
          ty + 0.4,
          tz + (sd.axisX ? 0 : -0.35 * Math.sign(sd.oz)));
      }
    }
  }

  // ── VIP LOUNGE ───────────────────────────────────────────────────────────────
  function buildVIPLounge() {
    var ox = 28, oz = -10;
    // floor
    addBox(20, 0.3, 18, 0x1a1020, ox, -0.15, oz);
    // walls
    addWall(20, 4, 0.3, 0x2a1040, ox, 2, oz + 9);
    addWall(20, 4, 0.3, 0x2a1040, ox, 2, oz - 9);
    addWall(0.3, 4, 18, 0x2a1040, ox + 10, 2, oz);
    addWall(0.3, 4, 18, 0x2a1040, ox - 10, 2, oz);
    // ceiling
    addBox(20, 0.2, 18, 0x150830, ox, 4.1, oz);

    // neon strip lights on ceiling
    var neon1 = new THREE.PointLight(0xff00ff, 2, 15);
    neon1.position.set(ox - 4, 3.5, oz);
    scene.add(neon1);
    var neon2 = new THREE.PointLight(0x00ffff, 2, 15);
    neon2.position.set(ox + 4, 3.5, oz);
    scene.add(neon2);
    var neon3 = new THREE.PointLight(0xff00aa, 1.5, 10);
    neon3.position.set(ox, 3.5, oz - 5);
    scene.add(neon3);

    // neon strip geometry on ceiling (decorative)
    var nsGeo = new THREE.BufferGeometry();
    var nsV = new Float32Array([
      ox - 8, 3.9, oz, ox + 8, 3.9, oz,
      ox - 8, 3.9, oz - 3, ox + 8, 3.9, oz - 3
    ]);
    nsGeo.setAttribute('position', new THREE.Float32BufferAttribute(nsV, 3));
    scene.add(new THREE.LineSegments(nsGeo, new THREE.LineBasicMaterial({ color: 0xff00ff })));

    // bar counter
    var barMesh = addBox(8, 1.1, 1.2, 0x4a3020, ox, 0.55, oz - 7);
    registerCollidable(barMesh, 4, 0.6, 0, 1.1);
    addBox(8, 0.1, 1.5, 0x6a5030, ox, 1.1, oz - 6.8);

    // bar back shelving
    addBox(8, 2.0, 0.2, 0x3a2010, ox, 2.1, oz - 8.2);
    addBox(8, 0.1, 0.4, 0x5a3010, ox, 1.4, oz - 8.1);
    addBox(8, 0.1, 0.4, 0x5a3010, ox, 2.2, oz - 8.1);
    addBox(8, 0.1, 0.4, 0x5a3010, ox, 3.0, oz - 8.1);

    // bar stools
    for (var bi = 0; bi < 5; bi++) {
      var bx = ox - 3 + bi * 1.5;
      addBox(0.4, 0.05, 0.4, 0x554433, bx, 0.7, oz - 5.8);
      addBox(0.05, 0.7, 0.05, 0x443322, bx, 0.35, oz - 5.8);
    }

    // plush seating sections
    for (var vi = 0; vi < 3; vi++) {
      var vx = ox - 4 + vi * 4;
      addBox(2, 0.5, 1.5, 0x6a1540, vx, 0.25, oz + 5);   // seat
      addBox(2, 0.7, 0.3, 0x6a1540, vx, 0.6, oz + 5.6);   // back
      addBox(2, 0.15, 0.15, 0x3a0820, vx, 1.3, oz + 5.6); // top rail
      // arm rests
      addBox(0.15, 0.35, 1.5, 0x5a1030, vx - 1.0, 0.5, oz + 5);
      addBox(0.15, 0.35, 1.5, 0x5a1030, vx + 1.0, 0.5, oz + 5);
      // low table in front
      addBox(1.6, 0.08, 0.8, 0x7a5030, vx, 0.38, oz + 3.8);
      addBox(0.05, 0.35, 0.05, 0x5a3010, vx - 0.75, 0.175, oz + 3.4);
      addBox(0.05, 0.35, 0.05, 0x5a3010, vx + 0.75, 0.175, oz + 3.4);
      addBox(0.05, 0.35, 0.05, 0x5a3010, vx - 0.75, 0.175, oz + 4.2);
      addBox(0.05, 0.35, 0.05, 0x5a3010, vx + 0.75, 0.175, oz + 4.2);
    }

    // bottles on bar shelves
    for (var boi = 0; boi < 8; boi++) {
      var boGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.3, 6);
      var boColors = [0x226633, 0x441188, 0x883311, 0x224488];
      var boMat = new THREE.MeshLambertMaterial({ color: boColors[boi % boColors.length], emissive: 0x112211 });
      var bo = new THREE.Mesh(boGeo, boMat);
      bo.position.set(ox - 3.0 + boi * 0.85, 1.5 + (boi % 2) * 0.8, oz - 8.0);
      scene.add(bo);
    }

    // VIP sign
    var vipLight = new THREE.PointLight(0xffd700, 1.5, 8);
    vipLight.position.set(ox, 3.8, oz + 8.5);
    scene.add(vipLight);
  }

  // ── LOCKER ROOM ──────────────────────────────────────────────────────────────
  function buildLockerRoom() {
    var ox = -28, oz = -10;
    // floor
    addBox(18, 0.3, 16, 0x1a1a1a, ox, -0.15, oz);
    // walls
    addWall(18, 4, 0.3, 0x222222, ox, 2, oz + 8);
    addWall(18, 4, 0.3, 0x222222, ox, 2, oz - 8);
    addWall(0.3, 4, 16, 0x222222, ox + 9, 2, oz);
    addWall(0.3, 4, 16, 0x222222, ox - 9, 2, oz);
    // ceiling
    addBox(18, 0.2, 16, 0x111111, ox, 4.1, oz);

    // overhead fluorescent lights
    var lkLight = new THREE.PointLight(0xffffff, 1.2, 20);
    lkLight.position.set(ox, 3.5, oz);
    scene.add(lkLight);
    var lkLight2 = new THREE.PointLight(0xccccff, 0.8, 12);
    lkLight2.position.set(ox, 3.5, oz + 4);
    scene.add(lkLight2);

    // fluorescent fixture geometry
    for (var fl = 0; fl < 3; fl++) {
      var flGeo = new THREE.BufferGeometry();
      var flz = oz - 4 + fl * 4;
      var flV = new Float32Array([
        ox - 3, 3.9, flz, ox + 3, 3.9, flz
      ]);
      flGeo.setAttribute('position', new THREE.Float32BufferAttribute(flV, 3));
      scene.add(new THREE.LineSegments(flGeo, new THREE.LineBasicMaterial({ color: 0xeeeeff })));
    }

    // lockers (2 rows of 6)
    for (var lk = 0; lk < 6; lk++) {
      var lkx = ox - 6 + lk * 2;

      // north row
      var lkMesh = addBox(1.6, 2.2, 0.7, 0x336688, lkx, 1.1, oz - 7);
      registerCollidable(lkMesh, 0.8, 0.35, 0, 2.2);

      // locker door outline
      var dGeo = new THREE.BufferGeometry();
      var dV = new Float32Array([
        lkx - 0.75, 0.05, oz - 6.65,
        lkx + 0.75, 0.05, oz - 6.65,
        lkx + 0.75, 0.05, oz - 6.65,
        lkx + 0.75, 2.15, oz - 6.65,
        lkx + 0.75, 2.15, oz - 6.65,
        lkx - 0.75, 2.15, oz - 6.65,
        lkx - 0.75, 2.15, oz - 6.65,
        lkx - 0.75, 0.05, oz - 6.65,
        // divider
        lkx - 0.75, 1.1, oz - 6.65,
        lkx + 0.75, 1.1, oz - 6.65
      ]);
      dGeo.setAttribute('position', new THREE.Float32BufferAttribute(dV, 3));
      scene.add(new THREE.LineSegments(dGeo, new THREE.LineBasicMaterial({ color: 0x5599aa })));

      // hinge lines
      var hingeGeo = new THREE.BufferGeometry();
      var hV = new Float32Array([
        lkx - 0.75, 0.3, oz - 6.65,
        lkx - 0.75, 0.6, oz - 6.65,
        lkx - 0.75, 1.4, oz - 6.65,
        lkx - 0.75, 1.7, oz - 6.65
      ]);
      hingeGeo.setAttribute('position', new THREE.Float32BufferAttribute(hV, 3));
      scene.add(new THREE.LineSegments(hingeGeo, new THREE.LineBasicMaterial({ color: 0x888888 })));

      // south row
      var lkMesh2 = addBox(1.6, 2.2, 0.7, 0x336688, lkx, 1.1, oz + 7);
      registerCollidable(lkMesh2, 0.8, 0.35, 0, 2.2);
    }

    // benches in center
    for (var bn = 0; bn < 3; bn++) {
      var bnx = ox - 4 + bn * 4;
      addBox(3, 0.15, 0.6, 0x664422, bnx, 0.45, oz + 3);  // seat
      addBox(0.08, 0.45, 0.6, 0x553311, bnx - 1.4, 0.225, oz + 3); // leg
      addBox(0.08, 0.45, 0.6, 0x553311, bnx + 1.4, 0.225, oz + 3); // leg
      addBox(3, 0.15, 0.6, 0x664422, bnx, 0.45, oz - 3);  // other side
    }

    // wet floor sign
    addBox(0.1, 0.6, 0.05, 0xffdd00, ox + 3, 0.3, oz + 1);
  }

  // ── BETTING ROOM ─────────────────────────────────────────────────────────────
  function buildBettingRoom() {
    var ox = 0, oz = -28;
    // floor
    addBox(30, 0.3, 18, 0x1a1510, ox, -0.15, oz);
    // walls
    addWall(30, 4, 0.3, 0x252010, ox, 2, oz - 9);
    addWall(30, 4, 0.3, 0x252010, ox, 2, oz + 9);
    addWall(0.3, 4, 18, 0x252010, ox - 15, 2, oz);
    addWall(0.3, 4, 18, 0x252010, ox + 15, 2, oz);
    // ceiling
    addBox(30, 0.2, 18, 0x151008, ox, 4.1, oz);

    // lighting
    var brLight = new THREE.PointLight(0xffcc44, 1.5, 25);
    brLight.position.set(ox, 3.5, oz);
    scene.add(brLight);
    var brLight2 = new THREE.PointLight(0xffaa22, 1.0, 15);
    brLight2.position.set(ox - 8, 3.5, oz + 3);
    scene.add(brLight2);
    var brLight3 = new THREE.PointLight(0xffcc55, 1.0, 15);
    brLight3.position.set(ox + 8, 3.5, oz + 3);
    scene.add(brLight3);

    // main service counter
    var ctr = addBox(22, 1.0, 1.5, 0x4a3820, ox, 0.5, oz + 3);
    registerCollidable(ctr, 11, 0.75, 0, 1.0);
    // counter top
    addBox(22, 0.08, 1.7, 0x6a5020, ox, 1.04, oz + 3);

    // divider panels on counter
    for (var dp = 0; dp < 6; dp++) {
      var dpx = ox - 10 + dp * 4;
      addBox(0.08, 0.5, 1.5, 0x5a4518, dpx, 1.25, oz + 3);
    }

    // betting terminals (screen + stand)
    for (var bt = 0; bt < 7; bt++) {
      var btx = ox - 9 + bt * 3;
      // terminal stand
      addBox(0.15, 0.4, 0.15, 0x333333, btx, 1.3, oz + 3.1);
      // screen
      addBox(1.0, 0.8, 0.12, 0x223344, btx, 1.7, oz + 3.1);
      // screen outline
      var scrGeo = new THREE.BufferGeometry();
      var scrV = new Float32Array([
        btx - 0.45, 1.35, oz + 2.95,
        btx + 0.45, 1.35, oz + 2.95,
        btx + 0.45, 1.35, oz + 2.95,
        btx + 0.45, 2.05, oz + 2.95,
        btx + 0.45, 2.05, oz + 2.95,
        btx - 0.45, 2.05, oz + 2.95,
        btx - 0.45, 2.05, oz + 2.95,
        btx - 0.45, 1.35, oz + 2.95,
        // cross divider
        btx - 0.45, 1.7, oz + 2.95,
        btx + 0.45, 1.7, oz + 2.95,
        btx, 1.35, oz + 2.95,
        btx, 2.05, oz + 2.95
      ]);
      scrGeo.setAttribute('position', new THREE.Float32BufferAttribute(scrV, 3));
      scene.add(new THREE.LineSegments(scrGeo, new THREE.LineBasicMaterial({ color: 0x00ff88 })));

      // terminal glow light
      var tgLight = new THREE.PointLight(0x00ff44, 0.3, 3);
      tgLight.position.set(btx, 1.7, oz + 2.9);
      scene.add(tgLight);
    }

    // chairs behind counter (for workers)
    for (var ch = 0; ch < 5; ch++) {
      var chx = ox - 6 + ch * 3;
      addBox(0.7, 0.1, 0.7, 0x554433, chx, 0.45, oz - 2);    // seat
      addBox(0.7, 0.7, 0.1, 0x554433, chx, 0.8, oz - 1.65);  // back
      addBox(0.05, 0.45, 0.05, 0x443322, chx - 0.3, 0.225, oz - 1.65); // legs
      addBox(0.05, 0.45, 0.05, 0x443322, chx + 0.3, 0.225, oz - 1.65);
    }

    // wanted posters on back wall
    for (var wp = 0; wp < 4; wp++) {
      var wpx = ox - 6 + wp * 4;
      addBox(0.6, 0.8, 0.05, 0xddcc99, wpx, 2.5, oz - 8.8);
      var wpGeo = new THREE.BufferGeometry();
      var wpV = new Float32Array([
        wpx - 0.28, 2.12, oz - 8.75,
        wpx + 0.28, 2.12, oz - 8.75,
        wpx + 0.28, 2.12, oz - 8.75,
        wpx + 0.28, 2.88, oz - 8.75,
        wpx + 0.28, 2.88, oz - 8.75,
        wpx - 0.28, 2.88, oz - 8.75,
        wpx - 0.28, 2.88, oz - 8.75,
        wpx - 0.28, 2.12, oz - 8.75
      ]);
      wpGeo.setAttribute('position', new THREE.Float32BufferAttribute(wpV, 3));
      scene.add(new THREE.LineSegments(wpGeo, new THREE.LineBasicMaterial({ color: 0x884422 })));
    }
  }

  // ── OFFICE ───────────────────────────────────────────────────────────────────
  function buildOffice() {
    var ox = 0, oz = -50;
    // floor (dark wood feel)
    addBox(20, 0.3, 16, 0x1e1408, ox, -0.15, oz);
    // walls
    addWall(20, 4, 0.3, 0x2e1e0a, ox, 2, oz - 8);
    addWall(20, 4, 0.3, 0x2e1e0a, ox, 2, oz + 8);
    addWall(0.3, 4, 16, 0x2e1e0a, ox - 10, 2, oz);
    addWall(0.3, 4, 16, 0x2e1e0a, ox + 10, 2, oz);
    // ceiling
    addBox(20, 0.2, 16, 0x150e05, ox, 4.1, oz);

    // wainscoting on lower walls
    addBox(20, 0.8, 0.15, 0x5a3a18, ox, 0.4, oz - 7.85);
    addBox(20, 0.8, 0.15, 0x5a3a18, ox, 0.4, oz + 7.85);

    // warm lamp lighting
    var offLight = new THREE.PointLight(0xffaa55, 2.5, 20);
    offLight.position.set(ox, 3.5, oz);
    scene.add(offLight);

    var lampLight = new THREE.PointLight(0xff8833, 1.5, 8);
    lampLight.position.set(ox + 3, 1.5, oz + 1);
    scene.add(lampLight);

    // floor lamp
    addBox(0.1, 1.5, 0.1, 0x333333, ox + 3, 0.75, oz + 1);
    var lampShadeGeo = new THREE.ConeGeometry(0.3, 0.4, 8);
    var lampShadeMat = new THREE.MeshLambertMaterial({ color: 0xddaa44, emissive: 0x443311 });
    var lampShade = new THREE.Mesh(lampShadeGeo, lampShadeMat);
    lampShade.position.set(ox + 3, 1.7, oz + 1);
    scene.add(lampShade);

    // mahogany desk
    var desk = addBox(4, 0.9, 2, 0x6b2f0a, ox, 0.45, oz + 2);
    registerCollidable(desk, 2, 1, 0, 0.9);
    // desk top surface with edge trim
    addBox(4.1, 0.06, 2.1, 0x8b4f2a, ox, 0.93, oz + 2);
    // desk drawers
    for (var dd = 0; dd < 3; dd++) {
      var ddGeo = new THREE.BufferGeometry();
      var ddV = new Float32Array([
        ox - 1.8, 0.08 + dd * 0.27, oz + 1.05,
        ox - 0.6, 0.08 + dd * 0.27, oz + 1.05,
        ox - 0.6, 0.08 + dd * 0.27, oz + 1.05,
        ox - 0.6, 0.32 + dd * 0.27, oz + 1.05,
        ox - 0.6, 0.32 + dd * 0.27, oz + 1.05,
        ox - 1.8, 0.32 + dd * 0.27, oz + 1.05,
        ox - 1.8, 0.32 + dd * 0.27, oz + 1.05,
        ox - 1.8, 0.08 + dd * 0.27, oz + 1.05
      ]);
      ddGeo.setAttribute('position', new THREE.Float32BufferAttribute(ddV, 3));
      scene.add(new THREE.LineSegments(ddGeo, new THREE.LineBasicMaterial({ color: 0xaa6633 })));
      // drawer handle
      addBox(0.15, 0.04, 0.04, 0xddaa44, ox - 1.2, 0.2 + dd * 0.27, oz + 1.04);
    }

    // safe on side wall
    var safe = addBox(0.9, 1.2, 0.7, 0x444444, ox + 7, 0.6, oz - 5);
    registerCollidable(safe, 0.45, 0.35, 0, 1.2);
    // safe door frame
    var safeGeo = new THREE.BufferGeometry();
    var safeV = new Float32Array([
      ox + 6.56, 0.05, oz - 4.65,
      ox + 6.56, 1.15, oz - 4.65,
      ox + 6.56, 1.15, oz - 4.65,
      ox + 7.44, 1.15, oz - 4.65,
      ox + 7.44, 1.15, oz - 4.65,
      ox + 7.44, 0.05, oz - 4.65,
      ox + 7.44, 0.05, oz - 4.65,
      ox + 6.56, 0.05, oz - 4.65,
      // dial
      ox + 7.0, 0.5, oz - 4.65,
      ox + 7.3, 0.7, oz - 4.65,
      ox + 7.0, 0.9, oz - 4.65,
      ox + 6.7, 0.7, oz - 4.65,
      ox + 6.7, 0.7, oz - 4.65,
      ox + 7.3, 0.7, oz - 4.65
    ]);
    safeGeo.setAttribute('position', new THREE.Float32BufferAttribute(safeV, 3));
    scene.add(new THREE.LineSegments(safeGeo, new THREE.LineBasicMaterial({ color: 0xaaaaaa })));

    // trophy shelf unit
    var shelfBack = addBox(0.1, 2.5, 4.5, 0x5a3010, ox - 9.8, 2.25, oz - 5);
    addBox(4.5, 0.12, 0.5, 0x5a3010, ox - 7.75, 1.4, oz - 5);  // shelf 1
    addBox(4.5, 0.12, 0.5, 0x5a3010, ox - 7.75, 2.1, oz - 5);  // shelf 2
    addBox(4.5, 0.12, 0.5, 0x5a3010, ox - 7.75, 2.8, oz - 5);  // shelf 3

    // trophies on shelves
    for (var tr = 0; tr < 5; tr++) {
      var trx = ox - 9.2 + tr * 0.8;
      var tryArr = [1.52, 2.22, 2.92];
      var tryY = tryArr[tr % 3];
      var cupGeo = new THREE.CylinderGeometry(0.06, 0.1, 0.28, 8);
      var cupColors = [0xddaa22, 0xcccccc, 0xcc8822];
      var cupMat = new THREE.MeshLambertMaterial({ color: cupColors[tr % 3], emissive: 0x111100 });
      var cup = new THREE.Mesh(cupGeo, cupMat);
      cup.position.set(trx, tryY, oz - 5);
      scene.add(cup);
      // cup base
      var baseGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.06, 8);
      var base = new THREE.Mesh(baseGeo, cupMat);
      base.position.set(trx, tryY - 0.17, oz - 5);
      scene.add(base);
    }

    // executive chair behind desk
    addBox(1.2, 0.1, 1.2, 0x3a0a0a, ox, 0.95, oz + 0.2);         // seat
    addBox(1.2, 1.0, 0.12, 0x3a0a0a, ox, 1.45, oz - 0.42);       // back
    addBox(1.2, 0.08, 0.08, 0x1a0505, ox, 1.95, oz - 0.46);      // head rest top
    // chair legs
    addBox(0.06, 0.95, 0.06, 0x222222, ox - 0.55, 0.475, oz + 0.7);
    addBox(0.06, 0.95, 0.06, 0x222222, ox + 0.55, 0.475, oz + 0.7);
    addBox(0.06, 0.95, 0.06, 0x222222, ox - 0.55, 0.475, oz - 0.3);
    addBox(0.06, 0.95, 0.06, 0x222222, ox + 0.55, 0.475, oz - 0.3);

    // painting on wall
    addBox(2.5, 1.8, 0.06, 0x224488, ox - 4, 2.8, oz - 7.8);
    var pGeo = new THREE.BufferGeometry();
    var pV = new Float32Array([
      ox - 5.2, 1.92, oz - 7.73,
      ox - 2.8, 1.92, oz - 7.73,
      ox - 2.8, 1.92, oz - 7.73,
      ox - 2.8, 3.68, oz - 7.73,
      ox - 2.8, 3.68, oz - 7.73,
      ox - 5.2, 3.68, oz - 7.73,
      ox - 5.2, 3.68, oz - 7.73,
      ox - 5.2, 1.92, oz - 7.73
    ]);
    pGeo.setAttribute('position', new THREE.Float32BufferAttribute(pV, 3));
    scene.add(new THREE.LineSegments(pGeo, new THREE.LineBasicMaterial({ color: 0xddcc88 })));
  }

  // ── CONNECTING FLOORS ────────────────────────────────────────────────────────
  function buildFloors() {
    // VIP corridor (right side)
    addBox(10, 0.3, 14, 0x1a1510, 22, -0.15, -5);
    addWall(0.3, 3, 14, 0x2a2015, 17.1, 1.5, -5);  // inner wall opening

    // locker corridor (left side)
    addBox(10, 0.3, 14, 0x1a1a1a, -22, -0.15, -5);
    addWall(0.3, 3, 14, 0x202020, -17.1, 1.5, -5);

    // betting approach corridor
    addBox(16, 0.3, 12, 0x1a1510, 0, -0.15, -18);
    addWall(8, 3, 0.3, 0x252010, -11, 1.5, -14);
    addWall(8, 3, 0.3, 0x252010, 11, 1.5, -14);

    // office corridor
    addBox(14, 0.3, 10, 0x1e1408, 0, -0.15, -42);
    addWall(0.3, 3, 10, 0x2e1e0a, -7.1, 1.5, -42);
    addWall(0.3, 3, 10, 0x2e1e0a, 7.1, 1.5, -42);
    addWall(8, 3, 0.3, 0x2e1e0a, -11, 1.5, -37.1);
    addWall(8, 3, 0.3, 0x2e1e0a, 11, 1.5, -37.1);

    // corridor lights
    var cl1 = new THREE.PointLight(0xffcc44, 1.0, 12);
    cl1.position.set(0, 3, -18);
    scene.add(cl1);
    var cl2 = new THREE.PointLight(0xffaa33, 0.8, 10);
    cl2.position.set(0, 3, -42);
    scene.add(cl2);
  }

  // ── ENEMY SPAWN ──────────────────────────────────────────────────────────────
  function spawnEnemies() {
    var enforcer_positions = [
      [20, 0, -8], [24, 0, -12], [28, 0, -8], [26, 0, -4],
      [-20, 0, -8], [-24, 0, -12],
      [5, 0, -27], [-5, 0, -27], [10, 0, -29], [-10, 0, -29]
    ];
    for (var ei = 0; ei < 10; ei++) {
      var ep = enforcer_positions[ei];
      spawnEnforcer(ep[0], ep[1], ep[2]);
    }

    var fighter_positions = [
      [5, 0, -5], [-5, 0, -5], [8, 0, 3], [-8, 0, 3],
      [12, 0, -15], [-12, 0, -15], [3, 0, -20], [-3, 0, -20]
    ];
    for (var fi = 0; fi < 8; fi++) {
      var fp = fighter_positions[fi];
      spawnFighter(fp[0], fp[1], fp[2]);
    }

    // Don Rizzuto — in his office
    donRizzuto = spawnDon(0, 0, -50);
  }

  function makeCapsule(bodyColor, headColor) {
    var group = new THREE.Group();
    // body
    var bodyGeo = new THREE.BoxGeometry(0.6, 1.0, 0.4);
    var bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    group.add(body);
    // head
    var headGeo = new THREE.SphereGeometry(0.22, 8, 6);
    var headMat = new THREE.MeshLambertMaterial({ color: headColor || 0xddaa88 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.22;
    group.add(head);
    // legs
    var legGeo = new THREE.BoxGeometry(0.22, 0.5, 0.22);
    var legMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    var legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.15, -0.25, 0);
    group.add(legL);
    var legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.15, -0.25, 0);
    group.add(legR);
    return group;
  }

  function spawnEnforcer(x, y, z) {
    var mesh = makeCapsule(0x334433, 0xccaa88);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    var e = {
      mesh: mesh, hp: 85, maxHP: 85, isDon: false, isFighter: false,
      type: 'enforcer', x: x, y: y, z: z,
      vx: 0, vy: 0, vz: 0, onGround: true,
      state: 'patrol', patrolTimer: 0, shootTimer: 0,
      stunned: false, stunTimer: 0, inPit: false,
      alertRange: 18, shootRange: 14, meleeRange: 1.8,
      moveSpeed: 2.0, shootCooldown: 1.2,
      patrolOrigin: { x: x, z: z }, patrolAngle: Math.random() * Math.PI * 2
    };
    enemies.push(e);
    return e;
  }

  function spawnFighter(x, y, z) {
    var mesh = makeCapsule(0x886633, 0xbb9966);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    var e = {
      mesh: mesh, hp: 90, maxHP: 90, isDon: false, isFighter: true,
      type: 'fighter', x: x, y: y, z: z,
      vx: 0, vy: 0, vz: 0, onGround: true,
      state: 'patrol', patrolTimer: 0, shootTimer: 0,
      stunned: false, stunTimer: 0, inPit: false,
      alertRange: 22, shootRange: 0, meleeRange: 1.5,
      moveSpeed: 4.5, shootCooldown: 0,
      patrolOrigin: { x: x, z: z }, patrolAngle: Math.random() * Math.PI * 2,
      chargeTimer: 0, isHumanShield: false
    };
    enemies.push(e);
    return e;
  }

  function spawnDon(x, y, z) {
    var mesh = makeCapsule(0x332211, 0xddbb99);
    // extra bulk suit layer
    var suitGeo = new THREE.BoxGeometry(0.8, 1.1, 0.6);
    var suitMat = new THREE.MeshLambertMaterial({ color: 0x221100, emissive: 0x110800 });
    var suitMesh = new THREE.Mesh(suitGeo, suitMat);
    suitMesh.position.y = 0.55;
    mesh.add(suitMesh);
    // fedora hat
    var hatBrimGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.04, 10);
    var hatMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var hatBrim = new THREE.Mesh(hatBrimGeo, hatMat);
    hatBrim.position.y = 1.52;
    mesh.add(hatBrim);
    var hatTopGeo = new THREE.CylinderGeometry(0.22, 0.25, 0.28, 10);
    var hatTop = new THREE.Mesh(hatTopGeo, hatMat);
    hatTop.position.y = 1.66;
    mesh.add(hatTop);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    var e = {
      mesh: mesh, hp: 480, maxHP: 480, isDon: true, isFighter: false,
      type: 'don', x: x, y: y, z: z,
      vx: 0, vy: 0, vz: 0, onGround: true,
      state: 'idle', patrolTimer: 0, shootTimer: 0,
      stunned: false, stunTimer: 0, inPit: false,
      alertRange: 25, shootRange: 20, meleeRange: 2,
      moveSpeed: 2.5, shootCooldown: 0.6,
      patrolOrigin: { x: x, z: z }, patrolAngle: 0,
      shieldActivated: false, retreating: false, coverTimer: 0
    };
    enemies.push(e);
    donRizzuto = e;
    return e;
  }

  // ── EVIDENCE & COLLECTIBLES ───────────────────────────────────────────────────
  function spawnEvidence() {
    var positions = [
      [8, 0.5, -26, 'LEDGER A'],
      [-8, 0.5, -26, 'LEDGER B'],
      [3, 0.96, -49, 'FILE C'],
      [-3, 0.96, -49, 'FILE D']
    ];
    for (var i = 0; i < 4; i++) {
      var ep = positions[i];
      // file folder shape
      var geo = new THREE.BoxGeometry(0.4, 0.05, 0.3);
      var mat = new THREE.MeshLambertMaterial({ color: 0xeedd99, emissive: 0x332200 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(ep[0], ep[1], ep[2]);
      scene.add(mesh);
      // page lines on top
      var pgGeo = new THREE.BufferGeometry();
      var pgV = new Float32Array([
        ep[0] - 0.18, ep[1] + 0.026, ep[2] - 0.1,
        ep[0] + 0.18, ep[1] + 0.026, ep[2] - 0.1,
        ep[0] - 0.18, ep[1] + 0.026, ep[2],
        ep[0] + 0.18, ep[1] + 0.026, ep[2],
        ep[0] - 0.18, ep[1] + 0.026, ep[2] + 0.1,
        ep[0] + 0.18, ep[1] + 0.026, ep[2] + 0.1
      ]);
      pgGeo.setAttribute('position', new THREE.Float32BufferAttribute(pgV, 3));
      scene.add(new THREE.LineSegments(pgGeo, new THREE.LineBasicMaterial({ color: 0x886633 })));

      evidenceItems.push({ mesh: mesh, x: ep[0], y: ep[1], z: ep[2], collected: false, label: ep[3] });
    }
  }

  function spawnSlips() {
    var positions = [
      [12, 0.5, -26], [-12, 0.5, -26],
      [5, 0.5, -30], [-5, 0.5, -30],
      [0, 0.5, -25], [9, 0.5, -31],
      [-9, 0.5, -29], [0, 0.5, -33]
    ];
    for (var i = 0; i < 8; i++) {
      var sp = positions[i];
      var geo = new THREE.BoxGeometry(0.2, 0.02, 0.15);
      var mat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x111111 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(sp[0], sp[1], sp[2]);
      scene.add(mesh);
      slipItems.push({ mesh: mesh, x: sp[0], y: sp[1], z: sp[2], collected: false });
    }
  }

  function spawnCrowd() {
    // spectators around the stands — neutral, -500 score if shot
    var angles = [];
    for (var ai = 0; ai < 16; ai++) { angles.push((ai / 16) * Math.PI * 2); }
    var radii = [11, 12.5, 14, 15.5];
    for (var ri = 0; ri < radii.length; ri++) {
      for (var aj = 0; aj < angles.length; aj++) {
        var cr = radii[ri];
        var ca = angles[aj];
        var cx = Math.cos(ca) * cr;
        var cz = Math.sin(ca) * cr;
        var cy = ri * 0.55;
        var cGeo = new THREE.BoxGeometry(0.4, 0.9, 0.35);
        var cColors = [0x884422, 0x334488, 0x883344, 0x448833, 0x664422, 0x553388];
        var cMat = new THREE.MeshLambertMaterial({ color: cColors[(ri * 4 + aj) % cColors.length] });
        var cMesh = new THREE.Mesh(cGeo, cMat);
        cMesh.position.set(cx, cy + 0.45, cz);
        // orient toward center
        cMesh.lookAt(0, cy + 0.45, 0);
        scene.add(cMesh);
        // crowd head
        var hGeo = new THREE.SphereGeometry(0.14, 6, 5);
        var hMat = new THREE.MeshLambertMaterial({ color: 0xddaa88 });
        var hMesh = new THREE.Mesh(hGeo, hMat);
        hMesh.position.set(cx, cy + 1.0, cz);
        scene.add(hMesh);
        crowdPeople.push({ mesh: cMesh, headMesh: hMesh, hp: 30, x: cx, y: cy, z: cz, alive: true });
      }
    }
  }

  // ── BULLETS ──────────────────────────────────────────────────────────────────
  function shoot() {
    if (!active || gameOver) return;
    if (shootTimer > 0) return;
    shootTimer = SHOOT_COOLDOWN;

    var dir = new THREE.Vector3(0, 0, -1);
    var euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
    dir.applyEuler(euler);

    var bGeo = new THREE.SphereGeometry(0.05, 4, 4);
    var bMat = new THREE.MeshLambertMaterial({ color: 0xffff00, emissive: 0xaaaa00 });
    var bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set(playerPos.x, playerPos.y, playerPos.z);
    scene.add(bMesh);

    bullets.push({
      mesh: bMesh,
      x: playerPos.x, y: playerPos.y, z: playerPos.z,
      dx: dir.x, dy: dir.y, dz: dir.z,
      speed: 40, life: 3.0, fromEnemy: false
    });
  }

  function enemyShoot(e) {
    var dx = playerPos.x - e.x;
    var dy = playerPos.y - e.y;
    var dz = playerPos.z - e.z;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.001) return;
    dx /= len; dy /= len; dz /= len;

    var bGeo = new THREE.SphereGeometry(0.06, 4, 4);
    var bMat = new THREE.MeshLambertMaterial({ color: 0xff4400, emissive: 0x881100 });
    var bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set(e.x, e.y + 1, e.z);
    scene.add(bMesh);

    bullets.push({
      mesh: bMesh,
      x: e.x, y: e.y + 1, z: e.z,
      dx: dx + (Math.random() - 0.5) * 0.12,
      dy: dy + (Math.random() - 0.5) * 0.05,
      dz: dz + (Math.random() - 0.5) * 0.12,
      speed: 22, life: 4.0, fromEnemy: true,
      damage: e.isDon ? 14 : 8
    });
  }

  function updateBullets(dt) {
    for (var i = bullets.length - 1; i >= 0; i--) {
      var b = bullets[i];
      b.life -= dt;
      if (b.life <= 0) { removeBullet(i); continue; }

      var steps = 3;
      var sdx = b.dx * b.speed * dt / steps;
      var sdy = b.dy * b.speed * dt / steps;
      var sdz = b.dz * b.speed * dt / steps;
      var hit = false;

      for (var s = 0; s < steps; s++) {
        b.x += sdx; b.y += sdy; b.z += sdz;
        b.mesh.position.set(b.x, b.y, b.z);

        if (b.fromEnemy) {
          var pdx = b.x - playerPos.x;
          var pdy = b.y - playerPos.y;
          var pdz = b.z - playerPos.z;
          if (Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz) < 0.5) {
            playerHP -= b.damage || 8;
            if (playerHP <= 0) { playerHP = 0; triggerGameOver(false); }
            removeBullet(i); hit = true; break;
          }
        } else {
          // check enemies
          for (var ei = 0; ei < enemies.length; ei++) {
            var en = enemies[ei];
            if (en.hp <= 0) continue;
            var edx = b.x - en.x;
            var edy = b.y - (en.y + 1);
            var edz = b.z - en.z;
            if (Math.sqrt(edx * edx + edy * edy + edz * edz) < 0.65) {
              var dmg = 20 + Math.floor(Math.random() * 10);
              damageEnemy(en, dmg);
              removeBullet(i); hit = true; break;
            }
          }
          if (hit) break;
          // check crowd (discourage spraying)
          for (var ci = 0; ci < crowdPeople.length; ci++) {
            var cp = crowdPeople[ci];
            if (!cp.alive) continue;
            var cdx = b.x - cp.x;
            var cdz = b.z - cp.z;
            var cdy = b.y - (cp.y + 0.45);
            if (Math.sqrt(cdx * cdx + cdy * cdy + cdz * cdz) < 0.45) {
              cp.alive = false;
              cp.mesh.visible = false;
              if (cp.headMesh) cp.headMesh.visible = false;
              score -= 500;
              removeBullet(i); hit = true; break;
            }
          }
          if (hit) break;
        }
      }
    }
  }

  function removeBullet(i) {
    scene.remove(bullets[i].mesh);
    bullets.splice(i, 1);
  }

  // ── DAMAGE ───────────────────────────────────────────────────────────────────
  function damageEnemy(e, dmg) {
    if (e.hp <= 0) return;
    e.hp -= dmg;
    if (e.hp <= 0) {
      e.hp = 0;
      killEnemy(e);
    } else {
      e.state = 'chase';
      // Don human shield check at 50% HP
      if (e.isDon && !e.shieldActivated && e.hp <= e.maxHP * 0.5) {
        activateHumanShield();
        e.shieldActivated = true;
      }
    }
  }

  function killEnemy(e) {
    e.mesh.visible = false;
    if (e.isDon) {
      score += 1000;
      checkWinCondition();
    } else {
      score += e.isFighter ? 150 : 100;
    }
  }

  function activateHumanShield() {
    humanShieldActivated = true;
    // Assign up to 3 live fighters to charge the player
    var count = 0;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.isFighter && e.hp > 0 && count < 3) {
        e.isHumanShield = true;
        e.state = 'chase';
        count++;
      }
    }
    if (donRizzuto) { donRizzuto.retreating = true; }
  }

  // ── KNOCKBACK / PIT ──────────────────────────────────────────────────────────
  function tryKnockback(e, dirX, dirZ) {
    var kbForce = 6;
    e.vx = dirX * kbForce;
    e.vz = dirZ * kbForce;
    e.vy = 2;
    e.onGround = false;
  }

  function checkPitFall(e) {
    if (e.inPit || e.hp <= 0) return;
    var dx = e.x - PIT_CENTER.x;
    var dz = e.z - PIT_CENTER.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < PIT_RADIUS * 0.65 && e.y < 0.5) {
      e.inPit = true;
      e.stunned = true;
      e.stunTimer = 5.0;
      e.y = PIT_FLOOR_Y;
      damageEnemy(e, 30);
      score += 50; // bonus for pit knockin
    }
  }

  // ── EVIDENCE COLLECTION ──────────────────────────────────────────────────────
  function startCollect() {
    if (!active || gameOver) return;
    if (collectingEvidence) return;

    // find nearest evidence within reach
    for (var i = 0; i < evidenceItems.length; i++) {
      var ev = evidenceItems[i];
      if (ev.collected) continue;
      var dx = playerPos.x - ev.x;
      var dy = playerPos.y - ev.y;
      var dz = playerPos.z - ev.z;
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < EVIDENCE_REACH) {
        collectingEvidence = ev;
        collectTimer = 0;
        return;
      }
    }
    // slip items — instant collect on E press too (fallback, auto is also active)
    for (var si = 0; si < slipItems.length; si++) {
      var sl = slipItems[si];
      if (sl.collected) continue;
      var sdx = playerPos.x - sl.x;
      var sdz = playerPos.z - sl.z;
      if (Math.sqrt(sdx * sdx + sdz * sdz) < 1.5) {
        sl.collected = true;
        sl.mesh.visible = false;
        bettingSlips++;
        score += 200;
      }
    }
  }

  function updateEvidence(dt) {
    // auto collect betting slips by proximity
    for (var si = 0; si < slipItems.length; si++) {
      var sl = slipItems[si];
      if (sl.collected) continue;
      var sdx = playerPos.x - sl.x;
      var sdy = playerPos.y - sl.y;
      var sdz = playerPos.z - sl.z;
      if (Math.sqrt(sdx * sdx + sdy * sdy + sdz * sdz) < 1.0) {
        sl.collected = true;
        sl.mesh.visible = false;
        bettingSlips++;
        score += 200;
      }
    }

    if (!collectingEvidence) return;
    var ev = collectingEvidence;
    var dx = playerPos.x - ev.x;
    var dy = playerPos.y - ev.y;
    var dz = playerPos.z - ev.z;
    // cancel if player moved away
    if (Math.sqrt(dx * dx + dy * dy + dz * dz) > EVIDENCE_REACH + 0.6) {
      collectingEvidence = null;
      collectTimer = 0;
      return;
    }
    collectTimer += dt;
    if (collectTimer >= COLLECT_TIME) {
      ev.collected = true;
      ev.mesh.visible = false;
      evidenceCollected++;
      score += 600;
      collectingEvidence = null;
      collectTimer = 0;
      checkWinCondition();
    }
  }

  // ── WIN / LOSE ────────────────────────────────────────────────────────────────
  function checkWinCondition() {
    if (evidenceCollected >= 4 && donRizzuto && donRizzuto.hp <= 0) {
      var dx = playerPos.x;
      var dz = playerPos.z - 40;
      if (Math.sqrt(dx * dx + dz * dz) < 8) {
        triggerGameOver(true);
      }
    }
  }

  function triggerGameOver(didWin) {
    if (gameOver) return;
    gameOver = true;
    won = didWin;
    if (didWin) score += 2000;
  }

  function reload() {
    if (gameOver && !won) {
      reset();
      return;
    }
    // also check escape tunnel proximity for win trigger
    if (active && !gameOver && evidenceCollected >= 4 && donRizzuto && donRizzuto.hp <= 0) {
      var dx = playerPos.x;
      var dz = playerPos.z - 38;
      if (Math.sqrt(dx * dx + dz * dz) < 10) {
        triggerGameOver(true);
      }
    }
  }

  // ── ENEMY AI ─────────────────────────────────────────────────────────────────
  function updateEnemies(dt) {
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.hp <= 0) continue;

      updateEnemyPhysics(e, dt);
      checkPitFall(e);

      if (e.stunned) {
        e.stunTimer -= dt;
        if (e.stunTimer <= 0) { e.stunned = false; e.inPit = false; }
        e.mesh.position.set(e.x, e.y, e.z);
        continue;
      }

      var pdx = playerPos.x - e.x;
      var pdy = playerPos.y - e.y;
      var pdz = playerPos.z - e.z;
      var distToPlayer = Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz);

      if (e.isDon) {
        updateDon(e, dt, distToPlayer, pdx, pdz);
      } else if (e.isFighter) {
        updateFighter(e, dt, distToPlayer, pdx, pdz);
      } else {
        updateEnforcer(e, dt, distToPlayer, pdx, pdz);
      }

      // apply knockback / velocity
      e.vx *= Math.pow(0.1, dt);
      e.vz *= Math.pow(0.1, dt);

      e.x += e.vx * dt;
      e.z += e.vz * dt;

      // keep enemies in level bounds
      e.x = Math.max(-40, Math.min(40, e.x));
      e.z = Math.max(-60, Math.min(50, e.z));

      e.mesh.position.set(e.x, e.y, e.z);
      e.mesh.lookAt(playerPos.x, e.y, playerPos.z);

      if (e.shootTimer > 0) e.shootTimer -= dt;
    }
  }

  function updateEnemyPhysics(e, dt) {
    if (!e.onGround) {
      e.vy += GRAVITY * dt;
      e.y += e.vy * dt;
    }
    var floorY = getFloorY(e.x, e.z);
    if (e.y <= floorY) {
      e.y = floorY;
      e.vy = 0;
      e.onGround = true;
    } else if (e.y > floorY + 0.05) {
      e.onGround = false;
    }
  }

  function getFloorY(x, z) {
    var dx = x - PIT_CENTER.x;
    var dz = z - PIT_CENTER.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < PIT_RADIUS * 0.65) return PIT_FLOOR_Y;
    return 0;
  }

  function updateEnforcer(e, dt, dist, pdx, pdz) {
    if (dist < e.alertRange || e.state === 'chase') {
      e.state = 'chase';
      if (dist > e.meleeRange + 1.5) {
        var len = Math.sqrt(pdx * pdx + pdz * pdz) || 1;
        e.x += (pdx / len) * e.moveSpeed * dt;
        e.z += (pdz / len) * e.moveSpeed * dt;
      }
      // shoot at player
      if (dist < e.shootRange && e.shootTimer <= 0) {
        e.shootTimer = e.shootCooldown + Math.random() * 0.4;
        enemyShoot(e);
      }
      // melee if close
      if (dist < e.meleeRange) {
        e.patrolTimer += dt;
        if (e.patrolTimer > 0.8) {
          playerHP -= 12;
          e.patrolTimer = 0;
          if (playerHP <= 0) { playerHP = 0; triggerGameOver(false); }
        }
      }
    } else {
      // patrol behavior
      e.patrolTimer += dt;
      if (e.patrolTimer > 3) {
        e.patrolAngle += (Math.random() - 0.5) * 1.5;
        e.patrolTimer = 0;
      }
      e.x += Math.cos(e.patrolAngle) * e.moveSpeed * 0.35 * dt;
      e.z += Math.sin(e.patrolAngle) * e.moveSpeed * 0.35 * dt;
      // drift back to origin
      var ox = e.patrolOrigin.x - e.x;
      var oz = e.patrolOrigin.z - e.z;
      var od = Math.sqrt(ox * ox + oz * oz);
      if (od > 8) {
        e.x += (ox / od) * e.moveSpeed * 0.5 * dt;
        e.z += (oz / od) * e.moveSpeed * 0.5 * dt;
      }
    }
  }

  function updateFighter(e, dt, dist, pdx, pdz) {
    var isAggressive = dist < e.alertRange || e.state === 'chase' || e.isHumanShield;
    if (isAggressive) {
      e.state = 'chase';
      var len = Math.sqrt(pdx * pdx + pdz * pdz) || 1;
      var spd = e.isHumanShield ? e.moveSpeed * 1.6 : e.moveSpeed;
      e.x += (pdx / len) * spd * dt;
      e.z += (pdz / len) * spd * dt;

      // melee attack — faster than enforcer, harder
      if (dist < e.meleeRange) {
        e.chargeTimer += dt;
        if (e.chargeTimer > 0.45) {
          playerHP -= 18;
          e.chargeTimer = 0;
          if (playerHP <= 0) { playerHP = 0; triggerGameOver(false); }
          // shove player
          var kbLen = Math.sqrt(pdx * pdx + pdz * pdz) || 1;
          playerVel.x -= (pdx / kbLen) * 4;
          playerVel.z -= (pdz / kbLen) * 4;
        }
      } else {
        e.chargeTimer = Math.max(0, e.chargeTimer - dt);
      }
    } else {
      e.patrolTimer += dt;
      if (e.patrolTimer > 2) {
        e.patrolAngle += (Math.random() - 0.5) * 2;
        e.patrolTimer = 0;
      }
      e.x += Math.cos(e.patrolAngle) * e.moveSpeed * 0.45 * dt;
      e.z += Math.sin(e.patrolAngle) * e.moveSpeed * 0.45 * dt;
      var fox = e.patrolOrigin.x - e.x;
      var foz = e.patrolOrigin.z - e.z;
      var fod = Math.sqrt(fox * fox + foz * foz);
      if (fod > 8) {
        e.x += (fox / fod) * e.moveSpeed * 0.5 * dt;
        e.z += (foz / fod) * e.moveSpeed * 0.5 * dt;
      }
    }
  }

  function updateDon(e, dt, dist, pdx, pdz) {
    if (dist > e.alertRange && e.state === 'idle') return;
    e.state = 'chase';

    // Human shield phase: retreat and let fighters charge
    if (e.shieldActivated && e.retreating) {
      var shieldAlive = false;
      for (var i = 0; i < enemies.length; i++) {
        if (enemies[i].isHumanShield && enemies[i].hp > 0) { shieldAlive = true; break; }
      }
      if (!shieldAlive) {
        e.retreating = false;
      } else {
        // retreat away from player
        var len2 = Math.sqrt(pdx * pdx + pdz * pdz) || 1;
        e.x -= (pdx / len2) * e.moveSpeed * 0.7 * dt;
        e.z -= (pdz / len2) * e.moveSpeed * 0.7 * dt;
        // occasional pot shots while retreating
        if (dist < e.shootRange && e.shootTimer <= 0) {
          e.shootTimer = e.shootCooldown * 1.8 + Math.random() * 0.5;
          enemyShoot(e);
        }
        return;
      }
    }

    // Active phase: strafe and shoot aggressively
    e.coverTimer += dt;
    var strafeDir = Math.sin(e.coverTimer * 1.5);
    var perpX = -pdz;
    var perpZ = pdx;
    var pLen = Math.sqrt(perpX * perpX + perpZ * perpZ) || 1;
    perpX /= pLen; perpZ /= pLen;

    // approach if far
    if (dist > 8) {
      var len3 = Math.sqrt(pdx * pdx + pdz * pdz) || 1;
      e.x += (pdx / len3) * e.moveSpeed * 0.5 * dt;
      e.z += (pdz / len3) * e.moveSpeed * 0.5 * dt;
    } else if (dist < 4) {
      // back away at close range
      var len4 = Math.sqrt(pdx * pdx + pdz * pdz) || 1;
      e.x -= (pdx / len4) * e.moveSpeed * 0.6 * dt;
      e.z -= (pdz / len4) * e.moveSpeed * 0.6 * dt;
    }
    // strafe perpendicular
    e.x += perpX * strafeDir * e.moveSpeed * dt;
    e.z += perpZ * strafeDir * e.moveSpeed * dt;

    // shoot — twin pistols: sometimes double shot
    if (dist < e.shootRange && e.shootTimer <= 0) {
      e.shootTimer = e.shootCooldown + Math.random() * 0.25;
      enemyShoot(e);
      if (Math.random() < 0.45) {
        var self = e;
        setTimeout(function () { if (self.hp > 0 && active && !gameOver) enemyShoot(self); }, 140);
      }
    }

    // melee if player gets very close
    if (dist < e.meleeRange) {
      e.patrolTimer += dt;
      if (e.patrolTimer > 0.55) {
        playerHP -= 20;
        e.patrolTimer = 0;
        if (playerHP <= 0) { playerHP = 0; triggerGameOver(false); }
      }
    }
  }

  // ── PLAYER PHYSICS ───────────────────────────────────────────────────────────
  function tryJump() {
    if (onGround) {
      playerVel.y = JUMP_VEL;
      onGround = false;
    }
  }

  function updatePlayer(dt) {
    if (gameOver) return;

    // mouse look
    var SENSITIVITY = 0.002;
    yaw -= mouse.dx * SENSITIVITY;
    pitch -= mouse.dy * SENSITIVITY;
    pitch = Math.max(-Math.PI / 2.4, Math.min(Math.PI / 2.4, pitch));
    mouse.dx = 0;
    mouse.dy = 0;

    // directional input
    var spd = MOVE_SPEED * (keys['ShiftLeft'] || keys['ShiftRight'] ? SPRINT_MULT : 1);
    var fwdX = Math.sin(yaw);
    var fwdZ = Math.cos(yaw);
    var rgtX = Math.cos(yaw);
    var rgtZ = -Math.sin(yaw);
    var moveX = 0, moveZ = 0;
    if (keys['KeyW'] || keys['ArrowUp'])    { moveX += fwdX; moveZ += fwdZ; }
    if (keys['KeyS'] || keys['ArrowDown'])  { moveX -= fwdX; moveZ -= fwdZ; }
    if (keys['KeyA'] || keys['ArrowLeft'])  { moveX -= rgtX; moveZ -= rgtZ; }
    if (keys['KeyD'] || keys['ArrowRight']) { moveX += rgtX; moveZ += rgtZ; }
    var mLen = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (mLen > 0) { moveX /= mLen; moveZ /= mLen; }

    playerVel.x = moveX * spd;
    playerVel.z = moveZ * spd;

    // gravity
    if (!onGround) playerVel.y += GRAVITY * dt;

    // apply
    playerPos.x += playerVel.x * dt;
    playerPos.y += playerVel.y * dt;
    playerPos.z += playerVel.z * dt;

    // floor
    var flY = getFloorY(playerPos.x, playerPos.z);
    if (playerPos.y <= flY + 1.7) {
      playerPos.y = flY + 1.7;
      playerVel.y = 0;
      onGround = true;
    } else {
      onGround = false;
    }

    // wall collisions
    resolvePlayerWalls();

    // level bounds
    playerPos.x = Math.max(-42, Math.min(42, playerPos.x));
    playerPos.z = Math.max(-62, Math.min(52, playerPos.z));

    // update camera
    camera.position.set(playerPos.x, playerPos.y, playerPos.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    // weapon cooldown
    if (shootTimer > 0) shootTimer -= dt;

    // win proximity check
    if (evidenceCollected >= 4 && donRizzuto && donRizzuto.hp <= 0) {
      var tdx = playerPos.x;
      var tdz = playerPos.z - 42;
      if (Math.sqrt(tdx * tdx + tdz * tdz) < 7) {
        triggerGameOver(true);
      }
    }
  }

  function resolvePlayerWalls() {
    for (var i = 0; i < collidables.length; i++) {
      var c = collidables[i];
      var wx = c.mesh.position.x;
      var wz = c.mesh.position.z;
      var dx = playerPos.x - wx;
      var dz = playerPos.z - wz;
      var ox = c.halfX + PLAYER_RADIUS - Math.abs(dx);
      var oz = c.halfZ + PLAYER_RADIUS - Math.abs(dz);
      if (ox > 0 && oz > 0 &&
          playerPos.y < c.maxY + 0.2 &&
          playerPos.y > c.minY - 1.7) {
        if (ox < oz) {
          playerPos.x += ox * Math.sign(dx);
        } else {
          playerPos.z += oz * Math.sign(dz);
        }
      }
    }
  }

  // ── ITEM ANIMATION ───────────────────────────────────────────────────────────
  function updateItems(dt) {
    var t = clock.getElapsedTime();
    for (var i = 0; i < evidenceItems.length; i++) {
      var ev = evidenceItems[i];
      if (!ev.collected) {
        ev.mesh.rotation.y = t * 1.4;
        ev.mesh.position.y = ev.y + Math.sin(t * 2.2 + i * 1.3) * 0.09;
      }
    }
    for (var s = 0; s < slipItems.length; s++) {
      var sl = slipItems[s];
      if (!sl.collected) {
        sl.mesh.rotation.y = t * 2.2 + s * 0.8;
        sl.mesh.position.y = sl.y + Math.sin(t * 3 + s) * 0.04;
      }
    }
  }

  // ── MAIN LOOP ────────────────────────────────────────────────────────────────
  function loop() {
    animFrame = requestAnimationFrame(loop);
    var dt = Math.min(clock.getDelta(), 0.05);

    if (active && !gameOver) {
      updatePlayer(dt);
      updateEnemies(dt);
      updateBullets(dt);
      updateEvidence(dt);
      updateItems(dt);
    }

    updateHUD();
    renderer.render(scene, camera);
  }

  // ── INIT ─────────────────────────────────────────────────────────────────────
  function init(container) {
    if (!container) container = document.body;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    clock = new THREE.Clock();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    window.addEventListener('resize', onResize);

    buildHUD();
    buildScene();
    loop();
  }

  // ── START ─────────────────────────────────────────────────────────────────────
  function startGame() {
    active = true;
    gameOver = false;
    won = false;
    playerPos.x = 0; playerPos.y = 1.7; playerPos.z = 40;
    playerVel.x = 0; playerVel.y = 0; playerVel.z = 0;
    playerHP = 100;
    score = 0;
    evidenceCollected = 0;
    bettingSlips = 0;
    yaw = Math.PI;   // face inward (south toward arena)
    pitch = 0;
    onGround = true;
    humanShieldActivated = false;
    collectingEvidence = null;
    collectTimer = 0;
    shootTimer = 0;
    requestPointerLock();
  }

  // ── RESET ─────────────────────────────────────────────────────────────────────
  function reset() {
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }

    if (scene) {
      while (scene.children.length > 0) { scene.remove(scene.children[0]); }
    }

    enemies.length = 0;
    bullets.length = 0;
    evidenceItems.length = 0;
    slipItems.length = 0;
    crowdPeople.length = 0;
    collidables.length = 0;
    donRizzuto = null;
    collectingEvidence = null;
    humanShieldActivated = false;
    active = false;
    gameOver = false;
    won = false;
    shootTimer = 0;
    collectTimer = 0;
    playerHP = 100;
    score = 0;
    evidenceCollected = 0;
    bettingSlips = 0;
    playerPos.x = 0; playerPos.y = 1.7; playerPos.z = 40;
    playerVel.x = 0; playerVel.y = 0; playerVel.z = 0;
    onGround = true;
    yaw = Math.PI;
    pitch = 0;

    buildScene();
    loop();
  }

  // ── RESIZE ────────────────────────────────────────────────────────────────────
  function onResize() {
    if (!renderer || !camera) return;
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  // external tick hook (no-op — game drives its own RAF loop)
  function update() {}

  return { init: init, update: update, reset: reset };

}());
