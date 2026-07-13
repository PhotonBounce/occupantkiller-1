window.SpaceDebris = (function () {
  'use strict';

  // ── state ───────────────────────────────────────────────────────────────────
  var scene, camera;
  var active = false;
  var objects = [];
  var hudEl = null;
  var hudNotif = null;
  var notifTimer = 0;

  var componentsRecovered = 0;
  var totalComponents = 5;
  var reEntryTime = 300;

  var debrisChunks = [];
  var debrisRotSpeeds = [];

  var weaponFragments = [];
  var weaponFragRotSpeeds = [];

  var solarPanels = [];
  var solarPanelRotSpeeds = [];

  var antennae = [];
  var antennaeRotSpeeds = [];

  var wreckageSegments = [];
  var wreckageRotSpeeds = [];

  var componentPickups = [];
  var componentPickupRotSpeeds = [];

  var drones = [];
  var droneVelocities = [];

  var lastKeyTime = 0;
  var lastKey = '';
  var keyHandler = null;
  var keyUpHandler = null;

  var yaw = 0;
  var pitch = 0;
  var playerVelocity = { x: 0, y: 0, z: 0 };
  var keyState = {};
  var mouseHandler = null;

  var raycaster = null;

  var gameWon = false;
  var gameLost = false;

  // ── HUD ─────────────────────────────────────────────────────────────────────
  function createHUD() {
    if (hudEl) return;
    hudEl = document.createElement('div');
    hudEl.id = 'spacedebris-hud';
    hudEl.style.cssText = [
      'position:fixed;top:10px;left:10px',
      'color:#0ff;font:13px monospace',
      'pointer-events:none;display:none',
      'text-shadow:0 0 6px #0ff,1px 1px 2px #000',
      'z-index:999;line-height:1.8'
    ].join(';');
    document.body.appendChild(hudEl);

    hudNotif = document.createElement('div');
    hudNotif.id = 'spacedebris-notif';
    hudNotif.style.cssText = [
      'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%)',
      'color:#ff0;font:bold 18px monospace',
      'pointer-events:none;display:none',
      'text-shadow:0 0 10px #ff0,1px 1px 2px #000',
      'z-index:1000;text-align:center;padding:12px 24px',
      'background:rgba(0,0,0,0.6);border:1px solid #ff0'
    ].join(';');
    document.body.appendChild(hudNotif);
  }

  function removeHUD() {
    if (hudEl && hudEl.parentNode) { hudEl.parentNode.removeChild(hudEl); hudEl = null; }
    if (hudNotif && hudNotif.parentNode) { hudNotif.parentNode.removeChild(hudNotif); hudNotif = null; }
  }

  function showNotif(msg, duration) {
    if (!hudNotif) return;
    hudNotif.innerHTML = msg;
    hudNotif.style.display = 'block';
    notifTimer = duration || 3.0;
  }

  function updateHUD(dt) {
    if (!hudEl) return;
    if (!active) { hudEl.style.display = 'none'; return; }
    hudEl.style.display = 'block';

    var remaining = Math.max(0, Math.ceil(reEntryTime));
    var mins = Math.floor(remaining / 60);
    var secs = remaining % 60;
    var secStr = secs < 10 ? '0' + secs : '' + secs;
    var timerColor = reEntryTime < 30 ? '#f44' : (reEntryTime < 60 ? '#fa0' : '#0ff');
    var compColor = componentsRecovered >= totalComponents ? '#0f0' : '#ff0';

    hudEl.innerHTML = [
      '<span style="color:' + compColor + '">COMPONENTS RECOVERED: ' + componentsRecovered + '/' + totalComponents + '</span>',
      '<span style="color:' + timerColor + '">RE-ENTRY IN: ' + mins + ':' + secStr + '</span>',
      '<span style="color:#aaa">[WASD] Move  [Space/Shift] Up/Down  [Mouse] Look  [LMB] Shoot</span>',
      '<span style="color:#888">[Double S+B within 400ms] Toggle EVA module</span>'
    ].join('<br>');

    if (notifTimer > 0) {
      notifTimer -= dt;
      if (notifTimer <= 0) {
        if (hudNotif) hudNotif.style.display = 'none';
        notifTimer = 0;
      }
    }
  }

  // ── scene helpers ────────────────────────────────────────────────────────────
  function addToScene(obj) {
    scene.add(obj);
    objects.push(obj);
    return obj;
  }

  function makeMat(color, opts) {
    var o = opts || {};
    return new THREE.MeshLambertMaterial({
      color: color,
      side: o.double ? THREE.DoubleSide : THREE.FrontSide,
      transparent: o.transparent || false,
      opacity: o.opacity !== undefined ? o.opacity : 1.0
    });
  }

  function makeBasicMat(color, opts) {
    var o = opts || {};
    return new THREE.MeshBasicMaterial({
      color: color,
      transparent: o.transparent || false,
      opacity: o.opacity !== undefined ? o.opacity : 1.0
    });
  }

  function makeBox(w, h, d, color, opts) {
    var g = new THREE.BoxGeometry(w, h, d);
    var m = new THREE.Mesh(g, makeMat(color, opts));
    return m;
  }

  function makeSphere(r, segsW, segsH, color, opts) {
    var g = new THREE.SphereGeometry(r, segsW || 8, segsH || 6);
    var m = new THREE.Mesh(g, makeMat(color, opts));
    return m;
  }

  function makeCylinder(rt, rb, h, segs, color) {
    var g = new THREE.CylinderGeometry(rt, rb, h, segs);
    var m = new THREE.Mesh(g, makeMat(color));
    return m;
  }

  function makeCone(r, h, segs, color) {
    var g = new THREE.ConeGeometry(r, h, segs);
    var m = new THREE.Mesh(g, makeMat(color));
    return m;
  }

  function makeLineSegments(pts, color) {
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: color }));
  }

  // ── star field ───────────────────────────────────────────────────────────────
  function createStarField() {
    var i, r, theta, phi, star;
    for (i = 0; i < 400; i++) {
      star = new THREE.Mesh(
        new THREE.SphereGeometry(0.05 + Math.random() * 0.12, 4, 4),
        makeBasicMat(0xffffff)
      );
      r = 350 + Math.random() * 150;
      theta = Math.random() * Math.PI * 2;
      phi = Math.random() * Math.PI;
      star.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
      addToScene(star);
    }
  }

  // ── Earth ────────────────────────────────────────────────────────────────────
  function createEarth() {
    var earth, atmo, pts, i, angle, lx, lz, lines;

    earth = new THREE.Mesh(
      new THREE.SphereGeometry(60, 32, 24),
      makeMat(0x1144aa, { double: false })
    );
    earth.position.set(0, -200, 0);
    addToScene(earth);

    // green landmass patches — flat boxes stuck to sphere surface
    var landPositions = [
      { x: 20, y: -145, z: 30 },
      { x: -25, y: -143, z: 40 },
      { x: 10, y: -148, z: -35 },
      { x: -40, y: -150, z: -10 },
      { x: 35, y: -147, z: -20 }
    ];
    var li, land;
    for (li = 0; li < landPositions.length; li++) {
      land = makeBox(
        12 + Math.random() * 18,
        1.5,
        10 + Math.random() * 14,
        0x1a6b1a
      );
      land.position.set(landPositions[li].x, landPositions[li].y, landPositions[li].z);
      land.rotation.x = Math.random() * 0.4;
      land.rotation.z = Math.random() * 0.4;
      addToScene(land);
    }

    // cloud layer — semi-transparent sphere slightly larger
    atmo = new THREE.Mesh(
      new THREE.SphereGeometry(62.5, 32, 24),
      new THREE.MeshBasicMaterial({
        color: 0x88bbff,
        transparent: true,
        opacity: 0.12,
        side: THREE.FrontSide
      })
    );
    atmo.position.set(0, -200, 0);
    addToScene(atmo);

    // lattitude / longitude ring lines for visual effect
    pts = [];
    for (i = 0; i < 36; i++) {
      angle = (i / 36) * Math.PI * 2;
      lx = Math.cos(angle) * 61;
      lz = Math.sin(angle) * 61;
      var angle2 = ((i + 1) / 36) * Math.PI * 2;
      var lx2 = Math.cos(angle2) * 61;
      var lz2 = Math.sin(angle2) * 61;
      pts.push(lx, -200, lz, lx2, -200, lz2);
    }
    lines = makeLineSegments(pts, 0x2266cc);
    addToScene(lines);
  }

  // ── debris chunks ────────────────────────────────────────────────────────────
  function createDebrisChunks() {
    var i, chunk, w, h, d, rx, ry, rz, px, py, pz;
    var speeds = [
      { rx: 0.4, ry: 0.2, rz: 0.3 },
      { rx: 0.1, ry: 0.5, rz: 0.2 },
      { rx: 0.3, ry: 0.1, rz: 0.6 },
      { rx: 0.5, ry: 0.3, rz: 0.1 },
      { rx: 0.2, ry: 0.4, rz: 0.5 },
      { rx: 0.6, ry: 0.2, rz: 0.2 },
      { rx: 0.1, ry: 0.6, rz: 0.4 },
      { rx: 0.3, ry: 0.3, rz: 0.3 },
      { rx: 0.45, ry: 0.15, rz: 0.5 },
      { rx: 0.2, ry: 0.55, rz: 0.1 }
    ];
    var colors = [0x888877, 0x667766, 0x554433, 0x997755, 0x665544,
                  0x776655, 0x998866, 0x556677, 0x443355, 0x777755];

    for (i = 0; i < 10; i++) {
      w = 0.4 + Math.random() * 2.5;
      h = 0.3 + Math.random() * 2.0;
      d = 0.3 + Math.random() * 2.0;
      px = (Math.random() - 0.5) * 80;
      py = (Math.random() - 0.5) * 40;
      pz = (Math.random() - 0.5) * 80;

      chunk = makeBox(w, h, d, colors[i % colors.length]);
      chunk.position.set(px, py, pz);
      chunk.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      addToScene(chunk);
      debrisChunks.push(chunk);
      debrisRotSpeeds.push(speeds[i % speeds.length]);
    }

    // extra irregular chunks via scaled boxes
    for (i = 0; i < 8; i++) {
      w = 0.2 + Math.random() * 1.2;
      h = 0.2 + Math.random() * 1.2;
      d = 0.2 + Math.random() * 1.2;
      px = (Math.random() - 0.5) * 100;
      py = (Math.random() - 0.5) * 50;
      pz = (Math.random() - 0.5) * 100;

      chunk = makeBox(w, h, d, 0x666655);
      chunk.position.set(px, py, pz);
      chunk.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      addToScene(chunk);
      debrisChunks.push(chunk);
      debrisRotSpeeds.push({
        rx: 0.1 + Math.random() * 0.5,
        ry: 0.1 + Math.random() * 0.5,
        rz: 0.1 + Math.random() * 0.5
      });
    }
  }

  // ── weapon platform fragments (box structures + LineSegments) ─────────────
  function createWeaponFragments() {
    var i, group, body, arm1, arm2, turret, pts, lines, px, py, pz;

    for (i = 0; i < 4; i++) {
      px = (Math.random() - 0.5) * 70;
      py = (Math.random() - 0.5) * 30;
      pz = (Math.random() - 0.5) * 70;

      group = new THREE.Object3D();
      group.position.set(px, py, pz);
      group.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      // main body
      body = makeBox(3.0, 1.0, 2.0, 0x445566);
      body.position.set(0, 0, 0);
      group.add(body);

      // weapon arms
      arm1 = makeBox(2.5, 0.4, 0.4, 0x334455);
      arm1.position.set(-2.5, 0.3, 0);
      group.add(arm1);

      arm2 = makeBox(2.5, 0.4, 0.4, 0x334455);
      arm2.position.set(2.5, 0.3, 0);
      group.add(arm2);

      // turret nub
      turret = makeCylinder(0.3, 0.4, 1.2, 6, 0x556677);
      turret.position.set(0, 0.8, 0);
      group.add(turret);

      // structural lines
      pts = [
        -1.5, 0.5, 1.0,   -1.5, -0.5, -1.0,
        1.5, 0.5, 1.0,    1.5, -0.5, -1.0,
        -1.5, 0.5, -1.0,  1.5, 0.5, 1.0,
        -3.7, 0.3, 0.2,   -1.0, 0, 0,
        3.7, 0.3, 0.2,    1.0, 0, 0
      ];
      lines = makeLineSegments(pts, 0x889aaa);
      group.add(lines);

      addToScene(group);
      weaponFragments.push(group);
      weaponFragRotSpeeds.push({
        rx: 0.05 + Math.random() * 0.2,
        ry: 0.05 + Math.random() * 0.25,
        rz: 0.03 + Math.random() * 0.15
      });
    }
  }

  // ── solar panels drifting ────────────────────────────────────────────────────
  function createSolarPanels() {
    var i, group, panel, frame, mast, pts, lines, px, py, pz, p2;

    for (i = 0; i < 5; i++) {
      px = (Math.random() - 0.5) * 90;
      py = (Math.random() - 0.5) * 35;
      pz = (Math.random() - 0.5) * 90;

      group = new THREE.Object3D();
      group.position.set(px, py, pz);
      group.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      // mast
      mast = makeBox(0.2, 0.2, 6.0, 0x778899);
      mast.position.set(0, 0, 0);
      group.add(mast);

      // two solar panel wings (flat thin boxes)
      panel = makeBox(5.0, 0.08, 2.5, 0x1133bb);
      panel.position.set(-3.5, 0, 0);
      group.add(panel);

      p2 = makeBox(5.0, 0.08, 2.5, 0x1133bb);
      p2.position.set(3.5, 0, 0);
      group.add(p2);

      // panel frame
      frame = makeBox(5.1, 0.12, 2.6, 0x334466);
      frame.position.set(-3.5, 0, 0);
      group.add(frame);

      var frame2 = makeBox(5.1, 0.12, 2.6, 0x334466);
      frame2.position.set(3.5, 0, 0);
      group.add(frame2);

      // grid lines on panels
      pts = [
        -6.0, 0.07, -1.2,  -6.0, 0.07, 1.2,
        -5.0, 0.07, -1.2,  -5.0, 0.07, 1.2,
        -4.0, 0.07, -1.2,  -4.0, 0.07, 1.2,
        -3.0, 0.07, -1.2,  -3.0, 0.07, 1.2,
        -2.0, 0.07, -1.2,  -2.0, 0.07, 1.2,
        -6.0, 0.07, -1.2,  -2.0, 0.07, -1.2,
        -6.0, 0.07,  0.0,  -2.0, 0.07,  0.0,
        -6.0, 0.07,  1.2,  -2.0, 0.07,  1.2,
        2.0, 0.07, -1.2,   2.0, 0.07, 1.2,
        3.0, 0.07, -1.2,   3.0, 0.07, 1.2,
        4.0, 0.07, -1.2,   4.0, 0.07, 1.2,
        5.0, 0.07, -1.2,   5.0, 0.07, 1.2,
        6.0, 0.07, -1.2,   6.0, 0.07, 1.2,
        2.0, 0.07, -1.2,   6.0, 0.07, -1.2,
        2.0, 0.07,  0.0,   6.0, 0.07,  0.0,
        2.0, 0.07,  1.2,   6.0, 0.07,  1.2
      ];
      lines = makeLineSegments(pts, 0x2255cc);
      group.add(lines);

      addToScene(group);
      solarPanels.push(group);
      solarPanelRotSpeeds.push({
        rx: 0.03 + Math.random() * 0.1,
        ry: 0.02 + Math.random() * 0.1,
        rz: 0.04 + Math.random() * 0.12
      });
    }
  }

  // ── satellite antennae ────────────────────────────────────────────────────────
  function createAntennae() {
    var i, group, body, dish, arm, spoke, pts, lines, px, py, pz, j, angle;

    for (i = 0; i < 4; i++) {
      px = (Math.random() - 0.5) * 80;
      py = (Math.random() - 0.5) * 40;
      pz = (Math.random() - 0.5) * 80;

      group = new THREE.Object3D();
      group.position.set(px, py, pz);
      group.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      // main box body
      body = makeBox(0.8, 0.8, 1.2, 0x556677);
      body.position.set(0, 0, 0);
      group.add(body);

      // dish arm
      arm = makeBox(0.12, 0.12, 2.0, 0x778899);
      arm.position.set(0, 0.6, 0);
      arm.rotation.x = Math.PI / 2;
      group.add(arm);

      // dish (cone as dish approximation)
      dish = makeCone(0.8, 0.5, 8, 0x667788);
      dish.position.set(0, 0.6, 1.2);
      dish.rotation.x = -Math.PI / 2;
      group.add(dish);

      // whip antennae (thin boxes)
      for (j = 0; j < 3; j++) {
        angle = (j / 3) * Math.PI * 2;
        var whip = makeBox(0.06, 2.5, 0.06, 0x889aaa);
        whip.position.set(
          Math.cos(angle) * 0.5,
          1.25,
          Math.sin(angle) * 0.5
        );
        group.add(whip);
      }

      // structural lines
      pts = [
        0, 0.4, 0.6,   0, 0.6, 1.0,
        -0.4, 0, 0.6,  0, 0.6, 1.0,
        0.4, 0, 0.6,   0, 0.6, 1.0
      ];
      lines = makeLineSegments(pts, 0xaabbcc);
      group.add(lines);

      addToScene(group);
      antennae.push(group);
      antennaeRotSpeeds.push({
        rx: 0.06 + Math.random() * 0.22,
        ry: 0.08 + Math.random() * 0.3,
        rz: 0.04 + Math.random() * 0.18
      });
    }
  }

  // ── space station wreckage segments ──────────────────────────────────────────
  function createSpaceStationWreckage() {
    var i, group, seg, ring1, ring2, pts, lines, px, py, pz;

    for (i = 0; i < 4; i++) {
      px = (Math.random() - 0.5) * 60;
      py = (Math.random() - 0.5) * 25;
      pz = (Math.random() - 0.5) * 60;

      group = new THREE.Object3D();
      group.position.set(px, py, pz);
      group.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      // cylinder hull segment
      seg = makeCylinder(2.0, 2.0, 6.0, 10, 0x445566);
      seg.rotation.x = Math.PI / 2;
      group.add(seg);

      // rib rings
      ring1 = makeCylinder(2.1, 2.1, 0.4, 10, 0x334455);
      ring1.rotation.x = Math.PI / 2;
      ring1.position.set(0, 0, 2.2);
      group.add(ring1);

      ring2 = makeCylinder(2.1, 2.1, 0.4, 10, 0x334455);
      ring2.rotation.x = Math.PI / 2;
      ring2.position.set(0, 0, -2.2);
      group.add(ring2);

      // broken edge structural lines
      pts = [
        0, 2.0, 3.0,   0, 0, 3.0,
        0, -2.0, 3.0,  0, 0, 3.0,
        2.0, 0, 3.0,   0, 0, 3.0,
        -2.0, 0, 3.0,  0, 0, 3.0,
        0, 2.0, -3.0,  0, 0, -3.0,
        0, -2.0, -3.0, 0, 0, -3.0
      ];
      lines = makeLineSegments(pts, 0x88aacc);
      group.add(lines);

      // scorched box panel on hull
      var panel = makeBox(1.5, 1.5, 0.1, 0x223344);
      panel.position.set(0, 1.8, 1.5);
      group.add(panel);

      // broken protrusion
      var stub = makeBox(0.4, 0.4, 1.5, 0x667788);
      stub.position.set(1.5, 0.8, 0);
      stub.rotation.z = 0.5;
      group.add(stub);

      addToScene(group);
      wreckageSegments.push(group);
      wreckageRotSpeeds.push({
        rx: 0.04 + Math.random() * 0.15,
        ry: 0.03 + Math.random() * 0.12,
        rz: 0.05 + Math.random() * 0.18
      });
    }
  }

  // ── weapon component pickups ──────────────────────────────────────────────────
  function createComponentPickups() {
    var i, group, core, ring, glow, px, py, pz;
    var pickupPositions = [
      { x: 15, y: 5, z: 10 },
      { x: -20, y: -8, z: 25 },
      { x: 30, y: 10, z: -15 },
      { x: -10, y: 12, z: -30 },
      { x: 5, y: -15, z: 20 }
    ];

    for (i = 0; i < totalComponents; i++) {
      px = pickupPositions[i].x;
      py = pickupPositions[i].y;
      pz = pickupPositions[i].z;

      group = new THREE.Object3D();
      group.position.set(px, py, pz);

      // glowing core sphere
      core = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 10, 8),
        makeBasicMat(0x00ffaa)
      );
      core.position.set(0, 0, 0);
      group.add(core);

      // spinning ring cylinder
      ring = makeCylinder(0.7, 0.7, 0.1, 12, 0x00cc88);
      ring.position.set(0, 0, 0);
      group.add(ring);

      // second ring at 90 deg
      var ring2 = makeCylinder(0.7, 0.7, 0.1, 12, 0x00cc88);
      ring2.rotation.x = Math.PI / 2;
      ring2.position.set(0, 0, 0);
      group.add(ring2);

      group.userData.collected = false;
      group.userData.index = i;

      addToScene(group);
      componentPickups.push(group);
      componentPickupRotSpeeds.push({
        rx: 0.3,
        ry: 0.8,
        rz: 0.2
      });
    }
  }

  // ── enemy drones ─────────────────────────────────────────────────────────────
  function createDrones() {
    var i, group, body, arm1, arm2, eye, px, py, pz;
    var dronePositions = [
      { x: 25, y: 8, z: 20 },
      { x: -30, y: -5, z: -10 },
      { x: 10, y: 15, z: -25 },
      { x: -15, y: -10, z: 30 }
    ];

    for (i = 0; i < 4; i++) {
      px = dronePositions[i].x;
      py = dronePositions[i].y;
      pz = dronePositions[i].z;

      group = new THREE.Object3D();
      group.position.set(px, py, pz);

      // sphere body
      body = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 8, 6),
        makeMat(0x334455)
      );
      group.add(body);

      // box appendages / thruster pods
      arm1 = makeBox(1.4, 0.2, 0.2, 0x223344);
      arm1.position.set(0, 0, 0);
      group.add(arm1);

      arm2 = makeBox(0.2, 0.2, 1.4, 0x223344);
      arm2.position.set(0, 0, 0);
      group.add(arm2);

      // thruster pods at arm tips
      var pod1 = makeCylinder(0.15, 0.12, 0.3, 6, 0x445577);
      pod1.position.set(0.9, 0, 0);
      pod1.rotation.z = Math.PI / 2;
      group.add(pod1);

      var pod2 = makeCylinder(0.15, 0.12, 0.3, 6, 0x445577);
      pod2.position.set(-0.9, 0, 0);
      pod2.rotation.z = Math.PI / 2;
      group.add(pod2);

      var pod3 = makeCylinder(0.15, 0.12, 0.3, 6, 0x445577);
      pod3.position.set(0, 0, 0.9);
      group.add(pod3);

      var pod4 = makeCylinder(0.15, 0.12, 0.3, 6, 0x445577);
      pod4.position.set(0, 0, -0.9);
      group.add(pod4);

      // red eye
      eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 6, 4),
        makeBasicMat(0xff2200)
      );
      eye.position.set(0, 0, 0.52);
      group.add(eye);

      group.userData.hp = 60;
      group.userData.alive = true;
      group.userData.alertRange = 30;
      group.userData.alerted = false;
      group.userData.driftPhase = Math.random() * Math.PI * 2;
      group.userData.shootCooldown = 2 + Math.random() * 3;

      addToScene(group);
      drones.push(group);
      droneVelocities.push({
        x: (Math.random() - 0.5) * 0.3,
        y: (Math.random() - 0.5) * 0.15,
        z: (Math.random() - 0.5) * 0.3
      });
    }
  }

  // ── ambient lighting ──────────────────────────────────────────────────────────
  function createLighting() {
    var ambient = new THREE.AmbientLight(0x111133, 0.5);
    addToScene(ambient);

    // sun directional sim
    var sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(200, 100, 50);
    addToScene(sun);

    // soft fill from Earth below
    var earthBounce = new THREE.PointLight(0x1155aa, 0.4, 500);
    earthBounce.position.set(0, -150, 0);
    addToScene(earthBounce);
  }

  // ── projectile pool ───────────────────────────────────────────────────────────
  var projectiles = [];

  function spawnPlayerProjectile() {
    var dir, geo, pmesh;
    dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    geo = new THREE.BoxGeometry(0.07, 0.07, 0.5);
    pmesh = new THREE.Mesh(geo, makeBasicMat(0x00ffff));
    pmesh.position.copy(camera.position);
    addToScene(pmesh);
    projectiles.push({
      mesh: pmesh,
      velocity: dir.clone().multiplyScalar(50),
      life: 3.0,
      fromEnemy: false
    });
  }

  function spawnDroneProjectile(fromPos, dir) {
    var geo, pmesh;
    geo = new THREE.BoxGeometry(0.1, 0.1, 0.35);
    pmesh = new THREE.Mesh(geo, makeBasicMat(0xff3300));
    pmesh.position.copy(fromPos);
    addToScene(pmesh);
    projectiles.push({
      mesh: pmesh,
      velocity: dir.clone().multiplyScalar(20),
      life: 4.0,
      fromEnemy: true
    });
  }

  // ── activation ────────────────────────────────────────────────────────────────
  function activate() {
    active = true;
    buildWorld();
    camera.position.set(0, 5, 0);
    yaw = 0;
    pitch = 0;
    playerVelocity.x = 0;
    playerVelocity.y = 0;
    playerVelocity.z = 0;
    if (hudEl) hudEl.style.display = 'block';
    showNotif('EVA INITIATED — Recover weapon components before re-entry!', 4.0);
    if (document.body && document.body.requestPointerLock) {
      document.body.requestPointerLock();
    }
  }

  function deactivate() {
    active = false;
    if (hudEl) hudEl.style.display = 'none';
    if (hudNotif) hudNotif.style.display = 'none';
    if (document.exitPointerLock) document.exitPointerLock();
    showNotif('EVA MODULE DEACTIVATED', 2.0);
  }

  // ── input handling ────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    keyState[e.code] = true;

    // S then B within 400ms to toggle
    if (e.code === 'KeyS' || e.code === 'KeyB') {
      var now = performance.now();
      if (e.code === 'KeyB' && lastKey === 'KeyS' && (now - lastKeyTime) < 400) {
        if (!active) {
          activate();
        } else {
          deactivate();
        }
      }
      lastKey = e.code;
      lastKeyTime = now;
    }

    if (!active) return;

    if (e.code === 'KeyF') {
      spawnPlayerProjectile();
    }
  }

  function onKeyUp(e) {
    keyState[e.code] = false;
  }

  function onMouseMove(e) {
    if (!active) return;
    yaw -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;
    pitch = Math.max(-1.3, Math.min(1.3, pitch));
  }

  function onMouseClick(e) {
    if (!active) return;
    if (document.pointerLockElement !== document.body) {
      document.body.requestPointerLock();
      return;
    }
    spawnPlayerProjectile();
  }

  // ── build world ───────────────────────────────────────────────────────────────
  function buildWorld() {
    scene.background = new THREE.Color(0x000008);

    createLighting();
    createStarField();
    createEarth();
    createDebrisChunks();
    createWeaponFragments();
    createSolarPanels();
    createAntennae();
    createSpaceStationWreckage();
    createComponentPickups();
    createDrones();
  }

  // ── update helpers ────────────────────────────────────────────────────────────
  function updatePlayer(dt) {
    var forward, right, move, spd, newPos;
    spd = 8;
    forward = new THREE.Vector3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
    right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    move = new THREE.Vector3();

    if (keyState['KeyW'] || keyState['ArrowUp'])    move.addScaledVector(forward, spd);
    if (keyState['KeyS'] || keyState['ArrowDown'])  move.addScaledVector(forward, -spd);
    if (keyState['KeyD'] || keyState['ArrowRight']) move.addScaledVector(right, spd);
    if (keyState['KeyA'] || keyState['ArrowLeft'])  move.addScaledVector(right, -spd);
    if (keyState['Space'])                          move.y += spd;
    if (keyState['ShiftLeft'] || keyState['ShiftRight']) move.y -= spd;

    // zero-gravity inertia
    playerVelocity.x = playerVelocity.x * 0.88 + move.x * dt;
    playerVelocity.y = playerVelocity.y * 0.88 + move.y * dt;
    playerVelocity.z = playerVelocity.z * 0.88 + move.z * dt;

    newPos = camera.position.clone();
    newPos.x += playerVelocity.x;
    newPos.y += playerVelocity.y;
    newPos.z += playerVelocity.z;

    camera.position.copy(newPos);
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
  }

  function updateDebris(dt) {
    var i, s;
    for (i = 0; i < debrisChunks.length; i++) {
      s = debrisRotSpeeds[i];
      debrisChunks[i].rotation.x += dt * s.rx;
      debrisChunks[i].rotation.y += dt * s.ry;
      debrisChunks[i].rotation.z += dt * s.rz;
    }
    for (i = 0; i < weaponFragments.length; i++) {
      s = weaponFragRotSpeeds[i];
      weaponFragments[i].rotation.x += dt * s.rx;
      weaponFragments[i].rotation.y += dt * s.ry;
      weaponFragments[i].rotation.z += dt * s.rz;
    }
    for (i = 0; i < solarPanels.length; i++) {
      s = solarPanelRotSpeeds[i];
      solarPanels[i].rotation.x += dt * s.rx;
      solarPanels[i].rotation.y += dt * s.ry;
      solarPanels[i].rotation.z += dt * s.rz;
    }
    for (i = 0; i < antennae.length; i++) {
      s = antennaeRotSpeeds[i];
      antennae[i].rotation.x += dt * s.rx;
      antennae[i].rotation.y += dt * s.ry;
      antennae[i].rotation.z += dt * s.rz;
    }
    for (i = 0; i < wreckageSegments.length; i++) {
      s = wreckageRotSpeeds[i];
      wreckageSegments[i].rotation.x += dt * s.rx;
      wreckageSegments[i].rotation.y += dt * s.ry;
      wreckageSegments[i].rotation.z += dt * s.rz;
    }
  }

  function updatePickups(dt) {
    var i, pickup, dist;
    for (i = 0; i < componentPickups.length; i++) {
      pickup = componentPickups[i];
      if (pickup.userData.collected) continue;

      pickup.rotation.y += dt * componentPickupRotSpeeds[i].ry;
      pickup.rotation.x += dt * 0.5;

      // gentle float bob
      pickup.position.y += Math.sin(Date.now() * 0.001 + i * 1.3) * 0.003;

      // proximity check for collection
      dist = camera.position.distanceTo(pickup.position);
      if (dist < 2.5) {
        pickup.userData.collected = true;
        pickup.visible = false;
        componentsRecovered++;
        showNotif('COMPONENT RECOVERED: ' + componentsRecovered + '/' + totalComponents, 2.0);
        if (componentsRecovered >= totalComponents) {
          gameWon = true;
          showNotif('ALL COMPONENTS SECURED — Mission Complete!', 5.0);
        }
      }
    }
  }

  function updateDrones(dt) {
    var i, drone, vel, playerPos, dist, dir, dv;
    playerPos = camera.position.clone();

    for (i = 0; i < drones.length; i++) {
      drone = drones[i];
      if (!drone.userData.alive) continue;

      vel = droneVelocities[i];
      drone.userData.driftPhase += dt * 0.8;

      dist = drone.position.distanceTo(playerPos);

      if (!drone.userData.alerted && dist < drone.userData.alertRange) {
        drone.userData.alerted = true;
      }

      if (drone.userData.alerted) {
        dir = new THREE.Vector3(
          playerPos.x - drone.position.x,
          playerPos.y - drone.position.y,
          playerPos.z - drone.position.z
        ).normalize();
        dv = 3.5;
        drone.position.x += dir.x * dv * dt + Math.sin(drone.userData.driftPhase) * 0.007;
        drone.position.y += dir.y * dv * dt + Math.cos(drone.userData.driftPhase * 1.2) * 0.005;
        drone.position.z += dir.z * dv * dt + Math.sin(drone.userData.driftPhase * 0.9) * 0.006;

        drone.userData.shootCooldown -= dt;
        if (drone.userData.shootCooldown <= 0 && dist < 40) {
          drone.userData.shootCooldown = 2.5 + Math.random() * 2;
          var shootDir = new THREE.Vector3(
            playerPos.x - drone.position.x,
            playerPos.y - drone.position.y,
            playerPos.z - drone.position.z
          ).normalize();
          spawnDroneProjectile(drone.position.clone().addScaledVector(shootDir, 1.2), shootDir);
        }

        // face player
        drone.rotation.y = Math.atan2(playerPos.x - drone.position.x, playerPos.z - drone.position.z);
        drone.rotation.x += dt * 0.4;

      } else {
        // idle drift
        drone.position.x += vel.x * dt + Math.sin(drone.userData.driftPhase * 0.6) * 0.005;
        drone.position.y += vel.y * dt + Math.cos(drone.userData.driftPhase * 0.8) * 0.003;
        drone.position.z += vel.z * dt + Math.sin(drone.userData.driftPhase) * 0.004;
        drone.rotation.x += dt * 0.15;
        drone.rotation.y += dt * 0.2;
      }
    }
  }

  function updateProjectiles(dt) {
    var i, p, d, toRemove, idx, so;
    toRemove = [];

    for (i = 0; i < projectiles.length; i++) {
      p = projectiles[i];
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.life -= dt;

      if (p.life <= 0) {
        toRemove.push(i);
        continue;
      }

      if (!p.fromEnemy) {
        // check drone hits
        var di;
        for (di = 0; di < drones.length; di++) {
          if (!drones[di].userData.alive) continue;
          d = p.mesh.position.distanceTo(drones[di].position);
          if (d < 1.2) {
            drones[di].userData.hp -= 30;
            if (drones[di].userData.hp <= 0) {
              drones[di].userData.alive = false;
              drones[di].visible = false;
              showNotif('DRONE DESTROYED', 1.5);
            }
            toRemove.push(i);
            break;
          }
        }
      }
    }

    for (i = toRemove.length - 1; i >= 0; i--) {
      idx = toRemove[i];
      if (projectiles[idx]) {
        scene.remove(projectiles[idx].mesh);
        so = objects.indexOf(projectiles[idx].mesh);
        if (so !== -1) objects.splice(so, 1);
        projectiles.splice(idx, 1);
      }
    }
  }

  function updateTimer(dt) {
    if (!gameWon && !gameLost) {
      reEntryTime -= dt;
      if (reEntryTime <= 0) {
        reEntryTime = 0;
        gameLost = true;
        showNotif('RE-ENTRY COMPLETE — CITY DESTROYED. MISSION FAILED.', 8.0);
      }
    }
  }

  // ── public API ────────────────────────────────────────────────────────────────
  function init(sc, cam) {
    scene = sc;
    camera = cam;

    if (!raycaster) {
      raycaster = new THREE.Raycaster();
    }

    createHUD();

    keyHandler = onKeyDown;
    keyUpHandler = onKeyUp;
    mouseHandler = onMouseMove;

    document.addEventListener('keydown', keyHandler);
    document.addEventListener('keyup', keyUpHandler);
    document.addEventListener('mousemove', mouseHandler);
    document.addEventListener('click', onMouseClick);

    showNotif('SPACE DEBRIS MODULE READY — Press S then B to activate EVA', 4.0);
  }

  function update(delta) {
    if (!active) return;
    var dt = Math.min(delta || 0.016, 0.05);

    updatePlayer(dt);
    updateDebris(dt);
    updatePickups(dt);
    updateDrones(dt);
    updateProjectiles(dt);
    updateTimer(dt);
    updateHUD(dt);
  }

  function reset() {
    var i;
    for (i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    debrisChunks = [];
    debrisRotSpeeds = [];
    weaponFragments = [];
    weaponFragRotSpeeds = [];
    solarPanels = [];
    solarPanelRotSpeeds = [];
    antennae = [];
    antennaeRotSpeeds = [];
    wreckageSegments = [];
    wreckageRotSpeeds = [];
    componentPickups = [];
    componentPickupRotSpeeds = [];
    drones = [];
    droneVelocities = [];
    projectiles = [];
    componentsRecovered = 0;
    reEntryTime = 300;
    gameWon = false;
    gameLost = false;
    playerVelocity = { x: 0, y: 0, z: 0 };
    keyState = {};
    active = false;
    if (hudEl) hudEl.style.display = 'none';
    if (hudNotif) hudNotif.style.display = 'none';
  }

  return { init: init, update: update, reset: reset };
}());
