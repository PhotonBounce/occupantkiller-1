// ============================================================
//  hostage-rescue.js — Civilian hostage rescue system
//  Features:
//    1. Hostage spawning with civilian mesh (body, head, hands)
//    2. Guard AI — patrols near hostage, engages player if spotted
//    3. Rescue mechanic — hold E for 2s near unguarded hostage
//    4. Mission HUD — top-center rescue counter + 120s wave timer
//    5. Rescue rewards — +300 score, +15 HP, bonus ammo crate
//    6. Failure state — stray shot within 5m kills hostage, -500 score
//    7. Radio callout — Web Audio tones + KillFeedEvents integration
//    8. Wave integration — spawnForWave for wave 3+
//  Public API: init, update, spawnHostage, spawnForWave, reset
// ============================================================
window.HostageRescue = (function () {
  'use strict';

  // ── Config ─────────────────────────────────────────────────
  var MAX_HOSTAGES      = 3;
  var GUARD_RADIUS_MIN  = 3;
  var GUARD_RADIUS_MAX  = 5;
  var GUARD_SPOT_RANGE  = 20;
  var RESCUE_RANGE      = 2;
  var RESCUE_HOLD_TIME  = 2.0;
  var HOSTAGE_SPEED     = 1.5;
  var HOSTAGE_DESPAWN   = 15.0;
  var WAVE_TIME_LIMIT   = 120.0;  // seconds per wave
  var STRAY_SHOT_RANGE  = 5;
  var SCORE_RESCUE      = 300;
  var SCORE_PENALTY     = -500;
  var HEAL_AMOUNT       = 15;

  // Colors
  var COLOR_BODY_BLUE   = 0x3a6fd8;
  var COLOR_BODY_ORANGE = 0xe8841a;
  var COLOR_SKIN        = 0xf5c5a3;
  var COLOR_GUARD       = 0x4a4a4a;
  var COLOR_GUARD_ACCENT= 0x8b0000;

  // ── State ───────────────────────────────────────────────────
  var _scene            = null;
  var _hostages         = [];   // active hostage objects
  var _guards           = [];   // active guard objects
  var _hudEl            = null;
  var _timerEl          = null;
  var _promptEl         = null;
  var _warnEl           = null;

  var _waveTimer        = 0;
  var _waveActive       = false;
  var _totalToRescue    = 0;
  var _totalRescued     = 0;
  var _inited           = false;
  var _eKeyHeld         = false;
  var _rescueProgress   = 0;
  var _rescueTarget     = null;
  var _rescueBarEl      = null;
  var _warnTimer        = 0;
  var _audioCtx         = null;

  // ── Helpers ─────────────────────────────────────────────────
  function _getScene() {
    return _scene ||
      (window.GameManager && window.GameManager.scene) ||
      window.scene ||
      null;
  }

  function _getCamera() {
    return (window.GameManager && window.GameManager.camera) ||
      window.camera ||
      null;
  }

  function _getPlayerPos() {
    var cam = _getCamera();
    if (cam) return cam.position;
    return null;
  }

  function _dist(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _addScore(pts) {
    if (window.GameManager && typeof window.GameManager.addScore === 'function') {
      window.GameManager.addScore(pts);
    } else if (typeof window._score !== 'undefined') {
      window._score += pts;
    }
    // update HUD score display
    var scoreEl = document.getElementById('score-display');
    if (scoreEl) {
      var cur = parseInt((scoreEl.textContent || '').replace(/[^0-9\-]/g, '')) || 0;
      scoreEl.textContent = 'SCORE: ' + (cur + pts);
    }
  }

  function _healPlayer(amount) {
    if (window.GameManager && typeof window.GameManager.healPlayer === 'function') {
      window.GameManager.healPlayer(amount);
    } else if (typeof window._playerHP !== 'undefined') {
      window._playerHP = Math.min(100, window._playerHP + amount);
    }
  }

  // ── Web Audio radio callout ──────────────────────────────────
  function _playRadioCallout() {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      var ctx = _audioCtx;
      var now = ctx.currentTime;

      // Three ascending tones
      var tones = [440, 660, 880];
      for (var i = 0; i < tones.length; i++) {
        (function (freq, offset) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + offset);
          gain.gain.setValueAtTime(0.0, now + offset);
          gain.gain.linearRampToValueAtTime(0.18, now + offset + 0.01);
          gain.gain.linearRampToValueAtTime(0.0, now + offset + 0.18);
          osc.start(now + offset);
          osc.stop(now + offset + 0.2);
        })(tones[i], i * 0.22);
      }

      // Distorted voice simulation — band-pass filtered noise burst
      var bufSize = ctx.sampleRate * 0.35;
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var s = 0; s < bufSize; s++) {
        data[s] = (Math.random() * 2 - 1) * 0.4;
      }
      var noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buf;
      var bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.setValueAtTime(1200, now + 0.7);
      bpf.Q.setValueAtTime(3, now + 0.7);
      var noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, now + 0.7);
      noiseGain.gain.linearRampToValueAtTime(0.0, now + 1.05);
      noiseSource.connect(bpf);
      bpf.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSource.start(now + 0.7);
    } catch (e) {
      // audio not available — silently skip
    }
  }

  // ── Mesh factories ───────────────────────────────────────────
  function _makeHostageMesh(colorBody) {
    var THREE = window.THREE;
    var group = new THREE.Group();

    // Body
    var bodyGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.6, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: colorBody });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.8;
    group.add(body);

    // Head
    var headGeo = new THREE.SphereGeometry(0.2, 8, 8);
    var headMat = new THREE.MeshLambertMaterial({ color: COLOR_SKIN });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.8;
    group.add(head);

    // Hands behind back (thin cylinders)
    var handGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 6);
    var handMat = new THREE.MeshLambertMaterial({ color: COLOR_SKIN });

    var handL = new THREE.Mesh(handGeo, handMat);
    handL.rotation.z = Math.PI / 2;
    handL.position.set(-0.28, 0.6, -0.18);
    group.add(handL);

    var handR = new THREE.Mesh(handGeo, handMat);
    handR.rotation.z = Math.PI / 2;
    handR.position.set(0.28, 0.6, -0.18);
    group.add(handR);

    // Kneel animation — tilt forward slightly
    group.rotation.x = 0.3;

    return group;
  }

  function _makeGuardMesh() {
    var THREE = window.THREE;
    var group = new THREE.Group();

    // Body
    var bodyGeo = new THREE.CylinderGeometry(0.28, 0.28, 1.7, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: COLOR_GUARD });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.85;
    group.add(body);

    // Head
    var headGeo = new THREE.SphereGeometry(0.22, 8, 8);
    var headMat = new THREE.MeshLambertMaterial({ color: COLOR_GUARD_ACCENT });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.9;
    group.add(head);

    // Rifle (simple box)
    var rifleGeo = new THREE.BoxGeometry(0.08, 0.08, 0.9);
    var rifleMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var rifle = new THREE.Mesh(rifleGeo, rifleMat);
    rifle.position.set(0.35, 1.1, -0.2);
    rifle.rotation.x = 0.3;
    group.add(rifle);

    return group;
  }

  // ── HUD creation ─────────────────────────────────────────────
  function _ensureHUD() {
    if (_hudEl) return;

    _hudEl = document.createElement('div');
    _hudEl.id = 'hostage-rescue-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:38px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)',
      'border:1px solid rgba(100,180,255,0.6)',
      'color:#64b4ff',
      'padding:4px 18px',
      'border-radius:5px',
      'font-size:12px',
      'font-family:monospace',
      'z-index:210',
      'pointer-events:none',
      'text-align:center',
      'letter-spacing:1px',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudEl);

    _timerEl = document.createElement('div');
    _timerEl.style.cssText = 'font-size:10px;color:#aaa;margin-top:2px';
    _hudEl.appendChild(_timerEl);

    // Rescue progress bar (shown when holding E)
    _rescueBarEl = document.createElement('div');
    _rescueBarEl.style.cssText = [
      'position:fixed',
      'bottom:220px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:160px',
      'height:8px',
      'background:rgba(0,0,0,0.5)',
      'border:1px solid rgba(100,255,100,0.5)',
      'border-radius:4px',
      'z-index:210',
      'pointer-events:none',
      'overflow:hidden',
      'display:none'
    ].join(';');
    var fill = document.createElement('div');
    fill.id = 'hostage-rescue-bar-fill';
    fill.style.cssText = 'width:0%;height:100%;background:linear-gradient(90deg,#22cc44,#66ff88);border-radius:4px;transition:width 0.05s';
    _rescueBarEl.appendChild(fill);
    document.body.appendChild(_rescueBarEl);

    // Interaction prompt
    _promptEl = document.createElement('div');
    _promptEl.style.cssText = [
      'position:fixed',
      'bottom:240px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.65)',
      'border:1px solid rgba(255,255,255,0.3)',
      'color:#fff',
      'padding:5px 16px',
      'border-radius:5px',
      'font-size:12px',
      'font-family:monospace',
      'z-index:210',
      'pointer-events:none',
      'text-align:center',
      'display:none'
    ].join(';');
    document.body.appendChild(_promptEl);

    // Warning overlay (civilian casualty)
    _warnEl = document.createElement('div');
    _warnEl.style.cssText = [
      'position:fixed',
      'top:25%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(180,0,0,0.85)',
      'border:2px solid #ff2222',
      'color:#fff',
      'padding:10px 28px',
      'border-radius:7px',
      'font-size:16px',
      'font-weight:bold',
      'font-family:monospace',
      'z-index:500',
      'pointer-events:none',
      'text-align:center',
      'display:none',
      'letter-spacing:2px'
    ].join(';');
    _warnEl.textContent = 'X  CIVILIAN CASUALTY  X';
    document.body.appendChild(_warnEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_waveActive) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';
    var firstLine = document.createElement('div');
    firstLine.textContent = 'RESCUE MISSION: ' + _totalRescued + '/' + _totalToRescue + ' HOSTAGES';
    // Replace text content manually (HUD has child elements)
    while (_hudEl.firstChild && _hudEl.firstChild !== _timerEl) {
      _hudEl.removeChild(_hudEl.firstChild);
    }
    _hudEl.insertBefore(firstLine, _timerEl);
    if (_waveTimer > 0) {
      var secs = Math.ceil(_waveTimer);
      var mins = Math.floor(secs / 60);
      var s = secs % 60;
      _timerEl.textContent = 'TIME: ' + mins + ':' + (s < 10 ? '0' : '') + s;
      _timerEl.style.color = _waveTimer < 30 ? '#ff4444' : '#aaa';
    } else {
      _timerEl.textContent = '';
    }
  }

  function _showWarning(text, duration) {
    if (!_warnEl) return;
    _warnEl.textContent = text || 'X  CIVILIAN CASUALTY  X';
    _warnEl.style.display = 'block';
    _warnTimer = duration || 2.5;
  }

  // ── Guard creation ───────────────────────────────────────────
  function _spawnGuard(hostage, offsetAngle) {
    var sc = _getScene();
    if (!sc) return null;
    var THREE = window.THREE;

    var r = GUARD_RADIUS_MIN + Math.random() * (GUARD_RADIUS_MAX - GUARD_RADIUS_MIN);
    var gx = hostage.mesh.position.x + Math.cos(offsetAngle) * r;
    var gz = hostage.mesh.position.z + Math.sin(offsetAngle) * r;
    var gy = hostage.mesh.position.y;

    var mesh = _makeGuardMesh();
    mesh.position.set(gx, gy, gz);
    sc.add(mesh);

    var guard = {
      mesh: mesh,
      hostage: hostage,
      patrolAngle: offsetAngle,
      patrolRadius: r,
      patrolCenter: { x: hostage.mesh.position.x, y: gy, z: hostage.mesh.position.z },
      patrolSpeed: 0.4 + Math.random() * 0.3,
      state: 'patrol',   // 'patrol' | 'engage' | 'dead'
      hp: 60,
      alive: true
    };
    _guards.push(guard);
    hostage.guards.push(guard);
    return guard;
  }

  // ── Hostage spawning ─────────────────────────────────────────
  function spawnHostage(scene, x, y, z) {
    if (_hostages.length >= MAX_HOSTAGES) return null;
    var THREE = window.THREE;
    if (!THREE) { console.warn('[HostageRescue] THREE not found'); return null; }

    var sc = scene || _getScene();
    if (!sc) return null;

    var colorBody = (Math.random() > 0.5) ? COLOR_BODY_BLUE : COLOR_BODY_ORANGE;
    var mesh = _makeHostageMesh(colorBody);
    mesh.position.set(x, y, z);
    sc.add(mesh);

    var numGuards = 1 + (Math.random() > 0.5 ? 1 : 0);

    var hostage = {
      mesh: mesh,
      state: 'captive',   // 'captive' | 'rescued' | 'killed' | 'fleeing'
      guards: [],
      guarded: true,
      fleeTimer: 0,
      waveAnim: 0,
      armWaveDir: 1
    };
    _hostages.push(hostage);
    _totalToRescue++;

    for (var i = 0; i < numGuards; i++) {
      var angle = (i / numGuards) * Math.PI * 2 + Math.random() * 0.5;
      _spawnGuard(hostage, angle);
    }

    _ensureHUD();
    _updateHUD();
    return hostage;
  }

  // ── Guard death (called when guard is killed externally) ─────
  function _killGuard(guard) {
    if (!guard.alive) return;
    guard.alive = false;
    guard.state = 'dead';
    var sc = _getScene();
    if (sc && guard.mesh) sc.remove(guard.mesh);

    // Check if hostage is now unguarded
    var hostage = guard.hostage;
    if (!hostage) return;
    var allDead = true;
    for (var i = 0; i < hostage.guards.length; i++) {
      if (hostage.guards[i].alive) { allDead = false; break; }
    }
    if (allDead) {
      hostage.guarded = false;
    }
  }

  // ── Rescue hostage ──────────────────────────────────────────
  function _rescueHostage(hostage) {
    if (hostage.state !== 'captive') return;
    hostage.state = 'fleeing';
    hostage.guarded = false;
    hostage.fleeTimer = HOSTAGE_DESPAWN;

    // Stand up animation — reset rotation.x
    hostage.mesh.rotation.x = 0;
    // Arm wave starts
    hostage.waveAnim = 0;

    _totalRescued++;
    _addScore(SCORE_RESCUE);
    _healPlayer(HEAL_AMOUNT);
    _spawnAmmoCrate(hostage);
    _playRadioCallout();

    if (window.KillFeedEvents && typeof window.KillFeedEvents.addEvent === 'function') {
      window.KillFeedEvents.addEvent('HOSTAGE RESCUED +300', '', 'rescue');
    }

    _updateHUD();

    // Check wave bonus
    if (_waveActive && _totalRescued >= _totalToRescue) {
      _triggerWaveBonus();
    }
  }

  // ── Kill hostage (stray shot) ────────────────────────────────
  function _killHostage(hostage) {
    if (hostage.state !== 'captive') return;
    hostage.state = 'killed';

    // Red X overlay on hostage mesh
    var THREE = window.THREE;
    if (THREE && hostage.mesh) {
      var mat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
      hostage.mesh.traverse(function (child) {
        if (child.isMesh) child.material = mat;
      });
    }

    _addScore(SCORE_PENALTY);
    _showWarning('X  CIVILIAN CASUALTY  X', 3.0);

    if (window.KillFeedEvents && typeof window.KillFeedEvents.addEvent === 'function') {
      window.KillFeedEvents.addEvent('CIVILIAN CASUALTY -500', '', 'penalty');
    }

    _updateHUD();

    // Remove killed hostage mesh after 3 seconds
    var sc = _getScene();
    var h = hostage;
    setTimeout(function () {
      if (sc && h.mesh) sc.remove(h.mesh);
    }, 3000);
  }

  // ── Spawn bonus ammo crate nearby ───────────────────────────
  function _spawnAmmoCrate(hostage) {
    var THREE = window.THREE;
    var sc = _getScene();
    if (!THREE || !sc) return;

    var angle = Math.random() * Math.PI * 2;
    var r = 2 + Math.random() * 2;
    var cx = hostage.mesh.position.x + Math.cos(angle) * r;
    var cz = hostage.mesh.position.z + Math.sin(angle) * r;
    var cy = hostage.mesh.position.y;

    var geo = new THREE.BoxGeometry(0.6, 0.4, 0.4);
    var mat = new THREE.MeshLambertMaterial({ color: 0x556b2f });
    var crate = new THREE.Mesh(geo, mat);
    crate.position.set(cx, cy + 0.2, cz);
    sc.add(crate);

    // Register with pickups system if available
    if (window.Pickups && typeof window.Pickups.registerCrate === 'function') {
      window.Pickups.registerCrate(crate, 'ammo', 50);
    }

    // Auto-remove after 30s
    setTimeout(function () {
      if (sc) sc.remove(crate);
    }, 30000);
  }

  // ── Wave bonus trigger ───────────────────────────────────────
  function _triggerWaveBonus() {
    _addScore(500);
    var ann = document.getElementById('wave-announce');
    if (ann) {
      ann.textContent = 'ALL HOSTAGES RESCUED! +500 BONUS!';
      ann.style.display = 'block';
      setTimeout(function () {
        ann.style.display = '';
        ann.textContent = '';
      }, 3000);
    }
  }

  // ── Check stray shots (called by update) ────────────────────
  function _checkStrayShots() {
    // Try to hook into the game's shot-fired signal
    // We expose notifyShot() as a public call from the game's weapon system
  }

  // ── Rescue progress update ───────────────────────────────────
  function _updateRescueInteraction(dt) {
    var pPos = _getPlayerPos();
    if (!pPos) return;

    var nearUnguarded = null;
    for (var i = 0; i < _hostages.length; i++) {
      var h = _hostages[i];
      if (h.state !== 'captive') continue;
      if (h.guarded) continue;
      if (_dist2D(pPos, h.mesh.position) <= RESCUE_RANGE) {
        nearUnguarded = h;
        break;
      }
    }

    // Also check for guarded hostage prompt
    var nearGuarded = null;
    if (!nearUnguarded) {
      for (var j = 0; j < _hostages.length; j++) {
        var hg = _hostages[j];
        if (hg.state !== 'captive') continue;
        if (!hg.guarded) continue;
        if (_dist2D(pPos, hg.mesh.position) <= RESCUE_RANGE) {
          nearGuarded = hg;
          break;
        }
      }
    }

    if (nearUnguarded) {
      _promptEl.textContent = '[E] RESCUE HOSTAGE — Hold 2s';
      _promptEl.style.display = 'block';

      if (_eKeyHeld) {
        _rescueProgress += dt;
        _rescueTarget = nearUnguarded;
        var pct = Math.min(100, (_rescueProgress / RESCUE_HOLD_TIME) * 100);
        var fill = document.getElementById('hostage-rescue-bar-fill');
        if (fill) fill.style.width = pct + '%';
        _rescueBarEl.style.display = 'block';

        if (_rescueProgress >= RESCUE_HOLD_TIME) {
          _rescueHostage(nearUnguarded);
          _rescueProgress = 0;
          _rescueTarget = null;
          _rescueBarEl.style.display = 'none';
          var f2 = document.getElementById('hostage-rescue-bar-fill');
          if (f2) f2.style.width = '0%';
          _promptEl.style.display = 'none';
        }
      } else {
        if (_rescueTarget === nearUnguarded) {
          _rescueProgress = 0;
          _rescueTarget = null;
          var f3 = document.getElementById('hostage-rescue-bar-fill');
          if (f3) f3.style.width = '0%';
          _rescueBarEl.style.display = 'none';
        }
      }
    } else if (nearGuarded) {
      _promptEl.textContent = 'ELIMINATE GUARDS TO RESCUE';
      _promptEl.style.display = 'block';
      _rescueProgress = 0;
      _rescueTarget = null;
      _rescueBarEl.style.display = 'none';
    } else {
      _promptEl.style.display = 'none';
      if (!_eKeyHeld) {
        _rescueProgress = 0;
        _rescueTarget = null;
        _rescueBarEl.style.display = 'none';
      }
    }
  }

  // ── Fleeing hostage animation ────────────────────────────────
  function _updateFleeingHostage(h, dt) {
    // Wave arms animation
    h.waveAnim += dt * 3;
    var leftHand = h.mesh.children[2];
    var rightHand = h.mesh.children[3];
    if (leftHand) leftHand.rotation.z = Math.PI / 2 + Math.sin(h.waveAnim) * 0.6;
    if (rightHand) rightHand.rotation.z = Math.PI / 2 - Math.sin(h.waveAnim) * 0.6;

    // Move toward map edge (positive Z direction as default)
    h.mesh.position.z += HOSTAGE_SPEED * dt;

    // Despawn timer
    h.fleeTimer -= dt;
    if (h.fleeTimer <= 0) {
      var sc = _getScene();
      if (sc) sc.remove(h.mesh);
      h.state = 'despawned';
    }
  }

  // ── Guard AI update ──────────────────────────────────────────
  function _updateGuard(guard, dt) {
    if (!guard.alive || guard.state === 'dead') return;
    var THREE = window.THREE;
    var pPos = _getPlayerPos();

    if (guard.state === 'patrol') {
      // Face the hostage
      guard.patrolAngle += guard.patrolSpeed * dt;
      var tx = guard.patrolCenter.x + Math.cos(guard.patrolAngle) * guard.patrolRadius;
      var tz = guard.patrolCenter.z + Math.sin(guard.patrolAngle) * guard.patrolRadius;
      guard.mesh.position.x = tx;
      guard.mesh.position.z = tz;

      // Face hostage
      if (guard.hostage && guard.hostage.mesh) {
        var hx = guard.hostage.mesh.position.x;
        var hz = guard.hostage.mesh.position.z;
        guard.mesh.rotation.y = Math.atan2(tx - hx, tz - hz);
      }

      // Spot player
      if (pPos) {
        var d = _dist2D(pPos, guard.mesh.position);
        if (d < GUARD_SPOT_RANGE) {
          guard.state = 'engage';
        }
      }
    } else if (guard.state === 'engage') {
      if (!pPos) { guard.state = 'patrol'; return; }
      var dx = pPos.x - guard.mesh.position.x;
      var dz = pPos.z - guard.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      // Face player
      guard.mesh.rotation.y = Math.atan2(dx, dz);

      // Move toward player if more than 4m away
      if (dist > 4) {
        var spd = 2.5 * dt;
        guard.mesh.position.x += (dx / dist) * spd;
        guard.mesh.position.z += (dz / dist) * spd;
      }

      // If player moves out of range, return to patrol
      if (dist > GUARD_SPOT_RANGE * 1.5) {
        guard.state = 'patrol';
      }
    }
  }

  // ── Key listeners ────────────────────────────────────────────
  function _setupKeyListeners() {
    document.addEventListener('keydown', function (e) {
      if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
        _eKeyHeld = true;
      }
    });
    document.addEventListener('keyup', function (e) {
      if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
        _eKeyHeld = false;
        _rescueProgress = 0;
        if (_rescueBarEl) _rescueBarEl.style.display = 'none';
        var fill = document.getElementById('hostage-rescue-bar-fill');
        if (fill) fill.style.width = '0%';
      }
    });
  }

  // ── Public: notifyShot — called by weapon system on fire ─────
  function notifyShot(shotOrigin) {
    if (!shotOrigin) {
      var pPos = _getPlayerPos();
      if (!pPos) return;
      shotOrigin = pPos;
    }
    for (var i = 0; i < _hostages.length; i++) {
      var h = _hostages[i];
      if (h.state !== 'captive') continue;
      if (!h.guarded) continue; // only "unfreed" (guarded) hostages are endangered
      var d = _dist(shotOrigin, h.mesh.position);
      if (d <= STRAY_SHOT_RANGE) {
        _killHostage(h);
        break;
      }
    }
  }

  // ── Public: spawnForWave ─────────────────────────────────────
  function spawnForWave(scene, wave) {
    if (wave < 3) return;  // skip waves 1-2

    var sc = scene || _getScene();
    if (!sc) return;

    var count = 1 + (Math.random() > 0.5 ? 1 : 0);

    // Pick random spawn positions around map center
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var r = 15 + Math.random() * 20;
      var x = Math.cos(angle) * r;
      var z = Math.sin(angle) * r;
      spawnHostage(sc, x, 0, z);
    }

    _waveActive = true;
    _waveTimer = WAVE_TIME_LIMIT;
  }

  // ── Public: init ─────────────────────────────────────────────
  function init(scene) {
    if (_inited) return;
    _inited = true;
    _scene = scene || null;
    _ensureHUD();
    _setupKeyListeners();
  }

  // ── Public: update ───────────────────────────────────────────
  function update(dt) {
    if (!dt || dt <= 0) return;

    // Warning overlay countdown
    if (_warnTimer > 0) {
      _warnTimer -= dt;
      if (_warnEl) {
        if (_warnTimer <= 0) {
          _warnEl.style.display = 'none';
          _warnTimer = 0;
        }
      }
    }

    // Wave timer
    if (_waveActive && _waveTimer > 0) {
      _waveTimer -= dt;
      if (_waveTimer <= 0) {
        _waveTimer = 0;
        // Time expired — wave ends without bonus
      }
    }

    // Update guards
    for (var gi = 0; gi < _guards.length; gi++) {
      _updateGuard(_guards[gi], dt);
    }

    // Update hostages
    for (var hi = 0; hi < _hostages.length; hi++) {
      var h = _hostages[hi];
      if (h.state === 'fleeing') {
        _updateFleeingHostage(h, dt);
      } else if (h.state === 'captive') {
        // Gentle breathing bob
        h.mesh.position.y += Math.sin(Date.now() * 0.002 + hi) * 0.0005;
      }
    }

    // Rescue interaction
    _updateRescueInteraction(dt);

    // Check if guards died via external systems (HP check)
    for (var di = 0; di < _guards.length; di++) {
      var g = _guards[di];
      if (!g.alive) continue;
      // Check if guard mesh was removed from scene (killed by game)
      var sc = _getScene();
      if (sc && g.mesh && !g.mesh.parent) {
        _killGuard(g);
      }
    }

    // Update HUD
    _updateHUD();
  }

  // ── Public: reset ────────────────────────────────────────────
  function reset() {
    var sc = _getScene();

    for (var i = 0; i < _hostages.length; i++) {
      if (sc && _hostages[i].mesh) sc.remove(_hostages[i].mesh);
    }
    for (var j = 0; j < _guards.length; j++) {
      if (sc && _guards[j].mesh) sc.remove(_guards[j].mesh);
    }

    _hostages = [];
    _guards = [];
    _totalToRescue = 0;
    _totalRescued = 0;
    _waveActive = false;
    _waveTimer = 0;
    _eKeyHeld = false;
    _rescueProgress = 0;
    _rescueTarget = null;
    _warnTimer = 0;

    if (_hudEl) _hudEl.style.display = 'none';
    if (_rescueBarEl) _rescueBarEl.style.display = 'none';
    if (_promptEl) _promptEl.style.display = 'none';
    if (_warnEl) _warnEl.style.display = 'none';
  }

  // ── Public API ───────────────────────────────────────────────
  return {
    init: init,
    update: update,
    spawnHostage: spawnHostage,
    spawnForWave: spawnForWave,
    reset: reset,
    notifyShot: notifyShot,
    killGuard: _killGuard
  };
})();
