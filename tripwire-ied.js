/* ───────────────────────────────────────────────────────────────────────
   TRIPWIRE IED — deployable improvised explosive with tripwire trigger
   Ctrl+T to place (max 5). Wire arms after 2s, triggers on enemy crossing.
   Hold E near armed IED to disarm (3s) and recover a charge.
   ─────────────────────────────────────────────────────────────────────── */
window.TripwireIED = (function () {
  'use strict';

  var _scene    = null;
  var _camera   = null;
  var _ieds     = [];          // active IED objects
  var _blinkTimer  = 0;        // shared fast-blink timer
  var _blinkState  = false;    // LED state during arming blink
  var _slowTimer   = 0;        // armed slow-blink timer
  var _slowState   = false;    // LED state when armed
  var _MAX_IEDS    = 5;
  var _charges     = 5;        // remaining placements
  var _disarmHoldTime = 0;     // seconds player has held E near an IED
  var _disarmTarget   = null;  // IED currently being disarmed
  var _eKeyHeld       = false; // E key held state
  var _ctrlHeld       = false; // Ctrl key held state

  // ── HUD badge ────────────────────────────────────────────────────────
  var _hudEl = null;

  function _ensureHUD() {
    if (_hudEl && document.body.contains(_hudEl)) return;
    _hudEl = document.getElementById('ied-hud-badge');
    if (!_hudEl) {
      _hudEl = document.createElement('div');
      _hudEl.id = 'ied-hud-badge';
      _hudEl.style.cssText = [
        'position:fixed',
        'bottom:14px',
        'left:14px',
        'background:rgba(30,50,10,0.82)',
        'color:#a8c060',
        'font-family:monospace',
        'font-size:14px',
        'font-weight:bold',
        'padding:5px 12px',
        'border-radius:5px',
        'border:1px solid #4a7020',
        'pointer-events:none',
        'z-index:9010',
        'user-select:none',
        'letter-spacing:1px',
      ].join(';');
      if (document.body) document.body.appendChild(_hudEl);
    }
    _updateHUD();
  }

  function _updateHUD() {
    if (!_hudEl) return;
    _hudEl.textContent = '💣 IED ×' + _charges;
  }

  // ── Disarm progress bar ──────────────────────────────────────────────
  var _disarmBarEl = null;

  function _ensureDisarmBar() {
    if (_disarmBarEl && document.body.contains(_disarmBarEl)) return;
    _disarmBarEl = document.getElementById('ied-disarm-bar');
    if (!_disarmBarEl) {
      _disarmBarEl = document.createElement('div');
      _disarmBarEl.id = 'ied-disarm-bar';
      _disarmBarEl.style.cssText = [
        'position:fixed',
        'bottom:45px',
        'left:50%',
        'transform:translateX(-50%)',
        'width:160px',
        'height:8px',
        'background:rgba(0,0,0,0.5)',
        'border:1px solid #4a7020',
        'border-radius:4px',
        'overflow:hidden',
        'pointer-events:none',
        'z-index:9011',
        'display:none',
      ].join(';');
      var fill = document.createElement('div');
      fill.id = 'ied-disarm-bar-fill';
      fill.style.cssText = 'width:0%;height:100%;background:#a8c060;border-radius:4px;transition:width 0.05s linear;';
      _disarmBarEl.appendChild(fill);
      if (document.body) document.body.appendChild(_disarmBarEl);
    }
  }

  function _showDisarmBar(pct) {
    _ensureDisarmBar();
    if (_disarmBarEl) {
      _disarmBarEl.style.display = 'block';
      var fill = document.getElementById('ied-disarm-bar-fill');
      if (fill) fill.style.width = Math.min(100, pct * 100) + '%';
    }
  }

  function _hideDisarmBar() {
    if (_disarmBarEl) _disarmBarEl.style.display = 'none';
  }

  // ── Toast helper ─────────────────────────────────────────────────────
  function _toast(msg, color) {
    if (typeof HUD !== 'undefined') {
      if (HUD.notifyPickup) { HUD.notifyPickup(msg, color || '#a8c060'); return; }
      if (HUD.showToast)    { HUD.showToast(msg); return; }
    }
    var el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.82)',
      'color:' + (color || '#a8c060'),
      'font-family:monospace',
      'font-size:14px',
      'padding:7px 18px',
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
  function _getAudioCtx() {
    return window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  }

  function _playClickSFX() {
    try {
      var ctx = _getAudioCtx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(280, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch (_e) {}
  }

  function _playArmingBeeps() {
    try {
      var ctx = _getAudioCtx();
      for (var b = 0; b < 3; b++) {
        (function (delay) {
          setTimeout(function () {
            try {
              var osc2 = ctx.createOscillator();
              var g2 = ctx.createGain();
              osc2.type = 'square';
              osc2.frequency.setValueAtTime(880, ctx.currentTime);
              g2.gain.setValueAtTime(0.06, ctx.currentTime);
              g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
              osc2.connect(g2);
              g2.connect(ctx.destination);
              osc2.start(ctx.currentTime);
              osc2.stop(ctx.currentTime + 0.08);
            } catch (_e2) {}
          }, delay);
        }(b * 600));
      }
    } catch (_e) {}
  }

  function _playBoomSFX() {
    try {
      var ctx = _getAudioCtx();
      var bufSize = Math.floor(ctx.sampleRate * 1.2);
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        var env = Math.pow(1 - i / bufSize, 1.8);
        data[i] = (Math.random() * 2 - 1) * env;
      }
      var src = ctx.createBufferSource();
      var gain = ctx.createGain();
      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, ctx.currentTime);
      src.buffer = buf;
      gain.gain.setValueAtTime(1.0, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(ctx.currentTime);
      src.stop(ctx.currentTime + 1.2);
    } catch (_e) {}
  }

  function _playRumbleSFX() {
    try {
      var ctx = _getAudioCtx();
      var bufSize = Math.floor(ctx.sampleRate * 2.0);
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        var env = Math.pow(1 - i / bufSize, 0.6) * 0.3;
        data[i] = (Math.random() * 2 - 1) * env;
      }
      var src = ctx.createBufferSource();
      var gain = ctx.createGain();
      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, ctx.currentTime);
      src.buffer = buf;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(ctx.currentTime);
      src.stop(ctx.currentTime + 2.0);
    } catch (_e) {}
  }

  // ── Build IED mesh ────────────────────────────────────────────────────
  function _buildIEDMesh(px, pz) {
    var group = new THREE.Group();

    // Body: camouflage green box — BoxGeometry(0.2, 0.12, 0.15)
    var bodyGeo = new THREE.BoxGeometry(0.2, 0.12, 0.15);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x3a5a1a });
    var bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, 0.06, 0);
    group.add(bodyMesh);

    // Blinking red LED — tiny SphereGeometry(0.03)
    var ledGeo = new THREE.SphereGeometry(0.03, 6, 6);
    var ledMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    var ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.set(0.06, 0.13, 0);
    group.add(ledMesh);

    // Tripwire: green THREE.Line extending 4 units in a random horizontal direction
    var angle = Math.random() * Math.PI * 2;
    var dirX = Math.cos(angle);
    var dirZ = Math.sin(angle);
    var wireLength = 4.0;

    var wirePoints = [];
    wirePoints.push(new THREE.Vector3(0, 0.08, 0));
    wirePoints.push(new THREE.Vector3(dirX * wireLength, 0.08, dirZ * wireLength));
    var wireGeo = new THREE.BufferGeometry().setFromPoints(wirePoints);
    var wireMat = new THREE.LineBasicMaterial({ color: 0x22cc22 });
    var wireLine = new THREE.Line(wireGeo, wireMat);
    group.add(wireLine);

    group.position.set(px, 0, pz);

    // Wire endpoints in world space (start at IED, end 4 units away)
    var wireStart = { x: px, z: pz };
    var wireEnd   = { x: px + dirX * wireLength, z: pz + dirZ * wireLength };

    return {
      group:      group,
      ledMesh:    ledMesh,
      wireLine:   wireLine,
      wireStart:  wireStart,
      wireEnd:    wireEnd,
    };
  }

  // ── Point-to-segment closest distance (2D xz) ────────────────────────
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

  // ── Explosion ─────────────────────────────────────────────────────────
  function _explode(ied, enemies) {
    if (!_scene) return;

    var pos = ied.group.position;

    // PointLight flash — PointLight(0xFF6600, 15, 18)
    var flashLight = new THREE.PointLight(0xFF6600, 15, 18);
    flashLight.position.set(pos.x, pos.y + 1, pos.z);
    _scene.add(flashLight);
    var fadeInterval = setInterval(function () {
      flashLight.intensity -= 1.5;
      if (flashLight.intensity <= 0) {
        clearInterval(fadeInterval);
        if (_scene) _scene.remove(flashLight);
      }
    }, 20);

    // 6 debris BoxGeometry(0.15) chunks
    var debrisCount = 6;
    var debrisList = [];
    for (var di = 0; di < debrisCount; di++) {
      var dGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
      var dMat = new THREE.MeshLambertMaterial({ color: 0x555533 });
      var dMesh = new THREE.Mesh(dGeo, dMat);
      dMesh.position.set(pos.x, pos.y + 0.2, pos.z);
      var dAngle = (di / debrisCount) * Math.PI * 2 + (Math.random() - 0.5);
      var dSpeed = 3 + Math.random() * 5;
      debrisList.push({
        mesh: dMesh,
        vx: Math.cos(dAngle) * dSpeed,
        vy: 3 + Math.random() * 4,
        vz: Math.sin(dAngle) * dSpeed,
        life: 1.0 + Math.random() * 0.5,
        age: 0,
      });
      _scene.add(dMesh);
    }

    // Smoke puff — expanding SphereGeometry that fades
    var smokeGeo = new THREE.SphereGeometry(0.3, 8, 8);
    var smokeMat = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.7,
    });
    var smokeMesh = new THREE.Mesh(smokeGeo, smokeMat);
    smokeMesh.position.set(pos.x, pos.y + 0.5, pos.z);
    _scene.add(smokeMesh);
    var smokeAge = 0;
    var smokeDuration = 1.5;

    // Animate debris and smoke
    var animInterval = setInterval(function () {
      var dt = 0.016;
      smokeAge += dt;
      smokeMesh.scale.setScalar(1 + smokeAge * 3);
      smokeMat.opacity = Math.max(0, 0.7 * (1 - smokeAge / smokeDuration));
      if (smokeAge >= smokeDuration && _scene) {
        _scene.remove(smokeMesh);
      }

      var allDebrisDone = true;
      for (var di2 = 0; di2 < debrisList.length; di2++) {
        var d = debrisList[di2];
        if (d.age >= d.life) continue;
        allDebrisDone = false;
        d.age += dt;
        d.mesh.position.x += d.vx * dt;
        d.mesh.position.y += d.vy * dt;
        d.mesh.position.z += d.vz * dt;
        d.vy -= 9.8 * dt;
        if (d.age >= d.life && _scene) {
          _scene.remove(d.mesh);
        }
      }

      if (allDebrisDone && smokeAge >= smokeDuration) {
        clearInterval(animInterval);
      }
    }, 16);

    // Blast damage — 120 dmg within 5u, 60 dmg within 8u
    var enemies2 = enemies || (window.Enemies && window.Enemies.getAll ? window.Enemies.getAll() : []);
    if (enemies2 && enemies2.length) {
      for (var ei = 0; ei < enemies2.length; ei++) {
        var en = enemies2[ei];
        if (!en) continue;
        var enPos = en.mesh ? en.mesh.position : (en.position || null);
        if (!enPos) continue;
        var dx = enPos.x - pos.x;
        var dz = enPos.z - pos.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        var dmg = 0;
        if (dist < 5)      dmg = 120;
        else if (dist < 8) dmg = 60;
        if (dmg > 0) {
          var killed = false;
          if (en.takeDamage) {
            en.takeDamage(dmg);
          } else if (en.health !== undefined) {
            en.health = Math.max(0, en.health - dmg);
            if (en.health <= 0) killed = true;
          } else if (en.hp !== undefined) {
            en.hp = Math.max(0, en.hp - dmg);
            if (en.hp <= 0) killed = true;
          }
          if (killed) {
            if (window.player && window.player.score !== undefined) {
              window.player.score += 350;
            }
          }
        }
      }
    }

    // Camera shake if player within 15 units
    if (_camera) {
      var cpx = _camera.position.x - pos.x;
      var cpz = _camera.position.z - pos.z;
      var camDist = Math.sqrt(cpx * cpx + cpz * cpz);
      if (camDist < 15) {
        var shakeCount = 0;
        var shakeTotal = 8;
        var shakeInterval = setInterval(function () {
          _camera.position.x += (Math.random() - 0.5) * 0.4;
          _camera.position.y += (Math.random() - 0.5) * 0.2;
          _camera.position.z += (Math.random() - 0.5) * 0.4;
          shakeCount++;
          if (shakeCount >= shakeTotal) clearInterval(shakeInterval);
        }, 25);
      }
    }

    // Audio
    _playBoomSFX();
    setTimeout(_playRumbleSFX, 120);

    // Remove IED group from scene
    if (_scene) _scene.remove(ied.group);
  }

  // ── Key listeners ─────────────────────────────────────────────────────
  function _onKeyDown(e) {
    if (e.key === 'Control' || e.keyCode === 17) {
      _ctrlHeld = true;
    }
    if ((e.key === 't' || e.key === 'T') && _ctrlHeld) {
      e.preventDefault();
      place();
    }
    if (e.key === 'e' || e.key === 'E') {
      _eKeyHeld = true;
    }
  }

  function _onKeyUp(e) {
    if (e.key === 'Control' || e.keyCode === 17) {
      _ctrlHeld = false;
    }
    if (e.key === 'e' || e.key === 'E') {
      _eKeyHeld = false;
      _disarmHoldTime = 0;
      _disarmTarget = null;
      _hideDisarmBar();
    }
  }

  // ── Public: init ──────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene   = scene  || window._gameScene;
    _camera  = camera || window._camera;
    _ieds    = [];
    _charges = 5;
    _blinkTimer  = 0;
    _blinkState  = false;
    _slowTimer   = 0;
    _slowState   = false;
    _disarmHoldTime = 0;
    _disarmTarget   = null;
    _eKeyHeld       = false;
    _ctrlHeld       = false;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    _ensureHUD();
    _ensureDisarmBar();
    _updateHUD();
  }

  // ── Public: place ─────────────────────────────────────────────────────
  function place() {
    _scene  = _scene  || window._gameScene;
    _camera = _camera || window._camera;

    if (_charges <= 0) {
      _toast('No IED charges left!', '#ff6644');
      return;
    }
    if (_ieds.length >= _MAX_IEDS) {
      _toast('Max IEDs placed (' + _MAX_IEDS + ')!', '#ff6644');
      return;
    }
    if (!_scene || !_camera) return;

    var px = _camera.position.x;
    var pz = _camera.position.z;

    var built = _buildIEDMesh(px, pz);

    var ied = {
      group:      built.group,
      ledMesh:    built.ledMesh,
      wireLine:   built.wireLine,
      wireStart:  built.wireStart,
      wireEnd:    built.wireEnd,
      armed:      false,
      triggered:  false,
      disarmed:   false,
      armTimer:   0,
    };

    _ieds.push(ied);
    _scene.add(ied.group);
    _charges--;

    _playClickSFX();
    _toast('💣 IED placed — arming in 2s', '#a8c060');
    _ensureHUD();
    _updateHUD();

    // Schedule arming beeps
    _playArmingBeeps();
  }

  // ── Public: update ───────────────────────────────────────────────────
  function update(enemies, delta) {
    _scene  = _scene  || window._gameScene;
    _camera = _camera || window._camera;

    if (!_scene || !delta) return;

    // Fast blink timer (toggle every 0.5s) — used during arming
    _blinkTimer += delta;
    if (_blinkTimer >= 0.5) {
      _blinkTimer -= 0.5;
      _blinkState = !_blinkState;
    }

    // Slow blink timer (toggle every 1s) — used when armed
    _slowTimer += delta;
    if (_slowTimer >= 1.0) {
      _slowTimer -= 1.0;
      _slowState = !_slowState;
    }

    var enemyList = enemies || (window.Enemies && window.Enemies.getAll ? window.Enemies.getAll() : []);
    var toRemove = [];

    for (var i = 0; i < _ieds.length; i++) {
      var ied = _ieds[i];
      if (ied.triggered || ied.disarmed) {
        toRemove.push(i);
        continue;
      }

      // Arming countdown — 2 seconds
      if (!ied.armed) {
        ied.armTimer += delta;
        // Fast blink during arming
        if (ied.ledMesh) ied.ledMesh.visible = _blinkState;
        if (ied.armTimer >= 2.0) {
          ied.armed = true;
          if (ied.ledMesh) {
            ied.ledMesh.visible = true;
            ied.ledMesh.material.color.setHex(0xff0000);
          }
        }
        continue; // don't check wire while arming
      }

      // Armed: slow blink LED
      if (ied.ledMesh) ied.ledMesh.visible = _slowState;

      // Check disarm — player nearby holding E
      if (_eKeyHeld && _camera) {
        var playerPos = _camera.position;
        var ddx = ied.group.position.x - playerPos.x;
        var ddz = ied.group.position.z - playerPos.z;
        var playerDist = Math.sqrt(ddx * ddx + ddz * ddz);
        if (playerDist < 1.5) {
          // Player is close and holding E
          if (_disarmTarget === ied) {
            _disarmHoldTime += delta;
            _showDisarmBar(_disarmHoldTime / 3.0);
            if (_disarmHoldTime >= 3.0) {
              // Disarm complete — pick it back up
              ied.disarmed = true;
              _charges = Math.min(_MAX_IEDS, _charges + 1);
              _scene.remove(ied.group);
              _disarmHoldTime = 0;
              _disarmTarget   = null;
              _eKeyHeld       = false;
              _hideDisarmBar();
              _toast('💣 IED disarmed — charge refunded', '#a8c060');
              _updateHUD();
              toRemove.push(i);
              continue;
            }
          } else if (_disarmTarget === null) {
            _disarmTarget   = ied;
            _disarmHoldTime = 0;
          }
        }
      }

      // Check tripwire against each enemy
      if (!enemyList || !enemyList.length) continue;
      for (var ei = 0; ei < enemyList.length; ei++) {
        var en = enemyList[ei];
        if (!en) continue;
        var enPos2 = en.mesh ? en.mesh.position : (en.position || null);
        if (!enPos2) continue;
        // Skip dead enemies
        if (en.health !== undefined && en.health <= 0) continue;
        if (en.hp     !== undefined && en.hp     <= 0) continue;

        var dist2 = _distPointToSegment(
          enPos2.x, enPos2.z,
          ied.wireStart.x, ied.wireStart.z,
          ied.wireEnd.x,   ied.wireEnd.z
        );
        if (dist2 < 0.15) {
          ied.triggered = true;
          _explode(ied, enemyList);
          _updateHUD();
          toRemove.push(i);
          break;
        }
      }
    }

    // Remove triggered/disarmed IEDs (backwards to keep indices valid)
    for (var ri = toRemove.length - 1; ri >= 0; ri--) {
      _ieds.splice(toRemove[ri], 1);
    }

    // Reset disarm target if E not held
    if (!_eKeyHeld && _disarmTarget !== null) {
      _disarmTarget   = null;
      _disarmHoldTime = 0;
      _hideDisarmBar();
    }

    _ensureHUD();
  }

  // ── Public: reset ────────────────────────────────────────────────────
  function reset() {
    for (var i = 0; i < _ieds.length; i++) {
      if (_scene && _ieds[i].group) _scene.remove(_ieds[i].group);
    }
    _ieds    = [];
    _charges = 5;
    _blinkTimer  = 0;
    _blinkState  = false;
    _slowTimer   = 0;
    _slowState   = false;
    _disarmHoldTime = 0;
    _disarmTarget   = null;
    _eKeyHeld       = false;
    _ctrlHeld       = false;
    _hideDisarmBar();
    _updateHUD();
  }

  return {
    init:   init,
    update: update,
    place:  place,
    reset:  reset,
  };
})();
