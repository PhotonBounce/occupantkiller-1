window.TarbertHarrisPost = (function() {
  'use strict';

  var scene = null;
  var baseX = 1520;
  var baseZ = 2050;

  function init(inputScene) {
    scene = inputScene;
    build();
  }

  function build() {
    buildFerryPier();
    buildTweedMill();
    buildNorthHarrisMountains();
    buildIstmusCheckpoint();
    buildVillageHarbour();
    buildWeavingShed();
    buildCoastguardStation();
    buildBeachObstacles();
  }

  function buildFerryPier() {
    var material = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

    var pierGeometry = new THREE.BoxGeometry(18, 1, 4);
    var pierMesh = new THREE.Mesh(pierGeometry, material);
    pierMesh.position.set(baseX, 0.5, baseZ);
    scene.add(pierMesh);

    var postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
    var postMaterial = new THREE.MeshLambertMaterial({ color: 0x556B2F });

    var postPositions = [
      [-8, 1.5, -1],
      [-4, 1.5, -1],
      [0, 1.5, -1],
      [4, 1.5, -1],
      [8, 1.5, -1],
      [-8, 1.5, 1],
      [4, 1.5, 1],
      [8, 1.5, 1]
    ];

    var i = 0;
    while (i < postPositions.length) {
      var pos = postPositions[i];
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(baseX + pos[0], pos[1], baseZ + pos[2]);
      scene.add(post);
      i = i + 1;
    }

    var terminalGeometry = new THREE.BoxGeometry(6, 4, 3);
    var terminalMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
    var terminal = new THREE.Mesh(terminalGeometry, terminalMaterial);
    terminal.position.set(baseX - 10, 2, baseZ + 4);
    scene.add(terminal);
  }

  function buildTweedMill() {
    var geometry = new THREE.BoxGeometry(10, 5, 5);
    var material = new THREE.MeshLambertMaterial({ color: 0x887766 });
    var mill = new THREE.Mesh(geometry, material);
    mill.position.set(baseX - 25, 2.5, baseZ - 15);
    scene.add(mill);

    var roofGeometry = new THREE.BoxGeometry(11, 1, 6);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(baseX - 25, 5.5, baseZ - 15);
    scene.add(roof);
  }

  function buildNorthHarrisMountains() {
    var material = new THREE.MeshLambertMaterial({ color: 0x887766 });

    var peak1Geometry = new THREE.BoxGeometry(8, 12, 6);
    var peak1 = new THREE.Mesh(peak1Geometry, material);
    peak1.position.set(baseX + 15, 6, baseZ - 30);
    scene.add(peak1);

    var peak2Geometry = new THREE.BoxGeometry(7, 14, 5);
    var peak2 = new THREE.Mesh(peak2Geometry, material);
    peak2.position.set(baseX + 30, 7, baseZ - 28);
    scene.add(peak2);

    var peak3Geometry = new THREE.BoxGeometry(9, 11, 7);
    var peak3 = new THREE.Mesh(peak3Geometry, material);
    peak3.position.set(baseX + 5, 5.5, baseZ - 35);
    scene.add(peak3);

    var peak4Geometry = new THREE.BoxGeometry(6, 13, 4);
    var peak4 = new THREE.Mesh(peak4Geometry, material);
    peak4.position.set(baseX + 40, 6.5, baseZ - 25);
    scene.add(peak4);
  }

  function buildIstmusCheckpoint() {
    var barrierGeometry = new THREE.BoxGeometry(20, 2, 0.5);
    var barrierMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    var barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    barrier.position.set(baseX, 1, baseZ + 12);
    scene.add(barrier);

    var gateGeometry = new THREE.BoxGeometry(4, 3, 0.3);
    var gateMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var gate = new THREE.Mesh(gateGeometry, gateMaterial);
    gate.position.set(baseX, 1.5, baseZ + 13);
    scene.add(gate);

    var postGeometry = new THREE.CylinderGeometry(0.4, 0.4, 3, 8);
    var postMaterial = new THREE.MeshLambertMaterial({ color: 0x556B2F });

    var leftPost = new THREE.Mesh(postGeometry, postMaterial);
    leftPost.position.set(baseX - 12, 1.5, baseZ + 12);
    scene.add(leftPost);

    var rightPost = new THREE.Mesh(postGeometry, postMaterial);
    rightPost.position.set(baseX + 12, 1.5, baseZ + 12);
    scene.add(rightPost);
  }

  function buildVillageHarbour() {
    var quayGeometry = new THREE.BoxGeometry(12, 1, 3);
    var quayMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
    var quay = new THREE.Mesh(quayGeometry, quayMaterial);
    quay.position.set(baseX + 18, 0.5, baseZ - 8);
    scene.add(quay);

    var boat1Geometry = new THREE.BoxGeometry(4, 2, 1.5);
    var boatMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    var boat1 = new THREE.Mesh(boat1Geometry, boatMaterial);
    boat1.position.set(baseX + 20, 1.5, baseZ - 6);
    scene.add(boat1);

    var boat2Geometry = new THREE.BoxGeometry(4, 2, 1.5);
    var boat2 = new THREE.Mesh(boat2Geometry, boatMaterial);
    boat2.position.set(baseX + 25, 1.5, baseZ - 4);
    scene.add(boat2);

    var cabinGeometry = new THREE.BoxGeometry(2, 1.5, 1);
    var cabinMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });

    var cabin1 = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin1.position.set(baseX + 20, 2.5, baseZ - 6);
    scene.add(cabin1);

    var cabin2 = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin2.position.set(baseX + 25, 2.5, baseZ - 4);
    scene.add(cabin2);
  }

  function buildWeavingShed() {
    var shedGeometry = new THREE.BoxGeometry(12, 4, 4);
    var shedMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    var shed = new THREE.Mesh(shedGeometry, shedMaterial);
    shed.position.set(baseX - 20, 2, baseZ + 8);
    scene.add(shed);

    var roofGeometry = new THREE.BoxGeometry(13, 1, 5);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(baseX - 20, 4.5, baseZ + 8);
    scene.add(roof);

    var loomGeometry = new THREE.BoxGeometry(2, 3, 1);
    var loomMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });

    var loom1 = new THREE.Mesh(loomGeometry, loomMaterial);
    loom1.position.set(baseX - 25, 1.5, baseZ + 7);
    scene.add(loom1);

    var loom2 = new THREE.Mesh(loomGeometry, loomMaterial);
    loom2.position.set(baseX - 15, 1.5, baseZ + 7);
    scene.add(loom2);

    var spinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
    var spinMaterial = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });

    var spin1 = new THREE.Mesh(spinGeometry, spinMaterial);
    spin1.position.set(baseX - 20, 1, baseZ + 9);
    scene.add(spin1);

    var spin2 = new THREE.Mesh(spinGeometry, spinMaterial);
    spin2.position.set(baseX - 18, 1, baseZ + 9);
    scene.add(spin2);
  }

  function buildCoastguardStation() {
    var buildingGeometry = new THREE.BoxGeometry(4, 4, 4);
    var buildingMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(baseX + 35, 2, baseZ + 10);
    scene.add(building);

    var roofGeometry = new THREE.BoxGeometry(5, 1, 5);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(baseX + 35, 4.5, baseZ + 10);
    scene.add(roof);

    var mastGeometry = new THREE.CylinderGeometry(0.15, 0.15, 8, 8);
    var mastMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(baseX + 35, 4.5, baseZ + 10);
    scene.add(mast);

    var dishGeometry = new THREE.SphereGeometry(0.8, 8, 8);
    var dishMaterial = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
    var dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.position.set(baseX + 35, 8, baseZ + 10);
    scene.add(dish);

    var doorGeometry = new THREE.BoxGeometry(1, 2, 0.2);
    var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x0000FF });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(baseX + 37, 1, baseZ + 12);
    scene.add(door);
  }

  function buildBeachObstacles() {
    var metalMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });

    var obstacle1Geometry = new THREE.BoxGeometry(2, 1.5, 2);
    var obstacle1 = new THREE.Mesh(obstacle1Geometry, metalMaterial);
    obstacle1.position.set(baseX - 15, 0.75, baseZ + 20);
    scene.add(obstacle1);

    var obstacle2Geometry = new THREE.BoxGeometry(2, 1.5, 2);
    var obstacle2 = new THREE.Mesh(obstacle2Geometry, metalMaterial);
    obstacle2.position.set(baseX - 5, 0.75, baseZ + 22);
    scene.add(obstacle2);

    var obstacle3Geometry = new THREE.BoxGeometry(2, 1.5, 2);
    var obstacle3 = new THREE.Mesh(obstacle3Geometry, metalMaterial);
    obstacle3.position.set(baseX + 5, 0.75, baseZ + 20);
    scene.add(obstacle3);

    var obstacle4Geometry = new THREE.BoxGeometry(2, 1.5, 2);
    var obstacle4 = new THREE.Mesh(obstacle4Geometry, metalMaterial);
    obstacle4.position.set(baseX + 15, 0.75, baseZ + 22);
    scene.add(obstacle4);

    var obstacle5Geometry = new THREE.BoxGeometry(2, 1.5, 2);
    var obstacle5 = new THREE.Mesh(obstacle5Geometry, metalMaterial);
    obstacle5.position.set(baseX, 0.75, baseZ + 24);
    scene.add(obstacle5);
  }

  return {
    init: init
  };
}());
