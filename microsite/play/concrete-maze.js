window.ConcreteMaze = (function() {
  'use strict';

  var scene;
  var camera;
  var mazeObjects = [];
  var lights = [];
  var particles = [];
  var watchtowers = [];
  var searchLights = [];
  var time = 0;

  var materials = {
    concrete: new THREE.MeshStandardMaterial({ color: 0x6b6b6b, roughness: 0.8, metalness: 0.1 }),
    concreteLight: new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.7, metalness: 0.05 }),
    concreteDark: new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.9, metalness: 0 }),
    Jersey: new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.6, metalness: 0.3 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.8 }),
    warning: new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.5, metalness: 0.2 }),
    caution: new THREE.MeshStandardMaterial({ color: 0xff8800, roughness: 0.5, metalness: 0.2 }),
    green: new THREE.MeshStandardMaterial({ color: 0x00aa00, roughness: 0.6, metalness: 0.1 })
  };

  function createWall(x, y, z, width, height, depth, material, rotation) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var mesh = new THREE.Mesh(geometry, material || materials.concrete);
    mesh.position.set(x, y, z);
    if (rotation) {
      mesh.rotation.y = rotation;
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    mazeObjects.push(mesh);
    return mesh;
  }

  function createJerseyBarrier(x, y, z, length) {
    var geometry = new THREE.BoxGeometry(length, 1.2, 0.6);
    var mesh = new THREE.Mesh(geometry, materials.Jersey);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    mazeObjects.push(mesh);
    return mesh;
  }

  function createWatchtower(x, z, height) {
    var towerGroup = {};
    var baseGeometry = new THREE.CylinderGeometry(3, 3.5, 2, 8);
    var baseMesh = new THREE.Mesh(baseGeometry, materials.concrete);
    baseMesh.position.set(x, 1, z);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);
    mazeObjects.push(baseMesh);

    var shaftGeometry = new THREE.CylinderGeometry(1.5, 1.5, height - 3, 12);
    var shaftMesh = new THREE.Mesh(shaftGeometry, materials.metal);
    shaftMesh.position.set(x, height / 2, z);
    shaftMesh.castShadow = true;
    shaftMesh.receiveShadow = true;
    scene.add(shaftMesh);
    mazeObjects.push(shaftMesh);

    var platformGeometry = new THREE.CylinderGeometry(4, 4, 0.8, 12);
    var platformMesh = new THREE.Mesh(platformGeometry, materials.concreteLight);
    platformMesh.position.set(x, height - 0.4, z);
    platformMesh.castShadow = true;
    platformMesh.receiveShadow = true;
    scene.add(platformMesh);
    mazeObjects.push(platformMesh);

    var railGeometry = new THREE.BoxGeometry(8, 1.2, 0.3);
    var railMesh = new THREE.Mesh(railGeometry, materials.metal);
    railMesh.position.set(x, height - 1.2, z);
    railMesh.castShadow = true;
    railMesh.receiveShadow = true;
    scene.add(railMesh);
    mazeObjects.push(railMesh);

    towerGroup.base = baseMesh;
    towerGroup.shaft = shaftMesh;
    towerGroup.platform = platformMesh;
    towerGroup.rail = railMesh;
    towerGroup.position = { x: x, y: height, z: z };

    return towerGroup;
  }

  function createSearchLight(x, y, z) {
    var lightGeometry = new THREE.ConeGeometry(2, 3, 8);
    var lightMesh = new THREE.Mesh(lightGeometry, materials.warning);
    lightMesh.position.set(x, y, z);
    lightMesh.castShadow = true;
    lightMesh.receiveShadow = true;
    scene.add(lightMesh);
    mazeObjects.push(lightMesh);

    var light = new THREE.SpotLight(0xffff99, 1.5, 60, Math.PI / 6, 0.5, 1);
    light.position.set(x, y + 2, z);
    light.castShadow = true;
    light.target.position.set(x, 0, z);
    scene.add(light);
    scene.add(light.target);
    lights.push(light);

    return {
      mesh: lightMesh,
      light: light,
      angle: 0,
      baseX: x,
      baseZ: z
    };
  }

  function createSmokeGrenade(x, y, z) {
    return {
      position: { x: x, y: y, z: z },
      particles: [],
      life: 0,
      maxLife: 4
    };
  }

  function updateSmokeParticles(grenade, delta) {
    grenade.life += delta;

    if (grenade.particles.length < 150 && grenade.life < grenade.maxLife * 0.7) {
      for (var i = 0; i < 3; i++) {
        var particle = {
          position: {
            x: grenade.position.x + (Math.random() - 0.5) * 2,
            y: grenade.position.y + (Math.random() - 0.5) * 2,
            z: grenade.position.z + (Math.random() - 0.5) * 2
          },
          velocity: {
            x: (Math.random() - 0.5) * 8,
            y: Math.random() * 6,
            z: (Math.random() - 0.5) * 8
          },
          life: 0,
          maxLife: 3 + Math.random() * 2,
          size: 0.3 + Math.random() * 0.3
        };
        grenade.particles.push(particle);
      }
    }

    for (var j = grenade.particles.length - 1; j >= 0; j--) {
      var p = grenade.particles[j];
      p.life += delta;
      p.position.x += p.velocity.x * delta;
      p.position.y += p.velocity.y * delta;
      p.position.z += p.velocity.z * delta;
      p.velocity.y -= 9.8 * delta;

      if (p.life >= p.maxLife) {
        grenade.particles.splice(j, 1);
      }
    }
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    time = 0;
    mazeObjects = [];
    lights = [];
    particles = [];
    watchtowers = [];
    searchLights = [];

    scene.background = new THREE.Color(0x1a1a1a);
    scene.fog = new THREE.Fog(0x1a1a1a, 100, 200);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(40, 50, 40);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -60;
    directionalLight.shadow.camera.right = 60;
    directionalLight.shadow.camera.top = 60;
    directionalLight.shadow.camera.bottom = -60;
    directionalLight.shadow.camera.far = 150;
    scene.add(directionalLight);
    lights.push(directionalLight);

    var groundGeometry = new THREE.BoxGeometry(100, 0.5, 100);
    var groundMesh = new THREE.Mesh(groundGeometry, materials.concreteDark);
    groundMesh.position.set(0, -0.25, 0);
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);
    mazeObjects.push(groundMesh);

    createMainMazeStructure();
    createNorthZone();
    createSouthZone();
    createEastZone();
    createWestZone();
    createCentralArena();
    createCatwalkNetwork();

    particles.push(createSmokeGrenade(15, 2, -20));
    particles.push(createSmokeGrenade(-25, 2, 20));

    watchtowers.push(createWatchtower(30, -30, 18));
    watchtowers.push(createWatchtower(-35, 35, 18));
    watchtowers.push(createWatchtower(35, 35, 18));
    watchtowers.push(createWatchtower(-30, -35, 18));

    searchLights.push(createSearchLight(30, 18, -30));
    searchLights.push(createSearchLight(-35, 18, 35));
    searchLights.push(createSearchLight(35, 18, 35));
    searchLights.push(createSearchLight(-30, 18, -35));
  }

  function createMainMazeStructure() {
    createWall(0, 3, 0, 2, 6, 80, materials.concrete);
    createWall(0, 3, 0, 80, 6, 2, materials.concrete);

    createWall(15, 3, -15, 30, 6, 2, materials.concreteLight);
    createWall(-15, 3, 15, 30, 6, 2, materials.concreteLight);

    createWall(20, 3, 10, 2, 6, 40, materials.concrete);
    createWall(-20, 3, -10, 2, 6, 40, materials.concreteDark);

    createWall(0, 3, -25, 50, 6, 2, materials.concrete);
    createWall(0, 3, 25, 50, 6, 2, materials.concreteLight);
  }

  function createNorthZone() {
    createWall(10, 3, -40, 20, 6, 2, materials.warning);
    createWall(30, 3, -45, 2, 6, 20, materials.warning);
    createWall(-10, 3, -50, 15, 6, 2, materials.concrete);
    createWall(-25, 3, -35, 2, 6, 25, materials.concrete);

    createJerseyBarrier(15, 1, -50, 10);
    createJerseyBarrier(5, 1, -55, 8);
    createJerseyBarrier(-15, 1, -45, 12);

    var blastCrater = new THREE.SphereGeometry(8, 12, 12);
    var craterMesh = new THREE.Mesh(blastCrater, materials.concreteDark);
    craterMesh.position.set(25, 0.5, -60);
    craterMesh.scale.y = 0.4;
    craterMesh.receiveShadow = true;
    scene.add(craterMesh);
    mazeObjects.push(craterMesh);

    createWarningStripes(20, 1.5, -48);
  }

  function createSouthZone() {
    createWall(-10, 3, 40, 20, 6, 2, materials.caution);
    createWall(-30, 3, 45, 2, 6, 20, materials.caution);
    createWall(10, 3, 50, 15, 6, 2, materials.concrete);
    createWall(25, 3, 35, 2, 6, 25, materials.concrete);

    createJerseyBarrier(-15, 1, 50, 10);
    createJerseyBarrier(-5, 1, 55, 8);
    createJerseyBarrier(15, 1, 45, 12);

    var blastCrater2 = new THREE.SphereGeometry(7, 12, 12);
    var craterMesh2 = new THREE.Mesh(blastCrater2, materials.concreteDark);
    craterMesh2.position.set(-25, 0.5, 60);
    craterMesh2.scale.y = 0.4;
    craterMesh2.receiveShadow = true;
    scene.add(craterMesh2);
    mazeObjects.push(craterMesh2);

    createWarningStripes(-20, 1.5, 48);
  }

  function createEastZone() {
    createWall(50, 3, 10, 2, 6, 30, materials.concrete);
    createWall(55, 3, -10, 2, 6, 35, materials.concrete);
    createWall(45, 3, 0, 15, 6, 2, materials.green);

    createJerseyBarrier(60, 1, 15, 10);
    createJerseyBarrier(50, 1, 25, 8);
    createJerseyBarrier(55, 1, -20, 12);

    createWall(70, 3, 20, 2, 6, 20, materials.warning);
    createWall(75, 3, -25, 2, 6, 25, materials.concrete);
  }

  function createWestZone() {
    createWall(-50, 3, 10, 2, 6, 30, materials.concrete);
    createWall(-55, 3, -10, 2, 6, 35, materials.concreteDark);
    createWall(-45, 3, 0, 15, 6, 2, materials.green);

    createJerseyBarrier(-60, 1, 15, 10);
    createJerseyBarrier(-50, 1, 25, 8);
    createJerseyBarrier(-55, 1, -20, 12);

    createWall(-70, 3, 20, 2, 6, 20, materials.warning);
    createWall(-75, 3, -25, 2, 6, 25, materials.concreteLight);
  }

  function createCentralArena() {
    createWall(5, 2.5, 0, 8, 5, 2, materials.concrete);
    createWall(-5, 2.5, 0, 8, 5, 2, materials.concrete);
    createWall(0, 2.5, 5, 2, 5, 8, materials.concrete);
    createWall(0, 2.5, -5, 2, 5, 8, materials.concrete);

    var centerPillar = new THREE.CylinderGeometry(2, 2, 10, 16);
    var pillarMesh = new THREE.Mesh(centerPillar, materials.metal);
    pillarMesh.position.set(0, 5, 0);
    pillarMesh.castShadow = true;
    pillarMesh.receiveShadow = true;
    scene.add(pillarMesh);
    mazeObjects.push(pillarMesh);

    createAmbushPositions();
  }

  function createAmbushPositions() {
    var positions = [
      { x: 12, z: -12 },
      { x: -12, z: 12 },
      { x: 12, z: 12 },
      { x: -12, z: -12 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      createWall(pos.x, 3, pos.z, 8, 6, 8, materials.concrete);

      var striped = new THREE.BoxGeometry(0.5, 4, 6);
      var stripedMesh = new THREE.Mesh(striped, materials.warning);
      stripedMesh.position.set(pos.x - 2, 2.5, pos.z);
      stripedMesh.castShadow = true;
      stripedMesh.receiveShadow = true;
      scene.add(stripedMesh);
      mazeObjects.push(stripedMesh);
    }
  }

  function createWarningStripes(x, y, z) {
    for (var i = 0; i < 4; i++) {
      var stripe = new THREE.BoxGeometry(0.4, 0.8, 0.4);
      var stripeMesh = new THREE.Mesh(stripe, materials.caution);
      stripeMesh.position.set(x + i * 1, y, z);
      stripeMesh.castShadow = true;
      stripeMesh.receiveShadow = true;
      scene.add(stripeMesh);
      mazeObjects.push(stripeMesh);
    }
  }

  function createCatwalkNetwork() {
    var catwalkHeight = 12;

    var walkway1 = new THREE.BoxGeometry(60, 0.6, 2);
    var walk1Mesh = new THREE.Mesh(walkway1, materials.metal);
    walk1Mesh.position.set(0, catwalkHeight, 0);
    walk1Mesh.castShadow = true;
    walk1Mesh.receiveShadow = true;
    scene.add(walk1Mesh);
    mazeObjects.push(walk1Mesh);

    var walkway2 = new THREE.BoxGeometry(2, 0.6, 60);
    var walk2Mesh = new THREE.Mesh(walkway2, materials.metal);
    walk2Mesh.position.set(0, catwalkHeight, 0);
    walk2Mesh.castShadow = true;
    walk2Mesh.receiveShadow = true;
    scene.add(walk2Mesh);
    mazeObjects.push(walk2Mesh);

    var support1 = new THREE.CylinderGeometry(0.5, 0.5, catwalkHeight, 8);
    var supp1Mesh = new THREE.Mesh(support1, materials.metal);
    supp1Mesh.position.set(20, catwalkHeight / 2, 20);
    supp1Mesh.castShadow = true;
    supp1Mesh.receiveShadow = true;
    scene.add(supp1Mesh);
    mazeObjects.push(supp1Mesh);

    var support2 = new THREE.CylinderGeometry(0.5, 0.5, catwalkHeight, 8);
    var supp2Mesh = new THREE.Mesh(support2, materials.metal);
    supp2Mesh.position.set(-20, catwalkHeight / 2, -20);
    supp2Mesh.castShadow = true;
    supp2Mesh.receiveShadow = true;
    scene.add(supp2Mesh);
    mazeObjects.push(supp2Mesh);

    var support3 = new THREE.CylinderGeometry(0.5, 0.5, catwalkHeight, 8);
    var supp3Mesh = new THREE.Mesh(support3, materials.metal);
    supp3Mesh.position.set(20, catwalkHeight / 2, -20);
    supp3Mesh.castShadow = true;
    supp3Mesh.receiveShadow = true;
    scene.add(supp3Mesh);
    mazeObjects.push(supp3Mesh);

    var railGeometry = new THREE.BoxGeometry(0.3, 1.2, 60);
    var railMesh = new THREE.Mesh(railGeometry, materials.warning);
    railMesh.position.set(30.5, catwalkHeight + 0.5, 0);
    railMesh.castShadow = true;
    railMesh.receiveShadow = true;
    scene.add(railMesh);
    mazeObjects.push(railMesh);
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < searchLights.length; i++) {
      var light = searchLights[i];
      light.angle += 0.5 * delta;
      if (light.angle > Math.PI * 2) {
        light.angle = 0;
      }

      var rotX = Math.cos(light.angle) * 40;
      var rotZ = Math.sin(light.angle) * 40;
      light.light.target.position.set(light.baseX + rotX, 0, light.baseZ + rotZ);
    }

    for (var j = 0; j < particles.length; j++) {
      updateSmokeParticles(particles[j], delta);
    }

    var flickerLights = [lights[0]];
    for (var k = 0; k < flickerLights.length; k++) {
      var flicker = flickerLights[k];
      var baseIntensity = 0.4;
      var flickerAmount = Math.sin(time * 8) * 0.05 + Math.random() * 0.03;
      flicker.intensity = Math.max(0.2, baseIntensity + flickerAmount);
    }

    for (var m = 0; m < watchtowers.length; m++) {
      var tower = watchtowers[m];
      tower.platform.rotation.y += 0.1 * delta;
    }
  }

  function reset() {
    for (var i = mazeObjects.length - 1; i >= 0; i--) {
      scene.remove(mazeObjects[i]);
    }
    for (var j = lights.length - 1; j >= 0; j--) {
      if (lights[j] !== scene.getObjectByProperty('type', 'Light')) {
        scene.remove(lights[j]);
      }
    }
    mazeObjects = [];
    lights = [];
    particles = [];
    watchtowers = [];
    searchLights = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
