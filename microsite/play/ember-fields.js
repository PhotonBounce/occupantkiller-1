window.EmberFields = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var emberParticles = [];
  var fireElements = [];
  var smokeElements = [];
  var time = 0;

  var materials = {};
  var geometries = {};

  function createMaterials() {
    materials.ember = new THREE.MeshStandardMaterial({
      color: 0xff4500,
      emissive: 0xff2200,
      emissiveIntensity: 0.8,
      metalness: 0.3,
      roughness: 0.6
    });

    materials.charcoal = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      emissive: 0x330000,
      emissiveIntensity: 0.1,
      metalness: 0.5,
      roughness: 0.9
    });

    materials.ash = new THREE.MeshStandardMaterial({
      color: 0x8b8680,
      emissive: 0x332211,
      emissiveIntensity: 0.05,
      metalness: 0.2,
      roughness: 0.95
    });

    materials.ashGround = new THREE.MeshStandardMaterial({
      color: 0x7a7570,
      emissive: 0x1a1100,
      emissiveIntensity: 0.3,
      metalness: 0.0,
      roughness: 1.0
    });

    materials.burnedGround = new THREE.MeshStandardMaterial({
      color: 0x4a4038,
      emissive: 0xff3300,
      emissiveIntensity: 0.6,
      metalness: 0.1,
      roughness: 0.85
    });

    materials.metal = new THREE.MeshStandardMaterial({
      color: 0x333333,
      emissive: 0x1a0000,
      emissiveIntensity: 0.15,
      metalness: 0.9,
      roughness: 0.4
    });

    materials.smoke = new THREE.MeshStandardMaterial({
      color: 0x555555,
      transparent: true,
      opacity: 0.4,
      emissive: 0x222222,
      emissiveIntensity: 0.2
    });

    materials.fire = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xff4400,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.7
    });
  }

  function createGeometries() {
    geometries.groundPlane = new THREE.BoxGeometry(80, 0.5, 80);
    geometries.trenchWall = new THREE.BoxGeometry(2, 3, 40);
    geometries.stump = new THREE.CylinderGeometry(1.2, 1.5, 4, 8);
    geometries.rubbleBlock = new THREE.BoxGeometry(3, 2, 2.5);
    geometries.farmhouseWall = new THREE.BoxGeometry(6, 4, 0.8);
    geometries.artilleryRound = new THREE.SphereGeometry(0.6, 8, 8);
    geometries.tankBody = new THREE.BoxGeometry(8, 3, 15);
    geometries.tankTurret = new THREE.CylinderGeometry(2.5, 2.5, 2.5, 12);
    geometries.gunBarrel = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
    geometries.commandTruck = new THREE.BoxGeometry(4, 3, 8);
    geometries.truckCab = new THREE.BoxGeometry(3, 2.5, 2);
    geometries.ember = new THREE.SphereGeometry(0.15, 4, 4);
    geometries.smokeCloud = new THREE.SphereGeometry(1.5, 6, 6);
    geometries.fireColumn = new THREE.ConeGeometry(2, 4, 8);
    geometries.cratePile = new THREE.BoxGeometry(1.8, 1.5, 2.2);
    geometries.sandbag = new THREE.BoxGeometry(1.2, 0.8, 0.6);
    geometries.barrelSmall = new THREE.CylinderGeometry(0.8, 0.9, 1.5, 6);
    geometries.supportBeam = new THREE.CylinderGeometry(0.3, 0.3, 6, 6);
    geometries.mediumRock = new THREE.SphereGeometry(1.2, 5, 5);
  }

  function buildEnvironment() {
    var groundMesh = new THREE.Mesh(geometries.groundPlane, materials.ashGround);
    groundMesh.position.y = -0.25;
    groundMesh.castShadow = true;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    var burnedSectionGeometry = new THREE.BoxGeometry(25, 0.6, 30);
    var burnedSection = new THREE.Mesh(burnedSectionGeometry, materials.burnedGround);
    burnedSection.position.set(-15, 0, 10);
    burnedSection.castShadow = true;
    burnedSection.receiveShadow = true;
    scene.add(burnedSection);
    fireElements.push({mesh: burnedSection, intensity: 0.6, phase: 0});

    var trench1 = new THREE.Mesh(geometries.trenchWall, materials.charcoal);
    trench1.position.set(-20, 1.5, 0);
    trench1.castShadow = true;
    trench1.receiveShadow = true;
    scene.add(trench1);

    var trench2 = new THREE.Mesh(geometries.trenchWall, materials.charcoal);
    trench2.position.set(15, 1.5, -25);
    trench2.castShadow = true;
    trench2.receiveShadow = true;
    scene.add(trench2);

    var trench3 = new THREE.Mesh(geometries.trenchWall, materials.charcoal);
    trench3.position.set(0, 1.8, 28);
    trench3.castShadow = true;
    trench3.receiveShadow = true;
    scene.add(trench3);

    var stump1 = new THREE.Mesh(geometries.stump, materials.charcoal);
    stump1.position.set(-30, 2, -15);
    stump1.castShadow = true;
    stump1.receiveShadow = true;
    scene.add(stump1);

    var stump2 = new THREE.Mesh(geometries.stump, materials.charcoal);
    stump2.position.set(25, 2, 20);
    stump2.castShadow = true;
    stump2.receiveShadow = true;
    scene.add(stump2);

    var stump3 = new THREE.Mesh(geometries.stump, materials.charcoal);
    stump3.position.set(-10, 2, 35);
    stump3.castShadow = true;
    stump3.receiveShadow = true;
    scene.add(stump3);

    var stump4 = new THREE.Mesh(geometries.stump, materials.charcoal);
    stump4.position.set(38, 2, -20);
    stump4.castShadow = true;
    stump4.receiveShadow = true;
    scene.add(stump4);

    var rubbleWall1 = new THREE.Mesh(geometries.farmhouseWall, materials.charcoal);
    rubbleWall1.position.set(10, 2, -35);
    rubbleWall1.castShadow = true;
    rubbleWall1.receiveShadow = true;
    scene.add(rubbleWall1);

    var rubbleWall2 = new THREE.Mesh(geometries.farmhouseWall, materials.charcoal);
    rubbleWall2.position.set(16, 2, -35);
    rubbleWall2.rotation.y = Math.PI / 2;
    rubbleWall2.castShadow = true;
    rubbleWall2.receiveShadow = true;
    scene.add(rubbleWall2);

    var rubbleBlock1 = new THREE.Mesh(geometries.rubbleBlock, materials.ash);
    rubbleBlock1.position.set(12, 1.5, -30);
    rubbleBlock1.castShadow = true;
    rubbleBlock1.receiveShadow = true;
    scene.add(rubbleBlock1);

    var rubbleBlock2 = new THREE.Mesh(geometries.rubbleBlock, materials.ash);
    rubbleBlock2.position.set(13, 3, -32);
    rubbleBlock2.castShadow = true;
    rubbleBlock2.receiveShadow = true;
    scene.add(rubbleBlock2);

    var rubbleBlock3 = new THREE.Mesh(geometries.rubbleBlock, materials.ash);
    rubbleBlock3.position.set(14, 2.5, -29);
    rubbleBlock3.castShadow = true;
    rubbleBlock3.receiveShadow = true;
    scene.add(rubbleBlock3);

    var tankHull = new THREE.Mesh(geometries.tankBody, materials.metal);
    tankHull.position.set(35, 1.5, 15);
    tankHull.castShadow = true;
    tankHull.receiveShadow = true;
    scene.add(tankHull);

    var turret = new THREE.Mesh(geometries.tankTurret, materials.metal);
    turret.position.set(35, 4, 15);
    turret.castShadow = true;
    turret.receiveShadow = true;
    scene.add(turret);

    var barrel = new THREE.Mesh(geometries.gunBarrel, materials.metal);
    barrel.position.set(35, 4, 12);
    barrel.rotation.z = Math.PI / 6;
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    scene.add(barrel);

    var commandTruck = new THREE.Mesh(geometries.commandTruck, materials.metal);
    commandTruck.position.set(-35, 1.5, -30);
    commandTruck.castShadow = true;
    commandTruck.receiveShadow = true;
    scene.add(commandTruck);

    var truckCab = new THREE.Mesh(geometries.truckCab, materials.charcoal);
    truckCab.position.set(-35, 3.5, -26);
    truckCab.castShadow = true;
    truckCab.receiveShadow = true;
    scene.add(truckCab);

    var artilleryPos1 = new THREE.Mesh(geometries.artilleryRound, materials.ember);
    artilleryPos1.position.set(-25, 1.2, 15);
    artilleryPos1.castShadow = true;
    artilleryPos1.receiveShadow = true;
    scene.add(artilleryPos1);
    fireElements.push({mesh: artilleryPos1, intensity: 0.5, phase: 1});

    var artilleryPos2 = new THREE.Mesh(geometries.artilleryRound, materials.ember);
    artilleryPos2.position.set(-26, 1.2, 17);
    artilleryPos2.castShadow = true;
    artilleryPos2.receiveShadow = true;
    scene.add(artilleryPos2);
    fireElements.push({mesh: artilleryPos2, intensity: 0.5, phase: 2});

    var crateStack1 = new THREE.Mesh(geometries.cratePile, materials.ash);
    crateStack1.position.set(5, 1, 15);
    crateStack1.castShadow = true;
    crateStack1.receiveShadow = true;
    scene.add(crateStack1);

    var crateStack2 = new THREE.Mesh(geometries.cratePile, materials.ash);
    crateStack2.position.set(6, 2.5, 15);
    crateStack2.castShadow = true;
    crateStack2.receiveShadow = true;
    scene.add(crateStack2);

    var sandbag1 = new THREE.Mesh(geometries.sandbag, materials.ash);
    sandbag1.position.set(-5, 0.5, 10);
    sandbag1.castShadow = true;
    sandbag1.receiveShadow = true;
    scene.add(sandbag1);

    var sandbag2 = new THREE.Mesh(geometries.sandbag, materials.ash);
    sandbag2.position.set(-4, 0.5, 11);
    sandbag2.castShadow = true;
    sandbag2.receiveShadow = true;
    scene.add(sandbag2);

    var barrel1 = new THREE.Mesh(geometries.barrelSmall, materials.metal);
    barrel1.position.set(20, 0.8, -10);
    barrel1.castShadow = true;
    barrel1.receiveShadow = true;
    scene.add(barrel1);

    var barrel2 = new THREE.Mesh(geometries.barrelSmall, materials.metal);
    barrel2.position.set(22, 0.8, -10);
    barrel2.castShadow = true;
    barrel2.receiveShadow = true;
    scene.add(barrel2);

    var beam1 = new THREE.Mesh(geometries.supportBeam, materials.charcoal);
    beam1.position.set(18, 3, -35);
    beam1.rotation.z = Math.PI / 4;
    beam1.castShadow = true;
    beam1.receiveShadow = true;
    scene.add(beam1);

    var beam2 = new THREE.Mesh(geometries.supportBeam, materials.charcoal);
    beam2.position.set(12, 3.5, -35);
    beam2.rotation.z = -Math.PI / 4;
    beam2.castShadow = true;
    beam2.receiveShadow = true;
    scene.add(beam2);

    var rock1 = new THREE.Mesh(geometries.mediumRock, materials.ash);
    rock1.position.set(-15, 1.5, -30);
    rock1.castShadow = true;
    rock1.receiveShadow = true;
    scene.add(rock1);

    var rock2 = new THREE.Mesh(geometries.mediumRock, materials.ash);
    rock2.position.set(30, 1.5, 30);
    rock2.castShadow = true;
    rock2.receiveShadow = true;
    scene.add(rock2);

    initializeParticles();
  }

  function initializeParticles() {
    var emberGeometry = geometries.ember;
    var emberMaterial = materials.ember;

    for (var i = 0; i < 40; i++) {
      var particle = new THREE.Mesh(emberGeometry, emberMaterial.clone());
      particle.position.x = Math.random() * 80 - 40;
      particle.position.y = Math.random() * 15 + 2;
      particle.position.z = Math.random() * 80 - 40;

      var vx = (Math.random() - 0.5) * 0.3;
      var vy = Math.random() * 0.4 + 0.15;
      var vz = (Math.random() - 0.5) * 0.3;

      particle.castShadow = true;
      particle.receiveShadow = true;
      scene.add(particle);

      emberParticles.push({
        mesh: particle,
        velocity: {x: vx, y: vy, z: vz},
        life: Math.random() * 0.5 + 0.5,
        maxLife: Math.random() * 0.5 + 0.5,
        spinX: (Math.random() - 0.5) * 0.2,
        spinY: (Math.random() - 0.5) * 0.2,
        spinZ: (Math.random() - 0.5) * 0.2
      });
    }

    var smokeGeometry = geometries.smokeCloud;
    var smokeMaterial = materials.smoke;

    for (var j = 0; j < 25; j++) {
      var smoke = new THREE.Mesh(smokeGeometry, smokeMaterial.clone());
      smoke.position.x = Math.random() * 60 - 30;
      smoke.position.y = Math.random() * 20 + 5;
      smoke.position.z = Math.random() * 60 - 30;

      var sVx = (Math.random() - 0.5) * 0.2;
      var sVy = Math.random() * 0.2 + 0.1;
      var sVz = (Math.random() - 0.5) * 0.2;

      smoke.castShadow = true;
      smoke.receiveShadow = true;
      scene.add(smoke);

      smokeElements.push({
        mesh: smoke,
        velocity: {x: sVx, y: sVy, z: sVz},
        life: Math.random() * 0.6 + 0.4,
        maxLife: Math.random() * 0.6 + 0.4,
        initialScale: 1.0
      });
    }
  }

  function updateEmbers(delta) {
    var i = 0;
    while (i < emberParticles.length) {
      var particle = emberParticles[i];
      particle.life -= delta;

      if (particle.life <= 0) {
        scene.remove(particle.mesh);
        emberParticles.splice(i, 1);
        continue;
      }

      particle.mesh.position.x += particle.velocity.x;
      particle.mesh.position.y += particle.velocity.y;
      particle.mesh.position.z += particle.velocity.z;

      particle.mesh.rotation.x += particle.spinX;
      particle.mesh.rotation.y += particle.spinY;
      particle.mesh.rotation.z += particle.spinZ;

      var ratio = particle.life / particle.maxLife;
      particle.mesh.material.opacity = ratio;

      if (particle.mesh.position.y > 50 || particle.mesh.position.y < -5) {
        particle.mesh.position.y = -10;
        particle.life = particle.maxLife;
        particle.mesh.position.x = Math.random() * 80 - 40;
        particle.mesh.position.z = Math.random() * 80 - 40;
      }

      i++;
    }

    if (emberParticles.length < 40) {
      var newEmber = new THREE.Mesh(geometries.ember, materials.ember.clone());
      newEmber.position.x = Math.random() * 80 - 40;
      newEmber.position.y = Math.random() * 10 + 2;
      newEmber.position.z = Math.random() * 80 - 40;

      var nvx = (Math.random() - 0.5) * 0.3;
      var nvy = Math.random() * 0.4 + 0.15;
      var nvz = (Math.random() - 0.5) * 0.3;

      newEmber.castShadow = true;
      newEmber.receiveShadow = true;
      scene.add(newEmber);

      emberParticles.push({
        mesh: newEmber,
        velocity: {x: nvx, y: nvy, z: nvz},
        life: Math.random() * 0.5 + 0.5,
        maxLife: Math.random() * 0.5 + 0.5,
        spinX: (Math.random() - 0.5) * 0.2,
        spinY: (Math.random() - 0.5) * 0.2,
        spinZ: (Math.random() - 0.5) * 0.2
      });
    }
  }

  function updateSmoke(delta) {
    var i = 0;
    while (i < smokeElements.length) {
      var smoke = smokeElements[i];
      smoke.life -= delta;

      if (smoke.life <= 0) {
        scene.remove(smoke.mesh);
        smokeElements.splice(i, 1);
        continue;
      }

      smoke.mesh.position.x += smoke.velocity.x;
      smoke.mesh.position.y += smoke.velocity.y;
      smoke.mesh.position.z += smoke.velocity.z;

      var ratio = smoke.life / smoke.maxLife;
      smoke.mesh.material.opacity = 0.4 * ratio;
      smoke.mesh.scale.x = 1.0 + (1.0 - ratio) * 0.5;
      smoke.mesh.scale.y = 1.0 + (1.0 - ratio) * 0.5;
      smoke.mesh.scale.z = 1.0 + (1.0 - ratio) * 0.5;

      if (smoke.mesh.position.y > 60 || smoke.mesh.position.y < -5) {
        smoke.mesh.position.y = -10;
        smoke.life = smoke.maxLife;
        smoke.mesh.position.x = Math.random() * 60 - 30;
        smoke.mesh.position.z = Math.random() * 60 - 30;
        smoke.mesh.scale.set(1, 1, 1);
      }

      i++;
    }

    if (smokeElements.length < 25) {
      var newSmoke = new THREE.Mesh(geometries.smokeCloud, materials.smoke.clone());
      newSmoke.position.x = Math.random() * 60 - 30;
      newSmoke.position.y = Math.random() * 15 + 5;
      newSmoke.position.z = Math.random() * 60 - 30;

      var nsvx = (Math.random() - 0.5) * 0.2;
      var nsvy = Math.random() * 0.2 + 0.1;
      var nsvz = (Math.random() - 0.5) * 0.2;

      newSmoke.castShadow = true;
      newSmoke.receiveShadow = true;
      scene.add(newSmoke);

      smokeElements.push({
        mesh: newSmoke,
        velocity: {x: nsvx, y: nsvy, z: nsvz},
        life: Math.random() * 0.6 + 0.4,
        maxLife: Math.random() * 0.6 + 0.4,
        initialScale: 1.0
      });
    }
  }

  function updateFireFlicker(delta) {
    time += delta;

    for (var i = 0; i < fireElements.length; i++) {
      var fireElement = fireElements[i];
      var flicker = Math.sin(time * 8 + fireElement.phase) * 0.5 + 0.5;
      var intensity = fireElement.intensity * (0.5 + flicker * 0.5);

      fireElement.mesh.material.emissiveIntensity = intensity;
      fireElement.mesh.material.color.setHSL(0.08, 0.8, 0.4 + flicker * 0.2);
    }
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    createMaterials();
    createGeometries();
    buildEnvironment();

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 40, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);

    var pointLight1 = new THREE.PointLight(0xff5500, 1.5, 50);
    pointLight1.position.set(-20, 5, 10);
    scene.add(pointLight1);

    var pointLight2 = new THREE.PointLight(0xff3300, 1.2, 40);
    pointLight2.position.set(10, 3, -30);
    scene.add(pointLight2);
  }

  function update(delta) {
    updateEmbers(delta);
    updateSmoke(delta);
    updateFireFlicker(delta);
  }

  function reset() {
    while (emberParticles.length > 0) {
      var particle = emberParticles.pop();
      scene.remove(particle.mesh);
    }

    while (smokeElements.length > 0) {
      var smoke = smokeElements.pop();
      scene.remove(smoke.mesh);
    }

    time = 0;
    initializeParticles();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
