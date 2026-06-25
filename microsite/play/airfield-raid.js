window.AirfieldRaid = (function() {
  'use strict';

  var scene = null;
  var camera = null;

  var radarDish = null;
  var radarRotation = 0;

  var runwayLights = [];
  var runwayLightIndex = 0;
  var runwayLightTimer = 0;

  var taxiwayLights = [];
  var taxiwayLightTimer = 0;

  var beaconLight = null;
  var beaconTimer = 0;

  var fireWreck = null;
  var fireFlames = [];
  var fireFlickerTimer = 0;

  var initialStates = [];

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    initialStates = [];

    buildRunway();
    buildHangars();
    buildControlTower();
    buildParkedAircraft();
    buildFuelTankerTruck();
    buildFuelBladderFarm();
    buildAmmoRevetments();
    buildAAGunPosition();
    buildRadarDish();
    buildTaxiwayLights();
    buildRunwayEdgeLights();
    buildMaintenanceBay();
    buildAircraftMaintenanceStands();
    buildFireSuppressionTender();
    buildPerimeterChainlink();
    buildSandbagPositions();
    buildBlastBarriers();
    buildBurningAircraftWreck();
  }

  function buildRunway() {
    var runwayMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3, roughness: 0.8 });
    var runway = new THREE.Mesh(new THREE.BoxGeometry(200, 0.5, 50), runwayMat);
    runway.position.set(0, 0.25, 0);
    scene.add(runway);
    initialStates.push({ obj: runway, pos: runway.position.clone(), rot: runway.rotation.clone() });

    var markingGeometry = new THREE.BoxGeometry(200, 0.51, 2);
    var markingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x444444 });
    for (var i = -4; i <= 4; i++) {
      var marking = new THREE.Mesh(markingGeometry, markingMat);
      marking.position.set(0, 0.3, i * 5);
      scene.add(marking);
      initialStates.push({ obj: marking, pos: marking.position.clone(), rot: marking.rotation.clone() });
    }

    var edgeMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var leftEdge = new THREE.Mesh(new THREE.BoxGeometry(200, 0.5, 1), edgeMat);
    leftEdge.position.set(0, 0.25, -25);
    scene.add(leftEdge);
    var rightEdge = new THREE.Mesh(new THREE.BoxGeometry(200, 0.5, 1), edgeMat);
    rightEdge.position.set(0, 0.25, 25);
    scene.add(rightEdge);
    initialStates.push({ obj: leftEdge, pos: leftEdge.position.clone(), rot: leftEdge.rotation.clone() });
    initialStates.push({ obj: rightEdge, pos: rightEdge.position.clone(), rot: rightEdge.rotation.clone() });
  }

  function buildHangars() {
    var hangarMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5, roughness: 0.7 });

    for (var i = 0; i < 3; i++) {
      var hangar = new THREE.Mesh(new THREE.BoxGeometry(60, 30, 40), hangarMat);
      hangar.position.set(-80 + i * 80, 15, -60);
      scene.add(hangar);
      initialStates.push({ obj: hangar, pos: hangar.position.clone(), rot: hangar.rotation.clone() });

      var doors = new THREE.Mesh(new THREE.BoxGeometry(55, 28, 2), new THREE.MeshStandardMaterial({ color: 0x333333 }));
      doors.position.set(-80 + i * 80, 15, -40);
      scene.add(doors);
      initialStates.push({ obj: doors, pos: doors.position.clone(), rot: doors.rotation.clone() });
    }
  }

  function buildControlTower() {
    var baseMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.4, roughness: 0.6 });
    var base = new THREE.Mesh(new THREE.BoxGeometry(15, 40, 15), baseMat);
    base.position.set(70, 20, 40);
    scene.add(base);
    initialStates.push({ obj: base, pos: base.position.clone(), rot: base.rotation.clone() });

    var cabMat = new THREE.MeshStandardMaterial({ color: 0x1a4d7a, metalness: 0.6, roughness: 0.3, emissive: 0x0d2540 });
    var cab = new THREE.Mesh(new THREE.BoxGeometry(18, 12, 18), cabMat);
    cab.position.set(70, 48, 40);
    scene.add(cab);
    initialStates.push({ obj: cab, pos: cab.position.clone(), rot: cab.rotation.clone() });

    var beaconGeom = new THREE.SphereGeometry(2, 16, 16);
    var beaconMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, intensity: 0.8 });
    beaconLight = new THREE.Mesh(beaconGeom, beaconMat);
    beaconLight.position.set(70, 56, 40);
    scene.add(beaconLight);
    initialStates.push({ obj: beaconLight, pos: beaconLight.position.clone(), rot: beaconLight.rotation.clone() });
  }

  function buildParkedAircraft() {
    var fuselageMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7, roughness: 0.4 });
    var noseMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.8, roughness: 0.2 });

    for (var i = 0; i < 4; i++) {
      var fuselage = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 18), fuselageMat);
      fuselage.position.set(-60 + i * 40, 2, 20);
      scene.add(fuselage);
      initialStates.push({ obj: fuselage, pos: fuselage.position.clone(), rot: fuselage.rotation.clone() });

      var leftWing = new THREE.Mesh(new THREE.BoxGeometry(20, 0.4, 3), fuselageMat);
      leftWing.position.set(-60 + i * 40 - 10, 1.5, 15);
      scene.add(leftWing);

      var rightWing = new THREE.Mesh(new THREE.BoxGeometry(20, 0.4, 3), fuselageMat);
      rightWing.position.set(-60 + i * 40 + 10, 1.5, 15);
      scene.add(rightWing);

      var nose = new THREE.Mesh(new THREE.ConeGeometry(1.2, 4, 12), noseMat);
      nose.position.set(-60 + i * 40, 2, 28);
      nose.rotation.z = Math.PI / 2;
      scene.add(nose);
      initialStates.push({ obj: leftWing, pos: leftWing.position.clone(), rot: leftWing.rotation.clone() });
      initialStates.push({ obj: rightWing, pos: rightWing.position.clone(), rot: rightWing.rotation.clone() });
      initialStates.push({ obj: nose, pos: nose.position.clone(), rot: nose.rotation.clone() });
    }
  }

  function buildFuelTankerTruck() {
    var cabMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.5, roughness: 0.6 });
    var cab = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 6), cabMat);
    cab.position.set(40, 1.8, -80);
    scene.add(cab);
    initialStates.push({ obj: cab, pos: cab.position.clone(), rot: cab.rotation.clone() });

    var wheelMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    for (var i = 0; i < 4; i++) {
      var wheel = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.8, 16), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(40 + (i < 2 ? -1.5 : 1.5), 1.5, -82 + (i % 2) * 4);
      scene.add(wheel);
      initialStates.push({ obj: wheel, pos: wheel.position.clone(), rot: wheel.rotation.clone() });
    }

    var tankMat = new THREE.MeshStandardMaterial({ color: 0xccaa00, metalness: 0.6, roughness: 0.5 });
    var tank = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 14, 16), tankMat);
    tank.rotation.z = Math.PI / 2;
    tank.position.set(40, 2.2, -68);
    scene.add(tank);
    initialStates.push({ obj: tank, pos: tank.position.clone(), rot: tank.rotation.clone() });
  }

  function buildFuelBladderFarm() {
    var bladderMat = new THREE.MeshStandardMaterial({ color: 0x228b22, metalness: 0.3, roughness: 0.8 });

    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        var bladder = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 12), bladderMat);
        bladder.position.set(-80 + i * 20, 3, -30 + j * 20);
        scene.add(bladder);
        initialStates.push({ obj: bladder, pos: bladder.position.clone(), rot: bladder.rotation.clone() });
      }
    }
  }

  function buildAmmoRevetments() {
    var revetMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, metalness: 0.2, roughness: 0.9 });

    for (var i = 0; i < 5; i++) {
      var wall1 = new THREE.Mesh(new THREE.BoxGeometry(20, 4, 1), revetMat);
      wall1.position.set(50 + i * 25, 2, 60);
      scene.add(wall1);

      var wall2 = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 20), revetMat);
      wall2.position.set(40 + i * 25, 2, 70);
      scene.add(wall2);
      initialStates.push({ obj: wall1, pos: wall1.position.clone(), rot: wall1.rotation.clone() });
      initialStates.push({ obj: wall2, pos: wall2.position.clone(), rot: wall2.rotation.clone() });
    }
  }

  function buildAAGunPosition() {
    var mountMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.5 });
    var mount = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 8), mountMat);
    mount.position.set(100, 1.5, 50);
    scene.add(mount);
    initialStates.push({ obj: mount, pos: mount.position.clone(), rot: mount.rotation.clone() });

    var barrelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.3 });
    for (var i = 0; i < 2; i++) {
      var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 12, 12), barrelMat);
      barrel.rotation.x = Math.PI / 6;
      barrel.position.set(100 + (i === 0 ? -2 : 2), 4, 50);
      scene.add(barrel);
      initialStates.push({ obj: barrel, pos: barrel.position.clone(), rot: barrel.rotation.clone() });
    }
  }

  function buildRadarDish() {
    var pedestalMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5, roughness: 0.6 });
    var pedestal = new THREE.Mesh(new THREE.CylinderGeometry(2, 3, 12, 16), pedestalMat);
    pedestal.position.set(-100, 6, 80);
    scene.add(pedestal);
    initialStates.push({ obj: pedestal, pos: pedestal.position.clone(), rot: pedestal.rotation.clone() });

    var dishMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7, roughness: 0.4 });
    radarDish = new THREE.Mesh(new THREE.BoxGeometry(18, 1, 18), dishMat);
    radarDish.position.set(-100, 14, 80);
    scene.add(radarDish);
    initialStates.push({ obj: radarDish, pos: radarDish.position.clone(), rot: radarDish.rotation.clone() });

    var support = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 2), pedestalMat);
    support.position.set(-100, 10, 80);
    scene.add(support);
    initialStates.push({ obj: support, pos: support.position.clone(), rot: support.rotation.clone() });
  }

  function buildTaxiwayLights() {
    var lightMat = new THREE.MeshStandardMaterial({ color: 0x0066ff, emissive: 0x0066ff, intensity: 0.8 });

    for (var i = 0; i < 12; i++) {
      var light = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), lightMat);
      light.position.set(-80 + i * 15, 0.5, -40);
      scene.add(light);
      taxiwayLights.push(light);
      initialStates.push({ obj: light, pos: light.position.clone(), rot: light.rotation.clone() });
    }
  }

  function buildRunwayEdgeLights() {
    var lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, intensity: 0.7 });

    for (var i = 0; i < 8; i++) {
      var leftLight = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), lightMat);
      leftLight.position.set(-100 + i * 30, 0.3, -26);
      scene.add(leftLight);
      runwayLights.push(leftLight);

      var rightLight = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), lightMat);
      rightLight.position.set(-100 + i * 30, 0.3, 26);
      scene.add(rightLight);
      runwayLights.push(rightLight);
      initialStates.push({ obj: leftLight, pos: leftLight.position.clone(), rot: leftLight.rotation.clone() });
      initialStates.push({ obj: rightLight, pos: rightLight.position.clone(), rot: rightLight.rotation.clone() });
    }
  }

  function buildMaintenanceBay() {
    var bayMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.4, roughness: 0.7 });
    var structure = new THREE.Mesh(new THREE.BoxGeometry(50, 20, 35), bayMat);
    structure.position.set(-50, 10, 50);
    scene.add(structure);
    initialStates.push({ obj: structure, pos: structure.position.clone(), rot: structure.rotation.clone() });

    var doorMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    var door = new THREE.Mesh(new THREE.BoxGeometry(40, 18, 1), doorMat);
    door.position.set(-50, 10, 67.5);
    scene.add(door);
    initialStates.push({ obj: door, pos: door.position.clone(), rot: door.rotation.clone() });
  }

  function buildAircraftMaintenanceStands() {
    var standMat = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.5, roughness: 0.6 });

    for (var i = 0; i < 3; i++) {
      var verticalPost = new THREE.Mesh(new THREE.BoxGeometry(1.5, 15, 1.5), standMat);
      verticalPost.position.set(-70 + i * 20, 7.5, 35);
      scene.add(verticalPost);

      var horizontalBrace = new THREE.Mesh(new THREE.BoxGeometry(12, 1, 1), standMat);
      horizontalBrace.position.set(-70 + i * 20, 12, 35);
      scene.add(horizontalBrace);
      initialStates.push({ obj: verticalPost, pos: verticalPost.position.clone(), rot: verticalPost.rotation.clone() });
      initialStates.push({ obj: horizontalBrace, pos: horizontalBrace.position.clone(), rot: horizontalBrace.rotation.clone() });
    }
  }

  function buildFireSuppressionTender() {
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.5, roughness: 0.6 });
    var body = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 10), bodyMat);
    body.position.set(20, 2.2, -70);
    scene.add(body);
    initialStates.push({ obj: body, pos: body.position.clone(), rot: body.rotation.clone() });

    var wheelMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    for (var i = 0; i < 4; i++) {
      var wheel = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.8, 12), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(20 + (i < 2 ? -1.5 : 1.5), 1.2, -75 + (i % 2) * 8);
      scene.add(wheel);
      initialStates.push({ obj: wheel, pos: wheel.position.clone(), rot: wheel.rotation.clone() });
    }
  }

  function buildPerimeterChainlink() {
    var postMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.5 });
    var wirePoints = [];

    for (var i = 0; i < 6; i++) {
      var post = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5, 0.8), postMat);
      var angle = (i / 6) * Math.PI * 2;
      post.position.set(Math.cos(angle) * 150, 2.5, Math.sin(angle) * 150);
      scene.add(post);
      wirePoints.push(post.position.clone());
      initialStates.push({ obj: post, pos: post.position.clone(), rot: post.rotation.clone() });
    }

    wirePoints.push(wirePoints[0].clone());
    var wireGeometry = new THREE.BufferGeometry().setFromPoints(wirePoints);
    var wireMat = new THREE.LineBasicMaterial({ color: 0x888888 });
    var wireframe = new THREE.LineSegments(wireGeometry, wireMat);
    scene.add(wireframe);
  }

  function buildSandbagPositions() {
    var sandbagMat = new THREE.MeshStandardMaterial({ color: 0xaa9966, metalness: 0.2, roughness: 0.9 });

    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      for (var j = 0; j < 3; j++) {
        var bag = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1), sandbagMat);
        bag.position.set(
          Math.cos(angle) * 120 + Math.cos(angle + Math.PI / 2) * (j - 1) * 2,
          0.5 + j * 0.5,
          Math.sin(angle) * 120 + Math.sin(angle + Math.PI / 2) * (j - 1) * 2
        );
        scene.add(bag);
        initialStates.push({ obj: bag, pos: bag.position.clone(), rot: bag.rotation.clone() });
      }
    }
  }

  function buildBlastBarriers() {
    var barrierMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.3, roughness: 0.8 });

    for (var i = 0; i < 6; i++) {
      var barrier = new THREE.Mesh(new THREE.BoxGeometry(15, 3, 1.5), barrierMat);
      barrier.position.set(-40 + i * 25, 1.5, 65);
      scene.add(barrier);
      initialStates.push({ obj: barrier, pos: barrier.position.clone(), rot: barrier.rotation.clone() });
    }
  }

  function buildBurningAircraftWreck() {
    var wreckMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.4, roughness: 0.8 });
    fireWreck = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 15), wreckMat);
    fireWreck.position.set(0, 1.8, 80);
    scene.add(fireWreck);
    initialStates.push({ obj: fireWreck, pos: fireWreck.position.clone(), rot: fireWreck.rotation.clone() });

    var fireMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff4400, intensity: 1.0 });
    for (var i = 0; i < 6; i++) {
      var flame = new THREE.Mesh(new THREE.SphereGeometry(2 + i * 0.5, 8, 8), fireMat);
      flame.position.set(0, 4 + i * 2, 80);
      scene.add(flame);
      fireFlames.push(flame);
      initialStates.push({ obj: flame, pos: flame.position.clone(), rot: flame.rotation.clone() });
    }
  }

  function update(delta) {
    if (radarDish) {
      radarRotation += delta * 0.5;
      radarDish.rotation.y = radarRotation;
    }

    runwayLightTimer += delta;
    if (runwayLightTimer > 0.15) {
      runwayLightTimer = 0;
      for (var i = 0; i < runwayLights.length; i++) {
        var light = runwayLights[i];
        var isActive = (i + runwayLightIndex) % runwayLights.length < runwayLights.length / 2;
        light.material.opacity = isActive ? 1.0 : 0.2;
      }
      runwayLightIndex = (runwayLightIndex + 1) % runwayLights.length;
    }

    taxiwayLightTimer += delta;
    if (taxiwayLightTimer > 0.2) {
      taxiwayLightTimer = 0;
      for (var j = 0; j < taxiwayLights.length; j++) {
        var intensity = Math.sin((j + runwayLightIndex) * 0.5) * 0.5 + 0.5;
        taxiwayLights[j].material.emissiveIntensity = intensity;
      }
    }

    beaconTimer += delta;
    if (beaconLight) {
      var beaconIntensity = Math.max(0.3, Math.sin(beaconTimer * 3) * 0.7 + 0.7);
      beaconLight.material.emissiveIntensity = beaconIntensity;
    }

    fireFlickerTimer += delta;
    if (fireFlames.length > 0) {
      for (var k = 0; k < fireFlames.length; k++) {
        var flame = fireFlames[k];
        var flicker = Math.random() * 0.3 + 0.7;
        flame.scale.set(flicker, flicker, flicker);
        flame.position.y += Math.sin(fireFlickerTimer * 2 + k) * 0.02;
      }
    }
  }

  function reset() {
    radarRotation = 0;
    runwayLightIndex = 0;
    runwayLightTimer = 0;
    taxiwayLightTimer = 0;
    beaconTimer = 0;
    fireFlickerTimer = 0;

    for (var i = 0; i < initialStates.length; i++) {
      var state = initialStates[i];
      state.obj.position.copy(state.pos);
      state.obj.rotation.copy(state.rot);
      state.obj.scale.set(1, 1, 1);
    }

    if (beaconLight) {
      beaconLight.material.emissiveIntensity = 1.0;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
