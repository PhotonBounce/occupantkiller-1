window.DysartPost = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createPanTower(scene) {
    var panHouseGeom = new THREE.BoxGeometry(12, 14, 8);
    var panHouseMat = new THREE.MeshLambertMaterial({ color: 0x887766 });
    var panHouse = new THREE.Mesh(panHouseGeom, panHouseMat);
    panHouse.position.set(-20, 7, -30);
    scene.add(panHouse);
    objects.push(panHouse);

    var towerGeom = new THREE.BoxGeometry(4, 18, 4);
    var towerMat = new THREE.MeshLambertMaterial({ color: 0x887766 });
    var tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.set(-20, 11, -30);
    scene.add(tower);
    objects.push(tower);

    return tower;
  }

  function createSaltPanStructures(scene) {
    var panGeom = new THREE.BoxGeometry(14, 2, 6);
    var panMat = new THREE.MeshLambertMaterial({ color: 0x887766 });
    var pan = new THREE.Mesh(panGeom, panMat);
    pan.position.set(0, 1, -40);
    scene.add(pan);
    objects.push(pan);

    var chimneyGeom = new THREE.CylinderGeometry(0.6, 0.6, 8, 16);
    var chimneyMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var chimney1 = new THREE.Mesh(chimneyGeom, chimneyMat);
    chimney1.position.set(-4, 5, -40);
    scene.add(chimney1);
    objects.push(chimney1);

    var chimney2 = new THREE.Mesh(chimneyGeom, chimneyMat);
    chimney2.position.set(4, 5, -40);
    scene.add(chimney2);
    objects.push(chimney2);
  }

  function createTolboothMercatCross(scene) {
    var tolboothGeom = new THREE.BoxGeometry(8, 10, 6);
    var tolboothMat = new THREE.MeshLambertMaterial({ color: 0xCC9966 });
    var tolbooth = new THREE.Mesh(tolboothGeom, tolboothMat);
    tolbooth.position.set(20, 5, -35);
    scene.add(tolbooth);
    objects.push(tolbooth);

    var crossPillarGeom = new THREE.BoxGeometry(1, 6, 1);
    var crossPillarMat = new THREE.MeshLambertMaterial({ color: 0xCC9966 });
    var crossPillar = new THREE.Mesh(crossPillarGeom, crossPillarMat);
    crossPillar.position.set(20, 3, -20);
    scene.add(crossPillar);
    objects.push(crossPillar);
  }

  function createHarbourWalls(scene) {
    var wall1Geom = new THREE.BoxGeometry(1, 4, 20);
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x777766 });
    var wall1 = new THREE.Mesh(wall1Geom, wallMat);
    wall1.position.set(-30, 2, -25);
    scene.add(wall1);
    objects.push(wall1);

    var wall2Geom = new THREE.BoxGeometry(1, 4, 12);
    var wall2 = new THREE.Mesh(wall2Geom, wallMat);
    wall2.position.set(-30, 2, 10);
    scene.add(wall2);
    objects.push(wall2);
  }

  function createGabledHouses(scene) {
    var colors = [0xDDCCBB, 0xCCBBAA, 0xDDCCBB, 0xCCBBAA];
    var positions = [
      [30, 2.5, -25],
      [35, 2.5, -15],
      [40, 2.5, -25],
      [45, 2.5, -15]
    ];

    for (var i = 0; i < 4; i++) {
      var houseGeom = new THREE.BoxGeometry(6, 9, 5);
      var houseMat = new THREE.MeshLambertMaterial({ color: colors[i] });
      var house = new THREE.Mesh(houseGeom, houseMat);
      house.position.set(positions[i][0], positions[i][1], positions[i][2]);
      scene.add(house);
      objects.push(house);
    }
  }

  function createMilitaryRadioAntenna(scene, tower) {
    var antennaGeom = new THREE.CylinderGeometry(0.4, 0.4, 12, 8);
    var antennaMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var antenna = new THREE.Mesh(antennaGeom, antennaMat);
    antenna.position.set(-20, 20, -30);
    antenna.userData.isAntenna = true;
    scene.add(antenna);
    objects.push(antenna);
  }

  function createPatrolInflatable(scene) {
    var inflatableGeom = new THREE.BoxGeometry(5, 1, 2);
    var inflatableMat = new THREE.MeshLambertMaterial({ color: 0x778877 });
    var inflatable = new THREE.Mesh(inflatableGeom, inflatableMat);
    inflatable.position.set(-15, 0.5, -50);
    inflatable.userData.isInflatable = true;
    inflatable.userData.bobOffset = 0;
    scene.add(inflatable);
    objects.push(inflatable);
  }

  function createBeachBarricade(scene) {
    var postMat = new THREE.MeshLambertMaterial({ color: 0x555544 });

    for (var i = 0; i < 6; i++) {
      var postGeom = new THREE.BoxGeometry(0.5, 2, 0.5);
      var post = new THREE.Mesh(postGeom, postMat);
      post.position.set(10 + i * 2, 1, -55);
      scene.add(post);
      objects.push(post);
    }

    var points = [];
    for (var j = 0; j < 6; j++) {
      points.push(new THREE.Vector3(10 + j * 2, 2.2, -55));
      points.push(new THREE.Vector3(10 + j * 2 + 1.8, 2.2, -55));
    }

    var lineGeom = new THREE.BufferGeometry().setFromPoints(points);
    var lineMat = new THREE.LineBasicMaterial({ color: 0x555544 });
    var lines = new THREE.LineSegments(lineGeom, lineMat);
    scene.add(lines);
    objects.push(lines);
  }

  function createSunLight(scene) {
    var sunLight = new THREE.DirectionalLight(0xFFBB77, 0.7);
    sunLight.position.set(50, 40, 30);
    scene.add(sunLight);
    lights.push(sunLight);
  }

  function createNavigationLight(scene) {
    var navLight = new THREE.PointLight(0x00BB44, 0.9);
    navLight.position.set(-30, 5, -25);
    scene.add(navLight);
    lights.push(navLight);
  }

  function init(scene) {
    objects = [];
    lights = [];

    createPanTower(scene);
    createSaltPanStructures(scene);
    createTolboothMercatCross(scene);
    createHarbourWalls(scene);
    createGabledHouses(scene);
    createMilitaryRadioAntenna(scene);
    createPatrolInflatable(scene);
    createBeachBarricade(scene);
    createSunLight(scene);
    createNavigationLight(scene);
  }

  function update(delta) {
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];

      if (obj.userData.isInflatable) {
        obj.userData.bobOffset += delta * 2;
        obj.position.y = 0.5 + Math.sin(obj.userData.bobOffset) * 0.3;
      }

      if (obj.userData.isAntenna) {
        obj.rotation.z += delta * 0.5;
      }
    }
  }

  function reset(scene) {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }

    for (var j = 0; j < lights.length; j++) {
      scene.remove(lights[j]);
    }

    objects = [];
    lights = [];
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getObjects: function() { return objects; },
    getLights: function() { return lights; }
  };
}());
