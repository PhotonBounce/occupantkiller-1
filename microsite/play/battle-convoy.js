window.BattleConvoy = (function() {
  'use strict';

  var scene;
  var camera;
  var objects = [];
  var fires = [];
  var explosionSmokes = [];

  function buildTruckHulk(x, z, rotation) {
    var group = new THREE.Group();

    var bodyGeom = new THREE.BoxGeometry(2, 1.5, 5);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 1;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    for (var w = 0; w < 2; w++) {
      var wheelX = w === 0 ? -1 : 1;
      for (var a = 0; a < 2; a++) {
        var wheelZ = a === 0 ? -1.5 : 1.5;
        var wheelGeom = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
        var wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6 });
        var wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wheelX * 1.2, 0.6, wheelZ);
        wheel.castShadow = true;
        group.add(wheel);
      }
    }

    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    scene.add(group);
    objects.push(group);
  }

  function buildAPC(x, z) {
    var group = new THREE.Group();

    var hullGeom = new THREE.BoxGeometry(2.5, 2, 4.5);
    var hullMat = new THREE.MeshStandardMaterial({ color: 0x2d5a2d, roughness: 0.85 });
    var hull = new THREE.Mesh(hullGeom, hullMat);
    hull.position.y = 0.8;
    hull.rotation.z = 0.4;
    hull.castShadow = true;
    hull.receiveShadow = true;
    group.add(hull);

    for (var w = 0; w < 3; w++) {
      var wheelGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 12);
      var wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      var wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(((w - 1) * 1.2), 0.5, -1);
      wheel.castShadow = true;
      group.add(wheel);
    }

    group.position.set(x, 0, z);
    scene.add(group);
    objects.push(group);
  }

  function buildSupplyCrate(x, y, z) {
    var crateGeom = new THREE.BoxGeometry(1, 1, 1);
    var crateMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.95 });
    var crate = new THREE.Mesh(crateGeom, crateMat);
    crate.position.set(x, y, z);
    crate.castShadow = true;
    crate.receiveShadow = true;
    scene.add(crate);
    objects.push(crate);
  }

  function buildIEDCrater(x, z, radius) {
    var craterGeom = new THREE.ConeGeometry(radius, 0.5, 12);
    var craterMat = new THREE.MeshStandardMaterial({ color: 0x3d3d3d, roughness: 1.0 });
    var crater = new THREE.Mesh(craterGeom, craterMat);
    crater.rotation.z = Math.PI;
    crater.position.set(x, -0.25, z);
    crater.receiveShadow = true;
    scene.add(crater);
    objects.push(crater);
  }

  function buildBurningTire(x, z) {
    var group = new THREE.Group();

    var tireGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    var tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1.0 });
    var tire = new THREE.Mesh(tireGeom, tireMat);
    tire.rotation.z = Math.PI / 2.5;
    tire.position.y = 0.4;
    tire.castShadow = true;
    group.add(tire);

    var flameGeom = new THREE.ConeGeometry(0.5, 1.2, 8);
    var flameMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff4400,
      emissiveIntensity: 1.8,
      wireframe: false
    });
    var flame = new THREE.Mesh(flameGeom, flameMat);
    flame.position.y = 1;
    flame.scale.x = 0.85;
    flame.scale.z = 0.85;
    group.add(flame);

    group.position.set(x, 0, z);
    scene.add(group);
    fires.push({ mesh: flame, baseIntensity: 1.8 });
    objects.push(group);
  }

  function buildPowerLines(startX, startZ, endX, endZ) {
    var points = [
      new THREE.Vector3(startX, 3.5, startZ),
      new THREE.Vector3((startX + endX) / 2, 3.8, (startZ + endZ) / 2),
      new THREE.Vector3(endX, 3.5, endZ)
    ];

    var lineGeom = new THREE.BufferGeometry().setFromPoints(points);
    var lineMat = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });
    var lines = new THREE.LineSegments(lineGeom, lineMat);
    scene.add(lines);
    objects.push(lines);
  }

  function buildExplosionSmoke(x, z) {
    var group = new THREE.Group();

    var baseY = 0.5;
    for (var s = 0; s < 3; s++) {
      var smokeGeom = new THREE.SphereGeometry(0.8 + s * 0.3, 8, 8);
      var smokeMat = new THREE.MeshStandardMaterial({
        color: 0x555555,
        transparent: true,
        opacity: 0.4 - s * 0.1,
        emissive: 0x222222,
        emissiveIntensity: 0.5
      });
      var smoke = new THREE.Mesh(smokeGeom, smokeMat);
      smoke.position.y = baseY + s * 0.6;
      group.add(smoke);
    }

    group.position.set(x, 0, z);
    scene.add(group);
    explosionSmokes.push({ group: group, time: 0, lifetime: 8 });
    objects.push(group);
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    buildTruckHulk(-8, -10, 0.2);
    buildTruckHulk(3, -15, -0.3);
    buildTruckHulk(6, 5, 0.1);

    buildAPC(-2, 8);

    buildSupplyCrate(-6, 0.5, -8);
    buildSupplyCrate(1, 0.5, -12);
    buildSupplyCrate(4, 0.5, 10);
    buildSupplyCrate(-10, 0.5, 3);

    buildIEDCrater(-4, -20, 3);
    buildIEDCrater(7, 2, 2.5);

    buildBurningTire(-8, 5);
    buildBurningTire(5, -18);

    buildPowerLines(-15, -25, 15, 25);
    buildPowerLines(-12, 12, 18, 8);

    buildExplosionSmoke(-10, 15);
    buildExplosionSmoke(12, -20);
  }

  function animate(fire, deltaTime) {
    if (fire.mesh) {
      var flicker = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
      fire.mesh.material.emissiveIntensity = fire.baseIntensity * flicker;
    }
  }

  function updateSmokes(deltaTime) {
    for (var i = explosionSmokes.length - 1; i >= 0; i--) {
      var smoke = explosionSmokes[i];
      smoke.time += deltaTime;

      var progress = smoke.time / smoke.lifetime;
      if (progress >= 1.0) {
        scene.remove(smoke.group);
        explosionSmokes.splice(i, 1);
      } else {
        smoke.group.position.y += deltaTime * 0.3;
        var children = smoke.group.children;
        for (var c = 0; c < children.length; c++) {
          children[c].material.opacity = (0.4 - (c * 0.1)) * (1 - progress);
        }
      }
    }
  }

  function update(deltaTime) {
    for (var i = 0; i < fires.length; i++) {
      animate(fires[i], deltaTime);
    }
    updateSmokes(deltaTime);
  }

  function reset() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];
    fires = [];
    explosionSmokes = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
