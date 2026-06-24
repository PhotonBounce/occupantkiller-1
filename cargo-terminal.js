window.CargoTerminal = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var enabled = true;
  var objects = [];
  var time = 0;
  var containersInspected = 0;
  var contrabandsFound = 0;
  var dockSecured = false;
  var hudElement = null;

  // Animation state
  var gantryPosition = 0;
  var searchlightRotation = 0;
  var warningLightState = 0;
  var forkliftPosition = 0;

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;
    enabled = true;
    objects = [];
    time = 0;
    containersInspected = 0;
    contrabandsFound = 0;
    dockSecured = false;

    // Create HUD
    createHUD();

    // Set scene fog
    scene.fog = new THREE.Fog(0x888888, 100, 300);
    scene.background = new THREE.Color(0x888888);

    // Create all objects
    createGantryCrane();
    createShippingContainers();
    createWarehouseShed();
    createShipHullSection();
    createForklift();
    createInspectionBooth();
    createDockBumpers();
    createCargoNet();
    createHazmatBarrels();
    createPalletStacks();
    createDockCraneControl();
    createSearchlightTower();
    createLoadingRamp();
    createBollards();
    createWaterSurface();
    createEnemies();

    // Setup keybind C+T
    setupKeybinds();
  }

  function createHUD() {
    if (hudElement) document.body.removeChild(hudElement);

    hudElement = document.createElement('div');
    hudElement.id = 'cargo-terminal-hud';
    hudElement.style.position = 'fixed';
    hudElement.style.top = '10px';
    hudElement.style.left = '10px';
    hudElement.style.color = '#00ff00';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.fontSize = '14px';
    hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hudElement.style.padding = '10px';
    hudElement.style.border = '1px solid #00ff00';
    hudElement.style.zIndex = '1000';
    hudElement.style.display = enabled ? 'block' : 'none';
    document.body.appendChild(hudElement);
  }

  function updateHUD() {
    if (!hudElement) return;
    hudElement.innerHTML =
      'CONTAINERS INSPECTED: ' + containersInspected + '/6<br>' +
      'CONTRABAND FOUND: ' + contrabandsFound + '<br>' +
      'DOCK SECURED: ' + (dockSecured ? 'YES' : 'NO') + '<br>' +
      '[ C+T to toggle ]';
  }

  function createGantryCrane() {
    // Main tower - tall vertical boxes
    var towerGeometry = new THREE.BoxGeometry(4, 35, 4);
    var towerMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var towerLeft = new THREE.Mesh(towerGeometry, towerMaterial);
    towerLeft.position.set(-25, 17.5, -30);
    scene.add(towerLeft);
    objects.push(towerLeft);

    var towerRight = new THREE.Mesh(towerGeometry, towerMaterial);
    towerRight.position.set(25, 17.5, -30);
    scene.add(towerRight);
    objects.push(towerRight);

    // Horizontal boom
    var boomGeometry = new THREE.BoxGeometry(60, 2, 2);
    var boomMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var boom = new THREE.Mesh(boomGeometry, boomMaterial);
    boom.position.set(0, 32, -30);
    scene.add(boom);
    objects.push(boom);

    // Cable cylinder (vertical)
    var cableGeometry = new THREE.CylinderGeometry(0.3, 0.3, 20, 8);
    var cableMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
    var cable = new THREE.Mesh(cableGeometry, cableMaterial);
    cable.position.set(0, 15, -30);
    scene.add(cable);
    objects.push(cable);
  }

  function createShippingContainers() {
    var colors = [0x1a1a1a, 0xcc3333, 0x0066ff, 0x33aa33, 0xffaa00];
    var containerGeometry = new THREE.BoxGeometry(6, 6, 12);

    // 3x3x2 array
    for (var x = 0; x < 3; x++) {
      for (var z = 0; z < 3; z++) {
        for (var y = 0; y < 2; y++) {
          var colorIdx = (x + z + y) % colors.length;
          var containerMaterial = new THREE.MeshPhongMaterial({ color: colors[colorIdx] });
          var container = new THREE.Mesh(containerGeometry, containerMaterial);
          container.position.set(-5 + x * 8, 3 + y * 8, 5 + z * 15);
          scene.add(container);
          objects.push(container);
        }
      }
    }
  }

  function createWarehouseShed() {
    // Large flat main box
    var shedGeometry = new THREE.BoxGeometry(30, 12, 20);
    var shedMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var shed = new THREE.Mesh(shedGeometry, shedMaterial);
    shed.position.set(20, 6, 50);
    scene.add(shed);
    objects.push(shed);

    // Corrugated roof boxes
    var roofGeometry = new THREE.BoxGeometry(1, 1, 20);
    var roofMaterial = new THREE.MeshPhongMaterial({ color: 0xbb6644 });
    for (var i = 0; i < 15; i++) {
      var roofBox = new THREE.Mesh(roofGeometry, roofMaterial);
      roofBox.position.set(8 + i * 1.5, 12.5, 50);
      scene.add(roofBox);
      objects.push(roofBox);
    }
  }

  function createShipHullSection() {
    // Large elongated box at dock edge
    var hullGeometry = new THREE.BoxGeometry(25, 15, 50);
    var hullMaterial = new THREE.MeshPhongMaterial({ color: 0x333344 });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.set(-35, 7.5, 5);
    scene.add(hull);
    objects.push(hull);
  }

  function createForklift() {
    // Box body
    var bodyGeometry = new THREE.BoxGeometry(3, 3, 5);
    var bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xff9900 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(10, 1.5, 25);
    scene.add(body);
    objects.push(body);

    // Two cylinder wheels
    var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 12);
    var wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
    var wheelL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelL.position.set(8, 0.8, 22);
    wheelL.rotation.z = Math.PI / 2;
    scene.add(wheelL);
    objects.push(wheelL);

    var wheelR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelR.position.set(8, 0.8, 28);
    wheelR.rotation.z = Math.PI / 2;
    scene.add(wheelR);
    objects.push(wheelR);

    // Forks (box prongs)
    var forkGeometry = new THREE.BoxGeometry(0.4, 3, 4);
    var forkMaterial = new THREE.MeshPhongMaterial({ color: 0xffaa00 });
    var forkL = new THREE.Mesh(forkGeometry, forkMaterial);
    forkL.position.set(13, 1.5, 23);
    scene.add(forkL);
    objects.push(forkL);

    var forkR = new THREE.Mesh(forkGeometry, forkMaterial);
    forkR.position.set(13, 1.5, 27);
    scene.add(forkR);
    objects.push(forkR);
  }

  function createInspectionBooth() {
    var boothGeometry = new THREE.BoxGeometry(4, 3, 4);
    var boothMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var booth = new THREE.Mesh(boothGeometry, boothMaterial);
    booth.position.set(5, 1.5, 40);
    scene.add(booth);
    objects.push(booth);
  }

  function createDockBumpers() {
    var bumperGeometry = new THREE.CylinderGeometry(0.5, 0.5, 10, 8);
    var bumperMaterial = new THREE.MeshPhongMaterial({ color: 0xffbb00 });

    for (var i = 0; i < 5; i++) {
      var bumper = new THREE.Mesh(bumperGeometry, bumperMaterial);
      bumper.position.set(-45, 0.5, -40 + i * 8);
      bumper.rotation.z = Math.PI / 2;
      scene.add(bumper);
      objects.push(bumper);
    }
  }

  function createCargoNet() {
    var netMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc });

    // Horizontal lines
    for (var y = 0; y <= 3; y++) {
      for (var z = 0; z < 3; z++) {
        var points = [];
        for (var x = 0; x <= 3; x++) {
          points.push(new THREE.Vector3(-5 + x * 8, 3 + y * 4, 5 + z * 15));
        }
        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        var line = new THREE.LineSegments(geometry, netMaterial);
        scene.add(line);
        objects.push(line);
      }
    }

    // Vertical lines
    for (var x = 0; x <= 3; x++) {
      for (var z = 0; z < 3; z++) {
        var points = [];
        for (var y = 0; y <= 3; y++) {
          points.push(new THREE.Vector3(-5 + x * 8, 3 + y * 4, 5 + z * 15));
        }
        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        var line = new THREE.LineSegments(geometry, netMaterial);
        scene.add(line);
        objects.push(line);
      }
    }
  }

  function createHazmatBarrels() {
    var barrelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 12);
    var barrelMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });

    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.set(-15 + i * 2, 0.75, 60 + j * 2);
        scene.add(barrel);
        objects.push(barrel);
      }
    }
  }

  function createPalletStacks() {
    var palletGeometry = new THREE.BoxGeometry(4, 0.3, 4);
    var palletMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });

    for (var x = 0; x < 2; x++) {
      for (var z = 0; z < 2; z++) {
        for (var y = 0; y < 3; y++) {
          var pallet = new THREE.Mesh(palletGeometry, palletMaterial);
          pallet.position.set(30 + x * 5, 0.2 + y * 0.5, 30 + z * 5);
          scene.add(pallet);
          objects.push(pallet);
        }
      }
    }
  }

  function createDockCraneControl() {
    var cabinGeometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
    var cabinMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 28, -28);
    scene.add(cabin);
    objects.push(cabin);
  }

  function createSearchlightTower() {
    // Tall thin cylinder
    var towerGeometry = new THREE.CylinderGeometry(0.3, 0.3, 20, 8);
    var towerMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(40, 10, -45);
    scene.add(tower);
    objects.push(tower);

    // Rotating box lamp at top
    var lampGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var lampMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    var lamp = new THREE.Mesh(lampGeometry, lampMaterial);
    lamp.position.set(40, 18, -45);
    scene.add(lamp);
    objects.push(lamp);
  }

  function createLoadingRamp() {
    var rampGeometry = new THREE.BoxGeometry(8, 0.5, 15);
    var rampMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var ramp = new THREE.Mesh(rampGeometry, rampMaterial);
    ramp.position.set(-30, 4, 0);
    ramp.rotation.z = 0.3;
    scene.add(ramp);
    objects.push(ramp);
  }

  function createBollards() {
    var bollardGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8);
    var bollardMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });

    for (var i = 0; i < 6; i++) {
      var bollard = new THREE.Mesh(bollardGeometry, bollardMaterial);
      bollard.position.set(-40 + i * 8, 0.75, -50);
      scene.add(bollard);
      objects.push(bollard);
    }
  }

  function createWaterSurface() {
    var waterGeometry = new THREE.BoxGeometry(100, 1, 100);
    var waterMaterial = new THREE.MeshPhongMaterial({ color: 0x0066ff, wireframe: false });
    var water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(0, -0.5, 0);
    scene.add(water);
    objects.push(water);
  }

  function createEnemies() {
    // Armed dockworkers in orange vests
    for (var i = 0; i < 3; i++) {
      var workerGeometry = new THREE.BoxGeometry(1.2, 2, 0.8);
      var workerMaterial = new THREE.MeshPhongMaterial({ color: 0xff9900 });
      var worker = new THREE.Mesh(workerGeometry, workerMaterial);
      worker.position.set(-20 + i * 15, 1, 15);
      scene.add(worker);
      objects.push(worker);
    }

    // Port security in black uniforms
    for (var i = 0; i < 2; i++) {
      var securityGeometry = new THREE.BoxGeometry(1.2, 2, 0.8);
      var securityMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
      var security = new THREE.Mesh(securityGeometry, securityMaterial);
      security.position.set(15 + i * 10, 1, 35);
      scene.add(security);
      objects.push(security);
    }

    // Crane operator
    var operatorGeometry = new THREE.BoxGeometry(1.2, 2, 0.8);
    var operatorMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var operator = new THREE.Mesh(operatorGeometry, operatorMaterial);
    operator.position.set(0, 1, -25);
    scene.add(operator);
    objects.push(operator);
  }

  function setupKeybinds() {
    var lastC = 0;
    document.addEventListener('keydown', function(event) {
      if (event.key === 'c' || event.key === 'C') {
        var now = Date.now();
        if (now - lastC < 400) {
          lastC = 0;
          if (event.key === 'c' || event.key === 'C') {
            // Wait for T
          }
        } else {
          lastC = now;
        }
      }
      if ((event.key === 't' || event.key === 'T') && Date.now() - lastC < 400) {
        lastC = 0;
        toggleCargoTerminal();
      }
    });
  }

  function toggleCargoTerminal() {
    enabled = !enabled;
    if (hudElement) {
      hudElement.style.display = enabled ? 'block' : 'none';
      if (enabled) {
        hudElement.innerHTML = '<span style="color: #ffff00;">CARGO TERMINAL ONLINE</span>';
        setTimeout(updateHUD, 1000);
      }
    }
  }

  function update(delta) {
    if (!enabled || !scene) return;

    time += delta;

    // Gantry crane trolley slides horizontally
    var gantryObjects = objects.filter(function(obj) {
      return obj.position && obj.position.z === -30 && obj.position.y > 30;
    });
    gantryPosition += delta * 5;
    if (gantryPosition > 60) gantryPosition = -60;
    if (gantryObjects.length > 0) {
      gantryObjects[0].position.x = gantryPosition - 30;
    }

    // Ship rocks gently up-down
    var shipObject = objects.find(function(obj) {
      return obj.position && obj.position.x === -35 && obj.position.y === 7.5 && obj.position.z === 5;
    });
    if (shipObject) {
      shipObject.position.y = 7.5 + Math.sin(time * 0.5) * 0.5;
    }

    // Forklift patrols route
    forkliftPosition += delta * 3;
    if (forkliftPosition > 40) forkliftPosition = 0;
    var forkliftObjects = objects.filter(function(obj) {
      return obj.position && obj.position.x === 10 && obj.position.y === 1.5 && obj.position.z === 25;
    });
    if (forkliftObjects.length > 0) {
      forkliftObjects[0].position.x = 10 + Math.sin(forkliftPosition / 10) * 15;
      forkliftObjects[0].position.z = 25 + (forkliftPosition % 40) - 20;
    }

    // Searchlight rotates
    searchlightRotation += delta;
    var lampObject = objects.find(function(obj) {
      return obj.position && obj.position.x === 40 && obj.position.y === 18 && obj.position.z === -45;
    });
    if (lampObject) {
      lampObject.rotation.y = searchlightRotation;
    }

    // Dock warning lights flash amber
    warningLightState = Math.sin(time * 4) > 0 ? 1 : 0.3;
    var bumperObjects = objects.filter(function(obj) {
      return obj.position && obj.position.x <= -40 && obj.position.z < 0;
    });
    bumperObjects.forEach(function(bumper) {
      if (bumper.material) {
        bumper.material.color.setHSL(0.12, 1, 0.3 + warningLightState * 0.4);
      }
    });

    updateHUD();
  }

  function reset() {
    // Remove all objects from scene
    objects.forEach(function(obj) {
      if (scene && scene.children.indexOf(obj) !== -1) {
        scene.remove(obj);
      }
    });
    objects = [];

    // Reset state
    time = 0;
    containersInspected = 0;
    contrabandsFound = 0;
    dockSecured = false;
    gantryPosition = 0;
    searchlightRotation = 0;
    warningLightState = 0;
    forkliftPosition = 0;

    if (hudElement && hudElement.parentNode) {
      document.body.removeChild(hudElement);
      hudElement = null;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
