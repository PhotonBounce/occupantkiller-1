window.CargoShip = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var MODULE_NAME = 'CargoShip';
  var ACTIVATION_KEY_C = 67;
  var ACTIVATION_KEY_S = 83;
  var ACTIVATION_WINDOW = 400;

  var DECK_Y = 6;
  var WATER_Y = -4;
  var CRANE_TOP_Y = DECK_Y + 1 + 20;
  var RAPPEL_START_Y = 25;
  var STORM_TIME = 120;
  var EXTRACT_HELI_DELAY = 60;
  var MARK_HOLD_TIME = 4;
  var COMMS_HOLD_TIME = 8;
  var CAPTAIN_HP = 400;

  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,
    playerPos: { x: 0, y: RAPPEL_START_Y, z: 0 },
    playerHP: 100,
    score: 0,
    gameOver: false,
    lastTime: 0,
    animFrameId: null,
    objects: [],
    enemies: [],
    cratesMarked: 0,
    cratesTotal: 3,
    commsTransmitted: false,
    crewAlive: 16,
    extractTimer: -1,
    extractCalled: false,
    helicopterArrived: false,
    missionTime: 0,
    stormActive: false,
    stormFogDensity: 0.02,
    normalFogDensity: 0.01,
    rainLights: [],
    playerSpeed: 8,
    rappelling: true,
    rappelY: RAPPEL_START_Y,
    rappelRope: null,
    craneControlled: false,
    craneLiftY: 0,
    craneContainer: null,
    craneContainerFalling: false,
    craneContainerFallVY: 0,
    nearCraneCab: false,
    nearCrates: [false, false, false],
    crateObjects: [],
    crateMarking: false,
    crateMarkTimer: 0,
    crateMarkIndex: -1,
    nearBridge: false,
    commsHolding: false,
    commsTimer: 0,
    smokeSignal: null,
    smokeLight: null,
    extractHeli: null,
    extractHeliY: 60,
    bridgeSuperstructure: null,
    captainMesh: null,
    captainHP: CAPTAIN_HP,
    hudEl: null,
    keysDown: {},
    keyTimes: {},
    bobTime: 0,
    shipGroup: null,
    waveTime: 0,
    waveMeshes: [],
    ladderMesh: null,
    craneCabMesh: null,
    bridgeLevels: [],
    fog: null
  };

  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    if (state.active) return;
    state.active = true;

    if (typeof THREE === 'undefined') {
      console.warn('[CargoShip] THREE.js not found');
      return;
    }

    resetState();
    setupScene();
    buildOcean();
    buildShip();
    buildCrew();
    buildContraband();
    buildRappelRope();
    buildHUD();
    bindKeys();
    animate(0);
  }

  function resetState() {
    state.playerPos = { x: 0, y: RAPPEL_START_Y, z: 0 };
    state.playerHP = 100;
    state.score = 0;
    state.gameOver = false;
    state.lastTime = 0;
    state.animFrameId = null;
    state.objects = [];
    state.enemies = [];
    state.cratesMarked = 0;
    state.commsTransmitted = false;
    state.crewAlive = 16;
    state.extractTimer = -1;
    state.extractCalled = false;
    state.helicopterArrived = false;
    state.missionTime = 0;
    state.stormActive = false;
    state.rainLights = [];
    state.playerSpeed = 8;
    state.rappelling = true;
    state.rappelY = RAPPEL_START_Y;
    state.rappelRope = null;
    state.craneControlled = false;
    state.craneLiftY = CRANE_TOP_Y - 6;
    state.craneContainer = null;
    state.craneContainerFalling = false;
    state.craneContainerFallVY = 0;
    state.nearCraneCab = false;
    state.nearCrates = [false, false, false];
    state.crateObjects = [];
    state.crateMarking = false;
    state.crateMarkTimer = 0;
    state.crateMarkIndex = -1;
    state.nearBridge = false;
    state.commsHolding = false;
    state.commsTimer = 0;
    state.smokeSignal = null;
    state.smokeLight = null;
    state.extractHeli = null;
    state.extractHeliY = 60;
    state.captainHP = CAPTAIN_HP;
    state.bobTime = 0;
    state.waveTime = 0;
    state.waveMeshes = [];
    state.keysDown = {};
    state.keyTimes = {};
    state.shipGroup = null;
    state.bridgeLevels = [];
    state.fog = null;
    state.ladderMesh = null;
    state.craneCabMesh = null;
    state.captainMesh = null;
    state.bridgeSuperstructure = null;
  }

  function destroy() {
    if (!state.active) return;
    state.active = false;
    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }
    if (state.renderer) {
      if (state.renderer.domElement.parentNode) {
        state.renderer.domElement.parentNode.removeChild(state.renderer.domElement);
      }
      state.renderer.dispose();
      state.renderer = null;
    }
    if (state.hudEl && state.hudEl.parentNode) {
      state.hudEl.parentNode.removeChild(state.hudEl);
      state.hudEl = null;
    }
    unbindKeys();
    state.objects = [];
    state.enemies = [];
    state.scene = null;
    state.camera = null;
  }

  function setupScene() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x002244);
    state.fog = new THREE.FogExp2(0x001133, 0.01);
    state.scene.fog = state.fog;

    state.camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 800);
    state.camera.position.set(0, 30, 80);
    state.camera.lookAt(0, 6, 0);

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(w, h);
    state.renderer.shadowMap.enabled = true;
    state.renderer.domElement.style.position = 'fixed';
    state.renderer.domElement.style.top = '0';
    state.renderer.domElement.style.left = '0';
    state.renderer.domElement.style.zIndex = '9000';
    document.body.appendChild(state.renderer.domElement);

    var ambient = new THREE.AmbientLight(0x334455, 0.7);
    state.scene.add(ambient);

    var sun = new THREE.DirectionalLight(0xCCDDEE, 1.0);
    sun.position.set(60, 100, 40);
    sun.castShadow = true;
    state.scene.add(sun);

    var fill = new THREE.PointLight(0x112244, 0.6, 300);
    fill.position.set(-40, 20, -40);
    state.scene.add(fill);
  }

  function addMesh(geo, mat, x, y, z, parent) {
    var mesh = new THREE.Mesh(geo, mat);
    if (x !== undefined) mesh.position.set(x, y, z);
    if (parent) {
      parent.add(mesh);
    } else {
      state.scene.add(mesh);
    }
    state.objects.push(mesh);
    return mesh;
  }

  function buildOcean() {
    var wavePositions = [
      [0, 0], [70, 10], [-70, 0], [0, 70], [0, -70],
      [70, -10], [-70, -10]
    ];
    for (var i = 0; i < wavePositions.length; i++) {
      var wp = wavePositions[i];
      var wGeo = new THREE.PlaneGeometry(60, 60);
      var wMat = new THREE.MeshLambertMaterial({ color: 0x003366, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
      var wave = new THREE.Mesh(wGeo, wMat);
      wave.rotation.x = -Math.PI / 2;
      wave.position.set(wp[0], WATER_Y, wp[1]);
      state.scene.add(wave);
      state.waveMeshes.push(wave);
      state.objects.push(wave);
    }
    var deepGeo = new THREE.BoxGeometry(600, 2, 600);
    var deepMat = new THREE.MeshLambertMaterial({ color: 0x001122 });
    var deep = new THREE.Mesh(deepGeo, deepMat);
    deep.position.set(0, WATER_Y - 2, 0);
    state.scene.add(deep);
    state.objects.push(deep);
  }

  function buildShip() {
    var grp = new THREE.Group();
    state.scene.add(grp);
    state.shipGroup = grp;

    // Hull
    var hullGeo = new THREE.BoxGeometry(50, 6, 14);
    var hullMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.set(0, 0, 0);
    grp.add(hull);
    state.objects.push(hull);

    // Deck
    var deckGeo = new THREE.BoxGeometry(50, 1, 14);
    var deckMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(0, 3.5, 0);
    grp.add(deck);
    state.objects.push(deck);

    // 4 container stacks (3 high each, maze-like arrangement)
    var containerColors = [0x552211, 0x334422, 0x225533];
    var stackPositions = [
      [-14, 0], [-6, 0], [6, 0], [14, 0]
    ];
    for (var si = 0; si < 4; si++) {
      var sx = stackPositions[si][0];
      var sz = stackPositions[si][1];
      for (var sh = 0; sh < 3; sh++) {
        var col = containerColors[sh % containerColors.length];
        var cGeo = new THREE.BoxGeometry(7, 3, 5);
        var cMat = new THREE.MeshLambertMaterial({ color: col });
        var cMesh = new THREE.Mesh(cGeo, cMat);
        cMesh.position.set(sx, DECK_Y - 3 + 3.5 + sh * 3, sz);
        grp.add(cMesh);
        state.objects.push(cMesh);
      }
    }

    // Bridge superstructure at stern (positive X side)
    var bridgeGeo = new THREE.BoxGeometry(8, 10, 10);
    var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(20, DECK_Y - 3 + 5, 0);
    grp.add(bridge);
    state.objects.push(bridge);
    state.bridgeSuperstructure = bridge;

    // Bridge levels (for crew placement reference)
    state.bridgeLevels = [
      { x: 20, y: DECK_Y + 1, z: 0 },
      { x: 20, y: DECK_Y + 4, z: 0 },
      { x: 20, y: DECK_Y + 7, z: 0 }
    ];

    // Crane mast amidships (CylinderGeometry r=0.4 h=20)
    var craneGeo = new THREE.CylinderGeometry(0.4, 0.4, 20, 8);
    var craneMat = new THREE.MeshLambertMaterial({ color: 0x887766 });
    var crane = new THREE.Mesh(craneGeo, craneMat);
    crane.position.set(0, DECK_Y - 3 + 10, 0);
    grp.add(crane);
    state.objects.push(crane);

    // Crane cab at top
    var cabGeo = new THREE.BoxGeometry(3, 2.5, 3);
    var cabMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(0, CRANE_TOP_Y, 0);
    state.scene.add(cab);
    state.objects.push(cab);
    state.craneCabMesh = cab;

    // Crane arm (horizontal)
    var armGeo = new THREE.BoxGeometry(12, 0.5, 0.5);
    var armMat = new THREE.MeshLambertMaterial({ color: 0x887766 });
    var arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(-6, CRANE_TOP_Y + 1, 0);
    state.scene.add(arm);
    state.objects.push(arm);

    // Crane cable (vertical line from arm end to container level)
    var cableGeo = new THREE.BoxGeometry(0.15, 8, 0.15);
    var cableMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var cable = new THREE.Mesh(cableGeo, cableMat);
    cable.position.set(-12, CRANE_TOP_Y - 3, 0);
    state.scene.add(cable);
    state.objects.push(cable);

    // Crane payload container (liftable)
    var liftGeo = new THREE.BoxGeometry(7, 3, 5);
    var liftMat = new THREE.MeshLambertMaterial({ color: 0x552211 });
    var liftCon = new THREE.Mesh(liftGeo, liftMat);
    liftCon.position.set(-12, state.craneLiftY, 0);
    state.scene.add(liftCon);
    state.objects.push(liftCon);
    state.craneContainer = liftCon;

    buildLadder(grp);
  }

  function buildLadder(grp) {
    // Ladder from deck to crane cab using LineSegments rungs
    var points = [];
    var rungs = [];
    var ladderX = 1.5;
    var ladderZ = 0.7;
    var ladderBaseY = DECK_Y + 1;
    var ladderTopY = CRANE_TOP_Y - 1;
    // Vertical rails
    for (var ry = ladderBaseY; ry <= ladderTopY; ry += 1.5) {
      rungs.push(new THREE.Vector3(ladderX - 0.5, ry, ladderZ));
      rungs.push(new THREE.Vector3(ladderX + 0.5, ry, ladderZ));
    }
    var lGeo = new THREE.BufferGeometry().setFromPoints(rungs);
    var lMat = new THREE.LineBasicMaterial({ color: 0x888888 });
    var ladder = new THREE.LineSegments(lGeo, lMat);
    state.scene.add(ladder);
    state.ladderMesh = ladder;
  }

  function buildCrew() {
    // 16 crew/guards: BoxGeometry (0x334455) uniforms
    // distributed: on deck, crane cab, bridge levels
    var crewPositions = [
      // Deck patrol crew (10)
      { x: -20, y: DECK_Y + 1, z: 4, patrol: true },
      { x: -10, y: DECK_Y + 1, z: -5, patrol: true },
      { x: 0, y: DECK_Y + 1, z: 4, patrol: true },
      { x: 8, y: DECK_Y + 1, z: -4, patrol: true },
      { x: -18, y: DECK_Y + 1, z: -4, patrol: true },
      { x: 5, y: DECK_Y + 1, z: 5, patrol: true },
      { x: -5, y: DECK_Y + 1, z: -5, patrol: true },
      { x: 15, y: DECK_Y + 1, z: 4, patrol: true },
      { x: -22, y: DECK_Y + 1, z: 0, patrol: true },
      { x: 10, y: DECK_Y + 1, z: -5, patrol: true },
      // Crane cab guard (1)
      { x: 0, y: CRANE_TOP_Y + 1, z: 0, patrol: false },
      // Bridge level guards (4)
      { x: 20, y: DECK_Y + 2, z: 3, patrol: false },
      { x: 20, y: DECK_Y + 2, z: -3, patrol: false },
      { x: 20, y: DECK_Y + 5, z: 3, patrol: false },
      { x: 20, y: DECK_Y + 5, z: -3, patrol: false },
      // Stern guard (1)
      { x: 23, y: DECK_Y + 1, z: 0, patrol: true }
    ];

    var crewMat = new THREE.MeshLambertMaterial({ color: 0x334455 });

    for (var i = 0; i < crewPositions.length; i++) {
      var cp = crewPositions[i];
      var crewGeo = new THREE.BoxGeometry(1, 2, 1);
      var crew = new THREE.Mesh(crewGeo, crewMat);
      crew.position.set(cp.x, cp.y, cp.z);
      state.scene.add(crew);
      state.objects.push(crew);
      state.enemies.push({
        mesh: crew,
        hp: 100,
        patrol: cp.patrol,
        patrolDir: 1,
        patrolTimer: 0,
        startX: cp.x,
        startZ: cp.z,
        alive: true
      });
    }

    // Captain in bridge (BoxGeometry 1.3x scale, 0x220033, 400 HP)
    var captainGeo = new THREE.BoxGeometry(1.3, 2.6, 1.3);
    var captainMat = new THREE.MeshLambertMaterial({ color: 0x220033 });
    var captain = new THREE.Mesh(captainGeo, captainMat);
    captain.position.set(20, DECK_Y + 8, 0);
    state.scene.add(captain);
    state.objects.push(captain);
    state.captainMesh = captain;
    state.enemies.push({
      mesh: captain,
      hp: CAPTAIN_HP,
      patrol: false,
      startX: 20,
      startZ: 0,
      alive: true,
      isCaptain: true
    });
  }

  function buildContraband() {
    // 3 contraband crates BoxGeometry (0xFFCC00 glowing) in container bay
    var cratePositions = [
      { x: -14, y: DECK_Y + 1, z: 3 },
      { x: -6, y: DECK_Y + 1, z: -3 },
      { x: 6, y: DECK_Y + 1, z: 3 }
    ];
    for (var i = 0; i < cratePositions.length; i++) {
      var cp = cratePositions[i];
      var cgeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      var cmat = new THREE.MeshLambertMaterial({ color: 0xFFCC00, emissive: 0x886600 });
      var cmesh = new THREE.Mesh(cgeo, cmat);
      cmesh.position.set(cp.x, cp.y, cp.z);
      state.scene.add(cmesh);
      state.objects.push(cmesh);
      state.crateObjects.push(cmesh);

      // Glow point light on each crate
      var glow = new THREE.PointLight(0xFFCC00, 0.8, 8);
      glow.position.set(cp.x, cp.y + 1, cp.z);
      state.scene.add(glow);
    }
  }

  function buildRappelRope() {
    // Player starts at Y=25, rappels down to deck
    var pts = [];
    pts.push(new THREE.Vector3(0, RAPPEL_START_Y, 0));
    pts.push(new THREE.Vector3(0, DECK_Y + 2, 0));
    var rGeo = new THREE.BufferGeometry().setFromPoints(pts);
    var rMat = new THREE.LineBasicMaterial({ color: 0xCCCCAA });
    var rope = new THREE.Line(rGeo, rMat);
    state.scene.add(rope);
    state.rappelRope = rope;
  }

  function buildHUD() {
    var hud = document.createElement('div');
    hud.style.position = 'fixed';
    hud.style.top = '12px';
    hud.style.left = '12px';
    hud.style.color = '#00FFCC';
    hud.style.fontFamily = 'monospace';
    hud.style.fontSize = '15px';
    hud.style.zIndex = '9999';
    hud.style.background = 'rgba(0,20,40,0.72)';
    hud.style.padding = '8px 14px';
    hud.style.borderRadius = '4px';
    hud.style.lineHeight = '1.7';
    hud.style.pointerEvents = 'none';
    document.body.appendChild(hud);
    state.hudEl = hud;
    updateHUD();
  }

  function updateHUD() {
    if (!state.hudEl) return;
    var commsStr = state.commsTransmitted ? 'TRANSMITTED' : 'NOT TRANSMITTED';
    var extractStr = state.extractCalled ? (state.helicopterArrived ? 'ARRIVED' : Math.ceil(state.extractTimer) + 's') : 'NOT CALLED';
    var storm = state.stormActive ? ' [STORM]' : '';
    state.hudEl.innerHTML =
      'CARGO SHIP' + storm + '<br>' +
      'CRATES MARKED: ' + state.cratesMarked + '/3<br>' +
      'COMMS: ' + commsStr + '<br>' +
      'CREW: ' + state.crewAlive + '<br>' +
      'EXTRACT: ' + extractStr + '<br>' +
      'HP: ' + state.playerHP;
  }

  function bindKeys() {
    state._onKeyDown = function (e) {
      var k = e.keyCode;
      if (!state.keysDown[k]) {
        state.keyTimes[k] = performance.now();
      }
      state.keysDown[k] = true;
      checkActivation(k);
    };
    state._onKeyUp = function (e) {
      state.keysDown[e.keyCode] = false;
    };
    document.addEventListener('keydown', state._onKeyDown);
    document.addEventListener('keyup', state._onKeyUp);
  }

  function unbindKeys() {
    if (state._onKeyDown) document.removeEventListener('keydown', state._onKeyDown);
    if (state._onKeyUp) document.removeEventListener('keyup', state._onKeyUp);
  }

  function checkActivation(k) {
    // Deactivation: C+S again while active to exit
    if (!state.active) return;
    if (k === ACTIVATION_KEY_C || k === ACTIVATION_KEY_S) {
      var other = (k === ACTIVATION_KEY_C) ? ACTIVATION_KEY_S : ACTIVATION_KEY_C;
      var otherTime = state.keyTimes[other] || 0;
      var now = performance.now();
      if (state.keysDown[other] && (now - otherTime < ACTIVATION_WINDOW)) {
        // already in scene - this is a re-press, ignore
      }
    }
  }

  function animate(time) {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(animate);

    var dt = Math.min((time - state.lastTime) / 1000, 0.1);
    if (state.lastTime === 0) dt = 0;
    state.lastTime = time;

    if (!state.gameOver) {
      state.missionTime += dt;
      updateRappel(dt);
      updatePlayer(dt);
      updateShipBob(dt);
      updateWaves(dt);
      updateEnemies(dt);
      updateCrane(dt);
      updateObjectives(dt);
      updateStorm(dt);
      updateExtract(dt);
      updateCamera();
      updateHUD();
    }

    state.renderer.render(state.scene, state.camera);
  }

  function updateRappel(dt) {
    if (!state.rappelling) return;
    // Descend from Y=25 down to deck level
    state.rappelY -= 6 * dt;
    if (state.rappelY <= DECK_Y + 2) {
      state.rappelY = DECK_Y + 2;
      state.rappelling = false;
      if (state.rappelRope) {
        state.scene.remove(state.rappelRope);
        state.rappelRope = null;
      }
    }
    state.playerPos.y = state.rappelY;
    // Update rope geometry
    if (state.rappelRope) {
      var pts = [];
      pts.push(new THREE.Vector3(state.playerPos.x, RAPPEL_START_Y, state.playerPos.z));
      pts.push(new THREE.Vector3(state.playerPos.x, state.playerPos.y, state.playerPos.z));
      state.rappelRope.geometry.setFromPoints(pts);
    }
  }

  function updatePlayer(dt) {
    if (state.rappelling) return;

    var speed = state.playerSpeed * (state.stormActive ? 0.8 : 1.0) * dt;
    var moved = false;

    if (state.keysDown[87] || state.keysDown[38]) { // W or Up
      state.playerPos.z -= speed;
      moved = true;
    }
    if (state.keysDown[83] || state.keysDown[40]) { // S or Down
      state.playerPos.z += speed;
      moved = true;
    }
    if (state.keysDown[65] || state.keysDown[37]) { // A or Left
      state.playerPos.x -= speed;
      moved = true;
    }
    if (state.keysDown[68] || state.keysDown[39]) { // D or Right
      state.playerPos.x += speed;
      moved = true;
    }

    // Clamp to ship area
    state.playerPos.x = Math.max(-25, Math.min(25, state.playerPos.x));
    state.playerPos.z = Math.max(-8, Math.min(8, state.playerPos.z));

    // Crane ladder climb
    var nearLadder = (Math.abs(state.playerPos.x - 1.5) < 2 && Math.abs(state.playerPos.z - 0.7) < 2);
    if (nearLadder) {
      if (state.keysDown[87] || state.keysDown[38]) {
        state.playerPos.y += speed * 1.5;
        if (state.playerPos.y > CRANE_TOP_Y) state.playerPos.y = CRANE_TOP_Y;
      }
      if (state.keysDown[83] || state.keysDown[40]) {
        state.playerPos.y -= speed * 1.5;
        if (state.playerPos.y < DECK_Y + 1) state.playerPos.y = DECK_Y + 1;
      }
    } else if (!state.craneControlled) {
      // Gravity back to deck if not on ladder/cab
      if (state.playerPos.y > DECK_Y + 1 && !nearLadder) {
        state.playerPos.y = DECK_Y + 1;
      }
    }

    // Check proximity to crane cab
    var cabPos = state.craneCabMesh ? state.craneCabMesh.position : { x: 0, y: CRANE_TOP_Y, z: 0 };
    state.nearCraneCab = dist3(state.playerPos, cabPos) < 4;

    // Check proximity to contraband crates
    for (var i = 0; i < state.crateObjects.length; i++) {
      var cpos = state.crateObjects[i].position;
      state.nearCrates[i] = dist3(state.playerPos, cpos) < 3;
    }

    // Check near bridge comms
    var bridgePos = { x: 20, y: DECK_Y + 6, z: 0 };
    state.nearBridge = dist3(state.playerPos, bridgePos) < 6;

    // E key interactions
    if (state.keysDown[69]) { // E
      handleInteract(dt);
    } else {
      state.crateMarking = false;
      state.crateMarkTimer = 0;
      state.commsHolding = false;
      state.commsTimer = 0;
    }
  }

  function handleInteract(dt) {
    // Crane operation
    if (state.nearCraneCab && !state.craneControlled && !state.craneContainerFalling) {
      state.craneControlled = true;
      return;
    }
    if (state.craneControlled) {
      // Drop container
      state.craneContainerFalling = true;
      state.craneContainerFallVY = 0;
      state.craneControlled = false;
      return;
    }

    // Contraband crate marking (hold E 4s)
    for (var i = 0; i < state.crateObjects.length; i++) {
      if (state.nearCrates[i] && !state.crateObjects[i].userData.marked) {
        if (state.crateMarkIndex !== i) {
          state.crateMarkIndex = i;
          state.crateMarkTimer = 0;
          state.crateMarking = true;
        }
        state.crateMarkTimer += dt;
        if (state.crateMarkTimer >= MARK_HOLD_TIME) {
          state.crateObjects[i].userData.marked = true;
          state.crateObjects[i].material.emissive = new THREE.Color(0x00FF44);
          state.cratesMarked++;
          state.crateMarking = false;
          state.crateMarkTimer = 0;
        }
        return;
      }
    }

    // Bridge comms transmit (hold E 8s, requires all crates marked)
    if (state.nearBridge && state.cratesMarked >= 3 && !state.commsTransmitted) {
      state.commsHolding = true;
      state.commsTimer += dt;
      if (state.commsTimer >= COMMS_HOLD_TIME) {
        state.commsTransmitted = true;
        state.commsHolding = false;
        triggerExtraction();
      }
    }
  }

  function triggerExtraction() {
    // Smoke signal BoxGeometry (0x888888) + PointLight (0xAAFFAA)
    var sgGeo = new THREE.BoxGeometry(1, 4, 1);
    var sgMat = new THREE.MeshLambertMaterial({ color: 0x888888, transparent: true, opacity: 0.7 });
    var sg = new THREE.Mesh(sgGeo, sgMat);
    sg.position.set(state.playerPos.x, DECK_Y + 3, state.playerPos.z);
    state.scene.add(sg);
    state.objects.push(sg);
    state.smokeSignal = sg;

    var sl = new THREE.PointLight(0xAAFFAA, 2, 20);
    sl.position.set(state.playerPos.x, DECK_Y + 6, state.playerPos.z);
    state.scene.add(sl);
    state.smokeLight = sl;

    state.extractCalled = true;
    state.extractTimer = EXTRACT_HELI_DELAY;

    // Build extraction heli (simple box above scene)
    var hGeo = new THREE.BoxGeometry(8, 2, 5);
    var hMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
    var heli = new THREE.Mesh(hGeo, hMat);
    heli.position.set(0, 60, -30);
    state.scene.add(heli);
    state.objects.push(heli);
    state.extractHeli = heli;
    state.extractHeliY = 60;
  }

  function updateExtract(dt) {
    if (!state.extractCalled) return;
    if (state.helicopterArrived) return;

    state.extractTimer -= dt;

    if (state.extractHeli) {
      // Heli descends
      if (state.extractTimer <= 10) {
        state.extractHeliY -= 3 * dt;
        if (state.extractHeliY < DECK_Y + 8) state.extractHeliY = DECK_Y + 8;
      }
      state.extractHeli.position.y = state.extractHeliY;
    }

    if (state.extractTimer <= 0) {
      state.helicopterArrived = true;
      state.extractTimer = 0;
    }
  }

  function updateShipBob(dt) {
    if (!state.shipGroup) return;
    state.bobTime += dt;
    // Gentle bob Y ±0.3 over 4s period
    state.shipGroup.position.y = Math.sin(state.bobTime * (2 * Math.PI / 4)) * 0.3;
  }

  function updateWaves(dt) {
    state.waveTime += dt;
    for (var i = 0; i < state.waveMeshes.length; i++) {
      var phase = i * 0.5;
      state.waveMeshes[i].position.y = WATER_Y + Math.sin(state.waveTime * 0.8 + phase) * 0.4;
    }
  }

  function updateEnemies(dt) {
    var aliveCount = 0;
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (!e.alive) continue;
      aliveCount++;

      if (e.patrol) {
        e.patrolTimer += dt;
        var patrolRange = state.stormActive ? 4 : 8;
        var newX = e.startX + Math.sin(e.patrolTimer * 0.5 * e.patrolDir) * patrolRange;
        e.mesh.position.x = newX;
        e.mesh.rotation.y += dt * 0.3;
      }

      // Check if player is near enemy
      var epos = e.mesh.position;
      var pdist = dist3(state.playerPos, epos);
      if (pdist < 2) {
        state.playerHP -= 15 * dt;
        if (state.playerHP <= 0) {
          state.playerHP = 0;
          gameOver(false);
        }
      }

      // Check if crane container fell on enemy
      if (state.craneContainerFalling && state.craneContainer) {
        var cdist = dist3(state.craneContainer.position, epos);
        if (cdist < 4 && state.craneContainer.position.y <= epos.y + 3) {
          e.alive = false;
          state.scene.remove(e.mesh);
          continue;
        }
      }
    }
    state.crewAlive = aliveCount;
  }

  function updateCrane(dt) {
    if (!state.craneContainer) return;

    if (state.craneControlled) {
      // Player-controlled lifting
      if (state.keysDown[87] || state.keysDown[38]) {
        state.craneLiftY += 4 * dt;
        if (state.craneLiftY > CRANE_TOP_Y - 2) state.craneLiftY = CRANE_TOP_Y - 2;
      }
      if (state.keysDown[83] || state.keysDown[40]) {
        state.craneLiftY -= 4 * dt;
        if (state.craneLiftY < DECK_Y + 2) state.craneLiftY = DECK_Y + 2;
      }
      state.craneContainer.position.y = state.craneLiftY;
    }

    if (state.craneContainerFalling) {
      state.craneContainerFallVY -= 18 * dt;
      state.craneContainer.position.y += state.craneContainerFallVY * dt;
      if (state.craneContainer.position.y <= DECK_Y + 1.5) {
        state.craneContainer.position.y = DECK_Y + 1.5;
        state.craneContainerFalling = false;
        state.craneContainerFallVY = 0;
        // Check enemies near landing
        for (var j = 0; j < state.enemies.length; j++) {
          var en = state.enemies[j];
          if (!en.alive) continue;
          var ddist = dist3(state.craneContainer.position, en.mesh.position);
          if (ddist < 5) {
            en.alive = false;
            state.scene.remove(en.mesh);
          }
        }
      }
    }
  }

  function updateObjectives(dt) {
    // Victory: comms transmitted and extraction heli arrived, player near heli
    if (state.commsTransmitted && state.helicopterArrived && state.extractHeli) {
      var hdist = dist3(state.playerPos, state.extractHeli.position);
      if (hdist < 10) {
        gameOver(true);
      }
    }
  }

  function updateStorm(dt) {
    if (state.stormActive) return;
    if (state.missionTime >= STORM_TIME) {
      triggerStorm();
    }
  }

  function triggerStorm() {
    state.stormActive = true;
    // Increase fog density x2
    if (state.fog) {
      state.fog.density = state.normalFogDensity * 2;
    }
    // Rain PointLight overlay 0x224466
    for (var i = 0; i < 6; i++) {
      var rl = new THREE.PointLight(0x224466, 0.5 + Math.random() * 0.5, 40);
      rl.position.set(
        (Math.random() - 0.5) * 60,
        DECK_Y + 10 + Math.random() * 8,
        (Math.random() - 0.5) * 20
      );
      state.scene.add(rl);
      state.rainLights.push(rl);
    }
    // Darken scene background
    if (state.scene.background) {
      state.scene.background = new THREE.Color(0x001133);
    }
  }

  function updateCamera() {
    var tx = state.playerPos.x;
    var ty = state.playerPos.y + 20;
    var tz = state.playerPos.z + 55;
    state.camera.position.x += (tx - state.camera.position.x) * 0.08;
    state.camera.position.y += (ty - state.camera.position.y) * 0.08;
    state.camera.position.z += (tz - state.camera.position.z) * 0.08;
    state.camera.lookAt(state.playerPos.x, state.playerPos.y + 2, state.playerPos.z);
  }

  function dist3(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function gameOver(won) {
    state.gameOver = true;
    var msg = won ? 'MISSION COMPLETE - EXTRACTED' : 'MISSION FAILED';
    if (state.hudEl) {
      state.hudEl.innerHTML += '<br><span style="color:' + (won ? '#00FF88' : '#FF2244') + ';font-size:20px">' + msg + '</span>';
    }
    setTimeout(function () { destroy(); }, 5000);
  }

  // Activation gate via keydown event
  function activate() {
    init();
  }

  var _activateKeyDown = function (e) {
    var k = e.keyCode;
    if (k === ACTIVATION_KEY_C || k === ACTIVATION_KEY_S) {
      if (!window._cargoShipKeyTimes) window._cargoShipKeyTimes = {};
      if (!window._cargoShipKeysDown) window._cargoShipKeysDown = {};
      if (!window._cargoShipKeysDown[k]) {
        window._cargoShipKeyTimes[k] = performance.now();
      }
      window._cargoShipKeysDown[k] = true;

      var other = (k === ACTIVATION_KEY_C) ? ACTIVATION_KEY_S : ACTIVATION_KEY_C;
      var otherTime = window._cargoShipKeyTimes[other] || 0;
      var now = performance.now();
      if (window._cargoShipKeysDown[other] && (now - otherTime < ACTIVATION_WINDOW)) {
        if (!state.active) {
          activate();
        }
      }
    }
  };

  var _activateKeyUp = function (e) {
    var k = e.keyCode;
    if (window._cargoShipKeysDown) {
      window._cargoShipKeysDown[k] = false;
    }
  };

  document.addEventListener('keydown', _activateKeyDown);
  document.addEventListener('keyup', _activateKeyUp);

  return {
    init: init,
    destroy: destroy,
    getState: function () { return state; }
  };
})();
