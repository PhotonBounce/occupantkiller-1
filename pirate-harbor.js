window.PirateHarbor = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // ── state ──────────────────────────────────────────────────────────────────
  var scene, camera, renderer, clock;
  var active = false;
  var container, hudEl, hudCanvas, hudCtx;
  var lastPPress = -9999;
  var keyState = {};

  // scene objects (tracked for disposal)
  var allMeshes = [];
  var allLines = [];
  var animatedObjects = [];

  // game state
  var piratesDown = 0;
  var goldSecured = 0;
  var shipDamage = 0;
  var hudVisible = true;

  // references for animation
  var shipGroup = null;
  var cannons = [];
  var pirateGroup = null;
  var marineGroup = null;
  var splashSpheres = [];
  var fireSpheres = [];
  var riggingLines = [];
  var pirateArr = [];
  var marineArr = [];
  var pirateDir = 1;
  var marineDir = -1;

  // ── keybind ────────────────────────────────────────────────────────────────
  function handleKeyDown(e) {
    keyState[e.code] = true;
    if (e.code === 'KeyP') {
      lastPPress = performance.now();
    }
    if (e.code === 'KeyH') {
      if (performance.now() - lastPPress < 400) {
        toggleHUD();
      }
    }
  }

  function handleKeyUp(e) {
    keyState[e.code] = false;
  }

  function toggleHUD() {
    hudVisible = !hudVisible;
    if (hudEl) hudEl.style.display = hudVisible ? 'block' : 'none';
  }

  // ── helpers ────────────────────────────────────────────────────────────────
  function makeMesh(geo, mat) {
    var m = new THREE.Mesh(geo, mat);
    allMeshes.push({ geo: geo, mat: mat, mesh: m });
    return m;
  }

  function makeLine(geo, mat) {
    var l = new THREE.LineSegments(geo, mat);
    allLines.push({ geo: geo, mat: mat, line: l });
    return l;
  }

  // ── scene building ─────────────────────────────────────────────────────────
  function buildScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 60, 180);

    // Lighting
    var ambient = new THREE.AmbientLight(0xffeedd, 0.6);
    scene.add(ambient);
    var sun = new THREE.DirectionalLight(0xfff5cc, 1.2);
    sun.position.set(30, 60, 20);
    scene.add(sun);

    // 1. Harbor water surface — large flat box, deep blue-green
    var waterGeo = new THREE.BoxGeometry(200, 0.4, 200);
    var waterMat = new THREE.MeshLambertMaterial({ color: 0x1a6b5a });
    var water = makeMesh(waterGeo, waterMat);
    water.position.set(0, -0.2, 0);
    scene.add(water);

    // 2 & 3. Tall ship with hull, masts, sails — shipGroup for rocking
    shipGroup = new THREE.Group();

    // Hull — large box
    var hullGeo = new THREE.BoxGeometry(14, 5, 40);
    var hullMat = new THREE.MeshLambertMaterial({ color: 0x5c3a1e });
    var hull = makeMesh(hullGeo, hullMat);
    hull.position.set(0, 2, -20);
    shipGroup.add(hull);

    // Hull deck trim
    var deckGeo = new THREE.BoxGeometry(15, 0.6, 41);
    var deckMat = new THREE.MeshLambertMaterial({ color: 0x7a4f2e });
    var deck = makeMesh(deckGeo, deckMat);
    deck.position.set(0, 4.5, -20);
    shipGroup.add(deck);

    // Bowsprit (forward angled beam)
    var bowspritGeo = new THREE.BoxGeometry(1.2, 1.2, 14);
    var bowspritMat = new THREE.MeshLambertMaterial({ color: 0x5c3a1e });
    var bowsprit = makeMesh(bowspritGeo, bowspritMat);
    bowsprit.position.set(0, 6, -38);
    bowsprit.rotation.x = -0.35;
    shipGroup.add(bowsprit);

    // Foremast (front mast) — cylinder
    var mast1Geo = new THREE.CylinderGeometry(0.35, 0.45, 22, 8);
    var mastMat = new THREE.MeshLambertMaterial({ color: 0x6b4c22 });
    var mast1 = makeMesh(mast1Geo, mastMat);
    mast1.position.set(0, 16, -28);
    shipGroup.add(mast1);

    // Mainmast (rear mast) — cylinder
    var mast2Geo = new THREE.CylinderGeometry(0.35, 0.45, 26, 8);
    var mast2 = makeMesh(mast2Geo, mastMat);
    mast2.position.set(0, 18, -12);
    shipGroup.add(mast2);

    // Mizzenmast (aft) — cylinder
    var mast3Geo = new THREE.CylinderGeometry(0.3, 0.35, 18, 8);
    var mast3 = makeMesh(mast3Geo, mastMat);
    mast3.position.set(0, 14, -2);
    shipGroup.add(mast3);

    // Sails — box panels on masts (white)
    var sailMat = new THREE.MeshLambertMaterial({ color: 0xf0ead6, side: THREE.DoubleSide });
    // Foremast lower sail
    var sail1Geo = new THREE.BoxGeometry(11, 8, 0.1);
    var sail1 = makeMesh(sail1Geo, sailMat);
    sail1.position.set(0, 12, -28);
    shipGroup.add(sail1);
    // Foremast upper sail
    var sail2Geo = new THREE.BoxGeometry(9, 6, 0.1);
    var sail2 = makeMesh(sail2Geo, sailMat);
    sail2.position.set(0, 21, -28);
    shipGroup.add(sail2);
    // Mainmast lower sail
    var sail3Geo = new THREE.BoxGeometry(13, 10, 0.1);
    var sail3 = makeMesh(sail3Geo, sailMat);
    sail3.position.set(0, 13, -12);
    shipGroup.add(sail3);
    // Mainmast upper sail
    var sail4Geo = new THREE.BoxGeometry(11, 7, 0.1);
    var sail4 = makeMesh(sail4Geo, sailMat);
    sail4.position.set(0, 23, -12);
    shipGroup.add(sail4);
    // Mizzenmast sail
    var sail5Geo = new THREE.BoxGeometry(9, 7, 0.1);
    var sail5 = makeMesh(sail5Geo, sailMat);
    sail5.position.set(0, 11, -2);
    shipGroup.add(sail5);

    scene.add(shipGroup);

    // Rope rigging — LineSegments connecting masts
    var rigPoints = [];
    // Foremast top to mainmast top
    rigPoints.push(-0.2, 27, -28,  -0.2, 31, -12);
    // Mainmast top to mizzenmast top
    rigPoints.push(-0.2, 31, -12,  -0.2, 23, -2);
    // Foremast top to hull bow
    rigPoints.push(-0.2, 27, -28,  -4, 5, -38);
    rigPoints.push( 0.2, 27, -28,   4, 5, -38);
    // Cross rigging
    rigPoints.push(-6, 18, -28,  6, 18, -28);
    rigPoints.push(-7, 24, -12,  7, 24, -12);
    rigPoints.push(-5, 18, -2,   5, 18, -2);

    var rigGeo = new THREE.BufferGeometry();
    rigGeo.setAttribute('position', new THREE.Float32BufferAttribute(rigPoints, 3));
    var rigMat = new THREE.LineBasicMaterial({ color: 0x8b7355 });
    var rig = makeLine(rigGeo, rigMat);
    scene.add(rig);

    // 4. Dock pier — long flat box
    var pierGeo = new THREE.BoxGeometry(20, 1, 60);
    var pierMat = new THREE.MeshLambertMaterial({ color: 0x8b6c42 });
    var pier = makeMesh(pierGeo, pierMat);
    pier.position.set(18, 0.5, 0);
    scene.add(pier);

    // Pier planks overlay
    var plankGeo = new THREE.BoxGeometry(20, 0.15, 60);
    var plankMat = new THREE.MeshLambertMaterial({ color: 0xa07850 });
    var plank = makeMesh(plankGeo, plankMat);
    plank.position.set(18, 1.1, 0);
    scene.add(plank);

    // 5. Cannons — 4 cannons (cylinder barrel + box carriage)
    var cannonBarrelGeo = new THREE.CylinderGeometry(0.35, 0.4, 3.5, 8);
    var cannonMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var carriageGeo = new THREE.BoxGeometry(1.4, 0.9, 2.8);
    var carriageMat = new THREE.MeshLambertMaterial({ color: 0x5c3a1e });

    var cannonPositions = [
      { x: 8, z: -14 },
      { x: 8, z: -20 },
      { x: -8, z: -14 },
      { x: -8, z: -20 }
    ];

    for (var ci = 0; ci < cannonPositions.length; ci++) {
      var cg = new THREE.Group();
      var barrel = makeMesh(new THREE.CylinderGeometry(0.35, 0.4, 3.5, 8), cannonMat);
      barrel.rotation.z = Math.PI / 2;
      barrel.position.set(1.2, 0.5, 0);
      cg.add(barrel);
      var carriage = makeMesh(new THREE.BoxGeometry(1.4, 0.9, 2.8), carriageMat);
      carriage.position.set(0, 0, 0);
      cg.add(carriage);
      cg.position.set(cannonPositions[ci].x, 5, cannonPositions[ci].z);
      shipGroup.add(cg);
      cannons.push(cg);
    }

    // 6. Pirate figures — 6 crew (box body + sphere head)
    pirateGroup = new THREE.Group();
    var pirateMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
    var pirateHeadMat = new THREE.MeshLambertMaterial({ color: 0xc68642 });
    for (var pi = 0; pi < 6; pi++) {
      var pg = new THREE.Group();
      var pbody = makeMesh(new THREE.BoxGeometry(0.8, 1.5, 0.6), pirateMat);
      pbody.position.y = 0.75;
      pg.add(pbody);
      var phead = makeMesh(new THREE.SphereGeometry(0.4, 8, 8), pirateHeadMat);
      phead.position.y = 1.9;
      pg.add(phead);
      pg.position.set(-6 + pi * 2.2, 5, -14 + (pi % 2) * 1.5);
      pirateGroup.add(pg);
      pirateArr.push(pg);
    }
    shipGroup.add(pirateGroup);

    // 7. Marine boarding party — 5 in red coats (box body + sphere head)
    marineGroup = new THREE.Group();
    var marineMat = new THREE.MeshLambertMaterial({ color: 0xcc2200 });
    var marineHeadMat = new THREE.MeshLambertMaterial({ color: 0xd4a76a });
    for (var mi = 0; mi < 5; mi++) {
      var mg = new THREE.Group();
      var mbody = makeMesh(new THREE.BoxGeometry(0.8, 1.5, 0.6), marineMat);
      mbody.position.y = 0.75;
      mg.add(mbody);
      var mhead = makeMesh(new THREE.SphereGeometry(0.4, 8, 8), marineHeadMat);
      mhead.position.y = 1.9;
      mg.add(mhead);
      mg.position.set(10, 1.5, -10 + mi * 3);
      marineGroup.add(mg);
      marineArr.push(mg);
    }
    scene.add(marineGroup);

    // 8. Warehouse building — box, dockside
    var whouseGeo = new THREE.BoxGeometry(16, 10, 22);
    var whouseMat = new THREE.MeshLambertMaterial({ color: 0xc4a882 });
    var whouse = makeMesh(whouseGeo, whouseMat);
    whouse.position.set(26, 5, -30);
    scene.add(whouse);
    // Roof
    var roofGeo = new THREE.BoxGeometry(17, 2, 23);
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    var roof = makeMesh(roofGeo, roofMat);
    roof.position.set(26, 11, -30);
    scene.add(roof);
    // Warehouse door
    var doorGeo = new THREE.BoxGeometry(3, 5, 0.4);
    var doorMat = new THREE.MeshLambertMaterial({ color: 0x5c3a1e });
    var door = makeMesh(doorGeo, doorMat);
    door.position.set(22, 3.5, -19);
    scene.add(door);

    // 10. Cannonball splashes — sphere clusters in water
    var splashMat = new THREE.MeshLambertMaterial({ color: 0xaaddcc, transparent: true, opacity: 0.75 });
    var splashPositions = [
      { x: 15, z: -5 }, { x: 12, z: -8 }, { x: 20, z: -3 },
      { x: -10, z: -25 }, { x: -8, z: -22 }
    ];
    for (var si = 0; si < splashPositions.length; si++) {
      var sg = new THREE.Group();
      for (var sj = 0; sj < 5; sj++) {
        var sp = makeMesh(new THREE.SphereGeometry(0.3 + Math.random() * 0.4, 6, 6), splashMat);
        sp.position.set(
          (Math.random() - 0.5) * 2,
          Math.random() * 0.8,
          (Math.random() - 0.5) * 2
        );
        sg.add(sp);
        splashSpheres.push(sp);
      }
      sg.position.set(splashPositions[si].x, 0.1, splashPositions[si].z);
      scene.add(sg);
    }

    // 11. Harbor crane — box beam + cylinder post
    var cranePostGeo = new THREE.CylinderGeometry(0.4, 0.5, 12, 8);
    var craneMat = new THREE.MeshLambertMaterial({ color: 0x6b4c22 });
    var cranePost = makeMesh(cranePostGeo, craneMat);
    cranePost.position.set(22, 6, -5);
    scene.add(cranePost);
    var craneBeamGeo = new THREE.BoxGeometry(10, 0.8, 0.8);
    var craneBeam = makeMesh(craneBeamGeo, craneMat);
    craneBeam.position.set(17, 12, -5);
    scene.add(craneBeam);
    var craneRopePoints = [17, 12, -5,  17, 4, -5];
    var craneRopeGeo = new THREE.BufferGeometry();
    craneRopeGeo.setAttribute('position', new THREE.Float32BufferAttribute(craneRopePoints, 3));
    var craneRope = makeLine(craneRopeGeo, new THREE.LineBasicMaterial({ color: 0x8b7355 }));
    scene.add(craneRope);

    // 12. Barrel stack — cylinder barrels stacked 3x3
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0x5c3a1e });
    var barrelRingMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 3; col++) {
        var bGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.2, 10);
        var b = makeMesh(bGeo, barrelMat);
        b.position.set(32 + col * 1.25, 0.6 + row * 1.2, -25);
        scene.add(b);
        // Barrel ring
        var rGeo = new THREE.CylinderGeometry(0.57, 0.57, 0.15, 10);
        var r = makeMesh(rGeo, barrelRingMat);
        r.position.set(32 + col * 1.25, 0.6 + row * 1.2, -25);
        scene.add(r);
      }
    }

    // 13. Treasure chest — box with sphere lid clasp
    var chestGeo = new THREE.BoxGeometry(2.5, 1.8, 1.8);
    var chestMat = new THREE.MeshLambertMaterial({ color: 0x8b6c42 });
    var chest = makeMesh(chestGeo, chestMat);
    chest.position.set(25, 2, -20);
    scene.add(chest);
    var claspGeo = new THREE.SphereGeometry(0.22, 8, 8);
    var claspMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
    var clasp = makeMesh(claspGeo, claspMat);
    clasp.position.set(25, 2.85, -19.1);
    scene.add(clasp);
    // Chest lid
    var lidGeo = new THREE.BoxGeometry(2.5, 0.5, 1.8);
    var lid = makeMesh(lidGeo, chestMat);
    lid.position.set(25, 2.95, -20);
    scene.add(lid);

    // 14. Jolly Roger flag — box flag + LineSegments flag lines
    var flagpoleGeo = new THREE.CylinderGeometry(0.12, 0.12, 5, 6);
    var flagpoleMat = new THREE.MeshLambertMaterial({ color: 0x6b4c22 });
    var flagpole = makeMesh(flagpoleGeo, flagpoleMat);
    flagpole.position.set(0, 30.5, -12);
    shipGroup.add(flagpole);

    var flagGeo = new THREE.BoxGeometry(4, 2.5, 0.1);
    var flagMat = new THREE.MeshLambertMaterial({ color: 0x111111, side: THREE.DoubleSide });
    var flag = makeMesh(flagGeo, flagMat);
    flag.position.set(2.2, 32.5, -12);
    shipGroup.add(flag);

    // Skull crossbones on flag using lines
    var skullPts = [
      -0.5, 32.5, -11.9,  0.5, 32.5, -11.9,
      0.5, 32.5, -11.9,   0.5, 33.2, -11.9,
      0.5, 33.2, -11.9,  -0.5, 33.2, -11.9,
      -0.5, 33.2, -11.9, -0.5, 32.5, -11.9,
      // crossbones
      0,  32.2, -11.9,   4.4, 32.8, -11.9,
      0,  32.8, -11.9,   4.4, 32.2, -11.9
    ];
    var skullGeo = new THREE.BufferGeometry();
    skullGeo.setAttribute('position', new THREE.Float32BufferAttribute(skullPts, 3));
    var skullLine = makeLine(skullGeo, new THREE.LineBasicMaterial({ color: 0xffffff }));
    shipGroup.add(skullLine);

    // 15. Watchtower — tall box tower on dock
    var towerGeo = new THREE.BoxGeometry(4, 18, 4);
    var towerMat = new THREE.MeshLambertMaterial({ color: 0xb8a87a });
    var tower = makeMesh(towerGeo, towerMat);
    tower.position.set(28, 9, 20);
    scene.add(tower);
    var battlementGeo = new THREE.BoxGeometry(5, 2.5, 5);
    var battlement = makeMesh(battlementGeo, towerMat);
    battlement.position.set(28, 19.25, 20);
    scene.add(battlement);
    // Tower window
    var windowGeo = new THREE.BoxGeometry(1.2, 1.8, 0.4);
    var windowMat = new THREE.MeshLambertMaterial({ color: 0x222244 });
    var twin = makeMesh(windowGeo, windowMat);
    twin.position.set(26, 12, 20);
    scene.add(twin);

    // 16. Two rowboats — small flat box + cylinder oars
    var rowboatMat = new THREE.MeshLambertMaterial({ color: 0x7a5230 });
    var oarMat = new THREE.MeshLambertMaterial({ color: 0xa07840 });
    var rowboatPos = [{ x: 12, z: 10 }, { x: 16, z: 14 }];
    for (var ri = 0; ri < 2; ri++) {
      var rb = makeMesh(new THREE.BoxGeometry(5, 0.8, 2.2), rowboatMat);
      rb.position.set(rowboatPos[ri].x, 0.4, rowboatPos[ri].z);
      scene.add(rb);
      // oars
      var oar1 = makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 6), oarMat);
      oar1.rotation.z = Math.PI / 2;
      oar1.position.set(rowboatPos[ri].x - 0.5, 0.85, rowboatPos[ri].z - 1.4);
      scene.add(oar1);
      var oar2 = makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 6), oarMat);
      oar2.rotation.z = Math.PI / 2;
      oar2.position.set(rowboatPos[ri].x - 0.5, 0.85, rowboatPos[ri].z + 1.4);
      scene.add(oar2);
    }

    // 17. Fire/explosion effect — emissive sphere cluster at ship hull
    var fireMats = [
      new THREE.MeshLambertMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 1.5 }),
      new THREE.MeshLambertMaterial({ color: 0xff8800, emissive: 0xff6600, emissiveIntensity: 1.2 }),
      new THREE.MeshLambertMaterial({ color: 0xffdd00, emissive: 0xffaa00, emissiveIntensity: 1.0 })
    ];
    var firePositions = [
      { x: 6, y: 5.5, z: -14 },
      { x: 5, y: 5.2, z: -13 },
      { x: 7, y: 5.8, z: -15 },
      { x: 6, y: 6.2, z: -13 },
      { x: 5.5, y: 5.5, z: -14 },
      { x: 6.5, y: 6, z: -14 }
    ];
    for (var fi = 0; fi < firePositions.length; fi++) {
      var fmat = fireMats[fi % 3];
      var fgeo = new THREE.SphereGeometry(0.3 + Math.random() * 0.35, 6, 6);
      var fs = makeMesh(fgeo, fmat);
      fs.position.set(firePositions[fi].x, firePositions[fi].y, firePositions[fi].z);
      shipGroup.add(fs);
      fireSpheres.push({ mesh: fs, mat: fmat, base: fmat.emissiveIntensity, phase: Math.random() * Math.PI * 2 });
    }
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.style.cssText = [
      'position:absolute',
      'top:16px',
      'left:16px',
      'pointer-events:none',
      'z-index:10'
    ].join(';');

    hudCanvas = document.createElement('canvas');
    hudCanvas.width = 300;
    hudCanvas.height = 90;
    hudEl.appendChild(hudCanvas);
    container.appendChild(hudEl);

    hudCtx = hudCanvas.getContext('2d');
  }

  function updateHUD() {
    if (!hudCtx) return;
    hudCtx.clearRect(0, 0, 300, 90);
    hudCtx.fillStyle = 'rgba(0,0,0,0.55)';
    hudCtx.beginPath();
    hudCtx.roundRect(0, 0, 300, 90, 8);
    hudCtx.fill();

    hudCtx.font = 'bold 15px monospace';
    hudCtx.fillStyle = '#ffe44d';
    hudCtx.fillText('PIRATES DOWN: ' + piratesDown + '/6', 14, 26);

    hudCtx.fillStyle = '#44ffaa';
    hudCtx.fillText('GOLD SECURED: ' + goldSecured + '%', 14, 50);

    var statusColor = shipDamage > 50 ? '#ff4444' : shipDamage > 20 ? '#ffaa44' : '#44ff88';
    var statusText = shipDamage > 50 ? 'CRITICAL' : shipDamage > 20 ? 'DAMAGED' : 'INTACT';
    hudCtx.fillStyle = statusColor;
    hudCtx.fillText('SHIP STATUS: ' + statusText, 14, 74);

    hudCtx.font = '11px monospace';
    hudCtx.fillStyle = 'rgba(255,255,255,0.55)';
    hudCtx.fillText('[P then H] toggle HUD', 160, 82);
  }

  // ── animation ──────────────────────────────────────────────────────────────
  function update(delta) {
    if (!active) return;
    var t = clock.getElapsedTime();

    // Ship rocks gently
    if (shipGroup) {
      shipGroup.rotation.z = Math.sin(t * 0.4) * 0.025;
      shipGroup.rotation.x = Math.sin(t * 0.28) * 0.015;
      shipGroup.position.y = Math.sin(t * 0.35) * 0.3;
    }

    // Cannons rotate toward marines (oscillate aiming)
    for (var ci = 0; ci < cannons.length; ci++) {
      cannons[ci].rotation.y = Math.sin(t * 0.6 + ci * 0.4) * 0.18;
    }

    // Pirates advance toward marines (z axis, within range)
    for (var pi = 0; pi < pirateArr.length; pi++) {
      var p = pirateArr[pi];
      p.position.z += delta * 0.4 * pirateDir;
      if (p.position.z > -10) pirateDir = -1;
      if (p.position.z < -16) pirateDir = 1;
      // Swinging motion
      p.rotation.z = Math.sin(t * 2 + pi * 0.8) * 0.18;
    }

    // Marines advance toward pirates
    for (var mi = 0; mi < marineArr.length; mi++) {
      var m = marineArr[mi];
      m.position.z += delta * 0.35 * marineDir;
      if (m.position.z > -2) marineDir = -1;
      if (m.position.z < -16) marineDir = 1;
    }

    // Cannonball splashes pulse in/out
    for (var si = 0; si < splashSpheres.length; si++) {
      var sc = Math.abs(Math.sin(t * 1.8 + si * 0.7)) * 0.9 + 0.4;
      splashSpheres[si].scale.setScalar(sc);
    }

    // Fire flickers emissive intensity
    for (var fi = 0; fi < fireSpheres.length; fi++) {
      var f = fireSpheres[fi];
      f.mat.emissiveIntensity = f.base * (0.7 + Math.sin(t * 8 + f.phase) * 0.5 + Math.random() * 0.3);
    }

    // Progress simulated counters slowly
    if (t > 5 && t < 20) {
      piratesDown = Math.min(6, Math.floor((t - 5) * 0.4));
      goldSecured = Math.min(100, Math.floor((t - 5) * 5));
      shipDamage = Math.min(55, Math.floor((t - 5) * 3));
    }

    updateHUD();
  }

  // ── activate / deactivate ──────────────────────────────────────────────────
  function activate() {
    active = true;
  }

  // ── init ───────────────────────────────────────────────────────────────────
  function init(opts) {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: own renderer, was crashing/launching over the main game */

    opts = opts || {};
    container = opts.container || document.body;

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    container.appendChild(renderer.domElement);

    // Camera
    camera = new THREE.PerspectiveCamera(
      65,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.1,
      500
    );
    camera.position.set(35, 18, 30);
    camera.lookAt(0, 5, -15);

    clock = new THREE.Clock();

    buildScene();
    buildHUD();

    active = true;

    // Events
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Resize
    window.addEventListener('resize', onResize);

    // Render loop
    renderer.setAnimationLoop(function () {
      var delta = clock.getDelta();
      update(delta);
      if (renderer) renderer.render(scene, camera);
    });
  }

  function onResize() {
    if (!renderer || !camera) return;
    var w = container.clientWidth || window.innerWidth;
    var h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  // ── reset / dispose ────────────────────────────────────────────────────────
  function reset() {
    active = false;

    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('resize', onResize);

    if (renderer) {
      renderer.setAnimationLoop(null);
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer = null;
    }

    for (var i = 0; i < allMeshes.length; i++) {
      if (allMeshes[i].geo) allMeshes[i].geo.dispose();
      if (allMeshes[i].mat) allMeshes[i].mat.dispose();
    }
    for (var j = 0; j < allLines.length; j++) {
      if (allLines[j].geo) allLines[j].geo.dispose();
      if (allLines[j].mat) allLines[j].mat.dispose();
    }

    allMeshes = [];
    allLines = [];
    animatedObjects = [];
    cannons = [];
    pirateArr = [];
    marineArr = [];
    splashSpheres = [];
    fireSpheres = [];
    pirateGroup = null;
    marineGroup = null;
    shipGroup = null;

    piratesDown = 0;
    goldSecured = 0;
    shipDamage = 0;

    if (hudEl && hudEl.parentNode) {
      hudEl.parentNode.removeChild(hudEl);
      hudEl = null;
    }

    scene = null;
    camera = null;
    clock = null;
  }

  // ── public API ─────────────────────────────────────────────────────────────
  return { init: init, update: update, reset: reset };

}());
