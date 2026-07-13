window.SpecialForces = (function() {
  'use strict';

  // --- State ---
  var scene, camera, renderer, playerMesh;
  var sfTeam = [];
  var sfActive = false;
  var currentMission = null;
  var missionTimer = 0;
  var missionActive = false;
  var objectives = [];
  var objectivesComplete = 0;
  var guards = [];
  var guardsEliminated = 0;
  var reconBuildings = [];
  var reconVisited = [];
  var c4Charges = [];
  var c4Timers = [];
  var hvtTarget = null;
  var hvtCaptured = false;
  var hvtEliminated = false;
  var exfilMarker = null;
  var exfilActive = false;
  var formationMode = 'diamond';
  var keysDown = {};
  var hudEl = null;
  var menuEl = null;
  var briefingEl = null;
  var c4DisplayEls = [];
  var missionComplete = false;
  var missionFailed = false;
  var teamAlive = 4;
  var clock = null;
  var explosions = [];

  var MISSION_TYPES = {
    DIRECT_ACTION: 'DIRECT_ACTION',
    RECON: 'RECON',
    SABOTAGE: 'SABOTAGE',
    HVT: 'HVT'
  };

  var ROLES = ['BREACHER', 'MEDIC', 'MARKSMAN', 'COMMS'];

  var FORMATIONS = {
    diamond: [
      { x: 0, z: -3 },
      { x: -2.5, z: 1 },
      { x: 2.5, z: 1 },
      { x: 0, z: 3 }
    ],
    line: [
      { x: -4, z: 0 },
      { x: -2, z: 0 },
      { x: 2, z: 0 },
      { x: 4, z: 0 }
    ],
    wedge: [
      { x: 0, z: -3 },
      { x: -2, z: 0 },
      { x: 2, z: 0 },
      { x: 0, z: 2 }
    ],
    column: [
      { x: 0, z: -2 },
      { x: 0, z: -4 },
      { x: 0, z: -6 },
      { x: 0, z: -8 }
    ]
  };

  // --- HUD ---
  function createHUD() {
    if (hudEl) return;
    hudEl = document.createElement('div');
    hudEl.id = 'sf-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:14px',
      'padding:6px 16px',
      'border:1px solid #00ff88',
      'border-radius:4px',
      'z-index:9000',
      'display:none',
      'pointer-events:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(hudEl);
  }

  function updateHUD() {
    if (!hudEl || !missionActive) return;
    var missionLabel = currentMission ? currentMission.replace('_', ' ') : 'NONE';
    var totalObj = objectives.length;
    var mins = Math.floor(missionTimer / 60);
    var secs = Math.floor(missionTimer % 60);
    var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    hudEl.textContent = 'SF OPS [' + missionLabel + '] [' + teamAlive + '/4 TEAM] [OBJ: ' + objectivesComplete + '/' + totalObj + '] | TIME: ' + timeStr;
    hudEl.style.display = 'block';
  }

  // --- Mission Menu ---
  function createMissionMenu() {
    if (menuEl) { menuEl.style.display = 'block'; return; }
    menuEl = document.createElement('div');
    menuEl.id = 'sf-mission-menu';
    menuEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.92)',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:15px',
      'padding:32px 48px',
      'border:2px solid #00ff88',
      'border-radius:8px',
      'z-index:9100',
      'min-width:360px',
      'text-align:center'
    ].join(';');

    var title = document.createElement('div');
    title.textContent = '=== SPECIAL FORCES OPS ===';
    title.style.cssText = 'font-size:18px;font-weight:bold;margin-bottom:20px;color:#fff';
    menuEl.appendChild(title);

    var missions = [
      { key: '1', type: MISSION_TYPES.DIRECT_ACTION, label: '[1] DIRECT ACTION — Eliminate 6 guards, 3 min' },
      { key: '2', type: MISSION_TYPES.RECON, label: '[2] RECON — Gather intel on 3 buildings' },
      { key: '3', type: MISSION_TYPES.SABOTAGE, label: '[3] SABOTAGE — Plant C4, exfil before blast' },
      { key: '4', type: MISSION_TYPES.HVT, label: '[4] HVT — Capture or eliminate high-value target' }
    ];

    for (var i = 0; i < missions.length; i++) {
      (function(m) {
        var btn = document.createElement('div');
        btn.textContent = m.label;
        btn.style.cssText = 'margin:10px 0;padding:10px 16px;border:1px solid #00ff88;border-radius:4px;cursor:pointer;transition:background 0.15s';
        btn.addEventListener('mouseenter', function() { btn.style.background = 'rgba(0,255,136,0.15)'; });
        btn.addEventListener('mouseleave', function() { btn.style.background = ''; });
        btn.addEventListener('click', function() {
          closeMissionMenu();
          startMission(m.type);
        });
        menuEl.appendChild(btn);
      })(missions[i]);
    }

    var closeBtn = document.createElement('div');
    closeBtn.textContent = '[ESC] Close';
    closeBtn.style.cssText = 'margin-top:18px;color:#888;cursor:pointer';
    closeBtn.addEventListener('click', closeMissionMenu);
    menuEl.appendChild(closeBtn);

    document.body.appendChild(menuEl);
  }

  function closeMissionMenu() {
    if (menuEl) menuEl.style.display = 'none';
  }

  // --- Briefing Panel ---
  function createBriefingPanel(title, objs) {
    if (briefingEl) { briefingEl.remove(); briefingEl = null; }
    briefingEl = document.createElement('div');
    briefingEl.id = 'sf-briefing';
    briefingEl.style.cssText = [
      'position:fixed',
      'top:110px',
      'right:24px',
      'background:rgba(0,0,0,0.85)',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:13px',
      'padding:16px 22px',
      'border:1px solid #00ff88',
      'border-radius:6px',
      'z-index:9000',
      'min-width:260px'
    ].join(';');

    var h = document.createElement('div');
    h.textContent = '=== ' + title + ' ===';
    h.style.cssText = 'font-weight:bold;margin-bottom:10px;color:#fff';
    briefingEl.appendChild(h);

    objectives = objs;
    briefingEl._checkboxes = [];
    for (var i = 0; i < objs.length; i++) {
      var row = document.createElement('div');
      row.style.marginBottom = '6px';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.disabled = true;
      cb.style.marginRight = '8px';
      var lbl = document.createElement('span');
      lbl.textContent = objs[i];
      row.appendChild(cb);
      row.appendChild(lbl);
      briefingEl.appendChild(row);
      briefingEl._checkboxes.push(cb);
    }

    document.body.appendChild(briefingEl);
  }

  function tickObjective(idx) {
    if (!briefingEl || !briefingEl._checkboxes) return;
    if (briefingEl._checkboxes[idx] && !briefingEl._checkboxes[idx].checked) {
      briefingEl._checkboxes[idx].checked = true;
      objectivesComplete++;
    }
  }

  function removeBriefing() {
    if (briefingEl) { briefingEl.remove(); briefingEl = null; }
  }

  // --- Team Creation ---
  function buildTeamMember(role, idx) {
    var group = new THREE.Group();

    var bodyGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.5, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.75;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.3, 10, 10);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.8;
    group.add(head);

    // Role equipment
    if (role === 'BREACHER') {
      var chargeGeo = new THREE.BoxGeometry(0.5, 0.3, 0.15);
      var chargeMat = new THREE.MeshLambertMaterial({ color: 0xFF2200 });
      var charge = new THREE.Mesh(chargeGeo, chargeMat);
      charge.position.set(0.5, 1.0, 0);
      group.add(charge);
    } else if (role === 'MEDIC') {
      var crossMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
      var crossH = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.08), crossMat);
      crossH.position.set(0, 2.15, 0);
      group.add(crossH);
      var crossV = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.08), crossMat);
      crossV.position.set(0, 2.15, 0);
      group.add(crossV);
    } else if (role === 'MARKSMAN') {
      var rifleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6);
      var rifleMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var rifle = new THREE.Mesh(rifleGeo, rifleMat);
      rifle.rotation.z = Math.PI / 2;
      rifle.position.set(0.6, 1.2, 0);
      group.add(rifle);
    } else if (role === 'COMMS') {
      var radioGeo = new THREE.BoxGeometry(0.25, 0.4, 0.12);
      var radioMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
      var radio = new THREE.Mesh(radioGeo, radioMat);
      radio.position.set(-0.45, 1.1, 0);
      group.add(radio);
    }

    group.userData = {
      role: role,
      idx: idx,
      targetOffset: FORMATIONS.diamond[idx],
      alive: true,
      moving: false,
      velocity: new THREE.Vector3()
    };

    return group;
  }

  function spawnTeam(sc) {
    var i, j, member;
    for (i = 0; i < sfTeam.length; i++) {
      sc.remove(sfTeam[i]);
    }
    sfTeam = [];
    teamAlive = 4;
    for (j = 0; j < 4; j++) {
      member = buildTeamMember(ROLES[j], j);
      member.position.set(
        (playerMesh ? playerMesh.position.x : 0) + FORMATIONS.diamond[j].x,
        0,
        (playerMesh ? playerMesh.position.z : 0) + FORMATIONS.diamond[j].z
      );
      sc.add(member);
      sfTeam.push(member);
    }
  }

  // --- Formation Update ---
  function setFormation(mode) {
    formationMode = mode;
    for (var i = 0; i < sfTeam.length; i++) {
      sfTeam[i].userData.targetOffset = FORMATIONS[mode][i];
    }
  }

  function updateTeamFormation(dt) {
    if (!playerMesh) return;
    var px = playerMesh.position.x;
    var pz = playerMesh.position.z;
    var speed = (currentMission === MISSION_TYPES.RECON) ? 2.0 : 5.0;

    for (var i = 0; i < sfTeam.length; i++) {
      var m = sfTeam[i];
      if (!m.userData.alive) continue;
      var off = m.userData.targetOffset;
      var tx = px + off.x;
      var tz = pz + off.z;
      var dx = tx - m.position.x;
      var dz = tz - m.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 0.1) {
        var step = Math.min(speed * dt, dist);
        m.position.x += (dx / dist) * step;
        m.position.z += (dz / dist) * step;
      }
      // Crouch in RECON
      if (currentMission === MISSION_TYPES.RECON) {
        m.scale.y = 0.75;
        m.position.y = -0.3;
      } else {
        m.scale.y = 1.0;
        m.position.y = 0;
      }
    }
  }

  // --- Guards (DIRECT_ACTION) ---
  function spawnGuards(sc) {
    var k, i, angle, r, bodyGeo, bodyMat, body, headGeo, headMat, head;
    for (k = 0; k < guards.length; k++) {
      if (guards[k].mesh) sc.remove(guards[k].mesh);
    }
    guards = [];
    guardsEliminated = 0;
    r = 15;
    for (i = 0; i < 6; i++) {
      angle = (i / 6) * Math.PI * 2;
      bodyGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.5, 8);
      bodyMat = new THREE.MeshLambertMaterial({ color: 0x885500 });
      body = new THREE.Mesh(bodyGeo, bodyMat);
      headGeo = new THREE.SphereGeometry(0.3, 8, 8);
      headMat = new THREE.MeshLambertMaterial({ color: 0xCC8844 });
      head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 1.0;
      body.add(head);
      body.position.set(Math.cos(angle) * r, 0.75, Math.sin(angle) * r);
      sc.add(body);
      guards.push({ mesh: body, hp: 100, alive: true, idx: i });
    }
  }

  function updateGuards(dt, playerPos) {
    if (currentMission !== MISSION_TYPES.DIRECT_ACTION) return;
    for (var i = 0; i < guards.length; i++) {
      var g = guards[i];
      if (!g.alive) continue;
      var dx = playerPos.x - g.mesh.position.x;
      var dz = playerPos.z - g.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 2.5 && !missionComplete && !missionFailed) {
        g.alive = false;
        g.mesh.visible = false;
        guardsEliminated++;
        tickObjective(Math.min(guardsEliminated - 1, objectives.length - 1));
        if (guardsEliminated >= 6) {
          onMissionObjectivesComplete();
        }
      }
    }
  }

  // --- RECON Buildings ---
  function spawnReconBuildings(sc) {
    var k, i, geo, mat, mesh, markerGeo, markerMat, marker;
    for (k = 0; k < reconBuildings.length; k++) {
      if (reconBuildings[k].mesh) sc.remove(reconBuildings[k].mesh);
    }
    reconBuildings = [];
    reconVisited = [false, false, false];
    var positions = [
      { x: 20, z: 0 },
      { x: -15, z: 20 },
      { x: 10, z: -20 }
    ];
    for (i = 0; i < 3; i++) {
      geo = new THREE.BoxGeometry(6, 5, 6);
      mat = new THREE.MeshLambertMaterial({ color: 0x334455 });
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(positions[i].x, 2.5, positions[i].z);
      sc.add(mesh);

      markerGeo = new THREE.CylinderGeometry(4, 4, 0.2, 16, 1, true);
      markerMat = new THREE.MeshLambertMaterial({ color: 0xFFFF00, side: THREE.DoubleSide });
      marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(positions[i].x, 0.1, positions[i].z);
      sc.add(marker);

      reconBuildings.push({ mesh: mesh, marker: marker, pos: positions[i], idx: i });
    }
  }

  function updateRecon(playerPos) {
    if (currentMission !== MISSION_TYPES.RECON) return;
    for (var i = 0; i < reconBuildings.length; i++) {
      if (reconVisited[i]) continue;
      var b = reconBuildings[i];
      var dx = playerPos.x - b.pos.x;
      var dz = playerPos.z - b.pos.z;
      if (Math.sqrt(dx * dx + dz * dz) < 5) {
        reconVisited[i] = true;
        if (b.marker) b.marker.visible = false;
        tickObjective(i);
        var allVisited = reconVisited[0] && reconVisited[1] && reconVisited[2];
        if (allVisited) {
          onMissionObjectivesComplete();
        }
      }
    }
  }

  // --- C4 / SABOTAGE ---
  function spawnSabotageTargets(sc) {
    var k, i, tGeo, tMat, tMesh;
    for (k = 0; k < c4Charges.length; k++) {
      if (c4Charges[k].mesh) sc.remove(c4Charges[k].mesh);
    }
    c4Charges = [];
    c4Timers = [];
    clearC4Displays();

    var positions = [
      { x: 18, z: 5, label: 'GENERATOR' },
      { x: -12, z: -10, label: 'FUEL TANK' },
      { x: 5, z: 22, label: 'GENERATOR' }
    ];

    for (i = 0; i < 3; i++) {
      // Target object
      tGeo = new THREE.BoxGeometry(3, 3, 3);
      tMat = new THREE.MeshLambertMaterial({ color: 0x558844 });
      tMesh = new THREE.Mesh(tGeo, tMat);
      tMesh.position.set(positions[i].x, 1.5, positions[i].z);
      sc.add(tMesh);

      c4Charges.push({
        targetMesh: tMesh,
        pos: positions[i],
        planted: false,
        detonated: false,
        idx: i,
        timerVal: 120,
        c4Mesh: null,
        label: positions[i].label
      });
    }
  }

  function tryPlantC4(playerPos, sc) {
    if (currentMission !== MISSION_TYPES.SABOTAGE) return;
    for (var i = 0; i < c4Charges.length; i++) {
      var c = c4Charges[i];
      if (c.planted) continue;
      var dx = playerPos.x - c.pos.x;
      var dz = playerPos.z - c.pos.z;
      if (Math.sqrt(dx * dx + dz * dz) < 4) {
        plantC4(i, sc);
        break;
      }
    }
  }

  function plantC4(idx, sc) {
    var c = c4Charges[idx];
    if (c.planted) return;
    c.planted = true;

    var cGeo = new THREE.BoxGeometry(0.6, 0.4, 0.2);
    var cMat = new THREE.MeshLambertMaterial({ color: 0xFF2200 });
    var cMesh = new THREE.Mesh(cGeo, cMat);
    cMesh.position.set(c.pos.x, 3.2, c.pos.z);
    sc.add(cMesh);
    c.c4Mesh = cMesh;

    // CSS timer display
    var timerDiv = document.createElement('div');
    timerDiv.className = 'sf-c4-timer';
    timerDiv.style.cssText = [
      'position:fixed',
      'background:#110000',
      'color:#ff2200',
      'font-family:monospace',
      'font-size:18px',
      'font-weight:bold',
      'border:2px solid #ff2200',
      'border-radius:4px',
      'padding:4px 10px',
      'z-index:8500',
      'pointer-events:none',
      'display:none'
    ].join(';');
    timerDiv.textContent = 'C4 [' + c.label + '] 2:00';
    document.body.appendChild(timerDiv);
    c4DisplayEls.push({ el: timerDiv, idx: idx });
    c.timerEl = timerDiv;

    tickObjective(idx);
    c4Timers.push({ c4: c, remaining: 120 });

    var allPlanted = true;
    for (var i = 0; i < c4Charges.length; i++) {
      if (!c4Charges[i].planted) { allPlanted = false; break; }
    }
    if (allPlanted) {
      onMissionObjectivesComplete();
    }
  }

  function clearC4Displays() {
    for (var i = 0; i < c4DisplayEls.length; i++) {
      if (c4DisplayEls[i].el && c4DisplayEls[i].el.parentNode) {
        c4DisplayEls[i].el.parentNode.removeChild(c4DisplayEls[i].el);
      }
    }
    c4DisplayEls = [];
  }

  function updateC4Timers(dt, sc, camera3d) {
    if (currentMission !== MISSION_TYPES.SABOTAGE) return;
    for (var i = 0; i < c4Timers.length; i++) {
      var ct = c4Timers[i];
      if (ct.c4.detonated) continue;
      ct.remaining -= dt;
      var mins = Math.floor(ct.remaining / 60);
      var secs = Math.floor(Math.max(0, ct.remaining % 60));
      var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
      if (ct.c4.timerEl) {
        ct.c4.timerEl.textContent = 'C4 [' + ct.c4.label + '] ' + timeStr;
        // Project to screen
        if (ct.c4.c4Mesh && camera3d) {
          var pos3 = new THREE.Vector3();
          ct.c4.c4Mesh.getWorldPosition(pos3);
          pos3.project(camera3d);
          var sx = (pos3.x * 0.5 + 0.5) * window.innerWidth;
          var sy = (-pos3.y * 0.5 + 0.5) * window.innerHeight;
          if (pos3.z < 1) {
            ct.c4.timerEl.style.left = sx + 'px';
            ct.c4.timerEl.style.top = (sy - 30) + 'px';
            ct.c4.timerEl.style.display = 'block';
          } else {
            ct.c4.timerEl.style.display = 'none';
          }
        }
      }
      if (ct.remaining <= 0 && !ct.c4.detonated) {
        detonateC4(ct.c4, sc);
      }
    }
  }

  function detonateC4(c, sc) {
    c.detonated = true;
    if (c.timerEl) c.timerEl.style.display = 'none';
    if (c.c4Mesh) sc.remove(c.c4Mesh);
    if (c.targetMesh) sc.remove(c.targetMesh);

    // Explosion sphere
    var expGeo = new THREE.SphereGeometry(10, 12, 12);
    var expMat = new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.7 });
    var expMesh = new THREE.Mesh(expGeo, expMat);
    expMesh.position.set(c.pos.x, 5, c.pos.z);
    sc.add(expMesh);
    explosions.push({ mesh: expMesh, life: 1.2, scene: sc });

    // Point light flash
    var light = new THREE.PointLight(0xFF6600, 8, 25);
    light.position.set(c.pos.x, 5, c.pos.z);
    sc.add(light);
    explosions.push({ mesh: null, light: light, life: 0.5, scene: sc });
  }

  function updateExplosions(dt) {
    for (var i = explosions.length - 1; i >= 0; i--) {
      var e = explosions[i];
      e.life -= dt;
      if (e.mesh) {
        e.mesh.material.opacity = Math.max(0, e.life * 0.6);
        e.mesh.scale.setScalar(1 + (1.2 - e.life) * 0.5);
      }
      if (e.life <= 0) {
        if (e.mesh) e.scene.remove(e.mesh);
        if (e.light) e.scene.remove(e.light);
        explosions.splice(i, 1);
      }
    }
  }

  // --- HVT ---
  function spawnHVT(sc) {
    if (hvtTarget) { sc.remove(hvtTarget.group); }
    var group = new THREE.Group();

    // Suit (body)
    var suitGeo = new THREE.CylinderGeometry(0.38, 0.38, 1.6, 8);
    var suitMat = new THREE.MeshLambertMaterial({ color: 0x222244 });
    var suit = new THREE.Mesh(suitGeo, suitMat);
    suit.position.y = 0.8;
    group.add(suit);

    // Head
    var headGeo = new THREE.SphereGeometry(0.32, 10, 10);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.95;
    group.add(head);

    // Briefcase
    var caseGeo = new THREE.BoxGeometry(0.55, 0.38, 0.15);
    var caseMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    var briefcase = new THREE.Mesh(caseGeo, caseMat);
    briefcase.position.set(0.55, 0.75, 0.1);
    group.add(briefcase);

    group.position.set(25, 0, -10);
    sc.add(group);

    hvtTarget = {
      group: group,
      hp: 500,
      alive: true,
      stunned: false,
      pos: { x: 25, z: -10 }
    };
    hvtCaptured = false;
    hvtEliminated = false;
  }

  function updateHVT(dt, playerPos, sc) {
    if (currentMission !== MISSION_TYPES.HVT || !hvtTarget || !hvtTarget.alive) return;
    // Patrol slowly
    if (!hvtTarget.stunned) {
      hvtTarget.group.position.x += Math.sin(Date.now() * 0.0005) * 0.02;
      hvtTarget.group.position.z += Math.cos(Date.now() * 0.0003) * 0.02;
    }

    var dx = playerPos.x - hvtTarget.group.position.x;
    var dz = playerPos.z - hvtTarget.group.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 2.5 && !missionComplete) {
      // Eliminate on close contact
      if (!hvtCaptured && !hvtEliminated) {
        hvtEliminated = true;
        hvtTarget.alive = false;
        hvtTarget.group.visible = false;
        tickObjective(0);
        onMissionObjectivesComplete();
      }
    }
  }

  function tryStunHVT(playerPos, sc) {
    if (currentMission !== MISSION_TYPES.HVT || !hvtTarget || !hvtTarget.alive) return;
    var dx = playerPos.x - hvtTarget.group.position.x;
    var dz = playerPos.z - hvtTarget.group.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 5 && !hvtCaptured) {
      hvtCaptured = true;
      hvtTarget.stunned = true;
      hvtTarget.group.children.forEach(function(child) {
        if (child.material) child.material.color.setHex(0x8888FF);
      });
      tickObjective(0);
      onMissionObjectivesComplete();
    }
  }

  // --- Exfil ---
  function spawnExfil(sc) {
    if (exfilMarker) { sc.remove(exfilMarker); exfilMarker = null; }
    var geo = new THREE.CylinderGeometry(4, 4, 0.3, 24, 1, true);
    var mat = new THREE.MeshLambertMaterial({ color: 0x00FFFF, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    exfilMarker = new THREE.Mesh(geo, mat);
    exfilMarker.position.set(-30, 0.15, -30);
    sc.add(exfilMarker);
    exfilActive = true;

    showMessage('EXFIL ZONE ACTIVE — Move to extraction point!', 4000);
  }

  function updateExfil(playerPos) {
    if (!exfilActive || !exfilMarker) return;
    var dx = playerPos.x - exfilMarker.position.x;
    var dz = playerPos.z - exfilMarker.position.z;
    if (Math.sqrt(dx * dx + dz * dz) < 5) {
      completeMission();
    }
    // Animate ring
    exfilMarker.rotation.y += 0.02;
  }

  // --- Mission Flow ---
  function startMission(type) {
    resetMissionState(scene);
    currentMission = type;
    missionActive = true;
    missionComplete = false;
    missionFailed = false;
    missionTimer = 0;
    objectivesComplete = 0;
    sfActive = true;

    spawnTeam(scene);

    if (type === MISSION_TYPES.DIRECT_ACTION) {
      missionTimer = 180; // countdown
      spawnGuards(scene);
      createBriefingPanel('DIRECT ACTION', [
        'Eliminate Guard 1',
        'Eliminate Guard 2',
        'Eliminate Guard 3',
        'Eliminate Guard 4',
        'Eliminate Guard 5',
        'Eliminate Guard 6'
      ]);
      showMessage('MISSION: DIRECT ACTION — Eliminate all 6 guards within 3 minutes!', 4000);
    } else if (type === MISSION_TYPES.RECON) {
      missionTimer = 0; // count up
      spawnReconBuildings(scene);
      createBriefingPanel('RECON', [
        'Gather intel: Building Alpha',
        'Gather intel: Building Bravo',
        'Gather intel: Building Charlie'
      ]);
      showMessage('MISSION: RECON — Infiltrate 3 buildings, no combat. Team moves slow.', 4000);
    } else if (type === MISSION_TYPES.SABOTAGE) {
      missionTimer = 0;
      spawnSabotageTargets(scene);
      createBriefingPanel('SABOTAGE', [
        'Plant C4: Generator Alpha',
        'Plant C4: Fuel Tank Beta',
        'Plant C4: Generator Charlie'
      ]);
      showMessage('MISSION: SABOTAGE — Approach targets to plant C4. Press E to plant. Exfil before detonation!', 5000);
    } else if (type === MISSION_TYPES.HVT) {
      missionTimer = 0;
      spawnHVT(scene);
      createBriefingPanel('HVT', [
        'Neutralize or capture the HVT'
      ]);
      showMessage('MISSION: HVT — Approach target to eliminate. Press Q to stun/capture alive.', 5000);
    }

    if (hudEl) hudEl.style.display = 'block';
  }

  function onMissionObjectivesComplete() {
    spawnExfil(scene);
    showMessage('ALL OBJECTIVES COMPLETE — Move to EXFIL zone!', 5000);
  }

  function completeMission() {
    if (missionComplete) return;
    missionComplete = true;
    missionActive = false;
    exfilActive = false;
    showMessage('MISSION COMPLETE! SF Team extracted successfully.', 6000);
    if (hudEl) hudEl.style.display = 'none';
    removeBriefing();
    clearC4Displays();
  }

  function failMission(reason) {
    if (missionFailed || missionComplete) return;
    missionFailed = true;
    missionActive = false;
    showMessage('MISSION FAILED: ' + reason, 6000);
    if (hudEl) hudEl.style.display = 'none';
    removeBriefing();
  }

  function resetMissionState(sc) {
    var i, j, k;
    if (!sc) return;
    for (i = 0; i < guards.length; i++) {
      if (guards[i].mesh) sc.remove(guards[i].mesh);
    }
    guards = [];
    for (j = 0; j < reconBuildings.length; j++) {
      if (reconBuildings[j].mesh) sc.remove(reconBuildings[j].mesh);
      if (reconBuildings[j].marker) sc.remove(reconBuildings[j].marker);
    }
    reconBuildings = [];
    reconVisited = [];
    clearC4Displays();
    for (k = 0; k < c4Charges.length; k++) {
      if (c4Charges[k].targetMesh) sc.remove(c4Charges[k].targetMesh);
      if (c4Charges[k].c4Mesh) sc.remove(c4Charges[k].c4Mesh);
    }
    c4Charges = [];
    c4Timers = [];
    if (hvtTarget) { sc.remove(hvtTarget.group); hvtTarget = null; }
    if (exfilMarker) { sc.remove(exfilMarker); exfilMarker = null; }
    exfilActive = false;
    explosions = [];
    objectives = [];
    objectivesComplete = 0;
    guardsEliminated = 0;
    removeBriefing();
  }

  // --- Message display ---
  var msgEl = null;
  var msgTimeout = null;
  function showMessage(text, duration) {
    if (!msgEl) {
      msgEl = document.createElement('div');
      msgEl.id = 'sf-msg';
      msgEl.style.cssText = [
        'position:fixed',
        'bottom:120px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.85)',
        'color:#fff',
        'font-family:monospace',
        'font-size:14px',
        'padding:10px 22px',
        'border:1px solid #00ff88',
        'border-radius:5px',
        'z-index:9200',
        'text-align:center',
        'max-width:600px',
        'pointer-events:none'
      ].join(';');
      document.body.appendChild(msgEl);
    }
    msgEl.textContent = text;
    msgEl.style.display = 'block';
    if (msgTimeout) clearTimeout(msgTimeout);
    msgTimeout = setTimeout(function() {
      if (msgEl) msgEl.style.display = 'none';
    }, duration || 3000);
  }

  // --- Key Handlers ---
  function onKeyDown(e) {
    keysDown[e.code] = true;
    var code = e.code;

    // S+F to open mission menu
    if (code === 'KeyF' && keysDown['KeyS']) {
      if (menuEl && menuEl.style.display === 'block') {
        closeMissionMenu();
      } else {
        createMissionMenu();
      }
      return;
    }

    // Formation keys
    if (code === 'F1') { e.preventDefault(); setFormation('line'); showMessage('Formation: LINE', 1500); }
    if (code === 'F2') { e.preventDefault(); setFormation('wedge'); showMessage('Formation: WEDGE', 1500); }
    if (code === 'F3') { e.preventDefault(); setFormation('column'); showMessage('Formation: COLUMN', 1500); }
    if (code === 'F4') { e.preventDefault(); setFormation('diamond'); showMessage('Formation: DIAMOND', 1500); }

    // E = plant C4
    if (code === 'KeyE' && missionActive && currentMission === MISSION_TYPES.SABOTAGE && playerMesh) {
      tryPlantC4(playerMesh.position, scene);
    }

    // Q = stun HVT
    if (code === 'KeyQ' && missionActive && currentMission === MISSION_TYPES.HVT && playerMesh) {
      tryStunHVT(playerMesh.position, scene);
    }

    // ESC closes menu
    if (code === 'Escape') { closeMissionMenu(); }
  }

  function onKeyUp(e) {
    keysDown[e.code] = false;
  }

  // --- Public API ---
  function init(options) {
    options = options || {};
    scene = options.scene || null;
    camera = options.camera || null;
    renderer = options.renderer || null;
    playerMesh = options.playerMesh || null;
    clock = new THREE.Clock();

    createHUD();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  }

  function update(dt, options) {
    options = options || {};
    if (options.playerMesh) playerMesh = options.playerMesh;
    if (options.scene) scene = options.scene;
    if (options.camera) camera = options.camera;

    if (!missionActive || !scene) {
      updateTeamFormation(dt);
      return;
    }

    // Timer
    if (currentMission === MISSION_TYPES.DIRECT_ACTION) {
      missionTimer -= dt;
      if (missionTimer <= 0 && !missionComplete && !missionFailed) {
        failMission('Time expired — guards not eliminated');
      }
    } else {
      missionTimer += dt;
    }

    updateHUD();
    updateTeamFormation(dt);

    var pp = playerMesh ? playerMesh.position : new THREE.Vector3();

    updateGuards(dt, pp);
    updateRecon(pp);
    updateC4Timers(dt, scene, camera);
    updateHVT(dt, pp, scene);
    updateExfil(pp);
    updateExplosions(dt);
  }

  function reset() {
    var i;
    if (scene) resetMissionState(scene);
    for (i = 0; i < sfTeam.length; i++) {
      if (scene) scene.remove(sfTeam[i]);
    }
    sfTeam = [];
    sfActive = false;
    currentMission = null;
    missionActive = false;
    missionTimer = 0;
    missionComplete = false;
    missionFailed = false;
    exfilActive = false;
    if (hudEl) { hudEl.style.display = 'none'; }
    removeBriefing();
    clearC4Displays();
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  }

  return { init: init, update: update, reset: reset };

})();
