window.CrowdPanic = (function() {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _civs = [];
  var _shotTimer = 0;
  var _panicRadius = 15;
  var _calmDelay = 30;
  var _calmTimer = 0;
  var _panicking = false;
  var _audioCtx = null;

  var CIV_COLORS = [0x4A6FA5, 0x888888, 0x8B4513, 0x556B2F, 0xA0522D, 0x696969, 0xB0C4DE];
  var CIV_NAMES = ['CIVILIAN', 'CIVILIAN', 'CIVILIAN', 'PEDESTRIAN', 'BYSTANDER', 'CIVILIAN', 'PEDESTRIAN', 'CIVILIAN'];

  function _getAudioCtx() {
    if (!_audioCtx) {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  function _scream() {
    try {
      var ctx = _getAudioCtx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800 + Math.random() * 400;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
  }

  function _buildCivMesh(color) {
    var group = new THREE.Group();
    var torsoGeo = new THREE.BoxGeometry(0.4, 0.55, 0.22);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var torso = new THREE.Mesh(torsoGeo, mat);
    torso.position.y = 0.6;
    group.add(torso);

    var headGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
    var head = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: 0xFFCBA4 }));
    head.position.y = 1.05;
    group.add(head);

    var legMat = new THREE.MeshLambertMaterial({ color: 0x222244 });
    [-0.1, 0.1].forEach(function(lx) {
      var leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.2), legMat);
      leg.position.set(lx, 0.22, 0);
      group.add(leg);
    });

    var armMat = new THREE.MeshLambertMaterial({ color: color });
    [-0.3, 0.3].forEach(function(ax) {
      var arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, 0.18), armMat);
      arm.position.set(ax, 0.56, 0);
      group.add(arm);
    });

    return group;
  }

  function _spawnCivilian(x, z) {
    var color = CIV_COLORS[Math.floor(Math.random() * CIV_COLORS.length)];
    var mesh = _buildCivMesh(color);
    mesh.position.set(x, 0.5, z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    _scene.add(mesh);

    var panicThreshold = 1 + Math.floor(Math.random() * 3);

    var civ = {
      mesh: mesh,
      panicThreshold: panicThreshold,
      shotsNear: 0,
      panicking: false,
      panicDir: { x: 0, z: 0 },
      panicTimer: 0,
      hideTimer: 0,
      hidden: false,
      legAngle: 0,
      legDir: 1,
      idleWanderTimer: Math.random() * 5,
      idleAngle: Math.random() * Math.PI * 2,
      color: color
    };

    return civ;
  }

  function _penalizePlayerForCivShot(civ) {
    if (civ._penalized) return;
    civ._penalized = true;
    var player = window.player;
    if (player && player.score !== undefined) {
      player.score = Math.max(0, player.score - 200);
      if (window.HUD && window.HUD.setScore) window.HUD.setScore(player.score);
    }
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('CIVILIAN CASUALTY -200');
    }
    var flash = document.getElementById('civ-casualty-flash');
    if (!flash) {
      flash = document.createElement('div');
      flash.id = 'civ-casualty-flash';
      flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,0,0,0.4);pointer-events:none;z-index:1800;transition:opacity 0.5s';
      document.body.appendChild(flash);
    }
    flash.style.opacity = '1';
    setTimeout(function() { flash.style.opacity = '0'; }, 500);
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene;
    _camera = camera || window._camera;

    var positions = [
      [8, 5], [-6, 12], [14, -3], [-2, 8], [20, 15],
      [-15, 5], [5, -18], [18, -10], [-10, -8], [0, 22],
      [12, 20], [-18, 15]
    ];

    for (var i = 0; i < Math.min(8, positions.length); i++) {
      var civ = _spawnCivilian(positions[i][0], positions[i][1]);
      _civs.push(civ);
    }

    window._civiliansAlive = _civs.length;
    window._onCivilianHit = function(civMesh, damage) {
      for (var j = 0; j < _civs.length; j++) {
        if (_civs[j].mesh === civMesh || civMesh.parent === _civs[j].mesh) {
          _penalizePlayerForCivShot(_civs[j]);
          break;
        }
      }
    };
  }

  function _triggerPanic(shotX, shotZ) {
    if (!_panicking) {
      _panicking = true;
      _calmTimer = _calmDelay;
    }
    _calmTimer = _calmDelay;

    for (var i = 0; i < _civs.length; i++) {
      var civ = _civs[i];
      if (civ.hidden) continue;
      var dx = civ.mesh.position.x - shotX;
      var dz = civ.mesh.position.z - shotZ;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < _panicRadius) {
        civ.shotsNear++;
        if (civ.shotsNear >= civ.panicThreshold && !civ.panicking) {
          civ.panicking = true;
          civ.panicTimer = 5 + Math.random() * 3;
          var angle = Math.random() * Math.PI * 2;
          civ.panicDir = { x: Math.cos(angle), z: Math.sin(angle) };
          _scream();
        }
      }
    }
  }

  function update(dt) {
    if (!_scene) return;

    _shotTimer -= dt;
    if (_shotTimer < 0) {
      var prevHook = window._onShotFired;
      window._onShotFired = function(shotPos, shotDir) {
        if (prevHook) prevHook(shotPos, shotDir);
        if (shotPos) _triggerPanic(shotPos.x, shotPos.z);
      };
      _shotTimer = 9999;
    }

    if (_panicking) {
      _calmTimer -= dt;
      if (_calmTimer <= 0) {
        _panicking = false;
        for (var k = 0; k < _civs.length; k++) {
          _civs[k].panicking = false;
          _civs[k].shotsNear = 0;
          _civs[k].hidden = false;
        }
      }
    }

    for (var i = 0; i < _civs.length; i++) {
      var civ = _civs[i];
      if (!civ.mesh) continue;

      civ.legAngle += civ.legDir * dt * (civ.panicking ? 14 : 4);
      if (Math.abs(civ.legAngle) > 0.3) civ.legDir *= -1;

      var children = civ.mesh.children;
      for (var c = 0; c < children.length; c++) {
        var child = children[c];
        if (child.position.x < -0.05) {
          child.rotation.x = civ.legAngle;
        } else if (child.position.x > 0.05) {
          child.rotation.x = -civ.legAngle;
        }
      }

      if (civ.panicking) {
        civ.mesh.rotation.z = Math.sin(Date.now() * 0.02) * 0.06;

        civ.panicTimer -= dt;
        var speed = 4;
        civ.mesh.position.x += civ.panicDir.x * speed * dt;
        civ.mesh.position.z += civ.panicDir.z * speed * dt;
        civ.mesh.rotation.y = Math.atan2(civ.panicDir.x, civ.panicDir.z);

        if (civ.panicTimer <= 0) {
          civ.hidden = true;
          civ.mesh.visible = false;
        }
      } else {
        civ.idleWanderTimer -= dt;
        if (civ.idleWanderTimer <= 0) {
          civ.idleWanderTimer = 3 + Math.random() * 4;
          civ.idleAngle = Math.random() * Math.PI * 2;
        }
        civ.mesh.position.x += Math.cos(civ.idleAngle) * 0.3 * dt;
        civ.mesh.position.z += Math.sin(civ.idleAngle) * 0.3 * dt;
        civ.mesh.rotation.y = civ.idleAngle + Math.PI;
      }
    }
  }

  function reset() {
    for (var i = 0; i < _civs.length; i++) {
      if (_civs[i].mesh) _scene.remove(_civs[i].mesh);
    }
    _civs = [];
    _panicking = false;
    _calmTimer = 0;
    _shotTimer = 0;
    window._civiliansAlive = 0;
  }

  return { init: init, update: update, reset: reset };
})();
