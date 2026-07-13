window.AberdourCamp = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var lookoutTower = null;

  function addCastle(scene) {
    // Main castle body - 14x10x10 box, grey stone
    var castleGeometry = new THREE.BoxGeometry(14, 10, 10);
    var castleMaterial = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var castle = new THREE.Mesh(castleGeometry, castleMaterial);
    castle.position.set(0, 5, -20);
    scene.add(castle);
    objects.push(castle);

    // Castle round tower - cylinder 3 radius height 12
    var towerGeometry = new THREE.CylinderGeometry(3, 3, 12, 16);
    var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(8, 6, -20);
    scene.add(tower);
    objects.push(tower);
  }

  function addGardenWalls(scene) {
    // Three terraced garden walls descending
    var wall1Geometry = new THREE.BoxGeometry(14, 2, 0.5);
    var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x887766 });

    var wall1 = new THREE.Mesh(wall1Geometry, wallMaterial);
    wall1.position.set(0, 12, -10);
    scene.add(wall1);
    objects.push(wall1);

    var wall2 = new THREE.Mesh(wall1Geometry, wallMaterial);
    wall2.position.set(0, 8, -5);
    scene.add(wall2);
    objects.push(wall2);

    var wall3 = new THREE.Mesh(wall1Geometry, wallMaterial);
    wall3.position.set(0, 4, 0);
    scene.add(wall3);
    objects.push(wall3);
  }

  function addSilverSands(scene) {
    // Beach sand - 28x0.3x14, silver-white
    var beachGeometry = new THREE.BoxGeometry(28, 0.3, 14);
    var beachMaterial = new THREE.MeshLambertMaterial({ color: 0xDDDDCC });
    var beach = new THREE.Mesh(beachGeometry, beachMaterial);
    beach.position.set(0, 0, 5);
    scene.add(beach);
    objects.push(beach);
  }

  function addBeachBar(scene) {
    // Beach bar command post - 10x4x8, beach-hut blue
    var barGeometry = new THREE.BoxGeometry(10, 4, 8);
    var barMaterial = new THREE.MeshLambertMaterial({ color: 0x2266AA });
    var bar = new THREE.Mesh(barGeometry, barMaterial);
    bar.position.set(15, 2, 8);
    scene.add(bar);
    objects.push(bar);

    // Sandbags around bar - small boxes
    var sandbagGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.8);
    var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0xBBAA99 });

    for (var i = 0; i < 5; i++) {
      var sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
      sandbag.position.set(15 + (i - 2) * 1.2, 0.3, 14);
      scene.add(sandbag);
      objects.push(sandbag);
    }
  }

  function addInchcolmIsland(scene) {
    // Distant island view - cluster of boxes
    var islandGeometry = new THREE.BoxGeometry(14, 6, 10);
    var islandMaterial = new THREE.MeshLambertMaterial({ color: 0x8899AA });
    var island = new THREE.Mesh(islandGeometry, islandMaterial);
    island.position.set(-25, 3, -30);
    scene.add(island);
    objects.push(island);
  }

  function addRailwayStation(scene) {
    // Victorian stone railway station - 10x4x8
    var stationGeometry = new THREE.BoxGeometry(10, 4, 8);
    var stationMaterial = new THREE.MeshLambertMaterial({ color: 0x998877 });
    var station = new THREE.Mesh(stationGeometry, stationMaterial);
    station.position.set(-18, 2, 12);
    scene.add(station);
    objects.push(station);
  }

  function addBeachScaffold(scene) {
    // Anti-invasion beach scaffold stakes - grid of cylinders
    var stakeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 3, 8);
    var stakeMaterial = new THREE.MeshLambertMaterial({ color: 0x444433 });

    for (var x = -10; x <= 10; x += 4) {
      for (var z = 0; z <= 16; z += 4) {
        var stake = new THREE.Mesh(stakeGeometry, stakeMaterial);
        stake.position.set(x, 1.5, z);
        scene.add(stake);
        objects.push(stake);
      }
    }
  }

  function addLookoutTower(scene) {
    // Coastal lookout tower - 4x10x4 stone
    var towerBodyGeometry = new THREE.BoxGeometry(4, 10, 4);
    var towerBodyMaterial = new THREE.MeshLambertMaterial({ color: 0x887766 });
    var towerBody = new THREE.Mesh(towerBodyGeometry, towerBodyMaterial);
    towerBody.position.set(20, 5, 0);
    scene.add(towerBody);
    objects.push(towerBody);

    // Observation box on top
    var obsGeometry = new THREE.BoxGeometry(3, 2, 3);
    var obsMaterial = new THREE.MeshLambertMaterial({ color: 0x777766 });
    var obsBox = new THREE.Mesh(obsGeometry, obsMaterial);
    obsBox.position.set(20, 11.5, 0);
    scene.add(obsBox);
    objects.push(obsBox);

    // Store for rotation
    lookoutTower = obsBox;
  }

  function addLights(scene) {
    // Silver sands golden ambient light
    var ambientLight = new THREE.AmbientLight(0xFFCC88, 0.7);
    scene.add(ambientLight);
    lights.push(ambientLight);

    // Castle floodlight 1
    var light1 = new THREE.PointLight(0xFFEE88, 1.0);
    light1.position.set(0, 15, -20);
    scene.add(light1);
    lights.push(light1);

    // Castle floodlight 2
    var light2 = new THREE.PointLight(0xFFEE88, 1.0);
    light2.position.set(5, 15, -15);
    scene.add(light2);
    lights.push(light2);
  }

  function buildEnvironment(scene) {
    addCastle(scene);
    addGardenWalls(scene);
    addSilverSands(scene);
    addBeachBar(scene);
    addInchcolmIsland(scene);
    addRailwayStation(scene);
    addBeachScaffold(scene);
    addLookoutTower(scene);
    addLights(scene);
  }

  function update(delta) {
    // Rotate lookout tower observation scanner
    if (lookoutTower) {
      lookoutTower.rotation.y += delta * 0.5;
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      objects[i].geometry.dispose();
      objects[i].material.dispose();
    }
    objects.length = 0;

    for (var j = 0; j < lights.length; j++) {
      lights[j].dispose();
    }
    lights.length = 0;

    lookoutTower = null;
  }

  return {
    build: buildEnvironment,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
