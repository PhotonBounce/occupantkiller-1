/**
 * enemy-stalker.js — Elite Stalker Enemy Module
 * A silent, semi-invisible hunter that stalks the player.
 * Spawns after wave 3. Max 1 active at a time.
 * window._stalkerActive flag tracks presence.
 */
window.EnemyStalker = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────
  var STALKER_HP           = 80;
  var STALKER_SPEED        = 3.5;    // units/s
  var STALKER_DAMAGE       = 35;     // dash attack damage
  var STALKER_SCALE        = 1.0;
  var OPACITY_HIDDEN       = 0.12;   // resting near-invisible shimmer
  var OPACITY_MOVING       = 0.22;   // briefly more visible when moving
  var OPACITY_DETECTED     = 1.0;    // fully revealed
  var MOVING_REVEAL_DUR    = 0.3;    // seconds OPACITY_MOVING persists after movement
  var DETECT_RANGE         = 5.0;    // units — gaze detection radius
  var DETECT_DOT_THRESHOLD = 0.97;   // dot > 0.97 = staring directly at stalker
  var VISIBLE_DURATION     = 2.0;    // seconds stalker stays visible after gaze detection
  var ATTACK_RANGE         = 2.0;    // units — close-range trigger
  var ATTACK_COOLDOWN      = 6.0;    // seconds between attacks
  var DASH_DURATION        = 0.3;    // seconds for dash burst
  var RETREAT_DIST         = 8.0;    // units — retreat distance after attack
  var QUESTION_RANGE       = 8.0;    // units — "?" HUD flicker threshold
  var QUESTION_INTERVAL    = 3.0;    // seconds between "?" flicker events
  var QUESTION_FLICKER_DUR = 0.25;   // seconds the "?" is visible per event
  var SPAWN_WAVE_MIN       = 4;      // spawn from wave 4 (after wave 3)
  var DETECTED_WARN_DUR    = 3.0;    // seconds the corner "STALKER DETECTED" warning shows

  // ── Module state ──────────────────────────────────────────
  var _scene         = null;
  var _camera        = null;
  var _stalker       = null;
  var _initialized   = false;
  var _currentWave   = 0;

  // Moving-opacity countdown (persists 0.3s after last movement)
  var _movingRevealT = 0;

  // "?" HUD flicker state
  var _questionEl        = null;
  var _questionVisible   = false;
  var _questionIntervalT = 0;   // countdown to next flicker event
  var _questionFlickerT  = 0;   // countdown for current flicker visibility

  // Corner "STALKER DETECTED" warning
  var _warnEl     = null;
  var _warnTimerT = 0;

  // Thermal white outline element
  var _thermalOutlineEl = null;

  // Reusable vectors (allocated on init)
  var _tmpVec3A = null;
  var _tmpVec3B = null;
  var _tmpVec3C = null;

  // ── Build BoxGeometry soldier mesh ───────────────────────
  function _buildMesh() {
    var group = new THREE.Group();
    var s = STALKER_SCALE;
    var mats = [];

    function makeMat(color, opacity) {
      var m = new THREE.MeshLambertMaterial({
        color      : color,
        transparent: true,
        opacity    : opacity,
        depthWrite : false
      });
      mats.push(m);
      return m;
    }

    function box(w, h, d, mat) {
      return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    }

    var bodyColor  = 0x1A1A2E;
    var limbColor  = 0x16213E;
    var headColor  = 0x0F3460;
    var armorColor = 0x0D0D1A;
    var eyeColor   = 0x00FFAA;

    // Torso
    var torso = box(0.52 * s, 0.70 * s, 0.26 * s, makeMat(bodyColor, OPACITY_HIDDEN));
    torso.position.set(0, 0, 0);
    group.add(torso);

    // Head
    var head = box(0.34 * s, 0.34 * s, 0.34 * s, makeMat(headColor, OPACITY_HIDDEN));
    head.position.set(0, 0.52 * s, 0);
    group.add(head);

    // Left arm
    var lArm = box(0.18 * s, 0.52 * s, 0.18 * s, makeMat(limbColor, OPACITY_HIDDEN));
    lArm.position.set(-0.35 * s, -0.09 * s, 0);
    group.add(lArm);

    // Right arm
    var rArm = box(0.18 * s, 0.52 * s, 0.18 * s, makeMat(limbColor, OPACITY_HIDDEN));
    rArm.position.set(0.35 * s, -0.09 * s, 0);
    group.add(rArm);

    // Left leg
    var lLeg = box(0.20 * s, 0.54 * s, 0.20 * s, makeMat(limbColor, OPACITY_HIDDEN));
    lLeg.position.set(-0.16 * s, -0.62 * s, 0);
    group.add(lLeg);

    // Right leg
    var rLeg = box(0.20 * s, 0.54 * s, 0.20 * s, makeMat(limbColor, OPACITY_HIDDEN));
    rLeg.position.set(0.16 * s, -0.62 * s, 0);
    group.add(rLeg);

    // Armor vest
    var vest = box(0.56 * s, 0.55 * s, 0.30 * s, makeMat(armorColor, OPACITY_HIDDEN));
    vest.position.set(0, 0.07 * s, 0);
    group.add(vest);

    // Glowing eyes (brighter than body — shared material pushed twice for index tracking)
    var eyeMat = new THREE.MeshBasicMaterial({
      color      : eyeColor,
      transparent: true,
      opacity    : OPACITY_HIDDEN * 2.5,
      depthWrite : false
    });
    mats.push(eyeMat);
    mats.push(eyeMat);

    var eyeGeo = new THREE.BoxGeometry(0.07 * s, 0.05 * s, 0.04 * s);
    var lEye = new THREE.Mesh(eyeGeo, eyeMat);
    lEye.position.set(-0.09 * s, 0.53 * s, 0.17 * s);
    group.add(lEye);

    var rEye = new THREE.Mesh(eyeGeo, eyeMat);
    rEye.position.set(0.09 * s, 0.53 * s, 0.17 * s);
    group.add(rEye);

    // Root placed so feet touch ground
    group.position.y = 0.88 * s;

    return { mesh: group, materials: mats };
  }

  // ── Opacity helper ────────────────────────────────────────
  function _setOpacity(sk, opacity) {
    var mats  = sk._materials;
    var eyeOp = Math.min(1.0, opacity * 2.5);
    var i;
    for (i = 0; i < mats.length - 2; i++) {
      mats[i].opacity = opacity;
    }
    mats[mats.length - 2].opacity = eyeOp;
    mats[mats.length - 1].opacity = eyeOp;
  }

  // ── "?" HUD element ───────────────────────────────────────
  function _buildQuestionEl() {
    if (_questionEl) return;
    _questionEl = document.createElement('div');
    _questionEl.id = 'stalker-question-hud';
    _questionEl.style.cssText = [
      'position:fixed;',
      'top:50%;left:50%;',
      'transform:translate(-50%,-160px);',
      'pointer-events:none;',
      'z-index:970;',
      'font-size:28px;',
      'font-family:monospace;',
      'color:#FFCC00;',
      'text-shadow:0 0 8px #FF9900;',
      'display:none;',
      'user-select:none;'
    ].join('');
    _questionEl.textContent = '?';
    document.body.appendChild(_questionEl);
  }

  function _showQuestionIcon(show) {
    if (!_questionEl) return;
    _questionEl.style.display = show ? 'block' : 'none';
  }

  // ── Corner "STALKER DETECTED" warning ─────────────────────
  function _buildWarnEl() {
    if (_warnEl) return;
    _warnEl = document.createElement('div');
    _warnEl.id = 'stalker-detected-warn';
    _warnEl.style.cssText = [
      'position:fixed;',
      'top:18px;right:18px;',
      'pointer-events:none;',
      'z-index:975;',
      'font-size:13px;font-weight:700;',
      'font-family:"Segoe UI",system-ui,sans-serif;',
      'color:#FF3300;',
      'text-shadow:0 0 6px #FF0000;',
      'background:rgba(0,0,0,0.55);',
      'border-left:3px solid #FF3300;',
      'padding:4px 10px;',
      'border-radius:3px;',
      'letter-spacing:1px;',
      'display:none;',
      'user-select:none;'
    ].join('');
    _warnEl.textContent = 'STALKER DETECTED';
    document.body.appendChild(_warnEl);
  }

  function _showStalkerWarn(show) {
    if (!_warnEl) return;
    _warnEl.style.display = show ? 'block' : 'none';
  }

  // ── Thermal white outline (DOM overlay) ──────────────────
  function _buildThermalOutlineEl() {
    if (_thermalOutlineEl) return;
    _thermalOutlineEl = document.createElement('div');
    _thermalOutlineEl.id = 'stalker-thermal-outline';
    _thermalOutlineEl.style.cssText = [
      'position:fixed;',
      'pointer-events:none;',
      'z-index:960;',
      'border:3px solid #FFFFFF;',
      'box-shadow:0 0 14px #FFFFFF,0 0 4px #88FFFF;',
      'border-radius:4px;',
      'display:none;'
    ].join('');
    document.body.appendChild(_thermalOutlineEl);
  }

  // ── Laser-sight red PointLight ────────────────────────────
  function _ensureLaserLight(sk) {
    if (sk._laserLight) return;
    sk._laserLight = new THREE.PointLight(0xFF2200, 4.0, 6);
    sk._laserLight.position.set(0, 0.5, 0);
    sk.mesh.add(sk._laserLight);
  }

  function _removeLaserLight(sk) {
    if (!sk || !sk._laserLight) return;
    sk.mesh.remove(sk._laserLight);
    if (sk._laserLight.dispose) sk._laserLight.dispose();
    sk._laserLight = null;
  }

  // ── Project world position to screen coords ───────────────
  function _projectToScreen(worldPos) {
    if (!_camera) return null;
    var vec = worldPos.clone();
    vec.project(_camera);
    if (vec.z > 1.0) return null;
    return {
      x:  vec.x *  (window.innerWidth  / 2) + (window.innerWidth  / 2),
      y: -vec.y *  (window.innerHeight / 2) + (window.innerHeight / 2)
    };
  }

  // ── Update thermal/laser visuals each frame ───────────────
  function _updateSpecialVisuals() {
    var thermalOn = !!window._thermalVisionActive || !!window._thermalActive;
    var laserOn   = !!window._laserSightActive    || !!window._laserEnabled;

    // Thermal: bright white outline overlay
    if (thermalOn && _stalker && _stalker.alive && _thermalOutlineEl) {
      var worldPos = new THREE.Vector3();
      _stalker.mesh.getWorldPosition(worldPos);
      var sc = _projectToScreen(worldPos);
      if (sc) {
        var size = 50;
        _thermalOutlineEl.style.display = 'block';
        _thermalOutlineEl.style.left    = (sc.x - size / 2) + 'px';
        _thermalOutlineEl.style.top     = (sc.y - size)     + 'px';
        _thermalOutlineEl.style.width   = size + 'px';
        _thermalOutlineEl.style.height  = (size * 2) + 'px';
      } else {
        _thermalOutlineEl.style.display = 'none';
      }
    } else if (_thermalOutlineEl) {
      _thermalOutlineEl.style.display = 'none';
    }

    // Laser sight: red PointLight on stalker mesh
    if (_stalker && _stalker.alive) {
      if (laserOn) {
        _ensureLaserLight(_stalker);
      } else {
        _removeLaserLight(_stalker);
      }
    }
  }

  // ── Spawn the stalker ──────────────────────────────────────
  function spawn(playerPos) {
    if (_stalker && _stalker.alive) return;
    if (!_scene) return;

    var meshData = _buildMesh();
    var group    = meshData.mesh;

    var angle = Math.random() * Math.PI * 2;
    var dist  = 18 + Math.random() * 7;
    group.position.set(
      (playerPos ? playerPos.x : 0) + Math.cos(angle) * dist,
      0,
      (playerPos ? playerPos.z : 0) + Math.sin(angle) * dist
    );

    _scene.add(group);

    _stalker = {
      mesh         : group,
      _materials   : meshData.materials,
      _laserLight  : null,
      hp           : STALKER_HP,
      alive        : true,
      state        : 'stalk',
      detectedTimer: 0,
      dashTimer    : 0,
      dashTarget   : new THREE.Vector3(),
      dashOrigin   : new THREE.Vector3(),
      retreatTarget: new THREE.Vector3(),
      moving       : false,
      lastAttackT  : 0
    };

    window._stalkerActive = true;

    _buildQuestionEl();
    _buildWarnEl();
    _buildThermalOutlineEl();

    return _stalker;
  }

  // ── Remove and dispose stalker ────────────────────────────
  function _removeStalker() {
    if (!_stalker) return;
    _removeLaserLight(_stalker);
    if (_stalker.mesh && _scene) {
      _scene.remove(_stalker.mesh);
    }
    _stalker.mesh.traverse(function (obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function (m) { m.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
    });
    _stalker = null;
    window._stalkerActive = false;
    _showQuestionIcon(false);
    _showStalkerWarn(false);
    if (_thermalOutlineEl) _thermalOutlineEl.style.display = 'none';
  }

  // ── Player gaze check ─────────────────────────────────────
  function _playerGazingAt(playerPos, stalkerPos) {
    if (!_camera) return false;
    _tmpVec3A.copy(stalkerPos).sub(playerPos).normalize();
    _tmpVec3B.set(0, 0, -1).applyQuaternion(_camera.quaternion);
    if (_tmpVec3A.dot(_tmpVec3B) < DETECT_DOT_THRESHOLD) return false;
    return playerPos.distanceTo(stalkerPos) <= DETECT_RANGE;
  }

  // ── Show detected UI (toast + corner warning) ─────────────
  function _triggerDetectedUI() {
    _warnTimerT = DETECTED_WARN_DUR;
    _showStalkerWarn(true);
    if (typeof HUD !== 'undefined' && HUD.showToast) {
      HUD.showToast('STALKER DETECTED', 2000, '#FF3300');
    }
  }

  // ── Main update tick ──────────────────────────────────────
  function update(dt, playerPos) {
    // Tick corner warning timer
    if (_warnTimerT > 0) {
      _warnTimerT -= dt;
      if (_warnTimerT <= 0) {
        _showStalkerWarn(false);
        _warnTimerT = 0;
      }
    }

    if (!_stalker || !_stalker.alive) {
      _showQuestionIcon(false);
      if (_thermalOutlineEl) _thermalOutlineEl.style.display = 'none';
      return;
    }

    var sk      = _stalker;
    var skPos   = sk.mesh.position;
    var distToP = skPos.distanceTo(playerPos);

    // Death: fully reveal, then remove
    if (sk.hp <= 0) {
      _setOpacity(sk, OPACITY_DETECTED);
      _removeStalker();
      return;
    }

    var thermalOn    = !!window._thermalVisionActive || !!window._thermalActive;
    var laserOn      = !!window._laserSightActive    || !!window._laserEnabled;
    var alwaysReveal = thermalOn || laserOn;

    // ── Gaze detection (only while stalking) ─────────────
    if (sk.state === 'stalk' && !alwaysReveal) {
      if (_playerGazingAt(playerPos, skPos)) {
        sk.state         = 'detected';
        sk.detectedTimer = VISIBLE_DURATION;
        _setOpacity(sk, OPACITY_DETECTED);
        _triggerDetectedUI();
      }
    }

    // ── State machine ─────────────────────────────────────
    if (sk.state === 'detected') {
      sk.detectedTimer -= dt;

      if (distToP > ATTACK_RANGE + 0.2) {
        _tmpVec3C.copy(playerPos).sub(skPos).normalize();
        skPos.addScaledVector(_tmpVec3C, STALKER_SPEED * dt);
        skPos.y   = 0;
        sk.moving = true;
        sk.mesh.lookAt(playerPos.x, skPos.y, playerPos.z);
      } else {
        sk.moving = false;
      }

      if (distToP <= ATTACK_RANGE) {
        _doAttack(sk, playerPos);
      }

      if (sk.detectedTimer <= 0 && sk.state === 'detected') {
        sk.state  = 'stalk';
        sk.moving = false;
      }

    } else if (sk.state === 'dash') {
      sk.dashTimer += dt;
      var t = Math.min(sk.dashTimer / DASH_DURATION, 1.0);
      sk.mesh.position.lerpVectors(sk.dashOrigin, sk.dashTarget, t);
      sk.mesh.position.y = 0;
      sk.moving = true;

      if (t >= 1.0) {
        _dealDamage(sk);
        sk.state = 'retreat';
        _tmpVec3C.copy(skPos).sub(playerPos).normalize();
        sk.retreatTarget.copy(skPos).addScaledVector(_tmpVec3C, RETREAT_DIST);
        sk.retreatTarget.y = 0;
      }

    } else if (sk.state === 'retreat') {
      var retreatDist = skPos.distanceTo(sk.retreatTarget);
      if (retreatDist > 0.5) {
        _tmpVec3C.copy(sk.retreatTarget).sub(skPos).normalize();
        skPos.addScaledVector(_tmpVec3C, STALKER_SPEED * 1.8 * dt);
        skPos.y   = 0;
        sk.moving = true;
      } else {
        sk.state  = 'stalk';
        sk.moving = false;
      }

    } else {
      // stalk — silent approach
      if (distToP > ATTACK_RANGE + 0.2) {
        _tmpVec3C.copy(playerPos).sub(skPos).normalize();
        skPos.addScaledVector(_tmpVec3C, STALKER_SPEED * dt);
        skPos.y   = 0;
        sk.moving = true;
        sk.mesh.lookAt(playerPos.x, skPos.y, playerPos.z);
      } else {
        sk.moving = false;
      }

      if (distToP <= ATTACK_RANGE + 0.5) {
        var now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
        if (now - sk.lastAttackT > ATTACK_COOLDOWN) {
          sk.state     = 'dash';
          sk.dashTimer = 0;
          sk.dashOrigin.copy(skPos);
          sk.dashTarget.copy(playerPos);
          sk.dashTarget.y = 0;
          _setOpacity(sk, OPACITY_DETECTED);
        }
      }
    }

    // ── Opacity management ────────────────────────────────
    if (alwaysReveal) {
      _setOpacity(sk, OPACITY_DETECTED);
    } else if (sk.state === 'detected' || sk.state === 'dash') {
      _setOpacity(sk, OPACITY_DETECTED);
    } else {
      // Stalking / retreating: 0.22 for 0.3s when moving, else 0.12
      if (sk.moving) {
        _movingRevealT = MOVING_REVEAL_DUR;
      }
      if (_movingRevealT > 0) {
        _movingRevealT -= dt;
        _setOpacity(sk, _movingRevealT > 0 ? OPACITY_MOVING : OPACITY_HIDDEN);
      } else {
        _setOpacity(sk, OPACITY_HIDDEN);
      }
    }

    // ── "?" HUD flicker every 3s when nearby and unseen ─
    if (distToP < QUESTION_RANGE && sk.state === 'stalk' && !alwaysReveal) {
      _questionIntervalT -= dt;
      if (_questionIntervalT <= 0) {
        _questionIntervalT = QUESTION_INTERVAL;
        _questionFlickerT  = QUESTION_FLICKER_DUR;
        _showQuestionIcon(true);
        _questionVisible = true;
      }
      if (_questionVisible && _questionFlickerT > 0) {
        _questionFlickerT -= dt;
        if (_questionFlickerT <= 0) {
          _showQuestionIcon(false);
          _questionVisible = false;
        }
      }
    } else {
      _showQuestionIcon(false);
      _questionVisible   = false;
      _questionIntervalT = 0;
    }

    // ── Thermal/laser visuals ─────────────────────────────
    _updateSpecialVisuals();
  }

  // ── Begin dash attack ─────────────────────────────────────
  function _doAttack(sk, playerPos) {
    var now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    if (now - sk.lastAttackT < ATTACK_COOLDOWN) return;
    sk.lastAttackT  = now;
    sk.state        = 'dash';
    sk.dashTimer    = 0;
    sk.dashOrigin.copy(sk.mesh.position);
    sk.dashTarget.copy(playerPos);
    sk.dashTarget.y = 0;
    _setOpacity(sk, OPACITY_DETECTED);
  }

  // ── Deal 35 damage to player ──────────────────────────────
  function _dealDamage(sk) {
    sk.lastAttackT = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    if (typeof GameManager !== 'undefined' && GameManager.takeDamage) {
      GameManager.takeDamage(STALKER_DAMAGE, 'stalker');
    } else if (typeof window.GameManager !== 'undefined' && window.GameManager.takeDamage) {
      window.GameManager.takeDamage(STALKER_DAMAGE, 'stalker');
    } else if (typeof window._playerHp !== 'undefined') {
      window._playerHp = Math.max(0, (window._playerHp || 100) - STALKER_DAMAGE);
    }
  }

  // ── External: receive bullet damage ───────────────────────
  function takeDamage(amount) {
    if (!_stalker || !_stalker.alive) return false;
    _stalker.hp -= amount;
    _setOpacity(_stalker, OPACITY_DETECTED);
    _stalker.state         = 'detected';
    _stalker.detectedTimer = 1.0;
    if (_stalker.hp <= 0) {
      _stalker.alive = false;
      _setOpacity(_stalker, OPACITY_DETECTED);
      _removeStalker();
      return true;
    }
    return false;
  }

  // ── Init ──────────────────────────────────────────────────
  function init(scene, camera) {
    if (_initialized) return;
    _scene  = scene;
    _camera = camera;

    _tmpVec3A = new THREE.Vector3();
    _tmpVec3B = new THREE.Vector3();
    _tmpVec3C = new THREE.Vector3();

    window._stalkerActive = false;
    _currentWave          = 0;
    _movingRevealT        = 0;

    _buildQuestionEl();
    _buildWarnEl();
    _buildThermalOutlineEl();

    _initialized = true;
  }

  // ── Reset between waves / stages ─────────────────────────
  function reset() {
    _removeStalker();
    _currentWave       = 0;
    _movingRevealT     = 0;
    _questionFlickerT  = 0;
    _questionIntervalT = 0;
    _questionVisible   = false;
    _warnTimerT        = 0;
    _showQuestionIcon(false);
    _showStalkerWarn(false);
    if (_thermalOutlineEl) _thermalOutlineEl.style.display = 'none';
  }

  // ── Wave hook — call from game code after each wave ───────
  function onWaveStart(waveNum, playerPos) {
    _currentWave = waveNum || 0;
    if (_stalker && _stalker.alive) _removeStalker();
    if (_currentWave >= SPAWN_WAVE_MIN) spawn(playerPos);
  }

  // ── Public API ────────────────────────────────────────────
  return {
    init        : init,
    update      : update,
    spawn       : spawn,
    reset       : reset,
    takeDamage  : takeDamage,
    onWaveStart : onWaveStart,
    getStalker  : function () { return _stalker; }
  };

})();
