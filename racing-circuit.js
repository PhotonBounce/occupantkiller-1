/* ───────────────────────────────────────────────────────────────────────────
   racing-circuit.js — Cartel Racing Circuit Infiltration Mini-Game
   API: window.RacingCircuit = { init, update, reset }

   Controls:
     R + C (within 400ms)    → activate racing circuit mode
     WASD                    → move player
     Mouse                   → look / aim
     Left-click / Space      → shoot
     E                       → rig car with explosives (when within 3 units)
     F                       → detonate all rigged cars (when all 4 rigged)

   Objective: Rig all 4 race cars with explosives, then detonate to eliminate
              the cartel boss and his crew in the VIP grandstand.
   ─────────────────────────────────────────────────────────────────────────── */
window.RacingCircuit = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation (R+C within 400ms) ────────────────────────────────────── */
  var _lastRTime   = 0;
  var _active      = false;

  /* ── Player state ──────────────────────────────────────────────────────── */
  var _playerPos   = null;   // THREE.Vector3
  var _playerHP    = 100;
  var _playerYaw   = 0;      // radians
  var _playerPitch = 0;
  var _keys        = {};
  var _mouseDown   = false;
  var _shootCooldown = 0;

  /* ── Mission state ─────────────────────────────────────────────────────── */
  var _carsRigged     = 0;
  var _detonated      = false;
  var _gameOver       = false;
  var _gameWon        = false;
  var _detonatePrompt = false;

  /* ── Race cars ─────────────────────────────────────────────────────────── */
  var _raceCars       = [];  // { mesh, pos, rigged, trackAngle, speed }

  /* ── Pit crew guards ───────────────────────────────────────────────────── */
  var _guards         = [];  // { mesh, pos, alive, patrolAngle, patrolRadius, patrolCenter, fireTimer }

  /* ── Bullets ───────────────────────────────────────────────────────────── */
  var _bullets        = [];  // { mesh, vel, life, damage }
  var _enemyBullets   = [];  // { mesh, vel, life }

  /* ── Explosions ────────────────────────────────────────────────────────── */
  var _explosions     = [];  // { mesh, light, life }

  /* ── All static scene meshes (for cleanup) ─────────────────────────────── */
  var _sceneMeshes    = [];

  /* ── DOM ───────────────────────────────────────────────────────────────── */
  var _hud            = null;
  var _msgEl          = null;
  var _crosshair      = null;
  var _endScreen      = null;

  /* ── Track parameters ──────────────────────────────────────────────────── */
  var TRACK_RX   = 55;   // track ellipse X radius
  var TRACK_RZ   = 35;   // track ellipse Z radius
  var TRACK_Y    = 0.1;  // track surface Y

  /* ════════════════════════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function addMesh(mesh) {
    _scene.add(mesh);
    _sceneMeshes.push(mesh);
    return mesh;
  }

  function box(w, h, d, color, x, y, z) {
    var geo  = new THREE.BoxGeometry(w, h, d);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function cyl(rt, rb, h, segs, color, x, y, z) {
    var geo  = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function sph(r, segs, color, x, y, z) {
    var geo  = new THREE.SphereGeometry(r, segs, segs);
    var mat  = new THREE.MeshBasicMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function cone(r, h, segs, color, x, y, z) {
    var geo  = new THREE.ConeGeometry(r, h, segs);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /* Ellipse position at angle */
  function trackPos(angle) {
    return {
      x: Math.cos(angle) * TRACK_RX,
      z: Math.sin(angle) * TRACK_RZ
    };
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD CIRCUIT
  ════════════════════════════════════════════════════════════════════════ */

  function buildCircuit() {

    /* ── Ground plane ─────────────────────────────────────────────────── */
    var ground = box(280, 0.4, 200, 0x3A4A2A, 0, -0.2, 0);
    addMesh(ground);

    /* ── Racing track surface (oval approximated with BoxGeometry segments) */
    /* Straight sections */
    addMesh(box(110, 0.3, 14, 0x444444, 0, TRACK_Y,  TRACK_RZ));   /* near straight */
    addMesh(box(110, 0.3, 14, 0x444444, 0, TRACK_Y, -TRACK_RZ));   /* far straight  */
    addMesh(box(14, 0.3, 70, 0x444444,  TRACK_RX, TRACK_Y, 0));    /* right hairpin */
    addMesh(box(14, 0.3, 70, 0x444444, -TRACK_RX, TRACK_Y, 0));    /* left hairpin  */

    /* Corner fill boxes */
    addMesh(box(30, 0.3, 30, 0x404040,  TRACK_RX - 10, TRACK_Y,  TRACK_RZ - 8));
    addMesh(box(30, 0.3, 30, 0x404040,  TRACK_RX - 10, TRACK_Y, -TRACK_RZ + 8));
    addMesh(box(30, 0.3, 30, 0x404040, -TRACK_RX + 10, TRACK_Y,  TRACK_RZ - 8));
    addMesh(box(30, 0.3, 30, 0x404040, -TRACK_RX + 10, TRACK_Y, -TRACK_RZ + 8));

    /* Track centre line (LineSegments) */
    var linePoints = [];
    var lineSegs = 64;
    for (var li = 0; li < lineSegs; li++) {
      var a1 = (li / lineSegs) * Math.PI * 2;
      var a2 = ((li + 1) / lineSegs) * Math.PI * 2;
      var p1 = trackPos(a1);
      var p2 = trackPos(a2);
      linePoints.push(p1.x, TRACK_Y + 0.05, p1.z, p2.x, TRACK_Y + 0.05, p2.z);
    }
    var lineBuf = new THREE.BufferGeometry();
    lineBuf.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));
    var lineSegsObj = new THREE.LineSegments(lineBuf, new THREE.LineBasicMaterial({ color: 0xFFFFFF }));
    addMesh(lineSegsObj);

    /* ── Starting line arch ───────────────────────────────────────────── */
    /* Left post */
    addMesh(box(1, 8, 1, 0xDDDDDD, -8, 4, TRACK_RZ));
    /* Right post */
    addMesh(box(1, 8, 1, 0xDDDDDD,  8, 4, TRACK_RZ));
    /* Top crossbar */
    addMesh(box(17, 1.5, 1, 0xCC2222, 0, 8.25, TRACK_RZ));
    /* Sign on arch */
    addMesh(box(9, 1.2, 0.3, 0x111111, 0, 8.2, TRACK_RZ - 0.5));
    /* Chequered flag strips */
    for (var cf = 0; cf < 4; cf++) {
      addMesh(box(2.2, 1.0, 0.2, cf % 2 === 0 ? 0xFFFFFF : 0x111111, -6.5 + cf * 4.5, 8.2, TRACK_RZ - 0.51));
    }

    /* ── Grandstand (VIP section) on right side ───────────────────────── */
    /* Back wall */
    addMesh(box(40, 1, 14, 0x886655, 80, 0.5, 0));
    /* Tier 1 — lowest */
    addMesh(box(40, 2, 6, 0x997766, 80, 1, -4));
    /* Tier 2 */
    addMesh(box(40, 2, 5, 0x997766, 80, 3.2, -1.5));
    /* Tier 3 */
    addMesh(box(40, 2, 5, 0x997766, 80, 5.4, 0.8));
    /* Tier 4 (VIP top) */
    addMesh(box(40, 2, 5, 0x997766, 80, 7.6, 3));
    /* VIP roof */
    addMesh(box(42, 0.5, 6, 0x554433, 80, 9.8, 3));
    /* Railing */
    addMesh(box(40, 0.5, 0.3, 0xCCCCCC, 80, 8.9, 6));
    /* Grandstand banner (cartel colors) */
    addMesh(box(38, 3, 0.2, 0xAA1111, 80, 6, -7));
    /* Grandstand support columns */
    for (var gc = 0; gc < 5; gc++) {
      addMesh(cyl(0.5, 0.5, 10, 8, 0x665544, 60 + gc * 10, 5, -8));
    }
    /* VIP box (cartel boss area) */
    addMesh(box(8, 3, 5, 0x663311, 80, 9, 6));
    addMesh(box(7.5, 0.3, 4.5, 0x552200, 80, 10.6, 6));

    /* ── Pit lane (infield) ───────────────────────────────────────────── */
    addMesh(box(80, 0.3, 10, 0x333333, 0, TRACK_Y, -TRACK_RZ + 22));

    /* ── Pit crew stations (6 bays) ───────────────────────────────────── */
    var pitColors = [0x223388, 0x882222, 0x228833, 0xAA6600, 0x663399, 0x118888];
    for (var pi = 0; pi < 6; pi++) {
      var px = -37.5 + pi * 15;
      var pz = -TRACK_RZ + 22;
      /* Pit wall */
      addMesh(box(12, 2, 0.5, pitColors[pi], px, 1, pz - 5));
      /* Equipment box */
      addMesh(box(2, 1.5, 2, 0x555555, px - 4, 0.75, pz - 3.5));
      /* Tire stack */
      addMesh(cyl(0.6, 0.6, 0.5, 8, 0x222222, px + 3, 0.25, pz - 3.5));
      addMesh(cyl(0.6, 0.6, 0.5, 8, 0x222222, px + 3, 0.75, pz - 3.5));
      addMesh(cyl(0.6, 0.6, 0.5, 8, 0x222222, px + 3, 1.25, pz - 3.5));
      /* Pit canopy */
      addMesh(box(12, 0.3, 6, pitColors[pi], px, 3.5, pz - 2.5));
    }

    /* ── Fuel depot (infield, far side) ──────────────────────────────── */
    /* Fuel storage building */
    addMesh(box(20, 6, 12, 0x556655, -35, 3, -22));
    addMesh(box(22, 0.5, 14, 0x445544, -35, 6.25, -22));
    /* Fuel drums — 8 drums */
    var drumColors = [0xFF4400, 0xFF4400, 0xFF4400, 0xFF4400, 0xFFAA00, 0xFFAA00, 0xCC2200, 0xCC2200];
    var drumOffsets = [[-30, -18], [-27, -18], [-30, -21], [-27, -21],
                       [-33, -18], [-36, -18], [-33, -21], [-36, -21]];
    for (var di = 0; di < 8; di++) {
      addMesh(cyl(0.65, 0.65, 1.8, 10, drumColors[di], drumOffsets[di][0], 0.9, drumOffsets[di][1]));
      /* Drum top ring */
      addMesh(cyl(0.66, 0.66, 0.1, 10, 0x222222, drumOffsets[di][0], 1.85, drumOffsets[di][1]));
    }
    /* Fuel pump station */
    addMesh(box(2, 3, 1, 0x334433, -20, 1.5, -20));
    addMesh(box(1.5, 0.5, 0.8, 0x446644, -20, 3.25, -20));

    /* ── Tire barriers around track ───────────────────────────────────── */
    var barrierData = [
      /* along straights */
      [-50, TRACK_RZ + 8], [-25, TRACK_RZ + 8], [0, TRACK_RZ + 8], [25, TRACK_RZ + 8], [50, TRACK_RZ + 8],
      [-50, -TRACK_RZ - 8], [-25, -TRACK_RZ - 8], [0, -TRACK_RZ - 8], [25, -TRACK_RZ - 8], [50, -TRACK_RZ - 8],
      /* hairpin ends */
      [TRACK_RX + 9, 15], [TRACK_RX + 9, 0], [TRACK_RX + 9, -15],
      [-TRACK_RX - 9, 15], [-TRACK_RX - 9, 0], [-TRACK_RX - 9, -15]
    ];
    for (var bri = 0; bri < barrierData.length; bri++) {
      var brx = barrierData[bri][0];
      var brz = barrierData[bri][1];
      /* Stack of 3 tires */
      addMesh(cyl(0.7, 0.7, 0.6, 8, 0x1A1A1A, brx, 0.3, brz));
      addMesh(cyl(0.7, 0.7, 0.6, 8, 0x1A1A1A, brx, 0.9, brz));
      addMesh(cyl(0.7, 0.7, 0.6, 8, 0x1A1A1A, brx, 1.5, brz));
    }

    /* ── Trackside signage / walls ────────────────────────────────────── */
    /* Advertising boards */
    addMesh(box(12, 3, 0.4, 0xCC1111, -20, 1.5, TRACK_RZ + 12));
    addMesh(box(12, 3, 0.4, 0x1111CC, 20,  1.5, TRACK_RZ + 12));
    addMesh(box(12, 3, 0.4, 0xCC9900, -20, 1.5, -TRACK_RZ - 12));
    addMesh(box(12, 3, 0.4, 0x009933, 20,  1.5, -TRACK_RZ - 12));
    /* Perimeter outer wall */
    addMesh(box(200, 2, 0.8, 0x888888, 0, 1, 80));
    addMesh(box(200, 2, 0.8, 0x888888, 0, 1, -80));
    addMesh(box(0.8, 2, 160, 0x888888, 100, 1, 0));
    addMesh(box(0.8, 2, 160, 0x888888, -100, 1, 0));

    /* ── Floodlight poles ─────────────────────────────────────────────── */
    var poleData = [
      [-55, -45], [0, -45], [55, -45],
      [-55,  45], [0,  45], [55,  45]
    ];
    for (var fli = 0; fli < poleData.length; fli++) {
      var flx = poleData[fli][0];
      var flz = poleData[fli][1];
      /* Pole */
      addMesh(cyl(0.3, 0.3, 18, 6, 0x666666, flx, 9, flz));
      /* Light housing */
      addMesh(box(3, 0.8, 1.2, 0xEEEECC, flx, 18.2, flz));
      /* Point light for atmosphere */
      var fl = new THREE.PointLight(0xFFEECC, 0.8, 40);
      fl.position.set(flx, 18, flz);
      addMesh(fl);
    }

    /* ── Ambient and directional lights ───────────────────────────────── */
    var ambient = new THREE.AmbientLight(0x445566, 0.5);
    addMesh(ambient);
    var sun = new THREE.DirectionalLight(0xFFDD88, 1.1);
    sun.position.set(60, 100, 40);
    addMesh(sun);
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD RACE CARS (moving targets)
  ════════════════════════════════════════════════════════════════════════ */

  function buildRaceCars() {
    _raceCars = [];

    var carColors = [0xCC2222, 0x2244CC, 0x22AA22, 0xEEAA00];
    var startAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
    var carSpeeds   = [0.55, 0.48, 0.60, 0.52];

    for (var ci = 0; ci < 4; ci++) {
      var angle = startAngles[ci];
      var tp    = trackPos(angle);

      /* Car body */
      var carGroup = new THREE.Group();

      /* Main body */
      var body = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.7, 4.2),
        new THREE.MeshLambertMaterial({ color: carColors[ci] })
      );
      body.position.y = 0.55;
      carGroup.add(body);

      /* Cockpit */
      var cockpit = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.5, 1.8),
        new THREE.MeshLambertMaterial({ color: carColors[ci] })
      );
      cockpit.position.set(0, 1.05, -0.2);
      carGroup.add(cockpit);

      /* Front wing */
      var frontWing = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.12, 0.6),
        new THREE.MeshLambertMaterial({ color: 0x222222 })
      );
      frontWing.position.set(0, 0.4, 2.2);
      carGroup.add(frontWing);

      /* Rear wing */
      var rearWing = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.12, 0.5),
        new THREE.MeshLambertMaterial({ color: 0x222222 })
      );
      rearWing.position.set(0, 1.1, -2.0);
      carGroup.add(rearWing);

      /* Wheels (4) */
      var wheelPositions = [
        [ 1.1, 0.35,  1.4],
        [-1.1, 0.35,  1.4],
        [ 1.1, 0.35, -1.4],
        [-1.1, 0.35, -1.4]
      ];
      for (var wi = 0; wi < 4; wi++) {
        var wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.35, 0.3, 8),
          new THREE.MeshLambertMaterial({ color: 0x1A1A1A })
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wheelPositions[wi][0], wheelPositions[wi][1], wheelPositions[wi][2]);
        carGroup.add(wheel);
      }

      /* Rigged indicator (red glow sphere — hidden initially) */
      var rigSph = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xFF2222, transparent: true, opacity: 0 })
      );
      rigSph.position.set(0, 1.6, 0);
      carGroup.add(rigSph);

      carGroup.position.set(tp.x, 0, tp.z);
      _scene.add(carGroup);

      _raceCars.push({
        mesh:        carGroup,
        rigMarker:   rigSph,
        pos:         new THREE.Vector3(tp.x, 0, tp.z),
        trackAngle:  angle,
        speed:       carSpeeds[ci],
        rigged:      false,
        number:      ci + 1
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD GUARDS (pit crew patrol)
  ════════════════════════════════════════════════════════════════════════ */

  function buildGuards() {
    _guards = [];

    /* 8 pit lane guards, patrolling the pit lane and fuel depot */
    var guardData = [
      /* pit lane guards */
      { x: -37, z: -TRACK_RZ + 22, pr: 6  },
      { x: -22, z: -TRACK_RZ + 22, pr: 5  },
      { x: -7,  z: -TRACK_RZ + 22, pr: 7  },
      { x: 8,   z: -TRACK_RZ + 22, pr: 6  },
      { x: 23,  z: -TRACK_RZ + 22, pr: 5  },
      { x: 38,  z: -TRACK_RZ + 22, pr: 6  },
      /* fuel depot guards */
      { x: -30, z: -24,             pr: 8  },
      { x: -40, z: -18,             pr: 7  }
    ];

    for (var gi = 0; gi < guardData.length; gi++) {
      var gd  = guardData[gi];
      var grp = buildGuardMesh();
      grp.position.set(gd.x, 0, gd.z);
      _scene.add(grp);
      _guards.push({
        mesh:         grp,
        pos:          new THREE.Vector3(gd.x, 0, gd.z),
        alive:        true,
        fireTimer:    1.0 + Math.random() * 2.0,
        patrolAngle:  Math.random() * Math.PI * 2,
        patrolRadius: gd.pr,
        patrolCenter: new THREE.Vector3(gd.x, 0, gd.z)
      });
    }
  }

  function buildGuardMesh() {
    var grp = new THREE.Group();
    /* Body */
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 1.1, 0.45),
      new THREE.MeshLambertMaterial({ color: 0x334455 })
    );
    body.position.y = 1.55;
    grp.add(body);
    /* Head */
    var head = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.55, 0.55),
      new THREE.MeshLambertMaterial({ color: 0x8B6A50 })
    );
    head.position.y = 2.38;
    grp.add(head);
    /* Helmet */
    var helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 7, 7),
      new THREE.MeshLambertMaterial({ color: 0xFF4400 })
    );
    helmet.position.y = 2.58;
    grp.add(helmet);
    /* Gun */
    var gun = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.75),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    gun.position.set(0.45, 1.55, -0.4);
    grp.add(gun);
    return grp;
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD / DOM
  ════════════════════════════════════════════════════════════════════════ */

  function buildDOM() {
    _hud = document.createElement('div');
    _hud.id = 'rc-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FFDD22',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'background:rgba(0,0,0,0.65)',
      'padding:6px 16px',
      'border-radius:4px',
      'pointer-events:none',
      'display:none',
      'z-index:900',
      'letter-spacing:1px',
      'white-space:nowrap',
      'border:1px solid #AA3300'
    ].join(';');
    document.body.appendChild(_hud);

    _msgEl = document.createElement('div');
    _msgEl.id = 'rc-msg';
    _msgEl.style.cssText = [
      'position:fixed',
      'top:56px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FF6622',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'background:rgba(0,0,0,0.55)',
      'padding:4px 14px',
      'border-radius:3px',
      'pointer-events:none',
      'display:none',
      'z-index:901'
    ].join(';');
    document.body.appendChild(_msgEl);

    _crosshair = document.createElement('div');
    _crosshair.id = 'rc-crosshair';
    _crosshair.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:16px',
      'height:16px',
      'pointer-events:none',
      'display:none',
      'z-index:902'
    ].join(';');
    _crosshair.innerHTML =
      '<div style="position:absolute;top:50%;left:0;right:0;height:2px;background:#FF6622;margin-top:-1px"></div>' +
      '<div style="position:absolute;left:50%;top:0;bottom:0;width:2px;background:#FF6622;margin-left:-1px"></div>';
    document.body.appendChild(_crosshair);

    _endScreen = document.createElement('div');
    _endScreen.id = 'rc-end';
    _endScreen.style.cssText = [
      'position:fixed',
      'top:40%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#FFDD22',
      'font-family:monospace',
      'font-size:26px',
      'font-weight:bold',
      'text-align:center',
      'background:rgba(0,0,0,0.85)',
      'padding:24px 40px',
      'border-radius:8px',
      'pointer-events:none',
      'display:none',
      'z-index:903',
      'border:2px solid #AA3300'
    ].join(';');
    document.body.appendChild(_endScreen);
  }

  function updateHUD() {
    if (!_hud || !_active) return;
    var aliveGuards = 0;
    for (var gi = 0; gi < _guards.length; gi++) {
      if (_guards[gi].alive) aliveGuards++;
    }
    var rigStr = 'CARS RIGGED: ' + _carsRigged + '/4';
    var detStr = (_carsRigged >= 4 && !_detonated) ? '  |  DETONATE? [F]' : '';
    _hud.textContent =
      'CARTEL CIRCUIT INFILTRATION' +
      '  |  ' + rigStr +
      detStr +
      '  |  GUARDS: ' + aliveGuards +
      '  |  HP: ' + _playerHP;
  }

  function showMsg(text, duration) {
    if (!_msgEl) return;
    _msgEl.textContent = text;
    _msgEl.style.display = 'block';
    if (_msgEl._hideTimer) clearTimeout(_msgEl._hideTimer);
    if (duration) {
      _msgEl._hideTimer = setTimeout(function () {
        if (_msgEl) _msgEl.style.display = 'none';
      }, duration * 1000);
    }
  }

  function hideMsg() {
    if (_msgEl) {
      _msgEl.style.display = 'none';
      if (_msgEl._hideTimer) { clearTimeout(_msgEl._hideTimer); _msgEl._hideTimer = null; }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     LAUNCH
  ════════════════════════════════════════════════════════════════════════ */

  function launchCircuit() {
    if (_active) return;
    _active       = true;
    _playerHP     = 100;
    _playerYaw    = 0;
    _playerPitch  = 0;
    _carsRigged   = 0;
    _detonated    = false;
    _detonatePrompt = false;
    _gameOver     = false;
    _gameWon      = false;
    _bullets      = [];
    _enemyBullets = [];
    _explosions   = [];
    _sceneMeshes  = [];
    _shootCooldown = 0;

    /* Start position: inside the circuit near pit lane entrance */
    _playerPos = new THREE.Vector3(0, 1.7, -TRACK_RZ + 30);

    buildCircuit();
    buildRaceCars();
    buildGuards();

    if (_hud)       _hud.style.display      = 'block';
    if (_crosshair) _crosshair.style.display = 'block';
    if (_endScreen) _endScreen.style.display = 'none';

    _camera.position.copy(_playerPos);
    _camera.rotation.set(0, 0, 0);

    showMsg('CIRCUIT INFILTRATED — RIG ALL 4 RACE CARS WITH EXPLOSIVES [E when within 3 units]', 6);
  }

  /* ════════════════════════════════════════════════════════════════════════
     RIG CAR
  ════════════════════════════════════════════════════════════════════════ */

  function tryRigNearestCar() {
    if (!_active || _gameOver || _gameWon) return;
    for (var ci = 0; ci < _raceCars.length; ci++) {
      var car = _raceCars[ci];
      if (car.rigged) continue;
      var dist = _playerPos.distanceTo(car.pos);
      if (dist <= 3.0) {
        car.rigged = true;
        _carsRigged++;
        /* Show rig indicator */
        car.rigMarker.material.opacity = 0.9;
        /* Mini flash */
        spawnExplosion(car.pos.clone().setY(0.6), 0.3, 0xFF4400, 4);
        showMsg('CAR #' + car.number + ' RIGGED! (' + _carsRigged + '/4)', 2.5);
        if (_carsRigged >= 4) {
          _detonatePrompt = true;
          showMsg('ALL CARS RIGGED — PRESS F TO DETONATE!', 0);
        }
        return;
      }
    }
    showMsg('No car within range (need within 3 units)', 2);
  }

  /* ════════════════════════════════════════════════════════════════════════
     DETONATE
  ════════════════════════════════════════════════════════════════════════ */

  function detonateAllCars() {
    if (!_active || _gameOver || _gameWon || _detonated) return;
    if (_carsRigged < 4) {
      showMsg('Not all cars rigged yet! (' + _carsRigged + '/4)', 2);
      return;
    }
    _detonated = true;
    hideMsg();

    /* Explosions at each car */
    for (var ci = 0; ci < _raceCars.length; ci++) {
      var car = _raceCars[ci];
      var pos = car.pos.clone();
      /* Staggered detonation */
      (function (p, delay) {
        setTimeout(function () {
          if (!_scene) return;
          spawnExplosion(p.clone().setY(0.5), 1.4, 0xFF4400, 14);
          spawnExplosion(p.clone().setY(1.5), 0.8, 0xFFAA00, 10);
          spawnExplosion(p.clone().setY(0.8), 0.5, 0xFFFF88, 8);
        }, delay);
      }(pos, ci * 350));
    }

    /* Big grandstand explosion (cartel boss KIA) */
    setTimeout(function () {
      if (!_scene) return;
      var grandPos = new THREE.Vector3(80, 5, 3);
      spawnExplosion(grandPos.clone(), 2.5, 0xFF2200, 20);
      spawnExplosion(grandPos.clone().setY(8), 1.8, 0xFFAA00, 16);
      spawnExplosion(grandPos.clone().setX(90), 1.2, 0xFF4400, 12);
      spawnExplosion(grandPos.clone().setX(70), 1.2, 0xFF4400, 12);
      showMsg('CARTEL BOSS ELIMINATED — MISSION COMPLETE!', 0);
    }, 4 * 350 + 600);

    /* Trigger win after explosions settle */
    setTimeout(function () {
      triggerWin();
    }, 4 * 350 + 2500);
  }

  /* ════════════════════════════════════════════════════════════════════════
     SHOOTING
  ════════════════════════════════════════════════════════════════════════ */

  function shoot() {
    if (!_active || _gameOver || _gameWon) return;
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(_playerPitch, _playerYaw, 0, 'YXZ'));
    var geo = new THREE.SphereGeometry(0.07, 4, 4);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFFFF44 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(_playerPos);
    mesh.position.y += 0.2;
    _scene.add(mesh);
    _bullets.push({
      mesh:   mesh,
      vel:    dir.multiplyScalar(85),
      life:   2.5,
      damage: 30
    });
  }

  function updateBullets(dt) {
    for (var bi = _bullets.length - 1; bi >= 0; bi--) {
      var b = _bullets[bi];
      b.life -= dt;
      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _bullets.splice(bi, 1);
        continue;
      }
      b.mesh.position.addScaledVector(b.vel, dt);

      /* Check hits against guards */
      var hit = false;
      for (var gi = 0; gi < _guards.length; gi++) {
        var g = _guards[gi];
        if (!g.alive) continue;
        if (b.mesh.position.distanceTo(g.pos) < 1.1) {
          spawnExplosion(g.pos.clone().setY(1.2), 0.25, 0xFF2200, 3);
          g.alive = false;
          _scene.remove(g.mesh);
          _scene.remove(b.mesh);
          _bullets.splice(bi, 1);
          hit = true;
          break;
        }
      }
      if (hit) continue;
    }
  }

  function guardFire(g) {
    var dir = new THREE.Vector3().subVectors(_playerPos, g.pos);
    dir.x += (Math.random() - 0.5) * 5;
    dir.y += (Math.random() - 0.5) * 2;
    dir.z += (Math.random() - 0.5) * 5;
    dir.normalize().multiplyScalar(40);

    var geo  = new THREE.SphereGeometry(0.06, 4, 4);
    var mat  = new THREE.MeshBasicMaterial({ color: 0xFF6600 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(g.pos);
    mesh.position.y += 1.6;
    _scene.add(mesh);
    _enemyBullets.push({ mesh: mesh, vel: dir, life: 2.0 });
  }

  function updateEnemyBullets(dt) {
    for (var bi = _enemyBullets.length - 1; bi >= 0; bi--) {
      var b = _enemyBullets[bi];
      b.life -= dt;
      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _enemyBullets.splice(bi, 1);
        continue;
      }
      b.mesh.position.addScaledVector(b.vel, dt);
      if (b.mesh.position.distanceTo(_playerPos) < 0.9) {
        _playerHP -= 12;
        _scene.remove(b.mesh);
        _enemyBullets.splice(bi, 1);
        if (_playerHP <= 0 && !_gameOver && !_gameWon) {
          triggerLose('YOU WERE ELIMINATED — MISSION FAILED');
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     GUARD AI
  ════════════════════════════════════════════════════════════════════════ */

  function updateGuards(dt) {
    for (var gi = 0; gi < _guards.length; gi++) {
      var g = _guards[gi];
      if (!g.alive) continue;

      var distToPlayer = g.pos.distanceTo(_playerPos);

      if (distToPlayer < 50) {
        /* Chase player if within engagement range */
        var toPlayer = new THREE.Vector3().subVectors(_playerPos, g.pos);
        toPlayer.y = 0;
        var d = toPlayer.length();
        if (d > 6) {
          toPlayer.normalize().multiplyScalar(3.0 * dt);
          g.pos.add(toPlayer);
          g.mesh.position.copy(g.pos);
          g.mesh.lookAt(_playerPos.x, g.pos.y, _playerPos.z);
        }
        /* Fire at player */
        g.fireTimer -= dt;
        if (g.fireTimer <= 0 && d < 35) {
          guardFire(g);
          g.fireTimer = 1.4 + Math.random() * 1.2;
        }
      } else {
        /* Patrol */
        g.patrolAngle += dt * 0.45;
        g.pos.x = g.patrolCenter.x + Math.cos(g.patrolAngle) * g.patrolRadius;
        g.pos.z = g.patrolCenter.z + Math.sin(g.patrolAngle) * g.patrolRadius;
        g.mesh.position.copy(g.pos);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     RACE CARS MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function updateRaceCars(dt) {
    for (var ci = 0; ci < _raceCars.length; ci++) {
      var car = _raceCars[ci];
      if (_detonated) break;

      car.trackAngle += car.speed * dt;
      if (car.trackAngle > Math.PI * 2) car.trackAngle -= Math.PI * 2;

      var tp  = trackPos(car.trackAngle);
      var tp2 = trackPos(car.trackAngle + 0.01);

      car.pos.set(tp.x, 0, tp.z);
      car.mesh.position.set(tp.x, 0, tp.z);

      /* Orient car to track tangent */
      var dx = tp2.x - tp.x;
      var dz = tp2.z - tp.z;
      car.mesh.rotation.y = -Math.atan2(dx, dz);

      /* Proximity rig hint */
      if (!car.rigged && _playerPos.distanceTo(car.pos) <= 3.5) {
        showMsg('Press E to rig Car #' + car.number + ' with explosives');
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     EXPLOSIONS
  ════════════════════════════════════════════════════════════════════════ */

  function spawnExplosion(pos, scale, color, intensity) {
    var geo  = new THREE.SphereGeometry(scale * 2, 8, 8);
    var mat  = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.9 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    _scene.add(mesh);
    var lt = new THREE.PointLight(color, intensity, scale * 18);
    lt.position.copy(pos);
    _scene.add(lt);
    _explosions.push({ mesh: mesh, light: lt, life: 1.0 });
  }

  function updateExplosions(dt) {
    for (var ei = _explosions.length - 1; ei >= 0; ei--) {
      var ex = _explosions[ei];
      ex.life -= dt * 1.4;
      if (ex.life <= 0) {
        _scene.remove(ex.mesh);
        _scene.remove(ex.light);
        _explosions.splice(ei, 1);
        continue;
      }
      ex.mesh.material.opacity = ex.life * 0.9;
      ex.light.intensity       = ex.light.intensity * ex.life;
      ex.mesh.scale.setScalar(1 + (1 - ex.life) * 0.9);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function updatePlayer(dt) {
    if (!_active || _gameOver || _gameWon) return;

    var speed = 10 * dt;
    var fwd   = new THREE.Vector3(-Math.sin(_playerYaw), 0, -Math.cos(_playerYaw));
    var right = new THREE.Vector3(Math.cos(_playerYaw), 0, -Math.sin(_playerYaw));

    if (_keys['w'] || _keys['W']) _playerPos.addScaledVector(fwd, speed);
    if (_keys['s'] || _keys['S']) _playerPos.addScaledVector(fwd, -speed);
    if (_keys['a'] || _keys['A']) _playerPos.addScaledVector(right, -speed);
    if (_keys['d'] || _keys['D']) _playerPos.addScaledVector(right,  speed);

    _playerPos.y = 1.7;
    _playerPos.x = Math.max(-98, Math.min(98, _playerPos.x));
    _playerPos.z = Math.max(-78, Math.min(78, _playerPos.z));

    _camera.position.copy(_playerPos);
    _camera.position.y = _playerPos.y + 0.25;
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _playerYaw;
    _camera.rotation.x = _playerPitch;

    /* Shooting */
    _shootCooldown -= dt;
    if ((_mouseDown || _keys[' ']) && _shootCooldown <= 0) {
      shoot();
      _shootCooldown = 0.13;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     WIN / LOSE
  ════════════════════════════════════════════════════════════════════════ */

  function triggerWin() {
    if (_gameWon || _gameOver) return;
    _gameWon = true;
    _active  = false;
    var aliveGuards = 0;
    for (var gi = 0; gi < _guards.length; gi++) { if (_guards[gi].alive) aliveGuards++; }
    _endScreen.style.color = '#FFDD22';
    _endScreen.innerHTML =
      'MISSION COMPLETE<br>' +
      '<span style="font-size:15px">' +
      'All 4 race cars detonated<br>' +
      'Cartel boss eliminated in VIP grandstand<br>' +
      'Guards remaining: ' + aliveGuards +
      '</span>';
    _endScreen.style.display = 'block';
  }

  function triggerLose(reason) {
    if (_gameOver || _gameWon) return;
    _gameOver = true;
    _active   = false;
    _endScreen.style.color = '#FF4444';
    _endScreen.innerHTML =
      reason + '<br>' +
      '<span style="font-size:15px">' +
      'Cars rigged: ' + _carsRigged + '/4' +
      '</span>';
    _endScreen.style.display = 'block';
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    _keys[e.key] = true;

    /* R key — start the R+C activation sequence */
    if (e.key === 'r' || e.key === 'R') {
      _lastRTime = Date.now();
    }

    /* C key — if R was pressed recently, activate */
    if (e.key === 'c' || e.key === 'C') {
      var now = Date.now();
      if (now - _lastRTime < 400) {
        if (_active) {
          reset();
          showMsg('RACING CIRCUIT MODE OFF', 2);
        } else {
          launchCircuit();
        }
      }
    }

    if (!_active || _gameOver || _gameWon) return;

    /* E — rig car */
    if (e.key === 'e' || e.key === 'E') {
      tryRigNearestCar();
    }

    /* F — detonate */
    if (e.key === 'f' || e.key === 'F') {
      detonateAllCars();
    }

    if (e.key === ' ') {
      e.preventDefault();
    }
  }

  function onKeyUp(e) {
    _keys[e.key] = false;
  }

  function onMouseMove(e) {
    if (!_active || !_canvas) return;
    var dx = e.movementX || 0;
    var dy = e.movementY || 0;
    _playerYaw   -= dx * 0.002;
    _playerPitch -= dy * 0.002;
    _playerPitch  = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, _playerPitch));
  }

  function onMouseDown(e) {
    if (e.button === 0) _mouseDown = true;
    if (_canvas && _active) _canvas.requestPointerLock();
  }

  function onMouseUp(e) {
    if (e.button === 0) _mouseDown = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas || document.querySelector('canvas');

    buildDOM();

    document.addEventListener('keydown',   onKeyDown);
    document.addEventListener('keyup',     onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup',   onMouseUp);
  }

  function update(delta) {
    if (!_scene) return;
    var dt = delta || 0.016;

    if (!_active) return;

    updatePlayer(dt);
    updateRaceCars(dt);
    updateGuards(dt);
    updateBullets(dt);
    updateEnemyBullets(dt);
    updateExplosions(dt);
    updateHUD();
  }

  function reset() {
    _active   = false;
    _gameOver = false;
    _gameWon  = false;

    /* Remove static scene meshes */
    for (var mi = 0; mi < _sceneMeshes.length; mi++) {
      if (_scene) _scene.remove(_sceneMeshes[mi]);
    }
    _sceneMeshes = [];

    /* Remove race cars */
    for (var ci = 0; ci < _raceCars.length; ci++) {
      if (_scene && _raceCars[ci].mesh) _scene.remove(_raceCars[ci].mesh);
    }
    _raceCars = [];

    /* Remove guards */
    for (var gi = 0; gi < _guards.length; gi++) {
      if (_scene && _guards[gi].mesh) _scene.remove(_guards[gi].mesh);
    }
    _guards = [];

    /* Remove bullets */
    for (var bi = 0; bi < _bullets.length; bi++) {
      if (_scene) _scene.remove(_bullets[bi].mesh);
    }
    _bullets = [];
    for (var ebi = 0; ebi < _enemyBullets.length; ebi++) {
      if (_scene) _scene.remove(_enemyBullets[ebi].mesh);
    }
    _enemyBullets = [];

    /* Remove explosions */
    for (var ei = 0; ei < _explosions.length; ei++) {
      if (_scene) {
        _scene.remove(_explosions[ei].mesh);
        _scene.remove(_explosions[ei].light);
      }
    }
    _explosions = [];

    /* DOM */
    if (_hud)       _hud.style.display       = 'none';
    if (_crosshair) _crosshair.style.display  = 'none';
    if (_endScreen) _endScreen.style.display  = 'none';
    hideMsg();

    if (document.exitPointerLock) document.exitPointerLock();

    _keys         = {};
    _mouseDown    = false;
    _playerPos    = null;
    _carsRigged   = 0;
    _detonated    = false;
    _shootCooldown = 0;
  }

  return { init: init, update: update, reset: reset };

}());
