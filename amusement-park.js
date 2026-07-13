window.AmusementPark = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var ferrisWheelGroup = null;
  var carouselGroup = null;
  var neonSigns = [];
  var bumperCarArena = null;
  var gateArm = null;
  var time = 0;

  function createFerrisWheel() {
    var group = new THREE.Group();

    // Main ring structure
    var ringGeometry = new THREE.CylinderGeometry(15, 15, 1.5, 32);
    var ringMaterial = new THREE.MeshStandardMaterial({ color: 0x884422 });
    var ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.z = Math.PI / 2;
    ring.castShadow = true;
    ring.receiveShadow = true;
    group.add(ring);

    // Gondola cars
    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var carGroup = new THREE.Group();

      var carGeometry = new THREE.BoxGeometry(2, 2.5, 1.5);
      var carMaterial = new THREE.MeshStandardMaterial({ color: 0xCC8844 });
      var car = new THREE.Mesh(carGeometry, carMaterial);
      car.position.z = Math.cos(angle) * 15;
      car.position.y = Math.sin(angle) * 15;
      car.castShadow = true;
      car.receiveShadow = true;
      carGroup.add(car);

      group.add(carGroup);
    }

    group.position.set(0, 0, 0);
    return group;
  }

  function createRollerCoaster() {
    var group = new THREE.Group();

    // Curved track sections elevated
    for (var i = 0; i < 8; i++) {
      var trackGeometry = new THREE.BoxGeometry(3, 0.5, 4);
      var trackMaterial = new THREE.MeshStandardMaterial({ color: 0x555544 });
      var track = new THREE.Mesh(trackGeometry, trackMaterial);
      track.position.x = (i - 4) * 5;
      track.position.y = 8 + Math.sin(i * 0.5) * 3;
      track.rotation.z = Math.sin(i * 0.3) * 0.3;
      track.castShadow = true;
      track.receiveShadow = true;
      group.add(track);
    }

    group.position.set(-20, 5, -30);
    return group;
  }

  function createCarousel() {
    var group = new THREE.Group();

    // Central pole
    var poleGeometry = new THREE.CylinderGeometry(1, 1, 10, 16);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.castShadow = true;
    pole.receiveShadow = true;
    group.add(pole);

    // Horses
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var horseGroup = new THREE.Group();

      // Horse body
      var bodyGeometry = new THREE.BoxGeometry(1.5, 1, 2);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(Math.cos(angle) * 6, 2, Math.sin(angle) * 6);
      body.castShadow = true;
      body.receiveShadow = true;
      horseGroup.add(body);

      // Horse head
      var headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.6);
      var headMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(Math.cos(angle) * 6, 2.8, Math.sin(angle) * 6 + 1);
      head.castShadow = true;
      head.receiveShadow = true;
      horseGroup.add(head);

      horseGroup.userData.startY = 2;
      horseGroup.userData.angle = angle;
      group.add(horseGroup);
    }

    group.position.set(25, 0, 20);
    return group;
  }

  function createFunhouse() {
    var group = new THREE.Group();

    // Building shell
    var buildingGeometry = new THREE.BoxGeometry(12, 10, 12);
    var buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x334455 });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.y = 5;
    building.castShadow = true;
    building.receiveShadow = true;
    group.add(building);

    // Mirror frames (LineSegments)
    for (var i = 0; i < 4; i++) {
      var points = [
        new THREE.Vector3(-5 + i * 4, 1, -5),
        new THREE.Vector3(-5 + i * 4, 9, -5),
        new THREE.Vector3(-5 + i * 4, 1, 5),
        new THREE.Vector3(-5 + i * 4, 9, 5)
      ];
      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var material = new THREE.LineBasicMaterial({ color: 0x88CCFF, linewidth: 2 });
      var lines = new THREE.LineSegments(geometry, material);
      lines.position.y = 5;
      group.add(lines);
    }

    group.position.set(-30, 0, 0);
    return group;
  }

  function createClownStatue() {
    var group = new THREE.Group();

    // Body
    var bodyGeometry = new THREE.BoxGeometry(1.5, 3, 1);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xCC2222 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Head
    var headGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    var headMaterial = new THREE.MeshStandardMaterial({ color: 0xFFDDCC });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 4;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    group.position.set(15, 0, -20);
    return group;
  }

  function createGameBooths() {
    var group = new THREE.Group();

    for (var i = 0; i < 5; i++) {
      var boothGeometry = new THREE.BoxGeometry(3, 4, 2);
      var boothMaterial = new THREE.MeshStandardMaterial({ color: 0x884422 });
      var booth = new THREE.Mesh(boothGeometry, boothMaterial);
      booth.position.set(i * 4 - 8, 2, -25);
      booth.castShadow = true;
      booth.receiveShadow = true;
      group.add(booth);
    }

    group.position.set(10, 0, 0);
    return group;
  }

  function createHauntedHouse() {
    var group = new THREE.Group();

    // Main building
    var buildingGeometry = new THREE.BoxGeometry(8, 8, 8);
    var buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x332211 });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.y = 4;
    building.castShadow = true;
    building.receiveShadow = true;
    group.add(building);

    // Spire
    var spireGeometry = new THREE.ConeGeometry(2, 6, 16);
    var spireMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var spire = new THREE.Mesh(spireGeometry, spireMaterial);
    spire.position.y = 11;
    spire.castShadow = true;
    spire.receiveShadow = true;
    group.add(spire);

    group.position.set(-15, 0, 25);
    return group;
  }

  function createCottonCandyStand() {
    var group = new THREE.Group();

    // Pole
    var poleGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 16);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x884422 });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 1.5;
    pole.castShadow = true;
    pole.receiveShadow = true;
    group.add(pole);

    // Fluffy puff
    var puffGeometry = new THREE.SphereGeometry(2.5, 16, 16);
    var puffMaterial = new THREE.MeshStandardMaterial({ color: 0xFF99BB });
    var puff = new THREE.Mesh(puffGeometry, puffMaterial);
    puff.position.y = 4;
    puff.castShadow = true;
    puff.receiveShadow = true;
    puff.userData.type = 'cottonCandy';
    group.add(puff);

    group.position.set(30, 0, 15);
    return group;
  }

  function createBumperCarArena() {
    var group = new THREE.Group();

    // Arena ring wall
    var wallGeometry = new THREE.BoxGeometry(20, 1.5, 20);
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x776655 });
    var wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.y = 0.75;
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);

    // Bumper cars inside
    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var carGeometry = new THREE.BoxGeometry(1.5, 0.8, 1.5);
      var carMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF2200,
        emissive: 0xFF2200,
        emissiveIntensity: 0
      });
      var car = new THREE.Mesh(carGeometry, carMaterial);
      car.position.set(Math.cos(angle) * 6, 0.8, Math.sin(angle) * 6);
      car.castShadow = true;
      car.receiveShadow = true;
      car.userData.type = 'bumperCar';
      car.userData.angle = angle;
      group.add(car);
    }

    group.position.set(0, 0, 35);
    return group;
  }

  function createWaterSlideTower() {
    var group = new THREE.Group();

    // Main tower
    var towerGeometry = new THREE.BoxGeometry(4, 15, 4);
    var towerMaterial = new THREE.MeshStandardMaterial({ color: 0x226688 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.y = 7.5;
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    // Slide tubes
    for (var i = 0; i < 2; i++) {
      var slideGeometry = new THREE.CylinderGeometry(0.8, 0.8, 12, 16);
      var slideMaterial = new THREE.MeshStandardMaterial({ color: 0x4499CC });
      var slide = new THREE.Mesh(slideGeometry, slideMaterial);
      slide.position.set((i - 0.5) * 2.5, 4, 3);
      slide.rotation.z = 0.3;
      slide.castShadow = true;
      slide.receiveShadow = true;
      group.add(slide);
    }

    group.position.set(-35, 0, -20);
    return group;
  }

  function createTicketBooth() {
    var group = new THREE.Group();

    // Booth structure
    var boothGeometry = new THREE.BoxGeometry(4, 3, 3);
    var boothMaterial = new THREE.MeshStandardMaterial({ color: 0x8B6914 });
    var booth = new THREE.Mesh(boothGeometry, boothMaterial);
    booth.position.y = 1.5;
    booth.castShadow = true;
    booth.receiveShadow = true;
    group.add(booth);

    // Gate arm
    var armGeometry = new THREE.BoxGeometry(0.3, 0.3, 3);
    var armMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    var arm = new THREE.Mesh(armGeometry, armMaterial);
    arm.position.set(2.5, 1.5, 0);
    arm.castShadow = true;
    arm.receiveShadow = true;
    arm.userData.type = 'gateArm';
    group.add(arm);

    gateArm = arm;

    group.position.set(40, 0, -35);
    return group;
  }

  function createNeonSigns() {
    var group = new THREE.Group();

    for (var i = 0; i < 3; i++) {
      var signGeometry = new THREE.BoxGeometry(4, 2, 0.2);
      var signMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        emissive: 0xFF0088,
        emissiveIntensity: 0
      });
      var sign = new THREE.Mesh(signGeometry, signMaterial);
      sign.position.set(i * 15 - 15, 8, -40);
      sign.castShadow = true;
      sign.receiveShadow = true;
      sign.userData.type = 'neonSign';
      sign.userData.flickerPhase = i * 2;
      group.add(sign);
      neonSigns.push(sign);
    }

    return group;
  }

  function createLitter() {
    var group = new THREE.Group();

    var positions = [
      [-10, 0.1, -15],
      [5, 0.1, 8],
      [-20, 0.1, 10],
      [15, 0.1, -10],
      [-5, 0.1, 25]
    ];

    for (var i = 0; i < positions.length; i++) {
      var wrapperGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.4);
      var wrapperMaterial = new THREE.MeshStandardMaterial({ color: 0xFFCC00 });
      var wrapper = new THREE.Mesh(wrapperGeometry, wrapperMaterial);
      wrapper.position.set(positions[i][0], positions[i][1], positions[i][2]);
      wrapper.rotation.z = Math.random() * Math.PI;
      wrapper.castShadow = true;
      wrapper.receiveShadow = true;
      group.add(wrapper);
    }

    return group;
  }

  function createPopcornCart() {
    var group = new THREE.Group();

    // Cart pole
    var poleGeometry = new THREE.CylinderGeometry(0.6, 0.6, 2, 16);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x886622 });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 1;
    pole.castShadow = true;
    pole.receiveShadow = true;
    group.add(pole);

    // Popcorn container
    var containerGeometry = new THREE.SphereGeometry(1.8, 16, 16);
    var containerMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00 });
    var container = new THREE.Mesh(containerGeometry, containerMaterial);
    container.position.y = 3;
    container.castShadow = true;
    container.receiveShadow = true;
    group.add(container);

    group.position.set(-40, 0, 10);
    return group;
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];
    neonSigns = [];
    time = 0;

    ferrisWheelGroup = createFerrisWheel();
    scene.add(ferrisWheelGroup);
    objects.push(ferrisWheelGroup);

    var rollerCoaster = createRollerCoaster();
    scene.add(rollerCoaster);
    objects.push(rollerCoaster);

    carouselGroup = createCarousel();
    scene.add(carouselGroup);
    objects.push(carouselGroup);

    var funhouse = createFunhouse();
    scene.add(funhouse);
    objects.push(funhouse);

    var clown = createClownStatue();
    scene.add(clown);
    objects.push(clown);

    var booths = createGameBooths();
    scene.add(booths);
    objects.push(booths);

    var haunted = createHauntedHouse();
    scene.add(haunted);
    objects.push(haunted);

    var cottonCandy = createCottonCandyStand();
    scene.add(cottonCandy);
    objects.push(cottonCandy);

    bumperCarArena = createBumperCarArena();
    scene.add(bumperCarArena);
    objects.push(bumperCarArena);

    var waterSlide = createWaterSlideTower();
    scene.add(waterSlide);
    objects.push(waterSlide);

    var ticketBooth = createTicketBooth();
    scene.add(ticketBooth);
    objects.push(ticketBooth);

    var neonGroup = createNeonSigns();
    scene.add(neonGroup);
    objects.push(neonGroup);

    var litter = createLitter();
    scene.add(litter);
    objects.push(litter);

    var popcorn = createPopcornCart();
    scene.add(popcorn);
    objects.push(popcorn);
  }

  function update(delta) {
    time += delta;

    if (ferrisWheelGroup) {
      ferrisWheelGroup.rotation.z += delta * 0.3;
    }

    if (carouselGroup) {
      carouselGroup.rotation.y += delta * 0.5;

      var horses = carouselGroup.children;
      for (var i = 0; i < horses.length; i++) {
        var horse = horses[i];
        if (horse.userData.startY !== undefined) {
          horse.children[0].position.y = horse.userData.startY + Math.sin(time * 2 + horse.userData.angle) * 0.5;
        }
      }
    }

    for (var i = 0; i < neonSigns.length; i++) {
      var sign = neonSigns[i];
      var flicker = Math.sin(time * 4 + sign.userData.flickerPhase) * 0.5 + 0.5;
      sign.material.emissiveIntensity = flicker * 0.8;
    }

    if (bumperCarArena) {
      var carChildren = bumperCarArena.children;
      for (var j = 1; j < carChildren.length; j++) {
        var car = carChildren[j];
        if (car.userData.type === 'bumperCar') {
          var spark = Math.sin(time * 6 + car.userData.angle) * 0.5 + 0.5;
          car.material.emissiveIntensity = spark * 0.6;
        }
      }
    }

    if (gateArm) {
      var swing = Math.sin(time * 1.5) * 0.6;
      gateArm.rotation.z = swing;
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    neonSigns = [];
    ferrisWheelGroup = null;
    carouselGroup = null;
    bumperCarArena = null;
    gateArm = null;
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
