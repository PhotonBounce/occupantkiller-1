/**
 * enemy-stalker.js — Elite Stalker Enemy Module
 * A silent, semi-invisible hunter that stalks the player.
 * Spawns after wave 3. Max 1 active at a time.
 * window._stalkerActive flag tracks presence.
 */
window.EnemyStalker = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────
  var STALKER_HP            = 80;
  var STALKER_SPEED         = 3.5;          // units/s
  var STALKER_DAMAGE        = 35;           // slash damage
  var STALKER_SCALE         = 1.0;
  var OPACITY_HIDDEN        = 0.12;         // resting invisible shimmer
  var OPACITY_MOVING        = 0.22;         // slightly visible when moving
  var OPACITY_DETECTED      = 1.0;          // fully visible when spotted
  var DETECT_RANGE          = 5.0;          // units — gaze detection radius
  var DETECT_DOT_THRESHOLD  = 0.97;         // very narrow cone — looking directly at stalker
  var VISIBLE_DURATION      = 2.0;          // seconds stalker stays visible after detection
  var ATTACK_RANGE          = 2.0;          // units — close range dash trigger
  var ATTACK_COOLDOWN       = 6.0;          // seconds between attacks
  var DASH_DURATION         = 0.3;          // seconds for dash attack
  var RETREAT_DIST          = 8.0;          // units — retreat distance after attack
  var QUESTION_RANGE        = 8.0;          // units — show "?" HUD icon
  var QUESTION_INTERVAL     = 3.0;          // seconds between "?" flicker appearances
  var QUESTION_FLICKER_INT  = 0.25;         // seconds between flicker toggles (visual blink)
  var SPAWN_WAVE_MIN        = 4;            // spawns from wave 4 (after wave 3)
  var THERMAL_OUTLINE_COLOR = '#FF2200';    // bright red outline for thermal vision

  // ── State ──────────────────────────────────────────────────
  var _scene              = null;
  var _camera             = null;
  var _stalker            = null;   // the active stalker object or null
  var _initialized        = false;
  var _currentWave        = 0;

  // HUD elements
  var _questionEl         = null;   // "?" flickering HUD icon
  var _questionVisible    = false;
  var _questionIntervalT  = 0;      // countdown to next "?" flicker event (3s cycle)
  var _questionFlickerT   = 0;      // countdown for the brief visual blink
  var _thermalOutlineEl   = null;   // red outline DOM element for thermal mode

  // Temp reusable THREE vectors (allocated once)
  var _tmpVec3A           = null;
  var _tmpVec3B           = null;
  var _tmpVec3C           = null;

  // ── Stalker object structure ───────────────────────────────
  // _stalker = {
  //   mesh         : THREE.Group
  //   hp           : Number
  //   alive        : Boolean
  //   state        : 'stalk' | 'detected' | 'dash' | 'retreat' | 'invisible'
  //   detectedTimer: Number   seconds remaining visible after detection
  //   dashTimer    : Number   seconds into dash
  //   dashTarget   : THREE.Vector3
  //   dashOrigin   : THREE.Vector3
  //   retreatTarget: THREE.Vector3
  //   moving       : Boolean
  //   _materials   : Array of THREE.MeshLambertMaterial  (for opacity control)
  //   _thermalMat  : THREE.MeshBasicMaterial | null
  //   lastAttackT  : Number  timestamp to prevent rapid re-attack
  // }

  // ── Build mesh ────────────────────────────────────────────
  function _buildMesh() {
    var group = new THREE.Group();
    var s = STALKER_SCALE;
    var mats = [];

    function makeMat(color, opacity) {
      var m = new THREE.MeshLambertMaterial({
        color       : color,
        transparent : true,
        opacity     : opacity,
        depthWrite  : false
      });
      mats.push(m);
      return m;
    }

    function box(w, h, d, mat) {
      return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    }

    // Body color — dark charcoal / stealth suit
    var bodyColor   = 0x1A1A2E;
    var limbColor   = 0x16213E;
    var headColor   = 0x0F3460;
    var armorColor  = 0x0D0D1A;
    var eyeColor    = 0x00FFAA;

    // Torso
    var torsoMesh = box(0.52 * s, 0.70 * s, 0.26 * s, makeMat(bodyColor, OPACITY_HIDDEN));
    torsoMesh.position.set(0, 0, 0);
    group.add(torsoMesh);

    // Head
    var headMesh = box(0.34 * s, 0.34 * s, 0.34 * s, makeMat(headColor, OPACITY_HIDDEN));
    headMesh.position.set(0, 0.52 * s, 0);
    group.add(headMesh);

    // Left arm
    var lArmMesh = box(0.18 * s, 0.52 * s, 0.18 * s, makeMat(limbColor, OPACITY_HIDDEN));
    lArmMesh.position.set(-0.35 * s, -0.09 * s, 0);
    group.add(lArmMesh);

    // Right arm
    var rArmMesh = box(0.18 * s, 0.52 * s, 0.18 * s, makeMat(limbColor, OPACITY_HIDDEN));
    rArmMesh.position.set(0.35 * s, -0.09 * s, 0);
    group.add(rArmMesh);

    // Left leg
    var lLegMesh = box(0.20 * s, 0.54 * s, 0.20 * s, makeMat(limbColor, OPACITY_HIDDEN));
    lLegMesh.position.set(-0.16 * s, -0.62 * s, 0);
    group.add(lLegMesh);

    // Right leg
    var rLegMesh = box(0.20 * s, 0.54 * s, 0.20 * s, makeMat(limbColor, OPACITY_HIDDEN));
    rLegMesh.position.set(0.16 * s, -0.62 * s, 0);
    group.add(rLegMesh);

    // Body armor vest
    var vestMesh = box(0.56 * s, 0.55 * s, 0.30 * s, makeMat(armorColor, OPACITY_HIDDEN));
    vestMesh.position.set(0, 0.07 * s, 0);
    group.add(vestMesh);

    // Glowing eyes (slightly brighter so barely noticeable through shimmer)
    var eyeMat = new THREE.MeshBasicMaterial({
      color      : eyeColor,
      transparent: true,
      opacity    : OPACITY_HIDDEN * 2.5,
      depthWrite : false
    });
    mats.push(eyeMat);
    var eyeGeo = new THREE.BoxGeometry(0.07 * s, 0.05 * s, 0.04 * s);
    var lEye = new THREE.Mesh(eyeGeo, eyeMat);
    lEye.position.set(-0.09 * s, 0.53 * s, 0.17 * s);
    group.add(lEye);
    var rEye = new THREE.Mesh(eyeGeo, eyeMat);
    rEye.position.set(0.09 * s, 0.53 * s, 0.17 * s);
    group.add(rEye);

    // Position root at waist level so feet are near ground
    group.position.y = 0.88 * s;

    return { mesh: group, materials: mats };
  }

  // ── Opacity helper ────────────────────────────────────────
  function _setOpacity(stalker, opacity) {
    var mats = stalker._materials;
    for (var i = 0; i < mats.length; i++) {
      mats[i].opacity = opacity;
    }
    // Eyes get a slight boost
    // (last 2 entries in _materials are the eye BasicMaterials)
    var eyeOpacity = Math.min(1.0, opacity * 2.5);
    mats[mats.length - 1].opacity = eyeOpacity;
    mats[mats.length - 2].opacity = eyeOpacity;
  }

  // ── "?" HUD icon ──────────────────────────────────────────
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
      'user-select:none;',
    ].join('');
    _questionEl.textContent = '?';
    document.body.appendChild(_questionEl);
  }

  function _showQuestionIcon(show) {
    if (!_questionEl) return;
    _questionEl.style.display = show ? 'block' : 'none';
  }

  // ── Thermal outline DOM element ───────────────────────────
  function _buildThermalOutlineEl() {
    if (_thermalOutlineEl) return;
    _thermalOutlineEl = document.createElement('div');
    _thermalOutlineEl.id = 'stalker-thermal-outline';
    _thermalOutlineEl.style.cssText = [
      'position:fixed;',
      'pointer-events:none;',
      'z-index:960;',
      'border:3px solid ' + THERMAL_OUTLINE_COLOR + ';',
      'box-shadow:0 0 12px ' + THERMAL_OUTLINE_COLOR + ';',
      'border-radius:4px;',
      'display:none;',
    ].join('');
    document.body.appendChild(_thermalOutlineEl);
  }

  // ── Project stalker onto screen ───────────────────────────
  function _projectToScreen(worldPos) {
    if (!_camera) return null;
    var vec = worldPos.clone();
    vec.project(_camera);
    if (vec.z > 1.0) return null; // behind camera
    var hw = window.innerWidth  / 2;
    var hh = window.innerHeight / 2;
    return {
      x: vec.x  *  hw + hw,
      y: -vec.y * hh + hh
    };
  }

  // ── Update thermal outline ────────────────────────────────
  function _updateThermalOutline() {
    if (!_thermalOutlineEl || !_stalker || !_stalker.alive) {
      if (_thermalOutlineEl) _thermalOutlineEl.style.display = 'none';
      return;
    }
    var thermalOn = !!window._thermalVisionActive || !!window._thermalActive;
    var laserOn   = !!window._laserSightActive || !!window._laserEnabled;
    if (!thermalOn && !laserOn) {
      _thermalOutlineEl.style.display = 'none';
      return;
    }
    // Project mesh position
    var worldPos = new THREE.Vector3();
    _stalker.mesh.getWorldPosition(worldPos);
    var sc = _projectToScreen(worldPos);
    if (!sc) {
      _thermalOutlineEl.style.display = 'none';
      return;
    }
    var size = 48;
    _thermalOutlineEl.style.display = 'block';
    _thermalOutlineEl.style.left   = (sc.x - size / 2) + 'px';
    _thermalOutlineEl.style.top    = (sc.y - size)     + 'px';
    _thermalOutlineEl.style.width  = size + 'px';
    _thermalOutlineEl.style.height = (size * 2) + 'px';
  }

  // ── Spawn a stalker ───────────────────────────────────────
  function spawn(playerPos) {
    if (_stalker && _stalker.alive) return;    // already one active
    if (!_scene) return;

    var meshData = _buildMesh();
    var group    = meshData.mesh;

    // Place stalker at random angle, 18-25 units from player
    var angle = Math.random() * Math.PI * 2;
    var dist  = 18 + Math.random() * 7;
    var spawnX = (playerPos ? playerPos.x : 0) + Math.cos(angle) * dist;
    var spawnZ = (playerPos ? playerPos.z : 0) + Math.sin(angle) * dist;
    group.position.set(spawnX, 0, spawnZ);

    _scene.add(group);

    _stalker = {
      mesh         : group,
      _materials   : meshData.materials,
      hp           : STALKER_HP,
      alive        : true,
      state        : 'stalk',          // stalk | detected | dash | retreat | dead
      detectedTimer: 0,
      dashTimer    : 0,
      dashTarget   : new THREE.Vector3(),
      dashOrigin   : new THREE.Vector3(),
      retreatTarget: new THREE.Vector3(),
      moving       : false,
      lastAttackT  : 0,
    };

    window._stalkerActive = true;

    // Make sure question element exists
    _buildQuestionEl();
    _buildThermalOutlineEl();

    return _stalker;
  }

  // ── Remove / cleanup stalker ──────────────────────────────
  function _removeStalker() {
    if (!_stalker) return;
    if (_stalker.mesh && _scene) {
      _scene.remove(_stalker.mesh);
    }
    // Dispose geometries and materials
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
    if (_thermalOutlineEl) _thermalOutlineEl.style.display = 'none';
  }

  // ── Check if player is gazing at stalker ─────────────────
  function _playerGazingAt(playerPos, stalkerPos) {
    if (!_camera) return false;
    // Vector from player to stalker
    _tmpVec3A.copy(stalkerPos).sub(playerPos).normalize();
    // Camera forward direction
    _tmpVec3B.set(0, 0, -1).applyQuaternion(_camera.quaternion);
    var dot = _tmpVec3A.dot(_tmpVec3B);
    if (dot < DETECT_DOT_THRESHOLD) return false;
    // Distance check
    var dist = playerPos.distanceTo(stalkerPos);
    return dist <= DETECT_RANGE;
  }

  // ── Main update tick ──────────────────────────────────────
  function update(dt, playerPos) {
    if (!_stalker || !_stalker.alive) {
      _showQuestionIcon(false);
      _updateThermalOutline();
      return;
    }

    var sk       = _stalker;
    var skPos    = sk.mesh.position;
    var distToP  = skPos.distanceTo(playerPos);

    // ── Death check ──────────────────────────────────────
    if (sk.hp <= 0) {
      _removeStalker();
      return;
    }

    // ── Thermal / laser always reveals (opacity) ──────────
    var alwaysReveal = (!!window._thermalVisionActive || !!window._thermalActive ||
                        !!window._laserSightActive    || !!window._laserEnabled);

    // ── Gaze detection ────────────────────────────────────
    if (sk.state === 'stalk' || sk.state === 'invisible') {
      var gazeDetected = _playerGazingAt(playerPos, skPos);
      if (gazeDetected && !alwaysReveal) {
        sk.state = 'detected';
        sk.detectedTimer = VISIBLE_DURATION;
        _setOpacity(sk, OPACITY_DETECTED);
        // Show toast
        if (typeof HUD !== 'undefined' && HUD.showToast) {
          HUD.showToast('STALKER DETECTED', 2000, '#FF4400');
        }
      }
    }

    // ── State machine ─────────────────────────────────────
    if (sk.state === 'detected') {
      sk.detectedTimer -= dt;
      _setOpacity(sk, alwaysReveal ? OPACITY_DETECTED : OPACITY_DETECTED);

      // Move towards player while detected
      if (distToP > ATTACK_RANGE + 0.2) {
        _tmpVec3C.copy(playerPos).sub(skPos).normalize();
        skPos.addScaledVector(_tmpVec3C, STALKER_SPEED * dt);
        sk.moving = true;
        // Face player
        sk.mesh.lookAt(playerPos.x, skPos.y, playerPos.z);
      }

      // Attack if in range
      if (distToP <= ATTACK_RANGE) {
        _doAttack(sk, playerPos);
      }

      // Detection window expired — go back to invisible mode
      if (sk.detectedTimer <= 0 && sk.state === 'detected') {
        sk.state = 'stalk';
        sk.moving = false;
      }

    } else if (sk.state === 'dash') {
      sk.dashTimer += dt;
      var t = Math.min(sk.dashTimer / DASH_DURATION, 1.0);
      // Lerp from origin to target
      sk.mesh.position.lerpVectors(sk.dashOrigin, sk.dashTarget, t);
      sk.moving = true;

      if (t >= 1.0) {
        // Attack landed, deal damage
        _dealDamage(sk);
        // Transition to retreat
        sk.state = 'retreat';
        // Pick a retreat position opposite to player
        _tmpVec3C.copy(skPos).sub(playerPos).normalize();
        sk.retreatTarget.copy(skPos).addScaledVector(_tmpVec3C, RETREAT_DIST);
        sk.retreatTarget.y = 0;
      }

    } else if (sk.state === 'retreat') {
      var retreatDist = skPos.distanceTo(sk.retreatTarget);
      if (retreatDist > 0.5) {
        _tmpVec3C.copy(sk.retreatTarget).sub(skPos).normalize();
        skPos.addScaledVector(_tmpVec3C, STALKER_SPEED * 1.8 * dt);
        sk.mesh.position.y = 0;
        sk.moving = true;
      } else {
        // Reached retreat spot — go invisible again
        sk.state = 'stalk';
        sk.moving = false;
        _setOpacity(sk, alwaysReveal ? OPACITY_DETECTED : OPACITY_HIDDEN);
      }

    } else {
      // ── state === 'stalk' (default stalking) ──────────
      // Silently approach player
      if (distToP > ATTACK_RANGE + 0.2) {
        _tmpVec3C.copy(playerPos).sub(skPos).normalize();
        skPos.addScaledVector(_tmpVec3C, STALKER_SPEED * dt);
        sk.mesh.position.y = 0;
        sk.moving = true;
        sk.mesh.lookAt(playerPos.x, skPos.y, playerPos.z);
      } else {
        sk.moving = false;
      }

      // If close enough, initiate dash attack
      if (distToP <= ATTACK_RANGE + 0.5 && sk.state === 'stalk') {
        var now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
        if (now - sk.lastAttackT > ATTACK_COOLDOWN) {
          // Begin dash
          sk.state = 'dash';
          sk.dashTimer = 0;
          sk.dashOrigin.copy(skPos);
          sk.dashTarget.copy(playerPos);
          sk.dashTarget.y = 0;
          _setOpacity(sk, OPACITY_DETECTED); // briefly visible during dash
        }
      }
    }

    // ── Opacity by state and movement ─────────────────────
    if (!alwaysReveal) {
      if (sk.state === 'stalk') {
        _setOpacity(sk, sk.moving ? OPACITY_MOVING : OPACITY_HIDDEN);
      } else if (sk.state === 'retreat') {
        _setOpacity(sk, sk.moving ? OPACITY_MOVING : OPACITY_HIDDEN);
      }
      // 'detected' and 'dash' stay at OPACITY_DETECTED (set above)
    } else {
      // Thermal/laser: always fully visible
      _setOpacity(sk, OPACITY_DETECTED);
    }

    // ── "?" HUD flicker when stalker is nearby but unseen (every 3s) ─
    if (distToP < QUESTION_RANGE && sk.state === 'stalk' && !alwaysReveal) {
      _questionIntervalT -= dt;
      if (_questionIntervalT <= 0) {
        // Trigger a brief flicker: show "?" for a moment then hide
        _questionIntervalT = QUESTION_INTERVAL;
        _questionFlickerT  = QUESTION_FLICKER_INT;
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

    // ── Update thermal/laser outline ──────────────────────
    _updateThermalOutline();
  }

  // ── Attack helpers ────────────────────────────────────────
  function _doAttack(sk, playerPos) {
    var now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    if (now - sk.lastAttackT < ATTACK_COOLDOWN) return;
    sk.lastAttackT = now;

    // Begin dash
    sk.state = 'dash';
    sk.dashTimer = 0;
    sk.dashOrigin.copy(sk.mesh.position);
    sk.dashTarget.copy(playerPos);
    sk.dashTarget.y = 0;
    _setOpacity(sk, OPACITY_DETECTED);
  }

  function _dealDamage(sk) {
    sk.lastAttackT = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    // Apply damage to player via GameManager if available
    if (typeof GameManager !== 'undefined' && GameManager.takeDamage) {
      GameManager.takeDamage(STALKER_DAMAGE, 'stalker');
    } else if (typeof window.GameManager !== 'undefined' && window.GameManager.takeDamage) {
      window.GameManager.takeDamage(STALKER_DAMAGE, 'stalker');
    } else if (typeof window._playerHp !== 'undefined') {
      window._playerHp = Math.max(0, (window._playerHp || 100) - STALKER_DAMAGE);
    }
  }

  // ── Take damage (called from enemies.js bullet hits if needed) ──
  function takeDamage(amount) {
    if (!_stalker || !_stalker.alive) return false;
    _stalker.hp -= amount;
    // Briefly reveal on hit
    _setOpacity(_stalker, OPACITY_DETECTED);
    _stalker.state = 'detected';
    _stalker.detectedTimer = 1.0;
    if (_stalker.hp <= 0) {
      _stalker.alive = false;
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

    // Allocate reusable vectors after THREE is confirmed present
    _tmpVec3A = new THREE.Vector3();
    _tmpVec3B = new THREE.Vector3();
    _tmpVec3C = new THREE.Vector3();

    window._stalkerActive = false;
    _currentWave = 0;

    _buildQuestionEl();
    _buildThermalOutlineEl();

    _initialized = true;
  }

  // ── Reset (called between waves / stages) ─────────────────
  function reset() {
    _removeStalker();
    _currentWave      = 0;
    _questionFlickerT  = 0;
    _questionIntervalT = 0;
    _questionVisible   = false;
    _showQuestionIcon(false);
    if (_thermalOutlineEl) _thermalOutlineEl.style.display = 'none';
  }

  // ── Wave notification ─────────────────────────────────────
  // Game code should call EnemyStalker.onWaveStart(waveNumber, playerPos)
  function onWaveStart(waveNum, playerPos) {
    _currentWave = waveNum || 0;
    // Reset existing stalker between waves
    if (_stalker && _stalker.alive) {
      _removeStalker();
    }
    // Only spawn from wave 4 onwards
    if (_currentWave >= SPAWN_WAVE_MIN) {
      spawn(playerPos);
    }
  }

  // ── Public API ────────────────────────────────────────────
  return {
    init       : init,
    update     : update,
    spawn      : spawn,
    reset      : reset,
    takeDamage : takeDamage,
    onWaveStart: onWaveStart,
    getStalker : function () { return _stalker; }
  };

})();
