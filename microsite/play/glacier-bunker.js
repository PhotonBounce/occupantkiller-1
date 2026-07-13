window.GlacierBunker = (function() {
  'use strict';

  var scene;
  var camera;
  var objects = [];
  var emissiveMaterials = [];
  var time = 0;

  var mat = {};
  mat.ice = new THREE.MeshStandardMaterial({
    color: 0x4da6ff,
    metalness: 0.3,
    roughness: 0.2,
    emissive: 0x2d5a99,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.85
  });

  mat.snow = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    metalness: 0.0,
    roughness: 0.9,
    emissive: 0x1a1a2e,
    emissiveIntensity: 0.1
  });

  mat.vault = new THREE.MeshStandardMaterial({
    color: 0x2a2a3e,
    metalness: 0.8,
    roughness: 0.3,
    emissive: 0x1a1a2e,
    emissiveIntensity: 0.2
  });

  mat.coldLight = new THREE.MeshBasicMaterial({
    color: 0x4da6ff,
    emissive: 0x4da6ff
  });

  mat.cryo = new THREE.MeshStandardMaterial({
    color: 0x1a4d66,
    metalness: 0.6,
    roughness: 0.4,
    emissive: 0x0d2640,
    emissiveIntensity: 0.25
  });

  function buildWalls() {
    var wallGeo = new THREE.BoxGeometry(60, 20, 0.8);
    var wall1 = new THREE.Mesh(wallGeo, mat.ice);
    wall1.position.set(0, 5, -30);
    wall1.rotation.z = Math.PI * 0.02;
    scene.add(wall1);
    objects.push(wall1);

    var wall2 = new THREE.Mesh(wallGeo, mat.ice);
    wall2.position.set(30, 5, 0);
    wall2.rotation.y = Math.PI / 2;
    scene.add(wall2);
    objects.push(wall2);

    var wall3 = new THREE.Mesh(wallGeo, mat.ice);
    wall3.position.set(-30, 5, 0);
    wall3.rotation.y = Math.PI / 2;
    scene.add(wall3);
    objects.push(wall3);
  }

  function buildEntranceGate() {
    var entryGeo = new THREE.BoxGeometry(25, 18, 1.5);
    var entry = new THREE.Mesh(entryGeo, mat.snow);
    entry.position.set(0, 3, 35);
    scene.add(entry);
    objects.push(entry);

    for (var i = 0; i < 4; i++) {
      var icicleMaterial = mat.ice;
      var icicleGeo = new THREE.ConeGeometry(1.2 + i * 0.4, 6 + i * 1.5, 8);
      var icicle = new THREE.Mesh(icicleGeo, icicleMaterial);
      icicle.position.set(-8 + i * 6, 16, 35.2);
      icicle.rotation.x = Math.PI;
      scene.add(icicle);
      objects.push(icicle);
    }

    for (var j = 0; j < 3; j++) {
      var driftGeo = new THREE.ConeGeometry(4 + j * 1, 3.5 + j * 0.8, 6);
      var drift = new THREE.Mesh(driftGeo, mat.snow);
      drift.position.set(-12 + j * 12, 1.5, 38);
      scene.add(drift);
      objects.push(drift);
    }
  }

  function buildLightStrips() {
    for (var i = 0; i < 5; i++) {
      var stripGeo = new THREE.BoxGeometry(3, 0.6, 40);
      var strip = new THREE.Mesh(stripGeo, mat.coldLight);
      strip.position.set(-15 + i * 7.5, 18, 0);
      scene.add(strip);
      objects.push(strip);
      emissiveMaterials.push(mat.coldLight);
    }
  }

  function buildVault() {
    var vaultBoxGeo = new THREE.BoxGeometry(14, 12, 12);
    var vaultBox = new THREE.Mesh(vaultBoxGeo, mat.vault);
    vaultBox.position.set(0, 8, -18);
    scene.add(vaultBox);
    objects.push(vaultBox);

    var warheadGeo = new THREE.CylinderGeometry(2.5, 2.5, 7, 12);
    var warhead = new THREE.Mesh(warheadGeo, mat.cryo);
    warhead.position.set(0, 8, -18);
    scene.add(warhead);
    objects.push(warhead);

    var caseGeo = new THREE.BoxGeometry(5.5, 8.5, 5.5);
    var caseIce = new THREE.Mesh(caseGeo, mat.ice);
    caseIce.position.set(0, 8, -18);
    caseIce.material.opacity = 0.7;
    scene.add(caseIce);
    objects.push(caseIce);
  }

  function buildCryoChambers() {
    for (var i = 0; i < 3; i++) {
      var chamberGeo = new THREE.CylinderGeometry(1.8, 1.8, 5, 8);
      var chamber = new THREE.Mesh(chamberGeo, mat.cryo);
      chamber.position.set(-12 + i * 12, 5, 15);
      scene.add(chamber);
      objects.push(chamber);

      var viewportGeo = new THREE.SphereGeometry(0.8, 16, 16);
      var viewport = new THREE.Mesh(viewportGeo, mat.ice);
      viewport.position.set(-12 + i * 12, 6.5, 15);
      scene.add(viewport);
      objects.push(viewport);
    }
  }

  function buildEquipment() {
    for (var i = 0; i < 4; i++) {
      var eqBoxGeo = new THREE.BoxGeometry(3.5, 4, 2.5);
      var eqBox = new THREE.Mesh(eqBoxGeo, mat.vault);
      eqBox.position.set(-15 + i * 10, 4, -10);
      scene.add(eqBox);
      objects.push(eqBox);

      var eqIceGeo = new THREE.BoxGeometry(4.2, 4.8, 3.2);
      var eqIce = new THREE.Mesh(eqIceGeo, mat.ice);
      eqIce.position.set(-15 + i * 10, 4, -10);
      scene.add(eqIce);
      objects.push(eqIce);
    }
  }

  function buildFloorGrating() {
    var points = [];
    for (var x = -25; x <= 25; x += 5) {
      points.push(new THREE.Vector3(x, 0.1, -20));
      points.push(new THREE.Vector3(x, 0.1, 20));
    }
    for (var z = -20; z <= 20; z += 5) {
      points.push(new THREE.Vector3(-25, 0.1, z));
      points.push(new THREE.Vector3(25, 0.1, z));
    }

    var gratingGeo = new THREE.BufferGeometry();
    gratingGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points.flatMap(function(p) { return [p.x, p.y, p.z]; })), 3));

    var gratingMat = new THREE.LineBasicMaterial({
      color: 0x2d5a99,
      linewidth: 1
    });

    var grating = new THREE.LineSegments(gratingGeo, gratingMat);
    scene.add(grating);
    objects.push(grating);
  }

  function buildCeiling() {
    var ceilingGeo = new THREE.BoxGeometry(70, 1.5, 80);
    var ceiling = new THREE.Mesh(ceilingGeo, mat.ice);
    ceiling.position.set(0, 19.5, 0);
    scene.add(ceiling);
    objects.push(ceiling);
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    time = 0;
    objects = [];
    emissiveMaterials = [];

    buildWalls();
    buildEntranceGate();
    buildLightStrips();
    buildVault();
    buildCryoChambers();
    buildEquipment();
    buildFloorGrating();
    buildCeiling();
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.material && obj.material.emissiveIntensity !== undefined) {
        var pulse = 0.15 + Math.sin(time * 0.8 + i) * 0.1;
        obj.material.emissiveIntensity = pulse;
      }
    }

    for (var j = 0; j < objects.length; j++) {
      if (objects[j].geometry && objects[j].geometry.type === 'ConeGeometry') {
        objects[j].rotation.z = Math.sin(time * 0.3 + j * 0.5) * 0.05;
      }
    }
  }

  function reset() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];
    emissiveMaterials = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
