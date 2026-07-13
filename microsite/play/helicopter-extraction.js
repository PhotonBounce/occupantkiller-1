/* ─────────────────────────────────────────────────────────────────────────────
   HELICOPTER EXTRACTION — dramatic end-of-wave extraction event
   Phases: Inbound (10s) → Hovering (5s) → Extraction (3s / 8s timeout)
   Fallback: auto-trigger mission complete after 18s total.
   ───────────────────────────────────────────────────────────────────────────── */
window.HelicopterExtraction = (function () {
  'use strict';

  /* ── State ──────────────────────────────────────────────────────────────── */
  var _scene = null;
  var _camera = null;
  var _active = false;
  var _phase = 0; // 0=idle, 1=inbound, 2=hovering, 3=extraction
  var _phaseTimer = 0;
  var _totalTimer = 0;
  var _extractionTriggered = false;
  var _missionCompleteTriggered = false;

  /* ── Helicopter group and parts ─────────────────────────────────────────── */
  var _heliGroup = null;
  var _rotorTop = null;
  var _rotorTail = null;
  var _searchLight = null;
  var _searchLightTarget = null;

  /* ── VFX ────────────────────────────────────────────────────────────────── */
  var _dustParticles = [];
  var _smokeGrenade = null;
  var _lzRing = null;

  /* ── HUD elements ───────────────────────────────────────────────────────── */
  var _hudMsg = null;
  var _lzDistEl = null;
  var _flashInterval = null;

  /* ── Audio ──────────────────────────────────────────────────────────────── */
  var _rotorSource = null;

  /* ────────────────────────────────────────────────────────────────────────
     PUBLIC API
   ──────────────────────────────────────────────────────────────────────── */

  function init(scene, camera) {
    _scene = scene;
    _camera = camera || (window.GameManager && window.GameManager.getCamera && window.GameManager.getCamera()) || null;
    reset();
  }

  function trigger(opts) {
    if (_active) return;
    _active = true;
    _phase = 1;
    _phaseTimer = 0;
    _totalTimer = 0;
    _extractionTriggered = false;
    _missionCompleteTriggered = false;

    _buildHelicopter();
    _buildLZRing();
    _buildHUD();
    _startPhaseInbound();
  }

  function update(dt) {
    if (!_active) return;

    _totalTimer += dt;
    _phaseTimer += dt;

    // Animate rotors
    if (_rotorTop) _rotorTop.rotation.y += dt * 18;
    if (_rotorTail) _rotorTail.rotation.x += dt * 22;

    // Animate search light sweep
    if (_searchLight && _heliGroup) {
      var sweep = Math.sin(_totalTimer * 0.8) * 6;
      _searchLight.target.position.set(sweep, 0, 2);
      _searchLight.target.updateMatrixWorld();
    }

    // Per-phase update
    if (_phase === 1) _updateInbound(dt);
    else if (_phase === 2) _updateHovering(dt);
    else if (_phase === 3) _updateExtraction(dt);

    // Update LZ distance in HUD
    _updateLZDistance();

    // Fallback: 18s total → force mission complete
    if (_totalTimer >= 18 && !_missionCompleteTriggered) {
      _forceMissionComplete('auto-fallback');
    }
  }

  function reset() {
    _active = false;
    _phase = 0;
    _phaseTimer = 0;
    _totalTimer = 0;
    _extractionTriggered = false;
    _missionCompleteTriggered = false;

    // Remove helicopter from scene
    if (_heliGroup && _scene) {
      _scene.remove(_heliGroup);
    }
    _heliGroup = null;
    _rotorTop = null;
    _rotorTail = null;

    // Remove search light
    if (_searchLight && _scene) {
      _scene.remove(_searchLight);
      _scene.remove(_searchLight.target);
    }
    _searchLight = null;
    _searchLightTarget = null;

    // Remove dust particles
    for (var i = 0; i < _dustParticles.length; i++) {
      if (_dustParticles[i] && _scene) _scene.remove(_dustParticles[i]);
    }
    _dustParticles = [];

    // Remove smoke grenade
    if (_smokeGrenade && _scene) _scene.remove(_smokeGrenade);
    _smokeGrenade = null;

    // Remove LZ ring
    if (_lzRing && _scene) _scene.remove(_lzRing);
    _lzRing = null;

    // Remove HUD
    _removeHUD();

    // Stop rotor audio
    _stopRotorSound();
  }

  /* ────────────────────────────────────────────────────────────────────────
     PHASE 1: INBOUND (10s)
   ──────────────────────────────────────────────────────────────────────── */

  function _startPhaseInbound() {
    // Play helicopter sound
    if (window.AudioSystem && window.AudioSystem.playHelicopterRotor) {
      window.AudioSystem.playHelicopterRotor();
    } else {
      _playRotorDrone();
    }

    // Radio crackle on approach
    if (window.AudioSystem && window.AudioSystem.playRadioChatter) {
      window.AudioSystem.playRadioChatter();
    }

    // HUD message
    _showHUDMessage('🚁 EXTRACTION INBOUND — 10s', '#00ff44', true);

    // Position helicopter at start: X=80, Y=20, Z=0
    if (_heliGroup) {
      _heliGroup.position.set(80, 20, 0);
    }
  }

  function _updateInbound(dt) {
    var progress = Math.min(_phaseTimer / 10, 1);

    // Fly from (80, 20, 0) toward (0, 8, 0) linearly
    if (_heliGroup) {
      _heliGroup.position.x = 80 * (1 - progress);
      _heliGroup.position.y = 20 + (8 - 20) * progress; // 20 → 8
      _heliGroup.position.z = 0;

      // Tilt forward during approach
      _heliGroup.rotation.z = -0.15 * (1 - progress);
    }

    // Update countdown in HUD
    var remaining = Math.max(0, Math.ceil(10 - _phaseTimer));
    _updateHUDText('🚁 EXTRACTION INBOUND — ' + remaining + 's');

    // Phase transition
    if (_phaseTimer >= 10) {
      _phase = 2;
      _phaseTimer = 0;
      _startPhaseHovering();
    }
  }

  /* ────────────────────────────────────────────────────────────────────────
     PHASE 2: HOVERING (5s)
   ──────────────────────────────────────────────────────────────────────── */

  function _startPhaseHovering() {
    _showHUDMessage('🚁 EXTRACT NOW — RUN TO LZ', '#00ff44', true);

    // Show LZ ring on ground
    if (_lzRing) _lzRing.visible = true;

    // Build rotor wash dust particles
    _buildDustParticles();

    // Drop green smoke grenade
    _dropSmokeGrenade();
  }

  function _updateHovering(dt) {
    // Gentle bob animation ±0.1 on Y
    if (_heliGroup) {
      _heliGroup.position.x = 0;
      _heliGroup.position.y = 8 + Math.sin(_totalTimer * 2.5) * 0.1;
      _heliGroup.position.z = 0;
      _heliGroup.rotation.z = 0;
    }

    // Animate smoke grenade falling
    if (_smokeGrenade && _smokeGrenade.position.y > 0) {
      _smokeGrenade.position.y -= dt * 4;
      if (_smokeGrenade.position.y < 0) _smokeGrenade.position.y = 0;
    }

    // Animate dust particles radiating outward
    for (var i = 0; i < _dustParticles.length; i++) {
      var p = _dustParticles[i];
      if (!p || !p.userData) continue;
      var ud = p.userData;
      ud.t = (ud.t || 0) + dt;
      var frac = (ud.t % 1.2) / 1.2;
      p.position.x = ud.ox + ud.dx * frac * 5;
      p.position.z = ud.oz + ud.dz * frac * 5;
      p.position.y = 0.1 + Math.sin(frac * Math.PI) * 0.4;
      p.material.opacity = 0.6 * (1 - frac);
    }

    // Phase transition
    if (_phaseTimer >= 5) {
      _phase = 3;
      _phaseTimer = 0;
      _startPhaseExtraction();
    }
  }

  /* ────────────────────────────────────────────────────────────────────────
     PHASE 3: EXTRACTION (3s for player / 8s timeout)
   ──────────────────────────────────────────────────────────────────────── */

  function _startPhaseExtraction() {
    _showHUDMessage('🚁 EXTRACT NOW — RUN TO LZ', '#00ff44', true);
  }

  function _updateExtraction(dt) {
    // Check if player is within 3 units of LZ (0,0,0)
    var player = _getPlayerPosition();
    if (player) {
      var dx = player.x - 0;
      var dz = player.z - 0;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= 3 && !_extractionTriggered) {
        _doExtraction();
        return;
      }
    }

    // Lift off if extraction triggered
    if (_extractionTriggered && _heliGroup) {
      _heliGroup.position.y += 0.5 * dt;
    }

    // 8 second timeout — abort
    if (_phaseTimer >= 8 && !_extractionTriggered) {
      _showHUDMessage('⚠ EXTRACTION ABORTED — LZ COMPROMISED', '#ff2222', false);
      _clearFlash();
      setTimeout(function () {
        _forceMissionComplete('lz-aborted');
      }, 2000);
      _phase = 0; // prevent re-entry
    }
  }

  /* ────────────────────────────────────────────────────────────────────────
     EXTRACTION / MISSION COMPLETE
   ──────────────────────────────────────────────────────────────────────── */

  function _doExtraction() {
    _extractionTriggered = true;
    _showHUDMessage('✅ MISSION COMPLETE', '#ffff00', false);
    _clearFlash();

    // Triumphant sound
    _playExtractionFanfare();

    // Hide player from scene (optional)
    if (window.GameManager && window.GameManager.getPlayer) {
      var pl = window.GameManager.getPlayer();
      if (pl && pl.visible !== undefined) pl.visible = false;
    }

    // Helicopter lifts off — handled in update loop
    if (_heliGroup) {
      _heliGroup.position.set(0, 8, 0);
    }

    // Fire callbacks after short delay
    setTimeout(function () {
      _fireMissionCompleteCallbacks();
    }, 1500);
  }

  function _forceMissionComplete(reason) {
    if (_missionCompleteTriggered) return;
    _fireMissionCompleteCallbacks();
  }

  function _fireMissionCompleteCallbacks() {
    if (_missionCompleteTriggered) return;
    _missionCompleteTriggered = true;

    if (typeof window._onExtractionComplete === 'function') {
      try { window._onExtractionComplete(); } catch (e) {}
    }

    var kills = (window.GameManager && window.GameManager.getKills) ? window.GameManager.getKills() : 0;
    var score = (window.GameManager && window.GameManager.getScore) ? window.GameManager.getScore() : 0;
    var levelName = (window.GameManager && window.GameManager.getLevelName) ? window.GameManager.getLevelName() : 'Unknown';
    var xp = kills * 10 + Math.floor(score / 100);

    if (typeof window._onMissionComplete === 'function') {
      try {
        window._onMissionComplete({
          levelName: levelName,
          kills: kills,
          score: score,
          xpEarned: xp
        });
      } catch (e) {}
    }
  }

  /* ────────────────────────────────────────────────────────────────────────
     BUILD: HELICOPTER MESH
   ──────────────────────────────────────────────────────────────────────── */

  function _buildHelicopter() {
    if (!_scene || !window.THREE) return;

    _heliGroup = new THREE.Group();

    var milGreen = new THREE.MeshLambertMaterial({ color: 0x2a3a2a });
    var darkMetal = new THREE.MeshLambertMaterial({ color: 0x1a2a1a });

    // ── Main body ────────────────────────────────────────
    var bodyGeo = new THREE.BoxGeometry(2, 0.6, 4);
    var body = new THREE.Mesh(bodyGeo, milGreen);
    body.position.set(0, 0, 0);
    _heliGroup.add(body);

    // Cockpit nose (slightly narrower box at front)
    var noseGeo = new THREE.BoxGeometry(1.4, 0.5, 1.2);
    var nose = new THREE.Mesh(noseGeo, milGreen);
    nose.position.set(0, -0.05, -2.4);
    _heliGroup.add(nose);

    // Cockpit glass (dark blue-tinted)
    var glassGeo = new THREE.BoxGeometry(1.2, 0.35, 0.5);
    var glassMat = new THREE.MeshLambertMaterial({ color: 0x112233, transparent: true, opacity: 0.7 });
    var glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 0.05, -2.7);
    _heliGroup.add(glass);

    // ── Tail boom ────────────────────────────────────────
    var tailGeo = new THREE.BoxGeometry(0.3, 0.25, 3);
    var tail = new THREE.Mesh(tailGeo, milGreen);
    tail.position.set(0, 0.05, 2.8);
    _heliGroup.add(tail);

    // Tail fin (vertical stabiliser)
    var finGeo = new THREE.BoxGeometry(0.1, 0.6, 0.5);
    var fin = new THREE.Mesh(finGeo, milGreen);
    fin.position.set(0, 0.4, 4.1);
    _heliGroup.add(fin);

    // ── Tail rotor ───────────────────────────────────────
    var tailRotorGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
    var tailRotorHub = new THREE.Mesh(tailRotorGeo, darkMetal);
    tailRotorHub.rotation.z = Math.PI / 2;
    tailRotorHub.position.set(0.2, 0.1, 4.2);
    _heliGroup.add(tailRotorHub);

    var tailBlade1Geo = new THREE.BoxGeometry(0.05, 0.04, 0.6);
    _rotorTail = new THREE.Group();
    var tb1 = new THREE.Mesh(tailBlade1Geo, darkMetal);
    var tb2 = new THREE.Mesh(tailBlade1Geo, darkMetal);
    tb2.rotation.y = Math.PI / 2;
    _rotorTail.add(tb1);
    _rotorTail.add(tb2);
    _rotorTail.position.set(0.22, 0.1, 4.2);
    _heliGroup.add(_rotorTail);

    // ── Main rotor mast ──────────────────────────────────
    var mastGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 6);
    var mast = new THREE.Mesh(mastGeo, darkMetal);
    mast.position.set(0, 0.5, 0);
    _heliGroup.add(mast);

    // ── Main rotor blades ────────────────────────────────
    _rotorTop = new THREE.Group();
    _rotorTop.position.set(0, 0.72, 0);

    var bladeMat = new THREE.MeshLambertMaterial({ color: 0x1c2c1c });
    var bladeGeo = new THREE.BoxGeometry(5.5, 0.04, 0.28);
    var blade1 = new THREE.Mesh(bladeGeo, bladeMat);
    var blade2 = new THREE.Mesh(bladeGeo, bladeMat);
    blade2.rotation.y = Math.PI / 2;
    var blade3 = new THREE.Mesh(bladeGeo, bladeMat);
    blade3.rotation.y = Math.PI;
    var blade4 = new THREE.Mesh(bladeGeo, bladeMat);
    blade4.rotation.y = Math.PI * 1.5;
    _rotorTop.add(blade1);
    _rotorTop.add(blade2);
    _rotorTop.add(blade3);
    _rotorTop.add(blade4);
    _heliGroup.add(_rotorTop);

    // ── Landing skids ────────────────────────────────────
    var skidMat = new THREE.MeshLambertMaterial({ color: 0x111811 });

    // Left skid
    var skidLGeo = new THREE.BoxGeometry(0.1, 0.08, 3.6);
    var skidL = new THREE.Mesh(skidLGeo, skidMat);
    skidL.position.set(-0.75, -0.45, 0);
    _heliGroup.add(skidL);

    // Right skid
    var skidR = new THREE.Mesh(skidLGeo, skidMat);
    skidR.position.set(0.75, -0.45, 0);
    _heliGroup.add(skidR);

    // Skid struts (front)
    var strutGeo = new THREE.BoxGeometry(0.08, 0.45, 0.08);
    var strutMat = new THREE.MeshLambertMaterial({ color: 0x1a2a1a });

    var strut1 = new THREE.Mesh(strutGeo, strutMat);
    strut1.position.set(-0.75, -0.2, -1);
    _heliGroup.add(strut1);
    var strut2 = new THREE.Mesh(strutGeo, strutMat);
    strut2.position.set(0.75, -0.2, -1);
    _heliGroup.add(strut2);

    // Skid struts (rear)
    var strut3 = new THREE.Mesh(strutGeo, strutMat);
    strut3.position.set(-0.75, -0.2, 1.2);
    _heliGroup.add(strut3);
    var strut4 = new THREE.Mesh(strutGeo, strutMat);
    strut4.position.set(0.75, -0.2, 1.2);
    _heliGroup.add(strut4);

    // ── Search spotlight ─────────────────────────────────
    _searchLight = new THREE.SpotLight(0x88ffaa, 2, 30, Math.PI / 8, 0.3, 1);
    _searchLight.position.set(0, 0, 0);
    _searchLight.target = new THREE.Object3D();
    _searchLight.target.position.set(0, -8, 0);
    _heliGroup.add(_searchLight);
    _scene.add(_searchLight.target);

    // Start position
    _heliGroup.position.set(80, 20, 0);
    _scene.add(_heliGroup);
  }

  /* ────────────────────────────────────────────────────────────────────────
     BUILD: LZ RING (ground marker)
   ──────────────────────────────────────────────────────────────────────── */

  function _buildLZRing() {
    if (!_scene || !window.THREE) return;

    var ringGeo = new THREE.RingGeometry(3, 3.5, 32);
    var ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff44, side: THREE.DoubleSide });
    _lzRing = new THREE.Mesh(ringGeo, ringMat);
    _lzRing.rotation.x = -Math.PI / 2; // lay flat on ground
    _lzRing.position.set(0, 0.05, 0);
    _lzRing.visible = false; // shown in phase 2
    _scene.add(_lzRing);
  }

  /* ────────────────────────────────────────────────────────────────────────
     BUILD: DUST PARTICLES (rotor wash)
   ──────────────────────────────────────────────────────────────────────── */

  function _buildDustParticles() {
    if (!_scene || !window.THREE) return;

    var dustGeo = new THREE.SphereGeometry(0.12, 4, 4);

    for (var i = 0; i < 20; i++) {
      var angle = (i / 20) * Math.PI * 2;
      var dustMat = new THREE.MeshBasicMaterial({
        color: 0xbbaa88,
        transparent: true,
        opacity: 0.5
      });
      var dust = new THREE.Mesh(dustGeo, dustMat);
      var ox = Math.cos(angle) * 0.5;
      var oz = Math.sin(angle) * 0.5;
      dust.position.set(ox, 0.1, oz);
      dust.userData = {
        ox: ox,
        oz: oz,
        dx: Math.cos(angle),
        dz: Math.sin(angle),
        t: (i / 20) // stagger start
      };
      _scene.add(dust);
      _dustParticles.push(dust);
    }
  }

  /* ────────────────────────────────────────────────────────────────────────
     DROP: GREEN SMOKE GRENADE
   ──────────────────────────────────────────────────────────────────────── */

  function _dropSmokeGrenade() {
    if (!_scene || !window.THREE) return;

    var smokeGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.35, 8);
    var smokeMat = new THREE.MeshLambertMaterial({ color: 0x226622 });
    _smokeGrenade = new THREE.Mesh(smokeGeo, smokeMat);
    _smokeGrenade.position.set(0, 8, 0); // drops from heli position
    _scene.add(_smokeGrenade);
  }

  /* ────────────────────────────────────────────────────────────────────────
     HUD HELPERS
   ──────────────────────────────────────────────────────────────────────── */

  function _buildHUD() {
    _removeHUD();

    // Main extraction message (top-center)
    _hudMsg = document.createElement('div');
    _hudMsg.id = 'heli-extraction-msg';
    _hudMsg.style.cssText = [
      'position:fixed',
      'top:18px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:2000',
      'font-family:monospace',
      'font-size:18px',
      'font-weight:bold',
      'color:#00ff44',
      'text-shadow:0 0 10px #00ff44',
      'pointer-events:none',
      'letter-spacing:2px',
      'background:rgba(0,0,0,0.55)',
      'padding:5px 18px',
      'border-radius:6px',
      'border:1px solid rgba(0,255,68,0.4)'
    ].join(';');
    document.body.appendChild(_hudMsg);

    // LZ distance label (below main msg)
    _lzDistEl = document.createElement('div');
    _lzDistEl.id = 'heli-lz-dist';
    _lzDistEl.style.cssText = [
      'position:fixed',
      'top:52px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:2000',
      'font-family:monospace',
      'font-size:13px',
      'color:#88ffaa',
      'pointer-events:none',
      'letter-spacing:1px',
      'background:rgba(0,0,0,0.45)',
      'padding:2px 12px',
      'border-radius:4px'
    ].join(';');
    _lzDistEl.textContent = 'LZ: — m';
    document.body.appendChild(_lzDistEl);
  }

  function _showHUDMessage(text, color, flashing) {
    if (!_hudMsg) _buildHUD();
    _clearFlash();
    _hudMsg.textContent = text;
    _hudMsg.style.color = color || '#00ff44';
    _hudMsg.style.textShadow = '0 0 10px ' + (color || '#00ff44');

    if (flashing) {
      var visible = true;
      _flashInterval = setInterval(function () {
        if (_hudMsg) _hudMsg.style.opacity = visible ? '1' : '0.25';
        visible = !visible;
      }, 500);
    }
  }

  function _updateHUDText(text) {
    if (_hudMsg) _hudMsg.textContent = text;
  }

  function _clearFlash() {
    if (_flashInterval) {
      clearInterval(_flashInterval);
      _flashInterval = null;
    }
    if (_hudMsg) _hudMsg.style.opacity = '1';
  }

  function _removeHUD() {
    _clearFlash();
    var old = document.getElementById('heli-extraction-msg');
    if (old) old.parentNode.removeChild(old);
    var oldDist = document.getElementById('heli-lz-dist');
    if (oldDist) oldDist.parentNode.removeChild(oldDist);
    _hudMsg = null;
    _lzDistEl = null;
  }

  function _updateLZDistance() {
    if (!_lzDistEl) return;
    var player = _getPlayerPosition();
    if (!player) {
      _lzDistEl.textContent = 'LZ: — m';
      return;
    }
    var dx = player.x;
    var dz = player.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    _lzDistEl.textContent = 'LZ: ' + Math.round(dist) + 'm';
  }

  /* ────────────────────────────────────────────────────────────────────────
     PLAYER POSITION HELPER
   ──────────────────────────────────────────────────────────────────────── */

  function _getPlayerPosition() {
    // Try various ways to get player position
    if (window.GameManager) {
      if (typeof window.GameManager.getPlayerPosition === 'function') {
        return window.GameManager.getPlayerPosition();
      }
      if (typeof window.GameManager.getPlayer === 'function') {
        var pl = window.GameManager.getPlayer();
        if (pl && pl.position) return pl.position;
      }
    }
    if (window._playerMesh && window._playerMesh.position) {
      return window._playerMesh.position;
    }
    if (window._camera && window._camera.position) {
      return window._camera.position;
    }
    if (_camera && _camera.position) {
      return _camera.position;
    }
    return null;
  }

  /* ────────────────────────────────────────────────────────────────────────
     AUDIO
   ──────────────────────────────────────────────────────────────────────── */

  function _playRotorDrone() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc1 = ctx.createOscillator();
      var osc2 = ctx.createOscillator();
      var gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.value = 48;
      osc2.type = 'square';
      osc2.frequency.value = 96;

      gain.gain.value = 0.08;

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      // Store so we can stop it
      _rotorSource = { ctx: ctx, nodes: [osc1, osc2, gain] };

      // Auto-stop after 20s
      setTimeout(function () { _stopRotorSound(); }, 20000);
    } catch (e) {}
  }

  function _stopRotorSound() {
    if (_rotorSource) {
      try {
        _rotorSource.nodes.forEach(function (n) {
          try { n.stop && n.stop(); } catch (e) {}
          try { n.disconnect && n.disconnect(); } catch (e) {}
        });
        _rotorSource.ctx.close();
      } catch (e) {}
      _rotorSource = null;
    }
  }

  function _playExtractionFanfare() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var gain = ctx.createGain();
      gain.gain.value = 0.22;
      gain.connect(ctx.destination);

      // Ascending major chord: C4, E4, G4, C5
      var freqs = [261.63, 329.63, 392.00, 523.25];
      freqs.forEach(function (freq, i) {
        var osc = ctx.createOscillator();
        var noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        noteGain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        noteGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.12 + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.9);
        osc.connect(noteGain);
        noteGain.connect(gain);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.9);
      });

      setTimeout(function () { try { ctx.close(); } catch (e) {} }, 2000);
    } catch (e) {}
  }

  /* ────────────────────────────────────────────────────────────────────────
     EXPORTS
   ──────────────────────────────────────────────────────────────────────── */

  return {
    init: init,
    trigger: trigger,
    update: update,
    reset: reset
  };

})();
