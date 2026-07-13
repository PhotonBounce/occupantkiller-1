window.ChemBioResponse = (function() {
  'use strict';

  // --- State ---
  var active = false;
  var scene, camera, renderer, playerRef, gameRef;

  // Keypress tracking for C+B activation
  var keyTimers = {};
  var cbActivationWindow = 400;

  // HUD element
  var hudEl = null;

  // Timer
  var missionTimer = 300; // 5 minutes in seconds
  var missionOver = false;

  // Suit state
  var suitOn = false;
  var suitMesh = null;
  var radSuitOn = false;

  // Contamination
  var contamLevel = 0; // 0-100
  var incapacitated = false;

  // Air detector
  var detectorVisible = false;
  var detectorMesh = null;

  // Wind
  var windAngle = 0;
  var windTimer = 0;
  var windArrow = null;

  // Plumes
  var plumes = [];
  var plumeParticles = [];
  var PLUME_COUNT = 3;

  // Canisters
  var canisters = [];
  var carriedCanister = null;

  // Civilians
  var civilians = [];
  var civiliansSaved = 0;

  // Saboteurs
  var saboteurs = [];
  var saboteursCaught = 0;

  // Decon station
  var deconStation = null;

  // Radiation zone
  var radBuilding = null;
  var radLight = null;
  var radLightPulse = 0;

  // Score
  var score = 0;
  var plumesNeutralized = 0;

  // Neutralization deployments
  var neutralDeployments = [];

  // Detector display
  var detectorReading = 0;

  // Clock
  var clock = null;

  // Groups
  var moduleGroup = null;

  // Key state
  var keys = {};
  var keyDownTime = {};

  // -------------------------
  // Initialization
  // -------------------------
  function init(sceneRef, cameraRef, rendererRef, player, game) {
    scene = sceneRef;
    camera = cameraRef;
    renderer = rendererRef;
    playerRef = player;
    gameRef = game;

    clock = new THREE.Clock();

    moduleGroup = new THREE.Group();
    scene.add(moduleGroup);

    _setupHUD();
    _setupKeyListeners();
    _buildWorld();

    active = false;
    _updateHUD();
  }

  // -------------------------
  // Key Listeners
  // -------------------------
  function _setupKeyListeners() {
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup', _onKeyUp);
  }

  function _onKeyDown(e) {
    var key = e.key.toLowerCase();
    if (keys[key]) return; // already held
    keys[key] = true;
    keyDownTime[key] = performance.now();

    // C+B activation
    if (key === 'c' || key === 'b') {
      var other = key === 'c' ? 'b' : 'c';
      if (keys[other] && Math.abs(keyDownTime[key] - (keyDownTime[other] || 0)) < cbActivationWindow) {
        _activate();
      }
    }

    if (!active) return;

    if (key === 'h') { _toggleSuit(); }
    if (key === 'd') { _toggleDetector(); }
    if (key === 'e') { _tryCaptureSaboteur(); }
    if (key === 'f') { _tryPickupCanister(); }
    if (key === 'g') { _tryDeployCanister(); }
  }

  function _onKeyUp(e) {
    var key = e.key.toLowerCase();
    keys[key] = false;
  }

  // -------------------------
  // Activate / Deactivate
  // -------------------------
  function _activate() {
    if (active) return;
    active = true;
    moduleGroup.visible = true;
    missionTimer = 300;
    missionOver = false;
    contamLevel = 0;
    incapacitated = false;
    civiliansSaved = 0;
    saboteursCaught = 0;
    plumesNeutralized = 0;
    score = 0;
    if (hudEl) hudEl.style.display = 'block';
    _updateHUD();
  }

  function _deactivate() {
    active = false;
    if (hudEl) hudEl.style.display = 'none';
    _removeSuit();
    _hideDetector();
  }

  // -------------------------
  // HUD
  // -------------------------
  function _setupHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'chem-bio-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'bottom:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,30,0,0.85)',
      'color:#00FF44',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border:1px solid #00FF44',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'display:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(hudEl);
  }

  function _updateHUD() {
    if (!hudEl) return;
    var suitStr = suitOn ? 'ON' : (radSuitOn ? 'RAD' : 'OFF');
    var contamStr = Math.floor(contamLevel) + '%';
    var civStr = civiliansSaved + '/4';
    var plumeStr = plumesNeutralized + '/3';
    var mm = Math.floor(missionTimer / 60);
    var ss = Math.floor(missionTimer % 60);
    var timerStr = (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;
    var windDeg = Math.floor((windAngle * 180 / Math.PI + 360) % 360);
    var windDir = _degreesToCompass(windDeg);
    var detStr = detectorVisible ? (' [AIR:' + Math.floor(detectorReading) + 'ppm]') : '';
    hudEl.textContent = 'CBRN [SUIT:' + suitStr + '] [CONTAM:' + contamStr + '] [CIVILIANS:' + civStr + '] [PLUMES:' + plumeStr + '] | SPREAD IN:' + timerStr + ' | WIND:' + windDir + detStr;
  }

  function _degreesToCompass(deg) {
    var dirs = ['N','NE','E','SE','S','SW','W','NW'];
    return dirs[Math.round(deg / 45) % 8];
  }

  // -------------------------
  // Build World Objects
  // -------------------------
  function _buildWorld() {
    _buildPlumes();
    _buildCanisters();
    _buildCivilians();
    _buildSaboteurs();
    _buildDeconStation();
    _buildRadBuilding();
    _buildWindArrow();
    moduleGroup.visible = false;
  }

  function _buildPlumes() {
    var positions = [
      new THREE.Vector3(-15, 0, -10),
      new THREE.Vector3(5, 0, -20),
      new THREE.Vector3(20, 0, -5)
    ];
    for (var i = 0; i < PLUME_COUNT; i++) {
      var plumeGroup = new THREE.Group();
      plumeGroup.position.copy(positions[i]);

      // Source sphere
      var sourceGeo = new THREE.SphereGeometry(0.5, 8, 8);
      var sourceMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00, transparent: true, opacity: 0.9 });
      var sourceMesh = new THREE.Mesh(sourceGeo, sourceMat);
      plumeGroup.add(sourceMesh);

      // Particle cloud — 40 yellow spheres
      var particles = [];
      for (var j = 0; j < 40; j++) {
        var pGeo = new THREE.SphereGeometry(0.15, 4, 4);
        var pMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00, transparent: true, opacity: 0.5 });
        var pMesh = new THREE.Mesh(pGeo, pMat);
        var angle = Math.random() * Math.PI * 2;
        var radius = Math.random() * 2;
        pMesh.position.set(
          Math.cos(angle) * radius,
          Math.random() * 2,
          Math.sin(angle) * radius
        );
        pMesh.userData.baseAngle = angle;
        pMesh.userData.radius = radius;
        pMesh.userData.speed = 0.2 + Math.random() * 0.5;
        pMesh.userData.phase = Math.random() * Math.PI * 2;
        plumeGroup.add(pMesh);
        particles.push(pMesh);
      }

      moduleGroup.add(plumeGroup);
      plumes.push({
        group: plumeGroup,
        position: positions[i].clone(),
        radius: 3,
        maxRadius: 8,
        neutralized: false,
        particles: particles,
        neutralTimer: 0
      });
      plumeParticles.push(particles);
    }
  }

  function _buildCanisters() {
    var positions = [
      new THREE.Vector3(-5, 0.5, 5),
      new THREE.Vector3(10, 0.5, 10),
      new THREE.Vector3(-20, 0.5, 5)
    ];
    for (var i = 0; i < 3; i++) {
      var geo = new THREE.BoxGeometry(0.5, 1.2, 0.5);
      var mat = new THREE.MeshLambertMaterial({ color: 0x0088FF });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(positions[i]);
      moduleGroup.add(mesh);
      canisters.push({
        mesh: mesh,
        position: positions[i].clone(),
        carried: false,
        deployed: false
      });
    }
  }

  function _buildCivilians() {
    var positions = [
      new THREE.Vector3(-12, 0.9, -8),
      new THREE.Vector3(3, 0.9, -15),
      new THREE.Vector3(-18, 0.9, -12),
      new THREE.Vector3(8, 0.9, -10)
    ];
    for (var i = 0; i < 4; i++) {
      var geo = new THREE.BoxGeometry(0.6, 1.8, 0.4);
      var mat = new THREE.MeshLambertMaterial({ color: 0xAA7744 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(positions[i]);
      moduleGroup.add(mesh);
      civilians.push({
        mesh: mesh,
        position: positions[i].clone(),
        saved: false,
        contaminated: false,
        coughPhase: Math.random() * Math.PI * 2,
        following: false
      });
    }
  }

  function _buildSaboteurs() {
    var positions = [
      new THREE.Vector3(25, 0.9, -15),
      new THREE.Vector3(-25, 0.9, -20)
    ];
    for (var i = 0; i < 2; i++) {
      var geo = new THREE.BoxGeometry(0.6, 1.8, 0.4);
      var mat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(positions[i]);
      moduleGroup.add(mesh);
      saboteurs.push({
        mesh: mesh,
        position: positions[i].clone(),
        caught: false,
        fleeDir: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize()
      });
    }
  }

  function _buildDeconStation() {
    var geo = new THREE.BoxGeometry(8, 4, 4);
    var mat = new THREE.MeshLambertMaterial({ color: 0x3399FF, transparent: true, opacity: 0.7 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(30, 2, 10);
    moduleGroup.add(mesh);

    // 4 spray nozzles
    var nozzlePositions = [
      new THREE.Vector3(-3, 1, 2.1),
      new THREE.Vector3(-1, 1, 2.1),
      new THREE.Vector3(1, 1, 2.1),
      new THREE.Vector3(3, 1, 2.1)
    ];
    for (var i = 0; i < 4; i++) {
      var nGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.6, 6);
      var nMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
      var nMesh = new THREE.Mesh(nGeo, nMat);
      nMesh.position.copy(nozzlePositions[i]);
      nMesh.rotation.x = Math.PI / 2;
      mesh.add(nMesh);
    }

    deconStation = {
      mesh: mesh,
      position: new THREE.Vector3(30, 0, 10),
      radius: 5
    };
  }

  function _buildRadBuilding() {
    var geo = new THREE.BoxGeometry(6, 4, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0x664422 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(-30, 2, -25);
    moduleGroup.add(mesh);

    // Radiation leak light
    radLight = new THREE.PointLight(0xFF0000, 2, 15);
    radLight.position.set(-30, 4, -25);
    moduleGroup.add(radLight);

    radBuilding = {
      mesh: mesh,
      position: new THREE.Vector3(-30, 0, -25),
      radius: 8
    };
  }

  function _buildWindArrow() {
    var arrowGroup = new THREE.Group();
    var bodyGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 4);
    var bodyMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
    var bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.rotation.z = Math.PI / 2;
    arrowGroup.add(bodyMesh);

    var headGeo = new THREE.ConeGeometry(0.15, 0.4, 4);
    var headMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
    var headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.rotation.z = -Math.PI / 2;
    headMesh.position.x = 0.7;
    arrowGroup.add(headMesh);

    arrowGroup.position.set(0, 5, -3);
    moduleGroup.add(arrowGroup);
    windArrow = arrowGroup;
  }

  // -------------------------
  // Suit
  // -------------------------
  function _toggleSuit() {
    if (radSuitOn) { radSuitOn = false; }
    suitOn = !suitOn;
    if (suitOn) {
      _applySuit();
    } else {
      _removeSuit();
    }
    _updateHUD();
  }

  function _applySuit() {
    if (!playerRef) return;
    _removeSuit();
    var geo = new THREE.BoxGeometry(0.9, 2.1, 0.7);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.6 });
    suitMesh = new THREE.Mesh(geo, mat);
    playerRef.add(suitMesh);
  }

  function _removeSuit() {
    if (suitMesh) {
      if (suitMesh.parent) suitMesh.parent.remove(suitMesh);
      suitMesh = null;
    }
  }

  // -------------------------
  // Detector
  // -------------------------
  function _toggleDetector() {
    detectorVisible = !detectorVisible;
    if (detectorVisible) {
      _showDetector();
    } else {
      _hideDetector();
    }
  }

  function _showDetector() {
    if (detectorMesh || !camera) return;
    var bodyGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x22AA22 });
    detectorMesh = new THREE.Mesh(bodyGeo, bodyMat);
    detectorMesh.position.set(0.4, -0.3, -0.7);
    detectorMesh.rotation.z = Math.PI / 4;
    camera.add(detectorMesh);
    // Make sure camera is in scene
    if (!camera.parent) scene.add(camera);
  }

  function _hideDetector() {
    if (detectorMesh) {
      if (detectorMesh.parent) detectorMesh.parent.remove(detectorMesh);
      detectorMesh = null;
    }
    detectorVisible = false;
  }

  // -------------------------
  // Canister pickup / deploy
  // -------------------------
  function _tryPickupCanister() {
    if (carriedCanister) return;
    var playerPos = _getPlayerPos();
    for (var i = 0; i < canisters.length; i++) {
      var c = canisters[i];
      if (!c.carried && !c.deployed) {
        if (c.mesh.position.distanceTo(playerPos) < 2.5) {
          c.carried = true;
          carriedCanister = c;
          c.mesh.position.set(0.5, 0, -1);
          if (playerRef) playerRef.add(c.mesh);
          break;
        }
      }
    }
  }

  function _tryDeployCanister() {
    if (!carriedCanister) return;
    var playerPos = _getPlayerPos();
    for (var i = 0; i < plumes.length; i++) {
      var p = plumes[i];
      if (!p.neutralized && p.position.distanceTo(playerPos) < 4) {
        // Start neutralization
        if (playerRef) {
          playerRef.remove(carriedCanister.mesh);
          moduleGroup.add(carriedCanister.mesh);
        }
        carriedCanister.mesh.position.copy(p.position);
        carriedCanister.mesh.position.y = 0.5;
        carriedCanister.deployed = true;
        neutralDeployments.push({
          canister: carriedCanister,
          plume: p,
          timer: 8
        });
        carriedCanister = null;
        break;
      }
    }
  }

  // -------------------------
  // Capture saboteur
  // -------------------------
  function _tryCaptureSaboteur() {
    var playerPos = _getPlayerPos();
    for (var i = 0; i < saboteurs.length; i++) {
      var s = saboteurs[i];
      if (!s.caught && s.mesh.position.distanceTo(playerPos) < 2.5) {
        s.caught = true;
        s.mesh.visible = false;
        saboteursCaught++;
        score += 200;
        _updateHUD();
        break;
      }
    }
  }

  // -------------------------
  // Player position helper
  // -------------------------
  function _getPlayerPos() {
    if (playerRef) return playerRef.position.clone();
    if (camera) return camera.position.clone();
    return new THREE.Vector3(0, 0, 0);
  }

  // -------------------------
  // Update (called every frame)
  // -------------------------
  function update(delta) {
    if (!active) return;
    if (!delta || delta > 0.5) delta = 0.016;

    if (missionOver) return;

    // Mission timer
    missionTimer -= delta;
    if (missionTimer <= 0) {
      missionTimer = 0;
      missionOver = true;
      _doDebrief();
    }

    // Wind system
    windTimer += delta;
    if (windTimer >= 30) {
      windTimer = 0;
      windAngle = Math.random() * Math.PI * 2;
    }
    if (windArrow) {
      windArrow.rotation.y = windAngle;
    }

    // Expand plumes over 30s
    for (var i = 0; i < plumes.length; i++) {
      var p = plumes[i];
      if (!p.neutralized) {
        p.radius = Math.min(p.maxRadius, p.radius + delta * (p.maxRadius - 3) / 30);
        // Drift
        var drift = 0.5 * delta;
        p.position.x += Math.cos(windAngle) * drift;
        p.position.z += Math.sin(windAngle) * drift;
        p.group.position.copy(p.position);
        p.group.position.y = 0;
      }
    }

    // Animate plume particles
    _animatePlumes(delta);

    // Contamination
    _updateContamination(delta);

    // Civilians
    _updateCivilians(delta);

    // Saboteurs flee
    _updateSaboteurs(delta);

    // Neutralization deployments
    _updateNeutralizations(delta);

    // Radiation pulse
    _updateRadiation(delta);

    // Detector reading
    if (detectorVisible) {
      var playerPos = _getPlayerPos();
      detectorReading = _getPPMAtPosition(playerPos);
    }

    // Carried canister follows player
    // (already parented to playerRef, so updates automatically)

    _updateHUD();
  }

  function _animatePlumes(delta) {
    var t = performance.now() * 0.001;
    for (var i = 0; i < plumes.length; i++) {
      var p = plumes[i];
      if (p.neutralized) continue;
      var particles = p.particles;
      for (var j = 0; j < particles.length; j++) {
        var pm = particles[j];
        var angle = pm.userData.baseAngle + t * pm.userData.speed;
        var radius = pm.userData.radius * (p.radius / 3);
        pm.position.x = Math.cos(angle) * radius;
        pm.position.z = Math.sin(angle) * radius;
        pm.position.y = 0.5 + Math.sin(t * pm.userData.speed + pm.userData.phase) * 0.8;
        pm.material.opacity = 0.3 + 0.3 * Math.sin(t + pm.userData.phase);
      }
    }
  }

  function _getPPMAtPosition(pos) {
    var maxPPM = 0;
    for (var i = 0; i < plumes.length; i++) {
      var p = plumes[i];
      if (p.neutralized) continue;
      var dist = p.position.distanceTo(pos);
      if (dist < p.radius) {
        var concentration = (1 - dist / p.radius) * 500;
        if (concentration > maxPPM) maxPPM = concentration;
      }
    }
    return maxPPM;
  }

  function _updateContamination(delta) {
    var playerPos = _getPlayerPos();
    var inPlume = false;
    for (var i = 0; i < plumes.length; i++) {
      var p = plumes[i];
      if (!p.neutralized && p.position.distanceTo(playerPos) < p.radius) {
        inPlume = true;
        break;
      }
    }

    if (inPlume && !suitOn && !radSuitOn) {
      contamLevel = Math.min(100, contamLevel + delta * 8);
    } else if (!inPlume) {
      contamLevel = Math.max(0, contamLevel - delta * 4);
    }

    if (contamLevel >= 100) {
      incapacitated = true;
    } else if (contamLevel < 80) {
      incapacitated = false;
    }

    // Decon zone clears contamination
    if (deconStation && playerPos.distanceTo(deconStation.position) < deconStation.radius) {
      contamLevel = Math.max(0, contamLevel - delta * 20);
    }
  }

  function _updateCivilians(delta) {
    var playerPos = _getPlayerPos();
    var t = performance.now() * 0.001;

    for (var i = 0; i < civilians.length; i++) {
      var civ = civilians[i];
      if (civ.saved) continue;

      // Cough oscillation
      civ.mesh.rotation.z = Math.sin(t * 3 + civ.coughPhase) * 0.1;

      // Check if player nearby to follow
      var distToPlayer = civ.mesh.position.distanceTo(playerPos);
      if (distToPlayer < 6) {
        civ.following = true;
      }

      if (civ.following) {
        // Move towards player
        var dir = playerPos.clone().sub(civ.mesh.position);
        dir.y = 0;
        if (dir.length() > 1.5) {
          dir.normalize();
          civ.mesh.position.x += dir.x * delta * 2;
          civ.mesh.position.z += dir.z * delta * 2;
        }
        // Check if reached decon
        if (deconStation && civ.mesh.position.distanceTo(deconStation.position) < deconStation.radius) {
          civ.saved = true;
          civ.mesh.visible = false;
          civiliansSaved++;
          score += 150;
        }
      }
    }
  }

  function _updateSaboteurs(delta) {
    var playerPos = _getPlayerPos();
    for (var i = 0; i < saboteurs.length; i++) {
      var s = saboteurs[i];
      if (s.caught) continue;
      var dist = s.mesh.position.distanceTo(playerPos);
      if (dist < 10) {
        // Flee
        var fleeDir = s.mesh.position.clone().sub(playerPos);
        fleeDir.y = 0;
        if (fleeDir.length() < 0.001) fleeDir.set(1, 0, 0);
        fleeDir.normalize();
        s.mesh.position.x += fleeDir.x * delta * 4;
        s.mesh.position.z += fleeDir.z * delta * 4;
      }
    }
  }

  function _updateNeutralizations(delta) {
    for (var i = neutralDeployments.length - 1; i >= 0; i--) {
      var nd = neutralDeployments[i];
      nd.timer -= delta;
      if (nd.timer <= 0) {
        nd.plume.neutralized = true;
        nd.plume.group.visible = false;
        nd.canister.mesh.visible = false;
        plumesNeutralized++;
        score += 300;
        neutralDeployments.splice(i, 1);
      }
    }
  }

  function _updateRadiation(delta) {
    if (!radLight) return;
    radLightPulse += delta * 3;
    radLight.intensity = 1.5 + Math.sin(radLightPulse) * 1.5;
  }

  // -------------------------
  // Debrief
  // -------------------------
  function _doDebrief() {
    score = civiliansSaved * 150 + saboteursCaught * 200 + plumesNeutralized * 300;
    var msg = [
      'CBRN MISSION DEBRIEF',
      '====================',
      'Civilians saved: ' + civiliansSaved + '/4  x150 = ' + (civiliansSaved * 150),
      'Saboteurs caught: ' + saboteursCaught + '/2  x200 = ' + (saboteursCaught * 200),
      'Plumes neutralized: ' + plumesNeutralized + '/3  x300 = ' + (plumesNeutralized * 300),
      '--------------------',
      'TOTAL SCORE: ' + score
    ].join('\n');
    if (typeof gameRef !== 'undefined' && gameRef && typeof gameRef.showDebrief === 'function') {
      gameRef.showDebrief(msg, score);
    } else {
      alert(msg);
    }
  }

  // -------------------------
  // Reset
  // -------------------------
  function reset() {
    _deactivate();

    // Remove all created objects
    if (moduleGroup) {
      scene.remove(moduleGroup);
      moduleGroup = null;
    }

    // Remove HUD
    if (hudEl && hudEl.parentNode) {
      hudEl.parentNode.removeChild(hudEl);
      hudEl = null;
    }

    // Remove key listeners
    window.removeEventListener('keydown', _onKeyDown);
    window.removeEventListener('keyup', _onKeyUp);

    // Reset all state
    plumes = [];
    plumeParticles = [];
    canisters = [];
    carriedCanister = null;
    civilians = [];
    saboteurs = [];
    neutralDeployments = [];
    deconStation = null;
    radBuilding = null;
    radLight = null;
    windArrow = null;
    suitMesh = null;
    detectorMesh = null;
    keys = {};
    keyDownTime = {};
    contamLevel = 0;
    missionTimer = 300;
    missionOver = false;
    score = 0;
    civiliansSaved = 0;
    saboteursCaught = 0;
    plumesNeutralized = 0;
    suitOn = false;
    radSuitOn = false;
    detectorVisible = false;
    windAngle = 0;
    windTimer = 0;
  }

  // -------------------------
  // Public API
  // -------------------------
  return {
    init: init,
    update: update,
    reset: reset
  };

})();
