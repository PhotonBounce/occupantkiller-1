window.SwampVillage = (function () {
  'use strict';

  // ── State variables ─────────────────────────────────────────────────────────
  var active = false;
  var scene_ = null;
  var camera_ = null;
  var objects = [];
  var enemies = [];
  var fireflies = [];
  var labGroup = null;
  var labDestroyed = false;
  var fuseActive = false;
  var fuseTimer = 0;
  var cultMembersRemaining = 4;
  var time = 0;
  var hudDiv = null;
  var labStatusEl = null;
  var cultCountEl = null;
  var fuseEl = null;
  var notifEl = null;
  var sKeyTime = 0;
  var originalFog = null;
  var labCollapseActive = false;
  var labCollapseTimer = 0;
  var boundOnKeyDown = null;

  // ── Material helper ──────────────────────────────────────────────────────────
  function createMaterial(color, opts) {
    var params = { color: color };
    if (opts) {
      if (opts.emissive !== undefined) params.emissive = opts.emissive;
      if (opts.emissiveIntensity !== undefined) params.emissiveIntensity = opts.emissiveIntensity;
      if (opts.transparent !== undefined) params.transparent = opts.transparent;
      if (opts.opacity !== undefined) params.opacity = opts.opacity;
    }
    return new THREE.MeshLambertMaterial(params);
  }

  // ── Stilted house ────────────────────────────────────────────────────────────
  function createStiltedHouse(x, z) {
    var group = new THREE.Group();
    var poleMat = createMaterial(0x5c3d1e);
    var poleGeo, pole;
    var polePositions = [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]];
    var i;
    for (i = 0; i < polePositions.length; i++) {
      poleGeo = new THREE.CylinderGeometry(0.1, 0.12, 4, 6);
      pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(polePositions[i][0], 0, polePositions[i][1]);
      group.add(pole);
    }
    var platformGeo = new THREE.BoxGeometry(3.2, 0.2, 3.2);
    var platformMat = createMaterial(0x6b4a2a);
    var platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = 2.1;
    group.add(platform);
    var wallMat = createMaterial(0x7a5533);
    var wallGeo = new THREE.BoxGeometry(3.0, 1.8, 0.15);
    var wallF = new THREE.Mesh(wallGeo, wallMat);
    wallF.position.set(0, 3.1, -1.5);
    group.add(wallF);
    var wallB = new THREE.Mesh(wallGeo, wallMat);
    wallB.position.set(0, 3.1, 1.5);
    group.add(wallB);
    var wallGeo2 = new THREE.BoxGeometry(0.15, 1.8, 3.0);
    var wallL = new THREE.Mesh(wallGeo2, wallMat);
    wallL.position.set(-1.5, 3.1, 0);
    group.add(wallL);
    var wallR = new THREE.Mesh(wallGeo2, wallMat);
    wallR.position.set(1.5, 3.1, 0);
    group.add(wallR);
    var roofGeo = new THREE.BoxGeometry(3.6, 0.25, 3.6);
    var roofMat = createMaterial(0x4a2e10);
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 4.1;
    group.add(roof);
    var ridgeGeo = new THREE.BoxGeometry(3.6, 0.6, 0.2);
    var ridge = new THREE.Mesh(ridgeGeo, roofMat);
    ridge.position.y = 4.45;
    group.add(ridge);
    group.position.set(x, 0, z);
    return group;
  }

  // ── Boardwalk bridge ─────────────────────────────────────────────────────────
  function createBridge(x1, z1, x2, z2) {
    var group = new THREE.Group();
    var dx = x2 - x1;
    var dz = z2 - z1;
    var len = Math.sqrt(dx * dx + dz * dz);
    var angle = Math.atan2(dx, dz);
    var plankMat = createMaterial(0x6b4a2a);
    var plankCount = Math.floor(len / 0.55);
    var i, plank;
    for (i = 0; i < plankCount; i++) {
      var plankGeo = new THREE.BoxGeometry(1.1, 0.1, 0.45);
      plank = new THREE.Mesh(plankGeo, plankMat);
      var t = (i + 0.5) / plankCount;
      plank.position.set(x1 + dx * t, 2.2, z1 + dz * t);
      plank.rotation.y = angle;
      group.add(plank);
    }
    var railMat = new THREE.LineBasicMaterial({ color: 0x3d2b10 });
    var pts = [];
    var j;
    for (j = 0; j <= plankCount; j++) {
      var tt = j / plankCount;
      pts.push(new THREE.Vector3(x1 + dx * tt, 2.55, z1 + dz * tt));
    }
    var railGeo = new THREE.BufferGeometry().setFromPoints(pts);
    var railL = new THREE.Line(railGeo, railMat);
    group.add(railL);
    var pts2 = [];
    var k;
    for (k = 0; k <= plankCount; k++) {
      var ttt = k / plankCount;
      var perp = new THREE.Vector3(-dz / len, 0, dx / len).multiplyScalar(0.5);
      pts2.push(new THREE.Vector3(x1 + dx * ttt + perp.x, 2.55, z1 + dz * ttt + perp.z));
    }
    var railGeo2 = new THREE.BufferGeometry().setFromPoints(pts2);
    var railR = new THREE.Line(railGeo2, railMat);
    group.add(railR);
    var edgeGeo = new THREE.BoxGeometry(len, 0.08, 1.15);
    var edgeMesh = new THREE.Mesh(edgeGeo, createMaterial(0x3d2b10));
    edgeMesh.position.set((x1 + x2) / 2, 2.16, (z1 + z2) / 2);
    edgeMesh.rotation.y = angle;
    group.add(edgeMesh);
    return group;
  }

  // ── Cypress tree ─────────────────────────────────────────────────────────────
  function createCypressTree(x, z) {
    var group = new THREE.Group();
    var trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 5.5, 7);
    var trunkMat = createMaterial(0x3d2510);
    var trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2.75;
    group.add(trunk);
    var foliageMat = createMaterial(0x2d5a1b);
    var foliageData = [
      [0, 4.5, 0, 1.8],
      [0.4, 3.5, 0.3, 1.4],
      [-0.3, 3.8, -0.4, 1.2],
      [0.2, 5.5, -0.2, 1.3],
      [-0.4, 5.0, 0.3, 1.0],
      [0, 6.2, 0, 0.9]
    ];
    var fi;
    for (fi = 0; fi < foliageData.length; fi++) {
      var fd = foliageData[fi];
      var blobGeo = new THREE.SphereGeometry(fd[3], 6, 5);
      var blob = new THREE.Mesh(blobGeo, foliageMat);
      blob.position.set(fd[0], fd[1], fd[2]);
      group.add(blob);
    }
    group.position.set(x, 0, z);
    return group;
  }

  // ── Voodoo totem ─────────────────────────────────────────────────────────────
  function createVoodooTotem(x, z) {
    var group = new THREE.Group();
    var woodMat = createMaterial(0x3a2210);
    var darkMat = createMaterial(0x1a0d05);
    var sizes = [0.5, 0.4, 0.35, 0.3, 0.28];
    var heights = [0.6, 0.5, 0.45, 0.4, 0.38];
    var yPos = 0.3;
    var ti;
    for (ti = 0; ti < sizes.length; ti++) {
      var blockGeo = new THREE.BoxGeometry(sizes[ti], heights[ti], sizes[ti]);
      var block = new THREE.Mesh(blockGeo, ti % 2 === 0 ? woodMat : darkMat);
      block.position.y = yPos + heights[ti] / 2;
      group.add(block);
      yPos += heights[ti];
    }
    var hornMat = createMaterial(0x8b7355);
    var hornPositions = [[-0.2, 1.2, 0], [0.2, 1.2, 0], [0, 2.0, -0.2], [0, 2.0, 0.2]];
    var hi;
    for (hi = 0; hi < hornPositions.length; hi++) {
      var hornGeo = new THREE.ConeGeometry(0.06, 0.35, 5);
      var horn = new THREE.Mesh(hornGeo, hornMat);
      horn.position.set(hornPositions[hi][0], hornPositions[hi][1], hornPositions[hi][2]);
      horn.rotation.z = (hi % 2 === 0 ? 1 : -1) * Math.PI / 3;
      group.add(horn);
    }
    group.position.set(x, 0, z);
    return group;
  }

  // ── Drug lab ─────────────────────────────────────────────────────────────────
  function createDrugLab(x, z) {
    var group = new THREE.Group();
    var baseMat = createMaterial(0x4a5040);
    var baseGeo = new THREE.BoxGeometry(5, 3, 4);
    var base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 1.5;
    group.add(base);
    var roofGeo = new THREE.BoxGeometry(5.4, 0.3, 4.4);
    var roofMat = createMaterial(0x3a3f30);
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 3.15;
    group.add(roof);
    var pipeMat = createMaterial(0x5a5a50);
    var pipePositions = [[-1, 0, 0.5], [0.5, 0, -0.5], [1.5, 0, 0]];
    var pi2;
    for (pi2 = 0; pi2 < pipePositions.length; pi2++) {
      var pipeGeo = new THREE.CylinderGeometry(0.18, 0.2, 1.4, 7);
      var pipe = new THREE.Mesh(pipeGeo, pipeMat);
      pipe.position.set(pipePositions[pi2][0], 4.05, pipePositions[pi2][2]);
      group.add(pipe);
    }
    var doorGeo = new THREE.BoxGeometry(0.8, 1.6, 0.12);
    var doorMat = createMaterial(0x2a1a08);
    var door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0.8, -2.06);
    group.add(door);
    var signMat = createMaterial(0x8b0000);
    var signGeo = new THREE.BoxGeometry(1.5, 0.4, 0.08);
    var sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 2.2, -2.06);
    group.add(sign);
    var poleMat = createMaterial(0x5c3d1e);
    var labPolePositions = [[-2.2, -1.8], [2.2, -1.8], [-2.2, 1.8], [2.2, 1.8]];
    var lpi;
    for (lpi = 0; lpi < labPolePositions.length; lpi++) {
      var labPoleGeo = new THREE.CylinderGeometry(0.12, 0.14, 4, 6);
      var labPole = new THREE.Mesh(labPoleGeo, poleMat);
      labPole.position.set(labPolePositions[lpi][0], 0, labPolePositions[lpi][1]);
      group.add(labPole);
    }
    var labPlatGeo = new THREE.BoxGeometry(5.4, 0.2, 4.4);
    var labPlatMat = createMaterial(0x4a3520);
    var labPlat = new THREE.Mesh(labPlatGeo, labPlatMat);
    labPlat.position.y = 2.1;
    group.add(labPlat);
    group.position.set(x, -2.1, z);
    return group;
  }

  // ── Pirogue boat ─────────────────────────────────────────────────────────────
  function createPirogue(x, z) {
    var group = new THREE.Group();
    var hullMat = createMaterial(0x5c3010);
    var hullGeo = new THREE.BoxGeometry(3.0, 0.3, 0.8);
    var hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 0.05;
    group.add(hull);
    var bowGeo = new THREE.BoxGeometry(0.5, 0.25, 0.6);
    var bow = new THREE.Mesh(bowGeo, hullMat);
    bow.position.set(1.6, 0.05, 0);
    bow.rotation.z = -0.3;
    group.add(bow);
    var sternGeo = new THREE.BoxGeometry(0.5, 0.25, 0.6);
    var stern = new THREE.Mesh(sternGeo, hullMat);
    stern.position.set(-1.6, 0.05, 0);
    stern.rotation.z = 0.3;
    group.add(stern);
    group.position.set(x, 0.1, z);
    return group;
  }

  // ── Enemy ────────────────────────────────────────────────────────────────────
  function createEnemy(x, z, waypoints) {
    var group = new THREE.Group();
    var bodyMat = createMaterial(0x2a1a00);
    var bodyGeo = new THREE.BoxGeometry(0.5, 0.7, 0.3);
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.35;
    group.add(body);
    var headMat = createMaterial(0x8b6914);
    var headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.88;
    group.add(head);
    var hatMat = createMaterial(0x1a0a00);
    var hatGeo = new THREE.ConeGeometry(0.22, 0.55, 8);
    var hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 1.32;
    group.add(hat);
    var armMat = createMaterial(0x2a1a00);
    var armGeo = new THREE.BoxGeometry(0.15, 0.55, 0.15);
    var armL = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-0.33, 0.42, 0);
    armL.rotation.z = 0.25;
    group.add(armL);
    var armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(0.33, 0.42, 0);
    armR.rotation.z = -0.25;
    group.add(armR);
    group.position.set(x, 2.3, z);
    var enemy = {
      group: group,
      health: 100,
      alive: true,
      waypoints: waypoints,
      waypointIndex: 0,
      speed: 1.2 + Math.random() * 0.6
    };
    return enemy;
  }

  // ── Fireflies ────────────────────────────────────────────────────────────────
  function createFireflies() {
    var ffMat = createMaterial(0xffff44, { emissive: 0xaaaa00, emissiveIntensity: 1.0 });
    var count = 24;
    var i;
    for (i = 0; i < count; i++) {
      var ffGeo = new THREE.SphereGeometry(0.06, 4, 3);
      var ff = new THREE.Mesh(ffGeo, ffMat);
      var cx = (Math.random() - 0.5) * 36;
      var cz = (Math.random() - 0.5) * 36;
      var cy = 1.5 + Math.random() * 2.5;
      var radius = 1.5 + Math.random() * 3.0;
      var speed = 0.4 + Math.random() * 0.8;
      var phase = Math.random() * Math.PI * 2;
      ff.userData = { cx: cx, cz: cz, cy: cy, radius: radius, speed: speed, phase: phase };
      ff.position.set(cx + Math.sin(phase) * radius, cy, cz + Math.cos(phase) * radius);
      scene_.add(ff);
      objects.push(ff);
      fireflies.push(ff);
    }
  }

  // ── HUD ──────────────────────────────────────────────────────────────────────
  function createHUD() {
    hudDiv = document.createElement('div');
    hudDiv.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:12px',
      'background:rgba(0,10,0,0.75)',
      'color:#7fff44',
      'font-family:monospace',
      'font-size:13px',
      'padding:10px 16px',
      'border:1px solid #3a6600',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:9999',
      'line-height:1.7'
    ].join(';');
    labStatusEl = document.createElement('div');
    labStatusEl.innerHTML = 'LAB STATUS: <span style="color:#ff4444">OPERATIONAL</span>';
    hudDiv.appendChild(labStatusEl);
    cultCountEl = document.createElement('div');
    cultCountEl.textContent = 'CULT MEMBERS: ' + cultMembersRemaining + ' remaining';
    hudDiv.appendChild(cultCountEl);
    fuseEl = document.createElement('div');
    fuseEl.style.cssText = 'display:none;color:#ffaa00;font-weight:bold';
    fuseEl.textContent = 'DETONATION IN: 5s';
    hudDiv.appendChild(fuseEl);
    notifEl = document.createElement('div');
    notifEl.style.cssText = 'color:#ffff44;font-weight:bold;margin-top:4px';
    notifEl.textContent = '';
    hudDiv.appendChild(notifEl);
    document.body.appendChild(hudDiv);
  }

  function updateHUD() {
    if (!hudDiv) return;
    if (labDestroyed) {
      labStatusEl.innerHTML = 'LAB STATUS: <span style="color:#7fff44">DESTROYED</span>';
    } else {
      labStatusEl.innerHTML = 'LAB STATUS: <span style="color:#ff4444">OPERATIONAL</span>';
    }
    cultCountEl.textContent = 'CULT MEMBERS: ' + cultMembersRemaining + ' remaining';
    if (fuseActive) {
      fuseEl.style.display = 'block';
      fuseEl.textContent = 'DETONATION IN: ' + Math.ceil(fuseTimer) + 's';
    } else {
      fuseEl.style.display = 'none';
    }
  }

  function showNotification(msg, duration) {
    if (!notifEl) return;
    notifEl.textContent = msg;
    if (duration === undefined) duration = 3000;
    setTimeout(function () {
      if (notifEl) notifEl.textContent = '';
    }, duration);
  }

  // ── Key handler ──────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    if (e.code === 'KeyS') {
      sKeyTime = Date.now();
    } else if (e.code === 'KeyV') {
      if (Date.now() - sKeyTime <= 400) {
        toggleModule();
      }
    } else if (e.code === 'KeyE') {
      if (!active) return;
      if (labDestroyed || fuseActive) return;
      if (!camera_ || !labGroup) return;
      var lp = new THREE.Vector3();
      labGroup.getWorldPosition(lp);
      var dist = camera_.position.distanceTo(lp);
      if (dist <= 8) {
        fuseActive = true;
        fuseTimer = 5.0;
        fuseEl.style.display = 'block';
        showNotification('FUSE LIT — GET CLEAR!', 5000);
      } else {
        showNotification('GET CLOSER TO THE LAB (press E)', 2500);
      }
    }
  }

  // ── Toggle ───────────────────────────────────────────────────────────────────
  function toggleModule() {
    if (!active) {
      active = true;
      init(scene_, camera_);
      showGlobalNotif('SWAMP VILLAGE ACTIVATED');
    } else {
      showGlobalNotif('SWAMP VILLAGE DEACTIVATED');
      reset();
    }
  }

  function showGlobalNotif(msg) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,10,0,0.85)',
      'color:#7fff44',
      'font-family:monospace',
      'font-size:22px',
      'padding:18px 32px',
      'border:2px solid #3a6600',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:99999'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2500);
  }

  // ── init ─────────────────────────────────────────────────────────────────────
  function init(scene, camera) {
    scene_ = scene;
    camera_ = camera;
    objects = [];
    enemies = [];
    fireflies = [];
    labGroup = null;
    labDestroyed = false;
    fuseActive = false;
    fuseTimer = 0;
    labCollapseActive = false;
    labCollapseTimer = 0;
    cultMembersRemaining = 4;
    time = 0;

    originalFog = scene_.fog || null;
    scene_.fog = new THREE.Fog(0x1a2a00, 3, 35);

    // Ambient + directional lights
    var ambient = new THREE.AmbientLight(0x223311, 0.6);
    scene_.add(ambient);
    objects.push(ambient);

    var dirLight = new THREE.DirectionalLight(0x44aa22, 0.8);
    dirLight.position.set(5, 12, 8);
    scene_.add(dirLight);
    objects.push(dirLight);

    var moonLight = new THREE.DirectionalLight(0x2244aa, 0.3);
    moonLight.position.set(-8, 10, -5);
    scene_.add(moonLight);
    objects.push(moonLight);

    // Swamp water plane
    var waterGeo = new THREE.BoxGeometry(80, 0.15, 80);
    var waterMat = createMaterial(0x1a3a1a, { transparent: true, opacity: 0.88 });
    var water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(0, -0.08, 0);
    scene_.add(water);
    objects.push(water);

    // Mud/ground patches
    var mudGeo = new THREE.BoxGeometry(80, 0.05, 80);
    var mudMat = createMaterial(0x0d1a0d);
    var mud = new THREE.Mesh(mudGeo, mudMat);
    mud.position.set(0, -0.12, 0);
    scene_.add(mud);
    objects.push(mud);

    // Stilted houses
    var house1 = createStiltedHouse(-8, -6);
    scene_.add(house1);
    objects.push(house1);

    var house2 = createStiltedHouse(5, -10);
    scene_.add(house2);
    objects.push(house2);

    var house3 = createStiltedHouse(-3, 8);
    scene_.add(house3);
    objects.push(house3);

    var house4 = createStiltedHouse(10, 4);
    scene_.add(house4);
    objects.push(house4);

    // Bridges
    var bridge1 = createBridge(-8, -6, 5, -10);
    scene_.add(bridge1);
    objects.push(bridge1);

    var bridge2 = createBridge(5, -10, 10, 4);
    scene_.add(bridge2);
    objects.push(bridge2);

    var bridge3 = createBridge(-3, 8, 10, 4);
    scene_.add(bridge3);
    objects.push(bridge3);

    // Cypress trees
    var tree1 = createCypressTree(-14, -3);
    scene_.add(tree1);
    objects.push(tree1);

    var tree2 = createCypressTree(14, -8);
    scene_.add(tree2);
    objects.push(tree2);

    var tree3 = createCypressTree(-10, 12);
    scene_.add(tree3);
    objects.push(tree3);

    var tree4 = createCypressTree(8, -16);
    scene_.add(tree4);
    objects.push(tree4);

    var tree5 = createCypressTree(-18, 6);
    scene_.add(tree5);
    objects.push(tree5);

    var tree6 = createCypressTree(18, 10);
    scene_.add(tree6);
    objects.push(tree6);

    // Voodoo totems
    var totem1 = createVoodooTotem(-6, -9);
    scene_.add(totem1);
    objects.push(totem1);

    var totem2 = createVoodooTotem(7, 1);
    scene_.add(totem2);
    objects.push(totem2);

    var totem3 = createVoodooTotem(-11, 4);
    scene_.add(totem3);
    objects.push(totem3);

    // Pirogue boat
    var pirogue = createPirogue(-13, -9);
    pirogue.rotation.y = 0.4;
    scene_.add(pirogue);
    objects.push(pirogue);

    // Drug lab
    labGroup = createDrugLab(0, -18);
    scene_.add(labGroup);
    objects.push(labGroup);

    // Enemies
    var enemyData = [
      { x: -6, z: -8, wp: [new THREE.Vector3(-6, 2.3, -8), new THREE.Vector3(-10, 2.3, -5), new THREE.Vector3(-8, 2.3, -11)] },
      { x: 6, z: -10, wp: [new THREE.Vector3(6, 2.3, -10), new THREE.Vector3(9, 2.3, -7), new THREE.Vector3(4, 2.3, -13)] },
      { x: -2, z: 9, wp: [new THREE.Vector3(-2, 2.3, 9), new THREE.Vector3(2, 2.3, 11), new THREE.Vector3(-4, 2.3, 6)] },
      { x: 11, z: 3, wp: [new THREE.Vector3(11, 2.3, 3), new THREE.Vector3(8, 2.3, 6), new THREE.Vector3(13, 2.3, 0)] }
    ];
    var ei;
    for (ei = 0; ei < enemyData.length; ei++) {
      var ed = enemyData[ei];
      var enemy = createEnemy(ed.x, ed.z, ed.wp);
      scene_.add(enemy.group);
      objects.push(enemy.group);
      enemies.push(enemy);
    }

    // Fireflies
    createFireflies();

    // HUD
    createHUD();
    showNotification('FIND AND DESTROY THE DRUG LAB [E KEY]', 4000);

    // Event listener
    boundOnKeyDown = onKeyDown;
    window.addEventListener('keydown', boundOnKeyDown);
  }

  // ── update ───────────────────────────────────────────────────────────────────
  function update(delta) {
    if (!active) return;
    time += delta;

    // Firefly animation
    var fi;
    for (fi = 0; fi < fireflies.length; fi++) {
      var ff = fireflies[fi];
      var ud = ff.userData;
      ff.position.x = ud.cx + Math.sin(time * ud.speed + ud.phase) * ud.radius;
      ff.position.z = ud.cz + Math.cos(time * ud.speed + ud.phase * 0.7) * ud.radius;
      ff.position.y = ud.cy + Math.sin(time * ud.speed * 0.5 + ud.phase) * 0.5;
    }

    // Enemy patrol AI
    var ei2;
    for (ei2 = 0; ei2 < enemies.length; ei2++) {
      var en = enemies[ei2];
      if (!en.alive || labDestroyed) continue;
      var wp = en.waypoints[en.waypointIndex];
      var pos = en.group.position;
      var dx = wp.x - pos.x;
      var dz = wp.z - pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 0.3) {
        en.waypointIndex = (en.waypointIndex + 1) % en.waypoints.length;
      } else {
        var moveX = (dx / dist) * en.speed * delta;
        var moveZ = (dz / dist) * en.speed * delta;
        en.group.position.x += moveX;
        en.group.position.z += moveZ;
        en.group.rotation.y = Math.atan2(dx, dz);
      }
    }

    // Fuse countdown
    if (fuseActive && !labDestroyed) {
      fuseTimer -= delta;
      updateHUD();
      if (fuseTimer <= 0) {
        fuseActive = false;
        labDestroyed = true;
        labCollapseActive = true;
        labCollapseTimer = 1.0;
        showNotification('DRUG LAB DESTROYED! MISSION COMPLETE!', 6000);
        updateHUD();
      }
    }

    // Lab collapse animation
    if (labCollapseActive && labGroup) {
      labCollapseTimer -= delta;
      var progress = 1.0 - Math.max(0, labCollapseTimer);
      var scaleY = Math.max(0.05, 1.0 - progress * 0.95);
      labGroup.scale.y = scaleY;
      labGroup.position.y = -2.1 - progress * 2.5;
      if (labCollapseTimer <= 0) {
        labCollapseActive = false;
      }
    }

    // Check if all enemies killed (simulated: after lab destroyed, demoralize)
    if (labDestroyed && cultMembersRemaining > 0) {
      cultMembersRemaining = 0;
      updateHUD();
    }
  }

  // ── reset ────────────────────────────────────────────────────────────────────
  function reset() {
    active = false;

    // Remove all scene objects
    var i;
    if (scene_) {
      for (i = 0; i < objects.length; i++) {
        scene_.remove(objects[i]);
      }
      scene_.fog = originalFog;
    }
    objects = [];
    enemies = [];
    fireflies = [];
    labGroup = null;

    // Remove HUD
    if (hudDiv && hudDiv.parentNode) {
      hudDiv.parentNode.removeChild(hudDiv);
    }
    hudDiv = null;
    labStatusEl = null;
    cultCountEl = null;
    fuseEl = null;
    notifEl = null;

    // Remove event listener
    if (boundOnKeyDown) {
      window.removeEventListener('keydown', boundOnKeyDown);
      boundOnKeyDown = null;
    }

    // Reset state
    labDestroyed = false;
    fuseActive = false;
    fuseTimer = 0;
    labCollapseActive = false;
    labCollapseTimer = 0;
    cultMembersRemaining = 4;
    time = 0;
    originalFog = null;
    sKeyTime = 0;
  }

  // ── Bootstrap toggle listener (always live) ───────────────────────────────
  window.addEventListener('keydown', function (e) {
    if (e.code === 'KeyS') {
      sKeyTime = Date.now();
    } else if (e.code === 'KeyV') {
      if (Date.now() - sKeyTime <= 400) {
        if (!active) {
          active = true;
          if (scene_ && camera_) {
            init(scene_, camera_);
          }
          showGlobalNotif('SWAMP VILLAGE ACTIVATED');
        } else {
          showGlobalNotif('SWAMP VILLAGE DEACTIVATED');
          reset();
        }
      }
    }
  });

  return { init: init, update: update, reset: reset };
}());
