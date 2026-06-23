(function (window) {
  'use strict';

  // ─── State ─────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    // activation keys (C + H simultaneous within 400ms)
    cDown: false,
    hDown: false,
    cDownTime: 0,
    hDownTime: 0,
    // scene
    scene: null,
    camera: null,
    renderer: null,
    animFrameId: null,
    lastTime: 0,
    // player
    player: null,
    playerMesh: null,
    playerYaw: 0,
    playerPitch: 0,
    moveKeys: {},
    pointerLocked: false,
    // heist phases: 1=blend in, 2=execute, 3=escape
    phase: 1,
    phaseTimer: 60,      // phase 1 recon 60s
    phaseStartTime: 0,
    // disguise
    disguiseOn: false,
    disguiseMesh: null,
    // score / loot
    chips: 0,
    vaultCash: 0,
    gemstone: 0,
    highRollerLoot: 0,
    briefcasesFound: 0,
    totalScore: 0,
    // vault cracking
    vaultCombos: 0,       // 0–3
    vaultCracking: false,
    vaultCrackTimer: 0,
    vaultCrackDuration: 8,
    vaultOpen: false,
    vaultDoor: null,
    vaultCashMeshes: [],
    gemstoneMesh: null,
    // police timer (phase 3) 5 minutes = 300s
    policeTimer: 300,
    policeArrived: false,
    // clean operation bonus: each extra minute of clean = +200
    cleanMinutes: 0,
    cleanTimer: 0,
    // chip counting AI
    chipsFromFloor: 0,
    managerCalled: false,
    // alarm
    alarmTriggered: false,
    alarmTimer: 0,
    // guards
    guards: [],
    guardCount: 8,
    guardStations: [],
    // cameras
    cameras3d: [],
    cameraCount: 4,
    // bluff / distract
    distractTarget: null,
    distractTimer: 0,
    // high roller NPC
    highRollerMesh: null,
    highRollerPos: { x: 14, y: 0, z: -10 },
    highRollerFollowTimer: 0,
    highRollerPickpocketed: false,
    hasKeycard: false,
    // VIP room
    vipRoomEntered: false,
    vipDoor: null,
    // briefcases (money laundering)
    briefcaseMeshes: [],
    briefcasesCollected: 0,
    accountantFled: false,
    accountantMesh: null,
    // getaway car
    getawayCar: null,
    escaped: false,
    // HUD
    hudEl: null,
    // interact prompt
    promptEl: null,
    // end overlay
    endEl: null,
    // gambling tables loot
    tableChips: [],       // per-table remaining chip count
    tableMeshes: [],
    // slot machines
    slotMachines: [],
    // mission state
    missionFailed: false,
    missionClear: false,
    // interact throttle
    lastInteractTime: 0,
    // panic buttons
    panicButtons: [],
    // camera disabled flags
    cameraDisabled: [],
    // key listeners
    keydownHandler: null,
    keyupHandler: null,
    mousemoveHandler: null,
    clickHandler: null
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────
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

  function dist3D(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function setColor(mesh, hex) {
    if (mesh && mesh.material) {
      mesh.material.color.setHex(hex);
    }
  }

  // ─── Build Scene ───────────────────────────────────────────────────────────
  function buildScene() {
    var s = state.scene;

    // Ambient + directional light
    var ambient = new THREE.AmbientLight(0xffeedd, 0.6);
    s.add(ambient);
    var dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(10, 20, 10);
    s.add(dir);

    // Casino floor: main hall 40x4x30 (0xAA9944 gold carpet)
    var floor = makeBox(40, 4, 30, 0xAA9944, 0, -2, 0);
    s.add(floor);

    // Ceiling
    var ceiling = makeBox(40, 0.5, 30, 0x554422, 0, 4.25, 0);
    s.add(ceiling);

    // Walls
    var wallN = makeBox(40, 8, 0.5, 0x886633, 0, 0, -15);
    s.add(wallN);
    var wallS = makeBox(40, 8, 0.5, 0x886633, 0, 0, 15);
    s.add(wallS);
    var wallE = makeBox(0.5, 8, 30, 0x886633, 20, 0, 0);
    s.add(wallE);
    var wallW = makeBox(0.5, 8, 30, 0x886633, -20, 0, 0);
    s.add(wallW);

    // 8 gambling tables (2x1x1, 0x226622 green felt)
    var tablePositions = [
      [-12, 0, -6], [-6, 0, -6], [0, 0, -6], [6, 0, -6],
      [-12, 0, 4],  [-6, 0, 4],  [0, 0, 4],  [6, 0, 4]
    ];
    state.tableMeshes = [];
    state.tableChips = [];
    for (var ti = 0; ti < tablePositions.length; ti++) {
      var tp = tablePositions[ti];
      var table = makeBox(2, 1, 1, 0x226622, tp[0], 0.5, tp[2]);
      s.add(table);
      state.tableMeshes.push(table);
      state.tableChips.push(3); // 3 chips per table

      // Chips on each table: gold, red, blue cylinders
      var chipColors = [0xFFD700, 0xFF2200, 0x0044FF];
      for (var ci = 0; ci < 3; ci++) {
        var chip = makeCylinder(0.12, 0.12, 0.05, chipColors[ci],
          tp[0] + (ci - 1) * 0.3, 1.05, tp[2]);
        s.add(chip);
      }
    }

    // Slot machines: BoxGeometry 1x2x0.5 (0x888844) x12 along walls
    state.slotMachines = [];
    var slotPositionsW = [-19, -16, -13, -10, -7, -4];
    var slotPositionsE = [-19, -16, -13, -10, -7, -4];
    for (var si = 0; si < 6; si++) {
      var slotW = makeBox(1, 2, 0.5, 0x888844, -18.5, 1, slotPositionsW[si]);
      s.add(slotW);
      state.slotMachines.push(slotW);
      var slotE = makeBox(1, 2, 0.5, 0x888844, 18.5, 1, slotPositionsE[si]);
      s.add(slotE);
      state.slotMachines.push(slotE);
    }

    // Bar: BoxGeometry 12x3x3 (0x6B4423 mahogany) on south side
    var bar = makeBox(12, 3, 3, 0x6B4423, 0, 1.5, 11);
    s.add(bar);

    // VIP room: BoxGeometry 8x4x8 (0xCC9922 gilded) back-right
    var vipRoom = makeBox(8, 4, 8, 0xCC9922, 14, 2, -10);
    s.add(vipRoom);

    // VIP door (keycard lock) 0x445544 steel
    state.vipDoor = makeBox(1.5, 3, 0.3, 0x445544, 10.25, 1.5, -10);
    s.add(state.vipDoor);

    // Vault: BoxGeometry 6x4x6 (0xBB9922) at back behind steel door
    var vault = makeBox(6, 4, 6, 0xBB9922, -14, 2, -11);
    s.add(vault);

    // Vault steel door 0x445544
    state.vaultDoor = makeBox(2, 3.5, 0.4, 0x445544, -11.1, 1.75, -11);
    s.add(state.vaultDoor);

    // Vault contents: 10 cash stacks (0x00AA44) + gemstone (0xCC44FF)
    state.vaultCashMeshes = [];
    for (var ki = 0; ki < 10; ki++) {
      var cx = -16 + (ki % 5) * 1.1;
      var cz = -12 + Math.floor(ki / 5) * 1.1;
      var cash = makeBox(0.5, 0.3, 0.3, 0x00AA44, cx, 0.15, cz);
      cash.visible = false; // hidden until vault opens
      s.add(cash);
      state.vaultCashMeshes.push(cash);
    }
    state.gemstoneMesh = makeBox(0.4, 0.4, 0.4, 0xCC44FF, -14, 0.2, -11);
    state.gemstoneMesh.visible = false;
    s.add(state.gemstoneMesh);

    // 8 guards patrol (0x334466)
    state.guards = [];
    var guardStartPositions = [
      { x: -8, z: -8 }, { x: 4, z: -8 }, { x: -8, z: 2 }, { x: 4, z: 2 },
      { x: -14, z: 0 }, { x: 12, z: 0 }, { x: 0, z: -13 }, { x: 0, z: 12 }
    ];
    state.guardStations = [];
    for (var gi = 0; gi < 8; gi++) {
      var gp = guardStartPositions[gi];
      var guard = makeBox(0.6, 1.8, 0.6, 0x334466, gp.x, 0.9, gp.z);
      s.add(guard);
      // Panic button at guard station
      var pb = makeBox(0.3, 0.3, 0.3, 0xFF2200,
        gp.x + 0.8, 0.6, gp.z);
      s.add(pb);
      state.panicButtons.push({ mesh: pb, guardIndex: gi, disabled: false });
      var circuit = makeBox(0.2, 0.2, 0.2, 0x226622,
        gp.x + 0.8, 1.0, gp.z);
      s.add(circuit);
      state.guards.push({
        mesh: guard,
        pos: { x: gp.x, y: 0.9, z: gp.z },
        patrolAngle: (gi / 8) * Math.PI * 2,
        patrolRadius: 3,
        patrolBaseX: gp.x,
        patrolBaseZ: gp.z,
        alerted: false,
        alertTimer: 0,
        distractedTimer: 0,
        station: { x: gp.x, z: gp.z },
        circuit: circuit,
        circuitDisabled: false
      });
      state.guardStations.push({ x: gp.x, z: gp.z });
    }

    // 4 cameras (CylinderGeometry) with 45-degree cones
    state.cameras3d = [];
    state.cameraDisabled = [];
    var camPositions = [
      { x: -10, z: -13, angle: 0 },
      { x: 10, z: -13, angle: Math.PI },
      { x: -10, z: 13, angle: Math.PI / 2 },
      { x: 10, z: 13, angle: -Math.PI / 2 }
    ];
    for (var cami = 0; cami < 4; cami++) {
      var cp = camPositions[cami];
      var camBody = makeCylinder(0.2, 0.15, 0.5, 0x334466, cp.x, 3.8, cp.z);
      s.add(camBody);
      // Cone representing 45-deg FOV
      var coneGeo = new THREE.CylinderGeometry(0, 2, 4, 8, 1, true);
      var coneMat = new THREE.MeshLambertMaterial({
        color: 0xFF4400,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
      });
      var cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(cp.x, 2.0, cp.z);
      cone.rotation.z = Math.PI;
      s.add(cone);
      state.cameras3d.push({
        body: camBody,
        cone: cone,
        pos: { x: cp.x, y: 3.8, z: cp.z },
        angle: cp.angle,
        sweepDir: 1,
        disabled: false
      });
      state.cameraDisabled.push(false);
    }

    // High roller NPC: CylinderGeometry 1.2 (0xAA8833) at VIP table
    state.highRollerMesh = makeCylinder(0.4, 0.4, 1.2, 0xAA8833,
      state.highRollerPos.x, 0.6, state.highRollerPos.z);
    s.add(state.highRollerMesh);

    // Accountant NPC
    state.accountantMesh = makeBox(0.5, 1.6, 0.5, 0x558855, 8, 0.8, 8);
    s.add(state.accountantMesh);

    // Briefcases (0x336633) money laundering — 3 scattered
    state.briefcaseMeshes = [];
    var briefcasePositions = [
      { x: -17, z: 10 }, { x: 7, z: -12 }, { x: 15, z: 8 }
    ];
    for (var bi = 0; bi < 3; bi++) {
      var bp = briefcasePositions[bi];
      var briefcase = makeBox(0.6, 0.4, 0.3, 0x336633, bp.x, 0.2, bp.z);
      s.add(briefcase);
      state.briefcaseMeshes.push({ mesh: briefcase, collected: false, pos: bp });
    }

    // Getaway car: BoxGeometry (0x111122) at south exit
    state.getawayCar = makeBox(3, 1.5, 6, 0x111122, 0, 0.75, 18);
    s.add(state.getawayCar);

    // Player
    state.playerMesh = makeBox(0.6, 1.8, 0.6, 0xCCBB99, 0, 0.9, 5);
    s.add(state.playerMesh);
    state.player = { x: 0, y: 0.9, z: 5 };
  }

  // ─── HUD ───────────────────────────────────────────────────────────────────
  function buildHUD() {
    state.hudEl = document.createElement('div');
    state.hudEl.id = 'casino-heist-hud';
    state.hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#FFD700',
      'font:bold 13px/1.4 monospace',
      'padding:6px 14px',
      'border-radius:6px',
      'z-index:10001',
      'pointer-events:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(state.hudEl);

    state.promptEl = document.createElement('div');
    state.promptEl.id = 'casino-heist-prompt';
    state.promptEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.65)',
      'color:#fff',
      'font:13px monospace',
      'padding:4px 12px',
      'border-radius:4px',
      'z-index:10001',
      'pointer-events:none',
      'display:none'
    ].join(';');
    document.body.appendChild(state.promptEl);

    state.endEl = document.createElement('div');
    state.endEl.id = 'casino-heist-end';
    state.endEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.88)',
      'color:#FFD700',
      'font:bold 24px monospace',
      'padding:30px 50px',
      'border-radius:10px',
      'z-index:10002',
      'text-align:center',
      'display:none',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(state.endEl);
  }

  function updateHUD() {
    if (!state.hudEl) return;
    var policeStr = state.phase === 3
      ? 'POLICE: ' + toMM_SS(state.policeTimer)
      : 'RECON: ' + toMM_SS(state.phaseTimer);
    state.hudEl.textContent = [
      'CASINO',
      '[PHASE: ' + state.phase + ']',
      '[CHIPS: ' + state.chips + ']',
      '[VAULT: ' + state.vaultCombos + '/3]',
      '[DISGUISE: ' + (state.disguiseOn ? 'ON' : 'OFF') + ']',
      '| ' + policeStr
    ].join(' ');
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

  function showEndMessage(msg, sub) {
    if (!state.endEl) return;
    state.endEl.innerHTML = msg + (sub ? '<br><span style="font-size:14px;color:#aaa">' + sub + '</span>' : '');
    state.endEl.style.display = 'block';
    document.exitPointerLock && document.exitPointerLock();
    setTimeout(function () { teardown(); }, 6000);
  }

  // ─── Phase transitions ─────────────────────────────────────────────────────
  function enterPhase(n) {
    state.phase = n;
    if (n === 2) {
      showEndMessage('PHASE 2: EXECUTE', 'Mark exits, grab chips, disable cameras — enter vault!');
      setTimeout(function () {
        if (state.endEl) state.endEl.style.display = 'none';
      }, 3000);
    }
    if (n === 3) {
      state.policeTimer = 300;
      showEndMessage('PHASE 3: ESCAPE!', 'Reach the getaway car before police arrive!');
      setTimeout(function () {
        if (state.endEl) state.endEl.style.display = 'none';
      }, 3000);
    }
    updateHUD();
  }

  // ─── Alarm ─────────────────────────────────────────────────────────────────
  function triggerAlarm() {
    if (state.missionFailed || state.missionClear) return;
    if (state.alarmTriggered) return;
    state.alarmTriggered = true;
    state.alarmTimer = 0;
    // Alert all guards
    for (var i = 0; i < state.guards.length; i++) {
      state.guards[i].alerted = true;
      state.guards[i].alertTimer = 0;
    }
    if (state.phase < 3) enterPhase(3);
    updateHUD();
  }

  // ─── Disguise ──────────────────────────────────────────────────────────────
  function wearDisguise() {
    if (state.disguiseOn) return;
    state.disguiseOn = true;
    // Tuxedo overlay: BoxGeometry 0x111133 placed on player
    if (!state.disguiseMesh) {
      var geo = new THREE.BoxGeometry(0.65, 1.85, 0.65);
      var mat = new THREE.MeshLambertMaterial({ color: 0x111133, transparent: true, opacity: 0.7 });
      state.disguiseMesh = new THREE.Mesh(geo, mat);
    }
    state.scene.add(state.disguiseMesh);
    updateHUD();
  }

  function removeDisguise() {
    if (!state.disguiseOn) return;
    state.disguiseOn = false;
    if (state.disguiseMesh && state.scene) {
      state.scene.remove(state.disguiseMesh);
    }
    updateHUD();
  }

  // ─── Nearest object helpers ────────────────────────────────────────────────
  function nearestTable() {
    var best = null;
    var bestD = 3;
    for (var i = 0; i < state.tableMeshes.length; i++) {
      var tm = state.tableMeshes[i];
      var d = dist2D(state.player.x, state.player.z, tm.position.x, tm.position.z);
      if (d < bestD && state.tableChips[i] > 0) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  function nearestGuard() {
    var best = null;
    var bestD = 3.5;
    for (var i = 0; i < state.guards.length; i++) {
      var g = state.guards[i];
      var d = dist2D(state.player.x, state.player.z, g.pos.x, g.pos.z);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  function nearVault() {
    return dist2D(state.player.x, state.player.z, -11.1, -11) < 3;
  }

  function nearVipDoor() {
    return dist2D(state.player.x, state.player.z, 10.25, -10) < 2.5;
  }

  function nearHighRoller() {
    return dist2D(state.player.x, state.player.z,
      state.highRollerPos.x, state.highRollerPos.z) < 2.5;
  }

  function nearGetaway() {
    return dist2D(state.player.x, state.player.z, 0, 18) < 4;
  }

  function nearVaultInside() {
    return dist2D(state.player.x, state.player.z, -14, -11) < 4 && state.vaultOpen;
  }

  function nearBriefcase() {
    for (var i = 0; i < state.briefcaseMeshes.length; i++) {
      var b = state.briefcaseMeshes[i];
      if (!b.collected) {
        var d = dist2D(state.player.x, state.player.z, b.pos.x, b.pos.z);
        if (d < 2.5) return i;
      }
    }
    return -1;
  }

  // ─── Interact (E key) ──────────────────────────────────────────────────────
  function interact() {
    var now = Date.now();
    if (now - state.lastInteractTime < 500) return;
    state.lastInteractTime = now;

    if (state.missionFailed || state.missionClear || state.escaped) return;

    // Grab chips from nearest table
    var ti = nearestTable();
    if (ti !== null) {
      state.tableChips[ti]--;
      state.chips += 50;
      state.chipsFromFloor += 50;
      setColor(state.tableMeshes[ti], state.tableChips[ti] === 0 ? 0x114411 : 0x226622);
      if (state.chipsFromFloor >= 500 && !state.managerCalled) {
        state.managerCalled = true;
        showPrompt('Casino AI flagged you! Manager calling police...');
        setTimeout(function () {
          if (!state.missionFailed) triggerAlarm();
        }, 5000);
      }
      updateHUD();
      return;
    }

    // Crack vault
    if (nearVault() && !state.vaultOpen) {
      if (state.phase < 2) {
        showPrompt('Enter PHASE 2 first!');
        return;
      }
      if (!state.vaultCracking) {
        state.vaultCracking = true;
        state.vaultCrackTimer = state.vaultCrackDuration;
        showPrompt('Cracking combination ' + (state.vaultCombos + 1) + '/3...');
      }
      return;
    }

    // Collect vault cash/gem if vault open
    if (nearVaultInside()) {
      var grabbed = false;
      for (var ci = 0; ci < state.vaultCashMeshes.length; ci++) {
        if (state.vaultCashMeshes[ci].visible) {
          state.scene.remove(state.vaultCashMeshes[ci]);
          state.vaultCashMeshes[ci].visible = false;
          state.vaultCash += 100;
          grabbed = true;
          break;
        }
      }
      if (!grabbed && state.gemstoneMesh && state.gemstoneMesh.visible) {
        state.scene.remove(state.gemstoneMesh);
        state.gemstoneMesh.visible = false;
        state.gemstone += 500;
        grabbed = true;
      }
      if (grabbed) {
        state.chips += 0; // vault loot separate
        showPrompt('Loot secured! Total vault: $' + (state.vaultCash + state.gemstone));
      }
      updateHUD();
      return;
    }

    // VIP door
    if (nearVipDoor()) {
      if (state.hasKeycard) {
        if (state.vipDoor) {
          state.scene.remove(state.vipDoor);
          state.vipDoor = null;
        }
        state.vipRoomEntered = true;
        showPrompt('VIP Room unlocked!');
      } else {
        showPrompt('Keycard required. Pickpocket the high roller...');
      }
      return;
    }

    // Pickpocket high roller
    if (nearHighRoller() && !state.highRollerPickpocketed) {
      state.highRollerPickpocketed = true;
      state.hasKeycard = true;
      state.highRollerLoot += 300;
      state.chips += 0;
      showPrompt('+300 | Keycard obtained from high roller!');
      return;
    }

    // Distract guard
    var gi = nearestGuard();
    if (gi !== null && state.disguiseOn) {
      state.guards[gi].distractedTimer = 20;
      state.guards[gi].alerted = false;
      showPrompt('Guard distracted for 20s!');
      return;
    }

    // Collect briefcase
    var bci = nearBriefcase();
    if (bci >= 0) {
      state.briefcaseMeshes[bci].collected = true;
      state.scene.remove(state.briefcaseMeshes[bci].mesh);
      state.briefcasesCollected++;
      showPrompt('Briefcase ' + state.briefcasesCollected + '/3 collected!');
      if (state.briefcasesCollected >= 3 && !state.accountantFled) {
        state.accountantFled = true;
        if (state.accountantMesh) state.scene.remove(state.accountantMesh);
        state.chips += 0; // separate bonus
        state.totalScore += 400;
        showPrompt('+400 bonus! Corrupt accountant fled — money laundering complete!');
      }
      return;
    }

    // Escape via getaway car
    if (nearGetaway() && state.phase === 3) {
      state.escaped = true;
      state.missionClear = true;
      // Calculate final score
      var lootTotal = state.chips * 1 + state.vaultCash + state.gemstone + state.highRollerLoot + state.totalScore;
      var policeBonus = 0;
      if (!state.policeArrived) {
        var minutesClean = Math.floor((300 - state.policeTimer) / 60);
        policeBonus = minutesClean * 200;
      }
      lootTotal += policeBonus;
      showEndMessage(
        'HEIST COMPLETE!',
        'Score: $' + lootTotal + (policeBonus ? ' (+$' + policeBonus + ' clean bonus)' : '')
      );
      return;
    }
  }

  // ─── Guard AI ──────────────────────────────────────────────────────────────
  function updateGuards(dt) {
    for (var i = 0; i < state.guards.length; i++) {
      var g = state.guards[i];

      if (g.distractedTimer > 0) {
        g.distractedTimer -= dt;
        continue;
      }

      // Patrol
      g.patrolAngle += dt * 0.5;
      var nx = g.patrolBaseX + Math.cos(g.patrolAngle) * g.patrolRadius;
      var nz = g.patrolBaseZ + Math.sin(g.patrolAngle) * g.patrolRadius;
      g.pos.x = nx;
      g.pos.z = nz;
      g.mesh.position.x = nx;
      g.mesh.position.z = nz;

      // Line of sight to player
      var dToPlayer = dist2D(state.player.x, state.player.z, g.pos.x, g.pos.z);
      if (dToPlayer < 6 && !state.disguiseOn && !g.circuitDisabled) {
        if (!g.alerted) {
          g.alerted = true;
          g.alertTimer = 0;
        }
      }

      if (g.alerted) {
        g.alertTimer += dt;
        // Chase player
        var dx = state.player.x - g.pos.x;
        var dz = state.player.z - g.pos.z;
        var len = Math.sqrt(dx * dx + dz * dz);
        if (len > 0.1) {
          g.pos.x += (dx / len) * 3 * dt;
          g.pos.z += (dz / len) * 3 * dt;
          g.mesh.position.x = g.pos.x;
          g.mesh.position.z = g.pos.z;
        }
        if (dToPlayer < 1.5) {
          // Caught player
          if (!state.disguiseOn) {
            state.missionFailed = true;
            showEndMessage('CAUGHT BY SECURITY', 'The guard tackled you. Heist failed.');
          }
        }
        // After 20s alert, return to patrol
        if (g.alertTimer > 20) {
          g.alerted = false;
          g.alertTimer = 0;
        }
      }

      // Disguised: guards ignore unless weapon drawn (alarm triggered)
      if (state.alarmTriggered) {
        g.alerted = true;
      }
    }
  }

  // ─── Camera sweep + detection ───────────────────────────────────────────────
  function updateCameras(dt) {
    for (var i = 0; i < state.cameras3d.length; i++) {
      var cam = state.cameras3d[i];
      if (cam.disabled) continue;

      // Sweep camera angle
      cam.angle += cam.sweepDir * dt * 0.4;
      if (cam.angle > Math.PI / 2) cam.sweepDir = -1;
      if (cam.angle < -Math.PI / 2) cam.sweepDir = 1;

      // Rotate cone
      cam.cone.rotation.y = cam.angle;

      // Detection: check if player in 45-degree cone in 8-unit radius
      var dx = state.player.x - cam.pos.x;
      var dz = state.player.z - cam.pos.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d < 8) {
        var angleToPlayer = Math.atan2(dx, dz);
        var angleDiff = Math.abs(angleToPlayer - cam.angle);
        while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - 2 * Math.PI);
        if (angleDiff < Math.PI / 4 && !state.disguiseOn) {
          triggerAlarm();
        }
      }
    }
  }

  // ─── High roller follow track ───────────────────────────────────────────────
  function updateHighRoller(dt) {
    if (state.highRollerPickpocketed) return;

    // High roller occasionally walks toward VIP room
    if (!state.hasKeycard) {
      var dToHR = dist2D(state.player.x, state.player.z,
        state.highRollerPos.x, state.highRollerPos.z);
      if (dToHR < 4) {
        state.highRollerFollowTimer += dt;
        if (state.highRollerFollowTimer >= 30 && !state.vipRoomEntered) {
          // High roller leads to VIP room — player can follow
          state.highRollerPos.x += (10.25 - state.highRollerPos.x) * dt * 0.5;
          state.highRollerPos.z += (-10 - state.highRollerPos.z) * dt * 0.5;
          state.highRollerMesh.position.x = state.highRollerPos.x;
          state.highRollerMesh.position.z = state.highRollerPos.z;
          if (dist2D(state.highRollerPos.x, state.highRollerPos.z, 10.25, -10) < 1) {
            // Arrived — door opens briefly
            if (state.vipDoor) {
              state.scene.remove(state.vipDoor);
              state.vipDoor = null;
            }
          }
        }
      } else {
        state.highRollerFollowTimer = Math.max(0, state.highRollerFollowTimer - dt * 2);
      }
    }
  }

  // ─── Vault cracking ────────────────────────────────────────────────────────
  function updateVaultCracking(dt) {
    if (!state.vaultCracking) return;
    state.vaultCrackTimer -= dt;
    showPrompt('Cracking combo ' + (state.vaultCombos + 1) + '/3: ' +
      Math.ceil(state.vaultCrackTimer) + 's...');
    if (state.vaultCrackTimer <= 0) {
      state.vaultCombos++;
      state.vaultCracking = false;
      updateHUD();
      if (state.vaultCombos >= 3) {
        state.vaultOpen = true;
        // Open vault door
        if (state.vaultDoor) {
          state.vaultDoor.position.x -= 2.5;
        }
        // Reveal contents
        for (var i = 0; i < state.vaultCashMeshes.length; i++) {
          state.vaultCashMeshes[i].visible = true;
        }
        if (state.gemstoneMesh) state.gemstoneMesh.visible = true;
        showPrompt('Vault OPEN! Grab the loot! (E near cash/gem)');
      } else {
        showPrompt('Combo ' + state.vaultCombos + '/3 cracked! Press E again at vault...');
      }
    }
  }

  // ─── Phase timers ──────────────────────────────────────────────────────────
  function updatePhaseTimers(dt) {
    if (state.phase === 1) {
      state.phaseTimer -= dt;
      updateHUD();
      if (state.phaseTimer <= 0) {
        enterPhase(2);
      }
    } else if (state.phase === 3) {
      state.policeTimer -= dt;
      updateHUD();
      if (state.policeTimer <= 0 && !state.policeArrived) {
        state.policeArrived = true;
        // Add extra guards going toward player
        for (var i = 0; i < state.guards.length; i++) {
          state.guards[i].alerted = true;
          state.guards[i].alertTimer = 0;
          state.guards[i].patrolRadius = 0;
        }
        showPrompt('POLICE ARRIVED! Run to the getaway car!');
        setColor(state.getawayCar, 0x2222AA);
      }
      if (state.policeArrived && state.policeTimer < -30) {
        state.missionFailed = true;
        showEndMessage('ARRESTED', 'Police swarmed the casino. You didn\'t make it out.');
      }
    }

    // Phase 2 transition trigger: if vault fully looted, auto-advance to phase 3
    if (state.phase === 2 && state.vaultCombos >= 3 && state.vaultOpen) {
      var totalLootableCash = state.vaultCashMeshes.length * 100 + 500; // cash + gem
      var alreadyGrabbed = state.vaultCash + state.gemstone;
      if (alreadyGrabbed >= totalLootableCash) {
        enterPhase(3);
      }
    }

    // Clean operation timer (phase 2 with no alarm)
    if (state.phase === 2 && !state.alarmTriggered) {
      state.cleanTimer += dt;
      if (state.cleanTimer >= 60) {
        state.cleanTimer -= 60;
        state.cleanMinutes++;
        state.totalScore += 200;
        showPrompt('+200 clean operation bonus!');
      }
    }
  }

  // ─── Proximity prompts ─────────────────────────────────────────────────────
  function updateProximityPrompts() {
    if (state.vaultCracking || state.missionFailed || state.missionClear) return;

    var ti = nearestTable();
    if (ti !== null) {
      showPrompt('[E] Steal chips from table (' + state.tableChips[ti] + ' left, +50 each)');
      return;
    }
    if (nearVault() && !state.vaultOpen && state.phase >= 2) {
      if (state.vaultCombos < 3) {
        showPrompt('[E] Crack vault combination ' + (state.vaultCombos + 1) + '/3');
      }
      return;
    }
    if (nearVaultInside()) {
      showPrompt('[E] Grab vault loot');
      return;
    }
    if (nearVipDoor()) {
      showPrompt(state.hasKeycard ? '[E] Enter VIP Room' : '[E] Keycard required');
      return;
    }
    if (nearHighRoller() && !state.highRollerPickpocketed) {
      showPrompt('[E] Pickpocket high roller (+300 + keycard)');
      return;
    }
    var gi = nearestGuard();
    if (gi !== null && state.disguiseOn) {
      showPrompt('[E] Distract guard (20s)');
      return;
    }
    var bci = nearBriefcase();
    if (bci >= 0) {
      showPrompt('[E] Collect briefcase (' + (bci + 1) + ')');
      return;
    }
    if (nearGetaway() && state.phase === 3) {
      showPrompt('[E] ESCAPE — board getaway car!');
      return;
    }
    hidePrompt();
  }

  // ─── Player movement ────────────────────────────────────────────────────────
  function updatePlayer(dt) {
    var speed = 5;
    var dx = 0, dz = 0;
    var yaw = state.playerYaw;

    if (state.moveKeys['KeyW'] || state.moveKeys['ArrowUp']) {
      dx -= Math.sin(yaw) * speed * dt;
      dz -= Math.cos(yaw) * speed * dt;
    }
    if (state.moveKeys['KeyS'] || state.moveKeys['ArrowDown']) {
      dx += Math.sin(yaw) * speed * dt;
      dz += Math.cos(yaw) * speed * dt;
    }
    if (state.moveKeys['KeyA'] || state.moveKeys['ArrowLeft']) {
      dx -= Math.cos(yaw) * speed * dt;
      dz += Math.sin(yaw) * speed * dt;
    }
    if (state.moveKeys['KeyD'] || state.moveKeys['ArrowRight']) {
      dx += Math.cos(yaw) * speed * dt;
      dz -= Math.sin(yaw) * speed * dt;
    }

    var nx = state.player.x + dx;
    var nz = state.player.z + dz;
    // Clamp to casino floor bounds
    nx = Math.max(-19, Math.min(19, nx));
    nz = Math.max(-14, Math.min(19, nz));

    state.player.x = nx;
    state.player.z = nz;
    state.playerMesh.position.x = nx;
    state.playerMesh.position.z = nz;
    state.playerMesh.rotation.y = -yaw;

    if (state.disguiseMesh) {
      state.disguiseMesh.position.copy(state.playerMesh.position);
      state.disguiseMesh.rotation.y = state.playerMesh.rotation.y;
    }

    // Camera follow
    var camDist = 8;
    var camHeight = 5;
    var pitch = state.playerPitch;
    state.camera.position.x = nx + Math.sin(yaw) * camDist;
    state.camera.position.z = nz + Math.cos(yaw) * camDist;
    state.camera.position.y = state.player.y + camHeight + Math.sin(pitch) * camDist;
    state.camera.lookAt(nx, state.player.y + 1, nz);
  }

  // ─── Main loop ──────────────────────────────────────────────────────────────
  function loop(ts) {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(loop);

    var dt = Math.min((ts - state.lastTime) / 1000, 0.1);
    state.lastTime = ts;

    if (!state.missionFailed && !state.missionClear && !state.escaped) {
      updatePlayer(dt);
      updateGuards(dt);
      updateCameras(dt);
      updateHighRoller(dt);
      updateVaultCracking(dt);
      updatePhaseTimers(dt);
      updateProximityPrompts();
    }

    state.renderer.render(state.scene, state.camera);
  }

  // ─── Input ──────────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    // Activation check (C + H within 400ms)
    if (e.code === 'KeyC') {
      state.cDown = true;
      state.cDownTime = Date.now();
      if (state.hDown && (Date.now() - state.hDownTime) < 400) {
        if (!state.active) activate();
        return;
      }
    }
    if (e.code === 'KeyH') {
      state.hDown = true;
      state.hDownTime = Date.now();
      if (state.cDown && (Date.now() - state.cDownTime) < 400) {
        if (!state.active) activate();
        return;
      }
    }

    if (!state.active) return;

    state.moveKeys[e.code] = true;

    if (e.code === 'KeyD' && !state.moveKeys['ShiftLeft'] && !state.moveKeys['ShiftRight']) {
      // 'D' in movement context moves player; standalone D (no movement context) handled below
    }

    // D key alone = disguise toggle (only if not using WASD navigation context)
    // We use Shift+D or check if no movement keys pressed for standalone D
    if (e.code === 'KeyD') {
      if (!state.moveKeys['KeyW'] && !state.moveKeys['KeyS'] && !state.moveKeys['KeyA']) {
        if (!state.disguiseOn) {
          wearDisguise();
        } else {
          removeDisguise();
        }
      }
    }

    if (e.code === 'KeyE') {
      interact();
    }

    if (e.code === 'Escape') {
      teardown();
    }
  }

  function onKeyUp(e) {
    if (e.code === 'KeyC') { state.cDown = false; }
    if (e.code === 'KeyH') { state.hDown = false; }
    if (!state.active) return;
    delete state.moveKeys[e.code];
  }

  function onMouseMove(e) {
    if (!state.active || !state.pointerLocked) return;
    state.playerYaw += e.movementX * 0.002;
    state.playerPitch = Math.max(-0.8, Math.min(0.8,
      state.playerPitch - e.movementY * 0.002));
  }

  function onClick() {
    if (!state.active) return;
    if (!state.pointerLocked) {
      state.renderer.domElement.requestPointerLock();
    }
  }

  // ─── Activate / Teardown ────────────────────────────────────────────────────
  function activate() {
    if (state.active) return;
    if (typeof THREE === 'undefined') {
      console.warn('CasinoHeist: THREE.js not found');
      return;
    }
    state.active = true;

    // Reset all state fields
    state.phase = 1;
    state.phaseTimer = 60;
    state.disguiseOn = false;
    state.disguiseMesh = null;
    state.chips = 0;
    state.chipsFromFloor = 0;
    state.managerCalled = false;
    state.vaultCash = 0;
    state.gemstone = 0;
    state.highRollerLoot = 0;
    state.briefcasesCollected = 0;
    state.totalScore = 0;
    state.vaultCombos = 0;
    state.vaultCracking = false;
    state.vaultCrackTimer = 0;
    state.vaultOpen = false;
    state.policeTimer = 300;
    state.policeArrived = false;
    state.cleanMinutes = 0;
    state.cleanTimer = 0;
    state.alarmTriggered = false;
    state.alarmTimer = 0;
    state.guards = [];
    state.guardStations = [];
    state.cameras3d = [];
    state.cameraDisabled = [];
    state.panicButtons = [];
    state.tableMeshes = [];
    state.tableChips = [];
    state.slotMachines = [];
    state.briefcaseMeshes = [];
    state.vaultCashMeshes = [];
    state.highRollerPickpocketed = false;
    state.hasKeycard = false;
    state.vipRoomEntered = false;
    state.highRollerFollowTimer = 0;
    state.accountantFled = false;
    state.escaped = false;
    state.missionFailed = false;
    state.missionClear = false;
    state.moveKeys = {};
    state.playerYaw = 0;
    state.playerPitch = 0;
    state.lastInteractTime = 0;
    state.player = { x: 0, y: 0.9, z: 5 };

    // Renderer
    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.domElement.id = 'casino-heist-canvas';
    state.renderer.domElement.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'z-index:10000',
      'width:100%',
      'height:100%'
    ].join(';');
    document.body.appendChild(state.renderer.domElement);

    // Scene + camera
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x110808);
    state.scene.fog = new THREE.Fog(0x110808, 30, 60);

    state.camera = new THREE.PerspectiveCamera(60,
      window.innerWidth / window.innerHeight, 0.1, 200);
    state.camera.position.set(0, 7, 12);
    state.camera.lookAt(0, 0, 0);

    buildScene();
    buildHUD();
    updateHUD();

    // Event listeners
    state.keydownHandler = onKeyDown;
    state.keyupHandler = onKeyUp;
    state.mousemoveHandler = onMouseMove;
    state.clickHandler = onClick;

    document.addEventListener('keydown', state.keydownHandler);
    document.addEventListener('keyup', state.keyupHandler);
    document.addEventListener('mousemove', state.mousemoveHandler);
    state.renderer.domElement.addEventListener('click', state.clickHandler);

    document.addEventListener('pointerlockchange', function () {
      state.pointerLocked = document.pointerLockElement === state.renderer.domElement;
    });

    state.lastTime = performance.now();
    state.animFrameId = requestAnimationFrame(loop);

    showPrompt('CASINO HEIST — PHASE 1: BLEND IN (60s recon). Press D=Disguise, E=Interact, Esc=Exit');
    setTimeout(function () { hidePrompt(); }, 5000);
  }

  function teardown() {
    if (!state.active) return;
    state.active = false;

    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }

    if (state.keydownHandler) {
      document.removeEventListener('keydown', state.keydownHandler);
    }
    if (state.keyupHandler) {
      document.removeEventListener('keyup', state.keyupHandler);
    }
    if (state.mousemoveHandler) {
      document.removeEventListener('mousemove', state.mousemoveHandler);
    }

    if (state.renderer) {
      state.renderer.domElement.removeEventListener('click', state.clickHandler);
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
    if (state.promptEl && state.promptEl.parentNode) {
      state.promptEl.parentNode.removeChild(state.promptEl);
      state.promptEl = null;
    }
    if (state.endEl && state.endEl.parentNode) {
      state.endEl.parentNode.removeChild(state.endEl);
      state.endEl = null;
    }

    document.exitPointerLock && document.exitPointerLock();
    state.scene = null;
    state.camera = null;
    state.pointerLocked = false;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────
  window.CasinoHeist = {
    activate: activate,
    teardown: teardown,
    getState: function () { return state; }
  };

}(window));
