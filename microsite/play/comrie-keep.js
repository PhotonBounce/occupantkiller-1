window.ComrieKeep = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createMonitoringStation() {
    var geometry = new THREE.BoxGeometry(10, 6, 8);
    var material = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 3, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    objects.push(mesh);
    return mesh;
  }

  function createDataBunker() {
    var geometry = new THREE.BoxGeometry(8, 4, 10);
    var material = new THREE.MeshLambertMaterial({ color: 0x5C4030 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(15, 2, -5);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    objects.push(mesh);
    return mesh;
  }

  function createBarracks() {
    var barracksArray = [];
    var baseX = -25;
    var baseZ = 0;
    var spacing = 12;

    for (var i = 0; i < 8; i++) {
      var geometry = new THREE.BoxGeometry(10, 3, 4);
      var material = new THREE.MeshLambertMaterial({ color: 0x778877 });
      var mesh = new THREE.Mesh(geometry, material);
      var xPos = baseX + (i % 4) * spacing;
      var zPos = baseZ + Math.floor(i / 4) * spacing;
      mesh.position.set(xPos, 1.5, zPos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      objects.push(mesh);
      barracksArray.push(mesh);
    }

    return barracksArray;
  }

  function createWatchtower() {
    var tower = new THREE.Group();

    var cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 10, 16);
    var cylinderMaterial = new THREE.MeshLambertMaterial({ color: 0x444433 });
    var cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    tower.add(cylinder);

    var platformGeometry = new THREE.BoxGeometry(3, 0.5, 3);
    var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x444433 });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 5.25;
    platform.castShadow = true;
    platform.receiveShadow = true;
    tower.add(platform);

    return tower;
  }

  function createWatchtowers() {
    var towers = [];
    var positions = [
      [-30, -20],
      [30, -20],
      [-30, 20],
      [30, 20]
    ];

    for (var i = 0; i < 4; i++) {
      var tower = createWatchtower();
      tower.position.set(positions[i][0], 0, positions[i][1]);
      objects.push(tower);
      towers.push(tower);
    }

    return towers;
  }

  function createPerimeterWire() {
    var wireGroup = new THREE.Group();
    var wireColor = 0x333333;

    var points = [
      new THREE.Vector3(-35, 2, -25),
      new THREE.Vector3(35, 2, -25),
      new THREE.Vector3(35, 2, 25),
      new THREE.Vector3(-35, 2, 25),
      new THREE.Vector3(-35, 2, -25)
    ];

    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var material = new THREE.LineBasicMaterial({ color: wireColor });
    var wireframe = new THREE.LineSegments(geometry, material);
    wireGroup.add(wireframe);

    var innerPoints = [
      new THREE.Vector3(-30, 2, -20),
      new THREE.Vector3(30, 2, -20),
      new THREE.Vector3(30, 2, 20),
      new THREE.Vector3(-30, 2, 20),
      new THREE.Vector3(-30, 2, -20)
    ];

    var innerGeometry = new THREE.BufferGeometry().setFromPoints(innerPoints);
    var innerWire = new THREE.LineSegments(innerGeometry, material);
    wireGroup.add(innerWire);

    objects.push(wireGroup);
    return wireGroup;
  }

  function createRiver() {
    var geometry = new THREE.BoxGeometry(16, 0.3, 6);
    var material = new THREE.MeshLambertMaterial({ color: 0x667766 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0.15, -18);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    objects.push(mesh);
    return mesh;
  }

  function createSeismographMast() {
    var mast = new THREE.Group();

    var cylinderGeometry = new THREE.CylinderGeometry(0.4, 0.4, 12, 16);
    var cylinderMaterial = new THREE.MeshLambertMaterial({ color: 0x444433 });
    var cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    mast.add(cylinder);

    var crossbarPoints = [
      new THREE.Vector3(-2, 3, 0),
      new THREE.Vector3(2, 3, 0)
    ];
    var crossbar1Geometry = new THREE.BufferGeometry().setFromPoints(crossbarPoints);
    var lineMaterial = new THREE.LineBasicMaterial({ color: 0x444433 });
    var crossbar1 = new THREE.LineSegments(crossbar1Geometry, lineMaterial);
    mast.add(crossbar1);

    var crossbar2Points = [
      new THREE.Vector3(-2, 6, 0),
      new THREE.Vector3(2, 6, 0)
    ];
    var crossbar2Geometry = new THREE.BufferGeometry().setFromPoints(crossbar2Points);
    var crossbar2 = new THREE.LineSegments(crossbar2Geometry, lineMaterial);
    mast.add(crossbar2);

    var crossbar3Points = [
      new THREE.Vector3(-2, 9, 0),
      new THREE.Vector3(2, 9, 0)
    ];
    var crossbar3Geometry = new THREE.BufferGeometry().setFromPoints(crossbar3Points);
    var crossbar3 = new THREE.LineSegments(crossbar3Geometry, lineMaterial);
    mast.add(crossbar3);

    return mast;
  }

  function createSeismographMasts() {
    var masts = [];
    var positions = [
      [-8, 0, 8],
      [0, 0, 8],
      [8, 0, 8]
    ];

    for (var i = 0; i < 3; i++) {
      var mast = createSeismographMast();
      mast.position.set(positions[i][0], positions[i][1], positions[i][2]);
      objects.push(mast);
      masts.push(mast);
    }

    return masts;
  }

  function createMemorialMonument() {
    var geometry = new THREE.BoxGeometry(2, 5, 0.5);
    var material = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-20, 2.5, 5);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    objects.push(mesh);
    return mesh;
  }

  function createStationLights(scene) {
    var positions = [
      [-3, 4, -2],
      [3, 4, -2],
      [0, 4, 3]
    ];

    for (var i = 0; i < 3; i++) {
      var light = new THREE.PointLight(0xFFFFFF, 0.8, 20);
      light.position.set(positions[i][0], positions[i][1], positions[i][2]);
      light.castShadow = true;
      scene.add(light);
      lights.push(light);
    }
  }

  function createCampLights(scene) {
    var campPositions = [
      [-25, 3, 0],
      [25, 3, 0],
      [-25, 3, 12],
      [25, 3, 12]
    ];

    for (var i = 0; i < 4; i++) {
      var light = new THREE.PointLight(0xFF8800, 0.5, 25);
      light.position.set(campPositions[i][0], campPositions[i][1], campPositions[i][2]);
      light.castShadow = true;
      scene.add(light);
      lights.push(light);
    }
  }

  function initScene(scene) {
    createMonitoringStation();
    createDataBunker();
    createBarracks();
    createWatchtowers();
    createPerimeterWire();
    createRiver();
    createSeismographMasts();
    createMemorialMonument();

    createStationLights(scene);
    createCampLights(scene);

    var ambientLight = new THREE.AmbientLight(0xCCDDCC, 0.7);
    scene.add(ambientLight);
    lights.push(ambientLight);

    for (var i = 0; i < objects.length; i++) {
      scene.add(objects[i]);
    }
  }

  function update(delta) {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].children && objects[i].children.length > 0) {
        if (objects[i].position.z >= 8) {
          var needle = objects[i].children[0];
          if (needle && needle.rotation) {
            needle.rotation.x += Math.sin(Date.now() * 0.005) * 0.02;
          }
        }
      }
    }
  }

  function reset(scene) {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (var j = 0; j < lights.length; j++) {
      if (lights[j].parent) {
        lights[j].parent.remove(lights[j]);
      } else {
        scene.remove(lights[j]);
      }
    }
    lights = [];
  }

  return {
    initScene: initScene,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };

}());
