window.CrystalMine = (function() {
  'use strict';

  var scene = null;
  var objects = [];
  var crystals = [];
  var conveyors = [];
  var pulseTimer = 0;

  var material = {
    wall: new THREE.MeshPhongMaterial({ color: 0x1a1a2e }),
    crystal: new THREE.MeshPhongMaterial({ color: 0xff00ff, emissive: 0xff00ff, shininess: 100 }),
    core: new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x00ffff, shininess: 120 }),
    conveyor: new THREE.MeshPhongMaterial({ color: 0x444444 }),
    turret: new THREE.MeshPhongMaterial({ color: 0x333333 }),
    laser: new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 })
  };

  function buildWalls() {
    var wallGeo = new THREE.BoxGeometry(100, 40, 100);
    var floor = new THREE.Mesh(wallGeo, material.wall);
    floor.position.y = -25;
    floor.scale.set(1, 0.5, 1);
    scene.add(floor);
    objects.push(floor);

    var ceil = new THREE.Mesh(wallGeo, material.wall);
    ceil.position.y = 25;
    ceil.scale.set(1, 0.5, 1);
    scene.add(ceil);
    objects.push(ceil);

    var wallLeft = new THREE.Mesh(wallGeo, material.wall);
    wallLeft.rotation.z = Math.PI / 2;
    wallLeft.position.x = -50;
    wallLeft.scale.set(1, 0.5, 1);
    scene.add(wallLeft);
    objects.push(wallLeft);

    var wallRight = new THREE.Mesh(wallGeo, material.wall);
    wallRight.rotation.z = Math.PI / 2;
    wallRight.position.x = 50;
    wallRight.scale.set(1, 0.5, 1);
    scene.add(wallRight);
    objects.push(wallRight);
  }

  function buildCrystals() {
    var positions = [
      { x: 0, y: 5, z: 0 },
      { x: -20, y: 8, z: -15 },
      { x: 20, y: 6, z: 15 },
      { x: -25, y: 10, z: 20 },
      { x: 25, y: 9, z: -20 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var glow = new THREE.CylinderGeometry(8, 8, 16, 12);
      var crystal = new THREE.Mesh(glow, material.crystal);
      crystal.position.set(pos.x, pos.y, pos.z);
      crystal.rotation.z = Math.random() * Math.PI;
      scene.add(crystal);
      objects.push(crystal);
      crystals.push({ mesh: crystal, baseIntensity: 0.6 + Math.random() * 0.4, speed: 1 + Math.random() * 2 });
    }
  }

  function buildCore() {
    var coreSphere = new THREE.SphereGeometry(12, 16, 16);
    var core = new THREE.Mesh(coreSphere, material.core);
    core.position.set(0, 0, 0);
    scene.add(core);
    objects.push(core);
    crystals.push({ mesh: core, baseIntensity: 1.0, speed: 0.5 });
  }

  function buildConveyors() {
    var positions = [
      { x: -15, y: -20, z: 0 },
      { x: 15, y: -20, z: 0 },
      { x: 0, y: -18, z: -30 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var cylGeo = new THREE.CylinderGeometry(4, 4, 30, 8);
      var conveyor = new THREE.Mesh(cylGeo, material.conveyor);
      conveyor.rotation.z = Math.PI / 2;
      conveyor.position.set(pos.x, pos.y, pos.z);
      scene.add(conveyor);
      objects.push(conveyor);
      conveyors.push({ mesh: conveyor, speed: 0.08 });
    }
  }

  function buildTurrets() {
    var turretPositions = [
      { x: -35, y: 15, z: -30 },
      { x: 35, y: 15, z: 30 },
      { x: 0, y: 18, z: -40 }
    ];

    for (var i = 0; i < turretPositions.length; i++) {
      var pos = turretPositions[i];
      var baseCone = new THREE.ConeGeometry(6, 8, 8);
      var base = new THREE.Mesh(baseCone, material.turret);
      base.position.set(pos.x, pos.y, pos.z);
      scene.add(base);
      objects.push(base);

      var barrelGeo = new THREE.CylinderGeometry(1.5, 1.5, 12, 6);
      var barrel = new THREE.Mesh(barrelGeo, material.turret);
      barrel.position.set(pos.x + 8, pos.y + 2, pos.z);
      barrel.rotation.z = Math.PI / 3;
      scene.add(barrel);
      objects.push(barrel);
    }
  }

  function buildEncrustedWalls() {
    var crystalGeo = new THREE.BoxGeometry(3, 3, 3);
    var wallCrystalPositions = [
      { x: -48, y: 0, z: 0 },
      { x: 48, y: 5, z: -10 },
      { x: 0, y: 22, z: -48 },
      { x: -30, y: -22, z: 30 },
      { x: 30, y: -20, z: -20 }
    ];

    for (var i = 0; i < wallCrystalPositions.length; i++) {
      var pos = wallCrystalPositions[i];
      var wallCrystal = new THREE.Mesh(crystalGeo, material.crystal);
      wallCrystal.position.set(pos.x, pos.y, pos.z);
      wallCrystal.rotation.x = Math.random() * Math.PI;
      wallCrystal.rotation.y = Math.random() * Math.PI;
      scene.add(wallCrystal);
      objects.push(wallCrystal);
      crystals.push({ mesh: wallCrystal, baseIntensity: 0.3, speed: 2.5 });
    }
  }

  function buildLaserGrid() {
    var laserPoints = [
      new THREE.Vector3(-30, 10, -30),
      new THREE.Vector3(30, 10, -30)
    ];
    var laserGeo = new THREE.BufferGeometry().setFromPoints(laserPoints);
    var laserLine = new THREE.LineSegments(laserGeo, material.laser);
    scene.add(laserLine);
    objects.push(laserLine);

    var laserPoints2 = [
      new THREE.Vector3(-30, 8, 30),
      new THREE.Vector3(30, 8, 30)
    ];
    var laserGeo2 = new THREE.BufferGeometry().setFromPoints(laserPoints2);
    var laserLine2 = new THREE.LineSegments(laserGeo2, material.laser);
    scene.add(laserLine2);
    objects.push(laserLine2);
  }

  function init(sceneRef, camera) {
    scene = sceneRef;

    buildWalls();
    buildCrystals();
    buildCore();
    buildConveyors();
    buildTurrets();
    buildEncrustedWalls();
    buildLaserGrid();

    var ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    objects.push(ambientLight);

    var crystalLight = new THREE.PointLight(0xff00ff, 2, 80);
    crystalLight.position.set(0, 5, 0);
    scene.add(crystalLight);
    objects.push(crystalLight);

    var coreLight = new THREE.PointLight(0x00ffff, 3, 100);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);
    objects.push(coreLight);
  }

  function update(delta) {
    pulseTimer += delta;

    for (var i = 0; i < crystals.length; i++) {
      var crystal = crystals[i];
      var pulse = Math.sin(pulseTimer * crystal.speed) * 0.3 + crystal.baseIntensity;
      crystal.mesh.material.emissiveIntensity = pulse;
    }

    for (var i = 0; i < conveyors.length; i++) {
      var conveyor = conveyors[i];
      conveyor.mesh.rotation.y += conveyor.speed * delta;
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    crystals = [];
    conveyors = [];
    pulseTimer = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
