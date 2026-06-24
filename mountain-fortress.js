window.MountainFortress = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animations = {};
  var time = 0;

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    animations = {
      drawbridgeAngle: 0,
      catapultAngle: 0,
      cableCarX: 0,
      oilGlow: 0,
      flagWave: 0,
      portcullisY: 0,
      searchlightY: 0
    };
    time = 0;

    // Mountain peak base (ConeGeometry)
    var mountainGeometry = new THREE.ConeGeometry(120, 180, 32);
    var mountainMaterial = new THREE.MeshStandardMaterial({ color: 0x887766 });
    var mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
    mountain.position.set(0, -60, -200);
    scene.add(mountain);
    objects.push(mountain);

    // Snow cap (SphereGeometry)
    var snowCapGeometry = new THREE.SphereGeometry(100, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.35);
    var snowCapMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    var snowCap = new THREE.Mesh(snowCapGeometry, snowCapMaterial);
    snowCap.position.set(0, 90, -200);
    scene.add(snowCap);
    objects.push(snowCap);

    // Fortress walls on cliff (BoxGeometry battlements)
    var wallGeometry = new THREE.BoxGeometry(200, 60, 20);
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x666655 });
    var wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(0, 40, -150);
    scene.add(wall);
    objects.push(wall);

    // Main castle keep (tall BoxGeometry)
    var keepGeometry = new THREE.BoxGeometry(80, 140, 70);
    var keepMaterial = new THREE.MeshStandardMaterial({ color: 0x777766 });
    var keep = new THREE.Mesh(keepGeometry, keepMaterial);
    keep.position.set(0, 50, -180);
    scene.add(keep);
    objects.push(keep);
    animations.keepObj = keep;

    // Keep roof (ConeGeometry)
    var roofGeometry = new THREE.ConeGeometry(50, 60, 8);
    var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x445533 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 130, -180);
    scene.add(roof);
    objects.push(roof);

    // Drawbridge over chasm (BoxGeometry planks)
    var bridgeGeometry = new THREE.BoxGeometry(80, 8, 60);
    var bridgeMaterial = new THREE.MeshStandardMaterial({ color: 0x6B4226 });
    var drawbridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    drawbridge.position.set(0, 20, -120);
    scene.add(drawbridge);
    objects.push(drawbridge);
    animations.drawbridge = drawbridge;

    // Catapult arm (BoxGeometry arm)
    var catapultArmGeometry = new THREE.BoxGeometry(12, 60, 10);
    var catapultArmMaterial = new THREE.MeshStandardMaterial({ color: 0x5C3D1F });
    var catapultArm = new THREE.Mesh(catapultArmGeometry, catapultArmMaterial);
    catapultArm.position.set(-60, 50, -160);
    scene.add(catapultArm);
    objects.push(catapultArm);
    animations.catapultArm = catapultArm;

    // Catapult frame (CylinderGeometry)
    var catapultFrameGeometry = new THREE.CylinderGeometry(25, 25, 15, 8);
    var catapultFrameMaterial = new THREE.MeshStandardMaterial({ color: 0x5C3D1F });
    var catapultFrame = new THREE.Mesh(catapultFrameGeometry, catapultFrameMaterial);
    catapultFrame.position.set(-60, 30, -160);
    scene.add(catapultFrame);
    objects.push(catapultFrame);

    // Watchtower base (BoxGeometry)
    var watchtowerGeometry = new THREE.BoxGeometry(40, 100, 40);
    var watchtowerMaterial = new THREE.MeshStandardMaterial({ color: 0x666655 });
    var watchtower = new THREE.Mesh(watchtowerGeometry, watchtowerMaterial);
    watchtower.position.set(80, 50, -180);
    scene.add(watchtower);
    objects.push(watchtower);

    // Watchtower searchlight (CylinderGeometry)
    var searchlightGeometry = new THREE.CylinderGeometry(15, 15, 8, 16);
    var searchlightMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0xFFFF00 });
    var searchlight = new THREE.Mesh(searchlightGeometry, searchlightMaterial);
    searchlight.position.set(80, 110, -180);
    scene.add(searchlight);
    objects.push(searchlight);
    animations.searchlight = searchlight;

    // Supply cable car (BoxGeometry car)
    var cableCarGeometry = new THREE.BoxGeometry(30, 30, 40);
    var cableCarMaterial = new THREE.MeshStandardMaterial({ color: 0x664433 });
    var cableCar = new THREE.Mesh(cableCarGeometry, cableCarMaterial);
    cableCar.position.set(-100, 80, -160);
    scene.add(cableCar);
    objects.push(cableCar);
    animations.cableCar = cableCar;

    // Cable line (LineSegments)
    var cablePoints = [
      new THREE.Vector3(-150, 80, -160),
      new THREE.Vector3(100, 80, -160)
    ];
    var cableGeometry = new THREE.BufferGeometry().setFromPoints(cablePoints);
    var cableMaterial = new THREE.LineBasicMaterial({ color: 0x555555 });
    var cable = new THREE.LineSegments(cableGeometry, cableMaterial);
    scene.add(cable);
    objects.push(cable);

    // Castle gate portcullis (BoxGeometry bars)
    var portcullisGeometry = new THREE.BoxGeometry(70, 80, 8);
    var portcullisMaterial = new THREE.MeshStandardMaterial({ color: 0x555544 });
    var portcullis = new THREE.Mesh(portcullisGeometry, portcullisMaterial);
    portcullis.position.set(0, 40, -250);
    scene.add(portcullis);
    objects.push(portcullis);
    animations.portcullis = portcullis;

    // Battlements with notches (BoxGeometry wall)
    var battlementLeftGeometry = new THREE.BoxGeometry(20, 40, 15);
    var battlementMaterial = new THREE.MeshStandardMaterial({ color: 0x666655 });
    var battlementLeft = new THREE.Mesh(battlementLeftGeometry, battlementMaterial);
    battlementLeft.position.set(-70, 70, -150);
    scene.add(battlementLeft);
    objects.push(battlementLeft);

    var battlementRightGeometry = new THREE.BoxGeometry(20, 40, 15);
    var battlementRight = new THREE.Mesh(battlementMaterial, battlementMaterial);
    battlementRight.position.set(70, 70, -150);
    scene.add(battlementRight);
    objects.push(battlementRight);

    // Hot oil cauldron (CylinderGeometry)
    var cauldronGeometry = new THREE.CylinderGeometry(20, 25, 30, 16);
    var cauldronMaterial = new THREE.MeshStandardMaterial({ color: 0x884422, emissive: 0x442200 });
    var cauldron = new THREE.Mesh(cauldronGeometry, cauldronMaterial);
    cauldron.position.set(-50, 80, -140);
    scene.add(cauldron);
    objects.push(cauldron);
    animations.cauldron = cauldron;

    // Cauldron glow (SphereGeometry)
    var glowGeometry = new THREE.SphereGeometry(25, 16, 16);
    var glowMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6600, emissive: 0xFF6600 });
    var glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(-50, 80, -140);
    scene.add(glow);
    objects.push(glow);
    animations.glow = glow;

    // Cliff rope bridge planks (BoxGeometry)
    var ropeA = new THREE.BoxGeometry(60, 6, 8);
    var ropeMat = new THREE.MeshStandardMaterial({ color: 0x6B4226 });
    var plankA = new THREE.Mesh(ropeA, ropeMat);
    plankA.position.set(-100, 50, -100);
    scene.add(plankA);
    objects.push(plankA);

    // Rope bridge support posts (CylinderGeometry)
    var postGeometry = new THREE.CylinderGeometry(8, 8, 40, 8);
    var postMaterial = new THREE.MeshStandardMaterial({ color: 0x5C4033 });
    var postLeft = new THREE.Mesh(postGeometry, postMaterial);
    postLeft.position.set(-130, 30, -100);
    scene.add(postLeft);
    objects.push(postLeft);

    var postRight = new THREE.Mesh(postGeometry, postMaterial);
    postRight.position.set(-70, 30, -100);
    scene.add(postRight);
    objects.push(postRight);

    // Underground dungeon entrance door (BoxGeometry)
    var dungeonGeometry = new THREE.BoxGeometry(50, 60, 10);
    var dungeonMaterial = new THREE.MeshStandardMaterial({ color: 0x333322 });
    var dungeon = new THREE.Mesh(dungeonGeometry, dungeonMaterial);
    dungeon.position.set(60, 10, -160);
    scene.add(dungeon);
    objects.push(dungeon);

    // Flag pole (CylinderGeometry)
    var flagPoleGeometry = new THREE.CylinderGeometry(5, 5, 80, 8);
    var flagPoleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var flagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
    flagPole.position.set(0, 180, -180);
    scene.add(flagPole);
    objects.push(flagPole);

    // Flag (BoxGeometry)
    var flagGeometry = new THREE.BoxGeometry(40, 25, 2);
    var flagMaterial = new THREE.MeshStandardMaterial({ color: 0xAA2222 });
    var flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(25, 180, -180);
    scene.add(flag);
    objects.push(flag);
    animations.flag = flag;

    // Avalanche warning poles (CylinderGeometry)
    var warningPoleGeometry = new THREE.CylinderGeometry(6, 6, 50, 8);
    var warningPoleMaterial = new THREE.MeshStandardMaterial({ color: 0xCC0000 });
    var warningPole1 = new THREE.Mesh(warningPoleGeometry, warningPoleMaterial);
    warningPole1.position.set(-120, 25, -220);
    scene.add(warningPole1);
    objects.push(warningPole1);

    var warningPole2 = new THREE.Mesh(warningPoleGeometry, warningPoleMaterial);
    warningPole2.position.set(120, 25, -220);
    scene.add(warningPole2);
    objects.push(warningPole2);

    // Detector lights (SphereGeometry)
    var detectorGeometry = new THREE.SphereGeometry(8, 16, 16);
    var detectorMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000 });
    var detector1 = new THREE.Mesh(detectorGeometry, detectorMaterial);
    detector1.position.set(-120, 60, -220);
    scene.add(detector1);
    objects.push(detector1);

    var detector2 = new THREE.Mesh(detectorGeometry, detectorMaterial);
    detector2.position.set(120, 60, -220);
    scene.add(detector2);
    objects.push(detector2);

    // Additional stone block wall (BoxGeometry)
    var stoneWallGeometry = new THREE.BoxGeometry(150, 40, 15);
    var stoneWallMaterial = new THREE.MeshStandardMaterial({ color: 0x555544 });
    var stoneWall = new THREE.Mesh(stoneWallGeometry, stoneWallMaterial);
    stoneWall.position.set(0, 25, -130);
    scene.add(stoneWall);
    objects.push(stoneWall);

    return objects.length;
  };

  var update = function(delta) {
    time += delta;

    // Drawbridge lowers/raises (rotation.x oscillates)
    if (animations.drawbridge) {
      animations.drawbridgeAngle = Math.sin(time * 0.5) * 1.2;
      animations.drawbridge.rotation.x = animations.drawbridgeAngle;
    }

    // Catapult arm swings (rotation.z oscillates)
    if (animations.catapultArm) {
      animations.catapultAngle = Math.sin(time * 0.8) * 0.8;
      animations.catapultArm.rotation.z = animations.catapultAngle;
    }

    // Cable car slides along cable (position.x oscillates)
    if (animations.cableCar) {
      animations.cableCarX = Math.sin(time * 0.3) * 120;
      animations.cableCar.position.x = animations.cableCarX;
    }

    // Hot oil cauldron glows (emissive pulsing)
    if (animations.cauldron) {
      var glowIntensity = 0.3 + Math.sin(time * 1.5) * 0.4;
      animations.cauldron.material.emissive.setHSL(0.08, 1, glowIntensity * 0.5);
    }

    if (animations.glow) {
      var glowScale = 0.8 + Math.sin(time * 1.5) * 0.3;
      animations.glow.scale.set(glowScale, glowScale, glowScale);
      animations.glow.material.emissive.setHSL(0.08, 1, glowIntensity * 0.3);
    }

    // Flag waves (rotation.z oscillates)
    if (animations.flag) {
      animations.flagWave = Math.sin(time * 1.2) * 0.4;
      animations.flag.rotation.z = animations.flagWave;
    }

    // Portcullis raises/lowers (position.y oscillates)
    if (animations.portcullis) {
      animations.portcullisY = Math.sin(time * 0.6) * 40;
      animations.portcullis.position.y = 40 + animations.portcullisY;
    }

    // Searchlight sweeps (rotation.y oscillates)
    if (animations.searchlight) {
      animations.searchlightY = Math.sin(time * 0.4) * 1.5;
      animations.searchlight.rotation.y = animations.searchlightY;
    }
  };

  var reset = function() {
    if (scene && objects.length > 0) {
      for (var i = 0; i < objects.length; i++) {
        scene.remove(objects[i]);
      }
    }
    objects = [];
    animations = {};
    time = 0;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
