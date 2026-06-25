window.AlloaCamp = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function addTower(scene) {
    // Alloa Tower medieval keep: 8x18x8, dark red sandstone
    var keepGeom = new THREE.BoxGeometry(8, 18, 8);
    var keepMat = new THREE.MeshLambertMaterial({ color: 0x8B3A3A });
    var keepMesh = new THREE.Mesh(keepGeom, keepMat);
    keepMesh.position.y = 9;
    keepMesh.position.x = -15;
    keepMesh.position.z = -10;
    scene.add(keepMesh);
    objects.push(keepMesh);

    // Battlements: 2x2x2 boxes on top
    var battlementHeight = 18;
    var battlementPositions = [
      { x: -2, z: -2 },
      { x: 2, z: -2 },
      { x: -2, z: 2 },
      { x: 2, z: 2 }
    ];
    var battlementGeom = new THREE.BoxGeometry(2, 2, 2);
    var battlementMat = new THREE.MeshLambertMaterial({ color: 0x8B3A3A });
    for (var i = 0; i < battlementPositions.length; i++) {
      var batt = new THREE.Mesh(battlementGeom, battlementMat);
      batt.position.x = -15 + battlementPositions[i].x;
      batt.position.y = battlementHeight + 1;
      batt.position.z = -10 + battlementPositions[i].z;
      scene.add(batt);
      objects.push(batt);
    }
  }

  function addBrewery(scene) {
    // Brewery complex: 20x8x14, brick red
    var brewGeom = new THREE.BoxGeometry(20, 8, 14);
    var brewMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    var brewMesh = new THREE.Mesh(brewGeom, brewMat);
    brewMesh.position.y = 4;
    brewMesh.position.x = 10;
    brewMesh.position.z = 5;
    scene.add(brewMesh);
    objects.push(brewMesh);

    // Chimney cylinders
    var chimneyGeom = new THREE.CylinderGeometry(1.2, 1.2, 12, 16);
    var chimneyMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var chimneyPositions = [
      { x: 0, z: -4 },
      { x: 6, z: 2 },
      { x: -8, z: 4 }
    ];
    for (var i = 0; i < chimneyPositions.length; i++) {
      var chimney = new THREE.Mesh(chimneyGeom, chimneyMat);
      chimney.position.x = 10 + chimneyPositions[i].x;
      chimney.position.y = 14;
      chimney.position.z = 5 + chimneyPositions[i].z;
      scene.add(chimney);
      objects.push(chimney);
    }
  }

  function addCooperage(scene) {
    // Cooperage barrel yard: rows of cylinders
    var barrelGeom = new THREE.CylinderGeometry(0.6, 0.6, 1, 12);
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    var rows = 5;
    var cols = 4;
    var spacingX = 2;
    var spacingZ = 2;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.position.x = 35 + r * spacingX;
        barrel.position.y = 0.5;
        barrel.position.z = -8 + c * spacingZ;
        barrel.userData.barrelIndex = r * cols + c;
        scene.add(barrel);
        objects.push(barrel);
      }
    }
  }

  function addWharf(scene) {
    // River Forth wharf: 22x1x6 timber
    var wharfGeom = new THREE.BoxGeometry(22, 1, 6);
    var wharfMat = new THREE.MeshLambertMaterial({ color: 0x8B5E3C });
    var wharfMesh = new THREE.Mesh(wharfGeom, wharfMat);
    wharfMesh.position.y = 0.5;
    wharfMesh.position.x = 0;
    wharfMesh.position.z = 15;
    scene.add(wharfMesh);
    objects.push(wharfMesh);

    // Iron bollard cylinders
    var bollardGeom = new THREE.CylinderGeometry(0.4, 0.4, 2, 8);
    var bollardMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var bollardPositions = [
      { x: -8, z: 12 },
      { x: -4, z: 18 },
      { x: 4, z: 12 },
      { x: 8, z: 18 }
    ];
    for (var i = 0; i < bollardPositions.length; i++) {
      var bollard = new THREE.Mesh(bollardGeom, bollardMat);
      bollard.position.x = bollardPositions[i].x;
      bollard.position.y = 1;
      bollard.position.z = bollardPositions[i].z;
      scene.add(bollard);
      objects.push(bollard);
    }
  }

  function addCoalWagon(scene) {
    // Coal wagon: 8x2x3, black
    var wagonGeom = new THREE.BoxGeometry(8, 2, 3);
    var wagonMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var wagonMesh = new THREE.Mesh(wagonGeom, wagonMat);
    wagonMesh.position.y = 1.2;
    wagonMesh.position.x = -20;
    wagonMesh.position.z = -25;
    scene.add(wagonMesh);
    objects.push(wagonMesh);

    // Cylinder wheels
    var wheelGeom = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 12);
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var wheelPositions = [
      { x: -3, z: -2 },
      { x: -3, z: 2 },
      { x: 3, z: -2 },
      { x: 3, z: 2 }
    ];
    for (var i = 0; i < wheelPositions.length; i++) {
      var wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.position.x = -20 + wheelPositions[i].x;
      wheel.position.y = 0.5;
      wheel.position.z = -25 + wheelPositions[i].z;
      wheel.rotation.z = Math.PI / 2;
      scene.add(wheel);
      objects.push(wheel);
    }
  }

  function addFootballBarricade(scene) {
    // Alloa Athletic football ground barricade: goal post pairs
    var goalPositions = [
      { x: -30, z: -15 },
      { x: -30, z: 25 }
    ];

    for (var g = 0; g < goalPositions.length; g++) {
      var gx = goalPositions[g].x;
      var gz = goalPositions[g].z;

      // Two vertical cylinders
      var postGeom = new THREE.CylinderGeometry(0.4, 0.4, 4, 12);
      var postMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });

      var leftPost = new THREE.Mesh(postGeom, postMat);
      leftPost.position.x = gx - 2;
      leftPost.position.y = 2;
      leftPost.position.z = gz;
      scene.add(leftPost);
      objects.push(leftPost);

      var rightPost = new THREE.Mesh(postGeom, postMat);
      rightPost.position.x = gx + 2;
      rightPost.position.y = 2;
      rightPost.position.z = gz;
      scene.add(rightPost);
      objects.push(rightPost);

      // Horizontal crossbar box
      var crossbarGeom = new THREE.BoxGeometry(4.4, 0.4, 0.4);
      var crossbarMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
      var crossbar = new THREE.Mesh(crossbarGeom, crossbarMat);
      crossbar.position.x = gx;
      crossbar.position.y = 4;
      crossbar.position.z = gz;
      scene.add(crossbar);
      objects.push(crossbar);
    }
  }

  function addBridgeAbutment(scene) {
    // Bridge abutment fortification: 6x8x6, concrete
    var abutmentGeom = new THREE.BoxGeometry(6, 8, 6);
    var abutmentMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var abutmentMesh = new THREE.Mesh(abutmentGeom, abutmentMat);
    abutmentMesh.position.y = 4;
    abutmentMesh.position.x = 25;
    abutmentMesh.position.z = -20;
    scene.add(abutmentMesh);
    objects.push(abutmentMesh);
  }

  function addGunboat(scene) {
    // River Forth gunboat: 12x2x4, naval grey
    var boatGeom = new THREE.BoxGeometry(12, 2, 4);
    var boatMat = new THREE.MeshLambertMaterial({ color: 0x778877 });
    var boatMesh = new THREE.Mesh(boatGeom, boatMat);
    boatMesh.position.y = 0.8;
    boatMesh.position.x = -5;
    boatMesh.position.z = 20;
    scene.add(boatMesh);
    objects.push(boatMesh);
  }

  function addLights(scene) {
    // Industrial amber ambient light
    var ambientLight = new THREE.AmbientLight(0xFFBB44, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    // Tower floodlights at base of Alloa Tower
    var floodlightPositions = [
      { x: -18, z: -10 },
      { x: -12, z: -10 },
      { x: -15, z: -13 }
    ];
    for (var i = 0; i < floodlightPositions.length; i++) {
      var floodlight = new THREE.PointLight(0xFFFFFF, 1.0, 30);
      floodlight.position.x = floodlightPositions[i].x;
      floodlight.position.y = 2;
      floodlight.position.z = floodlightPositions[i].z;
      scene.add(floodlight);
      lights.push(floodlight);
    }
  }

  function build(scene) {
    addTower(scene);
    addBrewery(scene);
    addCooperage(scene);
    addWharf(scene);
    addCoalWagon(scene);
    addFootballBarricade(scene);
    addBridgeAbutment(scene);
    addGunboat(scene);
    addLights(scene);
  }

  function update(delta) {
    // Slowly rotate barrel yard cylinders (brewery processing)
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].userData.barrelIndex !== undefined) {
        objects[i].rotation.x += delta * 0.3;
      }
    }
  }

  function reset(scene) {
    // Remove all objects from scene
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];

    // Remove all lights from scene
    for (var i = 0; i < lights.length; i++) {
      scene.remove(lights[i]);
    }
    lights = [];
  }

  return {
    build: build,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
