window.CarrierAssault = (function () {
  'use strict';

  // ── state ──────────────────────────────────────────────────────────────────
  var scene, camera, renderer, clock;
  var active = false;
  var rootGroup;                 // entire carrier scene rotates for sea-state

  // key tracking
  var keys = {};
  var keyTimestamps = {};

  // player
  var player = { x: 0, y: 3, z: 55, onDeck: false, onBoat: true, onBridge: false };
  var playerMesh;
  var playerVelY = 0;
  var catapultActive = false;
  var catapultTimer = 0;

  // objects
  var carrierDeck, islandGroup, rudderMesh;
  var guards = [];
  var jets = [];
  var c4Planted = [];
  var heloGroup, heloRotor;
  var heloArrived = false;
  var rappelTroops = [];
  var arrestingWireLine;
  var landingAircraft;
  var landingAircraftVel = -8;
  var ribBoat;
  var ladderMesh;
  var bridgeRoom;

  // objectives
  var charges = 0;
  var totalGuards = 18;
  var guardsKilled = 0;
  var missionTimer = 360; // 6 minutes
  var heloTimer = 90;
  var missionComplete = false;
  var missionFailed = false;

  // sea state
  var seaPhase = 0;
  var SEA_AMP = 0.02;
  var SEA_FREQ = 0.3;

  // HUD element
  var hudEl;

  // ── helpers ────────────────────────────────────────────────────────────────
  function makeMesh(geo, color, x, y, z) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function dist2D(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function fmt2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function fmtTime(s) {
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return fmt2(m) + ':' + fmt2(sec);
  }

  // ── build scene ────────────────────────────────────────────────────────────
  function buildScene() {
    rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // ── lighting ──
    var ambient = new THREE.AmbientLight(0x334455, 1.2);
    rootGroup.add(ambient);
    var sun = new THREE.DirectionalLight(0xffeedd, 1.4);
    sun.position.set(40, 80, 20);
    rootGroup.add(sun);

    // ── sea plane ──
    var seaGeo = new THREE.BoxGeometry(300, 1, 300);
    var seaMesh = makeMesh(seaGeo, 0x113355, 0, -0.5, 0);
    rootGroup.add(seaMesh);

    // ── carrier deck ──
    var deckGeo = new THREE.BoxGeometry(80, 2, 30);
    carrierDeck = makeMesh(deckGeo, 0x556677, 0, 2, 0);
    rootGroup.add(carrierDeck);

    // angled flight deck (landing zone) – slight rotation
    var angledGeo = new THREE.BoxGeometry(30, 0.3, 14);
    var angledDeck = makeMesh(angledGeo, 0x445566, -20, 3.1, 8);
    angledDeck.rotation.z = 0.05;
    rootGroup.add(angledDeck);

    // deck-edge barriers
    var barrierPositions = [
      [-39, 3.5, 0], [39, 3.5, 0],
      [0, 3.5, -15], [0, 3.5, 15]
    ];
    for (var bi = 0; bi < barrierPositions.length; bi++) {
      var bp = barrierPositions[bi];
      var bGeo = new THREE.BoxGeometry(bi < 2 ? 1 : 80, 1, bi < 2 ? 30 : 1);
      var bMesh = makeMesh(bGeo, 0x888888, bp[0], bp[1], bp[2]);
      rootGroup.add(bMesh);
    }

    // ── island superstructure ──
    islandGroup = new THREE.Group();
    islandGroup.position.set(28, 3, -8);
    rootGroup.add(islandGroup);

    var islandBase = makeMesh(new THREE.BoxGeometry(8, 14, 6), 0x445566, 0, 7, 0);
    islandGroup.add(islandBase);

    // bridge room (top of island)
    bridgeRoom = makeMesh(new THREE.BoxGeometry(3, 3, 3), 0x334455, 0, 15.5, 0);
    islandGroup.add(bridgeRoom);

    // ATC tower on top
    var atcGeo = new THREE.BoxGeometry(3, 4, 3);
    var atcMesh = makeMesh(atcGeo, 0x223344, 0, 19, 0);
    islandGroup.add(atcMesh);

    // radar dish (objective)
    var radarBase = makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 8), 0x999999, 0, 22, 0);
    islandGroup.add(radarBase);
    var radarDish = makeMesh(new THREE.BoxGeometry(3, 0.2, 3), 0xaaaaaa, 0, 23.5, 0);
    islandGroup.add(radarDish);

    // ── rudder ──
    var rudderGeo = new THREE.BoxGeometry(0.5, 6, 4);
    rudderMesh = makeMesh(rudderGeo, 0x334455, 0, 0, -42);
    rootGroup.add(rudderMesh);

    // ── ladder ──
    var ladderGeo = new THREE.CylinderGeometry(0.15, 0.15, 6, 6);
    ladderMesh = makeMesh(ladderGeo, 0x888877, -36, 5.5, 13);
    rootGroup.add(ladderMesh);

    // ── catapult channel ──
    var catGeo = new THREE.BoxGeometry(30, 0.2, 1);
    var catMesh = makeMesh(catGeo, 0xaaaaaa, 10, 3.15, -5);
    rootGroup.add(catMesh);

    // ── fuel depot (objective) ──
    var fuelGeo = new THREE.CylinderGeometry(1.5, 1.5, 3, 8);
    var fuelMesh = makeMesh(fuelGeo, 0xff4400, -10, 4.5, 5);
    fuelMesh.userData.objective = 'fuel';
    rootGroup.add(fuelMesh);

    // ── ammo store (objective) ──
    var ammoGeo = new THREE.BoxGeometry(4, 2, 3);
    var ammoMesh = makeMesh(ammoGeo, 0x886600, 5, 4, -10);
    ammoMesh.userData.objective = 'ammo';
    rootGroup.add(ammoMesh);

    // ── fighter jets ──
    for (var ji = 0; ji < 2; ji++) {
      var jGroup = new THREE.Group();
      var jz = ji === 0 ? -3 : 3;
      jGroup.position.set(-5 + ji * 12, 3.5, jz);
      rootGroup.add(jGroup);

      var fuselage = makeMesh(new THREE.BoxGeometry(6, 1, 4), 0x667788, 0, 0, 0);
      jGroup.add(fuselage);

      var wing = makeMesh(new THREE.BoxGeometry(1, 0.2, 10), 0x556677, 0, 0, 0);
      jGroup.add(wing);

      var nose = makeMesh(new THREE.ConeGeometry(0.5, 2, 6), 0x556677, 3.5, 0, 0);
      nose.rotation.z = -Math.PI / 2;
      jGroup.add(nose);

      jGroup.userData.c4planted = false;
      jGroup.userData.jetIndex = ji;
      jets.push(jGroup);
    }

    // ── arresting wire ──
    var wirePoints = [];
    wirePoints.push(new THREE.Vector3(-25, 3.2, 8));
    wirePoints.push(new THREE.Vector3(-25, 3.2, -8));
    var wireGeo = new THREE.BufferGeometry().setFromPoints(wirePoints);
    var wireMat = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 });
    arrestingWireLine = new THREE.LineSegments(wireGeo, wireMat);
    rootGroup.add(arrestingWireLine);

    // ── landing aircraft (enemy) ──
    var laGeo = new THREE.BoxGeometry(5, 1, 4);
    landingAircraft = makeMesh(laGeo, 0xaa2222, -38, 4, 0);
    landingAircraft.userData.snared = false;
    rootGroup.add(landingAircraft);

    // ── RIB boat ──
    var ribGeo = new THREE.BoxGeometry(4, 1, 2);
    ribBoat = makeMesh(ribGeo, 0x222222, 0, 1.5, 52);
    rootGroup.add(ribBoat);

    // ── player mesh ──
    var pGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.8, 8);
    playerMesh = new THREE.Mesh(pGeo, new THREE.MeshLambertMaterial({ color: 0x006600 }));
    playerMesh.position.set(player.x, player.y, player.z);
    rootGroup.add(playerMesh);

    // ── guards ──
    buildGuards();

    // ── helicopter (arrives at T=90s) ──
    heloGroup = new THREE.Group();
    heloGroup.position.set(60, 30, 0);
    heloGroup.visible = false;
    rootGroup.add(heloGroup);

    var heloBody = makeMesh(new THREE.BoxGeometry(4, 1, 3), 0x444444, 0, 0, 0);
    heloGroup.add(heloBody);
    var heloTail = makeMesh(new THREE.BoxGeometry(4, 0.4, 0.5), 0x444444, -3.5, 0.2, 0);
    heloGroup.add(heloTail);
    heloRotor = new THREE.Group();
    heloGroup.add(heloRotor);
    var rotorBlade1 = makeMesh(new THREE.BoxGeometry(7, 0.1, 0.4), 0x333333, 0, 0.8, 0);
    heloRotor.add(rotorBlade1);
    var rotorBlade2 = makeMesh(new THREE.BoxGeometry(0.4, 0.1, 7), 0x333333, 0, 0.8, 0);
    heloRotor.add(rotorBlade2);
  }

  function buildGuards() {
    var guardPositions = [
      // deck guards (12)
      [-30, 4, 0], [-20, 4, 5], [-10, 4, -5], [0, 4, 8],
      [10, 4, -8], [20, 4, 4], [30, 4, -4], [-15, 4, -10],
      [5, 4, 10], [-5, 4, 0], [25, 4, 10], [15, 4, -12],
      // island guards (4) — offset from island group
      [28, 11, -8], [28, 11, -6], [28, 14, -8], [28, 14, -6],
      // ATC guards (2)
      [28, 18, -8], [28, 18, -6]
    ];

    for (var gi = 0; gi < guardPositions.length; gi++) {
      var gp = guardPositions[gi];
      var gGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.8, 8);
      var gMat = new THREE.MeshLambertMaterial({ color: 0x336688 });
      var gMesh = new THREE.Mesh(gGeo, gMat);
      gMesh.position.set(gp[0], gp[1], gp[2]);
      gMesh.userData.alive = true;
      gMesh.userData.patrol = true;
      gMesh.userData.patrolPhase = gi * 0.7;
      gMesh.userData.baseX = gp[0];
      gMesh.userData.baseZ = gp[2];
      rootGroup.add(gMesh);
      guards.push(gMesh);
    }
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function createHUD() {
    hudEl = document.getElementById('carrier-hud');
    if (!hudEl) {
      hudEl = document.createElement('div');
      hudEl.id = 'carrier-hud';
      hudEl.style.cssText = [
        'position:fixed',
        'bottom:0',
        'left:0',
        'right:0',
        'padding:8px 16px',
        'background:rgba(0,20,40,0.85)',
        'color:#00ffcc',
        'font:bold 13px/1.4 monospace',
        'z-index:9999',
        'letter-spacing:1px',
        'border-top:1px solid #00ffcc44'
      ].join(';');
      document.body.appendChild(hudEl);
    }
  }

  function updateHUD(dt) {
    if (!hudEl) return;

    var aliveGuards = 0;
    for (var gi = 0; gi < guards.length; gi++) {
      if (guards[gi].userData.alive) aliveGuards++;
    }

    var deckAngleDeg = (rootGroup.rotation.z * 180 / Math.PI).toFixed(1);
    var sign = deckAngleDeg >= 0 ? '+' : '';

    var heloStr = '';
    if (!heloArrived && heloTimer > 0) {
      heloStr = ' | HELO: INBOUND ' + fmtTime(heloTimer);
    } else if (heloArrived) {
      heloStr = ' | HELO: ON DECK';
    }

    var status = missionComplete ? ' [MISSION COMPLETE]' :
                 missionFailed   ? ' [MISSION FAILED]'   : '';

    hudEl.textContent =
      'CARRIER OPS [CHARGES: ' + charges + '/4]' +
      ' [GUARDS: ' + aliveGuards + ']' +
      ' [TIMER: ' + fmtTime(missionTimer) + ']' +
      ' [DECK: PITCHING ' + sign + deckAngleDeg + '°]' +
      heloStr + status;
  }

  // ── input ──────────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    if (!active) return;
    keys[e.code] = true;
    keyTimestamps[e.code] = Date.now();

    if (e.code === 'KeyE') handleInteract();
    if (e.code === 'KeyF') handleBridge();
    if (e.code === 'KeyC') handleCatapult();
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  // ── interactions ───────────────────────────────────────────────────────────
  function handleInteract() {
    // board from boat to deck via ladder
    if (player.onBoat) {
      var dLadder = dist2D(player.x, player.z, ladderMesh.position.x, ladderMesh.position.z);
      if (dLadder < 5) {
        player.onBoat = false;
        player.onDeck = true;
        player.x = ladderMesh.position.x;
        player.z = ladderMesh.position.z;
        player.y = 4;
      }
      return;
    }

    // plant C4 on jet engines
    for (var ji = 0; ji < jets.length; ji++) {
      var jet = jets[ji];
      if (!jet.userData.c4planted) {
        var dJet = dist2D(player.x, player.z, jet.position.x, jet.position.z);
        if (dJet < 5) {
          jet.userData.c4planted = true;
          charges++;
          jet.children[0].material.color.setHex(0xff3300); // engine glow
          return;
        }
      }
    }

    // plant C4 on fuel depot
    if (player.onDeck && charges < 4) {
      var dFuel = dist2D(player.x, player.z, -10, 5);
      if (dFuel < 4) {
        if (!c4Planted['fuel']) {
          c4Planted['fuel'] = true;
          charges++;
          return;
        }
      }
      // plant C4 on ammo store
      var dAmmo = dist2D(player.x, player.z, 5, -10);
      if (dAmmo < 4) {
        if (!c4Planted['ammo']) {
          c4Planted['ammo'] = true;
          charges++;
          return;
        }
      }
    }

    // exfil — return to RIB when all charges planted
    if (charges >= 4) {
      var dRib = dist2D(player.x, player.z, ribBoat.position.x, ribBoat.position.z);
      if (dRib < 8) {
        missionComplete = true;
      }
    }
  }

  function handleBridge() {
    if (!player.onDeck) return;
    // bridge is at island top — approx world pos 28, 17, -8
    var dBridge = dist2D(player.x, player.z, 28, -8);
    if (dBridge < 5 && player.y > 13) {
      player.onBridge = !player.onBridge;
    }
  }

  function handleCatapult() {
    if (!player.onDeck || catapultActive) return;
    // catapult channel at z=-5, x range -25..+5
    if (Math.abs(player.z - (-5)) < 2 && player.x > -25 && player.x < 5) {
      catapultActive = true;
      catapultTimer = 0.8;
    }
  }

  // ── update helpers ─────────────────────────────────────────────────────────
  function updatePlayer(dt) {
    var speed = 8;

    if (player.onBoat) {
      // move RIB toward ladder automatically
      if (ribBoat.position.z > ladderMesh.position.z + 3) {
        ribBoat.position.z -= 5 * dt;
        player.x = ribBoat.position.x;
        player.z = ribBoat.position.z;
        player.y = ribBoat.position.y + 1;
      }
    }

    if (player.onDeck || player.onBridge) {
      if (keys['KeyW'] || keys['ArrowUp'])    { player.z -= speed * dt; }
      if (keys['KeyS'] || keys['ArrowDown'])  { player.z += speed * dt; }
      if (keys['KeyA'] || keys['ArrowLeft'])  { player.x -= speed * dt; }
      if (keys['KeyD'] || keys['ArrowRight']) { player.x += speed * dt; }

      // clamp to ship bounds (approx)
      player.x = Math.max(-39, Math.min(39, player.x));
      player.z = Math.max(-14, Math.min(55, player.z));
    }

    // catapult launch
    if (catapultActive) {
      catapultTimer -= dt;
      player.x += 30 * dt;
      if (catapultTimer <= 0) {
        catapultActive = false;
      }
    }

    // bridge steering
    if (player.onBridge) {
      var rudderTurn = 0;
      if (keys['KeyA']) rudderTurn = 0.5;
      if (keys['KeyD']) rudderTurn = -0.5;
      if (rudderMesh) {
        rudderMesh.rotation.y += rudderTurn * dt;
        rudderMesh.rotation.y = Math.max(-0.6, Math.min(0.6, rudderMesh.rotation.y));
      }
    }

    if (playerMesh) {
      playerMesh.position.set(player.x, player.y, player.z);
    }
  }

  function updateGuards(dt, elapsed) {
    for (var gi = 0; gi < guards.length; gi++) {
      var g = guards[gi];
      if (!g.userData.alive) continue;
      g.userData.patrolPhase += dt * 0.5;
      g.position.x = g.userData.baseX + Math.sin(g.userData.patrolPhase) * 2;
      g.position.z = g.userData.baseZ + Math.cos(g.userData.patrolPhase * 0.7) * 2;

      // aggro — if player close, chase
      var dP = dist2D(g.position.x, g.position.z, player.x, player.z);
      if (dP < 15 && player.onDeck) {
        var dx = player.x - g.position.x;
        var dz = player.z - g.position.z;
        var len = Math.sqrt(dx * dx + dz * dz) || 1;
        g.position.x += (dx / len) * 3 * dt;
        g.position.z += (dz / len) * 3 * dt;
      }

      // kill guard if player shoots (spacebar)
      if (keys['Space'] && dP < 6 && player.onDeck) {
        g.userData.alive = false;
        g.visible = false;
        guardsKilled++;
      }
    }
  }

  function updateHelo(dt, elapsed) {
    if (heloArrived) {
      // spin rotors
      if (heloRotor) heloRotor.rotation.y += dt * 15;
      return;
    }

    heloTimer -= dt;
    if (heloTimer <= 0 && !heloArrived) {
      heloGroup.visible = true;
      heloArrived = true;
      // move helo to deck
      heloGroup.position.set(28, 20, -8);
      // drop rappel troops
      for (var ri = 0; ri < 4; ri++) {
        var rGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 6);
        var rMat = new THREE.MeshLambertMaterial({ color: 0x444422 });
        var rMesh = new THREE.Mesh(rGeo, rMat);
        rMesh.position.set(28 + (ri - 2) * 2, 20, -8);
        rMesh.userData.alive = true;
        rMesh.userData.rappeling = true;
        rMesh.userData.rappelY = 4;
        rMesh.userData.patrolPhase = ri * 1.2;
        rMesh.userData.baseX = 28 + (ri - 2) * 2;
        rMesh.userData.baseZ = -8;
        rootGroup.add(rMesh);
        guards.push(rMesh);
        rappelTroops.push(rMesh);
        totalGuards++;
      }
    }

    if (heloGroup.visible) {
      if (heloRotor) heloRotor.rotation.y += dt * 15;
      // rappel troops descend
      for (var rti = 0; rti < rappelTroops.length; rti++) {
        var rt = rappelTroops[rti];
        if (rt.userData.rappeling && rt.position.y > rt.userData.rappelY) {
          rt.position.y -= 8 * dt;
          if (rt.position.y <= rt.userData.rappelY) {
            rt.userData.rappeling = false;
          }
        }
      }
    }
  }

  function updateLandingAircraft(dt) {
    if (!landingAircraft) return;
    if (landingAircraft.userData.snared) return;
    landingAircraft.position.x += landingAircraftVel * dt;
    // check arresting wire at x = -25
    if (landingAircraft.position.x <= -25 && !landingAircraft.userData.snared) {
      landingAircraft.userData.snared = true;
      landingAircraftVel = 0;
      landingAircraft.material.color.setHex(0xff8800);
    }
    if (landingAircraft.position.x < -50) {
      landingAircraft.position.x = 60;
      landingAircraft.userData.snared = false;
      landingAircraftVel = -8;
    }
  }

  function updateSeaState(elapsed) {
    if (!rootGroup) return;
    rootGroup.rotation.z = Math.sin(elapsed * SEA_FREQ * Math.PI * 2) * SEA_AMP;
  }

  // ── camera follow ──────────────────────────────────────────────────────────
  function updateCamera() {
    if (!camera) return;
    camera.position.set(player.x, player.y + 8, player.z + 18);
    camera.lookAt(player.x, player.y + 1, player.z);
  }

  // ── public API ─────────────────────────────────────────────────────────────
  function init(sceneRef, cameraRef, rendererRef) {
    scene = sceneRef;
    camera = cameraRef;
    renderer = rendererRef;
    clock = new THREE.Clock();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    createHUD();
    buildScene();

    // set initial camera
    camera.position.set(0, 15, 75);
    camera.lookAt(0, 0, 0);

    active = true;
  }

  function update(dt, elapsed) {
    if (!active) return;

    updateSeaState(elapsed);
    updatePlayer(dt);
    updateGuards(dt, elapsed);
    updateHelo(dt, elapsed);
    updateLandingAircraft(dt);
    updateCamera();

    // mission timer (use real dt)
    if (!missionComplete && !missionFailed) {
      missionTimer -= dt;
      if (missionTimer < 0) missionTimer = 0;
      if (missionTimer <= 0 && !missionComplete) missionFailed = true;
    }

    updateHUD(dt);

    // radar spin
    if (islandGroup && islandGroup.children.length > 4) {
      islandGroup.children[islandGroup.children.length - 1].rotation.y += dt * 1.2;
    }
  }

  function reset() {
    active = false;

    // remove old scene graph
    if (rootGroup && scene) {
      scene.remove(rootGroup);
    }
    rootGroup = null;
    guards = [];
    jets = [];
    c4Planted = [];
    rappelTroops = [];

    player = { x: 0, y: 3, z: 55, onDeck: false, onBoat: true, onBridge: false };
    charges = 0;
    totalGuards = 18;
    guardsKilled = 0;
    missionTimer = 360;
    heloTimer = 90;
    heloArrived = false;
    missionComplete = false;
    missionFailed = false;
    catapultActive = false;
    catapultTimer = 0;
    landingAircraftVel = -8;
    seaPhase = 0;
    keys = {};
    keyTimestamps = {};

    if (hudEl) {
      hudEl.textContent = '';
    }

    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  }

  // activation (C+A within 400ms)
  window.addEventListener('keydown', function (e) {
    if (e.code === 'KeyC' || e.code === 'KeyA') {
      keyTimestamps[e.code] = Date.now();
      var other = e.code === 'KeyC' ? 'KeyA' : 'KeyC';
      if (keyTimestamps[other] && Math.abs(Date.now() - keyTimestamps[other]) < 400) {
        // fire activation event
        var evt = new CustomEvent('carrier-assault-activate');
        window.dispatchEvent(evt);
      }
    }
  });

  return { init: init, update: update, reset: reset };
}());
