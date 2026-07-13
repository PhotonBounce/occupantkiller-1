/* ════════════════════════════════════════════════════════════════════════════
 *  enemy-medic-npc.js  — Enemy Field Medic NPC
 *  ───────────────────────────────────────────────────────────────────────────
 *  A field medic enemy that heals wounded allies, revives dead enemies,
 *  evades player targeting, and throws med-kit supply boxes.
 *
 *  AI States:  SEARCH → HEAL → EVADE → REVIVE
 *
 *  Public API  (window.EnemyMedicNPC):
 *    init()                  — call once at game start
 *    update(dt)              — per-frame update (dt in seconds)
 *    spawn(scene, x, y, z)  — spawn one medic at position
 *    getAll()                — returns internal _medics array
 *    reset()                 — remove all medics & cleanup
 *
 *  Globals read:
 *    window.THREE, window._gameScene, window._camera, window._playerPosition,
 *    window.Enemies (getAll), window._audioCtx, window.HUD, window.player,
 *    window._gameScore, window._coverObjects[]
 *
 *  All var, IIFE, no import/export, no let/const.
 * ════════════════════════════════════════════════════════════════════════════ */

window.EnemyMedicNPC = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────

  var MEDIC_HP           = 80;     // light armour
  var MEDIC_SPEED        = 2.2;    // normal walk speed (m/s)
  var MEDIC_RUN_SPEED    = 4.0;    // running to heal / evade
  var MAX_MEDICS         = 2;      // hard cap on concurrent medics
  var MEDIC_SCORE        = 250;    // score awarded on kill

  // SEARCH behaviour
  var STAY_BEHIND_MIN    = 8;      // min distance from player (m)
  var STAY_BEHIND_MAX    = 15;     // max distance from player (m)
  var SCAN_INTERVAL      = 0.5;    // seconds between ally scans
  var WOUNDED_THRESHOLD  = 0.5;    // heal allies below 50% max HP

  // HEAL behaviour
  var HEAL_RATE          = 5;      // HP/s restored while healing
  var HEAL_DURATION      = 3.0;    // seconds of healing per session
  var HEAL_RANGE_ARRIVE  = 1.5;    // metres to start healing

  // EVADE behaviour
  var PLAYER_LOOK_ANGLE  = 5;      // ±5° cone to detect player targeting
  var LOOK_DETECT_TIME   = 0.5;    // seconds of player gaze before evade
  var BODYGUARD_COUNT    = 2;      // allies called to shield medic
  var EVADE_DURATION     = 4.0;    // seconds medic stays ducked

  // REVIVE behaviour
  var REVIVE_DURATION    = 5.0;    // seconds to revive a dead enemy
  var REVIVE_HP          = 30;     // HP the revived enemy gets
  var REVIVE_RANGE       = 20;     // search radius for dead bodies

  // Med-kit throw
  var MEDKIT_INTERVAL    = 15.0;   // seconds between throws
  var MEDKIT_LAND_RADIUS = 1.5;    // heal radius on landing
  var MEDKIT_HEAL_AMOUNT = 40;     // HP healed by med-kit on landing
  var MEDKIT_ARC_PEAK    = 3.0;    // arc height (m)
  var MEDKIT_FLIGHT_TIME = 1.2;    // seconds of flight

  // Morale debuff on death
  var MORALE_RANGE       = 12;     // metres: allies affected
  var MORALE_SPEED_MULT  = 0.8;    // 20% slower
  var MORALE_ACC_DEBUFF  = 0.2;    // accuracy -20%
  var MORALE_DEBUFF_DUR  = 12000;  // ms duration

  // Mesh colours
  var COLOR_UNIFORM      = 0xeeeeee;  // white/light-grey uniform
  var COLOR_FLESH        = 0xc8a878;  // skin
  var COLOR_RED          = 0xcc0000;  // red cross
  var COLOR_MEDKIT       = 0xffffff;  // thrown med-kit
  var COLOR_PARTICLE     = 0x00ee55;  // heal "+" particle

  // States
  var STATE_SEARCH = 'SEARCH';
  var STATE_HEAL   = 'HEAL';
  var STATE_EVADE  = 'EVADE';
  var STATE_REVIVE = 'REVIVE';

  // ── Module state ───────────────────────────────────────────────────────────

  var _initialized  = false;
  var _medics       = [];       // active medic objects
  var _audioCtx     = null;

  // ── Utility helpers ────────────────────────────────────────────────────────

  function _rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function _dist3(a, b) {
    var dx = (a.x || 0) - (b.x || 0);
    var dy = (a.y || 0) - (b.y || 0);
    var dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _distXZ(a, b) {
    var dx = (a.x || 0) - (b.x || 0);
    var dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _getScene() {
    return window._gameScene || null;
  }

  function _getCamera() {
    return window._camera || null;
  }

  function _getEnemies() {
    return (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
  }

  function _getPlayerPos() {
    if (window._playerPosition) return window._playerPosition;
    var cam = _getCamera();
    return cam ? cam.position : null;
  }

  function _addScore(pts) {
    if (window.player && window.player.score !== undefined) {
      window.player.score += pts;
    } else {
      window._gameScore = (window._gameScore || 0) + pts;
    }
  }

  function _showToast(msg) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
    }
  }

  function _showKillFeed(msg) {
    var feed = document.getElementById('kill-feed');
    if (!feed) return;
    var el = document.createElement('div');
    el.style.cssText = 'color:#ffffff;font-family:monospace;font-size:12px;' +
      'padding:2px 6px;margin-bottom:2px;background:rgba(0,0,0,0.5);' +
      'border-left:2px solid #00cc55;animation:fadeOut 4s forwards';
    el.textContent = msg;
    feed.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 4000);
  }

  // ── Audio ──────────────────────────────────────────────────────────────────

  function _ensureAudio() {
    if (_audioCtx) return true;
    try {
      if (window._audioCtx) {
        _audioCtx = window._audioCtx;
        return true;
      }
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      _audioCtx = new AC();
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Web Audio: radio crackle burst + 3 descending tones.
   * Called when medic begins healing.
   */
  function _playHealCallout() {
    if (!_ensureAudio()) return;
    var ctx = _audioCtx;
    var t   = ctx.currentTime;

    // Radio crackle — short noise burst
    var crackleLen = Math.floor(ctx.sampleRate * 0.12);
    var crackleBuf = ctx.createBuffer(1, crackleLen, ctx.sampleRate);
    var crackleData = crackleBuf.getChannelData(0);
    for (var i = 0; i < crackleLen; i++) {
      crackleData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / crackleLen, 1.5) * 0.35;
    }
    var crackleSrc  = ctx.createBufferSource();
    crackleSrc.buffer = crackleBuf;
    var crackleGain = ctx.createGain();
    crackleGain.gain.setValueAtTime(0.6, t);
    crackleSrc.connect(crackleGain);
    crackleGain.connect(ctx.destination);
    crackleSrc.start(t);

    // 3 descending tones after crackle
    var freqs  = [880, 660, 440];
    var toneOffset = 0.14;
    for (var j = 0; j < freqs.length; j++) {
      (function (freq, offset) {
        var osc  = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + offset);
        var gn   = ctx.createGain();
        gn.gain.setValueAtTime(0.18, t + offset);
        gn.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.18);
        osc.connect(gn);
        gn.connect(ctx.destination);
        osc.start(t + offset);
        osc.stop(t + offset + 0.2);
      }(freqs[j], toneOffset + j * 0.22));
    }
  }

  // ── Mesh construction ──────────────────────────────────────────────────────

  function _buildMedicMesh() {
    var THREE = window.THREE;
    if (!THREE) return null;

    var group = new THREE.Group();

    // Body — CylinderGeometry (r=0.28, h=1.7) in white/light-grey uniform
    var bodyGeo = new THREE.CylinderGeometry(0.28, 0.28, 1.7, 10);
    var bodyMat = new THREE.MeshLambertMaterial({ color: COLOR_UNIFORM });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.85, 0);   // bottom of cylinder at y=0
    body.castShadow = true;
    group.add(body);

    // Red cross on chest — two thin flat BoxGeometry pieces
    // Horizontal bar
    var crossHGeo = new THREE.BoxGeometry(0.30, 0.06, 0.04);
    var crossMat  = new THREE.MeshLambertMaterial({ color: COLOR_RED });
    var crossH    = new THREE.Mesh(crossHGeo, crossMat);
    crossH.position.set(0, 0.95, 0.285);   // front of body cylinder
    group.add(crossH);

    // Vertical bar
    var crossVGeo = new THREE.BoxGeometry(0.06, 0.30, 0.04);
    var crossV    = new THREE.Mesh(crossVGeo, crossMat.clone());
    crossV.position.set(0, 0.95, 0.286);
    group.add(crossV);

    // Head — SphereGeometry
    var headGeo = new THREE.SphereGeometry(0.22, 8, 8);
    var headMat = new THREE.MeshLambertMaterial({ color: COLOR_FLESH });
    var head    = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.78, 0);
    head.castShadow = true;
    group.add(head);

    // Medical kit box on hip (right side)
    var kitGeo = new THREE.BoxGeometry(0.18, 0.14, 0.10);
    var kitMat = new THREE.MeshLambertMaterial({ color: COLOR_UNIFORM });
    var kit    = new THREE.Mesh(kitGeo, kitMat);
    kit.position.set(0.30, 0.55, 0);
    group.add(kit);

    // Red cross on med kit
    var kitCrossHGeo = new THREE.BoxGeometry(0.14, 0.035, 0.03);
    var kitCrossH    = new THREE.Mesh(kitCrossHGeo, crossMat.clone());
    kitCrossH.position.set(0.30, 0.55, 0.065);
    group.add(kitCrossH);
    var kitCrossVGeo = new THREE.BoxGeometry(0.035, 0.12, 0.03);
    var kitCrossV    = new THREE.Mesh(kitCrossVGeo, crossMat.clone());
    kitCrossV.position.set(0.30, 0.55, 0.066);
    group.add(kitCrossV);

    return {
      group: group,
      body:  body,
      head:  head,
      kit:   kit
    };
  }

  // ── Healing "+" particle ───────────────────────────────────────────────────

  function _spawnHealParticle(pos) {
    var THREE = window.THREE;
    var scene = _getScene();
    if (!THREE || !scene) return;

    var geo  = new THREE.BoxGeometry(0.12, 0.12, 0.04);
    var mat  = new THREE.MeshBasicMaterial({
      color:       COLOR_PARTICLE,
      transparent: true,
      opacity:     1.0
    });

    // Build "+" from two small boxes
    var plusGroup = new THREE.Group();
    var hBar = new THREE.Mesh(geo, mat);
    var vBar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.04), mat.clone());
    plusGroup.add(hBar);
    plusGroup.add(vBar);
    plusGroup.position.set(pos.x + _rand(-0.3, 0.3), pos.y + 1.6, pos.z + _rand(-0.3, 0.3));
    scene.add(plusGroup);

    var elapsed = 0;
    var duration = 1.2;
    var startY = plusGroup.position.y;

    function _tickParticle(dt) {
      elapsed += dt;
      if (elapsed >= duration) {
        scene.remove(plusGroup);
        return true; // done
      }
      var t = elapsed / duration;
      plusGroup.position.y = startY + t * 1.2;
      hBar.material.opacity  = 1 - t;
      vBar.material.opacity  = 1 - t;
      return false;
    }

    // Register as a temporary tick callback using global array
    window._medicParticleTicks = window._medicParticleTicks || [];
    window._medicParticleTicks.push(_tickParticle);
  }

  // ── Med-kit projectile ─────────────────────────────────────────────────────

  function _throwMedKit(medicPos, targetPos) {
    var THREE = window.THREE;
    var scene = _getScene();
    if (!THREE || !scene) return;

    // Build kit mesh: white box with red cross
    var kitGeo  = new THREE.BoxGeometry(0.20, 0.16, 0.12);
    var kitMat  = new THREE.MeshLambertMaterial({ color: COLOR_MEDKIT });
    var kitMesh = new THREE.Mesh(kitGeo, kitMat);

    // Red cross decal on top
    var cH = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.02, 0.04),
      new THREE.MeshLambertMaterial({ color: COLOR_RED })
    );
    cH.position.y = 0.09;
    var cV = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.02, 0.14),
      new THREE.MeshLambertMaterial({ color: COLOR_RED })
    );
    cV.position.y = 0.091;
    kitMesh.add(cH);
    kitMesh.add(cV);

    kitMesh.position.set(medicPos.x, medicPos.y + 1.2, medicPos.z);
    scene.add(kitMesh);

    var sx = medicPos.x, sy = medicPos.y + 1.2, sz = medicPos.z;
    var ex = targetPos.x, ey = targetPos.y + 0.1, ez = targetPos.z;
    var elapsed = 0;
    var landed  = false;

    function _tickKit(dt) {
      if (landed) return true;
      elapsed += dt;
      var t = Math.min(elapsed / MEDKIT_FLIGHT_TIME, 1.0);

      // Parabolic arc
      kitMesh.position.x = sx + (ex - sx) * t;
      kitMesh.position.z = sz + (ez - sz) * t;
      kitMesh.position.y = sy + (ey - sy) * t + MEDKIT_ARC_PEAK * 4 * t * (1 - t);
      kitMesh.rotation.x += dt * 3;
      kitMesh.rotation.z += dt * 2;

      if (t >= 1.0) {
        landed = true;
        // Heal nearby allies on landing
        var enemies = _getEnemies();
        for (var i = 0; i < enemies.length; i++) {
          var e = enemies[i];
          if (!e || e.alive === false || (e.hp !== undefined && e.hp <= 0)) continue;
          var ePos = e.position || (e.mesh && e.mesh.position);
          if (!ePos) continue;
          if (_distXZ(ePos, { x: ex, z: ez }) <= MEDKIT_LAND_RADIUS) {
            var maxHp = e.maxHp || e.maxHP || e._maxHp || 100;
            e.hp = Math.min((e.hp || maxHp), maxHp, (e.hp || 0) + MEDKIT_HEAL_AMOUNT);
            if (e.HP !== undefined) e.HP = e.hp;
          }
        }

        // Flash and remove
        setTimeout(function () {
          if (kitMesh.parent) kitMesh.parent.remove(kitMesh);
          kitGeo.dispose();
          kitMat.dispose();
        }, 400);
        return true;
      }
      return false;
    }

    window._medicParticleTicks = window._medicParticleTicks || [];
    window._medicParticleTicks.push(_tickKit);
  }

  // ── Find nearest low-HP ally (for medkit throw target) ────────────────────

  function _findNearestLowHpAlly(medicPos) {
    var enemies  = _getEnemies();
    var best     = null;
    var bestDist = Infinity;

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || e._isMedic) continue;
      var ePos = e.position || (e.mesh && e.mesh.position);
      if (!ePos) continue;
      var maxHp = e.maxHp || e.maxHP || e._maxHp || 100;
      var curHp = (e.hp !== undefined) ? e.hp : (e.HP !== undefined ? e.HP : null);
      if (curHp === null || curHp > maxHp * WOUNDED_THRESHOLD) continue;
      var d = _distXZ(ePos, medicPos);
      if (d < bestDist) {
        bestDist = d;
        best     = e;
      }
    }
    return best;
  }

  // ── Find dead body to revive ───────────────────────────────────────────────

  function _findReviveTarget(medicPos) {
    var enemies = _getEnemies();
    var best    = null;
    var bestDist = Infinity;

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e) continue;
      // Dead: hp <= 0 but mesh still in scene
      var dead = (e.hp !== undefined && e.hp <= 0) ||
                 (e.HP !== undefined && e.HP <= 0)  ||
                 (e.alive === false);
      if (!dead) continue;
      // Mesh must still exist in scene
      var mesh = e.mesh || e.group || e.meshGroup;
      if (!mesh || !mesh.parent) continue;
      var ePos = e.position || (mesh && mesh.position);
      if (!ePos) continue;
      var d = _distXZ(ePos, medicPos);
      if (d < REVIVE_RANGE && d < bestDist) {
        bestDist = d;
        best     = e;
      }
    }
    return best;
  }

  // ── Evade: call 2 nearby enemies to guard medic ───────────────────────────

  function _callBodyguards(medic) {
    var enemies  = _getEnemies();
    var called   = 0;
    // Sort by proximity to medic
    var nearby   = [];
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || e._isMedic) continue;
      var alive = (e.hp === undefined || e.hp > 0) &&
                  (e.HP === undefined || e.HP > 0)  &&
                  (e.alive !== false);
      if (!alive) continue;
      var ePos = e.position || (e.mesh && e.mesh.position);
      if (!ePos) continue;
      nearby.push({ enemy: e, dist: _distXZ(ePos, medic.position) });
    }
    nearby.sort(function (a, b) { return a.dist - b.dist; });

    for (var j = 0; j < nearby.length && called < BODYGUARD_COUNT; j++) {
      var en  = nearby[j].enemy;
      // Signal the ally to move toward medic position
      if (en.targetPos) {
        en.targetPos.x = medic.position.x + _rand(-1.5, 1.5);
        en.targetPos.z = medic.position.z + _rand(-1.5, 1.5);
      } else if (en._targetX !== undefined) {
        en._targetX = medic.position.x + _rand(-1.5, 1.5);
        en._targetZ = medic.position.z + _rand(-1.5, 1.5);
      }
      // Mark as bodyguard temporarily
      en._bodyguardFor = medic;
      setTimeout(function (enemy) {
        return function () { delete enemy._bodyguardFor; };
      }(en), EVADE_DURATION * 1000);
      called++;
    }
  }

  // ── Morale debuff on medic death ───────────────────────────────────────────

  function _applyMoraleDebuff(deadPos) {
    var enemies = _getEnemies();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e) continue;
      var ePos = e.position || (e.mesh && e.mesh.position);
      if (!ePos || _distXZ(ePos, deadPos) > MORALE_RANGE) continue;

      // Mark low morale flag
      e.morale = 'LOW';

      // Speed penalty
      if (e.speed !== undefined) {
        var origSpeed = e.speed;
        e.speed = e.speed * MORALE_SPEED_MULT;
        setTimeout(function (enemy, orig) {
          return function () {
            if (enemy.morale === 'LOW') {
              enemy.speed  = orig;
              enemy.morale = 'NORMAL';
            }
          };
        }(e, origSpeed), MORALE_DEBUFF_DUR);
      } else if (e._speedMod !== undefined) {
        e._speedMod = (e._speedMod || 1) * MORALE_SPEED_MULT;
        setTimeout(function (enemy) {
          return function () {
            if (enemy.morale === 'LOW') {
              enemy._speedMod = (enemy._speedMod || MORALE_SPEED_MULT) / MORALE_SPEED_MULT;
              enemy.morale    = 'NORMAL';
            }
          };
        }(e), MORALE_DEBUFF_DUR);
      }

      // Accuracy penalty (written as _accuracyMod; weapon systems read this)
      if (e._accuracyMod === undefined) e._accuracyMod = 1.0;
      e._accuracyMod = Math.max(0, e._accuracyMod - MORALE_ACC_DEBUFF);
      setTimeout(function (enemy) {
        return function () {
          if (enemy._accuracyMod !== undefined) {
            enemy._accuracyMod = Math.min(1.0, enemy._accuracyMod + MORALE_ACC_DEBUFF);
          }
        };
      }(e), MORALE_DEBUFF_DUR);

      // Notify EnemyMorale system if present
      if (window.EnemyMorale && window.EnemyMorale.setMorale) {
        window.EnemyMorale.setMorale(e, 'shaken');
      }
    }

    _showToast('FIELD MEDIC DOWN — Enemy morale shaken!');
    _showKillFeed('MEDIC ELIMINATED — Allied morale debuffed');
  }

  // ── Medic kill / cleanup ───────────────────────────────────────────────────

  function _killMedic(medic) {
    if (medic._dead) return;
    medic._dead = true;

    _addScore(MEDIC_SCORE);
    _applyMoraleDebuff(medic.position);

    var scene = _getScene();
    setTimeout(function () {
      if (scene && medic.meshData && medic.meshData.group) {
        scene.remove(medic.meshData.group);
      }
      // Remove heal-ring if any
      if (scene && medic._healRing) {
        scene.remove(medic._healRing);
        medic._healRing = null;
      }
    }, 2000);

    for (var i = _medics.length - 1; i >= 0; i--) {
      if (_medics[i] === medic) {
        _medics.splice(i, 1);
        break;
      }
    }
  }

  // ── Cover lookup ───────────────────────────────────────────────────────────

  function _findNearestCover(medic) {
    var covers = window._coverObjects || [];
    var best   = null;
    var bestDist = Infinity;

    for (var i = 0; i < covers.length; i++) {
      var c = covers[i];
      var cPos = (c && (c.position || (c.mesh && c.mesh.position)));
      if (!cPos) continue;
      var d = _distXZ(cPos, medic.position);
      if (d < bestDist) {
        bestDist = d;
        best     = cPos;
      }
    }

    // Fallback: sprint away from player
    if (!best) {
      var playerPos = _getPlayerPos();
      if (playerPos) {
        var dx = medic.position.x - playerPos.x;
        var dz = medic.position.z - playerPos.z;
        var len = Math.sqrt(dx * dx + dz * dz) || 1;
        best = {
          x: medic.position.x + (dx / len) * 8,
          y: medic.position.y,
          z: medic.position.z + (dz / len) * 8
        };
      }
    }
    return best;
  }

  // ── Player look-at detection ───────────────────────────────────────────────

  function _isPlayerLookingAtMedic(medic) {
    var cam = _getCamera();
    if (!cam) return false;

    var THREE = window.THREE;
    if (!THREE) return false;

    var camDir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).normalize();
    var toMedic = new THREE.Vector3(
      medic.position.x - cam.position.x,
      (medic.position.y + 0.85) - cam.position.y,
      medic.position.z - cam.position.z
    ).normalize();

    var dot   = camDir.dot(toMedic);
    var angle = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);
    return angle <= PLAYER_LOOK_ANGLE;
  }

  // ── Move medic toward target XZ ────────────────────────────────────────────

  function _moveToward(medic, tx, tz, speed, dt) {
    var dx   = tx - medic.position.x;
    var dz   = tz - medic.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.05) return 0;
    var step = Math.min(speed * dt, dist);
    medic.position.x += (dx / dist) * step;
    medic.position.z += (dz / dist) * step;
    // Rotate mesh to face direction of travel
    if (medic.meshData && medic.meshData.group) {
      medic.meshData.group.position.copy(medic.position);
      medic.meshData.group.rotation.y = Math.atan2(dx, dz);
    }
    return dist;
  }

  // ── Healing ring visual ────────────────────────────────────────────────────

  function _ensureHealRing(medic) {
    var THREE = window.THREE;
    var scene = _getScene();
    if (!THREE || !scene || medic._healRing) return;
    var ringGeo = new THREE.RingGeometry(0.5, 0.7, 16);
    var ringMat = new THREE.MeshBasicMaterial({
      color:       0x00ee55,
      side:        THREE.DoubleSide,
      transparent: true,
      opacity:     0.5
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(medic.position.x, medic.position.y + 0.05, medic.position.z);
    scene.add(ring);
    medic._healRing = ring;
  }

  function _removeHealRing(medic) {
    var scene = _getScene();
    if (scene && medic._healRing) {
      scene.remove(medic._healRing);
      if (medic._healRing.geometry) medic._healRing.geometry.dispose();
      if (medic._healRing.material) medic._healRing.material.dispose();
      medic._healRing = null;
    }
  }

  // ── Per-medic AI update ───────────────────────────────────────────────────

  function _updateMedic(medic, dt) {
    if (medic._dead) return;

    // Check own HP
    if (medic.hp <= 0) {
      _killMedic(medic);
      return;
    }

    var playerPos = _getPlayerPos();

    // Track how long player has been looking at medic
    if (_isPlayerLookingAtMedic(medic)) {
      medic._gazedAt = (medic._gazedAt || 0) + dt;
    } else {
      medic._gazedAt = Math.max(0, (medic._gazedAt || 0) - dt * 2);
    }

    // ── Forced EVADE if player targets medic ──────────────────────────────
    if (medic._gazedAt >= LOOK_DETECT_TIME && medic.state !== STATE_EVADE) {
      medic.state      = STATE_EVADE;
      medic._evadeTime = 0;
      medic._coverPos  = _findNearestCover(medic);
      _callBodyguards(medic);
      _showToast('Enemy medic evading!');
    }

    // ── Medkit throw timer ────────────────────────────────────────────────
    medic._medkitTimer = (medic._medkitTimer || 0) + dt;
    if (medic._medkitTimer >= MEDKIT_INTERVAL) {
      medic._medkitTimer = 0;
      var throwTarget = _findNearestLowHpAlly(medic.position);
      if (throwTarget) {
        var tp = throwTarget.position || (throwTarget.mesh && throwTarget.mesh.position);
        if (tp) {
          _throwMedKit(medic.position, tp);
          _showToast('Enemy medic threw med-kit!');
        }
      }
    }

    // ── State machine ─────────────────────────────────────────────────────
    if (medic.state === STATE_SEARCH) {
      _updateSearch(medic, dt, playerPos);
    } else if (medic.state === STATE_HEAL) {
      _updateHeal(medic, dt);
    } else if (medic.state === STATE_EVADE) {
      _updateEvade(medic, dt);
    } else if (medic.state === STATE_REVIVE) {
      _updateRevive(medic, dt);
    }

    // Sync mesh position
    if (medic.meshData && medic.meshData.group) {
      medic.meshData.group.position.copy(medic.position);
    }
  }

  // ── SEARCH ────────────────────────────────────────────────────────────────

  function _updateSearch(medic, dt, playerPos) {
    // Scan for wounded allies periodically
    medic._scanTimer = (medic._scanTimer || 0) + dt;
    if (medic._scanTimer >= SCAN_INTERVAL) {
      medic._scanTimer = 0;

      // Check for revive target first (highest priority after healing)
      var revTarget = _findReviveTarget(medic.position);
      if (revTarget) {
        medic.state        = STATE_REVIVE;
        medic._reviveTarget = revTarget;
        medic._reviveTimer  = 0;
        return;
      }

      // Check for wounded ally to heal
      var healTarget = _findNearestLowHpAlly(medic.position);
      if (healTarget) {
        medic.state        = STATE_HEAL;
        medic._healTarget  = healTarget;
        medic._healTimer   = 0;
        return;
      }
    }

    // Stay 8–15m behind player (avoid close contact)
    if (!playerPos) return;

    var distToPlayer = _distXZ(medic.position, playerPos);

    if (distToPlayer < STAY_BEHIND_MIN) {
      // Too close — back up
      var awayX = medic.position.x + (medic.position.x - playerPos.x);
      var awayZ = medic.position.z + (medic.position.z - playerPos.z);
      _moveToward(medic, awayX, awayZ, MEDIC_SPEED, dt);
    } else if (distToPlayer > STAY_BEHIND_MAX) {
      // Too far — follow behind enemies (move slightly toward player but not too close)
      var midX = playerPos.x + (medic.position.x - playerPos.x) * (STAY_BEHIND_MIN / distToPlayer);
      var midZ = playerPos.z + (medic.position.z - playerPos.z) * (STAY_BEHIND_MIN / distToPlayer);
      _moveToward(medic, midX, midZ, MEDIC_SPEED, dt);
    } else {
      // Good distance — patrol slightly
      if (!medic._patrolTarget || _distXZ(medic.position, medic._patrolTarget) < 0.5) {
        medic._patrolTarget = {
          x: medic.position.x + _rand(-3, 3),
          z: medic.position.z + _rand(-3, 3)
        };
      }
      _moveToward(medic, medic._patrolTarget.x, medic._patrolTarget.z, MEDIC_SPEED * 0.6, dt);
    }
  }

  // ── HEAL ──────────────────────────────────────────────────────────────────

  function _updateHeal(medic, dt) {
    var target = medic._healTarget;
    if (!target) {
      medic.state = STATE_SEARCH;
      return;
    }

    // Check target is still alive and still wounded
    var maxHp  = target.maxHp || target.maxHP || target._maxHp || 100;
    var curHp  = (target.hp !== undefined) ? target.hp : (target.HP !== undefined ? target.HP : null);
    var dead   = (curHp !== null && curHp <= 0) || target.alive === false;
    if (dead || curHp === null || curHp >= maxHp * 0.95) {
      _removeHealRing(medic);
      medic._healTarget = null;
      medic.state       = STATE_SEARCH;
      return;
    }

    var tPos = target.position || (target.mesh && target.mesh.position);
    if (!tPos) {
      medic.state = STATE_SEARCH;
      return;
    }

    var dist = _distXZ(medic.position, tPos);

    if (dist > HEAL_RANGE_ARRIVE) {
      // Run to wounded ally
      _removeHealRing(medic);
      _moveToward(medic, tPos.x, tPos.z, MEDIC_RUN_SPEED, dt);
      return;
    }

    // In range — heal
    _ensureHealRing(medic);
    if (medic._healRing) {
      medic._healRing.position.set(tPos.x, (tPos.y || 0) + 0.05, tPos.z);
    }

    medic._healTimer = (medic._healTimer || 0) + dt;

    // Play sound at start of each healing session
    if (medic._healTimer < dt + 0.01 || medic._justStartedHeal) {
      medic._justStartedHeal = false;
      _playHealCallout();
    }

    // Lean toward ally (body tilt animation)
    if (medic.meshData && medic.meshData.body) {
      var leanAngle = Math.sin(medic._healTimer * 2) * 0.15;
      medic.meshData.body.rotation.z = leanAngle;
    }

    // Apply healing at 5 HP/s
    target.hp = Math.min(curHp + HEAL_RATE * dt, maxHp);
    if (target.HP !== undefined) target.HP = target.hp;

    // Green "+" particle
    medic._particleTimer = (medic._particleTimer || 0) + dt;
    if (medic._particleTimer >= 0.4) {
      medic._particleTimer = 0;
      _spawnHealParticle(tPos);
    }

    // End healing session after HEAL_DURATION
    if (medic._healTimer >= HEAL_DURATION) {
      _removeHealRing(medic);
      if (medic.meshData && medic.meshData.body) {
        medic.meshData.body.rotation.z = 0;
      }
      medic._healTarget       = null;
      medic._healTimer        = 0;
      medic._justStartedHeal  = true;
      medic.state             = STATE_SEARCH;
    }
  }

  // ── EVADE ─────────────────────────────────────────────────────────────────

  function _updateEvade(medic, dt) {
    medic._evadeTime = (medic._evadeTime || 0) + dt;
    _removeHealRing(medic);

    // Sprint toward cover
    if (medic._coverPos) {
      var remainDist = _moveToward(
        medic,
        medic._coverPos.x,
        medic._coverPos.z,
        MEDIC_RUN_SPEED * 1.2,
        dt
      );

      // Duck animation when near cover
      if (medic.meshData && medic.meshData.group && remainDist < 1.5) {
        medic.meshData.group.scale.y = 0.65;  // crouch
      }
    }

    if (medic._evadeTime >= EVADE_DURATION) {
      // Restore scale
      if (medic.meshData && medic.meshData.group) {
        medic.meshData.group.scale.y = 1.0;
      }
      medic._gazedAt  = 0;
      medic._coverPos = null;
      medic.state     = STATE_SEARCH;
    }
  }

  // ── REVIVE ────────────────────────────────────────────────────────────────

  function _updateRevive(medic, dt) {
    var target = medic._reviveTarget;
    if (!target) {
      medic.state = STATE_SEARCH;
      return;
    }

    var mesh   = target.mesh || target.group || target.meshGroup;
    if (!mesh || !mesh.parent) {
      // Body removed from scene
      medic._reviveTarget = null;
      medic.state         = STATE_SEARCH;
      return;
    }

    var tPos = target.position || (mesh && mesh.position);
    if (!tPos) {
      medic.state = STATE_SEARCH;
      return;
    }

    var dist = _distXZ(medic.position, tPos);
    if (dist > HEAL_RANGE_ARRIVE) {
      _moveToward(medic, tPos.x, tPos.z, MEDIC_RUN_SPEED, dt);
      return;
    }

    // Kneel animation
    if (medic.meshData && medic.meshData.group) {
      medic.meshData.group.scale.y = 0.7;
      medic.meshData.group.rotation.y = Math.atan2(
        tPos.x - medic.position.x,
        tPos.z - medic.position.z
      );
    }

    medic._reviveTimer = (medic._reviveTimer || 0) + dt;

    // Pulse particle on body
    medic._particleTimer = (medic._particleTimer || 0) + dt;
    if (medic._particleTimer >= 0.5) {
      medic._particleTimer = 0;
      _spawnHealParticle(tPos);
    }

    if (medic._reviveTimer >= REVIVE_DURATION) {
      // Revive!
      target.hp    = REVIVE_HP;
      target.HP    = REVIVE_HP;
      target.alive = true;
      if (target._dead !== undefined) target._dead = false;

      // Restore mesh visibility
      if (mesh) mesh.visible = true;

      // Restore scale
      if (medic.meshData && medic.meshData.group) {
        medic.meshData.group.scale.y = 1.0;
      }

      _showToast('Enemy medic revived a fallen soldier!');
      _showKillFeed('ENEMY REVIVED by field medic');
      _playHealCallout();

      medic._reviveTarget = null;
      medic._reviveTimer  = 0;
      medic.state         = STATE_SEARCH;
    }
  }

  // ── Public: spawn ─────────────────────────────────────────────────────────

  function spawn(scene, x, y, z) {
    if (_medics.length >= MAX_MEDICS) return null;

    var THREE = window.THREE || (scene && scene.isScene ? window.THREE : null);
    if (!THREE) THREE = window.THREE;

    var meshData = _buildMedicMesh();
    if (!meshData) {
      // Headless environment — still track logic object
    }

    var pos = { x: x || 0, y: y || 0, z: z || 0 };

    if (meshData) {
      meshData.group.position.set(pos.x, pos.y, pos.z);
      if (scene && scene.add) scene.add(meshData.group);
    }

    var medic = {
      hp:              MEDIC_HP,
      maxHp:           MEDIC_HP,
      alive:           true,
      _isMedic:        true,
      _dead:           false,
      position:        { x: pos.x, y: pos.y, z: pos.z },
      state:           STATE_SEARCH,
      meshData:        meshData,
      _healTarget:     null,
      _healTimer:      0,
      _healRing:       null,
      _reviveTarget:   null,
      _reviveTimer:    0,
      _evadeTime:      0,
      _coverPos:       null,
      _gazedAt:        0,
      _scanTimer:      0,
      _medkitTimer:    0,
      _particleTimer:  0,
      _patrolTarget:   null,
      _justStartedHeal: true
    };

    _medics.push(medic);
    return medic;
  }

  // ── Public: init ──────────────────────────────────────────────────────────

  function init() {
    if (_initialized) return;
    _initialized = true;
    window._medicNPCList = _medics;
    window._medicParticleTicks = window._medicParticleTicks || [];
  }

  // ── Public: update ────────────────────────────────────────────────────────

  function update(dt) {
    if (!dt || dt <= 0) return;
    var safeDt = Math.min(dt, 0.1);  // clamp to 100ms max step

    // Update particle / med-kit ticks
    var ticks = window._medicParticleTicks;
    if (ticks && ticks.length) {
      for (var t = ticks.length - 1; t >= 0; t--) {
        var done = ticks[t](safeDt);
        if (done) ticks.splice(t, 1);
      }
    }

    // Update each medic
    for (var i = _medics.length - 1; i >= 0; i--) {
      _updateMedic(_medics[i], safeDt);
    }
  }

  // ── Public: getAll ────────────────────────────────────────────────────────

  function getAll() {
    return _medics;
  }

  // ── Public: reset ─────────────────────────────────────────────────────────

  function reset() {
    var scene = _getScene();
    for (var i = 0; i < _medics.length; i++) {
      var m = _medics[i];
      _removeHealRing(m);
      if (scene && m.meshData && m.meshData.group) {
        scene.remove(m.meshData.group);
      }
    }
    _medics.length = 0;
    window._medicParticleTicks = [];
    _initialized = false;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    init:   init,
    update: update,
    spawn:  spawn,
    getAll: getAll,
    reset:  reset
  };

}());
