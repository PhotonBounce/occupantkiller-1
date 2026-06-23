/* ───────────────────────────────────────────────────────────────────────────
   recon-satellite.js — Orbital reconnaissance & precision rail-gun strike
   targeting system for Three.js FPS.

   Player flow:
     1. Wait for satellite orbital pass (every 90s) — HUD counts down
     2. Shift+S opens satellite view — bird's-eye camera at Y=200
     3. Pan with WASD, zoom with mouse wheel (FOV 5-30)
     4. E — recon scan: tags all enemies as TAGGED (red squares in HUD, 60s)
     5. F — place a strike marker (red crosshair mesh on ground)
        Enter — confirm rail-gun strike (5s delay, 500 dmg / r8)
     6. After use, 180s cooldown before next pass

   Satellite mesh: cross of two BoxGeometries (solar panels) at Y=150,
   orbiting slowly across the sky, visible from ground as tiny glint.

   Jamming: if CyberWarfare / EW jammer is active, satellite uplink fails.

   API: window.ReconSatellite = { init(scene, camera, renderer), update(delta), reset() }
   ─────────────────────────────────────────────────────────────────────────── */
window.ReconSatellite = (function () {
  'use strict';

  /* ── constants ──────────────────────────────────────────────────────────── */
  var PASS_INTERVAL    = 90;     // seconds between passes becoming available
  var COOLDOWN_AFTER   = 180;    // seconds cooldown after using the satellite
  var SAT_HEIGHT       = 150;    // world-space Y for satellite mesh
  var CAM_HEIGHT       = 200;    // bird's-eye camera Y
  var SAT_ORBIT_RANGE  = 300;    // satellite travels -RANGE to +RANGE on X
  var SAT_ORBIT_SPEED  = 8;      // world units per second
  var TAG_DURATION     = 60;     // seconds enemies stay TAGGED
  var STRIKE_DELAY     = 5;      // seconds from confirmation to impact
  var STRIKE_RADIUS    = 8;      // blast radius
  var STRIKE_DAMAGE    = 500;
  var BEAM_WIDTH       = 0.3;
  var BEAM_HEIGHT      = 200;
  var BEAM_FALL_TIME   = 0.5;    // seconds beam drops from sky to ground
  var EXPLOSION_TIME   = 0.5;    // seconds explosion pulse expands
  var EXPLOSION_MAX_R  = 8;
  var SAT_PAN_SPEED    = 30;     // units/sec for WASD pan in sat view
  var FOV_MIN          = 5;
  var FOV_MAX          = 30;
  var FOV_DEFAULT      = 20;
  var FOV_SCROLL_STEP  = 2;

  /* ── module references ──────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;       // main game camera (save/restore on sat view)
  var _renderer = null;

  /* ── satellite orbital state ────────────────────────────────────────────── */
  var _satMesh = null;        // THREE.Group: cross of two boxes + solar panels
  var _satX    = -SAT_ORBIT_RANGE;
  var _satZ    = 0;

  /* ── timing state ──────────────────────────────────────────────────────── */
  var _passTimer  = 0;        // counts up to PASS_INTERVAL
  var _cooldown   = 0;        // cooldown remaining after use
  var _passAvail  = false;    // true when satellite is available
  var _inUse      = false;    // true while satellite view is open

  /* ── saved camera state (for restore after sat view) ────────────────────── */
  var _savedCamPos  = null;   // { x, y, z }
  var _savedCamQuat = null;   // THREE.Quaternion clone

  /* ── satellite view pan + zoom ──────────────────────────────────────────── */
  var _satFOV  = FOV_DEFAULT;
  var _satPanX = 0;
  var _satPanZ = 0;

  /* ── recon scan state ───────────────────────────────────────────────────── */
  var _taggedEnemies = [];    // array of { enemy, timer }

  /* ── strike targeting state ─────────────────────────────────────────────── */
  var _strikeMarker    = null;   // THREE.Group: red crosshair on ground
  var _strikeMarkerPos = null;   // { x, z }  — current marker world position
  var _strikeConfirmed = false;
  var _strikeTimer     = 0;
  var _strikeUsed      = false;  // only 1 strike per satellite pass
  var _strikeTarget    = null;   // { x, z } saved at confirm time

  /* ── rail gun beam + explosion animation ────────────────────────────────── */
  var _beam            = null;
  var _beamMat         = null;
  var _beamActive      = false;
  var _beamT           = 0;

  var _explosionMesh   = null;
  var _explosionMat    = null;
  var _explosionActive = false;
  var _explosionT      = 0;

  /* ── DOM elements ────────────────────────────────────────────────────────── */
  var _hudEl      = null;   // top-right status panel
  var _tagHudEl   = null;   // full-screen layer for red enemy squares
  var _darkenEl   = null;   // screen darkening overlay

  /* ── input state ─────────────────────────────────────────────────────────── */
  var _keysDown = {};

  /* ──────────────────────────────────────────────────────────────────────────
     AUDIO
     ────────────────────────────────────────────────────────────────────────── */
  function _getAudioCtx() {
    return window._audioCtx ||
      (window._audioCtx = new (window.AudioContext || window.webkitAudioContext)());
  }

  function _beep(freq, dur, vol) {
    try {
      var ctx  = _getAudioCtx();
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq || 880;
      gain.gain.setValueAtTime(vol || 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur || 0.2));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (dur || 0.2));
    } catch (e) { /* silent */ }
  }

  function _boomSound() {
    try {
      var ctx = _getAudioCtx();
      var buf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
      var d   = buf.getChannelData(0);
      var i;
      for (i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.35));
      }
      var src = ctx.createBufferSource();
      var lp  = ctx.createBiquadFilter();
      var gn  = ctx.createGain();
      lp.type = 'lowpass';
      lp.frequency.value = 180;
      gn.gain.value = 1.2;
      src.buffer = buf;
      src.connect(lp);
      lp.connect(gn);
      gn.connect(ctx.destination);
      src.start();
    } catch (e) { /* silent */ }
  }

  /* ──────────────────────────────────────────────────────────────────────────
     TOAST / HUD NOTIFICATIONS
     ────────────────────────────────────────────────────────────────────────── */
  function _toast(msg, color) {
    if (window.HUD && window.HUD.showToast) { window.HUD.showToast(msg); return; }
    if (window.HUD && window.HUD.notifyPickup) { window.HUD.notifyPickup(msg); return; }
    /* fallback inline toast */
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:40%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.82)',
      'color:' + (color || '#ffffff'),
      'font-family:monospace',
      'font-size:15px',
      'padding:8px 20px',
      'border-radius:4px',
      'z-index:99999',
      'pointer-events:none'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2500);
  }

  /* ──────────────────────────────────────────────────────────────────────────
     THREE.JS HELPER
     ────────────────────────────────────────────────────────────────────────── */
  function _T() { return window.THREE; }

  /* ──────────────────────────────────────────────────────────────────────────
     MESH BUILDERS
     ────────────────────────────────────────────────────────────────────────── */

  /* satellite: two box solar panels in a cross, plus a small body */
  function _buildSatMesh() {
    var T     = _T();
    var group = new T.Group();

    /* central body */
    var bodyGeo = new T.BoxGeometry(0.8, 0.4, 0.8);
    var bodyMat = new T.MeshLambertMaterial({ color: 0xaaaacc });
    var body    = new T.Mesh(bodyGeo, bodyMat);
    group.add(body);

    /* solar panel — extends along X axis */
    var pGeo = new T.BoxGeometry(3.5, 0.07, 1.0);
    var pMat = new T.MeshLambertMaterial({ color: 0x224488, emissive: 0x001133 });
    var pL   = new T.Mesh(pGeo, pMat);
    var pR   = new T.Mesh(pGeo, pMat);
    pL.position.set(-2.15, 0, 0);
    pR.position.set( 2.15, 0, 0);
    group.add(pL);
    group.add(pR);

    /* tiny glint light — visible from ground */
    var glint = new T.PointLight(0xffffff, 1.5, 60);
    glint.position.set(0, 0, 0);
    group.add(glint);

    return group;
  }

  /* red crosshair strike marker at ground level */
  function _buildStrikeMarker() {
    var T     = _T();
    var group = new T.Group();
    var mat   = new T.MeshBasicMaterial({ color: 0xff0000, side: T.DoubleSide });

    /* horizontal bar */
    var hMesh = new T.Mesh(new T.BoxGeometry(4, 0.05, 0.15), mat);
    hMesh.position.y = 0.04;
    group.add(hMesh);

    /* vertical bar */
    var vMesh = new T.Mesh(new T.BoxGeometry(0.15, 0.05, 4), mat);
    vMesh.position.y = 0.04;
    group.add(vMesh);

    /* outer ring */
    var ring = new T.Mesh(new T.TorusGeometry(0.9, 0.07, 8, 24), mat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.04;
    group.add(ring);

    /* pulsing point light */
    var light = new T.PointLight(0xff2200, 2, 14);
    light.position.y = 1;
    group.add(light);
    group._light = light;   // expose for animation

    return group;
  }

  /* ──────────────────────────────────────────────────────────────────────────
     MARKER MANAGEMENT
     ────────────────────────────────────────────────────────────────────────── */
  function _removeStrikeMarker() {
    if (_strikeMarker && _scene) {
      _scene.remove(_strikeMarker);
    }
    _strikeMarker    = null;
    _strikeMarkerPos = null;
  }

  function _placeStrikeMarker() {
    if (!_scene) return;
    _removeStrikeMarker();

    _strikeMarkerPos = { x: _satPanX, z: _satPanZ };
    _strikeMarker    = _buildStrikeMarker();
    _strikeMarker.position.set(_satPanX, 0.01, _satPanZ);
    _scene.add(_strikeMarker);

    _beep(440, 0.15, 0.2);
    _beep(660, 0.10, 0.15);
    _toast('[SAT] Strike marker placed — press Enter to confirm', '#ff4400');
  }

  /* ──────────────────────────────────────────────────────────────────────────
     JAMMING CHECK
     ────────────────────────────────────────────────────────────────────────── */
  function _isJammed() {
    if (window._ewJammerActive) return true;
    if (window.CyberWarfare && typeof window.CyberWarfare.isJamming === 'function') {
      if (window.CyberWarfare.isJamming()) return true;
    }
    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    var i;
    for (i = 0; i < enemies.length; i++) {
      if (enemies[i] && enemies[i]._isJamming) return true;
    }
    return false;
  }

  /* ──────────────────────────────────────────────────────────────────────────
     SAT VIEW OPEN / CLOSE
     ────────────────────────────────────────────────────────────────────────── */
  function _openSatView() {
    if (_inUse) return;

    if (!_passAvail) {
      if (_cooldown > 0) {
        _toast('[SAT] COOLDOWN: ' + Math.ceil(_cooldown) + 's', '#ff8800');
      } else {
        _toast('[SAT] SAT UPLINK: ' + Math.ceil(PASS_INTERVAL - _passTimer) + 's', '#ffaa00');
      }
      return;
    }

    if (_isJammed()) {
      _toast('[SAT] SIGNAL JAMMED', '#ff0000');
      _beep(200, 0.5, 0.2);
      return;
    }

    _inUse = true;

    /* save main camera transform */
    var T = _T();
    _savedCamPos  = {
      x: _camera.position.x,
      y: _camera.position.y,
      z: _camera.position.z
    };
    _savedCamQuat = _camera.quaternion.clone();

    /* centre sat pan view above player current position */
    _satPanX = _camera.position.x;
    _satPanZ = _camera.position.z;

    /* apply bird's-eye transform to the main camera (renderer uses _camera) */
    _camera.fov = _satFOV;
    _camera.updateProjectionMatrix();
    _camera.position.set(_satPanX, CAM_HEIGHT, _satPanZ);
    _camera.lookAt(_satPanX, 0, _satPanZ);

    /* darken screen */
    if (_darkenEl) _darkenEl.style.display = 'block';

    _updateHUD();
    _toast('[SAT] ORBITAL VIEW — WASD:pan  Scroll:zoom  E:scan  F:target  Shift+S:exit', '#00ffcc');
    _beep(880, 0.10, 0.15);
    _beep(1100, 0.12, 0.12);
  }

  function _closeSatView() {
    if (!_inUse) return;
    _inUse = false;

    /* restore main camera transform */
    if (_savedCamPos) {
      _camera.position.set(_savedCamPos.x, _savedCamPos.y, _savedCamPos.z);
    }
    if (_savedCamQuat) {
      _camera.quaternion.copy(_savedCamQuat);
    }
    /* restore original FOV */
    _camera.fov = 75;   /* standard FPS FOV; adjust if game exposes a variable */
    _camera.updateProjectionMatrix();

    _savedCamPos  = null;
    _savedCamQuat = null;

    /* un-darken */
    if (_darkenEl) _darkenEl.style.display = 'none';

    /* drop unconfirmed marker */
    if (!_strikeConfirmed) {
      _removeStrikeMarker();
    }

    _updateHUD();
    _beep(440, 0.12, 0.10);
  }

  /* ──────────────────────────────────────────────────────────────────────────
     RECON SCAN (E)
     ────────────────────────────────────────────────────────────────────────── */
  function _doReconScan() {
    if (!_inUse) return;

    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    var tagged  = 0;
    var i;

    /* reset tag list */
    _taggedEnemies = [];

    for (i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en || en.dead || en.alive === false) continue;
      en._satTagged   = true;
      en._satTagTimer = TAG_DURATION;
      _taggedEnemies.push({ enemy: en, timer: TAG_DURATION });
      tagged++;
    }

    _updateTagHUD();
    _toast('[SAT] RECON SCAN — ' + tagged + ' enemies TAGGED for ' + TAG_DURATION + 's', '#00ffcc');
    _beep(660, 0.15, 0.15);
    _beep(880, 0.15, 0.12);
    _beep(1100, 0.20, 0.10);
  }

  /* ──────────────────────────────────────────────────────────────────────────
     STRIKE CONFIRMATION (Enter)
     ────────────────────────────────────────────────────────────────────────── */
  function _confirmStrike() {
    if (!_strikeMarkerPos) {
      _toast('[SAT] No strike marker — press F first', '#ffaa00');
      return;
    }
    if (_strikeUsed) {
      _toast('[SAT] Strike already used this pass', '#ffaa00');
      return;
    }

    /* save target position BEFORE closing view (which clears marker) */
    _strikeTarget    = { x: _strikeMarkerPos.x, z: _strikeMarkerPos.z };
    _strikeConfirmed = true;
    _strikeUsed      = true;
    _strikeTimer     = STRIKE_DELAY;

    _toast('[SAT] RAIL-GUN INBOUND — ' + STRIKE_DELAY + 's', '#ff4400');
    _beep(220, 0.8, 0.3);

    /* satellite goes on cooldown immediately after use */
    _passAvail = false;
    _passTimer = 0;
    _cooldown  = COOLDOWN_AFTER;

    _closeSatView();
  }

  /* ──────────────────────────────────────────────────────────────────────────
     RAIL-GUN BEAM SPAWN / ANIMATION
     ────────────────────────────────────────────────────────────────────────── */
  function _spawnBeam(pos) {
    var T       = _T();
    var beamGeo = new T.BoxGeometry(BEAM_WIDTH, BEAM_HEIGHT, BEAM_WIDTH);
    _beamMat    = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1.0 });
    _beam       = new T.Mesh(beamGeo, _beamMat);

    /* beam starts with its top at Y=200; center is at Y = 200 - BEAM_HEIGHT/2 */
    _beam.position.set(pos.x, 200 - BEAM_HEIGHT / 2, pos.z);
    _scene.add(_beam);
    _beamActive = true;
    _beamT      = 0;
  }

  function _updateBeam(delta) {
    if (!_beamActive || !_beam) return;
    _beamT += delta;
    var progress = _beamT / BEAM_FALL_TIME;
    if (progress > 1) progress = 1;

    /* beam centre falls from (200 - H/2) to (0 - H/2) */
    var startY = 200 - BEAM_HEIGHT / 2;
    var endY   = 0   - BEAM_HEIGHT / 2;
    _beam.position.y = startY + (endY - startY) * progress;
    _beamMat.opacity = 1.0 - progress * 0.3;

    if (_beamT >= BEAM_FALL_TIME) {
      _beamActive = false;
      if (_scene) _scene.remove(_beam);
      if (_beam.geometry) _beam.geometry.dispose();
      if (_beamMat) _beamMat.dispose();
      _beam    = null;
      _beamMat = null;

      /* trigger explosion at impact site */
      if (_strikeTarget) {
        _spawnExplosion(_strikeTarget);
        _applyStrikeDamage(_strikeTarget);
      }
    }
  }

  /* ──────────────────────────────────────────────────────────────────────────
     EXPLOSION PULSE
     ────────────────────────────────────────────────────────────────────────── */
  function _spawnExplosion(pos) {
    var T        = _T();
    var expGeo   = new T.SphereGeometry(1, 12, 8);
    _explosionMat  = new T.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.9 });
    _explosionMesh = new T.Mesh(expGeo, _explosionMat);
    _explosionMesh.position.set(pos.x, 0, pos.z);
    _scene.add(_explosionMesh);

    /* brief flash point light */
    var flash = new T.PointLight(0xff6600, 22, 35);
    flash.position.set(pos.x, 1, pos.z);
    _scene.add(flash);
    setTimeout(function () {
      if (_scene) _scene.remove(flash);
      if (flash.dispose) flash.dispose();
    }, 700);

    _explosionActive = true;
    _explosionT      = 0;
  }

  function _updateExplosion(delta) {
    if (!_explosionActive || !_explosionMesh) return;
    _explosionT += delta;
    var progress = _explosionT / EXPLOSION_TIME;
    if (progress > 1) progress = 1;

    /* radius grows from 0 to EXPLOSION_MAX_R */
    var r = EXPLOSION_MAX_R * progress;
    _explosionMesh.scale.setScalar(r > 0 ? r : 0.01);
    _explosionMat.opacity = 0.9 * (1 - progress);

    if (_explosionT >= EXPLOSION_TIME) {
      _explosionActive = false;
      if (_scene) _scene.remove(_explosionMesh);
      if (_explosionMesh.geometry) _explosionMesh.geometry.dispose();
      if (_explosionMat) _explosionMat.dispose();
      _explosionMesh = null;
      _explosionMat  = null;
    }
  }

  /* ──────────────────────────────────────────────────────────────────────────
     STRIKE DAMAGE
     ────────────────────────────────────────────────────────────────────────── */
  function _applyStrikeDamage(pos) {
    _boomSound();
    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    var kills   = 0;
    var i;
    for (i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en || en.dead || en.alive === false) continue;
      var ep = en.position || (en.mesh && en.mesh.position);
      if (!ep) continue;
      var dx = ep.x - pos.x;
      var dz = ep.z - pos.z;
      if (Math.sqrt(dx * dx + dz * dz) <= STRIKE_RADIUS) {
        var wasDead = en.dead || en.alive === false;
        if (en.takeDamage) {
          en.takeDamage(STRIKE_DAMAGE);
        } else if (en.health !== undefined) {
          en.health -= STRIKE_DAMAGE;
          if (en.health <= 0) en.dead = true;
        }
        var isDead = en.dead || en.alive === false ||
                     (en.health !== undefined && en.health <= 0);
        if (!wasDead && isDead) kills++;
      }
    }
    if (kills > 0) {
      _toast('[SAT] RAIL-GUN IMPACT — ' + kills + ' ELIMINATED', '#ff4400');
    } else {
      _toast('[SAT] RAIL-GUN IMPACT', '#ff6600');
    }
  }

  /* ──────────────────────────────────────────────────────────────────────────
     HUD
     ────────────────────────────────────────────────────────────────────────── */
  function _buildHUD() {
    /* top-right status panel */
    _hudEl = document.createElement('div');
    _hudEl.id = 'recon-sat-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'right:12px',
      'background:rgba(0,0,0,0.72)',
      'border:1px solid #336655',
      'color:#00ffcc',
      'font-family:monospace',
      'font-size:12px',
      'padding:5px 10px',
      'border-radius:3px',
      'z-index:500',
      'pointer-events:none',
      'letter-spacing:1px',
      'min-width:190px',
      'text-align:right'
    ].join(';');
    document.body.appendChild(_hudEl);

    /* full-screen layer for red tagged-enemy squares */
    _tagHudEl = document.createElement('div');
    _tagHudEl.id = 'recon-sat-tags';
    _tagHudEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:490'
    ].join(';');
    document.body.appendChild(_tagHudEl);

    /* screen darkening overlay active during sat view */
    _darkenEl = document.createElement('div');
    _darkenEl.id = 'recon-sat-darken';
    _darkenEl.style.cssText = [
      'position:fixed',
      'top:0', 'left:0',
      'width:100%', 'height:100%',
      'background:rgba(0,0,0,0.55)',
      'pointer-events:none',
      'z-index:480',
      'display:none'
    ].join(';');
    document.body.appendChild(_darkenEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var txt;
    var color;
    if (_inUse) {
      txt   = '🛰 SAT IN USE';
      color = '#00ffcc';
    } else if (_cooldown > 0) {
      txt   = '🛰 COOLDOWN: ' + Math.ceil(_cooldown) + 's';
      color = '#ff8800';
    } else if (_passAvail) {
      txt   = '🛰 SAT READY';
      color = '#00ff44';
    } else {
      var remaining = Math.ceil(PASS_INTERVAL - _passTimer);
      txt   = '🛰 SAT PASS IN: ' + remaining + 's';
      color = '#00ffcc';
    }
    _hudEl.style.color = color;
    _hudEl.innerHTML   = txt;
  }

  /* update red squares on tagged enemies in normal view */
  function _updateTagHUD() {
    if (!_tagHudEl) return;
    _tagHudEl.innerHTML = '';

    if (_inUse) return;     /* don't draw in sat view */

    var i;
    var T = _T();
    for (i = 0; i < _taggedEnemies.length; i++) {
      var entry = _taggedEnemies[i];
      if (!entry.enemy || entry.enemy.dead || entry.enemy.alive === false) continue;
      if (entry.timer <= 0) continue;

      var ep = entry.enemy.position || (entry.enemy.mesh && entry.enemy.mesh.position);
      if (!ep) continue;

      var vec = new T.Vector3(ep.x, (ep.y || 0) + 1, ep.z);
      vec.project(_camera);

      /* behind camera — skip */
      if (vec.z > 1) continue;

      var sx = Math.round((vec.x * 0.5 + 0.5) * window.innerWidth);
      var sy = Math.round((-vec.y * 0.5 + 0.5) * window.innerHeight);

      if (sx < -30 || sx > window.innerWidth + 30) continue;
      if (sy < -30 || sy > window.innerHeight + 30) continue;

      var sq = document.createElement('div');
      sq.style.cssText = [
        'position:absolute',
        'width:14px',
        'height:14px',
        'border:2px solid #ff0000',
        'background:rgba(255,0,0,0.18)',
        'left:' + (sx - 7) + 'px',
        'top:'  + (sy - 7) + 'px',
        'pointer-events:none'
      ].join(';');
      _tagHudEl.appendChild(sq);
    }
  }

  /* ──────────────────────────────────────────────────────────────────────────
     INPUT HANDLERS
     ────────────────────────────────────────────────────────────────────────── */
  function _onKeyDown(e) {
    _keysDown[e.code] = true;

    /* Shift+S — toggle sat view */
    if (e.code === 'KeyS' && (e.shiftKey)) {
      e.preventDefault();
      if (_inUse) { _closeSatView(); } else { _openSatView(); }
      return;
    }

    if (!_inUse) return;

    /* E — recon scan */
    if (e.code === 'KeyE') {
      e.preventDefault();
      _doReconScan();
      return;
    }

    /* F — place strike marker */
    if (e.code === 'KeyF') {
      e.preventDefault();
      if (_strikeUsed) {
        _toast('[SAT] Strike already used this pass', '#ffaa00');
        return;
      }
      _placeStrikeMarker();
      return;
    }

    /* Enter — confirm strike */
    if (e.code === 'Enter') {
      e.preventDefault();
      _confirmStrike();
      return;
    }
  }

  function _onKeyUp(e) {
    _keysDown[e.code] = false;
  }

  /* mouse wheel: zoom FOV while in sat view */
  function _onWheel(e) {
    if (!_inUse) return;
    e.preventDefault();
    var step = (e.deltaY > 0) ? FOV_SCROLL_STEP : -FOV_SCROLL_STEP;
    _satFOV = _satFOV + step;
    if (_satFOV < FOV_MIN) _satFOV = FOV_MIN;
    if (_satFOV > FOV_MAX) _satFOV = FOV_MAX;
    _camera.fov = _satFOV;
    _camera.updateProjectionMatrix();
  }

  /* ──────────────────────────────────────────────────────────────────────────
     UPDATE SUB-FUNCTIONS
     ────────────────────────────────────────────────────────────────────────── */

  function _updateSatOrbit(delta) {
    if (!_satMesh) return;
    _satX += SAT_ORBIT_SPEED * delta;
    if (_satX > SAT_ORBIT_RANGE) _satX = -SAT_ORBIT_RANGE;
    _satMesh.position.set(_satX, SAT_HEIGHT, _satZ);
    _satMesh.rotation.y += delta * 0.3;
  }

  function _updateSatPan(delta) {
    if (!_inUse) return;
    var moved = false;

    if (_keysDown['KeyW'] || _keysDown['ArrowUp']) {
      _satPanZ -= SAT_PAN_SPEED * delta;
      moved = true;
    }
    /* S without Shift only (Shift+S is toggle) */
    if (_keysDown['KeyS'] && !_keysDown['ShiftLeft'] && !_keysDown['ShiftRight']) {
      _satPanZ += SAT_PAN_SPEED * delta;
      moved = true;
    }
    if (_keysDown['KeyA'] || _keysDown['ArrowLeft']) {
      _satPanX -= SAT_PAN_SPEED * delta;
      moved = true;
    }
    if (_keysDown['KeyD'] || _keysDown['ArrowRight']) {
      _satPanX += SAT_PAN_SPEED * delta;
      moved = true;
    }

    if (moved) {
      _camera.position.set(_satPanX, CAM_HEIGHT, _satPanZ);
      _camera.lookAt(_satPanX, 0, _satPanZ);
    }
  }

  function _updatePassTimer(delta) {
    if (_cooldown > 0) {
      _cooldown -= delta;
      if (_cooldown < 0) _cooldown = 0;
      _passAvail = false;
      _passTimer = 0;
      return;
    }
    if (!_passAvail) {
      _passTimer += delta;
      if (_passTimer >= PASS_INTERVAL) {
        _passAvail = true;
        _toast('[SAT] SAT READY — press Shift+S for orbital view', '#00ff44');
        _beep(660, 0.20, 0.15);
        _beep(880, 0.25, 0.12);
      }
    }
  }

  function _updateStrikeCountdown(delta) {
    if (!_strikeConfirmed) return;
    _strikeTimer -= delta;

    /* pulse the marker light while counting down */
    if (_strikeMarker && _strikeMarker._light) {
      var pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.009);
      _strikeMarker._light.intensity = pulse * 4;
    }

    if (_strikeTimer <= 0) {
      _strikeConfirmed = false;
      /* remove marker */
      _removeStrikeMarker();
      /* fire the beam */
      if (_strikeTarget && _scene) {
        _spawnBeam(_strikeTarget);
      }
    }
  }

  function _updateTags(delta) {
    var i;
    var changed = false;
    for (i = _taggedEnemies.length - 1; i >= 0; i--) {
      var entry = _taggedEnemies[i];
      entry.timer -= delta;
      if (entry.enemy) entry.enemy._satTagTimer = entry.timer;
      if (entry.timer <= 0) {
        if (entry.enemy) {
          entry.enemy._satTagged   = false;
          entry.enemy._satTagTimer = 0;
        }
        _taggedEnemies.splice(i, 1);
        changed = true;
      }
    }
    if (changed || _taggedEnemies.length > 0) {
      _updateTagHUD();
    }
  }

  /* ──────────────────────────────────────────────────────────────────────────
     PUBLIC API
     ────────────────────────────────────────────────────────────────────────── */

  function init(scene, camera, renderer) {
    _scene    = scene    || window._gameScene || null;
    _camera   = camera   || window._camera    || null;
    _renderer = renderer || window._renderer  || null;

    var T = _T();

    /* spawn satellite mesh in scene */
    if (_scene && T) {
      _satMesh = _buildSatMesh();
      _satMesh.position.set(_satX, SAT_HEIGHT, _satZ);
      _scene.add(_satMesh);
    }

    /* build HUD elements */
    _buildHUD();
    _updateHUD();

    /* register input listeners */
    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keyup',   _onKeyUp,   false);
    document.addEventListener('wheel',   _onWheel,   { passive: false });
  }

  function update(delta) {
    if (!delta || delta <= 0) return;

    _updateSatOrbit(delta);
    _updatePassTimer(delta);
    _updateSatPan(delta);
    _updateStrikeCountdown(delta);
    _updateBeam(delta);
    _updateExplosion(delta);
    _updateTags(delta);
    _updateHUD();
  }

  function reset() {
    /* close sat view first */
    if (_inUse) _closeSatView();

    /* remove satellite mesh */
    if (_satMesh && _scene) _scene.remove(_satMesh);
    _satMesh = null;
    _satX    = -SAT_ORBIT_RANGE;

    /* remove strike marker */
    _removeStrikeMarker();
    _strikeTarget    = null;
    _strikeConfirmed = false;
    _strikeTimer     = 0;
    _strikeUsed      = false;

    /* remove beam */
    if (_beam && _scene) {
      _scene.remove(_beam);
      if (_beam.geometry) _beam.geometry.dispose();
      if (_beamMat) _beamMat.dispose();
    }
    _beam       = null;
    _beamMat    = null;
    _beamActive = false;
    _beamT      = 0;

    /* remove explosion */
    if (_explosionMesh && _scene) {
      _scene.remove(_explosionMesh);
      if (_explosionMesh.geometry) _explosionMesh.geometry.dispose();
      if (_explosionMat) _explosionMat.dispose();
    }
    _explosionMesh   = null;
    _explosionMat    = null;
    _explosionActive = false;
    _explosionT      = 0;

    /* timers */
    _passTimer = 0;
    _passAvail = false;
    _cooldown  = 0;

    /* clear tags */
    var i;
    for (i = 0; i < _taggedEnemies.length; i++) {
      var en = _taggedEnemies[i].enemy;
      if (en) { en._satTagged = false; en._satTagTimer = 0; }
    }
    _taggedEnemies = [];

    /* reset pan / FOV */
    _satFOV  = FOV_DEFAULT;
    _satPanX = 0;
    _satPanZ = 0;
    _keysDown = {};

    if (_tagHudEl) _tagHudEl.innerHTML = '';
    _updateHUD();
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();
