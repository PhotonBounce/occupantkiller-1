window.NeonSwamp = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var lights = [];
  var neonSigns = [];
  var searchlightBoat = null;
  var searchlightMesh = null;
  var waterMaterial = null;
  var flickerPhase = 0;
  var searchlightAngle = 0;
  var searchlightRadius = 25;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    objects = [];
    lights = [];
    neonSigns = [];
    flickerPhase = 0;
    searchlightAngle = 0;

    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 120, 300);

    createWater();
    createMangroveRoots();
    createBoardwalks();
    createShacks();
    createGangCompound();
    createDrugLab();
    createAirboatDock();
    createFloatingTrash();
    createAlligatorSigns();
    createPowerGenerator();
    createWatchtower();
    createNeonLights();
    createSearchlightBoat();
    createEnvironmentalLighting();
  }

  function createWater() {
    var waterGeo = new THREE.CylinderGeometry(50, 50, 2, 32);
    waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3a3a,
      metalness: 0.4,
      roughness: 0.7,
      emissive: 0x0d1f1f
    });
    var waterMesh = new THREE.Mesh(waterGeo, waterMaterial);
    waterMesh.position.y = -1;
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);
    objects.push(waterMesh);
  }

  function createMangroveRoots() {
    var rootPositions = [
      [-30, 0, -20],
      [-25, 0, 15],
      [20, 0, -30],
      [35, 0, 10],
      [-15, 0, 35],
      [10, 0, 25]
    ];

    for (var i = 0; i < rootPositions.length; i++) {
      var pos = rootPositions[i];
      createRootCluster(pos[0], pos[1], pos[2]);
    }
  }

  function createRootCluster(x, y, z) {
    var clusterGeo = new THREE.CylinderGeometry(0.4, 0.6, 4, 8);
    var rootMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a1a0a,
      metalness: 0.1,
      roughness: 0.8
    });

    for (var i = 0; i < 5; i++) {
      var offsetX = (Math.random() - 0.5) * 3;
      var offsetZ = (Math.random() - 0.5) * 3;
      var rotation = Math.random() * 0.5;

      var rootMesh = new THREE.Mesh(clusterGeo, rootMaterial);
      rootMesh.position.set(x + offsetX, y + 2, z + offsetZ);
      rootMesh.rotation.z = rotation;
      rootMesh.castShadow = true;
      rootMesh.receiveShadow = true;
      scene.add(rootMesh);
      objects.push(rootMesh);
    }
  }

  function createBoardwalks() {
    var boardwalkMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      metalness: 0.0,
      roughness: 0.9
    });

    var mainBoardGeo = new THREE.BoxGeometry(60, 0.5, 3);
    var mainBoard = new THREE.Mesh(mainBoardGeo, boardwalkMaterial);
    mainBoard.position.set(0, 0.5, 0);
    mainBoard.castShadow = true;
    mainBoard.receiveShadow = true;
    scene.add(mainBoard);
    objects.push(mainBoard);

    var sideBoardGeo = new THREE.BoxGeometry(3, 0.5, 40);
    var sideBoard1 = new THREE.Mesh(sideBoardGeo, boardwalkMaterial);
    sideBoard1.position.set(-20, 0.5, 5);
    sideBoard1.castShadow = true;
    sideBoard1.receiveShadow = true;
    scene.add(sideBoard1);
    objects.push(sideBoard1);

    var sideBoard2 = new THREE.Mesh(sideBoardGeo, boardwalkMaterial);
    sideBoard2.position.set(20, 0.5, -8);
    sideBoard2.castShadow = true;
    sideBoard2.receiveShadow = true;
    scene.add(sideBoard2);
    objects.push(sideBoard2);

    createBoardwalkPosts(0, 0);
    createBoardwalkPosts(-20, 5);
    createBoardwalkPosts(20, -8);
  }

  function createBoardwalkPosts(x, z) {
    var postMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a1a0a,
      metalness: 0.2,
      roughness: 0.8
    });
    var postGeo = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);

    for (var i = -2; i <= 2; i++) {
      var post = new THREE.Mesh(postGeo, postMaterial);
      post.position.set(x + i * 8, 1.5, z);
      post.castShadow = true;
      scene.add(post);
      objects.push(post);
    }
  }

  function createShacks() {
    var shackPositions = [
      [-35, 1.5, -15],
      [-35, 1.5, 20],
      [35, 1.5, -20],
      [30, 1.5, 25]
    ];

    for (var i = 0; i < shackPositions.length; i++) {
      var pos = shackPositions[i];
      createShack(pos[0], pos[1], pos[2]);
    }
  }

  function createShack(x, y, z) {
    var shackMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.0,
      roughness: 0.95
    });

    var bodyGeo = new THREE.BoxGeometry(6, 5, 6);
    var body = new THREE.Mesh(bodyGeo, shackMaterial);
    body.position.set(x, y, z);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    objects.push(body);

    var roofGeo = new THREE.ConeGeometry(4.5, 2, 4);
    var roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x0d0d0d,
      metalness: 0.3,
      roughness: 0.8
    });
    var roof = new THREE.Mesh(roofGeo, roofMaterial);
    roof.position.set(x, y + 3.5, z);
    roof.castShadow = true;
    scene.add(roof);
    objects.push(roof);

    var doorGeo = new THREE.BoxGeometry(1.5, 2.5, 0.3);
    var doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.2,
      roughness: 0.7
    });
    var door = new THREE.Mesh(doorGeo, doorMaterial);
    door.position.set(x, y + 0.5, z + 3.1);
    scene.add(door);
    objects.push(door);

    var signGeo = new THREE.BoxGeometry(4, 1.5, 0.2);
    var signMaterial = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xff00ff,
      emissiveIntensity: 0.6
    });
    var sign = new THREE.Mesh(signGeo, signMaterial);
    sign.position.set(x, y + 3, z + 3.2);
    scene.add(sign);
    neonSigns.push({
      mesh: sign,
      material: signMaterial,
      baseColor: 0xff00ff,
      baseIntensity: 0.6
    });
    objects.push(sign);
  }

  function createGangCompound() {
    var compoundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.0,
      roughness: 0.95
    });

    var mainBuildingGeo = new THREE.BoxGeometry(20, 6, 15);
    var mainBuilding = new THREE.Mesh(mainBuildingGeo, compoundMaterial);
    mainBuilding.position.set(0, 3, -20);
    mainBuilding.castShadow = true;
    mainBuilding.receiveShadow = true;
    scene.add(mainBuilding);
    objects.push(mainBuilding);

    var roofGeo = new THREE.BoxGeometry(21, 0.8, 16);
    var roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x0d0d0d,
      metalness: 0.3,
      roughness: 0.8
    });
    var roof = new THREE.Mesh(roofGeo, roofMaterial);
    roof.position.set(0, 6.5, -20);
    roof.castShadow = true;
    scene.add(roof);
    objects.push(roof);

    for (var i = 0; i < 3; i++) {
      var windowGeo = new THREE.BoxGeometry(2, 2, 0.3);
      var windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x00ffff,
        emissiveIntensity: 0.7
      });
      var window = new THREE.Mesh(windowGeo, windowMaterial);
      window.position.set(-6 + i * 6, 3, -20.2);
      scene.add(window);
      neonSigns.push({
        mesh: window,
        material: windowMaterial,
        baseColor: 0x00ffff,
        baseIntensity: 0.7
      });
      objects.push(window);
    }

    createCompoundFence();
  }

  function createCompoundFence() {
    var fenceMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      metalness: 0.4,
      roughness: 0.6
    });

    var fenceGeo = new THREE.BoxGeometry(25, 3, 0.3);
    var fence1 = new THREE.Mesh(fenceGeo, fenceMaterial);
    fence1.position.set(0, 1.5, -7);
    fence1.castShadow = true;
    scene.add(fence1);
    objects.push(fence1);

    var fence2 = new THREE.Mesh(fenceGeo, fenceMaterial);
    fence2.position.set(-12, 1.5, -27);
    fence2.rotation.y = Math.PI / 2;
    fence2.castShadow = true;
    scene.add(fence2);
    objects.push(fence2);

    var fence3 = new THREE.Mesh(fenceGeo, fenceMaterial);
    fence3.position.set(12, 1.5, -27);
    fence3.rotation.y = Math.PI / 2;
    fence3.castShadow = true;
    scene.add(fence3);
    objects.push(fence3);
  }

  function createDrugLab() {
    var labMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.0,
      roughness: 0.95
    });

    var containerGeo = new THREE.BoxGeometry(12, 4, 10);
    var container = new THREE.Mesh(containerGeo, labMaterial);
    container.position.set(25, 2, 0);
    container.castShadow = true;
    container.receiveShadow = true;
    scene.add(container);
    objects.push(container);

    var tankGeo = new THREE.CylinderGeometry(1.5, 1.5, 6, 16);
    var tankMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      metalness: 0.6,
      roughness: 0.4
    });

    for (var i = 0; i < 3; i++) {
      var tank = new THREE.Mesh(tankGeo, tankMaterial);
      tank.position.set(20 + i * 4, 3, 0);
      tank.castShadow = true;
      scene.add(tank);
      objects.push(tank);
    }

    var signGeo = new THREE.BoxGeometry(8, 2, 0.3);
    var signMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x00ff00,
      emissiveIntensity: 0.8
    });
    var sign = new THREE.Mesh(signGeo, signMaterial);
    sign.position.set(25, 4.5, -5.2);
    scene.add(sign);
    neonSigns.push({
      mesh: sign,
      material: signMaterial,
      baseColor: 0x00ff00,
      baseIntensity: 0.8
    });
    objects.push(sign);
  }

  function createAirboatDock() {
    var dockMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      metalness: 0.0,
      roughness: 0.9
    });

    var dockGeo = new THREE.BoxGeometry(15, 0.5, 8);
    var dock = new THREE.Mesh(dockGeo, dockMaterial);
    dock.position.set(-30, 0.5, -25);
    dock.castShadow = true;
    dock.receiveShadow = true;
    scene.add(dock);
    objects.push(dock);

    var boatHullGeo = new THREE.BoxGeometry(8, 1, 4);
    var boatMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3a1a,
      metalness: 0.2,
      roughness: 0.7
    });
    var hull = new THREE.Mesh(boatHullGeo, boatMaterial);
    hull.position.set(-30, 1.3, -28);
    hull.castShadow = true;
    scene.add(hull);
    objects.push(hull);

    var propellerGeo = new THREE.CylinderGeometry(1, 1, 0.3, 8);
    var propellerMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.8,
      roughness: 0.3
    });
    var propeller = new THREE.Mesh(propellerGeo, propellerMaterial);
    propeller.position.set(-30, 2.2, -30);
    propeller.rotation.x = Math.PI / 2;
    propeller.castShadow = true;
    scene.add(propeller);
    objects.push(propeller);

    var signGeo = new THREE.BoxGeometry(6, 1.2, 0.2);
    var signMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0080,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xff0080,
      emissiveIntensity: 0.7
    });
    var sign = new THREE.Mesh(signGeo, signMaterial);
    sign.position.set(-30, 3, -22);
    scene.add(sign);
    neonSigns.push({
      mesh: sign,
      material: signMaterial,
      baseColor: 0xff0080,
      baseIntensity: 0.7
    });
    objects.push(sign);
  }

  function createFloatingTrash() {
    var trashPositions = [
      [15, 0.5, 25],
      [-20, 0.5, 10],
      [5, 0.5, -30],
      [-10, 0.5, -15]
    ];

    for (var i = 0; i < trashPositions.length; i++) {
      createTrashIsland(trashPositions[i][0], trashPositions[i][1], trashPositions[i][2]);
    }
  }

  function createTrashIsland(x, y, z) {
    var trashMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a2a,
      metalness: 0.3,
      roughness: 0.8
    });

    for (var i = 0; i < 4; i++) {
      var boxGeo = new THREE.BoxGeometry(
        1 + Math.random() * 1.5,
        0.5 + Math.random() * 1,
        1 + Math.random() * 1.5
      );
      var trash = new THREE.Mesh(boxGeo, trashMaterial);
      trash.position.set(
        x + (Math.random() - 0.5) * 3,
        y + i * 0.5,
        z + (Math.random() - 0.5) * 3
      );
      trash.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      trash.castShadow = true;
      scene.add(trash);
      objects.push(trash);
    }
  }

  function createAlligatorSigns() {
    var signPositions = [
      [12, 2, 28],
      [-28, 2, 8],
      [38, 2, 15]
    ];

    for (var i = 0; i < signPositions.length; i++) {
      var pos = signPositions[i];
      var signGeo = new THREE.BoxGeometry(3, 4, 0.3);
      var signMaterial = new THREE.MeshStandardMaterial({
        color: 0xff3300,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0xff3300,
        emissiveIntensity: 0.5
      });
      var sign = new THREE.Mesh(signGeo, signMaterial);
      sign.position.set(pos[0], pos[1], pos[2]);
      scene.add(sign);
      neonSigns.push({
        mesh: sign,
        material: signMaterial,
        baseColor: 0xff3300,
        baseIntensity: 0.5
      });
      objects.push(sign);
    }
  }

  function createPowerGenerator() {
    var genMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a1a,
      metalness: 0.4,
      roughness: 0.7
    });

    var baseGeo = new THREE.BoxGeometry(5, 4, 5);
    var base = new THREE.Mesh(baseGeo, genMaterial);
    base.position.set(-25, 2, 25);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    objects.push(base);

    var generatorGeo = new THREE.CylinderGeometry(1.2, 1.2, 3, 16);
    var generator = new THREE.Mesh(generatorGeo, genMaterial);
    generator.position.set(-25, 3.5, 25);
    generator.castShadow = true;
    scene.add(generator);
    objects.push(generator);

    var coolingGeo = new THREE.BoxGeometry(4, 2, 4);
    var coolingMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.5,
      roughness: 0.6
    });
    var cooling = new THREE.Mesh(coolingGeo, coolingMaterial);
    cooling.position.set(-25, 3, 32);
    cooling.castShadow = true;
    scene.add(cooling);
    objects.push(cooling);

    var signGeo = new THREE.BoxGeometry(5, 1.5, 0.3);
    var signMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ddff,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x00ddff,
      emissiveIntensity: 0.7
    });
    var sign = new THREE.Mesh(signGeo, signMaterial);
    sign.position.set(-25, 5, 27.5);
    scene.add(sign);
    neonSigns.push({
      mesh: sign,
      material: signMaterial,
      baseColor: 0x00ddff,
      baseIntensity: 0.7
    });
    objects.push(sign);
  }

  function createWatchtower() {
    var towerMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.0,
      roughness: 0.95
    });

    var towerGeo = new THREE.CylinderGeometry(2, 2.5, 10, 12);
    var tower = new THREE.Mesh(towerGeo, towerMaterial);
    tower.position.set(0, 5, -40);
    tower.castShadow = true;
    scene.add(tower);
    objects.push(tower);

    var platformGeo = new THREE.CylinderGeometry(3, 3, 0.5, 12);
    var platform = new THREE.Mesh(platformGeo, towerMaterial);
    platform.position.set(0, 10.5, -40);
    platform.castShadow = true;
    scene.add(platform);
    objects.push(platform);

    var railGeo = new THREE.BoxGeometry(6, 1, 0.2);
    var railMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      metalness: 0.6,
      roughness: 0.5
    });
    var rail = new THREE.Mesh(railGeo, railMaterial);
    rail.position.set(0, 10.8, -40);
    scene.add(rail);
    objects.push(rail);

    var spotlightGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8);
    var spotlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0xffff00,
      emissiveIntensity: 0.4
    });
    var spotlight = new THREE.Mesh(spotlightGeo, spotlightMaterial);
    spotlight.position.set(0, 11.5, -40);
    scene.add(spotlight);
    objects.push(spotlight);

    var signGeo = new THREE.BoxGeometry(4, 1.2, 0.2);
    var signMaterial = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xff00ff,
      emissiveIntensity: 0.6
    });
    var sign = new THREE.Mesh(signGeo, signMaterial);
    sign.position.set(0, 9, -42.2);
    scene.add(sign);
    neonSigns.push({
      mesh: sign,
      material: signMaterial,
      baseColor: 0xff00ff,
      baseIntensity: 0.6
    });
    objects.push(sign);
  }

  function createNeonLights() {
    var pinkLight = new THREE.PointLight(0xff00ff, 1.5, 40);
    pinkLight.position.set(-35, 4, -15);
    scene.add(pinkLight);
    lights.push(pinkLight);

    var cyanLight = new THREE.PointLight(0x00ffff, 1.5, 40);
    cyanLight.position.set(0, 4, -20);
    scene.add(cyanLight);
    lights.push(cyanLight);

    var greenLight = new THREE.PointLight(0x00ff00, 1.5, 40);
    greenLight.position.set(25, 3, 0);
    scene.add(greenLight);
    lights.push(greenLight);

    var magentaLight = new THREE.PointLight(0xff0080, 1.2, 35);
    magentaLight.position.set(-30, 3, -28);
    scene.add(magentaLight);
    lights.push(magentaLight);

    var cyanLight2 = new THREE.PointLight(0x00ddff, 1.3, 30);
    cyanLight2.position.set(-25, 5, 25);
    scene.add(cyanLight2);
    lights.push(cyanLight2);
  }

  function createSearchlightBoat() {
    var boatMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a3a2a,
      metalness: 0.3,
      roughness: 0.7
    });

    var hullGeo = new THREE.BoxGeometry(6, 1.2, 3);
    var hull = new THREE.Mesh(hullGeo, boatMaterial);
    hull.position.set(0, 0.8, 40);
    hull.castShadow = true;
    scene.add(hull);

    var cabinGeo = new THREE.BoxGeometry(3, 2, 2);
    var cabin = new THREE.Mesh(cabinGeo, boatMaterial);
    cabin.position.set(0, 2.2, 40);
    cabin.castShadow = true;
    scene.add(cabin);

    var searchlightGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 8);
    var searchlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0xffff00,
      emissiveIntensity: 0.5
    });
    searchlightMesh = new THREE.Mesh(searchlightGeo, searchlightMaterial);
    searchlightMesh.position.set(0, 3.5, 40);
    scene.add(searchlightMesh);

    searchlightBoat = {
      hull: hull,
      cabin: cabin,
      searchlight: searchlightMesh
    };
  }

  function createEnvironmentalLighting() {
    var ambientLight = new THREE.AmbientLight(0x1a3a3a, 0.3);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0x0a1a2a, 0.4);
    directionalLight.position.set(30, 40, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -60;
    directionalLight.shadow.camera.right = 60;
    directionalLight.shadow.camera.top = 60;
    directionalLight.shadow.camera.bottom = -60;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);
  }

  function updateNeonFlicker() {
    flickerPhase = (flickerPhase + 0.05) % (Math.PI * 2);

    for (var i = 0; i < neonSigns.length; i++) {
      var sign = neonSigns[i];
      var flicker = 0.5 + 0.5 * Math.sin(flickerPhase + i * 0.3);
      var intensity = sign.baseIntensity * (0.6 + flicker * 0.4);

      sign.material.emissiveIntensity = intensity;

      if (Math.random() < 0.02) {
        sign.material.emissiveIntensity = sign.baseIntensity * (0.3 + Math.random() * 0.3);
      }
    }
  }

  function updateSearchlightBoat(delta) {
    searchlightAngle = (searchlightAngle + delta * 0.3) % (Math.PI * 2);

    var boatX = Math.cos(searchlightAngle) * searchlightRadius;
    var boatZ = Math.sin(searchlightAngle) * searchlightRadius + 35;

    searchlightBoat.hull.position.set(boatX, 0.8, boatZ);
    searchlightBoat.cabin.position.set(boatX, 2.2, boatZ);
    searchlightBoat.searchlight.position.set(boatX, 3.5, boatZ);

    var yaw = searchlightAngle + Math.PI / 2;
    searchlightBoat.hull.rotation.y = yaw;
    searchlightBoat.cabin.rotation.y = yaw;
    searchlightBoat.searchlight.rotation.y = yaw;

    var searchlightLight = lights[lights.length - 1];
    searchlightLight.position.set(boatX, 3, boatZ);
    searchlightLight.intensity = 1.8 + 0.3 * Math.sin(flickerPhase * 1.5);
  }

  function updateWaterEffect() {
    if (waterMaterial) {
      var waveHeight = 0.1 + 0.05 * Math.sin(flickerPhase * 0.5);
      waterMaterial.emissiveIntensity = 0.05 + waveHeight * 0.02;
    }
  }

  function update(delta) {
    if (scene === null) {
      return;
    }

    updateNeonFlicker();
    updateSearchlightBoat(delta);
    updateWaterEffect();
  }

  function reset() {
    flickerPhase = 0;
    searchlightAngle = 0;

    for (var i = scene.children.length - 1; i >= 0; i--) {
      var child = scene.children[i];
      if (objects.indexOf(child) !== -1 || lights.indexOf(child) !== -1) {
        scene.remove(child);
      }
    }

    objects = [];
    lights = [];
    neonSigns = [];
    searchlightBoat = null;
    searchlightMesh = null;
    waterMaterial = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
