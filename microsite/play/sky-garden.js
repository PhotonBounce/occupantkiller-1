var SkyGarden = (function() {
  'use strict';

  var scene;
  var camera;
  var gameObjects = [];
  var wind = { angle: 0, speed: 0.02 };
  var particles = [];

  function buildPlanters() {
    var container = new THREE.Group();
    var plantColors = [0x2ecc71, 0x27ae60, 0x16a085, 0x229954, 0x1e8449];

    for (var i = 0; i < 8; i++) {
      var baseGeometry = new THREE.BoxGeometry(6, 1.5, 6);
      var baseMaterial = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
      var base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.set(
        Math.cos(i * Math.PI / 4) * 40,
        5,
        Math.sin(i * Math.PI / 4) * 40
      );
      container.add(base);

      var plantGeometry = new THREE.SphereGeometry(2.5, 8, 8);
      var plantMaterial = new THREE.MeshPhongMaterial({
        color: plantColors[i % plantColors.length]
      });
      var plant = new THREE.Mesh(plantGeometry, plantMaterial);
      plant.position.copy(base.position);
      plant.position.y += 3;
      plant.scale.set(1, 1.3, 1);
      container.add(plant);

      var flowerGeometry = new THREE.ConeGeometry(1.2, 2.5, 6);
      var flowerMaterial = new THREE.MeshPhongMaterial({ color: 0xff69b4 });
      var flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
      flower.position.copy(plant.position);
      flower.position.y += 2.8;
      container.add(flower);
    }

    return container;
  }

  function buildGreenhouses() {
    var container = new THREE.Group();

    for (var i = 0; i < 4; i++) {
      var domeGeometry = new THREE.SphereGeometry(12, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      var domeMaterial = new THREE.MeshPhongMaterial({
        color: 0x87ceeb,
        transparent: true,
        opacity: 0.15,
        wireframe: false
      });
      var dome = new THREE.Mesh(domeGeometry, domeMaterial);
      dome.position.set(
        Math.cos(i * Math.PI / 2 + 0.5) * 50,
        8,
        Math.sin(i * Math.PI / 2 + 0.5) * 50
      );
      container.add(dome);

      var wireGeometry = new THREE.SphereGeometry(12, 12, 12);
      var wireEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(wireGeometry),
        new THREE.LineBasicMaterial({ color: 0x00ff7f, linewidth: 2 })
      );
      wireEdges.position.copy(dome.position);
      container.add(wireEdges);
    }

    return container;
  }

  function buildWalkways() {
    var container = new THREE.Group();
    var walkwayMaterial = new THREE.MeshPhongMaterial({ color: 0xc0c0c0 });

    for (var i = 0; i < 6; i++) {
      var angle = i * Math.PI / 3;
      var length = 80;
      var x = Math.cos(angle) * length / 2;
      var z = Math.sin(angle) * length / 2;

      var walkGeometry = new THREE.BoxGeometry(4, 0.8, length);
      var walk = new THREE.Mesh(walkGeometry, walkwayMaterial);
      walk.position.set(x, 3.5, z);
      walk.rotation.z = angle;
      container.add(walk);

      var railGeometry = new THREE.CylinderGeometry(0.2, 0.2, length, 8);
      var railMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 });
      var rail = new THREE.Mesh(railGeometry, railMaterial);
      rail.position.set(x, 4.5, z);
      rail.rotation.z = angle;
      container.add(rail);
    }

    return container;
  }

  function buildPools() {
    var container = new THREE.Group();

    for (var i = 0; i < 3; i++) {
      var poolGeometry = new THREE.CylinderGeometry(8, 9, 1.5, 12);
      var poolMaterial = new THREE.MeshPhongMaterial({
        color: 0x1e90ff,
        emissive: 0x003d7a,
        shininess: 60
      });
      var pool = new THREE.Mesh(poolGeometry, poolMaterial);
      pool.position.set(
        -30 + i * 25,
        2.2,
        -35
      );
      container.add(pool);

      var rimGeometry = new THREE.CylinderGeometry(9.2, 9.2, 0.3, 12);
      var rimMaterial = new THREE.MeshPhongMaterial({ color: 0xd3d3d3 });
      var rim = new THREE.Mesh(rimGeometry, rimMaterial);
      rim.position.copy(pool.position);
      rim.position.y += 1;
      container.add(rim);
    }

    return container;
  }

  function buildTurbines() {
    var container = new THREE.Group();

    for (var i = 0; i < 5; i++) {
      var baseGeometry = new THREE.CylinderGeometry(1.5, 2, 4, 8);
      var baseMaterial = new THREE.MeshPhongMaterial({ color: 0x2f4f4f });
      var base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.set(
        -60 + i * 30,
        6,
        60
      );
      base.userData.turbineGroup = container;
      container.add(base);

      var nacelle = new THREE.Group();
      var nacelleGeometry = new THREE.BoxGeometry(2, 1.5, 3);
      var nacelleMaterial = new THREE.MeshPhongMaterial({ color: 0x708090 });
      var nacelleBody = new THREE.Mesh(nacelleGeometry, nacelleMaterial);
      nacelleBody.position.z = 1.5;
      nacelle.add(nacelleBody);

      for (var j = 0; j < 3; j++) {
        var bladeGeometry = new THREE.BoxGeometry(0.4, 4, 0.2);
        var bladeMaterial = new THREE.MeshPhongMaterial({ color: 0xf5f5f5 });
        var blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.position.z = 2;
        blade.rotation.z = j * Math.PI * 2 / 3;
        nacelle.add(blade);
      }

      nacelle.position.copy(base.position);
      nacelle.position.y += 5;
      nacelle.userData.rotationSpeed = 0.02;
      container.add(nacelle);
    }

    return container;
  }

  function buildDefenses() {
    var container = new THREE.Group();

    for (var i = 0; i < 4; i++) {
      var gunGeometry = new THREE.CylinderGeometry(0.8, 1.2, 3, 6);
      var gunMaterial = new THREE.MeshPhongMaterial({ color: 0x556b2f });
      var gun = new THREE.Mesh(gunGeometry, gunMaterial);
      gun.position.set(
        Math.cos(i * Math.PI / 2) * 65,
        5,
        Math.sin(i * Math.PI / 2) * 65
      );
      gun.rotation.z = 0.3;
      container.add(gun);

      var barrelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 6);
      var barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
      var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.position.copy(gun.position);
      barrel.position.y += 1.5;
      barrel.rotation.z = 0.3;
      container.add(barrel);

      var mountGeometry = new THREE.BoxGeometry(3, 0.5, 3);
      var mountMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
      var mount = new THREE.Mesh(mountGeometry, mountMaterial);
      mount.position.copy(gun.position);
      mount.position.y -= 3;
      container.add(mount);
    }

    return container;
  }

  function buildEnvironment() {
    var root = new THREE.Group();

    var planters = buildPlanters();
    root.add(planters);
    gameObjects.push(planters);

    var greenhouses = buildGreenhouses();
    root.add(greenhouses);
    gameObjects.push(greenhouses);

    var walkways = buildWalkways();
    root.add(walkways);
    gameObjects.push(walkways);

    var pools = buildPools();
    root.add(pools);
    gameObjects.push(pools);

    var turbines = buildTurbines();
    root.add(turbines);
    gameObjects.push(turbines);

    var defenses = buildDefenses();
    root.add(defenses);
    gameObjects.push(defenses);

    var platformGeometry = new THREE.CylinderGeometry(120, 120, 2, 32);
    var platformMaterial = new THREE.MeshPhongMaterial({ color: 0x2d5016 });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 0.5;
    root.add(platform);

    return root;
  }

  function updateWind(delta) {
    wind.angle += wind.speed * delta;
  }

  function updateTurbines(delta) {
    for (var i = 0; i < gameObjects.length; i++) {
      gameObjects[i].traverse(function(child) {
        if (child.userData.rotationSpeed) {
          child.rotation.z += child.userData.rotationSpeed * delta;
        }
      });
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    gameObjects = [];

    var skyGardenGroup = buildEnvironment();
    scene.add(skyGardenGroup);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 150, 100);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    var pointLight = new THREE.PointLight(0xff6b6b, 0.5, 150);
    pointLight.position.set(-50, 30, 50);
    scene.add(pointLight);
  }

  function update(delta) {
    updateWind(delta);
    updateTurbines(delta);
  }

  function reset() {
    for (var i = gameObjects.length - 1; i >= 0; i--) {
      scene.remove(gameObjects[i]);
    }
    gameObjects = [];
    wind = { angle: 0, speed: 0.02 };
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
