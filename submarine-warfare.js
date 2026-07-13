/* ───────────────────────────────────────────────────────────────────────────
   submarine-warfare.js — Submarine Warfare Mini-Game
   API: window.SubmarineWarfare = { init, update, reset }
   Controls:
     S + W (together, within 400ms) → activate submarine warfare
     W / S               → forward / back
     A / D               → strafe left / right
     Q / E               → dive / surface
     S                   → sonar ping (8s cooldown)
     T                   → fire torpedo (homing, 3 max, 30s reload)
     SHIFT               → silent running (50% speed, sonar invisible)
     E (at panel)        → repair hull (10s)
     E (at depot)        → refill torpedoes + repair
   ─────────────────────────────────────────────────────────────────────────── */
window.SubmarineWarfare = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active       = false;
  var _missionClear = false;
  var _silentBonus  = true;   // no sonar used

  /* ── Activation key tracking (S+W within 400ms) ───────────────────────── */
  var _swPressTime = { S: 0, W: 0 };
  var SW_WINDOW    = 400; // ms

  /* ── Player submarine ──────────────────────────────────────────────────── */
  var _playerSub      = null;
  var _playerHP       = 100;
  var _playerDepth    = -20;  // negative = below surface
  var _playerVelX     = 0;
  var _playerVelZ     = 0;
  var _playerYaw      = 0;
  var _flooding       = false;
  var _repairing      = false;
  var _repairTimer    = 0;
  var _headLight      = null;  // PointLight
  var _propMesh       = null;  // propeller cylinder
  var _propAngle      = 0;

  /* ── Hull integrity ────────────────────────────────────────────────────── */
  var _hullHits    = 0;   // flooding starts at 3

  /* ── Torpedo system ────────────────────────────────────────────────────── */
  var _torpedoes       = [];  // { mesh, target, vel, life }
  var _torpedoCount    = 3;
  var _torpedoReload   = 0;   // countdown timer
  var _lockedTarget    = null;

  /* ── Sonar ─────────────────────────────────────────────────────────────── */
  var _sonarRings      = [];  // { mesh, life, maxLife }
  var _sonarCooldown   = 0;
  var _sonarActive     = false;
  var _playerPinged    = false;  // all enemies alerted

  /* ── Enemy submarines ───────────────────────────────────────────────────── */
  var _enemies    = [];  // { mesh, hp, vel, alerted, fireTimer, alive, light, dcList }
  var _enemyCount = 4;

  /* ── Depth charges ──────────────────────────────────────────────────────── */
  var _depthCharges = [];  // { mesh, targetDepth, fuse, pos, exploded }

  /* ── Supply depot ───────────────────────────────────────────────────────── */
  var _depot       = null;
  var _depotAlive  = true;
  var _mines       = [];   // { mesh, alive }

  /* ── Damage control panel ───────────────────────────────────────────────── */
  var _repairPanel = null;

  /* ── Explosions / effects ───────────────────────────────────────────────── */
  var _explosions = [];  // { mesh, light, life }

  /* ── Fog / background ───────────────────────────────────────────────────── */
  var _savedBackground = null;
  var _savedFog        = null;

  /* ── Silent running ─────────────────────────────────────────────────────── */
  var _silentRunning = false;

  /* ── Input state ────────────────────────────────────────────────────────── */
  var _keys = {};

  /* ── HUD ────────────────────────────────────────────────────────────────── */
  var _hud     = null;
  var _clearEl = null;

  /* ── Timing ─────────────────────────────────────────────────────────────── */
  var _lastTime = 0;

  /* ════════════════════════════════════════════════════════════════════════
     MESH BUILDERS
  ════════════════════════════════════════════════════════════════════════ */

  function buildPlayerSub() {
    var group = new THREE.Group();

    /* Hull */
    var hullGeo = new THREE.BoxGeometry(12, 2.5, 3);
    var hullMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var hull    = new THREE.Mesh(hullGeo, hullMat);
    group.add(hull);

    /* Conning tower */
    var towerGeo = new THREE.CylinderGeometry(0.8, 0.8, 3, 10);
    var towerMat = new THREE.MeshLambertMaterial({ color: 0x2A3A4A });
    var tower    = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(-1, 2.75, 0);
    group.add(tower);

    /* Propeller (rear) */
    var propGeo = new THREE.CylinderGeometry(1, 1, 0.3, 8);
    var propMat = new THREE.MeshLambertMaterial({ color: 0x7A8A7A });
    var prop    = new THREE.Mesh(propGeo, propMat);
    prop.rotation.z = Math.PI / 2;
    prop.position.set(-6.2, 0, 0);
    group.add(prop);
    _propMesh = prop;

    return group;
  }

  function buildEnemySub() {
    var group = new THREE.Group();
    var hullGeo = new THREE.BoxGeometry(10, 2, 2.5);
    var hullMat = new THREE.MeshLambertMaterial({ color: 0x442222 });
    var hull    = new THREE.Mesh(hullGeo, hullMat);
    group.add(hull);
    var towerGeo = new THREE.CylinderGeometry(0.6, 0.6, 2, 8);
    var towerMat = new THREE.MeshLambertMaterial({ color: 0x331111 });
    var tower    = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(-0.5, 2, 0);
    group.add(tower);
    return group;
  }

  function buildTorpedo() {
    var geo = new THREE.CylinderGeometry(0.2, 0.2, 2, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0x888844 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = Math.PI / 2;
    return mesh;
  }

  function buildDepthCharge() {
    var geo = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: 0x885544 });
    var mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  function buildDepot() {
    var group = new THREE.Group();
    var geo = new THREE.BoxGeometry(8, 4, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
    /* Depot light */
    var light = new THREE.PointLight(0x0088AA, 1.5, 20);
    light.position.set(0, 3, 0);
    group.add(light);
    return group;
  }

  function buildMine() {
    var geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var mat = new THREE.MeshLambertMaterial({ color: 0x883322 });
    var mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  function buildRepairPanel() {
    var geo = new THREE.BoxGeometry(2, 2, 0.5);
    var mat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  function buildSonarRing() {
    var geo = new THREE.SphereGeometry(1, 12, 8);
    var mat = new THREE.MeshBasicMaterial({
      color: 0x00AAFF,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    var mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  function buildExplosion() {
    var geo = new THREE.SphereGeometry(2, 8, 6);
    var mat = new THREE.MeshBasicMaterial({
      color: 0xFF4400,
      transparent: true,
      opacity: 0.8
    });
    var mesh = new THREE.Mesh(geo, mat);
    var light = new THREE.PointLight(0xFF4400, 3, 25);
    return { mesh: mesh, light: light };
  }

  /* ════════════════════════════════════════════════════════════════════════
     LAUNCH
  ════════════════════════════════════════════════════════════════════════ */

  function launchSubmarineWarfare() {
    if (_active) return;
    _active        = true;
    _missionClear  = false;
    _silentBonus   = true;
    _playerHP      = 100;
    _playerDepth   = -20;
    _playerVelX    = 0;
    _playerVelZ    = 0;
    _playerYaw     = 0;
    _flooding      = false;
    _repairing     = false;
    _repairTimer   = 0;
    _hullHits      = 0;
    _torpedoCount  = 3;
    _torpedoReload = 0;
    _sonarCooldown = 0;
    _sonarActive   = false;
    _playerPinged  = false;
    _silentRunning = false;
    _lockedTarget  = null;
    _torpedoes     = [];
    _sonarRings    = [];
    _depthCharges  = [];
    _explosions    = [];
    _enemies       = [];
    _mines         = [];
    _depotAlive    = true;

    /* Scene background + fog */
    _savedBackground = _scene.background ? _scene.background.clone() : null;
    _savedFog        = _scene.fog || null;
    _scene.background = new THREE.Color(0x001122);
    _scene.fog        = new THREE.FogExp2(0x001A33, 0.03);

    /* Ambient light */
    var ambient = new THREE.AmbientLight(0x002244, 0.5);
    ambient.name = '_sw_ambient';
    _scene.add(ambient);

    /* Player sub */
    _playerSub = buildPlayerSub();
    _playerSub.position.set(0, _playerDepth, 0);
    _scene.add(_playerSub);

    /* Headlight */
    _headLight = new THREE.PointLight(0x0044AA, 2, 30);
    _headLight.position.set(0, _playerDepth, 0);
    _scene.add(_headLight);

    /* Camera behind sub */
    if (_camera) {
      _camera.position.set(0, _playerDepth + 5, 20);
      _camera.lookAt(_playerSub.position);
    }

    /* Repair panel */
    _repairPanel = buildRepairPanel();
    _repairPanel.position.set(10, _playerDepth - 5, -15);
    _scene.add(_repairPanel);

    /* Supply depot on seafloor */
    _depot = buildDepot();
    _depot.position.set(80, -90, -60);
    _scene.add(_depot);

    /* Mines guarding depot */
    var minePositions = [
      new THREE.Vector3(68, -88, -55),
      new THREE.Vector3(92, -88, -65)
    ];
    for (var mi = 0; mi < 2; mi++) {
      var mine = buildMine();
      mine.position.copy(minePositions[mi]);
      _scene.add(mine);
      _mines.push({ mesh: mine, alive: true });
    }

    /* Enemy submarines */
    var enemyStartPositions = [
      new THREE.Vector3(50, -25, -40),
      new THREE.Vector3(-40, -30, -50),
      new THREE.Vector3(30, -35, 60),
      new THREE.Vector3(-60, -20, 30)
    ];
    for (var ei = 0; ei < _enemyCount; ei++) {
      var eGroup = buildEnemySub();
      eGroup.position.copy(enemyStartPositions[ei]);
      _scene.add(eGroup);
      var eLight = new THREE.PointLight(0xFF2200, 0, 12);
      eLight.position.copy(eGroup.position);
      _scene.add(eLight);
      _enemies.push({
        mesh:      eGroup,
        hp:        100,
        vel:       new THREE.Vector3(0, 0, 0),
        alerted:   false,
        fireTimer: 5 + Math.random() * 5,
        alive:     true,
        light:     eLight,
        dcList:    []
      });
    }

    showHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  function createHUD() {
    _hud = document.createElement('div');
    _hud.id = '_sw_hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:12px',
      'color:#00CCFF',
      'font-family:monospace',
      'font-size:13px',
      'background:rgba(0,10,20,0.7)',
      'padding:6px 12px',
      'border-radius:4px',
      'border:1px solid #0044AA',
      'display:none',
      'z-index:9999',
      'pointer-events:none',
      'white-space:pre'
    ].join(';');
    document.body.appendChild(_hud);

    _clearEl = document.createElement('div');
    _clearEl.id = '_sw_clear';
    _clearEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#00FFAA',
      'font-family:monospace',
      'font-size:28px',
      'font-weight:bold',
      'text-align:center',
      'display:none',
      'z-index:10000',
      'pointer-events:none',
      'text-shadow:0 0 12px #00FFAA'
    ].join(';');
    document.body.appendChild(_clearEl);
  }

  function showHUD() {
    _hud.style.display = 'block';
    _clearEl.style.display = 'none';
    updateHUD();
  }

  function updateHUD() {
    if (!_hud || _hud.style.display === 'none') return;
    var aliveCount = 0;
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].alive) aliveCount++;
    }
    var sonarStatus = _sonarCooldown > 0
      ? ('CD ' + Math.ceil(_sonarCooldown) + 's')
      : 'READY';
    var depthStr = Math.round(_playerDepth);
    var hullStr  = Math.max(0, Math.round(_playerHP));
    var torStr   = _torpedoCount;
    var silentStr = _silentRunning ? ' [SILENT]' : '';
    var floodStr  = _flooding     ? ' [FLOODING]' : '';
    _hud.textContent =
      'SUBMARINE [DEPTH: ' + depthStr + 'm] [HULL: ' + hullStr + '%] ' +
      '[TORPEDOES: ' + torStr + '] [SONAR: ' + sonarStatus + '] | ' +
      'ENEMIES: ' + aliveCount + ' SUBS' + silentStr + floodStr;
  }

  function hideHUD() {
    if (_hud) _hud.style.display = 'none';
  }

  /* ════════════════════════════════════════════════════════════════════════
     SONAR PING
  ════════════════════════════════════════════════════════════════════════ */

  function fireSonar() {
    if (!_active) return;
    if (_sonarCooldown > 0) return;
    _sonarCooldown = 8;
    _silentBonus   = false;  // sonar used = no bonus
    _sonarActive   = true;

    var ring = buildSonarRing();
    ring.position.copy(_playerSub.position);
    _scene.add(ring);
    _sonarRings.push({ mesh: ring, life: 0, maxLife: 2 });

    /* Alert enemies in range */
    _playerPinged = true;
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].alive) {
        _enemies[i].alerted = true;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     TORPEDO FIRE
  ════════════════════════════════════════════════════════════════════════ */

  function fireTorpedo() {
    if (!_active) return;
    if (_torpedoCount <= 0) return;

    _torpedoCount--;
    var tMesh = buildTorpedo();
    tMesh.position.copy(_playerSub.position);

    /* Direction: forward from player yaw, or toward locked target */
    var vel = new THREE.Vector3(
      Math.sin(_playerYaw), 0, -Math.cos(_playerYaw)
    ).multiplyScalar(20);

    _scene.add(tMesh);
    _torpedoes.push({
      mesh:   tMesh,
      target: _lockedTarget,
      vel:    vel,
      life:   6
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     DEPTH CHARGE DROP (ENEMY)
  ════════════════════════════════════════════════════════════════════════ */

  function enemyDropDepthCharge(enemy) {
    var dc = buildDepthCharge();
    /* Drop from enemy position toward player depth */
    dc.position.set(
      enemy.mesh.position.x + (Math.random() - 0.5) * 8,
      enemy.mesh.position.y,
      enemy.mesh.position.z + (Math.random() - 0.5) * 8
    );
    _scene.add(dc);
    var entry = {
      mesh:        dc,
      targetDepth: _playerDepth + (Math.random() - 0.5) * 6,
      fuse:        2,
      exploded:    false
    };
    enemy.dcList.push(entry);
    _depthCharges.push(entry);
  }

  /* ════════════════════════════════════════════════════════════════════════
     EXPLOSION
  ════════════════════════════════════════════════════════════════════════ */

  function spawnExplosion(pos, radius) {
    var exp = buildExplosion();
    exp.mesh.position.copy(pos);
    exp.light.position.copy(pos);
    _scene.add(exp.mesh);
    _scene.add(exp.light);
    _explosions.push({ mesh: exp.mesh, light: exp.light, life: 1.2, radius: radius || 5 });
  }

  /* ════════════════════════════════════════════════════════════════════════
     UPDATE LOOP
  ════════════════════════════════════════════════════════════════════════ */

  function update(now) {
    if (!_active) return;

    if (_lastTime === 0) { _lastTime = now; return; }
    var dt = Math.min((now - _lastTime) / 1000, 0.1);
    _lastTime = now;

    _silentRunning = !!_keys['ShiftLeft'] || !!_keys['ShiftRight'];

    /* ── Player movement ───────────────────────────────────────────────── */
    var speed = _silentRunning ? 8 : 16;
    var fwdX = Math.sin(_playerYaw);
    var fwdZ = -Math.cos(_playerYaw);
    var rightX = Math.cos(_playerYaw);
    var rightZ = Math.sin(_playerYaw);

    var moveX = 0, moveZ = 0;
    if (_keys['KeyW']) { moveX += fwdX * speed; moveZ += fwdZ * speed; }
    if (_keys['KeyS']) { moveX -= fwdX * speed; moveZ -= fwdZ * speed; }
    if (_keys['KeyA']) { moveX -= rightX * speed; moveZ -= rightZ * speed; }
    if (_keys['KeyD']) { moveX += rightX * speed; moveZ += rightZ * speed; }

    _playerVelX = moveX;
    _playerVelZ = moveZ;

    /* Dive / Surface */
    if (_keys['KeyQ']) { _playerDepth -= 8 * dt; }
    if (_keys['KeyE'] && !_keys['ShiftLeft'] && !_keys['ShiftRight']) {
      _playerDepth += 6 * dt;
      if (_playerDepth > 0) _playerDepth = 0;
    }

    /* Yaw rotation with A/D when not strafing? Let A/D strafe only.
       For turning, use mouse or let movement handle direction implicitly. */

    _playerSub.position.x += _playerVelX * dt;
    _playerSub.position.z += _playerVelZ * dt;
    _playerSub.position.y  = _playerDepth;
    _playerSub.rotation.y  = _playerYaw;

    /* Propeller spin when engines on */
    if (!_silentRunning && (moveX !== 0 || moveZ !== 0)) {
      _propAngle += 10 * dt;
      if (_propMesh) _propMesh.rotation.x = _propAngle;
    }

    /* Headlight follows sub */
    if (_headLight) {
      _headLight.position.set(
        _playerSub.position.x + fwdX * 7,
        _playerSub.position.y,
        _playerSub.position.z + fwdZ * 7
      );
    }

    /* Camera follows sub */
    if (_camera) {
      _camera.position.set(
        _playerSub.position.x - fwdX * 18,
        _playerSub.position.y + 6,
        _playerSub.position.z - fwdZ * 18
      );
      _camera.lookAt(_playerSub.position);
    }

    /* Scene background depth effect */
    var depthFrac = Math.min(1, Math.max(0, (-_playerDepth) / 120));
    var bgR = Math.round((1 - depthFrac) * 0x00);
    var bgG = Math.round((1 - depthFrac) * 0x11);
    var bgB = Math.round(0x22 - depthFrac * (0x22 - 0x11));
    if (_scene.background) {
      _scene.background.setHex((bgR << 16) | (bgG << 8) | bgB);
    }

    /* ── Sonar cooldown ────────────────────────────────────────────────── */
    if (_sonarCooldown > 0) {
      _sonarCooldown -= dt;
      if (_sonarCooldown < 0) { _sonarCooldown = 0; _sonarActive = false; }
    }

    /* ── Sonar rings expand ────────────────────────────────────────────── */
    for (var si = _sonarRings.length - 1; si >= 0; si--) {
      var sr = _sonarRings[si];
      sr.life += dt;
      var progress = sr.life / sr.maxLife;
      var ringRadius = progress * 30;
      sr.mesh.scale.setScalar(ringRadius > 0.01 ? ringRadius : 0.01);
      sr.mesh.material.opacity = 0.5 * (1 - progress);

      /* Check enemies in sonar range */
      if (sr.life < sr.maxLife) {
        for (var ei2 = 0; ei2 < _enemies.length; ei2++) {
          var en2 = _enemies[ei2];
          if (!en2.alive) continue;
          var dist2 = en2.mesh.position.distanceTo(_playerSub.position);
          if (dist2 <= ringRadius + 2 && dist2 >= ringRadius - 4) {
            /* Enemy pulses */
            en2.light.intensity = 3;
            en2.light.color.setHex(0xFF2200);
          }
        }
      }

      if (sr.life >= sr.maxLife) {
        _scene.remove(sr.mesh);
        _sonarRings.splice(si, 1);
      }
    }

    /* Decay enemy sonar pulse lights */
    for (var eli = 0; eli < _enemies.length; eli++) {
      if (_enemies[eli].alive && _enemies[eli].light.intensity > 0) {
        _enemies[eli].light.intensity *= (1 - dt * 3);
        if (_enemies[eli].light.intensity < 0.05) {
          _enemies[eli].light.intensity = 0;
        }
      }
    }

    /* ── Torpedoes ─────────────────────────────────────────────────────── */
    for (var ti = _torpedoes.length - 1; ti >= 0; ti--) {
      var torp = _torpedoes[ti];
      torp.life -= dt;
      if (torp.life <= 0) {
        _scene.remove(torp.mesh);
        _torpedoes.splice(ti, 1);
        continue;
      }

      /* Homing toward locked target */
      if (torp.target && torp.target.alive) {
        var toTarget = new THREE.Vector3().subVectors(
          torp.target.mesh.position, torp.mesh.position
        ).normalize();
        torp.vel.lerp(toTarget.multiplyScalar(20), dt * 2);
      }

      torp.mesh.position.addScaledVector(torp.vel, dt);

      /* Check hits on enemies */
      var torpHit = false;
      for (var tei = 0; tei < _enemies.length; tei++) {
        var ten = _enemies[tei];
        if (!ten.alive) continue;
        var tdist = torp.mesh.position.distanceTo(ten.mesh.position);
        if (tdist < 3) {
          /* Direct hit */
          ten.hp -= 200;
          spawnExplosion(torp.mesh.position.clone(), 5);
          _scene.remove(torp.mesh);
          _torpedoes.splice(ti, 1);
          torpHit = true;
          if (ten.hp <= 0) { killEnemy(tei); }
          break;
        } else if (tdist < 8) {
          /* Near miss */
          ten.hp -= 50;
          spawnExplosion(torp.mesh.position.clone(), 3);
          _scene.remove(torp.mesh);
          _torpedoes.splice(ti, 1);
          torpHit = true;
          if (ten.hp <= 0) { killEnemy(tei); }
          break;
        }
      }
      if (torpHit) continue;

      /* Torpedo vs depth charges — early detonation */
      for (var dci2 = _depthCharges.length - 1; dci2 >= 0; dci2--) {
        var dc2 = _depthCharges[dci2];
        if (dc2.exploded) continue;
        var dcdist = torp.mesh.position.distanceTo(dc2.mesh.position);
        if (dcdist < 3) {
          detonateDepthCharge(dci2);
          _scene.remove(torp.mesh);
          _torpedoes.splice(ti, 1);
          torpHit = true;
          break;
        }
      }
      if (torpHit) continue;

      /* Torpedo vs depot */
      if (_depotAlive && _depot) {
        var depotDist = torp.mesh.position.distanceTo(_depot.position);
        if (depotDist < 6) {
          destroyDepot();
          spawnExplosion(_depot.position.clone(), 8);
          _scene.remove(torp.mesh);
          _torpedoes.splice(ti, 1);
        }
      }
    }

    /* Torpedo reload */
    if (_torpedoReload > 0) {
      _torpedoReload -= dt;
      if (_torpedoReload <= 0) {
        _torpedoReload = 0;
        _torpedoCount  = 3;
      }
    }

    /* ── Enemy AI ──────────────────────────────────────────────────────── */
    for (var ai = 0; ai < _enemies.length; ai++) {
      var en = _enemies[ai];
      if (!en.alive) continue;

      var toPlayer = new THREE.Vector3().subVectors(
        _playerSub.position, en.mesh.position
      );
      var distToPlayer = toPlayer.length();

      /* Alert if pinged or close enough */
      if (_playerPinged) en.alerted = true;
      if (distToPlayer < 20 && !_silentRunning) en.alerted = true;

      if (en.alerted) {
        /* Chase player */
        var chaseDir = toPlayer.clone().normalize();
        en.vel.lerp(chaseDir.multiplyScalar(6), dt * 1.5);
        en.mesh.position.addScaledVector(en.vel, dt);
        en.light.position.copy(en.mesh.position);

        /* Drop depth charges if close */
        en.fireTimer -= dt;
        if (en.fireTimer <= 0 && distToPlayer < 30) {
          enemyDropDepthCharge(en);
          en.fireTimer = 6 + Math.random() * 4;
        }
      } else {
        /* Patrol: drift slowly */
        en.mesh.position.x += Math.sin(now * 0.0003 + ai * 1.3) * dt * 2;
        en.mesh.position.z += Math.cos(now * 0.0004 + ai * 0.9) * dt * 2;
        en.light.position.copy(en.mesh.position);
      }
    }

    /* ── Depth charges ─────────────────────────────────────────────────── */
    for (var dci = _depthCharges.length - 1; dci >= 0; dci--) {
      var dc = _depthCharges[dci];
      if (dc.exploded) {
        _depthCharges.splice(dci, 1);
        continue;
      }
      /* Sink toward target depth */
      dc.mesh.position.y -= 8 * dt;
      dc.fuse -= dt;

      if (dc.fuse <= 0 || dc.mesh.position.y <= dc.targetDepth) {
        detonateDepthCharge(dci);
      }
    }

    /* ── Flooding / HP ─────────────────────────────────────────────────── */
    if (_flooding) {
      _playerHP -= 2 * dt;
    }
    if (_playerHP <= 0) {
      _playerHP = 0;
      endGame(false);
      return;
    }

    /* ── Repair panel interaction ──────────────────────────────────────── */
    if (_repairPanel) {
      var panelDist = _playerSub.position.distanceTo(_repairPanel.position);
      if (panelDist < 5 && (_keys['KeyE'])) {
        if (!_repairing) {
          _repairing   = true;
          _repairTimer = 10;
        }
      }
    }
    if (_repairing) {
      _repairTimer -= dt;
      if (_repairTimer <= 0) {
        _repairing  = false;
        _flooding   = false;
        _hullHits   = 0;
        _playerHP   = Math.min(100, _playerHP + 40);
      }
    }

    /* ── Depot interaction ─────────────────────────────────────────────── */
    if (_depotAlive && _depot) {
      var depotPlayerDist = _playerSub.position.distanceTo(_depot.position);
      if (depotPlayerDist < 8 && _keys['KeyE']) {
        _torpedoCount  = 3;
        _torpedoReload = 0;
        _flooding      = false;
        _hullHits      = 0;
        _playerHP      = Math.min(100, _playerHP + 60);
      }
    }

    /* ── Mine proximity ────────────────────────────────────────────────── */
    for (var mi2 = 0; mi2 < _mines.length; mi2++) {
      var mine = _mines[mi2];
      if (!mine.alive) continue;
      var mineDist = _playerSub.position.distanceTo(mine.mesh.position);
      if (mineDist < 4) {
        spawnExplosion(mine.mesh.position.clone(), 8);
        _scene.remove(mine.mesh);
        mine.alive = false;
        damagePlayer(80);
      }
    }

    /* ── Explosions ────────────────────────────────────────────────────── */
    for (var xi = _explosions.length - 1; xi >= 0; xi--) {
      var exp = _explosions[xi];
      exp.life -= dt;
      var expProgress = 1 - exp.life / 1.2;
      exp.mesh.scale.setScalar(1 + expProgress * 3);
      exp.mesh.material.opacity = exp.life / 1.2;
      exp.light.intensity = 3 * (exp.life / 1.2);
      if (exp.life <= 0) {
        _scene.remove(exp.mesh);
        _scene.remove(exp.light);
        _explosions.splice(xi, 1);
      }
    }

    /* ── Auto-lock nearest enemy ───────────────────────────────────────── */
    var nearestDist = Infinity;
    _lockedTarget = null;
    for (var li = 0; li < _enemies.length; li++) {
      if (!_enemies[li].alive) continue;
      var ld = _enemies[li].mesh.position.distanceTo(_playerSub.position);
      if (ld < nearestDist) {
        nearestDist   = ld;
        _lockedTarget = _enemies[li];
      }
    }

    /* ── Check mission complete ────────────────────────────────────────── */
    checkMission();

    updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function detonateDepthCharge(idx) {
    var dc = _depthCharges[idx];
    if (!dc || dc.exploded) return;
    dc.exploded = true;
    spawnExplosion(dc.mesh.position.clone(), 8);
    _scene.remove(dc.mesh);

    /* Damage player if in range */
    var distToPlayer = dc.mesh.position.distanceTo(_playerSub.position);
    if (distToPlayer < 8) {
      damagePlayer(80);
    }
  }

  function damagePlayer(amount) {
    _playerHP -= amount;
    _hullHits++;
    if (_hullHits >= 3) {
      _flooding = true;
    }
    if (_playerHP <= 0) {
      _playerHP = 0;
      endGame(false);
    }
  }

  function killEnemy(idx) {
    var en = _enemies[idx];
    if (!en.alive) return;
    en.alive = false;
    spawnExplosion(en.mesh.position.clone(), 8);
    _scene.remove(en.mesh);
    _scene.remove(en.light);
  }

  function destroyDepot() {
    if (!_depotAlive) return;
    _depotAlive = false;
    spawnExplosion(_depot.position.clone(), 12);
    _scene.remove(_depot);
    _depot = null;
    /* Destroy associated mines */
    for (var mi = 0; mi < _mines.length; mi++) {
      if (_mines[mi].alive) {
        spawnExplosion(_mines[mi].mesh.position.clone(), 4);
        _scene.remove(_mines[mi].mesh);
        _mines[mi].alive = false;
      }
    }
  }

  function checkMission() {
    if (_missionClear) return;
    var allEnemiesDead = true;
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].alive) { allEnemiesDead = false; break; }
    }
    if (allEnemiesDead && !_depotAlive) {
      _missionClear = true;
      endGame(true);
    }
  }

  function endGame(success) {
    if (!_active) return;
    _active = false;

    if (_clearEl) {
      _clearEl.style.display = 'block';
      if (success) {
        var bonus = _silentBonus ? '\nSILENT HUNTER BONUS!' : '';
        _clearEl.textContent = 'SEA LANE SECURED!\nMISSION COMPLETE' + bonus;
        _clearEl.style.color = '#00FFAA';
      } else {
        _clearEl.textContent = 'SUBMARINE LOST\nMISSION FAILED';
        _clearEl.style.color = '#FF4444';
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     RESET
  ════════════════════════════════════════════════════════════════════════ */

  function reset() {
    _active = false;

    /* Remove all tracked scene objects */
    if (_playerSub) { _scene.remove(_playerSub); _playerSub = null; }
    if (_headLight) { _scene.remove(_headLight); _headLight = null; }
    if (_repairPanel) { _scene.remove(_repairPanel); _repairPanel = null; }
    if (_depot) { _scene.remove(_depot); _depot = null; }

    for (var i = 0; i < _enemies.length; i++) {
      _scene.remove(_enemies[i].mesh);
      _scene.remove(_enemies[i].light);
      for (var j = 0; j < _enemies[i].dcList.length; j++) {
        _scene.remove(_enemies[i].dcList[j].mesh);
      }
    }
    _enemies = [];

    for (var ti = 0; ti < _torpedoes.length; ti++) { _scene.remove(_torpedoes[ti].mesh); }
    _torpedoes = [];

    for (var si = 0; si < _sonarRings.length; si++) { _scene.remove(_sonarRings[si].mesh); }
    _sonarRings = [];

    for (var dci = 0; dci < _depthCharges.length; dci++) { _scene.remove(_depthCharges[dci].mesh); }
    _depthCharges = [];

    for (var xi = 0; xi < _explosions.length; xi++) {
      _scene.remove(_explosions[xi].mesh);
      _scene.remove(_explosions[xi].light);
    }
    _explosions = [];

    for (var mi = 0; mi < _mines.length; mi++) { _scene.remove(_mines[mi].mesh); }
    _mines = [];

    /* Remove ambient light */
    var swAmbient = _scene.getObjectByName('_sw_ambient');
    if (swAmbient) _scene.remove(swAmbient);

    /* Restore scene */
    if (_savedBackground) _scene.background = _savedBackground;
    if (_savedFog !== null) _scene.fog = _savedFog;
    _savedBackground = null;
    _savedFog        = null;
    _propMesh        = null;

    hideHUD();
    if (_clearEl) _clearEl.style.display = 'none';

    _lastTime = 0;
  }

  /* ════════════════════════════════════════════════════════════════════════
     KEY HANDLERS
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    _keys[e.code] = true;

    /* ── S+W activation ─────────────────────────────────────────────── */
    if (e.code === 'KeyS') { _swPressTime.S = Date.now(); }
    if (e.code === 'KeyW') { _swPressTime.W = Date.now(); }
    if ((e.code === 'KeyS' || e.code === 'KeyW') && !_active) {
      var gap = Math.abs(_swPressTime.S - _swPressTime.W);
      if (gap <= SW_WINDOW && _swPressTime.S > 0 && _swPressTime.W > 0) {
        launchSubmarineWarfare();
        _swPressTime.S = 0;
        _swPressTime.W = 0;
      }
    }

    if (!_active) return;

    /* ── Sonar ──────────────────────────────────────────────────────── */
    if (e.code === 'KeyS') {
      fireSonar();
    }

    /* ── Torpedo ────────────────────────────────────────────────────── */
    if (e.code === 'KeyT') {
      if (_torpedoCount > 0) {
        fireTorpedo();
        if (_torpedoCount <= 0 && _torpedoReload <= 0) {
          _torpedoReload = 30;
        }
      }
    }
  }

  function onKeyUp(e) {
    _keys[e.code] = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;
    _keys   = {};
    _swPressTime = { S: 0, W: 0 };

    createHUD();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
  }

  function publicUpdate(now) {
    update(now);
  }

  function publicReset() {
    reset();
  }

  return {
    init:   init,
    update: publicUpdate,
    reset:  publicReset
  };

}());
