window.TundraCamp = (function() {
  'use strict';

  var scene, camera;
  var buildings = [];
  var vehicles = [];
  var lights = [];
  var auroraArcs = [];

  function buildModularBox(x, y, z, w, h, d, color) {
    var geometry = new THREE.BoxGeometry(w, h, d);
    var material = new THREE.MeshStandardMaterial({ color: color, metalness: 0.3, roughness: 0.8 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function buildWalkwayTunnel(x1, z1, x2, z2, height) {
    var dx = x2 - x1;
    var dz = z2 - z1;
    var length = Math.sqrt(dx * dx + dz * dz);
    var angle = Math.atan2(dz, dx);
    var midX = (x1 + x2) / 2;
    var midZ = (z1 + z2) / 2;

    var tunnel = buildModularBox(midX, height / 2, midZ, length, height, 3, 0x4a5568);
    tunnel.rotation.y = angle;
    return tunnel;
  }

  function buildSnowcat(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var body = buildModularBox(0, 0.8, 0, 2.5, 1.2, 1.8, 0x2a3f5f);
    group.add(body);

    var trackL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6 })
    );
    trackL.position.set(-1.2, 0.5, 0.8);
    trackL.rotation.z = Math.PI / 2;
    group.add(trackL);

    var trackR = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6 })
    );
    trackR.position.set(-1.2, 0.5, -0.8);
    trackR.rotation.z = Math.PI / 2;
    group.add(trackR);

    scene.add(group);
    vehicles.push({ mesh: group, rotation: 0 });
    return group;
  }

  function buildFuelDepot(x, y, z) {
    var platform = buildModularBox(x, y, z, 4, 0.5, 3, 0x5a4a3a);

    var tank1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 2.5, 16),
      new THREE.MeshStandardMaterial({ color: 0xff6b35, metalness: 0.7, roughness: 0.3 })
    );
    tank1.position.set(x - 1, y + 1.8, z);
    tank1.castShadow = true;
    tank1.receiveShadow = true;
    scene.add(tank1);

    var tank2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 2.5, 16),
      new THREE.MeshStandardMaterial({ color: 0xff6b35, metalness: 0.7, roughness: 0.3 })
    );
    tank2.position.set(x + 1, y + 1.8, z);
    tank2.castShadow = true;
    tank2.receiveShadow = true;
    scene.add(tank2);
  }

  function buildCommunicationMast(x, y, z) {
    var mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 })
    );
    mast.position.set(x, y + 6, z);
    mast.castShadow = true;
    scene.add(mast);

    var points1 = [
      new THREE.Vector3(x, y + 10, z),
      new THREE.Vector3(x - 3, y + 4, z + 3)
    ];
    var wireGeom1 = new THREE.BufferGeometry().setFromPoints(points1);
    var wireMat = new THREE.LineBasicMaterial({ color: 0xcccccc });
    var wire1 = new THREE.LineSegments(wireGeom1, wireMat);
    scene.add(wire1);

    var points2 = [
      new THREE.Vector3(x, y + 10, z),
      new THREE.Vector3(x + 3, y + 4, z + 3)
    ];
    var wireGeom2 = new THREE.BufferGeometry().setFromPoints(points2);
    var wire2 = new THREE.LineSegments(wireGeom2, wireMat);
    scene.add(wire2);

    var points3 = [
      new THREE.Vector3(x, y + 10, z),
      new THREE.Vector3(x - 3, y + 4, z - 3)
    ];
    var wireGeom3 = new THREE.BufferGeometry().setFromPoints(points3);
    var wire3 = new THREE.LineSegments(wireGeom3, wireMat);
    scene.add(wire3);
  }

  function buildResearchInstrument(x, y, z) {
    var baseA = buildModularBox(x - 1, y + 0.3, z, 0.3, 0.6, 0.3, 0x8b7355);
    var baseB = buildModularBox(x + 1, y + 0.3, z, 0.3, 0.6, 0.3, 0x8b7355);
    var baseC = buildModularBox(x, y + 0.3, z + 1, 0.3, 0.6, 0.3, 0x8b7355);

    var instrument = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 1.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x4a90e2, metalness: 0.5, emissive: 0x2a5ae2 })
    );
    instrument.position.set(x, y + 1.5, z);
    instrument.castShadow = true;
    scene.add(instrument);
  }

  function buildSnowPallet(x, y, z) {
    var pallet = buildModularBox(x, y, z, 1.8, 0.4, 1.2, 0xc9b8a6);

    var snowCone = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 1.5, 16),
      new THREE.MeshStandardMaterial({ color: 0xf0f8ff, metalness: 0.1, roughness: 0.9 })
    );
    snowCone.position.set(x, y + 1.2, z);
    snowCone.castShadow = true;
    snowCone.receiveShadow = true;
    scene.add(snowCone);
  }

  function buildMotionSensorPole(x, y, z) {
    var base = buildModularBox(x, y + 0.25, z, 0.5, 0.5, 0.5, 0x444444);

    var pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 3, 6),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 })
    );
    pole.position.set(x, y + 1.75, z);
    pole.castShadow = true;
    scene.add(pole);

    var sensor = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0xff0000, metalness: 0.8 })
    );
    sensor.position.set(x, y + 3.2, z);
    scene.add(sensor);
  }

  function buildAuroraEffect() {
    var arcMaterial = new THREE.LineBasicMaterial({ color: 0x00ff88, emissive: 0x00ff88, linewidth: 2 });

    for (var i = 0; i < 3; i++) {
      var arc = [];
      var phases = 30;
      for (var j = 0; j < phases; j++) {
        var angle = (j / phases) * Math.PI * 1.8;
        var x = Math.cos(angle) * (8 + i * 3);
        var z = Math.sin(angle) * (8 + i * 3);
        var y = 20 + Math.sin(angle) * 4;
        arc.push(new THREE.Vector3(x, y, z));
      }
      var geom = new THREE.BufferGeometry().setFromPoints(arc);
      var line = new THREE.LineSegments(geom, arcMaterial);
      scene.add(line);
      auroraArcs.push(line);
    }
  }

  function init(s, c) {
    scene = s;
    camera = c;

    var groundMat = new THREE.MeshStandardMaterial({
      color: 0xb0d4e3,
      metalness: 0,
      roughness: 0.95,
      map: null
    });
    var ground = new THREE.Mesh(new THREE.BoxGeometry(100, 0.2, 100), groundMat);
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    buildModularBox(-15, 2, -15, 8, 4, 8, 0x3a4a5a);
    buildModularBox(0, 2, -15, 8, 4, 8, 0x3a4a5a);
    buildModularBox(15, 2, -15, 8, 4, 8, 0x3a4a5a);

    buildWalkwayTunnel(-15, -15, -15, 0, 2.5);
    buildWalkwayTunnel(-15, 0, 0, -15, 2.5);
    buildWalkwayTunnel(0, -15, 15, -15, 2.5);

    buildSnowcat(-25, 0.5, -25);
    buildSnowcat(25, 0.5, 25);

    buildFuelDepot(20, 0, 0);
    buildCommunicationMast(0, 0, 25);

    buildResearchInstrument(-20, 0, 20);
    buildResearchInstrument(20, 0, -20);

    buildSnowPallet(-10, 0, 10);
    buildSnowPallet(10, 0, -10);
    buildSnowPallet(0, 0, 25);

    buildMotionSensorPole(-30, 0, -30);
    buildMotionSensorPole(30, 0, 30);
    buildMotionSensorPole(-30, 0, 30);
    buildMotionSensorPole(30, 0, -30);

    buildAuroraEffect();

    var ambLight = new THREE.AmbientLight(0xccddff, 0.6);
    scene.add(ambLight);
    lights.push(ambLight);

    var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(40, 30, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.far = 100;
    scene.add(dirLight);
    lights.push(dirLight);
  }

  function update(delta) {
    for (var i = 0; i < vehicles.length; i++) {
      vehicles[i].mesh.rotation.y += 0.3 * delta;
    }

    for (var i = 0; i < auroraArcs.length; i++) {
      auroraArcs[i].material.opacity = 0.5 + 0.3 * Math.sin(Date.now() * 0.001);
    }
  }

  function reset() {
    scene.children.slice().forEach(function(child) {
      scene.remove(child);
    });
    buildings = [];
    vehicles = [];
    lights = [];
    auroraArcs = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
