window.StormIsland = (function() {
  'use strict';

  var scene;
  var camera;
  var objects = [];
  var animatedObjects = [];
  var lights = [];

  function buildLighthouse() {
    var group = new THREE.Group();

    var baseGeom = new THREE.CylinderGeometry(8, 10, 3, 32);
    var baseMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var baseBase = new THREE.Mesh(baseGeom, baseMat);
    baseBase.position.y = 1.5;
    baseBase.castShadow = true;
    baseBase.receiveShadow = true;
    group.add(baseBase);

    var towerGeom = new THREE.CylinderGeometry(5, 5, 45, 32);
    var towerMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
    var tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.y = 25;
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    var lanternGeom = new THREE.SphereGeometry(6, 32, 32);
    var lanternMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    var lantern = new THREE.Mesh(lanternGeom, lanternMat);
    lantern.position.y = 52;
    lantern.castShadow = true;
    lantern.receiveShadow = true;
    group.add(lantern);

    var roofGeom = new THREE.ConeGeometry(7, 8, 32);
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x882200 });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = 56;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);

    group.position.set(80, 10, 120);
    scene.add(group);
    objects.push(group);
    animatedObjects.push({ obj: group, type: 'lighthouse' });

    return group;
  }

  function buildBunkers() {
    var bunkerPositions = [
      { x: -60, z: 50 },
      { x: 40, z: -80 },
      { x: -100, z: -60 },
      { x: 90, z: 60 }
    ];

    bunkerPositions.forEach(function(pos) {
      var bunker = new THREE.Group();

      var mainGeom = new THREE.BoxGeometry(16, 8, 20);
      var mainMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
      var mainBody = new THREE.Mesh(mainGeom, mainMat);
      mainBody.position.y = 4;
      mainBody.castShadow = true;
      mainBody.receiveShadow = true;
      bunker.add(mainBody);

      var roofGeom = new THREE.ConeGeometry(14, 4, 8);
      var roofMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var roof = new THREE.Mesh(roofGeom, roofMat);
      roof.position.y = 10;
      roof.castShadow = true;
      roof.receiveShadow = true;
      bunker.add(roof);

      var gunGeom = new THREE.CylinderGeometry(0.8, 0.8, 6, 16);
      var gunMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      var gun = new THREE.Mesh(gunGeom, gunMat);
      gun.position.set(0, 10, 8);
      gun.rotation.z = Math.PI * 0.15;
      gun.castShadow = true;
      gun.receiveShadow = true;
      bunker.add(gun);

      bunker.position.set(pos.x, 0, pos.z);
      scene.add(bunker);
      objects.push(bunker);
    });
  }

  function buildSeaCliffs() {
    var cliffPositions = [
      { x: -150, z: 0, scaleX: 2 },
      { x: 150, z: 0, scaleX: 2 },
      { x: 0, z: -150, scaleX: 2 },
      { x: 0, z: 150, scaleX: 2 }
    ];

    cliffPositions.forEach(function(pos) {
      var cliff = new THREE.Group();

      var mainGeom = new THREE.BoxGeometry(40 * pos.scaleX, 60, 20);
      var mainMat = new THREE.MeshLambertMaterial({ color: 0x663333 });
      var main = new THREE.Mesh(mainGeom, mainMat);
      main.position.y = 30;
      main.castShadow = true;
      main.receiveShadow = true;
      cliff.add(main);

      for (var i = 0; i < 3; i++) {
        var rockGeom = new THREE.SphereGeometry(8 + i * 2, 16, 16);
        var rockMat = new THREE.MeshLambertMaterial({ color: 0x664444 });
        var rock = new THREE.Mesh(rockGeom, rockMat);
        rock.position.set(-20 + i * 20, 15 + i * 5, 0);
        rock.castShadow = true;
        rock.receiveShadow = true;
        cliff.add(rock);
      }

      cliff.position.set(pos.x, 0, pos.z);
      scene.add(cliff);
      objects.push(cliff);
    });
  }

  function buildRadarTowers() {
    var towerPositions = [
      { x: 60, z: -40 },
      { x: -70, z: 80 }
    ];

    towerPositions.forEach(function(pos) {
      var tower = new THREE.Group();

      var baseGeom = new THREE.BoxGeometry(4, 4, 4);
      var baseMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
      var base = new THREE.Mesh(baseGeom, baseMat);
      base.position.y = 2;
      base.castShadow = true;
      base.receiveShadow = true;
      tower.add(base);

      var poleGeom = new THREE.CylinderGeometry(1, 1, 40, 16);
      var poleMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
      var pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.y = 22;
      pole.castShadow = true;
      pole.receiveShadow = true;
      tower.add(pole);

      var radarGeom = new THREE.SphereGeometry(8, 16, 16);
      var radarMat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
      var radar = new THREE.Mesh(radarGeom, radarMat);
      radar.position.y = 45;
      radar.scale.set(1.2, 0.8, 1.2);
      radar.castShadow = true;
      radar.receiveShadow = true;
      tower.add(radar);
      animatedObjects.push({ obj: radar, type: 'radar' });

      var antennageom = new THREE.CylinderGeometry(0.3, 0.3, 12, 8);
      var antennaMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
      var antenna = new THREE.Mesh(antennageom, antennaMat);
      antenna.position.set(0, 52, 0);
      antenna.castShadow = true;
      antenna.receiveShadow = true;
      tower.add(antenna);

      tower.position.set(pos.x, 0, pos.z);
      scene.add(tower);
      objects.push(tower);
    });
  }

  function buildBarracks() {
    var barracksPositions = [
      { x: -40, z: -20 },
      { x: 20, z: 30 },
      { x: -30, z: 70 }
    ];

    barracksPositions.forEach(function(pos) {
      var barracks = new THREE.Group();

      var mainGeom = new THREE.BoxGeometry(20, 12, 30);
      var mainMat = new THREE.MeshLambertMaterial({ color: 0x885533 });
      var main = new THREE.Mesh(mainGeom, mainMat);
      main.position.y = 6;
      main.castShadow = true;
      main.receiveShadow = true;
      barracks.add(main);

      var roofGeom = new THREE.ConeGeometry(18, 6, 8);
      var roofMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
      var roof = new THREE.Mesh(roofGeom, roofMat);
      roof.position.y = 15;
      roof.castShadow = true;
      roof.receiveShadow = true;
      barracks.add(roof);

      for (var i = 0; i < 4; i++) {
        var windowGeom = new THREE.BoxGeometry(3, 3, 0.5);
        var windowMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var window = new THREE.Mesh(windowGeom, windowMat);
        window.position.set(-8 + i * 6, 8, 15.3);
        window.castShadow = true;
        window.receiveShadow = true;
        barracks.add(window);
      }

      var doorGeom = new THREE.BoxGeometry(4, 8, 0.5);
      var doorMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
      var door = new THREE.Mesh(doorGeom, doorMat);
      door.position.set(0, 4, 15.3);
      door.castShadow = true;
      door.receiveShadow = true;
      barracks.add(door);

      barracks.position.set(pos.x, 0, pos.z);
      scene.add(barracks);
      objects.push(barracks);
    });
  }

  function buildNavalGuns() {
    var gunPositions = [
      { x: 110, z: 20 },
      { x: -120, z: 30 },
      { x: 100, z: -90 }
    ];

    gunPositions.forEach(function(pos) {
      var gunemplacement = new THREE.Group();

      var baseGeom = new THREE.CylinderGeometry(14, 16, 4, 32);
      var baseMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
      var base = new THREE.Mesh(baseGeom, baseMat);
      base.position.y = 2;
      base.castShadow = true;
      base.receiveShadow = true;
      gunemplacement.add(base);

      var shieldGeom = new THREE.BoxGeometry(18, 10, 20);
      var shieldMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
      var shield = new THREE.Mesh(shieldGeom, shieldMat);
      shield.position.y = 8;
      shield.castShadow = true;
      shield.receiveShadow = true;
      gunemplacement.add(shield);

      var barrelGeom = new THREE.CylinderGeometry(2, 2, 18, 16);
      var barrelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      var barrel = new THREE.Mesh(barrelGeom, barrelMat);
      barrel.position.set(0, 12, 8);
      barrel.rotation.z = Math.PI * 0.2;
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      gunemplacement.add(barrel);

      var breechGeom = new THREE.SphereGeometry(3, 16, 16);
      var breechMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var breech = new THREE.Mesh(breechGeom, breechMat);
      breech.position.set(0, 11, -2);
      breech.castShadow = true;
      breech.receiveShadow = true;
      gunemplacement.add(breech);

      gunemplacement.position.set(pos.x, 0, pos.z);
      scene.add(gunemplacement);
      objects.push(gunemplacement);
    });
  }

  function buildSubmarineDock() {
    var dock = new THREE.Group();

    var entranceGeom = new THREE.BoxGeometry(30, 25, 40);
    var entranceMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var entrance = new THREE.Mesh(entranceGeom, entranceMat);
    entrance.position.y = 12.5;
    entrance.castShadow = true;
    entrance.receiveShadow = true;
    dock.add(entrance);

    var wallLeftGeom = new THREE.BoxGeometry(8, 25, 40);
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var wallLeft = new THREE.Mesh(wallLeftGeom, wallMat);
    wallLeft.position.set(-19, 12.5, 0);
    wallLeft.castShadow = true;
    wallLeft.receiveShadow = true;
    dock.add(wallLeft);

    var wallRight = new THREE.Mesh(wallLeftGeom, wallMat);
    wallRight.position.set(19, 12.5, 0);
    wallRight.castShadow = true;
    wallRight.receiveShadow = true;
    dock.add(wallRight);

    var waterGeom = new THREE.BoxGeometry(25, 8, 35);
    var waterMat = new THREE.MeshLambertMaterial({ color: 0x001a4d });
    var water = new THREE.Mesh(waterGeom, waterMat);
    water.position.set(0, 1, 0);
    water.castShadow = true;
    water.receiveShadow = true;
    dock.add(water);

    var supportGeom = new THREE.CylinderGeometry(2, 2, 20, 16);
    var supportMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    for (var i = 0; i < 4; i++) {
      var support = new THREE.Mesh(supportGeom, supportMat);
      support.position.set(-10 + i * 7, 10, -15 + i % 2 * 5);
      support.castShadow = true;
      support.receiveShadow = true;
      dock.add(support);
    }

    dock.position.set(-130, 5, -80);
    scene.add(dock);
    objects.push(dock);
  }

  function buildFlotsam() {
    var flotsampPositions = [
      { x: 50, z: 140 },
      { x: -80, z: 130 },
      { x: 100, z: -100 },
      { x: -120, z: -110 },
      { x: 30, z: 110 },
      { x: -60, z: -130 }
    ];

    flotsampPositions.forEach(function(pos) {
      var debris = new THREE.Group();

      var woodGeom = new THREE.BoxGeometry(12, 2, 4);
      var woodMat = new THREE.MeshLambertMaterial({ color: 0x8b6f47 });
      var wood = new THREE.Mesh(woodGeom, woodMat);
      wood.position.y = 0.5;
      wood.rotation.z = Math.random() * Math.PI;
      wood.castShadow = true;
      wood.receiveShadow = true;
      debris.add(wood);

      var metalGeom = new THREE.BoxGeometry(4, 3, 3);
      var metalMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
      var metal = new THREE.Mesh(metalGeom, metalMat);
      metal.position.set(5, 1, 1);
      metal.rotation.z = Math.random() * Math.PI;
      metal.castShadow = true;
      metal.receiveShadow = true;
      debris.add(metal);

      var ropeGeom = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
      var ropeMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
      var rope = new THREE.Mesh(ropeGeom, ropeMat);
      rope.position.set(-4, 2, 0);
      rope.rotation.z = Math.random() * Math.PI * 0.5;
      rope.castShadow = true;
      rope.receiveShadow = true;
      debris.add(rope);

      debris.position.set(pos.x, 0, pos.z);
      scene.add(debris);
      objects.push(debris);
      animatedObjects.push({ obj: debris, type: 'debris' });
    });
  }

  function buildMiscStructures() {
    var ammoBoxGeom = new THREE.BoxGeometry(2, 2, 3);
    var ammoBoxMat = new THREE.MeshLambertMaterial({ color: 0xaa0000 });
    for (var i = 0; i < 5; i++) {
      var box = new THREE.Mesh(ammoBoxGeom, ammoBoxMat);
      box.position.set(-50 + i * 10, 1, 40);
      box.castShadow = true;
      box.receiveShadow = true;
      scene.add(box);
      objects.push(box);
    }

    var fencePostGeom = new THREE.CylinderGeometry(0.5, 0.5, 8, 12);
    var fencePostMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
    for (var j = 0; j < 8; j++) {
      var post = new THREE.Mesh(fencePostGeom, fencePostMat);
      var angle = (j / 8) * Math.PI * 2;
      post.position.set(Math.cos(angle) * 130, 4, Math.sin(angle) * 130);
      post.castShadow = true;
      post.receiveShadow = true;
      scene.add(post);
      objects.push(post);
    }

    var fuelTankGeom = new THREE.CylinderGeometry(4, 4, 10, 32);
    var fuelTankMat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
    for (var k = 0; k < 3; k++) {
      var tank = new THREE.Mesh(fuelTankGeom, fuelTankMat);
      tank.position.set(70 + k * 15, 5, -50);
      tank.castShadow = true;
      tank.receiveShadow = true;
      scene.add(tank);
      objects.push(tank);
    }

    var crateGeom = new THREE.BoxGeometry(6, 6, 6);
    var crateMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
    for (var m = 0; m < 4; m++) {
      var crate = new THREE.Mesh(crateGeom, crateMat);
      crate.position.set(-80 + m * 12, 3, 0);
      crate.castShadow = true;
      crate.receiveShadow = true;
      scene.add(crate);
      objects.push(crate);
    }
  }

  function buildTerrain() {
    var groundGeom = new THREE.BoxGeometry(400, 1, 400);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x336633 });
    var ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);
    objects.push(ground);

    var waterGeom = new THREE.BoxGeometry(500, 20, 500);
    var waterMat = new THREE.MeshLambertMaterial({ color: 0x0a3d62 });
    var water = new THREE.Mesh(waterGeom, waterMat);
    water.position.set(0, -15, 0);
    water.receiveShadow = true;
    scene.add(water);
    objects.push(water);
  }

  function buildLights() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(100, 80, 60);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -200;
    dirLight.shadow.camera.right = 200;
    dirLight.shadow.camera.top = 200;
    dirLight.shadow.camera.bottom = -200;
    dirLight.shadow.camera.far = 500;
    scene.add(dirLight);
    lights.push(dirLight);

    var pointLight1 = new THREE.PointLight(0xffaa00, 1, 150);
    pointLight1.position.set(80, 55, 120);
    pointLight1.castShadow = true;
    scene.add(pointLight1);
    lights.push(pointLight1);

    var pointLight2 = new THREE.PointLight(0x0066ff, 0.8, 200);
    pointLight2.position.set(-130, 30, -80);
    pointLight2.castShadow = true;
    scene.add(pointLight2);
    lights.push(pointLight2);

    var stormLight = new THREE.PointLight(0x99ccff, 0.6, 300);
    stormLight.position.set(0, 100, 0);
    scene.add(stormLight);
    lights.push(stormLight);
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    animatedObjects = [];
    lights = [];

    buildTerrain();
    buildLights();
    buildLighthouse();
    buildBunkers();
    buildSeaCliffs();
    buildRadarTowers();
    buildBarracks();
    buildNavalGuns();
    buildSubmarineDock();
    buildFlotsam();
    buildMiscStructures();
  }

  function update(delta) {
    animatedObjects.forEach(function(item) {
      if (item.type === 'lighthouse') {
        item.obj.rotation.y += delta * 0.3;
      }
      if (item.type === 'radar') {
        item.obj.rotation.x += delta * 0.5;
        item.obj.rotation.z += delta * 0.4;
      }
      if (item.type === 'debris') {
        var offset = Math.sin(Date.now() * 0.001 + item.obj.position.x * 0.01) * delta;
        item.obj.position.y += offset * 0.2;
        item.obj.rotation.z += delta * 0.1;
      }
    });
  }

  function reset() {
    objects.forEach(function(obj) {
      scene.remove(obj);
    });
    lights.forEach(function(light) {
      scene.remove(light);
    });
    objects = [];
    lights = [];
    animatedObjects = [];
    scene = null;
    camera = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
})();
