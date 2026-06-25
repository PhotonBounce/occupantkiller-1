window.JungleVillage = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var bonfireLight = null;
  var bonfireSphere = null;
  var riverBlocks = [];
  var vineSwings = [];
  var canopyParts = [];
  var time = 0;

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;

    createGround();
    createTreeCanopy();
    createVillageHuts();
    createRopeBridges();
    createCentralBonfire();
    createBambooFence();
    createWatchtower();
    createPitTraps();
    createBoatLanding();
    createJungleRiver();
    createVineSwings();
    createMedicinalGarden();
    createWoodenIdol();
  }

  function createGround() {
    var groundGeometry = new THREE.BoxGeometry(200, 2, 200);
    var groundMaterial = new THREE.MeshPhongMaterial({ color: 0x2d5016 });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -1;
    ground.receiveShadow = true;
    scene.add(ground);
  }

  function createTreeCanopy() {
    var treePositions = [
      [-50, 0, -60], [60, 0, -40], [-70, 0, 20],
      [45, 0, 50], [-30, 0, 70], [80, 0, 30],
      [-80, 0, -20], [20, 0, -80], [70, 0, -70]
    ];

    for (var i = 0; i < treePositions.length; i++) {
      var pos = treePositions[i];

      var trunkGeometry = new THREE.CylinderGeometry(3, 4, 25, 8);
      var trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
      var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(pos[0], 12, pos[2]);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      scene.add(trunk);

      var canopyGeometry = new THREE.SphereGeometry(18, 8, 8);
      var canopyMaterial = new THREE.MeshPhongMaterial({ color: 0x1a3d0a });
      var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
      canopy.position.set(pos[0], 32, pos[2]);
      canopy.castShadow = true;
      canopy.receiveShadow = true;
      scene.add(canopy);
      canopyParts.push(canopy);

      var canopy2Geometry = new THREE.SphereGeometry(15, 8, 8);
      var canopy2 = new THREE.Mesh(canopy2Geometry, canopyMaterial);
      canopy2.position.set(pos[0] + 8, 28, pos[2] + 8);
      canopy2.castShadow = true;
      scene.add(canopy2);
      canopyParts.push(canopy2);
    }
  }

  function createVillageHuts() {
    var hutPositions = [
      [-30, 0, -30], [30, 0, -30], [0, 0, 0],
      [-35, 0, 30], [35, 0, 30]
    ];

    for (var i = 0; i < hutPositions.length; i++) {
      var pos = hutPositions[i];

      var stiltGeometry = new THREE.CylinderGeometry(0.8, 0.8, 8, 6);
      var stiltMaterial = new THREE.MeshPhongMaterial({ color: 0x8b6f47 });

      for (var j = 0; j < 4; j++) {
        var stilt = new THREE.Mesh(stiltGeometry, stiltMaterial);
        var offset = 4;
        var sx = (j % 2) === 0 ? offset : -offset;
        var sz = (j < 2) ? offset : -offset;
        stilt.position.set(pos[0] + sx, 4, pos[2] + sz);
        stilt.castShadow = true;
        scene.add(stilt);
      }

      var platformGeometry = new THREE.BoxGeometry(12, 0.5, 12);
      var platformMaterial = new THREE.MeshPhongMaterial({ color: 0xa0826d });
      var platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.set(pos[0], 8.3, pos[2]);
      platform.castShadow = true;
      platform.receiveShadow = true;
      scene.add(platform);

      var wallGeometry = new THREE.BoxGeometry(11, 6, 11);
      var wallMaterial = new THREE.MeshPhongMaterial({ color: 0xd4a574 });
      var wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(pos[0], 12, pos[2]);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);

      var roofGeometry = new THREE.ConeGeometry(8, 6, 8);
      var roofMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
      var roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.set(pos[0], 16, pos[2]);
      roof.castShadow = true;
      scene.add(roof);
    }
  }

  function createRopeBridges() {
    var bridges = [
      { from: [-30, 8.3, -30], to: [30, 8.3, -30] },
      { from: [30, 8.3, -30], to: [0, 8.3, 0] },
      { from: [-30, 8.3, -30], to: [-35, 8.3, 30] }
    ];

    for (var b = 0; b < bridges.length; b++) {
      var bridge = bridges[b];
      var from = bridge.from;
      var to = bridge.to;

      var dx = to[0] - from[0];
      var dz = to[2] - from[2];
      var length = Math.sqrt(dx * dx + dz * dz);
      var midX = (from[0] + to[0]) / 2;
      var midZ = (from[2] + to[2]) / 2;

      var cablePoints = [
        new THREE.Vector3(from[0], from[1] + 1, from[2]),
        new THREE.Vector3(midX, from[1] + 2, midZ),
        new THREE.Vector3(to[0], to[1] + 1, to[2])
      ];
      var cableGeometry = new THREE.BufferGeometry().setFromPoints(cablePoints);
      var cableMaterial = new THREE.LineBasicMaterial({ color: 0x8b4513, linewidth: 2 });
      var cable = new THREE.LineSegments(cableGeometry, cableMaterial);
      scene.add(cable);

      var plankGeometry = new THREE.BoxGeometry(1.5, 0.3, length);
      var plankMaterial = new THREE.MeshPhongMaterial({ color: 0xa0826d });
      var plank = new THREE.Mesh(plankGeometry, plankMaterial);
      plank.position.set(midX, from[1] + 0.5, midZ);
      plank.rotation.z = Math.atan2(dz, dx);
      plank.castShadow = true;
      plank.receiveShadow = true;
      scene.add(plank);
    }
  }

  function createCentralBonfire() {
    var bonfireGeometry = new THREE.SphereGeometry(3, 8, 8);
    var bonfireMaterial = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    bonfireSphere = new THREE.Mesh(bonfireGeometry, bonfireMaterial);
    bonfireSphere.position.set(0, 4, 0);
    scene.add(bonfireSphere);

    bonfireLight = new THREE.PointLight(0xff6600, 2, 80);
    bonfireLight.position.set(0, 5, 0);
    bonfireLight.castShadow = true;
    scene.add(bonfireLight);

    var innerFlameGeometry = new THREE.SphereGeometry(2.2, 6, 6);
    var innerFlameMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    var innerFlame = new THREE.Mesh(innerFlameGeometry, innerFlameMaterial);
    innerFlame.position.set(0, 4.5, 0);
    scene.add(innerFlame);
  }

  function createBambooFence() {
    var fenceRadius = 95;
    var segmentCount = 16;

    for (var i = 0; i < segmentCount; i++) {
      var angle = (i / segmentCount) * Math.PI * 2;
      var x = Math.cos(angle) * fenceRadius;
      var z = Math.sin(angle) * fenceRadius;

      var bambooGeometry = new THREE.CylinderGeometry(0.4, 0.5, 12, 8);
      var bambooMaterial = new THREE.MeshPhongMaterial({ color: 0x556b2f });
      var bamboo = new THREE.Mesh(bambooGeometry, bambooMaterial);
      bamboo.position.set(x, 6, z);
      bamboo.castShadow = true;
      scene.add(bamboo);

      if (i < segmentCount - 1) {
        var nextAngle = ((i + 1) / segmentCount) * Math.PI * 2;
        var nextX = Math.cos(nextAngle) * fenceRadius;
        var nextZ = Math.sin(nextAngle) * fenceRadius;

        var linePoints = [
          new THREE.Vector3(x, 7, z),
          new THREE.Vector3(nextX, 7, nextZ),
          new THREE.Vector3(x, 9, z),
          new THREE.Vector3(nextX, 9, nextZ)
        ];
        var lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
        var lineMaterial = new THREE.LineBasicMaterial({ color: 0x6b4423 });
        var lines = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(lines);
      }
    }
  }

  function createWatchtower() {
    var towerGeometry = new THREE.BoxGeometry(6, 20, 6);
    var towerMaterial = new THREE.MeshPhongMaterial({ color: 0x8b6f47 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(-70, 10, -70);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);

    var platformGeometry = new THREE.BoxGeometry(9, 1, 9);
    var platformMaterial = new THREE.MeshPhongMaterial({ color: 0xa0826d });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(-70, 21, -70);
    platform.castShadow = true;
    scene.add(platform);

    var ladderPoints = [];
    for (var i = 0; i < 10; i++) {
      var y = i * 1.8;
      ladderPoints.push(new THREE.Vector3(-72, y, -70));
      ladderPoints.push(new THREE.Vector3(-68, y, -70));
    }
    var ladderGeometry = new THREE.BufferGeometry().setFromPoints(ladderPoints);
    var ladderMaterial = new THREE.LineBasicMaterial({ color: 0x654321 });
    var ladder = new THREE.LineSegments(ladderGeometry, ladderMaterial);
    scene.add(ladder);

    var drumGeometry = new THREE.CylinderGeometry(1.5, 1.5, 1, 8);
    var drumMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    var drum = new THREE.Mesh(drumGeometry, drumMaterial);
    drum.position.set(-70, 23, -70);
    drum.castShadow = true;
    scene.add(drum);
  }

  function createPitTraps() {
    var trapPositions = [
      [50, 0, 50],
      [-60, 0, 60],
      [40, 0, -60]
    ];

    for (var i = 0; i < trapPositions.length; i++) {
      var pos = trapPositions[i];

      var pitGeometry = new THREE.BoxGeometry(5, 4, 5);
      var pitMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
      var pit = new THREE.Mesh(pitGeometry, pitMaterial);
      pit.position.set(pos[0], -1, pos[2]);
      pit.receiveShadow = true;
      scene.add(pit);

      var coverGeometry = new THREE.BoxGeometry(5.2, 0.4, 5.2);
      var coverMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
      var cover = new THREE.Mesh(coverGeometry, coverMaterial);
      cover.position.set(pos[0], 1.8, pos[2]);
      cover.castShadow = true;
      cover.receiveShadow = true;
      scene.add(cover);
    }
  }

  function createBoatLanding() {
    var dockGeometry = new THREE.BoxGeometry(15, 1, 8);
    var dockMaterial = new THREE.MeshPhongMaterial({ color: 0xa0826d });
    var dock = new THREE.Mesh(dockGeometry, dockMaterial);
    dock.position.set(80, 1, 0);
    dock.castShadow = true;
    dock.receiveShadow = true;
    scene.add(dock);

    var postGeometry = new THREE.CylinderGeometry(0.6, 0.8, 4, 8);
    var postMaterial = new THREE.MeshPhongMaterial({ color: 0x8b6f47 });
    var post1 = new THREE.Mesh(postGeometry, postMaterial);
    post1.position.set(72, 2, -3);
    post1.castShadow = true;
    scene.add(post1);
    var post2 = new THREE.Mesh(postGeometry, postMaterial);
    post2.position.set(88, 2, -3);
    post2.castShadow = true;
    scene.add(post2);

    var canoeGeometry = new THREE.CylinderGeometry(2, 2.5, 6, 12);
    var canoeMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
    var canoe = new THREE.Mesh(canoeGeometry, canoeMaterial);
    canoe.rotation.z = Math.PI / 2;
    canoe.position.set(80, 1.5, 4);
    canoe.castShadow = true;
    scene.add(canoe);
  }

  function createJungleRiver() {
    for (var i = 0; i < 5; i++) {
      var riverGeometry = new THREE.BoxGeometry(6, 0.3, 40);
      var riverMaterial = new THREE.MeshPhongMaterial({ color: 0x1a472a });
      var river = new THREE.Mesh(riverGeometry, riverMaterial);
      river.position.set(80 - i * 3, 0.15, 0);
      river.receiveShadow = true;
      scene.add(river);
      riverBlocks.push(river);
    }
  }

  function createVineSwings() {
    var swingPositions = [
      { tree: [-50, 0, -60], pos: [-45, 0, -55] },
      { tree: [60, 0, -40], pos: [65, 0, -35] },
      { tree: [-70, 0, 20], pos: [-65, 0, 25] }
    ];

    for (var i = 0; i < swingPositions.length; i++) {
      var swingData = swingPositions[i];
      var tree = swingData.tree;
      var swingPos = swingData.pos;

      var vinePoints = [
        new THREE.Vector3(tree[0], 28, tree[2]),
        new THREE.Vector3(swingPos[0], 15, swingPos[2])
      ];
      var vineGeometry = new THREE.BufferGeometry().setFromPoints(vinePoints);
      var vineMaterial = new THREE.LineBasicMaterial({ color: 0x6b4423, linewidth: 3 });
      var vine = new THREE.LineSegments(vineGeometry, vineMaterial);
      scene.add(vine);
      vineSwings.push(vine);

      var knot1Geometry = new THREE.SphereGeometry(0.4, 6, 6);
      var knotMaterial = new THREE.MeshPhongMaterial({ color: 0x8b6f47 });
      var knot1 = new THREE.Mesh(knot1Geometry, knotMaterial);
      knot1.position.set(tree[0], 26, tree[2]);
      knot1.castShadow = true;
      scene.add(knot1);

      var handleGeometry = new THREE.BoxGeometry(2, 0.5, 0.5);
      var handle = new THREE.Mesh(handleGeometry, knotMaterial);
      handle.position.set(swingPos[0], 13, swingPos[2]);
      handle.castShadow = true;
      scene.add(handle);
    }
  }

  function createMedicinalGarden() {
    var gardenCenter = [-50, 0, 40];
    var plantCount = 12;

    for (var i = 0; i < plantCount; i++) {
      var angle = (i / plantCount) * Math.PI * 2;
      var radius = 8;
      var x = gardenCenter[0] + Math.cos(angle) * radius;
      var z = gardenCenter[2] + Math.sin(angle) * radius;

      var stemGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 6);
      var stemMaterial = new THREE.MeshPhongMaterial({ color: 0x556b2f });
      var stem = new THREE.Mesh(stemGeometry, stemMaterial);
      stem.position.set(x, 1, z);
      stem.castShadow = true;
      scene.add(stem);

      var leafGeometry = new THREE.SphereGeometry(0.8, 6, 6);
      var leafMaterial = new THREE.MeshPhongMaterial({ color: 0x2d5016 });
      var leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      leaf.position.set(x, 2.5, z);
      leaf.castShadow = true;
      scene.add(leaf);
    }
  }

  function createWoodenIdol() {
    var totemGeometry = new THREE.BoxGeometry(3, 12, 3);
    var totemMaterial = new THREE.MeshPhongMaterial({ color: 0x8b6f47 });
    var totem = new THREE.Mesh(totemGeometry, totemMaterial);
    totem.position.set(0, 6, -50);
    totem.castShadow = true;
    scene.add(totem);

    var eyeGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    var eyeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

    var eye1 = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye1.position.set(-0.8, 8, -1.6);
    eye1.castShadow = true;
    scene.add(eye1);

    var eye2 = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye2.position.set(0.8, 8, -1.6);
    eye2.castShadow = true;
    scene.add(eye2);

    var pupilGeometry = new THREE.SphereGeometry(0.25, 6, 6);
    var pupilMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });

    var pupil1 = new THREE.Mesh(pupilGeometry, pupilMaterial);
    pupil1.position.set(-0.8, 8, -1.3);
    scene.add(pupil1);

    var pupil2 = new THREE.Mesh(pupilGeometry, pupilMaterial);
    pupil2.position.set(0.8, 8, -1.3);
    scene.add(pupil2);

    var mouthGeometry = new THREE.BoxGeometry(1.5, 0.5, 0.3);
    var mouthMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, 5.5, -1.6);
    scene.add(mouth);
  }

  function update(delta) {
    time += delta;

    if (bonfireSphere) {
      var scale = 1 + 0.15 * Math.sin(time * 8);
      bonfireSphere.scale.set(scale, scale, scale);
    }

    if (bonfireLight) {
      var lightIntensity = 1.8 + 0.5 * Math.sin(time * 6);
      bonfireLight.intensity = lightIntensity;
    }

    for (var i = 0; i < riverBlocks.length; i++) {
      riverBlocks[i].position.z += delta * 8;
      if (riverBlocks[i].position.z > 50) {
        riverBlocks[i].position.z = -100;
      }
    }

    for (var j = 0; j < canopyParts.length; j++) {
      var offset = Math.sin(time * 1.5 + j) * 0.3;
      canopyParts[j].position.y += offset * delta;
    }
  }

  function reset() {
    time = 0;
    if (bonfireSphere) {
      bonfireSphere.scale.set(1, 1, 1);
    }
    for (var i = 0; i < riverBlocks.length; i++) {
      riverBlocks[i].position.z = -40 + i * 8;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };

}());
