// breaching-charges.js — Browser-based Three.js game module for door and wall breaching
// B+C key to enter breach mode, plant charge on nearest wall/door within 2 units
// Shift+B to trigger detonator with 1s countdown
// No let/const — only var throughout, IIFE pattern
window.BreachingCharges = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var MAX_CHARGES       = 4;
  var PLANT_RANGE       = 2.0;
  var DETONATOR_DELAY   = 1.0;   // seconds before charges blow after Shift+B

  var CHARGE_TYPES = ['STANDARD', 'SHAPED', 'THERMITE'];
  var CHARGE_TYPE_IDX = 0;       // current type index

  var BLAST_RADIUS = {
    STANDARD: 3,
    SHAPED:   6,
    THERMITE: 2
  };
  var THERMITE_BURN_TIME = 5.0;  // seconds

  // Scores
  var SCORE_WALL_BREACH = 200;
  var SCORE_DOOR_BREACH = 150;

  // ── State ──────────────────────────────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;

  var _charges        = [];      // planted charge objects
  var _breachMode     = false;   // B+C held to enter breach mode
  var _bKeyDown       = false;
  var _cKeyDown       = false;

  var _ghostMesh      = null;    // translucent preview mesh
  var _ghostWireMesh  = null;

  var _detonatorArmed = false;
  var _detonatorTimer = 0;
  var _detonatorFlash = 0;       // flash accumulator

  var _score          = 0;
  var _keysRegistered = false;
  var _wheelBound     = false;

  var _hudEl          = null;
  var _flashOverlay   = null;

  // ── Helper: get scene/camera from globals if not set ──────────────────────
  function _getScene() {
    return _scene || window.scene || (window.GameManager && window.GameManager.scene) || null;
  }
  function _getCamera() {
    return _camera || window.camera || (window.GameManager && window.GameManager.camera) || null;
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (_hudEl && document.body.contains(_hudEl)) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'breachingChargesHUD';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:14px',
      'left:14px',
      'font-family:monospace',
      'font-size:13px',
      'color:#ff4400',
      'background:rgba(0,0,0,0.6)',
      'padding:5px 12px',
      'border-radius:4px',
      'z-index:1010',
      'pointer-events:none',
      'user-select:none',
      'border:1px solid rgba(200,60,20,0.5)',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hudEl);
    _updateHUD();
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var remaining = MAX_CHARGES - _charges.length;
    var typeStr = CHARGE_TYPES[CHARGE_TYPE_IDX];
    var modeStr = _breachMode ? ' <span style="color:#ffff00">[BREACH MODE]</span>' : '';
    var detonStr = _detonatorArmed ? ' <span style="color:#ff0000">DETONATING...</span>' : '';
    _hudEl.innerHTML = 'BREACHING [C:' + remaining + '] [TYPE: ' + typeStr + ']' + modeStr + detonStr;
  }

  // ── Flash overlay for detonator countdown ─────────────────────────────────
  function _ensureFlashOverlay() {
    if (_flashOverlay && document.body.contains(_flashOverlay)) return;
    _flashOverlay = document.createElement('div');
    _flashOverlay.id = 'breachingFlashOverlay';
    _flashOverlay.style.cssText = [
      'position:fixed',
      'top:0','left:0','right:0','bottom:0',
      'pointer-events:none',
      'z-index:1009',
      'background:#ff2200',
      'opacity:0',
      'transition:none'
    ].join(';');
    document.body.appendChild(_flashOverlay);
  }

  // ── Build charge disc mesh (0.8x0.8x0.1, red) with wire leads ─────────────
  function _buildChargeMesh(opacity) {
    var group = new THREE.Group();

    // Main disc body: BoxGeometry
    var bodyGeo  = new THREE.BoxGeometry(0.8, 0.8, 0.1);
    var bodyMat  = new THREE.MeshBasicMaterial({
      color: 0xFF2200,
      transparent: opacity < 1,
      opacity: opacity !== undefined ? opacity : 1.0
    });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Wire leads: LineSegments from corners to centre
    var wirePoints = [];
    wirePoints.push( 0.35,  0.35, 0.06);   wirePoints.push(0, 0, 0.06);
    wirePoints.push(-0.35,  0.35, 0.06);   wirePoints.push(0, 0, 0.06);
    wirePoints.push( 0.35, -0.35, 0.06);   wirePoints.push(0, 0, 0.06);
    wirePoints.push(-0.35, -0.35, 0.06);   wirePoints.push(0, 0, 0.06);

    var wireGeo = new THREE.BufferGeometry();
    var verts = new Float32Array(wirePoints);
    wireGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    var wireMat = new THREE.LineBasicMaterial({
      color: 0xFFFF00,
      transparent: opacity < 1,
      opacity: opacity !== undefined ? opacity : 1.0
    });
    var wires = new THREE.LineSegments(wireGeo, wireMat);
    group.add(wires);

    // Small LED dot
    var ledGeo = new THREE.BoxGeometry(0.08, 0.08, 0.12);
    var ledMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
    var led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0, 0, 0.06);
    group.add(led);

    return { group: group, bodyMat: bodyMat, wireMat: wireMat, ledMesh: led };
  }

  // ── Ghost preview mesh ────────────────────────────────────────────────────
  function _createGhost() {
    _destroyGhost();
    var built = _buildChargeMesh(0.35);
    _ghostMesh = built.group;
    var sc = _getScene();
    if (sc) sc.add(_ghostMesh);
  }

  function _destroyGhost() {
    var sc = _getScene();
    if (_ghostMesh) {
      if (sc) sc.remove(_ghostMesh);
      _ghostMesh = null;
    }
  }

  // ── Find nearest wall/door object within PLANT_RANGE ──────────────────────
  function _findNearestTarget() {
    var cam = _getCamera();
    if (!cam) return null;

    // Try _wallObjects global first
    var walls = window._wallObjects;
    if (!walls || !walls.length) return null;

    var camPos = cam.position;
    var best = null;
    var bestDist = PLANT_RANGE;

    for (var i = 0; i < walls.length; i++) {
      var w = walls[i];
      if (!w) continue;
      var wPos = w.position || (w.mesh && w.mesh.position);
      if (!wPos) continue;
      var dx = wPos.x - camPos.x;
      var dy = wPos.y - camPos.y;
      var dz = wPos.z - camPos.z;
      var d  = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < bestDist) {
        bestDist = d;
        best = { obj: w, pos: wPos.clone(), dist: d };
      }
    }
    return best;
  }

  // ── Raycasting fallback surface finder ────────────────────────────────────
  function _raycastSurface() {
    var cam = _getCamera();
    if (!cam) return null;

    var dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    var origin = cam.position.clone();

    var STEP  = 0.2;
    var steps = Math.ceil(PLANT_RANGE / STEP);
    for (var s = 1; s <= steps; s++) {
      var dist = s * STEP;
      var tx = origin.x + dir.x * dist;
      var ty = origin.y + dir.y * dist;
      var tz = origin.z + dir.z * dist;
      var vx = Math.floor(tx);
      var vy = Math.floor(ty);
      var vz = Math.floor(tz);
      var solid = false;
      if (window.VoxelWorld) {
        if (typeof window.VoxelWorld.isSolid === 'function') {
          solid = window.VoxelWorld.isSolid(vx, vy, vz);
        } else if (typeof window.VoxelWorld.getBlock === 'function') {
          solid = !!window.VoxelWorld.getBlock(vx, vy, vz);
        } else if (typeof window.VoxelWorld.getVoxel === 'function') {
          solid = !!window.VoxelWorld.getVoxel(vx, vy, vz);
        }
      }
      if (solid) {
        var contactDist = dist - STEP * 0.5;
        var pos = new THREE.Vector3(
          origin.x + dir.x * contactDist,
          origin.y + dir.y * contactDist,
          origin.z + dir.z * contactDist
        );
        return { pos: pos, normal: dir.clone().negate().normalize(), isDoor: false };
      }
    }

    // Fallback: place 1.5 units ahead
    var fallbackPos = origin.clone().addScaledVector(dir, 1.5);
    return { pos: fallbackPos, normal: dir.clone().negate().normalize(), isDoor: false };
  }

  // ── Plant a charge ────────────────────────────────────────────────────────
  function _plantCharge() {
    var sc = _getScene();
    if (!sc) return;

    // Auto-detonate oldest if at max
    if (_charges.length >= MAX_CHARGES) {
      var oldest = _charges.shift();
      if (oldest) _detonateCharge(oldest);
    }

    // Find target
    var wallTarget = _findNearestTarget();
    var surface    = _raycastSurface();

    var plantPos, isDoor, wallObj;
    if (wallTarget && wallTarget.dist <= PLANT_RANGE) {
      plantPos = wallTarget.pos.clone();
      isDoor   = !!(wallTarget.obj && wallTarget.obj.isDoor);
      wallObj  = wallTarget.obj;
    } else if (surface) {
      plantPos = surface.pos.clone();
      isDoor   = false;
      wallObj  = null;
    } else {
      return;
    }

    // Build mesh
    var built = _buildChargeMesh(1.0);
    var group = built.group;

    // Orient facing camera
    var cam = _getCamera();
    if (cam) {
      var dir = new THREE.Vector3();
      cam.getWorldDirection(dir);
      var angle = Math.atan2(dir.x, dir.z);
      group.rotation.y = angle;
    }

    group.position.copy(plantPos);
    sc.add(group);

    var chargeObj = {
      group:     group,
      bodyMat:   built.bodyMat,
      wireMat:   built.wireMat,
      ledMesh:   built.ledMesh,
      pos:       plantPos.clone(),
      type:      CHARGE_TYPES[CHARGE_TYPE_IDX],
      isDoor:    isDoor,
      wallObj:   wallObj,
      detonated: false,
      ledTimer:  0,
      ledOn:     false,
      thermiteTimer: 0
    };

    _charges.push(chargeObj);
    _updateHUD();
    _toast('Charge planted [' + chargeObj.type + ']', '#ffaa00');
  }

  // ── Detonate a single charge ───────────────────────────────────────────────
  function _detonateCharge(charge) {
    if (!charge || charge.detonated) return;
    charge.detonated = true;

    var sc  = _getScene();
    if (sc && charge.group) sc.remove(charge.group);

    var pos    = charge.pos;
    var radius = BLAST_RADIUS[charge.type] || 3;

    // VFX
    _vfxBlast(pos, charge.type);

    // Structural damage
    _damageWalls(pos, radius, charge.wallObj);

    // Score
    if (charge.isDoor) {
      _score += SCORE_DOOR_BREACH;
      if (window._gameScore !== undefined) window._gameScore += SCORE_DOOR_BREACH;
      _toast('+' + SCORE_DOOR_BREACH + ' DOOR BREACH', '#00ff88');
    } else {
      _score += SCORE_WALL_BREACH;
      if (window._gameScore !== undefined) window._gameScore += SCORE_WALL_BREACH;
      _toast('+' + SCORE_WALL_BREACH + ' WALL BREACH', '#ffaa00');
    }

    // Thermite: start burn timer
    if (charge.type === 'THERMITE') {
      _startThermiteBurn(pos, charge.wallObj);
    }

    _updateHUD();
  }

  // ── Damage walls in blast radius ──────────────────────────────────────────
  function _damageWalls(pos, radius, primaryWall) {
    // Primary wall
    if (primaryWall && primaryWall.material) {
      primaryWall.material.transparent = true;
      primaryWall.material.opacity = 0;
      if (primaryWall.material.needsUpdate !== undefined) {
        primaryWall.material.needsUpdate = true;
      }
    }

    // All _wallObjects within blast radius
    var walls = window._wallObjects;
    if (!walls) return;
    for (var i = 0; i < walls.length; i++) {
      var w = walls[i];
      if (!w || w === primaryWall) continue;
      var wPos = w.position || (w.mesh && w.mesh.position);
      if (!wPos) continue;
      var dx = wPos.x - pos.x;
      var dy = wPos.y - pos.y;
      var dz = wPos.z - pos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist <= radius) {
        var mat = w.material || (w.mesh && w.mesh.material);
        if (mat) {
          mat.transparent = true;
          mat.opacity = 0;
          if (mat.needsUpdate !== undefined) mat.needsUpdate = true;
        }
      }
    }
  }

  // ── Thermite burn: slowly dissolve wall over THERMITE_BURN_TIME ───────────
  function _startThermiteBurn(pos, wallObj) {
    if (!wallObj) return;
    var mat = wallObj.material || (wallObj.mesh && wallObj.mesh.material);
    if (!mat) return;
    mat.transparent = true;

    var elapsed = 0;
    var startOpacity = mat.opacity !== undefined ? mat.opacity : 1.0;

    function burnStep(ts) {
      elapsed += 0.016;
      var t = elapsed / THERMITE_BURN_TIME;
      if (t >= 1) {
        mat.opacity = 0;
        if (mat.needsUpdate !== undefined) mat.needsUpdate = true;
        return;
      }
      mat.opacity = startOpacity * (1 - t);
      if (mat.needsUpdate !== undefined) mat.needsUpdate = true;
      requestAnimationFrame(burnStep);
    }
    requestAnimationFrame(burnStep);
  }

  // ── VFX: blast flash, shockwave ring, debris ──────────────────────────────
  function _vfxBlast(pos, chargeType) {
    var sc = _getScene();
    if (!sc) return;

    // Expanding flash sphere 0xFFAA00
    var flashGeo = new THREE.SphereGeometry(0.3, 10, 8);
    var flashMat = new THREE.MeshBasicMaterial({
      color: 0xFFAA00,
      transparent: true,
      opacity: 0.9
    });
    var flashMesh = new THREE.Mesh(flashGeo, flashMat);
    flashMesh.position.copy(pos);
    sc.add(flashMesh);

    // Shockwave ring: CylinderGeometry
    var ringGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 20, 1, true);
    var ringMat = new THREE.MeshBasicMaterial({
      color: 0xFF8800,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    var ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.copy(pos);
    sc.add(ringMesh);

    // Debris: 8 BoxGeometry chunks
    var debrisList = [];
    for (var di = 0; di < 8; di++) {
      var dGeo  = new THREE.BoxGeometry(
        0.08 + Math.random() * 0.15,
        0.08 + Math.random() * 0.15,
        0.08 + Math.random() * 0.15
      );
      var dMat  = new THREE.MeshBasicMaterial({ color: 0x886644 });
      var dMesh = new THREE.Mesh(dGeo, dMat);
      dMesh.position.copy(pos);
      sc.add(dMesh);

      var angle = (di / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
      var speed = 3 + Math.random() * 5;
      debrisList.push({
        mesh: dMesh,
        mat:  dMat,
        geo:  dGeo,
        vx: Math.cos(angle) * speed,
        vy: 1.5 + Math.random() * 3,
        vz: Math.sin(angle) * speed,
        life: 1.0 + Math.random() * 0.8
      });
    }

    // Shaped charge cone light
    var pointLight = null;
    if (chargeType === 'SHAPED') {
      pointLight = new THREE.PointLight(0xFF6600, 5, 8);
      pointLight.position.copy(pos);
      sc.add(pointLight);
    }

    var startTs = null;
    var blastRadius = BLAST_RADIUS[chargeType] || 3;
    var lastTs = null;

    function animBlast(ts) {
      if (!startTs) { startTs = ts; lastTs = ts; }
      var elapsed = (ts - startTs) / 1000;
      var dt      = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;

      // Flash sphere expands and fades
      var flashT = Math.min(elapsed / 0.5, 1);
      var targetR = blastRadius * flashT;
      flashMesh.scale.setScalar(targetR / 0.3 + 0.01);
      flashMat.opacity = 0.9 * (1 - flashT);

      // Shockwave ring expands
      var ringT = Math.min(elapsed / 0.6, 1);
      var ringR = blastRadius * ringT;
      ringMesh.scale.set(ringR + 0.01, 1, ringR + 0.01);
      ringMat.opacity = 0.7 * (1 - ringT);

      // Debris physics
      for (var i = 0; i < debrisList.length; i++) {
        var d = debrisList[i];
        if (!d || d.life <= 0) continue;
        d.life -= dt;
        d.vy -= 9.8 * dt;
        d.mesh.position.x += d.vx * dt;
        d.mesh.position.y += d.vy * dt;
        d.mesh.position.z += d.vz * dt;
        if (d.mesh.position.y < 0.05) {
          d.mesh.position.y = 0.05;
          d.vy *= -0.2;
        }
        if (d.life <= 0 && sc) {
          sc.remove(d.mesh);
          d.geo.dispose();
          d.mat.dispose();
          debrisList[i] = null;
        }
      }

      // Shaped charge extra light fade
      if (pointLight) {
        pointLight.intensity = 5 * (1 - Math.min(elapsed / 0.4, 1));
        if (elapsed >= 0.4 && sc) {
          sc.remove(pointLight);
          pointLight = null;
        }
      }

      if (elapsed < 1.5) {
        requestAnimationFrame(animBlast);
      } else {
        // Cleanup
        if (sc) {
          sc.remove(flashMesh);
          sc.remove(ringMesh);
        }
        flashGeo.dispose();
        flashMat.dispose();
        ringGeo.dispose();
        ringMat.dispose();
      }
    }
    requestAnimationFrame(animBlast);

    // Audio SFX
    _playBlastSFX();
  }

  // ── Audio ─────────────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (!window._audioCtx) {
      try {
        if (typeof AudioContext !== 'undefined') {
          window._audioCtx = new AudioContext();
        } else if (typeof webkitAudioContext !== 'undefined') {
          window._audioCtx = new webkitAudioContext(); // eslint-disable-line new-cap
        }
      } catch (e) {}
    }
    return window._audioCtx || null;
  }

  function _playBlastSFX() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(2800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.7, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } catch (e) {}
  }

  function _playClickSFX() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.setValueAtTime(1800, ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }

  // ── Toast helper ──────────────────────────────────────────────────────────
  function _toast(msg, color) {
    if (typeof HUD !== 'undefined' && HUD && HUD.showToast) {
      HUD.showToast(msg, 2200, color || '#ff4400');
      return;
    }
    // Fallback DOM toast
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:30%',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:14px',
      'color:' + (color || '#ff4400'),
      'background:rgba(0,0,0,0.7)',
      'padding:5px 14px',
      'border-radius:4px',
      'z-index:2000',
      'pointer-events:none'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2200);
  }

  // ── Update ghost preview position ──────────────────────────────────────────
  function _updateGhost() {
    if (!_breachMode) {
      _destroyGhost();
      return;
    }
    if (!_ghostMesh) _createGhost();

    var surface = _raycastSurface();
    if (surface && _ghostMesh) {
      _ghostMesh.position.copy(surface.pos);
      var cam = _getCamera();
      if (cam) {
        var dir = new THREE.Vector3();
        cam.getWorldDirection(dir);
        _ghostMesh.rotation.y = Math.atan2(dir.x, dir.z);
      }
    }
  }

  // ── Key/Scroll registration ───────────────────────────────────────────────
  function _registerInput() {
    if (_keysRegistered) return;
    _keysRegistered = true;

    document.addEventListener('keydown', function (e) {
      if (e.code === 'KeyB') {
        _bKeyDown = true;
        // Shift+B — trigger detonator
        if (e.shiftKey && !e.altKey && !e.ctrlKey) {
          e.preventDefault();
          _armDetonator();
          return;
        }
      }
      if (e.code === 'KeyC') {
        _cKeyDown = true;
      }

      // B+C held together → enter breach mode and plant
      if (_bKeyDown && _cKeyDown && !_detonatorArmed) {
        e.preventDefault();
        if (!_breachMode) {
          _breachMode = true;
          _updateHUD();
          _createGhost();
        }
        _plantCharge();
      }
    });

    document.addEventListener('keyup', function (e) {
      if (e.code === 'KeyB') { _bKeyDown = false; }
      if (e.code === 'KeyC') { _cKeyDown = false; }

      // Exit breach mode when both B and C are released
      if (!_bKeyDown && !_cKeyDown && _breachMode) {
        _breachMode = false;
        _destroyGhost();
        _updateHUD();
      }
    });

    // Mouse wheel to cycle charge types
    if (!_wheelBound) {
      _wheelBound = true;
      document.addEventListener('wheel', function (e) {
        if (!_breachMode) return;
        if (e.deltaY > 0) {
          CHARGE_TYPE_IDX = (CHARGE_TYPE_IDX + 1) % CHARGE_TYPES.length;
        } else {
          CHARGE_TYPE_IDX = (CHARGE_TYPE_IDX - 1 + CHARGE_TYPES.length) % CHARGE_TYPES.length;
        }
        _updateHUD();
        _toast('Charge type: ' + CHARGE_TYPES[CHARGE_TYPE_IDX], '#ffcc44');
      }, { passive: true });
    }
  }

  // ── Arm detonator: 1s countdown then blow all charges ────────────────────
  function _armDetonator() {
    if (_charges.length === 0) {
      _toast('No charges planted!', '#ff4444');
      return;
    }
    if (_detonatorArmed) return;

    _detonatorArmed  = true;
    _detonatorTimer  = DETONATOR_DELAY;
    _detonatorFlash  = 0;
    _toast('DETONATOR ARMED — FIRE IN THE HOLE!', '#ff0000');
    _updateHUD();
    _ensureFlashOverlay();
    _playClickSFX();
  }

  // ── Detonate all charges ──────────────────────────────────────────────────
  function _detonateAll() {
    for (var i = 0; i < _charges.length; i++) {
      _detonateCharge(_charges[i]);
    }
    _charges = [];
    _updateHUD();
  }

  // ── Public: init ──────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene  || null;
    _camera = camera || null;

    _charges        = [];
    _breachMode     = false;
    _bKeyDown       = false;
    _cKeyDown       = false;
    _detonatorArmed = false;
    _detonatorTimer = 0;
    _detonatorFlash = 0;
    _score          = 0;
    CHARGE_TYPE_IDX = 0;

    _destroyGhost();
    _ensureHUD();
    _ensureFlashOverlay();
    _registerInput();
    _updateHUD();
  }

  // ── Public: update (called each frame with delta seconds) ────────────────
  function update(delta) {
    if (!delta || delta <= 0) return;

    // Update ghost
    _updateGhost();

    // Detonator countdown with flash
    if (_detonatorArmed) {
      _detonatorTimer -= delta;
      _detonatorFlash += delta;

      // Flash overlay blink at 5Hz
      if (_flashOverlay) {
        var flashOn = Math.floor(_detonatorFlash * 5) % 2 === 0;
        _flashOverlay.style.opacity = flashOn ? '0.25' : '0';
      }

      if (_detonatorTimer <= 0) {
        _detonatorArmed = false;
        _detonatorTimer = 0;
        _detonatorFlash = 0;
        if (_flashOverlay) _flashOverlay.style.opacity = '0';
        _detonateAll();
      }
      _updateHUD();
    }

    // LED blink on planted charges
    for (var i = 0; i < _charges.length; i++) {
      var ch = _charges[i];
      if (!ch || ch.detonated) continue;
      ch.ledTimer += delta;
      if (ch.ledTimer >= 0.5) {
        ch.ledTimer = 0;
        ch.ledOn = !ch.ledOn;
        if (ch.ledMesh && ch.ledMesh.material) {
          ch.ledMesh.material.color.setHex(ch.ledOn ? 0xFF0000 : 0x440000);
        }
      }
    }
  }

  // ── Public: reset ─────────────────────────────────────────────────────────
  function reset() {
    var sc = _getScene();

    for (var i = 0; i < _charges.length; i++) {
      var ch = _charges[i];
      if (ch && ch.group && sc) sc.remove(ch.group);
    }
    _charges = [];

    _destroyGhost();

    _breachMode     = false;
    _bKeyDown       = false;
    _cKeyDown       = false;
    _detonatorArmed = false;
    _detonatorTimer = 0;
    _detonatorFlash = 0;
    _score          = 0;
    CHARGE_TYPE_IDX = 0;

    if (_flashOverlay) _flashOverlay.style.opacity = '0';
    _updateHUD();
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();
