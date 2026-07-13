window.FortressPeak = (function() {
  'use strict';

  var scene, camera;
  var torches = [];
  var radarDish = null;
  var fogClouds = [];
  var bannerPole = null;
  var catapultArm = null;

  var init = function(inScene, inCamera) {
    scene = inScene;
    camera = inCamera;
    scene.fog = new THREE.Fog(0xccccdd, 100, 300);
    scene.background = new THREE.Color(0x87ceeb);

    buildMountainPeak();
    buildOuterWall();
    buildCornerTowers();
    buildGatehouse();
    buildKeepDonjon();
    buildModernAdditions();
    buildCatapult();
    buildTrebuchet();
    buildUndergroundArmory();
    buildTorchSconces();
    buildFogClouds();
  };

  var buildMountainPeak = function() {
    var peakGeometry = new THREE.BoxGeometry(150, 80, 150);
    var peakMaterial = new THREE.MeshPhongMaterial({ color: 0x8b7d6b });
    var peak = new THREE.Mesh(peakGeometry, peakMaterial);
    peak.position.y = -40;
    peak.castShadow = true;
    peak.receiveShadow = true;
    scene.add(peak);

    var snowGeometry = new THREE.BoxGeometry(140, 5, 140);
    var snowMaterial = new THREE.MeshPhongMaterial({ color: 0xf0f8ff });
    var snowCap = new THREE.Mesh(snowGeometry, snowMaterial);
    snowCap.position.y = 41;
    snowCap.castShadow = true;
    snowCap.receiveShadow = true;
    scene.add(snowCap);

    var jaggies = [
      { x: -50, z: -50 }, { x: 50, z: 50 }, { x: -60, z: 40 },
      { x: 60, z: -40 }, { x: 30, z: 60 }, { x: -40, z: -60 }
    ];
    var i;
    for (i = 0; i < jaggies.length; i++) {
      var rockGeometry = new THREE.BoxGeometry(20, 30, 20);
      var rockMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 });
      var rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(jaggies[i].x, 30, jaggies[i].z);
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
    }
  };

  var buildOuterWall = function() {
    var wallHeight = 30;
    var wallThickness = 2;

    var northWallGeometry = new THREE.BoxGeometry(80, wallHeight, wallThickness);
    var wallMaterial = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
    var northWall = new THREE.Mesh(northWallGeometry, wallMaterial);
    northWall.position.set(0, wallHeight / 2, -45);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    scene.add(northWall);

    var southWallGeometry = new THREE.BoxGeometry(80, wallHeight, wallThickness);
    var southWall = new THREE.Mesh(southWallGeometry, wallMaterial);
    southWall.position.set(0, wallHeight / 2, 45);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    scene.add(southWall);

    var eastWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 90);
    var eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
    eastWall.position.set(45, wallHeight / 2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    scene.add(eastWall);

    var westWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 90);
    var westWall = new THREE.Mesh(westWallGeometry, wallMaterial);
    westWall.position.set(-45, wallHeight / 2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    scene.add(westWall);

    addBattlements(northWall.position, 80, wallHeight);
    addBattlements(southWall.position, 80, wallHeight);
    addBattlements(eastWall.position, 90, wallHeight);
    addBattlements(westWall.position, 90, wallHeight);
  };

  var addBattlements = function(wallPos, wallLength, wallHeight) {
    var crenel = 2;
    var merlon = 3;
    var count = Math.floor(wallLength / (crenel + merlon));
    var j;
    for (j = 0; j < count; j++) {
      var merlonGeometry = new THREE.BoxGeometry(merlon, merlon * 1.5, 1);
      var merlonMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 });
      var merlonMesh = new THREE.Mesh(merlonGeometry, merlonMaterial);
      merlonMesh.position.y = wallHeight + 2;
      merlonMesh.castShadow = true;
      scene.add(merlonMesh);
    }
  };

  var buildCornerTowers = function() {
    var corners = [
      { x: 45, z: -45 }, { x: 45, z: 45 },
      { x: -45, z: -45 }, { x: -45, z: 45 }
    ];
    var i;
    for (i = 0; i < corners.length; i++) {
      var cornerX = corners[i].x;
      var cornerZ = corners[i].z;

      var towerGeometry = new THREE.CylinderGeometry(8, 10, 40, 16);
      var towerMaterial = new THREE.MeshPhongMaterial({ color: 0xa0826d });
      var tower = new THREE.Mesh(towerGeometry, towerMaterial);
      tower.position.set(cornerX, 20, cornerZ);
      tower.castShadow = true;
      tower.receiveShadow = true;
      scene.add(tower);

      var roofGeometry = new THREE.ConeGeometry(10, 12, 16);
      var roofMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
      var roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.set(cornerX, 46, cornerZ);
      roof.castShadow = true;
      scene.add(roof);

      addArrowSlits(cornerX, cornerZ);
    }
  };

  var addArrowSlits = function(x, z) {
    var slitGeometry = new THREE.BoxGeometry(0.5, 3, 0.3);
    var slitMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var slit1 = new THREE.Mesh(slitGeometry, slitMaterial);
    slit1.position.set(x - 6, 15, z - 6);
    scene.add(slit1);

    var slit2 = new THREE.Mesh(slitGeometry, slitMaterial);
    slit2.position.set(x + 6, 15, z + 6);
    scene.add(slit2);
  };

  var buildGatehouse = function() {
    var gateGeometry = new THREE.BoxGeometry(20, 35, 15);
    var gateMaterial = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
    var gatehouse = new THREE.Mesh(gateGeometry, gateMaterial);
    gatehouse.position.set(0, 17, -47);
    gatehouse.castShadow = true;
    gatehouse.receiveShadow = true;
    scene.add(gatehouse);

    var portcullisGeometry = new THREE.BoxGeometry(18, 25, 0.5);
    var portcullisMaterial = new THREE.MeshPhongMaterial({ color: 0x2f2f2f });
    var portcullis = new THREE.Mesh(portcullisGeometry, portcullisMaterial);
    portcullis.position.set(0, 15, -40);
    portcullis.castShadow = true;
    scene.add(portcullis);

    var gridGeometry = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-9, 0, -40), new THREE.Vector3(-9, 25, -40),
        new THREE.Vector3(-3, 0, -40), new THREE.Vector3(-3, 25, -40),
        new THREE.Vector3(3, 0, -40), new THREE.Vector3(3, 25, -40),
        new THREE.Vector3(9, 0, -40), new THREE.Vector3(9, 25, -40),
        new THREE.Vector3(-9, 8, -40), new THREE.Vector3(9, 8, -40),
        new THREE.Vector3(-9, 16, -40), new THREE.Vector3(9, 16, -40)
      ]),
      new THREE.LineBasicMaterial({ color: 0x444444 })
    );
    scene.add(gridGeometry);

    var drawbridgeGeometry = new THREE.BoxGeometry(18, 3, 12);
    var drawbridgeMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
    var drawbridge = new THREE.Mesh(drawbridgeGeometry, drawbridgeMaterial);
    drawbridge.position.set(0, 3, -35);
    drawbridge.castShadow = true;
    drawbridge.receiveShadow = true;
    scene.add(drawbridge);
  };

  var buildKeepDonjon = function() {
    var keepGeometry = new THREE.BoxGeometry(20, 55, 20);
    var keepMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 });
    var keep = new THREE.Mesh(keepGeometry, keepMaterial);
    keep.position.set(0, 27, 0);
    keep.castShadow = true;
    keep.receiveShadow = true;
    scene.add(keep);

    var roofGeometry = new THREE.ConeGeometry(12, 15, 8);
    var roofMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 62, 0);
    roof.castShadow = true;
    scene.add(roof);

    bannerPole = new THREE.Group();
    var poleGeometry = new THREE.CylinderGeometry(0.8, 0.8, 25, 8);
    var poleMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(10, 60, 0);
    bannerPole.add(pole);
    scene.add(bannerPole);
  };

  var buildModernAdditions = function() {
    var radarStandGeometry = new THREE.CylinderGeometry(3, 4, 15, 12);
    var radarStandMaterial = new THREE.MeshPhongMaterial({ color: 0x505050 });
    var radarStand = new THREE.Mesh(radarStandGeometry, radarStandMaterial);
    radarStand.position.set(-30, 10, -20);
    radarStand.castShadow = true;
    scene.add(radarStand);

    radarDish = new THREE.Group();
    var dishGeometry = new THREE.BoxGeometry(12, 1, 10);
    var dishMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    var dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.position.set(-30, 23, -20);
    radarDish.add(dish);
    scene.add(radarDish);

    var guardPostGeometry = new THREE.BoxGeometry(10, 12, 10);
    var guardPostMaterial = new THREE.MeshPhongMaterial({ color: 0xa9a9a9 });
    var guardPost = new THREE.Mesh(guardPostGeometry, guardPostMaterial);
    guardPost.position.set(35, 8, -30);
    guardPost.castShadow = true;
    scene.add(guardPost);

    var floodLightStandGeometry = new THREE.CylinderGeometry(1.5, 2, 20, 8);
    var floodLightStandMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var floodLightStand = new THREE.Mesh(floodLightStandGeometry, floodLightStandMaterial);
    floodLightStand.position.set(40, 12, 30);
    floodLightStand.castShadow = true;
    scene.add(floodLightStand);

    var lightGeometry = new THREE.SphereGeometry(2, 8, 8);
    var lightMaterial = new THREE.MeshPhongMaterial({ color: 0xffff99, emissive: 0xffff00 });
    var light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.set(40, 22, 30);
    scene.add(light);

    var floodLight = new THREE.PointLight(0xffff99, 1, 80);
    floodLight.position.set(40, 22, 30);
    floodLight.castShadow = true;
    scene.add(floodLight);
  };

  var buildCatapult = function() {
    var baseGeometry = new THREE.BoxGeometry(12, 3, 15);
    var baseMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(-35, 5, 35);
    base.castShadow = true;
    scene.add(base);

    catapultArm = new THREE.Group();
    var armGeometry = new THREE.BoxGeometry(2, 20, 3);
    var armMaterial = new THREE.MeshPhongMaterial({ color: 0xb8860b });
    var arm = new THREE.Mesh(armGeometry, armMaterial);
    arm.position.set(0, 10, 0);
    catapultArm.add(arm);
    catapultArm.position.set(-35, 5, 35);
    scene.add(catapultArm);

    var ropeGeometry = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-35, 25, 30), new THREE.Vector3(-35, 5, 40),
        new THREE.Vector3(-35, 25, 40), new THREE.Vector3(-35, 5, 40)
      ]),
      new THREE.LineBasicMaterial({ color: 0x8b7355 })
    );
    scene.add(ropeGeometry);

    var bucketGeometry = new THREE.BoxGeometry(4, 3, 4);
    var bucketMaterial = new THREE.MeshPhongMaterial({ color: 0xd2691e });
    var bucket = new THREE.Mesh(bucketGeometry, bucketMaterial);
    bucket.position.set(-35, 22, 32);
    bucket.castShadow = true;
    scene.add(bucket);
  };

  var buildTrebuchet = function() {
    var frameGeometry = new THREE.BoxGeometry(25, 2, 8);
    var frameMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(30, 5, 35);
    frame.castShadow = true;
    scene.add(frame);

    var counterweightGeometry = new THREE.BoxGeometry(8, 18, 8);
    var counterweightMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 });
    var counterweight = new THREE.Mesh(counterweightGeometry, counterweightMaterial);
    counterweight.position.set(30, 14, 35);
    counterweight.castShadow = true;
    scene.add(counterweight);

    var beamGeometry = new THREE.BoxGeometry(3, 2, 20);
    var beamMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    var beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(30, 8, 20);
    beam.castShadow = true;
    scene.add(beam);
  };

  var buildUndergroundArmory = function() {
    var entranceGeometry = new THREE.BoxGeometry(12, 18, 3);
    var entranceMaterial = new THREE.MeshPhongMaterial({ color: 0x2f2f2f });
    var entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
    entrance.position.set(0, 12, 42);
    entrance.castShadow = true;
    scene.add(entrance);

    var stairsGeometry = new THREE.BoxGeometry(10, 1, 15);
    var stairsMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var i;
    for (i = 0; i < 10; i++) {
      var stairs = new THREE.Mesh(stairsGeometry, stairsMaterial);
      stairs.position.set(0, 10 - i * 1.5, 40 + i * 1.5);
      stairs.castShadow = true;
      scene.add(stairs);
    }

    var doorGeometry = new THREE.BoxGeometry(10, 16, 0.5);
    var doorMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 12, 30);
    scene.add(door);
  };

  var buildTorchSconces = function() {
    var positions = [
      { x: -40, z: -40 }, { x: 40, z: -40 },
      { x: -40, z: 40 }, { x: 40, z: 40 }
    ];
    var i;
    for (i = 0; i < positions.length; i++) {
      var bracketGeometry = new THREE.CylinderGeometry(1.2, 1, 3, 8);
      var bracketMaterial = new THREE.MeshPhongMaterial({ color: 0x2f2f2f });
      var bracket = new THREE.Mesh(bracketGeometry, bracketMaterial);
      bracket.position.set(positions[i].x, 25, positions[i].z);
      bracket.castShadow = true;
      scene.add(bracket);

      var flameGeometry = new THREE.SphereGeometry(1.5, 8, 8);
      var flameMaterial = new THREE.MeshPhongMaterial({ color: 0xff6600, emissive: 0xff3300 });
      var flame = new THREE.Mesh(flameGeometry, flameMaterial);
      flame.position.set(positions[i].x, 27, positions[i].z);
      flame.userData.baseScale = 1;
      torches.push(flame);
      scene.add(flame);

      var torchLight = new THREE.PointLight(0xff6600, 0.8, 40);
      torchLight.position.set(positions[i].x, 27, positions[i].z);
      scene.add(torchLight);
    }
  };

  var buildFogClouds = function() {
    var cloudPositions = [
      { x: -30, y: 25, z: -30 }, { x: 30, y: 20, z: 30 },
      { x: 0, y: 30, z: -50 }, { x: 50, y: 25, z: 0 },
      { x: -50, y: 22, z: 20 }
    ];
    var i;
    for (i = 0; i < cloudPositions.length; i++) {
      var cloudGeometry = new THREE.SphereGeometry(15, 8, 8);
      var cloudMaterial = new THREE.MeshBasicMaterial({
        color: 0xf0f8ff,
        transparent: true,
        opacity: 0.3
      });
      var cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloud.position.set(cloudPositions[i].x, cloudPositions[i].y, cloudPositions[i].z);
      cloud.userData.basePos = {
        x: cloudPositions[i].x,
        y: cloudPositions[i].y,
        z: cloudPositions[i].z
      };
      cloud.userData.offset = 0;
      fogClouds.push(cloud);
      scene.add(cloud);
    }
  };

  var update = function(delta) {
    var i;

    for (i = 0; i < torches.length; i++) {
      var flicker = 1 + Math.sin(Date.now() * 0.01 + i) * 0.2;
      torches[i].scale.set(flicker, flicker, flicker);
    }

    if (radarDish) {
      radarDish.rotation.y += delta * 1.5;
    }

    if (catapultArm) {
      var swayAngle = Math.sin(Date.now() * 0.001) * 0.1;
      catapultArm.rotation.z = swayAngle;
    }

    for (i = 0; i < fogClouds.length; i++) {
      fogClouds[i].userData.offset += delta * 0.3;
      var driftX = Math.sin(fogClouds[i].userData.offset) * 5;
      var driftZ = Math.cos(fogClouds[i].userData.offset * 0.7) * 5;
      fogClouds[i].position.x = fogClouds[i].userData.basePos.x + driftX;
      fogClouds[i].position.z = fogClouds[i].userData.basePos.z + driftZ;
    }

    if (bannerPole) {
      var waveAngle = Math.sin(Date.now() * 0.003) * 0.15;
      bannerPole.rotation.z = waveAngle;
    }
  };

  var reset = function() {
    torches = [];
    fogClouds = [];
    radarDish = null;
    bannerPole = null;
    catapultArm = null;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
