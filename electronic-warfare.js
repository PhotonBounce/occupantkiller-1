// electronic-warfare.js — Electronic Warfare module for Three.js FPS
// Features: EW spectrum analyzer console (E+W), signal jamming (J),
//           drone hacking (H), SIGINT intercepts, radar spoofing (Shift+J),
//           counter-EW effects, EW scoring.
// IIFE module — var only, no import/export.

window.ElectronicWarfare = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────────
  var JAMMER_RADIUS          = 25;      // units — jamming radius
  var JAMMER_BATTERY_TIME    = 30;      // seconds active per battery charge
  var JAMMER_RECHARGE_TIME   = 60;      // seconds to recharge
  var JAMMER_MAX_DEPLOYED    = 2;       // max simultaneous jammers
  var JAMMER_COLOR           = 0x556B2F; // OD green
  var JAMMER_BODY_RADIUS     = 0.2;
  var JAMMER_BODY_HEIGHT     = 3;
  var JAMMER_DIPOLE_W        = 0.06;
  var JAMMER_DIPOLE_H        = 0.06;
  var JAMMER_DIPOLE_L        = 1.4;
  var JAMMER_DIPOLE_Y_OFFSET = 0.3;    // below top of mast
  var JAMMER_RADAR_REDUCE    = 0.5;    // detection range ×0.5 when jammed

  var DRONE_HACK_RANGE       = 5;      // units
  var DRONE_HACK_TIME        = 4;      // seconds to hack
  var DRONE_FRIENDLY_TIME    = 20;     // seconds hacked drone stays friendly
  var DRONE_FRIENDLY_COLOR   = 0x00cc44;

  var SIGINT_INTERVAL        = 20;     // seconds between enemy intercepts
  var SIGINT_MESSAGES = [
    '[ENEMY COMMS] Grid 247: 3 vehicles moving east',
    '[ENEMY COMMS] Grid 531: Sniper team at building 4',
    '[ENEMY COMMS] Grid 389: Requesting ammo resupply',
    '[ENEMY COMMS] Grid 112: Two squads pushing north flank',
    '[ENEMY COMMS] Grid 764: Artillery prepping sector 7',
    '[ENEMY COMMS] Grid 903: Medic down, evac requested',
    '[ENEMY COMMS] Grid 425: Commander moving to rally point',
    '[ENEMY COMMS] Grid 618: IED placed on main road',
  ];

  var RADAR_SPOOF_DURATION   = 10;     // seconds spoof active
  var RADAR_SPOOF_COOLDOWN   = 45;     // seconds cooldown

  var SPECTRUM_BARS          = 32;     // canvas bars
  var SPECTRUM_CANVAS_W      = 320;
  var SPECTRUM_CANVAS_H      = 120;

  var EW_SCORE_INTERCEPT     = 50;
  var EW_SCORE_DRONE_HACK    = 100;
  var EW_SCORE_JAMMER_REINF  = 200;

  var COUNTER_EW_CHANCE      = 0.3;   // 30% per level
  var COMMS_DEGRADE_DELAY    = 2;     // seconds delay on buddy orders when jammed

  // ── State ─────────────────────────────────────────────────────────────────────
  var _scene        = null;
  var _camera       = null;

  // Keyboard
  var _keysDown     = {};
  var _prevKeys     = {};

  // EW Console (spectrum analyzer)
  var _consoleOpen  = false;
  var _consoleEl    = null;
  var _specCanvas   = null;
  var _specCtx      = null;
  var _specBars     = [];   // length SPECTRUM_BARS — each 0..1 amplitude
  var _logEl        = null;

  // Jammers
  var _jammers      = [];   // { mesh, pos, batteryTimer, rechargeTimer, active, group }
  var _jammerBattery = JAMMER_BATTERY_TIME;  // current deploy battery
  var _jammerRecharging = false;
  var _jammerRechargeTimer = 0;

  // Drone hacking
  var _hackTarget   = null;   // enemy drone object being hacked
  var _hackTimer    = 0;
  var _hackBarEl    = null;
  var _hackBarFillEl = null;
  var _hackActive   = false;

  // SIGINT
  var _sigintTimer  = SIGINT_INTERVAL;
  var _sigintMsgIdx = 0;

  // Radar spoof
  var _spoofActive  = false;
  var _spoofTimer   = 0;
  var _spoofCooldown = 0;
  var _spoofGhostMesh = null;
  var _spoofHudEl   = null;

  // Counter-EW
  var _counterEWActive = false;
  var _hudFlickerInterval = null;
  var _minimapWasVisible = true;

  // EW score
  var _ewScore = 0;

  // HUD root
  var _hudRoot = null;

  // Spectrum animation phase offsets
  var _specPhases = [];
  var _specSpeeds = [];
  var _specBaseAmps = [];

  // ── Utility ───────────────────────────────────────────────────────────────────
  function _dist3(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _playerPos() {
    if (_camera) return _camera.position;
    return new THREE.Vector3();
  }

  function _addEWScore(pts) {
    _ewScore += pts;
    if (typeof window._addScore === 'function') window._addScore(pts);
    _logMessage('+' + pts + ' EW pts');
  }

  // ── Build Jammer Antenna Mesh ──────────────────────────────────────────────────
  function _buildJammerMesh() {
    var group = new THREE.Group();

    // Mast — CylinderGeometry
    var mastGeo = new THREE.CylinderGeometry(
      JAMMER_BODY_RADIUS, JAMMER_BODY_RADIUS * 1.4, JAMMER_BODY_HEIGHT, 8
    );
    var mat = new THREE.MeshLambertMaterial({ color: JAMMER_COLOR });
    var mast = new THREE.Mesh(mastGeo, mat);
    mast.position.y = JAMMER_BODY_HEIGHT / 2;
    group.add(mast);

    // 4 dipole arms at top — BoxGeometry
    var dipoleGeo = new THREE.BoxGeometry(JAMMER_DIPOLE_L, JAMMER_DIPOLE_H, JAMMER_DIPOLE_W);
    var dipoleMat = new THREE.MeshLambertMaterial({ color: JAMMER_COLOR });

    var dipoleY = JAMMER_BODY_HEIGHT - JAMMER_DIPOLE_Y_OFFSET;

    var angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    var i;
    for (i = 0; i < 4; i++) {
      var dipole = new THREE.Mesh(dipoleGeo, dipoleMat);
      dipole.rotation.y = angles[i];
      dipole.position.y = dipoleY;
      group.add(dipole);
    }

    // Small blinking light on top
    var lightGeo = new THREE.SphereGeometry(0.08, 6, 6);
    var lightMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
    var lightMesh = new THREE.Mesh(lightGeo, lightMat);
    lightMesh.position.y = JAMMER_BODY_HEIGHT + 0.1;
    lightMesh.name = 'jammerLight';
    group.add(lightMesh);

    return group;
  }

  // ── Deploy Jammer ──────────────────────────────────────────────────────────────
  function _deployJammer() {
    if (_jammers.length >= JAMMER_MAX_DEPLOYED) {
      _logMessage('[EW] Max jammers deployed (' + JAMMER_MAX_DEPLOYED + ')');
      return;
    }
    if (_jammerRecharging) {
      var remaining = Math.ceil(_jammerRechargeTimer);
      _logMessage('[EW] Jammer recharging: ' + remaining + 's');
      return;
    }

    var pos = _playerPos().clone();
    pos.y = 0; // ground level

    var group = _buildJammerMesh();
    group.position.copy(pos);
    _scene.add(group);

    var jammer = {
      group: group,
      pos: pos.clone(),
      batteryTimer: JAMMER_BATTERY_TIME,
      active: true,
      rechargeTimer: 0,
    };
    _jammers.push(jammer);

    _jammerRecharging = true;
    _jammerRechargeTimer = JAMMER_RECHARGE_TIME;

    _logMessage('[EW] Jammer deployed — radius ' + JAMMER_RADIUS + 'm, battery ' + JAMMER_BATTERY_TIME + 's');
    _addEWScore(EW_SCORE_JAMMER_REINF);
  }

  // ── Jammer update ──────────────────────────────────────────────────────────────
  function _updateJammers(dt) {
    // Recharge timer
    if (_jammerRecharging) {
      _jammerRechargeTimer -= dt;
      if (_jammerRechargeTimer <= 0) {
        _jammerRecharging = false;
        _jammerRechargeTimer = 0;
        _logMessage('[EW] Jammer battery recharged');
      }
    }

    var i;
    var toRemove = [];
    for (i = 0; i < _jammers.length; i++) {
      var j = _jammers[i];
      if (!j.active) continue;

      j.batteryTimer -= dt;
      if (j.batteryTimer <= 0) {
        j.active = false;
        _logMessage('[EW] Jammer battery depleted — removing');
        _scene.remove(j.group);
        toRemove.push(i);
        continue;
      }

      // Blink the warning light
      var light = j.group.getObjectByName('jammerLight');
      if (light) {
        light.visible = (Math.floor(Date.now() / 400) % 2 === 0);
      }

      // Effect: drop enemy drones in range
      _applyJammerEffects(j);
    }

    // Prune removed
    for (i = toRemove.length - 1; i >= 0; i--) {
      _jammers.splice(toRemove[i], 1);
    }
  }

  // Apply jammer effect to world entities
  function _applyJammerEffects(jammer) {
    // Enemy drones — drop from sky if in range
    var drones = window._enemyDrones || [];
    var i;
    for (i = 0; i < drones.length; i++) {
      var d = drones[i];
      if (!d || !d.position) continue;
      if (_dist3(jammer.pos, d.position) < JAMMER_RADIUS) {
        // Signal jammer disabled — drone falls
        if (d.velocity) {
          d.velocity.y = -5;
        }
        if (d.jammed !== true) {
          d.jammed = true;
          _logMessage('[EW] Enemy drone jammed — falling');
        }
      }
    }

    // Enemy comms — mark nearby enemies as radio-jammed (no reinforcement calls)
    var enemies = window._enemies || [];
    for (i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.position) continue;
      if (_dist3(jammer.pos, e.position) < JAMMER_RADIUS) {
        e.radioJammed = true;
        e.radarRange = (e.baseRadarRange || 30) * JAMMER_RADAR_REDUCE;
      } else {
        // Restore if out of range
        if (e.radioJammed) {
          e.radioJammed = false;
          e.radarRange = e.baseRadarRange || 30;
        }
      }
    }
  }

  // ── Drone Hacking ─────────────────────────────────────────────────────────────
  function _startDroneHack() {
    if (_hackActive) return;
    // Find nearest enemy drone within range
    var drones = window._enemyDrones || [];
    var nearest = null;
    var nearestDist = DRONE_HACK_RANGE + 1;
    var pp = _playerPos();
    var i;
    for (i = 0; i < drones.length; i++) {
      var d = drones[i];
      if (!d || !d.position || d.hacked) continue;
      var dist = _dist3(pp, d.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = d;
      }
    }

    if (!nearest) {
      _logMessage('[EW] No enemy drone in hack range (' + DRONE_HACK_RANGE + 'm)');
      return;
    }

    _hackTarget = nearest;
    _hackTimer = 0;
    _hackActive = true;
    _showHackBar(true);
    _logMessage('[EW] Hacking drone... hold H for ' + DRONE_HACK_TIME + 's');
  }

  function _completeDroneHack() {
    if (!_hackTarget) return;
    _hackTarget.hacked = true;
    _hackTarget.friendlyTimer = DRONE_FRIENDLY_TIME;
    _hackTarget.faction = 'friendly';

    // Recolor mesh to green
    var mesh = _hackTarget.mesh || _hackTarget;
    if (mesh && mesh.traverse) {
      mesh.traverse(function (child) {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.color.setHex(DRONE_FRIENDLY_COLOR);
        }
      });
    }

    _logMessage('[EW] Drone HACKED — friendly for ' + DRONE_FRIENDLY_TIME + 's!');
    _addEWScore(EW_SCORE_DRONE_HACK);
    _hackActive = false;
    _hackTarget = null;
    _hackTimer = 0;
    _showHackBar(false);
  }

  function _cancelDroneHack() {
    _hackActive = false;
    _hackTarget = null;
    _hackTimer = 0;
    _showHackBar(false);
  }

  function _updateDroneHacking(dt) {
    if (!_hackActive) return;

    // Check if H still held
    if (!_keysDown['h'] && !_keysDown['H']) {
      _cancelDroneHack();
      return;
    }

    // Check target still in range
    if (_hackTarget) {
      var dist = _dist3(_playerPos(), _hackTarget.position || new THREE.Vector3());
      if (dist > DRONE_HACK_RANGE * 1.2) {
        _logMessage('[EW] Drone moved out of hack range');
        _cancelDroneHack();
        return;
      }
    }

    _hackTimer += dt;
    var progress = Math.min(_hackTimer / DRONE_HACK_TIME, 1);

    // Update progress bar
    if (_hackBarFillEl) {
      _hackBarFillEl.style.width = Math.round(progress * 100) + '%';
    }

    if (_hackTimer >= DRONE_HACK_TIME) {
      _completeDroneHack();
    }
  }

  // Update friendly timer on hacked drones
  function _updateHackedDrones(dt) {
    var drones = window._enemyDrones || [];
    var i;
    for (i = 0; i < drones.length; i++) {
      var d = drones[i];
      if (!d || !d.hacked) continue;
      d.friendlyTimer -= dt;
      if (d.friendlyTimer <= 0) {
        d.hacked = false;
        d.faction = 'enemy';
        // Recolor back to default
        var mesh = d.mesh || d;
        if (mesh && mesh.traverse) {
          mesh.traverse(function (child) {
            if (child.isMesh && child.material) {
              child.material = child.material.clone();
              child.material.color.setHex(0xcc2200);
            }
          });
        }
      }
    }
  }

  // ── SIGINT Intercepts ──────────────────────────────────────────────────────────
  function _updateSIGINT(dt) {
    _sigintTimer -= dt;
    if (_sigintTimer <= 0) {
      _sigintTimer = SIGINT_INTERVAL;
      var msg = SIGINT_MESSAGES[_sigintMsgIdx % SIGINT_MESSAGES.length];
      _sigintMsgIdx++;
      _flashIntercept(msg);
      _addEWScore(EW_SCORE_INTERCEPT);
    }
  }

  function _flashIntercept(msg) {
    _logMessage(msg, 'yellow');
    // Flash the spectrum canvas yellow
    if (_specCtx) {
      _specCtx.fillStyle = 'rgba(255, 220, 0, 0.25)';
      _specCtx.fillRect(0, 0, SPECTRUM_CANVAS_W, SPECTRUM_CANVAS_H);
    }
  }

  // ── Radar Spoofing ────────────────────────────────────────────────────────────
  function _activateRadarSpoof() {
    if (_spoofActive) return;
    if (_spoofCooldown > 0) {
      _logMessage('[EW] Radar spoof cooling down: ' + Math.ceil(_spoofCooldown) + 's');
      return;
    }

    _spoofActive = true;
    _spoofTimer = RADAR_SPOOF_DURATION;
    _spoofCooldown = RADAR_SPOOF_COOLDOWN;

    // Create a ghost "vehicle" mesh at player position
    var vehicleGeo = new THREE.BoxGeometry(2.5, 1.2, 4.5);
    var vehicleMat = new THREE.MeshLambertMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.35,
    });
    _spoofGhostMesh = new THREE.Mesh(vehicleGeo, vehicleMat);
    _spoofGhostMesh.position.copy(_playerPos());
    _spoofGhostMesh.position.y = 0.6;
    _scene.add(_spoofGhostMesh);

    // Mark enemies as targeting spoof position
    window._radarSpoofActive = true;
    window._radarSpoofPos = _spoofGhostMesh.position.clone();

    _showSpoofHud(true);
    _logMessage('[EW] Radar spoof ACTIVE — appearing as vehicle for ' + RADAR_SPOOF_DURATION + 's');
  }

  function _deactivateRadarSpoof() {
    _spoofActive = false;
    if (_spoofGhostMesh) {
      _scene.remove(_spoofGhostMesh);
      _spoofGhostMesh = null;
    }
    window._radarSpoofActive = false;
    _showSpoofHud(false);
    _logMessage('[EW] Radar spoof ended');
  }

  function _updateRadarSpoof(dt) {
    if (_spoofCooldown > 0) {
      _spoofCooldown -= dt;
      if (_spoofCooldown < 0) _spoofCooldown = 0;
    }

    if (!_spoofActive) return;
    _spoofTimer -= dt;

    // Drift ghost mesh slightly for realism
    if (_spoofGhostMesh) {
      _spoofGhostMesh.position.x += Math.sin(Date.now() * 0.001) * 0.02;
      _spoofGhostMesh.position.z += Math.cos(Date.now() * 0.0013) * 0.02;
    }

    if (_spoofTimer <= 0) {
      _deactivateRadarSpoof();
    }
  }

  // ── Counter-EW ────────────────────────────────────────────────────────────────
  function _applyCounterEW() {
    _counterEWActive = true;
    _logMessage('[EW] WARNING: Enemy EW asset detected — comms degraded!', 'red');

    // Disable minimap
    var minimap = document.getElementById('minimap');
    if (minimap) {
      _minimapWasVisible = (minimap.style.display !== 'none');
      minimap.style.display = 'none';
    }

    // HUD flicker effect
    var hud = document.getElementById('hud') || document.getElementById('gameHUD');
    if (hud && !_hudFlickerInterval) {
      _hudFlickerInterval = setInterval(function () {
        if (!_counterEWActive) {
          clearInterval(_hudFlickerInterval);
          _hudFlickerInterval = null;
          hud.style.opacity = '1';
          return;
        }
        hud.style.opacity = (Math.random() > 0.3) ? '1' : '0.4';
      }, 150);
    }

    // Delay buddy orders
    window._buddyOrderDelay = COMMS_DEGRADE_DELAY;
  }

  function _removeCounterEW() {
    _counterEWActive = false;
    if (_hudFlickerInterval) {
      clearInterval(_hudFlickerInterval);
      _hudFlickerInterval = null;
    }

    var hud = document.getElementById('hud') || document.getElementById('gameHUD');
    if (hud) hud.style.opacity = '1';

    var minimap = document.getElementById('minimap');
    if (minimap && _minimapWasVisible) {
      minimap.style.display = '';
    }

    window._buddyOrderDelay = 0;
  }

  // ── Spectrum Analyzer Canvas ───────────────────────────────────────────────────
  function _initSpectrum() {
    var i;
    for (i = 0; i < SPECTRUM_BARS; i++) {
      _specBars[i] = Math.random() * 0.3 + 0.05;
      _specPhases[i] = Math.random() * Math.PI * 2;
      _specSpeeds[i] = 1.5 + Math.random() * 3;
      _specBaseAmps[i] = 0.1 + Math.random() * 0.35;
    }
  }

  function _updateSpectrum(dt) {
    var t = Date.now() * 0.001;
    var i;
    for (i = 0; i < SPECTRUM_BARS; i++) {
      // Base sine wave + noise
      var noise = (Math.random() - 0.5) * 0.08;
      _specBars[i] = _specBaseAmps[i]
        + Math.abs(Math.sin(t * _specSpeeds[i] + _specPhases[i])) * 0.45
        + noise;
      if (_specBars[i] > 1) _specBars[i] = 1;
      if (_specBars[i] < 0.02) _specBars[i] = 0.02;
    }
  }

  function _drawSpectrum() {
    if (!_specCtx || !_consoleOpen) return;
    var ctx = _specCtx;
    var w = SPECTRUM_CANVAS_W;
    var h = SPECTRUM_CANVAS_H;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#0a0f0a';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#1a2e1a';
    ctx.lineWidth = 1;
    var gi;
    for (gi = 0; gi < 4; gi++) {
      var gy = Math.round(h * (gi + 1) / 5);
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    var barW = Math.floor(w / SPECTRUM_BARS);
    var i;
    var pp = _playerPos();

    for (i = 0; i < SPECTRUM_BARS; i++) {
      var barH = Math.floor(_specBars[i] * (h - 4));
      var x = i * barW;
      var y = h - barH - 2;

      // Determine color based on band type
      // Lower quarter = friendly (blue), upper quarter = jammed hostile (red), rest = green
      var color;
      var isHostileBand = (i >= 24); // upper 8 bars = hostile freqs
      var isFriendlyBand = (i < 8);  // lower 8 bars = friendly freqs

      // Check if jammer covers this area
      var jammed = false;
      var ji;
      for (ji = 0; ji < _jammers.length; ji++) {
        if (_jammers[ji].active && _dist3(_jammers[ji].pos, pp) < JAMMER_RADIUS * 1.5) {
          jammed = true;
          break;
        }
      }

      if (isFriendlyBand) {
        // Friendly frequencies — blue
        color = '#2277ff';
      } else if (isHostileBand && jammed) {
        // Jammed hostile — red
        color = '#ff2222';
      } else if (isHostileBand) {
        // Active hostile — orange-red
        color = '#ff6622';
      } else {
        // Neutral — dark green
        color = '#22aa44';
      }

      // Gradient fill
      var grad = ctx.createLinearGradient(0, y, 0, h);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'rgba(0,0,0,0.3)');
      ctx.fillStyle = grad;
      ctx.fillRect(x + 1, y, barW - 2, barH);

      // Top cap
      ctx.fillStyle = '#ffffff33';
      ctx.fillRect(x + 1, y, barW - 2, 2);
    }

    // Frequency label
    ctx.fillStyle = '#44ff66';
    ctx.font = '10px monospace';
    ctx.fillText('MHz  30        100       300      1000      3000', 4, h - 4);
  }

  // ── EW Console DOM ────────────────────────────────────────────────────────────
  function _buildConsole() {
    if (_consoleEl) return;

    _consoleEl = document.createElement('div');
    _consoleEl.id = 'ew-console';
    _consoleEl.style.cssText = [
      'position:fixed',
      'top:80px',
      'right:20px',
      'width:340px',
      'background:rgba(5,15,5,0.93)',
      'border:1px solid #33aa44',
      'border-radius:4px',
      'padding:10px',
      'font-family:monospace',
      'font-size:12px',
      'color:#44ff66',
      'z-index:9900',
      'display:none',
      'user-select:none',
    ].join(';');

    // Title bar
    var title = document.createElement('div');
    title.style.cssText = 'font-size:13px;font-weight:bold;margin-bottom:6px;color:#88ffaa;letter-spacing:1px;';
    title.textContent = '[ EW SPECTRUM ANALYZER ]';
    _consoleEl.appendChild(title);

    // Spectrum canvas
    _specCanvas = document.createElement('canvas');
    _specCanvas.width = SPECTRUM_CANVAS_W;
    _specCanvas.height = SPECTRUM_CANVAS_H;
    _specCanvas.style.cssText = 'width:100%;height:auto;display:block;border:1px solid #224422;margin-bottom:6px;';
    _consoleEl.appendChild(_specCanvas);
    _specCtx = _specCanvas.getContext('2d');

    // Legend
    var legend = document.createElement('div');
    legend.style.cssText = 'font-size:10px;margin-bottom:6px;color:#aaa;';
    legend.innerHTML = [
      '<span style="color:#2277ff">&#9632;</span> Friendly',
      '&nbsp;&nbsp;',
      '<span style="color:#22aa44">&#9632;</span> Neutral',
      '&nbsp;&nbsp;',
      '<span style="color:#ff6622">&#9632;</span> Hostile',
      '&nbsp;&nbsp;',
      '<span style="color:#ff2222">&#9632;</span> Jammed',
    ].join('');
    _consoleEl.appendChild(legend);

    // Status line
    var statusEl = document.createElement('div');
    statusEl.id = 'ew-status';
    statusEl.style.cssText = 'font-size:11px;color:#aaffaa;margin-bottom:6px;';
    statusEl.textContent = 'JAMMERS: 0/' + JAMMER_MAX_DEPLOYED + '   SPOOF: READY   SCORE: 0';
    _consoleEl.appendChild(statusEl);

    // Separator
    var sep = document.createElement('div');
    sep.style.cssText = 'border-top:1px solid #224422;margin:4px 0;';
    _consoleEl.appendChild(sep);

    // Log pane
    _logEl = document.createElement('div');
    _logEl.style.cssText = [
      'height:120px',
      'overflow-y:auto',
      'font-size:11px',
      'color:#88ffaa',
      'background:rgba(0,0,0,0.3)',
      'padding:4px',
      'border-radius:2px',
    ].join(';');
    _consoleEl.appendChild(_logEl);

    // Keybind hint
    var hint = document.createElement('div');
    hint.style.cssText = 'font-size:10px;color:#556655;margin-top:6px;';
    hint.textContent = '[J] Deploy Jammer  [H] Hack Drone  [Shift+J] Radar Spoof  [E+W] Close';
    _consoleEl.appendChild(hint);

    document.body.appendChild(_consoleEl);
  }

  function _buildHackBar() {
    if (_hackBarEl) return;

    _hackBarEl = document.createElement('div');
    _hackBarEl.style.cssText = [
      'position:fixed',
      'bottom:120px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:200px',
      'background:rgba(0,0,0,0.75)',
      'border:1px solid #00cc44',
      'border-radius:3px',
      'padding:6px',
      'font-family:monospace',
      'font-size:12px',
      'color:#00ff55',
      'text-align:center',
      'z-index:9901',
      'display:none',
    ].join(';');

    var label = document.createElement('div');
    label.textContent = 'HACKING DRONE...';
    label.style.marginBottom = '4px';
    _hackBarEl.appendChild(label);

    var track = document.createElement('div');
    track.style.cssText = 'background:#112211;height:10px;border-radius:2px;overflow:hidden;';

    _hackBarFillEl = document.createElement('div');
    _hackBarFillEl.style.cssText = 'height:100%;width:0%;background:#00ff55;transition:width 0.1s linear;';
    track.appendChild(_hackBarFillEl);
    _hackBarEl.appendChild(track);

    document.body.appendChild(_hackBarEl);
  }

  function _buildSpoofHud() {
    if (_spoofHudEl) return;
    _spoofHudEl = document.createElement('div');
    _spoofHudEl.style.cssText = [
      'position:fixed',
      'top:50px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,80,200,0.75)',
      'border:1px solid #4499ff',
      'border-radius:3px',
      'padding:5px 14px',
      'font-family:monospace',
      'font-size:13px',
      'color:#aaddff',
      'text-align:center',
      'z-index:9901',
      'display:none',
      'letter-spacing:1px',
    ].join(';');
    _spoofHudEl.textContent = 'RADAR SPOOF ACTIVE';
    document.body.appendChild(_spoofHudEl);
  }

  function _showHackBar(visible) {
    if (_hackBarEl) _hackBarEl.style.display = visible ? 'block' : 'none';
  }

  function _showSpoofHud(visible) {
    if (_spoofHudEl) _spoofHudEl.style.display = visible ? 'block' : 'none';
  }

  function _openConsole() {
    if (!_consoleEl) return;
    _consoleEl.style.display = 'block';
    _consoleOpen = true;
  }

  function _closeConsole() {
    if (!_consoleEl) return;
    _consoleEl.style.display = 'none';
    _consoleOpen = false;
  }

  function _toggleConsole() {
    if (_consoleOpen) _closeConsole(); else _openConsole();
  }

  function _logMessage(msg, color) {
    if (!_logEl) return;
    var line = document.createElement('div');
    line.style.color = color || '#88ffaa';
    line.textContent = msg;
    _logEl.appendChild(line);
    // Auto-scroll
    _logEl.scrollTop = _logEl.scrollHeight;
    // Trim old lines
    while (_logEl.children.length > 60) {
      _logEl.removeChild(_logEl.children[0]);
    }
  }

  function _updateStatusLine() {
    var statusEl = document.getElementById('ew-status');
    if (!statusEl) return;
    var spoofStr = _spoofActive
      ? 'ACTIVE ' + Math.ceil(_spoofTimer) + 's'
      : (_spoofCooldown > 0 ? 'CD ' + Math.ceil(_spoofCooldown) + 's' : 'READY');
    var jamCount = _jammers.filter(function (j) { return j.active; }).length;
    statusEl.textContent = [
      'JAMMERS: ' + jamCount + '/' + JAMMER_MAX_DEPLOYED,
      'SPOOF: ' + spoofStr,
      'SCORE: ' + _ewScore,
    ].join('   ');
  }

  // ── Key Handling ──────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    _keysDown[e.key] = true;
  }

  function _onKeyUp(e) {
    _keysDown[e.key] = false;
  }

  function _checkKeyCombo(a, b) {
    return (_keysDown[a] || _keysDown[a.toLowerCase()] || _keysDown[a.toUpperCase()])
        && (_keysDown[b] || _keysDown[b.toLowerCase()] || _keysDown[b.toUpperCase()]);
  }

  function _keyJustPressed(key) {
    return (_keysDown[key] || _keysDown[key.toLowerCase()] || _keysDown[key.toUpperCase()])
        && !(_prevKeys[key] || _prevKeys[key.toLowerCase()] || _prevKeys[key.toUpperCase()]);
  }

  function _processKeys() {
    // E+W — toggle EW console
    if (_checkKeyCombo('e', 'w') && !(_prevKeys['e'] && _prevKeys['w'])
        && !(_prevKeys['E'] && _prevKeys['W'])) {
      _toggleConsole();
    }

    // J — deploy jammer (only if Shift not held)
    if (_keyJustPressed('j') && !_keysDown['Shift']) {
      _deployJammer();
    }

    // Shift+J — radar spoof
    if ((_keysDown['Shift'] || _keysDown['ShiftLeft'] || _keysDown['ShiftRight'])
        && _keyJustPressed('j')) {
      _activateRadarSpoof();
    }

    // H — drone hacking (start on press, cancel on release)
    if (_keyJustPressed('h')) {
      _startDroneHack();
    }

    // Save prev state
    var key;
    for (key in _keysDown) {
      _prevKeys[key] = _keysDown[key];
    }
  }

  // ── Build HUD container ───────────────────────────────────────────────────────
  function _buildHUD() {
    _hudRoot = document.createElement('div');
    _hudRoot.id = 'ew-hud-root';
    document.body.appendChild(_hudRoot);
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init(scene, camera, options) {
    _scene  = scene;
    _camera = camera;

    options = options || {};

    // Reset state
    _jammers = [];
    _jammerRecharging = false;
    _jammerRechargeTimer = 0;
    _hackTarget = null;
    _hackTimer = 0;
    _hackActive = false;
    _sigintTimer = SIGINT_INTERVAL;
    _sigintMsgIdx = Math.floor(Math.random() * SIGINT_MESSAGES.length);
    _spoofActive = false;
    _spoofTimer = 0;
    _spoofCooldown = 0;
    _ewScore = 0;
    _keysDown = {};
    _prevKeys = {};
    _consoleOpen = false;
    _counterEWActive = false;

    // Counter-EW — random chance per level
    if (Math.random() < COUNTER_EW_CHANCE) {
      // Delay slightly so player sees it mid-game
      var startDelay = 15 + Math.random() * 30;
      var _counterEWTimeout = setTimeout(function () {
        _applyCounterEW();
      }, startDelay * 1000);
      // Store for reset cleanup
      window._ewCounterTimeout = _counterEWTimeout;
    }

    _buildHUD();
    _buildConsole();
    _buildHackBar();
    _buildSpoofHud();
    _initSpectrum();

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup', _onKeyUp);

    _logMessage('[EW] Electronic Warfare system online');
    _logMessage('[EW] Keys: E+W=console, J=jammer, Shift+J=spoof, H=hack drone');
  }

  // ── Update (call every frame) ─────────────────────────────────────────────────
  function update(dt) {
    if (!_scene) return;
    dt = dt || 0.016;

    _processKeys();
    _updateJammers(dt);
    _updateDroneHacking(dt);
    _updateHackedDrones(dt);
    _updateSIGINT(dt);
    _updateRadarSpoof(dt);
    _updateSpectrum(dt);
    _drawSpectrum();
    _updateStatusLine();
  }

  // ── Reset ─────────────────────────────────────────────────────────────────────
  function reset() {
    // Remove jammers from scene
    var i;
    for (i = 0; i < _jammers.length; i++) {
      if (_jammers[i].group) _scene.remove(_jammers[i].group);
    }
    _jammers = [];

    // Remove spoof mesh
    if (_spoofGhostMesh) {
      _scene.remove(_spoofGhostMesh);
      _spoofGhostMesh = null;
    }

    _cancelDroneHack();
    _removeCounterEW();

    // Clear counter-EW timeout
    if (window._ewCounterTimeout) {
      clearTimeout(window._ewCounterTimeout);
      window._ewCounterTimeout = null;
    }

    // Remove DOM elements
    if (_consoleEl) {
      _consoleEl.parentNode && _consoleEl.parentNode.removeChild(_consoleEl);
      _consoleEl = null;
      _specCanvas = null;
      _specCtx = null;
      _logEl = null;
    }
    if (_hackBarEl) {
      _hackBarEl.parentNode && _hackBarEl.parentNode.removeChild(_hackBarEl);
      _hackBarEl = null;
      _hackBarFillEl = null;
    }
    if (_spoofHudEl) {
      _spoofHudEl.parentNode && _spoofHudEl.parentNode.removeChild(_spoofHudEl);
      _spoofHudEl = null;
    }
    if (_hudRoot) {
      _hudRoot.parentNode && _hudRoot.parentNode.removeChild(_hudRoot);
      _hudRoot = null;
    }

    window.removeEventListener('keydown', _onKeyDown);
    window.removeEventListener('keyup', _onKeyUp);

    window._radarSpoofActive = false;
    window._buddyOrderDelay = 0;

    _ewScore = 0;
    _consoleOpen = false;
    _scene = null;
    _camera = null;
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    reset: reset,
  };

}());
