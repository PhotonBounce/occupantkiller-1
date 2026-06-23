// trophy-system.js — Active Protection System (APS) Trophy units
// Press Y to deploy a Trophy APS unit (max 3 simultaneously).
// Trophy unit: low box base + rotating radar dish + 2 side launch tubes.
// Detection: scans every 0.1s for registered projectiles within 12-unit radius.
// Intercept: launches counter-shot at approaching projectiles within 8 units.
// Counter-shot: small white sphere, collision at 0.5 units destroys both + flash explosion.
// Trophy HP: 80. Cooldown: 2s between intercepts. Deploy animation: 1.5s arm fold-out.
// Audio: 2000Hz sine chirp every 0.5s per active trophy.
// HUD: trophy count, per-unit status, total intercept count.
// Public API: init(scene, camera), update(delta), deployTrophy(pos),
//             registerProjectile(mesh, vel, dmg), getInterceptCount(), reset()

window.TrophySystem = (function () {
  'use strict';

  // ─── Private state ────────────────────────────────────────────────────────

  var _scene = null;
  var _camera = null;

  var _trophies = [];          // active Trophy APS units
  var _projectiles = [];       // registered projectile objects
  var _counterShots = [];      // active counter-shots in flight
  var _flashEffects = [];      // active intercept flash VFX
  var _interceptLabels = [];   // "INTERCEPT" DOM flash labels

  var _MAX_TROPHIES = 3;
  var _DETECTION_RADIUS = 12; // scan radius (units)
  var _INTERCEPT_RADIUS = 8;  // launch threshold (units)
  var _COLLISION_RADIUS = 0.5;
  var _FLASH_RADIUS = 2;
  var _MAX_HP = 80;
  var _COOLDOWN = 2.0;        // seconds between intercepts per unit
  var _SCAN_INTERVAL = 0.1;   // seconds between scans
  var _CHIRP_INTERVAL = 0.5;  // seconds between radar chirps
  var _COUNTER_SPEED = 30;    // units/s for counter-shot
  var _DEPLOY_TIME = 1.5;     // seconds for arm fold-out animation
  var _RADAR_ROT_SPEED = Math.PI; // 180 deg/s -> 360 deg full sweep

  var _interceptCount = 0;
  var _yKeyDown = false;
  var _scanTimer = 0;

  var _hudEl = null;
  var _overlay = null;

  // ─── Audio ────────────────────────────────────────────────────────────────

  function _getAudioCtx() {
    try {
      if (!window._audioCtx) {
        window._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      return window._audioCtx;
    } catch (e) {
      return null;
    }
  }

  function _playChirp() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  }

  function _playInterceptSound() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.22);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.22);
    } catch (e) {}
  }

  // ─── Mesh builder ─────────────────────────────────────────────────────────

  function _buildTrophyMesh() {
    var group = new THREE.Group();

    // Base box -- olive drab
    var baseMat = new THREE.MeshLambertMaterial({ color: 0x4a5230 });
    var base = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.25, 1.0), baseMat);
    base.position.y = 0.125;
    group.add(base);

    // Upper mounting plate
    var plateMat = new THREE.MeshLambertMaterial({ color: 0x3a4120 });
    var plate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.8), plateMat);
    plate.position.y = 0.31;
    group.add(plate);

    // Central mast
    var mastMat = new THREE.MeshLambertMaterial({ color: 0x555544 });
    var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8), mastMat);
    mast.position.y = 0.62;
    group.add(mast);

    // Radar dish group (rotates around Y axis on mast top)
    var radarGroup = new THREE.Group();
    radarGroup.position.y = 0.87;
    group.add(radarGroup);

    // Dish arm
    var armMat = new THREE.MeshLambertMaterial({ color: 0x666655 });
    var arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), armMat);
    arm.position.x = 0.25;
    radarGroup.add(arm);

    // Dish head -- flattened cylinder
    var dishMat = new THREE.MeshLambertMaterial({ color: 0x88bb88 });
    var dish = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.06, 10), dishMat);
    dish.position.set(0.5, 0, 0);
    dish.rotation.z = Math.PI / 2;
    radarGroup.add(dish);

    // Left launch tube arm group
    var leftArm = new THREE.Group();
    leftArm.position.set(-0.55, 0.42, 0);
    group.add(leftArm);

    var tubeMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    var leftTube = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8), tubeMat);
    leftTube.rotation.z = Math.PI / 2;
    leftArm.add(leftTube);

    // Right launch tube arm group
    var rightArm = new THREE.Group();
    rightArm.position.set(0.55, 0.42, 0);
    group.add(rightArm);

    var tubeMat2 = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    var rightTube = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8), tubeMat2);
    rightTube.rotation.z = Math.PI / 2;
    rightArm.add(rightTube);

    // HP bar background (above unit)
    var hpBgMat = new THREE.MeshBasicMaterial({ color: 0x220000 });
    var hpBg = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.07, 0.07), hpBgMat);
    hpBg.position.y = 1.4;
    group.add(hpBg);

    // HP bar fill (green)
    var hpFillMat = new THREE.MeshBasicMaterial({ color: 0x00cc44 });
    var hpFill = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.065, 0.065), hpFillMat);
    hpFill.position.y = 1.4;
    group.add(hpFill);

    // Cool bar background (cooling indicator, below hp bar)
    var coolBgMat = new THREE.MeshBasicMaterial({ color: 0x002222 });
    var coolBg = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.07, 0.07), coolBgMat);
    coolBg.position.y = 1.3;
    group.add(coolBg);

    // Cool bar fill (cyan)
    var coolFillMat = new THREE.MeshBasicMaterial({ color: 0x00ccff });
    var coolFill = new THREE.Mesh(new THREE.BoxGeometry(0.001, 0.065, 0.065), coolFillMat);
    coolFill.position.y = 1.3;
    group.add(coolFill);

    return {
      group: group,
      radarGroup: radarGroup,
      leftArm: leftArm,
      rightArm: rightArm,
      hpFill: hpFill,
      coolFill: coolFill
    };
  }

  // ─── Trophy object factory ────────────────────────────────────────────────

  function _createTrophy(pos) {
    var meshData = _buildTrophyMesh();
    meshData.group.position.copy(pos);
    _scene.add(meshData.group);

    return {
      group: meshData.group,
      radarGroup: meshData.radarGroup,
      leftArm: meshData.leftArm,
      rightArm: meshData.rightArm,
      hpFill: meshData.hpFill,
      coolFill: meshData.coolFill,

      hp: _MAX_HP,
      cooldownTimer: 0,
      chirpTimer: 0,
      deployTimer: 0,     // counts up to _DEPLOY_TIME
      deployed: false,    // arms folded out fully
      active: true,
      id: Date.now() + Math.random()
    };
  }

  // ─── Deploy animation ──────────────────────────────────────────────────────

  function _updateDeployAnim(trophy, delta) {
    if (trophy.deployed) return;

    trophy.deployTimer += delta;
    var progress = Math.min(trophy.deployTimer / _DEPLOY_TIME, 1.0);

    // Arms start folded up (rotated inward on Z) and unfold to horizontal
    trophy.leftArm.rotation.z = Math.PI / 2 * (1 - progress);
    trophy.rightArm.rotation.z = -(Math.PI / 2) * (1 - progress);

    if (progress >= 1.0) {
      trophy.deployed = true;
    }
  }

  // ─── Counter-shot factory ──────────────────────────────────────────────────

  function _createCounterShot(fromPos, targetPos) {
    var mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var geo = new THREE.SphereGeometry(0.12, 6, 6);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(fromPos);
    _scene.add(mesh);

    var dir = new THREE.Vector3().subVectors(targetPos, fromPos).normalize();
    var vel = dir.multiplyScalar(_COUNTER_SPEED);

    // Small point light for visual pop
    var light = new THREE.PointLight(0xffffff, 1.5, 3);
    mesh.add(light);

    return {
      mesh: mesh,
      velocity: vel,
      life: 2.0,
      active: true
    };
  }

  // ─── Flash VFX ────────────────────────────────────────────────────────────

  function _createFlash(pos) {
    var mat = new THREE.MeshBasicMaterial({
      color: 0xffee44,
      transparent: true,
      opacity: 1.0
    });
    var geo = new THREE.SphereGeometry(_FLASH_RADIUS, 8, 8);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    _scene.add(mesh);

    var light = new THREE.PointLight(0xffaa00, 4, _FLASH_RADIUS * 3);
    light.position.copy(pos);
    _scene.add(light);

    return {
      mesh: mesh,
      light: light,
      life: 0.4,
      maxLife: 0.4,
      active: true
    };
  }

  // ─── "INTERCEPT" DOM label ─────────────────────────────────────────────────

  function _spawnInterceptLabel(worldPos) {
    if (!_camera) return null;
    var el = document.createElement('div');
    el.style.cssText = [
      'position:absolute',
      'pointer-events:none',
      'font-family:monospace',
      'font-size:18px',
      'font-weight:bold',
      'color:#ffee00',
      'text-shadow:0 0 6px #ff8800',
      'background:rgba(0,0,0,0.5)',
      'padding:2px 8px',
      'border-radius:4px',
      'opacity:1'
    ].join(';');
    el.textContent = 'INTERCEPT';
    (_overlay || document.body).appendChild(el);

    return {
      el: el,
      worldPos: worldPos.clone(),
      life: 1.2,
      maxLife: 1.2,
      active: true
    };
  }

  // ─── Project 3D to screen ──────────────────────────────────────────────────

  function _projectToScreen(pos) {
    var v = pos.clone().project(_camera);
    var hw = window.innerWidth / 2;
    var hh = window.innerHeight / 2;
    return {
      x: v.x * hw + hw,
      y: -v.y * hh + hh,
      behind: v.z > 1
    };
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────

  function _buildHud() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'trophy-aps-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'right:10px',
      'font-family:monospace',
      'font-size:13px',
      'color:#88ffcc',
      'background:rgba(0,0,0,0.55)',
      'padding:6px 10px',
      'border-radius:6px',
      'pointer-events:none',
      'z-index:900',
      'min-width:140px'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHud() {
    if (!_hudEl) return;
    var lines = ['<b>APS TROPHY</b>'];
    var active = 0;
    for (var i = 0; i < _trophies.length; i++) {
      var t = _trophies[i];
      if (!t.active) continue;
      active++;
      var status = !t.deployed ? 'DEPLOYING' :
                   t.cooldownTimer > 0 ? 'RELOAD ' + t.cooldownTimer.toFixed(1) + 's' :
                   'READY';
      var hpPct = Math.round(t.hp / _MAX_HP * 100);
      lines.push('  #' + active + ' HP:' + hpPct + '% ' + status);
    }
    lines.push('Units: ' + active + '/' + _MAX_TROPHIES);
    lines.push('Intercepts: ' + _interceptCount);
    _hudEl.innerHTML = lines.join('<br>');
  }

  // ─── Overlay container ────────────────────────────────────────────────────

  function _ensureOverlay() {
    if (_overlay) return;
    _overlay = document.createElement('div');
    _overlay.style.cssText = [
      'position:fixed',
      'left:0', 'top:0',
      'width:100%', 'height:100%',
      'pointer-events:none',
      'z-index:800'
    ].join(';');
    document.body.appendChild(_overlay);
  }

  // ─── Core scan & intercept logic ──────────────────────────────────────────

  function _scan(delta) {
    _scanTimer -= delta;
    if (_scanTimer > 0) return;
    _scanTimer = _SCAN_INTERVAL;

    for (var ti = 0; ti < _trophies.length; ti++) {
      var trophy = _trophies[ti];
      if (!trophy.active || !trophy.deployed || trophy.cooldownTimer > 0) continue;

      var tPos = trophy.group.position;

      for (var pi = 0; pi < _projectiles.length; pi++) {
        var proj = _projectiles[pi];
        if (!proj || !proj.mesh || !proj.active) continue;

        // Skip if explicitly marked non-projectile
        if (proj.mesh.userData && proj.mesh.userData.isProjectile === false) continue;

        var pPos = proj.mesh.position;
        var dist = tPos.distanceTo(pPos);

        if (dist > _DETECTION_RADIUS) continue;

        // Check if approaching: velocity dotted toward trophy should be positive
        var toTrophy = new THREE.Vector3().subVectors(tPos, pPos);
        var approaching = proj.velocity.dot(toTrophy) > 0;
        if (!approaching) continue;

        if (dist <= _INTERCEPT_RADIUS) {
          // Launch counter-shot from left tube world position
          var tubeWorldPos = new THREE.Vector3();
          tubeWorldPos.copy(trophy.leftArm.position);
          tubeWorldPos.add(trophy.group.position);
          var cs = _createCounterShot(tubeWorldPos, pPos);
          _counterShots.push(cs);
          trophy.cooldownTimer = _COOLDOWN;
          break; // one intercept per scan per trophy
        }
      }
    }
  }

  // ─── Update counter-shots ─────────────────────────────────────────────────

  function _updateCounterShots(delta) {
    for (var i = _counterShots.length - 1; i >= 0; i--) {
      var cs = _counterShots[i];
      if (!cs.active) {
        _scene.remove(cs.mesh);
        _counterShots.splice(i, 1);
        continue;
      }

      cs.mesh.position.addScaledVector(cs.velocity, delta);
      cs.life -= delta;
      if (cs.life <= 0) {
        cs.active = false;
        continue;
      }

      // Check collision with all projectiles
      for (var pi = _projectiles.length - 1; pi >= 0; pi--) {
        var proj = _projectiles[pi];
        if (!proj || !proj.mesh || !proj.active) continue;

        var d = cs.mesh.position.distanceTo(proj.mesh.position);
        if (d <= _COLLISION_RADIUS) {
          var hitPos = cs.mesh.position.clone();
          _doIntercept(cs, proj, hitPos);
          break;
        }
      }
    }
  }

  function _doIntercept(cs, proj, hitPos) {
    cs.active = false;

    proj.active = false;
    _scene.remove(proj.mesh);

    var flash = _createFlash(hitPos);
    _flashEffects.push(flash);

    _playInterceptSound();

    var label = _spawnInterceptLabel(hitPos);
    if (label) _interceptLabels.push(label);

    _interceptCount++;
    _updateHud();
  }

  // ─── Update flash effects ─────────────────────────────────────────────────

  function _updateFlashes(delta) {
    for (var i = _flashEffects.length - 1; i >= 0; i--) {
      var f = _flashEffects[i];
      if (!f.active) {
        _scene.remove(f.mesh);
        _scene.remove(f.light);
        _flashEffects.splice(i, 1);
        continue;
      }
      f.life -= delta;
      if (f.life <= 0) {
        f.active = false;
        continue;
      }
      var t = f.life / f.maxLife;
      f.mesh.material.opacity = t;
      f.mesh.scale.setScalar(1 + (1 - t) * 0.5);
      f.light.intensity = 4 * t;
    }
  }

  // ─── Update intercept labels ──────────────────────────────────────────────

  function _updateLabels(delta) {
    for (var i = _interceptLabels.length - 1; i >= 0; i--) {
      var lbl = _interceptLabels[i];
      if (!lbl.active) {
        if (lbl.el.parentNode) lbl.el.parentNode.removeChild(lbl.el);
        _interceptLabels.splice(i, 1);
        continue;
      }
      lbl.life -= delta;
      if (lbl.life <= 0) {
        lbl.active = false;
        continue;
      }
      var t = lbl.life / lbl.maxLife;
      lbl.el.style.opacity = t.toFixed(2);

      if (_camera) {
        var sc = _projectToScreen(lbl.worldPos);
        if (sc.behind) {
          lbl.el.style.display = 'none';
        } else {
          lbl.el.style.display = '';
          lbl.el.style.left = (sc.x - 40) + 'px';
          lbl.el.style.top = (sc.y - (1 - t) * 40 - 20) + 'px';
        }
      }
    }
  }

  // ─── Update trophies (radar rotation, cooldown, HP bars, chirp) ───────────

  function _updateTrophies(delta) {
    for (var i = _trophies.length - 1; i >= 0; i--) {
      var trophy = _trophies[i];
      if (!trophy.active) {
        _scene.remove(trophy.group);
        _trophies.splice(i, 1);
        continue;
      }

      _updateDeployAnim(trophy, delta);

      if (!trophy.deployed) continue;

      // Radar rotation -- continuous 360 sweep
      trophy.radarGroup.rotation.y += _RADAR_ROT_SPEED * delta;

      // Cooldown countdown
      if (trophy.cooldownTimer > 0) {
        trophy.cooldownTimer = Math.max(0, trophy.cooldownTimer - delta);
      }

      // Radar chirp
      trophy.chirpTimer -= delta;
      if (trophy.chirpTimer <= 0) {
        _playChirp();
        trophy.chirpTimer = _CHIRP_INTERVAL;
      }

      // HP bar scale
      var hpRatio = trophy.hp / _MAX_HP;
      trophy.hpFill.scale.x = Math.max(0.001, hpRatio);
      trophy.hpFill.position.x = (hpRatio - 1) * 0.5;

      if (hpRatio > 0.5) {
        trophy.hpFill.material.color.setHex(0x00cc44);
      } else if (hpRatio > 0.25) {
        trophy.hpFill.material.color.setHex(0xddcc00);
      } else {
        trophy.hpFill.material.color.setHex(0xcc2200);
      }

      // Cooldown bar -- full when cooling, empties as ready
      var coolRatio = trophy.cooldownTimer / _COOLDOWN;
      trophy.coolFill.scale.x = Math.max(0.001, coolRatio);
      trophy.coolFill.position.x = (coolRatio - 1) * 0.5;
    }
  }

  // ─── Clean up dead projectiles ─────────────────────────────────────────────

  function _cleanProjectiles() {
    for (var i = _projectiles.length - 1; i >= 0; i--) {
      if (!_projectiles[i] || _projectiles[i].active === false) {
        _projectiles.splice(i, 1);
      }
    }
  }

  // ─── Key handler ──────────────────────────────────────────────────────────

  function _onKeyDown(e) {
    if ((e.key === 'y' || e.key === 'Y') && !_yKeyDown) {
      _yKeyDown = true;
      _tryDeploy();
    }
  }

  function _onKeyUp(e) {
    if (e.key === 'y' || e.key === 'Y') {
      _yKeyDown = false;
    }
  }

  function _tryDeploy() {
    var activeCount = 0;
    for (var i = 0; i < _trophies.length; i++) {
      if (_trophies[i].active) activeCount++;
    }
    if (activeCount >= _MAX_TROPHIES) return;

    var deployPos = new THREE.Vector3();
    if (_camera) {
      var forward = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
      forward.y = 0;
      forward.normalize();
      deployPos.copy(_camera.position).addScaledVector(forward, 3);
      deployPos.y = _camera.position.y - 1.6;
    }
    deployTrophy(deployPos);
  }

  // ─── Public: deployTrophy ─────────────────────────────────────────────────

  function deployTrophy(pos) {
    var activeCount = 0;
    for (var i = 0; i < _trophies.length; i++) {
      if (_trophies[i].active) activeCount++;
    }
    if (activeCount >= _MAX_TROPHIES) return null;

    var spawnPos = pos ? new THREE.Vector3().copy(pos) : new THREE.Vector3(0, 0, 0);
    var trophy = _createTrophy(spawnPos);
    _trophies.push(trophy);
    _updateHud();
    return trophy;
  }

  // ─── Public: registerProjectile ───────────────────────────────────────────

  function registerProjectile(mesh, velocity, damage) {
    if (!mesh) return;
    if (mesh.userData && mesh.userData.isProjectile === undefined) {
      mesh.userData.isProjectile = true;
    }
    _projectiles.push({
      mesh: mesh,
      velocity: velocity || new THREE.Vector3(),
      damage: damage || 0,
      active: true
    });
  }

  // ─── Public: applyDamageAt ────────────────────────────────────────────────

  function applyDamageAt(pos, dmg, radius) {
    for (var i = 0; i < _trophies.length; i++) {
      var t = _trophies[i];
      if (!t.active) continue;
      var d = t.group.position.distanceTo(pos);
      if (d <= (radius || 3)) {
        t.hp -= dmg;
        if (t.hp <= 0) {
          t.active = false;
          var flash = _createFlash(t.group.position);
          _flashEffects.push(flash);
        }
      }
    }
    _updateHud();
  }

  // ─── Public: getInterceptCount ────────────────────────────────────────────

  function getInterceptCount() {
    return _interceptCount;
  }

  // ─── Public: init ─────────────────────────────────────────────────────────

  function init(scene, camera) {
    _scene = scene;
    _camera = camera;
    _trophies = [];
    _projectiles = [];
    _counterShots = [];
    _flashEffects = [];
    _interceptLabels = [];
    _interceptCount = 0;
    _scanTimer = 0;
    _yKeyDown = false;

    _ensureOverlay();
    _buildHud();

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup', _onKeyUp);
  }

  // ─── Public: update ───────────────────────────────────────────────────────

  function update(delta) {
    if (!_scene || !delta || delta <= 0) return;

    _updateTrophies(delta);
    _scan(delta);
    _updateCounterShots(delta);
    _updateFlashes(delta);
    _updateLabels(delta);
    _cleanProjectiles();
    _updateHud();
  }

  // ─── Public: reset ────────────────────────────────────────────────────────

  function reset() {
    for (var i = 0; i < _trophies.length; i++) {
      if (_scene) _scene.remove(_trophies[i].group);
    }
    _trophies = [];

    for (var ci = 0; ci < _counterShots.length; ci++) {
      if (_scene) _scene.remove(_counterShots[ci].mesh);
    }
    _counterShots = [];

    for (var fi = 0; fi < _flashEffects.length; fi++) {
      if (_scene) {
        _scene.remove(_flashEffects[fi].mesh);
        _scene.remove(_flashEffects[fi].light);
      }
    }
    _flashEffects = [];

    for (var li = 0; li < _interceptLabels.length; li++) {
      var el = _interceptLabels[li].el;
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    _interceptLabels = [];

    _projectiles = [];
    _interceptCount = 0;
    _scanTimer = 0;

    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup', _onKeyUp);

    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
      _hudEl = null;
    }
    if (_overlay && _overlay.parentNode) {
      _overlay.parentNode.removeChild(_overlay);
      _overlay = null;
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  return {
    init: init,
    update: update,
    deployTrophy: deployTrophy,
    registerProjectile: registerProjectile,
    applyDamageAt: applyDamageAt,
    getInterceptCount: getInterceptCount,
    reset: reset
  };

})();
