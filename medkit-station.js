// medkit-station.js — Player-deployable heal zone
// Alt+H to deploy at current position. Max 3 stations, 2 charges, 120s cooldown per charge.
// Heal zone: 3-unit radius, 8 HP/s while inside (cap 100 HP). 45s active duration.
// Station HP: 60. Enemies can target and destroy it.
// Visual: white cylinder casing, red cross, pulsing green PointLight.
// HUD: 🏥 MEDKIT ×N display; "HEALING" pulsing green when in range.
// Audio: soft beep every 1.5s while active, heal hum when player inside, battery-dead click.
// Public API: init(scene, camera), update(dt), deploy(), reset()

window.MedkitStation = (function () {
  'use strict';

  // ─── Constants ────────────────────────────────────────────────────────────
  var _MAX_STATIONS = 3;
  var _MAX_CHARGES = 2;
  var _COOLDOWN = 120;        // seconds per charge recharge
  var _HEAL_RATE = 8;         // HP per second
  var _HEAL_RADIUS = 3;       // world units
  var _ACTIVE_DURATION = 45;  // seconds before depleted
  var _MAX_HP = 60;

  // ─── Private state ────────────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;
  var _keyDown = false;

  var _charges = _MAX_CHARGES;
  var _cooldownTimers = [0, 0]; // per-charge cooldown countdown

  var _healTextTimer = 0;   // float text refresh
  var _healChimeTimer = 0;  // heal chime every 2s

  var _hudEl = null;        // 🏥 MEDKIT ×N element
  var _healingEl = null;    // "HEALING" pulsing text
  var _healTextEl = null;   // floating "+8/s" near health bar
  var _overlay = null;

  // ─── Globals ──────────────────────────────────────────────────────────────
  window._medkitStations = window._medkitStations || [];
  window._activeMedkitHeal = false;

  // ─── Audio helpers ────────────────────────────────────────────────────────
  function _getCtx() {
    if (window._audioCtx) return window._audioCtx;
    try {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (Ctor) { window._audioCtx = new Ctor(); }
    } catch (e) {}
    return window._audioCtx || null;
  }

  function _playBeep(freq, dur, vol, type) {
    var ctx = _getCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq || 660, ctx.currentTime);
      gain.gain.setValueAtTime(vol || 0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (dur || 0.12));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (dur || 0.12));
    } catch (e) {}
  }

  function _playActiveBeep() {
    // Soft double-beep at 660 Hz
    _playBeep(660, 0.08, 0.06, 'sine');
    var ctx = _getCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + 0.12);
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.14);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + 0.12);
      osc.stop(ctx.currentTime + 0.23);
    } catch (e) {}
  }

  function _playHealHum() {
    var ctx = _getCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(380, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  }

  function _playBatteryDead() {
    var ctx = _getCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  }

  function _playDestroyExplosionSFX() {
    var ctx = _getCtx();
    if (!ctx) return;
    try {
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
      var data = buf.getChannelData(0);
      var i;
      for (i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / data.length);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  // ─── Toast helper ─────────────────────────────────────────────────────────
  function _toast(text, color) {
    try {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast(text, 2800, color || '#44ffaa');
      }
    } catch (e) {}
  }

  // ─── World-to-screen projection ──────────────────────────────────────────
  function _worldToScreen(worldPos) {
    if (!_camera) return null;
    var v = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z);
    v.project(_camera);
    if (v.z > 1) return null;
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-v.y * 0.5 + 0.5) * window.innerHeight
    };
  }

  // ─── Mesh builder ─────────────────────────────────────────────────────────
  function _buildMesh() {
    var group = new THREE.Group();

    // White casing cylinder
    var casingMat = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });
    var casing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.6, 0.9, 16),
      casingMat
    );
    casing.position.y = 0.45;
    group.add(casing);

    // Red cross — 5 thin BoxGeometry blocks forming a + on front face
    var redMat = new THREE.MeshLambertMaterial({ color: 0xFF1111 });

    // Vertical bar of cross
    var crossV = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.38, 0.04), redMat);
    crossV.position.set(0, 0.45, -0.52);
    group.add(crossV);

    // Horizontal bar of cross (3 segments left, centre, right)
    var crossHL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.04), redMat);
    crossHL.position.set(-0.12, 0.45, -0.52);
    group.add(crossHL);

    var crossHC = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.04), redMat);
    crossHC.position.set(0, 0.45, -0.52);
    group.add(crossHC);

    var crossHR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.04), redMat);
    crossHR.position.set(0.12, 0.45, -0.52);
    group.add(crossHR);

    // Top cap
    var capMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
    var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 16), capMat);
    cap.position.y = 0.93;
    group.add(cap);

    // Charge indicator bar (side) — shrinks as charges deplete
    var barBgMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var barBg = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.62, 0.06), barBgMat);
    barBg.position.set(0.54, 0.45, 0);
    group.add(barBg);

    var barFillMat = new THREE.MeshLambertMaterial({ color: 0x00FF44 });
    var barFill = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.60, 0.05), barFillMat);
    barFill.position.set(0.54, 0.45, 0.01);
    group.add(barFill);

    // Pulsing green point light above
    var light = new THREE.PointLight(0x00FF44, 4, 5);
    light.position.set(0, 1.6, 0);
    group.add(light);

    return {
      group: group,
      light: light,
      barFill: barFill,
      barFillMat: barFillMat,
      casing: casing
    };
  }

  // ─── DOM overlay helpers ──────────────────────────────────────────────────
  function _ensureOverlay() {
    if (_overlay) return;
    _overlay = document.createElement('div');
    _overlay.id = 'medkit-station-overlay';
    _overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:240;overflow:hidden';
    document.body.appendChild(_overlay);
  }

  function _createStationDOM(s) {
    _ensureOverlay();

    var badge = document.createElement('div');
    badge.style.cssText = [
      'position:absolute',
      'transform:translate(-50%,-100%)',
      'background:rgba(0,0,0,0.65)',
      'border:1px solid #00ff44',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:10px',
      'padding:2px 7px',
      'border-radius:3px',
      'white-space:nowrap',
      'pointer-events:none'
    ].join(';');
    badge.textContent = '🏥 MEDKIT STATION';
    _overlay.appendChild(badge);
    s.domBadge = badge;

    var hpWrap = document.createElement('div');
    hpWrap.style.cssText = [
      'position:absolute',
      'transform:translate(-50%,0)',
      'width:56px',
      'height:4px',
      'background:rgba(0,0,0,0.5)',
      'border:1px solid #555',
      'border-radius:2px',
      'overflow:hidden',
      'pointer-events:none'
    ].join(';');

    var hpFill = document.createElement('div');
    hpFill.style.cssText = 'width:100%;height:100%;background:#44ff44;border-radius:2px;transition:width 0.1s';
    hpWrap.appendChild(hpFill);
    _overlay.appendChild(hpWrap);

    s.domHpWrap = hpWrap;
    s.domHpFill = hpFill;
  }

  function _removeStationDOM(s) {
    if (s.domBadge && s.domBadge.parentNode) s.domBadge.parentNode.removeChild(s.domBadge);
    if (s.domHpWrap && s.domHpWrap.parentNode) s.domHpWrap.parentNode.removeChild(s.domHpWrap);
    s.domBadge = null;
    s.domHpWrap = null;
    s.domHpFill = null;
  }

  // ─── HUD elements ─────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (_hudEl) return;

    _hudEl = document.createElement('div');
    _hudEl.id = 'medkit-hud-badge';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:58px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.55)',
      'border:1px solid #00cc44',
      'color:#00ff66',
      'font-family:monospace',
      'font-size:11px',
      'padding:3px 12px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:210',
      'letter-spacing:1px'
    ].join(';');
    _hudEl.textContent = '🏥 MEDKIT \xD7' + _charges;
    document.body.appendChild(_hudEl);

    _healingEl = document.createElement('div');
    _healingEl.id = 'medkit-healing-indicator';
    _healingEl.style.cssText = [
      'position:fixed',
      'bottom:76px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#00ff44',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'pointer-events:none',
      'z-index:211',
      'display:none',
      'text-shadow:0 0 8px #00ff44',
      'animation:medkit-pulse 0.7s ease-in-out infinite alternate'
    ].join(';');
    _healingEl.textContent = 'HEALING';
    document.body.appendChild(_healingEl);

    // Inject CSS animation if not present
    if (!document.getElementById('medkit-station-style')) {
      var style = document.createElement('style');
      style.id = 'medkit-station-style';
      style.textContent = '@keyframes medkit-pulse{from{opacity:0.55}to{opacity:1}}';
      document.head.appendChild(style);
    }

    _healTextEl = document.createElement('div');
    _healTextEl.id = 'medkit-heal-text';
    _healTextEl.style.cssText = [
      'position:fixed',
      'bottom:96px',
      'left:calc(50% - 90px)',
      'color:#00ff44',
      'font-family:monospace',
      'font-size:12px',
      'font-weight:bold',
      'pointer-events:none',
      'z-index:211',
      'display:none',
      'text-shadow:0 0 6px #00aa33'
    ].join(';');
    _healTextEl.textContent = '+8/s';
    document.body.appendChild(_healTextEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    _hudEl.textContent = '🏥 MEDKIT \xD7' + _charges;
    if (_charges === 0) {
      _hudEl.style.color = '#ff4444';
      _hudEl.style.borderColor = '#cc2222';
    } else {
      _hudEl.style.color = '#00ff66';
      _hudEl.style.borderColor = '#00cc44';
    }
  }

  // ─── Depletion animation (flicker then off) ───────────────────────────────
  function _depleteAnimation(s) {
    var flickerCount = 0;
    var maxFlicker = 8;
    var interval = setInterval(function () {
      if (!s || !s.light) { clearInterval(interval); return; }
      flickerCount++;
      s.light.intensity = (flickerCount % 2 === 0) ? 3 : 0;
      if (flickerCount >= maxFlicker) {
        clearInterval(interval);
        s.light.intensity = 0;
        _playBatteryDead();
        _toast('MEDKIT STATION DEPLETED', '#ffcc00');
      }
    }, 90);
  }

  // ─── Destroy effect ───────────────────────────────────────────────────────
  function _explodeStation(s) {
    if (!_scene) return;
    var pos = s.group.position;

    // White/green flash
    var flashLight = new THREE.PointLight(0xAAFFCC, 12, 8);
    flashLight.position.copy(pos);
    flashLight.position.y += 0.5;
    _scene.add(flashLight);

    var flashStart = null;
    function fadeFlash(ts) {
      if (!flashStart) flashStart = ts;
      var elapsed = (ts - flashStart) / 350;
      if (elapsed < 1) {
        flashLight.intensity = 12 * (1 - elapsed);
        requestAnimationFrame(fadeFlash);
      } else {
        try { _scene.remove(flashLight); } catch (e) {}
      }
    }
    requestAnimationFrame(fadeFlash);

    // Debris
    var debrisMat = new THREE.MeshLambertMaterial({ color: 0xDDFFEE });
    var parts = [];
    var pi;
    for (pi = 0; pi < 7; pi++) {
      var pm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), debrisMat);
      pm.position.copy(pos);
      _scene.add(pm);
      var angle = Math.random() * Math.PI * 2;
      var speed = 1.5 + Math.random() * 2.5;
      parts.push({
        mesh: pm,
        vel: { x: Math.cos(angle) * speed, y: 2.5 + Math.random() * 2.5, z: Math.sin(angle) * speed },
        life: 1.0 + Math.random() * 0.5
      });
    }

    var lastT = null;
    function animParts(ts) {
      if (!lastT) lastT = ts;
      var dt2 = Math.min((ts - lastT) / 1000, 0.05);
      lastT = ts;
      var any = false;
      var ii;
      for (ii = 0; ii < parts.length; ii++) {
        var p = parts[ii];
        if (!p || p.life <= 0) continue;
        p.life -= dt2;
        p.vel.y -= 9.8 * dt2;
        p.mesh.position.x += p.vel.x * dt2;
        p.mesh.position.y += p.vel.y * dt2;
        p.mesh.position.z += p.vel.z * dt2;
        if (p.mesh.position.y < 0) { p.mesh.position.y = 0; p.vel.y = 0; }
        if (p.life <= 0) { try { _scene.remove(p.mesh); } catch (e) {} parts[ii] = null; }
        else any = true;
      }
      if (any) requestAnimationFrame(animParts);
    }
    requestAnimationFrame(animParts);

    _playDestroyExplosionSFX();
    _toast('MEDKIT DESTROYED', '#ff4444');
  }

  // ─── Remove station from scene & global list ──────────────────────────────
  function _removeStation(idx) {
    var s = window._medkitStations[idx];
    if (!s) return;
    try { if (_scene) _scene.remove(s.group); } catch (e) {}
    _removeStationDOM(s);
    window._medkitStations.splice(idx, 1);
  }

  // ─── Place a medkit station in the world ──────────────────────────────────
  function _placeStation() {
    if (!_scene || !_camera) return;
    if (_charges <= 0) {
      _toast('NO MEDKIT CHARGES — wait for cooldown', '#ff8888');
      return;
    }

    // Evict oldest if at cap
    if (window._medkitStations.length >= _MAX_STATIONS) {
      _removeStation(0);
      _toast('MEDKIT LIMIT REACHED — oldest removed', '#ffaa44');
    }

    var px = _camera.position.x;
    var pz = _camera.position.z;
    var py = 0;
    try {
      if (window.VoxelWorld && window.VoxelWorld.getTerrainHeight) {
        py = window.VoxelWorld.getTerrainHeight(px, pz) || 0;
      }
    } catch (e) {}

    var parts = _buildMesh();
    parts.group.position.set(px, py, pz);
    _scene.add(parts.group);

    var s = {
      group: parts.group,
      light: parts.light,
      barFill: parts.barFill,
      barFillMat: parts.barFillMat,
      hp: _MAX_HP,
      activeTimer: _ACTIVE_DURATION,
      beepTimer: 1.5,
      lightPhase: 0,
      depleted: false,
      destroyed: false,
      domBadge: null,
      domHpWrap: null,
      domHpFill: null
    };

    _createStationDOM(s);
    window._medkitStations.push(s);

    // Consume charge and start cooldown for that charge slot
    _charges -= 1;
    // Find first slot that isn't counting down (timer === 0) and start it
    var ci;
    for (ci = 0; ci < _cooldownTimers.length; ci++) {
      if (_cooldownTimers[ci] <= 0) {
        _cooldownTimers[ci] = _COOLDOWN;
        break;
      }
    }

    _updateHUD();

    // Deploy sound: positive chime
    _playBeep(880, 0.15, 0.1, 'sine');

    _toast('🏥 MEDKIT STATION DEPLOYED (' + window._medkitStations.length + '/' + _MAX_STATIONS + ')', '#44ffaa');
  }

  // ─── Public: deploy ───────────────────────────────────────────────────────
  function deploy() {
    if (!_scene || !_camera) return;
    _placeStation();
  }

  // ─── Public: update(dt) ───────────────────────────────────────────────────
  function update(dt) {
    if (!_scene || !_camera) return;
    var safeDt = Math.min(dt, 0.1);

    // Tick charge cooldowns
    var ci;
    for (ci = 0; ci < _cooldownTimers.length; ci++) {
      if (_cooldownTimers[ci] > 0) {
        _cooldownTimers[ci] -= safeDt;
        if (_cooldownTimers[ci] <= 0) {
          _cooldownTimers[ci] = 0;
          if (_charges < _MAX_CHARGES) {
            _charges++;
            _updateHUD();
            _toast('MEDKIT CHARGE READY', '#44ffaa');
          }
        }
      }
    }

    var playerPos = _camera.position;
    var playerIsHealing = false;

    var i;
    for (i = window._medkitStations.length - 1; i >= 0; i--) {
      var s = window._medkitStations[i];
      if (!s) { window._medkitStations.splice(i, 1); continue; }

      // Check destroyed by damage
      if (s.hp <= 0 && !s.destroyed) {
        s.destroyed = true;
        _explodeStation(s);
        try { if (_scene) _scene.remove(s.group); } catch (e) {}
        _removeStationDOM(s);
        window._medkitStations.splice(i, 1);
        continue;
      }

      if (s.destroyed || s.depleted) {
        // Already handled below when depleted
        if (s.depleted && !s.destroyed) {
          // Nothing more to do — station stays visible but inactive
        }
        continue;
      }

      // Tick active duration
      s.activeTimer -= safeDt;
      if (s.activeTimer <= 0) {
        s.depleted = true;
        _depleteAnimation(s);
        continue;
      }

      // Pulsing light: intensity oscillates 3→6→3 over 1s cycle
      s.lightPhase += safeDt * Math.PI * 2; // full cycle per second
      if (s.lightPhase > Math.PI * 2) s.lightPhase -= Math.PI * 2;
      var sinVal = (Math.sin(s.lightPhase) + 1) * 0.5; // 0..1
      s.light.intensity = 3 + sinVal * 3; // 3..6

      // Beep every 1.5s while active
      s.beepTimer -= safeDt;
      if (s.beepTimer <= 0) {
        s.beepTimer = 1.5;
        _playActiveBeep();
      }

      // Charge bar visual update (scales based on remaining charges)
      var chargeRatio = _charges / _MAX_CHARGES;
      s.barFill.scale.y = Math.max(0.01, chargeRatio);
      // Re-center after scale
      s.barFill.position.y = 0.45 - (1 - chargeRatio) * 0.30;

      // Heal player check
      var dx = playerPos.x - s.group.position.x;
      var dz = playerPos.z - s.group.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= _HEAL_RADIUS) {
        var p = window.player;
        if (p && typeof p.hp === 'number') {
          var maxHp = p.maxHp || 100;
          if (p.hp < maxHp) {
            p.hp = Math.min(maxHp, p.hp + _HEAL_RATE * safeDt);
            try {
              if (window.HUD && window.HUD.setHealth) {
                window.HUD.setHealth(Math.round(p.hp), maxHp);
              }
            } catch (e) {}
          }
        }
        playerIsHealing = true;
      }

      // Update DOM badge and HP bar
      var labelPos = new THREE.Vector3(
        s.group.position.x,
        s.group.position.y + 1.8,
        s.group.position.z
      );
      var screen = _worldToScreen(labelPos);
      if (screen) {
        if (s.domBadge) {
          s.domBadge.style.left = screen.x + 'px';
          s.domBadge.style.top = (screen.y - 18) + 'px';
          s.domBadge.style.display = 'block';
        }
        if (s.domHpWrap) {
          s.domHpWrap.style.left = screen.x + 'px';
          s.domHpWrap.style.top = screen.y + 'px';
          s.domHpWrap.style.display = 'block';
        }
        if (s.domHpFill) {
          var hpPct = Math.max(0, (s.hp / _MAX_HP) * 100);
          s.domHpFill.style.width = hpPct + '%';
          s.domHpFill.style.background = hpPct > 50 ? '#44ff44' : (hpPct > 25 ? '#ffcc00' : '#ff3333');
        }
      } else {
        if (s.domBadge) s.domBadge.style.display = 'none';
        if (s.domHpWrap) s.domHpWrap.style.display = 'none';
      }
    }

    // Update heal chime and floating text
    if (playerIsHealing) {
      _healChimeTimer -= safeDt;
      if (_healChimeTimer <= 0) {
        _healChimeTimer = 2.0;
        _playHealHum();
      }

      _healTextTimer -= safeDt;
      if (_healTextTimer <= 0) {
        _healTextTimer = 0.5;
        if (_healTextEl) {
          _healTextEl.style.display = 'block';
        }
      }
    } else {
      _healChimeTimer = 0;
      _healTextTimer = 0;
      if (_healTextEl) _healTextEl.style.display = 'none';
    }

    // Update HUD heal indicator
    window._activeMedkitHeal = playerIsHealing;
    if (_healingEl) {
      _healingEl.style.display = playerIsHealing ? 'block' : 'none';
    }
  }

  // ─── Damage a station (callable by enemy AI) ─────────────────────────────
  function damageStation(station, amount) {
    if (!station || station.destroyed || station.depleted) return;
    station.hp -= amount;
  }

  // Returns active stations for external damage integration
  function getStationsForDamage() {
    return window._medkitStations;
  }

  // ─── Public: reset ────────────────────────────────────────────────────────
  function reset() {
    var i;
    for (i = 0; i < window._medkitStations.length; i++) {
      var s = window._medkitStations[i];
      if (!s) continue;
      try { if (_scene) _scene.remove(s.group); } catch (e) {}
      _removeStationDOM(s);
    }
    window._medkitStations = [];
    window._activeMedkitHeal = false;
    _charges = _MAX_CHARGES;
    _cooldownTimers = [0, 0];
    if (_hudEl) _hudEl.parentNode && _hudEl.parentNode.removeChild(_hudEl);
    if (_healingEl) _healingEl.parentNode && _healingEl.parentNode.removeChild(_healingEl);
    if (_healTextEl) _healTextEl.parentNode && _healTextEl.parentNode.removeChild(_healTextEl);
    _hudEl = null;
    _healingEl = null;
    _healTextEl = null;
    _updateHUD();
  }

  // ─── Public: init ─────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene = scene;
    _camera = camera;
    window._medkitStations = [];
    window._activeMedkitHeal = false;
    _charges = _MAX_CHARGES;
    _cooldownTimers = [0, 0];
    _keyDown = false;
    _healChimeTimer = 0;
    _healTextTimer = 0;

    _ensureOverlay();
    _ensureHUD();
    _updateHUD();

    // Alt+H to deploy
    document.addEventListener('keydown', function (e) {
      if (!e.altKey || e.code !== 'KeyH') return;
      if (_keyDown) return;
      _keyDown = true;
      e.preventDefault();
      deploy();
    });

    document.addEventListener('keyup', function (e) {
      if (e.code === 'KeyH') _keyDown = false;
    });
  }

  // ─── Expose public API ────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    deploy: deploy,
    reset: reset,
    damageStation: damageStation,
    getStationsForDamage: getStationsForDamage
  };

})();
