window.RooftopShowdown = (function () {
  'use strict';

  // ─── Activation (R + T within 400ms) ──────────────────────────────────────────
  var rDownAt = 0;
  var tDownAt = 0;
  var ACTIVATION_WINDOW = 400;
  var active = false;

  // ─── Core Three.js handles ────────────────────────────────────────────────────
  var scene, camera;
  var clock = { elapsed: 0 };

  // ─── Game state ───────────────────────────────────────────────────────────────
  var gameOver = false;
  var gameWon = false;
  var playerHP = 120;
  var playerMaxHP = 120;

  // ─── Player movement ──────────────────────────────────────────────────────────
  var playerPos = { x: 0, y: 1, z: 12 };
  var playerYaw = 0;
  var playerPitch = 0;
  var moveKeys = {};
  var pointerLocked = false;
  var playerSpeed = 8;
  var playerOnGround = true;
  var playerVelY = 0;

  // ─── Weapons ──────────────────────────────────────────────────────────────────
  var shootCooldown = 0;
  var meleeCooldown = 0;
  var bullets = [];
  var enemyBullets = [];

  // ─── Scene objects (tracked for reset) ───────────────────────────────────────
  var sceneObjects = [];
  var neonLights = [];

  // ─── Props ────────────────────────────────────────────────────────────────────
  var hvacUnits = [];
  var waterTower = null;
  var helicopter = null;
  var heliRotorMesh = null;
  var heliRotorAngle = 0;
  var billboards = [];
  var skylightDomes = [];
  var rappelAnchors = [];

  // ─── Boss & enemies ───────────────────────────────────────────────────────────
  var boss = null;
  var bossHP = 300;
  var bossMaxHP = 300;
  var bossState = 'ESCAPING'; // ESCAPING | DOWN
  var bossMoveTimer = 0;
  var bossTarget = { x: 0, z: -8 };

  var pilotMesh = null;
  var pilotActivated = false;
  var pilotHP = 60;
  var pilotState = 'IDLE'; // IDLE | ACTIVE | DOWN

  var bodyguards = [];
  var GUARD_COUNT = 6;

  // ─── Wave system ──────────────────────────────────────────────────────────────
  var currentWave = 1;
  var waveCleared = false;
  var waveTimer = 0;
  var WAVE_RESPAWN_DELAY = 8;
  var totalWaves = 3;

  // ─── Wind effect ──────────────────────────────────────────────────────────────
  var windTime = 0;
  var windStrength = 0.003;

  // ─── HUD ──────────────────────────────────────────────────────────────────────
  var hudEl = null;
  var notifEl = null;
  var notifTimer = 0;
  var crosshairEl = null;

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  function clamp(v, mn, mx) { return v < mn ? mn : v > mx ? mx : v; }
  function dist3d(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  function dist2d(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
  function randRange(a, b) { return a + Math.random() * (b - a); }

  // ─── Add to scene with tracking ───────────────────────────────────────────────
  function addToScene(obj) {
    scene.add(obj);
    sceneObjects.push(obj);
    return obj;
  }

  // ─── Audio ────────────────────────────────────────────────────────────────────
  var audioCtx = null;
  function initAudio() {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; }
  }
  function playTone(freq, dur, type, vol) {
    if (!audioCtx) return;
    try {
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.3, audioCtx.currentTime + dur);
      gain.gain.setValueAtTime(vol || 0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    } catch (e) {}
  }
  function playShot() { playTone(900, 0.07, 'square', 0.25); }
  function playHit()  { playTone(200, 0.1,  'sawtooth', 0.2); }
  function playKill() { playTone(350, 0.18, 'square', 0.28); }
  function playAlert(){ playTone(1400, 0.12, 'sine', 0.18); }

  // ─── HUD setup ────────────────────────────────────────────────────────────────
  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'rs-hud';
    hudEl.style.cssText = [
      'position:fixed', 'top:10px', 'left:10px',
      'color:#FF4400', 'font:bold 13px monospace',
      'z-index:9100', 'text-shadow:0 0 8px #FF4400',
      'pointer-events:none', 'line-height:1.7'
    ].join(';');
    document.body.appendChild(hudEl);

    crosshairEl = document.createElement('div');
    crosshairEl.id = 'rs-crosshair';
    crosshairEl.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#FF4400', 'font:bold 22px monospace',
      'z-index:9101', 'pointer-events:none',
      'text-shadow:0 0 6px #FF6600'
    ].join(';');
    crosshairEl.textContent = '+';
    document.body.appendChild(crosshairEl);

    notifEl = document.createElement('div');
    notifEl.id = 'rs-notif';
    notifEl.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-200%)',
      'color:#FFCC00', 'font:bold 15px monospace',
      'z-index:9102', 'pointer-events:none',
      'text-shadow:0 0 10px #FFAA00',
      'text-align:center', 'white-space:nowrap'
    ].join(';');
    document.body.appendChild(notifEl);

    var hintEl = document.createElement('div');
    hintEl.id = 'rs-hint';
    hintEl.style.cssText = [
      'position:fixed', 'bottom:10px', 'left:10px',
      'color:#556677', 'font:11px monospace',
      'z-index:9101', 'pointer-events:none', 'line-height:1.5'
    ].join(';');
    hintEl.innerHTML = 'WASD: move &nbsp;|&nbsp; Mouse: aim &nbsp;|&nbsp; Click: shoot &nbsp;|&nbsp; R+T: toggle off<br>Click screen to lock mouse';
    document.body.appendChild(hintEl);
  }

  function updateHUD() {
    if (!hudEl) return;
    var bossStr = bossState === 'ESCAPING'
      ? '<span style="color:#FF2200;animation:none">BOSS STATUS: ESCAPING &#9650;</span>'
      : '<span style="color:#00FF88">BOSS DOWN: MISSION COMPLETE &#10003;</span>';
    var hpColor = playerHP > 60 ? '#00FF88' : playerHP > 30 ? '#FFCC00' : '#FF2200';
    var guarded = countAliveGuards();
    var pilotStr = pilotState === 'DOWN' ? 'NEUTRALIZED'
      : pilotActivated ? 'ACTIVE - COVERING BOSS'
      : 'STANDBY IN COCKPIT';
    hudEl.innerHTML = [
      'ROOFTOP SHOWDOWN',
      '[HP: <span style="color:' + hpColor + '">' + playerHP + '/' + playerMaxHP + '</span>]',
      '[' + bossStr + ']',
      '[BOSS HP: ' + Math.max(0, bossHP) + '/' + bossMaxHP + ']',
      '[BODYGUARDS: ' + guarded + ']',
      '[PILOT: ' + pilotStr + ']',
      '[WAVE: ' + currentWave + '/' + totalWaves + ']'
    ].join('<br>');
  }

  function showNotif(msg) {
    if (!notifEl) return;
    notifEl.textContent = msg;
    notifTimer = 3.0;
    notifEl.style.opacity = '1';
  }

  function countAliveGuards() {
    var c = 0;
    for (var i = 0; i < bodyguards.length; i++) {
      if (bodyguards[i].alive) c++;
    }
    return c;
  }

  // ─── Scene building ───────────────────────────────────────────────────────────
  function buildRooftop(T) {
    // Night sky backdrop
    scene.background = new T.Color(0x020408);
    scene.fog = new T.FogExp2(0x030509, 0.012);

    // Ambient + directional light
    var ambient = new T.AmbientLight(0x112233, 0.6);
    addToScene(ambient);

    var dirLight = new T.DirectionalLight(0x334466, 0.8);
    dirLight.position.set(10, 20, 5);
    addToScene(dirLight);

    buildRooftopDeck(T);
    buildHVACUnits(T);
    buildWaterTower(T);
    buildHelicopter(T);
    buildNeonBillboards(T);
    buildSkylightDomes(T);
    buildRappelAnchors(T);
    buildSurroundingCity(T);
    spawnBoss(T);
    spawnPilot(T);
    spawnBodyguards(T, currentWave);
  }

  function buildRooftopDeck(T) {
    // Main roof slab
    var roofGeo = new T.BoxGeometry(40, 0.5, 50);
    var roofMat = new T.MeshLambertMaterial({ color: 0x1A1A22 });
    var roofMesh = new T.Mesh(roofGeo, roofMat);
    roofMesh.position.set(0, -0.25, 0);
    addToScene(roofMesh);

    // Parapet walls
    var parMat = new T.MeshLambertMaterial({ color: 0x141420 });
    // North
    var parN = new T.Mesh(new T.BoxGeometry(40, 1.2, 0.6), parMat);
    parN.position.set(0, 0.6, -25);
    addToScene(parN);
    // South
    var parS = new T.Mesh(new T.BoxGeometry(40, 1.2, 0.6), parMat);
    parS.position.set(0, 0.6, 25);
    addToScene(parS);
    // East
    var parE = new T.Mesh(new T.BoxGeometry(0.6, 1.2, 50), parMat);
    parE.position.set(20, 0.6, 0);
    addToScene(parE);
    // West
    var parW = new T.Mesh(new T.BoxGeometry(0.6, 1.2, 50), parMat);
    parW.position.set(-20, 0.6, 0);
    addToScene(parW);

    // Helipad circle (LineSegments approximation using thin boxes)
    var hpMat = new T.MeshLambertMaterial({ color: 0x004433, emissive: new T.Color(0x002211) });
    var hpPad = new T.Mesh(new T.BoxGeometry(10, 0.05, 10), hpMat);
    hpPad.position.set(-8, 0.02, -10);
    addToScene(hpPad);

    // H marking on helipad using LineSegments
    var hPts = [
      -1.5, 0.05, 0,   -1.5, 0.05, -2.5,
      -1.5, 0.05, -1.25,  1.5, 0.05, -1.25,
       1.5, 0.05, 0,    1.5, 0.05, -2.5
    ];
    var hGeo = new T.BufferGeometry();
    hGeo.setAttribute('position', new T.Float32BufferAttribute(hPts, 3));
    var hMat = new T.LineBasicMaterial({ color: 0x00FFAA });
    var hLines = new T.LineSegments(hGeo, hMat);
    hLines.position.set(-8, 0.02, -8.75);
    addToScene(hLines);

    // Helipad border ring (LineSegments octagon)
    var ringPts = [];
    var segs = 12;
    var radius = 5.2;
    for (var ri = 0; ri < segs; ri++) {
      var a0 = (ri / segs) * Math.PI * 2;
      var a1 = ((ri + 1) / segs) * Math.PI * 2;
      ringPts.push(
        Math.cos(a0) * radius, 0.05, Math.sin(a0) * radius,
        Math.cos(a1) * radius, 0.05, Math.sin(a1) * radius
      );
    }
    var ringGeo = new T.BufferGeometry();
    ringGeo.setAttribute('position', new T.Float32BufferAttribute(ringPts, 3));
    var ringMat = new T.LineBasicMaterial({ color: 0xFF4400 });
    var ringLines = new T.LineSegments(ringGeo, ringMat);
    ringLines.position.set(-8, 0, -10);
    addToScene(ringLines);

    // Rooftop access hatch
    var hatchGeo = new T.BoxGeometry(2, 0.3, 2);
    var hatchMat = new T.MeshLambertMaterial({ color: 0x222230 });
    var hatch = new T.Mesh(hatchGeo, hatchMat);
    hatch.position.set(8, 0.15, 10);
    addToScene(hatch);

    // Hatch door (open)
    var hDoorGeo = new T.BoxGeometry(2, 0.1, 1.8);
    var hDoorMat = new T.MeshLambertMaterial({ color: 0x333344 });
    var hDoor = new T.Mesh(hDoorGeo, hDoorMat);
    hDoor.position.set(8, 0.4, 9.1);
    hDoor.rotation.x = -Math.PI / 3;
    addToScene(hDoor);

    // Roof stairwell box
    var stairBox = new T.Mesh(new T.BoxGeometry(4, 3, 4), new T.MeshLambertMaterial({ color: 0x181826 }));
    stairBox.position.set(8, 1.5, 12);
    addToScene(stairBox);

    // Ventilation shaft runs
    var ventMat = new T.MeshLambertMaterial({ color: 0x222233 });
    var vent1 = new T.Mesh(new T.BoxGeometry(8, 0.6, 1.2), ventMat);
    vent1.position.set(6, 0.3, -5);
    addToScene(vent1);
    var vent2 = new T.Mesh(new T.BoxGeometry(1.2, 0.6, 12), ventMat);
    vent2.position.set(10, 0.3, -5);
    addToScene(vent2);

    // Vent grate (LineSegments)
    var gratePts = [];
    for (var gi = 0; gi < 7; gi++) {
      var gx = 2 + gi * 1.1;
      gratePts.push(gx, 0.01, -0.55,  gx, 0.01, 0.55);
    }
    for (var gj = 0; gj < 3; gj++) {
      var gz = -0.4 + gj * 0.4;
      gratePts.push(2, 0.01, gz,  9.6, 0.01, gz);
    }
    var grateGeo = new T.BufferGeometry();
    grateGeo.setAttribute('position', new T.Float32BufferAttribute(gratePts, 3));
    var grateMat = new T.LineBasicMaterial({ color: 0x334455 });
    var grateLines = new T.LineSegments(grateGeo, grateMat);
    grateLines.position.set(6, 0.62, -5);
    addToScene(grateLines);
  }

  function buildHVACUnits(T) {
    // 4 HVAC units scattered on roof
    var hvacDefs = [
      { x:  12, z:  8,  w: 3, h: 1.8, d: 2.5 },
      { x: -14, z:  6,  w: 2.5, h: 2, d: 2   },
      { x:  14, z: -6,  w: 3, h: 1.6, d: 2.5 },
      { x: -12, z: -18, w: 2.5, h: 2, d: 3   }
    ];
    for (var i = 0; i < hvacDefs.length; i++) {
      var d = hvacDefs[i];
      var bodyGeo = new T.BoxGeometry(d.w, d.h, d.d);
      var bodyMat = new T.MeshLambertMaterial({ color: 0x5A5A6A });
      var body = new T.Mesh(bodyGeo, bodyMat);
      body.position.set(d.x, d.h / 2, d.z);
      addToScene(body);
      hvacUnits.push(body);

      // Fan grille top
      var grillGeo = new T.BoxGeometry(d.w * 0.8, 0.08, d.d * 0.8);
      var grillMat = new T.MeshLambertMaterial({ color: 0x444455 });
      var grill = new T.Mesh(grillGeo, grillMat);
      grill.position.set(d.x, d.h + 0.04, d.z);
      addToScene(grill);

      // Fan blades (CylinderGeometry thin disc)
      var fanGeo = new T.CylinderGeometry(d.w * 0.3, d.w * 0.3, 0.05, 8);
      var fanMat = new T.MeshLambertMaterial({ color: 0x333344 });
      var fan = new T.Mesh(fanGeo, fanMat);
      fan.position.set(d.x, d.h + 0.1, d.z);
      addToScene(fan);

      // HVAC pipes
      var pipeGeo = new T.CylinderGeometry(0.12, 0.12, d.h, 6);
      var pipeMat = new T.MeshLambertMaterial({ color: 0x448866 });
      var pipe = new T.Mesh(pipeGeo, pipeMat);
      pipe.position.set(d.x + d.w * 0.4, d.h / 2, d.z + d.d * 0.45);
      addToScene(pipe);

      // Neon indicator light on HVAC
      var indicatorLight = new T.PointLight(0x00FF88, 0.8, 5);
      indicatorLight.position.set(d.x, d.h + 0.3, d.z);
      addToScene(indicatorLight);
      neonLights.push(indicatorLight);
    }
  }

  function buildWaterTower(T) {
    // Base legs (CylinderGeometry)
    var legMat = new T.MeshLambertMaterial({ color: 0x4A4A55 });
    var legPositions = [
      [ 1.2, 1.2], [-1.2, 1.2], [ 1.2,-1.2], [-1.2,-1.2]
    ];
    for (var li = 0; li < legPositions.length; li++) {
      var lp = legPositions[li];
      var legGeo = new T.CylinderGeometry(0.1, 0.12, 3.5, 6);
      var leg = new T.Mesh(legGeo, legMat);
      leg.position.set(15 + lp[0], 1.75, 18 + lp[1]);
      addToScene(leg);
    }

    // Cross braces (LineSegments)
    var bracePts = [
       1.2, 0.5,  1.2,   -1.2, 3,    -1.2,
      -1.2, 0.5,  1.2,    1.2, 3,    -1.2,
       1.2, 0.5, -1.2,   -1.2, 3,     1.2,
      -1.2, 0.5, -1.2,    1.2, 3,     1.2
    ];
    var braceGeo = new T.BufferGeometry();
    braceGeo.setAttribute('position', new T.Float32BufferAttribute(bracePts, 3));
    var braceMat = new T.LineBasicMaterial({ color: 0x556677 });
    var braceLines = new T.LineSegments(braceGeo, braceMat);
    braceLines.position.set(15, 0, 18);
    addToScene(braceLines);

    // Tank body (CylinderGeometry)
    var tankGeo = new T.CylinderGeometry(2, 2, 2.5, 12);
    var tankMat = new T.MeshLambertMaterial({ color: 0x3A3A44 });
    waterTower = new T.Mesh(tankGeo, tankMat);
    waterTower.position.set(15, 4.75, 18);
    addToScene(waterTower);

    // Tank roof cone (ConeGeometry)
    var coneGeo = new T.ConeGeometry(2.1, 1.2, 12);
    var coneMat = new T.MeshLambertMaterial({ color: 0x2A2A33 });
    var cone = new T.Mesh(coneGeo, coneMat);
    cone.position.set(15, 6.6, 18);
    addToScene(cone);

    // Satellite dish on water tower
    var dishBaseGeo = new T.CylinderGeometry(0.08, 0.08, 1, 6);
    var dishBase = new T.Mesh(dishBaseGeo, new T.MeshLambertMaterial({ color: 0x555566 }));
    dishBase.position.set(15, 6.1, 16);
    addToScene(dishBase);

    var dishGeo = new T.SphereGeometry(0.6, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
    var dishMat = new T.MeshLambertMaterial({ color: 0xCCCCDD });
    var dish = new T.Mesh(dishGeo, dishMat);
    dish.position.set(15, 6.6, 16);
    dish.rotation.x = -Math.PI / 4;
    addToScene(dish);
  }

  function buildHelicopter(T) {
    // Fuselage (box body)
    var bodyGeo = new T.BoxGeometry(4, 1.4, 1.6);
    var bodyMat = new T.MeshLambertMaterial({ color: 0x111122 });
    var heliBody = new T.Mesh(bodyGeo, bodyMat);
    heliBody.position.set(-8, 1.4, -10);
    addToScene(heliBody);

    // Cockpit nose (smaller box, forward)
    var noseGeo = new T.BoxGeometry(1.8, 1.1, 1.5);
    var noseMat = new T.MeshLambertMaterial({ color: 0x001833, emissive: new T.Color(0x000511) });
    var nose = new T.Mesh(noseGeo, noseMat);
    nose.position.set(-8 - 2.6, 1.35, -10);
    addToScene(nose);

    // Cockpit glass tint
    var glassGeo = new T.BoxGeometry(1.6, 0.9, 1.4);
    var glassMat = new T.MeshLambertMaterial({ color: 0x003355, transparent: true, opacity: 0.7 });
    var glass = new T.Mesh(glassGeo, glassMat);
    glass.position.set(-8 - 2.5, 1.4, -10);
    addToScene(glass);

    // Tail boom
    var tailGeo = new T.BoxGeometry(3.5, 0.5, 0.5);
    var tailMat = new T.MeshLambertMaterial({ color: 0x111122 });
    var tail = new T.Mesh(tailGeo, tailMat);
    tail.position.set(-8 + 3.7, 1.5, -10);
    addToScene(tail);

    // Tail fin
    var finGeo = new T.BoxGeometry(0.4, 1.0, 0.4);
    var finMat = new T.MeshLambertMaterial({ color: 0x151525 });
    var fin = new T.Mesh(finGeo, finMat);
    fin.position.set(-8 + 5.3, 1.9, -10);
    addToScene(fin);

    // Tail rotor (small cylinder)
    var tailRotorGeo = new T.CylinderGeometry(0.5, 0.5, 0.1, 6);
    var tailRotorMat = new T.MeshLambertMaterial({ color: 0x333344 });
    var tailRotor = new T.Mesh(tailRotorGeo, tailRotorMat);
    tailRotor.rotation.z = Math.PI / 2;
    tailRotor.position.set(-8 + 5.4, 2.3, -10.3);
    addToScene(tailRotor);

    // Landing skids
    var skidMat = new T.MeshLambertMaterial({ color: 0x222233 });
    var skid1 = new T.Mesh(new T.BoxGeometry(5, 0.1, 0.2), skidMat);
    skid1.position.set(-8, 0.65, -10 + 0.8);
    addToScene(skid1);
    var skid2 = new T.Mesh(new T.BoxGeometry(5, 0.1, 0.2), skidMat);
    skid2.position.set(-8, 0.65, -10 - 0.8);
    addToScene(skid2);

    // Skid struts
    var strutMat = new T.MeshLambertMaterial({ color: 0x333344 });
    var strut1F = new T.Mesh(new T.BoxGeometry(0.1, 0.6, 0.8), strutMat);
    strut1F.position.set(-8 - 1.2, 0.95, -10);
    addToScene(strut1F);
    var strut1R = new T.Mesh(new T.BoxGeometry(0.1, 0.6, 0.8), strutMat);
    strut1R.position.set(-8 + 1.2, 0.95, -10);
    addToScene(strut1R);

    // Main rotor hub (CylinderGeometry)
    var hubGeo = new T.CylinderGeometry(0.2, 0.2, 0.4, 8);
    var hubMat = new T.MeshLambertMaterial({ color: 0x444455 });
    var hub = new T.Mesh(hubGeo, hubMat);
    hub.position.set(-8, 2.3, -10);
    addToScene(hub);

    // Main rotor blade — SPINNING CylinderGeometry (very flat disc)
    var rotorGeo = new T.CylinderGeometry(3.2, 3.2, 0.06, 4);
    var rotorMat = new T.MeshLambertMaterial({ color: 0x222233, transparent: true, opacity: 0.7 });
    heliRotorMesh = new T.Mesh(rotorGeo, rotorMat);
    heliRotorMesh.position.set(-8, 2.55, -10);
    addToScene(heliRotorMesh);

    // Nav lights
    var redLight = new T.PointLight(0xFF0000, 1.2, 6);
    redLight.position.set(-8 - 2, 1.3, -10 + 1.2);
    addToScene(redLight);
    neonLights.push(redLight);

    var greenLight = new T.PointLight(0x00FF44, 1.2, 6);
    greenLight.position.set(-8 - 2, 1.3, -10 - 1.2);
    addToScene(greenLight);
    neonLights.push(greenLight);

    helicopter = heliBody;
  }

  function buildNeonBillboards(T) {
    // 3 neon billboard signs propped at roof edge facing outward
    var billDefs = [
      { x:  18, y: 4,  z:  -5, ry: Math.PI / 2,  col: 0xFF0088, emCol: 0x880044, label: 'NEON_A' },
      { x: -18, y: 5,  z:   5, ry: -Math.PI / 2, col: 0x00CCFF, emCol: 0x006688, label: 'NEON_B' },
      { x:   5, y: 4.5, z: -24, ry: 0,            col: 0xFF8800, emCol: 0x883300, label: 'NEON_C' }
    ];
    for (var bi = 0; bi < billDefs.length; bi++) {
      var bd = billDefs[bi];
      // Board face
      var boardGeo = new T.BoxGeometry(6, 3, 0.15);
      var boardMat = new T.MeshLambertMaterial({
        color: bd.col,
        emissive: new T.Color(bd.emCol)
      });
      var board = new T.Mesh(boardGeo, boardMat);
      board.position.set(bd.x, bd.y, bd.z);
      board.rotation.y = bd.ry;
      addToScene(board);
      billboards.push(board);

      // Support post
      var postGeo = new T.CylinderGeometry(0.1, 0.12, bd.y, 6);
      var postMat = new T.MeshLambertMaterial({ color: 0x333344 });
      var post = new T.Mesh(postGeo, postMat);
      post.position.set(bd.x, bd.y / 2, bd.z);
      addToScene(post);

      // Billboard light halo
      var billLight = new T.PointLight(bd.col, 2.5, 18);
      billLight.position.set(bd.x, bd.y, bd.z);
      addToScene(billLight);
      neonLights.push(billLight);

      // Neon frame lines
      var fPts = [
        -3, -1.5, 0.1,  3, -1.5, 0.1,
         3, -1.5, 0.1,  3,  1.5, 0.1,
         3,  1.5, 0.1, -3,  1.5, 0.1,
        -3,  1.5, 0.1, -3, -1.5, 0.1
      ];
      var fGeo = new T.BufferGeometry();
      fGeo.setAttribute('position', new T.Float32BufferAttribute(fPts, 3));
      var fMat = new T.LineBasicMaterial({ color: 0xFFFFFF });
      var fLines = new T.LineSegments(fGeo, fMat);
      board.add(fLines);
    }
  }

  function buildSkylightDomes(T) {
    // 2 skylight domes (SphereGeometry half-sphere)
    var domeDefs = [
      { x: 4, z: -2 },
      { x: -4, z: 4 }
    ];
    for (var di = 0; di < domeDefs.length; di++) {
      var dd = domeDefs[di];
      // Dome base rim
      var rimGeo = new T.CylinderGeometry(1.2, 1.2, 0.2, 12);
      var rimMat = new T.MeshLambertMaterial({ color: 0x334455 });
      var rim = new T.Mesh(rimGeo, rimMat);
      rim.position.set(dd.x, 0.1, dd.z);
      addToScene(rim);

      // Glass dome
      var domeGeo = new T.SphereGeometry(1.2, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2);
      var domeMat = new T.MeshLambertMaterial({
        color: 0x4488AA,
        transparent: true,
        opacity: 0.45,
        emissive: new T.Color(0x112233)
      });
      var dome = new T.Mesh(domeGeo, domeMat);
      dome.position.set(dd.x, 0.2, dd.z);
      addToScene(dome);
      skylightDomes.push(dome);

      // Warm light spilling upward
      var domeLight = new T.PointLight(0x4488CC, 1.5, 8);
      domeLight.position.set(dd.x, 1.5, dd.z);
      addToScene(domeLight);
      neonLights.push(domeLight);

      // Frame bars over dome (LineSegments cross)
      var crossPts = [
        -1.2, 0, 0,   1.2, 0, 0,
         0, 0, -1.2,  0, 0, 1.2
      ];
      var crossGeo = new T.BufferGeometry();
      crossGeo.setAttribute('position', new T.Float32BufferAttribute(crossPts, 3));
      var crossMat = new T.LineBasicMaterial({ color: 0x556677 });
      var crossLines = new T.LineSegments(crossGeo, crossMat);
      crossLines.position.set(dd.x, 0.2, dd.z);
      addToScene(crossLines);
    }
  }

  function buildRappelAnchors(T) {
    // 3 rappel anchor points on parapet edge
    var anchorDefs = [
      { x: -19, z: 0 },
      { x: 19, z: -5 },
      { x: 0, z: 24 }
    ];
    for (var ai = 0; ai < anchorDefs.length; ai++) {
      var ad = anchorDefs[ai];
      // Anchor bolt base
      var boltGeo = new T.BoxGeometry(0.4, 0.3, 0.4);
      var boltMat = new T.MeshLambertMaterial({ color: 0x888899 });
      var bolt = new T.Mesh(boltGeo, boltMat);
      bolt.position.set(ad.x, 1.3, ad.z);
      addToScene(bolt);

      // Anchor ring (CylinderGeometry thin torus approximation)
      var ringGeo = new T.CylinderGeometry(0.18, 0.18, 0.06, 8);
      var ringMat = new T.MeshLambertMaterial({ color: 0xCCCCDD });
      var ring = new T.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(ad.x, 1.65, ad.z);
      addToScene(ring);

      // Rope hanging down (CylinderGeometry)
      var ropeGeo = new T.CylinderGeometry(0.03, 0.03, 4, 4);
      var ropeMat = new T.MeshLambertMaterial({ color: 0xAA8855 });
      var rope = new T.Mesh(ropeGeo, ropeMat);
      rope.position.set(ad.x, -1.3, ad.z);
      addToScene(rope);

      rappelAnchors.push(bolt);
    }
  }

  function buildSurroundingCity(T) {
    // Distant skyscrapers giving depth
    var cityDefs = [
      { x: -60, z: -30, w: 12, h: 80, d: 12, col: 0x050510 },
      { x:  55, z: -25, w: 10, h: 90, d: 10, col: 0x040412 },
      { x: -50, z:  20, w: 14, h: 65, d: 14, col: 0x060612 },
      { x:  60, z:  10, w: 11, h: 75, d: 11, col: 0x050510 },
      { x:  -5, z: -55, w: 16, h: 100, d: 16, col: 0x040410 },
      { x:  20, z: -50, w: 10, h: 60, d: 10, col: 0x050511 },
      { x: -35, z: -50, w: 8,  h: 50, d: 8,  col: 0x060612 }
    ];
    for (var ci = 0; ci < cityDefs.length; ci++) {
      var cd = cityDefs[ci];
      var bGeo = new T.BoxGeometry(cd.w, cd.h, cd.d);
      var bMat = new T.MeshLambertMaterial({ color: cd.col });
      var bMesh = new T.Mesh(bGeo, bMat);
      // Place these buildings so their tops are below our rooftop (y=0 is rooftop)
      bMesh.position.set(cd.x, cd.h / 2 - 80, cd.z);
      addToScene(bMesh);

      // Random window lights (PointLight neon)
      var wLight = new T.PointLight(Math.random() > 0.5 ? 0xFF6600 : 0x0088FF, 0.6, 25);
      wLight.position.set(cd.x, cd.h / 2 - 80 + randRange(-cd.h * 0.3, cd.h * 0.3), cd.z);
      addToScene(wLight);
      neonLights.push(wLight);
    }

    // Ground plane far below (visible as city ground)
    var groundGeo = new T.BoxGeometry(400, 0.5, 400);
    var groundMat = new T.MeshLambertMaterial({ color: 0x050508 });
    var ground = new T.Mesh(groundGeo, groundMat);
    ground.position.set(0, -100, 0);
    addToScene(ground);
  }

  // ─── Boss ─────────────────────────────────────────────────────────────────────
  function spawnBoss(T) {
    // Body - dark suit
    var bodyGeo = new T.BoxGeometry(0.8, 1.8, 0.5);
    var bodyMat = new T.MeshLambertMaterial({ color: 0x080808 });
    var body = new T.Mesh(bodyGeo, bodyMat);
    body.position.set(bossTarget.x, 0.9, bossTarget.z);
    addToScene(body);

    // Head
    var headGeo = new T.BoxGeometry(0.55, 0.55, 0.55);
    var headMat = new T.MeshLambertMaterial({ color: 0xBB9977 });
    var head = new T.Mesh(headGeo, headMat);
    head.position.set(0, 1.15, 0);
    body.add(head);

    // White shirt collar
    var collarGeo = new T.BoxGeometry(0.5, 0.35, 0.35);
    var collarMat = new T.MeshLambertMaterial({ color: 0xEEEEDD });
    var collar = new T.Mesh(collarGeo, collarMat);
    collar.position.set(0, 0.65, 0.1);
    body.add(collar);

    // Tie
    var tieGeo = new T.BoxGeometry(0.12, 0.8, 0.08);
    var tieMat = new T.MeshLambertMaterial({ color: 0x880000 });
    var tie = new T.Mesh(tieGeo, tieMat);
    tie.position.set(0, 0.3, 0.22);
    body.add(tie);

    // Brief case
    var caseGeo = new T.BoxGeometry(0.6, 0.4, 0.15);
    var caseMat = new T.MeshLambertMaterial({ color: 0x331100 });
    var briefcase = new T.Mesh(caseGeo, caseMat);
    briefcase.position.set(0.55, -0.4, 0);
    body.add(briefcase);

    boss = {
      mesh: body,
      hp: bossHP,
      pos: { x: bossTarget.x, y: 0.9, z: bossTarget.z },
      state: 'ESCAPING',
      moveTimer: 0,
      attackTimer: 4.0,
      attackInterval: 4.0,
      fallTimer: 0,
      falling: false
    };
  }

  // ─── Helicopter pilot ─────────────────────────────────────────────────────────
  function spawnPilot(T) {
    var bodyGeo = new T.BoxGeometry(0.6, 1.5, 0.45);
    var bodyMat = new T.MeshLambertMaterial({ color: 0x111155 });
    var body = new T.Mesh(bodyGeo, bodyMat);
    body.position.set(-8, 1.65, -10);
    addToScene(body);

    // Helmet
    var helmGeo = new T.SphereGeometry(0.3, 8, 6);
    var helmMat = new T.MeshLambertMaterial({ color: 0x223344 });
    var helm = new T.Mesh(helmGeo, helmMat);
    helm.position.set(0, 0.9, 0);
    body.add(helm);

    // Visor
    var visorGeo = new T.BoxGeometry(0.35, 0.15, 0.1);
    var visorMat = new T.MeshLambertMaterial({ color: 0x445566, emissive: new T.Color(0x001122) });
    var visor = new T.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.9, 0.28);
    body.add(visor);

    pilotMesh = body;
  }

  // ─── Bodyguards (syndicate in suits) ─────────────────────────────────────────
  function spawnBodyguards(T, wave) {
    bodyguards = [];
    var count = GUARD_COUNT + (wave - 1) * 2;
    var spawnPositions = [
      { x: -5, z: 5 }, { x: 5, z: 3 }, { x: 12, z: -2 },
      { x: -12, z: -3 }, { x: 0, z: -18 }, { x: 8, z: -15 },
      { x: -8, z: 8 }, { x: 15, z: 12 }
    ];
    for (var i = 0; i < count && i < spawnPositions.length; i++) {
      var sp = spawnPositions[i];
      var guard = buildGuard(T, sp.x + randRange(-1, 1), sp.z + randRange(-1, 1), i);
      bodyguards.push(guard);
    }
  }

  function buildGuard(T, px, pz, idx) {
    // Dark suit body
    var bodyGeo = new T.BoxGeometry(0.65, 1.7, 0.45);
    var bodyMat = new T.MeshLambertMaterial({ color: 0x101015 });
    var body = new T.Mesh(bodyGeo, bodyMat);
    body.position.set(px, 0.85, pz);
    addToScene(body);

    // Head
    var headGeo = new T.BoxGeometry(0.45, 0.45, 0.45);
    var headMat = new T.MeshLambertMaterial({ color: 0xBB9966 });
    var head = new T.Mesh(headGeo, headMat);
    head.position.set(0, 1.05, 0);
    body.add(head);

    // Earpiece indicator (LineSegments)
    var earPts = [0.23, 0.9, 0,   0.23, 0.7, 0.1];
    var earGeo = new T.BufferGeometry();
    earGeo.setAttribute('position', new T.Float32BufferAttribute(earPts, 3));
    var earMat = new T.LineBasicMaterial({ color: 0x00FFCC });
    body.add(new T.LineSegments(earGeo, earMat));

    // Gun
    var gunGeo = new T.BoxGeometry(0.12, 0.22, 0.3);
    var gunMat = new T.MeshLambertMaterial({ color: 0x222222 });
    var gun = new T.Mesh(gunGeo, gunMat);
    gun.position.set(0.42, 0.0, 0.1);
    body.add(gun);

    return {
      mesh: body,
      hp: 60 + (currentWave - 1) * 10,
      pos: { x: px, y: 0.85, z: pz },
      alive: true,
      state: 'PATROL',
      attackTimer: randRange(1.5, 3.5),
      attackInterval: randRange(2.0, 3.5),
      patrolDir: Math.random() > 0.5 ? 1 : -1,
      patrolTimer: randRange(1, 3),
      falling: false,
      fallTimer: 0,
      fallTargetY: -80
    };
  }

  // ─── Controls ─────────────────────────────────────────────────────────────────
  function setupControls() {
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('mousedown', onMouseDown, false);
  }

  function teardownControls() {
    document.removeEventListener('keydown', onKeyDown, false);
    document.removeEventListener('keyup', onKeyUp, false);
    document.removeEventListener('mousemove', onMouseMove, false);
    document.removeEventListener('mousedown', onMouseDown, false);
  }

  function onKeyDown(e) {
    moveKeys[e.code] = true;

    // R+T toggle detection
    if (e.code === 'KeyR') {
      rDownAt = Date.now();
    }
    if (e.code === 'KeyT') {
      tDownAt = Date.now();
      if (rDownAt > 0 && (tDownAt - rDownAt) < ACTIVATION_WINDOW) {
        toggleModule();
        rDownAt = 0;
        tDownAt = 0;
      }
    }
  }

  function onKeyUp(e) {
    moveKeys[e.code] = false;
  }

  function onMouseMove(e) {
    if (!active) return;
    if (document.pointerLockElement !== document.body &&
        !document.pointerLockElement) return;
    playerYaw -= e.movementX * 0.002;
    playerPitch -= e.movementY * 0.002;
    playerPitch = clamp(playerPitch, -1.2, 1.2);
  }

  function onMouseDown(e) {
    if (!active || gameOver || gameWon) return;
    if (e.button === 0) { tryShoot(); }
  }

  function toggleModule() {
    if (active) {
      deactivate();
    } else {
      activate();
    }
  }

  // ─── Shooting ─────────────────────────────────────────────────────────────────
  function tryShoot() {
    if (shootCooldown > 0) return;
    shootCooldown = 0.2;
    spawnPlayerBullet();
    playShot();
  }

  function spawnPlayerBullet() {
    var T = window.THREE;
    var geo = new T.SphereGeometry(0.06, 4, 4);
    var mat = new T.MeshLambertMaterial({ color: 0xFFFF44 });
    var mesh = new T.Mesh(geo, mat);
    var fwd = getForwardDir();
    var startPos = { x: playerPos.x, y: playerPos.y + 1.6, z: playerPos.z };
    mesh.position.set(startPos.x, startPos.y, startPos.z);
    scene.add(mesh);
    sceneObjects.push(mesh);
    bullets.push({ mesh: mesh, pos: startPos, dir: fwd, speed: 45, life: 2.5 });
  }

  function spawnEnemyBullet(fromPos, toPos) {
    var T = window.THREE;
    var geo = new T.SphereGeometry(0.07, 4, 4);
    var mat = new T.MeshLambertMaterial({ color: 0xFF4400 });
    var mesh = new T.Mesh(geo, mat);
    mesh.position.set(fromPos.x, fromPos.y + 1.3, fromPos.z);
    scene.add(mesh);
    sceneObjects.push(mesh);
    var dx = toPos.x - fromPos.x;
    var dy = 0;
    var dz = toPos.z - fromPos.z;
    var len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.001) return;
    var dir = { x: dx / len, y: dy, z: dz / len };
    enemyBullets.push({ mesh: mesh, pos: { x: fromPos.x, y: fromPos.y + 1.3, z: fromPos.z }, dir: dir, speed: 22, life: 3.0 });
  }

  function getForwardDir() {
    var c = Math.cos(playerYaw);
    var s = Math.sin(playerYaw);
    var pc = Math.cos(playerPitch);
    return { x: -s * pc, y: Math.sin(playerPitch), z: -c * pc };
  }

  // ─── Bullet update ────────────────────────────────────────────────────────────
  function updateBullets(dt) {
    var i;
    for (i = bullets.length - 1; i >= 0; i--) {
      var b = bullets[i];
      b.pos.x += b.dir.x * b.speed * dt;
      b.pos.y += b.dir.y * b.speed * dt;
      b.pos.z += b.dir.z * b.speed * dt;
      b.mesh.position.set(b.pos.x, b.pos.y, b.pos.z);
      b.life -= dt;

      var hit = false;

      // Hit boss
      if (!hit && boss && boss.hp > 0 && !boss.falling) {
        if (dist3d(b.pos, boss.pos) < 1.2) {
          damageBoss(18);
          hit = true;
        }
      }

      // Hit guards
      if (!hit) {
        for (var gi = 0; gi < bodyguards.length; gi++) {
          var g = bodyguards[gi];
          if (!g.alive) continue;
          if (dist3d(b.pos, g.pos) < 1.0) {
            damageGuard(g, 22);
            hit = true;
            break;
          }
        }
      }

      // Hit pilot
      if (!hit && pilotState === 'ACTIVE' && pilotHP > 0) {
        var pPos = { x: pilotMesh.position.x, y: pilotMesh.position.y, z: pilotMesh.position.z };
        if (dist3d(b.pos, pPos) < 1.0) {
          pilotHP -= 25;
          playHit();
          if (pilotHP <= 0) {
            pilotState = 'DOWN';
            if (pilotMesh) pilotMesh.visible = false;
            showNotif('PILOT NEUTRALIZED');
            playKill();
          }
          hit = true;
        }
      }

      if (hit || b.life <= 0 || b.pos.y < -5) {
        scene.remove(b.mesh);
        bullets.splice(i, 1);
      }
    }

    // Enemy bullets
    for (i = enemyBullets.length - 1; i >= 0; i--) {
      var eb = enemyBullets[i];
      eb.pos.x += eb.dir.x * eb.speed * dt;
      eb.pos.y += eb.dir.y * eb.speed * dt;
      eb.pos.z += eb.dir.z * eb.speed * dt;
      eb.mesh.position.set(eb.pos.x, eb.pos.y, eb.pos.z);
      eb.life -= dt;

      var playerHit = dist3d(eb.pos, { x: playerPos.x, y: playerPos.y + 1.5, z: playerPos.z }) < 0.8;
      if (playerHit) {
        damagePlayer(10);
        scene.remove(eb.mesh);
        enemyBullets.splice(i, 1);
      } else if (eb.life <= 0) {
        scene.remove(eb.mesh);
        enemyBullets.splice(i, 1);
      }
    }
  }

  // ─── Damage ───────────────────────────────────────────────────────────────────
  function damageBoss(dmg) {
    if (bossState === 'DOWN') return;
    bossHP -= dmg;
    boss.hp = bossHP;
    playHit();
    if (bossHP <= 0) {
      bossHP = 0;
      bossState = 'DOWN';
      boss.state = 'DOWN';
      boss.falling = true;
      gameWon = true;
      showNotif('BOSS DOWN: MISSION COMPLETE');
      playKill();
    }
  }

  function damageGuard(g, dmg) {
    if (!g.alive) return;
    g.hp -= dmg;
    playHit();
    if (g.hp <= 0) {
      g.alive = false;
      g.falling = true;
      g.fallTimer = 0;
      // Determine which edge to fall off
      g.fallTargetX = g.pos.x > 0 ? 25 : -25;
      playKill();
    } else {
      g.state = 'ALERT';
    }
  }

  function damagePlayer(dmg) {
    playerHP -= dmg;
    playHit();
    if (playerHP <= 0) {
      playerHP = 0;
      gameOver = true;
      showNotif('MISSION FAILED — BOSS ESCAPED');
    }
  }

  // ─── Boss AI ──────────────────────────────────────────────────────────────────
  function updateBossAI(dt) {
    if (!boss || bossState === 'DOWN') return;

    // Boss slowly moves toward helicopter
    var heliPos = { x: -8, z: -10 };
    var dx = heliPos.x - boss.pos.x;
    var dz = heliPos.z - boss.pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    var speed = 1.2;

    if (dist > 0.8) {
      boss.pos.x += (dx / dist) * speed * dt;
      boss.pos.z += (dz / dist) * speed * dt;
      boss.mesh.position.set(boss.pos.x, boss.pos.y, boss.pos.z);
    }

    // Boss face player direction
    var faceDx = playerPos.x - boss.pos.x;
    var faceDz = playerPos.z - boss.pos.z;
    boss.mesh.rotation.y = Math.atan2(faceDx, faceDz);

    // Boss attacks occasionally
    boss.attackTimer -= dt;
    if (boss.attackTimer <= 0) {
      boss.attackTimer = boss.attackInterval;
      var distToPlayer = dist2d(boss.pos, playerPos);
      if (distToPlayer < 20) {
        spawnEnemyBullet(boss.pos, playerPos);
      }
    }

    // Activate pilot if boss gets within 4 units of helicopter
    if (!pilotActivated && dist < 4) {
      pilotActivated = true;
      pilotState = 'ACTIVE';
      showNotif('PILOT ACTIVE — COVERING BOSS ESCAPE!');
      playAlert();
    }

    // Falling animation
    if (boss.falling) {
      boss.fallTimer = (boss.fallTimer || 0) + dt;
      boss.pos.y -= 4 * dt;
      boss.mesh.position.y = boss.pos.y;
      boss.mesh.rotation.z += dt * 2;
      if (boss.pos.y < -15) {
        boss.mesh.visible = false;
      }
    }
  }

  // ─── Pilot AI ─────────────────────────────────────────────────────────────────
  function updatePilotAI(dt) {
    if (!pilotMesh || pilotState !== 'ACTIVE') return;

    // Pilot stays near helicopter but fires at player
    var pilotAttackTimer = pilotMesh.userData.attackTimer || 2.0;
    pilotAttackTimer -= dt;
    if (pilotAttackTimer <= 0) {
      pilotAttackTimer = 2.5;
      var pPos = { x: pilotMesh.position.x, y: pilotMesh.position.y, z: pilotMesh.position.z };
      if (dist2d(pPos, playerPos) < 25) {
        spawnEnemyBullet(pPos, playerPos);
      }
    }
    pilotMesh.userData.attackTimer = pilotAttackTimer;

    // Pilot faces player
    var pdx = playerPos.x - pilotMesh.position.x;
    var pdz = playerPos.z - pilotMesh.position.z;
    pilotMesh.rotation.y = Math.atan2(pdx, pdz);
  }

  // ─── Guard AI ─────────────────────────────────────────────────────────────────
  function updateGuardAI(dt) {
    for (var gi = 0; gi < bodyguards.length; gi++) {
      var g = bodyguards[gi];

      // Handle falling animation
      if (g.falling) {
        g.fallTimer += dt;
        g.pos.x += (g.fallTargetX - g.pos.x) * dt * 0.8;
        g.pos.y -= 6 * dt;
        g.mesh.position.set(g.pos.x, g.pos.y, g.pos.z);
        g.mesh.rotation.z += dt * 3;
        if (g.pos.y < -20) {
          g.mesh.visible = false;
          g.alive = false;
          g.falling = false;
        }
        continue;
      }

      if (!g.alive) continue;

      var dx = playerPos.x - g.pos.x;
      var dz = playerPos.z - g.pos.z;
      var distToPlayer = Math.sqrt(dx * dx + dz * dz);

      if (distToPlayer < 15) {
        g.state = 'ALERT';
      }

      if (g.state === 'ALERT') {
        // Move toward player
        if (distToPlayer > 3) {
          var spd = 3.5;
          g.pos.x += (dx / distToPlayer) * spd * dt;
          g.pos.z += (dz / distToPlayer) * spd * dt;
          // Clamp to rooftop bounds
          g.pos.x = clamp(g.pos.x, -18, 18);
          g.pos.z = clamp(g.pos.z, -23, 23);
          g.mesh.position.set(g.pos.x, g.pos.y, g.pos.z);
          g.mesh.rotation.y = Math.atan2(dx, dz);
        }

        g.attackTimer -= dt;
        if (g.attackTimer <= 0) {
          g.attackTimer = g.attackInterval;
          if (distToPlayer < 25) {
            spawnEnemyBullet(g.pos, playerPos);
          }
        }
      } else {
        // Patrol
        g.patrolTimer -= dt;
        if (g.patrolTimer <= 0) {
          g.patrolTimer = randRange(2, 4);
          g.patrolDir = -g.patrolDir;
        }
        g.pos.x += g.patrolDir * 1.8 * dt;
        g.pos.x = clamp(g.pos.x, -16, 16);
        g.mesh.position.set(g.pos.x, g.pos.y, g.pos.z);
      }
    }
  }

  // ─── Wave management ──────────────────────────────────────────────────────────
  function checkWaveProgress(dt) {
    if (gameOver || gameWon) return;
    if (currentWave > totalWaves) return;

    var aliveCount = countAliveGuards();
    if (aliveCount === 0 && !waveCleared) {
      waveCleared = true;
      waveTimer = WAVE_RESPAWN_DELAY;
      if (currentWave < totalWaves) {
        showNotif('WAVE ' + currentWave + ' CLEARED — REINFORCEMENTS INCOMING');
      }
    }

    if (waveCleared && currentWave < totalWaves) {
      waveTimer -= dt;
      if (waveTimer <= 0) {
        currentWave++;
        waveCleared = false;
        var T = window.THREE;
        spawnBodyguards(T, currentWave);
        showNotif('WAVE ' + currentWave + ' — SYNDICATE REINFORCEMENTS ARRIVE');
        playAlert();
      }
    }
  }

  // ─── Player movement ──────────────────────────────────────────────────────────
  function updatePlayer(dt) {
    var fwd = { x: -Math.sin(playerYaw), z: -Math.cos(playerYaw) };
    var right = { x: Math.cos(playerYaw), z: -Math.sin(playerYaw) };
    var moveX = 0, moveZ = 0;

    if (moveKeys['KeyW'] || moveKeys['ArrowUp'])    { moveX += fwd.x; moveZ += fwd.z; }
    if (moveKeys['KeyS'] || moveKeys['ArrowDown'])  { moveX -= fwd.x; moveZ -= fwd.z; }
    if (moveKeys['KeyA'] || moveKeys['ArrowLeft'])  { moveX -= right.x; moveZ -= right.z; }
    if (moveKeys['KeyD'] || moveKeys['ArrowRight']) { moveX += right.x; moveZ += right.z; }

    var len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) {
      moveX = (moveX / len) * playerSpeed * dt;
      moveZ = (moveZ / len) * playerSpeed * dt;
    }

    playerPos.x = clamp(playerPos.x + moveX, -18, 18);
    playerPos.z = clamp(playerPos.z + moveZ, -23, 23);

    // Gravity
    if (!playerOnGround) {
      playerVelY -= 20 * dt;
    }
    playerPos.y += playerVelY * dt;
    if (playerPos.y <= 1) {
      playerPos.y = 1;
      playerVelY = 0;
      playerOnGround = true;
    }

    // Jump
    if ((moveKeys['Space']) && playerOnGround) {
      playerVelY = 8;
      playerOnGround = false;
    }
  }

  // ─── Camera (with wind sway) ──────────────────────────────────────────────────
  function updateCamera(dt) {
    if (!camera) return;
    windTime += dt;
    var windSway = Math.sin(windTime * 0.7) * windStrength;
    var windBob  = Math.sin(windTime * 1.1) * windStrength * 0.5;

    camera.position.set(playerPos.x, playerPos.y + 1.6, playerPos.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = playerYaw + windSway;
    camera.rotation.x = playerPitch + windBob;
    camera.rotation.z = Math.sin(windTime * 0.5) * windStrength * 0.3;
  }

  // ─── Cooldowns ────────────────────────────────────────────────────────────────
  function updateCooldowns(dt) {
    if (shootCooldown > 0) { shootCooldown -= dt; if (shootCooldown < 0) shootCooldown = 0; }
    if (meleeCooldown > 0) { meleeCooldown -= dt; if (meleeCooldown < 0) meleeCooldown = 0; }
  }

  // ─── Rotor animation ──────────────────────────────────────────────────────────
  function updateRotor(dt) {
    if (!heliRotorMesh) return;
    heliRotorAngle += dt * (bossState === 'ESCAPING' ? 5.0 : 0.5);
    heliRotorMesh.rotation.y = heliRotorAngle;
  }

  // ─── Notification display ─────────────────────────────────────────────────────
  function updateNotif(dt) {
    if (!notifEl) return;
    if (notifTimer > 0) {
      notifTimer -= dt;
      notifEl.style.opacity = String(Math.min(1, notifTimer));
      if (notifTimer <= 0) {
        notifEl.textContent = '';
        notifEl.style.opacity = '0';
      }
    }
  }

  // ─── Neon billboard flicker ───────────────────────────────────────────────────
  function updateBillboardFlicker(dt) {
    windTime; // already updated in updateCamera
    for (var i = 0; i < neonLights.length; i++) {
      if (Math.random() < 0.002) {
        var l = neonLights[i];
        l.intensity = Math.random() * 0.5 + 0.3;
      }
    }
  }

  // ─── Activate / deactivate ────────────────────────────────────────────────────
  function activate() {
    if (active) return;
    var T = window.THREE;
    if (!T) { console.warn('RooftopShowdown: THREE is not defined'); return; }
    if (!scene || !camera) { console.warn('RooftopShowdown: init() must be called with scene and camera first'); return; }
    active = true;
    showNotif('ROOFTOP SHOWDOWN — ACTIVATED');
  }

  function deactivate() {
    if (!active) return;
    active = false;
    showNotif('ROOFTOP SHOWDOWN — DEACTIVATED');
  }

  // ─── Public: init ─────────────────────────────────────────────────────────────
  function init(sceneRef, cameraRef) {
    var T = window.THREE;
    if (!T) { console.warn('RooftopShowdown: THREE not found on window'); return; }

    scene = sceneRef;
    camera = cameraRef;

    initAudio();
    buildRooftop(T);
    buildHUD();
    setupControls();
    active = true;

    showNotif('ROOFTOP SHOWDOWN — BOSS IS ESCAPING — STOP HIM!');
  }

  // ─── Public: update ───────────────────────────────────────────────────────────
  function update(delta) {
    if (!active) return;

    var dt = delta || 0.016;
    dt = clamp(dt, 0, 0.1); // safety cap

    if (!gameOver && !gameWon) {
      updatePlayer(dt);
      updateBossAI(dt);
      updatePilotAI(dt);
      updateGuardAI(dt);
      checkWaveProgress(dt);
    }

    updateBullets(dt);
    updateCooldowns(dt);
    updateRotor(dt);
    updateCamera(dt);
    updateNotif(dt);
    updateBillboardFlicker(dt);
    updateHUD();
  }

  // ─── Public: reset ────────────────────────────────────────────────────────────
  function reset() {
    // Remove all tracked scene objects
    for (var i = 0; i < sceneObjects.length; i++) {
      if (scene && sceneObjects[i]) {
        scene.remove(sceneObjects[i]);
      }
    }
    sceneObjects = [];
    neonLights = [];

    // Clear bullets
    for (var bi = 0; bi < bullets.length; bi++) {
      if (scene) scene.remove(bullets[bi].mesh);
    }
    bullets = [];
    for (var ei = 0; ei < enemyBullets.length; ei++) {
      if (scene) scene.remove(enemyBullets[ei].mesh);
    }
    enemyBullets = [];

    // Reset HUD elements
    var hudOld = document.getElementById('rs-hud');
    if (hudOld) hudOld.parentNode.removeChild(hudOld);
    var xhOld = document.getElementById('rs-crosshair');
    if (xhOld) xhOld.parentNode.removeChild(xhOld);
    var notifOld = document.getElementById('rs-notif');
    if (notifOld) notifOld.parentNode.removeChild(notifOld);
    var hintOld = document.getElementById('rs-hint');
    if (hintOld) hintOld.parentNode.removeChild(hintOld);
    hudEl = null;
    crosshairEl = null;
    notifEl = null;

    // Reset game state
    active = false;
    gameOver = false;
    gameWon = false;
    playerHP = playerMaxHP;
    playerPos = { x: 0, y: 1, z: 12 };
    playerYaw = 0;
    playerPitch = 0;
    playerVelY = 0;
    playerOnGround = true;
    moveKeys = {};
    shootCooldown = 0;
    meleeCooldown = 0;
    windTime = 0;
    heliRotorAngle = 0;
    heliRotorMesh = null;
    helicopter = null;
    waterTower = null;
    hvacUnits = [];
    billboards = [];
    skylightDomes = [];
    rappelAnchors = [];
    boss = null;
    bossHP = 300;
    bossState = 'ESCAPING';
    pilotMesh = null;
    pilotActivated = false;
    pilotHP = 60;
    pilotState = 'IDLE';
    bodyguards = [];
    currentWave = 1;
    waveCleared = false;
    waveTimer = 0;
    rDownAt = 0;
    tDownAt = 0;
    notifTimer = 0;

    teardownControls();
    scene = null;
    camera = null;
  }

  return { init: init, update: update, reset: reset };

}());
