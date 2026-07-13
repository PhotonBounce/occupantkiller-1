// c4-explosive.js — Remote C4 Explosive Charges
// Place charges (F4) and detonate remotely (F8)
// No let/const — only var throughout, IIFE pattern
window.C4Explosive = (function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;
  var _onHit = null;          // callback(pos, isPlayer) for player damage

  var _charges = [];          // placed C4 charges in the world
  var _inventory = 3;         // how many charges player can still place
  var _MAX_CHARGES = 3;       // max placed charges at once
  var _TOTAL_CHARGES = 3;     // starting inventory

  var _placeMode = false;     // F4 toggles place mode
  var _ghostGroup = null;     // ghost mesh shown in place mode
  var _ghostLedMat = null;

  var _detonateHeld = 0;      // seconds F8 has been held (for select-mode)
  var _selectMode = false;    // hold 0.5s → select individual charge
  var _selectIdx = 0;

  var _time = 0;

  // PLACE key: F4 (free — F4 in build mode is droneHangar but only inside build HUD, safe to use globally)
  var PLACE_KEY = 'F4';
  // DETONATE key: F8 (verified free)
  var DETONATE_KEY = 'F8';

  // ── HUD element ───────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (document.getElementById('c4-hud')) return;
    var el = document.createElement('div');
    el.id = 'c4-hud';
    el.style.cssText = [
      'position:fixed',
      'bottom:110px',
      'right:14px',
      'font-family:monospace',
      'font-size:12px',
      'color:#c8e040',
      'background:rgba(0,0,0,0.55)',
      'padding:4px 10px',
      'border-radius:4px',
      'z-index:1001',
      'pointer-events:none',
      'user-select:none',
      'border:1px solid rgba(100,120,40,0.5)',
    ].join(';');
    document.body.appendChild(el);
    _updateHUD();
  }

  function _updateHUD() {
    var el = document.getElementById('c4-hud');
    if (!el) return;
    var dots = '';
    for (var i = 0; i < _TOTAL_CHARGES; i++) {
      dots += (i < _inventory) ? '●' : '○';
    }
    var armed = _charges.length > 0;
    if (armed) {
      el.innerHTML = '[C4] ' + dots + ' ARMED &mdash; [' + DETONATE_KEY + '] DETONATE';
      el.style.color = '#ff8833';
    } else {
      el.innerHTML = '[C4] ' + dots + ' ' + _inventory + ' CHARGE' + (_inventory !== 1 ? 'S' : '');
      el.style.color = '#c8e040';
    }
    if (_placeMode) {
      el.innerHTML += ' <span style="color:#ffff44;animation:blink 0.5s infinite">► PLACE MODE [' + PLACE_KEY + ']</span>';
    }
  }

  // ── Ghost mesh (shown when in place mode) ─────────────────────────────────
  function _buildC4Mesh(ghost) {
    var group = new THREE.Group();

    // Main body — flat olive-green block
    var bodyGeo = new THREE.BoxGeometry(0.3, 0.1, 0.2);
    var bodyMat = new THREE.MeshLambertMaterial({
      color: 0x4a5c2a,
      transparent: ghost ? true : false,
      opacity: ghost ? 0.55 : 1.0,
    });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Blasting cap — thin cylinder sticking up from top center
    var capGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.12, 6);
    var capMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(0, 0.11, 0);
    group.add(cap);

    // LED indicator — small red sphere on the side face
    var ledGeo = new THREE.SphereGeometry(0.02, 6, 6);
    var ledMat = new THREE.MeshLambertMaterial({
      color: 0xff2200,
      emissive: 0xff2200,
      emissiveIntensity: 1.0,
      transparent: ghost ? true : false,
      opacity: ghost ? 0.75 : 1.0,
    });
    var ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.set(0.1, 0.02, 0);
    group.add(ledMesh);

    // Label stripe — thin white box across middle
    var stripeGeo = new THREE.BoxGeometry(0.28, 0.015, 0.04);
    var stripeMat = new THREE.MeshLambertMaterial({
      color: 0xddddcc,
      transparent: ghost ? true : false,
      opacity: ghost ? 0.5 : 0.9,
    });
    var stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, 0.04, 0.09);
    group.add(stripe);

    return { group: group, ledMesh: ledMesh, ledMat: ledMat };
  }

  function _showGhost() {
    if (_ghostGroup && _scene) _scene.remove(_ghostGroup);
    var built = _buildC4Mesh(true);
    _ghostGroup = built.group;
    _ghostLedMat = built.ledMat;
    if (_scene) _scene.add(_ghostGroup);
  }

  function _hideGhost() {
    if (_ghostGroup && _scene) {
      _scene.remove(_ghostGroup);
    }
    _ghostGroup = null;
    _ghostLedMat = null;
  }

  function _updateGhostPosition() {
    if (!_ghostGroup || !_camera) return;
    // Place ghost 2.5 units in front of camera, on ground plane
    var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
    fwd.y = 0;
    if (fwd.length() < 0.001) fwd.set(0, 0, -1);
    fwd.normalize();

    var pos = _camera.position.clone();
    pos.addScaledVector(fwd, 2.5);
    // Snap to ground
    var groundY = 0;
    if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
      groundY = VoxelWorld.getTerrainHeight(pos.x, pos.z);
    } else if (typeof player !== 'undefined' && player.position) {
      groundY = player.position.y - 1.5;
    }
    pos.y = groundY + 0.05; // sit on ground

    _ghostGroup.position.copy(pos);
    // Orient to face direction camera is looking (yaw only)
    var angle = Math.atan2(fwd.x, fwd.z);
    _ghostGroup.rotation.y = angle;
  }

  // ── Placement ─────────────────────────────────────────────────────────────
  function place() {
    if (!_scene || !_camera) return false;
    if (_inventory <= 0) {
      _showToast('No C4 charges remaining!');
      return false;
    }
    if (_charges.length >= _MAX_CHARGES) {
      _showToast('Max C4 placed (3). Detonate first!');
      return false;
    }

    // Determine placement position (same as ghost)
    var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
    fwd.y = 0;
    if (fwd.length() < 0.001) fwd.set(0, 0, -1);
    fwd.normalize();

    var pos = _camera.position.clone();
    pos.addScaledVector(fwd, 2.5);
    var groundY = 0;
    if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
      groundY = VoxelWorld.getTerrainHeight(pos.x, pos.z);
    } else if (typeof player !== 'undefined' && player.position) {
      groundY = player.position.y - 1.5;
    }
    pos.y = groundY + 0.05;

    // Sticky surface detection — check if near a wall above
    var vertical = false;
    if (typeof VoxelWorld !== 'undefined' && VoxelWorld.isSolid) {
      if (VoxelWorld.isSolid(Math.round(pos.x), Math.round(groundY + 1), Math.round(pos.z))) {
        vertical = true;
      }
    }

    var built = _buildC4Mesh(false);
    built.group.position.copy(pos);
    var angle = Math.atan2(fwd.x, fwd.z);
    built.group.rotation.y = angle;
    if (vertical) {
      // Stick to wall: tilt 90 degrees around X axis
      built.group.rotation.x = -Math.PI / 2;
    }
    if (_scene) _scene.add(built.group);

    _inventory--;

    var charge = {
      group: built.group,
      ledMesh: built.ledMesh,
      ledMat: built.ledMat,
      pos: pos.clone(),
      dir: fwd.clone(),
      ledTimer: 0,
      ledOn: true,
      exploded: false,
      rapidBlink: false,
      rapidTimer: 0,
    };
    _charges.push(charge);

    // Brief beep sound on placement
    _playBeep(880, 0.08);

    _exitPlaceMode();
    _updateHUD();
    _showToast('C4 placed! [' + DETONATE_KEY + '] to detonate');
    return true;
  }

  // ── Detonation ────────────────────────────────────────────────────────────
  function detonate(idx) {
    // idx = -1 means detonate all
    if (_charges.length === 0) {
      _showToast('No C4 charges placed!');
      return;
    }

    var toDetonate = [];
    if (idx === -1 || idx === undefined) {
      // Detonate all
      for (var i = 0; i < _charges.length; i++) {
        toDetonate.push(i);
      }
    } else {
      toDetonate.push(idx);
    }

    // Rapid blink for 0.5s then boom
    var allCharges = _charges;
    for (var ri = 0; ri < toDetonate.length; ri++) {
      var ch = allCharges[toDetonate[ri]];
      if (ch) ch.rapidBlink = true;
    }

    var self_toDetonate = toDetonate;
    setTimeout(function () {
      for (var di = self_toDetonate.length - 1; di >= 0; di--) {
        var cidx = self_toDetonate[di];
        if (_charges[cidx] && !_charges[cidx].exploded) {
          _explodeCharge(_charges[cidx]);
        }
      }
      // Remove exploded charges
      _charges = _charges.filter(function (c) { return !c.exploded; });
      _updateHUD();
    }, 500);
  }

  function _explodeCharge(charge) {
    if (charge.exploded) return;
    charge.exploded = true;

    var pos = charge.pos;
    var RADIUS = 6;

    // Remove mesh
    if (_scene && charge.group) {
      _scene.remove(charge.group);
    }

    // ── Fireball VFX ──────────────────────────────────────────────────────
    var fireGeo = new THREE.SphereGeometry(0.5, 8, 8);
    var fireMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 });
    var fireball = new THREE.Mesh(fireGeo, fireMat);
    fireball.position.copy(pos);
    fireball.position.y += 0.5;
    if (_scene) _scene.add(fireball);

    // Flash point light
    var flashLight = new THREE.PointLight(0xff8800, 12, 14);
    flashLight.position.copy(pos);
    flashLight.position.y += 1;
    if (_scene) _scene.add(flashLight);

    // ── Smoke cloud VFX ──────────────────────────────────────────────────
    var smokeGeo = new THREE.SphereGeometry(0.6, 7, 7);
    var smokeMat = new THREE.MeshBasicMaterial({ color: 0x666666, transparent: true, opacity: 0.6 });
    var smoke = new THREE.Mesh(smokeGeo, smokeMat);
    smoke.position.copy(pos);
    smoke.position.y += 0.8;
    if (_scene) _scene.add(smoke);

    // ── Debris: 8 small boxes ──────────────────────────────────────────
    var debrisGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    var debrisMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var debrisList = [];
    for (var di = 0; di < 8; di++) {
      var d = new THREE.Mesh(debrisGeo, debrisMat);
      d.position.copy(pos);
      d.position.y += 0.3;
      var angle = (di / 8) * Math.PI * 2;
      var speed = 3 + Math.random() * 5;
      var dv = {
        x: Math.sin(angle) * speed,
        y: 4 + Math.random() * 3,
        z: Math.cos(angle) * speed,
      };
      if (_scene) _scene.add(d);
      debrisList.push({ mesh: d, vel: dv, life: 1.2 + Math.random() * 0.6 });
    }

    // ── Camera shake ──────────────────────────────────────────────────────
    window._cameraShake = { intensity: 1.0, duration: 1.5 };

    // ── SFX ───────────────────────────────────────────────────────────────
    if (typeof AudioSystem !== 'undefined' && AudioSystem.playMortarImpact) {
      AudioSystem.playMortarImpact();
    } else if (typeof AudioSystem !== 'undefined' && AudioSystem.playExplosion) {
      AudioSystem.playExplosion();
    }
    _playBoom();

    // ── "KA-BOOM" HUD text ───────────────────────────────────────────────
    _showKaBoom();

    // ── Damage enemies ────────────────────────────────────────────────────
    if (typeof Enemies !== 'undefined' && Enemies.getAll) {
      var enemies = Enemies.getAll();
      for (var ei = 0; ei < enemies.length; ei++) {
        var en = enemies[ei];
        if (!en || !en.mesh || en.hp <= 0) continue;
        var ep = en.mesh.position;
        var edx = ep.x - pos.x;
        var edy = ep.y - pos.y;
        var edz = ep.z - pos.z;
        var eDist = Math.sqrt(edx * edx + edy * edy + edz * edz);
        if (eDist <= RADIUS) {
          if (typeof Enemies !== 'undefined' && Enemies.damage) {
            Enemies.damage(en, 120);
          }
        }
      }
    }

    // ── Damage player if in range ─────────────────────────────────────────
    if (typeof player !== 'undefined' && player.position) {
      var pdx = player.position.x - pos.x;
      var pdy = player.position.y - pos.y;
      var pdz = player.position.z - pos.z;
      var pDist = Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz);
      if (pDist <= RADIUS && _onHit) {
        var falloff = Math.max(0, 1 - pDist / RADIUS);
        _onHit(pos, true, Math.round(120 * falloff));
      }
    }

    // ── Animate VFX ───────────────────────────────────────────────────────
    var startTime = null;
    function animateExplosion(ts) {
      if (!startTime) startTime = ts;
      var t = (ts - startTime) / 1000;

      // Fireball: scale 0.5→5 over 0.4s, then fade
      if (t < 0.4) {
        var s = 0.5 + (t / 0.4) * 4.5;
        fireball.scale.set(s, s, s);
        fireMat.opacity = 0.9 * (1 - t / 0.4 * 0.5);
      } else if (t < 0.8) {
        var fadeT = (t - 0.4) / 0.4;
        fireMat.opacity = 0.45 * (1 - fadeT);
        flashLight.intensity = 12 * (1 - fadeT);
        if (fireMat.opacity <= 0) {
          if (_scene) { _scene.remove(fireball); _scene.remove(flashLight); }
        }
      }

      // Smoke: rises and expands over 1.5s
      if (t < 1.5) {
        var ss = 0.6 + t * 2.0;
        smoke.scale.set(ss, ss * 0.6, ss);
        smoke.position.y = pos.y + 0.8 + t * 2.5;
        smokeMat.opacity = 0.6 * (1 - t / 1.5);
      } else {
        if (_scene) _scene.remove(smoke);
      }

      // Debris physics
      var anyDebris = false;
      for (var dbi = 0; dbi < debrisList.length; dbi++) {
        var dp = debrisList[dbi];
        if (!dp || dp.life <= 0) continue;
        dp.life -= 0.016;
        dp.vel.y -= 9.8 * 0.016;
        dp.mesh.position.x += dp.vel.x * 0.016;
        dp.mesh.position.y += dp.vel.y * 0.016;
        dp.mesh.position.z += dp.vel.z * 0.016;
        dp.mesh.rotation.x += dp.vel.x * 0.05;
        dp.mesh.rotation.z += dp.vel.z * 0.05;
        if (dp.mesh.position.y < 0) { dp.mesh.position.y = 0; dp.vel.y = 0; }
        if (dp.life <= 0) {
          if (_scene) _scene.remove(dp.mesh);
          debrisList[dbi] = null;
        } else { anyDebris = true; }
      }

      if (t < 1.5 || anyDebris) {
        requestAnimationFrame(animateExplosion);
      }
    }
    requestAnimationFrame(animateExplosion);
  }

  // ── KA-BOOM overlay text ─────────────────────────────────────────────────
  function _showKaBoom() {
    var el = document.getElementById('c4-kaboom');
    if (!el) {
      el = document.createElement('div');
      el.id = 'c4-kaboom';
      el.style.cssText = [
        'position:fixed',
        'top:40%',
        'left:50%',
        'transform:translate(-50%,-50%)',
        'font-family:monospace',
        'font-size:52px',
        'font-weight:bold',
        'color:#ff6600',
        'text-shadow:0 0 20px #ff4400,0 0 40px #ff2200',
        'pointer-events:none',
        'z-index:2000',
        'display:none',
        'letter-spacing:6px',
      ].join(';');
      el.textContent = 'KA-BOOM';
      document.body.appendChild(el);
    }
    el.style.display = 'block';
    el.style.opacity = '1';
    var startT = null;
    function fadeKaBoom(ts) {
      if (!startT) startT = ts;
      var t = (ts - startT) / 1200;
      if (t < 1) {
        el.style.opacity = String(1 - t);
        el.style.fontSize = (52 + t * 20) + 'px';
        requestAnimationFrame(fadeKaBoom);
      } else {
        el.style.display = 'none';
      }
    }
    requestAnimationFrame(fadeKaBoom);
  }

  // ── Audio helpers ─────────────────────────────────────────────────────────
  function _playBeep(freq, duration) {
    var ctx = window._audioCtx;
    if (!ctx) {
      // Try to create one
      try {
        if (typeof AudioContext !== 'undefined') {
          ctx = new AudioContext();
          window._audioCtx = ctx;
        } else if (typeof webkitAudioContext !== 'undefined') {
          ctx = new webkitAudioContext();
          window._audioCtx = ctx;
        }
      } catch (e) {}
    }
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function _playBoom() {
    var ctx = window._audioCtx;
    if (!ctx) return;
    try {
      var osc1 = ctx.createOscillator();
      var gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(60, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(15, ctx.currentTime + 0.5);
      gain1.gain.setValueAtTime(2.5, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.6);

      var osc2 = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(1200, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.25);
      gain2.gain.setValueAtTime(0.5, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }

  // ── Place mode ────────────────────────────────────────────────────────────
  function _enterPlaceMode() {
    if (_inventory <= 0) {
      _showToast('No C4 charges!');
      return;
    }
    _placeMode = true;
    _showGhost();
    _updateHUD();
    _showToast('[' + PLACE_KEY + '] again or click to place C4');
  }

  function _exitPlaceMode() {
    _placeMode = false;
    _hideGhost();
    _updateHUD();
  }

  // ── Toast helper (uses HUD if available, else creates own) ────────────────
  function _showToast(msg) {
    if (typeof HUD !== 'undefined' && HUD.showToast) {
      HUD.showToast(msg);
    } else if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup(msg, '#c8e040');
    }
  }

  // ── Key handling ─────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    // F4 — toggle place mode (or confirm place when in place mode)
    if (e.code === PLACE_KEY) {
      e.preventDefault();
      if (_placeMode) {
        place();
      } else {
        _enterPlaceMode();
      }
      return;
    }

    // F8 — detonate (hold for 0.5s for select mode)
    if (e.code === DETONATE_KEY) {
      e.preventDefault();
      _detonateHeld = 0;
      _selectMode = false;
    }
  }

  function _onKeyUp(e) {
    if (e.code === DETONATE_KEY) {
      if (_detonateHeld >= 0.45) {
        // Long hold: select mode — detonate only charge nearest to player
        _detonateSelect();
      } else {
        // Short press: detonate all
        detonate(-1);
      }
      _detonateHeld = 0;
      _selectMode = false;
    }
    // ESC cancels place mode
    if (e.code === 'Escape' && _placeMode) {
      _exitPlaceMode();
    }
  }

  function _detonateSelect() {
    if (_charges.length === 0) { _showToast('No C4 placed!'); return; }
    if (_charges.length === 1) { detonate(0); return; }
    // Detonate charge closest to player
    var bestIdx = 0;
    var bestDist = Infinity;
    if (typeof player !== 'undefined' && player.position) {
      for (var i = 0; i < _charges.length; i++) {
        var ch = _charges[i];
        if (ch.exploded) continue;
        var dx = ch.pos.x - player.position.x;
        var dz = ch.pos.z - player.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < bestDist) { bestDist = dist; bestIdx = i; }
      }
    }
    detonate(bestIdx);
  }

  // ── Click to place ────────────────────────────────────────────────────────
  function _onClick() {
    if (_placeMode) {
      place();
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────
  function init(scene, camera, onHitCb) {
    _scene = scene;
    _camera = camera;
    _onHit = onHitCb || null;
    _inventory = _TOTAL_CHARGES;
    _charges = [];
    _placeMode = false;
    _time = 0;
    _ensureHUD();
    _updateHUD();

    // Key listeners — capture phase so we can preventDefault on F4/F8
    document.addEventListener('keydown', _onKeyDown, true);
    document.addEventListener('keyup', _onKeyUp, true);
    document.addEventListener('click', _onClick, false);
  }

  function update(delta) {
    _time += delta;

    // Track F8 hold duration
    if (typeof document !== 'undefined') {
      // _detonateHeld is updated via separate tracker below
    }

    // Update ghost position
    if (_placeMode && _ghostGroup) {
      _updateGhostPosition();
      // Pulse ghost LED opacity
      if (_ghostLedMat) {
        _ghostLedMat.emissiveIntensity = 0.5 + 0.5 * Math.sin(_time * 6);
      }
    }

    // Update LED blink on placed charges
    for (var i = _charges.length - 1; i >= 0; i--) {
      var ch = _charges[i];
      if (!ch || ch.exploded) {
        _charges.splice(i, 1);
        continue;
      }

      if (ch.rapidBlink) {
        // 5 Hz blink
        ch.ledTimer += delta;
        if (ch.ledTimer >= 0.1) {
          ch.ledTimer = 0;
          ch.ledOn = !ch.ledOn;
          if (ch.ledMat) {
            ch.ledMat.emissiveIntensity = ch.ledOn ? 1.0 : 0.0;
            ch.ledMat.color.set(ch.ledOn ? 0xff2200 : 0x440000);
          }
        }
      } else {
        // Normal 0.5 Hz blink (2s period)
        ch.ledTimer += delta;
        if (ch.ledTimer >= 1.0) {
          ch.ledTimer = 0;
          ch.ledOn = !ch.ledOn;
          if (ch.ledMat) {
            ch.ledMat.emissiveIntensity = ch.ledOn ? 1.0 : 0.0;
          }
        }
      }
    }
  }

  function getCount() {
    return _inventory;
  }

  function reset() {
    // Detonate remaining charges silently
    for (var i = 0; i < _charges.length; i++) {
      var ch = _charges[i];
      if (ch && ch.group && _scene) {
        _scene.remove(ch.group);
      }
    }
    _charges = [];
    _inventory = _TOTAL_CHARGES;
    _placeMode = false;
    _hideGhost();
    _updateHUD();
  }

  // Track F8 hold time using separate keydown/keyup pair on window
  // (this runs in the update loop via a flag)
  var _f8Down = false;
  document.addEventListener('keydown', function (e) {
    if (e.code === DETONATE_KEY) { _f8Down = true; _detonateHeld = 0; }
  }, true);
  document.addEventListener('keyup', function (e) {
    if (e.code === DETONATE_KEY) { _f8Down = false; }
  }, true);

  // Patch update to also accumulate hold time
  var _origUpdate = update;
  update = function (delta) {
    if (_f8Down) _detonateHeld += delta;
    _origUpdate(delta);
  };

  return {
    init: init,
    update: update,
    place: place,
    detonate: detonate,
    getCount: getCount,
    reset: reset,
  };
})();
