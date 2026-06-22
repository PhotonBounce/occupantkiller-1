// ============================================================
//  mortar-emplacement.js — Player-operated mortar with ballistic arc
//  Press M to deploy/undeploy. Aim with mouse, fire with left click.
//  Public API: init, update, deploy, undeploy, fire, isDeployed, reset, clear, restoreAmmo
// ============================================================
window.MortarEmplacement = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────── */
  var STATE_STOWED      = 'STOWED';
  var STATE_DEPLOYING   = 'DEPLOYING';
  var STATE_DEPLOYED    = 'DEPLOYED';
  var STATE_FIRING      = 'FIRING';
  var STATE_UNDEPLOYING = 'UNDEPLOYING';

  var DEPLOY_TIME    = 2.0;   // seconds
  var UNDEPLOY_TIME  = 1.5;   // seconds
  var RELOAD_TIME    = 5.0;   // seconds between shots (flight + reload)
  var GRAVITY        = 9.8;
  var MAX_RANGE      = 60;
  var MIN_RANGE      = 8;
  var MAX_AMMO       = 5;
  var SMOKE_INTERVAL = 0.1;   // spawn smoke trail every 0.1s

  /* ── State ──────────────────────────────────────────────────── */
  var _state       = STATE_STOWED;
  var _scene       = null;
  var _camera      = null;
  var _stateTimer  = 0;       // how long in current animation state
  var _reloadTimer = 0;       // cooldown between shots
  var _ammo        = MAX_AMMO;

  // World position where mortar is placed
  var _mortarPos   = null;    // THREE.Vector3

  // Azimuth and elevation for aiming
  var _azimuth     = 0;       // radians, horizontal
  var _elevation   = 45;      // degrees (vertical), maps to range

  // Mortar mesh group (in scene)
  var _mortarGroup = null;

  // Active shells
  var _shells      = [];      // [{mesh, vx, vy, vz, t, smokeTimer, trailParticles}]

  // Craters and debris still alive
  var _craters     = [];
  var _debris      = [];
  var _lights      = [];

  // Mouse movement accumulation while deployed
  var _mouseDX = 0;
  var _mouseDY = 0;

  // HUD elements (cached)
  var _ammoHUD  = null;
  var _aimUI    = null;
  var _rangeEl  = null;
  var _reloadRing = null;

  // Mouse listener reference (so we can remove it)
  var _mouseMoveHandler = null;
  var _clickHandler     = null;
  var _escHandler       = null;

  /* ── Mortar Mesh ─────────────────────────────────────────────── */
  function _buildMortarMesh() {
    var g = new THREE.Group();

    // Baseplate
    var bpMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var bp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.8), bpMat);
    bp.position.y = 0.025;
    g.add(bp);

    // Bipod legs
    var legMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8), legMat);
    leg1.position.set(0.22, 0.4, 0.0);
    leg1.rotation.z = Math.PI / 4; // 45° outward
    g.add(leg1);

    var leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8), legMat);
    leg2.position.set(-0.22, 0.4, 0.0);
    leg2.rotation.z = -Math.PI / 4; // 45° outward
    g.add(leg2);

    // Tube — dark gray, tilted 70° from horizontal (20° from vertical)
    var tubeMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var tube = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.0, 12), tubeMat);
    // 70° from horizontal = 20° from vertical = PI/2 - 70*PI/180
    tube.position.set(0, 0.5, -0.1);
    tube.rotation.x = -(Math.PI / 2 - (70 * Math.PI / 180)); // tilt 70° from horizontal
    g.add(tube);

    return g;
  }

  /* ── HUD Setup ──────────────────────────────────────────────── */
  function _buildHUD() {
    // Ammo HUD
    if (!document.getElementById('mortarAmmoHUD')) {
      var hud = document.createElement('div');
      hud.id = 'mortarAmmoHUD';
      hud.style.cssText = [
        'position:fixed',
        'bottom:80px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.7)',
        'color:#ff4444',
        'font-family:monospace',
        'font-size:14px',
        'padding:4px 12px',
        'border-radius:4px',
        'border:1px solid #ff4444',
        'display:none',
        'z-index:300',
        'pointer-events:none',
      ].join(';');
      hud.textContent = '🔴 MORTAR: ' + _ammo + '/5';
      document.body.appendChild(hud);
    }
    _ammoHUD = document.getElementById('mortarAmmoHUD');

    // Aim UI overlay
    if (!document.getElementById('mortarAimUI')) {
      var ui = document.createElement('div');
      ui.id = 'mortarAimUI';
      ui.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'width:100%',
        'height:100%',
        'background:rgba(0,0,0,0.55)',
        'display:none',
        'z-index:250',
        'pointer-events:none',
        'font-family:monospace',
      ].join(';');

      // SVG crosshair + range rings
      ui.innerHTML = [
        '<svg id="mortarAimSVG" style="width:100%;height:100%;position:absolute;top:0;left:0" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">',
        '  <!-- outer range ring 3 -->',
        '  <circle cx="400" cy="300" r="140" stroke="#cc3300" stroke-width="1" fill="none" opacity="0.5"/>',
        '  <!-- range ring 2 -->',
        '  <circle cx="400" cy="300" r="100" stroke="#cc3300" stroke-width="1" fill="none" opacity="0.5"/>',
        '  <!-- range ring 1 -->',
        '  <circle cx="400" cy="300" r="60" stroke="#cc3300" stroke-width="1.5" fill="none" opacity="0.7"/>',
        '  <!-- crosshair lines -->',
        '  <line x1="400" y1="160" x2="400" y2="250" stroke="#ff6600" stroke-width="2"/>',
        '  <line x1="400" y1="350" x2="400" y2="440" stroke="#ff6600" stroke-width="2"/>',
        '  <line x1="260" y1="300" x2="350" y2="300" stroke="#ff6600" stroke-width="2"/>',
        '  <line x1="450" y1="300" x2="540" y2="300" stroke="#ff6600" stroke-width="2"/>',
        '  <!-- center dot -->',
        '  <circle cx="400" cy="300" r="5" fill="#ff6600"/>',
        '  <!-- reload ring (progress arc, updated via JS) -->',
        '  <circle id="mortarReloadRing" cx="400" cy="300" r="150"',
        '    stroke="#ffcc00" stroke-width="4" fill="none"',
        '    stroke-dasharray="942" stroke-dashoffset="0"',
        '    transform="rotate(-90 400 300)" opacity="0"/>',
        '</svg>',
        '<div id="mortarRangeDisplay" style="position:absolute;bottom:80px;left:50%;transform:translateX(-50%);color:#ffcc00;font-size:18px;font-weight:bold;text-shadow:0 0 6px #ff6600;letter-spacing:2px">RANGE: --m</div>',
        '<div style="position:absolute;top:20px;left:50%;transform:translateX(-50%);color:#ff6600;font-size:13px;opacity:0.8;letter-spacing:1px">MORTAR AIM — MOUSE: AIM | LMB: FIRE | ESC: STOW</div>',
        '<div id="mortarAmmoDisplay" style="position:absolute;bottom:110px;left:50%;transform:translateX(-50%);color:#ff4444;font-size:15px;font-weight:bold">🔴 AMMO: ' + _ammo + '/5</div>',
      ].join('');
      document.body.appendChild(ui);
    }
    _aimUI    = document.getElementById('mortarAimUI');
    _rangeEl  = document.getElementById('mortarRangeDisplay');
    _reloadRing = document.getElementById('mortarReloadRing');
  }

  /* ── Helpers ─────────────────────────────────────────────────── */
  function _getRange() {
    // elevation 0..90 degrees maps to MIN_RANGE..MAX_RANGE
    var t = Math.max(0, Math.min(1, (_elevation - 10) / 80));
    return MIN_RANGE + t * (MAX_RANGE - MIN_RANGE);
  }

  function _updateAimUI() {
    if (!_aimUI) return;
    // Range display
    var range = _getRange();
    if (_rangeEl) _rangeEl.textContent = 'RANGE: ' + Math.round(range) + 'm';

    // Ammo display
    var ammoDisp = document.getElementById('mortarAmmoDisplay');
    if (ammoDisp) ammoDisp.textContent = '🔴 AMMO: ' + _ammo + '/5';

    // Reload ring
    if (_reloadRing) {
      if (_reloadTimer > 0) {
        var progress = 1 - (_reloadTimer / RELOAD_TIME);
        var circumference = 2 * Math.PI * 150;
        var offset = circumference * (1 - progress);
        _reloadRing.setAttribute('stroke-dashoffset', offset.toFixed(1));
        _reloadRing.setAttribute('opacity', '1');
      } else {
        _reloadRing.setAttribute('opacity', '0');
      }
    }
  }

  function _updateAmmoHUD() {
    if (!_ammoHUD) return;
    var show = (_state !== STATE_STOWED) || (_ammo < MAX_AMMO);
    _ammoHUD.style.display = show ? 'block' : 'none';
    _ammoHUD.textContent = '🔴 MORTAR: ' + _ammo + '/5';
  }

  function _showAimUI(visible) {
    if (!_aimUI) return;
    _aimUI.style.display = visible ? 'block' : 'none';
  }

  /* ── Audio: BOOM on impact ────────────────────────────────────── */
  function _playBoom() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();

      // Low 80Hz sine
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);

      // 200Hz filtered noise
      var bufLen = ctx.sampleRate * 0.3;
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1);
      var noise = ctx.createBufferSource();
      noise.buffer = buf;
      var filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 200;
      filter.Q.value = 0.5;
      var noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.6, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start();
      noise.stop(ctx.currentTime + 0.3);

      setTimeout(function () { try { ctx.close(); } catch (e2) {} }, 600);
    } catch (e) {}
  }

  /* ── Shell impact ────────────────────────────────────────────── */
  function _onImpact(pos) {
    if (!_scene) return;

    // Audio
    _playBoom();

    // Screen shake
    window._screenShake = { intensity: 0.8, duration: 0.5 };

    // Flash light
    var flash = new THREE.PointLight(0xff2200, 20, 12);
    flash.position.copy(pos);
    _scene.add(flash);
    _lights.push({ light: flash, timer: 0.25 });

    // Crater
    var craterMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
    var crater = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.2, 16), craterMat);
    crater.position.copy(pos);
    crater.position.y = pos.y - 0.1;
    _scene.add(crater);
    _craters.push(crater);

    // Debris particles
    for (var i = 0; i < 20; i++) {
      var dSize = 0.05 + Math.random() * 0.12;
      var dMat = new THREE.MeshLambertMaterial({
        color: Math.random() > 0.5 ? 0x5a4a2a : 0x4a3a2a
      });
      var dMesh = new THREE.Mesh(new THREE.BoxGeometry(dSize, dSize, dSize), dMat);
      dMesh.position.copy(pos);
      var angle = Math.random() * Math.PI * 2;
      var speed = 2 + Math.random() * 6;
      _debris.push({
        mesh: dMesh,
        vx: Math.cos(angle) * speed,
        vy: 3 + Math.random() * 5,
        vz: Math.sin(angle) * speed,
        t: 0,
        life: 1.5 + Math.random() * 1.0,
      });
      _scene.add(dMesh);
    }

    // Damage enemies
    if (typeof Enemies !== 'undefined' && Enemies.damageInRadius) {
      // 90 dmg at center (1 unit), 60 dmg at 1.5 units, 25 dmg at 3 units
      Enemies.damageInRadius(pos, 1.0, 90);
      Enemies.damageInRadius(pos, 1.5, 60);
      Enemies.damageInRadius(pos, 3.0, 25);
    } else if (typeof Enemies !== 'undefined' && Enemies.getAll) {
      // Fallback: manual loop
      var allE = Enemies.getAll();
      for (var ei = 0; ei < allE.length; ei++) {
        var en = allE[ei];
        if (!en.alive || !en.mesh) continue;
        var dx = en.mesh.position.x - pos.x;
        var dz = en.mesh.position.z - pos.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        var dmg = 0;
        if (dist <= 1.0) dmg = 90;
        else if (dist <= 1.5) dmg = 60;
        else if (dist <= 3.0) dmg = 25;
        if (dmg > 0 && typeof Enemies.damage === 'function') Enemies.damage(en, dmg);
      }
    }
  }

  /* ── Mouse handlers ──────────────────────────────────────────── */
  function _attachMouseHandlers() {
    _mouseMoveHandler = function (e) {
      if (_state !== STATE_DEPLOYED && _state !== STATE_FIRING) return;
      _mouseDX += e.movementX || 0;
      _mouseDY += e.movementY || 0;
    };

    _clickHandler = function (e) {
      if (e.button !== 0) return;
      if (_state !== STATE_DEPLOYED) return;
      fire();
    };

    _escHandler = function (e) {
      if (e.key === 'Escape' && (_state === STATE_DEPLOYED || _state === STATE_FIRING || _state === STATE_DEPLOYING)) {
        undeploy();
      }
    };

    document.addEventListener('mousemove', _mouseMoveHandler);
    document.addEventListener('mousedown', _clickHandler);
    document.addEventListener('keydown', _escHandler);
  }

  function _detachMouseHandlers() {
    if (_mouseMoveHandler) { document.removeEventListener('mousemove', _mouseMoveHandler); _mouseMoveHandler = null; }
    if (_clickHandler)     { document.removeEventListener('mousedown', _clickHandler);     _clickHandler     = null; }
    if (_escHandler)       { document.removeEventListener('keydown', _escHandler);         _escHandler       = null; }
  }

  /* ── Mortar placement ────────────────────────────────────────── */
  function _placeMortarMesh() {
    if (!_scene || !_mortarPos) return;
    if (_mortarGroup) { try { _scene.remove(_mortarGroup); } catch (e) {} }
    _mortarGroup = _buildMortarMesh();
    _mortarGroup.position.copy(_mortarPos);
    _scene.add(_mortarGroup);
  }

  function _removeMortarMesh() {
    if (_mortarGroup && _scene) {
      try { _scene.remove(_mortarGroup); } catch (e) {}
      _mortarGroup = null;
    }
  }

  /* ── Public API ──────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
    _state  = STATE_STOWED;
    _shells.length = 0;
    _craters.length = 0;
    _debris.length = 0;
    _lights.length = 0;
    _ammo   = MAX_AMMO;
    _reloadTimer = 0;
    _stateTimer  = 0;
    _azimuth  = 0;
    _elevation = 45;
    _buildHUD();
    _updateAmmoHUD();
  }

  function deploy(playerPos, camera) {
    if (_state !== STATE_STOWED) return;
    if (!_scene) return;

    // Determine placement position (1.5 units ahead of player)
    var fwd = new THREE.Vector3(0, 0, -1);
    if (camera) fwd.applyQuaternion(camera.quaternion);
    fwd.y = 0;
    fwd.normalize();

    var base = playerPos ? playerPos.clone() : (_camera ? _camera.position.clone() : new THREE.Vector3());
    _mortarPos = base.clone().addScaledVector(fwd, 1.5);

    // Ground-snap
    if (window.VoxelWorld && VoxelWorld.getTerrainHeight) {
      _mortarPos.y = VoxelWorld.getTerrainHeight(_mortarPos.x, _mortarPos.z);
    } else {
      _mortarPos.y = 0;
    }

    _state = STATE_DEPLOYING;
    _stateTimer = 0;

    // Show mortar mesh immediately at reduced opacity to indicate "being set up"
    _placeMortarMesh();
    if (_mortarGroup) {
      _mortarGroup.traverse(function (child) {
        if (child.material) child.material.transparent = true;
      });
    }

    _buildHUD();
    _updateAmmoHUD();
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('MORTAR: Deploying... (2s)', '#ffaa44');
    }
  }

  function undeploy() {
    if (_state === STATE_STOWED || _state === STATE_UNDEPLOYING) return;
    _state = STATE_UNDEPLOYING;
    _stateTimer = 0;
    _showAimUI(false);
    _detachMouseHandlers();
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('MORTAR: Stowing...', '#888888');
    }
  }

  function fire() {
    if (_state !== STATE_DEPLOYED) return;
    if (_reloadTimer > 0) {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup('MORTAR: Reloading (' + Math.ceil(_reloadTimer) + 's)', '#ff4444');
      }
      return;
    }
    if (_ammo <= 0) {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup('MORTAR: NO ROUNDS!', '#ff2200');
      }
      return;
    }

    _ammo--;
    _reloadTimer = RELOAD_TIME;
    _state = STATE_FIRING;

    // Compute launch velocity from azimuth + elevation
    var elevRad = _elevation * Math.PI / 180;
    var launchSpeed = 30; // fixed launch speed, range determined by elevation
    // range = v^2 * sin(2*elev) / g — we solve for v given desired range
    var range = _getRange();
    // For ballistic: range = v0^2 * sin(2*theta) / g => v0 = sqrt(range * g / sin(2*theta))
    var twoTheta = 2 * elevRad;
    var sinTwoTheta = Math.abs(Math.sin(twoTheta));
    if (sinTwoTheta < 0.01) sinTwoTheta = 0.01;
    var v0 = Math.sqrt(range * GRAVITY / sinTwoTheta);

    var vHoriz = v0 * Math.cos(elevRad);
    var vy     = v0 * Math.sin(elevRad);
    var vx     = -Math.sin(_azimuth) * vHoriz;
    var vz     = -Math.cos(_azimuth) * vHoriz;

    // Shell mesh
    var shellMat = new THREE.MeshLambertMaterial({ color: 0xff2200, emissive: 0xff1100 });
    var shellMesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), shellMat);

    // Launch from mortar tube tip
    var launchPos = _mortarPos ? _mortarPos.clone() : new THREE.Vector3();
    launchPos.y += 1.2; // top of tube
    shellMesh.position.copy(launchPos);
    _scene.add(shellMesh);

    _shells.push({
      mesh: shellMesh,
      vx: vx,
      vy: vy,
      vz: vz,
      t: 0,
      launchY: launchPos.y,
      startX: launchPos.x,
      startZ: launchPos.z,
      smokeTimer: 0,
      trailParticles: [],
    });

    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('MORTAR: FIRE! (' + _ammo + ' left)', '#ff6600');
    }
    _updateAmmoHUD();
    _updateAimUI();

    // Return to DEPLOYED after 1s cooldown (reloading but still deployed)
    var self = this;
    setTimeout(function () {
      if (_state === STATE_FIRING) _state = STATE_DEPLOYED;
    }, 1000);
  }

  function isDeployed() {
    return _state === STATE_DEPLOYED || _state === STATE_FIRING || _state === STATE_DEPLOYING;
  }

  function restoreAmmo(n) {
    var amount = (n === undefined) ? 1 : n;
    _ammo = Math.min(MAX_AMMO, _ammo + amount);
    _updateAmmoHUD();
  }

  function reset() {
    _ammo = MAX_AMMO;
    _reloadTimer = 0;
    clear();
    _updateAmmoHUD();
  }

  function clear() {
    // Undeploy if deployed
    if (_state !== STATE_STOWED) {
      _showAimUI(false);
      _detachMouseHandlers();
      _state = STATE_STOWED;
    }

    // Remove mortar mesh
    _removeMortarMesh();

    // Remove shells
    for (var i = 0; i < _shells.length; i++) {
      if (_scene && _shells[i].mesh) try { _scene.remove(_shells[i].mesh); } catch (e) {}
      for (var j = 0; j < _shells[i].trailParticles.length; j++) {
        if (_scene) try { _scene.remove(_shells[i].trailParticles[j].mesh); } catch (e) {}
      }
    }
    _shells.length = 0;

    // Remove craters
    for (var ci = 0; ci < _craters.length; ci++) {
      if (_scene) try { _scene.remove(_craters[ci]); } catch (e) {}
    }
    _craters.length = 0;

    // Remove debris
    for (var di = 0; di < _debris.length; di++) {
      if (_scene) try { _scene.remove(_debris[di].mesh); } catch (e) {}
    }
    _debris.length = 0;

    // Remove lights
    for (var li = 0; li < _lights.length; li++) {
      if (_scene) try { _scene.remove(_lights[li].light); } catch (e) {}
    }
    _lights.length = 0;

    _stateTimer  = 0;
    _reloadTimer = 0;
    _mouseDX = 0;
    _mouseDY = 0;

    _updateAmmoHUD();
  }

  /* ── Update (called from game loop) ─────────────────────────── */
  function update(delta, enemies) {
    if (!_scene) return;

    /* ── State machine transitions ── */
    if (_state === STATE_DEPLOYING) {
      _stateTimer += delta;
      // Fade in mortar mesh as it deploys
      if (_mortarGroup) {
        var opacity = Math.min(1, _stateTimer / DEPLOY_TIME);
        _mortarGroup.traverse(function (child) {
          if (child.material) child.material.opacity = opacity;
        });
      }
      if (_stateTimer >= DEPLOY_TIME) {
        _state = STATE_DEPLOYED;
        _stateTimer = 0;
        // Fully opaque now
        if (_mortarGroup) {
          _mortarGroup.traverse(function (child) {
            if (child.material) {
              child.material.transparent = false;
              child.material.opacity = 1;
            }
          });
        }
        _showAimUI(true);
        _attachMouseHandlers();
        if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
          HUD.notifyPickup('MORTAR DEPLOYED — AIM: mouse | FIRE: LMB | STOW: Esc', '#44ff88');
        }
      }
    }

    if (_state === STATE_UNDEPLOYING) {
      _stateTimer += delta;
      if (_mortarGroup) {
        var unOpacity = Math.max(0, 1 - _stateTimer / UNDEPLOY_TIME);
        _mortarGroup.traverse(function (child) {
          if (child.material) {
            child.material.transparent = true;
            child.material.opacity = unOpacity;
          }
        });
      }
      if (_stateTimer >= UNDEPLOY_TIME) {
        _state = STATE_STOWED;
        _stateTimer = 0;
        _removeMortarMesh();
        if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
          HUD.notifyPickup('MORTAR: Stowed', '#888888');
        }
      }
    }

    /* ── Aim input (accumulate mouse deltas) ── */
    if (_state === STATE_DEPLOYED || _state === STATE_FIRING) {
      var SENS = 0.003;
      if (_mouseDX !== 0) {
        _azimuth += _mouseDX * SENS;
        _mouseDX = 0;
      }
      if (_mouseDY !== 0) {
        // moving mouse up = higher elevation = longer range
        _elevation -= _mouseDY * 0.3;
        _elevation = Math.max(10, Math.min(80, _elevation));
        _mouseDY = 0;
      }

      // Rotate mortar group to match azimuth
      if (_mortarGroup) _mortarGroup.rotation.y = _azimuth;

      // Reload timer countdown
      if (_reloadTimer > 0) {
        _reloadTimer -= delta;
        if (_reloadTimer < 0) _reloadTimer = 0;
      }

      _updateAimUI();
    }

    _updateAmmoHUD();

    /* ── Shell flight ── */
    for (var si = _shells.length - 1; si >= 0; si--) {
      var sh = _shells[si];
      sh.t += delta;
      var t = sh.t;

      // Ballistic position
      var nx = sh.startX + sh.vx * t;
      var nz = sh.startZ + sh.vz * t;
      var ny = sh.launchY + sh.vy * t - 0.5 * GRAVITY * t * t;

      sh.mesh.position.set(nx, ny, nz);

      // Smoke trail
      sh.smokeTimer += delta;
      if (sh.smokeTimer >= SMOKE_INTERVAL) {
        sh.smokeTimer = 0;
        var smokeMat = new THREE.MeshBasicMaterial({
          color: 0x999999,
          transparent: true,
          opacity: 0.5,
        });
        var smokeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 5, 4), smokeMat);
        smokeMesh.position.copy(sh.mesh.position);
        _scene.add(smokeMesh);
        sh.trailParticles.push({ mesh: smokeMesh, life: 1.2 });
      }

      // Update trail particles
      for (var ti = sh.trailParticles.length - 1; ti >= 0; ti--) {
        var tp = sh.trailParticles[ti];
        tp.life -= delta;
        if (tp.life <= 0) {
          try { _scene.remove(tp.mesh); } catch (e) {}
          sh.trailParticles.splice(ti, 1);
        } else {
          tp.mesh.material.opacity = Math.max(0, tp.life / 1.2 * 0.5);
        }
      }

      // Check ground impact (y <= 0 or terrain)
      var groundY = 0;
      if (window.VoxelWorld && VoxelWorld.getTerrainHeight) {
        groundY = VoxelWorld.getTerrainHeight(nx, nz);
      }
      if (ny <= groundY) {
        // Impact!
        var impactPos = new THREE.Vector3(nx, groundY, nz);
        try { _scene.remove(sh.mesh); } catch (e) {}
        // Remove remaining trail
        for (var tri = 0; tri < sh.trailParticles.length; tri++) {
          try { _scene.remove(sh.trailParticles[tri].mesh); } catch (e) {}
        }
        _shells.splice(si, 1);
        _onImpact(impactPos);
      }
    }

    /* ── Debris physics ── */
    for (var di = _debris.length - 1; di >= 0; di--) {
      var db = _debris[di];
      db.t += delta;
      db.mesh.position.x += db.vx * delta;
      db.mesh.position.y += db.vy * delta - 0.5 * GRAVITY * db.t * delta;
      db.mesh.position.z += db.vz * delta;
      db.vy -= GRAVITY * delta;
      db.life -= delta;
      if (db.mesh.position.y < 0) db.mesh.position.y = 0;
      if (db.life <= 0) {
        try { _scene.remove(db.mesh); } catch (e) {}
        _debris.splice(di, 1);
      }
    }

    /* ── Flash lights ── */
    for (var lii = _lights.length - 1; lii >= 0; lii--) {
      var lobj = _lights[lii];
      lobj.timer -= delta;
      if (lobj.timer <= 0) {
        try { _scene.remove(lobj.light); } catch (e) {}
        _lights.splice(lii, 1);
      } else {
        lobj.light.intensity = 20 * (lobj.timer / 0.25);
      }
    }
  }

  /* ── IIFE return ─────────────────────────────────────────────── */
  return {
    init:       init,
    update:     update,
    deploy:     deploy,
    undeploy:   undeploy,
    fire:       fire,
    isDeployed: isDeployed,
    restoreAmmo: restoreAmmo,
    reset:      reset,
    clear:      clear,
  };

})();
