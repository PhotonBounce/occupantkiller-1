// ============================================================
//  teleporter-pad.js — Linked Teleporter Pad Pairs
//  T key places pad A then pad B; stepping on either pad
//  instantly teleports the player (or nearby enemies) to the
//  other pad.  Max 2 active pairs; pairs expire after 90 s.
//  Public API: init, update, place, reset
// ============================================================
window.TeleporterPad = (function () {
  'use strict';

  /* ── Scene / camera refs ─────────────────────────────────── */
  var _scene  = null;
  var _camera = null;

  /* ── Pairs array: each entry = { padA, padB } where pad = {
       mesh, ring, beam, light, pos:{x,y,z},
       cooldownTimer, flashLight, expireTimer } ────────────── */
  var _pairs = [];       // max 2

  /* ── Pending (pad A placed, waiting for pad B) ────────────── */
  var _pending = null;   // pad object or null

  /* ── Animation clock ─────────────────────────────────────── */
  var _clock = 0;

  /* ── Key state ────────────────────────────────────────────── */
  var _tKeyDown = false;

  /* ── AudioContext ──────────────────────────────────────────── */
  var _audioCtx = null;

  /* ── HUD badge element ────────────────────────────────────── */
  var _hudBadge = null;

  /* ── Constants ────────────────────────────────────────────── */
  var ACTIVATION_RADIUS  = 1.0;   // units to trigger teleport
  var ENEMY_RADIUS       = 0.8;   // units for enemy teleport
  var COOLDOWN_DURATION  = 3.0;   // seconds
  var PAIR_EXPIRE_TIME   = 90.0;  // seconds
  var MAX_PAIRS          = 2;
  var FLASH_DURATION     = 0.3;   // seconds for PointLight flash
  var CAMERA_FX_DURATION = 0.1;   // seconds for brightness FX

  var COLOR_A = 0x8800FF;  // purple
  var COLOR_B = 0x00FFFF;  // cyan

  /* ── Build a single teleporter pad object ──────────────────── */
  function _buildPad(x, y, z, color) {
    var group = new THREE.Group();

    /* Flat disc */
    var padGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.08, 12);
    var padMat = new THREE.MeshStandardMaterial({
      color:             color,
      emissive:          color,
      emissiveIntensity: 0.7,
      metalness:         0.4,
      roughness:         0.3
    });
    var padMesh = new THREE.Mesh(padGeo, padMat);
    group.add(padMesh);

    /* Portal ring floating 0.5 units above pad */
    var ringGeo = new THREE.TorusGeometry(0.8, 0.06, 6, 12);
    var ringMat = new THREE.MeshStandardMaterial({
      color:             color,
      emissive:          color,
      emissiveIntensity: 1.0
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.5;
    group.add(ring);

    /* Vertical particle beam: 8-point line rising 2 units */
    var beamPoints = [];
    for (var i = 0; i < 8; i++) {
      beamPoints.push(new THREE.Vector3(0, i * (2.0 / 7), 0));
    }
    var beamGeo = new THREE.BufferGeometry().setFromPoints(beamPoints);
    var beamMat = new THREE.LineBasicMaterial({
      color:       color,
      transparent: true,
      opacity:     0.7
    });
    var beam = new THREE.Line(beamGeo, beamMat);
    group.add(beam);

    /* Under-pad point light */
    var ptLight = new THREE.PointLight(color, 1.2, 4);
    ptLight.position.y = 0.2;
    group.add(ptLight);

    /* Flash light (off by default) */
    var flashLight = new THREE.PointLight(0xFFFFFF, 0, 5);
    flashLight.position.y = 0.5;
    group.add(flashLight);

    group.position.set(x, y, z);
    _scene.add(group);

    return {
      group:          group,
      padMesh:        padMesh,
      padMat:         padMat,
      ring:           ring,
      beam:           beam,
      ptLight:        ptLight,
      flashLight:     flashLight,
      color:          color,
      pos:            { x: x, y: y, z: z },
      cooldownTimer:  0,
      flashTimer:     0,
      baseIntensity:  1.2
    };
  }

  /* ── Remove a pad's 3D objects from scene ──────────────────── */
  function _removePad(pad) {
    if (pad && pad.group) {
      _scene.remove(pad.group);
    }
  }

  /* ── Remove oldest pair when limit exceeded ────────────────── */
  function _enforceMaxPairs() {
    while (_pairs.length >= MAX_PAIRS) {
      var oldest = _pairs.shift();
      _removePad(oldest.padA);
      _removePad(oldest.padB);
      _showToast('Oldest teleporter pair removed.');
    }
  }

  /* ── Play energy hum on a pad (continuous oscillator) ─────── */
  function _playHum(color) {
    try {
      if (!_audioCtx) {
        _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      }
      var ctx = _audioCtx;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = (color === COLOR_A) ? 180 : 240;

      gain.gain.setValueAtTime(0.0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.3);
      /* Auto-fade after pair expire time */
      gain.gain.setValueAtTime(0.06, ctx.currentTime + PAIR_EXPIRE_TIME - 0.5);
      gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + PAIR_EXPIRE_TIME);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + PAIR_EXPIRE_TIME);
    } catch (e) {
      /* Audio unavailable — silent fail */
    }
  }

  /* ── Play whoosh sound on teleport ────────────────────────── */
  function _playWhoosh() {
    try {
      if (!_audioCtx) {
        _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      }
      var ctx = _audioCtx;
      var bufLen = Math.floor(ctx.sampleRate * 0.25);
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 1.5) * 0.4;
      }

      var src = ctx.createBufferSource();
      src.buffer = buf;

      var bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 800;
      bpf.Q.value = 0.5;

      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      src.connect(bpf);
      bpf.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {
      /* Audio unavailable — silent fail */
    }
  }

  /* ── Camera brightness flash (CSS filter) ──────────────────── */
  function _doCameraFlash() {
    var canvas = document.querySelector('canvas');
    if (!canvas) return;
    canvas.style.transition = 'filter 0s';
    canvas.style.filter = 'brightness(3)';
    setTimeout(function () {
      canvas.style.transition = 'filter ' + CAMERA_FX_DURATION + 's ease-out';
      canvas.style.filter = 'brightness(1)';
    }, CAMERA_FX_DURATION * 1000);
  }

  /* ── Show toast notification ───────────────────────────────── */
  function _showToast(msg) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
      return;
    }
    var el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = [
      'position:fixed',
      'top:38%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)',
      'color:#aa44ff',
      'font-family:monospace',
      'font-size:15px',
      'padding:8px 18px',
      'border-radius:6px',
      'border:1px solid #8800ff',
      'z-index:9999',
      'pointer-events:none',
      'text-shadow:0 0 8px #8800ff'
    ].join(';');
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2000);
  }

  /* ── Build and inject HUD badge ────────────────────────────── */
  function _buildHUD() {
    _hudBadge = document.createElement('div');
    _hudBadge.id = 'tele-pad-hud';
    _hudBadge.style.cssText = [
      'position:fixed',
      'bottom:88px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(80,0,160,0.7)',
      'border:1px solid #8800ff',
      'border-radius:6px',
      'padding:3px 12px',
      'font-family:monospace',
      'font-size:12px',
      'color:#cc88ff',
      'z-index:200',
      'pointer-events:none',
      'display:none',
      'text-shadow:0 0 6px #8800ff',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hudBadge);
  }

  /* ── Update HUD badge count ─────────────────────────────────── */
  function _updateHUD() {
    if (!_hudBadge) return;
    /* Show remaining placements: pending pad = 1 slot used, pair = 2 used */
    var slotsUsed = _pairs.length * 2 + (_pending ? 1 : 0);
    var remaining = MAX_PAIRS * 2 - slotsUsed;
    if (remaining < 0) remaining = 0;
    _hudBadge.textContent = '⬡ TELE ×' + remaining;
    _hudBadge.style.display = (remaining > 0 || _pending) ? 'block' : 'none';
  }

  /* ── Place a pad at the player's feet ──────────────────────── */
  function place() {
    if (!_scene || !_camera) return;
    if (window._tankMounted) return; /* no placement while in vehicle */

    var px = _camera.position.x;
    var pz = _camera.position.z;
    var py = _camera.position.y - 1.6; /* approximate ground level */

    if (!_pending) {
      /* ── Place Pad A (purple) ── */
      _enforceMaxPairs();

      var padA = _buildPad(px, py, pz, COLOR_A);
      _pending = padA;

      _playHum(COLOR_A);
      _showToast('Teleporter Pad A placed — place Pad B!');
    } else {
      /* ── Place Pad B (cyan) ── */
      var padB = _buildPad(px, py, pz, COLOR_B);

      _pairs.push({
        padA:        _pending,
        padB:        padB,
        expireTimer: PAIR_EXPIRE_TIME
      });

      _pending = null;

      _playHum(COLOR_B);
      _showToast('Teleporter Pair linked! Step on either pad to teleport.');
    }

    _updateHUD();
  }

  /* ── Trigger teleport effect on a pair ─────────────────────── */
  function _teleport(pair, fromPad, toPad) {
    /* Move player */
    _camera.position.x = toPad.pos.x;
    _camera.position.z = toPad.pos.z;
    /* Keep Y: player height above pad */
    _camera.position.y = toPad.pos.y + 1.6;

    /* Set cooldown on both pads */
    fromPad.cooldownTimer = COOLDOWN_DURATION;
    toPad.cooldownTimer   = COOLDOWN_DURATION;

    /* Flash lights at both pads */
    fromPad.flashTimer = FLASH_DURATION;
    toPad.flashTimer   = FLASH_DURATION;

    /* Audio + camera FX */
    _playWhoosh();
    _doCameraFlash();

    _showToast('TELEPORTED!');
  }

  /* ── Check enemies near a pad and teleport them ─────────────── */
  function _checkEnemyTeleport(fromPad, toPad) {
    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en || !en.position) continue;
      var dx = en.position.x - fromPad.pos.x;
      var dz = en.position.z - fromPad.pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < ENEMY_RADIUS) {
        en.position.x = toPad.pos.x;
        en.position.z = toPad.pos.z;
        en.position.y = toPad.pos.y + 0.9;
      }
    }
  }

  /* ── Update pad visual state (cooldown dim / ring spin) ─────── */
  function _updatePadVisuals(pad, delta) {
    _clock += 0; /* pad-level: just use module _clock */

    /* Ring rotation */
    pad.ring.rotation.x += delta * 1.8;
    pad.ring.rotation.z += delta * 1.1;

    /* Beam opacity pulse */
    var pulse = 0.4 + 0.3 * Math.sin(_clock * 3.0);
    pad.beam.material.opacity = pulse;

    if (pad.cooldownTimer > 0) {
      /* Dim during cooldown */
      var ratio = pad.cooldownTimer / COOLDOWN_DURATION;
      pad.padMat.emissiveIntensity = 0.1 + 0.6 * (1 - ratio);
      pad.ptLight.intensity = pad.baseIntensity * (1 - ratio * 0.8);
    } else {
      pad.padMat.emissiveIntensity = 0.7;
      pad.ptLight.intensity = pad.baseIntensity;
    }

    /* Flash light */
    if (pad.flashTimer > 0) {
      pad.flashLight.intensity = 20 * (pad.flashTimer / FLASH_DURATION);
    } else {
      pad.flashLight.intensity = 0;
    }
  }

  /* ── Public: init ──────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene  || window._gameScene;
    _camera = camera || window._camera;

    _buildHUD();
    _updateHUD();

    /* Key listener for T */
    document.addEventListener('keydown', function (e) {
      if ((e.key === 't' || e.key === 'T') && !_tKeyDown) {
        _tKeyDown = true;
        if (!window._tankMounted) {
          place();
        }
      }
    });
    document.addEventListener('keyup', function (e) {
      if (e.key === 't' || e.key === 'T') {
        _tKeyDown = false;
      }
    });
  }

  /* ── Public: update (called each frame with delta seconds) ──── */
  function update(delta) {
    if (!_scene || !_camera) return;

    _clock += delta;

    var playerPos = _camera.position;

    /* Update pending pad visuals */
    if (_pending) {
      _updatePadVisuals(_pending, delta);
    }

    /* Update pairs */
    for (var i = _pairs.length - 1; i >= 0; i--) {
      var pair = _pairs[i];

      /* Expire timer */
      pair.expireTimer -= delta;
      if (pair.expireTimer <= 0) {
        _removePad(pair.padA);
        _removePad(pair.padB);
        _pairs.splice(i, 1);
        _showToast('Teleporter pair expired.');
        _updateHUD();
        continue;
      }

      var padA = pair.padA;
      var padB = pair.padB;

      /* Tick cooldowns */
      if (padA.cooldownTimer > 0) padA.cooldownTimer -= delta;
      if (padB.cooldownTimer > 0) padB.cooldownTimer -= delta;

      /* Tick flash timers */
      if (padA.flashTimer > 0) padA.flashTimer -= delta;
      if (padB.flashTimer > 0) padB.flashTimer -= delta;

      /* Update visuals */
      _updatePadVisuals(padA, delta);
      _updatePadVisuals(padB, delta);

      /* Check enemy teleport */
      _checkEnemyTeleport(padA, padB);
      _checkEnemyTeleport(padB, padA);

      /* Player proximity — Pad A */
      if (padA.cooldownTimer <= 0) {
        var dxA = playerPos.x - padA.pos.x;
        var dzA = playerPos.z - padA.pos.z;
        var distA = Math.sqrt(dxA * dxA + dzA * dzA);
        if (distA < ACTIVATION_RADIUS) {
          _teleport(pair, padA, padB);
        }
      }

      /* Player proximity — Pad B */
      if (padB.cooldownTimer <= 0) {
        var dxB = playerPos.x - padB.pos.x;
        var dzB = playerPos.z - padB.pos.z;
        var distB = Math.sqrt(dxB * dxB + dzB * dzB);
        if (distB < ACTIVATION_RADIUS) {
          _teleport(pair, padB, padA);
        }
      }
    }
  }

  /* ── Public: reset ─────────────────────────────────────────── */
  function reset() {
    /* Remove all pair pads */
    for (var i = 0; i < _pairs.length; i++) {
      _removePad(_pairs[i].padA);
      _removePad(_pairs[i].padB);
    }
    _pairs = [];

    /* Remove pending pad */
    if (_pending) {
      _removePad(_pending);
      _pending = null;
    }

    _clock = 0;

    if (_hudBadge) {
      _hudBadge.style.display = 'none';
    }

    _updateHUD();
  }

  return {
    init:  init,
    update: update,
    place:  place,
    reset:  reset
  };
})();
