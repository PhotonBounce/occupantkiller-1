var WickDock = (function() {
  'use strict';

  var scene = null;
  var baseX = 940;
  var baseZ = 1180;

  function createWarehouses() {
    var group = new THREE.Group();
    var material = new THREE.MeshLambertMaterial({ color: 0x666666 });

    for (var i = 0; i < 3; i++) {
      var geometry = new THREE.BoxGeometry(12, 6, 5);
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(baseX + (i * 15), 3, baseZ);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    return group;
  }

  function createHangar() {
    var group = new THREE.Group();
    var material = new THREE.MeshLambertMaterial({ color: 0x888888 });

    var bodyGeometry = new THREE.BoxGeometry(12, 6, 5);
    var bodyMesh = new THREE.Mesh(bodyGeometry, material);
    bodyMesh.position.set(baseX + 60, 3, baseZ + 20);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    var endGeometry = new THREE.CylinderGeometry(3, 3, 5, 8);
    var endMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var endMesh = new THREE.Mesh(endGeometry, endMaterial);
    endMesh.position.set(baseX + 60 + 8.5, 3, baseZ + 20);
    endMesh.rotation.z = Math.PI / 2;
    endMesh.castShadow = true;
    endMesh.receiveShadow = true;
    group.add(endMesh);

    return group;
  }

  function createControlTower() {
    var group = new THREE.Group();

    var towerGeometry = new THREE.CylinderGeometry(1.5, 1.5, 10, 8);
    var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var towerMesh = new THREE.Mesh(towerGeometry, towerMaterial);
    towerMesh.position.set(baseX + 40, 5, baseZ + 35);
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    group.add(towerMesh);

    var cabGeometry = new THREE.BoxGeometry(2, 2, 2);
    var cabMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var cabMesh = new THREE.Mesh(cabGeometry, cabMaterial);
    cabMesh.position.set(baseX + 40, 11, baseZ + 35);
    cabMesh.castShadow = true;
    cabMesh.receiveShadow = true;
    group.add(cabMesh);

    return group;
  }

  function createBreakwater() {
    var group = new THREE.Group();
    var material = new THREE.MeshLambertMaterial({ color: 0x666666 });

    for (var i = 0; i < 30; i++) {
      var geometry = new THREE.BoxGeometry(1.2, 2, 1.2);
      var mesh = new THREE.Mesh(geometry, material);

      if (i < 15) {
        mesh.position.set(baseX + 80 + i, 1, baseZ - 30);
      } else {
        mesh.position.set(baseX + 80 + 14, 1, baseZ - 30 + (i - 14));
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    return group;
  }

  function createQuarry() {
    var group = new THREE.Group();
    var material = new THREE.MeshLambertMaterial({ color: 0x778899 });

    for (var i = 0; i < 5; i++) {
      var geometry = new THREE.BoxGeometry(20, 4 - i, 15);
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(baseX + 100, 2 + (i * 3), baseZ - 60);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    return group;
  }

  function createFlyingBoat() {
    var group = new THREE.Group();

    var hullGeometry = new THREE.BoxGeometry(8, 2.5, 2);
    var hullMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    var hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
    hullMesh.position.set(baseX + 120, 2, baseZ + 45);
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    group.add(hullMesh);

    var wingsGeometry = new THREE.BoxGeometry(16, 0.8, 3);
    var wingsMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    var wingsMesh = new THREE.Mesh(wingsGeometry, wingsMaterial);
    wingsMesh.position.set(baseX + 120, 3.5, baseZ + 45);
    wingsMesh.castShadow = true;
    wingsMesh.receiveShadow = true;
    group.add(wingsMesh);

    for (var i = 0; i < 2; i++) {
      var engineGeometry = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 6);
      var engineMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
      var engineMesh = new THREE.Mesh(engineGeometry, engineMaterial);
      engineMesh.position.set(baseX + 110 + (i * 20), 3.5, baseZ + 45);
      engineMesh.rotation.z = Math.PI / 2;
      engineMesh.castShadow = true;
      engineMesh.receiveShadow = true;
      group.add(engineMesh);
    }

    return group;
  }

  function createCrane() {
    var group = new THREE.Group();

    var baseGeometry = new THREE.CylinderGeometry(1.2, 1.2, 1, 8);
    var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.set(baseX + 50, 0.5, baseZ + 60);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    var postGeometry = new THREE.CylinderGeometry(0.5, 0.5, 12, 6);
    var postMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var postMesh = new THREE.Mesh(postGeometry, postMaterial);
    postMesh.position.set(baseX + 50, 6, baseZ + 60);
    postMesh.castShadow = true;
    postMesh.receiveShadow = true;
    group.add(postMesh);

    var boomGeometry = new THREE.BoxGeometry(14, 0.6, 0.8);
    var boomMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var boomMesh = new THREE.Mesh(boomGeometry, boomMaterial);
    boomMesh.position.set(baseX + 50 + 5, 11, baseZ + 60);
    boomMesh.castShadow = true;
    boomMesh.receiveShadow = true;
    group.add(boomMesh);

    var hookGeometry = new THREE.BoxGeometry(0.4, 2, 0.4);
    var hookMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    var hookMesh = new THREE.Mesh(hookGeometry, hookMaterial);
    hookMesh.position.set(baseX + 50 + 12, 9, baseZ + 60);
    hookMesh.castShadow = true;
    hookMesh.receiveShadow = true;
    group.add(hookMesh);

    return group;
  }

  function createLighthouse() {
    var group = new THREE.Group();

    var towerGeometry = new THREE.CylinderGeometry(1.2, 1.2, 15, 8);
    var towerMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    var towerMesh = new THREE.Mesh(towerGeometry, towerMaterial);
    towerMesh.position.set(baseX + 140, 7.5, baseZ - 40);
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    group.add(towerMesh);

    var roofGeometry = new THREE.ConeGeometry(1.5, 3, 8);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    var roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
    roofMesh.position.set(baseX + 140, 16, baseZ - 40);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    group.add(roofMesh);

    var lanternGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.2, 8);
    var lanternMaterial = new THREE.MeshLambertMaterial({ color: 0xffff99 });
    var lanternMesh = new THREE.Mesh(lanternGeometry, lanternMaterial);
    lanternMesh.position.set(baseX + 140, 14.5, baseZ - 40);
    lanternMesh.castShadow = true;
    lanternMesh.receiveShadow = true;
    group.add(lanternMesh);

    return group;
  }

  function initialize(sceneRef) {
    scene = sceneRef;

    var warehouses = createWarehouses();
    scene.add(warehouses);

    var hangar = createHangar();
    scene.add(hangar);

    var tower = createControlTower();
    scene.add(tower);

    var breakwater = createBreakwater();
    scene.add(breakwater);

    var quarry = createQuarry();
    scene.add(quarry);

    var flyingBoat = createFlyingBoat();
    scene.add(flyingBoat);

    var crane = createCrane();
    scene.add(crane);

    var lighthouse = createLighthouse();
    scene.add(lighthouse);
  }

  return {
    initialize: initialize
  };
})();
