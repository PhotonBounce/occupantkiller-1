window.BloodChapel = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var environmentObjects = [];
  var particles = [];

  function createWalls() {
    var wallHeight = 8;
    var wallThickness = 0.5;
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.8 });

    var northWall = new THREE.Mesh(new THREE.BoxGeometry(20, wallHeight, wallThickness), wallMaterial);
    northWall.position.set(0, wallHeight / 2, -10);
    scene.add(northWall);
    environmentObjects.push(northWall);

    var southWall = new THREE.Mesh(new THREE.BoxGeometry(20, wallHeight, wallThickness), wallMaterial);
    southWall.position.set(0, wallHeight / 2, 10);
    scene.add(southWall);
    environmentObjects.push(southWall);

    var eastWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, 20), wallMaterial);
    eastWall.position.set(10, wallHeight / 2, 0);
    scene.add(eastWall);
    environmentObjects.push(eastWall);

    var westWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, 20), wallMaterial);
    westWall.position.set(-10, wallHeight / 2, 0);
    scene.add(westWall);
    environmentObjects.push(westWall);
  }

  function createMetalGrates() {
    var grateColor = 0x1a1a1a;
    var grateLineWidth = 0.1;

    var northGrate = createGratePanel(20, 6, grateLineWidth, grateColor);
    northGrate.position.set(0, 6, -9.75);
    scene.add(northGrate);
    environmentObjects.push(northGrate);

    var southGrate = createGratePanel(20, 6, grateLineWidth, grateColor);
    southGrate.position.set(0, 6, 9.75);
    scene.add(southGrate);
    environmentObjects.push(southGrate);
  }

  function createGratePanel(width, height, lineWidth, color) {
    var geometry = new THREE.BufferGeometry();
    var points = [];
    var spacing = 0.8;

    for (var x = -width / 2; x <= width / 2; x += spacing) {
      points.push(x, 0, 0);
      points.push(x, height, 0);
    }

    for (var y = 0; y <= height; y += spacing) {
      points.push(-width / 2, y, 0);
      points.push(width / 2, y, 0);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));

    var material = new THREE.LineBasicMaterial({ color: color, linewidth: lineWidth });
    var grate = new THREE.LineSegments(geometry, material);
    return grate;
  }

  function createAltar() {
    var altarMaterial = new THREE.MeshStandardMaterial({ color: 0x4a0000, roughness: 0.7, metalness: 0.2 });
    var altarGeometry = new THREE.BoxGeometry(4, 2, 6);
    var altar = new THREE.Mesh(altarGeometry, altarMaterial);
    altar.position.set(0, 1, 0);
    scene.add(altar);
    environmentObjects.push(altar);
  }

  function createIronMaidens() {
    var maidenMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.8 });

    var maidenPositions = [[-5, 0, -6], [5, 0, -6], [-5, 0, 6], [5, 0, 6]];

    for (var i = 0; i < maidenPositions.length; i++) {
      var pos = maidenPositions[i];

      var bodyGeom = new THREE.CylinderGeometry(1, 1, 3, 8);
      var body = new THREE.Mesh(bodyGeom, maidenMaterial);
      body.position.set(pos[0], pos[1] + 1.5, pos[2]);
      scene.add(body);
      environmentObjects.push(body);

      for (var s = 0; s < 6; s++) {
        var angle = (s / 6) * Math.PI * 2;
        var spikeX = pos[0] + Math.cos(angle) * 1.1;
        var spikeZ = pos[2] + Math.sin(angle) * 1.1;

        var spikeGeom = new THREE.ConeGeometry(0.15, 1.2, 8);
        var spike = new THREE.Mesh(spikeGeom, maidenMaterial);
        spike.position.set(spikeX, pos[1] + 1.5, spikeZ);
        spike.rotation.z = Math.random() * 0.3;
        scene.add(spike);
        environmentObjects.push(spike);
      }
    }
  }

  function createCandelabras() {
    var candelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 });
    var flameMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300 });

    var candlePositions = [[-6, 4, -5], [6, 4, -5], [-6, 4, 5], [6, 4, 5], [0, 5, 0]];

    for (var c = 0; c < candlePositions.length; c++) {
      var cpos = candlePositions[c];

      var baseGeom = new THREE.CylinderGeometry(0.4, 0.5, 0.3, 8);
      var base = new THREE.Mesh(baseGeom, candelMaterial);
      base.position.set(cpos[0], cpos[1], cpos[2]);
      scene.add(base);
      environmentObjects.push(base);

      for (var f = 0; f < 4; f++) {
        var flameX = cpos[0] + (Math.random() - 0.5) * 0.6;
        var flameY = cpos[1] + 0.5 + Math.random() * 0.5;
        var flameZ = cpos[2] + (Math.random() - 0.5) * 0.6;

        var flameGeom = new THREE.ConeGeometry(0.2, 0.8, 4);
        var flame = new THREE.Mesh(flameGeom, flameMaterial);
        flame.position.set(flameX, flameY, flameZ);
        scene.add(flame);
        environmentObjects.push(flame);
      }
    }
  }

  function createCeilingArches() {
    var archMaterial = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.8 });
    var archHeight = 7;

    var archGeom = new THREE.CylinderGeometry(3, 3, 0.6, 12, 1, true);
    var arch1 = new THREE.Mesh(archGeom, archMaterial);
    arch1.position.set(-5, archHeight, 0);
    arch1.rotation.z = Math.PI / 2;
    scene.add(arch1);
    environmentObjects.push(arch1);

    var arch2 = new THREE.Mesh(archGeom, archMaterial);
    arch2.position.set(5, archHeight, 0);
    arch2.rotation.z = Math.PI / 2;
    scene.add(arch2);
    environmentObjects.push(arch2);

    createChains(-5, 6, 0);
    createChains(5, 6, 0);
  }

  function createChains(x, y, z) {
    var chainColor = 0x1a1a1a;
    var chainGeometry = new THREE.BufferGeometry();
    var positions = [];

    var linkCount = 8;
    for (var l = 0; l < linkCount; l++) {
      var yOffset = y - (l * 0.6);
      positions.push(x, yOffset, z);
      positions.push(x + 0.05, yOffset - 0.3, z);
    }

    chainGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    var chainMaterial = new THREE.LineBasicMaterial({ color: chainColor, linewidth: 2 });
    var chain = new THREE.LineSegments(chainGeometry, chainMaterial);
    scene.add(chain);
    environmentObjects.push(chain);
  }

  function createBloodMoat() {
    var moatMaterial = new THREE.MeshStandardMaterial({ color: 0x660000, roughness: 0.6, metalness: 0.3 });

    var moatGeom = new THREE.CylinderGeometry(5.5, 5.5, 0.4, 32);
    var moat = new THREE.Mesh(moatGeom, moatMaterial);
    moat.position.set(0, 0.1, 0);
    scene.add(moat);
    environmentObjects.push(moat);

    var wallGeom = new THREE.CylinderGeometry(5.3, 5.5, 0.8, 32);
    var wall = new THREE.Mesh(wallGeom, moatMaterial);
    wall.position.set(0, 0.4, 0);
    scene.add(wall);
    environmentObjects.push(wall);
  }

  function createFloor() {
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });

    var floorGeom = new THREE.CylinderGeometry(12, 12, 0.2, 32);
    var floor = new THREE.Mesh(floorGeom, floorMaterial);
    floor.position.set(0, 0, 0);
    scene.add(floor);
    environmentObjects.push(floor);
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    createFloor();
    createWalls();
    createMetalGrates();
    createAltar();
    createIronMaidens();
    createCandelabras();
    createCeilingArches();
    createBloodMoat();

    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 30, 50);

    var ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    var dirLight = new THREE.DirectionalLight(0x992222, 0.6);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    var pointLight = new THREE.PointLight(0xff5500, 0.8, 15);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);
  }

  function update(delta) {
    for (var i = 0; i < environmentObjects.length; i++) {
      var obj = environmentObjects[i];
      if (obj.geometry instanceof THREE.ConeGeometry) {
        obj.rotation.y += delta * 0.5;
        obj.position.y += Math.sin(Date.now() * 0.001 + i) * delta * 0.1;
      }
    }
  }

  function reset() {
    for (var i = environmentObjects.length - 1; i >= 0; i--) {
      scene.remove(environmentObjects[i]);
    }
    environmentObjects = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
