var CromartyDock = (function() {
  'use strict';

  var baseX = 800;
  var baseZ = 970;

  function buildOilRigJacket(scene) {
    var legRadius = 1.5;
    var legHeight = 45;
    var legPositions = [
      [-15, 0, -15],
      [15, 0, -15],
      [15, 0, 15],
      [-15, 0, 15]
    ];

    var legGeometry = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 8);
    var legMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

    var i;
    for (i = 0; i < legPositions.length; i++) {
      var leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(baseX + legPositions[i][0], 22.5 + baseZ, baseZ + legPositions[i][2]);
      leg.castShadow = true;
      leg.receiveShadow = true;
      scene.add(leg);
    }

    var deckGeometry = new THREE.BoxGeometry(40, 4, 40);
    var deckMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.set(baseX, 45 + baseZ, baseZ);
    deck.castShadow = true;
    deck.receiveShadow = true;
    scene.add(deck);
  }

  function buildConstructionCrane(scene) {
    var postGeometry = new THREE.CylinderGeometry(2, 2, 50, 8);
    var postMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    var post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(baseX - 120, 25 + baseZ, baseZ);
    post.castShadow = true;
    post.receiveShadow = true;
    scene.add(post);

    var boomHorizontal = new THREE.BoxGeometry(60, 3, 3);
    var boomMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
    var boom = new THREE.Mesh(boomHorizontal, boomMaterial);
    boom.position.set(baseX - 90, 48 + baseZ, baseZ);
    boom.castShadow = true;
    boom.receiveShadow = true;
    scene.add(boom);

    var boomVertical = new THREE.BoxGeometry(3, 20, 3);
    var boomV = new THREE.Mesh(boomVertical, boomMaterial);
    boomV.position.set(baseX - 60, 38 + baseZ, baseZ);
    boomV.castShadow = true;
    boomV.receiveShadow = true;
    scene.add(boomV);
  }

  function buildNavalPier(scene) {
    var pierGeometry = new THREE.BoxGeometry(30, 3, 8);
    var pierMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    var pier = new THREE.Mesh(pierGeometry, pierMaterial);
    pier.position.set(baseX + 60, 1.5 + baseZ, baseZ - 25);
    pier.castShadow = true;
    pier.receiveShadow = true;
    scene.add(pier);

    var cleatGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 6);
    var cleatMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var cleatX;
    var cleatZ;
    var j;

    for (j = -12; j <= 12; j += 6) {
      cleatX = baseX + 40 + j;
      cleatZ = baseZ - 20;
      var cleat = new THREE.Mesh(cleatGeometry, cleatMaterial);
      cleat.position.set(cleatX, 3.5 + baseZ, cleatZ);
      cleat.castShadow = true;
      cleat.receiveShadow = true;
      scene.add(cleat);

      cleatZ = baseZ - 30;
      var cleat2 = new THREE.Mesh(cleatGeometry, cleatMaterial);
      cleat2.position.set(cleatX, 3.5 + baseZ, cleatZ);
      cleat2.castShadow = true;
      cleat2.receiveShadow = true;
      scene.add(cleat2);
    }
  }

  function buildLighthouse(scene) {
    var towerGeometry = new THREE.CylinderGeometry(4, 4, 40, 16);
    var towerMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(baseX - 80, 20 + baseZ, baseZ + 60);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);

    var roofGeometry = new THREE.ConeGeometry(5, 12, 16);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0xCC0000 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(baseX - 80, 46 + baseZ, baseZ + 60);
    roof.castShadow = true;
    roof.receiveShadow = true;
    scene.add(roof);

    var lanternGeometry = new THREE.SphereGeometry(2, 8, 8);
    var lanternMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
    var lantern = new THREE.Mesh(lanternGeometry, lanternMaterial);
    lantern.position.set(baseX - 80, 50 + baseZ, baseZ + 60);
    lantern.castShadow = true;
    lantern.receiveShadow = true;
    scene.add(lantern);
  }

  function buildCottage(scene) {
    var cottageGeometry = new THREE.BoxGeometry(4, 3, 3);
    var cottageMaterial = new THREE.MeshLambertMaterial({ color: 0xCC9966 });
    var cottage = new THREE.Mesh(cottageGeometry, cottageMaterial);
    cottage.position.set(baseX + 40, 1.5 + baseZ, baseZ + 40);
    cottage.castShadow = true;
    cottage.receiveShadow = true;
    scene.add(cottage);

    var roofGeometry = new THREE.ConeGeometry(2.5, 2, 4);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(baseX + 40, 3 + baseZ, baseZ + 40);
    roof.castShadow = true;
    roof.receiveShadow = true;
    scene.add(roof);
  }

  function buildGeorgianTerrace(scene) {
    var houseWidth = 3.5;
    var houseHeight = 4;
    var houseDepth = 3;
    var spacing = 0.5;
    var startX = baseX - 50;

    var houseGeometry = new THREE.BoxGeometry(houseWidth, houseHeight, houseDepth);
    var houseMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });

    var k;
    for (k = 0; k < 4; k++) {
      var house = new THREE.Mesh(houseGeometry, houseMaterial);
      house.position.set(startX + k * (houseWidth + spacing), 2 + baseZ, baseZ - 50);
      house.castShadow = true;
      house.receiveShadow = true;
      scene.add(house);

      var roofGeo = new THREE.ConeGeometry(houseWidth / 2 + 0.3, 1.5, 4);
      var roofMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(startX + k * (houseWidth + spacing), 4 + baseZ, baseZ - 50);
      roof.castShadow = true;
      roof.receiveShadow = true;
      scene.add(roof);
    }
  }

  function buildSubmarineNetBoom(scene) {
    var floatRadius = 1.2;
    var floatGeometry = new THREE.CylinderGeometry(floatRadius, floatRadius, floatRadius, 8);
    var floatMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });

    var netStartX = baseX - 200;
    var netEndX = baseX + 200;
    var netY = 3;
    var netZ = baseZ + 120;

    var m;
    for (m = 0; m <= 10; m++) {
      var floatX = netStartX + (netEndX - netStartX) * (m / 10);
      var float = new THREE.Mesh(floatGeometry, floatMaterial);
      float.position.set(floatX, netY + baseZ, netZ);
      float.castShadow = true;
      float.receiveShadow = true;
      scene.add(float);
    }

    var lineMaterial = new THREE.LineBasicMaterial({ color: 0x666666 });
    var points = [
      new THREE.Vector3(netStartX, netY + baseZ, netZ),
      new THREE.Vector3(netEndX, netY + baseZ, netZ)
    ];
    var lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    var line = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(line);

    var vertPointStart = new THREE.Vector3(netStartX, (netY + 5) + baseZ, netZ);
    var vertPointEnd = new THREE.Vector3(netStartX, (netY - 10) + baseZ, netZ);
    var vertPoints = [vertPointStart, vertPointEnd];
    var vertLineGeo = new THREE.BufferGeometry().setFromPoints(vertPoints);
    var vertLine = new THREE.LineSegments(vertLineGeo, lineMaterial);
    scene.add(vertLine);

    var vertPointStart2 = new THREE.Vector3(netEndX, (netY + 5) + baseZ, netZ);
    var vertPointEnd2 = new THREE.Vector3(netEndX, (netY - 10) + baseZ, netZ);
    var vertPoints2 = [vertPointStart2, vertPointEnd2];
    var vertLineGeo2 = new THREE.BufferGeometry().setFromPoints(vertPoints2);
    var vertLine2 = new THREE.LineSegments(vertLineGeo2, lineMaterial);
    scene.add(vertLine2);
  }

  function buildPatrolBoatDock(scene) {
    var hullGeometry = new THREE.BoxGeometry(12, 2, 3);
    var hullMaterial = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.set(baseX + 100, 1 + baseZ, baseZ + 80);
    hull.castShadow = true;
    hull.receiveShadow = true;
    scene.add(hull);

    var superstructureGeometry = new THREE.BoxGeometry(4, 2.5, 2);
    var superstructureMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var superstructure = new THREE.Mesh(superstructureGeometry, superstructureMaterial);
    superstructure.position.set(baseX + 95, 2.5 + baseZ, baseZ + 80);
    superstructure.castShadow = true;
    superstructure.receiveShadow = true;
    scene.add(superstructure);

    var gunMountGeometry = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
    var gunMountMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var gunMount = new THREE.Mesh(gunMountGeometry, gunMountMaterial);
    gunMount.position.set(baseX + 100, 4 + baseZ, baseZ + 80);
    gunMount.castShadow = true;
    gunMount.receiveShadow = true;
    scene.add(gunMount);

    var gunBarrelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 5, 6);
    var gunBarrelMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var gunBarrel = new THREE.Mesh(gunBarrelGeometry, gunBarrelMaterial);
    gunBarrel.position.set(baseX + 100, 8 + baseZ, baseZ + 80);
    gunBarrel.rotation.z = Math.PI / 6;
    gunBarrel.castShadow = true;
    gunBarrel.receiveShadow = true;
    scene.add(gunBarrel);
  }

  function build(scene) {
    buildOilRigJacket(scene);
    buildConstructionCrane(scene);
    buildNavalPier(scene);
    buildLighthouse(scene);
    buildCottage(scene);
    buildGeorgianTerrace(scene);
    buildSubmarineNetBoom(scene);
    buildPatrolBoatDock(scene);
  }

  var exports = {
    build: build,
    baseX: baseX,
    baseZ: baseZ
  };

  return exports;
}());
