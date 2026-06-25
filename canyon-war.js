window.CanyonWar = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var lights = [];
  var helicopters = [];
  var bridges = [];
  var debris = [];
  var rockSlideActive = false;
  var rockSlideTimer = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    lights = [];
    helicopters = [];
    bridges = [];
    debris = [];
    rockSlideActive = false;
    rockSlideTimer = 0;

    buildlights();
    buildcanyonwalls();
    buildcanyonfloor();
    buildroperidges();
    buildmilitaryconvoy();
    buildhelicopter();
    buildcliffpositions();
    buildbouldersystem();
    buildpetrogryphs();
    buildfoxholes();
  }

  function buildlights() {
    var ambientLight = new THREE.AmbientLight(0x8B7355, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var sunLight = new THREE.DirectionalLight(0xFFD700, 0.8);
    sunLight.position.set(100, 150, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -200;
    sunLight.shadow.camera.right = 200;
    sunLight.shadow.camera.top = 200;
    sunLight.shadow.camera.bottom = -200;
    scene.add(sunLight);
    lights.push(sunLight);

    var pointLight1 = new THREE.PointLight(0xFF6347, 0.5, 150);
    pointLight1.position.set(50, 80, -80);
    scene.add(pointLight1);
    lights.push(pointLight1);

    var pointLight2 = new THREE.PointLight(0xFF6347, 0.5, 150);
    pointLight2.position.set(-50, 80, -80);
    scene.add(pointLight2);
    lights.push(pointLight2);
  }

  function buildcanyonwalls() {
    var leftWallColor = 0xA0522D;
    var rightWallColor = 0x8B4513;
    var layerHeight = 15;
    var layerWidth = 100;
    var layerDepth = 180;

    for (var i = 0; i < 10; i++) {
      var yPos = i * layerHeight;

      var leftGeom = new THREE.BoxGeometry(layerWidth, layerHeight, layerDepth);
      var leftMat = new THREE.MeshLambertMaterial({ color: leftWallColor });
      var leftWall = new THREE.Mesh(leftGeom, leftMat);
      leftWall.position.set(-90, yPos + 7.5, 0);
      leftWall.castShadow = true;
      leftWall.receiveShadow = true;
      scene.add(leftWall);
      meshes.push(leftWall);

      var rightGeom = new THREE.BoxGeometry(layerWidth, layerHeight, layerDepth);
      var rightMat = new THREE.MeshLambertMaterial({ color: rightWallColor });
      var rightWall = new THREE.Mesh(rightGeom, rightMat);
      rightWall.position.set(90, yPos + 7.5, 0);
      rightWall.castShadow = true;
      rightWall.receiveShadow = true;
      scene.add(rightWall);
      meshes.push(rightWall);
    }

    var crevices = 12;
    for (var j = 0; j < crevices; j++) {
      var leftX = -85;
      var rightX = 85;
      var yStart = Math.random() * 120 + 10;
      var xOffset = (Math.random() - 0.5) * 20;

      var creviceGeom = new THREE.BoxGeometry(8, 20, 12);
      var creviceMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
      var leftCrevice = new THREE.Mesh(creviceGeom, creviceMat);
      leftCrevice.position.set(leftX + xOffset, yStart, (Math.random() - 0.5) * 60);
      scene.add(leftCrevice);
      meshes.push(leftCrevice);

      var rightCrevice = new THREE.Mesh(creviceGeom, creviceMat);
      rightCrevice.position.set(rightX + xOffset, yStart, (Math.random() - 0.5) * 60);
      scene.add(rightCrevice);
      meshes.push(rightCrevice);
    }
  }

  function buildcanyonfloor() {
    var floorSegments = 8;
    for (var i = -4; i < 4; i++) {
      for (var j = -2; j < 2; j++) {
        var floorColor = i % 2 === 0 ? 0xD2B48C : 0xC19A6B;
        var floorGeom = new THREE.BoxGeometry(50, 2, 45);
        var floorMat = new THREE.MeshLambertMaterial({ color: floorColor });
        var floor = new THREE.Mesh(floorGeom, floorMat);
        floor.position.set(i * 50, 0, j * 45);
        floor.receiveShadow = true;
        scene.add(floor);
        meshes.push(floor);
      }
    }

    var riverbedGeom = new THREE.BoxGeometry(25, 1, 160);
    var riverbedMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    var riverbed = new THREE.Mesh(riverbedGeom, riverbedMat);
    riverbed.position.set(0, -0.5, 0);
    scene.add(riverbed);
    meshes.push(riverbed);

    var boulderCount = 15;
    for (var b = 0; b < boulderCount; b++) {
      var boulderGeom = new THREE.SphereGeometry(3 + Math.random() * 2, 8, 8);
      var boulderMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
      var boulder = new THREE.Mesh(boulderGeom, boulderMat);
      boulder.position.set((Math.random() - 0.5) * 60, 1, (Math.random() - 0.5) * 100);
      boulder.castShadow = true;
      scene.add(boulder);
      meshes.push(boulder);
    }
  }

  function buildroperidges() {
    var bridgeCount = 3;
    for (var b = 0; b < bridgeCount; b++) {
      var zOffset = (b - 1) * 60;
      var bridgeGroup = [];

      var ropeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

      for (var r = 0; r < 8; r++) {
        var ropeGeom = new THREE.CylinderGeometry(0.3, 0.3, 3, 6);
        var rope = new THREE.Mesh(ropeGeom, ropeMaterial);
        rope.rotation.z = Math.PI / 2;
        rope.position.set(r * 22.5 - 80, 50 + r * 2, zOffset);
        rope.castShadow = true;
        scene.add(rope);
        meshes.push(rope);
        bridgeGroup.push(rope);
      }

      var plankCount = 7;
      for (var p = 0; p < plankCount; p++) {
        var plankGeom = new THREE.BoxGeometry(180, 1.5, 3);
        var plankMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var plank = new THREE.Mesh(plankGeom, plankMat);
        plank.position.set(0, 50 + p * 1.2, zOffset);
        plank.castShadow = true;
        scene.add(plank);
        meshes.push(plank);
        bridgeGroup.push(plank);
      }

      bridges.push({
        objects: bridgeGroup,
        zOffset: zOffset,
        swayAmount: 0,
        swayPhase: Math.random() * Math.PI * 2
      });
    }
  }

  function buildmilitaryconvoy() {
    var vehiclePositions = [
      { x: -30, z: 40 },
      { x: 0, z: 50 },
      { x: 30, z: 60 }
    ];

    for (var v = 0; v < vehiclePositions.length; v++) {
      var pos = vehiclePositions[v];

      var truckGeom = new THREE.BoxGeometry(15, 10, 30);
      var truckMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
      var truck = new THREE.Mesh(truckGeom, truckMat);
      truck.position.set(pos.x, 5, pos.z);
      truck.castShadow = true;
      scene.add(truck);
      meshes.push(truck);

      var cabGeom = new THREE.BoxGeometry(12, 8, 8);
      var cabMat = new THREE.MeshLambertMaterial({ color: 0x1a5c1a });
      var cab = new THREE.Mesh(cabGeom, cabMat);
      cab.position.set(pos.x - 8, 9, pos.z - 10);
      cab.castShadow = true;
      scene.add(cab);
      meshes.push(cab);

      for (var w = 0; w < 4; w++) {
        var wheelGeom = new THREE.CylinderGeometry(2.5, 2.5, 1.5, 8);
        var wheelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var wheel = new THREE.Mesh(wheelGeom, wheelMat);
        var wheelXOffset = w % 2 === 0 ? -5 : 5;
        var wheelZOffset = w < 2 ? -10 : 10;
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos.x + wheelXOffset, 2.5, pos.z + wheelZOffset);
        scene.add(wheel);
        meshes.push(wheel);
      }

      var gunGeom = new THREE.CylinderGeometry(0.8, 0.8, 20, 6);
      var gunMat = new THREE.MeshLambertMaterial({ color: 0x191919 });
      var gun = new THREE.Mesh(gunGeom, gunMat);
      gun.rotation.z = Math.PI / 6;
      gun.position.set(pos.x, 15, pos.z);
      scene.add(gun);
      meshes.push(gun);
    }
  }

  function buildhelicopter() {
    var helloSize = 12;

    var bodyGeom = new THREE.BoxGeometry(8, 6, 20);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(0, 80, -60);
    body.castShadow = true;
    scene.add(body);
    meshes.push(body);

    var cockpitGeom = new THREE.SphereGeometry(3, 8, 8);
    var cockpitMat = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });
    var cockpit = new THREE.Mesh(cockpitGeom, cockpitMat);
    cockpit.position.set(0, 83, -50);
    cockpit.scale.set(1, 0.8, 1.2);
    cockpit.castShadow = true;
    scene.add(cockpit);
    meshes.push(cockpit);

    var mainRotorGeom = new THREE.CylinderGeometry(18, 18, 0.5, 4);
    var rotorMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
    var mainRotor = new THREE.Mesh(mainRotorGeom, rotorMat);
    mainRotor.position.set(0, 86, -60);
    mainRotor.castShadow = true;
    scene.add(mainRotor);
    meshes.push(mainRotor);

    var tailRotorGeom = new THREE.CylinderGeometry(6, 6, 0.4, 3);
    var tailRotor = new THREE.Mesh(tailRotorGeom, rotorMat);
    tailRotor.position.set(0, 84, -75);
    tailRotor.castShadow = true;
    scene.add(tailRotor);
    meshes.push(tailRotor);

    for (var s = 0; s < 2; s++) {
      var skidGeom = new THREE.CylinderGeometry(1, 1, 25, 4);
      var skidMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
      var skid = new THREE.Mesh(skidGeom, skidMat);
      skid.rotation.z = Math.PI / 2;
      skid.position.set(s === 0 ? -5 : 5, 77, -60);
      scene.add(skid);
      meshes.push(skid);
    }

    var gunPodGeom = new THREE.CylinderGeometry(1.2, 1.2, 8, 5);
    var gunPodMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
    var gunPod = new THREE.Mesh(gunPodGeom, gunPodMat);
    gunPod.rotation.z = Math.PI / 2;
    gunPod.position.set(0, 78, -50);
    scene.add(gunPod);
    meshes.push(gunPod);

    helicopters.push({
      body: body,
      mainRotor: mainRotor,
      tailRotor: tailRotor,
      yaw: 0,
      hoverPhase: 0
    });
  }

  function buildcliffpositions() {
    var posCount = 8;

    for (var p = 0; p < posCount; p++) {
      var side = p % 2 === 0 ? -1 : 1;
      var yHeight = 60 + (p % 4) * 25;
      var zPos = -80 + (Math.floor(p / 2) * 50);

      var entranceGeom = new THREE.BoxGeometry(12, 14, 8);
      var entranceMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
      var entrance = new THREE.Mesh(entranceGeom, entranceMat);
      entrance.position.set(side * 95, yHeight, zPos);
      scene.add(entrance);
      meshes.push(entrance);

      var platformGeom = new THREE.BoxGeometry(18, 2, 20);
      var platformMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      var platform = new THREE.Mesh(platformGeom, platformMat);
      platform.position.set(side * 98, yHeight - 8, zPos);
      platform.receiveShadow = true;
      scene.add(platform);
      meshes.push(platform);

      var railGeom = new THREE.CylinderGeometry(0.4, 0.4, 18, 4);
      var railMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var rail = new THREE.Mesh(railGeom, railMat);
      rail.rotation.z = Math.PI / 2;
      rail.position.set(side * 98, yHeight - 6, zPos);
      scene.add(rail);
      meshes.push(rail);

      var sightGeom = new THREE.SphereGeometry(1.5, 6, 6);
      var sightMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
      var sight = new THREE.Mesh(sightGeom, sightMat);
      sight.position.set(side * 98, yHeight - 2, zPos - 8);
      scene.add(sight);
      meshes.push(sight);
    }
  }

  function buildbouldersystem() {
    var trapZones = 3;

    for (var t = 0; t < trapZones; t++) {
      var trapZ = -80 + t * 70;

      var rockPileGeom = new THREE.BoxGeometry(40, 15, 35);
      var rockPileMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
      var rockPile = new THREE.Mesh(rockPileGeom, rockPileMat);
      rockPile.position.set((Math.random() - 0.5) * 40, 40, trapZ);
      rockPile.castShadow = true;
      scene.add(rockPile);
      meshes.push(rockPile);

      for (var b = 0; b < 6; b++) {
        var boulderGeom = new THREE.SphereGeometry(2.5 + Math.random() * 1.5, 8, 8);
        var boulderMat = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var boulder = new THREE.Mesh(boulderGeom, boulderMat);
        boulder.position.set(
          (Math.random() - 0.5) * 50,
          55 + Math.random() * 10,
          trapZ + (Math.random() - 0.5) * 30
        );
        boulder.castShadow = true;
        boulder.userData.initialY = boulder.position.y;
        boulder.userData.trapIndex = t;
        scene.add(boulder);
        meshes.push(boulder);
        debris.push(boulder);
      }
    }

    var anchorGeom = new THREE.CylinderGeometry(2, 2, 8, 6);
    var anchorMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    for (var a = 0; a < 6; a++) {
      var anchor = new THREE.Mesh(anchorGeom, anchorMat);
      anchor.position.set(
        a % 2 === 0 ? -70 : 70,
        45,
        -80 + Math.floor(a / 2) * 70
      );
      scene.add(anchor);
      meshes.push(anchor);
    }
  }

  function buildpetrogryphs() {
    var petroPositions = [
      { x: -90, y: 45, z: -40 },
      { x: 90, y: 55, z: -20 },
      { x: -90, y: 70, z: 20 },
      { x: 90, y: 65, z: 40 },
      { x: -90, y: 80, z: 60 },
      { x: 90, y: 75, z: -60 }
    ];

    for (var p = 0; p < petroPositions.length; p++) {
      var pos = petroPositions[p];

      var symbolGeom = new THREE.SphereGeometry(0.3, 4, 4);
      var symbolMat = new THREE.MeshLambertMaterial({ color: 0xFF8C00 });

      for (var s = 0; s < 5; s++) {
        var symbol = new THREE.Mesh(symbolGeom, symbolMat);
        var angle = (s / 5) * Math.PI * 2;
        symbol.position.set(
          pos.x + Math.cos(angle) * 4,
          pos.y + Math.sin(angle) * 3,
          pos.z
        );
        scene.add(symbol);
        meshes.push(symbol);
      }

      var handprintGeom = new THREE.SphereGeometry(0.2, 4, 4);
      var handprintMat = new THREE.MeshLambertMaterial({ color: 0xFFB347 });
      for (var h = 0; h < 3; h++) {
        var handprint = new THREE.Mesh(handprintGeom, handprintMat);
        handprint.position.set(
          pos.x - 8 + h * 4,
          pos.y - 5,
          pos.z + (Math.random() - 0.5) * 2
        );
        scene.add(handprint);
        meshes.push(handprint);
      }
    }
  }

  function buildfoxholes() {
    var foxholeCount = 12;

    for (var f = 0; f < foxholeCount; f++) {
      var foxX = (Math.random() - 0.5) * 120;
      var foxZ = (Math.random() - 0.5) * 140;

      var rimGeom = new THREE.CylinderGeometry(6, 7, 1, 8);
      var rimMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
      var rim = new THREE.Mesh(rimGeom, rimMat);
      rim.position.set(foxX, 0.5, foxZ);
      rim.receiveShadow = true;
      scene.add(rim);
      meshes.push(rim);

      var pitGeom = new THREE.CylinderGeometry(5, 5.5, 2, 8);
      var pitMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
      var pit = new THREE.Mesh(pitGeom, pitMat);
      pit.position.set(foxX, -0.5, foxZ);
      scene.add(pit);
      meshes.push(pit);

      var sandbagGeom = new THREE.BoxGeometry(10, 2.5, 2);
      var sandbagMat = new THREE.MeshLambertMaterial({ color: 0xBDB76B });
      var sandbag = new THREE.Mesh(sandbagGeom, sandbagMat);
      sandbag.position.set(foxX + 6, 2, foxZ);
      sandbag.rotation.z = Math.random() * 0.3;
      scene.add(sandbag);
      meshes.push(sandbag);

      var sandGeom = new THREE.SphereGeometry(0.8, 4, 4);
      var sandMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
      for (var s = 0; s < 3; s++) {
        var sand = new THREE.Mesh(sandGeom, sandMat);
        sand.position.set(
          foxX + 4 + Math.random() * 4,
          3 + Math.random() * 2,
          foxZ - 3 + Math.random() * 2
        );
        scene.add(sand);
        meshes.push(sand);
      }
    }
  }

  function update(delta) {
    if (!scene) return;

    for (var h = 0; h < helicopters.length; h++) {
      var heli = helicopters[h];

      heli.mainRotor.rotation.y += delta * 15;
      heli.tailRotor.rotation.x += delta * 25;

      heli.hoverPhase += delta * 1.2;
      heli.body.position.y = 80 + Math.sin(heli.hoverPhase) * 2;
      heli.body.position.x = Math.cos(heli.hoverPhase * 0.5) * 8;

      heli.yaw += delta * 0.3;
      heli.body.rotation.y = Math.sin(heli.yaw) * 0.15;
    }

    for (var b = 0; b < bridges.length; b++) {
      var bridge = bridges[b];
      bridge.swayPhase += delta * 0.8;
      var sway = Math.sin(bridge.swayPhase) * 0.8;

      for (var o = 0; o < bridge.objects.length; o++) {
        bridge.objects[o].rotation.z = sway * 0.01;
      }
    }

    rockSlideTimer += delta;
    if (rockSlideTimer > 8) {
      rockSlideActive = true;
      rockSlideTimer = 0;
    }

    for (var d = 0; d < debris.length; d++) {
      var rock = debris[d];
      if (rockSlideActive && rock.userData.initialY > 50) {
        rock.position.y -= delta * 40;
        rock.rotation.x += delta * 3;
        rock.rotation.z += delta * 2;

        if (rock.position.y < 5) {
          rock.position.y = rock.userData.initialY;
          if (Math.random() > 0.7) {
            rockSlideActive = false;
          }
        }
      }
    }
  }

  function reset() {
    for (var m = 0; m < meshes.length; m++) {
      scene.remove(meshes[m]);
    }
    for (var l = 0; l < lights.length; l++) {
      scene.remove(lights[l]);
    }

    meshes = [];
    lights = [];
    helicopters = [];
    bridges = [];
    debris = [];
    scene = null;
    camera = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
})();
