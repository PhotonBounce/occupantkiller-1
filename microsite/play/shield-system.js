// ============================================================
//  shield-system.js — Ballistic & riot shield mechanics
//  Q key to equip/unequip; double-tap Q to cycle shield type
//  V key to bash; hold V to slam charge
//  Public API: init, update, reset
// ============================================================
window.ShieldSystem = (function () {
  'use strict';

  /* ── Shield type definitions ─────────────────────────────── */
  var SHIELD_TYPES = {
    RIOT: {
      name: 'RIOT',
      label: 'Wood+Ballistic',
      hp: 200,
      speedMult: 0.65,   // heavy
      blockFraction: 0.75,
      color: 0x333333
    },
    BALLISTIC: {
      name: 'BALLISTIC',
      label: 'Kevlar',
      hp: 150,
      speedMult: 0.80,   // medium
      blockFraction: 0.75,
      color: 0x333333
    },
    DOOR: {
      name: 'DOOR',
      label: 'Steel Door',
      hp: 400,
      speedMult: 0.45,   // very slow
      blockFraction: 0.75,
      color: 0x333333
    }
  };

  var TYPE_ORDER = ['RIOT', 'BALLISTIC', 'DOOR'];

  /* ── Shield geometry constants ───────────────────────────── */
  var SHIELD_W   = 0.8;
  var SHIELD_H   = 1.4;
  var SHIELD_D   = 0.08;
  var SHIELD_OFF_X = 0.4;
  var SHIELD_OFF_Y = -0.2;
  var SHIELD_OFF_Z = -0.6;

  /* ── Shield bash / slam constants ────────────────────────── */
  var BASH_KNOCKBACK  = 3;      // units
  var BASH_DAMAGE     = 40;
  var BASH_ANIM_TIME  = 0.25;   // seconds for lunge animation
  var SLAM_CHARGE_TIME = 1.0;   // seconds hold V for slam
  var SLAM_DISTANCE   = 5;      // units sprint
  var SLAM_DAMAGE     = 50;
  var SLAM_RADIUS     = 2;      // AoE radius
  var SLAM_SPEED      = 18;     // units/sec during sprint

  /* ── Repair constants ────────────────────────────────────── */
  var REPAIR_AMOUNT   = 50;
  var REPAIR_RANGE    = 3;

  /* ── Private state ───────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _equipped = false;
  var _typeIdx  = 0;             // index into TYPE_ORDER
  var _hp       = 0;
  var _maxHp    = 0;

  /* Q double-tap tracking */
  var _lastQTime    = 0;
  var _doubleTapMs  = 350;

  /* Shield mesh (attached to camera) */
  var _shieldGroup = null;
  var _crackOverlays = [];   // transparent BoxGeometry overlays for cracks

  /* Bobbing */
  var _bobTime    = 0;
  var _prevCamPos = null;

  /* Bash / slam state */
  var _bashActive  = false;
  var _bashTimer   = 0;
  var _bashStartZ  = 0;          // starting Z offset of shield

  var _vHeld       = false;
  var _chargeTimer  = 0;
  var _slamActive  = false;
  var _slamTimer   = 0;
  var _slamDir     = null;
  var _slamTraveled = 0;

  /* Spark flash */
  var _sparkLight  = null;
  var _sparkTimer  = 0;
  var SPARK_DURATION = 0.08;

  /* HUD elements */
  var _hudEl      = null;
  var _hudText    = null;
  var _hudBarFill = null;

  /* Audio */
  var _audioCtx = null;

  /* ── Helpers ──────────────────────────────────────────────── */
  function _getScene()  { return _scene  || window._gameScene || null; }
  function _getCamera() { return _camera || window._camera    || null; }

  function _currentType() {
    return SHIELD_TYPES[TYPE_ORDER[_typeIdx]];
  }

  function _toast(msg) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
    }
  }

  /* ── Audio ────────────────────────────────────────────────── */
  function _getAudio() {
    if (_audioCtx) return _audioCtx;
    try {
      _audioCtx = window._audioCtx ||
        new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { _audioCtx = null; }
    return _audioCtx;
  }

  function _playImpact() {
    var ctx = _getAudio();
    if (!ctx) return;
    try {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    } catch (e) {}
  }

  function _playEquip() {
    var ctx = _getAudio();
    if (!ctx) return;
    try {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(500, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  }

  function _playBash() {
    var ctx = _getAudio();
    if (!ctx) return;
    try {
      var buf  = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.2), ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) * 0.8;
      }
      var src  = ctx.createBufferSource();
      var gain = ctx.createGain();
      src.buffer = buf;
      src.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      src.start(ctx.currentTime);
    } catch (e) {}
  }

  /* ── HUD creation ─────────────────────────────────────────── */
  function _createHUD() {
    if (_hudEl) return;

    _hudEl = document.createElement('div');
    _hudEl.id = 'shieldSystemHUD';
    _hudEl.style.cssText = [
      'position:fixed',
      'left:12px',
      'bottom:60px',
      'z-index:5000',
      'display:none',
      'pointer-events:none',
      'font-family:monospace',
      'font-size:13px',
      'color:#cccccc',
      'background:rgba(0,0,0,0.55)',
      'border:1px solid #555',
      'border-radius:4px',
      'padding:6px 10px',
      'min-width:200px'
    ].join(';');

    _hudText = document.createElement('div');
    _hudText.style.cssText = 'margin-bottom:4px;font-weight:bold;';
    _hudEl.appendChild(_hudText);

    /* HP bar outer */
    var barOuter = document.createElement('div');
    barOuter.style.cssText = [
      'width:100%',
      'height:7px',
      'background:rgba(0,0,0,0.5)',
      'border:1px solid #444',
      'border-radius:3px',
      'overflow:hidden'
    ].join(';');

    _hudBarFill = document.createElement('div');
    _hudBarFill.style.cssText = [
      'height:100%',
      'width:100%',
      'background:#44cc44',
      'border-radius:3px',
      'transition:width 0.1s,background 0.2s'
    ].join(';');

    barOuter.appendChild(_hudBarFill);
    _hudEl.appendChild(barOuter);

    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_equipped) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';

    var typeName = TYPE_ORDER[_typeIdx];
    var hp = Math.max(0, _hp);
    if (_hudText) {
      _hudText.textContent = 'SHIELD [HP: ' + hp + '/' + _maxHp + '] [' + typeName + ']';
    }

    var pct = _maxHp > 0 ? (hp / _maxHp) : 0;
    if (_hudBarFill) {
      _hudBarFill.style.width = (pct * 100) + '%';
      if (pct > 0.5) {
        _hudBarFill.style.background = '#44cc44';
      } else if (pct > 0.25) {
        _hudBarFill.style.background = '#cccc00';
      } else {
        _hudBarFill.style.background = '#cc2222';
      }
    }
  }

  /* ── Build shield 3D object ──────────────────────────────── */
  function _buildShieldMesh() {
    if (!window.THREE) return null;

    var group = new window.THREE.Group();

    var geo = new window.THREE.BoxGeometry(SHIELD_W, SHIELD_H, SHIELD_D);
    var mat = new window.THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.4,
      roughness: 0.7
    });
    var panel = new window.THREE.Mesh(geo, mat);
    panel.renderOrder = 999;
    group.add(panel);

    /* Position the group in camera space */
    group.position.set(SHIELD_OFF_X, SHIELD_OFF_Y, SHIELD_OFF_Z);

    return group;
  }

  /* ── Crack overlays based on damage ─────────────────────── */
  function _updateCrackOverlays() {
    var cam = _getCamera();
    if (!cam || !_shieldGroup) return;

    /* Remove old overlays */
    for (var i = 0; i < _crackOverlays.length; i++) {
      _shieldGroup.remove(_crackOverlays[i]);
      if (_crackOverlays[i].geometry) _crackOverlays[i].geometry.dispose();
      if (_crackOverlays[i].material) _crackOverlays[i].material.dispose();
    }
    _crackOverlays = [];

    if (!_equipped || _maxHp <= 0) return;

    var pct = _hp / _maxHp;
    /* Show overlays when below 75% HP */
    var damageLevel = 1 - pct; /* 0 = full, 1 = destroyed */
    if (damageLevel < 0.25) return;

    /* Number of crack overlays: 1-4 depending on damage */
    var count = Math.floor(damageLevel * 4);
    if (count < 1) count = 1;
    if (count > 4) count = 4;

    for (var j = 0; j < count; j++) {
      var cw = 0.1 + Math.random() * 0.3;
      var ch = 0.3 + Math.random() * 0.5;
      var cGeo = new window.THREE.BoxGeometry(cw, ch, SHIELD_D * 0.5);
      var cMat = new window.THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.35 + damageLevel * 0.3,
        depthTest: false
      });
      var overlay = new window.THREE.Mesh(cGeo, cMat);
      overlay.position.set(
        (Math.random() - 0.5) * SHIELD_W * 0.7,
        (Math.random() - 0.5) * SHIELD_H * 0.7,
        SHIELD_D * 0.6
      );
      overlay.renderOrder = 1000;
      _shieldGroup.add(overlay);
      _crackOverlays.push(overlay);
    }
  }

  /* ── Spark flash on hit ──────────────────────────────────── */
  function _triggerSpark() {
    var sc = _getScene();
    var cam = _getCamera();
    if (!sc || !cam || !window.THREE) return;

    /* Remove old spark if any */
    if (_sparkLight) {
      sc.remove(_sparkLight);
      _sparkLight = null;
    }

    var light = new window.THREE.PointLight(0xFFFF00, 3, 2.5);
    /* Position at shield world position */
    var shieldWorldPos = new window.THREE.Vector3();
    if (_shieldGroup) {
      _shieldGroup.getWorldPosition(shieldWorldPos);
    } else {
      var camPos = new window.THREE.Vector3();
      cam.getWorldPosition(camPos);
      var camDir = new window.THREE.Vector3();
      cam.getWorldDirection(camDir);
      shieldWorldPos.copy(camPos).addScaledVector(camDir, 0.8);
    }
    light.position.copy(shieldWorldPos);
    sc.add(light);
    _sparkLight  = light;
    _sparkTimer  = SPARK_DURATION;
    _playImpact();
  }

  /* ── Attach / detach shield mesh to camera ───────────────── */
  function _attachShield() {
    var cam = _getCamera();
    if (!cam || !window.THREE) return;
    if (_shieldGroup) _detachShield();
    _shieldGroup = _buildShieldMesh();
    if (_shieldGroup) {
      cam.add(_shieldGroup);
      _updateCrackOverlays();
    }
  }

  function _detachShield() {
    var cam = _getCamera();
    if (_shieldGroup) {
      if (cam) cam.remove(_shieldGroup);
      /* Dispose children */
      _crackOverlays = [];
      _shieldGroup = null;
    }
  }

  /* ── Speed multiplier helpers ────────────────────────────── */
  function _applySpeedPenalty(mult) {
    if (typeof window._playerSpeedMult !== 'undefined') {
      window._playerSpeedMult = (window._playerSpeedMult || 1) * mult;
    } else {
      window._playerSpeedMult = mult;
    }
  }

  function _removeSpeedPenalty(mult) {
    if (typeof window._playerSpeedMult !== 'undefined' && mult > 0) {
      window._playerSpeedMult = window._playerSpeedMult / mult;
    }
  }

  /* ── Equip / unequip ─────────────────────────────────────── */
  function _equip() {
    if (_equipped) return;
    var type = _currentType();
    _hp    = type.hp;
    _maxHp = type.hp;
    _equipped = true;
    window._shieldEquipped = true;
    _applySpeedPenalty(type.speedMult);
    _attachShield();
    _updateHUD();
    _playEquip();
    _toast('Shield equipped: ' + type.name + ' (' + type.label + ') HP ' + _hp);
  }

  function _unequip() {
    if (!_equipped) return;
    var type = _currentType();
    _removeSpeedPenalty(type.speedMult);
    _equipped = false;
    window._shieldEquipped = false;
    _detachShield();
    _updateHUD();
    _toast('Shield unequipped');
  }

  function _cycleType() {
    var wasEquipped = _equipped;
    if (wasEquipped) _unequip();
    _typeIdx = (_typeIdx + 1) % TYPE_ORDER.length;
    var type = _currentType();
    _toast('Shield type: ' + type.name + ' (' + type.label + ')');
    if (wasEquipped) _equip();
  }

  /* ── Frontal damage interception ─────────────────────────── */
  function _interceptDamage(dmg, hitDirection) {
    if (!_equipped || _hp <= 0) return dmg;

    /* hitDirection should be a THREE.Vector3 from attacker to player.
       If not provided we assume frontal block (shield always active). */
    var frontal = true;
    if (hitDirection && window.THREE) {
      var cam = _getCamera();
      if (cam) {
        var camDir = new window.THREE.Vector3();
        cam.getWorldDirection(camDir);
        /* dot > 0 means attacker is roughly in front (hit comes from front) */
        var dot = camDir.dot(hitDirection);
        frontal = (dot > 0);
      }
    }

    if (!frontal) return dmg;

    var type = _currentType();
    var blocked = dmg * type.blockFraction;
    var passed  = dmg - blocked;

    _hp -= blocked;
    if (_hp < 0) _hp = 0;

    _triggerSpark();
    _updateCrackOverlays();
    _updateHUD();

    if (_hp <= 0) {
      _toast('Shield destroyed!');
      _unequip();
    }

    window._shieldHP = _hp;
    return passed;
  }

  /* ── Shield bash (V key tap) ─────────────────────────────── */
  function _doBash() {
    if (!_equipped || _hp <= 0) return;
    if (_bashActive || _slamActive) return;

    _bashActive = true;
    _bashTimer  = 0;
    _bashStartZ = SHIELD_OFF_Z;
    _playBash();

    /* Deal damage and knockback to nearby enemies */
    var cam = _getCamera();
    if (!cam || !window.THREE) return;

    var camPos = new window.THREE.Vector3();
    cam.getWorldPosition(camPos);
    var camDir = new window.THREE.Vector3();
    cam.getWorldDirection(camDir);
    /* Bash position: 1 unit ahead */
    var bashPos = camPos.clone().addScaledVector(camDir, 1.0);

    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      var ePos = e.position || (e.mesh && e.mesh.position) || (e.group && e.group.position);
      if (!ePos) continue;
      var dx = ePos.x - bashPos.x;
      var dz = ePos.z - bashPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 1.5) {
        /* Knockback */
        var nx = dist > 0.01 ? dx / dist : camDir.x;
        var nz = dist > 0.01 ? dz / dist : camDir.z;
        ePos.x += nx * BASH_KNOCKBACK;
        ePos.z += nz * BASH_KNOCKBACK;
        /* Apply damage */
        if (e.takeDamage) {
          e.takeDamage(BASH_DAMAGE);
        } else if (typeof e.hp !== 'undefined') {
          e.hp -= BASH_DAMAGE;
        }
      }
    }
    _toast('Shield bash!');
  }

  /* ── Shield slam (hold V) ────────────────────────────────── */
  function _startSlam() {
    if (!_equipped || _hp <= 0) return;
    if (_slamActive) return;

    var cam = _getCamera();
    if (!cam || !window.THREE) return;

    _slamActive    = true;
    _slamTimer     = 0;
    _slamTraveled  = 0;
    _slamDir       = new window.THREE.Vector3();
    cam.getWorldDirection(_slamDir);
    _slamDir.y = 0;
    _slamDir.normalize();

    _playBash();
    _toast('Shield SLAM!');
  }

  function _doSlamAoE() {
    var cam = _getCamera();
    if (!cam || !window.THREE) return;

    var camPos = new window.THREE.Vector3();
    cam.getWorldPosition(camPos);

    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      var ePos = e.position || (e.mesh && e.mesh.position) || (e.group && e.group.position);
      if (!ePos) continue;
      var dx = ePos.x - camPos.x;
      var dz = ePos.z - camPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < SLAM_RADIUS) {
        if (e.takeDamage) {
          e.takeDamage(SLAM_DAMAGE);
        } else if (typeof e.hp !== 'undefined') {
          e.hp -= SLAM_DAMAGE;
        }
      }
    }
  }

  /* ── Repair via FieldHospital / LogisticsSystem ──────────── */
  function _tryRepair() {
    if (!_equipped) return;

    var cam = _getCamera();
    if (!cam || !window.THREE) return;

    var camPos = new window.THREE.Vector3();
    cam.getWorldPosition(camPos);

    var repaired = false;

    /* Check FieldHospital proximity */
    if (window.FieldHospital && window.FieldHospital.getPosition) {
      var fhPos = window.FieldHospital.getPosition();
      if (fhPos) {
        var dxf = camPos.x - fhPos.x;
        var dzf = camPos.z - fhPos.z;
        if (Math.sqrt(dxf * dxf + dzf * dzf) < REPAIR_RANGE) {
          _hp = Math.min(_maxHp, _hp + REPAIR_AMOUNT);
          window._shieldHP = _hp;
          repaired = true;
          _toast('Shield repaired at Field Hospital (+' + REPAIR_AMOUNT + ' HP)');
        }
      }
    }

    /* Check LogisticsSystem supply truck proximity */
    if (!repaired && window.LogisticsSystem && window.LogisticsSystem.getConvoyPosition) {
      var lsPos = window.LogisticsSystem.getConvoyPosition();
      if (lsPos) {
        var dxl = camPos.x - lsPos.x;
        var dzl = camPos.z - lsPos.z;
        if (Math.sqrt(dxl * dxl + dzl * dzl) < REPAIR_RANGE) {
          _hp = Math.min(_maxHp, _hp + REPAIR_AMOUNT);
          window._shieldHP = _hp;
          repaired = true;
          _toast('Shield repaired at supply truck (+' + REPAIR_AMOUNT + ' HP)');
        }
      }
    }

    if (repaired) {
      _updateCrackOverlays();
      _updateHUD();
    }
  }

  /* ── Bobbing update ──────────────────────────────────────── */
  function _updateBob(dt) {
    if (!_equipped || !_shieldGroup) return;
    var cam = _getCamera();
    if (!cam) return;

    var camPos = new window.THREE.Vector3();
    cam.getWorldPosition(camPos);

    var moving = false;
    if (_prevCamPos) {
      var moveD = camPos.distanceTo(_prevCamPos);
      if (moveD > 0.002) { moving = true; }
    }
    _prevCamPos = camPos.clone();

    if (moving) {
      _bobTime += dt * 6.0;
    }

    var bobX = Math.sin(_bobTime) * 0.012;
    var bobY = Math.abs(Math.sin(_bobTime * 0.5)) * 0.01;

    _shieldGroup.position.set(
      SHIELD_OFF_X + bobX,
      SHIELD_OFF_Y + bobY,
      SHIELD_OFF_Z
    );
    _shieldGroup.rotation.z = Math.sin(_bobTime * 0.7) * 0.02;
  }

  /* ── Key listeners ───────────────────────────────────────── */
  function _onKeyDown(e) {
    /* Q key: equip/unequip and double-tap to cycle */
    if (e.key === 'q' || e.key === 'Q') {
      e.preventDefault();
      var now = Date.now();
      var timeSinceLast = now - _lastQTime;
      _lastQTime = now;

      if (timeSinceLast < _doubleTapMs && _equipped) {
        /* Double-tap: cycle type */
        _cycleType();
      } else {
        /* Single tap: toggle equip */
        if (_equipped) {
          _unequip();
        } else {
          _equip();
        }
      }
      return;
    }

    /* V key: bash or begin charge */
    if (e.key === 'v' || e.key === 'V') {
      if (!_vHeld) {
        _vHeld      = true;
        _chargeTimer = 0;
        /* Immediately register bash attempt */
        _doBash();
      }
    }
  }

  function _onKeyUp(e) {
    if (e.key === 'v' || e.key === 'V') {
      if (_vHeld && _chargeTimer >= SLAM_CHARGE_TIME && !_slamActive) {
        _startSlam();
      }
      _vHeld       = false;
      _chargeTimer  = 0;
    }
  }

  /* ── Public: init ────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene  || window._gameScene || null;
    _camera = camera || window._camera    || null;

    _typeIdx  = 0;
    _equipped = false;
    _hp       = 0;
    _maxHp    = 0;
    _bobTime  = 0;
    _prevCamPos = null;
    _bashActive = false;
    _slamActive = false;
    _vHeld      = false;
    _chargeTimer = 0;
    _lastQTime  = 0;
    _crackOverlays = [];

    _createHUD();

    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keyup',   _onKeyUp,   false);

    /* Hook into global damage pipeline */
    var prevDmgHook = window._playerTookDamage;
    window._playerTookDamage = function (dmg, hitDir) {
      var remaining = _interceptDamage(dmg, hitDir);
      if (prevDmgHook) return prevDmgHook(remaining, hitDir);
      return remaining;
    };

    /* Expose globals */
    window._shieldHP       = 0;
    window._shieldEquipped = false;

    /* Periodic repair check: expose hook for FieldHospital/LogisticsSystem */
    var prevRepairHook = window._onPlayerNearSupply;
    window._onPlayerNearSupply = function () {
      _tryRepair();
      if (prevRepairHook) prevRepairHook();
    };

    console.log('[ShieldSystem] initialised. Q=equip, Q+Q=cycle type, V=bash, holdV=slam.');
  }

  /* ── Public: update (call every frame, dt = seconds) ─────── */
  function update(dt) {
    if (!dt || dt <= 0) return;

    var sc  = _getScene();
    var cam = _getCamera();

    /* V hold charge timer */
    if (_vHeld && _equipped && !_bashActive && !_slamActive) {
      _chargeTimer += dt;
    }

    /* Bash lunge animation */
    if (_bashActive && _shieldGroup) {
      _bashTimer += dt;
      var progress = _bashTimer / BASH_ANIM_TIME;
      if (progress < 1) {
        /* Lunge forward then return */
        var lunge = Math.sin(progress * Math.PI) * 0.25;
        _shieldGroup.position.z = SHIELD_OFF_Z - lunge;
      } else {
        _bashActive = false;
        _bashTimer  = 0;
        if (_shieldGroup) {
          _shieldGroup.position.set(SHIELD_OFF_X, SHIELD_OFF_Y, SHIELD_OFF_Z);
        }
      }
    }

    /* Slam sprint */
    if (_slamActive && cam && window.THREE) {
      _slamTimer   += dt;
      var step      = SLAM_SPEED * dt;
      _slamTraveled += step;

      var player = window.player;
      if (player && player.position) {
        player.position.x += _slamDir.x * step;
        player.position.z += _slamDir.z * step;
      } else if (cam) {
        var camWPos = new window.THREE.Vector3();
        cam.getWorldPosition(camWPos);
        /* Move camera object if it has a parent we can shift */
        if (cam.parent && cam.parent !== sc) {
          cam.parent.position.x += _slamDir.x * step;
          cam.parent.position.z += _slamDir.z * step;
        }
      }

      if (_slamTraveled >= SLAM_DISTANCE || _slamTimer > 1.5) {
        /* Impact — deal AoE damage */
        _doSlamAoE();
        _slamActive   = false;
        _slamTimer    = 0;
        _slamTraveled = 0;
        _slamDir      = null;
        _toast('Slam impact!');
      }
    }

    /* Spark light fade */
    if (_sparkLight && sc) {
      _sparkTimer -= dt;
      if (_sparkTimer <= 0) {
        sc.remove(_sparkLight);
        _sparkLight = null;
      } else {
        _sparkLight.intensity = 3.0 * (_sparkTimer / SPARK_DURATION);
      }
    }

    /* Bobbing (only when not bashing) */
    if (_equipped && !_bashActive && _shieldGroup && window.THREE) {
      _updateBob(dt);
    }

    /* Periodic repair check */
    _tryRepair();

    /* Sync globals */
    window._shieldHP       = _hp;
    window._shieldEquipped = _equipped;

    _updateHUD();
  }

  /* ── Public: reset ───────────────────────────────────────── */
  function reset() {
    _unequip();

    _typeIdx     = 0;
    _hp          = 0;
    _maxHp       = 0;
    _bobTime     = 0;
    _prevCamPos  = null;
    _bashActive  = false;
    _bashTimer   = 0;
    _slamActive  = false;
    _slamTimer   = 0;
    _slamTraveled = 0;
    _slamDir     = null;
    _vHeld       = false;
    _chargeTimer  = 0;
    _lastQTime   = 0;

    /* Clean up spark light */
    var sc = _getScene();
    if (_sparkLight && sc) {
      sc.remove(_sparkLight);
      _sparkLight = null;
    }
    _sparkTimer = 0;

    window._shieldHP       = 0;
    window._shieldEquipped = false;

    _updateHUD();
  }

  /* ── Public API ──────────────────────────────────────────── */
  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();
