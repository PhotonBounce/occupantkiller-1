window.BorderFort = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animations = [];

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    animations = [];

    // Long concrete border wall segments
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    var wallGeometry = new THREE.BoxGeometry(2, 6, 0.3);

    for (var i = 0; i < 8; i++) {
      var wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(-8 + i * 2.2, 3, 0);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
      objects.push(wall);
    }

    // Main gatehouse checkpoint building
    var gatehouseMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
    var gatehouseGeometry = new THREE.BoxGeometry(4, 5, 3);
    var gatehouse = new THREE.Mesh(gatehouseGeometry, gatehouseMaterial);
    gatehouse.position.set(0, 2.5, -5);
    gatehouse.castShadow = true;
    gatehouse.receiveShadow = true;
    scene.add(gatehouse);
    objects.push(gatehouse);

    // Boom barrier arm for gatehouse
    var armMaterial = new THREE.MeshStandardMaterial({ color: 0xdd4444 });
    var armGeometry = new THREE.BoxGeometry(0.2, 0.2, 3);
    var barrierArm = new THREE.Mesh(armGeometry, armMaterial);
    barrierArm.position.set(2.5, 2.5, -5);
    barrierArm.castShadow = true;
    scene.add(barrierArm);
    objects.push(barrierArm);
    animations.push({
      object: barrierArm,
      type: 'barrier',
      time: 0
    });

    // Guard towers every section
    for (var t = 0; t < 4; t++) {
      var towerX = -6 + t * 4;

      // Tower legs
      var legMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
      var legGeometry = new THREE.BoxGeometry(0.3, 4, 0.3);

      for (var leg = 0; leg < 4; leg++) {
        var legMesh = new THREE.Mesh(legGeometry, legMaterial);
        var legOffsetX = leg < 2 ? -0.6 : 0.6;
        var legOffsetZ = leg % 2 === 0 ? -0.6 : 0.6;
        legMesh.position.set(towerX + legOffsetX, 2, -10 + legOffsetZ);
        legMesh.castShadow = true;
        scene.add(legMesh);
        objects.push(legMesh);
      }

      // Tower platform
      var platformGeometry = new THREE.BoxGeometry(1.8, 0.3, 1.8);
      var platformMesh = new THREE.Mesh(platformGeometry, legMaterial);
      platformMesh.position.set(towerX, 4.2, -10);
      platformMesh.castShadow = true;
      scene.add(platformMesh);
      objects.push(platformMesh);

      // Searchlight housing
      var lightHousingGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.6, 16);
      var lightHousingMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
      var lightHousing = new THREE.Mesh(lightHousingGeometry, lightHousingMaterial);
      lightHousing.position.set(towerX, 4.8, -10);
      lightHousing.castShadow = true;
      scene.add(lightHousing);
      objects.push(lightHousing);

      // Searchlight beam
      var beamGeometry = new THREE.SphereGeometry(0.5, 8, 8);
      var beamMaterial = new THREE.MeshStandardMaterial({ color: 0xffff99, emissive: 0xffff00 });
      var beam = new THREE.Mesh(beamGeometry, beamMaterial);
      beam.position.set(towerX, 5, -10);
      beam.scale.set(0.8, 0.8, 2);
      scene.add(beam);
      objects.push(beam);
      animations.push({
        object: beam,
        type: 'searchlight',
        time: 0
      });
    }

    // Concertina wire on wall top
    var wireSpikeMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    for (var w = 0; w < 30; w++) {
      var wireGeometry = new THREE.SphereGeometry(0.15, 4, 4);
      var wireSpike = new THREE.Mesh(wireGeometry, wireSpikeMaterial);
      wireSpike.position.set(-7.5 + w * 0.55, 6.2, 0);
      scene.add(wireSpike);
      objects.push(wireSpike);
    }

    // Tank trap obstacles (X-shaped anti-vehicle barriers)
    var trapMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    for (var tr = 0; tr < 6; tr++) {
      var trapX = -7 + tr * 2.5;
      // First diagonal
      var trapGeometry1 = new THREE.BoxGeometry(0.3, 1.5, 0.3);
      var trap1 = new THREE.Mesh(trapGeometry1, trapMaterial);
      trap1.position.set(trapX, 0.8, 5);
      trap1.rotation.z = Math.PI / 4;
      trap1.castShadow = true;
      scene.add(trap1);
      objects.push(trap1);

      // Second diagonal
      var trap2 = new THREE.Mesh(trapGeometry1, trapMaterial);
      trap2.position.set(trapX, 0.8, 5);
      trap2.rotation.z = -Math.PI / 4;
      trap2.castShadow = true;
      scene.add(trap2);
      objects.push(trap2);
    }

    // Machine gun emplacements
    for (var mg = 0; mg < 3; mg++) {
      var mgX = -5 + mg * 5;
      // Sandbag ring (BoxGeometry)
      var sandbagGeometry = new THREE.BoxGeometry(2, 0.4, 2);
      var sandbagMaterial = new THREE.MeshStandardMaterial({ color: 0x997733 });
      var sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
      sandbag.position.set(mgX, 0.2, 8);
      sandbag.castShadow = true;
      scene.add(sandbag);
      objects.push(sandbag);

      // Gun barrel
      var barrelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
      var barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
      var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.position.set(mgX, 0.7, 8);
      barrel.rotation.z = Math.PI / 6;
      barrel.castShadow = true;
      scene.add(barrel);
      objects.push(barrel);
    }

    // Military command post building
    var commandGeometry = new THREE.BoxGeometry(6, 4, 5);
    var commandMaterial = new THREE.MeshStandardMaterial({ color: 0x667755 });
    var commandPost = new THREE.Mesh(commandGeometry, commandMaterial);
    commandPost.position.set(8, 2, -8);
    commandPost.castShadow = true;
    commandPost.receiveShadow = true;
    scene.add(commandPost);
    objects.push(commandPost);

    // Vehicle inspection pit
    var pitGeometry = new THREE.BoxGeometry(4, 1.5, 8);
    var pitMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var inspectionPit = new THREE.Mesh(pitGeometry, pitMaterial);
    inspectionPit.position.set(-10, -0.75, 12);
    inspectionPit.castShadow = true;
    scene.add(inspectionPit);
    objects.push(inspectionPit);

    // Observation drone station (launch pad)
    var dronepadGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 16);
    var dronepadMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    var dronePad = new THREE.Mesh(dronepadGeometry, dronepadMaterial);
    dronePad.position.set(12, 0.15, -15);
    dronePad.castShadow = true;
    scene.add(dronePad);
    objects.push(dronePad);

    // Drone on pad
    var droneGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.8);
    var droneMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var drone = new THREE.Mesh(droneGeometry, droneMaterial);
    drone.position.set(12, 0.6, -15);
    drone.castShadow = true;
    scene.add(drone);
    objects.push(drone);
    animations.push({
      object: drone,
      type: 'drone',
      time: 0
    });

    // Fuel bowser vehicle body
    var bowserBodyGeometry = new THREE.BoxGeometry(1.5, 1.2, 4);
    var bowserMaterial = new THREE.MeshStandardMaterial({ color: 0x445544 });
    var bowserBody = new THREE.Mesh(bowserBodyGeometry, bowserMaterial);
    bowserBody.position.set(-12, 0.6, -2);
    bowserBody.castShadow = true;
    scene.add(bowserBody);
    objects.push(bowserBody);

    // Bowser tank
    var bowserTankGeometry = new THREE.CylinderGeometry(0.8, 0.8, 3, 16);
    var bowserTank = new THREE.Mesh(bowserTankGeometry, bowserMaterial);
    bowserTank.position.set(-12, 1.2, -2);
    bowserTank.rotation.z = Math.PI / 2;
    bowserTank.castShadow = true;
    scene.add(bowserTank);
    objects.push(bowserTank);
    animations.push({
      object: bowserBody,
      type: 'patrol',
      time: 0
    });

    // Patrol dog kennels
    for (var kennel = 0; kennel < 4; kennel++) {
      var kennelGeometry = new THREE.BoxGeometry(1.2, 1.5, 1.5);
      var kennelMaterial = new THREE.MeshStandardMaterial({ color: 0x885522 });
      var kennelMesh = new THREE.Mesh(kennelGeometry, kennelMaterial);
      kennelMesh.position.set(5 + kennel * 2, 0.75, 12);
      kennelMesh.castShadow = true;
      scene.add(kennelMesh);
      objects.push(kennelMesh);
    }

    // Communications relay mast
    var mastGeometry = new THREE.CylinderGeometry(0.15, 0.15, 8, 8);
    var mastMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(15, 4, 0);
    mast.castShadow = true;
    scene.add(mast);
    objects.push(mast);

    // Antenna arrays on mast
    for (var antenna = 0; antenna < 3; antenna++) {
      var antennaGeometry = new THREE.BoxGeometry(2.5, 0.2, 0.2);
      var antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
      var antennaMesh = new THREE.Mesh(antennaGeometry, antennaMaterial);
      antennaMesh.position.set(15, 3 + antenna * 1.5, 0);
      antennaMesh.rotation.z = antenna * Math.PI / 3;
      antennaMesh.castShadow = true;
      scene.add(antennaMesh);
      objects.push(antennaMesh);
    }

    // Detention holding cells
    for (var cell = 0; cell < 4; cell++) {
      var cellGeometry = new THREE.BoxGeometry(2, 2.5, 2);
      var cellMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
      var cellMesh = new THREE.Mesh(cellGeometry, cellMaterial);
      cellMesh.position.set(-15 + cell * 2.5, 1.25, 5);
      cellMesh.castShadow = true;
      scene.add(cellMesh);
      objects.push(cellMesh);

      // Cell bars (thin BoxGeometry)
      var barGeometry = new THREE.BoxGeometry(0.1, 2, 0.1);
      var barMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      for (var barIdx = 0; barIdx < 5; barIdx++) {
        var barMesh = new THREE.Mesh(barGeometry, barMaterial);
        barMesh.position.set(-15 + cell * 2.5 - 0.8 + barIdx * 0.4, 1.25, 0.9);
        scene.add(barMesh);
        objects.push(barMesh);
      }
    }

    // Additional perimeter light posts
    for (var light = 0; light < 8; light++) {
      var lightPostGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
      var lightPostMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
      var lightPost = new THREE.Mesh(lightPostGeometry, lightPostMaterial);
      var lightAngle = (light / 8) * Math.PI * 2;
      lightPost.position.set(Math.cos(lightAngle) * 18, 1.5, Math.sin(lightAngle) * 18);
      lightPost.castShadow = true;
      scene.add(lightPost);
      objects.push(lightPost);

      // Light bulb on top
      var bulbGeometry = new THREE.SphereGeometry(0.25, 8, 8);
      var bulbMaterial = new THREE.MeshStandardMaterial({ color: 0xffff88, emissive: 0xffff00 });
      var bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
      bulb.position.set(Math.cos(lightAngle) * 18, 3.2, Math.sin(lightAngle) * 18);
      scene.add(bulb);
      objects.push(bulb);
      animations.push({
        object: bulb,
        type: 'pulse',
        time: light * 0.5
      });
    }
  };

  var update = function(delta) {
    for (var i = 0; i < animations.length; i++) {
      var anim = animations[i];
      anim.time += delta;

      if (anim.type === 'searchlight') {
        anim.object.rotation.y = Math.sin(anim.time * 1.5) * Math.PI * 0.6;
      } else if (anim.type === 'barrier') {
        anim.object.rotation.z = Math.sin(anim.time * 0.8) * Math.PI * 0.3;
      } else if (anim.type === 'drone') {
        anim.object.rotation.y += delta * 3;
      } else if (anim.type === 'patrol') {
        var patrolPath = Math.sin(anim.time * 0.3) * 8;
        anim.object.position.x = -12 + patrolPath;
      } else if (anim.type === 'pulse') {
        var pulseIntensity = 0.5 + Math.sin(anim.time * 2) * 0.5;
        anim.object.material.emissiveIntensity = pulseIntensity;
      }
    }
  };

  var reset = function() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
      if (objects[i].geometry) {
        objects[i].geometry.dispose();
      }
      if (objects[i].material) {
        objects[i].material.dispose();
      }
    }
    objects = [];
    animations = [];
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
