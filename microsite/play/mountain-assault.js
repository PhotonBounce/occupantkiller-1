window.MountainAssault = (function() {
  'use strict';

  var _scene, _camera, _active = false, _group, _hud, _platforms = [], _ropes = [], _enemies = [], _grapples = [];
  var _altitude = 0, _stamina = 100, _ropeHooked = false, _grapplingActive = false;
  var _player, _playerVel = { x: 0, y: 0, z: 0 };
  var _pitons = [], _boulders = [], _mortarWarnings = [], _planks = [], _cables = [];
  var _c4Placed = false, _c4Timer = 0, _c4Active = false;
  var _antenna;
  var _particles = [];
  var _wind = 'CALM';
  var _fogDensity = 0.02;
  var _missionComplete = false;
  var _score = 0;
  var _nearPiton = false, _nearAntenna = false;
  var _mortarTimer = 4, _mortarFired = false;
  var _lastMortarTime = 0;
  var _boulderRolling = false;
  var _boulderResetTimer = 0;
  var _keysDown = {};
  var _keyTimers = {};
  var _clock;
  var _bridgeSevered = false;
  var _enemyBridgeCutTimer = 0;

  // Key handler for M+A simultaneous activation
  function _onKeyDown(e) {
    var key = e.key.toUpperCase();
    _keysDown[key] = true;
    _keyTimers[key] = Date.now();

    // Check M+A simultaneous within 400ms
    if (!_active) {
      if (key === 'A' && _keysDown['M'] && (Date.now() - _keyTimers['M']) < 400) {
        _activate();
      }
      if (key === 'M' && _keysDown['A'] && (Date.now() - _keyTimers['A']) < 400) {
        _activate();
      }
    }

    if (!_active) return;

    if (key === 'E') {
      if (_nearPiton && !_ropeHooked) {
        _hookRope();
      } else if (_nearAntenna && !_c4Active && !_missionComplete) {
        _placeC4();
      }
    }

    if (key === 'G') {
      _grappleHook();
    }
  }

  function _onKeyUp(e) {
    var key = e.key.toUpperCase();
    _keysDown[key] = false;
    if (key === 'G') {
      _grapplingActive = false;
    }
    if (key === 'E') {
      _ropeHooked = false;
    }
  }

  function _activate() {
    if (_active) return;
    _active = true;
    _buildScene();
    _buildHUD();
  }

  function _buildScene() {
    _group = new THREE.Group();
    _scene.add(_group);

    // Build 4 platforms at y=0,8,16,24
    var platformY = [0, 8, 16, 24];
    for (var i = 0; i < platformY.length; i++) {
      var pGeo = new THREE.BoxGeometry(20, 2, 20);
      var pMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
      var pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(0, platformY[i], 0);
      _group.add(pMesh);
      _platforms.push(pMesh);

      // Boulder (CylinderGeometry) on each platform
      var bGeo = new THREE.CylinderGeometry(1.5, 1.5, 1.5, 8);
      var bMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
      var bMesh = new THREE.Mesh(bGeo, bMat);
      bMesh.position.set(5, platformY[i] + 2, -5);
      _group.add(bMesh);
      _boulders.push({ mesh: bMesh, baseY: platformY[i] + 2, rolling: false, startZ: -5 });

      // 3 pitons per level
      for (var j = 0; j < 3; j++) {
        var pitonGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 6);
        var pitonMat = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
        var pitonMesh = new THREE.Mesh(pitonGeo, pitonMat);
        pitonMesh.position.set(-4 + j * 4, platformY[i] + 1.5, -8);
        _group.add(pitonMesh);
        _pitons.push({ mesh: pitonMesh, level: i });
      }

      // Enemy bunker (BoxGeometry)
      var bunkerGeo = new THREE.BoxGeometry(3, 2, 3);
      var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
      var bunkerMesh = new THREE.Mesh(bunkerGeo, bunkerMat);
      bunkerMesh.position.set(-7, platformY[i] + 2, 0);
      _group.add(bunkerMesh);

      // Enemy defender (SphereGeometry for head + BoxGeometry for body)
      var defBodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.8);
      var defBodyMat = new THREE.MeshLambertMaterial({ color: 0x3C5A1E });
      var defBody = new THREE.Mesh(defBodyGeo, defBodyMat);
      defBody.position.set(-7, platformY[i] + 3.6, 0);
      _group.add(defBody);

      var defHeadGeo = new THREE.SphereGeometry(0.35, 6, 6);
      var defHead = new THREE.Mesh(defHeadGeo, defBodyMat);
      defHead.position.set(-7, platformY[i] + 4.55, 0);
      _group.add(defHead);

      var waypoints = [
        new THREE.Vector3(-7, platformY[i] + 3, 0),
        new THREE.Vector3(-3, platformY[i] + 3, 0),
        new THREE.Vector3(-3, platformY[i] + 3, 4),
        new THREE.Vector3(-7, platformY[i] + 3, 4)
      ];

      _enemies.push({
        body: defBody,
        head: defHead,
        level: i,
        waypointIdx: 0,
        waypoints: waypoints,
        speed: 2,
        shootTimer: 0
      });
    }

    // Summit antenna (BoxGeometry 2x6x2)
    var antGeo = new THREE.BoxGeometry(2, 6, 2);
    var antMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
    _antenna = new THREE.Mesh(antGeo, antMat);
    _antenna.position.set(0, 24 + 4, 0);
    _group.add(_antenna);

    // Cone on top of antenna
    var coneGeo = new THREE.ConeGeometry(0.5, 2, 6);
    var coneMat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    var coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.position.set(0, 24 + 8, 0);
    _group.add(coneMesh);

    // Rope bridge between platform levels using LineSegments cables
    for (var lvl = 0; lvl < 3; lvl++) {
      var y0 = platformY[lvl] + 1;
      var y1 = platformY[lvl + 1] + 1;

      // Bridge planks
      for (var p = 0; p < 5; p++) {
        var t = (p + 1) / 6;
        var py = y0 + (y1 - y0) * t;
        var plankGeo = new THREE.BoxGeometry(4, 0.2, 0.8);
        var plankMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var plankMesh = new THREE.Mesh(plankGeo, plankMat);
        plankMesh.position.set(8, py, -6 + p * 1.5);
        _group.add(plankMesh);
        _planks.push({ mesh: plankMesh, level: lvl, falling: false, velY: 0 });
      }

      // Cable LineSegments
      var cablePoints = [];
      for (var cp = 0; cp <= 10; cp++) {
        var ct = cp / 10;
        var cx = 8;
        var cy = y0 + (y1 - y0) * ct - Math.sin(Math.PI * ct) * 1.5;
        var cz = -6 + ct * 7.5;
        cablePoints.push(cx - 1.8, cy, cz);
        cablePoints.push(cx + 1.8, cy, cz);
      }
      var cableGeo = new THREE.BufferGeometry();
      var cableArr = new Float32Array(cablePoints);
      cableGeo.setAttribute('position', new THREE.BufferAttribute(cableArr, 3));
      var cableMat = new THREE.LineBasicMaterial({ color: 0x888888 });
      var cable = new THREE.LineSegments(cableGeo, cableMat);
      _group.add(cable);
      _cables.push({ line: cable, level: lvl });
    }

    // Mortar at y=24
    var mortarBaseGeo = new THREE.CylinderGeometry(0.6, 0.8, 0.5, 8);
    var mortarMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var mortarBase = new THREE.Mesh(mortarBaseGeo, mortarMat);
    mortarBase.position.set(3, 24 + 1.5, 3);
    _group.add(mortarBase);

    var mortarBarrelGeo = new THREE.CylinderGeometry(0.2, 0.25, 1.2, 8);
    var mortarBarrel = new THREE.Mesh(mortarBarrelGeo, mortarMat);
    mortarBarrel.position.set(3, 24 + 2.4, 3);
    mortarBarrel.rotation.x = 0.5;
    _group.add(mortarBarrel);

    // Player representation
    var playerGeo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    var playerMat = new THREE.MeshLambertMaterial({ color: 0x2255AA });
    _player = new THREE.Mesh(playerGeo, playerMat);
    _player.position.set(0, 1.9, 5);
    _group.add(_player);

    // Ambient light
    var ambLight = new THREE.AmbientLight(0x404060, 0.8);
    _group.add(ambLight);

    var dirLight = new THREE.DirectionalLight(0xFFFFDD, 1.0);
    dirLight.position.set(10, 30, 10);
    _group.add(dirLight);

    // Initial fog
    _scene.fog = new THREE.FogExp2(0xCCCCDD, 0.02);
  }

  function _hookRope() {
    _ropeHooked = true;
    // Draw LineSegments rope from player to nearest piton
    var nearestPiton = null;
    var nearestDist = Infinity;
    for (var i = 0; i < _pitons.length; i++) {
      var pitonWorldPos = new THREE.Vector3();
      _pitons[i].mesh.getWorldPosition(pitonWorldPos);
      var d = _player.position.distanceTo(pitonWorldPos);
      if (d < nearestDist) {
        nearestDist = d;
        nearestPiton = _pitons[i];
      }
    }
    if (!nearestPiton) return;

    // Remove old rope if exists
    if (_ropes.length > 0) {
      var oldRope = _ropes.pop();
      _group.remove(oldRope);
    }

    var pitonPos = new THREE.Vector3();
    nearestPiton.mesh.getWorldPosition(pitonPos);

    var ropePoints = new Float32Array([
      _player.position.x, _player.position.y, _player.position.z,
      pitonPos.x, pitonPos.y, pitonPos.z
    ]);
    var ropeGeo = new THREE.BufferGeometry();
    ropeGeo.setAttribute('position', new THREE.BufferAttribute(ropePoints, 3));
    var ropeMat = new THREE.LineBasicMaterial({ color: 0xBB8833 });
    var ropeLine = new THREE.LineSegments(ropeGeo, ropeMat);
    _group.add(ropeLine);
    _ropes.push(ropeLine);
  }

  function _grappleHook() {
    // Launch LineSegments grapple upward
    var grapplePoints = new Float32Array([
      _player.position.x, _player.position.y, _player.position.z,
      _player.position.x, _player.position.y + 8, _player.position.z
    ]);
    var grappleGeo = new THREE.BufferGeometry();
    grappleGeo.setAttribute('position', new THREE.BufferAttribute(grapplePoints, 3));
    var grappleMat = new THREE.LineBasicMaterial({ color: 0x999999 });
    var grappleLine = new THREE.LineSegments(grappleGeo, grappleMat);
    _group.add(grappleLine);
    _grapples.push({ line: grappleLine, timer: 1.5, hooked: false });

    // Check if near a platform edge — if so, activate grappling
    for (var i = 0; i < _platforms.length; i++) {
      var pPos = _platforms[i].position;
      var dx = Math.abs(_player.position.x - pPos.x);
      var dz = Math.abs(_player.position.z - pPos.z);
      var dy = pPos.y - _player.position.y;
      if (dx < 11 && dz < 11 && dy > 0 && dy < 10) {
        _grapplingActive = true;
        _grapples[_grapples.length - 1].hooked = true;
        break;
      }
    }
  }

  function _placeC4() {
    _c4Active = true;
    _c4Timer = 5;
    _c4Placed = true;
    _updateHUD();
  }

  function _spawnMortarWarning(targetX, targetZ) {
    var ringGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.1, 12, 1, true);
    var ringMat = new THREE.MeshLambertMaterial({ color: 0xFFFF00, side: THREE.DoubleSide });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(targetX, 0.1, targetZ);
    _group.add(ring);
    _mortarWarnings.push({ mesh: ring, timer: 4 });
  }

  function _spawnBlizzardParticles() {
    // 20 white SphereGeometry particles
    while (_particles.length < 20) {
      var pGeo = new THREE.SphereGeometry(0.15, 4, 4);
      var pMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
      var pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(
        (Math.random() - 0.5) * 30,
        20 + Math.random() * 12,
        (Math.random() - 0.5) * 30
      );
      _group.add(pMesh);
      _particles.push({
        mesh: pMesh,
        velX: (Math.random() - 0.5) * 3,
        velY: -1 - Math.random() * 2,
        velZ: (Math.random() - 0.5) * 3
      });
    }
  }

  function _removeBlizzardParticles() {
    for (var i = _particles.length - 1; i >= 0; i--) {
      _group.remove(_particles[i].mesh);
    }
    _particles = [];
  }

  function _collapseAntenna() {
    _missionComplete = true;
    _score += 600;
    if (_antenna) {
      _antenna.rotation.z = 0.8;
      _antenna.position.y -= 3;
    }
    _updateHUD();
  }

  function _buildHUD() {
    if (_hud) return;
    _hud = document.createElement('div');
    _hud.id = 'mountain-assault-hud';
    _hud.style.cssText = 'position:fixed;bottom:60px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:#0f0;font-family:monospace;font-size:13px;padding:6px 14px;border:1px solid #0f0;border-radius:3px;z-index:9999;pointer-events:none;white-space:nowrap;';
    document.body.appendChild(_hud);
    _updateHUD();
  }

  function _updateHUD() {
    if (!_hud) return;
    var ropeStr = _ropeHooked ? 'HOOKED' : 'FREE';
    var altM = Math.round(_altitude * 10) / 10;
    var stam = Math.max(0, Math.round(_stamina));
    var windStr = _wind;
    var summit = _missionComplete ? 'REACHED' : '24m';
    var extra = _c4Active ? ' | C4: ' + Math.ceil(_c4Timer) + 's' : '';
    var complete = _missionComplete ? ' | MISSION COMPLETE +600' : '';
    _hud.textContent = 'MOUNTAIN [ALTITUDE: ' + altM + 'm] [STAMINA: ' + stam + '%] [ROPE: ' + ropeStr + '] [SUMMIT: ' + summit + '] | WIND: ' + windStr + extra + complete;
  }

  function _updateEnemies(delta) {
    for (var i = 0; i < _enemies.length; i++) {
      var enemy = _enemies[i];
      var target = enemy.waypoints[enemy.waypointIdx];
      var pos = enemy.body.position;
      var dx = target.x - pos.x;
      var dz = target.z - pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.3) {
        enemy.waypointIdx = (enemy.waypointIdx + 1) % enemy.waypoints.length;
      } else {
        var nx = dx / dist;
        var nz = dz / dist;
        pos.x += nx * enemy.speed * delta;
        pos.z += nz * enemy.speed * delta;
        enemy.head.position.x = pos.x;
        enemy.head.position.z = pos.z;
      }

      // Shoot down at player if enemy is on higher level
      enemy.shootTimer -= delta;
      if (enemy.shootTimer <= 0) {
        enemy.shootTimer = 2 + Math.random() * 2;
        var platformY = [0, 8, 16, 24];
        if (enemy.level > 0 && _player.position.y < platformY[enemy.level]) {
          // Enemy shoots — reduce stamina as proxy for getting hit
          var shotDx = _player.position.x - pos.x;
          var shotDz = _player.position.z - pos.z;
          var shotDist = Math.sqrt(shotDx * shotDx + shotDz * shotDz);
          if (shotDist < 12) {
            _stamina -= 8;
            if (_stamina < 0) _stamina = 0;
          }
        }
      }

      // Enemy on level 3 pushes boulder
      if (enemy.level === 3 && !_boulderRolling) {
        var b3 = _boulders[3];
        if (!b3.rolling && Math.random() < 0.005) {
          b3.rolling = true;
          _boulderRolling = true;
        }
      }

      // Enemy on bridge level severs cable after 15s
      if (enemy.level === 1 && !_bridgeSevered) {
        _enemyBridgeCutTimer += delta;
        if (_enemyBridgeCutTimer > 15) {
          _severBridge(0);
        }
      }
    }
  }

  function _severBridge(lvl) {
    _bridgeSevered = true;
    // Remove cable LineSegments
    for (var i = _cables.length - 1; i >= 0; i--) {
      if (_cables[i].level === lvl) {
        _group.remove(_cables[i].line);
        _cables.splice(i, 1);
      }
    }
    // Make planks fall
    for (var j = 0; j < _planks.length; j++) {
      if (_planks[j].level === lvl) {
        _planks[j].falling = true;
      }
    }
  }

  function _updateBoulders(delta) {
    for (var i = 0; i < _boulders.length; i++) {
      var b = _boulders[i];
      if (b.rolling) {
        b.mesh.position.z += 8 * delta;
        b.mesh.rotation.x += 4 * delta;
        // Check if hits player
        var dx = _player.position.x - b.mesh.position.x;
        var dz = _player.position.z - b.mesh.position.z;
        var dy = _player.position.y - b.mesh.position.y;
        var d = Math.sqrt(dx * dx + dz * dz + dy * dy);
        if (d < 2) {
          _stamina -= 20;
          if (_stamina < 0) _stamina = 0;
          b.mesh.position.set(5, b.baseY, b.startZ);
          b.rolling = false;
          _boulderRolling = false;
        }
        // Reset if off platform
        if (b.mesh.position.z > 15) {
          b.mesh.position.set(5, b.baseY, b.startZ);
          b.rolling = false;
          _boulderRolling = false;
        }
      }
    }
  }

  function _updateMortar(delta, elapsed) {
    if (_player.position.y < 20) return;
    _lastMortarTime += delta;
    if (_lastMortarTime > 4) {
      _lastMortarTime = 0;
      _spawnMortarWarning(_player.position.x, _player.position.z);
    }

    for (var i = _mortarWarnings.length - 1; i >= 0; i--) {
      _mortarWarnings[i].timer -= delta;
      // Flash warning
      _mortarWarnings[i].mesh.visible = (Math.floor(_mortarWarnings[i].timer * 4) % 2 === 0);
      if (_mortarWarnings[i].timer <= 0) {
        // Mortar lands — check player distance
        var wx = _mortarWarnings[i].mesh.position.x;
        var wz = _mortarWarnings[i].mesh.position.z;
        var dx = _player.position.x - wx;
        var dz = _player.position.z - wz;
        if (Math.sqrt(dx * dx + dz * dz) < 2.5) {
          _stamina -= 30;
          if (_stamina < 0) _stamina = 0;
        }
        _group.remove(_mortarWarnings[i].mesh);
        _mortarWarnings.splice(i, 1);
      }
    }
  }

  function _updatePlanks(delta) {
    for (var i = 0; i < _planks.length; i++) {
      if (_planks[i].falling) {
        _planks[i].velY -= 9.8 * delta;
        _planks[i].mesh.position.y += _planks[i].velY * delta;
        _planks[i].mesh.rotation.x += 2 * delta;
        if (_planks[i].mesh.position.y < -10) {
          _planks[i].mesh.visible = false;
        }
      }
    }
  }

  function _updateParticles(delta) {
    for (var i = 0; i < _particles.length; i++) {
      var p = _particles[i];
      p.mesh.position.x += p.velX * delta;
      p.mesh.position.y += p.velY * delta;
      p.mesh.position.z += p.velZ * delta;
      // Respawn at top if fallen
      if (p.mesh.position.y < 18) {
        p.mesh.position.set(
          (Math.random() - 0.5) * 30,
          32,
          (Math.random() - 0.5) * 30
        );
      }
    }
  }

  function _updatePlayer(delta) {
    // Basic player movement via arrow keys / WASD
    var speed = 4;
    var moveX = 0, moveZ = 0;

    if (_keysDown['ARROWLEFT'] || _keysDown['A']) moveX -= speed * delta;
    if (_keysDown['ARROWRIGHT'] || _keysDown['D']) moveX += speed * delta;
    if (_keysDown['ARROWUP'] || _keysDown['W']) moveZ -= speed * delta;
    if (_keysDown['ARROWDOWN'] || _keysDown['S']) moveZ += speed * delta;

    _player.position.x += moveX;
    _player.position.z += moveZ;

    // Gravity / platform collision
    _playerVel.y -= 20 * delta;
    _player.position.y += _playerVel.y * delta;

    // Platform collision
    var landed = false;
    var platformY = [0, 8, 16, 24];
    for (var i = 0; i < _platforms.length; i++) {
      var py = platformY[i] + 1.9;
      var pMesh = _platforms[i];
      if (
        _player.position.y <= py &&
        _player.position.y >= py - 1 &&
        Math.abs(_player.position.x - pMesh.position.x) < 10 &&
        Math.abs(_player.position.z - pMesh.position.z) < 10
      ) {
        _player.position.y = py;
        _playerVel.y = 0;
        landed = true;
      }
    }

    // Ground floor
    if (_player.position.y < 1.9) {
      _player.position.y = 1.9;
      _playerVel.y = 0;
      landed = true;
    }

    // Clamp horizontal
    _player.position.x = Math.max(-12, Math.min(12, _player.position.x));
    _player.position.z = Math.max(-12, Math.min(12, _player.position.z));

    // Rope descent with CTRL
    if (_ropeHooked && (_keysDown['CONTROL'] || _keysDown['CONTROLLEFT'] || _keysDown['CONTROLRIGHT'])) {
      _player.position.y -= 3 * delta;
    }

    // Grapple ascent while G held
    if (_grapplingActive && _keysDown['G']) {
      _player.position.y += 5 * delta;
      _stamina -= 15 * delta;
    }

    // Jump with Space
    if (_keysDown[' '] && landed) {
      _playerVel.y = 8;
    }

    // Update altitude
    _altitude = Math.max(0, _player.position.y - 1.9);

    // Stamina recovery
    if (!_grapplingActive) {
      _stamina = Math.min(100, _stamina + 5 * delta);
    }

    // Update rope line position
    if (_ropeHooked && _ropes.length > 0) {
      var nearestPiton = null;
      var nearestDist = Infinity;
      for (var pi = 0; pi < _pitons.length; pi++) {
        var pitonWorldPos = new THREE.Vector3();
        _pitons[pi].mesh.getWorldPosition(pitonWorldPos);
        var pdist = _player.position.distanceTo(pitonWorldPos);
        if (pdist < nearestDist) {
          nearestDist = pdist;
          nearestPiton = _pitons[pi];
        }
      }
      if (nearestPiton) {
        var ppPos = new THREE.Vector3();
        nearestPiton.mesh.getWorldPosition(ppPos);
        var ropeGeoRef = _ropes[_ropes.length - 1].geometry;
        var posArr = ropeGeoRef.attributes.position.array;
        posArr[0] = _player.position.x; posArr[1] = _player.position.y; posArr[2] = _player.position.z;
        posArr[3] = ppPos.x; posArr[4] = ppPos.y; posArr[5] = ppPos.z;
        ropeGeoRef.attributes.position.needsUpdate = true;
      }
    }

    // Check nearPiton
    _nearPiton = false;
    for (var ni = 0; ni < _pitons.length; ni++) {
      var npp = new THREE.Vector3();
      _pitons[ni].mesh.getWorldPosition(npp);
      if (_player.position.distanceTo(npp) < 3) {
        _nearPiton = true;
        break;
      }
    }

    // Check nearAntenna
    _nearAntenna = false;
    if (_antenna) {
      var antDist = _player.position.distanceTo(_antenna.position);
      if (antDist < 5) {
        _nearAntenna = true;
      }
    }

    // C4 countdown
    if (_c4Active && !_missionComplete) {
      _c4Timer -= delta;
      if (_c4Timer <= 0) {
        _collapseAntenna();
      }
    }

    // Update fog based on altitude
    if (_altitude > 20) {
      _fogDensity = 0.12;
      _wind = 'HEAVY';
      if (_particles.length === 0) _spawnBlizzardParticles();
    } else if (_altitude > 12) {
      _fogDensity = 0.06;
      _wind = 'HEAVY';
      if (_particles.length > 0) _removeBlizzardParticles();
    } else {
      _fogDensity = 0.02;
      _wind = 'CALM';
      if (_particles.length > 0) _removeBlizzardParticles();
    }
    if (_scene.fog) {
      _scene.fog.density = _fogDensity;
    }

    // Expire old grapple lines
    for (var gi = _grapples.length - 1; gi >= 0; gi--) {
      _grapples[gi].timer -= delta;
      if (_grapples[gi].timer <= 0) {
        _group.remove(_grapples[gi].line);
        _grapples.splice(gi, 1);
        if (!_grapplingActive) {
          // no-op
        }
      }
    }
  }

  function init(scene, camera) {
    _scene = scene;
    _camera = camera;
    _clock = new THREE.Clock();
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup', _onKeyUp);
  }

  function update() {
    if (!_active) return;
    var delta = _clock.getDelta();
    if (delta > 0.1) delta = 0.1;

    _updatePlayer(delta);
    _updateEnemies(delta);
    _updateBoulders(delta);
    _updateMortar(delta);
    _updatePlanks(delta);
    _updateParticles(delta);
    _updateHUD();

    // Camera follows player
    if (_camera) {
      _camera.position.set(
        _player.position.x,
        _player.position.y + 6,
        _player.position.z + 14
      );
      _camera.lookAt(_player.position);
    }
  }

  function reset() {
    _active = false;
    _ropeHooked = false;
    _grapplingActive = false;
    _altitude = 0;
    _stamina = 100;
    _c4Active = false;
    _c4Placed = false;
    _c4Timer = 0;
    _missionComplete = false;
    _score = 0;
    _wind = 'CALM';
    _fogDensity = 0.02;
    _bridgeSevered = false;
    _enemyBridgeCutTimer = 0;
    _boulderRolling = false;
    _lastMortarTime = 0;
    _keysDown = {};
    _keyTimers = {};

    if (_group) {
      _scene.remove(_group);
      _group = null;
    }
    if (_hud && _hud.parentNode) {
      _hud.parentNode.removeChild(_hud);
      _hud = null;
    }
    _platforms = [];
    _ropes = [];
    _enemies = [];
    _grapples = [];
    _pitons = [];
    _boulders = [];
    _mortarWarnings = [];
    _planks = [];
    _cables = [];
    _particles = [];
    _antenna = null;
    _player = null;

    if (_scene && _scene.fog) {
      _scene.fog = null;
    }

    window.removeEventListener('keydown', _onKeyDown);
    window.removeEventListener('keyup', _onKeyUp);
  }

  return { init: init, update: update, reset: reset };
})();
