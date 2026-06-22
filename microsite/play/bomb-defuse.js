// bomb-defuse.js — Bomb Defuse mini-game module
// Player must locate the bomb, stand within 1.5 units and hold E for 5s.
// Wire-cut minigame decides success or instant detonate.
// IIFE pattern, var throughout — no let/const.
window.BombDefuse = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var COUNTDOWN_SECONDS  = 90;
  var DEFUSE_RANGE       = 1.5;
  var DEFUSE_HOLD        = 5.0;   // seconds E must be held
  var EXPLOSION_RADIUS   = 8;
  var EXPLOSION_DAMAGE   = 150;
  var SCORE_REWARD       = 2500;

  // Beep intervals: normal → fast
  var BEEP_INTERVAL_NORMAL = 2.0;  // seconds between beeps above 10 s
  var BEEP_INTERVAL_FAST   = 0.25; // seconds between beeps below 10 s

  // Wire colours (CSS colour + THREE hex)
  var WIRES = [
    { label: 'RED',   hex: 0xff2200, css: '#ff2200' },
    { label: 'BLUE',  hex: 0x2255ff, css: '#2255ff' },
    { label: 'GREEN', hex: 0x22dd22, css: '#22dd22' },
  ];

  // Index of the safe wire (randomised on each spawn)
  var _safeWireIdx = 0;

  // ── State ──────────────────────────────────────────────────────────────────
  var _scene       = null;
  var _camera      = null;

  var _bombGroup   = null;    // THREE.Group for bomb mesh
  var _ledMat      = null;    // blinking LED material
  var _antennaMat  = null;

  // Publicly readable globals
  window._bombActive = false;
  window._bombTimer  = 0;

  // Hook for other modules
  window._onBombDefused = null;

  var _defuseHeld  = 0;       // seconds E has been held this frame-sequence
  var _eDown       = false;
  var _wirePhase   = false;   // true when wire minigame overlay is showing
  var _beepTimer   = 0;
  var _blinkTimer  = 0;
  var _ledOn       = false;

  var _phase       = 'idle';  // 'idle' | 'active' | 'wirephase' | 'done'

  // ── AudioContext helpers ───────────────────────────────────────────────────
  function _getAudioCtx() {
    if (window._audioCtx) return window._audioCtx;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        window._audioCtx = new Ctx();
        return window._audioCtx;
      }
    } catch (e) {}
    return null;
  }

  function _playBeep() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.09);
    } catch (e) {}
  }

  function _playExplosionSound() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var bufLen = ctx.sampleRate * 1.2;
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 3);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var gain = ctx.createGain();
      src.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 1.5;
      src.start();
    } catch (e) {}
  }

  function _playDefuseSuccessSound() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var notes = [523, 659, 784, 1047];
      for (var n = 0; n < notes.length; n++) {
        (function (freq, delay) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0, ctx.currentTime + delay);
          gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + delay + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.26);
        }(notes[n], n * 0.14));
      }
    } catch (e) {}
  }

  // ── HUD elements ──────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (document.getElementById('bd-timer-hud')) return;

    // Countdown timer (top-center, large red digits)
    var timerEl = document.createElement('div');
    timerEl.id = 'bd-timer-hud';
    timerEl.style.cssText = [
      'position:fixed',
      'top:18px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:38px',
      'font-weight:bold',
      'color:#ff2200',
      'text-shadow:0 0 10px #ff0000,0 0 3px #000',
      'z-index:3000',
      'pointer-events:none',
      'user-select:none',
      'display:none',
      'letter-spacing:4px',
    ].join(';');
    document.body.appendChild(timerEl);

    // Defuse progress bar
    var barWrap = document.createElement('div');
    barWrap.id = 'bd-progress-wrap';
    barWrap.style.cssText = [
      'position:fixed',
      'bottom:90px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:220px',
      'background:rgba(0,0,0,0.65)',
      'border:2px solid #ffdd00',
      'border-radius:6px',
      'padding:5px 8px',
      'z-index:3000',
      'pointer-events:none',
      'user-select:none',
      'display:none',
      'text-align:center',
    ].join(';');
    barWrap.innerHTML = [
      '<div style="color:#ffdd00;font-family:monospace;font-size:12px;margin-bottom:3px">HOLD [E] TO DEFUSE</div>',
      '<div style="background:#333;border-radius:4px;height:14px;overflow:hidden">',
      '<div id="bd-progress-fill" style="background:#00ff44;height:100%;width:0%;transition:width 0.1s linear;border-radius:4px"></div>',
      '</div>',
    ].join('');
    document.body.appendChild(barWrap);

    // Wire cut overlay
    var wireEl = document.createElement('div');
    wireEl.id = 'bd-wire-overlay';
    wireEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.92)',
      'border:3px solid #ff2200',
      'border-radius:10px',
      'padding:28px 40px',
      'z-index:4000',
      'pointer-events:none',
      'user-select:none',
      'display:none',
      'text-align:center',
      'min-width:320px',
    ].join(';');
    document.body.appendChild(wireEl);
  }

  function _showTimerHUD(visible) {
    var el = document.getElementById('bd-timer-hud');
    if (el) el.style.display = visible ? 'block' : 'none';
  }

  function _updateTimerHUD(secs) {
    var el = document.getElementById('bd-timer-hud');
    if (!el) return;
    var m = Math.floor(secs / 60);
    var s = Math.floor(secs % 60);
    var str = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    el.textContent = str;
    // Pulse red below 10 s
    el.style.color = secs < 10 ? (Math.floor(secs * 4) % 2 === 0 ? '#ff2200' : '#ff8800') : '#ff2200';
  }

  function _showProgressBar(visible) {
    var el = document.getElementById('bd-progress-wrap');
    if (el) el.style.display = visible ? 'block' : 'none';
  }

  function _updateProgressBar(pct) {
    var el = document.getElementById('bd-progress-fill');
    if (el) el.style.width = Math.min(100, Math.max(0, pct * 100)) + '%';
  }

  function _showWireOverlay() {
    var el = document.getElementById('bd-wire-overlay');
    if (!el) return;
    var html = '<div style="color:#ff2200;font-family:monospace;font-size:20px;font-weight:bold;margin-bottom:14px">WIRE CUT REQUIRED</div>';
    html += '<div style="color:#ffffff;font-family:monospace;font-size:13px;margin-bottom:18px">CUT THE CORRECT WIRE — ONE CHANCE!</div>';
    // Build THREE wire cylinders in-scene (decorative), show coloured labels here
    html += '<div style="display:flex;justify-content:center;gap:24px;margin-bottom:18px">';
    for (var i = 0; i < WIRES.length; i++) {
      html += '<div style="display:flex;flex-direction:column;align-items:center;gap:6px">';
      // Visual wire representation
      html += '<div style="width:12px;height:48px;background:' + WIRES[i].css + ';border-radius:6px;box-shadow:0 0 8px ' + WIRES[i].css + '"></div>';
      html += '<div style="color:' + WIRES[i].css + ';font-family:monospace;font-size:13px;font-weight:bold">' + WIRES[i].label + '</div>';
      html += '<div style="color:#aaa;font-family:monospace;font-size:12px">[' + (i + 1) + ']</div>';
      html += '</div>';
    }
    html += '</div>';
    html += '<div style="color:#888;font-family:monospace;font-size:11px">Press 1, 2 or 3 to cut a wire</div>';
    el.innerHTML = html;
    el.style.display = 'block';
  }

  function _hideWireOverlay() {
    var el = document.getElementById('bd-wire-overlay');
    if (el) el.style.display = 'none';
  }

  // ── Bomb mesh ──────────────────────────────────────────────────────────────
  function _buildBombMesh() {
    var group = new THREE.Group();

    // Main bomb body — red box
    var bodyGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0xcc1100 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Antenna — thin cylinder on top
    var antGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 6);
    _antennaMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var ant = new THREE.Mesh(antGeo, _antennaMat);
    ant.position.set(0.08, 0.375, 0);
    group.add(ant);

    // Antenna tip — tiny sphere
    var tipGeo = new THREE.SphereGeometry(0.025, 6, 6);
    var tipMat = new THREE.MeshLambertMaterial({ color: 0xdddddd });
    var tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.set(0.08, 0.57, 0);
    group.add(tip);

    // Blinking LED on front face
    var ledGeo = new THREE.SphereGeometry(0.04, 8, 8);
    _ledMat = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.0 });
    var led = new THREE.Mesh(ledGeo, _ledMat);
    led.position.set(0, 0, 0.22);
    group.add(led);

    // Three decorative wires (CylinderGeometry) on side
    for (var w = 0; w < 3; w++) {
      var wGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.28, 6);
      var wMat = new THREE.MeshLambertMaterial({ color: WIRES[w].hex });
      var wire = new THREE.Mesh(wGeo, wMat);
      wire.rotation.z = Math.PI / 2;
      wire.position.set(0, -0.08 + w * 0.08, 0.22);
      group.add(wire);
    }

    return group;
  }

  // ── Fire / explosion VFX ───────────────────────────────────────────────────
  function _spawnFireParticles(pos) {
    if (!_scene) return;
    for (var i = 0; i < 30; i++) {
      (function () {
        var geo = new THREE.SphereGeometry(0.18 + Math.random() * 0.28, 5, 5);
        var mat = new THREE.MeshLambertMaterial({
          color: Math.random() > 0.5 ? 0xff6600 : 0xff2200,
          transparent: true,
          opacity: 0.85,
        });
        var mesh = new THREE.Mesh(geo, mat);
        var angle = Math.random() * Math.PI * 2;
        var dist  = Math.random() * EXPLOSION_RADIUS * 0.6;
        mesh.position.set(
          pos.x + Math.cos(angle) * dist,
          pos.y + Math.random() * 2,
          pos.z + Math.sin(angle) * dist
        );
        _scene.add(mesh);
        var life = 1.2 + Math.random() * 0.8;
        var elapsed = 0;
        var vy = 1.5 + Math.random() * 2;
        function tick(dt) {
          elapsed += dt;
          mesh.position.y += vy * dt;
          vy *= (1 - dt * 1.5);
          mat.opacity = Math.max(0, 0.85 * (1 - elapsed / life));
          if (elapsed >= life) {
            _scene.remove(mesh);
            geo.dispose();
            mat.dispose();
            return;
          }
          requestAnimationFrame(function () { tick(0.016); });
        }
        requestAnimationFrame(function () { tick(0.016); });
      }());
    }
  }

  // ── Detonate logic ─────────────────────────────────────────────────────────
  function _detonate() {
    if (_phase === 'done') return;
    _phase = 'done';
    window._bombActive = false;
    window._bombTimer  = 0;

    _showTimerHUD(false);
    _showProgressBar(false);
    _hideWireOverlay();

    var pos = _bombGroup ? _bombGroup.position.clone() : new THREE.Vector3();

    // Remove bomb mesh
    if (_bombGroup && _scene) {
      _scene.remove(_bombGroup);
      _bombGroup = null;
    }

    // Sound
    _playExplosionSound();

    // Camera shake
    window._cameraShake = { intensity: 2.0, duration: 1.8 };

    // Fire particles
    _spawnFireParticles(pos);

    // Damage player if in range
    if (window._takeDamageFromWaveEvent) {
      var pp = null;
      if (window.player && window.player.position) {
        pp = window.player.position;
      } else if (_camera) {
        pp = _camera.position;
      }
      if (pp) {
        var dx = pp.x - pos.x;
        var dz = pp.z - pos.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < EXPLOSION_RADIUS) {
          var falloff = 1 - dist / EXPLOSION_RADIUS;
          var dmg = Math.round(EXPLOSION_DAMAGE * falloff);
          if (dmg > 0) window._takeDamageFromWaveEvent(dmg);
        }
      }
    }

    // HUD toast
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('BOMB EXPLODED!', 4000, '#ff2200');
    }
  }

  // ── Defuse success ─────────────────────────────────────────────────────────
  function _defuseSuccess() {
    if (_phase === 'done') return;
    _phase = 'done';
    window._bombActive = false;
    window._bombTimer  = 0;

    _showTimerHUD(false);
    _showProgressBar(false);
    _hideWireOverlay();

    // Remove bomb mesh
    if (_bombGroup && _scene) {
      _scene.remove(_bombGroup);
      _bombGroup = null;
    }

    _playDefuseSuccessSound();

    // Award score
    if (window.player && typeof window.player.score === 'number') {
      window.player.score += SCORE_REWARD;
      if (window.HUD && window.HUD.setScore) {
        window.HUD.setScore(window.player.score);
      }
    }

    // Green toast
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('BOMB DEFUSED  +' + SCORE_REWARD, 5000, '#00ff44');
    }

    // External hook
    if (typeof window._onBombDefused === 'function') {
      try { window._onBombDefused(); } catch (e) {}
    }
  }

  // ── Keyboard handling ──────────────────────────────────────────────────────
  function _onKeyDown(e) {
    if (e.key === 'e' || e.key === 'E') {
      _eDown = true;
    }

    // Wire selection during wire phase
    if (_phase === 'wirephase') {
      var idx = -1;
      if (e.key === '1') idx = 0;
      else if (e.key === '2') idx = 1;
      else if (e.key === '3') idx = 2;

      if (idx >= 0) {
        _hideWireOverlay();
        if (idx === _safeWireIdx) {
          _defuseSuccess();
        } else {
          // Wrong wire — instant detonate
          _detonate();
        }
      }
    }
  }

  function _onKeyUp(e) {
    if (e.key === 'e' || e.key === 'E') {
      _eDown = false;
      _defuseHeld = 0;
      _updateProgressBar(0);
      _showProgressBar(false);
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * init(scene, camera)
   * Call once after THREE scene exists (mirrors pattern of other modules).
   */
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    _ensureHUD();

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);
  }

  /**
   * spawnBomb(x, y, z)
   * Places a blinking bomb at world coordinates (x, y, z).
   * Starts the 90-second countdown.
   */
  function spawnBomb(x, y, z) {
    // If a bomb is already active, remove it first
    if (_bombGroup && _scene) {
      _scene.remove(_bombGroup);
      _bombGroup = null;
    }

    _safeWireIdx = Math.floor(Math.random() * WIRES.length);

    _bombGroup = _buildBombMesh();
    _bombGroup.position.set(x, y, z);

    if (_scene) _scene.add(_bombGroup);

    window._bombActive = true;
    window._bombTimer  = COUNTDOWN_SECONDS;
    _phase      = 'active';
    _defuseHeld = 0;
    _beepTimer  = 0;
    _blinkTimer = 0;
    _wirePhase  = false;
    _eDown      = false;

    _showTimerHUD(true);
    _updateTimerHUD(COUNTDOWN_SECONDS);
    _showProgressBar(false);
    _hideWireOverlay();
  }

  /**
   * update(delta)
   * Call every frame with the frame delta in seconds.
   */
  function update(delta) {
    if (_phase !== 'active') return;
    if (!window._bombActive) return;

    // ── Countdown ────────────────────────────────────────────────────────────
    window._bombTimer -= delta;
    _updateTimerHUD(Math.max(0, window._bombTimer));

    if (window._bombTimer <= 0) {
      _detonate();
      return;
    }

    // ── LED blink ────────────────────────────────────────────────────────────
    _blinkTimer += delta;
    var blinkRate = window._bombTimer < 10 ? 0.12 : 0.5;
    if (_blinkTimer >= blinkRate) {
      _blinkTimer = 0;
      _ledOn = !_ledOn;
      if (_ledMat) {
        _ledMat.emissiveIntensity = _ledOn ? 1.0 : 0.0;
        _ledMat.color.setHex(_ledOn ? 0xff0000 : 0x440000);
      }
    }

    // ── Beeping ───────────────────────────────────────────────────────────────
    _beepTimer -= delta;
    var beepInterval = window._bombTimer < 10 ? BEEP_INTERVAL_FAST : BEEP_INTERVAL_NORMAL;
    if (_beepTimer <= 0) {
      _playBeep();
      _beepTimer = beepInterval;
    }

    // ── Slow rotation of bomb ─────────────────────────────────────────────────
    if (_bombGroup) {
      _bombGroup.rotation.y += delta * 0.6;
    }

    // ── Player proximity + E-hold defuse ─────────────────────────────────────
    var playerPos = null;
    if (window.player && window.player.position) {
      playerPos = window.player.position;
    } else if (_camera) {
      playerPos = _camera.position;
    }

    if (playerPos && _bombGroup) {
      var dx = playerPos.x - _bombGroup.position.x;
      var dz = playerPos.z - _bombGroup.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= DEFUSE_RANGE && _eDown) {
        _showProgressBar(true);
        _defuseHeld += delta;
        _updateProgressBar(_defuseHeld / DEFUSE_HOLD);

        if (_defuseHeld >= DEFUSE_HOLD) {
          // Transition to wire phase
          _phase = 'wirephase';
          _defuseHeld = 0;
          _eDown = false;
          _showProgressBar(false);
          _showWireOverlay();
        }
      } else {
        // Reset hold if player steps away or releases E
        if (_defuseHeld > 0) {
          _defuseHeld = 0;
          _updateProgressBar(0);
        }
        if (!_eDown) _showProgressBar(false);
      }
    }
  }

  /**
   * reset()
   * Remove any active bomb and reset all state.
   */
  function reset() {
    _phase = 'idle';
    window._bombActive = false;
    window._bombTimer  = 0;
    _defuseHeld = 0;
    _eDown      = false;
    _beepTimer  = 0;

    if (_bombGroup && _scene) {
      _scene.remove(_bombGroup);
      _bombGroup = null;
    }

    _showTimerHUD(false);
    _showProgressBar(false);
    _hideWireOverlay();
    _updateProgressBar(0);
  }

  // ── Module export ──────────────────────────────────────────────────────────
  return { init: init, update: update, spawnBomb: spawnBomb, reset: reset };

}());
