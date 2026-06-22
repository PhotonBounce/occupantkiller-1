window.NukeStrike = (function() {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _active = false;
  var _phase = 'idle';
  var _timer = 0;
  var _charges = 1;
  var _cooldown = 0;
  var _COOLDOWN = 120;
  var _targetX = 0;
  var _targetZ = 0;
  var _shockwaveRings = [];
  var _mushroom = null;
  var _mushroomStem = null;
  var _dustCloud = null;
  var _fireball = null;
  var _hudEl = null;
  var _overlayEl = null;
  var _warningEl = null;
  var _countdownEl = null;
  var _countdownVal = 5;
  var _shakeTimer = 0;
  var _particles = [];
  var _audioCtx = null;

  function _getAudio() {
    if (!_audioCtx) {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  function _playWarning() {
    try {
      var ctx = _getAudio();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.2);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.4);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.0);
    } catch(e) {}
  }

  function _playDetonation() {
    try {
      var ctx = _getAudio();
      var bufLen = ctx.sampleRate * 4;
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        var t = i / ctx.sampleRate;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 1.5);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 120;
      var gain = ctx.createGain();
      gain.gain.value = 1.0;
      src.connect(lp); lp.connect(gain); gain.connect(ctx.destination);
      src.start();

      var osc = ctx.createOscillator();
      var oGain = ctx.createGain();
      osc.connect(oGain); oGain.connect(ctx.destination);
      osc.frequency.setValueAtTime(40, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 3);
      oGain.gain.setValueAtTime(0.8, ctx.currentTime);
      oGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 4);
    } catch(e) {}
  }

  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.style.cssText = 'position:fixed;top:12px;right:180px;color:#FF2200;font-family:monospace;font-size:13px;font-weight:bold;text-shadow:0 0 6px #FF0000;z-index:500;pointer-events:none';
    _hudEl.textContent = '☢ NUKE ×' + _charges;
    document.body.appendChild(_hudEl);

    _overlayEl = document.createElement('div');
    _overlayEl.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:3000;display:none;transition:opacity 1s';
    _overlayEl.style.background = 'rgba(255,220,100,0)';
    document.body.appendChild(_overlayEl);

    _warningEl = document.createElement('div');
    _warningEl.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#FF2200;font-family:monospace;font-size:28px;font-weight:bold;text-shadow:0 0 20px #FF0000;z-index:3100;display:none;letter-spacing:4px;text-align:center';
    _warningEl.innerHTML = '☢ NUCLEAR STRIKE ☢<br><span style="font-size:16px">EVACUATE AREA</span>';
    document.body.appendChild(_warningEl);

    _countdownEl = document.createElement('div');
    _countdownEl.style.cssText = 'position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);color:#FF8800;font-family:monospace;font-size:72px;font-weight:bold;text-shadow:0 0 30px #FF4400;z-index:3100;display:none';
    document.body.appendChild(_countdownEl);
  }

  function _spawnMushroom() {
    if (!_scene) return;
    var cx = _targetX, cz = _targetZ;

    var stemGeo = new THREE.CylinderGeometry(0.4, 1.2, 8, 10);
    var stemMat = new THREE.MeshBasicMaterial({ color: 0xDD8844, transparent: true, opacity: 0.85 });
    _mushroomStem = new THREE.Mesh(stemGeo, stemMat);
    _mushroomStem.position.set(cx, 4, cz);
    _scene.add(_mushroomStem);

    var capGeo = new THREE.SphereGeometry(4, 12, 8);
    var capMat = new THREE.MeshBasicMaterial({ color: 0xFF4400, transparent: true, opacity: 0.8 });
    _mushroom = new THREE.Mesh(capGeo, capMat);
    _mushroom.position.set(cx, 10, cz);
    _mushroom.scale.y = 0.6;
    _scene.add(_mushroom);

    var dustGeo = new THREE.SphereGeometry(6, 10, 6);
    var dustMat = new THREE.MeshBasicMaterial({ color: 0xAA7733, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    _dustCloud = new THREE.Mesh(dustGeo, dustMat);
    _dustCloud.position.set(cx, 1, cz);
    _scene.add(_dustCloud);

    var fbGeo = new THREE.SphereGeometry(2.5, 10, 8);
    var fbMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
    _fireball = new THREE.Mesh(fbGeo, fbMat);
    _fireball.position.set(cx, 0.5, cz);
    _scene.add(_fireball);

    var light1 = new THREE.PointLight(0xFFCC44, 30, 60);
    light1.position.set(cx, 2, cz);
    _scene.add(light1);
    var light2 = new THREE.PointLight(0xFF4400, 15, 40);
    light2.position.set(cx, 10, cz);
    _scene.add(light2);

    for (var i = 0; i < 3; i++) {
      var ringGeo = new THREE.RingGeometry(0.1, 0.5, 16);
      var ringMat = new THREE.MeshBasicMaterial({ color: 0xFF6600, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
      var ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(cx, 0.05, cz);
      _scene.add(ring);
      _shockwaveRings.push({ mesh: ring, radius: 0.1, speed: 12 + i * 6, life: 1.0 });
    }

    for (var j = 0; j < 20; j++) {
      var pGeo = new THREE.BoxGeometry(0.2 + Math.random() * 0.4, 0.2 + Math.random() * 0.4, 0.2 + Math.random() * 0.4);
      var pMat = new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xFF4400 : 0x888866 });
      var p = new THREE.Mesh(pGeo, pMat);
      p.position.set(cx + (Math.random()-0.5)*6, 0.5, cz + (Math.random()-0.5)*6);
      var angle = Math.random() * Math.PI * 2;
      var speed = 5 + Math.random() * 10;
      _scene.add(p);
      _particles.push({ mesh: p, vel: { x: Math.cos(angle)*speed, y: 3+Math.random()*8, z: Math.sin(angle)*speed }, life: 2.5 });
    }
  }

  function _damageEnemies() {
    if (!window.Enemies || !window.Enemies.getAll) return;
    var enemies = window.Enemies.getAll();
    var killed = 0;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.mesh) continue;
      var dx = e.mesh.position.x - _targetX;
      var dz = e.mesh.position.z - _targetZ;
      var dist = Math.sqrt(dx*dx + dz*dz);
      var dmg = 0;
      if (dist < 8) dmg = 9999;
      else if (dist < 18) dmg = 300;
      else if (dist < 30) dmg = 150;
      if (dmg > 0) {
        var prevHp = e.health || 100;
        if (e.takeDamage) e.takeDamage(dmg);
        else if (e.health !== undefined) e.health -= dmg;
        if ((e.health <= 0 || dmg >= 9999) && prevHp > 0) killed++;
      }
    }
    if (window.player && window.player.score !== undefined) {
      window.player.score += killed * 500;
      if (window.HUD && window.HUD.setScore) window.HUD.setScore(window.player.score);
    }
    if (killed > 0 && window.HUD && window.HUD.showToast) {
      window.HUD.showToast('NUCLEAR STRIKE! ×' + killed + ' ELIMINATED +' + (killed*500));
    }

    var distToPlayer = 0;
    if (_camera) {
      var pdx = _camera.position.x - _targetX;
      var pdz = _camera.position.z - _targetZ;
      distToPlayer = Math.sqrt(pdx*pdx + pdz*pdz);
    }
    if (distToPlayer < 15 && window.player) {
      var playerDmg = Math.max(0, Math.floor(150 * (1 - distToPlayer/15)));
      if (window.player.health !== undefined) window.player.health -= playerDmg;
      if (playerDmg > 0 && window.HUD && window.HUD.showToast) {
        window.HUD.showToast('⚠ BLAST WAVE! -' + playerDmg + ' HP');
      }
    }
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene;
    _camera = camera || window._camera;
    _createHUD();
  }

  function update(dt) {
    if (!_scene) {
      _scene = window._gameScene;
      _camera = window._camera;
    }

    if (_cooldown > 0) {
      _cooldown -= dt;
      if (_hudEl) _hudEl.textContent = '☢ NUKE [' + Math.ceil(_cooldown) + 's]';
    } else {
      if (_hudEl) _hudEl.textContent = '☢ NUKE ×' + _charges;
    }

    if (_phase === 'countdown') {
      _timer -= dt;
      var remaining = Math.ceil(_timer);
      if (_countdownEl && remaining !== _countdownVal) {
        _countdownVal = remaining;
        _countdownEl.textContent = _countdownVal;
        if (_countdownVal <= 0) {
          _countdownEl.style.display = 'none';
          _warningEl.style.display = 'none';
        }
      }
      if (_timer <= 0) {
        _phase = 'detonation';
        _timer = 8;
        _spawnMushroom();
        _damageEnemies();
        _playDetonation();
        _shakeTimer = 3.5;
        if (_overlayEl) {
          _overlayEl.style.display = 'block';
          _overlayEl.style.background = 'rgba(255,220,100,0.95)';
          setTimeout(function() {
            if (_overlayEl) {
              _overlayEl.style.transition = 'opacity 2s';
              _overlayEl.style.opacity = '0';
            }
          }, 200);
        }
        if (window._scene && window._scene.fog) {
          window._scene.fog.far = 8;
        }
      }
    }

    if (_phase === 'detonation') {
      _timer -= dt;
      _shakeTimer -= dt;

      if (_shakeTimer > 0 && _camera) {
        var intensity = Math.min(1, _shakeTimer / 1.5) * 0.35;
        _camera.position.x += (Math.random()-0.5) * intensity;
        _camera.position.y += (Math.random()-0.5) * intensity * 0.5;
        _camera.position.z += (Math.random()-0.5) * intensity;
      }

      for (var i = _shockwaveRings.length - 1; i >= 0; i--) {
        var r = _shockwaveRings[i];
        r.radius += r.speed * dt;
        r.life -= dt * 0.4;
        r.mesh.scale.set(r.radius, r.radius, 1);
        if (r.mesh.material) r.mesh.material.opacity = Math.max(0, r.life);
        if (r.life <= 0) {
          _scene.remove(r.mesh);
          _shockwaveRings.splice(i, 1);
        }
      }

      if (_mushroom) {
        _mushroom.position.y += dt * 4;
        _mushroom.scale.x = Math.min(1.5, _mushroom.scale.x + dt * 0.3);
        _mushroom.scale.z = Math.min(1.5, _mushroom.scale.z + dt * 0.3);
      }
      if (_mushroomStem) {
        _mushroomStem.scale.y = Math.min(1.5, (_mushroomStem.scale.y || 1) + dt * 0.2);
      }
      if (_dustCloud) {
        _dustCloud.scale.x = Math.min(3, _dustCloud.scale.x + dt * 0.6);
        _dustCloud.scale.z = Math.min(3, _dustCloud.scale.z + dt * 0.6);
      }
      if (_fireball) {
        _fireball.scale.x = Math.min(2, _fireball.scale.x + dt * 0.8);
        _fireball.scale.y = Math.min(2, _fireball.scale.y + dt * 0.8);
        _fireball.scale.z = Math.min(2, _fireball.scale.z + dt * 0.8);
        if (_fireball.material) _fireball.material.opacity = Math.max(0, (_timer / 8));
      }

      for (var j = _particles.length - 1; j >= 0; j--) {
        var p = _particles[j];
        p.mesh.position.x += p.vel.x * dt;
        p.mesh.position.y += p.vel.y * dt;
        p.mesh.position.z += p.vel.z * dt;
        p.vel.y -= 9.8 * dt;
        p.life -= dt;
        if (p.mesh.position.y < -1 || p.life <= 0) {
          _scene.remove(p.mesh);
          _particles.splice(j, 1);
        }
      }

      if (_timer <= 0) {
        _phase = 'idle';
        if (_mushroom) { _scene.remove(_mushroom); _mushroom = null; }
        if (_mushroomStem) { _scene.remove(_mushroomStem); _mushroomStem = null; }
        if (_dustCloud) { _scene.remove(_dustCloud); _dustCloud = null; }
        if (_fireball) { _scene.remove(_fireball); _fireball = null; }
        if (window._scene && window._scene.fog) window._scene.fog.far = 50;
        if (_overlayEl) { _overlayEl.style.display = 'none'; _overlayEl.style.opacity = '1'; }
      }
    }
  }

  function launch(x, z) {
    if (_charges <= 0 || _cooldown > 0 || _phase !== 'idle') {
      if (window.HUD && window.HUD.showToast) window.HUD.showToast('NUKE ON COOLDOWN');
      return;
    }
    _charges--;
    _cooldown = _COOLDOWN;
    _targetX = x !== undefined ? x : (_camera ? _camera.position.x + 20 : 20);
    _targetZ = z !== undefined ? z : (_camera ? _camera.position.z : 0);
    _phase = 'countdown';
    _timer = 5;
    _countdownVal = 5;
    _playWarning();
    if (_warningEl) _warningEl.style.display = 'block';
    if (_countdownEl) { _countdownEl.style.display = 'block'; _countdownEl.textContent = '5'; }
    if (window.HUD && window.HUD.showToast) window.HUD.showToast('☢ NUCLEAR STRIKE AUTHORIZED');
  }

  function reset() {
    _phase = 'idle';
    _timer = 0;
    _charges = 1;
    _cooldown = 0;
    _shockwaveRings = [];
    _particles = [];
    if (_mushroom && _scene) _scene.remove(_mushroom);
    if (_mushroomStem && _scene) _scene.remove(_mushroomStem);
    if (_dustCloud && _scene) _scene.remove(_dustCloud);
    if (_fireball && _scene) _scene.remove(_fireball);
    _mushroom = null; _mushroomStem = null; _dustCloud = null; _fireball = null;
    if (_warningEl) _warningEl.style.display = 'none';
    if (_countdownEl) _countdownEl.style.display = 'none';
    if (_overlayEl) { _overlayEl.style.display = 'none'; _overlayEl.style.opacity = '1'; }
    if (_hudEl) _hudEl.textContent = '☢ NUKE ×' + _charges;
  }

  // Ctrl+Shift+N to trigger nuke 30 units ahead of player
  document.addEventListener('keydown', function(e) {
    if (e.code === 'KeyN' && e.ctrlKey && e.shiftKey) {
      e.preventDefault();
      var tx = 0, tz = 30;
      if (_camera) {
        var fwd = new THREE.Vector3(0, 0, -1).applyEuler(_camera.rotation);
        tx = _camera.position.x + fwd.x * 30;
        tz = _camera.position.z + fwd.z * 30;
      }
      launch(tx, tz);
    }
  });

  return { init: init, update: update, launch: launch, reset: reset };
})();
