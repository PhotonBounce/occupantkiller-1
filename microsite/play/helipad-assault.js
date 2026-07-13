window.HelipadAssault = (function() {
  'use strict';

  var meshes = [];
  var extractionHelicopter = null;
  var enemyChopper = null;
  var rotorMain = null;
  var rotorTail = null;
  var floodLights = [];
  var antennaMast = null;
  var acUnits = [];
  var smokeParticles = [];
  var spawnPoints = [];
  var scene = null;

  function init(sceneParam, camera) {
    scene = sceneParam;
    meshes = [];
    smokeParticles = [];
    floodLights = [];
    acUnits = [];
    spawnPoints = [];

    // Main helipad rooftop surface - concrete gray
    var rooftopGeometry = new THREE.BoxGeometry(150, 2, 150);
    var rooftopMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var rooftop = new THREE.Mesh(rooftopGeometry, rooftopMaterial);
    rooftop.position.set(0, 0, 0);
    rooftop.castShadow = true;
    rooftop.receiveShadow = true;
    scene.add(rooftop);
    meshes.push(rooftop);

    // Helipad circle markings - white H-shape strips
    var stripWidth = 2;
    var stripLength = 30;
    var stripMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });

    // Horizontal bar of H
    var hStripHGeometry = new THREE.BoxGeometry(stripLength * 2, 0.2, stripWidth);
    var hStripH = new THREE.Mesh(hStripHGeometry, stripMaterial);
    hStripH.position.set(0, 1.5, 0);
    hStripH.castShadow = true;
    scene.add(hStripH);
    meshes.push(hStripH);

    // Left vertical bar of H
    var hStripLGeometry = new THREE.BoxGeometry(stripWidth, 0.2, stripLength);
    var hStripL = new THREE.Mesh(hStripLGeometry, stripMaterial);
    hStripL.position.set(-stripLength * 0.7, 1.5, 0);
    hStripL.castShadow = true;
    scene.add(hStripL);
    meshes.push(hStripL);

    // Right vertical bar of H
    var hStripR = new THREE.Mesh(hStripLGeometry, stripMaterial);
    hStripR.position.set(stripLength * 0.7, 1.5, 0);
    hStripR.castShadow = true;
    scene.add(hStripR);
    meshes.push(hStripR);

    // Extraction helicopter - military green, hovering above helipad
    var helicopterGroup = new THREE.Group();

    // Fuselage
    var fuselageGeometry = new THREE.BoxGeometry(3, 4, 12);
    var helicopterMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
    var fuselage = new THREE.Mesh(fuselageGeometry, helicopterMaterial);
    fuselage.position.set(0, 0, 0);
    fuselage.castShadow = true;
    helicopterGroup.add(fuselage);
    meshes.push(fuselage);

    // Cockpit
    var cockpitGeometry = new THREE.BoxGeometry(2.5, 2, 3);
    var cockpit = new THREE.Mesh(cockpitGeometry, helicopterMaterial);
    cockpit.position.set(0, 2, 3);
    cockpit.castShadow = true;
    helicopterGroup.add(cockpit);
    meshes.push(cockpit);

    // Main rotor
    var rotorGeometry = new THREE.CylinderGeometry(8, 8, 0.3, 32);
    var rotorMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    rotorMain = new THREE.Mesh(rotorGeometry, rotorMaterial);
    rotorMain.position.set(0, 4.5, 0);
    rotorMain.castShadow = true;
    helicopterGroup.add(rotorMain);
    meshes.push(rotorMain);

    // Tail rotor
    var tailRotorGeometry = new THREE.CylinderGeometry(2, 2, 0.2, 16);
    rotorTail = new THREE.Mesh(tailRotorGeometry, rotorMaterial);
    rotorTail.position.set(0, 3, -5.5);
    rotorTail.castShadow = true;
    helicopterGroup.add(rotorTail);
    meshes.push(rotorTail);

    // Landing skids
    var skidGeometry = new THREE.BoxGeometry(0.3, 0.3, 5);
    var skidMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var skidL = new THREE.Mesh(skidGeometry, skidMaterial);
    skidL.position.set(-1.5, -2.2, 0);
    skidL.castShadow = true;
    helicopterGroup.add(skidL);
    meshes.push(skidL);

    var skidR = new THREE.Mesh(skidGeometry, skidMaterial);
    skidR.position.set(1.5, -2.2, 0);
    skidR.castShadow = true;
    helicopterGroup.add(skidR);
    meshes.push(skidR);

    helicopterGroup.position.set(-40, 25, 0);
    scene.add(helicopterGroup);
    extractionHelicopter = helicopterGroup;

    // Enemy attack chopper (circling threat)
    var enemyGroup = new THREE.Group();
    var enemyFuselage = new THREE.Mesh(fuselageGeometry, new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
    enemyFuselage.castShadow = true;
    enemyGroup.add(enemyFuselage);
    meshes.push(enemyFuselage);

    var enemyRotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
    enemyRotor.position.set(0, 4.5, 0);
    enemyRotor.castShadow = true;
    enemyGroup.add(enemyRotor);
    meshes.push(enemyRotor);

    enemyGroup.position.set(60, 30, -80);
    scene.add(enemyGroup);
    enemyChopper = enemyGroup;

    // AC units cluster on rooftop
    var acMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    for (var i = 0; i < 4; i++) {
      var acGeometry = new THREE.BoxGeometry(4, 3, 4);
      var ac = new THREE.Mesh(acGeometry, acMaterial);
      var acX = (i % 2 === 0) ? -25 : -15;
      var acZ = (i < 2) ? 40 : 50;
      ac.position.set(acX, 2.5, acZ);
      ac.castShadow = true;
      ac.receiveShadow = true;
      scene.add(ac);
      meshes.push(ac);
      acUnits.push(ac);
    }

    // Water tanks - cylindrical on frame
    var tankFrameGeometry = new THREE.BoxGeometry(12, 0.5, 12);
    var frameMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var tankFrame = new THREE.Mesh(tankFrameGeometry, frameMaterial);
    tankFrame.position.set(40, 1, 50);
    tankFrame.castShadow = true;
    scene.add(tankFrame);
    meshes.push(tankFrame);

    var tankGeometry = new THREE.CylinderGeometry(4, 4, 8, 32);
    var tankMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    for (var j = 0; j < 2; j++) {
      var tank = new THREE.Mesh(tankGeometry, tankMaterial);
      tank.position.set(40 + (j * 10 - 5), 6, 50);
      tank.castShadow = true;
      scene.add(tank);
      meshes.push(tank);
    }

    // Antenna mast array
    var mastGeometry = new THREE.CylinderGeometry(0.4, 0.4, 35, 16);
    var mastMaterial = new THREE.MeshLambertMaterial({ color: 0xCC0000 });
    antennaMast = new THREE.Mesh(mastGeometry, mastMaterial);
    antennaMast.position.set(-50, 18, 40);
    antennaMast.castShadow = true;
    scene.add(antennaMast);
    meshes.push(antennaMast);

    // Antenna guy wires (guy wires)
    var wireGeometry = new THREE.BufferGeometry();
    var wirePositions = new Float32Array([
      -50, 18, 40,  -45, 2, 35,
      -50, 18, 40,  -45, 2, 45,
      -50, 18, 40,  -55, 2, 35,
      -50, 18, 40,  -55, 2, 45
    ]);
    wireGeometry.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
    var wireMaterial = new THREE.LineBasicMaterial({ color: 0xFF8800 });
    var wires = new THREE.LineSegments(wireGeometry, wireMaterial);
    scene.add(wires);
    meshes.push(wires);

    // Signal light on mast
    var signalLightGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    var signalLightMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000, emissive: 0xFF0000 });
    var signalLight = new THREE.Mesh(signalLightGeometry, signalLightMaterial);
    signalLight.position.set(-50, 32, 40);
    signalLight.castShadow = true;
    scene.add(signalLight);
    meshes.push(signalLight);

    // Elevator penthouse - small building at rooftop center-rear
    var penthouseGeometry = new THREE.BoxGeometry(8, 5, 8);
    var penthouseMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
    var penthouse = new THREE.Mesh(penthouseGeometry, penthouseMaterial);
    penthouse.position.set(0, 3.5, 50);
    penthouse.castShadow = true;
    scene.add(penthouse);
    meshes.push(penthouse);

    // Penthouse door frame
    var doorGeometry = new THREE.BoxGeometry(2, 4, 0.3);
    var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 2, 54.5);
    door.castShadow = true;
    scene.add(door);
    meshes.push(door);

    // Solar panel racks
    var panelGeometry = new THREE.BoxGeometry(3, 0.2, 8);
    var panelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a3a });
    for (var k = 0; k < 3; k++) {
      var panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(20 + k * 8, 1.5, -45);
      panel.rotation.z = 0.3;
      panel.castShadow = true;
      scene.add(panel);
      meshes.push(panel);
    }

    // Parapet wall - edge barriers
    var parapetGeometry = new THREE.BoxGeometry(150, 1.2, 1);
    var parapetMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });

    var parapetFront = new THREE.Mesh(parapetGeometry, parapetMaterial);
    parapetFront.position.set(0, 1.5, 74);
    parapetFront.castShadow = true;
    scene.add(parapetFront);
    meshes.push(parapetFront);

    var parapetBack = new THREE.Mesh(parapetGeometry, parapetMaterial);
    parapetBack.position.set(0, 1.5, -74);
    parapetBack.castShadow = true;
    scene.add(parapetBack);
    meshes.push(parapetBack);

    var parapetLeft = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1.2, 148),
      parapetMaterial
    );
    parapetLeft.position.set(-74, 1.5, 0);
    parapetLeft.castShadow = true;
    scene.add(parapetLeft);
    meshes.push(parapetLeft);

    var parapetRight = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1.2, 148),
      parapetMaterial
    );
    parapetRight.position.set(74, 1.5, 0);
    parapetRight.castShadow = true;
    scene.add(parapetRight);
    meshes.push(parapetRight);

    // Air vent stacks
    var ventGeometry = new THREE.CylinderGeometry(1.5, 1.5, 3, 16);
    var ventMaterial = new THREE.MeshLambertMaterial({ color: 0x999999 });
    for (var v = 0; v < 3; v++) {
      var vent = new THREE.Mesh(ventGeometry, ventMaterial);
      vent.position.set(-30 + v * 20, 2.5, -30);
      vent.castShadow = true;
      scene.add(vent);
      meshes.push(vent);
    }

    // Emergency ladder - lineSegments with rungs
    var ladderPositions = new Float32Array([
      50, 2, 70,  50, 12, 70
    ]);
    var ladderGeometry = new THREE.BufferGeometry();
    ladderGeometry.setAttribute('position', new THREE.BufferAttribute(ladderPositions, 3));
    var ladderMaterial = new THREE.LineBasicMaterial({ color: 0xFFAA00, linewidth: 2 });
    var ladder = new THREE.LineSegments(ladderGeometry, ladderMaterial);
    scene.add(ladder);
    meshes.push(ladder);

    // Ladder rungs
    var rungGeometry = new THREE.BoxGeometry(2, 0.2, 0.3);
    var rungMaterial = new THREE.MeshLambertMaterial({ color: 0xFFAA00 });
    for (var r = 0; r < 5; r++) {
      var rung = new THREE.Mesh(rungGeometry, rungMaterial);
      rung.position.set(50, 2 + r * 2, 70);
      rung.castShadow = true;
      scene.add(rung);
      meshes.push(rung);
    }

    // Crash barricades
    var barricadeGeometry = new THREE.BoxGeometry(3, 1, 0.8);
    var barricadeMaterial = new THREE.MeshLambertMaterial({ color: 0xCC6600 });
    for (var b = 0; b < 4; b++) {
      var barricade = new THREE.Mesh(barricadeGeometry, barricadeMaterial);
      var bX = (b < 2) ? -20 - b * 8 : 20 + (b - 2) * 8;
      barricade.position.set(bX, 0.8, 30);
      barricade.castShadow = true;
      scene.add(barricade);
      meshes.push(barricade);
    }

    // Flood lights - cylindrical base with sphere bulb
    for (var f = 0; f < 4; f++) {
      var floodGroup = new THREE.Group();

      var lightBaseGeometry = new THREE.CylinderGeometry(1, 1.2, 1.5, 16);
      var lightBaseMaterial = new THREE.MeshLambertMaterial({ color: 0xDDDDDD });
      var lightBase = new THREE.Mesh(lightBaseGeometry, lightBaseMaterial);
      lightBase.position.set(0, 0, 0);
      lightBase.castShadow = true;
      floodGroup.add(lightBase);
      meshes.push(lightBase);

      var bulbGeometry = new THREE.SphereGeometry(0.8, 16, 16);
      var bulbMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, emissive: 0xCCCCCC });
      var bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
      bulb.position.set(0, 1.5, 0);
      bulb.castShadow = true;
      floodGroup.add(bulb);
      meshes.push(bulb);

      var floodX = (f < 2) ? -55 : 55;
      var floodZ = (f % 2 === 0) ? 40 : -40;
      floodGroup.position.set(floodX, 3, floodZ);
      scene.add(floodGroup);
      floodLights.push(floodGroup);
    }

    // Rooftop garden - planters and bushes
    var planterGeometry = new THREE.BoxGeometry(3, 1.5, 3);
    var planterMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

    var bushGeometry = new THREE.SphereGeometry(2, 12, 12);
    var bushMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });

    for (var g = 0; g < 3; g++) {
      var planter = new THREE.Mesh(planterGeometry, planterMaterial);
      planter.position.set(-40 + g * 15, 1, -40);
      planter.castShadow = true;
      scene.add(planter);
      meshes.push(planter);

      var bush = new THREE.Mesh(bushGeometry, bushMaterial);
      bush.position.set(-40 + g * 15, 3.5, -40);
      bush.castShadow = true;
      scene.add(bush);
      meshes.push(bush);
    }

    // Define spawn points for gameplay
    spawnPoints = [
      { x: 35, y: 2, z: 35 },   // NE corner
      { x: -35, y: 2, z: 35 },  // NW corner
      { x: 35, y: 2, z: -35 },  // SE corner
      { x: -35, y: 2, z: -35 }, // SW corner
      { x: 0, y: 5, z: 50 },    // Penthouse door
      { x: -25, y: 2, z: 45 }   // AC cluster
    ];
  }

  function update(delta) {
    if (!scene) return;

    // Extraction helicopter main rotor spinning fast
    if (rotorMain) {
      rotorMain.rotation.z += delta * 15;
    }

    // Tail rotor spinning
    if (rotorTail) {
      rotorTail.rotation.x += delta * 25;
    }

    // Enemy chopper circling threat pattern
    if (enemyChopper) {
      var time = Date.now() * 0.001;
      var radius = 80;
      enemyChopper.position.x = Math.cos(time * 0.3) * radius;
      enemyChopper.position.z = Math.sin(time * 0.3) * radius - 60;
      enemyChopper.lookAt(0, 15, 0);

      // Enemy rotor spinning
      var enemyRotor = enemyChopper.children[1];
      if (enemyRotor) {
        enemyRotor.rotation.z += delta * 18;
      }
    }

    // Flood lights sweeping
    for (var f = 0; f < floodLights.length; f++) {
      var light = floodLights[f];
      var time = Date.now() * 0.001;
      var sweepAngle = Math.sin(time * 0.5) * 0.4;
      light.rotation.y = sweepAngle;
    }

    // Antenna signal light blinking
    for (var m = 0; m < meshes.length; m++) {
      if (meshes[m].geometry && meshes[m].geometry.type === 'SphereGeometry' &&
          meshes[m].material && meshes[m].material.color &&
          meshes[m].material.color.getHex() === 0xFF0000) {
        var blink = Math.sin(Date.now() * 0.01) > 0;
        meshes[m].material.emissive.setHex(blink ? 0xFF0000 : 0x660000);
      }
    }

    // AC units vibrating slightly
    for (var a = 0; a < acUnits.length; a++) {
      var vibration = Math.sin(Date.now() * 0.005 + a) * 0.05;
      acUnits[a].position.y = 2.5 + vibration;
    }

    // Smoke from hit chopper rising
    var time = Date.now() * 0.001;
    if (smokeParticles.length < 8) {
      if (Math.random() < 0.3) {
        var smokeGeometry = new THREE.SphereGeometry(2 + Math.random() * 2, 8, 8);
        var smokeMaterial = new THREE.MeshLambertMaterial({
          color: 0x666666,
          transparent: true,
          opacity: 0.4
        });
        var smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
        smoke.position.set(60 + (Math.random() - 0.5) * 10, 30 + Math.random() * 5, -80);
        smoke.userData.lifespan = 0;
        scene.add(smoke);
        smokeParticles.push(smoke);
        meshes.push(smoke);
      }
    }

    // Update smoke particles
    for (var s = smokeParticles.length - 1; s >= 0; s--) {
      var particle = smokeParticles[s];
      particle.userData.lifespan += delta;
      particle.position.y += delta * 8;
      particle.scale.x += delta * 0.5;
      particle.scale.y += delta * 0.5;
      particle.scale.z += delta * 0.5;
      particle.material.opacity = Math.max(0, 0.4 - particle.userData.lifespan * 0.3);

      if (particle.userData.lifespan > 2) {
        scene.remove(particle);
        smokeParticles.splice(s, 1);
        var idx = meshes.indexOf(particle);
        if (idx > -1) meshes.splice(idx, 1);
      }
    }
  }

  function reset() {
    for (var i = meshes.length - 1; i >= 0; i--) {
      if (meshes[i].parent) {
        meshes[i].parent.remove(meshes[i]);
      } else if (scene) {
        scene.remove(meshes[i]);
      }
    }
    meshes = [];
    smokeParticles = [];
    floodLights = [];
    acUnits = [];
    spawnPoints = [];
    extractionHelicopter = null;
    enemyChopper = null;
    rotorMain = null;
    rotorTail = null;
    scene = null;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() { return spawnPoints; },
    getMeshes: function() { return meshes; }
  };
}());
