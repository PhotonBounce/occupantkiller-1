window.MineComplex = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var mainShaftGroup = null;
  var elevatorCage = null;
  var elevatorPlatform = null;
  var oreCart = null;
  var ventilationFan = null;
  var floodedWater = null;
  var lightBulbs = null;
  var crushingMachine = null;
  var animationState = {
    elevatorY: 0,
    elevatorDirection: 1,
    elevatorSpeed: 0.03,
    elevatorMin: -50,
    elevatorMax: 30,
    cartX: 0,
    cartDirection: 1,
    cartSpeed: 0.02,
    fanRotation: 0,
    fanSpeed: 0.05,
    waterRipplePhase: 0,
    waterRippleSpeed: 0.02,
    lightFlickerPhase: 0,
    lightFlickerSpeed: 0.08
  };

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    mainShaftGroup = new THREE.Group();
    scene.add(mainShaftGroup);

    createMainShaftHeadframe();
    createElevatorCage();
    createOreTracks();
    createOreCarts();
    createTunnelIntersections();
    createSupportBeams();
    createOreBlastingArea();
    createDrillingEquipment();
    createExplosivesMagazine();
    createFloodedLowerTunnel();
    createVentilationFan();
    createPneumaticHoses();
    createLightingStrings();
    createRockBoltSupports();
    createSpoilHeap();
    createOreProcessingShed();
    createCrusherMachine();
    createCompressedAirTank();
    createEmergencyEscapeLadder();
  };

  var createMainShaftHeadframe = function() {
    var material = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
    var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.2 });

    var headframeGroup = new THREE.Group();
    headframeGroup.position.set(0, 0, 0);

    var verticalPost1 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 45, 2),
      material
    );
    verticalPost1.position.set(-8, 22, -8);
    verticalPost1.castShadow = true;
    headframeGroup.add(verticalPost1);

    var verticalPost2 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 45, 2),
      material
    );
    verticalPost2.position.set(8, 22, -8);
    verticalPost2.castShadow = true;
    headframeGroup.add(verticalPost2);

    var verticalPost3 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 45, 2),
      material
    );
    verticalPost3.position.set(-8, 22, 8);
    verticalPost3.castShadow = true;
    headframeGroup.add(verticalPost3);

    var verticalPost4 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 45, 2),
      material
    );
    verticalPost4.position.set(8, 22, 8);
    verticalPost4.castShadow = true;
    headframeGroup.add(verticalPost4);

    var windingDrum = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 4, 2, 16),
      metalMaterial
    );
    windingDrum.position.set(0, 42, 0);
    windingDrum.rotation.z = Math.PI / 2;
    windingDrum.castShadow = true;
    headframeGroup.add(windingDrum);

    var supportBeam1 = new THREE.Mesh(
      new THREE.BoxGeometry(16, 1, 1),
      material
    );
    supportBeam1.position.set(0, 42, -8);
    supportBeam1.castShadow = true;
    headframeGroup.add(supportBeam1);

    var supportBeam2 = new THREE.Mesh(
      new THREE.BoxGeometry(16, 1, 1),
      material
    );
    supportBeam2.position.set(0, 42, 8);
    supportBeam2.castShadow = true;
    headframeGroup.add(supportBeam2);

    mainShaftGroup.add(headframeGroup);
  };

  var createElevatorCage = function() {
    var platformMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7 });
    var cageMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6 });

    elevatorCage = new THREE.Group();
    elevatorCage.position.set(0, 0, 0);

    elevatorPlatform = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.5, 6),
      platformMaterial
    );
    elevatorPlatform.position.y = animationState.elevatorY;
    elevatorPlatform.castShadow = true;
    elevatorCage.add(elevatorPlatform);

    var cagePoints = [];
    cagePoints.push(new THREE.Vector3(-3, -5, -3));
    cagePoints.push(new THREE.Vector3(3, -5, -3));
    cagePoints.push(new THREE.Vector3(3, -5, 3));
    cagePoints.push(new THREE.Vector3(-3, -5, 3));
    cagePoints.push(new THREE.Vector3(-3, -5, -3));

    var cageGeometry = new THREE.BufferGeometry().setFromPoints(cagePoints);
    var cageLines = new THREE.LineSegments(
      cageGeometry,
      new THREE.LineBasicMaterial({ color: 0x999999, linewidth: 2 })
    );
    cageLines.position.y = animationState.elevatorY;
    elevatorCage.add(cageLines);

    var verticalLine1 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-3, -5, -3),
      new THREE.Vector3(-3, 5, -3)
    ]);
    var vLine1 = new THREE.LineSegments(
      verticalLine1,
      new THREE.LineBasicMaterial({ color: 0x999999, linewidth: 1 })
    );
    vLine1.position.y = animationState.elevatorY;
    elevatorCage.add(vLine1);

    var verticalLine2 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(3, -5, -3),
      new THREE.Vector3(3, 5, -3)
    ]);
    var vLine2 = new THREE.LineSegments(
      verticalLine2,
      new THREE.LineBasicMaterial({ color: 0x999999, linewidth: 1 })
    );
    vLine2.position.y = animationState.elevatorY;
    elevatorCage.add(vLine2);

    var verticalLine3 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(3, -5, 3),
      new THREE.Vector3(3, 5, 3)
    ]);
    var vLine3 = new THREE.LineSegments(
      verticalLine3,
      new THREE.LineBasicMaterial({ color: 0x999999, linewidth: 1 })
    );
    vLine3.position.y = animationState.elevatorY;
    elevatorCage.add(vLine3);

    var verticalLine4 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-3, -5, 3),
      new THREE.Vector3(-3, 5, 3)
    ]);
    var vLine4 = new THREE.LineSegments(
      verticalLine4,
      new THREE.LineBasicMaterial({ color: 0x999999, linewidth: 1 })
    );
    vLine4.position.y = animationState.elevatorY;
    elevatorCage.add(vLine4);

    mainShaftGroup.add(elevatorCage);
  };

  var createOreTracks = function() {
    var railMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 });
    var tieMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3a2a });

    var tracksGroup = new THREE.Group();
    tracksGroup.position.set(-15, -35, 0);

    for (var i = 0; i < 30; i++) {
      var rail1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.2, 40),
        railMaterial
      );
      rail1.position.set(-2, 0, i * 1.5 - 30);
      rail1.castShadow = true;
      tracksGroup.add(rail1);

      var rail2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.2, 40),
        railMaterial
      );
      rail2.position.set(2, 0, i * 1.5 - 30);
      rail2.castShadow = true;
      tracksGroup.add(rail2);

      if (i % 3 === 0) {
        var tie = new THREE.Mesh(
          new THREE.BoxGeometry(5, 0.3, 0.5),
          tieMaterial
        );
        tie.position.set(0, -0.2, i * 1.5 - 30);
        tie.castShadow = true;
        tracksGroup.add(tie);
      }
    }

    mainShaftGroup.add(tracksGroup);
  };

  var createOreCarts = function() {
    var cartMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });

    oreCart = new THREE.Group();
    oreCart.position.set(-15, -33, 0);

    var cartBody = new THREE.Mesh(
      new THREE.BoxGeometry(4, 2, 6),
      cartMaterial
    );
    cartBody.position.set(0, 0, 0);
    cartBody.castShadow = true;
    oreCart.add(cartBody);

    var wheel1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.4, 16),
      wheelMaterial
    );
    wheel1.position.set(-1.5, -1.2, -2);
    wheel1.rotation.z = Math.PI / 2;
    wheel1.castShadow = true;
    oreCart.add(wheel1);

    var wheel2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.4, 16),
      wheelMaterial
    );
    wheel2.position.set(1.5, -1.2, -2);
    wheel2.rotation.z = Math.PI / 2;
    wheel2.castShadow = true;
    oreCart.add(wheel2);

    var wheel3 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.4, 16),
      wheelMaterial
    );
    wheel3.position.set(-1.5, -1.2, 2);
    wheel3.rotation.z = Math.PI / 2;
    wheel3.castShadow = true;
    oreCart.add(wheel3);

    var wheel4 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.4, 16),
      wheelMaterial
    );
    wheel4.position.set(1.5, -1.2, 2);
    wheel4.rotation.z = Math.PI / 2;
    wheel4.castShadow = true;
    oreCart.add(wheel4);

    mainShaftGroup.add(oreCart);
  };

  var createTunnelIntersections = function() {
    var rockMaterial = new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.9 });

    var tunnel1 = new THREE.Group();
    tunnel1.position.set(-40, -30, 0);

    var wallTop = new THREE.Mesh(
      new THREE.BoxGeometry(30, 1, 20),
      rockMaterial
    );
    wallTop.position.set(0, 8, 0);
    wallTop.castShadow = true;
    tunnel1.add(wallTop);

    var wallLeft = new THREE.Mesh(
      new THREE.BoxGeometry(1, 16, 20),
      rockMaterial
    );
    wallLeft.position.set(-15, 0, 0);
    wallLeft.castShadow = true;
    tunnel1.add(wallLeft);

    var wallRight = new THREE.Mesh(
      new THREE.BoxGeometry(1, 16, 20),
      rockMaterial
    );
    wallRight.position.set(15, 0, 0);
    wallRight.castShadow = true;
    tunnel1.add(wallRight);

    mainShaftGroup.add(tunnel1);

    var tunnel2 = new THREE.Group();
    tunnel2.position.set(30, -25, -50);

    var wallTop2 = new THREE.Mesh(
      new THREE.BoxGeometry(25, 1, 30),
      rockMaterial
    );
    wallTop2.position.set(0, 8, 0);
    wallTop2.castShadow = true;
    tunnel2.add(wallTop2);

    var wallLeft2 = new THREE.Mesh(
      new THREE.BoxGeometry(1, 16, 30),
      rockMaterial
    );
    wallLeft2.position.set(-12.5, 0, 0);
    wallLeft2.castShadow = true;
    tunnel2.add(wallLeft2);

    var wallRight2 = new THREE.Mesh(
      new THREE.BoxGeometry(1, 16, 30),
      rockMaterial
    );
    wallRight2.position.set(12.5, 0, 0);
    wallRight2.castShadow = true;
    tunnel2.add(wallRight2);

    mainShaftGroup.add(tunnel2);
  };

  var createSupportBeams = function() {
    var woodMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 });

    var beamGroup = new THREE.Group();
    beamGroup.position.set(-20, -20, -30);

    for (var i = 0; i < 5; i++) {
      var post = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 10, 0.5),
        woodMaterial
      );
      post.position.set(-8 + i * 4, 5, 0);
      post.castShadow = true;
      beamGroup.add(post);

      var arch = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.5, 0.5),
        woodMaterial
      );
      arch.position.set(-8 + i * 4, 10, 0);
      arch.castShadow = true;
      beamGroup.add(arch);
    }

    mainShaftGroup.add(beamGroup);
  };

  var createOreBlastingArea = function() {
    var rockFaceMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.95 });

    var blastGroup = new THREE.Group();
    blastGroup.position.set(40, -40, 20);

    var rockFace = new THREE.Mesh(
      new THREE.BoxGeometry(20, 15, 2),
      rockFaceMaterial
    );
    rockFace.position.set(0, 8, 0);
    rockFace.castShadow = true;
    blastGroup.add(rockFace);

    for (var i = 0; i < 8; i++) {
      var boltHole = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x000000 })
      );
      boltHole.position.set(-8 + i * 2.5, 5 + Math.random() * 8, 0.5);
      blastGroup.add(boltHole);
    }

    mainShaftGroup.add(blastGroup);
  };

  var createDrillingEquipment = function() {
    var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });

    var drillGroup = new THREE.Group();
    drillGroup.position.set(50, -30, -40);

    var drillBody = new THREE.Mesh(
      new THREE.BoxGeometry(3, 8, 3),
      metalMaterial
    );
    drillBody.castShadow = true;
    drillGroup.add(drillBody);

    var drillShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 12, 16),
      metalMaterial
    );
    drillShaft.position.set(0, 4, 0);
    drillShaft.castShadow = true;
    drillGroup.add(drillShaft);

    var drillBit = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 2, 16),
      metalMaterial
    );
    drillBit.position.set(0, 10, 0);
    drillBit.castShadow = true;
    drillGroup.add(drillBit);

    mainShaftGroup.add(drillGroup);
  };

  var createExplosivesMagazine = function() {
    var roomMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });

    var magazineGroup = new THREE.Group();
    magazineGroup.position.set(-60, -40, 30);

    var walls = new THREE.Mesh(
      new THREE.BoxGeometry(8, 8, 8),
      roomMaterial
    );
    walls.castShadow = true;
    magazineGroup.add(walls);

    var door = new THREE.Mesh(
      new THREE.BoxGeometry(2, 5, 0.3),
      doorMaterial
    );
    door.position.set(-3.85, -1.5, 4.15);
    door.castShadow = true;
    magazineGroup.add(door);

    var lockBolt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.3, 12),
      new THREE.MeshStandardMaterial({ color: 0xFFD700 })
    );
    lockBolt.position.set(-3.85, 0, 4.3);
    lockBolt.rotation.z = Math.PI / 2;
    magazineGroup.add(lockBolt);

    mainShaftGroup.add(magazineGroup);
  };

  var createFloodedLowerTunnel = function() {
    var waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a1a3a,
      metalness: 0.3,
      roughness: 0.2,
      emissive: 0x001a4d,
      emissiveIntensity: 0.2
    });

    var floodGroup = new THREE.Group();
    floodGroup.position.set(0, -70, 0);

    floodedWater = new THREE.Mesh(
      new THREE.BoxGeometry(60, 1, 60),
      waterMaterial
    );
    floodedWater.receiveShadow = true;
    floodGroup.add(floodedWater);

    var tunnel = new THREE.Mesh(
      new THREE.BoxGeometry(30, 20, 40),
      new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 })
    );
    tunnel.position.set(0, 10, 0);
    tunnel.castShadow = true;
    floodGroup.add(tunnel);

    mainShaftGroup.add(floodGroup);
  };

  var createVentilationFan = function() {
    var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7 });

    ventilationFan = new THREE.Group();
    ventilationFan.position.set(-50, 10, -60);

    var fan = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 0.5, 16),
      metalMaterial
    );
    fan.castShadow = true;
    ventilationFan.add(fan);

    var blade1 = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.2, 0.5),
      metalMaterial
    );
    blade1.castShadow = true;
    ventilationFan.add(blade1);

    var blade2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.2, 6),
      metalMaterial
    );
    blade2.castShadow = true;
    ventilationFan.add(blade2);

    var shroud = new THREE.Mesh(
      new THREE.BoxGeometry(7, 7, 1),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    shroud.position.z = -0.75;
    shroud.castShadow = true;
    ventilationFan.add(shroud);

    mainShaftGroup.add(ventilationFan);
  };

  var createPneumaticHoses = function() {
    var hoseColor = 0xFF6B6B;

    var hose1Points = [];
    hose1Points.push(new THREE.Vector3(0, 0, 0));
    hose1Points.push(new THREE.Vector3(10, 5, 0));
    hose1Points.push(new THREE.Vector3(20, 10, 10));

    var hoseGeometry1 = new THREE.BufferGeometry().setFromPoints(hose1Points);
    var hoseLines1 = new THREE.LineSegments(
      hoseGeometry1,
      new THREE.LineBasicMaterial({ color: hoseColor, linewidth: 3 })
    );
    hoseLines1.position.set(-40, -20, -50);
    mainShaftGroup.add(hoseLines1);

    var hose2Points = [];
    hose2Points.push(new THREE.Vector3(0, 0, 0));
    hose2Points.push(new THREE.Vector3(-15, 8, 5));
    hose2Points.push(new THREE.Vector3(-20, 15, 15));

    var hoseGeometry2 = new THREE.BufferGeometry().setFromPoints(hose2Points);
    var hoseLines2 = new THREE.LineSegments(
      hoseGeometry2,
      new THREE.LineBasicMaterial({ color: hoseColor, linewidth: 3 })
    );
    hoseLines2.position.set(30, -15, 0);
    mainShaftGroup.add(hoseLines2);
  };

  var createLightingStrings = function() {
    lightBulbs = new THREE.Group();

    for (var i = 0; i < 15; i++) {
      var x = -40 + i * 6;
      var y = 5;
      var z = -30 + Math.sin(i) * 10;

      var bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xFFFF99,
          emissive: 0xFFFF00,
          emissiveIntensity: 0.8
        })
      );
      bulb.position.set(x, y, z);
      bulb.castShadow = true;
      lightBulbs.add(bulb);
    }

    var wirePoints = [];
    for (var j = 0; j < 15; j++) {
      var wx = -40 + j * 6;
      var wy = 5;
      var wz = -30 + Math.sin(j) * 10;
      wirePoints.push(new THREE.Vector3(wx, wy, wz));
    }

    var wireGeometry = new THREE.BufferGeometry().setFromPoints(wirePoints);
    var wireLines = new THREE.LineSegments(
      wireGeometry,
      new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 1 })
    );
    lightBulbs.add(wireLines);

    mainShaftGroup.add(lightBulbs);
  };

  var createRockBoltSupports = function() {
    var boltMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });

    var boltsGroup = new THREE.Group();
    boltsGroup.position.set(20, -25, -60);

    for (var i = 0; i < 12; i++) {
      var bolt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 4, 12),
        boltMaterial
      );
      bolt.position.set(-10 + i * 2, 5 + Math.random() * 8, 0);
      bolt.rotation.z = Math.PI / 3;
      bolt.castShadow = true;
      boltsGroup.add(bolt);
    }

    mainShaftGroup.add(boltsGroup);
  };

  var createSpoilHeap = function() {
    var spoilMaterial = new THREE.MeshStandardMaterial({ color: 0x6B5D47, roughness: 0.95 });

    var spoilGroup = new THREE.Group();
    spoilGroup.position.set(60, -50, 50);

    for (var i = 0; i < 8; i++) {
      var rock = new THREE.Mesh(
        new THREE.BoxGeometry(3 + Math.random() * 2, 2 + Math.random() * 2, 3 + Math.random() * 2),
        spoilMaterial
      );
      rock.position.set(-10 + i * 3, i * 0.5, -5 + Math.random() * 10);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      spoilGroup.add(rock);
    }

    mainShaftGroup.add(spoilGroup);
  };

  var createOreProcessingShed = function() {
    var shedMaterial = new THREE.MeshStandardMaterial({ color: 0x556B2F });
    var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });

    var shedGroup = new THREE.Group();
    shedGroup.position.set(70, -45, 0);

    var shedWalls = new THREE.Mesh(
      new THREE.BoxGeometry(15, 10, 12),
      shedMaterial
    );
    shedWalls.castShadow = true;
    shedGroup.add(shedWalls);

    var shedRoof = new THREE.Mesh(
      new THREE.BoxGeometry(16, 1, 13),
      roofMaterial
    );
    shedRoof.position.y = 5.5;
    shedRoof.castShadow = true;
    shedGroup.add(shedRoof);

    var shedDoor = new THREE.Mesh(
      new THREE.BoxGeometry(3, 6, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x654321 })
    );
    shedDoor.position.set(-7.15, -2, 6.15);
    shedDoor.castShadow = true;
    shedGroup.add(shedDoor);

    mainShaftGroup.add(shedGroup);
  };

  var createCrusherMachine = function() {
    var heavyMetalMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.1 });

    crushingMachine = new THREE.Group();
    crushingMachine.position.set(85, -40, 0);

    var frame = new THREE.Mesh(
      new THREE.BoxGeometry(8, 12, 6),
      heavyMetalMaterial
    );
    frame.castShadow = true;
    crushingMachine.add(frame);

    var upperJaw = new THREE.Mesh(
      new THREE.BoxGeometry(7, 2, 5),
      heavyMetalMaterial
    );
    upperJaw.position.set(0, 4, 0);
    upperJaw.castShadow = true;
    crushingMachine.add(upperJaw);

    var hopper = new THREE.Mesh(
      new THREE.BoxGeometry(6, 4, 5),
      new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    hopper.position.set(0, 8, 0);
    hopper.castShadow = true;
    crushingMachine.add(hopper);

    mainShaftGroup.add(crushingMachine);
  };

  var createCompressedAirTank = function() {
    var tankMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8 });

    var tankGroup = new THREE.Group();
    tankGroup.position.set(-70, -35, 60);

    var tank = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 8, 16),
      tankMaterial
    );
    tank.castShadow = true;
    tankGroup.add(tank);

    var endCap1 = new THREE.Mesh(
      new THREE.SphereGeometry(2, 16, 16),
      tankMaterial
    );
    endCap1.position.y = 4;
    endCap1.scale.z = 0.5;
    endCap1.castShadow = true;
    tankGroup.add(endCap1);

    var endCap2 = new THREE.Mesh(
      new THREE.SphereGeometry(2, 16, 16),
      tankMaterial
    );
    endCap2.position.y = -4;
    endCap2.scale.z = 0.5;
    endCap2.castShadow = true;
    tankGroup.add(endCap2);

    var valve = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 1, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xFFD700 })
    );
    valve.position.set(2.2, 1, 0);
    valve.castShadow = true;
    tankGroup.add(valve);

    mainShaftGroup.add(tankGroup);
  };

  var createEmergencyEscapeLadder = function() {
    var railMaterial = new THREE.MeshStandardMaterial({ color: 0xAA8844, roughness: 0.6 });

    var ladderGroup = new THREE.Group();
    ladderGroup.position.set(-80, -30, -70);

    for (var i = 0; i < 20; i++) {
      var rung = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.2, 0.2),
        railMaterial
      );
      rung.position.y = i * 1.2;
      rung.castShadow = true;
      ladderGroup.add(rung);
    }

    var leftRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 24, 0.2),
      railMaterial
    );
    leftRail.position.set(-1.2, 12, 0);
    leftRail.castShadow = true;
    ladderGroup.add(leftRail);

    var rightRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 24, 0.2),
      railMaterial
    );
    rightRail.position.set(1.2, 12, 0);
    rightRail.castShadow = true;
    ladderGroup.add(rightRail);

    mainShaftGroup.add(ladderGroup);
  };

  var update = function(delta) {
    if (!elevatorPlatform || !oreCart || !ventilationFan || !floodedWater || !lightBulbs) {
      return;
    }

    animationState.elevatorY += animationState.elevatorSpeed * animationState.elevatorDirection;
    if (animationState.elevatorY >= animationState.elevatorMax || animationState.elevatorY <= animationState.elevatorMin) {
      animationState.elevatorDirection *= -1;
    }

    elevatorPlatform.position.y = animationState.elevatorY;
    for (var i = 0; i < elevatorCage.children.length; i++) {
      if (elevatorCage.children[i].type === 'LineSegments') {
        elevatorCage.children[i].position.y = animationState.elevatorY;
      }
    }

    animationState.cartX += animationState.cartSpeed * animationState.cartDirection;
    if (animationState.cartX > 40 || animationState.cartX < -40) {
      animationState.cartDirection *= -1;
    }
    oreCart.position.z = animationState.cartX;

    animationState.fanRotation += animationState.fanSpeed;
    ventilationFan.rotation.z = animationState.fanRotation;

    animationState.waterRipplePhase += animationState.waterRippleSpeed;
    var rippleAmount = Math.sin(animationState.waterRipplePhase) * 0.05;
    floodedWater.scale.y = 1 + rippleAmount;

    animationState.lightFlickerPhase += animationState.lightFlickerSpeed;
    var flicker = 0.6 + Math.sin(animationState.lightFlickerPhase * 2) * 0.3 + Math.random() * 0.1;
    for (var j = 0; j < lightBulbs.children.length; j++) {
      if (lightBulbs.children[j].type === 'Mesh') {
        lightBulbs.children[j].material.emissiveIntensity = flicker;
      }
    }
  };

  var reset = function() {
    animationState.elevatorY = 0;
    animationState.elevatorDirection = 1;
    animationState.cartX = 0;
    animationState.cartDirection = 1;
    animationState.fanRotation = 0;
    animationState.waterRipplePhase = 0;
    animationState.lightFlickerPhase = 0;

    if (elevatorPlatform) {
      elevatorPlatform.position.y = 0;
    }
    if (oreCart) {
      oreCart.position.z = 0;
    }
    if (ventilationFan) {
      ventilationFan.rotation.z = 0;
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
