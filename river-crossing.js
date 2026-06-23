window.RiverCrossing = (function () {
  'use strict';

  // ─── state ───────────────────────────────────────────────────────────────────
  var scene, camera, renderer, clock;
  var active = false;

  // keybinding activation (R + C within 400 ms)
  var keyRTime = 0;
  var keyCTime = 0;
  var ACTIVATION_WINDOW = 400;

  // player state
  var player = {
    mesh: null,
    hp: 120,
    maxHp: 150,
    bank: 'SOUTH',   // 'SOUTH' | 'RIVER' | 'NORTH'
    x: 0,
    z: 14,           // south bank z +14
    speed: 4,
    inBoat: false,
    dragging: false,
    draggingIndex: -1,
    dead: false
  };

  // crossing method
  var crossMethod = 'BOAT'; // 'BOAT' | 'FORD' | 'BRIDGE'

  // boat state
  var boat = {
    mesh: null,
    active: false,
    hp: 150,
    x: 0,
    z: 14,
    boarders: 0,
    maxBoarders: 4
  };

  // ford
  var fordActive = false;

  // bridge build
  var bridgeActive = false;
  var bridgeBuildTime = 0;
  var BRIDGE_BUILD_DURATION = 45;
  var bridgeSegments = [];
  var bridgeBuilt = false;

  // soldiers (friendly, 4 total)
  var soldiers = [];

  // engineers (3)
  var engineers = [];

  // enemies (10 + 1 RPG)
  var enemies = [];

  // bunkers (6)
  var bunkers = [];
  var bunkersCleared = 0;

  // river particles
  var riverParticles = [];
  var waterParticles = []; // ford splash

  // river mines (3)
  var mines = [];

  // smoke clouds
  var smokeClouds = [];
  var smokeActive = false;
  var smokeTimer = 0;
  var SMOKE_DURATION = 20;

  // mortar fire support
  var mortarActive = false;
  var mortarTimer = 0;
  var MORTAR_DELAY = 3;
  var MORTAR_SUPPRESS_DURATION = 15;
  var mortarSuppressed = false;
  var mortarSuppressTimer = 0;
  var mortarExplosions = [];

  // rockets (RPG)
  var rockets = [];

  // explosions (visual)
  var explosions = [];

  // enemy fire projectiles
  var bullets = [];

  // ford gap distance display
  var fordGapDist = 120;

  // HUD element
  var hudEl = null;

  // input keys
  var keys = {};

  // swept mines set
  var sweptMines = {};

  // enemy fire timers
  var enemyFireTimer = 0;
  var rpgFireTimer = 0;

  // secured flag
  var missionSecured = false;

  // ─── constants ────────────────────────────────────────────────────────────────
  var RIVER_MIN_Z = -10;  // north edge of river
  var RIVER_MAX_Z = 10;   // south edge of river
  var NORTH_BANK_Z = -14;
  var SOUTH_BANK_Z = 14;
  var FORD_X = 0;         // ford crossing point x

  // ─── helpers ──────────────────────────────────────────────────────────────────
  function makeBox(w, h, d, color, opacity, transparent) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({
      color: color,
      transparent: !!transparent,
      opacity: opacity !== undefined ? opacity : 1.0
    });
    return new THREE.Mesh(geo, mat);
  }

  function makeSphere(r, color, opacity, transparent) {
    var geo = new THREE.SphereGeometry(r, 8, 8);
    var mat = new THREE.MeshLambertMaterial({
      color: color,
      transparent: !!transparent,
      opacity: opacity !== undefined ? opacity : 1.0
    });
    return new THREE.Mesh(geo, mat);
  }

  function makeCylinder(rt, rb, h, color) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function makeCone(r, h, color) {
    var geo = new THREE.ConeGeometry(r, h, 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function randBetween(a, b) {
    return a + Math.random() * (b - a);
  }

  // ─── scene construction ───────────────────────────────────────────────────────
  function buildScene() {
    // River: 60 x 0.5 x 20 centred at y=0 z=0
    var riverMesh = makeBox(60, 0.5, 20, 0x1A5276, 0.7, true);
    riverMesh.position.set(0, 0, 0);
    scene.add(riverMesh);

    // South bank ground
    var southBank = makeBox(60, 0.5, 20, 0x5D4037, 1.0, false);
    southBank.position.set(0, -0.25, 17);
    scene.add(southBank);

    // North bank ground
    var northBank = makeBox(60, 0.5, 20, 0x4E342E, 1.0, false);
    northBank.position.set(0, -0.25, -17);
    scene.add(northBank);

    // Cover rocks on south bank (irregular boxes, 0x8B6914)
    var rockPositions = [
      [-8, 12], [-5, 13], [3, 11], [7, 13], [-12, 11], [10, 12]
    ];
    for (var ri = 0; ri < rockPositions.length; ri++) {
      var rw = randBetween(1, 3);
      var rh = randBetween(1, 3);
      var rd = randBetween(1, 3);
      var rock = makeBox(rw, rh, rd, 0x8B6914, 1.0, false);
      rock.position.set(
        rockPositions[ri][0],
        rh / 2,
        rockPositions[ri][1]
      );
      scene.add(rock);
    }

    // North bank bunkers (6 bunkers, 3x2x3, 0x555544)
    var bunkerXPositions = [-20, -10, -3, 3, 10, 20];
    for (var bi = 0; bi < 6; bi++) {
      var bunk = makeBox(3, 2, 3, 0x555544, 1.0, false);
      bunk.position.set(bunkerXPositions[bi], 1, -16);
      scene.add(bunk);
      bunkers.push({ mesh: bunk, cleared: false, x: bunkerXPositions[bi], z: -16 });

      // wireframe outline
      var edgesGeo = new THREE.BoxGeometry(3, 2, 3);
      var edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(edgesGeo),
        new THREE.LineBasicMaterial({ color: 0x888877 })
      );
      edges.position.copy(bunk.position);
      scene.add(edges);
    }

    // River flow particles (small cyan boxes)
    for (var pi = 0; pi < 40; pi++) {
      var pMesh = makeBox(0.2, 0.1, 0.2, 0x5DADE2, 0.6, true);
      pMesh.position.set(
        randBetween(-28, 28),
        0.3,
        randBetween(RIVER_MIN_Z, RIVER_MAX_Z)
      );
      scene.add(pMesh);
      riverParticles.push({ mesh: pMesh, speed: randBetween(0.5, 2.0) });
    }

    // River mines (3 BoxGeometry, 0xFF4400)
    var mineXPos = [-8, 2, 12];
    for (var mi = 0; mi < 3; mi++) {
      var mineMesh = makeBox(0.8, 0.8, 0.8, 0xFF4400, 1.0, false);
      mineMesh.position.set(mineXPos[mi], 0.4, randBetween(-8, 8));
      scene.add(mineMesh);
      mines.push({
        mesh: mineMesh,
        x: mineXPos[mi],
        z: mineMesh.position.z,
        swept: false,
        active: true
      });
    }

    // Player mesh (box person, green)
    var playerMesh = makeBox(0.8, 1.8, 0.8, 0x2E7D32, 1.0, false);
    playerMesh.position.set(player.x, 0.9, player.z);
    scene.add(playerMesh);
    player.mesh = playerMesh;

    // Player head
    var playerHead = makeSphere(0.35, 0xF5CBA7, 1.0, false);
    playerHead.position.set(0, 1.1, 0);
    playerMesh.add(playerHead);

    // Friendly soldiers (4, olive green)
    var soldierOffsets = [[-2, 12], [-1, 13], [2, 12], [1, 13]];
    for (var si = 0; si < 4; si++) {
      var sMesh = makeBox(0.7, 1.7, 0.7, 0x4CAF50, 1.0, false);
      sMesh.position.set(soldierOffsets[si][0], 0.85, soldierOffsets[si][1]);
      scene.add(sMesh);
      var sHead = makeSphere(0.3, 0xF5CBA7, 1.0, false);
      sHead.position.set(0, 1.0, 0);
      sMesh.add(sHead);
      soldiers.push({
        mesh: sMesh,
        hp: 100,
        alive: true,
        x: soldierOffsets[si][0],
        z: soldierOffsets[si][1],
        downed: false,
        dragTimer: 0
      });
    }

    // Engineers (3, dark green)
    for (var ei = 0; ei < 3; ei++) {
      var eMesh = makeBox(0.7, 1.7, 0.7, 0x334433, 1.0, false);
      eMesh.position.set(-4 + ei * 2, 0.85, 13);
      scene.add(eMesh);
      engineers.push({
        mesh: eMesh,
        x: -4 + ei * 2,
        z: 13,
        hp: 80,
        alive: true
      });
    }

    // Enemies on north bank (10 regular + 1 RPG)
    var enemyXBase = [-22, -16, -10, -5, 0, 5, 10, 16, 22, 18];
    for (var eni = 0; eni < 10; eni++) {
      var enMesh = makeBox(0.8, 1.8, 0.8, 0x795548, 1.0, false);
      enMesh.position.set(enemyXBase[eni], 0.9, -14);
      scene.add(enMesh);
      var enHead = makeSphere(0.35, 0xBCAAA4, 1.0, false);
      enHead.position.set(0, 1.1, 0);
      enMesh.add(enHead);
      enemies.push({
        mesh: enMesh,
        hp: 80,
        alive: true,
        x: enemyXBase[eni],
        z: -14,
        fireTimer: randBetween(0, 3),
        isRpg: false
      });
    }
    // RPG carrier (1)
    var rpgMesh = makeBox(0.8, 1.8, 0.8, 0x4E342E, 1.0, false);
    rpgMesh.position.set(-18, 0.9, -15);
    scene.add(rpgMesh);
    var rpgHead = makeSphere(0.35, 0xBCAAA4, 1.0, false);
    rpgHead.position.set(0, 1.1, 0);
    rpgMesh.add(rpgHead);
    // RPG tube cone
    var rpgTube = makeCone(0.15, 1.0, 0x333300);
    rpgTube.position.set(0.5, 0, 0);
    rpgTube.rotation.z = -Math.PI / 2;
    rpgMesh.add(rpgTube);
    enemies.push({
      mesh: rpgMesh,
      hp: 100,
      alive: true,
      x: -18,
      z: -15,
      fireTimer: 5,
      isRpg: true
    });

    // Ambient light + directional
    var ambient = new THREE.AmbientLight(0x607D8B, 0.6);
    scene.add(ambient);
    var dirLight = new THREE.DirectionalLight(0xFFFFCC, 1.0);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Fog
    scene.fog = new THREE.FogExp2(0x607090, 0.025);
    scene.background = new THREE.Color(0x607090);
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────────
  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'river-crossing-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:13px',
      'padding:8px 16px',
      'border:1px solid #00FF88',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(hudEl);
  }

  function updateHUD() {
    if (!hudEl) return;
    var aliveCount = 0;
    for (var si = 0; si < soldiers.length; si++) {
      if (soldiers[si].alive) aliveCount++;
    }
    var methodStr = crossMethod;
    var suppStr = mortarSuppressed ? ' [SUPPRESSED]' : '';
    var secStr = missionSecured ? ' [SECURED!]' : '';
    hudEl.textContent =
      'RIVER CROSS' +
      ' [METHOD: ' + methodStr + ']' +
      ' [HP: ' + player.hp + '/' + player.maxHp + ']' +
      ' [SOLDIERS: ' + aliveCount + '/4]' +
      ' [BANK: ' + player.bank + ']' +
      ' | FORD GAP: ' + fordGapDist + 'm' +
      ' | BUNKERS: ' + bunkersCleared + '/3 CLEARED' +
      suppStr + secStr;
  }

  // ─── boat ─────────────────────────────────────────────────────────────────────
  function spawnBoat() {
    if (boat.mesh) {
      scene.remove(boat.mesh);
      boat.mesh = null;
    }
    var bMesh = makeBox(5, 1, 3, 0x1A3A1A, 1.0, false);
    bMesh.position.set(player.x, 0.5, player.z - 1);
    scene.add(bMesh);
    boat.mesh = bMesh;
    boat.active = true;
    boat.hp = 150;
    boat.x = player.x;
    boat.z = player.z - 1;
    boat.boarders = 1;
    player.inBoat = true;
    crossMethod = 'BOAT';
  }

  function destroyBoat() {
    if (boat.mesh) {
      scene.remove(boat.mesh);
      boat.mesh = null;
    }
    boat.active = false;
    player.inBoat = false;
    boat.boarders = 0;
  }

  // ─── smoke ────────────────────────────────────────────────────────────────────
  function throwSmoke() {
    // remove old smoke
    for (var i = 0; i < smokeClouds.length; i++) {
      scene.remove(smokeClouds[i].mesh);
    }
    smokeClouds = [];

    for (var si = 0; si < 6; si++) {
      var sm = makeSphere(1.5, 0xAAAAAA, 0.4, true);
      sm.position.set(
        player.x + randBetween(-6, 6),
        1.5,
        player.z + randBetween(-3, 3)
      );
      scene.add(sm);
      smokeClouds.push({
        mesh: sm,
        vx: randBetween(-0.5, 0.5),
        vz: randBetween(-1.5, -0.5) // drifts north with current
      });
    }
    smokeActive = true;
    smokeTimer = SMOKE_DURATION;
  }

  // ─── mortar mission ───────────────────────────────────────────────────────────
  function callMortar() {
    if (mortarActive) return;
    mortarActive = true;
    mortarTimer = MORTAR_DELAY;
  }

  function triggerMortarImpacts() {
    var impactCount = 0;
    var totalImpacts = 5;
    var delay = 0;

    function doImpact() {
      var ex = randBetween(-20, 20);
      var ez = randBetween(-18, -12);
      createExplosion(ex, ez, 2.5, 0xFF6600);
      impactCount++;
      if (impactCount < totalImpacts) {
        // stagger next impact, using setTimeout is not available in pure module,
        // but we track via mortarExplosions list with timers
      }
    }

    for (var ii = 0; ii < totalImpacts; ii++) {
      mortarExplosions.push({
        timer: ii * 0.4,
        done: false,
        x: randBetween(-20, 20),
        z: randBetween(-18, -12)
      });
    }
    mortarSuppressed = true;
    mortarSuppressTimer = MORTAR_SUPPRESS_DURATION;
  }

  // ─── explosion ────────────────────────────────────────────────────────────────
  function createExplosion(x, z, radius, color) {
    var exMesh = makeSphere(radius, color !== undefined ? color : 0xFF4400, 0.85, true);
    exMesh.position.set(x, radius / 2, z);
    scene.add(exMesh);
    explosions.push({ mesh: exMesh, life: 0.6, maxLife: 0.6, r: radius });
  }

  // ─── mine sweep ───────────────────────────────────────────────────────────────
  function sweepMines() {
    for (var mi = 0; mi < mines.length; mi++) {
      var mine = mines[mi];
      if (!mine.active || mine.swept) continue;
      var d = dist2D(player.x, player.z, mine.x, mine.z);
      if (d < 3) {
        mine.swept = true;
        mine.mesh.material.color.setHex(0x00FF00);
        mine.mesh.material.opacity = 0.5;
        mine.mesh.material.transparent = true;
      }
    }
  }

  // ─── bunker clear ────────────────────────────────────────────────────────────
  function clearNearbyBunker() {
    for (var bi = 0; bi < bunkers.length; bi++) {
      var bunk = bunkers[bi];
      if (bunk.cleared) continue;
      if (player.bank !== 'NORTH') continue;
      var d = dist2D(player.x, player.z, bunk.x, bunk.z);
      if (d < 4) {
        bunk.cleared = true;
        bunk.mesh.material.color.setHex(0x228822);
        bunkersCleared++;
        if (bunkersCleared >= 3 && !missionSecured) {
          missionSecured = true;
        }
        break;
      }
    }
  }

  // ─── bridge build ────────────────────────────────────────────────────────────
  function startBridgeBuild() {
    if (bridgeBuilt || bridgeActive) return;
    if (player.bank !== 'SOUTH') return;
    bridgeActive = true;
    bridgeBuildTime = 0;
    crossMethod = 'BRIDGE';
  }

  function updateBridge(dt) {
    if (!bridgeActive || bridgeBuilt) return;
    bridgeBuildTime += dt;
    var progress = bridgeBuildTime / BRIDGE_BUILD_DURATION; // 0..1
    var totalSegments = 10;
    var expectedSegs = Math.floor(progress * totalSegments);

    while (bridgeSegments.length < expectedSegs) {
      var segIdx = bridgeSegments.length;
      var segZ = RIVER_MAX_Z - (segIdx / totalSegments) * 20;
      var segMesh = makeBox(3, 0.4, 2, 0x5D4037, 1.0, false);
      segMesh.position.set(FORD_X, 0.2, segZ);
      scene.add(segMesh);
      bridgeSegments.push(segMesh);
    }

    if (bridgeBuildTime >= BRIDGE_BUILD_DURATION) {
      bridgeBuilt = true;
      bridgeActive = false;
    }
  }

  // ─── ford ────────────────────────────────────────────────────────────────────
  function activateFord() {
    crossMethod = 'FORD';
    fordActive = true;
    fordGapDist = Math.round(dist2D(player.x, player.z, FORD_X, RIVER_MIN_Z));
  }

  // ─── enemy AI ────────────────────────────────────────────────────────────────
  function isPlayerCrossing() {
    return player.bank === 'RIVER' || player.inBoat;
  }

  function isThroughSmoke(ex, ez, tx, tz) {
    if (!smokeActive) return false;
    for (var si = 0; si < smokeClouds.length; si++) {
      var sc = smokeClouds[si];
      var mp = sc.mesh.position;
      // check if line passes near smoke cloud (simple midpoint check)
      var mx = (ex + tx) / 2;
      var mz = (ez + tz) / 2;
      if (dist2D(mx, mz, mp.x, mp.z) < 3) return true;
    }
    return false;
  }

  function updateEnemyFire(dt) {
    enemyFireTimer -= dt;
    if (enemyFireTimer <= 0) {
      enemyFireTimer = 0.8 + Math.random() * 0.8;
      for (var ei = 0; ei < enemies.length; ei++) {
        var en = enemies[ei];
        if (!en.alive || en.isRpg) continue;

        // only fire at crossing targets
        var targetX, targetZ;
        if (player.inBoat && boat.active) {
          targetX = boat.x;
          targetZ = boat.z;
        } else if (isPlayerCrossing()) {
          targetX = player.x;
          targetZ = player.z;
        } else {
          continue;
        }

        var range = dist2D(en.x, en.z, targetX, targetZ);
        var baseAcc = 0.6;
        // accuracy drops with range
        var accMod = Math.max(0.1, baseAcc - range * 0.015);
        // smoke halves accuracy
        if (isThroughSmoke(en.x, en.z, targetX, targetZ)) accMod *= 0.4;
        // suppressed enemies have very low accuracy
        if (mortarSuppressed) accMod *= 0.2;

        if (Math.random() < accMod) {
          // hit! deal damage
          if (player.inBoat && boat.active) {
            boat.hp -= randBetween(3, 8);
          } else {
            player.hp -= randBetween(2, 6);
          }
        }

        // fire bullet tracer
        var bMesh = makeBox(0.1, 0.1, 0.5, 0xFFFF44, 1.0, false);
        bMesh.position.set(en.x, 1.2, en.z);
        scene.add(bMesh);
        var bDirX = targetX - en.x;
        var bDirZ = targetZ - en.z;
        var bLen = Math.sqrt(bDirX * bDirX + bDirZ * bDirZ) || 1;
        bullets.push({
          mesh: bMesh,
          vx: (bDirX / bLen) * 30,
          vz: (bDirZ / bLen) * 30,
          life: 0.5
        });
      }
    }

    // RPG fire at boat
    rpgFireTimer -= dt;
    if (rpgFireTimer <= 0 && boat.active) {
      rpgFireTimer = 4 + Math.random() * 3;
      for (var ri = 0; ri < enemies.length; ri++) {
        var rpgEn = enemies[ri];
        if (!rpgEn.alive || !rpgEn.isRpg) continue;
        // fire rocket toward boat
        var rocketMesh = makeSphere(0.3, 0xFF4400, 1.0, false);
        rocketMesh.position.set(rpgEn.x, 1.2, rpgEn.z);
        scene.add(rocketMesh);
        var rdx = boat.x - rpgEn.x;
        var rdz = boat.z - rpgEn.z;
        var rlen = Math.sqrt(rdx * rdx + rdz * rdz) || 1;
        rockets.push({
          mesh: rocketMesh,
          vx: (rdx / rlen) * 12,
          vz: (rdz / rlen) * 12,
          life: 4
        });
        break;
      }
    }
  }

  // ─── update rockets ───────────────────────────────────────────────────────────
  function updateRockets(dt) {
    for (var i = rockets.length - 1; i >= 0; i--) {
      var rock = rockets[i];
      rock.life -= dt;
      rock.mesh.position.x += rock.vx * dt;
      rock.mesh.position.z += rock.vz * dt;

      // hit boat?
      if (boat.active) {
        var d = dist2D(rock.mesh.position.x, rock.mesh.position.z, boat.x, boat.z);
        if (d < 3) {
          boat.hp -= 100;
          createExplosion(rock.mesh.position.x, rock.mesh.position.z, 2.0, 0xFF6600);
          scene.remove(rock.mesh);
          rockets.splice(i, 1);
          continue;
        }
      }

      if (rock.life <= 0) {
        scene.remove(rock.mesh);
        rockets.splice(i, 1);
      }
    }
  }

  // ─── update bullets ───────────────────────────────────────────────────────────
  function updateBullets(dt) {
    for (var i = bullets.length - 1; i >= 0; i--) {
      var b = bullets[i];
      b.life -= dt;
      b.mesh.position.x += b.vx * dt;
      b.mesh.position.z += b.vz * dt;
      if (b.life <= 0) {
        scene.remove(b.mesh);
        bullets.splice(i, 1);
      }
    }
  }

  // ─── update explosions ────────────────────────────────────────────────────────
  function updateExplosions(dt) {
    for (var i = explosions.length - 1; i >= 0; i--) {
      var ex = explosions[i];
      ex.life -= dt;
      var ratio = ex.life / ex.maxLife;
      ex.mesh.scale.setScalar(1 + (1 - ratio) * 0.5);
      ex.mesh.material.opacity = ratio * 0.85;
      if (ex.life <= 0) {
        scene.remove(ex.mesh);
        explosions.splice(i, 1);
      }
    }
  }

  // ─── update river particles ───────────────────────────────────────────────────
  function updateRiverParticles(dt) {
    for (var i = 0; i < riverParticles.length; i++) {
      var rp = riverParticles[i];
      // drift northward (negative z = north)
      rp.mesh.position.z -= rp.speed * dt;
      if (rp.mesh.position.z < RIVER_MIN_Z) {
        rp.mesh.position.z = RIVER_MAX_Z;
        rp.mesh.position.x = randBetween(-28, 28);
      }
    }
  }

  // ─── update smoke ────────────────────────────────────────────────────────────
  function updateSmoke(dt) {
    if (!smokeActive) return;
    smokeTimer -= dt;
    for (var i = 0; i < smokeClouds.length; i++) {
      var sc = smokeClouds[i];
      sc.mesh.position.x += sc.vx * dt;
      sc.mesh.position.z += sc.vz * dt;
    }
    if (smokeTimer <= 0) {
      smokeActive = false;
      for (var si = 0; si < smokeClouds.length; si++) {
        scene.remove(smokeClouds[si].mesh);
      }
      smokeClouds = [];
    }
  }

  // ─── update mortar ────────────────────────────────────────────────────────────
  function updateMortar(dt) {
    if (!mortarActive) return;
    mortarTimer -= dt;
    if (mortarTimer <= 0) {
      mortarActive = false;
      triggerMortarImpacts();
    }

    // process staged mortar explosions
    for (var i = mortarExplosions.length - 1; i >= 0; i--) {
      var me = mortarExplosions[i];
      if (me.done) continue;
      me.timer -= dt;
      if (me.timer <= 0) {
        me.done = true;
        createExplosion(me.x, me.z, 2.5, 0xFF6600);
        // damage nearby enemies
        for (var ei = 0; ei < enemies.length; ei++) {
          var en = enemies[ei];
          if (!en.alive) continue;
          var d = dist2D(me.x, me.z, en.x, en.z);
          if (d < 5) {
            en.hp -= randBetween(20, 60);
            if (en.hp <= 0) {
              en.alive = false;
              en.mesh.visible = false;
            }
          }
        }
      }
    }
    // clean done explosions
    var allDone = true;
    for (var mi = 0; mi < mortarExplosions.length; mi++) {
      if (!mortarExplosions[mi].done) { allDone = false; break; }
    }
    if (allDone && mortarExplosions.length > 0) {
      mortarExplosions = [];
    }

    // suppress timer
    if (mortarSuppressed) {
      mortarSuppressTimer -= dt;
      if (mortarSuppressTimer <= 0) {
        mortarSuppressed = false;
      }
    }
  }

  // ─── update ford water splash ─────────────────────────────────────────────────
  function updateWaterSplash(dt) {
    // remove old
    for (var i = waterParticles.length - 1; i >= 0; i--) {
      waterParticles[i].life -= dt;
      waterParticles[i].mesh.position.y += 1.5 * dt;
      waterParticles[i].mesh.material.opacity = Math.max(0, waterParticles[i].life / 0.6);
      if (waterParticles[i].life <= 0) {
        scene.remove(waterParticles[i].mesh);
        waterParticles.splice(i, 1);
      }
    }

    // spawn new splashes if in ford
    if (fordActive && player.bank === 'RIVER' && crossMethod === 'FORD') {
      if (Math.random() < 0.4) {
        var sp = makeSphere(0.15, 0x5DADE2, 0.7, true);
        sp.position.set(
          player.x + randBetween(-0.5, 0.5),
          0.3,
          player.z + randBetween(-0.5, 0.5)
        );
        scene.add(sp);
        waterParticles.push({ mesh: sp, life: 0.6 });
      }
    }
  }

  // ─── determine player bank ────────────────────────────────────────────────────
  function updatePlayerBank() {
    if (player.z > RIVER_MAX_Z) {
      player.bank = 'SOUTH';
    } else if (player.z < RIVER_MIN_Z) {
      player.bank = 'NORTH';
    } else {
      player.bank = 'RIVER';
    }
  }

  // ─── player movement ──────────────────────────────────────────────────────────
  function movePlayer(dt) {
    if (player.dead) return;

    var speed = player.speed;
    var inRiver = (player.bank === 'RIVER');
    var currentPush = 0;

    if (player.inBoat && boat.active) {
      // boat WASD
      if (keys['w'] || keys['W'] || keys['ArrowUp']) {
        boat.z -= speed * dt * 1.5;
      }
      if (keys['s'] || keys['S'] || keys['ArrowDown']) {
        // don't allow re-use of S for smoke while in boat — smoke only when not in boat
        boat.z += speed * dt * 1.5;
      }
      if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
        boat.x -= speed * dt * 1.5;
      }
      if (keys['d'] || keys['D'] || keys['ArrowRight']) {
        boat.x += speed * dt * 1.5;
      }
      // current pushes sideways (positive x = east)
      boat.x += 0.8 * dt;
      // clamp x
      boat.x = Math.max(-28, Math.min(28, boat.x));
      // clamp z in some range
      boat.z = Math.max(-18, Math.min(18, boat.z));
      if (boat.mesh) {
        boat.mesh.position.set(boat.x, 0.5, boat.z);
      }
      // player rides in boat
      player.x = boat.x;
      player.z = boat.z;
    } else {
      // on foot movement
      var ford = (crossMethod === 'FORD' && fordActive);
      if (ford && inRiver) {
        speed *= 0.4; // 60% slow
        currentPush = 0.5; // sideways current
      }
      if (player.dragging) {
        speed *= 0.3; // drag slows to 30%
      }

      if (keys['w'] || keys['W'] || keys['ArrowUp']) {
        player.z -= speed * dt;
      }
      if (keys['s'] || keys['S'] || keys['ArrowDown']) {
        player.z += speed * dt;
      }
      if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
        player.x -= speed * dt;
      }
      if (keys['d'] || keys['D'] || keys['ArrowRight']) {
        player.x += speed * dt;
      }

      if (ford && inRiver) {
        player.x += currentPush * dt;
      }

      player.x = Math.max(-28, Math.min(28, player.x));
      player.z = Math.max(-22, Math.min(22, player.z));
    }

    if (player.mesh) {
      player.mesh.position.set(player.x, 0.9, player.z);
    }

    updatePlayerBank();

    // update ford gap
    if (fordActive) {
      fordGapDist = Math.max(0, Math.round(Math.abs(player.z - RIVER_MIN_Z) * 6));
    }
  }

  // ─── update soldiers following player ────────────────────────────────────────
  function updateSoldiers(dt) {
    for (var si = 0; si < soldiers.length; si++) {
      var sol = soldiers[si];
      if (!sol.alive) {
        if (!sol.downed) {
          sol.downed = true;
          sol.mesh.rotation.x = Math.PI / 2;
          sol.mesh.position.y = 0.35;
        }
        continue;
      }
      // follow player with offset
      var targetX = player.x + (si % 2 === 0 ? -1.5 : 1.5);
      var targetZ = player.z + 1.5 + si * 0.5;
      var dx = targetX - sol.x;
      var dz = targetZ - sol.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 0.3) {
        var spd = player.dragging ? player.speed * 0.3 : player.speed * 0.9;
        sol.x += (dx / dist) * spd * dt;
        sol.z += (dz / dist) * spd * dt;
        sol.mesh.position.set(sol.x, 0.85, sol.z);
      }

      // take enemy fire damage (same as player proportionally)
      // already handled in enemy fire — soldiers on crossing get hit
    }
  }

  // ─── boat mine collision ──────────────────────────────────────────────────────
  function checkBoatMines() {
    if (!boat.active) return;
    for (var mi = 0; mi < mines.length; mi++) {
      var mine = mines[mi];
      if (!mine.active || mine.swept) continue;
      var d = dist2D(boat.x, boat.z, mine.x, mine.z);
      if (d < 3) {
        // detonation
        boat.hp -= 100;
        mine.active = false;
        scene.remove(mine.mesh);
        createExplosion(mine.x, mine.z, 2.0, 0xFF6600);
        if (boat.hp <= 0) {
          player.inBoat = false;
          player.hp -= 40; // blast damage
          destroyBoat();
        }
      }
    }
  }

  // ─── check player death ───────────────────────────────────────────────────────
  function checkPlayerDeath() {
    if (player.hp <= 0 && !player.dead) {
      player.dead = true;
      player.hp = 0;
      if (player.mesh) {
        player.mesh.rotation.x = Math.PI / 2;
        player.mesh.position.y = 0.4;
      }
      if (hudEl) {
        hudEl.style.color = '#FF4444';
      }
    }
    if (player.hp > player.maxHp) player.hp = player.maxHp;
    if (player.hp < 0) player.hp = 0;
  }

  // ─── check boat sinking ───────────────────────────────────────────────────────
  function checkBoatDamage() {
    if (!boat.active) return;
    if (boat.hp <= 0) {
      player.inBoat = false;
      destroyBoat();
    }
    if (boat.hp > 150) boat.hp = 150;
    if (boat.hp < 0) boat.hp = 0;
  }

  // ─── drag body ────────────────────────────────────────────────────────────────
  function updateDrag() {
    if (!player.dragging) return;
    var idx = player.draggingIndex;
    if (idx < 0 || idx >= soldiers.length) { player.dragging = false; return; }
    var sol = soldiers[idx];
    sol.x = player.x + 0.8;
    sol.z = player.z + 1.0;
    if (sol.mesh) sol.mesh.position.set(sol.x, 0.35, sol.z);
  }

  // ─── camera follow ────────────────────────────────────────────────────────────
  function updateCamera() {
    if (!camera) return;
    camera.position.set(player.x, 14, player.z + 12);
    camera.lookAt(player.x, 0, player.z - 2);
  }

  // ─── key handlers ─────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    keys[e.key] = true;
    var now = Date.now();

    if (e.key === 'r' || e.key === 'R') {
      keyRTime = now;
    }
    if (e.key === 'c' || e.key === 'C') {
      keyCTime = now;
    }

    // Activation check
    if (Math.abs(keyRTime - keyCTime) < ACTIVATION_WINDOW && keyRTime > 0 && keyCTime > 0) {
      if (!active) {
        startGame();
      }
      keyRTime = 0;
      keyCTime = 0;
    }

    if (!active) return;

    // B key — spawn boat (if on south bank) or clear bunker (if on north bank)
    if (e.key === 'b' || e.key === 'B') {
      if (player.bank === 'SOUTH' && !player.inBoat) {
        crossMethod = 'BOAT';
        spawnBoat();
      } else if (player.bank === 'NORTH') {
        clearNearbyBunker();
      }
    }

    // F key — ford
    if (e.key === 'f' || e.key === 'F') {
      if (player.bank === 'SOUTH' || player.bank === 'RIVER') {
        activateFord();
      }
    }

    // G key — bridge build or drag body
    if (e.key === 'g' || e.key === 'G') {
      // check if near a downed soldier
      var nearDowned = false;
      for (var si = 0; si < soldiers.length; si++) {
        var sol = soldiers[si];
        if (sol.downed && !sol.alive) {
          var d = dist2D(player.x, player.z, sol.x, sol.z);
          if (d < 2.5) {
            player.dragging = true;
            player.draggingIndex = si;
            nearDowned = true;
            break;
          }
        }
      }
      if (!nearDowned) {
        startBridgeBuild();
      }
    }

    // G key release — stop drag
    if (e.key === 'g' || e.key === 'G') {
      // drag is toggled on hold — handled via keyup
    }

    // Q key — mortar
    if (e.key === 'q' || e.key === 'Q') {
      callMortar();
    }

    // S key — smoke (only when not using S for boat movement — can check if not in boat)
    if ((e.key === 's' || e.key === 'S') && !player.inBoat && !keys['ArrowDown']) {
      throwSmoke();
    }

    // E key — mine sweep
    if (e.key === 'e' || e.key === 'E') {
      sweepMines();
    }
  }

  function onKeyUp(e) {
    keys[e.key] = false;

    // release body drag
    if ((e.key === 'g' || e.key === 'G') && player.dragging) {
      player.dragging = false;
      player.draggingIndex = -1;
    }
  }

  // ─── init ────────────────────────────────────────────────────────────────────
  function init(sceneRef, cameraRef, rendererRef) {
    scene = sceneRef;
    camera = cameraRef;
    renderer = rendererRef;
    clock = new THREE.Clock();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  function startGame() {
    if (active) return;
    active = true;

    // clear existing if any
    reset();
    buildScene();
    buildHUD();
    updateHUD();
  }

  // ─── update (called per frame) ────────────────────────────────────────────────
  function update(dt) {
    if (!active) return;
    if (dt === undefined || dt === null) {
      dt = clock ? clock.getDelta() : 0.016;
    }

    if (player.dead) {
      updateCamera();
      return;
    }

    movePlayer(dt);
    updateSoldiers(dt);
    updateDrag();
    updateRiverParticles(dt);
    updateSmoke(dt);
    updateMortar(dt);
    updateWaterSplash(dt);
    updateBridge(dt);
    updateEnemyFire(dt);
    updateRockets(dt);
    updateBullets(dt);
    updateExplosions(dt);
    checkBoatMines();
    checkBoatDamage();
    checkPlayerDeath();
    updateCamera();
    updateHUD();

    // clamp hp
    if (player.hp > player.maxHp) player.hp = player.maxHp;
  }

  // ─── reset ────────────────────────────────────────────────────────────────────
  function reset() {
    // remove meshes
    if (player.mesh) { scene.remove(player.mesh); player.mesh = null; }

    for (var si = 0; si < soldiers.length; si++) {
      scene.remove(soldiers[si].mesh);
    }
    soldiers = [];

    for (var ei = 0; ei < engineers.length; ei++) {
      scene.remove(engineers[ei].mesh);
    }
    engineers = [];

    for (var eni = 0; eni < enemies.length; eni++) {
      scene.remove(enemies[eni].mesh);
    }
    enemies = [];

    for (var bi = 0; bi < bunkers.length; bi++) {
      scene.remove(bunkers[bi].mesh);
    }
    bunkers = [];

    if (boat.mesh) { scene.remove(boat.mesh); boat.mesh = null; }

    for (var pi = 0; pi < riverParticles.length; pi++) {
      scene.remove(riverParticles[pi].mesh);
    }
    riverParticles = [];

    for (var mi = 0; mi < mines.length; mi++) {
      scene.remove(mines[mi].mesh);
    }
    mines = [];

    for (var sci = 0; sci < smokeClouds.length; sci++) {
      scene.remove(smokeClouds[sci].mesh);
    }
    smokeClouds = [];

    for (var rki = 0; rki < rockets.length; rki++) {
      scene.remove(rockets[rki].mesh);
    }
    rockets = [];

    for (var bui = 0; bui < bullets.length; bui++) {
      scene.remove(bullets[bui].mesh);
    }
    bullets = [];

    for (var exi = 0; exi < explosions.length; exi++) {
      scene.remove(explosions[exi].mesh);
    }
    explosions = [];

    for (var wpi = 0; wpi < waterParticles.length; wpi++) {
      scene.remove(waterParticles[wpi].mesh);
    }
    waterParticles = [];

    for (var bsi = 0; bsi < bridgeSegments.length; bsi++) {
      scene.remove(bridgeSegments[bsi]);
    }
    bridgeSegments = [];

    // reset state
    player.hp = 120;
    player.maxHp = 150;
    player.bank = 'SOUTH';
    player.x = 0;
    player.z = 14;
    player.speed = 4;
    player.inBoat = false;
    player.dragging = false;
    player.draggingIndex = -1;
    player.dead = false;

    boat.active = false;
    boat.hp = 150;
    boat.x = 0;
    boat.z = 14;
    boat.boarders = 0;

    fordActive = false;
    bridgeActive = false;
    bridgeBuildTime = 0;
    bridgeBuilt = false;
    crossMethod = 'BOAT';

    smokeActive = false;
    smokeTimer = 0;
    mortarActive = false;
    mortarTimer = 0;
    mortarSuppressed = false;
    mortarSuppressTimer = 0;
    mortarExplosions = [];
    enemyFireTimer = 0;
    rpgFireTimer = 5;
    fordGapDist = 120;
    bunkersCleared = 0;
    missionSecured = false;
    sweptMines = {};
    keys = {};

    if (hudEl) {
      hudEl.style.color = '#00FF88';
    }

    if (scene) {
      scene.fog = null;
      scene.background = null;
    }

    if (hudEl) {
      document.body.removeChild(hudEl);
      hudEl = null;
    }

    active = false;
  }

  // ─── public API ───────────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    reset: reset
  };

}());
