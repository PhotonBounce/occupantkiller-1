window.EnvironmentalHazards = (function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Private state
  // ---------------------------------------------------------------------------
  var _scene = null;
  var _camera = null;
  var _hazards = [];          // all active hazard objects
  var _knownTrapPositions = []; // positions that AI knows about
  var _clock = null;

  // References injected or grabbed from window globals
  var _player = null;         // { position, takeDamage }
  var _enemies = null;        // array of enemy objects

  // Disarm mini-game state
  var _disarmTarget = null;
  var _disarmProgress = 0;
  var _disarmActive = false;
  var _DISARM_TIME = 3.0; // seconds

  // Input tracking
  var _eKeyHeld = false;
  var _altHeld = false;
  var _ctrlHeld = false;

  // Hazard type constants
  var TYPE_PIT_TRAP        = 'PIT_TRAP';
  var TYPE_SPIKE_TRAP      = 'SPIKE_TRAP';
  var TYPE_ELECTRIC_FENCE  = 'ELECTRIC_FENCE';
  var TYPE_COLLAPSING_FLOOR = 'COLLAPSING_FLOOR';
  var TYPE_FIRE_PIT        = 'FIRE_PIT';

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function _dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = (a.z !== undefined ? a.z : 0) - (b.z !== undefined ? b.z : 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3D(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _getPlayerObj() {
    if (_player) return _player;
    if (window.PlayerState) return window.PlayerState;
    if (window.player) return window.player;
    return null;
  }

  function _getEnemiesArr() {
    if (_enemies) return _enemies;
    if (window.EnemyManager && window.EnemyManager.getEnemies) return window.EnemyManager.getEnemies();
    if (window.enemies) return window.enemies;
    return [];
  }

  function _dealDamageToPlayer(dmg) {
    var p = _getPlayerObj();
    if (!p) return;
    if (p.takeDamage) { p.takeDamage(dmg); return; }
    if (p.health !== undefined) { p.health = Math.max(0, p.health - dmg); }
  }

  function _dealDamageToEnemy(enemy, dmg) {
    if (!enemy) return;
    if (enemy.takeDamage) { enemy.takeDamage(dmg); return; }
    if (enemy.health !== undefined) { enemy.health = Math.max(0, enemy.health - dmg); }
  }

  function _stunEnemy(enemy, duration) {
    if (!enemy) return;
    if (enemy.stun) { enemy.stun(duration); return; }
    enemy._stunTimer = duration;
  }

  function _getPlayerPosition() {
    var p = _getPlayerObj();
    if (!p) return new THREE.Vector3(0, 0, 0);
    if (p.position) return p.position;
    if (_camera) return _camera.position;
    return new THREE.Vector3(0, 0, 0);
  }

  function _isNightVisionActive() {
    if (window.NightVision && window.NightVision.isActive) return window.NightVision.isActive();
    if (window.nightVisionActive) return window.nightVisionActive;
    return false;
  }

  function _isReconDroneActive() {
    if (window.ReconDrone && window.ReconDrone.isActive) return window.ReconDrone.isActive();
    if (window.reconDroneActive) return window.reconDroneActive;
    return false;
  }

  function _playFireSFX(position) {
    if (window.AudioSystem && window.AudioSystem.playAtPosition) {
      window.AudioSystem.playAtPosition('fire', position);
    }
  }

  function _playElectricSFX(position) {
    if (window.AudioSystem && window.AudioSystem.playAtPosition) {
      window.AudioSystem.playAtPosition('electric', position);
    }
  }

  function _showWarningFlash(hazard) {
    if (!hazard.mesh) return;
    hazard._warningActive = true;
    hazard._warningTimer = 0.5;
    // store original material colors to restore later
    if (hazard.mesh.material && !hazard._origColor) {
      hazard._origColor = hazard.mesh.material.color ? hazard.mesh.material.color.clone() : null;
      hazard._origEmissive = hazard.mesh.material.emissive ? hazard.mesh.material.emissive.clone() : null;
    }
    if (hazard.mesh.material && hazard.mesh.material.emissive) {
      hazard.mesh.material.emissive.setHex(0xff0000);
      hazard.mesh.material.emissiveIntensity = 1.0;
    }
  }

  function _clearWarningFlash(hazard) {
    hazard._warningActive = false;
    if (hazard.mesh && hazard.mesh.material) {
      if (hazard._origEmissive) {
        hazard.mesh.material.emissive.copy(hazard._origEmissive);
      }
      hazard.mesh.material.emissiveIntensity = 0;
    }
  }

  // ---------------------------------------------------------------------------
  // PIT TRAP
  // ---------------------------------------------------------------------------
  function _createPitTrap(scene, x, y, z) {
    var geo = new THREE.BoxGeometry(2, 0.1, 2);
    var mat = new THREE.MeshLambertMaterial({ color: 0x8b6914, transparent: true, opacity: 0 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);

    var hazard = {
      type: TYPE_PIT_TRAP,
      mesh: mesh,
      position: new THREE.Vector3(x, y, z),
      triggerRadius: 1.0,
      triggered: false,
      triggeredTimer: 0,
      resetTimer: 0,
      state: 'idle',   // idle | warning | collapsing | fallen | resetting
      _warningActive: false,
      _warningTimer: 0,
      _origColor: null,
      _origEmissive: null,
      _playerWasFalling: false
    };
    return hazard;
  }

  function _updatePitTrap(hazard, dt, playerPos, enemies) {
    if (hazard.state === 'idle') {
      var dist = _dist2D(playerPos, hazard.position);
      if (dist < hazard.triggerRadius) {
        hazard.state = 'warning';
        _showWarningFlash(hazard);
        hazard._warningTimer = 0.5;
      }
    } else if (hazard.state === 'warning') {
      hazard._warningTimer -= dt;
      if (hazard._warningTimer <= 0) {
        _clearWarningFlash(hazard);
        hazard.state = 'collapsing';
        hazard.triggeredTimer = 0;
        // Make visible so player sees the hole
        hazard.mesh.material.opacity = 0.01; // nearly invisible pit
      }
    } else if (hazard.state === 'collapsing') {
      // Animate floor collapsing — scale.y to 0 over 0.3s
      hazard.triggeredTimer += dt;
      var progress = Math.min(hazard.triggeredTimer / 0.3, 1.0);
      hazard.mesh.scale.y = 1.0 - progress;
      if (progress >= 1.0) {
        hazard.state = 'fallen';
        hazard.resetTimer = 0;
        _knownTrapPositions.push({ x: hazard.position.x, z: hazard.position.z });
      }
      // Apply fall damage when player is over it
      var dist = _dist2D(playerPos, hazard.position);
      if (dist < hazard.triggerRadius && !hazard._playerWasFalling) {
        hazard._playerWasFalling = true;
        _dealDamageToPlayer(30);
      }
    } else if (hazard.state === 'fallen') {
      hazard.resetTimer += dt;
      if (hazard.resetTimer >= 8.0) {
        // Reset
        hazard.state = 'idle';
        hazard.mesh.scale.y = 1.0;
        hazard.mesh.material.opacity = 0;
        hazard._playerWasFalling = false;
        hazard.resetTimer = 0;
        hazard.triggeredTimer = 0;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // SPIKE TRAP
  // ---------------------------------------------------------------------------
  function _createSpikeTrap(scene, x, y, z) {
    // Flat plate (hidden)
    var plateGeo = new THREE.BoxGeometry(2, 0.05, 2);
    var plateMat = new THREE.MeshLambertMaterial({ color: 0x555555, transparent: true, opacity: 0 });
    var plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.set(x, y, z);
    scene.add(plateMesh);

    // 8 spike pillars
    var spikes = [];
    var spikePositions = [
      [-0.6, -0.6], [ 0,  -0.6], [0.6, -0.6],
      [-0.6,  0  ],               [0.6,  0  ],
      [-0.6,  0.6], [ 0,   0.6], [0.6,  0.6]
    ];
    var spikeMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    for (var i = 0; i < spikePositions.length; i++) {
      var spikeGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.8, 6);
      var spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.set(x + spikePositions[i][0], y - 0.5, z + spikePositions[i][1]);
      spike.visible = false;
      scene.add(spike);
      spikes.push(spike);
    }

    var hazard = {
      type: TYPE_SPIKE_TRAP,
      mesh: plateMesh,
      spikes: spikes,
      position: new THREE.Vector3(x, y, z),
      triggerRadius: 1.2,
      state: 'idle',
      _warningActive: false,
      _warningTimer: 0,
      _origColor: null,
      _origEmissive: null,
      _riseProgress: 0,
      resetTimer: 0,
      _damagedEntities: []   // track who was already damaged this trigger
    };
    return hazard;
  }

  function _updateSpikeTrap(hazard, dt, playerPos, enemies) {
    if (hazard.state === 'idle') {
      var distPlayer = _dist2D(playerPos, hazard.position);
      var triggered = distPlayer < hazard.triggerRadius;

      // Also check enemies
      var triggeringEnemy = null;
      if (!triggered) {
        for (var i = 0; i < enemies.length; i++) {
          var epos = enemies[i].position || (enemies[i].mesh && enemies[i].mesh.position);
          if (epos && _dist2D(epos, hazard.position) < hazard.triggerRadius) {
            triggered = true;
            triggeringEnemy = enemies[i];
            break;
          }
        }
      }

      if (triggered) {
        hazard.state = 'warning';
        hazard._warningTimer = 0.5;
        hazard._damagedEntities = [];
        _showWarningFlash(hazard);
      }
    } else if (hazard.state === 'warning') {
      hazard._warningTimer -= dt;
      if (hazard._warningTimer <= 0) {
        _clearWarningFlash(hazard);
        hazard.state = 'rising';
        hazard._riseProgress = 0;
        // Make plate visible
        hazard.mesh.material.opacity = 0.6;
        for (var s = 0; s < hazard.spikes.length; s++) {
          hazard.spikes[s].visible = true;
        }
      }
    } else if (hazard.state === 'rising') {
      hazard._riseProgress += dt / 0.4; // rise over 0.4s
      if (hazard._riseProgress > 1.0) hazard._riseProgress = 1.0;

      // Animate spikes rising
      for (var s = 0; s < hazard.spikes.length; s++) {
        hazard.spikes[s].position.y = (hazard.position.y - 0.5) + hazard._riseProgress * 0.9;
      }

      // Deal damage
      var distPlayer = _dist2D(playerPos, hazard.position);
      if (distPlayer < hazard.triggerRadius) {
        var pid = 'player';
        if (hazard._damagedEntities.indexOf(pid) === -1) {
          hazard._damagedEntities.push(pid);
          _dealDamageToPlayer(50);
        }
      }
      for (var ei = 0; ei < enemies.length; ei++) {
        var epos = enemies[ei].position || (enemies[ei].mesh && enemies[ei].mesh.position);
        if (epos && _dist2D(epos, hazard.position) < hazard.triggerRadius) {
          var eid = 'enemy_' + ei;
          if (hazard._damagedEntities.indexOf(eid) === -1) {
            hazard._damagedEntities.push(eid);
            _dealDamageToEnemy(enemies[ei], 50);
            _stunEnemy(enemies[ei], 2.0);
          }
        }
      }

      if (hazard._riseProgress >= 1.0) {
        hazard.state = 'extended';
        hazard.resetTimer = 0;
        _knownTrapPositions.push({ x: hazard.position.x, z: hazard.position.z });
      }
    } else if (hazard.state === 'extended') {
      hazard.resetTimer += dt;
      if (hazard.resetTimer >= 8.0) {
        // Retract spikes
        hazard.state = 'idle';
        hazard._riseProgress = 0;
        for (var s = 0; s < hazard.spikes.length; s++) {
          hazard.spikes[s].position.y = hazard.position.y - 0.5;
          hazard.spikes[s].visible = false;
        }
        hazard.mesh.material.opacity = 0;
        hazard.resetTimer = 0;
        hazard._damagedEntities = [];
      }
    }
  }

  // ---------------------------------------------------------------------------
  // ELECTRIC FENCE
  // ---------------------------------------------------------------------------
  function _createElectricFence(scene, x, y, z) {
    var postMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

    // Two posts
    var postGeoA = new THREE.BoxGeometry(0.15, 2.0, 0.15);
    var postA = new THREE.Mesh(postGeoA, postMat);
    postA.position.set(x - 1.0, y + 1.0, z);
    scene.add(postA);

    var postGeoB = new THREE.BoxGeometry(0.15, 2.0, 0.15);
    var postB = new THREE.Mesh(postGeoB, postMat);
    postB.position.set(x + 1.0, y + 1.0, z);
    scene.add(postB);

    // Electric arc: small sphere dots moving along the line
    var arcDots = [];
    var arcMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    for (var i = 0; i < 6; i++) {
      var dotGeo = new THREE.SphereGeometry(0.04, 4, 4);
      var dot = new THREE.Mesh(dotGeo, arcMat.clone());
      dot.position.set(x - 1.0 + (i / 5) * 2.0, y + 1.0, z);
      dot._offset = i / 6.0;
      scene.add(dot);
      arcDots.push(dot);
    }

    // Line connecting posts (visual)
    var points = [
      new THREE.Vector3(x - 1.0, y + 1.0, z),
      new THREE.Vector3(x + 1.0, y + 1.0, z)
    ];
    var lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    var lineMat = new THREE.LineBasicMaterial({ color: 0x00ffff, opacity: 0.5, transparent: true });
    var line = new THREE.Line(lineGeo, lineMat);
    scene.add(line);

    var hazard = {
      type: TYPE_ELECTRIC_FENCE,
      mesh: postA,       // representative mesh for warning flash
      postA: postA,
      postB: postB,
      line: line,
      arcDots: arcDots,
      position: new THREE.Vector3(x, y + 1.0, z),
      state: 'active',   // electric fence is always active
      _arcTime: 0,
      _damageCooldown: 0,
      _warningActive: false,
      _warningTimer: 0,
      _origColor: null,
      _origEmissive: null,
      resetTimer: 0
    };
    return hazard;
  }

  function _updateElectricFence(hazard, dt, playerPos, enemies) {
    hazard._arcTime += dt * 3.0;

    // Animate arc dots
    for (var i = 0; i < hazard.arcDots.length; i++) {
      var dot = hazard.arcDots[i];
      var t = ((dot._offset + hazard._arcTime * 0.15) % 1.0);
      var baseX = hazard.postA.position.x;
      var endX  = hazard.postB.position.x;
      dot.position.x = baseX + t * (endX - baseX);
      // Add small vertical jitter for arc effect
      dot.position.y = hazard.position.y + Math.sin(t * Math.PI * 4 + hazard._arcTime) * 0.08;
      // Flicker opacity
      dot.material.opacity = 0.5 + Math.random() * 0.5;
    }

    hazard._damageCooldown -= dt;

    // Check player collision with fence zone
    var fenceMinX = hazard.postA.position.x - 0.2;
    var fenceMaxX = hazard.postB.position.x + 0.2;
    var fenceY    = hazard.position.y;
    var fenceZ    = hazard.position.z;

    var px = playerPos.x, py = playerPos.y, pz = playerPos.z;
    var inFenceX = px >= fenceMinX && px <= fenceMaxX;
    var inFenceZ = Math.abs(pz - fenceZ) < 0.4;
    var inFenceY = Math.abs(py - fenceY) < 1.0;

    if (inFenceX && inFenceZ && inFenceY && hazard._damageCooldown <= 0) {
      _dealDamageToPlayer(20 * dt);
      _playElectricSFX(hazard.position);
    }

    // Check enemies
    for (var ei = 0; ei < enemies.length; ei++) {
      var epos = enemies[ei].position || (enemies[ei].mesh && enemies[ei].mesh.position);
      if (!epos) continue;
      var ex = epos.x, ey = epos.y, ez = epos.z;
      var eInX = ex >= fenceMinX && ex <= fenceMaxX;
      var eInZ = Math.abs(ez - fenceZ) < 0.4;
      var eInY = Math.abs(ey - fenceY) < 1.0;
      if (eInX && eInZ && eInY && hazard._damageCooldown <= 0) {
        _dealDamageToEnemy(enemies[ei], 20 * dt);
      }
    }

    if (hazard._damageCooldown <= 0) hazard._damageCooldown = 0; // clamp
  }

  // ---------------------------------------------------------------------------
  // COLLAPSING FLOOR
  // ---------------------------------------------------------------------------
  function _createCollapsingFloor(scene, x, y, z) {
    var geo = new THREE.BoxGeometry(3, 0.2, 3);
    // Cracked appearance via color
    var mat = new THREE.MeshLambertMaterial({ color: 0x9e8a6e });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);

    // Cracked lines overlay
    var crackMat = new THREE.MeshBasicMaterial({ color: 0x3a2a1a, wireframe: true });
    var crackGeo = new THREE.BoxGeometry(3, 0.21, 3, 4, 1, 4);
    var crackMesh = new THREE.Mesh(crackGeo, crackMat);
    crackMesh.position.set(x, y, z);
    scene.add(crackMesh);

    var hazard = {
      type: TYPE_COLLAPSING_FLOOR,
      mesh: mesh,
      crackMesh: crackMesh,
      position: new THREE.Vector3(x, y, z),
      triggerRadius: 2.0,
      state: 'idle',    // idle | warning | collapsing | fallen | resetting
      _warningActive: false,
      _warningTimer: 0,
      _origColor: null,
      _origEmissive: null,
      _collapseProgress: 0,
      resetTimer: 0,
      _weightThreshold: 3,  // player (1) + 2 enemies = 3 units
      _playerDamaged: false
    };
    return hazard;
  }

  function _updateCollapsingFloor(hazard, dt, playerPos, enemies) {
    if (hazard.state === 'idle') {
      // Count "weight" on the floor
      var weight = 0;
      var distPlayer = _dist2D(playerPos, hazard.position);
      if (distPlayer < hazard.triggerRadius) weight += 1;

      for (var ei = 0; ei < enemies.length; ei++) {
        var epos = enemies[ei].position || (enemies[ei].mesh && enemies[ei].mesh.position);
        if (epos && _dist2D(epos, hazard.position) < hazard.triggerRadius) weight += 1;
      }

      if (weight >= hazard._weightThreshold) {
        hazard.state = 'warning';
        hazard._warningTimer = 0.5;
        _showWarningFlash(hazard);
      }
    } else if (hazard.state === 'warning') {
      hazard._warningTimer -= dt;
      if (hazard._warningTimer <= 0) {
        _clearWarningFlash(hazard);
        hazard.state = 'collapsing';
        hazard._collapseProgress = 0;
        hazard._playerDamaged = false;
      }
    } else if (hazard.state === 'collapsing') {
      hazard._collapseProgress += dt / 0.5;
      if (hazard._collapseProgress > 1.0) hazard._collapseProgress = 1.0;

      // Sink the floor
      hazard.mesh.position.y = hazard.position.y - hazard._collapseProgress * 2.0;
      hazard.crackMesh.position.y = hazard.mesh.position.y;

      // Damage player if on it
      var distPlayer = _dist2D(playerPos, hazard.position);
      if (distPlayer < hazard.triggerRadius && !hazard._playerDamaged) {
        hazard._playerDamaged = true;
        _dealDamageToPlayer(40);
      }
      // Damage enemies
      for (var ei = 0; ei < enemies.length; ei++) {
        var epos = enemies[ei].position || (enemies[ei].mesh && enemies[ei].mesh.position);
        if (epos && _dist2D(epos, hazard.position) < hazard.triggerRadius) {
          if (!enemies[ei]._collapseFloorDamaged) {
            enemies[ei]._collapseFloorDamaged = true;
            _dealDamageToEnemy(enemies[ei], 40);
          }
        }
      }

      if (hazard._collapseProgress >= 1.0) {
        hazard.state = 'fallen';
        hazard.resetTimer = 0;
        _knownTrapPositions.push({ x: hazard.position.x, z: hazard.position.z });
      }
    } else if (hazard.state === 'fallen') {
      hazard.resetTimer += dt;
      if (hazard.resetTimer >= 8.0) {
        hazard.state = 'idle';
        hazard.mesh.position.y = hazard.position.y;
        hazard.crackMesh.position.y = hazard.position.y;
        hazard._collapseProgress = 0;
        hazard._playerDamaged = false;
        hazard.resetTimer = 0;
        // Clear enemy damage flags
        var enemies2 = _getEnemiesArr();
        for (var ei = 0; ei < enemies2.length; ei++) {
          enemies2[ei]._collapseFloorDamaged = false;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // FIRE PIT
  // ---------------------------------------------------------------------------
  function _createFirePit(scene, x, y, z) {
    // Base circle
    var geo = new THREE.CylinderGeometry(1.0, 1.0, 0.05, 16);
    var mat = new THREE.MeshLambertMaterial({ color: 0x1a0a00 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);

    // Fire particles
    var particles = [];
    var particleMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true });
    for (var i = 0; i < 20; i++) {
      var pGeo = new THREE.SphereGeometry(0.05 + Math.random() * 0.05, 4, 4);
      var pMat = particleMat.clone();
      var angle = Math.random() * Math.PI * 2;
      var radius = Math.random() * 0.8;
      var particle = new THREE.Mesh(pGeo, pMat);
      particle.position.set(
        x + Math.cos(angle) * radius,
        y + Math.random() * 0.5,
        z + Math.sin(angle) * radius
      );
      particle._baseX = x + Math.cos(angle) * radius;
      particle._baseZ = z + Math.sin(angle) * radius;
      particle._speed = 0.5 + Math.random() * 1.0;
      particle._phase = Math.random() * Math.PI * 2;
      particle._maxHeight = 0.5 + Math.random() * 1.0;
      scene.add(particle);
      particles.push(particle);
    }

    var hazard = {
      type: TYPE_FIRE_PIT,
      mesh: mesh,
      particles: particles,
      position: new THREE.Vector3(x, y, z),
      triggerRadius: 1.0,
      state: 'active',
      _damageTimer: 0,
      _particleTime: 0,
      _sfxTimer: 0,
      _warningActive: false,
      _warningTimer: 0,
      _origColor: null,
      _origEmissive: null,
      resetTimer: 0
    };
    return hazard;
  }

  function _updateFirePit(hazard, dt, playerPos, enemies) {
    hazard._particleTime += dt;
    hazard._sfxTimer -= dt;

    // Animate particles rising and fading
    for (var i = 0; i < hazard.particles.length; i++) {
      var p = hazard.particles[i];
      var t = ((hazard._particleTime * p._speed + p._phase) % (Math.PI * 2));
      var heightFrac = (Math.sin(t) * 0.5 + 0.5);
      p.position.y = hazard.position.y + heightFrac * p._maxHeight;
      p.material.opacity = 1.0 - heightFrac * 0.8;
      // Flicker color between orange and yellow
      p.material.color.setHex(heightFrac > 0.5 ? 0xffcc00 : 0xff4400);
    }

    hazard._damageTimer += dt;

    // Check player
    var distPlayer = _dist2D(playerPos, hazard.position);
    if (distPlayer < hazard.triggerRadius) {
      _dealDamageToPlayer(25 * dt);
      if (hazard._sfxTimer <= 0) {
        _playFireSFX(hazard.position);
        hazard._sfxTimer = 1.0;
      }
    }

    // Check enemies
    for (var ei = 0; ei < enemies.length; ei++) {
      var epos = enemies[ei].position || (enemies[ei].mesh && enemies[ei].mesh.position);
      if (epos && _dist2D(epos, hazard.position) < hazard.triggerRadius) {
        _dealDamageToEnemy(enemies[ei], 25 * dt);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // spawnHazard — public
  // ---------------------------------------------------------------------------
  function spawnHazard(scene, x, y, z, type) {
    var hazard = null;

    if (type === TYPE_PIT_TRAP) {
      hazard = _createPitTrap(scene, x, y, z);
    } else if (type === TYPE_SPIKE_TRAP) {
      hazard = _createSpikeTrap(scene, x, y, z);
    } else if (type === TYPE_ELECTRIC_FENCE) {
      hazard = _createElectricFence(scene, x, y, z);
    } else if (type === TYPE_COLLAPSING_FLOOR) {
      hazard = _createCollapsingFloor(scene, x, y, z);
    } else if (type === TYPE_FIRE_PIT) {
      hazard = _createFirePit(scene, x, y, z);
    } else {
      console.warn('[EnvironmentalHazards] Unknown hazard type:', type);
      return null;
    }

    if (hazard) {
      _hazards.push(hazard);
    }
    return hazard;
  }

  // ---------------------------------------------------------------------------
  // populateLevel — public
  // ---------------------------------------------------------------------------
  function populateLevel(scene, count) {
    var types = [
      TYPE_PIT_TRAP,
      TYPE_SPIKE_TRAP,
      TYPE_ELECTRIC_FENCE,
      TYPE_COLLAPSING_FLOOR,
      TYPE_FIRE_PIT
    ];

    var placed = 0;
    var total = count || 6;

    // Place 2-4 hazards per "zone" (random positions in a 40x40 area)
    while (placed < total) {
      var groupSize = 2 + Math.floor(Math.random() * 3); // 2–4
      for (var g = 0; g < groupSize && placed < total; g++) {
        var type = types[Math.floor(Math.random() * types.length)];
        var rx = (Math.random() - 0.5) * 40;
        var rz = (Math.random() - 0.5) * 40;
        spawnHazard(scene, rx, 0, rz, type);
        placed++;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Trap outline for NightVision / ReconDrone
  // ---------------------------------------------------------------------------
  function _updateTrapVisibility() {
    var reveal = _isNightVisionActive() || _isReconDroneActive();
    for (var i = 0; i < _hazards.length; i++) {
      var h = _hazards[i];
      if (!h.mesh) continue;
      if (h.type === TYPE_PIT_TRAP || h.type === TYPE_SPIKE_TRAP) {
        // Show/hide outline hint
        if (reveal && h.state === 'idle') {
          h.mesh.material.opacity = 0.15;
          if (h.mesh.material.emissive) {
            h.mesh.material.emissive.setHex(0x00ffcc);
            h.mesh.material.emissiveIntensity = 0.4;
          }
        } else if (!reveal && h.state === 'idle' && !h._warningActive) {
          h.mesh.material.opacity = 0;
          if (h.mesh.material.emissive) {
            h.mesh.material.emissiveIntensity = 0;
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // AI path-around logic helpers (called by AI system via getKnownTrapPositions)
  // ---------------------------------------------------------------------------
  function _shouldEnemyAvoid(enemyPos) {
    // 30% chance enemy knows about each trap; returns true if they decide to avoid
    for (var i = 0; i < _knownTrapPositions.length; i++) {
      var tp = _knownTrapPositions[i];
      var dist = Math.sqrt(
        Math.pow(enemyPos.x - tp.x, 2) + Math.pow(enemyPos.z - tp.z, 2)
      );
      if (dist < 2.5) {
        // 30% chance they path around
        if (Math.random() < 0.30) return true;
      }
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Examine & Disarm (Alt+E / Ctrl+Alt+E)
  // ---------------------------------------------------------------------------
  function _findNearbyHazard(maxDist) {
    var playerPos = _getPlayerPosition();
    var closest = null;
    var closestDist = Infinity;
    for (var i = 0; i < _hazards.length; i++) {
      var d = _dist3D(playerPos, _hazards[i].position);
      if (d < maxDist && d < closestDist) {
        closestDist = d;
        closest = _hazards[i];
      }
    }
    return closest;
  }

  function _examineHazard(hazard) {
    var descriptions = {};
    descriptions[TYPE_PIT_TRAP] =        'PIT TRAP — Step on it to fall. Disarm: hold E for 3s.';
    descriptions[TYPE_SPIKE_TRAP] =       'SPIKE TRAP — Spikes rise from floor. Disarm: hold E for 3s.';
    descriptions[TYPE_ELECTRIC_FENCE] =   'ELECTRIC FENCE — Continuous shock damage. Disarm: hold E for 3s.';
    descriptions[TYPE_COLLAPSING_FLOOR] = 'COLLAPSING FLOOR — Breaks under weight. Disarm: hold E for 3s.';
    descriptions[TYPE_FIRE_PIT] =         'FIRE PIT — Burns continuously. Disarm: hold E for 3s.';

    var msg = descriptions[hazard.type] || 'Unknown hazard.';
    if (window.UI && window.UI.showMessage) {
      window.UI.showMessage(msg, 3000);
    } else {
      console.log('[EnvironmentalHazards] Examine:', msg);
    }
  }

  function _startDisarm(hazard) {
    _disarmTarget = hazard;
    _disarmProgress = 0;
    _disarmActive = true;
    if (window.UI && window.UI.showMessage) {
      window.UI.showMessage('Hold E to disarm... (3s)', 500);
    }
  }

  function _cancelDisarm() {
    if (_disarmTarget) {
      // Released E early — trigger the trap!
      var h = _disarmTarget;
      if (h.state === 'idle') {
        h.state = 'warning';
        h._warningTimer = 0.01; // nearly instant
        _showWarningFlash(h);
      }
      if (window.UI && window.UI.showMessage) {
        window.UI.showMessage('Disarm failed! Trap triggered!', 2000);
      }
    }
    _disarmActive = false;
    _disarmTarget = null;
    _disarmProgress = 0;
  }

  function _completeDisarm(hazard) {
    hazard.state = 'idle'; // ensure idle
    // Suppress for 60s by setting resetTimer high
    hazard.resetTimer = -60;
    _disarmActive = false;
    _disarmTarget = null;
    _disarmProgress = 0;
    if (window.UI && window.UI.showMessage) {
      window.UI.showMessage('Trap disarmed!', 2000);
    }
  }

  // ---------------------------------------------------------------------------
  // Input handlers
  // ---------------------------------------------------------------------------
  function _onKeyDown(e) {
    if (e.key === 'Alt')     { _altHeld  = true; e.preventDefault(); }
    if (e.key === 'Control') { _ctrlHeld = true; }
    if (e.key === 'e' || e.key === 'E') {
      _eKeyHeld = true;

      if (_altHeld && _ctrlHeld) {
        // Ctrl+Alt+E — start disarm
        if (!_disarmActive) {
          var nearby = _findNearbyHazard(2.0);
          if (nearby) {
            _startDisarm(nearby);
          }
        }
      } else if (_altHeld && !_ctrlHeld) {
        // Alt+E — examine
        var nearby2 = _findNearbyHazard(2.0);
        if (nearby2) {
          _examineHazard(nearby2);
        }
      }
    }
  }

  function _onKeyUp(e) {
    if (e.key === 'Alt')     { _altHeld  = false; }
    if (e.key === 'Control') { _ctrlHeld = false; }
    if (e.key === 'e' || e.key === 'E') {
      _eKeyHeld = false;
      // If disarming and released E early, cancel
      if (_disarmActive && _disarmProgress < _DISARM_TIME) {
        _cancelDisarm();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // update — public
  // ---------------------------------------------------------------------------
  function update(dt) {
    if (!_scene) return;
    if (!dt || isNaN(dt)) dt = 0.016;

    var playerPos = _getPlayerPosition();
    var enemies   = _getEnemiesArr();

    // Disarm mini-game
    if (_disarmActive && _disarmTarget) {
      if (_eKeyHeld) {
        _disarmProgress += dt;
        var pct = Math.min(_disarmProgress / _DISARM_TIME, 1.0) * 100;
        if (window.UI && window.UI.showProgress) {
          window.UI.showProgress('Disarming...', pct);
        }
        if (_disarmProgress >= _DISARM_TIME) {
          _completeDisarm(_disarmTarget);
        }
      }
    }

    // Update trap visibility based on player abilities
    _updateTrapVisibility();

    // Update each hazard
    for (var i = 0; i < _hazards.length; i++) {
      var h = _hazards[i];
      if (h.type === TYPE_PIT_TRAP) {
        _updatePitTrap(h, dt, playerPos, enemies);
      } else if (h.type === TYPE_SPIKE_TRAP) {
        _updateSpikeTrap(h, dt, playerPos, enemies);
      } else if (h.type === TYPE_ELECTRIC_FENCE) {
        _updateElectricFence(h, dt, playerPos, enemies);
      } else if (h.type === TYPE_COLLAPSING_FLOOR) {
        _updateCollapsingFloor(h, dt, playerPos, enemies);
      } else if (h.type === TYPE_FIRE_PIT) {
        _updateFirePit(h, dt, playerPos, enemies);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // init — public
  // ---------------------------------------------------------------------------
  function init(scene, camera, options) {
    _scene  = scene;
    _camera = camera || null;
    _hazards = [];
    _knownTrapPositions = [];
    _disarmActive = false;
    _disarmTarget = null;
    _disarmProgress = 0;
    _eKeyHeld = false;
    _altHeld  = false;
    _ctrlHeld = false;

    if (options) {
      if (options.player)  _player  = options.player;
      if (options.enemies) _enemies = options.enemies;
    }

    // Remove old listeners if re-initialising
    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup',   _onKeyUp);
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    console.log('[EnvironmentalHazards] Initialized.');
  }

  // ---------------------------------------------------------------------------
  // reset — public
  // ---------------------------------------------------------------------------
  function reset() {
    // Remove all hazard meshes from scene
    for (var i = 0; i < _hazards.length; i++) {
      var h = _hazards[i];
      if (_scene) {
        if (h.mesh)      _scene.remove(h.mesh);
        if (h.crackMesh) _scene.remove(h.crackMesh);
        if (h.postA)     _scene.remove(h.postA);
        if (h.postB)     _scene.remove(h.postB);
        if (h.line)      _scene.remove(h.line);
        if (h.spikes) {
          for (var s = 0; s < h.spikes.length; s++) {
            _scene.remove(h.spikes[s]);
          }
        }
        if (h.arcDots) {
          for (var d = 0; d < h.arcDots.length; d++) {
            _scene.remove(h.arcDots[d]);
          }
        }
        if (h.particles) {
          for (var p = 0; p < h.particles.length; p++) {
            _scene.remove(h.particles[p]);
          }
        }
      }
    }

    _hazards = [];
    _knownTrapPositions = [];
    _disarmActive = false;
    _disarmTarget = null;
    _disarmProgress = 0;

    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup',   _onKeyUp);

    console.log('[EnvironmentalHazards] Reset.');
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  return {
    init:          init,
    update:        update,
    spawnHazard:   spawnHazard,
    populateLevel: populateLevel,
    reset:         reset,
    // Expose for AI pathfinding
    getKnownTrapPositions: function () { return _knownTrapPositions.slice(); },
    shouldEnemyAvoid:      _shouldEnemyAvoid
  };
})();
