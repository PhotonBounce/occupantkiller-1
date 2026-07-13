/* ───────────────────────────────────────────────────────────────────────
   NUCLEAR PLANT — reactor stability mission
   Activation: N+P simultaneous keypress (both keys within 400ms)
   Player must keep reactor stable for 8 minutes to win.
   Depends on: THREE, HUD, VoxelWorld
   ─────────────────────────────────────────────────────────────────────── */
window.NuclearPlant = (function () {
  'use strict';

  /* ── Constants ────────────────────────────────────────────────── */
  var MELTDOWN_DURATION   = 8 * 60;   // 8 minutes in seconds
  var SCRAM_BONUS         = 4 * 60;   // +4 min from SCRAM
  var INJECT_BONUS        = 2 * 60;   // +2 min from water injection
  var SABOTEUR_CHARGE     = 30;       // seconds to damage a system
  var SYSTEM_STABLE_TIME  = 3 * 60;   // 3 minutes stable per interaction
  var RAD_SUIT_DURATION   = 2 * 60;   // 2 minutes
  var RAD_DAMAGE_PER_S    = 3;        // HP/s in radiation zone
  var RAD_DECON_NEEDED    = 100;      // max dosimeter
  var GENERATOR_INTERACT  = 10;       // seconds to start generator
  var PANEL_INTERACT      = 5;        // seconds to stabilize panel
  var STEAM_RADIUS        = 8;
  var STEAM_DAMAGE        = 30;
  var WIN_SCORE           = 2000;
  var KEY_WINDOW          = 0.4;      // 400ms

  /* ── Module state ─────────────────────────────────────────────── */
  var _scene        = null;
  var _active       = false;
  var _onComplete   = null;
  var _meshes       = [];             // all created meshes for cleanup
  var _lights       = [];             // all created lights for cleanup

  /* Meltdown timer */
  var _meltdownTimer  = MELTDOWN_DURATION;
  var _meltdownOver   = false;
  var _missionWon     = false;

  /* Activation key tracking */
  var _nPressed       = false;
  var _pPressed       = false;
  var _nTime          = 0;
  var _pTime          = 0;

  /* Reactor systems: 4 control panels */
  var _systems = [];   // { name, mesh, x,y,z, stable, stableTimer, damaged }
  var _powerPanel = { alive: true };   // main power panel

  /* Saboteurs */
  var _saboteurs = [];   // { mesh, x,y,z, targetIdx, chargeTimer, alive }

  /* Radiation zones */
  var _radZones   = [];  // { x, y, z, radius, light }
  var _radSuit    = null;  // { mesh, x, y, z, active }
  var _suitTimer  = 0;
  var _hasSuit    = false;
  var _dosimeter  = 0;      // 0-100
  var _deconShower = null;  // { mesh, x, y, z }
  var _permanentRadDmg = false;

  /* Backup generators */
  var _generators = [];  // { mesh, x,y,z, running, interactTimer }

  /* Pump station (water injection) */
  var _pumpStation = null;  // { mesh, x, y, z }
  var _poolLight   = null;
  var _poolFlicker = 0;

  /* SCRAM console */
  var _scramUsed   = false;

  /* Player interaction */
  var _interactTarget  = null;   // current interact target
  var _interactTimer   = 0;
  var _interactDuration = 0;
  var _interactCb      = null;

  /* HUD state */
  var _stabSystems     = 0;

  /* Explosions / effects */
  var _effects = [];   // { mesh, mat, t, life, grow }

  /* ── Key state ────────────────────────────────────────────────── */
  var _keys = {};
  var _keyHandlerAttached = false;

  /* ── Helper: get terrain Y ────────────────────────────────────── */
  function _groundY(x, z) {
    if (typeof window !== 'undefined' && window.VoxelWorld && window.VoxelWorld.getTerrainHeight) {
      return window.VoxelWorld.getTerrainHeight(x, z);
    }
    return 0;
  }

  /* ── Helper: track mesh for cleanup ──────────────────────────── */
  function _track(mesh) {
    _meshes.push(mesh);
    return mesh;
  }
  function _trackLight(light) {
    _lights.push(light);
    return light;
  }

  /* ── Build plant structure ─────────────────────────────────────── */
  function _buildPlant() {
    var gy = _groundY(0, 0);

    /* Reactor building 20x15x20 */
    var rbGeo = new THREE.BoxGeometry(20, 15, 20);
    var rbMat = new THREE.MeshLambertMaterial({ color: 0x667777 });
    var rb    = new THREE.Mesh(rbGeo, rbMat);
    rb.position.set(0, gy + 7.5, 0);
    _scene.add(rb);
    _track(rb);

    /* Cooling towers — CylinderGeometry r=5 h=20 */
    var ctGeo = new THREE.CylinderGeometry(5, 5, 20, 16);
    var ctMat = new THREE.MeshLambertMaterial({ color: 0x888888 });

    var ct1 = new THREE.Mesh(ctGeo, ctMat);
    ct1.position.set(-18, gy + 10, -8);
    _scene.add(ct1);
    _track(ct1);

    var ct2 = new THREE.Mesh(ctGeo, ctMat);
    ct2.position.set(-18, gy + 10, 8);
    _scene.add(ct2);
    _track(ct2);

    /* Control room 12x4x8 */
    var crGeo = new THREE.BoxGeometry(12, 4, 8);
    var crMat = new THREE.MeshLambertMaterial({ color: 0x556666 });
    var cr    = new THREE.Mesh(crGeo, crMat);
    cr.position.set(0, gy + 2, 16);
    _scene.add(cr);
    _track(cr);

    /* Turbine hall 25x8x12 */
    var thGeo = new THREE.BoxGeometry(25, 8, 12);
    var thMat = new THREE.MeshLambertMaterial({ color: 0x445555 });
    var th    = new THREE.Mesh(thGeo, thMat);
    th.position.set(20, gy + 4, 0);
    _scene.add(th);
    _track(th);

    /* Spent fuel pool 10x2x8 — blue glow */
    var sfGeo = new THREE.BoxGeometry(10, 2, 8);
    var sfMat = new THREE.MeshLambertMaterial({ color: 0x224433 });
    var sf    = new THREE.Mesh(sfGeo, sfMat);
    sf.position.set(0, gy + 1, -18);
    _scene.add(sf);
    _track(sf);

    var poolLt = new THREE.PointLight(0x0088FF, 1.2, 18);
    poolLt.position.set(0, gy + 3, -18);
    _scene.add(poolLt);
    _trackLight(poolLt);
    _poolLight = poolLt;
  }

  /* ── Build control panels (reactor systems) ───────────────────── */
  function _buildSystems() {
    var gy = _groundY(0, 0);
    var sysDefs = [
      { name: 'COOLANT PUMP',   x: -4, z: 14 },
      { name: 'CONTROL RODS',   x: -1, z: 14 },
      { name: 'PRESSURE VALVE', x:  2, z: 14 },
      { name: 'EMERGENCY SCRAM',x:  5, z: 14 },
    ];
    for (var i = 0; i < sysDefs.length; i++) {
      var def = sysDefs[i];
      var geo = new THREE.BoxGeometry(1.5, 2, 0.5);
      var mat = new THREE.MeshLambertMaterial({ color: 0x336633 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(def.x, gy + 1, def.z);
      _scene.add(mesh);
      _track(mesh);
      _systems.push({
        name:        def.name,
        mesh:        mesh,
        x:           def.x,
        y:           gy + 1,
        z:           def.z,
        stable:      false,
        stableTimer: 0,
        damaged:     false,
      });
    }
  }

  /* ── Build saboteurs ──────────────────────────────────────────── */
  function _buildSaboteurs() {
    var gy = _groundY(0, 0);
    var startPositions = [
      { x: -30, z:  10 },
      { x: -28, z: -5  },
      { x:  30, z:  15 },
      { x:  28, z: -10 },
      { x:   5, z: -30 },
      { x:  -5, z: -28 },
    ];
    var geo = new THREE.BoxGeometry(1, 2, 1);
    var mat = new THREE.MeshLambertMaterial({ color: 0x221100 });
    for (var i = 0; i < startPositions.length; i++) {
      var sp = startPositions[i];
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(sp.x, gy + 1, sp.z);
      _scene.add(mesh);
      _track(mesh);
      _saboteurs.push({
        mesh:        mesh,
        x:           sp.x,
        y:           gy + 1,
        z:           sp.z,
        targetIdx:   i % _systems.length,
        chargeTimer: 0,
        alive:       true,
      });
    }
  }

  /* ── Build radiation zones ────────────────────────────────────── */
  function _buildRadZones() {
    var gy = _groundY(0, 0);
    var zones = [
      { x:  8, z:  -8 },
      { x: -8, z:   5 },
      { x: 15, z:   5 },
    ];
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i];
      var lt = new THREE.PointLight(0x00FF00, 0.8, 10);
      lt.position.set(z.x, gy + 2, z.z);
      _scene.add(lt);
      _trackLight(lt);
      _radZones.push({ x: z.x, y: gy + 1, z: z.z, radius: 6, light: lt });
    }
  }

  /* ── Build radiation suit pickup ──────────────────────────────── */
  function _buildRadSuit() {
    var gy = _groundY(0, 0);
    var geo = new THREE.BoxGeometry(1, 2, 0.5);
    var mat = new THREE.MeshLambertMaterial({ color: 0x33AA33 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(-12, gy + 1, 5);
    _scene.add(mesh);
    _track(mesh);
    _radSuit = { mesh: mesh, x: -12, y: gy + 1, z: 5, active: true };
  }

  /* ── Build decontamination shower ─────────────────────────────── */
  function _buildDeconShower() {
    var gy = _groundY(0, 0);
    var geo = new THREE.BoxGeometry(2, 3, 2);
    var mat = new THREE.MeshLambertMaterial({ color: 0x225588 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(-15, gy + 1.5, -5);
    _scene.add(mesh);
    _track(mesh);
    _deconShower = { mesh: mesh, x: -15, y: gy + 1.5, z: -5 };
  }

  /* ── Build backup generators ──────────────────────────────────── */
  function _buildGenerators() {
    var gy = _groundY(0, 0);
    var gpos = [
      { x: 14, z: -3 },
      { x: 20, z: -3 },
      { x: 26, z: -3 },
    ];
    var geo = new THREE.BoxGeometry(3, 2, 2);
    var mat = new THREE.MeshLambertMaterial({ color: 0x555544 });
    for (var i = 0; i < gpos.length; i++) {
      var gp = gpos[i];
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(gp.x, gy + 1, gp.z);
      _scene.add(mesh);
      _track(mesh);
      _generators.push({
        mesh:          mesh,
        x:             gp.x,
        y:             gy + 1,
        z:             gp.z,
        running:       false,
        interactTimer: 0,
      });
    }
  }

  /* ── Build pump station ───────────────────────────────────────── */
  function _buildPumpStation() {
    var gy = _groundY(0, 0);
    var geo = new THREE.BoxGeometry(3, 2, 2);
    var mat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, gy + 1, -14);
    _scene.add(mesh);
    _track(mesh);
    _pumpStation = { mesh: mesh, x: 0, y: gy + 1, z: -14 };
  }

  /* ── Build main power panel ───────────────────────────────────── */
  function _buildPowerPanel() {
    var gy = _groundY(0, 0);
    var geo = new THREE.BoxGeometry(2, 3, 0.5);
    var mat = new THREE.MeshLambertMaterial({ color: 0x443322 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(8, gy + 1.5, 14);
    _scene.add(mesh);
    _track(mesh);
    _powerPanel = { alive: true, mesh: mesh, x: 8, y: gy + 1.5, z: 14 };
  }

  /* ── Saboteur update ──────────────────────────────────────────── */
  function _updateSaboteurs(delta) {
    for (var i = 0; i < _saboteurs.length; i++) {
      var sab = _saboteurs[i];
      if (!sab.alive) continue;
      var target = _systems[sab.targetIdx];
      if (!target) continue;

      /* Move toward target */
      var dx = target.x - sab.x;
      var dz = target.z - sab.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 2) {
        var speed = 3.5 * delta;
        sab.x += (dx / dist) * speed;
        sab.z += (dz / dist) * speed;
        sab.mesh.position.set(sab.x, sab.y, sab.z);
        sab.chargeTimer = 0;
      } else {
        /* At system — planting charge */
        sab.chargeTimer += delta;
        if (sab.chargeTimer >= SABOTEUR_CHARGE) {
          sab.chargeTimer = 0;
          /* Damage system */
          target.damaged = true;
          target.stable  = false;
          target.stableTimer = 0;
          _meltdownTimer -= 90;
          if (_meltdownTimer < 0) _meltdownTimer = 0;
          _hudNotify('SYSTEM DAMAGED: ' + target.name + ' — MELTDOWN ACCELERATED', '#FF4400');
          /* Pick next target */
          sab.targetIdx = (sab.targetIdx + 1) % _systems.length;

          /* Also try to kill power panel */
          if (_powerPanel.alive) {
            var ppDx = _powerPanel.x - sab.x;
            var ppDz = _powerPanel.z - sab.z;
            if (ppDx * ppDx + ppDz * ppDz < 25) {
              _powerPanel.alive = false;
              _hudNotify('MAIN POWER OFFLINE — START BACKUP GENERATORS', '#FF2200');
            }
          }
        }
      }
    }
  }

  /* ── Radiation zone check ─────────────────────────────────────── */
  function _updateRadiation(delta, px, py, pz) {
    var inRad = false;
    for (var i = 0; i < _radZones.length; i++) {
      var rz = _radZones[i];
      var dx = px - rz.x;
      var dz = pz - rz.z;
      if (Math.sqrt(dx * dx + dz * dz) < rz.radius) {
        inRad = true;
        break;
      }
    }

    if (inRad && !_hasSuit) {
      /* Take radiation damage */
      _dosimeter += (RAD_DAMAGE_PER_S * delta * 10); /* dosimeter in % */
      if (_dosimeter > RAD_DECON_NEEDED) _dosimeter = RAD_DECON_NEEDED;
      _applyPlayerDamage(RAD_DAMAGE_PER_S * delta);
    }

    /* Permanent radiation above 100% dosimeter */
    if (_dosimeter >= RAD_DECON_NEEDED) {
      _permanentRadDmg = true;
    }
    if (_permanentRadDmg) {
      _applyPlayerDamage(5 * delta);
    }

    /* Rad suit timer */
    if (_hasSuit) {
      _suitTimer -= delta;
      if (_suitTimer <= 0) {
        _hasSuit = false;
        _hudNotify('RADIATION SUIT EXPIRED — FIND SHELTER', '#FFAA00');
      }
    }

    /* Rad suit pickup */
    if (_radSuit && _radSuit.active) {
      var sdx = px - _radSuit.x;
      var sdz = pz - _radSuit.z;
      if (sdx * sdx + sdz * sdz < 4) {
        _hasSuit     = true;
        _suitTimer   = RAD_SUIT_DURATION;
        _radSuit.active = false;
        _scene.remove(_radSuit.mesh);
        _hudNotify('RADIATION SUIT EQUIPPED — 2 MIN IMMUNITY', '#33FF33');
      }
    }
  }

  /* ── Update pool flicker ──────────────────────────────────────── */
  function _updatePoolFlicker(delta) {
    if (!_poolLight) return;
    _poolFlicker += delta * 3;
    var flicker = 0.8 + 0.4 * Math.sin(_poolFlicker) + 0.2 * Math.sin(_poolFlicker * 2.7);
    _poolLight.color.setHex(_meltdownTimer < 120 ? 0x0044FF : 0x00AAFF);
    _poolLight.intensity = flicker;
  }

  /* ── Update reactor systems stability ─────────────────────────── */
  function _updateSystems(delta) {
    _stabSystems = 0;
    for (var i = 0; i < _systems.length; i++) {
      var sys = _systems[i];
      if (sys.stable) {
        sys.stableTimer -= delta;
        if (sys.stableTimer <= 0) {
          sys.stable      = false;
          sys.stableTimer = 0;
        } else {
          _stabSystems++;
        }
      }
    }
  }

  /* ── Effects (explosions, steam) ─────────────────────────────── */
  function _spawnExplosion(x, y, z, scale, color) {
    if (!_scene) return;
    var geo = new THREE.SphereGeometry(0.5, 10, 8);
    var mat = new THREE.MeshBasicMaterial({ color: color || 0xFF8822, transparent: true, opacity: 0.9 });
    var m   = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    _scene.add(m);
    _effects.push({ mesh: m, mat: mat, t: 0, life: 0.8, grow: scale * 5 });
  }

  function _spawnSteamCloud(x, y, z) {
    if (!_scene) return;
    var geo = new THREE.BoxGeometry(STEAM_RADIUS, STEAM_RADIUS * 0.5, STEAM_RADIUS);
    var mat = new THREE.MeshBasicMaterial({ color: 0x88AAFF, transparent: true, opacity: 0.7 });
    var m   = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    _scene.add(m);
    _effects.push({ mesh: m, mat: mat, t: 0, life: 2.5, grow: 2 });
  }

  function _updateEffects(delta) {
    for (var i = _effects.length - 1; i >= 0; i--) {
      var e = _effects[i];
      e.t += delta;
      var k = e.t / e.life;
      if (k >= 1) {
        if (_scene) _scene.remove(e.mesh);
        if (e.mesh.geometry) e.mesh.geometry.dispose();
        if (e.mat) e.mat.dispose();
        _effects.splice(i, 1);
        continue;
      }
      var s = 1 + k * e.grow;
      e.mesh.scale.set(s, s * 0.5, s);
      e.mat.opacity = 0.9 * (1 - k);
    }
  }

  /* ── Apply damage to player ───────────────────────────────────── */
  function _applyPlayerDamage(amount) {
    if (typeof window !== 'undefined' && window.Player && window.Player.takeDamage) {
      window.Player.takeDamage(amount);
    }
  }

  /* ── HUD notifications ────────────────────────────────────────── */
  function _hudNotify(msg, color) {
    if (typeof window !== 'undefined' && window.HUD && window.HUD.notifyPickup) {
      window.HUD.notifyPickup(msg, color || '#FFFFFF');
    }
  }

  /* ── HUD update ───────────────────────────────────────────────── */
  function _updateHUD() {
    if (!_active) return;
    if (typeof window === 'undefined' || !window.HUD || !window.HUD.setMissionText) return;

    var mins    = Math.floor(_meltdownTimer / 60);
    var secs    = Math.floor(_meltdownTimer % 60);
    var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    var timeColor = (_meltdownTimer < 180) ? '#FF2200' : '#FFFFFF';

    var aliveSabs = 0;
    for (var i = 0; i < _saboteurs.length; i++) {
      if (_saboteurs[i].alive) aliveSabs++;
    }

    var coolantName = (_systems.length > 0 && _systems[0].stable) ? 'STABLE' : 'UNSTABLE';
    var radPct      = Math.floor(_dosimeter);

    var hudText = 'NUCLEAR [MELTDOWN: ' + timeStr + '] [SYSTEMS: ' + _stabSystems + '/4] [RADIATION: ' + radPct + '%] [SABOTEURS: ' + aliveSabs + '] | COOLANT: ' + coolantName;

    window.HUD.setMissionText(hudText, timeColor);

    /* Shake HUD when dosimeter > 80 */
    if (_dosimeter > 80 && window.HUD.shake) {
      window.HUD.shake(0.5);
    }
  }

  /* ── Meltdown catastrophe ─────────────────────────────────────── */
  function _triggerMeltdown() {
    if (_meltdownOver) return;
    _meltdownOver = true;
    _active       = false;

    /* Flash PointLight */
    var flashLt = new THREE.PointLight(0xFF2200, 8, 80);
    flashLt.position.set(0, _groundY(0, 0) + 15, 0);
    _scene.add(flashLt);
    _trackLight(flashLt);

    _spawnExplosion(0, _groundY(0, 0) + 10, 0, 6, 0xFF2200);
    _hudNotify('CATASTROPHIC MELTDOWN — MISSION FAILED', '#FF0000');

    if (typeof window !== 'undefined' && window.HUD && window.HUD.showGameOver) {
      window.HUD.showGameOver('NUCLEAR MELTDOWN');
    }

    setTimeout(function () {
      if (_scene) _scene.remove(flashLt);
    }, 3000);

    if (typeof _onComplete === 'function') {
      try { _onComplete({ success: false, reason: 'meltdown' }); } catch (_e) {}
    }
  }

  /* ── Mission victory ──────────────────────────────────────────── */
  function _triggerVictory() {
    if (_missionWon) return;
    _missionWon = true;
    _active     = false;

    _hudNotify('REACTOR STABLE — MISSION ACCOMPLISHED', '#22FF55');

    if (typeof window !== 'undefined' && window.Marketplace && window.Marketplace.addOKC) {
      window.Marketplace.addOKC(WIN_SCORE);
    }

    if (typeof _onComplete === 'function') {
      try { _onComplete({ success: true, score: WIN_SCORE }); } catch (_e) {}
    }
  }

  /* ── Player position helper ───────────────────────────────────── */
  function _getPlayerPos() {
    if (typeof window !== 'undefined' && window.Player && window.Player.getPosition) {
      return window.Player.getPosition();
    }
    return { x: 0, y: 0, z: 0 };
  }

  /* ── Distance sq helper ───────────────────────────────────────── */
  function _distSq(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return dx * dx + dz * dz;
  }

  /* ── E key interaction ────────────────────────────────────────── */
  function _handleInteract() {
    if (!_active) return;
    var pos   = _getPlayerPos();
    var px    = pos.x;
    var pz    = pos.z;
    var RANGE = 9; /* interact range squared */

    /* Control panels */
    for (var i = 0; i < _systems.length; i++) {
      var sys = _systems[i];
      if (_distSq(px, pz, sys.x, sys.z) < RANGE) {
        sys.stable      = true;
        sys.stableTimer = SYSTEM_STABLE_TIME;
        sys.damaged     = false;
        _hudNotify(sys.name + ' STABILIZED — 3 MIN', '#33FF99');
        /* Check all 4 stable */
        var allStable = true;
        for (var j = 0; j < _systems.length; j++) {
          if (!_systems[j].stable) { allStable = false; break; }
        }
        if (allStable) {
          _meltdownTimer = Math.min(_meltdownTimer + 60, MELTDOWN_DURATION);
          _hudNotify('ALL SYSTEMS STABLE — MELTDOWN HALTED', '#00FF88');
        }
        return;
      }
    }

    /* Backup generators */
    for (var gi = 0; gi < _generators.length; gi++) {
      var gen = _generators[gi];
      if (gen.running) continue;
      if (_distSq(px, pz, gen.x, gen.z) < RANGE) {
        _startGeneratorInteract(gi);
        return;
      }
    }

    /* Decontamination shower */
    if (_deconShower && _distSq(px, pz, _deconShower.x, _deconShower.z) < RANGE) {
      _dosimeter        = 0;
      _permanentRadDmg  = false;
      _hudNotify('DECONTAMINATED — RADIATION CLEARED', '#33FFCC');
      return;
    }
  }

  /* ── Generator interaction (timed 10s) ───────────────────────── */
  function _startGeneratorInteract(idx) {
    var gen = _generators[idx];
    if (!gen || gen.running) return;
    _hudNotify('STARTING GENERATOR ' + (idx + 1) + '...', '#FFCC44');
    var elapsed = 0;
    var iv = setInterval(function () {
      elapsed += 0.5;
      if (!_active) { clearInterval(iv); return; }
      if (elapsed >= GENERATOR_INTERACT) {
        clearInterval(iv);
        gen.running = true;
        gen.mesh.material.color.setHex(0xAABB44);
        _hudNotify('GENERATOR ' + (idx + 1) + ' ONLINE', '#AAFF44');
        if (_allGeneratorsRunning()) {
          _hudNotify('ALL GENERATORS RUNNING — POWER RESTORED', '#FFFF44');
        }
      }
    }, 500);
  }

  function _allGeneratorsRunning() {
    for (var i = 0; i < _generators.length; i++) {
      if (!_generators[i].running) return false;
    }
    return true;
  }

  /* ── SPACE key — emergency SCRAM ─────────────────────────────── */
  function _handleScram() {
    if (!_active) return;
    if (_scramUsed) { _hudNotify('SCRAM ALREADY ACTIVATED', '#FF8800'); return; }
    if (_meltdownTimer >= 120) { _hudNotify('SCRAM ONLY AVAILABLE UNDER 2 MINUTES', '#FF8800'); return; }

    var pos = _getPlayerPos();
    /* Must be near control room (roughly x:0 z:16) */
    if (_distSq(pos.x, pos.z, 0, 16) > 100) {
      _hudNotify('EMERGENCY SCRAM: REACH CONTROL ROOM CONSOLE', '#FF8800');
      return;
    }

    _scramUsed      = true;
    _meltdownTimer += SCRAM_BONUS;
    _hudNotify('EMERGENCY SCRAM ACTIVATED — +4 MIN', '#FFFF00');

    /* Steam explosion */
    var gy = _groundY(0, 0);
    _spawnSteamCloud(0, gy + 5, 16);
    _applyPlayerDamage(STEAM_DAMAGE);
    _hudNotify('STEAM EXPLOSION — TOOK ' + STEAM_DAMAGE + ' DAMAGE', '#88AAFF');
  }

  /* ── W key — water injection ──────────────────────────────────── */
  function _handleWaterInject() {
    if (!_active) return;
    if (!_pumpStation) return;
    var pos = _getPlayerPos();
    if (_distSq(pos.x, pos.z, _pumpStation.x, _pumpStation.z) > 16) {
      _hudNotify('MOVE TO PUMP STATION TO INJECT COOLANT', '#0088FF');
      return;
    }
    _meltdownTimer += INJECT_BONUS;
    if (_meltdownTimer > MELTDOWN_DURATION) _meltdownTimer = MELTDOWN_DURATION;
    _hudNotify('COOLANT INJECTED — +2 MIN', '#00AAFF');
  }

  /* ── Key event handlers ───────────────────────────────────────── */
  function _onKeyDown(e) {
    _keys[e.code] = true;
    var now = Date.now() / 1000;

    if (e.code === 'KeyN') { _nPressed = true; _nTime = now; }
    if (e.code === 'KeyP') { _pPressed = true; _pTime = now; }

    /* Activation: N+P within 400ms */
    if (_nPressed && _pPressed && Math.abs(_nTime - _pTime) < KEY_WINDOW) {
      if (!_active && !_meltdownOver && !_missionWon) {
        _nPressed = false;
        _pPressed = false;
        _activate();
      }
    }

    if (!_active) return;

    /* E key — interact */
    if (e.code === 'KeyE') { _handleInteract(); }

    /* SPACE key — SCRAM */
    if (e.code === 'Space') { _handleScram(); }

    /* W key — water inject */
    if (e.code === 'KeyW') { _handleWaterInject(); }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
    if (e.code === 'KeyN') _nPressed = false;
    if (e.code === 'KeyP') _pPressed = false;
  }

  /* ── Activation (build layout and start timers) ───────────────── */
  function _activate() {
    if (_active) return;
    clear();
    _buildPlant();
    _buildSystems();
    _buildSaboteurs();
    _buildRadZones();
    _buildRadSuit();
    _buildDeconShower();
    _buildGenerators();
    _buildPumpStation();
    _buildPowerPanel();

    _meltdownTimer   = MELTDOWN_DURATION;
    _meltdownOver    = false;
    _missionWon      = false;
    _scramUsed       = false;
    _hasSuit         = false;
    _suitTimer       = 0;
    _dosimeter       = 0;
    _permanentRadDmg = false;
    _stabSystems     = 0;
    _poolFlicker     = 0;
    _active          = true;

    _hudNotify('NUCLEAR PLANT ACTIVE — KEEP REACTOR STABLE FOR 8 MINUTES', '#00FFFF');
    _hudNotify('N+P: ACTIVATE | E: INTERACT | SPACE: SCRAM | W: COOLANT', '#AAFFFF');
  }

  /* ── Public init ──────────────────────────────────────────────── */
  function init(scene, opts) {
    _scene      = scene;
    opts        = opts || {};
    _onComplete = opts.onComplete || null;

    if (!_keyHandlerAttached && typeof window !== 'undefined') {
      window.addEventListener('keydown', _onKeyDown);
      window.addEventListener('keyup',   _onKeyUp);
      _keyHandlerAttached = true;
    }
  }

  /* ── Public update (call every frame with delta seconds) ──────── */
  function update(delta) {
    if (!_active) {
      _updateEffects(delta);
      return;
    }

    var pos = _getPlayerPos();

    /* Meltdown countdown */
    _meltdownTimer -= delta;
    if (_meltdownTimer <= 0) {
      _meltdownTimer = 0;
      _triggerMeltdown();
      return;
    }

    /* Check victory: full 8 min passed means timer just hit 0 — handled above
       Victory = timer was never 0 during full 8 min? No — victory if time elapses
       without meltdown. The timer counts down; if we reach 0 we lose.
       BUT the spec says: keep reactor stable for full 8 min without meltdown.
       We track elapsed time separately: */
    /* Actually win is inverse: timer starts at 480, counts down.
       If player manages to never let it hit 0, they win when elapsed ≥ 8 min.
       We track a separate win clock. */
    if (!_winClock) _winClock = 0;
    _winClock += delta;
    if (_winClock >= MELTDOWN_DURATION) {
      _triggerVictory();
      return;
    }

    /* Update subsystems */
    _updateSaboteurs(delta);
    _updateSystems(delta);
    _updateRadiation(delta, pos.x, pos.y, pos.z);
    _updatePoolFlicker(delta);
    _updateEffects(delta);
    _updateHUD();
  }

  /* ── Track win clock as module var ───────────────────────────── */
  var _winClock = 0;

  /* ── Public clear / teardown ──────────────────────────────────── */
  function clear() {
    _active       = false;
    _meltdownOver = false;
    _missionWon   = false;
    _winClock     = 0;

    if (_scene) {
      for (var i = 0; i < _meshes.length; i++) {
        var m = _meshes[i];
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          if (Array.isArray(m.material)) {
            for (var mi = 0; mi < m.material.length; mi++) m.material[mi].dispose();
          } else {
            m.material.dispose();
          }
        }
        _scene.remove(m);
      }
      for (var li = 0; li < _lights.length; li++) {
        _scene.remove(_lights[li]);
      }
      for (var ei = 0; ei < _effects.length; ei++) {
        var ef = _effects[ei];
        if (ef.mesh) {
          if (ef.mesh.geometry) ef.mesh.geometry.dispose();
          if (ef.mat) ef.mat.dispose();
          _scene.remove(ef.mesh);
        }
      }
    }

    _meshes      = [];
    _lights      = [];
    _effects     = [];
    _systems     = [];
    _saboteurs   = [];
    _radZones    = [];
    _generators  = [];
    _radSuit     = null;
    _deconShower = null;
    _pumpStation = null;
    _poolLight   = null;
    _powerPanel  = { alive: true };
    _scramUsed   = false;
    _hasSuit     = false;
    _suitTimer   = 0;
    _dosimeter   = 0;
    _permanentRadDmg = false;
    _stabSystems = 0;
    _poolFlicker = 0;
    _meltdownTimer = MELTDOWN_DURATION;
    _winClock    = 0;
    _onComplete  = null;
  }

  /* ── Public API ───────────────────────────────────────────────── */
  function isActive()        { return _active; }
  function getMeltdownTime() { return _meltdownTimer; }
  function getDosimeter()    { return _dosimeter; }
  function getStabSystems()  { return _stabSystems; }
  function getSaboteurs()    { return _saboteurs.slice(); }

  return {
    init:            init,
    update:          update,
    clear:           clear,
    isActive:        isActive,
    getMeltdownTime: getMeltdownTime,
    getDosimeter:    getDosimeter,
    getStabSystems:  getStabSystems,
    getSaboteurs:    getSaboteurs,
  };
}());
