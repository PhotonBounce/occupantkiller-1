window.GhostVillage = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var buildings = [];
  var particles = [];
  var dynamicObjects = [];
  var lines = [];

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    buildings = [];
    particles = [];
    dynamicObjects = [];
    lines = [];

    buildApartmentBlocks();
    buildFairground();
    buildRoads();
    buildAbandonedCar();
    buildSchool();
    buildHospital();
    buildPool();
    buildGym();
    buildCulturalHall();
    buildParkBenches();
    buildFallenTrees();
    buildPersonalBelongings();
    buildRadiationSigns();
    buildMossAndVines();
    initializeParticles();
  }

  function buildApartmentBlocks() {
    var blockConfigs = [
      { x: -80, z: -100, floors: 5, width: 30, depth: 25 },
      { x: 60, z: -120, floors: 6, width: 35, depth: 28 },
      { x: -40, z: 80, floors: 4, width: 28, depth: 24 },
      { x: 90, z: 60, floors: 5, width: 30, depth: 26 }
    ];

    blockConfigs.forEach(function(config) {
      var buildingGroup = new THREE.Group();

      var mainStructure = new THREE.Mesh(
        new THREE.BoxGeometry(config.width, config.floors * 12, config.depth),
        new THREE.MeshStandardMaterial({ color: 0x8B7D6B, roughness: 0.9, metalness: 0.1 })
      );
      mainStructure.castShadow = true;
      mainStructure.receiveShadow = true;
      buildingGroup.add(mainStructure);

      for (var floor = 0; floor < config.floors; floor++) {
        for (var col = 0; col < 4; col++) {
          var windowX = -config.width / 2 + 5 + col * (config.width / 4.5);
          var windowY = -config.floors * 6 + floor * 12 + 3;

          var window = new THREE.Mesh(
            new THREE.BoxGeometry(4, 4, 1),
            new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.8 })
          );
          window.position.set(windowX, windowY, config.depth / 2 + 0.5);
          window.castShadow = true;
          buildingGroup.add(window);
        }
      }

      buildingGroup.position.set(config.x, config.floors * 6, config.z);
      scene.add(buildingGroup);
      buildings.push(buildingGroup);
    });
  }

  function buildFairground() {
    var ferrisWheelGroup = new THREE.Group();

    var wheelBase = new THREE.Mesh(
      new THREE.BoxGeometry(80, 2, 80),
      new THREE.MeshStandardMaterial({ color: 0x4A4A4A, roughness: 0.95 })
    );
    wheelBase.position.y = 1;
    ferrisWheelGroup.add(wheelBase);

    var centerPole = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 50, 8),
      new THREE.MeshStandardMaterial({ color: 0x3A3A3A, roughness: 0.9 })
    );
    centerPole.position.y = 25;
    centerPole.castShadow = true;
    ferrisWheelGroup.add(centerPole);

    var wheelGroup = new THREE.Group();
    wheelGroup.position.set(0, 50, 0);

    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var gondolaX = Math.cos(angle) * 35;
      var gondolaZ = Math.sin(angle) * 35;

      var gondola = new THREE.Mesh(
        new THREE.BoxGeometry(8, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x2A5F2A, roughness: 0.7 })
      );
      gondola.position.set(gondolaX, 0, gondolaZ);
      gondola.castShadow = true;
      wheelGroup.add(gondola);

      var connectorPole = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 35, 6),
        new THREE.MeshStandardMaterial({ color: 0x1A1A1A })
      );
      connectorPole.position.set(gondolaX / 2, -17.5, gondolaZ / 2);
      wheelGroup.add(connectorPole);
    }

    for (var j = 0; j < 6; j++) {
      var discRadius = 35 - j * 5;
      var disc = new THREE.Mesh(
        new THREE.CylinderGeometry(discRadius, discRadius, 0.8, 32),
        new THREE.MeshStandardMaterial({ color: 0x5A5A5A, roughness: 0.85 })
      );
      disc.position.y = -j * 3;
      wheelGroup.add(disc);
    }

    ferrisWheelGroup.add(wheelGroup);
    dynamicObjects.push(wheelGroup);

    ferrisWheelGroup.position.set(0, 0, -200);
    scene.add(ferrisWheelGroup);

    var bumperCarArena = new THREE.Mesh(
      new THREE.BoxGeometry(60, 0.5, 60),
      new THREE.MeshStandardMaterial({ color: 0x6A6A6A, roughness: 0.9 })
    );
    bumperCarArena.position.set(100, 0.5, -200);
    scene.add(bumperCarArena);

    var arenaWall = new THREE.Mesh(
      new THREE.BoxGeometry(62, 4, 2),
      new THREE.MeshStandardMaterial({ color: 0x4A4A4A })
    );
    arenaWall.position.set(100, 2, -230);
    scene.add(arenaWall);

    for (var k = 0; k < 4; k++) {
      var bumperCar = new THREE.Mesh(
        new THREE.BoxGeometry(6, 2, 8),
        new THREE.MeshStandardMaterial({ color: 0xA85A3A, roughness: 0.6 })
      );
      bumperCar.position.set(70 + k * 12, 2, -200 + Math.random() * 20);
      bumperCar.castShadow = true;
      scene.add(bumperCar);
    }

    var carouselBase = new THREE.Mesh(
      new THREE.CylinderGeometry(20, 20, 1, 32),
      new THREE.MeshStandardMaterial({ color: 0x5A7A5A, roughness: 0.8 })
    );
    carouselBase.position.set(-100, 0.5, -150);
    scene.add(carouselBase);

    var carouselPole = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 15, 8),
      new THREE.MeshStandardMaterial({ color: 0x1A1A1A })
    );
    carouselPole.position.set(-100, 7.5, -150);
    carouselPole.castShadow = true;
    scene.add(carouselPole);

    for (var m = 0; m < 8; m++) {
      var horseAngle = (m / 8) * Math.PI * 2;
      var horseX = -100 + Math.cos(horseAngle) * 12;
      var horseZ = -150 + Math.sin(horseAngle) * 12;

      var horse = new THREE.Mesh(
        new THREE.BoxGeometry(3, 4, 5),
        new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 })
      );
      horse.position.set(horseX, 3, horseZ);
      horse.castShadow = true;
      scene.add(horse);
    }
  }

  function buildRoads() {
    var road1 = new THREE.Mesh(
      new THREE.BoxGeometry(300, 0.3, 40),
      new THREE.MeshStandardMaterial({ color: 0x3A3A3A, roughness: 0.95 })
    );
    road1.position.y = 0.15;
    scene.add(road1);

    var road2 = new THREE.Mesh(
      new THREE.BoxGeometry(40, 0.3, 300),
      new THREE.MeshStandardMaterial({ color: 0x3A3A3A, roughness: 0.95 })
    );
    road2.position.y = 0.15;
    scene.add(road2);

    for (var i = 0; i < 30; i++) {
      var weedX = -150 + Math.random() * 300;
      var weedZ = -150 + Math.random() * 300;

      var weed = new THREE.Mesh(
        new THREE.ConeGeometry(2, 4, 6),
        new THREE.MeshStandardMaterial({ color: 0x3A5A3A, roughness: 0.8 })
      );
      weed.position.set(weedX, 2, weedZ);
      weed.rotation.z = Math.random() * 0.3;
      weed.castShadow = true;
      scene.add(weed);
    }
  }

  function buildAbandonedCar() {
    var carGroup = new THREE.Group();

    var carBody = new THREE.Mesh(
      new THREE.BoxGeometry(6, 3.5, 12),
      new THREE.MeshStandardMaterial({ color: 0x4A4A4A, roughness: 0.85 })
    );
    carBody.castShadow = true;
    carGroup.add(carBody);

    var carTop = new THREE.Mesh(
      new THREE.BoxGeometry(5, 2, 6),
      new THREE.MeshStandardMaterial({ color: 0x5A5A5A })
    );
    carTop.position.y = 3.25;
    carGroup.add(carTop);

    for (var i = 0; i < 4; i++) {
      var wheelX = i < 2 ? -2.5 : 2.5;
      var wheelZ = i % 2 === 0 ? -4 : 4;

      var wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 1.8, 1.2, 16),
        new THREE.MeshStandardMaterial({ color: 0x1A1A1A })
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wheelX, 1.5, wheelZ);
      carGroup.add(wheel);
    }

    carGroup.position.set(50, 1.5, 100);
    scene.add(carGroup);
  }

  function buildSchool() {
    var schoolBuilding = new THREE.Mesh(
      new THREE.BoxGeometry(50, 20, 40),
      new THREE.MeshStandardMaterial({ color: 0x7A6A5A, roughness: 0.9 })
    );
    schoolBuilding.position.set(-120, 10, 120);
    schoolBuilding.castShadow = true;
    scene.add(schoolBuilding);

    var flagpole = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 20, 8),
      new THREE.MeshStandardMaterial({ color: 0x3A3A3A })
    );
    flagpole.position.set(-120, 10, 80);
    flagpole.castShadow = true;
    scene.add(flagpole);

    for (var i = 0; i < 6; i++) {
      for (var j = 0; j < 5; j++) {
        var desk = new THREE.Mesh(
          new THREE.BoxGeometry(3, 2, 2),
          new THREE.MeshStandardMaterial({ color: 0x6B4423, roughness: 0.75 })
        );
        desk.position.set(-120 + i * 8 - 16, 2, 120 + j * 5 - 10);
        scene.add(desk);
      }
    }
  }

  function buildHospital() {
    var hospitalBuilding = new THREE.Mesh(
      new THREE.BoxGeometry(45, 22, 50),
      new THREE.MeshStandardMaterial({ color: 0x8A8A7A, roughness: 0.88 })
    );
    hospitalBuilding.position.set(140, 11, 80);
    hospitalBuilding.castShadow = true;
    scene.add(hospitalBuilding);

    for (var i = 0; i < 5; i++) {
      var gurney = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 6),
        new THREE.MeshStandardMaterial({ color: 0x7A7A7A, roughness: 0.7 })
      );
      gurney.rotation.z = 0.3;
      gurney.position.set(140 + i * 8 - 16, 1.5, 80 + Math.random() * 20);
      scene.add(gurney);
    }
  }

  function buildPool() {
    var poolBasin = new THREE.Mesh(
      new THREE.BoxGeometry(60, 8, 40),
      new THREE.MeshStandardMaterial({ color: 0x4A4A6A, roughness: 0.9 })
    );
    poolBasin.position.set(-150, -4, -80);
    poolBasin.castShadow = true;
    scene.add(poolBasin);

    var poolWallTop = new THREE.Mesh(
      new THREE.BoxGeometry(62, 0.5, 42),
      new THREE.MeshStandardMaterial({ color: 0x5A5A7A })
    );
    poolWallTop.position.set(-150, 4.25, -80);
    scene.add(poolWallTop);

    var divingBoard = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1, 12),
      new THREE.MeshStandardMaterial({ color: 0x6B4423 })
    );
    divingBoard.rotation.z = 0.2;
    divingBoard.position.set(-150, 6, -100);
    scene.add(divingBoard);
  }

  function buildGym() {
    var gymBuilding = new THREE.Mesh(
      new THREE.BoxGeometry(70, 25, 55),
      new THREE.MeshStandardMaterial({ color: 0x7A7A6A, roughness: 0.92 })
    );
    gymBuilding.position.set(80, 12.5, -80);
    gymBuilding.castShadow = true;
    scene.add(gymBuilding);

    for (var i = 0; i < 4; i++) {
      var barbell = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 12, 8),
        new THREE.MeshStandardMaterial({ color: 0x3A3A3A })
      );
      barbell.rotation.z = Math.PI / 2;
      barbell.position.set(80 + i * 15 - 22.5, 2, -80);
      scene.add(barbell);
    }
  }

  function buildCulturalHall() {
    var hallBuilding = new THREE.Mesh(
      new THREE.BoxGeometry(55, 18, 48),
      new THREE.MeshStandardMaterial({ color: 0x8B7D6B, roughness: 0.88 })
    );
    hallBuilding.position.set(-40, 9, -220);
    hallBuilding.castShadow = true;
    scene.add(hallBuilding);

    var stageRiser = new THREE.Mesh(
      new THREE.BoxGeometry(50, 2, 15),
      new THREE.MeshStandardMaterial({ color: 0x5A4A3A })
    );
    stageRiser.position.set(-40, 2, -240);
    scene.add(stageRiser);
  }

  function buildParkBenches() {
    var benchPositions = [
      { x: -50, z: 40 },
      { x: 20, z: 60 },
      { x: -80, z: -40 },
      { x: 110, z: 20 }
    ];

    benchPositions.forEach(function(pos) {
      var benchSeat = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.8, 2),
        new THREE.MeshStandardMaterial({ color: 0x6B4423, roughness: 0.75 })
      );
      benchSeat.position.set(pos.x, 1.5, pos.z);
      benchSeat.castShadow = true;
      scene.add(benchSeat);

      var backrestLeft = new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(pos.x - 4, 1.5, pos.z),
          new THREE.Vector3(pos.x - 4, 3.5, pos.z)
        ]),
        new THREE.LineBasicMaterial({ color: 0x6B4423, linewidth: 3 })
      );
      lines.push(backrestLeft);
      scene.add(backrestLeft);

      var backrestRight = new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(pos.x + 4, 1.5, pos.z),
          new THREE.Vector3(pos.x + 4, 3.5, pos.z)
        ]),
        new THREE.LineBasicMaterial({ color: 0x6B4423, linewidth: 3 })
      );
      lines.push(backrestRight);
      scene.add(backrestRight);
    });
  }

  function buildFallenTrees() {
    for (var i = 0; i < 6; i++) {
      var treeX = -200 + Math.random() * 400;
      var treeZ = -250 + Math.random() * 300;
      var treeAngle = Math.random() * Math.PI * 2;

      var trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2.5, 25, 8),
        new THREE.MeshStandardMaterial({ color: 0x4A3A2A, roughness: 0.85 })
      );
      trunk.rotation.z = treeAngle;
      trunk.position.set(treeX, 1, treeZ);
      trunk.castShadow = true;
      scene.add(trunk);
    }
  }

  function buildPersonalBelongings() {
    for (var i = 0; i < 5; i++) {
      var dollX = -200 + Math.random() * 400;
      var dollZ = -250 + Math.random() * 300;

      var dollHead = new THREE.Mesh(
        new THREE.SphereGeometry(1, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xC9A876, roughness: 0.6 })
      );
      dollHead.position.set(dollX, 1, dollZ);
      dollHead.castShadow = true;
      scene.add(dollHead);

      var dollBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 2.5, 1),
        new THREE.MeshStandardMaterial({ color: 0x8A2A2A, roughness: 0.65 })
      );
      dollBody.position.set(dollX, 2.5, dollZ);
      scene.add(dollBody);
    }

    for (var j = 0; j < 8; j++) {
      var bookStackX = -200 + Math.random() * 400;
      var bookStackZ = -250 + Math.random() * 300;

      var bookStack = new THREE.Mesh(
        new THREE.BoxGeometry(4, 3, 2),
        new THREE.MeshStandardMaterial({ color: 0x3A2A1A, roughness: 0.8 })
      );
      bookStack.rotation.z = (Math.random() - 0.5) * 0.4;
      bookStack.position.set(bookStackX, 1.5, bookStackZ);
      bookStack.castShadow = true;
      scene.add(bookStack);
    }

    for (var k = 0; k < 4; k++) {
      var gasMaskX = -200 + Math.random() * 400;
      var gasMaskZ = -250 + Math.random() * 300;

      var maskFace = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1.5, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x2A2A2A, roughness: 0.75 })
      );
      maskFace.position.set(gasMaskX, 0.5, gasMaskZ);
      maskFace.castShadow = true;
      scene.add(maskFace);

      var filterLeft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 0.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x1A1A1A })
      );
      filterLeft.rotation.z = Math.PI / 2;
      filterLeft.position.set(gasMaskX - 1.5, 0.5, gasMaskZ);
      scene.add(filterLeft);

      var filterRight = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 0.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x1A1A1A })
      );
      filterRight.rotation.z = Math.PI / 2;
      filterRight.position.set(gasMaskX + 1.5, 0.5, gasMaskZ);
      scene.add(filterRight);
    }
  }

  function buildRadiationSigns() {
    var signPositions = [
      { x: 0, z: -250 },
      { x: -150, z: 150 },
      { x: 200, z: -150 },
      { x: 100, z: 100 }
    ];

    signPositions.forEach(function(pos) {
      var signPole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0x1A1A1A })
      );
      signPole.position.set(pos.x, 3, pos.z);
      scene.add(signPole);

      var signBoard = new THREE.Mesh(
        new THREE.BoxGeometry(4, 4, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xFFCC00, roughness: 0.7 })
      );
      signBoard.position.set(pos.x, 6, pos.z);
      signBoard.castShadow = true;
      scene.add(signBoard);

      var radiationSymbol = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x1A1A1A })
      );
      radiationSymbol.position.set(pos.x, 6, pos.z + 0.2);
      scene.add(radiationSymbol);
    });
  }

  function buildMossAndVines() {
    var wallPositions = [
      { x: -80, z: -100, width: 30, height: 60 },
      { x: 60, z: -120, width: 35, height: 72 },
      { x: -40, z: 80, width: 28, height: 48 },
      { x: 90, z: 60, width: 30, height: 60 }
    ];

    wallPositions.forEach(function(wall) {
      for (var i = 0; i < 5; i++) {
        var vineX = wall.x + (Math.random() - 0.5) * wall.width;
        var vineY = wall.height * (Math.random() - 0.2);
        var vineZ = wall.z + 12.5;

        var vine = new THREE.LineSegments(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(vineX, vineY, vineZ),
            new THREE.Vector3(vineX + (Math.random() - 0.5) * 2, vineY - 8, vineZ)
          ]),
          new THREE.LineBasicMaterial({ color: 0x3A5A3A, linewidth: 2 })
        );
        lines.push(vine);
        scene.add(vine);
      }
    });
  }

  function initializeParticles() {
    for (var i = 0; i < 200; i++) {
      var particle = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9 })
      );
      particle.position.set(
        -250 + Math.random() * 500,
        Math.random() * 80 + 5,
        -300 + Math.random() * 400
      );
      particle.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        -0.1 - Math.random() * 0.2,
        (Math.random() - 0.5) * 0.5
      );
      particle.life = 1.0;
      particles.push(particle);
      scene.add(particle);
    }

    for (var j = 0; j < 100; j++) {
      var mist = new THREE.Mesh(
        new THREE.SphereGeometry(3 + Math.random() * 2, 4, 4),
        new THREE.MeshStandardMaterial({
          color: 0xDDDDDD,
          transparent: true,
          opacity: 0.15,
          roughness: 0.95
        })
      );
      mist.position.set(
        -250 + Math.random() * 500,
        10 + Math.random() * 30,
        -300 + Math.random() * 400
      );
      mist.driftX = (Math.random() - 0.5) * 0.1;
      mist.driftZ = (Math.random() - 0.5) * 0.1;
      particles.push(mist);
      scene.add(mist);
    }
  }

  function update(delta) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];

      if (p.velocity) {
        p.position.add(p.velocity.clone().multiplyScalar(delta));
        p.life -= delta * 0.3;
        p.material.opacity = Math.max(0, p.life);

        if (p.life <= 0) {
          scene.remove(p);
          particles.splice(i, 1);
        }
      } else if (p.driftX !== undefined) {
        p.position.x += p.driftX;
        p.position.z += p.driftZ;
        p.position.y += Math.sin(Date.now() * 0.001 + i) * 0.01;

        if (p.position.x < -250 || p.position.x > 250) p.driftX *= -1;
        if (p.position.z < -300 || p.position.z > 100) p.driftZ *= -1;
      }
    }

    if (dynamicObjects.length > 0) {
      var wheelGroup = dynamicObjects[0];
      wheelGroup.rotation.y += 0.001;
    }

    for (var j = 0; j < scene.children.length; j++) {
      var obj = scene.children[j];
      if (obj.isGroup && obj.children.length > 0) {
        if (obj.children[0].isGroup) {
          obj.children[0].rotation.y += 0.0005;
        }
      }
    }
  }

  function reset() {
    particles.forEach(function(p) {
      scene.remove(p);
    });
    particles = [];

    buildings.forEach(function(b) {
      scene.remove(b);
    });
    buildings = [];

    dynamicObjects = [];
    lines = [];

    init(scene, camera);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
