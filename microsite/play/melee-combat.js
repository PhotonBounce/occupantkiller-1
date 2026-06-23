/**
 * melee-combat.js — Expanded hand-to-hand and close-quarters melee combat
 *
 * Features:
 *   - C key cycles melee mode (FIST, KNIFE, ENTRENCHING_TOOL, RIFLE_BUTT, BAYONET)
 *   - Left-click light attack: 60 dmg, 0.4s swing, 1.8 unit range
 *   - Right-click heavy attack: 120 dmg, 0.9s windup, 2.2 unit range, knockback 2u
 *   - Combo system: 3 lights in <2s → 4th auto-finisher (+50% dmg)
 *   - Parry (Space near enemy): deflect if timed within 0.3s of enemy swing
 *   - Takedown (C+F): silent kill behind enemy within 1.5u, collapse animation
 *   - Charge attack (hold C, release): sprint 3u, shoulder bash, 150 dmg, stun 2s
 *   - Block (hold RMB in melee mode): 70% dmg reduction, -5 stamina/hit
 *   - Stamina bar: 100 stamina, heavy -25, block -10, regen 20/s idle
 *   - Blood particle effects on hit (3-6 red spheres, gravity, 0.5s TTL)
 *   - HUD: "MELEE [WEAPON] [COMBO: X/3] [STAMINA: XX%]"
 *
 * IIFE pattern, all var (never let/const).
 * Exports: window.MeleeCombat
 */
window.MeleeCombat = (function () {
  'use strict';

  // ── Scene refs ───────────────────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;

  // ── Weapon definitions ───────────────────────────────────────────────────────
  var WEAPONS = ['FIST', 'KNIFE', 'ENTRENCHING_TOOL', 'RIFLE_BUTT', 'BAYONET'];
  var _weaponIndex = 0;           // current weapon index in WEAPONS array

  // ── Melee mode state ─────────────────────────────────────────────────────────
  var _meleeActive = false;        // in melee mode
  var _weaponGroup = null;         // THREE.Group attached to camera

  // ── Attack state ─────────────────────────────────────────────────────────────
  var LIGHT_DAMAGE    = 60;
  var HEAVY_DAMAGE    = 120;
  var CHARGE_DAMAGE   = 150;
  var LIGHT_RANGE     = 1.8;
  var HEAVY_RANGE     = 2.2;
  var CHARGE_RANGE    = 3.0;
  var KNOCKBACK_DIST  = 2.0;
  var STUN_DURATION   = 2.0;
  var LIGHT_SWING_DUR = 0.4;      // seconds
  var HEAVY_WINDUP    = 0.9;      // seconds

  var ATK_NONE   = 0;
  var ATK_LIGHT  = 1;
  var ATK_HEAVY  = 2;
  var ATK_CHARGE = 3;

  var _currentAtk    = ATK_NONE;
  var _atkTimer      = 0;          // time into current attack
  var _atkDuration   = 0;          // duration of current attack animation
  var _cooldown      = 0;          // cooldown between attacks

  // ── Combo system ─────────────────────────────────────────────────────────────
  var _comboCount     = 0;         // consecutive light hits
  var _comboTimer     = 0;         // resets if > 2s without another light
  var COMBO_WINDOW    = 2.0;       // seconds
  var COMBO_MAX       = 3;         // after 3 lights, 4th is finisher

  // ── Parry state ──────────────────────────────────────────────────────────────
  var _parryAvailable  = false;    // parry window open (Space to use)
  var _parryWindowTime = 0;        // countdown (0.3s window)
  var _parrySuccess    = false;
  var _parryFlashTimer = 0;
  var _counterWindow   = 0;        // counter-attack window after successful parry (0.5s)
  var PARRY_WINDOW_DUR = 0.3;
  var COUNTER_WINDOW   = 0.5;

  // ── Block state ───────────────────────────────────────────────────────────────
  var _blocking          = false;
  var BLOCK_DAMAGE_MULT  = 0.30;   // 30% damage taken (70% reduced)
  var BLOCK_STAMINA_COST = 5;      // per hit blocked

  // ── Takedown state ────────────────────────────────────────────────────────────
  var _takedownPending  = false;
  var _fKeyHeld         = false;
  var _cKeyHeld         = false;
  var _cHoldTimer       = 0;       // seconds C is held for charge
  var CHARGE_HOLD_TIME  = 0.5;     // hold C this long to arm charge
  var _chargeArmed      = false;
  var _charging         = false;
  var _chargeProgress   = 0;       // 0→1 over charge sprint

  // ── Stamina ──────────────────────────────────────────────────────────────────
  var _stamina    = 100;
  var MAX_STAMINA = 100;
  var STAMINA_REGEN = 20;          // per second when idle

  // ── Blood particles ──────────────────────────────────────────────────────────
  var _bloodParticles = [];        // { mesh, vel, life, maxLife }
  var GRAVITY = -9.8;
  var BLOOD_TTL = 0.5;

  // ── Nearby enemies list (set externally or sampled) ──────────────────────────
  var _enemies = [];               // array of THREE.Object3D with userData.health etc.

  // ── Input tracking ───────────────────────────────────────────────────────────
  var _lmbDown = false;
  var _rmbDown = false;

  // ── HUD ──────────────────────────────────────────────────────────────────────
  var _hudEl = null;

  // ── Swing animation rest pose per weapon ─────────────────────────────────────
  var _restPose = { x: 0.2, y: -0.25, z: -0.4 };

  // ═══════════════════════════════════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════════════════════════════════

  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    _buildHUD();
    _bindInput();
    _updateHUD();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HUD
  // ═══════════════════════════════════════════════════════════════════════════════

  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'melee-combat-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ffffff',
      'font-family:monospace',
      'font-size:13px',
      'letter-spacing:1px',
      'text-shadow:0 0 4px #000,0 0 8px #000',
      'pointer-events:none',
      'display:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_meleeActive) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';
    var weaponName = WEAPONS[_weaponIndex];
    var comboStr   = 'COMBO: ' + _comboCount + '/' + COMBO_MAX;
    var stamPct    = Math.round((_stamina / MAX_STAMINA) * 100);
    var stamStr    = 'STAMINA: ' + stamPct + '%';
    var blockStr   = _blocking ? ' [BLOCK]' : '';
    var parryStr   = _parrySuccess ? ' [PARRY!]' : '';
    _hudEl.textContent = 'MELEE [' + weaponName + '] [' + comboStr + '] [' + stamStr + ']' + blockStr + parryStr;
    // Color stamina warning
    if (_stamina < 25) {
      _hudEl.style.color = '#ff4444';
    } else if (_stamina < 60) {
      _hudEl.style.color = '#ffcc00';
    } else {
      _hudEl.style.color = '#ffffff';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // INPUT BINDING
  // ═══════════════════════════════════════════════════════════════════════════════

  function _bindInput() {
    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keyup',   _onKeyUp,   false);
    document.addEventListener('mousedown', _onMouseDown, false);
    document.addEventListener('mouseup',   _onMouseUp,   false);
    document.addEventListener('contextmenu', function(e) {
      if (_meleeActive) e.preventDefault();
    }, false);
  }

  function _onKeyDown(e) {
    var key = e.key ? e.key.toUpperCase() : '';

    if (key === 'C') {
      if (!_cKeyHeld) {
        _cKeyHeld = true;
        _cHoldTimer = 0;
        if (!_meleeActive) {
          _enterMeleeMode();
        } else {
          // Will cycle weapon on key-up if not held for charge
        }
      }
    }

    if (key === 'F') {
      _fKeyHeld = true;
      if (_cKeyHeld && _meleeActive) {
        _attemptTakedown();
      }
    }

    if (key === ' ' || e.code === 'Space') {
      if (_meleeActive && _parryAvailable) {
        _doParry();
      }
    }
  }

  function _onKeyUp(e) {
    var key = e.key ? e.key.toUpperCase() : '';

    if (key === 'C') {
      if (_cKeyHeld) {
        _cKeyHeld = false;
        if (_chargeArmed && _meleeActive) {
          // Release charge
          _chargeArmed = false;
          _doChargeAttack();
        } else if (_meleeActive && _cHoldTimer < CHARGE_HOLD_TIME) {
          // Short tap → cycle weapon
          _cycleWeapon();
        }
      }
    }

    if (key === 'F') {
      _fKeyHeld = false;
    }
  }

  function _onMouseDown(e) {
    if (!_meleeActive) return;
    if (e.button === 0) {
      _lmbDown = true;
      _doLightAttack();
    }
    if (e.button === 2) {
      _rmbDown = true;
      _startBlock();
    }
  }

  function _onMouseUp(e) {
    if (e.button === 2) {
      _rmbDown = false;
      _stopBlock();
    }
    if (e.button === 0) {
      _lmbDown = false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MELEE MODE & WEAPON CYCLING
  // ═══════════════════════════════════════════════════════════════════════════════

  function _enterMeleeMode() {
    _meleeActive = true;
    window._meleeActive = true;
    _buildWeaponMesh();
    _updateHUD();
  }

  function _exitMeleeMode() {
    _meleeActive = false;
    window._meleeActive = false;
    _removeWeaponMesh();
    _hudEl.style.display = 'none';
  }

  function _cycleWeapon() {
    _weaponIndex = (_weaponIndex + 1) % WEAPONS.length;
    _removeWeaponMesh();
    _buildWeaponMesh();
    _updateHUD();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // WEAPON MESH BUILDING
  // ═══════════════════════════════════════════════════════════════════════════════

  function _removeWeaponMesh() {
    if (_weaponGroup && _camera) {
      _camera.remove(_weaponGroup);
    }
    _weaponGroup = null;
  }

  function _buildWeaponMesh() {
    if (!_camera) return;
    _weaponGroup = new THREE.Group();

    var name = WEAPONS[_weaponIndex];
    if (name === 'FIST') {
      _buildFist();
    } else if (name === 'KNIFE') {
      _buildKnife();
    } else if (name === 'ENTRENCHING_TOOL') {
      _buildEntrenchingTool();
    } else if (name === 'RIFLE_BUTT') {
      _buildRifleButt();
    } else if (name === 'BAYONET') {
      _buildBayonet();
    }

    _weaponGroup.position.set(_restPose.x, _restPose.y, _restPose.z);
    _camera.add(_weaponGroup);
  }

  function _buildFist() {
    // Two fist cubes — knuckle bump geometry
    var knuckleMat = new THREE.MeshLambertMaterial({ color: 0xd2a679 });

    var mainGeo = new THREE.BoxGeometry(0.12, 0.10, 0.10);
    var main = new THREE.Mesh(mainGeo, knuckleMat);
    main.position.set(0, 0, -0.05);
    _weaponGroup.add(main);

    // Thumb
    var thumbGeo = new THREE.BoxGeometry(0.04, 0.09, 0.04);
    var thumb = new THREE.Mesh(thumbGeo, knuckleMat);
    thumb.position.set(0.08, 0, 0);
    _weaponGroup.add(thumb);
  }

  function _buildKnife() {
    // Blade: BoxGeometry(0.05, 0.25, 0.02) silver
    var bladeMat = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
    var bladeGeo = new THREE.BoxGeometry(0.05, 0.25, 0.02);
    var blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.set(0, 0, -0.13);
    blade.rotation.x = Math.PI / 2;
    _weaponGroup.add(blade);

    // Handle: dark grip
    var handleMat = new THREE.MeshLambertMaterial({ color: 0x3c2a1a });
    var handleGeo = new THREE.BoxGeometry(0.04, 0.12, 0.04);
    var handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0, 0, 0.02);
    handle.rotation.x = Math.PI / 2;
    _weaponGroup.add(handle);
  }

  function _buildEntrenchingTool() {
    // Blade: BoxGeometry(0.25, 0.2, 0.02) steel
    var bladeMat = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
    var bladeGeo = new THREE.BoxGeometry(0.25, 0.2, 0.02);
    var blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.set(0, 0, -0.22);
    blade.rotation.x = Math.PI / 2;
    _weaponGroup.add(blade);

    // Handle: CylinderGeometry
    var handleMat = new THREE.MeshLambertMaterial({ color: 0x5c3d1a });
    var handleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8);
    var handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0, 0, 0.0);
    handle.rotation.x = Math.PI / 2;
    _weaponGroup.add(handle);
  }

  function _buildRifleButt() {
    // BoxGeometry(0.1, 0.1, 0.5) brown
    var buttMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    var buttGeo = new THREE.BoxGeometry(0.1, 0.1, 0.5);
    var butt = new THREE.Mesh(buttGeo, buttMat);
    butt.position.set(0, 0, -0.15);
    _weaponGroup.add(butt);

    // Barrel suggestion — dark tube
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var barrelGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.3, 8);
    var barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.set(0, 0, -0.4);
    barrel.rotation.x = Math.PI / 2;
    _weaponGroup.add(barrel);
  }

  function _buildBayonet() {
    // Long thin blade on barrel: BoxGeometry(0.03, 0.30, 0.015) silver
    var bladeMat = new THREE.MeshLambertMaterial({ color: 0xC8C8C8 });
    var bladeGeo = new THREE.BoxGeometry(0.03, 0.30, 0.015);
    var blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.set(0.05, 0, -0.22);
    blade.rotation.x = Math.PI / 2;
    _weaponGroup.add(blade);

    // Rifle barrel stub
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var barrelGeo = new THREE.BoxGeometry(0.06, 0.06, 0.35);
    var barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.set(0, 0, -0.1);
    _weaponGroup.add(barrel);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ATTACKS
  // ═══════════════════════════════════════════════════════════════════════════════

  function _doLightAttack() {
    if (!_meleeActive) return;
    if (_currentAtk !== ATK_NONE) return;
    if (_cooldown > 0) return;

    // If combo finisher condition met (3 lights already done)
    var damage = LIGHT_DAMAGE;
    var isFinisher = false;
    if (_comboCount >= COMBO_MAX) {
      damage = Math.round(LIGHT_DAMAGE * 1.5);
      isFinisher = true;
      _comboCount = 0;
      _comboTimer = 0;
    }

    _currentAtk   = ATK_LIGHT;
    _atkTimer     = 0;
    _atkDuration  = LIGHT_SWING_DUR;

    // Register hit mid-swing
    _scheduleHit(LIGHT_SWING_DUR * 0.5, damage, LIGHT_RANGE, 0, false);

    if (!isFinisher) {
      _comboCount++;
      _comboTimer = 0;
    }
  }

  function _doHeavyAttack() {
    if (!_meleeActive) return;
    if (_currentAtk !== ATK_NONE) return;
    if (_cooldown > 0) return;
    if (_stamina < 25) return;  // not enough stamina

    _stamina = Math.max(0, _stamina - 25);

    _currentAtk  = ATK_HEAVY;
    _atkTimer    = 0;
    _atkDuration = HEAVY_WINDUP;

    // Hit at end of windup
    _scheduleHit(HEAVY_WINDUP * 0.9, HEAVY_DAMAGE, HEAVY_RANGE, KNOCKBACK_DIST, false);

    // Reset combo on heavy
    _comboCount = 0;
    _comboTimer = 0;
  }

  function _doChargeAttack() {
    if (!_meleeActive) return;
    if (_currentAtk !== ATK_NONE) return;
    if (_stamina < 30) return;

    _stamina = Math.max(0, _stamina - 30);
    _charging = true;
    _chargeProgress = 0;
    _currentAtk   = ATK_CHARGE;
    _atkTimer     = 0;
    _atkDuration  = 0.6;

    _scheduleHit(0.4, CHARGE_DAMAGE, CHARGE_RANGE, KNOCKBACK_DIST, true);  // stun=true
  }

  // Simple deferred hit: fires a hit check after `delay` seconds using a closure-captured timer
  // We store scheduled hits in an array and process them in update()
  var _scheduledHits = [];

  function _scheduleHit(delay, damage, range, knockback, stun) {
    _scheduledHits.push({
      delay:     delay,
      damage:    damage,
      range:     range,
      knockback: knockback,
      stun:      stun,
      timer:     0
    });
  }

  function _processScheduledHits(delta) {
    var i = _scheduledHits.length;
    while (i--) {
      var sh = _scheduledHits[i];
      sh.timer += delta;
      if (sh.timer >= sh.delay) {
        _applyHit(sh.damage, sh.range, sh.knockback, sh.stun);
        _scheduledHits.splice(i, 1);
      }
    }
  }

  function _applyHit(damage, range, knockback, stun) {
    if (!_camera) return;

    var camPos = new THREE.Vector3();
    _camera.getWorldPosition(camPos);
    var camDir = new THREE.Vector3();
    _camera.getWorldDirection(camDir);

    var hit = false;
    var i;
    for (i = 0; i < _enemies.length; i++) {
      var enemy = _enemies[i];
      if (!enemy || !enemy.position) continue;

      var dist = camPos.distanceTo(enemy.position);
      if (dist > range) continue;

      // Check roughly in front of camera
      var toEnemy = new THREE.Vector3().subVectors(enemy.position, camPos).normalize();
      var dot = camDir.dot(toEnemy);
      if (dot < 0.4) continue;  // must be within ~66 degrees forward

      // Apply damage
      var finalDamage = damage;
      if (!enemy.userData) enemy.userData = {};
      if (typeof enemy.userData.health === 'undefined') enemy.userData.health = 100;
      enemy.userData.health -= finalDamage;

      // Knockback
      if (knockback > 0) {
        var kbDir = toEnemy.clone().multiplyScalar(knockback);
        enemy.position.add(kbDir);
      }

      // Stun
      if (stun) {
        enemy.userData.stunned = true;
        enemy.userData.stunTimer = STUN_DURATION;
      }

      // Blood effects
      _spawnBlood(enemy.position.clone());

      // Parry counter bonus
      if (_counterWindow > 0) {
        enemy.userData.health -= Math.round(finalDamage * 0.5);
        _counterWindow = 0;
      }

      hit = true;
    }

    if (hit) {
      _cooldown = 0.3;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // BLOCK
  // ═══════════════════════════════════════════════════════════════════════════════

  function _startBlock() {
    if (!_meleeActive) return;
    if (_currentAtk !== ATK_NONE) return;
    _blocking = true;
    window._meleeBlocking = true;
    _updateHUD();
  }

  function _stopBlock() {
    _blocking = false;
    window._meleeBlocking = false;
    _updateHUD();
  }

  // Called externally when player receives melee damage while blocking
  function receiveBlocked(incomingDamage) {
    if (!_blocking) return incomingDamage;
    _stamina = Math.max(0, _stamina - BLOCK_STAMINA_COST);
    return Math.round(incomingDamage * BLOCK_DAMAGE_MULT);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PARRY
  // ═══════════════════════════════════════════════════════════════════════════════

  // Called externally when an enemy is about to swing
  function notifyEnemySwing() {
    if (!_meleeActive) return;
    _parryAvailable  = true;
    _parryWindowTime = PARRY_WINDOW_DUR;
  }

  function _doParry() {
    if (!_parryAvailable) return;
    _parryAvailable = false;
    _parryWindowTime = 0;
    _parrySuccess = true;
    _parryFlashTimer = 0.5;
    _counterWindow = COUNTER_WINDOW;

    if (_hudEl) {
      _hudEl.style.color = '#00ffff';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // TAKEDOWN
  // ═══════════════════════════════════════════════════════════════════════════════

  function _attemptTakedown() {
    if (!_camera) return;

    var camPos = new THREE.Vector3();
    _camera.getWorldPosition(camPos);
    var camDir = new THREE.Vector3();
    _camera.getWorldDirection(camDir);

    var i;
    for (i = 0; i < _enemies.length; i++) {
      var enemy = _enemies[i];
      if (!enemy || !enemy.position) continue;

      var dist = camPos.distanceTo(enemy.position);
      if (dist > 1.5) continue;

      // Check if player is behind enemy
      var toPlayer = new THREE.Vector3().subVectors(camPos, enemy.position).normalize();
      var enemyFwd = new THREE.Vector3();
      if (enemy.userData && enemy.userData.forward) {
        enemyFwd.copy(enemy.userData.forward);
      } else {
        enemyFwd.set(0, 0, 1);  // default enemy forward
      }
      var behindDot = enemyFwd.dot(toPlayer);
      // behindDot < -0.5 means player is roughly behind enemy
      if (behindDot > -0.3) continue;

      // Perform silent takedown
      _doSilentTakedown(enemy);
      break;
    }
  }

  function _doSilentTakedown(enemy) {
    if (!enemy.userData) enemy.userData = {};
    enemy.userData.health = 0;
    enemy.userData.takedown = true;
    enemy.userData.takedownTimer = 0;
    enemy.userData.takedownDuration = 0.5;
    enemy.userData.origScaleY = enemy.scale.y;
    // Silent — no blood spray, no noise flag
    enemy.userData.silent = true;
    _updateHUD();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // BLOOD EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════════

  function _spawnBlood(position) {
    if (!_scene) return;

    var count = 3 + Math.floor(Math.random() * 4);  // 3-6 particles
    var bloodMat = new THREE.MeshBasicMaterial({ color: 0xaa0011, transparent: true, opacity: 0.9 });
    var i;
    for (i = 0; i < count; i++) {
      var radius = 0.02 + Math.random() * 0.03;
      var geo = new THREE.SphereGeometry(radius, 4, 4);
      var mesh = new THREE.Mesh(geo, bloodMat.clone());
      mesh.position.copy(position);
      mesh.position.x += (Math.random() - 0.5) * 0.15;
      mesh.position.y += Math.random() * 0.2;
      mesh.position.z += (Math.random() - 0.5) * 0.15;

      var vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3.0,
        1.5 + Math.random() * 2.0,
        (Math.random() - 0.5) * 3.0
      );

      _scene.add(mesh);
      _bloodParticles.push({
        mesh:    mesh,
        vel:     vel,
        life:    BLOOD_TTL,
        maxLife: BLOOD_TTL
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SWING ANIMATION
  // ═══════════════════════════════════════════════════════════════════════════════

  function _animateWeapon(delta) {
    if (!_weaponGroup) return;

    if (_currentAtk === ATK_LIGHT) {
      // rotation.z: 0 → -0.8 → 0 over _atkDuration
      var t = _atkTimer / _atkDuration;
      var swing = t < 0.5 ? (t / 0.5) : (1.0 - (t - 0.5) / 0.5);
      _weaponGroup.rotation.z = -swing * 0.8;
      _weaponGroup.position.z = _restPose.z - swing * 0.1;
    } else if (_currentAtk === ATK_HEAVY) {
      var t2 = _atkTimer / _atkDuration;
      // Slow windup then fast strike at end
      var swing2 = t2 < 0.6 ? -(t2 / 0.6) * 0.5 : -(1.0 - (t2 - 0.6) / 0.4) * 0.5 - (1.0 - (t2 - 0.6) / 0.4) * 1.0;
      _weaponGroup.rotation.z = swing2;
      _weaponGroup.rotation.x = t2 * 0.3;
    } else if (_currentAtk === ATK_CHARGE) {
      var t3 = _atkTimer / _atkDuration;
      // Lean forward as charging
      _weaponGroup.rotation.x = t3 * 0.5;
      _weaponGroup.position.z = _restPose.z - t3 * 0.25;
    } else {
      // Return to rest
      _weaponGroup.rotation.z += (0 - _weaponGroup.rotation.z) * delta * 10;
      _weaponGroup.rotation.x += (0 - _weaponGroup.rotation.x) * delta * 10;
      _weaponGroup.position.z += (_restPose.z - _weaponGroup.position.z) * delta * 10;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // TAKEDOWN COLLAPSE ANIMATION
  // ═══════════════════════════════════════════════════════════════════════════════

  function _updateTakedowns(delta) {
    var i;
    for (i = 0; i < _enemies.length; i++) {
      var enemy = _enemies[i];
      if (!enemy || !enemy.userData) continue;
      if (!enemy.userData.takedown) continue;

      enemy.userData.takedownTimer += delta;
      var progress = enemy.userData.takedownTimer / enemy.userData.takedownDuration;
      if (progress >= 1) {
        progress = 1;
        enemy.userData.takedown = false;
      }
      var origY = enemy.userData.origScaleY || 1;
      enemy.scale.y = origY * (1.0 - progress);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CHARGE MOVEMENT
  // ═══════════════════════════════════════════════════════════════════════════════

  function _updateCharge(delta) {
    if (!_charging || !_camera) return;

    _chargeProgress += delta / _atkDuration;
    if (_chargeProgress >= 1) {
      _chargeProgress = 1;
      _charging = false;
    }

    // Push camera forward by a slice of charge distance
    var fwd = new THREE.Vector3();
    _camera.getWorldDirection(fwd);
    fwd.y = 0;
    fwd.normalize();
    _camera.position.addScaledVector(fwd, CHARGE_RANGE * delta / _atkDuration);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // UPDATE (called every frame)
  // ═══════════════════════════════════════════════════════════════════════════════

  function update(delta) {
    if (!delta || delta <= 0) return;

    // ── C hold timer for charge ──────────────────────────────────────────────
    if (_cKeyHeld && _meleeActive) {
      _cHoldTimer += delta;
      if (_cHoldTimer >= CHARGE_HOLD_TIME && !_chargeArmed) {
        _chargeArmed = true;
        // Visual cue — tilt weapon group back
        if (_weaponGroup) {
          _weaponGroup.rotation.x = -0.3;
        }
      }
    }

    // ── Attack timer ─────────────────────────────────────────────────────────
    if (_currentAtk !== ATK_NONE) {
      _atkTimer += delta;
      if (_atkTimer >= _atkDuration) {
        _currentAtk = ATK_NONE;
        _atkTimer   = 0;
        _charging   = false;
        _cooldown   = 0.25;
      }
    }

    // ── Cooldown ─────────────────────────────────────────────────────────────
    if (_cooldown > 0) {
      _cooldown = Math.max(0, _cooldown - delta);
    }

    // ── Combo timer ──────────────────────────────────────────────────────────
    if (_comboCount > 0) {
      _comboTimer += delta;
      if (_comboTimer >= COMBO_WINDOW) {
        _comboCount = 0;
        _comboTimer = 0;
      }
    }

    // ── Parry window countdown ───────────────────────────────────────────────
    if (_parryAvailable) {
      _parryWindowTime -= delta;
      if (_parryWindowTime <= 0) {
        _parryAvailable  = false;
        _parryWindowTime = 0;
      }
    }

    // ── Parry flash timer ────────────────────────────────────────────────────
    if (_parrySuccess) {
      _parryFlashTimer -= delta;
      if (_parryFlashTimer <= 0) {
        _parrySuccess = false;
        _parryFlashTimer = 0;
      }
    }

    // ── Counter window ───────────────────────────────────────────────────────
    if (_counterWindow > 0) {
      _counterWindow = Math.max(0, _counterWindow - delta);
    }

    // ── Stun timer on enemies ────────────────────────────────────────────────
    var i;
    for (i = 0; i < _enemies.length; i++) {
      var enemy = _enemies[i];
      if (!enemy || !enemy.userData) continue;
      if (enemy.userData.stunned && enemy.userData.stunTimer > 0) {
        enemy.userData.stunTimer -= delta;
        if (enemy.userData.stunTimer <= 0) {
          enemy.userData.stunned = false;
          enemy.userData.stunTimer = 0;
        }
      }
    }

    // ── Stamina regen (only when idle — no attack, no block) ─────────────────
    if (_currentAtk === ATK_NONE && !_blocking) {
      _stamina = Math.min(MAX_STAMINA, _stamina + STAMINA_REGEN * delta);
    }

    // ── Heavy attack on RMB + in melee mode (triggered once from _rmbDown logic) ──
    // Heavy attack is initiated from right-click via _onMouseDown → _startBlock
    // But if NOT in a blocking-first intent, we allow right-click hold in melee mode
    // to fire heavy attack after a short hold. Detect via _rmbDown with no block active.
    // (block is started in _startBlock, heavy fires separately — design note:
    //  block on RMB hold in melee mode; heavy triggered as a separate gesture)
    // Resolved: if rmbDown fires and no attack is happening, it blocks.
    // Heavy must come from a separate path. We'll fire heavy from _startBlock
    // if already blocking for >0.3s:
    if (_rmbDown && _blocking && _currentAtk === ATK_NONE) {
      // We store how long RMB held while blocking
      if (!_rmbHoldTimer) { _rmbHoldTimer = 0; }
      _rmbHoldTimer += delta;
      // After 0.35s of holding RMB, transition to heavy attack
      if (_rmbHoldTimer >= 0.35 && _cooldown <= 0) {
        _rmbHoldTimer = 0;
        _blocking = false;
        window._meleeBlocking = false;
        _doHeavyAttack();
      }
    } else {
      _rmbHoldTimer = 0;
    }

    // ── Scheduled hits ───────────────────────────────────────────────────────
    _processScheduledHits(delta);

    // ── Charge movement ──────────────────────────────────────────────────────
    _updateCharge(delta);

    // ── Takedown collapse animation ──────────────────────────────────────────
    _updateTakedowns(delta);

    // ── Blood particles ──────────────────────────────────────────────────────
    _updateBloodParticles(delta);

    // ── Weapon swing animation ───────────────────────────────────────────────
    _animateWeapon(delta);

    // ── HUD ──────────────────────────────────────────────────────────────────
    _updateHUD();
  }

  function _updateBloodParticles(delta) {
    if (!_scene) return;
    var i = _bloodParticles.length;
    while (i--) {
      var p = _bloodParticles[i];
      p.life -= delta;
      if (p.life <= 0) {
        _scene.remove(p.mesh);
        _bloodParticles.splice(i, 1);
        continue;
      }
      // Gravity
      p.vel.y += GRAVITY * delta;
      p.mesh.position.addScaledVector(p.vel, delta);
      // Fade out
      var alpha = p.life / p.maxLife;
      if (p.mesh.material) {
        p.mesh.material.opacity = alpha * 0.9;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RESET
  // ═══════════════════════════════════════════════════════════════════════════════

  function reset() {
    _meleeActive = false;
    window._meleeActive = false;
    window._meleeBlocking = false;
    _weaponIndex = 0;
    _removeWeaponMesh();

    _currentAtk   = ATK_NONE;
    _atkTimer     = 0;
    _atkDuration  = 0;
    _cooldown     = 0;
    _scheduledHits.length = 0;

    _comboCount   = 0;
    _comboTimer   = 0;

    _parryAvailable  = false;
    _parryWindowTime = 0;
    _parrySuccess    = false;
    _parryFlashTimer = 0;
    _counterWindow   = 0;

    _blocking      = false;
    _lmbDown       = false;
    _rmbDown       = false;
    _cKeyHeld      = false;
    _fKeyHeld      = false;
    _cHoldTimer    = 0;
    _chargeArmed   = false;
    _charging      = false;
    _chargeProgress= 0;

    _stamina = MAX_STAMINA;
    _enemies = [];

    // Clear blood
    var i;
    for (i = 0; i < _bloodParticles.length; i++) {
      if (_scene) _scene.remove(_bloodParticles[i].mesh);
    }
    _bloodParticles.length = 0;

    if (_hudEl) {
      _hudEl.style.display = 'none';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════════

  return {
    init:             init,
    update:           update,
    reset:            reset,
    notifyEnemySwing: notifyEnemySwing,
    receiveBlocked:   receiveBlocked,
    setEnemies: function(arr) { _enemies = arr || []; },
    isActive:   function() { return _meleeActive; },
    getStamina: function() { return _stamina; },
    getWeapon:  function() { return WEAPONS[_weaponIndex]; },
    getCombo:   function() { return _comboCount; }
  };

})();
