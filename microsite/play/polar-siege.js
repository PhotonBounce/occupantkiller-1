window.PolarSiege = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var wind = 0;
  var time = 0;

  function buildIgloo(x, y, z, radius) {
    var dome = new THREE.SphereGeometry(radius, 16, 16);
    var material = new THREE.MeshStandardMaterial({ color: 0xf0f8ff, roughness: 0.4, metalness: 0.1 });
    var mesh = new THREE.Mesh(dome, material);
    mesh.position.set(x, y + radius, z);
    mesh.scale.set(1, 0.8, 1);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildAntiAircraftGun(x, y, z) {
    var base = new THREE.CylinderGeometry(1.5, 1.8, 0.6, 32);
    var baseMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.7 });
    var baseMesh = new THREE.Mesh(base, baseMat);
    baseMesh.position.set(x, y + 0.3, z);
    scene.add(baseMesh);
    objects.push(baseMesh);

    var barrel = new THREE.CylinderGeometry(0.25, 0.2, 4, 16);
    var metalMat = new THREE.MeshStandardMaterial({ color: 0x34495e, roughness: 0.6, metalness: 0.8 });
    var barrelMesh = new THREE.Mesh(barrel, metalMat);
    barrelMesh.position.set(x, y + 2.5, z);
    barrelMesh.rotation.z = Math.PI * 0.3;
    scene.add(barrelMesh);
    objects.push(barrelMesh);

    var turret = new THREE.CylinderGeometry(0.8, 1, 0.8, 32);
    var turretMesh = new THREE.Mesh(turret, metalMat);
    turretMesh.position.set(x, y + 1.2, z);
    scene.add(turretMesh);
    objects.push(turretMesh);
  }

  function buildSupplyCrate(x, y, z) {
    var crate = new THREE.BoxGeometry(1.5, 1.2, 1.5);
    var crateMat = new THREE.MeshStandardMaterial({ color: 0xff6b35, roughness: 0.5 });
    var crateMesh = new THREE.Mesh(crate, crateMat);
    crateMesh.position.set(x, y + 0.6, z);
    scene.add(crateMesh);
    objects.push(crateMesh);

    var stripe1 = new THREE.BoxGeometry(1.6, 0.15, 1.6);
    var stripMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    var stripe = new THREE.Mesh(stripe1, stripMat);
    stripe.position.set(x, y + 1.1, z);
    scene.add(stripe);
    objects.push(stripe);
  }

  function buildSnowplow(x, y, z) {
    var cabin = new THREE.BoxGeometry(1.2, 1, 2.5);
    var cabinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.4 });
    var cabinMesh = new THREE.Mesh(cabin, cabinMat);
    cabinMesh.position.set(x, y + 0.7, z);
    scene.add(cabinMesh);
    objects.push(cabinMesh);

    var blade = new THREE.BoxGeometry(3, 0.6, 0.4);
    var bladeMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7, metalness: 0.9 });
    var bladeMesh = new THREE.Mesh(blade, bladeMat);
    bladeMesh.position.set(x, y + 0.5, z - 1.4);
    scene.add(bladeMesh);
    objects.push(bladeMesh);

    var wheel = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
    var wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
    for (var i = 0; i < 4; i++) {
      var wheelMesh = new THREE.Mesh(wheel, wheelMat);
      var offset = (i < 2) ? -0.7 : 0.7;
      var zoff = (i % 2 === 0) ? -0.8 : 0.8;
      wheelMesh.position.set(x + offset, y + 0.3, z + zoff);
      wheelMesh.rotation.z = Math.PI * 0.5;
      scene.add(wheelMesh);
      objects.push(wheelMesh);
    }
  }

  function buildSurvivalTent(x, y, z) {
    var tents = new THREE.ConeGeometry(1.2, 1.8, 8);
    var tentMat = new THREE.MeshStandardMaterial({ color: 0xff4500, roughness: 0.5 });
    var tentMesh = new THREE.Mesh(tents, tentMat);
    tentMesh.position.set(x, y + 0.9, z);
    scene.add(tentMesh);
    objects.push(tentMesh);

    var light = new THREE.PointLight(0xff8c00, 1.5, 8);
    light.position.set(x, y + 1, z);
    scene.add(light);
  }

  function buildIceWallBarricade(x, y, z, length) {
    var wall = new THREE.BoxGeometry(length, 1.5, 0.4);
    var iceMat = new THREE.MeshStandardMaterial({ color: 0xb0e0e6, roughness: 0.2, metalness: 0.2 });
    var wallMesh = new THREE.Mesh(wall, iceMat);
    wallMesh.position.set(x, y + 0.75, z);
    scene.add(wallMesh);
    objects.push(wallMesh);
  }

  function buildAirstrip(x, y, z) {
    var runway = new THREE.BoxGeometry(20, 0.2, 4);
    var runwayMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.6 });
    var runwayMesh = new THREE.Mesh(runway, runwayMat);
    runwayMesh.position.set(x, y, z);
    scene.add(runwayMesh);
    objects.push(runwayMesh);

    var lineGeo = new THREE.BufferGeometry();
    var points = [];
    for (var i = -10; i < 10; i += 0.5) {
      points.push(new THREE.Vector3(x + i, y + 0.15, z));
      points.push(new THREE.Vector3(x + i + 0.3, y + 0.15, z));
    }
    lineGeo.setFromPoints(points);
    var lineMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
    var lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);
  }

  function buildBlizzardParticles() {
    var snowGeo = new THREE.BufferGeometry();
    var snowPositions = [];
    for (var i = 0; i < 500; i++) {
      snowPositions.push(Math.random() * 100 - 50);
      snowPositions.push(Math.random() * 50);
      snowPositions.push(Math.random() * 100 - 50);
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(snowPositions), 3));
    var snowMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2, opacity: 0.6, transparent: true });
    var snow = new THREE.Points(snowGeo, snowMat);
    scene.add(snow);
    objects.push(snow);
  }

  function init(sceneArg, cameraArg) {
    scene = sceneArg;
    camera = cameraArg;
    objects = [];
    time = 0;
    wind = 0;

    scene.fog = new THREE.Fog(0xb3d9ff, 80, 200);
    scene.background = new THREE.Color(0xa8b8cc);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(30, 40, 20);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    buildIgloo(-15, 0, -20, 3);
    buildIgloo(15, 0, -20, 3);
    buildAntiAircraftGun(-10, 0, 10);
    buildAntiAircraftGun(10, 0, 10);
    buildSupplyCrate(-5, 0, -5);
    buildSupplyCrate(5, 0, -5);
    buildSupplyCrate(0, 0, -15);
    buildSnowplow(-20, 0, 0);
    buildSnowplow(20, 0, 5);
    buildSurvivalTent(-8, 0, 8);
    buildSurvivalTent(8, 0, 8);
    buildIceWallBarricade(-30, 0, 0, 15);
    buildIceWallBarricade(30, 0, 0, 15);
    buildAirstrip(0, 0, 40);
    buildBlizzardParticles();
  }

  function update(delta) {
    time += delta;
    wind = Math.sin(time * 0.5) * 0.05;

    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.geometry instanceof THREE.BufferGeometry && obj.isPoints) {
        var pos = obj.geometry.attributes.position.array;
        for (var j = 0; j < pos.length; j += 3) {
          pos[j] += wind;
          pos[j + 1] -= delta * 5;
          if (pos[j + 1] < -5) {
            pos[j + 1] = 50;
          }
          if (pos[j] > 50) {
            pos[j] = -50;
          }
        }
        obj.geometry.attributes.position.needsUpdate = true;
      }
    }
  }

  function reset() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];
    time = 0;
    wind = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
