/* ─────────────────────────────────────────────────────────────────────────────
   haunted-manor.js — Haunted Victorian Manor FPS Mini-Game
   API: window.HauntedManor = { init, update, reset }
   Activation: H + M simultaneous keypress (both keys held)

   Theme: Occult crime boss uses a haunted Victorian manor as headquarters
   for summoning rituals and money laundering. Player must neutralize the
   operation and destroy the 5 summoning artifacts.

   Controls:
     H + M  → toggle on/off
     WASD   → move
     Mouse  → look
   ───────────────────────────────────────────────────────────────────────── */

window.HauntedManor = (function () {
  'use strict';

  /* ── Scene references ─────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;

  /* ── State ────────────────────────────────────────────────────────────── */
  var _active        = false;
  var _time          = 0;
  var _artifactsDestroyed = 0;
  var _artifactTotal = 5;

  /* ── Player ───────────────────────────────────────────────────────────── */
  var _playerPos   = { x: 0, y: 1.7, z: 8 };
  var _playerSpeed = 5;
  var _yaw         = 0;
  var _pitch       = 0;
  var _keys        = {};

  /* ── Key combo tracking (both held) ──────────────────────────────────── */
  var _hKeyDown = false;
  var _mKeyDown = false;

  /* ── Scene objects (tracked for cleanup) ─────────────────────────────── */
  var _objects        = [];   // all meshes/lights added to scene
  var _ghosts         = [];   // { mesh, speed, dir, timer, range, origin }
  var _artifacts      = [];   // { mesh, destroyed }
  var _flickerLight   = null; // PointLight that oscillates
  var _fogBackup      = null; // original fog before init

  /* ── HUD ──────────────────────────────────────────────────────────────── */
  var _hudEl       = null;
  var _notifEl     = null;
  var _notifTimer  = 0;

  /* ── Mouse lock ───────────────────────────────────────────────────────── */
  var _mouseLocked = false;

  /* ═══════════════════════════════════════════════════════════════════════
     HUD
  ═══════════════════════════════════════════════════════════════════════ */

  function _createHud() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'haunted-manor-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:16px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(10,0,20,0.82)',
      'color:#c084fc',
      'font-family:"Courier New",monospace',
      'font-size:15px',
      'font-weight:bold',
      'padding:8px 20px',
      'border:1px solid #7c3aed',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9000',
      'letter-spacing:1px',
      'text-shadow:0 0 8px #a855f7'
    ].join(';');
    _hudEl.textContent = 'ARTIFACTS DESTROYED: 0/5';
    document.body.appendChild(_hudEl);

    _notifEl = document.createElement('div');
    _notifEl.id = 'haunted-manor-notif';
    _notifEl.style.cssText = [
      'position:fixed',
      'top:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(20,0,40,0.88)',
      'color:#f0abfc',
      'font-family:"Courier New",monospace',
      'font-size:13px',
      'padding:6px 16px',
      'border:1px solid #a855f7',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9001',
      'opacity:0',
      'transition:opacity 0.3s',
      'text-shadow:0 0 6px #c084fc'
    ].join(';');
    document.body.appendChild(_notifEl);
  }

  function _updateHud() {
    if (_hudEl) {
      _hudEl.textContent = 'ARTIFACTS DESTROYED: ' + _artifactsDestroyed + '/' + _artifactTotal;
    }
  }

  function _showNotif(msg) {
    if (!_notifEl) { return; }
    _notifEl.textContent = msg;
    _notifEl.style.opacity = '1';
    _notifTimer = 3.0;
  }

  function _removeHud() {
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
    }
    _hudEl = null;
    if (_notifEl && _notifEl.parentNode) {
      _notifEl.parentNode.removeChild(_notifEl);
    }
    _notifEl = null;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     KEYBOARD / MOUSE
  ═══════════════════════════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    _keys[e.code] = true;
    if (e.code === 'KeyH') { _hKeyDown = true; }
    if (e.code === 'KeyM') { _mKeyDown = true; }
    if (_hKeyDown && _mKeyDown) {
      _toggleModule();
    }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
    if (e.code === 'KeyH') { _hKeyDown = false; }
    if (e.code === 'KeyM') { _mKeyDown = false; }
  }

  function _onMouseMove(e) {
    if (!_active || !_mouseLocked) { return; }
    var dx = e.movementX || 0;
    var dy = e.movementY || 0;
    _yaw   -= dx * 0.002;
    _pitch -= dy * 0.002;
    _pitch  = Math.max(-1.2, Math.min(1.2, _pitch));
  }

  function _onPointerLockChange() {
    _mouseLocked = (document.pointerLockElement === document.body ||
                    document.mozPointerLockElement === document.body);
  }

  function _requestPointerLock() {
    if (document.body.requestPointerLock) {
      document.body.requestPointerLock();
    }
  }

  function _exitPointerLock() {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
    _mouseLocked = false;
  }

  function _addListeners() {
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
    document.addEventListener('mousemove', _onMouseMove);
    document.addEventListener('pointerlockchange', _onPointerLockChange);
    document.addEventListener('mozpointerlockchange', _onPointerLockChange);
    document.body.addEventListener('click', _requestPointerLock);
  }

  function _removeListeners() {
    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup',   _onKeyUp);
    document.removeEventListener('mousemove', _onMouseMove);
    document.removeEventListener('pointerlockchange', _onPointerLockChange);
    document.removeEventListener('mozpointerlockchange', _onPointerLockChange);
    document.body.removeEventListener('click', _requestPointerLock);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     HELPER – add mesh/light to scene and tracking array
  ═══════════════════════════════════════════════════════════════════════ */

  function _add(obj) {
    _scene.add(obj);
    _objects.push(obj);
    return obj;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SCENE BUILDING
  ═══════════════════════════════════════════════════════════════════════ */

  function _buildScene() {

    /* ── Ambient light (dim, purple-tinted) ─────────────────────────────── */
    var ambient = new THREE.AmbientLight(0x1a0a2e, 0.6);
    _add(ambient);

    /* ── Flickering point light (occult ritual chamber) ─────────────────── */
    _flickerLight = new THREE.PointLight(0x9b30ff, 2.5, 18);
    _flickerLight.position.set(0, 3, 0);
    _add(_flickerLight);

    /* ── Additional torchlight ───────────────────────────────────────────── */
    var torchLight = new THREE.PointLight(0xff6600, 1.8, 12);
    torchLight.position.set(-8, 2.5, -4);
    _add(torchLight);

    var torchLight2 = new THREE.PointLight(0xff4400, 1.4, 10);
    torchLight2.position.set(8, 2.5, -4);
    _add(torchLight2);

    /* ── Floor ───────────────────────────────────────────────────────────── */
    var floorGeo = new THREE.BoxGeometry(30, 0.2, 30);
    var floorMat = new THREE.MeshLambertMaterial({ color: 0x1c1008 });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -0.1, 0);
    _add(floor);

    /* ── Ceiling ─────────────────────────────────────────────────────────── */
    var ceilGeo = new THREE.BoxGeometry(30, 0.2, 30);
    var ceilMat = new THREE.MeshLambertMaterial({ color: 0x0d0608 });
    var ceil = new THREE.Mesh(ceilGeo, ceilMat);
    ceil.position.set(0, 5, 0);
    _add(ceil);

    /* ── Outer walls ─────────────────────────────────────────────────────── */
    _buildWall(0, 2.5, -15, 30, 5, 0.3, 0x1a0f0a);  // back
    _buildWall(0, 2.5,  15, 30, 5, 0.3, 0x1a0f0a);  // front
    _buildWall(-15, 2.5, 0, 0.3, 5, 30, 0x150d08);  // left
    _buildWall( 15, 2.5, 0, 0.3, 5, 30, 0x150d08);  // right

    /* ── Interior dividing walls (creating manor rooms) ─────────────────── */
    _buildWall(0, 2.5, -6, 12, 5, 0.3, 0x130a06);    // inner wall segment
    _buildWall(-8, 2.5, -3, 0.3, 5, 6, 0x130a06);    // left corridor wall
    _buildWall( 8, 2.5, -3, 0.3, 5, 6, 0x130a06);    // right corridor wall

    /* ── Bookshelf walls (BoxGeometry) ───────────────────────────────────── */
    _buildBookshelf(-14, 1.5, -10);
    _buildBookshelf(-14, 1.5,  -5);
    _buildBookshelf( 14, 1.5, -10);
    _buildBookshelf( 14, 1.5,  -5);

    /* ── Ornate fireplace (BoxGeometry) ──────────────────────────────────── */
    _buildFireplace(0, 0, -14.5);

    /* ── Grandfather clock (BoxGeometry tall) ────────────────────────────── */
    _buildGrandfatherClock(-6, 0, -14.5);
    _buildGrandfatherClock( 6, 0, -14.5);

    /* ── Candelabras (CylinderGeometry + SphereGeometry flames) ─────────── */
    _buildCandelabra(-3, 0,  2);
    _buildCandelabra( 3, 0,  2);
    _buildCandelabra(-5, 0, -8);
    _buildCandelabra( 5, 0, -8);

    /* ── Summoning circle (flat CylinderGeometry) ────────────────────────── */
    _buildSummoningCircle(0, 0.01, 0);

    /* ── Ritual pentagram (LineSegments) ─────────────────────────────────── */
    _buildPentagram(0, 0.02, 0, 4);

    /* ── Ghostly enemies (semi-transparent BoxGeometry) ─────────────────── */
    _buildGhosts();

    /* ── Summoning artifacts (glowing SphereGeometry) ─────────────────────  */
    _buildArtifacts();

    /* ── Furniture / scene dressing ──────────────────────────────────────── */
    _buildSceneDressing();
  }

  function _buildWall(x, y, z, w, h, d, color) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    _add(mesh);
    return mesh;
  }

  /* ── Bookshelf wall ───────────────────────────────────────────────────── */
  function _buildBookshelf(x, y, z) {
    /* Main bookshelf body */
    var shelfGeo = new THREE.BoxGeometry(0.4, 3, 4);
    var shelfMat = new THREE.MeshLambertMaterial({ color: 0x3b1f0a });
    var shelf = new THREE.Mesh(shelfGeo, shelfMat);
    shelf.position.set(x, y, z);
    _add(shelf);

    /* Book spines (small boxes) */
    var bookColors = [0x8b0000, 0x1a3a1a, 0x1a1a4a, 0x4a2a00, 0x3a003a];
    for (var i = 0; i < 5; i++) {
      for (var j = 0; j < 3; j++) {
        var bGeo = new THREE.BoxGeometry(0.12, 0.28, 0.35);
        var bMat = new THREE.MeshLambertMaterial({ color: bookColors[i] });
        var book = new THREE.Mesh(bGeo, bMat);
        book.position.set(
          x + 0.15,
          y - 1.0 + j * 1.0,
          z - 1.5 + i * 0.75
        );
        _add(book);
      }
    }
  }

  /* ── Ornate fireplace ─────────────────────────────────────────────────── */
  function _buildFireplace(x, y, z) {
    /* Fireplace surround */
    var surroundGeo = new THREE.BoxGeometry(3, 3, 0.5);
    var surroundMat = new THREE.MeshLambertMaterial({ color: 0x2a1a0a });
    var surround = new THREE.Mesh(surroundGeo, surroundMat);
    surround.position.set(x, y + 1.5, z);
    _add(surround);

    /* Fireplace opening (dark box inset) */
    var openingGeo = new THREE.BoxGeometry(1.8, 1.6, 0.3);
    var openingMat = new THREE.MeshLambertMaterial({ color: 0x0a0503 });
    var opening = new THREE.Mesh(openingGeo, openingMat);
    opening.position.set(x, y + 1.0, z - 0.2);
    _add(opening);

    /* Mantel shelf */
    var mantelGeo = new THREE.BoxGeometry(3.4, 0.15, 0.7);
    var mantelMat = new THREE.MeshLambertMaterial({ color: 0x4a2e10 });
    var mantel = new THREE.Mesh(mantelGeo, mantelMat);
    mantel.position.set(x, y + 3.05, z);
    _add(mantel);

    /* Fire glow box */
    var fireGeo = new THREE.BoxGeometry(1.4, 0.8, 0.2);
    var fireMat = new THREE.MeshLambertMaterial({
      color: 0xff4400,
      emissive: 0xff2200,
      emissiveIntensity: 1.2
    });
    var fire = new THREE.Mesh(fireGeo, fireMat);
    fire.position.set(x, y + 0.5, z - 0.3);
    _add(fire);

    /* Fireplace glow light */
    var fireLight = new THREE.PointLight(0xff4400, 1.5, 8);
    fireLight.position.set(x, y + 1.2, z - 0.1);
    _add(fireLight);
  }

  /* ── Grandfather clock ────────────────────────────────────────────────── */
  function _buildGrandfatherClock(x, y, z) {
    /* Main tall body */
    var bodyGeo = new THREE.BoxGeometry(0.7, 4.0, 0.5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x2c1506 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(x, y + 2.0, z);
    _add(body);

    /* Hood (wider top box) */
    var hoodGeo = new THREE.BoxGeometry(0.9, 0.8, 0.65);
    var hoodMat = new THREE.MeshLambertMaterial({ color: 0x3a1c08 });
    var hood = new THREE.Mesh(hoodGeo, hoodMat);
    hood.position.set(x, y + 4.4, z);
    _add(hood);

    /* Clock face */
    var faceGeo = new THREE.BoxGeometry(0.55, 0.55, 0.1);
    var faceMat = new THREE.MeshLambertMaterial({ color: 0xd4b483 });
    var face = new THREE.Mesh(faceGeo, faceMat);
    face.position.set(x, y + 3.3, z - 0.28);
    _add(face);

    /* Base plinth */
    var baseGeo = new THREE.BoxGeometry(0.85, 0.3, 0.65);
    var baseMat = new THREE.MeshLambertMaterial({ color: 0x1e0e04 });
    var base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(x, y + 0.15, z);
    _add(base);
  }

  /* ── Candelabra (CylinderGeometry + SphereGeometry flames) ───────────── */
  function _buildCandelabra(x, y, z) {
    /* Base disc */
    var baseGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.08, 8);
    var metalMat = new THREE.MeshLambertMaterial({ color: 0x4a3a10 });
    var base = new THREE.Mesh(baseGeo, metalMat);
    base.position.set(x, y + 0.04, z);
    _add(base);

    /* Main stem */
    var stemGeo = new THREE.CylinderGeometry(0.05, 0.08, 1.2, 8);
    var stem = new THREE.Mesh(stemGeo, metalMat);
    stem.position.set(x, y + 0.64, z);
    _add(stem);

    /* Arm plate */
    var plateGeo = new THREE.CylinderGeometry(0.3, 0.28, 0.06, 8);
    var plate = new THREE.Mesh(plateGeo, metalMat);
    plate.position.set(x, y + 1.28, z);
    _add(plate);

    /* Candle holders and candles (3 arms) */
    var armOffsets = [
      { dx: 0, dz: 0 },
      { dx:  0.22, dz: 0 },
      { dx: -0.22, dz: 0 }
    ];

    for (var i = 0; i < armOffsets.length; i++) {
      var ao = armOffsets[i];

      /* Candle body */
      var candleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6);
      var candleMat = new THREE.MeshLambertMaterial({ color: 0xf0e0c0 });
      var candle = new THREE.Mesh(candleGeo, candleMat);
      candle.position.set(x + ao.dx, y + 1.49, z + ao.dz);
      _add(candle);

      /* Flame (SphereGeometry) */
      var flameGeo = new THREE.SphereGeometry(0.05, 6, 6);
      var flameMat = new THREE.MeshLambertMaterial({
        color: 0xffaa00,
        emissive: 0xff6600,
        emissiveIntensity: 2.0
      });
      var flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(x + ao.dx, y + 1.72, z + ao.dz);
      _add(flame);
    }

    /* Candelabra glow */
    var candleLight = new THREE.PointLight(0xffaa33, 0.8, 5);
    candleLight.position.set(x, y + 1.8, z);
    _add(candleLight);
  }

  /* ── Summoning circle (flat CylinderGeometry) ─────────────────────────── */
  function _buildSummoningCircle(x, y, z) {
    /* Outer ring */
    var outerGeo = new THREE.CylinderGeometry(4.2, 4.2, 0.03, 48);
    var circleMat = new THREE.MeshLambertMaterial({
      color: 0x6600aa,
      emissive: 0x330066,
      emissiveIntensity: 0.8
    });
    var outer = new THREE.Mesh(outerGeo, circleMat);
    outer.position.set(x, y, z);
    _add(outer);

    /* Inner disc */
    var innerGeo = new THREE.CylinderGeometry(3.8, 3.8, 0.02, 48);
    var innerMat = new THREE.MeshLambertMaterial({
      color: 0x0a0010,
      emissive: 0x1a0030,
      emissiveIntensity: 0.4
    });
    var inner = new THREE.Mesh(innerGeo, innerMat);
    inner.position.set(x, y - 0.005, z);
    _add(inner);

    /* Rune marks around circle */
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var rx = x + Math.cos(angle) * 3.8;
      var rz = z + Math.sin(angle) * 3.8;
      var runeGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 6);
      var runeMat = new THREE.MeshLambertMaterial({
        color: 0xaa00ff,
        emissive: 0x660099,
        emissiveIntensity: 1.2
      });
      var rune = new THREE.Mesh(runeGeo, runeMat);
      rune.position.set(rx, y + 0.02, rz);
      _add(rune);
    }
  }

  /* ── Ritual pentagram (LineSegments) ──────────────────────────────────── */
  function _buildPentagram(x, y, z, radius) {
    var points = [];
    /* A pentagram connects every other vertex of a regular pentagon */
    var order = [0, 2, 4, 1, 3, 0];
    var verts = [];
    for (var i = 0; i < 5; i++) {
      var ang = (i / 5) * Math.PI * 2 - Math.PI / 2;
      verts.push(new THREE.Vector3(
        x + Math.cos(ang) * radius,
        y,
        z + Math.sin(ang) * radius
      ));
    }

    var positions = [];
    for (var j = 0; j < order.length - 1; j++) {
      var v0 = verts[order[j]];
      var v1 = verts[order[j + 1]];
      positions.push(v0.x, v0.y, v0.z);
      positions.push(v1.x, v1.y, v1.z);
    }

    var lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    var lineMat = new THREE.LineBasicMaterial({
      color: 0xff00cc,
      linewidth: 2
    });
    var pentagram = new THREE.LineSegments(lineGeo, lineMat);
    _add(pentagram);
  }

  /* ── Ghostly enemies ──────────────────────────────────────────────────── */
  function _buildGhosts() {
    var ghostPositions = [
      { x: -5, z: -2 },
      { x:  5, z: -2 },
      { x:  0, z: -10 },
      { x: -10, z: -8 },
      { x:  10, z: -8 },
      { x: -3, z:  5 }
    ];

    for (var i = 0; i < ghostPositions.length; i++) {
      var gp = ghostPositions[i];

      /* Ghost body */
      var bodyGeo = new THREE.BoxGeometry(0.6, 1.4, 0.4);
      var bodyMat = new THREE.MeshLambertMaterial({
        color: 0xaaccff,
        transparent: true,
        opacity: 0.6
      });
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(gp.x, 1.5, gp.z);
      _add(body);

      /* Ghost head */
      var headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.4);
      var headMat = new THREE.MeshLambertMaterial({
        color: 0xbbddff,
        transparent: true,
        opacity: 0.6
      });
      var head = new THREE.Mesh(headGeo, headMat);
      head.position.set(gp.x, 2.45, gp.z);
      _add(head);

      /* Ghost glow */
      var ghostGeo = new THREE.SphereGeometry(0.35, 8, 8);
      var ghostMat = new THREE.MeshLambertMaterial({
        color: 0x6699ff,
        emissive: 0x334488,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.35
      });
      var ghostGlow = new THREE.Mesh(ghostGeo, ghostMat);
      ghostGlow.position.set(gp.x, 1.7, gp.z);
      _add(ghostGlow);

      /* Ghost light */
      var ghostLight = new THREE.PointLight(0x4488ff, 0.6, 4);
      ghostLight.position.set(gp.x, 2.0, gp.z);
      _add(ghostLight);

      /* Track ghost as composite group via pivot mesh */
      var dirAngle = Math.random() * Math.PI * 2;
      _ghosts.push({
        body: body,
        head: head,
        glow: ghostGlow,
        light: ghostLight,
        origin: { x: gp.x, z: gp.z },
        dir: dirAngle,
        speed: 1.2 + Math.random() * 0.8,
        timer: 0,
        wanderTime: 2 + Math.random() * 3,
        range: 4
      });
    }
  }

  /* ── Summoning artifacts (glowing spheres) ───────────────────────────── */
  function _buildArtifacts() {
    var artifactPositions = [
      { x: -12, y: 1.0, z: -12, color: 0xff0044, emissive: 0x880022 },
      { x:  12, y: 1.0, z: -12, color: 0xff6600, emissive: 0x882200 },
      { x:   0, y: 1.2, z: -13, color: 0xaa00ff, emissive: 0x550088 },
      { x:  -7, y: 1.0, z:   3, color: 0x00ffaa, emissive: 0x008855 },
      { x:   7, y: 1.0, z:   3, color: 0xffdd00, emissive: 0x886600 }
    ];

    for (var i = 0; i < artifactPositions.length; i++) {
      var ap = artifactPositions[i];

      var aGeo = new THREE.SphereGeometry(0.25, 12, 12);
      var aMat = new THREE.MeshLambertMaterial({
        color: ap.color,
        emissive: ap.emissive,
        emissiveIntensity: 2.5
      });
      var aMesh = new THREE.Mesh(aGeo, aMat);
      aMesh.position.set(ap.x, ap.y, ap.z);
      _add(aMesh);

      /* Artifact glow light */
      var aLight = new THREE.PointLight(ap.color, 1.2, 5);
      aLight.position.set(ap.x, ap.y, ap.z);
      _add(aLight);

      /* Pedestal */
      var pedGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.8, 8);
      var pedMat = new THREE.MeshLambertMaterial({ color: 0x1a0a00 });
      var ped = new THREE.Mesh(pedGeo, pedMat);
      ped.position.set(ap.x, ap.y - 0.65, ap.z);
      _add(ped);

      _artifacts.push({
        mesh: aMesh,
        light: aLight,
        pedestal: ped,
        pos: { x: ap.x, y: ap.y, z: ap.z },
        destroyed: false
      });
    }
  }

  /* ── Scene dressing ───────────────────────────────────────────────────── */
  function _buildSceneDressing() {
    /* Large dining table */
    var tableTopGeo = new THREE.BoxGeometry(4, 0.15, 1.5);
    var tableMat    = new THREE.MeshLambertMaterial({ color: 0x2a1205 });
    var tableTop    = new THREE.Mesh(tableTopGeo, tableMat);
    tableTop.position.set(0, 0.9, 5);
    _add(tableTop);

    /* Table legs */
    var legGeo = new THREE.BoxGeometry(0.12, 0.9, 0.12);
    var offsets = [
      { dx: -1.8, dz: -0.6 },
      { dx:  1.8, dz: -0.6 },
      { dx: -1.8, dz:  0.6 },
      { dx:  1.8, dz:  0.6 }
    ];
    for (var i = 0; i < offsets.length; i++) {
      var leg = new THREE.Mesh(legGeo, tableMat);
      leg.position.set(offsets[i].dx, 0.45, 5 + offsets[i].dz);
      _add(leg);
    }

    /* Ritual tome on table */
    var tomeGeo = new THREE.BoxGeometry(0.4, 0.06, 0.55);
    var tomeMat = new THREE.MeshLambertMaterial({ color: 0x1a0008 });
    var tome    = new THREE.Mesh(tomeGeo, tomeMat);
    tome.position.set(0, 0.98, 5);
    _add(tome);

    /* Dark throne */
    var throneGeo = new THREE.BoxGeometry(1.0, 1.8, 0.9);
    var throneMat = new THREE.MeshLambertMaterial({ color: 0x0d0605 });
    var throne    = new THREE.Mesh(throneGeo, throneMat);
    throne.position.set(0, 0.9, -13);
    _add(throne);

    /* Throne seat */
    var seatGeo = new THREE.BoxGeometry(0.95, 0.12, 0.8);
    var seat    = new THREE.Mesh(seatGeo, throneMat);
    seat.position.set(0, 0.5, -13.05);
    _add(seat);

    /* Stone pillars */
    var pillarPositions = [
      { x: -4, z: -6 },
      { x:  4, z: -6 },
      { x: -4, z:  4 },
      { x:  4, z:  4 }
    ];

    for (var p = 0; p < pillarPositions.length; p++) {
      var pp = pillarPositions[p];
      var pillarGeo = new THREE.CylinderGeometry(0.3, 0.35, 4.8, 8);
      var pillarMat = new THREE.MeshLambertMaterial({ color: 0x1c1410 });
      var pillar    = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(pp.x, 2.4, pp.z);
      _add(pillar);

      /* Pillar cap */
      var capGeo = new THREE.BoxGeometry(0.8, 0.25, 0.8);
      var cap    = new THREE.Mesh(capGeo, pillarMat);
      cap.position.set(pp.x, 4.92, pp.z);
      _add(cap);
    }

    /* Money laundering ledgers / cash boxes */
    for (var b = 0; b < 4; b++) {
      var boxGeo = new THREE.BoxGeometry(0.45, 0.3, 0.35);
      var boxMat = new THREE.MeshLambertMaterial({ color: 0x1a4a1a });
      var box    = new THREE.Mesh(boxGeo, boxMat);
      box.position.set(-12 + b * 2.5, 0.15, -7);
      _add(box);
    }

    /* Skull decorations */
    for (var s = 0; s < 3; s++) {
      var skullGeo = new THREE.SphereGeometry(0.14, 8, 8);
      var skullMat = new THREE.MeshLambertMaterial({ color: 0xd4c8a0 });
      var skull    = new THREE.Mesh(skullGeo, skullMat);
      skull.position.set(-1 + s, 3.18, -14.45);
      _add(skull);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     TOGGLE
  ═══════════════════════════════════════════════════════════════════════ */

  function _toggleModule() {
    if (!_active) {
      if (!_scene || !_camera) { return; }
      _active = true;
      _showNotif('☠ HAUNTED MANOR: OPERATION OCCULT TAKEDOWN ACTIVE ☠');
    } else {
      _active = false;
      _showNotif('Haunted Manor deactivated.');
      _exitPointerLock();
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PUBLIC: init
  ═══════════════════════════════════════════════════════════════════════ */

  function init(sceneRef, cameraRef) {
    _scene  = sceneRef;
    _camera = cameraRef;

    /* Backup and set fog */
    _fogBackup = _scene.fog;
    _scene.fog = new THREE.Fog(0x1a0a2e, 5, 30);

    /* Reset counters */
    _time               = 0;
    _artifactsDestroyed = 0;
    _notifTimer         = 0;
    _keys               = {};
    _hKeyDown           = false;
    _mKeyDown           = false;
    _objects            = [];
    _ghosts             = [];
    _artifacts          = [];
    _flickerLight       = null;
    _active             = false;
    _mouseLocked        = false;

    /* Reset player position */
    _playerPos = { x: 0, y: 1.7, z: 8 };
    _yaw   = 0;
    _pitch = 0;

    /* Build the scene */
    _buildScene();

    /* HUD */
    _createHud();
    _updateHud();

    /* Input */
    _addListeners();

    /* Apply camera start position */
    _camera.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _camera.rotation.order = 'YXZ';
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PUBLIC: update
  ═══════════════════════════════════════════════════════════════════════ */

  function update(delta) {
    if (!_scene || !_camera) { return; }

    _time += delta;

    /* Notification timer */
    if (_notifTimer > 0) {
      _notifTimer -= delta;
      if (_notifTimer <= 0 && _notifEl) {
        _notifEl.style.opacity = '0';
      }
    }

    if (!_active) { return; }

    /* ── Flickering light ─────────────────────────────────────────────── */
    if (_flickerLight) {
      _flickerLight.intensity = 2.0 + 1.2 * Math.sin(_time * 4.7) +
                                 0.5 * Math.sin(_time * 13.1) +
                                 0.3 * Math.sin(_time * 27.3);
    }

    /* ── Player movement ──────────────────────────────────────────────── */
    var cosY = Math.cos(_yaw);
    var sinY = Math.sin(_yaw);
    var moveX = 0;
    var moveZ = 0;

    if (_keys['KeyW'] || _keys['ArrowUp']) {
      moveX -= sinY * _playerSpeed * delta;
      moveZ -= cosY * _playerSpeed * delta;
    }
    if (_keys['KeyS'] || _keys['ArrowDown']) {
      moveX += sinY * _playerSpeed * delta;
      moveZ += cosY * _playerSpeed * delta;
    }
    if (_keys['KeyA'] || _keys['ArrowLeft']) {
      moveX -= cosY * _playerSpeed * delta;
      moveZ += sinY * _playerSpeed * delta;
    }
    if (_keys['KeyD'] || _keys['ArrowRight']) {
      moveX += cosY * _playerSpeed * delta;
      moveZ -= sinY * _playerSpeed * delta;
    }

    /* Clamp to manor boundaries */
    var newX = _playerPos.x + moveX;
    var newZ = _playerPos.z + moveZ;
    newX = Math.max(-14.5, Math.min(14.5, newX));
    newZ = Math.max(-14.5, Math.min(14.5, newZ));

    _playerPos.x = newX;
    _playerPos.z = newZ;

    /* Apply to camera */
    _camera.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;

    /* ── Ghost AI (patrol/wander) ─────────────────────────────────────── */
    for (var i = 0; i < _ghosts.length; i++) {
      var g = _ghosts[i];
      g.timer += delta;

      /* Change direction after wander time */
      if (g.timer >= g.wanderTime) {
        g.timer       = 0;
        g.wanderTime  = 2 + Math.random() * 3;
        g.dir         = Math.random() * Math.PI * 2;
      }

      var gx = g.body.position.x + Math.sin(g.dir) * g.speed * delta;
      var gz = g.body.position.z + Math.cos(g.dir) * g.speed * delta;

      /* Bounce off walls and return to origin if too far */
      var distFromOrigin = Math.sqrt(
        Math.pow(gx - g.origin.x, 2) + Math.pow(gz - g.origin.z, 2)
      );
      if (distFromOrigin > g.range) {
        /* Steer back toward origin */
        var toOriginAngle = Math.atan2(
          g.origin.x - gx,
          g.origin.z - gz
        );
        g.dir = toOriginAngle + (Math.random() - 0.5) * 0.5;
        gx = g.body.position.x;
        gz = g.body.position.z;
      }

      /* Clamp to manor */
      gx = Math.max(-14, Math.min(14, gx));
      gz = Math.max(-14, Math.min(14, gz));

      /* Hover bob */
      var bobY = 1.5 + 0.15 * Math.sin(_time * 2.0 + i * 1.3);

      g.body.position.set(gx, bobY, gz);
      g.head.position.set(gx, bobY + 0.95, gz);
      g.glow.position.set(gx, bobY + 0.2, gz);
      g.light.position.set(gx, bobY + 0.5, gz);

      /* Face movement direction */
      g.body.rotation.y = g.dir;
      g.head.rotation.y = g.dir;
    }

    /* ── Artifact proximity check ──────────────────────────────────────── */
    for (var a = 0; a < _artifacts.length; a++) {
      var art = _artifacts[a];
      if (art.destroyed) { continue; }

      var dx = _playerPos.x - art.pos.x;
      var dz = _playerPos.z - art.pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 2.0) {
        /* Destroy artifact */
        art.destroyed = true;
        _scene.remove(art.mesh);
        _scene.remove(art.light);
        _scene.remove(art.pedestal);
        _artifactsDestroyed++;
        _updateHud();
        _showNotif(
          '⚡ ARTIFACT DESTROYED! ' + _artifactsDestroyed + '/' +
          _artifactTotal + ' summoning relics neutralized!'
        );

        if (_artifactsDestroyed >= _artifactTotal) {
          _showNotif(
            '✔ ALL ARTIFACTS DESTROYED! Occult operation dismantled! Mission Complete!'
          );
        }
      } else {
        /* Pulse glow based on proximity */
        var pulseIntensity = 2.5 + 1.0 * Math.sin(_time * 3.0 + a * 0.8);
        art.mesh.material.emissiveIntensity = pulseIntensity;

        /* Orbit artifact slightly */
        art.mesh.rotation.y += delta * 1.5;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PUBLIC: reset
  ═══════════════════════════════════════════════════════════════════════ */

  function reset() {
    /* Remove all scene objects */
    for (var i = 0; i < _objects.length; i++) {
      _scene.remove(_objects[i]);
      if (_objects[i].geometry) { _objects[i].geometry.dispose(); }
      if (_objects[i].material) {
        if (Array.isArray(_objects[i].material)) {
          for (var m = 0; m < _objects[i].material.length; m++) {
            _objects[i].material[m].dispose();
          }
        } else {
          _objects[i].material.dispose();
        }
      }
    }
    _objects   = [];
    _ghosts    = [];
    _artifacts = [];
    _flickerLight = null;

    /* Restore fog */
    if (_scene) {
      _scene.fog = _fogBackup || null;
    }
    _fogBackup = null;

    /* Remove HUD */
    _removeHud();

    /* Remove listeners */
    _removeListeners();

    /* Exit pointer lock */
    _exitPointerLock();

    /* Reset state */
    _active             = false;
    _time               = 0;
    _artifactsDestroyed = 0;
    _notifTimer         = 0;
    _hKeyDown           = false;
    _mKeyDown           = false;
    _keys               = {};
    _mouseLocked        = false;
    _scene              = null;
    _camera             = null;
  }

  /* ── Public API ───────────────────────────────────────────────────────── */
  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
