/* ════════════════════════════════════════════════════════════════════
 *  ENEMY TANK DESTROYER  (enemy-tank-destroyer.js)
 *  ─────────────────────────────────────────────────────────────────
 *  Tracked anti-tank vehicle enemy for the FPS game.
 *  AI states: PATROL → HUNT → AIM → FIRE → RELOCATE
 *  Features: HEAT shell, smoke dischargers, ammo cook-off, anti-drone MG,
 *            wreck state, up to 2 concurrent instances.
 *
 *  Public API:
 *    EnemyTankDestroyer.init(scene)
 *    EnemyTankDestroyer.update(delta)
 *    EnemyTankDestroyer.spawn(scene, x, y, z)
 *    EnemyTankDestroyer.getAll()
 *    EnemyTankDestroyer.reset()
 * ═════════════════════════════════════════════════════════════════ */
window.EnemyTankDestroyer = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────── */
  var MAX_TDS          = 2;
  var TD_HP            = 600;
  var PATROL_SPEED     = 3;    // m/s
  var HUNT_SPEED       = 5;    // m/s
  var HUNT_RANGE       = 40;   // metres — triggers HUNT
  var AIM_DURATION     = 2.5;  // seconds to aim before firing
  var FIRE_SPEED       = 80;   // m/s HEAT shell
  var FIRE_DAMAGE      = 200;  // damage on direct hit
  var FIRE_SPLASH_R    = 3.5;  // splash radius
  var FIRE_SPLASH_DMG  = 80;   // max splash damage
  var RELOAD_TIME      = 3.0;  // seconds between shots
  var RELOCATE_SHOTS   = 2;    // shots before relocating
  var SMOKE_DMG_THRESH = 200;  // damage taken to trigger smoke
  var SMOKE_DURATION   = 8.0;  // seconds of smoke concealment
  var SMOKE_COUNT      = 6;    // expanding spheres
  var AMMO_EXPL_RANGE  = 15;   // secondary ammo cook-off radius
  var AMMO_EXPL_DMG    = 300;  // ammo cook-off damage
  var ANTI_DRONE_RANGE = 15;   // metres to engage drones
  var MG_RAYS          = 6;    // hitscan rays per burst

  /* ── Module state ───────────────────────────────────────────── */
  var _scene           = null;
  var _tankDestroyers  = [];   // active TD objects
  var _shells          = [];   // active HEAT shells in flight
  var _waypoints       = [];   // patrol waypoints (generated lazily)

  /* ── States ─────────────────────────────────────────────────── */
  var STATE_PATROL    = 'PATROL';
  var STATE_HUNT      = 'HUNT';
  var STATE_AIM       = 'AIM';
  var STATE_FIRE      = 'FIRE';
  var STATE_RELOCATE  = 'RELOCATE';

  /* ── Helpers ────────────────────────────────────────────────── */
  function _groundY(x, z) {
    if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTopSolidY) {
      return VoxelWorld.getTopSolidY(x, z);
    }
    return 0;
  }

  function _getPlayer() {
    return (window.GameManager && window.GameManager.getPlayer)
      ? window.GameManager.getPlayer()
      : null;
  }

  function _distXZ(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _randomWaypoint(cx, cz, radius) {
    var angle = Math.random() * Math.PI * 2;
    var r     = 10 + Math.random() * radius;
    return {
      x: cx + Math.cos(angle) * r,
      z: cz + Math.sin(angle) * r
    };
  }

  /* ── Build tank destroyer mesh ──────────────────────────────── */
  function _buildTDMesh() {
    var root  = new THREE.Group();

    /* Hull */
    var hullGeo = new THREE.BoxGeometry(4.5, 0.9, 2.2);
    var hullMat = new THREE.MeshLambertMaterial({ color: 0x2e3a1f }); // dark olive
    var hull    = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 0.45;
    hull.castShadow = true;
    root.add(hull);

    /* Superstructure (angled front face via slight X rotation) */
    var superGeo = new THREE.BoxGeometry(3.0, 0.8, 1.8);
    var superMat = new THREE.MeshLambertMaterial({ color: 0x3a3a28 }); // dark grey
    var superStr = new THREE.Mesh(superGeo, superMat);
    superStr.position.set(0.1, 1.25, 0);
    superStr.rotation.x = 0.08; // slight angled front
    superStr.castShadow = true;
    root.add(superStr);

    /* Long AT gun — CylinderGeometry, pointing forward (along +Z) */
    var barrelGeo = new THREE.CylinderGeometry(0.1, 0.12, 4.0, 8);
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var barrel    = new THREE.Mesh(barrelGeo, barrelMat);
    /* Rotate so cylinder axis points forward: default Y-axis → Z-axis */
    barrel.rotation.x = Math.PI / 2;
    /* Slight elevation */
    barrel.rotation.z = -0.06;
    barrel.position.set(0, 1.45, 2.8); // barrel tip extends forward
    root.add(barrel);

    /* Track sides — left and right flat boxes + road wheels */
    var trackOffsets = [-1.2, 1.2]; // z offsets
    for (var t = 0; t < 2; t++) {
      /* Track body */
      var trackGeo = new THREE.BoxGeometry(4.5, 0.3, 0.1);
      var trackMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
      var track    = new THREE.Mesh(trackGeo, trackMat);
      track.position.set(0, 0.15, trackOffsets[t]);
      root.add(track);

      /* 5 road wheels per side */
      for (var w = 0; w < 5; w++) {
        var wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.18, 8);
        var wheelMat = new THREE.MeshLambertMaterial({ color: 0x1c1c1c });
        var wheel    = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(-1.8 + w * 0.9, 0.28, trackOffsets[t]);
        root.add(wheel);
      }
    }

    /* Smoke dischargers — 2 tiny cylinders on superstructure sides */
    var dischOffsets = [-0.75, 0.75];
    for (var d = 0; d < 2; d++) {
      var dischGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.28, 6);
      var dischMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
      var disch    = new THREE.Mesh(dischGeo, dischMat);
      disch.position.set(0.9, 1.5, dischOffsets[d]);
      disch.rotation.z = Math.PI / 4;
      root.add(disch);
    }

    /* Barrel reference for aiming animation */
    root._barrel     = barrel;
    root._superStr   = superStr;

    return root;
  }

  /* ── Smoke discharger effect ────────────────────────────────── */
  function _fireSmoke(td) {
    if (td.smokeFired) return;
    td.smokeFired  = true;
    td.smokeTimer  = SMOKE_DURATION;
    td.smokeMeshes = [];

    for (var i = 0; i < SMOKE_COUNT; i++) {
      var angle  = (i / SMOKE_COUNT) * Math.PI * 2;
      var radius = 1.5 + Math.random() * 1.0;
      var sGeo   = new THREE.SphereGeometry(0.5, 6, 6);
      var sMat   = new THREE.MeshBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.75,
        depthWrite: false
      });
      var sphere = new THREE.Mesh(sGeo, sMat);
      sphere.position.set(
        td.mesh.position.x + Math.cos(angle) * radius,
        td.mesh.position.y + 1.0 + Math.random() * 0.5,
        td.mesh.position.z + Math.sin(angle) * radius
      );
      sphere._expandSpeed = 0.6 + Math.random() * 0.4;
      sphere._maxRadius   = 2.0;
      _scene.add(sphere);
      td.smokeMeshes.push(sphere);
    }

    try {
      if (typeof AudioSystem !== 'undefined' && AudioSystem.playSmoke) AudioSystem.playSmoke();
    } catch (e) {}
  }

  /* ── Spawn HEAT shell ───────────────────────────────────────── */
  function _spawnShell(td) {
    var player = _getPlayer();
    if (!player || !player.position) return;

    var origin = new THREE.Vector3(
      td.mesh.position.x,
      td.mesh.position.y + 1.45,
      td.mesh.position.z + 2.8
    );
    /* Direction toward player with slight vertical lead */
    var dir = new THREE.Vector3(
      player.position.x - origin.x,
      player.position.y + 1.0 - origin.y,
      player.position.z - origin.z
    ).normalize();

    var sGeo  = new THREE.SphereGeometry(0.14, 6, 6);
    var sMat  = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    var mesh  = new THREE.Mesh(sGeo, sMat);
    mesh.position.copy(origin);
    _scene.add(mesh);

    /* Muzzle flash PointLight */
    var flash = new THREE.PointLight(0xff6600, 3, 8);
    flash.position.copy(origin);
    _scene.add(flash);

    _shells.push({
      mesh:    mesh,
      flash:   flash,
      vel:     dir.clone().multiplyScalar(FIRE_SPEED),
      life:    0,
      maxLife: 3.5,
      ownerId: td.id,
    });

    try {
      if (typeof AudioSystem !== 'undefined' && AudioSystem.playTankCannon) AudioSystem.playTankCannon();
    } catch (e) {}

    /* Muzzle flash timer */
    var flashTimer = 0.08;
    td._flashRef   = { light: flash, timer: flashTimer };
  }

  /* ── Shell impact / detonation ──────────────────────────────── */
  function _detonateShell(shell) {
    var pos = shell.mesh.position;

    /* Damage player */
    try {
      var player = _getPlayer();
      if (player && player.position && !player.godMode) {
        var dx = player.position.x - pos.x;
        var dy = player.position.y - pos.y;
        var dz = player.position.z - pos.z;
        var d  = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < 0.8) {
          /* Direct hit */
          player.hp = Math.max(0, (player.hp || 100) - FIRE_DAMAGE);
          if (typeof HUD !== 'undefined' && HUD.setHealth) HUD.setHealth(player.hp, player.maxHp || 100);
          if (typeof HUD !== 'undefined' && HUD.showDamageFlash) HUD.showDamageFlash(0xff6600, 0.6);
        } else if (d < FIRE_SPLASH_R) {
          var falloff = 1 - (d / FIRE_SPLASH_R);
          var splashDmg = Math.floor(FIRE_SPLASH_DMG * falloff);
          player.hp = Math.max(0, (player.hp || 100) - splashDmg);
          if (typeof HUD !== 'undefined' && HUD.setHealth) HUD.setHealth(player.hp, player.maxHp || 100);
          if (typeof HUD !== 'undefined' && HUD.showDamageFlash) HUD.showDamageFlash(0xff6600, 0.4);
        }
      }
    } catch (e) {}

    /* Damage other enemies in splash */
    try {
      if (window.Enemies && window.Enemies.damageInRadius) {
        window.Enemies.damageInRadius(pos, FIRE_SPLASH_R, FIRE_SPLASH_DMG);
      }
    } catch (e) {}

    /* Explosion flash */
    var eFl = new THREE.PointLight(0xff8800, 5, 12);
    eFl.position.copy(pos);
    _scene.add(eFl);

    var eGeo = new THREE.SphereGeometry(1.0, 8, 8);
    var eMat = new THREE.MeshBasicMaterial({
      color: 0xff8800, transparent: true, opacity: 0.85, depthWrite: false
    });
    var eMesh = new THREE.Mesh(eGeo, eMat);
    eMesh.position.copy(pos);
    _scene.add(eMesh);

    /* Fade out after 0.5 s */
    var fadeObj = { mesh: eMesh, light: eFl, life: 0, maxLife: 0.5 };
    _fadeObjects.push(fadeObj);

    /* Screen shake */
    try {
      if (typeof Feedback !== 'undefined' && Feedback.screenShake) Feedback.screenShake(0.8);
    } catch (e) {}

    try {
      if (typeof AudioSystem !== 'undefined' && AudioSystem.playExplosion) AudioSystem.playExplosion();
    } catch (e) {}

    _scene.remove(shell.mesh);
    _scene.remove(shell.flash);
  }

  /* Temporary fade objects store */
  var _fadeObjects = [];

  /* ── Death explosion — multi-stage ────────────────────────────── */
  function _doDeathExplosion(td) {
    var pos = td.mesh.position.clone();

    /* Stage 1 — hull fire */
    var hullLight = new THREE.PointLight(0xff5500, 4, 14);
    hullLight.position.copy(pos);
    hullLight.position.y += 1.0;
    _scene.add(hullLight);

    var hullFlashGeo = new THREE.SphereGeometry(1.5, 8, 8);
    var hullFlashMat = new THREE.MeshBasicMaterial({
      color: 0xff5500, transparent: true, opacity: 0.8, depthWrite: false
    });
    var hullFlash = new THREE.Mesh(hullFlashGeo, hullFlashMat);
    hullFlash.position.copy(pos);
    hullFlash.position.y += 1.0;
    _scene.add(hullFlash);

    _fadeObjects.push({ mesh: hullFlash, light: hullLight, life: 0, maxLife: 1.5 });

    /* Barrel flies off as separate mesh */
    var flyBarrelGeo = new THREE.CylinderGeometry(0.1, 0.12, 4.0, 8);
    var flyBarrelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var flyBarrel    = new THREE.Mesh(flyBarrelGeo, flyBarrelMat);
    flyBarrel.position.copy(pos);
    flyBarrel.position.y += 1.5;
    flyBarrel.rotation.x = Math.PI / 2;
    _scene.add(flyBarrel);
    var flyVel = new THREE.Vector3(
      (Math.random() - 0.5) * 6,
      5 + Math.random() * 5,
      (Math.random() - 0.5) * 6
    );
    td._flyBarrel    = flyBarrel;
    td._flyBarrelVel = flyVel;

    /* Stage 2 — ammo cook-off (1.5s delay) */
    setTimeout(function () {
      if (!_scene) return;
      /* Huge secondary blast */
      var bigLight = new THREE.PointLight(0xffcc00, 8, 25);
      bigLight.position.copy(pos);
      bigLight.position.y += 2.0;
      _scene.add(bigLight);

      var bigGeo = new THREE.SphereGeometry(3.5, 10, 10);
      var bigMat = new THREE.MeshBasicMaterial({
        color: 0xffcc00, transparent: true, opacity: 0.95, depthWrite: false
      });
      var bigBlast = new THREE.Mesh(bigGeo, bigMat);
      bigBlast.position.copy(pos);
      bigBlast.position.y += 2.0;
      _scene.add(bigBlast);
      _fadeObjects.push({ mesh: bigBlast, light: bigLight, life: 0, maxLife: 0.9 });

      /* 150 flying debris particles */
      for (var p = 0; p < 150; p++) {
        var pGeo = new THREE.BoxGeometry(
          0.06 + Math.random() * 0.14,
          0.06 + Math.random() * 0.14,
          0.06 + Math.random() * 0.14
        );
        var pMat  = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.copy(pos);
        var pVel = new THREE.Vector3(
          (Math.random() - 0.5) * 16,
          3 + Math.random() * 12,
          (Math.random() - 0.5) * 16
        );
        _scene.add(pMesh);
        _debrisObjects.push({ mesh: pMesh, vel: pVel, life: 0, maxLife: 2.0 + Math.random() * 1.5 });
      }

      /* Damage player in ammo cook-off radius */
      try {
        var player = _getPlayer();
        if (player && player.position && !player.godMode) {
          var dx2 = player.position.x - pos.x;
          var dz2 = player.position.z - pos.z;
          var d2  = Math.sqrt(dx2 * dx2 + dz2 * dz2);
          if (d2 < AMMO_EXPL_RANGE) {
            var falloff2 = 1 - (d2 / AMMO_EXPL_RANGE);
            var cookDmg  = Math.floor(AMMO_EXPL_DMG * falloff2);
            player.hp = Math.max(0, (player.hp || 100) - cookDmg);
            if (typeof HUD !== 'undefined' && HUD.setHealth) HUD.setHealth(player.hp, player.maxHp || 100);
            if (typeof HUD !== 'undefined' && HUD.showDamageFlash) HUD.showDamageFlash(0xff8800, 0.8);
          }
        }
      } catch (e) {}

      /* Damage enemies in cook-off radius */
      try {
        if (window.Enemies && window.Enemies.damageInRadius) {
          window.Enemies.damageInRadius(pos, AMMO_EXPL_RANGE, AMMO_EXPL_DMG);
        }
      } catch (e) {}

      try {
        if (typeof Feedback !== 'undefined' && Feedback.screenShake) Feedback.screenShake(1.6);
      } catch (e) {}
      try {
        if (typeof AudioSystem !== 'undefined' && AudioSystem.playExplosion) AudioSystem.playExplosion();
      } catch (e) {}
    }, 1500);
  }

  /* Debris physics store */
  var _debrisObjects = [];

  /* ── Spawn wreck in place of dead tank ────────────────────────── */
  function _spawnWreck(td) {
    /* Reuse VehicleWreck if available; otherwise build a minimal burnt hull */
    if (typeof window.VehicleWreck !== 'undefined' && window.VehicleWreck.spawn) {
      try {
        window.VehicleWreck.spawn(
          _scene,
          td.mesh.position.x,
          td.mesh.position.y,
          td.mesh.position.z
        );
        return;
      } catch (e) {}
    }
    /* Fallback burnt hull */
    var wGeo = new THREE.BoxGeometry(4.5, 0.7, 2.2);
    var wMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var wreck = new THREE.Mesh(wGeo, wMat);
    wreck.position.copy(td.mesh.position);
    wreck.position.y += 0.35;
    _scene.add(wreck);

    /* Persistent smoke from wreck */
    var smokeLight = new THREE.PointLight(0xff3300, 1.5, 8);
    smokeLight.position.copy(wreck.position);
    smokeLight.position.y += 1.5;
    _scene.add(smokeLight);
    /* Fade smoke light after 8 s */
    _fadeObjects.push({ mesh: null, light: smokeLight, life: 0, maxLife: 8.0 });
  }

  /* ── Anti-drone MG burst ────────────────────────────────────── */
  function _fireMGBurst(td, target) {
    for (var r = 0; r < MG_RAYS; r++) {
      var spread = (Math.random() - 0.5) * (5 * Math.PI / 180);
      var dir    = new THREE.Vector3(
        target.position.x - td.mesh.position.x,
        target.position.y - td.mesh.position.y,
        target.position.z - td.mesh.position.z
      ).normalize();
      /* Apply spread */
      dir.x += (Math.random() - 0.5) * Math.tan(spread);
      dir.y += (Math.random() - 0.5) * Math.tan(spread);
      dir.normalize();

      /* Hitscan — check distance */
      var dist = td.mesh.position.distanceTo(target.position);
      if (dist < ANTI_DRONE_RANGE) {
        var hitChance = 1.0 - (dist / ANTI_DRONE_RANGE);
        if (Math.random() < hitChance * 0.55) {
          /* Hit the drone */
          try {
            if (target._takeDamage) target._takeDamage(18);
            else if (target.hp !== undefined) target.hp -= 18;
          } catch (e) {}
        }
      }
    }
    /* MG muzzle flash */
    var mgFlash = new THREE.PointLight(0xffffff, 2, 5);
    mgFlash.position.copy(td.mesh.position);
    mgFlash.position.y += 1.4;
    _scene.add(mgFlash);
    _fadeObjects.push({ mesh: null, light: mgFlash, life: 0, maxLife: 0.06 });

    try {
      if (typeof AudioSystem !== 'undefined' && AudioSystem.playGunshot) AudioSystem.playGunshot();
    } catch (e) {}
  }

  /* ── Check for drones to engage ─────────────────────────────── */
  function _checkAntiDrone(td) {
    /* Check FPVKamikaze system */
    if (window.FPVKamikaze && window.FPVKamikaze.getAll) {
      try {
        var drones = window.FPVKamikaze.getAll();
        for (var i = 0; i < drones.length; i++) {
          var dr = drones[i];
          if (!dr || !dr.mesh) continue;
          var dist = td.mesh.position.distanceTo(dr.mesh.position);
          if (dist < ANTI_DRONE_RANGE) {
            _fireMGBurst(td, dr);
          }
        }
      } catch (e) {}
    }

    /* Check DroneSystem enemy drones */
    if (window.DroneSystem && window.DroneSystem.getEnemyDrones) {
      try {
        var eDrones = window.DroneSystem.getEnemyDrones();
        for (var j = 0; j < eDrones.length; j++) {
          var ed = eDrones[j];
          if (!ed || !ed.mesh) continue;
          var edDist = td.mesh.position.distanceTo(ed.mesh.position);
          if (edDist < ANTI_DRONE_RANGE) {
            _fireMGBurst(td, ed);
          }
        }
      } catch (e) {}
    }
  }

  /* ── Patrol waypoint logic ──────────────────────────────────── */
  function _nextPatrolWaypoint(td) {
    td.patrolTarget = _randomWaypoint(td.originX, td.originZ, 20);
  }

  /* ── Main init ──────────────────────────────────────────────── */
  function init(scene) {
    _scene = scene || (window.GameManager && window.GameManager.getScene && window.GameManager.getScene());
    _tankDestroyers.length = 0;
    _shells.length         = 0;
    _fadeObjects.length    = 0;
    _debrisObjects.length  = 0;
  }

  /* ── Spawn a tank destroyer ─────────────────────────────────── */
  function spawn(scene, x, y, z) {
    if (!scene && _scene) scene = _scene;
    if (!scene) return null;
    _scene = scene;

    if (_tankDestroyers.length >= MAX_TDS) return null;

    var groundY = (typeof y === 'number') ? y : _groundY(x, z);
    var mesh    = _buildTDMesh();
    mesh.position.set(x, groundY, z);
    scene.add(mesh);

    /* HP bar (canvas texture above tank) */
    var hpCanvas  = document.createElement('canvas');
    hpCanvas.width  = 256;
    hpCanvas.height = 32;
    var hpTex = new THREE.CanvasTexture(hpCanvas);
    hpTex._canvas = hpCanvas;
    hpTex._ctx    = hpCanvas.getContext('2d');
    var hpGeo  = new THREE.PlaneGeometry(3.0, 0.35);
    var hpMat  = new THREE.MeshBasicMaterial({ map: hpTex, transparent: true, depthWrite: false });
    var hpBar  = new THREE.Mesh(hpGeo, hpMat);
    hpBar.rotation.x = -Math.PI / 2;
    hpBar.position.set(0, 3.2, 0);
    mesh.add(hpBar);
    hpTex._updateFn = function (hp, maxHp) {
      var ctx = hpTex._ctx;
      ctx.clearRect(0, 0, 256, 32);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, 256, 32);
      var pct = Math.max(0, hp / maxHp);
      var r   = Math.floor((1 - pct) * 220);
      var g   = Math.floor(pct * 180);
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',0)';
      ctx.fillRect(2, 2, Math.floor(252 * pct), 28);
      hpTex.needsUpdate = true;
    };
    hpTex._updateFn(TD_HP, TD_HP);

    var td = {
      id:            _tankDestroyers.length,
      mesh:          mesh,
      hp:            TD_HP,
      maxHp:         TD_HP,
      hpTex:         hpTex,
      alive:         true,
      state:         STATE_PATROL,
      originX:       x,
      originZ:       z,
      patrolTarget:  _randomWaypoint(x, z, 20),
      stateTimer:    0,
      reloadTimer:   0,
      shotsFired:    0,
      damageTaken:   0,
      smokeFired:    false,
      smokeTimer:    0,
      smokeMeshes:   [],
      antiDroneCD:   0,
      _flashRef:     null,
      _flyBarrel:    null,
      _flyBarrelVel: null,
    };

    _tankDestroyers.push(td);
    return td;
  }

  /* ── rotate mesh to face direction ─────────────────────────── */
  function _faceDir(mesh, dx, dz) {
    if (Math.abs(dx) < 0.001 && Math.abs(dz) < 0.001) return;
    mesh.rotation.y = Math.atan2(dx, dz);
  }

  /* ── Per-tank update ────────────────────────────────────────── */
  function _updateTD(td, delta) {
    if (!td.alive) {
      /* Update flying barrel */
      if (td._flyBarrel && td._flyBarrelVel) {
        td._flyBarrel.position.addScaledVector(td._flyBarrelVel, delta);
        td._flyBarrelVel.y -= 9.8 * delta;
        if (td._flyBarrel.position.y < _groundY(td._flyBarrel.position.x, td._flyBarrel.position.z)) {
          _scene.remove(td._flyBarrel);
          td._flyBarrel    = null;
          td._flyBarrelVel = null;
        }
      }
      return;
    }

    var player = _getPlayer();
    var px, pz, dist;
    if (player && player.position) {
      px   = player.position.x;
      pz   = player.position.z;
      dist = _distXZ(td.mesh.position.x, td.mesh.position.z, px, pz);
    } else {
      px = td.mesh.position.x;
      pz = td.mesh.position.z;
      dist = Infinity;
    }

    /* Muzzle flash cleanup */
    if (td._flashRef) {
      td._flashRef.timer -= delta;
      if (td._flashRef.timer <= 0) {
        _scene.remove(td._flashRef.light);
        td._flashRef = null;
      }
    }

    /* Smoke timer */
    if (td.smokeFired && td.smokeTimer > 0) {
      td.smokeTimer -= delta;
      /* Expand smoke spheres */
      for (var s = 0; s < td.smokeMeshes.length; s++) {
        var sm = td.smokeMeshes[s];
        if (!sm) continue;
        var targetR = sm._maxRadius;
        sm.scale.setScalar(Math.min(sm.scale.x + sm._expandSpeed * delta, targetR));
        sm.material.opacity = Math.max(0, 0.75 * (td.smokeTimer / SMOKE_DURATION));
        /* Drift upward slightly */
        sm.position.y += 0.15 * delta;
      }
      if (td.smokeTimer <= 0) {
        /* Remove smoke meshes */
        for (var sc = 0; sc < td.smokeMeshes.length; sc++) {
          if (td.smokeMeshes[sc]) _scene.remove(td.smokeMeshes[sc]);
        }
        td.smokeMeshes = [];
        td.smokeFired  = false;
      }
    }

    /* Reload cooldown */
    if (td.reloadTimer > 0) td.reloadTimer -= delta;

    /* Anti-drone cooldown + check */
    td.antiDroneCD -= delta;
    if (td.antiDroneCD <= 0) {
      _checkAntiDrone(td);
      td.antiDroneCD = 0.5;
    }

    /* ── State machine ── */
    switch (td.state) {

      case STATE_PATROL:
        /* Move toward patrol target */
        if (td.patrolTarget) {
          var pdx = td.patrolTarget.x - td.mesh.position.x;
          var pdz = td.patrolTarget.z - td.mesh.position.z;
          var pdist = Math.sqrt(pdx * pdx + pdz * pdz);
          if (pdist < 1.5) {
            _nextPatrolWaypoint(td);
          } else {
            _faceDir(td.mesh, pdx, pdz);
            td.mesh.position.x += (pdx / pdist) * PATROL_SPEED * delta;
            td.mesh.position.z += (pdz / pdist) * PATROL_SPEED * delta;
            td.mesh.position.y  = _groundY(td.mesh.position.x, td.mesh.position.z);
          }
        }
        /* Check for player in range */
        if (dist <= HUNT_RANGE) {
          td.state = STATE_HUNT;
          try {
            if (typeof AudioSystem !== 'undefined' && AudioSystem.playEnemyAlert) AudioSystem.playEnemyAlert();
          } catch (e) {}
        }
        break;

      case STATE_HUNT:
        if (dist > HUNT_RANGE + 5) {
          td.state = STATE_PATROL;
          _nextPatrolWaypoint(td);
          break;
        }
        if (dist > 8) {
          /* Move toward player */
          var hdx = px - td.mesh.position.x;
          var hdz = pz - td.mesh.position.z;
          var hdist = Math.sqrt(hdx * hdx + hdz * hdz);
          _faceDir(td.mesh, hdx, hdz);
          td.mesh.position.x += (hdx / hdist) * HUNT_SPEED * delta;
          td.mesh.position.z += (hdz / hdist) * HUNT_SPEED * delta;
          td.mesh.position.y  = _groundY(td.mesh.position.x, td.mesh.position.z);
        }
        /* Transition to AIM when close enough */
        if (dist <= HUNT_RANGE) {
          td.state = STATE_AIM;
          td.stateTimer = AIM_DURATION;
          _faceDir(td.mesh, px - td.mesh.position.x, pz - td.mesh.position.z);
        }
        break;

      case STATE_AIM:
        td.stateTimer -= delta;
        /* Animate barrel elevation/traverse */
        if (td.mesh._barrel) {
          var targetElevation = -0.06 + Math.sin(td.stateTimer * 1.5) * 0.04;
          td.mesh._barrel.rotation.z = targetElevation;
        }
        /* Face player while aiming */
        _faceDir(td.mesh, px - td.mesh.position.x, pz - td.mesh.position.z);
        if (td.stateTimer <= 0 && td.reloadTimer <= 0) {
          td.state = STATE_FIRE;
        }
        break;

      case STATE_FIRE:
        if (td.reloadTimer <= 0) {
          _spawnShell(td);
          td.reloadTimer = RELOAD_TIME;
          td.shotsFired++;
          if (td.shotsFired >= RELOCATE_SHOTS) {
            td.shotsFired = 0;
            td.state = STATE_RELOCATE;
            td.patrolTarget = _randomWaypoint(td.originX, td.originZ, 25);
          } else {
            td.state = STATE_AIM;
            td.stateTimer = AIM_DURATION;
          }
        }
        break;

      case STATE_RELOCATE:
        if (td.patrolTarget) {
          var rdx = td.patrolTarget.x - td.mesh.position.x;
          var rdz = td.patrolTarget.z - td.mesh.position.z;
          var rdist = Math.sqrt(rdx * rdx + rdz * rdz);
          if (rdist < 2.0) {
            td.state = STATE_PATROL;
            _nextPatrolWaypoint(td);
          } else {
            _faceDir(td.mesh, rdx, rdz);
            td.mesh.position.x += (rdx / rdist) * HUNT_SPEED * delta;
            td.mesh.position.z += (rdz / rdist) * HUNT_SPEED * delta;
            td.mesh.position.y  = _groundY(td.mesh.position.x, td.mesh.position.z);
          }
        } else {
          td.state = STATE_PATROL;
        }
        break;
    }

    /* Update HP bar */
    if (td.hpTex && td.hpTex._updateFn) {
      td.hpTex._updateFn(td.hp, td.maxHp);
    }
  }

  /* ── Damage a TD (called externally) ─────────────────────────── */
  function _applyDamage(td, amount) {
    if (!td.alive) return;
    td.hp          -= amount;
    td.damageTaken += amount;

    /* Smoke discharger trigger */
    if (!td.smokeFired && td.damageTaken >= SMOKE_DMG_THRESH) {
      _fireSmoke(td);
    }

    /* Death */
    if (td.hp <= 0) {
      td.alive = false;
      _doDeathExplosion(td);
      _spawnWreck(td);
      _scene.remove(td.mesh);

      /* Score / kill events */
      try {
        if (typeof window.GameManager !== 'undefined' && window.GameManager.addKill) {
          window.GameManager.addKill('tank_destroyer', 500);
        }
      } catch (e) {}
      try {
        if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
          HUD.notifyPickup('TANK DESTROYER DESTROYED! +500', '#ff8800');
        }
      } catch (e) {}
    }
  }

  /* ── Shell collision with TDs (self-damage disabled) ──────────── */
  /* (shells from other TDs could theoretically hit — skipped for simplicity) */

  /* ── Expose damage function for game integration ──────────────── */
  function _hitTest(td, shellPos) {
    if (!td.alive || !td.mesh) return false;
    return shellPos.distanceTo(td.mesh.position) < 3.0;
  }

  /* ── Main update ────────────────────────────────────────────── */
  function update(delta) {
    if (!_scene) {
      if (window.GameManager && window.GameManager.getScene) {
        var s = window.GameManager.getScene();
        if (s) _scene = s;
      }
      if (!_scene) return;
    }

    /* Update tank destroyers */
    for (var i = 0; i < _tankDestroyers.length; i++) {
      _updateTD(_tankDestroyers[i], delta);
    }

    /* Update HEAT shells */
    for (var si = _shells.length - 1; si >= 0; si--) {
      var sh = _shells[si];
      sh.mesh.position.addScaledVector(sh.vel, delta);
      /* Gravity on HEAT shell (very slight — fast shell) */
      sh.vel.y -= 2.0 * delta;
      sh.life  += delta;

      /* Remove flash quickly */
      if (sh.flash) {
        sh.flash.intensity -= delta * 30;
        if (sh.flash.intensity <= 0) {
          _scene.remove(sh.flash);
          sh.flash = null;
        }
      }

      var shellPos = sh.mesh.position;
      var hit      = false;

      /* Hit player */
      var player = _getPlayer();
      if (player && player.position) {
        if (shellPos.distanceTo(player.position) < 0.9) {
          _detonateShell(sh);
          hit = true;
        }
      }

      /* Hit ground */
      if (!hit) {
        var gy = _groundY(shellPos.x, shellPos.z);
        if (shellPos.y <= gy + 0.2) {
          _detonateShell(sh);
          hit = true;
        }
      }

      /* Time out */
      if (!hit && sh.life >= sh.maxLife) {
        _scene.remove(sh.mesh);
        if (sh.flash) _scene.remove(sh.flash);
        hit = true;
      }

      if (hit) _shells.splice(si, 1);
    }

    /* Update fade objects (explosions, lights) */
    for (var fi = _fadeObjects.length - 1; fi >= 0; fi--) {
      var fo = _fadeObjects[fi];
      fo.life += delta;
      var k = fo.life / fo.maxLife;
      if (fo.mesh) {
        fo.mesh.scale.setScalar(1 + k * 1.2);
        fo.mesh.material.opacity = Math.max(0, fo.mesh.material.opacity * (1 - delta * 3.5));
      }
      if (fo.light) {
        fo.light.intensity = Math.max(0, fo.light.intensity * (1 - delta * 3.0));
      }
      if (k >= 1) {
        if (fo.mesh)  _scene.remove(fo.mesh);
        if (fo.light) _scene.remove(fo.light);
        _fadeObjects.splice(fi, 1);
      }
    }

    /* Update debris particles */
    for (var di = _debrisObjects.length - 1; di >= 0; di--) {
      var db = _debrisObjects[di];
      db.life += delta;
      db.vel.y -= 9.8 * delta;
      db.mesh.position.addScaledVector(db.vel, delta);
      db.mesh.rotation.x += delta * 3;
      db.mesh.rotation.z += delta * 2;
      var gy2 = _groundY(db.mesh.position.x, db.mesh.position.z);
      if (db.mesh.position.y < gy2 || db.life >= db.maxLife) {
        _scene.remove(db.mesh);
        _debrisObjects.splice(di, 1);
      }
    }
  }

  /* ── Public API helpers ─────────────────────────────────────── */
  function getAll() {
    return _tankDestroyers;
  }

  function reset() {
    /* Clear all active meshes */
    for (var i = 0; i < _tankDestroyers.length; i++) {
      var td = _tankDestroyers[i];
      if (td.mesh) try { _scene && _scene.remove(td.mesh); } catch (e) {}
      if (td._flyBarrel) try { _scene && _scene.remove(td._flyBarrel); } catch (e) {}
      for (var s = 0; s < td.smokeMeshes.length; s++) {
        if (td.smokeMeshes[s]) try { _scene && _scene.remove(td.smokeMeshes[s]); } catch (e) {}
      }
    }
    for (var si = 0; si < _shells.length; si++) {
      if (_shells[si].mesh)  try { _scene && _scene.remove(_shells[si].mesh); } catch (e) {}
      if (_shells[si].flash) try { _scene && _scene.remove(_shells[si].flash); } catch (e) {}
    }
    for (var fi = 0; fi < _fadeObjects.length; fi++) {
      var fo = _fadeObjects[fi];
      if (fo.mesh)  try { _scene && _scene.remove(fo.mesh); } catch (e) {}
      if (fo.light) try { _scene && _scene.remove(fo.light); } catch (e) {}
    }
    for (var di = 0; di < _debrisObjects.length; di++) {
      if (_debrisObjects[di].mesh) try { _scene && _scene.remove(_debrisObjects[di].mesh); } catch (e) {}
    }
    _tankDestroyers.length = 0;
    _shells.length         = 0;
    _fadeObjects.length    = 0;
    _debrisObjects.length  = 0;
  }

  /* ── Expose damage API so player bullets can hit TDs ─────────── */
  /* Called by the main game's bullet hit detection */
  function damage(tdOrId, amount) {
    var td;
    if (typeof tdOrId === 'number') {
      for (var i = 0; i < _tankDestroyers.length; i++) {
        if (_tankDestroyers[i].id === tdOrId) { td = _tankDestroyers[i]; break; }
      }
    } else {
      td = tdOrId;
    }
    if (td) _applyDamage(td, amount);
  }

  /* ── damageInRadius — for artillery / explosions ───────────── */
  function damageInRadius(pos, radius, amount) {
    for (var i = 0; i < _tankDestroyers.length; i++) {
      var td = _tankDestroyers[i];
      if (!td.alive || !td.mesh) continue;
      var d = pos.distanceTo(td.mesh.position);
      if (d < radius) {
        var falloff = 1 - (d / radius);
        _applyDamage(td, Math.floor(amount * falloff));
      }
    }
  }

  /* ── Return public API ──────────────────────────────────────── */
  return {
    init:           init,
    update:         update,
    spawn:          spawn,
    getAll:         getAll,
    reset:          reset,
    damage:         damage,
    damageInRadius: damageInRadius,
  };

})();
