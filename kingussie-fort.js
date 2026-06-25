window.KingussieFort = (function() {
  'use strict';

  var scene = null;
  var baseX = 660;
  var baseZ = 760;

  function init(parentScene) {
    scene = parentScene;
    build();
  }

  function build() {
    buildRuthvenBarracks();
    buildMottePlatform();
    buildBarrackWalls();
    buildPrefabHQ();
    buildSignalTower();
    buildSpeyBerm();
    buildAmmoCasemates();
    buildMemorialMarker();
  }

  function buildRuthvenBarracks() {
    var geometry = new THREE.BoxGeometry(10, 6, 6);
    var material = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(baseX, 3, baseZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    var brokenLeftGeometry = new THREE.BoxGeometry(0.5, 4, 6);
    var brokenLeftMaterial = new THREE.MeshLambertMaterial({ color: 0xA89968 });
    var brokenLeft = new THREE.Mesh(brokenLeftGeometry, brokenLeftMaterial);
    brokenLeft.position.set(baseX - 5.5, 2.5, baseZ);
    brokenLeft.castShadow = true;
    brokenLeft.receiveShadow = true;
    scene.add(brokenLeft);

    var brokenRightGeometry = new THREE.BoxGeometry(0.5, 3, 6);
    var brokenRightMaterial = new THREE.MeshLambertMaterial({ color: 0xA89968 });
    var brokenRight = new THREE.Mesh(brokenRightGeometry, brokenRightMaterial);
    brokenRight.position.set(baseX + 5.5, 1.5, baseZ);
    brokenRight.castShadow = true;
    brokenRight.receiveShadow = true;
    scene.add(brokenRight);
  }

  function buildMottePlatform() {
    var geometry = new THREE.BoxGeometry(16, 4, 16);
    var material = new THREE.MeshLambertMaterial({ color: 0x8B6F47 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(baseX, 2, baseZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  function buildBarrackWalls() {
    var wallPositions = [
      { x: baseX - 10, z: baseZ },
      { x: baseX + 10, z: baseZ },
      { x: baseX, z: baseZ - 10 },
      { x: baseX, z: baseZ + 10 }
    ];

    var i;
    for (i = 0; i < wallPositions.length; i++) {
      var pos = wallPositions[i];
      var wallGeometry = new THREE.BoxGeometry(4, 5, 1);
      var wallMaterial = new THREE.MeshLambertMaterial({ color: 0xC19A6B });
      var wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(pos.x, 2.5, pos.z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
    }
  }

  function buildPrefabHQ() {
    var geometry = new THREE.BoxGeometry(6, 4, 3);
    var material = new THREE.MeshLambertMaterial({ color: 0x556B2F });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(baseX + 2, 2, baseZ - 3);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    var roofGeometry = new THREE.BoxGeometry(6.2, 0.3, 3.2);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F2F });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(baseX + 2, 4.2, baseZ - 3);
    roof.castShadow = true;
    roof.receiveShadow = true;
    scene.add(roof);
  }

  function buildSignalTower() {
    var mastGeometry = new THREE.CylinderGeometry(0.4, 0.4, 14, 8);
    var mastMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(baseX + 8, 7, baseZ + 6);
    mast.castShadow = true;
    mast.receiveShadow = true;
    scene.add(mast);

    var dish1Geometry = new THREE.SphereGeometry(0.8, 8, 8);
    var dish1Material = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
    var dish1 = new THREE.Mesh(dish1Geometry, dish1Material);
    dish1.position.set(baseX + 8, 10, baseZ + 6);
    dish1.castShadow = true;
    dish1.receiveShadow = true;
    scene.add(dish1);

    var dish2Geometry = new THREE.SphereGeometry(0.6, 8, 8);
    var dish2Material = new THREE.MeshLambertMaterial({ color: 0xFFA500 });
    var dish2 = new THREE.Mesh(dish2Geometry, dish2Material);
    dish2.position.set(baseX + 8, 6, baseZ + 6);
    dish2.castShadow = true;
    dish2.receiveShadow = true;
    scene.add(dish2);
  }

  function buildSpeyBerm() {
    var geometry = new THREE.BoxGeometry(32, 2, 3);
    var material = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(baseX - 5, 1, baseZ + 12);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  function buildAmmoCasemates() {
    var casematePositions = [
      { x: baseX - 8, z: baseZ - 8 },
      { x: baseX, z: baseZ - 10 },
      { x: baseX + 8, z: baseZ - 8 }
    ];

    var j;
    for (j = 0; j < casematePositions.length; j++) {
      var pos = casematePositions[j];

      var bunkerGeometry = new THREE.BoxGeometry(4, 2, 4);
      var bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0x556B2F });
      var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
      bunker.position.set(pos.x, 1, pos.z);
      bunker.castShadow = true;
      bunker.receiveShadow = true;
      scene.add(bunker);

      var earthGeometry = new THREE.BoxGeometry(4.5, 1.5, 4.5);
      var earthMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
      var earth = new THREE.Mesh(earthGeometry, earthMaterial);
      earth.position.set(pos.x, 2, pos.z);
      earth.castShadow = true;
      earth.receiveShadow = true;
      scene.add(earth);
    }
  }

  function buildMemorialMarker() {
    var postGeometry = new THREE.CylinderGeometry(0.25, 0.3, 6, 6);
    var postMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    var post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(baseX - 12, 3, baseZ + 8);
    post.castShadow = true;
    post.receiveShadow = true;
    scene.add(post);

    var capGeometry = new THREE.ConeGeometry(0.5, 1.2, 6);
    var capMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
    var cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.set(baseX - 12, 6.6, baseZ + 8);
    cap.castShadow = true;
    cap.receiveShadow = true;
    scene.add(cap);
  }

  return {
    init: init
  };
}());
