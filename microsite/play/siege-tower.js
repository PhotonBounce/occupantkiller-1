window.SiegeTower = (function() {
  'use strict';

  // State
  var scene, camera, renderer, playerRef;
  var towerGroup = null;
  var towerSpawned = false;
  var playerAboard = false;
  var currentFloor = 0;
  var towerHP = 600;
  var towerMaxHP = 600;
  var rampDeployed = false;
  var catapultLoaded = true;
  var catapultCooldown = 0;
  var catapultCooldownMax = 8;
  var score = 0;
  var wallBreached = false;

  // Tower position/rotation
  var towerPos = { x: 0, y: 0, z: 0 };
  var towerAngle = 0;
  var towerSpeed = 3;

  // Fire state
  var fireLevel = -1;
  var fireLights = [];
  var fireTimer = 0;
  var playerOnFire = false;

  // Oil state
  var oilStreams = [];
  var oilFired = false;

  // Defenders
  var defenders = [];
  var defenderCount = 8;
  var defenderWall = null;

  // Friendly NPCs
  var friendlyNPCs = [];
  var npcCount = 4;

  // Boulder projectile
  var boulder = null;
  var boulderVel = { x: 0, y: 0, z: 0 };
  var boulderActive = false;

  // Explosion
  var explosionMesh = null;
  var explosionTimer = 0;

  // Debris
  var debrisList = [];

  // Ramp mesh
  var rampMesh = null;

  // Battering rams
  var batteringRams = [];
  var ramPushTimer = 0;

  // Stun state for enemies
  var stunTimers = [];

  // HUD element
  var hudEl = null;

  // Key state
  var keys = {};

  // Pressed-once tracking
  var sKeyPrev = false;
  var tKeyPrev = false;
  var eKeyPrev = false;
  var spaceKeyPrev = false;
  var rKeyPrev = false;
  var xKeyPrev = false;

  // Tower mesh references
  var burnLight = null;
  var ladderMeshes = [];
  var cornerTowers = [];
  var metalPanels = [];

  // -------------------------------------------------------
  // Build the siege tower group
  // -------------------------------------------------------
  function buildTower() {
    towerGroup = new THREE.Group();

    // Main frame
    var frameGeo = new THREE.BoxGeometry(4, 16, 4);
    var frameMat = new THREE.MeshLambertMaterial({ color: 0x5C3A1E });
    var frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.set(0, 8, 0);
    towerGroup.add(frameMesh);

    // 3 interior floors at Y=4, Y=8, Y=12
    var floorGeo = new THREE.BoxGeometry(3.8, 0.2, 3.8);
    var floorMat = new THREE.MeshLambertMaterial({ color: 0x6B4C2A });
    var floorYs = [4, 8, 12];
    for (var fi = 0; fi < floorYs.length; fi++) {
      var floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.position.set(0, floorYs[fi], 0);
      towerGroup.add(floorMesh);
    }

    // Ramp at top (BoxGeometry 4x0.3x3) at ~30 degrees, starting from top
    var rampGeo = new THREE.BoxGeometry(4, 0.3, 3);
    var rampMat = new THREE.MeshLambertMaterial({ color: 0x7A5C2E });
    rampMesh = new THREE.Mesh(rampGeo, rampMat);
    rampMesh.position.set(0, 16.5, -3);
    rampMesh.rotation.x = -Math.PI / 6;
    towerGroup.add(rampMesh);

    // Catapult arm at base: cylinder + bucket
    var armGeo = new THREE.CylinderGeometry(0.2, 0.2, 4, 8);
    var armMat = new THREE.MeshLambertMaterial({ color: 0x3A2810 });
    var armMesh = new THREE.Mesh(armGeo, armMat);
    armMesh.position.set(0, 1.5, -2.5);
    armMesh.rotation.z = Math.PI / 2;
    towerGroup.add(armMesh);

    var bucketGeo = new THREE.BoxGeometry(0.6, 0.4, 0.6);
    var bucketMat = new THREE.MeshLambertMaterial({ color: 0x2A1A08 });
    var bucketMesh = new THREE.Mesh(bucketGeo, bucketMat);
    bucketMesh.position.set(2.2, 1.5, -2.5);
    towerGroup.add(bucketMesh);

    // 4 corner towers (CylinderGeometry r=0.3, h=16)
    var ctGeo = new THREE.CylinderGeometry(0.3, 0.3, 16, 8);
    var ctMat = new THREE.MeshLambertMaterial({ color: 0x4A3020 });
    var cornerOffsets = [
      { x: 1.85, z: 1.85 },
      { x: -1.85, z: 1.85 },
      { x: 1.85, z: -1.85 },
      { x: -1.85, z: -1.85 }
    ];
    cornerTowers = [];
    for (var ci = 0; ci < cornerOffsets.length; ci++) {
      var ct = new THREE.Mesh(ctGeo, ctMat);
      ct.position.set(cornerOffsets[ci].x, 8, cornerOffsets[ci].z);
      towerGroup.add(ct);
      cornerTowers.push(ct);
    }

    // Metal panels on sides
    var panelGeo = new THREE.BoxGeometry(0.1, 2, 2);
    var panelMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var panelDefs = [
      { x: 2.05, y: 6, z: 0 },
      { x: -2.05, y: 6, z: 0 },
      { x: 0, y: 6, z: 2.05, ry: Math.PI / 2 },
      { x: 0, y: 6, z: -2.05, ry: Math.PI / 2 },
      { x: 2.05, y: 10, z: 0 },
      { x: -2.05, y: 10, z: 0 },
      { x: 0, y: 10, z: 2.05, ry: Math.PI / 2 },
      { x: 0, y: 10, z: -2.05, ry: Math.PI / 2 }
    ];
    metalPanels = [];
    for (var pi = 0; pi < panelDefs.length; pi++) {
      var pd = panelDefs[pi];
      var panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(pd.x, pd.y, pd.z);
      if (pd.ry) { panel.rotation.y = pd.ry; }
      towerGroup.add(panel);
      metalPanels.push(panel);
    }

    // Interior ladders (CylinderGeometry rungs)
    ladderMeshes = [];
    var rungGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 6);
    var rungMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    var ladderYs = [2, 6, 10];
    for (var li = 0; li < ladderYs.length; li++) {
      for (var ri = 0; ri < 5; ri++) {
        var rung = new THREE.Mesh(rungGeo, rungMat);
        rung.position.set(1.5, ladderYs[li] + ri * 0.5, 0);
        rung.rotation.z = Math.PI / 2;
        towerGroup.add(rung);
        ladderMeshes.push(rung);
      }
    }

    // Burn light (initially disabled)
    burnLight = new THREE.PointLight(0xFF4400, 0, 10);
    burnLight.position.set(0, 2, 0);
    towerGroup.add(burnLight);

    // Set position
    towerGroup.position.set(towerPos.x, towerPos.y, towerPos.z);
    towerGroup.rotation.y = towerAngle;

    scene.add(towerGroup);
  }

  // -------------------------------------------------------
  // Build enemy wall + defenders
  // -------------------------------------------------------
  function buildWallAndDefenders() {
    // Fortified wall: BoxGeometry 2x6x20
    var wallGeo = new THREE.BoxGeometry(2, 6, 20);
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    defenderWall = new THREE.Mesh(wallGeo, wallMat);
    defenderWall.position.set(0, 3, -25);
    scene.add(defenderWall);

    // 8 defenders on battlements
    defenders = [];
    stunTimers = [];
    var defGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
    var defMat = new THREE.MeshLambertMaterial({ color: 0x883333 });
    for (var di = 0; di < defenderCount; di++) {
      var def = new THREE.Mesh(defGeo, defMat);
      var dz = -17 + di * 2.5;
      def.position.set(0, 7, dz);
      def.userData = {
        alive: true,
        hp: 80,
        shootTimer: Math.random() * 3,
        oilTimer: Math.random() * 5,
        index: di
      };
      scene.add(def);
      defenders.push(def);
      stunTimers.push(0);
    }
  }

  // -------------------------------------------------------
  // Build friendly NPCs
  // -------------------------------------------------------
  function buildFriendlyNPCs() {
    friendlyNPCs = [];
    var npcGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 8);
    var npcMat = new THREE.MeshLambertMaterial({ color: 0x334433 });
    for (var ni = 0; ni < npcCount; ni++) {
      var npc = new THREE.Mesh(npcGeo, npcMat);
      npc.position.set(towerPos.x + (ni - 1.5) * 1.2, towerPos.y + 1, towerPos.z + 2);
      npc.userData = {
        floor: ni % 3,
        shootTimer: Math.random() * 2,
        disembarked: false,
        alive: true
      };
      scene.add(npc);
      friendlyNPCs.push(npc);
    }
  }

  // -------------------------------------------------------
  // Build battering rams (3 enemies pushing a ram)
  // -------------------------------------------------------
  function buildBatteringRams() {
    batteringRams = [];
    var ramGeo = new THREE.BoxGeometry(3, 1, 1);
    var ramMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    var pusherGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 8);
    var pusherMat = new THREE.MeshLambertMaterial({ color: 0xAA5533 });

    for (var bri = 0; bri < 2; bri++) {
      var ramGroup = new THREE.Group();
      var ramMesh = new THREE.Mesh(ramGeo, ramMat);
      ramMesh.position.set(0, 0.5, 0);
      ramGroup.add(ramMesh);

      for (var pi = 0; pi < 3; pi++) {
        var pusher = new THREE.Mesh(pusherGeo, pusherMat);
        pusher.position.set((pi - 1) * 1.1, 0.9, 0.8);
        ramGroup.add(pusher);
      }

      ramGroup.position.set(bri === 0 ? -5 : 5, 0, -15 + bri * 4);
      ramGroup.userData = { speed: 1.5, active: true };
      scene.add(ramGroup);
      batteringRams.push(ramGroup);
    }
  }

  // -------------------------------------------------------
  // Spawn tower at player position
  // -------------------------------------------------------
  function spawnTower() {
    if (towerSpawned) { return; }
    var px = 0, py = 0, pz = 0;
    if (playerRef && playerRef.position) {
      px = playerRef.position.x;
      py = playerRef.position.y;
      pz = playerRef.position.z;
    }
    towerPos.x = px;
    towerPos.y = py;
    towerPos.z = pz;
    towerAngle = 0;
    towerHP = towerMaxHP;
    towerSpawned = true;
    currentFloor = 0;
    playerAboard = false;
    rampDeployed = false;
    catapultLoaded = true;
    catapultCooldown = 0;
    fireLevel = -1;
    fireLights = [];
    oilStreams = [];
    debrisList = [];
    wallBreached = false;

    buildTower();
    buildWallAndDefenders();
    buildFriendlyNPCs();
    buildBatteringRams();
  }

  // -------------------------------------------------------
  // Board / disembark tower
  // -------------------------------------------------------
  function tryBoardTower() {
    if (!towerSpawned || !playerRef) { return; }
    var dx = playerRef.position.x - towerPos.x;
    var dz = playerRef.position.z - towerPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 2) {
      playerAboard = !playerAboard;
    }
  }

  // -------------------------------------------------------
  // Fire catapult
  // -------------------------------------------------------
  function fireCatapult() {
    if (!towerSpawned || !catapultLoaded) { return; }
    catapultLoaded = false;
    catapultCooldown = catapultCooldownMax;

    // Boulder
    var boulderGeo = new THREE.SphereGeometry(0.8, 8, 8);
    var boulderMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    boulder = new THREE.Mesh(boulderGeo, boulderMat);

    // Start from catapult position (tower top area)
    boulder.position.set(
      towerPos.x,
      towerPos.y + 17,
      towerPos.z - 2.5
    );

    // Launch toward wall
    var angleUp = Math.PI / 6;
    var speed = 18;
    boulderVel.x = Math.sin(towerAngle) * -speed * Math.cos(angleUp);
    boulderVel.y = speed * Math.sin(angleUp);
    boulderVel.z = -speed * Math.cos(angleUp) * Math.cos(towerAngle);
    boulderActive = true;

    scene.add(boulder);
  }

  // -------------------------------------------------------
  // Deploy / retract ramp
  // -------------------------------------------------------
  function toggleRamp() {
    if (!towerSpawned || !rampMesh) { return; }
    if (!rampDeployed) {
      // Check if close enough to wall
      var dx = towerPos.x - 0;
      var dz = towerPos.z - (-25);
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 10) {
        rampDeployed = true;
        rampMesh.position.z = -6;
        rampMesh.rotation.x = -Math.PI / 5;
      }
    } else {
      rampDeployed = false;
      rampMesh.position.z = -3;
      rampMesh.rotation.x = -Math.PI / 6;
    }
  }

  // -------------------------------------------------------
  // Extinguish fire
  // -------------------------------------------------------
  function extinguishFire() {
    if (fireLevel >= 0) {
      fireLevel = -1;
      for (var i = 0; i < fireLights.length; i++) {
        towerGroup.remove(fireLights[i]);
      }
      fireLights = [];
      playerOnFire = false;
      if (burnLight) { burnLight.intensity = 0; }
    }
  }

  // -------------------------------------------------------
  // Update boulder physics
  // -------------------------------------------------------
  function updateBoulder(dt) {
    if (!boulderActive || !boulder) { return; }
    boulderVel.y -= 9.8 * dt;
    boulder.position.x += boulderVel.x * dt;
    boulder.position.y += boulderVel.y * dt;
    boulder.position.z += boulderVel.z * dt;

    // Check hit ground or wall
    if (boulder.position.y < 0 || boulder.position.y > 50) {
      triggerExplosion(boulder.position.x, boulder.position.y, boulder.position.z);
      scene.remove(boulder);
      boulder = null;
      boulderActive = false;
      return;
    }

    // Check hit defenders
    for (var di = 0; di < defenders.length; di++) {
      if (!defenders[di].userData.alive) { continue; }
      var def = defenders[di];
      var dx = boulder.position.x - def.position.x;
      var dy = boulder.position.y - def.position.y;
      var dz = boulder.position.z - def.position.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 2) {
        triggerExplosion(boulder.position.x, boulder.position.y, boulder.position.z);
        scene.remove(boulder);
        boulder = null;
        boulderActive = false;
        return;
      }
    }
  }

  // -------------------------------------------------------
  // Trigger explosion
  // -------------------------------------------------------
  function triggerExplosion(ex, ey, ez) {
    // Remove old explosion
    if (explosionMesh) {
      scene.remove(explosionMesh);
      explosionMesh = null;
    }
    var exGeo = new THREE.SphereGeometry(6, 8, 8);
    var exMat = new THREE.MeshLambertMaterial({
      color: 0xFF6600,
      transparent: true,
      opacity: 0.7
    });
    explosionMesh = new THREE.Mesh(exGeo, exMat);
    explosionMesh.position.set(ex, ey, ez);
    scene.add(explosionMesh);
    explosionTimer = 0.5;

    // Stun enemies within 8 units
    for (var di = 0; di < defenders.length; di++) {
      if (!defenders[di].userData.alive) { continue; }
      var def = defenders[di];
      var dx = ex - def.position.x;
      var dy = ey - def.position.y;
      var dz = ez - def.position.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 8) {
        stunTimers[di] = 3;
        def.userData.hp -= 60;
        if (def.userData.hp <= 0) {
          killDefender(di);
        }
      }
    }
  }

  // -------------------------------------------------------
  // Kill defender
  // -------------------------------------------------------
  function killDefender(idx) {
    if (!defenders[idx].userData.alive) { return; }
    defenders[idx].userData.alive = false;
    scene.remove(defenders[idx]);
    checkWallBreached();
  }

  // -------------------------------------------------------
  // Check win condition
  // -------------------------------------------------------
  function checkWallBreached() {
    var allDead = true;
    for (var di = 0; di < defenders.length; di++) {
      if (defenders[di].userData.alive) {
        allDead = false;
        break;
      }
    }
    if (allDead && !wallBreached) {
      wallBreached = true;
      score += 600;
    }
  }

  // -------------------------------------------------------
  // Update defenders (shoot at tower, pour oil)
  // -------------------------------------------------------
  function updateDefenders(dt) {
    for (var di = 0; di < defenders.length; di++) {
      var def = defenders[di];
      if (!def.userData.alive) { continue; }
      if (stunTimers[di] > 0) {
        stunTimers[di] -= dt;
        continue;
      }

      def.userData.shootTimer -= dt;
      def.userData.oilTimer -= dt;

      if (def.userData.shootTimer <= 0) {
        def.userData.shootTimer = 2 + Math.random() * 2;
        // Damage tower if in range
        if (towerSpawned) {
          var dx = def.position.x - towerPos.x;
          var dz = def.position.z - towerPos.z;
          var dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < 20) {
            towerHP -= 5;
            if (towerHP < 0) { towerHP = 0; }
          }
        }
      }

      // Pour oil if tower within 5 units
      if (towerSpawned && def.userData.oilTimer <= 0) {
        var odx = def.position.x - towerPos.x;
        var odz = def.position.z - towerPos.z;
        var odist = Math.sqrt(odx * odx + odz * odz);
        if (odist < 5) {
          def.userData.oilTimer = 6 + Math.random() * 4;
          pourOil(def.position.x, def.position.z);
        } else {
          def.userData.oilTimer = 2;
        }
      }
    }
  }

  // -------------------------------------------------------
  // Pour oil
  // -------------------------------------------------------
  function pourOil(ox, oz) {
    var oilGeo = new THREE.BoxGeometry(0.2, 3, 0.2);
    var oilMat = new THREE.MeshLambertMaterial({ color: 0xFFDD00, transparent: true, opacity: 0.8 });
    var oilMesh = new THREE.Mesh(oilGeo, oilMat);
    oilMesh.position.set(ox, 5, oz);
    scene.add(oilMesh);
    oilStreams.push({ mesh: oilMesh, timer: 1.5 });

    // Start fire at tower base
    if (fireLevel < 0) {
      fireLevel = 0;
      startFireAtLevel(0);
    }
  }

  // -------------------------------------------------------
  // Start fire at a level
  // -------------------------------------------------------
  function startFireAtLevel(level) {
    var fl = new THREE.PointLight(0xFF4400, 2, 8);
    fl.position.set(
      (Math.random() - 0.5) * 2,
      level * 4 + 1,
      (Math.random() - 0.5) * 2
    );
    if (towerGroup) {
      towerGroup.add(fl);
    }
    fireLights.push(fl);
    if (burnLight && level === 0) {
      burnLight.intensity = 2;
    }
  }

  // -------------------------------------------------------
  // Update fire spread
  // -------------------------------------------------------
  function updateFire(dt) {
    if (fireLevel < 0 || !towerSpawned) { return; }
    fireTimer += dt;
    if (fireTimer >= 10 && fireLevel < 2) {
      fireTimer = 0;
      fireLevel++;
      startFireAtLevel(fireLevel);
    }

    // Damage player if on fire level floor
    if (currentFloor === fireLevel && playerAboard) {
      playerOnFire = true;
    } else {
      playerOnFire = false;
    }
  }

  // -------------------------------------------------------
  // Update oil streams
  // -------------------------------------------------------
  function updateOilStreams(dt) {
    for (var oi = oilStreams.length - 1; oi >= 0; oi--) {
      oilStreams[oi].timer -= dt;
      if (oilStreams[oi].timer <= 0) {
        scene.remove(oilStreams[oi].mesh);
        oilStreams.splice(oi, 1);
      }
    }
  }

  // -------------------------------------------------------
  // Update debris at low HP
  // -------------------------------------------------------
  function updateDebris(dt) {
    if (!towerSpawned) { return; }
    var hpPct = towerHP / towerMaxHP;

    // Spawn debris at <25%
    if (hpPct < 0.25 && Math.random() < 0.05) {
      var dGeo = new THREE.BoxGeometry(
        0.3 + Math.random() * 0.4,
        0.2 + Math.random() * 0.3,
        0.3 + Math.random() * 0.4
      );
      var dMat = new THREE.MeshLambertMaterial({ color: 0x5C3A1E });
      var dMesh = new THREE.Mesh(dGeo, dMat);
      var corner = cornerTowers[Math.floor(Math.random() * 4)];
      dMesh.position.set(
        towerPos.x + corner.position.x,
        towerPos.y + 10 + Math.random() * 6,
        towerPos.z + corner.position.z
      );
      scene.add(dMesh);
      debrisList.push({
        mesh: dMesh,
        vel: { x: (Math.random() - 0.5) * 3, y: 0, z: (Math.random() - 0.5) * 3 },
        life: 2
      });
    }

    for (var di = debrisList.length - 1; di >= 0; di--) {
      var deb = debrisList[di];
      deb.vel.y -= 9.8 * dt;
      deb.mesh.position.x += deb.vel.x * dt;
      deb.mesh.position.y += deb.vel.y * dt;
      deb.mesh.position.z += deb.vel.z * dt;
      deb.life -= dt;
      if (deb.life <= 0 || deb.mesh.position.y < 0) {
        scene.remove(deb.mesh);
        debrisList.splice(di, 1);
      }
    }
  }

  // -------------------------------------------------------
  // Update friendly NPCs
  // -------------------------------------------------------
  function updateFriendlyNPCs(dt) {
    if (!towerSpawned) { return; }
    for (var ni = 0; ni < friendlyNPCs.length; ni++) {
      var npc = friendlyNPCs[ni];
      if (!npc.userData.alive) { continue; }

      // Ride tower
      if (!npc.userData.disembarked) {
        var fl = npc.userData.floor;
        npc.position.set(
          towerPos.x + (ni - 1.5) * 0.8,
          towerPos.y + 4 + fl * 4 + 1,
          towerPos.z
        );

        // Shoot at defenders
        npc.userData.shootTimer -= dt;
        if (npc.userData.shootTimer <= 0) {
          npc.userData.shootTimer = 1.5 + Math.random() * 1.5;
          shootNPCAtDefender(ni);
        }

        // Disembark if ramp deployed
        if (rampDeployed) {
          npc.userData.disembarked = true;
        }
      } else {
        // Walk toward wall
        var wx = 0;
        var wz = -25;
        var ndx = wx - npc.position.x;
        var ndz = wz - npc.position.z;
        var nd = Math.sqrt(ndx * ndx + ndz * ndz);
        if (nd > 1) {
          npc.position.x += (ndx / nd) * 2 * dt;
          npc.position.z += (ndz / nd) * 2 * dt;
        } else {
          // Arrived — shoot nearby defenders
          npc.userData.shootTimer -= dt;
          if (npc.userData.shootTimer <= 0) {
            npc.userData.shootTimer = 1 + Math.random();
            shootNPCAtDefender(ni);
          }
        }
      }
    }
  }

  // -------------------------------------------------------
  // NPC shoots at a random alive defender
  // -------------------------------------------------------
  function shootNPCAtDefender(npcIdx) {
    var npc = friendlyNPCs[npcIdx];
    for (var di = 0; di < defenders.length; di++) {
      if (!defenders[di].userData.alive) { continue; }
      var def = defenders[di];
      var dx = npc.position.x - def.position.x;
      var dz = npc.position.z - def.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 25) {
        def.userData.hp -= 15;
        if (def.userData.hp <= 0) {
          killDefender(di);
        }
        break;
      }
    }
  }

  // -------------------------------------------------------
  // Update battering rams
  // -------------------------------------------------------
  function updateBatteringRams(dt) {
    if (!towerSpawned) { return; }
    ramPushTimer += dt;

    for (var ri = 0; ri < batteringRams.length; ri++) {
      var ram = batteringRams[ri];
      if (!ram.userData.active) { continue; }

      // Move ram toward tower
      var dx = towerPos.x - ram.position.x;
      var dz = towerPos.z - ram.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 2) {
        ram.position.x += (dx / dist) * ram.userData.speed * dt;
        ram.position.z += (dz / dist) * ram.userData.speed * dt;
      } else {
        // Contact — push tower back if stationary
        if (!playerAboard && ramPushTimer > 2) {
          ramPushTimer = 0;
          // Push tower away from ram
          var pushX = -dx / dist;
          var pushZ = -dz / dist;
          towerPos.x += pushX * 4;
          towerPos.z += pushZ * 4;
          if (towerGroup) {
            towerGroup.position.set(towerPos.x, towerPos.y, towerPos.z);
          }
        }
      }
    }
  }

  // -------------------------------------------------------
  // Handle tower HP visual states
  // -------------------------------------------------------
  function updateTowerVisuals() {
    if (!towerGroup || !burnLight) { return; }
    var hpPct = towerHP / towerMaxHP;
    if (hpPct < 0.5) {
      // Burning: ensure burn light is on
      if (burnLight.intensity === 0) {
        burnLight.intensity = 2;
      }
      burnLight.intensity = 2 + Math.sin(Date.now() * 0.01) * 0.5;
    } else {
      if (fireLevel < 0) {
        burnLight.intensity = 0;
      }
    }
  }

  // -------------------------------------------------------
  // Update HUD
  // -------------------------------------------------------
  function updateHUD() {
    if (!hudEl) { return; }
    if (!towerSpawned) {
      hudEl.textContent = 'SIEGE TOWER: NOT DEPLOYED | Press S+T to spawn';
      return;
    }
    var hpStr = 'HP: ' + towerHP;
    var floorStr = 'FLOOR: ' + (currentFloor + 1) + '/3';
    var rampStr = 'RAMP: ' + (rampDeployed ? 'DEPLOYED' : 'RETRACTED');
    var catStr = 'CATAPULT: ' + (catapultLoaded ? 'LOADED' : 'RELOAD ' + Math.ceil(catapultCooldown) + 's');
    var aboardStr = playerAboard ? ' [ABOARD]' : '';
    var fireStr = fireLevel >= 0 ? ' [FIRE L' + (fireLevel + 1) + ']' : '';
    var breachStr = wallBreached ? ' *** WALL BREACHED *** +600' : '';
    hudEl.textContent =
      'SIEGE TOWER [' + hpStr + '] [' + floorStr + '] [' + rampStr + '] | ' + catStr +
      aboardStr + fireStr + breachStr;
  }

  // -------------------------------------------------------
  // Handle key input for tower control
  // -------------------------------------------------------
  function handleTowerInput(dt) {
    if (!towerSpawned || !playerAboard) { return; }

    var moved = false;
    var spd = towerSpeed;

    if (keys['w'] || keys['W']) {
      towerPos.x -= Math.sin(towerAngle) * spd * dt;
      towerPos.z -= Math.cos(towerAngle) * spd * dt;
      moved = true;
    }
    if (keys['s'] || keys['S']) {
      towerPos.x += Math.sin(towerAngle) * spd * dt;
      towerPos.z += Math.cos(towerAngle) * spd * dt;
      moved = true;
    }
    if (keys['a'] || keys['A']) {
      towerAngle += 0.8 * dt;
      moved = true;
    }
    if (keys['d'] || keys['D']) {
      towerAngle -= 0.8 * dt;
      moved = true;
    }

    if (moved && towerGroup) {
      towerGroup.position.set(towerPos.x, towerPos.y, towerPos.z);
      towerGroup.rotation.y = towerAngle;
    }

    // Floor switching via Q/Z
    if (keys['q'] || keys['Q']) {
      currentFloor = Math.min(2, currentFloor + 1);
    }
    if (keys['z'] || keys['Z']) {
      currentFloor = Math.max(0, currentFloor - 1);
    }
  }

  // -------------------------------------------------------
  // Key event handlers
  // -------------------------------------------------------
  function onKeyDown(e) {
    keys[e.key] = true;
  }

  function onKeyUp(e) {
    keys[e.key] = false;
  }

  // -------------------------------------------------------
  // Process one-shot key presses
  // -------------------------------------------------------
  function processOneShotKeys() {
    var sDown = !!(keys['s'] || keys['S']);
    var tDown = !!(keys['t'] || keys['T']);
    var eDown = !!(keys['e'] || keys['E']);
    var spaceDown = !!keys[' '];
    var rDown = !!(keys['r'] || keys['R']);
    var xDown = !!(keys['x'] || keys['X']);

    // S+T to spawn
    if (sDown && tDown && !(sKeyPrev && tKeyPrev)) {
      spawnTower();
    }
    sKeyPrev = sDown;
    tKeyPrev = tDown;

    // E to board/disembark
    if (eDown && !eKeyPrev) {
      tryBoardTower();
    }
    eKeyPrev = eDown;

    // Space to fire catapult
    if (spaceDown && !spaceKeyPrev) {
      fireCatapult();
    }
    spaceKeyPrev = spaceDown;

    // R to deploy ramp
    if (rDown && !rKeyPrev) {
      toggleRamp();
    }
    rKeyPrev = rDown;

    // X to extinguish fire
    if (xDown && !xKeyPrev) {
      extinguishFire();
    }
    xKeyPrev = xDown;
  }

  // -------------------------------------------------------
  // Update catapult cooldown
  // -------------------------------------------------------
  function updateCatapult(dt) {
    if (!catapultLoaded) {
      catapultCooldown -= dt;
      if (catapultCooldown <= 0) {
        catapultCooldown = 0;
        catapultLoaded = true;
      }
    }
  }

  // -------------------------------------------------------
  // Update explosion fade
  // -------------------------------------------------------
  function updateExplosion(dt) {
    if (!explosionMesh) { return; }
    explosionTimer -= dt;
    if (explosionTimer <= 0) {
      scene.remove(explosionMesh);
      explosionMesh = null;
    } else {
      explosionMesh.material.opacity = 0.7 * (explosionTimer / 0.5);
      explosionMesh.scale.setScalar(1 + (0.5 - explosionTimer) * 2);
    }
  }

  // -------------------------------------------------------
  // Public: init
  // -------------------------------------------------------
  function init(opts) {
    scene = opts.scene;
    camera = opts.camera;
    renderer = opts.renderer;
    playerRef = opts.player || null;

    // Create HUD
    hudEl = document.createElement('div');
    hudEl.id = 'siege-tower-hud';
    hudEl.style.cssText =
      'position:fixed;bottom:10px;left:10px;color:#FFD700;' +
      'font-family:monospace;font-size:13px;background:rgba(0,0,0,0.6);' +
      'padding:6px 10px;border-radius:4px;z-index:1000;pointer-events:none;';
    hudEl.textContent = 'SIEGE TOWER: NOT DEPLOYED | Press S+T to spawn';
    document.body.appendChild(hudEl);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  }

  // -------------------------------------------------------
  // Public: update (called each frame)
  // -------------------------------------------------------
  function update(dt) {
    if (!dt || dt <= 0) { dt = 0.016; }
    if (dt > 0.1) { dt = 0.1; }

    processOneShotKeys();
    handleTowerInput(dt);
    updateCatapult(dt);
    updateBoulder(dt);
    updateExplosion(dt);

    if (towerSpawned) {
      updateDefenders(dt);
      updateFire(dt);
      updateOilStreams(dt);
      updateDebris(dt);
      updateFriendlyNPCs(dt);
      updateBatteringRams(dt);
      updateTowerVisuals();
    }

    updateHUD();
  }

  // -------------------------------------------------------
  // Public: reset
  // -------------------------------------------------------
  function reset() {
    // Remove tower
    if (towerGroup) {
      scene.remove(towerGroup);
      towerGroup = null;
    }

    // Remove defenders
    for (var di = 0; di < defenders.length; di++) {
      scene.remove(defenders[di]);
    }
    defenders = [];
    stunTimers = [];

    // Remove wall
    if (defenderWall) {
      scene.remove(defenderWall);
      defenderWall = null;
    }

    // Remove friendly NPCs
    for (var ni = 0; ni < friendlyNPCs.length; ni++) {
      scene.remove(friendlyNPCs[ni]);
    }
    friendlyNPCs = [];

    // Remove battering rams
    for (var ri = 0; ri < batteringRams.length; ri++) {
      scene.remove(batteringRams[ri]);
    }
    batteringRams = [];

    // Remove boulder
    if (boulder) {
      scene.remove(boulder);
      boulder = null;
    }

    // Remove explosion
    if (explosionMesh) {
      scene.remove(explosionMesh);
      explosionMesh = null;
    }

    // Remove oil streams
    for (var oi = 0; oi < oilStreams.length; oi++) {
      scene.remove(oilStreams[oi].mesh);
    }
    oilStreams = [];

    // Remove debris
    for (var dbi = 0; dbi < debrisList.length; dbi++) {
      scene.remove(debrisList[dbi].mesh);
    }
    debrisList = [];

    // Remove HUD
    if (hudEl && hudEl.parentNode) {
      hudEl.parentNode.removeChild(hudEl);
      hudEl = null;
    }

    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);

    // Reset state
    towerSpawned = false;
    playerAboard = false;
    currentFloor = 0;
    towerHP = towerMaxHP;
    rampDeployed = false;
    catapultLoaded = true;
    catapultCooldown = 0;
    score = 0;
    wallBreached = false;
    fireLevel = -1;
    fireLights = [];
    fireTimer = 0;
    playerOnFire = false;
    boulderActive = false;
    boulderVel = { x: 0, y: 0, z: 0 };
    keys = {};
    sKeyPrev = false;
    tKeyPrev = false;
    eKeyPrev = false;
    spaceKeyPrev = false;
    rKeyPrev = false;
    xKeyPrev = false;
    rampMesh = null;
    burnLight = null;
    ladderMeshes = [];
    cornerTowers = [];
    metalPanels = [];
    ramPushTimer = 0;
    explosionTimer = 0;
  }

  return { init: init, update: update, reset: reset };
})();
