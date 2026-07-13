var ArmadaleBase = (function() {
  'use strict';

  var BASE_X = 1380;
  var BASE_Z = 1840;

  function createScene() {
    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 200, 1000);
    return scene;
  }

  function addCastleRuins(scene) {
    var geometry = new THREE.BoxGeometry(10, 5, 6);
    var material = new THREE.MeshLambertMaterial({ color: 0xF0ECD8 });
    var castle = new THREE.Mesh(geometry, material);
    castle.position.set(BASE_X, 2.5, BASE_Z);
    castle.castShadow = true;
    castle.receiveShadow = true;
    scene.add(castle);

    var brokenGeo = new THREE.BoxGeometry(2, 4, 0.5);
    var brokenMat = new THREE.MeshLambertMaterial({ color: 0xD4C4A8 });
    var broken = new THREE.Mesh(brokenGeo, brokenMat);
    broken.position.set(BASE_X + 6, 2, BASE_Z);
    broken.rotation.z = 0.3;
    broken.castShadow = true;
    scene.add(broken);
  }

  function addMacDonaldTower(scene) {
    var baseGeo = new THREE.CylinderGeometry(3, 3, 14, 16);
    var baseMat = new THREE.MeshLambertMaterial({ color: 0xF0ECD8 });
    var tower = new THREE.Mesh(baseGeo, baseMat);
    tower.position.set(BASE_X + 20, 7, BASE_Z + 15);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);

    var capGeo = new THREE.ConeGeometry(3.2, 4, 16);
    var capMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    var cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(BASE_X + 20, 16, BASE_Z + 15);
    cap.castShadow = true;
    scene.add(cap);
  }

  function addWoodland(scene) {
    var trees = [
      { x: BASE_X - 30, z: BASE_Z - 20 },
      { x: BASE_X - 25, z: BASE_Z + 10 },
      { x: BASE_X - 35, z: BASE_Z + 25 },
      { x: BASE_X - 10, z: BASE_Z - 30 },
      { x: BASE_X + 15, z: BASE_Z - 25 },
      { x: BASE_X + 25, z: BASE_Z - 35 },
      { x: BASE_X + 30, z: BASE_Z + 20 },
      { x: BASE_X - 20, z: BASE_Z + 35 }
    ];

    var trunkMat = new THREE.MeshLambertMaterial({ color: 0x3D2817 });
    var crownMat = new THREE.MeshLambertMaterial({ color: 0x1B4620 });

    var i = 0;
    while (i < trees.length) {
      var tree = trees[i];

      var trunkGeo = new THREE.CylinderGeometry(0.5, 0.6, 8, 8);
      var trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(tree.x, 4, tree.z);
      trunk.castShadow = true;
      scene.add(trunk);

      var crownGeo = new THREE.ConeGeometry(3.5, 7, 8);
      var crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.set(tree.x, 10, tree.z);
      crown.castShadow = true;
      scene.add(crown);

      i = i + 1;
    }
  }

  function addFerryTerminal(scene) {
    var buildingGeo = new THREE.BoxGeometry(12, 4, 8);
    var stoneMat = new THREE.MeshLambertMaterial({ color: 0xA9927D });
    var building = new THREE.Mesh(buildingGeo, stoneMat);
    building.position.set(BASE_X + 40, 2, BASE_Z - 50);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);

    var slipGeo = new THREE.BoxGeometry(6, 0.5, 15);
    var slipMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
    var slip = new THREE.Mesh(slipGeo, slipMat);
    slip.position.set(BASE_X + 45, 0.25, BASE_Z - 65);
    slip.receiveShadow = true;
    scene.add(slip);
  }

  function addTorpedoBarrier(scene) {
    var points = [
      new THREE.Vector3(BASE_X + 50, 1, BASE_Z - 80),
      new THREE.Vector3(BASE_X + 100, 1, BASE_Z - 100),
      new THREE.Vector3(BASE_X + 120, 1, BASE_Z - 50),
      new THREE.Vector3(BASE_X + 80, 1, BASE_Z - 30)
    ];

    var geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(points);

    var material = new THREE.LineBasicMaterial({ color: 0x2F4F4F, linewidth: 3 });
    var net = new THREE.LineSegments(geometry, material);
    scene.add(net);

    var segments = [];
    var j = 0;
    while (j < points.length) {
      var next = (j + 1) % points.length;
      segments.push(points[j]);
      segments.push(points[next]);
      j = j + 1;
    }

    var segGeo = new THREE.BufferGeometry();
    segGeo.setFromPoints(segments);
    var netLines = new THREE.LineSegments(segGeo, material);
    scene.add(netLines);
  }

  function addGaelicCollege(scene) {
    var buildings = [
      { x: BASE_X - 60, z: BASE_Z + 50 },
      { x: BASE_X - 50, z: BASE_Z + 65 },
      { x: BASE_X - 40, z: BASE_Z + 50 }
    ];

    var collegeMat = new THREE.MeshLambertMaterial({ color: 0xC0A080 });

    var k = 0;
    while (k < buildings.length) {
      var bldg = buildings[k];
      var bldgGeo = new THREE.BoxGeometry(8, 5, 10);
      var building = new THREE.Mesh(bldgGeo, collegeMat);
      building.position.set(bldg.x, 2.5, bldg.z);
      building.castShadow = true;
      building.receiveShadow = true;
      scene.add(building);
      k = k + 1;
    }
  }

  function addArmoury(scene) {
    var armGeo = new THREE.BoxGeometry(6, 3, 4);
    var darkMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
    var armoury = new THREE.Mesh(armGeo, darkMat);
    armoury.position.set(BASE_X - 25, 1.5, BASE_Z + 80);
    armoury.castShadow = true;
    armoury.receiveShadow = true;
    scene.add(armoury);
  }

  function addWatchPoint(scene) {
    var watchGeo = new THREE.CylinderGeometry(2, 2, 12, 12);
    var watchMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
    var watch = new THREE.Mesh(watchGeo, watchMat);
    watch.position.set(BASE_X + 70, 6, BASE_Z + 100);
    watch.castShadow = true;
    watch.receiveShadow = true;
    scene.add(watch);

    var beaconGeo = new THREE.SphereGeometry(1.5, 16, 16);
    var beaconMat = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
    var beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(BASE_X + 70, 13, BASE_Z + 100);
    beacon.castShadow = true;
    scene.add(beacon);
  }

  function initialize() {
    var scene = createScene();

    addCastleRuins(scene);
    addMacDonaldTower(scene);
    addWoodland(scene);
    addFerryTerminal(scene);
    addTorpedoBarrier(scene);
    addGaelicCollege(scene);
    addArmoury(scene);
    addWatchPoint(scene);

    return scene;
  }

  return {
    initialize: initialize,
    BASE_X: BASE_X,
    BASE_Z: BASE_Z
  };
}());
