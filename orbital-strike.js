/* ───────────────────────────────────────────────────────────────────────────
   orbital-strike.js — Radio calldown for precision airstrike
   Ctrl+O  → enter targeting mode (crosshair turns red)
   Click   → confirm target → 4-second countdown → massive impact
   API     : window.OrbitalStrike = { init, update, call, reset }
   ─────────────────────────────────────────────────────────────────────────── */
window.OrbitalStrike = (function () {
  'use strict';

  /* ── state ─────────────────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _canvas   = null;

  var _charges   = 2;
  var _cooldownRemaining = 0;
  var COOLDOWN_TIME      = 45;   // seconds

  var _targeting = false;        // waiting for player to click
  var _pending   = false;        // countdown in progress
  var _pendingTarget = null;     // { x, y, z }
  var _pendingTimer  = 0;

  /* active scene objects to clean up */
  var _lights      = [];
  var _explosions  = [];         // { mesh, mat, t, life, vx, vy, vz, grow }
  var _debris      = [];         // { mesh, mat, t, life, vx, vy, vz }
  var _craters     = [];         // { mesh, mat, t, life }

  /* camera shake */
  var _shakeTime = 0;
  var SHAKE_DURATION = 1.5;

  /* HUD badge element */
  var _badge = null;

  /* countdown overlay element */
  var _countdownEl = null;

  /* ── audio helpers ─────────────────────────────────────────────────────── */
  function _getAudioCtx() {
    return window._audioCtx ||
      (window._audioCtx = new (window.AudioContext || window.webkitAudioContext)());
  }

  function _playRadioStatic() {
    try {
      var ctx = _getAudioCtx();
      var bufSize = ctx.sampleRate * 0.6;
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.18;
      var src = ctx.createBufferSource();
      src.buffer = buf;
      /* band-pass to give a "radio" quality */
      var bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 1800;
      bpf.Q.value = 1.2;
      src.connect(bpf);
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.55);
      bpf.connect(gain);
      gain.connect(ctx.destination);
      src.start();
      src.stop(ctx.currentTime + 0.6);
    } catch (e) { /* silent */ }
  }

  function _playJetRoar() {
    try {
      var ctx = _getAudioCtx();
      var osc1 = ctx.createOscillator();
      var osc2 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(80, ctx.currentTime);
      osc1.frequency.linearRampToValueAtTime(220, ctx.currentTime + 2.5);
      osc2.frequency.setValueAtTime(95, ctx.currentTime);
      osc2.frequency.linearRampToValueAtTime(260, ctx.currentTime + 2.5);
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.4);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 2.0);
      gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 2.5);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 2.5);
      osc2.stop(ctx.currentTime + 2.5);
    } catch (e) { /* silent */ }
  }

  function _playBoom() {
    try {
      var ctx = _getAudioCtx();
      /* sub boom */
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(18, ctx.currentTime + 1.2);
      var boomGain = ctx.createGain();
      boomGain.gain.setValueAtTime(0.7, ctx.currentTime);
      boomGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
      osc.connect(boomGain);
      boomGain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.4);
      /* white noise burst */
      var bLen = ctx.sampleRate * 0.8;
      var nBuf = ctx.createBuffer(1, bLen, ctx.sampleRate);
      var nd = nBuf.getChannelData(0);
      for (var i = 0; i < bLen; i++) nd[i] = (Math.random() * 2 - 1);
      var nSrc = ctx.createBufferSource();
      nSrc.buffer = nBuf;
      var nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.6, ctx.currentTime);
      nGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      nSrc.connect(nGain);
      nGain.connect(ctx.destination);
      nSrc.start();
      nSrc.stop(ctx.currentTime + 0.8);
    } catch (e) { /* silent */ }
  }

  /* ── HUD badge ─────────────────────────────────────────────────────────── */
  function _createBadge() {
    if (_badge) return;
    _badge = document.createElement('div');
    _badge.id = 'orbital-strike-badge';
    _badge.style.cssText = [
      'position:fixed',
      'top:36px',
      'right:12px',
      'background:rgba(0,0,0,0.65)',
      'border:1px solid rgba(255,68,0,0.7)',
      'color:#ff6622',
      'padding:3px 10px',
      'border-radius:4px',
      'font-size:12px',
      'font-family:monospace',
      'z-index:220',
      'pointer-events:none',
      'letter-spacing:1px',
    ].join(';');
    document.body.appendChild(_badge);
    _updateBadge();
  }

  function _updateBadge() {
    if (!_badge) return;
    if (_charges <= 0 && _cooldownRemaining <= 0) {
      _badge.textContent = '☄ STRIKE \xD70';
      _badge.style.color = '#666';
      _badge.style.borderColor = 'rgba(100,100,100,0.4)';
    } else if (_cooldownRemaining > 0) {
      _badge.textContent = '☄ STRIKE \xD7' + _charges + ' [' + Math.ceil(_cooldownRemaining) + 's]';
      _badge.style.color = '#ffaa44';
      _badge.style.borderColor = 'rgba(255,170,68,0.5)';
    } else {
      _badge.textContent = '☄ STRIKE \xD7' + _charges;
      _badge.style.color = '#ff6622';
      _badge.style.borderColor = 'rgba(255,68,0,0.7)';
    }
  }

  /* ── Countdown HUD ─────────────────────────────────────────────────────── */
  function _createCountdownEl() {
    if (_countdownEl) return;
    _countdownEl = document.createElement('div');
    _countdownEl.id = 'orbital-countdown';
    _countdownEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'display:none',
      'color:#ff2200',
      'font-size:28px',
      'font-family:monospace',
      'font-weight:bold',
      'z-index:230',
      'pointer-events:none',
      'text-shadow:0 0 16px rgba(255,40,0,0.8)',
      'letter-spacing:2px',
    ].join(';');
    document.body.appendChild(_countdownEl);
  }

  function _showCountdown(sec) {
    if (!_countdownEl) return;
    if (sec <= 0) {
      _countdownEl.style.display = 'none';
      return;
    }
    _countdownEl.style.display = 'block';
    _countdownEl.textContent = 'STRIKE INBOUND ' + sec + '...';
  }

  /* ── Targeting-mode CSS on canvas ─────────────────────────────────────── */
  function _enterTargetMode() {
    _targeting = true;
    if (_canvas) {
      _canvas.style.outline = '3px solid #ff2200';
      _canvas.style.cursor  = 'crosshair';
    }
    _showToast('ORBITAL STRIKE INBOUND!');
    _playRadioStatic();
    _playJetRoar();
  }

  function _exitTargetMode() {
    _targeting = false;
    if (_canvas) {
      _canvas.style.outline = '';
      _canvas.style.cursor  = '';
    }
  }

  /* ── Toast helper ──────────────────────────────────────────────────────── */
  function _showToast(msg) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
    } else if (window.HUD && window.HUD.notifyPickup) {
      window.HUD.notifyPickup(msg);
    }
  }

  /* ── Raycasting: where did the player click on the ground? ────────────── */
  function _groundPositionFromClick(event) {
    if (!_scene || !_camera) return null;
    var rect = _canvas ? _canvas.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    var nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    var ny = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    /* Use THREE.Raycaster if available */
    if (typeof THREE !== 'undefined' && THREE.Raycaster) {
      var raycaster = new THREE.Raycaster();
      raycaster.setFromCamera({ x: nx, y: ny }, _camera);
      /* intersect a large ground plane at y=0 */
      var groundNormal = new THREE.Vector3(0, 1, 0);
      var groundPlane  = new THREE.Plane(groundNormal, 0);
      var target       = new THREE.Vector3();
      var hit = raycaster.ray.intersectPlane(groundPlane, target);
      if (hit) return { x: target.x, y: 0, z: target.z };
    }
    /* Fallback: project slightly ahead of camera */
    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);
    return {
      x: _camera.position.x + dir.x * 30,
      y: 0,
      z: _camera.position.z + dir.z * 30,
    };
  }

  /* ── Impact: explosion + damage + crater + shake ──────────────────────── */
  function _doImpact(pos) {
    if (!_scene) return;

    _playBoom();

    /* Point-light flash */
    var flash = new THREE.PointLight(0xFF4400, 20, 25);
    flash.position.set(pos.x, pos.y + 1, pos.z);
    _scene.add(flash);
    _lights.push({ light: flash, t: 0, life: 0.4 });

    /* 8 explosion spheres */
    for (var i = 0; i < 8; i++) {
      var geo = new THREE.SphereGeometry(0.5, 8, 6);
      var color = (i % 2 === 0) ? 0xFF4400 : 0xFF8800;
      var mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.9 });
      var mesh = new THREE.Mesh(geo, mat);
      var angle = (i / 8) * Math.PI * 2;
      var radius = 1.5 + Math.random() * 2;
      mesh.position.set(
        pos.x + Math.cos(angle) * radius,
        pos.y + 0.3,
        pos.z + Math.sin(angle) * radius
      );
      _scene.add(mesh);
      _explosions.push({
        mesh: mesh, mat: mat,
        t: 0, life: 0.9 + Math.random() * 0.4,
        grow: 8 + Math.random() * 6,
        vx: Math.cos(angle) * (2 + Math.random() * 3),
        vy: 2 + Math.random() * 4,
        vz: Math.sin(angle) * (2 + Math.random() * 3),
      });
    }

    /* debris chunks */
    for (var j = 0; j < 12; j++) {
      var dGeo = new THREE.SphereGeometry(0.18 + Math.random() * 0.22, 4, 4);
      var dMat = new THREE.MeshLambertMaterial({ color: 0x444422 });
      var dMesh = new THREE.Mesh(dGeo, dMat);
      dMesh.position.set(pos.x, pos.y + 0.5, pos.z);
      _scene.add(dMesh);
      var da = Math.random() * Math.PI * 2;
      _debris.push({
        mesh: dMesh, mat: dMat,
        t: 0, life: 1.8 + Math.random() * 1.2,
        vx: (Math.random() - 0.5) * 12,
        vy: 5 + Math.random() * 8,
        vz: (Math.random() - 0.5) * 12,
      });
    }

    /* scorch mark crater */
    var craterGeo = new THREE.CircleGeometry(2.5, 24);
    var craterMat = new THREE.MeshBasicMaterial({ color: 0x1a1200, transparent: true, opacity: 0.85, depthTest: true });
    var craterMesh = new THREE.Mesh(craterGeo, craterMat);
    craterMesh.rotation.x = -Math.PI / 2;
    craterMesh.position.set(pos.x, pos.y + 0.02, pos.z);
    _scene.add(craterMesh);
    _craters.push({ mesh: craterMesh, mat: craterMat, t: 0, life: 30 });

    /* camera shake */
    _shakeTime = SHAKE_DURATION;

    /* damage enemies */
    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    var killCount = 0;
    for (var k = 0; k < enemies.length; k++) {
      var en = enemies[k];
      if (!en || en.dead || en.alive === false) continue;
      var ep = en.position || (en.mesh && en.mesh.position);
      if (!ep) continue;
      var dx = ep.x - pos.x;
      var dz = ep.z - pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      var dmg = 0;
      if (dist <= 12) dmg = 150;
      else if (dist <= 20) dmg = 60;
      if (dmg > 0) {
        var wasDead = en.dead || en.alive === false || (en.health !== undefined && en.health <= 0);
        if (en.takeDamage) {
          en.takeDamage(dmg);
        } else if (en.health !== undefined) {
          en.health -= dmg;
          if (en.health <= 0 && !en.dead) { en.dead = true; }
        }
        var isDead = en.dead || en.alive === false || (en.health !== undefined && en.health <= 0);
        if (!wasDead && isDead) killCount++;
      }
    }

    if (killCount > 0) {
      var pts = killCount * 400;
      if (window.player && window.player.score !== undefined) {
        window.player.score += pts;
      }
      _showToast('DIRECT HIT! +' + pts);
    }
  }

  /* ── Click handler ─────────────────────────────────────────────────────── */
  function _onClick(event) {
    if (!_targeting) return;
    _exitTargetMode();
    var groundPos = _groundPositionFromClick(event);
    if (!groundPos) return;

    _pending       = true;
    _pendingTarget = groundPos;
    _pendingTimer  = 4;
    _showCountdown(4);
  }

  /* ── Keyboard handler ──────────────────────────────────────────────────── */
  function _onKeyDown(event) {
    if (event.code === 'KeyO' && event.ctrlKey) {
      event.preventDefault();
      call();
    }
  }

  /* ── Public: call() — initiate targeting mode ──────────────────────────── */
  function call() {
    if (_charges <= 0) { _showToast('NO ORBITAL STRIKES REMAINING'); return; }
    if (_cooldownRemaining > 0) { _showToast('STRIKE ON COOLDOWN: ' + Math.ceil(_cooldownRemaining) + 's'); return; }
    if (_targeting || _pending) return;
    _enterTargetMode();
  }

  /* ── Public: init(scene, camera) ───────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene  || window._gameScene || null;
    _camera = camera || window._camera    || null;

    /* find the renderer canvas */
    var canvases = document.querySelectorAll('canvas');
    for (var c = 0; c < canvases.length; c++) {
      if (canvases[c].id !== 'minimap-canvas') { _canvas = canvases[c]; break; }
    }

    /* create HUD elements */
    _createBadge();
    _createCountdownEl();

    /* bind input */
    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('click',   _onClick,   false);
  }

  /* ── Public: update(delta) — call every frame ──────────────────────────── */
  function update(delta) {
    if (!delta || delta <= 0) return;

    /* cooldown tick */
    if (_cooldownRemaining > 0) {
      _cooldownRemaining -= delta;
      if (_cooldownRemaining < 0) _cooldownRemaining = 0;
      _updateBadge();
    }

    /* pending countdown */
    if (_pending) {
      _pendingTimer -= delta;
      var secLeft = Math.ceil(_pendingTimer);
      _showCountdown(secLeft);
      if (_pendingTimer <= 0) {
        _pending = false;
        _showCountdown(0);
        _doImpact(_pendingTarget);
        _pendingTarget = null;
        _charges--;
        _cooldownRemaining = COOLDOWN_TIME;
        _updateBadge();
      }
    }

    /* animate point-light flashes */
    for (var li = _lights.length - 1; li >= 0; li--) {
      var lObj = _lights[li];
      lObj.t += delta;
      var lk = lObj.t / lObj.life;
      if (lk >= 1) {
        if (_scene) _scene.remove(lObj.light);
        if (lObj.light.dispose) lObj.light.dispose();
        _lights.splice(li, 1);
        continue;
      }
      lObj.light.intensity = 20 * (1 - lk);
    }

    /* animate explosion spheres */
    for (var ei = _explosions.length - 1; ei >= 0; ei--) {
      var ex = _explosions[ei];
      ex.t += delta;
      var ek = ex.t / ex.life;
      if (ek >= 1) {
        if (_scene) _scene.remove(ex.mesh);
        if (ex.mesh.geometry) ex.mesh.geometry.dispose();
        if (ex.mat) ex.mat.dispose();
        _explosions.splice(ei, 1);
        continue;
      }
      ex.mesh.position.x += ex.vx * delta;
      ex.mesh.position.y += ex.vy * delta;
      ex.mesh.position.z += ex.vz * delta;
      ex.vy -= 9.8 * delta;
      var es = 1 + ek * ex.grow;
      ex.mesh.scale.set(es, es, es);
      ex.mat.opacity = 0.9 * (1 - ek);
    }

    /* animate debris */
    for (var di = _debris.length - 1; di >= 0; di--) {
      var db = _debris[di];
      db.t += delta;
      var dk = db.t / db.life;
      if (dk >= 1) {
        if (_scene) _scene.remove(db.mesh);
        if (db.mesh.geometry) db.mesh.geometry.dispose();
        if (db.mat) db.mat.dispose();
        _debris.splice(di, 1);
        continue;
      }
      db.mesh.position.x += db.vx * delta;
      db.mesh.position.y += db.vy * delta;
      db.mesh.position.z += db.vz * delta;
      db.vy -= 9.8 * delta;
      if (db.mesh.position.y < 0) { db.mesh.position.y = 0; db.vy *= -0.2; }
    }

    /* fade craters after 30s */
    for (var ci = _craters.length - 1; ci >= 0; ci--) {
      var cr = _craters[ci];
      cr.t += delta;
      /* linger fully for most of lifetime, fade in the last 3 seconds */
      var fadeStart = cr.life - 3;
      if (cr.t > fadeStart) {
        var fk = (cr.t - fadeStart) / 3;
        cr.mat.opacity = 0.85 * (1 - fk);
      }
      if (cr.t >= cr.life) {
        if (_scene) _scene.remove(cr.mesh);
        if (cr.mesh.geometry) cr.mesh.geometry.dispose();
        if (cr.mat) cr.mat.dispose();
        _craters.splice(ci, 1);
      }
    }

    /* camera shake */
    if (_shakeTime > 0 && _camera) {
      _shakeTime -= delta;
      if (_shakeTime < 0) _shakeTime = 0;
      if (_shakeTime > 0) {
        _camera.position.x += (Math.random() - 0.5) * 0.3;
        _camera.position.y += (Math.random() - 0.5) * 0.3;
      }
    }
  }

  /* ── Public: reset() — restore all state ──────────────────────────────── */
  function reset() {
    _exitTargetMode();
    _pending      = false;
    _pendingTimer = 0;
    _pendingTarget = null;
    _shakeTime    = 0;
    _showCountdown(0);

    /* clean up scene objects */
    for (var li = 0; li < _lights.length; li++) {
      var lObj = _lights[li];
      if (_scene) _scene.remove(lObj.light);
    }
    _lights = [];

    for (var ei = 0; ei < _explosions.length; ei++) {
      var ex = _explosions[ei];
      if (_scene) _scene.remove(ex.mesh);
      if (ex.mesh && ex.mesh.geometry) ex.mesh.geometry.dispose();
      if (ex.mat) ex.mat.dispose();
    }
    _explosions = [];

    for (var di = 0; di < _debris.length; di++) {
      var db = _debris[di];
      if (_scene) _scene.remove(db.mesh);
      if (db.mesh && db.mesh.geometry) db.mesh.geometry.dispose();
      if (db.mat) db.mat.dispose();
    }
    _debris = [];

    for (var ci = 0; ci < _craters.length; ci++) {
      var cr = _craters[ci];
      if (_scene) _scene.remove(cr.mesh);
      if (cr.mesh && cr.mesh.geometry) cr.mesh.geometry.dispose();
      if (cr.mat) cr.mat.dispose();
    }
    _craters = [];

    _charges           = 2;
    _cooldownRemaining = 0;
    _updateBadge();
  }

  return { init: init, update: update, call: call, reset: reset };
})();
