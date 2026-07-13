/**
 * sniper-rifle.js — Long-range Precision Sniper Rifle with Realistic Ballistics
 * Three.js browser game module
 *
 * Features:
 *   - Right-click hold to scope (FOV 75->8 over 0.3s)
 *   - Scope overlay: CSS div with radial-gradient mask + mil-dot canvas reticle
 *   - Breathing simulation with Shift breath-hold (4s, 20s cooldown)
 *   - Ballistic drop physics (900m/s muzzle, 9.8 gravity)
 *   - Random wind (0-15 mph), changes every 30s
 *   - Shot tracer: LineSegments visible 0.3s
 *   - Kill cam: 2s slow-motion replay on confirmed kill
 *   - Suppressor toggle (S+R): adds cylinder to barrel, window._sniperSuppressed
 *   - Ranging: R key while scoped shows HUD range readout
 *   - HUD: top-right status bar
 *
 * IIFE pattern, all var (never let/const), pure browser JS.
 * Exports: window.SniperRifle
 */
window.SniperRifle = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────────────── */
  var HIPFIRE_FOV       = 75;
  var SCOPE_FOV         = 8;
  var SCOPE_LERP_TIME   = 0.3;   /* seconds */

  var BULLET_VELOCITY   = 900;   /* m/s */
  var GRAVITY           = 9.8;   /* m/s^2 */

  var BREATH_AMP_NORMAL = 3;     /* px sway */
  var BREATH_AMP_HOLD   = 0.5;   /* px sway while holding breath */
  var BREATH_HOLD_DUR   = 4;     /* seconds */
  var BREATH_COOLDOWN   = 20;    /* seconds */

  var WIND_CHANGE_INT   = 30;    /* seconds between wind updates */
  var TRACER_DURATION   = 0.3;   /* seconds */
  var KILLCAM_DURATION  = 2.0;   /* seconds */
  var KILLCAM_TIMESCALE = 0.15;  /* slow-mo factor */

  var BREATH_FREQ_X     = 0.4;   /* Hz */
  var BREATH_FREQ_Y     = 0.6;   /* Hz */

  /* ── Internal State ─────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _renderer = null;
  var _enemies  = [];

  /* Scope state */
  var _scoped         = false;
  var _scopeLerp      = 0;       /* 0=hip, 1=scoped */
  var _currentFov     = HIPFIRE_FOV;

  /* Scope overlay DOM elements */
  var _scopeOverlay   = null;
  var _scopeCanvas    = null;
  var _scopeCtx       = null;
  var _hudBar         = null;

  /* Breathing */
  var _breathTime     = 0;
  var _holdBreath     = false;
  var _holdTimer      = 0;
  var _holdCooldown   = 0;
  var _breathAmp      = BREATH_AMP_NORMAL;
  var _reticleOffsetX = 0;
  var _reticleOffsetY = 0;

  /* Wind */
  var _windSpeed      = 0;
  var _windAngle      = 0;       /* radians */
  var _windTimer      = 0;

  /* Tracers / flash / projectiles */
  var _tracers        = [];      /* {mesh, timer} */

  /* Kill cam */
  var _killCamActive  = false;
  var _killCamTimer   = 0;
  var _killCamLine    = null;

  /* Suppressor */
  var _suppressed       = false;
  var _suppressorMesh   = null;

  /* Rifle mesh group */
  var _rifleGroup       = null;

  /* Ranging */
  var _showRange        = false;
  var _rangeValue       = 0;
  var _rangeTimer       = 0;     /* auto-hide after 3s */

  /* Key state */
  var _keys = {};

  /* ── Wind Helpers ────────────────────────────────────────────────────── */
  function _randomWind() {
    _windSpeed = Math.random() * 15;
    _windAngle = Math.random() * Math.PI * 2;
  }

  function _windMph() {
    return Math.round(_windSpeed);
  }

  function _windArrow() {
    var dirs = ['->',  '/^', '^',  '^\\ ', '<-', '\\ v', 'v', 'v/'];
    var idx  = Math.round(_windAngle / (Math.PI * 2 / 8)) % 8;
    if (idx < 0) { idx = idx + 8; }
    return dirs[idx];
  }

  function _windArrowUnicode() {
    var dirs = ['→', '↗', '↑', '↖',
                '←', '↙', '↓', '↘'];
    var idx  = Math.round(_windAngle / (Math.PI * 2 / 8)) % 8;
    if (idx < 0) { idx = idx + 8; }
    return dirs[idx];
  }

  /* ── DOM: Scope Overlay ─────────────────────────────────────────────── */
  function _createScopeOverlay() {
    _scopeOverlay = document.createElement('div');
    _scopeOverlay.id = 'sniper-scope-overlay';
    _scopeOverlay.style.position       = 'fixed';
    _scopeOverlay.style.top            = '0';
    _scopeOverlay.style.left           = '0';
    _scopeOverlay.style.width          = '100%';
    _scopeOverlay.style.height         = '100%';
    _scopeOverlay.style.pointerEvents  = 'none';
    _scopeOverlay.style.display        = 'none';
    _scopeOverlay.style.zIndex         = '900';
    /* Radial gradient circular black mask */
    _scopeOverlay.style.background =
      'radial-gradient(circle at center, transparent 28%, rgba(0,0,0,0.97) 30%)';

    /* Canvas for mil-dot reticle */
    _scopeCanvas = document.createElement('canvas');
    _scopeCanvas.style.position = 'absolute';
    _scopeCanvas.style.top      = '0';
    _scopeCanvas.style.left     = '0';
    _scopeCanvas.style.width    = '100%';
    _scopeCanvas.style.height   = '100%';
    _scopeOverlay.appendChild(_scopeCanvas);

    /* Wind/range label inside scope */
    var windLabel = document.createElement('div');
    windLabel.id = 'sniper-wind-label';
    windLabel.style.position        = 'absolute';
    windLabel.style.bottom          = '36%';
    windLabel.style.left            = '50%';
    windLabel.style.transform       = 'translateX(-50%)';
    windLabel.style.color           = 'rgba(180,220,180,0.9)';
    windLabel.style.font            = '11px monospace';
    windLabel.style.letterSpacing   = '1px';
    windLabel.style.textShadow      = '0 0 4px #0f0';
    windLabel.style.pointerEvents   = 'none';
    _scopeOverlay.appendChild(windLabel);

    document.body.appendChild(_scopeOverlay);
  }

  function _createHudBar() {
    _hudBar = document.createElement('div');
    _hudBar.id = 'sniper-hud-bar';
    _hudBar.style.position      = 'fixed';
    _hudBar.style.top           = '8px';
    _hudBar.style.right         = '8px';
    _hudBar.style.background    = 'rgba(0,0,0,0.65)';
    _hudBar.style.color         = '#9f9';
    _hudBar.style.font          = '12px monospace';
    _hudBar.style.padding       = '4px 10px';
    _hudBar.style.border        = '1px solid #3a4';
    _hudBar.style.borderRadius  = '3px';
    _hudBar.style.pointerEvents = 'none';
    _hudBar.style.zIndex        = '1000';
    _hudBar.style.letterSpacing = '1px';
    document.body.appendChild(_hudBar);
  }

  function _updateHud() {
    if (!_hudBar) { return; }
    var holdStatus = (_holdCooldown > 0) ?
      ('HOLD:' + Math.ceil(_holdCooldown) + 's') :
      'HOLD:READY';
    var suppText  = _suppressed ? ' | SUPPRESSED' : '';
    var rangeText = (_showRange && _scoped) ?
      (' | RANGE:' + Math.round(_rangeValue) + 'm') : '';
    _hudBar.textContent = 'SNIPER | WIND:' + _windMph() + 'mph' +
      _windArrowUnicode() + ' | ' + holdStatus + suppText + rangeText;
  }

  /* ── Canvas Reticle ─────────────────────────────────────────────────── */
  function _drawReticle() {
    if (!_scopeCanvas || !_scopeCtx) { return; }
    var w   = _scopeCanvas.width;
    var h   = _scopeCanvas.height;
    var cx  = w / 2 + _reticleOffsetX;
    var cy  = h / 2 + _reticleOffsetY;
    var ctx = _scopeCtx;

    ctx.clearRect(0, 0, w, h);

    /* Crosshair lines */
    ctx.strokeStyle = 'rgba(0,220,80,0.85)';
    ctx.lineWidth   = 1;

    /* Horizontal line */
    ctx.beginPath();
    ctx.moveTo(cx - 100, cy);
    ctx.lineTo(cx + 100, cy);
    ctx.stroke();

    /* Vertical line */
    ctx.beginPath();
    ctx.moveTo(cx, cy - 100);
    ctx.lineTo(cx, cy + 100);
    ctx.stroke();

    /* Mil-dots: every 20px along each axis */
    ctx.fillStyle = 'rgba(0,220,80,0.9)';
    var i;
    for (i = -4; i <= 4; i++) {
      if (i === 0) { continue; }
      /* Horizontal dots */
      ctx.beginPath();
      ctx.arc(cx + i * 20, cy, 2, 0, Math.PI * 2);
      ctx.fill();
      /* Vertical dots */
      ctx.beginPath();
      ctx.arc(cx, cy + i * 20, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    /* Center dot */
    ctx.beginPath();
    ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
    ctx.fill();

    /* Wind label */
    var windLabelEl = document.getElementById('sniper-wind-label');
    if (windLabelEl) {
      var rangeStr = (_showRange && _rangeValue > 0) ?
        ('  RANGE: ' + Math.round(_rangeValue) + 'm') : '';
      windLabelEl.textContent = 'WIND: ' + _windMph() + ' MPH ' +
        _windArrowUnicode() + rangeStr;
    }
  }

  function _resizeCanvas() {
    if (!_scopeCanvas) { return; }
    _scopeCanvas.width  = window.innerWidth;
    _scopeCanvas.height = window.innerHeight;
    _scopeCtx = _scopeCanvas.getContext('2d');
  }

  /* ── Rifle 3-D Mesh ─────────────────────────────────────────────────── */
  function _buildRifle() {
    _rifleGroup = new THREE.Group();

    /* Stock */
    var stockGeo  = new THREE.BoxGeometry(0.06, 0.06, 0.40);
    var darkMat   = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var stockMesh = new THREE.Mesh(stockGeo, darkMat);
    stockMesh.position.set(0, 0, 0.15);
    _rifleGroup.add(stockMesh);

    /* Receiver */
    var recvGeo  = new THREE.BoxGeometry(0.055, 0.055, 0.25);
    var recvMesh = new THREE.Mesh(recvGeo, darkMat);
    recvMesh.position.set(0, 0, -0.08);
    _rifleGroup.add(recvMesh);

    /* Barrel */
    var barrelGeo  = new THREE.CylinderGeometry(0.012, 0.012, 0.55, 8);
    var barrelMat  = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var barrelMesh = new THREE.Mesh(barrelGeo, barrelMat);
    barrelMesh.rotation.x = Math.PI / 2;
    barrelMesh.position.set(0, 0, -0.485);
    _rifleGroup.add(barrelMesh);

    /* Scope body */
    var scopeGeo  = new THREE.CylinderGeometry(0.018, 0.018, 0.22, 8);
    var scopeMat  = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var scopeMesh = new THREE.Mesh(scopeGeo, scopeMat);
    scopeMesh.rotation.x = Math.PI / 2;
    scopeMesh.position.set(0, 0.04, -0.06);
    _rifleGroup.add(scopeMesh);

    /* Scope lens front */
    var lensGeo  = new THREE.CircleGeometry(0.018, 8);
    var lensMat  = new THREE.MeshLambertMaterial({ color: 0x223344 });
    var lensMesh = new THREE.Mesh(lensGeo, lensMat);
    lensMesh.position.set(0, 0.04, -0.175);
    _rifleGroup.add(lensMesh);

    /* Bipod legs */
    var bipodMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var legGeo   = new THREE.CylinderGeometry(0.004, 0.004, 0.12, 4);

    var legL = new THREE.Mesh(legGeo, bipodMat);
    legL.position.set(-0.04, -0.06, -0.28);
    legL.rotation.z = 0.3;
    _rifleGroup.add(legL);

    var legR = new THREE.Mesh(legGeo, bipodMat);
    legR.position.set(0.04, -0.06, -0.28);
    legR.rotation.z = -0.3;
    _rifleGroup.add(legR);

    /* Position rifle in front of camera (FPS view-model) */
    _rifleGroup.position.set(0.18, -0.15, -0.45);
    _rifleGroup.rotation.y = Math.PI;

    if (_camera) {
      _camera.add(_rifleGroup);
    }
  }

  function _addSuppressor() {
    if (_suppressorMesh || !_rifleGroup) { return; }
    var supGeo  = new THREE.CylinderGeometry(0.022, 0.022, 0.18, 8);
    var supMat  = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    _suppressorMesh = new THREE.Mesh(supGeo, supMat);
    _suppressorMesh.rotation.x = Math.PI / 2;
    _suppressorMesh.position.set(0, 0, -0.84);  /* forward of barrel */
    _rifleGroup.add(_suppressorMesh);
  }

  function _removeSuppressor() {
    if (!_suppressorMesh || !_rifleGroup) { return; }
    _rifleGroup.remove(_suppressorMesh);
    _suppressorMesh.geometry.dispose();
    _suppressorMesh.material.dispose();
    _suppressorMesh = null;
  }

  /* ── Ballistics ─────────────────────────────────────────────────────── */
  /*
   * Compute vertical drop (m) at horizontal range dist (m).
   * Projectile motion: drop = 0.5 * g * t^2, t = dist / v
   */
  function _computeDrop(dist) {
    var t = dist / BULLET_VELOCITY;
    return 0.5 * GRAVITY * t * t;
  }

  /*
   * Compute wind drift (m) at horizontal range dist (m).
   * Simplified: drift = windComponent * t * 0.5 (half-drift approximation)
   */
  function _computeWindDrift(dist) {
    var t        = dist / BULLET_VELOCITY;
    var windMs   = _windSpeed * 0.44704; /* mph -> m/s */
    var sideComp = windMs * Math.sin(_windAngle);
    return sideComp * t * 0.5;
  }

  /* ── Shot Tracer ────────────────────────────────────────────────────── */
  function _spawnTracer(start, end) {
    var points = [start.clone(), end.clone()];
    var geo    = new THREE.BufferGeometry().setFromPoints(points);
    var mat    = new THREE.LineBasicMaterial({
      color: 0xffee44,
      transparent: true,
      opacity: 0.8
    });
    var line = new THREE.LineSegments(geo, mat);
    _scene.add(line);
    _tracers.push({ mesh: line, timer: TRACER_DURATION });
  }

  function _updateTracers(dt) {
    var i;
    for (i = _tracers.length - 1; i >= 0; i--) {
      _tracers[i].timer -= dt;
      _tracers[i].mesh.material.opacity =
        Math.max(0, (_tracers[i].timer / TRACER_DURATION) * 0.8);
      if (_tracers[i].timer <= 0) {
        _scene.remove(_tracers[i].mesh);
        _tracers[i].mesh.geometry.dispose();
        _tracers[i].mesh.material.dispose();
        _tracers.splice(i, 1);
      }
    }
  }

  /* ── Kill Cam ────────────────────────────────────────────────────────── */
  function _startKillCam(start, end) {
    _killCamActive = true;
    _killCamTimer  = KILLCAM_DURATION;

    /* Build arc line (parabolic bullet path) */
    var arcPoints = [];
    var segs      = 30;
    var dist      = start.distanceTo(end);
    var dir       = end.clone().sub(start).normalize();
    var i;
    for (i = 0; i <= segs; i++) {
      var frac = i / segs;
      var d    = dist * frac;
      var drop = _computeDrop(d);
      var pt   = start.clone().addScaledVector(dir, d);
      pt.y    -= drop;
      arcPoints.push(pt);
    }

    var arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
    var arcMat = new THREE.LineBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.9
    });
    _killCamLine = new THREE.LineSegments(arcGeo, arcMat);
    _scene.add(_killCamLine);
  }

  function _updateKillCam(dt) {
    if (!_killCamActive) { return; }
    _killCamTimer -= dt;
    if (_killCamLine) {
      _killCamLine.material.opacity =
        Math.max(0, (_killCamTimer / KILLCAM_DURATION) * 0.9);
    }
    if (_killCamTimer <= 0) {
      _killCamActive = false;
      if (_killCamLine) {
        _scene.remove(_killCamLine);
        _killCamLine.geometry.dispose();
        _killCamLine.material.dispose();
        _killCamLine = null;
      }
    }
  }

  /* ── Muzzle Flash ────────────────────────────────────────────────────── */
  function _spawnMuzzleFlash() {
    if (!_scene || !_camera) { return; }
    var intensity = _suppressed ? 0.4 : 1.2;
    var flashGeo  = new THREE.SphereGeometry(0.05, 6, 6);
    var flashMat  = new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      transparent: true,
      opacity: intensity
    });
    var flash = new THREE.Mesh(flashGeo, flashMat);

    /* Place at barrel end in world space */
    var barrelWorld = new THREE.Vector3();
    _camera.getWorldPosition(barrelWorld);
    var fwd = new THREE.Vector3();
    _camera.getWorldDirection(fwd);
    barrelWorld.addScaledVector(fwd, 0.55);
    flash.position.copy(barrelWorld);
    _scene.add(flash);

    /* Auto-remove after short delay via tracer list */
    _tracers.push({ mesh: flash, timer: 0.05 });
  }

  /* ── Ranging ─────────────────────────────────────────────────────────── */
  function _computeRange() {
    if (!_camera || !_enemies || _enemies.length === 0) { return 0; }
    var camPos  = new THREE.Vector3();
    _camera.getWorldPosition(camPos);
    var minDist = Infinity;
    var i;
    for (i = 0; i < _enemies.length; i++) {
      if (!_enemies[i] || !_enemies[i].position) { continue; }
      var d = camPos.distanceTo(_enemies[i].position);
      if (d < minDist) { minDist = d; }
    }
    return minDist === Infinity ? 0 : minDist;
  }

  /* ── Fire ─────────────────────────────────────────────────────────────── */
  function _fire() {
    if (!_camera || !_scene) { return; }

    _spawnMuzzleFlash();

    /* Ray from camera center */
    var raycaster = new THREE.Raycaster();
    var center    = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(center, _camera);

    /* Start point: barrel end approximation */
    var shotStart = new THREE.Vector3();
    _camera.getWorldPosition(shotStart);
    var fwdDir = new THREE.Vector3();
    _camera.getWorldDirection(fwdDir);
    shotStart.addScaledVector(fwdDir, 0.6);

    /* Find hit target */
    var hitPoint = null;
    var hitEnemy = null;

    if (_enemies && _enemies.length > 0) {
      var meshList = [];
      var i;
      for (i = 0; i < _enemies.length; i++) {
        var en = _enemies[i];
        if (!en) { continue; }
        var obj = en.mesh || en;
        if (obj && obj.isObject3D) {
          meshList.push(obj);
          obj.userData._enemyRef = en;
        }
      }
      var intersects = raycaster.intersectObjects(meshList, true);
      if (intersects.length > 0) {
        hitPoint = intersects[0].point.clone();
        var obj2 = intersects[0].object;
        while (obj2) {
          if (obj2.userData && obj2.userData._enemyRef) {
            hitEnemy = obj2.userData._enemyRef;
            break;
          }
          obj2 = obj2.parent;
        }
      }
    }

    /* Default far impact point */
    if (!hitPoint) {
      hitPoint = shotStart.clone().addScaledVector(fwdDir, 500);
    }

    /* Apply ballistic drop and wind drift */
    var dist   = shotStart.distanceTo(hitPoint);
    var drop   = _computeDrop(dist);
    var drift  = _computeWindDrift(dist);

    var adjustedHit = hitPoint.clone();
    adjustedHit.y  -= drop;

    var rightDir = new THREE.Vector3();
    rightDir.crossVectors(fwdDir, new THREE.Vector3(0, 1, 0)).normalize();
    adjustedHit.addScaledVector(rightDir, drift);

    /* Spawn tracer */
    _spawnTracer(shotStart, adjustedHit);

    /* Damage enemy */
    if (hitEnemy) {
      if (typeof hitEnemy.hp !== 'undefined') {
        hitEnemy.hp -= 100;
        if (hitEnemy.hp <= 0) {
          _startKillCam(shotStart, adjustedHit);
        }
      } else if (typeof hitEnemy.health !== 'undefined') {
        hitEnemy.health -= 100;
        if (hitEnemy.health <= 0) {
          _startKillCam(shotStart, adjustedHit);
        }
      }
    }
  }

  /* ── Input Handlers ──────────────────────────────────────────────────── */
  function _onMouseDown(e) {
    if (e.button === 2) {
      e.preventDefault();
      _scoped = true;
    }
    if (e.button === 0 && _scoped) {
      _fire();
    }
  }

  function _onMouseUp(e) {
    if (e.button === 2) {
      _scoped = false;
    }
  }

  function _onContextMenu(e) {
    e.preventDefault();
  }

  function _onKeyDown(e) {
    _keys[e.code] = true;

    /* Shift: hold breath while scoped */
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      if (_scoped && _holdCooldown <= 0 && !_holdBreath) {
        _holdBreath = true;
        _holdTimer  = BREATH_HOLD_DUR;
      }
    }

    /* R key: ranging (while scoped) or S+R for suppressor toggle */
    if (e.code === 'KeyR') {
      if (_keys['KeyS']) {
        _suppressed = !_suppressed;
        window._sniperSuppressed = _suppressed;
        if (_suppressed) {
          _addSuppressor();
        } else {
          _removeSuppressor();
        }
      } else if (_scoped) {
        _showRange  = true;
        _rangeTimer = 3;
        _rangeValue = _computeRange();
      }
    }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;

    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      if (_holdBreath) {
        _holdBreath   = false;
        _holdCooldown = BREATH_COOLDOWN;
      }
    }
  }

  function _onResize() {
    _resizeCanvas();
  }

  /* ── Update ──────────────────────────────────────────────────────────── */
  function update(delta) {
    if (!_camera) { return; }

    /* Kill cam slow-mo: scale delta */
    var dt = _killCamActive ? delta * KILLCAM_TIMESCALE : delta;

    /* Wind timer */
    _windTimer += dt;
    if (_windTimer >= WIND_CHANGE_INT) {
      _windTimer = 0;
      _randomWind();
    }

    /* Scope FOV lerp */
    var targetLerp = _scoped ? 1 : 0;
    var lerpSpeed  = dt / SCOPE_LERP_TIME;
    _scopeLerp    += (targetLerp - _scopeLerp) * Math.min(lerpSpeed, 1);
    _currentFov    = HIPFIRE_FOV + (_scopeLerp * (SCOPE_FOV - HIPFIRE_FOV));
    _camera.fov    = _currentFov;
    _camera.updateProjectionMatrix();

    /* Show/hide scope overlay */
    if (_scopeOverlay) {
      _scopeOverlay.style.display = (_scopeLerp > 0.5) ? 'block' : 'none';
    }

    /* Breath hold timer */
    if (_holdBreath) {
      _holdTimer -= dt;
      if (_holdTimer <= 0) {
        _holdBreath   = false;
        _holdTimer    = 0;
        _holdCooldown = BREATH_COOLDOWN;
      }
    }
    if (_holdCooldown > 0) {
      _holdCooldown -= dt;
      if (_holdCooldown < 0) { _holdCooldown = 0; }
    }

    /* Breathing sway */
    _breathAmp      = _holdBreath ? BREATH_AMP_HOLD : BREATH_AMP_NORMAL;
    _breathTime    += dt;
    _reticleOffsetX = Math.sin(_breathTime * Math.PI * 2 * BREATH_FREQ_X) * _breathAmp;
    _reticleOffsetY = Math.cos(_breathTime * Math.PI * 2 * BREATH_FREQ_Y) * _breathAmp;

    /* Draw reticle if scoped */
    if (_scopeLerp > 0.5) {
      _drawReticle();
    }

    /* Ranging auto-hide */
    if (_showRange) {
      _rangeTimer -= dt;
      if (_rangeTimer <= 0) {
        _showRange  = false;
        _rangeValue = 0;
      }
    }

    /* Update tracers */
    _updateTracers(dt);

    /* Update kill cam */
    _updateKillCam(dt);

    /* Update HUD */
    _updateHud();
  }

  /* ── Init ────────────────────────────────────────────────────────────── */
  function init(scene, camera, renderer, enemies) {
    _scene    = scene;
    _camera   = camera;
    _renderer = renderer;
    _enemies  = enemies || [];

    _randomWind();

    _buildRifle();

    _createScopeOverlay();
    _resizeCanvas();

    _createHudBar();

    document.addEventListener('mousedown',   _onMouseDown);
    document.addEventListener('mouseup',     _onMouseUp);
    document.addEventListener('contextmenu', _onContextMenu);
    document.addEventListener('keydown',     _onKeyDown);
    document.addEventListener('keyup',       _onKeyUp);
    window.addEventListener('resize',        _onResize);

    window._sniperSuppressed = false;
  }

  /* ── Reset ───────────────────────────────────────────────────────────── */
  function reset() {
    _scoped         = false;
    _scopeLerp      = 0;
    _currentFov     = HIPFIRE_FOV;
    _holdBreath     = false;
    _holdTimer      = 0;
    _holdCooldown   = 0;
    _breathTime     = 0;
    _reticleOffsetX = 0;
    _reticleOffsetY = 0;
    _windTimer      = 0;
    _showRange      = false;
    _rangeValue     = 0;
    _rangeTimer     = 0;
    _killCamActive  = false;
    _killCamTimer   = 0;
    _keys           = {};

    _randomWind();

    /* Clear tracers */
    var i;
    for (i = _tracers.length - 1; i >= 0; i--) {
      if (_scene) { _scene.remove(_tracers[i].mesh); }
      if (_tracers[i].mesh.geometry) { _tracers[i].mesh.geometry.dispose(); }
      if (_tracers[i].mesh.material) { _tracers[i].mesh.material.dispose(); }
    }
    _tracers = [];

    /* Clear kill cam line */
    if (_killCamLine && _scene) {
      _scene.remove(_killCamLine);
      _killCamLine.geometry.dispose();
      _killCamLine.material.dispose();
      _killCamLine = null;
    }

    /* Remove suppressor */
    if (_suppressed) {
      _removeSuppressor();
      _suppressed              = false;
      window._sniperSuppressed = false;
    }

    /* Reset FOV */
    if (_camera) {
      _camera.fov = HIPFIRE_FOV;
      _camera.updateProjectionMatrix();
    }

    /* Hide overlays */
    if (_scopeOverlay) {
      _scopeOverlay.style.display = 'none';
    }

    _updateHud();
  }

  /* ── Public API ──────────────────────────────────────────────────────── */
  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
