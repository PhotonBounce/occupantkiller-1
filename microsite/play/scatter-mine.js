// scatter-mine.js — cluster bomb that scatters multiple sub-mines on impact
// No let/const — only var throughout
window.ScatterMine = (function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;
  var _charges = 2;
  var _MAX_CLUSTERS = 3;
  var _clusters = [];  // active cluster projectiles
  var _subMines = [];  // active sub-mines on ground
  var _hudEl = null;
  var _keyDown = false;
  var _time = 0;

  // ── Audio helpers ─────────────────────────────────────────────────────────
  function _getAudioCtx() {
    return window._audioCtx || (function () {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      try { return new Ctor(); } catch (e) { return null; }
    }());
  }

  function _playWhistle() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.65);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.65);
  }

  function _playCrump() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    var buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.06));
    }
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(1.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }

  function _playPop(delay) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    var buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.025));
    }
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + 0.15);
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(ctx.currentTime + delay);
  }

  function _playWarningBeeps() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    for (var b = 0; b < 4; b++) {
      (function (idx) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.value = 900 + idx * 80;
        var t = ctx.currentTime + idx * 0.18;
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.12);
        osc.start(t);
        osc.stop(t + 0.12);
      }(b));
    }
  }

  // ── Visual explosion ──────────────────────────────────────────────────────
  function _spawnExplosion(x, y, z) {
    if (!_scene) return;

    // Flash light
    var light = new THREE.PointLight(0xFF6600, 8, 6);
    light.position.set(x, y + 0.4, z);
    _scene.add(light);
    setTimeout(function () { if (_scene) _scene.remove(light); }, 350);

    // Expanding orange sphere
    var sGeo = new THREE.SphereGeometry(0.15, 8, 8);
    var sMat = new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.85 });
    var sphere = new THREE.Mesh(sGeo, sMat);
    sphere.position.set(x, y + 0.3, z);
    _scene.add(sphere);
    var sStart = _time;
    sphere.userData._sStart = sStart;
    sphere.userData._expanding = true;
    _clusters.push({ _expSphere: sphere, _expStart: sStart, _done: false, _isExplosion: true });

    // Debris chunks
    for (var d = 0; d < 5; d++) {
      var dGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
      var dMat = new THREE.MeshLambertMaterial({ color: 0x333300 });
      var chunk = new THREE.Mesh(dGeo, dMat);
      chunk.position.set(x, y + 0.2, z);
      var vx = (Math.random() - 0.5) * 4;
      var vy = Math.random() * 3 + 1;
      var vz = (Math.random() - 0.5) * 4;
      chunk.userData._vx = vx;
      chunk.userData._vy = vy;
      chunk.userData._vz = vz;
      chunk.userData._life = 0;
      chunk.userData._isDebris = true;
      _scene.add(chunk);
      _clusters.push({ _debris: chunk, _done: false, _isDebris: true });
    }
  }

  function _spawnSubExplosion(x, y, z) {
    if (!_scene) return;

    var light = new THREE.PointLight(0xFF6600, 8, 6);
    light.position.set(x, y + 0.3, z);
    _scene.add(light);
    setTimeout(function () { if (_scene) _scene.remove(light); }, 250);

    var sGeo = new THREE.SphereGeometry(0.1, 6, 6);
    var sMat = new THREE.MeshBasicMaterial({ color: 0xFF4400, transparent: true, opacity: 0.9 });
    var sphere = new THREE.Mesh(sGeo, sMat);
    sphere.position.set(x, y + 0.2, z);
    _scene.add(sphere);
    _clusters.push({ _expSphere: sphere, _expStart: _time, _done: false, _isExplosion: true });

    for (var d = 0; d < 3; d++) {
      var dGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
      var dMat = new THREE.MeshLambertMaterial({ color: 0x442200 });
      var chunk = new THREE.Mesh(dGeo, dMat);
      chunk.position.set(x, y + 0.1, z);
      chunk.userData._vx = (Math.random() - 0.5) * 3;
      chunk.userData._vy = Math.random() * 2 + 0.5;
      chunk.userData._vz = (Math.random() - 0.5) * 3;
      chunk.userData._life = 0;
      chunk.userData._isDebris = true;
      _scene.add(chunk);
      _clusters.push({ _debris: chunk, _done: false, _isDebris: true });
    }
  }

  // ── Sub-mine detonation ───────────────────────────────────────────────────
  function _detonateSubMine(idx, isChain) {
    var sm = _subMines[idx];
    if (!sm || sm.dead) return;
    sm.dead = true;

    var sx = sm.x, sy = sm.y, sz = sm.z;

    // Remove mesh
    if (sm.mesh && _scene) {
      _scene.remove(sm.mesh);
      sm.mesh.geometry.dispose();
      sm.mesh.material.dispose();
    }
    if (sm.ledMesh && _scene) {
      _scene.remove(sm.ledMesh);
    }

    _spawnSubExplosion(sx, sy, sz);
    _playPop(0);

    var dmg = 40;
    var radius = 2.5;

    // Damage enemies
    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    for (var e = 0; e < enemies.length; e++) {
      var en = enemies[e];
      if (!en) continue;
      var ex = en.x !== undefined ? en.x : (en.position ? en.position.x : 0);
      var ez = en.z !== undefined ? en.z : (en.position ? en.position.z : 0);
      var dx = ex - sx, dz = ez - sz;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < radius) {
        var killed = false;
        if (en.health !== undefined) {
          killed = en.health > 0 && en.health <= dmg;
        }
        if (en.takeDamage) {
          en.takeDamage(dmg);
        } else if (en.health !== undefined) {
          en.health -= dmg;
        }
        if (killed || (en.health !== undefined && en.health <= 0)) {
          var pts = isChain ? 300 : 100;
          if (window.player && window.player.score !== undefined) {
            window.player.score += pts;
          }
        }
      }
    }

    // Damage player
    if (window.player && window.player.health !== undefined) {
      var px = window.player.x !== undefined ? window.player.x : (window.player.position ? window.player.position.x : 0);
      var pz = window.player.z !== undefined ? window.player.z : (window.player.position ? window.player.position.z : 0);
      var pdx = px - sx, pdz = pz - sz;
      if (Math.sqrt(pdx * pdx + pdz * pdz) < radius) {
        window.player.health -= dmg;
      }
    }

    // Chain detonation: check nearby sub-mines
    for (var c = 0; c < _subMines.length; c++) {
      if (c === idx) continue;
      var csm = _subMines[c];
      if (!csm || csm.dead) continue;
      var cdx = csm.x - sx, cdz = csm.z - sz;
      if (Math.sqrt(cdx * cdx + cdz * cdz) < 1.5) {
        (function (chainIdx) {
          setTimeout(function () { _detonateSubMine(chainIdx, true); }, 80);
        }(c));
      }
    }
  }

  // ── Scatter sub-mines on impact ───────────────────────────────────────────
  function _scatterSubMines(x, y, z) {
    if (!_scene) return;
    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      var r = Math.random() * 3 + 0.5;
      var sx = x + Math.sin(angle) * r;
      var sz = z + Math.cos(angle) * r;
      var sy = 0; // ground level

      // Sub-mine mesh: tiny red sphere
      var geo = new THREE.SphereGeometry(0.07, 4, 4);
      var mat = new THREE.MeshLambertMaterial({ color: 0xCC0000 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(sx, sy + 0.07, sz);
      _scene.add(mesh);

      // LED blink indicator — tiny bright sphere on top
      var ledGeo = new THREE.SphereGeometry(0.025, 4, 4);
      var ledMat = new THREE.MeshLambertMaterial({
        color: 0xFF0000,
        emissive: 0xFF0000,
        emissiveIntensity: 0
      });
      var ledMesh = new THREE.Mesh(ledGeo, ledMat);
      ledMesh.position.set(sx, sy + 0.14, sz);
      _scene.add(ledMesh);

      var sm = {
        mesh: mesh,
        ledMesh: ledMesh,
        ledMat: ledMat,
        x: sx,
        y: sy,
        z: sz,
        armed: false,
        dead: false,
        birthTime: _time,
        blinkPhase: Math.random() * Math.PI * 2
      };
      _subMines.push(sm);

      // Arm after 1 second
      (function (smRef) {
        setTimeout(function () {
          if (!smRef.dead) smRef.armed = true;
        }, 1000);
      }(sm));

      // Auto-expire after 30 seconds
      (function (smRef, capIdx) {
        setTimeout(function () {
          if (!smRef.dead) {
            _playWarningBeeps();
            setTimeout(function () {
              // Find current index since array may have shifted
              var realIdx = _subMines.indexOf(smRef);
              if (realIdx !== -1) _detonateSubMine(realIdx, false);
            }, 800);
          }
        }, 30000);
      }(sm, i));

      // Scatter pop sound
      _playPop(i * 0.06);
    }
  }

  // ── Throw scatter cluster ─────────────────────────────────────────────────
  function throw_(scene, camera) {
    var sc = scene || _scene;
    var cam = camera || _camera;
    if (!sc || !cam) return;

    // Check cluster limit (count active parent clusters, not just any)
    var activeParents = 0;
    for (var ci = 0; ci < _clusters.length; ci++) {
      if (_clusters[ci]._isParent && !_clusters[ci]._done) activeParents++;
    }
    if (activeParents >= _MAX_CLUSTERS) return;
    if (_charges <= 0) return;

    _charges--;
    _updateHUD();

    // Build projectile mesh
    var geo = new THREE.SphereGeometry(0.2, 6, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0x556B2F }); // dark olive
    var mesh = new THREE.Mesh(geo, mat);

    // Get camera position and forward direction
    var camPos = cam.position.clone();
    var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).normalize();

    // Start position: slightly in front of camera
    var startPos = camPos.clone().add(fwd.clone().multiplyScalar(1.5));
    startPos.y -= 0.3;
    mesh.position.copy(startPos);
    sc.add(mesh);

    // Arc velocity: forward 10 units, with upward arc
    var vx = fwd.x * 12;
    var vy = 6 + fwd.y * 4;
    var vz = fwd.z * 12;

    var cluster = {
      mesh: mesh,
      x: startPos.x,
      y: startPos.y,
      z: startPos.z,
      vx: vx,
      vy: vy,
      vz: vz,
      _done: false,
      _isParent: true,
      _scene: sc,
      _whistled: false
    };
    _clusters.push(cluster);
    _playWhistle();
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function _createHUD() {
    var el = document.getElementById('scatterMineHUD');
    if (el) { _hudEl = el; return; }
    el = document.createElement('div');
    el.id = 'scatterMineHUD';
    el.style.cssText = [
      'position:fixed',
      'bottom:54px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.65)',
      'color:#FF6600',
      'font:bold 14px monospace',
      'padding:4px 12px',
      'border-radius:4px',
      'border:1px solid #FF6600',
      'pointer-events:none',
      'z-index:9999',
      'user-select:none'
    ].join(';');
    document.body.appendChild(el);
    _hudEl = el;
  }

  function _updateHUD() {
    if (!_hudEl) _createHUD();
    if (_hudEl) _hudEl.textContent = '💥 SCATTER \xd7' + _charges;
  }

  // ── Key handling ──────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    if (_keyDown) return;
    if ((e.ctrlKey || e.metaKey) && (e.key === 'm' || e.key === 'M')) {
      e.preventDefault();
      _keyDown = true;
      throw_(_scene, _camera);
    }
  }

  function _onKeyUp(e) {
    if (e.key === 'm' || e.key === 'M') {
      _keyDown = false;
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene = scene || window._gameScene || null;
    _camera = camera || window._camera || null;
    _clusters = [];
    _subMines = [];
    _charges = 2;
    _keyDown = false;
    _time = 0;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup', _onKeyUp);

    _createHUD();
    _updateHUD();
  }

  // ── Update (call each frame with delta seconds) ───────────────────────────
  function update(dt) {
    dt = dt || 0.016;
    _time += dt;

    var gravity = -9.8;
    var i, cl, sm;

    // -- Update cluster projectiles (parent arcs + explosion VFX)
    for (i = _clusters.length - 1; i >= 0; i--) {
      cl = _clusters[i];

      if (cl._isExplosion) {
        // Expand and fade the explosion sphere
        var age = _time - cl._expStart;
        if (cl._expSphere) {
          cl._expSphere.scale.setScalar(1 + age * 8);
          cl._expSphere.material.opacity = Math.max(0, 0.85 - age * 3.5);
          if (age > 0.45) {
            if (_scene) _scene.remove(cl._expSphere);
            cl._expSphere.geometry.dispose();
            cl._expSphere.material.dispose();
            cl._done = true;
          }
        }
        continue;
      }

      if (cl._isDebris) {
        var ch = cl._debris;
        if (!ch) { cl._done = true; continue; }
        ch.userData._life += dt;
        ch.position.x += ch.userData._vx * dt;
        ch.position.y += ch.userData._vy * dt + 0.5 * gravity * dt * dt * ch.userData._life;
        ch.position.z += ch.userData._vz * dt;
        ch.userData._vy += gravity * dt;
        ch.rotation.x += 2.5 * dt;
        ch.rotation.z += 1.8 * dt;
        if (ch.position.y < -0.5 || ch.userData._life > 1.5) {
          if (_scene) _scene.remove(ch);
          ch.geometry.dispose();
          ch.material.dispose();
          cl._done = true;
        }
        continue;
      }

      if (!cl._isParent || cl._done) continue;

      // Integrate arc
      cl.vy += gravity * dt;
      cl.x += cl.vx * dt;
      cl.y += cl.vy * dt;
      cl.z += cl.vz * dt;

      if (cl.mesh) {
        cl.mesh.position.set(cl.x, cl.y, cl.z);
        cl.mesh.rotation.x += 2 * dt;
        cl.mesh.rotation.z += 1.5 * dt;
      }

      // Impact: hits ground (y <= 0) or goes very low
      if (cl.y <= 0.1) {
        cl._done = true;
        if (cl.mesh && cl._scene) {
          cl._scene.remove(cl.mesh);
          cl.mesh.geometry.dispose();
          cl.mesh.material.dispose();
        }
        _playCrump();
        _spawnExplosion(cl.x, 0, cl.z);
        _scatterSubMines(cl.x, 0, cl.z);
      }
    }

    // Prune done clusters
    for (i = _clusters.length - 1; i >= 0; i--) {
      if (_clusters[i]._done) _clusters.splice(i, 1);
    }

    // -- Update sub-mines: LED blink + proximity trigger
    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];

    for (i = _subMines.length - 1; i >= 0; i--) {
      sm = _subMines[i];
      if (!sm || sm.dead) {
        _subMines.splice(i, 1);
        continue;
      }

      // LED blink (1 Hz before armed, 4 Hz after)
      if (sm.ledMat) {
        var freq = sm.armed ? 4 : 1;
        var blinkVal = Math.sin(_time * Math.PI * 2 * freq + sm.blinkPhase) > 0 ? 1 : 0;
        sm.ledMat.emissiveIntensity = blinkVal;
      }

      if (!sm.armed) continue;

      // Check enemy proximity
      var triggered = false;
      for (var e = 0; e < enemies.length; e++) {
        var en = enemies[e];
        if (!en) continue;
        var ex = en.x !== undefined ? en.x : (en.position ? en.position.x : 0);
        var ez = en.z !== undefined ? en.z : (en.position ? en.position.z : 0);
        var dx = ex - sm.x, dz = ez - sm.z;
        if (Math.sqrt(dx * dx + dz * dz) < 0.6) {
          triggered = true;
          break;
        }
      }

      // Check player proximity
      if (!triggered && window.player) {
        var ppx = window.player.x !== undefined ? window.player.x : (window.player.position ? window.player.position.x : 0);
        var ppz = window.player.z !== undefined ? window.player.z : (window.player.position ? window.player.position.z : 0);
        var ppdx = ppx - sm.x, ppdz = ppz - sm.z;
        if (Math.sqrt(ppdx * ppdx + ppdz * ppdz) < 0.6) {
          triggered = true;
        }
      }

      if (triggered) {
        _detonateSubMine(i, false);
      }
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  function reset() {
    // Clean up all active clusters
    var i, cl, sm;
    for (i = 0; i < _clusters.length; i++) {
      cl = _clusters[i];
      if (cl._isParent && cl.mesh && _scene) {
        _scene.remove(cl.mesh);
        if (cl.mesh.geometry) cl.mesh.geometry.dispose();
        if (cl.mesh.material) cl.mesh.material.dispose();
      }
      if (cl._isExplosion && cl._expSphere && _scene) {
        _scene.remove(cl._expSphere);
        if (cl._expSphere.geometry) cl._expSphere.geometry.dispose();
        if (cl._expSphere.material) cl._expSphere.material.dispose();
      }
      if (cl._isDebris && cl._debris && _scene) {
        _scene.remove(cl._debris);
        if (cl._debris.geometry) cl._debris.geometry.dispose();
        if (cl._debris.material) cl._debris.material.dispose();
      }
    }
    _clusters = [];

    // Clean up sub-mines
    for (i = 0; i < _subMines.length; i++) {
      sm = _subMines[i];
      if (!sm) continue;
      if (sm.mesh && _scene) {
        _scene.remove(sm.mesh);
        sm.mesh.geometry.dispose();
        sm.mesh.material.dispose();
      }
      if (sm.ledMesh && _scene) {
        _scene.remove(sm.ledMesh);
        sm.ledMesh.geometry.dispose();
        sm.ledMesh.material.dispose();
      }
    }
    _subMines = [];

    _charges = 2;
    _keyDown = false;
    _updateHUD();
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    throw_: throw_,
    reset: reset
  };

}());
