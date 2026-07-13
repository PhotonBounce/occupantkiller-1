window.OilRefinery = (function() {
  'use strict';

  var objects = [];
  var animations = {};
  var flareParticles = [];
  var fireParticles = [];
  var smokeParticles = [];
  var currentScene = null;

  function init(scene, camera) {
    currentScene = scene;
    objects = [];
    animations = {};
    flareParticles = [];
    fireParticles = [];
    smokeParticles = [];

    // 1. Cracking Column 1 - Tall cylindrical tower
    var crackingCol1 = createCrackingColumn(0, 0, -20, 3, 25);
    scene.add(crackingCol1);
    objects.push(crackingCol1);

    // 2. Cracking Column 2 - Offset position
    var crackingCol2 = createCrackingColumn(15, 0, -35, 2.5, 22);
    scene.add(crackingCol2);
    objects.push(crackingCol2);

    // 3. Cracking Column 3 - Third column with variation
    var crackingCol3 = createCrackingColumn(-15, 0, -40, 2.8, 24);
    scene.add(crackingCol3);
    objects.push(crackingCol3);

    // 4. Flare Stack 1 - Burning gas tower
    var flareStack1 = createFlareStack(-25, 0, -15, 1.5, 30);
    scene.add(flareStack1);
    objects.push(flareStack1);
    animations.flare1 = { object: flareStack1, intensity: 0, burn: true };

    // 5. Flare Stack 2 - Second burning tower
    var flareStack2 = createFlareStack(25, 0, -30, 1.2, 28);
    scene.add(flareStack2);
    objects.push(flareStack2);
    animations.flare2 = { object: flareStack2, intensity: 0.3, burn: true };

    // 6. Storage Tank 1 - Large cylindrical tank
    var storageTank1 = createStorageTank(-35, 5, 0, 6, 10);
    scene.add(storageTank1);
    objects.push(storageTank1);

    // 7. Storage Tank 2 - Second storage tank
    var storageTank2 = createStorageTank(30, 5, 10, 5.5, 9);
    scene.add(storageTank2);
    objects.push(storageTank2);

    // 8. Storage Tank 3 - Third tank with damage effect
    var storageTank3 = createStorageTank(0, 5, 25, 4.5, 8);
    scene.add(storageTank3);
    objects.push(storageTank3);
    animations.tank3Fire = { object: storageTank3, burning: true, intensity: 0 };

    // 9. Cooling Tower 1 - Massive structure
    var coolingTower1 = createCoolingTower(-20, 2, 15, 8, 15);
    scene.add(coolingTower1);
    objects.push(coolingTower1);
    animations.cooling1 = { object: coolingTower1, smokeHeight: 0 };

    // 10. Cooling Tower 2 - Second cooling tower
    var coolingTower2 = createCoolingTower(20, 2, 20, 7, 14);
    scene.add(coolingTower2);
    objects.push(coolingTower2);
    animations.cooling2 = { object: coolingTower2, smokeHeight: 0.5 };

    // 11. Tanker Truck - Parked industrial vehicle
    var tankerTruck = createTankerTruck(-40, 2, -50, 1);
    scene.add(tankerTruck);
    objects.push(tankerTruck);

    // 12. Control Room - Central command building
    var controlRoom = createControlRoom(0, 0, 50, 8, 6, 4);
    scene.add(controlRoom);
    objects.push(controlRoom);

    // 13. Pipeline Network 1 - Connecting structures
    var pipeline1 = createPipelineNetwork(-10, 8, 0, 20, 2);
    scene.add(pipeline1);
    objects.push(pipeline1);
    animations.pipe1Vibrate = { object: pipeline1, vibration: 0 };

    // 14. Chemical Processing Unit - Complex structure
    var chemUnit = createChemicalUnit(35, 1, 30, 5);
    scene.add(chemUnit);
    objects.push(chemUnit);

    // 15. Scaffolding Structure - Metal framework
    var scaffolding = createScaffolding(-45, 0, 20, 6, 12);
    scene.add(scaffolding);
    objects.push(scaffolding);

    // 16. Oil Spill Fire - Burning ground effect
    var oilSpillFire = createOilSpillFire(10, 0.1, -60, 8);
    scene.add(oilSpillFire);
    objects.push(oilSpillFire);
    animations.oilFire = { object: oilSpillFire, intensity: 0, spreading: true };

    // Initialize particle systems
    initializeParticles(scene);
  }

  function createCrackingColumn(x, y, z, radius, height) {
    var group = new THREE.Group();

    // Main cylinder
    var cylinderGeom = new THREE.CylinderGeometry(radius, radius, height, 12);
    var cylinderMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, metalness: 0.4, roughness: 0.6 });
    var cylinder = new THREE.Mesh(cylinderGeom, cylinderMat);
    cylinder.position.y = height / 2;
    group.add(cylinder);

    // Rings for visual detail
    for (var i = 0; i < 5; i++) {
      var ringGeom = new THREE.CylinderGeometry(radius + 0.5, radius + 0.5, 0.3, 12);
      var ringMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.3 });
      var ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.y = (i + 1) * (height / 5);
      group.add(ring);
    }

    group.position.set(x, y, z);
    return group;
  }

  function createFlareStack(x, y, z, radius, height) {
    var group = new THREE.Group();

    // Stack pipe
    var pipeGeom = new THREE.CylinderGeometry(radius, radius, height, 8);
    var pipeMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
    var pipe = new THREE.Mesh(pipeGeom, pipeMat);
    pipe.position.y = height / 2;
    group.add(pipe);

    // Flare cap
    var capGeom = new THREE.ConeGeometry(radius * 1.5, 3, 8);
    var capMat = new THREE.MeshStandardMaterial({ color: 0xFF4500, emissive: 0xFF2500, metalness: 0.6 });
    var cap = new THREE.Mesh(capGeom, capMat);
    cap.position.y = height + 1.5;
    group.add(cap);

    group.position.set(x, y, z);
    return group;
  }

  function createStorageTank(x, y, z, radius, height) {
    var group = new THREE.Group();

    // Tank body
    var tankGeom = new THREE.CylinderGeometry(radius, radius, height, 16);
    var tankMat = new THREE.MeshStandardMaterial({ color: 0x2F4F4F, metalness: 0.5, roughness: 0.5 });
    var tank = new THREE.Mesh(tankGeom, tankMat);
    tank.position.y = height / 2;
    group.add(tank);

    // Tank dome top
    var domeGeom = new THREE.SphereGeometry(radius, 16, 8);
    var domeMat = new THREE.MeshStandardMaterial({ color: 0x1C1C1C, metalness: 0.6, roughness: 0.4 });
    var dome = new THREE.Mesh(domeGeom, domeMat);
    dome.position.y = height;
    dome.scale.y = 0.5;
    group.add(dome);

    // Support legs
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var legX = Math.cos(angle) * radius * 0.8;
      var legZ = Math.sin(angle) * radius * 0.8;
      var legGeom = new THREE.CylinderGeometry(0.4, 0.4, height, 4);
      var legMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7 });
      var leg = new THREE.Mesh(legGeom, legMat);
      leg.position.set(legX, height / 2, legZ);
      group.add(leg);
    }

    group.position.set(x, y, z);
    return group;
  }

  function createCoolingTower(x, y, z, width, height) {
    var group = new THREE.Group();

    // Main cone structure
    var coneGeom = new THREE.ConeGeometry(width, height, 16);
    var coneMat = new THREE.MeshStandardMaterial({ color: 0x696969, metalness: 0.3, roughness: 0.7 });
    var cone = new THREE.Mesh(coneGeom, coneMat);
    cone.position.y = height / 2;
    group.add(cone);

    // Top rim
    var rimGeom = new THREE.CylinderGeometry(width * 1.1, width * 0.95, 1, 16);
    var rimMat = new THREE.MeshStandardMaterial({ color: 0x505050 });
    var rim = new THREE.Mesh(rimGeom, rimMat);
    rim.position.y = height;
    group.add(rim);

    group.position.set(x, y, z);
    return group;
  }

  function createTankerTruck(x, y, z, scale) {
    var group = new THREE.Group();

    // Cab
    var cabGeom = new THREE.BoxGeometry(2 * scale, 2.5 * scale, 3 * scale);
    var cabMat = new THREE.MeshStandardMaterial({ color: 0xCC0000, metalness: 0.6 });
    var cab = new THREE.Mesh(cabGeom, cabMat);
    cab.position.y = 1.5 * scale;
    group.add(cab);

    // Tank
    var tankGeom = new THREE.CylinderGeometry(3 * scale, 3 * scale, 8 * scale, 12);
    var tankMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, metalness: 0.7, roughness: 0.3 });
    var tank = new THREE.Mesh(tankGeom, tankMat);
    tank.position.set(0, 3 * scale, -2 * scale);
    tank.rotation.z = Math.PI / 2;
    group.add(tank);

    // Wheels
    for (var i = 0; i < 2; i++) {
      var wheelGeom = new THREE.CylinderGeometry(1.2 * scale, 1.2 * scale, 0.5 * scale, 8);
      var wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
      var wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(-2 * scale, 1 * scale, -3 * scale + i * 4 * scale);
      group.add(wheel);
    }

    group.position.set(x, y, z);
    return group;
  }

  function createControlRoom(x, y, z, length, width, height) {
    var group = new THREE.Group();

    // Main building box
    var buildingGeom = new THREE.BoxGeometry(length, height, width);
    var buildingMat = new THREE.MeshStandardMaterial({ color: 0xAA5500, metalness: 0.4, roughness: 0.6 });
    var building = new THREE.Mesh(buildingGeom, buildingMat);
    building.position.y = height / 2;
    group.add(building);

    // Roof
    var roofGeom = new THREE.BoxGeometry(length + 1, 0.5, width + 1);
    var roofMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = height + 0.5;
    group.add(roof);

    // Windows
    for (var i = 0; i < 3; i++) {
      var windowGeom = new THREE.BoxGeometry(2, 1.5, 0.1);
      var windowMat = new THREE.MeshStandardMaterial({ color: 0x4444FF, emissive: 0x2222AA });
      var window = new THREE.Mesh(windowGeom, windowMat);
      window.position.set(-3 + i * 3, height * 0.6, width / 2 + 0.1);
      group.add(window);
    }

    group.position.set(x, y, z);
    return group;
  }

  function createPipelineNetwork(x, y, z, length, radius) {
    var group = new THREE.Group();

    // Main horizontal pipe
    var mainPipeGeom = new THREE.CylinderGeometry(radius, radius, length, 8);
    var pipeMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, metalness: 0.6, roughness: 0.4 });
    var mainPipe = new THREE.Mesh(mainPipeGeom, pipeMat);
    mainPipe.rotation.z = Math.PI / 2;
    mainPipe.position.x = length / 2;
    group.add(mainPipe);

    // Branch pipes
    for (var i = 0; i < 3; i++) {
      var branchGeom = new THREE.CylinderGeometry(radius * 0.6, radius * 0.6, 10, 6);
      var branchPipe = new THREE.Mesh(branchGeom, pipeMat);
      branchPipe.rotation.z = Math.PI / 4;
      branchPipe.position.set(5 + i * 5, 5, 0);
      group.add(branchPipe);
    }

    // Valves
    for (var j = 0; j < 2; j++) {
      var valveGeom = new THREE.SphereGeometry(radius * 1.5, 6, 6);
      var valveMat = new THREE.MeshStandardMaterial({ color: 0xFF6347 });
      var valve = new THREE.Mesh(valveGeom, valveMat);
      valve.position.set(5 + j * 8, 0, 0);
      group.add(valve);
    }

    group.position.set(x, y, z);
    return group;
  }

  function createChemicalUnit(x, y, z, scale) {
    var group = new THREE.Group();

    // Reactor vessels
    for (var i = 0; i < 3; i++) {
      var vesselGeom = new THREE.SphereGeometry(2 * scale, 8, 8);
      var vesselMat = new THREE.MeshStandardMaterial({ color: 0x4169E1, metalness: 0.5, roughness: 0.5 });
      var vessel = new THREE.Mesh(vesselGeom, vesselMat);
      vessel.position.set(-3 * scale + i * 3 * scale, 2 * scale, 0);
      group.add(vessel);
    }

    // Connecting pipes
    var pipeGeom = new THREE.CylinderGeometry(0.3 * scale, 0.3 * scale, 3 * scale, 6);
    var pipeMat = new THREE.MeshStandardMaterial({ color: 0x2F4F7F });
    for (var j = 0; j < 2; j++) {
      var pipe = new THREE.Mesh(pipeGeom, pipeMat);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(-1.5 * scale + j * 3 * scale, 2 * scale, 0);
      group.add(pipe);
    }

    group.position.set(x, y, z);
    return group;
  }

  function createScaffolding(x, y, z, width, height) {
    var group = new THREE.Group();

    // Vertical posts
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 2; j++) {
        var postGeom = new THREE.BoxGeometry(0.5, height, 0.5);
        var postMat = new THREE.MeshStandardMaterial({ color: 0x696969, metalness: 0.7 });
        var post = new THREE.Mesh(postGeom, postMat);
        post.position.set(-width / 2 + i * width / 2, height / 2, -2 + j * 4);
        group.add(post);
      }
    }

    // Horizontal beams
    for (var k = 0; k < 4; k++) {
      var beamGeom = new THREE.BoxGeometry(width, 0.3, 0.3);
      var beamMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
      var beam = new THREE.Mesh(beamGeom, beamMat);
      beam.position.set(0, k * (height / 3), 0);
      group.add(beam);
    }

    // Diagonal bracing
    var braceGeom = new THREE.BoxGeometry(0.2, Math.sqrt(width * width + height * height) / 2, 0.2);
    var braceMat = new THREE.MeshStandardMaterial({ color: 0x505050 });
    for (var m = 0; m < 2; m++) {
      var brace = new THREE.Mesh(braceGeom, braceMat);
      brace.rotation.z = Math.PI / 4;
      brace.position.set(-width / 4 + m * width / 2, height / 2, 0);
      group.add(brace);
    }

    group.position.set(x, y, z);
    return group;
  }

  function createOilSpillFire(x, y, z, radius) {
    var group = new THREE.Group();

    // Ground damage
    var groundGeom = new THREE.CylinderGeometry(radius, radius, 0.2, 12);
    var groundMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x330000 });
    var ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.y = 0.1;
    group.add(ground);

    // Fire bodies
    for (var i = 0; i < 3; i++) {
      var fireGeom = new THREE.ConeGeometry(radius * 0.7, 6, 8);
      var fireMat = new THREE.MeshStandardMaterial({ color: 0xFF4500, emissive: 0xFF2500, transparent: true });
      var fire = new THREE.Mesh(fireGeom, fireMat);
      fire.position.set(-radius / 2 + i * radius / 2, 3, 0);
      group.add(fire);
    }

    group.position.set(x, y, z);
    return group;
  }

  function initializeParticles(scene) {
    // Create particle systems for effects
    var particleCount = 500;

    // Flare particles
    var flareGeom = new THREE.BufferGeometry();
    var flarePositions = new Float32Array(particleCount * 3);
    for (var i = 0; i < particleCount * 3; i++) {
      flarePositions[i] = (Math.random() - 0.5) * 40;
    }
    flareGeom.setAttribute('position', new THREE.BufferAttribute(flarePositions, 3));
    var flareMat = new THREE.PointsMaterial({ color: 0xFFAA00, size: 0.3 });
    var flareParticleSystem = new THREE.Points(flareGeom, flareMat);
    flareParticles.push(flareParticleSystem);

    // Fire particles
    var fireGeom = new THREE.BufferGeometry();
    var firePositions = new Float32Array(particleCount * 3);
    for (var j = 0; j < particleCount * 3; j++) {
      firePositions[j] = (Math.random() - 0.5) * 40;
    }
    fireGeom.setAttribute('position', new THREE.BufferAttribute(firePositions, 3));
    var fireMat = new THREE.PointsMaterial({ color: 0xFF0000, size: 0.25 });
    var fireParticleSystem = new THREE.Points(fireGeom, fireMat);
    fireParticles.push(fireParticleSystem);

    // Smoke particles
    var smokeGeom = new THREE.BufferGeometry();
    var smokePositions = new Float32Array(particleCount * 3);
    for (var k = 0; k < particleCount * 3; k++) {
      smokePositions[k] = (Math.random() - 0.5) * 40;
    }
    smokeGeom.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
    var smokeMat = new THREE.PointsMaterial({ color: 0x888888, size: 0.4 });
    var smokeParticleSystem = new THREE.Points(smokeGeom, smokeMat);
    smokeParticles.push(smokeParticleSystem);
  }

  function update(delta) {
    if (!currentScene) return;

    // Update flare stack animations
    if (animations.flare1) {
      animations.flare1.intensity += delta * 2;
      if (animations.flare1.intensity > 1) animations.flare1.intensity = 0;
    }

    if (animations.flare2) {
      animations.flare2.intensity += delta * 1.5;
      if (animations.flare2.intensity > 1) animations.flare2.intensity = 0;
    }

    // Update cooling tower smoke
    if (animations.cooling1) {
      animations.cooling1.smokeHeight = Math.sin(Date.now() * 0.001) * 2 + 3;
    }

    if (animations.cooling2) {
      animations.cooling2.smokeHeight = Math.cos(Date.now() * 0.0008) * 2 + 3;
    }

    // Update pipeline vibration from explosions
    if (animations.pipe1Vibrate) {
      animations.pipe1Vibrate.vibration = Math.sin(Date.now() * 0.005) * 0.3;
      animations.pipe1Vibrate.object.position.y = 8 + animations.pipe1Vibrate.vibration;
    }

    // Update oil fire spreading
    if (animations.oilFire) {
      animations.oilFire.intensity += delta * 0.5;
      if (animations.oilFire.intensity > 1) {
        animations.oilFire.intensity = 0;
      }
      animations.oilFire.object.rotation.y += delta * 0.3;
    }

    // Update tank fire
    if (animations.tank3Fire) {
      animations.tank3Fire.intensity += delta * 0.8;
      if (animations.tank3Fire.intensity > 1) {
        animations.tank3Fire.intensity = 0;
      }
    }

    // Animate flare stacks with flickering
    for (var key in animations) {
      var anim = animations[key];
      if (anim.object && anim.burn) {
        anim.object.rotation.z += delta * 0.1;
      }
    }
  }

  function reset() {
    if (!currentScene) return;

    // Remove all objects from scene
    for (var i = 0; i < objects.length; i++) {
      currentScene.remove(objects[i]);
    }

    objects = [];
    animations = {};
    flareParticles = [];
    fireParticles = [];
    smokeParticles = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };

}());
