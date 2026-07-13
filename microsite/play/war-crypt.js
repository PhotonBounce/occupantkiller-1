window.WarCrypt = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var lights = [];
  var animatedObjects = [];
  var blastDoor = null;
  var growLights = [];
  var waterPump = null;
  var elapsedTime = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    lights = [];
    animatedObjects = [];
    growLights = [];
    elapsedTime = 0;

    if (camera) {
      camera.position.set(0, 2, 0);
      camera.lookAt(0, 2, -10);
    }

    buildlights();
    buildfloor();
    buildouterwall();
    buildblastdoor();
    buildcorridor();
    buildcontrolroom();
    buildundergroundfarm();
    buildwaterpurification();
    buildarmory();
    buildsleepingquarters();
    buildexit();
  }

  function buildlights() {
    var ambientLight = new THREE.AmbientLight(0x444444, 1.2);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    scene.add(dirLight);
    lights.push(dirLight);

    var point1 = new THREE.PointLight(0x888888, 0.6, 60);
    point1.position.set(0, 15, -30);
    scene.add(point1);
    lights.push(point1);

    var point2 = new THREE.PointLight(0x888888, 0.6, 60);
    point2.position.set(0, 15, 30);
    scene.add(point2);
    lights.push(point2);
  }

  function buildfloor() {
    var floorGeo = new THREE.BoxGeometry(80, 0.5, 80);
    var floorMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.25;
    floor.receiveShadow = true;
    scene.add(floor);
    objects.push(floor);
  }

  function buildouterwall() {
    var wallThickness = 2;
    var wallHeight = 12;
    var wallLength = 80;

    var northWallGeo = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    var northWall = new THREE.Mesh(northWallGeo, wallMat);
    northWall.position.set(0, wallHeight / 2, -40);
    northWall.castShadow = true;
    scene.add(northWall);
    objects.push(northWall);

    var southWall = new THREE.Mesh(northWallGeo, wallMat);
    southWall.position.set(0, wallHeight / 2, 40);
    southWall.castShadow = true;
    scene.add(southWall);
    objects.push(southWall);

    var eastWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);
    var eastWall = new THREE.Mesh(eastWallGeo, wallMat);
    eastWall.position.set(40, wallHeight / 2, 0);
    eastWall.castShadow = true;
    scene.add(eastWall);
    objects.push(eastWall);

    var westWall = new THREE.Mesh(eastWallGeo, wallMat);
    westWall.position.set(-40, wallHeight / 2, 0);
    westWall.castShadow = true;
    scene.add(westWall);
    objects.push(westWall);

    var ceilingGeo = new THREE.BoxGeometry(wallLength, 0.8, wallLength);
    var ceilingMat = new THREE.MeshLambertMaterial({ color: 0x505050 });
    var ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.y = wallHeight;
    ceiling.receiveShadow = true;
    scene.add(ceiling);
    objects.push(ceiling);
  }

  function buildblastdoor() {
    var doorGeo = new THREE.BoxGeometry(8, 6, 0.6);
    var doorMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    blastDoor = new THREE.Mesh(doorGeo, doorMat);
    blastDoor.position.set(0, 3, -8);
    blastDoor.castShadow = true;
    blastDoor.receiveShadow = true;
    blastDoor.originalX = blastDoor.position.x;
    scene.add(blastDoor);
    objects.push(blastDoor);
    animatedObjects.push(blastDoor);

    var doorFrameGeo = new THREE.BoxGeometry(9, 7, 1);
    var frameMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var doorFrame = new THREE.Mesh(doorFrameGeo, frameMat);
    doorFrame.position.set(0, 3, -9);
    doorFrame.castShadow = true;
    scene.add(doorFrame);
    objects.push(doorFrame);

    var boltGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 8);
    var boltMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    for (var i = 0; i < 4; i++) {
      var bolt = new THREE.Mesh(boltGeo, boltMat);
      bolt.position.set(-3 + i * 2, 6.5, -8);
      bolt.castShadow = true;
      scene.add(bolt);
      objects.push(bolt);
    }
  }

  function buildcorridor() {
    var corridorSegments = 6;
    for (var i = 0; i < corridorSegments; i++) {
      var zPos = -15 + i * 5;

      var wallGeo = new THREE.BoxGeometry(6, 5, 0.3);
      var wallMat = new THREE.MeshLambertMaterial({ color: 0x545454 });

      var leftWall = new THREE.Mesh(wallGeo, wallMat);
      leftWall.position.set(-3.5, 2.5, zPos);
      leftWall.castShadow = true;
      scene.add(leftWall);
      objects.push(leftWall);

      var rightWall = new THREE.Mesh(wallGeo, wallMat);
      rightWall.position.set(3.5, 2.5, zPos);
      rightWall.castShadow = true;
      scene.add(rightWall);
      objects.push(rightWall);
    }

    var ventGeo = new THREE.BoxGeometry(0.4, 2, 6);
    var ventMat = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
    for (var j = 0; j < 3; j++) {
      var vent = new THREE.Mesh(ventGeo, ventMat);
      vent.position.set(-3, 4, -10 + j * 8);
      vent.castShadow = true;
      scene.add(vent);
      objects.push(vent);
    }
  }

  function buildcontrolroom() {
    var roomGeo = new THREE.BoxGeometry(10, 6, 8);
    var roomMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    var roomWall = new THREE.Mesh(roomGeo, roomMat);
    roomWall.position.set(15, 3, 0);
    roomWall.castShadow = true;
    scene.add(roomWall);
    objects.push(roomWall);

    var dialGeo = new THREE.SphereGeometry(0.4, 16, 16);
    var dialMat = new THREE.MeshLambertMaterial({ color: 0x444400 });
    for (var i = 0; i < 6; i++) {
      for (var j = 0; j < 2; j++) {
        var dial = new THREE.Mesh(dialGeo, dialMat);
        dial.position.set(12 + i * 1.2, 4 + j * 1, 2);
        dial.castShadow = true;
        scene.add(dial);
        objects.push(dial);
      }
    }

    var controlPanelGeo = new THREE.BoxGeometry(8, 2, 0.3);
    var panelMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    var panel = new THREE.Mesh(controlPanelGeo, panelMat);
    panel.position.set(15, 1.5, 3.5);
    panel.castShadow = true;
    scene.add(panel);
    objects.push(panel);

    var indicatorGeo = new THREE.SphereGeometry(0.2, 8, 8);
    var indicatorMat = new THREE.MeshLambertMaterial({ color: 0xff4444 });
    for (var k = 0; k < 8; k++) {
      var indicator = new THREE.Mesh(indicatorGeo, indicatorMat);
      indicator.position.set(11 + k * 0.9, 1.5, 3.5);
      indicator.castShadow = true;
      scene.add(indicator);
      objects.push(indicator);
    }
  }

  function buildundergroundfarm() {
    var bedGeo = new THREE.BoxGeometry(12, 0.4, 6);
    var bedMat = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
    var bed = new THREE.Mesh(bedGeo, bedMat);
    bed.position.set(-20, 0.5, 15);
    bed.castShadow = true;
    scene.add(bed);
    objects.push(bed);

    var growLightCount = 5;
    for (var i = 0; i < growLightCount; i++) {
      var lightBarGeo = new THREE.BoxGeometry(10, 0.1, 5);
      var lightBarMat = new THREE.MeshLambertMaterial({ color: 0xaa00aa });
      var lightBar = new THREE.Mesh(lightBarGeo, lightBarMat);
      lightBar.position.set(-20, 4 + i * 1.5, 15);
      lightBar.castShadow = true;
      scene.add(lightBar);
      objects.push(lightBar);
      growLights.push({
        mesh: lightBar,
        originalIntensity: 1.0,
        phase: i * 0.3
      });

      var pointLight = new THREE.PointLight(0xff00ff, 0.4, 20);
      pointLight.position.set(-20, 4 + i * 1.5, 15);
      scene.add(pointLight);
      lights.push(pointLight);
    }

    var sprinklersGeo = new THREE.CylinderGeometry(0.15, 0.15, 8, 6);
    var sprinklerMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    for (var j = 0; j < 6; j++) {
      var sprinkler = new THREE.Mesh(sprinklersGeo, sprinklerMat);
      sprinkler.position.set(-25 + j * 2, 3.5, 15);
      sprinkler.castShadow = true;
      scene.add(sprinkler);
      objects.push(sprinkler);
    }
  }

  function buildwaterpurification() {
    var tankGeo = new THREE.CylinderGeometry(2, 2, 4, 16);
    var tankMat = new THREE.MeshLambertMaterial({ color: 0x4a6a7a });
    waterPump = new THREE.Mesh(tankGeo, tankMat);
    waterPump.position.set(-15, 2.5, -20);
    waterPump.castShadow = true;
    scene.add(waterPump);
    objects.push(waterPump);
    animatedObjects.push(waterPump);

    var pipeGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
    var pipeMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    var pipeH = new THREE.Mesh(pipeGeo, pipeMat);
    pipeH.rotation.z = Math.PI / 2;
    pipeH.position.set(-8, 4, -20);
    pipeH.castShadow = true;
    scene.add(pipeH);
    objects.push(pipeH);

    var pipeV = new THREE.Mesh(pipeGeo, pipeMat);
    pipeV.position.set(0, 6, -20);
    pipeV.castShadow = true;
    scene.add(pipeV);
    objects.push(pipeV);

    var filterGeo = new THREE.BoxGeometry(3, 3, 3);
    var filterMat = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
    for (var i = 0; i < 3; i++) {
      var filter = new THREE.Mesh(filterGeo, filterMat);
      filter.position.set(-10 + i * 3, 4.5, -18);
      filter.castShadow = true;
      scene.add(filter);
      objects.push(filter);
    }

    var valveGeo = new THREE.SphereGeometry(0.5, 12, 12);
    var valveMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
    var valve = new THREE.Mesh(valveGeo, valveMat);
    valve.position.set(0, 4, -12);
    valve.castShadow = true;
    scene.add(valve);
    objects.push(valve);
  }

  function buildarmory() {
    var shelfGeo = new THREE.BoxGeometry(12, 0.4, 3);
    var shelfMat = new THREE.MeshLambertMaterial({ color: 0x5a5a4a });
    for (var i = 0; i < 4; i++) {
      var shelf = new THREE.Mesh(shelfGeo, shelfMat);
      shelf.position.set(20, 1 + i * 1.8, -15);
      shelf.castShadow = true;
      scene.add(shelf);
      objects.push(shelf);
    }

    var rackGeo = new THREE.BoxGeometry(1, 8, 1);
    var rackMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    var rackLeft = new THREE.Mesh(rackGeo, rackMat);
    rackLeft.position.set(14, 4, -15);
    rackLeft.castShadow = true;
    scene.add(rackLeft);
    objects.push(rackLeft);

    var rackRight = new THREE.Mesh(rackGeo, rackMat);
    rackRight.position.set(26, 4, -15);
    rackRight.castShadow = true;
    scene.add(rackRight);
    objects.push(rackRight);

    var rifleGeo = new THREE.CylinderGeometry(0.15, 0.15, 3, 6);
    var rifleMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    for (var j = 0; j < 4; j++) {
      for (var k = 0; k < 6; k++) {
        var rifle = new THREE.Mesh(rifleGeo, rifleMat);
        rifle.rotation.z = Math.PI / 2.5;
        rifle.position.set(15 + k * 1.6, 1.5 + j * 1.8, -15);
        rifle.castShadow = true;
        scene.add(rifle);
        objects.push(rifle);
      }
    }

    var ammoBoxGeo = new THREE.BoxGeometry(1.5, 1, 1.5);
    var ammoMat = new THREE.MeshLambertMaterial({ color: 0x8a5a2a });
    for (var m = 0; m < 5; m++) {
      var ammoBox = new THREE.Mesh(ammoBoxGeo, ammoMat);
      ammoBox.position.set(14 + m * 2, 0.8, -12);
      ammoBox.castShadow = true;
      scene.add(ammoBox);
      objects.push(ammoBox);
    }
  }

  function buildsleepingquarters() {
    var bunkFrameGeo = new THREE.BoxGeometry(1, 0.3, 2);
    var frameMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    for (var i = 0; i < 6; i++) {
      var row = Math.floor(i / 3);
      var col = i % 3;
      var xPos = -28 + col * 3;
      var yPos = 1 + row * 2.5;
      var zPos = 8;

      var bunkBase = new THREE.Mesh(bunkFrameGeo, frameMat);
      bunkBase.position.set(xPos, yPos, zPos);
      bunkBase.castShadow = true;
      scene.add(bunkBase);
      objects.push(bunkBase);

      var mattressGeo = new THREE.BoxGeometry(0.9, 0.2, 1.9);
      var mattressMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
      var mattress = new THREE.Mesh(mattressGeo, mattressMat);
      mattress.position.set(xPos, yPos + 0.3, zPos);
      mattress.castShadow = true;
      scene.add(mattress);
      objects.push(mattress);
    }

    var lockerGeo = new THREE.BoxGeometry(1, 2, 1);
    var lockerMat = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
    for (var j = 0; j < 4; j++) {
      var locker = new THREE.Mesh(lockerGeo, lockerMat);
      locker.position.set(-32, 1.5, 15 + j * 1.5);
      locker.castShadow = true;
      scene.add(locker);
      objects.push(locker);
    }

    var tableGeo = new THREE.BoxGeometry(4, 0.3, 2);
    var tableMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    var table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(-25, 1, 18);
    table.castShadow = true;
    scene.add(table);
    objects.push(table);

    var benchGeo = new THREE.BoxGeometry(4, 0.3, 0.5);
    var benchMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
    for (var k = 0; k < 2; k++) {
      var bench = new THREE.Mesh(benchGeo, benchMat);
      bench.position.set(-25, 0.5, 17 + k * 1.5);
      bench.castShadow = true;
      scene.add(bench);
      objects.push(bench);
    }
  }

  function buildexit() {
    var tunnelGeo = new THREE.CylinderGeometry(3, 3, 20, 12);
    var tunnelMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    var tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnel.position.set(0, 3, 35);
    tunnel.rotation.z = Math.PI / 2;
    tunnel.castShadow = true;
    scene.add(tunnel);
    objects.push(tunnel);

    var barnFrameGeo = new THREE.BoxGeometry(15, 10, 8);
    var barnMat = new THREE.MeshLambertMaterial({ color: 0x8a5a3a });
    var barnWall1 = new THREE.Mesh(barnFrameGeo, barnMat);
    barnWall1.position.set(20, 5, 40);
    barnWall1.castShadow = true;
    scene.add(barnWall1);
    objects.push(barnWall1);

    var roofGeo = new THREE.ConeGeometry(8, 5, 8);
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x6a3a1a });
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(20, 10, 40);
    roof.castShadow = true;
    scene.add(roof);
    objects.push(roof);

    var doorGeo = new THREE.BoxGeometry(4, 6, 0.3);
    var doorMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
    var barnDoor = new THREE.Mesh(doorGeo, doorMat);
    barnDoor.position.set(26, 3, 44);
    barnDoor.castShadow = true;
    scene.add(barnDoor);
    objects.push(barnDoor);

    var doorHandleGeo = new THREE.SphereGeometry(0.3, 8, 8);
    var handleMat = new THREE.MeshLambertMaterial({ color: 0xccaa88 });
    var handle = new THREE.Mesh(doorHandleGeo, handleMat);
    handle.position.set(28, 3, 44.2);
    handle.castShadow = true;
    scene.add(handle);
    objects.push(handle);

    var hingeGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 6);
    var hingeMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    for (var i = 0; i < 3; i++) {
      var hinge = new THREE.Mesh(hingeGeo, hingeMat);
      hinge.position.set(22, 1 + i * 2.5, 44.3);
      hinge.castShadow = true;
      scene.add(hinge);
      objects.push(hinge);
    }
  }

  function update(delta) {
    elapsedTime += delta;

    if (blastDoor) {
      var openAmount = Math.sin(elapsedTime * 0.3) * 0.5 + 0.5;
      blastDoor.position.x = blastDoor.originalX + openAmount * 6;
    }

    for (var i = 0; i < growLights.length; i++) {
      var light = growLights[i];
      var flicker = Math.sin(elapsedTime * 3 + light.phase) * 0.3 + 0.7;
      light.mesh.material.emissive.setHex(0xaa00aa);
      light.mesh.material.emissiveIntensity = flicker * 0.5;
    }

    if (waterPump) {
      var pumpBob = Math.sin(elapsedTime * 2.5) * 0.15;
      waterPump.position.y = 2.5 + pumpBob;
      waterPump.rotation.y += delta * 0.5;
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    for (var j = 0; j < lights.length; j++) {
      scene.remove(lights[j]);
    }
    objects = [];
    lights = [];
    animatedObjects = [];
    growLights = [];
    blastDoor = null;
    waterPump = null;
    scene = null;
    camera = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
})();
