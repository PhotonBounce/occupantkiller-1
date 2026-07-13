/**
 * scorch-marks.js
 * Persistent visual damage: scorch marks and explosion craters on terrain.
 *
 * Public API (IIFE, all var):
 *   ScorchMarks.init(scene)
 *   ScorchMarks.addScorch(x, y, z, radius)
 *   ScorchMarks.addCrater(x, y, z, radius)
 *   ScorchMarks.addBulletMark(x, z)
 *   ScorchMarks.update(dt)
 *   ScorchMarks.reset()
 *
 * Hook: window._onExplosionForScorch(x, y, z, radius) — called by C4, grenade, mortar, etc.
 */
window.ScorchMarks = (function () {
  'use strict';

  /* ── constants ──────────────────────────────────────────────── */
  var MAX_SCORCH = 50;
  var MAX_CRATERS = 20;
  var MAX_BULLET_MARKS = 100;
  var SMOKE_DURATION = 8;          // seconds after placement
  var SMOKE_RATE = 2;              // smoke wisps per second
  var GROUND_Y_OFFSET = 0.01;

  /* ── module state ───────────────────────────────────────────── */
  var _scene = null;
  var _scorches = [];   // { mesh, thermiteCore, smokeState, spawnTime }
  var _craters = [];    // { group, smokeState, spawnTime }
  var _bulletMarks = []; // { mesh }
  var _clock = 0;

  /* ── rain/wet helpers ───────────────────────────────────────── */
  function _isRaining() {
    return (
      (window.WeatherSystem && typeof window.WeatherSystem.isRaining === 'function' && window.WeatherSystem.isRaining()) ||
      (window.WeatherEffects && window.WeatherEffects.rainActive) ||
      false
    );
  }

  /* ── Three.js guard ─────────────────────────────────────────── */
  function _THREE() {
    return (typeof THREE !== 'undefined') ? THREE : null;
  }

  /* ── mesh disposal helper ───────────────────────────────────── */
  function _disposeMesh(obj) {
    if (!obj) return;
    var T = _THREE();
    if (!T) return;
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        for (var i = 0; i < obj.material.length; i++) obj.material[i].dispose();
      } else {
        obj.material.dispose();
      }
    }
  }

  function _removeFromScene(obj) {
    if (!obj || !_scene) return;
    _scene.remove(obj);
    _disposeMesh(obj);
  }

  function _removeGroupFromScene(grp) {
    if (!grp || !_scene) return;
    _scene.remove(grp);
    grp.traverse(function (child) {
      _disposeMesh(child);
    });
  }

  /* ── smoke wisp pool ────────────────────────────────────────── */
  function _SmokeState() {
    return {
      wisps: [],          // active smoke particle objects: { mesh, vy, age, maxAge }
      accum: 0,           // time accumulator for spawn rate
      done: false,        // true after smoke lifetime elapsed
      elapsed: 0          // total elapsed since scorch/crater placed
    };
  }

  function _spawnSmoke(x, y, z, smokeState) {
    var T = _THREE();
    if (!T || !_scene) return;
    var geo = new T.SphereGeometry(0.08 + Math.random() * 0.06, 4, 4);
    var mat = new T.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.5 + Math.random() * 0.2,
      depthWrite: false
    });
    var mesh = new T.Mesh(geo, mat);
    mesh.position.set(
      x + (Math.random() - 0.5) * 0.4,
      y + 0.1 + Math.random() * 0.2,
      z + (Math.random() - 0.5) * 0.4
    );
    _scene.add(mesh);
    smokeState.wisps.push({
      mesh: mesh,
      vy: 0.4 + Math.random() * 0.4,
      age: 0,
      maxAge: 1.2 + Math.random() * 0.8
    });
  }

  function _updateSmoke(smokeState, x, y, z, dt) {
    if (smokeState.done) return;
    smokeState.elapsed += dt;

    var rain = _isRaining();

    // spawn new wisps while within SMOKE_DURATION
    if (smokeState.elapsed < SMOKE_DURATION) {
      if (!rain) {
        smokeState.accum += dt;
        var interval = 1 / SMOKE_RATE;
        while (smokeState.accum >= interval) {
          smokeState.accum -= interval;
          _spawnSmoke(x, y, z, smokeState);
        }
      } else {
        // rain: half rate
        smokeState.accum += dt * 0.5;
        var intervalR = 1 / SMOKE_RATE;
        while (smokeState.accum >= intervalR) {
          smokeState.accum -= intervalR;
          _spawnSmoke(x, y, z, smokeState);
        }
      }
    }

    // update existing wisps
    var alive = [];
    for (var i = 0; i < smokeState.wisps.length; i++) {
      var w = smokeState.wisps[i];
      w.age += dt;
      w.mesh.position.y += w.vy * dt;
      w.mesh.position.x += (Math.random() - 0.5) * 0.02;
      w.mesh.position.z += (Math.random() - 0.5) * 0.02;
      var t = w.age / w.maxAge;
      var opacity = (1 - t) * 0.45;
      w.mesh.material.opacity = opacity;
      if (w.age < w.maxAge) {
        alive.push(w);
      } else {
        _scene.remove(w.mesh);
        _disposeMesh(w.mesh);
      }
    }
    smokeState.wisps = alive;

    if (smokeState.elapsed >= SMOKE_DURATION && smokeState.wisps.length === 0) {
      smokeState.done = true;
    }
  }

  function _clearSmokeState(smokeState) {
    for (var i = 0; i < smokeState.wisps.length; i++) {
      if (_scene) _scene.remove(smokeState.wisps[i].mesh);
      _disposeMesh(smokeState.wisps[i].mesh);
    }
    smokeState.wisps = [];
    smokeState.done = true;
  }

  /* ── addScorch ──────────────────────────────────────────────── */
  function addScorch(x, y, z, radius) {
    var T = _THREE();
    if (!T || !_scene) return;

    var r = radius || 1.0;
    var rain = _isRaining();
    var color = rain ? 0x100500 : 0x1A0800;

    // dark burn circle
    var geo = new T.CircleGeometry(r, 16);
    var mat = new T.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      side: T.DoubleSide
    });
    var mesh = new T.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = Math.random() * Math.PI * 2;
    mesh.position.set(x, y + GROUND_Y_OFFSET, z);
    _scene.add(mesh);

    // thermite burn: bright orange core overlaid
    var coreGeo = new T.CircleGeometry(r * 0.35, 12);
    var coreMat = new T.MeshBasicMaterial({
      color: 0xFF6600,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      side: T.DoubleSide
    });
    var coreMesh = new T.Mesh(coreGeo, coreMat);
    coreMesh.rotation.x = -Math.PI / 2;
    coreMesh.rotation.z = Math.random() * Math.PI * 2;
    coreMesh.position.set(x, y + GROUND_Y_OFFSET * 1.5, z);
    _scene.add(coreMesh);

    var entry = {
      mesh: mesh,
      thermiteCore: coreMesh,
      smokeState: _SmokeState(),
      x: x, y: y, z: z
    };

    // enforce pool limit — remove oldest first
    if (_scorches.length >= MAX_SCORCH) {
      var oldest = _scorches.shift();
      _clearSmokeState(oldest.smokeState);
      _removeFromScene(oldest.mesh);
      _removeFromScene(oldest.thermiteCore);
    }

    _scorches.push(entry);
  }

  /* ── addCrater ──────────────────────────────────────────────── */
  function addCrater(x, y, z, radius) {
    var T = _THREE();
    if (!T || !_scene) return;

    var r = radius || 1.5;
    var grp = new T.Group();
    grp.position.set(x, y, z);

    // crater base: dark earth
    var baseGeo = new T.CircleGeometry(r * 1.2, 20);
    var baseMat = new T.MeshBasicMaterial({
      color: 0x3A2810,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      side: T.DoubleSide
    });
    var baseMesh = new T.Mesh(baseGeo, baseMat);
    baseMesh.rotation.x = -Math.PI / 2;
    baseMesh.position.y = GROUND_Y_OFFSET;
    grp.add(baseMesh);

    // crater rim: torus ring
    var rimGeo = new T.TorusGeometry(r, 0.08, 4, 16);
    var rimMat = new T.MeshBasicMaterial({ color: 0x5A4020 });
    var rimMesh = new T.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = -Math.PI / 2;
    rimMesh.position.y = GROUND_Y_OFFSET * 2;
    grp.add(rimMesh);

    // 6-8 raised dirt clumps around crater edge
    var numClumps = 6 + Math.floor(Math.random() * 3);  // 6, 7, or 8
    for (var i = 0; i < numClumps; i++) {
      var angle = (i / numClumps) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      var dist = r * (0.9 + Math.random() * 0.3);
      var clumpGeo = new T.SphereGeometry(0.2, 6, 6);
      var clumpMat = new T.MeshBasicMaterial({ color: 0x5A4020 });
      var clump = new T.Mesh(clumpGeo, clumpMat);
      clump.position.set(
        Math.cos(angle) * dist + (Math.random() - 0.5) * 0.2,
        GROUND_Y_OFFSET + 0.1 + Math.random() * 0.15,
        Math.sin(angle) * dist + (Math.random() - 0.5) * 0.2
      );
      clump.scale.set(
        0.8 + Math.random() * 0.6,
        0.4 + Math.random() * 0.4,
        0.8 + Math.random() * 0.6
      );
      grp.add(clump);
    }

    _scene.add(grp);

    var entry = {
      group: grp,
      smokeState: _SmokeState(),
      x: x, y: y, z: z
    };

    // enforce pool limit
    if (_craters.length >= MAX_CRATERS) {
      var oldest = _craters.shift();
      _clearSmokeState(oldest.smokeState);
      _removeGroupFromScene(oldest.group);
    }

    _craters.push(entry);
  }

  /* ── addBulletMark ──────────────────────────────────────────── */
  function addBulletMark(x, z) {
    var T = _THREE();
    if (!T || !_scene) return;

    var geo = new T.CircleGeometry(0.06, 8);
    var mat = new T.MeshBasicMaterial({
      color: 0x1A1008,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      side: T.DoubleSide
    });
    var mesh = new T.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = Math.random() * Math.PI * 2;
    mesh.position.set(x, GROUND_Y_OFFSET, z);
    _scene.add(mesh);

    if (_bulletMarks.length >= MAX_BULLET_MARKS) {
      var oldest = _bulletMarks.shift();
      _removeFromScene(oldest.mesh);
    }

    _bulletMarks.push({ mesh: mesh });
  }

  /* ── update ─────────────────────────────────────────────────── */
  function update(dt) {
    if (!_scene) return;
    var delta = dt || 0.016;
    _clock += delta;

    for (var i = 0; i < _scorches.length; i++) {
      var s = _scorches[i];
      if (!s.smokeState.done) {
        _updateSmoke(s.smokeState, s.x, s.y, s.z, delta);
      }
    }

    for (var j = 0; j < _craters.length; j++) {
      var c = _craters[j];
      if (!c.smokeState.done) {
        _updateSmoke(c.smokeState, c.x, c.y, c.z, delta);
      }
    }
  }

  /* ── reset ──────────────────────────────────────────────────── */
  function reset() {
    var i;
    for (i = 0; i < _scorches.length; i++) {
      _clearSmokeState(_scorches[i].smokeState);
      _removeFromScene(_scorches[i].mesh);
      _removeFromScene(_scorches[i].thermiteCore);
    }
    _scorches = [];

    for (i = 0; i < _craters.length; i++) {
      _clearSmokeState(_craters[i].smokeState);
      _removeGroupFromScene(_craters[i].group);
    }
    _craters = [];

    for (i = 0; i < _bulletMarks.length; i++) {
      _removeFromScene(_bulletMarks[i].mesh);
    }
    _bulletMarks = [];

    _clock = 0;
  }

  /* ── init ───────────────────────────────────────────────────── */
  function init(scene) {
    _scene = scene || null;
    _scorches = [];
    _craters = [];
    _bulletMarks = [];
    _clock = 0;

    // Global explosion hook — called by C4, grenade, mortar, etc.
    window._onExplosionForScorch = function (x, y, z, radius) {
      var r = radius || 1.5;
      addScorch(x, y, z, r * 0.7);
      addCrater(x, y, z, r);
    };

    console.log('[ScorchMarks] initialised');
  }

  /* ── public API ─────────────────────────────────────────────── */
  return {
    init: init,
    addScorch: addScorch,
    addCrater: addCrater,
    addBulletMark: addBulletMark,
    update: update,
    reset: reset
  };
})();
