window.LevenBase = (function() {
  'use strict';

  var scene = null;
  var objects = [];
  var lights = [];

  var LevenBase = function(inputScene) {
    scene = inputScene;
    objects = [];
    lights = [];
    buildEnvironment();
  };

  var buildEnvironment = function() {
    // Leven promenade seawall - 40x3x2, grey stone 0x888877 with gun positions
    var seawallGeom = new THREE.BoxGeometry(40, 3, 2);
    var seawallMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var seawall = new THREE.Mesh(seawallGeom, seawallMat);
    seawall.position.set(0, 1.5, -25);
    seawall.castShadow = true;
    seawall.receiveShadow = true;
    scene.add(seawall);
    objects.push(seawall);

    // Gun position turrets on seawall (4 positions)
    var gunTurretGeom = new THREE.CylinderGeometry(1.2, 1.5, 2, 8);
    var gunTurretMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var gunPos1 = new THREE.Mesh(gunTurretGeom, gunTurretMat);
    gunPos1.position.set(-15, 3.5, -25);
    gunPos1.castShadow = true;
    scene.add(gunPos1);
    objects.push(gunPos1);

    var gunPos2 = new THREE.Mesh(gunTurretGeom, gunTurretMat);
    gunPos2.position.set(-5, 3.5, -25);
    gunPos2.castShadow = true;
    scene.add(gunPos2);
    objects.push(gunPos2);

    var gunPos3 = new THREE.Mesh(gunTurretGeom, gunTurretMat);
    gunPos3.position.set(5, 3.5, -25);
    gunPos3.castShadow = true;
    scene.add(gunPos3);
    objects.push(gunPos3);

    var gunPos4 = new THREE.Mesh(gunTurretGeom, gunTurretMat);
    gunPos4.position.set(15, 3.5, -25);
    gunPos4.castShadow = true;
    scene.add(gunPos4);
    objects.push(gunPos4);

    // Former caravan park now military camp - grid of 8x box shelters 5x3x4, military green 0x4a5240
    var shelterGeom = new THREE.BoxGeometry(5, 3, 4);
    var shelterMat = new THREE.MeshLambertMaterial({ color: 0x4a5240 });

    var shelterPositions = [
      [-12, 1.5, 5],
      [-4, 1.5, 5],
      [4, 1.5, 5],
      [12, 1.5, 5],
      [-12, 1.5, 15],
      [-4, 1.5, 15],
      [4, 1.5, 15],
      [12, 1.5, 15]
    ];

    var i;
    for (i = 0; i < shelterPositions.length; i++) {
      var shelter = new THREE.Mesh(shelterGeom, shelterMat);
      shelter.position.set(shelterPositions[i][0], shelterPositions[i][1], shelterPositions[i][2]);
      shelter.castShadow = true;
      shelter.receiveShadow = true;
      scene.add(shelter);
      objects.push(shelter);
    }

    // Silversands beach landing zone - 30x0.3x16, pale sand 0xDDCC99
    var beachGeom = new THREE.BoxGeometry(30, 0.3, 16);
    var beachMat = new THREE.MeshLambertMaterial({ color: 0xDDCC99 });
    var beach = new THREE.Mesh(beachGeom, beachMat);
    beach.position.set(0, 0.15, -5);
    beach.receiveShadow = true;
    scene.add(beach);
    objects.push(beach);

    // Seafront amusement arcade fortified - 14x5x10, tacky 1970s 0x998877 now bunker
    var arcadeGeom = new THREE.BoxGeometry(14, 5, 10);
    var arcadeMat = new THREE.MeshLambertMaterial({ color: 0x998877 });
    var arcade = new THREE.Mesh(arcadeGeom, arcadeMat);
    arcade.position.set(-18, 2.5, -18);
    arcade.castShadow = true;
    arcade.receiveShadow = true;
    scene.add(arcade);
    objects.push(arcade);

    // River Leven outlet - 8x0.3x30 channel box, dark water 0x334455, flowing north
    var riverGeom = new THREE.BoxGeometry(8, 0.3, 30);
    var riverMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var river = new THREE.Mesh(riverGeom, riverMat);
    river.position.set(25, 0.15, 10);
    river.receiveShadow = true;
    scene.add(river);
    objects.push(river);

    // Tidal surge barrier - 3 box gates 4x4x1, grey 0x888888 spanning river
    var gateGeom = new THREE.BoxGeometry(4, 4, 1);
    var gateMat = new THREE.MeshLambertMaterial({ color: 0x888888 });

    var gate1 = new THREE.Mesh(gateGeom, gateMat);
    gate1.position.set(19, 2, 10);
    gate1.castShadow = true;
    scene.add(gate1);
    objects.push(gate1);

    var gate2 = new THREE.Mesh(gateGeom, gateMat);
    gate2.position.set(25, 2, 10);
    gate2.castShadow = true;
    scene.add(gate2);
    objects.push(gate2);

    var gate3 = new THREE.Mesh(gateGeom, gateMat);
    gate3.position.set(31, 2, 10);
    gate3.castShadow = true;
    scene.add(gate3);
    objects.push(gate3);

    // Radar tower on dune - thin cylinder 0.5 radius height 14, dark 0x333333
    var radarGeom = new THREE.CylinderGeometry(0.5, 0.5, 14, 8);
    var radarMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var radar = new THREE.Mesh(radarGeom, radarMat);
    radar.position.set(-30, 7, -2);
    radar.castShadow = true;
    radar.receiveShadow = true;
    radar.radarMesh = true;
    scene.add(radar);
    objects.push(radar);

    // Radar scanner dish on top
    var scannerGeom = new THREE.ConeGeometry(2, 1.5, 16);
    var scannerMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var scanner = new THREE.Mesh(scannerGeom, scannerMat);
    scanner.position.set(-30, 14, -2);
    scanner.castShadow = true;
    scanner.radarScanner = true;
    scene.add(scanner);
    objects.push(scanner);

    // Beach access road checkpoint - concrete blockers
    var blockerGeom = new THREE.BoxGeometry(1.5, 1.2, 2);
    var blockerMat = new THREE.MeshLambertMaterial({ color: 0x888888 });

    var blocker1 = new THREE.Mesh(blockerGeom, blockerMat);
    blocker1.position.set(-5, 0.6, -10);
    blocker1.castShadow = true;
    scene.add(blocker1);
    objects.push(blocker1);

    var blocker2 = new THREE.Mesh(blockerGeom, blockerMat);
    blocker2.position.set(5, 0.6, -10);
    blocker2.castShadow = true;
    scene.add(blocker2);
    objects.push(blocker2);

    // Checkpoint arm
    var armGeom = new THREE.BoxGeometry(0.4, 0.3, 12);
    var armMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var arm = new THREE.Mesh(armGeom, armMat);
    arm.position.set(0, 1.2, -10);
    arm.castShadow = true;
    scene.add(arm);
    objects.push(arm);

    // Industrial Methil dock view - distant box silhouette 16x8x10, grey 0x667788
    var dockGeom = new THREE.BoxGeometry(16, 8, 10);
    var dockMat = new THREE.MeshLambertMaterial({ color: 0x667788 });
    var dock = new THREE.Mesh(dockGeom, dockMat);
    dock.position.set(40, 4, 8);
    dock.castShadow = true;
    dock.receiveShadow = true;
    scene.add(dock);
    objects.push(dock);

    // Seaside haze ambient light (0x99AABB, intensity 0.6)
    var ambientLight = new THREE.AmbientLight(0x99AABB, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    // Promenade lampposts (warm 0xFFEE88, intensity 0.8)
    var lampGeom = new THREE.CylinderGeometry(0.3, 0.4, 8, 6);
    var lampMat = new THREE.MeshLambertMaterial({ color: 0x444444 });

    var lampPositions = [
      [-20, 4, -25],
      [-10, 4, -25],
      [0, 4, -25],
      [10, 4, -25],
      [20, 4, -25]
    ];

    var j;
    for (j = 0; j < lampPositions.length; j++) {
      var lampPost = new THREE.Mesh(lampGeom, lampMat);
      lampPost.position.set(lampPositions[j][0], lampPositions[j][1], lampPositions[j][2]);
      lampPost.castShadow = true;
      scene.add(lampPost);
      objects.push(lampPost);

      var lampLight = new THREE.PointLight(0xFFEE88, 0.8, 20);
      lampLight.position.set(lampPositions[j][0], lampPositions[j][1] + 4, lampPositions[j][2]);
      lampLight.castShadow = true;
      scene.add(lampLight);
      lights.push(lampLight);
    }
  };

  var update = function(delta) {
    // Rotate radar tower scanner
    var k;
    for (k = 0; k < objects.length; k++) {
      if (objects[k].radarScanner) {
        objects[k].rotation.y += delta * 2;
      }
    }
  };

  var reset = function() {
    var m;
    for (m = 0; m < objects.length; m++) {
      scene.remove(objects[m]);
    }
    var n;
    for (n = 0; n < lights.length; n++) {
      scene.remove(lights[n]);
    }
    objects = [];
    lights = [];
  };

  return {
    init: LevenBase,
    update: update,
    reset: reset,
    getObjects: function() {
      return objects;
    },
    getLights: function() {
      return lights;
    }
  };
}());
