window.SiegeEngine = (function () {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────
  var scene = null;
  var camera = null;

  var TOOL_TYPES = { RAM: 'RAM', LADDER: 'LADDER', SHIELD: 'SHIELD' };
  var selectedTool = TOOL_TYPES.RAM;           // currently selected tool (V cycles)
  var deployedItems = [];                       // { type, mesh, hp, maxHp, data }
  var score = 0;

  var keysDown = {};                            // tracks pressed keys
  var hudEl = null;                             // HUD DOM element
  var siegeModeActive = false;
  var playerPosition = null;                    // THREE.Vector3 ref injected by update caller

  // Physics helpers for ram roll
  var RAM_ROLL_SPEED = 5;
  var LADDER_MAX_HEIGHT = 8;

  // ─── Material cache ───────────────────────────────────────────────────────
  var matCache = {};
  function getMat(hex, rough) {
    var key = hex + '_' + rough;
    if (!matCache[key]) {
      matCache[key] = new THREE.MeshStandardMaterial({
        color: hex,
        roughness: rough !== undefined ? rough : 0.6,
        metalness: 0.4
      });
    }
    return matCache[key];
  }

  // ─── Mesh builders ────────────────────────────────────────────────────────

  function buildBatteringRamMesh() {
    var group = new THREE.Group();

    // Main cylinder body (thick, horizontal along Z)
    var bodyGeo = new THREE.CylinderGeometry(0.45, 0.45, 4.0, 16);
    var bodyMat = getMat(0x555555, 0.5);
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2;   // lay it on its side (along X axis)
    body.position.set(0, 0.8, 0);
    group.add(body);

    // Front impact plate (darker metal disc)
    var plateGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
    var plateMat = getMat(0x222222, 0.8);
    var plate = new THREE.Mesh(plateGeo, plateMat);
    plate.rotation.z = Math.PI / 2;
    plate.position.set(2.1, 0.8, 0);
    group.add(plate);

    // Left handle bar
    var handleGeo = new THREE.CylinderGeometry(0.07, 0.07, 1.2, 8);
    var handleMat = getMat(0x888888, 0.7);
    var handleL = new THREE.Mesh(handleGeo, handleMat);
    handleL.position.set(0, 1.5, -0.7);
    group.add(handleL);

    // Right handle bar
    var handleR = new THREE.Mesh(handleGeo, handleMat);
    handleR.position.set(0, 1.5, 0.7);
    group.add(handleR);

    // Wheel axle (horizontal rod under body)
    var axleGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.6, 8);
    var axleMat = getMat(0x666666, 0.6);
    var axleFront = new THREE.Mesh(axleGeo, axleMat);
    axleFront.rotation.x = Math.PI / 2;
    axleFront.position.set(1.5, 0.25, 0);
    group.add(axleFront);

    var axleBack = new THREE.Mesh(axleGeo, axleMat);
    axleBack.rotation.x = Math.PI / 2;
    axleBack.position.set(-1.5, 0.25, 0);
    group.add(axleBack);

    // Four wheels
    var wheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 12);
    var wheelMat = getMat(0x333333, 0.9);
    var wheelPositions = [
      [1.5, 0.25, -1.2],
      [1.5, 0.25,  1.2],
      [-1.5, 0.25, -1.2],
      [-1.5, 0.25,  1.2]
    ];
    for (var i = 0; i < wheelPositions.length; i++) {
      var wh = new THREE.Mesh(wheelGeo, wheelMat);
      wh.rotation.x = Math.PI / 2;
      wh.position.set(wheelPositions[i][0], wheelPositions[i][1], wheelPositions[i][2]);
      group.add(wh);
    }

    return group;
  }

  function buildLadderMesh(height) {
    var group = new THREE.Group();
    var h = height || 2;

    var poleMat = getMat(0x8B6914, 0.8);
    var rungMat = getMat(0xA0784C, 0.7);

    // Left vertical pole
    var poleGeo = new THREE.CylinderGeometry(0.06, 0.06, h, 8);
    var poleL = new THREE.Mesh(poleGeo, poleMat);
    poleL.position.set(-0.35, h / 2, 0);
    group.add(poleL);

    // Right vertical pole
    var poleR = new THREE.Mesh(poleGeo, poleMat);
    poleR.position.set(0.35, h / 2, 0);
    group.add(poleR);

    // Rungs every 0.8 units
    var rungGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6);
    var rungCount = Math.floor(h / 0.8);
    for (var r = 0; r <= rungCount; r++) {
      var rung = new THREE.Mesh(rungGeo, rungMat);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(0, r * 0.8 + 0.2, 0);
      group.add(rung);
    }

    return group;
  }

  function buildShieldWallMesh() {
    var group = new THREE.Group();

    // Main plate: 4 wide × 2.5 tall × 0.3 deep
    var plateGeo = new THREE.BoxGeometry(4.0, 2.5, 0.3);
    var plateMat = getMat(0x4A5568, 0.4);
    var plate = new THREE.Mesh(plateGeo, plateMat);
    // Tilt forward slightly (top leans forward toward enemy)
    plate.rotation.x = 0.12;
    plate.position.set(0, 1.25, 0);
    group.add(plate);

    // Rivets / reinforcement strips (decorative)
    var stripGeo = new THREE.BoxGeometry(0.08, 2.4, 0.05);
    var stripMat = getMat(0x2D3748, 0.3);
    for (var s = -1; s <= 1; s++) {
      var strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.set(s * 1.3, 1.25, 0.18);
      group.add(strip);
    }

    // Bottom feet/stabilizers
    var footGeo = new THREE.BoxGeometry(0.4, 0.15, 0.8);
    var footMat = getMat(0x333333, 0.7);
    var footL = new THREE.Mesh(footGeo, footMat);
    footL.position.set(-1.6, 0.075, 0.2);
    group.add(footL);
    var footR = new THREE.Mesh(footGeo, footMat);
    footR.position.set(1.6, 0.075, 0.2);
    group.add(footR);

    return group;
  }

  // ─── Explosion / Debris for ram destruction ───────────────────────────────
  function createRamExplosion(position) {
    var debrisCount = 12;
    var debrisGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    for (var d = 0; d < debrisCount; d++) {
      var debrisMat = getMat(0x444444 + Math.floor(Math.random() * 0x222222), 0.8);
      var debris = new THREE.Mesh(debrisGeo, debrisMat);
      debris.position.copy(position);
      debris.position.x += (Math.random() - 0.5) * 3;
      debris.position.y += Math.random() * 2;
      debris.position.z += (Math.random() - 0.5) * 3;
      scene.add(debris);

      // Remove debris after 3 seconds (simulate via flag)
      (function (mesh) {
        var elapsed = 0;
        var debrisData = { mesh: mesh, life: 3.0 };
        debrisParticles.push(debrisData);
      })(debris);
    }

    // Flash sphere
    var flashGeo = new THREE.SphereGeometry(1.5, 8, 8);
    var flashMat = new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.8 });
    var flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.copy(position);
    scene.add(flash);
    var flashData = { mesh: flash, life: 0.25 };
    debrisParticles.push(flashData);
  }

  var debrisParticles = [];  // { mesh, life }

  // ─── HUD ──────────────────────────────────────────────────────────────────
  function createHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'siege-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'bottom:120px',
      'left:20px',
      'background:rgba(0,0,0,0.65)',
      'color:#e0d060',
      'font-family:monospace',
      'font-size:13px',
      'padding:10px 14px',
      'border:1px solid #7a6a20',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'min-width:200px',
      'display:none'
    ].join(';');
    document.body.appendChild(hudEl);
  }

  function updateHUD() {
    if (!hudEl) return;

    siegeModeActive = deployedItems.length > 0;
    hudEl.style.display = 'block';

    var toolName = selectedTool === TOOL_TYPES.RAM
      ? 'BATTERING RAM'
      : selectedTool === TOOL_TYPES.LADDER
        ? 'BREACH CHARGE LADDER'
        : 'ARMORED SHIELD WALL';

    var lines = [];
    if (siegeModeActive) {
      lines.push('<span style="color:#ff4444;font-weight:bold">-- SIEGE MODE --</span>');
    }
    lines.push('Selected: <b>' + toolName + '</b>');
    lines.push('[V] Cycle  [F] Deploy  [G] Pickup  [E] Extend Ladder');

    if (deployedItems.length > 0) {
      lines.push('');
      lines.push('Deployed equipment:');
      for (var i = 0; i < deployedItems.length; i++) {
        var item = deployedItems[i];
        var pct = Math.max(0, Math.round((item.hp / item.maxHp) * 100));
        var bar = hpBar(pct);
        var label = item.type === TOOL_TYPES.RAM
          ? 'RAM'
          : item.type === TOOL_TYPES.LADDER
            ? 'LADDER'
            : 'SHIELD';
        lines.push(label + ' HP: ' + bar + ' ' + item.hp + '/' + item.maxHp);
      }
    }

    lines.push('');
    lines.push('Score: ' + score);

    hudEl.innerHTML = lines.join('<br>');
  }

  function hpBar(pct) {
    var filled = Math.round(pct / 10);
    var empty = 10 - filled;
    var color = pct > 60 ? '#44ff44' : pct > 30 ? '#ffaa00' : '#ff3333';
    return '<span style="color:' + color + '">' +
      '[' + '|'.repeat(filled) + ' '.repeat(empty) + ']' +
      '</span>';
  }

  // ─── Key binding ──────────────────────────────────────────────────────────
  function onKeyDown(e) {
    keysDown[e.code] = true;

    // V — cycle selected tool
    if (e.code === 'KeyV') {
      if (selectedTool === TOOL_TYPES.RAM) selectedTool = TOOL_TYPES.LADDER;
      else if (selectedTool === TOOL_TYPES.LADDER) selectedTool = TOOL_TYPES.SHIELD;
      else selectedTool = TOOL_TYPES.RAM;
      updateHUD();
    }

    // F — deploy selected tool
    if (e.code === 'KeyF') {
      deploySiegeItem(selectedTool);
    }

    // G — pick up nearest deployed item
    if (e.code === 'KeyG') {
      pickupNearest();
    }

    // E — extend nearest deployed ladder
    if (e.code === 'KeyE') {
      extendNearestLadder();
    }
  }

  function onKeyUp(e) {
    keysDown[e.code] = false;
  }

  // ─── Deploy logic ─────────────────────────────────────────────────────────
  function deploySiegeItem(type) {
    if (!scene || !camera) return null;

    var pos = getDeployPosition();
    var mesh, hp, maxHp, data;

    if (type === TOOL_TYPES.RAM) {
      mesh = buildBatteringRamMesh();
      maxHp = 500;
      hp = 500;
      data = { pushVelocity: 0, rollVelocity: new THREE.Vector3(0, 0, 0), isRolling: false };
    } else if (type === TOOL_TYPES.LADDER) {
      mesh = buildLadderMesh(2);
      maxHp = 120;
      hp = 120;
      data = { currentHeight: 2 };
    } else if (type === TOOL_TYPES.SHIELD) {
      mesh = buildShieldWallMesh();
      maxHp = 300;
      hp = 300;
      data = {};
    } else {
      return null;
    }

    mesh.position.copy(pos);
    // Orient toward player's look direction (rotate to face player forward)
    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    var angle = Math.atan2(dir.x, dir.z);
    mesh.rotation.y = angle;

    scene.add(mesh);

    var item = { type: type, mesh: mesh, hp: hp, maxHp: maxHp, data: data };
    deployedItems.push(item);
    updateHUD();
    return item;
  }

  function getDeployPosition() {
    var pos = new THREE.Vector3();
    camera.getWorldPosition(pos);
    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    pos.addScaledVector(dir, 3.0);
    pos.y = 0;
    return pos;
  }

  function pickupNearest() {
    if (!camera || deployedItems.length === 0) return;
    var camPos = new THREE.Vector3();
    camera.getWorldPosition(camPos);

    var closest = null;
    var closestDist = Infinity;
    var closestIdx = -1;

    for (var i = 0; i < deployedItems.length; i++) {
      var dist = camPos.distanceTo(deployedItems[i].mesh.position);
      if (dist < closestDist && dist < 4.0) {
        closestDist = dist;
        closest = deployedItems[i];
        closestIdx = i;
      }
    }

    if (closest !== null) {
      scene.remove(closest.mesh);
      deployedItems.splice(closestIdx, 1);
      updateHUD();
    }
  }

  function extendNearestLadder() {
    if (!camera) return;
    var camPos = new THREE.Vector3();
    camera.getWorldPosition(camPos);

    for (var i = 0; i < deployedItems.length; i++) {
      var item = deployedItems[i];
      if (item.type !== TOOL_TYPES.LADDER) continue;
      var dist = camPos.distanceTo(item.mesh.position);
      if (dist < 5.0 && item.data.currentHeight < LADDER_MAX_HEIGHT) {
        var pos = item.mesh.position.clone();
        var rot = item.mesh.rotation.y;
        scene.remove(item.mesh);

        item.data.currentHeight = Math.min(item.data.currentHeight + 1.0, LADDER_MAX_HEIGHT);
        item.mesh = buildLadderMesh(item.data.currentHeight);
        item.mesh.position.copy(pos);
        item.mesh.rotation.y = rot;
        scene.add(item.mesh);
        updateHUD();
        break;
      }
    }
  }

  // ─── Per-frame update ─────────────────────────────────────────────────────
  function update(delta) {
    if (!scene || !camera) return;

    // Update debris particles
    for (var d = debrisParticles.length - 1; d >= 0; d--) {
      debrisParticles[d].life -= delta;
      if (debrisParticles[d].life <= 0) {
        scene.remove(debrisParticles[d].mesh);
        debrisParticles.splice(d, 1);
      } else if (debrisParticles[d].mesh.material.transparent) {
        // Fade flash sphere
        debrisParticles[d].mesh.material.opacity =
          (debrisParticles[d].life / 0.25) * 0.8;
      }
    }

    // Update deployed items
    for (var i = deployedItems.length - 1; i >= 0; i--) {
      var item = deployedItems[i];

      // ── Battering Ram ───────────────────────────────────────────────────
      if (item.type === TOOL_TYPES.RAM) {
        // Player pushes by holding W while near the ram
        if (keysDown['KeyW'] && isPlayerNearItem(item, 2.5)) {
          var camDir = new THREE.Vector3();
          camera.getWorldDirection(camDir);
          camDir.y = 0;
          camDir.normalize();
          item.mesh.position.addScaledVector(camDir, 1.5 * delta);
          item.data.pushVelocity = 1.5;
        } else {
          item.data.pushVelocity = 0;
        }

        // Roll physics: if rolling, apply velocity and decelerate
        if (item.data.isRolling) {
          item.mesh.position.addScaledVector(item.data.rollVelocity, delta);
          var speed = item.data.rollVelocity.length();
          if (speed > 0.05) {
            item.data.rollVelocity.multiplyScalar(1 - 2.0 * delta);
          } else {
            item.data.rollVelocity.set(0, 0, 0);
            item.data.isRolling = false;
          }
          // Keep on ground
          item.mesh.position.y = 0;
        }

        // Enemies near active ram get -30% cover (handled externally via getSiegeItems)
        // Wall breach scoring is handled externally when collision is detected
      }

      // ── Ladder ──────────────────────────────────────────────────────────
      // (ladder is static; extending is handled by E key)

      // ── Shield Wall ─────────────────────────────────────────────────────
      // (static, blocks projectiles — damage calls applyDamageToItem)

      // Destroy check
      if (item.hp <= 0) {
        if (item.type === TOOL_TYPES.RAM) {
          createRamExplosion(item.mesh.position.clone());
        }
        scene.remove(item.mesh);
        deployedItems.splice(i, 1);
      }
    }

    updateHUD();
  }

  function isPlayerNearItem(item, radius) {
    if (!camera) return false;
    var camPos = new THREE.Vector3();
    camera.getWorldPosition(camPos);
    return camPos.distanceTo(item.mesh.position) < radius;
  }

  // ─── Damage API (called by external systems) ──────────────────────────────

  // Apply damage to a specific deployed item. Also used by enemy AI.
  function applyDamageToItem(item, amount) {
    item.hp = Math.max(0, item.hp - amount);
  }

  // Enemy sniper AI hook: returns the highest-priority target mesh for snipers.
  // Snipers prefer ladder > shield wall > player.
  function getSniperPriorityTarget() {
    for (var i = 0; i < deployedItems.length; i++) {
      if (deployedItems[i].type === TOOL_TYPES.LADDER) return deployedItems[i].mesh;
    }
    for (var j = 0; j < deployedItems.length; j++) {
      if (deployedItems[j].type === TOOL_TYPES.SHIELD) return deployedItems[j].mesh;
    }
    return null;
  }

  // Ram vehicle/explosion knockback: roll it away 5 units in given direction
  function knockbackRam(ramItem, direction) {
    if (!ramItem || ramItem.type !== TOOL_TYPES.RAM) return;
    var dir = direction.clone();
    dir.y = 0;
    dir.normalize();
    ramItem.data.rollVelocity = dir.multiplyScalar(RAM_ROLL_SPEED);
    ramItem.data.isRolling = true;
  }

  // Shield absorbs 95% of incoming damage
  function applyDamageToShield(shieldItem, rawDamage) {
    var absorbed = rawDamage * 0.95;
    var passThrough = rawDamage * 0.05;
    applyDamageToItem(shieldItem, absorbed);
    return passThrough;   // return remaining damage to player
  }

  // Ram contact damage on wall/door push
  function ramContact(wallHp, doorMaterial) {
    var damage = 200;
    var destroyed = false;
    if (doorMaterial === 'wood') {
      destroyed = true;
      score += 50;
    } else if (wallHp !== undefined) {
      wallHp -= damage;
      if (wallHp <= 0) {
        score += 50;
        destroyed = true;
      }
    }
    return { damage: damage, destroyed: destroyed, newWallHp: wallHp };
  }

  // Scoring: enemy taken down from ladder height advantage
  function scoreEnemyFromLadder() {
    score += 25;
    updateHUD();
  }

  // Score wall breach
  function scoreWallBreach() {
    score += 50;
    updateHUD();
  }

  // ─── Enemy cover bonus modifier ───────────────────────────────────────────
  // Returns multiplier for enemy cover bonus at given position.
  // If near an active battering ram, cover reduced by 30% (multiply by 0.7).
  function getCoverModifierAtPosition(pos) {
    for (var i = 0; i < deployedItems.length; i++) {
      if (deployedItems[i].type === TOOL_TYPES.RAM) {
        var dist = pos.distanceTo(deployedItems[i].mesh.position);
        if (dist < 6.0) return 0.7;
      }
    }
    return 1.0;
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    deployedItems = [];
    debrisParticles = [];
    score = 0;
    selectedTool = TOOL_TYPES.RAM;
    keysDown = {};
    siegeModeActive = false;

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    createHUD();
    updateHUD();
  }

  // ─── Reset ────────────────────────────────────────────────────────────────
  function reset() {
    // Remove all deployed items from scene
    for (var i = 0; i < deployedItems.length; i++) {
      if (scene) scene.remove(deployedItems[i].mesh);
    }
    deployedItems = [];

    // Remove debris
    for (var d = 0; d < debrisParticles.length; d++) {
      if (scene) scene.remove(debrisParticles[d].mesh);
    }
    debrisParticles = [];

    score = 0;
    selectedTool = TOOL_TYPES.RAM;
    keysDown = {};
    siegeModeActive = false;

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);

    if (hudEl && hudEl.parentNode) {
      hudEl.parentNode.removeChild(hudEl);
      hudEl = null;
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    reset: reset,
    deploySiegeItem: deploySiegeItem,
    getSiegeItems: function () { return deployedItems.slice(); },

    // Extended API for external game systems
    applyDamageToItem: applyDamageToItem,
    applyDamageToShield: applyDamageToShield,
    knockbackRam: knockbackRam,
    ramContact: ramContact,
    getSniperPriorityTarget: getSniperPriorityTarget,
    getCoverModifierAtPosition: getCoverModifierAtPosition,
    scoreEnemyFromLadder: scoreEnemyFromLadder,
    scoreWallBreach: scoreWallBreach,
    getScore: function () { return score; },
    TOOL_TYPES: TOOL_TYPES
  };
})();
