// ghost-recon.js — Stealth Infiltration & Ghost Operations module for OccupantKiller
// IIFE pattern, all var (no let/const), pure browser JS, Three.js as global THREE
//
// Public API:
//   GhostRecon.init(scene, camera)
//   GhostRecon.update(delta)
//   GhostRecon.toggleGhostMode()
//   GhostRecon.getDetectionLevel()
//   GhostRecon.reset()
//
// Globals exposed:
//   window._ghostDetectionLevel  — 0-100
//   window._ghostModeActive      — bool
//   window._ghostIntelPoints     — cumulative intel points

window.GhostRecon = (function () {
  'use strict';

  // ─────────────────────────────────────────────── constants

  // Detection
  var DETECT_RATE_BASE        = 8;      // % per second at base range
  var DETECT_RATE_CLOSE       = 25;     // % per second when very close
  var DETECT_RATE_ANGLE       = 1.5;    // multiplier when in enemy FOV cone
  var DETECT_RATE_LIGHT       = 1.4;    // multiplier in lit areas
  var DETECT_DECAY_RATE       = 6;      // % per second decay when not seen
  var DETECT_RANGE_FAR        = 20;     // units — enemy starts noticing player
  var DETECT_RANGE_CLOSE      = 6;      // units — fast detection
  var DETECT_CONE_HALF        = 45;     // degrees half-angle of enemy FOV
  var DETECT_GHOST_MULT       = 0.35;   // multiplier when ghost mode on
  var DETECT_CAMO_MULT        = 0.08;   // multiplier when camo suit active
  var DETECT_PRONE_FLIR_BLOCK = true;   // prone blocks FLIR detection

  // Thresholds
  var THRESH_HIDDEN           = 30;
  var THRESH_SUSPICIOUS       = 60;
  var THRESH_DETECTED         = 90;
  var THRESH_COMPROMISED      = 100;

  // Ghost Mode
  var GHOST_OPACITY           = 0.55;
  var NORMAL_OPACITY          = 1.0;

  // Camo Suit
  var CAMO_OPACITY            = 0.15;
  var CAMO_DURATION           = 30;     // seconds
  var CAMO_COOLDOWN           = 30;     // seconds cooldown after expiry

  // Stealth Kill
  var STEALTH_KILL_BONUS      = 3;      // score multiplier
  var INTEL_PER_KILL          = 15;     // intel points

  // Ghost Squad
  var SQUAD_COUNT             = 3;
  var SQUAD_FOLLOW_DIST       = 6;      // units behind player
  var SQUAD_OVERWATCH_RANGE   = 18;     // units
  var SQUAD_OVERWATCH_CONE    = 40;     // degrees half-angle
  var SQUAD_MOVE_SPEED        = 4.5;
  var SQUAD_COLOR             = 0x1a2a1a;
  var SQUAD_EMIT              = 0x002200;

  // Exfil
  var EXFIL_SUPPRESS_RANGE    = 12;     // units
  var EXFIL_SUPPRESS_DUR      = 10;     // seconds

  // Sound
  var GHOST_AUDIO_GAIN        = 0.25;   // muffled gain when ghost mode on
  var NORMAL_AUDIO_GAIN       = 1.0;

  // HUD IDs
  var HUD_ROOT_ID             = 'ghost-recon-hud';
  var EYE_METER_ID            = 'ghost-recon-eye';
  var INTEL_HUD_ID            = 'ghost-recon-intel';
  var RATING_HUD_ID           = 'ghost-recon-rating';
  var STATUS_BANNER_ID        = 'ghost-recon-banner';
  var CAMO_TIMER_ID           = 'ghost-recon-camo-timer';
  var SQUAD_HUD_ID            = 'ghost-recon-squad';

  // ─────────────────────────────────────────────── state

  var _scene          = null;
  var _camera         = null;
  var _playerMesh     = null;   // player visual mesh (for opacity changes)
  var _enemies        = [];     // array of {mesh, isFLIR, position}

  var _ghostMode      = false;
  var _isProne        = false;
  var _camoActive     = false;
  var _camoTimer      = 0;
  var _camoCooldown   = 0;

  var _detectionLevel = 0;      // 0-100
  var _prevState      = 'HIDDEN';

  var _intelPoints    = 0;
  var _totalKills     = 0;
  var _stealthKills   = 0;

  var _ghostSquad     = [];     // array of squad member objects
  var _squadTargets   = [null, null, null];   // marked positions per ghost
  var _overwatchIdx   = -1;     // which squad member is on overwatch (-1 = none)

  var _exfilActive    = false;
  var _exfilTimer     = 0;

  var _audioCtx       = null;
  var _gainNode       = null;

  // expose to window
  window._ghostDetectionLevel = 0;
  window._ghostModeActive     = false;
  window._ghostIntelPoints    = 0;

  // HUD elements
  var _hudRoot        = null;
  var _eyeMeterEl     = null;
  var _eyeFillEl      = null;
  var _eyeLabelEl     = null;
  var _intelEl        = null;
  var _ratingEl       = null;
  var _bannerEl       = null;
  var _bannerTimer    = null;
  var _camoTimerEl    = null;
  var _squadHudEl     = null;

  var _keysBound      = false;

  // ─────────────────────────────────────────────── helpers

  function _clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function _degreesToRad(d) {
    return d * Math.PI / 180;
  }

  function _vecDist(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // angle in degrees between two directions in XZ plane
  function _angleBetweenXZ(from, to) {
    var dx = to.x - from.x;
    var dz = to.z - from.z;
    var len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.001) return 0;
    var nx = dx / len;
    var nz = dz / len;
    // enemy forward is -Z in Three.js space (facing camera default)
    var dot = nx * 0 + nz * (-1);  // simplified: compare against -Z
    return Math.acos(_clamp(dot, -1, 1)) * 180 / Math.PI;
  }

  // angle (degrees) between enemy's forward and direction to player
  function _enemyAngleToPlayer(enemy) {
    if (!_camera) return 180;
    var ep = enemy.mesh ? enemy.mesh.position : enemy.position;
    var pp = _camera.position;
    // enemy forward direction derived from its rotation
    var fwd = new THREE.Vector3(0, 0, -1);
    if (enemy.mesh) {
      fwd.applyEuler(enemy.mesh.rotation);
    }
    var toPlayer = new THREE.Vector3(pp.x - ep.x, 0, pp.z - ep.z).normalize();
    var dot = fwd.dot(toPlayer);
    return Math.acos(_clamp(dot, -1, 1)) * 180 / Math.PI;
  }

  // ─────────────────────────────────────────────── detection state label

  function _stateLabel(level) {
    if (level < THRESH_HIDDEN)      return 'HIDDEN';
    if (level < THRESH_SUSPICIOUS)  return 'SUSPICIOUS';
    if (level < THRESH_DETECTED)    return 'DETECTED';
    return 'COMPROMISED';
  }

  function _stateColor(label) {
    if (label === 'HIDDEN')      return '#00ff88';
    if (label === 'SUSPICIOUS')  return '#ffcc00';
    if (label === 'DETECTED')    return '#ff6600';
    return '#ff0033';
  }

  // ─────────────────────────────────────────────── HUD

  function _buildHUD() {
    if (document.getElementById(HUD_ROOT_ID)) return;

    _hudRoot = document.createElement('div');
    _hudRoot.id = HUD_ROOT_ID;
    _hudRoot.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'pointer-events:none',
      'z-index:500',
      'font-family:monospace'
    ].join(';');
    document.body.appendChild(_hudRoot);

    // ── Eye meter at top-center ──────────────────────────────
    _eyeMeterEl = document.createElement('div');
    _eyeMeterEl.id = EYE_METER_ID;
    _eyeMeterEl.style.cssText = [
      'position:absolute',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:160px',
      'text-align:center',
      'color:#00ff88',
      'font-size:11px',
      'background:rgba(0,0,0,0.55)',
      'border:1px solid rgba(0,255,136,0.3)',
      'border-radius:4px',
      'padding:4px 8px',
      'user-select:none'
    ].join(';');

    var eyeIcon = document.createElement('div');
    eyeIcon.style.cssText = 'font-size:18px;line-height:1;';
    eyeIcon.textContent = '👁'; // eye emoji

    var meterOuter = document.createElement('div');
    meterOuter.style.cssText = [
      'width:100%',
      'height:6px',
      'background:rgba(255,255,255,0.1)',
      'border-radius:3px',
      'margin:3px 0 2px'
    ].join(';');

    _eyeFillEl = document.createElement('div');
    _eyeFillEl.style.cssText = [
      'height:100%',
      'width:0%',
      'background:#00ff88',
      'border-radius:3px',
      'transition:width 0.1s,background 0.2s'
    ].join(';');
    meterOuter.appendChild(_eyeFillEl);

    _eyeLabelEl = document.createElement('div');
    _eyeLabelEl.style.cssText = 'font-size:10px;letter-spacing:1px;';
    _eyeLabelEl.textContent = 'HIDDEN';

    _eyeMeterEl.appendChild(eyeIcon);
    _eyeMeterEl.appendChild(meterOuter);
    _eyeMeterEl.appendChild(_eyeLabelEl);
    _hudRoot.appendChild(_eyeMeterEl);

    // ── Ghost rating at top-right ──────────────────────────
    _ratingEl = document.createElement('div');
    _ratingEl.id = RATING_HUD_ID;
    _ratingEl.style.cssText = [
      'position:absolute',
      'top:12px',
      'right:16px',
      'color:#aaffdd',
      'font-size:11px',
      'background:rgba(0,0,0,0.55)',
      'border:1px solid rgba(100,255,180,0.25)',
      'border-radius:4px',
      'padding:4px 10px',
      'text-align:right',
      'user-select:none'
    ].join(';');
    _ratingEl.innerHTML = 'GHOST RATING<br><span style="font-size:22px;color:#00ff88;">S</span>';
    _hudRoot.appendChild(_ratingEl);

    // ── Intel points at top-left ───────────────────────────
    _intelEl = document.createElement('div');
    _intelEl.id = INTEL_HUD_ID;
    _intelEl.style.cssText = [
      'position:absolute',
      'top:12px',
      'left:16px',
      'color:#66ddff',
      'font-size:11px',
      'background:rgba(0,0,0,0.55)',
      'border:1px solid rgba(100,200,255,0.25)',
      'border-radius:4px',
      'padding:4px 10px',
      'user-select:none'
    ].join(';');
    _intelEl.innerHTML = 'INTEL<br><span style="font-size:18px;color:#66ddff;">0</span> pts';
    _hudRoot.appendChild(_intelEl);

    // ── Camo timer ────────────────────────────────────────
    _camoTimerEl = document.createElement('div');
    _camoTimerEl.id = CAMO_TIMER_ID;
    _camoTimerEl.style.cssText = [
      'position:absolute',
      'top:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#aaffcc',
      'font-size:10px',
      'background:rgba(0,0,0,0.5)',
      'border-radius:3px',
      'padding:2px 8px',
      'display:none'
    ].join(';');
    _camoTimerEl.textContent = 'CAMO: 30s';
    _hudRoot.appendChild(_camoTimerEl);

    // ── Squad status ──────────────────────────────────────
    _squadHudEl = document.createElement('div');
    _squadHudEl.id = SQUAD_HUD_ID;
    _squadHudEl.style.cssText = [
      'position:absolute',
      'bottom:80px',
      'left:16px',
      'color:#88ffcc',
      'font-size:10px',
      'background:rgba(0,0,0,0.5)',
      'border:1px solid rgba(100,255,180,0.2)',
      'border-radius:4px',
      'padding:4px 8px',
      'user-select:none'
    ].join(';');
    _squadHudEl.innerHTML = 'GHOST SQUAD<br>G1: FOLLOW | G2: FOLLOW | G3: FOLLOW';
    _hudRoot.appendChild(_squadHudEl);

    // ── Alert banner ──────────────────────────────────────
    _bannerEl = document.createElement('div');
    _bannerEl.id = STATUS_BANNER_ID;
    _bannerEl.style.cssText = [
      'position:absolute',
      'top:110px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#fff',
      'font-size:14px',
      'font-weight:bold',
      'letter-spacing:3px',
      'background:rgba(0,0,0,0.7)',
      'border-radius:4px',
      'padding:4px 18px',
      'display:none',
      'text-align:center'
    ].join(';');
    _hudRoot.appendChild(_bannerEl);
  }

  function _showBanner(text, color, duration) {
    if (!_bannerEl) return;
    if (_bannerTimer) clearTimeout(_bannerTimer);
    _bannerEl.textContent = text;
    _bannerEl.style.color = color || '#fff';
    _bannerEl.style.display = 'block';
    _bannerTimer = setTimeout(function () {
      _bannerEl.style.display = 'none';
    }, (duration || 2) * 1000);
  }

  function _updateHUD() {
    if (!_eyeFillEl) return;

    var pct = _detectionLevel;
    var label = _stateLabel(pct);
    var col = _stateColor(label);

    _eyeFillEl.style.width = pct + '%';
    _eyeFillEl.style.background = col;
    _eyeMeterEl.style.color = col;
    _eyeMeterEl.style.borderColor = col.replace(')', ',0.4)').replace('rgb', 'rgba').replace('#', 'rgba(').replace('rgba(', 'rgba(') ;
    // simpler border tint:
    _eyeMeterEl.style.borderColor = col;
    _eyeLabelEl.textContent = label;

    // state transition banner
    if (label !== _prevState) {
      _showBanner(label, col, 2.5);
      _prevState = label;
    }

    // Ghost Rating
    var ratio = _totalKills > 0 ? _stealthKills / _totalKills : 1;
    var ratingLetter = 'C';
    if (ratio >= 0.95) ratingLetter = 'S';
    else if (ratio >= 0.75) ratingLetter = 'A';
    else if (ratio >= 0.50) ratingLetter = 'B';

    var ratingColor = '#00ff88';
    if (ratingLetter === 'A') ratingColor = '#aaffaa';
    else if (ratingLetter === 'B') ratingColor = '#ffcc00';
    else if (ratingLetter === 'C') ratingColor = '#ff6600';

    _ratingEl.innerHTML = 'GHOST RATING<br><span style="font-size:22px;color:' + ratingColor + ';">' + ratingLetter + '</span>';

    // Intel
    _intelEl.innerHTML = 'INTEL<br><span style="font-size:18px;color:#66ddff;">' + _intelPoints + '</span> pts';

    // Camo timer
    if (_camoActive) {
      _camoTimerEl.style.display = 'block';
      _camoTimerEl.textContent = 'CAMO: ' + Math.ceil(_camoTimer) + 's';
      _camoTimerEl.style.color = '#aaffcc';
    } else if (_camoCooldown > 0) {
      _camoTimerEl.style.display = 'block';
      _camoTimerEl.textContent = 'CAMO CD: ' + Math.ceil(_camoCooldown) + 's';
      _camoTimerEl.style.color = '#888';
    } else {
      _camoTimerEl.style.display = 'none';
    }

    // Ghost mode indicator in eye meter
    if (_ghostMode) {
      _eyeMeterEl.style.boxShadow = '0 0 8px rgba(0,200,100,0.5)';
    } else {
      _eyeMeterEl.style.boxShadow = 'none';
    }

    // Squad HUD
    _updateSquadHUD();
  }

  function _updateSquadHUD() {
    if (!_squadHudEl) return;
    var parts = ['GHOST SQUAD'];
    for (var i = 0; i < SQUAD_COUNT; i++) {
      var member = _ghostSquad[i];
      var status = 'FOLLOW';
      if (!member) { status = 'KIA'; }
      else if (i === _overwatchIdx) { status = 'OVERWATCH'; }
      else if (_squadTargets[i]) { status = 'MOVING'; }
      parts.push('G' + (i + 1) + ': ' + status);
    }
    _squadHudEl.innerHTML = parts[0] + '<br>' + parts.slice(1).join(' | ');
  }

  // ─────────────────────────────────────────────── player mesh helpers

  function _findPlayerMesh() {
    if (_playerMesh) return _playerMesh;
    // try common globals
    if (window._playerMesh) { _playerMesh = window._playerMesh; return _playerMesh; }
    if (window.player && window.player.mesh) { _playerMesh = window.player.mesh; return _playerMesh; }
    return null;
  }

  function _setPlayerOpacity(opacity) {
    var mesh = _findPlayerMesh();
    if (!mesh) return;
    mesh.traverse(function (obj) {
      if (obj.isMesh && obj.material) {
        obj.material.transparent = (opacity < 1.0);
        obj.material.opacity = opacity;
      }
    });
  }

  // ─────────────────────────────────────────────── audio

  function _ensureAudio() {
    if (_audioCtx) return;
    if (typeof AudioContext !== 'undefined') {
      _audioCtx = new AudioContext();
      _gainNode = _audioCtx.createGain();
      _gainNode.gain.value = NORMAL_AUDIO_GAIN;
      _gainNode.connect(_audioCtx.destination);
      window._ghostReconGainNode = _gainNode;
    }
  }

  function _setAudioGain(val) {
    if (!_gainNode) return;
    _gainNode.gain.setTargetAtTime(val, _audioCtx.currentTime, 0.1);
  }

  // ─────────────────────────────────────────────── ghost squad

  function _buildSquadMember(index) {
    if (!_scene) return null;

    var geo = new THREE.CapsuleGeometry(0.3, 1.0, 4, 8);
    var mat = new THREE.MeshPhongMaterial({
      color: SQUAD_COLOR,
      emissive: SQUAD_EMIT,
      transparent: true,
      opacity: 0.8
    });
    var mesh = new THREE.Mesh(geo, mat);

    // small head box
    var headGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    var headMat = new THREE.MeshPhongMaterial({ color: SQUAD_COLOR, emissive: SQUAD_EMIT, transparent: true, opacity: 0.8 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.9;
    mesh.add(head);

    // position offset
    var offsetX = (index - 1) * 1.5;
    if (_camera) {
      mesh.position.copy(_camera.position);
      mesh.position.x += offsetX;
      mesh.position.z += SQUAD_FOLLOW_DIST;
    }

    _scene.add(mesh);

    return {
      mesh: mesh,
      index: index,
      alive: true,
      targetPos: null,
      onOverwatch: false,
      overwatchKills: 0
    };
  }

  function _buildGhostSquad() {
    _ghostSquad = [];
    for (var i = 0; i < SQUAD_COUNT; i++) {
      _ghostSquad.push(_buildSquadMember(i));
    }
  }

  function _updateSquad(delta) {
    if (!_camera) return;
    var playerPos = _camera.position;

    for (var i = 0; i < _ghostSquad.length; i++) {
      var member = _ghostSquad[i];
      if (!member || !member.alive) continue;

      var mesh = member.mesh;

      // Determine destination
      var dest = member.targetPos;
      if (!dest) {
        // follow player at offset
        var offsetX = (i - 1) * 1.5;
        dest = new THREE.Vector3(
          playerPos.x + offsetX,
          playerPos.y,
          playerPos.z + SQUAD_FOLLOW_DIST
        );
      }

      // Move toward destination
      var distToDest = mesh.position.distanceTo(dest);
      if (distToDest > 0.3) {
        var dir = new THREE.Vector3().subVectors(dest, mesh.position).normalize();
        var step = Math.min(SQUAD_MOVE_SPEED * delta, distToDest);
        mesh.position.addScaledVector(dir, step);
        // face movement direction
        if (dir.length() > 0.1) {
          mesh.rotation.y = Math.atan2(dir.x, dir.z);
        }
      } else if (member.targetPos) {
        // reached marked position — clear target
        member.targetPos = null;
        _squadTargets[i] = null;
      }

      // Overwatch: scan for enemies
      if (member.onOverwatch && i === _overwatchIdx) {
        _doOverwatch(member, delta);
      }

      // Ghost mode opacity sync
      if (_ghostMode) {
        mesh.material.opacity = 0.5;
      } else {
        mesh.material.opacity = 0.8;
      }
    }
  }

  function _doOverwatch(member, delta) {
    if (!_enemies || _enemies.length === 0) return;
    var pos = member.mesh.position;
    var fwd = new THREE.Vector3(0, 0, -1).applyEuler(member.mesh.rotation);

    for (var i = 0; i < _enemies.length; i++) {
      var enemy = _enemies[i];
      if (!enemy || !enemy.mesh || enemy.dead) continue;
      var ep = enemy.mesh.position;
      var dist = pos.distanceTo(ep);
      if (dist > SQUAD_OVERWATCH_RANGE) continue;

      var toEnemy = new THREE.Vector3().subVectors(ep, pos).normalize();
      var dot = fwd.dot(toEnemy);
      var angleDeg = Math.acos(_clamp(dot, -1, 1)) * 180 / Math.PI;

      if (angleDeg <= SQUAD_OVERWATCH_CONE) {
        // eliminate enemy
        enemy.dead = true;
        if (enemy.mesh.parent) {
          _scene.remove(enemy.mesh);
        }
        member.overwatchKills++;
        _showBanner('OVERWATCH ELIMINATED', '#aaffcc', 1.5);
      }
    }
  }

  function _sendGhostToPosition(idx, position) {
    if (idx < 0 || idx >= _ghostSquad.length) return;
    var member = _ghostSquad[idx];
    if (!member || !member.alive) return;
    member.targetPos = position.clone();
    _squadTargets[idx] = position.clone();
    member.onOverwatch = false;
    if (_overwatchIdx === idx) _overwatchIdx = -1;
    _showBanner('GHOST ' + (idx + 1) + ' MOVING', '#88ffcc', 1.5);
  }

  function _setOverwatch(idx) {
    if (idx < 0 || idx >= _ghostSquad.length) return;
    var member = _ghostSquad[idx];
    if (!member || !member.alive) return;
    if (_overwatchIdx === idx) {
      // toggle off
      member.onOverwatch = false;
      _overwatchIdx = -1;
      _showBanner('OVERWATCH CLEARED', '#aaaaaa', 1.5);
    } else {
      if (_overwatchIdx >= 0 && _ghostSquad[_overwatchIdx]) {
        _ghostSquad[_overwatchIdx].onOverwatch = false;
      }
      member.onOverwatch = true;
      _overwatchIdx = idx;
      _showBanner('GHOST ' + (idx + 1) + ' OVERWATCH', '#00ffcc', 2);
    }
  }

  // ─────────────────────────────────────────────── detection logic

  function _calcDetectionDelta(delta) {
    if (!_camera || !_enemies || _enemies.length === 0) {
      return -DETECT_DECAY_RATE * delta;
    }

    var playerPos = _camera.position;
    var maxIncrease = 0;

    for (var i = 0; i < _enemies.length; i++) {
      var enemy = _enemies[i];
      if (!enemy || !enemy.mesh || enemy.dead) continue;

      var ep = enemy.mesh.position;
      var dist = _vecDist(playerPos, ep);
      if (dist > DETECT_RANGE_FAR) continue;

      // Prone blocks FLIR enemies
      if (_isProne && DETECT_PRONE_FLIR_BLOCK && enemy.isFLIR) continue;

      // distance factor (closer = faster)
      var distFactor = 1 - (dist - DETECT_RANGE_CLOSE) / (DETECT_RANGE_FAR - DETECT_RANGE_CLOSE);
      distFactor = _clamp(distFactor, 0.05, 1);

      // base rate interpolation
      var baseRate = _lerp(DETECT_RATE_BASE, DETECT_RATE_CLOSE, distFactor);

      // angle factor (in cone = faster)
      var angleDeg = _enemyAngleToPlayer(enemy);
      var angleFactor = 1;
      if (angleDeg <= DETECT_CONE_HALF) {
        angleFactor = DETECT_RATE_ANGLE;
      } else {
        angleFactor = 0.3; // enemy not looking at player
      }

      // light factor (simple: darker = less detection)
      var lightFactor = 1;
      if (window._ambientLightLevel !== undefined) {
        lightFactor = 0.4 + 0.6 * window._ambientLightLevel;
      }

      var rate = baseRate * angleFactor * lightFactor;

      // stealth modifiers
      if (_camoActive) {
        rate *= DETECT_CAMO_MULT;
      } else if (_ghostMode) {
        rate *= DETECT_GHOST_MULT;
      }

      if (_isProne) {
        rate *= 0.25;
      }

      var increase = rate * delta;
      if (increase > maxIncrease) maxIncrease = increase;
    }

    if (maxIncrease > 0) {
      return maxIncrease;
    } else {
      return -DETECT_DECAY_RATE * delta;
    }
  }

  function _updateDetection(delta) {
    var change = _calcDetectionDelta(delta);
    _detectionLevel = _clamp(_detectionLevel + change, 0, 100);
    window._ghostDetectionLevel = _detectionLevel;
  }

  // ─────────────────────────────────────────────── enemy reaction

  function _triggerEnemyReaction() {
    var label = _stateLabel(_detectionLevel);
    if (!_enemies) return;
    for (var i = 0; i < _enemies.length; i++) {
      var enemy = _enemies[i];
      if (!enemy || !enemy.mesh || enemy.dead) continue;
      // apply state to enemy behavior flag
      enemy.alertState = label;
    }
  }

  // ─────────────────────────────────────────────── camo suit

  function _activateCamo() {
    if (_camoActive) return;
    if (_camoCooldown > 0) {
      _showBanner('CAMO CD: ' + Math.ceil(_camoCooldown) + 's', '#888888', 1.5);
      return;
    }
    _camoActive = true;
    _camoTimer = CAMO_DURATION;
    _setPlayerOpacity(CAMO_OPACITY);
    _showBanner('CAMO SUIT ACTIVE', '#aaffcc', 2);
  }

  function _updateCamo(delta) {
    if (_camoActive) {
      _camoTimer -= delta;
      if (_camoTimer <= 0) {
        _camoActive = false;
        _camoCooldown = CAMO_COOLDOWN;
        _camoTimer = 0;
        if (!_ghostMode) {
          _setPlayerOpacity(NORMAL_OPACITY);
        } else {
          _setPlayerOpacity(GHOST_OPACITY);
        }
        _showBanner('CAMO EXPIRED', '#ff9900', 1.5);
      }
    } else if (_camoCooldown > 0) {
      _camoCooldown -= delta;
      if (_camoCooldown < 0) _camoCooldown = 0;
    }
  }

  // ─────────────────────────────────────────────── exfil protocol

  function _triggerExfil() {
    if (_exfilActive) return;
    if (_detectionLevel < THRESH_COMPROMISED - 5) {
      _showBanner('NOT COMPROMISED — EXFIL DENIED', '#ff6600', 2);
      return;
    }
    _exfilActive = true;
    _exfilTimer = EXFIL_SUPPRESS_DUR;
    _showBanner('EXFIL PROTOCOL — SUPPRESSING AREA', '#ff3300', 2.5);

    // converge squad on player
    if (_camera) {
      for (var i = 0; i < _ghostSquad.length; i++) {
        var member = _ghostSquad[i];
        if (member && member.alive) {
          var offsetX = (i - 1) * 1.2;
          member.targetPos = new THREE.Vector3(
            _camera.position.x + offsetX,
            _camera.position.y,
            _camera.position.z + 2
          );
        }
      }
    }

    // suppress nearby enemies
    _suppressNearbyEnemies();
  }

  function _suppressNearbyEnemies() {
    if (!_camera || !_enemies) return;
    var playerPos = _camera.position;
    for (var i = 0; i < _enemies.length; i++) {
      var enemy = _enemies[i];
      if (!enemy || !enemy.mesh || enemy.dead) continue;
      var dist = playerPos.distanceTo(enemy.mesh.position);
      if (dist <= EXFIL_SUPPRESS_RANGE) {
        enemy.suppressed = true;
        enemy.suppressTimer = EXFIL_SUPPRESS_DUR;
      }
    }
  }

  function _updateExfil(delta) {
    if (!_exfilActive) return;
    _exfilTimer -= delta;
    // tick down suppression on enemies
    if (_enemies) {
      for (var i = 0; i < _enemies.length; i++) {
        var enemy = _enemies[i];
        if (!enemy || !enemy.mesh || enemy.dead) continue;
        if (enemy.suppressed) {
          enemy.suppressTimer -= delta;
          if (enemy.suppressTimer <= 0) {
            enemy.suppressed = false;
          }
        }
      }
    }
    if (_exfilTimer <= 0) {
      _exfilActive = false;
      _exfilTimer = 0;
      _detectionLevel = 0;
      _showBanner('EXFIL COMPLETE', '#00ff88', 2.5);
    }
  }

  // ─────────────────────────────────────────────── keybindings

  function _onKeyDown(e) {
    var shift = e.shiftKey;
    var ctrl  = e.ctrlKey;
    var key   = e.key;

    // Ghost Mode: Shift+G
    if (shift && !ctrl && (key === 'g' || key === 'G')) {
      e.preventDefault();
      toggleGhostMode();
      return;
    }

    // Camo Suit: Ctrl+Shift (any key while both held — trigger on shift key with ctrl)
    if (ctrl && shift && (key === 'Shift' || key === 'Control')) {
      e.preventDefault();
      _activateCamo();
      return;
    }

    // Prone (thermal concealment): Ctrl held + prone key (C)
    if (ctrl && (key === 'c' || key === 'C')) {
      e.preventDefault();
      _isProne = !_isProne;
      _showBanner(_isProne ? 'PRONE — THERMAL SIGNATURE REDUCED' : 'STANDING', '#aaffcc', 1.5);
      return;
    }

    // Ghost squad commands: Shift+1/2/3
    if (shift && !ctrl && (key === '1' || key === '2' || key === '3')) {
      var gIdx = parseInt(key, 10) - 1;
      // send to camera look-at point (simulate marked position)
      if (_camera) {
        var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
        var markedPos = _camera.position.clone().addScaledVector(fwd, 10);
        _sendGhostToPosition(gIdx, markedPos);
      }
      return;
    }

    // Overwatch: Shift+O
    if (shift && !ctrl && (key === 'o' || key === 'O')) {
      e.preventDefault();
      // cycle overwatch through squad members or toggle off
      var nextIdx = (_overwatchIdx + 1) % SQUAD_COUNT;
      _setOverwatch(nextIdx);
      return;
    }

    // Exfil: Shift+E
    if (shift && !ctrl && (key === 'e' || key === 'E')) {
      e.preventDefault();
      _triggerExfil();
      return;
    }
  }

  function _bindKeys() {
    if (_keysBound) return;
    document.addEventListener('keydown', _onKeyDown, false);
    _keysBound = true;
  }

  // ─────────────────────────────────────────────── public API

  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    _ghostMode      = false;
    _isProne        = false;
    _camoActive     = false;
    _camoTimer      = 0;
    _camoCooldown   = 0;
    _detectionLevel = 0;
    _prevState      = 'HIDDEN';
    _intelPoints    = 0;
    _totalKills     = 0;
    _stealthKills   = 0;
    _overwatchIdx   = -1;
    _exfilActive    = false;
    _exfilTimer     = 0;

    window._ghostDetectionLevel = 0;
    window._ghostModeActive     = false;
    window._ghostIntelPoints    = 0;

    // collect enemies from global if available
    if (window._enemies) _enemies = window._enemies;

    _ensureAudio();
    _buildHUD();
    _buildGhostSquad();
    _bindKeys();

    // expose kill notification hook for game to call
    window._ghostReconOnKill = _onKill;
    window._ghostReconSetEnemies = function (arr) { _enemies = arr; };
    window._ghostReconSetProne   = function (v) { _isProne = !!v; };
  }

  function update(delta) {
    if (!_scene || !_camera) return;

    _updateDetection(delta);
    _triggerEnemyReaction();
    _updateCamo(delta);
    _updateExfil(delta);
    _updateSquad(delta);
    _updateHUD();
  }

  function toggleGhostMode() {
    _ghostMode = !_ghostMode;
    window._ghostModeActive = _ghostMode;

    if (_ghostMode) {
      if (!_camoActive) _setPlayerOpacity(GHOST_OPACITY);
      _setAudioGain(GHOST_AUDIO_GAIN);
      _showBanner('GHOST MODE ON', '#00ff88', 2);
    } else {
      if (!_camoActive) _setPlayerOpacity(NORMAL_OPACITY);
      _setAudioGain(NORMAL_AUDIO_GAIN);
      _showBanner('GHOST MODE OFF', '#aaaaaa', 1.5);
    }
  }

  function getDetectionLevel() {
    return _detectionLevel;
  }

  function reset() {
    _ghostMode      = false;
    _isProne        = false;
    _camoActive     = false;
    _camoTimer      = 0;
    _camoCooldown   = 0;
    _detectionLevel = 0;
    _prevState      = 'HIDDEN';
    _intelPoints    = 0;
    _totalKills     = 0;
    _stealthKills   = 0;
    _overwatchIdx   = -1;
    _exfilActive    = false;
    _exfilTimer     = 0;

    window._ghostDetectionLevel = 0;
    window._ghostModeActive     = false;
    window._ghostIntelPoints    = 0;

    _setPlayerOpacity(NORMAL_OPACITY);
    _setAudioGain(NORMAL_AUDIO_GAIN);

    // remove squad meshes
    for (var i = 0; i < _ghostSquad.length; i++) {
      var member = _ghostSquad[i];
      if (member && member.mesh && _scene) {
        _scene.remove(member.mesh);
      }
    }
    _ghostSquad = [];
    _squadTargets = [null, null, null];

    if (_hudRoot) {
      _hudRoot.style.display = 'none';
    }
  }

  // ─────────────────────────────────────────────── kill integration

  function _onKill(opts) {
    // opts: { wasStealthKill: bool, score: number }
    opts = opts || {};
    _totalKills++;

    var wasHidden = _detectionLevel < THRESH_HIDDEN;
    var isStealthKill = opts.wasStealthKill || wasHidden;

    if (isStealthKill) {
      _stealthKills++;
      _intelPoints += INTEL_PER_KILL;
      window._ghostIntelPoints = _intelPoints;
      // return bonus multiplier hint to caller
      return { scoreMultiplier: STEALTH_KILL_BONUS, intelGained: INTEL_PER_KILL };
    }
    return { scoreMultiplier: 1, intelGained: 0 };
  }

  return {
    init:               init,
    update:             update,
    toggleGhostMode:    toggleGhostMode,
    getDetectionLevel:  getDetectionLevel,
    reset:              reset
  };

})();
