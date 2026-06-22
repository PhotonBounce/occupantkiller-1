/**
 * enemy-mortar-team.js — Enemy Mortar Team (Indirect Fire)
 * Ukraine-conflict FPS (Three.js browser game)
 *
 * Spawns a 2-person mortar crew that fires indirect-fire shells at the
 * player using predictive aim. No line-of-sight required. Shells are
 * not visible in flight — only the impact is seen/heard.
 *
 * API:   window.EnemyMortarTeam.init()
 *        window.EnemyMortarTeam.spawn(x, y, z)
 *        window.EnemyMortarTeam.update(dt, playerPos)
 *        window.EnemyMortarTeam.reset()
 *
 * Globals written: window._mortarTeamActive (count)
 *
 * Hooks:
 *   window._onExplosionForScorch(pos, radius) — scorch mark on impact
 *   window._suppressedLevel                   — suppression accumulator
 *   window._gameScore                         — score accumulator
 *
 * All var, IIFE pattern, no let/const.
 */
window.EnemyMortarTeam = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────
  var MORTAR_RANGE        = 40;      // max fire range (units)
  var FIRE_INTERVAL       = 12;      // seconds between fire cycles
  var VOLLEY_MIN          = 1;       // min shells per volley
  var VOLLEY_MAX          = 3;       // max shells per volley
  var SHELL_DELAY         = 8;       // seconds from firing to impact (indirect arc)
  var SHELL_INTERVAL      = 1.4;     // seconds between shells in a volley
  var BLAST_RADIUS        = 6;       // units for damage check
  var NEAR_MISS_RADIUS    = 4;       // units for suppression
  var SHELL_DAMAGE        = 45;      // damage on direct hit
  var SUPPRESSION_HIT     = 40;      // suppression added per near miss
  var CREW_HP             = 50;      // each crewman HP
  var PREDICTION_LEAD     = 2;       // seconds of movement prediction
  var LOADER_PERIOD       = 8;       // seconds per load animation cycle
  var SCORE_KILL          = 500;     // score for destroying team
  var SMOKE_MISS_CHANCE   = 0.5;     // accuracy penalty near smoke
  var SMOKE_RADIUS        = 6;       // smoke detection radius

  // Dark gray material for mortar hardware
  var COLOR_DARK_GRAY     = 0x333333;
  var COLOR_CREW          = 0x4a5a3a;  // olive drab
  var COLOR_BASEPLATE     = 0x222222;

  // ── Module state ──────────────────────────────────────────────────────
  var _scene         = null;
  var _initialized   = false;
  var _teams         = [];           // active mortar team objects
  var _audioCtx      = null;

  // DOM elements
  var _warningBanner = null;
  var _warningTimer  = 0;
  var _indicators    = [];           // per-impact screen-edge indicators

  // ── Helpers ───────────────────────────────────────────────────────────

  function _rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function _distXZ(a, b) {
    var dx = a.x - b.x;
    var dz = (a.z !== undefined ? a.z : 0) - (b.z !== undefined ? b.z : 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _getScene() {
    return _scene || window._gameScene || null;
  }

  // ── Audio ─────────────────────────────────────────────────────────────

  function _ensureAudio() {
    if (_audioCtx) return true;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      _audioCtx = new AC();
      return true;
    } catch (e) {
      return false;
    }
  }

  /** Low 60 Hz pulse — mortar "thunk" launch sound */
  function _playThunk() {
    if (!_ensureAudio()) return;
    var t = _audioCtx.currentTime;

    var osc = _audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.18);

    var gain = _audioCtx.createGain();
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(_audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.28);

    // Short click transient
    var bufSize = Math.floor(_audioCtx.sampleRate * 0.03);
    var buf = _audioCtx.createBuffer(1, bufSize, _audioCtx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 3) * 0.5;
    }
    var clickSrc = _audioCtx.createBufferSource();
    clickSrc.buffer = buf;
    var clickGain = _audioCtx.createGain();
    clickGain.gain.setValueAtTime(0.5, t);
    clickSrc.connect(clickGain);
    clickGain.connect(_audioCtx.destination);
    clickSrc.start(t);
  }

  /** Descending whistle 2000→400 Hz over 2 s — incoming warning */
  function _playWhistle() {
    if (!_ensureAudio()) return;
    var t = _audioCtx.currentTime;

    var osc = _audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 2.0);

    var gain = _audioCtx.createGain();
    gain.gain.setValueAtTime(0.0, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.1);
    gain.gain.setValueAtTime(0.5, t + 1.8);
    gain.gain.linearRampToValueAtTime(0.0, t + 2.1);

    osc.connect(gain);
    gain.connect(_audioCtx.destination);
    osc.start(t);
    osc.stop(t + 2.15);
  }

  // ── DOM: Warning Banner ───────────────────────────────────────────────

  function _ensureWarningBanner() {
    if (_warningBanner) return;
    _warningBanner = document.createElement('div');
    _warningBanner.id = 'mortar-incoming-banner';
    _warningBanner.style.cssText = [
      'position:fixed',
      'top:18%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(200,20,0,0.88)',
      'color:#fff',
      'font-family:monospace',
      'font-size:2rem',
      'font-weight:bold',
      'letter-spacing:0.12em',
      'padding:10px 36px',
      'border:3px solid #ff4400',
      'border-radius:4px',
      'pointer-events:none',
      'display:none',
      'z-index:9000',
      'text-shadow:0 2px 8px #000',
      'animation:mortar-flash 0.4s step-start infinite'
    ].join(';');
    _warningBanner.textContent = '⚠  INCOMING!  ⚠';

    // Keyframe animation
    if (!document.getElementById('mortar-team-style')) {
      var style = document.createElement('style');
      style.id = 'mortar-team-style';
      style.textContent = [
        '@keyframes mortar-flash {',
        '  0%,100%{opacity:1} 50%{opacity:0.35}',
        '}'
      ].join('');
      document.head.appendChild(style);
    }

    document.body.appendChild(_warningBanner);
  }

  function _showWarning(duration) {
    _ensureWarningBanner();
    _warningBanner.style.display = 'block';
    _warningTimer = duration;
  }

  // ── DOM: Screen-edge indicator ────────────────────────────────────────

  function _createIndicator(impactPos, camera) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'width:28px',
      'height:28px',
      'pointer-events:none',
      'z-index:8999',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'font-size:18px'
    ].join(';');
    el.innerHTML = '&#x25BC;'; // downward triangle shell icon
    el.title = 'INCOMING';

    var label = document.createElement('span');
    label.style.cssText = [
      'position:absolute',
      'bottom:-16px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:9px',
      'color:#ff4400',
      'white-space:nowrap',
      'font-weight:bold'
    ].join(';');
    label.textContent = 'INCOMING';
    el.appendChild(label);

    document.body.appendChild(el);

    return {
      el: el,
      impactPos: impactPos,
      ttl: SHELL_DELAY + 1.5
    };
  }

  function _updateIndicator(ind, camera, dt) {
    ind.ttl -= dt;
    if (ind.ttl <= 0) {
      if (ind.el.parentNode) ind.el.parentNode.removeChild(ind.el);
      return false;
    }

    if (!camera || !window.THREE) {
      ind.el.style.display = 'none';
      return true;
    }

    var THREE = window.THREE;
    var vp = new THREE.Vector3(ind.impactPos.x, ind.impactPos.y, ind.impactPos.z);
    vp.project(camera);

    // If in front of camera and on screen, hide indicator
    var inView = (vp.z < 1) && (Math.abs(vp.x) < 0.9) && (Math.abs(vp.y) < 0.9);
    if (inView) {
      ind.el.style.display = 'none';
      return true;
    }

    // Position on screen edge pointing toward impact
    var W = window.innerWidth;
    var H = window.innerHeight;
    var angle = Math.atan2(-vp.y, vp.x);
    var margin = 36;
    var ex = Math.cos(angle);
    var ey = -Math.sin(angle);
    var scale = Math.min((W / 2 - margin) / Math.abs(ex || 0.001),
                         (H / 2 - margin) / Math.abs(ey || 0.001));
    var px = W / 2 + ex * scale;
    var py = H / 2 + ey * scale;

    ind.el.style.display = 'flex';
    ind.el.style.left = Math.round(px - 14) + 'px';
    ind.el.style.top  = Math.round(py - 14) + 'px';
    ind.el.style.color = '#ff4400';
    ind.el.style.transform = 'rotate(' + (angle + Math.PI / 2) + 'rad)';

    return true;
  }

  // ── Mesh Construction ─────────────────────────────────────────────────

  function _buildTeamMesh(scene) {
    var THREE = window.THREE;
    var group = new THREE.Group();

    // Baseplate
    var bpGeo  = new THREE.BoxGeometry(0.4, 0.05, 0.4);
    var bpMat  = new THREE.MeshLambertMaterial({ color: COLOR_BASEPLATE });
    var bp     = new THREE.Mesh(bpGeo, bpMat);
    bp.position.set(0, 0.025, 0);
    bp.castShadow = true;
    group.add(bp);

    // Mortar tube (angled 60° from vertical = 30° from horizontal)
    var tubeGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.5, 8);
    var tubeMat = new THREE.MeshLambertMaterial({ color: COLOR_DARK_GRAY });
    var tube    = new THREE.Mesh(tubeGeo, tubeMat);
    // Tilt 60° forward (from vertical): rotate around X by 30°
    tube.rotation.x = Math.PI / 6;  // 30° → tube points 60° from ground
    tube.position.set(0, 0.35, -0.1);
    tube.castShadow = true;
    group.add(tube);

    // Crew member 1 — gunner (right side)
    var crewGeo1 = new THREE.BoxGeometry(0.4, 1.4, 0.3);
    var crewMat  = new THREE.MeshLambertMaterial({ color: COLOR_CREW });
    var crew1    = new THREE.Mesh(crewGeo1, crewMat);
    crew1.position.set(0.5, 0.7, 0);
    crew1.castShadow = true;
    group.add(crew1);

    // Crew member 2 — loader (left side, will bob forward)
    var crewGeo2 = new THREE.BoxGeometry(0.4, 1.4, 0.3);
    var crew2    = new THREE.Mesh(crewGeo2, crewMat.clone());
    crew2.position.set(-0.5, 0.7, 0);
    crew2.castShadow = true;
    group.add(crew2);

    return { group: group, crew1: crew1, crew2: crew2, tube: tube };
  }

  // ── Smoke detection helper ────────────────────────────────────────────

  function _smokeNearTeam(team) {
    var smokes = window._activeSmokePositions || window._smokeGrenadePositions || [];
    for (var i = 0; i < smokes.length; i++) {
      var s = smokes[i];
      var dx = team.position.x - s.x;
      var dz = team.position.z - (s.z || 0);
      if (Math.sqrt(dx * dx + dz * dz) < SMOKE_RADIUS) return true;
    }
    return false;
  }

  // ── Impact handling ───────────────────────────────────────────────────

  function _triggerImpact(impactPos, team) {
    var scene = _getScene();
    var THREE = window.THREE;

    // Explosion VFX
    if (window.StageVFX && window.StageVFX.spawnExplosion) {
      window.StageVFX.spawnExplosion(impactPos.x, impactPos.y, impactPos.z);
    } else if (scene && THREE) {
      // Fallback: simple flash sphere
      var flashGeo = new THREE.SphereGeometry(1.2, 8, 8);
      var flashMat = new THREE.MeshBasicMaterial({ color: 0xff8800 });
      var flash    = new THREE.Mesh(flashGeo, flashMat);
      flash.position.set(impactPos.x, impactPos.y + 0.5, impactPos.z);
      scene.add(flash);
      setTimeout(function () { if (flash.parent) flash.parent.remove(flash); }, 200);
    }

    // Scorch mark hook
    if (typeof window._onExplosionForScorch === 'function') {
      window._onExplosionForScorch(
        { x: impactPos.x, y: impactPos.y, z: impactPos.z },
        BLAST_RADIUS
      );
    }

    // Camera shake
    if (window._triggerCameraShake) {
      window._triggerCameraShake(1.1);
    } else if (window.CameraSystem && window.CameraSystem.shake) {
      window.CameraSystem.shake(1.1);
    }

    // Player damage check
    var playerPos = window._playerPosition || window._player && window._player.position;
    if (playerPos) {
      var dx = playerPos.x - impactPos.x;
      var dz = playerPos.z - impactPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < BLAST_RADIUS) {
        var dmg = Math.round(SHELL_DAMAGE * (1 - dist / BLAST_RADIUS));
        if (window._applyPlayerDamage) {
          window._applyPlayerDamage(dmg, 'mortar');
        } else if (window.Player && window.Player.takeDamage) {
          window.Player.takeDamage(dmg);
        } else if (window._playerHP !== undefined) {
          window._playerHP = Math.max(0, (window._playerHP || 0) - dmg);
        }
      } else if (dist < NEAR_MISS_RADIUS) {
        // Near-miss suppression
        if (window._suppressedLevel !== undefined) {
          window._suppressedLevel = (window._suppressedLevel || 0) + SUPPRESSION_HIT;
        }
      }
    }
  }

  // ── Fire a volley from a team ─────────────────────────────────────────

  function _fireVolley(team, playerPos) {
    var count = Math.floor(_rand(VOLLEY_MIN, VOLLEY_MAX + 1));
    var hasSmokeNear = _smokeNearTeam(team);

    for (var i = 0; i < count; i++) {
      (function (shellIndex) {
        // Predictive aim: target = playerPos + velocity * PREDICTION_LEAD
        var targetX = playerPos.x + (team._playerVelX || 0) * PREDICTION_LEAD;
        var targetZ = playerPos.z + (team._playerVelZ || 0) * PREDICTION_LEAD;

        // Smoke accuracy reduction
        if (hasSmokeNear && Math.random() < SMOKE_MISS_CHANCE) {
          targetX += _rand(-8, 8);
          targetZ += _rand(-8, 8);
        }

        // Small natural scatter
        targetX += _rand(-1.5, 1.5);
        targetZ += _rand(-1.5, 1.5);

        var impactPos = { x: targetX, y: 0, z: targetZ };

        // Schedule: thunk sound + warning 8s before impact
        var launchDelay = shellIndex * SHELL_INTERVAL;
        var impactDelay = launchDelay + SHELL_DELAY;

        setTimeout(function () {
          if (team._destroyed) return;
          _playThunk();
        }, launchDelay * 1000);

        // Warning appears SHELL_DELAY seconds before impact (at launch time)
        setTimeout(function () {
          if (team._destroyed) return;
          _playWhistle();
          _showWarning(SHELL_DELAY);
          var camera = window._camera || window._gameCamera;
          var ind = _createIndicator(impactPos, camera);
          _indicators.push(ind);
        }, launchDelay * 1000);

        setTimeout(function () {
          if (team._destroyed) return;
          _triggerImpact(impactPos, team);
        }, impactDelay * 1000);
      })(i);
    }
  }

  // ── Team destruction ──────────────────────────────────────────────────

  function _killCrewman(team, index) {
    team._crewHP[index] = 0;
    var scene = _getScene();
    var THREE = window.THREE;
    if (!scene || !THREE) return;

    var crewMesh = (index === 0) ? team.meshes.crew1 : team.meshes.crew2;
    // Ragdoll-style: tip over
    crewMesh.rotation.z = Math.PI / 2 * (index === 0 ? 1 : -1);
    crewMesh.position.y = 0.2;

    if (typeof window._onEnemyDeathForBlood === 'function') {
      window._onEnemyDeathForBlood({ position: crewMesh.position });
    }

    // Check if both dead
    if (team._crewHP[0] <= 0 && team._crewHP[1] <= 0) {
      _destroyTeam(team);
    }
  }

  function _destroyTeam(team) {
    if (team._destroyed) return;
    team._destroyed = true;

    // Score
    if (window._gameScore !== undefined) {
      window._gameScore = (window._gameScore || 0) + SCORE_KILL;
    } else if (window.ScoreSystem && window.ScoreSystem.add) {
      window.ScoreSystem.add(SCORE_KILL, 'Mortar Team');
    }

    // Remove mesh after short delay (so death animation visible)
    var scene = _getScene();
    setTimeout(function () {
      if (scene && team.meshes && team.meshes.group) {
        scene.remove(team.meshes.group);
      }
    }, 2500);

    // Update active count
    window._mortarTeamActive = Math.max(0, (window._mortarTeamActive || 1) - 1);

    // Remove from array
    for (var i = _teams.length - 1; i >= 0; i--) {
      if (_teams[i] === team) { _teams.splice(i, 1); break; }
    }
  }

  // ── Public: init ──────────────────────────────────────────────────────

  function init() {
    if (_initialized) return;
    _initialized = true;
    _scene = _getScene();
    window._mortarTeamActive = window._mortarTeamActive || 0;
    _ensureWarningBanner();
  }

  // ── Public: spawn ─────────────────────────────────────────────────────

  function spawn(x, y, z) {
    var scene = _getScene();
    if (!scene || !window.THREE) {
      console.warn('[EnemyMortarTeam] No scene or THREE available');
      return null;
    }

    var meshData = _buildTeamMesh(scene);
    meshData.group.position.set(x, y, z);
    scene.add(meshData.group);

    var team = {
      position:    { x: x, y: y, z: z },
      meshes:      meshData,
      _crewHP:     [CREW_HP, CREW_HP],
      _destroyed:  false,
      _fireTimer:  _rand(4, FIRE_INTERVAL),  // stagger initial fire
      _loaderTime: 0,
      _loaderBob:  false,
      _playerVelX: 0,
      _playerVelZ: 0,
      _lastPlayerPos: null,

      // Public takeDamage for other systems
      takeDamage: function (amount, hitPos) {
        if (this._destroyed) return;
        // Split damage randomly between crew (or target closest)
        var target = Math.random() < 0.5 ? 0 : 1;
        if (this._crewHP[target] <= 0) target = 1 - target;
        if (this._crewHP[target] <= 0) return;
        this._crewHP[target] -= amount;
        if (this._crewHP[target] <= 0) {
          _killCrewman(this, target);
        }
      }
    };

    _teams.push(team);
    window._mortarTeamActive = (_mortarTeamActive || 0) + 1;

    return team;
  }

  // Expose spawn alias: window._mortarTeamActive needs to read the closure var
  var _mortarTeamActive = window._mortarTeamActive || 0;

  // ── Public: update ────────────────────────────────────────────────────

  function update(dt, playerPos) {
    // Update warning banner timer
    if (_warningTimer > 0) {
      _warningTimer -= dt;
      if (_warningTimer <= 0 && _warningBanner) {
        _warningBanner.style.display = 'none';
      }
    }

    // Update screen-edge indicators
    var camera = window._camera || window._gameCamera;
    for (var k = _indicators.length - 1; k >= 0; k--) {
      if (!_updateIndicator(_indicators[k], camera, dt)) {
        _indicators.splice(k, 1);
      }
    }

    if (!playerPos) return;

    for (var i = 0; i < _teams.length; i++) {
      var team = _teams[i];
      if (team._destroyed) continue;

      // Track player velocity for prediction
      if (team._lastPlayerPos) {
        team._playerVelX = (playerPos.x - team._lastPlayerPos.x) / dt;
        team._playerVelZ = (playerPos.z - team._lastPlayerPos.z) / dt;
      }
      team._lastPlayerPos = { x: playerPos.x, y: playerPos.y || 0, z: playerPos.z };

      // Range check (indirect fire, no LOS needed)
      var dist = _distXZ(team.position, playerPos);
      if (dist > MORTAR_RANGE) continue;

      // Fire timer
      team._fireTimer -= dt;
      if (team._fireTimer <= 0) {
        _fireVolley(team, playerPos);
        team._fireTimer = FIRE_INTERVAL;
      }

      // Loader animation — crew2 bobs forward every LOADER_PERIOD seconds
      team._loaderTime += dt;
      if (team._loaderTime >= LOADER_PERIOD) {
        team._loaderTime -= LOADER_PERIOD;
        team._loaderBob = true;
      }

      if (team._crewHP[1] > 0) {
        var loader = team.meshes.crew2;
        if (team._loaderBob) {
          var bobFrac = team._loaderTime / 0.6;  // 0.6 s bob duration
          if (bobFrac < 1) {
            loader.rotation.x = Math.sin(bobFrac * Math.PI) * 0.45;
          } else {
            loader.rotation.x = 0;
            team._loaderBob = false;
          }
        }
      }
    }
  }

  // ── Public: reset ─────────────────────────────────────────────────────

  function reset() {
    var scene = _getScene();
    for (var i = 0; i < _teams.length; i++) {
      var team = _teams[i];
      if (scene && team.meshes && team.meshes.group) {
        scene.remove(team.meshes.group);
      }
    }
    _teams = [];
    window._mortarTeamActive = 0;

    // Clean up indicators
    for (var k = 0; k < _indicators.length; k++) {
      if (_indicators[k].el && _indicators[k].el.parentNode) {
        _indicators[k].el.parentNode.removeChild(_indicators[k].el);
      }
    }
    _indicators = [];

    if (_warningBanner) {
      _warningBanner.style.display = 'none';
    }
    _warningTimer = 0;
  }

  // ── Public API ────────────────────────────────────────────────────────

  return {
    init:   init,
    update: update,
    spawn:  spawn,
    reset:  reset
  };

})();
