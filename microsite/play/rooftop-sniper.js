window.RooftopSniper = (function() {
  'use strict';

  var rooftopGroup = null;
  var acFans = [];
  var antennaBeacon = null;
  var billboardFlags = [];
  var rappelRopes = [];
  var solarPanels = [];
  var watchtowerSpotlight = null;
  var animationState = {
    time: 0,
    fanRotation: 0,
    beaconIntensity: 0.5,
    flagWave: 0
  };

  var init = function(scene, camera) {
    rooftopGroup = new THREE.Group();
    scene.add(rooftopGroup);

    // Main rooftop platform - multi-level
    var mainRoof = new THREE.Mesh(
      new THREE.BoxGeometry(120, 2, 140),
      new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
    );
    mainRoof.position.y = 0;
    rooftopGroup.add(mainRoof);

    // Secondary elevated platform
    var secondRoof = new THREE.Mesh(
      new THREE.BoxGeometry(80, 2, 100),
      new THREE.MeshLambertMaterial({ color: 0x5a5a5a })
    );
    secondRoof.position.set(-35, 8, 30);
    rooftopGroup.add(secondRoof);

    // Tertiary high platform
    var thirdRoof = new THREE.Mesh(
      new THREE.BoxGeometry(60, 2, 70),
      new THREE.MeshLambertMaterial({ color: 0x555555})
    );
    thirdRoof.position.set(40, 15, -40);
    rooftopGroup.add(thirdRoof);

    // Water tower - cylindrical tank on legs
    var waterTankBody = new THREE.Mesh(
      new THREE.CylinderGeometry(12, 12, 20, 32),
      new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 })
    );
    waterTankBody.position.set(-50, 30, 60);
    rooftopGroup.add(waterTankBody);

    var waterTankLeg1 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 12, 16),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    waterTankLeg1.position.set(-58, 8, 52);
    rooftopGroup.add(waterTankLeg1);

    var waterTankLeg2 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 12, 16),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    waterTankLeg2.position.set(-42, 8, 52);
    rooftopGroup.add(waterTankLeg2);

    var waterTankLeg3 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 12, 16),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    waterTankLeg3.position.set(-50, 8, 68);
    rooftopGroup.add(waterTankLeg3);

    var waterTankLeg4 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 12, 16),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    waterTankLeg4.position.set(-50, 8, 52);
    rooftopGroup.add(waterTankLeg4);

    // AC/HVAC units with spinning fans
    for (var i = 0; i < 3; i++) {
      var acUnit = new THREE.Mesh(
        new THREE.BoxGeometry(8, 6, 10),
        new THREE.MeshLambertMaterial({ color: 0xcccccc })
      );
      acUnit.position.set(20 + i * 18, 2, -50);
      rooftopGroup.add(acUnit);

      // Fan outlet
      var fan = new THREE.Mesh(
        new THREE.CylinderGeometry(4, 4, 0.5, 32),
        new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6 })
      );
      fan.rotation.z = Math.PI / 2;
      fan.position.set(20 + i * 18, 6, -50);
      rooftopGroup.add(fan);
      acFans.push(fan);
    }

    // Billboard frame structure
    var billboardBase = new THREE.Mesh(
      new THREE.BoxGeometry(2, 30, 2),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    billboardBase.position.set(60, 35, -70);
    rooftopGroup.add(billboardBase);

    var billboardTop = new THREE.Mesh(
      new THREE.BoxGeometry(50, 2, 2),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    billboardTop.position.set(60, 52, -70);
    rooftopGroup.add(billboardTop);

    // Billboard flags (oscillating panels)
    for (var j = 0; j < 2; j++) {
      var flag = new THREE.Mesh(
        new THREE.BoxGeometry(20, 20, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0x550000 })
      );
      flag.position.set(40 + j * 40, 42, -70.5);
      flag.userData.originalQuaternion = flag.quaternion.clone();
      flag.userData.flagIndex = j;
      rooftopGroup.add(flag);
      billboardFlags.push(flag);
    }

    // Rappelling ropes - dangling LineSegments
    for (var k = 0; k < 4; k++) {
      var ropeGeometry = new THREE.BufferGeometry();
      var ropePoints = [
        new THREE.Vector3(-40 + k * 30, 20, 0),
        new THREE.Vector3(-40 + k * 30, -5, 0)
      ];
      ropeGeometry.setFromPoints(ropePoints);
      var ropeLine = new THREE.LineSegments(
        ropeGeometry,
        new THREE.LineBasicMaterial({ color: 0xaa8844, linewidth: 2 })
      );
      rooftopGroup.add(ropeLine);
      rappelRopes.push({ mesh: ropeLine, swayOffset: Math.random() * Math.PI * 2 });
    }

    // Skylight frame and glass
    var skylightFrame = new THREE.Mesh(
      new THREE.BoxGeometry(25, 1, 20),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    skylightFrame.position.set(0, 1.5, 50);
    rooftopGroup.add(skylightFrame);

    var skylightGlass = new THREE.Mesh(
      new THREE.BoxGeometry(24, 0.3, 19),
      new THREE.MeshStandardMaterial({
        color: 0x4488ff,
        metalness: 0.1,
        roughness: 0.1,
        transparent: true,
        opacity: 0.4
      })
    );
    skylightGlass.position.set(0, 2.2, 50);
    rooftopGroup.add(skylightGlass);

    // Elevator housing - concrete block
    var elevatorHousing = new THREE.Mesh(
      new THREE.BoxGeometry(12, 25, 14),
      new THREE.MeshLambertMaterial({ color: 0x6b6b6b })
    );
    elevatorHousing.position.set(-60, 12.5, 0);
    rooftopGroup.add(elevatorHousing);

    // Elevator door detail
    var elevatorDoor = new THREE.Mesh(
      new THREE.BoxGeometry(8, 18, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.7 })
    );
    elevatorDoor.position.set(-60, 12, 7.5);
    rooftopGroup.add(elevatorDoor);

    // Exhaust vents
    for (var m = 0; m < 3; m++) {
      var vent = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2.5, 6, 16),
        new THREE.MeshLambertMaterial({ color: 0x444444 })
      );
      vent.position.set(30 + m * 20, 4, 80);
      rooftopGroup.add(vent);
    }

    // Parapet walls - low perimeter barriers
    var parapetFront = new THREE.Mesh(
      new THREE.BoxGeometry(120, 3, 2),
      new THREE.MeshLambertMaterial({ color: 0x5a5a5a })
    );
    parapetFront.position.set(0, 2.5, -70);
    rooftopGroup.add(parapetFront);

    var parapetBack = new THREE.Mesh(
      new THREE.BoxGeometry(120, 3, 2),
      new THREE.MeshLambertMaterial({ color: 0x5a5a5a })
    );
    parapetBack.position.set(0, 2.5, 70);
    rooftopGroup.add(parapetBack);

    var parapetLeft = new THREE.Mesh(
      new THREE.BoxGeometry(2, 3, 140),
      new THREE.MeshLambertMaterial({ color: 0x5a5a5a })
    );
    parapetLeft.position.set(-60, 2.5, 0);
    rooftopGroup.add(parapetLeft);

    var parapetRight = new THREE.Mesh(
      new THREE.BoxGeometry(2, 3, 140),
      new THREE.MeshLambertMaterial({ color: 0x5a5a5a })
    );
    parapetRight.position.set(60, 2.5, 0);
    rooftopGroup.add(parapetRight);

    // Antenna cluster - mast with guy wires
    var antennaMast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 30, 8),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    antennaMast.position.set(70, 40, 50);
    rooftopGroup.add(antennaMast);

    // Beacon light on antenna
    var beaconGeometry = new THREE.BufferGeometry();
    var beaconPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 4, 0)];
    beaconGeometry.setFromPoints(beaconPoints);
    antennaBeacon = new THREE.LineSegments(
      beaconGeometry,
      new THREE.LineBasicMaterial({ color: 0xff6600, linewidth: 3 })
    );
    antennaBeacon.position.set(70, 40, 50);
    rooftopGroup.add(antennaBeacon);

    // Guy wires
    var guywire1Geo = new THREE.BufferGeometry();
    guywire1Geo.setFromPoints([
      new THREE.Vector3(70, 40, 50),
      new THREE.Vector3(60, 10, 40)
    ]);
    var guywire1 = new THREE.LineSegments(
      guywire1Geo,
      new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 1 })
    );
    rooftopGroup.add(guywire1);

    var guywire2Geo = new THREE.BufferGeometry();
    guywire2Geo.setFromPoints([
      new THREE.Vector3(70, 40, 50),
      new THREE.Vector3(80, 10, 60)
    ]);
    var guywire2 = new THREE.LineSegments(
      guywire2Geo,
      new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 1 })
    );
    rooftopGroup.add(guywire2);

    // Satellite dish - mesh on arm
    var dishArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    dishArm.rotation.z = Math.PI / 4;
    dishArm.position.set(70, 25, 50);
    rooftopGroup.add(dishArm);

    var dishMesh = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.3, 12),
      new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.8 })
    );
    dishMesh.position.set(78, 28, 50);
    rooftopGroup.add(dishMesh);

    // Sniper nest sandbags
    var sandbag1 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 4),
      new THREE.MeshLambertMaterial({ color: 0x8b7355 })
    );
    sandbag1.position.set(-20, 3, 30);
    rooftopGroup.add(sandbag1);

    var sandbag2 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 4),
      new THREE.MeshLambertMaterial({ color: 0x8b7355 })
    );
    sandbag2.position.set(-16, 3, 30);
    rooftopGroup.add(sandbag2);

    var sandbag3 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 4),
      new THREE.MeshLambertMaterial({ color: 0x8b7355 })
    );
    sandbag3.position.set(-18, 5, 32);
    rooftopGroup.add(sandbag3);

    // Solar panel array
    for (var p = 0; p < 4; p++) {
      for (var q = 0; q < 3; q++) {
        var panel = new THREE.Mesh(
          new THREE.BoxGeometry(8, 0.2, 6),
          new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
        );
        panel.rotation.x = 0.3;
        panel.position.set(-30 + p * 12, 3 + q * 0.5, -40);
        rooftopGroup.add(panel);
        solarPanels.push(panel);
      }
    }

    // Rooftop door access hatches
    var hatch1 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.5, 5),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    );
    hatch1.position.set(50, 2.5, 0);
    rooftopGroup.add(hatch1);

    var hatch2 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.5, 4),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    );
    hatch2.position.set(-40, 10.5, 20);
    rooftopGroup.add(hatch2);

    // Fire escape ladders - LineSegments between levels
    var ladder1Geo = new THREE.BufferGeometry();
    ladder1Geo.setFromPoints([
      new THREE.Vector3(55, 0, -60),
      new THREE.Vector3(55, 15, -60)
    ]);
    var ladder1 = new THREE.LineSegments(
      ladder1Geo,
      new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 })
    );
    rooftopGroup.add(ladder1);

    var ladder2Geo = new THREE.BufferGeometry();
    ladder2Geo.setFromPoints([
      new THREE.Vector3(-25, 8, 20),
      new THREE.Vector3(-25, 20, 20)
    ]);
    var ladder2 = new THREE.LineSegments(
      ladder2Geo,
      new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 })
    );
    rooftopGroup.add(ladder2);

    // Chimney stacks
    var chimney1 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 15, 3),
      new THREE.MeshLambertMaterial({ color: 0x6b4423 })
    );
    chimney1.position.set(35, 10, 45);
    rooftopGroup.add(chimney1);

    var chimney2 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 12, 3),
      new THREE.MeshLambertMaterial({ color: 0x6b4423 })
    );
    chimney2.position.set(-35, 8, -35);
    rooftopGroup.add(chimney2);

    // Utility conduit runs
    var conduit1 = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 50),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    conduit1.position.set(55, 4, 20);
    rooftopGroup.add(conduit1);

    var conduit2 = new THREE.Mesh(
      new THREE.BoxGeometry(40, 0.5, 1),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    conduit2.position.set(-10, 3, 60);
    rooftopGroup.add(conduit2);

    // City skyline backdrop - distant building silhouettes
    var buildingA = new THREE.Mesh(
      new THREE.BoxGeometry(25, 80, 2),
      new THREE.MeshLambertMaterial({ color: 0x1a1a2e })
    );
    buildingA.position.set(-120, 40, -200);
    rooftopGroup.add(buildingA);

    var buildingB = new THREE.Mesh(
      new THREE.BoxGeometry(35, 100, 2),
      new THREE.MeshLambertMaterial({ color: 0x16213e })
    );
    buildingB.position.set(100, 50, -220);
    rooftopGroup.add(buildingB);

    var buildingC = new THREE.Mesh(
      new THREE.BoxGeometry(20, 60, 2),
      new THREE.MeshLambertMaterial({ color: 0x0f3460 })
    );
    buildingC.position.set(200, 30, -180);
    rooftopGroup.add(buildingC);

    var buildingD = new THREE.Mesh(
      new THREE.BoxGeometry(40, 90, 2),
      new THREE.MeshLambertMaterial({ color: 0x1a1a2e })
    );
    buildingD.position.set(-200, 45, -210);
    rooftopGroup.add(buildingD);

    // Ambient and spotlights for atmosphere
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffff99, 0.7);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Watchtower spotlight effect
    watchtowerSpotlight = new THREE.SpotLight(0xff9900, 1, 300, Math.PI / 6, 0.5, 2);
    watchtowerSpotlight.position.set(70, 50, 50);
    watchtowerSpotlight.target.position.set(0, 0, 0);
    scene.add(watchtowerSpotlight);
    scene.add(watchtowerSpotlight.target);
  };

  var update = function(delta) {
    animationState.time += delta;
    animationState.fanRotation += delta * 8;
    animationState.flagWave = Math.sin(animationState.time * 2) * 0.15;
    animationState.beaconIntensity = 0.3 + Math.sin(animationState.time * 4) * 0.4;

    // Spin AC fans
    for (var i = 0; i < acFans.length; i++) {
      acFans[i].rotation.z += delta * 5;
    }

    // Oscillate billboard flags
    for (var j = 0; j < billboardFlags.length; j++) {
      var flag = billboardFlags[j];
      var waveAmount = animationState.flagWave * (j === 0 ? 1 : -0.8);
      flag.rotation.z = waveAmount;
    }

    // Sway rappelling ropes
    for (var k = 0; k < rappelRopes.length; k++) {
      var rope = rappelRopes[k];
      var swayX = Math.sin(animationState.time * 1.5 + rope.swayOffset) * 1.5;
      rope.mesh.position.x = swayX;
    }

    // Beacon flash on antenna
    if (antennaBeacon) {
      antennaBeacon.material.opacity = animationState.beaconIntensity;
    }

    // Watchtower spotlight sweep
    if (watchtowerSpotlight) {
      var spotAngle = animationState.time * 0.5;
      watchtowerSpotlight.target.position.x = Math.cos(spotAngle) * 80;
      watchtowerSpotlight.target.position.z = Math.sin(spotAngle) * 80;
      watchtowerSpotlight.intensity = 0.6 + Math.sin(animationState.time * 3) * 0.3;
    }

    // Slight rotation on solar panels for reflection effect
    for (var p = 0; p < solarPanels.length; p++) {
      solarPanels[p].rotation.y = Math.sin(animationState.time * 0.3 + p * 0.5) * 0.05;
    }
  };

  var reset = function() {
    animationState = {
      time: 0,
      fanRotation: 0,
      beaconIntensity: 0.5,
      flagWave: 0
    };

    for (var i = 0; i < acFans.length; i++) {
      acFans[i].rotation.z = 0;
    }

    for (var j = 0; j < billboardFlags.length; j++) {
      billboardFlags[j].rotation.z = 0;
    }

    for (var k = 0; k < rappelRopes.length; k++) {
      rappelRopes[k].mesh.position.x = 0;
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
