window.CombatJump = (function () {
  'use strict';

  // ── State ────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    phase: 'idle',          // idle | freefall | gliding | landed
    nightJump: false,
    staticLine: false,
    altitude: 0,
    verticalSpeed: 0,
    horizontalVel: { x: 0, z: 0 },
    freefallTimer: 0,
    chuteDeployed: false,
    hp: 100,
    score: 0,
    landingScore: 0,
    shakeDuration: 0,
    shakeTime: 0,
    glideHeading: 0,      // radians, for A/D turning
    aircraftTimer: 0,     // countdown for aircraft fly-away
    aircraftFlying: false
  };

  // ── Wind ─────────────────────────────────────────────────────────────────
  var wind = { speed: 0, angle: 0, x: 0, z: 0 };

  // ── Landing zone ─────────────────────────────────────────────────────────
  var dz = { x: 0, z: 0 };

  // ── THREE objects ─────────────────────────────────────────────────────────
  var scene = null;
  var camera = null;
  var player = null;      // THREE.Object3D position proxy

  var aircraftMesh = null;
  var chuteMesh = null;
  var chuteRisers = null;
  var dzRing = null;
  var starMeshes = [];
  var originalCameraRoll = 0;

  // ── HUD / CSS elements ────────────────────────────────────────────────────
  var hudEl = null;
  var altimeterEl = null;
  var vignetteEl = null;
  var nvgEl = null;
  var messageEl = null;
  var messageTimer = 0;

  // ── Input tracking ────────────────────────────────────────────────────────
  var keys = {};

  // ── Constants ─────────────────────────────────────────────────────────────
  var TERMINAL_VEL = 80;
  var FREEFALL_ACCEL_TIME = 3.0;
  var GLIDE_FALL_RATE = 4;
  var CHUTE_AUTO_ALTITUDE = 25;
  var HYPOXIC_ALTITUDE = 80;
  var STEER_FACTOR = 0.30;
  var AIRCRAFT_FLY_TIME = 3.0;
  var JUMP_ALTITUDE_HALO = 150;
  var JUMP_ALTITUDE_STATIC = 50;

  // ══════════════════════════════════════════════════════════════════════════
  //  init
  // ══════════════════════════════════════════════════════════════════════════
  function init(sceneRef, cameraRef, playerRef) {
    scene = sceneRef;
    camera = cameraRef;
    player = playerRef;

    _createHUD();
    _bindKeys();
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  update  (call every frame with delta in seconds)
  // ══════════════════════════════════════════════════════════════════════════
  function update(delta) {
    if (!state.active) return;

    _updateMessage(delta);

    if (state.phase === 'freefall') {
      _updateFreefall(delta);
    } else if (state.phase === 'gliding') {
      _updateGliding(delta);
    }

    _updateAircraft(delta);
    _updateCameraRoll(delta);
    _updateHUD();
    _updateHypoxia();
    _updateShake(delta);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  reset
  // ══════════════════════════════════════════════════════════════════════════
  function reset() {
    state.active = false;
    state.phase = 'idle';
    state.nightJump = false;
    state.staticLine = false;
    state.altitude = 0;
    state.verticalSpeed = 0;
    state.horizontalVel = { x: 0, z: 0 };
    state.freefallTimer = 0;
    state.chuteDeployed = false;
    state.hp = 100;
    state.score = 0;
    state.landingScore = 0;
    state.shakeDuration = 0;
    state.shakeTime = 0;
    state.glideHeading = 0;
    state.aircraftTimer = 0;
    state.aircraftFlying = false;

    _removeThreeObjects();
    _hideHUD();
    _setNightMode(false);
    _setNVG(false);

    if (camera) {
      camera.rotation.z = 0;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Internal – jump initiation
  // ══════════════════════════════════════════════════════════════════════════
  function _startJump() {
    if (state.phase !== 'idle') return;

    var jumpAlt = state.staticLine ? JUMP_ALTITUDE_STATIC : JUMP_ALTITUDE_HALO;

    state.active = true;
    state.altitude = jumpAlt;
    state.verticalSpeed = 0;
    state.freefallTimer = 0;
    state.chuteDeployed = false;
    state.horizontalVel = { x: 0, z: 0 };
    state.glideHeading = 0;

    // Teleport player
    if (player) {
      player.position.y = jumpAlt;
    }
    if (camera) {
      camera.position.y = jumpAlt;
    }

    // Wind
    wind.speed = 5 + Math.random() * 10;
    wind.angle = Math.random() * Math.PI * 2;
    wind.x = Math.cos(wind.angle) * wind.speed;
    wind.z = Math.sin(wind.angle) * wind.speed;

    // Landing zone
    var dzDist = 20 + Math.random() * 40;
    var dzAngle = Math.random() * Math.PI * 2;
    dz.x = Math.cos(dzAngle) * dzDist;
    dz.z = Math.sin(dzAngle) * dzDist;

    // Build Three.js scene objects
    _spawnAircraft(jumpAlt);
    _spawnDZ();

    if (state.nightJump) {
      _setNightMode(true);
      _spawnStars();
      _setNVG(true);
    }

    if (state.staticLine) {
      state.phase = 'gliding';
      _deployChuteVisual();
      _showMessage('STATIC LINE DEPLOYED', 2);
    } else {
      state.phase = 'freefall';
      _showMessage('HALO JUMP – FREEFALL', 2);
    }

    _showHUD();
  }

  // ── Freefall physics ─────────────────────────────────────────────────────
  function _updateFreefall(delta) {
    state.freefallTimer += delta;

    // Accelerate toward terminal velocity over FREEFALL_ACCEL_TIME seconds
    var t = Math.min(state.freefallTimer / FREEFALL_ACCEL_TIME, 1.0);
    state.verticalSpeed = t * TERMINAL_VEL;

    // WASD horizontal steering (30% of nominal move speed)
    var steerX = 0;
    var steerZ = 0;
    if (keys['KeyW'] || keys['ArrowUp'])    steerZ -= 1;
    if (keys['KeyS'] || keys['ArrowDown'])  steerZ += 1;
    if (keys['KeyA'] || keys['ArrowLeft'])  steerX -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) steerX += 1;

    var steerSpeed = TERMINAL_VEL * STEER_FACTOR;
    state.horizontalVel.x = steerX * steerSpeed;
    state.horizontalVel.z = steerZ * steerSpeed;

    // Apply wind drift
    state.horizontalVel.x += wind.x * delta;
    state.horizontalVel.z += wind.z * delta;

    // Update position
    state.altitude -= state.verticalSpeed * delta;
    if (player) {
      player.position.x += state.horizontalVel.x * delta;
      player.position.z += state.horizontalVel.z * delta;
      player.position.y = state.altitude;
    }
    if (camera) {
      if (player) {
        camera.position.x = player.position.x;
        camera.position.z = player.position.z;
      }
      camera.position.y = state.altitude;
    }

    // Auto-deploy
    if (state.altitude <= CHUTE_AUTO_ALTITUDE && !state.chuteDeployed) {
      _deployChute(true);
    }

    if (state.altitude <= 0) {
      _land();
    }
  }

  // ── Gliding physics ──────────────────────────────────────────────────────
  function _updateGliding(delta) {
    // A/D turns heading
    var turnRate = 1.2; // radians per second
    if (keys['KeyA'] || keys['ArrowLeft'])  state.glideHeading -= turnRate * delta;
    if (keys['KeyD'] || keys['ArrowRight']) state.glideHeading += turnRate * delta;

    // W = flare (slow descent 50%), S = slip (speed up 50%)
    var fallRate = GLIDE_FALL_RATE;
    if (keys['KeyW'] || keys['ArrowUp'])   fallRate *= 0.5;
    if (keys['KeyS'] || keys['ArrowDown']) fallRate *= 1.5;

    state.verticalSpeed = fallRate;

    // Horizontal glide
    var glideSpeed = 12;
    var hx = Math.sin(state.glideHeading) * glideSpeed;
    var hz = Math.cos(state.glideHeading) * glideSpeed;

    // Wind contribution
    state.horizontalVel.x = hx + wind.x;
    state.horizontalVel.z = hz + wind.z;

    state.altitude -= state.verticalSpeed * delta;
    if (player) {
      player.position.x += state.horizontalVel.x * delta;
      player.position.z += state.horizontalVel.z * delta;
      player.position.y = state.altitude;
    }
    if (camera) {
      if (player) {
        camera.position.x = player.position.x;
        camera.position.z = player.position.z;
      }
      camera.position.y = state.altitude;
    }

    // Update chute mesh position
    _updateChutePosition();

    if (state.altitude <= 0) {
      _land();
    }
  }

  // ── Chute deployment ─────────────────────────────────────────────────────
  function _deployChute(auto) {
    if (state.chuteDeployed) return;
    state.chuteDeployed = true;
    state.phase = 'gliding';
    state.verticalSpeed = GLIDE_FALL_RATE;
    _deployChuteVisual();
    _showMessage(auto ? 'AUTO-DEPLOY!' : 'CHUTE DEPLOYED', 2);
  }

  function _deployChuteVisual() {
    if (!scene) return;

    // Parachute canopy: inverted cone
    var coneGeo = new THREE.ConeGeometry(4, 3, 12, 1, true);
    var coneMat = new THREE.MeshLambertMaterial({
      color: 0xCC3333,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    chuteMesh = new THREE.Mesh(coneGeo, coneMat);
    chuteMesh.rotation.z = Math.PI; // invert
    scene.add(chuteMesh);

    // Risers: 8 lines from cone edge to player
    var riserGeo = new THREE.BufferGeometry();
    var riserPositions = new Float32Array(8 * 2 * 3); // 8 lines × 2 pts × xyz
    riserGeo.setAttribute('position', new THREE.BufferAttribute(riserPositions, 3));
    var riserMat = new THREE.LineBasicMaterial({ color: 0xFFFFDD });
    chuteRisers = new THREE.LineSegments(riserGeo, riserMat);
    scene.add(chuteRisers);

    _updateChutePosition();
  }

  function _updateChutePosition() {
    if (!chuteMesh || !player) return;

    var px = player.position.x;
    var py = player.position.y;
    var pz = player.position.z;

    chuteMesh.position.set(px, py + 4, pz);

    if (chuteRisers) {
      var positions = chuteRisers.geometry.attributes.position.array;
      for (var i = 0; i < 8; i++) {
        var angle = (i / 8) * Math.PI * 2;
        var ex = px + Math.cos(angle) * 4;
        var ez = pz + Math.sin(angle) * 4;
        var ey = py + 3;
        // Start of riser (cone edge)
        positions[i * 6 + 0] = ex;
        positions[i * 6 + 1] = ey;
        positions[i * 6 + 2] = ez;
        // End of riser (player)
        positions[i * 6 + 3] = px;
        positions[i * 6 + 4] = py;
        positions[i * 6 + 5] = pz;
      }
      chuteRisers.geometry.attributes.position.needsUpdate = true;
    }
  }

  // ── Aircraft ─────────────────────────────────────────────────────────────
  function _spawnAircraft(altitude) {
    if (!scene) return;

    var geo = new THREE.BoxGeometry(12, 2, 3);
    var mat = new THREE.MeshLambertMaterial({ color: 0x555566 });
    aircraftMesh = new THREE.Mesh(geo, mat);
    aircraftMesh.position.set(0, altitude + 2, -5);
    scene.add(aircraftMesh);

    state.aircraftTimer = AIRCRAFT_FLY_TIME;
    state.aircraftFlying = true;
  }

  function _updateAircraft(delta) {
    if (!state.aircraftFlying || !aircraftMesh) return;

    state.aircraftTimer -= delta;
    var t = 1.0 - Math.max(0, state.aircraftTimer / AIRCRAFT_FLY_TIME);
    // Lerp X off-screen to +300
    aircraftMesh.position.x = t * 300;

    if (state.aircraftTimer <= 0) {
      scene.remove(aircraftMesh);
      aircraftMesh.geometry.dispose();
      aircraftMesh.material.dispose();
      aircraftMesh = null;
      state.aircraftFlying = false;
    }
  }

  // ── Landing zone ─────────────────────────────────────────────────────────
  function _spawnDZ() {
    if (!scene) return;

    var geo = new THREE.CylinderGeometry(8, 8, 0.3, 32, 1, true);
    var mat = new THREE.MeshBasicMaterial({
      color: 0x00FF88,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    dzRing = new THREE.Mesh(geo, mat);
    dzRing.position.set(dz.x, 0.15, dz.z);
    scene.add(dzRing);
  }

  // ── Stars (night jump) ───────────────────────────────────────────────────
  function _spawnStars() {
    if (!scene) return;

    for (var i = 0; i < 20; i++) {
      var geo = new THREE.SphereGeometry(0.15, 4, 4);
      var mat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      var star = new THREE.Mesh(geo, mat);
      star.position.set(
        (Math.random() - 0.5) * 200,
        140 + Math.random() * 20,
        (Math.random() - 0.5) * 200
      );
      scene.add(star);
      starMeshes.push(star);
    }
  }

  // ── Landing ───────────────────────────────────────────────────────────────
  function _land() {
    state.altitude = 0;
    state.phase = 'landed';

    var px = player ? player.position.x : 0;
    var pz = player ? player.position.z : 0;
    var dx = px - dz.x;
    var dz2 = pz - dz.z;
    var dist = Math.sqrt(dx * dx + dz2 * dz2);

    var msg = '';
    var bonus = 0;

    if (dist <= 4) {
      msg = 'BULLSEYE! +500';
      bonus = 500;
    } else if (dist <= 8) {
      msg = 'GOOD LANDING! +200';
      bonus = 200;
    } else {
      msg = 'MISSED DZ +50';
      bonus = 50;
    }

    if (state.verticalSpeed > 10) {
      state.hp -= 50;
      bonus -= 50;
      msg += ' | HARD LANDING! -50 HP';
      _triggerShake(0.5);
    }

    state.landingScore = bonus;
    state.score += bonus;
    _showMessage(msg, 4);
    _showHUD();

    // Hide chute after landing
    if (chuteMesh) {
      scene.remove(chuteMesh);
      scene.remove(chuteRisers);
    }
  }

  // ── Camera roll (spin during freefall) ───────────────────────────────────
  function _updateCameraRoll(delta) {
    if (!camera) return;

    if (state.phase === 'freefall') {
      // Subtle roll proportional to horizontal input
      var rollTarget = 0;
      if (keys['KeyA'] || keys['ArrowLeft'])  rollTarget = 0.18;
      if (keys['KeyD'] || keys['ArrowRight']) rollTarget = -0.18;
      camera.rotation.z += (rollTarget - camera.rotation.z) * delta * 4;
    } else {
      camera.rotation.z += (0 - camera.rotation.z) * delta * 3;
    }
  }

  function _triggerShake(duration) {
    state.shakeDuration = duration;
    state.shakeTime = 0;
  }

  function _updateShake(delta) {
    if (state.shakeDuration <= 0) return;
    state.shakeTime += delta;
    if (state.shakeTime >= state.shakeDuration) {
      state.shakeDuration = 0;
      if (camera) {
        camera.position.x += 0; // reset handled by normal positioning
      }
      return;
    }
    if (camera) {
      var intensity = 0.3 * (1 - state.shakeTime / state.shakeDuration);
      camera.position.x += (Math.random() - 0.5) * intensity;
      camera.position.y += (Math.random() - 0.5) * intensity;
    }
  }

  // ── Night mode ───────────────────────────────────────────────────────────
  function _setNightMode(on) {
    if (!scene) return;
    if (on) {
      scene.background = new THREE.Color(0x000811);
      if (scene.fog) scene.fog.color.set(0x000811);
    } else {
      scene.background = new THREE.Color(0x87CEEB);
      if (scene.fog) scene.fog.color.set(0x87CEEB);
    }
  }

  function _setNVG(on) {
    if (nvgEl) {
      nvgEl.style.display = on ? 'block' : 'none';
    }
  }

  // ── Hypoxia ───────────────────────────────────────────────────────────────
  function _updateHypoxia() {
    if (!vignetteEl) return;
    if (state.altitude > HYPOXIC_ALTITUDE && state.phase === 'freefall') {
      var t = (state.altitude - HYPOXIC_ALTITUDE) / (JUMP_ALTITUDE_HALO - HYPOXIC_ALTITUDE);
      var size = Math.round(t * 30);
      vignetteEl.style.display = 'block';
      vignetteEl.style.boxShadow = 'inset 0 0 ' + size + 'vw ' + size + 'vw rgba(0,0,0,0.75)';
    } else {
      vignetteEl.style.display = 'none';
    }
  }

  // ── HUD ──────────────────────────────────────────────────────────────────
  function _createHUD() {
    // Main tactical HUD line
    hudEl = document.createElement('div');
    hudEl.id = 'cj-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:14px',
      'background:rgba(0,0,0,0.55)',
      'padding:6px 14px',
      'border:1px solid #00FF8866',
      'border-radius:4px',
      'z-index:9000',
      'display:none',
      'white-space:nowrap',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(hudEl);

    // Altimeter panel
    altimeterEl = document.createElement('div');
    altimeterEl.id = 'cj-altimeter';
    altimeterEl.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'right:20px',
      'width:160px',
      'background:rgba(0,0,0,0.65)',
      'border:2px solid #00FF88',
      'border-radius:50%',
      'padding:20px',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:13px',
      'text-align:center',
      'z-index:9000',
      'display:none',
      'line-height:1.6'
    ].join(';');
    document.body.appendChild(altimeterEl);

    // Vignette overlay (hypoxia)
    vignetteEl = document.createElement('div');
    vignetteEl.id = 'cj-vignette';
    vignetteEl.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      'z-index:8900',
      'display:none'
    ].join(';');
    document.body.appendChild(vignetteEl);

    // NVG overlay
    nvgEl = document.createElement('div');
    nvgEl.id = 'cj-nvg';
    nvgEl.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      'z-index:8800',
      'background:rgba(0,80,0,0.18)',
      'display:none'
    ].join(';');
    document.body.appendChild(nvgEl);

    // Message display
    messageEl = document.createElement('div');
    messageEl.id = 'cj-message';
    messageEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#FFD700',
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'text-shadow:0 0 8px #000',
      'z-index:9100',
      'display:none',
      'pointer-events:none',
      'text-align:center'
    ].join(';');
    document.body.appendChild(messageEl);
  }

  function _showHUD() {
    if (hudEl) hudEl.style.display = 'block';
    if (altimeterEl) altimeterEl.style.display = 'block';
  }

  function _hideHUD() {
    if (hudEl) hudEl.style.display = 'none';
    if (altimeterEl) altimeterEl.style.display = 'none';
    if (vignetteEl) vignetteEl.style.display = 'none';
    if (nvgEl) nvgEl.style.display = 'none';
    if (messageEl) messageEl.style.display = 'none';
  }

  function _updateHUD() {
    if (!hudEl || !altimeterEl) return;

    var altFt = Math.round(state.altitude * 27.97); // unit → feet approx
    var speedKts = Math.round(state.verticalSpeed * 0.5924); // unit/s → knots approx
    var chuteStatus = state.chuteDeployed ? 'DEPLOYED' : 'ARMED';
    var phaseStr = state.phase.toUpperCase();

    // Bearing to DZ
    var px = player ? player.position.x : 0;
    var pz = player ? player.position.z : 0;
    var dx = dz.x - px;
    var dz3 = dz.z - pz;
    var dzDist = Math.round(Math.sqrt(dx * dx + dz3 * dz3) * 4.2); // → metres
    var bearing = Math.round((Math.atan2(dx, -dz3) * 180 / Math.PI + 360) % 360);

    hudEl.textContent = 'ALT: ' + altFt + 'ft | SPEED: ' + speedKts + 'kts | CHUTE: ' + chuteStatus + ' | DZ: ' + bearing + '° ' + dzDist + 'm | ' + phaseStr + ' | HP:' + state.hp;

    // Wind arrow text symbol based on angle (8 directions)
    var windDirNames = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
    var windIdx = Math.round((wind.angle / (Math.PI * 2)) * 8) % 8;
    var windArrow = windDirNames[windIdx];

    altimeterEl.innerHTML = [
      '<div style="font-size:28px;font-weight:bold">' + Math.round(state.altitude) + '</div>',
      '<div>ALTITUDE</div>',
      '<div style="margin-top:6px">' + Math.round(state.verticalSpeed) + ' u/s</div>',
      '<div>AIRSPEED</div>',
      '<div style="margin-top:6px;font-size:18px">WIND ' + windArrow + '</div>',
      '<div>' + Math.round(wind.speed) + ' u/s</div>',
      '<div style="margin-top:6px;color:#FFD700">SCR: ' + state.score + '</div>'
    ].join('');
  }

  function _showMessage(text, seconds) {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.style.display = 'block';
    messageTimer = seconds;
  }

  function _updateMessage(delta) {
    if (messageTimer > 0) {
      messageTimer -= delta;
      if (messageTimer <= 0) {
        messageTimer = 0;
        if (messageEl) messageEl.style.display = 'none';
      }
    }
  }

  // ── Cleanup Three objects ─────────────────────────────────────────────────
  function _removeThreeObjects() {
    if (!scene) return;

    if (aircraftMesh) {
      scene.remove(aircraftMesh);
      aircraftMesh.geometry.dispose();
      aircraftMesh.material.dispose();
      aircraftMesh = null;
    }
    if (chuteMesh) {
      scene.remove(chuteMesh);
      chuteMesh.geometry.dispose();
      chuteMesh.material.dispose();
      chuteMesh = null;
    }
    if (chuteRisers) {
      scene.remove(chuteRisers);
      chuteRisers.geometry.dispose();
      chuteRisers.material.dispose();
      chuteRisers = null;
    }
    if (dzRing) {
      scene.remove(dzRing);
      dzRing.geometry.dispose();
      dzRing.material.dispose();
      dzRing = null;
    }
    for (var i = 0; i < starMeshes.length; i++) {
      scene.remove(starMeshes[i]);
      starMeshes[i].geometry.dispose();
      starMeshes[i].material.dispose();
    }
    starMeshes = [];
  }

  // ── Keyboard bindings ─────────────────────────────────────────────────────
  function _bindKeys() {
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup', _onKeyUp);
  }

  function _onKeyDown(e) {
    keys[e.code] = true;

    // Pre-jump options (idle only)
    if (state.phase === 'idle') {
      if (e.code === 'KeyN') {
        state.nightJump = !state.nightJump;
        // Visual feedback handled when jump starts
      }
      if (e.code === 'KeyL') {
        state.staticLine = !state.staticLine;
      }
    }

    // Initiate jump: C + J together
    if (keys['KeyC'] && keys['KeyJ'] && state.phase === 'idle') {
      _startJump();
    }

    // Manual chute deploy
    if (e.code === 'Space' && state.phase === 'freefall') {
      _deployChute(false);
      e.preventDefault();
    }
  }

  function _onKeyUp(e) {
    keys[e.code] = false;
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    reset: reset
  };
})();
