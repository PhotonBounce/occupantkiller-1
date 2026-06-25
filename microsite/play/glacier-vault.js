window.GlacierVault = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var meltwater = [];
  var drills = [];
  var cryo = [];
  var cracks = [];
  var time = 0;

  var init = function(scene_, camera_) {
    scene = scene_;
    camera = camera_;
    meshes = [];
    meltwater = [];
    drills = [];
    cryo = [];
    cracks = [];
    time = 0;

    buildVaultEntrance();
    buildMainCorridor();
    buildCryoPodStorage();
    buildNuclearWarheadRoom();
    buildMeltewaterLevel();
    buildThermalDrill();
    buildLiquidNitrogenPipes();
    buildVaultDoor();
    buildEmergencyLights();
    buildIceStalactites();
    buildIceCracks();
    buildSnowblowerVent();
  };

  var buildVaultEntrance = function() {
    var mat = new THREE.MeshStandardMaterial({ color: 0x99ccff, transparent: true, opacity: 0.85 });
    var wallGeom = new THREE.BoxGeometry(30, 25, 2);
    var wall = new THREE.Mesh(wallGeom, mat);
    wall.position.z = -15;
    scene.add(wall);
    meshes.push(wall);

    var topWall = new THREE.Mesh(wallGeom, mat);
    topWall.position.z = -15;
    topWall.position.y = 12.5;
    topWall.scale.y = 0.8;
    scene.add(topWall);
    meshes.push(topWall);
  };

  var buildMainCorridor = function() {
    var wallMat = new THREE.MeshStandardMaterial({ color: 0xb3e5fc, wireframe: false });
    var floorMat = new THREE.MeshStandardMaterial({ color: 0xccccff });

    var leftWall = new THREE.Mesh(new THREE.BoxGeometry(2, 15, 120), wallMat);
    leftWall.position.x = -15;
    leftWall.position.y = 2;
    scene.add(leftWall);
    meshes.push(leftWall);

    var rightWall = new THREE.Mesh(new THREE.BoxGeometry(2, 15, 120), wallMat);
    rightWall.position.x = 15;
    rightWall.position.y = 2;
    scene.add(rightWall);
    meshes.push(rightWall);

    var ceiling = new THREE.Mesh(new THREE.BoxGeometry(30, 2, 120), wallMat);
    ceiling.position.y = 14;
    ceiling.position.z = 20;
    scene.add(ceiling);
    meshes.push(ceiling);

    var floor = new THREE.Mesh(new THREE.BoxGeometry(30, 2, 120), floorMat);
    floor.position.y = -0.5;
    floor.position.z = 20;
    scene.add(floor);
    meshes.push(floor);

    var irregularWalls = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 100), wallMat);
    irregularWalls.position.x = -14;
    irregularWalls.position.y = 6;
    irregularWalls.position.z = 30;
    irregularWalls.scale.x = 0.8;
    scene.add(irregularWalls);
    meshes.push(irregularWalls);
  };

  var buildCryoPodStorage = function() {
    var podMat = new THREE.MeshStandardMaterial({ color: 0x00ccff, emissive: 0x0066ff, emissiveIntensity: 0.3 });
    var capsuleMat = new THREE.MeshStandardMaterial({ color: 0xff3333 });

    var rows = 3;
    var cols = 4;
    var startZ = -20;
    var startX = -12;

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var x = startX + c * 8;
        var z = startZ + r * 12;

        var podGeom = new THREE.CylinderGeometry(1.5, 1.5, 5, 8);
        var pod = new THREE.Mesh(podGeom, podMat);
        pod.position.set(x, 2, z);
        scene.add(pod);
        meshes.push(pod);

        var panelGeom = new THREE.BoxGeometry(2, 4, 0.5);
        var panelMat = new THREE.MeshStandardMaterial({ color: 0x003366, transparent: true, opacity: 0.6 });
        var panel = new THREE.Mesh(panelGeom, panelMat);
        panel.position.set(x, 2, z + 2.5);
        scene.add(panel);
        meshes.push(panel);

        var indicatorGeom = new THREE.SphereGeometry(0.3, 8, 8);
        var indicator = new THREE.Mesh(indicatorGeom, capsuleMat);
        indicator.position.set(x + 1, 4, z);
        indicator.userData.originalColor = new THREE.Color(0xff3333);
        scene.add(indicator);
        cryo.push(indicator);
        meshes.push(indicator);
      }
    }
  };

  var buildNuclearWarheadRoom = function() {
    var vaultMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });
    var vaultWall = new THREE.Mesh(new THREE.BoxGeometry(25, 12, 15), vaultMat);
    vaultWall.position.set(0, 3, 60);
    scene.add(vaultWall);
    meshes.push(vaultWall);

    var bodyGeom = new THREE.CylinderGeometry(0.8, 0.8, 6, 16);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9 });
    var missileBody = new THREE.Mesh(bodyGeom, bodyMat);
    missileBody.position.set(2, 4, 60);
    scene.add(missileBody);
    meshes.push(missileBody);

    var noseGeom = new THREE.ConeGeometry(0.8, 2, 16);
    var noseMat = new THREE.MeshStandardMaterial({ color: 0xff3333 });
    var noseA = new THREE.Mesh(noseGeom, noseMat);
    noseA.position.set(2, 7.5, 60);
    scene.add(noseA);
    meshes.push(noseA);

    var noseB = new THREE.Mesh(noseGeom, noseMat);
    noseB.position.set(-2, 7.5, 60);
    noseB.rotation.z = Math.PI;
    scene.add(noseB);
    meshes.push(noseB);

    var standGeom = new THREE.BoxGeometry(6, 1, 3);
    var stand = new THREE.Mesh(standGeom, vaultMat);
    stand.position.set(0, 1.5, 60);
    scene.add(stand);
    meshes.push(stand);
  };

  var buildMeltewaterLevel = function() {
    var waterMat = new THREE.MeshStandardMaterial({ color: 0x33ccff, transparent: true, opacity: 0.5 });
    var waterGeom = new THREE.BoxGeometry(28, 0.8, 80);
    var water = new THREE.Mesh(waterGeom, waterMat);
    water.position.set(0, -3, 40);
    water.userData.baseY = -3;
    water.userData.time = 0;
    scene.add(water);
    meltwater.push(water);
    meshes.push(water);

    var floodWall = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 80), new THREE.MeshStandardMaterial({ color: 0x6699ff }));
    floodWall.position.set(-14, -1, 40);
    scene.add(floodWall);
    meshes.push(floodWall);
  };

  var buildThermalDrill = function() {
    var drillMat = new THREE.MeshStandardMaterial({ color: 0xff9900, metalness: 0.7 });
    var bodyGeom = new THREE.CylinderGeometry(2, 2, 8, 16);
    var body = new THREE.Mesh(bodyGeom, drillMat);
    body.position.set(-8, 6, 80);
    scene.add(body);
    meshes.push(body);

    var headGeom = new THREE.CylinderGeometry(2.5, 2.5, 3, 16);
    var head = new THREE.Mesh(headGeom, drillMat);
    head.position.set(-8, 11.5, 80);
    head.userData.rotation = 0;
    scene.add(head);
    drills.push(head);
    meshes.push(head);

    var teethGeom = new THREE.BoxGeometry(0.4, 0.6, 2.4);
    for (var t = 0; t < 6; t++) {
      var angle = (t / 6) * Math.PI * 2;
      var tooth = new THREE.Mesh(teethGeom, new THREE.MeshStandardMaterial({ color: 0x333333 }));
      tooth.position.x = -8 + Math.cos(angle) * 2.2;
      tooth.position.z = 80 + Math.sin(angle) * 2.2;
      tooth.position.y = 11.5;
      tooth.rotation.z = angle;
      scene.add(tooth);
      meshes.push(tooth);
    }
  };

  var buildLiquidNitrogenPipes = function() {
    var pipeMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.2 });
    var jointMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xcccccc, emissiveIntensity: 0.4 });

    var pipeGeom = new THREE.CylinderGeometry(0.4, 0.4, 30, 8);
    var pipe = new THREE.Mesh(pipeGeom, pipeMat);
    pipe.rotation.z = Math.PI / 4;
    pipe.position.set(8, 8, 40);
    scene.add(pipe);
    meshes.push(pipe);

    var jointPositions = [
      new THREE.Vector3(8, 8, 20),
      new THREE.Vector3(8, 12, 50),
      new THREE.Vector3(12, 6, 60)
    ];

    for (var j = 0; j < jointPositions.length; j++) {
      var jointGeom = new THREE.SphereGeometry(0.7, 8, 8);
      var joint = new THREE.Mesh(jointGeom, jointMat);
      joint.position.copy(jointPositions[j]);
      scene.add(joint);
      meshes.push(joint);

      var iceGeom = new THREE.SphereGeometry(0.9, 8, 8);
      var ice = new THREE.Mesh(iceGeom, new THREE.MeshStandardMaterial({ color: 0xccffff, transparent: true, opacity: 0.6 }));
      ice.position.copy(jointPositions[j]);
      scene.add(ice);
      meshes.push(ice);
    }
  };

  var buildVaultDoor = function() {
    var doorMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.95 });
    var doorGeom = new THREE.BoxGeometry(8, 10, 1);
    var door = new THREE.Mesh(doorGeom, doorMat);
    door.position.set(0, 5, 2);
    scene.add(door);
    meshes.push(door);

    var boltMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    for (var bx = -2; bx <= 2; bx += 4) {
      for (var by = 2; by <= 8; by += 3) {
        var boltGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 8);
        var bolt = new THREE.Mesh(boltGeom, boltMat);
        bolt.position.set(bx, by, 2.3);
        scene.add(bolt);
        meshes.push(bolt);
      }
    }

    var keypadGeom = new THREE.BoxGeometry(1.5, 2, 0.3);
    var keypadMat = new THREE.MeshStandardMaterial({ color: 0x003300 });
    var keypad = new THREE.Mesh(keypadGeom, keypadMat);
    keypad.position.set(3.5, 5, 2.5);
    scene.add(keypad);
    meshes.push(keypad);

    var ledGeom = new THREE.SphereGeometry(0.15, 8, 8);
    var ledMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.8 });
    var led = new THREE.Mesh(ledGeom, ledMat);
    led.position.set(3.5, 6.2, 2.6);
    scene.add(led);
    meshes.push(led);
  };

  var buildEmergencyLights = function() {
    var lightMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.6 });
    var lightGeom = new THREE.SphereGeometry(0.6, 8, 8);

    for (var l = 0; l < 8; l++) {
      var light = new THREE.Mesh(lightGeom, lightMat);
      light.position.set(-14, 13, -20 + l * 20);
      scene.add(light);
      meshes.push(light);
    }
  };

  var buildIceStalactites = function() {
    var stalacMat = new THREE.MeshStandardMaterial({ color: 0xddddff, transparent: true, opacity: 0.8 });
    var stalacGeom = new THREE.ConeGeometry(0.5, 4, 8);

    for (var s = 0; s < 12; s++) {
      var x = -10 + Math.random() * 20;
      var z = 10 + Math.random() * 100;
      var stalac = new THREE.Mesh(stalacGeom, stalacMat);
      stalac.position.set(x, 13.5, z);
      scene.add(stalac);
      meshes.push(stalac);
    }
  };

  var buildIceCracks = function() {
    var crackMat = new THREE.LineBasicMaterial({ color: 0x4488ff, linewidth: 2 });

    for (var c = 0; c < 5; c++) {
      var points = [];
      var startX = -10 + Math.random() * 20;
      var startZ = 10 + Math.random() * 100;

      for (var seg = 0; seg < 8; seg++) {
        points.push(new THREE.Vector3(
          startX + Math.random() * 5,
          9,
          startZ + seg * 3
        ));
      }

      var crackGeom = new THREE.BufferGeometry().setFromPoints(points);
      var crack = new THREE.LineSegments(crackGeom, crackMat);
      crack.userData.originalPoints = points;
      cracks.push(crack);
      scene.add(crack);
    }
  };

  var buildSnowblowerVent = function() {
    var ventMat = new THREE.MeshStandardMaterial({ color: 0x777777 });
    var ventGeom = new THREE.CylinderGeometry(1.2, 1.5, 6, 12);
    var vent = new THREE.Mesh(ventGeom, ventMat);
    vent.position.set(12, 8, 90);
    scene.add(vent);
    meshes.push(vent);

    var rimGeom = new THREE.CylinderGeometry(1.5, 1.6, 0.4, 12);
    var rim = new THREE.Mesh(rimGeom, ventMat);
    rim.position.set(12, 11.3, 90);
    scene.add(rim);
    meshes.push(rim);
  };

  var update = function(delta) {
    time += delta;

    for (var i = 0; i < meltwater.length; i++) {
      var water = meltwater[i];
      water.position.y = water.userData.baseY + Math.sin(time * 0.8) * 0.3;
    }

    for (var d = 0; d < drills.length; d++) {
      var drill = drills[d];
      drill.rotation.y += delta * 3;
    }

    for (var cr = 0; cr < cryo.length; cr++) {
      var indicator = cryo[cr];
      var brightness = 0.5 + Math.sin(time * 2) * 0.5;
      indicator.material.emissiveIntensity = brightness;
    }

    for (var ck = 0; ck < cracks.length; ck++) {
      var crack = cracks[ck];
      var originalPoints = crack.userData.originalPoints;
      var newPoints = [];

      for (var p = 0; p < originalPoints.length; p++) {
        var pt = originalPoints[p].clone();
        pt.x += Math.sin(time + p) * 0.15;
        pt.z += Math.cos(time * 0.7 + p) * 0.1;
        newPoints.push(pt);
      }

      crack.geometry.dispose();
      crack.geometry = new THREE.BufferGeometry().setFromPoints(newPoints);
    }
  };

  var reset = function() {
    for (var m = 0; m < meshes.length; m++) {
      if (meshes[m].geometry) {
        meshes[m].geometry.dispose();
      }
      if (meshes[m].material) {
        meshes[m].material.dispose();
      }
      scene.remove(meshes[m]);
    }

    for (var e = 0; e < cracks.length; e++) {
      if (cracks[e].geometry) {
        cracks[e].geometry.dispose();
      }
      scene.remove(cracks[e]);
    }

    meshes = [];
    meltwater = [];
    drills = [];
    cryo = [];
    cracks = [];
    time = 0;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
