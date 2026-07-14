window.SpaceColony = (function () {
  'use strict';

  // ─── State variables ────────────────────────────────────────────────────────
  var scene, camera, renderer, clock;
  var playerHeight = 1.8;
  var playerSpeed = 8;
  var playerHP = 100;
  var oxygenLevel = 100;
  var lifeSupportSabotaged = false;
  var lifeSupportFixed = false;
  var fixingLifeSupport = false;
  var fixProgress = 0;
  var gameActive = false;
  var gameOver = false;
  var gameWon = false;

  var keys = {};
  var mouseDX = 0, mouseDY = 0;
  var yaw = 0, pitch = 0;
  var isPointerLocked = false;

  var enemies = [];
  var civilians = [];
  var decoys = [];
  var kessler = null;
  var decoyActive = false;

  var doors = [];
  var doorControls = [];

  var dustParticles = [];
  var stormActive = false;
  var stormTimer = 0;
  var stormCooldown = 90;
  var stormDuration = 30;
  var fogDefault = 80;
  var fogStorm = 15;

  var hud = null;
  var crosshair = null;
  var overlay = null;

  var raycaster;
  var shootCooldown = 0;
  var shootRate = 0.3;

  var civiliansSafe = true;
  var civiliansShot = 0;

  var sKeyTime = 0;
  var waitingForC = false;
  var activationListenerAdded = false;

  var lifeTerminal = null;
  var terminalPrompt = null;

  var bullets = [];

  var kesslerMesh = null;
  var kesslerActivated = false;

  // ─── Activation key combo ────────────────────────────────────────────────────
  function setupActivationListener() {
    if (activationListenerAdded) return;
    activationListenerAdded = true;
    document.addEventListener('keydown', function (e) {
      if (gameActive) return;
      if (e.key === 's' || e.key === 'S') {
        sKeyTime = Date.now();
        waitingForC = true;
      } else if ((e.key === 'c' || e.key === 'C') && waitingForC) {
        if (Date.now() - sKeyTime <= 400) {
          waitingForC = false;
          startGame();
        } else {
          waitingForC = false;
        }
      } else {
        waitingForC = false;
      }
    });
  }

  // ─── HUD Setup ───────────────────────────────────────────────────────────────
  function createHUD() {
    hud = document.createElement('div');
    hud.id = 'sc-hud';
    hud.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'pointer-events:none', 'font-family:monospace', 'color:#ff4400',
      'z-index:9999'
    ].join(';');

    var hudInner = document.createElement('div');
    hudInner.style.cssText = 'position:absolute;top:16px;left:16px;';
    hudInner.innerHTML = [
      '<div id="sc-hp">HP: 100</div>',
      '<div id="sc-oxy">O2: 100%</div>',
      '<div id="sc-ls">Life Support: ONLINE</div>',
      '<div id="sc-storm">Storm: 90s</div>',
      '<div id="sc-decoy"></div>',
      '<div id="sc-civs">Civilians Safe: 3/3</div>',
      '<div id="sc-fix"></div>'
    ].join('');
    hud.appendChild(hudInner);

    crosshair = document.createElement('div');
    crosshair.style.cssText = [
      'position:absolute', 'top:50%', 'left:50%',
      'width:20px', 'height:20px',
      'margin:-10px 0 0 -10px',
      'border:2px solid rgba(255,68,0,0.8)',
      'border-radius:50%'
    ].join(';');
    hud.appendChild(crosshair);

    overlay = document.createElement('div');
    overlay.id = 'sc-overlay';
    overlay.style.cssText = [
      'position:absolute', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'display:flex', 'align-items:center', 'justify-content:center',
      'background:rgba(0,0,0,0.85)', 'color:#ff4400',
      'font-size:28px', 'text-align:center', 'padding:40px',
      'box-sizing:border-box'
    ].join(';');
    overlay.innerHTML = '<div>SPACE COLONY: MARS RETAKE<br><span style="font-size:16px">Press S then C (within 400ms) to begin</span></div>';
    hud.appendChild(overlay);

    terminalPrompt = document.createElement('div');
    terminalPrompt.id = 'sc-terminal';
    terminalPrompt.style.cssText = [
      'position:absolute', 'bottom:80px', 'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)', 'color:#00ff88',
      'padding:8px 16px', 'border-radius:4px',
      'display:none', 'font-size:14px'
    ].join(';');
    terminalPrompt.textContent = 'Press E to fix life support (hold 5s)';
    hud.appendChild(terminalPrompt);

    document.body.appendChild(hud);
  }

  function updateHUD(dt) {
    if (!hud || !gameActive) return;
    var hpEl = document.getElementById('sc-hp');
    var oxyEl = document.getElementById('sc-oxy');
    var lsEl = document.getElementById('sc-ls');
    var stormEl = document.getElementById('sc-storm');
    var decoyEl = document.getElementById('sc-decoy');
    var civsEl = document.getElementById('sc-civs');
    var fixEl = document.getElementById('sc-fix');

    if (hpEl) hpEl.textContent = 'HP: ' + Math.max(0, Math.round(playerHP));
    if (oxyEl) oxyEl.textContent = 'O2: ' + Math.max(0, Math.round(oxygenLevel)) + '%';

    if (lsEl) {
      if (lifeSupportSabotaged && !lifeSupportFixed) {
        lsEl.textContent = 'Life Support: SABOTAGED';
        lsEl.style.color = '#ff0000';
      } else if (lifeSupportFixed) {
        lsEl.textContent = 'Life Support: RESTORED';
        lsEl.style.color = '#00ff88';
      } else {
        lsEl.textContent = 'Life Support: ONLINE';
        lsEl.style.color = '#ff4400';
      }
    }

    if (stormEl) {
      if (stormActive) {
        stormEl.textContent = 'DUST STORM: ' + Math.ceil(stormDuration - (stormTimer % stormDuration)) + 's';
        stormEl.style.color = '#ffaa00';
      } else {
        stormEl.textContent = 'Next Storm: ' + Math.ceil(stormCooldown - stormTimer) + 's';
        stormEl.style.color = '#ff4400';
      }
    }

    if (decoyEl) {
      if (decoyActive) {
        decoyEl.textContent = 'WARNING: HOLOGRAPHIC DECOYS ACTIVE';
        decoyEl.style.color = '#00ffff';
      } else {
        decoyEl.textContent = '';
      }
    }

    if (civsEl) {
      var safe = 3 - civiliansShot;
      civsEl.textContent = 'Civilians Safe: ' + safe + '/3';
      civsEl.style.color = civiliansShot > 0 ? '#ff0000' : '#ff4400';
    }

    if (fixEl && fixingLifeSupport) {
      fixEl.textContent = 'Fixing: ' + Math.round(fixProgress * 100) + '%';
      fixEl.style.color = '#00ff88';
    } else if (fixEl) {
      fixEl.textContent = '';
    }
  }

  function showOverlay(msg) {
    if (!overlay) return;
    overlay.style.display = 'flex';
    overlay.innerHTML = '<div>' + msg + '</div>';
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.style.display = 'none';
  }

  // ─── Scene Setup ─────────────────────────────────────────────────────────────
  function createScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0a00);
    scene.fog = new THREE.Fog(0x1a0a00, 10, fogDefault);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, playerHeight, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '9998';

    clock = new THREE.Clock();
    raycaster = new THREE.Raycaster();

    // Lights
    var ambient = new THREE.AmbientLight(0x331100, 0.6);
    scene.add(ambient);

    var sun = new THREE.DirectionalLight(0xff6633, 1.2);
    sun.position.set(50, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    scene.add(sun);

    buildTerrain();
    buildDomes();
    buildCorridors();
    buildLifeSupport();
    buildHydroponics();
    buildCommandCenter();
    buildAirlocks();
    buildDustParticles();
    spawnEnemies();
    spawnCivilians();
    buildDoors();
  }

  // ─── Terrain ─────────────────────────────────────────────────────────────────
  function buildTerrain() {
    var terrainGeo = new THREE.BoxGeometry(200, 2, 200);
    var terrainMat = new THREE.MeshLambertMaterial({ color: 0x8b3a1e });
    var terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.position.set(0, -1, 0);
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Mars rocks
    var rockPositions = [
      [-20, 0, -15], [25, 0, -30], [-40, 0, 20], [35, 0, 15],
      [-15, 0, 40], [50, 0, -10], [-55, 0, -25], [10, 0, 60]
    ];
    for (var r = 0; r < rockPositions.length; r++) {
      var rp = rockPositions[r];
      var rockGeo = new THREE.BoxGeometry(
        1.5 + Math.random() * 2, 0.8 + Math.random() * 1.5, 1.2 + Math.random() * 2
      );
      var rockMat = new THREE.MeshLambertMaterial({ color: 0x6b2e10 });
      var rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(rp[0], rp[1] + 0.4, rp[2]);
      rock.rotation.y = Math.random() * Math.PI;
      scene.add(rock);
    }
  }

  // ─── Domes ───────────────────────────────────────────────────────────────────
  function buildDomes() {
    // Main habitat dome
    var domeMat = new THREE.MeshLambertMaterial({ color: 0x88ccff, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
    var domeGeo = new THREE.CylinderGeometry(18, 18, 1, 16);
    var domeBase = new THREE.Mesh(domeGeo, new THREE.MeshLambertMaterial({ color: 0x555555 }));
    domeBase.position.set(0, 0, 0);
    scene.add(domeBase);

    var domeSphereGeo = new THREE.SphereGeometry(18, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    var domeSphere = new THREE.Mesh(domeSphereGeo, domeMat);
    domeSphere.position.set(0, 0.5, 0);
    scene.add(domeSphere);

    // Life support dome
    var lsDomeGeo = new THREE.SphereGeometry(12, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    var lsDome = new THREE.Mesh(lsDomeGeo, domeMat.clone());
    lsDome.position.set(-40, 0.5, 0);
    scene.add(lsDome);
    var lsDomeBase = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 0.5, 12), new THREE.MeshLambertMaterial({ color: 0x445566 }));
    lsDomeBase.position.set(-40, 0, 0);
    scene.add(lsDomeBase);

    // Hydroponics dome
    var hydDomeMat = new THREE.MeshLambertMaterial({ color: 0x66ff88, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
    var hydDomeGeo = new THREE.SphereGeometry(14, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    var hydDome = new THREE.Mesh(hydDomeGeo, hydDomeMat);
    hydDome.position.set(0, 0.5, -45);
    scene.add(hydDome);
    var hydBase = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 0.5, 12), new THREE.MeshLambertMaterial({ color: 0x336633 }));
    hydBase.position.set(0, 0, -45);
    scene.add(hydBase);

    // Command center dome
    var cmdDomeMat = new THREE.MeshLambertMaterial({ color: 0xffaa44, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
    var cmdDomeGeo = new THREE.SphereGeometry(16, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2);
    var cmdDome = new THREE.Mesh(cmdDomeGeo, cmdDomeMat);
    cmdDome.position.set(40, 0.5, 0);
    scene.add(cmdDome);
    var cmdBase = new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 0.5, 14), new THREE.MeshLambertMaterial({ color: 0x553311 }));
    cmdBase.position.set(40, 0, 0);
    scene.add(cmdBase);
  }

  // ─── Corridors ───────────────────────────────────────────────────────────────
  function buildCorridors() {
    var corridorMat = new THREE.MeshLambertMaterial({ color: 0x445566 });

    // Main dome to life support
    var c1 = new THREE.Mesh(new THREE.BoxGeometry(22, 3.5, 5), corridorMat);
    c1.position.set(-29, 1.75, 0);
    scene.add(c1);

    // Main dome to hydroponics
    var c2 = new THREE.Mesh(new THREE.BoxGeometry(5, 3.5, 26), corridorMat);
    c2.position.set(0, 1.75, -32);
    scene.add(c2);

    // Main dome to command center
    var c3 = new THREE.Mesh(new THREE.BoxGeometry(22, 3.5, 5), corridorMat);
    c3.position.set(29, 1.75, 0);
    scene.add(c3);

    // Floor strips
    var floorMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var f1 = new THREE.Mesh(new THREE.BoxGeometry(22, 0.1, 4.8), floorMat);
    f1.position.set(-29, 0.05, 0);
    scene.add(f1);
    var f2 = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.1, 26), floorMat);
    f2.position.set(0, 0.05, -32);
    scene.add(f2);
    var f3 = new THREE.Mesh(new THREE.BoxGeometry(22, 0.1, 4.8), floorMat);
    f3.position.set(29, 0.05, 0);
    scene.add(f3);

    // Ceiling lights along corridors
    var lightMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 });
    var positions = [[-35, 3.2, 0], [-23, 3.2, 0], [23, 3.2, 0], [35, 3.2, 0], [0, 3.2, -28], [0, 3.2, -36]];
    for (var i = 0; i < positions.length; i++) {
      var lp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 1.5), lightMat);
      lp.position.set(positions[i][0], positions[i][1], positions[i][2]);
      scene.add(lp);
      var pl = new THREE.PointLight(0xffffff, 0.6, 12);
      pl.position.set(positions[i][0], positions[i][1] - 0.1, positions[i][2]);
      scene.add(pl);
    }
  }

  // ─── Life Support Room ───────────────────────────────────────────────────────
  function buildLifeSupport() {
    var mat = new THREE.MeshLambertMaterial({ color: 0x336699 });
    var floor = new THREE.Mesh(new THREE.BoxGeometry(20, 0.1, 20), new THREE.MeshLambertMaterial({ color: 0x223344 }));
    floor.position.set(-40, 0.05, 0);
    scene.add(floor);

    // Big fans
    for (var f = 0; f < 3; f++) {
      var fanGeo = new THREE.CylinderGeometry(2, 2, 1, 12);
      var fanMesh = new THREE.Mesh(fanGeo, mat);
      fanMesh.position.set(-40 + (f - 1) * 5, 2, -5);
      scene.add(fanMesh);

      // Fan blades (Box primitives)
      var bladeMat = new THREE.MeshLambertMaterial({ color: 0x557799 });
      for (var b = 0; b < 4; b++) {
        var blade = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 2.2), bladeMat);
        blade.position.set(-40 + (f - 1) * 5, 2.55, -5);
        blade.rotation.y = b * Math.PI / 2;
        scene.add(blade);
      }
    }

    // Oxygen tanks
    var tankMat = new THREE.MeshLambertMaterial({ color: 0x88aacc });
    for (var t = 0; t < 4; t++) {
      var tank = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 3, 8), tankMat);
      tank.position.set(-46 + t * 2, 1.5, 5);
      scene.add(tank);
    }

    // Processor boxes
    var procMat = new THREE.MeshLambertMaterial({ color: 0x224455 });
    var proc1 = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 2), procMat);
    proc1.position.set(-36, 2, -6);
    scene.add(proc1);
    var proc2 = new THREE.Mesh(new THREE.BoxGeometry(2, 3.5, 2), procMat);
    proc2.position.set(-43, 1.75, 6);
    scene.add(proc2);

    // Life support terminal
    var termMat = new THREE.MeshLambertMaterial({ color: 0x00aa44, emissive: 0x00aa44, emissiveIntensity: 0.3 });
    lifeTerminal = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 0.3), termMat);
    lifeTerminal.position.set(-40, 1, -8);
    lifeTerminal.userData.isTerminal = true;
    scene.add(lifeTerminal);

    var termLight = new THREE.PointLight(0x00ff66, 0.8, 6);
    termLight.position.set(-40, 1.5, -8);
    scene.add(termLight);

    // Warning lights
    var warnMat = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 });
    for (var w = 0; w < 2; w++) {
      var warn = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), warnMat);
      warn.position.set(-40 + (w === 0 ? -8 : 8), 3.2, 0);
      scene.add(warn);
    }
  }

  // ─── Hydroponics Bay ─────────────────────────────────────────────────────────
  function buildHydroponics() {
    var floor = new THREE.Mesh(new THREE.BoxGeometry(24, 0.1, 24), new THREE.MeshLambertMaterial({ color: 0x223322 }));
    floor.position.set(0, 0.05, -45);
    scene.add(floor);

    var trayMat = new THREE.MeshLambertMaterial({ color: 0x446633 });
    var plantMat = new THREE.MeshLambertMaterial({ color: 0x44aa44 });

    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 3; col++) {
        var tray = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 1.2), trayMat);
        tray.position.set(-7.5 + col * 7.5, 0.9, -52 + row * 4);
        scene.add(tray);

        // Plant growth
        var plant = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.5 + Math.random() * 0.5, 1), plantMat);
        plant.position.set(-7.5 + col * 7.5, 1.35, -52 + row * 4);
        scene.add(plant);

        // Grow light
        var growLight = new THREE.PointLight(0xffdd88, 0.5, 6);
        growLight.position.set(-7.5 + col * 7.5, 3.5, -52 + row * 4);
        scene.add(growLight);

        var lightFix = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.1, 0.8), new THREE.MeshLambertMaterial({ color: 0xffffcc, emissive: 0xffffcc, emissiveIntensity: 0.6 }));
        lightFix.position.set(-7.5 + col * 7.5, 3.5, -52 + row * 4);
        scene.add(lightFix);
      }
    }

    // Support pillars
    var pillarMat = new THREE.MeshLambertMaterial({ color: 0x334433 });
    var pillarPos = [[-10, -38], [-10, -52], [10, -38], [10, -52]];
    for (var pp = 0; pp < pillarPos.length; pp++) {
      var pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 6), pillarMat);
      pillar.position.set(pillarPos[pp][0], 2, pillarPos[pp][1]);
      scene.add(pillar);
    }
  }

  // ─── Command Center ───────────────────────────────────────────────────────────
  function buildCommandCenter() {
    var floorMat = new THREE.MeshLambertMaterial({ color: 0x443322 });
    var floor = new THREE.Mesh(new THREE.BoxGeometry(28, 0.1, 28), floorMat);
    floor.position.set(40, 0.05, 0);
    scene.add(floor);

    // Semicircular console banks (approximated with Boxes)
    var consoleMat = new THREE.MeshLambertMaterial({ color: 0x332211 });
    var screenMat = new THREE.MeshLambertMaterial({ color: 0x0033ff, emissive: 0x0022aa, emissiveIntensity: 0.5 });

    for (var c = 0; c < 6; c++) {
      var ang = (c / 5) * Math.PI - Math.PI / 2;
      var cx = 40 + Math.cos(ang) * 9;
      var cz = Math.sin(ang) * 9;
      var cons = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.2, 1), consoleMat);
      cons.position.set(cx, 0.6, cz);
      cons.rotation.y = -ang;
      scene.add(cons);

      var screen = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 0.1), screenMat);
      screen.position.set(cx + Math.cos(ang) * 0.1, 1.3, cz + Math.sin(ang) * 0.1);
      screen.rotation.y = -ang;
      scene.add(screen);
    }

    // Holographic projectors (Cone primitives)
    var holoMat = new THREE.MeshLambertMaterial({ color: 0x00ffff, transparent: true, opacity: 0.4 });
    for (var h = 0; h < 3; h++) {
      var hcone = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3, 8), holoMat);
      hcone.position.set(40 + (h - 1) * 5, 3.5, -6);
      hcone.rotation.x = Math.PI;
      scene.add(hcone);
      var hl = new THREE.PointLight(0x00ffff, 0.3, 5);
      hl.position.set(40 + (h - 1) * 5, 2, -6);
      scene.add(hl);
    }

    // Central raised platform
    var platMat = new THREE.MeshLambertMaterial({ color: 0x553322 });
    var plat = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 0.3, 12), platMat);
    plat.position.set(40, 0.15, 0);
    scene.add(plat);

    // Boss terminal marker
    var bossTerm = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 0.4),
      new THREE.MeshLambertMaterial({ color: 0x882200, emissive: 0x440000, emissiveIntensity: 0.5 }));
    bossTerm.position.set(40, 1.5, -12);
    scene.add(bossTerm);
  }

  // ─── Airlocks ────────────────────────────────────────────────────────────────
  function buildAirlocks() {
    var outerMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var innerMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var redLight = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.8 });

    var alPositions = [
      { pos: [-18, 1.5, 0], rot: 0 },
      { pos: [18, 1.5, 0], rot: 0 },
      { pos: [0, 1.5, -18], rot: Math.PI / 2 }
    ];

    for (var a = 0; a < alPositions.length; a++) {
      var ap = alPositions[a];
      var outer = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 2), outerMat);
      outer.position.set(ap.pos[0], ap.pos[1], ap.pos[2]);
      outer.rotation.y = ap.rot;
      scene.add(outer);

      var inner = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.8, 1.8), innerMat);
      inner.position.set(ap.pos[0], ap.pos[1], ap.pos[2]);
      inner.rotation.y = ap.rot;
      scene.add(inner);

      // Red warning light
      var warn = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), redLight);
      warn.position.set(ap.pos[0], ap.pos[1] + 1.3, ap.pos[2] + 1.1);
      scene.add(warn);
      var rl = new THREE.PointLight(0xff0000, 0.5, 4);
      rl.position.set(ap.pos[0], ap.pos[1] + 1.3, ap.pos[2] + 1.1);
      scene.add(rl);
    }
  }

  // ─── Dust Particles ───────────────────────────────────────────────────────────
  function buildDustParticles() {
    var dustMat = new THREE.MeshLambertMaterial({ color: 0xcc7744, transparent: true, opacity: 0.3 });
    for (var d = 0; d < 80; d++) {
      var wisp = new THREE.Mesh(new THREE.SphereGeometry(0.2 + Math.random() * 0.3, 4, 4), dustMat.clone());
      wisp.position.set(
        (Math.random() - 0.5) * 160,
        0.5 + Math.random() * 4,
        (Math.random() - 0.5) * 160
      );
      wisp.userData.vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.5
      );
      wisp.userData.originalOpacity = 0.05 + Math.random() * 0.1;
      wisp.material.opacity = wisp.userData.originalOpacity;
      wisp.visible = false;
      scene.add(wisp);
      dustParticles.push(wisp);
    }
  }

  // ─── Doors ────────────────────────────────────────────────────────────────────
  function buildDoors() {
    var doorData = [
      { pos: [-18.5, 1.5, 0], rot: 0, zone: 'lifesupport' },
      { pos: [18.5, 1.5, 0], rot: 0, zone: 'command' },
      { pos: [0, 1.5, -19], rot: Math.PI / 2, zone: 'hydro' }
    ];

    var doorMat = new THREE.MeshLambertMaterial({ color: 0x556677 });
    var ctrlMat = new THREE.MeshLambertMaterial({ color: 0x00ff00, emissive: 0x006600, emissiveIntensity: 0.5 });

    for (var d = 0; d < doorData.length; d++) {
      var dd = doorData[d];
      var doorMesh = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.8, 0.2), doorMat.clone());
      doorMesh.position.set(dd.pos[0], dd.pos[1], dd.pos[2]);
      doorMesh.rotation.y = dd.rot;
      doorMesh.userData.zone = dd.zone;
      doorMesh.userData.sealed = false;
      doorMesh.userData.sealTimer = 0;
      doorMesh.visible = false;
      scene.add(doorMesh);
      doors.push(doorMesh);

      var ctrl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.2), ctrlMat.clone());
      ctrl.position.set(dd.pos[0] + 2.2, dd.pos[1], dd.pos[2]);
      ctrl.rotation.y = dd.rot;
      ctrl.userData.doorIndex = d;
      ctrl.userData.isDoorControl = true;
      scene.add(ctrl);
      doorControls.push(ctrl);
    }
  }

  // ─── Enemy Creation ───────────────────────────────────────────────────────────
  function createEnemyMesh(color, radius, height) {
    var group = new THREE.Object3D();

    var bodyGeo = new THREE.CylinderGeometry(radius * 0.5, radius * 0.5, height * 0.6, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = height * 0.3;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(radius * 0.5, 8, 8);
    var headMat = new THREE.MeshLambertMaterial({ color: color });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = height * 0.65;
    group.add(head);

    // Helmet visor
    var visorGeo = new THREE.BoxGeometry(radius * 0.7, radius * 0.3, radius * 0.2);
    var visorMat = new THREE.MeshLambertMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 });
    var visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, height * 0.65, radius * 0.4);
    group.add(visor);

    // Legs
    var legMat = new THREE.MeshLambertMaterial({ color: color });
    for (var side = -1; side <= 1; side += 2) {
      var leg = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.2, radius * 0.2, height * 0.35, 6), legMat);
      leg.position.set(side * radius * 0.3, height * 0.17, 0);
      group.add(leg);
    }

    // Arms
    var armMat = new THREE.MeshLambertMaterial({ color: color });
    for (var armSide = -1; armSide <= 1; armSide += 2) {
      var arm = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.15, radius * 0.15, height * 0.4, 6), armMat);
      arm.position.set(armSide * radius * 0.7, height * 0.35, 0);
      arm.rotation.z = armSide * 0.4;
      group.add(arm);
    }

    return group;
  }

  function spawnEnemies() {
    // Rebel colonists (12)
    var colonistSpawns = [
      [5, 0, 5], [-5, 0, 8], [8, 0, -3], [-8, 0, -5],
      [-35, 0, 5], [-38, 0, -3], [-42, 0, 4], [-33, 0, -6],
      [5, 0, -38], [-4, 0, -42], [3, 0, -48], [-6, 0, -50]
    ];

    for (var ci = 0; ci < 12; ci++) {
      var sp = colonistSpawns[ci] || [Math.random() * 20 - 10, 0, Math.random() * 20 - 10];
      var mesh = createEnemyMesh(0x665544, 0.5, 1.8);
      mesh.position.set(sp[0], 0, sp[2]);
      scene.add(mesh);

      var patrol = [];
      for (var pi = 0; pi < 3; pi++) {
        patrol.push(new THREE.Vector3(sp[0] + (Math.random() - 0.5) * 10, 0, sp[2] + (Math.random() - 0.5) * 10));
      }

      enemies.push({
        mesh: mesh,
        hp: 75,
        maxHp: 75,
        type: 'colonist',
        state: 'patrol',
        patrol: patrol,
        patrolIdx: 0,
        alertTimer: 0,
        attackCooldown: 0,
        speed: 3.5,
        damage: 8,
        attackRange: 15,
        attackDist: 2.5,
        active: true
      });
    }

    // Rebel guards (5)
    var guardSpawns = [
      [35, 0, 8], [38, 0, -5], [45, 0, 5], [42, 0, -8], [30, 0, 3]
    ];
    for (var gi = 0; gi < 5; gi++) {
      var gsp = guardSpawns[gi];
      var gmesh = createEnemyMesh(0x554433, 0.55, 1.9);
      gmesh.position.set(gsp[0], 0, gsp[2]);
      scene.add(gmesh);

      var gpatrol = [];
      for (var gpi = 0; gpi < 3; gpi++) {
        gpatrol.push(new THREE.Vector3(gsp[0] + (Math.random() - 0.5) * 8, 0, gsp[2] + (Math.random() - 0.5) * 8));
      }

      enemies.push({
        mesh: gmesh,
        hp: 95,
        maxHp: 95,
        type: 'guard',
        state: 'patrol',
        patrol: gpatrol,
        patrolIdx: 0,
        alertTimer: 0,
        attackCooldown: 0,
        speed: 4.5,
        damage: 15,
        attackRange: 20,
        attackDist: 3,
        active: true
      });
    }

    // Boss Kessler
    kesslerMesh = createEnemyMesh(0x443322, 0.7, 2.0);
    kesslerMesh.position.set(40, 0, 0);

    // Boss indicator (glowing crown)
    var crownMat = new THREE.MeshLambertMaterial({ color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 1 });
    var crown = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 6), crownMat);
    crown.position.y = 2.3;
    kesslerMesh.add(crown);

    scene.add(kesslerMesh);

    kessler = {
      mesh: kesslerMesh,
      hp: 500,
      maxHp: 500,
      type: 'boss',
      state: 'patrol',
      patrol: [
        new THREE.Vector3(40, 0, 5),
        new THREE.Vector3(45, 0, 0),
        new THREE.Vector3(40, 0, -5),
        new THREE.Vector3(35, 0, 0)
      ],
      patrolIdx: 0,
      alertTimer: 0,
      attackCooldown: 0,
      speed: 5,
      damage: 25,
      attackRange: 25,
      attackDist: 4,
      active: true,
      sabotaged: false,
      decoysSpawned: false
    };
    enemies.push(kessler);
  }

  // ─── Decoys ───────────────────────────────────────────────────────────────────
  function spawnDecoys() {
    decoyActive = true;
    var decoyMat = new THREE.MeshLambertMaterial({ color: 0x00ccff, transparent: true, opacity: 0.7 });

    var decoyPositions = [
      [38, 0, 8], [42, 0, -8], [35, 0, -5]
    ];

    for (var di = 0; di < 3; di++) {
      var dmesh = createEnemyMesh(0x00ccff, 0.7, 2.0);
      dmesh.position.set(decoyPositions[di][0], decoyPositions[di][1], decoyPositions[di][2]);
      // Tint decoy mesh materials
      dmesh.traverse(function (child) {
        if (child.isMesh) {
          child.material = new THREE.MeshLambertMaterial({ color: 0x00ccff, transparent: true, opacity: 0.6 });
        }
      });
      scene.add(dmesh);
      decoys.push(dmesh);
    }
  }

  function removeDecoys() {
    for (var di = 0; di < decoys.length; di++) {
      scene.remove(decoys[di]);
    }
    decoys = [];
    decoyActive = false;
  }

  // ─── Civilians ────────────────────────────────────────────────────────────────
  function spawnCivilians() {
    var civPositions = [
      [-38, 0, 8],
      [3, 0, -48],
      [7, 0, 3]
    ];
    var civMat0 = new THREE.MeshLambertMaterial({ color: 0xffcc88 });
    var civBodyMat = new THREE.MeshLambertMaterial({ color: 0x886644 });

    for (var ci = 0; ci < 3; ci++) {
      var group = new THREE.Object3D();
      var body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1, 8), civBodyMat);
      body.position.y = 0.5;
      group.add(body);
      var head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), civMat0);
      head.position.y = 1.3;
      group.add(head);

      // Cowering pose (arm over head)
      var arm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.7, 0.15), civBodyMat);
      arm.position.set(0.35, 1.0, 0);
      arm.rotation.z = -0.8;
      group.add(arm);

      group.position.set(civPositions[ci][0], 0, civPositions[ci][1]);
      scene.add(group);

      civilians.push({
        mesh: group,
        shot: false,
        pos: new THREE.Vector3(civPositions[ci][0], 0, civPositions[ci][1])
      });
    }
  }

  // ─── Input Handling ───────────────────────────────────────────────────────────
  function setupInput() {
    document.addEventListener('keydown', function (e) {
      keys[e.code] = true;

      if (e.code === 'KeyE' && gameActive) {
        tryFixLifeSupport();
      }
    });
    document.addEventListener('keyup', function (e) {
      keys[e.code] = false;
      if (e.code === 'KeyE') {
        fixingLifeSupport = false;
      }
    });

    document.addEventListener('mousemove', function (e) {
      if (isPointerLocked) {
        mouseDX += e.movementX || 0;
        mouseDY += e.movementY || 0;
      }
    });

    document.addEventListener('click', function (e) {
      if (!gameActive || gameOver) return;
      if (!isPointerLocked) {
        renderer.domElement.requestPointerLock();
        return;
      }
      shoot();
    });

    document.addEventListener('pointerlockchange', function () {
      isPointerLocked = document.pointerLockElement === renderer.domElement;
    });

    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // ─── Life Support Repair ──────────────────────────────────────────────────────
  function tryFixLifeSupport() {
    if (!lifeSupportSabotaged || lifeSupportFixed) return;
    if (!lifeTerminal) return;

    var dist = camera.position.distanceTo(lifeTerminal.position);
    if (dist > 4) {
      if (terminalPrompt) {
        terminalPrompt.style.display = 'block';
        terminalPrompt.textContent = 'Move closer to the terminal (E to fix)';
      }
      return;
    }

    fixingLifeSupport = true;
    if (terminalPrompt) {
      terminalPrompt.style.display = 'block';
      terminalPrompt.textContent = 'Fixing life support... ' + Math.round(fixProgress * 100) + '%';
    }
  }

  // ─── Shooting ─────────────────────────────────────────────────────────────────
  function shoot() {
    if (shootCooldown > 0 || !gameActive || gameOver) return;
    shootCooldown = shootRate;

    // Muzzle flash effect
    spawnBulletTracer();

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    // Build list of shootable objects
    var shootTargets = [];
    for (var ei = 0; ei < enemies.length; ei++) {
      if (!enemies[ei].active) continue;
      enemies[ei].mesh.traverse(function (child) {
        if (child.isMesh) {
          child.userData.enemyIndex = enemies.indexOf(enemies[ei]);
          shootTargets.push(child);
        }
      });
    }

    // Check decoys
    for (var di = 0; di < decoys.length; di++) {
      decoys[di].traverse(function (child) {
        if (child.isMesh) {
          child.userData.isDecoy = true;
          shootTargets.push(child);
        }
      });
    }

    // Check civilians
    for (var ci = 0; ci < civilians.length; ci++) {
      if (civilians[ci].shot) continue;
      civilians[ci].mesh.traverse(function (child) {
        if (child.isMesh) {
          child.userData.civilianIndex = ci;
          shootTargets.push(child);
        }
      });
    }

    // Check door controls
    for (var dc = 0; dc < doorControls.length; dc++) {
      doorControls[dc].userData.isDoorControl = true;
      shootTargets.push(doorControls[dc]);
    }

    var intersects = raycaster.intersectObjects(shootTargets, false);

    if (intersects.length > 0) {
      var hit = intersects[0];
      var obj = hit.object;

      if (obj.userData.isDoorControl !== undefined && obj.userData.isDoorControl) {
        sealDoor(obj.userData.doorIndex);
        return;
      }

      if (obj.userData.isDecoy) {
        // Shooting a decoy — real Kessler is elsewhere, decoys vanish
        removeDecoys();
        return;
      }

      if (obj.userData.civilianIndex !== undefined) {
        var civIdx = obj.userData.civilianIndex;
        if (!civilians[civIdx].shot) {
          civilians[civIdx].shot = true;
          civiliansShot++;
          civiliansSafe = (civiliansShot === 0);
          // Flash the civilian red
          civilians[civIdx].mesh.traverse(function (c) {
            if (c.isMesh) c.material.color.setHex(0xff0000);
          });
        }
        return;
      }

      if (obj.userData.enemyIndex !== undefined) {
        var eidx = obj.userData.enemyIndex;
        var enemy = enemies[eidx];
        if (!enemy || !enemy.active) return;

        var dmg = 25;
        // Headshot bonus if hit upper part
        if (hit.point.y > enemy.mesh.position.y + 1.5) dmg = 50;

        enemy.hp -= dmg;
        enemy.state = 'chase';

        // Flash red
        enemy.mesh.traverse(function (c) {
          if (c.isMesh) {
            c.userData.origColor = c.userData.origColor || c.material.color.getHex();
            c.material.color.setHex(0xff0000);
          }
        });
        setTimeout(function () {
          enemy.mesh.traverse(function (c) {
            if (c.isMesh && c.userData.origColor) {
              c.material.color.setHex(c.userData.origColor);
            }
          });
        }, 100);

        if (enemy.hp <= 0) killEnemy(eidx);
      }
    }
  }

  function killEnemy(idx) {
    var enemy = enemies[idx];
    if (!enemy || !enemy.active) return;
    enemy.active = false;
    enemy.mesh.visible = false;

    if (enemy.type === 'boss') {
      // Boss defeated
      checkWinCondition();
    }
  }

  function sealDoor(doorIndex) {
    var door = doors[doorIndex];
    if (!door) return;
    door.userData.sealed = true;
    door.userData.sealTimer = 10;
    door.visible = true;
    door.material.color.setHex(0xff2200);

    // Trap enemies near this zone
    var zone = door.userData.zone;
    for (var ei = 0; ei < enemies.length; ei++) {
      var e = enemies[ei];
      if (!e.active) continue;
      if (isEnemyInZone(e, zone)) {
        e.state = 'trapped';
        e.alertTimer = 10;
      }
    }
  }

  function isEnemyInZone(enemy, zone) {
    var pos = enemy.mesh.position;
    if (zone === 'lifesupport') return pos.x < -25;
    if (zone === 'command') return pos.x > 25;
    if (zone === 'hydro') return pos.z < -25;
    return false;
  }

  function spawnBulletTracer() {
    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    var geo = new THREE.BoxGeometry(0.04, 0.04, 0.6);
    var mat = new THREE.MeshLambertMaterial({ color: 0xffee44, emissive: 0xffee44, emissiveIntensity: 1 });
    var tracer = new THREE.Mesh(geo, mat);
    tracer.position.copy(camera.position).addScaledVector(dir, 1.5);
    tracer.lookAt(camera.position.clone().addScaledVector(dir, 10));
    tracer.userData.life = 0.08;
    tracer.userData.vel = dir.clone().multiplyScalar(40);
    scene.add(tracer);
    bullets.push(tracer);
  }

  // ─── Player Movement ─────────────────────────────────────────────────────────
  function updatePlayer(dt) {
    if (!gameActive || gameOver) return;

    // Mouse look
    var sensitivity = 0.002;
    yaw -= mouseDX * sensitivity;
    pitch -= mouseDY * sensitivity;
    pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
    mouseDX = 0;
    mouseDY = 0;

    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    // Movement
    var dir = new THREE.Vector3();
    var forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    var right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

    if (keys['KeyW']) dir.addScaledVector(forward, 1);
    if (keys['KeyS']) dir.addScaledVector(forward, -1);
    if (keys['KeyA']) dir.addScaledVector(right, -1);
    if (keys['KeyD']) dir.addScaledVector(right, 1);

    if (dir.lengthSq() > 0) {
      dir.normalize();
      camera.position.addScaledVector(dir, playerSpeed * dt);
    }

    // Clamp to map
    camera.position.x = Math.max(-95, Math.min(95, camera.position.x));
    camera.position.z = Math.max(-95, Math.min(95, camera.position.z));
    camera.position.y = playerHeight;

    // Shoot cooldown
    if (shootCooldown > 0) shootCooldown -= dt;

    // Life support fixing
    if (fixingLifeSupport && lifeSupportSabotaged && !lifeSupportFixed && keys['KeyE']) {
      var distToTerm = lifeTerminal ? camera.position.distanceTo(lifeTerminal.position) : 999;
      if (distToTerm < 4) {
        fixProgress += dt / 5;
        if (terminalPrompt) {
          terminalPrompt.style.display = 'block';
          terminalPrompt.textContent = 'Fixing: ' + Math.round(fixProgress * 100) + '%';
        }
        if (fixProgress >= 1) {
          lifeSupportFixed = true;
          lifeSupportSabotaged = false;
          fixingLifeSupport = false;
          fixProgress = 1;
          if (terminalPrompt) {
            terminalPrompt.textContent = 'Life Support RESTORED!';
            setTimeout(function () { terminalPrompt.style.display = 'none'; }, 3000);
          }
        }
      } else {
        fixingLifeSupport = false;
        if (terminalPrompt) terminalPrompt.style.display = 'none';
      }
    } else if (!keys['KeyE']) {
      fixingLifeSupport = false;
      if (terminalPrompt && !lifeSupportFixed) terminalPrompt.style.display = 'none';
    }

    // Check if near terminal
    if (lifeSupportSabotaged && !lifeSupportFixed && lifeTerminal) {
      var tdist = camera.position.distanceTo(lifeTerminal.position);
      if (tdist < 4 && !keys['KeyE']) {
        if (terminalPrompt) {
          terminalPrompt.style.display = 'block';
          terminalPrompt.textContent = 'Press E to fix life support (hold 5s)';
        }
      }
    }

    // Oxygen damage
    if (oxygenLevel < 30 && lifeSupportSabotaged) {
      playerHP -= 5 * dt;
    }

    // Oxygen drain
    if (lifeSupportSabotaged && !lifeSupportFixed) {
      oxygenLevel -= 2 * dt;
      oxygenLevel = Math.max(0, oxygenLevel);
    } else if (!lifeSupportSabotaged && oxygenLevel < 100) {
      oxygenLevel = Math.min(100, oxygenLevel + 1 * dt);
    }

    if (playerHP <= 0) {
      playerHP = 0;
      endGame(false, 'You have died. Mars retake failed.');
    }
    if (oxygenLevel <= 0) {
      endGame(false, 'Oxygen depleted. Colony lost.');
    }
  }

  // ─── Enemy AI ─────────────────────────────────────────────────────────────────
  function updateEnemies(dt) {
    if (!gameActive || gameOver) return;

    var playerPos = camera.position.clone();

    for (var ei = 0; ei < enemies.length; ei++) {
      var e = enemies[ei];
      if (!e.active) continue;

      var ePos = e.mesh.position;
      var distToPlayer = ePos.distanceTo(playerPos);

      // State machine
      if (e.state === 'trapped') {
        e.alertTimer -= dt;
        if (e.alertTimer <= 0) e.state = 'patrol';
        continue;
      }

      if (e.state === 'patrol') {
        if (distToPlayer < e.attackRange) {
          e.state = 'chase';
          e.alertTimer = 5;
        } else {
          // Move toward patrol point
          var pt = e.patrol[e.patrolIdx];
          var toDest = new THREE.Vector3().subVectors(pt, ePos);
          toDest.y = 0;
          if (toDest.length() < 0.5) {
            e.patrolIdx = (e.patrolIdx + 1) % e.patrol.length;
          } else {
            toDest.normalize();
            ePos.addScaledVector(toDest, e.speed * 0.5 * dt);
            e.mesh.rotation.y = Math.atan2(toDest.x, toDest.z);
          }
        }
      } else if (e.state === 'chase') {
        if (distToPlayer > e.attackRange * 1.5) {
          e.alertTimer -= dt;
          if (e.alertTimer <= 0) e.state = 'patrol';
        } else {
          var toPlayer = new THREE.Vector3().subVectors(playerPos, ePos);
          toPlayer.y = 0;
          var dist2d = toPlayer.length();

          if (dist2d > e.attackDist) {
            toPlayer.normalize();
            ePos.addScaledVector(toPlayer, e.speed * dt);
            e.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
          } else {
            e.state = 'attack';
          }
        }
      } else if (e.state === 'attack') {
        var toPl = new THREE.Vector3().subVectors(playerPos, ePos);
        toPl.y = 0;
        var d2pl = toPl.length();

        e.mesh.rotation.y = Math.atan2(toPl.x, toPl.z);
        e.attackCooldown -= dt;

        if (d2pl > e.attackDist * 1.5) {
          e.state = 'chase';
        } else if (e.attackCooldown <= 0) {
          // Attack player
          playerHP -= e.damage;
          e.attackCooldown = e.type === 'boss' ? 1.5 : 2.0;
        }
      }

      // Boss special behavior
      if (e.type === 'boss' && e.active) {
        var hpPercent = e.hp / e.maxHp;

        if (hpPercent <= 0.5 && !e.sabotaged) {
          e.sabotaged = true;
          lifeSupportSabotaged = true;
          lifeSupportFixed = false;
          // Visual effect on terminal
          if (lifeTerminal) {
            lifeTerminal.material.color.setHex(0xff0000);
            lifeTerminal.material.emissive.setHex(0xff0000);
          }
        }

        if (hpPercent <= 0.5 && !e.decoysSpawned) {
          e.decoysSpawned = true;
          spawnDecoys();
        }
      }
    }
  }

  // ─── Storm System ─────────────────────────────────────────────────────────────
  function updateStorm(dt) {
    stormTimer += dt;

    if (!stormActive) {
      if (stormTimer >= stormCooldown) {
        stormActive = true;
        stormTimer = 0;
        scene.fog.far = fogStorm;
        // Make dust visible
        for (var d = 0; d < dustParticles.length; d++) {
          dustParticles[d].visible = true;
          dustParticles[d].material.opacity = 0.3 + Math.random() * 0.3;
        }
      }
    } else {
      // Animate dust
      for (var dp = 0; dp < dustParticles.length; dp++) {
        var p = dustParticles[dp];
        p.position.addScaledVector(p.userData.vel, dt);
        if (p.position.x > 90) p.position.x = -90;
        if (p.position.x < -90) p.position.x = 90;
        if (p.position.z > 90) p.position.z = -90;
        if (p.position.z < -90) p.position.z = 90;
      }

      if (stormTimer >= stormDuration) {
        stormActive = false;
        stormTimer = 0;
        scene.fog.far = fogDefault;
        for (var dp2 = 0; dp2 < dustParticles.length; dp2++) {
          dustParticles[dp2].visible = false;
        }
      }
    }
  }

  // ─── Bullets ──────────────────────────────────────────────────────────────────
  function updateBullets(dt) {
    for (var bi = bullets.length - 1; bi >= 0; bi--) {
      var b = bullets[bi];
      b.userData.life -= dt;
      b.position.addScaledVector(b.userData.vel, dt);
      if (b.userData.life <= 0) {
        scene.remove(b);
        bullets.splice(bi, 1);
      }
    }
  }

  // ─── Doors ───────────────────────────────────────────────────────────────────
  function updateDoors(dt) {
    for (var di = 0; di < doors.length; di++) {
      var door = doors[di];
      if (door.userData.sealed) {
        door.userData.sealTimer -= dt;
        if (door.userData.sealTimer <= 0) {
          door.userData.sealed = false;
          door.visible = false;
          // Free enemies
          for (var ei = 0; ei < enemies.length; ei++) {
            if (enemies[ei].state === 'trapped') enemies[ei].state = 'patrol';
          }
        }
      }
    }
  }

  // ─── Win/Lose ─────────────────────────────────────────────────────────────────
  function checkWinCondition() {
    var kesslerDead = !kessler || !kessler.active;
    if (!kesslerDead) return;

    var oxyOk = oxygenLevel > 20;
    var lifeOk = !lifeSupportSabotaged || lifeSupportFixed;
    var civOk = civiliansShot === 0;

    if (kesslerDead && oxyOk && lifeOk && civOk) {
      endGame(true, 'MISSION COMPLETE!<br>Life support restored. Director Kessler eliminated.<br>All civilians safe. Mars colony reclaimed!');
    } else if (kesslerDead) {
      var msg = 'Kessler defeated, but...';
      if (!oxyOk) msg += '<br>Oxygen too low!';
      if (!lifeOk) msg += '<br>Life support still sabotaged!';
      if (!civOk) msg += '<br>Civilians killed: ' + civiliansShot;
      endGame(false, msg);
    }
  }

  function endGame(won, msg) {
    gameOver = true;
    gameWon = won;
    if (isPointerLocked) document.exitPointerLock();

    var color = won ? '#00ff88' : '#ff2200';
    var restartNote = '<br><br><span style="font-size:16px;color:#aaaaaa">Press S then C to restart</span>';
    showOverlay('<span style="color:' + color + '">' + msg + restartNote + '</span>');
  }

  // ─── Main Loop ────────────────────────────────────────────────────────────────
  var animFrameId = null;

  function gameLoop() {
    animFrameId = requestAnimationFrame(gameLoop);
    var dt = Math.min(clock.getDelta(), 0.05);

    if (gameActive && !gameOver) {
      updatePlayer(dt);
      updateEnemies(dt);
      updateStorm(dt);
      updateBullets(dt);
      updateDoors(dt);
      updateHUD(dt);
    }

    renderer.render(scene, camera);
  }

  // ─── Start / Reset ────────────────────────────────────────────────────────────
  function startGame() {
    if (gameActive && !gameOver) return;
    reset();
    gameActive = true;
    gameOver = false;
    gameWon = false;
    hideOverlay();
    renderer.domElement.requestPointerLock();
  }

  function init() {
    createHUD();
    createScene();
    setupInput();
    setupActivationListener();
    clock.start();
    gameLoop();
  }

  function reset() {
    // Clean up scene if needed
    if (scene) {
      // Remove enemies, bullets, decoys, civilians
      for (var ei = 0; ei < enemies.length; ei++) {
        if (enemies[ei].mesh) scene.remove(enemies[ei].mesh);
      }
      for (var di = 0; di < decoys.length; di++) scene.remove(decoys[di]);
      for (var bi = 0; bi < bullets.length; bi++) scene.remove(bullets[bi]);
      for (var ci = 0; ci < civilians.length; ci++) if (civilians[ci].mesh) scene.remove(civilians[ci].mesh);
      for (var dri = 0; dri < doors.length; dri++) scene.remove(doors[dri]);
      for (var dci = 0; dci < doorControls.length; dci++) scene.remove(doorControls[dci]);
      for (var dpi = 0; dpi < dustParticles.length; dpi++) scene.remove(dustParticles[dpi]);
    }

    // Reset state
    enemies = [];
    decoys = [];
    bullets = [];
    civilians = [];
    doors = [];
    doorControls = [];
    dustParticles = [];
    kessler = null;
    kesslerMesh = null;

    playerHP = 100;
    oxygenLevel = 100;
    lifeSupportSabotaged = false;
    lifeSupportFixed = false;
    fixingLifeSupport = false;
    fixProgress = 0;
    civiliansSafe = true;
    civiliansShot = 0;
    decoyActive = false;
    stormActive = false;
    stormTimer = 0;
    shootCooldown = 0;
    yaw = 0;
    pitch = 0;
    mouseDX = 0;
    mouseDY = 0;
    keys = {};
    kesslerActivated = false;

    if (camera) {
      camera.position.set(0, playerHeight, 0);
      camera.rotation.set(0, 0, 0);
    }

    if (scene) {
      scene.fog.far = fogDefault;
      buildDustParticles();
      buildDoors();
      buildDoorControls();
      spawnEnemies();
      spawnCivilians();
    }

    if (terminalPrompt) terminalPrompt.style.display = 'none';
  }

  function buildDoorControls() {
    // Called on reset, re-adds door controls since we removed them
    // Door meshes created in buildDoors, door controls added here
    var ctrlMat = new THREE.MeshLambertMaterial({ color: 0x00ff00, emissive: 0x006600, emissiveIntensity: 0.5 });
    var doorData = [
      { pos: [-18.5, 1.5, 0] },
      { pos: [18.5, 1.5, 0] },
      { pos: [0, 1.5, -19] }
    ];
    for (var d = 0; d < doorData.length; d++) {
      var dd = doorData[d];
      var ctrl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.2), ctrlMat.clone());
      ctrl.position.set(dd.pos[0] + 2.2, dd.pos[1], dd.pos[2]);
      ctrl.userData.doorIndex = d;
      ctrl.userData.isDoorControl = true;
      scene.add(ctrl);
      doorControls.push(ctrl);
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────────
  function update(dt) {
    // External update hook (if needed)
    if (gameActive && !gameOver && dt) {
      updatePlayer(dt);
      updateEnemies(dt);
      updateStorm(dt);
      updateBullets(dt);
      updateDoors(dt);
      updateHUD(dt);
      renderer.render(scene, camera);
    }
  }

  // Do NOT hijack the main game on load. This Mars easter-egg stays dormant and
  // invisible until the player presses S then C (within 400ms); only then does it
  // build its scene/HUD and start. (Previously it auto-init'd on every page load,
  // covering the real OccupantKiller start screen.)
  var _egBuilt = false;
  function _armEasterEgg() {
    var _sT = 0, _waitC = false;
    document.addEventListener('keydown', function (e) {
      if (_egBuilt) return;
      if (e.key === 's' || e.key === 'S') { _sT = Date.now(); _waitC = true; }
      else if ((e.key === 'c' || e.key === 'C') && _waitC && (Date.now() - _sT) <= 400) {
        _waitC = false; _egBuilt = true; init(); startGame();
      } else { _waitC = false; }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _armEasterEgg);
  } else {
    _armEasterEgg();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
