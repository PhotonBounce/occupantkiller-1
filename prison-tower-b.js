window.PrisonTowerB = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var prisonObjects = [];
  var searchlights = [];
  var emergencyLights = [];
  var smokeParticles = [];
  var rotatingElements = [];
  var strobeElements = [];
  var elapsedTime = 0;

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    prisonObjects = [];
    searchlights = [];
    emergencyLights = [];
    smokeParticles = [];
    rotatingElements = [];
    strobeElements = [];
    elapsedTime = 0;

    // Main perimeter concrete wall
    var wallGeometry = new THREE.BoxGeometry(300, 15, 2);
    var wallMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var northWall = new THREE.Mesh(wallGeometry, wallMaterial);
    northWall.position.set(0, 7.5, -150);
    scene.add(northWall);
    prisonObjects.push(northWall);

    var southWall = new THREE.Mesh(wallGeometry, wallMaterial);
    southWall.position.set(0, 7.5, 150);
    scene.add(southWall);
    prisonObjects.push(southWall);

    var eastWallGeometry = new THREE.BoxGeometry(2, 15, 300);
    var eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
    eastWall.position.set(150, 7.5, 0);
    scene.add(eastWall);
    prisonObjects.push(eastWall);

    var westWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
    westWall.position.set(-150, 7.5, 0);
    scene.add(westWall);
    prisonObjects.push(westWall);

    // Guard tower - elevated observation tower
    var towerLegGeometry = new THREE.CylinderGeometry(2, 2, 35, 16);
    var towerLegMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
    var towerLeg1 = new THREE.Mesh(towerLegGeometry, towerLegMaterial);
    towerLeg1.position.set(60, 17.5, 60);
    scene.add(towerLeg1);
    prisonObjects.push(towerLeg1);

    var towerLeg2 = new THREE.Mesh(towerLegGeometry, towerLegMaterial);
    towerLeg2.position.set(-60, 17.5, 60);
    scene.add(towerLeg2);
    prisonObjects.push(towerLeg2);

    var towerLeg3 = new THREE.Mesh(towerLegGeometry, towerLegMaterial);
    towerLeg3.position.set(60, 17.5, -60);
    scene.add(towerLeg3);
    prisonObjects.push(towerLeg3);

    var towerLeg4 = new THREE.Mesh(towerLegGeometry, towerLegMaterial);
    towerLeg4.position.set(-60, 17.5, -60);
    scene.add(towerLeg4);
    prisonObjects.push(towerLeg4);

    // Guard tower cab (elevated command center)
    var cabGeometry = new THREE.BoxGeometry(130, 10, 130);
    var cabMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var cab = new THREE.Mesh(cabGeometry, cabMaterial);
    cab.position.set(0, 40, 0);
    scene.add(cab);
    prisonObjects.push(cab);

    // Searchlight tower 1 with rotating spotlight
    var spotLegGeometry = new THREE.CylinderGeometry(1.5, 1.5, 25, 12);
    var spotLeg1 = new THREE.Mesh(spotLegGeometry, towerLegMaterial);
    spotLeg1.position.set(80, 12.5, -80);
    scene.add(spotLeg1);
    prisonObjects.push(spotLeg1);

    var spotTopGeometry = new THREE.BoxGeometry(15, 5, 15);
    var spotMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var spotTop1 = new THREE.Mesh(spotTopGeometry, spotMaterial);
    spotTop1.position.set(80, 30, -80);
    scene.add(spotTop1);
    prisonObjects.push(spotTop1);
    rotatingElements.push({ mesh: spotTop1, axis: 'y', speed: 1.2 });

    var lightGeometry = new THREE.SphereGeometry(3, 8, 8);
    var lightMaterial = new THREE.MeshPhongMaterial({ color: 0xffff88, emissive: 0xffff00 });
    var light1 = new THREE.Mesh(lightGeometry, lightMaterial);
    light1.position.set(80, 33, -80);
    scene.add(light1);
    prisonObjects.push(light1);
    searchlights.push(light1);

    // Searchlight tower 2
    var spotLeg2 = new THREE.Mesh(spotLegGeometry, towerLegMaterial);
    spotLeg2.position.set(-80, 12.5, 80);
    scene.add(spotLeg2);
    prisonObjects.push(spotLeg2);

    var spotTop2 = new THREE.Mesh(spotTopGeometry, spotMaterial);
    spotTop2.position.set(-80, 30, 80);
    scene.add(spotTop2);
    prisonObjects.push(spotTop2);
    rotatingElements.push({ mesh: spotTop2, axis: 'y', speed: -1.0 });

    var light2 = new THREE.Mesh(lightGeometry, lightMaterial);
    light2.position.set(-80, 33, 80);
    scene.add(light2);
    prisonObjects.push(light2);
    searchlights.push(light2);

    // Razor wire fences using BoxGeometry posts and LineSegments
    var fencePostGeometry = new THREE.BoxGeometry(1, 10, 1);
    var fencePostMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var wirePoints = [];
    var wireCoilMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 });

    for (var i = -120; i < 120; i += 20) {
      var post = new THREE.Mesh(fencePostGeometry, fencePostMaterial);
      post.position.set(i, 5, -145);
      scene.add(post);
      prisonObjects.push(post);

      // Razor wire coil representation
      wirePoints.push(new THREE.Vector3(i - 3, 8, -145));
      wirePoints.push(new THREE.Vector3(i + 3, 8, -145));
      wirePoints.push(new THREE.Vector3(i + 3, 9, -145));
      wirePoints.push(new THREE.Vector3(i - 3, 9, -145));
    }

    var wireGeometry = new THREE.BufferGeometry().setFromPoints(wirePoints);
    var wireSegments = new THREE.LineSegments(wireGeometry, wireCoilMaterial);
    scene.add(wireSegments);
    prisonObjects.push(wireSegments);

    // Cell block building - long rows of small barred windows
    var cellBlockGeometry = new THREE.BoxGeometry(200, 20, 40);
    var cellBlockMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var cellBlock = new THREE.Mesh(cellBlockGeometry, cellBlockMaterial);
    cellBlock.position.set(-70, 10, 0);
    scene.add(cellBlock);
    prisonObjects.push(cellBlock);

    // Cell window insets (small BoxGeometry recesses)
    var windowGeometry = new THREE.BoxGeometry(3, 3, 0.5);
    var windowMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 18; col++) {
        var window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(-70 + col * 11 - 100, 12 + row * 5, 20.5);
        scene.add(window);
        prisonObjects.push(window);
      }
    }

    // Exercise yard concrete area
    var yardGeometry = new THREE.BoxGeometry(120, 0.05, 120);
    var yardMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var yard = new THREE.Mesh(yardGeometry, yardMaterial);
    yard.position.set(70, 0.025, 0);
    scene.add(yard);
    prisonObjects.push(yard);

    // Control room with reinforced window slots
    var controlGeometry = new THREE.BoxGeometry(60, 15, 30);
    var controlMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var controlRoom = new THREE.Mesh(controlGeometry, controlMaterial);
    controlRoom.position.set(0, 7.5, -80);
    scene.add(controlRoom);
    prisonObjects.push(controlRoom);

    var windowSlotGeometry = new THREE.BoxGeometry(8, 4, 0.5);
    var slotMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
    for (var w = 0; w < 5; w++) {
      var slot = new THREE.Mesh(windowSlotGeometry, slotMaterial);
      slot.position.set(-20 + w * 10, 10, -80.25);
      scene.add(slot);
      prisonObjects.push(slot);
    }

    // Prisoner barracks dormitory
    var barracksGeometry = new THREE.BoxGeometry(100, 12, 50);
    var barracksMaterial = new THREE.MeshPhongMaterial({ color: 0x777777 });
    var barracks = new THREE.Mesh(barracksGeometry, barracksMaterial);
    barracks.position.set(80, 6, -70);
    scene.add(barracks);
    prisonObjects.push(barracks);

    // Solitary confinement block - small isolated building
    var solitaryGeometry = new THREE.BoxGeometry(35, 10, 35);
    var solitaryMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var solitary = new THREE.Mesh(solitaryGeometry, solitaryMaterial);
    solitary.position.set(120, 5, 40);
    scene.add(solitary);
    prisonObjects.push(solitary);

    // Solitary window - single small opening
    var solitaryWindowGeometry = new THREE.BoxGeometry(2, 2, 0.5);
    var solitaryWindow = new THREE.Mesh(solitaryWindowGeometry, windowMaterial);
    solitaryWindow.position.set(120, 8, 40.25);
    scene.add(solitaryWindow);
    prisonObjects.push(solitaryWindow);

    // Administration building
    var adminGeometry = new THREE.BoxGeometry(70, 12, 40);
    var adminMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var adminBuilding = new THREE.Mesh(adminGeometry, adminMaterial);
    adminBuilding.position.set(-90, 6, 80);
    scene.add(adminBuilding);
    prisonObjects.push(adminBuilding);

    // Sally port double gate entrance
    var gateFrameGeometry = new THREE.BoxGeometry(20, 12, 2);
    var gateMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
    var gate1 = new THREE.Mesh(gateFrameGeometry, gateMaterial);
    gate1.position.set(-148, 6, 0);
    scene.add(gate1);
    prisonObjects.push(gate1);

    var gate2 = new THREE.Mesh(gateFrameGeometry, gateMaterial);
    gate2.position.set(-148, 6, -10);
    scene.add(gate2);
    prisonObjects.push(gate2);

    // Vehicle access road
    var roadGeometry = new THREE.BoxGeometry(250, 0.05, 15);
    var roadMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.position.set(0, 0.025, -130);
    scene.add(road);
    prisonObjects.push(road);

    // Dumpster units
    var dumpsterGeometry = new THREE.BoxGeometry(8, 6, 8);
    var dumpsterMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var dumpster1 = new THREE.Mesh(dumpsterGeometry, dumpsterMaterial);
    dumpster1.position.set(40, 3, 100);
    scene.add(dumpster1);
    prisonObjects.push(dumpster1);

    var dumpster2 = new THREE.Mesh(dumpsterGeometry, dumpsterMaterial);
    dumpster2.position.set(60, 3, 110);
    scene.add(dumpster2);
    prisonObjects.push(dumpster2);

    // Riot barricade - overturned furniture and barriers
    var barricadeGeometry = new THREE.BoxGeometry(25, 8, 3);
    var barricadeMaterial = new THREE.MeshPhongMaterial({ color: 0x885533 });
    var barricade1 = new THREE.Mesh(barricadeGeometry, barricadeMaterial);
    barricade1.position.set(50, 4, 30);
    barricade1.rotation.z = 0.3;
    scene.add(barricade1);
    prisonObjects.push(barricade1);

    var barricade2 = new THREE.Mesh(barricadeGeometry, barricadeMaterial);
    barricade2.position.set(70, 4, 50);
    barricade2.rotation.z = -0.25;
    scene.add(barricade2);
    prisonObjects.push(barricade2);

    // Makeshift weapons - crude blocky implements
    var weaponGeometry = new THREE.BoxGeometry(2, 12, 0.5);
    var weaponMaterial = new THREE.MeshPhongMaterial({ color: 0x664433 });
    var weapon1 = new THREE.Mesh(weaponGeometry, weaponMaterial);
    weapon1.position.set(55, 6, 35);
    weapon1.rotation.z = 0.4;
    scene.add(weapon1);
    prisonObjects.push(weapon1);

    var weapon2 = new THREE.Mesh(weaponGeometry, weaponMaterial);
    weapon2.position.set(75, 6, 55);
    weapon2.rotation.z = -0.3;
    scene.add(weapon2);
    prisonObjects.push(weapon2);

    // Fire damage - blackened sections
    var fireGeometry = new THREE.BoxGeometry(40, 15, 3);
    var fireMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var fireDamage = new THREE.Mesh(fireGeometry, fireMaterial);
    fireDamage.position.set(30, 7.5, 35);
    scene.add(fireDamage);
    prisonObjects.push(fireDamage);

    // Emergency lighting - red strobe units
    var lightBoxGeometry = new THREE.BoxGeometry(3, 3, 1);
    var emergencyMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0x770000 });
    var emergencyLight1 = new THREE.Mesh(lightBoxGeometry, emergencyMaterial);
    emergencyLight1.position.set(0, 42, 0);
    scene.add(emergencyLight1);
    prisonObjects.push(emergencyLight1);
    strobeElements.push(emergencyLight1);

    var emergencyLight2 = new THREE.Mesh(lightBoxGeometry, emergencyMaterial);
    emergencyLight2.position.set(50, 25, 0);
    scene.add(emergencyLight2);
    prisonObjects.push(emergencyLight2);
    strobeElements.push(emergencyLight2);

    var emergencyLight3 = new THREE.Mesh(lightBoxGeometry, emergencyMaterial);
    emergencyLight3.position.set(-50, 25, 0);
    scene.add(emergencyLight3);
    prisonObjects.push(emergencyLight3);
    strobeElements.push(emergencyLight3);

    emergencyLights = strobeElements;

    // Broken glass shards scatter
    var glassGeometry = new THREE.BoxGeometry(1, 0.1, 1.5);
    var glassMaterial = new THREE.MeshPhongMaterial({ color: 0x88ccff, emissive: 0x224466 });
    for (var g = 0; g < 8; g++) {
      var shard = new THREE.Mesh(glassGeometry, glassMaterial);
      shard.position.set(30 + Math.random() * 10, 0.5, 35 + Math.random() * 10);
      shard.rotation.z = Math.random() * Math.PI;
      scene.add(shard);
      prisonObjects.push(shard);
    }

    // Initialize smoke particles
    createSmokeCloud(35, 20, 35);
  };

  var createSmokeCloud = function(x, y, z) {
    var smokeGeometry = new THREE.SphereGeometry(2, 4, 4);
    var smokeMaterial = new THREE.MeshPhongMaterial({ color: 0x555555, emissive: 0x222222, transparent: true, opacity: 0.4 });

    for (var s = 0; s < 6; s++) {
      var smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
      smoke.position.set(x + (Math.random() - 0.5) * 10, y + s * 3, z + (Math.random() - 0.5) * 10);
      smoke.scale.set(1 + s * 0.5, 1 + s * 0.5, 1 + s * 0.5);
      scene.add(smoke);
      prisonObjects.push(smoke);
      smokeParticles.push({
        mesh: smoke,
        vx: (Math.random() - 0.5) * 0.02,
        vy: 0.03 + Math.random() * 0.02,
        vz: (Math.random() - 0.5) * 0.02,
        life: 1.0
      });
    }
  };

  var update = function(delta) {
    elapsedTime += delta;

    // Searchlight rotation sweep
    for (var i = 0; i < rotatingElements.length; i++) {
      var elem = rotatingElements[i];
      if (elem.axis === 'y') {
        elem.mesh.rotation.y += elem.speed * delta;
      }
    }

    // Emergency light strobe effect
    var strobePhase = (elapsedTime * 3) % 1.0;
    for (var j = 0; j < strobeElements.length; j++) {
      var emLight = strobeElements[j];
      var intensity = strobePhase < 0.3 ? 1.0 : 0.2;
      emLight.material.emissive.setHex(Math.floor(0x770000 * intensity));
    }

    // Smoke particle animation
    for (var k = smokeParticles.length - 1; k >= 0; k--) {
      var particle = smokeParticles[k];
      particle.mesh.position.x += particle.vx;
      particle.mesh.position.y += particle.vy;
      particle.mesh.position.z += particle.vz;

      particle.life -= delta * 0.5;
      particle.mesh.material.opacity = Math.max(0, particle.life * 0.4);

      if (particle.life <= 0) {
        scene.remove(particle.mesh);
        smokeParticles.splice(k, 1);
      }
    }

    // Regenerate smoke clouds occasionally
    if (smokeParticles.length < 3) {
      createSmokeCloud(35 + (Math.random() - 0.5) * 20, 20, 35 + (Math.random() - 0.5) * 20);
    }
  };

  var reset = function() {
    // Remove all prison objects from scene
    for (var i = 0; i < prisonObjects.length; i++) {
      scene.remove(prisonObjects[i]);
    }

    prisonObjects = [];
    searchlights = [];
    emergencyLights = [];
    smokeParticles = [];
    rotatingElements = [];
    strobeElements = [];
    elapsedTime = 0;

    // Reinitialize
    init(scene, camera);
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
