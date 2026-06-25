window.NeonSubway = (function() {
  'use strict';

  var scene;
  var camera;
  var environmentObjects = [];
  var lights = [];

  function init(s, c) {
    scene = s;
    camera = c;
    environmentObjects = [];
    lights = [];

    buildTunnelCorridor();
    buildTrackRails();
    buildWalls();
    buildPillars();
    buildTrainCars();
    buildBarricades();
    buildJunctionBoxes();
    buildSuspendedLights();
    buildSurveillanceCameras();
    buildFloorDetails();
  }

  function buildTunnelCorridor() {
    var material = new THREE.MeshStandardMaterial({
      color: 0x0a0a1a,
      roughness: 0.8,
      metalness: 0.2
    });
    var geometry = new THREE.BoxGeometry(15, 8, 80);
    var floor = new THREE.Mesh(geometry, material);
    floor.position.z = 0;
    floor.position.y = -4;
    scene.add(floor);
    environmentObjects.push(floor);
  }

  function buildTrackRails() {
    var material = new THREE.LineBasicMaterial({ color: 0xffff00 });

    for (var i = 0; i < 40; i++) {
      var z = -40 + (i * 2);

      var points1 = [
        new THREE.Vector3(-3, -3.8, z),
        new THREE.Vector3(-3, -3.8, z + 1.5)
      ];
      var geometry1 = new THREE.BufferGeometry().setFromPoints(points1);
      var line1 = new THREE.LineSegments(geometry1, material);
      scene.add(line1);
      environmentObjects.push(line1);

      var points2 = [
        new THREE.Vector3(3, -3.8, z),
        new THREE.Vector3(3, -3.8, z + 1.5)
      ];
      var geometry2 = new THREE.BufferGeometry().setFromPoints(points2);
      var line2 = new THREE.LineSegments(geometry2, material);
      scene.add(line2);
      environmentObjects.push(line2);
    }
  }

  function buildWalls() {
    var leftMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.4,
      roughness: 0.6,
      metalness: 0.3
    });
    var rightMaterial = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 0.4,
      roughness: 0.6,
      metalness: 0.3
    });

    for (var i = 0; i < 20; i++) {
      var z = -40 + (i * 4);

      var leftGeo = new THREE.BoxGeometry(0.5, 7, 3);
      var leftWall = new THREE.Mesh(leftGeo, leftMaterial);
      leftWall.position.set(-7.75, 0, z);
      scene.add(leftWall);
      environmentObjects.push(leftWall);

      var rightGeo = new THREE.BoxGeometry(0.5, 7, 3);
      var rightWall = new THREE.Mesh(rightGeo, rightMaterial);
      rightWall.position.set(7.75, 0, z);
      scene.add(rightWall);
      environmentObjects.push(rightWall);
    }
  }

  function buildPillars() {
    var pillarMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a3a,
      roughness: 0.7,
      metalness: 0.1
    });
    var stripMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.5
    });

    for (var i = 0; i < 10; i++) {
      var z = -35 + (i * 8);

      for (var x = -4; x <= 4; x += 8) {
        var geo = new THREE.CylinderGeometry(1.2, 1.2, 7, 8);
        var pillar = new THREE.Mesh(geo, pillarMaterial);
        pillar.position.set(x, 0, z);
        scene.add(pillar);
        environmentObjects.push(pillar);

        var stripGeo = new THREE.BoxGeometry(0.3, 7, 0.3);
        var strip = new THREE.Mesh(stripGeo, stripMaterial);
        strip.position.set(x + 0.6, 0, z);
        scene.add(strip);
        environmentObjects.push(strip);
      }
    }
  }

  function buildTrainCars() {
    var material = new THREE.MeshStandardMaterial({
      color: 0x222244,
      roughness: 0.5,
      metalness: 0.6
    });
    var windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x0099ff,
      emissive: 0x0099ff,
      emissiveIntensity: 0.6
    });

    for (var i = 0; i < 3; i++) {
      var z = -30 + (i * 20);
      var bodyGeo = new THREE.BoxGeometry(6, 4, 12);
      var body = new THREE.Mesh(bodyGeo, material);
      body.position.set(0, 1, z);
      scene.add(body);
      environmentObjects.push(body);

      for (var w = 0; w < 3; w++) {
        var winGeo = new THREE.BoxGeometry(1, 1.5, 0.2);
        var window = new THREE.Mesh(winGeo, windowMaterial);
        window.position.set(-2 + (w * 2), 2, z - 5);
        scene.add(window);
        environmentObjects.push(window);
      }
    }
  }

  function buildBarricades() {
    var crateMaterial = new THREE.MeshStandardMaterial({
      color: 0x664400,
      emissive: 0xff6600,
      emissiveIntensity: 0.2,
      roughness: 0.9,
      metalness: 0.1
    });

    var positions = [
      [-5, -2, -20],
      [-5, -1, -20],
      [5, -2, 10],
      [5, -1, 10],
      [-5, -2, 35],
      [5, -2, 35]
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var geo = new THREE.BoxGeometry(2, 2, 2);
      var crate = new THREE.Mesh(geo, crateMaterial);
      crate.position.set(pos[0], pos[1], pos[2]);
      scene.add(crate);
      environmentObjects.push(crate);
    }
  }

  function buildJunctionBoxes() {
    var boxMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      emissive: 0xff0000,
      emissiveIntensity: 0.3,
      roughness: 0.6,
      metalness: 0.4
    });

    var positions = [
      [-7.5, 2, -25],
      [7.5, 2, -10],
      [-7.5, 2, 15],
      [7.5, 2, 30]
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var geo = new THREE.BoxGeometry(1.2, 2, 0.4);
      var jbox = new THREE.Mesh(geo, boxMaterial);
      jbox.position.set(pos[0], pos[1], pos[2]);
      scene.add(jbox);
      environmentObjects.push(jbox);
    }
  }

  function buildSuspendedLights() {
    var cableMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    var sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.7
    });

    for (var i = 0; i < 6; i++) {
      var z = -30 + (i * 15);
      var x = (i % 2 === 0) ? -3 : 3;

      var cablePoints = [
        new THREE.Vector3(x, 3.5, z),
        new THREE.Vector3(x, -1, z)
      ];
      var cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
      var cable = new THREE.LineSegments(cableGeo, cableMaterial);
      scene.add(cable);
      environmentObjects.push(cable);

      var lightGeo = new THREE.SphereGeometry(0.5, 8, 8);
      var light = new THREE.Mesh(lightGeo, sphereMaterial);
      light.position.set(x, -1, z);
      scene.add(light);
      environmentObjects.push(light);

      var pointLight = new THREE.PointLight(0xffff00, 1.5, 12);
      pointLight.position.set(x, -1, z);
      scene.add(pointLight);
      lights.push(pointLight);
    }
  }

  function buildSurveillanceCameras() {
    var bracketMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.5,
      metalness: 0.7
    });
    var lensMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      emissive: 0xff0000,
      emissiveIntensity: 0.4
    });

    var positions = [
      [-7.5, 3, -30],
      [7.5, 3, 0],
      [-7.5, 3, 25]
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];

      var bracketGeo = new THREE.BoxGeometry(0.6, 0.8, 0.6);
      var bracket = new THREE.Mesh(bracketGeo, bracketMaterial);
      bracket.position.set(pos[0], pos[1], pos[2]);
      scene.add(bracket);
      environmentObjects.push(bracket);

      var lensGeo = new THREE.SphereGeometry(0.35, 6, 6);
      var lens = new THREE.Mesh(lensGeo, lensMaterial);
      lens.position.set(pos[0] - 0.4, pos[1], pos[2]);
      scene.add(lens);
      environmentObjects.push(lens);
    }
  }

  function buildFloorDetails() {
    var detailMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      emissive: 0x00ff88,
      emissiveIntensity: 0.15,
      roughness: 0.8,
      metalness: 0.2
    });

    for (var i = 0; i < 15; i++) {
      var z = -35 + (i * 5);
      var x = (i % 2 === 0) ? -2.5 : 2.5;
      var geo = new THREE.BoxGeometry(1.5, 0.3, 2);
      var tile = new THREE.Mesh(geo, detailMaterial);
      tile.position.set(x, -3.85, z);
      scene.add(tile);
      environmentObjects.push(tile);
    }
  }

  function update(delta) {
    for (var i = 0; i < lights.length; i++) {
      var intensity = 1.5 + Math.sin(Date.now() * 0.003 + i) * 0.5;
      lights[i].intensity = intensity;
    }
  }

  function reset() {
    for (var i = 0; i < environmentObjects.length; i++) {
      scene.remove(environmentObjects[i]);
    }
    for (var i = 0; i < lights.length; i++) {
      scene.remove(lights[i]);
    }
    environmentObjects = [];
    lights = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
