window.KinlochbervieBase = (function() {
  'use strict';

  var BaseX = 1060;
  var BaseZ = 1360;

  function create() {
    var group = new THREE.Group();

    var quay = createquay();
    group.add(quay);

    var plant = createplant();
    group.add(plant);

    var factory = createfactory();
    group.add(factory);

    var vessel = createvessel();
    group.add(vessel);

    var beacon = createbeacon();
    group.add(beacon);

    var boulders = createboulders();
    group.add(boulders);

    var fuel = createfuel();
    group.add(fuel);

    var helipad = createhelipad();
    group.add(helipad);

    group.position.set(BaseX, 0, BaseZ);
    return group;
  }

  function createquay() {
    var group = new THREE.Group();
    var material = new THREE.MeshLambertMaterial({ color: 0x808080 });
    var geometry = new THREE.BoxGeometry(25, 2, 5);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 1;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return group;
  }

  function createplant() {
    var group = new THREE.Group();
    var material = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });

    var geo1 = new THREE.BoxGeometry(10, 5, 4);
    var mesh1 = new THREE.Mesh(geo1, material);
    mesh1.position.set(-12, 2.5, -10);
    mesh1.castShadow = true;
    mesh1.receiveShadow = true;
    group.add(mesh1);

    var geo2 = new THREE.BoxGeometry(10, 5, 4);
    var mesh2 = new THREE.Mesh(geo2, material);
    mesh2.position.set(-12, 2.5, 10);
    mesh2.castShadow = true;
    mesh2.receiveShadow = true;
    group.add(mesh2);

    return group;
  }

  function createfactory() {
    var group = new THREE.Group();
    var whiteMaterial = new THREE.MeshLambertMaterial({ color: 0xF0F0F0 });
    var darkMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

    var cubeGeo = new THREE.BoxGeometry(8, 6, 8);
    var cubeMesh = new THREE.Mesh(cubeGeo, whiteMaterial);
    cubeMesh.position.set(12, 3, 0);
    cubeMesh.castShadow = true;
    cubeMesh.receiveShadow = true;
    group.add(cubeMesh);

    var towerGeo = new THREE.CylinderGeometry(2, 2.5, 8, 8);
    var towerMesh = new THREE.Mesh(towerGeo, darkMaterial);
    towerMesh.position.set(15, 7, 3);
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    group.add(towerMesh);

    return group;
  }

  function createvessel() {
    var group = new THREE.Group();
    var hullMaterial = new THREE.MeshLambertMaterial({ color: 0x1A1A3E });
    var superMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
    var gunMaterial = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });

    var hullGeo = new THREE.BoxGeometry(10, 2, 3);
    var hullMesh = new THREE.Mesh(hullGeo, hullMaterial);
    hullMesh.position.set(-18, 1.5, 8);
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    group.add(hullMesh);

    var superGeo = new THREE.BoxGeometry(4, 3, 2);
    var superMesh = new THREE.Mesh(superGeo, superMaterial);
    superMesh.position.set(-18, 4, 7.5);
    superMesh.castShadow = true;
    superMesh.receiveShadow = true;
    group.add(superMesh);

    var gunGeo = new THREE.CylinderGeometry(0.4, 0.4, 4, 8);
    var gunMesh = new THREE.Mesh(gunGeo, gunMaterial);
    gunMesh.rotation.z = Math.PI / 6;
    gunMesh.position.set(-18, 6, 7.5);
    gunMesh.castShadow = true;
    gunMesh.receiveShadow = true;
    group.add(gunMesh);

    return group;
  }

  function createbeacon() {
    var group = new THREE.Group();
    var postMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    var topMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });

    var postGeo = new THREE.CylinderGeometry(0.5, 0.5, 12, 8);
    var postMesh = new THREE.Mesh(postGeo, postMaterial);
    postMesh.position.set(20, 6, -15);
    postMesh.castShadow = true;
    postMesh.receiveShadow = true;
    group.add(postMesh);

    var beaconGeo = new THREE.SphereGeometry(1.2, 8, 8);
    var beaconMesh = new THREE.Mesh(beaconGeo, topMaterial);
    beaconMesh.position.set(20, 13, -15);
    beaconMesh.castShadow = true;
    beaconMesh.receiveShadow = true;
    group.add(beaconMesh);

    return group;
  }

  function createboulders() {
    var group = new THREE.Group();
    var material = new THREE.MeshLambertMaterial({ color: 0xFFCCCC });

    var positions = [
      [25, 0.8, -20],
      [28, 1.2, -18],
      [22, 0.6, -22],
      [26, 1.0, -25],
      [30, 0.5, -16],
      [24, 0.9, -28],
      [32, 1.1, -20],
      [27, 0.7, -24]
    ];

    var sizes = [
      1.2, 1.5, 0.9, 1.3, 1.1, 0.8, 1.4, 1.0
    ];

    for (var i = 0; i < positions.length; i = i + 1) {
      var size = sizes[i];
      var geo = new THREE.BoxGeometry(size, size * 0.8, size * 0.7);
      var mesh = new THREE.Mesh(geo, material);
      mesh.position.set(positions[i][0], positions[i][1], positions[i][2]);
      mesh.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    return group;
  }

  function createfuel() {
    var group = new THREE.Group();
    var drumMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6B00 });
    var bermMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });

    var drumPositions = [
      [-8, 0.9, -12],
      [-5, 0.9, -12],
      [-2, 0.9, -12]
    ];

    for (var i = 0; i < drumPositions.length; i = i + 1) {
      var geo = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 12);
      var mesh = new THREE.Mesh(geo, drumMaterial);
      mesh.position.set(drumPositions[i][0], drumPositions[i][1], drumPositions[i][2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    var bermGeo = new THREE.BoxGeometry(8, 1.5, 2.5);
    var bermMesh = new THREE.Mesh(bermGeo, bermMaterial);
    bermMesh.position.set(-5, 0.75, -15);
    bermMesh.castShadow = true;
    bermMesh.receiveShadow = true;
    group.add(bermMesh);

    return group;
  }

  function createhelipad() {
    var group = new THREE.Group();
    var padMaterial = new THREE.MeshLambertMaterial({ color: 0x00AA00 });
    var sockMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });

    var padGeo = new THREE.BoxGeometry(12, 0.3, 12);
    var padMesh = new THREE.Mesh(padGeo, padMaterial);
    padMesh.position.set(-25, 15, -20);
    padMesh.castShadow = true;
    padMesh.receiveShadow = true;
    group.add(padMesh);

    var sockGeo = new THREE.ConeGeometry(1.5, 4, 8);
    var sockMesh = new THREE.Mesh(sockGeo, sockMaterial);
    sockMesh.position.set(-25, 16.5, -15);
    sockMesh.castShadow = true;
    sockMesh.receiveShadow = true;
    group.add(sockMesh);

    return group;
  }

  return {
    create: create
  };
}());
