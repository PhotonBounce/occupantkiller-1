window.SwampRefinery = (function() {
  'use strict';

  var scene, camera;
  var environmentObjects = [];

  function buildRefiningTower(x, z, height) {
    var group = new THREE.Group();

    var cylinderGeometry = new THREE.CylinderGeometry(1.5, 1.5, height, 16);
    var cylinderMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var tower = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    tower.position.set(x, height / 2, z);
    group.add(tower);

    for (var i = 1; i < 4; i++) {
      var platformGeometry = new THREE.BoxGeometry(5, 0.5, 5);
      var platformMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
      var platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.set(x, (height / 4) * i, z);
      group.add(platform);
    }

    var stackGeometry = new THREE.CylinderGeometry(0.8, 0.8, 6, 12);
    var stackMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var stack = new THREE.Mesh(stackGeometry, stackMaterial);
    stack.position.set(x + 3, height + 3, z);
    group.add(stack);

    var flameTopGeometry = new THREE.ConeGeometry(1.2, 3, 12);
    var flameMaterial = new THREE.MeshPhongMaterial({ color: 0xff6600, emissive: 0xff6600, emissiveIntensity: 0.8 });
    var flameTop = new THREE.Mesh(flameTopGeometry, flameMaterial);
    flameTop.position.set(x + 3, height + 9, z);
    group.add(flameTop);

    return group;
  }

  function buildStorageTank(x, z) {
    var group = new THREE.Group();

    var tankGeometry = new THREE.CylinderGeometry(4, 4, 12, 20);
    var tankMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    var tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.position.set(x, 6, z);
    group.add(tank);

    var bund1Geometry = new THREE.BoxGeometry(10, 1, 10);
    var bundMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var bund = new THREE.Mesh(bund1Geometry, bundMaterial);
    bund.position.set(x, 0.5, z);
    group.add(bund);

    return group;
  }

  function buildBoardwalk(x, z, length) {
    var group = new THREE.Group();

    var plankGeometry = new THREE.BoxGeometry(2, 0.4, length);
    var plankMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
    var plank = new THREE.Mesh(plankGeometry, plankMaterial);
    plank.position.set(x, 1.5, z);
    group.add(plank);

    for (var i = 0; i < length; i += 3) {
      var pilingGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
      var pilingMaterial = new THREE.MeshPhongMaterial({ color: 0x443322 });
      var piling = new THREE.Mesh(pilingGeometry, pilingMaterial);
      piling.position.set(x - 1.2, 1.5, z - length / 2 + i);
      group.add(piling);

      var piling2 = piling.clone();
      piling2.position.x = x + 1.2;
      group.add(piling2);
    }

    return group;
  }

  function buildPumpJack(x, z) {
    var group = new THREE.Group();

    var pivotGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1, 12);
    var pivotMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var pivot = new THREE.Mesh(pivotGeometry, pivotMaterial);
    pivot.position.set(x, 2, z);
    group.add(pivot);

    var beamGeometry = new THREE.BoxGeometry(10, 1, 2);
    var beamMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(x, 3, z);
    group.add(beam);

    var rodGeometry = new THREE.CylinderGeometry(0.3, 0.3, 5, 8);
    var rodMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var rod = new THREE.Mesh(rodGeometry, rodMaterial);
    rod.position.set(x + 4, 1, z);
    group.add(rod);

    return group;
  }

  function buildPipework(x, z, height) {
    var group = new THREE.Group();

    var pipeGeometry = new THREE.BoxGeometry(1.5, 0.8, 12);
    var pipeMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var pipe1 = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe1.position.set(x, height, z);
    group.add(pipe1);

    var connectorGeometry = new THREE.CylinderGeometry(0.6, 0.6, 2, 12);
    var connectorMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var connector = new THREE.Mesh(connectorGeometry, connectorMaterial);
    connector.position.set(x, height + 1, z + 8);
    connector.rotation.z = Math.PI / 2;
    group.add(connector);

    var cablePoints = [
      new THREE.Vector3(x - 1, height, z - 6),
      new THREE.Vector3(x - 8, height - 3, z - 6)
    ];
    var cableGeometry = new THREE.BufferGeometry().setFromPoints(cablePoints);
    var cableMaterial = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });
    var cable = new THREE.LineSegments(cableGeometry, cableMaterial);
    group.add(cable);

    return group;
  }

  function buildCypressTree(x, z) {
    var group = new THREE.Group();

    var trunkGeometry = new THREE.CylinderGeometry(0.8, 1, 15, 12);
    var trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x3d2817 });
    var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 7.5, z);
    group.add(trunk);

    var canopyGeometry = new THREE.SphereGeometry(4, 8, 8);
    var canopyMaterial = new THREE.MeshPhongMaterial({ color: 0x1a3d1a });

    for (var i = 0; i < 3; i++) {
      var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
      canopy.position.set(x, 12 + i * 3, z);
      canopy.scale.set(1 - i * 0.2, 1 - i * 0.2, 1 - i * 0.2);
      group.add(canopy);
    }

    return group;
  }

  function buildSwampWater(x, z, width, depth) {
    var waterGeometry = new THREE.BoxGeometry(width, 0.5, depth);
    var waterMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a4d1a,
      emissive: 0x0a2a0a,
      emissiveIntensity: 0.3
    });
    var water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(x, 0.25, z);
    return water;
  }

  function buildFlareStack(x, z) {
    var group = new THREE.Group();

    var supportGeometry = new THREE.CylinderGeometry(0.4, 0.4, 10, 8);
    var supportMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var support = new THREE.Mesh(supportGeometry, supportMaterial);
    support.position.set(x, 5, z);
    group.add(support);

    var boomGeometry = new THREE.BoxGeometry(1, 0.6, 8);
    var boomMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var boom = new THREE.Mesh(boomGeometry, boomMaterial);
    boom.position.set(x + 6, 10, z);
    group.add(boom);

    var flameGeometry = new THREE.ConeGeometry(2, 5, 12);
    var flameMaterial = new THREE.MeshPhongMaterial({ color: 0xff8800, emissive: 0xff6600, emissiveIntensity: 0.9 });
    var flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.set(x + 6, 14, z);
    group.add(flame);

    return group;
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    environmentObjects = [];

    var groundGeometry = new THREE.BoxGeometry(200, 0.5, 200);
    var groundMaterial = new THREE.MeshPhongMaterial({ color: 0x2d5016 });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.set(0, -0.25, 0);
    scene.add(ground);
    environmentObjects.push(ground);

    var water1 = buildSwampWater(-40, 0, 50, 80);
    scene.add(water1);
    environmentObjects.push(water1);

    var water2 = buildSwampWater(40, 30, 60, 70);
    scene.add(water2);
    environmentObjects.push(water2);

    var tower1 = buildRefiningTower(-30, -20, 30);
    scene.add(tower1);
    environmentObjects.push(tower1);

    var tower2 = buildRefiningTower(20, -10, 35);
    scene.add(tower2);
    environmentObjects.push(tower2);

    var tank1 = buildStorageTank(-45, 20);
    scene.add(tank1);
    environmentObjects.push(tank1);

    var tank2 = buildStorageTank(35, 35);
    scene.add(tank2);
    environmentObjects.push(tank2);

    var boardwalk1 = buildBoardwalk(-20, 0, 20);
    scene.add(boardwalk1);
    environmentObjects.push(boardwalk1);

    var boardwalk2 = buildBoardwalk(15, 15, 25);
    scene.add(boardwalk2);
    environmentObjects.push(boardwalk2);

    var pump1 = buildPumpJack(-50, -30);
    scene.add(pump1);
    environmentObjects.push(pump1);

    var pipework1 = buildPipework(0, 10, 12);
    scene.add(pipework1);
    environmentObjects.push(pipework1);

    var flare1 = buildFlareStack(50, -40);
    scene.add(flare1);
    environmentObjects.push(flare1);

    var tree1 = buildCypressTree(-60, 10);
    scene.add(tree1);
    environmentObjects.push(tree1);

    var tree2 = buildCypressTree(-70, -20);
    scene.add(tree2);
    environmentObjects.push(tree2);

    var tree3 = buildCypressTree(60, 40);
    scene.add(tree3);
    environmentObjects.push(tree3);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 80, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
  }

  function update(delta) {
    for (var i = 0; i < environmentObjects.length; i++) {
      if (environmentObjects[i].children) {
        for (var j = 0; j < environmentObjects[i].children.length; j++) {
          var child = environmentObjects[i].children[j];
          if (child.material && child.material.emissive) {
            var pulse = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
            child.material.emissiveIntensity = pulse;
          }
        }
      }
    }
  }

  function reset() {
    for (var i = environmentObjects.length - 1; i >= 0; i--) {
      scene.remove(environmentObjects[i]);
    }
    environmentObjects = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
