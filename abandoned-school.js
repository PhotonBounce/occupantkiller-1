window.AbandonedSchool = (function() {
  'use strict';

  var sceneObjects = [];
  var animatedObjects = [];

  function init(scene, camera) {
    // Clear any existing objects
    reset();

    // Building exterior - main school structure
    var buildingGeom = new THREE.BoxGeometry(60, 45, 40);
    var buildingMat = new THREE.MeshStandardMaterial({ color: 0x887766 });
    var building = new THREE.Mesh(buildingGeom, buildingMat);
    building.position.set(0, 22.5, 0);
    scene.add(building);
    sceneObjects.push(building);

    // Broken windows - scattered across building
    for (var i = 0; i < 12; i++) {
      var windowGeom = new THREE.BoxGeometry(3, 3, 0.5);
      var windowMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
      var window = new THREE.Mesh(windowGeom, windowMat);
      window.position.set(-25 + (i % 4) * 18, 35 - (Math.floor(i / 4) * 8), 20.5);
      scene.add(window);
      sceneObjects.push(window);
    }

    // Classroom desks - rows
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 4; col++) {
        var deskGeom = new THREE.BoxGeometry(2.5, 1, 2);
        var deskMat = new THREE.MeshStandardMaterial({ color: 0x5C3D1F });
        var desk = new THREE.Mesh(deskGeom, deskMat);
        desk.position.set(-15 + col * 5, 1, -20 + row * 6);
        scene.add(desk);
        sceneObjects.push(desk);
      }
    }

    // Chalkboard - classroom wall
    var chalkboardGeom = new THREE.BoxGeometry(12, 4, 0.3);
    var chalkboardMat = new THREE.MeshStandardMaterial({ color: 0x335533 });
    var chalkboard = new THREE.Mesh(chalkboardGeom, chalkboardMat);
    chalkboard.position.set(-20, 8, -24);
    scene.add(chalkboard);
    sceneObjects.push(chalkboard);

    // Gymnasium - large open space
    var gymGeom = new THREE.BoxGeometry(50, 12, 35);
    var gymMat = new THREE.MeshStandardMaterial({ color: 0x776655 });
    var gym = new THREE.Mesh(gymGeom, gymMat);
    gym.position.set(25, 6, 10);
    scene.add(gym);
    sceneObjects.push(gym);

    // Basketball hoops - two hoops in gymnasium
    for (var hoop = 0; hoop < 2; hoop++) {
      var rimGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.2, 16);
      var rimMat = new THREE.MeshStandardMaterial({ color: 0xFF6622 });
      var rim = new THREE.Mesh(rimGeom, rimMat);
      rim.position.set(10 + hoop * 30, 10, 10);
      scene.add(rim);
      sceneObjects.push(rim);
      animatedObjects.push({ mesh: rim, type: 'hoopSway' });
    }

    // Library shelves - tall structures
    for (var shelf = 0; shelf < 5; shelf++) {
      var shelfGeom = new THREE.BoxGeometry(3, 8, 2);
      var shelfMat = new THREE.MeshStandardMaterial({ color: 0x664422 });
      var shelfMesh = new THREE.Mesh(shelfGeom, shelfMat);
      shelfMesh.position.set(-35 + shelf * 4, 4, 20);
      scene.add(shelfMesh);
      sceneObjects.push(shelfMesh);
    }

    // Scattered books on shelves
    for (var book = 0; book < 15; book++) {
      var bookGeom = new THREE.BoxGeometry(0.8, 1.2, 0.3);
      var bookMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 + (Math.random() * 0x222222) });
      var bookMesh = new THREE.Mesh(bookGeom, bookMat);
      bookMesh.position.set(-38 + (book % 5) * 1.5, 2 + (Math.floor(book / 5) * 1.5), 19);
      scene.add(bookMesh);
      sceneObjects.push(bookMesh);
    }

    // Science lab counter
    var labGeom = new THREE.BoxGeometry(20, 2, 3);
    var labMat = new THREE.MeshStandardMaterial({ color: 0x667755 });
    var lab = new THREE.Mesh(labGeom, labMat);
    lab.position.set(20, 1, -15);
    scene.add(lab);
    sceneObjects.push(lab);

    // Beaker - chemistry equipment
    var beakerGeom = new THREE.CylinderGeometry(0.6, 0.8, 2, 8);
    var beakerMat = new THREE.MeshStandardMaterial({ color: 0x00FF44, emissive: 0x00AA22, emissiveIntensity: 0.5 });
    var beaker = new THREE.Mesh(beakerGeom, beakerMat);
    beaker.position.set(20, 3, -15);
    scene.add(beaker);
    sceneObjects.push(beaker);
    animatedObjects.push({ mesh: beaker, type: 'chemicalBubble' });

    // Chemical droplets - spheres in beaker
    for (var drop = 0; drop < 3; drop++) {
      var dropGeom = new THREE.SphereGeometry(0.2, 8, 8);
      var dropMat = new THREE.MeshStandardMaterial({ color: 0x00CC55, emissive: 0x00AA22 });
      var dropMesh = new THREE.Mesh(dropGeom, dropMat);
      dropMesh.position.set(20 + (drop - 1) * 0.6, 2.5, -15);
      scene.add(dropMesh);
      sceneObjects.push(dropMesh);
    }

    // Hazard cone - warning sign
    var coneGeom = new THREE.ConeGeometry(0.5, 1.5, 8);
    var coneMat = new THREE.MeshStandardMaterial({ color: 0xFF9900 });
    var cone = new THREE.Mesh(coneGeom, coneMat);
    cone.position.set(25, 0.75, -16);
    scene.add(cone);
    sceneObjects.push(cone);

    // Principal's office - main desk
    var officeDeskGeom = new THREE.BoxGeometry(6, 1, 3);
    var officeDeskMat = new THREE.MeshStandardMaterial({ color: 0x776644 });
    var officeDesk = new THREE.Mesh(officeDeskGeom, officeDeskMat);
    officeDesk.position.set(-30, 1, 5);
    scene.add(officeDesk);
    sceneObjects.push(officeDesk);

    // Filing cabinet
    var cabinetGeom = new THREE.BoxGeometry(1.5, 4, 2);
    var cabinetMat = new THREE.MeshStandardMaterial({ color: 0x554433 });
    var cabinet = new THREE.Mesh(cabinetGeom, cabinetMat);
    cabinet.position.set(-25, 2, 5);
    scene.add(cabinet);
    sceneObjects.push(cabinet);

    // Cafeteria long tables
    for (var table = 0; table < 3; table++) {
      var tableGeom = new THREE.BoxGeometry(15, 1, 2);
      var tableMat = new THREE.MeshStandardMaterial({ color: 0x887766 });
      var tableMesh = new THREE.Mesh(tableGeom, tableMat);
      tableMesh.position.set(0, 1, 28 + table * 3);
      scene.add(tableMesh);
      sceneObjects.push(tableMesh);
    }

    // Cafeteria bench seating
    for (var bench = 0; bench < 6; bench++) {
      var benchGeom = new THREE.BoxGeometry(14, 1.5, 1);
      var benchMat = new THREE.MeshStandardMaterial({ color: 0x775544 });
      var benchMesh = new THREE.Mesh(benchGeom, benchMat);
      benchMesh.position.set(0 + (bench % 2) * 8, 2.5, 27 + (Math.floor(bench / 2) * 3));
      scene.add(benchMesh);
      sceneObjects.push(benchMesh);
    }

    // Boiler room - cylindrical boilers
    for (var boiler = 0; boiler < 3; boiler++) {
      var boilerGeom = new THREE.CylinderGeometry(1.5, 1.5, 4, 12);
      var boilerMat = new THREE.MeshStandardMaterial({ color: 0x664433 });
      var boilerMesh = new THREE.Mesh(boilerGeom, boilerMat);
      boilerMesh.position.set(-45 + boiler * 5, 2, -30);
      scene.add(boilerMesh);
      sceneObjects.push(boilerMesh);
      animatedObjects.push({ mesh: boilerMesh, type: 'steamVent' });
    }

    // Stairwell steps
    for (var step = 0; step < 8; step++) {
      var stepGeom = new THREE.BoxGeometry(8, 0.5, 1.5);
      var stepMat = new THREE.MeshStandardMaterial({ color: 0x887766 });
      var stepMesh = new THREE.Mesh(stepGeom, stepMat);
      stepMesh.position.set(-35, 0.5 + step * 0.7, -5 + step * 1.2);
      scene.add(stepMesh);
      sceneObjects.push(stepMesh);
    }

    // Stairwell railings - LineSegments
    var railingGeom = new THREE.BufferGeometry();
    var railingPoints = [
      new THREE.Vector3(-39, 1, -5),
      new THREE.Vector3(-39, 6, 3),
      new THREE.Vector3(-31, 1, -5),
      new THREE.Vector3(-31, 6, 3)
    ];
    railingGeom.setFromPoints(railingPoints);
    var railingMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 3 });
    var railings = new THREE.LineSegments(railingGeom, railingMat);
    scene.add(railings);
    sceneObjects.push(railings);

    // Locker corridor - rows of lockers
    for (var lockerRow = 0; lockerRow < 2; lockerRow++) {
      for (var lockerCol = 0; lockerCol < 8; lockerCol++) {
        var lockerGeom = new THREE.BoxGeometry(1.5, 2, 0.6);
        var lockerMat = new THREE.MeshStandardMaterial({ color: 0x446655 });
        var locker = new THREE.Mesh(lockerGeom, lockerMat);
        locker.position.set(-30 + lockerCol * 2, 1 + lockerRow * 2.5, -25);
        scene.add(locker);
        sceneObjects.push(locker);
        if (Math.random() > 0.6) {
          animatedObjects.push({ mesh: locker, type: 'lockerCreak' });
        }
      }
    }

    // Rooftop air conditioning units
    for (var ac = 0; ac < 4; ac++) {
      var acGeom = new THREE.BoxGeometry(3, 2.5, 3);
      var acMat = new THREE.MeshStandardMaterial({ color: 0x666655 });
      var acUnit = new THREE.Mesh(acGeom, acMat);
      acUnit.position.set(-35 + ac * 25, 48, 15);
      scene.add(acUnit);
      sceneObjects.push(acUnit);
    }

    // Broken clock tower - cylindrical base
    var clockBaseGeom = new THREE.CylinderGeometry(2, 2, 6, 16);
    var clockBaseMat = new THREE.MeshStandardMaterial({ color: 0x887766 });
    var clockBase = new THREE.Mesh(clockBaseGeom, clockBaseMat);
    clockBase.position.set(-50, 24, 20);
    scene.add(clockBase);
    sceneObjects.push(clockBase);

    // Clock face - broken
    var clockFaceGeom = new THREE.BoxGeometry(4, 4, 0.3);
    var clockFaceMat = new THREE.MeshStandardMaterial({ color: 0xFFFFCC });
    var clockFace = new THREE.Mesh(clockFaceGeom, clockFaceMat);
    clockFace.position.set(-50, 29, 20.2);
    scene.add(clockFace);
    sceneObjects.push(clockFace);
    animatedObjects.push({ mesh: clockFace, type: 'brokenClock' });

    // Theater stage - main platform
    var stageGeom = new THREE.BoxGeometry(25, 1, 15);
    var stageMat = new THREE.MeshStandardMaterial({ color: 0x4A2810 });
    var stage = new THREE.Mesh(stageGeom, stageMat);
    stage.position.set(40, 1, -18);
    scene.add(stage);
    sceneObjects.push(stage);

    // Theater curtain
    var curtainGeom = new THREE.BoxGeometry(25, 8, 0.5);
    var curtainMat = new THREE.MeshStandardMaterial({ color: 0x660000 });
    var curtain = new THREE.Mesh(curtainGeom, curtainMat);
    curtain.position.set(40, 5, -25);
    scene.add(curtain);
    sceneObjects.push(curtain);

    // Emergency shelter signs - green emissive arrows
    for (var sign = 0; sign < 4; sign++) {
      var signGeom = new THREE.BoxGeometry(1, 2, 0.2);
      var signMat = new THREE.MeshStandardMaterial({ color: 0x005533, emissive: 0x00FF00, emissiveIntensity: 0.8 });
      var signMesh = new THREE.Mesh(signGeom, signMat);
      signMesh.position.set(-45 + sign * 30, 15, -30);
      scene.add(signMesh);
      sceneObjects.push(signMesh);
      animatedObjects.push({ mesh: signMesh, type: 'emergencyPulse' });
    }
  }

  function update(delta) {
    var elapsed = (Date.now() % 10000) / 1000;

    for (var i = 0; i < animatedObjects.length; i++) {
      var obj = animatedObjects[i];
      var mesh = obj.mesh;

      if (obj.type === 'brokenClock') {
        mesh.rotation.z = Math.floor(elapsed * 2) % 3 === 0 ? 0.3 : -0.2;
      } else if (obj.type === 'steamVent') {
        mesh.scale.y = 1 + Math.sin(elapsed * 3) * 0.2;
      } else if (obj.type === 'emergencyPulse') {
        var intensity = 0.4 + Math.sin(elapsed * 4) * 0.4;
        mesh.material.emissiveIntensity = intensity;
      } else if (obj.type === 'chemicalBubble') {
        mesh.position.y = 3 + Math.sin(elapsed * 2.5) * 0.3;
      } else if (obj.type === 'lockerCreak') {
        mesh.rotation.y = Math.sin(elapsed * 1.5) * 0.15;
      } else if (obj.type === 'hoopSway') {
        mesh.rotation.z = Math.sin(elapsed * 1.2) * 0.08;
      }
    }
  }

  function reset() {
    for (var i = 0; i < sceneObjects.length; i++) {
      if (sceneObjects[i].parent) {
        sceneObjects[i].parent.remove(sceneObjects[i]);
      }
      if (sceneObjects[i].geometry) {
        sceneObjects[i].geometry.dispose();
      }
      if (sceneObjects[i].material) {
        if (Array.isArray(sceneObjects[i].material)) {
          for (var j = 0; j < sceneObjects[i].material.length; j++) {
            sceneObjects[i].material[j].dispose();
          }
        } else {
          sceneObjects[i].material.dispose();
        }
      }
    }
    sceneObjects = [];
    animatedObjects = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
