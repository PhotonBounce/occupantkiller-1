window.JunkyardWar = (function() {
  'use strict';

  var scene;
  var camera;
  var craneArm;
  var craneRotation = 0;
  var oilDrums = [];
  var scrapPiles = [];
  var rustParticles = [];
  var impactedDrums = new Map();
  var gameState = {};

  function init(sc, cam) {
    scene = sc;
    camera = cam;
    gameState = { time: 0 };

    buildJunkyardTerrain();
    buildCrushedCarStacks();
    buildRustedCarHulks();
    buildSalvageCrane();
    buildCompactorMachine();
    buildOilDrumWalls();
    buildTireWallBarriers();
    buildMetalScrapHeaps();
    buildChainLinkFence();
    buildWeighStation();
    buildGuardShack();
    buildCarCrusherConveyor();
    buildEngineBlockPiles();
    buildExhaustPipeTangle();
    buildShippingContainer();
    buildCrowPerch();
    buildStrippedVehicleFrames();
    buildOilSlick();
    buildBurnedSection();
    buildRustParticles();
  }

  function buildJunkyardTerrain() {
    var groundGeom = new THREE.BoxGeometry(300, 0.5, 300);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    var ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    scene.add(ground);

    var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 150, 100);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    var ambLight = new THREE.AmbientLight(0x404040);
    scene.add(ambLight);
  }

  function buildCrushedCarStacks() {
    var colors = [0x8b0000, 0x660000, 0x990000, 0x330000];
    var stackPositions = [
      { x: -80, z: -80 },
      { x: 80, z: -80 },
      { x: -80, z: 80 },
      { x: 80, z: 80 },
      { x: -40, z: -40 },
      { x: 40, z: 40 }
    ];

    stackPositions.forEach(function(pos) {
      var stackHeight = 4 + Math.random() * 3;
      for (var i = 0; i < stackHeight; i++) {
        var width = 25 - i * 2;
        var height = 2.5;
        var depth = 30 - i * 1.5;
        var carGeom = new THREE.BoxGeometry(width, height, depth);
        var colorIdx = Math.floor(Math.random() * colors.length);
        var carMat = new THREE.MeshLambertMaterial({ color: colors[colorIdx] });
        var car = new THREE.Mesh(carGeom, carMat);
        car.position.set(pos.x, i * 2.8 + 1.25, pos.z);
        car.rotation.y = (Math.random() - 0.5) * 0.3;
        car.castShadow = true;
        car.receiveShadow = true;
        scene.add(car);
      }
    });
  }

  function buildRustedCarHulks() {
    var hullPositions = [
      { x: -120, z: -40 },
      { x: 120, z: 40 },
      { x: 0, z: -120 },
      { x: 60, z: -60 },
      { x: -60, z: 60 }
    ];

    hullPositions.forEach(function(pos) {
      var bodyGeom = new THREE.BoxGeometry(18, 14, 40);
      var bodyMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.set(pos.x, 7, pos.z);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);

      for (var i = 0; i < 4; i++) {
        var wheelGeom = new THREE.CylinderGeometry(4, 4, 3, 16);
        var wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var wheel = new THREE.Mesh(wheelGeom, wheelMat);
        var xOffset = i < 2 ? -9 : 9;
        var zOffset = i % 2 === 0 ? -12 : 12;
        wheel.position.set(pos.x + xOffset, 4, pos.z + zOffset);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        scene.add(wheel);
      }
    });
  }

  function buildSalvageCrane() {
    var towerHeight = 80;
    var towerGeom = new THREE.BoxGeometry(8, towerHeight, 8);
    var towerMat = new THREE.MeshLambertMaterial({ color: 0x505050 });
    var tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.set(0, towerHeight / 2, 0);
    tower.castShadow = true;
    scene.add(tower);

    var latticePositions = [
      { x: 4, z: 4 },
      { x: 4, z: -4 },
      { x: -4, z: 4 },
      { x: -4, z: -4 }
    ];
    latticePositions.forEach(function(pos) {
      var beamGeom = new THREE.BoxGeometry(2, towerHeight, 2);
      var beamMat = new THREE.MeshLambertMaterial({ color: 0x454545 });
      var beam = new THREE.Mesh(beamGeom, beamMat);
      beam.position.set(pos.x, towerHeight / 2, pos.z);
      beam.castShadow = true;
      scene.add(beam);
    });

    var armGeom = new THREE.BoxGeometry(60, 4, 4);
    var armMat = new THREE.MeshLambertMaterial({ color: 0x606060 });
    craneArm = new THREE.Mesh(armGeom, armMat);
    craneArm.position.set(30, towerHeight - 2, 0);
    craneArm.castShadow = true;
    scene.add(craneArm);

    var cablePoints = [
      new THREE.Vector3(30, towerHeight - 6, 0),
      new THREE.Vector3(60, towerHeight - 40, 0)
    ];
    var cableGeom = new THREE.BufferGeometry().setFromPoints(cablePoints);
    var cableMat = new THREE.LineBasicMaterial({ color: 0x999999, linewidth: 2 });
    var cable = new THREE.LineSegments(cableGeom, cableMat);
    scene.add(cable);

    var magnetGeom = new THREE.SphereGeometry(6, 16, 16);
    var magnetMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var magnet = new THREE.Mesh(magnetGeom, magnetMat);
    magnet.position.set(60, towerHeight - 45, 0);
    magnet.castShadow = true;
    scene.add(magnet);
  }

  function buildCompactorMachine() {
    var baseGeom = new THREE.BoxGeometry(40, 3, 50);
    var baseMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.set(-100, 1.5, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);

    var pressGeom = new THREE.BoxGeometry(35, 25, 45);
    var pressMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    var press = new THREE.Mesh(pressGeom, pressMat);
    press.position.set(-100, 15, 0);
    press.castShadow = true;
    scene.add(press);

    var pistonGeom = new THREE.BoxGeometry(38, 8, 48);
    var pistonMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var piston = new THREE.Mesh(pistonGeom, pistonMat);
    piston.position.set(-100, 45, 0);
    piston.castShadow = true;
    scene.add(piston);
  }

  function buildOilDrumWalls() {
    var drumPositions = [];
    for (var x = -30; x <= 30; x += 15) {
      for (var z = -100; z <= -50; z += 15) {
        for (var y = 0; y < 3; y++) {
          drumPositions.push({ x: x, y: y, z: z });
        }
      }
    }

    drumPositions.forEach(function(pos) {
      var drumGeom = new THREE.CylinderGeometry(5, 5, 12, 12);
      var drumMat = new THREE.MeshLambertMaterial({ color: 0xff8c00 });
      var drum = new THREE.Mesh(drumGeom, drumMat);
      drum.position.set(pos.x, pos.y * 12 + 6, pos.z);
      drum.castShadow = true;
      drum.receiveShadow = true;
      drum.userData = { originalY: drum.position.y, wobble: Math.random() };
      scene.add(drum);
      oilDrums.push(drum);
    });
  }

  function buildTireWallBarriers() {
    var tirePositions = [];
    for (var i = 0; i < 8; i++) {
      for (var j = 0; j < 5; j++) {
        tirePositions.push({ x: 50 + i * 12, z: -30 + j * 8 });
      }
    }

    tirePositions.forEach(function(pos) {
      var tireGeom = new THREE.CylinderGeometry(6, 6, 4, 16);
      var tireMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      var tire = new THREE.Mesh(tireGeom, tireMat);
      tire.position.set(pos.x, 2, pos.z);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      tire.receiveShadow = true;
      scene.add(tire);
    });
  }

  function buildMetalScrapHeaps() {
    var heapPositions = [
      { x: 120, z: -100 },
      { x: -120, z: 100 },
      { x: 0, z: 100 },
      { x: -80, z: -40 }
    ];

    heapPositions.forEach(function(pos) {
      var heapCount = 5 + Math.floor(Math.random() * 5);
      for (var i = 0; i < heapCount; i++) {
        var w = 8 + Math.random() * 12;
        var h = 6 + Math.random() * 10;
        var d = 8 + Math.random() * 12;
        var scrapGeom = new THREE.BoxGeometry(w, h, d);
        var scrapMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var scrap = new THREE.Mesh(scrapGeom, scrapMat);
        scrap.position.set(
          pos.x + (Math.random() - 0.5) * 30,
          h / 2,
          pos.z + (Math.random() - 0.5) * 30
        );
        scrap.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        scrap.castShadow = true;
        scrap.receiveShadow = true;
        scene.add(scrap);
        scrapPiles.push({ mesh: scrap, originalY: scrap.position.y });
      }
    });
  }

  function buildChainLinkFence() {
    var fenceLength = 200;
    var fenceZ = 140;
    var postSpacing = 20;

    for (var x = -100; x <= 100; x += postSpacing) {
      var postGeom = new THREE.BoxGeometry(2, 15, 2);
      var postMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
      var post = new THREE.Mesh(postGeom, postMat);
      post.position.set(x, 7.5, fenceZ);
      post.castShadow = true;
      scene.add(post);

      if (x < 100) {
        var wirePoints = [
          new THREE.Vector3(x + 10, 10, fenceZ),
          new THREE.Vector3(x + postSpacing - 10, 10, fenceZ)
        ];
        var wireGeom = new THREE.BufferGeometry().setFromPoints(wirePoints);
        var wireMat = new THREE.LineBasicMaterial({ color: 0x888888 });
        var wire = new THREE.LineSegments(wireGeom, wireMat);
        scene.add(wire);
      }
    }
  }

  function buildWeighStation() {
    var platformGeom = new THREE.BoxGeometry(50, 2, 40);
    var platformMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.set(100, 1, -60);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);

    for (var i = 0; i < 4; i++) {
      var supportGeom = new THREE.BoxGeometry(4, 8, 4);
      var supportMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
      var support = new THREE.Mesh(supportGeom, supportMat);
      var xPos = i < 2 ? -20 : 20;
      var zPos = i % 2 === 0 ? -15 : 15;
      support.position.set(100 + xPos, 4, -60 + zPos);
      support.castShadow = true;
      scene.add(support);
    }

    var displayGeom = new THREE.BoxGeometry(15, 5, 8);
    var displayMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var display = new THREE.Mesh(displayGeom, displayMat);
    display.position.set(125, 4, -60);
    display.castShadow = true;
    scene.add(display);
  }

  function buildGuardShack() {
    var shackGeom = new THREE.BoxGeometry(15, 12, 12);
    var shackMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    var shack = new THREE.Mesh(shackGeom, shackMat);
    shack.position.set(-120, 6, 60);
    shack.castShadow = true;
    scene.add(shack);

    var roofGeom = new THREE.BoxGeometry(18, 2, 15);
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(-120, 13, 60);
    roof.castShadow = true;
    scene.add(roof);

    var doorGeom = new THREE.BoxGeometry(4, 8, 0.5);
    var doorMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var door = new THREE.Mesh(doorGeom, doorMat);
    door.position.set(-127, 4, 66);
    door.castShadow = true;
    scene.add(door);
  }

  function buildCarCrusherConveyor() {
    var beltCount = 8;
    for (var i = 0; i < beltCount; i++) {
      var beltGeom = new THREE.BoxGeometry(80, 3, 8);
      var beltMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
      var belt = new THREE.Mesh(beltGeom, beltMat);
      belt.position.set(0, 10 + i * 4, 70 + i * 3);
      belt.rotation.z = Math.PI / 12;
      belt.castShadow = true;
      scene.add(belt);
    }
  }

  function buildEngineBlockPiles() {
    var pilePositions = [
      { x: 80, z: 100 },
      { x: -100, z: -80 }
    ];

    pilePositions.forEach(function(pos) {
      for (var i = 0; i < 6; i++) {
        var blockGeom = new THREE.BoxGeometry(12, 8, 14);
        var blockMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var block = new THREE.Mesh(blockGeom, blockMat);
        block.position.set(
          pos.x + (Math.random() - 0.5) * 20,
          4 + i * 8.5,
          pos.z + (Math.random() - 0.5) * 20
        );
        block.castShadow = true;
        scene.add(block);
      }
    });
  }

  function buildExhaustPipeTangle() {
    var pipeCount = 12;
    for (var i = 0; i < pipeCount; i++) {
      var pipeGeom = new THREE.CylinderGeometry(2, 2, 30, 8);
      var pipeMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
      var pipe = new THREE.Mesh(pipeGeom, pipeMat);
      pipe.position.set(
        (Math.random() - 0.5) * 60 + 30,
        10 + Math.random() * 20,
        (Math.random() - 0.5) * 40 + 40
      );
      pipe.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      pipe.castShadow = true;
      scene.add(pipe);
    }
  }

  function buildShippingContainer() {
    var containerGeom = new THREE.BoxGeometry(30, 25, 50);
    var containerMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var container = new THREE.Mesh(containerGeom, containerMat);
    container.position.set(60, 12.5, 80);
    container.castShadow = true;
    scene.add(container);

    var doorsGeom = new THREE.BoxGeometry(14, 20, 1);
    var doorsMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
    var doors = new THREE.Mesh(doorsGeom, doorsMat);
    doors.position.set(75, 12.5, 105);
    doors.castShadow = true;
    scene.add(doors);
  }

  function buildCrowPerch() {
    var perchGeom = new THREE.ConeGeometry(8, 20, 8);
    var perchMat = new THREE.MeshLambertMaterial({ color: 0x6b5344 });
    var perch = new THREE.Mesh(perchGeom, perchMat);
    perch.position.set(-60, 40, 100);
    perch.castShadow = true;
    scene.add(perch);

    var birdCount = 3;
    for (var i = 0; i < birdCount; i++) {
      var birdGeom = new THREE.ConeGeometry(1.5, 3, 6);
      var birdMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      var bird = new THREE.Mesh(birdGeom, birdMat);
      bird.position.set(
        -60 + (Math.random() - 0.5) * 5,
        45 + Math.random() * 5,
        100 + (Math.random() - 0.5) * 5
      );
      bird.castShadow = true;
      scene.add(bird);
    }
  }

  function buildStrippedVehicleFrames() {
    var framePositions = [
      { x: 100, z: 60 },
      { x: -80, z: -60 },
      { x: 40, z: -40 }
    ];

    framePositions.forEach(function(pos) {
      var points = [
        new THREE.Vector3(pos.x, 0, pos.z),
        new THREE.Vector3(pos.x + 20, 15, pos.z),
        new THREE.Vector3(pos.x + 35, 20, pos.z + 15),
        new THREE.Vector3(pos.x + 30, 10, pos.z + 30),
        new THREE.Vector3(pos.x, 5, pos.z + 20)
      ];
      var frameGeom = new THREE.BufferGeometry().setFromPoints(points);
      var frameMat = new THREE.LineBasicMaterial({ color: 0x777777, linewidth: 1 });
      var frame = new THREE.LineSegments(frameGeom, frameMat);
      scene.add(frame);
    });
  }

  function buildOilSlick() {
    var slickGeom = new THREE.BoxGeometry(80, 0.1, 60);
    var slickMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
    var slick = new THREE.Mesh(slickGeom, slickMat);
    slick.position.set(20, 0.05, -80);
    slick.receiveShadow = true;
    scene.add(slick);
  }

  function buildBurnedSection() {
    var burnCount = 15;
    for (var i = 0; i < burnCount; i++) {
      var debrisGeom = new THREE.BoxGeometry(
        10 + Math.random() * 8,
        5 + Math.random() * 5,
        10 + Math.random() * 8
      );
      var debrisMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      var debris = new THREE.Mesh(debrisGeom, debrisMat);
      debris.position.set(
        -40 + Math.random() * 40,
        2 + Math.random() * 3,
        30 + Math.random() * 30
      );
      debris.castShadow = true;
      debris.receiveShadow = true;
      scene.add(debris);
    }
  }

  function buildRustParticles() {
    var particleCount = 50;
    for (var i = 0; i < particleCount; i++) {
      var particleGeom = new THREE.SphereGeometry(0.3, 4, 4);
      var particleMat = new THREE.MeshLambertMaterial({ color: 0xb8460b });
      var particle = new THREE.Mesh(particleGeom, particleMat);
      particle.position.set(
        (Math.random() - 0.5) * 200,
        Math.random() * 80,
        (Math.random() - 0.5) * 200
      );
      particle.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          -0.01,
          (Math.random() - 0.5) * 0.02
        ),
        life: Math.random() * 10
      };
      scene.add(particle);
      rustParticles.push(particle);
    }
  }

  function update(delta) {
    gameState.time += delta;

    if (craneArm) {
      craneRotation += delta * 0.15;
      craneArm.position.x = 30 * Math.cos(craneRotation);
      craneArm.position.z = 30 * Math.sin(craneRotation);
      craneArm.rotation.y = craneRotation;
    }

    oilDrums.forEach(function(drum) {
      var wobbleAmount = Math.sin(gameState.time * 2 + drum.userData.wobble) * 0.05;
      drum.position.y = drum.userData.originalY + wobbleAmount;
    });

    scrapPiles.forEach(function(pile) {
      var settling = Math.sin(gameState.time * 0.5) * 0.02;
      pile.mesh.position.y = pile.originalY + settling;
    });

    rustParticles.forEach(function(particle) {
      particle.position.add(particle.userData.velocity);
      particle.userData.life -= delta;
      if (particle.userData.life <= 0) {
        particle.position.set(
          (Math.random() - 0.5) * 200,
          Math.random() * 80,
          (Math.random() - 0.5) * 200
        );
        particle.userData.life = Math.random() * 10;
      }
    });

    impactedDrums.forEach(function(impact, drum) {
      impact.time += delta;
      if (impact.time > 0.5) {
        impactedDrums.delete(drum);
      } else {
        drum.position.y = drum.userData.originalY + Math.sin(impact.time * 20) * 0.3;
      }
    });
  }

  function reset() {
    gameState = { time: 0 };
    craneRotation = 0;
    impactedDrums.clear();
    oilDrums.forEach(function(drum) {
      drum.position.y = drum.userData.originalY;
    });
    scrapPiles.forEach(function(pile) {
      pile.mesh.position.y = pile.originalY;
    });
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
