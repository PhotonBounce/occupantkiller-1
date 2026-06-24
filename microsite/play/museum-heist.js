window.MuseumHeist = (function () {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    // activation keys M+H simultaneous within 400ms
    mDown: false,
    hDown: false,
    mDownTime: 0,
    hDownTime: 0,
    // scene
    scene: null,
    camera: null,
    renderer: null,
    animFrameId: null,
    lastTime: 0,
    clock: null,
    // player
    playerPos: { x: 0, y: 1.7, z: 35 },
    playerYaw: 0,
    playerPitch: 0,
    playerHP: 100,
    playerSpeed: 5,
    crouching: false,
    moveKeys: {},
    pointerLocked: false,
    // timing
    heistTimer: 600,       // 10 minutes in seconds
    heistStarted: false,
    // stealth
    stealthStatus: 'CLEAR',  // CLEAR | COMPROMISED | ALARM
    alarmTriggered: false,
    alarmTimer: 0,
    policeTimer: 240,      // 4 minutes
    policeArrived: false,
    // artifacts [golden mask, roman sword, diamond sculpture, renaissance painting, crown jewels]
    artifactsCollected: 0,
    artifactStates: [false, false, false, false, false],
    artifactMeshes: [],
    artifactLights: [],
    // interact
    interacting: false,
    interactTarget: null,
    interactProgress: 0,
    interactDuration: 0,
    interactEl: null,
    // guards
    guards: [],
    guardsConscious: 0,
    // cameras
    cameras3d: [],
    cameraDisabled: [],
    // laser trip wires
    lasers: [],
    laserCut: [],
    // pressure plates
    pressurePlates: [],
    pressurePlateDisabled: [],
    // motion detectors
    motionDetectors: [],
    motionDetectorDisabled: [],
    // vault
    vaultLocked: true,
    hasKeycard: false,
    keycardMesh: null,
    vaultDoor: null,
    crackingVault: false,
    // tools inventory
    smokePellets: 3,
    empPenUses: 3,
    laserCutterHas: true,
    // smoke effects
    smokeEffects: [],
    // escape van
    escapeVanMesh: null,
    escaped: false,
    // win / lose
    missionClear: false,
    missionFailed: false,
    failReason: '',
    // HUD
    hudEl: null,
    promptEl: null,
    endEl: null,
    // events
    keydownHandler: null,
    keyupHandler: null,
    mousemoveHandler: null,
    clickHandler: null,
    // sarcophagus meshes for antiquities
    sarcophagi: [],
    // arms display meshes
    armorSuits: [],
    // director office keycard spot
    directorOfficeMesh: null,
    // ventilation shaft
    ventShaftOpen: false,
    ventShaftMesh: null,
    // interact throttle
    lastInteractTime: 0,
    // taser
    taserCooldown: 0,
    // container for all added objects (for reset)
    sceneObjects: []
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  function pad2(n) {
    return (n < 10 ? '0' : '') + Math.floor(n);
  }

  function toMM_SS(s) {
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return pad2(m) + ':' + pad2(sec);
  }

  function makeBox(w, h, d, colorHex, x, y, z, opacity) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var matOpts = { color: colorHex };
    if (opacity !== undefined && opacity < 1) {
      matOpts.transparent = true;
      matOpts.opacity = opacity;
    }
    var mat = new THREE.MeshLambertMaterial(matOpts);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : h / 2, z || 0);
    return mesh;
  }

  function makeCylinder(rt, rb, h, colorHex, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
    var mat = new THREE.MeshLambertMaterial({ color: colorHex });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : h / 2, z || 0);
    return mesh;
  }

  function makeSphere(r, colorHex, x, y, z) {
    var geo = new THREE.SphereGeometry(r, 12, 8);
    var mat = new THREE.MeshLambertMaterial({ color: colorHex });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || r, z || 0);
    return mesh;
  }

  function makeCone(r, h, colorHex, x, y, z) {
    var geo = new THREE.ConeGeometry(r, h, 8);
    var mat = new THREE.MeshLambertMaterial({ color: colorHex });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || h / 2, z || 0);
    return mesh;
  }

  function makeLineSegments(points, colorHex) {
    var geo = new THREE.BufferGeometry();
    var verts = new Float32Array(points.length * 3);
    for (var i = 0; i < points.length; i++) {
      verts[i * 3] = points[i][0];
      verts[i * 3 + 1] = points[i][1];
      verts[i * 3 + 2] = points[i][2];
    }
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    var mat = new THREE.LineBasicMaterial({ color: colorHex });
    return new THREE.LineSegments(geo, mat);
  }

  function addPointLight(scene, color, intensity, x, y, z, distance) {
    var light = new THREE.PointLight(color, intensity, distance || 8);
    light.position.set(x, y, z);
    scene.add(light);
    return light;
  }

  function dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function dist3D(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function sceneAdd(mesh) {
    state.scene.add(mesh);
    state.sceneObjects.push(mesh);
    return mesh;
  }

  // ─── Build Scene ──────────────────────────────────────────────────────────────
  function buildScene() {
    var s = state.scene;

    // Lighting — dark 3AM museum
    var ambient = new THREE.AmbientLight(0x111133, 0.5);
    s.add(ambient);
    var moonlight = new THREE.DirectionalLight(0x334466, 0.3);
    moonlight.position.set(-10, 30, 20);
    s.add(moonlight);

    // ── FLOOR (ground outside) ───────────────────────────────────────────────
    var ground = makeBox(200, 0.5, 200, 0x333322, 0, -0.25, 0);
    sceneAdd(ground);

    // ── MUSEUM EXTERIOR ───────────────────────────────────────────────────────
    // Facade: BoxGeometry 60x20x40 (0x887766)
    // We'll build it as hollow walls so player can move inside
    // Floor of museum
    var museumFloor = makeBox(60, 0.5, 40, 0x665544, 0, -0.25, 0);
    sceneAdd(museumFloor);

    // Exterior walls (north, south, east, west)
    var extWallN = makeBox(60, 20, 1, 0x887766, 0, 10, -20);
    sceneAdd(extWallN);
    var extWallS = makeBox(60, 20, 1, 0x887766, 0, 10, 20);
    sceneAdd(extWallS);
    var extWallE = makeBox(1, 20, 40, 0x887766, 30, 10, 0);
    sceneAdd(extWallE);
    var extWallW = makeBox(1, 20, 40, 0x887766, -30, 10, 0);
    sceneAdd(extWallW);

    // Skylight glass top (partial) — translucent box at top center
    var skylight = makeBox(20, 0.3, 14, 0xAADDFF, 0, 20, 0, 0.35);
    sceneAdd(skylight);

    // Ventilation shaft — access point on roof northeast corner
    var ventShaft = makeBox(2, 2, 2, 0x667766, 25, 20, -15);
    sceneAdd(ventShaft);
    state.ventShaftMesh = ventShaft;

    // Vent cover (removable)
    var ventCover = makeBox(2, 0.2, 2, 0x888888, 25, 21.1, -15);
    sceneAdd(ventCover);
    state.ventShaftMesh._cover = ventCover;

    // ── HALL OF ANTIQUITIES (left wing, z negative) ───────────────────────────
    // BoxGeometry 40x8x30 (0x998877) centered at (-5, 4, -5)
    var antiqueFloor = makeBox(40, 0.3, 30, 0x998877, -5, 0.15, -5);
    sceneAdd(antiqueFloor);
    var antiqueWallN = makeBox(40, 8, 0.3, 0x887766, -5, 4, -20);
    sceneAdd(antiqueWallN);
    var antiqueWallS = makeBox(40, 8, 0.3, 0x887766, -5, 4, 10);
    sceneAdd(antiqueWallS);
    // interior column rows
    for (var ci = 0; ci < 4; ci++) {
      var col = makeCylinder(0.4, 0.4, 7, 0xBBAAAA, -20 + ci * 10, 3.5, -5);
      sceneAdd(col);
      var capTop = makeBox(1, 0.4, 1, 0xCCBBAA, -20 + ci * 10, 7.2, -5);
      sceneAdd(capTop);
    }

    // Egyptian vases (SphereGeometry)
    var vasePositions = [
      [-18, 0.6, -15], [-14, 0.6, -15], [-10, 0.6, -15],
      [-18, 0.6, 5],   [-14, 0.6, 5]
    ];
    for (var vi = 0; vi < vasePositions.length; vi++) {
      var vp = vasePositions[vi];
      var vase = makeSphere(0.35, 0xCC9933, vp[0], vp[1], vp[2]);
      sceneAdd(vase);
      // pedestal
      var ped = makeBox(0.5, 0.5, 0.5, 0x887755, vp[0], 0.25, vp[2]);
      sceneAdd(ped);
    }

    // Sarcophagi (BoxGeometry)
    var sarcoPositions = [
      [-22, 1.5, -12], [-22, 1.5, -2], [-22, 1.5, 4]
    ];
    for (var si = 0; si < sarcoPositions.length; si++) {
      var sp = sarcoPositions[si];
      var sarco = makeBox(1, 2.5, 0.8, 0xCC9944, sp[0], sp[1], sp[2]);
      sceneAdd(sarco);
      // decorative lid lines
      var lidLines = makeLineSegments([
        [sp[0] - 0.5, sp[1] + 0.5, sp[2] - 0.4],
        [sp[0] + 0.5, sp[1] + 0.5, sp[2] - 0.4],
        [sp[0], sp[1] + 1.2, sp[2] - 0.4],
        [sp[0], sp[1] - 0.5, sp[2] - 0.4]
      ], 0xFFCC66);
      sceneAdd(lidLines);
    }

    // Display cases for antiquities (glass box)
    var case1 = makeBox(2, 2, 1.5, 0xAADDFF, -8, 1, -14, 0.25);
    sceneAdd(case1);

    // ARTIFACT 1: Golden Mask (BoxGeometry gold + PointLight) in case
    var goldenMaskMesh = makeBox(0.6, 0.8, 0.15, 0xFFAA00, -8, 1.5, -14);
    sceneAdd(goldenMaskMesh);
    state.artifactMeshes[0] = goldenMaskMesh;
    var maskLight = addPointLight(s, 0xFFCC00, 1.5, -8, 2, -14, 6);
    state.artifactLights[0] = maskLight;
    goldenMaskMesh._artifactIndex = 0;
    goldenMaskMesh._interactDuration = 2;
    goldenMaskMesh._label = 'Golden Mask';

    // ── HALL OF ARMS (right wing) ─────────────────────────────────────────────
    // BoxGeometry 35x8x25 (0x887766) centered at (12, 4, -5)
    var armsFloor = makeBox(35, 0.3, 25, 0x776655, 12, 0.15, -5);
    sceneAdd(armsFloor);
    var armsWallN = makeBox(35, 8, 0.3, 0x887766, 12, 4, -17.5);
    sceneAdd(armsWallN);
    var armsWallS = makeBox(35, 8, 0.3, 0x887766, 12, 4, 7.5);
    sceneAdd(armsWallS);
    var armsWallE2 = makeBox(0.3, 8, 25, 0x887766, 29.5, 4, -5);
    sceneAdd(armsWallE2);

    // Medieval weapon display racks (LineSegments)
    var weaponRackPositions = [
      [8, -12], [12, -12], [16, -12], [20, -12],
      [8, 2],  [12, 2],   [16, 2]
    ];
    for (var wi = 0; wi < weaponRackPositions.length; wi++) {
      var wrp = weaponRackPositions[wi];
      // Rack frame
      var rack = makeLineSegments([
        [wrp[0] - 0.5, 1, wrp[1]],
        [wrp[0] + 0.5, 1, wrp[1]],
        [wrp[0] - 0.5, 4, wrp[1]],
        [wrp[0] + 0.5, 4, wrp[1]],
        [wrp[0] - 0.5, 1, wrp[1]],
        [wrp[0] - 0.5, 4, wrp[1]],
        [wrp[0] + 0.5, 1, wrp[1]],
        [wrp[0] + 0.5, 4, wrp[1]]
      ], 0x886644);
      sceneAdd(rack);
    }

    // ARTIFACT 2: Roman Sword (LineSegments) on wall mount at x=28, z=-10
    var swordLines = makeLineSegments([
      [28, 2.5, -10], [28, 4.5, -10],   // blade
      [27.7, 3, -10], [28.3, 3, -10],   // guard cross
      [27.9, 2.2, -10], [28.1, 2.2, -10] // pommel
    ], 0xCCCCCC);
    sceneAdd(swordLines);
    state.artifactMeshes[1] = swordLines;
    // Marker box for interaction (invisible-ish)
    var swordMarker = makeBox(0.8, 2.5, 0.4, 0xCCCCCC, 28, 3.3, -10, 0.1);
    sceneAdd(swordMarker);
    swordLines._markerMesh = swordMarker;
    swordMarker._artifactIndex = 1;
    swordMarker._interactDuration = 1.5;
    swordMarker._label = 'Roman Sword';

    // Suits of armor (BoxGeometry)
    var armorPositions = [
      [10, 4, -15], [14, 4, -15], [18, 4, -15],
      [10, 4, 5],   [14, 4, 5]
    ];
    for (var ai = 0; ai < armorPositions.length; ai++) {
      var ap = armorPositions[ai];
      // body
      var armorBody = makeBox(0.7, 1.4, 0.5, 0x777788, ap[0], ap[1], ap[2]);
      sceneAdd(armorBody);
      // helmet
      var armorHelm = makeBox(0.5, 0.5, 0.5, 0x666677, ap[0], ap[1] + 1, ap[2]);
      sceneAdd(armorHelm);
    }

    // ── MODERN ART WING (front/center) ────────────────────────────────────────
    // BoxGeometry 30x8x20 (0x998888) centered at (0, 4, 14)
    var modernFloor = makeBox(30, 0.3, 20, 0x887777, 0, 0.15, 14);
    sceneAdd(modernFloor);
    var modernWallN = makeBox(30, 8, 0.3, 0x998888, 0, 4, 4);
    sceneAdd(modernWallN);
    var modernWallS = makeBox(30, 8, 0.3, 0x998888, 0, 4, 24);
    sceneAdd(modernWallS);
    var modernWallE3 = makeBox(0.3, 8, 20, 0x998888, 15, 4, 14);
    sceneAdd(modernWallE3);
    var modernWallW3 = makeBox(0.3, 8, 20, 0x998888, -15, 4, 14);
    sceneAdd(modernWallW3);

    // Abstract sculptures (SphereGeometry + BoxGeometry combos)
    var sculpt1Body = makeSphere(0.8, 0x7799AA, -10, 2, 8);
    sceneAdd(sculpt1Body);
    var sculpt1Top = makeBox(0.5, 1.2, 0.5, 0x6688AA, -10, 3.4, 8);
    sceneAdd(sculpt1Top);

    var sculpt2Body = makeBox(1, 1.6, 0.3, 0xAA8877, 8, 1.8, 8);
    sceneAdd(sculpt2Body);
    var sculpt2Orb = makeSphere(0.5, 0xBB9988, 8, 3.5, 8);
    sceneAdd(sculpt2Orb);

    // ARTIFACT 3: Diamond Sculpture (SphereGeometry + PointLight) on pedestal, with trip wire
    var diamondPed = makeBox(0.8, 1, 0.8, 0x666655, 0, 0.5, 12);
    sceneAdd(diamondPed);
    var diamondSculpt = makeSphere(0.5, 0xAAFFFF, 0, 1.5, 12);
    sceneAdd(diamondSculpt);
    state.artifactMeshes[2] = diamondSculpt;
    var diamondLight = addPointLight(s, 0x88FFFF, 2, 0, 2, 12, 8);
    state.artifactLights[2] = diamondLight;
    diamondSculpt._artifactIndex = 2;
    diamondSculpt._interactDuration = 1;
    diamondSculpt._label = 'Diamond Sculpture';

    // Trip wire laser around diamond (LineSegments red) — two crossing beams
    var laserA = makeLineSegments([
      [-3, 1.1, 12], [3, 1.1, 12]
    ], 0xFF0000);
    sceneAdd(laserA);
    laserA._laserIndex = 0;
    laserA._ax = -3; laserA._az = 12;
    laserA._bx = 3;  laserA._bz = 12;
    state.lasers.push(laserA);
    state.laserCut.push(false);

    var laserB = makeLineSegments([
      [0, 1.1, 9], [0, 1.1, 15]
    ], 0xFF0000);
    sceneAdd(laserB);
    laserB._laserIndex = 1;
    laserB._ax = 0; laserB._az = 9;
    laserB._bx = 0; laserB._bz = 15;
    state.lasers.push(laserB);
    state.laserCut.push(false);

    // ARTIFACT 4: Renaissance Painting (BoxGeometry flat) on wall
    var paintingFrame = makeBox(2.5, 1.8, 0.12, 0x553300, -13, 4.5, 4.2);
    sceneAdd(paintingFrame);
    var paintingCanvas = makeBox(2, 1.4, 0.05, 0x994422, -13, 4.5, 4.12);
    sceneAdd(paintingCanvas);
    state.artifactMeshes[3] = paintingCanvas;
    paintingCanvas._artifactIndex = 3;
    paintingCanvas._interactDuration = 4;
    paintingCanvas._label = 'Renaissance Painting';
    paintingFrame._interactChild = paintingCanvas;

    // Laser fence across modern art wing entry (LineSegments)
    for (var lfi = 0; lfi < 3; lfi++) {
      var lfh = 0.5 + lfi * 0.4;
      var lfBeam = makeLineSegments([
        [-14.5, lfh, 4.5], [14.5, lfh, 4.5]
      ], 0xFF0000);
      sceneAdd(lfBeam);
      lfBeam._laserIndex = 2 + lfi;
      lfBeam._ax = -14.5; lfBeam._az = 4.5;
      lfBeam._bx = 14.5;  lfBeam._bz = 4.5;
      state.lasers.push(lfBeam);
      state.laserCut.push(false);
    }

    // Pressure plates (BoxGeometry flush with floor, 0x888888) in modern wing
    var ppPositions = [
      [5, 10], [-5, 10], [0, 18], [8, 16]
    ];
    for (var ppi = 0; ppi < ppPositions.length; ppi++) {
      var ppXZ = ppPositions[ppi];
      var pp = makeBox(1, 0.05, 1, 0x888888, ppXZ[0], 0.025, ppXZ[1]);
      sceneAdd(pp);
      pp._ppIndex = ppi;
      state.pressurePlates.push(pp);
      state.pressurePlateDisabled.push(false);
    }

    // Motion detectors (BoxGeometry 0x333377) with cone indicators
    var mdPositions = [
      [-12, 3, 6], [10, 3, 6], [0, 3, 22]
    ];
    for (var mdi = 0; mdi < mdPositions.length; mdi++) {
      var mdp = mdPositions[mdi];
      var mdBox = makeBox(0.3, 0.3, 0.3, 0x333377, mdp[0], mdp[1], mdp[2]);
      sceneAdd(mdBox);
      // infrared cone indicator
      var mdCone = makeCone(1.5, 3, 0x330033, mdp[0], mdp[1] - 1.5, mdp[2]);
      mdCone.material.transparent = true;
      mdCone.material.opacity = 0.25;
      sceneAdd(mdCone);
      mdBox._mdIndex = mdi;
      mdBox._coneRef = mdCone;
      state.motionDetectors.push(mdBox);
      state.motionDetectorDisabled.push(false);
    }

    // ── DIRECTOR'S VAULT (back room, most secure) ─────────────────────────────
    // BoxGeometry 15x6x12 (0x887755)
    var vaultFloor = makeBox(15, 0.3, 12, 0x887755, -22, 0.15, -14);
    sceneAdd(vaultFloor);
    var vaultWallN = makeBox(15, 6, 0.5, 0x776644, -22, 3, -20);
    sceneAdd(vaultWallN);
    var vaultWallS = makeBox(15, 6, 0.5, 0x776644, -22, 3, -8);
    sceneAdd(vaultWallS);
    var vaultWallE4 = makeBox(0.5, 6, 12, 0x776644, -14.5, 3, -14);
    sceneAdd(vaultWallE4);
    var vaultWallW4 = makeBox(0.5, 6, 12, 0x776644, -29.5, 3, -14);
    sceneAdd(vaultWallW4);
    var vaultCeiling = makeBox(15, 0.4, 12, 0x665533, -22, 6.2, -14);
    sceneAdd(vaultCeiling);

    // Vault door (BoxGeometry)
    var vaultDoor = makeBox(3, 5, 0.6, 0x445533, -22, 2.5, -8);
    sceneAdd(vaultDoor);
    state.vaultDoor = vaultDoor;

    // Biometric keypad
    var bioPad = makeBox(0.4, 0.6, 0.15, 0x223322, -20, 2, -8);
    sceneAdd(bioPad);
    bioPad._label = 'Biometric Keypad';
    bioPad._isBioPad = true;
    bioPad._interactDuration = 5;

    // Director's office keycard location (inside a desk)
    var dirDesk = makeBox(2, 0.8, 1, 0x886644, -25, 0.4, 2);
    sceneAdd(dirDesk);
    var keycardMesh = makeBox(0.3, 0.05, 0.5, 0x22AAFF, -25, 0.82, 2);
    sceneAdd(keycardMesh);
    state.keycardMesh = keycardMesh;
    keycardMesh._label = 'Director Keycard';
    keycardMesh._isKeycard = true;
    keycardMesh._interactDuration = 0.5;

    // ARTIFACT 5: Crown Jewels (SphereGeometry cluster + PointLight) in vault safe
    var safeMesh = makeBox(1.5, 1.5, 1, 0x444433, -27, 0.75, -18);
    sceneAdd(safeMesh);
    var safeDoor = makeBox(1.5, 1.5, 0.1, 0x556644, -27, 0.75, -17.45);
    sceneAdd(safeDoor);
    safeDoor._label = 'Vault Safe';
    safeDoor._isSafe = true;
    safeDoor._interactDuration = 5;

    // Crown jewel gems in safe
    var jewel1 = makeSphere(0.18, 0xFF4444, -27.3, 0.9, -18);
    sceneAdd(jewel1);
    var jewel2 = makeSphere(0.15, 0xFF6666, -27, 1.2, -18);
    sceneAdd(jewel2);
    var jewel3 = makeSphere(0.2, 0xFF2222, -26.7, 0.8, -18);
    sceneAdd(jewel3);
    var jewelCluster = makeBox(0.7, 0.6, 0.3, 0xCC2222, -27, 0.85, -18, 0.01);
    sceneAdd(jewelCluster);
    jewelCluster._artifactIndex = 4;
    jewelCluster._interactDuration = 5;
    jewelCluster._label = 'Crown Jewels';
    state.artifactMeshes[4] = jewelCluster;
    var jewelLight = addPointLight(s, 0xFF4444, 2, -27, 1.5, -18, 5);
    state.artifactLights[4] = jewelLight;
    // store gem meshes so we can hide them
    jewelCluster._gems = [jewel1, jewel2, jewel3, jewel1, jewel2, jewel3];

    // ── CAMERAS ───────────────────────────────────────────────────────────────
    // 8 security cameras (BoxGeometry body + CylinderGeometry lens)
    var camMountData = [
      { x: -15, y: 6.8, z: -18, startAngle: 0 },
      { x: 0,   y: 6.8, z: -18, startAngle: Math.PI / 4 },
      { x: 20,  y: 6.8, z: -14, startAngle: Math.PI / 2 },
      { x: 24,  y: 6.8, z: 2,   startAngle: Math.PI },
      { x: 8,   y: 6.8, z: 6,   startAngle: -Math.PI / 4 },
      { x: -8,  y: 6.8, z: 6,   startAngle: Math.PI * 0.75 },
      { x: 5,   y: 6.8, z: 16,  startAngle: 0 },
      { x: -22, y: 5.8, z: -12, startAngle: Math.PI }
    ];
    for (var cami = 0; cami < camMountData.length; cami++) {
      var cd = camMountData[cami];
      var camBody = makeBox(0.5, 0.3, 0.4, 0x222244, cd.x, cd.y, cd.z);
      sceneAdd(camBody);
      var camLens = makeCylinder(0.08, 0.08, 0.25, 0x111133, cd.x, cd.y - 0.1, cd.z);
      camLens.rotation.x = Math.PI / 2;
      sceneAdd(camLens);
      camBody._camIndex = cami;
      camBody._angle = cd.startAngle;
      camBody._camSpeed = 0.4 + Math.random() * 0.3;
      camBody._camFOV = Math.PI / 2;  // 90 degree sweep
      camBody._lensRef = camLens;
      state.cameras3d.push(camBody);
      state.cameraDisabled.push(false);
    }

    // ── GUARDS ────────────────────────────────────────────────────────────────
    // 16 guards total: BoxGeometry 0x333355
    var guardSpawnData = [
      // Hall of Antiquities (3 guards)
      { x: -15, z: -8,  route: [[-15, -8],  [-8, -8],  [-8, -14], [-15, -14]], room: 'antique' },
      { x: -5,  z: -12, route: [[-5, -12],  [-5, -4],  [-12, -4], [-12, -12]], room: 'antique' },
      { x: -20, z: -16, route: [[-20, -16], [-20, -8], [-10, -8], [-10, -16]], room: 'antique' },
      // Hall of Arms (2 guards)
      { x: 15,  z: -10, route: [[15, -10],  [25, -10], [25, -4],  [15, -4]],  room: 'arms' },
      { x: 22,  z: -15, route: [[22, -15],  [10, -15], [10, -5],  [22, -5]],  room: 'arms' },
      // Modern Art Wing (3 guards)
      { x: -5,  z: 14,  route: [[-5, 8],    [5, 8],    [5, 20],   [-5, 20]],  room: 'modern' },
      { x: 8,   z: 18,  route: [[8, 10],    [13, 10],  [13, 22],  [8, 22]],   room: 'modern' },
      { x: -10, z: 20,  route: [[-10, 8],   [-13, 14], [-10, 22], [-5, 18]],  room: 'modern' },
      // Director's Vault (4 guards)
      { x: -18, z: -14, route: [[-18, -10], [-26, -10], [-26, -18], [-18, -18]], room: 'vault' },
      { x: -25, z: -10, route: [[-25, -10], [-16, -10], [-16, -18], [-25, -18]], room: 'vault' },
      { x: -20, z: -18, route: [[-20, -18], [-28, -18], [-28, -12], [-20, -12]], room: 'vault' },
      { x: -22, z: -12, route: [[-22, -12], [-15, -12], [-15, -19], [-22, -19]], room: 'vault' },
      // Roaming/exterior (4 guards)
      { x: 5,   z: -3,  route: [[5, -3],    [5, 5],    [-5, 5],   [-5, -3]],  room: 'main' },
      { x: -3,  z: 8,   route: [[-3, 8],    [3, 8],    [3, 0],    [-3, 0]],   room: 'main' },
      { x: 12,  z: 4,   route: [[12, 4],    [20, 4],   [20, -5],  [12, -5]],  room: 'main' },
      { x: -10, z: 0,   route: [[-10, 0],   [-20, 0],  [-20, -5], [-10, -5]], room: 'main' }
    ];
    state.guards = [];
    state.guardsConscious = 16;
    for (var gi = 0; gi < guardSpawnData.length; gi++) {
      var gd = guardSpawnData[gi];
      // Guard body
      var guardBody = makeBox(0.6, 1.6, 0.5, 0x333355, gd.x, 0.8, gd.z);
      sceneAdd(guardBody);
      // Guard head
      var guardHead = makeBox(0.45, 0.45, 0.45, 0x887766, gd.x, 1.85, gd.z);
      sceneAdd(guardHead);
      // Guard vision cone indicator
      var guardVision = makeCone(2, 5, 0xFFFF00, gd.x, 0.1, gd.z);
      guardVision.material.transparent = true;
      guardVision.material.opacity = 0.08;
      guardVision.rotation.x = Math.PI / 2;
      sceneAdd(guardVision);

      var guard = {
        mesh: guardBody,
        head: guardHead,
        visionCone: guardVision,
        hp: 80,
        pos: { x: gd.x, y: 0.8, z: gd.z },
        route: gd.route,
        routeIdx: 0,
        speed: 2 + Math.random(),
        angle: 0,
        conscious: true,
        unconsciousTimer: 0,
        alerted: false,
        alertTimer: 0,
        room: gd.room
      };
      state.guards.push(guard);
    }

    // ── PLAYER SPAWN ─────────────────────────────────────────────────────────
    // Player spawns outside south entrance
    state.playerPos = { x: 0, y: 1.7, z: 35 };
    state.camera.position.copy(state.playerPos);

    // Escape van (parked outside south, collectible target)
    var vanBody = makeBox(4, 2, 7, 0x223322, 15, 1, 32);
    sceneAdd(vanBody);
    var vanTop = makeBox(3, 1.2, 4, 0x223322, 15, 2.6, 31);
    sceneAdd(vanTop);
    state.escapeVanMesh = vanBody;
    // Van label marker
    var vanMarker = makeBox(4.1, 2.1, 7.1, 0x44FF44, 15, 1, 32, 0.08);
    sceneAdd(vanMarker);
    vanMarker._isEscapeVan = true;
    vanMarker._label = 'Escape Van';

    // Small fence/barrier around museum
    var fenceN = makeBox(65, 1.2, 0.2, 0x554433, 0, 0.6, -23);
    sceneAdd(fenceN);
    var fenceE5 = makeBox(0.2, 1.2, 60, 0x554433, 32, 0.6, 7);
    sceneAdd(fenceE5);
    var fenceW5 = makeBox(0.2, 1.2, 60, 0x554433, -32, 0.6, 7);
    sceneAdd(fenceW5);

    // Fog for atmosphere
    s.fog = new THREE.Fog(0x001122, 5, 60);
    s.background = new THREE.Color(0x001122);
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────────
  function buildHUD() {
    var hud = document.createElement('div');
    hud.id = 'mh-hud';
    hud.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#00FF88',
      'font:bold 13px monospace',
      'padding:6px 14px',
      'border-radius:4px',
      'z-index:10000',
      'letter-spacing:1px',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(hud);
    state.hudEl = hud;

    var prompt = document.createElement('div');
    prompt.id = 'mh-prompt';
    prompt.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)',
      'color:#FFEE88',
      'font:14px monospace',
      'padding:5px 12px',
      'border-radius:4px',
      'z-index:10000',
      'pointer-events:none',
      'display:none'
    ].join(';');
    document.body.appendChild(prompt);
    state.promptEl = prompt;

    var end = document.createElement('div');
    end.id = 'mh-end';
    end.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.9)',
      'color:#FFFFFF',
      'font:bold 22px monospace',
      'padding:30px 50px',
      'border-radius:8px',
      'z-index:10001',
      'text-align:center',
      'display:none'
    ].join(';');
    document.body.appendChild(end);
    state.endEl = end;

    // Crosshair
    var xhair = document.createElement('div');
    xhair.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:14px',
      'height:14px',
      'pointer-events:none',
      'z-index:9999'
    ].join(';');
    xhair.innerHTML = '<svg width="14" height="14"><line x1="7" y1="0" x2="7" y2="14" stroke="#88FF88" stroke-width="1.5"/><line x1="0" y1="7" x2="14" y2="7" stroke="#88FF88" stroke-width="1.5"/></svg>';
    document.body.appendChild(xhair);
    state._xhair = xhair;

    // Tool bar
    var toolbar = document.createElement('div');
    toolbar.id = 'mh-toolbar';
    toolbar.style.cssText = [
      'position:fixed',
      'bottom:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)',
      'color:#AAFFCC',
      'font:12px monospace',
      'padding:4px 12px',
      'border-radius:4px',
      'z-index:10000',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(toolbar);
    state._toolbar = toolbar;
  }

  function updateHUD() {
    if (!state.hudEl) return;
    var timer = toMM_SS(Math.max(0, state.heistTimer));
    var stealthColor = state.stealthStatus === 'CLEAR' ? '#00FF88' :
                       state.stealthStatus === 'COMPROMISED' ? '#FFAA00' : '#FF3333';
    var policeStr = '';
    if (state.alarmTriggered && !state.policeArrived) {
      policeStr = ' [POLICE: ' + toMM_SS(state.policeTimer) + ']';
    } else if (state.policeArrived) {
      policeStr = ' [POLICE: ON-SCENE]';
    }
    var conscious = 0;
    for (var gi = 0; gi < state.guards.length; gi++) {
      if (state.guards[gi].conscious) conscious++;
    }
    state.hudEl.style.color = stealthColor;
    state.hudEl.innerHTML = 'MUSEUM HEIST' +
      ' [ARTIFACTS: ' + state.artifactsCollected + '/5]' +
      ' [STEALTH: <span style="color:' + stealthColor + '">' + state.stealthStatus + '</span>]' +
      ' [TIMER: ' + timer + ']' +
      ' [GUARDS: ' + conscious + ']' +
      policeStr;

    if (state._toolbar) {
      state._toolbar.innerHTML =
        'SMOKE:' + state.smokePellets +
        ' EMP:' + state.empPenUses +
        ' LASER-CUTTER:' + (state.laserCutterHas ? 'YES' : 'NO') +
        ' KEYCARD:' + (state.hasKeycard ? 'YES' : 'NO') +
        ' HP:' + state.playerHP +
        '  [WASD]Move [Mouse]Look [E]Interact [Q]Smoke [F]EMP [T]Taser';
    }
  }

  function showPrompt(txt) {
    if (!state.promptEl) return;
    if (txt) {
      state.promptEl.style.display = 'block';
      state.promptEl.innerHTML = txt;
    } else {
      state.promptEl.style.display = 'none';
      state.promptEl.innerHTML = '';
    }
  }

  function showEnd(msg, win) {
    if (!state.endEl) return;
    state.endEl.style.display = 'block';
    state.endEl.style.color = win ? '#00FF88' : '#FF4444';
    state.endEl.innerHTML = msg + '<br><br><span style="font-size:14px;color:#aaa">[Press R to try again | M+H to exit]</span>';
  }

  // ─── Input ────────────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    var k = e.key.toLowerCase();
    state.moveKeys[k] = true;

    // Activation detection M+H
    if (k === 'm') {
      if (!state.active) {
        state.mDown = true;
        state.mDownTime = performance.now();
        if (state.hDown && (state.mDownTime - state.hDownTime) < 400) {
          activateGame();
        }
        return;
      }
    }
    if (k === 'h') {
      if (!state.active) {
        state.hDown = true;
        state.hDownTime = performance.now();
        if (state.mDown && (state.hDownTime - state.mDownTime) < 400) {
          activateGame();
        }
        return;
      } else {
        // H to deactivate (M+H while active)
        if (state.mDown) {
          deactivateGame();
          return;
        }
      }
    }
    if (!state.active) return;

    // Interact
    if (k === 'e') {
      startInteract();
    }
    // Smoke pellet
    if (k === 'q') {
      throwSmoke();
    }
    // EMP pen
    if (k === 'f') {
      useEMP();
    }
    // Taser
    if (k === 't') {
      useTaser();
    }
    // Crouch
    if (k === 'c') {
      state.crouching = !state.crouching;
      state.playerSpeed = state.crouching ? 2.5 : 5;
      state.camera.position.y = state.crouching ? 1.0 : 1.7;
      state.playerPos.y = state.camera.position.y;
    }
    // Restart
    if (k === 'r' && (state.missionClear || state.missionFailed)) {
      resetGame();
      return;
    }
  }

  function onKeyUp(e) {
    var k = e.key.toLowerCase();
    state.moveKeys[k] = false;
    if (k === 'm') state.mDown = false;
    if (k === 'h') state.hDown = false;
  }

  function onMouseMove(e) {
    if (!state.active || !state.pointerLocked) return;
    var sens = 0.002;
    state.playerYaw -= e.movementX * sens;
    state.playerPitch -= e.movementY * sens;
    state.playerPitch = Math.max(-1.2, Math.min(1.2, state.playerPitch));
    state.camera.rotation.set(state.playerPitch, state.playerYaw, 0, 'YXZ');
  }

  function onClick() {
    if (!state.active) return;
    if (!state.pointerLocked) {
      state.renderer.domElement.requestPointerLock();
    }
  }

  // ─── Pointer lock ─────────────────────────────────────────────────────────────
  function onPointerLockChange() {
    state.pointerLocked = (document.pointerLockElement === state.renderer.domElement);
  }

  // ─── Actions ─────────────────────────────────────────────────────────────────
  function startInteract() {
    if (state.missionClear || state.missionFailed) return;
    var now = performance.now();
    if (now - state.lastInteractTime < 500) return;
    state.lastInteractTime = now;

    var closest = findNearbyInteractable(2.5);
    if (!closest) return;

    // Check what we're interacting with
    var mesh = closest;

    if (mesh._isKeycard && state.keycardMesh && !state.hasKeycard) {
      beginInteraction(mesh, mesh._interactDuration, function () {
        state.hasKeycard = true;
        state.scene.remove(state.keycardMesh);
        showPrompt('Keycard acquired!');
      });
      return;
    }

    if (mesh._isBioPad) {
      if (!state.hasKeycard) {
        showPrompt('[!] Need Director Keycard to bypass biometric lock');
        return;
      }
      beginInteraction(mesh, mesh._interactDuration, function () {
        if (state.vaultDoor) {
          state.vaultDoor.position.x -= 3.5;
          state.vaultLocked = false;
        }
        showPrompt('Vault door unlocked!');
      });
      return;
    }

    if (mesh._isSafe) {
      if (state.vaultLocked) {
        showPrompt('[!] Vault door is locked. Find keycard and bypass biometric panel.');
        return;
      }
      if (state.artifactStates[4]) {
        showPrompt('Crown Jewels already taken.');
        return;
      }
      beginInteraction(mesh, mesh._interactDuration, function () {
        collectArtifact(4);
        // reveal gems by removing safe door
        state.scene.remove(mesh);
        showPrompt('Crown Jewels secured!');
      });
      return;
    }

    if (mesh._isEscapeVan) {
      if (state.artifactsCollected >= 5) {
        // Win!
        state.missionClear = true;
        state.escaped = true;
        endMission(true);
      } else {
        showPrompt('[Van] Need all 5 artifacts first! (' + state.artifactsCollected + '/5)');
      }
      return;
    }

    if (mesh._artifactIndex !== undefined) {
      var idx = mesh._artifactIndex;
      if (state.artifactStates[idx]) {
        showPrompt(mesh._label + ' already collected.');
        return;
      }
      // Check laser for diamond
      if (idx === 2) {
        if (!state.laserCut[0] || !state.laserCut[1]) {
          if (state.laserCutterHas) {
            showPrompt('[E] Cut lasers first with laser cutter — stand close and [E] on red beam');
          } else {
            showPrompt('[!] Laser trip wires active! Need laser cutter.');
          }
          // Check if player is actually at a laser wire
          var atLaser = findNearbyLaser(1.5);
          if (atLaser !== null) {
            cutLaser(atLaser);
          }
          return;
        }
      }
      beginInteraction(mesh, mesh._interactDuration || 2, function () {
        collectArtifact(idx);
        showPrompt(mesh._label + ' secured!');
      });
      return;
    }

    // Check for laser cutting
    var li = findNearbyLaser(1.5);
    if (li !== null) {
      cutLaser(li);
      return;
    }
  }

  function beginInteraction(mesh, duration, onComplete) {
    state.interacting = true;
    state.interactTarget = mesh;
    state.interactProgress = 0;
    state.interactDuration = duration;
    state._interactCallback = onComplete;
    showPrompt('[Hold E] ' + (mesh._label || 'Interacting...') + ' (0%)');
  }

  function tickInteract(dt) {
    if (!state.interacting) return;
    // Check E is still held
    if (!state.moveKeys['e']) {
      state.interacting = false;
      state.interactTarget = null;
      showPrompt(null);
      return;
    }
    state.interactProgress += dt;
    var pct = Math.min(100, Math.floor((state.interactProgress / state.interactDuration) * 100));
    var lbl = state.interactTarget ? (state.interactTarget._label || 'Interacting') : 'Interacting';
    showPrompt('[Hold E] ' + lbl + ' (' + pct + '%)');
    if (state.interactProgress >= state.interactDuration) {
      state.interacting = false;
      var cb = state._interactCallback;
      state._interactCallback = null;
      state.interactTarget = null;
      showPrompt(null);
      if (cb) cb();
    }
  }

  function collectArtifact(idx) {
    if (state.artifactStates[idx]) return;
    state.artifactStates[idx] = true;
    state.artifactsCollected++;
    // Remove mesh from scene
    var m = state.artifactMeshes[idx];
    if (m) state.scene.remove(m);
    if (state.artifactLights[idx]) {
      state.scene.remove(state.artifactLights[idx]);
    }
    if (idx === 1 && m && m._markerMesh) {
      state.scene.remove(m._markerMesh);
    }
    showPrompt('ARTIFACT ' + state.artifactsCollected + '/5 COLLECTED!');
  }

  function cutLaser(idx) {
    if (state.laserCut[idx]) return;
    if (!state.laserCutterHas) {
      showPrompt('[!] No laser cutter.');
      return;
    }
    state.laserCut[idx] = true;
    var lm = state.lasers[idx];
    if (lm) {
      lm.material.color.setHex(0x003300);
      lm.material.opacity = 0.1;
      lm.material.transparent = true;
    }
    showPrompt('Laser wire ' + (idx + 1) + ' cut silently.');
  }

  function findNearbyInteractable(range) {
    var pp = state.playerPos;
    var best = null;
    var bestDist = range;

    // Check artifact meshes
    for (var ai = 0; ai < state.artifactMeshes.length; ai++) {
      var am = state.artifactMeshes[ai];
      if (!am || state.artifactStates[ai]) continue;
      // for sword use marker
      var checkMesh = (ai === 1 && am._markerMesh) ? am._markerMesh : am;
      var d = dist3D(pp, checkMesh.position);
      if (d < bestDist) { bestDist = d; best = (ai === 1 && am._markerMesh) ? am._markerMesh : am; }
    }

    // Check keycard
    if (!state.hasKeycard && state.keycardMesh) {
      var kd = dist3D(pp, state.keycardMesh.position);
      if (kd < bestDist) { bestDist = kd; best = state.keycardMesh; }
    }

    // Check biometric pad
    // Search sceneObjects for _isBioPad
    for (var oi = 0; oi < state.sceneObjects.length; oi++) {
      var obj = state.sceneObjects[oi];
      if (obj._isBioPad) {
        var bd = dist3D(pp, obj.position);
        if (bd < bestDist) { bestDist = bd; best = obj; }
      }
      if (obj._isSafe) {
        var sd = dist3D(pp, obj.position);
        if (sd < bestDist) { bestDist = sd; best = obj; }
      }
      if (obj._isEscapeVan) {
        var vd = dist3D(pp, obj.position);
        if (vd < bestDist) { bestDist = vd; best = obj; }
      }
    }

    return best;
  }

  function findNearbyLaser(range) {
    var pp = state.playerPos;
    for (var li = 0; li < state.lasers.length; li++) {
      if (state.laserCut[li]) continue;
      var lm = state.lasers[li];
      // distance from player to midpoint of laser
      var mx = (lm._ax + lm._bx) / 2;
      var mz = (lm._az + lm._bz) / 2;
      var d = dist2D(pp.x, pp.z, mx, mz);
      if (d < range) return li;
    }
    return null;
  }

  // ─── Smoke Pellet ─────────────────────────────────────────────────────────────
  function throwSmoke() {
    if (state.smokePellets <= 0) return;
    state.smokePellets--;
    // Find nearest camera and disable it for 20s
    var nearest = null;
    var nearDist = 15;
    var pp = state.playerPos;
    for (var ci = 0; ci < state.cameras3d.length; ci++) {
      if (state.cameraDisabled[ci]) continue;
      var cd = dist3D(pp, state.cameras3d[ci].position);
      if (cd < nearDist) { nearDist = cd; nearest = ci; }
    }
    if (nearest !== null) {
      state.cameraDisabled[nearest] = true;
      state.cameras3d[nearest]._smokeTimer = 20;
      state.cameras3d[nearest].material.color.setHex(0x446644);
      showPrompt('Smoke deployed! Camera ' + (nearest + 1) + ' obscured for 20s');
    } else {
      showPrompt('Smoke deployed! (No nearby camera)');
    }
    // Visual smoke sphere
    var smoke = makeSphere(1.5, 0x888888, pp.x, pp.y + 0.5, pp.z);
    smoke.material.transparent = true;
    smoke.material.opacity = 0.4;
    smoke._timer = 20;
    sceneAdd(smoke);
    state.smokeEffects.push(smoke);
  }

  // ─── EMP Pen ──────────────────────────────────────────────────────────────────
  function useEMP() {
    if (state.empPenUses <= 0) return;
    state.empPenUses--;
    var pp = state.playerPos;
    // Disable nearest camera or motion detector for 60s
    var nearest = null;
    var nearDist = 8;
    var nearType = null;
    for (var ci = 0; ci < state.cameras3d.length; ci++) {
      if (state.cameraDisabled[ci]) continue;
      var d = dist3D(pp, state.cameras3d[ci].position);
      if (d < nearDist) { nearDist = d; nearest = ci; nearType = 'cam'; }
    }
    for (var mi = 0; mi < state.motionDetectors.length; mi++) {
      if (state.motionDetectorDisabled[mi]) continue;
      var dm = dist3D(pp, state.motionDetectors[mi].position);
      if (dm < nearDist) { nearDist = dm; nearest = mi; nearType = 'md'; }
    }
    if (nearest !== null && nearType === 'cam') {
      state.cameraDisabled[nearest] = true;
      state.cameras3d[nearest]._empTimer = 60;
      state.cameras3d[nearest].material.color.setHex(0x224422);
      showPrompt('EMP: Camera ' + (nearest + 1) + ' disabled for 60s. Uses left: ' + state.empPenUses);
    } else if (nearest !== null && nearType === 'md') {
      state.motionDetectorDisabled[nearest] = true;
      state.motionDetectors[nearest]._empTimer = 60;
      state.motionDetectors[nearest].material.color.setHex(0x224422);
      showPrompt('EMP: Motion detector disabled for 60s. Uses left: ' + state.empPenUses);
    } else {
      showPrompt('EMP: No device in range (8m). Uses left: ' + state.empPenUses);
    }
  }

  // ─── Taser ────────────────────────────────────────────────────────────────────
  function useTaser() {
    if (state.taserCooldown > 0) {
      showPrompt('Taser recharging: ' + state.taserCooldown.toFixed(1) + 's');
      return;
    }
    var pp = state.playerPos;
    var nearest = null;
    var nearDist = 3;
    for (var gi = 0; gi < state.guards.length; gi++) {
      var g = state.guards[gi];
      if (!g.conscious) continue;
      var d = dist3D(pp, g.pos);
      if (d < nearDist) { nearDist = d; nearest = gi; }
    }
    if (nearest !== null) {
      var g2 = state.guards[nearest];
      g2.conscious = false;
      g2.unconsciousTimer = 60;
      g2.mesh.material.color.setHex(0x222233);
      g2.head.material.color.setHex(0x665544);
      // Lay guard flat
      g2.mesh.rotation.z = Math.PI / 2;
      g2.mesh.position.y = 0.3;
      g2.head.position.y = g2.mesh.position.y + 0.5;
      g2.visionCone.visible = false;
      state.guardsConscious--;
      state.taserCooldown = 8;
      showPrompt('Guard tased! Unconscious for 60s.');
    } else {
      showPrompt('[Taser] No guard in range (3m). Approach from behind for best results.');
    }
  }

  // ─── Alarm ────────────────────────────────────────────────────────────────────
  function triggerAlarm() {
    if (state.alarmTriggered) return;
    state.alarmTriggered = true;
    state.stealthStatus = 'ALARM';
    // Flash all lights red
    state.scene.background = new THREE.Color(0x110000);
    for (var gi = 0; gi < state.guards.length; gi++) {
      if (state.guards[gi].conscious) {
        state.guards[gi].alerted = true;
        state.guards[gi].speed = 4;
        state.guards[gi].mesh.material.color.setHex(0x553333);
      }
    }
    showPrompt('[!! ALARM TRIGGERED !!] Police response in 4:00');
  }

  function compromiseDetected() {
    if (state.alarmTriggered) return;
    if (state.stealthStatus !== 'COMPROMISED') {
      state.stealthStatus = 'COMPROMISED';
      showPrompt('[ALERT] Stealth compromised! Guards on heightened alert.');
    }
  }

  // ─── Movement ─────────────────────────────────────────────────────────────────
  function movePlayer(dt) {
    if (state.missionClear || state.missionFailed) return;
    var mk = state.moveKeys;
    var spd = state.playerSpeed;
    var yaw = state.playerYaw;

    var fwdX = -Math.sin(yaw);
    var fwdZ = -Math.cos(yaw);
    var rightX = Math.cos(yaw);
    var rightZ = -Math.sin(yaw);

    var dx = 0, dz = 0;
    if (mk['w'] || mk['arrowup'])    { dx += fwdX; dz += fwdZ; }
    if (mk['s'] || mk['arrowdown'])  { dx -= fwdX; dz -= fwdZ; }
    if (mk['a'] || mk['arrowleft'])  { dx -= rightX; dz -= rightZ; }
    if (mk['d'] || mk['arrowright']) { dx += rightX; dz += rightZ; }

    var len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0) {
      dx = (dx / len) * spd * dt;
      dz = (dz / len) * spd * dt;
    }

    var newX = state.playerPos.x + dx;
    var newZ = state.playerPos.z + dz;

    // Simple boundary clamping (stay inside museum area + outside)
    newX = Math.max(-32, Math.min(32, newX));
    newZ = Math.max(-22, Math.min(40, newZ));

    state.playerPos.x = newX;
    state.playerPos.z = newZ;

    state.camera.position.x = state.playerPos.x;
    state.camera.position.z = state.playerPos.z;
    state.camera.position.y = state.playerPos.y;
    state.camera.rotation.set(state.playerPitch, state.playerYaw, 0, 'YXZ');
  }

  // ─── Guard AI ─────────────────────────────────────────────────────────────────
  function updateGuards(dt) {
    var pp = state.playerPos;
    for (var gi = 0; gi < state.guards.length; gi++) {
      var g = state.guards[gi];

      // Handle unconscious
      if (!g.conscious) {
        g.unconsciousTimer -= dt;
        if (g.unconsciousTimer <= 0) {
          g.conscious = true;
          g.mesh.material.color.setHex(0x333355);
          g.head.material.color.setHex(0x887766);
          g.mesh.rotation.z = 0;
          g.mesh.position.y = 0.8;
          g.pos.y = 0.8;
          g.head.position.set(g.pos.x, 1.85, g.pos.z);
          g.visionCone.visible = true;
          state.guardsConscious++;
        }
        continue;
      }

      // Move along patrol route or chase player if alerted
      var targetX, targetZ;
      if (g.alerted) {
        targetX = pp.x;
        targetZ = pp.z;
      } else {
        var wp = g.route[g.routeIdx];
        targetX = wp[0];
        targetZ = wp[1];
      }

      var gdx = targetX - g.pos.x;
      var gdz = targetZ - g.pos.z;
      var gdist = Math.sqrt(gdx * gdx + gdz * gdz);

      if (gdist < 0.5 && !g.alerted) {
        g.routeIdx = (g.routeIdx + 1) % g.route.length;
      } else if (gdist > 0) {
        var step = Math.min(gdist, g.speed * dt);
        g.pos.x += (gdx / gdist) * step;
        g.pos.z += (gdz / gdist) * step;
        g.angle = Math.atan2(gdx, gdz);
      }

      g.mesh.position.set(g.pos.x, g.conscious ? 0.8 : 0.3, g.pos.z);
      g.mesh.rotation.y = g.angle;
      g.head.position.set(g.pos.x, g.conscious ? 1.85 : 0.8, g.pos.z);
      g.visionCone.position.set(g.pos.x, 0.05, g.pos.z);
      g.visionCone.rotation.y = g.angle;

      // Vision detection
      if (!state.alarmTriggered) {
        var toDist = dist2D(g.pos.x, g.pos.z, pp.x, pp.z);
        if (toDist < 10) {
          var toAngle = Math.atan2(pp.x - g.pos.x, pp.z - g.pos.z);
          var angleDiff = Math.abs(((toAngle - g.angle) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
          var visRange = state.crouching ? 4 : 6;
          var fov = state.crouching ? 0.6 : 0.9;
          if (angleDiff < fov && toDist < visRange) {
            if (toDist < 2) {
              triggerAlarm();
            } else {
              compromiseDetected();
              g.alerted = true;
              g.alertTimer = 8;
            }
          }
        }
      }

      // Alert timeout
      if (g.alerted && !state.alarmTriggered) {
        g.alertTimer -= dt;
        if (g.alertTimer <= 0) {
          g.alerted = false;
        }
      }

      // Contact with player
      if (g.conscious) {
        var gPlayerDist = dist3D(g.pos, pp);
        if (gPlayerDist < 1.2) {
          state.playerHP -= 10 * dt;
          if (state.playerHP <= 0) {
            state.playerHP = 0;
            state.missionFailed = true;
            state.failReason = 'Taken down by a guard!';
            endMission(false);
          }
          if (!state.alarmTriggered) triggerAlarm();
        }
      }
    }
  }

  // ─── Camera AI ────────────────────────────────────────────────────────────────
  function updateCameras(dt) {
    var pp = state.playerPos;
    for (var ci = 0; ci < state.cameras3d.length; ci++) {
      var cam = state.cameras3d[ci];

      // Tick disabled timers
      if (state.cameraDisabled[ci]) {
        if (cam._smokeTimer > 0) {
          cam._smokeTimer -= dt;
          if (cam._smokeTimer <= 0) {
            state.cameraDisabled[ci] = false;
            cam.material.color.setHex(0x222244);
            cam._smokeTimer = 0;
          }
        }
        if (cam._empTimer > 0) {
          cam._empTimer -= dt;
          if (cam._empTimer <= 0) {
            state.cameraDisabled[ci] = false;
            cam.material.color.setHex(0x222244);
            cam._empTimer = 0;
          }
        }
        continue;
      }

      // Rotate camera 90 degrees sweep
      cam._angle += cam._camSpeed * dt;
      // Clamp to sweep range (±45 degrees from base)
      var sweep = Math.sin(cam._angle) * (Math.PI / 4);
      cam.rotation.y = sweep;

      // Check if player is in camera FOV
      if (!state.alarmTriggered) {
        var camPos = cam.position;
        var toCamX = pp.x - camPos.x;
        var toCamZ = pp.z - camPos.z;
        var camDist = Math.sqrt(toCamX * toCamX + toCamZ * toCamZ);
        if (camDist < 12) {
          var camAngle = Math.atan2(toCamX, toCamZ);
          var camFacing = sweep;
          var camDiff = Math.abs(((camAngle - camFacing) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
          if (camDiff < 0.5 && camDist < 10) {
            if (!state.crouching) {
              triggerAlarm();
            } else if (camDist < 5) {
              compromiseDetected();
            }
          }
        }
      }
    }
  }

  // ─── Laser Trip Wires ─────────────────────────────────────────────────────────
  function checkLasers() {
    if (state.alarmTriggered) return;
    var pp = state.playerPos;
    for (var li = 0; li < state.lasers.length; li++) {
      if (state.laserCut[li]) continue;
      var lm = state.lasers[li];
      // Check if player crosses the laser line
      var ax = lm._ax, az = lm._az, bx = lm._bx, bz = lm._bz;
      // Simple point-to-segment distance
      var d = pointToSegmentDist2D(pp.x, pp.z, ax, az, bx, bz);
      if (d < 0.4) {
        triggerAlarm();
        return;
      }
    }
  }

  function pointToSegmentDist2D(px, pz, ax, az, bx, bz) {
    var abx = bx - ax, abz = bz - az;
    var apx = px - ax, apz = pz - az;
    var ab2 = abx * abx + abz * abz;
    var t = ab2 > 0 ? Math.max(0, Math.min(1, (apx * abx + apz * abz) / ab2)) : 0;
    var cx = ax + t * abx - px;
    var cz = az + t * abz - pz;
    return Math.sqrt(cx * cx + cz * cz);
  }

  // ─── Pressure Plates ──────────────────────────────────────────────────────────
  function checkPressurePlates() {
    if (state.alarmTriggered) return;
    var pp = state.playerPos;
    for (var pi = 0; pi < state.pressurePlates.length; pi++) {
      if (state.pressurePlateDisabled[pi]) continue;
      var plate = state.pressurePlates[pi];
      var d = dist2D(pp.x, pp.z, plate.position.x, plate.position.z);
      if (d < 0.8) {
        triggerAlarm();
        return;
      }
    }
  }

  // ─── Motion Detectors ─────────────────────────────────────────────────────────
  function updateMotionDetectors(dt) {
    if (state.alarmTriggered) return;
    var pp = state.playerPos;
    for (var mi = 0; mi < state.motionDetectors.length; mi++) {
      if (state.motionDetectorDisabled[mi]) {
        if (state.motionDetectors[mi]._empTimer > 0) {
          state.motionDetectors[mi]._empTimer -= dt;
          if (state.motionDetectors[mi]._empTimer <= 0) {
            state.motionDetectorDisabled[mi] = false;
            state.motionDetectors[mi].material.color.setHex(0x333377);
          }
        }
        continue;
      }
      var md = state.motionDetectors[mi];
      var d = dist3D(pp, md.position);
      if (d < 3.5 && !state.crouching) {
        compromiseDetected();
        if (d < 2) {
          triggerAlarm();
        }
      }
    }
  }

  // ─── Timers ───────────────────────────────────────────────────────────────────
  function updateTimers(dt) {
    if (state.missionClear || state.missionFailed) return;

    state.heistTimer -= dt;
    if (state.heistTimer <= 0) {
      state.missionFailed = true;
      state.failReason = 'Time ran out! Museum opens at dawn.';
      endMission(false);
      return;
    }

    if (state.alarmTriggered) {
      state.policeTimer -= dt;
      if (state.policeTimer <= 0 && !state.policeArrived) {
        state.policeArrived = true;
        state.missionFailed = true;
        state.failReason = 'Police have arrived in overwhelming force!';
        endMission(false);
      }
    }

    // Smoke effects lifetime
    for (var si = state.smokeEffects.length - 1; si >= 0; si--) {
      var sm = state.smokeEffects[si];
      sm._timer -= dt;
      sm.material.opacity = Math.max(0, (sm._timer / 20) * 0.4);
      if (sm._timer <= 0) {
        state.scene.remove(sm);
        state.smokeEffects.splice(si, 1);
      }
    }

    // Taser cooldown
    if (state.taserCooldown > 0) {
      state.taserCooldown -= dt;
    }
  }

  // ─── Proximity prompt ─────────────────────────────────────────────────────────
  function updateProximityPrompt() {
    if (state.interacting) return;
    var pp = state.playerPos;

    // Escape van
    if (dist3D(pp, state.escapeVanMesh.position) < 5) {
      if (state.artifactsCollected >= 5) {
        showPrompt('[E] Board Escape Van — GETAWAY!');
      } else {
        showPrompt('Escape Van — Collect all 5 artifacts first (' + state.artifactsCollected + '/5)');
      }
      return;
    }

    var closest = findNearbyInteractable(2.5);
    if (closest) {
      var lbl = closest._label || 'Object';
      var dur = closest._interactDuration || 1;
      if (closest._isEscapeVan) {
        // handled above
      } else if (closest._isBioPad) {
        showPrompt(!state.hasKeycard ? '[!] Need Director Keycard' : '[Hold E] Bypass biometric lock (' + dur + 's)');
      } else if (closest._isSafe) {
        showPrompt(state.vaultLocked ? '[!] Vault locked' : '[Hold E] Crack safe (' + dur + 's)');
      } else {
        showPrompt('[Hold E] ' + lbl + ' (' + dur + 's)');
      }
      return;
    }

    var li = findNearbyLaser(1.5);
    if (li !== null && !state.laserCut[li]) {
      showPrompt('[E] Cut laser wire with laser cutter');
      return;
    }

    // Nearby guard tase hint
    for (var gi = 0; gi < state.guards.length; gi++) {
      var g = state.guards[gi];
      if (!g.conscious) continue;
      if (dist3D(pp, g.pos) < 3) {
        showPrompt('[T] Tase guard (non-lethal, 60s)');
        return;
      }
    }

    showPrompt(null);
  }

  // ─── End Mission ──────────────────────────────────────────────────────────────
  function endMission(win) {
    if (win) {
      showEnd(
        'HEIST COMPLETE!\n\nAll ' + state.artifactsCollected + ' artifacts secured.\nTime remaining: ' + toMM_SS(state.heistTimer) + '\nGuards down: ' + (16 - state.guardsConscious),
        true
      );
    } else {
      showEnd('MISSION FAILED\n\n' + state.failReason, false);
    }
  }

  // ─── Activate / Deactivate ────────────────────────────────────────────────────
  function activateGame() {
    if (state.active) return;
    state.active = true;

    // Create renderer
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:9990;';
    document.body.appendChild(renderer.domElement);
    state.renderer = renderer;

    // Scene and camera
    var scene = new THREE.Scene();
    state.scene = scene;
    state.sceneObjects = [];

    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    state.camera = camera;

    state.clock = new THREE.Clock();

    buildScene();
    buildHUD();

    // Input listeners
    state.keydownHandler = onKeyDown;
    state.keyupHandler = onKeyUp;
    state.mousemoveHandler = onMouseMove;
    state.clickHandler = onClick;
    document.addEventListener('keydown', state.keydownHandler);
    document.addEventListener('keyup', state.keyupHandler);
    document.addEventListener('mousemove', state.mousemoveHandler);
    renderer.domElement.addEventListener('click', state.clickHandler);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    state.heistTimer = 600;
    state.heistStarted = true;

    // Start loop
    loop();
  }

  function deactivateGame() {
    if (!state.active) return;
    state.active = false;

    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }

    // Remove DOM
    if (state.renderer) {
      document.body.removeChild(state.renderer.domElement);
      state.renderer.dispose();
      state.renderer = null;
    }
    if (state.hudEl) { document.body.removeChild(state.hudEl); state.hudEl = null; }
    if (state.promptEl) { document.body.removeChild(state.promptEl); state.promptEl = null; }
    if (state.endEl) { document.body.removeChild(state.endEl); state.endEl = null; }
    if (state._xhair) { document.body.removeChild(state._xhair); state._xhair = null; }
    if (state._toolbar) { document.body.removeChild(state._toolbar); state._toolbar = null; }

    // Remove listeners
    if (state.keydownHandler) document.removeEventListener('keydown', state.keydownHandler);
    if (state.keyupHandler) document.removeEventListener('keyup', state.keyupHandler);
    if (state.mousemoveHandler) document.removeEventListener('mousemove', state.mousemoveHandler);
    document.removeEventListener('pointerlockchange', onPointerLockChange);

    if (document.pointerLockElement) document.exitPointerLock();
  }

  function resetGame() {
    deactivateGame();
    // Reset all state
    state.active = false;
    state.mDown = false;
    state.hDown = false;
    state.mDownTime = 0;
    state.hDownTime = 0;
    state.scene = null;
    state.camera = null;
    state.renderer = null;
    state.animFrameId = null;
    state.playerPos = { x: 0, y: 1.7, z: 35 };
    state.playerYaw = 0;
    state.playerPitch = 0;
    state.playerHP = 100;
    state.playerSpeed = 5;
    state.crouching = false;
    state.moveKeys = {};
    state.pointerLocked = false;
    state.heistTimer = 600;
    state.heistStarted = false;
    state.stealthStatus = 'CLEAR';
    state.alarmTriggered = false;
    state.alarmTimer = 0;
    state.policeTimer = 240;
    state.policeArrived = false;
    state.artifactsCollected = 0;
    state.artifactStates = [false, false, false, false, false];
    state.artifactMeshes = [];
    state.artifactLights = [];
    state.interacting = false;
    state.interactTarget = null;
    state.interactProgress = 0;
    state.interactDuration = 0;
    state.interactEl = null;
    state._interactCallback = null;
    state.guards = [];
    state.guardsConscious = 0;
    state.cameras3d = [];
    state.cameraDisabled = [];
    state.lasers = [];
    state.laserCut = [];
    state.pressurePlates = [];
    state.pressurePlateDisabled = [];
    state.motionDetectors = [];
    state.motionDetectorDisabled = [];
    state.vaultLocked = true;
    state.hasKeycard = false;
    state.keycardMesh = null;
    state.vaultDoor = null;
    state.smokePellets = 3;
    state.empPenUses = 3;
    state.laserCutterHas = true;
    state.smokeEffects = [];
    state.escapeVanMesh = null;
    state.escaped = false;
    state.missionClear = false;
    state.missionFailed = false;
    state.failReason = '';
    state.hudEl = null;
    state.promptEl = null;
    state.endEl = null;
    state._xhair = null;
    state._toolbar = null;
    state.lastInteractTime = 0;
    state.taserCooldown = 0;
    state.sceneObjects = [];
    state.ventShaftMesh = null;
    state.ventShaftOpen = false;
    activateGame();
  }

  // ─── Main Loop ────────────────────────────────────────────────────────────────
  function loop() {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(loop);

    var dt = Math.min(state.clock.getDelta(), 0.05);

    movePlayer(dt);
    updateGuards(dt);
    updateCameras(dt);
    checkLasers();
    checkPressurePlates();
    updateMotionDetectors(dt);
    tickInteract(dt);
    updateTimers(dt);
    updateProximityPrompt();
    updateHUD();

    state.renderer.render(state.scene, state.camera);
  }

  // ─── Public API ───────────────────────────────────────────────────────────────
  function init() {
    // Wire activation key listeners at page load (passive, low overhead)
    var initKeydown = function (e) {
      var k = e.key.toLowerCase();
      if (k === 'm') {
        state.mDown = true;
        state.mDownTime = performance.now();
        if (state.hDown && (state.mDownTime - state.hDownTime) < 400) {
          activateGame();
        }
      }
      if (k === 'h') {
        state.hDown = true;
        state.hDownTime = performance.now();
        if (state.mDown && (state.hDownTime - state.mDownTime) < 400) {
          activateGame();
        }
      }
    };
    var initKeyup = function (e) {
      var k = e.key.toLowerCase();
      if (k === 'm') state.mDown = false;
      if (k === 'h') state.hDown = false;
    };
    document.addEventListener('keydown', initKeydown);
    document.addEventListener('keyup', initKeyup);
    state._initKeydown = initKeydown;
    state._initKeyup = initKeyup;
  }

  function update() {
    // External update hook (no-op; internal RAF loop drives updates)
  }

  function reset() {
    if (state.active) {
      resetGame();
    }
  }

  return { init: init, update: update, reset: reset };
}());
