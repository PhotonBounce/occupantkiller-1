window.WarDome = (function() {
  'use strict';

  var scene;
  var camera;
  var objects = [];
  var lights = [];
  var animatedElements = [];
  var time = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    lights = [];
    animatedElements = [];
    time = 0;

    buildDomeStructure();
    buildBleachers();
    buildPlayingField();
    buildCommandPost();
    buildBreachedSections();
    buildTankTracks();
    buildSniperBoxes();
    buildArmory();
    buildLighting();
  }

  function buildDomeStructure() {
    var domeColor = 0x666666;
    var arcRadius = 25;
    var segmentWidth = 3;
    var segmentHeight = 2;

    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI;
      var x = Math.cos(angle) * arcRadius;
      var z = Math.sin(angle) * arcRadius;
      var y = 15 + Math.sin(angle) * 8;

      var segmentGeometry = new THREE.BoxGeometry(segmentWidth, segmentHeight, 2);
      var segmentMaterial = new THREE.MeshLambertMaterial({ color: domeColor });
      var segment = new THREE.Mesh(segmentGeometry, segmentMaterial);

      segment.position.set(x, y, z);
      segment.rotation.y = angle;
      scene.add(segment);
      objects.push(segment);
    }

    for (var j = 0; j < 8; j++) {
      var ringRadius = 20 - (j * 1.5);
      var ringY = 15 + (j * 0.5);
      var ringSegments = 16;

      for (var k = 0; k < ringSegments; k++) {
        var ringAngle = (k / ringSegments) * Math.PI * 2;
        var ringX = Math.cos(ringAngle) * ringRadius;
        var ringZ = Math.sin(ringAngle) * ringRadius;

        var ringGeometry = new THREE.BoxGeometry(2.5, 1.5, 2.5);
        var ringMaterial = new THREE.MeshLambertMaterial({ color: domeColor });
        var ringElement = new THREE.Mesh(ringGeometry, ringMaterial);

        ringElement.position.set(ringX, ringY, ringZ);
        scene.add(ringElement);
        objects.push(ringElement);
      }
    }
  }

  function buildBleachers() {
    var bleacherColor = 0x444444;
    var bleacherLevelCount = 6;
    var seatsPerRow = 8;

    for (var level = 0; level < bleacherLevelCount; level++) {
      var baseY = 2 + (level * 2.5);
      var radius = 15 - (level * 1.2);

      for (var seat = 0; seat < seatsPerRow; seat++) {
        var angle = (seat / seatsPerRow) * Math.PI * 2;
        var seatX = Math.cos(angle) * radius;
        var seatZ = Math.sin(angle) * radius;

        var seatGeometry = new THREE.BoxGeometry(1.2, 0.5, 1.2);
        var seatMaterial = new THREE.MeshLambertMaterial({ color: bleacherColor });
        var seatMesh = new THREE.Mesh(seatGeometry, seatMaterial);

        seatMesh.position.set(seatX, baseY, seatZ);
        seatMesh.rotation.z = Math.random() * 0.3 - 0.15;
        scene.add(seatMesh);
        objects.push(seatMesh);
      }

      if (level < bleacherLevelCount - 1) {
        var supportGeometry = new THREE.BoxGeometry(2, 0.3, 30);
        var supportMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var support = new THREE.Mesh(supportGeometry, supportMaterial);

        support.position.set(0, baseY - 1.2, 0);
        scene.add(support);
        objects.push(support);
      }
    }
  }

  function buildPlayingField() {
    var fieldGeometry = new THREE.BoxGeometry(40, 0.2, 50);
    var fieldMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
    var field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    field.position.set(0, 0.1, 0);
    scene.add(field);
    objects.push(field);

    var sandbagRows = 5;
    var sanbagsPerRow = 12;

    for (var row = 0; row < sandbagRows; row++) {
      var rowZ = -15 + (row * 6);

      for (var bag = 0; bag < sanbagsPerRow; bag++) {
        var bagX = -20 + (bag * 3.5);
        var bagGeometry = new THREE.BoxGeometry(1.2, 0.8, 2.5);
        var bagMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var sandbag = new THREE.Mesh(bagGeometry, bagMaterial);

        sandbag.position.set(bagX, 0.4, rowZ);
        sandbag.rotation.z = Math.random() * 0.2;
        scene.add(sandbag);
        objects.push(sandbag);
      }
    }

    var trenchCount = 4;
    for (var t = 0; t < trenchCount; t++) {
      var trenchZ = -10 + (t * 10);
      var trenchGeometry = new THREE.BoxGeometry(35, 1.5, 2);
      var trenchMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      var trench = new THREE.Mesh(trenchGeometry, trenchMaterial);

      trench.position.set(0, 0.75, trenchZ);
      scene.add(trench);
      objects.push(trench);
    }
  }

  function buildCommandPost() {
    var postGeometry = new THREE.BoxGeometry(12, 6, 8);
    var postMaterial = new THREE.MeshLambertMaterial({ color: 0x2d2d2d });
    var post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(-15, 3, 20);
    scene.add(post);
    objects.push(post);

    var roofGeometry = new THREE.ConeGeometry(8, 3, 4);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-15, 9, 20);
    scene.add(roof);
    objects.push(roof);

    var scoreboardGeometry = new THREE.BoxGeometry(10, 5, 0.5);
    var scoreboardMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var scoreboard = new THREE.Mesh(scoreboardGeometry, scoreboardMaterial);
    scoreboard.position.set(-15, 7, 24.5);
    scene.add(scoreboard);
    objects.push(scoreboard);

    animatedElements.push({
      mesh: scoreboard,
      type: 'scoreboard',
      sparkTime: 0
    });

    var antennaGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
    var antennaMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(-15, 14, 20);
    scene.add(antenna);
    objects.push(antenna);

    for (var w = 0; w < 6; w++) {
      var windowGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.2);
      var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
      var windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);

      var windowX = -18 + (w % 3) * 3.5;
      var windowY = 5 + Math.floor(w / 3) * 2.5;
      windowMesh.position.set(windowX, windowY, 23.5);
      scene.add(windowMesh);
      objects.push(windowMesh);
    }
  }

  function buildBreachedSections() {
    var breachCount = 3;

    for (var b = 0; b < breachCount; b++) {
      var breachAngle = (b / breachCount) * Math.PI * 2;
      var breachRadius = 28;
      var breachX = Math.cos(breachAngle) * breachRadius;
      var breachZ = Math.sin(breachAngle) * breachRadius;

      var breachGeometry = new THREE.BoxGeometry(8, 12, 1);
      var breachMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var breachEdge = new THREE.Mesh(breachGeometry, breachMaterial);

      breachEdge.position.set(breachX, 8, breachZ);
      breachEdge.rotation.y = breachAngle;
      scene.add(breachEdge);
      objects.push(breachEdge);

      var beamGeometry = new THREE.CylinderGeometry(0.5, 3, 25, 6);
      var beamMaterial = new THREE.MeshLambertMaterial({
        color: 0xffff99,
        emissive: 0xffff00,
        emissiveIntensity: 0.3
      });
      var lightBeam = new THREE.Mesh(beamGeometry, beamMaterial);

      lightBeam.position.set(breachX, 10, breachZ);
      lightBeam.rotation.y = breachAngle;
      scene.add(lightBeam);
      objects.push(lightBeam);

      animatedElements.push({
        mesh: lightBeam,
        type: 'lightbeam',
        baseAngle: breachAngle,
        rotationIndex: b
      });

      for (var r = 0; r < 5; r++) {
        var rubleGeometry = new THREE.BoxGeometry(
          2 + Math.random() * 2,
          1.5 + Math.random() * 1.5,
          2 + Math.random() * 2
        );
        var rubleMaterial = new THREE.MeshLambertMaterial({
          color: 0x555555 + Math.floor(Math.random() * 0x111111)
        });
        var rubble = new THREE.Mesh(rubleGeometry, rubleMaterial);

        rubble.position.set(
          breachX + (Math.random() - 0.5) * 6,
          0.5 + Math.random() * 1.5,
          breachZ + (Math.random() - 0.5) * 6
        );
        rubble.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        scene.add(rubble);
        objects.push(rubble);
      }
    }
  }

  function buildTankTracks() {
    var tankX = 10;
    var tankZ = -15;
    var tankBaseY = 0.2;

    var hullGeometry = new THREE.BoxGeometry(6, 3, 10);
    var hullMaterial = new THREE.MeshLambertMaterial({ color: 0x3d5a3d });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.set(tankX, tankBaseY + 1.5, tankZ);
    scene.add(hull);
    objects.push(hull);

    var turretGeometry = new THREE.CylinderGeometry(2.2, 2.5, 2, 8);
    var turretMaterial = new THREE.MeshLambertMaterial({ color: 0x4a6a4a });
    var turret = new THREE.Mesh(turretGeometry, turretMaterial);
    turret.position.set(tankX, tankBaseY + 3.5, tankZ);
    scene.add(turret);
    objects.push(turret);

    animatedElements.push({
      mesh: turret,
      type: 'tankturret',
      baseY: tankBaseY + 3.5
    });

    var barrelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
    var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(tankX + 3, tankBaseY + 3.8, tankZ);
    barrel.rotation.z = Math.PI / 8;
    scene.add(barrel);
    objects.push(barrel);

    animatedElements.push({
      mesh: barrel,
      type: 'tankbarrel',
      basePosition: new THREE.Vector3(tankX + 3, tankBaseY + 3.8, tankZ)
    });

    for (var t = 0; t < 4; t++) {
      var trackGeometry = new THREE.BoxGeometry(1.2, 0.6, 10);
      var trackMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      var track = new THREE.Mesh(trackGeometry, trackMaterial);

      var trackX = tankX + (t < 2 ? -3.5 : 3.5);
      var trackY = tankBaseY + 0.3;
      var trackZ = tankZ + (t % 2 === 0 ? -2 : 2);

      track.position.set(trackX, trackY, trackZ);
      scene.add(track);
      objects.push(track);
    }

    for (var w = 0; w < 6; w++) {
      var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 8);
      var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);

      var wheelZ = tankZ - 3.5 + (w * 1.3);
      wheel.position.set(tankX - 3, tankBaseY + 0.8, wheelZ);
      wheel.rotation.x = Math.PI / 2;
      scene.add(wheel);
      objects.push(wheel);

      var wheel2 = wheel.clone();
      wheel2.position.set(tankX + 3, tankBaseY + 0.8, wheelZ);
      scene.add(wheel2);
      objects.push(wheel2);
    }

    var crateredGeometry = new THREE.BoxGeometry(15, 0.5, 15);
    var crateredMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var cratered = new THREE.Mesh(crateredGeometry, crateredMaterial);
    cratered.position.set(tankX, 0.25, tankZ);
    scene.add(cratered);
    objects.push(cratered);
  }

  function buildSniperBoxes() {
    var boxCount = 4;

    for (var i = 0; i < boxCount; i++) {
      var angle = (i / boxCount) * Math.PI * 2;
      var radius = 24;
      var boxX = Math.cos(angle) * radius;
      var boxZ = Math.sin(angle) * radius;

      var boxGeometry = new THREE.BoxGeometry(5, 3, 5);
      var boxMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
      var box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.set(boxX, 11, boxZ);
      box.rotation.y = angle;
      scene.add(box);
      objects.push(box);

      var glassGeometry = new THREE.BoxGeometry(4.5, 2.5, 0.2);
      var glassMaterial = new THREE.MeshLambertMaterial({
        color: 0x3a7a9e,
        emissive: 0x1a4a6e,
        emissiveIntensity: 0.1
      });
      var glass = new THREE.Mesh(glassGeometry, glassMaterial);
      glass.position.set(boxX + Math.cos(angle) * 2.5, 11.5, boxZ + Math.sin(angle) * 2.5);
      glass.rotation.y = angle;
      scene.add(glass);
      objects.push(glass);

      for (var s = 0; s < 3; s++) {
        var supportGeometry = new THREE.CylinderGeometry(0.4, 0.6, 8, 6);
        var supportMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var support = new THREE.Mesh(supportGeometry, supportMaterial);

        var supportAngle = angle + (s * Math.PI / 1.5);
        support.position.set(
          boxX + Math.cos(supportAngle) * 2,
          5.5,
          boxZ + Math.sin(supportAngle) * 2
        );
        scene.add(support);
        objects.push(support);
      }
    }
  }

  function buildArmory() {
    var armoryGeometry = new THREE.BoxGeometry(10, 4, 8);
    var armoryMaterial = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });
    var armory = new THREE.Mesh(armoryGeometry, armoryMaterial);
    armory.position.set(15, 2, -20);
    scene.add(armory);
    objects.push(armory);

    var doorGeometry = new THREE.BoxGeometry(2.5, 3, 0.3);
    var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(15, 1.5, -23.5);
    scene.add(door);
    objects.push(door);

    for (var w = 0; w < 4; w++) {
      var weaponRackGeometry = new THREE.BoxGeometry(0.5, 3, 2);
      var weaponRackMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
      var rack = new THREE.Mesh(weaponRackGeometry, weaponRackMaterial);

      var rackX = 12 + (w % 2) * 5;
      var rackZ = -22 + Math.floor(w / 2) * 3;
      rack.position.set(rackX, 1.5, rackZ);
      scene.add(rack);
      objects.push(rack);

      for (var gun = 0; gun < 3; gun++) {
        var gunGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2, 4);
        var gunMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var gunMesh = new THREE.Mesh(gunGeometry, gunMaterial);

        gunMesh.position.set(rackX, 0.8 + (gun * 0.8), rackZ);
        gunMesh.rotation.z = Math.PI / 4;
        scene.add(gunMesh);
        objects.push(gunMesh);
      }
    }

    for (var a = 0; a < 8; a++) {
      var ammoCrateGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
      var ammoCrateMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a2a });
      var ammoCrate = new THREE.Mesh(ammoCrateGeometry, ammoCrateMaterial);

      ammoCrate.position.set(
        12 + Math.random() * 4,
        0.5 + (Math.floor(a / 4) * 1.2),
        -18 + Math.random() * 4
      );
      scene.add(ammoCrate);
      objects.push(ammoCrate);
    }
  }

  function buildLighting() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(20, 30, 20);
    scene.add(directionalLight);
    lights.push(directionalLight);

    var commandPostLight = new THREE.PointLight(0xffaa00, 1.5, 20);
    commandPostLight.position.set(-15, 7, 20);
    scene.add(commandPostLight);
    lights.push(commandPostLight);

    var tanklightGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    var tanklightMaterial = new THREE.MeshLambertMaterial({
      color: 0xffff99,
      emissive: 0xffff00
    });
    var tanklight = new THREE.Mesh(tanklightGeometry, tanklightMaterial);
    tanklight.position.set(13, 5, -15);
    scene.add(tanklight);
    objects.push(tanklight);

    var tankpointLight = new THREE.PointLight(0xffff99, 1, 15);
    tankpointLight.position.set(13, 5, -15);
    scene.add(tankpointLight);
    lights.push(tankpointLight);

    for (var c = 0; c < 3; c++) {
      var cornerLight = new THREE.PointLight(0xdddddd, 0.8, 30);
      cornerLight.position.set(
        (c % 2 === 0 ? -1 : 1) * 25,
        15,
        (Math.floor(c / 2) === 0 ? -1 : 1) * 30
      );
      scene.add(cornerLight);
      lights.push(cornerLight);
    }
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < animatedElements.length; i++) {
      var elem = animatedElements[i];

      if (elem.type === 'scoreboard') {
        elem.sparkTime += delta;
        if (elem.sparkTime > 0.1) {
          elem.mesh.material.emissive.setHex(Math.random() > 0.5 ? 0xff4400 : 0x000000);
          elem.sparkTime = 0;
        }
      }

      if (elem.type === 'lightbeam') {
        var beamRotation = elem.baseAngle + Math.sin(time * 0.5 + elem.rotationIndex) * 0.4;
        elem.mesh.rotation.y = beamRotation;
        elem.mesh.scale.y = 0.8 + Math.sin(time * 1.5 + elem.rotationIndex) * 0.3;
      }

      if (elem.type === 'tankturret') {
        elem.mesh.rotation.y = Math.sin(time * 0.6) * 1.2;
      }

      if (elem.type === 'tankbarrel') {
        var barrelPitch = Math.sin(time * 0.5) * 0.5 + Math.PI / 8;
        elem.mesh.position.copy(elem.basePosition);
        elem.mesh.rotation.z = barrelPitch;
      }
    }
  }

  function reset() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (var j = lights.length - 1; j >= 0; j--) {
      scene.remove(lights[j]);
    }
    lights = [];

    animatedElements = [];
    time = 0;
    scene = null;
    camera = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
})();
