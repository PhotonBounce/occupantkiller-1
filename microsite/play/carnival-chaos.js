window.CarnivalChaos = (function() {
  'use strict';

  // ─── Module-level state ───────────────────────────────────────────────────
  var _scene, _camera, _active = false;
  var _group;
  var _hud, _hudVictims, _hudRingmaster, _hudNotify;

  // Keybind: C+C double-press within 400ms
  var _lastCPress = 0;
  var _keydownHandler, _keyupHandler, _mousemoveHandler, _clickHandler, _pointerlockHandler;
  var _keys = {};

  // Player
  var _playerPos = { x: 0, y: 1.7, z: 40 };
  var _playerVelY = 0;
  var _onGround = true;
  var _hp = 100;
  var _yaw = 0, _pitch = 0;
  var _gameOver = false, _gameWon = false;

  // Rotating objects
  var _ferrisWheel = null;       // the wheel ring group rotates
  var _carouselPlatform = null;  // cylinder platform group rotates

  // Enemies: trafficker guards + ringmaster boss
  var _guards = [];      // {group, pos, hp, maxHp, state, patrol, patrolIdx, shootTimer, type}
  var _ringmaster = null;// {group, pos, hp, maxHp, state, shootTimer, phase}
  var _ringmasterDefeated = false;

  // Victims to rescue
  var _victims = [];     // {mesh, pos, rescued}
  var VICTIMS_TOTAL = 6;
  var _victimsRescued = 0;

  // Bullets
  var _bullets = [];     // {mesh, vel, life, fromPlayer}
  var _shootCooldown = 0;

  // Notify timer
  var _notifyTimer = 0;

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function _box(w, h, d, color, emissive, ox, oy, oz) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({
      color: color,
      emissive: emissive !== undefined ? emissive : 0x000000
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(ox || 0, oy !== undefined ? oy : 0, oz || 0);
    return mesh;
  }

  function _cyl(rt, rb, h, segs, color, emissive, ox, oy, oz) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var mat = new THREE.MeshLambertMaterial({
      color: color,
      emissive: emissive !== undefined ? emissive : 0x000000
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(ox || 0, oy !== undefined ? oy : 0, oz || 0);
    return mesh;
  }

  function _sphere(r, segs, color, emissive, ox, oy, oz) {
    var geo = new THREE.SphereGeometry(r, segs || 8, segs || 6);
    var mat = new THREE.MeshLambertMaterial({
      color: color,
      emissive: emissive !== undefined ? emissive : 0x000000
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(ox || 0, oy !== undefined ? oy : 0, oz || 0);
    return mesh;
  }

  function _cone(r, h, segs, color, emissive, ox, oy, oz) {
    var geo = new THREE.ConeGeometry(r, h, segs || 8);
    var mat = new THREE.MeshLambertMaterial({
      color: color,
      emissive: emissive !== undefined ? emissive : 0x000000
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(ox || 0, oy !== undefined ? oy : 0, oz || 0);
    return mesh;
  }

  function _dist2(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // ─── Environment builder ──────────────────────────────────────────────────

  function _buildEnvironment() {
    // Lighting – night carnival feel: dim ambient + colored point lights
    var ambient = new THREE.AmbientLight(0x111122);
    _group.add(ambient);

    var dir = new THREE.DirectionalLight(0x334466, 0.5);
    dir.position.set(10, 30, 10);
    _group.add(dir);

    // Carnival colored spotlights (represented as bright emissive spheres)
    var lightColors = [0xff2200, 0x00ccff, 0xffdd00, 0x00ff88, 0xff00cc];
    var lx = [-20, -10, 0, 10, 20];
    for (var li = 0; li < 5; li++) {
      var ls = _sphere(0.4, 8, lightColors[li], lightColors[li], lx[li], 8, -5);
      _group.add(ls);
      var pl = new THREE.PointLight(lightColors[li], 1.2, 25);
      pl.position.set(lx[li], 8, -5);
      _group.add(pl);
    }

    // Ground – dark carnival lot
    var ground = _box(120, 0.3, 120, 0x222211, 0x000000, 0, -0.15, 0);
    _group.add(ground);

    // Perimeter fence (dark boxes)
    var fenceColor = 0x553300;
    _group.add(_box(120, 2, 0.4, fenceColor, 0, 0, 1, -60));
    _group.add(_box(120, 2, 0.4, fenceColor, 0, 0, 1,  60));
    _group.add(_box(0.4, 2, 120, fenceColor, 0, -60, 1, 0));
    _group.add(_box(0.4, 2, 120, fenceColor, 0,  60, 1, 0));

    // Entrance arch (two posts + horizontal bar)
    _group.add(_box(1, 6, 1, 0xff3300, 0xff1100, -8, 3, 55));
    _group.add(_box(1, 6, 1, 0xff3300, 0xff1100,  8, 3, 55));
    _group.add(_box(18, 1, 1, 0xffdd00, 0xffaa00,  0, 7, 55));

    // Colored string-light ropes (flat boxes as light strips)
    for (var ri = 0; ri < 10; ri++) {
      var rc = [0xff2200, 0x00ccff, 0xffdd00, 0x00ff88, 0xff00cc][ri % 5];
      _group.add(_box(0.15, 0.15, 40, rc, rc, -18 + ri * 4, 6.5, 10));
    }
  }

  // ─── Ferris Wheel ─────────────────────────────────────────────────────────

  function _buildFerrisWheel() {
    // Centered at x=-25, z=-20, y=0
    var cx = -25, cz = -20;

    // Support legs (two A-frame legs)
    var legL = _box(0.6, 14, 0.6, 0x555555, 0, cx - 3, 7, cz);
    var legR = _box(0.6, 14, 0.6, 0x555555, 0, cx + 3, 7, cz);
    _group.add(legL);
    _group.add(legR);

    // Axle cylinder
    var axle = _cyl(0.3, 0.3, 3, 8, 0x888888, 0, cx, 14, cz);
    axle.rotation.z = Math.PI / 2;
    _group.add(axle);

    // Wheel group (will rotate)
    var wheelGroup = new THREE.Group();
    wheelGroup.position.set(cx, 14, cz);
    _group.add(wheelGroup);
    _ferrisWheel = wheelGroup;

    // Outer ring – made of 16 boxes arranged in a circle
    var RING_R = 7;
    var RING_SEGS = 16;
    for (var i = 0; i < RING_SEGS; i++) {
      var a0 = (i / RING_SEGS) * Math.PI * 2;
      var a1 = ((i + 1) / RING_SEGS) * Math.PI * 2;
      var midA = (a0 + a1) / 2;
      var bx = Math.cos(midA) * RING_R;
      var by = Math.sin(midA) * RING_R;
      var segLen = 2 * RING_R * Math.sin(Math.PI / RING_SEGS) + 0.05;
      var seg = _box(segLen, 0.3, 0.3, 0xffdd00, 0xaa8800, bx, by, 0);
      seg.rotation.z = midA + Math.PI / 2;
      wheelGroup.add(seg);
    }

    // Spokes (8 spokes, each a thin box)
    for (var s = 0; s < 8; s++) {
      var sa = (s / 8) * Math.PI * 2;
      var spoke = _box(RING_R * 2 - 0.6, 0.2, 0.2, 0xaaaaaa, 0, 0, 0, 0);
      spoke.rotation.z = sa;
      wheelGroup.add(spoke);
    }

    // Gondola cars (little boxes at rim)
    var gondolaColors = [0xff2200, 0x00ccff, 0xffdd00, 0x00ff88, 0xff00cc, 0xff8800, 0x00aaff, 0xaa00ff];
    for (var g = 0; g < 8; g++) {
      var ga = (g / 8) * Math.PI * 2;
      var gx = Math.cos(ga) * RING_R;
      var gy = Math.sin(ga) * RING_R;
      var gondola = _box(0.9, 0.7, 0.5, gondolaColors[g], gondolaColors[g] >> 1, gx, gy, 0);
      wheelGroup.add(gondola);
    }
  }

  // ─── Tent Structures ──────────────────────────────────────────────────────

  function _buildTent(tx, tz, colorWall, colorTop) {
    // Box walls
    var wallN = _box(8, 4, 0.3, colorWall, 0, tx,     2, tz - 4);
    var wallS = _box(8, 4, 0.3, colorWall, 0, tx,     2, tz + 4);
    var wallW = _box(0.3, 4, 8, colorWall, 0, tx - 4, 2, tz);
    var wallE = _box(0.3, 4, 8, colorWall, 0, tx + 4, 2, tz);
    _group.add(wallN); _group.add(wallS);
    _group.add(wallW); _group.add(wallE);

    // Cone top
    var cone = _cone(5.8, 5, 8, colorTop, colorTop >> 1, tx, 6.5, tz);
    _group.add(cone);

    // Center pole (cylinder)
    var pole = _cyl(0.15, 0.15, 9, 6, 0x886644, 0, tx, 4.5, tz);
    _group.add(pole);

    // Pennant flags (tiny colored cones at top)
    var flagColors = [0xff2200, 0xffdd00, 0x00ccff];
    for (var f = 0; f < 3; f++) {
      var fa = (f / 3) * Math.PI * 2;
      var fc = _cone(0.2, 0.5, 4, flagColors[f], flagColors[f], tx + Math.cos(fa) * 0.5, 9.3, tz + Math.sin(fa) * 0.5);
      _group.add(fc);
    }

    // Entrance gap hint: small emissive box over doorway
    var sign = _box(2, 0.3, 0.1, 0xffdd00, 0xffaa00, tx, 3.5, tz + 4.1);
    _group.add(sign);
  }

  // ─── Carousel ─────────────────────────────────────────────────────────────

  function _buildCarousel() {
    var cx = 20, cz = -25;

    // Center pole
    var pole = _cyl(0.25, 0.25, 8, 8, 0xcc2200, 0xff1100, cx, 4, cz);
    _group.add(pole);

    // Rotating group
    var carGroup = new THREE.Group();
    carGroup.position.set(cx, 1, cz);
    _group.add(carGroup);
    _carouselPlatform = carGroup;

    // Platform disc
    var plat = _cyl(5, 5, 0.35, 16, 0xdd8800, 0x884400, 0, 0, 0);
    carGroup.add(plat);

    // Outer ring edge
    var rim = _cyl(5.1, 5.1, 0.5, 16, 0xff2200, 0xaa0000, 0, 0.1, 0);
    carGroup.add(rim);

    // Carousel horses (cylinders as stylized horses)
    var horseColors = [0xffffff, 0xffaaaa, 0xaaffaa, 0xaaaaff, 0xffff88, 0xff88ff];
    for (var h = 0; h < 6; h++) {
      var ha = (h / 6) * Math.PI * 2;
      var hx = Math.cos(ha) * 3.5;
      var hz = Math.sin(ha) * 3.5;
      // Pole
      var hpole = _cyl(0.05, 0.05, 4, 6, 0xdddddd, 0, hx, 2, hz);
      carGroup.add(hpole);
      // Horse body
      var hbody = _box(0.6, 0.8, 1.2, horseColors[h], 0, hx, 1, hz);
      carGroup.add(hbody);
      // Horse head
      var hhead = _box(0.35, 0.45, 0.45, horseColors[h], 0, hx, 1.55, hz - 0.5);
      carGroup.add(hhead);
    }

    // Canopy (cone on top)
    var canopy = _cone(6, 3, 12, 0xff2200, 0xff0000, 0, 8.5, 0);
    carGroup.add(canopy);

    // Canopy segments (alternating colored)
    for (var cs = 0; cs < 6; cs++) {
      var csa = (cs / 6) * Math.PI * 2;
      var cc = _box(0.3, 3, 5.5, cs % 2 === 0 ? 0xffdd00 : 0xffffff, 0, 0, 7.5, 0);
      cc.rotation.y = csa;
      carGroup.add(cc);
    }
  }

  // ─── Game Booth Stalls ────────────────────────────────────────────────────

  function _buildBooth(bx, bz, colorFront, colorBack) {
    // Back wall
    _group.add(_box(5, 3.5, 0.3, colorBack, 0, bx, 1.75, bz - 2));
    // Side walls
    _group.add(_box(0.3, 3.5, 4, colorBack, 0, bx - 2.5, 1.75, bz));
    _group.add(_box(0.3, 3.5, 4, colorBack, 0, bx + 2.5, 1.75, bz));
    // Counter
    _group.add(_box(5, 0.2, 0.8, colorFront, 0, bx, 1.15, bz + 1.5));
    // Awning
    _group.add(_box(5.5, 0.15, 2, colorFront, colorFront >> 1, bx, 3.6, bz + 1));
    // Striped decoration (alternating boxes on awning)
    for (var st = 0; st < 5; st++) {
      var sc = st % 2 === 0 ? 0xffffff : 0xff2200;
      _group.add(_box(0.9, 0.16, 2, sc, 0, bx - 2 + st, 3.7, bz + 1));
    }
    // Prizes (spheres on back wall shelf)
    var prizeColors = [0xff2200, 0x00ccff, 0xffdd00];
    for (var pr = 0; pr < 3; pr++) {
      _group.add(_sphere(0.3, 6, prizeColors[pr], prizeColors[pr], bx - 1 + pr, 2.5, bz - 1.8));
    }
  }

  // ─── Clown Car ────────────────────────────────────────────────────────────

  function _buildClownCar(cx, cz) {
    // Main body – bright color
    _group.add(_box(3.5, 1.4, 2, 0xff6600, 0x882200, cx, 0.7, cz));
    // Roof
    _group.add(_box(2.5, 0.6, 1.8, 0xffdd00, 0x886600, cx - 0.2, 1.7, cz));
    // Hood
    _group.add(_box(1.5, 0.8, 2, 0xff6600, 0x882200, cx + 2.5, 0.5, cz));
    // Wheels (cylinders, rotated)
    var wheelPos = [[-1.3, 0], [1.3, 0], [-1.3, 0], [1.3, 0]];
    var wheelZ = [-0.9, -0.9, 0.9, 0.9];
    for (var w = 0; w < 4; w++) {
      var whl = _cyl(0.45, 0.45, 0.25, 10, 0x111111, 0, cx + wheelPos[w][0], 0.45, cz + wheelZ[w]);
      whl.rotation.x = Math.PI / 2;
      _group.add(whl);
      // Hub cap
      _group.add(_cyl(0.15, 0.15, 0.27, 6, 0xdddddd, 0, cx + wheelPos[w][0], 0.45, cz + wheelZ[w]));
    }
    // Bumper (box)
    _group.add(_box(2.2, 0.3, 0.2, 0x888888, 0, cx + 3.3, 0.35, cz));
    // Flower on hood (sphere + box stem)
    _group.add(_box(0.08, 0.5, 0.08, 0x228822, 0, cx + 2.5, 0.75, cz));
    _group.add(_sphere(0.22, 6, 0xff00cc, 0xff00aa, cx + 2.5, 1.05, cz));
    // Polka dots on body
    for (var d = 0; d < 4; d++) {
      _group.add(_sphere(0.15, 5, 0x00ccff, 0x006688, cx - 1.2 + d * 0.8, 1.0, cz + 1.01));
    }
  }

  // ─── Circus Cage Wagon ────────────────────────────────────────────────────

  function _buildCageWagon(wx, wz) {
    // Wagon base (box)
    _group.add(_box(5, 0.4, 3, 0x884400, 0, wx, 0.5, wz));
    // Wheels
    for (var wi = 0; wi < 4; wi++) {
      var wlx = wi < 2 ? wx - 1.8 : wx + 1.8;
      var wlz = wi % 2 === 0 ? wz - 1.2 : wz + 1.2;
      var wm = _cyl(0.4, 0.4, 0.2, 8, 0x332200, 0, wlx, 0.3, wlz);
      wm.rotation.x = Math.PI / 2;
      _group.add(wm);
    }
    // Cage body (box floor/ceiling/ends – solid)
    _group.add(_box(5, 0.15, 3, 0x664422, 0, wx, 0.75, wz));       // floor
    _group.add(_box(5, 0.15, 3, 0x664422, 0, wx, 3.25, wz));       // ceiling
    _group.add(_box(0.15, 2.5, 3, 0x886644, 0, wx - 2.5, 2, wz)); // end wall L
    _group.add(_box(0.15, 2.5, 3, 0x886644, 0, wx + 2.5, 2, wz)); // end wall R

    // Bars – LineSegments
    var barPositions = [-1.8, -1.0, -0.2, 0.6, 1.4];
    var barGeoPositions = [];
    for (var b = 0; b < barPositions.length; b++) {
      var bxPos = wx + barPositions[b];
      // Front bars (z = wz + 1.5)
      barGeoPositions.push(bxPos, 0.75, wz + 1.5);
      barGeoPositions.push(bxPos, 3.25, wz + 1.5);
      // Back bars (z = wz - 1.5)
      barGeoPositions.push(bxPos, 0.75, wz - 1.5);
      barGeoPositions.push(bxPos, 3.25, wz - 1.5);
    }
    // Horizontal cross-bars
    var hbarZ = [wz - 1.5, wz + 1.5];
    for (var hb = 0; hb < hbarZ.length; hb++) {
      barGeoPositions.push(wx - 2.5, 1.5,  hbarZ[hb]);
      barGeoPositions.push(wx + 2.5, 1.5,  hbarZ[hb]);
      barGeoPositions.push(wx - 2.5, 2.5,  hbarZ[hb]);
      barGeoPositions.push(wx + 2.5, 2.5,  hbarZ[hb]);
    }

    var barGeo = new THREE.BufferGeometry();
    barGeo.setAttribute('position', new THREE.Float32BufferAttribute(barGeoPositions, 3));
    var barMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
    var bars = new THREE.LineSegments(barGeo, barMat);
    _group.add(bars);
  }

  // ─── Victims ──────────────────────────────────────────────────────────────

  function _buildVictims() {
    var positions = [
      { x: -25, z:  10 },
      { x:  25, z: -10 },
      { x:   5, z: -35 },
      { x: -15, z: -40 },
      { x:  30, z:  20 },
      { x: -30, z:  25 }
    ];

    for (var vi = 0; vi < VICTIMS_TOTAL; vi++) {
      var vp = positions[vi];
      var vGroup = new THREE.Group();
      vGroup.position.set(vp.x, 0, vp.z);
      // Body
      var vBody = _box(0.5, 1, 0.35, 0x885533, 0, 0, 0.7, 0);
      vGroup.add(vBody);
      // Head
      var vHead = _sphere(0.22, 6, 0xffcc99, 0, 0, 1.4, 0);
      vGroup.add(vHead);
      // Glowing rescue marker (emissive sphere above)
      var marker = _sphere(0.18, 6, 0x00ff88, 0x00ff88, 0, 2.0, 0);
      vGroup.add(marker);

      _group.add(vGroup);
      _victims.push({
        group: vGroup,
        pos: { x: vp.x, y: 0, z: vp.z },
        rescued: false
      });
    }
  }

  // ─── Trafficker Guards ────────────────────────────────────────────────────

  function _buildGuards() {
    // Civilian-clothes guards: varied color box bodies
    var guardDefs = [
      { x: -20, z:  5,  bodyColor: 0x2244aa, hatColor: 0x111133, patrol: [{ x: -20, z: 5 }, { x: -20, z: 20 }] },
      { x:  20, z:  5,  bodyColor: 0x226633, hatColor: 0x113322, patrol: [{ x: 20, z: 5 }, { x: 10, z: 5 }] },
      { x:   0, z: -20, bodyColor: 0x884422, hatColor: 0x442211, patrol: [{ x: 0, z: -20 }, { x: 15, z: -20 }] },
      { x: -10, z: -30, bodyColor: 0x554477, hatColor: 0x221133, patrol: [{ x: -10, z: -30 }, { x: -10, z: -15 }] },
      { x:  15, z:  25, bodyColor: 0x335566, hatColor: 0x112233, patrol: [{ x: 15, z: 25 }, { x: 25, z: 25 }] }
    ];

    for (var gi = 0; gi < guardDefs.length; gi++) {
      var gd = guardDefs[gi];
      var gGroup = new THREE.Group();
      gGroup.position.set(gd.x, 0, gd.z);

      // Body (civilian jacket color)
      var gBody = _box(0.6, 1.2, 0.4, gd.bodyColor, 0, 0, 0.8, 0);
      gGroup.add(gBody);
      // Legs
      var gLegL = _box(0.22, 0.8, 0.3, 0x222222, 0, -0.15, 0.3, 0);
      var gLegR = _box(0.22, 0.8, 0.3, 0x222222, 0,  0.15, 0.3, 0);
      gGroup.add(gLegL); gGroup.add(gLegR);
      // Head
      var gHead = _sphere(0.2, 6, 0xffcc88, 0, 0, 1.6, 0);
      gGroup.add(gHead);
      // Baseball cap (box visor + cylinder crown)
      var gCap = _cyl(0.18, 0.18, 0.18, 6, gd.hatColor, 0, 0, 1.87, 0);
      var gVisor = _box(0.38, 0.06, 0.2, gd.hatColor, 0, 0, 1.79, -0.22);
      gGroup.add(gCap); gGroup.add(gVisor);
      // Gun (small box)
      var gGun = _box(0.08, 0.08, 0.55, 0x333333, 0, 0.38, 0.85, -0.2);
      gGroup.add(gGun);

      _group.add(gGroup);
      _guards.push({
        group: gGroup,
        pos: { x: gd.x, y: 0, z: gd.z },
        hp: 60, maxHp: 60,
        state: 'patrol',
        patrol: gd.patrol,
        patrolIdx: 0,
        shootTimer: 0,
        type: 'guard'
      });
    }
  }

  // ─── Ringmaster Boss ──────────────────────────────────────────────────────

  function _buildRingmaster() {
    var rGroup = new THREE.Group();
    rGroup.position.set(0, 0, -50);

    // Body – red tailcoat
    var rBody = _box(0.75, 1.4, 0.45, 0xcc0000, 0x440000, 0, 0.9, 0);
    rGroup.add(rBody);
    // Legs
    var rLegL = _box(0.28, 1.0, 0.32, 0x111111, 0, -0.18, 0.38, 0);
    var rLegR = _box(0.28, 1.0, 0.32, 0x111111, 0,  0.18, 0.38, 0);
    rGroup.add(rLegL); rGroup.add(rLegR);
    // Head
    var rHead = _sphere(0.26, 7, 0xffddbb, 0, 0, 1.9, 0);
    rGroup.add(rHead);
    // Top hat brim (cylinder – wide flat)
    var rBrim = _cyl(0.42, 0.42, 0.07, 10, 0x111111, 0, 0, 2.27, 0);
    rGroup.add(rBrim);
    // Top hat crown (tall cylinder)
    var rCrown = _cyl(0.27, 0.27, 0.55, 10, 0x111111, 0, 0, 2.57, 0);
    rGroup.add(rCrown);
    // Hat band (thin emissive box strip)
    var rBand = _box(0.58, 0.07, 0.58, 0xff0000, 0xff0000, 0, 2.32, 0);
    rGroup.add(rBand);
    // Monocle (small sphere)
    var rMono = _sphere(0.07, 5, 0xaaddff, 0x4488ff, 0.13, 1.95, -0.24);
    rGroup.add(rMono);
    // Cane (thin cylinder)
    var rCane = _cyl(0.04, 0.04, 1.5, 5, 0xdddddd, 0x888888, 0.5, 0.75, -0.15);
    rGroup.add(rCane);
    // Gold buttons on coat
    for (var btn = 0; btn < 3; btn++) {
      var rb = _sphere(0.05, 4, 0xffdd00, 0xffaa00, 0, 0.6 + btn * 0.35, -0.2);
      rGroup.add(rb);
    }

    _group.add(rGroup);
    _ringmaster = {
      group: rGroup,
      pos: { x: 0, y: 0, z: -50 },
      hp: 300, maxHp: 300,
      state: 'idle',
      shootTimer: 0,
      phase: 1
    };
  }

  // ─── Scene setup ──────────────────────────────────────────────────────────

  function _buildScene() {
    _buildEnvironment();

    // Ferris wheel
    _buildFerrisWheel();

    // Big top tent (main show tent)
    _buildTent(-25, -40, 0xcc2200, 0xffdd00);

    // Secondary tent (smaller, blue)
    _buildTent(25, -40, 0x0044cc, 0xff00cc);

    // Side tent (green)
    _buildTent(-40, 10, 0x006633, 0xffdd00);

    // Carousel
    _buildCarousel();

    // Game booths
    _buildBooth(-10, 30, 0xff2200, 0x883300);
    _buildBooth(  0, 30, 0x00aacc, 0x004466);
    _buildBooth( 10, 30, 0xffdd00, 0x886600);
    _buildBooth( 35, -10, 0x00aa44, 0x003322);
    _buildBooth( 35,   5, 0xcc00cc, 0x440044);

    // Clown car (parked near entrance)
    _buildClownCar(15, 45);

    // Circus cage wagon (near big top – holding victims)
    _buildCageWagon(-15, -20);
    _buildCageWagon( 10, -25);

    // Victims to rescue
    _buildVictims();

    // Guards
    _buildGuards();

    // Ringmaster boss at back
    _buildRingmaster();

    // Popcorn stand (box kiosk)
    _group.add(_box(2, 2, 1.5, 0xffdd88, 0x886600,  5, 1, 40));
    _group.add(_box(2, 0.1, 1.5, 0xff4400, 0x882200, 5, 2.1, 40));
    _group.add(_sphere(0.4, 6, 0xffff88, 0xaaaa00, 5, 2.7, 40));

    // Balloons (spheres on poles)
    var balloonColors = [0xff2200, 0x00ccff, 0xffdd00, 0x00ff88, 0xff00cc, 0xff8800];
    var bPositions = [
      [-5, 38], [8, 38], [-30, 30], [30, 30], [-20, 45], [20, 45]
    ];
    for (var bl = 0; bl < bPositions.length; bl++) {
      _group.add(_cyl(0.02, 0.02, 2.5, 4, 0xbbbbbb, 0, bPositions[bl][0], 1.25, bPositions[bl][1]));
      _group.add(_sphere(0.35, 7, balloonColors[bl], balloonColors[bl], bPositions[bl][0], 2.9, bPositions[bl][1]));
    }
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────

  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'carnival-chaos-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:18px',
      'left:18px',
      'color:#fff',
      'font-family:"Courier New",monospace',
      'font-size:15px',
      'font-weight:bold',
      'pointer-events:none',
      'z-index:9999',
      'text-shadow:2px 2px 4px #000, 0 0 8px #ff2200',
      'background:rgba(0,0,0,0.55)',
      'padding:10px 16px',
      'border-radius:6px',
      'border:2px solid #ff2200',
      'line-height:1.6'
    ].join(';');

    _hudVictims = document.createElement('div');
    _hudVictims.innerHTML = 'VICTIMS RESCUED: 0/' + VICTIMS_TOTAL;
    _hudVictims.style.color = '#00ff88';

    _hudRingmaster = document.createElement('div');
    _hudRingmaster.innerHTML = 'RINGMASTER: AT LARGE';
    _hudRingmaster.style.color = '#ff4400';

    var _hudHp = document.createElement('div');
    _hudHp.id = 'cc-hp';
    _hudHp.innerHTML = 'HP: 100';
    _hudHp.style.color = '#ffdd00';

    var _hudTitle = document.createElement('div');
    _hudTitle.innerHTML = '&#127914; CARNIVAL CHAOS';
    _hudTitle.style.cssText = 'color:#ff2200;font-size:17px;margin-bottom:4px;letter-spacing:1px;';

    var _hudInstr = document.createElement('div');
    _hudInstr.innerHTML = 'WASD+Mouse | SPACE=jump | Click=shoot | CC=toggle';
    _hudInstr.style.cssText = 'color:#aaaaaa;font-size:11px;margin-top:4px;';

    _hud.appendChild(_hudTitle);
    _hud.appendChild(_hudVictims);
    _hud.appendChild(_hudRingmaster);
    _hud.appendChild(_hudHp);
    _hud.appendChild(_hudInstr);

    // Notification banner
    _hudNotify = document.createElement('div');
    _hudNotify.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#ffdd00',
      'font-family:"Courier New",monospace',
      'font-size:28px',
      'font-weight:bold',
      'pointer-events:none',
      'z-index:10000',
      'text-shadow:3px 3px 8px #000, 0 0 20px #ff2200',
      'background:rgba(0,0,0,0.7)',
      'padding:14px 28px',
      'border-radius:8px',
      'border:3px solid #ff2200',
      'display:none',
      'text-align:center'
    ].join(';');
    _hudNotify.innerHTML = '';

    document.body.appendChild(_hud);
    document.body.appendChild(_hudNotify);
  }

  function _updateHUD() {
    if (!_hud) return;
    var hpEl = document.getElementById('cc-hp');
    if (hpEl) {
      hpEl.innerHTML = 'HP: ' + Math.max(0, Math.floor(_hp));
      hpEl.style.color = _hp < 30 ? '#ff2200' : '#ffdd00';
    }
    if (_hudVictims) {
      _hudVictims.innerHTML = 'VICTIMS RESCUED: ' + _victimsRescued + '/' + VICTIMS_TOTAL;
    }
    if (_hudRingmaster) {
      if (_ringmasterDefeated) {
        _hudRingmaster.innerHTML = 'RINGMASTER: NEUTRALIZED';
        _hudRingmaster.style.color = '#00ff88';
      } else {
        var rmHpPct = _ringmaster ? Math.floor((_ringmaster.hp / _ringmaster.maxHp) * 100) : 100;
        if (_ringmaster && _ringmaster.state !== 'idle') {
          _hudRingmaster.innerHTML = 'RINGMASTER: ENGAGED [' + rmHpPct + '%]';
          _hudRingmaster.style.color = '#ff8800';
        } else {
          _hudRingmaster.innerHTML = 'RINGMASTER: AT LARGE';
          _hudRingmaster.style.color = '#ff4400';
        }
      }
    }
  }

  function _showNotify(msg, duration) {
    if (!_hudNotify) return;
    _hudNotify.innerHTML = msg;
    _hudNotify.style.display = 'block';
    _notifyTimer = duration || 2.5;
  }

  // ─── Input handling ───────────────────────────────────────────────────────

  function _setupInput() {
    _keydownHandler = function(e) {
      _keys[e.code] = true;

      // Jump
      if ((e.code === 'Space') && _onGround) {
        _playerVelY = 7;
        _onGround = false;
        e.preventDefault();
      }

      // CC double-tap toggle
      if (e.code === 'KeyC') {
        var now = performance.now();
        if (now - _lastCPress < 400) {
          _toggleModule();
        }
        _lastCPress = now;
        e.preventDefault();
      }
    };

    _keyupHandler = function(e) {
      _keys[e.code] = false;
    };

    _mousemoveHandler = function(e) {
      if (!_active) return;
      if (document.pointerLockElement) {
        _yaw   -= e.movementX * 0.002;
        _pitch -= e.movementY * 0.002;
        _pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, _pitch));
      }
    };

    _clickHandler = function(e) {
      if (!_active || _gameOver || _gameWon) return;
      if (!document.pointerLockElement) {
        document.body.requestPointerLock();
        return;
      }
      _shoot();
    };

    _pointerlockHandler = function() {};

    document.addEventListener('keydown', _keydownHandler);
    document.addEventListener('keyup', _keyupHandler);
    document.addEventListener('mousemove', _mousemoveHandler);
    document.addEventListener('click', _clickHandler);
    document.addEventListener('pointerlockchange', _pointerlockHandler);
  }

  function _removeInput() {
    document.removeEventListener('keydown', _keydownHandler);
    document.removeEventListener('keyup', _keyupHandler);
    document.removeEventListener('mousemove', _mousemoveHandler);
    document.removeEventListener('click', _clickHandler);
    document.removeEventListener('pointerlockchange', _pointerlockHandler);
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  // ─── Shooting ─────────────────────────────────────────────────────────────

  function _shoot() {
    if (_shootCooldown > 0) return;
    _shootCooldown = 0.18;

    // Direction from camera
    var dir = new THREE.Vector3(0, 0, -1);
    var euler = new THREE.Euler(_pitch, _yaw, 0, 'YXZ');
    dir.applyEuler(euler);

    var bGeo = new THREE.SphereGeometry(0.08, 4, 3);
    var bMat = new THREE.MeshLambertMaterial({ color: 0xffff00, emissive: 0xffaa00 });
    var bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _group.add(bMesh);

    _bullets.push({
      mesh: bMesh,
      vel: { x: dir.x * 40, y: dir.y * 40, z: dir.z * 40 },
      life: 3.0,
      fromPlayer: true
    });
  }

  function _enemyShoot(enemy) {
    if (!_active) return;
    var dx = _playerPos.x - enemy.pos.x;
    var dy = _playerPos.y - enemy.pos.y;
    var dz = _playerPos.z - enemy.pos.z;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.01) return;
    dx /= len; dy /= len; dz /= len;

    var bGeo = new THREE.SphereGeometry(0.1, 4, 3);
    var bMat = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0x880000 });
    var bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set(enemy.pos.x, enemy.pos.y + 1.2, enemy.pos.z);
    _group.add(bMesh);

    _bullets.push({
      mesh: bMesh,
      vel: { x: dx * 22, y: dy * 22, z: dz * 22 },
      life: 4.0,
      fromPlayer: false
    });
  }

  // ─── Guard AI ─────────────────────────────────────────────────────────────

  function _updateGuards(delta) {
    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (g.hp <= 0) continue;

      var distToPlayer = _dist2(g.pos.x, g.pos.z, _playerPos.x, _playerPos.z);

      if (distToPlayer < 25) {
        g.state = 'chase';
      } else if (distToPlayer > 35) {
        g.state = 'patrol';
      }

      if (g.state === 'patrol') {
        var pt = g.patrol[g.patrolIdx];
        var dx = pt.x - g.pos.x;
        var dz = pt.z - g.pos.z;
        var d = Math.sqrt(dx * dx + dz * dz);
        if (d < 0.5) {
          g.patrolIdx = (g.patrolIdx + 1) % g.patrol.length;
        } else {
          g.pos.x += (dx / d) * 3 * delta;
          g.pos.z += (dz / d) * 3 * delta;
        }
      } else if (g.state === 'chase') {
        var cdx = _playerPos.x - g.pos.x;
        var cdz = _playerPos.z - g.pos.z;
        var cd = Math.sqrt(cdx * cdx + cdz * cdz);
        if (cd > 4) {
          g.pos.x += (cdx / cd) * 4 * delta;
          g.pos.z += (cdz / cd) * 4 * delta;
        }

        // Shoot at player
        g.shootTimer -= delta;
        if (g.shootTimer <= 0 && distToPlayer < 20) {
          _enemyShoot(g);
          g.shootTimer = 1.5 + Math.random() * 1.5;
        }
      }

      g.group.position.set(g.pos.x, 0, g.pos.z);
      // Face player when chasing
      if (g.state === 'chase') {
        g.group.rotation.y = Math.atan2(_playerPos.x - g.pos.x, _playerPos.z - g.pos.z);
      }
    }
  }

  // ─── Ringmaster AI ───────────────────────────────────────────────────────

  function _updateRingmaster(delta) {
    if (!_ringmaster || _ringmasterDefeated) return;

    var distToPlayer = _dist2(_ringmaster.pos.x, _ringmaster.pos.z, _playerPos.x, _playerPos.z);

    // Phase 2 when below 50%
    if (_ringmaster.hp < _ringmaster.maxHp * 0.5 && _ringmaster.phase === 1) {
      _ringmaster.phase = 2;
      _showNotify('RINGMASTER ENRAGED!', 2.0);
    }

    if (distToPlayer < 40) {
      _ringmaster.state = 'active';
    }

    if (_ringmaster.state === 'active') {
      // Circle-strafe around center
      var circleSpeed = _ringmaster.phase === 2 ? 1.2 : 0.7;
      var angle = Math.atan2(_ringmaster.pos.x, _ringmaster.pos.z) + circleSpeed * delta;
      var radius = 12;
      _ringmaster.pos.x = Math.sin(angle) * radius;
      _ringmaster.pos.z = -50 + Math.cos(angle) * radius;

      // Shoot at player
      _ringmaster.shootTimer -= delta;
      var shootRate = _ringmaster.phase === 2 ? 0.6 : 1.2;
      if (_ringmaster.shootTimer <= 0) {
        _enemyShoot(_ringmaster);
        if (_ringmaster.phase === 2) {
          // Phase 2: burst fire
          var rm = _ringmaster;
          _ringmaster.shootTimer = shootRate;
          (function(rmRef) {
            var burstCount = 0;
            var burstInterval = setInterval(function() {
              if (!_active || burstCount >= 2) { clearInterval(burstInterval); return; }
              _enemyShoot(rmRef);
              burstCount++;
            }, 200);
          }(_ringmaster));
        } else {
          _ringmaster.shootTimer = shootRate;
        }
      }

      _ringmaster.group.position.set(_ringmaster.pos.x, 0, _ringmaster.pos.z);
      _ringmaster.group.rotation.y = Math.atan2(
        _playerPos.x - _ringmaster.pos.x,
        _playerPos.z - _ringmaster.pos.z
      );
    }
  }

  // ─── Bullet update ───────────────────────────────────────────────────────

  function _updateBullets(delta) {
    for (var bi = _bullets.length - 1; bi >= 0; bi--) {
      var b = _bullets[bi];
      b.life -= delta;
      b.mesh.position.x += b.vel.x * delta;
      b.mesh.position.y += b.vel.y * delta;
      b.mesh.position.z += b.vel.z * delta;

      var hit = false;

      if (b.fromPlayer) {
        // Check guard hits
        for (var gi = 0; gi < _guards.length; gi++) {
          var g = _guards[gi];
          if (g.hp <= 0) continue;
          var gd = _dist3(
            { x: b.mesh.position.x, y: b.mesh.position.y, z: b.mesh.position.z },
            { x: g.pos.x, y: 1.2, z: g.pos.z }
          );
          if (gd < 1.0) {
            g.hp -= 25;
            if (g.hp <= 0) {
              g.group.visible = false;
              _showNotify('GUARD DOWN', 1.0);
            }
            hit = true;
            break;
          }
        }

        // Check ringmaster hit
        if (!hit && _ringmaster && !_ringmasterDefeated) {
          var rDist = _dist3(
            { x: b.mesh.position.x, y: b.mesh.position.y, z: b.mesh.position.z },
            { x: _ringmaster.pos.x, y: 1.5, z: _ringmaster.pos.z }
          );
          if (rDist < 1.5) {
            _ringmaster.hp -= 20;
            if (_ringmaster.hp <= 0) {
              _ringmasterDefeated = true;
              _ringmaster.group.visible = false;
              _showNotify('RINGMASTER NEUTRALIZED!\nCHECK FOR VICTIMS!', 3.0);
            }
            hit = true;
          }
        }
      } else {
        // Enemy bullet hits player
        var pd = _dist3(
          { x: b.mesh.position.x, y: b.mesh.position.y, z: b.mesh.position.z },
          { x: _playerPos.x, y: _playerPos.y, z: _playerPos.z }
        );
        if (pd < 0.7) {
          _hp -= 10;
          hit = true;
          if (_hp <= 0 && !_gameOver) {
            _gameOver = true;
            _showNotify('OPERATION FAILED\nYOU WERE ELIMINATED', 5.0);
          }
        }
      }

      if (hit || b.life <= 0 || b.mesh.position.y < -5) {
        _group.remove(b.mesh);
        _bullets.splice(bi, 1);
      }
    }
  }

  // ─── Victim rescue ───────────────────────────────────────────────────────

  function _updateVictims() {
    for (var vi = 0; vi < _victims.length; vi++) {
      var v = _victims[vi];
      if (v.rescued) continue;
      var vDist = _dist2(_playerPos.x, _playerPos.z, v.pos.x, v.pos.z);
      if (vDist < 2.2) {
        v.rescued = true;
        v.group.visible = false;
        _victimsRescued++;
        _showNotify('VICTIM RESCUED! ' + _victimsRescued + '/' + VICTIMS_TOTAL, 1.8);

        if (_victimsRescued >= VICTIMS_TOTAL && _ringmasterDefeated) {
          _gameWon = true;
          _showNotify('MISSION COMPLETE!\nALL VICTIMS RESCUED\nRINGMASTER STOPPED', 6.0);
        }
      }
    }
  }

  // ─── Player movement ──────────────────────────────────────────────────────

  function _updatePlayer(delta) {
    if (_gameOver) return;

    var speed = 8;
    var fwd = { x: -Math.sin(_yaw), z: -Math.cos(_yaw) };
    var right = { x: Math.cos(_yaw), z: -Math.sin(_yaw) };
    var moveX = 0, moveZ = 0;

    if (_keys['KeyW'] || _keys['ArrowUp'])    { moveX += fwd.x; moveZ += fwd.z; }
    if (_keys['KeyS'] || _keys['ArrowDown'])  { moveX -= fwd.x; moveZ -= fwd.z; }
    if (_keys['KeyA'] || _keys['ArrowLeft'])  { moveX -= right.x; moveZ -= right.z; }
    if (_keys['KeyD'] || _keys['ArrowRight']) { moveX += right.x; moveZ += right.z; }

    var len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0.01) {
      moveX = (moveX / len) * speed * delta;
      moveZ = (moveZ / len) * speed * delta;
    }

    _playerPos.x += moveX;
    _playerPos.z += moveZ;

    // Gravity
    _playerVelY -= 20 * delta;
    _playerPos.y += _playerVelY * delta;
    if (_playerPos.y <= 1.7) {
      _playerPos.y = 1.7;
      _playerVelY = 0;
      _onGround = true;
    }

    // Clamp to bounds
    _playerPos.x = Math.max(-58, Math.min(58, _playerPos.x));
    _playerPos.z = Math.max(-58, Math.min(58, _playerPos.z));
  }

  function _updateCamera() {
    if (!_camera) return;
    _camera.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;
  }

  // ─── Toggle ───────────────────────────────────────────────────────────────

  function _toggleModule() {
    if (_active) {
      _active = false;
      if (_group) _group.visible = false;
      if (_hud) _hud.style.display = 'none';
      if (_hudNotify) _hudNotify.style.display = 'none';
      _showNotify('CARNIVAL CHAOS: OFF', 1.5);
      setTimeout(function() {
        if (_hudNotify) _hudNotify.style.display = 'none';
      }, 1600);
    } else {
      _active = true;
      if (_group) _group.visible = true;
      if (_hud) _hud.style.display = 'block';
      _showNotify('CARNIVAL CHAOS: ON\nInfiltrate - Rescue - Eliminate', 3.0);
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  function init(scene, camera) {
    _scene = scene;
    _camera = camera;

    _group = new THREE.Group();
    _scene.add(_group);
    _group.visible = false;

    _buildScene();
    _buildHUD();
    _setupInput();

    // Start inactive; CC double-tap to enable
    _active = false;
    _hud.style.display = 'none';
  }

  function update(delta) {
    if (!_active || _gameOver) {
      // Still animate rotating parts even when paused for visual flair
      if (_active && _ferrisWheel) _ferrisWheel.rotation.z += 0.3 * delta;
      if (_active && _carouselPlatform) _carouselPlatform.rotation.y += 0.8 * delta;
      return;
    }

    if (!delta || delta > 0.2) delta = 0.016;

    // Animations
    if (_ferrisWheel) _ferrisWheel.rotation.z += 0.3 * delta;
    if (_carouselPlatform) _carouselPlatform.rotation.y += 0.8 * delta;

    // Shoot cooldown
    if (_shootCooldown > 0) _shootCooldown -= delta;

    // Player movement
    _updatePlayer(delta);
    _updateCamera();

    // AI
    _updateGuards(delta);
    _updateRingmaster(delta);

    // Bullets
    _updateBullets(delta);

    // Victim rescue
    _updateVictims();

    // Notify timer
    if (_notifyTimer > 0) {
      _notifyTimer -= delta;
      if (_notifyTimer <= 0 && _hudNotify) {
        _hudNotify.style.display = 'none';
      }
    }

    // HUD
    _updateHUD();
  }

  function reset() {
    // Remove all scene objects
    if (_group && _scene) {
      _scene.remove(_group);
    }
    _group = null;

    // Remove HUD elements
    if (_hud && _hud.parentNode) _hud.parentNode.removeChild(_hud);
    if (_hudNotify && _hudNotify.parentNode) _hudNotify.parentNode.removeChild(_hudNotify);
    _hud = null;
    _hudVictims = null;
    _hudRingmaster = null;
    _hudNotify = null;

    // Remove input
    _removeInput();

    // Release pointer lock
    if (document.pointerLockElement) document.exitPointerLock();

    // Reset state
    _active = false;
    _gameOver = false;
    _gameWon = false;
    _playerPos = { x: 0, y: 1.7, z: 40 };
    _playerVelY = 0;
    _onGround = true;
    _hp = 100;
    _yaw = 0;
    _pitch = 0;
    _victimsRescued = 0;
    _victims = [];
    _guards = [];
    _ringmaster = null;
    _ringmasterDefeated = false;
    _bullets = [];
    _shootCooldown = 0;
    _ferrisWheel = null;
    _carouselPlatform = null;
    _lastCPress = 0;
    _notifyTimer = 0;
    _keys = {};
  }

  return { init: init, update: update, reset: reset };

}());
