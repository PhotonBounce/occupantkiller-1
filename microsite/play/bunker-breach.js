// ============================================================
//  bunker-breach.js — Browser-based Three.js bunker breach module
//  B+B keys (both within 400ms) to activate.
//  3-level underground complex with blast door, turrets, soldiers,
//  nuclear codes, ventilation escape, EMP charges, alert system.
//  Public API: init(scene, camera, controls), update(dt), reset()
// ============================================================
window.BunkerBreach = (function () {
  'use strict';

  // ── Module state ────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;
  var _controls = null;

  // Key state for B+B activation
  var _keyBDown        = false;
  var _lastBPressTime  = 0;
  var _active          = false;

  // Breach charge planting
  var _chargePlanting    = false;
  var _chargeProgress    = 0;
  var _chargePlanted     = false;
  var _chargeDetonated   = false;
  var _doorBreached      = false;

  // Hack panel state
  var _hackingPanel    = false;
  var _hackProgress    = 0;
  var _hackComplete    = false;

  // Virus plant state
  var _virusPlanting   = false;
  var _virusProgress   = 0;
  var _virusPlanted    = false;

  // Current level (1, 2, 3)
  var _currentLevel    = 1;

  // Nuclear codes taken
  var _codesTaken      = false;

  // Alert level 0-3
  var _alertLevel      = 0;
  var _alertTimer      = 0;

  // EMP charges remaining
  var _empCharges      = 2;
  var _empActive       = false;
  var _empTimer        = 0;
  var _empObjects      = [];

  // Power cut (generator destroyed)
  var _powerCut        = false;

  // Soldiers alive
  var _soldiers        = [];
  var _soldiersKilled  = 0;

  // Turrets
  var _turrets         = [];

  // Reinforcement timer
  var _reinforcementTimer = 0;

  // Ventilation
  var _inVent          = false;
  var _ventProgress    = 0;
  var _ventFanTimer    = 0;
  var _ventFanOpen     = false;
  var _ventFanOpenTimer= 0;

  // Escape state
  var _escaped         = false;

  // Boss / general
  var _generalHP       = 500;
  var _generalMesh     = null;
  var _generalDead     = false;

  // HUD
  var _hudEl           = null;
  var _objectiveText   = 'Breach blast door';

  // Scene objects
  var _blastDoor       = null;
  var _doorGap         = null;
  var _turretMeshes    = [];
  var _levelMeshes     = [];
  var _allObjects      = [];

  // Bunker root
  var _bunkerRoot      = null;
  var _originPos       = null;

  // Cameras / lights
  var _redLights       = [];
  var _whiteLights     = [];

  // ── Constants ───────────────────────────────────────────
  var CHARGE_TIME      = 3.0;
  var HACK_TIME        = 15.0;
  var VIRUS_TIME       = 8.0;
  var EMP_DURATION     = 15.0;
  var FAN_PERIOD       = 3.0;
  var FAN_WINDOW       = 1.5;
  var FAN_DAMAGE       = 30;
  var REINFORCE_PERIOD = 30.0;
  var REINFORCE_COUNT  = 6;

  var COLOR_CONCRETE   = 0x334433;
  var COLOR_DOOR       = 0x445544;
  var COLOR_ARMORY     = 0x445566;
  var COLOR_GENERATOR  = 0x334422;
  var COLOR_OFFICER    = 0x223322;
  var COLOR_COMMS      = 0x334455;
  var COLOR_WAR_TABLE  = 0x445533;
  var COLOR_VAULT_DOOR = 0x333333;
  var COLOR_HACK_PANEL = 0x44FF44;
  var COLOR_GENERAL    = 0x222233;
  var COLOR_CODES      = 0xFFCC00;
  var COLOR_TURRET     = 0x445544;
  var COLOR_EMP        = 0x4444FF;
  var COLOR_VENT       = 0x445544;
  var COLOR_FAN        = 0x888888;
  var COLOR_EXTRACT    = 0x00FF44;
  var COLOR_SOLDIER    = 0x334422;
  var COLOR_ELITE      = 0x223344;
  var COLOR_ALERT_LIGHT= 0xFF0000;

  // ── HUD ─────────────────────────────────────────────────
  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'bb-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:80px',
      'left:14px',
      'font-family:monospace',
      'font-size:12px',
      'color:#AAFFCC',
      'background:rgba(0,0,0,0.65)',
      'border:1px solid #445544',
      'padding:4px 10px',
      'border-radius:4px',
      'z-index:315',
      'pointer-events:none',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_active) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';
    var codesStr  = _codesTaken ? 'TAKEN' : 'NOT TAKEN';
    var soldierCount = _soldiers.filter(function (s) { return s.alive; }).length;
    var empStr    = 'EMP:' + _empCharges;
    var powerStr  = _powerCut ? ' [POWER:OFF]' : '';
    _hudEl.innerHTML =
      'BUNKER [LEVEL: ' + _currentLevel + '/3] ' +
      '[CODES: ' + codesStr + '] ' +
      '[ALERT: ' + _alertLevel + '] ' +
      '[SOLDIERS: ' + soldierCount + '] ' +
      '[' + empStr + ']' + powerStr +
      ' | OBJECTIVE: ' + _objectiveText;
  }

  // ── Geometry helpers ────────────────────────────────────
  function _box(w, h, d, color, x, y, z, parent) {
    var geo  = new THREE.BoxGeometry(w, h, d);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    if (parent) parent.add(mesh);
    else _scene.add(mesh);
    _allObjects.push(mesh);
    return mesh;
  }

  function _cyl(rt, rb, h, segs, color, x, y, z, parent) {
    var geo  = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    if (parent) parent.add(mesh);
    else _scene.add(mesh);
    _allObjects.push(mesh);
    return mesh;
  }

  // ── Build the bunker complex ─────────────────────────────
  function _buildBunker(pos) {
    _originPos  = pos.clone();
    _bunkerRoot = new THREE.Group();
    _bunkerRoot.position.copy(pos);
    _scene.add(_bunkerRoot);

    _buildSurface();
    _buildL1();
    _buildL2();
    _buildL3();
    _buildVentShaft();
  }

  function _buildSurface() {
    // Blast door  6x4x0.8 at surface
    _blastDoor = _box(6, 4, 0.8, COLOR_DOOR, 0, 2, 0, _bunkerRoot);
    _blastDoor.userData.isDoor = true;
    _blastDoor.userData.hp = 200;

    // Door gap (hidden until breached)
    var gapGeo  = new THREE.EdgesGeometry(new THREE.BoxGeometry(4, 4, 0.9));
    var gapMat  = new THREE.LineBasicMaterial({ color: 0x000000 });
    _doorGap    = new THREE.LineSegments(gapGeo, gapMat);
    _doorGap.position.set(0, 2, 0);
    _doorGap.visible = false;
    _bunkerRoot.add(_doorGap);
    _allObjects.push(_doorGap);

    // Guard turret on surface
    var turret = _cyl(0.3, 0.4, 1.5, 8, COLOR_TURRET, 4, 0.75, 2, _bunkerRoot);
    turret.userData.isTurret    = true;
    turret.userData.alive       = true;
    turret.userData.hp          = 60;
    turret.userData.fireTimer   = 0;
    turret.userData.fireRate    = 2.5;
    turret.userData.empDisabled = false;
    _turrets.push(turret);
    _turretMeshes.push(turret);
  }

  function _buildL1() {
    // L1 room 30x5x20 at y = -5 (underground)
    var room = _box(30, 5, 20, COLOR_CONCRETE, 0, -5, 0, _bunkerRoot);
    _levelMeshes.push(room);

    // 6 soldiers in barracks
    for (var i = 0; i < 6; i++) {
      var sx = -10 + i * 4;
      var sol = _box(0.6, 1.8, 0.6, COLOR_SOLDIER, sx, -3.1, -4, _bunkerRoot);
      sol.userData.isSoldier  = true;
      sol.userData.alive      = true;
      sol.userData.hp         = 100;
      sol.userData.level      = 1;
      sol.userData.fireTimer  = 0;
      sol.userData.flashlight = false;
      _soldiers.push(sol);
    }

    // Armory
    var armory = _box(2, 2, 1.5, COLOR_ARMORY, -12, -4.5, 6, _bunkerRoot);
    armory.userData.isArmory = true;
    armory.userData.used     = false;
    _allObjects.push(armory);

    // Generator
    var gen = _cyl(0.8, 0.8, 2, 12, COLOR_GENERATOR, 12, -4, 7, _bunkerRoot);
    gen.userData.isGenerator = true;
    gen.userData.alive       = true;
    gen.userData.hp          = 150;
    _allObjects.push(gen);

    // White ambient light for L1
    var wl = new THREE.PointLight(0xFFFFCC, 1.2, 25);
    wl.position.set(0, -3, 0);
    _bunkerRoot.add(wl);
    _whiteLights.push(wl);

    // Red emergency light (off initially)
    var rl = new THREE.PointLight(COLOR_ALERT_LIGHT, 0, 25);
    rl.position.set(0, -3, 0);
    _bunkerRoot.add(rl);
    _redLights.push(rl);
  }

  function _buildL2() {
    // L2 room 30x5x20 at y = -10
    var room = _box(30, 5, 20, COLOR_CONCRETE, 0, -10, 0, _bunkerRoot);
    _levelMeshes.push(room);

    // 10 soldiers
    for (var i = 0; i < 10; i++) {
      var sx = -12 + i * 2.5;
      var sol = _box(0.6, 1.8, 0.6, COLOR_SOLDIER, sx, -8.1, -5, _bunkerRoot);
      sol.userData.isSoldier  = true;
      sol.userData.alive      = true;
      sol.userData.hp         = 100;
      sol.userData.level      = 2;
      sol.userData.fireTimer  = 0;
      sol.userData.flashlight = false;
      _soldiers.push(sol);
    }

    // 2 officers (1.2x scale, different color)
    for (var j = 0; j < 2; j++) {
      var ox = -3 + j * 6;
      var off = _box(0.72, 2.16, 0.72, COLOR_OFFICER, ox, -7.92, -3, _bunkerRoot);
      off.scale.set(1.2, 1.2, 1.2);
      off.userData.isSoldier  = true;
      off.userData.isOfficer  = true;
      off.userData.alive      = true;
      off.userData.hp         = 180;
      off.userData.level      = 2;
      off.userData.fireTimer  = 0;
      off.userData.flashlight = false;
      _soldiers.push(off);
    }

    // Comms array 8x3x4
    var comms = _box(8, 3, 4, COLOR_COMMS, -8, -9, 5, _bunkerRoot);
    comms.userData.isComms   = true;
    comms.userData.virusDone = false;
    _allObjects.push(comms);

    // War table
    var wtable = _box(3, 0.5, 2, COLOR_WAR_TABLE, 4, -8.75, 5, _bunkerRoot);
    wtable.userData.isWarTable = true;
    _allObjects.push(wtable);

    // Map prop on war table
    var mapProp = _box(2.5, 0.05, 1.5, 0x667755, 4, -8.5, 5, _bunkerRoot);
    _allObjects.push(mapProp);

    // Steel door to vault
    var vaultDoor = _box(3, 4, 0.4, COLOR_VAULT_DOOR, 0, -8, 9, _bunkerRoot);
    vaultDoor.userData.isVaultDoor = true;
    vaultDoor.userData.locked      = true;
    _allObjects.push(vaultDoor);

    // Hack panel next to vault door
    var hackPanel = _box(0.6, 1.2, 0.2, COLOR_HACK_PANEL, 2, -9, 9, _bunkerRoot);
    hackPanel.userData.isHackPanel  = true;
    hackPanel.userData.empDisabled  = false;
    hackPanel.userData.solved       = false;
    _allObjects.push(hackPanel);

    // L2 lights
    var wl2 = new THREE.PointLight(0xFFFFCC, 1.2, 25);
    wl2.position.set(0, -8, 0);
    _bunkerRoot.add(wl2);
    _whiteLights.push(wl2);

    var rl2 = new THREE.PointLight(COLOR_ALERT_LIGHT, 0, 25);
    rl2.position.set(0, -8, 0);
    _bunkerRoot.add(rl2);
    _redLights.push(rl2);
  }

  function _buildL3() {
    // L3 vault room 30x5x20 at y = -15
    var room = _box(30, 5, 20, COLOR_CONCRETE, 0, -15, 0, _bunkerRoot);
    _levelMeshes.push(room);

    // 4 elite guards
    for (var i = 0; i < 4; i++) {
      var ex = -6 + i * 4;
      var eg = _box(0.6, 1.8, 0.6, COLOR_ELITE, ex, -13.1, 0, _bunkerRoot);
      eg.userData.isSoldier  = true;
      eg.userData.isElite    = true;
      eg.userData.alive      = true;
      eg.userData.hp         = 200;
      eg.userData.level      = 3;
      eg.userData.fireTimer  = 0;
      eg.userData.flashlight = false;
      _soldiers.push(eg);
    }

    // General (boss)
    _generalMesh = _box(0.8, 2.4, 0.8, COLOR_GENERAL, 0, -12.8, 7, _bunkerRoot);
    _generalMesh.userData.isGeneral = true;
    _generalMesh.userData.alive     = true;
    _generalMesh.userData.hp        = 500;
    _generalMesh.userData.fireTimer = 0;
    _allObjects.push(_generalMesh);

    // Nuclear codes on pedestal
    var pedestal = _box(0.8, 1.0, 0.8, 0x555555, 0, -14.5, 8, _bunkerRoot);
    _allObjects.push(pedestal);

    var codes = _box(0.5, 0.3, 0.3, COLOR_CODES, 0, -13.9, 8, _bunkerRoot);
    codes.userData.isCodes = true;
    codes.userData.taken   = false;
    // Make codes glow
    codes.material.emissive    = new THREE.Color(0xFFCC00);
    codes.material.emissiveIntensity = 0.6;
    _allObjects.push(codes);

    // L3 lights
    var wl3 = new THREE.PointLight(0xFFFFCC, 1.2, 25);
    wl3.position.set(0, -13, 0);
    _bunkerRoot.add(wl3);
    _whiteLights.push(wl3);

    var rl3 = new THREE.PointLight(COLOR_ALERT_LIGHT, 0, 25);
    rl3.position.set(0, -13, 0);
    _bunkerRoot.add(rl3);
    _redLights.push(rl3);
  }

  function _buildVentShaft() {
    // Ventilation shaft 2x2x15 running from L3 to surface
    var shaft = _box(2, 2, 15, COLOR_VENT, 8, -7.5, 0, _bunkerRoot);
    shaft.userData.isVentShaft = true;
    _allObjects.push(shaft);

    // Fan blades at mid-shaft (CylinderGeometry)
    var fan = _cyl(1.8, 0.1, 0.2, 6, COLOR_FAN, 8, -7.5, 0, _bunkerRoot);
    fan.userData.isFan       = true;
    fan.userData.spinAngle   = 0;
    fan.userData.spinRate    = Math.PI * 2 / FAN_PERIOD;
    _allObjects.push(fan);

    // Extraction zone at surface exit
    var extract = _box(4, 0.2, 4, COLOR_EXTRACT, 8, 0.1, 0, _bunkerRoot);
    extract.userData.isExtract = true;
    extract.material.emissive  = new THREE.Color(0x00FF44);
    extract.material.emissiveIntensity = 0.5;
    _allObjects.push(extract);
  }

  // ── Power cut ───────────────────────────────────────────
  function _cutPower() {
    if (_powerCut) return;
    _powerCut = true;
    for (var i = 0; i < _whiteLights.length; i++) {
      _whiteLights[i].intensity = 0;
    }
    for (var j = 0; j < _redLights.length; j++) {
      _redLights[j].intensity = 1.5;
    }
    // Enemies switch to flashlight mode
    for (var k = 0; k < _soldiers.length; k++) {
      if (_soldiers[k].userData.alive) {
        _soldiers[k].userData.flashlight = true;
      }
    }
  }

  // ── Alert system ────────────────────────────────────────
  function _raiseAlert(level) {
    if (level <= _alertLevel) return;
    _alertLevel = Math.min(3, level);
    if (_alertLevel >= 1 && !_powerCut) {
      // Flash reds briefly
      for (var i = 0; i < _redLights.length; i++) {
        _redLights[i].intensity = 0.6;
      }
    }
    _objectiveText = _getObjective();
  }

  function _getObjective() {
    if (!_doorBreached)       return 'Breach blast door';
    if (_currentLevel === 1) {
      if (!_powerCut)        return 'Destroy generator or reach L2';
      return 'Reach Level 2 command center';
    }
    if (_currentLevel === 2) {
      if (!_virusPlanted)    return 'Plant virus on comms array (E, 8s)';
      if (!_hackComplete)    return 'Hack vault panel (E, 15s)';
      return 'Descend to vault (Level 3)';
    }
    if (_currentLevel === 3) {
      if (!_generalDead)     return 'Eliminate General (500HP)';
      if (!_codesTaken)      return 'Steal nuclear codes (E)';
      return 'Escape via ventilation shaft';
    }
    if (_escaped)            return 'MISSION COMPLETE';
    return 'Escape to extraction zone';
  }

  // ── EMP ─────────────────────────────────────────────────
  function _throwEMP() {
    if (_empCharges <= 0 || _empActive) return;
    _empCharges--;
    _empActive = true;
    _empTimer  = 0;

    // Visual EMP sphere (box for simplicity)
    var empMesh = _box(0.4, 0.4, 0.4, COLOR_EMP, 3, 1, 2, _bunkerRoot);
    empMesh.userData.isEMP    = true;
    empMesh.material.emissive = new THREE.Color(0x4444FF);
    empMesh.material.emissiveIntensity = 1.0;
    _empObjects.push(empMesh);

    // Disable turrets
    for (var i = 0; i < _turrets.length; i++) {
      _turrets[i].userData.empDisabled = true;
    }

    // Disable hack panel
    for (var j = 0; j < _allObjects.length; j++) {
      if (_allObjects[j].userData.isHackPanel) {
        _allObjects[j].userData.empDisabled = true;
      }
    }

    _objectiveText = 'EMP active (' + Math.round(EMP_DURATION) + 's) - electronics disabled';
  }

  function _updateEMP(dt) {
    if (!_empActive) return;
    _empTimer += dt;
    if (_empTimer >= EMP_DURATION) {
      _empActive = false;
      // Re-enable turrets
      for (var i = 0; i < _turrets.length; i++) {
        _turrets[i].userData.empDisabled = false;
      }
      // Re-enable hack panel
      for (var j = 0; j < _allObjects.length; j++) {
        if (_allObjects[j].userData.isHackPanel && !_hackComplete) {
          _allObjects[j].userData.empDisabled = false;
        }
      }
      // Remove EMP visual
      for (var k = 0; k < _empObjects.length; k++) {
        _bunkerRoot.remove(_empObjects[k]);
        _scene.remove(_empObjects[k]);
      }
      _empObjects = [];
    }
  }

  // ── Reinforce ────────────────────────────────────────────
  function _spawnReinforcements() {
    // Convoy box on surface
    _box(6, 2, 3, 0x445544, 15, 1, 5, _bunkerRoot);

    // Drop 6 soldiers
    for (var i = 0; i < REINFORCE_COUNT; i++) {
      var rx = 12 + (i % 3) * 2;
      var rz = 4 + Math.floor(i / 3) * 2;
      var rsol = _box(0.6, 1.8, 0.6, COLOR_SOLDIER, rx, 0.9, rz, _bunkerRoot);
      rsol.userData.isSoldier  = true;
      rsol.userData.alive      = true;
      rsol.userData.hp         = 100;
      rsol.userData.level      = 1;
      rsol.userData.fireTimer  = 0;
      rsol.userData.flashlight = _powerCut;
      _soldiers.push(rsol);
    }
  }

  // ── Ventilation fans ────────────────────────────────────
  function _updateFans(dt) {
    _ventFanTimer += dt;
    if (_ventFanTimer >= FAN_PERIOD) _ventFanTimer -= FAN_PERIOD;

    // Fan is open during window [FAN_PERIOD - FAN_WINDOW, FAN_PERIOD]
    _ventFanOpen = (_ventFanTimer >= FAN_PERIOD - FAN_WINDOW);

    // Spin fan blades
    for (var i = 0; i < _allObjects.length; i++) {
      if (_allObjects[i].userData.isFan) {
        _allObjects[i].rotation.y += dt * Math.PI * 2;
      }
    }
  }

  // ── Key events ──────────────────────────────────────────
  function _onKeyDown(e) {
    var key = e.key ? e.key.toUpperCase() : '';

    // B+B activation
    if (key === 'B') {
      var now = Date.now();
      if (_keyBDown) {
        // Second B press
        if (now - _lastBPressTime <= 400) {
          if (!_active) _activate();
        }
      } else {
        _keyBDown       = true;
        _lastBPressTime = now;
      }
      return;
    }

    if (!_active) return;

    // E — context-sensitive interaction
    if (key === 'E') {
      _handleInteract();
    }

    // R — throw EMP
    if (key === 'R') {
      _throwEMP();
    }
  }

  function _onKeyUp(e) {
    var key = e.key ? e.key.toUpperCase() : '';
    if (key === 'B') {
      _keyBDown = false;
    }
    if (key === 'E') {
      _stopInteract();
    }
  }

  function _handleInteract() {
    // Priority: breach charge > virus plant > hack panel > codes > armory
    if (!_doorBreached && !_chargePlanting && !_chargePlanted) {
      _chargePlanting = true;
      _chargeProgress = 0;
      _objectiveText  = 'Planting breaching charge... (hold E 3s)';
      return;
    }
    if (_currentLevel === 2 && !_virusPlanted && !_virusPlanting) {
      _virusPlanting  = true;
      _virusProgress  = 0;
      _objectiveText  = 'Uploading virus to comms array... (8s)';
      return;
    }
    if (_currentLevel === 2 && _virusPlanted && !_hackComplete && !_hackingPanel) {
      // Check if EMP is active (disables panel)
      var panelDisabled = false;
      for (var i = 0; i < _allObjects.length; i++) {
        if (_allObjects[i].userData.isHackPanel && _allObjects[i].userData.empDisabled) {
          panelDisabled = true;
          break;
        }
      }
      if (!panelDisabled) {
        _hackingPanel = true;
        _hackProgress = 0;
        _objectiveText = 'Hacking vault door panel... (15s)';
      } else {
        _objectiveText = 'Hack panel is EMP-disabled!';
      }
      return;
    }
    if (_currentLevel === 3 && _generalDead && !_codesTaken) {
      _codesTaken    = true;
      _objectiveText = 'Codes secured! Escape via ventilation shaft';
      // Hide codes mesh
      for (var j = 0; j < _allObjects.length; j++) {
        if (_allObjects[j].userData.isCodes) {
          _allObjects[j].visible = false;
        }
      }
      return;
    }
    // Grab ammo from armory
    if (_currentLevel === 1) {
      for (var k = 0; k < _allObjects.length; k++) {
        if (_allObjects[k].userData.isArmory && !_allObjects[k].userData.used) {
          _allObjects[k].userData.used = true;
          _objectiveText = 'Extra ammo grabbed from armory!';
          // Could integrate with ammo system if available
          break;
        }
      }
    }
  }

  function _stopInteract() {
    if (_chargePlanting && !_chargePlanted) {
      // Release before completion resets
      _chargePlanting = false;
      _chargeProgress = 0;
      _objectiveText  = 'Breach blast door (hold E 3s)';
    }
    if (_virusPlanting && !_virusPlanted) {
      _virusPlanting  = false;
      _virusProgress  = 0;
      _objectiveText  = 'Plant virus on comms array (E, 8s)';
    }
    if (_hackingPanel && !_hackComplete) {
      _hackingPanel   = false;
      _hackProgress   = 0;
      _objectiveText  = 'Hack vault panel (E, 15s)';
    }
  }

  // ── Activation ──────────────────────────────────────────
  function _activate() {
    _active = true;
    _createHUD();
    _hudEl.style.display = 'block';

    // Spawn at camera look position
    var pos = new THREE.Vector3(0, 0, -20);
    if (_camera) pos.applyMatrix4(_camera.matrixWorld);
    pos.y = 0;

    _buildBunker(pos);
    _objectiveText = _getObjective();
  }

  // ── Turret auto-fire ────────────────────────────────────
  function _updateTurrets(dt) {
    for (var i = 0; i < _turrets.length; i++) {
      var t = _turrets[i];
      if (!t.userData.alive || t.userData.empDisabled) continue;
      t.userData.fireTimer += dt;
      if (t.userData.fireTimer >= t.userData.fireRate) {
        t.userData.fireTimer = 0;
        // Fire a tracer toward camera (player)
        _fireTurretShot(t);
      }
    }
  }

  function _fireTurretShot(turret) {
    // Visual tracer line
    var wp = new THREE.Vector3();
    turret.getWorldPosition(wp);
    var dir = new THREE.Vector3();
    if (_camera) {
      dir.copy(_camera.position).sub(wp).normalize();
    } else {
      dir.set(0, 0, -1);
    }
    var end = wp.clone().addScaledVector(dir, 15);

    var points  = [wp, end];
    var geo     = new THREE.BufferGeometry().setFromPoints(points);
    var mat     = new THREE.LineBasicMaterial({ color: 0xFF4400 });
    var tracer  = new THREE.Line(geo, mat);
    _scene.add(tracer);

    // Remove tracer after 0.15s via flag
    tracer.userData.isTracer = true;
    tracer.userData.life     = 0.15;
    _allObjects.push(tracer);
  }

  // ── Update ──────────────────────────────────────────────
  function _update(dt) {
    if (!_active) return;

    // Breaching charge plant
    if (_chargePlanting) {
      _chargeProgress += dt;
      if (_chargeProgress >= CHARGE_TIME) {
        _chargePlanting = false;
        _chargePlanted  = true;
        _objectiveText  = 'Charge planted — detonate (press E again)';
      }
    }

    // Auto-detonate planted charge (next E press handled by interact; auto after 2s)
    if (_chargePlanted && !_chargeDetonated) {
      _chargeProgress += dt;
      if (_chargeProgress >= CHARGE_TIME + 2.0) {
        _detonate();
      }
    }

    // Virus plant progress
    if (_virusPlanting) {
      _virusProgress += dt;
      if (_virusProgress >= VIRUS_TIME) {
        _virusPlanting  = false;
        _virusPlanted   = true;
        _objectiveText  = 'Virus planted! Now hack vault panel (E, 15s)';
        _raiseAlert(1);
      }
    }

    // Hack panel progress
    if (_hackingPanel) {
      _hackProgress += dt;
      if (_hackProgress >= HACK_TIME) {
        _hackingPanel = false;
        _hackComplete = true;
        _objectiveText = 'Vault unlocked! Descend to Level 3';
        // Open vault door
        for (var vi = 0; vi < _allObjects.length; vi++) {
          if (_allObjects[vi].userData.isVaultDoor) {
            _allObjects[vi].visible = false;
          }
        }
      }
    }

    // Turrets
    _updateTurrets(dt);

    // EMP
    _updateEMP(dt);

    // Fans
    _updateFans(dt);

    // Ventilation crawl
    if (_inVent) {
      _updateVent(dt);
    }

    // Tracer lifetime
    for (var ti = _allObjects.length - 1; ti >= 0; ti--) {
      var obj = _allObjects[ti];
      if (obj.userData.isTracer) {
        obj.userData.life -= dt;
        if (obj.userData.life <= 0) {
          _scene.remove(obj);
          if (_bunkerRoot) _bunkerRoot.remove(obj);
          _allObjects.splice(ti, 1);
        }
      }
    }

    // Soldier idle patrols (minimal: rotate to look threatening)
    for (var si = 0; si < _soldiers.length; si++) {
      var sol = _soldiers[si];
      if (!sol.userData.alive) continue;
      sol.userData.fireTimer += dt;
      if (sol.userData.fireTimer > 3.0) {
        sol.userData.fireTimer = 0;
        sol.rotation.y += 0.4;
      }
    }

    // Alert level 3: reinforcements
    if (_alertLevel >= 3) {
      _reinforcementTimer += dt;
      if (_reinforcementTimer >= REINFORCE_PERIOD) {
        _reinforcementTimer = 0;
        _spawnReinforcements();
      }
    }

    // Auto raise alert when soldiers die in groups
    var deadCount = _soldiers.filter(function (s) { return !s.userData.alive; }).length;
    if (deadCount >= 4  && _alertLevel < 1) _raiseAlert(1);
    if (deadCount >= 8  && _alertLevel < 2) _raiseAlert(2);
    if (deadCount >= 14 && _alertLevel < 3) _raiseAlert(3);

    // Check if general is dead
    if (_generalMesh && _generalMesh.userData.alive && _generalMesh.userData.hp <= 0) {
      _generalMesh.userData.alive = false;
      _generalDead = true;
      _objectiveText = 'General eliminated! Steal nuclear codes (E)';
    }

    _updateHUD();
  }

  function _detonate() {
    if (_chargeDetonated) return;
    _chargeDetonated = true;
    _doorBreached    = true;

    // Hide door, show gap
    if (_blastDoor)  _blastDoor.visible = false;
    if (_doorGap)    _doorGap.visible   = true;

    _raiseAlert(1);
    _objectiveText = 'Door breached! Descend to Level 1';
    _currentLevel  = 1;
  }

  // ── Vent navigation ─────────────────────────────────────
  function _enterVent() {
    if (!_codesTaken) {
      _objectiveText = 'Secure nuclear codes first!';
      return;
    }
    _inVent      = true;
    _ventProgress = 0;
    _objectiveText = 'Crawling through ventilation shaft...';
  }

  function _updateVent(dt) {
    // Fan timing check
    if (!_ventFanOpen) {
      // Fan is spinning — damage on entry
      _ventProgress += dt * 0.2; // slower when fan closed
    } else {
      _ventProgress += dt * 1.0; // 15s shaft at rate 1/15
    }

    // Wrong timing: fan not open but tried to rush
    if (!_ventFanOpen && _ventProgress > 0.4 && _ventProgress < 0.6) {
      // Apply fan damage hint (integrate with player health system if available)
      _objectiveText = 'Fan hit! -' + FAN_DAMAGE + ' HP — wait for timing window';
    }

    if (_ventProgress >= 1.0) {
      _inVent  = false;
      _escaped = true;
      _currentLevel = 0;
      _objectiveText = 'MISSION COMPLETE — Nuclear codes secured and escaped!';
      _raiseAlert(0); // reset (mission over)
    } else {
      var pct = Math.round(_ventProgress * 100);
      _objectiveText = 'Vent escape: ' + pct + '% | Fan ' + (_ventFanOpen ? 'OPEN — GO!' : 'CLOSED — wait...');
    }
  }

  // ── Public API ───────────────────────────────────────────
  function init(scene, camera, controls) {
    _scene    = scene;
    _camera   = camera;
    _controls = controls;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    _createHUD();
  }

  function update(dt) {
    _update(dt);
  }

  function reset() {
    // Remove all spawned objects
    for (var i = 0; i < _allObjects.length; i++) {
      if (_bunkerRoot) _bunkerRoot.remove(_allObjects[i]);
      _scene.remove(_allObjects[i]);
    }
    if (_bunkerRoot) _scene.remove(_bunkerRoot);

    for (var j = 0; j < _whiteLights.length; j++) {
      _scene.remove(_whiteLights[j]);
    }
    for (var k = 0; k < _redLights.length; k++) {
      _scene.remove(_redLights[k]);
    }

    // Remove HUD
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
    }

    // Reset state
    _active             = false;
    _keyBDown           = false;
    _lastBPressTime     = 0;
    _chargePlanting     = false;
    _chargeProgress     = 0;
    _chargePlanted      = false;
    _chargeDetonated    = false;
    _doorBreached       = false;
    _hackingPanel       = false;
    _hackProgress       = 0;
    _hackComplete       = false;
    _virusPlanting      = false;
    _virusProgress      = 0;
    _virusPlanted       = false;
    _currentLevel       = 1;
    _codesTaken         = false;
    _alertLevel         = 0;
    _alertTimer         = 0;
    _empCharges         = 2;
    _empActive          = false;
    _empTimer           = 0;
    _empObjects         = [];
    _powerCut           = false;
    _soldiers           = [];
    _soldiersKilled     = 0;
    _turrets            = [];
    _reinforcementTimer = 0;
    _inVent             = false;
    _ventProgress       = 0;
    _ventFanTimer       = 0;
    _ventFanOpen        = false;
    _escaped            = false;
    _generalHP          = 500;
    _generalMesh        = null;
    _generalDead        = false;
    _hudEl              = null;
    _objectiveText      = 'Breach blast door';
    _blastDoor          = null;
    _doorGap            = null;
    _turretMeshes       = [];
    _levelMeshes        = [];
    _allObjects         = [];
    _bunkerRoot         = null;
    _originPos          = null;
    _redLights          = [];
    _whiteLights        = [];

    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup',   _onKeyUp);
  }

  // Expose enter-vent for external trigger
  function enterVent() {
    _enterVent();
  }

  return {
    init:      init,
    update:    update,
    reset:     reset,
    enterVent: enterVent
  };
}());
