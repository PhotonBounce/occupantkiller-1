window.TrenchLine = (function() {
  'use strict';

  var scene, camera;
  var trenchObjects = [];
  var flares = [];

  function buildTrenchWalls() {
    var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
    var zigzagPositions = [
      { x: -20, z: 0 },
      { x: -15, z: 5 },
      { x: -10, z: 0 },
      { x: -5, z: 5 },
      { x: 0, z: 0 },
      { x: 5, z: 5 },
      { x: 10, z: 0 },
      { x: 15, z: 5 },
      { x: 20, z: 0 }
    ];

    for (var i = 0; i < zigzagPositions.length - 1; i++) {
      var pos = zigzagPositions[i];
      var nextPos = zigzagPositions[i + 1];
      var dx = nextPos.x - pos.x;
      var dz = nextPos.z - pos.z;
      var length = Math.sqrt(dx * dx + dz * dz);
      var angle = Math.atan2(dx, dz);

      var wallGeom = new THREE.BoxGeometry(1.2, 2.8, length);
      var wall = new THREE.Mesh(wallGeom, wallMaterial);
      wall.position.set(pos.x + dx / 2, 1.4, pos.z + dz / 2);
      wall.rotation.y = angle;
      scene.add(wall);
      trenchObjects.push(wall);
    }
  }

  function buildSandbags() {
    var bagMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
    var trenchLine = [
      { x: -18, z: 0 },
      { x: -8, z: 0 },
      { x: 2, z: 0 },
      { x: 12, z: 0 }
    ];

    for (var i = 0; i < trenchLine.length; i++) {
      var pos = trenchLine[i];
      for (var j = 0; j < 3; j++) {
        var bagGeom = new THREE.BoxGeometry(0.8, 0.4, 0.6);
        var bag = new THREE.Mesh(bagGeom, bagMaterial);
        bag.position.set(pos.x, 2.0 + j * 0.4, pos.z + (j - 1) * 0.3);
        scene.add(bag);
        trenchObjects.push(bag);
      }
    }
  }

  function buildDuckboards() {
    var boardMaterial = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
    var boardGeom = new THREE.BoxGeometry(20, 0.15, 1.4);
    var board = new THREE.Mesh(boardGeom, boardMaterial);
    board.position.set(0, 0.15, 0);
    scene.add(board);
    trenchObjects.push(board);
  }

  function buildPeriscopes() {
    var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7 });
    var positions = [
      { x: -15, z: 2 },
      { x: 5, z: -2 },
      { x: 15, z: 3 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var vertGeom = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8);
      var vert = new THREE.Mesh(vertGeom, pipeMaterial);
      vert.position.set(pos.x, 2.4, pos.z);
      scene.add(vert);
      trenchObjects.push(vert);

      var horizGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
      var horiz = new THREE.Mesh(horizGeom, pipeMaterial);
      horiz.rotation.z = Math.PI / 2;
      horiz.position.set(pos.x + 0.3, 3.6, pos.z);
      scene.add(horiz);
      trenchObjects.push(horiz);
    }
  }

  function buildBarbedWire() {
    var wireGeom = new THREE.BufferGeometry();
    var positions = [];
    var wirePatternX = [
      [-20, 0, 3.0], [-18, -1, 3.0], [-16, 0, 3.0], [-14, 1, 3.0],
      [0, 0, 3.2], [2, -1, 3.2], [4, 0, 3.2],
      [14, 0, 3.1], [16, -1, 3.1], [18, 0, 3.1], [20, 1, 3.1]
    ];

    for (var i = 0; i < wirePatternX.length; i++) {
      var pt = wirePatternX[i];
      positions.push(pt[0], pt[1], pt[2]);
      positions.push(pt[0] + 0.3, pt[1] + 0.2, pt[2]);
    }

    wireGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    var wireMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
    var wire = new THREE.LineSegments(wireGeom, wireMaterial);
    scene.add(wire);
    trenchObjects.push(wire);
  }

  function buildCraters() {
    var craterPositions = [
      { x: -12, z: -3 },
      { x: 8, z: 4 }
    ];

    for (var i = 0; i < craterPositions.length; i++) {
      var pos = craterPositions[i];
      var coneGeom = new THREE.ConeGeometry(2.5, 0.8, 16);
      var coneMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
      var cone = new THREE.Mesh(coneGeom, coneMaterial);
      cone.scale.y = -1;
      cone.position.set(pos.x, 0.4, pos.z);
      scene.add(cone);
      trenchObjects.push(cone);

      for (var j = 0; j < 4; j++) {
        var angle = (j / 4) * Math.PI * 2;
        var debrisGeom = new THREE.SphereGeometry(0.3, 4, 4);
        var debris = new THREE.Mesh(debrisGeom, coneMaterial);
        debris.position.set(
          pos.x + Math.cos(angle) * 1.5,
          0.5 + Math.random() * 0.3,
          pos.z + Math.sin(angle) * 1.5
        );
        scene.add(debris);
        trenchObjects.push(debris);
      }
    }
  }

  function buildDugouts() {
    var dugMaterial = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
    var dugoutPositions = [
      { x: -10, z: 1.5 },
      { x: 6, z: -1.5 }
    ];

    for (var i = 0; i < dugoutPositions.length; i++) {
      var pos = dugoutPositions[i];
      var dugGeom = new THREE.BoxGeometry(2.2, 1.8, 2.0);
      var dugout = new THREE.Mesh(dugGeom, dugMaterial);
      dugout.position.set(pos.x, 1.2, pos.z);
      scene.add(dugout);
      trenchObjects.push(dugout);
    }
  }

  function buildMortars() {
    var pitMaterial = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
    var barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x2c2c2c, metalness: 0.8 });
    var mortarPositions = [
      { x: -2, z: 0.5 },
      { x: 10, z: 1 }
    ];

    for (var i = 0; i < mortarPositions.length; i++) {
      var pos = mortarPositions[i];
      var pitGeom = new THREE.BoxGeometry(1.6, 0.8, 1.6);
      var pit = new THREE.Mesh(pitGeom, pitMaterial);
      pit.position.set(pos.x, 0.4, pos.z);
      scene.add(pit);
      trenchObjects.push(pit);

      var barrelGeom = new THREE.CylinderGeometry(0.15, 0.18, 0.7, 8);
      var barrel = new THREE.Mesh(barrelGeom, barrelMaterial);
      barrel.rotation.z = Math.PI / 3.5;
      barrel.position.set(pos.x, 1.2, pos.z);
      scene.add(barrel);
      trenchObjects.push(barrel);
    }
  }

  function buildFlares() {
    var flarePositions = [
      { x: -16, z: 2, intensity: 1.0 },
      { x: 0, z: -2, intensity: 0.9 },
      { x: 14, z: 3, intensity: 0.95 }
    ];

    for (var i = 0; i < flarePositions.length; i++) {
      var pos = flarePositions[i];
      var flareLight = new THREE.PointLight(0xffffaa, pos.intensity, 25);
      flareLight.position.set(pos.x, 3.5, pos.z);
      scene.add(flareLight);

      var flareGeom = new THREE.SphereGeometry(0.25, 8, 8);
      var flareMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa });
      var flareMesh = new THREE.Mesh(flareGeom, flareMaterial);
      flareMesh.position.copy(flareLight.position);
      scene.add(flareMesh);

      flares.push({
        light: flareLight,
        mesh: flareMesh,
        originalIntensity: pos.intensity,
        phase: Math.random() * Math.PI * 2
      });
      trenchObjects.push(flareMesh);
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    trenchObjects = [];
    flares = [];

    buildTrenchWalls();
    buildSandbags();
    buildDuckboards();
    buildPeriscopes();
    buildBarbedWire();
    buildCraters();
    buildDugouts();
    buildMortars();
    buildFlares();

    var ambientLight = new THREE.AmbientLight(0xcccccc, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(15, 8, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
  }

  function update(delta) {
    for (var i = 0; i < flares.length; i++) {
      var flare = flares[i];
      flare.phase += delta * 2.5;
      var flicker = 0.8 + Math.sin(flare.phase) * 0.2;
      flare.light.intensity = flare.originalIntensity * flicker;
    }
  }

  function reset() {
    for (var i = 0; i < trenchObjects.length; i++) {
      scene.remove(trenchObjects[i]);
    }
    for (var j = 0; j < flares.length; j++) {
      scene.remove(flares[j].light);
      scene.remove(flares[j].mesh);
    }
    trenchObjects = [];
    flares = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
