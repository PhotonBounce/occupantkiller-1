/* ───────────────────────────────────────────────────────────────────────────
   volcano-temple.js — Volcano Temple: A doomsday cult performs a ritual
   inside an active volcano crater. Stop the ritual and escape before eruption.
   API: window.VolcanoTemple = { init, update, reset }
   Controls:
     V + T (both within 400ms) → activate / deactivate module
     WASD                      → move player
     Mouse                     → aim / look
     Click                     → shoot
     E (near altar)            → disrupt ritual
   ─────────────────────────────────────────────────────────────────────────── */
window.VolcanoTemple = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;

  /* ── Activation ────────────────────────────────────────────────────────── */
  var _active     = false;
  var _vPressTime = 0;
  var _tPressTime = 0;
  var _keys       = {};
  var _prevEKey   = false;

  /* ── All scene objects (for cleanup) ───────────────────────────────────── */
  var _meshes = [];
  var _lights = [];

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _player   = null;
  var _playerHP = 100;
  var _velY     = 0;
  var _onGround = true;
  var _yaw      = 0;
  var _pitch    = 0;
  var _speed    = 8;

  /* ── Mouse look ─────────────────────────────────────────────────────────── */
  var _mouseX = 0;
  var _mouseY = 0;

  /* ── Game state ─────────────────────────────────────────────────────────── */
  var _ritualProgress  = 0;    /* 0-100 */
  var _ritualStopped   = false;
  var _gameOver        = false;
  var _gameWon         = false;
  var _eruptionActive  = false;
  var _eruptionTimer   = 120;  /* seconds until eruption after ritual completes */
  var _shakeTimer      = 0;
  var _gameTime        = 0;

  /* ── Altar ──────────────────────────────────────────────────────────────── */
  var _altar          = null;
  var _altarPos       = { x: 0, y: 0, z: 0 };
  var _altarGlow      = null;

  /* ── Cultist enemies ────────────────────────────────────────────────────── */
  var _cultists   = [];
  /* { mesh, headMesh, robeMesh, hp, dead, x, y, z, angle, speed, fireTimer, alertTimer } */
  var CULTIST_COUNT = 8;
  var CULTIST_HP    = 60;

  /* ── Lava particles ─────────────────────────────────────────────────────── */
  var _lavaParticles = [];
  /* { mesh, vx, vy, vz, life, maxLife } */
  var PARTICLE_COUNT  = 60;
  var _particleTimer  = 0;

  /* ── Bullets ────────────────────────────────────────────────────────────── */
  var _bullets = [];
  /* { mesh, vx, vy, vz, life } */

  /* ── Enemy bullets ──────────────────────────────────────────────────────── */
  var _enemyBullets = [];
  /* { mesh, vx, vy, vz, life } */

  /* ── Environmental objects ──────────────────────────────────────────────── */
  var _pillars      = [];
  var _lavaPools    = [];
  var _obsidianWalls= [];
  var _chains       = [];
  var _totems       = [];
  var _lavaBase     = null;
  var _lavaBaseY    = -8;

  /* ── HUD ─────────────────────────────────────────────────────────────────── */
  var _hud    = null;
  var _msgEl  = null;
  var _msgTimer = 0;

  /* ── Fog/bg backup ──────────────────────────────────────────────────────── */
  var _bgBackup  = null;
  var _fogBackup = null;

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  HELPERS                                                                */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _box(w, h, d, color, emissive, emissiveIntensity) {
    var geo  = new THREE.BoxGeometry(w, h, d);
    var opts = { color: color };
    if (emissive !== undefined) {
      opts.emissive          = new THREE.Color(emissive);
      opts.emissiveIntensity = emissiveIntensity !== undefined ? emissiveIntensity : 0.5;
    }
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial(opts));
  }

  function _cyl(rt, rb, h, segs, color, emissive) {
    var geo  = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var opts = { color: color };
    if (emissive !== undefined) {
      opts.emissive          = new THREE.Color(emissive);
      opts.emissiveIntensity = 0.5;
    }
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial(opts));
  }

  function _sphere(r, segs, color) {
    var geo = new THREE.SphereGeometry(r, segs || 8, segs || 8);
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
  }

  function _cone(r, h, segs, color) {
    var geo = new THREE.ConeGeometry(r, h, segs || 8);
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
  }

  function _add(mesh) {
    _scene.add(mesh);
    _meshes.push(mesh);
    return mesh;
  }

  function _addLight(light) {
    _scene.add(light);
    _lights.push(light);
    return light;
  }

  function _dist2d(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  MESSAGES & HUD                                                         */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _showMsg(text) {
    if (!_msgEl) {
      _msgEl = document.createElement('div');
      _msgEl.style.cssText = [
        'position:fixed',
        'bottom:90px',
        'left:50%',
        'transform:translateX(-50%)',
        'color:#FF6600',
        'font-family:monospace',
        'font-size:15px',
        'font-weight:bold',
        'background:rgba(0,0,0,0.85)',
        'padding:8px 22px',
        'border-radius:4px',
        'pointer-events:none',
        'z-index:10000',
        'white-space:nowrap'
      ].join(';');
      document.body.appendChild(_msgEl);
    }
    _msgEl.textContent = text;
    _msgEl.style.display = 'block';
    _msgTimer = 4.0;
  }

  function _updateMsgTimer(dt) {
    if (_msgTimer > 0) {
      _msgTimer -= dt;
      if (_msgTimer <= 0 && _msgEl) { _msgEl.style.display = 'none'; }
    }
  }

  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'vt-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.85)',
      'color:#FF4400',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 16px',
      'border:1px solid #882200',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hud);
    _updateHUD();
  }

  function _removeHUD() {
    if (_hud   && _hud.parentNode)   { _hud.parentNode.removeChild(_hud);     _hud   = null; }
    if (_msgEl && _msgEl.parentNode) { _msgEl.parentNode.removeChild(_msgEl); _msgEl = null; }
  }

  function _updateHUD() {
    if (!_hud) { return; }
    if (!_active) { _hud.style.display = 'none'; return; }
    _hud.style.display = 'block';

    var progressStr = 'RITUAL PROGRESS: ' + Math.floor(_ritualProgress) + '%';
    var hpStr       = 'HP: ' + Math.max(0, _playerHP);
    var cultStr     = 'CULTISTS: ' + _cultists.filter(function (c) { return !c.dead; }).length;
    var eruptStr    = '';

    if (_ritualStopped) {
      progressStr = 'RITUAL: STOPPED';
    }
    if (_eruptionActive) {
      eruptStr = ' | ERUPTION IN: ' + Math.max(0, Math.ceil(_eruptionTimer)) + 's';
      _hud.style.color = '#FF0000';
    } else {
      _hud.style.color = '#FF4400';
    }
    if (_gameWon) {
      progressStr = 'ESCAPED!';
      _hud.style.color = '#00FF44';
    }
    if (_gameOver) {
      progressStr = 'CONSUMED BY LAVA';
      _hud.style.color = '#FF0000';
    }

    _hud.textContent =
      'VOLCANO TEMPLE | ' + progressStr +
      ' | ' + hpStr +
      ' | ' + cultStr + ' ALIVE' +
      eruptStr;
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  WORLD BUILD                                                            */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _buildWorld() {
    /* ── Lighting ─────────────────────────────────────────────────────────── */
    var amb = new THREE.AmbientLight(0x220800, 0.8);
    _addLight(amb);

    var lavaLight = new THREE.PointLight(0xFF4400, 3.0, 60);
    lavaLight.position.set(0, -4, 0);
    _addLight(lavaLight);

    var ritualLight = new THREE.PointLight(0xFF2200, 2.0, 30);
    ritualLight.position.set(0, 2, 0);
    _addLight(ritualLight);

    /* ── Volcano crater floor ─────────────────────────────────────────────── */
    var floor = _box(80, 1, 80, 0x1a0a00);
    floor.position.set(0, -0.5, 0);
    _add(floor);

    /* ── Lava lake (flat base, glowing) ──────────────────────────────────── */
    _lavaBase = _box(60, 0.4, 60, 0xFF2200, 0xFF4400, 0.8);
    _lavaBase.position.set(0, _lavaBaseY, 0);
    _add(_lavaBase);

    /* ── Obsidian crater walls (6 segments around perimeter) ─────────────── */
    var wallAngles = [0, 60, 120, 180, 240, 300];
    var i, angle, wx, wz, wall;
    for (i = 0; i < wallAngles.length; i++) {
      angle = wallAngles[i] * Math.PI / 180;
      wx = Math.cos(angle) * 34;
      wz = Math.sin(angle) * 34;

      wall = _box(12, 18, 3, 0x0d0d0d);
      wall.position.set(wx, 8.5, wz);
      wall.rotation.y = -angle;
      _add(wall);
      _obsidianWalls.push(wall);

      /* inner ledge */
      var ledge = _box(12, 1, 5, 0x1a0800);
      ledge.position.set(wx * 0.82, 0.1, wz * 0.82);
      ledge.rotation.y = -angle;
      _add(ledge);
    }

    /* ── Temple pillars (8 cylinders around the altar) ───────────────────── */
    var pillarAngles = [0, 45, 90, 135, 180, 225, 270, 315];
    var j, pa, px, pz, pillar, pillarCap;
    for (j = 0; j < pillarAngles.length; j++) {
      pa = pillarAngles[j] * Math.PI / 180;
      px = Math.cos(pa) * 14;
      pz = Math.sin(pa) * 14;

      pillar = _cyl(0.7, 0.9, 12, 8, 0x2a1a00);
      pillar.position.set(px, 6, pz);
      _add(pillar);
      _pillars.push(pillar);

      /* carved top capital */
      pillarCap = _cyl(1.2, 0.7, 1.5, 8, 0x3a2800);
      pillarCap.position.set(px, 12.5, pz);
      _add(pillarCap);

      /* base pedestal */
      var pillarBase = _box(2.2, 0.8, 2.2, 0x1a0e00);
      pillarBase.position.set(px, 0.4, pz);
      _add(pillarBase);
    }

    /* ── Altar platform ──────────────────────────────────────────────────── */
    var altarBase = _box(8, 1, 8, 0x3a1a00);
    altarBase.position.set(0, 0.5, 0);
    _add(altarBase);

    var altarStep = _box(5, 0.6, 5, 0x4a2800);
    altarStep.position.set(0, 1.3, 0);
    _add(altarStep);

    /* central altar stone */
    _altar = _box(2, 1.5, 2, 0x2a1000, 0xFF3300, 0.4);
    _altar.position.set(0, 2.35, 0);
    _add(_altar);
    _altarPos.x = 0;
    _altarPos.y = 2.35;
    _altarPos.z = 0;

    /* altar glow orb (ritual energy) */
    _altarGlow = _sphere(0.6, 8, 0xFF2200);
    _altarGlow.material.emissive = new THREE.Color(0xFF6600);
    _altarGlow.material.emissiveIntensity = 1.0;
    _altarGlow.position.set(0, 3.6, 0);
    _add(_altarGlow);

    /* ── Lava pools (4 flat red boxes, corners of temple) ────────────────── */
    var poolPositions = [
      { x: 20, z: 20 }, { x: -20, z: 20 },
      { x: 20, z: -20 }, { x: -20, z: -20 }
    ];
    var k, pp, pool;
    for (k = 0; k < poolPositions.length; k++) {
      pp   = poolPositions[k];
      pool = _box(8, 0.3, 8, 0xFF1100, 0xFF4400, 0.9);
      pool.position.set(pp.x, 0.05, pp.z);
      _add(pool);
      _lavaPools.push(pool);

      /* lava pool rim */
      var rim = _box(9.5, 0.6, 9.5, 0x330800);
      rim.position.set(pp.x, -0.1, pp.z);
      _add(rim);
    }

    /* ── Hanging chains (LineSegments between pillar tops and ceiling) ────── */
    var chainPositions = [
      { x: 0, z: 14 }, { x: 0, z: -14 },
      { x: 14, z: 0 }, { x: -14, z: 0 }
    ];
    var ci, cp, chainLink, chainY;
    for (ci = 0; ci < chainPositions.length; ci++) {
      cp = chainPositions[ci];
      /* Build chain from stacked dark boxes */
      for (chainY = 8; chainY <= 13; chainY += 1.2) {
        chainLink = _box(0.2, 0.5, 0.5, 0x1a1a1a);
        chainLink.position.set(cp.x, chainY, cp.z);
        if (chainY % 2.4 < 1.2) { chainLink.rotation.y = Math.PI / 2; }
        _add(chainLink);
        if (ci === 0 && chainY <= 9) { _chains.push(chainLink); }
      }
      /* large hanging hook */
      var hook = _box(0.6, 2, 0.6, 0x111111);
      hook.position.set(cp.x, 7, cp.z);
      _add(hook);
    }

    /* ── Totem poles (cult symbols) ──────────────────────────────────────── */
    var totemPos = [
      { x: 8,  z: 8  },
      { x: -8, z: 8  },
      { x: 8,  z: -8 },
      { x: -8, z: -8 }
    ];
    var ti, tp, totemShaft, totemHead, totemEyes;
    for (ti = 0; ti < totemPos.length; ti++) {
      tp = totemPos[ti];

      totemShaft = _cyl(0.4, 0.5, 5, 6, 0x3a2000);
      totemShaft.position.set(tp.x, 2.5, tp.z);
      _add(totemShaft);

      totemHead = _box(1.2, 1.2, 1.2, 0x2a1500);
      totemHead.position.set(tp.x, 5.6, tp.z);
      _add(totemHead);

      totemEyes = _box(0.8, 0.25, 0.25, 0xFF0000, 0xFF2200, 1.0);
      totemEyes.position.set(tp.x, 5.7, tp.z + 0.5);
      _add(totemEyes);

      /* horn on totem */
      var totemHorn = _cone(0.25, 1.2, 4, 0x1a0a00);
      totemHorn.position.set(tp.x, 6.8, tp.z);
      _add(totemHorn);

      _totems.push(totemShaft);
    }

    /* ── Temple roof segments (partial cover) ─────────────────────────────── */
    var roofAngles = [0, 90, 180, 270];
    var ri, ra, rx, rz;
    for (ri = 0; ri < roofAngles.length; ri++) {
      ra = roofAngles[ri] * Math.PI / 180;
      rx = Math.cos(ra) * 18;
      rz = Math.sin(ra) * 18;
      var roofSlab = _box(12, 0.8, 10, 0x0d0600);
      roofSlab.position.set(rx, 13, rz);
      roofSlab.rotation.y = ra;
      _add(roofSlab);
    }

    /* ── Ritual circle markings on ground ────────────────────────────────── */
    var circleRing = _cyl(10.1, 10, 0.15, 32, 0x440000, 0xFF0000, 0.6);
    circleRing.position.set(0, 0.02, 0);
    _add(circleRing);

    var innerRing = _cyl(5.1, 5, 0.15, 24, 0x660000, 0xFF0000, 0.5);
    innerRing.position.set(0, 0.02, 0);
    _add(innerRing);

    /* ── Escape zone marker (north exit, where player must flee to) ──────── */
    var escapeMarker = _box(6, 0.2, 3, 0x004400, 0x00FF00, 0.3);
    escapeMarker.position.set(0, 0.1, -38);
    _add(escapeMarker);

    var escapeSign = _box(4, 2, 0.3, 0x003300, 0x00FF44, 0.5);
    escapeSign.position.set(0, 2, -36);
    _add(escapeSign);

    /* ── Background volcano walls (crater rim) ───────────────────────────── */
    var outerAngs = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    var oi, oa, ox, oz;
    for (oi = 0; oi < outerAngs.length; oi++) {
      oa = outerAngs[oi] * Math.PI / 180;
      ox = Math.cos(oa) * 42;
      oz = Math.sin(oa) * 42;
      var craterWall = _box(8, 24, 6, 0x0a0500);
      craterWall.position.set(ox, 12, oz);
      craterWall.rotation.y = -oa;
      _add(craterWall);
    }

    /* ── Smoke columns (cylinders rising from lava) ──────────────────────── */
    var smokePositions = [
      { x: 28, z: 0 }, { x: -28, z: 0 },
      { x: 0,  z: 28 }, { x: 0, z: -28 }
    ];
    var si, sp;
    for (si = 0; si < smokePositions.length; si++) {
      sp = smokePositions[si];
      var smokePillar = _cyl(2, 3, 20, 6, 0x1a0a00);
      smokePillar.material.transparent = true;
      smokePillar.material.opacity = 0.5;
      smokePillar.position.set(sp.x, 10, sp.z);
      _add(smokePillar);
    }

    /* ── Rubble piles ─────────────────────────────────────────────────────── */
    var rubblePos = [
      { x: 16, z: 6 }, { x: -16, z: -8 }, { x: 6, z: 18 }, { x: -10, z: -18 }
    ];
    var rbi, rbp, rubble;
    for (rbi = 0; rbi < rubblePos.length; rbi++) {
      rbp = rubblePos[rbi];
      rubble = _box(3, 1.5, 3, 0x1a0a00);
      rubble.position.set(rbp.x, 0.75, rbp.z);
      rubble.rotation.y = rbi * 0.5;
      _add(rubble);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  CULTIST ENEMIES                                                        */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _buildCultists() {
    var spawnRing = [
      { x: 18,  z: 0   },
      { x: -18, z: 0   },
      { x: 0,   z: 18  },
      { x: 0,   z: -18 },
      { x: 12,  z: 12  },
      { x: -12, z: 12  },
      { x: 12,  z: -12 },
      { x: -12, z: -12 }
    ];
    var i, pos, cultist, body, head, robe;
    for (i = 0; i < CULTIST_COUNT; i++) {
      pos = spawnRing[i % spawnRing.length];

      /* robe (dark box body) */
      robe = _box(1.0, 2.2, 0.7, 0x0f0010, 0x220022, 0.1);
      robe.position.set(pos.x, 1.1, pos.z);
      _add(robe);

      /* torso (slightly lighter dark) */
      body = _box(0.8, 0.9, 0.55, 0x150015);
      body.position.set(0, 0.65, 0);
      robe.add(body);

      /* head */
      head = _box(0.55, 0.55, 0.55, 0x6a4a3a);
      head.position.set(0, 1.5, 0);
      robe.add(head);

      /* hood */
      var hood = _cone(0.4, 0.7, 6, 0x0a000a);
      hood.position.set(0, 1.9, 0);
      robe.add(hood);
      _scene.add(robe);

      cultist = {
        mesh:       robe,
        headMesh:   head,
        robeMesh:   robe,
        hp:         CULTIST_HP,
        dead:       false,
        x:          pos.x,
        y:          0,
        z:          pos.z,
        angle:      Math.random() * Math.PI * 2,
        speed:      2.5,
        fireTimer:  Math.random() * 3 + 1,
        alertTimer: 0,
        patrolAngle: Math.random() * Math.PI * 2,
        patrolRadius: 6 + Math.random() * 4,
        patrolCx:   pos.x,
        patrolCz:   pos.z
      };
      _cultists.push(cultist);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  LAVA PARTICLES                                                         */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _spawnLavaParticle() {
    var spawnX = (Math.random() - 0.5) * 50;
    var spawnZ = (Math.random() - 0.5) * 50;
    /* only spawn near lava pools or outer ring */
    var dist = Math.sqrt(spawnX * spawnX + spawnZ * spawnZ);
    if (dist < 12 || dist > 35) { return; }

    var size   = 0.2 + Math.random() * 0.5;
    var pMesh  = _box(size, size, size, 0xFF2200, 0xFF6600, 0.9);
    pMesh.material.transparent = true;
    pMesh.material.opacity     = 0.9;
    pMesh.position.set(spawnX, _lavaBaseY + 0.5, spawnZ);
    _add(pMesh);

    _lavaParticles.push({
      mesh:    pMesh,
      vx:      (Math.random() - 0.5) * 0.5,
      vy:      0.8 + Math.random() * 1.5,
      vz:      (Math.random() - 0.5) * 0.5,
      life:    0,
      maxLife: 1.5 + Math.random() * 2
    });
  }

  function _updateLavaParticles(dt) {
    var i, p;
    _particleTimer -= dt;
    if (_particleTimer <= 0) {
      _particleTimer = 0.08;
      if (_lavaParticles.length < PARTICLE_COUNT) {
        _spawnLavaParticle();
      }
    }

    for (i = _lavaParticles.length - 1; i >= 0; i--) {
      p = _lavaParticles[i];
      p.life += dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 0.3 * dt; /* slight gravity */

      var t = p.life / p.maxLife;
      if (p.mesh.material) {
        p.mesh.material.opacity = 0.9 * (1 - t);
        /* shift from orange to dark as it rises */
        p.mesh.material.emissiveIntensity = 0.9 * (1 - t);
      }

      if (p.life >= p.maxLife) {
        _scene.remove(p.mesh);
        var idx = _meshes.indexOf(p.mesh);
        if (idx !== -1) { _meshes.splice(idx, 1); }
        _lavaParticles.splice(i, 1);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  SHOOTING                                                               */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _fireBullet() {
    if (!_camera) { return; }
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(_pitch, _yaw, 0, 'YXZ'));

    var bMesh = _box(0.12, 0.12, 0.5, 0xFFFF00, 0xFFFF44, 1.0);
    bMesh.position.copy(_camera.position);
    _add(bMesh);

    _bullets.push({
      mesh: bMesh,
      vx:   dir.x * 50,
      vy:   dir.y * 50,
      vz:   dir.z * 50,
      life: 0
    });
  }

  function _updateBullets(dt) {
    var i, b, dx, dz, dist, c;
    for (i = _bullets.length - 1; i >= 0; i--) {
      b = _bullets[i];
      b.life += dt;
      b.mesh.position.x += b.vx * dt;
      b.mesh.position.y += b.vy * dt;
      b.mesh.position.z += b.vz * dt;

      /* check cultist hits */
      for (c = 0; c < _cultists.length; c++) {
        if (_cultists[c].dead) { continue; }
        dx = b.mesh.position.x - _cultists[c].x;
        dz = b.mesh.position.z - _cultists[c].z;
        dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 1.2 && Math.abs(b.mesh.position.y - 1.5) < 1.5) {
          _cultists[c].hp -= 25;
          if (_cultists[c].hp <= 0) {
            _killCultist(_cultists[c]);
          }
          b.life = 999;
          break;
        }
      }

      if (b.life > 3) {
        _scene.remove(b.mesh);
        var idx = _meshes.indexOf(b.mesh);
        if (idx !== -1) { _meshes.splice(idx, 1); }
        _bullets.splice(i, 1);
      }
    }
  }

  function _killCultist(c) {
    c.dead = true;
    c.mesh.position.y = -0.6;
    c.mesh.rotation.z = Math.PI / 2;
    _showMsg('Cultist eliminated!');
  }

  function _fireEnemyBullet(cx, cy, cz) {
    if (!_camera) { return; }
    var dx = _camera.position.x - cx;
    var dy = _camera.position.y - cy;
    var dz = _camera.position.z - cz;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

    var bMesh = _box(0.12, 0.12, 0.5, 0x880000, 0xFF0000, 0.8);
    bMesh.position.set(cx, cy + 1.4, cz);
    _add(bMesh);

    _enemyBullets.push({
      mesh: bMesh,
      vx:   (dx / len) * 20,
      vy:   (dy / len) * 20,
      vz:   (dz / len) * 20,
      life: 0
    });
  }

  function _updateEnemyBullets(dt) {
    var i, b, dx, dz, dist;
    for (i = _enemyBullets.length - 1; i >= 0; i--) {
      b = _enemyBullets[i];
      b.life += dt;
      b.mesh.position.x += b.vx * dt;
      b.mesh.position.y += b.vy * dt;
      b.mesh.position.z += b.vz * dt;

      if (_camera) {
        dx = b.mesh.position.x - _camera.position.x;
        dz = b.mesh.position.z - _camera.position.z;
        dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 0.8 && Math.abs(b.mesh.position.y - _camera.position.y) < 1.0) {
          _playerHP -= 10;
          _updateHUD();
          if (_playerHP <= 0 && !_gameOver) {
            _gameOver = true;
            _showMsg('You have been killed! VOLCANO TEMPLE FAILED.');
            _updateHUD();
          }
          b.life = 999;
        }
      }

      if (b.life > 4) {
        _scene.remove(b.mesh);
        var idx = _meshes.indexOf(b.mesh);
        if (idx !== -1) { _meshes.splice(idx, 1); }
        _enemyBullets.splice(i, 1);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  CULTIST AI                                                             */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _updateCultists(dt) {
    var i, c, dx, dz, dist, speed;
    for (i = 0; i < _cultists.length; i++) {
      c = _cultists[i];
      if (c.dead) { continue; }
      if (!_camera) { continue; }

      dx   = _camera.position.x - c.x;
      dz   = _camera.position.z - c.z;
      dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 25) {
        /* Chase player */
        c.alertTimer = 3.0;
      }

      if (c.alertTimer > 0) {
        c.alertTimer -= dt;
        /* Move toward player (but stop at melee range) */
        if (dist > 5) {
          speed = c.speed;
          c.x += (dx / dist) * speed * dt;
          c.z += (dz / dist) * speed * dt;
        }
        /* Face player */
        c.angle = Math.atan2(dx, dz);

        /* Fire at player */
        c.fireTimer -= dt;
        if (c.fireTimer <= 0 && dist < 22) {
          c.fireTimer = 1.5 + Math.random() * 2;
          _fireEnemyBullet(c.x, c.y, c.z);
        }

        /* Melee damage */
        if (dist < 2.0) {
          _playerHP -= 8 * dt;
          if (_playerHP <= 0 && !_gameOver) {
            _gameOver = true;
            _showMsg('Cultist ritual sacrifice complete. You FAILED.');
            _updateHUD();
          }
        }
      } else {
        /* Patrol */
        c.patrolAngle += 0.6 * dt;
        c.x = c.patrolCx + Math.cos(c.patrolAngle) * c.patrolRadius;
        c.z = c.patrolCz + Math.sin(c.patrolAngle) * c.patrolRadius;
      }

      c.mesh.position.x = c.x;
      c.mesh.position.z = c.z;
      c.mesh.rotation.y = c.angle;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  RITUAL SYSTEM                                                          */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _updateRitual(dt) {
    if (_ritualStopped || _gameOver) { return; }

    /* Count alive cultists — they fuel the ritual */
    var aliveCultists = 0;
    var i;
    for (i = 0; i < _cultists.length; i++) {
      if (!_cultists[i].dead) { aliveCultists++; }
    }

    /* Ritual progresses faster with more cultists alive */
    var progressRate = (aliveCultists / CULTIST_COUNT) * 6; /* %/s */
    _ritualProgress += progressRate * dt;
    if (_ritualProgress >= 100) {
      _ritualProgress = 100;
      if (!_eruptionActive) {
        _eruptionActive = true;
        _eruptionTimer  = 90;
        _showMsg('RITUAL COMPLETE! ERUPTION IN 90 SECONDS! ESCAPE NOW!');
      }
    }

    /* Altar glow pulses with ritual progress */
    if (_altarGlow) {
      var pulse = Math.sin(_gameTime * 3) * 0.3 + 0.7;
      _altarGlow.material.emissiveIntensity = pulse * (_ritualProgress / 100);
      _altarGlow.position.y = 3.6 + Math.sin(_gameTime * 2) * 0.2;
    }
  }

  function _checkAltarInteract() {
    if (!_camera || _ritualStopped || _gameOver) { return; }
    var dx = _camera.position.x - _altarPos.x;
    var dz = _camera.position.z - _altarPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 4.0) {
      _ritualStopped = true;
      _ritualProgress = 0;
      _eruptionActive = false;
      _showMsg('RITUAL DISRUPTED! Now escape through the north exit!');
      if (_altarGlow) {
        _altarGlow.material.emissiveIntensity = 0;
        _altarGlow.material.color.setHex(0x004400);
        _altarGlow.material.emissive.setHex(0x00FF00);
        _altarGlow.material.emissiveIntensity = 0.3;
      }
    } else {
      _showMsg('Get closer to the altar to disrupt the ritual! (WASD to move)');
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  ERUPTION / ESCAPE                                                      */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _updateEruption(dt) {
    if (!_eruptionActive) { return; }
    _eruptionTimer -= dt;

    /* Camera shake */
    _shakeTimer += dt;
    if (_camera && _eruptionTimer > 0) {
      _camera.position.x += Math.sin(_shakeTimer * 8) * 0.05;
      _camera.position.y += Math.sin(_shakeTimer * 11) * 0.02;
    }

    /* Lava rises */
    if (_lavaBase) {
      _lavaBase.position.y = _lavaBaseY + (_eruptionTimer < 60 ? (60 - _eruptionTimer) * 0.15 : 0);
    }

    /* Spawn extra particles during eruption */
    if (Math.random() < 0.3) {
      _spawnLavaParticle();
    }

    if (_eruptionTimer <= 0 && !_gameOver && !_gameWon) {
      _gameOver = true;
      _showMsg('THE VOLCANO ERUPTED! You were consumed by lava!');
      _updateHUD();
    }
  }

  function _checkEscape() {
    if (!_camera || !_ritualStopped || _gameOver || _gameWon) { return; }
    var dx = _camera.position.x - 0;
    var dz = _camera.position.z - (-38);
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 5) {
      _gameWon = true;
      _eruptionActive = false;
      _showMsg('ESCAPED! The volcano erupts behind you. Mission Complete!');
      _updateHUD();
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  PLAYER MOVEMENT                                                        */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _updatePlayer(dt) {
    if (!_camera || _gameOver || _gameWon) { return; }

    /* Rotation */
    _yaw   += _mouseX * 0.002;
    _pitch += _mouseY * 0.002;
    _pitch  = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, _pitch));
    _mouseX = 0;
    _mouseY = 0;

    _camera.rotation.order = 'YXZ';
    _camera.rotation.y     = _yaw;
    _camera.rotation.x     = _pitch;

    /* WASD movement */
    var moveX = 0, moveZ = 0;
    if (_keys['w'] || _keys['W'] || _keys['ArrowUp'])    { moveZ = -1; }
    if (_keys['s'] || _keys['S'] || _keys['ArrowDown'])  { moveZ =  1; }
    if (_keys['a'] || _keys['A'] || _keys['ArrowLeft'])  { moveX = -1; }
    if (_keys['d'] || _keys['D'] || _keys['ArrowRight']) { moveX =  1; }

    var cos = Math.cos(_yaw), sin = Math.sin(_yaw);
    var wx  = (moveX * cos + moveZ * sin) * _speed * dt;
    var wz  = (-moveX * sin + moveZ * cos) * _speed * dt;

    _camera.position.x += wx;
    _camera.position.z += wz;

    /* Gravity */
    _velY -= 20 * dt;
    _camera.position.y += _velY * dt;
    if (_camera.position.y < 1.7) {
      _camera.position.y = 1.7;
      _velY = 0;
      _onGround = true;
    }

    /* Jump */
    if ((_keys[' '] || _keys['Space']) && _onGround) {
      _velY = 8;
      _onGround = false;
    }

    /* Clamp to crater */
    var clampDist = 38;
    var camDist   = Math.sqrt(_camera.position.x * _camera.position.x + _camera.position.z * _camera.position.z);
    if (camDist > clampDist) {
      _camera.position.x = (_camera.position.x / camDist) * clampDist;
      _camera.position.z = (_camera.position.z / camDist) * clampDist;
    }

    /* Lava pool damage */
    var pi, pp;
    var poolPositions = [
      { x: 20, z: 20 }, { x: -20, z: 20 },
      { x: 20, z: -20 }, { x: -20, z: -20 }
    ];
    for (pi = 0; pi < poolPositions.length; pi++) {
      pp = poolPositions[pi];
      var pdx = _camera.position.x - pp.x;
      var pdz = _camera.position.z - pp.z;
      if (Math.abs(pdx) < 4 && Math.abs(pdz) < 4) {
        _playerHP -= 30 * dt;
        if (_playerHP <= 0 && !_gameOver) {
          _gameOver = true;
          _showMsg('Fell into lava pool! VOLCANO TEMPLE FAILED.');
          _updateHUD();
        }
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  INPUT                                                                  */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    _keys[e.key] = true;

    /* Activation: V + T within 400ms */
    if (e.key === 'v' || e.key === 'V') { _vPressTime = performance.now(); }
    if (e.key === 't' || e.key === 'T') { _tPressTime = performance.now(); }
    if ((e.key === 'v' || e.key === 'V') && Math.abs(performance.now() - _tPressTime) < 400) {
      _toggleActive();
    }
    if ((e.key === 't' || e.key === 'T') && Math.abs(performance.now() - _vPressTime) < 400) {
      _toggleActive();
    }
  }

  function _onKeyUp(e) {
    _keys[e.key] = false;
  }

  function _onMouseMove(e) {
    _mouseX += e.movementX || 0;
    _mouseY += e.movementY || 0;
  }

  function _onMouseDown(e) {
    if (!_active || _gameOver || _gameWon) { return; }
    if (e.button === 0) { _fireBullet(); }
  }

  function _toggleActive() {
    _active = !_active;
    if (_active) {
      _showMsg('VOLCANO TEMPLE: Active — Stop the ritual! V+T to toggle.');
      _updateHUD();
    } else {
      _showMsg('VOLCANO TEMPLE: Deactivated');
      if (_hud) { _hud.style.display = 'none'; }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  ANIMATIONS / ENVIRONMENT                                               */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _updateEnvironment(dt) {
    /* Lava pool ripple (scale pulse) */
    var i, pool, t;
    t = _gameTime;
    for (i = 0; i < _lavaPools.length; i++) {
      pool = _lavaPools[i];
      var scale = 1 + Math.sin(t * 2 + i * 1.5) * 0.03;
      pool.scale.x = scale;
      pool.scale.z = scale;
      if (pool.material) {
        pool.material.emissiveIntensity = 0.7 + Math.sin(t * 3 + i) * 0.2;
      }
    }

    /* Totem glow flicker */
    for (i = 0; i < _totems.length; i++) {
      if (_totems[i] && _totems[i].material) {
        _totems[i].material.emissiveIntensity = 0.2 + Math.sin(t * 4 + i * 2.3) * 0.1;
      }
    }

    /* Lava base surface animation */
    if (_lavaBase && _lavaBase.material) {
      _lavaBase.material.emissiveIntensity = 0.6 + Math.sin(t * 1.5) * 0.2;
    }

    /* Idle screen shake when eruption is very close */
    if (_eruptionActive && _eruptionTimer < 30 && _camera && !_gameOver && !_gameWon) {
      _camera.position.x += Math.sin(t * 7) * 0.03;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  E KEY INTERACT                                                         */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _checkInteract() {
    var eDown = _keys['e'] || _keys['E'];
    if (eDown && !_prevEKey) {
      _checkAltarInteract();
      _checkEscape();
    }
    _prevEKey = eDown;
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  PUBLIC API                                                             */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    /* Backup and set scene background */
    _bgBackup  = scene.background;
    _fogBackup = scene.fog;
    scene.background = new THREE.Color(0x0a0200);
    scene.fog        = new THREE.Fog(0x1a0500, 20, 80);

    /* Position camera */
    camera.position.set(0, 1.7, 25);
    camera.rotation.order = 'YXZ';
    _yaw   = 0;
    _pitch = 0;

    _buildWorld();
    _buildCultists();
    _buildHUD();

    /* Input listeners */
    window.addEventListener('keydown',   _onKeyDown);
    window.addEventListener('keyup',     _onKeyUp);
    window.addEventListener('mousemove', _onMouseMove);
    window.addEventListener('mousedown', _onMouseDown);

    _showMsg('VOLCANO TEMPLE: V+T to activate. Stop the ritual, then escape north!');
  }

  function update(delta) {
    if (!_scene || !_camera) { return; }
    _gameTime += delta;

    if (!_active) { return; }

    _updateMsgTimer(delta);
    _updatePlayer(delta);
    _updateCultists(delta);
    _updateBullets(delta);
    _updateEnemyBullets(delta);
    _updateLavaParticles(delta);
    _updateRitual(delta);
    _updateEruption(delta);
    _updateEnvironment(delta);
    _checkInteract();
    _updateHUD();
  }

  function reset() {
    /* Remove all meshes */
    var i;
    for (i = 0; i < _meshes.length; i++) {
      _scene.remove(_meshes[i]);
      if (_meshes[i].geometry) { _meshes[i].geometry.dispose(); }
      if (_meshes[i].material) { _meshes[i].material.dispose(); }
    }
    _meshes = [];

    /* Remove all lights */
    for (i = 0; i < _lights.length; i++) {
      _scene.remove(_lights[i]);
    }
    _lights = [];

    /* Remove HUD */
    _removeHUD();

    /* Remove input listeners */
    window.removeEventListener('keydown',   _onKeyDown);
    window.removeEventListener('keyup',     _onKeyUp);
    window.removeEventListener('mousemove', _onMouseMove);
    window.removeEventListener('mousedown', _onMouseDown);

    /* Restore scene */
    if (_scene) {
      _scene.background = _bgBackup;
      _scene.fog        = _fogBackup;
    }

    /* Reset state */
    _active          = false;
    _ritualProgress  = 0;
    _ritualStopped   = false;
    _gameOver        = false;
    _gameWon         = false;
    _eruptionActive  = false;
    _eruptionTimer   = 120;
    _shakeTimer      = 0;
    _gameTime        = 0;
    _playerHP        = 100;
    _velY            = 0;
    _onGround        = true;
    _yaw             = 0;
    _pitch           = 0;
    _mouseX          = 0;
    _mouseY          = 0;
    _cultists        = [];
    _lavaParticles   = [];
    _bullets         = [];
    _enemyBullets    = [];
    _pillars         = [];
    _lavaPools       = [];
    _obsidianWalls   = [];
    _chains          = [];
    _totems          = [];
    _altar           = null;
    _altarGlow       = null;
    _lavaBase        = null;
    _lavaBaseY       = -8;
    _particleTimer   = 0;
    _keys            = {};
    _prevEKey        = false;
    _bgBackup        = null;
    _fogBackup       = null;
    _scene           = null;
    _camera          = null;
  }

  return { init: init, update: update, reset: reset };
}());
