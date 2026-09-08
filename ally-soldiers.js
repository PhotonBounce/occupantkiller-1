window.AllySoldiers = (function() {
  'use strict';
  // var only

  var _scene = null;
  var _allies = [];
  var _camera = null;
  var MAX_ALLIES = 3;
  var ALLY_HP = 80;
  var ALLY_SPEED = 3.5;
  var FIRE_RANGE = 28;
  var FIRE_RATE = 1.2; // seconds between shots
  var FOLLOW_DIST = 5; // follow player within this radius

  // Ally names for display
  var ALLY_NAMES = ['Sgt. Mykola', 'Pvt. Dmytro', 'Cpl. Vasyl', 'Lt. Olena', 'Sgt. Bohdan'];

  function _buildAllyMesh(scene) {
    var group = new THREE.Group();

    // Body (soldier torso) - Ukrainian camo colors
    var bodyGeo = new THREE.BoxGeometry(0.5, 0.7, 0.3);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x4a5e3a }); // dark olive
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.35;
    group.add(body);

    // Head
    var headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.9;
    group.add(head);

    // Helmet
    var helmGeo = new THREE.BoxGeometry(0.38, 0.2, 0.38);
    var helmMat = new THREE.MeshLambertMaterial({ color: 0x3d4a2a }); // dark camo
    var helm = new THREE.Mesh(helmGeo, helmMat);
    helm.position.y = 1.05;
    group.add(helm);

    // Rifle
    var rifleGeo = new THREE.BoxGeometry(0.06, 0.06, 0.7);
    var rifleMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var rifle = new THREE.Mesh(rifleGeo, rifleMat);
    rifle.position.set(0.3, 0.5, 0.4);
    group.add(rifle);

    // Legs
    var legGeo = new THREE.BoxGeometry(0.18, 0.5, 0.18);
    var legMat = new THREE.MeshLambertMaterial({ color: 0x3a4a28 });
    var legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.14, -0.1, 0);
    group.add(legL);
    var legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.14, -0.1, 0);
    group.add(legR);

    scene.add(group);
    return group;
  }

  function _buildHPBar(scene) {
    var canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 8;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#3fd0ff';
    ctx.fillRect(0, 0, 64, 8);
    var tex = new THREE.CanvasTexture(canvas);
    var geo = new THREE.PlaneGeometry(0.8, 0.1);
    var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    var bar = new THREE.Mesh(geo, mat);
    bar._canvas = canvas;
    bar._ctx = ctx;
    bar._tex = tex;
    scene.add(bar);
    return bar;
  }

  function _updateHPBar(bar, pct) {
    // Repaint only when the bar would actually look different. This redrew the
    // canvas and re-uploaded the texture to the GPU every frame for every ally,
    // whether or not anyone had taken a scratch of damage.
    var step = Math.round(Math.max(0, Math.min(1, pct)) * 32);
    if (bar._lastStep === step) return;
    bar._lastStep = step;
    var ctx = bar._ctx;
    ctx.clearRect(0, 0, 64, 8);
    ctx.fillStyle = '#16222c';
    ctx.fillRect(0, 0, 64, 8);
    // Friendly bars are deliberately COOL-coloured. Hostiles now show a red,
    // pulsing bar, so friend and foe must never share a palette.
    ctx.fillStyle = pct > 0.5 ? '#3fd0ff' : pct > 0.25 ? '#7fa8ff' : '#b07fff';
    ctx.fillRect(0, 0, 64 * (step / 32), 8);
    bar._tex.needsUpdate = true;
  }

  function spawnAlly(x, z, nameOverride) {
    if (_allies.length >= MAX_ALLIES || !_scene) return null;

    var nameIdx = _allies.length % ALLY_NAMES.length;
    var ally = {
      mesh: _buildAllyMesh(_scene),
      hpBar: _buildHPBar(_scene),
      hp: ALLY_HP,
      maxHp: ALLY_HP,
      name: nameOverride || ALLY_NAMES[nameIdx],
      fireTimer: Math.random() * FIRE_RATE, // stagger initial shots
      state: 'follow', // follow | cover | attack
      coverPos: null,
      target: null,
      dead: false,
      bobTimer: 0,
    };

    ally.mesh.position.set(x, 0, z);
    _allies.push(ally);
    return ally;
  }

  function update(delta, playerPos, enemies) {
    if (!playerPos || !_allies.length) return;

    for (var i = _allies.length - 1; i >= 0; i--) {
      var ally = _allies[i];
      if (ally.dead) continue;

      // Find nearest enemy
      var nearestEnemy = null;
      var nearestDist = FIRE_RANGE;
      if (enemies) {
        for (var ei = 0; ei < enemies.length; ei++) {
          var e = enemies[ei];
          if (!e || !e.mesh || e.hp <= 0) continue;
          var dx = e.mesh.position.x - ally.mesh.position.x;
          var dz = e.mesh.position.z - ally.mesh.position.z;
          var dist = Math.sqrt(dx*dx + dz*dz);
          if (dist < nearestDist) { nearestDist = dist; nearestEnemy = e; }
        }
      }
      ally.target = nearestEnemy;

      // State machine
      if (nearestEnemy) {
        ally.state = 'attack';
        // Face enemy
        var tx = nearestEnemy.mesh.position.x - ally.mesh.position.x;
        var tz = nearestEnemy.mesh.position.z - ally.mesh.position.z;
        ally.mesh.rotation.y = Math.atan2(tx, tz);
      } else {
        ally.state = 'follow';
      }

      // Movement
      if (ally.state === 'follow') {
        // Follow player at offset
        var offsetAngle = (i / MAX_ALLIES) * Math.PI * 2;
        var targetX = playerPos.x + Math.cos(offsetAngle) * FOLLOW_DIST;
        var targetZ = playerPos.z + Math.sin(offsetAngle) * FOLLOW_DIST;

        var mvDx = targetX - ally.mesh.position.x;
        var mvDz = targetZ - ally.mesh.position.z;
        var mvDist = Math.sqrt(mvDx*mvDx + mvDz*mvDz);

        if (mvDist > 1.5) {
          var speed = ALLY_SPEED * delta;
          ally.mesh.position.x += (mvDx / mvDist) * speed;
          ally.mesh.position.z += (mvDz / mvDist) * speed;
          ally.mesh.rotation.y = Math.atan2(mvDx, mvDz);
        }
      }

      // Bob animation when moving
      ally.bobTimer += delta * 4;
      ally.mesh.position.y = Math.sin(ally.bobTimer) * 0.05;

      // HP bar position
      ally.hpBar.position.set(
        ally.mesh.position.x,
        ally.mesh.position.y + 1.5,
        ally.mesh.position.z
      );
      if (_camera) ally.hpBar.lookAt(_camera.position);
      _updateHPBar(ally.hpBar, ally.hp / ally.maxHp);

      // Fire at enemy
      if (ally.state === 'attack' && ally.target) {
        ally.fireTimer -= delta;
        if (ally.fireTimer <= 0) {
          ally.fireTimer = FIRE_RATE + Math.random() * 0.5;
          _fireAtEnemy(ally, ally.target);
        }
      }
    }
  }

  function _fireAtEnemy(ally, enemy) {
    if (!enemy || enemy.hp <= 0) return;

    // Hit chance based on distance
    var dx = enemy.mesh.position.x - ally.mesh.position.x;
    var dz = enemy.mesh.position.z - ally.mesh.position.z;
    var dist = Math.sqrt(dx*dx + dz*dz);
    var hitChance = Math.max(0.3, 1 - dist / FIRE_RANGE);

    if (Math.random() < hitChance) {
      var dmg = 15 + Math.random() * 15;
      enemy.hp -= dmg;

      // Muzzle flash point light
      if (_scene) {
        var flash = new THREE.PointLight(0xffaa44, 3, 4);
        flash.position.copy(ally.mesh.position);
        flash.position.y += 0.5;
        _scene.add(flash);
        setTimeout(function() { if (_scene) _scene.remove(flash); }, 80);
      }
    }
  }

  function damageAlly(allyIndex, amount) {
    if (allyIndex < 0 || allyIndex >= _allies.length) return;
    var ally = _allies[allyIndex];
    ally.hp -= amount;
    if (ally.hp <= 0) {
      ally.hp = 0;
      ally.dead = true;
      // Slump down
      ally.mesh.rotation.x = Math.PI / 2;
      ally.mesh.position.y = -0.3;
      // Remove after 10 seconds
      var toRemove = ally;
      setTimeout(function() {
        if (_scene) { _scene.remove(toRemove.mesh); _scene.remove(toRemove.hpBar); }
      }, 10000);
      _allies.splice(allyIndex, 1);
    }
  }

  function init(scene, camera) {
    _scene = scene;
    _camera = camera;
    _allies = [];
  }

  function spawnForWave(playerPos, waveNum) {
    // Spawn 1-2 allies based on wave number
    var count = waveNum > 5 ? 2 : 1;
    clear();
    for (var i = 0; i < count; i++) {
      var angle = (i / count) * Math.PI * 2;
      spawnAlly(
        (playerPos ? playerPos.x : 0) + Math.cos(angle) * 5,
        (playerPos ? playerPos.z : 0) + Math.sin(angle) * 5
      );
    }
  }

  function clear() {
    for (var i = 0; i < _allies.length; i++) {
      if (_scene) { _scene.remove(_allies[i].mesh); _scene.remove(_allies[i].hpBar); }
    }
    _allies = [];
  }

  function getAll() { return _allies; }
  function getCount() { return _allies.length; }

  return {
    init: init,
    spawnAlly: spawnAlly,
    spawnForWave: spawnForWave,
    update: update,
    damageAlly: damageAlly,
    clear: clear,
    getAll: getAll,
    getCount: getCount,
  };
})();
