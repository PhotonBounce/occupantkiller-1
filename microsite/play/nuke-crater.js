window.NukeCrater = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var particles = [];
  var glowLights = [];
  var time = 0;
  var geigercounter = 0;

  var Colors = {
    radioactive: 0x00ff00,
    radioactiveDark: 0x008800,
    lava: 0xff4400,
    metal: 0x444444,
    rust: 0x885533,
    danger: 0xff0000,
    concrete: 0x666666,
    darkAsphalt: 0x222222,
    warning: 0xffaa00
  };

  function createMaterial(color, emissive) {
    var mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || 0x000000,
      metalness: 0.3,
      roughness: 0.7
    });
    return mat;
  }

  function addObject(mesh) {
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createCraterFloor() {
    var centerGeom = new THREE.CylinderGeometry(20, 20, 2, 32);
    var centerMat = createMaterial(Colors.lava, Colors.lava);
    var centerMesh = new THREE.Mesh(centerGeom, centerMat);
    centerMesh.position.y = 0.5;
    centerMesh.castShadow = true;
    centerMesh.receiveShadow = true;
    addObject(centerMesh);

    var poolGeom = new THREE.CylinderGeometry(15, 15, 1, 32);
    var poolMat = createMaterial(Colors.radioactiveDark, Colors.radioactive);
    var poolMesh = new THREE.Mesh(poolGeom, poolMat);
    poolMesh.position.y = 1.2;
    poolMesh.castShadow = true;
    poolMesh.receiveShadow = true;
    addObject(poolMesh);
  }

  function createCraterRim() {
    var rimRadius = 28;
    var rimHeight = 15;

    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var x = Math.cos(angle) * rimRadius;
      var z = Math.sin(angle) * rimRadius;

      var rimGeom = new THREE.BoxGeometry(6, rimHeight, 4);
      var rimMat = createMaterial(Colors.concrete, 0x000000);
      var rimMesh = new THREE.Mesh(rimGeom, rimMat);
      rimMesh.position.set(x, rimHeight / 2, z);
      rimMesh.castShadow = true;
      rimMesh.receiveShadow = true;
      addObject(rimMesh);
    }
  }

  function createObservationPosts() {
    var positions = [
      { x: 32, z: 0 },
      { x: -32, z: 0 },
      { x: 0, z: 32 },
      { x: 0, z: -32 }
    ];

    positions.forEach(function(pos) {
      var towerGeom = new THREE.CylinderGeometry(2, 3, 18, 16);
      var towerMat = createMaterial(Colors.metal, 0x000000);
      var towerMesh = new THREE.Mesh(towerGeom, towerMat);
      towerMesh.position.set(pos.x, 9, pos.z);
      towerMesh.castShadow = true;
      towerMesh.receiveShadow = true;
      addObject(towerMesh);

      var roofGeom = new THREE.ConeGeometry(3, 3, 8);
      var roofMat = createMaterial(Colors.rust, 0x000000);
      var roofMesh = new THREE.Mesh(roofGeom, roofMat);
      roofMesh.position.set(pos.x, 19, pos.z);
      roofMesh.castShadow = true;
      roofMesh.receiveShadow = true;
      addObject(roofMesh);

      var platformGeom = new THREE.CylinderGeometry(4, 4, 1, 8);
      var platformMat = createMaterial(Colors.concrete, 0x000000);
      var platformMesh = new THREE.Mesh(platformGeom, platformMat);
      platformMesh.position.set(pos.x, 18, pos.z);
      platformMesh.castShadow = true;
      platformMesh.receiveShadow = true;
      addObject(platformMesh);
    });
  }

  function createBlastWalls() {
    var wallPositions = [
      { x: 15, z: 15, rot: Math.PI / 4 },
      { x: -15, z: 15, rot: -Math.PI / 4 },
      { x: 15, z: -15, rot: -Math.PI / 4 },
      { x: -15, z: -15, rot: Math.PI / 4 }
    ];

    wallPositions.forEach(function(pos) {
      var wallGeom = new THREE.BoxGeometry(10, 6, 1);
      var wallMat = createMaterial(Colors.concrete, 0x000000);
      var wallMesh = new THREE.Mesh(wallGeom, wallMat);
      wallMesh.position.set(pos.x, 3, pos.z);
      wallMesh.rotation.y = pos.rot;
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      addObject(wallMesh);
    });
  }

  function createRadiationWarningPosts() {
    var postPositions = [
      { x: 25, z: 20 },
      { x: -25, z: 20 },
      { x: 25, z: -20 },
      { x: -25, z: -20 },
      { x: 35, z: 0 },
      { x: -35, z: 0 }
    ];

    postPositions.forEach(function(pos) {
      var poleGeom = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
      var poleMat = createMaterial(Colors.warning, 0x000000);
      var poleMesh = new THREE.Mesh(poleGeom, poleMat);
      poleMesh.position.set(pos.x, 4, pos.z);
      poleMesh.castShadow = true;
      poleMesh.receiveShadow = true;
      addObject(poleMesh);

      var signGeom = new THREE.BoxGeometry(2, 2, 0.3);
      var signMat = createMaterial(Colors.danger, Colors.danger);
      var signMesh = new THREE.Mesh(signGeom, signMat);
      signMesh.position.set(pos.x, 8, pos.z);
      signMesh.castShadow = true;
      signMesh.receiveShadow = true;
      addObject(signMesh);
    });
  }

  function createGeigercounterStations() {
    var stationPositions = [
      { x: 10, z: 30 },
      { x: -10, z: 30 },
      { x: 30, z: 10 },
      { x: -30, z: 10 }
    ];

    stationPositions.forEach(function(pos) {
      var baseGeom = new THREE.BoxGeometry(3, 0.5, 3);
      var baseMat = createMaterial(Colors.metal, 0x000000);
      var baseMesh = new THREE.Mesh(baseGeom, baseMat);
      baseMesh.position.set(pos.x, 0.25, pos.z);
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      addObject(baseMesh);

      var deviceGeom = new THREE.BoxGeometry(2, 2, 1);
      var deviceMat = createMaterial(Colors.radioactive, Colors.radioactive);
      var deviceMesh = new THREE.Mesh(deviceGeom, deviceMat);
      deviceMesh.position.set(pos.x, 2, pos.z);
      deviceMesh.castShadow = true;
      deviceMesh.receiveShadow = true;
      addObject(deviceMesh);
    });
  }

  function createFalloutShelterEntrances() {
    var shelterPositions = [
      { x: -22, z: 22 },
      { x: 22, z: -22 }
    ];

    shelterPositions.forEach(function(pos) {
      var entryGeom = new THREE.BoxGeometry(4, 3, 6);
      var entryMat = createMaterial(Colors.darkAsphalt, 0x000000);
      var entryMesh = new THREE.Mesh(entryGeom, entryMat);
      entryMesh.position.set(pos.x, 1.5, pos.z);
      entryMesh.castShadow = true;
      entryMesh.receiveShadow = true;
      addObject(entryMesh);

      var doorGeom = new THREE.BoxGeometry(3, 2.5, 0.3);
      var doorMat = createMaterial(Colors.metal, 0x000000);
      var doorMesh = new THREE.Mesh(doorGeom, doorMat);
      doorMesh.position.set(pos.x, 1.5, pos.z + 3);
      doorMesh.castShadow = true;
      doorMesh.receiveShadow = true;
      addObject(doorMesh);
    });
  }

  function createVehicleWrecks() {
    var wreckPositions = [
      { x: -20, z: -25 },
      { x: 20, z: 25 }
    ];

    wreckPositions.forEach(function(pos) {
      var hullGeom = new THREE.BoxGeometry(6, 3, 12);
      var hullMat = createMaterial(Colors.rust, 0x000000);
      var hullMesh = new THREE.Mesh(hullGeom, hullMat);
      hullMesh.position.set(pos.x, 1.5, pos.z);
      hullMesh.rotation.z = 0.2;
      hullMesh.castShadow = true;
      hullMesh.receiveShadow = true;
      addObject(hullMesh);

      var turretGeom = new THREE.CylinderGeometry(2, 2.5, 2, 8);
      var turretMat = createMaterial(Colors.metal, 0x000000);
      var turretMesh = new THREE.Mesh(turretGeom, turretMat);
      turretMesh.position.set(pos.x, 3.5, pos.z);
      turretMesh.castShadow = true;
      turretMesh.receiveShadow = true;
      addObject(turretMesh);

      var gunGeom = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
      var gunMat = createMaterial(Colors.darkAsphalt, 0x000000);
      var gunMesh = new THREE.Mesh(gunGeom, gunMat);
      gunMesh.position.set(pos.x + 3, 4, pos.z);
      gunMesh.rotation.z = Math.PI / 6;
      gunMesh.castShadow = true;
      gunMesh.receiveShadow = true;
      addObject(gunMesh);
    });
  }

  function createMeltedInfrastructure() {
    var infraPositions = [
      { x: 28, z: 28 },
      { x: -28, z: 28 },
      { x: 28, z: -28 },
      { x: -28, z: -28 }
    ];

    infraPositions.forEach(function(pos) {
      var rubbleGeom = new THREE.BoxGeometry(8, 4, 8);
      var rubbleMat = createMaterial(Colors.concrete, 0x000000);
      var rubbleMesh = new THREE.Mesh(rubbleGeom, rubbleMat);
      rubbleMesh.position.set(pos.x, 2, pos.z);
      rubbleMesh.rotation.x = 0.1;
      rubbleMesh.rotation.z = 0.15;
      rubbleMesh.castShadow = true;
      rubbleMesh.receiveShadow = true;
      addObject(rubbleMesh);

      var spikeGeom = new THREE.ConeGeometry(1.5, 5, 8);
      var spikeMat = createMaterial(Colors.rust, 0x000000);
      var spikeMesh = new THREE.Mesh(spikeGeom, spikeMat);
      spikeMesh.position.set(pos.x + 3, 3, pos.z + 3);
      spikeMesh.castShadow = true;
      spikeMesh.receiveShadow = true;
      addObject(spikeMesh);
    });
  }

  function createRadiationHotZones() {
    var hotZonePositions = [
      { x: 5, z: 5 },
      { x: -5, z: 5 },
      { x: 5, z: -5 },
      { x: -5, z: -5 }
    ];

    hotZonePositions.forEach(function(pos) {
      var zoneGeom = new THREE.CylinderGeometry(4, 4, 0.5, 16);
      var zoneMat = createMaterial(Colors.danger, Colors.danger);
      var zoneMesh = new THREE.Mesh(zoneGeom, zoneMat);
      zoneMesh.position.set(pos.x, 0.25, pos.z);
      zoneMesh.castShadow = true;
      zoneMesh.receiveShadow = true;
      addObject(zoneMesh);
    });
  }

  function createShadowSilhouettes() {
    var silhouettePositions = [
      { x: 20, z: -30, w: 5, h: 12, d: 8 },
      { x: -20, z: 30, w: 6, h: 14, d: 7 },
      { x: -35, z: -20, w: 4, h: 10, d: 6 }
    ];

    silhouettePositions.forEach(function(pos) {
      var silhGeom = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
      var silhMat = createMaterial(0x111111, 0x000000);
      var silhMesh = new THREE.Mesh(silhGeom, silhMat);
      silhMesh.position.set(pos.x, pos.h / 2, pos.z);
      silhMesh.castShadow = true;
      silhMesh.receiveShadow = true;
      addObject(silhMesh);
    });
  }

  function createParticles() {
    var particleCount = 150;
    for (var i = 0; i < particleCount; i++) {
      var particle = {
        x: (Math.random() - 0.5) * 70,
        y: Math.random() * 25,
        z: (Math.random() - 0.5) * 70,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.2,
        vz: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 0.3 + 0.1,
        life: Math.random() * 1 + 0.5
      };
      particles.push(particle);
    }
  }

  function updateParticles(delta) {
    particles.forEach(function(p) {
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;
      p.life -= delta * 0.5;

      if (p.y < 0.5) {
        p.y = 25;
        p.x = (Math.random() - 0.5) * 70;
        p.z = (Math.random() - 0.5) * 70;
        p.life = 1;
      }
    });
  }

  function createGlowLights() {
    var glow1 = new THREE.PointLight(Colors.radioactive, 1.5, 40);
    glow1.position.set(0, 8, 0);
    glow1.castShadow = true;
    scene.add(glow1);
    glowLights.push(glow1);

    var glow2 = new THREE.PointLight(Colors.lava, 1, 30);
    glow2.position.set(0, 3, 0);
    glow2.castShadow = true;
    scene.add(glow2);
    glowLights.push(glow2);

    var glow3 = new THREE.PointLight(Colors.danger, 0.8, 25);
    glow3.position.set(10, 5, 10);
    glow3.castShadow = true;
    scene.add(glow3);
    glowLights.push(glow3);

    var glow4 = new THREE.PointLight(Colors.danger, 0.8, 25);
    glow4.position.set(-10, 5, -10);
    glow4.castShadow = true;
    scene.add(glow4);
    glowLights.push(glow4);

    var ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 100, 150);

    createCraterFloor();
    createCraterRim();
    createObservationPosts();
    createBlastWalls();
    createRadiationWarningPosts();
    createGeigercounterStations();
    createFalloutShelterEntrances();
    createVehicleWrecks();
    createMeltedInfrastructure();
    createRadiationHotZones();
    createShadowSilhouettes();
    createGlowLights();
    createParticles();
  }

  function updateglow(delta) {
    time += delta;
    var baseIntensity = 1.5;
    var pulse = Math.sin(time * 2) * 0.5 + 1;

    if (glowLights.length > 0) {
      glowLights[0].intensity = baseIntensity * pulse;
    }

    var flicker = Math.random() * 0.3;
    if (glowLights.length > 1) {
      glowLights[1].intensity = 1 * (1 - flicker);
    }

    geigercounter += delta;
    if (geigercounter > 0.3 && Math.random() > 0.7) {
      if (glowLights.length > 2) {
        glowLights[2].intensity = 1.2;
        glowLights[3].intensity = 1.2;
      }
      geigercounter = 0;
    } else {
      if (glowLights.length > 2) {
        glowLights[2].intensity = 0.8;
        glowLights[3].intensity = 0.8;
      }
    }
  }

  function update(delta) {
    updateglow(delta);
    updateParticles(delta);

    objects.forEach(function(obj) {
      if (obj.position.y > 1 && Math.random() < 0.02) {
        obj.rotation.x += (Math.random() - 0.5) * 0.001;
        obj.rotation.z += (Math.random() - 0.5) * 0.001;
      }
    });
  }

  function reset() {
    scene.children.forEach(function(child) {
      if (child instanceof THREE.Mesh || child instanceof THREE.Light) {
        scene.remove(child);
      }
    });
    objects = [];
    particles = [];
    glowLights = [];
    time = 0;
    geigercounter = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
