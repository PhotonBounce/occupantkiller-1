var window = window || {};

window.CoastalVillage = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var elapsedTime = 0;
  var seaLevel = 0;
  var animationGroup = null;

  var gameState = {
    boatsRocking: true,
    bellSwinging: true,
    seaShimmering: true,
    windowsGlowing: true,
    flagsFlapping: true
  };

  var boats = [];
  var bellTower = null;
  var seaSurface = null;
  var churchWindows = [];
  var oliveTreeSway = [];
  var flagsObjects = [];

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    sceneObjects = [];
    elapsedTime = 0;
    boats = [];
    bellTower = null;
    seaSurface = null;
    churchWindows = [];
    oliveTreeSway = [];
    flagsObjects = [];

    createSeaSurface();
    createCliffFace();
    createWhitewashedHouses();
    createChurchTower();
    createHarborDockPier();
    createFishingBoats();
    createOliveTrees();
    createCobblestonePathway();
    createRooftopSandbags();
    createMarketSquareFountain();
    createBellTowerBells();
    createBoatMastPoles();
    createSeaCaveEntrance();
    createVineyardTerraceSteps();
    createDefensiveWall();
  }

  function createSeaSurface() {
    var seaGeometry = new THREE.BoxGeometry(200, 2, 200);
    var seaMaterial = new THREE.MeshStandardMaterial({
      color: 0x2255CC,
      roughness: 0.5,
      metalness: 0.3
    });
    seaSurface = new THREE.Mesh(seaGeometry, seaMaterial);
    seaSurface.position.set(0, -20, 30);
    seaSurface.castShadow = true;
    seaSurface.receiveShadow = true;
    scene.add(seaSurface);
    sceneObjects.push(seaSurface);
  }

  function createCliffFace() {
    var cliffGeometry = new THREE.BoxGeometry(150, 40, 20);
    var cliffMaterial = new THREE.MeshStandardMaterial({
      color: 0x6B5D4F,
      roughness: 0.95
    });
    var cliffMesh = new THREE.Mesh(cliffGeometry, cliffMaterial);
    cliffMesh.position.set(0, 0, -35);
    cliffMesh.castShadow = true;
    cliffMesh.receiveShadow = true;
    scene.add(cliffMesh);
    sceneObjects.push(cliffMesh);

    var cliffTopGeometry = new THREE.BoxGeometry(150, 2, 40);
    var cliffTopMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B7355,
      roughness: 0.8
    });
    var cliffTopMesh = new THREE.Mesh(cliffTopGeometry, cliffTopMaterial);
    cliffTopMesh.position.set(0, 20, -25);
    cliffTopMesh.castShadow = true;
    cliffTopMesh.receiveShadow = true;
    scene.add(cliffTopMesh);
    sceneObjects.push(cliffTopMesh);
  }

  function createWhitewashedHouses() {
    var housePositions = [
      [-20, 0, 10],
      [-10, 0, 15],
      [0, 0, 12],
      [10, 0, 18],
      [20, 0, 8],
      [-15, 0, -5],
      [5, 0, -8],
      [25, 0, 0],
      [-25, 0, 5],
      [15, 0, 20]
    ];

    housePositions.forEach(function(pos) {
      var houseGroup = new THREE.Group();

      var wallGeometry = new THREE.BoxGeometry(6, 5, 6);
      var wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFEE,
        roughness: 0.85
      });
      var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
      wallMesh.position.y = 2.5;
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      houseGroup.add(wallMesh);

      var roofGeometry = new THREE.BoxGeometry(7, 1, 7);
      var roofMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF7722,
        roughness: 0.7
      });
      var roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
      roofMesh.position.y = 5.5;
      roofMesh.castShadow = true;
      roofMesh.receiveShadow = true;
      houseGroup.add(roofMesh);

      var doorGeometry = new THREE.BoxGeometry(1.2, 2.5, 0.3);
      var doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.6
      });
      var doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
      doorMesh.position.set(0, 1.2, 3.2);
      doorMesh.castShadow = true;
      doorMesh.receiveShadow = true;
      houseGroup.add(doorMesh);

      var windowGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.3);
      var windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x4488FF,
        roughness: 0.3,
        metalness: 0.5
      });
      var window1 = new THREE.Mesh(windowGeometry, windowMaterial);
      window1.position.set(-1.5, 3.5, 3.2);
      window1.castShadow = true;
      window1.receiveShadow = true;
      houseGroup.add(window1);

      var window2 = new THREE.Mesh(windowGeometry, windowMaterial);
      window2.position.set(1.5, 3.5, 3.2);
      window2.castShadow = true;
      window2.receiveShadow = true;
      houseGroup.add(window2);

      houseGroup.position.set(pos[0], pos[1], pos[2]);
      scene.add(houseGroup);
      sceneObjects.push(houseGroup);
    });
  }

  function createChurchTower() {
    var towerGroup = new THREE.Group();

    var towerGeometry = new THREE.CylinderGeometry(3, 3, 15, 16);
    var towerMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFEE,
      roughness: 0.85
    });
    var towerMesh = new THREE.Mesh(towerGeometry, towerMaterial);
    towerMesh.position.y = 7.5;
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    towerGroup.add(towerMesh);

    var capGeometry = new THREE.ConeGeometry(3.5, 3, 16);
    var capMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF7722,
      roughness: 0.7
    });
    var capMesh = new THREE.Mesh(capGeometry, capMaterial);
    capMesh.position.y = 16.5;
    capMesh.castShadow = true;
    capMesh.receiveShadow = true;
    towerGroup.add(capMesh);

    var crossGeometry = new THREE.BoxGeometry(0.3, 3, 0.3);
    var crossMaterial = new THREE.MeshStandardMaterial({
      color: 0xDDDDDD,
      metalness: 0.8,
      roughness: 0.2
    });
    var verticalCross = new THREE.Mesh(crossGeometry, crossMaterial);
    verticalCross.position.y = 18.5;
    verticalCross.castShadow = true;
    verticalCross.receiveShadow = true;
    towerGroup.add(verticalCross);

    var horizontalCross = new THREE.Mesh(crossGeometry, crossMaterial);
    horizontalCross.rotation.z = Math.PI / 2;
    horizontalCross.position.set(0, 17.5, 0);
    horizontalCross.castShadow = true;
    horizontalCross.receiveShadow = true;
    towerGroup.add(horizontalCross);

    var windowGeometry = new THREE.BoxGeometry(1.2, 1.2, 0.3);
    var windowMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFDD44,
      emissive: 0xFFDD44,
      emissiveIntensity: 0.4
    });

    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var windowX = Math.cos(angle) * 3.2;
      var windowZ = Math.sin(angle) * 3.2;
      var windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
      windowMesh.position.set(windowX, 10, windowZ);
      windowMesh.castShadow = true;
      windowMesh.receiveShadow = true;
      towerGroup.add(windowMesh);
      churchWindows.push(windowMesh);
    }

    towerGroup.position.set(-35, 0, 5);
    towerGroup.churchTowerData = {
      basePosition: new THREE.Vector3(-35, 0, 5),
      bellAngle: 0
    };
    bellTower = towerGroup;
    scene.add(towerGroup);
    sceneObjects.push(towerGroup);
  }

  function createHarborDockPier() {
    var pierGeometry = new THREE.BoxGeometry(30, 1, 4);
    var pierMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B6F47,
      roughness: 0.8
    });
    var pierMesh = new THREE.Mesh(pierGeometry, pierMaterial);
    pierMesh.position.set(30, -3, 10);
    pierMesh.castShadow = true;
    pierMesh.receiveShadow = true;
    scene.add(pierMesh);
    sceneObjects.push(pierMesh);

    var supportGeometry = new THREE.CylinderGeometry(0.5, 0.6, 8, 8);
    var supportMaterial = new THREE.MeshStandardMaterial({
      color: 0x6B5344,
      roughness: 0.8
    });

    var supportPositions = [
      [15, -7, 8],
      [20, -7, 8],
      [25, -7, 8],
      [30, -7, 8],
      [35, -7, 8],
      [15, -7, 12],
      [20, -7, 12],
      [25, -7, 12],
      [30, -7, 12],
      [35, -7, 12]
    ];

    supportPositions.forEach(function(pos) {
      var supportMesh = new THREE.Mesh(supportGeometry, supportMaterial);
      supportMesh.position.set(pos[0], pos[1], pos[2]);
      supportMesh.castShadow = true;
      supportMesh.receiveShadow = true;
      scene.add(supportMesh);
      sceneObjects.push(supportMesh);
    });
  }

  function createFishingBoats() {
    var boatPositions = [
      [35, -2, 5],
      [45, -2, 10],
      [55, -2, 6]
    ];

    boatPositions.forEach(function(pos) {
      var boatGroup = new THREE.Group();

      var hullGeometry = new THREE.BoxGeometry(4, 1.5, 8);
      var hullMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.7
      });
      var hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
      hullMesh.position.y = 0.75;
      hullMesh.castShadow = true;
      hullMesh.receiveShadow = true;
      boatGroup.add(hullMesh);

      var cabinGeometry = new THREE.BoxGeometry(2.5, 1.5, 3);
      var cabinMaterial = new THREE.MeshStandardMaterial({
        color: 0x6B5344,
        roughness: 0.75
      });
      var cabinMesh = new THREE.Mesh(cabinGeometry, cabinMaterial);
      cabinMesh.position.set(0, 1.8, 1);
      cabinMesh.castShadow = true;
      cabinMesh.receiveShadow = true;
      boatGroup.add(cabinMesh);

      boatGroup.position.set(pos[0], pos[1], pos[2]);
      boatGroup.boatData = { baseY: pos[1], bobAmount: 0.5, bobSpeed: 2 };
      scene.add(boatGroup);
      sceneObjects.push(boatGroup);
      boats.push(boatGroup);
    });
  }

  function createOliveTrees() {
    var treePositions = [
      [-40, 0, 20],
      [-30, 0, 25],
      [-35, 0, 35],
      [40, 0, 25],
      [45, 0, 15],
      [-50, 0, 10],
      [50, 0, 20]
    ];

    treePositions.forEach(function(pos) {
      var treeGroup = new THREE.Group();

      var trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4, 8);
      var trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x654321,
        roughness: 0.85
      });
      var trunkMesh = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunkMesh.position.y = 2;
      trunkMesh.castShadow = true;
      trunkMesh.receiveShadow = true;
      treeGroup.add(trunkMesh);

      var canopyGeometry = new THREE.SphereGeometry(2.5, 8, 8);
      var canopyMaterial = new THREE.MeshStandardMaterial({
        color: 0x448822,
        roughness: 0.8
      });
      var canopyMesh = new THREE.Mesh(canopyGeometry, canopyMaterial);
      canopyMesh.position.y = 4.5;
      canopyMesh.scale.set(1.1, 1.3, 1.1);
      canopyMesh.castShadow = true;
      canopyMesh.receiveShadow = true;
      treeGroup.add(canopyMesh);

      treeGroup.position.set(pos[0], pos[1], pos[2]);
      treeGroup.oliveTreeData = {
        basePosition: new THREE.Vector3(pos[0], pos[1], pos[2]),
        swayAmount: 0.3,
        swaySpeed: 1.5
      };
      scene.add(treeGroup);
      sceneObjects.push(treeGroup);
      oliveTreeSway.push(treeGroup);
    });
  }

  function createCobblestonePathway() {
    var cobbleGeometry = new THREE.BoxGeometry(40, 0.3, 50);
    var cobbleMaterial = new THREE.MeshStandardMaterial({
      color: 0xDDBB88,
      roughness: 0.9
    });
    var cobbleMesh = new THREE.Mesh(cobbleGeometry, cobbleMaterial);
    cobbleMesh.position.set(0, 0.15, 5);
    cobbleMesh.castShadow = true;
    cobbleMesh.receiveShadow = true;
    scene.add(cobbleMesh);
    sceneObjects.push(cobbleMesh);

    for (var x = -20; x <= 20; x += 2) {
      for (var z = -20; z <= 30; z += 2) {
        var stoneGeometry = new THREE.BoxGeometry(1.8, 0.2, 1.8);
        var stoneMaterial = new THREE.MeshStandardMaterial({
          color: Math.random() > 0.5 ? 0xCCAA77 : 0xDDBB88,
          roughness: 0.95
        });
        var stoneMesh = new THREE.Mesh(stoneGeometry, stoneMaterial);
        stoneMesh.position.set(x, 0.35, z);
        stoneMesh.castShadow = false;
        stoneMesh.receiveShadow = true;
        scene.add(stoneMesh);
        sceneObjects.push(stoneMesh);
      }
    }
  }

  function createRooftopSandbags() {
    var sandbagPositions = [
      [-20, 5.8, 10],
      [-18, 5.8, 10],
      [-19, 5.8, 9.5],
      [10, 5.8, 18],
      [11, 5.8, 18],
      [10.5, 5.8, 17.5],
      [25, 5.8, 8],
      [24, 5.8, 8],
      [25.5, 5.8, 7.5]
    ];

    sandbagPositions.forEach(function(pos) {
      var sandbagGeometry = new THREE.BoxGeometry(1.2, 0.6, 0.8);
      var sandbagMaterial = new THREE.MeshStandardMaterial({
        color: 0xA68C6F,
        roughness: 0.9
      });
      var sandbagMesh = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
      sandbagMesh.position.set(pos[0], pos[1], pos[2]);
      sandbagMesh.castShadow = true;
      sandbagMesh.receiveShadow = true;
      scene.add(sandbagMesh);
      sceneObjects.push(sandbagMesh);
    });
  }

  function createMarketSquareFountain() {
    var fountainBaseGeometry = new THREE.CylinderGeometry(3, 3.5, 0.8, 16);
    var fountainBaseMaterial = new THREE.MeshStandardMaterial({
      color: 0xAAAABB,
      roughness: 0.7
    });
    var fountainBaseMesh = new THREE.Mesh(fountainBaseGeometry, fountainBaseMaterial);
    fountainBaseMesh.position.set(0, 0.4, 10);
    fountainBaseMesh.castShadow = true;
    fountainBaseMesh.receiveShadow = true;
    scene.add(fountainBaseMesh);
    sceneObjects.push(fountainBaseMesh);

    var poolGeometry = new THREE.CylinderGeometry(3.5, 3.5, 0.5, 16);
    var poolMaterial = new THREE.MeshStandardMaterial({
      color: 0x1166CC,
      roughness: 0.4
    });
    var poolMesh = new THREE.Mesh(poolGeometry, poolMaterial);
    poolMesh.position.set(0, 0.25, 10);
    poolMesh.castShadow = true;
    poolMesh.receiveShadow = true;
    scene.add(poolMesh);
    sceneObjects.push(poolMesh);

    var columnGeometry = new THREE.CylinderGeometry(0.6, 0.6, 2.5, 8);
    var columnMaterial = new THREE.MeshStandardMaterial({
      color: 0xBBBBCC,
      roughness: 0.65
    });
    var columnMesh = new THREE.Mesh(columnGeometry, columnMaterial);
    columnMesh.position.set(0, 1.4, 10);
    columnMesh.castShadow = true;
    columnMesh.receiveShadow = true;
    scene.add(columnMesh);
    sceneObjects.push(columnMesh);

    var topGeometry = new THREE.SphereGeometry(0.8, 8, 8);
    var topMaterial = new THREE.MeshStandardMaterial({
      color: 0xDDDDEE,
      roughness: 0.6
    });
    var topMesh = new THREE.Mesh(topGeometry, topMaterial);
    topMesh.position.set(0, 3.2, 10);
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    scene.add(topMesh);
    sceneObjects.push(topMesh);
  }

  function createBellTowerBells() {
    var bellGeometry = new THREE.SphereGeometry(0.8, 12, 12);
    var bellMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFDD44,
      metalness: 0.8,
      roughness: 0.2
    });
    var bellMesh = new THREE.Mesh(bellGeometry, bellMaterial);
    bellMesh.position.set(0, 16, 0);
    bellMesh.scale.set(1, 1.3, 1);
    bellMesh.castShadow = true;
    bellMesh.receiveShadow = true;
    bellTower.add(bellMesh);

    bellTower.bellData = {
      mesh: bellMesh,
      swingAngle: 0,
      maxSwing: 0.4
    };
  }

  function createBoatMastPoles() {
    var mastPositions = [
      [35, 1, 5],
      [45, 1, 10],
      [55, 1, 6]
    ];

    mastPositions.forEach(function(pos) {
      var mastGeometry = new THREE.CylinderGeometry(0.15, 0.15, 6, 8);
      var mastMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B6F47,
        roughness: 0.8
      });
      var mastMesh = new THREE.Mesh(mastGeometry, mastMaterial);
      mastMesh.position.set(pos[0], pos[1] + 3, pos[2]);
      mastMesh.castShadow = true;
      mastMesh.receiveShadow = true;
      scene.add(mastMesh);
      sceneObjects.push(mastMesh);

      var sailGeometry = new THREE.BoxGeometry(2, 3, 0.3);
      var sailMaterial = new THREE.MeshStandardMaterial({
        color: 0xEEEEDD,
        roughness: 0.6
      });
      var sailMesh = new THREE.Mesh(sailGeometry, sailMaterial);
      sailMesh.position.set(pos[0] + 1.2, pos[1] + 2.5, pos[2]);
      sailMesh.castShadow = true;
      sailMesh.receiveShadow = true;
      scene.add(sailMesh);
      sceneObjects.push(sailMesh);
      flagsObjects.push(sailMesh);
    });
  }

  function createSeaCaveEntrance() {
    var caveGeometry = new THREE.BoxGeometry(8, 6, 10);
    var caveMaterial = new THREE.MeshStandardMaterial({
      color: 0x334455,
      roughness: 0.95
    });
    var caveMesh = new THREE.Mesh(caveGeometry, caveMaterial);
    caveMesh.position.set(70, -5, 0);
    caveMesh.castShadow = true;
    caveMesh.receiveShadow = true;
    scene.add(caveMesh);
    sceneObjects.push(caveMesh);

    var caveDepthGeometry = new THREE.BoxGeometry(6, 5, 15);
    var caveDepthMaterial = new THREE.MeshStandardMaterial({
      color: 0x222233,
      roughness: 0.98
    });
    var caveDepthMesh = new THREE.Mesh(caveDepthGeometry, caveDepthMaterial);
    caveDepthMesh.position.set(70, -5, -7);
    caveDepthMesh.castShadow = true;
    caveDepthMesh.receiveShadow = true;
    scene.add(caveDepthMesh);
    sceneObjects.push(caveDepthMesh);
  }

  function createVineyardTerraceSteps() {
    var stepWidth = 2;
    var stepHeight = 0.4;
    var numSteps = 8;

    for (var i = 0; i < numSteps; i++) {
      var stepGeometry = new THREE.BoxGeometry(35, stepHeight, stepWidth);
      var stepMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B7355,
        roughness: 0.85
      });
      var stepMesh = new THREE.Mesh(stepGeometry, stepMaterial);
      stepMesh.position.set(-20, i * stepHeight + 0.2, -15 + i * stepWidth);
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      scene.add(stepMesh);
      sceneObjects.push(stepMesh);

      if (i > 0 && i < numSteps) {
        var flagGeometry = new THREE.BoxGeometry(1.5, 0.8, 0.2);
        var flagMaterial = new THREE.MeshStandardMaterial({
          color: 0xFF3333,
          roughness: 0.6
        });
        var flagMesh = new THREE.Mesh(flagGeometry, flagMaterial);
        flagMesh.position.set(-20, i * stepHeight + 1.2, -15 + i * stepWidth);
        flagMesh.castShadow = true;
        flagMesh.receiveShadow = true;
        scene.add(flagMesh);
        sceneObjects.push(flagMesh);
        flagsObjects.push(flagMesh);
      }
    }
  }

  function createDefensiveWall() {
    var wallGeometry = new THREE.BoxGeometry(40, 4, 1);
    var wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x7A6F68,
      roughness: 0.9
    });
    var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
    wallMesh.position.set(0, 2, -20);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    scene.add(wallMesh);
    sceneObjects.push(wallMesh);

    var portWidth = 1.5;
    var portHeight = 1.8;
    var portPositions = [-15, -5, 5, 15];

    portPositions.forEach(function(xPos) {
      var portGeometry = new THREE.BoxGeometry(portWidth, portHeight, 0.5);
      var portMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.98
      });
      var portMesh = new THREE.Mesh(portGeometry, portMaterial);
      portMesh.position.set(xPos, 2.5, -19.8);
      portMesh.castShadow = true;
      portMesh.receiveShadow = true;
      scene.add(portMesh);
      sceneObjects.push(portMesh);
    });
  }

  function update(delta) {
    elapsedTime += delta;

    if (gameState.boatsRocking && boats.length > 0) {
      boats.forEach(function(boat) {
        var boatData = boat.boatData;
        var bobOffset = Math.sin(elapsedTime * boatData.bobSpeed) * boatData.bobAmount;
        boat.position.y = boatData.baseY + bobOffset;
      });
    }

    if (gameState.bellSwinging && bellTower && bellTower.bellData) {
      var bellData = bellTower.bellData;
      bellData.swingAngle = Math.sin(elapsedTime * 0.8) * bellData.maxSwing;
      bellData.mesh.rotation.z = bellData.swingAngle;
    }

    if (gameState.seaShimmering && seaSurface) {
      seaSurface.position.y = -20 + Math.sin(elapsedTime * 0.5) * 0.3;
    }

    if (gameState.windowsGlowing && churchWindows.length > 0) {
      var glowIntensity = 0.3 + Math.sin(elapsedTime * 1.2) * 0.15;
      churchWindows.forEach(function(windowMesh) {
        windowMesh.material.emissiveIntensity = glowIntensity;
      });
    }

    if (gameState.flagsFlapping && flagsObjects.length > 0) {
      flagsObjects.forEach(function(flag) {
        var wave = Math.sin(elapsedTime * 2 + flag.position.x * 0.1) * 0.2;
        flag.rotation.z = wave;
      });
    }

    if (oliveTreeSway.length > 0) {
      oliveTreeSway.forEach(function(tree) {
        var treeData = tree.oliveTreeData;
        var swayX = Math.sin(elapsedTime * treeData.swaySpeed) * treeData.swayAmount;
        var swayZ = Math.cos(elapsedTime * treeData.swaySpeed * 0.8) * treeData.swayAmount * 0.6;
        tree.position.x = treeData.basePosition.x + swayX;
        tree.position.z = treeData.basePosition.z + swayZ;
      });
    }
  }

  function reset() {
    sceneObjects.forEach(function(obj) {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) {
            mat.dispose();
          });
        } else {
          obj.material.dispose();
        }
      }
      scene.remove(obj);
    });

    sceneObjects = [];
    boats = [];
    bellTower = null;
    seaSurface = null;
    churchWindows = [];
    oliveTreeSway = [];
    flagsObjects = [];
    elapsedTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
