window.LeverburghBase = (function() {
  'use strict';

  var BASE_X = 1540;
  var BASE_Z = 2080;
  var BASE_Y = 0;

  function factory() {
    var group = new THREE.Group();
    group.position.set(BASE_X, BASE_Y, BASE_Z);

    var factoryGeo = new THREE.BoxGeometry(14, 5, 6);
    var factoryMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
    var factoryMesh = new THREE.Mesh(factoryGeo, factoryMat);
    factoryMesh.position.set(0, 2.5, 0);
    factoryMesh.castShadow = true;
    factoryMesh.receiveShadow = true;
    group.add(factoryMesh);

    return group;
  }

  function ferryslip() {
    var group = new THREE.Group();
    group.position.set(BASE_X + 25, BASE_Y, BASE_Z - 20);

    var rampGeo = new THREE.BoxGeometry(8, 1, 12);
    var rampMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var rampMesh = new THREE.Mesh(rampGeo, rampMat);
    rampMesh.position.set(0, 0.5, 0);
    rampMesh.rotation.z = 0.15;
    rampMesh.castShadow = true;
    rampMesh.receiveShadow = true;
    group.add(rampMesh);

    var hullGeo = new THREE.BoxGeometry(6, 3, 10);
    var hullMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var hullMesh = new THREE.Mesh(hullGeo, hullMat);
    hullMesh.position.set(0, 2, 8);
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    group.add(hullMesh);

    return group;
  }

  function radar() {
    var group = new THREE.Group();
    group.position.set(BASE_X - 35, BASE_Y, BASE_Z + 30);

    var buildingGeo = new THREE.BoxGeometry(5, 3, 5);
    var buildingMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
    var buildingMesh = new THREE.Mesh(buildingGeo, buildingMat);
    buildingMesh.position.set(0, 1.5, 0);
    buildingMesh.castShadow = true;
    buildingMesh.receiveShadow = true;
    group.add(buildingMesh);

    var mastGeo = new THREE.CylinderGeometry(0.3, 0.3, 15, 8);
    var mastMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var mastMesh = new THREE.Mesh(mastGeo, mastMat);
    mastMesh.position.set(0, 8, 0);
    mastMesh.castShadow = true;
    mastMesh.receiveShadow = true;
    group.add(mastMesh);

    return group;
  }

  function islands() {
    var group = new THREE.Group();
    group.position.set(BASE_X, BASE_Y, BASE_Z);

    var sizes = [
      { w: 8, h: 2, d: 6, x: 60, z: 50 },
      { w: 6, h: 2, d: 5, x: 70, z: 65 },
      { w: 7, h: 2, d: 5, x: 45, z: 70 },
      { w: 5, h: 1.5, d: 4, x: 85, z: 45 },
      { w: 6, h: 1.8, d: 5, x: 55, z: 85 },
      { w: 4, h: 1.5, d: 3, x: 75, z: 75 }
    ];

    var islandMat = new THREE.MeshLambertMaterial({ color: 0x444444 });

    var i = 0;
    while (i < sizes.length) {
      var s = sizes[i];
      var islandGeo = new THREE.BoxGeometry(s.w, s.h, s.d);
      var islandMesh = new THREE.Mesh(islandGeo, islandMat);
      islandMesh.position.set(s.x, s.h / 2, s.z);
      islandMesh.castShadow = true;
      islandMesh.receiveShadow = true;
      group.add(islandMesh);
      i = i + 1;
    }

    return group;
  }

  function torpedonet() {
    var group = new THREE.Group();
    group.position.set(BASE_X + 40, BASE_Y, BASE_Z);

    var points = [];
    var x = 0;
    while (x < 10) {
      var z = 0;
      while (z < 50) {
        points.push(new THREE.Vector3(x * 5, 5 - (z / 50) * 4, z));
        z = z + 10;
      }
      x = x + 1;
    }

    var netMat = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });
    var i = 0;
    while (i < points.length - 1) {
      var lineGeo = new THREE.BufferGeometry().setFromPoints([points[i], points[i + 1]]);
      var lineMesh = new THREE.LineSegments(lineGeo, netMat);
      group.add(lineMesh);
      i = i + 1;
    }

    return group;
  }

  function pier() {
    var group = new THREE.Group();
    group.position.set(BASE_X - 50, BASE_Y, BASE_Z - 40);

    var pierMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
    var section1Geo = new THREE.BoxGeometry(3, 4, 8);
    var section1Mesh = new THREE.Mesh(section1Geo, pierMat);
    section1Mesh.position.set(-5, 2, 0);
    section1Mesh.castShadow = true;
    section1Mesh.receiveShadow = true;
    group.add(section1Mesh);

    var section2Geo = new THREE.BoxGeometry(3, 3.5, 8);
    var section2Mesh = new THREE.Mesh(section2Geo, pierMat);
    section2Mesh.position.set(0, 1.75, 0);
    section2Mesh.castShadow = true;
    section2Mesh.receiveShadow = true;
    group.add(section2Mesh);

    var section3Geo = new THREE.BoxGeometry(3, 3, 8);
    var section3Mesh = new THREE.Mesh(section3Geo, pierMat);
    section3Mesh.position.set(5, 1.5, 0);
    section3Mesh.castShadow = true;
    section3Mesh.receiveShadow = true;
    group.add(section3Mesh);

    return group;
  }

  function depot() {
    var group = new THREE.Group();
    group.position.set(BASE_X + 20, BASE_Y, BASE_Z + 35);

    var depotGeo = new THREE.BoxGeometry(10, 4, 5);
    var depotMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var depotMesh = new THREE.Mesh(depotGeo, depotMat);
    depotMesh.position.set(0, 2, 0);
    depotMesh.castShadow = true;
    depotMesh.receiveShadow = true;
    group.add(depotMesh);

    var crateGeo = new THREE.BoxGeometry(2, 2, 2);
    var crateMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
    var crate1 = new THREE.Mesh(crateGeo, crateMat);
    crate1.position.set(-2, 1, -1);
    crate1.castShadow = true;
    crate1.receiveShadow = true;
    group.add(crate1);

    var crate2 = new THREE.Mesh(crateGeo, crateMat);
    crate2.position.set(2, 1, 1);
    crate2.castShadow = true;
    crate2.receiveShadow = true;
    group.add(crate2);

    return group;
  }

  function signal() {
    var group = new THREE.Group();
    group.position.set(BASE_X - 45, BASE_Y, BASE_Z + 50);

    var towerGeo = new THREE.CylinderGeometry(0.8, 0.8, 20, 8);
    var towerMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var towerMesh = new THREE.Mesh(towerGeo, towerMat);
    towerMesh.position.set(0, 10, 0);
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    group.add(towerMesh);

    var lampMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    var lampGeo = new THREE.SphereGeometry(0.6, 8, 8);

    var lamp1 = new THREE.Mesh(lampGeo, lampMat);
    lamp1.position.set(0, 19, 0);
    lamp1.castShadow = true;
    lamp1.receiveShadow = true;
    group.add(lamp1);

    var lamp2 = new THREE.Mesh(lampGeo, lampMat);
    lamp2.position.set(-2, 17, 0);
    lamp2.castShadow = true;
    lamp2.receiveShadow = true;
    group.add(lamp2);

    var lamp3 = new THREE.Mesh(lampGeo, lampMat);
    lamp3.position.set(2, 17, 0);
    lamp3.castShadow = true;
    lamp3.receiveShadow = true;
    group.add(lamp3);

    return group;
  }

  function build() {
    var baseGroup = new THREE.Group();

    var factoryGroup = factory();
    baseGroup.add(factoryGroup);

    var ferryGroup = ferryslip();
    baseGroup.add(ferryGroup);

    var radarGroup = radar();
    baseGroup.add(radarGroup);

    var islandsGroup = islands();
    baseGroup.add(islandsGroup);

    var netGroup = torpedonet();
    baseGroup.add(netGroup);

    var pierGroup = pier();
    baseGroup.add(pierGroup);

    var depotGroup = depot();
    baseGroup.add(depotGroup);

    var signalGroup = signal();
    baseGroup.add(signalGroup);

    return baseGroup;
  }

  var API = {
    build: build,
    factory: factory,
    ferryslip: ferryslip,
    radar: radar,
    islands: islands,
    torpedonet: torpedonet,
    pier: pier,
    depot: depot,
    signal: signal
  };

  return API;
}());
