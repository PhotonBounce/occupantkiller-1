window.SiegeWarfare = (function () {
  'use strict';

  // ── Module state ──────────────────────────────────────────────────────────
  var _scene  = null;
  var _camera = null;
  var _time   = 0;

  // Siege command post
  var _commandPost = null;          // { mesh, position }
  var _siegeActive = false;

  // Phases: 0=PREPARE, 1=ISOLATE, 2=SUPPRESS, 3=ASSAULT, 4=CONSOLIDATE
  var PHASES = ['PREPARE', 'ISOLATE', 'SUPPRESS', 'ASSAULT', 'CONSOLIDATE'];
  var _phase = 0;
  var _phaseTimer = 0;
  var PHASE_DURATIONS = [8, 15, 20, 30, 10];  // seconds per phase

  // Strongpoints
  var _strongpoints = [];    // { mesh, hp, maxHp, defenders[], group, x, z, cleared }

  // Siege weapons
  var _batteringRam = null;  // { group, soldiers[], swingAngle, swingDir, hits, door }
  var _ladder = null;        // { group, climbers[], deployed }
  var _siegeTower = null;    // { group }

  // Isolation perimeter
  var _perimeterPosts = [];
  var _perimeterLines = null;
  var _alarmActive = false;
  var _alarmTimer = 0;

  // Supply wagon
  var _supplyWagon = null;   // { group, horse, timer, resupplyInterval }
  var _supplyTimer = 0;
  var SUPPLY_INTERVAL = 120; // 2 min

  // Morale
  var _enemyMorale = 100;
  var _surrendered = false;

  // Suppressing fire
  var _suppressTimer = 0;
  var SUPPRESS_INTERVAL = 2.5;
  var _tracers = [];   // { mesh, life }

  // Keys
  var _keysDown = {};

  // HUD
  var _hudEl = null;
  var _alarmEl = null;

  // ── Material helpers ──────────────────────────────────────────────────────
  var _matCache = {};
  function _mat(hex, rough, emissive) {
    var key = hex + '_' + (rough || 0) + '_' + (emissive || 0);
    if (!_matCache[key]) {
      _matCache[key] = new THREE.MeshLambertMaterial({ color: hex });
      if (emissive) {
        _matCache[key].emissive = new THREE.Color(emissive);
        _matCache[key].emissiveIntensity = 0.6;
      }
    }
    return _matCache[key];
  }

  function _box(w, h, d, hex) {
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), _mat(hex));
  }

  // ── Build siege command post (6×3×4 bunker) ───────────────────────────────
  function _buildCommandPost(px, py, pz) {
    var group = new THREE.Group();

    // Main bunker body
    var body = _box(6, 3, 4, 0x4A5230);
    body.position.set(0, 1.5, 0);
    group.add(body);

    // Roof slab (darker)
    var roof = _box(6.2, 0.25, 4.2, 0x3A4220);
    roof.position.set(0, 3.125, 0);
    group.add(roof);

    // Flag pole
    var pole = _box(0.1, 2.5, 0.1, 0x888888);
    pole.position.set(2.5, 4.25, -1.5);
    group.add(pole);

    // Flag
    var flag = _box(1.2, 0.7, 0.05, 0xDD2222);
    flag.position.set(3.1, 5.2, -1.5);
    group.add(flag);

    // Door opening (darker box)
    var door = _box(1.2, 2, 0.1, 0x222222);
    door.position.set(0, 1, 2.05);
    group.add(door);

    group.position.set(px, 0, pz);
    _scene.add(group);
    return { group: group, position: new THREE.Vector3(px, 0, pz) };
  }

  // ── Build fortified strongpoint (4×3×4 bunker, enemies inside) ───────────
  function _buildStrongpoint(x, z) {
    var group = new THREE.Group();

    // Main structure
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 4),
      new THREE.MeshLambertMaterial({ color: 0x5C5C3D })
    );
    body.position.set(0, 1.5, 0);
    group.add(body);

    // Roof
    var roof = new THREE.Mesh(
      new THREE.BoxGeometry(4.3, 0.3, 4.3),
      new THREE.MeshLambertMaterial({ color: 0x4A4A2D })
    );
    roof.position.set(0, 3.15, 0);
    group.add(roof);

    // Door (breakable)
    var doorMat = new THREE.MeshLambertMaterial({ color: 0x554433 });
    var door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.15), doorMat);
    door.position.set(0, 1.1, 2.08);
    group.add(door);

    // Sandbag detail
    var bag = _box(3.5, 0.5, 0.5, 0x8B7355);
    bag.position.set(0, 0.25, 2.3);
    group.add(bag);

    group.position.set(x, 0, z);
    _scene.add(group);

    // Spawn 2 defenders for this strongpoint
    var defenders = [];
    for (var d = 0; d < 2; d++) {
      var def = _buildDefenderNPC(x + (d === 0 ? -1 : 1), z + 1.5);
      defenders.push(def);
    }

    return {
      group: group,
      door: door,
      doorMat: doorMat,
      doorHits: 0,
      hp: 300,
      maxHp: 300,
      defenders: defenders,
      x: x,
      z: z,
      cleared: false
    };
  }

  // ── Build defender NPC (CylinderGeometry body) ────────────────────────────
  function _buildDefenderNPC(x, z) {
    var grp = new THREE.Group();

    var body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 1.6, 8),
      new THREE.MeshLambertMaterial({ color: 0x5C5C3D })
    );
    body.position.y = 0.8;
    grp.add(body);

    var head = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 6, 6),
      new THREE.MeshLambertMaterial({ color: 0xC08060 })
    );
    head.position.y = 1.8;
    grp.add(head);

    // Weapon stub
    var weapon = _box(0.08, 0.08, 0.9, 0x333333);
    weapon.position.set(0.35, 1.2, 0.3);
    grp.add(weapon);

    grp.position.set(x, 0, z);
    _scene.add(grp);

    return {
      group: grp,
      alive: true,
      surrendered: false,
      x: x,
      z: z,
      patrolAngle: Math.random() * Math.PI * 2
    };
  }

  // ── Build battering ram ───────────────────────────────────────────────────
  // Long CylinderGeometry log (8 units) + 6 BoxGeometry handles, 4 soldiers carry
  function _buildBatteringRam(x, z) {
    var grp = new THREE.Group();

    // Main log (8 units long on Z axis)
    var log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 8, 12),
      new THREE.MeshLambertMaterial({ color: 0x6B4F2A })
    );
    log.rotation.z = Math.PI / 2;   // lay horizontal along X
    log.position.set(0, 1.1, 0);
    grp.add(log);

    // Iron tip at one end
    var tip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0, 0.38, 0.8, 8),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    tip.rotation.z = Math.PI / 2;
    tip.position.set(4.4, 1.1, 0);
    grp.add(tip);

    // 6 handles (BoxGeometry, 3 per side along log length)
    var handlePositions = [-2.5, 0, 2.5];
    for (var hi = 0; hi < handlePositions.length; hi++) {
      var hx = handlePositions[hi];
      // left side handle
      var hL = _box(0.12, 0.9, 0.12, 0x8B6914);
      hL.position.set(hx, 0.4, -0.55);
      grp.add(hL);
      // right side handle
      var hR = _box(0.12, 0.9, 0.12, 0x8B6914);
      hR.position.set(hx, 0.4, 0.55);
      grp.add(hR);
    }

    grp.position.set(x, 0, z);
    _scene.add(grp);

    // 4 CylinderGeometry soldier NPCs
    var soldiers = [];
    var soldierXPositions = [-2.5, -0.8, 0.8, 2.5];
    for (var si = 0; si < soldierXPositions.length; si++) {
      var solGrp = new THREE.Group();
      var solBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 1.5, 8),
        new THREE.MeshLambertMaterial({ color: 0x4A5230 })
      );
      solBody.position.y = 0.75;
      solGrp.add(solBody);
      var solHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 6, 6),
        new THREE.MeshLambertMaterial({ color: 0xB08060 })
      );
      solHead.position.y = 1.65;
      solGrp.add(solHead);
      solGrp.position.set(x + soldierXPositions[si], 0, z + 0.9);
      _scene.add(solGrp);
      soldiers.push({ group: solGrp, walkPhase: si * 0.5 });
    }

    return {
      group: grp,
      soldiers: soldiers,
      swingAngle: 0,
      swingDir: 1,
      swinging: false,
      hits: 0,
      targetStrongpoint: null,
      moving: false,
      moveSpeed: 2.5
    };
  }

  // ── Build ladder ──────────────────────────────────────────────────────────
  function _buildLadder(x, z) {
    var grp = new THREE.Group();
    var height = 6;

    // Two rails (BoxGeometry)
    var railMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    var railL = new THREE.Mesh(new THREE.BoxGeometry(0.12, height, 0.12), railMat);
    railL.position.set(-0.35, height / 2, 0);
    grp.add(railL);
    var railR = new THREE.Mesh(new THREE.BoxGeometry(0.12, height, 0.12), railMat);
    railR.position.set(0.35, height / 2, 0);
    grp.add(railR);

    // Rungs (BoxGeometry)
    var rungCount = Math.floor(height / 0.75);
    for (var ri = 0; ri <= rungCount; ri++) {
      var rung = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.1, 0.1),
        new THREE.MeshLambertMaterial({ color: 0xA07848 })
      );
      rung.position.set(0, ri * 0.75 + 0.2, 0);
      grp.add(rung);
    }

    grp.position.set(x, 0, z);
    _scene.add(grp);

    // 3 climber NPCs
    var climbers = [];
    for (var ci = 0; ci < 3; ci++) {
      var cGrp = new THREE.Group();
      var cBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 1.4, 8),
        new THREE.MeshLambertMaterial({ color: 0x4A5230 })
      );
      cBody.position.y = 0.7;
      cGrp.add(cBody);
      var cHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 6, 6),
        new THREE.MeshLambertMaterial({ color: 0xB08060 })
      );
      cHead.position.y = 1.5;
      cGrp.add(cHead);
      cGrp.position.set(x + (ci - 1) * 0.4, 0, z);
      _scene.add(cGrp);
      climbers.push({ group: cGrp, climbY: ci * -1.5, speed: 1.5 + ci * 0.2 });
    }

    return {
      group: grp,
      climbers: climbers,
      deployed: false,
      height: height
    };
  }

  // ── Build siege tower (4×4×12 box on wheels) ─────────────────────────────
  function _buildSiegeTower(x, z) {
    var grp = new THREE.Group();

    // Main tower body (4×12×4)
    var tower = new THREE.Mesh(
      new THREE.BoxGeometry(4, 12, 4),
      new THREE.MeshLambertMaterial({ color: 0x7A6040 })
    );
    tower.position.set(0, 6, 0);
    grp.add(tower);

    // Platform at top
    var platform = _box(4.5, 0.3, 4.5, 0x5A4828);
    platform.position.set(0, 12.15, 0);
    grp.add(platform);

    // Battlements on top
    for (var bi2 = -1; bi2 <= 1; bi2 += 2) {
      var battlement = _box(0.5, 0.8, 4.5, 0x6A5030);
      battlement.position.set(bi2 * 2, 12.55, 0);
      grp.add(battlement);
    }

    // 4 Wheels
    var wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 10);
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var wheelPos = [[-1.6, 0.6, -1.8], [1.6, 0.6, -1.8], [-1.6, 0.6, 1.8], [1.6, 0.6, 1.8]];
    for (var wi2 = 0; wi2 < wheelPos.length; wi2++) {
      var wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wheelPos[wi2][0], wheelPos[wi2][1], wheelPos[wi2][2]);
      grp.add(wheel);
    }

    grp.position.set(x, 0, z);
    _scene.add(grp);

    return { group: grp };
  }

  // ── Build isolation perimeter (12 posts in circle, LineSegments wire) ────
  function _buildPerimeter(cx, cz, radius) {
    var postCount = 12;
    var postMat = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    var posts = [];

    for (var pi = 0; pi < postCount; pi++) {
      var angle = (pi / postCount) * Math.PI * 2;
      var px = cx + Math.cos(angle) * radius;
      var pz = cz + Math.sin(angle) * radius;

      var postGrp = new THREE.Group();
      var postMesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.5, 0.25), postMat);
      postMesh.position.set(px, 1.25, pz);
      _scene.add(postMesh);

      // Wire spike top
      var spike = _box(0.1, 0.5, 0.1, 0x555555);
      spike.position.set(px, 2.75, pz);
      _scene.add(spike);

      posts.push({ mesh: postMesh, spike: spike, px: px, pz: pz });
    }

    // Build connecting LineSegments
    var lineVerts = [];
    for (var li2 = 0; li2 < posts.length; li2++) {
      var next = (li2 + 1) % posts.length;
      lineVerts.push(posts[li2].px, 1.5, posts[li2].pz);
      lineVerts.push(posts[next].px, 1.5, posts[next].pz);
    }
    var lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lineVerts), 3));
    var wireMat = new THREE.LineBasicMaterial({ color: 0xAA8800 });
    var wireLines = new THREE.LineSegments(lineGeo, wireMat);
    _scene.add(wireLines);

    return { posts: posts, lines: wireLines, cx: cx, cz: cz, radius: radius };
  }

  // ── Build supply wagon ────────────────────────────────────────────────────
  function _buildSupplyWagon(x, z) {
    var grp = new THREE.Group();

    // Cart body (3×1.5×2)
    var cart = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1.5, 2),
      new THREE.MeshLambertMaterial({ color: 0x8B6914 })
    );
    cart.position.set(0, 0.75, 0);
    grp.add(cart);

    // Cargo boxes on top
    var cargo1 = _box(0.8, 0.6, 0.7, 0x5C4A2A);
    cargo1.position.set(-0.7, 1.8, 0);
    grp.add(cargo1);
    var cargo2 = _box(0.8, 0.6, 0.7, 0x4A5230);
    cargo2.position.set(0.5, 1.8, 0.3);
    grp.add(cargo2);

    // Wagon wheels
    var wGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 10);
    var wMat = new THREE.MeshLambertMaterial({ color: 0x3A2810 });
    var wPositions = [[-1.2, 0.5, -1.1], [1.2, 0.5, -1.1], [-1.2, 0.5, 1.1], [1.2, 0.5, 1.1]];
    for (var wi3 = 0; wi3 < wPositions.length; wi3++) {
      var w = new THREE.Mesh(wGeo, wMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(wPositions[wi3][0], wPositions[wi3][1], wPositions[wi3][2]);
      grp.add(w);
    }

    // Horse (SphereGeometry body)
    var horseMat = new THREE.MeshLambertMaterial({ color: 0x8B5E3C });
    var horseMesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), horseMat);
    horseMesh.scale.set(1.8, 1.1, 1.0);
    horseMesh.position.set(-2.8, 0.85, 0);
    grp.add(horseMesh);

    // Horse legs
    for (var hli = 0; hli < 4; hli++) {
      var legPos = [(hli < 2 ? -0.4 : 0.4), 0.1, (hli % 2 === 0 ? -0.25 : 0.25)];
      var leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.7, 6),
        horseMat
      );
      leg.position.set(-2.8 + legPos[0], legPos[1], legPos[2]);
      grp.add(leg);
    }

    // Horse head
    var horseHead = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.35), horseMat);
    horseHead.position.set(-3.8, 1.35, 0);
    grp.add(horseHead);

    // Harness shaft
    var shaft = _box(1.8, 0.1, 0.1, 0x5A3A1A);
    shaft.position.set(-1.9, 0.9, 0);
    grp.add(shaft);

    grp.position.set(x, 0, z);
    _scene.add(grp);

    return { group: grp, x: x, z: z, angle: 0 };
  }

  // ── Suppressing fire tracers ──────────────────────────────────────────────
  function _fireSuppressingTracers() {
    if (!_scene || !_camera || _strongpoints.length === 0) return;

    // Pick a random alive strongpoint as target
    var targets = [];
    for (var si = 0; si < _strongpoints.length; si++) {
      if (!_strongpoints[si].cleared) targets.push(_strongpoints[si]);
    }
    if (targets.length === 0) return;

    var target = targets[Math.floor(Math.random() * targets.length)];

    // Fire from near camera / command post
    var fromPos = _camera.position.clone();
    var toPos = new THREE.Vector3(
      target.x + (Math.random() - 0.5) * 3,
      1.5,
      target.z + (Math.random() - 0.5) * 3
    );

    var tracerMat = new THREE.LineBasicMaterial({
      color: 0xFFFF00,
      transparent: true,
      opacity: 0.9
    });
    var pts = new Float32Array([
      fromPos.x, fromPos.y, fromPos.z,
      toPos.x,   toPos.y,   toPos.z
    ]);
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    var tracer = new THREE.LineSegments(geo, tracerMat);
    _scene.add(tracer);
    _tracers.push({ mesh: tracer, life: 0.15 });
  }

  // ── Alarm flash ───────────────────────────────────────────────────────────
  function _showAlarm(msg) {
    if (!_alarmEl) {
      _alarmEl = document.createElement('div');
      _alarmEl.style.cssText = [
        'position:fixed',
        'top:35%',
        'left:50%',
        'transform:translateX(-50%)',
        'font-family:monospace',
        'font-size:22px',
        'font-weight:bold',
        'color:#FF2200',
        'background:rgba(0,0,0,0.75)',
        'border:2px solid #FF2200',
        'padding:8px 28px',
        'border-radius:4px',
        'z-index:9998',
        'pointer-events:none',
        'letter-spacing:4px'
      ].join(';');
      document.body.appendChild(_alarmEl);
    }
    _alarmEl.textContent = msg;
    _alarmEl.style.display = 'block';
    _alarmTimer = 3.0;
    _alarmActive = true;
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'siege-warfare-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.72)',
      'color:#E8D060',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'padding:8px 20px',
      'border:2px solid #7A6A20',
      'border-radius:6px',
      'pointer-events:none',
      'z-index:9997',
      'display:none',
      'letter-spacing:2px'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_siegeActive) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';

    var clearedCount = 0;
    for (var si = 0; si < _strongpoints.length; si++) {
      if (_strongpoints[si].cleared) clearedCount++;
    }

    var phaseName = PHASES[_phase];
    var phaseNum  = _phase + 1;
    var totalPhases = PHASES.length;
    var moraleStr = Math.max(0, Math.round(_enemyMorale)) + '%';
    var moraleColor = _enemyMorale > 50 ? '#E8D060'
                    : _enemyMorale > 20 ? '#FF8800'
                    : '#FF2222';

    _hudEl.innerHTML =
      'SIEGE: ' + phaseName + ' [Phase ' + phaseNum + '/' + totalPhases + '] | ' +
      'STRONGPOINTS: ' + clearedCount + '/' + _strongpoints.length + ' | ' +
      'MORALE: <span style="color:' + moraleColor + '">' + moraleStr + '</span>' +
      (_surrendered ? ' | <span style="color:#00FF88">SURRENDER</span>' : '');
  }

  // ── Phase advancement ─────────────────────────────────────────────────────
  function _advancePhase() {
    if (_phase >= PHASES.length - 1) return;
    _phase++;
    _phaseTimer = 0;
    _updateHUD();

    // Phase transitions
    if (_phase === 1) {
      // ISOLATE: build perimeter around first strongpoint target
      if (_strongpoints.length > 0) {
        var sp = _strongpoints[0];
        var perim = _buildPerimeter(sp.x, sp.z, 18);
        _perimeterPosts = perim.posts;
        _perimeterLines = perim.lines;
      }
    }

    if (_phase === 3) {
      // ASSAULT: activate battering ram advance
      if (_batteringRam && _strongpoints.length > 0) {
        _batteringRam.targetStrongpoint = _strongpoints[0];
        _batteringRam.moving = true;
      }
      // Deploy ladder
      if (_ladder) {
        _ladder.deployed = true;
      }
    }
  }

  // ── Check perimeter crossing ──────────────────────────────────────────────
  function _checkPerimeter(dt) {
    if (_perimeterPosts.length === 0 || _phase < 1) return;
    // Simulate enemy crossing with a periodic random check
    if (Math.random() < dt * 0.08) {
      _showAlarm('ALARM! PERIMETER BREACHED — REINFORCEMENTS');
      // Morale boost for defender on reinforcement
      _enemyMorale = Math.min(100, _enemyMorale + 5);
    }
  }

  // ── Update battering ram ──────────────────────────────────────────────────
  function _updateBatteringRam(dt) {
    if (!_batteringRam) return;

    var ram = _batteringRam;

    // March soldiers (walk cycle)
    for (var si = 0; si < ram.soldiers.length; si++) {
      var sol = ram.soldiers[si];
      sol.walkPhase += dt * 3.5;
      sol.group.position.y = Math.abs(Math.sin(sol.walkPhase)) * 0.15;
    }

    // Move toward target
    if (ram.moving && ram.targetStrongpoint && !ram.swinging) {
      var sp = ram.targetStrongpoint;
      var dx = sp.x - ram.group.position.x;
      var dz = (sp.z + 2.5) - ram.group.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 1.0) {
        var nx = dx / dist;
        var nz = dz / dist;
        ram.group.position.x += nx * ram.moveSpeed * dt;
        ram.group.position.z += nz * ram.moveSpeed * dt;
        // Move soldiers in sync
        for (var si2 = 0; si2 < ram.soldiers.length; si2++) {
          ram.soldiers[si2].group.position.x += nx * ram.moveSpeed * dt;
          ram.soldiers[si2].group.position.z += nz * ram.moveSpeed * dt;
        }
        // Orient toward target
        ram.group.rotation.y = Math.atan2(dx, dz);
      } else {
        // Start swinging
        ram.swinging = true;
        ram.moving = false;
      }
    }

    // Swing animation (rotation back and forth)
    if (ram.swinging) {
      ram.swingAngle += ram.swingDir * dt * 1.8;
      ram.group.rotation.x = Math.sin(ram.swingAngle) * 0.35;

      // Impact moment
      if (ram.swingDir > 0 && ram.swingAngle > 0.9) {
        ram.swingDir = -1;
        // Count as hit
        if (ram.targetStrongpoint && !ram.targetStrongpoint.cleared) {
          ram.hits++;
          ram.targetStrongpoint.hp -= 80;

          if (ram.hits >= 3 && ram.targetStrongpoint.door) {
            // Door breaks — turn transparent
            ram.targetStrongpoint.door.material.transparent = true;
            ram.targetStrongpoint.door.material.opacity = 0.15;
            ram.targetStrongpoint.door.material.needsUpdate = true;
          }

          if (ram.targetStrongpoint.hp <= 0) {
            _clearStrongpoint(ram.targetStrongpoint);
            ram.swinging = false;
            ram.targetStrongpoint = null;
            // Look for next strongpoint
            for (var nsi = 0; nsi < _strongpoints.length; nsi++) {
              if (!_strongpoints[nsi].cleared) {
                ram.targetStrongpoint = _strongpoints[nsi];
                ram.moving = true;
                ram.hits = 0;
                break;
              }
            }
          }
        }
      }

      if (ram.swingDir < 0 && ram.swingAngle < -0.5) {
        ram.swingDir = 1;
      }
    }
  }

  // ── Clear strongpoint (all defenders surrender/die) ───────────────────────
  function _clearStrongpoint(sp) {
    if (sp.cleared) return;
    sp.cleared = true;
    // Tint structure to show destroyed
    if (sp.group) {
      sp.group.traverse(function (child) {
        if (child.isMesh && child.material) {
          child.material = new THREE.MeshLambertMaterial({
            color: 0x3A3A28,
            transparent: true,
            opacity: 0.7
          });
        }
      });
    }
    // Drop morale significantly
    _enemyMorale = Math.max(0, _enemyMorale - 30);
    _checkSurrenderTrigger();
    _updateHUD();

    // Check if all cleared → auto-advance to CONSOLIDATE
    var clearedCount = 0;
    for (var i = 0; i < _strongpoints.length; i++) {
      if (_strongpoints[i].cleared) clearedCount++;
    }
    if (clearedCount >= _strongpoints.length && _phase < 4) {
      _phase = 4;
      _phaseTimer = 0;
      _updateHUD();
    }
  }

  // ── Surrender trigger ─────────────────────────────────────────────────────
  function _checkSurrenderTrigger() {
    if (_surrendered || _enemyMorale >= 20) return;
    _surrendered = true;
    // Defenders drop weapons (rotate down and become inactive)
    for (var spi = 0; spi < _strongpoints.length; spi++) {
      var sp = _strongpoints[spi];
      for (var di = 0; di < sp.defenders.length; di++) {
        var def = sp.defenders[di];
        if (def.alive) {
          def.surrendered = true;
          // Raise hands (rotate group)
          if (def.group) def.group.rotation.z = 0.4;
        }
      }
    }
    _showAlarm('ENEMY SURRENDERS! MORALE COLLAPSED');
  }

  // ── Update ladder climbers ────────────────────────────────────────────────
  function _updateLadder(dt) {
    if (!_ladder || !_ladder.deployed) return;

    for (var ci = 0; ci < _ladder.climbers.length; ci++) {
      var cl = _ladder.climbers[ci];
      cl.climbY += cl.speed * dt;
      if (cl.climbY > _ladder.height + 1.0) {
        cl.climbY = 0; // loop back down
      }
      cl.group.position.y = Math.max(0, cl.climbY);
    }
  }

  // ── Update defenders (patrol / surrender) ─────────────────────────────────
  function _updateDefenders(dt) {
    for (var spi = 0; spi < _strongpoints.length; spi++) {
      var sp = _strongpoints[spi];
      for (var di = 0; di < sp.defenders.length; di++) {
        var def = sp.defenders[di];
        if (!def.alive || def.surrendered) continue;
        // Simple patrol orbit around strongpoint
        def.patrolAngle += dt * 0.6;
        var pr = 3.0;
        def.group.position.x = sp.x + Math.cos(def.patrolAngle) * pr;
        def.group.position.z = sp.z + Math.sin(def.patrolAngle) * pr;
        def.group.rotation.y = def.patrolAngle + Math.PI / 2;
      }
    }
  }

  // ── Update morale decay (progresses during SUPPRESS phase) ───────────────
  function _updateMorale(dt) {
    if (!_siegeActive) return;
    var decayRate = 0;
    if (_phase === 2) decayRate = 4.0;   // SUPPRESS
    if (_phase === 3) decayRate = 7.0;   // ASSAULT
    if (_phase === 4) decayRate = 3.0;   // CONSOLIDATE

    _enemyMorale = Math.max(0, _enemyMorale - decayRate * dt);
    _checkSurrenderTrigger();
  }

  // ── Update supply wagon (orbits near command post) ────────────────────────
  function _updateSupplyWagon(dt) {
    if (!_supplyWagon || !_commandPost) return;

    _supplyTimer += dt;
    _supplyWagon.angle += dt * 0.4;

    var cx = _commandPost.position.x;
    var cz = _commandPost.position.z;
    _supplyWagon.group.position.x = cx + Math.cos(_supplyWagon.angle) * 12;
    _supplyWagon.group.position.z = cz + Math.sin(_supplyWagon.angle) * 12;
    _supplyWagon.group.rotation.y = _supplyWagon.angle + Math.PI / 2;

    if (_supplyTimer >= SUPPLY_INTERVAL) {
      _supplyTimer = 0;
      _showAlarm('SUPPLY WAGON — RESUPPLY COMPLETE');
    }
  }

  // ── Update tracers ────────────────────────────────────────────────────────
  function _updateTracers(dt) {
    for (var ti = _tracers.length - 1; ti >= 0; ti--) {
      _tracers[ti].life -= dt;
      if (_tracers[ti].life <= 0) {
        try { _scene.remove(_tracers[ti].mesh); } catch (e) {}
        _tracers.splice(ti, 1);
      } else {
        _tracers[ti].mesh.material.opacity = _tracers[ti].life / 0.15;
      }
    }
  }

  // ── Get player position ───────────────────────────────────────────────────
  function _getPlayerPos() {
    try {
      if (window.player && window.player.position) return window.player.position;
    } catch (e) {}
    return _camera ? _camera.position : new THREE.Vector3(0, 0, 0);
  }

  // ── Key events ────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    _keysDown[e.code] = true;

    // S+W to initiate siege mode
    if (e.code === 'KeyW' && _keysDown['KeyS']) {
      _initiateSiege();
    }
    if (e.code === 'KeyS' && _keysDown['KeyW']) {
      _initiateSiege();
    }

    // L key — deploy ladder
    if (e.code === 'KeyL') {
      _deployLadder();
    }
  }

  function _onKeyUp(e) {
    _keysDown[e.code] = false;
  }

  // ── Initiate siege mode ───────────────────────────────────────────────────
  function _initiateSiege() {
    if (_siegeActive) return;
    _siegeActive = true;
    _phase = 0;
    _phaseTimer = 0;
    _enemyMorale = 100;
    _surrendered = false;

    var playerPos = _getPlayerPos();

    // Place command post at player position
    _commandPost = _buildCommandPost(playerPos.x - 5, 0, playerPos.z);

    // Spawn 3 enemy strongpoints
    var spawnOffsets = [
      { x: playerPos.x + 20, z: playerPos.z },
      { x: playerPos.x + 15, z: playerPos.z + 18 },
      { x: playerPos.x + 25, z: playerPos.z - 15 }
    ];
    for (var i = 0; i < 3; i++) {
      _strongpoints.push(_buildStrongpoint(spawnOffsets[i].x, spawnOffsets[i].z));
    }

    // Build siege weapons near command post
    _batteringRam = _buildBatteringRam(playerPos.x, playerPos.z + 5);
    _siegeTower   = _buildSiegeTower(playerPos.x - 8, playerPos.z + 4);
    _supplyWagon  = _buildSupplyWagon(playerPos.x + 8, playerPos.z - 5);

    _updateHUD();
  }

  // ── Deploy ladder against nearest strongpoint wall ────────────────────────
  function _deployLadder() {
    if (!_siegeActive) return;
    if (_ladder) return; // already deployed

    // Find nearest non-cleared strongpoint
    var nearest = null;
    var nearestDist = Infinity;
    var playerPos = _getPlayerPos();

    for (var i = 0; i < _strongpoints.length; i++) {
      if (_strongpoints[i].cleared) continue;
      var dx = _strongpoints[i].x - playerPos.x;
      var dz = _strongpoints[i].z - playerPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = _strongpoints[i];
      }
    }

    if (!nearest) return;

    // Place ladder at the near wall of the strongpoint
    var lx = nearest.x;
    var lz = nearest.z + 2.5;

    _ladder = _buildLadder(lx, lz);
    _ladder.deployed = true;
    // Lean the ladder against the wall
    _ladder.group.rotation.x = -0.25;
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
    _time   = 0;
    _phase  = 0;
    _phaseTimer = 0;
    _siegeActive = false;
    _strongpoints = [];
    _perimeterPosts = [];
    _perimeterLines = null;
    _tracers = [];
    _alarmActive = false;
    _alarmTimer = 0;
    _enemyMorale = 100;
    _surrendered = false;
    _suppressTimer = 0;
    _supplyTimer = 0;
    _commandPost = null;
    _batteringRam = null;
    _ladder = null;
    _siegeTower = null;
    _supplyWagon = null;
    _keysDown = {};
    _matCache = {};

    document.removeEventListener('keydown', _onKeyDown, false);
    document.removeEventListener('keyup',   _onKeyUp,   false);
    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keyup',   _onKeyUp,   false);

    if (!_hudEl) _createHUD();
    _updateHUD();
  }

  // ── Update (called each frame) ────────────────────────────────────────────
  function update(delta) {
    if (!delta || isNaN(delta)) delta = 0.016;
    _time += delta;

    if (!_siegeActive) return;

    // Phase timer auto-advance
    _phaseTimer += delta;
    if (_phase < PHASES.length - 1 && _phaseTimer >= PHASE_DURATIONS[_phase]) {
      _advancePhase();
    }

    // Suppressing fire (active in SUPPRESS and ASSAULT phases)
    if (_phase >= 2 && _phase <= 3) {
      _suppressTimer += delta;
      if (_suppressTimer >= SUPPRESS_INTERVAL) {
        _suppressTimer = 0;
        _fireSuppressingTracers();
      }
    }

    // Update subsystems
    _updateBatteringRam(delta);
    _updateLadder(delta);
    _updateDefenders(delta);
    _updateMorale(delta);
    _updateSupplyWagon(delta);
    _updateTracers(delta);
    _checkPerimeter(delta);

    // Alarm timer decay
    if (_alarmActive) {
      _alarmTimer -= delta;
      if (_alarmTimer <= 0) {
        _alarmActive = false;
        if (_alarmEl) _alarmEl.style.display = 'none';
      }
    }

    _updateHUD();
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  function reset() {
    document.removeEventListener('keydown', _onKeyDown, false);
    document.removeEventListener('keyup',   _onKeyUp,   false);

    // Remove command post
    if (_commandPost && _commandPost.group && _scene) {
      try { _scene.remove(_commandPost.group); } catch (e) {}
    }
    _commandPost = null;

    // Remove strongpoints and defenders
    for (var spi = 0; spi < _strongpoints.length; spi++) {
      var sp = _strongpoints[spi];
      try { if (_scene && sp.group) _scene.remove(sp.group); } catch (e) {}
      for (var di = 0; di < sp.defenders.length; di++) {
        try { if (_scene && sp.defenders[di].group) _scene.remove(sp.defenders[di].group); } catch (e2) {}
      }
    }
    _strongpoints = [];

    // Remove battering ram + soldiers
    if (_batteringRam) {
      try { if (_scene && _batteringRam.group) _scene.remove(_batteringRam.group); } catch (e) {}
      for (var si3 = 0; si3 < _batteringRam.soldiers.length; si3++) {
        try { if (_scene && _batteringRam.soldiers[si3].group) _scene.remove(_batteringRam.soldiers[si3].group); } catch (e3) {}
      }
      _batteringRam = null;
    }

    // Remove ladder + climbers
    if (_ladder) {
      try { if (_scene && _ladder.group) _scene.remove(_ladder.group); } catch (e) {}
      for (var ci2 = 0; ci2 < _ladder.climbers.length; ci2++) {
        try { if (_scene && _ladder.climbers[ci2].group) _scene.remove(_ladder.climbers[ci2].group); } catch (e4) {}
      }
      _ladder = null;
    }

    // Remove siege tower
    if (_siegeTower) {
      try { if (_scene && _siegeTower.group) _scene.remove(_siegeTower.group); } catch (e) {}
      _siegeTower = null;
    }

    // Remove supply wagon
    if (_supplyWagon) {
      try { if (_scene && _supplyWagon.group) _scene.remove(_supplyWagon.group); } catch (e) {}
      _supplyWagon = null;
    }

    // Remove perimeter
    for (var pi = 0; pi < _perimeterPosts.length; pi++) {
      try {
        if (_scene) {
          _scene.remove(_perimeterPosts[pi].mesh);
          _scene.remove(_perimeterPosts[pi].spike);
        }
      } catch (e) {}
    }
    _perimeterPosts = [];
    if (_perimeterLines && _scene) {
      try { _scene.remove(_perimeterLines); } catch (e) {}
      _perimeterLines = null;
    }

    // Remove tracers
    for (var ti = 0; ti < _tracers.length; ti++) {
      try { if (_scene) _scene.remove(_tracers[ti].mesh); } catch (e) {}
    }
    _tracers = [];

    // Reset HUD
    if (_hudEl) _hudEl.style.display = 'none';
    if (_alarmEl) {
      try { if (_alarmEl.parentNode) _alarmEl.parentNode.removeChild(_alarmEl); } catch (e) {}
      _alarmEl = null;
    }

    _siegeActive = false;
    _phase = 0;
    _phaseTimer = 0;
    _enemyMorale = 100;
    _surrendered = false;
    _suppressTimer = 0;
    _supplyTimer = 0;
    _alarmActive = false;
    _alarmTimer = 0;
    _keysDown = {};
    _matCache = {};
    _time = 0;
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    init:   init,
    update: update,
    reset:  reset,

    // Expose for external query
    isSiegeActive:    function () { return _siegeActive; },
    getCurrentPhase:  function () { return _phase; },
    getPhaseName:     function () { return PHASES[_phase]; },
    getEnemyMorale:   function () { return _enemyMorale; },
    getStrongpoints:  function () { return _strongpoints.slice(); },
    hasSurrendered:   function () { return _surrendered; },
    PHASES:           PHASES
  };

})();
