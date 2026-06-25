window.FloodZone = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var floodWater = null;
  var buildings = [];
  var boats = [];
  var debris = [];
  var transformerSparks = [];
  var floatingObjects = [];
  var waterSurfaceVertices = [];
  var waterSurfaceInitialY = 0;
  var waveTime = 0;
  var sparksTime = 0;

  var init = function(inScene, inCamera) {
    scene = inScene;
    camera = inCamera;
    waveTime = 0;
    sparksTime = 0;
    buildings = [];
    boats = [];
    debris = [];
    transformerSparks = [];
    floatingObjects = [];

    // Create floodwater surface - wide shallow blue-gray plane using BoxGeometry
    var waterGeometry = new THREE.BoxGeometry(800, 0.5, 800);
    var waterMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a7c8c,
      transparent: true,
      opacity: 0.7,
      shininess: 100,
      wireframe: false
    });
    floodWater = new THREE.Mesh(waterGeometry, waterMaterial);
    floodWater.position.y = 15;
    floodWater.castShadow = true;
    floodWater.receiveShadow = true;
    waterSurfaceInitialY = floodWater.position.y;
    scene.add(floodWater);

    // Store initial water vertices for wave animation
    waterSurfaceVertices = [];
    var positions = waterGeometry.attributes.position.array;
    for (var i = 0; i < positions.length; i += 3) {
      waterSurfaceVertices.push({
        x: positions[i],
        y: positions[i + 1],
        z: positions[i + 2]
      });
    }

    // Create submerged street grid - dark asphalt below waterline
    var streetGeometry = new THREE.BoxGeometry(800, 2, 800);
    var streetMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var street = new THREE.Mesh(streetGeometry, streetMaterial);
    street.position.y = 0;
    street.castShadow = true;
    street.receiveShadow = true;
    scene.add(street);

    // Create street lines using LineSegments
    var lineGeometry = new THREE.BufferGeometry();
    var linePoints = [];
    for (var x = -400; x <= 400; x += 100) {
      linePoints.push(new THREE.Vector3(x, 1.1, -400));
      linePoints.push(new THREE.Vector3(x, 1.1, 400));
    }
    for (var z = -400; z <= 400; z += 100) {
      linePoints.push(new THREE.Vector3(-400, 1.1, z));
      linePoints.push(new THREE.Vector3(400, 1.1, z));
    }
    lineGeometry.setFromPoints(linePoints);
    var lineMaterial = new THREE.LineBasicMaterial({ color: 0x444444 });
    var streetLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(streetLines);

    // Building lower floors - partially submerged structures
    createBuildings();

    // Waterlogged car roofs barely above water
    createSubmergedCars();

    // Motorboat navigating the flooded streets
    createMotorboat();

    // Inflatable raft
    createRaft();

    // Floating debris
    createFloatingDebris();

    // Electrical transformer submerged with spark hazard
    createTransformer();

    // Utility pole leaning with downed wire
    createUtilityPole();

    // Rooftop refugees huddled on high roofs
    createRooftopRefugees();

    // Rescue ladder hanging from building
    createRescueLadder();

    // Debris dam - compressed pile of waste
    createDebrisDam();

    // Water surge channel - flow path
    createWaterChannel();

    // Sandbag entrance fortifications
    createSandbagEntrance();

    // Water pump station
    createPumpStation();

    // Watermark tide lines on buildings
    createWatermarkLines();

    // Generator on high ground
    createGenerator();

    // Ammunition crate on pallet
    createAmmoCrate();
  };

  var createBuildings = function() {
    // Building 1 - tall structure
    var bldg1Geom = new THREE.BoxGeometry(60, 120, 50);
    var bldg1Mat = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
    var bldg1 = new THREE.Mesh(bldg1Geom, bldg1Mat);
    bldg1.position.set(-150, 40, -200);
    bldg1.castShadow = true;
    bldg1.receiveShadow = true;
    scene.add(bldg1);
    buildings.push(bldg1);

    // Building 2 - corner structure
    var bldg2Geom = new THREE.BoxGeometry(80, 100, 70);
    var bldg2Mat = new THREE.MeshPhongMaterial({ color: 0x9b6b47 });
    var bldg2 = new THREE.Mesh(bldg2Geom, bldg2Mat);
    bldg2.position.set(180, 35, -150);
    bldg2.castShadow = true;
    bldg2.receiveShadow = true;
    scene.add(bldg2);
    buildings.push(bldg2);

    // Building 3 - residential block
    var bldg3Geom = new THREE.BoxGeometry(100, 90, 60);
    var bldg3Mat = new THREE.MeshPhongMaterial({ color: 0x7a5a3a });
    var bldg3 = new THREE.Mesh(bldg3Geom, bldg3Mat);
    bldg3.position.set(-200, 30, 150);
    bldg3.castShadow = true;
    bldg3.receiveShadow = true;
    scene.add(bldg3);
    buildings.push(bldg3);

    // Building 4 - industrial warehouse
    var bldg4Geom = new THREE.BoxGeometry(120, 70, 100);
    var bldg4Mat = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var bldg4 = new THREE.Mesh(bldg4Geom, bldg4Mat);
    bldg4.position.set(200, 25, 180);
    bldg4.castShadow = true;
    bldg4.receiveShadow = true;
    scene.add(bldg4);
    buildings.push(bldg4);

    // Partially submerged wall segment
    var wallGeom = new THREE.BoxGeometry(150, 35, 8);
    var wallMat = new THREE.MeshPhongMaterial({ color: 0x8b8b7a });
    var wall = new THREE.Mesh(wallGeom, wallMat);
    wall.position.set(0, 10, 300);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    buildings.push(wall);
  };

  var createSubmergedCars = function() {
    // Car 1
    var car1Geom = new THREE.BoxGeometry(20, 15, 40);
    var car1Mat = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
    var car1 = new THREE.Mesh(car1Geom, car1Mat);
    car1.position.set(-100, 8, 50);
    car1.castShadow = true;
    car1.receiveShadow = true;
    scene.add(car1);
    floatingObjects.push(car1);

    // Car 2
    var car2Geom = new THREE.BoxGeometry(20, 15, 40);
    var car2Mat = new THREE.MeshPhongMaterial({ color: 0x5a3a2a });
    var car2 = new THREE.Mesh(car2Geom, car2Mat);
    car2.position.set(80, 8, -80);
    car2.castShadow = true;
    car2.receiveShadow = true;
    scene.add(car2);
    floatingObjects.push(car2);
  };

  var createMotorboat = function() {
    // Boat hull
    var hullGeom = new THREE.BoxGeometry(25, 12, 50);
    var hullMat = new THREE.MeshPhongMaterial({ color: 0x1a3a5a });
    var hull = new THREE.Mesh(hullGeom, hullMat);
    hull.position.set(-250, 15, 0);
    hull.castShadow = true;
    hull.receiveShadow = true;
    scene.add(hull);

    // Outboard motor cylinder
    var motorGeom = new THREE.CylinderGeometry(3, 3, 15, 16);
    var motorMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var motor = new THREE.Mesh(motorGeom, motorMat);
    motor.position.set(-250, 8, 28);
    motor.castShadow = true;
    motor.receiveShadow = true;
    scene.add(motor);

    // Cabin box
    var cabinGeom = new THREE.BoxGeometry(18, 15, 15);
    var cabinMat = new THREE.MeshPhongMaterial({ color: 0x2a4a6a });
    var cabin = new THREE.Mesh(cabinGeom, cabinMat);
    cabin.position.set(-250, 18, -5);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    scene.add(cabin);

    boats.push({ hull: hull, motor: motor, cabin: cabin, time: 0 });
  };

  var createRaft = function() {
    // Raft platform
    var raftGeom = new THREE.BoxGeometry(35, 1, 35);
    var raftMat = new THREE.MeshPhongMaterial({ color: 0xffa500 });
    var raft = new THREE.Mesh(raftGeom, raftMat);
    raft.position.set(150, 14.5, -200);
    raft.castShadow = true;
    raft.receiveShadow = true;
    scene.add(raft);

    // Raft frame posts
    for (var i = 0; i < 4; i++) {
      var offsetX = (i % 2 === 0) ? -15 : 15;
      var offsetZ = (i < 2) ? -15 : 15;
      var postGeom = new THREE.BoxGeometry(2, 3, 2);
      var postMat = new THREE.MeshPhongMaterial({ color: 0x8b6914 });
      var post = new THREE.Mesh(postGeom, postMat);
      post.position.set(150 + offsetX, 16.5, -200 + offsetZ);
      post.castShadow = true;
      post.receiveShadow = true;
      scene.add(post);
    }

    floatingObjects.push(raft);
  };

  var createFloatingDebris = function() {
    // Wooden plank 1
    var plank1Geom = new THREE.BoxGeometry(40, 2, 8);
    var plank1Mat = new THREE.MeshPhongMaterial({ color: 0x8b6f47 });
    var plank1 = new THREE.Mesh(plank1Geom, plank1Mat);
    plank1.position.set(-300, 14.5, 100);
    plank1.rotation.z = 0.3;
    plank1.castShadow = true;
    plank1.receiveShadow = true;
    scene.add(plank1);
    debris.push({ mesh: plank1, driftX: 0.5, driftZ: 0.3 });

    // Wooden plank 2
    var plank2Geom = new THREE.BoxGeometry(35, 2, 8);
    var plank2Mat = new THREE.MeshPhongMaterial({ color: 0x7a5f3a });
    var plank2 = new THREE.Mesh(plank2Geom, plank2Mat);
    plank2.position.set(280, 14.3, -120);
    plank2.rotation.z = -0.4;
    plank2.castShadow = true;
    plank2.receiveShadow = true;
    scene.add(plank2);
    debris.push({ mesh: plank2, driftX: -0.4, driftZ: 0.2 });

    // Furniture piece
    var furnGeom = new THREE.BoxGeometry(20, 10, 15);
    var furnMat = new THREE.MeshPhongMaterial({ color: 0x5a3a2a });
    var furn = new THREE.Mesh(furnGeom, furnMat);
    furn.position.set(-50, 15, -250);
    furn.rotation.y = 0.7;
    furn.castShadow = true;
    furn.receiveShadow = true;
    scene.add(furn);
    debris.push({ mesh: furn, driftX: 0.2, driftZ: -0.3 });
  };

  var createTransformer = function() {
    // Submerged transformer box
    var transGeom = new THREE.BoxGeometry(20, 25, 20);
    var transMat = new THREE.MeshPhongMaterial({ color: 0x3a3a3a });
    var transformer = new THREE.Mesh(transGeom, transMat);
    transformer.position.set(-320, 8, 280);
    transformer.castShadow = true;
    transformer.receiveShadow = true;
    scene.add(transformer);

    // Spark sphere indicators
    for (var i = 0; i < 3; i++) {
      var sparkGeom = new THREE.SphereGeometry(1.5, 8, 8);
      var sparkMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      var spark = new THREE.Mesh(sparkGeom, sparkMat);
      spark.position.set(-320 + (i - 1) * 10, 18, 280);
      spark.visible = false;
      scene.add(spark);
      transformerSparks.push({ mesh: spark, active: false });
    }
  };

  var createUtilityPole = function() {
    // Leaning pole cylinder
    var poleGeom = new THREE.CylinderGeometry(2, 2, 80, 12);
    var poleMat = new THREE.MeshPhongMaterial({ color: 0x654321 });
    var pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.set(320, 30, -280);
    pole.rotation.z = 0.3;
    pole.castShadow = true;
    pole.receiveShadow = true;
    scene.add(pole);

    // Downed power lines
    var wireGeom = new THREE.BufferGeometry();
    var wirePoints = [
      new THREE.Vector3(320, 70, -280),
      new THREE.Vector3(200, 50, -250),
      new THREE.Vector3(100, 35, -220)
    ];
    wireGeom.setFromPoints(wirePoints);
    var wireMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 3 });
    var wire = new THREE.LineSegments(wireGeom, wireMat);
    scene.add(wire);
  };

  var createRooftopRefugees = function() {
    // Group of refugees on rooftop
    var baseX = -150;
    var baseY = 75;
    var baseZ = -200;

    for (var i = 0; i < 4; i++) {
      var personGeom = new THREE.BoxGeometry(4, 8, 4);
      var personMat = new THREE.MeshPhongMaterial({ color: 0xaa8844 });
      var person = new THREE.Mesh(personGeom, personMat);
      person.position.set(baseX + i * 8, baseY, baseZ);
      person.castShadow = true;
      person.receiveShadow = true;
      scene.add(person);
    }
  };

  var createRescueLadder = function() {
    // Ladder hanging from building
    var ladderGeom = new THREE.BufferGeometry();
    var ladderPoints = [];

    for (var i = 0; i < 12; i++) {
      var rungY = 80 - i * 5;
      ladderPoints.push(new THREE.Vector3(180, rungY, -150));
      ladderPoints.push(new THREE.Vector3(187, rungY, -150));
    }

    ladderGeom.setFromPoints(ladderPoints);
    var ladderMat = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 });
    var ladder = new THREE.LineSegments(ladderGeom, ladderMat);
    scene.add(ladder);

    // Horizontal ladder rungs
    var rungGeom = new THREE.BufferGeometry();
    var rungPoints = [];
    for (var j = 0; j < 12; j++) {
      var yPos = 80 - j * 5;
      rungPoints.push(new THREE.Vector3(180, yPos, -150));
      rungPoints.push(new THREE.Vector3(187, yPos, -150));
    }
    rungGeom.setFromPoints(rungPoints);
    var rungMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
    var rungs = new THREE.LineSegments(rungGeom, rungMat);
    scene.add(rungs);
  };

  var createDebrisDam = function() {
    // Main debris accumulation
    var debrisGeom = new THREE.BoxGeometry(100, 20, 30);
    var debrisMat = new THREE.MeshPhongMaterial({ color: 0x6a5a4a });
    var debrisDam = new THREE.Mesh(debrisGeom, debrisMat);
    debrisDam.position.set(0, 18, -350);
    debrisDam.castShadow = true;
    debrisDam.receiveShadow = true;
    scene.add(debrisDam);

    // Scattered debris around dam
    for (var i = 0; i < 5; i++) {
      var scrapGeom = new THREE.BoxGeometry(15 + i * 3, 8, 12);
      var scrapMat = new THREE.MeshPhongMaterial({ color: 0x5a4a3a });
      var scrap = new THREE.Mesh(scrapGeom, scrapMat);
      scrap.position.set(-40 + i * 20, 12 + i * 2, -350 + i * 5);
      scrap.castShadow = true;
      scrap.receiveShadow = true;
      scene.add(scrap);
    }
  };

  var createWaterChannel = function() {
    // Flow channel carved through debris
    var channelGeom = new THREE.BoxGeometry(40, 3, 200);
    var channelMat = new THREE.MeshPhongMaterial({ color: 0x5a7a9c, transparent: true, opacity: 0.4 });
    var channel = new THREE.Mesh(channelGeom, channelMat);
    channel.position.set(-100, 14.5, 50);
    channel.castShadow = true;
    scene.add(channel);
  };

  var createSandbagEntrance = function() {
    // Sandbag barrier
    for (var i = 0; i < 8; i++) {
      var bagGeom = new THREE.BoxGeometry(12, 8, 6);
      var bagMat = new THREE.MeshPhongMaterial({ color: 0xbaa876 });
      var bag = new THREE.Mesh(bagGeom, bagMat);
      bag.position.set(250 + i * 8, 4 + (i % 2) * 4, 300);
      bag.castShadow = true;
      bag.receiveShadow = true;
      scene.add(bag);
    }
  };

  var createPumpStation = function() {
    // Pump housing
    var pumpGeom = new THREE.BoxGeometry(40, 30, 35);
    var pumpMat = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
    var pump = new THREE.Mesh(pumpGeom, pumpMat);
    pump.position.set(200, 18, -300);
    pump.castShadow = true;
    pump.receiveShadow = true;
    scene.add(pump);

    // Pump cylinder
    var cylinderGeom = new THREE.CylinderGeometry(5, 5, 35, 16);
    var cylinderMat = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
    var cylinder = new THREE.Mesh(cylinderGeom, cylinderMat);
    cylinder.position.set(210, 23, -300);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    scene.add(cylinder);
  };

  var createWatermarkLines = function() {
    // Waterline marks on buildings
    for (var i = 0; i < buildings.length; i++) {
      var bldg = buildings[i];
      var markGeom = new THREE.BoxGeometry(bldg.geometry.parameters.width + 5, 1.5, bldg.geometry.parameters.depth + 5);
      var markMat = new THREE.MeshPhongMaterial({ color: 0x5a7a8a, transparent: true, opacity: 0.6 });
      var mark = new THREE.Mesh(markGeom, markMat);
      mark.position.copy(bldg.position);
      mark.position.y = 15;
      mark.castShadow = true;
      scene.add(mark);
    }
  };

  var createGenerator = function() {
    // Generator box on high ground
    var genGeom = new THREE.BoxGeometry(25, 20, 30);
    var genMat = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
    var gen = new THREE.Mesh(genGeom, genMat);
    gen.position.set(300, 35, 250);
    gen.castShadow = true;
    gen.receiveShadow = true;
    scene.add(gen);

    // Exhaust stack cylinder
    var exhaustGeom = new THREE.CylinderGeometry(3, 3, 25, 12);
    var exhaustMat = new THREE.MeshPhongMaterial({ color: 0x3a3a3a });
    var exhaust = new THREE.Mesh(exhaustGeom, exhaustMat);
    exhaust.position.set(315, 42, 250);
    exhaust.castShadow = true;
    exhaust.receiveShadow = true;
    scene.add(exhaust);
  };

  var createAmmoCrate = function() {
    // Wooden crate on pallet
    var crateGeom = new THREE.BoxGeometry(20, 18, 20);
    var crateMat = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
    var crate = new THREE.Mesh(crateGeom, crateMat);
    crate.position.set(-280, 16, 200);
    crate.castShadow = true;
    crate.receiveShadow = true;
    scene.add(crate);

    // Pallet
    var palletGeom = new THREE.BoxGeometry(25, 2, 25);
    var palletMat = new THREE.MeshPhongMaterial({ color: 0x6a5a4a });
    var pallet = new THREE.Mesh(palletGeom, palletMat);
    pallet.position.set(-280, 7, 200);
    pallet.castShadow = true;
    pallet.receiveShadow = true;
    scene.add(pallet);

    floatingObjects.push(crate);
  };

  var update = function(delta) {
    waveTime += delta;
    sparksTime += delta;

    // Water surface wave animation
    if (floodWater && floodWater.geometry) {
      var positions = floodWater.geometry.attributes.position.array;
      for (var i = 0; i < positions.length; i += 3) {
        var idx = i / 3;
        if (waterSurfaceVertices[idx]) {
          var baseY = waterSurfaceVertices[idx].y;
          var wave1 = Math.sin(waveTime * 2 + positions[i] * 0.01) * 0.05;
          var wave2 = Math.cos(waveTime * 1.5 + positions[i + 2] * 0.01) * 0.03;
          positions[i + 1] = baseY + wave1 + wave2;
        }
      }
      floodWater.geometry.attributes.position.needsUpdate = true;
    }

    // Floating object gentle bobbing
    for (var j = 0; j < floatingObjects.length; j++) {
      var obj = floatingObjects[j];
      var bobAmount = Math.sin(waveTime * 2 + j) * 0.2;
      obj.userData.originalY = obj.userData.originalY || obj.position.y;
      obj.position.y = obj.userData.originalY + bobAmount;
    }

    // Debris drift simulation
    for (var k = 0; k < debris.length; k++) {
      var deb = debris[k];
      deb.mesh.position.x += deb.driftX * delta * 0.5;
      deb.mesh.position.z += deb.driftZ * delta * 0.5;
      deb.mesh.rotation.y += delta * 0.3;

      // Wrap around if drifting too far
      if (deb.mesh.position.x > 400) deb.mesh.position.x = -400;
      if (deb.mesh.position.x < -400) deb.mesh.position.x = 400;
      if (deb.mesh.position.z > 400) deb.mesh.position.z = -400;
      if (deb.mesh.position.z < -400) deb.mesh.position.z = 400;
    }

    // Boat gentle rock
    for (var m = 0; m < boats.length; m++) {
      var boat = boats[m];
      boat.time += delta;
      var rockAmount = Math.sin(boat.time * 1.5) * 0.15;
      boat.hull.rotation.z = rockAmount * 0.1;
      boat.hull.position.y = 15 + Math.sin(boat.time * 2) * 0.3;
      boat.motor.position.y = boat.hull.position.y - 7;
      boat.cabin.position.y = boat.hull.position.y + 3;
    }

    // Transformer spark flashes
    if (sparksTime > 0.5) {
      for (var s = 0; s < transformerSparks.length; s++) {
        transformerSparks[s].mesh.visible = Math.random() > 0.6;
      }
      sparksTime = 0;
    }
  };

  var reset = function() {
    waveTime = 0;
    sparksTime = 0;

    // Reset water surface
    if (floodWater && floodWater.geometry) {
      var positions = floodWater.geometry.attributes.position.array;
      for (var i = 0; i < positions.length; i += 3) {
        var idx = i / 3;
        if (waterSurfaceVertices[idx]) {
          positions[i + 1] = waterSurfaceVertices[idx].y;
        }
      }
      floodWater.geometry.attributes.position.needsUpdate = true;
    }

    // Reset floating objects to original positions
    for (var i = 0; i < floatingObjects.length; i++) {
      floatingObjects[i].userData.originalY = floatingObjects[i].userData.originalY || floatingObjects[i].position.y;
    }

    // Reset debris
    for (var j = 0; j < debris.length; j++) {
      var deb = debris[j];
      deb.mesh.position.x = deb.mesh.userData.originalX || deb.mesh.position.x;
      deb.mesh.position.z = deb.mesh.userData.originalZ || deb.mesh.position.z;
    }

    // Reset boats
    for (var k = 0; k < boats.length; k++) {
      boats[k].time = 0;
    }

    // Reset sparks
    for (var s = 0; s < transformerSparks.length; s++) {
      transformerSparks[s].mesh.visible = false;
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
