/* ───────────────────────────────────────────────────────────────────────────
   wetlands-ambush.js — Wetlands Ambush FPS Module
   API: window.WetlandsAmbush = { init, update, reset }
   Controls:
     W + A (within 400ms)  → activate mission
     WASD                  → move player (25% slower in water)
     Mouse                 → look around
     E (near cage)         → shoot cage lock / escort agent
     Mouse-click / Space   → fire weapon
   ─────────────────────────────────────────────────────────────────────────── */
window.WetlandsAmbush = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Mission state ─────────────────────────────────────────────────────── */
  var _active        = false;
  var _missionDone   = false;
  var _missionFailed = false;

  /* ── W+A sequential launch tracking ───────────────────────────────────── */
  var _wPressTime = 0;
  var _aPressTime = 0;
  var WA_WINDOW   = 0.4;

  /* ── Player state ──────────────────────────────────────────────────────── */
  var _playerPos          = null;
  var _playerHP           = 100;
  var _playerYaw          = 0;
  var _playerPitch        = 0;
  var _mouseDX            = 0;
  var _mouseDY            = 0;
  var _mousePointerLocked = false;
  var _inWater            = false;   /* 25% speed penalty */
  var _waterSoundTimer    = 0;

  /* ── Keys ──────────────────────────────────────────────────────────────── */
  var _keys = {};

  /* ── Scene backup (fog / background) ──────────────────────────────────── */
  var _fogBackup      = null;
  var _bgColorBackup  = null;

  /* ── Owned meshes (cleanup) ────────────────────────────────────────────── */
  var _ownMeshes = [];

  /* ── World geometry refs ───────────────────────────────────────────────── */
  var _waterPlane      = null;
  var _groundMesh      = null;
  var _trees           = [];
  var _campTents       = [];
  var _campFires       = [];
  var _supplyCrates    = [];
  var _watchtowerMesh  = null;
  var _searchlight     = null;
  var _searchAngle     = 0;
  var _cageMesh        = null;
  var _cageLockMesh    = null;
  var _cageLockShot    = false;
  var _boatMesh        = null;
  var _boatMotor       = null;
  var _boatMotorHP     = 3;
  var _boatStopped     = false;
  var _boatAngle       = 0;     /* figure-8 parameter */
  var _boatSpeed       = 2.5;
  var _tunnelMarkers   = [];
  var _extractionZone  = null;

  /* ── Agent (rescued prisoner) state ───────────────────────────────────── */
  var _agentHP          = 100;
  var _agentRescued     = false;   /* lock shot */
  var _agentEscorting   = false;   /* player took agent with them */
  var _agentMesh        = null;
  var _agentPos         = null;
  var _agentExtracted   = false;

  /* ── Enemies ───────────────────────────────────────────────────────────── */
  /*
     14 guerrillas:  color 0x446633, 70 HP — camouflage, hide in foliage
      5 elite:       color 0x334422, 95 HP — tactical retreat, summon tunnel flankers
      1 boss Mantis: color 0x223311, 490 HP — boat platform, sniper + grenade launcher
  */
  var _guerrillas      = [];   /* { mesh, hp, pos, alive, inFoliage, foliageTimer, alertTimer, shootTimer } */
  var _elites          = [];   /* { mesh, hp, pos, alive, retreating, tunnelTimer, called, shootTimer } */
  var _mantis          = null; /* { mesh, hp, alive, sniperTimer, grenadeTimer, pos } */
  var _mantisDefeated  = false;
  var _grenades        = [];   /* active grenade projectiles { mesh, pos, vel, timer } */
  var _flankers        = [];   /* tunnel flankers spawned behind player { mesh, hp, pos, alive, shootTimer } */

  /* ── Shooting ──────────────────────────────────────────────────────────── */
  var _shootCooldown  = 0;
  var SHOOT_INTERVAL  = 0.35;
  var SHOOT_DMG_GUER  = 22;
  var SHOOT_DMG_ELITE = 18;
  var SHOOT_DMG_BOSS  = 14;
  var SHOOT_DMG_MOTOR = 1;    /* each hit = 1 motor HP */

  /* ── Flash message ─────────────────────────────────────────────────────── */
  var _flashText  = '';
  var _flashTimer = 0;

  /* ── HUD ref ───────────────────────────────────────────────────────────── */
  var _hud = null;

  /* ═══════════════════════════════════════════════════════════════════════
     MATH HELPERS
  ═══════════════════════════════════════════════════════════════════════ */

  function _dist2(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  function _addMesh(mesh) {
    _scene.add(mesh);
    _ownMeshes.push(mesh);
    return mesh;
  }

  function _makeMat(color, opts) {
    var p = { color: color };
    if (opts) {
      if (opts.transparent !== undefined) p.transparent = opts.transparent;
      if (opts.opacity     !== undefined) p.opacity     = opts.opacity;
      if (opts.wireframe   !== undefined) p.wireframe   = opts.wireframe;
    }
    return new THREE.MeshLambertMaterial(p);
  }

  function _makeMesh(geo, mat) {
    return new THREE.Mesh(geo, mat);
  }

  /* check if pos is over water zone */
  function _isInWater(pos) {
    /* main water area: flat X region with shallow water */
    return (pos.x > -48 && pos.x < 48 && pos.z > -40 && pos.z < 40 &&
            (
              (pos.x > -48 && pos.x < -10) ||   /* west water channel */
              (pos.x > 10  && pos.x < 48)  ||   /* east water channel */
              (pos.z > 15  && pos.z < 40)  ||   /* north wetland */
              (pos.z > -40 && pos.z < -10)       /* south approach */
            ));
  }

  /* ═══════════════════════════════════════════════════════════════════════
     WORLD BUILDING
  ═══════════════════════════════════════════════════════════════════════ */

  function _buildWorld() {
    /* save & override fog */
    _fogBackup     = _scene.fog;
    _bgColorBackup = _scene.background ? _scene.background.getHex() : null;
    _scene.fog        = new THREE.FogExp2(0x3A5C2A, 0.025);
    _scene.background = new THREE.Color(0x3A5C2A);

    /* ambient + directional */
    var amb = new THREE.AmbientLight(0x445533, 0.7);
    _addMesh(amb);
    var dir = new THREE.DirectionalLight(0x88AA55, 0.55);
    dir.position.set(8, 20, 10);
    _addMesh(dir);

    /* shallow water — flat blue BoxGeometry covers most area */
    var wGeo = new THREE.BoxGeometry(100, 0.18, 100);
    var wMat = _makeMat(0x204060, { transparent: true, opacity: 0.72 });
    _waterPlane = _makeMesh(wGeo, wMat);
    _waterPlane.position.set(0, -0.09, 0);
    _addMesh(_waterPlane);

    /* raised ground islands (dry ground patches) */
    var islands = [
      { x:  0,  z:  0,  w: 20, d: 20 },   /* camp island */
      { x: -35, z:  0,  w: 12, d: 25 },   /* west patrol strip */
      { x:  35, z:  0,  w: 12, d: 25 },   /* east patrol strip */
      { x:  0,  z: -42, w: 18, d: 14 },   /* south approach */
      { x:  0,  z:  42, w: 22, d: 14 },   /* north extraction zone */
    ];
    var i, ig, im;
    for (i = 0; i < islands.length; i++) {
      ig = new THREE.BoxGeometry(islands[i].w, 0.3, islands[i].d);
      im = _makeMesh(ig, _makeMat(0x3D5222));
      im.position.set(islands[i].x, 0.0, islands[i].z);
      _addMesh(im);
    }

    /* perimeter ground (swamp mud fringe) */
    var pgGeo = new THREE.BoxGeometry(110, 0.2, 110);
    _groundMesh = _makeMesh(pgGeo, _makeMat(0x2B3D18));
    _groundMesh.position.set(0, -0.3, 0);
    _addMesh(_groundMesh);

    /* build sub-systems */
    _buildTrees();
    _buildGuerillaCamp();
    _buildWatchtower();
    _buildPrisonerCage();
    _buildSupplyBoat();
    _buildTunnelMarkers();
    _buildExtractionZone();
  }

  /* ── Mangrove trees ─────────────────────────────────────────────────── */
  function _buildTrees() {
    var i, tx, tz, th, tGeo, tMat, trunk, cGeo, cMat, canopy, cluCount, j, cx, cz;
    var positions = [
      /* west cluster */
      { x: -28, z: -15 }, { x: -32, z:  5  }, { x: -25, z:  18 }, { x: -38, z: -8  },
      { x: -22, z: -25 }, { x: -30, z:  25 }, { x: -40, z:  12 },
      /* east cluster */
      { x:  28, z: -15 }, { x:  32, z:  5  }, { x:  25, z:  18 }, { x:  38, z: -8  },
      { x:  22, z: -25 }, { x:  30, z:  25 }, { x:  40, z:  12 },
      /* north */
      { x: -8,  z:  38 }, { x:  8,  z:  38 }, { x: -15, z:  45 }, { x: 15,  z:  45 },
      /* south approach */
      { x: -6,  z: -38 }, { x:  6,  z: -38 }, { x: -12, z: -45 }, { x: 12,  z: -45 },
      /* center scatter */
      { x: -9,  z:  8  }, { x:  9,  z: -8  }, { x: -14, z: -5  }, { x: 14,  z:  5  },
    ];

    for (i = 0; i < positions.length; i++) {
      tx = positions[i].x + (Math.random() - 0.5) * 2;
      tz = positions[i].z + (Math.random() - 0.5) * 2;
      th = 5 + Math.random() * 4;

      /* trunk — CylinderGeometry brown */
      tGeo  = new THREE.CylinderGeometry(0.22, 0.38, th, 7);
      tMat  = _makeMat(0x5A3A18);
      trunk = _makeMesh(tGeo, tMat);
      trunk.position.set(tx, th * 0.5, tz);
      _addMesh(trunk);

      /* canopy — multiple SphereGeometry dark green clusters */
      cluCount = 2 + Math.floor(Math.random() * 3);
      for (j = 0; j < cluCount; j++) {
        cx   = tx + (Math.random() - 0.5) * 2.4;
        cz   = tz + (Math.random() - 0.5) * 2.4;
        cGeo = new THREE.SphereGeometry(1.3 + Math.random() * 0.9, 7, 6);
        cMat = _makeMat(0x1A4A1A);
        canopy = _makeMesh(cGeo, cMat);
        canopy.position.set(cx, th + 0.8 + Math.random() * 0.6, cz);
        _addMesh(canopy);
      }

      _trees.push({ x: tx, z: tz, r: 2.0 });  /* collision radius */
    }
  }

  /* ── Guerrilla camp ─────────────────────────────────────────────────── */
  function _buildGuerillaCamp() {
    /* tents — triangular wedge-shaped BoxGeometry scaled to look like tent */
    var tentData = [
      { x: -5, z: -6, w: 4, h: 2.8, d: 5 },
      { x:  4, z: -4, w: 4, h: 2.4, d: 5 },
      { x: -3, z:  5, w: 3.5, h: 2.2, d: 4.5 },
      { x:  5, z:  7, w: 4,   h: 2.6, d: 5 },
    ];
    var i, tg, tm, tent;
    for (i = 0; i < tentData.length; i++) {
      tg   = new THREE.BoxGeometry(tentData[i].w, tentData[i].h, tentData[i].d);
      tm   = _makeMat(0x5A6632);
      tent = _makeMesh(tg, tm);
      tent.position.set(tentData[i].x, tentData[i].h * 0.5, tentData[i].z);
      _addMesh(tent);
      _campTents.push(tent);
    }

    /* cooking fires — orange PointLight + small box */
    var firePositions = [
      { x: -1, z: -2 },
      { x:  3, z:  3 },
    ];
    var fg, fm, fireMesh, fireLight;
    for (i = 0; i < firePositions.length; i++) {
      fg       = new THREE.BoxGeometry(0.5, 0.2, 0.5);
      fm       = _makeMat(0xDD4400);
      fireMesh = _makeMesh(fg, fm);
      fireMesh.position.set(firePositions[i].x, 0.1, firePositions[i].z);
      _addMesh(fireMesh);

      fireLight = new THREE.PointLight(0xFF6600, 1.5, 12);
      fireLight.position.set(firePositions[i].x, 0.6, firePositions[i].z);
      _addMesh(fireLight);
      _campFires.push({ mesh: fireMesh, light: fireLight });
    }

    /* supply crates — BoxGeometry */
    var cratePositions = [
      { x:  2, z: -7 }, { x:  4, z: -7 }, { x:  6, z: -7 },
      { x:  2, z: -5 }, { x:  6, z:  0 },
    ];
    var cg, cm, crate;
    for (i = 0; i < cratePositions.length; i++) {
      cg    = new THREE.BoxGeometry(1, 1, 1);
      cm    = _makeMat(0x7A6030);
      crate = _makeMesh(cg, cm);
      crate.position.set(cratePositions[i].x, 0.5, cratePositions[i].z);
      _addMesh(crate);
      _supplyCrates.push(crate);
    }
  }

  /* ── Watchtower ─────────────────────────────────────────────────────── */
  function _buildWatchtower() {
    /* pole — tall CylinderGeometry */
    var poleGeo = new THREE.CylinderGeometry(0.25, 0.35, 12, 8);
    var poleMat = _makeMat(0x5C4020);
    var pole    = _makeMesh(poleGeo, poleMat);
    pole.position.set(8, 6, -10);
    _addMesh(pole);

    /* platform — BoxGeometry on top */
    var platGeo = new THREE.BoxGeometry(4, 0.4, 4);
    var platMat = _makeMat(0x4A3518);
    var plat    = _makeMesh(platGeo, platMat);
    plat.position.set(8, 12.2, -10);
    _addMesh(plat);

    /* railing */
    var railGeo = new THREE.BoxGeometry(4, 0.8, 0.15);
    var railMat = _makeMat(0x3A2810);
    var rail;
    var railOffsets = [
      { x: 0,    z:  2 },
      { x: 0,    z: -2 },
    ];
    var i;
    for (i = 0; i < railOffsets.length; i++) {
      rail = _makeMesh(new THREE.BoxGeometry(4, 0.8, 0.15), railMat);
      rail.position.set(8 + railOffsets[i].x, 12.8, -10 + railOffsets[i].z);
      _addMesh(rail);
    }
    rail = _makeMesh(new THREE.BoxGeometry(0.15, 0.8, 4), railMat);
    rail.position.set(10, 12.8, -10);
    _addMesh(rail);
    rail = _makeMesh(new THREE.BoxGeometry(0.15, 0.8, 4), railMat);
    rail.position.set(6, 12.8, -10);
    _addMesh(rail);

    /* cross-braces on pole */
    var brGeo = new THREE.BoxGeometry(3, 0.2, 0.2);
    var brMat = _makeMat(0x3A2810);
    var brace;
    var braceYs = [3, 6, 9];
    for (i = 0; i < braceYs.length; i++) {
      brace = _makeMesh(brGeo, brMat);
      brace.position.set(8, braceYs[i], -10);
      _addMesh(brace);
    }

    /* searchlight — ConeGeometry + PointLight */
    var searchGeo = new THREE.ConeGeometry(0.4, 1.2, 8);
    var searchMat = _makeMat(0xEEEE88);
    _searchlight  = _makeMesh(searchGeo, searchMat);
    _searchlight.position.set(8, 13.2, -10);
    _searchlight.rotation.x = Math.PI * 0.5;
    _addMesh(_searchlight);

    _watchtowerMesh = plat;
  }

  /* ── Prisoner cage ──────────────────────────────────────────────────── */
  function _buildPrisonerCage() {
    /* cage frame — BoxGeometry */
    var frameGeo = new THREE.BoxGeometry(3, 3, 3);
    var frameMat = _makeMat(0x554433, { transparent: true, opacity: 0.0, wireframe: true });
    _cageMesh    = _makeMesh(frameGeo, frameMat);
    _cageMesh.position.set(-8, 1.5, 3);
    _addMesh(_cageMesh);

    /* cage bars — LineSegments */
    var barVerts = [];
    var b, bx, bz;
    /* vertical bars along X sides */
    for (b = 0; b <= 4; b++) {
      bx = -1.5 + b * 0.75;
      /* front face */
      barVerts.push(bx, 0, -1.5,  bx, 3, -1.5);
      /* back face */
      barVerts.push(bx, 0,  1.5,  bx, 3,  1.5);
    }
    /* vertical bars along Z sides */
    for (b = 0; b <= 4; b++) {
      bz = -1.5 + b * 0.75;
      barVerts.push(-1.5, 0, bz,  -1.5, 3, bz);
      barVerts.push( 1.5, 0, bz,   1.5, 3, bz);
    }
    /* horizontal rails */
    var rh;
    for (rh = 0; rh <= 2; rh++) {
      var ry = rh * 1.5;
      barVerts.push(-1.5, ry, -1.5,  1.5, ry, -1.5);
      barVerts.push(-1.5, ry,  1.5,  1.5, ry,  1.5);
      barVerts.push(-1.5, ry, -1.5, -1.5, ry,  1.5);
      barVerts.push( 1.5, ry, -1.5,  1.5, ry,  1.5);
    }

    var barGeo = new THREE.BufferGeometry();
    barGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(barVerts), 3));
    var barMat  = new THREE.LineBasicMaterial({ color: 0x887755 });
    var barLines = new THREE.LineSegments(barGeo, barMat);
    barLines.position.set(-8, 0, 3);
    _addMesh(barLines);

    /* lock — small BoxGeometry on cage */
    var lockGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
    var lockMat = _makeMat(0xCCCC00);
    _cageLockMesh = _makeMesh(lockGeo, lockMat);
    _cageLockMesh.position.set(-6.5, 1.5, 1.5);
    _addMesh(_cageLockMesh);

    /* agent inside cage */
    var agGeo = new THREE.BoxGeometry(0.45, 1.6, 0.45);
    var agMat = _makeMat(0x885544);
    _agentMesh = _makeMesh(agGeo, agMat);
    _agentMesh.position.set(-8, 0.8, 3);
    _addMesh(_agentMesh);
    _agentPos = { x: -8, y: 0, z: 3 };
  }

  /* ── Supply boat ────────────────────────────────────────────────────── */
  function _buildSupplyBoat() {
    /* hull — BoxGeometry */
    var hullGeo = new THREE.BoxGeometry(4, 0.8, 8);
    var hullMat = _makeMat(0x3A3A28);
    _boatMesh   = _makeMesh(hullGeo, hullMat);
    _boatMesh.position.set(20, 0.1, 0);
    _addMesh(_boatMesh);

    /* hull side walls */
    var wallGeo = new THREE.BoxGeometry(0.2, 0.6, 8);
    var wallMat = _makeMat(0x2A2A1E);
    var wallL   = _makeMesh(wallGeo, wallMat);
    wallL.position.set(-2, 0.3, 0);
    _boatMesh.add(wallL);
    var wallR = _makeMesh(new THREE.BoxGeometry(0.2, 0.6, 8), wallMat);
    wallR.position.set(2, 0.3, 0);
    _boatMesh.add(wallR);

    /* motor — CylinderGeometry at stern */
    var motorGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.9, 8);
    var motorMat = _makeMat(0x555544);
    _boatMotor   = _makeMesh(motorGeo, motorMat);
    _boatMotor.position.set(0, 0.0, 4);
    _boatMesh.add(_boatMotor);

    /* propeller blade (CylinderGeometry thin disk) */
    var propGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.08, 8);
    var propMat = _makeMat(0x444433);
    var prop    = _makeMesh(propGeo, propMat);
    prop.position.set(0, -0.5, 4.4);
    prop.rotation.x = Math.PI * 0.5;
    _boatMesh.add(prop);
    _boatMesh._prop = prop;
  }

  /* ── Underground tunnel markers ─────────────────────────────────────── */
  function _buildTunnelMarkers() {
    /* 4 tunnel exit markers — partially sunken BoxGeometry */
    var tunnelExits = [
      { x: -15, z: -20 },
      { x:  15, z: -20 },
      { x: -15, z:  20 },
      { x:  15, z:  20 },
    ];
    var i, tg, tm, tmesh;
    for (i = 0; i < tunnelExits.length; i++) {
      tg    = new THREE.BoxGeometry(1.2, 0.6, 1.2);
      tm    = _makeMat(0x2A1F10);
      tmesh = _makeMesh(tg, tm);
      tmesh.position.set(tunnelExits[i].x, -0.15, tunnelExits[i].z);
      _addMesh(tmesh);
      _tunnelMarkers.push({ pos: { x: tunnelExits[i].x, z: tunnelExits[i].z }, mesh: tmesh });
    }

    /* tunnel passage visualization — low BoxGeometry connecting markers */
    var passGeo = new THREE.BoxGeometry(32, 0.2, 0.6);
    var passMat = _makeMat(0x1A1208, { transparent: true, opacity: 0.4 });
    var passH   = _makeMesh(passGeo, passMat);
    passH.position.set(0, -0.4, -20);
    _addMesh(passH);

    var passV = _makeMesh(new THREE.BoxGeometry(0.6, 0.2, 42), passMat);
    passV.position.set(-15, -0.4, 0);
    _addMesh(passV);

    var passV2 = _makeMesh(new THREE.BoxGeometry(0.6, 0.2, 42), passMat);
    passV2.position.set(15, -0.4, 0);
    _addMesh(passV2);
  }

  /* ── Extraction zone ────────────────────────────────────────────────── */
  function _buildExtractionZone() {
    /* glowing flat BoxGeometry pad on north island */
    var ezGeo = new THREE.BoxGeometry(10, 0.15, 8);
    var ezMat = _makeMat(0x00AAFF, { transparent: true, opacity: 0.35 });
    _extractionZone = _makeMesh(ezGeo, ezMat);
    _extractionZone.position.set(0, 0.25, 45);
    _addMesh(_extractionZone);

    /* extraction marker arrows — LineSegments X */
    var arrowVerts = new Float32Array([
      -3, 0.2, 45,   3, 0.2, 45,
       0, 0.2, 42,   0, 0.2, 48,
      -2, 0.2, 43,   2, 0.2, 47,
       2, 0.2, 43,  -2, 0.2, 47,
    ]);
    var arrowGeo = new THREE.BufferGeometry();
    arrowGeo.setAttribute('position', new THREE.BufferAttribute(arrowVerts, 3));
    var arrowMat   = new THREE.LineBasicMaterial({ color: 0x00DDFF });
    var arrowLines = new THREE.LineSegments(arrowGeo, arrowMat);
    _addMesh(arrowLines);

    /* text label box */
    var lblGeo = new THREE.BoxGeometry(6, 0.5, 1.5);
    var lblMat = _makeMat(0x0055AA, { transparent: true, opacity: 0.7 });
    var lbl    = _makeMesh(lblGeo, lblMat);
    lbl.position.set(0, 0.6, 49);
    _addMesh(lbl);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SPAWN ENEMIES
  ═══════════════════════════════════════════════════════════════════════ */

  function _spawnEnemies() {
    var i, gGeo, gMat, gMesh;

    /* 14 guerrillas — camouflage color 0x446633 */
    var guerPos = [
      { x: -12, z: -12 }, { x:  12, z: -12 }, { x: -20, z:  0  }, { x:  20, z:  0  },
      { x: -12, z:  12 }, { x:  12, z:  12 }, { x:  -5, z: -18 }, { x:   5, z: -18 },
      { x: -25, z: -15 }, { x:  25, z: -15 }, { x: -25, z:  15 }, { x:  25, z:  15 },
      { x:  -8, z:  -8 }, { x:   8, z:   8 },
    ];

    for (i = 0; i < 14; i++) {
      gGeo  = new THREE.BoxGeometry(0.5, 1.75, 0.5);
      gMat  = _makeMat(0x446633);
      gMesh = _makeMesh(gGeo, gMat);
      gMesh.position.set(guerPos[i].x, 0.875, guerPos[i].z);
      _addMesh(gMesh);
      _guerrillas.push({
        mesh:         gMesh,
        hp:           70,
        alive:        true,
        pos:          { x: guerPos[i].x, y: 0.875, z: guerPos[i].z },
        inFoliage:    false,
        foliageTimer: 0,
        alertTimer:   0,
        shootTimer:   0,
        alerted:      false,
        stillTimer:   0   /* how long stationary — triggers foliage hide */
      });
    }

    /* 5 elite commanders — color 0x334422 */
    var elitePos = [
      { x: -6, z:  0  },
      { x:  6, z:  0  },
      { x:  0, z: -15 },
      { x: -18, z: 10 },
      { x:  18, z: 10 },
    ];
    var eMat = _makeMat(0x334422);
    var eMesh;
    for (i = 0; i < 5; i++) {
      eMesh = _makeMesh(new THREE.BoxGeometry(0.52, 1.8, 0.52), eMat.clone());
      eMesh.position.set(elitePos[i].x, 0.9, elitePos[i].z);
      _addMesh(eMesh);
      _elites.push({
        mesh:        eMesh,
        hp:          95,
        alive:       true,
        pos:         { x: elitePos[i].x, y: 0.9, z: elitePos[i].z },
        retreating:  false,
        retreatPos:  null,
        tunnelTimer: 0,
        called:      false,
        alerted:     false,
        shootTimer:  0,
        alertTimer:  0
      });
    }

    /* Boss General Mantis — color 0x223311, starts on boat */
    var mGeo  = new THREE.BoxGeometry(0.6, 1.9, 0.6);
    var mMat  = _makeMat(0x223311);
    var mMesh = _makeMesh(mGeo, mMat);
    mMesh.position.set(20, 1.0, 0);
    _addMesh(mMesh);

    /* sniper rifle visual — thin BoxGeometry */
    var rifleGeo = new THREE.BoxGeometry(0.08, 0.08, 1.4);
    var rifleMat = _makeMat(0x222222);
    var rifle    = _makeMesh(rifleGeo, rifleMat);
    rifle.position.set(0.35, 0.6, -0.7);
    mMesh.add(rifle);

    _mantis = {
      mesh:          mMesh,
      hp:            490,
      alive:         true,
      pos:           { x: 20, y: 1.0, z: 0 },
      sniperTimer:   0,
      grenadeTimer:  0,
      sniperCooldown: 4.5,
      grenadeCooldown: 7.0
    };
  }

  /* ═══════════════════════════════════════════════════════════════════════
     ENEMY AI — GUERRILLAS
  ═══════════════════════════════════════════════════════════════════════ */

  function _updateGuerrillas(dt) {
    var i, g, dx, dz, dist, nearTree, j;
    for (i = 0; i < _guerrillas.length; i++) {
      g = _guerrillas[i];
      if (!g.alive) continue;

      dx   = _playerPos.x - g.pos.x;
      dz   = _playerPos.z - g.pos.z;
      dist = Math.sqrt(dx * dx + dz * dz);

      /* foliage detection — reduce visibility when near tree & still */
      nearTree = false;
      for (j = 0; j < _trees.length; j++) {
        if (_dist2(g.pos, _trees[j]) < 3.5) { nearTree = true; break; }
      }

      /* alert if player within 18 units or if shot (handled on hit) */
      if (dist < 18 && !g.alerted) { g.alerted = true; }

      if (!g.alerted) {
        /* patrol / hide in foliage */
        g.stillTimer += dt;
        if (nearTree && g.stillTimer > 2) {
          g.inFoliage = true;
          /* fade color to match environment */
          g.mesh.material.color.setHex(0x3A5525);
        } else if (!nearTree) {
          g.inFoliage  = false;
          g.stillTimer = 0;
          g.mesh.material.color.setHex(0x446633);
          /* wander slowly toward camp center */
          var wx = -g.pos.x * 0.005;
          var wz = -g.pos.z * 0.005;
          g.pos.x += wx * dt;
          g.pos.z += wz * dt;
          g.mesh.position.set(g.pos.x, g.pos.y, g.pos.z);
        }
        continue;
      }

      /* alerted — charge player */
      g.inFoliage = false;
      g.mesh.material.color.setHex(0x446633);

      if (dist > 2.0) {
        var speed = 3.8;
        g.pos.x += (dx / dist) * speed * dt;
        g.pos.z += (dz / dist) * speed * dt;
        g.mesh.position.set(g.pos.x, g.pos.y, g.pos.z);
      } else {
        /* melee attack */
        g.alertTimer += dt;
        if (g.alertTimer >= 1.2) {
          g.alertTimer = 0;
          _damagePlayer(10, 'guerrilla');
        }
      }

      /* ranged fire at 8-18 units */
      g.shootTimer += dt;
      if (g.shootTimer >= 2.5 && dist > 3.5 && dist < 18) {
        g.shootTimer = 0;
        if (Math.random() < 0.45) {
          _damagePlayer(8, 'guerrilla rifle');
        }
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     ENEMY AI — ELITE COMMANDERS
  ═══════════════════════════════════════════════════════════════════════ */

  function _updateElites(dt) {
    var i, e, dx, dz, dist;
    for (i = 0; i < _elites.length; i++) {
      e = _elites[i];
      if (!e.alive) continue;

      dx   = _playerPos.x - e.pos.x;
      dz   = _playerPos.z - e.pos.z;
      dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 22 && !e.alerted) { e.alerted = true; }
      if (!e.alerted) continue;

      /* tactical retreat when HP < 40 */
      if (e.hp < 40 && !e.retreating) {
        e.retreating = true;
        /* flee opposite direction from player */
        e.retreatPos = {
          x: e.pos.x - (dx / (dist || 1)) * 15,
          z: e.pos.z - (dz / (dist || 1)) * 15
        };
      }

      if (e.retreating && e.retreatPos) {
        var rdx = e.retreatPos.x - e.pos.x;
        var rdz = e.retreatPos.z - e.pos.z;
        var rd  = Math.sqrt(rdx * rdx + rdz * rdz);
        if (rd > 1.5) {
          e.pos.x += (rdx / rd) * 5 * dt;
          e.pos.z += (rdz / rd) * 5 * dt;
          e.mesh.position.set(e.pos.x, e.pos.y, e.pos.z);
        } else {
          e.retreating  = false;
          e.retreatPos  = null;
        }
      } else if (!e.retreating && dist > 4) {
        /* advance */
        e.pos.x += (dx / dist) * 3.2 * dt;
        e.pos.z += (dz / dist) * 3.2 * dt;
        e.mesh.position.set(e.pos.x, e.pos.y, e.pos.z);
      } else if (dist <= 3) {
        /* melee */
        e.alertTimer += dt;
        if (e.alertTimer >= 1.5) {
          e.alertTimer = 0;
          _damagePlayer(14, 'elite melee');
        }
      }

      /* shoot at player */
      e.shootTimer += dt;
      if (e.shootTimer >= 2.0 && dist < 24) {
        e.shootTimer = 0;
        if (Math.random() < 0.55) {
          _damagePlayer(12, 'elite rifle');
        }
      }

      /* tunnel flanker call — once per elite, when first attacked (hp < 75) */
      if (!e.called && e.hp < 75) {
        e.called = true;
        e.tunnelTimer = 0;
        _spawnTunnelFlankers();
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     TUNNEL FLANKERS
  ═══════════════════════════════════════════════════════════════════════ */

  function _spawnTunnelFlankers() {
    /* spawn 2 guerrillas from nearest tunnel behind player */
    _setFlash('TUNNEL FLANKERS INCOMING — CHECK YOUR SIX!', 4);

    var bestTunnel = null;
    var bestScore  = -99999;
    var i, t, score;

    /* pick tunnel most behind player (opposite of player look direction) */
    for (i = 0; i < _tunnelMarkers.length; i++) {
      t = _tunnelMarkers[i];
      /* prefer tunnels behind player (high z relative to player looking north) */
      score = -(_dist2(_playerPos, t.pos));  /* negative dist — pick closest */
      if (score > bestScore) { bestScore = score; bestTunnel = t; }
    }

    if (!bestTunnel) return;

    /* spawn 2 flankers at tunnel exit */
    var j, fGeo, fMat, fMesh;
    for (j = 0; j < 2; j++) {
      fGeo  = new THREE.BoxGeometry(0.5, 1.75, 0.5);
      fMat  = _makeMat(0x446633);
      fMesh = _makeMesh(fGeo, fMat);
      fMesh.position.set(
        bestTunnel.pos.x + (j === 0 ? -0.8 : 0.8),
        0.875,
        bestTunnel.pos.z
      );
      _addMesh(fMesh);
      _flankers.push({
        mesh:        fMesh,
        hp:          60,
        alive:       true,
        pos:         { x: bestTunnel.pos.x + (j === 0 ? -0.8 : 0.8), y: 0.875, z: bestTunnel.pos.z },
        shootTimer:  0,
        alertTimer:  0
      });
    }
  }

  function _updateFlankers(dt) {
    var i, f, dx, dz, dist;
    for (i = 0; i < _flankers.length; i++) {
      f = _flankers[i];
      if (!f.alive) continue;

      dx   = _playerPos.x - f.pos.x;
      dz   = _playerPos.z - f.pos.z;
      dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 2.0) {
        f.pos.x += (dx / dist) * 4.2 * dt;
        f.pos.z += (dz / dist) * 4.2 * dt;
        f.mesh.position.set(f.pos.x, f.pos.y, f.pos.z);
      } else {
        f.alertTimer += dt;
        if (f.alertTimer >= 1.1) {
          f.alertTimer = 0;
          _damagePlayer(11, 'flanker');
        }
      }

      f.shootTimer += dt;
      if (f.shootTimer >= 2.2 && dist > 3 && dist < 16) {
        f.shootTimer = 0;
        if (Math.random() < 0.5) {
          _damagePlayer(9, 'flanker fire');
        }
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     ENEMY AI — BOSS GENERAL MANTIS
  ═══════════════════════════════════════════════════════════════════════ */

  function _updateMantis(dt) {
    if (!_mantis || !_mantis.alive) return;

    /* ride the boat — update Mantis position to match boat */
    _mantis.pos.x = _boatMesh.position.x;
    _mantis.pos.z = _boatMesh.position.z;
    _mantis.mesh.position.set(_mantis.pos.x, 1.4, _mantis.pos.z);

    var dx   = _playerPos.x - _mantis.pos.x;
    var dz   = _playerPos.z - _mantis.pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);

    /* sniper rifle attack */
    _mantis.sniperTimer += dt;
    if (_mantis.sniperTimer >= _mantis.sniperCooldown) {
      _mantis.sniperTimer = 0;
      /* sniper shot: high damage, long range */
      if (dist < 55) {
        var hitChance = _boatStopped ? 0.75 : 0.45;
        if (Math.random() < hitChance) {
          _damagePlayer(28, 'Mantis sniper');
        }
      }
    }

    /* grenade launcher attack */
    _mantis.grenadeTimer += dt;
    if (_mantis.grenadeTimer >= _mantis.grenadeCooldown) {
      _mantis.grenadeTimer = 0;
      if (dist < 40) {
        _fireMantisGrenade();
      }
    }
  }

  function _fireMantisGrenade() {
    /* ConeGeometry grenade projectile */
    var gGeo  = new THREE.ConeGeometry(0.18, 0.5, 6);
    var gMat  = _makeMat(0x886622);
    var gMesh = _makeMesh(gGeo, gMat);
    gMesh.position.set(_mantis.pos.x, 1.5, _mantis.pos.z);
    _addMesh(gMesh);

    /* arc toward player position */
    var dx = _playerPos.x - _mantis.pos.x;
    var dz = _playerPos.z - _mantis.pos.z;
    var dd = Math.sqrt(dx * dx + dz * dz) || 1;

    _grenades.push({
      mesh:  gMesh,
      pos:   { x: _mantis.pos.x, y: 1.5, z: _mantis.pos.z },
      vel:   { x: (dx / dd) * 12, y: 5, z: (dz / dd) * 12 },
      timer: 0,
      live:  true
    });
  }

  function _updateGrenades(dt) {
    var i, gr, dist;
    for (i = 0; i < _grenades.length; i++) {
      gr = _grenades[i];
      if (!gr.live) continue;

      gr.timer  += dt;
      gr.vel.y  -= 16 * dt;   /* gravity */
      gr.pos.x  += gr.vel.x * dt;
      gr.pos.y  += gr.vel.y * dt;
      gr.pos.z  += gr.vel.z * dt;
      gr.mesh.position.set(gr.pos.x, gr.pos.y, gr.pos.z);
      gr.mesh.rotation.x += dt * 4;

      /* detonate on ground or timer */
      if (gr.pos.y <= 0 || gr.timer > 4) {
        gr.live = false;
        gr.mesh.visible = false;
        /* AoE damage 45 */
        dist = _dist2(_playerPos, gr.pos);
        if (dist < 5.5) {
          _damagePlayer(45, 'grenade AoE');
          _setFlash('GRENADE! -45 HP', 2);
        }
        /* damage nearby guerrillas (friendly fire / missed grenade) */
        /* — intentionally skip (grenades are enemy weapons) */
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SUPPLY BOAT — figure-8 pattern
  ═══════════════════════════════════════════════════════════════════════ */

  function _updateBoat(dt) {
    if (_boatStopped) {
      /* propeller stops */
      return;
    }

    _boatAngle += _boatSpeed * dt * 0.3;

    /* figure-8 via Lissajous curve */
    var fx = 18 * Math.sin(_boatAngle);
    var fz = 14 * Math.sin(_boatAngle * 2);

    _boatMesh.position.x = fx;
    _boatMesh.position.z = fz;

    /* rotate boat to face travel direction */
    var ddx = 18 * Math.cos(_boatAngle) * _boatSpeed * 0.3;
    var ddz = 28 * Math.cos(_boatAngle * 2) * _boatSpeed * 0.3;
    if (Math.abs(ddx) + Math.abs(ddz) > 0.01) {
      _boatMesh.rotation.y = Math.atan2(ddx, ddz);
    }

    /* propeller spin */
    if (_boatMesh._prop) {
      _boatMesh._prop.rotation.z += dt * 12;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SEARCHLIGHT
  ═══════════════════════════════════════════════════════════════════════ */

  function _updateSearchlight(dt) {
    if (!_searchlight) return;
    _searchAngle += dt * 0.6;
    var sr = 8;
    _searchlight.position.set(
      8 + Math.cos(_searchAngle) * sr,
      13.2,
      -10 + Math.sin(_searchAngle) * sr * 0.5
    );
    /* check if searchlight hits player — no mechanical effect, visual only */
  }

  /* ═══════════════════════════════════════════════════════════════════════
     FIRE FLICKER
  ═══════════════════════════════════════════════════════════════════════ */

  var _fireFlickerTimer = 0;
  function _updateFireFlicker(dt) {
    _fireFlickerTimer += dt;
    if (_fireFlickerTimer < 0.08) return;
    _fireFlickerTimer = 0;
    var i, cf;
    for (i = 0; i < _campFires.length; i++) {
      cf = _campFires[i];
      cf.light.intensity = 1.0 + Math.random() * 1.2;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     AGENT / PRISONER RESCUE
  ═══════════════════════════════════════════════════════════════════════ */

  function _updateAgent(dt) {
    if (!_agentRescued) return;
    if (_agentExtracted) return;

    if (_agentEscorting) {
      /* agent follows player */
      var dx = _playerPos.x - _agentPos.x;
      var dz = _playerPos.z - _agentPos.z;
      var dd = Math.sqrt(dx * dx + dz * dz);
      if (dd > 1.8) {
        _agentPos.x += (dx / dd) * 4 * dt;
        _agentPos.z += (dz / dd) * 4 * dt;
        _agentMesh.position.set(_agentPos.x, 0.8, _agentPos.z);
      }

      /* agent takes some fire from enemies */
      /* (handled passively — guerrillas sometimes target agent) */
    }

    /* check extraction */
    if (_agentEscorting) {
      var dex = _dist2(_agentPos, { x: 0, z: 45 });
      if (dex < 6 && _mantisDefeated) {
        _agentExtracted = true;
        _agentMesh.material.color.setHex(0x00CC44);
        _setFlash('AGENT EXTRACTED! Reach extraction zone to complete mission!', 5);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SHOOTING
  ═══════════════════════════════════════════════════════════════════════ */

  function _fireWeapon() {
    if (_shootCooldown > 0) return;
    _shootCooldown = SHOOT_INTERVAL;

    var raycaster = new THREE.Raycaster();
    var center    = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(center, _camera);

    /* build target list */
    var targets = [];
    var i;

    for (i = 0; i < _guerrillas.length; i++) {
      if (_guerrillas[i].alive) {
        targets.push({ type: 'guerrilla', idx: i, mesh: _guerrillas[i].mesh });
      }
    }
    for (i = 0; i < _elites.length; i++) {
      if (_elites[i].alive) {
        targets.push({ type: 'elite', idx: i, mesh: _elites[i].mesh });
      }
    }
    for (i = 0; i < _flankers.length; i++) {
      if (_flankers[i].alive) {
        targets.push({ type: 'flanker', idx: i, mesh: _flankers[i].mesh });
      }
    }
    if (_mantis && _mantis.alive) {
      targets.push({ type: 'mantis', idx: 0, mesh: _mantis.mesh });
    }
    /* cage lock */
    if (!_cageLockShot && _cageLockMesh) {
      targets.push({ type: 'lock', idx: 0, mesh: _cageLockMesh });
    }
    /* boat motor */
    if (_boatMotor && !_boatStopped) {
      targets.push({ type: 'motor', idx: 0, mesh: _boatMotor });
    }

    var meshList = [];
    for (i = 0; i < targets.length; i++) { meshList.push(targets[i].mesh); }

    var hits = raycaster.intersectObjects(meshList, true);
    if (!hits.length) return;

    /* resolve which parent target was hit */
    var hitMesh = hits[0].object;
    var resolved = null;
    for (i = 0; i < targets.length; i++) {
      var tm = targets[i].mesh;
      if (tm === hitMesh || (tm.children && _meshContains(tm, hitMesh))) {
        resolved = targets[i];
        break;
      }
    }
    if (!resolved) return;

    if (resolved.type === 'guerrilla') {
      var g = _guerrillas[resolved.idx];
      g.hp -= SHOOT_DMG_GUER;
      g.alerted = true;
      if (g.hp <= 0) { _killGuerrilla(resolved.idx); }
      else { _setFlash('GUERRILLA HIT — ' + g.hp + 'HP', 0.8); }

    } else if (resolved.type === 'elite') {
      var e = _elites[resolved.idx];
      e.hp -= SHOOT_DMG_ELITE;
      e.alerted = true;
      if (e.hp <= 0) { _killElite(resolved.idx); }
      else { _setFlash('ELITE HIT — ' + e.hp + 'HP', 0.8); }

    } else if (resolved.type === 'flanker') {
      var fl = _flankers[resolved.idx];
      fl.hp -= SHOOT_DMG_GUER;
      if (fl.hp <= 0) { _killFlanker(resolved.idx); }

    } else if (resolved.type === 'mantis') {
      if (!_boatStopped) {
        _setFlash('MANTIS ON MOVING BOAT — STOP BOAT FIRST!', 2);
        /* still deal reduced damage while boat moving */
        _mantis.hp -= Math.floor(SHOOT_DMG_BOSS * 0.4);
      } else {
        _mantis.hp -= SHOOT_DMG_BOSS;
      }
      if (_mantis.hp <= 0) { _killMantis(); }
      else { _setFlash('MANTIS HIT — ' + _mantis.hp + '/490 HP', 1); }

    } else if (resolved.type === 'lock') {
      _shootCageLock();

    } else if (resolved.type === 'motor') {
      _hitBoatMotor();
    }
  }

  function _meshContains(parent, child) {
    var found = false;
    parent.traverse(function (obj) { if (obj === child) found = true; });
    return found;
  }

  /* ─────────────────────────────────────────────────────────────────────── */

  function _shootCageLock() {
    _cageLockShot = true;
    _cageLockMesh.visible = false;
    _agentRescued = true;
    _agentEscorting = true;
    _agentMesh.material.color.setHex(0xFF8844);
    _setFlash('LOCK SHOT! Agent freed — escort to extraction zone (north)!', 5);
  }

  function _hitBoatMotor() {
    _boatMotorHP -= SHOOT_DMG_MOTOR;
    _setFlash('MOTOR HIT! ' + _boatMotorHP + '/3 HP remaining', 1.5);
    _boatMotor.material.color.setHex(
      _boatMotorHP === 2 ? 0xAA8800 :
      _boatMotorHP === 1 ? 0xCC4400 : 0xFF0000
    );
    if (_boatMotorHP <= 0) {
      _boatStopped = true;
      _boatMesh.material.color.setHex(0x222211);
      _setFlash('BOAT ENGINE DESTROYED — Mantis now vulnerable!', 5);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     KILL HELPERS
  ═══════════════════════════════════════════════════════════════════════ */

  function _killGuerrilla(idx) {
    var g = _guerrillas[idx];
    g.alive = false;
    g.mesh.position.y = 0.2;
    g.mesh.scale.y    = 0.25;
    g.mesh.material.color.setHex(0x221511);
  }

  function _killElite(idx) {
    var e = _elites[idx];
    e.alive = false;
    e.mesh.position.y = 0.2;
    e.mesh.scale.y    = 0.25;
    e.mesh.material.color.setHex(0x1A2010);
    _setFlash('ELITE COMMANDER DOWN!', 2);
  }

  function _killFlanker(idx) {
    var f = _flankers[idx];
    f.alive = false;
    f.mesh.position.y = 0.2;
    f.mesh.scale.y    = 0.25;
    f.mesh.material.color.setHex(0x221511);
  }

  function _killMantis() {
    _mantis.alive    = false;
    _mantisDefeated  = true;
    _mantis.mesh.position.y = 0.3;
    _mantis.mesh.scale.set(1.5, 0.3, 1.5);
    _mantis.mesh.material.color.setHex(0x111108);
    _boatMesh.material.color.setHex(0x222211);
    _setFlash('GENERAL MANTIS ELIMINATED! Now rescue the agent and reach extraction!', 6);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PLAYER DAMAGE
  ═══════════════════════════════════════════════════════════════════════ */

  function _damagePlayer(amount, source) {
    _playerHP -= amount;
    if (_playerHP <= 0) {
      _playerHP = 0;
      _failMission('Player KIA — ' + source);
    }
    /* damage agent if escorting */
    if (_agentEscorting && !_agentExtracted) {
      _agentHP -= Math.floor(amount * 0.3);
      if (_agentHP <= 0) {
        _agentHP = 0;
        _failMission('Captured agent killed during escort');
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ═══════════════════════════════════════════════════════════════════════ */

  function _updatePlayer(dt) {
    if (!_playerPos || !_camera) return;

    /* mouse look */
    var sensitivity = 0.002;
    _playerYaw   -= _mouseDX * sensitivity;
    _playerPitch -= _mouseDY * sensitivity;
    _playerPitch  = _clamp(_playerPitch, -1.2, 1.2);
    _mouseDX = 0;
    _mouseDY = 0;

    _camera.rotation.order = 'YXZ';
    _camera.rotation.y     = _playerYaw;
    _camera.rotation.x     = _playerPitch;

    /* movement */
    var speed = 7;
    _inWater  = _isInWater(_playerPos);
    if (_inWater) { speed *= 0.75; }   /* 25% slower in water */

    var fwd   = _keys['KeyW'] ? 1 : 0;
    var back  = _keys['KeyS'] ? 1 : 0;
    var left  = _keys['KeyA'] ? 1 : 0;
    var right = _keys['KeyD'] ? 1 : 0;

    var moveX = (right - left) * speed * dt;
    var moveZ = (back  - fwd)  * speed * dt;
    var sinY  = Math.sin(_playerYaw);
    var cosY  = Math.cos(_playerYaw);

    _playerPos.x += moveX * cosY - moveZ * sinY;
    _playerPos.z += moveX * sinY + moveZ * cosY;

    /* boundary */
    _playerPos.x = _clamp(_playerPos.x, -50, 50);
    _playerPos.z = _clamp(_playerPos.z, -50, 52);

    _camera.position.set(_playerPos.x, _playerPos.y + 1.7, _playerPos.z);

    /* water sound timer (cosmetic) */
    if (_inWater) {
      _waterSoundTimer += dt;
    } else {
      _waterSoundTimer = 0;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     WIN / LOSE
  ═══════════════════════════════════════════════════════════════════════ */

  function _checkWin() {
    /* Win: prisoner rescued + Mantis defeated + player at extraction zone */
    if (!_agentRescued)   return;
    if (!_mantisDefeated) return;
    if (!_agentEscorting) return;
    var dex = _dist2(_playerPos, { x: 0, z: 45 });
    if (dex < 8) {
      _winMission();
    }
  }

  function _winMission() {
    _missionDone = true;
    _active      = false;
    _showEndMsg('MISSION COMPLETE! Agent rescued. General Mantis eliminated. Extraction successful.');
  }

  function _failMission(reason) {
    _missionFailed = true;
    _active        = false;
    _showEndMsg('MISSION FAILED: ' + reason);
  }

  function _showEndMsg(msg) {
    var div = document.createElement('div');
    div.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,15,0,0.92)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:18px',
      'padding:22px 44px',
      'border:2px solid #00AA55',
      'border-radius:6px',
      'z-index:10000',
      'text-align:center',
      'max-width:600px',
      'line-height:1.5'
    ].join(';');
    div.textContent = msg;
    document.body.appendChild(div);
    _ownMeshes.push({ _endDiv: div });
    setTimeout(function () {
      if (div.parentNode) div.parentNode.removeChild(div);
    }, 6000);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     FLASH MESSAGES
  ═══════════════════════════════════════════════════════════════════════ */

  function _setFlash(msg, duration) {
    _flashText  = msg;
    _flashTimer = duration || 3;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     HUD
  ═══════════════════════════════════════════════════════════════════════ */

  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'wetlands-ambush-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,25,10,0.80)',
      'color:#33FF88',
      'font-family:monospace',
      'font-size:13px',
      'padding:7px 16px',
      'border:1px solid #00BB55',
      'border-radius:4px',
      'z-index:9999',
      'pointer-events:none',
      'white-space:nowrap',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_hud);
  }

  function _updateHUD() {
    if (!_hud) return;

    var gueriAlive  = 0;
    var eliteAlive  = 0;
    var flankAlive  = 0;
    var i;
    for (i = 0; i < _guerrillas.length; i++) { if (_guerrillas[i].alive) gueriAlive++; }
    for (i = 0; i < _elites.length;     i++) { if (_elites[i].alive)     eliteAlive++; }
    for (i = 0; i < _flankers.length;   i++) { if (_flankers[i].alive)   flankAlive++; }
    var totalEnemies = gueriAlive + eliteAlive + flankAlive + (_mantis && _mantis.alive ? 1 : 0);

    var agentStr  = _agentRescued
      ? (_agentExtracted ? '<span style="color:#00FF44">EXTRACTED</span>'
                         : '<span style="color:#FFAA00">ESCORTING (' + _agentHP + 'HP)</span>')
      : '<span style="color:#FF4444">IN CAGE</span>';

    var mantisStr = _mantisDefeated
      ? '<span style="color:#00FF44">DEFEATED</span>'
      : '<span style="color:#FF4444">ALIVE (' + (_mantis ? _mantis.hp : 0) + '/490HP)</span>';

    var boatStr   = _boatStopped
      ? '<span style="color:#00FF44">STOPPED</span>'
      : '<span style="color:#FF8800">MOVING (' + _boatMotorHP + '/3 MOTOR)</span>';

    var waterStr  = _inWater ? ' <span style="color:#88CCFF">[WADING-25%]</span>' : '';

    var flashLine = _flashTimer > 0
      ? '<br><span style="color:#FFFF44">' + _flashText + '</span>'
      : '';

    _hud.innerHTML =
      'WETLANDS AMBUSH' +
      ' | HP:' + _playerHP +
      waterStr +
      ' | ENEMIES:' + totalEnemies + '/22' +
      ' | AGENT:' + agentStr +
      ' | AGENT HP:' + _agentHP +
      ' | MANTIS:' + mantisStr +
      ' | BOAT:' + boatStr +
      flashLine;
  }

  function _removeHUD() {
    if (_hud && _hud.parentNode) {
      _hud.parentNode.removeChild(_hud);
    }
    _hud = null;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     INPUT HANDLERS
  ═══════════════════════════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    _keys[e.code] = true;

    var now = performance.now() / 1000;

    if (e.code === 'KeyW') { _wPressTime = now; }
    if (e.code === 'KeyA') {
      _aPressTime = now;
      if (_wPressTime > 0 && (now - _wPressTime) < WA_WINDOW && !_active && !_missionDone && !_missionFailed) {
        _activate();
      }
    }

    if (!_active) return;

    /* E — interact */
    if (e.code === 'KeyE') { _tryInteract(); }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
  }

  function _onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0) { _fireWeapon(); }
  }

  function _onMouseMove(e) {
    if (!_active) return;
    if (_mousePointerLocked) {
      _mouseDX += e.movementX || 0;
      _mouseDY += e.movementY || 0;
    }
  }

  function _onPointerLockChange() {
    _mousePointerLocked = (document.pointerLockElement === _canvas);
  }

  function _onSpaceKey(e) {
    if (!_active) return;
    if (e.code === 'Space') { _fireWeapon(); }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     INTERACT (E key)
  ═══════════════════════════════════════════════════════════════════════ */

  function _tryInteract() {
    if (!_playerPos) return;

    /* shoot cage lock if nearby */
    if (!_cageLockShot) {
      var dCage = _dist2(_playerPos, { x: -8, z: 3 });
      if (dCage < 4.5) {
        _shootCageLock();
        return;
      }
    }

    /* start escorting agent */
    if (_agentRescued && !_agentEscorting) {
      var dAgent = _dist2(_playerPos, _agentPos);
      if (dAgent < 3) {
        _agentEscorting = true;
        _setFlash('Agent now following you — lead to extraction zone (north)!', 4);
        return;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     ACTIVATE
  ═══════════════════════════════════════════════════════════════════════ */

  function _activate() {
    _active = true;

    if (_canvas) { _canvas.requestPointerLock(); }

    /* player start position — south approach */
    _playerPos = { x: 0, y: 0, z: -42 };

    /* build world & enemies */
    _buildWorld();
    _spawnEnemies();
    _buildHUD();

    _setFlash(
      'WETLANDS AMBUSH — Special Forces Op: destroy guerrilla camp, rescue agent, eliminate General Mantis',
      7
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PUBLIC: init
  ═══════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas || document.querySelector('canvas');

    document.addEventListener('keydown',           _onKeyDown);
    document.addEventListener('keyup',             _onKeyUp);
    document.addEventListener('mousedown',         _onMouseDown);
    document.addEventListener('mousemove',         _onMouseMove);
    document.addEventListener('pointerlockchange', _onPointerLockChange);
    document.addEventListener('keydown',           _onSpaceKey);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PUBLIC: update
  ═══════════════════════════════════════════════════════════════════════ */

  function update(dt) {
    if (!_active || _missionDone || _missionFailed) return;

    dt = Math.min(dt, 0.1);

    _updatePlayer(dt);
    _updateBoat(dt);
    _updateSearchlight(dt);
    _updateFireFlicker(dt);
    _updateGuerrillas(dt);
    _updateElites(dt);
    _updateFlankers(dt);
    _updateMantis(dt);
    _updateGrenades(dt);
    _updateAgent(dt);
    _checkWin();

    /* shoot cooldown */
    if (_shootCooldown > 0) { _shootCooldown -= dt; }

    /* flash timer */
    if (_flashTimer > 0) { _flashTimer -= dt; }

    _updateHUD();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PUBLIC: reset
  ═══════════════════════════════════════════════════════════════════════ */

  function reset() {
    _active        = false;
    _missionDone   = false;
    _missionFailed = false;

    /* remove owned meshes / DOM */
    var i, m;
    for (i = 0; i < _ownMeshes.length; i++) {
      m = _ownMeshes[i];
      if (m && m._endDiv) {
        if (m._endDiv.parentNode) m._endDiv.parentNode.removeChild(m._endDiv);
      } else if (m && _scene && m.parent === _scene) {
        _scene.remove(m);
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          if (Array.isArray(m.material)) {
            var j;
            for (j = 0; j < m.material.length; j++) m.material[j].dispose();
          } else {
            m.material.dispose();
          }
        }
      }
    }
    _ownMeshes = [];

    /* restore scene */
    if (_scene) {
      _scene.fog = _fogBackup;
      if (_bgColorBackup !== null && _bgColorBackup !== undefined) {
        _scene.background = new THREE.Color(_bgColorBackup);
      }
    }

    /* restore pointer lock */
    if (_mousePointerLocked && document.exitPointerLock) {
      document.exitPointerLock();
    }
    _mousePointerLocked = false;

    /* restore camera FOV if modified */
    if (_camera) {
      _camera.fov = 75;
      _camera.updateProjectionMatrix();
    }

    _removeHUD();

    /* reset all state */
    _playerPos         = null;
    _playerHP          = 100;
    _playerYaw         = 0;
    _playerPitch       = 0;
    _mouseDX           = 0;
    _mouseDY           = 0;
    _inWater           = false;
    _waterSoundTimer   = 0;
    _fogBackup         = null;
    _bgColorBackup     = null;
    _waterPlane        = null;
    _groundMesh        = null;
    _trees             = [];
    _campTents         = [];
    _campFires         = [];
    _supplyCrates      = [];
    _watchtowerMesh    = null;
    _searchlight       = null;
    _searchAngle       = 0;
    _cageMesh          = null;
    _cageLockMesh      = null;
    _cageLockShot      = false;
    _boatMesh          = null;
    _boatMotor         = null;
    _boatMotorHP       = 3;
    _boatStopped       = false;
    _boatAngle         = 0;
    _boatSpeed         = 2.5;
    _tunnelMarkers     = [];
    _extractionZone    = null;
    _agentHP           = 100;
    _agentRescued      = false;
    _agentEscorting    = false;
    _agentMesh         = null;
    _agentPos          = null;
    _agentExtracted    = false;
    _guerrillas        = [];
    _elites            = [];
    _mantis            = null;
    _mantisDefeated    = false;
    _grenades          = [];
    _flankers          = [];
    _shootCooldown     = 0;
    _flashText         = '';
    _flashTimer        = 0;
    _wPressTime        = 0;
    _aPressTime        = 0;
    _keys              = {};
    _fireFlickerTimer  = 0;
  }

  /* ── Public API ─────────────────────────────────────────────────────── */
  return { init: init, update: update, reset: reset };

}());
