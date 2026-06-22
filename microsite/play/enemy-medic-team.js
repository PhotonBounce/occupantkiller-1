/**
 * enemy-medic-team.js — Enemy Medic Units (Heal Nearby Allies)
 * Ukraine-conflict FPS (Three.js browser game)
 *
 * Spawns enemy medics that stay behind front-line troops and heal
 * wounded allies. They retreat from the player and throw smoke grenades
 * when cornered.
 *
 * API:   window.EnemyMedicTeam.init()
 *        window.EnemyMedicTeam.update(dt)
 *        window.EnemyMedicTeam.spawnMedic(waveNum)
 *        window.EnemyMedicTeam.reset()
 *
 * Globals written: window._medicCount (alive medic count)
 *
 * All var, IIFE pattern, no let/const.
 */
window.EnemyMedicTeam = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────
  var MEDIC_HP              = 80;       // medic hit points
  var MEDIC_SCORE           = 200;      // score awarded on medic kill
  var MAX_MEDICS            = 2;        // hard cap on active medics
  var WAVE_START            = 3;        // first wave to spawn medics

  var HEAL_RANGE            = 8;        // units: ally must be within this
  var HEAL_THRESHOLD        = 0.6;      // heal when ally HP < 60% of max
  var HEAL_RATE             = 15;       // HP per second healed
  var HEAL_DURATION         = 3;        // seconds of continuous healing per session

  var PLAYER_DANGER_RANGE   = 6;        // units: medic panics and retreats
  var SMOKE_COOLDOWN        = 20;       // seconds between smoke throws
  var SMOKE_DURATION        = 8;        // seconds the smoke zone blocks vision

  var STAY_BEHIND_MIN       = 10;       // medic stays 10-20 units behind front line
  var STAY_BEHIND_MAX       = 20;

  var DEMORALIZE_SPEED_MOD  = 0.9;      // -10% speed after medic death
  var DEMORALIZE_DURATION   = 5;        // seconds demoralisation lasts
  var DEMORALIZE_RANGE      = 10;       // units: allies affected

  var BEAM_PULSE_SPEED      = 3;        // opacity pulse frequency (Hz)

  var COLOR_WHITE           = 0xffffff;
  var COLOR_GREEN           = 0x00cc44;
  var COLOR_HELMET          = 0xeeeeee;
  var COLOR_UNIFORM         = 0x556644;  // olive-drab medic uniform
  var COLOR_BADGE_GREEN     = 0x00aa33;
  var COLOR_FLESH           = 0xc8a878;

  // ── Module state ──────────────────────────────────────────────────────
  var _initialized  = false;
  var _medics       = [];   // active medic objects
  var _audioCtx     = null;

  // ── Helpers ───────────────────────────────────────────────────────────

  function _rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function _dist3(a, b) {
    var dx = a.x - b.x;
    var dy = (a.y || 0) - (b.y || 0);
    var dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _distXZ(a, b) {
    var dx = a.x - b.x;
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
    if (window._camera) return window._camera.position;
    return null;
  }

  function _addScore(pts) {
    if (window.player && window.player.score !== undefined) {
      window.player.score += pts;
    } else if (window._gameScore !== undefined) {
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
    el.style.cssText = [
      'color:#ffffff',
      'font-family:monospace',
      'font-size:12px',
      'padding:2px 6px',
      'margin-bottom:2px',
      'background:rgba(0,0,0,0.5)',
      'border-left:2px solid #ffffff',
      'animation:fadeOut 4s forwards'
    ].join(';');
    el.textContent = msg;
    feed.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 4000);
  }

  // ── Audio ─────────────────────────────────────────────────────────────

  function _ensureAudio() {
    if (_audioCtx) return true;
    try {
      var AC = window._audioCtx
        ? null
        : (window.AudioContext || window.webkitAudioContext);
      if (window._audioCtx) {
        _audioCtx = window._audioCtx;
        return true;
      }
      if (!AC) return false;
      _audioCtx = new AC();
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Beeping heart-rate monitor while healing.
   * Returns a stop function to cancel the beep loop.
   */
  function _startHeartbeatBeep() {
    if (!_ensureAudio()) return function () {};

    var ctx = _audioCtx;
    var stopped = false;
    var intervalMs = 600; // ~100 BPM
    var timeoutId = null;

    function _beep() {
      if (stopped) return;
      var t = ctx.currentTime;

      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(660, t + 0.05);

      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);

      timeoutId = setTimeout(_beep, intervalMs);
    }

    _beep();

    return function stop() {
      stopped = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }

  /** Short whoosh for smoke grenade throw */
  function _playSmokeThrow() {
    if (!_ensureAudio()) return;
    var ctx = _audioCtx;
    var t = ctx.currentTime;

    var bufSize = Math.floor(ctx.sampleRate * 0.25);
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2) * 0.4;
    }

    var src = ctx.createBufferSource();
    src.buffer = buf;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(t);
  }

  // ── Mesh Construction ─────────────────────────────────────────────────

  function _buildMedicMesh() {
    var THREE = window.THREE;
    if (!THREE) return null;

    var group = new THREE.Group();

    // Legs
    var legGeo = new THREE.BoxGeometry(0.25, 0.6, 0.25);
    var legMat = new THREE.MeshLambertMaterial({ color: COLOR_UNIFORM });
    var legL   = new THREE.Mesh(legGeo, legMat);
    var legR   = new THREE.Mesh(legGeo, legMat.clone());
    legL.position.set(-0.15, 0.3, 0);
    legR.position.set(0.15, 0.3, 0);
    group.add(legL);
    group.add(legR);

    // Torso
    var torsoGeo = new THREE.BoxGeometry(0.5, 0.55, 0.28);
    var torsoMat = new THREE.MeshLambertMaterial({ color: COLOR_UNIFORM });
    var torso    = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.set(0, 0.88, 0);
    torso.castShadow = true;
    group.add(torso);

    // White cross — horizontal bar
    var crossH = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.05, 0.05),
      new THREE.MeshLambertMaterial({ color: COLOR_WHITE })
    );
    crossH.position.set(0, 0.88, 0.145);
    group.add(crossH);

    // White cross — vertical bar
    var crossV = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.35, 0.05),
      new THREE.MeshLambertMaterial({ color: COLOR_WHITE })
    );
    crossV.position.set(0, 0.88, 0.145);
    group.add(crossV);

    // Head
    var headGeo = new THREE.BoxGeometry(0.38, 0.38, 0.38);
    var headMat = new THREE.MeshLambertMaterial({ color: COLOR_FLESH });
    var head    = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.35, 0);
    head.castShadow = true;
    group.add(head);

    // White helmet
    var helmetGeo = new THREE.BoxGeometry(0.42, 0.22, 0.44);
    var helmetMat = new THREE.MeshLambertMaterial({ color: COLOR_HELMET });
    var helmet    = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.set(0, 1.54, 0);
    group.add(helmet);

    // Green-cross arm badge (left arm)
    var armGeo = new THREE.BoxGeometry(0.14, 0.5, 0.14);
    var armMat = new THREE.MeshLambertMaterial({ color: COLOR_UNIFORM });
    var armL   = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-0.32, 0.88, 0);
    group.add(armL);

    var badgeGeo = new THREE.BoxGeometry(0.16, 0.10, 0.04);
    var badgeMat = new THREE.MeshLambertMaterial({ color: COLOR_BADGE_GREEN });
    var badge    = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(-0.32, 0.95, 0.075);
    group.add(badge);

    // Right arm
    var armR = new THREE.Mesh(armGeo, armMat.clone());
    armR.position.set(0.32, 0.88, 0);
    group.add(armR);

    return {
      group:  group,
      torso:  torso,
      head:   head,
      helmet: helmet
    };
  }

  // ── Healing beam (green THREE.Line) ──────────────────────────────────

  function _createHealBeam(from, to) {
    var THREE = window.THREE;
    var scene = _getScene();
    if (!THREE || !scene) return null;

    var points = [
      new THREE.Vector3(from.x, from.y + 1.0, from.z),
      new THREE.Vector3(to.x,   to.y   + 1.0, to.z)
    ];
    var geo  = new THREE.BufferGeometry().setFromPoints(points);
    var mat  = new THREE.LineBasicMaterial({
      color:       COLOR_GREEN,
      transparent: true,
      opacity:     0.9
    });
    var line = new THREE.Line(geo, mat);
    scene.add(line);
    return { line: line, mat: mat };
  }

  function _removeHealBeam(beam) {
    if (!beam) return;
    var scene = _getScene();
    if (scene && beam.line) scene.remove(beam.line);
    if (beam.line && beam.line.geometry) beam.line.geometry.dispose();
    if (beam.mat) beam.mat.dispose();
  }

  function _updateHealBeamPositions(beam, from, to) {
    if (!beam || !beam.line) return;
    var THREE = window.THREE;
    if (!THREE) return;
    var points = [
      new THREE.Vector3(from.x, from.y + 1.0, from.z),
      new THREE.Vector3(to.x,   to.y   + 1.0, to.z)
    ];
    beam.line.geometry.setFromPoints(points);
    beam.line.geometry.needsUpdate = true;
  }

  // ── Smoke zone ────────────────────────────────────────────────────────

  function _throwSmokeGrenade(pos) {
    _playSmokeThrow();

    // Create a smoke zone at a point between medic and player
    var playerPos = _getPlayerPos();
    var sx = pos.x;
    var sz = pos.z;
    if (playerPos) {
      sx = pos.x + (playerPos.x - pos.x) * 0.4;
      sz = pos.z + (playerPos.z - pos.z) * 0.4;
    }

    var smokePos = { x: sx, y: pos.y || 0, z: sz };

    // Set global smoke zone (blocks player visibility systems)
    window._smokeZone = smokePos;

    // Visual smoke sphere in scene
    var THREE = window.THREE;
    var scene = _getScene();
    if (THREE && scene) {
      var smokeGeo = new THREE.SphereGeometry(4, 8, 8);
      var smokeMat = new THREE.MeshBasicMaterial({
        color:       0x888888,
        transparent: true,
        opacity:     0.45
      });
      var smokeMesh = new THREE.Mesh(smokeGeo, smokeMat);
      smokeMesh.position.set(smokePos.x, smokePos.y + 1.5, smokePos.z);
      scene.add(smokeMesh);

      // Fade out and remove
      var startTime = Date.now();
      var fadeDuration = SMOKE_DURATION * 1000;
      var interval = setInterval(function () {
        var elapsed = Date.now() - startTime;
        var t = elapsed / fadeDuration;
        if (t >= 1) {
          clearInterval(interval);
          if (smokeMesh.parent) smokeMesh.parent.remove(smokeMesh);
          smokeGeo.dispose();
          smokeMat.dispose();
          if (window._smokeZone === smokePos) {
            window._smokeZone = null;
          }
          return;
        }
        smokeMat.opacity = 0.45 * (1 - t);
      }, 80);
    } else {
      // No THREE — still clear the zone after duration
      setTimeout(function () {
        if (window._smokeZone === smokePos) {
          window._smokeZone = null;
        }
      }, SMOKE_DURATION * 1000);
    }

    _showToast('Enemy medic deployed smoke!');
  }

  // ── Demoralise nearby enemies on medic death ──────────────────────────

  function _demoraliseNearbyAllies(deadPos) {
    var enemies = _getEnemies();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e) continue;
      var ePos = e.position || (e.mesh && e.mesh.position);
      if (!ePos) continue;
      if (_distXZ(ePos, deadPos) > DEMORALIZE_RANGE) continue;

      // Apply speed modifier
      if (e._speedMod !== undefined) {
        e._speedMod = (e._speedMod || 1) * DEMORALIZE_SPEED_MOD;
        var saved = e._speedMod;
        setTimeout(function (enemy, restore) {
          return function () {
            if (enemy._speedMod !== undefined) {
              enemy._speedMod = enemy._speedMod / restore * 1;
            }
          };
        }(e, saved), DEMORALIZE_DURATION * 1000);
      } else if (e.speed !== undefined) {
        var origSpeed = e.speed;
        e.speed = e.speed * DEMORALIZE_SPEED_MOD;
        setTimeout(function (enemy, orig) {
          return function () { enemy.speed = orig; };
        }(e, origSpeed), DEMORALIZE_DURATION * 1000);
      }

      // Trigger morale system if present
      if (window.EnemyMorale && window.EnemyMorale.setMorale) {
        window.EnemyMorale.setMorale(e, 'shaken');
      }
    }
  }

  // ── Medic death ───────────────────────────────────────────────────────

  function _killMedic(medic) {
    if (medic._dead) return;
    medic._dead = true;

    // Stop healing beam and audio
    if (medic._healBeam) {
      _removeHealBeam(medic._healBeam);
      medic._healBeam = null;
    }
    if (medic._stopBeep) {
      medic._stopBeep();
      medic._stopBeep = null;
    }

    // Score and feedback
    _addScore(MEDIC_SCORE);
    _showToast('MEDIC DOWN!');
    _showKillFeed('ENEMY MEDIC NEUTRALIZED');

    // Demoralize nearby enemies
    _demoraliseNearbyAllies(medic.position);

    // Remove mesh from scene after short delay
    var scene = _getScene();
    setTimeout(function () {
      if (scene && medic.meshData && medic.meshData.group) {
        scene.remove(medic.meshData.group);
      }
    }, 2000);

    // Update global counter
    window._medicCount = Math.max(0, (window._medicCount || 1) - 1);

    // Remove from array
    for (var i = _medics.length - 1; i >= 0; i--) {
      if (_medics[i] === medic) {
        _medics.splice(i, 1);
        break;
      }
    }
  }

  // ── Find heal target ──────────────────────────────────────────────────

  function _findHealTarget(medic) {
    var enemies = _getEnemies();
    var best    = null;
    var bestPct = 1.0;

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || e._isMedic) continue;

      var ePos = e.position || (e.mesh && e.mesh.position);
      if (!ePos) continue;

      if (_distXZ(ePos, medic.position) > HEAL_RANGE) continue;

      var maxHp  = e.maxHp || e.maxHP || e._maxHp || 100;
      var curHp  = (e.hp !== undefined) ? e.hp : (e.HP !== undefined ? e.HP : e._hp);
      if (curHp === undefined || curHp === null) continue;

      var pct = curHp / maxHp;
      if (pct >= HEAL_THRESHOLD) continue;  // not hurt enough
      if (pct < bestPct) {
        bestPct = pct;
        best    = e;
      }
    }

    return best;
  }

  // ── Medic movement helpers ────────────────────────────────────────────

  /**
   * Move medic toward a target world position (XZ only) at given speed.
   * Returns true if within arrivalRadius.
   */
  function _moveMedicToward(medic, targetPos, speed, dt, arrivalRadius) {
    var dx = targetPos.x - medic.position.x;
    var dz = targetPos.z - medic.position.z;
    var d  = Math.sqrt(dx * dx + dz * dz);
    if (d < arrivalRadius) return true;

    var step = speed * dt;
    medic.position.x += (dx / d) * step;
    medic.position.z += (dz / d) * step;
    if (medic.meshData && medic.meshData.group) {
      medic.meshData.group.position.x = medic.position.x;
      medic.meshData.group.position.z = medic.position.z;
      // Face direction of travel
      medic.meshData.group.rotation.y = Math.atan2(dx, dz);
    }
    return false;
  }

  /** Compute ideal stand-back position for medic relative to front-line enemies */
  function _computeIdlePosition(medic) {
    var playerPos = _getPlayerPos();
    if (!playerPos) return medic.position;

    // Find the centroid of all non-medic enemies
    var enemies    = _getEnemies();
    var cx = 0, cz = 0, count = 0;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || e._isMedic) continue;
      var ep = e.position || (e.mesh && e.mesh.position);
      if (!ep) continue;
      cx += ep.x; cz += ep.z; count++;
    }
    if (count === 0) {
      cx = medic.position.x;
      cz = medic.position.z;
    } else {
      cx /= count; cz /= count;
    }

    // Direction away from player (from player toward centroid)
    var dx = cx - playerPos.x;
    var dz = cz - playerPos.z;
    var d  = Math.sqrt(dx * dx + dz * dz) || 1;
    var dist = _rand(STAY_BEHIND_MIN, STAY_BEHIND_MAX);

    return {
      x: playerPos.x + (dx / d) * dist,
      y: medic.position.y,
      z: playerPos.z + (dz / d) * dist
    };
  }

  // ── Per-medic update ──────────────────────────────────────────────────

  function _updateMedic(medic, dt, time) {
    if (medic._dead) return;

    var playerPos = _getPlayerPos();
    var scene     = _getScene();

    // ── Self-protect: player too close → smoke + retreat ─────────────
    var playerDist = playerPos ? _distXZ(playerPos, medic.position) : Infinity;
    if (playerDist < PLAYER_DANGER_RANGE) {
      medic._smokeCooldown -= dt;
      if (medic._smokeCooldown <= 0) {
        _throwSmokeGrenade(medic.position);
        medic._smokeCooldown = SMOKE_COOLDOWN;
      }

      // Retreat: move away from player
      if (playerPos) {
        var rdx = medic.position.x - playerPos.x;
        var rdz = medic.position.z - playerPos.z;
        var rd  = Math.sqrt(rdx * rdx + rdz * rdz) || 1;
        var retreatTarget = {
          x: medic.position.x + (rdx / rd) * 8,
          y: medic.position.y,
          z: medic.position.z + (rdz / rd) * 8
        };
        _moveMedicToward(medic, retreatTarget, 5, dt, 0.5);
      }

      // Stop healing during retreat
      if (medic._healBeam) {
        _removeHealBeam(medic._healBeam);
        medic._healBeam = null;
      }
      if (medic._stopBeep) {
        medic._stopBeep();
        medic._stopBeep = null;
      }
      medic._healTarget  = null;
      medic._healTimer   = 0;
      return;
    }

    // ── Healing behaviour ─────────────────────────────────────────────
    // Check if current target still needs healing
    if (medic._healTarget) {
      var target    = medic._healTarget;
      var targetPos = target.position || (target.mesh && target.mesh.position);
      var targetHp  = (target.hp !== undefined) ? target.hp
                    : (target.HP !== undefined ? target.HP : target._hp);
      var targetMax = target.maxHp || target.maxHP || target._maxHp || 100;

      var targetAlive  = targetHp !== undefined && targetHp !== null && targetHp > 0;
      var targetNeedsHeal = targetAlive && (targetHp / targetMax) < 1.0;
      var targetInRange   = targetPos && _distXZ(targetPos, medic.position) <= HEAL_RANGE;

      if (!targetAlive || !targetNeedsHeal || !targetInRange || medic._healTimer <= 0) {
        // Stop healing this target
        if (medic._healBeam) {
          _removeHealBeam(medic._healBeam);
          medic._healBeam = null;
        }
        if (medic._stopBeep) {
          medic._stopBeep();
          medic._stopBeep = null;
        }
        medic._healTarget = null;
        medic._healTimer  = 0;
      } else {
        // Move toward target if not adjacent
        if (targetPos) {
          _moveMedicToward(medic, targetPos, 3, dt, 2.0);
        }

        // Heal!
        var healAmt = HEAL_RATE * dt;
        if (target.hp !== undefined) {
          target.hp = Math.min(targetMax, target.hp + healAmt);
        } else if (target.HP !== undefined) {
          target.HP = Math.min(targetMax, target.HP + healAmt);
        } else if (target._hp !== undefined) {
          target._hp = Math.min(targetMax, target._hp + healAmt);
        }

        medic._healTimer -= dt;

        // Update beam position
        if (medic._healBeam && targetPos) {
          _updateHealBeamPositions(medic._healBeam, medic.position, targetPos);
          // Pulse opacity
          var opacity = 0.4 + 0.5 * (0.5 + 0.5 * Math.sin(time * BEAM_PULSE_SPEED * Math.PI * 2));
          medic._healBeam.mat.opacity = opacity;
        }

        return; // currently healing — skip idle wander
      }
    }

    // ── Scan for new heal target ──────────────────────────────────────
    var newTarget = _findHealTarget(medic);
    if (newTarget) {
      medic._healTarget = newTarget;
      medic._healTimer  = HEAL_DURATION;
      // Start beam
      var targetP = newTarget.position || (newTarget.mesh && newTarget.mesh.position);
      if (targetP) {
        medic._healBeam = _createHealBeam(medic.position, targetP);
      }
      // Start beep
      medic._stopBeep = _startHeartbeatBeep();
      return;
    }

    // ── Idle: drift to stand-back position ───────────────────────────
    medic._idleRecomputeTimer -= dt;
    if (medic._idleRecomputeTimer <= 0) {
      medic._idleTarget            = _computeIdlePosition(medic);
      medic._idleRecomputeTimer    = 3 + Math.random() * 2;
    }
    if (medic._idleTarget) {
      _moveMedicToward(medic, medic._idleTarget, 2, dt, 1.5);
    }
  }

  // ── Public: init ──────────────────────────────────────────────────────

  function init() {
    if (_initialized) return;
    _initialized = true;
    window._medicCount = window._medicCount || 0;
  }

  // ── Public: spawnMedic ────────────────────────────────────────────────

  function spawnMedic(waveNum) {
    if (waveNum < WAVE_START) return null;
    if ((window._medicCount || 0) >= MAX_MEDICS) return null;

    var scene = _getScene();
    if (!scene || !window.THREE) {
      console.warn('[EnemyMedicTeam] No scene or THREE available');
      return null;
    }

    // Pick a spawn position behind the player relative to enemy centroid
    var playerPos = _getPlayerPos() || { x: 0, y: 0, z: 0 };
    var spawnDist = _rand(STAY_BEHIND_MIN, STAY_BEHIND_MAX);
    var angle     = Math.random() * Math.PI * 2;
    var sx        = playerPos.x + Math.cos(angle) * spawnDist;
    var sz        = playerPos.z + Math.sin(angle) * spawnDist;
    var sy        = playerPos.y || 0;

    var meshData = _buildMedicMesh();
    if (!meshData) {
      console.warn('[EnemyMedicTeam] Could not build medic mesh (THREE missing?)');
      return null;
    }

    meshData.group.position.set(sx, sy, sz);
    scene.add(meshData.group);

    var medic = {
      position:            { x: sx, y: sy, z: sz },
      hp:                  MEDIC_HP,
      maxHp:               MEDIC_HP,
      _isMedic:            true,
      _dead:               false,
      meshData:            meshData,

      _healTarget:         null,
      _healTimer:          0,
      _healBeam:           null,
      _stopBeep:           null,

      _smokeCooldown:      0,

      _idleTarget:         null,
      _idleRecomputeTimer: 0,

      // Public: allow other systems to damage this medic
      takeDamage: function (amount) {
        if (this._dead) return;
        this.hp = Math.max(0, this.hp - amount);
        if (this.hp <= 0) {
          _killMedic(this);
        }
      }
    };

    _medics.push(medic);
    window._medicCount = (window._medicCount || 0) + 1;

    return medic;
  }

  // ── Public: update ────────────────────────────────────────────────────

  function update(dt) {
    var time = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    for (var i = _medics.length - 1; i >= 0; i--) {
      _updateMedic(_medics[i], dt, time);
    }
  }

  // ── Public: reset ─────────────────────────────────────────────────────

  function reset() {
    var scene = _getScene();
    for (var i = 0; i < _medics.length; i++) {
      var medic = _medics[i];
      if (medic._healBeam) _removeHealBeam(medic._healBeam);
      if (medic._stopBeep) medic._stopBeep();
      if (scene && medic.meshData && medic.meshData.group) {
        scene.remove(medic.meshData.group);
      }
    }
    _medics = [];
    window._medicCount = 0;
  }

  // ── Public API ────────────────────────────────────────────────────────

  return {
    init:       init,
    update:     update,
    spawnMedic: spawnMedic,
    reset:      reset
  };

})();
