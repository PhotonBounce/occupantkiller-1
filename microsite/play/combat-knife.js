/**
 * combat-knife.js — FPS melee knife combat module
 * Features: equip/unequip (K), slash (LMB), stab (RMB), silent takedown (Shift+LMB),
 *           knife throw (T), parry (RMB on hit timing), durability, stealth chain,
 *           CQB bonus, HUD, Web Audio sounds.
 */
window.CombatKnife = (function () {
  'use strict';

  // ── Scene refs ──────────────────────────────────────────────────────────────
  var _scene  = null;
  var _camera = null;

  // ── Equip state ─────────────────────────────────────────────────────────────
  var _equipped        = false;
  var _equipTime       = 0;   // world-time when knife was equipped

  // ── Attack state ────────────────────────────────────────────────────────────
  // Attack modes: 'idle' | 'slash' | 'stab-windup' | 'stab-thrust' | 'takedown'
  var _attackMode      = 'idle';
  var _attackTimer     = 0;   // seconds into current attack phase
  var _slashDuration   = 0.3;
  var _stabWindup      = 0.6;
  var _stabThrust      = 0.15;

  // ── Durability ───────────────────────────────────────────────────────────────
  var _maxDurability   = 20;
  var _durability      = 20;
  var _sharpenHeld     = 0;   // seconds K+E held near surface
  var _sharpenThresh   = 1.5; // seconds to finish sharpening
  var _nearSurface     = false;

  // ── Throw state ─────────────────────────────────────────────────────────────
  var _throwMode       = false; // pressing T enters throw mode
  var _thrownKnife     = null;  // { mesh, vel, dist, embedded } or null
  var _thrownKnifeMax  = 20;    // max travel units
  var _knifeThrown     = false; // knife is in flight / embedded
  var _thrownDamage    = 80;
  var _thrownRange     = 20;

  // ── Parry ────────────────────────────────────────────────────────────────────
  var _parryWindow     = 1.0;  // seconds before enemy hit where parry works
  var _parryTimer      = 0;    // countdown set when parry succeeds
  var _parryActive     = false;// set when RMB pressed during attack — check hit timing

  // ── Stealth / chain ─────────────────────────────────────────────────────────
  var _takedownCount       = 0;
  var _consecutiveTakedowns= 0;
  var _shadowProtocol      = false;
  var _shadowTimer         = 0;
  var _shadowDuration      = 10;

  // ── CQB bonus ────────────────────────────────────────────────────────────────
  var _cqbWindow       = 2.0; // seconds after equip for CQB bonus

  // ── Score ────────────────────────────────────────────────────────────────────
  var _score           = 0;

  // ── Mesh groups ─────────────────────────────────────────────────────────────
  var _knifeGroup      = null; // viewmodel
  var _guardMesh       = null;
  var _bladeMesh       = null;
  var _handleMesh      = null;

  // ── Blood particles ──────────────────────────────────────────────────────────
  var _blood           = []; // { mesh, vel:{x,y,z}, life, maxLife }

  // ── Input state ─────────────────────────────────────────────────────────────
  var _keys = {
    k: false,
    t: false,
    e: false,
    shift: false
  };
  var _lmbDown         = false;
  var _rmbDown         = false;
  var _kWasDown        = false; // edge detect for K
  var _tWasDown        = false;

  // ── HUD elements ─────────────────────────────────────────────────────────────
  var _hudEl           = null;
  var _durBarEl        = null;
  var _throwIndicEl    = null;
  var _toastEl         = null;
  var _toastTimer      = 0;

  // ── Bound handlers (for cleanup) ─────────────────────────────────────────────
  var _onKeyDown       = null;
  var _onKeyUp         = null;
  var _onMouseDown     = null;
  var _onMouseUp       = null;

  // ── World time ───────────────────────────────────────────────────────────────
  var _worldTime       = 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════════════════════════════
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    _buildKnifeMesh();
    _buildHUD();
    _bindInputs();
  }

  // ── Knife viewmodel ──────────────────────────────────────────────────────────
  function _buildKnifeMesh() {
    if (!_camera) return;

    _knifeGroup = new THREE.Group();
    _knifeGroup.visible = false;

    // Blade: flat narrow silver box
    var bladeGeo  = new THREE.BoxGeometry(0.035, 0.015, 0.32);
    var bladeMat  = new THREE.MeshLambertMaterial({ color: 0xd4d4d4 });
    _bladeMesh    = new THREE.Mesh(bladeGeo, bladeMat);
    _bladeMesh.position.set(0, 0.005, -0.16);

    // Guard: small perpendicular crosspiece
    var guardGeo  = new THREE.BoxGeometry(0.10, 0.018, 0.018);
    var guardMat  = new THREE.MeshLambertMaterial({ color: 0x888888 });
    _guardMesh    = new THREE.Mesh(guardGeo, guardMat);
    _guardMesh.position.set(0, 0, 0);

    // Handle: darker, thicker, behind guard
    var handleGeo = new THREE.BoxGeometry(0.05, 0.05, 0.16);
    var handleMat = new THREE.MeshLambertMaterial({ color: 0x2c1a0e });
    _handleMesh   = new THREE.Mesh(handleGeo, handleMat);
    _handleMesh.position.set(0, 0, 0.08);

    _knifeGroup.add(_bladeMesh);
    _knifeGroup.add(_guardMesh);
    _knifeGroup.add(_handleMesh);

    // Right-hand resting position (bottom-right of screen)
    _knifeGroup.position.set(0.26, -0.22, -0.38);
    _knifeGroup.rotation.x = THREE.MathUtils.degToRad(20);
    _knifeGroup.rotation.z = THREE.MathUtils.degToRad(-10);

    _camera.add(_knifeGroup);
  }

  // ── HUD ──────────────────────────────────────────────────────────────────────
  function _buildHUD() {
    if (typeof document === 'undefined') return;

    // Main HUD wrapper (bottom center)
    _hudEl = document.getElementById('ck-hud');
    if (!_hudEl) {
      _hudEl = document.createElement('div');
      _hudEl.id = 'ck-hud';
      _hudEl.style.cssText = [
        'position:fixed',
        'bottom:60px',
        'left:50%',
        'transform:translateX(-50%)',
        'display:none',
        'flex-direction:column',
        'align-items:center',
        'gap:4px',
        'z-index:8500',
        'pointer-events:none',
        'font-family:monospace',
        'color:#eee',
        'font-size:14px',
        'text-shadow:0 0 4px #000'
      ].join(';');
      _hudEl.innerHTML =
        '<span id="ck-icon" style="font-size:22px;line-height:1">&#9876;</span>' +
        '<div id="ck-durbar-bg" style="width:80px;height:6px;background:#333;border-radius:3px;overflow:hidden">' +
          '<div id="ck-durbar" style="height:100%;width:100%;background:#44cc44;transition:width 0.1s"></div>' +
        '</div>' +
        '<span id="ck-throw-ind" style="font-size:11px;letter-spacing:.08em;color:#ffcc44;display:none">THROW READY</span>';
      document.body.appendChild(_hudEl);
    }
    _durBarEl    = document.getElementById('ck-durbar');
    _throwIndicEl= document.getElementById('ck-throw-ind');

    // Toast overlay (CQB, shadow protocol, etc.)
    _toastEl = document.getElementById('ck-toast');
    if (!_toastEl) {
      _toastEl = document.createElement('div');
      _toastEl.id = 'ck-toast';
      _toastEl.style.cssText = [
        'position:fixed',
        'top:36%',
        'left:50%',
        'transform:translateX(-50%)',
        'color:#ff4400',
        'font-family:monospace',
        'font-size:26px',
        'font-weight:bold',
        'letter-spacing:.15em',
        'text-shadow:0 0 12px #ff4400,0 0 24px #aa2200',
        'pointer-events:none',
        'z-index:9300',
        'display:none',
        'white-space:nowrap'
      ].join(';');
      document.body.appendChild(_toastEl);
    }
  }

  // ── Input bindings ───────────────────────────────────────────────────────────
  function _bindInputs() {
    if (typeof document === 'undefined') return;

    _onKeyDown = function (e) {
      if (e.code === 'KeyK' || e.key === 'k' || e.key === 'K') _keys.k = true;
      if (e.code === 'KeyT' || e.key === 't' || e.key === 'T') _keys.t = true;
      if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') _keys.e = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') _keys.shift = true;
    };

    _onKeyUp = function (e) {
      if (e.code === 'KeyK' || e.key === 'k' || e.key === 'K') { _keys.k = false; _kWasDown = false; }
      if (e.code === 'KeyT' || e.key === 't' || e.key === 'T') { _keys.t = false; _tWasDown = false; }
      if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') _keys.e = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') _keys.shift = false;
    };

    _onMouseDown = function (e) {
      if (e.button === 0) { _lmbDown = true; _handleLMB(); }
      if (e.button === 2) { _rmbDown = true; _handleRMB(); }
    };

    _onMouseUp = function (e) {
      if (e.button === 0) _lmbDown = false;
      if (e.button === 2) _rmbDown = false;
    };

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
    document.addEventListener('mousedown', _onMouseDown);
    document.addEventListener('mouseup',   _onMouseUp);
  }

  // ── Equip / unequip ──────────────────────────────────────────────────────────
  function equipKnife() {
    _equipped = !_equipped;
    if (_knifeGroup) _knifeGroup.visible = _equipped && !_knifeThrown;
    if (_hudEl)      _hudEl.style.display = _equipped ? 'flex' : 'none';
    if (_equipped) {
      _equipTime = _worldTime;
    }
  }

  // ── LMB: quick slash or silent takedown ──────────────────────────────────────
  function _handleLMB() {
    if (!_equipped) return;
    if (_attackMode !== 'idle') return;
    if (_knifeThrown) return;
    if (_durability <= 0) { _showToast('BLADE DULL - SHARPEN FIRST', 1.5); return; }

    var playerPos = _getPlayerPos();
    var enemies   = _getEnemies();

    // Shift+LMB: check for takedown opportunity
    if (_keys.shift && enemies && playerPos) {
      var tdTarget = _findTakedownTarget(playerPos, enemies);
      if (tdTarget) {
        _doSilentTakedown(tdTarget, playerPos);
        return;
      }
    }

    // Normal quick slash
    _attackMode  = 'slash';
    _attackTimer = 0;
    _playWhoosh();
    _wearDurability();
  }

  // ── RMB: heavy stab or parry ─────────────────────────────────────────────────
  function _handleRMB() {
    if (!_equipped) return;
    if (_knifeThrown) return;
    if (_durability <= 0) { _showToast('BLADE DULL - SHARPEN FIRST', 1.5); return; }

    // Parry: if enemy attack is imminent (parryWindow tracked externally)
    if (_parryActive) {
      // Parry action — flag is handled in update when enemy hits
      _parryTimer = _parryWindow;
      return;
    }

    if (_attackMode !== 'idle') return;
    _attackMode  = 'stab-windup';
    _attackTimer = 0;
    _wearDurability();
  }

  // ── Takedown detection ───────────────────────────────────────────────────────
  function _findTakedownTarget(playerPos, enemies) {
    if (!_camera) return null;

    var forward = new THREE.Vector3();
    _camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.alive) continue;

      var ePos = e.mesh ? e.mesh.position : e.position;
      if (!ePos) continue;

      var dx   = ePos.x - playerPos.x;
      var dz   = ePos.z - playerPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 1.5) continue;

      // Enemy facing direction from mesh rotation
      var enemyFwdX = 0, enemyFwdZ = 1;
      if (e.mesh) {
        enemyFwdX = Math.sin(e.mesh.rotation.y);
        enemyFwdZ = Math.cos(e.mesh.rotation.y);
      }
      var enemyForward = new THREE.Vector3(enemyFwdX, 0, enemyFwdZ).normalize();

      // Player-to-enemy direction
      var toEnemy = new THREE.Vector3(dx, 0, dz).normalize();

      // Enemy facing dot player-to-enemy: if enemy faces SAME direction player approaches from
      // (enemy walking away), this is > 0.7 meaning player is behind enemy
      var dot = enemyForward.dot(toEnemy);
      if (dot > 0.7) return e;
    }
    return null;
  }

  // ── Silent takedown ──────────────────────────────────────────────────────────
  function _doSilentTakedown(enemy, playerPos) {
    _attackMode  = 'takedown';
    _attackTimer = 0;

    // Instant kill, no sound propagation
    if (enemy) {
      enemy.silentKill = true;
      _applyDamage(enemy, 99999, true);
      _spawnBlood(enemy.mesh ? enemy.mesh.position : enemy.position);
      // Slowly slump: flag mesh to animate downward
      if (enemy.mesh) {
        enemy._slumpTimer    = 0;
        enemy._slumpDuration = 1.2;
        enemy._slumping      = true;
      }
    }

    _addScore(100);
    _takedownCount++;
    _consecutiveTakedowns++;
    _wearDurability();

    // CQB bonus
    if (_worldTime - _equipTime <= _cqbWindow) {
      _addScore(50);
      _showToast('CQB KILL +50', 1.8);
    }

    // Shadow Protocol chain
    if (_consecutiveTakedowns >= 3 && !_shadowProtocol) {
      _shadowProtocol = true;
      _shadowTimer    = _shadowDuration;
      _showToast('SHADOW PROTOCOL', 2.5);
    }
  }

  // ── Knife throw ──────────────────────────────────────────────────────────────
  function _throwKnife() {
    if (_knifeThrown) {
      // Try pick-up if already thrown and embedded
      if (_thrownKnife && _thrownKnife.embedded) {
        _tryPickupThrown();
      }
      return;
    }
    if (!_equipped) return;
    if (!_camera || !_scene) return;
    if (_durability <= 0) return;

    _knifeThrown = true;
    if (_knifeGroup) _knifeGroup.visible = false;

    // Build projectile mesh (small knife shape)
    var geo = new THREE.BoxGeometry(0.03, 0.012, 0.28);
    var mat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    var mesh = new THREE.Mesh(geo, mat);

    // Start at camera position
    var startPos = new THREE.Vector3();
    _camera.getWorldPosition(startPos);
    startPos.y -= 0.05;
    mesh.position.copy(startPos);

    // Direction
    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);

    // Orient mesh along travel direction
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);

    _scene.add(mesh);

    _thrownKnife = {
      mesh:     mesh,
      vel:      dir.clone().multiplyScalar(18),
      dist:     0,
      embedded: false,
      hitNormal:null
    };

    _wearDurability();
  }

  function _updateThrownKnife(delta) {
    if (!_thrownKnife || _thrownKnife.embedded) return;

    var tk    = _thrownKnife;
    var speed = tk.vel.length();
    var move  = speed * delta;
    tk.dist  += move;

    tk.mesh.position.addScaledVector(tk.vel, delta);

    // Rotate to show spinning
    tk.mesh.rotation.x += 12 * delta;

    if (tk.dist >= _thrownRange) {
      // Embed where it stopped
      _embedThrownKnife(tk.mesh.position.clone(), null);
      return;
    }

    // Hit detection vs enemies
    var enemies = _getEnemies();
    if (enemies) {
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (!e || !e.alive) continue;
        var ePos = e.mesh ? e.mesh.position : e.position;
        if (!ePos) continue;
        var dist = tk.mesh.position.distanceTo(ePos);
        if (dist < 0.7) {
          // Hit!
          _applyDamage(e, _thrownDamage, _shadowProtocol);
          _spawnBlood(ePos);
          _playWetImpact();
          _addScore(_shadowProtocol ? 100 : 50);
          _embedThrownKnife(tk.mesh.position.clone(), null);
          return;
        }
      }
    }

    // Simple surface check: below floor (y <= 0)
    if (tk.mesh.position.y <= 0) {
      tk.mesh.position.y = 0.05;
      _embedThrownKnife(tk.mesh.position.clone(), null);
    }
  }

  function _embedThrownKnife(pos, normal) {
    if (!_thrownKnife) return;
    _thrownKnife.embedded = true;
    _thrownKnife.mesh.position.copy(pos);
    // Stop rotation — align with surface normal or upward
    _thrownKnife.mesh.rotation.set(0, 0, 0);
  }

  function _tryPickupThrown() {
    if (!_thrownKnife || !_thrownKnife.embedded) return;
    var playerPos = _getPlayerPos();
    if (!playerPos) return;
    var dist = playerPos.distanceTo(_thrownKnife.mesh.position);
    if (dist > 2.0) {
      _showToast('TOO FAR TO PICK UP', 1.0);
      return;
    }
    // Recover knife
    _scene.remove(_thrownKnife.mesh);
    if (_thrownKnife.mesh.geometry) _thrownKnife.mesh.geometry.dispose();
    _thrownKnife = null;
    _knifeThrown = false;
    if (_knifeGroup) _knifeGroup.visible = _equipped;
  }

  // ── Hit detection (sphere cast) ──────────────────────────────────────────────
  function _checkHit(damage, reach) {
    if (!_camera) return false;

    var playerPos = _getPlayerPos();
    if (!playerPos) return false;

    var forward = new THREE.Vector3();
    _camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    var enemies = _getEnemies();
    if (!enemies) return false;

    var hitAny = false;

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.alive) continue;

      var ePos = e.mesh ? e.mesh.position : e.position;
      if (!ePos) continue;

      // Sphere cast: check distance from enemy to ray
      var toEnemy = new THREE.Vector3(
        ePos.x - playerPos.x,
        0,
        ePos.z - playerPos.z
      );
      var dist = toEnemy.length();
      if (dist > reach) continue;

      // Must be in front
      var dot = forward.dot(toEnemy.clone().normalize());
      if (dot < 0.3) continue;

      hitAny = true;
      var isSilent = _shadowProtocol || false;
      _applyDamage(e, damage, isSilent);
      _spawnBlood(ePos);
      _playWetImpact();

      // Track consecutive takedowns only for silent kills
      if (!isSilent) _consecutiveTakedowns = 0;

      // CQB bonus
      if (_worldTime - _equipTime <= _cqbWindow) {
        _addScore(50);
        _showToast('CQB KILL +50', 1.8);
      }

      if (!_shadowProtocol) _addScore(10);
    }

    return hitAny;
  }

  // ── Slump animation for takedown bodies ──────────────────────────────────────
  function _updateEnemySlumps(delta) {
    var enemies = _getEnemies();
    if (!enemies) return;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e._slumping || !e.mesh) continue;
      e._slumpTimer += delta;
      var t = Math.min(e._slumpTimer / e._slumpDuration, 1);
      // Tilt forward and sink down
      e.mesh.rotation.x = t * (Math.PI / 2);
      e.mesh.position.y -= 0.4 * delta * (1 - t * 0.5);
      if (t >= 1) e._slumping = false;
    }
  }

  // ── Parry handling ───────────────────────────────────────────────────────────
  // Called externally when an enemy melee attack is about to land
  function notifyIncomingEnemyHit() {
    if (_parryTimer > 0 && _equipped) {
      // Successful parry
      _triggerParrySuccess();
      return true; // consume the hit
    }
    return false;
  }

  function _triggerParrySuccess() {
    _showToast('PARRY!', 1.2);
    // Find closest enemy and stagger them
    var enemies   = _getEnemies();
    var playerPos = _getPlayerPos();
    if (!enemies || !playerPos) return;
    var closest = null;
    var cDist   = Infinity;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.alive) continue;
      var ePos = e.mesh ? e.mesh.position : e.position;
      if (!ePos) continue;
      var d = playerPos.distanceTo(ePos);
      if (d < cDist) { cDist = d; closest = e; }
    }
    if (closest && cDist < 3) {
      closest._staggerTimer    = 0.5;
      closest._staggerDuration = 0.5;
      closest._staggered       = true;
    }
    _parryTimer = 0;
  }

  // ── Durability ────────────────────────────────────────────────────────────────
  function _wearDurability() {
    if (_durability > 0) {
      _durability--;
    }
    _updateDurHUD();
    if (_durability <= 0) {
      _showToast('KNIFE DULL - HOLD K+E ON SURFACE', 2.0);
    }
  }

  function _trySharpening(delta) {
    // K+E held near hard surface
    if (!_keys.k || !_keys.e) { _sharpenHeld = 0; return; }
    if (_durability >= _maxDurability) return;

    // Near-surface detection: simple raycast downward / forward
    _nearSurface = _checkNearSurface();
    if (!_nearSurface) { _sharpenHeld = 0; return; }

    _sharpenHeld += delta;
    if (_sharpenHeld >= _sharpenThresh) {
      _sharpenHeld = 0;
      _durability  = _maxDurability;
      _updateDurHUD();
      _showToast('KNIFE SHARPENED', 1.2);
    }
  }

  function _checkNearSurface() {
    // Simplified: if player is near floor (camera y < 2.5) or any geometry
    // In a full game this would raycast; here we use camera height as proxy
    if (!_camera) return false;
    return _camera.position.y < 2.5;
  }

  // ── Durability HUD update ────────────────────────────────────────────────────
  function _updateDurHUD() {
    if (!_durBarEl) return;
    var pct = Math.max(0, _durability / _maxDurability) * 100;
    _durBarEl.style.width = pct + '%';
    if (pct > 50)      _durBarEl.style.background = '#44cc44';
    else if (pct > 25) _durBarEl.style.background = '#ccaa00';
    else               _durBarEl.style.background = '#cc3300';
  }

  // ── Attack animation ──────────────────────────────────────────────────────────
  function _updateAttackAnimation(delta) {
    if (_attackMode === 'idle') return;

    _attackTimer += delta;

    if (_attackMode === 'slash') {
      _animateSlash(_attackTimer / _slashDuration);
      if (_attackTimer >= _slashDuration * 0.4 && _attackTimer < _slashDuration * 0.42) {
        // Mid-swing hit check
        _checkHit(25, 1.2);
      }
      if (_attackTimer >= _slashDuration) {
        _attackMode  = 'idle';
        _attackTimer = 0;
        _resetKnifeRotation();
      }
    } else if (_attackMode === 'stab-windup') {
      _animateStabWindup(_attackTimer / _stabWindup);
      if (_attackTimer >= _stabWindup) {
        _attackMode  = 'stab-thrust';
        _attackTimer = 0;
      }
    } else if (_attackMode === 'stab-thrust') {
      _animateStabThrust(_attackTimer / _stabThrust);
      if (_attackTimer >= _stabThrust * 0.5 && _attackTimer < _stabThrust * 0.52) {
        _checkHit(60, 1.5);
      }
      if (_attackTimer >= _stabThrust) {
        _attackMode  = 'idle';
        _attackTimer = 0;
        _resetKnifeRotation();
      }
    } else if (_attackMode === 'takedown') {
      // Quick forward lunge animation
      if (_knifeGroup) {
        _knifeGroup.position.z = -0.38 - Math.sin(_attackTimer * Math.PI / 0.25) * 0.12;
      }
      if (_attackTimer >= 0.25) {
        _attackMode  = 'idle';
        _attackTimer = 0;
        _resetKnifeRotation();
      }
    }
  }

  function _animateSlash(t) {
    if (!_knifeGroup) return;
    // Rotate from resting forward to downward slash
    _knifeGroup.rotation.x = THREE.MathUtils.degToRad(20 - t * 80);
    _knifeGroup.rotation.z = THREE.MathUtils.degToRad(-10 - t * 30);
  }

  function _animateStabWindup(t) {
    if (!_knifeGroup) return;
    // Pull back on Z
    _knifeGroup.position.z = -0.38 + t * 0.18;
    _knifeGroup.rotation.x = THREE.MathUtils.degToRad(20 - t * 40);
  }

  function _animateStabThrust(t) {
    if (!_knifeGroup) return;
    // Push forward
    _knifeGroup.position.z = -0.20 - t * 0.22;
    _knifeGroup.rotation.x = THREE.MathUtils.degToRad(-20 + t * 20);
  }

  function _resetKnifeRotation() {
    if (!_knifeGroup) return;
    _knifeGroup.position.set(0.26, -0.22, -0.38);
    _knifeGroup.rotation.x = THREE.MathUtils.degToRad(20);
    _knifeGroup.rotation.z = THREE.MathUtils.degToRad(-10);
  }

  // ── Blood particles ──────────────────────────────────────────────────────────
  function _spawnBlood(pos) {
    if (!_scene || !pos) return;
    for (var i = 0; i < 5; i++) {
      var geo  = new THREE.SphereGeometry(0.04, 4, 4);
      var mat  = new THREE.MeshBasicMaterial({ color: 0x880000, transparent: true, opacity: 1 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, pos.y + 0.8, pos.z);
      var angle = Math.random() * Math.PI * 2;
      var spd   = 1.5 + Math.random() * 2.5;
      _scene.add(mesh);
      _blood.push({
        mesh:    mesh,
        vel:     { x: Math.cos(angle) * spd * 0.5, y: 2 + Math.random() * 2, z: Math.sin(angle) * spd * 0.5 },
        life:    0.7,
        maxLife: 0.7
      });
    }
  }

  function _updateBlood(delta) {
    var i = _blood.length;
    while (i--) {
      var p = _blood[i];
      p.life -= delta;
      if (p.life <= 0) {
        if (_scene) _scene.remove(p.mesh);
        if (p.mesh.geometry) p.mesh.geometry.dispose();
        _blood.splice(i, 1);
        continue;
      }
      p.vel.y -= 9.8 * delta;
      p.mesh.position.x += p.vel.x * delta;
      p.mesh.position.y += p.vel.y * delta;
      p.mesh.position.z += p.vel.z * delta;
      if (p.mesh.material) p.mesh.material.opacity = p.life / p.maxLife;
    }
  }

  // ── Audio ─────────────────────────────────────────────────────────────────────
  function _playWhoosh() {
    var ctx = window._audioCtx;
    if (!ctx) return;
    try {
      // Descending 300 Hz tone — short whoosh
      var osc  = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.22);

      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      // High-pass to make it airy
      var hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 200;

      osc.connect(hp);
      hp.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.22);
    } catch (e) { /* audio unavailable */ }
  }

  function _playWetImpact() {
    var ctx = window._audioCtx;
    if (!ctx) return;
    try {
      // Short transient filtered noise at 800 Hz — wet flesh impact
      var sr     = ctx.sampleRate;
      var len    = Math.floor(sr * 0.07);
      var buf    = ctx.createBuffer(1, len, sr);
      var data   = buf.getChannelData(0);
      for (var i = 0; i < len; i++) {
        var t  = i / len;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 4);
      }

      var src  = ctx.createBufferSource();
      src.buffer = buf;

      var bp   = ctx.createBiquadFilter();
      bp.type  = 'bandpass';
      bp.frequency.value = 800;
      bp.Q.value = 1.2;

      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.55, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

      src.connect(bp);
      bp.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) { /* audio unavailable */ }
  }

  // ── Toast ─────────────────────────────────────────────────────────────────────
  function _showToast(msg, duration) {
    if (!_toastEl) return;
    _toastEl.textContent = msg;
    _toastEl.style.display = 'block';
    _toastEl.style.opacity  = '1';
    _toastTimer = duration || 1.5;
  }

  function _updateToast(delta) {
    if (_toastTimer <= 0) return;
    _toastTimer -= delta;
    if (_toastTimer <= 0) {
      _toastTimer = 0;
      if (_toastEl) _toastEl.style.display = 'none';
    } else if (_toastTimer < 0.4) {
      if (_toastEl) _toastEl.style.opacity = String(_toastTimer / 0.4);
    }
  }

  // ── Helper: score ─────────────────────────────────────────────────────────────
  function _addScore(amount) {
    _score += amount;
    if (window.GameManager && window.GameManager.getPlayer) {
      var pl = window.GameManager.getPlayer();
      if (pl) pl.score = (pl.score || 0) + amount;
    }
    if (typeof window._score !== 'undefined') window._score += amount;
  }

  // ── Helper: enemies ───────────────────────────────────────────────────────────
  function _getEnemies() {
    if (window.Enemies && window.Enemies.getAll)          return window.Enemies.getAll();
    if (window._enemies)                                  return window._enemies;
    if (window.GameManager && window.GameManager.getEnemies) return window.GameManager.getEnemies();
    return null;
  }

  // ── Helper: player position ───────────────────────────────────────────────────
  function _getPlayerPos() {
    if (window.GameManager && window.GameManager.getPlayerPosition) {
      return window.GameManager.getPlayerPosition();
    }
    if (window.GameManager && window.GameManager.getPlayer) {
      var pl = window.GameManager.getPlayer();
      if (pl && pl.position) return pl.position;
    }
    if (_camera) return _camera.position;
    return null;
  }

  // ── Helper: apply damage ──────────────────────────────────────────────────────
  function _applyDamage(enemy, dmg, silent) {
    if (!enemy || !enemy.alive) return;
    if (silent) enemy.silentKill = true;
    if (window.GameManager && window.GameManager.onEnemyHit) {
      window.GameManager.onEnemyHit(enemy, dmg);
    } else {
      enemy.hp = (enemy.hp || 100) - dmg;
      if (enemy.hp <= 0 && enemy.alive) {
        enemy.alive = false;
        if (window.GameManager && window.GameManager.killEnemy) {
          window.GameManager.killEnemy(enemy);
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════════════════════════════════════
  function update(delta) {
    if (!delta || delta <= 0) delta = 0.016;

    _worldTime += delta;

    // --- K key: equip / unequip (edge detect) ---
    if (_keys.k && !_kWasDown) {
      _kWasDown = true;
      // Don't toggle if K+E sharpening combo is being used
      if (!_keys.e) {
        equipKnife();
      }
    }

    // --- T key: throw (edge detect) ---
    if (_keys.t && !_tWasDown) {
      _tWasDown = true;
      if (_equipped) _throwKnife();
    }

    // --- E key: pick up thrown knife ---
    if (_keys.e && _knifeThrown && _thrownKnife && _thrownKnife.embedded) {
      _tryPickupThrown();
    }

    // --- Sharpening ---
    if (_keys.k && _keys.e && _durability < _maxDurability) {
      _trySharpening(delta);
    } else {
      _sharpenHeld = 0;
    }

    // --- Parry timer ---
    if (_parryTimer > 0) {
      _parryTimer -= delta;
      if (_parryTimer < 0) _parryTimer = 0;
      _parryActive = _parryTimer > 0;
    }

    // --- Parry active when RMB held ---
    if (_rmbDown && _equipped && _attackMode === 'idle') {
      _parryActive = true;
    } else if (!_rmbDown) {
      // Only clear parry active if timer also expired
      if (_parryTimer <= 0) _parryActive = false;
    }

    // --- Shadow Protocol timer ---
    if (_shadowProtocol) {
      _shadowTimer -= delta;
      if (_shadowTimer <= 0) {
        _shadowProtocol = false;
        _shadowTimer    = 0;
        _showToast('SHADOW PROTOCOL ENDED', 1.5);
      }
    }

    // --- Attack animations ---
    if (_equipped) {
      _updateAttackAnimation(delta);
    }

    // --- Thrown knife ---
    _updateThrownKnife(delta);

    // --- Blood particles ---
    _updateBlood(delta);

    // --- Enemy slump ---
    _updateEnemySlumps(delta);

    // --- Toast ---
    _updateToast(delta);

    // --- Throw mode indicator ---
    if (_throwIndicEl) {
      _throwIndicEl.style.display = (!_knifeThrown && _equipped) ? 'inline' : 'none';
    }

    // --- HUD throw indicator: change label if knife thrown ---
    if (_throwIndicEl && _knifeThrown) {
      _throwIndicEl.style.display = 'inline';
      _throwIndicEl.textContent   = _thrownKnife && _thrownKnife.embedded
        ? 'PRESS E TO PICK UP' : 'IN FLIGHT';
      _throwIndicEl.style.color   = '#ff8844';
    } else if (_throwIndicEl && _equipped) {
      _throwIndicEl.textContent = 'T: THROW';
      _throwIndicEl.style.color = '#ffcc44';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESET
  // ═══════════════════════════════════════════════════════════════════════════
  function reset() {
    _equipped             = false;
    _equipTime            = 0;
    _attackMode           = 'idle';
    _attackTimer          = 0;
    _durability           = _maxDurability;
    _sharpenHeld          = 0;
    _knifeThrown          = false;
    _throwMode            = false;
    _parryTimer           = 0;
    _parryActive          = false;
    _takedownCount        = 0;
    _consecutiveTakedowns = 0;
    _shadowProtocol       = false;
    _shadowTimer          = 0;
    _score                = 0;
    _worldTime            = 0;
    _lmbDown              = false;
    _rmbDown              = false;
    _kWasDown             = false;
    _tWasDown             = false;
    _toastTimer           = 0;

    // Clean up thrown knife
    if (_thrownKnife) {
      if (_scene && _thrownKnife.mesh) _scene.remove(_thrownKnife.mesh);
      if (_thrownKnife.mesh && _thrownKnife.mesh.geometry) _thrownKnife.mesh.geometry.dispose();
      _thrownKnife = null;
    }

    // Clean blood
    var i = _blood.length;
    while (i--) {
      if (_scene && _blood[i].mesh) _scene.remove(_blood[i].mesh);
      if (_blood[i].mesh && _blood[i].mesh.geometry) _blood[i].mesh.geometry.dispose();
    }
    _blood = [];

    // Hide knife mesh and HUD
    if (_knifeGroup) {
      _knifeGroup.visible = false;
      _resetKnifeRotation();
    }
    if (_hudEl)    _hudEl.style.display   = 'none';
    if (_toastEl)  _toastEl.style.display = 'none';
    _updateDurHUD();
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  return {
    init:              init,
    update:            update,
    equipKnife:        equipKnife,
    getTakedownCount:  function () { return _takedownCount; },
    notifyIncomingEnemyHit: notifyIncomingEnemyHit,
    reset:             reset
  };

})();
