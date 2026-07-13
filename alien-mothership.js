/* ───────────────────────────────────────────────────────────────────────────
   alien-mothership.js — Alien Mothership Interior
   API: window.AlienMothership = { init, update, reset }
   Activation: A + M simultaneous keypress (both keys within 400ms)

   Ship Interior:
     Central corridor  BoxGeometry 6x4x60  (0x112233)  bioluminescent PointLight 0x0044FF
     4 side chambers   BoxGeometry 15x5x12 (0x111122)
     Organic wall lumps SphereGeometry     (0x223344)
     Zero-G sections — gravity=0, Q/E for up/down

   Alien Crew:
     12 Greys   BoxGeometry 0.8x1.4x0.6 (0x44AA88) — psionic stun (cone LineSegments
                r=8u, locks player movement 3s)
     3 Warriors CylinderGeometry         (0x226644) 200HP — plasma lance melee

   Hive Mind:
     Killing 6 aliens triggers hive alert — all remaining aliens swarm player;
     self-destruct countdown 4 minutes begins

   Power Cores:
     4 CylinderGeometry r=1 h=2 (0x00AAFF emissive) in engine room
     Plant explosive: E key, 4s each; all 4 destroyed = ship destroyed

   Alien Tech Pickups:
     Plasma Rifle BoxGeometry (0x00FF88) in armory — fires SphereGeometry 0x00FFAA 60 dmg
     Shield Generator BoxGeometry (0x0044FF) — 50% damage reduction 30s

   Teleportation Traps:
     6 BoxGeometry platforms (0x112244 glowing) — step on = teleport random corridor;
     disarm with E 3s

   Escape Pod:
     CylinderGeometry (0x223344) in docking bay; reach after cores destroyed; E to launch

   Specimen Lab:
     8 human captives BoxGeometry (0xFFDDCC) in stasis pods CylinderGeometry (0x113344)
     E to free each — freed humans fight aliens (punch), +100 bonus score each

   HUD:
     MOTHERSHIP [CORES: N/4] [ALIENS: N] [SELF-DESTRUCT: MM:SS] [HUMANS FREED: N/8]
     | ESCAPE POD: DOCKING BAY
   ─────────────────────────────────────────────────────────────────────────── */

window.AlienMothership = (function () {
  'use strict';

  /* ── Activation combo ──────────────────────────────────────────────────── */
  var AM_WINDOW = 400;
  var _amPressTime = { A: 0, M: 0 };

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active         = false;
  var _lastTime       = 0;
  var _gameOver       = false;
  var _escaped        = false;
  var _shipDestroyed  = false;

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _playerMesh    = null;
  var _playerPos     = { x: 0, y: 1.5, z: 20 };
  var _playerVel     = { x: 0, y: 0, z: 0 };
  var _playerHP      = 100;
  var _playerMaxHP   = 100;
  var _playerSpeed   = 8;
  var _yaw           = 0;

  /* Zero-G state */
  var _inZeroG       = false;    /* true when in zero-g corridor section */
  var _zeroGSections = [];       /* {zMin, zMax} */

  /* Stun */
  var _stunTimer     = 0;        /* seconds remaining locked */

  /* Shield */
  var _shieldActive  = false;
  var _shieldTimer   = 0;

  /* Has plasma rifle */
  var _hasPlasmaRifle = false;
  var _fireCooldown   = 0;
  var _mouseDown      = false;

  /* ── Input ─────────────────────────────────────────────────────────────── */
  var _keys = {};

  /* ── Environment objects ───────────────────────────────────────────────── */
  var _envObjects = [];    /* all static meshes + lights to remove on reset */
  var _lights     = [];

  /* ── Aliens ────────────────────────────────────────────────────────────── */
  var _aliens     = [];
  /* { mesh, type:'grey'|'warrior', hp, maxHp, alive, vel, fireTimer,
       psionicTimer, light } */
  var _aliensKilled    = 0;
  var _hiveAlerted     = false;
  var _selfDestructActive = false;
  var _selfDestructTimer  = 240; /* 4 minutes */

  /* ── Projectiles ───────────────────────────────────────────────────────── */
  var _playerShots = []; /* { mesh, vel, life } */
  var _alienShots  = []; /* { mesh, vel, life, damage } */

  /* Psionic cones (LineSegments) ─────────────────────────────────────────── */
  var _psionicCones = []; /* { mesh, life, alien } */

  /* ── Power cores ───────────────────────────────────────────────────────── */
  var _cores = [];
  /* { mesh, light, alive, plantingTimer, planted, explodeTimer } */
  var _coresDestroyed = 0;

  /* ── Teleport traps ────────────────────────────────────────────────────── */
  var _teleTraps = [];
  /* { mesh, light, alive, disarmTimer, disarmed } */

  /* ── Pickups ───────────────────────────────────────────────────────────── */
  var _pickups = [];
  /* { mesh, type:'plasmaRifle'|'shield', pos, collected } */

  /* ── Escape pod ────────────────────────────────────────────────────────── */
  var _escapePod      = null;
  var _escapePodPos   = { x: 0, y: 1, z: -28 };
  var _launchingPod   = false;
  var _launchTimer    = 0;

  /* ── Human captives ─────────────────────────────────────────────────────── */
  var _humans = [];
  /* { mesh, pod, pos, freed, fightTimer } */
  var _humansFreed = 0;

  /* ── VFX explosions ─────────────────────────────────────────────────────── */
  var _explosions = []; /* { mesh, light, life, maxLife } */

  /* ── HUD ─────────────────────────────────────────────────────────────────── */
  var _hud        = null;
  var _msgEl      = null;
  var _msgTimer   = 0;

  /* ════════════════════════════════════════════════════════════════════════
     GEOMETRY HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function makeMesh(geo, color, emissive, emissiveIntensity) {
    var mat;
    if (emissive !== undefined) {
      mat = new THREE.MeshLambertMaterial({
        color: color,
        emissive: emissive,
        emissiveIntensity: emissiveIntensity !== undefined ? emissiveIntensity : 0.5
      });
    } else {
      mat = new THREE.MeshLambertMaterial({ color: color });
    }
    return new THREE.Mesh(geo, mat);
  }

  function addEnv(obj) {
    _scene.add(obj);
    _envObjects.push(obj);
    return obj;
  }

  function addLight(light) {
    _scene.add(light);
    _lights.push(light);
    return light;
  }

  function dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function normalize3(v) {
    var len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (len < 0.0001) { return { x: 0, y: 0, z: 0 }; }
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD SHIP INTERIOR
  ════════════════════════════════════════════════════════════════════════ */

  function buildShip() {
    var i, geo, mesh, light;

    /* Ambient */
    var ambient = new THREE.AmbientLight(0x050510, 0.8);
    addLight(ambient);

    /* ── Central corridor 6x4x60 ─────────────────────────────────── */
    geo  = new THREE.BoxGeometry(6, 4, 60);
    mesh = makeMesh(geo, 0x112233);
    mesh.position.set(0, 2, 0);
    addEnv(mesh);

    /* Bioluminescent corridor PointLights (0x0044FF) every 12 units */
    var corridorLightZ = [-24, -12, 0, 12, 24];
    for (i = 0; i < corridorLightZ.length; i++) {
      light = new THREE.PointLight(0x0044FF, 1.2, 18);
      light.position.set(0, 4.5, corridorLightZ[i]);
      addLight(light);
    }

    /* ── 4 side chambers 15x5x12 ─────────────────────────────────── */
    /* Left side: z=10 (armory), z=-10 (specimen lab) */
    /* Right side: z=10 (engine room), z=-10 (docking bay) */
    var chambers = [
      { x: -10.5, y: 2.5, z: 10,  label: 'armory'   },
      { x: -10.5, y: 2.5, z: -10, label: 'specimen'  },
      { x:  10.5, y: 2.5, z: 10,  label: 'engine'    },
      { x:  10.5, y: 2.5, z: -10, label: 'docking'   }
    ];
    for (i = 0; i < chambers.length; i++) {
      geo  = new THREE.BoxGeometry(15, 5, 12);
      mesh = makeMesh(geo, 0x111122);
      mesh.position.set(chambers[i].x, chambers[i].y, chambers[i].z);
      addEnv(mesh);
      /* Dim chamber light */
      light = new THREE.PointLight(0x002244, 0.8, 20);
      light.position.set(chambers[i].x, chambers[i].y + 2, chambers[i].z);
      addLight(light);
    }

    /* ── Organic wall lumps (SphereGeometry) ─────────────────────── */
    var lumpPositions = [
      {x:-2.8,y:1,z:-20},{x:2.8,y:1,z:-20},{x:-2.8,y:3,z:-10},
      {x:2.8,y:3,z:-10},{x:-2.8,y:1,z:0},{x:2.8,y:1,z:0},
      {x:-2.8,y:3,z:10},{x:2.8,y:3,z:10},{x:-2.8,y:1,z:20},
      {x:2.8,y:1,z:20},{x:0,y:0.4,z:-25},{x:0,y:0.4,z:25},
      {x:-15,y:1,z:8},{x:-15,y:3,z:12},{x:15,y:1,z:8},{x:15,y:3,z:12}
    ];
    for (i = 0; i < lumpPositions.length; i++) {
      var lp = lumpPositions[i];
      var lumpR = 0.4 + Math.random() * 0.5;
      geo  = new THREE.SphereGeometry(lumpR, 6, 6);
      mesh = makeMesh(geo, 0x223344, 0x001133, 0.3);
      mesh.position.set(lp.x, lp.y, lp.z);
      addEnv(mesh);
    }

    /* ── Zero-G sections (center corridor mid-section z=-5 to z=5) ─ */
    _zeroGSections = [
      { zMin: -6, zMax: 6 }
    ];

    /* ── Engine room — power cores ────────────────────────────────── */
    var corePositions = [
      { x: 9, y: 2, z: 8 }, { x: 12, y: 2, z: 8 },
      { x: 9, y: 2, z: 12 }, { x: 12, y: 2, z: 12 }
    ];
    for (i = 0; i < corePositions.length; i++) {
      var cp = corePositions[i];
      geo  = new THREE.CylinderGeometry(1, 1, 2, 12);
      mesh = makeMesh(geo, 0x00AAFF, 0x00AAFF, 0.9);
      mesh.position.set(cp.x, cp.y, cp.z);
      addEnv(mesh);
      light = new THREE.PointLight(0x00AAFF, 1.5, 10);
      light.position.set(cp.x, cp.y + 1.5, cp.z);
      addLight(light);
      _cores.push({
        mesh: mesh,
        light: light,
        pos: { x: cp.x, y: cp.y, z: cp.z },
        alive: true,
        plantingTimer: 0,
        planted: false,
        explodeTimer: 0
      });
    }

    /* ── Armory — plasma rifle pickup ─────────────────────────────── */
    geo  = new THREE.BoxGeometry(0.25, 0.2, 1.0);
    mesh = makeMesh(geo, 0x00FF88, 0x00FF88, 0.6);
    mesh.position.set(-14, 1.3, 10);
    addEnv(mesh);
    _pickups.push({ mesh: mesh, type: 'plasmaRifle', pos: { x: -14, y: 1.3, z: 10 }, collected: false });

    /* ── Shield generator pickup (corridor near entrance) ─────────── */
    geo  = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    mesh = makeMesh(geo, 0x0044FF, 0x0044FF, 0.7);
    mesh.position.set(2, 1.2, 18);
    addEnv(mesh);
    _pickups.push({ mesh: mesh, type: 'shield', pos: { x: 2, y: 1.2, z: 18 }, collected: false });

    /* ── Teleport traps ───────────────────────────────────────────── */
    var trapPositions = [
      { x: 0, y: 0.05, z: -20 }, { x: 1, y: 0.05, z: -8 },
      { x:-1, y: 0.05, z:  5  }, { x: 0, y: 0.05, z: 15 },
      { x:-12,y: 0.05, z:-10  }, { x:12, y: 0.05, z: 10 }
    ];
    for (i = 0; i < trapPositions.length; i++) {
      var tp = trapPositions[i];
      geo  = new THREE.BoxGeometry(1.5, 0.1, 1.5);
      mesh = makeMesh(geo, 0x112244, 0x2244AA, 0.8);
      mesh.position.set(tp.x, tp.y, tp.z);
      addEnv(mesh);
      light = new THREE.PointLight(0x2244AA, 0.6, 5);
      light.position.set(tp.x, tp.y + 0.5, tp.z);
      addLight(light);
      _teleTraps.push({
        mesh: mesh,
        light: light,
        pos: { x: tp.x, y: 0, z: tp.z },
        alive: true,
        disarmTimer: 0,
        disarmed: false
      });
    }

    /* ── Specimen lab — stasis pods + human captives ──────────────── */
    var humanPositions = [
      { x:-8,  y:1.5, z:-8  }, { x:-10, y:1.5, z:-8  },
      { x:-12, y:1.5, z:-8  }, { x:-14, y:1.5, z:-8  },
      { x:-8,  y:1.5, z:-12 }, { x:-10, y:1.5, z:-12 },
      { x:-12, y:1.5, z:-12 }, { x:-14, y:1.5, z:-12 }
    ];
    for (i = 0; i < humanPositions.length; i++) {
      var hp2 = humanPositions[i];

      /* Stasis pod CylinderGeometry */
      geo  = new THREE.CylinderGeometry(0.6, 0.6, 2, 10);
      var pod = makeMesh(geo, 0x113344, 0x0033AA, 0.4);
      pod.position.set(hp2.x, hp2.y - 0.2, hp2.z);
      addEnv(pod);

      /* Human captive BoxGeometry */
      geo  = new THREE.BoxGeometry(0.5, 1.2, 0.3);
      var humanMesh = makeMesh(geo, 0xFFDDCC);
      humanMesh.position.set(hp2.x, hp2.y, hp2.z);
      addEnv(humanMesh);

      _humans.push({
        mesh: humanMesh,
        pod: pod,
        pos: { x: hp2.x, y: hp2.y, z: hp2.z },
        freed: false,
        fightTimer: 0,
        targetAlien: null,
        alive: true
      });
    }

    /* ── Escape pod CylinderGeometry in docking bay ───────────────── */
    geo  = new THREE.CylinderGeometry(1.2, 1.4, 3, 10);
    _escapePod = makeMesh(geo, 0x223344, 0x002233, 0.3);
    _escapePod.position.set(_escapePodPos.x, _escapePodPos.y, _escapePodPos.z);
    addEnv(_escapePod);
    light = new THREE.PointLight(0x00AAFF, 0.5, 8);
    light.position.set(_escapePodPos.x, _escapePodPos.y + 3, _escapePodPos.z);
    addLight(light);

    /* ── Floor for corridor ───────────────────────────────────────── */
    geo  = new THREE.BoxGeometry(6, 0.2, 60);
    mesh = makeMesh(geo, 0x0A1A2A);
    mesh.position.set(0, 0.1, 0);
    addEnv(mesh);
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD PLAYER
  ════════════════════════════════════════════════════════════════════════ */

  function buildPlayer() {
    var group = new THREE.Group();
    var body  = makeMesh(new THREE.BoxGeometry(0.6, 1.5, 0.4), 0x445566);
    body.position.set(0, 0, 0);
    group.add(body);
    var head  = makeMesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), 0x667788);
    head.position.set(0, 1.0, 0);
    group.add(head);
    group.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _scene.add(group);
    _playerMesh = group;
  }

  /* ════════════════════════════════════════════════════════════════════════
     SPAWN ALIENS
  ════════════════════════════════════════════════════════════════════════ */

  function spawnAliens() {
    var i, geo, mesh, light;

    /* 12 Greys — spread through corridor and chambers */
    var greyPositions = [
      {x:0,y:1.5,z:-22},{x:1,y:1.5,z:-15},{x:-1,y:1.5,z:-8},
      {x:0,y:1.5,z:0},{x:1,y:1.5,z:8},{x:-1,y:1.5,z:16},
      {x:-12,y:1.5,z:10},{x:-8,y:1.5,z:10},{x:-12,y:1.5,z:-10},
      {x:-8,y:1.5,z:-10},{x:8,y:1.5,z:8},{x:8,y:1.5,z:-8}
    ];
    for (i = 0; i < 12; i++) {
      var gp = greyPositions[i];
      geo  = new THREE.BoxGeometry(0.8, 1.4, 0.6);
      mesh = makeMesh(geo, 0x44AA88, 0x22AA66, 0.2);
      mesh.position.set(gp.x, gp.y, gp.z);
      _scene.add(mesh);

      light = new THREE.PointLight(0x22AA66, 0.4, 5);
      light.position.set(gp.x, gp.y + 1, gp.z);
      _scene.add(light);

      _aliens.push({
        mesh: mesh,
        type: 'grey',
        hp: 40,
        maxHp: 40,
        alive: true,
        vel: { x: 0, y: 0, z: 0 },
        fireTimer: 2 + Math.random() * 3,
        psionicTimer: 0,
        light: light
      });
    }

    /* 3 Warriors — CylinderGeometry, in engine room & corridor */
    var warriorPositions = [
      {x:10,y:1.5,z:10},{x:10,y:1.5,z:12},{x:0,y:1.5,z:-22}
    ];
    for (i = 0; i < 3; i++) {
      var wp = warriorPositions[i];
      geo  = new THREE.CylinderGeometry(0.45, 0.45, 1.8, 8);
      mesh = makeMesh(geo, 0x226644, 0x113322, 0.2);
      mesh.position.set(wp.x, wp.y, wp.z);
      _scene.add(mesh);

      light = new THREE.PointLight(0x226644, 0.5, 6);
      light.position.set(wp.x, wp.y + 1, wp.z);
      _scene.add(light);

      _aliens.push({
        mesh: mesh,
        type: 'warrior',
        hp: 200,
        maxHp: 200,
        alive: true,
        vel: { x: 0, y: 0, z: 0 },
        fireTimer: 1.5 + Math.random() * 2,
        psionicTimer: 0,
        light: light
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PSIONIC STUN — cone LineSegments
  ════════════════════════════════════════════════════════════════════════ */

  function firePsionicCone(alien) {
    /* Build a cone of lines radiating forward toward player, range 8 */
    var ax = alien.mesh.position.x;
    var ay = alien.mesh.position.y;
    var az = alien.mesh.position.z;

    var dx = _playerPos.x - ax;
    var dz = _playerPos.z - az;
    var len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.01) { return; }
    var ndx = dx / len;
    var ndz = dz / len;

    /* 7 spokes spanning ±30 degrees */
    var points = [];
    var j;
    for (j = -3; j <= 3; j++) {
      var angle = j * (Math.PI / 18); /* 10° each */
      var sx = ndx * Math.cos(angle) - ndz * Math.sin(angle);
      var sz = ndx * Math.sin(angle) + ndz * Math.cos(angle);
      points.push(new THREE.Vector3(ax, ay + 0.5, az));
      points.push(new THREE.Vector3(ax + sx * 8, ay + 0.5, az + sz * 8));
    }

    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({ color: 0xAA44FF, transparent: true, opacity: 0.85 });
    var lineMesh = new THREE.LineSegments(geo, mat);
    _scene.add(lineMesh);

    /* Check if player is inside the cone (within 8u & within 30° of forward) */
    var coneRange = 8;
    if (len <= coneRange) {
      var playerAngle = Math.atan2(_playerPos.x - ax, _playerPos.z - az);
      var forwardAngle = Math.atan2(ndx, ndz);
      var angleDiff = Math.abs(playerAngle - forwardAngle);
      if (angleDiff > Math.PI) { angleDiff = 2 * Math.PI - angleDiff; }
      if (angleDiff < Math.PI / 6) { /* within 30° */
        _stunTimer = Math.max(_stunTimer, 3);
        showMessage('PSIONIC STUN! Movement locked 3s');
      }
    }

    _psionicCones.push({ mesh: lineMesh, life: 0.6 });
  }

  /* ════════════════════════════════════════════════════════════════════════
     PROJECTILE HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function firePlayerPlasma() {
    if (!_hasPlasmaRifle) { return; }
    var geo  = new THREE.SphereGeometry(0.12, 6, 6);
    var mesh = makeMesh(geo, 0x00FFAA, 0x00FFAA, 0.9);
    mesh.position.set(_playerPos.x, _playerPos.y + 0.8, _playerPos.z);
    _scene.add(mesh);

    var dirX = -Math.sin(_yaw);
    var dirZ = -Math.cos(_yaw);
    var speed = 35;

    _playerShots.push({
      mesh: mesh,
      vel: { x: dirX * speed, y: 0, z: dirZ * speed },
      life: 3,
      damage: 60
    });
  }

  function fireAlienShot(alien) {
    var geo  = new THREE.SphereGeometry(0.18, 6, 6);
    var mesh = makeMesh(geo, 0xFF4488, 0xFF2266, 0.8);
    var ax = alien.mesh.position.x;
    var ay = alien.mesh.position.y;
    var az = alien.mesh.position.z;
    mesh.position.set(ax, ay + 0.6, az);
    _scene.add(mesh);

    var d = normalize3({
      x: _playerPos.x - ax,
      y: 0,
      z: _playerPos.z - az
    });
    var speed = 12;
    _alienShots.push({
      mesh: mesh,
      vel: { x: d.x * speed, y: 0, z: d.z * speed },
      life: 5,
      damage: 15
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     EXPLOSIONS
  ════════════════════════════════════════════════════════════════════════ */

  function spawnExplosion(x, y, z, color, size) {
    color = color || 0xFF4400;
    size  = size  || 0.8;
    var geo  = new THREE.SphereGeometry(size, 8, 8);
    var mesh = makeMesh(geo, color, color, 1.0);
    mesh.position.set(x, y, z);
    _scene.add(mesh);
    var light = new THREE.PointLight(color, 3 * size, 12 * size);
    light.position.set(x, y, z);
    _scene.add(light);
    _explosions.push({ mesh: mesh, light: light, life: 0.5, maxLife: 0.5 });
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    _hud = document.createElement('div');
    _hud.style.cssText = [
      'position:fixed', 'top:12px', 'left:50%', 'transform:translateX(-50%)',
      'background:rgba(0,10,30,0.88)', 'color:#00BBFF', 'font:bold 13px monospace',
      'padding:7px 18px', 'border:1px solid #0044FF', 'border-radius:4px',
      'z-index:10001', 'pointer-events:none', 'text-align:center',
      'letter-spacing:1px', 'text-shadow:0 0 8px #0044FF', 'display:none'
    ].join(';');
    document.body.appendChild(_hud);

    _msgEl = document.createElement('div');
    _msgEl.style.cssText = [
      'position:fixed', 'top:25%', 'left:50%', 'transform:translate(-50%,-50%)',
      'background:rgba(0,10,40,0.90)', 'color:#AADDFF', 'font:bold 20px monospace',
      'padding:14px 32px', 'border:2px solid #0044FF', 'border-radius:6px',
      'z-index:10002', 'pointer-events:none', 'text-align:center',
      'display:none', 'text-shadow:0 0 10px #0055FF'
    ].join(';');
    document.body.appendChild(_msgEl);
  }

  function showMessage(text, duration) {
    if (!_msgEl) { return; }
    _msgEl.textContent = text;
    _msgEl.style.display = 'block';
    _msgTimer = duration || 3;
  }

  function countAliveAliens() {
    var n = 0, i;
    for (i = 0; i < _aliens.length; i++) {
      if (_aliens[i].alive) { n++; }
    }
    return n;
  }

  function formatTime(seconds) {
    var s = Math.max(0, Math.ceil(seconds));
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function updateHUD() {
    if (!_hud || !_active) { return; }
    var aliveCores = 0, i;
    for (i = 0; i < _cores.length; i++) {
      if (_cores[i].alive) { aliveCores++; }
    }
    var coresDestroyed = 4 - aliveCores;
    var alienCount = countAliveAliens();
    var sdStr = _selfDestructActive ? formatTime(_selfDestructTimer) : '--:--';
    _hud.innerHTML =
      'MOTHERSHIP [CORES: ' + coresDestroyed + '/4] ' +
      '[ALIENS: ' + alienCount + '] ' +
      '[SELF-DESTRUCT: ' + sdStr + '] ' +
      '[HUMANS FREED: ' + _humansFreed + '/8] ' +
      '| ESCAPE POD: DOCKING BAY';
  }

  /* ════════════════════════════════════════════════════════════════════════
     LAUNCH MODULE
  ════════════════════════════════════════════════════════════════════════ */

  function launch() {
    if (_active) { return; }
    _active = true;

    /* Reset all state */
    _gameOver           = false;
    _escaped            = false;
    _shipDestroyed      = false;
    _playerHP           = 100;
    _playerPos          = { x: 0, y: 1.5, z: 20 };
    _playerVel          = { x: 0, y: 0, z: 0 };
    _yaw                = 0;
    _stunTimer          = 0;
    _shieldActive       = false;
    _shieldTimer        = 0;
    _hasPlasmaRifle     = false;
    _fireCooldown       = 0;
    _mouseDown          = false;
    _inZeroG            = false;
    _aliensKilled       = 0;
    _hiveAlerted        = false;
    _selfDestructActive = false;
    _selfDestructTimer  = 240;
    _humansFreed        = 0;
    _coresDestroyed     = 0;
    _launchingPod       = false;
    _launchTimer        = 0;
    _lastTime           = 0;

    _aliens      = [];
    _playerShots = [];
    _alienShots  = [];
    _psionicCones= [];
    _cores       = [];
    _teleTraps   = [];
    _pickups     = [];
    _humans      = [];
    _explosions  = [];
    _envObjects  = [];
    _lights      = [];
    _escapePod   = null;

    buildShip();
    spawnAliens();
    buildPlayer();

    if (_camera) {
      _camera.position.set(0, 4, 28);
      _camera.lookAt(0, 1.5, 20);
    }

    if (_hud) { _hud.style.display = 'block'; }
    showMessage('ABOARD THE ALIEN MOTHERSHIP\nDestroy all 4 power cores to escape!', 4);
  }

  /* ════════════════════════════════════════════════════════════════════════
     UPDATE — called every frame
  ════════════════════════════════════════════════════════════════════════ */

  function update(dt, scene, camera, canvas) {
    if (!_active) { return; }

    _scene  = scene  || _scene;
    _camera = camera || _camera;
    _canvas = canvas || _canvas;

    _lastTime += dt;

    if (_gameOver) {
      updateHUD();
      return;
    }

    var i, j, alien, shot, core, trap, human;
    var dx, dy, dz, dist, d;

    /* ── Message timer ─────────────────────────────────────────────── */
    if (_msgTimer > 0) {
      _msgTimer -= dt;
      if (_msgTimer <= 0 && _msgEl) {
        _msgEl.style.display = 'none';
      }
    }

    /* ── Self-destruct countdown ────────────────────────────────────── */
    if (_selfDestructActive) {
      _selfDestructTimer -= dt;
      if (_selfDestructTimer <= 0) {
        _selfDestructTimer = 0;
        showMessage('SHIP DESTROYED — YOU DIED IN THE EXPLOSION', 999);
        _gameOver = true;
        return;
      }
      if (_selfDestructTimer <= 30 && Math.floor(_selfDestructTimer) % 5 === 0 && dt < 0.1) {
        /* pulsing lights near end */
      }
    }

    /* ── Player HP ──────────────────────────────────────────────────── */
    if (_playerHP <= 0) {
      showMessage('YOU WERE KILLED BY THE ALIEN CREW', 999);
      _gameOver = true;
      return;
    }

    /* ── Shield timer ───────────────────────────────────────────────── */
    if (_shieldActive) {
      _shieldTimer -= dt;
      if (_shieldTimer <= 0) {
        _shieldActive = false;
        _shieldTimer  = 0;
        showMessage('Shield expired', 2);
      }
    }

    /* ── Stun timer ─────────────────────────────────────────────────── */
    if (_stunTimer > 0) {
      _stunTimer -= dt;
      if (_stunTimer < 0) { _stunTimer = 0; }
    }

    /* ── Fire cooldown ──────────────────────────────────────────────── */
    if (_fireCooldown > 0) { _fireCooldown -= dt; }

    /* ── Zero-G section detection ───────────────────────────────────── */
    _inZeroG = false;
    for (i = 0; i < _zeroGSections.length; i++) {
      if (_playerPos.z >= _zeroGSections[i].zMin && _playerPos.z <= _zeroGSections[i].zMax) {
        _inZeroG = true;
        break;
      }
    }

    /* ── Player movement ────────────────────────────────────────────── */
    if (_stunTimer <= 0) {
      var moveX = 0, moveZ = 0, moveY = 0;
      if (_keys['KeyW'] || _keys['ArrowUp'])    { moveZ = -1; }
      if (_keys['KeyS'] || _keys['ArrowDown'])  { moveZ =  1; }
      if (_keys['KeyA'] || _keys['ArrowLeft'])  { moveX = -1; }
      if (_keys['KeyD'] || _keys['ArrowRight']) { moveX =  1; }

      var cosY = Math.cos(_yaw);
      var sinY = Math.sin(_yaw);
      var wX = moveX * cosY + moveZ * sinY;
      var wZ = -moveX * sinY + moveZ * cosY;
      var mLen = Math.sqrt(wX * wX + wZ * wZ);
      if (mLen > 0.01) { wX /= mLen; wZ /= mLen; }

      if (_inZeroG) {
        /* Zero-G: Q=up, E handled for interact, no gravity */
        if (_keys['KeyQ']) { moveY =  1; }
        if (_keys['KeyE']) { moveY = -1; }   /* E in zero-g moves down, but also checks interact */
        _playerPos.x += wX * _playerSpeed * dt;
        _playerPos.z += wZ * _playerSpeed * dt;
        _playerPos.y += moveY * _playerSpeed * dt;
        _playerPos.y = Math.max(0.5, Math.min(3.5, _playerPos.y));
      } else {
        _playerPos.x += wX * _playerSpeed * dt;
        _playerPos.z += wZ * _playerSpeed * dt;
        _playerPos.y = 1.5; /* floor-locked outside zero-g */
      }

      /* Clamp inside ship */
      _playerPos.x = Math.max(-17, Math.min(17, _playerPos.x));
      _playerPos.z = Math.max(-30, Math.min(30, _playerPos.z));
    }

    if (_playerMesh) {
      _playerMesh.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
      _playerMesh.rotation.y = _yaw;
    }

    /* Camera follow */
    if (_camera) {
      var camDist = 10;
      _camera.position.x = _playerPos.x + Math.sin(_yaw) * camDist;
      _camera.position.y = _playerPos.y + 5;
      _camera.position.z = _playerPos.z + Math.cos(_yaw) * camDist;
      _camera.lookAt(_playerPos.x, _playerPos.y + 1, _playerPos.z);
    }

    /* ── Auto-fire ─────────────────────────────────────────────────── */
    if (_mouseDown && _fireCooldown <= 0 && _hasPlasmaRifle && _stunTimer <= 0) {
      firePlayerPlasma();
      _fireCooldown = 0.2;
    }

    /* ── Pickup collection ──────────────────────────────────────────── */
    for (i = 0; i < _pickups.length; i++) {
      var pk = _pickups[i];
      if (pk.collected) { continue; }
      dx = pk.pos.x - _playerPos.x;
      dz = pk.pos.z - _playerPos.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 2) {
        pk.collected = true;
        _scene.remove(pk.mesh);
        if (pk.type === 'plasmaRifle') {
          _hasPlasmaRifle = true;
          showMessage('PLASMA RIFLE acquired! Click to fire — 60 dmg', 3);
        } else if (pk.type === 'shield') {
          _shieldActive = true;
          _shieldTimer  = 30;
          showMessage('SHIELD GENERATOR: 50% damage reduction for 30s', 3);
        }
      }
    }

    /* ── Teleport traps ─────────────────────────────────────────────── */
    for (i = 0; i < _teleTraps.length; i++) {
      trap = _teleTraps[i];
      if (trap.disarmed) { continue; }

      /* Pulsing light */
      trap.light.intensity = 0.4 + Math.sin(_lastTime * 3 + i) * 0.3;

      dx = trap.pos.x - _playerPos.x;
      dz = trap.pos.z - _playerPos.z;
      dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 1.2 && _stunTimer <= 0) {
        /* Check E to disarm */
        if (_keys['KeyE'] && !_inZeroG) {
          trap.disarmTimer += dt;
          if (trap.disarmTimer >= 3) {
            trap.disarmed = true;
            _scene.remove(trap.mesh);
            _scene.remove(trap.light);
            showMessage('Teleport trap disarmed!', 2);
          }
        } else {
          trap.disarmTimer = 0;
          /* Teleport! */
          var teleZ = -24 + Math.floor(Math.random() * 7) * 8; /* random corridor section */
          _playerPos.x = (Math.random() - 0.5) * 4;
          _playerPos.z = teleZ;
          _playerPos.y = 1.5;
          showMessage('TELEPORTED! (disarm traps with E, 3s)', 3);
        }
      } else {
        if (!_keys['KeyE']) { trap.disarmTimer = 0; }
      }
    }

    /* ── E key — plant explosives on cores + free humans + launch pod ── */
    if (_keys['KeyE'] && _stunTimer <= 0 && !_inZeroG) {
      /* Power core explosive planting */
      for (i = 0; i < _cores.length; i++) {
        core = _cores[i];
        if (!core.alive || core.planted) { continue; }
        dx = core.pos.x - _playerPos.x;
        dz = core.pos.z - _playerPos.z;
        dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 3) {
          core.plantingTimer += dt;
          if (core.plantingTimer >= 4) {
            core.planted        = true;
            core.explodeTimer   = 1.0;
            showMessage('Explosive planted on core!', 2);
          }
        }
      }

      /* Free human captives */
      for (i = 0; i < _humans.length; i++) {
        human = _humans[i];
        if (human.freed) { continue; }
        dx = human.pos.x - _playerPos.x;
        dz = human.pos.z - _playerPos.z;
        dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 2.5) {
          human.freed = true;
          _humansFreed++;
          _scene.remove(human.pod);
          showMessage('Human freed! +100 | (' + _humansFreed + '/8)', 2);
        }
      }

      /* Launch escape pod */
      if (_coresDestroyed >= 4 && _escapePod) {
        dx = _escapePodPos.x - _playerPos.x;
        dz = _escapePodPos.z - _playerPos.z;
        dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 4) {
          if (!_launchingPod) {
            _launchingPod = true;
            _launchTimer  = 0;
            showMessage('Launching escape pod...', 999);
          }
        }
      }
    } else {
      /* Reset planting timers when E not held */
      for (i = 0; i < _cores.length; i++) {
        if (!_cores[i].planted) { _cores[i].plantingTimer = 0; }
      }
    }

    /* ── Escape pod launch ───────────────────────────────────────────── */
    if (_launchingPod) {
      _launchTimer += dt;
      if (_launchTimer >= 2) {
        showMessage('ESCAPED! Mission complete! Score bonus: ' + (_humansFreed * 100), 999);
        _escaped  = true;
        _gameOver = true;
        updateHUD();
        return;
      }
    }

    /* ── Core explosions ─────────────────────────────────────────────── */
    for (i = 0; i < _cores.length; i++) {
      core = _cores[i];
      if (!core.alive || !core.planted) { continue; }
      core.explodeTimer -= dt;
      if (core.explodeTimer <= 0) {
        core.alive = false;
        _coresDestroyed++;
        _scene.remove(core.mesh);
        _scene.remove(core.light);
        spawnExplosion(core.pos.x, core.pos.y, core.pos.z, 0x00AAFF, 1.5);

        /* Check if all 4 destroyed */
        if (_coresDestroyed >= 4 && !_shipDestroyed) {
          _shipDestroyed      = true;
          _selfDestructActive = true;
          _selfDestructTimer  = 240;
          if (!_hiveAlerted) {
            _hiveAlerted = true;
            showMessage('ALL CORES DESTROYED! SHIP SELF-DESTRUCT IN 4:00\nReach ESCAPE POD in docking bay!', 5);
          } else {
            showMessage('ALL CORES DESTROYED! SELF-DESTRUCT IN 4:00\nReach ESCAPE POD!', 5);
          }
        } else {
          showMessage('Core ' + _coresDestroyed + '/4 destroyed!', 2);
        }
      }
    }

    /* ── Update aliens ───────────────────────────────────────────────── */
    for (i = 0; i < _aliens.length; i++) {
      alien = _aliens[i];
      if (!alien.alive) { continue; }

      var ax = alien.mesh.position.x;
      var ay = alien.mesh.position.y;
      var az = alien.mesh.position.z;

      dx = _playerPos.x - ax;
      dz = _playerPos.z - az;
      dist = Math.sqrt(dx * dx + dz * dz);

      /* Face player */
      if (dist > 0.1) {
        alien.mesh.rotation.y = Math.atan2(dx, dz);
      }

      /* Hive alert: swarm player */
      if (_hiveAlerted) {
        var swarmSpeed = alien.type === 'warrior' ? 5 : 4;
        if (dist > 1.5) {
          alien.mesh.position.x += (dx / (dist + 0.001)) * swarmSpeed * dt;
          alien.mesh.position.z += (dz / (dist + 0.001)) * swarmSpeed * dt;
        }
      } else {
        /* Normal patrol / approach */
        if (alien.type === 'grey') {
          if (dist > 6 && dist < 30) {
            alien.mesh.position.x += (dx / dist) * 2.5 * dt;
            alien.mesh.position.z += (dz / dist) * 2.5 * dt;
          } else if (dist < 3) {
            alien.mesh.position.x -= (dx / dist) * 1.5 * dt;
            alien.mesh.position.z -= (dz / dist) * 1.5 * dt;
          }
        } else if (alien.type === 'warrior') {
          if (dist > 2) {
            alien.mesh.position.x += (dx / dist) * 3.5 * dt;
            alien.mesh.position.z += (dz / dist) * 3.5 * dt;
          }
        }
      }

      /* Sync light */
      alien.light.position.set(alien.mesh.position.x, alien.mesh.position.y + 1, alien.mesh.position.z);

      /* Grey: psionic stun + plasma shot */
      if (alien.type === 'grey') {
        alien.fireTimer -= dt;
        if (alien.fireTimer <= 0 && dist < 25) {
          if (dist < 8) {
            firePsionicCone(alien);
          } else {
            fireAlienShot(alien);
          }
          alien.fireTimer = 3 + Math.random() * 2;
        }
      }

      /* Warrior: plasma lance melee */
      if (alien.type === 'warrior') {
        if (dist < 2.5) {
          alien.fireTimer -= dt;
          if (alien.fireTimer <= 0) {
            var dmg = _shieldActive ? 10 : 20;
            _playerHP -= dmg;
            spawnExplosion(_playerPos.x, _playerPos.y + 0.5, _playerPos.z, 0x226644, 0.4);
            alien.fireTimer = 1.8;
          }
        } else if (dist < 20) {
          alien.fireTimer -= dt;
          if (alien.fireTimer <= 0) {
            fireAlienShot(alien);
            alien.fireTimer = 2.5 + Math.random() * 2;
          }
        }
      }

      /* Freed humans attack nearest alien (punch) */
      for (j = 0; j < _humans.length; j++) {
        human = _humans[j];
        if (!human.freed || !human.alive) { continue; }
        var hdx = alien.mesh.position.x - human.pos.x;
        var hdz = alien.mesh.position.z - human.pos.z;
        var hdist = Math.sqrt(hdx * hdx + hdz * hdz);
        if (hdist < 2) {
          human.fightTimer -= dt;
          if (human.fightTimer <= 0) {
            alien.hp -= 8;
            human.fightTimer = 1.2;
          }
        } else if (hdist < 12) {
          /* Move toward alien */
          human.pos.x += (hdx / hdist) * 3 * dt;
          human.pos.z += (hdz / hdist) * 3 * dt;
          human.mesh.position.set(human.pos.x, human.pos.y, human.pos.z);
        }
      }
    }

    /* ── Check alien deaths ─────────────────────────────────────────── */
    for (i = 0; i < _aliens.length; i++) {
      alien = _aliens[i];
      if (!alien.alive) { continue; }
      if (alien.hp <= 0) {
        alien.alive = false;
        _aliensKilled++;
        _scene.remove(alien.mesh);
        _scene.remove(alien.light);
        spawnExplosion(
          alien.mesh.position.x, alien.mesh.position.y, alien.mesh.position.z,
          0x44AA88, alien.type === 'warrior' ? 1.2 : 0.7
        );

        /* Hive mind: 6 kills triggers swarm + self-destruct */
        if (_aliensKilled >= 6 && !_hiveAlerted) {
          _hiveAlerted        = true;
          _selfDestructActive = true;
          _selfDestructTimer  = 240;
          showMessage('HIVE MIND ALERT! All aliens swarm! SELF-DESTRUCT in 4:00!', 5);
        }
      }
    }

    /* ── Update player shots ──────────────────────────────────────────── */
    for (i = _playerShots.length - 1; i >= 0; i--) {
      shot = _playerShots[i];
      shot.life -= dt;
      shot.mesh.position.x += shot.vel.x * dt;
      shot.mesh.position.y += shot.vel.y * dt;
      shot.mesh.position.z += shot.vel.z * dt;

      var shotHit = false;
      for (j = 0; j < _aliens.length; j++) {
        alien = _aliens[j];
        if (!alien.alive) { continue; }
        dx = shot.mesh.position.x - alien.mesh.position.x;
        dy = shot.mesh.position.y - alien.mesh.position.y;
        dz = shot.mesh.position.z - alien.mesh.position.z;
        dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        var hitR = alien.type === 'warrior' ? 1.0 : 0.8;
        if (dist < hitR) {
          alien.hp -= shot.damage;
          spawnExplosion(
            shot.mesh.position.x, shot.mesh.position.y, shot.mesh.position.z,
            0x00FFAA, 0.4
          );
          shotHit = true;
          break;
        }
      }

      if (shotHit || shot.life <= 0) {
        _scene.remove(shot.mesh);
        _playerShots.splice(i, 1);
      }
    }

    /* ── Update alien shots ─────────────────────────────────────────── */
    for (i = _alienShots.length - 1; i >= 0; i--) {
      shot = _alienShots[i];
      shot.life -= dt;
      shot.mesh.position.x += shot.vel.x * dt;
      shot.mesh.position.y += shot.vel.y * dt;
      shot.mesh.position.z += shot.vel.z * dt;

      dx = shot.mesh.position.x - _playerPos.x;
      dy = shot.mesh.position.y - _playerPos.y;
      dz = shot.mesh.position.z - _playerPos.z;
      dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 1.2) {
        var dmg2 = _shieldActive ? Math.floor(shot.damage * 0.5) : shot.damage;
        _playerHP -= dmg2;
        spawnExplosion(_playerPos.x, _playerPos.y + 0.5, _playerPos.z, 0xFF4488, 0.35);
        _scene.remove(shot.mesh);
        _alienShots.splice(i, 1);
        continue;
      }

      if (shot.life <= 0) {
        _scene.remove(shot.mesh);
        _alienShots.splice(i, 1);
      }
    }

    /* ── Update psionic cones ────────────────────────────────────────── */
    for (i = _psionicCones.length - 1; i >= 0; i--) {
      var cone = _psionicCones[i];
      cone.life -= dt;
      if (cone.life <= 0) {
        _scene.remove(cone.mesh);
        _psionicCones.splice(i, 1);
      } else {
        cone.mesh.material.opacity = cone.life / 0.6;
      }
    }

    /* ── Update explosions ───────────────────────────────────────────── */
    for (i = _explosions.length - 1; i >= 0; i--) {
      var exp = _explosions[i];
      exp.life -= dt;
      var t = exp.life / exp.maxLife;
      if (exp.light) { exp.light.intensity *= 0.92; }
      if (exp.mesh) {
        var sc = 1 + (1 - t) * 1.8;
        exp.mesh.scale.set(sc, sc, sc);
        exp.mesh.material.transparent = true;
        exp.mesh.material.opacity = t;
      }
      if (exp.life <= 0) {
        if (exp.mesh)  { _scene.remove(exp.mesh); }
        if (exp.light) { _scene.remove(exp.light); }
        _explosions.splice(i, 1);
      }
    }

    updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     RESET / TEARDOWN
  ════════════════════════════════════════════════════════════════════════ */

  function reset(scene) {
    if (!_active) { return; }
    _active = false;

    var i, s;
    s = scene || _scene;

    for (i = 0; i < _aliens.length; i++) {
      if (s) { s.remove(_aliens[i].mesh); s.remove(_aliens[i].light); }
    }
    for (i = 0; i < _playerShots.length; i++) {
      if (s) { s.remove(_playerShots[i].mesh); }
    }
    for (i = 0; i < _alienShots.length; i++) {
      if (s) { s.remove(_alienShots[i].mesh); }
    }
    for (i = 0; i < _psionicCones.length; i++) {
      if (s) { s.remove(_psionicCones[i].mesh); }
    }
    for (i = 0; i < _explosions.length; i++) {
      if (s) {
        if (_explosions[i].mesh)  { s.remove(_explosions[i].mesh); }
        if (_explosions[i].light) { s.remove(_explosions[i].light); }
      }
    }
    for (i = 0; i < _envObjects.length; i++) {
      if (s) { s.remove(_envObjects[i]); }
    }
    for (i = 0; i < _lights.length; i++) {
      if (s) { s.remove(_lights[i]); }
    }
    for (i = 0; i < _teleTraps.length; i++) {
      if (!_teleTraps[i].disarmed && s) { s.remove(_teleTraps[i].mesh); s.remove(_teleTraps[i].light); }
    }
    for (i = 0; i < _humans.length; i++) {
      if (s) { s.remove(_humans[i].mesh); }
    }
    if (_playerMesh && s) { s.remove(_playerMesh); }

    _aliens       = [];
    _playerShots  = [];
    _alienShots   = [];
    _psionicCones = [];
    _explosions   = [];
    _envObjects   = [];
    _lights       = [];
    _cores        = [];
    _teleTraps    = [];
    _pickups      = [];
    _humans       = [];
    _playerMesh   = null;
    _escapePod    = null;

    if (_hud)   { _hud.style.display   = 'none'; }
    if (_msgEl) { _msgEl.style.display = 'none'; }
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT HANDLERS
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    _keys[e.code] = true;
    var now = Date.now();

    /* A+M activation */
    if (e.code === 'KeyA') { _amPressTime.A = now; }
    if (e.code === 'KeyM') { _amPressTime.M = now; }
    if (_amPressTime.A > 0 && _amPressTime.M > 0 &&
        Math.abs(_amPressTime.A - _amPressTime.M) <= AM_WINDOW) {
      if (!_active) {
        _amPressTime.A = 0;
        _amPressTime.M = 0;
        launch();
      }
    }
  }

  function onKeyUp(e) {
    _keys[e.code] = false;
  }

  function onMouseMove(e) {
    if (!_active) { return; }
    var rect = _canvas
      ? _canvas.getBoundingClientRect()
      : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    var nx = (e.clientX - rect.left) / rect.width * 2 - 1;
    _yaw = -nx * Math.PI;
  }

  function onMouseDown(e) {
    if (!_active) { return; }
    if (e.button === 0) { _mouseDown = true; }
  }

  function onMouseUp(e) {
    if (e.button === 0) { _mouseDown = false; }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    buildHUD();
    if (_hud) { _hud.style.display = 'none'; }

    window.addEventListener('keydown',   onKeyDown);
    window.addEventListener('keyup',     onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup',   onMouseUp);
  }

  return {
    init:   init,
    update: function (dt, scene, camera, canvas) { update(dt, scene, camera, canvas); },
    reset:  function (scene) { reset(scene); }
  };

}());
