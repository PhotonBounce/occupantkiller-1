/*  vehicle-enemies.js
 *  Enemy armored vehicles (BTR, Truck) that drive at the player.
 *  Exposed as window.VehicleEnemies
 */
window.VehicleEnemies = (function () {

  /* ── Constants ─────────────────────────────────────────────────────── */
  var MAX_VEHICLES = 3;
  var BTR_HP       = 400;
  var TRUCK_HP     = 120;
  var BTR_SPEED    = 5;
  var TRUCK_SPEED  = 7;
  var SEP_RADIUS   = 4;   // separation push distance
  var CIRCLE_DIST  = 6;   // orbit at this range
  var SMOKE_HP_PCT = 0.5; // smoke starts below 50 % hp

  /* ── Module state ──────────────────────────────────────────────────── */
  var _scene      = null;
  var _vehicles   = [];   // array of vehicle objects
  var _clock      = null; // reuse THREE clock concept via delta accumulation

  /* ── HP-bar canvas helper ───────────────────────────────────────────── */
  function _makeHpBar(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width  = width  || 256;
    canvas.height = height || 32;
    var tex = new THREE.CanvasTexture(canvas);
    tex._canvas = canvas;
    tex._ctx    = canvas.getContext('2d');
    return tex;
  }

  function _updateHpBar(tex, hp, maxHp) {
    var ctx = tex._ctx;
    var w   = tex._canvas.width;
    var h   = tex._canvas.height;
    ctx.clearRect(0, 0, w, h);
    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, w, h);
    // HP fill
    var pct = Math.max(0, hp / maxHp);
    var r = Math.floor((1 - pct) * 220);
    var g = Math.floor(pct * 200);
    ctx.fillStyle = 'rgb(' + r + ',' + g + ',0)';
    ctx.fillRect(2, 2, Math.floor((w - 4) * pct), h - 4);
    tex.needsUpdate = true;
  }

  /* ── Build BTR mesh ─────────────────────────────────────────────────── */
  function _buildBTR() {
    var group = new THREE.Group();

    // Main hull
    var hullGeo  = new THREE.BoxGeometry(2.8, 1.4, 1.4);
    var metalMat = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
    var hull     = new THREE.Mesh(hullGeo, metalMat);
    hull.position.y = 0.7;
    hull.castShadow = true;
    group.add(hull);

    // Wheels (4 corners)
    var wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.6, 8);
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var wheelOffsets = [
      [ 1.1, 0.45,  0.85],
      [ 1.1, 0.45, -0.85],
      [-1.1, 0.45,  0.85],
      [-1.1, 0.45, -0.85]
    ];
    for (var wi = 0; wi < wheelOffsets.length; wi++) {
      var wm = new THREE.Mesh(wheelGeo, wheelMat);
      wm.rotation.x = Math.PI / 2;
      wm.position.set(wheelOffsets[wi][0], wheelOffsets[wi][1], wheelOffsets[wi][2]);
      group.add(wm);
    }

    // Turret
    var turretGeo = new THREE.BoxGeometry(0.8, 0.4, 0.8);
    var turretMat = new THREE.MeshLambertMaterial({ color: 0x2a2a1a });
    var turret    = new THREE.Mesh(turretGeo, turretMat);
    turret.position.set(0, 1.6, 0);
    group.add(turret);

    // Gun barrel
    var barrelGeo = new THREE.BoxGeometry(0.1, 0.1, 0.8);
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var barrel    = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.set(0, 0, 0.8);
    turret.add(barrel);

    return { group: group, turret: turret };
  }

  /* ── Build Truck mesh ───────────────────────────────────────────────── */
  function _buildTruck() {
    var group = new THREE.Group();

    var metalMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });

    // Main bed/body
    var bodyGeo = new THREE.BoxGeometry(3.2, 1.8, 1.6);
    var body    = new THREE.Mesh(bodyGeo, metalMat);
    body.position.y = 0.9;
    body.castShadow = true;
    group.add(body);

    // Cab (front top)
    var cabGeo = new THREE.BoxGeometry(1.2, 1.8, 1.6);
    var cabMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
    var cab    = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(1.2, 0.9, 0);
    group.add(cab);

    // Bed cover (tarp)
    var bedGeo = new THREE.BoxGeometry(2.0, 0.1, 1.6);
    var bedMat = new THREE.MeshLambertMaterial({ color: 0x2a4a2a });
    var bed    = new THREE.Mesh(bedGeo, bedMat);
    bed.position.set(-0.6, 1.85, 0);
    group.add(bed);

    // 6 wheels
    var wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.6, 8);
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var wOffsets = [
      [ 1.2, 0.45,  0.95],
      [ 1.2, 0.45, -0.95],
      [ 0.0, 0.45,  0.95],
      [ 0.0, 0.45, -0.95],
      [-1.2, 0.45,  0.95],
      [-1.2, 0.45, -0.95]
    ];
    for (var wi = 0; wi < wOffsets.length; wi++) {
      var wm = new THREE.Mesh(wheelGeo, wheelMat);
      wm.rotation.x = Math.PI / 2;
      wm.position.set(wOffsets[wi][0], wOffsets[wi][1], wOffsets[wi][2]);
      group.add(wm);
    }

    return { group: group };
  }

  /* ── Build HP-bar sprite above vehicle ─────────────────────────────── */
  function _buildHpBarSprite(maxHp) {
    var tex  = _makeHpBar(256, 32);
    _updateHpBar(tex, maxHp, maxHp);
    var mat  = new THREE.SpriteMaterial({ map: tex, depthTest: false });
    var spr  = new THREE.Sprite(mat);
    spr.scale.set(3.5, 0.45, 1);
    spr._hpTex = tex;
    return spr;
  }

  /* ── Smoke particle helpers ─────────────────────────────────────────── */
  function _buildSmokeParticles(group) {
    var particles = [];
    var smokeGeo  = new THREE.SphereGeometry(0.18, 4, 4);
    var smokeMat  = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.5 });
    for (var si = 0; si < 3; si++) {
      var sm = new THREE.Mesh(smokeGeo, smokeMat.clone());
      sm.visible = false;
      group.add(sm);
      particles.push(sm);
    }
    return particles;
  }

  /* ── Engine sound (low rumble) ──────────────────────────────────────── */
  function _startEngineSound(veh) {
    if (!window._audioCtx) return;
    try {
      var osc  = window._audioCtx.createOscillator();
      var gain = window._audioCtx.createGain();
      osc.type            = 'sawtooth';
      osc.frequency.value = 60;
      gain.gain.value     = 0.08;
      osc.connect(gain);
      gain.connect(window._audioCtx.destination);
      osc.start();
      veh._engineOsc  = osc;
      veh._engineGain = gain;
    } catch (e) { /* ignore audio errors */ }
  }

  function _stopEngineSound(veh) {
    if (veh._engineOsc) {
      try { veh._engineOsc.stop(); } catch (e) {}
      veh._engineOsc  = null;
      veh._engineGain = null;
    }
  }

  /* ── Death explosion VFX ────────────────────────────────────────────── */
  function _explodeVehicle(veh) {
    if (!_scene) return;

    // Expanding light
    var light = new THREE.PointLight(0xff6600, 10, 20);
    light.position.copy(veh.mesh.position);
    _scene.add(light);

    // 3 smoke spheres
    var smokeGeo = new THREE.SphereGeometry(0.4, 5, 5);
    var explodeSpheres = [];
    for (var si = 0; si < 3; si++) {
      var mat = new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.8 });
      var sm  = new THREE.Mesh(smokeGeo, mat);
      sm.position.copy(veh.mesh.position);
      sm.position.x += (Math.random() - 0.5) * 2;
      sm.position.z += (Math.random() - 0.5) * 2;
      _scene.add(sm);
      explodeSpheres.push(sm);
    }

    // Animate over 2 seconds using setTimeout chain
    var elapsed = 0;
    var duration = 2000;
    var startTime = performance.now();

    function animateExplosion() {
      var now = performance.now();
      var t   = Math.min(1, (now - startTime) / duration);
      light.intensity = 10 * (1 - t);
      light.distance  = 20 + t * 15;
      for (var i = 0; i < explodeSpheres.length; i++) {
        explodeSpheres[i].scale.setScalar(1 + t * 4);
        explodeSpheres[i].material.opacity = 0.8 * (1 - t);
      }
      if (t < 1) {
        requestAnimationFrame(animateExplosion);
      } else {
        _scene.remove(light);
        for (var j = 0; j < explodeSpheres.length; j++) {
          _scene.remove(explodeSpheres[j]);
          explodeSpheres[j].geometry.dispose();
          explodeSpheres[j].material.dispose();
        }
      }
    }
    animateExplosion();
  }

  /* ── Leave burned hull ──────────────────────────────────────────────── */
  function _leaveBurnedHull(veh) {
    if (!_scene) return;
    var burnMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var hullGeo = new THREE.BoxGeometry(veh.type === 'btr' ? 2.8 : 3.2, 0.5, veh.type === 'btr' ? 1.4 : 1.6);
    var hull    = new THREE.Mesh(hullGeo, burnMat);
    hull.position.copy(veh.mesh.position);
    hull.position.y = 0.25;
    _scene.add(hull);
  }

  /* ── Core: spawn a vehicle ──────────────────────────────────────────── */
  function _spawn(type, scene, x, z) {
    if (_vehicles.length >= MAX_VEHICLES) return null;

    _scene = scene;

    var built  = (type === 'btr') ? _buildBTR() : _buildTruck();
    var group  = built.group;
    group.position.set(x, 0, z);
    scene.add(group);

    var maxHp = (type === 'btr') ? BTR_HP : TRUCK_HP;
    var speed = (type === 'btr') ? BTR_SPEED : TRUCK_SPEED;

    var hpSprite = _buildHpBarSprite(maxHp);
    hpSprite.position.set(0, (type === 'btr') ? 3.2 : 3.8, 0);
    group.add(hpSprite);

    var smoke = _buildSmokeParticles(group);

    var veh = {
      type:          type,
      mesh:          group,
      turret:        built.turret || null,
      hp:            maxHp,
      maxHp:         maxHp,
      speed:         speed,
      alive:         true,
      shotTimer:     0,
      smokeParticles:smoke,
      smokeTimer:    0,
      hpSprite:      hpSprite,
      _engineOsc:    null,
      _engineGain:   null,
      heading:       0  // radians, used for circling
    };

    _startEngineSound(veh);
    _vehicles.push(veh);
    return veh;
  }

  /* ── Public: spawnBTR / spawnTruck ─────────────────────────────────── */
  function spawnBTR(scene, x, z) {
    return _spawn('btr', scene, x, z);
  }

  function spawnTruck(scene, x, z) {
    return _spawn('truck', scene, x, z);
  }

  /* ── Public: init ────────────────────────────────────────────────────── */
  function init(scene) {
    _scene    = scene;
    _vehicles = [];
  }

  /* ── Public: getAll ─────────────────────────────────────────────────── */
  function getAll() {
    return _vehicles;
  }

  /* ── Public: damageVehicle ──────────────────────────────────────────── */
  function damageVehicle(veh, dmg) {
    if (!veh || !veh.alive) return;
    veh.hp -= dmg;
    _updateHpBar(veh.hpSprite._hpTex, veh.hp, veh.maxHp);

    if (veh.hp <= 0) {
      _killVehicle(veh);
    }
  }

  /* ── Internal: kill vehicle ─────────────────────────────────────────── */
  function _killVehicle(veh) {
    if (!veh.alive) return;
    veh.alive = false;
    _stopEngineSound(veh);

    _explodeVehicle(veh);

    // Truck spawns infantry
    if (veh.type === 'truck') {
      var px = veh.mesh.position.x;
      var py = veh.mesh.position.y;
      var pz = veh.mesh.position.z;
      // Try direct spawn
      if (window.Enemies && typeof window.Enemies.spawnEnemy === 'function') {
        for (var si = 0; si < 3; si++) {
          window.Enemies.spawnEnemy(
            px + (Math.random() - 0.5) * 3,
            py,
            pz + (Math.random() - 0.5) * 3
          );
        }
      } else {
        // Fallback: flag for game-manager to pick up
        window._truckDestroyed = { x: px, y: py, z: pz, count: 3 };
      }
    }

    // Leave hull, then remove mesh after delay
    _leaveBurnedHull(veh);

    // Remove HP bar immediately
    if (veh.hpSprite) {
      veh.mesh.remove(veh.hpSprite);
    }

    // Fade out and remove group
    var meshRef = veh.mesh;
    var scene   = _scene;
    var elapsed = 0;
    var start   = performance.now();
    function fadeOut() {
      var t = Math.min(1, (performance.now() - start) / 1500);
      // traverse and fade
      meshRef.traverse(function(child) {
        if (child.material) {
          if (!child.material._origOpacity) {
            child.material.transparent = true;
            child.material._origOpacity = child.material.opacity || 1;
          }
          child.material.opacity = child.material._origOpacity * (1 - t);
        }
      });
      if (t < 1) {
        requestAnimationFrame(fadeOut);
      } else {
        if (scene) scene.remove(meshRef);
      }
    }
    fadeOut();

    // Remove from array
    for (var ri = 0; ri < _vehicles.length; ri++) {
      if (_vehicles[ri] === veh) {
        _vehicles.splice(ri, 1);
        break;
      }
    }
  }

  /* ── Public: update (called each frame) ─────────────────────────────── */
  function update(delta, playerPos) {
    if (!playerPos) return;

    for (var i = 0; i < _vehicles.length; i++) {
      var veh = _vehicles[i];
      if (!veh || !veh.alive || !veh.mesh) continue;

      var vx  = veh.mesh.position.x;
      var vz  = veh.mesh.position.z;
      var px  = playerPos.x;
      var pz  = playerPos.z;
      var dx  = px - vx;
      var dz  = pz - vz;
      var dist = Math.sqrt(dx * dx + dz * dz) || 0.001;

      /* ── Separation from other vehicles ── */
      var sepX = 0, sepZ = 0;
      for (var j = 0; j < _vehicles.length; j++) {
        if (i === j || !_vehicles[j].alive) continue;
        var ox  = vx - _vehicles[j].mesh.position.x;
        var oz  = vz - _vehicles[j].mesh.position.z;
        var od  = Math.sqrt(ox * ox + oz * oz) || 0.001;
        if (od < SEP_RADIUS) {
          var push = (SEP_RADIUS - od) / SEP_RADIUS;
          sepX += (ox / od) * push;
          sepZ += (oz / od) * push;
        }
      }

      /* ── Movement ── */
      var moveX, moveZ;
      if (dist < CIRCLE_DIST) {
        // Orbit: rotate heading
        veh.heading += (Math.PI / 4) * delta;
        moveX = Math.cos(veh.heading);
        moveZ = Math.sin(veh.heading);
      } else {
        // Drive toward player
        moveX = dx / dist;
        moveZ = dz / dist;
      }

      // Apply separation
      moveX += sepX * 0.5;
      moveZ += sepZ * 0.5;

      // Normalise
      var moveLen = Math.sqrt(moveX * moveX + moveZ * moveZ) || 1;
      moveX /= moveLen;
      moveZ /= moveLen;

      veh.mesh.position.x += moveX * veh.speed * delta;
      veh.mesh.position.z += moveZ * veh.speed * delta;

      // Face direction of travel
      veh.mesh.rotation.y = Math.atan2(moveX, moveZ);

      /* ── Turret tracks player (BTR only) ── */
      if (veh.turret) {
        veh.turret.rotation.y = Math.atan2(dx, dz) - veh.mesh.rotation.y;
      }

      /* ── Ramming damage ── */
      var ramDist = (veh.type === 'btr') ? 2.2 : 1.8;
      var ramDmg  = (veh.type === 'btr') ? 30  : 20;
      if (dist < ramDist) {
        // Apply ramming damage per second, needs global player reference
        if (window._takeVehicleRamDamage) {
          window._takeVehicleRamDamage(ramDmg * delta);
        }
      }

      /* ── BTR fires at player ── */
      if (veh.type === 'btr' && dist < 20) {
        veh.shotTimer = (veh.shotTimer || 0) + delta;
        if (veh.shotTimer >= 2.5) {
          veh.shotTimer = 0;
          if (window._takeBTRDamage) {
            window._takeBTRDamage(18);
          }
        }
      }

      /* ── Smoke trail when low HP ── */
      if (veh.hp < veh.maxHp * SMOKE_HP_PCT) {
        veh.smokeTimer = (veh.smokeTimer || 0) + delta;
        for (var si = 0; si < veh.smokeParticles.length; si++) {
          var sp = veh.smokeParticles[si];
          sp.visible = true;
          // Trail behind
          var trailX = -moveX * (0.5 + si * 0.6);
          var trailZ = -moveZ * (0.5 + si * 0.6);
          sp.position.set(trailX, 1.0 + si * 0.3, trailZ);
          // Pulse opacity
          sp.material.opacity = 0.3 + 0.2 * Math.sin(veh.smokeTimer * 3 + si);
        }
      } else {
        for (var sk = 0; sk < veh.smokeParticles.length; sk++) {
          veh.smokeParticles[sk].visible = false;
        }
      }

      /* ── HP bar always faces camera ── */
      // Sprite auto-faces camera already as THREE.Sprite
    }
  }

  /* ── Public: clear ──────────────────────────────────────────────────── */
  function clear() {
    for (var i = 0; i < _vehicles.length; i++) {
      var veh = _vehicles[i];
      if (!veh) continue;
      _stopEngineSound(veh);
      if (_scene && veh.mesh) _scene.remove(veh.mesh);
    }
    _vehicles = [];
  }

  /* ── Public: reset ──────────────────────────────────────────────────── */
  function reset() {
    clear();
  }

  /* ── Public API ─────────────────────────────────────────────────────── */
  return {
    init:          init,
    update:        update,
    spawnBTR:      spawnBTR,
    spawnTruck:    spawnTruck,
    getAll:        getAll,
    damageVehicle: damageVehicle,
    clear:         clear,
    reset:         reset
  };

})();
