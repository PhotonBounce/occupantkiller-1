window.PirateCove = (function () {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,

    // Key tracking for P+C simultaneous activation (within 400ms)
    pKeyDown: false,
    cKeyDown: false,
    eKeyDown: false,
    pKeyTime: 0,
    cKeyTime: 0,

    // Environment
    caveMesh: null,
    waterMesh: null,
    pillarMeshes: [],
    torchLights: [],
    tunnelMesh: null,
    bgBackup: null,
    fogBackup: null,

    // Ship
    shipHull: null,
    mastMeshes: [],
    cannonMeshes: [],
    cannonShots: [],    // { mesh, velocity, bounces }
    cannonAmmo: [],     // per cannon remaining shots

    // Crew / pirates
    pirates: [],        // { mesh, hp, type, x, y, z, lastAttackTime, reloadTimer, state, cutlassAngle }
    piratesCaptain: null,

    // Treasure
    chests: [],         // { mesh, lid, x, y, z, opened }
    vaultMesh: null,
    vaultOpen: false,
    vaultCombo: [3, 7, 1],
    vaultInput: [],
    scrollMeshes: [],
    goldTotal: 0,
    chestsOpened: 0,
    chestsTotal: 5,

    // Boulders / rope
    boulderMeshes: [],  // { mesh, rope, dropped, velocity }

    // Navy frigate
    frigateMesh: null,
    frigateCannonMeshes: [],
    frigateFireTimer: 0,
    frigateCannonballs: [], // { mesh, velocity }
    navyAlarmRaised: false,
    navyTimer: 0,
    navyInbound: false,

    // Manning a cannon
    mannedCannon: -1,   // index into cannonMeshes, -1 = not manned
    aimPitch: 0,
    aimYaw: 0,

    // Player
    playerHP: 100,
    playerPos: { x: 0, y: 1, z: 12 },

    // HUD
    hudElement: null,
    msgElement: null,
    msgTimer: 0,

    // Timing
    elapsedTime: 0,
    _animId: null,
    _lastTs: 0
  };

  // ─── Constants ────────────────────────────────────────────────────────────
  var ACTIVATION_WINDOW  = 0.4;   // seconds
  var NAVY_DELAY         = 90;    // seconds until navy arrives
  var NAVY_FIRE_INTERVAL = 8;     // seconds between navy shots
  var MUSKET_RANGE       = 25;
  var MUSKET_RELOAD      = 4;
  var CUTLASS_RANGE      = 2.5;
  var CAPTAIN_HP         = 250;
  var PIRATE_HP          = 80;
  var CANNON_SHOTS       = 3;     // per cannon
  var GOLD_PER_CHEST     = 200;
  var INTERACT_RANGE     = 3;
  var CANNONBALL_SPEED   = 28;
  var NAVY_BALL_SPEED    = 22;

  // ─── Helpers ─────────────────────────────────────────────────────────────
  function makeMesh(geo, color, opacity) {
    var mat;
    if (opacity !== undefined && opacity < 1) {
      mat = new THREE.MeshLambertMaterial({ color: color, transparent: true, opacity: opacity });
    } else {
      mat = new THREE.MeshLambertMaterial({ color: color });
    }
    return new THREE.Mesh(geo, mat);
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

  function showMessage(msg, duration) {
    if (!state.msgElement) { return; }
    state.msgElement.textContent = msg;
    state.msgElement.style.display = 'block';
    state.msgTimer = duration || 3;
  }

  // ─── Key Handlers ────────────────────────────────────────────────────────
  function onKeyDown(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    var now = state.elapsedTime;

    if (key === 'p') { state.pKeyDown = true; state.pKeyTime = now; }
    if (key === 'c') { state.cKeyDown = true; state.cKeyTime = now; }

    if (state.pKeyDown && state.cKeyDown) {
      var diff = Math.abs(state.pKeyTime - state.cKeyTime);
      if (diff <= ACTIVATION_WINDOW) {
        if (state.active) { deactivateCove(); } else { activateCove(); }
        return;
      }
    }

    if (!state.active) { return; }

    if (key === 'e') {
      state.eKeyDown = true;
      tryInteract();
    }

    // Vault digit input: number keys 0-9 when near vault
    if (key >= '0' && key <= '9') {
      tryVaultInput(parseInt(key, 10));
    }

    // Escape from cannon
    if (key === 'escape' || key === 'f') {
      if (state.mannedCannon !== -1) {
        state.mannedCannon = -1;
        showMessage('Stepped away from cannon.');
      }
    }

    // Fire manned cannon
    if (key === ' ' || key === 'enter') {
      if (state.mannedCannon !== -1) {
        fireMannedCannon();
      }
    }
  }

  function onKeyUp(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    if (key === 'p') { state.pKeyDown = false; }
    if (key === 'c') { state.cKeyDown = false; }
    if (key === 'e') { state.eKeyDown = false; }
  }

  function onMouseMove(e) {
    if (!state.active || state.mannedCannon === -1) { return; }
    state.aimYaw   -= e.movementX * 0.003;
    state.aimPitch -= e.movementY * 0.003;
    state.aimPitch  = Math.max(-0.6, Math.min(0.4, state.aimPitch));
  }

  // ─── Build Cave Environment ───────────────────────────────────────────────
  function buildCave() {
    // Main cave box
    var caveGeo = new THREE.BoxGeometry(40, 12, 30);
    var caveMat = new THREE.MeshLambertMaterial({ color: 0x553322, side: THREE.BackSide });
    state.caveMesh = new THREE.Mesh(caveGeo, caveMat);
    state.caveMesh.position.set(0, 6, 0);
    state.scene.add(state.caveMesh);

    // Rocky terrain pillars
    var pillarData = [
      [-16, 0, -10], [16, 0, -10], [-14, 0, 8], [14, 0, 8],
      [-18, 0, 0], [18, 0, 0], [-10, 0, -14], [10, 0, -14]
    ];
    var i;
    for (i = 0; i < pillarData.length; i++) {
      var pd = pillarData[i];
      var h  = 2 + Math.random() * 4;
      var w  = 1.2 + Math.random() * 1.5;
      var pillarGeo = new THREE.BoxGeometry(w, h, w);
      var pillar = makeMesh(pillarGeo, 0x664433);
      pillar.position.set(pd[0], h / 2, pd[2]);
      state.scene.add(pillar);
      state.pillarMeshes.push(pillar);
    }

    // Water surface
    var waterGeo = new THREE.PlaneGeometry(38, 16);
    var waterMat = new THREE.MeshLambertMaterial({ color: 0x113355, transparent: true, opacity: 0.6 });
    state.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    state.waterMesh.rotation.x = -Math.PI / 2;
    state.waterMesh.position.set(0, 0, -7);
    state.scene.add(state.waterMesh);

    // Cave floor
    var floorGeo = new THREE.BoxGeometry(40, 0.4, 30);
    var floor = makeMesh(floorGeo, 0x443322);
    floor.position.set(0, -0.2, 0);
    state.scene.add(floor);
    state.pillarMeshes.push(floor);

    // Torches every 8 blocks along walls
    var torchPositions = [
      [-19, 5, -14], [-11, 5, -14], [-3, 5, -14],
      [5, 5, -14], [13, 5, -14],
      [-19, 5, 14], [-11, 5, 14], [-3, 5, 14],
      [5, 5, 14], [13, 5, 14]
    ];
    for (i = 0; i < torchPositions.length; i++) {
      var tp = torchPositions[i];
      var torchLight = new THREE.PointLight(0xFF6600, 1.2, 14);
      torchLight.position.set(tp[0], tp[1], tp[2]);
      state.scene.add(torchLight);
      state.torchLights.push(torchLight);

      // Torch visual
      var stickGeo = new THREE.BoxGeometry(0.15, 0.8, 0.15);
      var stick = makeMesh(stickGeo, 0x553311);
      stick.position.set(tp[0], tp[1] - 0.3, tp[2]);
      state.scene.add(stick);
      state.pillarMeshes.push(stick);

      var flameGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      var flame = makeMesh(flameGeo, 0xFF8800);
      flame.position.set(tp[0], tp[1] + 0.1, tp[2]);
      state.scene.add(flame);
      state.pillarMeshes.push(flame);
    }

    // Escape tunnel at rear
    var tunnelGeo = new THREE.BoxGeometry(3, 3, 20);
    state.tunnelMesh = makeMesh(tunnelGeo, 0x554433);
    state.tunnelMesh.position.set(-8, 1.5, -24);
    state.scene.add(state.tunnelMesh);

    // Rope-suspended boulders
    var boulderData = [
      { x: -8, y: 10, z: -17 },
      { x: -8, y: 10, z: -22 }
    ];
    for (i = 0; i < boulderData.length; i++) {
      var bd = boulderData[i];
      var boulderGeo = new THREE.BoxGeometry(2.5, 2, 2.5);
      var boulder = makeMesh(boulderGeo, 0x665544);
      boulder.position.set(bd.x, bd.y, bd.z);
      state.scene.add(boulder);

      // Rope as LineSegments
      var ropePoints = [
        new THREE.Vector3(bd.x, bd.y + 1, bd.z),
        new THREE.Vector3(bd.x, 12, bd.z)
      ];
      var ropeGeo = new THREE.BufferGeometry().setFromPoints(ropePoints);
      var ropeMat = new THREE.LineBasicMaterial({ color: 0xAA8833 });
      var rope = new THREE.LineSegments(ropeGeo, ropeMat);
      state.scene.add(rope);

      state.boulderMeshes.push({ mesh: boulder, rope: rope, dropped: false, velocity: 0 });
    }

    // Cave alcove scrolls with clues
    var alcovePositions = [
      { x: -18, y: 1.5, z: -8 },
      { x: 18, y: 1.5, z: -8 },
      { x: -18, y: 1.5, z: 4 }
    ];
    for (i = 0; i < alcovePositions.length; i++) {
      var ap = alcovePositions[i];
      var scrollGeo = new THREE.BoxGeometry(0.4, 0.6, 0.1);
      var scroll = makeMesh(scrollGeo, 0xFFFFAA);
      scroll.position.set(ap.x, ap.y, ap.z);
      scroll.userData.isScroll = true;
      scroll.userData.clue = 'Vault combo digit ' + (i + 1) + ': ' + state.vaultCombo[i];
      state.scene.add(scroll);
      state.scrollMeshes.push(scroll);
    }
  }

  // ─── Build Pirate Ship ────────────────────────────────────────────────────
  function buildShip() {
    var i;

    // Hull
    var hullGeo = new THREE.BoxGeometry(18, 4, 8);
    state.shipHull = makeMesh(hullGeo, 0x664422);
    state.shipHull.position.set(4, 2, -6);
    state.scene.add(state.shipHull);

    // Masts
    var mastData = [
      { x: 0, y: 7, z: -6 },
      { x: 8, y: 6, z: -6 }
    ];
    for (i = 0; i < mastData.length; i++) {
      var md = mastData[i];
      var mastGeo = new THREE.CylinderGeometry(0.15, 0.2, 10, 6);
      var mast = makeMesh(mastGeo, 0x553311);
      mast.position.set(md.x, md.y, md.z);
      state.scene.add(mast);
      state.mastMeshes.push(mast);

      // Crossed spars (2 per mast)
      var spar1Geo = new THREE.CylinderGeometry(0.08, 0.08, 5, 4);
      var spar1 = makeMesh(spar1Geo, 0x553311);
      spar1.rotation.z = Math.PI / 2;
      spar1.position.set(md.x, md.y + 1.5, md.z);
      state.scene.add(spar1);
      state.mastMeshes.push(spar1);

      var spar2Geo = new THREE.CylinderGeometry(0.08, 0.08, 4, 4);
      var spar2 = makeMesh(spar2Geo, 0x553311);
      spar2.rotation.z = Math.PI / 2;
      spar2.position.set(md.x, md.y - 1.2, md.z);
      state.scene.add(spar2);
      state.mastMeshes.push(spar2);
    }

    // Pier/dock
    var pierGeo = new THREE.BoxGeometry(4, 0.4, 8);
    var pier = makeMesh(pierGeo, 0x664422);
    pier.position.set(-8, 0.2, -6);
    state.scene.add(pier);
    state.mastMeshes.push(pier);

    // Cannons (4 on each side = 8 total for ship; we add 4 per side)
    var cannonSides = [
      { zOff: -2, dir: -1 },  // port side
      { zOff: -10, dir: 1 }   // starboard side
    ];
    for (var s = 0; s < cannonSides.length; s++) {
      var cs = cannonSides[s];
      for (var c = 0; c < 4; c++) {
        var cx = -6 + c * 4;
        var cannonGeo = new THREE.CylinderGeometry(0.2, 0.25, 1.8, 8);
        var cannon = makeMesh(cannonGeo, 0x333333);
        cannon.rotation.z = Math.PI / 2;
        cannon.position.set(cx, 3.8, cs.zOff);
        cannon.userData.isCannon = true;
        cannon.userData.cannonIndex = state.cannonMeshes.length;
        cannon.userData.side = s;
        state.scene.add(cannon);
        state.cannonMeshes.push(cannon);
        state.cannonAmmo.push(CANNON_SHOTS);
      }
    }

    // Barrel / crate props in hold
    var propPositions = [
      { x: -2, y: 0.5, z: -5 }, { x: 0, y: 0.5, z: -7 },
      { x: 2, y: 0.5, z: -5 }, { x: -2, y: 1.5, z: -5 },
      { x: 4, y: 0.5, z: -7 }, { x: -4, y: 0.5, z: -7 }
    ];
    for (i = 0; i < propPositions.length; i++) {
      var pp = propPositions[i];
      var propGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
      var propColor = (i % 2 === 0) ? 0x664422 : 0x553311;
      var prop = makeMesh(propGeo, propColor);
      prop.position.set(pp.x, pp.y, pp.z);
      prop.userData.isDestructible = true;
      prop.userData.destroyed = false;
      state.scene.add(prop);
      state.mastMeshes.push(prop);
    }
  }

  // ─── Build Treasure ───────────────────────────────────────────────────────
  function buildTreasure() {
    var i;
    var chestPositions = [
      { x: -15, y: 0.4, z: 8 },   // cave
      { x: 12, y: 0.4, z: 10 },   // cave
      { x: -5, y: 0.4, z: -12 },  // cave
      { x: 2, y: 4.6, z: -7 },    // ship hold
      { x: -6, y: 4.6, z: -7 }    // ship hold
    ];

    for (i = 0; i < chestPositions.length; i++) {
      var cp = chestPositions[i];
      var chestGeo = new THREE.BoxGeometry(1.2, 0.8, 0.8);
      var chest = makeMesh(chestGeo, 0x885522);
      chest.position.set(cp.x, cp.y, cp.z);
      chest.userData.isChest = true;
      chest.userData.chestIndex = i;
      state.scene.add(chest);

      var lidGeo = new THREE.BoxGeometry(1.2, 0.25, 0.8);
      var lid = makeMesh(lidGeo, 0xFFCC00);
      lid.position.set(cp.x, cp.y + 0.525, cp.z);
      lid.userData.isLid = true;
      state.scene.add(lid);

      state.chests.push({ mesh: chest, lid: lid, x: cp.x, y: cp.y, z: cp.z, opened: false });
    }

    // Main vault
    var vaultGeo = new THREE.BoxGeometry(3, 2.5, 2.5);
    state.vaultMesh = makeMesh(vaultGeo, 0x552211);
    state.vaultMesh.position.set(-17, 1.25, -13);
    state.vaultMesh.userData.isVault = true;
    state.scene.add(state.vaultMesh);
  }

  // ─── Build Pirates ────────────────────────────────────────────────────────
  function buildPirates() {
    var i;
    // 12 pirates total (6 on ship, 6 in cave); some musket, some cutlass
    var pirateData = [
      // cave pirates
      { x: -13, z: 6,  type: 'cutlass' },
      { x:  11, z: 6,  type: 'musket' },
      { x:  -6, z: -11, type: 'cutlass' },
      { x:   6, z: -11, type: 'musket' },
      { x:  -2, z: 10,  type: 'cutlass' },
      { x:  14, z: 2,   type: 'musket' },
      // ship pirates
      { x:  -4, z: -5,  type: 'cutlass', onShip: true },
      { x:   0, z: -7,  type: 'musket',  onShip: true },
      { x:   4, z: -5,  type: 'cutlass', onShip: true },
      { x:   8, z: -7,  type: 'musket',  onShip: true },
      { x:  12, z: -5,  type: 'cutlass', onShip: true },
      { x: -10, z: -7,  type: 'musket',  onShip: true }
    ];

    for (i = 0; i < pirateData.length; i++) {
      var pd = pirateData[i];
      var yBase = pd.onShip ? 4.5 : 0.9;
      var pirateGeo = new THREE.BoxGeometry(0.7, 1.8, 0.7);
      var pirate = makeMesh(pirateGeo, 0x553322);
      pirate.position.set(pd.x, yBase, pd.z);

      // Hat
      var hatGeo = new THREE.BoxGeometry(0.8, 0.35, 0.5);
      var hat = makeMesh(hatGeo, 0x221100);
      hat.position.set(0, 1.05, 0);
      pirate.add(hat);

      // Cutlass or pistol visual
      if (pd.type === 'cutlass') {
        var cutlassGeo = new THREE.BoxGeometry(0.08, 0.8, 0.05);
        var cutlass = makeMesh(cutlassGeo, 0xAAAAAA);
        cutlass.position.set(0.45, 0, 0);
        pirate.add(cutlass);
      } else {
        var pistolGeo = new THREE.BoxGeometry(0.35, 0.18, 0.1);
        var pistol = makeMesh(pistolGeo, 0x333322);
        pistol.position.set(0.45, 0.3, 0);
        pirate.add(pistol);
      }

      state.scene.add(pirate);
      state.pirates.push({
        mesh: pirate,
        hp: PIRATE_HP,
        type: pd.type,
        x: pd.x, y: yBase, z: pd.z,
        lastAttackTime: 0,
        reloadTimer: 0,
        pirateState: 'patrol',
        cutlassAngle: 0,
        patrolOffset: Math.random() * Math.PI * 2,
        dead: false,
        onShip: pd.onShip || false
      });
    }

    // Captain
    var captainGeo = new THREE.BoxGeometry(0.7 * 1.3, 1.8 * 1.3, 0.7 * 1.3);
    var captain = makeMesh(captainGeo, 0x220044);
    captain.position.set(6, 5.2, -4);
    var captainHatGeo = new THREE.BoxGeometry(0.95, 0.4, 0.6);
    var captainHat = makeMesh(captainHatGeo, 0x110033);
    captainHat.position.set(0, 1.25, 0);
    captain.add(captainHat);
    state.scene.add(captain);
    state.piratesCaptain = {
      mesh: captain,
      hp: CAPTAIN_HP,
      type: 'captain',
      x: 6, y: 5.2, z: -4,
      lastAttackTime: 0,
      reloadTimer: 0,
      pirateState: 'patrol',
      dead: false,
      onShip: true
    };
    state.pirates.push(state.piratesCaptain);
  }

  // ─── Build Navy Frigate ───────────────────────────────────────────────────
  function buildNavyFrigate() {
    // Frigate starts far back, moves to cave mouth
    var frigateGeo = new THREE.BoxGeometry(22, 5, 10);
    state.frigateMesh = makeMesh(frigateGeo, 0x334455);
    state.frigateMesh.position.set(0, 2.5, -80);
    state.frigateMesh.visible = false;
    state.scene.add(state.frigateMesh);

    // Two cannons on frigate
    var i;
    for (i = 0; i < 2; i++) {
      var fCanGeo = new THREE.CylinderGeometry(0.25, 0.3, 2, 8);
      var fCan = makeMesh(fCanGeo, 0x222244);
      fCan.rotation.z = Math.PI / 2;
      fCan.position.set(-5 + i * 10, 4.5, 0);
      state.frigateMesh.add(fCan);
      state.frigateCannonMeshes.push(fCan);
    }
  }

  // ─── Build HUD ────────────────────────────────────────────────────────────
  function buildHUD() {
    var hud = document.createElement('div');
    hud.id = 'pirate-cove-hud';
    hud.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)',
      'color:#FFCC44',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'display:none'
    ].join(';');
    document.body.appendChild(hud);
    state.hudElement = hud;

    var msg = document.createElement('div');
    msg.id = 'pirate-cove-msg';
    msg.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#FFDD88',
      'font-family:monospace',
      'font-size:14px',
      'padding:8px 18px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'display:none'
    ].join(';');
    document.body.appendChild(msg);
    state.msgElement = msg;
  }

  function updateHUD() {
    if (!state.hudElement) { return; }
    var piratesAlive = 0;
    var i;
    for (i = 0; i < state.pirates.length; i++) {
      if (!state.pirates[i].dead) { piratesAlive++; }
    }
    var navyStr = 'CLEAR';
    if (state.navyInbound) {
      navyStr = 'PRESENT';
    } else if (!state.navyAlarmRaised) {
      var remaining = Math.max(0, Math.ceil(NAVY_DELAY - state.navyTimer));
      navyStr = 'INBOUND in ' + remaining + 's';
    }
    var vaultStr = state.vaultOpen ? 'OPEN' : 'LOCKED';
    state.hudElement.textContent =
      'PIRATE COVE  [GOLD: ' + state.goldTotal + ']' +
      '  [CHESTS: ' + state.chestsOpened + '/' + state.chestsTotal + ']' +
      '  [VAULT: ' + vaultStr + ']' +
      '  [PIRATES: ' + piratesAlive + ']' +
      '  [NAVY: ' + navyStr + ']';
  }

  // ─── Interaction ──────────────────────────────────────────────────────────
  function tryInteract() {
    var pp = state.playerPos;
    var i, obj, d;

    // Chests
    for (i = 0; i < state.chests.length; i++) {
      obj = state.chests[i];
      if (obj.opened) { continue; }
      d = dist2D(pp.x, pp.z, obj.x, obj.z);
      if (d < INTERACT_RANGE) {
        obj.opened = true;
        obj.lid.rotation.x = -Math.PI / 2.5;
        state.goldTotal += GOLD_PER_CHEST;
        state.chestsOpened++;
        showMessage('+' + GOLD_PER_CHEST + ' GOLD! (' + state.chestsOpened + '/' + state.chestsTotal + ' chests opened)');
        updateHUD();
        return;
      }
    }

    // Vault
    if (!state.vaultOpen && state.vaultMesh) {
      var vp = state.vaultMesh.position;
      d = dist2D(pp.x, pp.z, vp.x, vp.z);
      if (d < INTERACT_RANGE + 1) {
        showMessage('VAULT — Enter 3-digit combo (number keys). Clue scrolls in alcoves. Current: [' + state.vaultInput.join(',') + ']');
        return;
      }
    }

    // Scrolls
    for (i = 0; i < state.scrollMeshes.length; i++) {
      obj = state.scrollMeshes[i];
      if (!obj.userData.read) {
        var sp = obj.position;
        d = dist2D(pp.x, pp.z, sp.x, sp.z);
        if (d < INTERACT_RANGE) {
          obj.userData.read = true;
          showMessage('Scroll: ' + obj.userData.clue, 5);
          return;
        }
      }
    }

    // Cannons
    for (i = 0; i < state.cannonMeshes.length; i++) {
      var cannon = state.cannonMeshes[i];
      var cp = cannon.position;
      d = dist2D(pp.x, pp.z, cp.x, cp.z);
      if (d < INTERACT_RANGE + 1) {
        if (state.cannonAmmo[i] <= 0) {
          showMessage('Cannon empty!');
        } else {
          state.mannedCannon = i;
          showMessage('Manned cannon ' + (i + 1) + ' — SPACE/ENTER to fire, F/ESC to leave. Ammo: ' + state.cannonAmmo[i]);
        }
        return;
      }
    }
  }

  function tryVaultInput(digit) {
    if (state.vaultOpen) { return; }
    if (!state.vaultMesh) { return; }
    var vp = state.vaultMesh.position;
    var d = dist2D(state.playerPos.x, state.playerPos.z, vp.x, vp.z);
    if (d > INTERACT_RANGE + 2) { return; }

    state.vaultInput.push(digit);
    if (state.vaultInput.length === 3) {
      var correct = (
        state.vaultInput[0] === state.vaultCombo[0] &&
        state.vaultInput[1] === state.vaultCombo[1] &&
        state.vaultInput[2] === state.vaultCombo[2]
      );
      if (correct) {
        state.vaultOpen = true;
        state.vaultMesh.material.color.setHex(0x22AA44);
        state.goldTotal += 1000;
        showMessage('VAULT OPEN! +1000 GOLD!', 5);
        updateHUD();
      } else {
        showMessage('Wrong combo! Resetting. (' + state.vaultInput.join('') + ')');
      }
      state.vaultInput = [];
    } else {
      showMessage('Combo: [' + state.vaultInput.join(',') + '] (' + (3 - state.vaultInput.length) + ' digits left)');
    }
  }

  // ─── Cannon Firing ────────────────────────────────────────────────────────
  function fireMannedCannon() {
    var idx = state.mannedCannon;
    if (idx === -1) { return; }
    if (state.cannonAmmo[idx] <= 0) {
      showMessage('No ammo!');
      return;
    }
    state.cannonAmmo[idx]--;

    var cannon = state.cannonMeshes[idx];
    var cp = cannon.getWorldPosition(new THREE.Vector3());

    var ballGeo = new THREE.SphereGeometry(0.3, 6, 6);
    var ball = makeMesh(ballGeo, 0x333333);
    ball.position.copy(cp);
    state.scene.add(ball);

    // Direction from aimYaw/aimPitch
    var dx = Math.sin(state.aimYaw) * Math.cos(state.aimPitch) * CANNONBALL_SPEED;
    var dy = Math.sin(state.aimPitch) * CANNONBALL_SPEED;
    var dz = -Math.cos(state.aimYaw) * Math.cos(state.aimPitch) * CANNONBALL_SPEED;

    state.cannonShots.push({ mesh: ball, velocity: { x: dx, y: dy, z: dz }, age: 0 });
    showMessage('BOOM! Ammo remaining: ' + state.cannonAmmo[idx]);
    updateHUD();
  }

  // ─── Navy Frigate Fire ────────────────────────────────────────────────────
  function fireNavyCannon() {
    if (!state.frigateMesh || !state.frigateMesh.visible) { return; }
    var fp = state.frigateMesh.position;
    var ballGeo = new THREE.SphereGeometry(0.35, 6, 6);
    var ball = makeMesh(ballGeo, 0x222244);
    ball.position.set(fp.x, fp.y + 4, fp.z);
    state.scene.add(ball);

    // Aim toward cave center
    var targetX = (Math.random() - 0.5) * 20;
    var targetZ = (Math.random() - 0.5) * 10;
    var dx = targetX - fp.x;
    var dz = targetZ - fp.z;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    state.frigateCannonballs.push({
      mesh: ball,
      velocity: { x: (dx / len) * NAVY_BALL_SPEED, y: 0.5, z: (dz / len) * NAVY_BALL_SPEED },
      age: 0
    });
  }

  // ─── Boulder Drop ─────────────────────────────────────────────────────────
  function dropBoulder(idx) {
    var b = state.boulderMeshes[idx];
    if (b.dropped) { return; }
    b.dropped = true;
    // Hide rope
    if (b.rope) { b.rope.visible = false; }
    showMessage('Boulder dropped! Crushing path through tunnel!');

    // Check if any pirates are under it
    var bp = b.mesh.position;
    var i;
    for (i = 0; i < state.pirates.length; i++) {
      var p = state.pirates[i];
      if (p.dead) { continue; }
      var d = dist2D(p.x, p.z, bp.x, bp.z);
      if (d < 2) {
        p.dead = true;
        p.mesh.visible = false;
        showMessage('Boulder crushed a pirate!');
        updateHUD();
      }
    }
  }

  // ─── Cannonball Collision ─────────────────────────────────────────────────
  function checkCannonballHits(shots, dt) {
    var i, j, shot, sp;
    for (i = shots.length - 1; i >= 0; i--) {
      shot = shots[i];
      shot.mesh.position.x += shot.velocity.x * dt;
      shot.mesh.position.y += shot.velocity.y * dt;
      shot.mesh.position.z += shot.velocity.z * dt;
      shot.velocity.y -= 9 * dt; // gravity
      shot.age += dt;

      sp = shot.mesh.position;

      // Out of bounds / timeout
      if (shot.age > 5 || sp.y < -5) {
        state.scene.remove(shot.mesh);
        shots.splice(i, 1);
        continue;
      }

      // Hit pirates (player shots)
      if (shots === state.cannonShots) {
        var hit = false;
        for (j = 0; j < state.pirates.length; j++) {
          var pirate = state.pirates[j];
          if (pirate.dead) { continue; }
          var d = dist3D(sp, { x: pirate.x, y: pirate.y, z: pirate.z });
          if (d < 1.5) {
            pirate.hp -= 80;
            // Knockback
            var kbDx = pirate.x - sp.x;
            var kbDz = pirate.z - sp.z;
            var kbLen = Math.sqrt(kbDx * kbDx + kbDz * kbDz) || 1;
            pirate.x += (kbDx / kbLen) * 3;
            pirate.z += (kbDz / kbLen) * 3;
            pirate.mesh.position.set(pirate.x, pirate.y, pirate.z);
            if (pirate.hp <= 0) {
              pirate.dead = true;
              pirate.mesh.visible = false;
              showMessage('Pirate down!');
              updateHUD();
            }
            // Check rope shots
            var b;
            for (var bi = 0; bi < state.boulderMeshes.length; bi++) {
              b = state.boulderMeshes[bi];
              if (!b.dropped && b.rope) {
                var rp = b.mesh.position;
                var rd = dist2D(sp.x, sp.z, rp.x, rp.z);
                if (rd < 1.5) { dropBoulder(bi); }
              }
            }
            hit = true;
            break;
          }
        }
        // Check rope
        if (!hit) {
          var bk;
          for (bk = 0; bk < state.boulderMeshes.length; bk++) {
            var bBoulder = state.boulderMeshes[bk];
            if (!bBoulder.dropped) {
              var bPos = bBoulder.mesh.position;
              var bDist = dist3D(sp, { x: bPos.x, y: bPos.y + 2, z: bPos.z });
              if (bDist < 2) { dropBoulder(bk); hit = true; break; }
            }
          }
        }
        // Check destructible props
        if (!hit) {
          var pm;
          for (pm = 0; pm < state.mastMeshes.length; pm++) {
            var prop = state.mastMeshes[pm];
            if (prop.userData && prop.userData.isDestructible && !prop.userData.destroyed) {
              var propPos = prop.position;
              var propDist = dist3D(sp, { x: propPos.x, y: propPos.y, z: propPos.z });
              if (propDist < 1) {
                prop.userData.destroyed = true;
                prop.visible = false;
                hit = true;
                break;
              }
            }
          }
        }

        if (hit) {
          state.scene.remove(shot.mesh);
          shots.splice(i, 1);
        }
      }

      // Navy shots can hit player
      if (shots === state.frigateCannonballs) {
        var navyHit = false;
        var playerDist = dist3D(sp, state.playerPos);
        if (playerDist < 2) {
          state.playerHP -= 30;
          showMessage('HIT by navy cannonball! HP: ' + state.playerHP);
          navyHit = true;
        }
        if (navyHit || shot.age > 5 || sp.y < -2) {
          state.scene.remove(shot.mesh);
          shots.splice(i, 1);
        }
      }
    }
  }

  // ─── AI Update ────────────────────────────────────────────────────────────
  function updatePirates(dt) {
    var i, pirate, dx, dz, dist;
    var pp = state.playerPos;

    for (i = 0; i < state.pirates.length; i++) {
      pirate = state.pirates[i];
      if (pirate.dead) { continue; }

      dx = pp.x - pirate.x;
      dz = pp.z - pirate.z;
      dist = Math.sqrt(dx * dx + dz * dz);

      // Reload
      if (pirate.reloadTimer > 0) { pirate.reloadTimer -= dt; }

      if (pirate.type === 'musket') {
        // Musket pirate: stay at range, shoot
        if (dist < MUSKET_RANGE && pirate.reloadTimer <= 0) {
          pirate.reloadTimer = MUSKET_RELOAD;
          // Musket shot (simplified: immediate damage if in range)
          state.playerHP -= 15;
          showMessage('Musket shot! HP: ' + state.playerHP);
        }
        // Move to stay at 12-20u range
        if (dist < 12) {
          var awayLen = dist || 1;
          pirate.x -= (dx / awayLen) * 4 * dt;
          pirate.z -= (dz / awayLen) * 4 * dt;
        } else if (dist > 20) {
          var toLen = dist || 1;
          pirate.x += (dx / toLen) * 3 * dt;
          pirate.z += (dz / toLen) * 3 * dt;
        }
      } else if (pirate.type === 'cutlass' || pirate.type === 'captain') {
        // Melee: charge when in range
        var speed = pirate.type === 'captain' ? 4.5 : 3.5;
        if (dist < 18) {
          var approachLen = dist || 1;
          pirate.x += (dx / approachLen) * speed * dt;
          pirate.z += (dz / approachLen) * speed * dt;
        }
        // Lunge attack
        if (dist < CUTLASS_RANGE && pirate.reloadTimer <= 0) {
          pirate.reloadTimer = 1.2;
          var dmg = pirate.type === 'captain' ? 25 : 15;
          state.playerHP -= dmg;
          showMessage((pirate.type === 'captain' ? 'CAPTAIN RAPIER' : 'Cutlass') + ' strike! HP: ' + state.playerHP);
        }
        // Captain also fires pistol
        if (pirate.type === 'captain' && dist < MUSKET_RANGE && pirate.reloadTimer <= 0.1 && Math.random() < 0.01) {
          pirate.reloadTimer = 3;
          state.playerHP -= 20;
          showMessage('Captain fired pistol! HP: ' + state.playerHP);
        }
      } else {
        // Patrol
        pirate.patrolOffset = (pirate.patrolOffset || 0) + dt * 0.5;
        pirate.x += Math.sin(pirate.patrolOffset) * 0.02;
        pirate.z += Math.cos(pirate.patrolOffset) * 0.02;
      }

      pirate.mesh.position.set(pirate.x, pirate.y, pirate.z);
      // Face player
      if (dist > 0.1) {
        pirate.mesh.rotation.y = Math.atan2(dx, dz);
      }
    }
  }

  // ─── Activate / Deactivate ────────────────────────────────────────────────
  function activateCove() {
    if (!state.scene) {
      // Try to find scene
      if (window.renderer && window.renderer.scene) { state.scene = window.renderer.scene; }
      else if (window.scene) { state.scene = window.scene; }
      else if (window.gameScene) { state.scene = window.gameScene; }
      else { console.warn('[PirateCove] No THREE.js scene found.'); return; }
    }

    state.active = true;
    state.elapsedTime = 0;
    state.navyTimer = 0;
    state.navyAlarmRaised = false;
    state.navyInbound = false;
    state.frigateFireTimer = NAVY_FIRE_INTERVAL;
    state.goldTotal = 0;
    state.chestsOpened = 0;
    state.vaultOpen = false;
    state.vaultInput = [];
    state.playerHP = 100;
    state.playerPos = { x: 0, y: 1, z: 12 };
    state.mannedCannon = -1;
    state.aimPitch = 0;
    state.aimYaw = 0;
    state.cannonShots = [];
    state.frigateCannonballs = [];
    state.pirates = [];
    state.pillarMeshes = [];
    state.torchLights = [];
    state.mastMeshes = [];
    state.cannonMeshes = [];
    state.cannonAmmo = [];
    state.chests = [];
    state.scrollMeshes = [];
    state.boulderMeshes = [];

    // Save environment
    state.bgBackup = state.scene.background;
    state.fogBackup = state.scene.fog;
    state.scene.background = new THREE.Color(0x0A1A22);
    state.scene.fog = new THREE.FogExp2(0x0A1A22, 0.025);

    // Ambient light
    var amb = new THREE.AmbientLight(0x223344, 0.5);
    amb.name = '__piratecove_amb__';
    state.scene.add(amb);

    buildCave();
    buildShip();
    buildTreasure();
    buildPirates();
    buildNavyFrigate();

    if (state.hudElement) {
      state.hudElement.style.display = 'block';
      updateHUD();
    }

    showMessage('PIRATE COVE ACTIVATED — loot treasure, defeat pirates! [P+C to exit]', 5);

    // Start loop
    state._lastTs = performance.now();
    loop();
  }

  function deactivateCove() {
    state.active = false;
    if (state._animId) { cancelAnimationFrame(state._animId); state._animId = null; }

    if (!state.scene) { return; }

    // Restore environment
    if (state.bgBackup !== undefined) { state.scene.background = state.bgBackup; }
    if (state.fogBackup !== undefined) { state.scene.fog = state.fogBackup; }

    // Remove ambient
    var amb = state.scene.getObjectByName('__piratecove_amb__');
    if (amb) { state.scene.remove(amb); }

    var i;

    // Remove cave meshes
    if (state.caveMesh) { state.scene.remove(state.caveMesh); state.caveMesh = null; }
    if (state.waterMesh) { state.scene.remove(state.waterMesh); state.waterMesh = null; }
    if (state.tunnelMesh) { state.scene.remove(state.tunnelMesh); state.tunnelMesh = null; }
    for (i = 0; i < state.pillarMeshes.length; i++) { state.scene.remove(state.pillarMeshes[i]); }
    state.pillarMeshes = [];

    // Torches
    for (i = 0; i < state.torchLights.length; i++) { state.scene.remove(state.torchLights[i]); }
    state.torchLights = [];

    // Ship
    if (state.shipHull) { state.scene.remove(state.shipHull); state.shipHull = null; }
    for (i = 0; i < state.mastMeshes.length; i++) { state.scene.remove(state.mastMeshes[i]); }
    state.mastMeshes = [];
    for (i = 0; i < state.cannonMeshes.length; i++) { state.scene.remove(state.cannonMeshes[i]); }
    state.cannonMeshes = [];

    // Cannonballs
    for (i = 0; i < state.cannonShots.length; i++) { state.scene.remove(state.cannonShots[i].mesh); }
    state.cannonShots = [];
    for (i = 0; i < state.frigateCannonballs.length; i++) { state.scene.remove(state.frigateCannonballs[i].mesh); }
    state.frigateCannonballs = [];

    // Pirates
    for (i = 0; i < state.pirates.length; i++) { state.scene.remove(state.pirates[i].mesh); }
    state.pirates = [];
    state.piratesCaptain = null;

    // Treasure
    for (i = 0; i < state.chests.length; i++) {
      state.scene.remove(state.chests[i].mesh);
      state.scene.remove(state.chests[i].lid);
    }
    state.chests = [];
    if (state.vaultMesh) { state.scene.remove(state.vaultMesh); state.vaultMesh = null; }
    for (i = 0; i < state.scrollMeshes.length; i++) { state.scene.remove(state.scrollMeshes[i]); }
    state.scrollMeshes = [];

    // Boulders
    for (i = 0; i < state.boulderMeshes.length; i++) {
      state.scene.remove(state.boulderMeshes[i].mesh);
      if (state.boulderMeshes[i].rope) { state.scene.remove(state.boulderMeshes[i].rope); }
    }
    state.boulderMeshes = [];

    // Navy
    if (state.frigateMesh) { state.scene.remove(state.frigateMesh); state.frigateMesh = null; }
    state.frigateCannonMeshes = [];

    // HUD
    if (state.hudElement) { state.hudElement.style.display = 'none'; }
    if (state.msgElement) { state.msgElement.style.display = 'none'; }

    showMessage('Pirate Cove deactivated.');
  }

  // ─── Main Loop ────────────────────────────────────────────────────────────
  function loop() {
    if (!state.active) { return; }
    state._animId = requestAnimationFrame(loop);

    var now = performance.now();
    var dt = Math.min((now - state._lastTs) / 1000, 0.1);
    state._lastTs = now;
    state.elapsedTime += dt;

    // Navy timer
    if (!state.navyAlarmRaised) {
      state.navyTimer += dt;
      if (state.navyTimer >= NAVY_DELAY) {
        state.navyAlarmRaised = true;
        state.navyInbound = true;
        if (state.frigateMesh) {
          state.frigateMesh.visible = true;
          state.frigateMesh.position.z = -50;
        }
        showMessage('ALARM! Navy frigate approaching! Extract with treasure NOW!', 6);
        updateHUD();
      }
    }

    // Move frigate to cave mouth
    if (state.navyInbound && state.frigateMesh) {
      if (state.frigateMesh.position.z < -18) {
        state.frigateMesh.position.z += 4 * dt;
      } else {
        // Frigate is at cave mouth, fire periodically
        state.frigateFireTimer -= dt;
        if (state.frigateFireTimer <= 0) {
          state.frigateFireTimer = NAVY_FIRE_INTERVAL;
          fireNavyCannon();
          showMessage('NAVY CANNON FIRE!', 2);
        }
      }
    }

    // Update pirates
    updatePirates(dt);

    // Update cannonballs
    checkCannonballHits(state.cannonShots, dt);
    checkCannonballHits(state.frigateCannonballs, dt);

    // Boulder gravity
    var i, b;
    for (i = 0; i < state.boulderMeshes.length; i++) {
      b = state.boulderMeshes[i];
      if (b.dropped) {
        b.velocity = (b.velocity || 0) + 15 * dt;
        b.mesh.position.y -= b.velocity * dt;
        if (b.mesh.position.y < 0.5) {
          b.mesh.position.y = 0.5;
          b.velocity = 0;
        }
      }
    }

    // Torch flicker
    var t = state.elapsedTime;
    for (i = 0; i < state.torchLights.length; i++) {
      state.torchLights[i].intensity = 1.0 + 0.3 * Math.sin(t * 8 + i * 1.7);
    }

    // Message timer
    if (state.msgTimer > 0) {
      state.msgTimer -= dt;
      if (state.msgTimer <= 0 && state.msgElement) {
        state.msgElement.style.display = 'none';
      }
    }

    // HUD update (every 0.5s approximation via floor)
    if (Math.floor(state.elapsedTime * 2) !== Math.floor((state.elapsedTime - dt) * 2)) {
      updateHUD();
    }
  }

  // ─── Init ──────────────────────────────────────────────────────────────────
  function init(scene, camera, renderer) {
    state.scene    = scene    || null;
    state.camera   = camera   || null;
    state.renderer = renderer || null;

    buildHUD();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
  }

  function destroy() {
    if (state.active) { deactivateCove(); }
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup',   onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    if (state.hudElement && state.hudElement.parentNode) { state.hudElement.parentNode.removeChild(state.hudElement); }
    if (state.msgElement && state.msgElement.parentNode) { state.msgElement.parentNode.removeChild(state.msgElement); }
    state.hudElement = null;
    state.msgElement = null;
  }

  // ─── Public API ──────────────────────────────────────────────────────────
  return {
    init:      init,
    destroy:   destroy,
    activate:  activateCove,
    deactivate: deactivateCove,
    getState:  function () { return state; }
  };

}());
