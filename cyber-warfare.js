/* ───────────────────────────────────────────────────────────────────────────
   cyber-warfare.js — Cyber Warfare: Cyberspace FPS
   API: window.CyberWarfare = { init, update, reset }
   Activation: C + Y simultaneous keypress within 400ms
   Controls:
     WASD        → move
     Mouse       → look
     Left-click  → firewall punch (LineSegments beam, 40 dmg)
     Right-click → decoy virus (BoxGeometry at aim point, 8s distraction)
     E (hold)    → hack nearby node (5s for infrastructure, 10s for AI Core)
     V           → stealth mode (5s invisibility, 30s cooldown)
     O           → overclock (2x speed 10s, 45s cooldown)
   ─────────────────────────────────────────────────────────────────────────── */
window.CyberWarfare = (function () {
  'use strict';

  // ── Scene refs ─────────────────────────────────────────────────────────────
  var scene    = null;
  var camera   = null;
  var renderer = null;

  // ── Module state ───────────────────────────────────────────────────────────
  var active      = false;
  var elapsed     = 0;
  var ownedObjects = [];
  var ownedLights  = [];

  // ── Activation combo ───────────────────────────────────────────────────────
  var keys        = {};
  var cKeyTime    = 0;
  var yKeyTime    = 0;
  var COMBO_WINDOW = 400;

  // ── Game state ─────────────────────────────────────────────────────────────
  var score          = 0;
  var traceMeter     = 0;      // 0-100 %
  var gameOver       = false;
  var gameWon        = false;
  var nodesHacked    = 0;      // count of infra nodes (0-3) + AI Core
  var missionFailed  = false;

  // ── Player movement ────────────────────────────────────────────────────────
  var playerYaw   = 0;
  var playerPitch = 0;
  var moveSpeed   = 10;
  var BASE_SPEED  = 10;

  // ── Stealth ────────────────────────────────────────────────────────────────
  var stealthActive    = false;
  var stealthTimer     = 0;
  var STEALTH_DURATION = 5;
  var stealthCooldown  = 0;
  var STEALTH_COOLDOWN = 30;

  // ── Overclock ──────────────────────────────────────────────────────────────
  var overclockActive    = false;
  var overclockTimer     = 0;
  var OVERCLOCK_DURATION = 10;
  var overclockCooldown  = 0;
  var OVERCLOCK_COOLDOWN = 45;

  // ── Hack state ─────────────────────────────────────────────────────────────
  var hackingNodeIndex   = -1;
  var hackProgress       = 0;
  var HACK_RANGE         = 5;
  var HACK_DURATION_NODE = 5;
  var HACK_DURATION_CORE = 10;

  // ── Infrastructure nodes ───────────────────────────────────────────────────
  // node: { mesh, light, type, position, hacked, hacking, hackProgress,
  //         points, effect, hackDuration, label, glowColor }
  var infraNodes  = [];
  var aiCore      = null;
  var aiCoreLight = null;

  // ── Environment ────────────────────────────────────────────────────────────
  var groundGrid     = null;
  var gridLines      = null;
  var dataRainStrips = [];
  var dataNodes      = [];
  var dataPillars    = [];

  // ── Defenders ──────────────────────────────────────────────────────────────
  var sentries   = [];
  var blackIce   = [];
  var traceProgs = [];

  // ── Projectiles ────────────────────────────────────────────────────────────
  var packets = [];

  // ── Decoys ─────────────────────────────────────────────────────────────────
  var decoys = [];

  // ── Punch beam ────────────────────────────────────────────────────────────
  var punchBeam  = null;
  var punchTimer = 0;

  // ── ICE kill count ─────────────────────────────────────────────────────────
  var iceKilled = 0;

  // ── Detected by ICE ────────────────────────────────────────────────────────
  var detectedByICE = false;

  // ── HUD ───────────────────────────────────────────────────────────────────
  var hudEl     = null;
  var overlayEl = null;

  // ── Mouse state ───────────────────────────────────────────────────────────
  var mouseX       = 0;
  var mouseY       = 0;
  var pointerLocked = false;

  // ── Saved scene state ─────────────────────────────────────────────────────
  var savedBackground = null;
  var savedFog        = null;

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function distXZ(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function addOwned(obj) {
    ownedObjects.push(obj);
    scene.add(obj);
    return obj;
  }

  function addLight(light) {
    ownedLights.push(light);
    scene.add(light);
    return light;
  }

  function removeOwned(obj) {
    scene.remove(obj);
    var idx = ownedObjects.indexOf(obj);
    if (idx >= 0) { ownedObjects.splice(idx, 1); }
    if (obj.geometry) { obj.geometry.dispose(); }
    if (obj.material) { obj.material.dispose(); }
  }

  function camPos() {
    if (camera) { return camera.position; }
    return { x: 0, y: 1.7, z: 0 };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Environment
  // ─────────────────────────────────────────────────────────────────────────

  function buildEnvironment() {
    savedBackground = scene.background;
    savedFog        = scene.fog;
    scene.background = new THREE.Color(0x000011);
    scene.fog        = new THREE.FogExp2(0x000022, 0.02);

    var ambient = new THREE.AmbientLight(0x001133, 0.4);
    addLight(ambient);

    // Ground plane (0x001133)
    var planeGeo = new THREE.PlaneGeometry(200, 200);
    var planeMat = new THREE.MeshLambertMaterial({ color: 0x001133 });
    groundGrid = new THREE.Mesh(planeGeo, planeMat);
    groundGrid.rotation.x = -Math.PI / 2;
    groundGrid.position.y = 0;
    addOwned(groundGrid);

    // LineSegments grid overlay (0x004488)
    var gridGeo   = new THREE.BufferGeometry();
    var gridVerts = [];
    var GRID_SIZE = 200;
    var GRID_STEP = 4;
    var gi;
    for (gi = -GRID_SIZE / 2; gi <= GRID_SIZE / 2; gi += GRID_STEP) {
      gridVerts.push(gi, 0.05, -GRID_SIZE / 2,  gi, 0.05, GRID_SIZE / 2);
      gridVerts.push(-GRID_SIZE / 2, 0.05, gi,   GRID_SIZE / 2, 0.05, gi);
    }
    gridGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gridVerts), 3));
    var gridMat = new THREE.LineBasicMaterial({ color: 0x004488, transparent: true, opacity: 0.6 });
    gridLines = new THREE.LineSegments(gridGeo, gridMat);
    addOwned(gridLines);

    // Floating BoxGeometry data nodes (0x003366 emissive)
    var di;
    for (di = 0; di < 30; di++) {
      var dGeo = new THREE.BoxGeometry(rand(0.5, 2), rand(0.5, 2), rand(0.5, 2));
      var dMat = new THREE.MeshLambertMaterial({ color: 0x003366, emissive: 0x001133 });
      var dMesh = new THREE.Mesh(dGeo, dMat);
      dMesh.position.set(rand(-80, 80), rand(2, 12), rand(-80, 80));
      addOwned(dMesh);
      dataNodes.push({ mesh: dMesh, rotSpeedY: rand(-0.5, 0.5), rotSpeedX: rand(-0.3, 0.3) });
    }

    // CylinderGeometry data pillars (0x004488)
    var pi;
    for (pi = 0; pi < 20; pi++) {
      var ph   = rand(4, 20);
      var pGeo = new THREE.CylinderGeometry(0.3, 0.5, ph, 6);
      var pMat = new THREE.MeshLambertMaterial({ color: 0x004488, emissive: 0x001122 });
      var pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(rand(-90, 90), ph / 2, rand(-90, 90));
      addOwned(pMesh);
      dataPillars.push(pMesh);

      var pLight = new THREE.PointLight(0x0044AA, 0.8, 10);
      pLight.position.set(pMesh.position.x, ph + 0.5, pMesh.position.z);
      addLight(pLight);
    }

    // Data rain: 20 thin BoxGeometry falling strips (0x00FF88, 0.1 x rand-height x 0.1)
    var ri;
    for (ri = 0; ri < 20; ri++) {
      var rh   = rand(1, 5);
      var rGeo = new THREE.BoxGeometry(0.1, rh, 0.1);
      var rMat = new THREE.MeshLambertMaterial({
        color: 0x00FF88, emissive: 0x004422, transparent: true, opacity: 0.85
      });
      var rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.position.set(rand(-50, 50), rand(0, 20), rand(-50, 50));
      addOwned(rMesh);
      dataRainStrips.push({ mesh: rMesh, speed: rand(3, 8), resetY: 20 + rh / 2 });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Infrastructure nodes
  // ─────────────────────────────────────────────────────────────────────────

  function buildInfraNodes() {
    // 1. Power Grid: CylinderGeometry (0x004488 emissive)
    var powerGeo = new THREE.CylinderGeometry(1.2, 1.5, 4, 8);
    var powerMat = new THREE.MeshLambertMaterial({ color: 0x004488, emissive: 0x001133 });
    var powerMesh = new THREE.Mesh(powerGeo, powerMat);
    powerMesh.position.set(20, 2, 20);
    addOwned(powerMesh);
    var powerLight = new THREE.PointLight(0x0066CC, 1.5, 15);
    powerLight.position.set(20, 5, 20);
    addLight(powerLight);
    infraNodes.push({
      mesh: powerMesh, light: powerLight,
      type: 'power',
      position: { x: 20, y: 2, z: 20 },
      hacked: false, hacking: false, hackProgress: 0,
      points: 200, effect: 'BLACKOUT', hackDuration: HACK_DURATION_NODE,
      label: 'POWER GRID', glowColor: 0x0066CC
    });

    // 2. Banking node: BoxGeometry (0x004466 emissive)
    var bankGeo  = new THREE.BoxGeometry(3, 4, 3);
    var bankMat  = new THREE.MeshLambertMaterial({ color: 0x004466, emissive: 0x001122 });
    var bankMesh = new THREE.Mesh(bankGeo, bankMat);
    bankMesh.position.set(-20, 2, 20);
    addOwned(bankMesh);
    var bankLight = new THREE.PointLight(0x006688, 1.5, 15);
    bankLight.position.set(-20, 5, 20);
    addLight(bankLight);
    infraNodes.push({
      mesh: bankMesh, light: bankLight,
      type: 'banking',
      position: { x: -20, y: 2, z: 20 },
      hacked: false, hacking: false, hackProgress: 0,
      points: 300, effect: 'ECONOMIC CHAOS', hackDuration: HACK_DURATION_NODE,
      label: 'BANKING NODE', glowColor: 0x006688
    });

    // 3. Military comms: BoxGeometry (0x003344 emissive)
    var milGeo  = new THREE.BoxGeometry(4, 3, 2);
    var milMat  = new THREE.MeshLambertMaterial({ color: 0x003344, emissive: 0x001122 });
    var milMesh = new THREE.Mesh(milGeo, milMat);
    milMesh.position.set(-20, 1.5, -20);
    addOwned(milMesh);
    var milLight = new THREE.PointLight(0x004466, 1.5, 15);
    milLight.position.set(-20, 4, -20);
    addLight(milLight);
    infraNodes.push({
      mesh: milMesh, light: milLight,
      type: 'military',
      position: { x: -20, y: 1.5, z: -20 },
      hacked: false, hacking: false, hackProgress: 0,
      points: 400, effect: 'DEFENSE DISABLED', hackDuration: HACK_DURATION_NODE,
      label: 'MILITARY COMMS', glowColor: 0x004466
    });
  }

  function buildAICore() {
    // SphereGeometry r=3 (0x00AAFF emissive), hidden until 3 nodes hacked
    var geo = new THREE.SphereGeometry(3, 16, 12);
    var mat = new THREE.MeshLambertMaterial({
      color: 0x00AAFF, emissive: 0x002244, transparent: true, opacity: 0.9
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 5, 0);
    mesh.visible = false;
    addOwned(mesh);

    aiCoreLight = new THREE.PointLight(0x00AAFF, 2, 30);
    aiCoreLight.position.set(0, 8, 0);
    aiCoreLight.visible = false;
    addLight(aiCoreLight);

    aiCore = {
      mesh: mesh,
      light: aiCoreLight,
      position: { x: 0, y: 5, z: 0 },
      hacked: false,
      hacking: false,
      hackProgress: 0,
      visible: false,
      hackDuration: HACK_DURATION_CORE
    };
  }

  function revealAICore() {
    if (!aiCore || aiCore.visible) { return; }
    aiCore.visible        = true;
    aiCore.mesh.visible   = true;
    aiCoreLight.visible   = true;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Defenders
  // ─────────────────────────────────────────────────────────────────────────

  function buildSentries() {
    // 6 Firewall sentries: BoxGeometry (0xFF2200 emissive)
    var patrolPairs = [
      [{ x: 20, z: 20 }, { x: -20, z: 20 }],
      [{ x: -20, z: 20 }, { x: -20, z: -20 }],
      [{ x: -20, z: -20 }, { x: 20, z: -20 }],
      [{ x: 20, z: -20 }, { x: 20, z: 20 }],
      [{ x: 0, z: 20 }, { x: 0, z: -20 }],
      [{ x: -15, z: 0 }, { x: 15, z: 0 }]
    ];
    var i;
    for (i = 0; i < 6; i++) {
      var pp   = patrolPairs[i];
      var geo  = new THREE.BoxGeometry(1.2, 2, 0.8);
      var mat  = new THREE.MeshLambertMaterial({ color: 0xFF2200, emissive: 0x330000 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pp[0].x, 1, pp[0].z);
      addOwned(mesh);

      var light = new THREE.PointLight(0xFF2200, 1, 8);
      light.position.set(pp[0].x, 2, pp[0].z);
      addLight(light);

      sentries.push({
        mesh: mesh, light: light,
        position: { x: pp[0].x, y: 1, z: pp[0].z },
        patrolA: { x: pp[0].x, z: pp[0].z },
        patrolB: { x: pp[1].x, z: pp[1].z },
        patrolT: rand(0, Math.PI * 2),
        speed: 5,
        hp: 100,
        shootTimer: rand(1, 3),
        alive: true,
        chasing: false,
        decoyTarget: null
      });
    }
  }

  function buildBlackICE() {
    // 3 Black ICE hunters: CylinderGeometry (0xFF0000 emissive), 60 dmg melee
    var positions = [
      { x: 30, z: 0 },
      { x: -30, z: 15 },
      { x: 10, z: -30 }
    ];
    var i;
    for (i = 0; i < 3; i++) {
      var p    = positions[i];
      var geo  = new THREE.CylinderGeometry(0.5, 0.8, 2.5, 6);
      var mat  = new THREE.MeshLambertMaterial({ color: 0xFF0000, emissive: 0x440000 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(p.x, 1.25, p.z);
      addOwned(mesh);

      var light = new THREE.PointLight(0xFF0000, 1.2, 10);
      light.position.set(p.x, 2.5, p.z);
      addLight(light);

      blackIce.push({
        mesh: mesh, light: light,
        position: { x: p.x, y: 1.25, z: p.z },
        speed: 9,
        hp: 150,
        alive: true,
        meleeTimer: 0,
        MELEE_CD: 2
      });
    }
  }

  function buildTraceProgs() {
    // 2 Trace programs: SphereGeometry (0xFF8800 emissive), orbit AI Core
    var i;
    for (i = 0; i < 2; i++) {
      var geo   = new THREE.SphereGeometry(0.6, 8, 6);
      var mat   = new THREE.MeshLambertMaterial({ color: 0xFF8800, emissive: 0x331100 });
      var mesh  = new THREE.Mesh(geo, mat);
      var startAngle = (i / 2) * Math.PI * 2;
      mesh.position.set(Math.cos(startAngle) * 6, 5, Math.sin(startAngle) * 6);
      addOwned(mesh);

      var light = new THREE.PointLight(0xFF8800, 1, 6);
      light.position.copy(mesh.position);
      addLight(light);

      traceProgs.push({
        mesh: mesh, light: light,
        orbitAngle: startAngle,
        orbitRadius: 6,
        orbitSpeed: 0.8,
        hp: 50,
        alive: true
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HUD
  // ─────────────────────────────────────────────────────────────────────────

  function buildHUD() {
    if (hudEl) { return; }

    hudEl = document.createElement('div');
    hudEl.id = 'cw-hud';
    hudEl.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);'
      + 'background:rgba(0,0,17,0.88);color:#00FFAA;font-family:monospace;font-size:12px;'
      + 'padding:5px 14px;border:1px solid #004488;border-radius:3px;z-index:3100;'
      + 'pointer-events:none;white-space:nowrap;text-shadow:0 0 6px #00FFAA;';
    document.body.appendChild(hudEl);

    overlayEl = document.createElement('div');
    overlayEl.id = 'cw-overlay';
    overlayEl.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;'
      + 'pointer-events:none;z-index:3099;display:none;align-items:center;'
      + 'justify-content:center;font-family:monospace;font-size:32px;font-weight:bold;'
      + 'text-align:center;color:#00FF88;text-shadow:0 0 20px #00FF88;';
    document.body.appendChild(overlayEl);
  }

  function updateHUD() {
    if (!hudEl) { return; }

    var iceCount = 0, i;
    for (i = 0; i < sentries.length; i++)   { if (sentries[i].alive)   { iceCount++; } }
    for (i = 0; i < blackIce.length; i++)   { if (blackIce[i].alive)   { iceCount++; } }
    for (i = 0; i < traceProgs.length; i++) { if (traceProgs[i].alive) { iceCount++; } }

    var stealthStr;
    if (stealthActive) {
      stealthStr = 'ACTIVE(' + Math.ceil(stealthTimer) + 's)';
    } else if (stealthCooldown > 0) {
      stealthStr = Math.ceil(stealthCooldown) + 's CD';
    } else {
      stealthStr = 'READY';
    }

    var overStr;
    if (overclockActive) {
      overStr = '2x(' + Math.ceil(overclockTimer) + 's)';
    } else if (overclockCooldown > 0) {
      overStr = Math.ceil(overclockCooldown) + 's CD';
    } else {
      overStr = 'READY';
    }

    var coreStr;
    if (!aiCore || !aiCore.visible) {
      coreStr = 'LOCKED';
    } else if (aiCore.hacked) {
      coreStr = 'PWNED';
    } else if (aiCore.hacking) {
      coreStr = 'HACKING(' + Math.round(aiCore.hackProgress * 100) + '%)';
    } else {
      coreStr = 'EXPOSED';
    }

    var hackStr = '';
    if (hackingNodeIndex !== -1) {
      hackStr = ' [HACKING:' + Math.round(hackProgress * 100) + '%]';
    }

    var traceColor = traceMeter > 75 ? '#FF4400' : (traceMeter > 50 ? '#FFAA00' : '#00FFAA');
    hudEl.style.color = traceColor;
    hudEl.style.textShadow = '0 0 6px ' + traceColor;

    hudEl.textContent = 'CYBER WARFARE'
      + ' [NODES HACKED:' + nodesHacked + '/4]'
      + ' [ICE:' + iceCount + ']'
      + ' [TRACE:' + Math.round(traceMeter) + '%]'
      + ' [STEALTH:' + stealthStr + ']'
      + ' | AI CORE:' + coreStr
      + hackStr;
  }

  function showOverlay(msg, color) {
    if (!overlayEl) { return; }
    overlayEl.style.display = 'flex';
    overlayEl.style.color = color || '#00FF88';
    overlayEl.style.textShadow = '0 0 20px ' + (color || '#00FF88');
    overlayEl.innerHTML = msg;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Hacking logic
  // ─────────────────────────────────────────────────────────────────────────

  function getNearestHackTarget() {
    var pp   = camPos();
    var best = -1;
    var bestD = HACK_RANGE;
    var i;

    for (i = 0; i < infraNodes.length; i++) {
      if (infraNodes[i].hacked) { continue; }
      var d = distXZ(pp, infraNodes[i].position);
      if (d < bestD) { bestD = d; best = i; }
    }

    if (aiCore && aiCore.visible && !aiCore.hacked) {
      var dc = distXZ(pp, aiCore.position);
      if (dc < HACK_RANGE) { return 'core'; }
    }

    return best;
  }

  function completeHack(idx) {
    if (idx === 'core') {
      aiCore.hacked      = true;
      aiCore.hacking     = false;
      aiCore.hackProgress = 1;
      aiCore.mesh.material.color.setHex(0x00FF88);
      aiCore.mesh.material.emissive.setHex(0x003322);
      nodesHacked++;
      score += 500;
      gameWon = true;
      showOverlay('MISSION COMPLETE<br>CYBERSPACE COMPROMISED<br>SCORE: ' + score, '#00FF88');
    } else {
      var nd = infraNodes[idx];
      nd.hacked      = true;
      nd.hacking     = false;
      nd.hackProgress = 1;
      nd.mesh.material.color.setHex(0x00FF88);
      nd.mesh.material.emissive.setHex(0x002211);
      nd.light.color.setHex(0x00FF44);
      nodesHacked++;
      score += nd.points;
      traceMeter = Math.max(0, traceMeter - 5);

      if (nodesHacked >= 3) {
        revealAICore();
      }
    }

    hackingNodeIndex = -1;
    hackProgress     = 0;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Combat
  // ─────────────────────────────────────────────────────────────────────────

  function firewallPunch() {
    if (!camera) { return; }

    var dir    = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    var origin = camera.position.clone();
    var end    = origin.clone().addScaledVector(dir, 50);

    var beamGeo = new THREE.BufferGeometry();
    beamGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      origin.x, origin.y, origin.z,
      end.x,    end.y,    end.z
    ]), 3));
    var beamMat = new THREE.LineBasicMaterial({ color: 0x00FFFF, linewidth: 2 });
    var beam    = new THREE.LineSegments(beamGeo, beamMat);

    if (punchBeam) { removeOwned(punchBeam); }
    punchBeam  = beam;
    punchTimer = 0.15;
    addOwned(beam);

    // Raycast damage
    var raycaster  = new THREE.Raycaster(origin, dir.normalize());
    var targets    = [];
    var targetRefs = [];
    var i;

    for (i = 0; i < sentries.length; i++) {
      if (sentries[i].alive) {
        targets.push(sentries[i].mesh);
        targetRefs.push({ type: 's', idx: i });
      }
    }
    for (i = 0; i < blackIce.length; i++) {
      if (blackIce[i].alive) {
        targets.push(blackIce[i].mesh);
        targetRefs.push({ type: 'b', idx: i });
      }
    }
    for (i = 0; i < traceProgs.length; i++) {
      if (traceProgs[i].alive) {
        targets.push(traceProgs[i].mesh);
        targetRefs.push({ type: 't', idx: i });
      }
    }

    var hits = raycaster.intersectObjects(targets);
    if (hits.length > 0) {
      var hitMesh = hits[0].object;
      for (i = 0; i < targets.length; i++) {
        if (targets[i] === hitMesh) {
          applyDamageToICE(targetRefs[i], 40);
          break;
        }
      }
    }
  }

  function applyDamageToICE(ref, dmg) {
    if (ref.type === 's') {
      var s = sentries[ref.idx];
      if (!s.alive) { return; }
      s.hp -= dmg;
      if (s.hp <= 0) { killSentry(ref.idx); }
    } else if (ref.type === 'b') {
      var b = blackIce[ref.idx];
      if (!b.alive) { return; }
      b.hp -= dmg;
      if (b.hp <= 0) { killBlackICE(ref.idx); }
    } else if (ref.type === 't') {
      var t = traceProgs[ref.idx];
      if (!t.alive) { return; }
      t.hp -= dmg;
      if (t.hp <= 0) { killTraceProg(ref.idx); }
    }
  }

  function killSentry(idx) {
    var s = sentries[idx];
    s.alive        = false;
    s.mesh.visible = false;
    s.light.visible = false;
    iceKilled++;
    traceMeter = Math.max(0, traceMeter - 10);
  }

  function killBlackICE(idx) {
    var b = blackIce[idx];
    b.alive        = false;
    b.mesh.visible = false;
    b.light.visible = false;
    iceKilled++;
    traceMeter = Math.max(0, traceMeter - 10);
  }

  function killTraceProg(idx) {
    var t = traceProgs[idx];
    t.alive        = false;
    t.mesh.visible = false;
    t.light.visible = false;
    iceKilled++;
    traceMeter = Math.max(0, traceMeter - 10);
  }

  function spawnDecoy(x, y, z) {
    var geo  = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x00FF88, emissive: 0x004422 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.4, z);
    addOwned(mesh);

    decoys.push({ mesh: mesh, timer: 8, alive: true, position: { x: x, y: 0.4, z: z } });

    var i;
    for (i = 0; i < sentries.length; i++) {
      if (sentries[i].alive) {
        sentries[i].decoyTarget = { x: x, z: z };
        sentries[i].chasing     = false;
      }
    }
  }

  function shootPacket(from, to, damage) {
    var geo  = new THREE.SphereGeometry(0.2, 4, 3);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xFF4400, emissive: 0x330000 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(from.x, 1.7, from.z);
    addOwned(mesh);

    var dx  = to.x - from.x;
    var dy  = (to.y || 1.7) - 1.7;
    var dz  = to.z - from.z;
    var dl  = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    var spd = 18;
    packets.push({
      mesh: mesh,
      vel:  { x: dx / dl * spd, y: dy / dl * spd, z: dz / dl * spd },
      damage: damage,
      life: 3
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Update sub-systems
  // ─────────────────────────────────────────────────────────────────────────

  function updateEnvironment(dt) {
    var i;

    // Data rain
    for (i = 0; i < dataRainStrips.length; i++) {
      var r = dataRainStrips[i];
      r.mesh.position.y -= r.speed * dt;
      if (r.mesh.position.y < -2) {
        r.mesh.position.y = r.resetY;
        r.mesh.position.x = rand(-50, 50);
        r.mesh.position.z = rand(-50, 50);
      }
    }

    // Decorative node rotation
    for (i = 0; i < dataNodes.length; i++) {
      var dn = dataNodes[i];
      dn.mesh.rotation.y += dn.rotSpeedY * dt;
      dn.mesh.rotation.x += dn.rotSpeedX * dt;
    }

    // Grid flicker
    if (gridLines) {
      gridLines.material.opacity = 0.4 + Math.sin(elapsed * 2) * 0.2;
    }

    // Infra node glow pulse
    for (i = 0; i < infraNodes.length; i++) {
      var nd = infraNodes[i];
      if (!nd.hacked) {
        nd.light.intensity = 0.8 + Math.sin(elapsed * 3 + i) * 0.4;
      }
    }

    // AI core pulse & rotate
    if (aiCore && aiCore.visible && !aiCore.hacked) {
      aiCore.mesh.rotation.y += dt * 0.5;
      aiCoreLight.intensity   = 1.5 + Math.sin(elapsed * 4) * 0.5;
    }
  }

  function updateSentries(dt) {
    var pp = camPos();
    var i;

    for (i = 0; i < sentries.length; i++) {
      var s = sentries[i];
      if (!s.alive) { continue; }

      s.mesh.rotation.y += dt * 1.5;

      var target = null;

      if (s.decoyTarget) {
        target = s.decoyTarget;
        var dd = distXZ(s.position, s.decoyTarget);
        if (dd < 1) { s.decoyTarget = null; }
      } else if (!stealthActive) {
        var dp = distXZ(s.position, pp);
        if (dp < 25) { s.chasing = true;  }
        if (dp > 35) { s.chasing = false; }
        if (s.chasing) { target = { x: pp.x, z: pp.z }; }
      } else {
        s.chasing = false;
      }

      if (target) {
        var tx = target.x - s.position.x;
        var tz = target.z - s.position.z;
        var tl = Math.sqrt(tx * tx + tz * tz);
        if (tl > 0.5) {
          var ang = Math.atan2(tz, tx);
          s.position.x += Math.cos(ang) * s.speed * dt;
          s.position.z += Math.sin(ang) * s.speed * dt;
          s.mesh.rotation.y = ang + Math.PI / 2;
        }
      } else {
        s.patrolT += dt * 0.3;
        var pt = (Math.sin(s.patrolT) + 1) * 0.5;
        s.position.x = s.patrolA.x + (s.patrolB.x - s.patrolA.x) * pt;
        s.position.z = s.patrolA.z + (s.patrolB.z - s.patrolA.z) * pt;
      }

      s.mesh.position.set(s.position.x, 1, s.position.z);
      s.light.position.set(s.position.x, 2, s.position.z);

      if (s.chasing && !stealthActive) {
        s.shootTimer -= dt;
        if (s.shootTimer <= 0) {
          s.shootTimer = rand(1.5, 3.5);
          shootPacket(s.position, pp, 30);
        }
        detectedByICE = true;
      }
    }
  }

  function updateBlackICE(dt) {
    var pp = camPos();
    var i;

    for (i = 0; i < blackIce.length; i++) {
      var b = blackIce[i];
      if (!b.alive) { continue; }

      b.mesh.rotation.y += dt * 2;

      if (!stealthActive) {
        var dx = pp.x - b.position.x;
        var dz = pp.z - b.position.z;
        var dl = Math.sqrt(dx * dx + dz * dz) || 1;
        var ang = Math.atan2(dz, dx);
        b.position.x += Math.cos(ang) * b.speed * dt;
        b.position.z += Math.sin(ang) * b.speed * dt;
        b.mesh.position.set(b.position.x, 1.25, b.position.z);
        b.light.position.set(b.position.x, 2.5, b.position.z);

        if (dl < 2) {
          b.meleeTimer -= dt;
          if (b.meleeTimer <= 0) {
            b.meleeTimer = b.MELEE_CD;
            takeDamage(60);
          }
          detectedByICE = true;
        }
      }
    }
  }

  function updateTraceProgs(dt) {
    var pp = camPos();
    var i;

    for (i = 0; i < traceProgs.length; i++) {
      var t = traceProgs[i];
      if (!t.alive) { continue; }

      t.orbitAngle += t.orbitSpeed * dt;
      var ox = Math.cos(t.orbitAngle) * t.orbitRadius;
      var oz = Math.sin(t.orbitAngle) * t.orbitRadius;
      t.mesh.position.set(ox, 5, oz);
      t.light.position.set(ox, 6, oz);

      // Touch = instant disconnect
      if (dist3(pp, t.mesh.position) < 1.5) {
        traceMeter = 100;
        checkDisconnect();
      }
    }
  }

  function updatePackets(dt) {
    var pp = camPos();
    var i;

    for (i = packets.length - 1; i >= 0; i--) {
      var pk = packets[i];
      pk.life -= dt;
      pk.mesh.position.x += pk.vel.x * dt;
      pk.mesh.position.y += pk.vel.y * dt;
      pk.mesh.position.z += pk.vel.z * dt;

      if (pk.life <= 0) {
        removeOwned(pk.mesh);
        packets.splice(i, 1);
        continue;
      }

      if (dist3(pp, pk.mesh.position) < 1.2) {
        takeDamage(pk.damage);
        removeOwned(pk.mesh);
        packets.splice(i, 1);
      }
    }
  }

  function updateDecoys(dt) {
    var i;
    for (i = decoys.length - 1; i >= 0; i--) {
      var d = decoys[i];
      d.timer -= dt;
      d.mesh.rotation.y += dt * 3;

      if (d.timer <= 0) {
        removeOwned(d.mesh);
        decoys.splice(i, 1);
        var j;
        for (j = 0; j < sentries.length; j++) {
          if (sentries[j].alive) { sentries[j].decoyTarget = null; }
        }
      }
    }
  }

  function updatePunchBeam(dt) {
    if (!punchBeam) { return; }
    punchTimer -= dt;
    if (punchTimer <= 0) {
      removeOwned(punchBeam);
      punchBeam = null;
    }
  }

  function updateHacking(dt) {
    if (!keys['KeyE']) {
      if (hackingNodeIndex !== -1) {
        if (hackingNodeIndex === 'core') {
          if (aiCore) { aiCore.hacking = false; }
        } else {
          if (infraNodes[hackingNodeIndex]) { infraNodes[hackingNodeIndex].hacking = false; }
        }
        hackingNodeIndex = -1;
        hackProgress     = 0;
      }
      return;
    }

    var target = getNearestHackTarget();
    if (target === -1 || target === null || target === undefined) {
      hackingNodeIndex = -1;
      hackProgress     = 0;
      return;
    }

    if (hackingNodeIndex !== target) {
      if (hackingNodeIndex !== -1) {
        if (hackingNodeIndex === 'core' && aiCore) { aiCore.hacking = false; }
        else if (infraNodes[hackingNodeIndex]) { infraNodes[hackingNodeIndex].hacking = false; }
      }
      hackingNodeIndex = target;
      hackProgress     = 0;
    }

    var hackDur;
    if (hackingNodeIndex === 'core') {
      if (!aiCore || aiCore.hacked) { hackingNodeIndex = -1; return; }
      aiCore.hacking = true;
      hackDur = HACK_DURATION_CORE;
    } else {
      var nd = infraNodes[hackingNodeIndex];
      if (!nd || nd.hacked) { hackingNodeIndex = -1; return; }
      nd.hacking = true;
      hackDur    = HACK_DURATION_NODE;
    }

    hackProgress += dt / hackDur;
    // Staying near node slowly increases trace
    traceMeter += dt * 1.5;
    checkDisconnect();

    if (hackProgress >= 1) {
      completeHack(hackingNodeIndex);
    }
  }

  function updateMovement(dt) {
    if (!camera) { return; }

    // Stealth cooldowns
    if (stealthActive) {
      stealthTimer -= dt;
      if (stealthTimer <= 0) {
        stealthActive   = false;
        stealthTimer    = 0;
        stealthCooldown = STEALTH_COOLDOWN;
      }
    } else if (stealthCooldown > 0) {
      stealthCooldown -= dt;
      if (stealthCooldown < 0) { stealthCooldown = 0; }
    }

    // Overclock cooldowns
    if (overclockActive) {
      overclockTimer -= dt;
      if (overclockTimer <= 0) {
        overclockActive   = false;
        overclockTimer    = 0;
        overclockCooldown = OVERCLOCK_COOLDOWN;
        moveSpeed         = BASE_SPEED;
      }
    } else if (overclockCooldown > 0) {
      overclockCooldown -= dt;
      if (overclockCooldown < 0) { overclockCooldown = 0; }
    }

    // Detection trace gain
    if (detectedByICE && !stealthActive) {
      traceMeter += 2 * dt;
      if (traceMeter > 100) { traceMeter = 100; }
      checkDisconnect();
    }
    detectedByICE = false;

    // Mouse look
    if (pointerLocked) {
      playerYaw   -= mouseX * 0.002;
      playerPitch -= mouseY * 0.002;
      playerPitch  = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, playerPitch));
      mouseX = 0;
      mouseY = 0;
    }

    camera.rotation.order = 'YXZ';
    camera.rotation.y     = playerYaw;
    camera.rotation.x     = playerPitch;

    // WASD movement
    var moveX = 0, moveZ = 0;
    if (keys['KeyW'] || keys['ArrowUp'])    { moveZ -= 1; }
    if (keys['KeyS'] || keys['ArrowDown'])  { moveZ += 1; }
    if (keys['KeyA'] || keys['ArrowLeft'])  { moveX -= 1; }
    if (keys['KeyD'] || keys['ArrowRight']) { moveX += 1; }

    if (moveX !== 0 || moveZ !== 0) {
      var fwd   = new THREE.Vector3(0, 0, moveZ).applyEuler(new THREE.Euler(0, playerYaw, 0));
      var right = new THREE.Vector3(moveX, 0, 0).applyEuler(new THREE.Euler(0, playerYaw, 0));
      var total = new THREE.Vector3().addVectors(fwd, right).normalize();
      camera.position.x += total.x * moveSpeed * dt;
      camera.position.z += total.z * moveSpeed * dt;
    }

    if (camera.position.y < 1.7) { camera.position.y = 1.7; }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Trace & damage
  // ─────────────────────────────────────────────────────────────────────────

  function takeDamage(amount) {
    traceMeter += amount;
    if (traceMeter > 100) { traceMeter = 100; }
    checkDisconnect();
  }

  function checkDisconnect() {
    if (traceMeter >= 100 && !gameOver) {
      gameOver      = true;
      missionFailed = true;
      showOverlay('DISCONNECT<br>TRACE COMPLETE<br>MISSION FAILED', '#FF2200');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Input
  // ─────────────────────────────────────────────────────────────────────────

  function onKeyDown(e) {
    keys[e.code] = true;

    var now = Date.now();
    if (e.code === 'KeyC') { cKeyTime = now; }
    if (e.code === 'KeyY') { yKeyTime = now; }

    if (e.code === 'KeyC' || e.code === 'KeyY') {
      if (cKeyTime > 0 && yKeyTime > 0 && Math.abs(cKeyTime - yKeyTime) <= COMBO_WINDOW) {
        if (!active) { init(); }
      }
    }

    if (!active) { return; }

    if (e.code === 'KeyV') {
      if (!stealthActive && stealthCooldown <= 0) {
        stealthActive = true;
        stealthTimer  = STEALTH_DURATION;
      }
    }

    if (e.code === 'KeyO') {
      if (!overclockActive && overclockCooldown <= 0) {
        overclockActive = true;
        overclockTimer  = OVERCLOCK_DURATION;
        moveSpeed       = BASE_SPEED * 2;
      }
    }
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  function onMouseMove(e) {
    if (pointerLocked) {
      mouseX += e.movementX || 0;
      mouseY += e.movementY || 0;
    }
  }

  function onMouseDown(e) {
    if (!active) { return; }
    if (e.button === 0) {
      if (!pointerLocked && renderer && renderer.domElement) {
        renderer.domElement.requestPointerLock();
      }
      firewallPunch();
    }
  }

  function onRightClick(e) {
    if (!active || !camera) { return; }
    e.preventDefault();
    var dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    var pos = camera.position.clone().addScaledVector(dir, 15);
    spawnDecoy(pos.x, pos.y, pos.z);
  }

  function onPointerLockChange() {
    var el = renderer ? renderer.domElement : null;
    pointerLocked = (document.pointerLockElement === el);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Init
  // ─────────────────────────────────────────────────────────────────────────

  function init(sceneRef, cameraRef, rendererRef) {
    if (active) { return; }

    scene    = sceneRef    || window.scene    || null;
    camera   = cameraRef   || window.camera   || null;
    renderer = rendererRef || window.renderer || null;

    if (!scene && window.GameState) {
      scene    = window.GameState.scene    || null;
      camera   = camera    || window.GameState.camera    || null;
      renderer = renderer  || window.GameState.renderer  || null;
    }

    if (!scene) { return; }

    // Reset all state
    active            = true;
    elapsed           = 0;
    score             = 0;
    traceMeter        = 0;
    gameOver          = false;
    gameWon           = false;
    missionFailed     = false;
    nodesHacked       = 0;
    iceKilled         = 0;
    detectedByICE     = false;
    hackingNodeIndex  = -1;
    hackProgress      = 0;
    stealthActive     = false;
    stealthTimer      = 0;
    stealthCooldown   = 0;
    overclockActive   = false;
    overclockTimer    = 0;
    overclockCooldown = 0;
    moveSpeed         = BASE_SPEED;
    playerYaw         = 0;
    playerPitch       = 0;
    pointerLocked     = false;
    mouseX            = 0;
    mouseY            = 0;
    ownedObjects      = [];
    ownedLights       = [];
    infraNodes        = [];
    sentries          = [];
    blackIce          = [];
    traceProgs        = [];
    packets           = [];
    decoys            = [];
    dataRainStrips    = [];
    dataNodes         = [];
    dataPillars       = [];
    aiCore            = null;
    aiCoreLight       = null;
    punchBeam         = null;
    punchTimer        = 0;
    keys              = {};

    if (camera) {
      camera.position.set(0, 1.7, 30);
    }

    buildEnvironment();
    buildInfraNodes();
    buildAICore();
    buildSentries();
    buildBlackICE();
    buildTraceProgs();
    buildHUD();

    document.addEventListener('keydown',          onKeyDown);
    document.addEventListener('keyup',            onKeyUp);
    document.addEventListener('mousemove',        onMouseMove);
    document.addEventListener('mousedown',        onMouseDown);
    document.addEventListener('contextmenu',      onRightClick);
    document.addEventListener('pointerlockchange', onPointerLockChange);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Update
  // ─────────────────────────────────────────────────────────────────────────

  function update(dt) {
    if (!active) { return; }
    if (!dt || dt <= 0) { dt = 0.016; }
    if (dt > 0.1) { dt = 0.1; }

    elapsed += dt;

    if (gameOver || gameWon) {
      updateHUD();
      return;
    }

    updateMovement(dt);
    updateHacking(dt);
    updateEnvironment(dt);
    updateSentries(dt);
    updateBlackICE(dt);
    updateTraceProgs(dt);
    updatePackets(dt);
    updateDecoys(dt);
    updatePunchBeam(dt);
    updateHUD();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Reset
  // ─────────────────────────────────────────────────────────────────────────

  function reset() {
    if (!active) { return; }

    document.removeEventListener('keydown',          onKeyDown);
    document.removeEventListener('keyup',            onKeyUp);
    document.removeEventListener('mousemove',        onMouseMove);
    document.removeEventListener('mousedown',        onMouseDown);
    document.removeEventListener('contextmenu',      onRightClick);
    document.removeEventListener('pointerlockchange', onPointerLockChange);

    if (pointerLocked && document.exitPointerLock) {
      document.exitPointerLock();
    }

    var i;
    for (i = 0; i < ownedObjects.length; i++) {
      if (scene) { scene.remove(ownedObjects[i]); }
      if (ownedObjects[i].geometry) { ownedObjects[i].geometry.dispose(); }
      if (ownedObjects[i].material) { ownedObjects[i].material.dispose(); }
    }
    for (i = 0; i < ownedLights.length; i++) {
      if (scene) { scene.remove(ownedLights[i]); }
    }

    ownedObjects = [];
    ownedLights  = [];

    if (hudEl    && hudEl.parentNode)    { hudEl.parentNode.removeChild(hudEl);       hudEl    = null; }
    if (overlayEl && overlayEl.parentNode) { overlayEl.parentNode.removeChild(overlayEl); overlayEl = null; }

    if (scene) {
      scene.background = savedBackground;
      scene.fog        = savedFog;
    }

    infraNodes     = [];
    sentries       = [];
    blackIce       = [];
    traceProgs     = [];
    packets        = [];
    decoys         = [];
    dataRainStrips = [];
    dataNodes      = [];
    dataPillars    = [];
    aiCore         = null;
    aiCoreLight    = null;
    punchBeam      = null;
    keys           = {};
    active         = false;
    scene          = null;
    camera         = null;
    renderer       = null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
