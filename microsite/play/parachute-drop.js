window.ParachuteDrop = (function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------
  var TERMINAL_VELOCITY = 50;      // m/s max freefall speed (downward positive)
  var GRAVITY = 9.8;               // units/s^2
  var CHUTE_DESCENT = 3;           // m/s target descent under chute
  var CHUTE_DECEL_TIME = 1.2;      // seconds to decelerate to chute speed
  var GROUND_Y = 1.0;              // snap-to-ground threshold
  var MIN_DEPLOY_Y = 8;            // must be above this to deploy chute
  var HALO_Y = 60;                 // spawn height for HALO jump
  var HALO_TEXT_DUR = 3;           // seconds for HALO overlay text
  var CHUTE_OFFSET_Y = 4;          // parachute mesh offset above camera
  var WASD_DRIFT_MULT = 0.5;       // horizontal movement multiplier while descending
  var NORMAL_SPEED = 6;            // baseline horizontal speed units/s
  var MAX_CHARGES = 2;             // parachute uses per life
  var SWAY_FREQ = 1.2;             // swaying frequency (rad/s)
  var SWAY_AMP = 0.04;             // swaying amplitude (rad)

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  var _scene = null;
  var _camera = null;

  var _inAir = false;              // true when in freefall or chute descent
  var _chuteDeployed = false;      // parachute is open
  var _velocityY = 0;              // downward velocity (positive = falling)
  var _charges = MAX_CHARGES;      // remaining parachute uses

  var _chuteGroup = null;          // Three.js group for parachute mesh
  var _swayTimer = 0;              // timer for dome sway animation

  // Chute deceleration tracking
  var _chuteDecelTimer = 0;        // time spent decelerating
  var _chuteInitVel = 0;           // velocity at moment of deployment

  // HALO overlay
  var _haloOverlay = null;
  var _haloTimer = 0;

  // HUD
  var _hud = null;

  // Input
  var _keys = {
    w: false, a: false, s: false, d: false
  };

  var _keydownHandler = null;
  var _keyupHandler = null;

  // ---------------------------------------------------------------------------
  // HUD
  // ---------------------------------------------------------------------------
  function _createHUD() {
    if (_hud) { return; }

    _hud = document.createElement('div');
    _hud.id = 'parachute-drop-hud';
    _hud.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:16px',
      'font-weight:bold',
      'text-align:center',
      'pointer-events:none',
      'z-index:9000',
      'text-shadow:0 0 8px #00ff88',
      'line-height:1.6',
      'display:none'
    ].join(';');
    document.body.appendChild(_hud);
  }

  function _updateHUD() {
    if (!_hud) { return; }
    if (!_inAir) {
      _hud.style.display = 'none';
      return;
    }

    _hud.style.display = 'block';
    var playerY = _getPlayerY();
    var altM = Math.max(0, Math.round(playerY * 3));
    var descentDisplay = Math.abs(_velocityY).toFixed(1);
    var deployHint = (!_chuteDeployed && playerY > MIN_DEPLOY_Y && _charges > 0)
      ? '<br><span style="color:#ffff00">DEPLOY PARACHUTE [Alt+P]</span>'
      : '';
    var chargesDisplay = '<br><span style="color:#aaaaaa">CHUTES: ' + _charges + '/' + MAX_CHARGES + '</span>';

    _hud.innerHTML =
      'ALT: ' + altM + 'm' +
      '&nbsp;&nbsp;&nbsp;DESCENT: ' + descentDisplay + ' m/s' +
      deployHint +
      chargesDisplay;
  }

  function _removeHUD() {
    if (_hud && _hud.parentNode) {
      _hud.parentNode.removeChild(_hud);
    }
    _hud = null;
  }

  // Charges display in corner (always visible when < MAX_CHARGES)
  var _chargesCorner = null;

  function _createChargesCorner() {
    if (_chargesCorner) { return; }
    _chargesCorner = document.createElement('div');
    _chargesCorner.id = 'parachute-charges';
    _chargesCorner.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:14px',
      'color:#cccccc',
      'font-family:monospace',
      'font-size:14px',
      'pointer-events:none',
      'z-index:9001',
      'text-shadow:0 0 4px #888',
      'display:none'
    ].join(';');
    document.body.appendChild(_chargesCorner);
  }

  function _updateChargesCorner() {
    if (!_chargesCorner) { return; }
    if (_charges < MAX_CHARGES) {
      _chargesCorner.textContent = 'CHUTES: ' + _charges + '/' + MAX_CHARGES;
      _chargesCorner.style.display = 'block';
    } else {
      _chargesCorner.style.display = 'none';
    }
  }

  function _removeChargesCorner() {
    if (_chargesCorner && _chargesCorner.parentNode) {
      _chargesCorner.parentNode.removeChild(_chargesCorner);
    }
    _chargesCorner = null;
  }

  // ---------------------------------------------------------------------------
  // HALO overlay
  // ---------------------------------------------------------------------------
  function _showHALOOverlay() {
    if (_haloOverlay) { return; }
    _haloOverlay = document.createElement('div');
    _haloOverlay.id = 'halo-jump-overlay';
    _haloOverlay.style.cssText = [
      'position:fixed',
      'top:30%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ff4400',
      'font-family:monospace',
      'font-size:36px',
      'font-weight:bold',
      'letter-spacing:6px',
      'pointer-events:none',
      'z-index:9500',
      'text-shadow:0 0 20px #ff4400,0 0 40px #ff2200',
      'opacity:1',
      'transition:opacity 0.5s'
    ].join(';');
    _haloOverlay.textContent = 'HALO JUMP';
    document.body.appendChild(_haloOverlay);
    _haloTimer = HALO_TEXT_DUR;
  }

  function _updateHALOOverlay(dt) {
    if (!_haloOverlay) { return; }
    _haloTimer -= dt;
    if (_haloTimer <= 0.5) {
      var fadeRatio = Math.max(0, _haloTimer / 0.5);
      _haloOverlay.style.opacity = String(fadeRatio);
    }
    if (_haloTimer <= 0) {
      _removeHALOOverlay();
    }
  }

  function _removeHALOOverlay() {
    if (_haloOverlay && _haloOverlay.parentNode) {
      _haloOverlay.parentNode.removeChild(_haloOverlay);
    }
    _haloOverlay = null;
    _haloTimer = 0;
  }

  // ---------------------------------------------------------------------------
  // Player Y helpers — support window._playerY or camera.position.y
  // ---------------------------------------------------------------------------
  function _getPlayerY() {
    if (typeof window._playerY === 'number') { return window._playerY; }
    if (_camera) { return _camera.position.y; }
    return 0;
  }

  function _setPlayerY(y) {
    if (typeof window._playerY === 'number') {
      window._playerY = y;
    }
    if (_camera) { _camera.position.y = y; }
  }

  function _getPlayerX() {
    if (_camera) { return _camera.position.x; }
    return 0;
  }

  function _setPlayerX(x) {
    if (_camera) { _camera.position.x = x; }
  }

  function _getPlayerZ() {
    if (_camera) { return _camera.position.z; }
    return 0;
  }

  function _setPlayerZ(z) {
    if (_camera) { _camera.position.z = z; }
  }

  // ---------------------------------------------------------------------------
  // Parachute mesh (Three.js)
  // ---------------------------------------------------------------------------
  function _buildChuteMesh() {
    if (!window.THREE) { return; }
    if (_chuteGroup) { _removeChuteFromScene(); }

    _chuteGroup = new window.THREE.Group();

    // Dome: 8 triangular segments using SphereGeometry slices
    var domeMat = new window.THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: window.THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });

    // Build dome as 8 separate "gores" (pie-slice shaped wedges)
    var NUM_SEGMENTS = 8;
    var DOME_RADIUS = 2.0;

    for (var i = 0; i < NUM_SEGMENTS; i++) {
      // Use a sphere geometry sliced to 1/8th arc for each gore
      var goreGeo = new window.THREE.SphereGeometry(
        DOME_RADIUS,  // radius
        1,            // widthSegments per gore
        4,            // heightSegments
        (i / NUM_SEGMENTS) * Math.PI * 2,          // phiStart
        (1 / NUM_SEGMENTS) * Math.PI * 2,          // phiLength
        0,            // thetaStart (top)
        Math.PI / 2   // thetaLength (hemisphere)
      );
      // Alternate gore colours slightly for visual interest
      var goreColor = (i % 2 === 0) ? 0xffffff : 0xeeeeee;
      var goreMat = new window.THREE.MeshBasicMaterial({
        color: goreColor,
        side: window.THREE.DoubleSide,
        transparent: true,
        opacity: 0.88
      });
      var gore = new window.THREE.Mesh(goreGeo, goreMat);
      _chuteGroup.add(gore);
    }

    // 8 suspension lines: thin CylinderGeometry, grey, from canopy rim down to camera
    var lineMat = new window.THREE.MeshBasicMaterial({ color: 0x999999 });
    var LINE_LENGTH = CHUTE_OFFSET_Y - 0.2; // reach from canopy to just above player

    for (var j = 0; j < 8; j++) {
      var lineGeo = new window.THREE.CylinderGeometry(0.012, 0.012, LINE_LENGTH, 4);
      var line = new window.THREE.Mesh(lineGeo, lineMat);
      var angle = (j / 8) * Math.PI * 2;
      var rimR = DOME_RADIUS * 0.85;
      // Attach top of line near dome rim, bottom toward player
      line.position.set(
        Math.cos(angle) * rimR * 0.5,
        -(LINE_LENGTH / 2),
        Math.sin(angle) * rimR * 0.5
      );
      // Tilt lines outward from centre
      line.rotation.z = Math.cos(angle) * 0.22;
      line.rotation.x = Math.sin(angle) * 0.22;
      _chuteGroup.add(line);
    }

    _swayTimer = 0;

    if (_scene) { _scene.add(_chuteGroup); }
  }

  function _updateChutePosition() {
    if (!_chuteGroup || !_camera) { return; }
    _chuteGroup.position.x = _camera.position.x;
    _chuteGroup.position.y = _camera.position.y + CHUTE_OFFSET_Y;
    _chuteGroup.position.z = _camera.position.z;
  }

  function _swayChute(dt) {
    if (!_chuteGroup) { return; }
    _swayTimer += dt;
    _chuteGroup.rotation.x = Math.sin(_swayTimer * SWAY_FREQ) * SWAY_AMP;
    _chuteGroup.rotation.z = Math.cos(_swayTimer * SWAY_FREQ * 0.7) * SWAY_AMP;
  }

  function _removeChuteFromScene() {
    if (_chuteGroup && _scene) {
      _scene.remove(_chuteGroup);
    }
    _chuteGroup = null;
  }

  // ---------------------------------------------------------------------------
  // Landing
  // ---------------------------------------------------------------------------
  function _land() {
    _inAir = false;
    _chuteDeployed = false;
    _velocityY = 0;
    _chuteDecelTimer = 0;
    _chuteInitVel = 0;

    _setPlayerY(GROUND_Y);
    _removeChuteFromScene();

    // Play landing sound via AudioSystem if available
    if (window.AudioSystem && typeof window.AudioSystem.playLandingThud === 'function') {
      window.AudioSystem.playLandingThud();
    }

    _updateChargesCorner();
  }

  // ---------------------------------------------------------------------------
  // Deploy parachute
  // ---------------------------------------------------------------------------
  function _deployChute() {
    if (_chuteDeployed) { return; }
    if (_charges <= 0) { return; }
    if (_getPlayerY() <= MIN_DEPLOY_Y) { return; }
    if (!_inAir) { return; }

    _chuteDeployed = true;
    _charges--;
    _chuteInitVel = _velocityY;
    _chuteDecelTimer = 0;

    _buildChuteMesh();
    _updateChargesCorner();
  }

  // ---------------------------------------------------------------------------
  // HALO jump trigger
  // ---------------------------------------------------------------------------
  function _triggerHALO() {
    var px = _getPlayerX();
    var pz = _getPlayerZ();

    // Place player 60 units up
    _setPlayerY(HALO_Y);
    // Keep same XZ
    _setPlayerX(px);
    _setPlayerZ(pz);

    _inAir = true;
    _chuteDeployed = false;
    _velocityY = 0;
    _chuteDecelTimer = 0;
    _chuteInitVel = 0;

    _showHALOOverlay();
  }

  // ---------------------------------------------------------------------------
  // Input
  // ---------------------------------------------------------------------------
  function _onKeyDown(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    var code = e.code || '';

    // WASD tracking
    if (key === 'w') { _keys.w = true; }
    if (key === 'a') { _keys.a = true; }
    if (key === 's') { _keys.s = true; }
    if (key === 'd') { _keys.d = true; }

    // Alt+P → deploy parachute
    if ((e.altKey || e.getModifierState && e.getModifierState('Alt')) && key === 'p') {
      e.preventDefault();
      _deployChute();
      return;
    }

    // F9 → HALO jump
    if (key === 'f9' || code === 'F9') {
      e.preventDefault();
      _triggerHALO();
      return;
    }
  }

  function _onKeyUp(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    if (key === 'w') { _keys.w = false; }
    if (key === 'a') { _keys.a = false; }
    if (key === 's') { _keys.s = false; }
    if (key === 'd') { _keys.d = false; }
  }

  function _registerKeys() {
    _keydownHandler = _onKeyDown;
    _keyupHandler = _onKeyUp;
    document.addEventListener('keydown', _keydownHandler, false);
    document.addEventListener('keyup', _keyupHandler, false);
  }

  function _unregisterKeys() {
    if (_keydownHandler) {
      document.removeEventListener('keydown', _keydownHandler, false);
      _keydownHandler = null;
    }
    if (_keyupHandler) {
      document.removeEventListener('keyup', _keyupHandler, false);
      _keyupHandler = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Physics update
  // ---------------------------------------------------------------------------
  function _applyHorizontalDrift(dt) {
    if (!_camera) { return; }
    var spd = NORMAL_SPEED * WASD_DRIFT_MULT;
    var dx = 0;
    var dz = 0;
    if (_keys.w) { dz -= spd * dt; }
    if (_keys.s) { dz += spd * dt; }
    if (_keys.a) { dx -= spd * dt; }
    if (_keys.d) { dx += spd * dt; }
    _camera.position.x += dx;
    _camera.position.z += dz;
  }

  function _updatePhysics(dt) {
    if (!_inAir) { return; }

    if (_chuteDeployed) {
      // Decelerate from _chuteInitVel to CHUTE_DESCENT over CHUTE_DECEL_TIME
      _chuteDecelTimer += dt;
      var t = Math.min(1, _chuteDecelTimer / CHUTE_DECEL_TIME);
      _velocityY = _chuteInitVel + (_chuteInitVel - CHUTE_DESCENT) * (-t) + (t * (_chuteInitVel - CHUTE_DESCENT) * (-1));
      // Simpler linear interpolation:
      _velocityY = _chuteInitVel * (1 - t) + CHUTE_DESCENT * t;

      // Horizontal drift from WASD
      _applyHorizontalDrift(dt);

      // Sway animation
      _swayChute(dt);
      _updateChutePosition();
    } else {
      // Freefall: accelerate downward
      _velocityY += GRAVITY * dt;
      if (_velocityY > TERMINAL_VELOCITY) { _velocityY = TERMINAL_VELOCITY; }
    }

    // Apply vertical velocity
    var newY = _getPlayerY() - _velocityY * dt;

    // Landing detection
    if (newY <= GROUND_Y) {
      _land();
      return;
    }

    _setPlayerY(newY);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  function init(scene, camera) {
    _scene = scene || _scene;
    _camera = camera || _camera;

    _inAir = false;
    _chuteDeployed = false;
    _velocityY = 0;
    _charges = MAX_CHARGES;
    _chuteDecelTimer = 0;
    _chuteInitVel = 0;

    _createHUD();
    _createChargesCorner();
    _registerKeys();

    // Expose trigger for external calls
    window._parachuteDropTriggerHALO = _triggerHALO;
    window._parachuteDropDeploy = _deployChute;
  }

  function update(dt) {
    if (!dt || dt <= 0) { return; }

    _updatePhysics(dt);
    _updateHUD();
    _updateHALOOverlay(dt);
  }

  function reset() {
    _inAir = false;
    _chuteDeployed = false;
    _velocityY = 0;
    _charges = MAX_CHARGES;
    _chuteDecelTimer = 0;
    _chuteInitVel = 0;
    _swayTimer = 0;

    _keys.w = false;
    _keys.a = false;
    _keys.s = false;
    _keys.d = false;

    _removeChuteFromScene();
    _removeHALOOverlay();
    _removeHUD();
    _removeChargesCorner();
    _unregisterKeys();

    window._parachuteDropTriggerHALO = null;
    window._parachuteDropDeploy = null;
  }

  return { init: init, update: update, reset: reset };

}());
