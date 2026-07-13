window.PortreeFort = (function() {
  'use strict';

  var scene;
  var baseX = 1300;
  var baseZ = 1720;

  function initialize(sceneRef) {
    scene = sceneRef;
    buildHarbourRow();
    buildHarbourPier();
    buildHillFort();
    buildCuillinHills();
    buildWatchTower();
    buildChainBarrier();
    buildGunEmplacement();
    buildFerryDock();
  }

  function buildHarbourRow() {
    var colors = [0xff0000, 0x0000ff, 0xffff00, 0x00aa00, 0xff69b4];
    var colorNames = ['red', 'blue', 'yellow', 'green', 'pink'];
    var spacing = 6;

    for (var i = 0; i < 5; i++) {
      var geometry = new THREE.BoxGeometry(4, 5, 4);
      var material = new THREE.MeshLambertMaterial({ color: colors[i] });
      var building = new THREE.Mesh(geometry, material);

      building.position.x = baseX + (i * spacing) - 12;
      building.position.y = 2.5;
      building.position.z = baseZ + 8;
      building.castShadow = true;
      building.receiveShadow = true;
      building.userData.name = 'HarbourBuilding_' + colorNames[i];

      scene.add(building);
    }
  }

  function buildHarbourPier() {
    var peerGeometry = new THREE.BoxGeometry(20, 1, 4);
    var peerMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    var pier = new THREE.Mesh(peerGeometry, peerMaterial);

    pier.position.x = baseX - 5;
    pier.position.y = 0.5;
    pier.position.z = baseZ - 12;
    pier.castShadow = true;
    pier.receiveShadow = true;

    scene.add(pier);

    var lampCount = 4;
    var lampSpacing = 20 / (lampCount - 1);

    for (var i = 0; i < lampCount; i++) {
      var lampGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 16);
      var lampMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
      var lampPost = new THREE.Mesh(lampGeometry, lampMaterial);

      lampPost.position.x = baseX - 15 + (i * lampSpacing);
      lampPost.position.y = 2;
      lampPost.position.z = baseZ - 12;
      lampPost.castShadow = true;
      lampPost.receiveShadow = true;

      scene.add(lampPost);
    }
  }

  function buildHillFort() {
    var hillGeometry = new THREE.BoxGeometry(25, 4, 25);
    var hillMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
    var hill = new THREE.Mesh(hillGeometry, hillMaterial);

    hill.position.x = baseX + 20;
    hill.position.y = 2;
    hill.position.z = baseZ - 8;
    hill.castShadow = true;
    hill.receiveShadow = true;

    scene.add(hill);

    var fortGeometry = new THREE.BoxGeometry(8, 6, 6);
    var fortMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var fort = new THREE.Mesh(fortGeometry, fortMaterial);

    fort.position.x = baseX + 20;
    fort.position.y = 6;
    fort.position.z = baseZ - 8;
    fort.castShadow = true;
    fort.receiveShadow = true;

    scene.add(fort);
  }

  function buildCuillinHills() {
    var peakPositions = [
      { x: baseX + 60, z: baseZ - 40 },
      { x: baseX + 80, z: baseZ - 50 },
      { x: baseX + 100, z: baseZ - 35 }
    ];

    for (var i = 0; i < peakPositions.length; i++) {
      var peakGeometry = new THREE.BoxGeometry(12, 30, 8);
      var peakMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var peak = new THREE.Mesh(peakGeometry, peakMaterial);

      peak.position.x = peakPositions[i].x;
      peak.position.y = 15;
      peak.position.z = peakPositions[i].z;
      peak.rotation.x = (Math.random() - 0.5) * 0.3;
      peak.rotation.z = (Math.random() - 0.5) * 0.2;
      peak.castShadow = true;
      peak.receiveShadow = true;

      scene.add(peak);
    }
  }

  function buildWatchTower() {
    var towerGeometry = new THREE.CylinderGeometry(3, 3, 14, 16);
    var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);

    tower.position.x = baseX - 15;
    tower.position.y = 7;
    tower.position.z = baseZ + 25;
    tower.castShadow = true;
    tower.receiveShadow = true;

    scene.add(tower);

    var battlementGeometry = new THREE.BoxGeometry(7, 1.5, 7);
    var battlementMaterial = new THREE.MeshLambertMaterial({ color: 0x707070 });
    var battlement = new THREE.Mesh(battlementGeometry, battlementMaterial);

    battlement.position.x = baseX - 15;
    battlement.position.y = 14;
    battlement.position.z = baseZ + 25;
    battlement.castShadow = true;
    battlement.receiveShadow = true;

    scene.add(battlement);
  }

  function buildChainBarrier() {
    var chainLinks = 8;
    var linkSpacing = 3;

    for (var i = 0; i < chainLinks; i++) {
      var postGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
      var postMaterial = new THREE.MeshLambertMaterial({ color: 0xaa8844 });
      var floatPost = new THREE.Mesh(postGeometry, postMaterial);

      floatPost.position.x = baseX - 30 + (i * linkSpacing);
      floatPost.position.y = 1.5;
      floatPost.position.z = baseZ + 35;
      floatPost.castShadow = true;
      floatPost.receiveShadow = true;

      scene.add(floatPost);

      if (i < chainLinks - 1) {
        var chainPoints = [
          new THREE.Vector3(baseX - 30 + (i * linkSpacing) + 0.5, 2.5, baseZ + 35),
          new THREE.Vector3(baseX - 30 + ((i + 1) * linkSpacing) - 0.5, 2.5, baseZ + 35)
        ];
        var chainGeometry = new THREE.BufferGeometry().setFromPoints(chainPoints);
        var lineMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 3 });
        var chainLine = new THREE.LineSegments(chainGeometry, lineMaterial);

        scene.add(chainLine);
      }
    }
  }

  function buildGunEmplacement() {
    var platformGeometry = new THREE.BoxGeometry(12, 1, 8);
    var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);

    platform.position.x = baseX - 40;
    platform.position.y = 0.5;
    platform.position.z = baseZ - 30;
    platform.castShadow = true;
    platform.receiveShadow = true;

    scene.add(platform);

    var gunOffsets = [-3, 3];

    for (var i = 0; i < gunOffsets.length; i++) {
      var gunGeometry = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
      var gunMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
      var gun = new THREE.Mesh(gunGeometry, gunMaterial);

      gun.position.x = baseX - 40 + gunOffsets[i];
      gun.position.y = 1.5;
      gun.position.z = baseZ - 30;
      gun.rotation.z = 0.3;
      gun.castShadow = true;
      gun.receiveShadow = true;

      scene.add(gun);
    }
  }

  function buildFerryDock() {
    var rampGeometry = new THREE.BoxGeometry(8, 0.5, 12);
    var rampMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
    var ramp = new THREE.Mesh(rampGeometry, rampMaterial);

    ramp.position.x = baseX + 40;
    ramp.position.y = 0.25;
    ramp.position.z = baseZ + 10;
    ramp.rotation.x = 0.2;
    ramp.castShadow = true;
    ramp.receiveShadow = true;

    scene.add(ramp);

    var ferryGeometry = new THREE.BoxGeometry(10, 4, 14);
    var ferryMaterial = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
    var ferry = new THREE.Mesh(ferryGeometry, ferryMaterial);

    ferry.position.x = baseX + 40;
    ferry.position.y = 2;
    ferry.position.z = baseZ + 15;
    ferry.castShadow = true;
    ferry.receiveShadow = true;

    scene.add(ferry);

    var cabinGeometry = new THREE.BoxGeometry(8, 3, 6);
    var cabinMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);

    cabin.position.x = baseX + 40;
    cabin.position.y = 4.5;
    cabin.position.z = baseZ + 12;
    cabin.castShadow = true;
    cabin.receiveShadow = true;

    scene.add(cabin);
  }

  return {
    initialize: initialize
  };
}());
