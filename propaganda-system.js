window.PropagandaSystem = (function () {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _leaflets = [];
  var _towers = [];
  var _trucks = [];
  var _updateTimer = 0;
  var _moraleHUD = null;
  var _eventLog = [];
  var _broadcastTimer = 0;
  var _broadcastActive = false;
  var _broadcastPos = null;

  var LEAFLET_COUNT = 12;
  var TOWER_RANGE = 20;
  var TRUCK_RANGE = 25;
  var MORALE_STATES = ['HIGH', 'MEDIUM', 'LOW', 'BROKEN'];
  var MORALE_COLORS = { HIGH: '#44ff44', MEDIUM: '#ffaa00', LOW: '#ff4444', BROKEN: '#888888' };

  function _getEnemies() {
    if (window.Enemies && Enemies.getAll) return Enemies.getAll();
    if (window._enemies) return window._enemies;
    return [];
  }

  function _getPlayerPos() {
    return _camera ? _camera.position : new THREE.Vector3();
  }

  function _setMorale(enemy, state) {
    if (!enemy) return;
    enemy._morale = state;
    switch (state) {
      case 'HIGH':
        enemy._moraleSpeedMult = 1.0;
        break;
      case 'MEDIUM':
        enemy._moraleSpeedMult = 0.9;
        break;
      case 'LOW':
        enemy._moraleSpeedMult = 0.75;
        break;
      case 'BROKEN':
        enemy._moraleSpeedMult = 0.0;
        enemy._surrendering = true;
        enemy._surrenderTimer = 8;
        if (enemy.mesh) enemy.mesh.rotation.x = 0.3; // arms-up lean
        break;
    }
  }

  function _checkMoraleCascade() {
    var enemies = _getEnemies();
    var lowCount = 0;
    var lowEnemies = [];
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.alive) continue;
      if (e._morale === 'LOW' || e._morale === 'BROKEN') {
        lowCount++;
        lowEnemies.push(e);
      }
    }
    if (lowCount >= 3) {
      var playerPos = _getPlayerPos();
      for (var j = 0; j < enemies.length; j++) {
        var e2 = enemies[j];
        if (!e2 || !e2.alive || !e2.mesh) continue;
        if (e2._morale === 'HIGH' && e2.mesh.position.distanceTo(playerPos) < 20) {
          _setMorale(e2, 'MEDIUM');
        }
      }
    }
  }

  function _averageMorale() {
    var enemies = _getEnemies();
    var total = 0;
    var count = 0;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.alive) continue;
      var idx = MORALE_STATES.indexOf(e._morale || 'HIGH');
      total += idx >= 0 ? idx : 0;
      count++;
    }
    if (count === 0) return 'HIGH';
    var avg = total / count;
    return MORALE_STATES[Math.min(3, Math.round(avg))];
  }

  function _showToast(text, color) {
    var el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = 'position:fixed;top:35%;left:50%;transform:translate(-50%,-50%);' +
      'color:' + (color || '#fff') + ';font-family:monospace;font-size:16px;font-weight:bold;' +
      'text-shadow:0 0 8px currentColor;pointer-events:none;z-index:8000;' +
      'transition:opacity 2s,transform 2s;opacity:1;';
    document.body.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; el.style.transform = 'translate(-50%,-150%)'; }, 100);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2100);
    _eventLog.unshift({ text: text, time: Date.now() });
    if (_eventLog.length > 5) _eventLog.pop();
  }

  function _playBroadcast() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 160;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.0);
      // Static noise layer
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.05;
      var src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  function dropLeaflets() {
    if (!_scene) return;
    var pos = _getPlayerPos();
    for (var i = 0; i < LEAFLET_COUNT; i++) {
      var geo = new THREE.PlaneGeometry(0.3, 0.4);
      var mat = new THREE.MeshBasicMaterial({ color: 0xFFFFCC, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
      var leaf = new THREE.Mesh(geo, mat);
      leaf.position.set(
        pos.x + (Math.random() - 0.5) * 4,
        pos.y + 5 + Math.random() * 3,
        pos.z + (Math.random() - 0.5) * 4
      );
      leaf._vy = -1.5 - Math.random();
      leaf._phase = Math.random() * Math.PI * 2;
      leaf._life = 6 + Math.random() * 4;
      leaf._maxLife = leaf._life;
      _scene.add(leaf);
      _leaflets.push(leaf);
    }

    // Affect nearby enemies
    var enemies = _getEnemies();
    for (var j = 0; j < enemies.length; j++) {
      var e = enemies[j];
      if (!e || !e.alive || !e.mesh) continue;
      if (e.mesh.position.distanceTo(pos) < 15 && Math.random() < 0.30) {
        _setMorale(e, 'LOW');
        e._fleeing = true;
      }
    }
    _showToast('LEAFLETS DEPLOYED', '#FFFF88');
    _playBroadcast();
  }

  function spawnTower(x, y, z) {
    if (!_scene) return;
    var group = new THREE.Group();

    // Pole
    var pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 6, 6),
      new THREE.MeshLambertMaterial({ color: 0x666666 })
    );
    pole.position.y = 3;
    group.add(pole);

    // Megaphone cone
    var cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 1.2, 8),
      new THREE.MeshLambertMaterial({ color: 0x888888 })
    );
    cone.rotation.z = -Math.PI / 2;
    cone.position.set(0.6, 6, 0);
    group.add(cone);

    // Light
    var light = new THREE.PointLight(0xFFDD88, 0.8, 6);
    light.position.y = 6.5;
    group.add(light);

    group.position.set(x || 0, y || 0, z || 0);
    _scene.add(group);

    var tower = { mesh: group, hp: 60, active: true, range: TOWER_RANGE };
    _towers.push(tower);
    return tower;
  }

  function spawnTruck(x, y, z) {
    if (!_scene) return;
    var group = new THREE.Group();

    // Truck body
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1.5, 1.2),
      new THREE.MeshLambertMaterial({ color: 0x4a5c28 })
    );
    body.position.y = 0.75;
    group.add(body);

    // Cab
    var cab = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 1.0, 1.1),
      new THREE.MeshLambertMaterial({ color: 0x3a4c18 })
    );
    cab.position.set(1.2, 1.5, 0);
    group.add(cab);

    // Speakers on roof
    for (var s = 0; s < 2; s++) {
      var spk = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.5, 6),
        new THREE.MeshLambertMaterial({ color: 0x333333 })
      );
      spk.rotation.x = -Math.PI / 2;
      spk.position.set((s - 0.5) * 0.8, 2.1, 0);
      group.add(spk);
    }

    // Wheels
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.18, 8);
    var wheelPositions = [[-1, 0, 0.7], [-1, 0, -0.7], [1, 0, 0.7], [1, 0, -0.7]];
    for (var wi = 0; wi < wheelPositions.length; wi++) {
      var w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wheelPositions[wi][0], wheelPositions[wi][1], wheelPositions[wi][2]);
      group.add(w);
    }

    // Broadcast light
    var bLight = new THREE.PointLight(0xFFAA44, 1.2, TRUCK_RANGE);
    bLight.position.y = 3;
    group.add(bLight);
    group._broadcastLight = bLight;

    group.position.set(x || 0, y || 0, z || 0);
    group._dir = Math.random() * Math.PI * 2;
    group._speed = 2.5;
    _scene.add(group);

    var truck = { mesh: group, hp: 150, active: true, range: TRUCK_RANGE, _timer: 0 };
    _trucks.push(truck);
    return truck;
  }

  function _createMoraleHUD() {
    _moraleHUD = document.createElement('div');
    _moraleHUD.id = 'propaganda-morale-hud';
    _moraleHUD.style.cssText = 'position:fixed;top:50%;right:12px;transform:translateY(-50%);' +
      'background:rgba(0,0,0,0.7);border:1px solid #555;border-radius:4px;padding:6px 10px;' +
      'color:#fff;font-family:monospace;font-size:11px;pointer-events:none;z-index:4000;min-width:120px;';
    document.body.appendChild(_moraleHUD);
  }

  function _updateMoraleHUD() {
    if (!_moraleHUD) return;
    var avg = _averageMorale();
    var color = MORALE_COLORS[avg] || '#fff';
    var enemies = _getEnemies();
    var alive = enemies.filter(function (e) { return e && e.alive; }).length;
    _moraleHUD.innerHTML =
      'ENEMY MORALE<br>' +
      '<span style="color:' + color + ';font-size:13px;font-weight:bold;">' + avg + '</span><br>' +
      '<div style="width:100px;height:6px;background:#333;margin-top:3px;">' +
        '<div style="width:' + Math.round((3 - MORALE_STATES.indexOf(avg)) / 3 * 100) + 'px;height:100%;background:' + color + ';"></div>' +
      '</div>';
  }

  function _handleSurrender(enemy) {
    if (!enemy._surrendering) return;
    // Press E near surrendering enemy to capture
    if (!window._captureKey) {
      window._captureKey = function (pos) {
        var enemies = _getEnemies();
        for (var i = 0; i < enemies.length; i++) {
          var e = enemies[i];
          if (!e || !e.alive || !e._surrendering || !e.mesh) continue;
          if (e.mesh.position.distanceTo(pos) < 2) {
            e.alive = false;
            if (e.mesh && _scene) _scene.remove(e.mesh);
            if (window.GameManager && GameManager.addScore) GameManager.addScore(150);
            else if (window._score !== undefined) window._score += 150;
            _showToast('PRISONER CAPTURED +150', '#88FF88');
          }
        }
      };
    }
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene;
    _camera = camera || window._camera;
    _leaflets = [];
    _towers = [];
    _trucks = [];
    _createMoraleHUD();

    // Key binding for leaflets
    document.addEventListener('keydown', function (e) {
      if (e.code === 'KeyP' && !e.ctrlKey && !e.altKey) {
        dropLeaflets();
      }
      if (e.code === 'KeyP' && e.ctrlKey) {
        _broadcastActive = true;
        _broadcastTimer = 20;
        _broadcastPos = _camera ? _camera.position.clone() : new THREE.Vector3();
        _showToast('AIR BROADCAST INBOUND', '#FFFF44');
        var enemies = _getEnemies();
        for (var i = 0; i < enemies.length; i++) {
          var en = enemies[i];
          if (!en || !en.alive || !en.mesh) continue;
          if (en.mesh.position.distanceTo(_broadcastPos) < 40) {
            if (en._morale === 'HIGH') _setMorale(en, 'MEDIUM');
          }
        }
        _playBroadcast();
      }
      if (e.code === 'KeyE') {
        if (window._captureKey && _camera) {
          window._captureKey(_camera.position);
        }
      }
    });

    window._enemyMorale = _averageMorale;
  }

  function update(dt) {
    // Update leaflets
    var time = Date.now() * 0.001;
    for (var li = _leaflets.length - 1; li >= 0; li--) {
      var leaf = _leaflets[li];
      leaf._life -= dt;
      leaf.position.y += leaf._vy * dt;
      leaf.rotation.x = Math.sin(time * 2 + leaf._phase) * 0.4;
      leaf.rotation.z = Math.cos(time * 1.5 + leaf._phase) * 0.3;
      leaf.material.opacity = Math.min(0.9, leaf._life / 1.5);
      if (leaf._life <= 0 || leaf.position.y < -1) {
        if (_scene) _scene.remove(leaf);
        _leaflets.splice(li, 1);
      }
    }

    // Update towers — affect nearby enemies
    for (var ti = _towers.length - 1; ti >= 0; ti--) {
      var tower = _towers[ti];
      if (!tower.active || tower.hp <= 0) {
        if (tower.mesh && _scene) _scene.remove(tower.mesh);
        _towers.splice(ti, 1);
        continue;
      }
      _updateTimer -= dt;
      if (_updateTimer <= 0) {
        _updateTimer = 3.0;
        var enemies = _getEnemies();
        for (var ei = 0; ei < enemies.length; ei++) {
          var e = enemies[ei];
          if (!e || !e.alive || !e.mesh) continue;
          if (e.mesh.position.distanceTo(tower.mesh.position) < tower.range) {
            if (e._morale === 'HIGH') _setMorale(e, 'MEDIUM');
          }
        }
      }
    }

    // Update trucks — drive around, affect enemies
    for (var tri = _trucks.length - 1; tri >= 0; tri--) {
      var truck = _trucks[tri];
      if (!truck.active || truck.hp <= 0) {
        if (truck.mesh && _scene) _scene.remove(truck.mesh);
        _trucks.splice(tri, 1);
        continue;
      }
      // Simple patrol
      truck._timer -= dt;
      truck.mesh._dir += (Math.random() - 0.5) * 0.5 * dt;
      var dx = Math.sin(truck.mesh._dir) * truck.mesh._speed * dt;
      var dz = Math.cos(truck.mesh._dir) * truck.mesh._speed * dt;
      truck.mesh.position.x += dx;
      truck.mesh.position.z += dz;
      truck.mesh.rotation.y = truck.mesh._dir;

      // Pulsing broadcast light
      if (truck.mesh._broadcastLight) {
        truck.mesh._broadcastLight.intensity = 0.8 + Math.sin(time * 3) * 0.4;
      }

      if (truck._timer <= 0) {
        truck._timer = 3.0;
        var enemies2 = _getEnemies();
        for (var ej = 0; ej < enemies2.length; ej++) {
          var e2 = enemies2[ej];
          if (!e2 || !e2.alive || !e2.mesh) continue;
          var dist = e2.mesh.position.distanceTo(truck.mesh.position);
          if (dist < truck.range && e2._morale === 'HIGH') {
            _setMorale(e2, 'MEDIUM');
          }
        }
      }
    }

    // Handle surrendering enemies
    var surrenderEnemies = _getEnemies();
    for (var si = 0; si < surrenderEnemies.length; si++) {
      var se = surrenderEnemies[si];
      if (!se || !se.alive || !se._surrendering) continue;
      if (se._surrenderTimer !== undefined) {
        se._surrenderTimer -= dt;
        if (se._surrenderTimer <= 0) {
          se._surrendering = false;
          _setMorale(se, 'MEDIUM'); // recovers partially
          if (se.mesh) se.mesh.rotation.x = 0;
        }
      }
      _handleSurrender(se);
    }

    // Score multiplier when morale is low
    var avgMorale = _averageMorale();
    if (avgMorale === 'LOW' || avgMorale === 'BROKEN') {
      if (!window._moraleScoreMult) {
        window._moraleScoreMult = 1.25;
        _showToast('DEMORALIZED! +25% SCORE', '#FF8844');
      }
    } else {
      window._moraleScoreMult = 1.0;
    }

    // Broadcast effect
    if (_broadcastActive) {
      _broadcastTimer -= dt;
      if (_broadcastTimer <= 0) {
        _broadcastActive = false;
        _showToast('BROADCAST COMPLETE', '#FFFF44');
      }
    }

    // Check morale cascade
    if (Math.random() < dt * 0.5) {
      _checkMoraleCascade();
    }

    _updateMoraleHUD();
  }

  function reset() {
    for (var i = 0; i < _leaflets.length; i++) { if (_scene) _scene.remove(_leaflets[i]); }
    for (var j = 0; j < _towers.length; j++) { if (_scene) _scene.remove(_towers[j].mesh); }
    for (var k = 0; k < _trucks.length; k++) { if (_scene) _scene.remove(_trucks[k].mesh); }
    _leaflets = [];
    _towers = [];
    _trucks = [];
    if (_moraleHUD && _moraleHUD.parentNode) _moraleHUD.parentNode.removeChild(_moraleHUD);
    _moraleHUD = null;
    window._moraleScoreMult = 1.0;
    _broadcastActive = false;
  }

  return { init: init, update: update, dropLeaflets: dropLeaflets, spawnTower: spawnTower, spawnTruck: spawnTruck, reset: reset };
})();
