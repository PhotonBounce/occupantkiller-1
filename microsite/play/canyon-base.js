window.CanyonBase = (function() {
  'use strict';

  // Private state variables
  var scene = null;
  var camera = null;
  var canyonGroup = null;
  var riverMaterial = null;
  var ropeBridges = [];
  var rappelRopes = [];
  var riverWaves = [];
  var pulleySystem = null;
  var animationTime = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    canyonGroup = new THREE.Group();
    canyonGroup.name = 'CanyonBase';
    scene.add(canyonGroup);

    // Create lighting
    var sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(100, 150, 100);
    sunLight.castShadow = true;
    canyonGroup.add(sunLight);

    var ambientLight = new THREE.AmbientLight(0xccccdd, 0.5);
    canyonGroup.add(ambientLight);

    // Canyon walls - tall red sandstone faces on both sides
    var wallMaterialLeft = new THREE.MeshPhongMaterial({ color: 0xcc6633, roughness: 0.8 });
    var wallMaterialRight = new THREE.MeshPhongMaterial({ color: 0xdd7744, roughness: 0.8 });

    var leftWallGeom = new THREE.BoxGeometry(40, 300, 800);
    var leftWall = new THREE.Mesh(leftWallGeom, wallMaterialLeft);
    leftWall.position.set(-120, 0, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    canyonGroup.add(leftWall);

    var rightWallGeom = new THREE.BoxGeometry(40, 300, 800);
    var rightWall = new THREE.Mesh(rightWallGeom, wallMaterialRight);
    rightWall.position.set(120, 0, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    canyonGroup.add(rightWall);

    // Canyon floor - sandy bottom
    var floorMaterial = new THREE.MeshPhongMaterial({ color: 0xdaa520, roughness: 0.9 });
    var floorGeom = new THREE.BoxGeometry(240, 8, 800);
    var floor = new THREE.Mesh(floorGeom, floorMaterial);
    floor.position.set(0, -160, 0);
    floor.castShadow = true;
    floor.receiveShadow = true;
    canyonGroup.add(floor);

    // River running through - blue-green narrow
    riverMaterial = new THREE.MeshPhongMaterial({ color: 0x1a5f4a, emissive: 0x0a3f2a, wireframe: false });
    var riverGeom = new THREE.BoxGeometry(20, 4, 800);
    var river = new THREE.Mesh(riverGeom, riverMaterial);
    river.position.set(0, -156, 0);
    river.receiveShadow = true;
    canyonGroup.add(river);
    riverWaves.push(river);

    // Carved building facades - rooms built into cliff face
    var buildingMat = new THREE.MeshPhongMaterial({ color: 0x8b5a3c });

    // Left side buildings
    var building1Geom = new THREE.BoxGeometry(35, 60, 50);
    var building1 = new THREE.Mesh(building1Geom, buildingMat);
    building1.position.set(-107, 20, -200);
    building1.castShadow = true;
    building1.receiveShadow = true;
    canyonGroup.add(building1);

    var building2Geom = new THREE.BoxGeometry(35, 50, 45);
    var building2 = new THREE.Mesh(building2Geom, buildingMat);
    building2.position.set(-107, 50, 100);
    building2.castShadow = true;
    building2.receiveShadow = true;
    canyonGroup.add(building2);

    // Right side buildings
    var building3Geom = new THREE.BoxGeometry(35, 60, 50);
    var building3 = new THREE.Mesh(building3Geom, buildingMat);
    building3.position.set(107, 25, -100);
    building3.castShadow = true;
    building3.receiveShadow = true;
    canyonGroup.add(building3);

    var building4Geom = new THREE.BoxGeometry(35, 55, 40);
    var building4 = new THREE.Mesh(building4Geom, buildingMat);
    building4.position.set(107, 60, 250);
    building4.castShadow = true;
    building4.receiveShadow = true;
    canyonGroup.add(building4);

    // Rope bridges - LineSegments + BoxGeometry planks
    createRopeBridge(-40, 80, -300, 40, 80, -300);
    createRopeBridge(-40, 100, 50, 40, 100, 50);
    createRopeBridge(-70, 120, 300, 70, 120, 300);

    // Rappelling anchor points - BoxGeometry + LineSegments
    createRappelAnchor(-100, 140, -150);
    createRappelAnchor(100, 140, 50);
    createRappelAnchor(-90, 150, 200);
    createRappelAnchor(95, 135, -350);

    // Carved steps in cliff - ascending zigzag
    var stepMat = new THREE.MeshPhongMaterial({ color: 0x996633 });
    for (var i = 0; i < 8; i++) {
      var stepGeom = new THREE.BoxGeometry(30, 8, 25);
      var step = new THREE.Mesh(stepGeom, stepMat);
      step.position.set(-110, -100 + i * 25, -250 + i * 30);
      step.castShadow = true;
      step.receiveShadow = true;
      canyonGroup.add(step);
    }

    // Natural cave opening - dark interior
    var caveMat = new THREE.MeshPhongMaterial({ color: 0x2a2a2a, emissive: 0x0a0a0a });
    var caveGeom = new THREE.BoxGeometry(80, 100, 60);
    var cave = new THREE.Mesh(caveGeom, caveMat);
    cave.position.set(-105, 40, 400);
    cave.castShadow = true;
    cave.receiveShadow = true;
    canyonGroup.add(cave);

    // Fuel dump in alcove - CylinderGeometry tanks
    var tankMat = new THREE.MeshPhongMaterial({ color: 0x444444, metalness: 0.7 });
    for (var j = 0; j < 3; j++) {
      var tankGeom = new THREE.CylinderGeometry(8, 8, 40, 16);
      var tank = new THREE.Mesh(tankGeom, tankMat);
      tank.position.set(80 + j * 20, -120, -300);
      tank.castShadow = true;
      tank.receiveShadow = true;
      canyonGroup.add(tank);
    }

    // Communications antenna on canyon rim - CylinderGeometry mast
    var mastMat = new THREE.MeshPhongMaterial({ color: 0x333333, metalness: 0.8 });
    var mastGeom = new THREE.CylinderGeometry(3, 3, 80, 12);
    var mast = new THREE.Mesh(mastGeom, mastMat);
    mast.position.set(-115, 170, 250);
    mast.castShadow = true;
    mast.receiveShadow = true;
    canyonGroup.add(mast);

    // Antenna array on top
    var antennaMat = new THREE.MeshPhongMaterial({ color: 0xff6600 });
    var antennaGeom = new THREE.ConeGeometry(2, 30, 8);
    var antenna = new THREE.Mesh(antennaGeom, antennaMat);
    antenna.position.set(-115, 215, 250);
    antenna.castShadow = true;
    canyonGroup.add(antenna);

    // Vehicle bridge - solid crossing
    var bridgeMat = new THREE.MeshPhongMaterial({ color: 0x555555, roughness: 0.7 });
    var bridgeGeom = new THREE.BoxGeometry(180, 12, 60);
    var vehicleBridge = new THREE.Mesh(bridgeGeom, bridgeMat);
    vehicleBridge.position.set(0, 40, -400);
    vehicleBridge.castShadow = true;
    vehicleBridge.receiveShadow = true;
    canyonGroup.add(vehicleBridge);

    // Bridge support pillars
    var supportMat = new THREE.MeshPhongMaterial({ color: 0x666666 });
    for (var k = 0; k < 3; k++) {
      var supportGeom = new THREE.CylinderGeometry(8, 10, 100, 8);
      var support = new THREE.Mesh(supportGeom, supportMat);
      support.position.set(-60 + k * 60, -30, -400);
      support.castShadow = true;
      support.receiveShadow = true;
      canyonGroup.add(support);
    }

    // Cliff-side watchtower - BoxGeometry platform + CylinderGeometry legs
    var platformMat = new THREE.MeshPhongMaterial({ color: 0x777777 });
    var platformGeom = new THREE.BoxGeometry(40, 8, 40);
    var platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.set(115, 120, 150);
    platform.castShadow = true;
    platform.receiveShadow = true;
    canyonGroup.add(platform);

    var legMat = new THREE.MeshPhongMaterial({ color: 0x666666 });
    for (var m = 0; m < 4; m++) {
      var xOff = (m % 2 === 0) ? -15 : 15;
      var zOff = (m < 2) ? -15 : 15;
      var legGeom = new THREE.CylinderGeometry(4, 4, 80, 8);
      var leg = new THREE.Mesh(legGeom, legMat);
      leg.position.set(115 + xOff, 80, 150 + zOff);
      leg.castShadow = true;
      leg.receiveShadow = true;
      canyonGroup.add(leg);
    }

    // Boulder fall defense - SphereGeometry rocks on ledge
    var rockMat = new THREE.MeshPhongMaterial({ color: 0x884422, roughness: 0.9 });
    for (var n = 0; n < 5; n++) {
      var rockGeom = new THREE.SphereGeometry(12 + Math.random() * 8, 8, 8);
      var rock = new THREE.Mesh(rockGeom, rockMat);
      rock.position.set(-120 + Math.random() * 30, 120 + Math.random() * 20, -450 + n * 40);
      rock.castShadow = true;
      rock.receiveShadow = true;
      canyonGroup.add(rock);
    }

    // Supply lift pulley system - LineSegments + BoxGeometry platform
    pulleySystem = createPulleySystem(60, -100, 350);

    // Hydroelectric intake - CylinderGeometry pipe from river
    var pipeMat = new THREE.MeshPhongMaterial({ color: 0x333333, metalness: 0.6 });
    var pipeGeom = new THREE.CylinderGeometry(6, 6, 60, 12);
    var pipe = new THREE.Mesh(pipeGeom, pipeMat);
    pipe.position.set(-50, -125, 500);
    pipe.rotation.z = Math.PI / 3;
    pipe.castShadow = true;
    pipe.receiveShadow = true;
    canyonGroup.add(pipe);

    // Intake chamber
    var intakeMat = new THREE.MeshPhongMaterial({ color: 0x3a3a3a });
    var intakeGeom = new THREE.BoxGeometry(40, 35, 35);
    var intake = new THREE.Mesh(intakeGeom, intakeMat);
    intake.position.set(-50, -140, 520);
    intake.castShadow = true;
    intake.receiveShadow = true;
    canyonGroup.add(intake);

    // Mess tent on ledge - BoxGeometry
    var tentMat = new THREE.MeshPhongMaterial({ color: 0x555577 });
    var tentGeom = new THREE.BoxGeometry(50, 40, 60);
    var tent = new THREE.Mesh(tentGeom, tentMat);
    tent.position.set(-70, 30, 500);
    tent.castShadow = true;
    tent.receiveShadow = true;
    canyonGroup.add(tent);

    // Firing positions carved in rock - BoxGeometry niches
    var nicheMat = new THREE.MeshPhongMaterial({ color: 0x664422 });
    var niche1Geom = new THREE.BoxGeometry(20, 25, 15);
    var niche1 = new THREE.Mesh(niche1Geom, nicheMat);
    niche1.position.set(-110, 70, -200);
    niche1.castShadow = true;
    niche1.receiveShadow = true;
    canyonGroup.add(niche1);

    var niche2Geom = new THREE.BoxGeometry(20, 25, 15);
    var niche2 = new THREE.Mesh(niche2Geom, nicheMat);
    niche2.position.set(110, 75, 0);
    niche2.castShadow = true;
    niche2.receiveShadow = true;
    canyonGroup.add(niche2);

    var niche3Geom = new THREE.BoxGeometry(20, 25, 15);
    var niche3 = new THREE.Mesh(niche3Geom, nicheMat);
    niche3.position.set(-110, 80, 200);
    niche3.castShadow = true;
    niche3.receiveShadow = true;
    canyonGroup.add(niche3);

    // Rappel training wall - BoxGeometry with bolt routes
    var wallMat = new THREE.MeshPhongMaterial({ color: 0x775533 });
    var trainingWallGeom = new THREE.BoxGeometry(50, 120, 20);
    var trainingWall = new THREE.Mesh(trainingWallGeom, wallMat);
    trainingWall.position.set(105, 50, 600);
    trainingWall.castShadow = true;
    trainingWall.receiveShadow = true;
    canyonGroup.add(trainingWall);

    // Climbing bolts on training wall
    var boltMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, metalness: 0.9 });
    for (var p = 0; p < 6; p++) {
      for (var q = 0; q < 5; q++) {
        var boltGeom = new THREE.SphereGeometry(2, 6, 6);
        var bolt = new THREE.Mesh(boltGeom, boltMat);
        bolt.position.set(80 + p * 10, -40 + q * 30, 620);
        bolt.castShadow = true;
        canyonGroup.add(bolt);
      }
    }

    // Hidden ammo depot boxes
    var ammoMat = new THREE.MeshPhongMaterial({ color: 0x3a3a5a });
    var ammoGeom = new THREE.BoxGeometry(25, 20, 30);
    var ammo1 = new THREE.Mesh(ammoGeom, ammoMat);
    ammo1.position.set(-50, -130, 0);
    ammo1.castShadow = true;
    ammo1.receiveShadow = true;
    canyonGroup.add(ammo1);

    var ammo2 = new THREE.Mesh(ammoGeom, ammoMat);
    ammo2.position.set(-30, -135, 30);
    ammo2.castShadow = true;
    ammo2.receiveShadow = true;
    canyonGroup.add(ammo2);

    // Generator housing
    var genMat = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
    var genGeom = new THREE.BoxGeometry(45, 50, 45);
    var generator = new THREE.Mesh(genGeom, genMat);
    generator.position.set(70, -120, 150);
    generator.castShadow = true;
    generator.receiveShadow = true;
    canyonGroup.add(generator);

    // Generator exhaust pipes
    for (var r = 0; r < 2; r++) {
      var exhaustGeom = new THREE.CylinderGeometry(5, 5, 70, 10);
      var exhaust = new THREE.Mesh(exhaustGeom, pipeMat);
      exhaust.position.set(45 + r * 50, -50, 150);
      exhaust.castShadow = true;
      canyonGroup.add(exhaust);
    }

    // Observation post
    var obsMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var obsGeom = new THREE.BoxGeometry(30, 60, 30);
    var obsPost = new THREE.Mesh(obsGeom, obsMat);
    obsPost.position.set(-120, 80, -550);
    obsPost.castShadow = true;
    obsPost.receiveShadow = true;
    canyonGroup.add(obsPost);
  }

  function createRopeBridge(x1, y1, z1, x2, y2, z2) {
    var ropeGroup = new THREE.Group();

    // Main support cables
    var cableGeom = new THREE.BufferGeometry();
    var cablePoints = [];
    cablePoints.push(new THREE.Vector3(x1, y1, z1));
    cablePoints.push(new THREE.Vector3(x2, y2, z2));
    cableGeom.setFromPoints(cablePoints);

    var cableMat = new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 3 });
    var cableLeft = new THREE.LineSegments(cableGeom, cableMat);
    ropeGroup.add(cableLeft);

    var cableRight = new THREE.LineSegments(cableGeom, cableMat);
    ropeGroup.add(cableRight);

    // Bridge planks
    var plankMat = new THREE.MeshPhongMaterial({ color: 0x654321 });
    var midX = (x1 + x2) / 2;
    var midY = (y1 + y2) / 2;
    var midZ = (z1 + z2) / 2;
    var distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2));

    for (var i = 0; i < 8; i++) {
      var plankGeom = new THREE.BoxGeometry(distance / 8, 3, 8);
      var plank = new THREE.Mesh(plankGeom, plankMat);
      plank.position.set(midX, midY - 10 - i * 5, midZ);
      plank.castShadow = true;
      plank.receiveShadow = true;
      ropeGroup.add(plank);
    }

    ropeGroup.userData = {
      originalY1: y1,
      originalY2: y2,
      amplitude: 8
    };

    canyonGroup.add(ropeGroup);
    ropeBridges.push(ropeGroup);
  }

  function createRappelAnchor(x, y, z) {
    var anchorGroup = new THREE.Group();

    // Anchor point - small box
    var anchorMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, metalness: 0.9 });
    var anchorGeom = new THREE.BoxGeometry(8, 8, 8);
    var anchor = new THREE.Mesh(anchorGeom, anchorMat);
    anchor.position.set(x, y, z);
    anchor.castShadow = true;
    anchorGroup.add(anchor);

    // Rappel ropes hanging down
    var ropeGeom = new THREE.BufferGeometry();
    var ropePoints = [];
    ropePoints.push(new THREE.Vector3(x, y, z));
    ropePoints.push(new THREE.Vector3(x, y - 150, z));
    ropeGeom.setFromPoints(ropePoints);

    var ropeMat = new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 2 });
    var rope = new THREE.LineSegments(ropeGeom, ropeMat);
    anchorGroup.add(rope);

    anchorGroup.userData = {
      originalY: y,
      amplitude: 3,
      phase: Math.random() * Math.PI * 2
    };

    canyonGroup.add(anchorGroup);
    rappelRopes.push(anchorGroup);
  }

  function createPulleySystem(x, y, z) {
    var pulleyGroup = new THREE.Group();

    // Support beam
    var beamMat = new THREE.MeshPhongMaterial({ color: 0x333333, metalness: 0.7 });
    var beamGeom = new THREE.BoxGeometry(80, 6, 6);
    var beam = new THREE.Mesh(beamGeom, beamMat);
    beam.position.set(x, y + 80, z);
    beam.castShadow = true;
    pulleyGroup.add(beam);

    // Pulley wheels
    var pulleyMat = new THREE.MeshPhongMaterial({ color: 0x444444, metalness: 0.8 });
    var pulley1Geom = new THREE.CylinderGeometry(8, 8, 4, 16);
    var pulley1 = new THREE.Mesh(pulley1Geom, pulleyMat);
    pulley1.position.set(x - 30, y + 85, z);
    pulley1.rotation.z = Math.PI / 2;
    pulley1.castShadow = true;
    pulleyGroup.add(pulley1);

    var pulley2Geom = new THREE.CylinderGeometry(8, 8, 4, 16);
    var pulley2 = new THREE.Mesh(pulley2Geom, pulleyMat);
    pulley2.position.set(x + 30, y + 85, z);
    pulley2.rotation.z = Math.PI / 2;
    pulley2.castShadow = true;
    pulleyGroup.add(pulley2);

    // Lift platform
    var platformMat = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var platformGeom = new THREE.BoxGeometry(50, 8, 40);
    var liftPlatform = new THREE.Mesh(platformGeom, platformMat);
    liftPlatform.position.set(x, y, z);
    liftPlatform.castShadow = true;
    liftPlatform.receiveShadow = true;
    pulleyGroup.add(liftPlatform);

    // Cable lines
    var cableGeom = new THREE.BufferGeometry();
    var cablePoints = [];
    cablePoints.push(new THREE.Vector3(x - 20, y + 85, z));
    cablePoints.push(new THREE.Vector3(x - 20, y, z));
    cableGeom.setFromPoints(cablePoints);

    var cableMat = new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 2 });
    var cable1 = new THREE.LineSegments(cableGeom, cableMat);
    pulleyGroup.add(cable1);

    var cable2Geom = new THREE.BufferGeometry();
    var cable2Points = [];
    cable2Points.push(new THREE.Vector3(x + 20, y + 85, z));
    cable2Points.push(new THREE.Vector3(x + 20, y, z));
    cable2Geom.setFromPoints(cable2Points);
    var cable2 = new THREE.LineSegments(cable2Geom, cableMat);
    pulleyGroup.add(cable2);

    pulleyGroup.userData = {
      platform: liftPlatform,
      originalY: y,
      amplitude: 20,
      speed: 0.5
    };

    canyonGroup.add(pulleyGroup);
    return pulleyGroup;
  }

  function update(delta) {
    animationTime += delta;

    // River ripple effect - subtle color modulation
    if (riverWaves.length > 0) {
      var rippleIntensity = Math.sin(animationTime * 2) * 0.1;
      riverMaterial.emissive.setHSL(0.45, 0.5, 0.15 + rippleIntensity);
    }

    // Rope bridge sway
    for (var i = 0; i < ropeBridges.length; i++) {
      var bridge = ropeBridges[i];
      var children = bridge.children;
      for (var j = 0; j < children.length; j++) {
        var child = children[j];
        if (child instanceof THREE.Mesh) {
          var sway = Math.sin(animationTime * 1.5 + i) * bridge.userData.amplitude;
          child.position.z += sway * delta;
        }
      }
    }

    // Rappel rope sway
    for (var k = 0; k < rappelRopes.length; k++) {
      var anchor = rappelRopes[k];
      var phase = anchor.userData.phase;
      var sway = Math.sin(animationTime + phase) * anchor.userData.amplitude;

      var lineChild = anchor.children[1];
      if (lineChild && lineChild.geometry) {
        var posAttribute = lineChild.geometry.attributes.position;
        if (posAttribute) {
          var array = posAttribute.array;
          array[3] = anchor.userData.originalY - 150 + sway;
          posAttribute.needsUpdate = true;
        }
      }
    }

    // Pulley lift movement
    if (pulleySystem && pulleySystem.userData.platform) {
      var lift = pulleySystem.userData.platform;
      var baseY = pulleySystem.userData.originalY;
      var cyclePosition = Math.sin(animationTime * pulleySystem.userData.speed) * 0.5 + 0.5;
      lift.position.y = baseY + Math.sin(animationTime * pulleySystem.userData.speed) * pulleySystem.userData.amplitude;

      // Update cables
      var cables = pulleySystem.children;
      for (var m = 2; m < cables.length; m++) {
        if (cables[m].geometry && cables[m].geometry.attributes.position) {
          var posAttr = cables[m].geometry.attributes.position;
          var y = posAttr.array[1];
          posAttr.array[1] = baseY + Math.sin(animationTime * pulleySystem.userData.speed) * pulleySystem.userData.amplitude;
          posAttr.needsUpdate = true;
        }
      }
    }
  }

  function reset() {
    animationTime = 0;

    // Reset rope bridges
    for (var i = 0; i < ropeBridges.length; i++) {
      var bridge = ropeBridges[i];
      var children = bridge.children;
      for (var j = 1; j < children.length; j++) {
        if (children[j] instanceof THREE.Mesh) {
          children[j].position.z = (bridge.userData.midZ !== undefined) ? bridge.userData.midZ : children[j].position.z;
        }
      }
    }

    // Reset rappel ropes
    for (var k = 0; k < rappelRopes.length; k++) {
      var anchor = rappelRopes[k];
      if (anchor.children[1] && anchor.children[1].geometry) {
        var posAttribute = anchor.children[1].geometry.attributes.position;
        if (posAttribute) {
          posAttribute.array[1] = anchor.userData.originalY;
          posAttribute.array[4] = anchor.userData.originalY - 150;
          posAttribute.needsUpdate = true;
        }
      }
    }

    // Reset pulley system
    if (pulleySystem && pulleySystem.userData.platform) {
      pulleySystem.userData.platform.position.y = pulleySystem.userData.originalY;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
