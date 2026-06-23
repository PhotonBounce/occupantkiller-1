window.CommandVehicle = (function () {
  'use strict';

  // ── State ────────────────────────────────────────────────────────────────────
  var vehicle = null;          // THREE.Group
  var scene   = null;
  var camera  = null;
  var player  = null;

  var spawned   = false;
  var boarded   = false;
  var deployed  = false;

  var hp      = 500;
  var fuel    = 200;
  var speed   = 0;
  var maxSpeed = 12;           // units/s  (~28 km/h display)
  var heading = 0;             // radians

  // Key state
  var keys = {};

  // Command overlay
  var overlayOpen    = false;
  var activeTab      = 'ORDERS';
  var overlayEl      = null;

  // Cooldown timers (seconds)
  var artyCooldown   = 0;
  var casCooldown    = 0;
  var commsJammed    = false;
  var jamTimer       = 0;
  var interceptTimer = 0;
  var interceptLog   = [];

  // MG auto-fire
  var mgCooldown = 0;
  var rounds     = [];         // active bullet meshes

  // Fuel cans
  var fuelCans   = [];

  // Sub-meshes we need to animate
  var meshRefs = {
    antennae   : [],
    sidePanels : [],
    radioMast  : null,
    guyWires   : null,
    satDish    : null
  };

  // Timing
  var clock30  = 0;   // 30-second enemy comms interval
  var _inited  = false;

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function makeMat(color, opts) {
    var params = { color: color };
    if (opts) {
      if (opts.wireframe !== undefined) params.wireframe = opts.wireframe;
    }
    return new THREE.MeshLambertMaterial(params);
  }

  function vec3(x, y, z) { return new THREE.Vector3(x, y, z); }

  // ── Vehicle Construction ─────────────────────────────────────────────────────
  function buildVehicle() {
    var grp = new THREE.Group();

    // Main body
    var bodyGeo = new THREE.BoxGeometry(7, 2.5, 3.5);
    var bodyMat = makeMat(0x4A5A3A);
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.5;
    grp.add(body);

    // Wheels: 4 cylinders
    var wheelPositions = [
      [-2.5, 0.7, 2.0],
      [ 2.5, 0.7, 2.0],
      [-2.5, 0.7,-2.0],
      [ 2.5, 0.7,-2.0]
    ];
    var wheelGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.6, 12);
    var wheelMat = makeMat(0x222222);
    for (var wi = 0; wi < wheelPositions.length; wi++) {
      var w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wheelPositions[wi][0], wheelPositions[wi][1], wheelPositions[wi][2]);
      grp.add(w);
    }

    // Antenna array (3 antennas of varying heights)
    var antennaHeights = [3, 4, 5];
    var antennaOffsets = [[-1.5, 0], [0, 0.3], [1.5, -0.2]];
    for (var ai = 0; ai < 3; ai++) {
      var h   = antennaHeights[ai];
      var aGeo = new THREE.CylinderGeometry(0.05, 0.05, h, 6);
      var aMat = makeMat(0x888888);
      var aMesh = new THREE.Mesh(aGeo, aMat);
      aMesh.position.set(antennaOffsets[ai][0], 2.75 + h / 2, antennaOffsets[ai][1]);
      grp.add(aMesh);
      meshRefs.antennae.push({ mesh: aMesh, baseY: 2.75 + h / 2, fullH: h, packH: h * 0.4 });
    }

    // Satellite dish base cylinder
    var dishBaseGeo = new THREE.CylinderGeometry(0.15, 0.15, 1, 8);
    var dishBaseMat = makeMat(0x666666);
    var dishBase    = new THREE.Mesh(dishBaseGeo, dishBaseMat);
    dishBase.position.set(2.5, 3.5, 0);
    grp.add(dishBase);

    // Satellite disk (flat CylinderGeometry)
    var diskGeo = new THREE.CylinderGeometry(1, 1, 0.1, 16);
    var diskMat = makeMat(0x666666);
    var disk    = new THREE.Mesh(diskGeo, diskMat);
    disk.rotation.x = Math.PI / 3;
    disk.position.set(2.5, 4.3, 0);
    grp.add(disk);
    meshRefs.satDish = disk;

    // Side panel (folding desk — hinged on right side)
    var panelGeo = new THREE.BoxGeometry(2, 2, 0.1);
    var panelMat = makeMat(0x6B5A3A);
    var panel    = new THREE.Mesh(panelGeo, panelMat);
    // pivot group so rotation animates correctly
    var panelPivot = new THREE.Group();
    panelPivot.position.set(3.6, 1.5, 0);
    panel.position.set(1.05, 0, 0);
    panelPivot.add(panel);
    grp.add(panelPivot);
    meshRefs.sidePanels.push(panelPivot);

    // Radio mast (deployed only) — starts invisible
    var mastGeo  = new THREE.CylinderGeometry(0.1, 0.1, 8, 8);
    var mastMat  = makeMat(0xAAAAAA);
    var mast     = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(-3.0, 6.75, 0);
    mast.visible = false;
    grp.add(mast);
    meshRefs.radioMast = mast;

    // Guy-wires (LineSegments)
    var gwPoints = [];
    var mastTip  = new THREE.Vector3(-3.0, 10.75, 0);
    var anchors  = [
      new THREE.Vector3(-0.5, 1.5, 1.5),
      new THREE.Vector3(-0.5, 1.5,-1.5),
      new THREE.Vector3(-5.5, 1.5, 0)
    ];
    for (var gi = 0; gi < anchors.length; gi++) {
      gwPoints.push(mastTip.x, mastTip.y, mastTip.z);
      gwPoints.push(anchors[gi].x, anchors[gi].y, anchors[gi].z);
    }
    var gwGeo = new THREE.BufferGeometry();
    gwGeo.setAttribute('position', new THREE.Float32BufferAttribute(gwPoints, 3));
    var gwMat  = new THREE.LineBasicMaterial({ color: 0x999999 });
    var gwLines = new THREE.LineSegments(gwGeo, gwMat);
    gwLines.visible = false;
    grp.add(gwLines);
    meshRefs.guyWires = gwLines;

    return grp;
  }

  // ── Fuel Cans ────────────────────────────────────────────────────────────────
  function spawnFuelCans() {
    if (!scene) return;
    var canGeo = new THREE.BoxGeometry(0.4, 0.6, 0.3);
    var canMat = makeMat(0x884422);
    for (var ci = 0; ci < 8; ci++) {
      var can = new THREE.Mesh(canGeo, canMat);
      var ang = (ci / 8) * Math.PI * 2;
      var r   = 20 + Math.random() * 30;
      can.position.set(Math.cos(ang) * r, 0.3, Math.sin(ang) * r);
      can.userData.isFuelCan = true;
      scene.add(can);
      fuelCans.push(can);
    }
  }

  // ── Key Handling ─────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    keys[e.code] = true;

    // Spawn / board with C+V (both held, tap V to trigger)
    if (e.code === 'KeyV' && keys['KeyC']) {
      if (!spawned) {
        spawnVehicle();
      }
    }

    // Board / exit with E
    if (e.code === 'KeyE' && spawned) {
      if (!boarded) {
        tryBoard();
      } else {
        exitVehicle();
      }
    }

    // Tab toggles command overlay when aboard
    if (e.code === 'Tab' && boarded) {
      e.preventDefault();
      toggleOverlay();
    }

    // P to deploy / pack
    if (e.code === 'KeyP' && boarded) {
      toggleDeploy();
    }
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  // ── Spawn ────────────────────────────────────────────────────────────────────
  function spawnVehicle() {
    if (spawned || !scene) return;
    vehicle = buildVehicle();
    var px = 0, pz = 0;
    if (player) { px = player.position.x; pz = player.position.z; }
    vehicle.position.set(px, 0, pz + 5);
    scene.add(vehicle);
    spawned = true;
    spawnFuelCans();
  }

  function tryBoard() {
    if (!vehicle || !player) return;
    var dx = vehicle.position.x - player.position.x;
    var dz = vehicle.position.z - player.position.z;
    if (Math.sqrt(dx * dx + dz * dz) <= 3) {
      boarded = true;
    }
  }

  function exitVehicle() {
    boarded = false;
    if (overlayOpen) closeOverlay();
    // Place player beside vehicle
    if (player && vehicle) {
      player.position.set(vehicle.position.x + 4, vehicle.position.y, vehicle.position.z);
    }
  }

  // ── Deploy / Pack ─────────────────────────────────────────────────────────────
  function toggleDeploy() {
    deployed = !deployed;
    if (deployed) {
      // Fold out side panels
      for (var si = 0; si < meshRefs.sidePanels.length; si++) {
        meshRefs.sidePanels[si].rotation.z = -Math.PI / 2;
      }
      // Extend antennas
      for (var ai = 0; ai < meshRefs.antennae.length; ai++) {
        var ref = meshRefs.antennae[ai];
        ref.mesh.position.y = ref.baseY + ref.packH;
      }
      // Show radio mast & wires
      if (meshRefs.radioMast)  meshRefs.radioMast.visible  = true;
      if (meshRefs.guyWires)   meshRefs.guyWires.visible   = true;
    } else {
      // Pack panels
      for (var sj = 0; sj < meshRefs.sidePanels.length; sj++) {
        meshRefs.sidePanels[sj].rotation.z = 0;
      }
      // Compact antennas
      for (var aj = 0; aj < meshRefs.antennae.length; aj++) {
        var refj = meshRefs.antennae[aj];
        refj.mesh.position.y = refj.baseY;
      }
      // Hide mast & wires
      if (meshRefs.radioMast)  meshRefs.radioMast.visible  = false;
      if (meshRefs.guyWires)   meshRefs.guyWires.visible   = false;
    }
  }

  // ── Command Overlay ───────────────────────────────────────────────────────────
  function buildOverlayDOM() {
    var el = document.createElement('div');
    el.id = 'cmdv-overlay';
    el.style.cssText = [
      'position:fixed',
      'top:10%',
      'left:50%',
      'transform:translateX(-50%)',
      'width:640px',
      'background:rgba(10,20,10,0.93)',
      'border:2px solid #4A5A3A',
      'color:#aaffaa',
      'font-family:monospace',
      'font-size:13px',
      'padding:12px',
      'z-index:9000',
      'user-select:none'
    ].join(';');
    document.body.appendChild(el);
    return el;
  }

  function toggleOverlay() {
    if (overlayOpen) { closeOverlay(); } else { openOverlay(); }
  }

  function openOverlay() {
    if (!overlayEl) overlayEl = buildOverlayDOM();
    overlayOpen = true;
    renderOverlay();
  }

  function closeOverlay() {
    overlayOpen = false;
    if (overlayEl) overlayEl.style.display = 'none';
  }

  function renderOverlay() {
    if (!overlayEl || !overlayOpen) return;
    overlayEl.style.display = 'block';
    overlayEl.innerHTML = '';

    // Title bar
    var title = document.createElement('div');
    title.textContent = '[ MOBILE COMMAND POST — C2 CONSOLE ]';
    title.style.cssText = 'text-align:center;font-size:15px;color:#ccffcc;margin-bottom:8px;border-bottom:1px solid #4A5A3A;padding-bottom:4px;';
    overlayEl.appendChild(title);

    // Tab bar
    var tabs = ['ORDERS', 'FIRE MISSION', 'INTEL', 'LOGISTICS', 'COMMS'];
    var tabBar = document.createElement('div');
    tabBar.style.cssText = 'display:flex;gap:4px;margin-bottom:8px;';
    for (var ti = 0; ti < tabs.length; ti++) {
      (function (tabName) {
        var btn = document.createElement('button');
        btn.textContent = tabName;
        btn.style.cssText = [
          'background:' + (activeTab === tabName ? '#2a4a2a' : '#111'),
          'color:#aaffaa',
          'border:1px solid #4A5A3A',
          'padding:3px 8px',
          'cursor:pointer',
          'font-family:monospace',
          'font-size:12px'
        ].join(';');
        btn.addEventListener('click', function () {
          activeTab = tabName;
          renderOverlay();
        });
        tabBar.appendChild(btn);
      })(tabs[ti]);
    }
    overlayEl.appendChild(tabBar);

    // Content area
    var content = document.createElement('div');
    content.style.cssText = 'min-height:220px;';

    if (activeTab === 'ORDERS')         renderOrders(content);
    else if (activeTab === 'FIRE MISSION') renderFireMission(content);
    else if (activeTab === 'INTEL')     renderIntel(content);
    else if (activeTab === 'LOGISTICS') renderLogistics(content);
    else if (activeTab === 'COMMS')     renderComms(content);

    overlayEl.appendChild(content);

    // Close button
    var closeBtn = document.createElement('button');
    closeBtn.textContent = '[TAB] CLOSE';
    closeBtn.style.cssText = 'margin-top:8px;background:#111;color:#aaffaa;border:1px solid #4A5A3A;padding:3px 10px;cursor:pointer;font-family:monospace;';
    closeBtn.addEventListener('click', closeOverlay);
    overlayEl.appendChild(closeBtn);
  }

  // ORDERS tab
  function renderOrders(container) {
    var units = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'];
    var orderTypes = ['ADVANCE', 'HOLD', 'FLANK_LEFT', 'FLANK_RIGHT', 'WITHDRAW'];

    if (!window._unitOrders) window._unitOrders = {};

    for (var ui = 0; ui < units.length; ui++) {
      (function (unit) {
        var row = document.createElement('div');
        row.style.cssText = 'margin-bottom:6px;display:flex;align-items:center;gap:6px;';

        var label = document.createElement('span');
        label.textContent = unit + ':';
        label.style.cssText = 'width:70px;color:#ffffaa;font-weight:bold;';
        row.appendChild(label);

        var curOrder = window._unitOrders[unit] || '—';
        var cur = document.createElement('span');
        cur.textContent = '[' + curOrder + ']';
        cur.style.cssText = 'width:100px;color:#aaffff;';
        row.appendChild(cur);

        for (var oi = 0; oi < orderTypes.length; oi++) {
          (function (orderType) {
            var btn = document.createElement('button');
            btn.textContent = orderType;
            btn.style.cssText = 'background:#111;color:#aaffaa;border:1px solid #4A5A3A;padding:2px 5px;cursor:pointer;font-family:monospace;font-size:11px;';
            btn.addEventListener('click', function () {
              window._unitOrders[unit] = orderType;
              renderOverlay();
            });
            row.appendChild(btn);
          })(orderTypes[oi]);
        }
        container.appendChild(row);
      })(units[ui]);
    }
  }

  // FIRE MISSION tab
  function renderFireMission(container) {
    var artyBtn = document.createElement('button');
    var artyCd  = Math.ceil(artyCooldown);
    artyBtn.textContent = 'REQUEST ARTY' + (artyCd > 0 ? ' [CD: ' + artyCd + 's]' : '');
    artyBtn.disabled    = artyCd > 0;
    artyBtn.style.cssText = 'display:block;margin-bottom:8px;background:#111;color:#aaffaa;border:1px solid #4A5A3A;padding:5px 12px;cursor:pointer;font-family:monospace;';
    artyBtn.addEventListener('click', function () {
      if (artyCooldown <= 0) {
        artyCooldown = 60;
        if (window.FireSupport && typeof window.FireSupport.requestArty === 'function') {
          window.FireSupport.requestArty();
        }
        renderOverlay();
      }
    });
    container.appendChild(artyBtn);

    var casBtn = document.createElement('button');
    var casCd  = Math.ceil(casCooldown);
    casBtn.textContent = 'REQUEST CAS' + (casCd > 0 ? ' [CD: ' + casCd + 's]' : '');
    casBtn.disabled    = casCd > 0;
    casBtn.style.cssText = 'display:block;margin-bottom:8px;background:#111;color:#aaffaa;border:1px solid #4A5A3A;padding:5px 12px;cursor:pointer;font-family:monospace;';
    casBtn.addEventListener('click', function () {
      if (casCooldown <= 0) {
        casCooldown = 90;
        if (window.FireSupport && typeof window.FireSupport.requestCAS === 'function') {
          window.FireSupport.requestCAS();
        }
        renderOverlay();
      }
    });
    container.appendChild(casBtn);

    var info = document.createElement('div');
    info.textContent = 'ARTY cooldown: ' + artyCd + 's  |  CAS cooldown: ' + casCd + 's';
    info.style.cssText = 'color:#888;margin-top:10px;';
    container.appendChild(info);
  }

  // INTEL tab
  function renderIntel(container) {
    var entries = [];

    if (window._intelLog && window._intelLog.length) {
      entries = window._intelLog.slice(-10);
    } else if (window.IntelNetwork && typeof window.IntelNetwork.getReports === 'function') {
      entries = window.IntelNetwork.getReports().slice(-10);
    }

    var hdr = document.createElement('div');
    hdr.textContent = '── INTEL FEED (latest 10) ──';
    hdr.style.cssText = 'color:#ffffaa;margin-bottom:6px;';
    container.appendChild(hdr);

    if (entries.length === 0) {
      var none = document.createElement('div');
      none.textContent = 'No intel reports received.';
      none.style.cssText = 'color:#666;';
      container.appendChild(none);
    } else {
      for (var ii = 0; ii < entries.length; ii++) {
        var row = document.createElement('div');
        row.textContent = entries[ii];
        row.style.cssText = 'border-bottom:1px solid #1a2a1a;padding:2px 0;color:#aaffaa;';
        container.appendChild(row);
      }
    }
  }

  // LOGISTICS tab
  function renderLogistics(container) {
    var hdr = document.createElement('div');
    hdr.textContent = '── LOGISTICS STATUS ──';
    hdr.style.cssText = 'color:#ffffaa;margin-bottom:6px;';
    container.appendChild(hdr);

    if (window.LogisticsSystem) {
      var ls  = window.LogisticsSystem;
      var statusLines = [
        'AMMO   : ' + (ls.ammo    !== undefined ? ls.ammo    : 'N/A'),
        'FUEL   : ' + (ls.fuel    !== undefined ? ls.fuel    : 'N/A'),
        'MEDKITS: ' + (ls.medkits !== undefined ? ls.medkits : 'N/A')
      ];
      for (var li = 0; li < statusLines.length; li++) {
        var ln = document.createElement('div');
        ln.textContent = statusLines[li];
        ln.style.cssText = 'margin-bottom:3px;color:#aaffaa;';
        container.appendChild(ln);
      }
    } else {
      var noSys = document.createElement('div');
      noSys.textContent = 'LogisticsSystem not available.';
      noSys.style.cssText = 'color:#666;margin-bottom:8px;';
      container.appendChild(noSys);
    }

    var resupplyBtn = document.createElement('button');
    resupplyBtn.textContent = 'REQUEST RESUPPLY (spawns crate)';
    resupplyBtn.style.cssText = 'margin-top:10px;background:#111;color:#aaffaa;border:1px solid #4A5A3A;padding:5px 12px;cursor:pointer;font-family:monospace;';
    resupplyBtn.addEventListener('click', function () {
      spawnSupplyCrate();
      renderOverlay();
    });
    container.appendChild(resupplyBtn);
  }

  function spawnSupplyCrate() {
    if (!scene || !vehicle) return;
    var crateGeo = new THREE.BoxGeometry(1, 1, 1);
    var crateMat = makeMat(0x8B6914);
    var crate    = new THREE.Mesh(crateGeo, crateMat);
    var angle    = Math.random() * Math.PI * 2;
    var dist     = 8 + Math.random() * 10;
    crate.position.set(
      vehicle.position.x + Math.cos(angle) * dist,
      0.5,
      vehicle.position.z + Math.sin(angle) * dist
    );
    crate.userData.isSupplyCrate = true;
    scene.add(crate);
  }

  // COMMS tab
  function renderComms(container) {
    var hdr = document.createElement('div');
    hdr.textContent = '── COMMS CENTER ──';
    hdr.style.cssText = 'color:#ffffaa;margin-bottom:6px;';
    container.appendChild(hdr);

    // Intercept log
    var intHdr = document.createElement('div');
    intHdr.textContent = 'Enemy Radio Intercepts:';
    intHdr.style.cssText = 'color:#ffaaaa;margin-bottom:4px;';
    container.appendChild(intHdr);

    if (interceptLog.length === 0) {
      var noInt = document.createElement('div');
      noInt.textContent = '(listening... next intercept in ' + Math.ceil(30 - clock30) + 's)';
      noInt.style.cssText = 'color:#555;margin-bottom:8px;';
      container.appendChild(noInt);
    } else {
      for (var ei = 0; ei < interceptLog.length; ei++) {
        var line = document.createElement('div');
        line.textContent = interceptLog[ei];
        line.style.cssText = 'color:#ffaaaa;margin-bottom:2px;font-size:11px;border-bottom:1px solid #1a0a0a;';
        container.appendChild(line);
      }
    }

    // Jam button
    var jamBtn = document.createElement('button');
    jamBtn.textContent = commsJammed ? 'JAMMING ACTIVE [' + Math.ceil(jamTimer) + 's]' : 'JAM ENEMY COMMS (45s)';
    jamBtn.disabled    = commsJammed;
    jamBtn.style.cssText = 'display:block;margin-top:8px;background:#111;color:' + (commsJammed ? '#ff4444' : '#aaffaa') + ';border:1px solid #4A5A3A;padding:5px 12px;cursor:pointer;font-family:monospace;';
    jamBtn.addEventListener('click', function () {
      if (!commsJammed) {
        commsJammed = true;
        jamTimer    = 45;
        window._enemyCommsJammed = true;
        renderOverlay();
      }
    });
    container.appendChild(jamBtn);
  }

  // ── Enemy Comms Intercepts ───────────────────────────────────────────────────
  var enemyCommLines = [
    'ALPHA-6 requesting fire support at grid 447.',
    'Falling back to secondary positions.',
    'Casualties heavy, requesting reinforcements.',
    'Move armor to the eastern flank NOW.',
    'Command, we have contact at the ridge.',
    'Ammo resupply critical — send immediately.',
    'Flanking maneuver on north sector commencing.',
    'Enemy spotted at objective BRAVO.',
    'Tank column moving through valley.',
    'Air support denied, hold position.'
  ];

  function generateIntercept() {
    var line = '[INTERCEPT T+' + Math.floor(Date.now() / 1000 % 9999) + '] ' +
               enemyCommLines[Math.floor(Math.random() * enemyCommLines.length)];
    interceptLog.unshift(line);
    if (interceptLog.length > 10) interceptLog.pop();
    if (overlayOpen && activeTab === 'COMMS') renderOverlay();
  }

  // ── MG Return Fire ───────────────────────────────────────────────────────────
  function updateMG(dt) {
    if (!boarded || !vehicle || !scene) return;
    mgCooldown -= dt;
    if (mgCooldown > 0) return;

    // Find nearest enemy within 30 units
    var enemies = window._enemies || window.Enemies || [];
    var enemyArr = Array.isArray(enemies) ? enemies : (enemies.list || []);
    var nearest  = null;
    var nearDist = 30;
    for (var ei = 0; ei < enemyArr.length; ei++) {
      var e = enemyArr[ei];
      if (!e || !e.position) continue;
      var ddx = e.position.x - vehicle.position.x;
      var ddz = e.position.z - vehicle.position.z;
      var d   = Math.sqrt(ddx * ddx + ddz * ddz);
      if (d < nearDist) { nearDist = d; nearest = e; }
    }

    if (!nearest) return;

    // Fire a bullet
    mgCooldown = 1;   // 60/min = 1 round/sec

    var bulletGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 6);
    var bulletMat = makeMat(0xFFDD00);
    var bullet    = new THREE.Mesh(bulletGeo, bulletMat);
    bullet.position.copy(vehicle.position).add(vec3(0, 3.5, 0));
    var dir = nearest.position.clone().sub(bullet.position).normalize();
    bullet.userData.vel    = dir.multiplyScalar(30);
    bullet.userData.life   = 2;
    bullet.userData.target = nearest;
    scene.add(bullet);
    rounds.push(bullet);
  }

  function updateRounds(dt) {
    for (var ri = rounds.length - 1; ri >= 0; ri--) {
      var r = rounds[ri];
      r.position.addScaledVector(r.userData.vel, dt);
      r.userData.life -= dt;
      if (r.userData.life <= 0) {
        scene.remove(r);
        rounds.splice(ri, 1);
      }
    }
  }

  // ── Fuel Cans pickup ─────────────────────────────────────────────────────────
  function checkFuelCans() {
    if (!vehicle) return;
    for (var fi = fuelCans.length - 1; fi >= 0; fi--) {
      var can = fuelCans[fi];
      var ddx = can.position.x - vehicle.position.x;
      var ddz = can.position.z - vehicle.position.z;
      if (Math.sqrt(ddx * ddx + ddz * ddz) < 2) {
        fuel = Math.min(200, fuel + 50);
        scene.remove(can);
        fuelCans.splice(fi, 1);
      }
    }
  }

  // ── Command Radius ───────────────────────────────────────────────────────────
  function updateCommandRadius() {
    if (!spawned || !vehicle) {
      window._inCommandRadius = false;
      return;
    }
    var range = deployed ? 120 : 100;
    if (player) {
      var dx = player.position.x - vehicle.position.x;
      var dz = player.position.z - vehicle.position.z;
      window._inCommandRadius = Math.sqrt(dx * dx + dz * dz) <= range;
    }
    // Expose range & comms status
    window._commandRange   = range;
    window._commandActive  = boarded;
    window._commsJamActive = commsJammed;
  }

  // ── HUD ──────────────────────────────────────────────────────────────────────
  var hudEl = null;

  function ensureHUD() {
    if (hudEl) return;
    hudEl = document.createElement('div');
    hudEl.id = 'cmdv-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'bottom:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.6)',
      'color:#aaffaa',
      'font-family:monospace',
      'font-size:13px',
      'padding:4px 14px',
      'border:1px solid #4A5A3A',
      'z-index:8000',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(hudEl);
  }

  function updateHUD() {
    if (!boarded) {
      if (hudEl) hudEl.style.display = 'none';
      return;
    }
    ensureHUD();
    hudEl.style.display = 'block';

    if (overlayOpen) {
      hudEl.style.display = 'none';
      return;
    }

    var spd     = Math.round(Math.abs(speed) * 2.31);  // rough km/h
    var fuelVal = Math.max(0, Math.floor(fuel));

    if (deployed) {
      hudEl.textContent = 'CMD POST [UNITS: 4] [RANGE: ' + (deployed ? '120' : '100') + 'm] [COMMS: ' + (commsJammed ? 'JAMMING' : 'ACTIVE') + ']';
    } else {
      hudEl.textContent = 'CMD-V [SPEED: ' + spd + 'km/h] [FUEL: ' + fuelVal + '] [HP: ' + Math.max(0, Math.floor(hp)) + '] [DEPLOYED: NO]';
    }
  }

  // ── Damage API ───────────────────────────────────────────────────────────────
  function takeDamage(amount) {
    hp -= amount;
    if (hp <= 0) {
      hp = 0;
      // Destroy vehicle
      if (scene && vehicle) {
        scene.remove(vehicle);
        vehicle  = null;
        spawned  = false;
        boarded  = false;
        deployed = false;
        if (hudEl) hudEl.style.display = 'none';
        closeOverlay();
      }
    }
  }

  // ── Drive Update ─────────────────────────────────────────────────────────────
  function updateDrive(dt) {
    if (!boarded || deployed || !vehicle) return;

    // Steering
    if (keys['KeyA']) heading += 1.2 * dt;
    if (keys['KeyD']) heading -= 1.2 * dt;

    // Throttle
    var accel = 0;
    if (keys['KeyW']) accel =  8;
    if (keys['KeyS']) accel = -5;

    if (accel !== 0 && fuel > 0) {
      speed += accel * dt;
      speed  = Math.max(-maxSpeed * 0.4, Math.min(maxSpeed, speed));
      fuel   = Math.max(0, fuel - dt);
    } else {
      // Friction
      speed *= Math.pow(0.3, dt);
      if (Math.abs(speed) < 0.01) speed = 0;
    }

    if (fuel <= 0) speed = 0;

    vehicle.position.x += Math.sin(heading) * speed * dt;
    vehicle.position.z += Math.cos(heading) * speed * dt;
    vehicle.rotation.y  = heading;

    // Keep vehicle on ground
    vehicle.position.y = 0;

    checkFuelCans();
  }

  // ── Main Update ───────────────────────────────────────────────────────────────
  function update(dt) {
    if (!dt || dt <= 0) dt = 0.016;

    // Cooldowns
    if (artyCooldown > 0) artyCooldown -= dt;
    if (casCooldown  > 0) casCooldown  -= dt;

    if (commsJammed) {
      jamTimer -= dt;
      if (jamTimer <= 0) {
        commsJammed              = false;
        jamTimer                 = 0;
        window._enemyCommsJammed = false;
      }
    }

    // Enemy comms intercepts every 30s when aboard
    if (boarded) {
      clock30 += dt;
      if (clock30 >= 30) {
        clock30 = 0;
        generateIntercept();
      }
    }

    updateDrive(dt);
    updateMG(dt);
    updateRounds(dt);
    updateCommandRadius();
    updateHUD();
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  function init(sceneRef, cameraRef, playerRef) {
    if (_inited) return;
    _inited = true;

    scene  = sceneRef  || (window.scene  || null);
    camera = cameraRef || (window.camera || null);
    player = playerRef || (window.player || null);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);

    // Expose damage API
    window.CommandVehicleDamage = takeDamage;
  }

  // ── Reset ─────────────────────────────────────────────────────────────────────
  function reset() {
    if (vehicle && scene) scene.remove(vehicle);
    vehicle  = null;
    spawned  = false;
    boarded  = false;
    deployed = false;
    hp       = 500;
    fuel     = 200;
    speed    = 0;
    heading  = 0;
    artyCooldown = 0;
    casCooldown  = 0;
    commsJammed  = false;
    jamTimer     = 0;
    clock30      = 0;
    interceptLog = [];
    keys         = {};
    mgCooldown   = 0;
    meshRefs     = { antennae: [], sidePanels: [], radioMast: null, guyWires: null, satDish: null };

    for (var ri = 0; ri < rounds.length; ri++) { if (scene) scene.remove(rounds[ri]); }
    rounds = [];

    for (var fi = 0; fi < fuelCans.length; fi++) { if (scene) scene.remove(fuelCans[fi]); }
    fuelCans = [];

    window._inCommandRadius  = false;
    window._enemyCommsJammed = false;

    if (overlayEl) { overlayEl.style.display = 'none'; }
    overlayOpen = false;

    if (hudEl) { hudEl.style.display = 'none'; }
    _inited = false;
  }

  return { init: init, update: update, reset: reset };

})();
