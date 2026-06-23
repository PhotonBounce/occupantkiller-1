/* ───────────────────────────────────────────────────────────────────────────
   DYNAMIC EVENTS — 8 random world events that fire every 30-60s during gameplay.
   Events: MISSILE_STRIKE, FOG_OF_WAR, RADIO_INTERCEPT, AMMO_SHORTAGE,
           AIRSTRIKE_SUPPORT, REINFORCEMENT_WAVE, POWER_OUTAGE, FOUND_CACHE
   ─────────────────────────────────────────────────────────────────────────── */
window.DynamicEvents = (function () {
  'use strict';

  // ── Event type constants ────────────────────────────────────────────────────
  var EVT_MISSILE_STRIKE       = 'MISSILE_STRIKE';
  var EVT_FOG_OF_WAR           = 'FOG_OF_WAR';
  var EVT_RADIO_INTERCEPT      = 'RADIO_INTERCEPT';
  var EVT_AMMO_SHORTAGE        = 'AMMO_SHORTAGE';
  var EVT_AIRSTRIKE_SUPPORT    = 'AIRSTRIKE_SUPPORT';
  var EVT_REINFORCEMENT_WAVE   = 'REINFORCEMENT_WAVE';
  var EVT_POWER_OUTAGE         = 'POWER_OUTAGE';
  var EVT_FOUND_CACHE          = 'FOUND_CACHE';

  var ALL_EVENT_TYPES = [
    EVT_MISSILE_STRIKE,
    EVT_FOG_OF_WAR,
    EVT_RADIO_INTERCEPT,
    EVT_AMMO_SHORTAGE,
    EVT_AIRSTRIKE_SUPPORT,
    EVT_REINFORCEMENT_WAVE,
    EVT_POWER_OUTAGE,
    EVT_FOUND_CACHE
  ];

  // ── Radio intercept messages ────────────────────────────────────────────────
  var RADIO_MESSAGES = [
    'DELTA SQUAD: "Hostiles converging on sector 7, all units proceed with caution."',
    'BRAVO-6: "Enemy armor spotted near the eastern ridge, requesting support."',
    'COMMAND: "Pull back to rally point Foxtrot, they know our position."',
    'ALPHA-1: "Three snipers confirmed on the northern overpass, do not advance."',
    'ECHO TEAM: "Flanking maneuver in progress, target the rear guard."',
    'COMMAND: "Artillery pre-positioned south of grid 44, stand by for fire mission."',
    'STRIKER-2: "Ambush at the junction — multiple tangos, suppressing fire needed."',
    'GHOST-9: "Recon confirms enemy HQ is two clicks west, moving to intercept."'
  ];

  // ── Internal state ──────────────────────────────────────────────────────────
  var _scene       = null;
  var _camera      = null;
  var _inited      = false;
  var _active      = false;         // is an event currently running?
  var _activeType  = null;
  var _eventQueue  = [];            // queued event types (strings)
  var _countdown   = 0;            // seconds until next event fires
  var _eventLog    = [];           // last N event strings
  var _hudEl       = null;         // overlay HUD root
  var _logEl       = null;         // scrolling event log element
  var _alertEl     = null;         // flashing alert element
  var _alertTimer  = 0;
  var _cleanupFns  = [];           // functions to run when active event ends
  var _sceneObjects = [];          // Three.js objects added to scene (cleaned up)
  var _altQDown    = false;        // Alt+Q key state for airstrike
  var _aiStrikeTarget = null;      // Vector3 airstrike target
  var _aiStrikeCountdown = 0;      // seconds remaining
  var _aiStrikeArmed = false;
  var _audioCtx    = null;

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        _audioCtx = null;
      }
    }
    return _audioCtx;
  }

  function _playTone(freq, duration, volume) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume || 0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function _playAlarmSound(cycles) {
    // Alternating 500/400 Hz alarm
    var ctx = _getAudioCtx();
    if (!ctx) return;
    var interval = 0;
    for (var i = 0; i < (cycles || 6); i++) {
      (function (idx) {
        setTimeout(function () {
          _playTone(idx % 2 === 0 ? 500 : 400, 0.45, 0.35);
        }, idx * 500);
      })(i);
    }
  }

  function _getRandOffset(range) {
    return (Math.random() - 0.5) * 2 * range;
  }

  function _getPlayerPos() {
    if (_camera) {
      return _camera.position.clone();
    }
    return new THREE.Vector3(0, 0, 0);
  }

  function _addSceneObject(obj) {
    if (_scene && obj) {
      _scene.add(obj);
      _sceneObjects.push(obj);
    }
  }

  function _clearSceneObjects() {
    for (var i = 0; i < _sceneObjects.length; i++) {
      var obj = _sceneObjects[i];
      if (_scene) _scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }
    _sceneObjects = [];
  }

  function _randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function _randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function _dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  // ── HUD layer creation ──────────────────────────────────────────────────────

  function _ensureHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'de-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:9000',
      'font-family:monospace'
    ].join(';');
    document.body.appendChild(_hudEl);

    // Alert banner (centre screen)
    _alertEl = document.createElement('div');
    _alertEl.id = 'de-alert';
    _alertEl.style.cssText = [
      'position:absolute',
      'top:18%',
      'left:50%',
      'transform:translateX(-50%)',
      'font-size:28px',
      'font-weight:bold',
      'letter-spacing:3px',
      'text-align:center',
      'padding:8px 24px',
      'border-radius:4px',
      'display:none',
      'pointer-events:none',
      'text-shadow:0 0 12px currentColor'
    ].join(';');
    _hudEl.appendChild(_alertEl);

    // Event log (bottom-right)
    _logEl = document.createElement('div');
    _logEl.id = 'de-log';
    _logEl.style.cssText = [
      'position:absolute',
      'bottom:90px',
      'right:16px',
      'width:340px',
      'background:rgba(0,0,0,0.55)',
      'border:1px solid rgba(255,255,255,0.15)',
      'border-radius:4px',
      'padding:6px 10px',
      'font-size:11px',
      'color:#ccc',
      'pointer-events:none'
    ].join(';');
    _hudEl.appendChild(_logEl);
  }

  function _logEvent(msg) {
    var now = new Date();
    var ts = ('0' + now.getMinutes()).slice(-2) + ':' + ('0' + now.getSeconds()).slice(-2);
    _eventLog.unshift('[' + ts + '] ' + msg);
    if (_eventLog.length > 5) _eventLog.length = 5;
    _renderLog();
  }

  function _renderLog() {
    if (!_logEl) return;
    var html = '<div style="color:#aaa;font-size:10px;margin-bottom:3px">EVENT LOG</div>';
    for (var i = 0; i < _eventLog.length; i++) {
      var opacity = 1 - i * 0.18;
      html += '<div style="opacity:' + opacity + ';margin:1px 0">' + _eventLog[i] + '</div>';
    }
    _logEl.innerHTML = html;
  }

  function _showAlert(text, color, duration) {
    _ensureHUD();
    _alertEl.textContent = text;
    _alertEl.style.color = color || '#ff2222';
    _alertEl.style.display = 'block';
    _alertTimer = duration || 3;
  }

  function _showToast(text, color, duration) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:' + (color || '#fff'),
      'font-family:monospace',
      'font-size:16px',
      'font-weight:bold',
      'padding:8px 20px',
      'border-radius:4px',
      'z-index:9100',
      'pointer-events:none',
      'border:1px solid ' + (color || '#fff'),
      'letter-spacing:2px'
    ].join(';');
    el.textContent = text;
    document.body.appendChild(el);
    var d = (duration || 3) * 1000;
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, d);
  }

  // ── Event: MISSILE_STRIKE ───────────────────────────────────────────────────

  function _startMissileStrike() {
    _active = true;
    _activeType = EVT_MISSILE_STRIKE;
    _logEvent('MISSILE STRIKE incoming!');

    _playAlarmSound(8);
    _showAlert('!! INCOMING MISSILES !!', '#ff2222', 3);

    var blinkInterval = setInterval(function () {
      if (_alertEl) {
        _alertEl.style.visibility = (_alertEl.style.visibility === 'hidden') ? 'visible' : 'hidden';
      }
    }, 300);

    // After 3s warning, strike
    var strikeTimeout = setTimeout(function () {
      clearInterval(blinkInterval);
      if (_alertEl) {
        _alertEl.style.visibility = 'visible';
        _alertEl.style.display = 'none';
      }
      _doMissileImpacts();
    }, 3000);

    _cleanupFns.push(function () {
      clearInterval(blinkInterval);
      clearTimeout(strikeTimeout);
    });
  }

  function _doMissileImpacts() {
    var playerPos = _getPlayerPos();
    var impacts = 3;
    var delay = 0;

    function doImpact(idx) {
      var ox = _getRandOffset(20);
      var oz = _getRandOffset(20);
      var pos = new THREE.Vector3(playerPos.x + ox, 0, playerPos.z + oz);

      // Crater disc
      var geo = new THREE.CircleGeometry(1.5, 16);
      var mat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a, side: THREE.DoubleSide });
      var crater = new THREE.Mesh(geo, mat);
      crater.rotation.x = -Math.PI / 2;
      crater.position.set(pos.x, 0.02, pos.z);
      _addSceneObject(crater);

      // Splash damage
      var pPos = _getPlayerPos();
      var dist = _dist2D(pPos, pos);
      if (dist <= 6) {
        if (window.playerHealth !== undefined) {
          window.playerHealth = Math.max(0, window.playerHealth - 40);
        }
        _showToast('MISSILE HIT! -40 HP', '#ff4444', 1.5);
      }

      // Flash
      _playTone(120, 0.8, 0.5);
      _showToast('BOOM! Impact #' + (idx + 1), '#ff6600', 1);
    }

    for (var i = 0; i < impacts; i++) {
      (function (idx) {
        setTimeout(function () {
          doImpact(idx);
          if (idx === impacts - 1) {
            // Last impact — end event
            setTimeout(function () {
              _endEvent();
            }, 1500);
          }
        }, 800 + idx * 1200);
      })(i);
    }
  }

  // ── Event: FOG_OF_WAR ───────────────────────────────────────────────────────

  function _startFogOfWar() {
    _active = true;
    _activeType = EVT_FOG_OF_WAR;
    _logEvent('Fog of War descended');

    window._fogDensity = 0.8;
    window._fogOfWarRange = 8;

    if (_scene && _scene.fog) {
      _scene.fog.near = 1;
      _scene.fog.far = 8;
    } else if (_scene) {
      _scene.fog = new THREE.Fog(0x888888, 1, 8);
    }

    _showToast('HEAVY FOG ROLLING IN', '#aaddff', 3);
    _showAlert('HEAVY FOG ROLLING IN', '#aaddff', 3);

    var hudIndicator = _createHUDIndicator('FOG ACTIVE', '#88aacc');

    var endTimeout = setTimeout(function () {
      _clearHUDIndicator(hudIndicator);
      window._fogDensity = 0;
      window._fogOfWarRange = null;
      if (_scene && _scene.fog) {
        _scene.fog.near = 20;
        _scene.fog.far = 80;
      }
      _endEvent();
    }, 20000);

    _cleanupFns.push(function () {
      clearTimeout(endTimeout);
      _clearHUDIndicator(hudIndicator);
      window._fogDensity = 0;
      window._fogOfWarRange = null;
    });
  }

  // ── Event: RADIO_INTERCEPT ──────────────────────────────────────────────────

  function _startRadioIntercept() {
    _active = true;
    _activeType = EVT_RADIO_INTERCEPT;
    _logEvent('Enemy comms intercepted');

    var msg = _randomFrom(RADIO_MESSAGES);

    _showToast('ENEMY COMMS INTERCEPTED', '#00ff88', 2);

    // Show decoded message panel
    var panel = document.createElement('div');
    panel.style.cssText = [
      'position:fixed',
      'top:30%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,0,0.9)',
      'color:#00ff44',
      'font-family:monospace',
      'font-size:13px',
      'padding:16px 24px',
      'border:1px solid #00ff44',
      'border-radius:4px',
      'z-index:9200',
      'max-width:420px',
      'text-align:center',
      'letter-spacing:1px',
      'pointer-events:none'
    ].join(';');
    panel.innerHTML = '<div style="font-size:10px;opacity:0.7;margin-bottom:8px">[ INTERCEPTED TRANSMISSION ]</div>' + msg;
    document.body.appendChild(panel);

    // Mark random enemies on minimap
    window._interceptedEnemies = [];
    if (window.enemies && Array.isArray(window.enemies)) {
      var count = Math.min(3, window.enemies.length);
      var shuffled = window.enemies.slice().sort(function () { return Math.random() - 0.5; });
      for (var i = 0; i < count; i++) {
        if (shuffled[i]) window._interceptedEnemies.push(shuffled[i]);
      }
    }

    var endTimeout = setTimeout(function () {
      if (panel.parentNode) panel.parentNode.removeChild(panel);
      window._interceptedEnemies = [];
      _endEvent();
    }, 15000);

    _cleanupFns.push(function () {
      clearTimeout(endTimeout);
      if (panel.parentNode) panel.parentNode.removeChild(panel);
      window._interceptedEnemies = [];
    });
  }

  // ── Event: AMMO_SHORTAGE ────────────────────────────────────────────────────

  function _startAmmoShortage() {
    _active = true;
    _activeType = EVT_AMMO_SHORTAGE;
    _logEvent('Ammo Shortage — 50% cap active');

    window._ammoShortageActive = true;

    // Cap current ammo at 50%
    if (window.playerAmmo !== undefined) {
      var maxAmmo = window.playerMaxAmmo || 100;
      var cap = Math.floor(maxAmmo * 0.5);
      if (window.playerAmmo > cap) window.playerAmmo = cap;
    }

    _showToast('AMMO SHORTAGE', '#ffaa00', 3);
    var hudIndicator = _createHUDIndicator('AMMO SHORTAGE', '#ffaa00');

    var endTimeout = setTimeout(function () {
      _clearHUDIndicator(hudIndicator);
      window._ammoShortageActive = false;
      _showToast('Ammo supply restored', '#88ff88', 2);
      _endEvent();
    }, 20000);

    _cleanupFns.push(function () {
      clearTimeout(endTimeout);
      _clearHUDIndicator(hudIndicator);
      window._ammoShortageActive = false;
    });
  }

  // ── Event: AIRSTRIKE_SUPPORT ────────────────────────────────────────────────

  function _startAirstrikeSupport() {
    _active = true;
    _activeType = EVT_AIRSTRIKE_SUPPORT;
    _logEvent('Airstrike support available — Alt+Q to mark target');

    _aiStrikeArmed = true;
    _aiStrikeTarget = null;
    _aiStrikeCountdown = 0;

    _showToast('AIRSTRIKE AVAILABLE — press Alt+Q to mark target', '#00ccff', 4);
    var hudIndicator = _createHUDIndicator('AIRSTRIKE READY [Alt+Q]', '#00ccff');

    // Listen for Alt+Q
    function onKeyDown(e) {
      if (_aiStrikeArmed && e.altKey && (e.key === 'q' || e.key === 'Q')) {
        e.preventDefault();
        _aiStrikeTarget = _getPlayerPos();
        _aiStrikeTarget.x += _getRandOffset(5);
        _aiStrikeTarget.z += _getRandOffset(5);
        _aiStrikeArmed = false;
        _aiStrikeCountdown = 5;
        _clearHUDIndicator(hudIndicator);
        _showToast('AIRSTRIKE EN ROUTE — 5s', '#ff8800', 1.5);
        document.removeEventListener('keydown', onKeyDown);
      }
    }
    document.addEventListener('keydown', onKeyDown);

    // Timeout if player never marks
    var noMarkTimeout = setTimeout(function () {
      if (_aiStrikeArmed) {
        _aiStrikeArmed = false;
        document.removeEventListener('keydown', onKeyDown);
        _clearHUDIndicator(hudIndicator);
        _showToast('Airstrike window expired', '#888888', 2);
        _endEvent();
      }
    }, 30000);

    _cleanupFns.push(function () {
      _aiStrikeArmed = false;
      _aiStrikeTarget = null;
      _aiStrikeCountdown = 0;
      document.removeEventListener('keydown', onKeyDown);
      clearTimeout(noMarkTimeout);
      _clearHUDIndicator(hudIndicator);
    });
  }

  function _executeAirstrike(targetPos) {
    // 4 bombs in a 4x4 grid
    var offsets = [
      [-3, -3], [3, -3], [-3, 3], [3, 3]
    ];
    for (var i = 0; i < offsets.length; i++) {
      (function (ox, oz, idx) {
        setTimeout(function () {
          var bx = targetPos.x + ox;
          var bz = targetPos.z + oz;
          var bPos = new THREE.Vector3(bx, 0, bz);

          // Crater
          var geo = new THREE.CircleGeometry(1.2, 12);
          var mat = new THREE.MeshBasicMaterial({ color: 0x222200, side: THREE.DoubleSide });
          var crater = new THREE.Mesh(geo, mat);
          crater.rotation.x = -Math.PI / 2;
          crater.position.set(bx, 0.02, bz);
          _addSceneObject(crater);

          // Damage check
          var pPos = _getPlayerPos();
          var dist = _dist2D(pPos, bPos);
          if (dist <= 3) {
            if (window.playerHealth !== undefined) {
              window.playerHealth = Math.max(0, window.playerHealth - 80);
            }
            _showToast('FRIENDLY FIRE! -80 HP', '#ff0000', 2);
          }

          // Enemy damage
          if (window.enemies && Array.isArray(window.enemies)) {
            for (var ei = 0; ei < window.enemies.length; ei++) {
              var en = window.enemies[ei];
              if (en && en.mesh) {
                var eDist = _dist2D(en.mesh.position, bPos);
                if (eDist <= 3) {
                  if (typeof en.hp !== 'undefined') en.hp -= 80;
                  if (typeof en.health !== 'undefined') en.health -= 80;
                }
              }
            }
          }

          _playTone(100 + idx * 30, 1.0, 0.5);

          if (idx === offsets.length - 1) {
            _showToast('AIRSTRIKE COMPLETE', '#00ccff', 2);
            setTimeout(_endEvent, 2000);
          }
        }, idx * 800);
      })(offsets[i][0], offsets[i][1], i);
    }
  }

  // ── Event: REINFORCEMENT_WAVE ───────────────────────────────────────────────

  function _startReinforcementWave() {
    _active = true;
    _activeType = EVT_REINFORCEMENT_WAVE;
    _logEvent('Enemy reinforcements arrived!');

    _showAlert('!! ENEMY REINFORCEMENTS !!', '#ff2222', 4);
    _showToast('ENEMY REINFORCEMENTS!', '#ff2222', 4);
    _playTone(220, 0.6, 0.4);
    _playTone(180, 0.6, 0.4);

    // Attempt to spawn 6 enemies at map edges
    var spawned = 0;
    var edgePositions = [
      new THREE.Vector3(-45, 0, 0),
      new THREE.Vector3(45, 0, 0),
      new THREE.Vector3(0, 0, -45),
      new THREE.Vector3(0, 0, 45),
      new THREE.Vector3(-35, 0, -35),
      new THREE.Vector3(35, 0, 35)
    ];

    if (typeof window.spawnEnemy === 'function') {
      for (var i = 0; i < 6; i++) {
        var pos = edgePositions[i % edgePositions.length];
        try {
          var enemy = window.spawnEnemy(pos.x, pos.y, pos.z);
          if (enemy) {
            if (typeof enemy.hp !== 'undefined') enemy.hp += 20;
            if (typeof enemy.health !== 'undefined') enemy.health += 20;
            if (typeof enemy.maxHp !== 'undefined') enemy.maxHp += 20;
            spawned++;
          }
        } catch (e) {}
      }
    }

    setTimeout(_endEvent, 3000);
  }

  // ── Event: POWER_OUTAGE ─────────────────────────────────────────────────────

  function _startPowerOutage() {
    _active = true;
    _activeType = EVT_POWER_OUTAGE;
    _logEvent('Power Grid Down — systems degraded');

    // Desaturate canvas
    var canvas = document.querySelector('canvas');
    var prevFilter = canvas ? canvas.style.filter : '';
    if (canvas) canvas.style.filter = 'saturate(0) brightness(0.5)';

    // Dim HUD
    var hudEls = document.querySelectorAll('#hud, .hud, #game-hud');
    var prevOpacities = [];
    for (var i = 0; i < hudEls.length; i++) {
      prevOpacities.push(hudEls[i].style.opacity);
      hudEls[i].style.opacity = '0.2';
    }

    // Overlay text
    var overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed',
      'top:45%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ff4400',
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'letter-spacing:4px',
      'z-index:9300',
      'pointer-events:none',
      'text-shadow:0 0 10px #ff2200'
    ].join(';');
    overlay.textContent = 'POWER GRID DOWN';
    document.body.appendChild(overlay);

    window._powerOutageActive = true;
    window._enemyDetectionRangeMultiplier = 0.5;

    _showToast('POWER GRID DOWN', '#ff4400', 3);

    var endTimeout = setTimeout(function () {
      if (canvas) canvas.style.filter = prevFilter;
      for (var j = 0; j < hudEls.length; j++) {
        hudEls[j].style.opacity = prevOpacities[j] || '';
      }
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      window._powerOutageActive = false;
      window._enemyDetectionRangeMultiplier = 1.0;
      _showToast('Power restored', '#88ff88', 2);
      _endEvent();
    }, 15000);

    _cleanupFns.push(function () {
      clearTimeout(endTimeout);
      if (canvas) canvas.style.filter = prevFilter;
      for (var j = 0; j < hudEls.length; j++) {
        hudEls[j].style.opacity = prevOpacities[j] || '';
      }
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      window._powerOutageActive = false;
      window._enemyDetectionRangeMultiplier = 1.0;
    });
  }

  // ── Event: FOUND_CACHE ──────────────────────────────────────────────────────

  function _startFoundCache() {
    _active = true;
    _activeType = EVT_FOUND_CACHE;
    _logEvent('Supply cache discovered nearby!');

    var playerPos = _getPlayerPos();
    var cx = playerPos.x + _getRandOffset(12) + (Math.random() > 0.5 ? 8 : -8);
    var cz = playerPos.z + _getRandOffset(12) + (Math.random() > 0.5 ? 8 : -8);

    // Golden chest
    var geo = new THREE.BoxGeometry(0.8, 0.6, 0.6);
    var mat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    var chest = new THREE.Mesh(geo, mat);
    chest.position.set(cx, 0.3, cz);
    _addSceneObject(chest);

    // Beacon point light
    var light = new THREE.PointLight(0xffcc00, 2, 8);
    light.position.set(cx, 1.5, cz);
    _addSceneObject(light);

    _showToast('CACHE DISCOVERED — move to collect', '#ffcc00', 4);
    _showAlert('CACHE DISCOVERED', '#ffcc00', 3);

    var cachePos = new THREE.Vector3(cx, 0, cz);
    var collected = false;
    var pulseT = 0;

    var collectCheck = null;

    function checkCollect() {
      if (collected) return;
      var pPos = _getPlayerPos();
      var dist = _dist2D(pPos, cachePos);
      if (dist <= 1.5) {
        collected = true;
        // Collect rewards
        if (window.playerHealth !== undefined) {
          window.playerHealth = Math.min((window.playerMaxHealth || 100), window.playerHealth + 50);
        }
        if (window.playerAmmo !== undefined) {
          window.playerAmmo = window.playerMaxAmmo || 100;
        }
        if (window.score !== undefined) window.score += 100;
        if (window.playerScore !== undefined) window.playerScore += 100;

        _showToast('CACHE COLLECTED! +50 HP  +Ammo  +100 Score', '#ffcc00', 3);
        _playTone(880, 0.3, 0.3);
        _playTone(1100, 0.3, 0.3);

        _clearSceneObjects();
        clearInterval(collectCheck);
        setTimeout(_endEvent, 1500);
      }
    }

    collectCheck = setInterval(checkCollect, 200);

    // Expire after 30s if not collected
    var expireTimeout = setTimeout(function () {
      if (!collected) {
        clearInterval(collectCheck);
        _clearSceneObjects();
        _showToast('Cache expired', '#888888', 2);
        _endEvent();
      }
    }, 30000);

    _cleanupFns.push(function () {
      clearInterval(collectCheck);
      clearTimeout(expireTimeout);
    });
  }

  // ── HUD indicator helpers ───────────────────────────────────────────────────

  function _createHUDIndicator(text, color) {
    _ensureHUD();
    var el = document.createElement('div');
    el.style.cssText = [
      'position:absolute',
      'top:12px',
      'right:180px',
      'background:rgba(0,0,0,0.7)',
      'color:' + (color || '#fff'),
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'padding:5px 12px',
      'border-radius:3px',
      'border:1px solid ' + (color || '#fff'),
      'letter-spacing:2px'
    ].join(';');
    el.textContent = text;
    _hudEl.appendChild(el);
    return el;
  }

  function _clearHUDIndicator(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  // ── Event queue & scheduling ────────────────────────────────────────────────

  function _scheduleNext() {
    _countdown = 30 + Math.random() * 30; // 30-60 seconds
  }

  function _endEvent() {
    // Run all cleanup functions
    for (var i = 0; i < _cleanupFns.length; i++) {
      try { _cleanupFns[i](); } catch (e) {}
    }
    _cleanupFns = [];
    _clearSceneObjects();

    _active = false;
    _activeType = null;

    // Drain queue or schedule next
    if (_eventQueue.length > 0) {
      var next = _eventQueue.shift();
      setTimeout(function () { _fireEvent(next); }, 2000);
    } else {
      _scheduleNext();
    }
  }

  function _fireEvent(type) {
    if (_active) {
      // Queue it
      _eventQueue.push(type);
      return;
    }
    switch (type) {
      case EVT_MISSILE_STRIKE:     _startMissileStrike();    break;
      case EVT_FOG_OF_WAR:         _startFogOfWar();         break;
      case EVT_RADIO_INTERCEPT:    _startRadioIntercept();   break;
      case EVT_AMMO_SHORTAGE:      _startAmmoShortage();     break;
      case EVT_AIRSTRIKE_SUPPORT:  _startAirstrikeSupport(); break;
      case EVT_REINFORCEMENT_WAVE: _startReinforcementWave();break;
      case EVT_POWER_OUTAGE:       _startPowerOutage();      break;
      case EVT_FOUND_CACHE:        _startFoundCache();       break;
      default:
        _scheduleNext();
    }
  }

  function _pickRandomEvent() {
    return ALL_EVENT_TYPES[_randomInt(0, ALL_EVENT_TYPES.length - 1)];
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  function init(scene, camera) {
    _scene  = scene  || null;
    _camera = camera || null;
    _active = false;
    _activeType = null;
    _eventQueue = [];
    _eventLog = [];
    _cleanupFns = [];
    _sceneObjects = [];
    _aiStrikeArmed = false;
    _aiStrikeTarget = null;
    _aiStrikeCountdown = 0;

    _ensureHUD();
    _scheduleNext();
    _inited = true;
  }

  function update(dt) {
    if (!_inited) return;

    // Flash alert blink handled by its own interval; just track timer
    if (_alertTimer > 0) {
      _alertTimer -= dt;
      if (_alertTimer <= 0) {
        _alertTimer = 0;
        if (_alertEl) _alertEl.style.display = 'none';
      }
    }

    // Airstrike countdown
    if (_aiStrikeCountdown > 0 && _aiStrikeTarget) {
      _aiStrikeCountdown -= dt;
      if (_aiStrikeCountdown <= 0) {
        _aiStrikeCountdown = 0;
        var target = _aiStrikeTarget;
        _aiStrikeTarget = null;
        _executeAirstrike(target);
      }
    }

    // Ammo shortage enforcement
    if (window._ammoShortageActive && window.playerAmmo !== undefined) {
      var maxAmmo = window.playerMaxAmmo || 100;
      var cap = Math.floor(maxAmmo * 0.5);
      if (window.playerAmmo > cap) window.playerAmmo = cap;
    }

    // Countdown to next random event
    if (!_active && _countdown > 0) {
      _countdown -= dt;
      if (_countdown <= 0) {
        _countdown = 0;
        _fireEvent(_pickRandomEvent());
      }
    }
  }

  function triggerEvent(type) {
    _fireEvent(type || _pickRandomEvent());
  }

  function reset() {
    // Clean up active event
    for (var i = 0; i < _cleanupFns.length; i++) {
      try { _cleanupFns[i](); } catch (e) {}
    }
    _cleanupFns = [];
    _clearSceneObjects();

    _active = false;
    _activeType = null;
    _eventQueue = [];
    _eventLog = [];
    _aiStrikeArmed = false;
    _aiStrikeTarget = null;
    _aiStrikeCountdown = 0;

    window._fogDensity = 0;
    window._fogOfWarRange = null;
    window._ammoShortageActive = false;
    window._powerOutageActive = false;
    window._enemyDetectionRangeMultiplier = 1.0;
    window._interceptedEnemies = [];

    if (_alertEl) _alertEl.style.display = 'none';
    _alertTimer = 0;

    _scheduleNext();
  }

  return {
    init: init,
    update: update,
    triggerEvent: triggerEvent,
    reset: reset
  };

})();
