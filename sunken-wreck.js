window.SunkenWreck = (function () {
  'use strict';

  // ── activation: S then W within 400ms ────────────────────────────────────
  var ACT_KEY_S = 83;
  var ACT_KEY_W = 87;
  var ACT_WINDOW = 400;

  // ── module state ──────────────────────────────────────────────────────────
  var scene, camera;
  var active = false;
  var animFrameId = null;
  var lastTime = 0;
  var sceneObjects = [];

  // player
  var playerPos = { x: 0, y: 2, z: 40 };
  var playerHP = 100;
  var mouseX = 0;
  var mouseY = 0;
  var keysDown = {};

  // objectives
  var documentsRecovered = 0;
  var TOTAL_DOCUMENTS = 3;
  var documentMeshes = [];
  var documentPickedUp = [];

  // enemies
  var enemies = [];
  var TOTAL_ENEMIES = 6;

  // bullets / projectiles
  var bullets = [];

  // fish particles
  var fishParticles = [];

  // scene node lists
  var bubbles = [];

  // HUD
  var hudEl = null;
  var hintEl = null;
  var notifEl = null;
  var notifTimer = 0;

  // save / restore fog + bg when we overlay
  var savedFog = null;
  var savedBackground = null;
  var usingExternalScene = false;

  // activation timing
  var _sTime = null;
  var _wTime = null;

  // click + mouse handlers
  var _onKeyDown = null;
  var _onKeyUp = null;
  var _onMouseMove = null;
  var _onClick = null;

  // internal renderer (null when using external scene)
  var ownRenderer = null;

  // game flags
  var gameOver = false;
  var gameWon = false;

  // ── helpers ───────────────────────────────────────────────────────────────
  function dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function addObj(mesh) {
    scene.add(mesh);
    sceneObjects.push(mesh);
    return mesh;
  }

  function mat(color, extra) {
    var cfg = { color: color };
    if (extra) {
      if (extra.transparent !== undefined) cfg.transparent = extra.transparent;
      if (extra.opacity !== undefined) cfg.opacity = extra.opacity;
      if (extra.wireframe !== undefined) cfg.wireframe = extra.wireframe;
    }
    return new THREE.MeshLambertMaterial(cfg);
  }

  // ── scene fog & lighting ──────────────────────────────────────────────────
  function setupScene() {
    savedFog = scene.fog;
    savedBackground = scene.background;

    scene.fog = new THREE.FogExp2(0x004455, 0.045);
    scene.background = new THREE.Color(0x001a22);

    var ambient = new THREE.AmbientLight(0x003344, 0.5);
    addObj(ambient);

    var keyLight = new THREE.PointLight(0x0066aa, 1.2, 80);
    keyLight.position.set(0, 8, 0);
    addObj(keyLight);

    var floorLight = new THREE.PointLight(0x002233, 0.8, 50);
    floorLight.position.set(0, -25, 0);
    addObj(floorLight);

    var hullLight = new THREE.PointLight(0x004466, 1.0, 40);
    hullLight.position.set(-5, -8, -5);
    addObj(hullLight);
  }

  // ── ocean floor ───────────────────────────────────────────────────────────
  function buildFloor() {
    var geo = new THREE.BoxGeometry(220, 1.5, 220);
    var mesh = new THREE.Mesh(geo, mat(0x0a1510));
    mesh.position.set(0, -28, 0);
    addObj(mesh);
  }

  // ── ship hull wreck (large box, tilted) ──────────────────────────────────
  function buildShipHull() {
    // main hull
    var hullGeo = new THREE.BoxGeometry(70, 12, 22);
    var hull = new THREE.Mesh(hullGeo, mat(0x2a3a2a));
    hull.position.set(0, -16, 0);
    hull.rotation.z = 0.13;
    hull.rotation.y = 0.08;
    addObj(hull);

    // bow
    var bowGeo = new THREE.BoxGeometry(12, 9, 18);
    var bow = new THREE.Mesh(bowGeo, mat(0x253525));
    bow.position.set(36, -17, 0);
    bow.rotation.z = 0.22;
    addObj(bow);

    // stern
    var sternGeo = new THREE.BoxGeometry(14, 9, 18);
    var stern = new THREE.Mesh(sternGeo, mat(0x253525));
    stern.position.set(-36, -18, 0);
    stern.rotation.z = -0.07;
    addObj(stern);

    // superstructure / bridge
    var superGeo = new THREE.BoxGeometry(18, 7, 12);
    var superMesh = new THREE.Mesh(superGeo, mat(0x1e2e1e));
    superMesh.position.set(-6, -6, 0);
    addObj(superMesh);

    // funnel
    var funnelGeo = new THREE.CylinderGeometry(1.0, 1.4, 6, 8);
    var funnel = new THREE.Mesh(funnelGeo, mat(0x1a2a1a));
    funnel.position.set(-4, -1.5, 0);
    addObj(funnel);

    // deck boards (flat box)
    var deckGeo = new THREE.BoxGeometry(60, 0.5, 18);
    var deck = new THREE.Mesh(deckGeo, mat(0x182818));
    deck.position.set(0, -10.2, 0);
    deck.rotation.z = 0.13;
    addObj(deck);
  }

  // ── coral on hull (stacked ConeGeometry) ─────────────────────────────────
  function buildCoral() {
    var coralPositions = [
      { x: 20, y: -22, z: 9 },
      { x: 24, y: -23, z: -7 },
      { x: -22, y: -23, z: 8 },
      { x: -26, y: -22, z: -6 },
      { x: 10, y: -23, z: 11 },
      { x: -4, y: -24, z: -10 },
      { x: 32, y: -24, z: 4 },
      { x: -32, y: -23, z: -4 }
    ];

    var colors = [0x224422, 0x3a5a2a, 0x1a4a3a, 0x2a3a1a, 0x155a35, 0x304520];

    for (var i = 0; i < coralPositions.length; i++) {
      var cp = coralPositions[i];
      var clusterCount = 3 + Math.floor(Math.random() * 3);
      for (var j = 0; j < clusterCount; j++) {
        var height = 1.2 + Math.random() * 2.5;
        var cGeo = new THREE.ConeGeometry(0.3 + Math.random() * 0.4, height, 5 + j);
        var color = colors[Math.floor(Math.random() * colors.length)];
        var cMesh = new THREE.Mesh(cGeo, mat(color));
        cMesh.position.set(
          cp.x + (Math.random() - 0.5) * 3.5,
          cp.y + height * 0.5,
          cp.z + (Math.random() - 0.5) * 3.5
        );
        cMesh.rotation.z = (Math.random() - 0.5) * 0.3;
        cMesh.rotation.x = (Math.random() - 0.5) * 0.2;
        addObj(cMesh);

        // stacked second cone on top for layered look
        if (j % 2 === 0) {
          var h2 = height * 0.6;
          var c2Geo = new THREE.ConeGeometry(0.2 + Math.random() * 0.25, h2, 5);
          var c2 = new THREE.Mesh(c2Geo, mat(colors[(Math.floor(Math.random() * colors.length))]));
          c2.position.set(
            cp.x + (Math.random() - 0.5) * 2,
            cp.y + height + h2 * 0.3,
            cp.z + (Math.random() - 0.5) * 2
          );
          addObj(c2);
        }
      }
    }
  }

  // ── ship cannons (cylinders) ──────────────────────────────────────────────
  function buildCannons() {
    var cannonPositions = [
      { x: 15, y: -10, z: 10, ry: 0.3 },
      { x: 5,  y: -10, z: 10, ry: 0.1 },
      { x: -10, y: -10, z: 10, ry: -0.2 },
      { x: 15,  y: -10, z: -10, ry: -0.3 },
      { x: 5,   y: -10, z: -10, ry: -0.1 },
      { x: -8,  y: -10, z: -10, ry: 0.2 }
    ];

    for (var i = 0; i < cannonPositions.length; i++) {
      var cp = cannonPositions[i];

      // barrel – horizontal cylinder
      var barrelGeo = new THREE.CylinderGeometry(0.35, 0.45, 4.5, 8);
      var barrel = new THREE.Mesh(barrelGeo, mat(0x334433));
      barrel.rotation.z = Math.PI / 2;
      barrel.rotation.y = cp.ry;
      barrel.position.set(cp.x, cp.y, cp.z);
      addObj(barrel);

      // breech / base – wider cylinder
      var breechGeo = new THREE.CylinderGeometry(0.6, 0.7, 1.2, 8);
      var breech = new THREE.Mesh(breechGeo, mat(0x2a3a2a));
      breech.rotation.z = Math.PI / 2;
      breech.rotation.y = cp.ry;
      breech.position.set(cp.x - Math.sin(cp.ry) * 1.5, cp.y, cp.z - Math.cos(cp.ry) * 1.5);
      addObj(breech);

      // carriage / mount (box)
      var mountGeo = new THREE.BoxGeometry(1.2, 0.8, 1.0);
      var mount = new THREE.Mesh(mountGeo, mat(0x1a2a1a));
      mount.position.set(cp.x, cp.y - 0.7, cp.z);
      addObj(mount);
    }
  }

  // ── porthole windows (LineSegments circles) ───────────────────────────────
  function buildPortholes() {
    var portholePositions = [
      { x: -12, y: -12, z: 11.2, side: 1 },
      { x: -4,  y: -12, z: 11.2, side: 1 },
      { x:  4,  y: -12, z: 11.2, side: 1 },
      { x:  12, y: -12, z: 11.2, side: 1 },
      { x: -12, y: -12, z: -11.2, side: -1 },
      { x: -4,  y: -12, z: -11.2, side: -1 },
      { x:  4,  y: -12, z: -11.2, side: -1 },
      { x:  12, y: -12, z: -11.2, side: -1 }
    ];

    var segments = 16;
    for (var i = 0; i < portholePositions.length; i++) {
      var pp = portholePositions[i];
      var points = [];
      for (var s = 0; s <= segments; s++) {
        var ang = (s / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(ang) * 0.7, Math.sin(ang) * 0.7, 0));
      }
      var geo = new THREE.BufferGeometry().setFromPoints(points);
      var lineMesh = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x445544 }));
      lineMesh.position.set(pp.x, pp.y, pp.z);
      addObj(lineMesh);

      // inner ring
      var points2 = [];
      for (var s2 = 0; s2 <= segments; s2++) {
        var ang2 = (s2 / segments) * Math.PI * 2;
        points2.push(new THREE.Vector3(Math.cos(ang2) * 0.5, Math.sin(ang2) * 0.5, 0));
      }
      var geo2 = new THREE.BufferGeometry().setFromPoints(points2);
      var inner = new THREE.LineSegments(geo2, new THREE.LineBasicMaterial({ color: 0x223322 }));
      inner.position.set(pp.x, pp.y, pp.z);
      addObj(inner);

      // cross spokes
      var spokePoints = [
        new THREE.Vector3(-0.7, 0, 0), new THREE.Vector3(0.7, 0, 0),
        new THREE.Vector3(0, -0.7, 0), new THREE.Vector3(0, 0.7, 0)
      ];
      var spokeGeo = new THREE.BufferGeometry().setFromPoints(spokePoints);
      var spokes = new THREE.LineSegments(spokeGeo, new THREE.LineBasicMaterial({ color: 0x334433 }));
      spokes.position.set(pp.x, pp.y, pp.z);
      addObj(spokes);
    }
  }

  // ── salvage crane (LineSegments + box) ───────────────────────────────────
  function buildSalvageCrane() {
    // crane base platform (box)
    var baseGeo = new THREE.BoxGeometry(5, 1, 5);
    var base = new THREE.Mesh(baseGeo, mat(0x333a33));
    base.position.set(20, 4, -20);
    addObj(base);

    // crane tower (box)
    var towerGeo = new THREE.BoxGeometry(1.5, 18, 1.5);
    var tower = new THREE.Mesh(towerGeo, mat(0x2a3a2a));
    tower.position.set(20, 13, -20);
    addObj(tower);

    // crane arm (box)
    var armGeo = new THREE.BoxGeometry(16, 1, 1);
    var arm = new THREE.Mesh(armGeo, mat(0x2a3a2a));
    arm.position.set(12, 22, -20);
    addObj(arm);

    // crane cable box (winch)
    var winchGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var winch = new THREE.Mesh(winchGeo, mat(0x445544));
    winch.position.set(6, 21.2, -20);
    addObj(winch);

    // structural lines (LineSegments truss)
    var trussPoints = [
      // left brace
      new THREE.Vector3(20, 5, -20), new THREE.Vector3(12, 22, -20),
      // right brace
      new THREE.Vector3(20, 20, -20), new THREE.Vector3(4, 22, -20),
      // diagonal support
      new THREE.Vector3(20, 5, -20), new THREE.Vector3(20, 22, -20),
      // cross brace
      new THREE.Vector3(14, 8, -20), new THREE.Vector3(20, 16, -20),
      new THREE.Vector3(16, 14, -20), new THREE.Vector3(20, 8, -20),
      // cable from arm tip to ground
      new THREE.Vector3(4, 22, -20), new THREE.Vector3(4, -14, -20),
      new THREE.Vector3(8, 22, -20), new THREE.Vector3(8, -10, -20)
    ];
    var trussGeo = new THREE.BufferGeometry().setFromPoints(trussPoints);
    var truss = new THREE.LineSegments(trussGeo, new THREE.LineBasicMaterial({ color: 0x445544 }));
    addObj(truss);

    // crane hook (small sphere)
    var hookGeo = new THREE.SphereGeometry(0.4, 6, 6);
    var hook = new THREE.Mesh(hookGeo, mat(0x556655));
    hook.position.set(4, -14, -20);
    addObj(hook);

    // crane cable lines
    var cablePoints = [
      new THREE.Vector3(4, 22, -20), new THREE.Vector3(4, -14.4, -20)
    ];
    var cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
    var cable = new THREE.LineSegments(cableGeo, new THREE.LineBasicMaterial({ color: 0x334433 }));
    addObj(cable);
  }

  // ── submarine (elongated box + cylinder conning tower) ───────────────────
  function buildSubmarine() {
    // sub body (elongated box)
    var subGeo = new THREE.BoxGeometry(28, 5, 7);
    var sub = new THREE.Mesh(subGeo, mat(0x1a2a1a));
    sub.position.set(-15, 2, -30);
    sub.rotation.y = 0.4;
    addObj(sub);

    // nose cone (smaller box)
    var noseGeo = new THREE.BoxGeometry(5, 4, 5);
    var nose = new THREE.Mesh(noseGeo, mat(0x152215));
    nose.position.set(-28, 2, -33);
    nose.rotation.y = 0.4;
    addObj(nose);

    // conning tower (cylinder)
    var connGeo = new THREE.CylinderGeometry(1.2, 1.5, 5, 8);
    var conn = new THREE.Mesh(connGeo, mat(0x1e2e1e));
    conn.position.set(-13, 5.5, -30);
    conn.rotation.y = 0.4;
    addObj(conn);

    // periscope (thin cylinder)
    var periGeo = new THREE.CylinderGeometry(0.15, 0.15, 4, 6);
    var peri = new THREE.Mesh(periGeo, mat(0x334433));
    peri.position.set(-12.5, 9.5, -30);
    addObj(peri);

    // ballast tanks (side cylinders)
    var btGeo = new THREE.CylinderGeometry(0.6, 0.6, 22, 8);
    var bt1 = new THREE.Mesh(btGeo, mat(0x152215));
    bt1.rotation.z = Math.PI / 2;
    bt1.rotation.y = 0.4;
    bt1.position.set(-15, 0.6, -32.5);
    addObj(bt1);

    var bt2 = new THREE.Mesh(btGeo, mat(0x152215));
    bt2.rotation.z = Math.PI / 2;
    bt2.rotation.y = 0.4;
    bt2.position.set(-15, 0.6, -27.5);
    addObj(bt2);

    // propeller hub (small sphere)
    var propGeo = new THREE.SphereGeometry(1.0, 8, 8);
    var prop = new THREE.Mesh(propGeo, mat(0x334433));
    prop.position.set(-2, 2, -27);
    addObj(prop);

    // prop blades (flat boxes)
    var bladeGeo = new THREE.BoxGeometry(0.2, 2.5, 0.8);
    var blade1 = new THREE.Mesh(bladeGeo, mat(0x2a3a2a));
    blade1.position.set(-2, 2, -27);
    blade1.rotation.z = 0.3;
    addObj(blade1);
    var blade2 = new THREE.Mesh(bladeGeo, mat(0x2a3a2a));
    blade2.position.set(-2, 2, -27);
    blade2.rotation.z = 0.3 + Math.PI / 2;
    addObj(blade2);
  }

  // ── fish particles (small white boxes drifting in lazy arcs) ─────────────
  function buildFishParticles() {
    var fishColors = [0xccdddd, 0xbbcccc, 0xaabbbb, 0xddeedd, 0xcceecc];
    for (var i = 0; i < 40; i++) {
      var fGeo = new THREE.BoxGeometry(0.25, 0.12, 0.45);
      var color = fishColors[Math.floor(Math.random() * fishColors.length)];
      var fMesh = new THREE.Mesh(fGeo, mat(color));
      fMesh.position.set(
        (Math.random() - 0.5) * 80,
        -5 + Math.random() * 20,
        (Math.random() - 0.5) * 80
      );
      fMesh.userData.speed = 1.5 + Math.random() * 2.5;
      fMesh.userData.dir = new THREE.Vector3(
        Math.random() - 0.5,
        (Math.random() - 0.5) * 0.15,
        Math.random() - 0.5
      ).normalize();
      fMesh.userData.arcPhase = Math.random() * Math.PI * 2;
      fMesh.userData.arcSpeed = 0.4 + Math.random() * 0.8;
      fMesh.userData.arcAmp = 0.6 + Math.random() * 1.2;
      fMesh.userData.changeTimer = 1 + Math.random() * 4;
      scene.add(fMesh);
      fishParticles.push(fMesh);
      sceneObjects.push(fMesh);
    }
  }

  // ── bubbles ───────────────────────────────────────────────────────────────
  function buildBubbles() {
    var bMat = new THREE.MeshLambertMaterial({ color: 0x336677, transparent: true, opacity: 0.5 });
    for (var i = 0; i < 25; i++) {
      var bGeo = new THREE.SphereGeometry(0.07 + Math.random() * 0.13, 5, 5);
      var b = new THREE.Mesh(bGeo, bMat);
      b.position.set(
        (Math.random() - 0.5) * 100,
        -28 + Math.random() * 30,
        (Math.random() - 0.5) * 100
      );
      b.userData.speed = 0.5 + Math.random() * 1.2;
      b.userData.wobble = Math.random() * Math.PI * 2;
      scene.add(b);
      bubbles.push(b);
      sceneObjects.push(b);
    }
  }

  // ── classified documents (collectibles) ──────────────────────────────────
  function buildDocuments() {
    var docPositions = [
      { x: -8, y: -4, z: -8 },   // inside superstructure area
      { x: 25, y: -13, z: 5 },   // near bow
      { x: -30, y: -18, z: -3 }  // near stern on ocean floor
    ];

    for (var i = 0; i < docPositions.length; i++) {
      var dp = docPositions[i];

      // Document case (flat gold box)
      var dGeo = new THREE.BoxGeometry(0.8, 0.1, 0.6);
      var dMesh = new THREE.Mesh(dGeo, mat(0x998822));
      dMesh.position.set(dp.x, dp.y, dp.z);
      dMesh.userData.docIndex = i;
      scene.add(dMesh);
      sceneObjects.push(dMesh);
      documentMeshes.push(dMesh);
      documentPickedUp.push(false);

      // glow point
      var glow = new THREE.PointLight(0xaaaa00, 1.0, 6);
      glow.position.set(dp.x, dp.y + 0.5, dp.z);
      scene.add(glow);
      sceneObjects.push(glow);
      dMesh.userData.glowLight = glow;
    }
  }

  // ── salvage diver enemies (dark cylinder + sphere helmet) ─────────────────
  function buildEnemies() {
    var spawnData = [
      { x: 5,   y: -5,  z: 0 },
      { x: -5,  y: -5,  z: 5 },
      { x: 20,  y: -10, z: 8 },
      { x: -20, y: -12, z: -6 },
      { x: 0,   y: -5,  z: -15 },
      { x: 18,  y: -4,  z: -25 }
    ];

    for (var i = 0; i < spawnData.length; i++) {
      var sp = spawnData[i];
      spawnEnemy(sp.x, sp.y, sp.z);
    }
  }

  function spawnEnemy(x, y, z) {
    // body – dark cylinder
    var bodyGeo = new THREE.CylinderGeometry(0.38, 0.42, 1.7, 8);
    var body = new THREE.Mesh(bodyGeo, mat(0x111a11));
    body.position.set(x, y, z);

    // helmet – sphere
    var helmGeo = new THREE.SphereGeometry(0.3, 7, 7);
    var helm = new THREE.Mesh(helmGeo, mat(0x1a2a1a));
    helm.position.set(x, y + 1.05, z);

    // air tank on back (small cylinder)
    var tankGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.7, 6);
    var tank = new THREE.Mesh(tankGeo, mat(0x223322));
    tank.position.set(x, y + 0.05, z + 0.38);
    tank.rotation.x = 0.25;

    // mask visor (small box)
    var visorGeo = new THREE.BoxGeometry(0.28, 0.18, 0.06);
    var visor = new THREE.Mesh(visorGeo, mat(0x224444));
    visor.position.set(x, y + 1.06, z - 0.28);

    scene.add(body);
    scene.add(helm);
    scene.add(tank);
    scene.add(visor);
    sceneObjects.push(body);
    sceneObjects.push(helm);
    sceneObjects.push(tank);
    sceneObjects.push(visor);

    body.userData.hp = 60;
    body.userData.dead = false;
    body.userData.helmMesh = helm;
    body.userData.tankMesh = tank;
    body.userData.visorMesh = visor;
    body.userData.shootTimer = 0;
    body.userData.shootCooldown = 2.0 + Math.random() * 2.0;
    body.userData.dir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
    body.userData.patrolTimer = 0;

    enemies.push(body);
    return body;
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'sunken-wreck-hud';
    hudEl.style.cssText = [
      'position:fixed', 'top:10px', 'left:50%', 'transform:translateX(-50%)',
      'color:#00ddcc', 'font-family:monospace', 'font-size:13px',
      'background:rgba(0,8,16,0.85)', 'padding:6px 18px',
      'border-radius:4px', 'z-index:9999', 'pointer-events:none',
      'white-space:nowrap', 'letter-spacing:0.04em'
    ].join(';');
    document.body.appendChild(hudEl);

    hintEl = document.createElement('div');
    hintEl.id = 'sunken-wreck-hint';
    hintEl.style.cssText = [
      'position:fixed', 'bottom:14px', 'left:50%', 'transform:translateX(-50%)',
      'color:#447788', 'font-family:monospace', 'font-size:11px',
      'background:rgba(0,8,16,0.75)', 'padding:4px 12px',
      'border-radius:3px', 'z-index:9999', 'pointer-events:none'
    ].join(';');
    hintEl.textContent = 'WASD=swim  Q=rise  Z=dive  Click=shoot  ESC=exit  S+W=toggle';
    document.body.appendChild(hintEl);

    notifEl = document.createElement('div');
    notifEl.id = 'sunken-wreck-notif';
    notifEl.style.cssText = [
      'position:fixed', 'top:60px', 'left:50%', 'transform:translateX(-50%)',
      'color:#ffcc00', 'font-family:monospace', 'font-size:15px',
      'background:rgba(0,20,10,0.9)', 'padding:8px 20px',
      'border-radius:4px', 'z-index:9999', 'pointer-events:none',
      'display:none', 'white-space:nowrap'
    ].join(';');
    document.body.appendChild(notifEl);

    updateHUD();
  }

  function updateHUD() {
    if (!hudEl) return;
    var alive = 0;
    for (var i = 0; i < enemies.length; i++) {
      if (!enemies[i].userData.dead) alive++;
    }
    hudEl.innerHTML =
      'SUNKEN WRECK  |  DOCUMENTS RECOVERED: ' + documentsRecovered + '/' + TOTAL_DOCUMENTS +
      '  |  SALVAGE CREW: ' + alive + ' remaining' +
      '  |  HP: ' + Math.max(0, Math.round(playerHP));
  }

  function showNotif(msg, color) {
    if (!notifEl) return;
    notifEl.textContent = msg;
    notifEl.style.color = color || '#ffcc00';
    notifEl.style.display = 'block';
    notifTimer = 2.5;
  }

  // ── input ──────────────────────────────────────────────────────────────────
  function bindKeys() {
    _onKeyDown = function (e) {
      keysDown[e.keyCode] = true;
      if (e.keyCode === 27 && active) { deactivate(); return; }
    };
    _onKeyUp = function (e) {
      keysDown[e.keyCode] = false;
    };
    _onMouseMove = function (e) {
      if (!active) return;
      if (document.pointerLockElement) {
        mouseX += e.movementX * 0.002;
        mouseY += e.movementY * 0.002;
        mouseY = clamp(mouseY, -1.2, 1.2);
      }
    };
    _onClick = function () {
      if (!active) return;
      if (!document.pointerLockElement && ownRenderer) {
        ownRenderer.domElement.requestPointerLock();
        return;
      }
      if (document.pointerLockElement) playerShoot();
    };
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup', _onKeyUp);
    window.addEventListener('mousemove', _onMouseMove);
    window.addEventListener('click', _onClick);
  }

  function unbindKeys() {
    if (_onKeyDown) window.removeEventListener('keydown', _onKeyDown);
    if (_onKeyUp) window.removeEventListener('keyup', _onKeyUp);
    if (_onMouseMove) window.removeEventListener('mousemove', _onMouseMove);
    if (_onClick) window.removeEventListener('click', _onClick);
    if (document.exitPointerLock) document.exitPointerLock();
  }

  // ── player shoot ───────────────────────────────────────────────────────────
  function playerShoot() {
    if (gameOver || gameWon) return;
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(mouseY, mouseX, 0, 'YXZ'));

    // Bullet (LineSegments tracer)
    var pts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(dir.x * 3, dir.y * 3, dir.z * 3)
    ];
    var bGeo = new THREE.BufferGeometry().setFromPoints(pts);
    var bLine = new THREE.LineSegments(bGeo, new THREE.LineBasicMaterial({ color: 0x88ddaa }));
    bLine.position.set(playerPos.x, playerPos.y + 1.5, playerPos.z);
    scene.add(bLine);

    bullets.push({
      mesh: bLine,
      dir: dir.clone(),
      speed: 30,
      life: 2.0,
      fromPlayer: true
    });
  }

  // ── enemy shoot ───────────────────────────────────────────────────────────
  function enemyShoot(fromPos) {
    var dir = new THREE.Vector3(
      playerPos.x - fromPos.x,
      (playerPos.y + 1.5) - fromPos.y,
      playerPos.z - fromPos.z
    ).normalize();

    var pts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(dir.x * 2.5, dir.y * 2.5, dir.z * 2.5)
    ];
    var bGeo = new THREE.BufferGeometry().setFromPoints(pts);
    var bLine = new THREE.LineSegments(bGeo, new THREE.LineBasicMaterial({ color: 0xaa4422 }));
    bLine.position.set(fromPos.x, fromPos.y + 0.9, fromPos.z);
    scene.add(bLine);

    bullets.push({
      mesh: bLine,
      dir: dir,
      speed: 18,
      life: 2.5,
      fromPlayer: false
    });
  }

  // ── update player ─────────────────────────────────────────────────────────
  function updatePlayer(dt) {
    if (gameOver || gameWon) return;
    var speed = keysDown[16] ? 9 : 5.5; // Shift to sprint

    var fwd = new THREE.Vector3(-Math.sin(mouseX), 0, -Math.cos(mouseX));
    var rgt = new THREE.Vector3(Math.cos(mouseX), 0, -Math.sin(mouseX));

    if (keysDown[87]) { // W
      playerPos.x += fwd.x * speed * dt;
      playerPos.z += fwd.z * speed * dt;
    }
    if (keysDown[83]) { // S
      playerPos.x -= fwd.x * speed * dt;
      playerPos.z -= fwd.z * speed * dt;
    }
    if (keysDown[65]) { // A
      playerPos.x -= rgt.x * speed * dt;
      playerPos.z -= rgt.z * speed * dt;
    }
    if (keysDown[68]) { // D
      playerPos.x += rgt.x * speed * dt;
      playerPos.z += rgt.z * speed * dt;
    }
    if (keysDown[81]) { // Q – rise
      playerPos.y += speed * 0.7 * dt;
    }
    if (keysDown[90]) { // Z – dive
      playerPos.y -= speed * 0.7 * dt;
    }

    playerPos.x = clamp(playerPos.x, -60, 60);
    playerPos.y = clamp(playerPos.y, -27, 12);
    playerPos.z = clamp(playerPos.z, -60, 60);
  }

  function updateCamera() {
    if (!camera) return;
    camera.position.set(playerPos.x, playerPos.y + 1.6, playerPos.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = mouseX;
    camera.rotation.x = mouseY;
  }

  // ── update bullets ────────────────────────────────────────────────────────
  function updateBullets(dt) {
    for (var i = bullets.length - 1; i >= 0; i--) {
      var b = bullets[i];
      b.life -= dt;
      if (b.life <= 0) {
        scene.remove(b.mesh);
        bullets.splice(i, 1);
        continue;
      }

      b.mesh.position.x += b.dir.x * b.speed * dt;
      b.mesh.position.y += b.dir.y * b.speed * dt;
      b.mesh.position.z += b.dir.z * b.speed * dt;

      if (b.fromPlayer) {
        for (var e = 0; e < enemies.length; e++) {
          var en = enemies[e];
          if (en.userData.dead) continue;
          if (dist3(b.mesh.position, en.position) < 1.1) {
            en.userData.hp -= 30;
            if (en.userData.hp <= 0) killEnemy(en);
            scene.remove(b.mesh);
            bullets.splice(i, 1);
            break;
          }
        }
      } else {
        var pp = { x: playerPos.x, y: playerPos.y + 1.4, z: playerPos.z };
        if (dist3(b.mesh.position, pp) < 1.0) {
          playerHP -= 12;
          scene.remove(b.mesh);
          bullets.splice(i, 1);
          updateHUD();
          if (playerHP <= 0 && !gameOver) {
            gameOver = true;
            showNotif('MISSION FAILED — You have been neutralised.', '#ff4444');
          }
        }
      }
    }
  }

  function killEnemy(en) {
    en.userData.dead = true;
    en.material.color.setHex(0x080808);
    if (en.userData.helmMesh) en.userData.helmMesh.material.color.setHex(0x0a0a0a);
    if (en.userData.visorMesh) en.userData.visorMesh.material.color.setHex(0x050505);
    en.position.y -= 0.6;
    if (en.userData.helmMesh) en.userData.helmMesh.position.y -= 0.6;
    if (en.userData.tankMesh) en.userData.tankMesh.position.y -= 0.6;
    if (en.userData.visorMesh) en.userData.visorMesh.position.y -= 0.6;

    var alive = 0;
    for (var i = 0; i < enemies.length; i++) {
      if (!enemies[i].userData.dead) alive++;
    }
    if (alive === 0) {
      showNotif('ALL SALVAGE CREW ELIMINATED!', '#00ffcc');
    }
    updateHUD();
  }

  // ── update enemies ────────────────────────────────────────────────────────
  function updateEnemies(dt) {
    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (en.userData.dead) continue;

      var toPlayer = new THREE.Vector3(
        playerPos.x - en.position.x,
        playerPos.y - en.position.y,
        playerPos.z - en.position.z
      );
      var dtp = toPlayer.length();

      if (dtp < 30) {
        // chase
        var mv = toPlayer.clone().normalize().multiplyScalar(2.2 * dt);
        en.position.add(mv);
        en.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
      } else {
        // patrol
        en.userData.patrolTimer += dt;
        if (en.userData.patrolTimer > 3.5) {
          en.userData.dir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
          en.userData.patrolTimer = 0;
        }
        en.position.add(en.userData.dir.clone().multiplyScalar(1.4 * dt));
        en.position.x = clamp(en.position.x, -50, 50);
        en.position.z = clamp(en.position.z, -50, 50);
      }

      // keep companion meshes in sync
      if (en.userData.helmMesh) {
        en.userData.helmMesh.position.set(en.position.x, en.position.y + 1.05, en.position.z);
        en.userData.helmMesh.rotation.y = en.rotation.y;
      }
      if (en.userData.tankMesh) {
        en.userData.tankMesh.position.set(
          en.position.x + Math.sin(en.rotation.y) * 0.38,
          en.position.y + 0.05,
          en.position.z + Math.cos(en.rotation.y) * 0.38
        );
      }
      if (en.userData.visorMesh) {
        en.userData.visorMesh.position.set(
          en.position.x - Math.sin(en.rotation.y) * 0.28,
          en.position.y + 1.06,
          en.position.z - Math.cos(en.rotation.y) * 0.28
        );
        en.userData.visorMesh.rotation.y = en.rotation.y;
      }

      // shoot
      en.userData.shootTimer += dt;
      if (en.userData.shootTimer >= en.userData.shootCooldown && dtp < 22) {
        enemyShoot(en.position);
        en.userData.shootTimer = 0;
        en.userData.shootCooldown = 2.0 + Math.random() * 2.0;
      }

      // melee
      if (dtp < 1.2) {
        playerHP -= 6 * dt;
        if (playerHP <= 0 && !gameOver) {
          gameOver = true;
          showNotif('MISSION FAILED — Overpowered by salvage crew.', '#ff4444');
        }
      }
    }
  }

  // ── update fish particles ─────────────────────────────────────────────────
  function updateFish(dt) {
    var elapsed = performance.now() * 0.001;
    for (var i = 0; i < fishParticles.length; i++) {
      var f = fishParticles[i];
      f.userData.changeTimer -= dt;
      if (f.userData.changeTimer <= 0) {
        f.userData.dir = new THREE.Vector3(
          Math.random() - 0.5,
          (Math.random() - 0.5) * 0.1,
          Math.random() - 0.5
        ).normalize();
        f.userData.changeTimer = 2.5 + Math.random() * 4;
      }

      // lazy arc: add a sinusoidal vertical wobble
      var arc = Math.sin(elapsed * f.userData.arcSpeed + f.userData.arcPhase) * f.userData.arcAmp;
      f.position.x += f.userData.dir.x * f.userData.speed * dt;
      f.position.y += f.userData.dir.y * f.userData.speed * dt + arc * 0.01;
      f.position.z += f.userData.dir.z * f.userData.speed * dt;
      f.rotation.y = Math.atan2(f.userData.dir.x, f.userData.dir.z);

      f.position.x = clamp(f.position.x, -65, 65);
      f.position.y = clamp(f.position.y, -26, 10);
      f.position.z = clamp(f.position.z, -65, 65);
    }
  }

  // ── update bubbles ────────────────────────────────────────────────────────
  function updateBubbles(dt) {
    for (var i = 0; i < bubbles.length; i++) {
      var b = bubbles[i];
      b.userData.wobble += dt * 1.6;
      b.position.y += b.userData.speed * dt;
      b.position.x += Math.sin(b.userData.wobble) * 0.012;
      if (b.position.y > 12) {
        b.position.y = -28;
        b.position.x = (Math.random() - 0.5) * 100;
        b.position.z = (Math.random() - 0.5) * 100;
      }
    }
  }

  // ── update document pickups ───────────────────────────────────────────────
  function updateDocuments(dt) {
    var elapsed = performance.now() * 0.001;
    for (var i = 0; i < documentMeshes.length; i++) {
      if (documentPickedUp[i]) continue;
      var dm = documentMeshes[i];

      // gentle bob
      dm.position.y += Math.sin(elapsed * 1.2 + i * 2.1) * 0.004;
      dm.rotation.y += dt * 0.8;

      if (dist3(playerPos, dm.position) < 2.5) {
        documentPickedUp[i] = true;
        documentsRecovered++;
        dm.visible = false;
        if (dm.userData.glowLight) dm.userData.glowLight.intensity = 0;
        showNotif('DOCUMENT RECOVERED! (' + documentsRecovered + '/' + TOTAL_DOCUMENTS + ')', '#00ffcc');
        updateHUD();

        if (documentsRecovered >= TOTAL_DOCUMENTS) {
          gameWon = true;
          showNotif('ALL DOCUMENTS SECURED — MISSION COMPLETE!', '#00ffaa');
        }
      }
    }
  }

  // ── update notifications ──────────────────────────────────────────────────
  function updateNotif(dt) {
    if (notifTimer > 0) {
      notifTimer -= dt;
      if (notifTimer <= 0 && notifEl) {
        notifEl.style.display = 'none';
      }
    }
  }

  // ── internal animate loop ─────────────────────────────────────────────────
  function animate(timestamp) {
    if (!active) return;
    animFrameId = requestAnimationFrame(animate);

    var dt = (timestamp - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    if (dt <= 0) dt = 0.016;
    lastTime = timestamp;

    updatePlayer(dt);
    updateCamera();
    updateBullets(dt);
    updateEnemies(dt);
    updateFish(dt);
    updateBubbles(dt);
    updateDocuments(dt);
    updateNotif(dt);

    if (ownRenderer) {
      ownRenderer.render(scene, camera);
    }
  }

  // ── teardown ───────────────────────────────────────────────────────────────
  function deactivate() {
    if (!active) return;
    active = false;

    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }

    // remove all tracked scene objects
    for (var i = 0; i < sceneObjects.length; i++) {
      scene.remove(sceneObjects[i]);
    }
    sceneObjects = [];

    // restore fog/bg
    if (usingExternalScene) {
      scene.fog = savedFog;
      scene.background = savedBackground;
    }

    // remove own renderer if created
    if (ownRenderer) {
      if (ownRenderer.domElement.parentNode) {
        ownRenderer.domElement.parentNode.removeChild(ownRenderer.domElement);
      }
      ownRenderer.dispose();
      ownRenderer = null;
    }

    // remove HUD elements
    if (hudEl && hudEl.parentNode) { hudEl.parentNode.removeChild(hudEl); hudEl = null; }
    if (hintEl && hintEl.parentNode) { hintEl.parentNode.removeChild(hintEl); hintEl = null; }
    if (notifEl && notifEl.parentNode) { notifEl.parentNode.removeChild(notifEl); notifEl = null; }

    unbindKeys();

    enemies = [];
    bullets = [];
    fishParticles = [];
    bubbles = [];
    documentMeshes = [];
    documentPickedUp = [];
  }

  // ── public init ───────────────────────────────────────────────────────────
  function init(sceneRef, cameraRef) {
    if (active) return;

    if (typeof THREE === 'undefined') {
      console.warn('[SunkenWreck] THREE.js not found');
      return;
    }

    // reset game state
    playerPos = { x: 0, y: 2, z: 40 };
    playerHP = 100;
    mouseX = 0;
    mouseY = 0;
    keysDown = {};
    documentsRecovered = 0;
    enemies = [];
    bullets = [];
    fishParticles = [];
    bubbles = [];
    documentMeshes = [];
    documentPickedUp = [];
    sceneObjects = [];
    gameOver = false;
    gameWon = false;
    notifTimer = 0;

    if (sceneRef && cameraRef) {
      // external scene provided (host game)
      scene = sceneRef;
      camera = cameraRef;
      usingExternalScene = true;
      ownRenderer = null;
    } else {
      // standalone mode – create our own scene + renderer
      usingExternalScene = false;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
      camera.position.set(0, 2, 40);

      ownRenderer = new THREE.WebGLRenderer({ antialias: true });
      ownRenderer.setPixelRatio(window.devicePixelRatio || 1);
      ownRenderer.setSize(window.innerWidth, window.innerHeight);
      ownRenderer.domElement.style.position = 'fixed';
      ownRenderer.domElement.style.top = '0';
      ownRenderer.domElement.style.left = '0';
      ownRenderer.domElement.style.zIndex = '9000';
      document.body.appendChild(ownRenderer.domElement);
    }

    active = true;

    setupScene();
    buildFloor();
    buildShipHull();
    buildCoral();
    buildCannons();
    buildPortholes();
    buildSalvageCrane();
    buildSubmarine();
    buildFishParticles();
    buildBubbles();
    buildDocuments();
    buildEnemies();
    buildHUD();
    bindKeys();

    lastTime = performance.now();
    animate(lastTime);

    showNotif('OPERATION SUNKEN WRECK — Recover 3 classified documents!', '#00ffcc');
  }

  // ── public update (called by external game loop if not standalone) ─────────
  function update(delta) {
    // When used with an external scene/camera, the host calls this each frame.
    // Our internal animate loop is already running; this hook is a no-op but
    // satisfies the required interface.
  }

  // ── public reset ──────────────────────────────────────────────────────────
  function reset() {
    var prevScene = scene;
    var prevCamera = camera;
    var wasExternal = usingExternalScene;
    deactivate();
    setTimeout(function () {
      if (wasExternal && prevScene && prevCamera) {
        init(prevScene, prevCamera);
      } else {
        init();
      }
    }, 80);
  }

  // ── global activation: S then W within 400ms ──────────────────────────────
  function globalKeyHandler(e) {
    var now = Date.now();
    if (e.keyCode === ACT_KEY_S) _sTime = now;
    if (e.keyCode === ACT_KEY_W) _wTime = now;

    if (_sTime && _wTime && Math.abs(_sTime - _wTime) <= ACT_WINDOW) {
      _sTime = null;
      _wTime = null;
      if (!active) {
        showToggleNotif('SUNKEN WRECK — ACTIVATED');
        init();
      } else {
        showToggleNotif('SUNKEN WRECK — DEACTIVATED');
        deactivate();
      }
    }

    if (e.keyCode === 27 && active) {
      deactivate();
    }
  }

  function showToggleNotif(msg) {
    var el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#00ffcc', 'font-family:monospace', 'font-size:18px',
      'background:rgba(0,15,10,0.92)', 'padding:12px 28px',
      'border-radius:6px', 'z-index:99999', 'pointer-events:none'
    ].join(';');
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1800);
  }

  window.addEventListener('keydown', globalKeyHandler);

  return { init: init, update: update, reset: reset };

}());
