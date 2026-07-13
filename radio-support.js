// radio-support.js — Radio Support radial menu (Artillery, Extraction, Recon, Airstrike)
// Key: R (already wired in game-manager.js line 2497)
// All var — no let/const. IIFE pattern.

window.RadioSupport = (function () {
  'use strict';

  // ── State ────────────────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;
  var _menuOpen = false;
  var _menuEl = null;
  var _backdropEl = null;
  var _targetingMode = false;  // airstrike target selection
  var _targetCursorEl = null;
  var _reconOverlayEl = null;
  var _reconMarkers = [];      // DOM elements for enemy highlight circles
  var _reconTimer = 0;
  var _vfx = [];               // active VFX objects

  // Cooldowns in seconds (countdown to 0 = ready)
  var _cooldowns = {
    artillery: 0,
    extraction: 0,
    recon: 0,
    airstrike: 0
  };

  var COOLDOWN_TIMES = {
    artillery: 45,
    extraction: 120,
    recon: 30,
    airstrike: 90
  };

  var COSTS = {
    artillery: 500,
    extraction: 0,
    recon: 200,
    airstrike: 1000
  };

  // ── Score helpers ─────────────────────────────────────────────────────
  function _getScore() {
    if (window._player && typeof window._player.score === 'number') return window._player.score;
    if (window.player && typeof window.player.score === 'number') return window.player.score;
    return 0;
  }

  function _deductScore(amount) {
    if (amount <= 0) return;
    if (window._player && typeof window._player.score === 'number') {
      window._player.score = Math.max(0, window._player.score - amount);
    } else if (window.player && typeof window.player.score === 'number') {
      window.player.score = Math.max(0, window.player.score - amount);
    }
  }

  function _getPlayerPos() {
    if (window._player && window._player.position) return window._player.position;
    if (window.GameManager && window.GameManager.getPlayerPosition) return window.GameManager.getPlayerPosition();
    if (typeof player !== 'undefined' && player.position) return player.position;
    return { x: 0, y: 0, z: 0 };
  }

  // ── Toast / HUD notification ──────────────────────────────────────────
  function _toast(text, color) {
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup(text, color || '#ff8800');
    }
  }

  function _showHUDMessage(text, color, durationMs) {
    var el = document.getElementById('radio-hud-msg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'radio-hud-msg';
      el.style.cssText = [
        'position:fixed',
        'top:18%',
        'left:50%',
        'transform:translateX(-50%)',
        'color:#fff',
        'font-family:monospace',
        'font-size:16px',
        'font-weight:bold',
        'text-shadow:0 0 8px #000,0 0 16px #000',
        'pointer-events:none',
        'z-index:600',
        'white-space:nowrap',
        'text-align:center'
      ].join(';');
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.color = color || '#fff';
    el.style.display = 'block';
    if (el._hideTimeout) clearTimeout(el._hideTimeout);
    el._hideTimeout = setTimeout(function () {
      el.style.display = 'none';
    }, durationMs || 3000);
  }

  // ── Audio helpers ─────────────────────────────────────────────────────
  function _playWhistle() {
    // High-pitched descending oscillator — incoming shell whistle
    try {
      var ctx = window._audioCtx;
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 1.0);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.0);
    } catch (e) { /* no audio */ }
  }

  function _playJetFlyby() {
    // Oscillator sweep 800→200Hz — jet passing overhead
    try {
      var ctx = window._audioCtx;
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 1.8);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.45, ctx.currentTime + 0.3);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.8);
    } catch (e) { /* no audio */ }
  }

  function _playRadioBeep() {
    try {
      var ctx = window._audioCtx;
      if (!ctx) return;
      for (var i = 0; i < 2; i++) {
        (function (idx) {
          var t = ctx.currentTime + idx * 0.18;
          var osc = ctx.createOscillator();
          var g = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(880, t);
          g.gain.setValueAtTime(0.2, t);
          g.gain.setValueAtTime(0, t + 0.12);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.12);
        })(i);
      }
    } catch (e) { /* no audio */ }
  }

  // ── VFX helpers ───────────────────────────────────────────────────────
  function _spawnExplosion(x, y, z, radius, isLarge) {
    if (!_scene) return;
    var sphereGeo = new THREE.SphereGeometry(0.4, 8, 8);
    var sphereMat = new THREE.MeshBasicMaterial({ color: isLarge ? 0xff4400 : 0xff6600, transparent: true, opacity: 1 });
    var sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(x, y + 0.3, z);
    _scene.add(sphere);

    // Smoke column — gray sphere expanding upward
    var smokeGeo = new THREE.SphereGeometry(0.3, 6, 6);
    var smokeMat = new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.7, depthWrite: false });
    var smoke = new THREE.Mesh(smokeGeo, smokeMat);
    smoke.position.set(x, y + 1, z);
    _scene.add(smoke);

    // Shockwave ring (flat torus)
    var waveGeo = new THREE.TorusGeometry(0.1, 0.05, 4, 16);
    var waveMat = new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.8 });
    var wave = new THREE.Mesh(waveGeo, waveMat);
    wave.rotation.x = -Math.PI / 2;
    wave.position.set(x, y + 0.1, z);
    _scene.add(wave);

    var light = new THREE.PointLight(0xffaa00, isLarge ? 18 : 12, isLarge ? 24 : 16);
    light.position.set(x, y + 1, z);
    _scene.add(light);

    var expandTo = isLarge ? (radius || 6) : (radius || 3.5);
    _vfx.push({
      type: 'explosion',
      sphere: sphere, sphereGeo: sphereGeo, sphereMat: sphereMat,
      smoke: smoke, smokeGeo: smokeGeo, smokeMat: smokeMat,
      wave: wave, waveGeo: waveGeo, waveMat: waveMat,
      light: light,
      elapsed: 0, duration: isLarge ? 0.7 : 0.45,
      expandTo: expandTo
    });
  }

  function _spawnGreenSmoke(x, y, z) {
    // Green glowing cylinder — extraction smoke grenade
    if (!_scene) return;
    var cylGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.4, 8);
    var cylMat = new THREE.MeshBasicMaterial({ color: 0x00ff44 });
    var cyl = new THREE.Mesh(cylGeo, cylMat);
    cyl.position.set(x, y + 0.2, z);
    _scene.add(cyl);

    var smokeGeo = new THREE.SphereGeometry(0.4, 8, 8);
    var smokeMat = new THREE.MeshBasicMaterial({ color: 0x00cc44, transparent: true, opacity: 0.8, depthWrite: false });
    var smoke = new THREE.Mesh(smokeGeo, smokeMat);
    smoke.position.set(x, y + 0.8, z);
    _scene.add(smoke);

    var light = new THREE.PointLight(0x00ff44, 4, 8);
    light.position.set(x, y + 1, z);
    _scene.add(light);

    _vfx.push({
      type: 'greensmoke',
      cyl: cyl, cylGeo: cylGeo, cylMat: cylMat,
      smoke: smoke, smokeGeo: smokeGeo, smokeMat: smokeMat,
      light: light,
      elapsed: 0, duration: 12.0
    });
  }

  // ── AoE damage enemies in radius ──────────────────────────────────────
  function _damageInRadius(cx, cy, cz, radius, damage) {
    if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
    var all = Enemies.getAll();
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e || !e.alive || !e.mesh) continue;
      var dx = e.mesh.position.x - cx;
      var dy = e.mesh.position.y - cy;
      var dz = e.mesh.position.z - cz;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist <= radius) {
        if (typeof Enemies.damage === 'function') {
          Enemies.damage(e, damage);
        }
      }
    }
    if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
      CameraSystem.shake(0.1, 0.5);
    }
  }

  // ── 1. ARTILLERY BARRAGE ──────────────────────────────────────────────
  function _executeArtillery() {
    var pp = _getPlayerPos();
    var shells = 5;
    _toast('ARTILLERY INBOUND — 3 SECONDS', '#ffcc00');
    setTimeout(function () {
      for (var i = 0; i < shells; i++) {
        (function (idx) {
          setTimeout(function () {
            _playWhistle();
            setTimeout(function () {
              // Random point 4-15 units from player (min 4 to avoid self)
              var angle = Math.random() * Math.PI * 2;
              var dist = 4 + Math.random() * 11;
              var ix = pp.x + Math.cos(angle) * dist;
              var iz = pp.z + Math.sin(angle) * dist;
              var iy = (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight)
                ? VoxelWorld.getTerrainHeight(ix, iz) : pp.y;
              _spawnExplosion(ix, iy, iz, 3.5, false);
              _damageInRadius(ix, iy, iz, 4, 80);
              if (typeof window.AudioSystem !== 'undefined' && window.AudioSystem.playMortarFire) {
                window.AudioSystem.playMortarFire();
              } else if (typeof window.AudioSystem !== 'undefined' && window.AudioSystem.playExplosion) {
                window.AudioSystem.playExplosion();
              }
            }, 900);
          })(i * 400);
        })(i);
      }
    }, 3000);
  }

  // ── 2. EXTRACTION POINT ───────────────────────────────────────────────
  function _executeExtraction() {
    var pp = _getPlayerPos();
    var iy = (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight)
      ? VoxelWorld.getTerrainHeight(pp.x, pp.z) : pp.y;
    _playRadioBeep();
    _spawnGreenSmoke(pp.x, iy, pp.z);
    _showHUDMessage('EXTRACTION REQUESTED — Hold position', '#00ff88', 10000);
    setTimeout(function () {
      _showHUDMessage('EXTRACTION CANCELLED — Secure the area first', '#ff6600', 5000);
    }, 10000);
  }

  // ── 3. RECON REPORT ───────────────────────────────────────────────────
  function _executeRecon() {
    _playRadioBeep();
    _toast('SATELLITE FEED ACTIVE', '#44aaff');
    _showReconOverlay();
    _reconTimer = 15;
    _updateReconMarkers();
  }

  function _showReconOverlay() {
    if (!_reconOverlayEl) {
      _reconOverlayEl = document.createElement('div');
      _reconOverlayEl.id = 'radio-recon-overlay';
      _reconOverlayEl.style.cssText = [
        'position:fixed',
        'top:0', 'left:0', 'width:100%', 'height:100%',
        'pointer-events:none',
        'z-index:550',
        'display:none'
      ].join(';');
      // Static/scanline noise effect
      _reconOverlayEl.innerHTML =
        '<div style="position:absolute;top:8px;left:50%;transform:translateX(-50%);' +
        'color:#44aaff;font-family:monospace;font-size:14px;font-weight:bold;' +
        'text-shadow:0 0 8px #44aaff;letter-spacing:3px;background:rgba(0,0,50,0.5);' +
        'padding:4px 16px;border:1px solid #44aaff;">SATELLITE FEED ACTIVE</div>';
      document.body.appendChild(_reconOverlayEl);
    }
    _reconOverlayEl.style.display = 'block';
  }

  function _hideReconOverlay() {
    if (_reconOverlayEl) _reconOverlayEl.style.display = 'none';
    _clearReconMarkers();
  }

  function _clearReconMarkers() {
    for (var i = 0; i < _reconMarkers.length; i++) {
      if (_reconMarkers[i] && _reconMarkers[i].parentNode) {
        _reconMarkers[i].parentNode.removeChild(_reconMarkers[i]);
      }
    }
    _reconMarkers = [];
  }

  function _worldToScreen(pos3d) {
    // Project 3D world position to 2D screen coordinates
    if (!_camera) return null;
    var vec = new THREE.Vector3(pos3d.x, pos3d.y, pos3d.z);
    vec.project(_camera);
    if (vec.z > 1) return null; // behind camera
    return {
      x: (vec.x * 0.5 + 0.5) * window.innerWidth,
      y: (-vec.y * 0.5 + 0.5) * window.innerHeight
    };
  }

  function _updateReconMarkers() {
    _clearReconMarkers();
    if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
    var all = Enemies.getAll();
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e || !e.alive || !e.mesh) continue;
      var screen = _worldToScreen(e.mesh.position);
      if (!screen) continue;
      var marker = document.createElement('div');
      marker.style.cssText = [
        'position:fixed',
        'left:' + (screen.x - 18) + 'px',
        'top:' + (screen.y - 18) + 'px',
        'width:36px', 'height:36px',
        'border:2px solid #ffff00',
        'border-radius:50%',
        'pointer-events:none',
        'z-index:555',
        'box-shadow:0 0 8px #ffff00'
      ].join(';');
      document.body.appendChild(marker);
      _reconMarkers.push(marker);
    }
  }

  // ── 4. AIRSTRIKE (SINGLE) ─────────────────────────────────────────────
  function _startAirstrikeTargeting() {
    _targetingMode = true;
    if (!_targetCursorEl) {
      _targetCursorEl = document.createElement('div');
      _targetCursorEl.id = 'radio-airstrike-cursor';
      _targetCursorEl.style.cssText = [
        'position:fixed',
        'top:50%', 'left:50%',
        'transform:translate(-50%,-50%)',
        'width:60px', 'height:60px',
        'pointer-events:none',
        'z-index:700',
        'display:none'
      ].join(';');
      _targetCursorEl.innerHTML =
        '<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="30" cy="30" r="26" fill="none" stroke="#ff2200" stroke-width="2"/>' +
        '<circle cx="30" cy="30" r="4" fill="#ff2200"/>' +
        '<line x1="30" y1="0" x2="30" y2="20" stroke="#ff2200" stroke-width="1.5"/>' +
        '<line x1="30" y1="40" x2="30" y2="60" stroke="#ff2200" stroke-width="1.5"/>' +
        '<line x1="0" y1="30" x2="20" y2="30" stroke="#ff2200" stroke-width="1.5"/>' +
        '<line x1="40" y1="30" x2="60" y2="30" stroke="#ff2200" stroke-width="1.5"/>' +
        '</svg>';
      document.body.appendChild(_targetCursorEl);
    }
    _targetCursorEl.style.display = 'block';
    _showHUDMessage('AIRSTRIKE — CLICK TO CONFIRM TARGET', '#ff2200', 20000);
  }

  function _cancelAirstrikeTargeting() {
    _targetingMode = false;
    if (_targetCursorEl) _targetCursorEl.style.display = 'none';
    var msgEl = document.getElementById('radio-hud-msg');
    if (msgEl) msgEl.style.display = 'none';
  }

  function _executeAirstrike(tx, ty, tz) {
    _targetingMode = false;
    if (_targetCursorEl) _targetCursorEl.style.display = 'none';
    _toast('AIRSTRIKE INBOUND', '#ff2200');
    setTimeout(function () {
      _playJetFlyby();
      setTimeout(function () {
        _spawnExplosion(tx, ty, tz, 6, true);
        _damageInRadius(tx, ty, tz, 6, 150);
        if (typeof window.AudioSystem !== 'undefined' && window.AudioSystem.playExplosion) {
          window.AudioSystem.playExplosion();
        }
      }, 200);
    }, 2000);
  }

  // ── Click handler for airstrike targeting ────────────────────────────
  function _onDocClick(e) {
    if (!_targetingMode) return;
    // Cast ray from screen center to world
    if (!_camera || !_scene) {
      _cancelAirstrikeTargeting();
      return;
    }
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), _camera);
    var pp = _getPlayerPos();
    var groundY = (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight)
      ? VoxelWorld.getTerrainHeight(pp.x, pp.z) : pp.y;
    // Intersect with a large horizontal plane at ground level
    var plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -groundY);
    var target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);
    if (!target) {
      target.set(pp.x + raycaster.ray.direction.x * 30, groundY, pp.z + raycaster.ray.direction.z * 30);
    }
    _executeAirstrike(target.x, groundY, target.z);
  }

  // ── Radial Menu UI ────────────────────────────────────────────────────
  function _createMenu() {
    if (_menuEl) return;

    _backdropEl = document.createElement('div');
    _backdropEl.id = 'radio-menu-backdrop';
    _backdropEl.style.cssText = [
      'position:fixed',
      'top:0', 'left:0', 'width:100%', 'height:100%',
      'background:rgba(0,0,0,0.35)',
      'z-index:800',
      'display:none'
    ].join(';');
    document.body.appendChild(_backdropEl);

    _menuEl = document.createElement('div');
    _menuEl.id = 'radio-support-menu';
    _menuEl.style.cssText = [
      'position:fixed',
      'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'width:260px', 'height:260px',
      'z-index:810',
      'display:none',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(_menuEl);
  }

  function _renderMenu() {
    if (!_menuEl) return;
    var score = _getScore();

    // 4 slots: N=artillery, E=recon, S=airstrike, W=extraction
    var options = [
      {
        key: 'artillery',
        num: '1',
        label: 'ARTILLERY',
        sublabel: 'BARRAGE',
        cost: COSTS.artillery,
        cd: _cooldowns.artillery,
        color: '#ffcc00',
        top: '0px', left: '80px', width: '100px'
      },
      {
        key: 'recon',
        num: '2',
        label: 'RECON',
        sublabel: 'REPORT',
        cost: COSTS.recon,
        cd: _cooldowns.recon,
        color: '#44aaff',
        top: '80px', left: '170px', width: '90px'
      },
      {
        key: 'airstrike',
        num: '3',
        label: 'AIRSTRIKE',
        sublabel: 'SINGLE',
        cost: COSTS.airstrike,
        cd: _cooldowns.airstrike,
        color: '#ff4400',
        top: '170px', left: '80px', width: '100px'
      },
      {
        key: 'extraction',
        num: '4',
        label: 'EXTRACTION',
        sublabel: 'POINT',
        cost: COSTS.extraction,
        cd: _cooldowns.extraction,
        color: '#00ff88',
        top: '80px', left: '0px', width: '90px'
      }
    ];

    var html =
      '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'width:240px;height:240px;border-radius:50%;background:rgba(0,0,0,0.75);' +
      'border:2px solid #888;box-shadow:0 0 24px rgba(0,0,0,0.8);">' +
      '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'color:#ccc;font-family:monospace;font-size:11px;text-align:center;line-height:1.4;">' +
      'RADIO<br>SUPPORT<br><span style="color:#888;font-size:9px;">[R] CLOSE</span>' +
      '</div>' +
      '</div>';

    for (var i = 0; i < options.length; i++) {
      var o = options[i];
      var ready = (o.cd <= 0) && (score >= o.cost || o.cost === 0);
      var cdText = o.cd > 0 ? Math.ceil(o.cd) + 's' : '';
      var bgColor = ready ? 'rgba(0,0,0,0.82)' : 'rgba(0,0,0,0.55)';
      var borderColor = ready ? o.color : '#444';
      var textColor = ready ? o.color : '#666';
      var costText = o.cost > 0 ? o.cost + ' PTS' : 'FREE';

      html +=
        '<div data-action="' + o.key + '" data-num="' + o.num + '"' +
        ' style="position:absolute;top:' + o.top + ';left:' + o.left + ';width:' + o.width + ';' +
        'background:' + bgColor + ';border:2px solid ' + borderColor + ';border-radius:6px;' +
        'padding:6px 4px;text-align:center;font-family:monospace;cursor:pointer;' +
        'pointer-events:all;user-select:none;box-sizing:border-box;"' +
        ' onmouseover="this.style.background=\'rgba(40,40,40,0.95)\'"' +
        ' onmouseout="this.style.background=\'' + bgColor + '\'">' +
        '<div style="color:#888;font-size:10px;">[' + o.num + ']</div>' +
        '<div style="color:' + textColor + ';font-size:11px;font-weight:bold;">' + o.label + '</div>' +
        '<div style="color:' + textColor + ';font-size:9px;">' + o.sublabel + '</div>' +
        '<div style="color:' + (o.cost > 0 ? '#ffaa00' : '#88ff88') + ';font-size:9px;margin-top:2px;">' + costText + '</div>' +
        (cdText ? '<div style="color:#ff6600;font-size:9px;">' + cdText + ' CD</div>' : '') +
        '</div>';
    }

    _menuEl.innerHTML = html;

    // Attach click listeners
    var panels = _menuEl.querySelectorAll('[data-action]');
    for (var j = 0; j < panels.length; j++) {
      (function (panel) {
        panel.addEventListener('click', function (ev) {
          ev.stopPropagation();
          _selectOption(panel.getAttribute('data-action'));
        });
      })(panels[j]);
    }
  }

  function _selectOption(key) {
    var score = _getScore();
    var cost = COSTS[key];
    var cd = _cooldowns[key];

    if (cd > 0) {
      _toast('COOLDOWN: ' + Math.ceil(cd) + 's remaining', '#ff6600');
      return;
    }
    if (score < cost) {
      _toast('Need ' + cost + ' score (have ' + score + ')', '#ff4444');
      return;
    }

    _deductScore(cost);
    _cooldowns[key] = COOLDOWN_TIMES[key];
    hide();

    if (key === 'artillery') {
      _executeArtillery();
    } else if (key === 'extraction') {
      _executeExtraction();
    } else if (key === 'recon') {
      _executeRecon();
    } else if (key === 'airstrike') {
      _startAirstrikeTargeting();
    }
  }

  // ── Public: init ──────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene = scene || _scene;
    _camera = camera || _camera;

    // Try to grab camera from game if not passed
    if (!_camera && window._camera) _camera = window._camera;

    _createMenu();

    // Keyboard: numbers 1-4 to select while menu open, ESC to close
    document.addEventListener('keydown', function (ev) {
      if (_targetingMode) {
        if (ev.code === 'Escape') {
          _cancelAirstrikeTargeting();
          _cooldowns.airstrike = 0; // refund cooldown on cancel
          _deductScore(-COSTS.airstrike); // refund score
          // Actually give back the score — we already deducted it
          var refund = COSTS.airstrike;
          if (window._player && typeof window._player.score === 'number') {
            window._player.score += refund;
          } else if (window.player && typeof window.player.score === 'number') {
            window.player.score += refund;
          }
        }
        if (ev.button === 0 || ev.code === 'Space') {
          // Allow space to also confirm targeting using player's forward ray
          if (ev.code === 'Space') {
            var pp = _getPlayerPos();
            var gy = (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight)
              ? VoxelWorld.getTerrainHeight(pp.x, pp.z) : pp.y;
            _executeAirstrike(pp.x + 10, gy, pp.z + 10);
          }
        }
        return;
      }
      if (!_menuOpen) return;
      if (ev.code === 'Escape' || ev.code === 'KeyR') {
        hide();
        return;
      }
      if (ev.key === '1') _selectOption('artillery');
      else if (ev.key === '2') _selectOption('recon');
      else if (ev.key === '3') _selectOption('airstrike');
      else if (ev.key === '4') _selectOption('extraction');
    });

    // Click to confirm airstrike target
    document.addEventListener('click', _onDocClick);
  }

  // ── Public: toggle ────────────────────────────────────────────────────
  function toggle() {
    if (_menuOpen) {
      hide();
    } else {
      show();
    }
  }

  // ── Public: show ──────────────────────────────────────────────────────
  function show() {
    if (!_menuEl) _createMenu();
    _menuOpen = true;
    _renderMenu();
    _menuEl.style.display = 'block';
    if (_backdropEl) _backdropEl.style.display = 'block';
    // Lock pointer if it is currently locked (pause mouse look)
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  // ── Public: hide ──────────────────────────────────────────────────────
  function hide() {
    _menuOpen = false;
    if (_menuEl) _menuEl.style.display = 'none';
    if (_backdropEl) _backdropEl.style.display = 'none';
  }

  // Legacy compat
  function openMenu() { toggle(); }
  function closeMenu() { hide(); }

  // ── Public: update (delta in seconds, called each frame) ─────────────
  function update(delta) {
    // Tick cooldowns
    if (_cooldowns.artillery > 0) _cooldowns.artillery = Math.max(0, _cooldowns.artillery - delta);
    if (_cooldowns.extraction > 0) _cooldowns.extraction = Math.max(0, _cooldowns.extraction - delta);
    if (_cooldowns.recon > 0) _cooldowns.recon = Math.max(0, _cooldowns.recon - delta);
    if (_cooldowns.airstrike > 0) _cooldowns.airstrike = Math.max(0, _cooldowns.airstrike - delta);

    // Recon timer — refresh markers each second roughly
    if (_reconTimer > 0) {
      _reconTimer -= delta;
      if (_reconTimer <= 0) {
        _reconTimer = 0;
        _hideReconOverlay();
        _toast('SATELLITE FEED ENDED', '#888888');
      } else {
        // Refresh marker positions every 0.1s (simple throttle via integer change)
        _updateReconMarkers();
      }
    }

    // Update VFX
    for (var vi = _vfx.length - 1; vi >= 0; vi--) {
      var v = _vfx[vi];
      v.elapsed += delta;
      var t = Math.min(v.elapsed / v.duration, 1);

      if (v.type === 'explosion') {
        var scale = 0.4 + (v.expandTo - 0.4) * t;
        v.sphere.scale.setScalar(scale / 0.4);
        if (v.sphereMat) v.sphereMat.opacity = 1 - t;
        // Smoke rises and expands
        v.smoke.position.y += delta * 1.5;
        var smokeScale = 1 + t * 3;
        v.smoke.scale.setScalar(smokeScale);
        if (v.smokeMat) v.smokeMat.opacity = 0.7 * (1 - t);
        // Shockwave expands outward
        var waveScale = 1 + t * v.expandTo * 3;
        v.wave.scale.setScalar(waveScale);
        if (v.waveMat) v.waveMat.opacity = 0.8 * (1 - t);
        v.light.intensity = (v.type === 'explosion' && v.expandTo >= 6 ? 18 : 12) * (1 - t);

        if (t >= 1) {
          if (_scene) {
            _scene.remove(v.sphere);
            _scene.remove(v.smoke);
            _scene.remove(v.wave);
            _scene.remove(v.light);
          }
          if (v.sphereGeo) v.sphereGeo.dispose();
          if (v.sphereMat) v.sphereMat.dispose();
          if (v.smokeGeo) v.smokeGeo.dispose();
          if (v.smokeMat) v.smokeMat.dispose();
          if (v.waveGeo) v.waveGeo.dispose();
          if (v.waveMat) v.waveMat.dispose();
          _vfx.splice(vi, 1);
        }
      } else if (v.type === 'greensmoke') {
        // Smoke pillar rises and fades after duration
        v.smoke.position.y += delta * 0.3;
        var sScale = 1 + t * 2.5;
        v.smoke.scale.setScalar(sScale);
        if (t > 0.6 && v.smokeMat) {
          v.smokeMat.opacity = 0.8 * (1 - (t - 0.6) / 0.4);
        }
        if (t >= 1) {
          if (_scene) {
            _scene.remove(v.cyl);
            _scene.remove(v.smoke);
            _scene.remove(v.light);
          }
          if (v.cylGeo) v.cylGeo.dispose();
          if (v.cylMat) v.cylMat.dispose();
          if (v.smokeGeo) v.smokeGeo.dispose();
          if (v.smokeMat) v.smokeMat.dispose();
          _vfx.splice(vi, 1);
        }
      }
    }

    // Re-render menu if open (keeps cooldown timers current)
    if (_menuOpen) {
      _renderMenu();
    }

    // Try to grab camera lazily if not set
    if (!_camera && window._camera) _camera = window._camera;
  }

  // ── Public API ────────────────────────────────────────────────────────
  return {
    init: init,
    toggle: toggle,
    show: show,
    hide: hide,
    update: update,
    openMenu: openMenu,
    closeMenu: closeMenu
  };

})();
