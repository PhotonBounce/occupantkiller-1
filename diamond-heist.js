window.DiamondHeist = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // ─── State ──────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    // activation keys (D + H simultaneous within 400ms)
    dDown: false,
    hDown: false,
    dDownTime: 0,
    hDownTime: 0,
    // scene
    scene: null,
    camera: null,
    renderer: null,
    animFrameId: null,
    lastTime: 0,
    canvas: null,
    // player
    playerPos: { x: 0, y: 1, z: 18 },
    playerYaw: 0,
    playerPitch: 0,
    playerVelX: 0,
    playerVelZ: 0,
    moveKeys: {},
    pointerLocked: false,
    playerHP: 100,
    // phase: 1=Infiltrate, 2=Bypass Security, 3=Crack Vault, 4=Escape
    phase: 1,
    phaseNames: ['', 'INFILTRATE', 'BYPASS SECURITY', 'CRACK VAULT', 'ESCAPE'],
    // disguise
    disguised: false,
    disguiseMesh: null,
    disguiseAvailable: false,
    // alarms
    alarmActive: false,
    alarmTimer: 0,
    ghostRating: true,
    // diamonds
    diamonds: [],
    diamondsCollected: 0,
    totalDiamonds: 50,
    // score
    score: 0,
    // camera looping
    camerasFrozen: false,
    cameraFreezeTimer: 0,
    cameraLoopProgress: 0,
    cameraLoopHolding: false,
    // laser grid
    lasersActive: true,
    laserOffTimer: 0,
    motionSensors: [],
    motionSensorsShot: 0,
    laserLines: null,
    // guard patrol timing
    guardPatrolTimer: 0,
    guardInCorridor: false,
    guardCorridorTimer: 0,
    // vault cracking minigame
    vaultLocked: true,
    vaultCrackStage: 0,
    vaultCrackActive: false,
    vaultCrackCueTimer: 0,
    vaultCrackCueDuration: 0,
    vaultCrackWindowOpen: false,
    vaultCrackWindowTimer: 0,
    vaultCrackWindowDuration: 0.4,
    vaultOpenTimer: 0,
    vaultDoor: null,
    silentAlarmTimer: 0,
    silentAlarmActive: false,
    // key card
    keyCardPickedUp: false,
    keyCardMesh: null,
    // escape routes
    getawayCar: null,
    helicopter: null,
    // guards
    guards: [],
    // escape
    escaped: false,
    escapeFailed: false,
    escapeRoute: '',
    // stun
    stunned: false,
    stunTimer: 0,
    // shooting
    shooting: false,
    raycaster: null,
    // interaction
    interactKey: false,
    lastInteractTime: 0,
    // HUD
    hudEl: null,
    promptEl: null,
    endEl: null,
    overlayEl: null,
    // key/mouse handlers (for cleanup)
    keydownHandler: null,
    keyupHandler: null,
    mousemoveHandler: null,
    clickHandler: null,
    mousedownHandler: null,
    contextMenuHandler: null
  };

  // ─── Constants ────────────────────────────────────────────────────────────
  var PLAYER_SPEED = 7;
  var PLAYER_HEIGHT = 1.7;
  var GUARD_DETECTION_NORMAL = 8;
  var GUARD_DETECTION_DISGUISED = 12;
  var GUARD_ALERT_DISTANCE = 5;
  var CASINO_GUARD_HP = 80;
  var VAULT_GUARD_HP = 150;
  var STUN_DURATION = 5;
  var CAMERA_FREEZE_DURATION = 120;
  var LASER_OFF_DURATION = 90;
  var PATROL_INTERVAL = 60;
  var PATROL_WINDOW = 20;
  var VAULT_SILENT_ALARM = 180;
  var CRACK_CUE_INTERVAL = 4;

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function makeBox(w, h, d, colorHex, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: colorHex });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : h / 2, z || 0);
    return mesh;
  }

  function makeCylinder(rt, rb, h, segs, colorHex, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: colorHex });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : h / 2, z || 0);
    return mesh;
  }

  function makeSphere(r, colorHex, x, y, z) {
    var geo = new THREE.SphereGeometry(r, 8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: colorHex });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : r, z || 0);
    return mesh;
  }

  function dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function clamp(v, mn, mx) {
    return v < mn ? mn : v > mx ? mx : v;
  }

  // ─── Build Scene ──────────────────────────────────────────────────────────
  function buildScene() {
    var scene = state.scene;

    // Ambient + directional light
    var ambient = new THREE.AmbientLight(0x443322, 0.6);
    scene.add(ambient);
    var dir = new THREE.DirectionalLight(0xffeedd, 0.8);
    dir.position.set(10, 20, 10);
    scene.add(dir);

    // ── Casino Floor (50x4x40) centered at 0,0,0 ──
    var casinoFloor = makeBox(50, 4, 40, 0x221100, 0, -2, 0);
    scene.add(casinoFloor);

    // Casino ceiling
    var casinoCeil = makeBox(50, 0.3, 40, 0x110800, 0, 4.15, 0);
    scene.add(casinoCeil);

    // Casino walls
    var cw1 = makeBox(0.3, 4, 40, 0x332211, 25, 2, 0); scene.add(cw1);
    var cw2 = makeBox(0.3, 4, 40, 0x332211, -25, 2, 0); scene.add(cw2);
    var cw3 = makeBox(50, 4, 0.3, 0x332211, 0, 2, 20); scene.add(cw3);
    var cw4 = makeBox(50, 4, 0.3, 0x332211, 0, 2, -20); scene.add(cw4);

    // Slot machines (CylinderGeometry, 0xFFAA00)
    var slotPositions = [
      [-20, 1, 8], [-20, 1, 4], [-20, 1, 0], [-20, 1, -4], [-20, 1, -8],
      [-16, 1, 8], [-16, 1, 4], [-16, 1, 0], [-16, 1, -4], [-16, 1, -8]
    ];
    for (var i = 0; i < slotPositions.length; i++) {
      var sp = slotPositions[i];
      var slot = makeCylinder(0.4, 0.4, 1.6, 8, 0xFFAA00, sp[0], sp[1], sp[2]);
      scene.add(slot);
    }

    // Card tables (BoxGeometry, 0x116611)
    var tablePositions = [
      [0, 0.5, 8], [0, 0.5, 0], [0, 0.5, -8],
      [8, 0.5, 8], [8, 0.5, 0], [8, 0.5, -8]
    ];
    for (var j = 0; j < tablePositions.length; j++) {
      var tp = tablePositions[j];
      var tbl = makeBox(3, 0.2, 2, 0x116611, tp[0], tp[1], tp[2]);
      scene.add(tbl);
    }

    // ── High Roller Lounge (20x4x15) at x=17, z=-22 ──
    var lounge = makeBox(20, 4, 15, 0x221111, 17, 2, -27.5);
    scene.add(lounge);
    // Lounge opening doorway (gap in wall — represented by leaving an opening)

    // Lounge chairs (small boxes)
    var chairColors = [0x880000, 0x660000];
    var chairPos = [
      [12, 0.5, -25], [14, 0.5, -25], [16, 0.5, -25],
      [12, 0.5, -30], [14, 0.5, -30], [16, 0.5, -30]
    ];
    for (var ci = 0; ci < chairPos.length; ci++) {
      var ch = makeBox(1.2, 0.6, 1.2, chairColors[ci % 2], chairPos[ci][0], chairPos[ci][1], chairPos[ci][2]);
      scene.add(ch);
    }

    // Staff room — disguise uniform (BoxGeometry 0xFFFFCC) at side
    state.disguiseMesh = makeBox(0.6, 1.0, 0.3, 0xFFFFCC, -22, 0.5, -15);
    state.disguiseMesh.userData.type = 'disguise';
    scene.add(state.disguiseMesh);
    state.disguiseAvailable = true;

    // ── Security Office (12x4x10) at x=-15, z=-25 ──
    var secOff = makeBox(12, 4, 10, 0x334455, -15, 2, -25);
    scene.add(secOff);

    // Security terminal (small box inside)
    var terminal = makeBox(0.8, 1.2, 0.4, 0x005500, -15, 0.6, -22);
    terminal.userData.type = 'terminal';
    scene.add(terminal);

    // Key card on security desk
    state.keyCardMesh = makeBox(0.3, 0.05, 0.5, 0x00FFFF, -17, 1.2, -24);
    state.keyCardMesh.userData.type = 'keycard';
    scene.add(state.keyCardMesh);

    // ── Elevator Shaft (CylinderGeometry) at x=0, z=-20 ──
    var elevShaft = makeCylinder(1.2, 1.2, 8, 12, 0x333333, 0, -4, -20);
    scene.add(elevShaft);
    // Elevator button panel
    var elevBtn = makeBox(0.4, 0.6, 0.1, 0x223355, 1.3, 1.0, -20);
    elevBtn.userData.type = 'elevator';
    scene.add(elevBtn);

    // ── Vault Corridor (5x4x30) beneath, simulated at y=0 going deeper z ──
    // We place it at z = -38 to -53
    var vaultCorr = makeBox(5, 4, 30, 0x444444, 0, 2, -50);
    scene.add(vaultCorr);

    // Corridor walls
    var vcw1 = makeBox(0.2, 4, 30, 0x333333, 2.5, 2, -50); scene.add(vcw1);
    var vcw2 = makeBox(0.2, 4, 30, 0x333333, -2.5, 2, -50); scene.add(vcw2);

    // Motion sensors in corridor (BoxGeometry 0xFF4400)
    var sensorPositions = [
      { x: 2.0, y: 1.5, z: -42 },
      { x: -2.0, y: 1.5, z: -50 },
      { x: 2.0, y: 1.5, z: -58 }
    ];
    state.motionSensors = [];
    for (var si = 0; si < sensorPositions.length; si++) {
      var spos = sensorPositions[si];
      var sensor = makeBox(0.3, 0.3, 0.3, 0xFF4400, spos.x, spos.y, spos.z);
      sensor.userData.type = 'sensor';
      sensor.userData.shot = false;
      sensor.userData.index = si;
      scene.add(sensor);
      state.motionSensors.push(sensor);
    }

    // Laser grid (LineSegments, 0xFF0000) — horizontal lines across corridor
    buildLaserGrid();

    // ── Vault Room (15x5x15) at z=-72 ──
    var vaultRoom = makeBox(15, 5, 15, 0x334444, 0, 2.5, -72);
    scene.add(vaultRoom);

    // Vault door (CylinderGeometry, 0x555555)
    state.vaultDoor = makeCylinder(2.5, 2.5, 0.5, 32, 0x555555, 0, 2, -65);
    state.vaultDoor.rotation.x = Math.PI / 2;
    state.vaultDoor.userData.type = 'vault_door';
    scene.add(state.vaultDoor);

    // Vault door handle
    var handle = makeBox(0.15, 0.15, 0.8, 0x888888, 0, 2.5, -65);
    scene.add(handle);

    // Diamonds inside vault (50 BoxGeometry, 0x88CCFF emissive)
    state.diamonds = [];
    for (var di = 0; di < 50; di++) {
      var drow = Math.floor(di / 10);
      var dcol = di % 10;
      var dmat = new THREE.MeshLambertMaterial({ color: 0x88CCFF, emissive: 0x224466 });
      var dgeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      var dmesh = new THREE.Mesh(dgeo, dmat);
      dmesh.position.set(-4 + dcol * 0.9, 0.25, -68 + drow * 1.2);
      dmesh.userData.type = 'diamond';
      dmesh.userData.collected = false;
      dmesh.userData.index = di;
      dmesh.visible = false; // hidden until vault open
      scene.add(dmesh);
      state.diamonds.push(dmesh);
    }

    // ── Escape Routes ──
    // 1) Main entrance — door at z=20 (most guards, already modelled by casino wall)
    var mainDoorLabel = makeBox(2, 3, 0.2, 0x555522, 0, 1.5, 19.9);
    mainDoorLabel.userData.type = 'escape_main';
    scene.add(mainDoorLabel);

    // 2) Parking garage — side exit at x=-24, z=5
    state.getawayCar = makeBox(2.5, 1, 4, 0x334422, -28, 0.5, 5);
    state.getawayCar.userData.type = 'escape_car';
    scene.add(state.getawayCar);
    // Garage opening wall-gap marker
    var garageDoor = makeBox(3, 3, 0.2, 0x445533, -24, 1.5, 5);
    garageDoor.userData.type = 'escape_car_door';
    scene.add(garageDoor);

    // 3) Helipad roof — elevator leads up, helicopter on roof
    state.helicopter = makeCylinder(1.8, 1.8, 0.8, 16, 0x334455, 0, 9, -20);
    state.helicopter.userData.type = 'escape_heli';
    scene.add(state.helicopter);
    // Helipad rotor (box)
    var rotor = makeBox(4, 0.1, 0.4, 0x222222, 0, 9.5, -20);
    scene.add(rotor);

    // ── Guards ──
    buildGuards();

    // Ground plane under everything
    var ground = makeBox(200, 0.1, 200, 0x111111, 0, -0.05, 0);
    scene.add(ground);
  }

  function buildLaserGrid() {
    if (state.laserLines) {
      state.scene.remove(state.laserLines);
      state.laserLines = null;
    }
    if (!state.lasersActive) return;

    var points = [];
    // 6 horizontal laser lines across the 5-wide corridor at various z depths
    var laserZ = [-43, -46, -49, -52, -55, -58];
    var laserY = [0.5, 1.0, 1.5, 0.8, 1.2, 0.6];
    for (var li = 0; li < laserZ.length; li++) {
      points.push(-2.3, laserY[li], laserZ[li]);
      points.push(2.3, laserY[li], laserZ[li]);
    }
    var buf = new THREE.BufferGeometry();
    var arr = new Float32Array(points);
    buf.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    var lmat = new THREE.LineSegments(buf, new THREE.LineBasicMaterial({ color: 0xFF0000 }));
    state.laserLines = lmat;
    state.scene.add(state.laserLines);
  }

  var GUARD_DEFS = [
    // Casino floor guards (12): type='casino', color=0x334455
    { x: 10, z: 10, type: 'casino' },
    { x: -10, z: 10, type: 'casino' },
    { x: 10, z: -5, type: 'casino' },
    { x: -10, z: -5, type: 'casino' },
    { x: 5, z: 15, type: 'casino' },
    { x: -5, z: 15, type: 'casino' },
    { x: 20, z: 5, type: 'casino' },
    { x: -20, z: 5, type: 'casino' },
    { x: 15, z: -10, type: 'casino' },
    { x: -15, z: -10, type: 'casino' },
    { x: 5, z: -15, type: 'casino' },
    { x: -5, z: -15, type: 'casino' },
    // Vault guards (3): type='vault', color=0x223344
    { x: 0, z: -42, type: 'vault' },
    { x: 0, z: -50, type: 'vault' },
    { x: 0, z: -68, type: 'vault' }
  ];

  function buildGuards() {
    state.guards = [];
    for (var gi = 0; gi < GUARD_DEFS.length; gi++) {
      var gd = GUARD_DEFS[gi];
      var color = gd.type === 'vault' ? 0x223344 : 0x334455;
      var hp = gd.type === 'vault' ? VAULT_GUARD_HP : CASINO_GUARD_HP;
      var mesh = makeBox(0.6, 1.6, 0.6, color, gd.x, 0.8, gd.z);
      mesh.userData.type = 'guard';
      // Head
      var head = makeSphere(0.3, color, 0, 1.1, 0);
      mesh.add(head);
      state.scene.add(mesh);
      var guard = {
        mesh: mesh,
        hp: hp,
        maxHP: hp,
        type: gd.type,
        homeX: gd.x,
        homeZ: gd.z,
        x: gd.x,
        z: gd.z,
        alertState: 'patrol', // patrol | alerted | called
        alertTimer: 0,
        radioTimer: 0,
        patrolAngle: Math.random() * Math.PI * 2,
        patrolRadius: 3 + Math.random() * 2,
        stunTimer: 0,
        dead: false
      };
      state.guards.push(guard);
    }
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────
  function buildHUD() {
    state.hudEl = document.createElement('div');
    state.hudEl.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0',
      'padding:8px 12px', 'background:rgba(0,0,0,0.75)',
      'color:#FFE566', 'font:bold 13px monospace',
      'z-index:10001', 'letter-spacing:1px',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(state.hudEl);

    state.promptEl = document.createElement('div');
    state.promptEl.style.cssText = [
      'position:fixed', 'bottom:80px', 'left:50%',
      'transform:translateX(-50%)',
      'padding:6px 16px', 'background:rgba(0,0,0,0.7)',
      'color:#AAFFAA', 'font:bold 14px monospace',
      'z-index:10001', 'pointer-events:none',
      'border:1px solid #449944'
    ].join(';');
    state.promptEl.style.display = 'none';
    document.body.appendChild(state.promptEl);

    // Crosshair
    var xh = document.createElement('div');
    xh.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'width:12px', 'height:12px',
      'border:2px solid rgba(255,255,255,0.8)',
      'border-radius:50%',
      'z-index:10001', 'pointer-events:none'
    ].join(';');
    document.body.appendChild(xh);
    state._crosshairEl = xh;

    // End overlay
    state.endEl = document.createElement('div');
    state.endEl.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'display:none', 'align-items:center', 'justify-content:center',
      'background:rgba(0,0,0,0.85)',
      'color:#FFE566', 'font:bold 28px monospace',
      'z-index:10010', 'text-align:center', 'flex-direction:column'
    ].join(';');
    document.body.appendChild(state.endEl);
  }

  function updateHUD() {
    if (!state.hudEl) return;
    var phase = state.phase;
    var phaseName = state.phaseNames[phase] || 'UNKNOWN';
    var alarmStr = state.alarmActive
      ? (Math.ceil(state.alarmTimer) + 's')
      : 'OFF';
    var alarmColor = state.alarmActive ? '#FF4444' : '#44FF44';
    var ghostStr = state.ghostRating ? '<span style="color:#88FFFF">GHOST</span>' : '<span style="color:#FF6644">COMPROMISED</span>';
    var guardsAlive = 0;
    for (var i = 0; i < state.guards.length; i++) {
      if (!state.guards[i].dead) guardsAlive++;
    }
    var disguiseStr = state.disguised ? ' [DISGUISED]' : '';
    var camStr = state.camerasFrozen ? ' [CAMS FROZEN: ' + Math.ceil(state.cameraFreezeTimer) + 's]' : '';
    state.hudEl.innerHTML =
      'DIAMOND HEIST [PHASE: ' + phaseName + ']' + disguiseStr + camStr +
      ' [DIAMONDS: ' + state.diamondsCollected + '/50]' +
      ' [ALARM: <span style="color:' + alarmColor + '">' + alarmStr + '</span>]' +
      ' [GUARDS: ' + guardsAlive + '] | ' + ghostStr +
      ' | SCORE: ' + state.score +
      (state.stunned ? ' | <span style="color:#FFAA00">STUNNED ' + Math.ceil(state.stunTimer) + 's</span>' : '');
  }

  function showPrompt(msg) {
    if (!state.promptEl) return;
    state.promptEl.textContent = msg;
    state.promptEl.style.display = 'block';
  }

  function hidePrompt() {
    if (!state.promptEl) return;
    state.promptEl.style.display = 'none';
  }

  function showEnd(won, msg) {
    if (!state.endEl) return;
    state.endEl.style.display = 'flex';
    var color = won ? '#88FF88' : '#FF5555';
    var title = won ? 'HEIST COMPLETE!' : 'HEIST FAILED';
    var ghostBonus = (won && state.ghostRating) ? '<br><span style="color:#88CCFF">GHOST RATING +3000</span>' : '';
    state.endEl.innerHTML =
      '<div style="color:' + color + ';font-size:36px">' + title + '</div>' +
      '<div style="margin-top:16px;font-size:18px">' + msg + '</div>' +
      '<div style="margin-top:8px;color:#FFE566">SCORE: ' + state.score + '</div>' +
      ghostBonus +
      '<div style="margin-top:20px;font-size:14px;color:#AAAAAA">[Press ESC to exit]</div>';
  }

  // ─── Input ────────────────────────────────────────────────────────────────
  function setupInput() {
    state.keydownHandler = function (e) {
      if (!state.active) {
        // Check activation: D + H within 400ms
        if (e.key === 'd' || e.key === 'D') {
          state.dDown = true;
          state.dDownTime = Date.now();
        }
        if (e.key === 'h' || e.key === 'H') {
          state.hDown = true;
          state.hDownTime = Date.now();
        }
        if (state.dDown && state.hDown) {
          var diff = Math.abs(state.dDownTime - state.hDownTime);
          if (diff < 400) {
            init();
          }
        }
        return;
      }
      state.moveKeys[e.key.toLowerCase()] = true;
      if (e.key === 'e' || e.key === 'E') {
        state.interactKey = true;
      }
      if (e.key === 'Escape') {
        reset();
      }
    };

    state.keyupHandler = function (e) {
      if (!state.active) return;
      state.moveKeys[e.key.toLowerCase()] = false;
      if (e.key === 'e' || e.key === 'E') {
        state.interactKey = false;
        state.cameraLoopHolding = false;
      }
    };

    state.mousemoveHandler = function (e) {
      if (!state.active || !state.pointerLocked) return;
      var sens = 0.0018;
      state.playerYaw -= e.movementX * sens;
      state.playerPitch -= e.movementY * sens;
      state.playerPitch = clamp(state.playerPitch, -1.2, 1.2);
    };

    state.clickHandler = function (e) {
      if (!state.active) return;
      if (!state.pointerLocked) {
        state.canvas.requestPointerLock();
        return;
      }
      if (e.button === 0) {
        fireShot();
      }
    };

    state.contextMenuHandler = function (e) {
      if (state.active) e.preventDefault();
    };

    document.addEventListener('keydown', state.keydownHandler);
    document.addEventListener('keyup', state.keyupHandler);
    document.addEventListener('mousemove', state.mousemoveHandler);
    document.addEventListener('click', state.clickHandler);
    document.addEventListener('contextmenu', state.contextMenuHandler);

    document.addEventListener('pointerlockchange', function () {
      state.pointerLocked = (document.pointerLockElement === state.canvas);
    });
  }

  function removeInput() {
    if (state.keydownHandler) document.removeEventListener('keydown', state.keydownHandler);
    if (state.keyupHandler) document.removeEventListener('keyup', state.keyupHandler);
    if (state.mousemoveHandler) document.removeEventListener('mousemove', state.mousemoveHandler);
    if (state.clickHandler) document.removeEventListener('click', state.clickHandler);
    if (state.contextMenuHandler) document.removeEventListener('contextmenu', state.contextMenuHandler);
  }

  // ─── Shooting ─────────────────────────────────────────────────────────────
  function fireShot() {
    if (state.stunned) return;
    if (!state.raycaster) return;

    // Direction from camera
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(state.playerPitch, state.playerYaw, 0, 'YXZ'));
    state.raycaster.set(
      new THREE.Vector3(state.playerPos.x, state.playerPos.y + 0.5, state.playerPos.z),
      dir
    );

    // Check motion sensors
    for (var si = 0; si < state.motionSensors.length; si++) {
      var sensor = state.motionSensors[si];
      if (sensor.userData.shot) continue;
      var intersects = state.raycaster.intersectObject(sensor, false);
      if (intersects.length > 0 && intersects[0].distance < 30) {
        sensor.userData.shot = true;
        sensor.material.color.setHex(0x333333);
        state.motionSensorsShot++;
        if (state.motionSensorsShot >= 3) {
          state.lasersActive = false;
          state.laserOffTimer = LASER_OFF_DURATION;
          buildLaserGrid();
          showPhaseMessage('All sensors disabled — laser grid off for 90s!');
        }
        return;
      }
    }

    // Check guards
    var meshes = [];
    for (var gi = 0; gi < state.guards.length; gi++) {
      if (!state.guards[gi].dead) meshes.push(state.guards[gi].mesh);
    }
    var hits = state.raycaster.intersectObjects(meshes, true);
    if (hits.length > 0 && hits[0].distance < 40) {
      var hitMesh = hits[0].object;
      // Find parent guard
      for (var gii = 0; gii < state.guards.length; gii++) {
        var g = state.guards[gii];
        if (g.dead) continue;
        if (g.mesh === hitMesh || g.mesh.getObjectById(hitMesh.id)) {
          damageGuard(g, 40);
          break;
        }
      }
    }
  }

  function damageGuard(guard, dmg) {
    guard.hp -= dmg;
    if (guard.hp <= 0) {
      killGuard(guard);
    } else {
      // Guard goes alerted
      if (guard.alertState === 'patrol') {
        guard.alertState = 'alerted';
        guard.alertTimer = 3; // 3s to radio before alarm
        state.ghostRating = false;
      }
    }
  }

  function killGuard(guard) {
    guard.dead = true;
    guard.mesh.visible = false;
    state.score += 200;
    // Check if radio timer had expired
  }

  // ─── Player Movement ──────────────────────────────────────────────────────
  function movePlayer(dt) {
    if (state.stunned) {
      state.stunTimer -= dt;
      if (state.stunTimer <= 0) {
        state.stunned = false;
        state.stunTimer = 0;
      }
      return;
    }

    var mk = state.moveKeys;
    var forward = 0, strafe = 0;
    if (mk['w'] || mk['arrowup']) forward += 1;
    if (mk['s'] || mk['arrowdown']) forward -= 1;
    if (mk['a'] || mk['arrowleft']) strafe -= 1;
    if (mk['d'] || mk['arrowright']) strafe += 1;

    // Weight penalty for diamonds
    var weightFactor = 1.0;
    if (state.diamondsCollected >= 40) weightFactor = 0.6;
    else if (state.diamondsCollected >= 20) weightFactor = 0.8;

    var speed = PLAYER_SPEED * weightFactor;

    var sinYaw = Math.sin(state.playerYaw);
    var cosYaw = Math.cos(state.playerYaw);

    var dx = (forward * (-sinYaw) + strafe * cosYaw) * speed * dt;
    var dz = (forward * (-cosYaw) + strafe * (-sinYaw)) * speed * dt;

    var nx = state.playerPos.x + dx;
    var nz = state.playerPos.z + dz;

    // Simple AABB boundary collision
    nx = clamp(nx, -24.5, 24.5);
    // Don't walk through main walls unless going to escape route areas
    if (nz > 19.5) nz = 19.5;
    if (nz < -80) nz = -80;

    // Block vault corridor walls
    if (nz < -35 && nz > -68) {
      if (nx > 2.3) nx = 2.3;
      if (nx < -2.3) nx = -2.3;
    }

    state.playerPos.x = nx;
    state.playerPos.z = nz;
    state.playerPos.y = PLAYER_HEIGHT;

    // Update camera
    state.camera.position.set(state.playerPos.x, state.playerPos.y + 0.4, state.playerPos.z);
    state.camera.rotation.order = 'YXZ';
    state.camera.rotation.y = state.playerYaw;
    state.camera.rotation.x = state.playerPitch;
  }

  // ─── Guard AI ─────────────────────────────────────────────────────────────
  function updateGuards(dt) {
    var px = state.playerPos.x;
    var pz = state.playerPos.z;
    var detectionRange = state.disguised ? GUARD_DETECTION_DISGUISED : GUARD_DETECTION_NORMAL;
    var alertRange = GUARD_ALERT_DISTANCE;

    for (var gi = 0; gi < state.guards.length; gi++) {
      var g = state.guards[gi];
      if (g.dead) continue;

      // Update stun
      if (g.stunTimer > 0) {
        g.stunTimer -= dt;
        continue;
      }

      var d = dist2D(px, pz, g.x, g.z);

      switch (g.alertState) {
        case 'patrol':
          // Circular patrol around home
          g.patrolAngle += dt * 0.5;
          var targetX = g.homeX + Math.cos(g.patrolAngle) * g.patrolRadius;
          var targetZ = g.homeZ + Math.sin(g.patrolAngle) * g.patrolRadius;
          g.x += (targetX - g.x) * dt * 1.5;
          g.z += (targetZ - g.z) * dt * 1.5;
          g.mesh.position.set(g.x, 0.8, g.z);

          if (d < detectionRange) {
            g.alertState = 'alerted';
            g.alertTimer = 3.0;
            state.ghostRating = false;
          }
          break;

        case 'alerted':
          // Chase player
          g.alertTimer -= dt;
          var chase_speed = 4.0;
          var dirX = px - g.x;
          var dirZ = pz - g.z;
          var mag = Math.sqrt(dirX * dirX + dirZ * dirZ);
          if (mag > 0.1) {
            g.x += (dirX / mag) * chase_speed * dt;
            g.z += (dirZ / mag) * chase_speed * dt;
          }
          g.mesh.position.set(g.x, 0.8, g.z);

          // Radio alarm after 3s of being alerted
          if (g.alertTimer <= 0 && g.alertState === 'alerted') {
            g.alertState = 'called';
            triggerAlarm(g.type === 'vault' ? 120 : 60);
          }

          // Taser if within range
          if (d < alertRange) {
            if (!state.stunned) {
              state.stunned = true;
              state.stunTimer = STUN_DURATION;
              state.score = Math.max(0, state.score - 100);
            }
            if (g.type === 'vault') {
              // Vault guards escort to lockdown
              triggerAlarm(180);
            }
          }
          break;

        case 'called':
          // Guards head toward player when alarm active
          if (state.alarmActive) {
            var cs2 = 5.0;
            var cdx = px - g.x;
            var cdz = pz - g.z;
            var cmag = Math.sqrt(cdx * cdx + cdz * cdz);
            if (cmag > 0.5) {
              g.x += (cdx / cmag) * cs2 * dt;
              g.z += (cdz / cmag) * cs2 * dt;
              g.mesh.position.set(g.x, 0.8, g.z);
            }
            if (dist2D(px, pz, g.x, g.z) < alertRange) {
              if (!state.stunned) {
                state.stunned = true;
                state.stunTimer = STUN_DURATION;
              }
            }
          }
          break;
      }

      // Rotate guard to face player
      var angle = Math.atan2(px - g.x, pz - g.z);
      g.mesh.rotation.y = angle;
    }
  }

  function triggerAlarm(duration) {
    if (!state.alarmActive) {
      state.alarmActive = true;
      state.ghostRating = false;
    }
    state.alarmTimer = Math.max(state.alarmTimer, duration);
  }

  // ─── Phase Logic ──────────────────────────────────────────────────────────
  var _phaseMsg = null;
  var _phaseMsgTimer = 0;

  function showPhaseMessage(msg) {
    _phaseMsg = msg;
    _phaseMsgTimer = 4.0;
    if (state.promptEl) {
      showPrompt(msg);
    }
  }

  function updatePhases(dt) {
    var px = state.playerPos.x;
    var pz = state.playerPos.z;
    var now = Date.now();

    // ── Phase 1: Infiltrate ──
    if (state.phase === 1) {
      // Disguise pickup
      if (state.disguiseAvailable && !state.disguised && state.disguiseMesh && state.disguiseMesh.visible !== false) {
        var dd = dist2D(px, pz, state.disguiseMesh.position.x, state.disguiseMesh.position.z);
        if (dd < 2.0) {
          showPrompt('[E] Pick up dealer uniform');
          if (state.interactKey && (now - state.lastInteractTime) > 500) {
            state.lastInteractTime = now;
            state.disguised = true;
            state.disguiseAvailable = false;
            state.scene.remove(state.disguiseMesh);
            state.disguiseMesh = null;
            showPhaseMessage('Disguise acquired! Guards have 50% larger detection range.');
            state.score += 200;
          }
        }
      }

      // Advance to phase 2 when player reaches security office area or vault corridor
      if (pz < -18) {
        state.phase = 2;
        showPhaseMessage('PHASE 2: BYPASS SECURITY — Freeze camera feeds and disable laser grid!');
      }
    }

    // ── Phase 2: Bypass Security ──
    if (state.phase === 2) {
      // Key card
      if (state.keyCardMesh && !state.keyCardPickedUp) {
        var kd = dist2D(px, pz, state.keyCardMesh.position.x, state.keyCardMesh.position.z);
        if (kd < 2.0) {
          showPrompt('[E] Pick up key card (helipad access)');
          if (state.interactKey && (now - state.lastInteractTime) > 500) {
            state.lastInteractTime = now;
            state.keyCardPickedUp = true;
            state.scene.remove(state.keyCardMesh);
            state.keyCardMesh = null;
            showPhaseMessage('Key card obtained! Helipad escape route unlocked.');
            state.score += 300;
          }
        }
      }

      // Security terminal — camera loop (hold E for 3s)
      var termPos = { x: -15, z: -22 };
      var td = dist2D(px, pz, termPos.x, termPos.z);
      if (td < 2.5 && !state.camerasFrozen) {
        if (state.cameraLoopHolding) {
          state.cameraLoopProgress += dt;
          showPrompt('[HOLDING E] Looping camera feeds... ' + Math.min(Math.ceil(state.cameraLoopProgress), 3) + '/3s');
          if (state.cameraLoopProgress >= 3.0) {
            state.camerasFrozen = true;
            state.cameraFreezeTimer = CAMERA_FREEZE_DURATION;
            state.cameraLoopProgress = 0;
            state.cameraLoopHolding = false;
            showPhaseMessage('Camera feeds looped! Guards blind for 2 minutes.');
            state.score += 500;
          }
        } else {
          showPrompt('[Hold E] Loop camera feeds (3s)');
          if (state.interactKey) {
            state.cameraLoopHolding = true;
          }
        }
      } else if (!state.interactKey) {
        state.cameraLoopHolding = false;
      }

      // Camera freeze countdown
      if (state.camerasFrozen) {
        state.cameraFreezeTimer -= dt;
        if (state.cameraFreezeTimer <= 0) {
          state.camerasFrozen = false;
        }
      }

      // Laser off timer
      if (!state.lasersActive) {
        state.laserOffTimer -= dt;
        if (state.laserOffTimer <= 0) {
          state.lasersActive = true;
          state.motionSensorsShot = 0;
          // Re-arm sensors
          for (var si = 0; si < state.motionSensors.length; si++) {
            state.motionSensors[si].userData.shot = false;
            state.motionSensors[si].material.color.setHex(0xFF4400);
          }
          buildLaserGrid();
        }
      }

      // Guard patrol timing for corridor
      state.guardPatrolTimer += dt;
      if (state.guardPatrolTimer >= PATROL_INTERVAL) {
        state.guardPatrolTimer = 0;
        state.guardInCorridor = true;
        state.guardCorridorTimer = PATROL_WINDOW;
        // Move a vault guard into corridor
        for (var vgi = 0; vgi < state.guards.length; vgi++) {
          var vg = state.guards[vgi];
          if (vg.type === 'vault' && !vg.dead && vg.alertState === 'patrol') {
            vg.homeX = 0;
            vg.homeZ = -50;
            break;
          }
        }
      }
      if (state.guardInCorridor) {
        state.guardCorridorTimer -= dt;
        if (state.guardCorridorTimer <= 0) {
          state.guardInCorridor = false;
        }
      }

      // Check laser grid collision with player
      if (state.lasersActive && pz < -40 && pz > -62 && px > -2.5 && px < 2.5) {
        if (!state.camerasFrozen) {
          triggerAlarm(90);
          showPhaseMessage('LASER TRIGGERED! Alarm activated!');
        }
      }

      // Advance to phase 3 when player reaches vault door
      if (pz < -62) {
        state.phase = 3;
        showPhaseMessage('PHASE 3: CRACK THE VAULT — Use the safecracking terminal!');
      }
    }

    // ── Phase 3: Crack Vault ──
    if (state.phase === 3) {
      // Vault door interaction
      if (state.vaultLocked && !state.vaultCrackActive) {
        var vaultDist = dist2D(px, pz, 0, -65);
        if (vaultDist < 3.5) {
          showPrompt('[E] Begin safecracking (' + state.vaultCrackStage + '/3 done)');
          if (state.interactKey && (now - state.lastInteractTime) > 500) {
            state.lastInteractTime = now;
            startVaultCrackStage();
          }
        }
      }

      // Vault cracking minigame
      if (state.vaultCrackActive) {
        updateVaultCrack(dt);
      }

      // Vault open — diamond collection
      if (!state.vaultLocked) {
        // Make diamonds visible
        for (var dvi = 0; dvi < state.diamonds.length; dvi++) {
          var dm = state.diamonds[dvi];
          if (!dm.userData.collected) {
            dm.visible = true;
            // Spin diamonds
            dm.rotation.y += dt * 2;

            var dd2 = dist2D(px, pz, dm.position.x, dm.position.z);
            if (dd2 < 1.5 && Math.abs(dm.position.z - pz) < 3) {
              showPrompt('[E] Collect diamond (' + state.diamondsCollected + '/50)');
              if (state.interactKey && (now - state.lastInteractTime) > 200) {
                state.lastInteractTime = now;
                dm.userData.collected = true;
                dm.visible = false;
                state.diamondsCollected++;
                state.score += 100;
                if (state.diamondsCollected === 30) {
                  showPhaseMessage('Minimum diamonds secured! Escape now or collect more!');
                }
                if (state.diamondsCollected === 50) {
                  state.score += 5000 * 60; // 5-min bonus tokens
                  showPhaseMessage('ALL 50 DIAMONDS COLLECTED! Bonus secured!');
                }
              }
            }
          }
        }

        // Silent alarm — vault open > 3 minutes
        state.vaultOpenTimer += dt;
        if (state.vaultOpenTimer >= VAULT_SILENT_ALARM && !state.silentAlarmActive) {
          state.silentAlarmActive = true;
          triggerAlarm(300);
          showPhaseMessage('SILENT ALARM! Guards incoming — escape NOW!');
        }

        // Advance to phase 4 if player has 30+ diamonds and heads back
        if (state.diamondsCollected >= 30 && pz > -60) {
          state.phase = 4;
          showPhaseMessage('PHASE 4: ESCAPE! Choose your exit route!');
        }
      }
    }

    // ── Phase 4: Escape ──
    if (state.phase === 4) {
      var escaped = false;
      var escapeMsg = '';

      // Main entrance (x ~0, z ~19.5) — most guards
      var mainDist = dist2D(px, pz, 0, 19.5);
      if (mainDist < 2.5) {
        showPrompt('[E] Main entrance escape (high risk — 4 guards)');
        if (state.interactKey && (now - state.lastInteractTime) > 500) {
          state.lastInteractTime = now;
          // Check guards near entrance
          var guardsNearEntrance = 0;
          for (var egi = 0; egi < state.guards.length; egi++) {
            var eg = state.guards[egi];
            if (!eg.dead && dist2D(eg.x, eg.z, 0, 15) < 12) guardsNearEntrance++;
          }
          if (guardsNearEntrance <= 1 || state.camerasFrozen) {
            escaped = true;
            escapeMsg = 'Escaped through main entrance!';
            state.escapeRoute = 'main';
          } else {
            showPhaseMessage('Too many guards at entrance! Clear them or use another route!');
          }
        }
      }

      // Parking garage (x ~-28, z ~5) — 1 guard
      var garageDist = dist2D(px, pz, -28, 5);
      if (garageDist < 3.5) {
        showPrompt('[E] Enter getaway car — drive to freedom!');
        if (state.interactKey && (now - state.lastInteractTime) > 500) {
          state.lastInteractTime = now;
          escaped = true;
          escapeMsg = 'Escaped in the getaway car through the parking garage!';
          state.escapeRoute = 'car';
          state.score += 500;
        }
      }

      // Helipad (elevator at x=0, z=-20, then roof) — requires key card
      var heliDist = dist2D(px, pz, 0, -20);
      if (heliDist < 2.5) {
        if (!state.keyCardPickedUp) {
          showPrompt('Need key card for helipad! (Check security office)');
        } else {
          showPrompt('[E] Take elevator to helipad!');
          if (state.interactKey && (now - state.lastInteractTime) > 500) {
            state.lastInteractTime = now;
            escaped = true;
            escapeMsg = 'Escaped by helicopter from the rooftop helipad!';
            state.escapeRoute = 'heli';
            state.score += 1000;
          }
        }
      }

      if (escaped) {
        state.escaped = true;
        state.score += state.diamondsCollected * 100;
        if (state.ghostRating) state.score += 3000;
        showEnd(true, escapeMsg + '\nDiamonds: ' + state.diamondsCollected + '/50\nRoute: ' + state.escapeRoute.toUpperCase());
      }

      // Fail condition: all exits blocked
      var allGuardsAlerted = 0;
      var totalAlive = 0;
      for (var fgi = 0; fgi < state.guards.length; fgi++) {
        var fg = state.guards[fgi];
        if (!fg.dead) {
          totalAlive++;
          if (fg.alertState !== 'patrol') allGuardsAlerted++;
        }
      }
      if (totalAlive > 0 && allGuardsAlerted === totalAlive && state.alarmActive && state.alarmTimer > 200) {
        if (state.stunned && state.diamondsCollected < 30) {
          state.escapeFailed = true;
          showEnd(false, 'All exits blocked! Trapped by security!\nDiamonds recovered: ' + state.diamondsCollected);
        }
      }
    }

    // ── Prompt clear logic ──
    if (_phaseMsgTimer > 0) {
      _phaseMsgTimer -= dt;
      if (_phaseMsgTimer <= 0 && state.promptEl) {
        hidePrompt();
        _phaseMsg = null;
      }
    }
  }

  // ─── Vault Cracking Minigame ───────────────────────────────────────────────
  function startVaultCrackStage() {
    state.vaultCrackActive = true;
    state.vaultCrackCueDuration = 1.5 + Math.random() * 2;
    state.vaultCrackCueTimer = CRACK_CUE_INTERVAL;
    state.vaultCrackWindowOpen = false;
    showPhaseMessage('SAFECRACKING: Press [E] when the cue sounds! Stage ' + (state.vaultCrackStage + 1) + '/3');
  }

  function updateVaultCrack(dt) {
    if (!state.vaultCrackActive) return;

    state.vaultCrackCueTimer -= dt;

    if (!state.vaultCrackWindowOpen) {
      if (state.vaultCrackCueTimer <= 0) {
        // Open window — player must press E
        state.vaultCrackWindowOpen = true;
        state.vaultCrackWindowTimer = state.vaultCrackWindowDuration;
        // Flash the vault door color as audio cue indicator
        if (state.vaultDoor) state.vaultDoor.material.color.setHex(0xFFFF00);
        showPrompt('>>> PRESS [E] NOW! <<<');
      }
    } else {
      state.vaultCrackWindowTimer -= dt;

      if (state.interactKey) {
        // Success!
        state.vaultCrackStage++;
        state.vaultCrackActive = false;
        state.vaultCrackWindowOpen = false;
        if (state.vaultDoor) state.vaultDoor.material.color.setHex(0x55FF55);
        state.score += 300;
        if (state.vaultCrackStage >= 3) {
          // Vault opened!
          state.vaultLocked = false;
          if (state.vaultDoor) {
            state.vaultDoor.rotation.y = Math.PI / 2;
            state.vaultDoor.material.color.setHex(0x00FF88);
          }
          showPhaseMessage('VAULT OPEN! Collect diamonds before the silent alarm (3 min)!');
          state.score += 1000;
        } else {
          showPhaseMessage('Stage ' + state.vaultCrackStage + '/3 cracked! Press [E] at vault to continue.');
          if (state.vaultDoor) state.vaultDoor.material.color.setHex(0x555555);
        }
      } else if (state.vaultCrackWindowTimer <= 0) {
        // Miss — reset this stage
        state.vaultCrackWindowOpen = false;
        state.vaultCrackCueTimer = CRACK_CUE_INTERVAL;
        if (state.vaultDoor) state.vaultDoor.material.color.setHex(0xFF4444);
        showPhaseMessage('Missed the cue! Try again — press [E] at vault door.');
        state.vaultCrackActive = false;
      }
    }
  }

  // ─── Alarm Timer ─────────────────────────────────────────────────────────
  function updateAlarm(dt) {
    if (state.alarmActive) {
      state.alarmTimer -= dt;
      if (state.alarmTimer <= 0) {
        state.alarmActive = false;
        state.alarmTimer = 0;
        // Reset alerted guards to patrol only if no player in sight
        for (var gi = 0; gi < state.guards.length; gi++) {
          var g = state.guards[gi];
          if (!g.dead && g.alertState === 'called') {
            g.alertState = 'patrol';
          }
        }
      }
    }
  }

  // ─── Animate Props ────────────────────────────────────────────────────────
  function animateProps(dt) {
    // Spin slot machines
    if (state.scene) {
      state.scene.children.forEach(function (child) {
        if (child.geometry && child.geometry.type === 'CylinderGeometry' &&
            child.material && child.material.color &&
            child.material.color.getHex() === 0xFFAA00) {
          child.rotation.y += dt * 0.5;
        }
      });
    }

    // Helicopter rotor spin
    if (state.helicopter) {
      state.helicopter.rotation.y += dt * 3;
    }
  }

  // ─── Nearest Interactable Prompt ─────────────────────────────────────────
  function updateInteractPrompts() {
    var px = state.playerPos.x;
    var pz = state.playerPos.z;

    // Phase-specific prompts (updatePhases handles most, clear if nothing nearby)
    if (_phaseMsgTimer <= 0) {
      var showingPrompt = false;

      // Disguise
      if (state.disguiseMesh && state.disguiseAvailable) {
        if (dist2D(px, pz, state.disguiseMesh.position.x, state.disguiseMesh.position.z) < 2.0) {
          showPrompt('[E] Pick up dealer uniform');
          showingPrompt = true;
        }
      }

      // Key card
      if (!showingPrompt && state.keyCardMesh && !state.keyCardPickedUp) {
        if (dist2D(px, pz, state.keyCardMesh.position.x, state.keyCardMesh.position.z) < 2.0) {
          showPrompt('[E] Pick up key card');
          showingPrompt = true;
        }
      }

      if (!showingPrompt) {
        hidePrompt();
      }
    }
  }

  // ─── Main Update ──────────────────────────────────────────────────────────
  function update(timestamp) {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(update);

    var dt = Math.min((timestamp - (state.lastTime || timestamp)) / 1000, 0.05);
    state.lastTime = timestamp;

    if (state.escaped || state.escapeFailed) {
      state.renderer.render(state.scene, state.camera);
      return;
    }

    movePlayer(dt);
    updateGuards(dt);
    updateAlarm(dt);
    updatePhases(dt);
    animateProps(dt);
    updateInteractPrompts();
    updateHUD();

    state.renderer.render(state.scene, state.camera);
  }

  // ─── Init / Reset ─────────────────────────────────────────────────────────
  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    if (state.active) return;
    state.active = true;

    // Reset runtime state
    state.playerPos = { x: 0, y: PLAYER_HEIGHT, z: 18 };
    state.playerYaw = Math.PI; // face inward
    state.playerPitch = 0;
    state.moveKeys = {};
    state.phase = 1;
    state.disguised = false;
    state.disguiseAvailable = true;
    state.alarmActive = false;
    state.alarmTimer = 0;
    state.ghostRating = true;
    state.diamondsCollected = 0;
    state.score = 0;
    state.camerasFrozen = false;
    state.cameraFreezeTimer = 0;
    state.cameraLoopProgress = 0;
    state.cameraLoopHolding = false;
    state.lasersActive = true;
    state.laserOffTimer = 0;
    state.motionSensorsShot = 0;
    state.guardPatrolTimer = 0;
    state.guardInCorridor = false;
    state.guardCorridorTimer = 0;
    state.vaultLocked = true;
    state.vaultCrackStage = 0;
    state.vaultCrackActive = false;
    state.vaultCrackCueTimer = 0;
    state.vaultCrackWindowOpen = false;
    state.vaultOpenTimer = 0;
    state.silentAlarmActive = false;
    state.keyCardPickedUp = false;
    state.escaped = false;
    state.escapeFailed = false;
    state.escapeRoute = '';
    state.stunned = false;
    state.stunTimer = 0;
    state.pointerLocked = false;
    state.lastTime = 0;
    state.laserLines = null;
    _phaseMsg = null;
    _phaseMsgTimer = 0;

    // Renderer
    state.canvas = document.createElement('canvas');
    state.canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;display:block;';
    document.body.appendChild(state.canvas);
    state._canvas = state.canvas;

    state.renderer = new THREE.WebGLRenderer({ canvas: state.canvas, antialias: true });
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.setClearColor(0x0a0a0a);

    state.scene = new THREE.Scene();
    state.scene.fog = new THREE.Fog(0x0a0505, 20, 80);

    state.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    state.camera.position.set(state.playerPos.x, state.playerPos.y + 0.4, state.playerPos.z);
    state.camera.rotation.order = 'YXZ';
    state.camera.rotation.y = state.playerYaw;

    state.raycaster = new THREE.Raycaster();

    buildScene();
    buildHUD();
    setupInput();

    // Resize handler
    state._resizeHandler = function () {
      state.renderer.setSize(window.innerWidth, window.innerHeight);
      state.camera.aspect = window.innerWidth / window.innerHeight;
      state.camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', state._resizeHandler);

    // Request pointer lock
    state.canvas.addEventListener('click', function () {
      if (!state.pointerLocked) state.canvas.requestPointerLock();
    });

    showPhaseMessage('DIAMOND HEIST ACTIVATED! [D+H]\nPHASE 1: INFILTRATE — Find disguise or stay hidden!\nClick to lock mouse | ESC to quit');

    requestAnimationFrame(update);
  }

  function reset() {
    state.active = false;

    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }

    // Exit pointer lock
    if (document.exitPointerLock) document.exitPointerLock();

    // Remove DOM elements
    if (state.canvas && state.canvas.parentNode) {
      state.canvas.parentNode.removeChild(state.canvas);
      state.canvas = null;
    }
    if (state.hudEl && state.hudEl.parentNode) {
      state.hudEl.parentNode.removeChild(state.hudEl);
      state.hudEl = null;
    }
    if (state.promptEl && state.promptEl.parentNode) {
      state.promptEl.parentNode.removeChild(state.promptEl);
      state.promptEl = null;
    }
    if (state.endEl && state.endEl.parentNode) {
      state.endEl.parentNode.removeChild(state.endEl);
      state.endEl = null;
    }
    if (state._crosshairEl && state._crosshairEl.parentNode) {
      state._crosshairEl.parentNode.removeChild(state._crosshairEl);
      state._crosshairEl = null;
    }

    // Remove event listeners
    removeInput();
    if (state._resizeHandler) {
      window.removeEventListener('resize', state._resizeHandler);
      state._resizeHandler = null;
    }

    // Dispose Three.js objects
    if (state.renderer) {
      state.renderer.dispose();
      state.renderer = null;
    }
    if (state.scene) {
      state.scene.traverse(function (obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(function (m) { m.dispose(); });
          } else {
            obj.material.dispose();
          }
        }
      });
      state.scene = null;
    }
    state.camera = null;
    state.guards = [];
    state.diamonds = [];
    state.motionSensors = [];
    state.laserLines = null;
    state.vaultDoor = null;
    state.disguiseMesh = null;
    state.keyCardMesh = null;
    state.getawayCar = null;
    state.helicopter = null;
    state.raycaster = null;
    state.dDown = false;
    state.hDown = false;
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    reset: reset
  };

}());
