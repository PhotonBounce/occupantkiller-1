window.CopperMine = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var rotationState = {};

  function createTerracedPit() {
    var pitGroup = new THREE.Group();
    var tierHeight = 15;
    var tierCount = 5;
    var startWidth = 180;

    for (var i = 0; i < tierCount; i++) {
      var width = startWidth - (i * 30);
      var depth = width;
      var height = tierHeight;
      var yPos = -i * tierHeight;

      var geometry = new THREE.BoxGeometry(width, height, depth);
      var material = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.7,
        metalness: 0.1
      });
      var tier = new THREE.Mesh(geometry, material);
      tier.position.y = yPos;
      tier.castShadow = true;
      tier.receiveShadow = true;
      pitGroup.add(tier);
    }
    return pitGroup;
  }

  function createConveyorTower(xPos, zPos) {
    var towerGroup = new THREE.Group();
    towerGroup.position.set(xPos, 10, zPos);

    var cylinderGeom = new THREE.CylinderGeometry(4, 4, 40, 16);
    var metalMaterial = new THREE.MeshStandardMaterial({
      color: 0xA9A9A9,
      roughness: 0.6,
      metalness: 0.8
    });
    var mast = new THREE.Mesh(cylinderGeom, metalMaterial);
    mast.castShadow = true;
    mast.receiveShadow = true;
    towerGroup.add(mast);

    var hopperGeom = new THREE.BoxGeometry(12, 8, 12);
    var hopper = new THREE.Mesh(hopperGeom, metalMaterial);
    hopper.position.y = 24;
    hopper.castShadow = true;
    hopper.receiveShadow = true;
    towerGroup.add(hopper);

    rotationState['tower_' + xPos] = { obj: mast, speed: 0.3 };
    return towerGroup;
  }

  function createDumpTruck(xPos, zPos) {
    var truckGroup = new THREE.Group();
    truckGroup.position.set(xPos, 5, zPos);

    var bodyGeom = new THREE.BoxGeometry(14, 8, 32);
    var truckMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      roughness: 0.5,
      metalness: 0.3
    });
    var body = new THREE.Mesh(bodyGeom, truckMaterial);
    body.position.y = 4;
    body.castShadow = true;
    body.receiveShadow = true;
    truckGroup.add(body);

    var wheelGeom = new THREE.CylinderGeometry(6, 6, 4, 12);
    var wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.2
    });

    for (var i = 0; i < 4; i++) {
      var wheel = new THREE.Mesh(wheelGeom, wheelMaterial);
      var xWheelOffset = (i < 2) ? -7 : 7;
      var zWheelOffset = (i % 2 === 0) ? -10 : 10;
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(xWheelOffset, 0, zWheelOffset);
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      truckGroup.add(wheel);
    }
    return truckGroup;
  }

  function createOreStockpile(xPos, zPos) {
    var stockGeom = new THREE.ConeGeometry(20, 25, 16);
    var stockMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B7355,
      roughness: 0.7,
      metalness: 0.05
    });
    var stockpile = new THREE.Mesh(stockGeom, stockMaterial);
    stockpile.position.set(xPos, 12.5, zPos);
    stockpile.castShadow = true;
    stockpile.receiveShadow = true;
    return stockpile;
  }

  function createBlastDrill(xPos, zPos) {
    var drillGroup = new THREE.Group();
    drillGroup.position.set(xPos, 5, zPos);

    var mastGeom = new THREE.CylinderGeometry(2, 2, 50, 8);
    var drillMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.6,
      metalness: 0.4
    });
    var mast = new THREE.Mesh(mastGeom, drillMaterial);
    mast.position.y = 25;
    mast.castShadow = true;
    mast.receiveShadow = true;
    drillGroup.add(mast);

    var engineGeom = new THREE.BoxGeometry(10, 8, 14);
    var engine = new THREE.Mesh(engineGeom, drillMaterial);
    engine.position.set(0, 4, 8);
    engine.castShadow = true;
    engine.receiveShadow = true;
    drillGroup.add(engine);

    return drillGroup;
  }

  function createBucketWheelExcavator(xPos, zPos) {
    var excavGroup = new THREE.Group();
    excavGroup.position.set(xPos, 8, zPos);

    var boomGeom = new THREE.CylinderGeometry(3, 3, 50, 8);
    var excavMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6347,
      roughness: 0.5,
      metalness: 0.6
    });
    var boom = new THREE.Mesh(boomGeom, excavMaterial);
    boom.rotation.z = Math.PI / 6;
    boom.position.set(15, 15, 0);
    boom.castShadow = true;
    boom.receiveShadow = true;
    excavGroup.add(boom);

    var wheelGeom = new THREE.CylinderGeometry(12, 12, 6, 16);
    var wheel = new THREE.Mesh(wheelGeom, excavMaterial);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(20, 8, 0);
    wheel.castShadow = true;
    wheel.receiveShadow = true;
    excavGroup.add(wheel);

    var cablePoints = [
      new THREE.Vector3(20, 8, 0),
      new THREE.Vector3(35, 35, 5),
      new THREE.Vector3(32, 38, -5)
    ];
    var cableGeom = new THREE.BufferGeometry().setFromPoints(cablePoints);
    var cableMaterial = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
    var cable = new THREE.LineSegments(cableGeom, cableMaterial);
    excavGroup.add(cable);

    rotationState['excavator'] = { obj: wheel, speed: 0.2 };
    return excavGroup;
  }

  function createBlastShelter(xPos, zPos) {
    var shelterGroup = new THREE.Group();
    shelterGroup.position.set(xPos, 0, zPos);

    var wallGeom = new THREE.BoxGeometry(16, 6, 12);
    var concreteMaterial = new THREE.MeshStandardMaterial({
      color: 0x606060,
      roughness: 0.8,
      metalness: 0.0
    });
    var wall = new THREE.Mesh(wallGeom, concreteMaterial);
    wall.position.y = 3;
    wall.castShadow = true;
    wall.receiveShadow = true;
    shelterGroup.add(wall);

    var roofGeom = new THREE.BoxGeometry(18, 2, 14);
    var roof = new THREE.Mesh(roofGeom, concreteMaterial);
    roof.position.y = 7;
    roof.castShadow = true;
    roof.receiveShadow = true;
    shelterGroup.add(roof);

    return shelterGroup;
  }

  function createProcessingPlant() {
    var plantGroup = new THREE.Group();
    plantGroup.position.set(0, 0, -120);

    var baseGeom = new THREE.BoxGeometry(60, 8, 40);
    var plantMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B8680,
      roughness: 0.7,
      metalness: 0.2
    });
    var base = new THREE.Mesh(baseGeom, plantMaterial);
    base.position.y = 4;
    base.castShadow = true;
    base.receiveShadow = true;
    plantGroup.add(base);

    for (var i = 0; i < 5; i++) {
      var stackGeom = new THREE.CylinderGeometry(6, 8, 45, 12);
      var stack = new THREE.Mesh(stackGeom, plantMaterial);
      var xOffset = -20 + (i * 10);
      stack.position.set(xOffset, 26.5, 0);
      stack.castShadow = true;
      stack.receiveShadow = true;
      plantGroup.add(stack);
    }

    return plantGroup;
  }

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    meshes = [];
    rotationState = {};

    var pitGroup = createTerracedPit();
    scene.add(pitGroup);
    meshes.push(pitGroup);

    var tower1 = createConveyorTower(-50, 30);
    scene.add(tower1);
    meshes.push(tower1);

    var tower2 = createConveyorTower(50, -40);
    scene.add(tower2);
    meshes.push(tower2);

    var truck1 = createDumpTruck(-80, 0);
    scene.add(truck1);
    meshes.push(truck1);

    var truck2 = createDumpTruck(80, 50);
    scene.add(truck2);
    meshes.push(truck2);

    var stockpile1 = createOreStockpile(-100, -60);
    scene.add(stockpile1);
    meshes.push(stockpile1);

    var stockpile2 = createOreStockpile(100, 80);
    scene.add(stockpile2);
    meshes.push(stockpile2);

    var drill1 = createBlastDrill(-60, -80);
    scene.add(drill1);
    meshes.push(drill1);

    var drill2 = createBlastDrill(60, 70);
    scene.add(drill2);
    meshes.push(drill2);

    var excavator = createBucketWheelExcavator(0, -50);
    scene.add(excavator);
    meshes.push(excavator);

    var shelter1 = createBlastShelter(-45, 45);
    scene.add(shelter1);
    meshes.push(shelter1);

    var shelter2 = createBlastShelter(45, -45);
    scene.add(shelter2);
    meshes.push(shelter2);

    var plant = createProcessingPlant();
    scene.add(plant);
    meshes.push(plant);
  }

  function update(delta) {
    if (!scene) return;

    for (var key in rotationState) {
      if (rotationState.hasOwnProperty(key)) {
        var state = rotationState[key];
        state.obj.rotation.y += state.speed * delta;
      }
    }
  }

  function reset() {
    if (!scene) return;

    for (var i = 0; i < meshes.length; i++) {
      scene.remove(meshes[i]);
    }
    meshes = [];
    rotationState = {};
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
