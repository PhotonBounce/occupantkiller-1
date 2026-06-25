var LochboisdaleCamp = (function() {
  'use strict';

  var baseX = 1600;
  var baseZ = 2170;
  var baseY = 0;

  function init(scene) {
    buildRadarTower(scene);
    buildRocketGantry(scene);
    buildFerryPier(scene);
    buildControlBuilding(scene);
    buildCheckpoint(scene);
    buildTownship(scene);
    buildDefenseNet(scene);
    buildVesselDock(scene);
  }

  function buildRadarTower(scene) {
    var towerGeometry = new THREE.CylinderGeometry(2, 2, 18, 16);
    var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(baseX + 10, baseY + 9, baseZ + 10);
    scene.add(tower);

    var headGeometry = new THREE.BoxGeometry(4, 2, 4);
    var headMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(baseX + 10, baseY + 20, baseZ + 10);
    scene.add(head);

    var antennaGeometry = new THREE.CylinderGeometry(0.2, 0.2, 6, 8);
    var antennaMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
    var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(baseX + 10, baseY + 24, baseZ + 10);
    scene.add(antenna);
  }

  function buildRocketGantry(scene) {
    var towerGeometry = new THREE.BoxGeometry(4, 20, 4);
    var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(baseX - 20, baseY + 10, baseZ - 20);
    scene.add(tower);

    var crossbarGeometry = new THREE.BoxGeometry(12, 1, 2);
    var crossbar = new THREE.Mesh(crossbarGeometry, towerMaterial);
    crossbar.position.set(baseX - 20, baseY + 18, baseZ - 20);
    scene.add(crossbar);

    var rocketGeometry = new THREE.CylinderGeometry(0.8, 0.8, 12, 12);
    var rocketMaterial = new THREE.MeshLambertMaterial({ color: 0xff4500 });
    var rocket = new THREE.Mesh(rocketGeometry, rocketMaterial);
    rocket.position.set(baseX - 20, baseY + 6, baseZ - 20);
    scene.add(rocket);

    var coneGeometry = new THREE.ConeGeometry(0.8, 2, 12);
    var coneMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    var nose = new THREE.Mesh(coneGeometry, coneMaterial);
    nose.position.set(baseX - 20, baseY + 14, baseZ - 20);
    scene.add(nose);

    var padGeometry = new THREE.BoxGeometry(6, 0.5, 6);
    var padMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
    var pad = new THREE.Mesh(padGeometry, padMaterial);
    pad.position.set(baseX - 20, baseY + 0.25, baseZ - 20);
    scene.add(pad);
  }

  function buildFerryPier(scene) {
    var pierGeometry = new THREE.BoxGeometry(20, 2, 5);
    var pierMaterial = new THREE.MeshLambertMaterial({ color: 0x704020 });
    var pier = new THREE.Mesh(pierGeometry, pierMaterial);
    pier.position.set(baseX + 30, baseY + 1, baseZ + 30);
    scene.add(pier);

    var postGeometry = new THREE.CylinderGeometry(0.4, 0.4, 4, 8);
    var postMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });

    var positions = [
      [baseX + 15, baseY + 2, baseZ + 28],
      [baseX + 15, baseY + 2, baseZ + 32],
      [baseX + 45, baseY + 2, baseZ + 28],
      [baseX + 45, baseY + 2, baseZ + 32]
    ];

    for (var i = 0; i < positions.length; i++) {
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(positions[i][0], positions[i][1], positions[i][2]);
      scene.add(post);
    }

    var ropeGeometry = new THREE.BoxGeometry(20, 0.1, 0.1);
    var ropeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    var rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
    rope.position.set(baseX + 30, baseY + 3, baseZ + 30);
    scene.add(rope);
  }

  function buildControlBuilding(scene) {
    var buildingGeometry = new THREE.BoxGeometry(8, 4, 8);
    var buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(baseX - 35, baseY + 2, baseZ - 35);
    scene.add(building);

    var roofGeometry = new THREE.BoxGeometry(9, 0.5, 9);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(baseX - 35, baseY + 4.25, baseZ - 35);
    scene.add(roof);

    var ventGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 6);
    var ventMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });
    var vent = new THREE.Mesh(ventGeometry, ventMaterial);
    vent.position.set(baseX - 35, baseY + 5, baseZ - 35);
    scene.add(vent);
  }

  function buildCheckpoint(scene) {
    var barrierGeometry = new THREE.BoxGeometry(16, 1.5, 1);
    var barrierMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6B6B });
    var barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    barrier.position.set(baseX - 50, baseY + 0.75, baseZ);
    scene.add(barrier);

    var guardGeometry = new THREE.BoxGeometry(4, 3, 4);
    var guardMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    var guard = new THREE.Mesh(guardGeometry, guardMaterial);
    guard.position.set(baseX - 50, baseY + 1.5, baseZ - 8);
    scene.add(guard);

    var roofGeometry = new THREE.ConeGeometry(2.5, 2, 4);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(baseX - 50, baseY + 4.5, baseZ - 8);
    scene.add(roof);
  }

  function buildTownship(scene) {
    var cottages = [
      { x: baseX - 60, z: baseZ + 50 },
      { x: baseX - 55, z: baseZ + 60 },
      { x: baseX - 45, z: baseZ + 55 },
      { x: baseX - 50, z: baseZ + 45 }
    ];

    for (var i = 0; i < cottages.length; i++) {
      var cottage = cottages[i];

      var wallGeometry = new THREE.BoxGeometry(5, 3, 5);
      var wallMaterial = new THREE.MeshLambertMaterial({ color: 0xF0F0F0 });
      var wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(cottage.x, baseY + 1.5, cottage.z);
      scene.add(wall);

      var roofGeometry = new THREE.ConeGeometry(3, 2.5, 4);
      var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B6F47 });
      var roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.set(cottage.x, baseY + 4.5, cottage.z);
      scene.add(roof);

      var chimneyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 6);
      var chimneyMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
      var chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
      chimney.position.set(cottage.x + 1.5, baseY + 4, cottage.z);
      scene.add(chimney);
    }
  }

  function buildDefenseNet(scene) {
    var points = [
      new THREE.Vector3(baseX - 70, baseY + 2, baseZ + 10),
      new THREE.Vector3(baseX - 70, baseY + 6, baseZ + 10),
      new THREE.Vector3(baseX - 70, baseY + 2, baseZ + 20),
      new THREE.Vector3(baseX - 70, baseY + 6, baseZ + 20),
      new THREE.Vector3(baseX - 60, baseY + 2, baseZ + 10),
      new THREE.Vector3(baseX - 60, baseY + 6, baseZ + 10),
      new THREE.Vector3(baseX - 60, baseY + 2, baseZ + 20),
      new THREE.Vector3(baseX - 60, baseY + 6, baseZ + 20)
    ];

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points.map(p => [p.x, p.y, p.z]).flat()), 3));

    var indices = [
      0, 1, 2, 3, 4, 5, 6, 7,
      0, 2, 1, 3, 4, 6, 5, 7,
      0, 4, 2, 6, 1, 5, 3, 7
    ];
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));

    var material = new THREE.LineBasicMaterial({ color: 0x00AA00, linewidth: 1 });
    var net = new THREE.LineSegments(geometry, material);
    scene.add(net);
  }

  function buildVesselDock(scene) {
    var vesselGeometry = new THREE.BoxGeometry(8, 3, 12);
    var vesselMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a7a });
    var vessel = new THREE.Mesh(vesselGeometry, vesselMaterial);
    vessel.position.set(baseX + 60, baseY + 1.5, baseZ + 40);
    scene.add(vessel);

    var deckGeometry = new THREE.BoxGeometry(9, 0.5, 13);
    var deckMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });
    var deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.set(baseX + 60, baseY + 3, baseZ + 40);
    scene.add(deck);

    var superstructureGeometry = new THREE.BoxGeometry(4, 4, 4);
    var superstructureMaterial = new THREE.MeshLambertMaterial({ color: 0x505070 });
    var superstructure = new THREE.Mesh(superstructureGeometry, superstructureMaterial);
    superstructure.position.set(baseX + 60, baseY + 5, baseZ + 30);
    scene.add(superstructure);

    var craneBaseGeometry = new THREE.CylinderGeometry(1, 1.2, 2, 8);
    var craneBaseMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });
    var craneBase = new THREE.Mesh(craneBaseGeometry, craneBaseMaterial);
    craneBase.position.set(baseX + 70, baseY + 1, baseZ + 40);
    scene.add(craneBase);

    var craneBoomGeometry = new THREE.BoxGeometry(12, 0.4, 0.4);
    var craneBoomMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
    var craneBoom = new THREE.Mesh(craneBoomGeometry, craneBoomMaterial);
    craneBoom.position.set(baseX + 76, baseY + 6, baseZ + 40);
    scene.add(craneBoom);

    var hookGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    var hookMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
    var hook = new THREE.Mesh(hookGeometry, hookMaterial);
    hook.position.set(baseX + 82, baseY + 4, baseZ + 40);
    scene.add(hook);

    var dockGeometry = new THREE.BoxGeometry(15, 0.5, 10);
    var dockMaterial = new THREE.MeshLambertMaterial({ color: 0x704020 });
    var dock = new THREE.Mesh(dockGeometry, dockMaterial);
    dock.position.set(baseX + 65, baseY + 0.25, baseZ + 50);
    scene.add(dock);
  }

  return {
    init: init
  };
}());
