window.CyberWarfare = (function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  var scene = null;
  var camera = null;
  var renderer = null;

  var active = false;
  var ownedObjects = [];

  // Activation key combo
  var keys = {};
  var cKeyTime = 0;
  var yKeyTime = 0;
  var COMBO_WINDOW = 400;

  // Room
  var roomFloor = null;
  var roomWalls = [];

  // Terminals
  var terminals = [];
  // terminal: { mesh, screens[], indicator, position, hacked, hacking, hackProgress,
  //             firewallActive, firewallHits, firewallMesh, disabled }

  // Central server
  var centralServer = null;
  var uploadActive = false;
  var uploadProgress = 0;
  var UPLOAD_DURATION = 15;
  var shutdownTriggered = false;
  var shutdownLight = null;
  var shutdownTimer = 0;
  var rehackRequired = [];

  // Data nodes
  var dataNodes = [];
  // dataNode: { mesh, collected, bobOffset }
  var dataScore = 0;

  // Network visualization
  var networkLines = null;
  var networkShown = false;
  var networkNodeMeshes = [];

  // Guards
  var guards = [];
  // guard: { body, head, position, dir, speed, alerted, alertTimer, patrolTarget, hp }

  // Alarm
  var alarmActive = false;
  var alarmFlashEl = null;
  var alarmTimer = 0;

  // Door / keycard
  var mainDoor = null;
  var doorOpen = false;
  var keycard = null;
  var keycardCollected = false;
  var officeRoom = null;

  // Payload system
  var PAYLOADS = ['VIRUS', 'RANSOMWARE', 'BACKDOOR'];
  var currentPayloadIndex = 0;
  var ransomwareActive = false;
  var ransomwareTimer = 0;
  var backdoorRevealed = false;
  var supplyCache = null;

  // HUD
  var hudEl = null;

  // Minimap
  var minimapEl = null;

  // Hack state
  var nearTerminalIndex = -1;
  var hackingTerminalIndex = -1;
  var HACK_RANGE = 3;
  var HACK_DURATION = 8;

  // Upload range
  var UPLOAD_RANGE = 3;

  // Keycard pickup range
  var KEYCARD_RANGE = 1.5;

  // Supply cache position (revealed via BACKDOOR)
  var supplyCachePos = { x: 6, y: 0.4, z: 6 };

  // Time accumulator
  var elapsed = 0;

  // ── Helpers ────────────────────────────────────────────────────────────────

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function dist3(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function distXZ(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function lerpColor(c1, c2, t) {
    var r1 = (c1 >> 16) & 0xFF;
    var g1 = (c1 >> 8) & 0xFF;
    var b1 = c1 & 0xFF;
    var r2 = (c2 >> 16) & 0xFF;
    var g2 = (c2 >> 8) & 0xFF;
    var b2 = c2 & 0xFF;
    var r = Math.round(r1 + (r2 - r1) * t);
    var g = Math.round(g1 + (g2 - g1) * t);
    var b = Math.round(b1 + (b2 - b1) * t);
    return (r << 16) | (g << 8) | b;
  }

  function addOwned(obj) {
    ownedObjects.push(obj);
    scene.add(obj);
    return obj;
  }

  function getPlayer() {
    if (window.player && window.player.position) { return window.player; }
    if (camera) { return camera; }
    return null;
  }

  function playerPos() {
    var p = getPlayer();
    return p ? p.position : { x: 0, y: 0, z: 0 };
  }

  // ── Build Room ─────────────────────────────────────────────────────────────

  function buildRoom() {
    // Floor
    var floorGeo = new THREE.BoxGeometry(20, 0.2, 20);
    var floorMat = new THREE.MeshLambertMaterial({ color: 0x1A1A2E });
    roomFloor = new THREE.Mesh(floorGeo, floorMat);
    roomFloor.position.set(0, -0.1, 0);
    roomFloor._cyberOwned = true;
    addOwned(roomFloor);

    // Ceiling
    var ceilGeo = new THREE.BoxGeometry(20, 0.2, 20);
    var ceilMat = new THREE.MeshLambertMaterial({ color: 0x111122 });
    var ceil = new THREE.Mesh(ceilGeo, ceilMat);
    ceil.position.set(0, 6.1, 0);
    ceil._cyberOwned = true;
    addOwned(ceil);

    // Walls (4 sides)
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x1E1E30 });
    var wallDefs = [
      { w: 20, h: 6, d: 0.3, x: 0, y: 3, z: -10 },
      { w: 20, h: 6, d: 0.3, x: 0, y: 3, z: 10 },
      { w: 0.3, h: 6, d: 20, x: -10, y: 3, z: 0 },
      { w: 0.3, h: 6, d: 20, x: 10, y: 3, z: 0 }
    ];
    for (var i = 0; i < wallDefs.length; i++) {
      var wd = wallDefs[i];
      var wGeo = new THREE.BoxGeometry(wd.w, wd.h, wd.d);
      var wall = new THREE.Mesh(wGeo, wallMat);
      wall.position.set(wd.x, wd.y, wd.z);
      wall._cyberOwned = true;
      addOwned(wall);
      roomWalls.push(wall);
    }

    // Ambient blue light
    var roomLight = new THREE.AmbientLight(0x111133, 0.8);
    roomLight._cyberOwned = true;
    addOwned(roomLight);

    var bluePoint = new THREE.PointLight(0x0033FF, 1.5, 25);
    bluePoint.position.set(0, 5, 0);
    bluePoint._cyberOwned = true;
    addOwned(bluePoint);
  }

  // ── Build Terminals ────────────────────────────────────────────────────────

  function buildTerminals() {
    // 4 corners of server room
    var cornerPositions = [
      { x: 7, z: -7 },
      { x: -7, z: -7 },
      { x: 7, z: 7 },
      { x: -7, z: 7 }
    ];

    for (var i = 0; i < 4; i++) {
      var cp = cornerPositions[i];
      var faceZ = cp.z < 0 ? -0.45 : 0.45;

      // Body: BoxGeometry 1x2x0.8
      var bodyGeo = new THREE.BoxGeometry(1, 2, 0.8);
      var bodyMat = new THREE.MeshLambertMaterial({ color: 0x222233 });
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(cp.x, 1, cp.z);
      body._cyberOwned = true;
      addOwned(body);

      // 3x2 grid of GLASS-colored screen panels
      var screens = [];
      var screenRows = 2;
      var screenCols = 3;
      for (var row = 0; row < screenRows; row++) {
        for (var col = 0; col < screenCols; col++) {
          var sGeo = new THREE.BoxGeometry(0.25, 0.7, 0.05);
          var sMat = new THREE.MeshLambertMaterial({
            color: 0x80C0FF,
            emissive: 0x102040,
            transparent: true,
            opacity: 0.85
          });
          var screen = new THREE.Mesh(sGeo, sMat);
          var sx = cp.x + (col - 1) * 0.28;
          var sy = 1 + (row - 0.5) * 0.75;
          var sz = cp.z + faceZ;
          screen.position.set(sx, sy, sz);
          screen._cyberOwned = true;
          addOwned(screen);
          screens.push(screen);
        }
      }

      // Status indicator light on top
      var indGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
      var indMat = new THREE.MeshLambertMaterial({ color: 0xFF3300, emissive: 0x330000 });
      var indicator = new THREE.Mesh(indGeo, indMat);
      indicator.position.set(cp.x, 2.1, cp.z);
      indicator._cyberOwned = true;
      addOwned(indicator);

      terminals.push({
        mesh: body,
        screens: screens,
        indicator: indicator,
        position: { x: cp.x, y: 1, z: cp.z },
        hacked: false,
        hacking: false,
        hackProgress: 0,
        firewallActive: false,
        firewallHits: 0,
        firewallMesh: null,
        disabled: false
      });
    }
  }

  // ── Firewall Boss ──────────────────────────────────────────────────────────

  function spawnFirewall(terminalIndex) {
    var t = terminals[terminalIndex];
    if (t.firewallMesh) { return; }

    var geo = new THREE.BoxGeometry(3, 3, 3);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFF0000, emissive: 0x220000 });
    var mesh = new THREE.Mesh(geo, mat);
    var offsetZ = t.position.z < 0 ? -4 : 4;
    mesh.position.set(t.position.x, 1.5, t.position.z + offsetZ);
    mesh._cyberOwned = true;
    addOwned(mesh);
    t.firewallMesh = mesh;
    t.firewallActive = true;
    t.firewallHits = 0;
  }

  function removeFirewall(terminalIndex) {
    var t = terminals[terminalIndex];
    if (t.firewallMesh) {
      scene.remove(t.firewallMesh);
      var idx = ownedObjects.indexOf(t.firewallMesh);
      if (idx >= 0) { ownedObjects.splice(idx, 1); }
      t.firewallMesh = null;
    }
    t.firewallActive = false;
    t.firewallHits = 0;
  }

  // ── Data Nodes ─────────────────────────────────────────────────────────────

  function buildDataNodes() {
    var positions = [
      { x: 3, z: 0 }, { x: -3, z: 0 },
      { x: 0, z: 3 }, { x: 0, z: -3 },
      { x: 5, z: 5 }, { x: -5, z: 5 },
      { x: 5, z: -5 }, { x: -5, z: -5 }
    ];

    for (var i = 0; i < 8; i++) {
      var geo = new THREE.SphereGeometry(0.4, 8, 6);
      var mat = new THREE.MeshLambertMaterial({ color: 0x00FF88, emissive: 0x003322 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(positions[i].x, 1.5, positions[i].z);
      mesh._cyberOwned = true;
      addOwned(mesh);
      dataNodes.push({
        mesh: mesh,
        collected: false,
        bobOffset: i * 0.8
      });
    }
  }

  // ── Network Visualization ──────────────────────────────────────────────────

  function buildNetworkViz() {
    if (networkShown) { return; }
    networkShown = true;

    var netPositions = [
      { x: 7, y: 3.5, z: -7 },
      { x: -7, y: 3.5, z: -7 },
      { x: 7, y: 3.5, z: 7 },
      { x: -7, y: 3.5, z: 7 },
      { x: 0, y: 3.5, z: 0 }
    ];

    for (var i = 0; i < netPositions.length; i++) {
      var nGeo = new THREE.SphereGeometry(0.12, 6, 4);
      var nMat = new THREE.MeshLambertMaterial({ color: 0x00FFFF, emissive: 0x003333 });
      var nMesh = new THREE.Mesh(nGeo, nMat);
      nMesh.position.set(netPositions[i].x, netPositions[i].y, netPositions[i].z);
      nMesh._cyberOwned = true;
      addOwned(nMesh);
      networkNodeMeshes.push(nMesh);
    }

    // LineSegments connecting the network nodes
    var lineVerts = [];
    var connections = [
      [0, 4], [1, 4], [2, 4], [3, 4],
      [0, 1], [2, 3], [0, 2], [1, 3]
    ];
    for (var c = 0; c < connections.length; c++) {
      var a = netPositions[connections[c][0]];
      var b = netPositions[connections[c][1]];
      lineVerts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }

    var lineGeo = new THREE.BufferGeometry();
    var vArray = new Float32Array(lineVerts);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(vArray, 3));
    var lineMat = new THREE.LineBasicMaterial({ color: 0x00FFFF, opacity: 0.7, transparent: true });
    networkLines = new THREE.LineSegments(lineGeo, lineMat);
    networkLines._cyberOwned = true;
    addOwned(networkLines);
  }

  // ── Central Server ─────────────────────────────────────────────────────────

  function buildCentralServer() {
    var geo = new THREE.BoxGeometry(3, 4, 3);
    var mat = new THREE.MeshLambertMaterial({ color: 0x002244 });
    centralServer = new THREE.Mesh(geo, mat);
    centralServer.position.set(0, 2, 0);
    centralServer._cyberOwned = true;
    addOwned(centralServer);

    var sLightGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    var sLightMat = new THREE.MeshLambertMaterial({ color: 0x0088FF, emissive: 0x002244 });
    var sLight = new THREE.Mesh(sLightGeo, sLightMat);
    sLight.position.set(0, 4.15, 0);
    sLight._cyberOwned = true;
    addOwned(sLight);
  }

  // ── Guards ─────────────────────────────────────────────────────────────────

  function buildGuard(x, z) {
    var bodyGeo = new THREE.BoxGeometry(0.6, 1.6, 0.4);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x333366 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(x, 0.8, z);
    body._cyberOwned = true;
    addOwned(body);

    var headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x445577 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.set(x, 1.8, z);
    head._cyberOwned = true;
    addOwned(head);

    var dir = Math.random() * Math.PI * 2;
    return {
      body: body,
      head: head,
      position: { x: x, y: 0.8, z: z },
      dir: dir,
      speed: 2.5,
      alerted: false,
      alertTimer: 0,
      patrolTarget: {
        x: Math.max(-8, Math.min(8, x + Math.cos(dir) * 3)),
        z: Math.max(-8, Math.min(8, z + Math.sin(dir) * 3))
      },
      hp: 3
    };
  }

  function buildInitialGuards() {
    var startPositions = [
      { x: 0, z: -5 },
      { x: 0, z: 5 },
      { x: -5, z: 0 },
      { x: 5, z: 0 },
      { x: -3, z: -3 }
    ];
    for (var i = 0; i < startPositions.length; i++) {
      guards.push(buildGuard(startPositions[i].x, startPositions[i].z));
    }
  }

  function spawnAlarmGuards() {
    for (var i = 0; i < 3; i++) {
      var angle = (i / 3) * Math.PI * 2;
      var gx = Math.cos(angle) * 8;
      var gz = Math.sin(angle) * 8;
      var g = buildGuard(gx, gz);
      g.alerted = true;
      g.alertTimer = 15;
      guards.push(g);
    }
  }

  // ── Office, Door, Keycard ──────────────────────────────────────────────────

  function buildOfficeAndDoor() {
    // Office room: BoxGeometry 10x4x8
    var offGeo = new THREE.BoxGeometry(10, 4, 8);
    var offMat = new THREE.MeshLambertMaterial({ color: 0x1A2A1A, opacity: 0.55, transparent: true });
    officeRoom = new THREE.Mesh(offGeo, offMat);
    officeRoom.position.set(15, 2, 0);
    officeRoom._cyberOwned = true;
    addOwned(officeRoom);

    var ofFloorGeo = new THREE.BoxGeometry(10, 0.15, 8);
    var ofFloorMat = new THREE.MeshLambertMaterial({ color: 0x182218 });
    var ofFloor = new THREE.Mesh(ofFloorGeo, ofFloorMat);
    ofFloor.position.set(15, 0.075, 0);
    ofFloor._cyberOwned = true;
    addOwned(ofFloor);

    // Main door: BoxGeometry 0x334433
    var doorGeo = new THREE.BoxGeometry(0.3, 4, 2.5);
    var doorMat = new THREE.MeshLambertMaterial({ color: 0x334433 });
    mainDoor = new THREE.Mesh(doorGeo, doorMat);
    mainDoor.position.set(10, 2, 0);
    mainDoor._cyberOwned = true;
    addOwned(mainDoor);

    // Keycard: BoxGeometry 0x0088FF
    var kcGeo = new THREE.BoxGeometry(0.3, 0.05, 0.5);
    var kcMat = new THREE.MeshLambertMaterial({ color: 0x0088FF, emissive: 0x001144 });
    keycard = new THREE.Mesh(kcGeo, kcMat);
    keycard.position.set(15, 0.8, -2);
    keycard._cyberOwned = true;
    addOwned(keycard);

    // Supply cache (hidden until BACKDOOR payload)
    var scGeo = new THREE.BoxGeometry(0.8, 0.5, 0.8);
    var scMat = new THREE.MeshLambertMaterial({ color: 0xFFCC00, emissive: 0x332200 });
    supplyCache = new THREE.Mesh(scGeo, scMat);
    supplyCache.position.set(supplyCachePos.x, supplyCachePos.y, supplyCachePos.z);
    supplyCache.visible = false;
    supplyCache._cyberOwned = true;
    addOwned(supplyCache);
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  function buildHUD() {
    if (hudEl) { return; }

    hudEl = document.createElement('div');
    hudEl.id = 'cyber-hud';
    hudEl.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);'
      + 'background:rgba(0,10,30,0.85);color:#00FFAA;font-family:monospace;font-size:13px;'
      + 'padding:6px 14px;border:1px solid #00FFAA;border-radius:3px;z-index:3000;'
      + 'pointer-events:none;white-space:nowrap;';
    document.body.appendChild(hudEl);

    alarmFlashEl = document.createElement('div');
    alarmFlashEl.id = 'cyber-alarm-flash';
    alarmFlashEl.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;'
      + 'pointer-events:none;z-index:2999;background:rgba(255,0,0,0);'
      + 'transition:background 0.1s;';
    document.body.appendChild(alarmFlashEl);

    minimapEl = document.createElement('canvas');
    minimapEl.id = 'cyber-minimap';
    minimapEl.width = 120;
    minimapEl.height = 120;
    minimapEl.style.cssText = 'position:fixed;bottom:10px;right:10px;'
      + 'background:rgba(0,5,20,0.85);border:1px solid #00FFAA;border-radius:3px;z-index:3000;';
    document.body.appendChild(minimapEl);
  }

  function updateHUD() {
    if (!hudEl) { return; }

    var hackedCount = 0;
    for (var i = 0; i < terminals.length; i++) {
      if (terminals[i].hacked) { hackedCount++; }
    }
    var dataCollected = 0;
    for (var d = 0; d < dataNodes.length; d++) {
      if (dataNodes[d].collected) { dataCollected++; }
    }
    var uploadPct = Math.round(uploadProgress * 100);
    var payloadName = PAYLOADS[currentPayloadIndex];

    var anyFirewall = false;
    for (var fi = 0; fi < terminals.length; fi++) {
      if (terminals[fi].firewallActive) { anyFirewall = true; break; }
    }
    var firewallStatus = anyFirewall ? 'ACTIVE' : 'BREACHED';

    var hackingStr = '';
    if (hackingTerminalIndex >= 0) {
      var pct = Math.round(terminals[hackingTerminalIndex].hackProgress * 100);
      hackingStr = ' [HACKING: ' + pct + '%]';
    }

    var uploadStr = uploadActive ? ' [UPLOADING...]' : '';
    var alarmStr = alarmActive ? ' [!ALARM!]' : '';
    var ransomStr = ransomwareActive ? ' [FROZEN ' + Math.round(ransomwareTimer) + 's]' : '';

    var txt = 'CYBER OPS'
      + ' [HACKED: ' + hackedCount + '/4]'
      + ' [DATA: ' + dataCollected + '/8]'
      + ' [UPLOAD: ' + uploadPct + '%]'
      + ' [PAYLOAD: ' + payloadName + ']'
      + ' | FIREWALL: ' + firewallStatus
      + hackingStr + uploadStr + alarmStr + ransomStr;

    if (shutdownTriggered) {
      hudEl.style.color = '#FF3300';
      txt = '!! EMERGENCY SHUTDOWN !! ' + txt;
    } else {
      hudEl.style.color = '#00FFAA';
    }

    hudEl.textContent = txt;
  }

  function updateMinimap() {
    if (!minimapEl) { return; }
    var ctx = minimapEl.getContext('2d');
    var w = minimapEl.width;
    var h = minimapEl.height;
    ctx.clearRect(0, 0, w, h);

    function toMap(wx, wz) {
      return {
        mx: Math.round((wx + 10) / 20 * w),
        my: Math.round((wz + 10) / 20 * h)
      };
    }

    ctx.strokeStyle = '#00FFAA';
    ctx.lineWidth = 1;
    ctx.strokeRect(2, 2, w - 4, h - 4);

    // Terminals
    for (var i = 0; i < terminals.length; i++) {
      var t = terminals[i];
      var tp = toMap(t.position.x, t.position.z);
      ctx.fillStyle = t.hacked ? '#00FF88' : (t.firewallActive ? '#FF0000' : '#888888');
      ctx.fillRect(tp.mx - 3, tp.my - 3, 6, 6);
    }

    // Data nodes
    for (var d = 0; d < dataNodes.length; d++) {
      if (!dataNodes[d].collected) {
        var dnp = toMap(dataNodes[d].mesh.position.x, dataNodes[d].mesh.position.z);
        ctx.fillStyle = '#00FF88';
        ctx.beginPath();
        ctx.arc(dnp.mx, dnp.my, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Supply cache (BACKDOOR revealed)
    if (backdoorRevealed) {
      var scp = toMap(supplyCachePos.x, supplyCachePos.z);
      ctx.fillStyle = '#FFCC00';
      ctx.fillRect(scp.mx - 3, scp.my - 3, 6, 6);
    }

    // Guards
    for (var g = 0; g < guards.length; g++) {
      var gd = guards[g];
      if (gd.hp <= 0) { continue; }
      var gp = toMap(gd.position.x, gd.position.z);
      ctx.fillStyle = gd.alerted ? '#FF4400' : '#334499';
      ctx.beginPath();
      ctx.arc(gp.mx, gp.my, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central server
    var csp = toMap(0, 0);
    ctx.fillStyle = '#0044AA';
    ctx.fillRect(csp.mx - 5, csp.my - 5, 10, 10);

    // Player
    var pp = playerPos();
    var playerMapPos = toMap(pp.x, pp.z);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(playerMapPos.mx, playerMapPos.my, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Alarm ──────────────────────────────────────────────────────────────────

  function triggerAlarm() {
    if (alarmActive) { return; }
    alarmActive = true;
    alarmTimer = 5;
    spawnAlarmGuards();

    if (alarmFlashEl) {
      alarmFlashEl.style.background = 'rgba(255,0,0,0.45)';
    }
    document.body.style.filter = 'brightness(1.8)';
    var savedFilter = document.body.style.filter;
    setTimeout(function () {
      if (alarmFlashEl) { alarmFlashEl.style.background = 'rgba(255,0,0,0)'; }
      if (document.body.style.filter === savedFilter) {
        document.body.style.filter = '';
      }
    }, 300);

    for (var i = 0; i < guards.length; i++) {
      guards[i].alerted = true;
      guards[i].alertTimer = 20;
    }
  }

  // ── Emergency Shutdown ─────────────────────────────────────────────────────

  function triggerShutdown() {
    if (shutdownTriggered) { return; }
    shutdownTriggered = true;
    uploadActive = false;
    if (uploadProgress > 0.74) { uploadProgress = 0.74; }

    shutdownLight = new THREE.PointLight(0xFF0000, 2, 20);
    shutdownLight.position.set(0, 5, 0);
    shutdownLight._cyberOwned = true;
    addOwned(shutdownLight);
    shutdownTimer = 0;

    // Dim all terminal screens
    for (var i = 0; i < terminals.length; i++) {
      for (var s = 0; s < terminals[i].screens.length; s++) {
        terminals[i].screens[s].material.color.setHex(0x111111);
        terminals[i].screens[s].material.emissive.setHex(0x000000);
      }
    }

    // Reset 2 hacked terminals
    var hackedIdx = [];
    for (var j = 0; j < terminals.length; j++) {
      if (terminals[j].hacked) { hackedIdx.push(j); }
    }
    rehackRequired = [];
    for (var k = 0; k < Math.min(2, hackedIdx.length); k++) {
      rehackRequired.push(hackedIdx[k]);
      terminals[hackedIdx[k]].hacked = false;
      terminals[hackedIdx[k]].hackProgress = 0;
    }
  }

  // ── Hacking ────────────────────────────────────────────────────────────────

  function startHack(idx) {
    if (terminals[idx].hacked) { return; }
    if (terminals[idx].disabled) { return; }
    if (terminals[idx].firewallActive) { return; }
    hackingTerminalIndex = idx;
    terminals[idx].hacking = true;
  }

  function abortHack(idx) {
    if (idx < 0 || idx >= terminals.length) { return; }
    var wasHacking = terminals[idx].hacking;
    terminals[idx].hacking = false;
    hackingTerminalIndex = -1;

    if (wasHacking && terminals[idx].hackProgress > 0 && terminals[idx].hackProgress < 1) {
      spawnFirewall(idx);
    }
  }

  function completeHack(idx) {
    terminals[idx].hacked = true;
    terminals[idx].hacking = false;
    terminals[idx].hackProgress = 1;
    hackingTerminalIndex = -1;

    for (var s = 0; s < terminals[idx].screens.length; s++) {
      terminals[idx].screens[s].material.color.setHex(0x00FF44);
      terminals[idx].screens[s].material.emissive.setHex(0x003311);
    }
    terminals[idx].indicator.material.color.setHex(0x00FF44);
    terminals[idx].indicator.material.emissive.setHex(0x003311);

    // First hack shows network viz
    var hackedCount = 0;
    for (var i = 0; i < terminals.length; i++) {
      if (terminals[i].hacked) { hackedCount++; }
    }
    if (hackedCount === 1) {
      buildNetworkViz();
    }
  }

  // ── Payloads ───────────────────────────────────────────────────────────────

  function usePayload() {
    var payload = PAYLOADS[currentPayloadIndex];

    if (payload === 'VIRUS') {
      for (var i = 0; i < terminals.length; i++) {
        if (!terminals[i].hacked && !terminals[i].disabled) {
          terminals[i].disabled = true;
          terminals[i].hacked = true;
          for (var s = 0; s < terminals[i].screens.length; s++) {
            terminals[i].screens[s].material.color.setHex(0xFF8800);
            terminals[i].screens[s].material.emissive.setHex(0x220800);
          }
          terminals[i].indicator.material.color.setHex(0xFF8800);
          dataScore += 200;
          break;
        }
      }
    } else if (payload === 'RANSOMWARE') {
      ransomwareActive = true;
      ransomwareTimer = 10;
      for (var g = 0; g < guards.length; g++) {
        guards[g].alerted = false;
        guards[g].alertTimer = 0;
      }
    } else if (payload === 'BACKDOOR') {
      backdoorRevealed = true;
      if (supplyCache) { supplyCache.visible = true; }
    }

    currentPayloadIndex = (currentPayloadIndex + 1) % PAYLOADS.length;
  }

  // ── Shooting ───────────────────────────────────────────────────────────────

  function handleShoot() {
    if (!camera) { return; }
    var dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    var raycaster = new THREE.Raycaster(camera.position.clone(), dir.normalize());
    var targets = [];
    for (var i = 0; i < terminals.length; i++) {
      if (terminals[i].firewallMesh) { targets.push(terminals[i].firewallMesh); }
    }
    var hits = raycaster.intersectObjects(targets);
    if (hits.length > 0) {
      var hitMesh = hits[0].object;
      for (var j = 0; j < terminals.length; j++) {
        if (terminals[j].firewallMesh === hitMesh) {
          terminals[j].firewallHits++;
          hitMesh.material.emissive.setHex(0xFF2200);
          if (terminals[j].firewallHits >= 5) {
            removeFirewall(j);
          }
          break;
        }
      }
    } else {
      var pp2 = playerPos();
      if (Math.abs(pp2.x) < 10 && Math.abs(pp2.z) < 10) {
        triggerAlarm();
      }
    }
  }

  // ── Input ──────────────────────────────────────────────────────────────────

  function onKeyDown(e) {
    keys[e.code] = true;

    var now = Date.now();

    if (e.code === 'KeyC') { cKeyTime = now; }
    if (e.code === 'KeyY') { yKeyTime = now; }

    // C+Y combo to activate
    if (e.code === 'KeyC' || e.code === 'KeyY') {
      if (cKeyTime > 0 && yKeyTime > 0 && Math.abs(cKeyTime - yKeyTime) <= COMBO_WINDOW) {
        if (!active) {
          init();
        }
      }
    }

    if (!active) { return; }

    if (e.code === 'KeyH') {
      if (nearTerminalIndex >= 0 && hackingTerminalIndex < 0) {
        startHack(nearTerminalIndex);
      }
    }

    if (e.code === 'KeyP') {
      usePayload();
    }

    if (e.code === 'KeyF') {
      handleShoot();
    }

    if (e.code === 'Tab') {
      e.preventDefault();
      currentPayloadIndex = (currentPayloadIndex + 1) % PAYLOADS.length;
    }
  }

  function onKeyUp(e) {
    keys[e.code] = false;
    if (!active) { return; }
    if (e.code === 'KeyH') {
      if (hackingTerminalIndex >= 0) {
        abortHack(hackingTerminalIndex);
      }
    }
  }

  // ── Update: Guards ─────────────────────────────────────────────────────────

  function updateGuards(dt) {
    if (ransomwareActive) { return; }
    var pp = playerPos();

    for (var i = 0; i < guards.length; i++) {
      var g = guards[i];
      if (g.hp <= 0) { continue; }

      if (g.alerted && g.alertTimer > 0) {
        g.alertTimer -= dt;
        var dx = pp.x - g.position.x;
        var dz = pp.z - g.position.z;
        var dl = Math.sqrt(dx * dx + dz * dz);
        if (dl > 0.5) {
          g.dir = Math.atan2(dz, dx);
          g.position.x += Math.cos(g.dir) * g.speed * dt;
          g.position.z += Math.sin(g.dir) * g.speed * dt;
          g.position.x = Math.max(-9, Math.min(9, g.position.x));
          g.position.z = Math.max(-9, Math.min(9, g.position.z));
        }
        if (g.alertTimer <= 0) {
          g.alerted = false;
        }
      } else {
        var ptx = g.patrolTarget.x - g.position.x;
        var ptz = g.patrolTarget.z - g.position.z;
        var ptl = Math.sqrt(ptx * ptx + ptz * ptz);
        if (ptl < 0.5) {
          var angle = Math.random() * Math.PI * 2;
          var r = 2 + Math.random() * 4;
          g.patrolTarget = {
            x: Math.max(-8, Math.min(8, g.position.x + Math.cos(angle) * r)),
            z: Math.max(-8, Math.min(8, g.position.z + Math.sin(angle) * r))
          };
        } else {
          g.dir = Math.atan2(ptz, ptx);
          g.position.x += Math.cos(g.dir) * (g.speed * 0.6) * dt;
          g.position.z += Math.sin(g.dir) * (g.speed * 0.6) * dt;
        }
      }

      g.body.position.set(g.position.x, 0.8, g.position.z);
      g.body.rotation.y = g.dir;
      g.head.position.set(g.position.x, 1.8, g.position.z);
      g.head.rotation.y = g.dir;
    }
  }

  // ── Update: Terminals ──────────────────────────────────────────────────────

  function updateTerminals(dt) {
    var pp = playerPos();
    nearTerminalIndex = -1;

    for (var i = 0; i < terminals.length; i++) {
      var t = terminals[i];
      if (t.hacked || t.disabled || t.firewallActive) { continue; }

      var d = distXZ(pp, t.position);
      if (d <= HACK_RANGE) {
        nearTerminalIndex = i;
      }

      if (t.hacking) {
        if (d > HACK_RANGE || !keys['KeyH']) {
          abortHack(i);
          continue;
        }

        t.hackProgress += dt / HACK_DURATION;
        if (t.hackProgress >= 1) {
          t.hackProgress = 1;
          completeHack(i);
          continue;
        }

        // Screen color lerp from red to green
        var col = lerpColor(0xFF0000, 0x00FF44, t.hackProgress);
        for (var s = 0; s < t.screens.length; s++) {
          t.screens[s].material.color.setHex(col);
        }
      }
    }

    if (hackingTerminalIndex >= 0 && terminals[hackingTerminalIndex].hacked) {
      hackingTerminalIndex = -1;
    }
  }

  // ── Update: Data Nodes ─────────────────────────────────────────────────────

  function updateDataNodes(dt) {
    var pp = playerPos();

    for (var i = 0; i < dataNodes.length; i++) {
      var dn = dataNodes[i];
      if (dn.collected) { continue; }

      dn.mesh.position.y = 1.5 + Math.sin(elapsed * 2 + dn.bobOffset) * 0.2;
      dn.mesh.rotation.y += dt * 1.5;

      if (dist3(pp, dn.mesh.position) < 0.9) {
        dn.collected = true;
        dn.mesh.visible = false;
        dataScore += 50;
      }
    }
  }

  // ── Update: Upload ─────────────────────────────────────────────────────────

  function updateUpload(dt) {
    var hackedCount = 0;
    for (var i = 0; i < terminals.length; i++) {
      if (terminals[i].hacked) { hackedCount++; }
    }
    if (hackedCount < 4) {
      uploadActive = false;
      return;
    }

    var pp = playerPos();
    var nearServer = dist3(pp, { x: 0, y: 2, z: 0 }) <= UPLOAD_RANGE + 2;

    if (nearServer && keys['KeyU'] && !shutdownTriggered) {
      uploadActive = true;
      uploadProgress += dt / UPLOAD_DURATION;
      if (uploadProgress > 1) { uploadProgress = 1; }

      if (uploadProgress >= 0.75 && !shutdownTriggered) {
        triggerShutdown();
      }
    } else {
      uploadActive = false;
    }
  }

  // ── Update: Shutdown Light Pulse ───────────────────────────────────────────

  function updateShutdown(dt) {
    if (!shutdownTriggered || !shutdownLight) { return; }
    shutdownTimer += dt;
    shutdownLight.intensity = 1.5 + Math.sin(shutdownTimer * 6) * 1.5;
  }

  // ── Update: Alarm ──────────────────────────────────────────────────────────

  function updateAlarm(dt) {
    if (!alarmActive) { return; }
    alarmTimer -= dt;
    if (alarmTimer <= 0) {
      alarmActive = false;
      if (alarmFlashEl) { alarmFlashEl.style.background = 'rgba(255,0,0,0)'; }
    }
  }

  // ── Update: Ransomware ─────────────────────────────────────────────────────

  function updateRansomware(dt) {
    if (!ransomwareActive) { return; }
    ransomwareTimer -= dt;
    if (ransomwareTimer <= 0) {
      ransomwareActive = false;
      ransomwareTimer = 0;
    }
  }

  // ── Update: Keycard ────────────────────────────────────────────────────────

  function updateKeycard() {
    if (keycardCollected || !keycard) { return; }
    var pp = playerPos();
    if (dist3(pp, keycard.position) < KEYCARD_RANGE) {
      keycardCollected = true;
      keycard.visible = false;
      if (mainDoor && !doorOpen) {
        doorOpen = true;
        mainDoor.visible = false;
      }
    }
    if (keycard.visible) {
      keycard.rotation.y += 0.02;
    }
  }

  // ── Update: Network Lines ──────────────────────────────────────────────────

  function updateNetworkLines(dt) {
    if (!networkLines || !networkShown) { return; }
    networkLines.material.opacity = 0.4 + Math.sin(elapsed * 3) * 0.3;
    for (var i = 0; i < networkNodeMeshes.length; i++) {
      networkNodeMeshes[i].rotation.y += dt * 0.8;
    }
  }

  // ── Update: Firewall Bosses ────────────────────────────────────────────────

  function updateFirewalls(dt) {
    for (var i = 0; i < terminals.length; i++) {
      var t = terminals[i];
      if (t.firewallMesh && t.firewallActive) {
        t.firewallMesh.rotation.y += dt * 1.2;
        t.firewallMesh.rotation.x += dt * 0.7;
        var pulse = 0.2 + Math.sin(elapsed * 8) * 0.2;
        t.firewallMesh.material.emissive.setRGB(pulse, 0, 0);
      }
    }
  }

  // ── Build All ──────────────────────────────────────────────────────────────

  function buildAll() {
    buildRoom();
    buildTerminals();
    buildDataNodes();
    buildCentralServer();
    buildInitialGuards();
    buildOfficeAndDoor();
    buildHUD();
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  function init(sceneRef, cameraRef, rendererRef) {
    if (active) { return; }

    scene = sceneRef || window.scene || null;
    camera = cameraRef || window.camera || null;
    renderer = rendererRef || window.renderer || null;

    if (!scene && window.GameState) {
      scene = window.GameState.scene || null;
      if (!camera) { camera = window.GameState.camera || null; }
    }

    if (!scene) { return; }

    active = true;
    elapsed = 0;
    uploadProgress = 0;
    uploadActive = false;
    shutdownTriggered = false;
    shutdownTimer = 0;
    alarmActive = false;
    ransomwareActive = false;
    ransomwareTimer = 0;
    backdoorRevealed = false;
    keycardCollected = false;
    doorOpen = false;
    networkShown = false;
    dataScore = 0;
    currentPayloadIndex = 0;
    nearTerminalIndex = -1;
    hackingTerminalIndex = -1;
    rehackRequired = [];
    terminals = [];
    dataNodes = [];
    guards = [];
    networkNodeMeshes = [];
    networkLines = null;
    roomWalls = [];
    ownedObjects = [];

    buildAll();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  function update(dt) {
    if (!active) { return; }
    if (!dt) { dt = 0.016; }

    elapsed += dt;

    updateTerminals(dt);
    updateDataNodes(dt);
    updateGuards(dt);
    updateUpload(dt);
    updateShutdown(dt);
    updateAlarm(dt);
    updateRansomware(dt);
    updateKeycard(dt);
    updateNetworkLines(dt);
    updateFirewalls(dt);
    updateHUD();
    updateMinimap();
  }

  // ── Reset ──────────────────────────────────────────────────────────────────

  function reset() {
    if (!active) { return; }

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);

    for (var i = 0; i < ownedObjects.length; i++) {
      if (scene) { scene.remove(ownedObjects[i]); }
      if (ownedObjects[i].geometry) { ownedObjects[i].geometry.dispose(); }
      if (ownedObjects[i].material) { ownedObjects[i].material.dispose(); }
    }
    ownedObjects = [];

    if (hudEl && hudEl.parentNode) { hudEl.parentNode.removeChild(hudEl); }
    hudEl = null;
    if (alarmFlashEl && alarmFlashEl.parentNode) { alarmFlashEl.parentNode.removeChild(alarmFlashEl); }
    alarmFlashEl = null;
    if (minimapEl && minimapEl.parentNode) { minimapEl.parentNode.removeChild(minimapEl); }
    minimapEl = null;

    document.body.style.filter = '';

    terminals = [];
    dataNodes = [];
    guards = [];
    networkNodeMeshes = [];
    networkLines = null;
    centralServer = null;
    mainDoor = null;
    keycard = null;
    supplyCache = null;
    officeRoom = null;
    shutdownLight = null;
    roomFloor = null;
    roomWalls = [];
    keys = {};
    rehackRequired = [];
    active = false;
    scene = null;
    camera = null;
    renderer = null;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    init: init,
    update: update,
    reset: reset
  };

}());
