// fortified-outpost.js — Forward Operating Base (FOB) building system for Three.js FPS
// Press B to open Build Menu, select item 1-9, LMB to place, Del to bulldoze.
// Supply Points (SP) earned by killing enemies (2 SP per kill).
// Build 5+ structures in area to establish FOB (1.5x score multiplier).
//
// Public API:
//   FortifiedOutpost.init(scene, camera)
//   FortifiedOutpost.update(delta)
//   FortifiedOutpost.addSupplyPoints(n)
//   FortifiedOutpost.buildItem(type, pos)
//   FortifiedOutpost.reset()

window.FortifiedOutpost = (function () {
  'use strict';

  // ─────────────────────────────────────────────── constants

  var BUILD_ITEMS = [
    { id: 1, name: 'Sandbag Wall',       cost: 5,  key: '1' },
    { id: 2, name: 'Watchtower',         cost: 15, key: '2' },
    { id: 3, name: 'MG Nest',           cost: 20, key: '3' },
    { id: 4, name: 'Ammo Crate',        cost: 10, key: '4' },
    { id: 5, name: 'Medical Tent',      cost: 12, key: '5' },
    { id: 6, name: 'Razor Wire',        cost: 8,  key: '6' },
    { id: 7, name: 'Anti-Tank Barrier', cost: 18, key: '7' },
    { id: 8, name: 'Spotting Tower',    cost: 25, key: '8' }
  ];

  var FOB_RADIUS         = 30;     // units — area for FOB detection
  var FOB_THRESHOLD      = 5;      // structures needed to establish FOB
  var FOB_MULTIPLIER     = 1.5;
  var PLACE_DIST         = 6;      // units in front of camera to place
  var GHOST_OPACITY      = 0.45;
  var MG_RANGE           = 12;
  var MG_FIRE_RATE       = 0.8;    // seconds between shots
  var MG_DAMAGE          = 40;
  var MG_MAX_AMMO        = 100;
  var AMMO_REFILL_INT    = 30;     // seconds between ammo refills
  var MEDICAL_HEAL_RATE  = 5;      // HP per second in radius
  var MEDICAL_RADIUS     = 6;
  var MEDICAL_RADIUS_SQ  = MEDICAL_RADIUS * MEDICAL_RADIUS;
  var RAZOR_SLOW         = 0.30;   // multiplier (70% slow)
  var RAZOR_DPS          = 5;
  var RAZOR_RADIUS       = 1.8;
  var RAZOR_RADIUS_SQ    = RAZOR_RADIUS * RAZOR_RADIUS;
  var BULLDOZE_REFUND    = 0.5;
  var SP_PER_KILL        = 2;

  var HP = {
    1: 150,   // Sandbag Wall
    2: 200,   // Watchtower
    3: 200,   // MG Nest
    4: 60,    // Ammo Crate
    5: 80,    // Medical Tent
    6: 80,    // Razor Wire
    7: 400,   // Anti-Tank Barrier
    8: 120    // Spotting Tower
  };

  // ─────────────────────────────────────────────── state

  var _scene        = null;
  var _camera       = null;
  var _sp           = 0;
  var _structures   = [];   // { type, mesh, hp, maxHp, data, rubble }
  var _buildMenuOpen = false;
  var _selectedItem = 0;    // 0 = none, 1-8 = item
  var _ghostMesh    = null;
  var _ghostType    = 0;
  var _fobEstablished = false;
  var _time         = 0;
  var _keysDown     = {};
  var _keyPressed   = {};
  var _mouseDown    = false;
  var _mouseClicked = false;

  // DOM
  var _hudSP        = null;
  var _buildMenu    = null;
  var _toast        = null;
  var _fobBanner    = null;

  // ─────────────────────────────────────────────── helpers

  function _el(id, tag, styles, parent) {
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement(tag || 'div');
      el.id = id;
      (parent || document.body).appendChild(el);
    }
    Object.assign(el.style, styles || {});
    return el;
  }

  function _showToast(msg, color, dur) {
    if (!_toast) return;
    _toast.textContent = msg;
    _toast.style.color   = color || '#ffdd00';
    _toast.style.borderColor = color || '#ffdd00';
    _toast.style.display = 'block';
    clearTimeout(_toast._t);
    _toast._t = setTimeout(function () { _toast.style.display = 'none'; }, dur || 2500);
  }

  function _getPlayerPos() {
    return _camera ? _camera.position : new THREE.Vector3();
  }

  function _dist2(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return dx * dx + dz * dz;
  }

  function _getEnemies() {
    if (window.Enemies && window.Enemies.getAll) return window.Enemies.getAll();
    return [];
  }

  function _getEnemyPos(e) {
    if (e.mesh && e.mesh.position) return e.mesh.position;
    if (e.group && e.group.position) return e.group.position;
    if (e.position) return e.position;
    return null;
  }

  function _isEnemyAlive(e) {
    if (e.dead !== undefined) return !e.dead;
    if (e.health !== undefined) return e.health > 0;
    return true;
  }

  function _dealEnemyDamage(e, dmg) {
    if (e.takeDamage) { e.takeDamage(dmg); return; }
    if (e.health !== undefined) { e.health -= dmg; }
  }

  function _getPlayerHP() {
    return (window._playerHP !== undefined) ? window._playerHP : 100;
  }

  function _setPlayerHP(v) {
    window._playerHP = Math.min(100, Math.max(0, v));
  }

  function _getScoreMultiplier() {
    return window._scoreMultiplier || 1.0;
  }

  function _setScoreMultiplier(v) {
    window._scoreMultiplier = v;
  }

  function _addScore(n) {
    if (window.ComboSystem && window.ComboSystem.addScore) {
      window.ComboSystem.addScore(n);
      return;
    }
    if (window._score !== undefined) { window._score += n; }
  }

  function _getAudioCtx() {
    try { return window._audioCtx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
  }

  function _playClick() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.06);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.06);
    } catch (e) {}
  }

  function _playPlace() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var bufSize = ctx.sampleRate * 0.12;
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) { data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize) * 0.5; }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.12);
      src.connect(gain); gain.connect(ctx.destination);
      src.start(ctx.currentTime);
    } catch (e) {}
  }

  function _playMGFire() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var bufSize = ctx.sampleRate * 0.07;
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) { data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize); }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.07);
      src.connect(gain); gain.connect(ctx.destination);
      src.start(ctx.currentTime);
    } catch (e) {}
  }

  // ─────────────────────────────────────────────── HUD creation

  function _createHUD() {
    // SP counter — top left, prominent
    _hudSP = _el('fo-sp', 'div', {
      position: 'fixed', top: '14px', left: '14px',
      fontFamily: 'monospace', fontSize: '22px', fontWeight: 'bold',
      color: '#ffdd00', textShadow: '0 0 8px #ffbb00',
      background: 'rgba(0,0,0,0.70)', padding: '6px 18px',
      borderRadius: '8px', border: '2px solid #ffbb00',
      zIndex: '3500', pointerEvents: 'none', letterSpacing: '2px'
    });

    // Build menu (hidden by default)
    _buildMenu = _el('fo-buildmenu', 'div', {
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%,-50%)',
      background: 'rgba(10,20,10,0.96)', border: '2px solid #44ff44',
      borderRadius: '10px', padding: '18px 22px',
      fontFamily: 'monospace', color: '#ccffcc',
      zIndex: '6000', display: 'none',
      minWidth: '340px', boxShadow: '0 0 30px rgba(0,255,0,0.3)'
    });

    // Toast
    _toast = _el('fo-toast', 'div', {
      position: 'fixed', top: '24%', left: '50%',
      transform: 'translateX(-50%)',
      fontFamily: 'monospace', fontSize: '15px',
      color: '#ffdd00', background: 'rgba(0,0,0,0.85)',
      padding: '8px 20px', borderRadius: '8px',
      border: '1px solid #ffdd00', zIndex: '5500',
      pointerEvents: 'none', display: 'none',
      letterSpacing: '1px', textAlign: 'center'
    });

    // FOB banner
    _fobBanner = _el('fo-banner', 'div', {
      position: 'fixed', top: '12%', left: '50%',
      transform: 'translateX(-50%)',
      fontFamily: 'monospace', fontSize: '26px', fontWeight: 'bold',
      color: '#00ff44', textShadow: '0 0 14px #00ff44',
      background: 'rgba(0,0,0,0.88)', padding: '12px 30px',
      borderRadius: '10px', border: '2px solid #00ff44',
      zIndex: '5600', pointerEvents: 'none', display: 'none',
      letterSpacing: '3px'
    });
  }

  function _updateSPHud() {
    if (_hudSP) { _hudSP.textContent = 'SP: ' + _sp + ' ★'; }
  }

  function _renderBuildMenu() {
    if (!_buildMenu) return;
    var html = '<div style="font-size:17px;color:#00ff44;margin-bottom:12px;letter-spacing:2px;">[ BUILD MENU ]</div>';
    html += '<div style="font-size:12px;color:#888;margin-bottom:10px;">SP: ' + _sp + '  |  Press 1-8 to select, LMB to place, ESC/B to close</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">';
    for (var i = 0; i < BUILD_ITEMS.length; i++) {
      var item = BUILD_ITEMS[i];
      var canAfford = (_sp >= item.cost);
      var selected = (_selectedItem === item.id);
      var bg = selected ? 'rgba(0,180,0,0.4)' : (canAfford ? 'rgba(0,60,0,0.6)' : 'rgba(40,0,0,0.5)');
      var col = selected ? '#00ff44' : (canAfford ? '#aaffaa' : '#884444');
      var border = selected ? '1px solid #00ff44' : '1px solid #336633';
      html += '<div style="background:' + bg + ';border:' + border + ';border-radius:5px;padding:7px 10px;cursor:pointer;color:' + col + ';">';
      html += '<span style="font-size:13px;font-weight:bold;">[' + item.key + '] ' + item.name + '</span><br>';
      html += '<span style="font-size:11px;color:#ffdd00;">' + item.cost + ' SP</span>';
      html += '</div>';
    }
    html += '</div>';
    html += '<div style="margin-top:10px;font-size:11px;color:#666;">[Del] Aim at structure to Bulldoze (recover 50% SP)</div>';
    _buildMenu.innerHTML = html;
  }

  function _toggleBuildMenu(open) {
    _buildMenuOpen = (open !== undefined) ? open : !_buildMenuOpen;
    if (_buildMenu) {
      _buildMenu.style.display = _buildMenuOpen ? 'block' : 'none';
      if (_buildMenuOpen) { _renderBuildMenu(); }
    }
    // Lock/unlock pointer
    if (_buildMenuOpen) {
      try { document.exitPointerLock && document.exitPointerLock(); } catch (e) {}
    }
  }

  // ─────────────────────────────────────────────── mesh builders

  function _applyGhostMat(mesh) {
    mesh.traverse(function (child) {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.transparent = true;
        child.material.opacity = GHOST_OPACITY;
      }
    });
  }

  function _buildSandbagWall() {
    var group = new THREE.Group();
    var mat = new THREE.MeshLambertMaterial({ color: 0xb5a07a });
    // 2 sandbags wide, 1 tall
    for (var i = 0; i < 3; i++) {
      var sb = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.5), mat);
      sb.position.set((i - 1) * 0.66, 0.22, 0);
      group.add(sb);
    }
    for (var j = 0; j < 2; j++) {
      var sb2 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.5), mat);
      sb2.position.set((j - 0.5) * 0.66, 0.22 + 0.46, 0);
      group.add(sb2);
    }
    return group;
  }

  function _buildWatchtower() {
    var group = new THREE.Group();
    var poleMat = new THREE.MeshLambertMaterial({ color: 0x8b5c1c });
    var platMat = new THREE.MeshLambertMaterial({ color: 0x6b4a14 });
    // 4 poles
    var px = [-0.6, 0.6, -0.6, 0.6];
    var pz = [-0.6, -0.6, 0.6, 0.6];
    for (var i = 0; i < 4; i++) {
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3, 6), poleMat);
      pole.position.set(px[i], 1.5, pz[i]);
      group.add(pole);
    }
    // Platform
    var plat = new THREE.Mesh(new THREE.BoxGeometry(2, 0.12, 2), platMat);
    plat.position.y = 3;
    group.add(plat);
    // Railing
    var railMat = new THREE.MeshLambertMaterial({ color: 0x5a3a0a });
    var rp = [
      [0, 3.25, -1.0], [0, 3.25, 1.0], [-1.0, 3.25, 0], [1.0, 3.25, 0]
    ];
    for (var ri = 0; ri < 4; ri++) {
      var rail = new THREE.Mesh(new THREE.BoxGeometry(
        ri < 2 ? 2.0 : 0.06, 0.08, ri < 2 ? 0.06 : 2.0
      ), railMat);
      rail.position.set(rp[ri][0], rp[ri][1], rp[ri][2]);
      group.add(rail);
    }
    // Ladder (simple rungs)
    var ladderMat = new THREE.MeshLambertMaterial({ color: 0x7a5a2a });
    for (var li = 0; li < 5; li++) {
      var rung = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.05), ladderMat);
      rung.position.set(-0.75, 0.5 + li * 0.55, 0);
      group.add(rung);
    }
    group._mountY = 3.1;  // player mount height
    group._isMountable = true;
    return group;
  }

  function _buildMGNest() {
    var group = new THREE.Group();
    var sandMat = new THREE.MeshLambertMaterial({ color: 0xb5a07a });
    var metalMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    // Sandbag ring
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var sb = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.4), sandMat);
      sb.position.set(Math.cos(angle) * 0.85, 0.2, Math.sin(angle) * 0.85);
      sb.rotation.y = angle;
      group.add(sb);
    }
    // Body
    var body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.6), metalMat);
    body.position.set(0, 0.45, 0);
    group.add(body);
    // Barrel pivot group
    var pivot = new THREE.Group();
    pivot.position.set(0, 0.6, 0);
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = -0.5;
    pivot.add(barrel);
    group.add(pivot);
    group._pivot  = pivot;
    group._barrel = barrel;
    // Ammo belt visual
    var beltMat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
    var belt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.35), beltMat);
    belt.position.set(0.25, 0.45, 0.1);
    group.add(belt);
    group._beltMesh = belt;
    // Alert light
    var light = new THREE.PointLight(0x00ff00, 1.5, 6);
    light.position.y = 0.7;
    group.add(light);
    group._alertLight = light;
    return group;
  }

  function _buildAmmoCrate() {
    var group = new THREE.Group();
    var crateMat = new THREE.MeshLambertMaterial({ color: 0x4a7a2a });
    var crate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.55), crateMat);
    crate.position.y = 0.27;
    group.add(crate);
    // Yellow ammo label stripe
    var stripeMat = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
    var stripe = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.08, 0.08), stripeMat);
    stripe.position.set(0, 0.33, 0.28);
    group.add(stripe);
    // Lid
    var lidMat = new THREE.MeshLambertMaterial({ color: 0x3a5a1a });
    var lid = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.07, 0.57), lidMat);
    lid.position.y = 0.575;
    group.add(lid);
    group._refillTimer = 0;
    return group;
  }

  function _buildMedicalTent() {
    var group = new THREE.Group();
    var canvasMat = new THREE.MeshLambertMaterial({ color: 0x2d6a2d, side: THREE.DoubleSide });
    var poleMat   = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
    // Roof cone
    var roof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.5, 4), canvasMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 1.9;
    group.add(roof);
    // Floor
    var floor = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.06, 2.8),
      new THREE.MeshLambertMaterial({ color: 0x5a4a1a }));
    floor.position.y = 0.03;
    group.add(floor);
    // Walls
    var wallGeo = new THREE.PlaneGeometry(2.8, 1.2);
    var backWall = new THREE.Mesh(wallGeo, canvasMat);
    backWall.position.set(0, 0.6, -1.4);
    group.add(backWall);
    var leftWall = new THREE.Mesh(wallGeo, canvasMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-1.4, 0.6, 0);
    group.add(leftWall);
    var rightWall = new THREE.Mesh(wallGeo, canvasMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(1.4, 0.6, 0);
    group.add(rightWall);
    // Corner poles
    var pp = [[-1.3, -1.3], [-1.3, 1.3], [1.3, -1.3], [1.3, 1.3]];
    for (var pi = 0; pi < 4; pi++) {
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.8, 6), poleMat);
      pole.position.set(pp[pi][0], 0.9, pp[pi][1]);
      group.add(pole);
    }
    // Red cross
    var crossMat = new THREE.MeshBasicMaterial({ color: 0xff2222, side: THREE.DoubleSide });
    var cv = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.56), crossMat);
    cv.rotation.y = Math.PI; cv.position.set(0, 0.75, 1.41);
    group.add(cv);
    var ch = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.16), crossMat);
    ch.rotation.y = Math.PI; ch.position.set(0, 0.75, 1.42);
    group.add(ch);
    return group;
  }

  function _buildRazorWire() {
    var group = new THREE.Group();
    var wireMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    var stakeMat = new THREE.MeshLambertMaterial({ color: 0x887766 });
    // 3 coil segments
    for (var i = 0; i < 3; i++) {
      var coil = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 5, 8), wireMat);
      coil.rotation.x = Math.PI / 2;
      coil.position.set((i - 1) * 0.8, 0.35, 0);
      group.add(coil);
    }
    // Stakes
    for (var j = 0; j < 4; j++) {
      var stake = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.7, 4), stakeMat);
      stake.position.set((j - 1.5) * 0.8, 0.35, 0);
      group.add(stake);
    }
    return group;
  }

  function _buildAntiTankBarrier() {
    var group = new THREE.Group();
    var concMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
    // Main pyramid
    var geo = new THREE.CylinderGeometry(0, 0.9, 1.6, 4);
    var pyramid = new THREE.Mesh(geo, concMat);
    pyramid.position.y = 0.8;
    pyramid.rotation.y = Math.PI / 4;
    group.add(pyramid);
    // Base slab
    var base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.22, 1.6), concMat);
    base.position.y = 0.11;
    group.add(base);
    // Texture markings (dark stripes)
    var stripeMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    for (var i = 0; i < 3; i++) {
      var stripe = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.04, 0.1), stripeMat);
      stripe.position.set(0, 0.12 + i * 0.07, 0);
      group.add(stripe);
    }
    return group;
  }

  function _buildSpottingTower() {
    var group = new THREE.Group();
    var metalMat  = new THREE.MeshLambertMaterial({ color: 0x336699 });
    var antMat    = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var lightMat  = new THREE.MeshLambertMaterial({ color: 0xff2200, emissive: 0xff0000, emissiveIntensity: 0.8 });
    // Main tower pole
    var main = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 6, 8), metalMat);
    main.position.y = 3;
    group.add(main);
    // Cross-braces
    var braceMat = new THREE.MeshLambertMaterial({ color: 0x225588 });
    for (var bi = 0; bi < 4; bi++) {
      var brace = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.2, 0.05), braceMat);
      brace.position.set(
        Math.cos((bi / 4) * Math.PI * 2) * 0.3,
        1.5 + bi * 1.0,
        Math.sin((bi / 4) * Math.PI * 2) * 0.3
      );
      brace.rotation.z = 0.35;
      group.add(brace);
    }
    // Dish / radar antenna at top
    var dish = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.5), metalMat);
    dish.position.y = 6.2;
    dish.rotation.x = Math.PI;
    group.add(dish);
    // Antenna mast
    var ant = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 5), antMat);
    ant.position.y = 6.9;
    group.add(ant);
    // Blinking light
    var blink = new THREE.Mesh(new THREE.SphereGeometry(0.08, 5, 5), lightMat);
    blink.position.y = 7.5;
    group.add(blink);
    group._blinkMesh = blink;
    group._blinkMat  = lightMat;
    // Point light
    var pLight = new THREE.PointLight(0xff3300, 2.5, 10);
    pLight.position.y = 7.5;
    group.add(pLight);
    group._blinkLight = pLight;
    return group;
  }

  // Build mesh by type
  function _buildMesh(type) {
    switch (type) {
      case 1: return _buildSandbagWall();
      case 2: return _buildWatchtower();
      case 3: return _buildMGNest();
      case 4: return _buildAmmoCrate();
      case 5: return _buildMedicalTent();
      case 6: return _buildRazorWire();
      case 7: return _buildAntiTankBarrier();
      case 8: return _buildSpottingTower();
      default: return new THREE.Group();
    }
  }

  // ─────────────────────────────────────────────── rubble

  function _spawnRubble(pos) {
    if (!_scene) return null;
    var group = new THREE.Group();
    var debMat = new THREE.MeshLambertMaterial({ color: 0x887766 });
    for (var i = 0; i < 6; i++) {
      var chunk = new THREE.Mesh(
        new THREE.BoxGeometry(0.1 + Math.random() * 0.35, 0.08 + Math.random() * 0.2, 0.1 + Math.random() * 0.3),
        debMat
      );
      chunk.position.set(
        (Math.random() - 0.5) * 1.4,
        0.05 + Math.random() * 0.1,
        (Math.random() - 0.5) * 1.4
      );
      chunk.rotation.y = Math.random() * Math.PI;
      group.add(chunk);
    }
    group.position.copy(pos);
    _scene.add(group);
    return group;
  }

  // ─────────────────────────────────────────────── ghost preview

  function _clearGhost() {
    if (_ghostMesh && _scene) { _scene.remove(_ghostMesh); }
    _ghostMesh = null;
    _ghostType = 0;
  }

  function _updateGhostPosition() {
    if (!_ghostMesh || !_camera) return;
    var pos = _getPlayerPos().clone();
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);
    dir.y = 0;
    dir.normalize();
    pos.addScaledVector(dir, PLACE_DIST);
    pos.y = 0;
    _ghostMesh.position.copy(pos);
  }

  function _ensureGhost(type) {
    if (_ghostType === type) { _updateGhostPosition(); return; }
    _clearGhost();
    if (!type) return;
    _ghostMesh = _buildMesh(type);
    _applyGhostMat(_ghostMesh);
    _ghostType = type;
    _updateGhostPosition();
    if (_scene) { _scene.add(_ghostMesh); }
  }

  // ─────────────────────────────────────────────── placement

  function _getPlacePos() {
    if (!_camera) return new THREE.Vector3();
    var pos = _getPlayerPos().clone();
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);
    dir.y = 0;
    dir.normalize();
    pos.addScaledVector(dir, PLACE_DIST);
    pos.y = 0;
    return pos;
  }

  function _placeSelected() {
    if (!_selectedItem || !_buildMenuOpen) return;
    var item = BUILD_ITEMS[_selectedItem - 1];
    if (!item) return;
    if (_sp < item.cost) {
      _showToast('Not enough SP! Need ' + item.cost + ' SP', '#ff4444');
      _playClick();
      return;
    }
    var pos = _getPlacePos();
    _placeStructure(_selectedItem, pos);
  }

  function buildItem(type, pos) {
    _placeStructure(type, pos);
  }

  function _placeStructure(type, pos) {
    var item = BUILD_ITEMS[type - 1];
    if (!item) return;
    if (_sp < item.cost) {
      _showToast('Need ' + item.cost + ' SP  (have ' + _sp + ')', '#ff4444');
      return;
    }
    _sp -= item.cost;
    _updateSPHud();

    var mesh = _buildMesh(type);
    mesh.position.copy(pos);
    if (_scene) { _scene.add(mesh); }

    var struct = {
      type:   type,
      mesh:   mesh,
      hp:     HP[type],
      maxHp:  HP[type],
      rubble: null,
      destroyed: false,
      data:   {}
    };

    // Type-specific init data
    if (type === 3) {
      struct.data.ammo       = MG_MAX_AMMO;
      struct.data.fireTimer  = 0;
      struct.data.targeting  = null;
    }
    if (type === 4) {
      struct.data.refillTimer = 0;
    }
    if (type === 8) {
      // Reveal enemy minimap positions
      window._fobRadarActive = true;
    }

    _structures.push(struct);
    _playPlace();
    _checkFOB();
    _renderBuildMenu();
    _showToast(item.name + ' placed! (' + _sp + ' SP left)', '#00ff44');
  }

  // ─────────────────────────────────────────────── FOB detection

  function _checkFOB() {
    if (_fobEstablished) return;
    if (_structures.length < FOB_THRESHOLD) return;

    // Check if FOB_THRESHOLD structures exist within FOB_RADIUS of each other
    for (var i = 0; i < _structures.length; i++) {
      if (_structures[i].destroyed) continue;
      var centerPos = _structures[i].mesh.position;
      var count = 0;
      for (var j = 0; j < _structures.length; j++) {
        if (_structures[j].destroyed) continue;
        var dx = _structures[j].mesh.position.x - centerPos.x;
        var dz = _structures[j].mesh.position.z - centerPos.z;
        if (Math.sqrt(dx * dx + dz * dz) <= FOB_RADIUS) { count++; }
      }
      if (count >= FOB_THRESHOLD) {
        _fobEstablished = true;
        _setScoreMultiplier(_getScoreMultiplier() * FOB_MULTIPLIER);
        _showFOBBanner();
        break;
      }
    }
  }

  function _showFOBBanner() {
    if (!_fobBanner) return;
    _fobBanner.textContent = '★ FOB ESTABLISHED ★';
    _fobBanner.style.display = 'block';
    setTimeout(function () {
      if (_fobBanner) { _fobBanner.style.display = 'none'; }
    }, 5000);
  }

  // ─────────────────────────────────────────────── bulldoze

  function _tryBulldoze() {
    if (!_camera) return;
    var ppos = _getPlayerPos();
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);
    dir.y = 0;
    dir.normalize();
    var aim = ppos.clone().addScaledVector(dir, PLACE_DIST);

    // Find nearest structure within ~3 units of aim point
    var best = null;
    var bestD = 9; // max bulldoze range (squared)
    for (var i = 0; i < _structures.length; i++) {
      var s = _structures[i];
      if (s.destroyed) continue;
      var dx = s.mesh.position.x - aim.x;
      var dz = s.mesh.position.z - aim.z;
      var d2 = dx * dx + dz * dz;
      if (d2 < bestD) { bestD = d2; best = s; }
    }

    if (!best) {
      _showToast('Aim at a structure to bulldoze', '#888');
      return;
    }

    var item = BUILD_ITEMS[best.type - 1];
    var refund = Math.floor(item.cost * BULLDOZE_REFUND);
    _destroyStructure(best, true);
    _sp += refund;
    _updateSPHud();
    _showToast('Bulldozed ' + item.name + ' — +" ' + refund + ' SP refunded', '#ffdd00');
  }

  function _destroyStructure(struct, bulldozed) {
    if (struct.destroyed) return;
    struct.destroyed = true;
    if (_scene) { _scene.remove(struct.mesh); }
    struct.rubble = _spawnRubble(struct.mesh.position);
    if (!bulldozed) { _showToast(BUILD_ITEMS[struct.type - 1].name + ' DESTROYED!', '#ff4444'); }
    // If spotting tower destroyed, disable radar
    if (struct.type === 8) {
      var anyRadar = false;
      for (var i = 0; i < _structures.length; i++) {
        if (!_structures[i].destroyed && _structures[i].type === 8) { anyRadar = true; break; }
      }
      window._fobRadarActive = anyRadar;
    }
  }

  // ─────────────────────────────────────────────── structure update loops

  function _updateMGNest(struct, dt) {
    var mesh = struct.mesh;
    var data = struct.data;
    data.fireTimer = Math.max(0, data.fireTimer - dt);

    var enemies = _getEnemies();
    var spos = mesh.position;
    var nearest = null;
    var nearestDist = Infinity;

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!_isEnemyAlive(e)) continue;
      var epos = _getEnemyPos(e);
      if (!epos) continue;
      var dist = spos.distanceTo(epos);
      if (dist < MG_RANGE && dist < nearestDist) { nearest = e; nearestDist = dist; }
    }

    var pivot = mesh._pivot;
    var alertLight = mesh._alertLight;

    if (nearest && data.ammo > 0) {
      var epos2 = _getEnemyPos(nearest);
      // Rotate pivot toward enemy
      var dx = epos2.x - spos.x;
      var dz = epos2.z - spos.z;
      var targetAngle = Math.atan2(dx, dz);
      if (pivot) {
        var diff = targetAngle - pivot.rotation.y;
        while (diff > Math.PI) { diff -= Math.PI * 2; }
        while (diff < -Math.PI) { diff += Math.PI * 2; }
        pivot.rotation.y += diff * Math.min(1, dt * 4);
      }
      // Fire
      if (data.fireTimer <= 0) {
        data.fireTimer = MG_FIRE_RATE;
        data.ammo--;
        _dealEnemyDamage(nearest, MG_DAMAGE);
        _playMGFire();
        if (alertLight) {
          alertLight.color.setHex(0xff2200);
          alertLight.intensity = 4;
        }
      }
    } else {
      if (alertLight) {
        alertLight.color.setHex(0x00ff00);
        alertLight.intensity = 0.8 + 0.4 * Math.sin(_time * 2);
      }
    }
  }

  function _updateAmmoCrate(struct, dt) {
    struct.data.refillTimer += dt;
    if (struct.data.refillTimer >= AMMO_REFILL_INT) {
      struct.data.refillTimer = 0;
      // Refill player ammo if nearby
      var ppos = _getPlayerPos();
      var dist2 = _dist2(ppos, struct.mesh.position);
      if (dist2 <= 25) { // within 5 units
        if (window.player && window.player.ammo !== undefined) {
          window.player.ammo = Math.min((window.player.ammo || 0) + 60, 999);
        }
        if (window._playerAmmo !== undefined) {
          window._playerAmmo = Math.min(window._playerAmmo + 60, 999);
        }
        _showToast('Ammo Crate refill!  +60 ammo', '#ffdd00');
      }
    }
  }

  function _updateMedicalTent(struct, dt) {
    var spos = struct.mesh.position;
    var ppos = _getPlayerPos();
    if (_dist2(ppos, spos) <= MEDICAL_RADIUS_SQ) {
      var hp = _getPlayerHP();
      if (hp < 100) { _setPlayerHP(hp + MEDICAL_HEAL_RATE * dt); }
    }
    // Heal squad
    if (window.SquadTactics && window.SquadTactics.getSquad) {
      var squad = window.SquadTactics.getSquad();
      for (var si = 0; si < squad.length; si++) {
        var m = squad[si];
        var mpos = m.mesh ? m.mesh.position : m.position;
        if (!mpos) continue;
        if (_dist2(mpos, spos) <= MEDICAL_RADIUS_SQ && m.hp !== undefined && m.hp < 100) {
          m.hp = Math.min(100, m.hp + MEDICAL_HEAL_RATE * dt);
        }
      }
    }
  }

  function _updateRazorWire(struct, dt) {
    var spos = struct.mesh.position;
    var enemies = _getEnemies();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!_isEnemyAlive(e)) continue;
      var epos = _getEnemyPos(e);
      if (!epos) continue;
      if (_dist2(epos, spos) <= RAZOR_RADIUS_SQ) {
        // Slow enemy
        if (e.speedMult !== undefined) { e.speedMult = Math.min(e.speedMult, RAZOR_SLOW); }
        else { e._razorSlow = RAZOR_SLOW; }
        // Deal damage
        _dealEnemyDamage(e, RAZOR_DPS * dt);
      } else {
        // Remove slow if they've left
        if (e._razorSlow !== undefined) { delete e._razorSlow; }
      }
    }
  }

  function _updateSpottingTower(struct, dt) {
    var mesh = struct.mesh;
    if (mesh._blinkMesh) {
      var on = (Math.sin(_time * 4) > 0);
      if (mesh._blinkLight) { mesh._blinkLight.intensity = on ? 3 : 0; }
      if (mesh._blinkMat)   { mesh._blinkMat.emissiveIntensity = on ? 1 : 0.1; }
    }
  }

  function _updateStructure(struct, dt) {
    if (struct.destroyed) return;
    switch (struct.type) {
      case 3: _updateMGNest(struct, dt);      break;
      case 4: _updateAmmoCrate(struct, dt);   break;
      case 5: _updateMedicalTent(struct, dt); break;
      case 6: _updateRazorWire(struct, dt);   break;
      case 8: _updateSpottingTower(struct, dt); break;
      default: break;
    }
  }

  // ─────────────────────────────────────────────── enemy AI priority hook

  function _updateEnemyStructurePriority() {
    // Give enemy systems a reference so enemies can pathfind toward structures
    var alive = [];
    for (var i = 0; i < _structures.length; i++) {
      if (!_structures[i].destroyed) { alive.push(_structures[i]); }
    }
    window._fobStructures = alive;
  }

  // ─────────────────────────────────────────────── damage API

  function _damageStructure(struct, amount) {
    if (!struct || struct.destroyed) return;
    struct.hp -= amount;
    if (struct.hp <= 0) {
      struct.hp = 0;
      _destroyStructure(struct, false);
      // Re-check FOB if needed
      if (_fobEstablished) {
        var aliveCount = 0;
        for (var i = 0; i < _structures.length; i++) {
          if (!_structures[i].destroyed) { aliveCount++; }
        }
        if (aliveCount < FOB_THRESHOLD) { _fobEstablished = false; window._scoreMultiplier = 1.0; }
      }
    }
  }

  // Expose for enemy systems
  function _registerDamageHook() {
    window._fobDamageStructure = _damageStructure;
    window._fobStructures = _structures;
  }

  // ─────────────────────────────────────────────── key / mouse events

  function _onKeyDown(e) {
    _keysDown[e.key] = true;
    _keyPressed[e.key] = true;
  }

  function _onKeyUp(e) {
    _keysDown[e.key] = false;
  }

  function _onMouseDown(e) {
    if (e.button === 0) { _mouseClicked = true; }
  }

  // ─────────────────────────────────────────────── public API

  function addSupplyPoints(n) {
    _sp += n;
    _updateSPHud();
    if (_buildMenuOpen) { _renderBuildMenu(); }
  }

  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    _createHUD();
    _updateSPHud();
    _registerDamageHook();

    window.addEventListener('keydown',   _onKeyDown,   false);
    window.addEventListener('keyup',     _onKeyUp,     false);
    window.addEventListener('mousedown', _onMouseDown, false);

    // Hook into kill events if available
    var _origOnKill = window._onEnemyKilled;
    window._onEnemyKilled = function (e) {
      addSupplyPoints(SP_PER_KILL);
      if (_origOnKill) { _origOnKill(e); }
    };
  }

  function update(delta) {
    _time += delta;

    // Drain key-pressed buffer
    var kp = _keyPressed;
    _keyPressed = {};
    var mc = _mouseClicked;
    _mouseClicked = false;

    // --- Key: B — toggle build menu
    if (kp['b'] || kp['B']) {
      _toggleBuildMenu();
    }

    // --- Key: Escape — close build menu
    if (kp['Escape'] && _buildMenuOpen) {
      _toggleBuildMenu(false);
      _clearGhost();
      _selectedItem = 0;
    }

    // --- Keys 1-8 — select build item
    for (var n = 1; n <= 8; n++) {
      if (kp[String(n)] && _buildMenuOpen) {
        _selectedItem = n;
        _playClick();
        _renderBuildMenu();
        _showToast('[' + n + '] ' + BUILD_ITEMS[n - 1].name + ' selected  (' + BUILD_ITEMS[n - 1].cost + ' SP)', '#aaffaa', 1500);
      }
    }

    // --- Key: Delete — bulldoze
    if (kp['Delete']) { _tryBulldoze(); }

    // Ghost preview
    if (_buildMenuOpen && _selectedItem) {
      _ensureGhost(_selectedItem);
    } else {
      _clearGhost();
    }

    // --- LMB — place item (only when menu open and item selected)
    if (mc && _buildMenuOpen && _selectedItem && document.pointerLockElement) {
      _placeSelected();
    }

    // Update all structures
    for (var i = 0; i < _structures.length; i++) {
      _updateStructure(_structures[i], delta);
    }

    // Update enemy priority reference
    _updateEnemyStructurePriority();

    // Update SP HUD
    _updateSPHud();
  }

  function reset() {
    // Remove all structure meshes and rubble
    for (var i = 0; i < _structures.length; i++) {
      var s = _structures[i];
      if (_scene) {
        if (!s.destroyed) { _scene.remove(s.mesh); }
        if (s.rubble)     { _scene.remove(s.rubble); }
      }
    }
    _structures = [];
    _clearGhost();

    _sp              = 0;
    _buildMenuOpen   = false;
    _selectedItem    = 0;
    _fobEstablished  = false;
    _time            = 0;
    _keysDown        = {};
    _keyPressed      = {};
    _mouseClicked    = false;

    window._fobStructures   = [];
    window._fobRadarActive  = false;
    window._scoreMultiplier = 1.0;

    if (_buildMenu)  { _buildMenu.style.display  = 'none'; }
    if (_fobBanner)  { _fobBanner.style.display  = 'none'; }
    if (_toast)      { _toast.style.display      = 'none'; }
    _updateSPHud();
    _registerDamageHook();
  }

  // ─────────────────────────────────────────────── expose

  return {
    init:            init,
    update:          update,
    addSupplyPoints: addSupplyPoints,
    buildItem:       buildItem,
    reset:           reset
  };
})();
