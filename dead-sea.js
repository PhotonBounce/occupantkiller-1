window.DeadSea = (function() {
  'use strict';

  var scene;
  var camera;
  var waterLight;
  var crystalGlowLights;
  var floatingVehicles;
  var structures;
  var patrolBoats;
  var time;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    time = 0;
    crystalGlowLights = [];
    floatingVehicles = [];
    structures = [];
    patrolBoats = [];

    createTerrain();
    createWaterEnvironment();
    createSaltCrystals();
    createMilitaryStructures();
    createFloatingVehicles();
    createPatrolBoats();
    createDesalinationStation();
    createAncientRuins();
    createExtractionPlatforms();
    createMineralHaze();
    createLighting();
  }

  function createTerrain() {
    var geometry = new THREE.BoxGeometry(80, 2, 80);
    var material = new THREE.MeshStandardMaterial({
      color: 0xf5f5f0,
      roughness: 0.8,
      metalness: 0.1
    });
    var floor = new THREE.Mesh(geometry, material);
    floor.position.y = -1;
    floor.receiveShadow = true;
    scene.add(floor);

    var shoreRock1 = new THREE.Mesh(
      new THREE.BoxGeometry(12, 8, 15),
      new THREE.MeshStandardMaterial({
        color: 0xe0d5c7,
        roughness: 0.9,
        metalness: 0
      })
    );
    shoreRock1.position.set(-38, 3, -30);
    shoreRock1.rotation.z = 0.3;
    shoreRock1.castShadow = true;
    scene.add(shoreRock1);
    structures.push(shoreRock1);

    var shoreRock2 = new THREE.Mesh(
      new THREE.BoxGeometry(10, 6, 12),
      new THREE.MeshStandardMaterial({
        color: 0xd9cec6,
        roughness: 0.85,
        metalness: 0
      })
    );
    shoreRock2.position.set(35, 2, 38);
    shoreRock2.rotation.z = -0.2;
    shoreRock2.castShadow = true;
    scene.add(shoreRock2);
    structures.push(shoreRock2);
  }

  function createWaterEnvironment() {
    var waterGeometry = new THREE.BoxGeometry(75, 3, 75);
    var waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a7c7e,
      metalness: 0.6,
      roughness: 0.3
    });
    var waterBody = new THREE.Mesh(waterGeometry, waterMaterial);
    waterBody.position.set(0, 0, 0);
    waterBody.receiveShadow = true;
    scene.add(waterBody);

    for (var i = 0; i < 8; i++) {
      var posX = (Math.random() - 0.5) * 60;
      var posZ = (Math.random() - 0.5) * 60;
      var shimmerLight = new THREE.PointLight(0x87ceeb, 0.5, 25);
      shimmerLight.position.set(posX, 2, posZ);
      scene.add(shimmerLight);
      crystalGlowLights.push({
        light: shimmerLight,
        baseX: posX,
        baseZ: posZ
      });
    }
  }

  function createSaltCrystals() {
    var crystalPositions = [
      [-25, 0, 15],
      [-15, 0, 25],
      [10, 0, -20],
      [28, 0, 10],
      [-35, 0, -15],
      [5, 0, 35],
      [-20, 0, -35],
      [30, 0, 30]
    ];

    for (var i = 0; i < crystalPositions.length; i++) {
      var pos = crystalPositions[i];
      createCrystalSpire(pos[0], pos[1], pos[2]);
    }
  }

  function createCrystalSpire(x, y, z) {
    var height = 8 + Math.random() * 6;
    var spire = new THREE.Mesh(
      new THREE.ConeGeometry(2, height, 6),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.4,
        roughness: 0.2,
        emissive: 0xccccff,
        emissiveIntensity: 0.3
      })
    );
    spire.position.set(x, y + height / 2, z);
    spire.castShadow = true;
    scene.add(spire);
    structures.push(spire);

    var glowLight = new THREE.PointLight(0xddddff, 1, 30);
    glowLight.position.set(x, y + height, z);
    scene.add(glowLight);
    crystalGlowLights.push({
      light: glowLight,
      baseX: x,
      baseZ: z,
      baseIntensity: 1
    });
  }

  function createMilitaryStructures() {
    var tower1 = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3.5, 18, 8),
      new THREE.MeshStandardMaterial({
        color: 0x2c3e50,
        metalness: 0.7,
        roughness: 0.4
      })
    );
    tower1.position.set(-28, 9, 20);
    tower1.castShadow = true;
    scene.add(tower1);
    structures.push(tower1);

    var radarDish = new THREE.Mesh(
      new THREE.SphereGeometry(2, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0x34495e,
        metalness: 0.85,
        roughness: 0.3
      })
    );
    radarDish.position.set(-28, 20, 20);
    radarDish.scale.set(1.5, 0.6, 1.5);
    radarDish.castShadow = true;
    scene.add(radarDish);
    structures.push(radarDish);

    var tower2 = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 3, 15, 8),
      new THREE.MeshStandardMaterial({
        color: 0x34495e,
        metalness: 0.6,
        roughness: 0.5
      })
    );
    tower2.position.set(32, 7.5, -25);
    tower2.castShadow = true;
    scene.add(tower2);
    structures.push(tower2);

    var searchlight = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.5, 3, 8),
      new THREE.MeshStandardMaterial({
        color: 0x2c3e50,
        metalness: 0.75,
        roughness: 0.3
      })
    );
    searchlight.position.set(32, 16, -25);
    searchlight.castShadow = true;
    scene.add(searchlight);
    structures.push(searchlight);
  }

  function createFloatingVehicles() {
    var vehicle1 = createTankHull(-20, 1, -10);
    floatingVehicles.push({
      mesh: vehicle1,
      baseY: 1,
      amplitude: 0.4,
      phase: 0
    });

    var vehicle2 = createTankHull(18, 1, 12);
    floatingVehicles.push({
      mesh: vehicle2,
      baseY: 1,
      amplitude: 0.35,
      phase: 1.5
    });

    var vehicle3 = createTankHull(-5, 0.8, 28);
    floatingVehicles.push({
      mesh: vehicle3,
      baseY: 0.8,
      amplitude: 0.3,
      phase: 3
    });
  }

  function createTankHull(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var hull = new THREE.Mesh(
      new THREE.BoxGeometry(8, 3, 5),
      new THREE.MeshStandardMaterial({
        color: 0x556b2f,
        metalness: 0.5,
        roughness: 0.6
      })
    );
    hull.position.y = 1.5;
    hull.castShadow = true;
    group.add(hull);

    var turret = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 2, 2.5, 8),
      new THREE.MeshStandardMaterial({
        color: 0x5d7b3f,
        metalness: 0.55,
        roughness: 0.5
      })
    );
    turret.position.y = 3.5;
    turret.castShadow = true;
    group.add(turret);

    var barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 6, 8),
      new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.8,
        roughness: 0.3
      })
    );
    barrel.position.set(0, 3.5, -3.5);
    barrel.rotation.z = Math.PI / 2;
    barrel.castShadow = true;
    group.add(barrel);

    scene.add(group);
    structures.push(group);
    return group;
  }

  function createPatrolBoats() {
    var boat1 = createBoat(-15, 0.5, 8);
    patrolBoats.push({
      mesh: boat1,
      baseY: 0.5,
      baseX: -15,
      baseZ: 8,
      pattern: 0
    });

    var boat2 = createBoat(22, 0.5, -15);
    patrolBoats.push({
      mesh: boat2,
      baseY: 0.5,
      baseX: 22,
      baseZ: -15,
      pattern: 1
    });
  }

  function createBoat(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var hull = new THREE.Mesh(
      new THREE.BoxGeometry(6, 1.5, 3),
      new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.7,
        roughness: 0.4
      })
    );
    hull.position.y = 0.75;
    hull.castShadow = true;
    group.add(hull);

    var cabin = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.8, 2),
      new THREE.MeshStandardMaterial({
        color: 0x2c3e50,
        metalness: 0.6,
        roughness: 0.5
      })
    );
    cabin.position.set(0, 2, 0);
    cabin.castShadow = true;
    group.add(cabin);

    var antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 3, 6),
      new THREE.MeshStandardMaterial({
        color: 0x555555,
        metalness: 0.8,
        roughness: 0.3
      })
    );
    antenna.position.set(0.5, 3.5, 0);
    antenna.castShadow = true;
    group.add(antenna);

    scene.add(group);
    return group;
  }

  function createDesalinationStation() {
    var stationGroup = new THREE.Group();
    stationGroup.position.set(-30, 3, -28);

    var tank1 = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3.2, 8, 12),
      new THREE.MeshStandardMaterial({
        color: 0x7f8c8d,
        metalness: 0.6,
        roughness: 0.4
      })
    );
    tank1.position.set(-5, 4, 0);
    tank1.castShadow = true;
    stationGroup.add(tank1);

    var tank2 = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3.2, 8, 12),
      new THREE.MeshStandardMaterial({
        color: 0x95a5a6,
        metalness: 0.55,
        roughness: 0.45
      })
    );
    tank2.position.set(5, 4, 0);
    tank2.castShadow = true;
    stationGroup.add(tank2);

    var pipe1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 12, 8),
      new THREE.MeshStandardMaterial({
        color: 0x34495e,
        metalness: 0.7,
        roughness: 0.3
      })
    );
    pipe1.position.set(0, 6, -6);
    pipe1.rotation.z = Math.PI / 2;
    pipe1.castShadow = true;
    stationGroup.add(pipe1);

    var pump = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.8, 4, 8),
      new THREE.MeshStandardMaterial({
        color: 0x2c3e50,
        metalness: 0.75,
        roughness: 0.35
      })
    );
    pump.position.set(0, 2, 0);
    pump.castShadow = true;
    stationGroup.add(pump);

    scene.add(stationGroup);
    structures.push(stationGroup);
  }

  function createAncientRuins() {
    var ruinGroup = new THREE.Group();
    ruinGroup.position.set(25, 1, 22);

    var column1 = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1.1, 10, 8),
      new THREE.MeshStandardMaterial({
        color: 0xb8860b,
        metalness: 0.2,
        roughness: 0.8
      })
    );
    column1.position.set(-4, 5, -3);
    column1.castShadow = true;
    column1.rotation.z = 0.15;
    ruinGroup.add(column1);

    var column2 = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1.1, 9, 8),
      new THREE.MeshStandardMaterial({
        color: 0xcd853f,
        metalness: 0.15,
        roughness: 0.85
      })
    );
    column2.position.set(4, 4.5, 3);
    column2.castShadow = true;
    column2.rotation.z = -0.2;
    ruinGroup.add(column2);

    var debris1 = new THREE.Mesh(
      new THREE.BoxGeometry(6, 1.5, 4),
      new THREE.MeshStandardMaterial({
        color: 0x9d7f4a,
        metalness: 0.1,
        roughness: 0.9
      })
    );
    debris1.position.set(0, 1, 0);
    debris1.rotation.z = 0.3;
    debris1.castShadow = true;
    ruinGroup.add(debris1);

    var stoneSphere = new THREE.Mesh(
      new THREE.SphereGeometry(2, 8, 8),
      new THREE.MeshStandardMaterial({
        color: 0xa0826d,
        metalness: 0.1,
        roughness: 0.85
      })
    );
    stoneSphere.position.set(-6, 2.5, 5);
    stoneSphere.castShadow = true;
    ruinGroup.add(stoneSphere);

    scene.add(ruinGroup);
    structures.push(ruinGroup);
  }

  function createExtractionPlatforms() {
    var platform1 = createPlatform(-12, 2, -18);
    structures.push(platform1);

    var platform2 = createPlatform(15, 1.5, 18);
    structures.push(platform2);

    var platform3 = createPlatform(0, 2.5, -12);
    structures.push(platform3);
  }

  function createPlatform(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var base = new THREE.Mesh(
      new THREE.BoxGeometry(12, 1, 10),
      new THREE.MeshStandardMaterial({
        color: 0x36454f,
        metalness: 0.65,
        roughness: 0.4
      })
    );
    base.castShadow = true;
    group.add(base);

    var support1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.8, 8, 6),
      new THREE.MeshStandardMaterial({
        color: 0x2c3e50,
        metalness: 0.7,
        roughness: 0.35
      })
    );
    support1.position.set(-4, -4.5, -3);
    support1.castShadow = true;
    group.add(support1);

    var support2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.8, 8, 6),
      new THREE.MeshStandardMaterial({
        color: 0x34495e,
        metalness: 0.68,
        roughness: 0.38
      })
    );
    support2.position.set(4, -4.5, 3);
    support2.castShadow = true;
    group.add(support2);

    var derrick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, 15, 6),
      new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.75,
        roughness: 0.3
      })
    );
    derrick.position.set(0, 10, 0);
    derrick.castShadow = true;
    group.add(derrick);

    scene.add(group);
    return group;
  }

  function createMineralHaze() {
    var hazeGeometry = new THREE.SphereGeometry(60, 16, 16);
    var hazeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0e68c,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      emissive: 0xfffacd,
      emissiveIntensity: 0.2
    });
    var hazeSphere = new THREE.Mesh(hazeGeometry, hazeMaterial);
    hazeSphere.position.set(0, 15, 0);
    scene.add(hazeSphere);

    var dustParticles = createDustParticles();
    scene.add(dustParticles);
  }

  function createDustParticles() {
    var vertices = [];
    for (var i = 0; i < 200; i++) {
      var x = (Math.random() - 0.5) * 80;
      var y = Math.random() * 25;
      var z = (Math.random() - 0.5) * 80;
      vertices.push(x, y, z);
    }

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));

    var material = new THREE.PointsMaterial({
      color: 0xfffacd,
      size: 0.3,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.4
    });

    var particles = new THREE.Points(geometry, material);
    return particles;
  }

  function createLighting() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(30, 40, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -60;
    directionalLight.shadow.camera.right = 60;
    directionalLight.shadow.camera.top = 60;
    directionalLight.shadow.camera.bottom = -60;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 100;
    scene.add(directionalLight);
    waterLight = directionalLight;

    var warningSkyLight = new THREE.PointLight(0xff6b6b, 0.3, 100);
    warningSkyLight.position.set(-35, 25, -35);
    scene.add(warningSkyLight);
  }

  function update(delta) {
    time += delta;

    updateFloatingVehicles();
    updatePatrolBoats();
    updateCrystalGlows();
    updateWaterShimmers();
  }

  function updateFloatingVehicles() {
    for (var i = 0; i < floatingVehicles.length; i++) {
      var vehicle = floatingVehicles[i];
      vehicle.mesh.position.y = vehicle.baseY + Math.sin(time * 1.5 + vehicle.phase) * vehicle.amplitude;
      vehicle.mesh.rotation.z = Math.sin(time * 0.8 + vehicle.phase) * 0.05;
      vehicle.mesh.rotation.x = Math.cos(time * 0.6 + vehicle.phase) * 0.03;
    }
  }

  function updatePatrolBoats() {
    for (var i = 0; i < patrolBoats.length; i++) {
      var boat = patrolBoats[i];
      if (boat.pattern === 0) {
        boat.mesh.position.x = boat.baseX + Math.sin(time * 0.4) * 8;
        boat.mesh.position.z = boat.baseZ + Math.cos(time * 0.35) * 10;
      } else {
        boat.mesh.position.x = boat.baseX + Math.cos(time * 0.45) * 12;
        boat.mesh.position.z = boat.baseZ + Math.sin(time * 0.4) * 8;
      }
      boat.mesh.position.y = boat.baseY + Math.sin(time * 1.2) * 0.25;
      boat.mesh.rotation.y = Math.atan2(Math.cos(time * 0.45), Math.sin(time * 0.4));
    }
  }

  function updateCrystalGlows() {
    for (var i = 0; i < crystalGlowLights.length; i++) {
      var glowData = crystalGlowLights[i];
      var baseInt = glowData.baseIntensity || 0.5;
      var variation = Math.sin(time * 2 + i) * 0.3 + 0.5;
      glowData.light.intensity = baseInt * variation;
    }
  }

  function updateWaterShimmers() {
    if (waterLight) {
      waterLight.intensity = 0.7 + Math.sin(time * 0.5) * 0.15;
    }
  }

  function reset() {
    time = 0;
    for (var i = 0; i < floatingVehicles.length; i++) {
      floatingVehicles[i].mesh.position.y = floatingVehicles[i].baseY;
      floatingVehicles[i].mesh.rotation.set(0, 0, 0);
    }
    for (var j = 0; j < patrolBoats.length; j++) {
      patrolBoats[j].mesh.position.x = patrolBoats[j].baseX;
      patrolBoats[j].mesh.position.z = patrolBoats[j].baseZ;
      patrolBoats[j].mesh.position.y = patrolBoats[j].baseY;
      patrolBoats[j].mesh.rotation.set(0, 0, 0);
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
