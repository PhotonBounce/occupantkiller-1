window.WarRoom = (function() {
  'use strict';

  var meshes = [];
  var scene = null;
  var camera = null;
  var pulsePhase = 0;
  var alertMode = false;
  var generatorRunning = false;
  var shredderActive = false;

  var spawnPoints = [
    { x: 0, y: 1, z: -35 },      // blast door entrance
    { x: 0, y: 1.5, z: 0 },      // tactical table center
    { x: -20, y: 1, z: 15 },     // communications station
    { x: 15, y: 1, z: 20 },      // generator room
    { x: 0, y: 0.5, z: 35 }      // escape hatch
  ];

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    meshes = [];

    // Main chamber - large underground bunker
    var chamberGeo = new THREE.BoxGeometry(60, 12, 80);
    var chamberMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.8,
      metalness: 0.1
    });
    var chamber = new THREE.Mesh(chamberGeo, chamberMat);
    chamber.position.set(0, 6, 0);
    chamber.castShadow = true;
    chamber.receiveShadow = true;
    scene.add(chamber);
    meshes.push(chamber);

    // Floor - reinforced concrete
    var floorGeo = new THREE.BoxGeometry(60, 0.5, 80);
    var floorMat = new THREE.MeshStandardMaterial({
      color: 0x3d3d3d,
      roughness: 0.9,
      metalness: 0.0
    });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, 0.25, 0);
    floor.castShadow = true;
    floor.receiveShadow = true;
    scene.add(floor);
    meshes.push(floor);

    // Ceiling - reinforced with ducts
    var ceilingGeo = new THREE.BoxGeometry(60, 0.5, 80);
    var ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.2
    });
    var ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.set(0, 11.75, 0);
    ceiling.castShadow = true;
    ceiling.receiveShadow = true;
    scene.add(ceiling);
    meshes.push(ceiling);

    // Support columns - concrete pillars
    for (var i = -2; i <= 2; i++) {
      for (var j = -2; j <= 2; j++) {
        var colGeo = new THREE.CylinderGeometry(1.2, 1.5, 11, 8);
        var colMat = new THREE.MeshStandardMaterial({
          color: 0x4a4a4a,
          roughness: 0.85,
          metalness: 0.05
        });
        var column = new THREE.Mesh(colGeo, colMat);
        column.position.set(i * 15, 5.5, j * 20);
        column.castShadow = true;
        column.receiveShadow = true;
        scene.add(column);
        meshes.push(column);
      }
    }

    // Central tactical display table
    var tableTopGeo = new THREE.BoxGeometry(20, 0.5, 15);
    var tableTopMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.5,
      metalness: 0.8
    });
    var tableTop = new THREE.Mesh(tableTopGeo, tableTopMat);
    tableTop.position.set(0, 1.5, 0);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    scene.add(tableTop);
    meshes.push(tableTop);

    // Table base - support structure
    var tableBaseGeo = new THREE.BoxGeometry(20, 1, 15);
    var tableBaseMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a3a,
      roughness: 0.6,
      metalness: 0.3
    });
    var tableBase = new THREE.Mesh(tableBaseGeo, tableBaseMat);
    tableBase.position.set(0, 0.75, 0);
    tableBase.castShadow = true;
    tableBase.receiveShadow = true;
    scene.add(tableBase);
    meshes.push(tableBase);

    // Glowing tactical map markers on table
    for (var m = 0; m < 8; m++) {
      var angle = (m / 8) * Math.PI * 2;
      var radius = 6;
      var markerGeo = new THREE.SphereGeometry(0.4, 16, 16);
      var markerMat = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00aa00,
        roughness: 0.3,
        metalness: 0.7
      });
      var marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(Math.cos(angle) * radius, 2.0, Math.sin(angle) * radius);
      marker.castShadow = true;
      marker.receiveShadow = true;
      scene.add(marker);
      meshes.push(marker);
    }

    // Wall-mounted status boards - left wall
    for (var b = 0; b < 3; b++) {
      var boardGeo = new THREE.BoxGeometry(8, 5, 0.3);
      var boardMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a2e,
        emissive: 0x003366,
        roughness: 0.4,
        metalness: 0.6
      });
      var board = new THREE.Mesh(boardGeo, boardMat);
      board.position.set(-28, 3 + b * 3.5, 0 + b * 5);
      board.castShadow = true;
      board.receiveShadow = true;
      scene.add(board);
      meshes.push(board);
    }

    // Wall-mounted status boards - right wall
    for (var b = 0; b < 3; b++) {
      var boardGeo = new THREE.BoxGeometry(8, 5, 0.3);
      var boardMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a2e,
        emissive: 0x003366,
        roughness: 0.4,
        metalness: 0.6
      });
      var board = new THREE.Mesh(boardGeo, boardMat);
      board.position.set(28, 3 + b * 3.5, 0 + b * 5);
      board.castShadow = true;
      board.receiveShadow = true;
      scene.add(board);
      meshes.push(board);
    }

    // Communication terminal stations - ring around chamber
    for (var t = 0; t < 4; t++) {
      var termAngle = (t / 4) * Math.PI * 2;
      var termRadius = 22;
      var tx = Math.cos(termAngle) * termRadius;
      var tz = Math.sin(termAngle) * termRadius;

      // Console desk
      var consoleGeo = new THREE.BoxGeometry(4, 1, 3);
      var consoleMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a3a,
        roughness: 0.6,
        metalness: 0.4
      });
      var console = new THREE.Mesh(consoleGeo, consoleMat);
      console.position.set(tx, 0.8, tz);
      console.castShadow = true;
      console.receiveShadow = true;
      scene.add(console);
      meshes.push(console);

      // Screen panel
      var screenGeo = new THREE.BoxGeometry(3, 4, 0.2);
      var screenMat = new THREE.MeshStandardMaterial({
        color: 0x0a1a2e,
        emissive: 0x002266,
        roughness: 0.3,
        metalness: 0.7
      });
      var screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(tx, 3.5, tz);
      screen.castShadow = true;
      screen.receiveShadow = true;
      scene.add(screen);
      meshes.push(screen);
    }

    // Commander's elevated seat - command chair
    var chairSeatGeo = new THREE.BoxGeometry(2, 0.8, 2);
    var chairSeatMat = new THREE.MeshStandardMaterial({
      color: 0x8b0000,
      roughness: 0.5,
      metalness: 0.6
    });
    var chairSeat = new THREE.Mesh(chairSeatGeo, chairSeatMat);
    chairSeat.position.set(0, 2.5, -8);
    chairSeat.castShadow = true;
    chairSeat.receiveShadow = true;
    scene.add(chairSeat);
    meshes.push(chairSeat);

    // Chair back
    var chairBackGeo = new THREE.BoxGeometry(2, 2.5, 0.4);
    var chairBackMat = new THREE.MeshStandardMaterial({
      color: 0x6b0000,
      roughness: 0.5,
      metalness: 0.6
    });
    var chairBack = new THREE.Mesh(chairBackGeo, chairBackMat);
    chairBack.position.set(0, 3.8, -9);
    chairBack.castShadow = true;
    chairBack.receiveShadow = true;
    scene.add(chairBack);
    meshes.push(chairBack);

    // Secure telephone hotlines on pedestals
    for (var ph = 0; ph < 3; ph++) {
      // Pedestal
      var pedGeo = new THREE.BoxGeometry(1, 1.5, 1);
      var pedMat = new THREE.MeshStandardMaterial({
        color: 0x3a3a4a,
        roughness: 0.7,
        metalness: 0.3
      });
      var pedestal = new THREE.Mesh(pedGeo, pedMat);
      pedestal.position.set(-8 + ph * 8, 0.75, -20);
      pedestal.castShadow = true;
      pedestal.receiveShadow = true;
      scene.add(pedestal);
      meshes.push(pedestal);

      // Phone
      var phoneGeo = new THREE.BoxGeometry(0.8, 0.3, 0.5);
      var phoneMat = new THREE.MeshStandardMaterial({
        color: 0xffdd00,
        emissive: 0xffaa00,
        roughness: 0.4,
        metalness: 0.8
      });
      var phone = new THREE.Mesh(phoneGeo, phoneMat);
      phone.position.set(-8 + ph * 8, 2.3, -20);
      phone.castShadow = true;
      phone.receiveShadow = true;
      scene.add(phone);
      meshes.push(phone);
    }

    // Hardened blast door entrance
    var doorGeo = new THREE.BoxGeometry(8, 10, 0.8);
    var doorMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      emissive: 0x660000,
      roughness: 0.3,
      metalness: 0.9
    });
    var blastDoor = new THREE.Mesh(doorGeo, doorMat);
    blastDoor.position.set(0, 5, -38);
    blastDoor.castShadow = true;
    blastDoor.receiveShadow = true;
    scene.add(blastDoor);
    meshes.push(blastDoor);

    // Door locking mechanism bolts
    for (var db = 0; db < 6; db++) {
      var boltGeo = new THREE.SphereGeometry(0.3, 8, 8);
      var boltMat = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.4,
        metalness: 0.9
      });
      var bolt = new THREE.Mesh(boltGeo, boltMat);
      bolt.position.set(-3 + db * 1.3, 2 + (db % 2) * 5, -38.5);
      bolt.castShadow = true;
      bolt.receiveShadow = true;
      scene.add(bolt);
      meshes.push(bolt);
    }

    // Overhead lighting grid with panels
    for (var lx = -2; lx <= 2; lx++) {
      for (var lz = -2; lz <= 2; lz++) {
        // Light panel
        var lightPanelGeo = new THREE.BoxGeometry(8, 8, 0.3);
        var lightPanelMat = new THREE.MeshStandardMaterial({
          color: 0x4a4a4a,
          emissive: 0x666666,
          roughness: 0.5,
          metalness: 0.4
        });
        var lightPanel = new THREE.Mesh(lightPanelGeo, lightPanelMat);
        lightPanel.position.set(lx * 15, 11.2, lz * 20);
        lightPanel.castShadow = true;
        lightPanel.receiveShadow = true;
        scene.add(lightPanel);
        meshes.push(lightPanel);

        // Glowing light fixture
        var fixturGeo = new THREE.SphereGeometry(0.8, 16, 16);
        var fixturMat = new THREE.MeshStandardMaterial({
          color: 0xffffcc,
          emissive: 0xffff99,
          roughness: 0.3,
          metalness: 0.6
        });
        var fixture = new THREE.Mesh(fixturGeo, fixturMat);
        fixture.position.set(lx * 15, 10.8, lz * 20);
        fixture.castShadow = true;
        fixture.receiveShadow = true;
        scene.add(fixture);
        meshes.push(fixture);
      }
    }

    // Cooling ducts overhead
    for (var d = 0; d < 4; d++) {
      var ductGeo = new THREE.BoxGeometry(3, 1, 70);
      var ductMat = new THREE.MeshStandardMaterial({
        color: 0x2a2a3a,
        roughness: 0.7,
        metalness: 0.3
      });
      var duct = new THREE.Mesh(ductGeo, ductMat);
      duct.position.set(-12 + d * 8, 11, 0);
      duct.castShadow = true;
      duct.receiveShadow = true;
      scene.add(duct);
      meshes.push(duct);
    }

    // Briefing projection screen - large flat panel
    var projGeo = new THREE.BoxGeometry(16, 8, 0.3);
    var projMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a1a,
      emissive: 0x001133,
      roughness: 0.2,
      metalness: 0.8
    });
    var projScreen = new THREE.Mesh(projGeo, projMat);
    projScreen.position.set(0, 6, 35);
    projScreen.castShadow = true;
    projScreen.receiveShadow = true;
    scene.add(projScreen);
    meshes.push(projScreen);

    // Shredder machine - office equipment
    var shredderGeo = new THREE.BoxGeometry(2, 2.5, 2);
    var shredderMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.6,
      metalness: 0.5
    });
    var shredder = new THREE.Mesh(shredderGeo, shredderMat);
    shredder.position.set(22, 1.5, 25);
    shredder.castShadow = true;
    shredder.receiveShadow = true;
    scene.add(shredder);
    meshes.push(shredder);

    // Shredder slot
    var slotGeo = new THREE.BoxGeometry(1.2, 0.3, 0.2);
    var slotMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
      metalness: 0.1
    });
    var slot = new THREE.Mesh(slotGeo, slotMat);
    slot.position.set(22, 2.2, 26.1);
    slot.castShadow = true;
    slot.receiveShadow = true;
    scene.add(slot);
    meshes.push(slot);

    // Emergency generator room - adjacent room
    var genRoomGeo = new THREE.BoxGeometry(20, 8, 15);
    var genRoomMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.8,
      metalness: 0.1
    });
    var genRoom = new THREE.Mesh(genRoomGeo, genRoomMat);
    genRoom.position.set(20, 4, 20);
    genRoom.castShadow = true;
    genRoom.receiveShadow = true;
    scene.add(genRoom);
    meshes.push(genRoom);

    // Generators - cylindrical power units
    for (var g = 0; g < 3; g++) {
      var genGeo = new THREE.CylinderGeometry(1.5, 1.5, 3, 12);
      var genMat = new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        roughness: 0.7,
        metalness: 0.3
      });
      var generator = new THREE.Mesh(genGeo, genMat);
      generator.position.set(15 + g * 5, 2, 20);
      generator.castShadow = true;
      generator.receiveShadow = true;
      scene.add(generator);
      meshes.push(generator);
    }

    // Escape tunnel hatch - floor hatch
    var hatchGeo = new THREE.BoxGeometry(3, 0.3, 3);
    var hatchMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      emissive: 0x660000,
      roughness: 0.6,
      metalness: 0.7
    });
    var hatch = new THREE.Mesh(hatchGeo, hatchMat);
    hatch.position.set(0, 0.4, 38);
    hatch.castShadow = true;
    hatch.receiveShadow = true;
    scene.add(hatch);
    meshes.push(hatch);

    // Emergency alert light strip
    var alertStripGeo = new THREE.BoxGeometry(60, 0.3, 0.5);
    var alertStripMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xaa0000,
      roughness: 0.4,
      metalness: 0.6
    });
    var alertStrip = new THREE.Mesh(alertStripGeo, alertStripMat);
    alertStrip.position.set(0, 11.4, 0);
    alertStrip.castShadow = true;
    alertStrip.receiveShadow = true;
    scene.add(alertStrip);
    meshes.push(alertStrip);
  }

  function update(delta) {
    if (!scene) return;

    pulsePhase += delta * 2;

    // Update tactical display markers - pulsing glow
    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh.material && mesh.material.emissive) {
        // Identify glowing markers by color
        if (mesh.material.color.getHex() === 0x00ff00) {
          var pulseIntensity = 0.5 + Math.sin(pulsePhase) * 0.4;
          mesh.material.emissive.setHex(0x00ff00);
          mesh.scale.set(1 + pulseIntensity * 0.2, 1 + pulseIntensity * 0.2, 1 + pulseIntensity * 0.2);
        }
      }
    }

    // Status boards cycling - shift emissive color
    var boardCycle = Math.sin(pulsePhase * 0.5);
    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh.material && mesh.material.color && mesh.material.color.getHex() === 0x0a0a2e) {
        if (boardCycle > 0) {
          mesh.material.emissive.setHex(0x003366);
        } else {
          mesh.material.emissive.setHex(0x006633);
        }
      }
    }

    // Communication terminals blinking
    var blinkCycle = Math.sin(pulsePhase * 1.5);
    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh.material && mesh.material.color && mesh.material.color.getHex() === 0x0a1a2e) {
        if (blinkCycle > 0.3) {
          mesh.material.emissive.setHex(0x002266);
        } else {
          mesh.material.emissive.setHex(0x000011);
        }
      }
    }

    // Overhead lights dimming/brightening during alert
    var lightBrightness = 0.5 + Math.cos(pulsePhase * 0.7) * 0.4;
    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh.material && mesh.material.color && mesh.material.color.getHex() === 0xffffcc) {
        var emissiveVal = Math.floor(0xffff99 * lightBrightness);
        mesh.material.emissive.setHex(emissiveVal);
      }
    }

    // Blast door sealing effect
    var doorSealCycle = Math.sin(pulsePhase * 0.3);
    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh.material && mesh.material.color && mesh.material.color.getHex() === 0x1a1a1a) {
        if (doorSealCycle > 0.5) {
          mesh.material.emissive.setHex(0x660000);
        } else {
          mesh.material.emissive.setHex(0x330000);
        }
      }
    }

    // Alert mode - emergency lights strobing
    if (alertMode) {
      var strobePhase = Math.sin(pulsePhase * 3);
      for (var i = 0; i < meshes.length; i++) {
        var mesh = meshes[i];
        if (mesh.material && mesh.material.color && mesh.material.color.getHex() === 0xff0000) {
          if (strobePhase > 0) {
            mesh.material.emissive.setHex(0xff0000);
          } else {
            mesh.material.emissive.setHex(0x330000);
          }
        }
      }
    }

    // Shredder running - scale vibration
    if (shredderActive) {
      for (var i = 0; i < meshes.length; i++) {
        var mesh = meshes[i];
        if (mesh.material && mesh.material.color && mesh.material.color.getHex() === 0x3a3a3a) {
          if (mesh.position.x === 22 && mesh.position.y === 1.5) {
            var vibration = Math.sin(pulsePhase * 8) * 0.05;
            mesh.position.x = 22 + vibration;
            mesh.position.z = 25 + vibration;
          }
        }
      }
    }

    // Generator hum - scale vibration
    if (generatorRunning) {
      for (var i = 0; i < meshes.length; i++) {
        var mesh = meshes[i];
        if (mesh.geometry instanceof THREE.CylinderGeometry) {
          if (mesh.position.x > 10 && mesh.position.x < 30) {
            var vibration = Math.sin(pulsePhase * 5) * 0.03;
            mesh.rotation.x += vibration * 0.01;
          }
        }
      }
    }

    // Map markers moving on table surface
    var tableMarkerCount = 0;
    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh.geometry instanceof THREE.SphereGeometry && mesh.position.y > 1.9 && mesh.position.y < 2.1) {
        var angle = (tableMarkerCount / 8) * Math.PI * 2 + pulsePhase * 0.3;
        var radius = 6 + Math.sin(pulsePhase + tableMarkerCount) * 0.5;
        mesh.position.x = Math.cos(angle) * radius;
        mesh.position.z = Math.sin(angle) * radius;
        tableMarkerCount++;
      }
    }
  }

  function reset() {
    if (scene) {
      for (var i = 0; i < meshes.length; i++) {
        scene.remove(meshes[i]);
      }
    }
    meshes = [];
    pulsePhase = 0;
    alertMode = false;
    generatorRunning = false;
    shredderActive = false;
  }

  function getSpawnPoints() {
    return spawnPoints;
  }

  function triggerAlert() {
    alertMode = true;
  }

  function clearAlert() {
    alertMode = false;
  }

  function startGenerator() {
    generatorRunning = true;
  }

  function stopGenerator() {
    generatorRunning = false;
  }

  function activateShredder() {
    shredderActive = true;
  }

  function deactivateShredder() {
    shredderActive = false;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: getSpawnPoints,
    triggerAlert: triggerAlert,
    clearAlert: clearAlert,
    startGenerator: startGenerator,
    stopGenerator: stopGenerator,
    activateShredder: activateShredder,
    deactivateShredder: deactivateShredder
  };
}());
