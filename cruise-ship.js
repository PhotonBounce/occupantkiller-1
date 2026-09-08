window.CruiseShip = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var MODULE_NAME = 'CruiseShip';
  var ACTIVATION_KEY_C = 67;
  var ACTIVATION_KEY_S = 83;
  var ACTIVATION_WINDOW = 400;

  var HULL_Y = 0;
  var DECK_Y = 5;
  var DECK2_Y = 10;
  var DECK3_Y = 15;
  var WATER_Y = -6;
  var TOTAL_HOSTAGES = 10;
  var TOTAL_DECKS = 3;
  var ENEMY_SIGHT = 30;
  var PLAYER_SPEED = 8;

  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,
    objects: [],
    enemies: [],
    hostages: [],
    shipGroup: null,
    bobTime: 0,
    gameOver: false,
    lastTime: 0,
    animFrameId: null,
    playerPos: { x: 0, y: DECK3_Y + 1, z: 0 },
    playerHP: 100,
    hostagesRescued: 0,
    decksCleared: 0,
    deckStatus: [false, false, false],
    hudEl: null,
    keysDown: {},
    keyTimes: {},
    notifEl: null,
    notifTimeout: null,
    _onKeyDown: null,
    _onKeyUp: null,
    chandelier: null,
    chandelierTime: 0,
    funnels: [],
    lifeboatDavits: [],
    poolMesh: null,
    activeDeck: 2
  };

  // -------------------------------------------------------
  // Public API
  // -------------------------------------------------------

  function init(scene, camera) {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: own renderer, was crashing/launching over the main game */

    if (state.active) return;
    state.active = true;

    if (typeof THREE === 'undefined') {
      console.warn('[CruiseShip] THREE.js not found');
      return;
    }

    _resetState(scene, camera);
    _setupScene();
    _buildOcean();
    _buildShip();
    _buildEnemies();
    _buildHostages();
    _buildHUD();
    _bindKeys();
    _showNotif('CRUISE SHIP INFILTRATION — RESCUE THE HOSTAGES');
    _animate(0);
  }

  function update(delta) {
    if (!state.active || state.gameOver) return;
    _updateShipBob(delta);
    _updateEnemies(delta);
    _updatePlayer(delta);
    _updateCamera();
    _updateHUD();
    if (state.renderer && state.scene && state.camera) {
      state.renderer.render(state.scene, state.camera);
    }
  }

  function reset() {
    _destroy();
  }

  // -------------------------------------------------------
  // Init helpers
  // -------------------------------------------------------

  function _resetState(scene, camera) {
    state.scene = scene || null;
    state.camera = camera || null;
    state.objects = [];
    state.enemies = [];
    state.hostages = [];
    state.shipGroup = null;
    state.bobTime = 0;
    state.gameOver = false;
    state.lastTime = 0;
    state.animFrameId = null;
    state.playerPos = { x: 0, y: DECK3_Y + 1, z: 0 };
    state.playerHP = 100;
    state.hostagesRescued = 0;
    state.decksCleared = 0;
    state.deckStatus = [false, false, false];
    state.keysDown = {};
    state.keyTimes = {};
    state.chandelier = null;
    state.chandelierTime = 0;
    state.funnels = [];
    state.lifeboatDavits = [];
    state.poolMesh = null;
    state.activeDeck = 2;
  }

  function _setupScene() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    if (!state.scene) {
      state.scene = new THREE.Scene();
    }
    state.scene.background = new THREE.Color(0x001A33);
    state.scene.fog = new THREE.FogExp2(0x001A33, 0.008);

    if (!state.camera) {
      state.camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 800);
    }
    state.camera.position.set(0, 30, 90);
    state.camera.lookAt(0, DECK_Y, 0);

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(w, h);
    state.renderer.shadowMap.enabled = true;
    state.renderer.domElement.style.position = 'fixed';
    state.renderer.domElement.style.top = '0';
    state.renderer.domElement.style.left = '0';
    state.renderer.domElement.style.zIndex = '9000';
    document.body.appendChild(state.renderer.domElement);

    var ambient = new THREE.AmbientLight(0x334466, 0.7);
    state.scene.add(ambient);
    state.objects.push(ambient);

    var sun = new THREE.DirectionalLight(0xFFEECC, 1.1);
    sun.position.set(60, 120, 40);
    sun.castShadow = true;
    state.scene.add(sun);
    state.objects.push(sun);

    var fill = new THREE.PointLight(0x1133AA, 0.5, 300);
    fill.position.set(-50, 20, -50);
    state.scene.add(fill);
    state.objects.push(fill);
  }

  // -------------------------------------------------------
  // Scene building
  // -------------------------------------------------------

  function _addMesh(geo, mat, x, y, z, parent) {
    var mesh = new THREE.Mesh(geo, mat);
    if (x !== undefined) mesh.position.set(x, y, z);
    if (parent) {
      parent.add(mesh);
    } else {
      state.scene.add(mesh);
      state.objects.push(mesh);
    }
    return mesh;
  }

  function _buildOcean() {
    var oceanGeo = new THREE.BoxGeometry(600, 3, 600);
    var oceanMat = new THREE.MeshLambertMaterial({ color: 0x003366, transparent: true, opacity: 0.85 });
    var ocean = _addMesh(oceanGeo, oceanMat, 0, WATER_Y - 1, 0);
    ocean.userData.isOcean = true;
  }

  function _buildShip() {
    var grp = new THREE.Group();
    state.scene.add(grp);
    state.objects.push(grp);
    state.shipGroup = grp;

    // --- Hull (large flat box) ---
    var hullGeo = new THREE.BoxGeometry(120, 10, 28);
    var hullMat = new THREE.MeshLambertMaterial({ color: 0x2A3A4A });
    var hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.set(0, HULL_Y, 0);
    grp.add(hull);

    // Bow taper extension (triangular suggestion using scaled box)
    var bowGeo = new THREE.BoxGeometry(20, 10, 10);
    var bowMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
    var bow = new THREE.Mesh(bowGeo, bowMat);
    bow.position.set(-65, HULL_Y, 0);
    bow.rotation.y = 0;
    grp.add(bow);

    // --- Deck 1 (main deck) ---
    var deck1Geo = new THREE.BoxGeometry(120, 1.2, 28);
    var deck1Mat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    var deck1 = new THREE.Mesh(deck1Geo, deck1Mat);
    deck1.position.set(0, DECK_Y, 0);
    grp.add(deck1);

    // --- Deck 2 (promenade) ---
    var deck2Geo = new THREE.BoxGeometry(80, 1.0, 22);
    var deck2Mat = new THREE.MeshLambertMaterial({ color: 0x9B836A });
    var deck2 = new THREE.Mesh(deck2Geo, deck2Mat);
    deck2.position.set(10, DECK2_Y, 0);
    grp.add(deck2);

    // --- Deck 3 (sun deck / helicopter landing) ---
    var deck3Geo = new THREE.BoxGeometry(50, 1.0, 18);
    var deck3Mat = new THREE.MeshLambertMaterial({ color: 0xB0956E });
    var deck3 = new THREE.Mesh(deck3Geo, deck3Mat);
    deck3.position.set(15, DECK3_Y, 0);
    grp.add(deck3);

    // --- Superstructure block ---
    var superGeo = new THREE.BoxGeometry(40, 12, 18);
    var superMat = new THREE.MeshLambertMaterial({ color: 0xCCCCD0 });
    var superStruct = new THREE.Mesh(superGeo, superMat);
    superStruct.position.set(15, DECK2_Y + 6, 0);
    grp.add(superStruct);

    // --- Bridge top ---
    var bridgeGeo = new THREE.BoxGeometry(20, 4, 16);
    var bridgeMat = new THREE.MeshLambertMaterial({ color: 0xDDDDE0 });
    var bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(15, DECK3_Y + 6, 0);
    grp.add(bridge);

    // Bridge windows (thin flat boxes)
    var winMat = new THREE.MeshLambertMaterial({ color: 0x88BBFF, emissive: 0x112233 });
    var winPositions = [-6, 0, 6];
    for (var wi = 0; wi < winPositions.length; wi++) {
      var winGeo = new THREE.BoxGeometry(4, 1.5, 0.15);
      var win = new THREE.Mesh(winGeo, winMat);
      win.position.set(winPositions[wi] + 15, DECK3_Y + 7, -8.1);
      grp.add(win);
    }

    // --- Smokestack funnels (CylinderGeometry) ---
    var funnelMat = new THREE.MeshLambertMaterial({ color: 0xCC2222 });
    var funnelCapMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var funnelXs = [20, 30];
    for (var fi = 0; fi < funnelXs.length; fi++) {
      var funnelGeo = new THREE.CylinderGeometry(2.2, 2.8, 14, 12);
      var funnel = new THREE.Mesh(funnelGeo, funnelMat);
      funnel.position.set(funnelXs[fi], DECK3_Y + 7, 0);
      grp.add(funnel);
      state.funnels.push(funnel);

      // Black cap on funnel top
      var capGeo = new THREE.CylinderGeometry(2.3, 2.3, 1.5, 12);
      var cap = new THREE.Mesh(capGeo, funnelCapMat);
      cap.position.set(funnelXs[fi], DECK3_Y + 14.2, 0);
      grp.add(cap);
    }

    // --- Pool area (flat box with blue top) ---
    var poolBaseGeo = new THREE.BoxGeometry(14, 1.5, 8);
    var poolBaseMat = new THREE.MeshLambertMaterial({ color: 0x8FAFCC });
    var poolBase = new THREE.Mesh(poolBaseGeo, poolBaseMat);
    poolBase.position.set(-5, DECK2_Y + 0.75, 0);
    grp.add(poolBase);

    var poolWaterGeo = new THREE.BoxGeometry(12, 0.3, 6);
    var poolWaterMat = new THREE.MeshLambertMaterial({ color: 0x0099FF, transparent: true, opacity: 0.85 });
    var poolWater = new THREE.Mesh(poolWaterGeo, poolWaterMat);
    poolWater.position.set(-5, DECK2_Y + 1.4, 0);
    grp.add(poolWater);
    state.poolMesh = poolWater;

    // Pool light shimmer (point light)
    var poolLight = new THREE.PointLight(0x0088FF, 1.2, 20);
    poolLight.position.set(-5, DECK2_Y + 3, 0);
    grp.add(poolLight);
    state.objects.push(poolLight);

    // --- Lifeboat davits (LineSegments + white box boats) ---
    var davitMat = new THREE.LineBasicMaterial({ color: 0xAAAAAA });
    var boatMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var davitPositions = [
      { x: -30, side: -1 }, { x: -10, side: -1 },
      { x: -30, side: 1 }, { x: -10, side: 1 }
    ];
    for (var di = 0; di < davitPositions.length; di++) {
      var dp = davitPositions[di];
      var sideZ = dp.side * 16;
      var boatY = DECK_Y + 4;
      var boatGeo = new THREE.BoxGeometry(6, 2, 3);
      var boat = new THREE.Mesh(boatGeo, boatMat);
      boat.position.set(dp.x, boatY, sideZ);
      grp.add(boat);

      // Davit arm using LineSegments
      var davitPoints = [
        new THREE.Vector3(dp.x, DECK_Y + 1, sideZ * 0.6),
        new THREE.Vector3(dp.x, DECK_Y + 7, sideZ * 0.6),
        new THREE.Vector3(dp.x, DECK_Y + 7, sideZ * 0.9),
        new THREE.Vector3(dp.x, boatY + 1, sideZ)
      ];
      var davitGeo = new THREE.BufferGeometry().setFromPoints(davitPoints);
      var davitLine = new THREE.LineSegments(davitGeo, davitMat);
      grp.add(davitLine);
      state.lifeboatDavits.push(davitLine);
    }

    // --- Railing (thin flat boxes along deck edge) ---
    var railMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    // Port & starboard deck1 railings
    var railGeo1 = new THREE.BoxGeometry(120, 0.5, 0.4);
    var railP = new THREE.Mesh(railGeo1, railMat);
    railP.position.set(0, DECK_Y + 1.5, -14.3);
    grp.add(railP);
    var railS = new THREE.Mesh(new THREE.BoxGeometry(120, 0.5, 0.4), railMat);
    railS.position.set(0, DECK_Y + 1.5, 14.3);
    grp.add(railS);

    // --- Ballroom interior (box room on deck1 aft) ---
    _buildBallroom(grp);

    // --- Helicopter pad markings on deck 3 ---
    var padMat = new THREE.MeshLambertMaterial({ color: 0x888800, emissive: 0x333300 });
    var padCircGeo = new THREE.BoxGeometry(10, 0.15, 10);
    var padCirc = new THREE.Mesh(padCircGeo, padMat);
    padCirc.position.set(-10, DECK3_Y + 0.6, 0);
    grp.add(padCirc);

    var hMarkMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var hMarkGeo = new THREE.BoxGeometry(1, 0.2, 6);
    var hMark = new THREE.Mesh(hMarkGeo, hMarkMat);
    hMark.position.set(-10, DECK3_Y + 0.7, 0);
    grp.add(hMark);
    var hMarkGeo2 = new THREE.BoxGeometry(3, 0.2, 1);
    var hMark2 = new THREE.Mesh(hMarkGeo2, hMarkMat);
    hMark2.position.set(-11, DECK3_Y + 0.7, 0);
    grp.add(hMark2);
    var hMark3 = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 1), hMarkMat);
    hMark3.position.set(-9, DECK3_Y + 0.7, 0);
    grp.add(hMark3);
  }

  function _buildBallroom(grp) {
    // Ballroom outer walls (aft section)
    var ballMat = new THREE.MeshLambertMaterial({ color: 0xF5DEB3 });
    var ballGeo = new THREE.BoxGeometry(20, 6, 22);
    var ballroom = new THREE.Mesh(ballGeo, ballMat);
    ballroom.position.set(-50, DECK_Y + 3, 0);
    grp.add(ballroom);

    // Ballroom floor (fancy parquet)
    var floorMat = new THREE.MeshLambertMaterial({ color: 0xCD853F, emissive: 0x110800 });
    var floorGeo = new THREE.BoxGeometry(18, 0.2, 20);
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(-50, DECK_Y + 0.6, 0);
    grp.add(floor);

    // Ballroom golden light
    var ballLight = new THREE.PointLight(0xFFCC66, 1.4, 30);
    ballLight.position.set(-50, DECK_Y + 7, 0);
    grp.add(ballLight);
    state.objects.push(ballLight);

    // Chandelier (SphereGeometry centre + ConeGeometry drops)
    var chandelierCore = new THREE.SphereGeometry(1.2, 10, 8);
    var chandelierMat = new THREE.MeshLambertMaterial({ color: 0xFFD700, emissive: 0xAA8800 });
    var chandelier = new THREE.Mesh(chandelierCore, chandelierMat);
    chandelier.position.set(-50, DECK_Y + 7.5, 0);
    grp.add(chandelier);
    state.chandelier = chandelier;

    // Chandelier arms (box spokes)
    var armMat = new THREE.MeshLambertMaterial({ color: 0xCCAA00 });
    var armAngles = [0, Math.PI / 3, 2 * Math.PI / 3, Math.PI, 4 * Math.PI / 3, 5 * Math.PI / 3];
    for (var ai = 0; ai < armAngles.length; ai++) {
      var ang = armAngles[ai];
      var armGeo = new THREE.BoxGeometry(3.5, 0.2, 0.2);
      var arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(-50 + Math.cos(ang) * 1.5, DECK_Y + 7.4, Math.sin(ang) * 1.5);
      arm.rotation.y = ang;
      grp.add(arm);

      // Pendant drop (ConeGeometry)
      var pendGeo = new THREE.ConeGeometry(0.15, 0.8, 6);
      var pendMat = new THREE.MeshLambertMaterial({ color: 0xFFFFAA, emissive: 0x886600 });
      var pend = new THREE.Mesh(pendGeo, pendMat);
      pend.position.set(-50 + Math.cos(ang) * 2.8, DECK_Y + 6.9, Math.sin(ang) * 2.8);
      pend.rotation.z = Math.PI;
      grp.add(pend);
    }

    // Ballroom tables (small boxes)
    var tableMat = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    var tablePositions = [
      [-46, -6], [-46, 6], [-54, -6], [-54, 6], [-50, 0]
    ];
    for (var ti = 0; ti < tablePositions.length; ti++) {
      var tp = tablePositions[ti];
      var tableGeo = new THREE.BoxGeometry(2.5, 1, 2.5);
      var table = new THREE.Mesh(tableGeo, tableMat);
      table.position.set(tp[0], DECK_Y + 0.7, tp[1]);
      grp.add(table);
    }
  }

  // -------------------------------------------------------
  // Enemies (pirates)
  // -------------------------------------------------------

  function _buildEnemies() {
    var pirateMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
    var weaponMat = new THREE.MeshLambertMaterial({ color: 0x5A3010 });

    // Deck 1 pirates (ballroom guards + aft)
    var deck1Pos = [
      { x: -45, y: DECK_Y + 1, z: -5 },
      { x: -55, y: DECK_Y + 1, z: 5 },
      { x: -35, y: DECK_Y + 1, z: 0 },
      { x: -60, y: DECK_Y + 1, z: -8 },
      { x: -25, y: DECK_Y + 1, z: 8 }
    ];
    // Deck 2 pirates (promenade + pool)
    var deck2Pos = [
      { x: -10, y: DECK2_Y + 1, z: -5 },
      { x: 0, y: DECK2_Y + 1, z: 5 },
      { x: 10, y: DECK2_Y + 1, z: -4 },
      { x: 5, y: DECK2_Y + 1, z: 7 },
      { x: -20, y: DECK2_Y + 1, z: 3 }
    ];
    // Deck 3 / sun deck pirates
    var deck3Pos = [
      { x: -5, y: DECK3_Y + 1, z: -5 },
      { x: 5, y: DECK3_Y + 1, z: 5 },
      { x: 15, y: DECK3_Y + 1, z: -4 },
      { x: 25, y: DECK3_Y + 1, z: 3 },
      { x: -15, y: DECK3_Y + 1, z: 0 }
    ];

    var allPositions = [
      { positions: deck1Pos, deck: 0 },
      { positions: deck2Pos, deck: 1 },
      { positions: deck3Pos, deck: 2 }
    ];

    for (var di = 0; di < allPositions.length; di++) {
      var deckData = allPositions[di];
      for (var pi = 0; pi < deckData.positions.length; pi++) {
        var pos = deckData.positions[pi];

        // Body
        var bodyGeo = new THREE.BoxGeometry(1.1, 2, 1.1);
        var body = new THREE.Mesh(bodyGeo, pirateMat.clone());
        body.position.set(pos.x, pos.y, pos.z);
        state.scene.add(body);
        state.objects.push(body);

        // Head
        var headGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        var headMat = new THREE.MeshLambertMaterial({ color: 0x8B6644 });
        var head = new THREE.Mesh(headGeo, headMat);
        head.position.set(pos.x, pos.y + 1.45, pos.z);
        state.scene.add(head);
        state.objects.push(head);

        // AK rifle (dark box)
        var rifleGeo = new THREE.BoxGeometry(0.2, 0.2, 1.5);
        var rifle = new THREE.Mesh(rifleGeo, weaponMat);
        rifle.position.set(pos.x + 0.7, pos.y + 0.3, pos.z);
        state.scene.add(rifle);
        state.objects.push(rifle);

        state.enemies.push({
          body: body,
          head: head,
          rifle: rifle,
          alive: true,
          hp: 100,
          deck: deckData.deck,
          patrolDir: (pi % 2 === 0) ? 1 : -1,
          patrolTimer: pi * 0.8,
          startX: pos.x,
          startZ: pos.z,
          alertTime: 0,
          alerted: false
        });
      }
    }
  }

  // -------------------------------------------------------
  // Hostages
  // -------------------------------------------------------

  function _buildHostages() {
    var hostMat = new THREE.MeshLambertMaterial({ color: 0xFFDDAA });
    var dressColors = [0xCC4444, 0x4444CC, 0x44CC44, 0xCCCC44, 0x44CCCC,
                       0xCC44CC, 0xFFAA33, 0x88FFAA, 0xFF88AA, 0xAA88FF];

    var hostagePositions = [
      { x: -48, y: DECK_Y + 1, z: -4 },
      { x: -50, y: DECK_Y + 1, z: 3 },
      { x: -52, y: DECK_Y + 1, z: -7 },
      { x: -46, y: DECK_Y + 1, z: 7 },
      { x: -54, y: DECK_Y + 1, z: 0 },
      { x: -44, y: DECK_Y + 1, z: -2 },
      { x: -56, y: DECK_Y + 1, z: 5 },
      { x: -48, y: DECK_Y + 1, z: 8 },
      { x: -52, y: DECK_Y + 1, z: -9 },
      { x: -46, y: DECK_Y + 1, z: -10 }
    ];

    for (var hi = 0; hi < hostagePositions.length; hi++) {
      var hp = hostagePositions[hi];

      var bodyGeo = new THREE.BoxGeometry(0.8, 1.7, 0.8);
      var dressMat = new THREE.MeshLambertMaterial({ color: dressColors[hi] });
      var body = new THREE.Mesh(bodyGeo, dressMat);
      body.position.set(hp.x, hp.y, hp.z);
      state.scene.add(body);
      state.objects.push(body);

      var headGeo = new THREE.SphereGeometry(0.38, 8, 6);
      var head = new THREE.Mesh(headGeo, hostMat);
      head.position.set(hp.x, hp.y + 1.2, hp.z);
      state.scene.add(head);
      state.objects.push(head);

      state.hostages.push({
        body: body,
        head: head,
        rescued: false,
        x: hp.x,
        y: hp.y,
        z: hp.z
      });
    }
  }

  // -------------------------------------------------------
  // HUD
  // -------------------------------------------------------

  function _buildHUD() {
    var hud = document.createElement('div');
    hud.id = 'cruise-ship-hud';
    hud.style.position = 'fixed';
    hud.style.top = '12px';
    hud.style.left = '12px';
    hud.style.background = 'rgba(0,10,30,0.82)';
    hud.style.color = '#00FFCC';
    hud.style.fontFamily = 'monospace';
    hud.style.fontSize = '14px';
    hud.style.padding = '8px 16px';
    hud.style.borderRadius = '5px';
    hud.style.border = '1px solid #005577';
    hud.style.lineHeight = '1.8';
    hud.style.zIndex = '9999';
    hud.style.pointerEvents = 'none';
    document.body.appendChild(hud);
    state.hudEl = hud;
    _updateHUD();
  }

  function _updateHUD() {
    if (!state.hudEl) return;
    var piratesAlive = 0;
    for (var i = 0; i < state.enemies.length; i++) {
      if (state.enemies[i].alive) piratesAlive++;
    }
    var deckStr = '';
    for (var d = 0; d < 3; d++) {
      deckStr += (state.deckStatus[d] ? '[CLEAR]' : '[HOT]') + ' ';
    }
    state.hudEl.innerHTML =
      'CRUISE SHIP HOSTAGE RESCUE<br>' +
      'HOSTAGES RESCUED: ' + state.hostagesRescued + '/' + TOTAL_HOSTAGES + '<br>' +
      'DECK CLEARED: ' + state.decksCleared + '/' + TOTAL_DECKS + '<br>' +
      'DECKS: ' + deckStr + '<br>' +
      'PIRATES REMAINING: ' + piratesAlive + '<br>' +
      'HP: ' + Math.max(0, Math.round(state.playerHP));
  }

  function _showNotif(msg) {
    if (state.notifEl && state.notifEl.parentNode) {
      state.notifEl.parentNode.removeChild(state.notifEl);
    }
    if (state.notifTimeout) {
      clearTimeout(state.notifTimeout);
      state.notifTimeout = null;
    }
    var el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.top = '60px';
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';
    el.style.background = 'rgba(0,20,60,0.92)';
    el.style.color = '#FFCC00';
    el.style.fontFamily = 'monospace';
    el.style.fontSize = '16px';
    el.style.padding = '10px 24px';
    el.style.borderRadius = '6px';
    el.style.border = '1px solid #FFCC00';
    el.style.zIndex = '10000';
    el.style.pointerEvents = 'none';
    el.style.textAlign = 'center';
    el.textContent = msg;
    document.body.appendChild(el);
    state.notifEl = el;
    state.notifTimeout = setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
      if (state.notifEl === el) state.notifEl = null;
    }, 3500);
  }

  // -------------------------------------------------------
  // Key bindings
  // -------------------------------------------------------

  function _bindKeys() {
    state._onKeyDown = function (e) {
      if (!state.active) return;
      var k = e.keyCode;
      if (!state.keysDown[k]) {
        state.keyTimes[k] = performance.now();
      }
      state.keysDown[k] = true;
      _handleKeyPress(k);
    };
    state._onKeyUp = function (e) {
      if (!state.active) return;
      state.keysDown[e.keyCode] = false;
    };
    document.addEventListener('keydown', state._onKeyDown);
    document.addEventListener('keyup', state._onKeyUp);
  }

  function _unbindKeys() {
    if (state._onKeyDown) document.removeEventListener('keydown', state._onKeyDown);
    if (state._onKeyUp) document.removeEventListener('keyup', state._onKeyUp);
    state._onKeyDown = null;
    state._onKeyUp = null;
  }

  function _handleKeyPress(k) {
    // E key — rescue hostages nearby
    if (k === 69) {
      _tryRescueHostages();
    }
  }

  // -------------------------------------------------------
  // Update functions
  // -------------------------------------------------------

  function _updateShipBob(dt) {
    if (!state.shipGroup) return;
    state.bobTime += dt;
    state.shipGroup.position.y = Math.sin(state.bobTime * (2 * Math.PI / 5)) * 0.4;
    state.shipGroup.rotation.z = Math.sin(state.bobTime * 0.7) * 0.008;
  }

  function _updateEnemies(dt) {
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (!e.alive) continue;

      e.patrolTimer += dt;
      var newX = e.startX + Math.sin(e.patrolTimer * 0.4 * e.patrolDir) * 5;
      e.body.position.x = newX;
      e.head.position.x = newX;
      e.rifle.position.x = newX + 0.7;

      // Rotate to face direction
      var facing = Math.cos(e.patrolTimer * 0.4 * e.patrolDir) > 0 ? 0 : Math.PI;
      e.body.rotation.y = facing;
      e.head.rotation.y = facing;

      // Sight check
      var dx = e.body.position.x - state.playerPos.x;
      var dy = e.body.position.y - state.playerPos.y;
      var dz = e.body.position.z - state.playerPos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < ENEMY_SIGHT) {
        if (!e.alerted) {
          e.alerted = true;
          e.body.material.color.setHex(0x880000);
        }
        // Damage player when very close
        if (dist < 3) {
          state.playerHP -= 10 * dt;
          if (state.playerHP <= 0 && !state.gameOver) {
            _triggerGameOver('You were killed by a pirate!');
          }
        }
      } else {
        if (e.alerted) {
          e.alerted = false;
          e.body.material.color.setHex(0x1A1A1A);
        }
      }
    }
  }

  function _updatePlayer(dt) {
    var speed = PLAYER_SPEED * dt;
    var moved = false;

    if (state.keysDown[87] || state.keysDown[38]) { state.playerPos.z -= speed; moved = true; }
    if (state.keysDown[83] || state.keysDown[40]) { state.playerPos.z += speed; moved = true; }
    if (state.keysDown[65] || state.keysDown[37]) { state.playerPos.x -= speed; moved = true; }
    if (state.keysDown[68] || state.keysDown[39]) { state.playerPos.x += speed; moved = true; }

    // Q/E vertical deck switching
    if (state.keysDown[81]) {
      // Q — go up one deck
      if (state.activeDeck < 2) {
        state.activeDeck++;
        state.keysDown[81] = false;
        var deckYs = [DECK_Y + 1, DECK2_Y + 1, DECK3_Y + 1];
        state.playerPos.y = deckYs[state.activeDeck];
        _showNotif('Climbing to Deck ' + (state.activeDeck + 1));
      }
    }
    if (state.keysDown[90]) {
      // Z — go down one deck
      if (state.activeDeck > 0) {
        state.activeDeck--;
        state.keysDown[90] = false;
        var deckYs2 = [DECK_Y + 1, DECK2_Y + 1, DECK3_Y + 1];
        state.playerPos.y = deckYs2[state.activeDeck];
        _showNotif('Descending to Deck ' + (state.activeDeck + 1));
      }
    }

    // Clamp to ship bounds
    state.playerPos.x = Math.max(-70, Math.min(55, state.playerPos.x));
    state.playerPos.z = Math.max(-13, Math.min(13, state.playerPos.z));

    // Check deck clear conditions
    _checkDeckClear();

    // Check hostage auto-trigger in ballroom
    if (state.playerPos.x < -40 && state.playerPos.x > -62 &&
        Math.abs(state.playerPos.z) < 12 && state.activeDeck === 0) {
      _tryRescueHostages();
    }
  }

  function _tryRescueHostages() {
    var rescued = 0;
    for (var i = 0; i < state.hostages.length; i++) {
      var h = state.hostages[i];
      if (h.rescued) continue;
      var dx = h.x - state.playerPos.x;
      var dz = h.z - state.playerPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 8) {
        h.rescued = true;
        h.body.material.color.setHex(0x00FF88);
        h.head.material.color.setHex(0x00FF88);
        state.hostagesRescued++;
        rescued++;
      }
    }
    if (rescued > 0) {
      _showNotif('HOSTAGES SECURED: ' + state.hostagesRescued + '/' + TOTAL_HOSTAGES);
      if (state.hostagesRescued >= TOTAL_HOSTAGES) {
        _triggerVictory();
      }
      _updateHUD();
    }
  }

  function _checkDeckClear() {
    var deckEnemyCount = [0, 0, 0];
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (e.alive) deckEnemyCount[e.deck]++;
    }
    for (var d = 0; d < 3; d++) {
      if (!state.deckStatus[d] && deckEnemyCount[d] === 0) {
        state.deckStatus[d] = true;
        state.decksCleared++;
        var deckNames = ['Ballroom Deck', 'Promenade Deck', 'Sun Deck'];
        _showNotif(deckNames[d] + ' CLEARED!');
      }
    }
  }

  function _updateCamera() {
    if (!state.camera) return;
    var tx = state.playerPos.x;
    var ty = state.playerPos.y + 22;
    var tz = state.playerPos.z + 65;
    state.camera.position.x += (tx - state.camera.position.x) * 0.07;
    state.camera.position.y += (ty - state.camera.position.y) * 0.07;
    state.camera.position.z += (tz - state.camera.position.z) * 0.07;
    state.camera.lookAt(state.playerPos.x, state.playerPos.y + 2, state.playerPos.z);

    // Chandelier gentle spin
    if (state.chandelier) {
      state.chandelierTime += 0.01;
      state.chandelier.rotation.y = state.chandelierTime * 0.3;
    }
  }

  // -------------------------------------------------------
  // Game state
  // -------------------------------------------------------

  function _triggerVictory() {
    state.gameOver = true;
    _showEndMessage('MISSION COMPLETE — ALL HOSTAGES RESCUED!', true);
  }

  function _triggerGameOver(msg) {
    state.gameOver = true;
    _showEndMessage('MISSION FAILED: ' + msg, false);
  }

  function _showEndMessage(msg, won) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.93)',
      'color:' + (won ? '#00FF88' : '#FF2244'),
      'font-family:monospace',
      'font-size:22px',
      'padding:32px 56px',
      'border:2px solid ' + (won ? '#00FF88' : '#FF2244'),
      'border-radius:10px',
      'z-index:99999',
      'text-align:center'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
      _destroy();
    }, 6000);
  }

  // -------------------------------------------------------
  // Animation loop
  // -------------------------------------------------------

  function _animate(timestamp) {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(_animate);

    var dt = Math.min((timestamp - state.lastTime) / 1000, 0.12);
    if (state.lastTime === 0) dt = 0;
    state.lastTime = timestamp;

    if (!state.gameOver) {
      _updateShipBob(dt);
      _updateEnemies(dt);
      _updatePlayer(dt);
      _updateCamera();
      _updateHUD();
    }

    if (state.renderer && state.scene && state.camera) {
      state.renderer.render(state.scene, state.camera);
    }
  }

  // -------------------------------------------------------
  // Destroy / cleanup
  // -------------------------------------------------------

  function _destroy() {
    if (!state.active) return;
    state.active = false;

    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }

    _unbindKeys();

    // Remove all tracked scene objects
    if (state.scene) {
      for (var i = 0; i < state.objects.length; i++) {
        state.scene.remove(state.objects[i]);
      }
    }
    state.objects = [];
    state.enemies = [];
    state.hostages = [];

    if (state.renderer) {
      if (state.renderer.domElement && state.renderer.domElement.parentNode) {
        state.renderer.domElement.parentNode.removeChild(state.renderer.domElement);
      }
      state.renderer.dispose();
      state.renderer = null;
    }

    if (state.hudEl && state.hudEl.parentNode) {
      state.hudEl.parentNode.removeChild(state.hudEl);
      state.hudEl = null;
    }

    if (state.notifEl && state.notifEl.parentNode) {
      state.notifEl.parentNode.removeChild(state.notifEl);
      state.notifEl = null;
    }

    if (state.notifTimeout) {
      clearTimeout(state.notifTimeout);
      state.notifTimeout = null;
    }

    state.scene = null;
    state.camera = null;
    state.shipGroup = null;
    state.chandelier = null;
  }

  // -------------------------------------------------------
  // Activation keybind: C then S within 400ms
  // -------------------------------------------------------

  var _activateKeyTimes = {};
  var _activateKeysDown = {};

  var _activateKeyDown = function (e) {
    var k = e.keyCode;
    if (k === ACTIVATION_KEY_C || k === ACTIVATION_KEY_S) {
      if (!_activateKeysDown[k]) {
        _activateKeyTimes[k] = performance.now();
      }
      _activateKeysDown[k] = true;

      var other = (k === ACTIVATION_KEY_C) ? ACTIVATION_KEY_S : ACTIVATION_KEY_C;
      var otherTime = _activateKeyTimes[other] || 0;
      var now = performance.now();

      if (_activateKeysDown[other] && (now - otherTime <= ACTIVATION_WINDOW)) {
        _activateKeysDown = {};
        _activateKeyTimes = {};
        if (!state.active) {
          init(null, null);
          _showNotif(MODULE_NAME + ' ACTIVATED — C+S to toggle');
        } else {
          _showNotif(MODULE_NAME + ' DEACTIVATED');
          setTimeout(_destroy, 600);
        }
      }
    }
  };

  var _activateKeyUp = function (e) {
    var k = e.keyCode;
    if (k === ACTIVATION_KEY_C || k === ACTIVATION_KEY_S) {
      _activateKeysDown[k] = false;
    }
  };

  document.addEventListener('keydown', _activateKeyDown);
  document.addEventListener('keyup', _activateKeyUp);

  // -------------------------------------------------------
  // Public exports
  // -------------------------------------------------------

  return {
    init: init,
    update: update,
    reset: reset
  };

}());
