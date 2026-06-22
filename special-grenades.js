// special-grenades.js — Smoke Grenade and Flashbang system
window.SpecialGrenades = (function() {

  var _scene = null;
  var _camera = null;
  var _enemyIterator = null;

  var _smokeCount = 2;
  var _flashCount = 1;
  var _maxSmoke = 4;
  var _maxFlash = 3;

  var _activeSmokes = [];
  var _activeFlashes = [];

  var _hudEl = null;
  var _flashOverlay = null;

  function init(scene, camera, enemyIterator) {
    _scene = scene;
    _camera = camera;
    _enemyIterator = enemyIterator;
    _smokeCount = 2;
    _flashCount = 1;
    _activeSmokes = [];
    _activeFlashes = [];
    _createHUD();
    _createFlashOverlay();
    _updateHUD();
  }

  function _createHUD() {
    if (_hudEl) { _hudEl.parentNode && _hudEl.parentNode.removeChild(_hudEl); }
    _hudEl = document.createElement('div');
    _hudEl.id = 'special-grenades-hud';
    _hudEl.style.cssText = 'position:fixed;bottom:52px;right:16px;color:#fff;font-family:monospace;font-size:13px;text-shadow:1px 1px 2px #000;z-index:999;pointer-events:none;';
    document.body.appendChild(_hudEl);
  }

  function _createFlashOverlay() {
    if (_flashOverlay) { _flashOverlay.parentNode && _flashOverlay.parentNode.removeChild(_flashOverlay); }
    _flashOverlay = document.createElement('div');
    _flashOverlay.id = 'flash-overlay';
    _flashOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;transition:none;';
    document.body.appendChild(_flashOverlay);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    _hudEl.innerHTML = '💨 SMOKE \xD7' + _smokeCount + ' | 💥 FLASH \xD7' + _flashCount;
  }

  function getSmokeCount() { return _smokeCount; }
  function getFlashCount() { return _flashCount; }
  function setSmokeCount(n) { _smokeCount = Math.max(0, Math.min(_maxSmoke, n)); _updateHUD(); }
  function setFlashCount(n) { _flashCount = Math.max(0, Math.min(_maxFlash, n)); _updateHUD(); }

  function _getLookTarget(playerPos, camera, dist) {
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(camera.quaternion);
    dir.y = Math.max(dir.y, -0.3);
    dir.normalize();
    return new THREE.Vector3(
      playerPos.x + dir.x * dist,
      playerPos.y + dir.y * dist,
      playerPos.z + dir.z * dist
    );
  }

  function throwSmoke(playerPos, camera) {
    if (_smokeCount <= 0 || !_scene) return;
    _smokeCount--;
    _updateHUD();

    var startPos = new THREE.Vector3(playerPos.x, playerPos.y + 0.5, playerPos.z);
    var targetPos = _getLookTarget(playerPos, camera, 12);
    targetPos.y = 0.1;

    var smoke = {
      startPos: startPos.clone(),
      targetPos: targetPos.clone(),
      throwT: 0,
      throwDone: false,
      landTime: 0,
      alive: true,
      spheres: [],
      group: null,
      opacity: 0.55,
      radius: 0.2,
      phase: 'flying' // flying -> growing -> active -> fading
    };

    _activeSmokes.push(smoke);
  }

  function _spawnSmokeCloud(smoke) {
    var group = new THREE.Group();
    group.position.copy(smoke.targetPos);
    _scene.add(group);
    smoke.group = group;

    var colors = [0xaaaaaa, 0x888888, 0x999999, 0xbbbbbb, 0xcccccc, 0x777777];
    for (var i = 0; i < 12; i++) {
      var geo = new THREE.SphereGeometry(0.3, 6, 6);
      var mat = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        transparent: true,
        opacity: 0.55,
        depthWrite: false
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 2.5,
        Math.random() * 1.5,
        (Math.random() - 0.5) * 2.5
      );
      mesh._drift = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.2
      );
      group.add(mesh);
      smoke.spheres.push(mesh);
    }
  }

  function throwFlash(playerPos, camera) {
    if (_flashCount <= 0 || !_scene) return;
    _flashCount--;
    _updateHUD();

    var startPos = new THREE.Vector3(playerPos.x, playerPos.y + 0.5, playerPos.z);
    var targetPos = _getLookTarget(playerPos, camera, 12);
    targetPos.y = 0.1;

    var flash = {
      startPos: startPos.clone(),
      targetPos: targetPos.clone(),
      throwT: 0,
      throwDone: false,
      landTime: 0,
      alive: true,
      phase: 'flying', // flying -> delay -> detonated
      triggered: false
    };

    // Tiny grenade mesh
    var geo = new THREE.SphereGeometry(0.12, 5, 5);
    var mat = new THREE.MeshBasicMaterial({ color: 0xffff88 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(startPos);
    _scene.add(mesh);
    flash.mesh = mesh;

    _activeFlashes.push(flash);
  }

  function _triggerFlash(flash) {
    if (flash.triggered) return;
    flash.triggered = true;

    // Screen effect
    if (_flashOverlay) {
      _flashOverlay.style.filter = 'brightness(10) saturate(0)';
      _flashOverlay.style.background = 'white';
      setTimeout(function() {
        var startTime = performance.now();
        var dur = 2500;
        function recover() {
          var elapsed = performance.now() - startTime;
          var t = Math.min(elapsed / dur, 1);
          var b = 10 - t * 9;
          if (_flashOverlay) {
            _flashOverlay.style.filter = 'brightness(' + b + ') saturate(' + t + ')';
            _flashOverlay.style.background = 'rgba(255,255,255,' + (1 - t) + ')';
          }
          if (t < 1) requestAnimationFrame(recover);
          else if (_flashOverlay) { _flashOverlay.style.filter = ''; _flashOverlay.style.background = ''; }
        }
        requestAnimationFrame(recover);
      }, 300);
    }

    // SFX
    if (window._audioCtx) {
      try {
        var ctx = window._audioCtx;
        var osc1 = ctx.createOscillator();
        var gain1 = ctx.createGain();
        osc1.frequency.value = 8000;
        osc1.type = 'sine';
        gain1.gain.setValueAtTime(0.5, ctx.currentTime);
        gain1.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.08);

        var osc2 = ctx.createOscillator();
        var gain2 = ctx.createGain();
        osc2.frequency.value = 3000;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.3, ctx.currentTime);
        gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 2);
      } catch(e) {}
    }

    // Stun nearby enemies
    var flashPos = flash.targetPos;
    if (_enemyIterator) {
      _enemyIterator(function(enemy) {
        if (!enemy || enemy.dead) return;
        var pos = enemy.position || (enemy.mesh && enemy.mesh.position);
        if (!pos) return;
        var dx = pos.x - flashPos.x;
        var dz = pos.z - flashPos.z;
        var dist = Math.sqrt(dx*dx + dz*dz);
        if (dist <= 8) {
          enemy._flashStunned = true;
          enemy._flashStunnedUntil = performance.now() + 3000;
        }
      });
    }
  }

  function update(delta, playerPos, allEnemies) {
    if (!delta) delta = 0.016;
    var now = performance.now();

    // Update flash stun timers on all enemies
    if (allEnemies) {
      for (var ei = 0; ei < allEnemies.length; ei++) {
        var en = allEnemies[ei];
        if (en && en._flashStunned && now > en._flashStunnedUntil) {
          en._flashStunned = false;
        }
      }
    }

    // Update smoke grenades
    window._smokeObstructed = false;
    for (var si = _activeSmokes.length - 1; si >= 0; si--) {
      var smoke = _activeSmokes[si];
      if (!smoke.alive) { _activeSmokes.splice(si, 1); continue; }

      if (smoke.phase === 'flying') {
        smoke.throwT += delta / 0.8;
        if (smoke.throwT >= 1) {
          smoke.throwT = 1;
          smoke.phase = 'growing';
          smoke.landTime = now;
          _spawnSmokeCloud(smoke);
        }
        // Parabolic arc visual (no mesh for smoke grenade in flight, just skip)
      }

      if (smoke.phase === 'growing') {
        var growT = Math.min((now - smoke.landTime) / 3000, 1);
        smoke.radius = 0.2 + growT * 3.3;
        if (smoke.group) smoke.group.scale.setScalar(smoke.radius / 3.5);
        if (growT >= 1) smoke.phase = 'active';
      }

      if (smoke.phase === 'active') {
        if (now - smoke.landTime > 27000) {
          smoke.phase = 'fading';
          smoke.fadeStart = now;
        }
        // Drift spheres
        if (smoke.spheres) {
          for (var spi = 0; spi < smoke.spheres.length; spi++) {
            var sp = smoke.spheres[spi];
            sp.position.x += sp._drift.x * delta;
            sp.position.y += sp._drift.y * delta;
            sp.position.z += sp._drift.z * delta;
          }
        }
      }

      if (smoke.phase === 'fading') {
        var fadeT = Math.min((now - smoke.fadeStart) / 3000, 1);
        var newOpacity = 0.55 * (1 - fadeT);
        if (smoke.spheres) {
          for (var fpi = 0; fpi < smoke.spheres.length; fpi++) {
            smoke.spheres[fpi].material.opacity = newOpacity;
          }
        }
        if (fadeT >= 1) {
          _removeSmoke(smoke);
          smoke.alive = false;
          continue;
        }
      }

      // Check if player is within smoke
      if (smoke.phase !== 'flying' && playerPos && smoke.group) {
        var sdx = playerPos.x - smoke.group.position.x;
        var sdz = playerPos.z - smoke.group.position.z;
        var sdist = Math.sqrt(sdx*sdx + sdz*sdz);
        if (sdist < 6) window._smokeObstructed = true;
      }

      // Apply smoke blind to enemies
      if (smoke.phase !== 'flying' && _enemyIterator && smoke.group) {
        var smokePos = smoke.group.position;
        var smokeRad = smoke.radius + 1;
        _enemyIterator(function(enemy) {
          if (!enemy || enemy.dead) return;
          var epos = enemy.position || (enemy.mesh && enemy.mesh.position);
          if (!epos) return;
          var edx = epos.x - smokePos.x;
          var edz = epos.z - smokePos.z;
          var edist = Math.sqrt(edx*edx + edz*edz);
          if (edist <= smokeRad) {
            enemy._smokeBlinded = true;
          } else {
            if (enemy._smokeBlinded) enemy._smokeBlinded = false;
          }
        });
      }
    }

    // Update flashbangs
    for (var fi = _activeFlashes.length - 1; fi >= 0; fi--) {
      var flash = _activeFlashes[fi];
      if (!flash.alive) { _activeFlashes.splice(fi, 1); continue; }

      if (flash.phase === 'flying') {
        flash.throwT += delta / 0.8;
        if (flash.throwT > 1) flash.throwT = 1;
        // Move mesh along parabolic arc
        if (flash.mesh) {
          var t = flash.throwT;
          var arc = Math.sin(t * Math.PI) * 2;
          flash.mesh.position.lerpVectors(flash.startPos, flash.targetPos, t);
          flash.mesh.position.y += arc;
        }
        if (flash.throwT >= 1) {
          flash.phase = 'delay';
          flash.landTime = now;
          if (flash.mesh) {
            _scene.remove(flash.mesh);
            flash.mesh = null;
          }
        }
      }

      if (flash.phase === 'delay') {
        if (now - flash.landTime >= 500) {
          flash.phase = 'detonated';
          _triggerFlash(flash);
          flash.alive = false;
        }
      }
    }
  }

  function _removeSmoke(smoke) {
    if (smoke.group && _scene) {
      _scene.remove(smoke.group);
    }
  }

  function clear() {
    for (var i = 0; i < _activeSmokes.length; i++) {
      _removeSmoke(_activeSmokes[i]);
    }
    _activeSmokes = [];
    for (var j = 0; j < _activeFlashes.length; j++) {
      var f = _activeFlashes[j];
      if (f.mesh && _scene) _scene.remove(f.mesh);
    }
    _activeFlashes = [];
    window._smokeObstructed = false;
  }

  function reset() {
    clear();
    _smokeCount = 2;
    _flashCount = 1;
    _updateHUD();
  }

  return {
    init: init,
    update: update,
    throwSmoke: throwSmoke,
    throwFlash: throwFlash,
    clear: clear,
    reset: reset,
    getSmokeCount: getSmokeCount,
    getFlashCount: getFlashCount,
    setSmokeCount: setSmokeCount,
    setFlashCount: setFlashCount
  };

})();
