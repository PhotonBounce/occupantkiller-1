var ThursoCamp = (function() {
  'use strict';

  var camera, scene, renderer;
  var worldX = 960;
  var worldZ = 1210;

  function init(sceneRef, cameraRef, rendererRef) {
    scene = sceneRef;
    camera = cameraRef;
    renderer = rendererRef;

    build();
  }

  function build() {
    dounreaySphere();
    nuclearFence();
    decommissioningCrane();
    ferryTerminal();
    scrabsterHarbour();
    antiAircraftBattery();
    checkpointGate();
    emergencyBunker();
  }

  function dounreaySphere() {
    var plinthGeo = new THREE.CylinderGeometry(12, 12, 2, 32);
    var plinthMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
    var plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.set(worldX, 1, worldZ);
    scene.add(plinth);

    var domeGeo = new THREE.SphereGeometry(8, 32, 32);
    var domeMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
    var dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(worldX, 10, worldZ);
    scene.add(dome);
  }

  function nuclearFence() {
    var points = [
      new THREE.Vector3(worldX - 25, 0, worldZ - 25),
      new THREE.Vector3(worldX + 25, 0, worldZ - 25),
      new THREE.Vector3(worldX + 25, 0, worldZ + 25),
      new THREE.Vector3(worldX - 25, 0, worldZ + 25),
      new THREE.Vector3(worldX - 25, 0, worldZ - 25)
    ];

    for (var i = 0; i < points.length - 1; i++) {
      var geometry = new THREE.BufferGeometry().setFromPoints([points[i], points[i + 1]]);
      var material = new THREE.LineBasicMaterial({ color: 0xFF0000 });
      var line = new THREE.LineSegments(geometry, material);
      scene.add(line);
    }

    var positions = [
      [worldX - 25, worldZ - 25],
      [worldX + 25, worldZ - 25],
      [worldX + 25, worldZ + 25],
      [worldX - 25, worldZ + 25]
    ];

    for (var j = 0; j < positions.length; j++) {
      var postGeo = new THREE.BoxGeometry(1, 3, 1);
      var postMat = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
      var post = new THREE.Mesh(postGeo, postMat);
      post.position.set(positions[j][0], 1.5, positions[j][1]);
      scene.add(post);
    }
  }

  function decommissioningCrane() {
    var baseGeo = new THREE.CylinderGeometry(2, 3, 1, 16);
    var baseMat = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
    var base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(worldX + 30, 0.5, worldZ - 30);
    scene.add(base);

    var mast = new THREE.CylinderGeometry(0.5, 0.5, 20, 16);
    var mast3d = new THREE.Mesh(mast, baseMat);
    mast3d.position.set(worldX + 30, 10, worldZ - 30);
    scene.add(mast3d);

    var boomGeo = new THREE.BoxGeometry(20, 1, 1);
    var boom = new THREE.Mesh(boomGeo, baseMat);
    boom.position.set(worldX + 40, 18, worldZ - 30);
    scene.add(boom);

    var hookGeo = new THREE.CylinderGeometry(0.8, 0.8, 3, 16);
    var hook = new THREE.Mesh(hookGeo, baseMat);
    hook.position.set(worldX + 50, 15, worldZ - 30);
    scene.add(hook);
  }

  function ferryTerminal() {
    var buildingGeo = new THREE.BoxGeometry(8, 4, 4);
    var buildingMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
    var building = new THREE.Mesh(buildingGeo, buildingMat);
    building.position.set(worldX - 40, 2, worldZ + 40);
    scene.add(building);

    var roofGeo = new THREE.BoxGeometry(9, 0.5, 4.5);
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(worldX - 40, 4.25, worldZ + 40);
    scene.add(roof);
  }

  function scrabsterHarbour() {
    var pierGeo = new THREE.BoxGeometry(30, 1, 4);
    var pierMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
    var pier = new THREE.Mesh(pierGeo, pierMat);
    pier.position.set(worldX + 50, 0.5, worldZ + 50);
    scene.add(pier);

    var bollardPositions = [
      [worldX + 30, worldZ + 48],
      [worldX + 40, worldZ + 48],
      [worldX + 50, worldZ + 48],
      [worldX + 60, worldZ + 48],
      [worldX + 70, worldZ + 48]
    ];

    for (var k = 0; k < bollardPositions.length; k++) {
      var bollardGeo = new THREE.CylinderGeometry(0.6, 0.8, 1.5, 16);
      var bollardMat = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
      var bollard = new THREE.Mesh(bollardGeo, bollardMat);
      bollard.position.set(bollardPositions[k][0], 0.75, bollardPositions[k][1]);
      scene.add(bollard);
    }
  }

  function antiAircraftBattery() {
    var platformGeo = new THREE.BoxGeometry(8, 0.5, 8);
    var platformMat = new THREE.MeshLambertMaterial({ color: 0x505050 });
    var platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.set(worldX - 50, 0.25, worldZ - 50);
    scene.add(platform);

    var gunPositions = [
      [worldX - 53, worldZ - 53],
      [worldX - 47, worldZ - 53],
      [worldX - 53, worldZ - 47],
      [worldX - 47, worldZ - 47]
    ];

    for (var m = 0; m < gunPositions.length; m++) {
      var gunBaseGeo = new THREE.CylinderGeometry(1.2, 1.5, 1, 16);
      var gunMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var gunBase = new THREE.Mesh(gunBaseGeo, gunMat);
      gunBase.position.set(gunPositions[m][0], 0.5, gunPositions[m][1]);
      scene.add(gunBase);

      var barrelGeo = new THREE.CylinderGeometry(0.4, 0.4, 8, 16);
      var barrelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      var barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.rotation.z = -0.3;
      barrel.position.set(gunPositions[m][0], 2, gunPositions[m][1] - 3);
      scene.add(barrel);
    }
  }

  function checkpointGate() {
    var gateGeo = new THREE.BoxGeometry(0.5, 3, 8);
    var gateMat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    var gate = new THREE.Mesh(gateGeo, gateMat);
    gate.position.set(worldX, 1.5, worldZ - 60);
    scene.add(gate);

    var boothGeo = new THREE.BoxGeometry(3, 3, 2.5);
    var boothMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
    var booth = new THREE.Mesh(boothGeo, boothMat);
    booth.position.set(worldX + 5, 1.5, worldZ - 60);
    scene.add(booth);

    var roofGeo2 = new THREE.BoxGeometry(3.5, 0.3, 3);
    var roofMat2 = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var roof2 = new THREE.Mesh(roofGeo2, roofMat2);
    roof2.position.set(worldX + 5, 3.15, worldZ - 60);
    scene.add(roof2);
  }

  function emergencyBunker() {
    var bunkerGeo = new THREE.BoxGeometry(6, 3, 8);
    var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x505050 });
    var bunker = new THREE.Mesh(bunkerGeo, bunkerMat);
    bunker.position.set(worldX + 60, 1.5, worldZ - 60);
    scene.add(bunker);

    var warningPositions = [
      [worldX + 57, worldZ - 64],
      [worldX + 63, worldZ - 64],
      [worldX + 57, worldZ - 56],
      [worldX + 63, worldZ - 56]
    ];

    for (var n = 0; n < warningPositions.length; n++) {
      var triangleGeo = new THREE.ConeGeometry(0.8, 1.5, 3);
      var triangleMat = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
      var triangle = new THREE.Mesh(triangleGeo, triangleMat);
      triangle.position.set(warningPositions[n][0], 0.75, warningPositions[n][1]);
      scene.add(triangle);
    }

    var doorGeo = new THREE.BoxGeometry(1.5, 2, 0.2);
    var doorMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(worldX + 60, 1, worldZ - 56.9);
    scene.add(door);
  }

  function update() {
  }

  function render() {
    renderer.render(scene, camera);
  }

  return {
    init: init,
    update: update,
    render: render
  };
}());
