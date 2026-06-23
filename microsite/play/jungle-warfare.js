window.JungleWarfare = (function() {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    scene: null,
    camera: null,
    player: null,

    // Key tracking
    jKeyDown: false,
    wKeyDown: false,
    tKeyDown: false,
    mKeyDown: false,
    mouseDown: false,

    // Jungle objects
    canopyMeshes: [],
    bushClusters: [],
    waterStream: null,
    groundMesh: null,
    ambientLight: null,
    fogBackup: null,
    backgroundColorBackup: null,

    // Traps placed in world
    placedTraps: [],
    selectedTrapType: 0, // 0=tripwire,1=punji,2=noisecan
    trapTypes: ['TRIPWIRE', 'PUNJI', 'NOISE_CAN'],

    // Enemy NPC refs (set externally or via init)
    jungleEnemies: [],

    // Meters
    noiseMeter: 0,      // 0-100
    heatMeter: 0,       // 0-100
    concealed: false,

    // Machete
    macheteUses: 2,
    macheteRecharging: false,
    macheteRechargeTimer: 0,
    mWasPressedLastFrame: false,

    // Stamina slowdown flag (set by heat)
    staminaDebuff: false,

    // Punji stuck timer
    stuckTimer: 0,

    // Noise alert state
    noiseAlertTimer: 0,     // seconds remaining on noise-can alert
    noiseAlertAll: false,

    // Player state mirrors (read from player object or tracked locally)
    isCrouching: false,
    isRunning: false,
    playerHP: 100,

    // HUD
    hudElement: null,

    // Internals
    elapsedTime: 0
  };

  // ─── Constants ────────────────────────────────────────────────────────────
  var CANOPY_COUNT      = 30;
  var BUSH_COUNT        = 40;
  var NOISE_ENEMY_RANGE = 20;
  var CONCEALMENT_RANGE = 15;
  var CONCEALMENT_DIST  = 1.5;
  var HEAT_STROKE_HP    = -1;    // per second above 95
  var WATER_TEMP_RATE   = -5;    // per second
  var MACHETE_RANGE     = 3;
  var MACHETE_DAMAGE    = 80;
  var MACHETE_RECHARGE  = 5;     // seconds
  var TRIPWIRE_DAMAGE   = 30;
  var PUNJI_DAMAGE      = 40;
  var PUNJI_STUCK       = 3;     // seconds
  var NOISE_CAN_RANGE   = 30;
  var NOISE_CAN_ALERT   = 20;    // seconds alert duration

  // ─── Keyboard Handlers ───────────────────────────────────────────────────
  function onKeyDown(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    if (key === 'j') { state.jKeyDown = true; }
    if (key === 'w') { state.wKeyDown = true; }
    if (key === 't') { state.tKeyDown = true; }
    if (key === 'm') { state.mKeyDown = true; }
    if (key === 'shift') { state.isRunning = true; }
    if (key === 'control') { state.isCrouching = true; }

    // J+W toggles jungle mode
    if (state.jKeyDown && state.wKeyDown) {
      if (state.active) { deactivateJungle(); } else { activateJungle(); }
    }
    // T cycles trap type (single press) - only if not held from before
    if (key === 't' && !state.tKeyDown) {
      state.selectedTrapType = (state.selectedTrapType + 1) % 3;
    }
    // M key - machete
    if (key === 'm' && !state.mWasPressedLastFrame) {
      useMachete();
    }
  }

  function onKeyUp(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    if (key === 'j') { state.jKeyDown = false; }
    if (key === 'w') { state.wKeyDown = false; }
    if (key === 't') { state.tKeyDown = false; }
    if (key === 'm') {
      state.mKeyDown = false;
      state.mWasPressedLastFrame = false;
    }
    if (key === 'shift') { state.isRunning = false; }
    if (key === 'control') { state.isCrouching = false; }
  }

  function onMouseDown(e) {
    state.mouseDown = true;
    // T held + click = place trap
    if (state.tKeyDown && state.active) {
      placeTrap();
    }
  }

  function onMouseUp(e) {
    state.mouseDown = false;
  }

  // ─── Jungle Activation ───────────────────────────────────────────────────
  function activateJungle() {
    if (!state.scene) { return; }
    state.active = true;

    // Backup and set fog
    state.fogBackup = state.scene.fog;
    state.scene.fog = new THREE.FogExp2(0x1A3A1A, 0.025);

    // Ambient light
    state.ambientLight = new THREE.AmbientLight(0x224422, 1.0);
    state.scene.add(state.ambientLight);

    // Ground
    buildGround();

    // Canopy
    buildCanopy();

    // Undergrowth
    buildUndergrowth();

    // Water stream
    buildWaterStream();

    // Booby traps (initial set)
    buildBoobyTraps();
  }

  function deactivateJungle() {
    if (!state.scene) { return; }
    state.active = false;

    // Restore fog
    state.scene.fog = state.fogBackup;

    // Remove ambient light
    if (state.ambientLight) {
      state.scene.remove(state.ambientLight);
      state.ambientLight = null;
    }

    // Remove ground
    if (state.groundMesh) {
      state.scene.remove(state.groundMesh);
      state.groundMesh = null;
    }

    // Remove canopy
    var i;
    for (i = 0; i < state.canopyMeshes.length; i++) {
      state.scene.remove(state.canopyMeshes[i]);
    }
    state.canopyMeshes = [];

    // Remove bush clusters
    for (i = 0; i < state.bushClusters.length; i++) {
      state.scene.remove(state.bushClusters[i].group);
    }
    state.bushClusters = [];

    // Remove water stream
    if (state.waterStream) {
      state.scene.remove(state.waterStream);
      state.waterStream = null;
    }

    // Remove placed traps
    for (i = 0; i < state.placedTraps.length; i++) {
      if (state.placedTraps[i].object) {
        state.scene.remove(state.placedTraps[i].object);
      }
    }
    state.placedTraps = [];

    // Reset meters
    state.noiseMeter = 0;
    state.heatMeter = 0;
    state.concealed = false;
    state.stuckTimer = 0;

    updateHUD();
  }

  // ─── Scene Builders ──────────────────────────────────────────────────────
  function buildGround() {
    var geo = new THREE.BoxGeometry(200, 0.5, 200);
    var mat = new THREE.MeshLambertMaterial({ color: 0x2D5A1B });
    state.groundMesh = new THREE.Mesh(geo, mat);
    state.groundMesh.position.set(0, -0.25, 0);
    state.groundMesh.receiveShadow = true;
    state.scene.add(state.groundMesh);
  }

  function buildCanopy() {
    var i;
    for (i = 0; i < CANOPY_COUNT; i++) {
      var geo = new THREE.BoxGeometry(10, 0.3, 10);
      var mat = new THREE.MeshLambertMaterial({
        color: 0x1A4A0A,
        transparent: true,
        opacity: 0.7
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 160,
        12 + Math.random() * 6,   // Y 12–18
        (Math.random() - 0.5) * 160
      );
      state.scene.add(mesh);
      state.canopyMeshes.push(mesh);
    }
  }

  function buildUndergrowth() {
    var i, j;
    for (i = 0; i < BUSH_COUNT; i++) {
      var group = new THREE.Group();
      var cx = (Math.random() - 0.5) * 160;
      var cz = (Math.random() - 0.5) * 160;
      group.position.set(cx, 0, cz);

      var sphereCount = 3;
      for (j = 0; j < sphereCount; j++) {
        var r = 0.5 + Math.random() * 0.7;  // 0.5-1.2
        var geo = new THREE.SphereGeometry(r, 6, 6);
        var mat = new THREE.MeshLambertMaterial({ color: 0x2D5A1B });
        var sphere = new THREE.Mesh(geo, mat);
        sphere.position.set(
          (Math.random() - 0.5) * 1.5,
          r,
          (Math.random() - 0.5) * 1.5
        );
        group.add(sphere);
      }

      state.scene.add(group);
      state.bushClusters.push({
        group: group,
        x: cx,
        z: cz,
        radius: 1.5
      });
    }
  }

  function buildWaterStream() {
    var geo = new THREE.BoxGeometry(20, 0.2, 3);
    var mat = new THREE.MeshLambertMaterial({
      color: 0x224466,
      transparent: true,
      opacity: 0.7
    });
    state.waterStream = new THREE.Mesh(geo, mat);
    state.waterStream.position.set(10, 0.01, 0);
    state.scene.add(state.waterStream);
  }

  function buildBoobyTraps() {
    // Pre-place one of each type as examples
    placeSpecificTrap('TRIPWIRE', -10, 0, -15);
    placeSpecificTrap('PUNJI',     15, 0,  10);
    placeSpecificTrap('NOISE_CAN', -20, 0, 5);
  }

  // ─── Trap Placement ──────────────────────────────────────────────────────
  function placeTrap() {
    if (!state.player) { return; }
    var px = state.player.position.x;
    var pz = state.player.position.z;
    var type = state.trapTypes[state.selectedTrapType];
    placeSpecificTrap(type, px, 0, pz);
  }

  function placeSpecificTrap(type, x, y, z) {
    var trapObj = null;
    var group = new THREE.Group();
    group.position.set(x, y, z);

    if (type === 'TRIPWIRE') {
      trapObj = buildTripwireObject(group);
    } else if (type === 'PUNJI') {
      trapObj = buildPunjiObject(group);
    } else if (type === 'NOISE_CAN') {
      trapObj = buildNoiseCanObject(group);
    }

    state.scene.add(group);
    state.placedTraps.push({
      type: type,
      object: group,
      x: x,
      z: z,
      triggered: false,
      shrapnel: null
    });
  }

  function buildTripwireObject(group) {
    var points = [
      new THREE.Vector3(-1, 0.1, 0),
      new THREE.Vector3(1, 0.1, 0)
    ];
    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({ color: 0x888800 });
    var wire = new THREE.LineSegments(geo, mat);
    group.add(wire);
    return wire;
  }

  function buildPunjiObject(group) {
    // Pit
    var pitGeo = new THREE.BoxGeometry(2, 1, 2);
    var pitMat = new THREE.MeshLambertMaterial({ color: 0x1A1A00 });
    var pit = new THREE.Mesh(pitGeo, pitMat);
    pit.position.set(0, -0.5, 0);
    group.add(pit);

    // Leaf cover
    var leafGeo = new THREE.SphereGeometry(1.1, 8, 8);
    var leafMat = new THREE.MeshLambertMaterial({
      color: 0x2D5A1B,
      transparent: true,
      opacity: 0.6
    });
    var leaves = new THREE.Mesh(leafGeo, leafMat);
    leaves.position.set(0, 0, 0);
    leaves.scale.set(1, 0.2, 1);
    group.add(leaves);

    return pit;
  }

  function buildNoiseCanObject(group) {
    // Wire
    var wPoints = [
      new THREE.Vector3(-1.5, 0.15, 0),
      new THREE.Vector3(1.5, 0.15, 0)
    ];
    var wGeo = new THREE.BufferGeometry().setFromPoints(wPoints);
    var wMat = new THREE.LineBasicMaterial({ color: 0xAAAAAA });
    var wire = new THREE.LineSegments(wGeo, wMat);
    group.add(wire);

    // 3 cans
    var i;
    for (i = 0; i < 3; i++) {
      var canGeo = new THREE.BoxGeometry(0.15, 0.2, 0.15);
      var canMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
      var can = new THREE.Mesh(canGeo, canMat);
      can.position.set(-1 + i, 0.1, 0);
      group.add(can);
    }

    return wire;
  }

  // ─── Trap Triggering ─────────────────────────────────────────────────────
  function checkTrapTriggers() {
    if (!state.player) { return; }
    var px = state.player.position.x;
    var pz = state.player.position.z;
    var i;

    for (i = 0; i < state.placedTraps.length; i++) {
      var trap = state.placedTraps[i];
      if (trap.triggered) { continue; }

      var dx = px - trap.x;
      var dz = pz - trap.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (trap.type === 'TRIPWIRE' && dist < 1.2) {
        triggerTripwire(trap);
      } else if (trap.type === 'PUNJI' && dist < 1.0) {
        triggerPunji(trap);
      } else if (trap.type === 'NOISE_CAN' && dist < 0.5) {
        triggerNoiseCan(trap);
      }
    }
  }

  function triggerTripwire(trap) {
    trap.triggered = true;
    // Damage player
    state.playerHP = Math.max(0, state.playerHP - TRIPWIRE_DAMAGE);
    if (state.player && state.player.hp !== undefined) {
      state.player.hp = state.playerHP;
    }
    // Spawn 6 shrapnel cubes
    spawnShrapnel(trap.x, 0.5, trap.z, 6);
    // Remove wire visual
    if (trap.object) { state.scene.remove(trap.object); }
    showJungleMessage('TRIPWIRE! -' + TRIPWIRE_DAMAGE + ' HP');
  }

  function triggerPunji(trap) {
    trap.triggered = true;
    state.playerHP = Math.max(0, state.playerHP - PUNJI_DAMAGE);
    if (state.player && state.player.hp !== undefined) {
      state.player.hp = state.playerHP;
    }
    state.stuckTimer = PUNJI_STUCK;
    if (trap.object) { state.scene.remove(trap.object); }
    showJungleMessage('PUNJI PIT! -' + PUNJI_DAMAGE + ' HP | STUCK 3s');
  }

  function triggerNoiseCan(trap) {
    trap.triggered = true;
    state.noiseAlertAll = true;
    state.noiseAlertTimer = NOISE_CAN_ALERT;
    state.noiseMeter = 100;
    // Alert enemies within 30 units
    alertEnemiesInRange(NOISE_CAN_RANGE);
    if (trap.object) { state.scene.remove(trap.object); }
    showJungleMessage('NOISE CAN! All enemies alerted for 20s!');
  }

  function spawnShrapnel(ox, oy, oz, count) {
    var i;
    for (i = 0; i < count; i++) {
      var geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      var mat = new THREE.MeshLambertMaterial({ color: 0xAA8800 });
      var shard = new THREE.Mesh(geo, mat);
      shard.position.set(ox, oy, oz);
      shard.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        Math.random() * 6 + 2,
        (Math.random() - 0.5) * 8
      );
      shard.userData.life = 1.5;
      state.scene.add(shard);
      // Store for update tick cleanup
      if (!state._shrapnel) { state._shrapnel = []; }
      state._shrapnel.push(shard);
    }
  }

  function updateShrapnel(delta) {
    if (!state._shrapnel) { return; }
    var i;
    var toRemove = [];
    for (i = 0; i < state._shrapnel.length; i++) {
      var shard = state._shrapnel[i];
      shard.userData.life -= delta;
      shard.position.x += shard.userData.velocity.x * delta;
      shard.position.y += shard.userData.velocity.y * delta;
      shard.position.z += shard.userData.velocity.z * delta;
      shard.userData.velocity.y -= 9.8 * delta; // gravity
      if (shard.userData.life <= 0) {
        state.scene.remove(shard);
        toRemove.push(i);
      }
    }
    for (i = toRemove.length - 1; i >= 0; i--) {
      state._shrapnel.splice(toRemove[i], 1);
    }
  }

  // ─── Enemy Alerting ──────────────────────────────────────────────────────
  function alertEnemiesInRange(range) {
    if (!state.player) { return; }
    var px = state.player.position.x;
    var pz = state.player.position.z;
    var i;
    for (i = 0; i < state.jungleEnemies.length; i++) {
      var enemy = state.jungleEnemies[i];
      if (!enemy || !enemy.position) { continue; }
      var dx = enemy.position.x - px;
      var dz = enemy.position.z - pz;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= range) {
        if (enemy.alerted !== undefined) { enemy.alerted = true; }
        if (enemy.alert !== undefined) { enemy.alert = true; }
      }
    }
  }

  // ─── Bush Interaction ────────────────────────────────────────────────────
  function getPlayerBushState() {
    if (!state.player) {
      return { inBush: false, nearBush: false };
    }
    var px = state.player.position.x;
    var pz = state.player.position.z;
    var inBush = false;
    var nearBush = false;
    var i;
    for (i = 0; i < state.bushClusters.length; i++) {
      var b = state.bushClusters[i];
      var dx = px - b.x;
      var dz = pz - b.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < b.radius) { inBush = true; }
      if (dist < CONCEALMENT_DIST) { nearBush = true; }
    }
    return { inBush: inBush, nearBush: nearBush };
  }

  function isInWaterStream() {
    if (!state.waterStream || !state.player) { return false; }
    var wp = state.waterStream.position;
    var pp = state.player.position;
    // BoxGeometry 20x0.2x3 centered at waterStream.position
    return (
      Math.abs(pp.x - wp.x) < 10 &&
      Math.abs(pp.z - wp.z) < 1.5
    );
  }

  // ─── Noise Meter ─────────────────────────────────────────────────────────
  function updateNoiseMeter(delta, inBush) {
    var prev = state.noiseMeter;

    if (inBush && state.isRunning) {
      // Crashing through — noise rises
      state.noiseMeter = Math.min(100, state.noiseMeter + 30 * delta);
    } else if (inBush && !state.isCrouching) {
      // Walking through — moderate rise
      state.noiseMeter = Math.min(100, state.noiseMeter + 10 * delta);
    } else if (state.isCrouching || !state.isRunning) {
      // Crouching/walking — falls
      state.noiseMeter = Math.max(0, state.noiseMeter - 15 * delta);
    }

    // Water resets noise
    if (isInWaterStream()) {
      state.noiseMeter = Math.max(0, state.noiseMeter - 60 * delta);
    }

    // Noise can alert overrides
    if (state.noiseAlertAll) {
      state.noiseMeter = 100;
    }

    // Alert enemies if >70
    if (state.noiseMeter > 70) {
      alertEnemiesInRange(NOISE_ENEMY_RANGE);
    }
  }

  // ─── Heat Meter ──────────────────────────────────────────────────────────
  function updateHeatMeter(delta) {
    // Always climbs in jungle
    state.heatMeter = Math.min(100, state.heatMeter + 1 * delta);

    // Water cools
    if (isInWaterStream()) {
      state.heatMeter = Math.max(0, state.heatMeter + WATER_TEMP_RATE * delta);
    }

    // Stamina debuff above 80
    state.staminaDebuff = state.heatMeter > 80;

    // Heat stroke above 95
    if (state.heatMeter > 95) {
      state.playerHP = Math.max(0, state.playerHP + HEAT_STROKE_HP * delta);
      if (state.player && state.player.hp !== undefined) {
        state.player.hp = state.playerHP;
      }
    }
  }

  // ─── Concealment ─────────────────────────────────────────────────────────
  function updateConcealment(nearBush) {
    state.concealed = nearBush && state.isCrouching;
    // If concealed, enemies within 15 units cannot target player
    if (state.concealed && state.player) {
      var px = state.player.position.x;
      var pz = state.player.position.z;
      var i;
      for (i = 0; i < state.jungleEnemies.length; i++) {
        var enemy = state.jungleEnemies[i];
        if (!enemy || !enemy.position) { continue; }
        var dx = enemy.position.x - px;
        var dz = enemy.position.z - pz;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < CONCEALMENT_RANGE) {
          if (enemy.canTarget !== undefined) { enemy.canTarget = false; }
          if (enemy.targetLocked !== undefined) { enemy.targetLocked = false; }
        }
      }
    }
  }

  // ─── Machete ─────────────────────────────────────────────────────────────
  function useMachete() {
    if (!state.active) { return; }
    if (state.macheteUses <= 0) { return; }
    state.macheteUses--;
    state.mWasPressedLastFrame = true;

    if (!state.player) { return; }
    var px = state.player.position.x;
    var pz = state.player.position.z;
    var i;
    var removed = 0;

    // Remove bush clusters within 3 units
    var toRemove = [];
    for (i = 0; i < state.bushClusters.length; i++) {
      var b = state.bushClusters[i];
      var dx = px - b.x;
      var dz = pz - b.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < MACHETE_RANGE) {
        state.scene.remove(b.group);
        toRemove.push(i);
        removed++;
      }
    }
    for (i = toRemove.length - 1; i >= 0; i--) {
      state.bushClusters.splice(toRemove[i], 1);
    }

    // Melee damage to nearby enemies
    for (i = 0; i < state.jungleEnemies.length; i++) {
      var enemy = state.jungleEnemies[i];
      if (!enemy || !enemy.position) { continue; }
      var edx = enemy.position.x - px;
      var edz = enemy.position.z - pz;
      var edist = Math.sqrt(edx * edx + edz * edz);
      if (edist < MACHETE_RANGE) {
        if (enemy.hp !== undefined) {
          enemy.hp = Math.max(0, enemy.hp - MACHETE_DAMAGE);
        }
        if (enemy.takeDamage !== undefined) {
          enemy.takeDamage(MACHETE_DAMAGE);
        }
      }
    }

    showJungleMessage('MACHETE! Uses left: ' + state.macheteUses + ' | Cleared: ' + removed + ' bush(es)');

    // Start recharge if out
    if (state.macheteUses <= 0 && !state.macheteRecharging) {
      state.macheteRecharging = true;
      state.macheteRechargeTimer = MACHETE_RECHARGE;
    }
  }

  function updateMachete(delta) {
    if (state.macheteRecharging) {
      state.macheteRechargeTimer -= delta;
      if (state.macheteRechargeTimer <= 0) {
        state.macheteUses = 2;
        state.macheteRecharging = false;
        showJungleMessage('Machete recharged!');
      }
    }
  }

  // ─── Speed Modifiers ─────────────────────────────────────────────────────
  function getSpeedMultiplier(inBush) {
    if (state.stuckTimer > 0) { return 0; }
    var mult = 1.0;
    if (inBush && state.isCrouching) {
      mult *= 0.4; // 40% speed when crouching through bush
    }
    // running through bush is normal speed (no penalty) but adds noise (handled above)
    return mult;
  }

  // Apply speed modifier to player if it has a speedMultiplier property
  function applySpeedModifier(inBush) {
    if (!state.player) { return; }
    var mult = getSpeedMultiplier(inBush);
    if (state.player.speedMultiplier !== undefined) {
      state.player.speedMultiplier = mult;
    }
    if (state.player.staminaRegenRate !== undefined && state.staminaDebuff) {
      state.player.staminaRegenRate = state.player.baseStaminaRegenRate * 0.5;
    } else if (state.player.staminaRegenRate !== undefined && !state.staminaDebuff) {
      state.player.staminaRegenRate = state.player.baseStaminaRegenRate || state.player.staminaRegenRate;
    }
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────
  function createHUD() {
    if (state.hudElement) { return; }
    var el = document.createElement('div');
    el.id = 'jungle-hud';
    el.style.position = 'fixed';
    el.style.top = '16px';
    el.style.right = '16px';
    el.style.color = '#00FF44';
    el.style.fontFamily = 'monospace';
    el.style.fontSize = '13px';
    el.style.background = 'rgba(0,0,0,0.55)';
    el.style.padding = '6px 12px';
    el.style.borderRadius = '4px';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '9999';
    el.style.whiteSpace = 'nowrap';
    el.style.display = 'none';
    document.body.appendChild(el);
    state.hudElement = el;
  }

  function updateHUD() {
    if (!state.hudElement) { return; }
    if (!state.active) {
      state.hudElement.style.display = 'none';
      return;
    }
    state.hudElement.style.display = 'block';
    var noiseVal = Math.round(state.noiseMeter);
    var heatVal  = Math.round(state.heatMeter);
    var concStr  = state.concealed ? 'YES' : 'NO';
    var trapsSet = state.placedTraps.length;
    var trapName = state.trapTypes[state.selectedTrapType];
    state.hudElement.textContent =
      'JUNGLE [NOISE: ' + noiseVal + '%] [HEAT: ' + heatVal + '%] ' +
      '[CONCEALED: ' + concStr + '] | TRAPS SET: ' + trapsSet +
      ' | NEXT: ' + trapName +
      ' | MACHETE: ' + state.macheteUses + '/2';
  }

  // ─── Temporary Messages ───────────────────────────────────────────────────
  var _msgEl = null;
  var _msgTimer = 0;

  function showJungleMessage(text) {
    if (!_msgEl) {
      _msgEl = document.createElement('div');
      _msgEl.style.position = 'fixed';
      _msgEl.style.bottom = '80px';
      _msgEl.style.left = '50%';
      _msgEl.style.transform = 'translateX(-50%)';
      _msgEl.style.color = '#FFFF44';
      _msgEl.style.fontFamily = 'monospace';
      _msgEl.style.fontSize = '15px';
      _msgEl.style.fontWeight = 'bold';
      _msgEl.style.background = 'rgba(0,0,0,0.7)';
      _msgEl.style.padding = '8px 18px';
      _msgEl.style.borderRadius = '4px';
      _msgEl.style.pointerEvents = 'none';
      _msgEl.style.zIndex = '10000';
      document.body.appendChild(_msgEl);
    }
    _msgEl.textContent = text;
    _msgEl.style.display = 'block';
    _msgTimer = 2.5;
  }

  function updateMessages(delta) {
    if (_msgEl && _msgTimer > 0) {
      _msgTimer -= delta;
      if (_msgTimer <= 0) {
        _msgEl.style.display = 'none';
      }
    }
  }

  // ─── Noise-can Alert Timer ────────────────────────────────────────────────
  function updateNoiseAlert(delta) {
    if (state.noiseAlertTimer > 0) {
      state.noiseAlertTimer -= delta;
      if (state.noiseAlertTimer <= 0) {
        state.noiseAlertAll = false;
        state.noiseAlertTimer = 0;
      }
    }
  }

  // ─── Enemy Speed Modifiers ────────────────────────────────────────────────
  function updateEnemySpeeds() {
    if (!state.active) { return; }
    var i, j;
    for (i = 0; i < state.jungleEnemies.length; i++) {
      var enemy = state.jungleEnemies[i];
      if (!enemy || !enemy.position) { continue; }

      // Determine if enemy is in a bush
      var inBush = false;
      for (j = 0; j < state.bushClusters.length; j++) {
        var b = state.bushClusters[j];
        var dx = enemy.position.x - b.x;
        var dz = enemy.position.z - b.z;
        if (Math.sqrt(dx * dx + dz * dz) < b.radius) {
          inBush = true;
          break;
        }
      }

      // Jungle enemies: 50% faster base, but slow in bushes
      var baseBoost = 1.5;
      var bushPenalty = inBush ? 0.5 : 1.0;
      if (enemy.jungleSpeedMultiplier !== undefined) {
        enemy.jungleSpeedMultiplier = baseBoost * bushPenalty;
      } else if (enemy.speedMultiplier !== undefined) {
        enemy.speedMultiplier = baseBoost * bushPenalty;
      }
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  function init(scene, camera, player) {
    state.scene  = scene;
    state.camera = camera;
    state.player = player;

    if (player) {
      state.playerHP = (player.hp !== undefined) ? player.hp : 100;
    }

    // HUD
    createHUD();

    // Keyboard / mouse events
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup',   onKeyUp,   false);
    document.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mouseup',   onMouseUp,   false);

    updateHUD();
  }

  function update(delta) {
    if (!delta || delta <= 0) { delta = 0.016; }
    state.elapsedTime += delta;

    // Update messages regardless
    updateMessages(delta);

    if (!state.active) { return; }

    // Sync player reference HP
    if (state.player && state.player.hp !== undefined) {
      state.playerHP = state.player.hp;
    }

    // Stuck timer countdown
    if (state.stuckTimer > 0) {
      state.stuckTimer = Math.max(0, state.stuckTimer - delta);
      if (state.player && state.player.speedMultiplier !== undefined) {
        state.player.speedMultiplier = 0;
      }
    }

    // Bush state
    var bushState = getPlayerBushState();

    // Meters
    updateNoiseMeter(delta, bushState.inBush);
    updateHeatMeter(delta);

    // Concealment
    updateConcealment(bushState.nearBush);

    // Speed modifier
    applySpeedModifier(bushState.inBush);

    // Trap triggers
    checkTrapTriggers();

    // Machete recharge
    updateMachete(delta);

    // Enemy speeds
    updateEnemySpeeds();

    // Noise alert timer
    updateNoiseAlert(delta);

    // Shrapnel physics
    updateShrapnel(delta);

    // HUD
    updateHUD();
  }

  function reset() {
    // Deactivate if active
    if (state.active) { deactivateJungle(); }

    // Remove event listeners
    document.removeEventListener('keydown', onKeyDown, false);
    document.removeEventListener('keyup',   onKeyUp,   false);
    document.removeEventListener('mousedown', onMouseDown, false);
    document.removeEventListener('mouseup',   onMouseUp,   false);

    // Remove HUD
    if (state.hudElement && state.hudElement.parentNode) {
      state.hudElement.parentNode.removeChild(state.hudElement);
      state.hudElement = null;
    }
    if (_msgEl && _msgEl.parentNode) {
      _msgEl.parentNode.removeChild(_msgEl);
      _msgEl = null;
    }

    // Reset state
    state.active          = false;
    state.jKeyDown        = false;
    state.wKeyDown        = false;
    state.tKeyDown        = false;
    state.mKeyDown        = false;
    state.noiseMeter      = 0;
    state.heatMeter       = 0;
    state.concealed       = false;
    state.stuckTimer      = 0;
    state.noiseAlertTimer = 0;
    state.noiseAlertAll   = false;
    state.macheteUses     = 2;
    state.macheteRecharging   = false;
    state.macheteRechargeTimer = 0;
    state.selectedTrapType    = 0;
    state.placedTraps     = [];
    state.jungleEnemies   = [];
    state.canopyMeshes    = [];
    state.bushClusters    = [];
    state.waterStream     = null;
    state.groundMesh      = null;
    state.ambientLight    = null;
    state._shrapnel       = [];
    state.elapsedTime     = 0;
    state.playerHP        = 100;
    state.staminaDebuff   = false;
    _msgTimer             = 0;
  }

  return {
    init:   init,
    update: update,
    reset:  reset,
    // Expose for external systems
    getState: function() { return state; },
    addEnemy: function(enemy) { state.jungleEnemies.push(enemy); },
    removeEnemy: function(enemy) {
      var idx = state.jungleEnemies.indexOf(enemy);
      if (idx !== -1) { state.jungleEnemies.splice(idx, 1); }
    }
  };
})();
