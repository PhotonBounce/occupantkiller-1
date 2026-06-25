var SubmarineBase = (function() {
  'use strict';

  var scene, camera;
  var elements = {};
  var animations = {};
  var hudText = null;
  var lastHKeyTime = 0;
  var lastBKeyTime = 0;
  var hudVisible = false;
  var floodingLevel = 0;
  var infiltratorsRemaining = 6;
  var baseCompromised = false;

  var keysPressed = {};

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    buildCavernBase();
    buildWaterChannel();
    buildSubmarines();
    buildDockingGantry();
    buildTorpedoLoadingSystem();
    buildControlRoom();
    buildInfiltrators();
    buildDefenders();
    buildPressureDoor();
    buildEmergencyLighting();
    buildEscapeTunnel();
    buildDepthChargeRack();
    buildFloodingWater();
    createHUD();
    setupInput();
  }

  function buildCavernBase() {
    var baseGeometry = new THREE.BoxGeometry(400, 0.3, 300);
    var baseMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);
    elements.cavernBase = baseMesh;

    // Left wall
    var leftWallGeometry = new THREE.BoxGeometry(4, 80, 300);
    var rockMaterial = new THREE.MeshPhongMaterial({ color: 0x444422 });
    var leftWall = new THREE.Mesh(leftWallGeometry, rockMaterial);
    leftWall.position.set(-200, 40, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right wall
    var rightWall = new THREE.Mesh(leftWallGeometry, rockMaterial);
    rightWall.position.set(200, 40, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Ceiling
    var ceilingGeometry = new THREE.BoxGeometry(400, 4, 300);
    var ceiling = new THREE.Mesh(ceilingGeometry, rockMaterial);
    ceiling.position.set(0, 82, 0);
    ceiling.castShadow = true;
    ceiling.receiveShadow = true;
    scene.add(ceiling);

    elements.cavernWalls = { left: leftWall, right: rightWall, ceiling: ceiling };
  }

  function buildWaterChannel() {
    var waterGeometry = new THREE.BoxGeometry(60, 3, 200);
    var waterMaterial = new THREE.MeshPhongMaterial({ color: 0x001a33 });
    var water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(0, 1.5, 0);
    water.receiveShadow = true;
    scene.add(water);
    elements.waterChannel = water;
  }

  function buildSubmarines() {
    // Submarine 1
    var sub1Geometry = new THREE.BoxGeometry(100, 12, 22);
    var subMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var sub1 = new THREE.Mesh(sub1Geometry, subMaterial);
    sub1.position.set(-20, 8, -60);
    sub1.castShadow = true;
    sub1.receiveShadow = true;
    scene.add(sub1);

    // Conning tower for sub1
    var towerGeometry = new THREE.BoxGeometry(8, 8, 8);
    var towerMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
    var tower1 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower1.position.set(-20, 18, -60);
    tower1.castShadow = true;
    scene.add(tower1);

    // Propeller discs for sub1
    var propGeometry = new THREE.CylinderGeometry(4, 4, 0.2, 16);
    var propMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
    var prop1 = new THREE.Mesh(propGeometry, propMaterial);
    prop1.rotation.z = Math.PI / 2;
    prop1.position.set(-70, 8, -60);
    prop1.castShadow = true;
    scene.add(prop1);
    animations.prop1 = prop1;

    elements.submarine1 = { body: sub1, tower: tower1, propeller: prop1 };

    // Submarine 2
    var sub2 = new THREE.Mesh(sub1Geometry, subMaterial);
    sub2.position.set(30, 8, 50);
    sub2.castShadow = true;
    sub2.receiveShadow = true;
    scene.add(sub2);

    var tower2 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower2.position.set(30, 18, 50);
    tower2.castShadow = true;
    scene.add(tower2);

    var prop2 = new THREE.Mesh(propGeometry, propMaterial);
    prop2.rotation.z = Math.PI / 2;
    prop2.position.set(80, 8, 50);
    prop2.castShadow = true;
    scene.add(prop2);
    animations.prop2 = prop2;

    elements.submarine2 = { body: sub2, tower: tower2, propeller: prop2 };
  }

  function buildDockingGantry() {
    // Platform
    var platformGeometry = new THREE.BoxGeometry(120, 0.5, 30);
    var metalMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var platform = new THREE.Mesh(platformGeometry, metalMaterial);
    platform.position.set(-20, 25, -60);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);

    // Support posts
    var postGeometry = new THREE.BoxGeometry(2, 17, 2);
    var post1 = new THREE.Mesh(postGeometry, metalMaterial);
    post1.position.set(-55, 12.5, -75);
    post1.castShadow = true;
    scene.add(post1);

    var post2 = new THREE.Mesh(postGeometry, metalMaterial);
    post2.position.set(15, 12.5, -75);
    post2.castShadow = true;
    scene.add(post2);

    // Stairs (stepped boxes)
    var stairGeometry = new THREE.BoxGeometry(2, 1, 2);
    for (var i = 0; i < 8; i++) {
      var stair = new THREE.Mesh(stairGeometry, metalMaterial);
      stair.position.set(-60 + i * 2, 1 + i * 1.5, -80);
      stair.castShadow = true;
      scene.add(stair);
    }

    elements.dockingGantry = { platform: platform, posts: [post1, post2] };
  }

  function buildTorpedoLoadingSystem() {
    // Crane beam (horizontal)
    var beamGeometry = new THREE.BoxGeometry(50, 1, 1);
    var beamMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(0, 30, 0);
    beam.castShadow = true;
    scene.add(beam);

    // Crane support columns
    var columnGeometry = new THREE.BoxGeometry(2, 20, 2);
    var col1 = new THREE.Mesh(columnGeometry, beamMaterial);
    col1.position.set(-25, 10, 0);
    col1.castShadow = true;
    scene.add(col1);

    var col2 = new THREE.Mesh(columnGeometry, beamMaterial);
    col2.position.set(25, 10, 0);
    col2.castShadow = true;
    scene.add(col2);

    // Hanging trolley
    var trolleyGeometry = new THREE.BoxGeometry(4, 2, 4);
    var trolley = new THREE.Mesh(trolleyGeometry, beamMaterial);
    trolley.position.set(0, 28, 0);
    trolley.castShadow = true;
    scene.add(trolley);
    animations.trolley = trolley;

    // Torpedo on crane
    var torpedoGeometry = new THREE.CylinderGeometry(1.5, 1.5, 10, 12);
    var torpedoMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    var torpedo = new THREE.Mesh(torpedoGeometry, torpedoMaterial);
    torpedo.rotation.z = Math.PI / 2;
    torpedo.position.set(0, 26, 0);
    torpedo.castShadow = true;
    scene.add(torpedo);
    animations.craneLoadTorpedo = torpedo;

    // Torpedo cylinders on racks (4 of them)
    var rackGeometry = new THREE.BoxGeometry(3, 0.5, 4);
    var rackMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });

    for (var i = 0; i < 4; i++) {
      var rack = new THREE.Mesh(rackGeometry, rackMaterial);
      rack.position.set(-30 + i * 15, 2, 80);
      rack.castShadow = true;
      scene.add(rack);

      var torp = new THREE.Mesh(torpedoGeometry, torpedoMaterial);
      torp.rotation.z = Math.PI / 2;
      torp.position.set(-30 + i * 15, 3, 80);
      torp.castShadow = true;
      scene.add(torp);
    }

    elements.torpedoSystem = { crane: { beam: beam, trolley: trolley }, hanging: torpedo };
  }

  function buildControlRoom() {
    var buildingGeometry = new THREE.BoxGeometry(20, 10, 15);
    var wallMaterial = new THREE.MeshPhongMaterial({ color: 0x222255 });
    var building = new THREE.Mesh(buildingGeometry, wallMaterial);
    building.position.set(80, 5, -100);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);

    // Windows (lit rectangles)
    var windowGeometry = new THREE.BoxGeometry(3, 2, 0.1);
    var windowMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, emissive: 0x00ff00 });

    for (var i = 0; i < 3; i++) {
      var window1 = new THREE.Mesh(windowGeometry, windowMaterial);
      window1.position.set(75 + i * 3, 7, -100 + 7.5);
      scene.add(window1);

      var window2 = new THREE.Mesh(windowGeometry, windowMaterial);
      window2.position.set(75 + i * 3, 7, -100 - 7.5);
      scene.add(window2);
    }

    // Control room door
    var doorGeometry = new THREE.BoxGeometry(2, 4, 0.1);
    var doorMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(88, 2, -100);
    scene.add(door);

    elements.controlRoom = building;
  }

  function buildInfiltrators() {
    var infiltrators = [];
    var bodyGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.4);
    var wetsuitMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });

    var positions = [
      [40, 5, 20],
      [60, 15, -40],
      [100, 20, 0],
      [-80, 30, 50],
      [-100, 25, -70],
      [-50, 18, 30]
    ];

    for (var i = 0; i < 6; i++) {
      var body = new THREE.Mesh(bodyGeometry, wetsuitMaterial);
      body.position.set(positions[i][0], positions[i][1], positions[i][2]);
      body.castShadow = true;
      scene.add(body);
      infiltrators.push(body);
      animations['infiltrator' + i] = { mesh: body, direction: Math.random() > 0.5 ? 1 : -1 };
    }

    elements.infiltrators = infiltrators;
  }

  function buildDefenders() {
    var defenders = [];
    var bodyGeometry = new THREE.BoxGeometry(0.6, 2, 0.4);
    var uniformMaterial = new THREE.MeshPhongMaterial({ color: 0x001166 });

    var positions = [
      [0, 5, -40],
      [50, 5, 40],
      [-60, 5, 80],
      [90, 5, -50]
    ];

    for (var i = 0; i < 4; i++) {
      var body = new THREE.Mesh(bodyGeometry, uniformMaterial);
      body.position.set(positions[i][0], positions[i][1], positions[i][2]);
      body.castShadow = true;
      scene.add(body);
      defenders.push(body);
    }

    elements.defenders = defenders;
  }

  function buildPressureDoor() {
    // Door frame
    var frameGeometry = new THREE.BoxGeometry(8, 8, 0.5);
    var frameMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(-190, 10, -80);
    frame.castShadow = true;
    scene.add(frame);

    // Door disc
    var diskGeometry = new THREE.CylinderGeometry(3.5, 3.5, 0.3, 32);
    var doorMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var disk = new THREE.Mesh(diskGeometry, doorMaterial);
    disk.rotation.y = 0;
    disk.position.set(-190, 10, -79);
    disk.castShadow = true;
    scene.add(disk);
    animations.pressureDoor = disk;

    // Handle
    var handleGeometry = new THREE.BoxGeometry(0.3, 2, 0.3);
    var handleMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    var handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(-190, 11, -76.3);
    scene.add(handle);

    elements.pressureDoor = { frame: frame, disk: disk, handle: handle };
  }

  function buildEmergencyLighting() {
    var lights = [];
    var positions = [
      [-150, 50, -100],
      [-100, 50, 0],
      [0, 50, 100],
      [100, 50, -50],
      [150, 50, 50]
    ];

    for (var i = 0; i < positions.length; i++) {
      var sphereGeometry = new THREE.SphereGeometry(2, 8, 8);
      var lightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, emissive: 0xff0000 });
      var sphere = new THREE.Mesh(sphereGeometry, lightMaterial);
      sphere.position.set(positions[i][0], positions[i][1], positions[i][2]);
      scene.add(sphere);
      lights.push(sphere);
      animations['emergencyLight' + i] = sphere;
    }

    elements.emergencyLights = lights;
  }

  function buildEscapeTunnel() {
    var tunnelGeometry = new THREE.BoxGeometry(6, 6, 150);
    var tunnelMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
    tunnel.position.set(-190, 20, 120);
    tunnel.castShadow = true;
    tunnel.receiveShadow = true;
    scene.add(tunnel);

    // Tunnel supports (rings)
    for (var i = 0; i < 10; i++) {
      var ringGeometry = new THREE.TorusGeometry(3, 0.2, 8, 32);
      var ringMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
      var ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(-190, 20, 50 + i * 15);
      scene.add(ring);
    }

    elements.escapeTunnel = tunnel;
  }

  function buildDepthChargeRack() {
    // Wall-mounted shelf
    var shelfGeometry = new THREE.BoxGeometry(30, 0.5, 2);
    var shelfMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
    shelf.position.set(180, 15, 0);
    shelf.castShadow = true;
    scene.add(shelf);

    // Charge cylinders
    for (var i = 0; i < 8; i++) {
      var chargeGeometry = new THREE.CylinderGeometry(1, 1, 3, 12);
      var chargeMaterial = new THREE.MeshPhongMaterial({ color: 0xff6600 });
      var charge = new THREE.Mesh(chargeGeometry, chargeMaterial);
      charge.position.set(165 + (i % 4) * 3, 18 + Math.floor(i / 4) * 3, 0);
      charge.castShadow = true;
      scene.add(charge);
    }

    elements.depthChargeRack = shelf;
  }

  function buildFloodingWater() {
    var floodGeometry = new THREE.BoxGeometry(60, 0.1, 200);
    var floodMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ccff,
      emissive: 0x0088ff,
      transparent: true,
      opacity: 0.4
    });
    var flood = new THREE.Mesh(floodGeometry, floodMaterial);
    flood.position.set(0, 1.5, 0);
    scene.add(flood);
    animations.floodingWater = flood;
    elements.floodingWater = flood;
  }

  function createHUD() {
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    var ctx = canvas.getContext('2d');

    function updateHUD() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, 512, 128);

      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('FLOODING: ' + Math.floor(floodingLevel) + '%', 10, 30);
      ctx.fillText('INFILTRATORS: ' + infiltratorsRemaining, 10, 60);
      ctx.fillText('BASE COMPROMISED: ' + (baseCompromised ? 'YES' : 'NO'), 10, 90);
    }

    updateHUD();

    var texture = new THREE.CanvasTexture(canvas);
    var spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    var sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(8, 2, 1);
    sprite.position.set(-180, 70, -100);
    scene.add(sprite);

    hudText = { canvas: canvas, ctx: ctx, sprite: sprite, update: updateHUD };
  }

  function updateHUD() {
    if (hudText) {
      hudText.update();
      hudText.sprite.material.map.needsUpdate = true;
    }
  }

  function setupInput() {
    document.addEventListener('keydown', function(e) {
      keysPressed[e.key.toUpperCase()] = true;

      if (e.key.toUpperCase() === 'H') {
        var now = Date.now();
        if (now - lastHKeyTime < 400) {
          lastHKeyTime = 0;
          if (now - lastBKeyTime < 400) {
            hudVisible = !hudVisible;
            if (hudText) {
              hudText.sprite.visible = hudVisible;
            }
          }
        } else {
          lastHKeyTime = now;
        }
      }

      if (e.key.toUpperCase() === 'B') {
        var now = Date.now();
        if (now - lastBKeyTime < 400) {
          lastBKeyTime = 0;
          if (now - lastHKeyTime < 400) {
            hudVisible = !hudVisible;
            if (hudText) {
              hudText.sprite.visible = hudVisible;
            }
          }
        } else {
          lastBKeyTime = now;
        }
      }
    });

    document.addEventListener('keyup', function(e) {
      keysPressed[e.key.toUpperCase()] = false;
    });
  }

  function update(delta) {
    // Propeller rotation
    if (animations.prop1) {
      animations.prop1.rotation.x += delta * 8;
    }
    if (animations.prop2) {
      animations.prop2.rotation.x += delta * 8;
    }

    // Water level rise (flooding)
    floodingLevel = Math.min(floodingLevel + delta * 5, 100);
    if (animations.floodingWater) {
      animations.floodingWater.position.y = 1.5 + (floodingLevel / 100) * 25;
    }

    // Infiltrator movement
    for (var i = 0; i < 6; i++) {
      var key = 'infiltrator' + i;
      if (animations[key]) {
        var infiltrator = animations[key];
        infiltrator.mesh.position.x += infiltrator.direction * delta * 3;
        if (infiltrator.mesh.position.x > 150 || infiltrator.mesh.position.x < -150) {
          infiltrator.direction *= -1;
        }
      }
    }

    // Emergency lights pulsing
    for (var i = 0; i < 5; i++) {
      var lightKey = 'emergencyLight' + i;
      if (animations[lightKey]) {
        var light = animations[lightKey];
        var pulse = Math.sin(Date.now() / 300 + i) * 0.5 + 0.5;
        light.material.emissive.setHSL(0, 1, pulse * 0.3);
      }
    }

    // Crane trolley movement
    if (animations.trolley) {
      animations.trolley.position.x = Math.sin(Date.now() / 2000) * 20;
    }

    // Hanging torpedo follows trolley
    if (animations.craneLoadTorpedo && animations.trolley) {
      animations.craneLoadTorpedo.position.x = animations.trolley.position.x;
    }

    // Pressure door rotation
    if (animations.pressureDoor) {
      animations.pressureDoor.rotation.y = Math.sin(Date.now() / 3000) * 0.3;
    }

    updateHUD();
  }

  function reset() {
    floodingLevel = 0;
    infiltratorsRemaining = 6;
    baseCompromised = false;
    hudVisible = false;

    if (elements.floodingWater) {
      elements.floodingWater.position.y = 1.5;
    }

    if (animations.pressureDoor) {
      animations.pressureDoor.rotation.y = 0;
    }

    keysPressed = {};
    lastHKeyTime = 0;
    lastBKeyTime = 0;

    updateHUD();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
