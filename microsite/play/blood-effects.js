window.BloodEffects = (function () {
  'use strict';

  var _scene = null;
  var _camera = null;

  // Flat particle arrays
  var _hitParticles = [];    // { mesh, velocity, life, maxLife }
  var _deathParticles = [];  // { mesh, velocity, life, maxLife }
  var _decals = [];          // { mesh } — persist until clear()
  var _mistPlanes = [];      // { mesh } — headshot red-mist billboards

  var GRAVITY = -9.8;
  var HIT_COLOR = 0xaa0011;
  var POOL_COLOR = 0x880008;
  var MAX_HIT_PARTICLES = 60;
  var MAX_DECALS = 40;

  // ── helpers ──────────────────────────────────────────────────────────────

  function _rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function _randDir() {
    // Random unit vector (uniform sphere sampling)
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    return new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi)
    );
  }

  function _makeSphere(radius, color, opacity) {
    var geo = new THREE.SphereGeometry(radius, 4, 4);
    var mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: opacity });
    return new THREE.Mesh(geo, mat);
  }

  function _makePlane(w, h, color, opacity) {
    var geo = new THREE.PlaneGeometry(w, h);
    var mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: opacity, side: THREE.DoubleSide });
    return new THREE.Mesh(geo, mat);
  }

  function _cullOldest(arr, maxCount) {
    while (arr.length > maxCount) {
      var oldest = arr.shift();
      if (oldest && oldest.mesh && _scene) _scene.remove(oldest.mesh);
    }
  }

  function _cullOldestDecals(arr, maxCount) {
    while (arr.length > maxCount) {
      var oldest = arr.shift();
      if (oldest && oldest.mesh && _scene) _scene.remove(oldest.mesh);
    }
  }

  // ── public API ───────────────────────────────────────────────────────────

  function init(scene, camera) {
    _scene = scene;
    _camera = camera;
  }

  function update(delta) {
    if (!_scene) return;

    var i;

    // Update hit particles
    i = _hitParticles.length;
    while (i--) {
      var hp = _hitParticles[i];
      hp.life -= delta;
      if (hp.life <= 0) {
        _scene.remove(hp.mesh);
        _hitParticles.splice(i, 1);
        continue;
      }
      // Gravity
      hp.velocity.y += GRAVITY * delta;
      // Move
      hp.mesh.position.x += hp.velocity.x * delta;
      hp.mesh.position.y += hp.velocity.y * delta;
      hp.mesh.position.z += hp.velocity.z * delta;
      // Clamp to ground
      if (hp.mesh.position.y < 0.02) hp.mesh.position.y = 0.02;
      // Fade opacity
      var lifeFrac = hp.life / hp.maxLife;
      hp.mesh.material.opacity = 0.9 * lifeFrac;
    }

    // Update death particles
    i = _deathParticles.length;
    while (i--) {
      var dp = _deathParticles[i];
      dp.life -= delta;
      if (dp.life <= 0) {
        _scene.remove(dp.mesh);
        _deathParticles.splice(i, 1);
        continue;
      }
      dp.velocity.y += GRAVITY * delta;
      dp.mesh.position.x += dp.velocity.x * delta;
      dp.mesh.position.y += dp.velocity.y * delta;
      dp.mesh.position.z += dp.velocity.z * delta;
      if (dp.mesh.position.y < 0.02) dp.mesh.position.y = 0.02;
      var lifeFrac2 = dp.life / dp.maxLife;
      dp.mesh.material.opacity = 0.9 * lifeFrac2;
    }

    // Billboard headshot mist planes toward camera
    if (_camera && _mistPlanes.length > 0) {
      i = _mistPlanes.length;
      while (i--) {
        var mp = _mistPlanes[i];
        if (mp && mp.mesh) {
          mp.mesh.quaternion.copy(_camera.quaternion);
        }
      }
    }
  }

  function onHit(position) {
    if (!_scene || !position) return;

    var count = Math.floor(_rand(5, 9)); // 5-8 inclusive
    for (var i = 0; i < count; i++) {
      var radius = _rand(0.05, 0.1);
      var mesh = _makeSphere(radius, HIT_COLOR, 0.9);
      mesh.position.copy(position);
      _scene.add(mesh);

      var speed = _rand(2, 6);
      var dir = _randDir();

      var particle = {
        mesh: mesh,
        velocity: new THREE.Vector3(dir.x * speed, dir.y * speed, dir.z * speed),
        life: 0.6,
        maxLife: 0.6
      };
      _hitParticles.push(particle);
    }

    // Enforce max
    _cullOldest(_hitParticles, MAX_HIT_PARTICLES);
  }

  function onDeath(position, isHeadshot) {
    if (!_scene || !position) return;

    var count = isHeadshot ? 25 : Math.floor(_rand(12, 19)); // 12-18 inclusive
    var speedMin = isHeadshot ? 6 : 3;
    var speedMax = isHeadshot ? 14 : 9;
    var lifetime = 0.6;

    for (var i = 0; i < count; i++) {
      var radius = _rand(0.06, 0.15);
      var mesh = _makeSphere(radius, HIT_COLOR, 0.9);
      mesh.position.copy(position);
      _scene.add(mesh);

      var speed = _rand(speedMin, speedMax);
      var dir = _randDir();

      var particle = {
        mesh: mesh,
        velocity: new THREE.Vector3(dir.x * speed, dir.y * speed, dir.z * speed),
        life: lifetime,
        maxLife: lifetime
      };
      _deathParticles.push(particle);
    }

    // Ground decals: 3-5
    var decalCount = Math.floor(_rand(3, 6));
    for (var j = 0; j < decalCount; j++) {
      var w = 0.4 + Math.random() * 0.5;
      var h = 0.4 + Math.random() * 0.5;
      var decalMesh = _makePlane(w, h, POOL_COLOR, 0.7);
      // Flat on ground: rotate -90deg on X
      decalMesh.rotation.x = -Math.PI / 2;
      decalMesh.position.set(
        position.x + _rand(-0.4, 0.4),
        0.05,
        position.z + _rand(-0.4, 0.4)
      );
      _scene.add(decalMesh);
      _decals.push({ mesh: decalMesh });
    }

    _cullOldestDecals(_decals, MAX_DECALS);

    // Headshot extras: red mist + camera tint
    if (isHeadshot) {
      // 4 semi-transparent billboard planes at head level
      for (var k = 0; k < 4; k++) {
        var mistMesh = _makePlane(0.8, 0.8, 0xdd0011, 0.35);
        mistMesh.position.set(
          position.x + _rand(-0.3, 0.3),
          position.y + _rand(0.8, 1.4),
          position.z + _rand(-0.3, 0.3)
        );
        if (_camera) mistMesh.quaternion.copy(_camera.quaternion);
        _scene.add(mistMesh);
        _mistPlanes.push({ mesh: mistMesh });
      }

      // Camera CSS red tint for 0.15s
      _flashCameraRed();
    }
  }

  function _flashCameraRed() {
    // Find the renderer canvas and briefly apply a CSS filter
    var canvas = null;
    try {
      // Try to get canvas via renderer's domElement stored in scene userData
      if (_scene && _scene.userData && _scene.userData.rendererCanvas) {
        canvas = _scene.userData.rendererCanvas;
      }
    } catch (e) {}

    if (!canvas) {
      // Fallback: find first canvas in document
      canvas = document.querySelector('canvas');
    }

    if (!canvas) return;

    var prevFilter = canvas.style.filter || '';
    canvas.style.filter = 'hue-rotate(330deg) saturate(2)';
    setTimeout(function () {
      canvas.style.filter = prevFilter;
    }, 150);
  }

  function clear() {
    // Remove persisting decals
    var i;
    for (i = 0; i < _decals.length; i++) {
      if (_decals[i] && _decals[i].mesh && _scene) _scene.remove(_decals[i].mesh);
    }
    _decals.length = 0;

    // Remove mist planes
    for (i = 0; i < _mistPlanes.length; i++) {
      if (_mistPlanes[i] && _mistPlanes[i].mesh && _scene) _scene.remove(_mistPlanes[i].mesh);
    }
    _mistPlanes.length = 0;

    // Also clear active particles
    for (i = 0; i < _hitParticles.length; i++) {
      if (_hitParticles[i] && _hitParticles[i].mesh && _scene) _scene.remove(_hitParticles[i].mesh);
    }
    _hitParticles.length = 0;

    for (i = 0; i < _deathParticles.length; i++) {
      if (_deathParticles[i] && _deathParticles[i].mesh && _scene) _scene.remove(_deathParticles[i].mesh);
    }
    _deathParticles.length = 0;
  }

  function reset() {
    clear();
  }

  return {
    init: init,
    update: update,
    onHit: onHit,
    onDeath: onDeath,
    clear: clear,
    reset: reset
  };
})();
