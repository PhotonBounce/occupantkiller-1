window.UrbanWarfare = (function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────────────────
  var scene = null;
  var camera = null;
  var renderer = null;

  var active = false;
  var uKeyDown = false;
  var wKeyDown = false;
  var eKeyDown = false;
  var bKeyDown = false;
  var gKeyDown = false;
  var prevUKey = false;
  var prevEKey = false;
  var prevBKey = false;
  var prevGKey = false;

  // Urban block
  var urbanRoot = null;
  var buildings = [];         // array of building descriptor objects
  var courtyard = null;

  // Player state
  var insideBuilding = false;
  var currentBuilding = null;
  var currentFloor = 1;
  var playerHP = 100;

  // CQB modifiers
  var CQB_SWAY_MULT    = 1.30;
  var CQB_SPEED_MULT   = 0.80;
  var CQB_SPREAD_MULT  = 0.80;

  // Breach slow-motion
  var breachActive = false;
  var breachTimer  = 0;
  var BREACH_DURATION   = 1.5;
  var BREACH_TIMESCALE  = 0.3;
  var BREACH_FOV        = 90;
  var normalFOV         = 75;
  var currentFOV        = 75;

  // Sniper nest
  var sniperNestBuilding = null;
  var sniperEnemy        = null;
  var sniperActive       = true;

  // Room cleared tracking
  var buildingsCleared   = 0;
  var TOTAL_BUILDINGS    = 4;

  // Collapse state list
  var collapsingBuildings = [];

  // Enemies list (all urban enemies)
  var urbanEnemies = [];

  // Grenade
  var grenades = [];

  // Window frames
  var windowFrames = [];

  // HUD element
  var hudEl = null;

  // Original camera settings backup
  var origFogBackup   = null;
  var origBgBackup    = null;

  // Elapsed time accumulator
  var elapsed = 0;

  // ── Constants ─────────────────────────────────────────────────────────────
  var BUILDING_COLOR    = 0x556655;
  var FLOOR_COLOR       = 0x444444;
  var WALL_COLOR        = 0x667766;
  var COVER_SOFA_COLOR  = 0x885544;
  var COVER_DESK_COLOR  = 0x997755;
  var COVER_TABLE_COLOR = 0x776644;
  var ENEMY_COLOR       = 0xcc3333;
  var SNIPER_COLOR      = 0x993311;
  var WINDOW_COLOR      = 0x334433;
  var STAIR_COLOR       = 0x555555;
  var LADDER_COLOR      = 0x888866;
  var ENTRY_DIST        = 5.5;
  var GRENADE_SPEED     = 15;
  var GRENADE_DMG       = 60;
  var GRENADE_RADIUS    = 5;
  var BULLET_WINDOW_DROP = 0.10;
  var SNIPER_RANGE      = 50;
  var BUILDING_MAX_HP   = 100;
  var COLLAPSE_DURATION = 3.0;
  var ESCAPE_TIME       = 5.0;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function makeMesh(geo, mat) {
    return new THREE.Mesh(geo, mat);
  }

  function vecDist(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  // ── Building Construction ─────────────────────────────────────────────────
  function createBuilding(cx, cz, stories, hasSniperNest) {
    var group    = new THREE.Group();
    var h        = stories * 3;       // 3 units per storey
    var yScale   = h / 6;            // 6 = base height at stories=2

    // Outer shell
    var shellGeo = new THREE.BoxGeometry(8, h, 8);
    var shellMat = new THREE.MeshLambertMaterial({ color: BUILDING_COLOR, transparent: false, opacity: 1.0 });
    var shell    = makeMesh(shellGeo, shellMat);
    shell.position.set(0, h / 2, 0);
    group.add(shell);

    // Floor 1 base slab
    var floorGeo = new THREE.BoxGeometry(8, 0.2, 8);
    var floorMat = new THREE.MeshLambertMaterial({ color: FLOOR_COLOR });
    var floor1   = makeMesh(floorGeo, floorMat);
    floor1.position.set(0, 0.1, 0);
    group.add(floor1);

    // Floor 2 divider
    var floor2   = makeMesh(new THREE.BoxGeometry(8, 0.2, 8), new THREE.MeshLambertMaterial({ color: FLOOR_COLOR }));
    floor2.position.set(0, 3.1, 0);
    group.add(floor2);

    // Interior walls / partitions (floor 1)
    var wallMat = new THREE.MeshLambertMaterial({ color: WALL_COLOR });

    var iwall1 = makeMesh(new THREE.BoxGeometry(4, 3, 0.2), wallMat);
    iwall1.position.set(-2, 1.6, 0);
    group.add(iwall1);

    var iwall2 = makeMesh(new THREE.BoxGeometry(4, 3, 0.2), wallMat);
    iwall2.position.set(2, 1.6, 0);
    group.add(iwall2);

    // Interior walls (floor 2)
    var iwall3 = makeMesh(new THREE.BoxGeometry(4, 3, 0.2), wallMat);
    iwall3.position.set(0, 4.6, 1);
    group.add(iwall3);

    // Doorway gap markers (invisible helpers, just visual framing)
    // We leave a 2-unit gap by splitting wall; the partition above already shows the concept

    // Window frames (front face)
    var winMat = new THREE.MeshLambertMaterial({ color: WINDOW_COLOR });
    var wf1 = makeMesh(new THREE.BoxGeometry(1.5, 1.2, 0.15), winMat);
    wf1.position.set(-2.5, 1.5, -4.0);
    group.add(wf1);
    windowFrames.push({ mesh: wf1, building: group });

    var wf2 = makeMesh(new THREE.BoxGeometry(1.5, 1.2, 0.15), winMat);
    wf2.position.set(2.5, 1.5, -4.0);
    group.add(wf2);
    windowFrames.push({ mesh: wf2, building: group });

    var wf3 = makeMesh(new THREE.BoxGeometry(1.5, 1.2, 0.15), winMat);
    wf3.position.set(-2.5, 4.5, -4.0);
    group.add(wf3);
    windowFrames.push({ mesh: wf3, building: group });

    // Cover objects (furniture) – 2 on floor 1, 1-2 on floor 2
    var coverList = [];

    // Sofa
    var sofaGeo = new THREE.BoxGeometry(1, 0.5, 2);
    var sofaMat = new THREE.MeshLambertMaterial({ color: COVER_SOFA_COLOR });
    var sofa    = makeMesh(sofaGeo, sofaMat);
    sofa.position.set(-2.5, 0.35, -2);
    group.add(sofa);
    coverList.push(sofa);

    // Desk
    var deskGeo = new THREE.BoxGeometry(1.5, 0.8, 0.8);
    var deskMat = new THREE.MeshLambertMaterial({ color: COVER_DESK_COLOR });
    var desk    = makeMesh(deskGeo, deskMat);
    desk.position.set(2.5, 0.5, 1);
    group.add(desk);
    coverList.push(desk);

    // Overturned table
    var tableGeo = new THREE.BoxGeometry(2, 0.1, 1);
    var tableMat = new THREE.MeshLambertMaterial({ color: COVER_TABLE_COLOR });
    var table    = makeMesh(tableGeo, tableMat);
    table.position.set(0, 3.5, -2.5);
    group.add(table);
    coverList.push(table);

    // Staircase (8 steps)
    var stairMat = new THREE.MeshLambertMaterial({ color: STAIR_COLOR });
    var i;
    for (i = 0; i < 8; i++) {
      var step = makeMesh(new THREE.BoxGeometry(1.5, 0.3, 0.5), stairMat);
      step.position.set(3, 0.3 + i * 0.375, -3 + i * 0.45);
      group.add(step);
    }

    // Ladder to rooftop (CylinderGeometry rungs)
    var ladderMat = new THREE.MeshLambertMaterial({ color: LADDER_COLOR });
    var lrail1 = makeMesh(new THREE.CylinderGeometry(0.05, 0.05, h, 6), ladderMat);
    lrail1.position.set(3.2, h / 2, 3.8);
    group.add(lrail1);
    var lrail2 = makeMesh(new THREE.CylinderGeometry(0.05, 0.05, h, 6), ladderMat);
    lrail2.position.set(3.6, h / 2, 3.8);
    group.add(lrail2);

    for (i = 0; i < 6; i++) {
      var rung = makeMesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6), ladderMat);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(3.4, 0.5 + i * (h / 6), 3.8);
      group.add(rung);
    }

    // Rooftop platform
    var roofGeo = new THREE.BoxGeometry(8, 0.2, 8);
    var roofMat = new THREE.MeshLambertMaterial({ color: FLOOR_COLOR });
    var roof    = makeMesh(roofGeo, roofMat);
    roof.position.set(0, h + 0.1, 0);
    group.add(roof);

    // Sniper nest on rooftop
    var sniperEnemyRef = null;
    if (hasSniperNest) {
      var nestGeo = new THREE.CylinderGeometry(0.8, 1.0, 1.0, 8);
      var nestMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
      var nest    = makeMesh(nestGeo, nestMat);
      nest.position.set(0, h + 0.7, 0);
      group.add(nest);

      var sniperGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.5, 8);
      var sniperMat = new THREE.MeshLambertMaterial({ color: SNIPER_COLOR });
      var sniperMesh = makeMesh(sniperGeo, sniperMat);
      sniperMesh.position.set(0, h + 1.6, 0);
      group.add(sniperMesh);

      sniperEnemyRef = {
        mesh:      sniperMesh,
        group:     group,
        worldPos:  new THREE.Vector3(),
        hp:        80,
        alive:     true,
        isSniper:  true,
        fireTimer: 0,
        fireCooldown: 3.0
      };
      urbanEnemies.push(sniperEnemyRef);
      sniperEnemy = sniperEnemyRef;
    }

    // Enemies in cover (2-4 per building)
    var enemyCount = 2 + Math.floor(Math.random() * 3);
    var enemies = [];
    var ePositions = [
      new THREE.Vector3(-2.5, 0.6, -2),
      new THREE.Vector3(2.5, 0.6, 1),
      new THREE.Vector3(0, 3.8, -2.5),
      new THREE.Vector3(-2, 3.8, 2)
    ];

    var eMat = new THREE.MeshLambertMaterial({ color: ENEMY_COLOR });
    for (i = 0; i < Math.min(enemyCount, ePositions.length); i++) {
      var eGeo  = new THREE.BoxGeometry(0.5, 0.9, 0.4);
      var eMesh = makeMesh(eGeo, eMat.clone());
      eMesh.position.copy(ePositions[i]);
      group.add(eMesh);

      var coverPos = ePositions[i].clone();
      coverPos.y = ePositions[i].y - 0.3;

      var enemy = {
        mesh:        eMesh,
        group:       group,
        worldPos:    new THREE.Vector3(),
        hp:          60,
        alive:       true,
        isSniper:    false,
        inCover:     true,
        exposedTimer: 0,
        exposeCooldown: 2.0 + Math.random() * 2.0,
        exposeWindow:   0.8,
        coverYOffset:   ePositions[i].y,
        baseY:          ePositions[i].y,
        fireTimer:   0,
        fireCooldown: 1.5
      };
      enemies.push(enemy);
      urbanEnemies.push(enemy);
    }

    group.position.set(cx, 0, cz);

    var descriptor = {
      group:          group,
      shell:          shell,
      shellMat:       shellMat,
      stories:        stories,
      height:         h,
      cx:             cx,
      cz:             cz,
      hp:             BUILDING_MAX_HP,
      collapsing:     false,
      collapseTimer:  0,
      escapeTimer:    0,
      playerEscaping: false,
      enemies:        enemies,
      sniperEnemy:    sniperEnemyRef,
      cleared:        false,
      transparent:    false
    };

    return descriptor;
  }

  // ── Urban Block Setup ──────────────────────────────────────────────────────
  function buildUrbanBlock() {
    urbanRoot = new THREE.Group();

    // 4 buildings arranged around central courtyard (20×20 courtyard)
    var configs = [
      { cx: -14, cz: -14, stories: 4 },
      { cx:  14, cz: -14, stories: 6 },
      { cx: -14, cz:  14, stories: 5 },
      { cx:  14, cz:  14, stories: 8 }
    ];

    var sniperIdx = 3; // tallest building gets sniper nest
    var i;
    for (i = 0; i < configs.length; i++) {
      var cfg = configs[i];
      var bd  = createBuilding(cfg.cx, cfg.cz, cfg.stories, i === sniperIdx);
      buildings.push(bd);
      urbanRoot.add(bd.group);
      if (i === sniperIdx) {
        sniperNestBuilding = bd;
      }
    }

    // Courtyard ground
    var yardGeo = new THREE.BoxGeometry(20, 0.1, 20);
    var yardMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
    courtyard   = makeMesh(yardGeo, yardMat);
    courtyard.position.set(0, 0.05, 0);
    urbanRoot.add(courtyard);

    // Courtyard cover (some crates/barriers)
    var barrierMat = new THREE.MeshLambertMaterial({ color: 0x556655 });
    var positions2d = [[-4, -4], [4, 3], [-3, 5], [5, -6]];
    for (i = 0; i < positions2d.length; i++) {
      var bx = positions2d[i][0];
      var bz = positions2d[i][1];
      var barr = makeMesh(new THREE.BoxGeometry(1.5, 1, 1.5), barrierMat);
      barr.position.set(bx, 0.5, bz);
      urbanRoot.add(barr);
    }

    scene.add(urbanRoot);
  }

  // ── Activation / Deactivation ──────────────────────────────────────────────
  function activate() {
    if (active) { return; }
    active = true;

    if (scene && scene.fog) {
      origFogBackup = scene.fog.clone ? scene.fog.clone() : null;
    }
    if (renderer) {
      origBgBackup = renderer.getClearColor ? renderer.getClearColor(new THREE.Color()).clone() : null;
    }

    buildUrbanBlock();
    updateHUD();
  }

  function deactivate() {
    if (!active) { return; }
    active = false;

    if (urbanRoot && scene) {
      scene.remove(urbanRoot);
    }

    urbanRoot           = null;
    buildings           = [];
    urbanEnemies        = [];
    grenades            = [];
    windowFrames        = [];
    collapsingBuildings = [];
    sniperEnemy         = null;
    sniperNestBuilding  = null;
    sniperActive        = true;
    insideBuilding      = false;
    currentBuilding     = null;
    currentFloor        = 1;
    buildingsCleared    = 0;
    breachActive        = false;
    breachTimer         = 0;

    if (camera) {
      camera.fov = normalFOV;
      camera.updateProjectionMatrix();
    }

    if (hudEl) {
      hudEl.style.display = 'none';
    }
  }

  // ── Building Entry / Exit ──────────────────────────────────────────────────
  function tryEnterBuilding() {
    if (!camera) { return; }
    var camPos = camera.position;
    var i;
    for (i = 0; i < buildings.length; i++) {
      var bd = buildings[i];
      var dist = Math.sqrt(
        Math.pow(camPos.x - bd.cx, 2) +
        Math.pow(camPos.z - bd.cz, 2)
      );
      if (dist < ENTRY_DIST) {
        if (insideBuilding && currentBuilding === bd) {
          exitBuilding(bd);
        } else {
          enterBuilding(bd);
        }
        return;
      }
    }
    // Also check for ladder climb
    tryClimbLadder();
  }

  function enterBuilding(bd) {
    insideBuilding  = true;
    currentBuilding = bd;
    currentFloor    = 1;

    // Make walls semi-transparent
    if (bd.shellMat) {
      bd.shellMat.transparent = true;
      bd.shellMat.opacity     = 0.3;
      bd.shellMat.needsUpdate = true;
      bd.transparent          = true;
    }

    // Slight camera shift inward
    if (camera) {
      camera.position.x = bd.cx;
      camera.position.z = bd.cz;
      camera.position.y = 2.0;
    }

    updateHUD();
  }

  function exitBuilding(bd) {
    insideBuilding  = false;
    currentBuilding = null;
    currentFloor    = 1;

    if (bd.shellMat && bd.transparent) {
      bd.shellMat.transparent = false;
      bd.shellMat.opacity     = 1.0;
      bd.shellMat.needsUpdate = true;
      bd.transparent          = false;
    }

    updateHUD();
  }

  function tryClimbLadder() {
    if (!camera) { return; }
    var camPos = camera.position;
    var i;
    for (i = 0; i < buildings.length; i++) {
      var bd = buildings[i];
      var ladderX = bd.cx + 3.4;
      var ladderZ = bd.cz + 3.8;
      var d = Math.sqrt(
        Math.pow(camPos.x - ladderX, 2) +
        Math.pow(camPos.z - ladderZ, 2)
      );
      if (d < 1.5) {
        // Climb to rooftop
        if (camera) {
          camera.position.y = bd.height + 2.0;
          currentFloor = bd.stories;
        }
        updateHUD();
        return;
      }
    }
  }

  // ── Breach Mode ───────────────────────────────────────────────────────────
  function activateBreach() {
    if (breachActive) { return; }
    breachActive = true;
    breachTimer  = BREACH_DURATION;

    if (camera) {
      camera.fov = BREACH_FOV;
      camera.updateProjectionMatrix();
    }
  }

  function updateBreach(dtReal) {
    if (!breachActive) { return; }
    breachTimer -= dtReal;
    if (breachTimer <= 0) {
      breachActive = false;
      breachTimer  = 0;
      if (camera) {
        camera.fov = normalFOV;
        camera.updateProjectionMatrix();
      }
    }
  }

  // ── Grenade Throw ──────────────────────────────────────────────────────────
  function throwGrenade() {
    if (!camera || !scene) { return; }
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(camera.quaternion);

    var geo  = new THREE.SphereGeometry(0.15, 6, 6);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x334400 });
    var mesh = makeMesh(geo, mat);
    mesh.position.copy(camera.position);

    var vel = dir.multiplyScalar(GRENADE_SPEED);

    var gren = {
      mesh:     mesh,
      vel:      vel,
      timer:    2.5,
      exploded: false
    };
    grenades.push(gren);
    scene.add(mesh);
  }

  function updateGrenades(dt) {
    var gravity = -9.8;
    var i, j;
    for (i = grenades.length - 1; i >= 0; i--) {
      var g = grenades[i];
      if (g.exploded) { continue; }

      g.vel.y += gravity * dt;
      g.mesh.position.x += g.vel.x * dt;
      g.mesh.position.y += g.vel.y * dt;
      g.mesh.position.z += g.vel.z * dt;
      g.timer -= dt;

      // Check window pass-through (no special geometry, just conceptual)
      // If grenade goes through window frame area, velocity is unchanged (it passes freely)

      if (g.timer <= 0 || g.mesh.position.y < -1) {
        explodeGrenade(g);
        scene.remove(g.mesh);
        grenades.splice(i, 1);
      }
    }
  }

  function explodeGrenade(g) {
    g.exploded = true;
    var pos = g.mesh.position;
    var i;
    // Damage enemies in radius
    for (i = 0; i < urbanEnemies.length; i++) {
      var e = urbanEnemies[i];
      if (!e.alive) { continue; }
      e.group.localToWorld(e.worldPos.copy(e.mesh.position));
      var d = pos.distanceTo(e.worldPos);
      if (d < GRENADE_RADIUS) {
        var falloff = 1 - (d / GRENADE_RADIUS);
        e.hp -= GRENADE_DMG * falloff;
        if (e.hp <= 0) { killEnemy(e); }
      }
    }
    // Damage buildings in radius
    for (i = 0; i < buildings.length; i++) {
      var bd = buildings[i];
      var bdPos = new THREE.Vector3(bd.cx, 0, bd.cz);
      var d2 = pos.distanceTo(bdPos);
      if (d2 < GRENADE_RADIUS * 1.5) {
        damageBuilding(bd, 30);
      }
    }
  }

  // ── Enemy Logic ───────────────────────────────────────────────────────────
  function killEnemy(e) {
    e.alive = false;
    e.mesh.visible = false;
    if (e.isSniper) {
      sniperActive = false;
    }
    checkBuildingCleared(e);
    updateHUD();
  }

  function checkBuildingCleared(killedEnemy) {
    var i, j;
    for (i = 0; i < buildings.length; i++) {
      var bd = buildings[i];
      if (bd.cleared) { continue; }
      if (killedEnemy.group !== bd.group) { continue; }

      var allDead = true;
      for (j = 0; j < bd.enemies.length; j++) {
        if (bd.enemies[j].alive) { allDead = false; break; }
      }
      if (allDead) {
        bd.cleared = true;
        buildingsCleared++;
      }
    }
  }

  function updateEnemies(dt) {
    if (!camera) { return; }
    var camPos = camera.position;
    var i;
    for (i = 0; i < urbanEnemies.length; i++) {
      var e = urbanEnemies[i];
      if (!e.alive) { continue; }

      // Update world position
      e.group.localToWorld(e.worldPos.copy(e.mesh.position));

      if (e.isSniper) {
        updateSniperEnemy(e, dt, camPos);
      } else {
        updateCoverEnemy(e, dt, camPos);
      }
    }
  }

  function updateSniperEnemy(e, dt, camPos) {
    e.fireTimer -= dt;
    var dist = e.worldPos.distanceTo(camPos);
    if (dist < SNIPER_RANGE && e.fireTimer <= 0) {
      // Sniper fires if player is in courtyard (no cover)
      var inCourtyard = (
        Math.abs(camPos.x) < 10 &&
        Math.abs(camPos.z) < 10
      );
      if (inCourtyard) {
        playerHP -= 25;
        e.fireTimer = e.fireCooldown;
        updateHUD();
      } else {
        e.fireTimer = e.fireCooldown * 0.5;
      }
    }
  }

  function updateCoverEnemy(e, dt, camPos) {
    // Expose / return to cover cycle
    if (e.inCover) {
      e.exposeCooldown -= dt;
      if (e.exposeCooldown <= 0) {
        e.inCover        = false;
        e.exposedTimer   = e.exposeWindow;
        e.exposeCooldown = 2.0 + Math.random() * 2.0;
        // Pop up from cover
        e.mesh.position.y = e.baseY;
      } else {
        // Crouch: lower mesh
        e.mesh.position.y = e.baseY - 0.3;
      }
    } else {
      e.exposedTimer -= dt;
      if (e.exposedTimer <= 0) {
        e.inCover = true;
        e.mesh.position.y = e.baseY - 0.3;
      } else {
        // Fire at player during exposure
        e.fireTimer -= dt;
        if (e.fireTimer <= 0) {
          var dist = e.worldPos.distanceTo(camPos);
          if (dist < 20) {
            var spread = insideBuilding ? 0.6 : 1.0;
            if (Math.random() > spread * 0.4) {
              playerHP -= 5;
              updateHUD();
            }
          }
          e.fireTimer = e.fireCooldown;
        }
      }
    }
  }

  // ── Building Damage / Collapse ─────────────────────────────────────────────
  function damageBuilding(bd, amount) {
    if (bd.collapsing) { return; }
    bd.hp -= amount;
    if (bd.hp <= 0) {
      startCollapse(bd);
    }
  }

  function startCollapse(bd) {
    bd.collapsing     = true;
    bd.collapseTimer  = COLLAPSE_DURATION;
    bd.escapeTimer    = ESCAPE_TIME;
    bd.playerEscaping = (currentBuilding === bd);
    collapsingBuildings.push(bd);
    updateHUD();
  }

  function updateCollapsingBuildings(dt) {
    var i;
    for (i = collapsingBuildings.length - 1; i >= 0; i--) {
      var bd = collapsingBuildings[i];
      bd.collapseTimer -= dt;
      if (bd.playerEscaping) {
        bd.escapeTimer -= dt;
        if (bd.escapeTimer <= 0 && insideBuilding && currentBuilding === bd) {
          // Player trapped: take damage
          playerHP -= 50;
          insideBuilding  = false;
          currentBuilding = null;
          updateHUD();
        }
      }

      var t = 1.0 - (bd.collapseTimer / COLLAPSE_DURATION);
      t = clamp(t, 0, 1);
      // Shell scale.y lerps to 0
      bd.shell.scale.y = lerp(1.0, 0.0, t);
      // Sink position
      bd.shell.position.y = (bd.height / 2) * (1 - t);

      if (bd.collapseTimer <= 0) {
        bd.group.visible = false;
        collapsingBuildings.splice(i, 1);
        if (insideBuilding && currentBuilding === bd) {
          insideBuilding  = false;
          currentBuilding = null;
        }
      }
    }
  }

  // ── CQB Modifiers ─────────────────────────────────────────────────────────
  function getCQBModifiers() {
    if (!insideBuilding) {
      return { sway: 1.0, speed: 1.0, spread: 1.0 };
    }
    return {
      sway:   CQB_SWAY_MULT,
      speed:  CQB_SPEED_MULT,
      spread: CQB_SPREAD_MULT
    };
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function ensureHUD() {
    if (hudEl) { return; }
    hudEl = document.createElement('div');
    hudEl.id = 'uw-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'bottom:10px',
      'left:10px',
      'color:#aaffaa',
      'font-family:monospace',
      'font-size:13px',
      'background:rgba(0,0,0,0.55)',
      'padding:6px 10px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'display:none'
    ].join(';');
    document.body.appendChild(hudEl);
  }

  function updateHUD() {
    ensureHUD();
    if (!active) {
      hudEl.style.display = 'none';
      return;
    }
    hudEl.style.display = 'block';

    var floorStr    = 'FLOOR: ' + currentFloor;
    var inBldStr    = 'IN BUILDING: ' + (insideBuilding ? 'YES' : 'NO');
    var roomsStr    = 'ROOMS: ' + buildingsCleared + '/' + TOTAL_BUILDINGS + ' CLEAR';
    var sniperStr   = 'SNIPER: ' + (sniperActive ? 'ACTIVE' : 'ELIMINATED');
    var breachStr   = breachActive ? ' [BREACH]' : '';
    var colStr      = '';
    var i;
    for (i = 0; i < collapsingBuildings.length; i++) {
      var bd = collapsingBuildings[i];
      if (bd.playerEscaping && bd.escapeTimer > 0) {
        colStr = ' [ESCAPE: ' + Math.ceil(bd.escapeTimer) + 's]';
      }
    }
    var hpStr = ' HP:' + Math.max(0, Math.round(playerHP));

    hudEl.textContent = 'URBAN [' + floorStr + '] [' + inBldStr + '] [' + roomsStr + '] | ' +
      sniperStr + breachStr + colStr + hpStr;
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────
  function onKeyDown(ev) {
    var k = ev.key ? ev.key.toLowerCase() : '';
    if (k === 'u') { uKeyDown = true; }
    if (k === 'w') { wKeyDown = true; }
    if (k === 'e') { eKeyDown = true; }
    if (k === 'b') { bKeyDown = true; }
    if (k === 'g') { gKeyDown = true; }

    // U+W toggles urban warfare mode
    if (uKeyDown && wKeyDown) {
      if (active) { deactivate(); } else { activate(); }
    }

    // E — enter building / climb ladder (single press)
    if (k === 'e' && !prevEKey && active) {
      tryEnterBuilding();
    }

    // B — breach (single press)
    if (k === 'b' && !prevBKey && active) {
      activateBreach();
    }

    // G — throw grenade (single press)
    if (k === 'g' && !prevGKey && active) {
      throwGrenade();
    }

    prevEKey = eKeyDown;
    prevBKey = bKeyDown;
    prevGKey = gKeyDown;
  }

  function onKeyUp(ev) {
    var k = ev.key ? ev.key.toLowerCase() : '';
    if (k === 'u') { uKeyDown = false; }
    if (k === 'w') { wKeyDown = false; }
    if (k === 'e') { eKeyDown = false; prevEKey = false; }
    if (k === 'b') { bKeyDown = false; prevBKey = false; }
    if (k === 'g') { gKeyDown = false; prevGKey = false; }
  }

  // ── Init / Update / Reset ─────────────────────────────────────────────────
  function init(opts) {
    opts     = opts || {};
    scene    = opts.scene    || (window.game && window.game.scene)    || null;
    camera   = opts.camera   || (window.game && window.game.camera)   || null;
    renderer = opts.renderer || (window.game && window.game.renderer) || null;

    if (opts.normalFOV)  { normalFOV  = opts.normalFOV; }
    if (opts.currentFOV) { currentFOV = opts.currentFOV; }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);

    ensureHUD();
  }

  function update(dtArg, opts) {
    if (!active) { return; }

    opts = opts || {};
    // Allow external scene/camera injection on each frame
    if (opts.scene)    { scene    = opts.scene; }
    if (opts.camera)   { camera   = opts.camera; }
    if (opts.renderer) { renderer = opts.renderer; }

    // Real delta; if breach active, use slow-motion for game logic
    var dtReal = (typeof dtArg === 'number' && dtArg > 0) ? dtArg : 0.016;
    var dt     = breachActive ? dtReal * BREACH_TIMESCALE : dtReal;

    elapsed += dt;

    updateBreach(dtReal);
    updateEnemies(dt);
    updateGrenades(dt);
    updateCollapsingBuildings(dt);

    // Expose CQB modifiers for external weapon systems
    var mods = getCQBModifiers();
    if (window.game) {
      if (window.game.weaponSway   !== undefined) { window.game.weaponSway   = mods.sway; }
      if (window.game.moveSpeed    !== undefined) { window.game.moveSpeed    = mods.speed; }
      if (window.game.bulletSpread !== undefined) { window.game.bulletSpread = mods.spread; }
    }

    // Periodically refresh HUD (every ~0.25s)
    if (Math.floor(elapsed / 0.25) !== Math.floor((elapsed - dt) / 0.25)) {
      updateHUD();
    }
  }

  function reset() {
    deactivate();
    playerHP     = 100;
    elapsed      = 0;
    uKeyDown     = false;
    wKeyDown     = false;
    eKeyDown     = false;
    bKeyDown     = false;
    gKeyDown     = false;
    prevEKey     = false;
    prevBKey     = false;
    prevGKey     = false;
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init:   init,
    update: update,
    reset:  reset,

    // Expose for integration
    getCQBModifiers:  getCQBModifiers,
    damageBuilding:   damageBuilding,
    getBuildingsCleared: function () { return buildingsCleared; },
    getTotalBuildings:   function () { return TOTAL_BUILDINGS; },
    isSniperActive:      function () { return sniperActive; },
    isInsideBuilding:    function () { return insideBuilding; },
    getCurrentFloor:     function () { return currentFloor; },
    isActive:            function () { return active; }
  };
})();
