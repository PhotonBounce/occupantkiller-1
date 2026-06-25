window.AbandonedMall = (function() {
  'use strict';

  var scene, camera;
  var gameState = {
    gangsDown: 0,
    evidenceRecovered: 0,
    hostagesFreed: 0,
    hudVisible: false,
    lastAKeyTime: null
  };

  var sceneObjects = [];
  var enemies = [];
  var lights = [];
  var materials = [];
  var geometries = [];

  function createMaterial(color, emissive, emissiveIntensity) {
    var mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || 0x000000,
      emissiveIntensity: emissiveIntensity || 0,
      roughness: 0.8,
      metalness: 0.2
    });
    materials.push(mat);
    return mat;
  }

  function createGeometry(geom) {
    geometries.push(geom);
    return geom;
  }

  function addSceneObject(mesh) {
    sceneObjects.push(mesh);
    scene.add(mesh);
    return mesh;
  }

  function createMallFloor() {
    var geom = createGeometry(new THREE.BoxGeometry(200, 1, 150));
    var mat = createMaterial(0x666666);
    var floor = new THREE.Mesh(geom, mat);
    floor.position.set(0, -0.5, 0);
    floor.receiveShadow = true;
    addSceneObject(floor);
  }

  function createStoreFacades() {
    var storePositions = [
      { x: -80, z: 20 },
      { x: -80, z: -30 },
      { x: 0, z: 50 },
      { x: 80, z: 20 },
      { x: 80, z: -30 },
      { x: 40, z: -60 }
    ];

    storePositions.forEach(function(pos) {
      var geom = createGeometry(new THREE.BoxGeometry(30, 40, 15));
      var mat = createMaterial(0x333333);
      var facade = new THREE.Mesh(geom, mat);
      facade.position.set(pos.x, 20, pos.z);
      addSceneObject(facade);

      var glassGeom = createGeometry(new THREE.BufferGeometry());
      var glassVertices = new Float32Array([
        -12, 5, 7.5,
        12, 5, 7.5,
        12, -15, 7.5,
        -12, -15, 7.5,
        -8, 3, 7.5,
        8, 3, 7.5,
        8, -12, 7.5,
        -8, -12, 7.5
      ]);
      glassGeom.setAttribute('position', new THREE.BufferAttribute(glassVertices, 3));
      var glassLines = new THREE.LineSegments(glassGeom, new THREE.LineBasicMaterial({ color: 0x0088ff }));
      glassLines.position.copy(facade.position);
      addSceneObject(glassLines);
    });
  }

  function createCollapsedCeiling() {
    var geom = createGeometry(new THREE.BoxGeometry(40, 8, 30));
    var mat = createMaterial(0x444444);
    var debris = new THREE.Mesh(geom, mat);
    debris.position.set(-50, 35, -40);
    debris.rotation.set(0.3, 0.2, -0.15);
    addSceneObject(debris);
  }

  function createEscalatorFrame() {
    var geom = createGeometry(new THREE.BoxGeometry(20, 35, 10));
    var mat = createMaterial(0x555555);
    var frame = new THREE.Mesh(geom, mat);
    frame.position.set(20, 17.5, 30);
    addSceneObject(frame);

    var stepsGeom = createGeometry(new THREE.BufferGeometry());
    var stepsVertices = new Float32Array([
      -8, -15, 2, 8, -15, 2,
      -8, -10, 2, 8, -10, 2,
      -8, -5, 2, 8, -5, 2,
      -8, 0, 2, 8, 0, 2,
      -8, 5, 2, 8, 5, 2
    ]);
    stepsGeom.setAttribute('position', new THREE.BufferAttribute(stepsVertices, 3));
    var stepsLines = new THREE.LineSegments(stepsGeom, new THREE.LineBasicMaterial({ color: 0x888888 }));
    stepsLines.position.copy(frame.position);
    addSceneObject(stepsLines);
  }

  function createFoodCourtTables() {
    for (var i = 0; i < 8; i++) {
      var x = (i % 4) * 20 - 30;
      var z = Math.floor(i / 4) * 25 - 15;

      var tableGeom = createGeometry(new THREE.BoxGeometry(15, 1, 15));
      var tableMat = createMaterial(0x999999);
      var table = new THREE.Mesh(tableGeom, tableMat);
      table.position.set(x, 5, z);
      addSceneObject(table);

      var stoolGeom = createGeometry(new THREE.CylinderGeometry(2, 2, 4, 8));
      var stoolMat = createMaterial(0x444444);
      var stool = new THREE.Mesh(stoolGeom, stoolMat);
      stool.position.set(x - 5, 2, z - 5);
      addSceneObject(stool);
    }
  }

  function createOvergrownPlanter() {
    var plantGeom = createGeometry(new THREE.BoxGeometry(20, 8, 20));
    var plantMat = createMaterial(0x5a4a3a);
    var planter = new THREE.Mesh(plantGeom, plantMat);
    planter.position.set(60, 4, 5);
    addSceneObject(planter);

    var foliageGeom = createGeometry(new THREE.SphereGeometry(12, 8, 8));
    var foliageMat = createMaterial(0x228833);
    var foliage = new THREE.Mesh(foliageGeom, foliageMat);
    foliage.position.set(60, 18, 5);
    addSceneObject(foliage);

    var coneGeom = createGeometry(new THREE.ConeGeometry(10, 15, 8));
    var coneMat = createMaterial(0x2a5a2a);
    var cone = new THREE.Mesh(coneGeom, coneMat);
    cone.position.set(60, 20, 5);
    addSceneObject(cone);
  }

  function createGangBarricade() {
    for (var i = 0; i < 5; i++) {
      var boxGeom = createGeometry(new THREE.BoxGeometry(15, 8, 8));
      var boxMat = createMaterial(0x333333);
      var box = new THREE.Mesh(boxGeom, boxMat);
      box.position.set(-60, 4 + i * 8, -20);
      box.rotation.z = Math.random() * 0.3;
      addSceneObject(box);
    }

    var cartGeom = createGeometry(new THREE.BufferGeometry());
    var cartVertices = new Float32Array([
      -3, 0, -3, 3, 0, -3,
      -3, 5, -3, 3, 5, -3,
      -3, 0, 3, 3, 0, 3,
      -3, 5, 3, 3, 5, 3
    ]);
    cartGeom.setAttribute('position', new THREE.BufferAttribute(cartVertices, 3));
    var cartLines = new THREE.LineSegments(cartGeom, new THREE.LineBasicMaterial({ color: 0x999999 }));
    cartLines.position.set(-60, 15, -20);
    addSceneObject(cartLines);
  }

  function createATMMachine() {
    var atmGeom = createGeometry(new THREE.BoxGeometry(8, 15, 4));
    var atmMat = createMaterial(0x111111, 0xff0000, 0.3);
    var atm = new THREE.Mesh(atmGeom, atmMat);
    atm.position.set(0, 7.5, -50);
    addSceneObject(atm);
  }

  function createSkylightGrate() {
    var gateGeom = createGeometry(new THREE.BufferGeometry());
    var gateVertices = [];
    for (var i = -50; i <= 50; i += 20) {
      for (var j = -40; j <= 40; j += 20) {
        gateVertices.push(i, 45, j);
        gateVertices.push(i + 15, 45, j);
        gateVertices.push(i, 45, j);
        gateVertices.push(i, 45, j + 15);
      }
    }
    gateGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gateVertices), 3));
    var gateLines = new THREE.LineSegments(gateGeom, new THREE.LineBasicMaterial({ color: 0x555555 }));
    addSceneObject(gateLines);
  }

  function createAbandonedVehicle() {
    var carGeom = createGeometry(new THREE.BoxGeometry(12, 8, 20));
    var carMat = createMaterial(0x332211);
    var car = new THREE.Mesh(carGeom, carMat);
    car.position.set(70, 4, 40);
    car.rotation.z = 0.2;
    addSceneObject(car);

    var wheelGeom = createGeometry(new THREE.CylinderGeometry(3, 3, 2, 16));
    var wheelMat = createMaterial(0x222222);
    for (var i = 0; i < 2; i++) {
      var wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.position.set(70 + (i === 0 ? -5 : 5), 3, 40 + 8);
      addSceneObject(wheel);
    }
  }

  function createFlickeringLight() {
    var lightGeom = createGeometry(new THREE.SphereGeometry(3, 8, 8));
    var lightMat = createMaterial(0xffff00, 0xffff00, 0.8);
    var lightMesh = new THREE.Mesh(lightGeom, lightMat);
    lightMesh.position.set(-30, 40, 0);
    lightMesh.userData.isFlickeringLight = true;
    addSceneObject(lightMesh);

    var light = new THREE.PointLight(0xffff00, 0.8, 100);
    light.position.copy(lightMesh.position);
    lights.push(light);
    scene.add(light);
  }

  function createWaterDamagePool() {
    var poolGeom = createGeometry(new THREE.BoxGeometry(30, 0.5, 25));
    var poolMat = createMaterial(0x1a4d5a, 0x0066ff, 0.1);
    var pool = new THREE.Mesh(poolGeom, poolMat);
    pool.position.set(30, 1.5, -35);
    pool.userData.isWaterPool = true;
    addSceneObject(pool);
  }

  function createGraffitiWall() {
    for (var i = 0; i < 4; i++) {
      var grafGeom = createGeometry(new THREE.BoxGeometry(25, 12, 2));
      var grafMat = createMaterial(0x1a1a1a, 0xff0000, 0.4);
      var graf = new THREE.Mesh(grafGeom, grafMat);
      graf.position.set(-40 + i * 50, 25, -65);
      graf.userData.isGraffiti = true;
      graf.userData.colorIndex = i;
      addSceneObject(graf);
    }
  }

  function createSurveillanceCamera() {
    var cameraColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
    for (var i = 0; i < 5; i++) {
      var poleGeom = createGeometry(new THREE.CylinderGeometry(1.5, 1.5, 30, 8));
      var poleMat = createMaterial(0x333333);
      var pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.set(-60 + i * 30, 15, 50);
      addSceneObject(pole);

      var camGeom = createGeometry(new THREE.BoxGeometry(4, 4, 6));
      var camMat = createMaterial(0x111111, cameraColors[i], 0.5);
      var cam = new THREE.Mesh(camGeom, camMat);
      cam.position.set(-60 + i * 30, 35, 50);
      addSceneObject(cam);
    }
  }

  function createGangMembers() {
    for (var i = 0; i < 6; i++) {
      var x = -80 + i * 35;
      var z = Math.sin(i) * 30;

      var bodyGeom = createGeometry(new THREE.BoxGeometry(4, 8, 4));
      var bodyMat = createMaterial(0x222222);
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.set(x, 4, z);

      var headGeom = createGeometry(new THREE.SphereGeometry(2.5, 8, 8));
      var headMat = createMaterial(0x8b7355);
      var head = new THREE.Mesh(headGeom, headMat);
      head.position.set(x, 10, z);

      var enemy = new THREE.Group();
      enemy.add(body);
      enemy.add(head);
      enemy.position.set(x, 0, z);
      enemy.userData.health = 1;
      enemy.userData.patrol = {
        speed: 0.05,
        direction: i % 2 === 0 ? 1 : -1
      };

      addSceneObject(enemy);
      enemies.push(enemy);
    }
  }

  function createShoppingCarts() {
    for (var i = 0; i < 3; i++) {
      var cartGeom = createGeometry(new THREE.BufferGeometry());
      var cartVerts = new Float32Array([
        -4, 0, -6, 4, 0, -6,
        -4, 8, -6, 4, 8, -6,
        -4, 0, 6, 4, 0, 6,
        -4, 8, 6, 4, 8, 6,
        -4, 0, -6, -4, 8, -6,
        4, 0, -6, 4, 8, -6
      ]);
      cartGeom.setAttribute('position', new THREE.BufferAttribute(cartVerts, 3));
      var cartLines = new THREE.LineSegments(cartGeom, new THREE.LineBasicMaterial({ color: 0xcccccc }));
      cartLines.position.set(-40 + i * 25, 2, 35);
      addSceneObject(cartLines);
    }
  }

  function createBrokenFountain() {
    var basinGeom = createGeometry(new THREE.CylinderGeometry(15, 18, 3, 16));
    var basinMat = createMaterial(0x888888);
    var basin = new THREE.Mesh(basinGeom, basinMat);
    basin.position.set(-20, 1.5, 0);
    addSceneObject(basin);
  }

  function setupHUD() {
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    canvas.id = 'game-hud-canvas';
    canvas.style.position = 'absolute';
    canvas.style.top = '20px';
    canvas.style.left = '20px';
    canvas.style.fontFamily = 'monospace';
    canvas.style.fontSize = '16px';
    canvas.style.color = '#00ff00';
    canvas.style.display = 'none';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    document.addEventListener('keydown', function(e) {
      if (e.key === 'a' || e.key === 'A') {
        var now = Date.now();
        if (gameState.lastAKeyTime && now - gameState.lastAKeyTime < 400) {
          gameState.hudVisible = !gameState.hudVisible;
          canvas.style.display = gameState.hudVisible ? 'block' : 'none';
          gameState.lastAKeyTime = null;
        } else {
          gameState.lastAKeyTime = now;
        }
      }
      if (e.key === 'm' || e.key === 'M') {
        gameState.lastAKeyTime = null;
      }
    });
  }

  function updateHUD() {
    var canvas = document.getElementById('game-hud-canvas');
    if (!canvas || !gameState.hudVisible) return;

    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00ff00';
    ctx.fillText('GANG MEMBERS DOWN: ' + gameState.gangsDown + '/6', 20, 40);
    ctx.fillText('EVIDENCE RECOVERED: ' + gameState.evidenceRecovered + '/3', 20, 80);
    ctx.fillText('HOSTAGES FREED: ' + gameState.hostagesFreed + '/2', 20, 120);
  }

  function updateAnimations(delta) {
    var time = performance.now() * 0.001;

    for (var i = 0; i < sceneObjects.length; i++) {
      var obj = sceneObjects[i];
      if (obj.userData.isFlickeringLight) {
        var flicker = 0.4 + Math.sin(time * 8) * 0.6;
        obj.material.emissiveIntensity = flicker;
        if (lights.length > 0) {
          lights[0].intensity = flicker * 1.0;
        }
      }
      if (obj.userData.isWaterPool) {
        obj.position.y = 1.5 + Math.sin(time * 2) * 0.1;
      }
      if (obj.userData.isGraffiti) {
        var colorShift = 0.2 + Math.sin(time * 0.5 + obj.userData.colorIndex) * 0.8;
        obj.material.emissiveIntensity = colorShift;
      }
    }

    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      var patrol = enemy.userData.patrol;
      enemy.position.x += patrol.speed * patrol.direction;
      if (enemy.position.x > 80 || enemy.position.x < -100) {
        patrol.direction *= -1;
      }
    }

    var debris = sceneObjects[2];
    if (debris) {
      debris.rotation.x += 0.001;
      debris.rotation.y += 0.0005;
    }
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    createMallFloor();
    createStoreFacades();
    createCollapsedCeiling();
    createEscalatorFrame();
    createFoodCourtTables();
    createOvergrownPlanter();
    createGangBarricade();
    createATMMachine();
    createSkylightGrate();
    createAbandonedVehicle();
    createFlickeringLight();
    createWaterDamagePool();
    createGraffitiWall();
    createSurveillanceCamera();
    createGangMembers();
    createShoppingCarts();
    createBrokenFountain();

    setupHUD();

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);
    lights.push(directionalLight);
  }

  function update(delta) {
    updateAnimations(delta);
    updateHUD();
  }

  function reset() {
    for (var i = 0; i < sceneObjects.length; i++) {
      var obj = sceneObjects[i];
      scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(m) { m.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
    }

    for (var i = 0; i < lights.length; i++) {
      scene.remove(lights[i]);
    }

    for (var i = 0; i < geometries.length; i++) {
      geometries[i].dispose();
    }

    for (var i = 0; i < materials.length; i++) {
      materials[i].dispose();
    }

    sceneObjects = [];
    enemies = [];
    lights = [];
    materials = [];
    geometries = [];

    gameState.gangsDown = 0;
    gameState.evidenceRecovered = 0;
    gameState.hostagesFreed = 0;
    gameState.hudVisible = false;
    gameState.lastAKeyTime = null;

    var hudCanvas = document.getElementById('game-hud-canvas');
    if (hudCanvas) {
      hudCanvas.remove();
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
