/* ───────────────────────────────────────────────────────────────────────
   TRIPWIRE IED — player-placeable tripwire IED system
   G key to place (max 4). Wire arms after 2s, triggers on enemy crossing.
   ─────────────────────────────────────────────────────────────────────── */
window.TripwireIED = (function () {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _ieds = [];                // active IED objects
  var _blinkTimer = 0;           // shared blink timer
  var _blinkState = false;       // current LED blink state (on/off)
  var _MAX_IEDS = 4;

  // ── HUD counter element ──────────────────────────────────────────────
  var _counterEl = null;

  function _ensureHUD() {
    if (_counterEl && document.body.contains(_counterEl)) return;
    _counterEl = document.getElementById('iedCounter');
    if (!_counterEl) {
      _counterEl = document.createElement('div');
      _counterEl.id = 'iedCounter';
      _counterEl.style.cssText = [
        'position:fixed',
        'top:14px',
        'right:14px',
        'background:rgba(0,0,0,0.65)',
        'color:#fff',
        'font-family:monospace',
        'font-size:13px',
        'padding:5px 10px',
        'border-radius:4px',
        'border:1px solid #444',
        'pointer-events:none',
        'z-index:9000',
        'user-select:none',
      ].join(';');
      if (document.body) document.body.appendChild(_counterEl);
    }
    _updateHUD();
  }

  function _updateHUD() {
    if (!_counterEl) return;
    var count = _ieds.length;
    var anyArmed = false;
    for (var i = 0; i < _ieds.length; i++) {
      if (_ieds[i].armed && !_ieds[i].triggered) { anyArmed = true; break; }
    }
    var text = '💣 IEDs: ' + count + '/' + _MAX_IEDS;
    if (anyArmed) {
      text += ' <span style="color:#ff3333;font-weight:bold">ARMED</span>';
    }
    _counterEl.innerHTML = text;
  }

  // ── Toast helper ─────────────────────────────────────────────────────
  function _toast(msg, color) {
    if (typeof HUD !== 'undefined') {
      if (HUD.notifyPickup) { HUD.notifyPickup(msg, color || '#ffcc00'); return; }
      if (HUD.showToast) { HUD.showToast(msg); return; }
    }
    // Fallback: create our own toast
    var el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.8)',
      'color:' + (color || '#ffcc00'),
      'font-family:monospace',
      'font-size:14px',
      'padding:8px 18px',
      'border-radius:6px',
      'pointer-events:none',
      'z-index:9999',
      'transition:opacity 0.4s',
    ].join(';');
    if (document.body) document.body.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; }, 2000);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2500);
  }

  // ── Audio helpers ─────────────────────────────────────────────────────
  function _playClickSFX() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
      setTimeout(function () { try { ctx.close(); } catch (_e) {} }, 300);
    } catch (_e) {}
  }

  function _playExplosionSFX() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var bufSize = ctx.sampleRate * 0.3;
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      }
      var src = ctx.createBufferSource();
      var gain = ctx.createGain();
      src.buffer = buf;
      gain.gain.setValueAtTime(0.7, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start(ctx.currentTime);
      src.stop(ctx.currentTime + 0.3);
      setTimeout(function () { try { ctx.close(); } catch (_e) {} }, 600);
    } catch (_e) {}
  }

  // ── Build IED mesh ────────────────────────────────────────────────────
  function _buildIEDMesh(px, pz, facingY) {
    var group = new THREE.Group();

    // Body: dark green box
    var bodyGeo = new THREE.BoxGeometry(0.25, 0.15, 0.35);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x1a2a1a });
    var bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, 0.075, 0);
    group.add(bodyMesh);

    // LED sphere (yellow = arming)
    var ledGeo = new THREE.SphereGeometry(0.04, 6, 6);
    var ledMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    var ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.set(0, 0.175, 0);
    group.add(ledMesh);

    // Wire direction: perpendicular to facing direction
    // facingY is camera.rotation.y — forward is -sin(y) on X, -cos(y) on Z
    // Perpendicular is 90deg rotated: cos(y) on X, -sin(y) on Z
    var perpX = Math.cos(facingY);
    var perpZ = -Math.sin(facingY);

    var wireLength = 2.5;
    var wireGeo = new THREE.CylinderGeometry(0.02, 0.02, wireLength, 6);
    var wireMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var wireMesh = new THREE.Mesh(wireGeo, wireMat);
    // Cylinder is along Y-axis by default; rotate to lie along Z, then orient to perpDir
    wireMesh.rotation.z = Math.PI / 2;  // lay horizontal along X
    wireMesh.rotation.y = -Math.atan2(perpZ, perpX); // rotate to perpendicular dir
    wireMesh.position.set(0, 0.08, 0);
    group.add(wireMesh);

    group.position.set(px, 0, pz);

    // Wire endpoints (world space)
    var half = wireLength / 2;
    var wireStart = { x: px + perpX * half, z: pz + perpZ * half };
    var wireEnd   = { x: px - perpX * half, z: pz - perpZ * half };

    return { group: group, ledMesh: ledMesh, wireMesh: wireMesh, wireStart: wireStart, wireEnd: wireEnd };
  }

  // ── Trigger explosion for one IED ─────────────────────────────────────
  function _explode(ied, enemies) {
    if (!_scene) return;

    var pos = ied.mesh.position;

    // --- Point light flash ---
    var flashLight = new THREE.PointLight(0xff4400, 15, 8);
    flashLight.position.copy(pos);
    flashLight.position.y = 1;
    _scene.add(flashLight);
    var _fadeStart = null;
    var _flashDuration = 0.2;
    // We'll handle fading in update via closure in a timeout
    setTimeout(function () {
      var fadeInterval = setInterval(function () {
        flashLight.intensity -= 15 / 10;
        if (flashLight.intensity <= 0) {
          clearInterval(fadeInterval);
          _scene.remove(flashLight);
        }
      }, 20);
    }, 200);

    // --- Fire + debris particles ---
    var particleCount = 15;
    var particles = [];
    for (var pi = 0; pi < particleCount; pi++) {
      var isOrange = Math.random() > 0.4;
      var pGeo = new THREE.SphereGeometry(0.08 + Math.random() * 0.12, 5, 5);
      var pMat = new THREE.MeshBasicMaterial({ color: isOrange ? 0xff6600 : 0xcc1100 });
      var pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.copy(pos);
      pMesh.position.y += 0.3;
      var angle = Math.random() * Math.PI * 2;
      var speed = 2 + Math.random() * 5;
      var vy = 2 + Math.random() * 4;
      particles.push({
        mesh: pMesh,
        vx: Math.cos(angle) * speed,
        vy: vy,
        vz: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.4,
        age: 0,
      });
      _scene.add(pMesh);
    }

    // Animate particles
    var _partInterval = setInterval(function () {
      var dt = 0.016;
      var allDone = true;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        if (p.age >= p.life) continue;
        allDone = false;
        p.age += dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.vy -= 9.8 * dt; // gravity
        p.mesh.material.opacity = 1 - (p.age / p.life);
        p.mesh.material.transparent = true;
        if (p.age >= p.life) {
          _scene.remove(p.mesh);
        }
      }
      if (allDone) clearInterval(_partInterval);
    }, 16);

    // --- Shockwave damage to enemies ---
    if (enemies && enemies.length) {
      for (var ei = 0; ei < enemies.length; ei++) {
        var en = enemies[ei];
        if (!en || !en.mesh || en.hp <= 0) continue;
        var dx = en.mesh.position.x - pos.x;
        var dz = en.mesh.position.z - pos.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        var dmg = 0;
        if (dist < 5) dmg = 80;
        else if (dist < 8) dmg = 30;
        if (dmg > 0) {
          if (typeof Enemies !== 'undefined' && Enemies.damage) {
            Enemies.damage(en, dmg);
          } else if (en.hp !== undefined) {
            en.hp = Math.max(0, en.hp - dmg);
          }
        }
      }
    }

    // --- Screen shake ---
    if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
      CameraSystem.shake(0.5, 0.4);
    }
    window._screenShake = { intensity: 0.5, duration: 0.4 };

    // --- SFX ---
    _playExplosionSFX();
    if (typeof AudioSystem !== 'undefined' && AudioSystem.playExplosion) {
      AudioSystem.playExplosion();
    }

    // --- Remove IED from scene ---
    _scene.remove(ied.mesh);
  }

  // ── Point-to-segment closest distance ────────────────────────────────
  function _distPointToSegment(px, pz, ax, az, bx, bz) {
    var abx = bx - ax;
    var abz = bz - az;
    var apx = px - ax;
    var apz = pz - az;
    var ab2 = abx * abx + abz * abz;
    if (ab2 === 0) {
      return Math.sqrt(apx * apx + apz * apz);
    }
    var t = (apx * abx + apz * abz) / ab2;
    t = Math.max(0, Math.min(1, t));
    var cx = ax + t * abx - px;
    var cz = az + t * abz - pz;
    return Math.sqrt(cx * cx + cz * cz);
  }

  // ── Public: init ──────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene = scene;
    _camera = camera;
    _ieds = [];
    _blinkTimer = 0;
    _blinkState = false;
    _ensureHUD();
    _updateHUD();
  }

  // ── Public: placeIED ─────────────────────────────────────────────────
  function placeIED(playerPos, facingY) {
    if (_ieds.length >= _MAX_IEDS) {
      _toast('MAX IEDs PLACED', '#ff4444');
      return;
    }

    var px = playerPos.x;
    var pz = playerPos.z;

    var built = _buildIEDMesh(px, pz, facingY);

    var ied = {
      mesh: built.group,
      wireStart: built.wireStart,
      wireEnd: built.wireEnd,
      armed: false,
      triggered: false,
      armTimer: 0,
      blinkMesh: built.ledMesh,
      wireMesh: built.wireMesh,
    };

    _ieds.push(ied);
    if (_scene) _scene.add(ied.mesh);

    _playClickSFX();
    _toast('💣 IED PLACED — arms in 2s', '#ffcc00');
    _ensureHUD();
    _updateHUD();
  }

  // ── Public: update ───────────────────────────────────────────────────
  function update(enemies, delta) {
    if (!_scene || !delta) return;

    // Blink timer (2Hz = toggle every 0.5s)
    _blinkTimer += delta;
    if (_blinkTimer >= 0.5) {
      _blinkTimer -= 0.5;
      _blinkState = !_blinkState;
    }

    var toRemove = [];

    for (var i = 0; i < _ieds.length; i++) {
      var ied = _ieds[i];
      if (ied.triggered) {
        toRemove.push(i);
        continue;
      }

      // Arming countdown
      if (!ied.armed) {
        ied.armTimer += delta;
        if (ied.armTimer >= 2.0) {
          ied.armed = true;
          // Switch LED to red
          if (ied.blinkMesh) {
            ied.blinkMesh.material.color.setHex(0xff0000);
          }
          _updateHUD();
        } else {
          // Yellow blink during arming phase
          if (ied.blinkMesh) {
            ied.blinkMesh.visible = _blinkState;
          }
        }
        continue; // don't check wire while arming
      }

      // Armed: blink LED at 2Hz
      if (ied.blinkMesh) {
        ied.blinkMesh.visible = _blinkState;
      }

      // Check tripwire against each enemy
      if (!enemies || !enemies.length) continue;
      for (var ei = 0; ei < enemies.length; ei++) {
        var en = enemies[ei];
        if (!en || !en.mesh || en.hp <= 0) continue;
        var enX = en.mesh.position.x;
        var enZ = en.mesh.position.z;
        var dist = _distPointToSegment(
          enX, enZ,
          ied.wireStart.x, ied.wireStart.z,
          ied.wireEnd.x, ied.wireEnd.z
        );
        if (dist < 0.4) {
          ied.triggered = true;
          _explode(ied, enemies);
          _updateHUD();
          break;
        }
      }
    }

    // Remove triggered IEDs (iterate backwards to keep indices valid)
    for (var ri = toRemove.length - 1; ri >= 0; ri--) {
      _ieds.splice(toRemove[ri], 1);
    }

    if (toRemove.length > 0) _updateHUD();
  }

  // ── Public: clear ────────────────────────────────────────────────────
  function clear() {
    for (var i = 0; i < _ieds.length; i++) {
      if (_scene && _ieds[i].mesh) _scene.remove(_ieds[i].mesh);
    }
    _ieds = [];
    _blinkTimer = 0;
    _blinkState = false;
    _updateHUD();
  }

  // ── Public: reset ────────────────────────────────────────────────────
  function reset() {
    clear();
  }

  // ── Public: getCount ─────────────────────────────────────────────────
  function getCount() {
    return _ieds.length;
  }

  return {
    init: init,
    update: update,
    placeIED: placeIED,
    clear: clear,
    reset: reset,
    getCount: getCount,
  };
})();
