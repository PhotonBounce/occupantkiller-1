window.SportsStadium = (function() {
  'use strict';

  var scene;
  var camera;
  var stadiumObjects = [];
  var scoreboard = null;
  var floodlights = [];
  var banners = [];
  var locker = null;
  var broadcast = null;
  var speakers = [];
  var time = 0;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    stadiumObjects = [];
    scoreboard = null;
    floodlights = [];
    banners = [];
    locker = null;
    broadcast = null;
    speakers = [];
    time = 0;

    // 1. SEATING BOWL - concentric rings of tiers
    var tier1 = createTier(50, 10, 0xFF8800, 0);
    scene.add(tier1);
    stadiumObjects.push(tier1);

    var tier2 = createTier(65, 12, 0x334488, 5);
    scene.add(tier2);
    stadiumObjects.push(tier2);

    var tier3 = createTier(80, 14, 0x334488, 10);
    scene.add(tier3);
    stadiumObjects.push(tier3);

    var tier4 = createTier(95, 16, 0x334488, 15);
    scene.add(tier4);
    stadiumObjects.push(tier4);

    // 2. CENTER FIELD GRASS
    var grassGeom = new THREE.CylinderGeometry(40, 40, 0.5, 64);
    var grassMat = new THREE.MeshPhongMaterial({ color: 0x228822 });
    var grassField = new THREE.Mesh(grassGeom, grassMat);
    grassField.position.y = 0;
    grassField.receiveShadow = true;
    scene.add(grassField);
    stadiumObjects.push(grassField);

    // 3. FIELD WHITE LINE MARKINGS
    var lines = createFieldLines();
    scene.add(lines);
    stadiumObjects.push(lines);

    // 4. SCOREBOARD TOWER
    scoreboard = createScoreboard();
    scene.add(scoreboard);
    stadiumObjects.push(scoreboard);

    // 5. FOUR CORNER FLOODLIGHT POLES
    var poles = [
      { x: 50, z: 50 },
      { x: -50, z: 50 },
      { x: 50, z: -50 },
      { x: -50, z: -50 }
    ];
    for (var i = 0; i < poles.length; i++) {
      var pole = createFloodlight(poles[i].x, poles[i].z);
      scene.add(pole.group);
      stadiumObjects.push(pole.group);
      floodlights.push(pole);
    }

    // 6. VIP BOX SECTIONS - elevated boxes on one side
    var vipBox = createVIPBox();
    scene.add(vipBox);
    stadiumObjects.push(vipBox);

    // 7. GOAL POST STRUCTURES - both ends
    var goalPost1 = createGoalPost(0, 0, 45);
    scene.add(goalPost1);
    stadiumObjects.push(goalPost1);

    var goalPost2 = createGoalPost(0, 0, -45);
    scene.add(goalPost2);
    stadiumObjects.push(goalPost2);

    // 8. CONCOURSE CORRIDOR UNDER STANDS
    var concourse = createConcourse();
    scene.add(concourse);
    stadiumObjects.push(concourse);

    // 9. LOCKER ROOM TUNNEL ENTRANCE
    locker = createLockerTunnel();
    scene.add(locker);
    stadiumObjects.push(locker);

    // 10. PROPAGANDA BANNER PANELS
    banners = createBanners();
    for (var j = 0; j < banners.length; j++) {
      scene.add(banners[j].mesh);
      stadiumObjects.push(banners[j].mesh);
    }

    // 11. MEDIA BROADCAST BOOTH
    broadcast = createBroadcastBooth();
    scene.add(broadcast);
    stadiumObjects.push(broadcast);

    // 12. FIELD-LEVEL SECURITY BARRIERS
    var barriers = createSecurityBarriers();
    scene.add(barriers);
    stadiumObjects.push(barriers);

    // 13. SPEAKER TOWERS
    speakers = createSpeakers();
    for (var k = 0; k < speakers.length; k++) {
      scene.add(speakers[k].group);
      stadiumObjects.push(speakers[k].group);
    }

    // 14. EQUIPMENT STORAGE SHED
    var shed = createStorageShed();
    scene.add(shed);
    stadiumObjects.push(shed);

    return stadiumObjects;
  }

  function createTier(radius, height, color, yOffset) {
    var group = new THREE.Group();

    // Outer ring
    var outerGeom = new THREE.CylinderGeometry(radius, radius, height, 32);
    var tierMat = new THREE.MeshPhongMaterial({ color: color });
    var tier = new THREE.Mesh(outerGeom, tierMat);
    tier.position.y = yOffset;
    tier.castShadow = true;
    tier.receiveShadow = true;
    group.add(tier);

    // Seat rows (simple boxes to represent seating)
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var x = Math.cos(angle) * (radius - 5);
      var z = Math.sin(angle) * (radius - 5);

      var seatGeom = new THREE.BoxGeometry(3, 2, 2);
      var seatMat = new THREE.MeshPhongMaterial({ color: 0xAAAAAA });
      var seat = new THREE.Mesh(seatGeom, seatMat);
      seat.position.set(x, yOffset + height / 2, z);
      seat.castShadow = true;
      group.add(seat);
    }

    return group;
  }

  function createFieldLines() {
    var group = new THREE.Group();
    var material = new THREE.LineBasicMaterial({ color: 0xFFFFFF, linewidth: 2 });

    // Center line
    var centerGeom = new THREE.BufferGeometry();
    centerGeom.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array([
        -40, 0.1, 0,
        40, 0.1, 0
      ]), 3
    ));
    var centerLine = new THREE.LineSegments(centerGeom, material);
    group.add(centerLine);

    // End zone lines
    var endGeom1 = new THREE.BufferGeometry();
    endGeom1.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array([
        -40, 0.1, 38,
        40, 0.1, 38
      ]), 3
    ));
    var endLine1 = new THREE.LineSegments(endGeom1, material);
    group.add(endLine1);

    var endGeom2 = new THREE.BufferGeometry();
    endGeom2.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array([
        -40, 0.1, -38,
        40, 0.1, -38
      ]), 3
    ));
    var endLine2 = new THREE.LineSegments(endGeom2, material);
    group.add(endLine2);

    // Side lines
    var sideGeom1 = new THREE.BufferGeometry();
    sideGeom1.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array([
        -38, 0.1, -40,
        -38, 0.1, 40
      ]), 3
    ));
    var sideLine1 = new THREE.LineSegments(sideGeom1, material);
    group.add(sideLine1);

    var sideGeom2 = new THREE.BufferGeometry();
    sideGeom2.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array([
        38, 0.1, -40,
        38, 0.1, 40
      ]), 3
    ));
    var sideLine2 = new THREE.LineSegments(sideGeom2, material);
    group.add(sideLine2);

    return group;
  }

  function createScoreboard() {
    var group = new THREE.Group();
    group.position.set(0, 20, -60);

    // Main tower pole
    var poleGeom = new THREE.CylinderGeometry(2, 2, 30, 16);
    var poleMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var pole = new THREE.Mesh(poleGeom, poleMat);
    pole.castShadow = true;
    group.add(pole);

    // Display panel frame
    var frameGeom = new THREE.BoxGeometry(20, 12, 1);
    var frameMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    var frame = new THREE.Mesh(frameGeom, frameMat);
    frame.position.y = 8;
    frame.castShadow = true;
    group.add(frame);

    // Display panels (3x2 grid of panels)
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 2; j++) {
        var panelGeom = new THREE.BoxGeometry(6, 5, 0.5);
        var panelMat = new THREE.MeshPhongMaterial({ color: 0xFFDD00, emissive: 0x444400 });
        var panel = new THREE.Mesh(panelGeom, panelMat);
        panel.position.set(-8 + i * 8, 5 + j * 6, 1);
        panel.userData.isPanel = true;
        panel.castShadow = true;
        group.add(panel);
      }
    }

    // Scoreboard roof
    var roofGeom = new THREE.ConeGeometry(12, 3, 8);
    var roofMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = 15;
    roof.castShadow = true;
    group.add(roof);

    group.userData.scoreboardGroup = true;
    return group;
  }

  function createFloodlight(x, z) {
    var group = new THREE.Group();
    group.position.set(x, 0, z);

    // Pole
    var poleGeom = new THREE.CylinderGeometry(1.5, 1.5, 40, 12);
    var poleMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.y = 20;
    pole.castShadow = true;
    group.add(pole);

    // Lamp cluster (multiple spheres)
    var lamp1 = new THREE.Mesh(
      new THREE.SphereGeometry(2, 8, 8),
      new THREE.MeshPhongMaterial({ color: 0xFFFF00, emissive: 0xFF8800 })
    );
    lamp1.position.y = 42;
    lamp1.castShadow = true;
    group.add(lamp1);

    var lamp2 = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 8, 8),
      new THREE.MeshPhongMaterial({ color: 0xFFDD00, emissive: 0xFF6600 })
    );
    lamp2.position.set(2, 43, 0);
    lamp2.castShadow = true;
    group.add(lamp2);

    var lamp3 = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 8, 8),
      new THREE.MeshPhongMaterial({ color: 0xFFDD00, emissive: 0xFF6600 })
    );
    lamp3.position.set(-2, 43, 0);
    lamp3.castShadow = true;
    group.add(lamp3);

    return { group: group, lamps: [lamp1, lamp2, lamp3] };
  }

  function createVIPBox() {
    var group = new THREE.Group();
    group.position.set(0, 15, 75);

    // Box structure
    var boxGeom = new THREE.BoxGeometry(30, 8, 10);
    var boxMat = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    var box = new THREE.Mesh(boxGeom, boxMat);
    box.castShadow = true;
    box.receiveShadow = true;
    group.add(box);

    // Interior seating (3 rows)
    for (var row = 0; row < 3; row++) {
      for (var seat = 0; seat < 6; seat++) {
        var seatGeom = new THREE.BoxGeometry(2, 1.5, 2);
        var seatMat = new THREE.MeshPhongMaterial({ color: 0xEEDD99 });
        var seatMesh = new THREE.Mesh(seatGeom, seatMat);
        seatMesh.position.set(-10 + seat * 3.5, -2 + row * 2.5, 0);
        seatMesh.castShadow = true;
        group.add(seatMesh);
      }
    }

    // Balcony railing
    var railGeom = new THREE.BoxGeometry(32, 1, 0.5);
    var railMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var rail = new THREE.Mesh(railGeom, railMat);
    rail.position.y = 4.5;
    rail.position.z = 5.5;
    rail.castShadow = true;
    group.add(rail);

    return group;
  }

  function createGoalPost(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Vertical supports
    var vertGeom = new THREE.CylinderGeometry(0.5, 0.5, 15, 8);
    var vertMat = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });

    var leftPost = new THREE.Mesh(vertGeom, vertMat);
    leftPost.position.set(-9, 7.5, 0);
    leftPost.castShadow = true;
    group.add(leftPost);

    var rightPost = new THREE.Mesh(vertGeom, vertMat);
    rightPost.position.set(9, 7.5, 0);
    rightPost.castShadow = true;
    group.add(rightPost);

    // Horizontal crossbar
    var crossGeom = new THREE.CylinderGeometry(0.4, 0.4, 18, 8);
    var crossbar = new THREE.Mesh(crossGeom, vertMat);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.y = 15;
    crossbar.castShadow = true;
    group.add(crossbar);

    // Netting (simple representation with lines)
    var netMat = new THREE.LineBasicMaterial({ color: 0xCCCCCC });
    var netGeom = new THREE.BufferGeometry();
    var netPoints = [];
    for (var i = 0; i < 10; i++) {
      netPoints.push(new THREE.Vector3(-8 + i * 1.8, 15, 0));
      netPoints.push(new THREE.Vector3(-8 + i * 1.8, 0, 0));
    }
    netGeom.setFromPoints(netPoints);
    var net = new THREE.LineSegments(netGeom, netMat);
    group.add(net);

    return group;
  }

  function createConcourse() {
    var group = new THREE.Group();
    group.position.set(0, -5, 0);

    // Tunnel floor
    var floorGeom = new THREE.BoxGeometry(100, 1, 20);
    var floorMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var floor = new THREE.Mesh(floorGeom, floorMat);
    floor.castShadow = true;
    floor.receiveShadow = true;
    group.add(floor);

    // Support pillars along tunnel
    for (var i = -40; i <= 40; i += 20) {
      var pillarGeom = new THREE.CylinderGeometry(3, 3, 8, 12);
      var pillarMat = new THREE.MeshPhongMaterial({ color: 0x777777 });
      var pillar = new THREE.Mesh(pillarGeom, pillarMat);
      pillar.position.set(i, 4, 0);
      pillar.castShadow = true;
      group.add(pillar);
    }

    // Tunnel walls
    var wallGeom = new THREE.BoxGeometry(100, 8, 1);
    var wallMat = new THREE.MeshPhongMaterial({ color: 0x666666 });

    var wall1 = new THREE.Mesh(wallGeom, wallMat);
    wall1.position.z = 10.5;
    wall1.castShadow = true;
    group.add(wall1);

    var wall2 = new THREE.Mesh(wallGeom, wallMat);
    wall2.position.z = -10.5;
    wall2.castShadow = true;
    group.add(wall2);

    return group;
  }

  function createLockerTunnel() {
    var group = new THREE.Group();
    group.position.set(55, -3, 0);

    // Tunnel entrance structure
    var entranceGeom = new THREE.BoxGeometry(6, 10, 4);
    var entranceMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var entrance = new THREE.Mesh(entranceGeom, entranceMat);
    entrance.castShadow = true;
    group.add(entrance);

    // Door frame
    var doorGeom = new THREE.BoxGeometry(4, 8, 0.5);
    var doorMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var door = new THREE.Mesh(doorGeom, doorMat);
    door.position.z = 2.5;
    door.castShadow = true;
    group.add(door);

    // Light inside tunnel (blinking effect)
    var lightGeom = new THREE.SphereGeometry(1, 8, 8);
    var lightMat = new THREE.MeshPhongMaterial({ color: 0xFF6600, emissive: 0xFF3300 });
    var light = new THREE.Mesh(lightGeom, lightMat);
    light.position.set(0, 2, -5);
    light.castShadow = true;
    group.add(light);
    group.userData.lockerLight = light;

    return group;
  }

  function createBanners() {
    var bannerList = [];

    // Propaganda banner 1
    var banner1Geom = new THREE.BoxGeometry(15, 8, 0.3);
    var banner1Mat = new THREE.MeshPhongMaterial({ color: 0xFF0000, emissive: 0x990000 });
    var banner1 = new THREE.Mesh(banner1Geom, banner1Mat);
    banner1.position.set(-70, 25, 0);
    banner1.castShadow = true;
    bannerList.push({ mesh: banner1, axis: 'y', speed: 1.5 });

    // Propaganda banner 2
    var banner2Geom = new THREE.BoxGeometry(15, 8, 0.3);
    var banner2Mat = new THREE.MeshPhongMaterial({ color: 0xFF0000, emissive: 0x990000 });
    var banner2 = new THREE.Mesh(banner2Geom, banner2Mat);
    banner2.position.set(70, 25, 0);
    banner2.castShadow = true;
    bannerList.push({ mesh: banner2, axis: 'y', speed: 1.2 });

    // Propaganda banner 3
    var banner3Geom = new THREE.BoxGeometry(8, 15, 0.3);
    var banner3Mat = new THREE.MeshPhongMaterial({ color: 0xFF0000, emissive: 0x990000 });
    var banner3 = new THREE.Mesh(banner3Geom, banner3Mat);
    banner3.position.set(0, 28, -70);
    banner3.castShadow = true;
    bannerList.push({ mesh: banner3, axis: 'x', speed: 1.8 });

    // Propaganda banner 4
    var banner4Geom = new THREE.BoxGeometry(8, 15, 0.3);
    var banner4Mat = new THREE.MeshPhongMaterial({ color: 0xFF0000, emissive: 0x990000 });
    var banner4 = new THREE.Mesh(banner4Geom, banner4Mat);
    banner4.position.set(0, 28, 70);
    banner4.castShadow = true;
    bannerList.push({ mesh: banner4, axis: 'x', speed: 1.5 });

    return bannerList;
  }

  function createBroadcastBooth() {
    var group = new THREE.Group();
    group.position.set(-60, 20, 0);

    // Booth structure
    var boothGeom = new THREE.BoxGeometry(8, 10, 8);
    var boothMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var booth = new THREE.Mesh(boothGeom, boothMat);
    booth.castShadow = true;
    group.add(booth);

    // Screen/window
    var screenGeom = new THREE.BoxGeometry(6, 6, 0.5);
    var screenMat = new THREE.MeshPhongMaterial({ color: 0x001133, emissive: 0x0033FF });
    var screen = new THREE.Mesh(screenGeom, screenMat);
    screen.position.set(0, 1, 4.5);
    screen.castShadow = true;
    group.add(screen);
    group.userData.broadcastScreen = screen;

    // Antenna
    var antennaGeom = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
    var antennaMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var antenna = new THREE.Mesh(antennaGeom, antennaMat);
    antenna.position.set(3, 8, 0);
    antenna.castShadow = true;
    group.add(antenna);

    return group;
  }

  function createSecurityBarriers() {
    var group = new THREE.Group();

    // Barrier sections around field perimeter
    var positions = [
      { x: 0, z: 42 },
      { x: 0, z: -42 },
      { x: 42, z: 0 },
      { x: -42, z: 0 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var barrierGeom = new THREE.BoxGeometry(15, 2, 1);
      var barrierMat = new THREE.MeshPhongMaterial({ color: 0xFFFF00 });
      var barrier = new THREE.Mesh(barrierGeom, barrierMat);
      barrier.position.set(positions[i].x, 1, positions[i].z);
      barrier.castShadow = true;
      group.add(barrier);
    }

    return group;
  }

  function createSpeakers() {
    var speakerList = [];

    var positions = [
      { x: 35, z: 35 },
      { x: -35, z: 35 },
      { x: 35, z: -35 },
      { x: -35, z: -35 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var group = new THREE.Group();
      group.position.set(positions[i].x, 18, positions[i].z);

      // Speaker tower
      var towerGeom = new THREE.CylinderGeometry(2, 2.5, 6, 12);
      var towerMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
      var tower = new THREE.Mesh(towerGeom, towerMat);
      tower.castShadow = true;
      group.add(tower);

      // Speaker cones (3 stacked)
      for (var j = 0; j < 3; j++) {
        var coneGeom = new THREE.ConeGeometry(1.5, 1.2, 8);
        var coneMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
        var cone = new THREE.Mesh(coneGeom, coneMat);
        cone.position.y = -1 + j * 1.8;
        cone.castShadow = true;
        group.add(cone);
      }

      speakerList.push({ group: group, tower: tower });
    }

    return speakerList;
  }

  function createStorageShed() {
    var group = new THREE.Group();
    group.position.set(-75, 0, 0);

    // Shed main structure
    var shedGeom = new THREE.BoxGeometry(12, 8, 10);
    var shedMat = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    var shed = new THREE.Mesh(shedGeom, shedMat);
    shed.castShadow = true;
    shed.receiveShadow = true;
    group.add(shed);

    // Roof
    var roofGeom = new THREE.ConeGeometry(8, 4, 4);
    var roofMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = 6;
    roof.castShadow = true;
    group.add(roof);

    // Door
    var doorGeom = new THREE.BoxGeometry(4, 6, 0.3);
    var doorMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var door = new THREE.Mesh(doorGeom, doorMat);
    door.position.set(0, 0, 5.3);
    door.castShadow = true;
    group.add(door);

    // Storage crates inside (visible through window)
    for (var i = 0; i < 4; i++) {
      var crateGeom = new THREE.BoxGeometry(2, 2, 2);
      var crateMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
      var crate = new THREE.Mesh(crateGeom, crateMat);
      crate.position.set(-3 + i * 2, 1, -2);
      crate.castShadow = true;
      group.add(crate);
    }

    return group;
  }

  function update(delta) {
    time += delta;

    // Scoreboard panels cycling colors
    if (scoreboard) {
      var panels = scoreboard.children;
      for (var i = 0; i < panels.length; i++) {
        if (panels[i].userData.isPanel) {
          var hue = (time * 0.5 + i * 0.3) % 1;
          var color = new THREE.Color();
          color.setHSL(hue, 1, 0.6);
          panels[i].material.color.copy(color);
        }
      }
    }

    // Floodlights flickering to life
    for (var j = 0; j < floodlights.length; j++) {
      var floodlight = floodlights[j];
      var brightness = 0.3 + 0.7 * Math.sin(time * 2 + j * 0.5);
      for (var k = 0; k < floodlight.lamps.length; k++) {
        var lamp = floodlight.lamps[k];
        lamp.material.emissiveIntensity = brightness;
      }
    }

    // Banner flags waving
    for (var b = 0; b < banners.length; b++) {
      var banner = banners[b];
      var wave = Math.sin(time * banner.speed + b) * 0.3;
      if (banner.axis === 'y') {
        banner.mesh.rotation.z = wave;
      } else {
        banner.mesh.rotation.x = wave;
      }
    }

    // Locker room tunnel light blinking
    if (locker && locker.userData.lockerLight) {
      var lockerLight = locker.userData.lockerLight;
      var blink = Math.abs(Math.sin(time * 3)) > 0.5 ? 1 : 0.2;
      lockerLight.material.emissiveIntensity = blink;
    }

    // Broadcast booth screen pulsing
    if (broadcast && broadcast.userData.broadcastScreen) {
      var screen = broadcast.userData.broadcastScreen;
      var pulse = 0.5 + 0.5 * Math.sin(time * 2.5);
      screen.material.emissiveIntensity = pulse;
    }

    // Speaker towers vibrating
    for (var s = 0; s < speakers.length; s++) {
      var speaker = speakers[s];
      var vibration = Math.sin(time * 5 + s * 0.7) * 0.15;
      speaker.group.position.y = 18 + vibration;
    }
  }

  function reset() {
    for (var i = 0; i < stadiumObjects.length; i++) {
      scene.remove(stadiumObjects[i]);
    }
    stadiumObjects = [];
    scoreboard = null;
    floodlights = [];
    banners = [];
    locker = null;
    broadcast = null;
    speakers = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
