window.BazaarRaid = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var lanterns = [];
  var awnings = [];
  var combatants = [];
  var smokeParticles = [];
  var weaponCacheExploded = false;
  var swingTime = 0;
  var rippleTime = 0;
  var particleTime = 0;

  var colors = {
    clay: 0xD2845A,
    fabricBlue: 0x3355AA,
    awningRed: 0xAA2222,
    mosqueWhite: 0xF0F0E8,
    shadowDark: 0x2A1A0A,
    marketGold: 0xCCA43C,
    stoneGray: 0x888888,
    brickBrown: 0x8B4513
  };

  function createMesh(geometry, color, x, y, z, scale) {
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if (scale) {
      mesh.scale.copy(scale);
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    lanterns = [];
    awnings = [];
    combatants = [];
    smokeParticles = [];
    weaponCacheExploded = false;
    swingTime = 0;
    rippleTime = 0;
    particleTime = 0;

    // Ground plane
    var groundGeo = new THREE.BoxGeometry(200, 1, 200);
    createMesh(groundGeo, 0x8B6F47, 0, -1, 0);

    // Perimeter walls
    var wallGeo = new THREE.BoxGeometry(200, 15, 1);
    createMesh(wallGeo, colors.brickBrown, 0, 7, 100);
    createMesh(wallGeo, colors.brickBrown, 0, 7, -100);

    var wallGeo2 = new THREE.BoxGeometry(1, 15, 200);
    createMesh(wallGeo2, colors.brickBrown, 100, 7, 0);
    createMesh(wallGeo2, colors.brickBrown, -100, 7, 0);

    // Market stall cluster - row 1
    createMarketStall(-60, 0, -40, 20, 12);
    createMarketStall(-60, 0, -10, 20, 12);
    createMarketStall(-60, 0, 20, 20, 12);
    createMarketStall(-60, 0, 50, 20, 12);

    // Market stall cluster - row 2
    createMarketStall(0, 0, -40, 20, 12);
    createMarketStall(0, 0, -10, 20, 12);
    createMarketStall(0, 0, 20, 20, 12);
    createMarketStall(0, 0, 50, 20, 12);

    // Market stall cluster - row 3
    createMarketStall(60, 0, -40, 20, 12);
    createMarketStall(60, 0, -10, 20, 12);
    createMarketStall(60, 0, 20, 20, 12);
    createMarketStall(60, 0, 50, 20, 12);

    // Narrow alleyway corridors - creating maze-like passages
    createAlleyway(-30, 0, 0, 15, 8, 60);
    createAlleyway(30, 0, 0, 15, 8, 60);
    createAlleyway(0, 0, -25, 60, 8, 15);
    createAlleyway(0, 0, 30, 60, 8, 15);

    // Merchant carts scattered
    createMerchantCart(-70, 0, -60);
    createMerchantCart(70, 0, -60);
    createMerchantCart(-70, 0, 70);
    createMerchantCart(70, 0, 70);

    // Fabric awnings stretched between buildings at angles
    createFabricAwning(-45, 8, 0, 30, 0.2, 35);
    createFabricAwning(45, 8, 0, 30, 0.2, 35);
    createFabricAwning(0, 8, -35, 35, 0.2, 30);
    createFabricAwning(0, 8, 35, 35, 0.2, 30);

    // Mosque minaret and dome
    createMosqueMinaret(80, 0, -70);

    // Clay buildings with rooftop parapets
    createClayBuilding(-80, 0, 80);
    createClayBuilding(80, 0, 80);
    createClayBuilding(-80, 0, -80);
    createClayBuilding(80, 0, -80);

    // Hanging lanterns
    createHangingLantern(-40, 10, -40);
    createHangingLantern(-40, 10, 0);
    createHangingLantern(-40, 10, 40);
    createHangingLantern(40, 10, -40);
    createHangingLantern(40, 10, 0);
    createHangingLantern(40, 10, 40);
    createHangingLantern(0, 10, -60);
    createHangingLantern(0, 10, 60);

    // Spice pile mounds (SphereGeometry heaps)
    createSpicePile(-70, 0, -40);
    createSpicePile(-70, 0, 0);
    createSpicePile(-70, 0, 40);
    createSpicePile(70, 0, -40);
    createSpicePile(70, 0, 0);
    createSpicePile(70, 0, 40);

    // Weapon cache hidden behind false wall
    createWeaponCache(0, 0, 80);

    // Gate archway
    createGateArchway(-90, 0, 0);
    createGateArchway(90, 0, 0);

    // Spawn point markers (invisible, internal only)
    registerSpawnPoints();
  }

  function createMarketStall(x, y, z, width, height) {
    // Stall canopy
    var canopyGeo = new THREE.BoxGeometry(width, 1, width);
    var canopy = createMesh(canopyGeo, colors.fabricBlue, x, y + height, z);
    canopy.rotation.z = Math.random() * 0.1;

    // Support poles
    var poleGeo = new THREE.CylinderGeometry(0.3, 0.3, height, 8);
    createMesh(poleGeo, colors.shadowDark, x - width/2 + 1, y + height/2, z - width/2 + 1);
    createMesh(poleGeo, colors.shadowDark, x + width/2 - 1, y + height/2, z - width/2 + 1);
    createMesh(poleGeo, colors.shadowDark, x - width/2 + 1, y + height/2, z + width/2 - 1);
    createMesh(poleGeo, colors.shadowDark, x + width/2 - 1, y + height/2, z + width/2 - 1);

    // Merchandise boxes
    var boxGeo = new THREE.BoxGeometry(2, 1, 2);
    createMesh(boxGeo, colors.marketGold, x - width/4, y + 0.5, z - width/4);
    createMesh(boxGeo, colors.marketGold, x + width/4, y + 0.5, z + width/4);
  }

  function createAlleyway(x, y, z, width, height, depth) {
    // Side walls
    var wallGeo = new THREE.BoxGeometry(1, height, depth);
    createMesh(wallGeo, colors.shadowDark, x - width/2, y + height/2, z);
    createMesh(wallGeo, colors.shadowDark, x + width/2, y + height/2, z);

    // End walls
    var endWallGeo = new THREE.BoxGeometry(width, height, 1);
    createMesh(endWallGeo, colors.shadowDark, x, y + height/2, z - depth/2);
    createMesh(endWallGeo, colors.shadowDark, x, y + height/2, z + depth/2);
  }

  function createMerchantCart(x, y, z) {
    // Cart body
    var bodyGeo = new THREE.BoxGeometry(6, 3, 3);
    createMesh(bodyGeo, 0xA0522D, x, y + 1.5, z);

    // Wheels
    var wheelGeo = new THREE.CylinderGeometry(1, 1, 0.4, 16);
    createMesh(wheelGeo, colors.shadowDark, x - 2, y + 1, z - 1.5);
    createMesh(wheelGeo, colors.shadowDark, x - 2, y + 1, z + 1.5);
    createMesh(wheelGeo, colors.shadowDark, x + 2, y + 1, z - 1.5);
    createMesh(wheelGeo, colors.shadowDark, x + 2, y + 1, z + 1.5);

    // Handle/shaft
    var handleGeo = new THREE.BoxGeometry(1, 2, 0.2);
    createMesh(handleGeo, 0x654321, x + 3, y + 1, z);
  }

  function createFabricAwning(x, y, z, width, thickness, depth) {
    // Flat fabric sheet using BoxGeometry with small depth
    var awningGeo = new THREE.BoxGeometry(width, thickness, depth);
    var material = new THREE.MeshStandardMaterial({ color: colors.awningRed });
    var mesh = new THREE.Mesh(awningGeo, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);
    awnings.push({ mesh: mesh, baseRotation: mesh.rotation.clone(), swayAmount: Math.random() * 0.05 });
  }

  function createMosqueMinaret(x, y, z) {
    // Tower
    var towerGeo = new THREE.CylinderGeometry(2, 3, 25, 16);
    createMesh(towerGeo, colors.mosqueWhite, x, y + 12.5, z);

    // Dome
    var domeGeo = new THREE.SphereGeometry(3, 16, 16);
    createMesh(domeGeo, 0xD4AF37, x, y + 27, z);

    // Base platform
    var baseGeo = new THREE.CylinderGeometry(5, 5, 2, 16);
    createMesh(baseGeo, colors.clay, x, y + 1, z);

    // Balcony
    var balconyGeo = new THREE.CylinderGeometry(4, 4, 0.5, 16);
    createMesh(balconyGeo, colors.clay, x, y + 15, z);
  }

  function createClayBuilding(x, y, z) {
    // Main structure
    var buildingGeo = new THREE.BoxGeometry(15, 12, 15);
    createMesh(buildingGeo, colors.clay, x, y + 6, z);

    // Rooftop parapet
    var parapetGeo = new THREE.BoxGeometry(16, 1, 16);
    createMesh(parapetGeo, colors.shadowDark, x, y + 12.5, z);

    // Door/window opening (decorative)
    var doorGeo = new THREE.BoxGeometry(2, 4, 0.5);
    createMesh(doorGeo, 0x1A0F05, x - 6, y + 4, z - 7.5);
  }

  function createHangingLantern(x, y, z) {
    // Lantern body - cylinder
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 8);
    var lantern = createMesh(bodyGeo, colors.marketGold, x, y, z);

    // Lantern top cap
    var capGeo = new THREE.CylinderGeometry(0.7, 0.6, 0.3, 8);
    createMesh(capGeo, colors.shadowDark, x, y + 1, z);

    // Hanging chain (represented as small spheres)
    var chainGeo = new THREE.SphereGeometry(0.1, 4, 4);
    createMesh(chainGeo, colors.shadowDark, x, y + 1.2, z);

    lanterns.push({ mesh: lantern, basePos: lantern.position.clone(), swingAngle: 0 });
  }

  function createSpicePile(x, y, z) {
    // Mound using sphere
    var moundGeo = new THREE.SphereGeometry(2.5, 16, 16);
    createMesh(moundGeo, 0xD4A76A, x, y + 1.5, z);

    // Additional small piles
    var smallMoundGeo = new THREE.SphereGeometry(1.5, 12, 12);
    createMesh(smallMoundGeo, 0xC29560, x + 2, y + 0.8, z + 1.5);
    createMesh(smallMoundGeo, 0xC29560, x - 1.5, y + 0.8, z - 1.5);
  }

  function createWeaponCache(x, y, z) {
    // False wall structure
    var wallGeo = new THREE.BoxGeometry(8, 6, 1);
    createMesh(wallGeo, colors.shadowDark, x, y + 3, z);

    // Hidden cache box behind wall
    var cacheGeo = new THREE.BoxGeometry(6, 4, 2);
    var cacheMesh = createMesh(cacheGeo, 0x2F2F2F, x, y + 2, z + 2);
    cacheMesh.userData = { isWeaponCache: true };
  }

  function createGateArchway(x, y, z) {
    // Left pillar
    var pillarGeo = new THREE.CylinderGeometry(1, 1.2, 12, 8);
    createMesh(pillarGeo, colors.clay, x - 4, y + 6, z);

    // Right pillar
    createMesh(pillarGeo, colors.clay, x + 4, y + 6, z);

    // Top arch (using rotated cylinder)
    var archGeo = new THREE.CylinderGeometry(0.8, 0.8, 10, 8);
    var arch = createMesh(archGeo, colors.clay, x, y + 12, z);
    arch.rotation.z = Math.PI / 2;

    // Decorative stones on archway
    var stoneGeo = new THREE.SphereGeometry(0.4, 8, 8);
    for (var i = 0; i < 5; i++) {
      createMesh(stoneGeo, colors.stoneGray, x - 4 + i * 2, y + 12, z);
    }
  }

  function registerSpawnPoints() {
    // Market entrance spawn
    var spawnGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    var spawnMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 });

    var spawn1 = new THREE.Mesh(spawnGeo, spawnMat);
    spawn1.position.set(-90, 1, 0);
    spawn1.userData = { isSpawnPoint: true, name: 'gateWest' };
    scene.add(spawn1);
    meshes.push(spawn1);

    var spawn2 = new THREE.Mesh(spawnGeo, spawnMat);
    spawn2.position.set(90, 1, 0);
    spawn2.userData = { isSpawnPoint: true, name: 'gateEast' };
    scene.add(spawn2);
    meshes.push(spawn2);

    var spawn3 = new THREE.Mesh(spawnGeo, spawnMat);
    spawn3.position.set(-50, 13, -40);
    spawn3.userData = { isSpawnPoint: true, name: 'rooftopNW' };
    scene.add(spawn3);
    meshes.push(spawn3);

    var spawn4 = new THREE.Mesh(spawnGeo, spawnMat);
    spawn4.position.set(50, 13, 40);
    spawn4.userData = { isSpawnPoint: true, name: 'rooftopSE' };
    scene.add(spawn4);
    meshes.push(spawn4);

    var spawn5 = new THREE.Mesh(spawnGeo, spawnMat);
    spawn5.position.set(0, 0, 0);
    spawn5.userData = { isSpawnPoint: true, name: 'centerMarket' };
    scene.add(spawn5);
    meshes.push(spawn5);
  }

  function update(delta) {
    swingTime += delta;
    rippleTime += delta;
    particleTime += delta;

    // Update hanging lanterns - swinging motion
    for (var i = 0; i < lanterns.length; i++) {
      var lantern = lanterns[i];
      var swayX = Math.sin(swingTime * 1.5 + i * 0.5) * 0.3;
      var swayZ = Math.cos(swingTime * 1.3 + i * 0.7) * 0.3;
      lantern.mesh.position.x = lantern.basePos.x + swayX;
      lantern.mesh.position.z = lantern.basePos.z + swayZ;
      lantern.swingAngle = Math.sin(swingTime * 2) * 0.2;
      lantern.mesh.rotation.z = lantern.swingAngle;
    }

    // Update fabric awnings - rippling effect
    for (var j = 0; j < awnings.length; j++) {
      var awning = awnings[j];
      var ripple = Math.sin(rippleTime * 2 + j) * awning.swayAmount;
      awning.mesh.rotation.x = awning.baseRotation.x + ripple;
      awning.mesh.rotation.y = awning.baseRotation.y + ripple * 0.5;
    }

    // Simulate smoke rising from cook fires
    if (particleTime % 0.3 < delta) {
      createSmokeParticle(-70, 1, -40);
      createSmokeParticle(70, 1, 40);
    }

    // Update smoke particles
    for (var k = smokeParticles.length - 1; k >= 0; k--) {
      var particle = smokeParticles[k];
      particle.position.y += delta * 3;
      particle.material.opacity -= delta * 0.5;
      if (particle.material.opacity <= 0) {
        scene.remove(particle);
        smokeParticles.splice(k, 1);
      }
    }

    // Simulate enemy combatants moving around stalls
    updateCombatantMovement(delta);

    // Handle weapon cache explosion trigger
    if (weaponCacheExploded) {
      createExplosionEffect();
      weaponCacheExploded = false;
    }
  }

  function createSmokeParticle(x, y, z) {
    var smokeGeo = new THREE.SphereGeometry(0.5, 4, 4);
    var smokeMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.6
    });
    var smoke = new THREE.Mesh(smokeGeo, smokeMat);
    smoke.position.set(x + (Math.random() - 0.5) * 2, y, z + (Math.random() - 0.5) * 2);
    scene.add(smoke);
    smokeParticles.push(smoke);
  }

  function updateCombatantMovement(delta) {
    // Simulate combatants taking cover behind stalls
    // This would be enhanced with actual AI pathfinding in a real game
    swingTime += delta * 0.1;
  }

  function createExplosionEffect() {
    // Create expanding sphere effect for explosion
    var explosionGeo = new THREE.SphereGeometry(5, 8, 8);
    var explosionMat = new THREE.MeshStandardMaterial({
      color: 0xFF6600,
      transparent: true,
      opacity: 0.7
    });
    var explosion = new THREE.Mesh(explosionGeo, explosionMat);
    explosion.position.set(0, 2, 80);
    scene.add(explosion);

    // Remove after brief display
    setTimeout(function() {
      scene.remove(explosion);
    }, 500);

    // Create debris particles
    for (var i = 0; i < 8; i++) {
      var debrisGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      var debrisMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      var debris = new THREE.Mesh(debrisGeo, debrisMat);
      debris.position.set(0, 2, 80);
      debris.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        Math.random() * 20,
        (Math.random() - 0.5) * 30
      );
      scene.add(debris);
      smokeParticles.push(debris);
    }
  }

  function reset() {
    // Clear all meshes
    for (var i = meshes.length - 1; i >= 0; i--) {
      scene.remove(meshes[i]);
    }
    meshes = [];
    lanterns = [];
    awnings = [];
    combatants = [];
    smokeParticles = [];
    weaponCacheExploded = false;
    swingTime = 0;
    rippleTime = 0;
    particleTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };

}());
