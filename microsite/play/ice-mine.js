window.IceMine = (function() {
  'use strict';

  var scene;
  var camera;
  var objects = [];
  var particles = [];
  var drillRigs = [];
  var conveyors = [];
  var time = 0;

  var materialIceBlue;
  var materialMetalGray;
  var materialHeatedOrange;
  var materialSnow;
  var materialDark;
  var materialRed;

  function createMaterials() {
    materialIceBlue = new THREE.MeshStandardMaterial({
      color: 0x4a90e2,
      roughness: 0.3,
      metalness: 0.4
    });

    materialMetalGray = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.7,
      metalness: 0.8
    });

    materialHeatedOrange = new THREE.MeshStandardMaterial({
      color: 0xff6b35,
      roughness: 0.5,
      metalness: 0.3
    });

    materialSnow = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0
    });

    materialDark = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.8,
      metalness: 0.2
    });

    materialRed = new THREE.MeshStandardMaterial({
      color: 0xcc0000,
      roughness: 0.6,
      metalness: 0.3
    });
  }

  function addToPit(mesh) {
    mesh.position.y -= 15;
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createMinePit() {
    var pitWalls = new THREE.BoxGeometry(80, 30, 80);
    var pitMesh = new THREE.Mesh(pitWalls, materialIceBlue);
    pitMesh.position.y = -15;
    scene.add(pitMesh);

    var pitEdge1 = new THREE.BoxGeometry(82, 2, 82);
    var edge1Mesh = new THREE.Mesh(pitEdge1, materialSnow);
    edge1Mesh.position.y = 0;
    scene.add(edge1Mesh);
    objects.push(edge1Mesh);

    var pitBottom = new THREE.BoxGeometry(78, 1, 78);
    var bottomMesh = new THREE.Mesh(pitBottom, materialDark);
    bottomMesh.position.y = -30;
    scene.add(bottomMesh);
    objects.push(bottomMesh);
  }

  function createDrillRig(xPos, zPos) {
    var rigGroup = [];

    var tower = new THREE.CylinderGeometry(3, 3, 25, 8);
    var towerMesh = new THREE.Mesh(tower, materialMetalGray);
    towerMesh.position.set(xPos, 12.5, zPos);
    scene.add(towerMesh);
    rigGroup.push(towerMesh);

    var drill = new THREE.CylinderGeometry(1.5, 1.5, 8, 6);
    var drillMesh = new THREE.Mesh(drill, materialRed);
    drillMesh.position.set(xPos, 28, zPos);
    scene.add(drillMesh);
    rigGroup.push(drillMesh);

    var drillBit = new THREE.ConeGeometry(0.8, 3, 6);
    var bitMesh = new THREE.Mesh(drillBit, materialDark);
    bitMesh.position.set(xPos, 31, zPos);
    scene.add(bitMesh);
    rigGroup.push(bitMesh);

    var armBase = new THREE.CylinderGeometry(2, 2, 2, 8);
    var armMesh = new THREE.Mesh(armBase, materialMetalGray);
    armMesh.position.set(xPos, 26, zPos);
    scene.add(armMesh);
    rigGroup.push(armMesh);

    var topPlatform = new THREE.BoxGeometry(5, 1, 5);
    var topMesh = new THREE.Mesh(topPlatform, materialMetalGray);
    topMesh.position.set(xPos, 30, zPos);
    scene.add(topMesh);
    rigGroup.push(topMesh);

    drillRigs.push({
      drill: drillMesh,
      arm: armMesh,
      meshes: rigGroup
    });
  }

  function createConveyorBelt(xStart, xEnd, zPos) {
    var conveyorGroup = [];

    var support1 = new THREE.CylinderGeometry(1, 1, 3, 6);
    var sup1Mesh = new THREE.Mesh(support1, materialMetalGray);
    sup1Mesh.position.set(xStart, 1.5, zPos);
    scene.add(sup1Mesh);
    conveyorGroup.push(sup1Mesh);

    var support2 = new THREE.CylinderGeometry(1, 1, 3, 6);
    var sup2Mesh = new THREE.Mesh(support2, materialMetalGray);
    sup2Mesh.position.set(xEnd, 1.5, zPos);
    scene.add(sup2Mesh);
    conveyorGroup.push(sup2Mesh);

    var belt = new THREE.BoxGeometry(xEnd - xStart, 0.5, 2);
    var beltMesh = new THREE.Mesh(belt, materialDark);
    beltMesh.position.set((xStart + xEnd) / 2, 3, zPos);
    scene.add(beltMesh);
    conveyorGroup.push(beltMesh);

    var roller1 = new THREE.CylinderGeometry(0.5, 0.5, 2.5, 8);
    var roll1Mesh = new THREE.Mesh(roller1, materialMetalGray);
    roll1Mesh.position.set(xStart, 3, zPos);
    roll1Mesh.rotation.z = Math.PI / 2;
    scene.add(roll1Mesh);
    conveyorGroup.push(roll1Mesh);

    var roller2 = new THREE.CylinderGeometry(0.5, 0.5, 2.5, 8);
    var roll2Mesh = new THREE.Mesh(roller2, materialMetalGray);
    roll2Mesh.position.set(xEnd, 3, zPos);
    roll2Mesh.rotation.z = Math.PI / 2;
    scene.add(roll2Mesh);
    conveyorGroup.push(roll2Mesh);

    conveyors.push({
      belt: beltMesh,
      roller1: roll1Mesh,
      roller2: roll2Mesh,
      meshes: conveyorGroup
    });
  }

  function createWorkerBarracks() {
    var mainBuilding = new THREE.BoxGeometry(15, 8, 10);
    var buildingMesh = new THREE.Mesh(mainBuilding, materialHeatedOrange);
    buildingMesh.position.set(30, 4, -25);
    scene.add(buildingMesh);
    objects.push(buildingMesh);

    var roofCone = new THREE.ConeGeometry(8, 4, 6);
    var roofMesh = new THREE.Mesh(roofCone, materialRed);
    roofMesh.position.set(30, 12, -25);
    scene.add(roofMesh);
    objects.push(roofMesh);

    var chimney = new THREE.CylinderGeometry(1, 1, 6, 6);
    var chimneyMesh = new THREE.Mesh(chimney, materialMetalGray);
    chimneyMesh.position.set(32, 9, -23);
    scene.add(chimneyMesh);
    objects.push(chimneyMesh);

    var snowBerm1 = new THREE.BoxGeometry(18, 3, 12);
    var berm1Mesh = new THREE.Mesh(snowBerm1, materialSnow);
    berm1Mesh.position.set(30, 1.5, -25);
    scene.add(berm1Mesh);
    objects.push(berm1Mesh);

    var snowBerm2 = new THREE.BoxGeometry(12, 3, 3);
    var berm2Mesh = new THREE.Mesh(snowBerm2, materialSnow);
    berm2Mesh.position.set(25, 1.5, -18);
    scene.add(berm2Mesh);
    objects.push(berm2Mesh);
  }

  function createExplosiveMagazine() {
    var storage = new THREE.BoxGeometry(6, 5, 8);
    var storageMesh = new THREE.Mesh(storage, materialRed);
    storageMesh.position.set(-28, 2.5, 20);
    scene.add(storageMesh);
    objects.push(storageMesh);

    var door = new THREE.BoxGeometry(3, 4, 0.5);
    var doorMesh = new THREE.Mesh(door, materialDark);
    doorMesh.position.set(-28, 3, 24.2);
    scene.add(doorMesh);
    objects.push(doorMesh);

    var warningCylinder = new THREE.CylinderGeometry(1.5, 1.5, 2, 6);
    var warningMesh = new THREE.Mesh(warningCylinder, materialRed);
    warningMesh.position.set(-28, 7.5, 20);
    scene.add(warningMesh);
    objects.push(warningMesh);
  }

  function createWarningPost() {
    var post = new THREE.CylinderGeometry(0.4, 0.4, 12, 6);
    var postMesh = new THREE.Mesh(post, materialMetalGray);
    postMesh.position.set(-35, 6, -30);
    scene.add(postMesh);
    objects.push(postMesh);

    var siren = new THREE.SphereGeometry(1.2, 8, 8);
    var sirenMesh = new THREE.Mesh(siren, materialRed);
    sirenMesh.position.set(-35, 12.5, -30);
    scene.add(sirenMesh);
    objects.push(sirenMesh);

    var post2 = new THREE.CylinderGeometry(0.4, 0.4, 12, 6);
    var post2Mesh = new THREE.Mesh(post2, materialMetalGray);
    post2Mesh.position.set(35, 6, 30);
    scene.add(post2Mesh);
    objects.push(post2Mesh);

    var siren2 = new THREE.SphereGeometry(1.2, 8, 8);
    var siren2Mesh = new THREE.Mesh(siren2, materialRed);
    siren2Mesh.position.set(35, 12.5, 30);
    scene.add(siren2Mesh);
    objects.push(siren2Mesh);
  }

  function createOrePiles() {
    var pile1 = new THREE.BoxGeometry(8, 5, 8);
    var pileMesh1 = new THREE.Mesh(pile1, materialDark);
    pileMesh1.position.set(-20, 2.5, -5);
    scene.add(pileMesh1);
    objects.push(pileMesh1);

    var pile2 = new THREE.BoxGeometry(10, 6, 10);
    var pileMesh2 = new THREE.Mesh(pile2, materialDark);
    pileMesh2.position.set(15, 3, 10);
    scene.add(pileMesh2);
    objects.push(pileMesh2);

    var pile3 = new THREE.BoxGeometry(7, 4, 7);
    var pileMesh3 = new THREE.Mesh(pile3, materialDark);
    pileMesh3.position.set(-10, 2, 25);
    scene.add(pileMesh3);
    objects.push(pileMesh3);
  }

  function createMinimumEntranceStructure() {
    var entranceHole = new THREE.CylinderGeometry(4, 5, 3, 8);
    var entranceMesh = new THREE.Mesh(entranceHole, materialDark);
    entranceMesh.position.set(0, -28.5, 0);
    scene.add(entranceMesh);
    objects.push(entranceMesh);

    var supportFrame1 = new THREE.BoxGeometry(10, 1, 1);
    var support1Mesh = new THREE.Mesh(supportFrame1, materialMetalGray);
    support1Mesh.position.set(0, -26, -5);
    scene.add(support1Mesh);
    objects.push(support1Mesh);

    var supportFrame2 = new THREE.BoxGeometry(10, 1, 1);
    var support2Mesh = new THREE.Mesh(supportFrame2, materialMetalGray);
    support2Mesh.position.set(0, -26, 5);
    scene.add(support2Mesh);
    objects.push(support2Mesh);
  }

  function createVehicleDepot() {
    var depotBase = new THREE.BoxGeometry(12, 1, 15);
    var depotMesh = new THREE.Mesh(depotBase, materialSnow);
    depotMesh.position.set(25, 0.5, 35);
    scene.add(depotMesh);
    objects.push(depotMesh);

    var vehicle1 = new THREE.BoxGeometry(4, 3, 6);
    var veh1Mesh = new THREE.Mesh(vehicle1, materialMetalGray);
    veh1Mesh.position.set(20, 1.5, 35);
    scene.add(veh1Mesh);
    objects.push(veh1Mesh);

    var vehicle2 = new THREE.BoxGeometry(4, 3, 6);
    var veh2Mesh = new THREE.Mesh(vehicle2, materialMetalGray);
    veh2Mesh.position.set(30, 1.5, 35);
    scene.add(veh2Mesh);
    objects.push(veh2Mesh);

    var wheel1 = new THREE.CylinderGeometry(1, 1, 0.5, 8);
    var wheel1Mesh = new THREE.Mesh(wheel1, materialDark);
    wheel1Mesh.position.set(18, 1, 32);
    scene.add(wheel1Mesh);
    objects.push(wheel1Mesh);

    var wheel2 = new THREE.CylinderGeometry(1, 1, 0.5, 8);
    var wheel2Mesh = new THREE.Mesh(wheel2, materialDark);
    wheel2Mesh.position.set(32, 1, 38);
    scene.add(wheel2Mesh);
    objects.push(wheel2Mesh);
  }

  function createMiningCrane() {
    var craneBase = new THREE.BoxGeometry(3, 2, 3);
    var baseMesh = new THREE.Mesh(craneBase, materialMetalGray);
    baseMesh.position.set(-5, 2, -20);
    scene.add(baseMesh);
    objects.push(baseMesh);

    var cranePole = new THREE.CylinderGeometry(1, 1, 16, 8);
    var poleMesh = new THREE.Mesh(cranePole, materialMetalGray);
    poleMesh.position.set(-5, 10, -20);
    scene.add(poleMesh);
    objects.push(poleMesh);

    var craneJib = new THREE.BoxGeometry(18, 0.8, 1.5);
    var jibMesh = new THREE.Mesh(craneJib, materialMetalGray);
    jibMesh.position.set(4, 18, -20);
    scene.add(jibMesh);
    objects.push(jibMesh);

    var hook = new THREE.CylinderGeometry(0.6, 0.6, 2, 6);
    var hookMesh = new THREE.Mesh(hook, materialDark);
    hookMesh.position.set(4, 15, -20);
    scene.add(hookMesh);
    objects.push(hookMesh);

    var countWeight = new THREE.BoxGeometry(1.5, 2, 1.5);
    var weightMesh = new THREE.Mesh(countWeight, materialMetalGray);
    weightMesh.position.set(-12, 17, -20);
    scene.add(weightMesh);
    objects.push(weightMesh);
  }

  function createSurfaceStructures() {
    var surfaceArea1 = new THREE.BoxGeometry(30, 0.5, 30);
    var surface1Mesh = new THREE.Mesh(surfaceArea1, materialSnow);
    surface1Mesh.position.set(-15, 0.25, 0);
    scene.add(surface1Mesh);
    objects.push(surface1Mesh);

    var surfaceArea2 = new THREE.BoxGeometry(25, 0.5, 25);
    var surface2Mesh = new THREE.Mesh(surfaceArea2, materialSnow);
    surface2Mesh.position.set(20, 0.25, -20);
    scene.add(surface2Mesh);
    objects.push(surface2Mesh);
  }

  function createParticles() {
    for (var i = 0; i < 200; i++) {
      var particle = {
        x: Math.random() * 100 - 50,
        y: Math.random() * 60 - 10,
        z: Math.random() * 100 - 50,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 0.3 - 0.1,
        vz: (Math.random() - 0.5) * 0.5,
        life: Math.random()
      };
      particles.push(particle);
    }
  }

  function updateParticles(delta) {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;
      p.life -= delta * 0.3;

      if (p.life <= 0) {
        p.x = Math.random() * 100 - 50;
        p.y = Math.random() * 60 - 10;
        p.z = Math.random() * 100 - 50;
        p.life = 1;
      }
    }
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    createMaterials();
    createMinePit();
    createDrillRig(-15, 5);
    createDrillRig(15, -10);
    createConveyorBelt(-20, 0, -10);
    createConveyorBelt(5, 30, 5);
    createWorkerBarracks();
    createExplosiveMagazine();
    createWarningPost();
    createOrePiles();
    createMinimumEntranceStructure();
    createVehicleDepot();
    createMiningCrane();
    createSurfaceStructures();
    createParticles();

    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0xcccccc, 150, 300);

    var light1 = new THREE.DirectionalLight(0xffffff, 0.8);
    light1.position.set(50, 40, 50);
    scene.add(light1);

    var light2 = new THREE.DirectionalLight(0x6699ff, 0.4);
    light2.position.set(-50, 30, -50);
    scene.add(light2);

    var ambientLight = new THREE.AmbientLight(0xccccff, 0.5);
    scene.add(ambientLight);
  }

  function update(delta) {
    time += delta;

    updateParticles(delta);

    for (var i = 0; i < drillRigs.length; i++) {
      var rig = drillRigs[i];
      rig.drill.rotation.z += delta * 3;
      rig.arm.rotation.y = Math.sin(time * 0.5) * 0.3;
    }

    for (var j = 0; j < conveyors.length; j++) {
      var conv = conveyors[j];
      conv.belt.position.x += delta * 8;
      if (conv.belt.position.x > 50) {
        conv.belt.position.x = -50;
      }
      conv.roller1.rotation.z += delta * 4;
      conv.roller2.rotation.z += delta * 4;
    }

    for (var k = 0; k < objects.length; k++) {
      if (objects[k].userData && objects[k].userData.rotates) {
        objects[k].rotation.y += delta * 0.5;
      }
    }
  }

  function reset() {
    time = 0;
    for (var i = 0; i < conveyors.length; i++) {
      conveyors[i].belt.position.x = 0;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
