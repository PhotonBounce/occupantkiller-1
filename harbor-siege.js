window.HarborSiege = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // ── state ───────────────────────────────────────────────────────────────────
  var scene, camera, renderer, clock;
  var active = false;
  var container = null;

  // HUD
  var hudEl = null;
  var hudVisible = true;
  var lastKeyH = 0;

  // game state
  var commandosAshore = 0;
  var fuelTanksSecure = true;
  var frigateStatus = 'HOSTILE';

  // tracked disposables
  var allMeshes = [];
  var allGeos = [];
  var allMats = [];

  // animated objects
  var frigate = null;
  var speedboats = [];
  var commandoFigures = [];
  var missileBatteries = [];
  var radarAntenna = null;
  var smokeCluster = null;
  var explosionCluster = null;
  var smokeStack = null;

  // timers / animation state
  var time = 0;
  var commandoTimer = 0;
  var radarAngle = 0;
  var missileAngle = 0;
  var speedboatProgress = [0, 0];
  var commandosBoarded = [false, false, false, false, false];
  var fuelDestroyed = false;
  var explosionPulse = 0;

  // key sequence H→B
  var keySeqH = false;
  var keySeqTimer = 0;

  // ── helpers ─────────────────────────────────────────────────────────────────
  function makeMat(color, opts) {
    var params = { color: color };
    if (opts) {
      if (opts.transparent) params.transparent = true;
      if (opts.opacity !== undefined) params.opacity = opts.opacity;
      if (opts.emissive !== undefined) params.emissive = new THREE.Color(opts.emissive);
      if (opts.emissiveIntensity !== undefined) params.emissiveIntensity = opts.emissiveIntensity;
      if (opts.side !== undefined) params.side = opts.side;
    }
    var mat = new THREE.MeshLambertMaterial(params);
    allMats.push(mat);
    return mat;
  }

  function addBox(sc, w, h, d, color, x, y, z, opts) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = makeMat(color, opts);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    sc.add(mesh);
    allMeshes.push(mesh);
    allGeos.push(geo);
    return mesh;
  }

  function addCyl(sc, rt, rb, h, segs, color, x, y, z, opts) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = makeMat(color, opts);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    sc.add(mesh);
    allMeshes.push(mesh);
    allGeos.push(geo);
    return mesh;
  }

  function addSphere(sc, radius, wSegs, hSegs, color, x, y, z, opts) {
    var geo = new THREE.SphereGeometry(radius, wSegs, hSegs);
    var mat = makeMat(color, opts);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    sc.add(mesh);
    allMeshes.push(mesh);
    allGeos.push(geo);
    return mesh;
  }

  function addGroup(sc) {
    var g = new THREE.Group();
    sc.add(g);
    return g;
  }

  // ── build scene ──────────────────────────────────────────────────────────────
  function buildScene() {
    // sky & fog
    scene.background = new THREE.Color(0x8ab8d8);
    scene.fog = new THREE.Fog(0x8ab8d8, 80, 350);

    // lighting
    var ambient = new THREE.AmbientLight(0x607080, 0.7);
    scene.add(ambient);

    var sun = new THREE.DirectionalLight(0xffeedd, 1.1);
    sun.position.set(60, 90, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 400;
    sun.shadow.camera.left = -150;
    sun.shadow.camera.right = 150;
    sun.shadow.camera.top = 150;
    sun.shadow.camera.bottom = -150;
    scene.add(sun);

    var fill = new THREE.DirectionalLight(0x4488aa, 0.3);
    fill.position.set(-40, 30, -60);
    scene.add(fill);

    // ── 1. Harbor water ──────────────────────────────────────────────────────
    // Large flat box, dark navy blue
    addBox(scene, 400, 1, 400, 0x0a1a3a, 0, -0.5, 0);

    // ── 2. Frigate warship ───────────────────────────────────────────────────
    // Main hull + superstructure + turrets
    var frigateGroup = addGroup(scene);
    frigateGroup.position.set(-60, 1.5, -40);

    var frigateHull = addBox(frigateGroup, 40, 3, 10, 0x3a4a5a, 0, 0, 0);
    allMeshes.push(frigateHull);

    var frigateSuper = addBox(frigateGroup, 18, 4, 8, 0x4a5a6a, -2, 3.5, 0);
    var frigateBridge = addBox(frigateGroup, 8, 3, 7, 0x5a6a7a, 4, 6, 0);
    var frigateDeck = addBox(frigateGroup, 40, 0.5, 10, 0x2a3a4a, 0, 1.75, 0);

    // bow cap
    addBox(frigateGroup, 3, 2.5, 9, 0x3a4a5a, -21.5, 0, 0);

    // turret fore
    addCyl(frigateGroup, 1.2, 1.4, 1.5, 8, 0x2a3a4a, -12, 2.5, 0);
    addBox(frigateGroup, 3, 1, 1.5, 0x2a3a4a, -12, 3.5, 0); // gun barrel base
    addCyl(frigateGroup, 0.3, 0.3, 5, 8, 0x1a2a3a, -14.5, 3.8, 0); // barrel

    // turret aft
    addCyl(frigateGroup, 1.2, 1.4, 1.5, 8, 0x2a3a4a, 10, 2.5, 0);
    addBox(frigateGroup, 3, 1, 1.5, 0x2a3a4a, 10, 3.5, 0);
    addCyl(frigateGroup, 0.3, 0.3, 5, 8, 0x1a2a3a, 12.5, 3.8, 0);

    // mast
    addCyl(frigateGroup, 0.15, 0.15, 8, 6, 0x8a8a8a, 3, 9.5, 0);

    frigate = frigateGroup;

    // ── 3. Dock pier ─────────────────────────────────────────────────────────
    // Long flat pier, wooden planks color
    addBox(scene, 60, 1, 12, 0x7a5a3a, 10, 0.5, 20);

    // bollard posts along dock
    var bollardPositions = [-22, -12, -2, 8, 18, 28];
    for (var bp = 0; bp < bollardPositions.length; bp++) {
      addCyl(scene, 0.4, 0.5, 1.5, 8, 0x4a3a2a, bollardPositions[bp] + 10, 1.75, 26);
      addCyl(scene, 0.4, 0.5, 1.5, 8, 0x4a3a2a, bollardPositions[bp] + 10, 1.75, 14);
    }

    // dock warehouse structure
    addBox(scene, 20, 6, 8, 0x8a7a6a, 28, 3.5, 20);
    addBox(scene, 20, 0.4, 8, 0x6a5a4a, 28, 6.5, 20); // roof

    // ── 4. Coast guard patrol boat ───────────────────────────────────────────
    var cgGroup = addGroup(scene);
    cgGroup.position.set(30, 1, -20);

    addBox(cgGroup, 14, 2, 5, 0xffffff, 0, 0, 0);     // white hull
    addBox(cgGroup, 10, 1.5, 4.5, 0xdddddd, 0, 1.75, 0); // upper deck
    addBox(cgGroup, 6, 2, 4, 0xeeeeee, 2, 3, 0);      // bridge
    addCyl(cgGroup, 0.6, 0.8, 1.5, 8, 0xcccccc, -5, 2, 0); // engine housing port
    addCyl(cgGroup, 0.6, 0.8, 1.5, 8, 0xcccccc, -5, 2, 2); // engine housing star

    // red stripe
    addBox(cgGroup, 14, 0.3, 5, 0xcc2222, 0, 0.5, 0);

    // ── 5. Naval commando figures (5, black) ─────────────────────────────────
    var commandoColors = [0x111111, 0x111111, 0x111111, 0x111111, 0x111111];
    commandoFigures = [];
    for (var ci = 0; ci < 5; ci++) {
      var cGroup = addGroup(scene);
      // start positions: in two speedboats
      cGroup.position.set(-30 + ci * 0.6, 1.5, 40 + ci * 0.2);

      addBox(cGroup, 0.5, 0.8, 0.3, commandoColors[ci], 0, 0, 0); // body
      addSphere(cGroup, 0.25, 6, 6, 0x222222, 0, 0.65, 0);          // head
      addBox(cGroup, 0.15, 0.6, 0.15, commandoColors[ci], -0.35, -0.1, 0); // left arm
      addBox(cGroup, 0.15, 0.6, 0.15, commandoColors[ci], 0.35, -0.1, 0);  // right arm
      addBox(cGroup, 0.2, 0.7, 0.2, commandoColors[ci], -0.15, -0.85, 0);  // left leg
      addBox(cGroup, 0.2, 0.7, 0.2, commandoColors[ci], 0.15, -0.85, 0);   // right leg

      commandoFigures.push(cGroup);
    }

    // ── 6. Harbor security (4 guards) ───────────────────────────────────────
    var securityPositions = [
      [5, 1, 15], [18, 1, 15], [5, 1, 25], [18, 1, 25]
    ];
    for (var si = 0; si < 4; si++) {
      var sGroup = addGroup(scene);
      sGroup.position.set(securityPositions[si][0], securityPositions[si][1], securityPositions[si][2]);

      addBox(sGroup, 0.5, 0.8, 0.3, 0x334455, 0, 0, 0);  // body (navy uniform)
      addSphere(sGroup, 0.25, 6, 6, 0xd4a077, 0, 0.65, 0); // head
      addBox(sGroup, 0.15, 0.6, 0.15, 0x334455, -0.35, -0.1, 0);
      addBox(sGroup, 0.15, 0.6, 0.15, 0x334455, 0.35, -0.1, 0);
      addBox(sGroup, 0.2, 0.7, 0.2, 0x334455, -0.15, -0.85, 0);
      addBox(sGroup, 0.2, 0.7, 0.2, 0x334455, 0.15, -0.85, 0);
      // helmet
      addSphere(sGroup, 0.27, 6, 6, 0x445566, 0, 0.7, 0);
    }

    // ── 7. Missile batteries (2) ─────────────────────────────────────────────
    missileBatteries = [];
    var battPositions = [[-10, 0, -10], [20, 0, -15]];
    for (var mi = 0; mi < 2; mi++) {
      var battGroup = addGroup(scene);
      battGroup.position.set(battPositions[mi][0], 0, battPositions[mi][1]);

      // launcher base platform
      addBox(battGroup, 5, 0.8, 5, 0x556655, 0, 0.4, 0);
      // launcher arm
      addBox(battGroup, 1.5, 1, 6, 0x445544, 0, 1.5, 0);
      // missile tubes (4 tubes)
      var tubeOffsets = [-1.5, -0.5, 0.5, 1.5];
      for (var ti = 0; ti < tubeOffsets.length; ti++) {
        addCyl(battGroup, 0.2, 0.2, 4, 8, 0x667766, tubeOffsets[ti], 2.5, 1.5);
        // warhead tip
        addCyl(battGroup, 0, 0.2, 0.5, 8, 0xcc4422, tubeOffsets[ti], 4.75, 1.5);
      }
      // rotation pivot box
      addBox(battGroup, 1.2, 1.2, 1.2, 0x334433, 0, 0.9, 0);

      missileBatteries.push(battGroup);
    }

    // ── 8. Fuel tank farm (4 large cylinders) ────────────────────────────────
    var fuelPositions = [[45, 0, -5], [52, 0, -5], [45, 0, 5], [52, 0, 5]];
    for (var fi = 0; fi < 4; fi++) {
      addCyl(scene, 3.5, 3.5, 8, 12, 0x8a7755, fuelPositions[fi][0], 4, fuelPositions[fi][2]);
      // tank top dome
      addSphere(scene, 3.5, 8, 6, 0x9a8866, fuelPositions[fi][0], 8, fuelPositions[fi][2]);
      // tank bottom ring
      addCyl(scene, 3.6, 3.6, 0.4, 12, 0x6a6655, fuelPositions[fi][0], 0.2, fuelPositions[fi][2]);
    }

    // fire/explosion cluster at fuel tanks (item 17 — shown together)
    explosionCluster = addGroup(scene);
    explosionCluster.position.set(48, 12, 0);
    explosionCluster.visible = false; // starts hidden, activated in update

    var expColors = [0xff4400, 0xff8800, 0xffcc00, 0xff2200];
    var expOffsets = [
      [0, 0, 0], [1.5, 1, 0.5], [-1, 0.8, 1], [0.5, 2, -0.5], [-1.5, 1.5, -1]
    ];
    for (var ei = 0; ei < 5; ei++) {
      var eSphere = addSphere(
        explosionCluster,
        1.2 + Math.random() * 0.8, 8, 6,
        expColors[ei % expColors.length],
        expOffsets[ei][0], expOffsets[ei][1], expOffsets[ei][2],
        { emissive: expColors[ei % expColors.length], emissiveIntensity: 1.5 }
      );
    }

    // ── 9. Harbor crane ──────────────────────────────────────────────────────
    var craneGroup = addGroup(scene);
    craneGroup.position.set(-5, 0, 20);

    // base cylinder
    addCyl(craneGroup, 1.5, 2, 2, 8, 0xcc9922, 0, 1, 0);
    // vertical tower
    addBox(craneGroup, 1.5, 18, 1.5, 0xddaa33, 0, 10, 0);
    // horizontal arm
    addBox(craneGroup, 22, 1, 1, 0xddaa33, 5, 19.5, 0);
    // counterweight
    addBox(craneGroup, 3, 2, 2, 0x888888, -6, 19.5, 0);
    // hoist cable (thin box)
    addBox(craneGroup, 0.1, 6, 0.1, 0x555555, 12, 16.5, 0);
    // hook
    addBox(craneGroup, 0.8, 0.8, 0.8, 0x333333, 12, 13.5, 0);
    // support struts
    addBox(craneGroup, 0.3, 10, 0.3, 0xbb9922, 3, 15, 0);
    addBox(craneGroup, 0.3, 10, 0.3, 0xbb9922, -3, 15, 0);

    // ── 10. Speedboats (2) ───────────────────────────────────────────────────
    speedboats = [];
    var sbStartZ = [48, 52];
    for (var sbi = 0; sbi < 2; sbi++) {
      var sbGroup = addGroup(scene);
      sbGroup.position.set(-25, 0.5, sbStartZ[sbi]);

      // flat hull
      addBox(sbGroup, 8, 0.8, 3, 0x222244, 0, 0, 0);
      // raised bow
      addBox(sbGroup, 2, 0.6, 2.8, 0x333355, -3.5, 0.5, 0);
      // windscreen
      addBox(sbGroup, 2, 0.8, 2.5, 0x4466aa, 1, 0.8, 0, { transparent: true, opacity: 0.6 });
      // outboard motor
      addCyl(sbGroup, 0.3, 0.4, 1.2, 8, 0x444444, 3.5, -0.5, 1);
      addCyl(sbGroup, 0.3, 0.4, 1.2, 8, 0x444444, 3.5, -0.5, -1);
      // propeller
      addBox(sbGroup, 0.1, 0.6, 0.1, 0x666666, 3.5, -1.2, 1);
      addBox(sbGroup, 0.1, 0.6, 0.1, 0x666666, 3.5, -1.2, -1);

      speedboats.push(sbGroup);
      speedboatProgress[sbi] = 0;
    }

    // ── 11. Radar antenna ────────────────────────────────────────────────────
    var radarGroup = addGroup(scene);
    radarGroup.position.set(-55, 2, -35);

    // base box
    addBox(radarGroup, 3, 1.5, 3, 0x556677, 0, 0.75, 0);
    // mast cylinder
    addCyl(radarGroup, 0.3, 0.4, 5, 8, 0x667788, 0, 3.5, 0);

    // rotating dish assembly — nested group
    var dishGroup = addGroup(radarGroup);
    dishGroup.position.set(0, 6, 0);

    // dish frame (LineSegments)
    var dishPoints = [];
    var dishSegs = 12;
    for (var di = 0; di < dishSegs; di++) {
      var a0 = (di / dishSegs) * Math.PI * 2;
      var a1 = ((di + 1) / dishSegs) * Math.PI * 2;
      dishPoints.push(
        new THREE.Vector3(Math.cos(a0) * 2, Math.sin(a0) * 0.8, 0),
        new THREE.Vector3(Math.cos(a1) * 2, Math.sin(a1) * 0.8, 0)
      );
      dishPoints.push(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(Math.cos(a0) * 2, Math.sin(a0) * 0.8, 0)
      );
    }
    var dishGeo = new THREE.BufferGeometry().setFromPoints(dishPoints);
    var dishMat = new THREE.LineBasicMaterial({ color: 0x8899aa });
    var dishLine = new THREE.LineSegments(dishGeo, dishMat);
    dishGroup.add(dishLine);
    allGeos.push(dishGeo);
    allMats.push(dishMat);

    // dish center
    addBox(dishGroup, 0.3, 0.3, 1, 0x778899, 0, 0, 0.5);

    radarAntenna = dishGroup;

    // ── 12. Smoke stack + smoke sphere ───────────────────────────────────────
    var stackGroup = addGroup(scene);
    stackGroup.position.set(38, 0, -30);

    addCyl(stackGroup, 1.5, 2, 14, 8, 0x443333, 0, 7, 0);
    addCyl(stackGroup, 1.6, 1.5, 0.5, 8, 0x332222, 0, 14.25, 0); // rim

    // dark smoke puff (emissive)
    smokeCluster = addGroup(stackGroup);
    smokeCluster.position.set(0, 16, 0);

    var smokeOffsets = [
      [0, 0, 0], [0.8, 1.5, 0.3], [-0.6, 2.5, -0.4],
      [0.3, 4, 0.5], [-0.3, 5.5, 0]
    ];
    for (var ski = 0; ski < smokeOffsets.length; ski++) {
      var sr = 1.2 - ski * 0.12;
      addSphere(
        smokeCluster, sr, 7, 5, 0x222222,
        smokeOffsets[ski][0], smokeOffsets[ski][1], smokeOffsets[ski][2],
        { emissive: 0x111111, emissiveIntensity: 0.4 }
      );
    }

    // ── 13. Container stack (3×4 = 12 containers) ────────────────────────────
    var ctnColors = [0xcc3322, 0x2244cc, 0x22aa44, 0x888833];
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 4; col++) {
        addBox(
          scene,
          5, 2.5, 2.2,
          ctnColors[(row + col) % ctnColors.length],
          20 + col * 5.2, 1.25 + row * 2.6, -5
        );
        // container ribs
        addBox(
          scene,
          0.1, 2.4, 2.1,
          0x000000,
          20 + col * 5.2 - 2, 1.25 + row * 2.6, -5,
          { transparent: true, opacity: 0.3 }
        );
      }
    }

    // ── 14. Submarine conning tower ──────────────────────────────────────────
    var subGroup = addGroup(scene);
    subGroup.position.set(-80, -0.5, 10);

    // hull (partially submerged)
    addBox(subGroup, 35, 3.5, 7, 0x1a2a1a, 0, 0, 0);
    addBox(subGroup, 5, 1.5, 6.5, 0x1a2a1a, -16, 1, 0); // bow cap

    // conning tower
    addBox(subGroup, 6, 5, 4, 0x223322, 2, 4, 0);
    addBox(subGroup, 5, 0.5, 3.5, 0x334433, 2, 6.75, 0); // top

    // periscope
    addCyl(subGroup, 0.15, 0.15, 4, 6, 0x445544, 3, 9, 0);
    addBox(subGroup, 1.5, 0.2, 0.2, 0x445544, 3, 11.1, 0); // periscope head
    addBox(subGroup, 0.2, 0.2, 1.5, 0x445544, 2, 9, 0);  // second periscope

    // dive planes
    addBox(subGroup, 0.2, 1, 4, 0x1a2a1a, -10, -0.5, 5);
    addBox(subGroup, 0.2, 1, 4, 0x1a2a1a, -10, -0.5, -5);

    // ── 15. Harbor wall fortification ────────────────────────────────────────
    // perimeter walls
    addBox(scene, 80, 4, 2, 0x8a7a6a, -10, 2, -60); // back wall
    addBox(scene, 2, 4, 60, 0x8a7a6a, -50, 2, -30); // left wall
    addBox(scene, 2, 4, 60, 0x8a7a6a, 30, 2, -30);  // right wall

    // wall battlements (merlons)
    for (var wm = 0; wm < 8; wm++) {
      addBox(scene, 4, 1.5, 2, 0x9a8a7a, -46 + wm * 11, 4.75, -60); // back merlons
    }
    for (var wml = 0; wml < 5; wml++) {
      addBox(scene, 2, 1.5, 4, 0x9a8a7a, -50, 4.75, -55 + wml * 12); // left merlons
      addBox(scene, 2, 1.5, 4, 0x9a8a7a, 30, 4.75, -55 + wml * 12);  // right merlons
    }

    // gun positions (2 emplacements)
    addBox(scene, 6, 1, 6, 0x7a6a5a, -45, 4.5, -58);
    addBox(scene, 6, 1, 6, 0x7a6a5a, 25, 4.5, -58);

    // gun barrels
    addCyl(scene, 0.3, 0.4, 5, 8, 0x4a4a4a, -45, 5.5, -55);
    addCyl(scene, 0.3, 0.4, 5, 8, 0x4a4a4a, 25, 5.5, -55);

    // ── 16. Floodlight towers (2) ─────────────────────────────────────────────
    var floodPositions = [[-48, 0, -58], [28, 0, -58]];
    for (var fli = 0; fli < 2; fli++) {
      // post
      addCyl(scene, 0.25, 0.3, 14, 8, 0xaaaaaa, floodPositions[fli][0], 7, floodPositions[fli][1]);
      // arm
      addBox(scene, 4, 0.3, 0.3, 0x999999, floodPositions[fli][0], 14.5, floodPositions[fli][1]);
      // emissive light spheres
      addSphere(
        scene, 0.6, 8, 6, 0xffffcc,
        floodPositions[fli][0] - 1.5, 14.5, floodPositions[fli][1],
        { emissive: 0xffffcc, emissiveIntensity: 2.5 }
      );
      addSphere(
        scene, 0.6, 8, 6, 0xffffcc,
        floodPositions[fli][0] + 1.5, 14.5, floodPositions[fli][1],
        { emissive: 0xffffcc, emissiveIntensity: 2.5 }
      );
    }

    // ── Extra: water wake / harbor entrance buoys ─────────────────────────────
    var buoyPositions = [[-55, 0, 55], [-55, 0, 35], [-55, 0, 15]];
    for (var bui = 0; bui < 3; bui++) {
      addCyl(
        scene, 0.4, 0.4, 1.2, 8, 0xff4400,
        buoyPositions[bui][0], 0.6, buoyPositions[bui][1]
      );
    }

    // ── Extra: dock fuel pump / utility boxes ─────────────────────────────────
    addBox(scene, 1.5, 2, 1.5, 0x556644, -15, 1, 22);
    addBox(scene, 1.5, 2, 1.5, 0x556644, -10, 1, 22);

    // ── Extra: helicopter landing pad on dock warehouse ───────────────────────
    addBox(scene, 8, 0.1, 8, 0x555555, 28, 6.75, 20);
    addBox(scene, 6, 0.05, 0.3, 0xffdd00, 28, 6.8, 20);
    addBox(scene, 0.3, 0.05, 6, 0xffdd00, 28, 6.8, 20);

    // ── Extra: ammunition crate cluster near gun positions ────────────────────
    for (var ac = 0; ac < 3; ac++) {
      addBox(scene, 1.5, 1, 1, 0x556633, -44 + ac * 1.6, 5.5, -57);
    }
  }

  // ── HUD ──────────────────────────────────────────────────────────────────────
  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'harbor-siege-hud';
    hudEl.style.cssText = [
      'position:absolute',
      'top:14px',
      'left:14px',
      'background:rgba(0,10,30,0.75)',
      'color:#00ffcc',
      'font-family:monospace',
      'font-size:13px',
      'padding:10px 14px',
      'border:1px solid #00ffcc',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:100',
      'line-height:1.7'
    ].join(';');
    updateHUD();
    container.appendChild(hudEl);
  }

  function updateHUD() {
    if (!hudEl) return;
    hudEl.innerHTML = [
      '<b>[ HARBOR SIEGE ]</b>',
      'COMMANDOS ASHORE: ' + commandosAshore + '/5',
      'FUEL TANKS SECURE: ' + (fuelTanksSecure ? 'YES' : '<span style="color:#ff4422">NO</span>'),
      'FRIGATE STATUS: <span style="color:' + (frigateStatus === 'HOSTILE' ? '#ff4422' : '#00ffcc') + '">' + frigateStatus + '</span>',
      '<span style="color:#888">[H then B: toggle HUD]</span>'
    ].join('<br>');
  }

  // ── key handlers ────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    if (!active) return;
    var key = e.key ? e.key.toUpperCase() : '';
    if (key === 'H') {
      keySeqH = true;
      keySeqTimer = 0;
    } else if (key === 'B' && keySeqH) {
      // H then B within 400ms
      hudVisible = !hudVisible;
      if (hudEl) hudEl.style.display = hudVisible ? 'block' : 'none';
      keySeqH = false;
    }
  }

  // ── animate ──────────────────────────────────────────────────────────────────
  function update(dt) {
    if (!active) return;
    time += dt;

    // ── key sequence timer ──
    if (keySeqH) {
      keySeqTimer += dt;
      if (keySeqTimer > 0.4) {
        keySeqH = false;
        keySeqTimer = 0;
      }
    }

    // ── 1. Frigate rocks gently ──
    if (frigate) {
      frigate.rotation.z = Math.sin(time * 0.4) * 0.03;
      frigate.rotation.x = Math.sin(time * 0.3 + 1) * 0.015;
      frigate.position.y = 1.5 + Math.sin(time * 0.5) * 0.15;
    }

    // ── 2. Speedboats approach dock ──
    for (var sbi = 0; sbi < speedboats.length; sbi++) {
      if (speedboatProgress[sbi] < 1) {
        speedboatProgress[sbi] += dt * 0.08;
        if (speedboatProgress[sbi] > 1) speedboatProgress[sbi] = 1;
        var t = speedboatProgress[sbi];
        // path: from (−25, 0.5, 48+sbi*4) toward dock at (−10, 0.5, 21)
        var startX = -25, startZ = 48 + sbi * 4;
        var endX = -10 + sbi * 4, endZ = 21;
        speedboats[sbi].position.x = startX + (endX - startX) * t;
        speedboats[sbi].position.z = startZ + (endZ - startZ) * t;
        // slight bob
        speedboats[sbi].position.y = 0.5 + Math.sin(time * 3) * 0.08;
        // face direction of travel
        if (t < 0.99) {
          speedboats[sbi].rotation.y = Math.atan2(endX - startX, endZ - startZ) + Math.PI;
        }
      }
    }

    // ── 3. Commandos board from boats ──
    commandoTimer += dt;
    for (var ci = 0; ci < commandoFigures.length; ci++) {
      if (!commandosBoarded[ci] && speedboatProgress[ci < 3 ? 0 : 1] > 0.85) {
        // commando moves toward dock
        var cf = commandoFigures[ci];
        var targetX = 5 + ci * 3;
        var targetZ = 20;
        var dx = targetX - cf.position.x;
        var dz = targetZ - cf.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 0.5) {
          var speed = 3.5;
          cf.position.x += (dx / dist) * speed * dt;
          cf.position.z += (dz / dist) * speed * dt;
          // walking bob
          cf.position.y = 1.5 + Math.abs(Math.sin(time * 8 + ci)) * 0.12;
          cf.rotation.y = Math.atan2(dx, dz);
        } else {
          commandosBoarded[ci] = true;
          commandosAshore = 0;
          for (var ca = 0; ca < commandosBoarded.length; ca++) {
            if (commandosBoarded[ca]) commandosAshore++;
          }
          fuelTanksSecure = (commandosAshore < 3);
          if (commandosAshore >= 5) frigateStatus = 'RETREATING';
          else if (commandosAshore >= 3) frigateStatus = 'ENGAGING';
          updateHUD();
        }
      }
    }

    // ── 4. Missile battery rotates toward frigate ──
    missileAngle += dt * 0.4;
    for (var mi = 0; mi < missileBatteries.length; mi++) {
      missileBatteries[mi].rotation.y = Math.sin(missileAngle) * 0.6;
    }

    // ── 5. Radar antenna spins ──
    radarAngle += dt * 1.2;
    if (radarAntenna) {
      radarAntenna.rotation.y = radarAngle;
    }

    // ── 6. Smoke pulses ──
    if (smokeCluster) {
      var smokePulse = 1 + Math.sin(time * 1.5) * 0.05;
      smokeCluster.scale.set(smokePulse, 1 + Math.sin(time * 0.8) * 0.08, smokePulse);
      smokeCluster.position.y = 16 + Math.sin(time * 0.6) * 0.5;
    }

    // ── 7. Explosion / fire at fuel tanks ──
    if (commandosAshore >= 3 && !fuelDestroyed) {
      fuelDestroyed = true;
      fuelTanksSecure = false;
      if (explosionCluster) explosionCluster.visible = true;
      updateHUD();
    }
    if (explosionCluster && explosionCluster.visible) {
      explosionPulse += dt * 4;
      var ep = 1 + Math.sin(explosionPulse) * 0.25;
      explosionCluster.scale.set(ep, ep + Math.sin(explosionPulse * 1.3) * 0.15, ep);
      explosionCluster.position.y = 12 + Math.sin(explosionPulse * 0.7) * 1.5;
    }

    if (renderer) renderer.render(scene, camera);
  }

  // ── resize ───────────────────────────────────────────────────────────────────
  function onResize() {
    if (!renderer || !camera || !container) return;
    var w = container.clientWidth;
    var h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  // ── init ──────────────────────────────────────────────────────────────────────
  function init(cfg) {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: own renderer, was crashing/launching over the main game */

    container = (cfg && cfg.container) ? cfg.container : document.body;

    scene = new THREE.Scene();
    clock = new THREE.Clock();

    camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      600
    );
    camera.position.set(0, 35, 90);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    buildScene();
    buildHUD();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);

    active = true;
  }

  // ── reset / dispose ───────────────────────────────────────────────────────────
  function reset() {
    active = false;

    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('resize', onResize);

    // dispose geometries and materials
    for (var gi = 0; gi < allGeos.length; gi++) {
      allGeos[gi].dispose();
    }
    for (var mi = 0; mi < allMats.length; mi++) {
      allMats[mi].dispose();
    }

    // remove meshes from scene
    for (var oi = 0; oi < allMeshes.length; oi++) {
      if (allMeshes[oi].parent) allMeshes[oi].parent.remove(allMeshes[oi]);
    }

    // remove renderer
    if (renderer) {
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer = null;
    }

    // remove HUD
    if (hudEl && hudEl.parentNode) {
      hudEl.parentNode.removeChild(hudEl);
      hudEl = null;
    }

    // clear references
    scene = null;
    camera = null;
    clock = null;
    frigate = null;
    speedboats = [];
    commandoFigures = [];
    missileBatteries = [];
    radarAntenna = null;
    smokeCluster = null;
    explosionCluster = null;
    smokeStack = null;
    allMeshes = [];
    allGeos = [];
    allMats = [];

    // reset game state
    commandosAshore = 0;
    fuelTanksSecure = true;
    frigateStatus = 'HOSTILE';
    fuelDestroyed = false;
    time = 0;
    commandoTimer = 0;
    radarAngle = 0;
    missileAngle = 0;
    speedboatProgress = [0, 0];
    commandosBoarded = [false, false, false, false, false];
    explosionPulse = 0;
    keySeqH = false;
    keySeqTimer = 0;
    hudVisible = true;
    container = null;
  }

  return { init: init, update: update, reset: reset };
}());
