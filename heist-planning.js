(function (window) {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    phase: 'PLANNING',          // PLANNING | EXECUTION | GETAWAY | COMPLETE
    planningTimer: 60,
    alarmTriggered: false,
    alarmTimer: 0,
    policeTimer: 90,
    policeArrived: false,
    bagsCollected: 0,
    totalBags: 5,
    crewActive: null,           // SAFECRACKER | HACKER | DRIVER
    hackerTimer: 0,
    camerasDisabled: false,
    alarmDisabledTimer: 0,
    alarmDisabled: false,
    dyePackTriggered: false,
    dyeExploded: false,
    entryRoute: null,           // FRONT | ROOF | VAULT
    entryPoints: [],
    minimapOpen: false,
    minimapCanvas: null,
    minimapCtx: null,
    score: 0,
    noAlarm: true,
    noCasualties: true,
    playerSpeed: 1.0,
    vaultDoorUnlocked: false,
    safecrackerActive: false,
    safecrackerTimer: 15,
    safecrackerTumblers: [0, 0, 0, 0],
    safecrackerTargets: [0, 0, 0, 0],
    safecrackerIndicators: [0, 0, 0, 0],
    getawayTimer: 60,
    vanReached: false,
    escaped: false,
    heldKeys: {},
    hKeyDown: false,
    pKeyDown: false,
    hpPressTime: 0,
    hpBothDown: false,
    scene: null,
    camera: null,
    renderer: null,
    player: null,
    playerMesh: null,
    bank: null,
    lobby: null,
    vaultRoom: null,
    securityDesks: [],
    cameras3d: [],
    guards: [],
    moneyBags: [],
    getawayVan: null,
    escapePoint: null,
    policeVehicles: [],
    drainpipe: null,
    tunnel: null,
    hudEl: null,
    minimapEl: null,
    animFrameId: null,
    lastTime: 0,
    tickAccum: 0,
    guardRadioTimer: 180,
    guardRadioDisrupted: false
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function pad2(n) {
    return (n < 10 ? '0' : '') + Math.floor(n);
  }

  function toMM_SS(s) {
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return pad2(m) + ':' + pad2(sec);
  }

  function makeBox(w, h, d, colorHex, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: colorHex });
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

  function dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  // ─── Scene Setup ──────────────────────────────────────────────────────────
  function initScene() {
    var THREE = window.THREE;
    if (!THREE) { console.warn('HeistPlanning: THREE.js not found'); return false; }

    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x111118);
    state.scene.fog = new THREE.Fog(0x111118, 40, 120);

    state.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    state.camera.position.set(0, 3, 20);
    state.camera.lookAt(0, 1, 0);

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.shadowMap.enabled = true;
    state.renderer.domElement.id = 'heist-canvas';
    state.renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:900;';
    document.body.appendChild(state.renderer.domElement);

    // Lights
    var ambient = new THREE.AmbientLight(0x404050, 0.6);
    state.scene.add(ambient);
    var dirLight = new THREE.DirectionalLight(0xffeedd, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    state.scene.add(dirLight);

    // Ground
    var ground = makeBox(200, 0.2, 200, 0x334433, 0, -0.1, 0);
    state.scene.add(ground);

    buildBank();
    buildCrew();
    buildGuards();
    buildMoneyBags();
    buildGetaway();
    buildEscapePoint();
    buildDrainpipe();
    buildTunnel();

    // Player mesh
    state.playerMesh = makeBox(0.6, 1.8, 0.6, 0x4488cc, 0, 0.9, 18);
    state.scene.add(state.playerMesh);
    state.player = { x: 0, y: 0.9, z: 18 };

    return true;
  }

  function buildBank() {
    // Main building
    state.bank = makeBox(30, 8, 25, 0x888877, 0, 4, 0);
    state.bank.castShadow = true;
    state.bank.receiveShadow = true;
    state.scene.add(state.bank);

    // Lobby (front interior visual)
    state.lobby = makeBox(12, 6, 15, 0x99998a, 0, 3, 3);
    state.scene.add(state.lobby);

    // Vault room (rear)
    state.vaultRoom = makeBox(8, 5, 8, 0x666655, 0, 2.5, -7.5);
    state.scene.add(state.vaultRoom);

    // Security desks (4)
    state.securityDesks = [];
    var deskPositions = [[-4, 0.5, 4], [4, 0.5, 4], [-4, 0.5, -2], [4, 0.5, -2]];
    for (var i = 0; i < deskPositions.length; i++) {
      var dp = deskPositions[i];
      var desk = makeBox(1.5, 1, 0.8, 0x776655, dp[0], dp[1], dp[2]);
      state.scene.add(desk);
      state.securityDesks.push({ mesh: desk, x: dp[0], z: dp[2], disabled: false });
    }

    // Security cameras on walls (3)
    state.cameras3d = [];
    var camData = [
      { x: -14.5, y: 6.5, z: 0, rx: 0, ry: Math.PI / 2 },
      { x: 14.5,  y: 6.5, z: 0, rx: 0, ry: -Math.PI / 2 },
      { x: 0,     y: 6.5, z: -12, rx: 0, ry: 0 }
    ];
    for (var j = 0; j < camData.length; j++) {
      var cd = camData[j];
      var camBody = makeCylinder(0.15, 0.15, 0.5, 0x333333, cd.x, cd.y, cd.z);
      camBody.rotation.z = Math.PI / 2;
      state.scene.add(camBody);
      var camLens = makeBox(0.2, 0.2, 0.3, 0x111111, cd.x, cd.y, cd.z);
      state.scene.add(camLens);
      state.cameras3d.push({ body: camBody, lens: camLens, x: cd.x, y: cd.y, z: cd.z });
    }
  }

  function buildCrew() {
    // Crew members placed near front of bank (inactive placeholders)
    var safecrackerMesh = makeBox(0.6, 1.8, 0.6, 0xccaa33, -3, 0.9, 14);
    state.scene.add(safecrackerMesh);
    var hackerMesh = makeBox(0.6, 1.8, 0.6, 0x33ccaa, 0, 0.9, 14);
    state.scene.add(hackerMesh);
    var driverMesh = makeBox(0.6, 1.8, 0.6, 0xcc3333, 3, 0.9, 14);
    state.scene.add(driverMesh);
    state._safecrackerMesh = safecrackerMesh;
    this._hackerMesh = hackerMesh;
    state._driverMesh = driverMesh;
  }

  function buildGuards() {
    state.guards = [];
    var guardPositions = [
      [5, 0.9, 5], [-5, 0.9, 5], [0, 0.9, -2],
      [6, 0.9, -4], [-6, 0.9, -4], [3, 0.9, -8],
      [-3, 0.9, -8], [0, 0.9, 7]
    ];
    var patrolOffsets = [
      [[5, 5], [-5, 5]], [[-5, 5], [5, 5]],
      [[0, -2], [0, 4]], [[6, -4], [6, 4]],
      [[-6, -4], [-6, 4]], [[3, -8], [-3, -8]],
      [[-3, -8], [3, -8]], [[0, 7], [0, 2]]
    ];
    for (var i = 0; i < guardPositions.length; i++) {
      var gp = guardPositions[i];
      var mesh = makeBox(0.6, 1.8, 0.6, 0xaa3311, gp[0], gp[1], gp[2]);
      state.scene.add(mesh);
      state.guards.push({
        mesh: mesh,
        x: gp[0], z: gp[2],
        patrolA: patrolOffsets[i][0],
        patrolB: patrolOffsets[i][1],
        patrolT: 0,
        patrolDir: 1,
        alerted: false,
        neutralised: false
      });
    }
  }

  function buildMoneyBags() {
    state.moneyBags = [];
    var bagPositions = [[-2, 0.4, -7], [-1, 0.4, -8], [0, 0.4, -7.5], [1, 0.4, -8], [2, 0.4, -7]];
    for (var i = 0; i < bagPositions.length; i++) {
      var bp = bagPositions[i];
      var mesh = makeBox(0.5, 0.8, 0.5, 0x228B22, bp[0], bp[1], bp[2]);
      state.scene.add(mesh);
      state.moneyBags.push({ mesh: mesh, x: bp[0], z: bp[2], collected: false, dyed: false });
    }
  }

  function buildGetaway() {
    // Getaway van (0x333333)
    state.getawayVan = makeBox(2.2, 1.6, 4.5, 0x333333, 18, 0.8, 20);
    state.scene.add(state.getawayVan);
  }

  function buildEscapePoint() {
    // Escape point 50 units away, green (0x00FF44)
    state.escapePoint = makeBox(3, 0.3, 3, 0x00FF44, 50, 0.15, 50);
    state.scene.add(state.escapePoint);
  }

  function buildDrainpipe() {
    // Drainpipe on exterior wall for roof entry
    state.drainpipe = makeCylinder(0.2, 0.2, 10, 0x555555, -15, 5, 5);
    state.scene.add(state.drainpipe);
  }

  function buildTunnel() {
    // Underground tunnel for vault entry (adjacent building side)
    state.tunnel = makeBox(20, 2, 2, 0x443322, -20, -0.5, -8);
    state.scene.add(state.tunnel);
  }

  // ─── Minimap ──────────────────────────────────────────────────────────────
  function openMinimap() {
    if (state.minimapOpen) { closeMinimap(); return; }
    state.minimapOpen = true;

    var el = document.createElement('div');
    el.id = 'heist-minimap-panel';
    el.style.cssText = [
      'position:fixed', 'top:50px', 'left:50px',
      'width:250px', 'height:250px', 'background:#111',
      'border:2px solid #88ff88', 'z-index:1100',
      'cursor:crosshair'
    ].join(';');

    var canvas = document.createElement('canvas');
    canvas.width = 250;
    canvas.height = 250;
    canvas.style.display = 'block';
    el.appendChild(canvas);

    var label = document.createElement('div');
    label.textContent = 'OVERHEAD MAP — Click to mark entry (E)';
    label.style.cssText = 'color:#88ff88;font:10px monospace;padding:2px 4px;';
    el.appendChild(label);

    document.body.appendChild(el);
    state.minimapEl = el;
    state.minimapCanvas = canvas;
    state.minimapCtx = canvas.getContext('2d');

    canvas.addEventListener('click', onMinimapClick);
    drawMinimap();
  }

  function closeMinimap() {
    state.minimapOpen = false;
    if (state.minimapEl) {
      if (state.minimapCanvas) {
        state.minimapCanvas.removeEventListener('click', onMinimapClick);
      }
      document.body.removeChild(state.minimapEl);
      state.minimapEl = null;
      state.minimapCanvas = null;
      state.minimapCtx = null;
    }
  }

  function worldToMap(wx, wz) {
    // World range roughly -40..40 → map 0..250
    var mx = (wx + 40) / 80 * 250;
    var mz = (wz + 40) / 80 * 250;
    return { x: Math.round(mx), y: Math.round(mz) };
  }

  function drawMinimap() {
    if (!state.minimapCtx) return;
    var ctx = state.minimapCtx;
    ctx.clearRect(0, 0, 250, 250);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 250, 250);

    // Bank outline
    ctx.fillStyle = '#888877';
    var bMin = worldToMap(-15, -12.5);
    var bMax = worldToMap(15, 12.5);
    ctx.fillRect(bMin.x, bMin.y, bMax.x - bMin.x, bMax.y - bMin.y);

    // Vault room
    ctx.fillStyle = '#555544';
    var vMin = worldToMap(-4, -11.5);
    var vMax = worldToMap(4, -3.5);
    ctx.fillRect(vMin.x, vMin.y, vMax.x - vMin.x, vMax.y - vMin.y);

    // Getaway van
    ctx.fillStyle = '#333333';
    var van = worldToMap(18, 20);
    ctx.fillRect(van.x - 5, van.y - 5, 10, 10);

    // Escape point
    ctx.fillStyle = '#00ff44';
    var esc = worldToMap(50, 50);
    ctx.fillRect(esc.x - 5, esc.y - 5, 10, 10);

    // Guards
    ctx.fillStyle = '#aa3311';
    for (var i = 0; i < state.guards.length; i++) {
      var g = state.guards[i];
      if (g.neutralised) continue;
      var gp = worldToMap(g.x, g.z);
      ctx.fillRect(gp.x - 3, gp.y - 3, 6, 6);
    }

    // Money bags
    ctx.fillStyle = '#228b22';
    for (var j = 0; j < state.moneyBags.length; j++) {
      var b = state.moneyBags[j];
      if (b.collected) continue;
      var bp2 = worldToMap(b.x, b.z);
      ctx.fillRect(bp2.x - 3, bp2.y - 3, 6, 6);
    }

    // Player
    ctx.fillStyle = '#4488cc';
    var pp = worldToMap(state.player.x, state.player.z);
    ctx.beginPath();
    ctx.arc(pp.x, pp.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Entry points
    ctx.fillStyle = '#ffff00';
    for (var k = 0; k < state.entryPoints.length; k++) {
      var ep = state.entryPoints[k];
      ctx.beginPath();
      ctx.arc(ep.mx, ep.my, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#ffff00';
      ctx.font = '8px monospace';
      ctx.fillText('E', ep.mx + 5, ep.my + 3);
    }
  }

  function onMinimapClick(e) {
    var rect = state.minimapCanvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    // Convert back to world
    var wx = (mx / 250) * 80 - 40;
    var wz = (my / 250) * 80 - 40;
    state.entryPoints.push({ mx: mx, my: my, wx: wx, wz: wz });
    drawMinimap();
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────
  function createHUD() {
    var el = document.createElement('div');
    el.id = 'heist-hud';
    el.style.cssText = [
      'position:fixed', 'bottom:0', 'left:0', 'right:0',
      'background:rgba(0,0,0,0.75)', 'color:#00ff88',
      'font:13px monospace', 'padding:6px 12px',
      'z-index:1000', 'letter-spacing:0.05em',
      'border-top:1px solid #00ff88'
    ].join(';');
    document.body.appendChild(el);
    state.hudEl = el;
    updateHUD();
  }

  function updateHUD() {
    if (!state.hudEl) return;
    var crewStr = state.crewActive ? state.crewActive + (state.crewActive === 'HACKER' ? ' ACTIVE' : ' ACTIVE') : 'NONE';
    var alarmStr = state.alarmTriggered ? 'ON' : (state.alarmDisabled ? 'DISABLED(' + Math.ceil(state.alarmDisabledTimer) + 's)' : 'OFF');
    var policeStr = '';
    if (state.alarmTriggered && !state.policeArrived) {
      policeStr = ' | POLICE IN: ' + toMM_SS(state.policeTimer);
    } else if (state.policeArrived) {
      policeStr = ' | POLICE ARRIVED';
    }
    var phaseStr = state.phase;
    var hackerStr = (state.crewActive === 'HACKER' && state.hackerTimer > 0)
      ? ' CAM-DISABLED(' + Math.ceil(state.hackerTimer) + 's)' : '';

    state.hudEl.textContent =
      'HEIST [PHASE: ' + phaseStr + '] ' +
      '[BAGS: ' + state.bagsCollected + '/' + state.totalBags + '] ' +
      '[CREW: ' + crewStr + ']' + hackerStr + ' ' +
      '[ALARM: ' + alarmStr + ']' + policeStr;

    if (state.phase === 'PLANNING') {
      state.hudEl.textContent += ' | PLAN TIME: ' + toMM_SS(state.planningTimer) +
        ' | M=MAP E=ENTRY ENTER=START';
    } else if (state.phase === 'GETAWAY') {
      state.hudEl.textContent += ' | GETAWAY: ' + toMM_SS(state.getawayTimer);
    }
  }

  function removeHUD() {
    if (state.hudEl) {
      document.body.removeChild(state.hudEl);
      state.hudEl = null;
    }
  }

  // ─── Safecracker Mini-game ────────────────────────────────────────────────
  function startSafecrackerGame() {
    state.safecrackerActive = true;
    state.safecrackerTimer = 15;
    for (var i = 0; i < 4; i++) {
      state.safecrackerTargets[i] = Math.floor(Math.random() * 100);
      state.safecrackerIndicators[i] = 0;
      state.safecrackerTumblers[i] = 0;
    }
    var el = document.createElement('div');
    el.id = 'heist-safecracker';
    el.style.cssText = [
      'position:fixed', 'top:100px', 'left:50%',
      'transform:translateX(-50%)',
      'width:360px', 'background:#111', 'border:2px solid #ffaa00',
      'color:#ffaa00', 'font:14px monospace', 'padding:12px',
      'z-index:1200', 'text-align:center'
    ].join(';');
    el.innerHTML = '<div style="margin-bottom:8px">SAFECRACKER: Press 1-4 when indicator aligns</div>' +
      '<div id="sc-timer">Time: 15s</div>' +
      '<div id="sc-tumblers" style="margin-top:8px"></div>';
    document.body.appendChild(el);
    state._safecrackerEl = el;
    updateSafecrackerUI();
  }

  function updateSafecrackerUI() {
    var el = document.getElementById('sc-timer');
    if (el) el.textContent = 'Time: ' + Math.ceil(state.safecrackerTimer) + 's';
    var tb = document.getElementById('sc-tumblers');
    if (!tb) return;
    var html = '';
    for (var i = 0; i < 4; i++) {
      var ind = Math.floor(state.safecrackerIndicators[i]);
      var tgt = state.safecrackerTargets[i];
      var locked = state.safecrackerTumblers[i] === 1;
      var bar = '';
      for (var p = 0; p < 10; p++) {
        var mapVal = Math.floor(p * 10);
        var isInd = (Math.abs(ind - mapVal) < 10);
        var isTgt = (Math.abs(tgt - mapVal) < 10);
        if (locked) { bar += '<span style="color:#00ff00">■</span>'; }
        else if (isInd && isTgt) { bar += '<span style="color:#ffffff">■</span>'; }
        else if (isInd) { bar += '<span style="color:#ffff00">■</span>'; }
        else if (isTgt) { bar += '<span style="color:#ff4400">□</span>'; }
        else { bar += '<span style="color:#333">─</span>'; }
      }
      html += '<div>T' + (i + 1) + ': [' + bar + '] ' + (locked ? 'LOCKED' : 'Press ' + (i + 1)) + '</div>';
    }
    tb.innerHTML = html;
  }

  function safecrackerPress(num) {
    if (!state.safecrackerActive) return;
    var idx = num - 1;
    if (idx < 0 || idx > 3) return;
    if (state.safecrackerTumblers[idx] === 1) return;
    var ind = state.safecrackerIndicators[idx];
    var tgt = state.safecrackerTargets[idx];
    if (Math.abs(ind - tgt) < 12) {
      state.safecrackerTumblers[idx] = 1;
    }
    var allLocked = true;
    for (var i = 0; i < 4; i++) {
      if (state.safecrackerTumblers[i] !== 1) { allLocked = false; break; }
    }
    if (allLocked) {
      completeSafecrackerGame(true);
    }
    updateSafecrackerUI();
  }

  function completeSafecrackerGame(success) {
    state.safecrackerActive = false;
    if (state._safecrackerEl) {
      document.body.removeChild(state._safecrackerEl);
      state._safecrackerEl = null;
    }
    if (success) {
      state.vaultDoorUnlocked = true;
    }
  }

  // ─── Guards ────────────────────────────────────────────────────────────────
  function updateGuards(dt) {
    if (state.phase === 'PLANNING') return;
    for (var i = 0; i < state.guards.length; i++) {
      var g = state.guards[i];
      if (g.neutralised || g.alerted) continue;
      g.patrolT += dt * 0.4 * g.patrolDir;
      if (g.patrolT >= 1) { g.patrolT = 1; g.patrolDir = -1; }
      if (g.patrolT <= 0) { g.patrolT = 0; g.patrolDir = 1; }
      var ax = g.patrolA[0], az = g.patrolA[1];
      var bx = g.patrolB[0], bz = g.patrolB[1];
      g.x = ax + (bx - ax) * g.patrolT;
      g.z = az + (bz - az) * g.patrolT;
      g.mesh.position.x = g.x;
      g.mesh.position.z = g.z;

      // Detect player proximity
      var pd = dist2D(state.player.x, state.player.z, g.x, g.z);
      if (pd < 3 && !state.alarmDisabled && !state.alarmTriggered) {
        triggerAlarm('GUARD SPOTTED PLAYER');
      }
    }
  }

  function updateGuardRadio(dt) {
    if (state.guardRadioDisrupted) return;
    state.guardRadioTimer -= dt;
    if (state.guardRadioTimer <= 0) {
      state.guardRadioTimer = 180;
      // Guards radio in — if alarm not triggered and player in bank, heightened alert
      if (state.phase === 'EXECUTION') {
        var inBank = (Math.abs(state.player.x) < 15 && Math.abs(state.player.z) < 12.5);
        if (inBank && !state.alarmTriggered) {
          triggerAlarm('GUARD RADIO CHECK FAILED');
        }
      }
    }
  }

  // ─── Alarm ────────────────────────────────────────────────────────────────
  function triggerAlarm(reason) {
    if (state.alarmTriggered || state.alarmDisabled) return;
    state.alarmTriggered = true;
    state.noAlarm = false;
    state.policeTimer = 90;
    if (state.hudEl) state.hudEl.style.color = '#ff3300';
    // Mark money bags with dye
    for (var i = 0; i < state.moneyBags.length; i++) {
      state.moneyBags[i].dyed = true;
      state.moneyBags[i].mesh.material.color.setHex(0xff2200);
    }
    // Dye pack: 2 of 5 explode red dye on player view
    state._dyeExplodeCount = 0;
    state._dyePending = true;
  }

  function handleDyePack(dt) {
    if (!state._dyePending) return;
    if (state.bagsCollected >= 2) {
      state._dyePending = false;
      applyDyeExplosion();
    }
  }

  function applyDyeExplosion() {
    var overlay = document.createElement('div');
    overlay.id = 'heist-dye-overlay';
    overlay.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'background:rgba(200,0,0,0.6)', 'z-index:1500',
      'pointer-events:none', 'transition:opacity 3s'
    ].join(';');
    document.body.appendChild(overlay);
    setTimeout(function () {
      overlay.style.opacity = '0';
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 3000);
    }, 100);
  }

  // ─── Police ───────────────────────────────────────────────────────────────
  function spawnPolice() {
    state.policeArrived = true;
    var policeColors = [0x2244CC, 0x2244CC, 0x2244CC];
    var spawnPositions = [[25, 0.8, 25], [22, 0.8, 20], [28, 0.8, 22]];
    for (var i = 0; i < policeColors.length; i++) {
      var pv = makeBox(2.2, 1.4, 4, policeColors[i], spawnPositions[i][0], spawnPositions[i][1], spawnPositions[i][2]);
      state.scene.add(pv);
      state.policeVehicles.push(pv);
    }
    // 6 officers
    var officerPositions = [
      [23, 0.9, 23], [24, 0.9, 21], [26, 0.9, 24],
      [27, 0.9, 22], [22, 0.9, 25], [28, 0.9, 20]
    ];
    for (var j = 0; j < officerPositions.length; j++) {
      var op = officerPositions[j];
      var omesh = makeBox(0.6, 1.8, 0.6, 0x2244CC, op[0], op[1], op[2]);
      state.scene.add(omesh);
      state.guards.push({
        mesh: omesh,
        x: op[0], z: op[2],
        patrolA: [op[0], op[2]],
        patrolB: [op[0] - 4, op[2] - 4],
        patrolT: 0, patrolDir: 1,
        alerted: true, neutralised: false, isOfficer: true
      });
    }
  }

  // ─── Player Movement ──────────────────────────────────────────────────────
  function updatePlayer(dt) {
    var speed = 5.0 * state.playerSpeed;
    var moved = false;
    if (state.heldKeys['KeyW'] || state.heldKeys['ArrowUp']) {
      state.player.z -= speed * dt; moved = true;
    }
    if (state.heldKeys['KeyS'] || state.heldKeys['ArrowDown']) {
      state.player.z += speed * dt; moved = true;
    }
    if (state.heldKeys['KeyA'] || state.heldKeys['ArrowLeft']) {
      state.player.x -= speed * dt; moved = true;
    }
    if (state.heldKeys['KeyD'] || state.heldKeys['ArrowRight']) {
      state.player.x += speed * dt; moved = true;
    }

    if (state.playerMesh) {
      state.playerMesh.position.x = state.player.x;
      state.playerMesh.position.z = state.player.z;
    }

    // Camera follow
    if (state.camera) {
      state.camera.position.x = state.player.x;
      state.camera.position.z = state.player.z + 18;
      state.camera.lookAt(state.player.x, 1, state.player.z);
    }

    // Bag pickup
    for (var i = 0; i < state.moneyBags.length; i++) {
      var bag = state.moneyBags[i];
      if (bag.collected) continue;
      if (dist2D(state.player.x, state.player.z, bag.x, bag.z) < 1.5) {
        bag.collected = true;
        bag.mesh.visible = false;
        state.bagsCollected++;
        // Weight penalty
        if (state.bagsCollected === 4) state.playerSpeed = 0.8;
        if (state.bagsCollected === 5) state.playerSpeed = 0.6;
      }
    }

    // Security desk interaction (E key handled in onKeyDown)

    // Van proximity
    if (state.phase === 'GETAWAY' || state.phase === 'EXECUTION') {
      var vanDist = dist2D(state.player.x, state.player.z, 18, 20);
      if (vanDist < 3 && state.phase === 'EXECUTION' && state.alarmTriggered) {
        state.phase = 'GETAWAY';
        state.getawayTimer = 60;
      }
    }

    // Escape point
    if (state.phase === 'GETAWAY') {
      var escDist = dist2D(state.player.x, state.player.z, 50, 50);
      if (escDist < 4) {
        completeHeist();
      }
    }

    // Drainpipe / Roof route
    if (state.entryRoute === 'ROOF') {
      var pipeDist = dist2D(state.player.x, state.player.z, -15, 5);
      if (pipeDist < 2 && state.player.y < 8) {
        state.player.y = Math.min(state.player.y + speed * dt, 8);
        if (state.playerMesh) state.playerMesh.position.y = state.player.y + 0.9;
      }
    }

    // Tunnel route
    if (state.entryRoute === 'VAULT') {
      var tunnelDist = dist2D(state.player.x, state.player.z, -20, -8);
      if (tunnelDist < 3) {
        // Teleport into vault area
        state.player.x = 0;
        state.player.z = -7;
        if (state.playerMesh) {
          state.playerMesh.position.x = state.player.x;
          state.playerMesh.position.z = state.player.z;
        }
      }
    }
  }

  // ─── Entry Route Selection ─────────────────────────────────────────────────
  function selectEntryRoute() {
    // Determine route by entry points placed on minimap
    // Default: FRONT; near drainpipe = ROOF; near tunnel = VAULT
    if (state.entryPoints.length === 0) {
      state.entryRoute = 'FRONT';
      return;
    }
    var last = state.entryPoints[state.entryPoints.length - 1];
    var dx = last.wx - (-15);
    var dz = last.wz - 5;
    var drainDist = Math.sqrt(dx * dx + dz * dz);
    var tx = last.wx - (-20);
    var tz = last.wz - (-8);
    var tunnelDist = Math.sqrt(tx * tx + tz * tz);
    if (drainDist < 8) {
      state.entryRoute = 'ROOF';
    } else if (tunnelDist < 8) {
      state.entryRoute = 'VAULT';
    } else {
      state.entryRoute = 'FRONT';
    }
  }

  // ─── Crew Actions ─────────────────────────────────────────────────────────
  function activateCrew(num) {
    if (num === 1) {
      state.crewActive = 'SAFECRACKER';
      if (!state.vaultDoorUnlocked && !state.safecrackerActive) {
        startSafecrackerGame();
      }
    } else if (num === 2) {
      state.crewActive = 'HACKER';
      state.camerasDisabled = true;
      state.hackerTimer = 90;
      for (var i = 0; i < state.cameras3d.length; i++) {
        state.cameras3d[i].lens.material.color.setHex(0x004400);
      }
    } else if (num === 3) {
      state.crewActive = 'DRIVER';
      // Driver stays in van — already positioned
    }
  }

  // ─── Timers / Phase Logic ──────────────────────────────────────────────────
  function updatePhaseLogic(dt) {
    if (state.phase === 'PLANNING') {
      state.planningTimer -= dt;
      if (state.planningTimer <= 0) {
        startExecution();
      }
    }

    if (state.phase === 'EXECUTION') {
      // Hacker timer
      if (state.crewActive === 'HACKER' && state.hackerTimer > 0) {
        state.hackerTimer -= dt;
        if (state.hackerTimer <= 0) {
          state.camerasDisabled = false;
          state.hackerTimer = 0;
          for (var i = 0; i < state.cameras3d.length; i++) {
            state.cameras3d[i].lens.material.color.setHex(0x111111);
          }
        }
      }

      // Alarm disabled timer
      if (state.alarmDisabled && state.alarmDisabledTimer > 0) {
        state.alarmDisabledTimer -= dt;
        if (state.alarmDisabledTimer <= 0) {
          state.alarmDisabled = false;
        }
      }

      // Police arrival
      if (state.alarmTriggered && !state.policeArrived) {
        state.policeTimer -= dt;
        if (state.policeTimer <= 0) {
          spawnPolice();
        }
      }

      // Safecracker timer
      if (state.safecrackerActive) {
        state.safecrackerTimer -= dt;
        // Advance indicators
        for (var j = 0; j < 4; j++) {
          if (state.safecrackerTumblers[j] !== 1) {
            state.safecrackerIndicators[j] = (state.safecrackerIndicators[j] + dt * 20) % 100;
          }
        }
        if (state.safecrackerTimer <= 0) {
          completeSafecrackerGame(false);
        } else {
          updateSafecrackerUI();
        }
      }

      // Dye pack
      handleDyePack(dt);
    }

    if (state.phase === 'GETAWAY') {
      state.getawayTimer -= dt;
      if (state.getawayTimer <= 0) {
        endHeist(false, 'OUT OF TIME');
      }
    }
  }

  function startExecution() {
    state.phase = 'EXECUTION';
    selectEntryRoute();
    closeMinimap();
  }

  function completeHeist() {
    state.phase = 'COMPLETE';
    state.escaped = true;
    var bonus = 0;
    if (state.noAlarm) bonus += state.score * 1; // 2x multiplier applied below
    if (state.bagsCollected === 5) bonus += 500;
    if (state.noCasualties) bonus += 300;
    state.score = state.bagsCollected * 200;
    if (state.noAlarm) state.score *= 2;
    state.score += bonus;
    showEndScreen(true);
  }

  function endHeist(success, reason) {
    state.phase = 'COMPLETE';
    showEndScreen(success, reason);
  }

  function showEndScreen(success, reason) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'background:#111', 'border:2px solid ' + (success ? '#00ff88' : '#ff3300'),
      'color:' + (success ? '#00ff88' : '#ff3300'),
      'font:16px monospace', 'padding:24px 32px',
      'z-index:2000', 'text-align:center', 'min-width:320px'
    ].join(';');
    var msg = success ? 'HEIST COMPLETE' : 'HEIST FAILED';
    if (reason) msg += '\n' + reason;
    el.innerHTML = '<div style="font-size:20px;margin-bottom:12px">' + msg + '</div>' +
      '<div>Bags: ' + state.bagsCollected + '/' + state.totalBags + '</div>' +
      '<div>Score: ' + state.score + '</div>' +
      '<div style="margin-top:8px">' +
        (state.noAlarm ? '[CLEAN HEIST 2x] ' : '') +
        (state.bagsCollected === 5 ? '[ALL BAGS +500] ' : '') +
        (state.noCasualties ? '[NO CASUALTIES +300]' : '') +
      '</div>' +
      '<div style="margin-top:16px;font-size:12px">Press H+P to exit</div>';
    document.body.appendChild(el);
    state._endEl = el;
  }

  // ─── Input ────────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    if (!state.active) return;
    state.heldKeys[e.code] = true;

    // H+P activation tracking
    if (e.code === 'KeyH') state.hKeyDown = true;
    if (e.code === 'KeyP') state.pKeyDown = true;

    if (state.safecrackerActive) {
      if (e.code === 'Digit1') safecrackerPress(1);
      if (e.code === 'Digit2') safecrackerPress(2);
      if (e.code === 'Digit3') safecrackerPress(3);
      if (e.code === 'Digit4') safecrackerPress(4);
      return;
    }

    // M = minimap (planning phase)
    if (e.code === 'KeyM' && state.phase === 'PLANNING') {
      openMinimap();
      return;
    }

    // ENTER = start heist from planning
    if (e.code === 'Enter' && state.phase === 'PLANNING') {
      state.planningTimer = 0;
      startExecution();
      return;
    }

    // Crew selection 1-3
    if (e.code === 'Digit1') activateCrew(1);
    if (e.code === 'Digit2') activateCrew(2);
    if (e.code === 'Digit3') activateCrew(3);

    // E = interact (security desk)
    if (e.code === 'KeyE' && state.phase === 'EXECUTION') {
      for (var i = 0; i < state.securityDesks.length; i++) {
        var desk = state.securityDesks[i];
        if (dist2D(state.player.x, state.player.z, desk.x, desk.z) < 2.5) {
          desk.disabled = true;
          state.alarmDisabled = true;
          state.alarmDisabledTimer = 60;
          state.guardRadioDisrupted = true;
          setTimeout(function () { state.guardRadioDisrupted = false; }, 60000);
          break;
        }
      }
    }
  }

  function onKeyUp(e) {
    state.heldKeys[e.code] = false;
    if (e.code === 'KeyH') state.hKeyDown = false;
    if (e.code === 'KeyP') state.pKeyDown = false;
  }

  function onResize() {
    if (!state.active || !state.camera || !state.renderer) return;
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ─── Animate / Tick ───────────────────────────────────────────────────────
  function animate(now) {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(animate);
    var dt = Math.min((now - state.lastTime) / 1000, 0.05);
    state.lastTime = now;
    if (dt <= 0) { state.renderer.render(state.scene, state.camera); return; }

    updatePhaseLogic(dt);
    if (state.phase !== 'PLANNING' && state.phase !== 'COMPLETE') {
      updatePlayer(dt);
      updateGuards(dt);
      updateGuardRadio(dt);
    }
    updateHUD();
    if (state.minimapOpen) drawMinimap();

    state.renderer.render(state.scene, state.camera);
  }

  // ─── Activate / Deactivate ────────────────────────────────────────────────
  function activate() {
    if (state.active) return;
    if (!window.THREE) { console.warn('HeistPlanning requires THREE.js'); return; }
    state.active = true;
    state.phase = 'PLANNING';
    state.planningTimer = 60;
    state.alarmTriggered = false;
    state.alarmTimer = 0;
    state.policeTimer = 90;
    state.policeArrived = false;
    state.bagsCollected = 0;
    state.crewActive = null;
    state.hackerTimer = 0;
    state.camerasDisabled = false;
    state.alarmDisabledTimer = 0;
    state.alarmDisabled = false;
    state.dyePackTriggered = false;
    state.entryPoints = [];
    state.minimapOpen = false;
    state.score = 0;
    state.noAlarm = true;
    state.noCasualties = true;
    state.playerSpeed = 1.0;
    state.vaultDoorUnlocked = false;
    state.safecrackerActive = false;
    state.getawayTimer = 60;
    state.escaped = false;
    state.guardRadioTimer = 180;
    state.guardRadioDisrupted = false;
    state._dyePending = false;
    state._dyeExplodeCount = 0;
    state.heldKeys = {};
    state.hKeyDown = false;
    state.pKeyDown = false;

    if (!initScene()) {
      state.active = false;
      return;
    }
    createHUD();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);
    state.lastTime = performance.now();
    state.animFrameId = requestAnimationFrame(animate);
  }

  function deactivate() {
    if (!state.active) return;
    state.active = false;
    if (state.animFrameId) { cancelAnimationFrame(state.animFrameId); state.animFrameId = null; }
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', onResize);
    if (state.renderer && state.renderer.domElement && state.renderer.domElement.parentNode) {
      state.renderer.domElement.parentNode.removeChild(state.renderer.domElement);
    }
    if (state.renderer) { state.renderer.dispose(); state.renderer = null; }
    state.scene = null;
    state.camera = null;
    removeHUD();
    closeMinimap();
    if (state._endEl && state._endEl.parentNode) { state._endEl.parentNode.removeChild(state._endEl); state._endEl = null; }
    if (state._safecrackerEl && state._safecrackerEl.parentNode) { state._safecrackerEl.parentNode.removeChild(state._safecrackerEl); state._safecrackerEl = null; }
  }

  // ─── H+P Simultaneous Activation (400ms) ──────────────────────────────────
  function globalKeyDown(e) {
    if (e.code === 'KeyH') {
      state.hKeyDown = true;
      if (state.pKeyDown) { checkHPCombo(); }
      else { state.hpPressTime = performance.now(); }
    }
    if (e.code === 'KeyP') {
      state.pKeyDown = true;
      if (state.hKeyDown) { checkHPCombo(); }
      else { state.hpPressTime = performance.now(); }
    }
  }

  function globalKeyUp(e) {
    if (e.code === 'KeyH') state.hKeyDown = false;
    if (e.code === 'KeyP') state.pKeyDown = false;
  }

  function checkHPCombo() {
    var now = performance.now();
    if (state.hKeyDown && state.pKeyDown) {
      if (Math.abs(now - state.hpPressTime) <= 400) {
        if (state.active) {
          deactivate();
        } else {
          activate();
        }
        state.hKeyDown = false;
        state.pKeyDown = false;
      }
    }
  }

  window.addEventListener('keydown', globalKeyDown);
  window.addEventListener('keyup', globalKeyUp);

  // ─── Public API ───────────────────────────────────────────────────────────
  window.HeistPlanning = {
    activate: activate,
    deactivate: deactivate,
    getState: function () { return state; }
  };

}(window));
