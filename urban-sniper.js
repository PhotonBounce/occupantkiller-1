/* ───────────────────────────────────────────────────────────────────────────
   urban-sniper.js — Urban Sniper Mini-Game
   API: window.UrbanSniper = { init, update, reset }
   Activation: U + S simultaneous keypress (both within 400ms)

   Controls:
     U + S               → activate / deactivate
     Right-click (MB2)   → enter scope (crosshair overlay + breath sway)
     Shift               → hold breath (stops sway 3s, then tremor)
     Space               → fire shot (8s bolt-action cooldown)
     Z                   → toggle spotter scope (wider FOV, marks targets)
     Move 5u             → break counter-sniper contact
   ─────────────────────────────────────────────────────────────────────────── */
window.UrbanSniper = (function () {
  'use strict';

  /* ── Activation chord ──────────────────────────────────────────────────── */
  var CHORD_KEYS      = ['KeyU', 'KeyS'];
  var CHORD_WINDOW_MS = 400;

  /* ── Platform / environment constants ─────────────────────────────────── */
  var PLATFORM_COLOR    = 0x556644;
  var AC_UNIT_COLOR     = 0x445555;
  var RAILING_COLOR     = 0x888844;
  var BUILDING_COLORS   = [0x334455, 0x445566];

  /* ── Enemy sniper constants ────────────────────────────────────────────── */
  var ENEMY_SNIPER_COLOR  = 0x334433;
  var ENEMY_WINDOW_COLOR  = 0x44AAFF;
  var ENEMY_FLASH_COLOR   = 0xFF4400;
  var ENEMY_COUNT         = 4;
  var ENEMY_FIRE_MIN      = 15;   /* seconds */
  var ENEMY_FIRE_MAX      = 25;   /* seconds */
  var ENEMY_HIT_DAMAGE    = 45;
  var ENEMY_FLASH_DURATION = 0.25; /* seconds */

  /* ── HVT (high-value target) constants ─────────────────────────────────── */
  var HVT_COLOR           = 0x220033;
  var HVT_COUNT           = 3;
  var HVT_EXPOSURE_TIME   = 2.0;  /* seconds window is open */
  var HVT_RELOCATE_TIME   = 45.0; /* seconds until next appearance */
  var HVT_SCORE           = 500;

  /* ── Spotter scope ─────────────────────────────────────────────────────── */
  var SPOTTER_MARK_COLOR  = 0x44FFCC;
  var SPOTTER_MARK_TIME   = 8.0;  /* seconds mark lasts */

  /* ── Counter-sniper constants ──────────────────────────────────────────── */
  var COUNTER_SNIPER_FOCUS_TIME = 10.0; /* seconds all enemies focus player */
  var COUNTER_SNIPER_TRIPLE_RATE = 3;   /* triple fire rate multiplier */
  var COUNTER_SNIPER_MOVE_DIST  = 5.0;  /* units player must move to break contact */

  /* ── Breath / sway constants ───────────────────────────────────────────── */
  var SWAY_RATE      = 0.003; /* radians per second base */
  var BREATH_HOLD_DURATION = 3.0; /* seconds hold before tremor */
  var TREMOR_AMP     = 0.006; /* radians tremor amplitude */

  /* ── Wind constants ────────────────────────────────────────────────────── */
  var WIND_AMBIENT_COLOR = 0x6688AA;
  var WIND_DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  var WIND_CROSSHAIR_SCALE = 0.001; /* radians per m/s per axis */

  /* ── Observer NPC constants ─────────────────────────────────────────────── */
  var OBSERVER_COLOR        = 0x334422;
  var OBSERVER_HUD_TIME     = 3.0;  /* seconds call-out shown */
  var OBSERVER_MISID_CHANCE = 0.15; /* 15 % false call rate */

  /* ── Ammo / firing constants ───────────────────────────────────────────── */
  var BOLT_COOLDOWN = 8.0; /* seconds between shots */
  var STARTING_AMMO = 10;

  /* ── FOV constants ─────────────────────────────────────────────────────── */
  var SCOPE_FOV   = 8;   /* degrees while scoped */
  var SPOTTER_FOV = 20;  /* degrees for spotter scope */
  var NORMAL_FOV  = 75;  /* degrees normal */

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Module state ──────────────────────────────────────────────────────── */
  var _active       = false;
  var _score        = 0;
  var _playerHP     = 100;
  var _ammo         = STARTING_AMMO;

  /* ── Chord detection ───────────────────────────────────────────────────── */
  var _chordTracker  = {};   /* code → timestamp */

  /* ── Input state ───────────────────────────────────────────────────────── */
  var _rightMouseDown = false;
  var _shiftDown      = false;
  var _scoped         = false;
  var _spotterMode    = false;

  /* ── Player position (for contact-break check) ─────────────────────────── */
  var _playerPos      = { x: 0, y: 2, z: 0 };
  var _contactBreakPos = null; /* position when counter-sniper was triggered */

  /* ── Firing state ──────────────────────────────────────────────────────── */
  var _boltCooldown   = 0;   /* seconds remaining */

  /* ── Breath hold state ─────────────────────────────────────────────────── */
  var _breathHeld       = false;
  var _breathHoldTimer  = 0;   /* time breath has been held */
  var _inTremor         = false;
  var _tremorPhase      = 0;

  /* ── Sway state ────────────────────────────────────────────────────────── */
  var _swayX = 0;  /* accumulated sway radians X */
  var _swayY = 0;  /* accumulated sway radians Y */
  var _swayPhaseX = 0;
  var _swayPhaseY = Math.PI * 0.7; /* offset so X/Y don't sync */

  /* ── Wind state ─────────────────────────────────────────────────────────── */
  var _windSpeed    = 0;   /* m/s 0–3 */
  var _windDirIdx   = 0;   /* index into WIND_DIRS */
  var _windDriftX   = 0;   /* radians drift per second */
  var _windDriftY   = 0;
  var _windLight    = null;
  var _windTimer    = 0;   /* reroll wind every 30s */

  /* ── Enemy snipers ─────────────────────────────────────────────────────── */
  var _enemySnipers = []; /* { mesh, windowMesh, flashLight, fireTimer, alive, building, focused } */

  /* ── HVT targets ───────────────────────────────────────────────────────── */
  var _hvts = [];  /* { mesh, alive, exposed, exposeTimer, relocateTimer, building, floor, window } */
  var _hvtKilled = 0;

  /* ── Counter-sniper state ──────────────────────────────────────────────── */
  var _counterSniperActive = false;
  var _counterSniperTimer  = 0;

  /* ── Spotter marks ─────────────────────────────────────────────────────── */
  var _spotterMarks = []; /* { light, timer } */

  /* ── Observer callout state ─────────────────────────────────────────────── */
  var _observerCallout     = '';
  var _observerCalloutTimer = 0;
  var _observerMesh        = null;

  /* ── Scene objects ─────────────────────────────────────────────────────── */
  var _platform       = null;
  var _acUnits        = [];
  var _railings       = [];
  var _buildings      = [];
  var _sceneRoot      = null;

  /* ── HUD & overlay elements ─────────────────────────────────────────────── */
  var _hudEl      = null;
  var _scopeEl    = null;
  var _svgEl      = null;

  /* ── Building definitions (distance, x offset, y height, label) ─────────── */
  var BUILDING_DEFS = [
    { dist: 35, x: -25, h: 40, w: 14, d: 10, floors: 8 },
    { dist: 50, x:  -5, h: 55, w: 12, d: 10, floors: 11 },
    { dist: 60, x:  18, h: 48, w: 16, d: 12, floors: 9 },
    { dist: 45, x: -18, h: 35, w: 10, d: 10, floors: 7 },
    { dist: 75, x:  30, h: 60, w: 14, d: 12, floors: 12 }
  ];

  /* ═══════════════════════════════════════════════════════════════════════════
     GEOMETRY HELPERS
  ═══════════════════════════════════════════════════════════════════════════ */

  function _makeBox(w, h, d, color, x, y, z) {
    var geo  = new THREE.BoxGeometry(w, h, d);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function _makeLineSegments(points, color) {
    var geo = new THREE.BufferGeometry();
    var verts = [];
    var i;
    for (i = 0; i < points.length; i++) {
      verts.push(points[i].x, points[i].y, points[i].z);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  function _makePointLight(color, intensity, distance) {
    return new THREE.PointLight(color, intensity || 1, distance || 30);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     SCENE SETUP
  ═══════════════════════════════════════════════════════════════════════════ */

  function _buildScene() {
    _sceneRoot = new THREE.Group();

    /* ── Ambient light ────────────────────────────────────────────────────── */
    var ambient = new THREE.AmbientLight(0x334455, 0.6);
    _sceneRoot.add(ambient);

    var sunLight = new THREE.DirectionalLight(0xCCDDFF, 0.8);
    sunLight.position.set(50, 100, 30);
    _sceneRoot.add(sunLight);

    /* ── Platform (top of skyscraper) ─────────────────────────────────────── */
    _platform = _makeBox(20, 1, 15, PLATFORM_COLOR, 0, 0, 0);
    _sceneRoot.add(_platform);

    /* Tall skyscraper body below platform */
    var body = _makeBox(20, 80, 15, 0x445544, 0, -40.5, 0);
    _sceneRoot.add(body);

    /* ── 6 Air conditioning units as cover ────────────────────────────────── */
    var acPositions = [
      { x: -6, z: -4 }, { x: 0, z: -4 }, { x: 6, z: -4 },
      { x: -6, z:  4 }, { x: 0, z:  4 }, { x: 6, z:  4 }
    ];
    var ai;
    for (ai = 0; ai < acPositions.length; ai++) {
      var ac = _makeBox(2.5, 1.5, 2, AC_UNIT_COLOR,
                        acPositions[ai].x, 1.25, acPositions[ai].z);
      _sceneRoot.add(ac);
      _acUnits.push(ac);
    }

    /* ── Railings (LineSegments) ──────────────────────────────────────────── */
    _buildRailings();

    /* ── Opposing buildings ───────────────────────────────────────────────── */
    _buildOpposingBuildings();

    /* ── Wind ambient light ───────────────────────────────────────────────── */
    _windLight = _makePointLight(WIND_AMBIENT_COLOR, 0.4, 50);
    _windLight.position.set(8, 5, 0);
    _sceneRoot.add(_windLight);

    /* ── Observer NPC ─────────────────────────────────────────────────────── */
    _observerMesh = _makeBox(1, 2, 1, OBSERVER_COLOR, 6, 1.5, -5);
    _sceneRoot.add(_observerMesh);

    /* ── Spawn enemy snipers on opposing rooftops ─────────────────────────── */
    _spawnEnemySnipers();

    /* ── Spawn HVT targets ────────────────────────────────────────────────── */
    _spawnHVTs();

    /* ── Sky / fog ────────────────────────────────────────────────────────── */
    _scene.fog = new THREE.Fog(0x1A2233, 80, 200);
    _scene.background = new THREE.Color(0x1A2233);

    _scene.add(_sceneRoot);

    /* Position camera at player start on rooftop */
    _camera.position.set(0, 1.7, 4);
    _camera.rotation.set(0, 0, 0);
  }

  function _buildRailings() {
    /* Four sides — pairs of posts connected by horizontal rails */
    var sides = [
      /* front/back along X axis */
      { axis: 'x', start: -10, end: 10, fixed: -7.5, y: 0.5, count: 11 },
      { axis: 'x', start: -10, end: 10, fixed:  7.5, y: 0.5, count: 11 },
      /* left/right along Z axis */
      { axis: 'z', start: -7.5, end: 7.5, fixed: -10, y: 0.5, count: 9 },
      { axis: 'z', start: -7.5, end: 7.5, fixed:  10, y: 0.5, count: 9 }
    ];
    var si, pts, postCount, step, t;
    for (si = 0; si < sides.length; si++) {
      var s = sides[si];
      pts = [];
      postCount = s.count;
      step = (s.end - s.start) / (postCount - 1);
      /* Bottom rail */
      if (s.axis === 'x') {
        pts.push({ x: s.start, y: s.y + 0.3, z: s.fixed });
        pts.push({ x: s.end,   y: s.y + 0.3, z: s.fixed });
        /* Top rail */
        pts.push({ x: s.start, y: s.y + 1.1, z: s.fixed });
        pts.push({ x: s.end,   y: s.y + 1.1, z: s.fixed });
        /* Vertical posts */
        for (t = 0; t < postCount; t++) {
          var px = s.start + t * step;
          pts.push({ x: px, y: s.y + 0.3, z: s.fixed });
          pts.push({ x: px, y: s.y + 1.1, z: s.fixed });
        }
      } else {
        pts.push({ x: s.fixed, y: s.y + 0.3, z: s.start });
        pts.push({ x: s.fixed, y: s.y + 0.3, z: s.end   });
        pts.push({ x: s.fixed, y: s.y + 1.1, z: s.start });
        pts.push({ x: s.fixed, y: s.y + 1.1, z: s.end   });
        for (t = 0; t < postCount; t++) {
          var pz = s.start + t * step;
          pts.push({ x: s.fixed, y: s.y + 0.3, z: pz });
          pts.push({ x: s.fixed, y: s.y + 1.1, z: pz });
        }
      }
      var rail = _makeLineSegments(pts, RAILING_COLOR);
      _sceneRoot.add(rail);
      _railings.push(rail);
    }
  }

  function _buildOpposingBuildings() {
    var bi, bdef, bcolor, bMesh, floor, win, fy, wx, wz, windowMesh;
    for (bi = 0; bi < BUILDING_DEFS.length; bi++) {
      bdef   = BUILDING_DEFS[bi];
      bcolor = BUILDING_COLORS[bi % BUILDING_COLORS.length];

      bMesh = _makeBox(bdef.w, bdef.h, bdef.d, bcolor,
                       bdef.x, bdef.h / 2 - 40, -bdef.dist);
      _sceneRoot.add(bMesh);

      /* Windows — simple quads embedded in the building face */
      var floorHeight = bdef.h / bdef.floors;
      var winW = 1.5;
      var winH = 1.8;
      var winsPerFloor = Math.floor(bdef.w / 3);
      for (floor = 0; floor < bdef.floors; floor++) {
        fy = (floor * floorHeight) + (floorHeight / 2) - bdef.h / 2 + bdef.h / 2 - 40;
        for (win = 0; win < winsPerFloor; win++) {
          wx = bdef.x - bdef.w / 2 + 1.5 + win * (bdef.w / winsPerFloor);
          wz = -bdef.dist + bdef.d / 2 + 0.05;
          windowMesh = _makeBox(winW, winH, 0.1, ENEMY_WINDOW_COLOR, wx, fy, wz);
          _sceneRoot.add(windowMesh);
        }
      }

      _buildings.push({ def: bdef, mesh: bMesh });
    }
  }

  function _spawnEnemySnipers() {
    /* Place one sniper on each of the first 4 buildings */
    var i, bdef, sniper, flashLight, x, y, z;
    for (i = 0; i < ENEMY_COUNT; i++) {
      bdef = BUILDING_DEFS[i % BUILDING_DEFS.length];

      /* Sniper sits near top of opposing building */
      x = bdef.x + (Math.random() * 4 - 2);
      y = bdef.h - 40 + bdef.h / 2 - 1.5; /* near rooftop */
      z = -bdef.dist + bdef.d / 2 - 0.5;

      sniper = _makeBox(1, 2, 1, ENEMY_SNIPER_COLOR, x, y, z);
      _sceneRoot.add(sniper);

      flashLight = _makePointLight(ENEMY_FLASH_COLOR, 0, 20);
      flashLight.position.set(x, y + 1, z);
      _sceneRoot.add(flashLight);

      _enemySnipers.push({
        mesh:        sniper,
        flashLight:  flashLight,
        flashTimer:  0,
        fireTimer:   ENEMY_FIRE_MIN + Math.random() * (ENEMY_FIRE_MAX - ENEMY_FIRE_MIN),
        alive:       true,
        building:    i % BUILDING_DEFS.length,
        focused:     false,
        focusedFireMult: 1
      });
    }
  }

  function _spawnHVTs() {
    /* One HVT per first 3 buildings, hidden by default */
    var i, bdef, hvt, x, y, z;
    for (i = 0; i < HVT_COUNT; i++) {
      bdef = BUILDING_DEFS[i];

      x = bdef.x;
      y = bdef.h * 0.5 - 40 + Math.random() * (bdef.h * 0.3);
      z = -bdef.dist + bdef.d / 2 + 0.15;

      hvt = _makeBox(1, 1.8, 0.5, HVT_COLOR, x, y, z);
      hvt.visible = false;
      _sceneRoot.add(hvt);

      _hvts.push({
        mesh:          hvt,
        alive:         true,
        exposed:       false,
        exposeTimer:   0,
        relocateTimer: HVT_RELOCATE_TIME * (0.5 + Math.random()),
        building:      i,
        floor:         Math.floor(Math.random() * bdef.floors) + 1,
        window:        Math.floor(Math.random() * 3) + 1
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     WIND
  ═══════════════════════════════════════════════════════════════════════════ */

  function _rerollWind() {
    _windSpeed  = Math.random() * 3;          /* 0–3 m/s */
    _windDirIdx = Math.floor(Math.random() * WIND_DIRS.length);

    /* Map direction to drift (rough cardinal → axis components) */
    var angle = (_windDirIdx / WIND_DIRS.length) * Math.PI * 2;
    _windDriftX = Math.cos(angle) * _windSpeed * WIND_CROSSHAIR_SCALE;
    _windDriftY = Math.sin(angle) * _windSpeed * WIND_CROSSHAIR_SCALE * 0.4;

    /* Pulse wind light to indicate wind event */
    if (_windLight) {
      _windLight.intensity = 1.5;
    }
    _windTimer = 30;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     HUD
  ═══════════════════════════════════════════════════════════════════════════ */

  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'urban-sniper-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.65)',
      'color:#C8FF88',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border:1px solid #445533',
      'pointer-events:none',
      'z-index:9100',
      'white-space:nowrap',
      'letter-spacing:0.05em'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) { return; }

    var breath = _breathHeld ? (_inTremor ? 'TREMOR' : 'HELD') : 'FREE';
    var wind   = _windSpeed.toFixed(1) + ' ' + WIND_DIRS[_windDirIdx];
    var alive  = 0;
    var ei;
    for (ei = 0; ei < _enemySnipers.length; ei++) {
      if (_enemySnipers[ei].alive) { alive++; }
    }
    var counterStr = _counterSniperActive
      ? ' | COUNTER-SNIPER: ' + Math.ceil(_counterSniperTimer) + 's'
      : '';

    var observerStr = _observerCalloutTimer > 0
      ? ' | OBS: ' + _observerCallout
      : '';

    _hudEl.textContent =
      'SNIPER' +
      ' [BREATH: ' + breath + ']' +
      ' [WIND: ' + wind + ']' +
      ' [ENEMY SNIPERS: ' + alive + ']' +
      ' [HVT: ' + _hvtKilled + '/3]' +
      ' [AMMO: ' + _ammo + ']' +
      counterStr +
      observerStr;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     SCOPE OVERLAY
  ═══════════════════════════════════════════════════════════════════════════ */

  function _createScopeOverlay() {
    _scopeEl = document.createElement('div');
    _scopeEl.id = 'urban-sniper-scope';
    _scopeEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:9050',
      'display:none'
    ].join(';');

    /* SVG for scope reticle */
    _svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    _svgEl.setAttribute('width', '100%');
    _svgEl.setAttribute('height', '100%');
    _svgEl.style.cssText = 'position:absolute;top:0;left:0;';

    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    /* Radial mask — black with clear center circle */
    var mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
    mask.setAttribute('id', 'scope-mask');

    var maskRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    maskRect.setAttribute('x', '0');
    maskRect.setAttribute('y', '0');
    maskRect.setAttribute('width', '100%');
    maskRect.setAttribute('height', '100%');
    maskRect.setAttribute('fill', 'white');

    var maskCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    maskCircle.setAttribute('cx', '50%');
    maskCircle.setAttribute('cy', '50%');
    maskCircle.setAttribute('r', '38%');
    maskCircle.setAttribute('fill', 'black');

    mask.appendChild(maskRect);
    mask.appendChild(maskCircle);
    defs.appendChild(mask);
    _svgEl.appendChild(defs);

    /* Black vignette around scope circle */
    var vignetteRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    vignetteRect.setAttribute('x', '0');
    vignetteRect.setAttribute('y', '0');
    vignetteRect.setAttribute('width', '100%');
    vignetteRect.setAttribute('height', '100%');
    vignetteRect.setAttribute('fill', 'black');
    vignetteRect.setAttribute('mask', 'url(#scope-mask)');
    _svgEl.appendChild(vignetteRect);

    /* Outer black circle ring */
    var outerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    outerRing.setAttribute('cx', '50%');
    outerRing.setAttribute('cy', '50%');
    outerRing.setAttribute('r', '38%');
    outerRing.setAttribute('fill', 'none');
    outerRing.setAttribute('stroke', '#000');
    outerRing.setAttribute('stroke-width', '4');
    _svgEl.appendChild(outerRing);

    /* Inner black circle (double-ring feel) */
    var innerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    innerRing.setAttribute('cx', '50%');
    innerRing.setAttribute('cy', '50%');
    innerRing.setAttribute('r', '6%');
    innerRing.setAttribute('fill', 'none');
    innerRing.setAttribute('stroke', 'rgba(0,0,0,0.6)');
    innerRing.setAttribute('stroke-width', '1.5');
    _svgEl.appendChild(innerRing);

    _scopeEl.appendChild(_svgEl);
    document.body.appendChild(_scopeEl);

    /* Build LineSegments crosshair via canvas overlay (Three.js doesn't render to DOM) */
    /* We use SVG lines for crosshair */
    _scopeEl._crosshairGroup = _buildSVGCrosshair();
    _svgEl.appendChild(_scopeEl._crosshairGroup);
  }

  function _buildSVGCrosshair() {
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', 'scope-crosshair');
    g.setAttribute('stroke', '#88FF44');
    g.setAttribute('stroke-width', '1');
    g.setAttribute('opacity', '0.85');

    /* Horizontal line */
    var hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hLine.setAttribute('x1', '12%');  hLine.setAttribute('y1', '50%');
    hLine.setAttribute('x2', '88%');  hLine.setAttribute('y2', '50%');
    g.appendChild(hLine);

    /* Vertical line */
    var vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    vLine.setAttribute('x1', '50%');  vLine.setAttribute('y1', '12%');
    vLine.setAttribute('x2', '50%');  vLine.setAttribute('y2', '88%');
    g.appendChild(vLine);

    /* Center dot */
    var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', '50%');
    dot.setAttribute('cy', '50%');
    dot.setAttribute('r', '2');
    dot.setAttribute('fill', '#88FF44');
    dot.setAttribute('stroke', 'none');
    g.appendChild(dot);

    /* Mil-dot marks on horizontal (left 4, right 4) */
    var milPositions = [-30, -20, -10, 10, 20, 30]; /* percent offset from center */
    var mi;
    for (mi = 0; mi < milPositions.length; mi++) {
      var milDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      milDot.setAttribute('cx', (50 + milPositions[mi]) + '%');
      milDot.setAttribute('cy', '50%');
      milDot.setAttribute('r', '1.5');
      milDot.setAttribute('fill', '#88FF44');
      milDot.setAttribute('stroke', 'none');
      g.appendChild(milDot);
    }

    return g;
  }

  function _updateScopeTransform(swayXrad, swayYrad) {
    /* Translate crosshair group to simulate sway */
    if (!_scopeEl || !_scopeEl._crosshairGroup) { return; }
    /* Convert radians to approximate pixel offset (rough mapping) */
    var pxX = swayXrad * 4000;
    var pxY = swayYrad * 4000;
    _scopeEl._crosshairGroup.setAttribute('transform',
      'translate(' + pxX.toFixed(1) + ',' + pxY.toFixed(1) + ')');
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     SCOPE ENTER / EXIT
  ═══════════════════════════════════════════════════════════════════════════ */

  function _enterScope() {
    if (_spotterMode) { _exitSpotterScope(); }
    _scoped = true;
    if (_scopeEl) { _scopeEl.style.display = 'block'; }
    if (_camera) { _camera.fov = SCOPE_FOV; _camera.updateProjectionMatrix(); }
  }

  function _exitScope() {
    _scoped = false;
    if (_scopeEl) { _scopeEl.style.display = 'none'; }
    if (_camera)  { _camera.fov = NORMAL_FOV; _camera.updateProjectionMatrix(); }
    _breathHeld = false;
    _inTremor   = false;
    _breathHoldTimer = 0;
  }

  function _enterSpotterScope() {
    if (_scoped) { _exitScope(); }
    _spotterMode = true;
    if (_camera) { _camera.fov = SPOTTER_FOV; _camera.updateProjectionMatrix(); }
    /* Mark visible enemies with PointLights */
    _markTargetsWithSpotter();
  }

  function _exitSpotterScope() {
    _spotterMode = false;
    if (_camera) { _camera.fov = NORMAL_FOV; _camera.updateProjectionMatrix(); }
  }

  function _markTargetsWithSpotter() {
    /* Add temporary marker lights to alive enemy snipers & HVTs */
    var i, light, hvt;
    for (i = 0; i < _enemySnipers.length; i++) {
      if (!_enemySnipers[i].alive) { continue; }
      light = _makePointLight(SPOTTER_MARK_COLOR, 2, 25);
      light.position.copy(_enemySnipers[i].mesh.position);
      light.position.y += 2;
      _sceneRoot.add(light);
      _spotterMarks.push({ light: light, timer: SPOTTER_MARK_TIME });
    }
    for (i = 0; i < _hvts.length; i++) {
      hvt = _hvts[i];
      if (!hvt.alive || !hvt.exposed) { continue; }
      light = _makePointLight(SPOTTER_MARK_COLOR, 2, 25);
      light.position.copy(hvt.mesh.position);
      light.position.y += 1;
      _sceneRoot.add(light);
      _spotterMarks.push({ light: light, timer: SPOTTER_MARK_TIME });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     FIRING
  ═══════════════════════════════════════════════════════════════════════════ */

  function _fireShot() {
    if (!_scoped && !_spotterMode) { return; }
    if (_spotterMode) { return; } /* can't fire in spotter mode */
    if (_boltCooldown > 0) { return; }
    if (_ammo <= 0) { return; }

    _ammo--;
    _boltCooldown = BOLT_COOLDOWN;

    /* Check HVT hits (simple camera look-at raycasting approximation) */
    _checkHVTHit();

    /* Trigger counter-sniper response */
    _triggerCounterSniper();

    /* Muzzle flash at player position (brief PointLight) */
    var muzzleFlash = _makePointLight(0xFFDD88, 3, 15);
    muzzleFlash.position.set(
      _camera.position.x,
      _camera.position.y,
      _camera.position.z - 1
    );
    _sceneRoot.add(muzzleFlash);
    /* Remove after brief flash */
    var _fl = muzzleFlash;
    var _flTimer = { t: 0.1 };
    _fl._removeTimer = _flTimer;
    _sceneRoot.userData = _sceneRoot.userData || {};
    _sceneRoot.userData._muzzleFlashes = _sceneRoot.userData._muzzleFlashes || [];
    _sceneRoot.userData._muzzleFlashes.push({ light: _fl, timer: 0.1 });
  }

  function _checkHVTHit() {
    /* Determine if camera is roughly aimed at an exposed HVT */
    /* Use simplified angular check: compare camera forward to direction to HVT */
    var camDir = new THREE.Vector3(0, 0, -1);
    camDir.applyEuler(_camera.rotation);

    var i, hvt, toHVT, angle;
    for (i = 0; i < _hvts.length; i++) {
      hvt = _hvts[i];
      if (!hvt.alive || !hvt.exposed) { continue; }

      toHVT = new THREE.Vector3();
      toHVT.subVectors(hvt.mesh.position, _camera.position).normalize();
      angle = camDir.dot(toHVT);

      if (angle > 0.998) { /* ~3.6 degree tolerance */
        /* HIT */
        hvt.alive    = false;
        hvt.exposed  = false;
        hvt.mesh.visible = false;
        _hvtKilled++;
        _score += HVT_SCORE;
        _showObserverCallout('HIT CONFIRMED: HVT DOWN +500');
        return;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     COUNTER-SNIPER
  ═══════════════════════════════════════════════════════════════════════════ */

  function _triggerCounterSniper() {
    _counterSniperActive = true;
    _counterSniperTimer  = COUNTER_SNIPER_FOCUS_TIME;
    _contactBreakPos = {
      x: _camera.position.x,
      y: _camera.position.y,
      z: _camera.position.z
    };

    /* All alive snipers focus the player */
    var i;
    for (i = 0; i < _enemySnipers.length; i++) {
      if (_enemySnipers[i].alive) {
        _enemySnipers[i].focused = true;
      }
    }
  }

  function _checkContactBreak() {
    if (!_counterSniperActive || !_contactBreakPos) { return; }
    var dx = _camera.position.x - _contactBreakPos.x;
    var dz = _camera.position.z - _contactBreakPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist >= COUNTER_SNIPER_MOVE_DIST) {
      _breakCounterContact();
    }
  }

  function _breakCounterContact() {
    _counterSniperActive = false;
    _counterSniperTimer  = 0;
    _contactBreakPos     = null;
    var i;
    for (i = 0; i < _enemySnipers.length; i++) {
      _enemySnipers[i].focused          = false;
      _enemySnipers[i].focusedFireMult  = 1;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     ENEMY SNIPER UPDATE
  ═══════════════════════════════════════════════════════════════════════════ */

  function _updateEnemySnipers(dt) {
    var i, sniper, fireInterval, tripleActive;

    /* Check if player is standing still during counter-sniper (triple rate) */
    tripleActive = _counterSniperActive && (_contactBreakPos !== null);

    for (i = 0; i < _enemySnipers.length; i++) {
      sniper = _enemySnipers[i];
      if (!sniper.alive) { continue; }

      /* Flash timer decay */
      if (sniper.flashTimer > 0) {
        sniper.flashTimer -= dt;
        sniper.flashLight.intensity = sniper.flashTimer > 0 ? 4 : 0;
      }

      /* Fire timer */
      sniper.fireTimer -= dt;
      if (sniper.fireTimer <= 0) {
        _enemySniperFire(sniper, tripleActive);
        /* Reset fire timer */
        fireInterval = ENEMY_FIRE_MIN + Math.random() * (ENEMY_FIRE_MAX - ENEMY_FIRE_MIN);
        if (sniper.focused) {
          fireInterval /= (tripleActive ? COUNTER_SNIPER_TRIPLE_RATE : 2);
        }
        sniper.fireTimer = fireInterval;
      }
    }
  }

  function _enemySniperFire(sniper, tripleActive) {
    /* Flash PointLight at sniper position — only visible way to locate them */
    sniper.flashLight.intensity = 4;
    sniper.flashTimer = ENEMY_FLASH_DURATION;

    /* Damage player (simplified: always hits while focused / counter-sniper active) */
    if (sniper.focused || Math.random() < 0.3) {
      _playerHP -= ENEMY_HIT_DAMAGE;
      if (_playerHP < 0) { _playerHP = 0; }
      _showObserverCallout('INCOMING! HP: ' + _playerHP);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     HVT UPDATE
  ═══════════════════════════════════════════════════════════════════════════ */

  function _updateHVTs(dt) {
    var i, hvt;
    for (i = 0; i < _hvts.length; i++) {
      hvt = _hvts[i];
      if (!hvt.alive) { continue; }

      if (hvt.exposed) {
        hvt.exposeTimer -= dt;
        if (hvt.exposeTimer <= 0) {
          /* Window closed — target relocates */
          hvt.exposed = false;
          hvt.mesh.visible = false;
          hvt.relocateTimer = HVT_RELOCATE_TIME;
        }
      } else {
        hvt.relocateTimer -= dt;
        if (hvt.relocateTimer <= 0) {
          /* Expose target briefly */
          _exposeHVT(hvt, i);
        }
      }
    }
  }

  function _exposeHVT(hvt, idx) {
    hvt.exposed = true;
    hvt.exposeTimer = HVT_EXPOSURE_TIME;
    hvt.mesh.visible = true;

    /* Potentially trigger observer callout */
    var bdef   = BUILDING_DEFS[hvt.building];
    var isAlly = true;
    /* 15% misidentification chance */
    if (Math.random() < OBSERVER_MISID_CHANCE) {
      isAlly = false;
    }
    if (isAlly) {
      var callout = 'TARGET: FLOOR ' + hvt.floor + ' WINDOW ' + hvt.window +
                    ' BLDG ' + (hvt.building + 1);
      _showObserverCallout(callout);
    } else {
      /* False call on a different building */
      var fakeBuilding = (hvt.building + 1 + Math.floor(Math.random() * 3)) % BUILDING_DEFS.length;
      _showObserverCallout('TARGET: FLOOR ' + (Math.floor(Math.random() * 6) + 1) +
                           ' WINDOW ' + (Math.floor(Math.random() * 3) + 1) +
                           ' BLDG ' + (fakeBuilding + 1) + ' (?)');
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     OBSERVER CALLOUT
  ═══════════════════════════════════════════════════════════════════════════ */

  function _showObserverCallout(text) {
    _observerCallout      = text;
    _observerCalloutTimer = OBSERVER_HUD_TIME;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     SWAY & BREATH UPDATE
  ═══════════════════════════════════════════════════════════════════════════ */

  function _updateSway(dt) {
    if (!_scoped) {
      _swayX = 0;
      _swayY = 0;
      _updateScopeTransform(0, 0);
      return;
    }

    if (_breathHeld) {
      _breathHoldTimer += dt;
      if (_breathHoldTimer >= BREATH_HOLD_DURATION) {
        /* Involuntary tremor kicks in */
        _inTremor = true;
      }

      if (_inTremor) {
        _tremorPhase += dt * 12;
        _swayX = Math.sin(_tremorPhase * 1.3) * TREMOR_AMP;
        _swayY = Math.cos(_tremorPhase)         * TREMOR_AMP;
      } else {
        /* Sway stops during held breath */
        /* Keep last sway value — no new drift */
      }
    } else {
      /* Free breath — apply sway */
      _breathHoldTimer = 0;
      _inTremor        = false;
      _swayPhaseX     += dt * 0.7;
      _swayPhaseY     += dt * 0.53;
      _swayX = Math.sin(_swayPhaseX) * SWAY_RATE;
      _swayY = Math.cos(_swayPhaseY) * SWAY_RATE * 0.6;
    }

    /* Add wind drift (manual compensation required) */
    _swayX += _windDriftX * dt;
    _swayY += _windDriftY * dt;

    _updateScopeTransform(_swayX, _swayY);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     SPOTTER MARKS UPDATE
  ═══════════════════════════════════════════════════════════════════════════ */

  function _updateSpotterMarks(dt) {
    var i, mark;
    for (i = _spotterMarks.length - 1; i >= 0; i--) {
      mark = _spotterMarks[i];
      mark.timer -= dt;
      if (mark.timer <= 0) {
        _sceneRoot.remove(mark.light);
        _spotterMarks.splice(i, 1);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     MUZZLE FLASH CLEANUP
  ═══════════════════════════════════════════════════════════════════════════ */

  function _updateMuzzleFlashes(dt) {
    if (!_sceneRoot.userData || !_sceneRoot.userData._muzzleFlashes) { return; }
    var flashes = _sceneRoot.userData._muzzleFlashes;
    var i, f;
    for (i = flashes.length - 1; i >= 0; i--) {
      f = flashes[i];
      f.timer -= dt;
      if (f.timer <= 0) {
        _sceneRoot.remove(f.light);
        flashes.splice(i, 1);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     WIND UPDATE
  ═══════════════════════════════════════════════════════════════════════════ */

  function _updateWind(dt) {
    _windTimer -= dt;
    if (_windTimer <= 0) {
      _rerollWind();
    }
    /* Fade wind light back to ambient */
    if (_windLight && _windLight.intensity > 0.4) {
      _windLight.intensity -= dt * 2;
      if (_windLight.intensity < 0.4) { _windLight.intensity = 0.4; }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     INPUT HANDLERS
  ═══════════════════════════════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    if (!_active) {
      /* Chord detection even when inactive, to activate */
      _detectChord(e.code);
      return;
    }

    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      _shiftDown   = true;
      _breathHeld  = true;
    }

    if (e.code === 'Space') {
      e.preventDefault();
      _fireShot();
    }

    if (e.code === 'KeyZ') {
      if (_spotterMode) {
        _exitSpotterScope();
      } else {
        _enterSpotterScope();
      }
    }
  }

  function _onKeyUp(e) {
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      _shiftDown  = false;
      _breathHeld = false;
      _inTremor   = false;
      _breathHoldTimer = 0;
    }

    /* Chord tracking */
    _detectChord(e.code);
  }

  function _onMouseDown(e) {
    if (!_active) { return; }
    if (e.button === 2) {
      e.preventDefault();
      _enterScope();
      _rightMouseDown = true;
    }
  }

  function _onMouseUp(e) {
    if (!_active) { return; }
    if (e.button === 2) {
      _exitScope();
      _rightMouseDown = false;
    }
  }

  function _onContextMenu(e) {
    if (_active) { e.preventDefault(); }
  }

  /* ── Chord detection ───────────────────────────────────────────────────── */
  function _detectChord(code) {
    var now = Date.now();

    /* Track key presses */
    _chordTracker[code] = now;

    /* Check if both U and S pressed within window */
    var hasU = _chordTracker['KeyU'];
    var hasS = _chordTracker['KeyS'];

    if (hasU && hasS) {
      var diff = Math.abs(hasU - hasS);
      if (diff <= CHORD_WINDOW_MS) {
        /* Toggle activation */
        _chordTracker = {};
        if (_active) {
          _deactivate();
        } else {
          _activate();
        }
      }
    }

    /* Expire stale chord entries */
    var k;
    for (k in _chordTracker) {
      if (_chordTracker.hasOwnProperty(k)) {
        if (now - _chordTracker[k] > CHORD_WINDOW_MS) {
          delete _chordTracker[k];
        }
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     ACTIVATE / DEACTIVATE
  ═══════════════════════════════════════════════════════════════════════════ */

  function _activate() {
    if (_active) { return; }
    _active = true;

    if (_sceneRoot) { _sceneRoot.visible = true; }

    /* Reroll wind on activation */
    _rerollWind();

    if (_hudEl)   { _hudEl.style.display = 'block'; }
    if (_scopeEl) { _scopeEl.style.display = 'none'; }
  }

  function _deactivate() {
    if (!_active) { return; }
    _active = false;

    _exitScope();
    _exitSpotterScope();

    if (_sceneRoot) { _sceneRoot.visible = false; }
    if (_hudEl)     { _hudEl.style.display = 'none'; }
    if (_scopeEl)   { _scopeEl.style.display = 'none'; }

    /* Clean up chord state */
    _chordTracker = {};
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     RESET
  ═══════════════════════════════════════════════════════════════════════════ */

  function _reset() {
    _active              = false;
    _score               = 0;
    _playerHP            = 100;
    _ammo                = STARTING_AMMO;
    _boltCooldown        = 0;
    _breathHeld          = false;
    _inTremor            = false;
    _breathHoldTimer     = 0;
    _counterSniperActive = false;
    _counterSniperTimer  = 0;
    _contactBreakPos     = null;
    _hvtKilled           = 0;
    _observerCallout     = '';
    _observerCalloutTimer = 0;
    _rightMouseDown      = false;
    _shiftDown           = false;
    _scoped              = false;
    _spotterMode         = false;
    _swayX = 0;
    _swayY = 0;
    _chordTracker = {};

    /* Reset enemy states */
    var i;
    for (i = 0; i < _enemySnipers.length; i++) {
      _enemySnipers[i].alive     = true;
      _enemySnipers[i].focused   = false;
      _enemySnipers[i].fireTimer = ENEMY_FIRE_MIN + Math.random() * (ENEMY_FIRE_MAX - ENEMY_FIRE_MIN);
      _enemySnipers[i].flashLight.intensity = 0;
    }

    for (i = 0; i < _hvts.length; i++) {
      _hvts[i].alive         = true;
      _hvts[i].exposed       = false;
      _hvts[i].exposeTimer   = 0;
      _hvts[i].relocateTimer = HVT_RELOCATE_TIME * (0.5 + Math.random());
      _hvts[i].mesh.visible  = false;
    }

    /* Remove spotter marks */
    for (i = 0; i < _spotterMarks.length; i++) {
      _sceneRoot.remove(_spotterMarks[i].light);
    }
    _spotterMarks = [];

    if (_sceneRoot) { _sceneRoot.visible = false; }
    if (_hudEl)     { _hudEl.style.display = 'none'; }
    if (_scopeEl)   { _scopeEl.style.display = 'none'; }

    _rerollWind();
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════════════════════════════════════ */

  function _init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas || document.querySelector('canvas');

    _buildScene();
    _createHUD();
    _createScopeOverlay();

    /* Initially hidden */
    _sceneRoot.visible = false;
    _hudEl.style.display = 'none';

    /* Initial wind */
    _rerollWind();

    /* Register input listeners */
    window.addEventListener('keydown',     _onKeyDown);
    window.addEventListener('keyup',       _onKeyUp);
    window.addEventListener('mousedown',   _onMouseDown);
    window.addEventListener('mouseup',     _onMouseUp);
    window.addEventListener('contextmenu', _onContextMenu);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     UPDATE (call every frame with delta time in seconds)
  ═══════════════════════════════════════════════════════════════════════════ */

  function _update(dt) {
    if (!_active) { return; }

    /* Bolt cooldown */
    if (_boltCooldown > 0) {
      _boltCooldown -= dt;
      if (_boltCooldown < 0) { _boltCooldown = 0; }
    }

    /* Counter-sniper timer */
    if (_counterSniperActive) {
      _counterSniperTimer -= dt;
      _checkContactBreak();
      if (_counterSniperTimer <= 0) {
        _breakCounterContact();
      }
    }

    /* Enemy snipers */
    _updateEnemySnipers(dt);

    /* HVT targets */
    _updateHVTs(dt);

    /* Sway & breath */
    _updateSway(dt);

    /* Wind */
    _updateWind(dt);

    /* Spotter marks */
    _updateSpotterMarks(dt);

    /* Muzzle flashes */
    _updateMuzzleFlashes(dt);

    /* Observer callout timer */
    if (_observerCalloutTimer > 0) {
      _observerCalloutTimer -= dt;
      if (_observerCalloutTimer < 0) { _observerCalloutTimer = 0; }
    }

    /* HUD */
    _updateHUD();
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ═══════════════════════════════════════════════════════════════════════════ */

  return {
    init:   _init,
    update: _update,
    reset:  _reset
  };

}());
