window.BountyHunter = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // ─── State ────────────────────────────────────────────────────────────────
  var _lastBTime = 0;
  var _lastHTime = 0;

  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,
    animFrameId: null,
    lastTime: 0,
    // player
    playerPos: { x: 0, y: 1.8, z: 0 },
    playerYaw: 0,
    playerPitch: 0,
    playerHP: 100,
    moveKeys: {},
    pointerLocked: false,
    // shooting
    lastShotTime: 0,
    shotCooldown: 0.25,
    // scan
    scanActive: false,
    scanTimer: 0,
    scanDuration: 3,
    scanCooldown: 10,
    scanCooldownTimer: 0,
    // grapple
    grappling: false,
    grappleTarget: null,
    grappleTimer: 0,
    // credits & time
    credits: 0,
    elapsed: 0,
    // bounties & guards
    bounties: [],
    guards: [],
    flyingVehicles: [],
    crowds: [],
    // outcome
    won: false,
    lost: false,
    // hud element
    hudEl: null,
    overlayEl: null,
    // building meshes for grapple
    buildingMeshes: []
  };

  // ─── Bounty Definitions ───────────────────────────────────────────────────
  var BOUNTY_DEFS = [
    { name: 'Snake',    color: 0x225522, hp: 120, maxHp: 120, district: 'Market',        pos: { x: -40, y: 1, z: -20 }, guardCount: 3, speed: 2.0 },
    { name: 'Blaze',   color: 0xaa4400, hp: 100, maxHp: 100, district: 'Industrial',     pos: { x:  40, y: 1, z: -20 }, guardCount: 4, speed: 1.8 },
    { name: 'Neon Kai',color: 0x0088ff, hp: 140, maxHp: 140, district: 'Entertainment',  pos: { x:   0, y: 1, z: -60 }, guardCount: 4, speed: 3.5 },
    { name: 'Vex',     color: 0x553399, hp: 160, maxHp: 160, district: 'Rooftop',        pos: { x:  40, y: 18, z:  20 }, guardCount: 5, speed: 1.5 },
    { name: 'Ironclad',color: 0x445566, hp: 300, maxHp: 300, district: 'Underground',    pos: { x: -40, y: -4, z:  40 }, guardCount: 5, speed: 1.2 }
  ];

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function makeMat(color, emissive) {
    return new THREE.MeshLambertMaterial({ color: color, emissive: emissive || 0x000000 });
  }

  function makeBox(w, h, d, color, emissive) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = makeMat(color, emissive);
    return new THREE.Mesh(geo, mat);
  }

  function makeCyl(rt, rb, h, segs, color) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = makeMat(color);
    return new THREE.Mesh(geo, mat);
  }

  function makeSphere(r, color, emissive) {
    var geo = new THREE.SphereGeometry(r, 8, 8);
    var mat = makeMat(color, emissive);
    return new THREE.Mesh(geo, mat);
  }

  function makeCone(r, h, segs, color) {
    var geo = new THREE.ConeGeometry(r, h, segs);
    var mat = makeMat(color);
    return new THREE.Mesh(geo, mat);
  }

  function makeHologram(w, h, color) {
    var pts = [];
    pts.push( w/2,  h/2, 0,  -w/2,  h/2, 0);
    pts.push(-w/2,  h/2, 0,  -w/2, -h/2, 0);
    pts.push(-w/2, -h/2, 0,   w/2, -h/2, 0);
    pts.push( w/2, -h/2, 0,   w/2,  h/2, 0);
    pts.push( 0,    h/2, 0,   0,   -h/2, 0);
    pts.push(-w/2,  0,   0,   w/2,   0,  0);
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  function dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }

  function dist2(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx*dx + dz*dz);
  }

  function fmtTime(secs) {
    var s = Math.floor(secs);
    var m = Math.floor(s / 60);
    s = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  // ─── Scene Setup ──────────────────────────────────────────────────────────
  function buildScene() {
    var s = state.scene;

    // Ground
    var ground = makeBox(300, 0.5, 300, 0x111122);
    ground.position.set(0, -0.25, 0);
    s.add(ground);

    // Ambient & hemisphere
    s.add(new THREE.AmbientLight(0x110022, 0.5));
    var hemi = new THREE.HemisphereLight(0x0a0030, 0x000010, 0.3);
    s.add(hemi);

    // Neon point lights scattered
    var neonColors = [0xff00aa, 0x00ffff, 0xffff00, 0xff0066, 0x00ff88];
    var neonPositions = [
      [-40, 8, -20], [40, 8, -20], [0, 8, -60],
      [40, 25, 20],  [-40, 6, 40],  [0, 4, 0],
      [20, 6, 30],   [-20, 6, -40]
    ];
    for (var ni = 0; ni < neonPositions.length; ni++) {
      var np = neonPositions[ni];
      var pl = new THREE.PointLight(neonColors[ni % neonColors.length], 2, 40);
      pl.position.set(np[0], np[1], np[2]);
      s.add(pl);
    }

    buildMarketDistrict();
    buildIndustrialDistrict();
    buildEntertainmentDistrict();
    buildRooftopDistrict();
    buildUnderground();
    buildFlyingVehicles();
    buildCrowds();
    buildHoloAds();
  }

  function addBuilding(x, y, z, w, h, d, color, emissive) {
    var b = makeBox(w, h, d, color, emissive || 0x000000);
    b.position.set(x, y + h/2, z);
    state.scene.add(b);
    state.buildingMeshes.push(b);
    return b;
  }

  function buildMarketDistrict() {
    // Stacked market stalls around x=-40, z=-20
    var stallColors = [0x331122, 0x223311, 0x112233, 0x332211, 0x221133];
    for (var i = 0; i < 8; i++) {
      var sx = -40 + (i % 4) * 8 - 12;
      var sz = -20 + Math.floor(i / 4) * 8 - 4;
      addBuilding(sx, 0, sz, 5, 3, 5, stallColors[i % stallColors.length], 0x110011);
      // Awning
      var awn = makeBox(6, 0.3, 6, 0x442222);
      awn.position.set(sx, 3.15, sz);
      state.scene.add(awn);
      // Second level stall
      if (i < 4) {
        addBuilding(sx, 3.3, sz, 4, 2.5, 4, 0x223322);
      }
    }
    // Tall market tower
    addBuilding(-40, 0, -20, 8, 14, 8, 0x1a1a2e, 0x110022);
    addBuilding(-50, 0, -28, 5, 10, 5, 0x16213e);
    addBuilding(-32, 0, -12, 4, 8, 4, 0x1a1a2e);
  }

  function buildIndustrialDistrict() {
    // Tanks and scaffolding around x=40, z=-20
    var tank1 = makeCyl(4, 4, 10, 12, 0x334455);
    tank1.position.set(40, 5, -20);
    state.scene.add(tank1);

    var tank2 = makeCyl(3, 3, 7, 12, 0x445544);
    tank2.position.set(50, 3.5, -28);
    state.scene.add(tank2);

    var tank3 = makeCyl(2, 2, 5, 8, 0x335544);
    tank3.position.set(34, 2.5, -28);
    state.scene.add(tank3);

    // Scaffold poles
    for (var j = 0; j < 6; j++) {
      var px = 38 + (j % 3) * 5;
      var pz = -15 + Math.floor(j / 3) * 5;
      var pole = makeCyl(0.2, 0.2, 12, 6, 0x556655);
      pole.position.set(px, 6, pz);
      state.scene.add(pole);
    }
    // Scaffold platforms
    addBuilding(42, 8, -16, 8, 0.5, 4, 0x445544);
    addBuilding(44, 12, -20, 6, 0.5, 6, 0x445544);
    // Industrial blocks
    addBuilding(55, 0, -15, 10, 16, 10, 0x2a3a2a, 0x001100);
    addBuilding(35, 0, -35, 8, 12, 8, 0x3a2a2a);
  }

  function buildEntertainmentDistrict() {
    // Clubs with bright neon around x=0, z=-60
    var clubColors = [0x220011, 0x001122, 0x112200, 0x110022, 0x002211];
    var emissColors= [0x440022, 0x002244, 0x224400, 0x220044, 0x004422];
    for (var c = 0; c < 5; c++) {
      var cx = -20 + c * 10;
      addBuilding(cx, 0, -60, 8, 10 + c*2, 8, clubColors[c], emissColors[c]);
      // Club sign glow
      var sign = makeBox(7, 2, 0.3, 0x110033, 0x440088);
      sign.position.set(cx, 8 + c, -56);
      state.scene.add(sign);
      var signLight = new THREE.PointLight(0xff00ff, 3, 15);
      signLight.position.set(cx, 8 + c, -55);
      state.scene.add(signLight);
    }
    // Tall entertainment spire
    addBuilding(0, 0, -70, 6, 30, 6, 0x1a0033, 0x220055);
    var spireTop = makeCone(4, 6, 8, 0x330066);
    spireTop.position.set(0, 33, -70);
    state.scene.add(spireTop);
    // Crowd platforms
    addBuilding(0, 0, -55, 20, 0.5, 6, 0x221133);
  }

  function buildRooftopDistrict() {
    // Elevated platforms connected by bridges around x=40, y=18, z=20
    var platformPositions = [
      [40, 15, 20], [55, 18, 15], [55, 12, 30], [28, 20, 28], [42, 22, 10]
    ];
    for (var pi = 0; pi < platformPositions.length; pi++) {
      var pp = platformPositions[pi];
      addBuilding(pp[0], pp[1], pp[2], 10, 1, 10, 0x223344, 0x001122);
      // Support pillars
      var spl = makeCyl(0.5, 0.5, pp[1], 6, 0x334455);
      spl.position.set(pp[0], pp[1]/2, pp[2]);
      state.scene.add(spl);
    }
    // Bridges between platforms
    var bridges = [
      [40,15.5,20, 55,18.5,15],
      [55,12.5,30, 40,15.5,20]
    ];
    for (var bi = 0; bi < bridges.length; bi++) {
      var b = bridges[bi];
      var mx = (b[0]+b[3])/2, my = (b[1]+b[4])/2, mz = (b[2]+b[5])/2;
      var dx = b[3]-b[0], dz = b[5]-b[2];
      var len = Math.sqrt(dx*dx+dz*dz);
      var bridge = makeBox(len, 0.5, 2, 0x334455);
      bridge.position.set(mx, my, mz);
      bridge.rotation.y = Math.atan2(dx, dz);
      state.scene.add(bridge);
    }
    // Tall buildings below platforms
    addBuilding(40, 0, 20, 8, 15, 8, 0x1a2233, 0x000a22);
    addBuilding(55, 0, 15, 7, 18, 7, 0x233344);
    addBuilding(55, 0, 30, 6, 12, 6, 0x1a2233);
    addBuilding(28, 0, 28, 6, 20, 6, 0x233344, 0x000a22);
  }

  function buildUnderground() {
    // Dark tunnels around x=-40, y=-4, z=40
    var roofY = 0;
    // Tunnel roof & floor
    var tunRoof = makeBox(30, 1, 20, 0x111111);
    tunRoof.position.set(-40, roofY, 40);
    state.scene.add(tunRoof);
    var tunFloor = makeBox(30, 0.5, 20, 0x0a0a0a);
    tunFloor.position.set(-40, -8.25, 40);
    state.scene.add(tunFloor);
    // Tunnel walls
    var tw1 = makeBox(1, 8, 20, 0x0d0d11);
    tw1.position.set(-26, -4, 40);
    state.scene.add(tw1);
    var tw2 = makeBox(1, 8, 20, 0x0d0d11);
    tw2.position.set(-54, -4, 40);
    state.scene.add(tw2);
    // End caps
    var te1 = makeBox(30, 8, 1, 0x0d0d11);
    te1.position.set(-40, -4, 50.5);
    state.scene.add(te1);
    var te2 = makeBox(30, 8, 1, 0x0d0d11);
    te2.position.set(-40, -4, 29.5);
    state.scene.add(te2);
    // Sparse underground lights
    var ulColors = [0xff0044, 0x004400, 0x440000];
    for (var ui = 0; ui < 3; ui++) {
      var ul = new THREE.PointLight(ulColors[ui], 1.5, 15);
      ul.position.set(-40 + (ui-1)*8, -2, 40);
      state.scene.add(ul);
    }
    // Underground crates/boxes
    for (var ci = 0; ci < 5; ci++) {
      var crate = makeBox(1.5, 1.5, 1.5, 0x223322);
      crate.position.set(-38 + ci*3, -7.5, 38 + (ci%2)*4);
      state.scene.add(crate);
      state.buildingMeshes.push(crate);
    }
    // Entry ramp
    var ramp = makeBox(6, 0.5, 12, 0x222233);
    ramp.position.set(-40, -2.5, 27);
    ramp.rotation.x = 0.4;
    state.scene.add(ramp);
  }

  function buildFlyingVehicles() {
    var vehicleColors = [0x334455, 0x554433, 0x334433, 0x445533, 0x553344];
    for (var vi = 0; vi < 8; vi++) {
      var vx = -60 + vi * 18;
      var vy = 20 + (vi % 3) * 8;
      var vz = -80 + (vi % 5) * 20;
      var veh = makeBox(4, 1.2, 2, vehicleColors[vi % vehicleColors.length], 0x111111);
      veh.position.set(vx, vy, vz);
      // Cockpit
      var cockpit = makeBox(1.5, 0.8, 1.5, 0x223344, 0x002244);
      cockpit.position.set(0.5, 0.8, 0);
      veh.add(cockpit);
      // Wing lights
      var wl = new THREE.PointLight(0x00aaff, 1, 6);
      wl.position.set(0, 0.5, 0);
      veh.add(wl);
      state.scene.add(veh);
      state.flyingVehicles.push({
        mesh: veh,
        speed: 3 + Math.random() * 2,
        dir: (vi % 2 === 0) ? 1 : -1,
        baseX: vx,
        baseZ: vz,
        angle: vi * Math.PI / 4
      });
    }
  }

  function buildCrowds() {
    var crowdZones = [
      { x: -40, z: -20, count: 8 },
      { x:   0, z: -60, count: 10 },
      { x:  10, z:   5, count: 6 }
    ];
    for (var cz = 0; cz < crowdZones.length; cz++) {
      var zone = crowdZones[cz];
      for (var ci = 0; ci < zone.count; ci++) {
        var nx = zone.x + (Math.random()-0.5)*16;
        var nz = zone.z + (Math.random()-0.5)*16;
        var npc = makeBox(0.5, 1.4, 0.5, 0x224422);
        npc.position.set(nx, 0.7, nz);
        // NPC head
        var head = makeSphere(0.25, 0x334433);
        head.position.set(0, 0.85, 0);
        npc.add(head);
        state.scene.add(npc);
        state.crowds.push({ mesh: npc, baseX: nx, baseZ: nz, angle: Math.random()*Math.PI*2, speed: 0.3+Math.random()*0.4 });
      }
    }
  }

  function buildHoloAds() {
    var adData = [
      { x: -25, y: 8, z: -15, color: 0x00ffff },
      { x:  25, y: 10, z: -15, color: 0xff00ff },
      { x:   5, y: 7, z: -50, color: 0xffff00 },
      { x:  -5, y: 12, z: -50, color: 0x00ff88 },
      { x:  60, y: 14, z:   0, color: 0xff4400 }
    ];
    for (var ai = 0; ai < adData.length; ai++) {
      var ad = adData[ai];
      var panel = makeHologram(5, 3, ad.color);
      panel.position.set(ad.x, ad.y, ad.z);
      state.scene.add(panel);
      var adLight = new THREE.PointLight(ad.color, 1.5, 12);
      adLight.position.set(ad.x, ad.y, ad.z);
      state.scene.add(adLight);
    }
  }

  // ─── Bounties & Guards ────────────────────────────────────────────────────
  function spawnBounties() {
    state.bounties = [];
    for (var i = 0; i < BOUNTY_DEFS.length; i++) {
      var def = BOUNTY_DEFS[i];
      var mesh = makeBox(1, 2, 1, def.color, def.color >> 1);
      mesh.position.set(def.pos.x, def.pos.y + 1, def.pos.z);
      // Head
      var head = makeSphere(0.35, def.color);
      head.position.set(0, 1.2, 0);
      mesh.add(head);
      state.scene.add(mesh);

      var bounty = {
        mesh: mesh,
        def: def,
        hp: def.hp,
        maxHp: def.maxHp,
        name: def.name,
        district: def.district,
        pos: { x: def.pos.x, y: def.pos.y + 1, z: def.pos.z },
        alive: true,
        captured: false,
        killed: false,
        credits: 0,
        scanHighlight: null
      };
      // Scan highlight sphere
      var hl = makeSphere(1.5, 0xffffff, 0x00aaff);
      hl.position.set(def.pos.x, def.pos.y + 1, def.pos.z);
      hl.visible = false;
      state.scene.add(hl);
      bounty.scanHighlight = hl;
      state.bounties.push(bounty);

      // Spawn guards for this bounty
      spawnGuards(def, bounty);
    }
  }

  function spawnGuards(def, bounty) {
    for (var g = 0; g < def.guardCount; g++) {
      var gx = def.pos.x + (Math.random()-0.5)*10;
      var gz = def.pos.z + (Math.random()-0.5)*10;
      var gy = def.pos.y;
      var gmesh = makeBox(0.7, 1.8, 0.7, 0x334433, 0x001100);
      gmesh.position.set(gx, gy + 0.9, gz);
      var ghead = makeSphere(0.28, 0x445544);
      ghead.position.set(0, 1.0, 0);
      gmesh.add(ghead);
      state.scene.add(gmesh);
      state.guards.push({
        mesh: gmesh,
        hp: 60,
        maxHp: 60,
        pos: { x: gx, y: gy + 0.9, z: gz },
        alive: true,
        bounty: bounty,
        alertRange: 18,
        attackRange: 8,
        attackTimer: 0,
        attackCooldown: 1.5
      });
    }
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────
  function buildHUD() {
    var hud = document.createElement('div');
    hud.id = 'bh-hud';
    hud.style.cssText = 'position:fixed;top:12px;left:0;right:0;text-align:center;'
      + 'color:#00ffcc;font-family:monospace;font-size:13px;'
      + 'text-shadow:0 0 8px #00ffcc;pointer-events:none;z-index:9999;'
      + 'background:rgba(0,0,0,0.4);padding:6px 0;';
    document.body.appendChild(hud);
    state.hudEl = hud;

    var cross = document.createElement('div');
    cross.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);'
      + 'color:#00ffcc;font-size:20px;pointer-events:none;z-index:9999;';
    cross.textContent = '+';
    document.body.appendChild(cross);
    state.crosshairEl = cross;

    var overlay = document.createElement('div');
    overlay.id = 'bh-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;'
      + 'display:flex;flex-direction:column;align-items:center;justify-content:center;'
      + 'color:#00ffcc;font-family:monospace;font-size:22px;'
      + 'background:rgba(0,0,20,0.85);z-index:10000;display:none;';
    document.body.appendChild(overlay);
    state.overlayEl = overlay;
  }

  function updateHUD() {
    if (!state.hudEl) return;
    var bountyCount = 0;
    for (var i = 0; i < state.bounties.length; i++) {
      if (!state.bounties[i].alive) bountyCount++;
    }
    var liveGuards = 0;
    for (var gi = 0; gi < state.guards.length; gi++) {
      if (state.guards[gi].alive) liveGuards++;
    }
    var scanStr = state.scanCooldownTimer > 0
      ? Math.ceil(state.scanCooldownTimer) + 's'
      : 'READY';
    state.hudEl.textContent =
      'BOUNTY HUNTER | BOUNTIES: ' + bountyCount + '/5 | CREDITS: ' + state.credits
      + 'cr | SCAN: ' + scanStr + ' | TIME: ' + fmtTime(state.elapsed)
      + ' | GUARDS: ' + liveGuards + ' | HP: ' + state.playerHP;
  }

  function showOverlay(msg) {
    if (!state.overlayEl) return;
    state.overlayEl.innerHTML = msg;
    state.overlayEl.style.display = 'flex';
  }

  // ─── Controls ─────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    var k = e.key.toUpperCase();
    state.moveKeys[k] = true;

    if (k === 'B') _lastBTime = performance.now();
    if (k === 'H') {
      _lastHTime = performance.now();
      if (_lastHTime - _lastBTime < 400 && !state.active) {
        init();
      }
    }

    if (!state.active) return;

    if (k === 'Q') {
      if (state.scanCooldownTimer <= 0) {
        state.scanActive = true;
        state.scanTimer = state.scanDuration;
        state.scanCooldownTimer = state.scanCooldown;
        for (var i = 0; i < state.bounties.length; i++) {
          if (state.bounties[i].alive) {
            state.bounties[i].scanHighlight.visible = true;
          }
        }
      }
    }

    if (k === 'G') {
      tryGrapple();
    }
  }

  function onKeyUp(e) {
    state.moveKeys[e.key.toUpperCase()] = false;
  }

  function onMouseDown(e) {
    if (!state.active || !state.pointerLocked) return;
    if (e.button === 0) {
      shoot();
    } else if (e.button === 2) {
      tryCapture();
    }
  }

  function onMouseMove(e) {
    if (!state.active || !state.pointerLocked) return;
    var sens = 0.002;
    state.playerYaw -= e.movementX * sens;
    state.playerPitch -= e.movementY * sens;
    state.playerPitch = Math.max(-1.2, Math.min(1.2, state.playerPitch));
  }

  function onPointerLockChange() {
    state.pointerLocked = document.pointerLockElement === state.renderer.domElement;
  }

  function onCanvasClick() {
    if (state.active && !state.pointerLocked) {
      state.renderer.domElement.requestPointerLock();
    }
  }

  // ─── Shooting & Capture ───────────────────────────────────────────────────
  function shoot() {
    var now = performance.now() / 1000;
    if (now - state.lastShotTime < state.shotCooldown) return;
    state.lastShotTime = now;

    var dir = getAimDir();
    var pp = state.playerPos;
    var origin = new THREE.Vector3(pp.x, pp.y + 0.2, pp.z);
    var ray = new THREE.Ray(origin, dir);

    var bestDist = 80;
    var hitBounty = null;
    var hitGuard = null;

    for (var i = 0; i < state.bounties.length; i++) {
      var bt = state.bounties[i];
      if (!bt.alive) continue;
      var bPos = new THREE.Vector3(bt.pos.x, bt.pos.y, bt.pos.z);
      var d = ray.distanceToPoint(bPos);
      var along = origin.distanceTo(bPos);
      if (d < 1.0 && along < bestDist) {
        bestDist = along;
        hitBounty = bt;
        hitGuard = null;
      }
    }

    for (var gi = 0; gi < state.guards.length; gi++) {
      var gd = state.guards[gi];
      if (!gd.alive) continue;
      var gPos = new THREE.Vector3(gd.pos.x, gd.pos.y, gd.pos.z);
      var gd2 = ray.distanceToPoint(gPos);
      var galong = origin.distanceTo(gPos);
      if (gd2 < 0.8 && galong < bestDist) {
        bestDist = galong;
        hitBounty = null;
        hitGuard = gd;
      }
    }

    if (hitBounty) {
      hitBounty.hp -= 30;
      if (hitBounty.hp <= 0) {
        killBounty(hitBounty, false);
      }
    }
    if (hitGuard) {
      hitGuard.hp -= 30;
      if (hitGuard.hp <= 0) {
        killGuard(hitGuard);
      }
    }
  }

  function tryCapture() {
    var pp = state.playerPos;
    for (var i = 0; i < state.bounties.length; i++) {
      var bt = state.bounties[i];
      if (!bt.alive) continue;
      if (bt.hp <= 20 && dist3(pp, bt.pos) < 4) {
        killBounty(bt, true);
        return;
      }
    }
  }

  function killBounty(bt, captured) {
    bt.alive = false;
    bt.captured = captured;
    bt.killed = !captured;
    bt.mesh.visible = false;
    if (bt.scanHighlight) bt.scanHighlight.visible = false;
    var cr = captured ? 2500 : 1000;
    state.credits += cr;
    bt.credits = cr;
    checkWin();
  }

  function killGuard(gd) {
    gd.alive = false;
    gd.mesh.visible = false;
  }

  function getAimDir() {
    var dir = new THREE.Vector3(0, 0, -1);
    var euler = new THREE.Euler(state.playerPitch, state.playerYaw, 0, 'YXZ');
    dir.applyEuler(euler);
    return dir.normalize();
  }

  // ─── Grapple ──────────────────────────────────────────────────────────────
  function tryGrapple() {
    var dir = getAimDir();
    var pp = state.playerPos;
    var origin = new THREE.Vector3(pp.x, pp.y, pp.z);
    var ray = new THREE.Ray(origin, dir);
    var bestDist = 30;
    var bestPoint = null;

    for (var bi = 0; bi < state.buildingMeshes.length; bi++) {
      var bm = state.buildingMeshes[bi];
      var box = new THREE.Box3().setFromObject(bm);
      var target = new THREE.Vector3();
      ray.closestPointToPoint(bm.position, target);
      var d = origin.distanceTo(bm.position);
      if (d < bestDist && box.containsPoint(target) === false) {
        bestDist = d;
        bestPoint = bm.position.clone();
      }
    }

    if (bestPoint && bestDist < 30) {
      state.grappling = true;
      state.grappleTarget = bestPoint;
      state.grappleTimer = 0.8;
    }
  }

  // ─── Movement ─────────────────────────────────────────────────────────────
  function updateMovement(dt) {
    var speed = 6;
    var pp = state.playerPos;
    var yaw = state.playerYaw;

    var fx = Math.sin(yaw), fz = Math.cos(yaw);
    var rx = Math.cos(yaw), rz = -Math.sin(yaw);

    var dx = 0, dz = 0;
    if (state.moveKeys['W']) { dx -= fx; dz -= fz; }
    if (state.moveKeys['S']) { dx += fx; dz += fz; }
    if (state.moveKeys['A']) { dx -= rx; dz -= rz; }
    if (state.moveKeys['D']) { dx += rx; dz += rz; }

    var len = Math.sqrt(dx*dx + dz*dz);
    if (len > 0) { dx /= len; dz /= len; }

    pp.x += dx * speed * dt;
    pp.z += dz * speed * dt;

    // Simple gravity / floor
    if (pp.y > 1.8) {
      pp.y -= 9 * dt;
      if (pp.y < 1.8) pp.y = 1.8;
    }

    // Underground floor
    if (pp.x > -56 && pp.x < -24 && pp.z > 29 && pp.z < 52) {
      if (pp.y < -6.2) pp.y = -6.2;
    }

    // Rooftop platforms
    var platforms = [
      { x:40, y:15, z:20, w:5, d:5 },
      { x:55, y:18, z:15, w:5, d:5 },
      { x:55, y:12, z:30, w:5, d:5 },
      { x:28, y:20, z:28, w:5, d:5 },
      { x:42, y:22, z:10, w:5, d:5 }
    ];
    for (var pi = 0; pi < platforms.length; pi++) {
      var pl = platforms[pi];
      if (Math.abs(pp.x - pl.x) < pl.w && Math.abs(pp.z - pl.z) < pl.d) {
        var surfY = pl.y + 1.8;
        if (pp.y < surfY) pp.y = surfY;
      }
    }

    // Grapple
    if (state.grappling && state.grappleTarget) {
      var tgt = state.grappleTarget;
      var gdx = tgt.x - pp.x, gdy = tgt.y - pp.y, gdz = tgt.z - pp.z;
      var gl = Math.sqrt(gdx*gdx + gdy*gdy + gdz*gdz);
      if (gl > 0.5 && state.grappleTimer > 0) {
        pp.x += (gdx/gl) * 14 * dt;
        pp.y += (gdy/gl) * 14 * dt;
        pp.z += (gdz/gl) * 14 * dt;
        state.grappleTimer -= dt;
      } else {
        state.grappling = false;
        state.grappleTarget = null;
      }
    }

    // Update camera
    state.camera.position.set(pp.x, pp.y + 0.2, pp.z);
    var euler = new THREE.Euler(state.playerPitch, state.playerYaw, 0, 'YXZ');
    state.camera.quaternion.setFromEuler(euler);
  }

  // ─── AI ───────────────────────────────────────────────────────────────────
  function updateAI(dt) {
    var pp = state.playerPos;

    // Bounty AI
    for (var bi = 0; bi < state.bounties.length; bi++) {
      var bt = state.bounties[bi];
      if (!bt.alive) continue;
      var bd = dist3(pp, bt.pos);
      var spd = bt.def.speed;
      if (bd < 25 && bd > 3) {
        var bdx = pp.x - bt.pos.x, bdz = pp.z - bt.pos.z;
        var bl = Math.sqrt(bdx*bdx + bdz*bdz);
        bt.pos.x += (bdx/bl) * spd * dt;
        bt.pos.z += (bdz/bl) * spd * dt;
        bt.mesh.position.set(bt.pos.x, bt.pos.y, bt.pos.z);
        if (bt.scanHighlight) bt.scanHighlight.position.set(bt.pos.x, bt.pos.y, bt.pos.z);
      }
    }

    // Guard AI
    for (var gi = 0; gi < state.guards.length; gi++) {
      var gd = state.guards[gi];
      if (!gd.alive) continue;
      var gdist = dist3(pp, gd.pos);

      if (gdist < gd.alertRange && gdist > gd.attackRange) {
        var ggdx = pp.x - gd.pos.x, ggdz = pp.z - gd.pos.z;
        var ggl = Math.sqrt(ggdx*ggdx + ggdz*ggdz);
        gd.pos.x += (ggdx/ggl) * 2.5 * dt;
        gd.pos.z += (ggdz/ggl) * 2.5 * dt;
        gd.mesh.position.set(gd.pos.x, gd.pos.y, gd.pos.z);
      }

      if (gdist < gd.attackRange) {
        gd.attackTimer -= dt;
        if (gd.attackTimer <= 0) {
          gd.attackTimer = gd.attackCooldown;
          state.playerHP -= 8;
          if (state.playerHP <= 0) {
            state.playerHP = 0;
            triggerLose();
          }
        }
      }
    }
  }

  // ─── Scan ─────────────────────────────────────────────────────────────────
  function updateScan(dt) {
    if (state.scanActive) {
      state.scanTimer -= dt;
      if (state.scanTimer <= 0) {
        state.scanActive = false;
        for (var i = 0; i < state.bounties.length; i++) {
          if (state.bounties[i].scanHighlight) {
            state.bounties[i].scanHighlight.visible = false;
          }
        }
      }
    }
    if (state.scanCooldownTimer > 0) {
      state.scanCooldownTimer -= dt;
      if (state.scanCooldownTimer < 0) state.scanCooldownTimer = 0;
    }
  }

  // ─── Flying vehicles & Crowds ─────────────────────────────────────────────
  function updateEnvironment(dt) {
    for (var vi = 0; vi < state.flyingVehicles.length; vi++) {
      var v = state.flyingVehicles[vi];
      v.angle += dt * v.speed * 0.03;
      v.mesh.position.x = v.baseX + Math.cos(v.angle) * 30;
      v.mesh.position.z = v.baseZ + Math.sin(v.angle) * 30;
    }
    for (var ci = 0; ci < state.crowds.length; ci++) {
      var c = state.crowds[ci];
      c.angle += dt * c.speed;
      c.mesh.position.x = c.baseX + Math.cos(c.angle) * 2;
      c.mesh.position.z = c.baseZ + Math.sin(c.angle) * 2;
    }
  }

  // ─── Win / Lose ───────────────────────────────────────────────────────────
  function checkWin() {
    for (var i = 0; i < state.bounties.length; i++) {
      if (state.bounties[i].alive) return;
    }
    state.won = true;
    triggerWin();
  }

  function triggerWin() {
    state.active = false;
    document.exitPointerLock();
    var timeBonus = Math.max(0, Math.floor((600 - state.elapsed) * 10));
    state.credits += timeBonus;
    var msg = '<div style="font-size:32px;color:#00ffcc;text-shadow:0 0 20px #00ffcc">MISSION COMPLETE</div>'
      + '<div style="margin-top:20px;font-size:18px">All bounties eliminated!</div>'
      + '<div style="margin-top:12px">TOTAL CREDITS: ' + state.credits + 'cr</div>'
      + '<div style="margin-top:8px">TIME BONUS: +' + timeBonus + 'cr</div>'
      + '<div style="margin-top:20px;font-size:14px;color:#00aa88">Press R to reset</div>';
    showOverlay(msg);
  }

  function triggerLose() {
    state.active = false;
    document.exitPointerLock();
    var msg = '<div style="font-size:32px;color:#ff0044;text-shadow:0 0 20px #ff0044">BOUNTY HUNTER DOWN</div>'
      + '<div style="margin-top:20px;font-size:18px">Mission failed. Respawn at safe house.</div>'
      + '<div style="margin-top:12px">CREDITS EARNED: ' + state.credits + 'cr</div>'
      + '<div style="margin-top:20px;font-size:14px;color:#aa0033">Press R to reset</div>';
    showOverlay(msg);
  }

  // ─── Init / Reset / Update ────────────────────────────────────────────────
  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    if (state.active) return;

    // Renderer
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0a0010);
    document.body.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:9000;';
    state.renderer = renderer;

    // Scene
    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050015, 0.02);
    state.scene = scene;

    // Camera
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
    camera.position.set(0, 1.8, 0);
    state.camera = camera;

    // Reset state
    state.active = true;
    state.won = false;
    state.lost = false;
    state.playerHP = 100;
    state.playerPos = { x: 0, y: 1.8, z: 8 };
    state.playerYaw = 0;
    state.playerPitch = 0;
    state.credits = 0;
    state.elapsed = 0;
    state.lastShotTime = 0;
    state.scanActive = false;
    state.scanTimer = 0;
    state.scanCooldownTimer = 0;
    state.grappling = false;
    state.grappleTarget = null;
    state.guards = [];
    state.bounties = [];
    state.flyingVehicles = [];
    state.crowds = [];
    state.buildingMeshes = [];
    state.moveKeys = {};
    state.pointerLocked = false;

    buildScene();
    spawnBounties();
    buildHUD();

    // Event listeners
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
    renderer.domElement.addEventListener('click', onCanvasClick);

    window.addEventListener('keydown', function(e) {
      if (e.key.toUpperCase() === 'R' && (state.won || state.lost)) {
        reset();
      }
    });

    window.addEventListener('resize', function() {
      if (state.renderer && state.camera) {
        state.renderer.setSize(window.innerWidth, window.innerHeight);
        state.camera.aspect = window.innerWidth / window.innerHeight;
        state.camera.updateProjectionMatrix();
      }
    });

    state.lastTime = performance.now();

    function loop(now) {
      if (!state.active && !state.won && !state.lost) return;
      state.animFrameId = requestAnimationFrame(loop);
      var dt = Math.min((now - state.lastTime) / 1000, 0.05);
      state.lastTime = now;
      update(dt);
      if (renderer) renderer.render(scene, camera);
    }
    state.animFrameId = requestAnimationFrame(loop);

    renderer.domElement.requestPointerLock();
  }

  function update(dt) {
    if (!state.active) return;
    state.elapsed += dt;
    updateMovement(dt);
    updateAI(dt);
    updateScan(dt);
    updateEnvironment(dt);
    updateHUD();
  }

  function reset() {
    // Cleanup
    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }
    if (state.renderer) {
      state.renderer.domElement.remove();
      state.renderer.dispose();
      state.renderer = null;
    }
    if (state.hudEl) { state.hudEl.remove(); state.hudEl = null; }
    if (state.crosshairEl) { state.crosshairEl.remove(); state.crosshairEl = null; }
    if (state.overlayEl) { state.overlayEl.remove(); state.overlayEl = null; }
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('pointerlockchange', onPointerLockChange);
    state.active = false;
    state.won = false;
    state.lost = false;
    state.scene = null;
    state.camera = null;
    init();
  }

  return { init: init, update: update, reset: reset };
})();
