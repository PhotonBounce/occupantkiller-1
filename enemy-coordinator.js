window.EnemyCoordinator = (function () {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _coordinators = [];
  var _maxCoordinators = 2;
  var _updateTimer = 0;

  var COORDINATOR_HP = 150;
  var COORDINATOR_SPEED = 1.5;
  var SQUAD_RADIUS = 18;
  var FLANK_INTERVAL = 12;
  var SUPPRESSION_DURATION = 8;
  var RALLY_DURATION = 6;
  var REINFORCE_INTERVAL = 20;
  var DEATH_EXPLOSION_DELAY = 3;

  function _buildMesh() {
    var group = new THREE.Group();

    // Body
    var bodyGeo = new THREE.BoxGeometry(0.6, 1.0, 0.4);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x3d4a2d });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    group.add(body);

    // Head
    var headGeo = new THREE.SphereGeometry(0.22, 8, 6);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xc8a07a });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.22;
    group.add(head);

    // Officer cap
    var brimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.04, 8);
    var capGeo = new THREE.CylinderGeometry(0.18, 0.28, 0.18, 8);
    var capMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var brim = new THREE.Mesh(brimGeo, capMat);
    brim.position.y = 1.46;
    group.add(brim);
    var cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 1.56;
    group.add(cap);

    // Red epaulettes
    var epMat = new THREE.MeshLambertMaterial({ color: 0xcc2222 });
    var ep1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.22), epMat);
    ep1.position.set(0.36, 1.0, 0);
    group.add(ep1);
    var ep2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.22), epMat);
    ep2.position.set(-0.36, 1.0, 0);
    group.add(ep2);

    // Binoculars
    var binoMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 6), binoMat);
    b1.rotation.x = Math.PI / 2;
    b1.position.set(0.07, 1.05, 0.3);
    group.add(b1);
    var b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 6), binoMat);
    b2.rotation.x = Math.PI / 2;
    b2.position.set(-0.07, 1.05, 0.3);
    group.add(b2);

    // Radio pack on back
    var radioPack = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.35, 0.12), new THREE.MeshLambertMaterial({ color: 0x556b2f }));
    radioPack.position.set(0, 0.65, -0.26);
    group.add(radioPack);
    var antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 4), new THREE.MeshLambertMaterial({ color: 0x888888 }));
    antenna.position.set(0.08, 1.05, -0.26);
    group.add(antenna);

    // Arms
    var armMat = new THREE.MeshLambertMaterial({ color: 0x3d4a2d });
    var arm1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.7, 0.14), armMat);
    arm1.position.set(0.42, 0.55, 0);
    group.add(arm1);
    var arm2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.7, 0.14), armMat);
    arm2.position.set(-0.42, 0.55, 0);
    group.add(arm2);

    // Legs
    var leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.22), armMat);
    leg1.position.set(0.15, -0.35, 0);
    group.add(leg1);
    var leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.22), armMat);
    leg2.position.set(-0.15, -0.35, 0);
    group.add(leg2);

    return group;
  }

  function _buildHPBar(coord) {
    var canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 8;
    coord._hpCanvas = canvas;
    coord._hpCtx = canvas.getContext('2d');
    var tex = new THREE.CanvasTexture(canvas);
    coord._hpTex = tex;
    var bar = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.15),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
    );
    bar.position.y = 2.4;
    coord.mesh.add(bar);
    coord._hpBar = bar;
    _updateHPBar(coord);
  }

  function _updateHPBar(coord) {
    if (!coord._hpCtx) return;
    var ctx = coord._hpCtx;
    var pct = Math.max(0, coord.hp / COORDINATOR_HP);
    ctx.clearRect(0, 0, 64, 8);
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, 64, 8);
    ctx.fillStyle = pct > 0.5 ? '#44ff44' : pct > 0.25 ? '#ffaa00' : '#ff2222';
    ctx.fillRect(0, 0, Math.floor(64 * pct), 8);
    coord._hpTex.needsUpdate = true;
  }

  function _getEnemies() {
    if (window.Enemies && Enemies.getAll) return Enemies.getAll();
    if (window._enemies) return window._enemies;
    return [];
  }

  function _getPlayerPos() {
    if (window._camera) return window._camera.position;
    if (window.player && window.player.position) return window.player.position;
    return new THREE.Vector3();
  }

  function _claimSquad(coord) {
    var enemies = _getEnemies();
    coord.squad = [];
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.alive || !e.mesh) continue;
      if (e._isCoordinator) continue;
      var dist = coord.mesh.position.distanceTo(e.mesh.position);
      if (dist < SQUAD_RADIUS && coord.squad.length < 4) {
        coord.squad.push(e);
      }
    }
  }

  function _issueFlankOrder(coord) {
    if (!coord.squad || coord.squad.length < 2) return;
    var playerPos = _getPlayerPos();
    var toPlayer = new THREE.Vector3().subVectors(playerPos, coord.mesh.position).normalize();
    var flankDir = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x);
    var flankPos = new THREE.Vector3(
      playerPos.x + flankDir.x * 12,
      0,
      playerPos.z + flankDir.z * 12
    );
    // Send 2 squad members to flank
    for (var i = 0; i < Math.min(2, coord.squad.length); i++) {
      var e = coord.squad[i];
      if (e && e.alive && e.mesh) {
        e._flankTarget = flankPos.clone();
        e._flanking = true;
        e._flankTimer = 8;
      }
    }
    // Binocular raise animation
    coord._binoRaise = 0.5;
    _showOrderText(coord, 'FLANK!');
  }

  function _issueSuppressionOrder(coord) {
    if (!coord.squad || coord.squad.length === 0) return;
    var target = coord.squad[Math.floor(Math.random() * coord.squad.length)];
    if (target && target.alive) {
      target._suppressing = true;
      target._suppressTimer = SUPPRESSION_DURATION;
      target._fireRateMult = 2;
    }
    _showOrderText(coord, 'SUPPRESS!');
  }

  function _issueRally(coord) {
    var enemies = _getEnemies();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.alive || !e.mesh) continue;
      var dist = coord.mesh.position.distanceTo(e.mesh.position);
      if (dist < 12) {
        e._speedBoostTimer = RALLY_DURATION;
        e._speedBoostMult = 1.2;
      }
    }
    _playRadio(coord);
    _showOrderText(coord, 'RALLY!');
  }

  function _callReinforcements(coord) {
    if (!_scene) return;
    var angle = Math.random() * Math.PI * 2;
    var radius = 40;
    var rx = coord.mesh.position.x + Math.cos(angle) * radius;
    var rz = coord.mesh.position.z + Math.sin(angle) * radius;
    for (var i = 0; i < 2; i++) {
      if (window.Enemies && Enemies.spawnAt) {
        Enemies.spawnAt(rx + (Math.random() - 0.5) * 4, 0, rz + (Math.random() - 0.5) * 4);
      }
    }
    _playRadio(coord);
    _showOrderText(coord, 'REINFORCE!');
  }

  function _issueDefenseOrder(coord) {
    if (!coord.squad) return;
    for (var i = 0; i < Math.min(2, coord.squad.length); i++) {
      var e = coord.squad[i];
      if (e && e.alive) {
        e._defending = true;
        e._defenseTimer = 10;
        if (e.mesh) e.mesh.scale.y = 0.6; // crouch
      }
    }
  }

  function _playRadio(coord) {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var noise = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
      var data = noise.getChannelData(0);
      for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
      var src = ctx.createBufferSource();
      src.buffer = noise;
      var filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 0.5;
      src.connect(filter);
      filter.connect(ctx.destination);
      src.start();
      src.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  }

  function _showOrderText(coord, text) {
    var el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'color:#FF8800;font-family:monospace;font-size:18px;font-weight:bold;' +
      'text-shadow:0 0 8px #FF4400;pointer-events:none;z-index:9000;' +
      'transition:opacity 1.5s,transform 1.5s;opacity:1;';
    document.body.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translate(-50%,-150%)';
    }, 50);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1600);
  }

  function _dropRadioBomb(coord) {
    if (!_scene) return;
    var bombPos = coord.mesh.position.clone();
    var bombGeo = new THREE.BoxGeometry(0.3, 0.2, 0.15);
    var bombMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var bomb = new THREE.Mesh(bombGeo, bombMat);
    bomb.position.copy(bombPos);
    _scene.add(bomb);
    var led = new THREE.PointLight(0xff0000, 1.5, 3);
    bomb.add(led);
    var blinkTimer = 0;
    var blinkInterval = 0.3;
    bomb._blinkTimer = 0;
    bomb._detonateAt = DEATH_EXPLOSION_DELAY;
    bomb._update = function (dt) {
      bomb._detonateAt -= dt;
      bomb._blinkTimer -= dt;
      if (bomb._blinkTimer <= 0) {
        led.visible = !led.visible;
        bomb._blinkTimer = blinkInterval;
        blinkInterval = Math.max(0.05, blinkInterval * 0.9);
      }
      if (bomb._detonateAt <= 0) {
        _explodeAt(bombPos, 4, 30);
        _scene.remove(bomb);
        bomb._dead = true;
      }
    };
    coord._radioBomb = bomb;
  }

  function _explodeAt(pos, radius, damage) {
    if (!_scene) return;
    var flash = new THREE.PointLight(0xFF8800, 4, radius * 2.5);
    flash.position.copy(pos);
    _scene.add(flash);
    setTimeout(function () { _scene.remove(flash); }, 300);

    for (var p = 0; p < 8; p++) {
      var pGeo = new THREE.SphereGeometry(0.1 + Math.random() * 0.15, 4, 4);
      var pMat = new THREE.MeshBasicMaterial({ color: 0xFF4400 });
      var particle = new THREE.Mesh(pGeo, pMat);
      particle.position.copy(pos);
      var vel = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        Math.random() * 6 + 2,
        (Math.random() - 0.5) * 8
      );
      particle._vel = vel;
      particle._life = 1.5 + Math.random();
      particle._maxLife = particle._life;
      _scene.add(particle);
      coord && coord._debris ? coord._debris.push(particle) : null;
    }

    // Damage player
    var playerPos = _getPlayerPos();
    if (playerPos.distanceTo(pos) < radius) {
      if (window.player && window.player.hp !== undefined) {
        window.player.hp -= damage;
      } else if (window._playerHP !== undefined) {
        window._playerHP -= damage;
      }
    }
    // Damage enemies in radius
    var enemies = _getEnemies();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e && e.alive && e.mesh && e.mesh.position.distanceTo(pos) < radius) {
        if (e.takeDamage) e.takeDamage(damage * 0.5);
        else if (e.hp !== undefined) e.hp -= damage * 0.5;
      }
    }
  }

  function _handleKill(coord) {
    // Score
    if (window.GameManager && GameManager.addScore) GameManager.addScore(300);
    else if (window._score !== undefined) window._score += 300;

    // Kill feed
    if (window.KillFeedEvents && KillFeedEvents.add) {
      KillFeedEvents.add('COMMANDER DOWN', '#FF8800');
    }

    // Disorient squad
    if (coord.squad) {
      for (var i = 0; i < coord.squad.length; i++) {
        var e = coord.squad[i];
        if (e && e.alive) {
          e._disoriented = true;
          e._disorientTimer = 10;
        }
      }
    }

    // Drop radio bomb
    _dropRadioBomb(coord);
  }

  function spawnCoordinator(x, y, z) {
    if (_coordinators.length >= _maxCoordinators) return null;
    var coord = {
      mesh: _buildMesh(),
      hp: COORDINATOR_HP,
      alive: true,
      squad: [],
      _flankTimer: FLANK_INTERVAL,
      _suppressTimer: 6,
      _reinforceTimer: REINFORCE_INTERVAL,
      _defenseTimer: 8,
      _rallyArmed: true,
      _binoRaise: 0,
      _radioBomb: null,
      _debris: [],
      _isCoordinator: true,
      position: null
    };
    coord.mesh.position.set(x || 0, y || 0, z || 0);
    coord.mesh.userData.coordinator = coord;
    coord.position = coord.mesh.position;
    _buildHPBar(coord);
    if (_scene) _scene.add(coord.mesh);
    _claimSquad(coord);
    _coordinators.push(coord);
    return coord;
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene || window._scene;
    _camera = camera || window._camera;
    _coordinators = [];
  }

  function update(dt) {
    if (!_scene) return;
    var playerPos = _getPlayerPos();

    for (var ci = _coordinators.length - 1; ci >= 0; ci--) {
      var coord = _coordinators[ci];
      if (!coord || !coord.alive) {
        _coordinators.splice(ci, 1);
        continue;
      }

      // HP bar always faces camera
      if (coord._hpBar && _camera) {
        coord._hpBar.lookAt(_camera.position);
      }

      // Binocular raise animation
      if (coord._binoRaise > 0) {
        coord._binoRaise -= dt;
      }

      // Move away from player (command from rear)
      var distToPlayer = coord.mesh.position.distanceTo(playerPos);
      if (distToPlayer < 15) {
        var away = new THREE.Vector3().subVectors(coord.mesh.position, playerPos).normalize();
        coord.mesh.position.addScaledVector(away, COORDINATOR_SPEED * dt);
        coord.mesh.lookAt(playerPos.x, coord.mesh.position.y, playerPos.z);
      }

      // Flank order timer
      coord._flankTimer -= dt;
      if (coord._flankTimer <= 0) {
        coord._flankTimer = FLANK_INTERVAL + Math.random() * 4;
        _claimSquad(coord);
        _issueFlankOrder(coord);
      }

      // Suppression order timer
      coord._suppressTimer -= dt;
      if (coord._suppressTimer <= 0) {
        coord._suppressTimer = 10 + Math.random() * 5;
        _issueSuppressionOrder(coord);
      }

      // Reinforcement timer
      coord._reinforceTimer -= dt;
      if (coord._reinforceTimer <= 0) {
        coord._reinforceTimer = REINFORCE_INTERVAL + Math.random() * 10;
        _callReinforcements(coord);
      }

      // Defense order timer
      coord._defenseTimer -= dt;
      if (coord._defenseTimer <= 0) {
        coord._defenseTimer = 15 + Math.random() * 5;
        _issueDefenseOrder(coord);
      }

      // Radio bomb update
      if (coord._radioBomb && !coord._radioBomb._dead) {
        coord._radioBomb._update(dt);
      }

      // Debris update
      for (var di = coord._debris.length - 1; di >= 0; di--) {
        var p = coord._debris[di];
        p._vel.y -= 9.8 * dt;
        p.position.addScaledVector(p._vel, dt);
        p._life -= dt;
        p.material.opacity = p._life / p._maxLife;
        p.material.transparent = true;
        if (p._life <= 0) {
          _scene.remove(p);
          coord._debris.splice(di, 1);
        }
      }

      // Check if dead
      if (coord.hp <= 0 && coord.alive) {
        coord.alive = false;
        if (coord._rallyArmed) {
          coord._rallyArmed = false;
          _issueRally(coord);
        }
        _handleKill(coord);
        if (_scene) _scene.remove(coord.mesh);
      }

      // Check damage from player (via window._lastHitMesh)
      if (window._lastHitMesh) {
        coord.mesh.traverse(function (child) {
          if (child === window._lastHitMesh) {
            coord.hp -= window._lastHitDamage || 20;
            _updateHPBar(coord);
            window._lastHitMesh = null;
          }
        });
      }
    }

    // Apply squad state overrides
    _updateTimer -= dt;
    if (_updateTimer <= 0) {
      _updateTimer = 1.0;
      var enemies = _getEnemies();
      for (var ei = 0; ei < enemies.length; ei++) {
        var e = enemies[ei];
        if (!e || !e.alive) continue;
        // Apply speed boost
        if (e._speedBoostTimer > 0) {
          e._speedBoostTimer -= 1.0;
          if (e._speedBoostTimer <= 0 && e._speedBoostMult) {
            e._speedBoostMult = 1.0;
          }
        }
        // Flanking logic
        if (e._flanking && e._flankTarget && e.mesh) {
          e._flankTimer = (e._flankTimer || 0) - 1.0;
          if (e._flankTimer <= 0) {
            e._flanking = false;
            delete e._flankTarget;
          }
        }
        // Suppression
        if (e._suppressing && e._suppressTimer > 0) {
          e._suppressTimer -= 1.0;
          if (e._suppressTimer <= 0) {
            e._suppressing = false;
            e._fireRateMult = 1;
          }
        }
        // Disorientation
        if (e._disoriented && e._disorientTimer > 0) {
          e._disorientTimer -= 1.0;
          if (e._disorientTimer <= 0) {
            e._disoriented = false;
          }
        }
        // Defense mode
        if (e._defending && e._defenseTimer > 0) {
          e._defenseTimer -= 1.0;
          if (e._defenseTimer <= 0) {
            e._defending = false;
            if (e.mesh) e.mesh.scale.y = 1.0;
          }
        }
      }
    }
  }

  function getCoordinators() { return _coordinators; }

  function reset() {
    for (var i = 0; i < _coordinators.length; i++) {
      var c = _coordinators[i];
      if (c && c.mesh && _scene) _scene.remove(c.mesh);
      if (c._radioBomb && _scene) _scene.remove(c._radioBomb);
      for (var j = 0; j < c._debris.length; j++) {
        if (_scene) _scene.remove(c._debris[j]);
      }
    }
    _coordinators = [];
  }

  return { init: init, update: update, spawnCoordinator: spawnCoordinator, getCoordinators: getCoordinators, reset: reset };
})();
