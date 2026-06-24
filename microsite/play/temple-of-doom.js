/* ───────────────────────────────────────────────────────────────────────────
   temple-of-doom.js — Temple of Doom Module
   API: window.TempleOfDoom = { init, update, reset }
   Controls:
     T + D (both within 400ms) → activate / deactivate module
     WASD                      → move player
     E (within range)          → interact (swap idol, open valve, grab rope,
                                  disarm plates, try hidden passage)
     Q                         → melee knife kill (only way to kill guardians)
   ─────────────────────────────────────────────────────────────────────────── */
window.TempleOfDoom = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;

  /* ── Activation ────────────────────────────────────────────────────────── */
  var _active       = false;
  var _tPressTime   = 0;
  var _dPressTime   = 0;
  var _keys         = {};
  var _prevEKey     = false;
  var _prevQKey     = false;

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _player       = null;   /* THREE.Group */
  var _playerPos    = null;   /* reference to _player.position */
  var _playerHP     = 100;
  var _yaw          = 0;

  /* ── Chamber tracking ──────────────────────────────────────────────────── */
  var _currentChamber = 0;   /* 0 = antechamber/temple exterior, 1-5 = chambers */

  /* ── Temple meshes ─────────────────────────────────────────────────────── */
  var _templeMeshes       = [];   /* all scene objects to clean up */
  var _torchLights        = [];   /* { light, baseIntensity, flicker } */
  var _chambers           = [];   /* { group, zStart, zEnd } */

  /* ── Chamber 1 — Floor tiles / pressure plates ─────────────────────────── */
  var _tiles              = [];   /* { mesh, isPressurePlate, triggered } */
  var _pressurePlateOrder = [];   /* the correct 0-5 order clue on wall */
  var _playerPlateOrder   = [];   /* plates stepped on */
  var _bolts              = [];   /* { mesh, vel, life } */
  var _platesDisarmed     = false;

  /* ── Chamber 2 — Boulder run ───────────────────────────────────────────── */
  var _boulder            = null;
  var _boulderRolling     = false;
  var _boulderSpeed       = 15;
  var _alcoves            = [];   /* { mesh } side alcoves to dodge into */

  /* ── Chamber 3 — Spike pit / rope ─────────────────────────────────────── */
  var _ropeMesh           = null;
  var _ropeGrabbed        = false;
  var _ropeTimer          = 0;
  var _ropeWindow         = 1.0;  /* 1s swing window */
  var _ropeSwinging       = false;
  var _swingProgress      = 0;
  var _pitZStart          = 0;
  var _pitZEnd            = 0;
  var _playerOverPit      = false;
  var _pitFallen          = false;

  /* ── Chamber 4 — Water trap ────────────────────────────────────────────── */
  var _waterMesh          = null;
  var _waterLevel         = 0;
  var _waterRising        = false;
  var _drainValve         = null;
  var _drainProgress      = 0;
  var _draining           = false;
  var _hiddenPassage      = null;
  var _passageRevealed    = false;
  var _passageUsed        = false;
  var _ch4Cleared         = false;

  /* ── Chamber 5 — Golden idol ───────────────────────────────────────────── */
  var _idolMesh           = null;
  var _idolPedestal       = null;
  var _sandbagMesh        = null;
  var _sandbagSwapped     = false;
  var _idolCarried        = false;
  var _idolTaken          = false;

  /* ── Cult guardians ────────────────────────────────────────────────────── */
  var _guardians          = [];   /* { group, hp, active, dead, alcovePos, fireTimer } */
  var _guardianCount      = 0;

  /* ── Collapse sequence ─────────────────────────────────────────────────── */
  var _collapsing         = false;
  var _collapseTimer      = 90;
  var _debrisList         = [];   /* { mesh, fallSpeed, startY, active } */
  var _collapseByRoom     = [false, false, false, false, false];  /* ch1..5 */

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud                = null;
  var _msgEl              = null;
  var _msgTimer           = 0;

  /* ── Game time ─────────────────────────────────────────────────────────── */
  var _gameTime           = 0;

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  HELPERS                                                                 */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _box(w, h, d, color, emissive) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var opts = { color: color };
    if (emissive !== undefined) {
      opts.emissive = new THREE.Color(emissive);
      opts.emissiveIntensity = 0.6;
    }
    var mat = new THREE.MeshLambertMaterial(opts);
    return new THREE.Mesh(geo, mat);
  }

  function _cyl(rt, rb, h, segs, color) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function _sphere(r, segs, color) {
    var geo = new THREE.SphereGeometry(r, segs || 8, segs || 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function _addToScene(mesh) {
    _scene.add(mesh);
    _templeMeshes.push(mesh);
    return mesh;
  }

  function _dist2d(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3d(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _getScene() {
    return _scene ||
      (window.GameManager && window.GameManager.scene) ||
      window.scene || null;
  }

  function _getCamera() {
    return _camera ||
      (window.GameManager && window.GameManager.camera) ||
      window.camera || null;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  MESSAGES                                                                */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _showMsg(text) {
    if (!_msgEl) {
      _msgEl = document.createElement('div');
      _msgEl.style.cssText = [
        'position:fixed',
        'bottom:90px',
        'left:50%',
        'transform:translateX(-50%)',
        'color:#FFEE44',
        'font-family:monospace',
        'font-size:15px',
        'font-weight:bold',
        'background:rgba(0,0,0,0.78)',
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
    _msgTimer = 3.5;
  }

  function _updateMsgTimer(dt) {
    if (_msgTimer > 0) {
      _msgTimer -= dt;
      if (_msgTimer <= 0 && _msgEl) { _msgEl.style.display = 'none'; }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  HUD                                                                     */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'tod-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.78)',
      'color:#FFCC44',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 16px',
      'border:1px solid #776633',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hud);
    _updateHUD();
  }

  function _removeHUD() {
    if (_hud && _hud.parentNode) { _hud.parentNode.removeChild(_hud); _hud = null; }
    if (_msgEl && _msgEl.parentNode) { _msgEl.parentNode.removeChild(_msgEl); _msgEl = null; }
  }

  function _updateHUD() {
    if (!_hud) { return; }
    if (!_active) { _hud.style.display = 'none'; return; }
    _hud.style.display = 'block';

    var aliveGuardians = 0;
    for (var i = 0; i < _guardians.length; i++) {
      if (!_guardians[i].dead) { aliveGuardians++; }
    }

    var idolStr = _idolCarried ? 'CARRIED' : (_idolTaken ? 'SECURED' : 'NOT TAKEN');
    var collapseStr = '';
    if (_collapsing) {
      collapseStr = ' [COLLAPSE: ' + Math.max(0, Math.ceil(_collapseTimer)) + 's remaining]';
    }
    var trapStr = _platesDisarmed ? 'disarmed' : 'active';

    _hud.textContent =
      'TEMPLE [CHAMBER: ' + _currentChamber + '/5]' +
      ' [IDOL: ' + idolStr + ']' +
      ' [GUARDIANS: ' + aliveGuardians + ']' +
      collapseStr +
      ' | TRAPS: ' + trapStr;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD TEMPLE STRUCTURE                                                  */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildTemple() {
    var sc = _getScene();

    /* Main stone structure 40x20x50 (0x887766) */
    var shell = _box(40, 20, 50, 0x887766);
    shell.position.set(0, 10, 0);
    _addToScene(shell);

    /* Ambient dim light */
    var amb = new THREE.AmbientLight(0x443322, 0.5);
    sc.add(amb);
    _templeMeshes.push(amb);

    /* Bas-relief decorations — LineSegments on outer walls (0x665544) */
    _buildBasRelief(-19.9, 10, 0, true);   /* west wall */
    _buildBasRelief( 19.9, 10, 0, true);   /* east wall */
    _buildBasRelief(0, 10, -24.9, false);  /* north wall */
    _buildBasRelief(0, 10,  24.9, false);  /* south wall */

    /* 5 sequential chambers (BoxGeometry 0x776655), 8x6x8 each,
       spaced 10 apart along Z axis, starting at z=-20 going north */
    var chamberDefs = [
      { z: -22, label: 'Chamber 1 — Pressure Plates' },
      { z: -10, label: 'Chamber 2 — Boulder Run'     },
      { z:   0, label: 'Chamber 3 — Spike Pit'       },
      { z:  10, label: 'Chamber 4 — Water Trap'       },
      { z:  20, label: 'Chamber 5 — Golden Idol'      }
    ];

    var ci;
    for (ci = 0; ci < 5; ci++) {
      var cdef = chamberDefs[ci];
      var cbox = _box(10, 7, 9, 0x776655);
      cbox.position.set(0, 3.5, cdef.z);
      _addToScene(cbox);

      /* Connecting passage 3x3x8 between chambers */
      if (ci < 4) {
        var passage = _box(3, 3, 8, 0x776655);
        passage.position.set(0, 1.5, cdef.z + 8.5);
        _addToScene(passage);
      }

      _chambers.push({ zCenter: cdef.z, zStart: cdef.z - 4.5, zEnd: cdef.z + 4.5 });

      /* Torch in each chamber */
      _buildTorch(-4, 5, cdef.z);
      _buildTorch( 4, 5, cdef.z);
    }
  }

  function _buildBasRelief(x, y, z, isWestEast) {
    var points = [];
    var i;
    /* zigzag decorative pattern */
    for (i = 0; i < 6; i++) {
      var t = (i / 5);
      if (isWestEast) {
        points.push(new THREE.Vector3(x, y - 4 + i * 1.6, z - 6 + t * 12));
        points.push(new THREE.Vector3(x, y - 3 + i * 1.6, z - 3 + t * 12));
      } else {
        points.push(new THREE.Vector3(x - 6 + t * 12, y - 4 + i * 1.6, z));
        points.push(new THREE.Vector3(x - 3 + t * 12, y - 3 + i * 1.6, z));
      }
    }
    /* cross symbols */
    for (i = 0; i < 3; i++) {
      var cx2 = isWestEast ? x : (x - 8 + i * 8);
      var cz2 = isWestEast ? (z - 8 + i * 8) : z;
      var cy2 = y;
      points.push(new THREE.Vector3(cx2, cy2 - 1, cz2));
      points.push(new THREE.Vector3(cx2, cy2 + 1, cz2));
      points.push(new THREE.Vector3(isWestEast ? cx2 : (cx2 - 1), cy2, isWestEast ? (cz2 - 1) : cz2));
      points.push(new THREE.Vector3(isWestEast ? cx2 : (cx2 + 1), cy2, isWestEast ? (cz2 + 1) : cz2));
    }
    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({ color: 0x665544 });
    var ls = new THREE.LineSegments(geo, mat);
    _addToScene(ls);
  }

  function _buildTorch(x, y, z) {
    /* Torch bracket (box) */
    var bracket = _box(0.3, 0.6, 0.3, 0x554433);
    bracket.position.set(x, y, z);
    _addToScene(bracket);

    /* Flame approximation — PointLight */
    var light = new THREE.PointLight(0xFFAA44, 1.2, 8);
    light.position.set(x, y + 0.5, z);
    _scene.add(light);
    _templeMeshes.push(light);
    _torchLights.push({ light: light, baseIntensity: 1.2, phase: Math.random() * Math.PI * 2 });
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  CHAMBER 1 — PRESSURE PLATES                                            */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildChamber1() {
    var ch = _chambers[0];
    var zc = ch.zCenter;

    /* 20 floor tiles 4 rows x 5 cols, some are pressure plates */
    var tileLayout = [
      [0,0,0,1,0],
      [0,1,0,0,0],
      [0,0,0,0,1],
      [1,0,0,0,0]
    ];
    /* correct step order is the 6 plates in row/col scan order: indices recorded below */
    _pressurePlateOrder = [];
    var plateIndex = 0;
    var row, col;
    for (row = 0; row < 4; row++) {
      for (col = 0; col < 5; col++) {
        var isPlate = (tileLayout[row][col] === 1);
        var tx = -4 + col * 2;
        var tz = zc - 3 + row * 2;
        var tileColor = isPlate ? 0x887766 : 0x776655;
        var tile = _box(1.8, 0.15, 1.8, tileColor);
        tile.position.set(tx, 0.075, tz);
        _addToScene(tile);
        var tileData = { mesh: tile, isPressurePlate: isPlate, triggered: false, plateIdx: -1 };
        if (isPlate) {
          tileData.plateIdx = plateIndex;
          _pressurePlateOrder.push(plateIndex);
          plateIndex++;
        }
        _tiles.push(tileData);
      }
    }

    /* Clue symbols on north wall — correct order as Roman numerals I-VI */
    _buildPlateClueSymbols(zc);
  }

  function _buildPlateClueSymbols(zc) {
    /* Six symbols arranged showing press order: I II III IV V VI */
    var i;
    for (i = 0; i < 6; i++) {
      var pts = [];
      var sx = -5 + i * 2;
      var sy = 4;
      var sz = zc - 4.3;
      /* vertical stroke */
      pts.push(new THREE.Vector3(sx, sy, sz));
      pts.push(new THREE.Vector3(sx, sy + 0.8, sz));
      /* mark i+1 with extra ticks */
      var ti;
      for (ti = 0; ti <= i; ti++) {
        pts.push(new THREE.Vector3(sx - 0.15, sy + 0.4 + ti * 0.15, sz));
        pts.push(new THREE.Vector3(sx + 0.15, sy + 0.4 + ti * 0.15, sz));
      }
      var geo = new THREE.BufferGeometry().setFromPoints(pts);
      var mat = new THREE.LineBasicMaterial({ color: 0x665544 });
      var ls = new THREE.LineSegments(geo, mat);
      _addToScene(ls);
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  CHAMBER 2 — BOULDER RUN                                                */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildChamber2() {
    var ch = _chambers[1];
    var zc = ch.zCenter;

    /* Giant boulder r=3 (0x998877) at far north end of chamber */
    _boulder = _sphere(3, 10, 0x998877);
    _boulder.position.set(0, 3, zc - 20);
    _addToScene(_boulder);

    /* Side alcoves (BoxGeometry 0x665544) to dodge into */
    var alcovePositions = [
      { x: -7, z: zc - 2 },
      { x:  7, z: zc - 2 },
      { x: -7, z: zc + 2 },
      { x:  7, z: zc + 2 }
    ];
    var i;
    for (i = 0; i < alcovePositions.length; i++) {
      var alc = _box(3, 4, 4, 0x665544);
      alc.position.set(alcovePositions[i].x, 2, alcovePositions[i].z);
      _addToScene(alc);
      _alcoves.push({ mesh: alc, x: alcovePositions[i].x, z: alcovePositions[i].z });
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  CHAMBER 3 — SPIKE PIT                                                  */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildChamber3() {
    var ch = _chambers[2];
    var zc = ch.zCenter;

    /* Pit floor (PlaneGeometry 10x10) */
    var pitGeo = new THREE.PlaneGeometry(10, 10);
    var pitMat = new THREE.MeshLambertMaterial({ color: 0x221100 });
    var pit = new THREE.Mesh(pitGeo, pitMat);
    pit.rotation.x = -Math.PI / 2;
    pit.position.set(0, -2, zc);
    _addToScene(pit);

    _pitZStart = zc - 5;
    _pitZEnd   = zc + 5;

    /* Spikes (CylinderGeometry 0x888866) */
    var si;
    for (si = 0; si < 12; si++) {
      var sx = -4 + (si % 4) * 2.5;
      var sz = zc - 3 + Math.floor(si / 4) * 3;
      var spike = _cyl(0.08, 0.15, 1.5, 5, 0x888866);
      spike.position.set(sx, -1.25, sz);
      _addToScene(spike);
    }

    /* Rope LineSegments on east side — swing across */
    var ropePts = [];
    var ri;
    for (ri = 0; ri <= 8; ri++) {
      var t = ri / 8;
      /* pendulum arc: hangs from above */
      ropePts.push(new THREE.Vector3(5, 6 - t * 4, zc - 4 + t * 8));
    }
    var ropeGeo = new THREE.BufferGeometry().setFromPoints(ropePts);
    var ropeMat = new THREE.LineBasicMaterial({ color: 0xAA8833 });
    _ropeMesh = new THREE.LineSegments(ropeGeo, ropeMat);
    _addToScene(_ropeMesh);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  CHAMBER 4 — WATER TRAP                                                 */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildChamber4() {
    var ch = _chambers[3];
    var zc = ch.zCenter;

    /* Water surface (PlaneGeometry) rising */
    var wGeo = new THREE.PlaneGeometry(9, 9);
    var wMat = new THREE.MeshLambertMaterial({ color: 0x224488, transparent: true, opacity: 0.6 });
    _waterMesh = new THREE.Mesh(wGeo, wMat);
    _waterMesh.rotation.x = -Math.PI / 2;
    _waterMesh.position.set(0, -0.5, zc);
    _addToScene(_waterMesh);
    _waterLevel = -0.5;
    _waterRising = true;

    /* Drain valve (BoxGeometry 0x446644) on east wall */
    _drainValve = _box(0.8, 0.8, 0.5, 0x446644);
    _drainValve.position.set(4.5, 2, zc);
    _addToScene(_drainValve);

    /* Hidden passage (BoxGeometry 0x776655) in south wall — initially same color as wall */
    _hiddenPassage = _box(2, 2.5, 0.3, 0x776655);
    _hiddenPassage.position.set(0, 1.25, zc + 4.2);
    _addToScene(_hiddenPassage);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  CHAMBER 5 — GOLDEN IDOL                                                */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildChamber5() {
    var ch = _chambers[4];
    var zc = ch.zCenter;

    /* Pedestal (BoxGeometry 0x887755) */
    _idolPedestal = _box(2, 1.5, 2, 0x887755);
    _idolPedestal.position.set(0, 0.75, zc);
    _addToScene(_idolPedestal);

    /* Golden idol (BoxGeometry 0xFFCC00, emissive) */
    _idolMesh = _box(0.8, 1.2, 0.5, 0xFFCC00, 0xFFCC00);
    _idolMesh.position.set(0, 2.1, zc);
    _addToScene(_idolMesh);

    /* Sandbag near player start — can be picked up for swap */
    _sandbagMesh = _box(0.8, 0.7, 0.5, 0xAA8833);
    _sandbagMesh.position.set(-3, 0.35, zc + 3);
    _addToScene(_sandbagMesh);
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  CULT GUARDIANS — 8 robed priests (BoxGeometry 0x662211)               */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildGuardians() {
    /* Place 8 guardians in alcoves spread across all chambers */
    var guardianPositions = [
      { x: -6, z: -22, ch: 0 },
      { x:  6, z: -22, ch: 0 },
      { x: -6, z: -10, ch: 1 },
      { x:  6, z: -10, ch: 1 },
      { x: -6, z:   0, ch: 2 },
      { x:  6, z:   0, ch: 2 },
      { x: -6, z:  10, ch: 3 },
      { x:  6, z:  20, ch: 4 }
    ];

    var i;
    for (i = 0; i < 8; i++) {
      var pos = guardianPositions[i];
      var group = new THREE.Group();
      group.position.set(pos.x, 0, pos.z);

      /* Robe body */
      var body = _box(0.9, 1.8, 0.5, 0x662211);
      body.position.set(0, 0.9, 0);
      group.add(body);

      /* Cowl head */
      var head = _box(0.55, 0.55, 0.55, 0x551100);
      head.position.set(0, 1.975, 0);
      group.add(head);

      /* Ceremonial dagger (LineSegments) */
      var dagPts = [
        new THREE.Vector3(0.5, 0.8, 0),
        new THREE.Vector3(0.5, 1.5, 0),
        new THREE.Vector3(0.4, 1.5, 0),
        new THREE.Vector3(0.6, 1.5, 0)
      ];
      var dagGeo = new THREE.BufferGeometry().setFromPoints(dagPts);
      var dagMat = new THREE.LineBasicMaterial({ color: 0xAA9966 });
      var dagger = new THREE.LineSegments(dagGeo, dagMat);
      group.add(dagger);

      _scene.add(group);
      _templeMeshes.push(group);

      _guardians.push({
        group:     group,
        hp:        80,
        active:    false,
        dead:      false,
        chamberIdx: pos.ch,
        homeX:     pos.x,
        homeZ:     pos.z,
        meleeTimer: 0
      });
    }

    _guardianCount = 8;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  COLLAPSE SEQUENCE debris                                               */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _spawnDebris(chamberIdx) {
    var zc = _chambers[chamberIdx].zCenter;
    var i;
    for (i = 0; i < 6; i++) {
      var debris = _box(
        0.8 + Math.random() * 1.2,
        0.6 + Math.random() * 0.8,
        0.8 + Math.random() * 1.0,
        0x887766
      );
      debris.position.set(
        (Math.random() - 0.5) * 8,
        12 + Math.random() * 4,
        zc + (Math.random() - 0.5) * 8
      );
      _addToScene(debris);
      _debrisList.push({
        mesh: debris,
        fallSpeed: 0,
        active: true,
        chamberIdx: chamberIdx
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BUILD PLAYER                                                           */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _buildPlayer() {
    var group = new THREE.Group();
    var body = _box(0.6, 1.6, 0.4, 0x334455);
    body.position.set(0, 0.8, 0);
    group.add(body);
    group.position.set(0, 0, 28);
    _scene.add(group);
    _templeMeshes.push(group);
    _player = group;
    _playerPos = group.position;
    _playerHP = 100;
    _yaw = 0;

    var cam = _getCamera();
    if (cam) {
      cam.position.set(0, 5, 34);
      cam.lookAt(0, 1, 28);
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  ACTIVATE / DEACTIVATE                                                  */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _activate() {
    if (_active) { return; }
    var sc = _getScene();
    if (!sc) { return; }
    _scene = sc;
    _active = true;

    /* Save scene bg */
    _bgBackup  = sc.background;
    _fogBackup = sc.fog;
    sc.background = new THREE.Color(0x111008);
    sc.fog = new THREE.FogExp2(0x221100, 0.025);

    /* Build everything */
    _buildTemple();
    _buildChamber1();
    _buildChamber2();
    _buildChamber3();
    _buildChamber4();
    _buildChamber5();
    _buildGuardians();
    _buildPlayer();
    _buildHUD();

    _currentChamber = 0;
    _collapseTimer  = 90;
    _collapsing     = false;
    _boulderRolling = false;
    _waterRising    = true;
    _waterLevel     = -0.5;
    _platesDisarmed = false;
    _playerPlateOrder = [];

    _showMsg('TEMPLE OF DOOM — Find the Golden Idol! [T+D to exit]');
    _updateHUD();
  }

  var _bgBackup  = null;
  var _fogBackup = null;

  function _deactivate() {
    if (!_active) { return; }
    _active = false;

    /* Restore scene */
    if (_scene) {
      if (_bgBackup !== undefined)  { _scene.background = _bgBackup; }
      if (_fogBackup !== undefined) { _scene.fog = _fogBackup; }
    }

    /* Remove all temple meshes */
    var i;
    for (i = 0; i < _templeMeshes.length; i++) {
      if (_scene) { _scene.remove(_templeMeshes[i]); }
      if (_templeMeshes[i].geometry) { _templeMeshes[i].geometry.dispose(); }
      if (_templeMeshes[i].material) { _templeMeshes[i].material.dispose(); }
    }
    _templeMeshes = [];

    /* Remove bolt projectiles */
    for (i = 0; i < _bolts.length; i++) {
      if (_scene) { _scene.remove(_bolts[i].mesh); }
    }

    _removeHUD();
    _resetState();
    _updateHUD();
  }

  function _resetState() {
    _torchLights     = [];
    _chambers        = [];
    _tiles           = [];
    _pressurePlateOrder = [];
    _playerPlateOrder   = [];
    _bolts           = [];
    _platesDisarmed  = false;
    _boulder         = null;
    _boulderRolling  = false;
    _alcoves         = [];
    _ropeMesh        = null;
    _ropeGrabbed     = false;
    _ropeTimer       = 0;
    _ropeSwinging    = false;
    _swingProgress   = 0;
    _pitFallen       = false;
    _playerOverPit   = false;
    _waterMesh       = null;
    _waterLevel      = -0.5;
    _waterRising     = false;
    _drainValve      = null;
    _drainProgress   = 0;
    _draining        = false;
    _hiddenPassage   = null;
    _passageRevealed = false;
    _passageUsed     = false;
    _ch4Cleared      = false;
    _idolMesh        = null;
    _idolPedestal    = null;
    _sandbagMesh     = null;
    _sandbagSwapped  = false;
    _idolCarried     = false;
    _idolTaken       = false;
    _guardians       = [];
    _guardianCount   = 0;
    _collapsing      = false;
    _collapseTimer   = 90;
    _debrisList      = [];
    _collapseByRoom  = [false, false, false, false, false];
    _player          = null;
    _playerPos       = null;
    _playerHP        = 100;
    _yaw             = 0;
    _currentChamber  = 0;
    _gameTime        = 0;
    _msgTimer        = 0;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  DETERMINE CURRENT CHAMBER                                              */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateCurrentChamber() {
    if (!_playerPos) { return; }
    var pz = _playerPos.z;
    var i;
    for (i = 0; i < _chambers.length; i++) {
      if (pz >= _chambers[i].zStart && pz <= _chambers[i].zEnd) {
        _currentChamber = i + 1;
        return;
      }
    }
    /* in a passage or exterior */
    if (pz > _chambers[4].zEnd) { _currentChamber = 0; }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  PLAYER UPDATE                                                          */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updatePlayer(dt) {
    if (!_player || !_playerPos) { return; }

    var speed = 5;
    var fwd   = new THREE.Vector3(0, 0, -1);
    fwd.applyAxisAngle(new THREE.Vector3(0, 1, 0), _yaw);
    var right = new THREE.Vector3(1, 0, 0);
    right.applyAxisAngle(new THREE.Vector3(0, 1, 0), _yaw);

    if (_keys['KeyW'] || _keys['w'] || _keys['ArrowUp'])    { _playerPos.addScaledVector(fwd,   speed * dt); }
    if (_keys['KeyS'] || _keys['s'] || _keys['ArrowDown'])  { _playerPos.addScaledVector(fwd,  -speed * dt); }
    if (_keys['KeyA'] || _keys['a'] || _keys['ArrowLeft'])  { _playerPos.addScaledVector(right, -speed * dt); }
    if (_keys['KeyD'] || _keys['d'] || _keys['ArrowRight']) { _playerPos.addScaledVector(right,  speed * dt); }

    /* Clamp to temple bounds */
    _playerPos.x = Math.max(-18, Math.min(18, _playerPos.x));
    _playerPos.z = Math.max(-26, Math.min(30, _playerPos.z));
    _playerPos.y = Math.max(0, _playerPos.y);

    _player.position.copy(_playerPos);
    _player.rotation.y = _yaw;

    var cam = _getCamera();
    if (cam) {
      var offset = new THREE.Vector3(0, 5, 8);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), _yaw);
      cam.position.copy(_playerPos).add(offset);
      cam.rotation.order = 'YXZ';
      cam.rotation.y = _yaw;
    }

    /* E key edge */
    var eDown = !!(_keys['KeyE'] || _keys['e']);
    if (eDown && !_prevEKey) { _tryInteract(); }
    _prevEKey = eDown;

    /* Q key edge — melee kill */
    var qDown = !!(_keys['KeyQ'] || _keys['q']);
    if (qDown && !_prevQKey) { _tryMeleeKill(); }
    _prevQKey = qDown;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  INTERACT (E)                                                           */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _tryInteract() {
    if (!_playerPos) { return; }
    var px = _playerPos.x;
    var pz = _playerPos.z;

    /* Chamber 3 — grab rope */
    if (_ropeMesh && !_ropeGrabbed && !_ropeSwinging) {
      var rp = _ropeMesh.position;
      if (_dist2d(px, pz, 5, _chambers[2].zCenter - 4) < 3) {
        _ropeGrabbed  = true;
        _ropeSwinging = true;
        _ropeTimer    = 0;
        _swingProgress = 0;
        _showMsg('ROPE GRABBED — Swing! Timing is critical (1s window)!');
        return;
      }
    }

    /* Chamber 4 — drain valve (hold E 4s handled in update) */
    if (_drainValve && !_draining && !_ch4Cleared) {
      if (_dist2d(px, pz, 4.5, _chambers[3].zCenter) < 2) {
        _draining = true;
        _drainProgress = 0;
        _showMsg('Opening drain valve... hold E for 4 seconds');
        return;
      }
    }

    /* Chamber 4 — hidden passage search */
    if (_hiddenPassage && !_passageRevealed && !_ch4Cleared) {
      if (_dist2d(px, pz, 0, _chambers[3].zCenter + 4.2) < 2) {
        _passageRevealed = true;
        _hiddenPassage.material.color.setHex(0x445533);
        _showMsg('HIDDEN PASSAGE REVEALED — move through the south wall!');
        return;
      }
    }

    /* Chamber 5 — idol swap */
    if (_idolMesh && !_idolTaken && !_idolCarried) {
      if (_dist2d(px, pz, 0, _chambers[4].zCenter) < 3) {
        if (_sandbagMesh) {
          /* swap simultaneously — sandbag must be nearby */
          if (_dist2d(px, pz, _sandbagMesh.position.x, _sandbagMesh.position.z) < 5) {
            _performIdolSwap();
            return;
          }
        }
        /* wrong weight — trigger collapse */
        _showMsg('NO SANDBAG NEARBY! Wrong weight — COLLAPSE BEGINS!');
        _triggerCollapse();
        return;
      }
    }
  }

  function _performIdolSwap() {
    _sandbagSwapped = true;
    _idolCarried    = true;

    /* Move sandbag to pedestal */
    if (_sandbagMesh && _idolPedestal) {
      _sandbagMesh.position.copy(_idolPedestal.position);
      _sandbagMesh.position.y = _idolPedestal.position.y + 1.1;
    }

    /* Hide idol (player carrying it) */
    if (_idolMesh) { _idolMesh.visible = false; }

    _showMsg('IDOL SWAPPED! Sandbag is equal weight. Now GET OUT!');
    _triggerCollapse();
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  MELEE KILL (Q) — only way to kill guardians                           */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _tryMeleeKill() {
    if (!_playerPos) { return; }
    var i;
    for (i = 0; i < _guardians.length; i++) {
      var g = _guardians[i];
      if (g.dead || !g.active) { continue; }
      var d = _dist3d(_playerPos, g.group.position);
      if (d < 2.5) {
        g.hp -= 40;
        if (g.hp <= 0) {
          g.dead = true;
          g.group.visible = false;
          _guardianCount = Math.max(0, _guardianCount - 1);
          _showMsg('GUARDIAN KILLED WITH KNIFE! [Q]');
        } else {
          _showMsg('Guardian hit! [Q again to finish]');
        }
        _updateHUD();
        return;
      }
    }
    _showMsg('No guardian in range — use Q when close!');
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  CHAMBER 1 — PRESSURE PLATE LOGIC                                      */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateChamber1(dt) {
    if (_platesDisarmed) { return; }
    if (!_playerPos)     { return; }
    var px = _playerPos.x;
    var pz = _playerPos.z;

    /* Check if player steps on any plate */
    var i;
    for (i = 0; i < _tiles.length; i++) {
      var t = _tiles[i];
      if (!t.isPressurePlate || t.triggered) { continue; }
      var tx = t.mesh.position.x;
      var tz = t.mesh.position.z;
      if (Math.abs(px - tx) < 0.9 && Math.abs(pz - tz) < 0.9) {
        t.triggered = true;
        _playerPlateOrder.push(t.plateIdx);
        t.mesh.material.color.setHex(0x554433);
        _checkPlateOrder(t.plateIdx);
      }
    }

    /* Check if all 6 plates stepped correctly */
    if (_playerPlateOrder.length >= _pressurePlateOrder.length && !_platesDisarmed) {
      _platesDisarmed = true;
      _showMsg('ALL PRESSURE PLATES DISARMED! Passage is safe!');
      _updateHUD();
    }

    /* Update flying bolts */
    var toRemove = [];
    for (i = 0; i < _bolts.length; i++) {
      var b = _bolts[i];
      b.mesh.position.x += b.vel.x * dt;
      b.mesh.position.y += b.vel.y * dt;
      b.mesh.position.z += b.vel.z * dt;
      b.life -= dt;

      /* Hit player */
      if (_playerPos && _dist3d(b.mesh.position, _playerPos) < 0.8) {
        _damagePlayer(50, 'ARROW BOLT HIT! -50 HP!');
        _scene.remove(b.mesh);
        toRemove.push(i);
        continue;
      }
      if (b.life <= 0) {
        _scene.remove(b.mesh);
        toRemove.push(i);
      }
    }
    for (i = toRemove.length - 1; i >= 0; i--) { _bolts.splice(toRemove[i], 1); }
  }

  function _checkPlateOrder(stepIdx) {
    var pos = _playerPlateOrder.length - 1;
    var expected = _pressurePlateOrder[pos];
    if (stepIdx !== expected) {
      /* Wrong order — fire bolts from walls */
      _fireBolts();
      _showMsg('WRONG ORDER! BOLTS FIRED! -50 HP!');
      /* Reset plate state */
      var i;
      for (i = 0; i < _tiles.length; i++) {
        if (_tiles[i].isPressurePlate) {
          _tiles[i].triggered = false;
          _tiles[i].mesh.material.color.setHex(0x887766);
        }
      }
      _playerPlateOrder = [];
    } else {
      _showMsg('Plate ' + (pos + 1) + '/' + _pressurePlateOrder.length + ' correct');
    }
  }

  function _fireBolts() {
    var i;
    var ch1z = _chambers[0].zCenter;
    var wallPositions = [
      { x: -4.5, y: 1.5, z: ch1z - 2, vx:  0.5, vy: 0, vz: 0.1 },
      { x:  4.5, y: 1.5, z: ch1z - 1, vx: -0.5, vy: 0, vz: 0.1 },
      { x: -4.5, y: 1.5, z: ch1z + 1, vx:  0.5, vy: 0, vz:-0.1 },
      { x:  4.5, y: 1.5, z: ch1z + 2, vx: -0.5, vy: 0, vz:-0.1 }
    ];
    for (i = 0; i < wallPositions.length; i++) {
      var wp = wallPositions[i];
      var bolt = _cyl(0.04, 0.04, 0.5, 5, 0x886644);
      bolt.rotation.z = Math.PI / 2;
      bolt.position.set(wp.x, wp.y, wp.z);
      _scene.add(bolt);
      _templeMeshes.push(bolt);
      var speed = 12;
      _bolts.push({
        mesh: bolt,
        vel: new THREE.Vector3(wp.vx * speed, 0, wp.vz * speed),
        life: 2.0
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  CHAMBER 2 — BOULDER UPDATE                                            */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateChamber2(dt) {
    if (!_boulder) { return; }

    /* Trigger boulder when player enters chamber 2 */
    if (!_boulderRolling && _currentChamber === 2) {
      _boulderRolling = true;
      _showMsg('BOULDER ROLLING DOWN — DODGE INTO THE ALCOVES!');
    }

    if (!_boulderRolling) { return; }

    _boulder.position.z += _boulderSpeed * dt;
    _boulder.rotation.x += dt * 3;

    /* Boulder hits player */
    if (_playerPos) {
      var bd = _dist2d(_boulder.position.x, _boulder.position.z, _playerPos.x, _playerPos.z);
      if (bd < 3.5) {
        /* Check if player is in alcove */
        var inAlcove = false;
        var ai;
        for (ai = 0; ai < _alcoves.length; ai++) {
          var alc = _alcoves[ai];
          if (_dist2d(_playerPos.x, _playerPos.z, alc.x, alc.z) < 2.5) {
            inAlcove = true;
            break;
          }
        }
        if (!inAlcove) {
          _damagePlayer(200, 'CRUSHED BY BOULDER! INSTANT DEATH!');
        }
      }
    }

    /* Boulder also crushes guardians in its path */
    var gi;
    for (gi = 0; gi < _guardians.length; gi++) {
      var g = _guardians[gi];
      if (g.dead) { continue; }
      var gd = _dist2d(_boulder.position.x, _boulder.position.z, g.group.position.x, g.group.position.z);
      if (gd < 3.5) {
        g.dead = true;
        g.group.visible = false;
        _guardianCount = Math.max(0, _guardianCount - 1);
        _showMsg('BOULDER CRUSHED A GUARDIAN!');
        _updateHUD();
      }
    }

    /* Reset boulder when it exits */
    if (_boulder.position.z > 30) {
      _boulder.position.set(0, 3, _chambers[1].zCenter - 20);
      _boulderRolling = false;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  CHAMBER 3 — SPIKE PIT / ROPE SWING                                   */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateChamber3(dt) {
    if (!_playerPos) { return; }
    var pz = _playerPos.z;
    var ch3 = _chambers[2];

    /* Check if player is over the pit without rope */
    var overPit = (pz > ch3.zStart && pz < ch3.zEnd && Math.abs(_playerPos.x) < 4.5);

    if (overPit && !_ropeSwinging && !_pitFallen) {
      _pitFallen = true;
      _playerPos.y = -2;
      _damagePlayer(80, 'FELL INTO SPIKE PIT! -80 HP!');
      _showMsg('Spike pit fall! Grab the rope EAST side first!');
      return;
    }

    /* Rope swing update */
    if (_ropeSwinging) {
      _ropeTimer += dt;
      _swingProgress = _ropeTimer / _ropeWindow;

      /* Animate rope position (carry player across) */
      if (_playerPos && _swingProgress < 1.0) {
        var startX = 5;
        var endX   = -5;
        _playerPos.x = startX + (_swingProgress) * (endX - startX);
        _playerPos.z = ch3.zCenter + Math.sin(_swingProgress * Math.PI) * 3;
        _playerPos.y = 1 + Math.sin(_swingProgress * Math.PI) * 1.5;
      }

      if (_ropeTimer >= _ropeWindow) {
        /* Landed on far side */
        _ropeSwinging   = false;
        _ropeGrabbed    = false;
        _pitFallen      = false;
        _playerPos.x    = -5;
        _playerPos.z    = ch3.zEnd + 1;
        _playerPos.y    = 0;
        _showMsg('Rope swing SUCCESS! You crossed the spike pit!');
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  CHAMBER 4 — WATER TRAP UPDATE                                         */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateChamber4(dt) {
    if (_ch4Cleared) { return; }

    /* Water rises */
    if (_waterRising && _waterMesh) {
      _waterLevel += 0.5 * dt;
      _waterMesh.position.y = _waterLevel;

      /* Player drowns if water above head */
      if (_playerPos && _playerPos.z > _chambers[3].zStart && _playerPos.z < _chambers[3].zEnd) {
        if (_waterLevel > _playerPos.y + 1.8) {
          _damagePlayer(3, 'DROWNING! GET OUT!');
        }
      }

      if (_waterLevel > 6) {
        _waterLevel = 6;
        _waterMesh.position.y = 6;
      }
    }

    /* Drain valve hold-E interaction */
    if (_draining && _playerPos) {
      var eDown = !!(_keys['KeyE'] || _keys['e']);
      if (!eDown) {
        _draining = false;
        _drainProgress = 0;
        return;
      }
      if (_dist2d(_playerPos.x, _playerPos.z, 4.5, _chambers[3].zCenter) > 3) {
        _draining = false;
        _drainProgress = 0;
        return;
      }
      _drainProgress += dt;
      if (_drainProgress >= 4) {
        _draining = false;
        _waterRising = false;
        /* Water drains fast */
        _waterLevel = -2;
        if (_waterMesh) { _waterMesh.position.y = _waterLevel; _waterMesh.visible = false; }
        _drainValve.material.color.setHex(0x88CC88);
        _ch4Cleared = true;
        _showMsg('DRAIN VALVE OPENED! Water draining!');
      }
    }

    /* Hidden passage escape */
    if (_passageRevealed && !_passageUsed && _playerPos) {
      if (_dist2d(_playerPos.x, _playerPos.z, 0, _chambers[3].zCenter + 4.2) < 1.5) {
        _passageUsed = true;
        _ch4Cleared  = true;
        _waterRising = false;
        /* Teleport player to chamber 5 side */
        _playerPos.z = _chambers[4].zCenter - 5;
        _playerPos.y = 0;
        _showMsg('HIDDEN PASSAGE — shortcut to Chamber 5!');
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  GUARDIAN AI UPDATE                                                     */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateGuardians(dt) {
    if (!_playerPos) { return; }
    var px = _playerPos.x;
    var pz = _playerPos.z;
    var i;

    for (i = 0; i < _guardians.length; i++) {
      var g = _guardians[i];
      if (g.dead) { continue; }

      /* Activate when player enters same chamber */
      if (!g.active) {
        var gch = _chambers[g.chamberIdx];
        if (pz > gch.zStart - 5 && pz < gch.zEnd + 5) {
          g.active = true;
          /* Materialise from alcove */
          g.group.position.set(g.homeX, 0, g.homeZ);
          _showMsg('GUARDIAN EMERGES! Use Q to knife them — bullets useless!');
        }
        continue;
      }

      /* Move toward player */
      var dx = px - g.group.position.x;
      var dz = pz - g.group.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 1.5) {
        var speed = 2.5;
        g.group.position.x += (dx / dist) * speed * dt;
        g.group.position.z += (dz / dist) * speed * dt;
        g.group.rotation.y = Math.atan2(dx, dz);
      }

      /* Melee attack player */
      g.meleeTimer -= dt;
      if (dist < 2 && g.meleeTimer <= 0) {
        g.meleeTimer = 2.0;
        _damagePlayer(12, 'GUARDIAN DAGGER STRIKE! -12 HP! Press Q to counter!');
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  COLLAPSE SEQUENCE                                                      */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _triggerCollapse() {
    if (_collapsing) { return; }
    _collapsing    = true;
    _collapseTimer = 90;
    _idolTaken     = true;
    if (_idolCarried) { _idolTaken = true; }
    _showMsg('TEMPLE COLLAPSING! 90 SECONDS TO ESCAPE!');
    _updateHUD();

    /* Spawn debris in all chambers from last to first */
    var ci;
    for (ci = 0; ci < 5; ci++) {
      _spawnDebris(ci);
    }
  }

  function _updateCollapse(dt) {
    if (!_collapsing) { return; }
    _collapseTimer -= dt;

    /* Debris falls */
    var i;
    for (i = 0; i < _debrisList.length; i++) {
      var db = _debrisList[i];
      if (!db.active) { continue; }
      db.fallSpeed += 9.8 * dt;
      db.mesh.position.y -= db.fallSpeed * dt;
      db.mesh.rotation.x += dt * 1.5;
      db.mesh.rotation.z += dt * 0.8;

      /* Hit player */
      if (_playerPos && _dist3d(db.mesh.position, _playerPos) < 1.5) {
        _damagePlayer(60, 'FALLING DEBRIS! -60 HP!');
        db.active = false;
        db.mesh.visible = false;
      }

      /* Land */
      if (db.mesh.position.y < 0) {
        db.mesh.position.y = 0;
        db.active = false;
      }
    }

    /* Countdown messages */
    if (_collapseTimer <= 30 && _collapseTimer > 29.5) {
      _showMsg('30 SECONDS LEFT — RUN!');
    }
    if (_collapseTimer <= 10 && _collapseTimer > 9.5) {
      _showMsg('10 SECONDS! GO GO GO!');
    }

    /* Player escapes if they reach south entrance */
    if (_playerPos && _playerPos.z > 26 && _idolCarried) {
      _collapsing   = false;
      _idolTaken    = true;
      _idolCarried  = false;
      _showMsg('YOU ESCAPED WITH THE IDOL! THE TEMPLE FALLS!');
      _updateHUD();
    }

    /* Time up */
    if (_collapseTimer <= 0) {
      _collapsing = false;
      _damagePlayer(_playerHP, 'TEMPLE COLLAPSED — YOU ARE BURIED ALIVE!');
      _showMsg('BURIED ALIVE! Game over!');
      _updateHUD();
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  DAMAGE                                                                 */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _damagePlayer(amount, msg) {
    _playerHP = Math.max(0, _playerHP - amount);
    _showMsg(msg || ('-' + amount + ' HP!'));
    if (_playerHP <= 0) {
      _showMsg('YOU DIED IN THE TEMPLE!');
    }
    /* Propagate to host game */
    if (_player && _player.hp !== undefined) { _player.hp = _playerHP; }
    if (window.GameManager && window.GameManager.takeDamage) {
      window.GameManager.takeDamage(amount);
    }
    _updateHUD();
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  TORCH FLICKER                                                          */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _updateTorches(dt) {
    var i;
    for (i = 0; i < _torchLights.length; i++) {
      var tl = _torchLights[i];
      tl.phase += dt * (3 + Math.random() * 4);
      tl.light.intensity = tl.baseIntensity + Math.sin(tl.phase) * 0.35 + (Math.random() - 0.5) * 0.2;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  INPUT HANDLERS                                                         */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _onKeyDown(e) {
    var k = e.code || e.key;
    _keys[k] = true;

    /* Activation: T+D both within 400ms */
    var now = performance.now();
    if (k === 'KeyT' || k === 't' || k === 'T') {
      _tPressTime = now;
    }
    if (k === 'KeyD' || k === 'd' || k === 'D') {
      _dPressTime = now;
    }

    /* Check simultaneous T+D */
    if (_tPressTime > 0 && _dPressTime > 0) {
      if (Math.abs(_tPressTime - _dPressTime) < 400) {
        if (_active) {
          _deactivate();
        } else {
          _activate();
        }
        _tPressTime = 0;
        _dPressTime = 0;
      }
    }
  }

  function _onKeyUp(e) {
    var k = e.code || e.key;
    _keys[k] = false;
  }

  function _onMouseMove(e) {
    if (!_active) { return; }
    _yaw -= e.movementX * 0.002;
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  MAIN UPDATE                                                            */
  /* ─────────────────────────────────────────────────────────────────────── */

  function _update(dt) {
    if (!_active) { return; }
    _gameTime += dt;

    _updateMsgTimer(dt);
    _updateCurrentChamber();
    _updatePlayer(dt);
    _updateTorches(dt);
    _updateGuardians(dt);
    _updateChamber1(dt);
    _updateChamber2(dt);
    _updateChamber3(dt);
    _updateChamber4(dt);
    _updateCollapse(dt);
    _updateHUD();
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  PUBLIC API                                                             */
  /* ─────────────────────────────────────────────────────────────────────── */

  function init(scene, camera) {
    _scene  = scene  || null;
    _camera = camera || null;
    document.addEventListener('keydown',   _onKeyDown,   false);
    document.addEventListener('keyup',     _onKeyUp,     false);
    document.addEventListener('mousemove', _onMouseMove, false);
  }

  function update(dt) {
    if (!dt || dt <= 0) { dt = 0.016; }
    _update(dt);
  }

  function reset() {
    if (_active) { _deactivate(); }
    document.removeEventListener('keydown',   _onKeyDown,   false);
    document.removeEventListener('keyup',     _onKeyUp,     false);
    document.removeEventListener('mousemove', _onMouseMove, false);
    _resetState();
  }

  return { init: init, update: update, reset: reset };

}());
