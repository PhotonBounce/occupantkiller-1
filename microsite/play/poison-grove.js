window.PoisonGrove = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var renderer = null;
  var meshes = [];
  var glowMaterials = [];
  var timeAccum = 0;
  var sporeEmitters = [];

  function init(sceneRef, cameraRef, rendererRef) {
    scene = sceneRef;
    camera = cameraRef;
    renderer = rendererRef;
    meshes = [];
    glowMaterials = [];
    sporeEmitters = [];
    timeAccum = 0;

    buildTerrain();
    buildToxicTrees();
    buildSpodePods();
    buildDeconTowers();
    buildMilitaryTents();
    buildGasStations();
    buildAntidoteStations();
    buildTrapMarkers();
    buildToxicStream();
  }

  function buildTerrain() {
    var groundMat = new THREE.MeshStandardMaterial({ color: 0x1a3d1a, roughness: 0.8 });
    var groundGeo = new THREE.BoxGeometry(80, 1, 80);
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.5;
    ground.castShadow = true;
    ground.receiveShadow = true;
    scene.add(ground);
    meshes.push(ground);

    var deadAnimalCount = 4;
    for (var i = 0; i < deadAnimalCount; i++) {
      var boneGeo = new THREE.CylinderGeometry(0.3, 0.2, 3, 8);
      var boneMat = new THREE.MeshStandardMaterial({ color: 0xf5f5dc, roughness: 0.9 });
      var bone = new THREE.Mesh(boneGeo, boneMat);
      bone.position.set(-20 + i * 15, 1.5, -30 + Math.sin(i) * 10);
      bone.rotation.z = Math.PI / 4;
      bone.castShadow = true;
      bone.receiveShadow = true;
      scene.add(bone);
      meshes.push(bone);
    }
  }

  function buildToxicTrees() {
    var treePositions = [
      [-25, 0, -25],
      [25, 0, -25],
      [-25, 0, 25],
      [25, 0, 25],
      [0, 0, -20],
      [0, 0, 20],
      [-15, 0, 0],
      [15, 0, 0],
      [-35, 0, 5],
      [35, 0, -5]
    ];

    for (var i = 0; i < treePositions.length; i++) {
      var pos = treePositions[i];
      var trunkGeo = new THREE.CylinderGeometry(2.5, 3, 20, 12);
      var glowMat = new THREE.MeshStandardMaterial({
        color: 0x99ff00,
        emissive: 0x66cc00,
        emissiveIntensity: 0.6,
        roughness: 0.4,
        metalness: 0.1
      });
      var trunk = new THREE.Mesh(trunkGeo, glowMat);
      trunk.position.set(pos[0], 10, pos[2]);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      scene.add(trunk);
      meshes.push(trunk);
      glowMaterials.push(glowMat);

      var barkDarkGeo = new THREE.CylinderGeometry(2.3, 2.8, 19.5, 12);
      var barkMat = new THREE.MeshStandardMaterial({
        color: 0x2d2d1f,
        roughness: 0.95
      });
      var bark = new THREE.Mesh(barkDarkGeo, barkMat);
      bark.position.set(pos[0], 10, pos[2]);
      bark.scale.z = 1.02;
      bark.castShadow = true;
      bark.receiveShadow = true;
      scene.add(bark);
      meshes.push(bark);

      sporeEmitters.push({
        position: [pos[0], 18, pos[2]],
        intensity: 0.3 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function buildSpodePods() {
    var podPositions = [
      [-25, 16, -25],
      [25, 14, -25],
      [-25, 17, 25],
      [25, 15, 25],
      [0, 18, -20],
      [0, 16, 20],
      [-15, 15, 0],
      [15, 17, 0]
    ];

    for (var i = 0; i < podPositions.length; i++) {
      var pos = podPositions[i];
      var podGeo = new THREE.SphereGeometry(1.2, 16, 16);
      var podMat = new THREE.MeshStandardMaterial({
        color: 0xccff33,
        emissive: 0x88dd00,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.2
      });
      var pod = new THREE.Mesh(podGeo, podMat);
      pod.position.set(pos[0], pos[1], pos[2]);
      pod.castShadow = true;
      pod.receiveShadow = true;
      scene.add(pod);
      meshes.push(pod);
      glowMaterials.push(podMat);

      var tentacleGeo = new THREE.CylinderGeometry(0.15, 0.08, 3, 6);
      var tentacleMat = new THREE.MeshStandardMaterial({
        color: 0x88ff00,
        emissive: 0x55cc00,
        roughness: 0.5
      });
      var tentacle = new THREE.Mesh(tentacleGeo, tentacleMat);
      tentacle.position.set(pos[0] + 0.5, pos[1] - 2, pos[2]);
      tentacle.rotation.z = Math.PI / 3;
      tentacle.castShadow = true;
      tentacle.receiveShadow = true;
      scene.add(tentacle);
      meshes.push(tentacle);
    }
  }

  function buildDeconTowers() {
    var towerPositions = [
      [-30, 0, -30],
      [30, 0, 30]
    ];

    for (var i = 0; i < towerPositions.length; i++) {
      var pos = towerPositions[i];
      var baseGeo = new THREE.CylinderGeometry(1.5, 1.8, 1, 8);
      var metalMat = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.8,
        roughness: 0.2
      });
      var base = new THREE.Mesh(baseGeo, metalMat);
      base.position.set(pos[0], 0.5, pos[2]);
      base.castShadow = true;
      base.receiveShadow = true;
      scene.add(base);
      meshes.push(base);

      var poleGeo = new THREE.CylinderGeometry(0.3, 0.3, 12, 8);
      var pole = new THREE.Mesh(poleGeo, metalMat);
      pole.position.set(pos[0], 6, pos[2]);
      pole.castShadow = true;
      pole.receiveShadow = true;
      scene.add(pole);
      meshes.push(pole);

      var showerGeo = new THREE.SphereGeometry(1.8, 12, 12);
      var showerMat = new THREE.MeshStandardMaterial({
        color: 0x666666,
        metalness: 0.7,
        roughness: 0.3
      });
      var shower = new THREE.Mesh(showerGeo, showerMat);
      shower.position.set(pos[0], 11.5, pos[2]);
      shower.scale.y = 0.6;
      shower.castShadow = true;
      shower.receiveShadow = true;
      scene.add(shower);
      meshes.push(shower);

      var showerHeadGeo = new THREE.CylinderGeometry(0.4, 0.35, 0.8, 8);
      var headMat = new THREE.MeshStandardMaterial({
        color: 0x888888,
        metalness: 0.9
      });
      var head = new THREE.Mesh(showerHeadGeo, headMat);
      head.position.set(pos[0], 12.5, pos[2]);
      head.castShadow = true;
      head.receiveShadow = true;
      scene.add(head);
      meshes.push(head);
    }
  }

  function buildMilitaryTents() {
    var tentPositions = [
      [-10, 0, -15],
      [10, 0, -15],
      [-10, 0, 15],
      [10, 0, 15]
    ];

    for (var i = 0; i < tentPositions.length; i++) {
      var pos = tentPositions[i];
      var roofGeo = new THREE.ConeGeometry(3, 3.5, 8);
      var tentMat = new THREE.MeshStandardMaterial({
        color: 0x3d5c3d,
        roughness: 0.6
      });
      var roof = new THREE.Mesh(roofGeo, tentMat);
      roof.position.set(pos[0], 1.75, pos[2]);
      roof.castShadow = true;
      roof.receiveShadow = true;
      scene.add(roof);
      meshes.push(roof);

      var baseGeo = new THREE.CylinderGeometry(3.2, 3.2, 0.3, 8);
      var baseMat = new THREE.MeshStandardMaterial({
        color: 0x2d3d2d,
        roughness: 0.7
      });
      var base = new THREE.Mesh(baseGeo, baseMat);
      base.position.set(pos[0], 0.15, pos[2]);
      base.castShadow = true;
      base.receiveShadow = true;
      scene.add(base);
      meshes.push(base);

      var poleGeo = new THREE.CylinderGeometry(0.15, 0.15, 3.5, 6);
      var poleMat = new THREE.MeshStandardMaterial({
        color: 0x5a5a5a,
        metalness: 0.6
      });
      var pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(pos[0], 1.75, pos[2]);
      pole.castShadow = true;
      pole.receiveShadow = true;
      scene.add(pole);
      meshes.push(pole);
    }
  }

  function buildGasStations() {
    var stationPositions = [
      [-20, 0, 10],
      [20, 0, 10]
    ];

    for (var i = 0; i < stationPositions.length; i++) {
      var pos = stationPositions[i];
      var boxGeo = new THREE.BoxGeometry(1.2, 2.5, 1.2);
      var gasMat = new THREE.MeshStandardMaterial({
        color: 0x555555,
        metalness: 0.7,
        roughness: 0.4
      });
      var box = new THREE.Mesh(boxGeo, gasMat);
      box.position.set(pos[0], 1.25, pos[2]);
      box.castShadow = true;
      box.receiveShadow = true;
      scene.add(box);
      meshes.push(box);

      var maskGeo = new THREE.SphereGeometry(0.4, 12, 12);
      var maskMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.8
      });
      var mask = new THREE.Mesh(maskGeo, maskMat);
      mask.position.set(pos[0], 2.5, pos[2]);
      mask.castShadow = true;
      mask.receiveShadow = true;
      scene.add(mask);
      meshes.push(mask);

      var filterGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.6, 6);
      var filterMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.5
      });
      var filter = new THREE.Mesh(filterGeo, filterMat);
      filter.position.set(pos[0] - 0.6, 2.5, pos[2]);
      filter.rotation.z = Math.PI / 2;
      filter.castShadow = true;
      filter.receiveShadow = true;
      scene.add(filter);
      meshes.push(filter);
    }
  }

  function buildAntidoteStations() {
    var antPositions = [
      [0, 0, -30],
      [0, 0, 30]
    ];

    for (var i = 0; i < antPositions.length; i++) {
      var pos = antPositions[i];
      var standGeo = new THREE.BoxGeometry(0.8, 3, 0.8);
      var standMat = new THREE.MeshStandardMaterial({
        color: 0x404040,
        roughness: 0.6
      });
      var stand = new THREE.Mesh(standGeo, standMat);
      stand.position.set(pos[0], 1.5, pos[2]);
      stand.castShadow = true;
      stand.receiveShadow = true;
      scene.add(stand);
      meshes.push(stand);

      var dispenserGeo = new THREE.BoxGeometry(1.2, 0.8, 0.5);
      var dispenserMat = new THREE.MeshStandardMaterial({
        color: 0xff4444,
        emissive: 0xcc0000,
        emissiveIntensity: 0.3,
        roughness: 0.5
      });
      var dispenser = new THREE.Mesh(dispenserGeo, dispenserMat);
      dispenser.position.set(pos[0], 2.8, pos[2]);
      dispenser.castShadow = true;
      dispenser.receiveShadow = true;
      scene.add(dispenser);
      meshes.push(dispenser);
      glowMaterials.push(dispenserMat);

      var vialGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 6);
      var vialMat = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00dd00,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.8,
        roughness: 0.2
      });
      var vial = new THREE.Mesh(vialGeo, vialMat);
      vial.position.set(pos[0], 3.4, pos[2]);
      vial.castShadow = true;
      vial.receiveShadow = true;
      scene.add(vial);
      meshes.push(vial);
      glowMaterials.push(vialMat);
    }
  }

  function buildTrapMarkers() {
    var trapPositions = [
      [-15, 0.1, -10],
      [15, 0.1, -10],
      [-15, 0.1, 10],
      [15, 0.1, 10],
      [0, 0.1, -5],
      [0, 0.1, 5],
      [-25, 0.1, 0],
      [25, 0.1, 0]
    ];

    for (var i = 0; i < trapPositions.length; i++) {
      var pos = trapPositions[i];
      var markerGeo = new THREE.CylinderGeometry(1, 1, 0.2, 8);
      var markerMat = new THREE.MeshStandardMaterial({
        color: 0xff9900,
        emissive: 0xff6600,
        emissiveIntensity: 0.4,
        roughness: 0.4
      });
      var marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(pos[0], pos[1], pos[2]);
      marker.castShadow = false;
      marker.receiveShadow = true;
      scene.add(marker);
      meshes.push(marker);
      glowMaterials.push(markerMat);

      var ringGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.05, 8);
      var ringMat = new THREE.MeshStandardMaterial({
        color: 0xffbb00,
        emissive: 0xffaa00,
        emissiveIntensity: 0.3
      });
      var ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(pos[0], pos[1] + 0.15, pos[2]);
      ring.castShadow = false;
      ring.receiveShadow = true;
      scene.add(ring);
      meshes.push(ring);
      glowMaterials.push(ringMat);
    }
  }

  function buildToxicStream() {
    var streamPoints = [
      new THREE.Vector3(-30, 0.5, -35),
      new THREE.Vector3(-15, 0.5, -25),
      new THREE.Vector3(0, 0.5, -15),
      new THREE.Vector3(15, 0.5, -5),
      new THREE.Vector3(30, 0.5, 5),
      new THREE.Vector3(35, 0.5, 25)
    ];

    for (var i = 0; i < streamPoints.length - 1; i++) {
      var startPoint = streamPoints[i];
      var endPoint = streamPoints[i + 1];
      var streamGeo = new THREE.BoxGeometry(1.5, 0.3, 3);
      var streamMat = new THREE.MeshStandardMaterial({
        color: 0x44dd44,
        emissive: 0x22cc22,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.7,
        roughness: 0.3
      });
      var stream = new THREE.Mesh(streamGeo, streamMat);
      stream.position.copy(startPoint.clone().add(endPoint).multiplyScalar(0.5));
      var direction = endPoint.clone().sub(startPoint);
      stream.rotation.y = Math.atan2(direction.x, direction.z);
      stream.scale.z = direction.length() / 3;
      stream.castShadow = true;
      stream.receiveShadow = true;
      scene.add(stream);
      meshes.push(stream);
      glowMaterials.push(streamMat);
    }
  }

  function update(deltaTime) {
    timeAccum += deltaTime;

    for (var i = 0; i < glowMaterials.length; i++) {
      var mat = glowMaterials[i];
      var baseIntensity = 0.3;
      var pulseAmount = Math.sin(timeAccum * 1.5 + i * 0.5) * 0.25 + 0.25;
      mat.emissiveIntensity = baseIntensity + pulseAmount;
    }

    for (var j = 0; j < sporeEmitters.length; j++) {
      var emitter = sporeEmitters[j];
      var phase = timeAccum * 0.8 + emitter.phase;
      var releaseAmount = Math.max(0, Math.sin(phase) * emitter.intensity);

      if (releaseAmount > 0.1 && scene) {
        var sporeCount = Math.floor(releaseAmount * 3);
        for (var s = 0; s < sporeCount; s++) {
          var sporeGeo = new THREE.SphereGeometry(0.15, 6, 6);
          var sporeMat = new THREE.MeshStandardMaterial({
            color: 0xccff00,
            emissive: 0x88dd00,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.6
          });
          var spore = new THREE.Mesh(sporeGeo, sporeMat);
          var offsetX = (Math.random() - 0.5) * 3;
          var offsetZ = (Math.random() - 0.5) * 3;
          spore.position.set(
            emitter.position[0] + offsetX,
            emitter.position[1],
            emitter.position[2] + offsetZ
          );
          spore.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            Math.random() * 2 + 1,
            (Math.random() - 0.5) * 2
          );
          spore.lifetime = 2 + Math.random();
          spore.born = timeAccum;
          scene.add(spore);
          meshes.push(spore);
        }
      }
    }

    var meshesToRemove = [];
    for (var m = 0; m < meshes.length; m++) {
      var mesh = meshes[m];
      if (mesh.velocity && mesh.lifetime) {
        var age = timeAccum - mesh.born;
        if (age > mesh.lifetime) {
          meshesToRemove.push(m);
          if (scene) {
            scene.remove(mesh);
          }
        } else {
          mesh.position.add(mesh.velocity.clone().multiplyScalar(deltaTime));
          var fadeStart = mesh.lifetime * 0.7;
          if (age > fadeStart) {
            var fadeFactor = 1 - (age - fadeStart) / (mesh.lifetime - fadeStart);
            mesh.material.opacity = Math.max(0, mesh.material.opacity * fadeFactor);
          }
        }
      }
    }

    for (var r = meshesToRemove.length - 1; r >= 0; r--) {
      meshes.splice(meshesToRemove[r], 1);
    }
  }

  function reset() {
    if (scene) {
      for (var i = meshes.length - 1; i >= 0; i--) {
        scene.remove(meshes[i]);
      }
    }
    meshes = [];
    glowMaterials = [];
    sporeEmitters = [];
    timeAccum = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
