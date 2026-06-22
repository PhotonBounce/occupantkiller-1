/* ───────────────────────────────────────────────────────────────────────
   MINEFIELD SYSTEM — anti-personnel mines + F3 metal detector
   Spawns a minefield zone, handles detection beeping, mine triggering,
   enemy damage, and player disarming. All var, IIFE pattern.
   ─────────────────────────────────────────────────────────────────────── */
window.MinefieldSystem = (function () {

  // ── State ────────────────────────────────────────────────────────────
  var _scene = null;
  var _mines = [];            // { mesh, x, z, triggered, disarming, disarmProgress }
  var _warningSigns = [];     // corner warning sign meshes
  var _detectorActive = false;
  var _detectorHudEl = null;
  var _detectorToastEl = null;
  var _beepTimer = 0;
  var _beepInterval = 0;      // seconds between beeps (0 = no beep)
  var _disarmTimer = 0;       // time Ctrl has been held over a mine
  var _disarmTarget = null;   // mine being disarmed
  var _disarmBarEl = null;
  var _ctrlHeld = false;
  var _initialized = false;
  var _audioCtxCache = null;

  // ── Constants ────────────────────────────────────────────────────────
  var MINE_TRIGGER_RADIUS = 0.3;
  var ENEMY_TRIGGER_RADIUS = 0.3;
  var DISARM_RADIUS = 0.4;
  var DISARM_TIME = 3.0;       // seconds to hold Ctrl
  var MINE_VISIBLE_RADIUS = 3; // player must be within 3 units to see mine normally
  var SPEED_PENALTY = 0.5;     // 50% speed when detector active
  var SCORE_DISARM = 150;

  // ── Audio helpers ────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (_audioCtxCache && _audioCtxCache.state !== 'closed') return _audioCtxCache;
    try {
      _audioCtxCache = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      _audioCtxCache = null;
    }
    return _audioCtxCache;
  }

  function _beep(freq, duration) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq || 800;
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (duration || 0.05));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (duration || 0.05));
    } catch (e) {}
  }

  // ── HUD elements ─────────────────────────────────────────────────────
  function _ensureDetectorHUD() {
    if (_detectorHudEl && document.body.contains(_detectorHudEl)) return;
    _detectorHudEl = document.getElementById('minefield-detector-hud');
    if (!_detectorHudEl) {
      _detectorHudEl = document.createElement('div');
      _detectorHudEl.id = 'minefield-detector-hud';
      _detectorHudEl.style.cssText = [
        'display:none',
        'position:fixed',
        'bottom:110px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,20,0,0.85)',
        'border:1px solid #44cc44',
        'color:#00ff44',
        'font-family:monospace',
        'font-size:13px',
        'padding:5px 16px',
        'border-radius:6px',
        'z-index:300',
        'pointer-events:none',
        'user-select:none',
        'letter-spacing:1px',
        'text-align:center',
      ].join(';');
      if (document.body) document.body.appendChild(_detectorHudEl);
    }
  }

  function _updateDetectorHUD(minDist) {
    if (!_detectorHudEl) return;
    if (!_detectorActive) {
      _detectorHudEl.style.display = 'none';
      return;
    }
    _detectorHudEl.style.display = 'block';
    var bars = '░░░░░░░░';
    var filled = 0;
    if (minDist < 1) filled = 8;
    else if (minDist < 2) filled = 6;
    else if (minDist < 3) filled = 4;
    else if (minDist < 4) filled = 2;
    var barStr = '';
    for (var i = 0; i < 8; i++) {
      barStr += (i < filled) ? '█' : '░';
    }
    var status = (minDist <= 4) ? '<span style="color:#ff4444">MINE DETECTED</span>' : '<span style="color:#44ff44">CLEAR</span>';
    _detectorHudEl.innerHTML = '◄══[DETECTOR: ' + barStr + ']══► ' + status;
  }

  function _ensureDisarmBar() {
    if (_disarmBarEl && document.body.contains(_disarmBarEl)) return;
    _disarmBarEl = document.getElementById('minefield-disarm-bar');
    if (!_disarmBarEl) {
      _disarmBarEl = document.createElement('div');
      _disarmBarEl.id = 'minefield-disarm-bar';
      _disarmBarEl.style.cssText = [
        'display:none',
        'position:fixed',
        'bottom:145px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.8)',
        'border:1px solid #ffcc00',
        'color:#ffcc00',
        'font-family:monospace',
        'font-size:12px',
        'padding:4px 16px',
        'border-radius:5px',
        'z-index:300',
        'pointer-events:none',
        'user-select:none',
      ].join(';');
      if (document.body) document.body.appendChild(_disarmBarEl);
    }
  }

  function _updateDisarmBar(progress) {
    if (!_disarmBarEl) return;
    if (progress <= 0) {
      _disarmBarEl.style.display = 'none';
      return;
    }
    _disarmBarEl.style.display = 'block';
    var pct = Math.min(1, progress / DISARM_TIME);
    var filled = Math.round(pct * 7);
    var barStr = '';
    for (var i = 0; i < 7; i++) barStr += (i < filled) ? '█' : '░';
    _disarmBarEl.innerHTML = 'DISARMING... [' + barStr + '] ' + Math.round(pct * 100) + '%';
  }

  // ── Toast helper ─────────────────────────────────────────────────────
  function _toast(msg, color, duration) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg, duration || 2000, color || '#ffffff');
      return;
    }
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:38%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.8)',
      'color:' + (color || '#fff'),
      'font-family:monospace',
      'font-size:20px',
      'font-weight:bold',
      'padding:10px 24px',
      'border-radius:6px',
      'z-index:9999',
      'pointer-events:none',
      'text-shadow:0 0 10px ' + (color || '#fff'),
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, duration || 2000);
  }

  // ── Red screen flash ─────────────────────────────────────────────────
  function _redFlash() {
    var el = document.getElementById('damage-vignette');
    if (!el) {
      el = document.createElement('div');
      el.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:190;box-shadow:inset 0 0 80px 30px rgba(255,0,0,0.7);transition:opacity 0.6s';
      document.body.appendChild(el);
    }
    el.style.opacity = '1';
    setTimeout(function () { el.style.opacity = '0'; }, 600);
  }

  // ── Explosion VFX ────────────────────────────────────────────────────
  function _spawnExplosionVFX(x, y, z) {
    if (!_scene) return;
    var geo = new THREE.SphereGeometry(0.3, 8, 8);
    var mat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 1 });
    var sphere = new THREE.Mesh(geo, mat);
    sphere.position.set(x, y + 0.5, z);
    _scene.add(sphere);

    var light = new THREE.PointLight(0xff4400, 10, 12);
    light.position.set(x, y + 0.5, z);
    _scene.add(light);

    var startTime = null;
    var DURATION = 0.3;

    function animateExplosion(ts) {
      if (!startTime) startTime = ts;
      var t = (ts - startTime) / (DURATION * 1000);
      if (t >= 1) {
        if (_scene) {
          _scene.remove(sphere);
          _scene.remove(light);
        }
        geo.dispose();
        mat.dispose();
        return;
      }
      var scale = t * 2;
      sphere.scale.set(scale, scale, scale);
      mat.opacity = 1 - t;
      light.intensity = 10 * (1 - t);
      requestAnimationFrame(animateExplosion);
    }
    requestAnimationFrame(animateExplosion);
  }

  // ── Mine mesh ────────────────────────────────────────────────────────
  function _buildMineMesh() {
    var geo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 12);
    var mat = new THREE.MeshLambertMaterial({ color: 0x3D4A1E });
    var mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  // ── Warning sign mesh (corner ⚠ sign) ───────────────────────────────
  function _buildWarnSign(x, z) {
    if (!_scene) return null;
    var group = new THREE.Group();

    // Post
    var postGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6);
    var postMat = new THREE.MeshLambertMaterial({ color: 0x888866 });
    var post = new THREE.Mesh(postGeo, postMat);
    post.position.y = 0.3;
    group.add(post);

    // Sign board
    var signGeo = new THREE.BoxGeometry(0.4, 0.3, 0.04);
    // Create a canvas texture for the sign
    var canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 96;
    var ctx2d = canvas.getContext('2d');
    ctx2d.fillStyle = '#ffdd00';
    ctx2d.fillRect(0, 0, 128, 96);
    ctx2d.fillStyle = '#000000';
    ctx2d.font = 'bold 40px sans-serif';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle';
    ctx2d.fillText('⚠', 64, 40);
    ctx2d.font = 'bold 14px monospace';
    ctx2d.fillText('MINES', 64, 78);
    var tex = new THREE.CanvasTexture(canvas);
    var signMat = new THREE.MeshBasicMaterial({ map: tex });
    var sign = new THREE.Mesh(signGeo, signMat);
    sign.position.y = 0.65;
    group.add(sign);

    group.position.set(x, 0, z);
    _scene.add(group);
    return group;
  }

  // ── Trigger mine explosion ────────────────────────────────────────────
  function triggerMine(mine, isPlayer) {
    if (mine.triggered) return;
    mine.triggered = true;

    // Remove mesh
    if (mine.mesh && _scene) {
      _scene.remove(mine.mesh);
      mine.mesh.geometry.dispose();
      mine.mesh.material.dispose();
      mine.mesh = null;
    }

    var x = mine.x;
    var z = mine.z;

    // VFX
    _spawnExplosionVFX(x, 0, z);

    // SFX
    if (window.AudioSystem && window.AudioSystem.playMortarImpact) {
      window.AudioSystem.playMortarImpact();
    } else if (window.AudioSystem && window.AudioSystem.playExplosion) {
      window.AudioSystem.playExplosion();
    }

    if (isPlayer) {
      // Player damage
      if (typeof window._playerHealth !== 'undefined') {
        window._playerHealth = Math.max(0, window._playerHealth - 60);
      } else if (window.GameManager && window.GameManager.damagePlayer) {
        window.GameManager.damagePlayer(60);
      }

      // Camera shake
      window._cameraShake = { intensity: 0.8, duration: 1.2 };

      // Red flash
      _redFlash();

      // "MINE!" text
      _toast('MINE!', '#ff2222', 1500);
    }

    // Remove from array (mark, actual removal in update loop)
  }

  // ── Player step check ────────────────────────────────────────────────
  function checkPlayerStep(playerX, playerZ) {
    for (var i = 0; i < _mines.length; i++) {
      var m = _mines[i];
      if (m.triggered) continue;
      var dx = playerX - m.x;
      var dz = playerZ - m.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < MINE_TRIGGER_RADIUS && !_detectorActive) {
        triggerMine(m, true);
      }
    }
  }

  // ── Spawn minefield ──────────────────────────────────────────────────
  function spawnMinefield(centerX, centerZ, count) {
    if (!_scene) return;
    count = count || 10;
    var mineCount = Math.min(Math.max(8, count), 15);
    var radius = 10;

    var placed = [];

    for (var attempt = 0; attempt < mineCount * 10 && placed.length < mineCount; attempt++) {
      var angle = Math.random() * Math.PI * 2;
      var r = Math.random() * radius;
      var mx = centerX + Math.cos(angle) * r;
      var mz = centerZ + Math.sin(angle) * r;

      // Check minimum distance
      var tooClose = false;
      for (var j = 0; j < placed.length; j++) {
        var ddx = mx - placed[j].x;
        var ddz = mz - placed[j].z;
        if (Math.sqrt(ddx * ddx + ddz * ddz) < 1.5) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      var mesh = _buildMineMesh();
      mesh.position.set(mx, 0.025, mz);
      mesh.visible = false; // hidden until player is near or detector active
      _scene.add(mesh);

      var mine = { mesh: mesh, x: mx, z: mz, triggered: false, disarming: false, disarmProgress: 0 };
      _mines.push(mine);
      placed.push({ x: mx, z: mz });
    }

    // Spawn 4 corner warning signs
    var corners = [
      { x: centerX - radius, z: centerZ - radius },
      { x: centerX + radius, z: centerZ - radius },
      { x: centerX - radius, z: centerZ + radius },
      { x: centerX + radius, z: centerZ + radius },
    ];
    for (var ci = 0; ci < corners.length; ci++) {
      var sign = _buildWarnSign(corners[ci].x, corners[ci].z);
      if (sign) _warningSigns.push(sign);
    }
  }

  // ── Init ─────────────────────────────────────────────────────────────
  function init(scene) {
    _scene = scene;
    _mines = [];
    _warningSigns = [];
    _detectorActive = false;
    _beepTimer = 0;
    _beepInterval = 0;
    _disarmTimer = 0;
    _disarmTarget = null;
    _ctrlHeld = false;
    _initialized = true;

    _ensureDetectorHUD();
    _ensureDisarmBar();

    // F3 key — toggle metal detector
    document.addEventListener('keydown', function (e) {
      if (e.code === 'F3') {
        e.preventDefault();
        _toggleDetector();
      }
      if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
        _ctrlHeld = true;
      }
    });
    document.addEventListener('keyup', function (e) {
      if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
        _ctrlHeld = false;
        // Reset disarm if Ctrl released
        if (_disarmTarget) {
          _disarmTimer = 0;
          _disarmTarget.disarmProgress = 0;
          _disarmTarget = null;
          _updateDisarmBar(0);
        }
      }
    });
  }

  // ── Toggle detector ──────────────────────────────────────────────────
  function _toggleDetector() {
    _detectorActive = !_detectorActive;
    _ensureDetectorHUD();
    if (_detectorActive) {
      _toast('[F3] METAL DETECTOR ON — Move slowly!', '#44ff44', 2000);
      // Apply speed penalty via global flag
      if (typeof window._detectorSpeedPenalty === 'undefined') {
        window._detectorSpeedPenalty = false;
      }
      window._detectorSpeedPenalty = true;
      // Reveal all mines when detector is on
      for (var i = 0; i < _mines.length; i++) {
        if (!_mines[i].triggered && _mines[i].mesh) {
          _mines[i].mesh.visible = true;
        }
      }
    } else {
      _toast('[F3] METAL DETECTOR OFF', '#aaaaaa', 1500);
      window._detectorSpeedPenalty = false;
      // Hide mines again (visibility controlled in update)
      for (var i = 0; i < _mines.length; i++) {
        if (!_mines[i].triggered && _mines[i].mesh) {
          _mines[i].mesh.visible = false;
        }
      }
      _updateDetectorHUD(999);
      _updateDisarmBar(0);
    }
  }

  // ── Update (called every frame) ───────────────────────────────────────
  function update(delta, playerX, playerZ) {
    if (!_initialized) return;

    // Clean up triggered mines
    for (var i = _mines.length - 1; i >= 0; i--) {
      if (_mines[i].triggered) {
        _mines.splice(i, 1);
      }
    }

    // Find closest mine distance
    var minDist = 999;
    var closestMine = null;
    for (var j = 0; j < _mines.length; j++) {
      var m = _mines[j];
      if (m.triggered) continue;
      var dx = playerX - m.x;
      var dz = playerZ - m.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < minDist) {
        minDist = dist;
        closestMine = m;
      }

      // Visibility — show if player is within 3 units OR detector is active
      if (m.mesh) {
        m.mesh.visible = _detectorActive || (dist <= MINE_VISIBLE_RADIUS);
      }
    }

    // Enemy mine check
    if (window.Enemies && window.Enemies.getAll) {
      var enemies = window.Enemies.getAll();
      for (var ei = 0; ei < enemies.length; ei++) {
        var en = enemies[ei];
        if (!en || !en.mesh || en.hp <= 0) continue;
        for (var mi = 0; mi < _mines.length; mi++) {
          var mine = _mines[mi];
          if (mine.triggered) continue;
          var edx = en.mesh.position.x - mine.x;
          var edz = en.mesh.position.z - mine.z;
          var edist = Math.sqrt(edx * edx + edz * edz);
          if (edist < ENEMY_TRIGGER_RADIUS) {
            triggerMine(mine, false);
            if (window.Enemies && window.Enemies.damage) {
              window.Enemies.damage(en, 120);
            }
          }
        }
      }
    }

    // Player step check (only if no detector)
    if (!_detectorActive) {
      checkPlayerStep(playerX, playerZ);
    }

    // Metal detector beeping
    if (_detectorActive) {
      _updateDetectorHUD(minDist);

      // Determine beep frequency based on distance
      var newBeepInterval = 0;
      if (minDist < 1) {
        newBeepInterval = 1 / 20;   // 20Hz rapid alarm
      } else if (minDist < 2) {
        newBeepInterval = 1 / 7;    // 7Hz fast
      } else if (minDist < 3) {
        newBeepInterval = 1 / 3;    // 3Hz medium
      } else if (minDist < 4) {
        newBeepInterval = 1 / 1;    // 1Hz slow
      }
      _beepInterval = newBeepInterval;

      if (_beepInterval > 0) {
        _beepTimer += delta;
        if (_beepTimer >= _beepInterval) {
          _beepTimer = 0;
          var beepFreq = (minDist < 1) ? 1200 : 800;
          var beepDur = (minDist < 1) ? 0.03 : 0.05;
          _beep(beepFreq, beepDur);
        }
      } else {
        _beepTimer = 0;
      }

      // Disarming — player crouching (Ctrl held) within 0.4 units of a mine
      if (_ctrlHeld && closestMine && minDist <= DISARM_RADIUS) {
        if (_disarmTarget !== closestMine) {
          // Switched target, reset timer
          _disarmTimer = 0;
          _disarmTarget = closestMine;
          closestMine.disarmProgress = 0;
        }
        _disarmTimer += delta;
        closestMine.disarmProgress = _disarmTimer;
        _updateDisarmBar(_disarmTimer);

        if (_disarmTimer >= DISARM_TIME) {
          // Successfully disarmed!
          _disarmTarget = null;
          _disarmTimer = 0;
          _updateDisarmBar(0);
          // Remove mine
          if (closestMine.mesh && _scene) {
            _scene.remove(closestMine.mesh);
            closestMine.mesh.geometry.dispose();
            closestMine.mesh.material.dispose();
            closestMine.mesh = null;
          }
          closestMine.triggered = true; // mark for cleanup

          // Score
          if (window.GameManager && window.GameManager.addScore) {
            window.GameManager.addScore(SCORE_DISARM);
          } else if (typeof window._score !== 'undefined') {
            window._score += SCORE_DISARM;
          }
          _toast('MINE DISARMED', '#44ff44', 2500);
        }
      } else {
        // Ctrl not held or player moved away — reset
        if (_disarmTimer > 0) {
          _disarmTimer = 0;
          if (_disarmTarget) {
            _disarmTarget.disarmProgress = 0;
            _disarmTarget = null;
          }
          _updateDisarmBar(0);
        }
      }
    } else {
      _beepTimer = 0;
      _beepInterval = 0;
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────
  function reset() {
    // Remove all mine meshes
    for (var i = 0; i < _mines.length; i++) {
      var m = _mines[i];
      if (m.mesh && _scene) {
        _scene.remove(m.mesh);
        if (m.mesh.geometry) m.mesh.geometry.dispose();
        if (m.mesh.material) m.mesh.material.dispose();
      }
    }
    _mines = [];

    // Remove warning signs
    for (var s = 0; s < _warningSigns.length; s++) {
      if (_warningSigns[s] && _scene) _scene.remove(_warningSigns[s]);
    }
    _warningSigns = [];

    // Reset detector
    _detectorActive = false;
    window._detectorSpeedPenalty = false;
    _beepTimer = 0;
    _beepInterval = 0;
    _disarmTimer = 0;
    _disarmTarget = null;

    if (_detectorHudEl) _detectorHudEl.style.display = 'none';
    if (_disarmBarEl) _disarmBarEl.style.display = 'none';
  }

  // ── Public API ────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    spawnMinefield: spawnMinefield,
    checkPlayerStep: checkPlayerStep,
    triggerMine: triggerMine,
    reset: reset,
  };

})();
