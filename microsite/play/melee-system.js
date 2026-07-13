/**
 * melee-system.js — Full knife/melee combat system
 * Attack types: Slash (LMB), Stab (RMB), Heavy Slash (hold LMB), Execute (LMB+RMB)
 * Stealth kills, parry window, blood effects, score bonuses
 */
window.MeleeSystem = (function () {
  'use strict';

  // ── Scene refs ─────────────────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;

  // ── Knife equipped state ───────────────────────────────────────────────────
  var _equipped = false;        // knife drawn
  window._meleeActive = false;
  window._meleeAttacking = false;

  // ── Attack state ───────────────────────────────────────────────────────────
  var COOLDOWN_BASE = 0.3;      // seconds between attacks
  var _cooldown = 0;

  // Attack types
  var ATK_NONE   = 0;
  var ATK_SLASH  = 1;           // LMB
  var ATK_STAB   = 2;           // RMB
  var ATK_HEAVY  = 3;           // hold LMB 0.6s
  var ATK_EXEC   = 4;           // LMB+RMB

  var _currentAtk = ATK_NONE;
  var _atkTimer = 0;            // time into current attack animation
  var _atkDuration = 0;         // animation duration for current attack
  var _atkRecovery = 0;         // extra recovery after animation

  // LMB/RMB hold tracking
  var _lmbHeld = false;
  var _rmbHeld = false;
  var _lmbHeldTime = 0;         // seconds LMB continuously held
  var _lmbHeavyFired = false;   // prevent re-firing heavy while held

  // Execute requires both buttons near-simultaneously
  var _execWindowTimer = 0;     // time since first button pressed for exec
  var _lmbForExec = false;
  var _rmbForExec = false;

  // ── Parry ──────────────────────────────────────────────────────────────────
  var _parryWindow = 0;         // countdown: parry available when > 0
  var _stunned = false;         // this is for enemies; we track locally
  var _parrySuccess = false;
  var _parryFlashTimer = 0;

  // ── Slow-mo (execute) ─────────────────────────────────────────────────────
  var _slowMoTimer = 0;
  var _slowMoActive = false;

  // ── Knife 3-D mesh (attached to camera) ───────────────────────────────────
  var _knifeGroup = null;
  var _bladeMesh = null;
  var _handleMesh = null;

  // Resting pose
  var REST_X =  0.22;
  var REST_Y = -0.18;
  var REST_Z = -0.38;
  var REST_ROT_X = 0.52;       // ~30 deg

  // ── Blood particles ────────────────────────────────────────────────────────
  var _bloodParticles = [];     // {mesh, vel:{x,y,z}, life, maxLife}

  // ── DOM overlays ──────────────────────────────────────────────────────────
  var _redFlashEl = null;       // execute red flash
  var _redFlashTimer = 0;
  var _parryFlashEl = null;
  var _hudEl = null;            // bottom-right knife HUD

  // ── Score ──────────────────────────────────────────────────────────────────
  var SCORE_SLASH_KILL   = 100;
  var SCORE_STAB_KILL    = 150;
  var SCORE_EXECUTE      = 500;
  var SCORE_STEALTH      = 200;

  // ══════════════════════════════════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════════════════════════════════
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    _buildKnifeMesh();
    _buildDOMOverlays();
    _buildHUD();
    _bindInputs();
  }

  // ── Knife viewmodel ────────────────────────────────────────────────────────
  function _buildKnifeMesh() {
    if (!_camera) return;

    _knifeGroup = new THREE.Group();

    // Blade — spec: BoxGeometry(0.04, 0.04, 0.35) color 0xCCCCCC
    var bladeGeo = new THREE.BoxGeometry(0.04, 0.04, 0.35);
    var bladeMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
    _bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
    _bladeMesh.position.set(0, 0, -0.175);

    // Handle — spec: BoxGeometry(0.06, 0.12, 0.12) color 0x4A3A2A
    var handleGeo = new THREE.BoxGeometry(0.06, 0.12, 0.12);
    var handleMat = new THREE.MeshLambertMaterial({ color: 0x4A3A2A });
    _handleMesh = new THREE.Mesh(handleGeo, handleMat);
    _handleMesh.position.set(0, 0, 0.06);

    _knifeGroup.add(_bladeMesh);
    _knifeGroup.add(_handleMesh);

    _knifeGroup.position.set(REST_X, REST_Y, REST_Z);
    _knifeGroup.rotation.x = REST_ROT_X;
    _knifeGroup.visible = false;

    _camera.add(_knifeGroup);
  }

  // ── DOM overlays ──────────────────────────────────────────────────────────
  function _buildDOMOverlays() {
    if (typeof document === 'undefined') return;

    // Red execute flash
    _redFlashEl = document.getElementById('melee-sys-red-flash');
    if (!_redFlashEl) {
      _redFlashEl = document.createElement('div');
      _redFlashEl.id = 'melee-sys-red-flash';
      _redFlashEl.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
        'background:rgba(180,0,0,0)', 'pointer-events:none', 'z-index:9100',
        'transition:none'
      ].join(';');
      document.body.appendChild(_redFlashEl);
    }

    // Parry flash (white/gold)
    _parryFlashEl = document.getElementById('melee-sys-parry-flash');
    if (!_parryFlashEl) {
      _parryFlashEl = document.createElement('div');
      _parryFlashEl.id = 'melee-sys-parry-flash';
      _parryFlashEl.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
        'background:rgba(255,220,50,0)', 'pointer-events:none', 'z-index:9101',
        'transition:none'
      ].join(';');
      document.body.appendChild(_parryFlashEl);
    }
  }

  // ── Knife HUD (bottom-right) ───────────────────────────────────────────────
  function _buildHUD() {
    if (typeof document === 'undefined') return;
    _hudEl = document.getElementById('melee-sys-hud');
    if (!_hudEl) {
      _hudEl = document.createElement('div');
      _hudEl.id = 'melee-sys-hud';
      _hudEl.style.cssText = [
        'position:fixed', 'bottom:72px', 'right:140px',
        'display:none', 'flex-direction:column', 'align-items:center',
        'gap:4px', 'z-index:8500', 'pointer-events:none',
        'font-family:monospace', 'color:#eee',
        'text-shadow:0 0 6px #000', 'font-size:22px'
      ].join(';');
      // Knife SVG-ish CSS icon via text
      _hudEl.innerHTML = '<span id="melee-sys-hud-icon" style="font-size:26px;line-height:1">&#9876;</span>'
        + '<span id="melee-sys-hud-label" style="font-size:10px;letter-spacing:1px">KNIFE</span>'
        + '<canvas id="melee-sys-hud-arc" width="36" height="36"></canvas>';
      document.body.appendChild(_hudEl);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INPUT BINDING
  // ══════════════════════════════════════════════════════════════════════════
  function _bindInputs() {
    if (typeof document === 'undefined') return;

    // V key — equip/sheathe
    document.addEventListener('keydown', function (e) {
      if (e.code === 'KeyV' || e.key === 'v' || e.key === 'V') {
        // Parry window: if currently open, trigger parry instead of toggle
        if (_parryWindow > 0 && _equipped) {
          _doParry();
          return;
        }
        _toggleEquip();
      }
    });

    // Mouse buttons
    document.addEventListener('mousedown', function (e) {
      if (!_equipped) return;
      if (e.button === 0) { _onLMBDown(); }
      if (e.button === 2) { _onRMBDown(); }
    });

    document.addEventListener('mouseup', function (e) {
      if (e.button === 0) { _onLMBUp(); }
      if (e.button === 2) { _onRMBUp(); }
    });
  }

  function _toggleEquip() {
    _equipped = !_equipped;
    window._meleeActive = _equipped;
    if (_knifeGroup) _knifeGroup.visible = _equipped;
    if (_hudEl) _hudEl.style.display = _equipped ? 'flex' : 'none';
    if (_equipped) {
      _playScrapeSound();  // draw sound
    }
  }

  // ── LMB / RMB logic ───────────────────────────────────────────────────────
  function _onLMBDown() {
    _lmbHeld = true;
    _lmbHeldTime = 0;
    _lmbHeavyFired = false;

    // Check execute: RMB already held?
    if (_rmbHeld) {
      _tryExecute();
      return;
    }
    // Flag for execute window
    _lmbForExec = true;
    _execWindowTimer = 0.12;  // give 0.12s window for RMB to join
  }

  function _onLMBUp() {
    var wasHeld = _lmbHeld;
    var heldTime = _lmbHeldTime;
    _lmbHeld = false;
    _lmbForExec = false;

    // If we fired heavy while held, nothing more to do
    if (_lmbHeavyFired) return;

    // Normal slash on release (if not a heavy)
    if (wasHeld && heldTime < 0.6) {
      _trySlash();
    }
  }

  function _onRMBDown() {
    _rmbHeld = true;

    if (_lmbHeld) {
      _tryExecute();
      return;
    }
    _rmbForExec = true;
    _execWindowTimer = 0.12;
  }

  function _onRMBUp() {
    _rmbHeld = false;
    _rmbForExec = false;

    // Stab on RMB release (if not part of execute)
    _tryStab();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ATTACK DISPATCH
  // ══════════════════════════════════════════════════════════════════════════
  function _trySlash() {
    if (_cooldown > 0 || _currentAtk !== ATK_NONE) return;
    _startAttack(ATK_SLASH);
  }

  function _tryStab() {
    if (_cooldown > 0 || _currentAtk !== ATK_NONE) return;
    _startAttack(ATK_STAB);
  }

  function _tryHeavy() {
    if (_cooldown > 0 || _currentAtk !== ATK_NONE) return;
    _lmbHeavyFired = true;
    _startAttack(ATK_HEAVY);
  }

  function _tryExecute() {
    if (_cooldown > 0 || _currentAtk !== ATK_NONE) return;
    _startAttack(ATK_EXEC);
  }

  function _startAttack(type) {
    _currentAtk = type;
    _atkTimer = 0;
    window._meleeAttacking = true;

    switch (type) {
      case ATK_SLASH:
        _atkDuration = 0.2;
        _atkRecovery = COOLDOWN_BASE;
        _playSwishSound();
        break;
      case ATK_STAB:
        _atkDuration = 0.15;
        _atkRecovery = COOLDOWN_BASE;
        _playSwishSound();
        break;
      case ATK_HEAVY:
        _atkDuration = 0.45;
        _atkRecovery = 0.8;
        _playSwishSound();
        break;
      case ATK_EXEC:
        _atkDuration = 0.5;
        _atkRecovery = 0.6;
        _startSlowMo();
        _triggerRedFlash();
        _playSwishSound();
        break;
    }
  }

  // ── Public attack entry point (called externally or from update) ───────────
  function attack(playerPos, camera, allEnemies, onHitCallback) {
    // Resolve hit for the current in-progress attack at the right moment
    _resolveHits(playerPos, camera || _camera, allEnemies, onHitCallback);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // UPDATE
  // ══════════════════════════════════════════════════════════════════════════
  function update(delta) {
    if (!delta || delta <= 0) delta = 0.016;

    // Slow-mo scale
    var dt = _slowMoActive ? delta * 0.2 : delta;

    // Cooldown
    if (_cooldown > 0) {
      _cooldown -= delta;
      if (_cooldown < 0) _cooldown = 0;
    }

    // LMB hold timer — detect heavy slash threshold
    if (_lmbHeld && _equipped) {
      _lmbHeldTime += delta;
      if (_lmbHeldTime >= 0.6 && !_lmbHeavyFired && _currentAtk === ATK_NONE && _cooldown <= 0) {
        _tryHeavy();
      }
    }

    // Execute window (brief window where both buttons must be pressed)
    if (_execWindowTimer > 0) {
      _execWindowTimer -= delta;
      if (_execWindowTimer < 0) {
        _execWindowTimer = 0;
        _lmbForExec = false;
        _rmbForExec = false;
      }
    }

    // Attack animation + hit resolution
    if (_currentAtk !== ATK_NONE) {
      _atkTimer += dt;
      _animateKnife(dt);

      // Hit-detect at the midpoint of the animation
      var hitMoment = _atkDuration * 0.5;
      if (_atkTimer >= hitMoment && _atkTimer - dt < hitMoment) {
        // Auto-resolve using last-known game state globals
        _autoResolveHits();
      }

      if (_atkTimer >= _atkDuration) {
        // Attack animation done, enter recovery / cooldown
        _cooldown = _atkRecovery;
        _currentAtk = ATK_NONE;
        _atkTimer = 0;
        window._meleeAttacking = false;
        if (_knifeGroup) {
          _knifeGroup.position.set(REST_X, REST_Y, REST_Z);
          _knifeGroup.rotation.x = REST_ROT_X;
        }
      }
    }

    // Parry window countdown
    if (_parryWindow > 0) {
      _parryWindow -= delta;
      if (_parryWindow < 0) _parryWindow = 0;
    }

    // Slow-mo
    if (_slowMoTimer > 0) {
      _slowMoTimer -= delta;
      if (_slowMoTimer <= 0) {
        _slowMoTimer = 0;
        _slowMoActive = false;
      }
    }

    // Red flash
    if (_redFlashTimer > 0) {
      _redFlashTimer -= delta;
      if (_redFlashTimer < 0) _redFlashTimer = 0;
      var rAlpha = (_redFlashTimer / 0.5) * 0.65;
      if (_redFlashEl) _redFlashEl.style.background = 'rgba(180,0,0,' + rAlpha + ')';
    } else {
      if (_redFlashEl) _redFlashEl.style.background = 'rgba(180,0,0,0)';
    }

    // Parry flash
    if (_parryFlashTimer > 0) {
      _parryFlashTimer -= delta;
      if (_parryFlashTimer < 0) _parryFlashTimer = 0;
      var pAlpha = (_parryFlashTimer / 0.15) * 0.55;
      if (_parryFlashEl) _parryFlashEl.style.background = 'rgba(255,220,50,' + pAlpha + ')';
    } else {
      if (_parryFlashEl) _parryFlashEl.style.background = 'rgba(255,220,50,0)';
    }

    // Blood particles
    _updateBlood(delta);

    // HUD
    _updateHUD();
  }

  // ── Knife animation ────────────────────────────────────────────────────────
  function _animateKnife(dt) {
    if (!_knifeGroup) return;
    var t = _atkTimer;
    var dur = _atkDuration;
    var p = Math.min(t / dur, 1.0);

    switch (_currentAtk) {
      case ATK_SLASH:
        // Arc swing: rotate x from REST down, translate right-to-left
        _knifeGroup.rotation.x = REST_ROT_X + (p < 0.5 ? p * 2 : (1 - p) * 2) * (-1.4 - REST_ROT_X);
        _knifeGroup.position.x = REST_X + Math.sin(p * Math.PI) * (-0.35);
        _knifeGroup.position.y = REST_Y + Math.sin(p * Math.PI) * 0.08;
        _knifeGroup.position.z = REST_Z;
        break;

      case ATK_STAB:
        // Straight thrust: push forward
        _knifeGroup.rotation.x = REST_ROT_X;
        _knifeGroup.position.x = REST_X;
        _knifeGroup.position.y = REST_Y;
        _knifeGroup.position.z = REST_Z + (p < 0.6 ? (p / 0.6) * (-0.22) : ((1 - p) / 0.4) * (-0.22));
        break;

      case ATK_HEAVY:
        // Big arc, more travel
        _knifeGroup.rotation.x = REST_ROT_X + (p < 0.55 ? (p / 0.55) * (-2.0 - REST_ROT_X) : ((1 - p) / 0.45) * (-2.0 - REST_ROT_X) + (-2.0 - REST_ROT_X) * 0);
        _knifeGroup.position.x = REST_X + Math.sin(p * Math.PI) * (-0.5);
        _knifeGroup.position.y = REST_Y + Math.sin(p * Math.PI) * 0.14;
        _knifeGroup.position.z = REST_Z;
        break;

      case ATK_EXEC:
        // Dramatic inward thrust with lift
        _knifeGroup.rotation.x = REST_ROT_X - p * 1.8;
        _knifeGroup.position.x = REST_X;
        _knifeGroup.position.y = REST_Y + p * 0.12;
        _knifeGroup.position.z = REST_Z + (p < 0.5 ? p * (-0.3) : (1 - p) * (-0.3));
        break;
    }
  }

  // ── Auto-resolve hits via game globals ────────────────────────────────────
  function _autoResolveHits() {
    if (!_camera) return;
    var playerPos = _getPlayerPos();
    var allEnemies = _getEnemies();
    _resolveHits(playerPos, _camera, allEnemies, _defaultHitCallback);
  }

  function _getPlayerPos() {
    if (window._player && window._player.position) return window._player.position;
    if (window._playerMesh && window._playerMesh.position) return window._playerMesh.position;
    // Fallback: derive from camera
    if (_camera) return _camera.position;
    return new THREE.Vector3();
  }

  function _getEnemies() {
    if (window._allEnemies) return window._allEnemies;
    if (window.Enemies && window.Enemies.getAll) return window.Enemies.getAll();
    return [];
  }

  function _defaultHitCallback(enemy, dmg, killType) {
    if (window.Enemies && window.Enemies.damageEnemy) {
      window.Enemies.damageEnemy(enemy, dmg, 'knife');
    } else if (enemy.hp !== undefined) {
      enemy.hp -= dmg;
    }

    // Score on kill
    var isKill = (enemy.hp !== undefined && enemy.hp <= 0) ||
                 (enemy.alive !== undefined && !enemy.alive);
    if (isKill) {
      var scoreAmt = 0;
      if (killType === ATK_SLASH)  scoreAmt = SCORE_SLASH_KILL;
      if (killType === ATK_STAB)   scoreAmt = SCORE_STAB_KILL;
      if (killType === ATK_EXEC)   scoreAmt = SCORE_EXECUTE;
      if (killType === 'stealth')  scoreAmt = SCORE_STEALTH;
      if (scoreAmt > 0 && window.Progression && window.Progression.addScore) {
        window.Progression.addScore(scoreAmt);
      }
    }
  }

  // ── Main hit resolution ────────────────────────────────────────────────────
  function _resolveHits(playerPos, camera, allEnemies, onHitCallback) {
    if (!_equipped || _currentAtk === ATK_NONE) return;
    if (!playerPos || !camera) return;

    var forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    // Attack parameters
    var dmg   = 0;
    var range = 0;
    var arcDot = 0.4;         // minimum forward dot for arc attacks
    var knockback = false;

    switch (_currentAtk) {
      case ATK_SLASH:  dmg = 35;  range = 2.5; arcDot = 0.25; break;
      case ATK_STAB:   dmg = 50;  range = 2.0; arcDot = 0.6;  break;
      case ATK_HEAVY:  dmg = 80;  range = 3.0; arcDot = 0.2;  knockback = true; break;
      case ATK_EXEC:   dmg = 250; range = 1.5; arcDot = 0.3;  break;
    }

    if (!allEnemies || !allEnemies.length) return;

    for (var i = 0; i < allEnemies.length; i++) {
      var enemy = allEnemies[i];
      if (!enemy) continue;
      if (enemy.alive === false) continue;

      var ePos = (enemy.mesh && enemy.mesh.position) ? enemy.mesh.position : enemy.position;
      if (!ePos) continue;

      var dx = ePos.x - playerPos.x;
      var dz = ePos.z - playerPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > range) continue;

      var toEnemy = new THREE.Vector3(dx, 0, dz).normalize();
      var dot = forward.dot(toEnemy);
      if (dot < arcDot) continue;

      // ── Execute: only if enemy HP < 30% ───────────────────────────────
      if (_currentAtk === ATK_EXEC) {
        var maxHp = enemy.maxHp || enemy.maxHealth || 100;
        var curHp = (enemy.hp !== undefined) ? enemy.hp : (enemy.health || 100);
        if (curHp / maxHp >= 0.3) {
          // Not below 30% — no execute
          continue;
        }
      }

      // ── Stealth kill: attacking from behind (dot < -0.7) within 2 units ─
      var behindDot = forward.dot(toEnemy);
      var isStealthKill = (behindDot < -0.7) && (dist <= 2.0);
      if (isStealthKill) {
        // Instant kill, no alert
        if (enemy.silentKill !== undefined) enemy.silentKill = true;
        _spawnBloodAt(ePos, forward);
        if (onHitCallback) onHitCallback(enemy, 9999, 'stealth');
        else _defaultHitCallback(enemy, 9999, 'stealth');
        // Add stealth score bonus
        if (window.Progression && window.Progression.addScore) {
          window.Progression.addScore(SCORE_STEALTH);
        }
        continue;
      }

      // ── Normal hit ────────────────────────────────────────────────────
      var actualDmg = dmg;
      _spawnBloodAt(ePos, forward);

      if (_currentAtk === ATK_SLASH && window.CameraSystem && window.CameraSystem.shake) {
        window.CameraSystem.shake(0.03, 0.2);
      }
      if (_currentAtk === ATK_HEAVY && window.CameraSystem && window.CameraSystem.shake) {
        window.CameraSystem.shake(0.06, 0.35);
        // Apply knockback to enemy
        if (knockback && enemy.mesh) {
          var kbDir = toEnemy.clone().multiplyScalar(2.5);
          enemy.mesh.position.x += kbDir.x;
          enemy.mesh.position.z += kbDir.z;
        }
      }

      _playHitSound();

      if (onHitCallback) {
        onHitCallback(enemy, actualDmg, _currentAtk);
      } else {
        _defaultHitCallback(enemy, actualDmg, _currentAtk);
      }
    }

    // Barrel check
    if (window.ExplosiveBarrels && window.ExplosiveBarrels.checkKnifeHit) {
      window.ExplosiveBarrels.checkKnifeHit(playerPos, forward, range);
    }
  }

  // ── Parry ─────────────────────────────────────────────────────────────────
  function openParryWindow() {
    // Called externally by enemy attack system
    _parryWindow = 0.1;
  }

  function _doParry() {
    _parrySuccess = true;
    _parryWindow = 0;
    _parryFlashTimer = 0.15;
    _playScrapeSound();
    // Notify game of successful parry
    if (window._lastAttackingEnemy) {
      window._lastAttackingEnemy.stunTimer = 0.8;
    }
    if (window.CameraSystem && window.CameraSystem.shake) {
      window.CameraSystem.shake(0.015, 0.1);
    }
  }

  // ── Slow motion ───────────────────────────────────────────────────────────
  function _startSlowMo() {
    _slowMoActive = true;
    _slowMoTimer = 0.5;
  }

  // ── Red execute flash ─────────────────────────────────────────────────────
  function _triggerRedFlash() {
    _redFlashTimer = 0.5;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BLOOD PARTICLES
  // ══════════════════════════════════════════════════════════════════════════
  function _spawnBloodAt(pos, forwardDir) {
    if (!_scene) return;
    var count = 4 + Math.floor(Math.random() * 3); // 4-6 spheres
    for (var i = 0; i < count; i++) {
      var geo = new THREE.SphereGeometry(0.04, 4, 4);
      var mat = new THREE.MeshBasicMaterial({
        color: 0x880000,
        transparent: true,
        opacity: 1.0
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, pos.y + 0.85, pos.z);

      // Spray arc outward + upward with gravity
      var angle = (Math.random() - 0.5) * Math.PI * 1.4;
      var speed = 1.8 + Math.random() * 2.8;
      var velX = Math.sin(angle) * speed * 0.7 + (forwardDir ? forwardDir.x * speed * 0.3 : 0);
      var velY = 1.2 + Math.random() * 2.0;
      var velZ = Math.cos(angle) * speed * 0.7 + (forwardDir ? forwardDir.z * speed * 0.3 : 0);

      _scene.add(mesh);
      _bloodParticles.push({
        mesh: mesh,
        vel: { x: velX, y: velY, z: velZ },
        life: 0.7 + Math.random() * 0.4,
        maxLife: 1.1
      });
    }
  }

  function _updateBlood(delta) {
    var gravity = 9.8;
    var i = _bloodParticles.length;
    while (i--) {
      var p = _bloodParticles[i];
      p.life -= delta;
      if (p.life <= 0) {
        if (_scene && p.mesh) _scene.remove(p.mesh);
        if (p.mesh && p.mesh.geometry) p.mesh.geometry.dispose();
        if (p.mesh && p.mesh.material) p.mesh.material.dispose();
        _bloodParticles.splice(i, 1);
        continue;
      }
      // Gravity
      p.vel.y -= gravity * delta;
      p.mesh.position.x += p.vel.x * delta;
      p.mesh.position.y += p.vel.y * delta;
      p.mesh.position.z += p.vel.z * delta;
      // Stop at ground
      if (p.mesh.position.y < 0.02) {
        p.mesh.position.y = 0.02;
        p.vel.y = 0;
        p.vel.x *= 0.4;
        p.vel.z *= 0.4;
      }
      // Fade
      var alpha = p.life / p.maxLife;
      if (p.mesh.material) p.mesh.material.opacity = alpha;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AUDIO (Web Audio API)
  // ══════════════════════════════════════════════════════════════════════════
  function _audioCtx() {
    return window._audioCtx || null;
  }

  // Metallic swish on swing
  function _playSwishSound() {
    var ctx = _audioCtx();
    if (!ctx) return;
    try {
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.18, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.6);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 2200;
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.38, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      src.connect(hpf);
      hpf.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) { /* audio unavailable */ }
  }

  // Wet thud on hit
  function _playHitSound() {
    var ctx = _audioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.12);

      var distBuf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
      var distData = distBuf.getChannelData(0);
      for (var j = 0; j < distData.length; j++) {
        distData[j] = (Math.random() * 2 - 1) * 0.4 * Math.pow(1 - j / distData.length, 2);
      }
      var distSrc = ctx.createBufferSource();
      distSrc.buffer = distBuf;

      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.55, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      var gain2 = ctx.createGain();
      gain2.gain.value = 0.3;

      osc.connect(gain);
      gain.connect(ctx.destination);
      distSrc.connect(gain2);
      gain2.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
      distSrc.start();
    } catch (e) { /* audio unavailable */ }
  }

  // Metallic scrape (block / draw)
  function _playScrapeSound() {
    var ctx = _audioCtx();
    if (!ctx) return;
    try {
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.22, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        var t = i / data.length;
        data[i] = (Math.random() * 2 - 1) * (1 - t) * 0.5
                  + Math.sin(i * 0.15) * 0.15 * (1 - t);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 3500;
      bpf.Q.value = 2.0;
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      src.connect(bpf);
      bpf.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) { /* audio unavailable */ }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HUD UPDATE
  // ══════════════════════════════════════════════════════════════════════════
  function _updateHUD() {
    if (!_hudEl) return;
    if (!_equipped) { _hudEl.style.display = 'none'; return; }
    _hudEl.style.display = 'flex';

    var canvas = document.getElementById('melee-sys-hud-arc');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 36, 36);

    var cx = 18, cy = 18, r = 13;
    var ready = _cooldown <= 0;

    if (ready) {
      ctx.strokeStyle = _currentAtk !== ATK_NONE ? '#ff6622' : '#44ddaa';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Background ring
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      // Fill fraction
      var frac = 1 - (_cooldown / COOLDOWN_BASE);
      if (frac > 1) frac = 1;
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
    }

    // Attack type label
    var icon = document.getElementById('melee-sys-hud-icon');
    if (icon) {
      if (_parryWindow > 0) {
        icon.style.color = '#ffdd00';
      } else if (_currentAtk === ATK_EXEC) {
        icon.style.color = '#ff2222';
      } else if (_currentAtk !== ATK_NONE) {
        icon.style.color = '#ff8844';
      } else {
        icon.style.color = '#eeeeee';
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RESET / CLEAR
  // ══════════════════════════════════════════════════════════════════════════
  function reset() {
    _equipped = false;
    window._meleeActive = false;
    window._meleeAttacking = false;
    _cooldown = 0;
    _currentAtk = ATK_NONE;
    _atkTimer = 0;
    _lmbHeld = false;
    _rmbHeld = false;
    _lmbHeldTime = 0;
    _lmbHeavyFired = false;
    _parryWindow = 0;
    _parrySuccess = false;
    _slowMoActive = false;
    _slowMoTimer = 0;
    _redFlashTimer = 0;
    _parryFlashTimer = 0;

    if (_knifeGroup) {
      _knifeGroup.visible = false;
      _knifeGroup.position.set(REST_X, REST_Y, REST_Z);
      _knifeGroup.rotation.x = REST_ROT_X;
    }

    if (_redFlashEl) _redFlashEl.style.background = 'rgba(180,0,0,0)';
    if (_parryFlashEl) _parryFlashEl.style.background = 'rgba(255,220,50,0)';
    if (_hudEl) _hudEl.style.display = 'none';

    // Clear blood
    for (var i = 0; i < _bloodParticles.length; i++) {
      if (_scene && _bloodParticles[i].mesh) _scene.remove(_bloodParticles[i].mesh);
      if (_bloodParticles[i].mesh && _bloodParticles[i].mesh.geometry) {
        _bloodParticles[i].mesh.geometry.dispose();
      }
      if (_bloodParticles[i].mesh && _bloodParticles[i].mesh.material) {
        _bloodParticles[i].mesh.material.dispose();
      }
    }
    _bloodParticles = [];
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════════════════════
  return {
    init: init,
    update: update,
    attack: attack,
    reset: reset,
    openParryWindow: openParryWindow
  };

})();
