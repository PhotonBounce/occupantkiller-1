window.GhostFactory = (function() {
  'use strict';

  var meshes = [];
  var lights = [];
  var pulseObjects = [];
  var timeAccumulator = 0;

  function buildDecayingWalls(scene) {
    var wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.8,
      metalness: 0.1
    });

    var wallPositions = [
      { pos: [-30, 10, -40], scale: [1, 1, 60], missing: 0.3 },
      { pos: [30, 10, -40], scale: [1, 1, 60], missing: 0.25 },
      { pos: [-30, 10, 40], scale: [1, 1, 60], missing: 0.4 },
      { pos: [30, 10, 40], scale: [1, 1, 60], missing: 0.2 }
    ];

    for (var i = 0; i < wallPositions.length; i++) {
      var config = wallPositions[i];
      var geometry = new THREE.BoxGeometry(config.scale[0], config.scale[1], config.scale[2]);
      var wall = new THREE.Mesh(geometry, wallMaterial);
      wall.position.set(config.pos[0], config.pos[1], config.pos[2]);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
      meshes.push(wall);

      if (Math.random() < config.missing) {
        var debrisGeometry = new THREE.BoxGeometry(8, 6, 4);
        var debris = new THREE.Mesh(debrisGeometry, wallMaterial);
        debris.position.set(config.pos[0], config.pos[1] + 8, config.pos[2] - 15);
        debris.rotation.z = (Math.random() - 0.5) * 0.5;
        debris.castShadow = true;
        scene.add(debris);
        meshes.push(debris);
      }
    }
  }

  function buildChemicalVats(scene) {
    var vatMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.3
    });

    var emissiveMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      emissive: 0x00ff00,
      emissiveIntensity: 0.4,
      roughness: 0.9,
      metalness: 0.2
    });

    var vatPositions = [
      { pos: [-20, 8, -20], scale: [8, 20, 8] },
      { pos: [20, 8, -20], scale: [8, 20, 8] },
      { pos: [-20, 8, 20], scale: [8, 20, 8] },
      { pos: [20, 8, 20], scale: [8, 20, 8] },
      { pos: [0, 8, 0], scale: [10, 24, 10] }
    ];

    for (var i = 0; i < vatPositions.length; i++) {
      var config = vatPositions[i];
      var geometry = new THREE.CylinderGeometry(config.scale[0], config.scale[1], config.scale[2], 12);
      var vat = new THREE.Mesh(geometry, vatMaterial);
      vat.position.set(config.pos[0], config.pos[1], config.pos[2]);
      vat.castShadow = true;
      vat.receiveShadow = true;
      scene.add(vat);
      meshes.push(vat);

      var topGeometry = new THREE.CylinderGeometry(config.scale[0], config.scale[1], 2, 12);
      var top = new THREE.Mesh(topGeometry, emissiveMaterial);
      top.position.set(config.pos[0], config.pos[1] + config.scale[2] / 2 + 1, config.pos[2]);
      top.castShadow = true;
      scene.add(top);
      meshes.push(top);
      pulseObjects.push(top);
    }
  }

  function buildBrokenCatwalks(scene) {
    var lineColor = 0x888888;
    var catwalkPositions = [
      { start: [-30, 15, -30], end: [30, 12, -30] },
      { start: [-30, 14, 0], end: [30, 14.5, 0] },
      { start: [-30, 13, 30], end: [30, 16, 30] }
    ];

    for (var i = 0; i < catwalkPositions.length; i++) {
      var config = catwalkPositions[i];
      var geometry = new THREE.BufferGeometry();
      var positions = new Float32Array([
        config.start[0], config.start[1], config.start[2],
        config.end[0], config.end[1], config.end[2]
      ]);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      var material = new THREE.LineBasicMaterial({ color: lineColor, linewidth: 3 });
      var catwalk = new THREE.LineSegments(geometry, material);
      scene.add(catwalk);
      meshes.push(catwalk);

      for (var j = 0; j < 5; j++) {
        var strutGeom = new THREE.BufferGeometry();
        var tBase = j / 4;
        var xStart = config.start[0] + (config.end[0] - config.start[0]) * tBase;
        var yStart = config.start[1] + (config.end[1] - config.start[1]) * tBase;
        var zStart = config.start[2];
        var strutPos = new Float32Array([
          xStart, yStart, zStart,
          xStart, yStart - 8, zStart
        ]);
        strutGeom.setAttribute('position', new THREE.BufferAttribute(strutPos, 3));
        var strut = new THREE.LineSegments(strutGeom, material);
        scene.add(strut);
        meshes.push(strut);
      }
    }
  }

  function buildEmergencyLights(scene) {
    var lightPositions = [
      [-25, 24, -35],
      [25, 24, -35],
      [-25, 24, 35],
      [25, 24, 35],
      [0, 26, 0]
    ];

    for (var i = 0; i < lightPositions.length; i++) {
      var pos = lightPositions[i];
      var geometry = new THREE.SphereGeometry(1.5, 8, 8);
      var material = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xff6600,
        emissiveIntensity: 0.8,
        roughness: 0.3
      });
      var orb = new THREE.Mesh(geometry, material);
      orb.position.set(pos[0], pos[1], pos[2]);
      scene.add(orb);
      meshes.push(orb);
      pulseObjects.push(orb);

      var pointLight = new THREE.PointLight(0xff6600, 1.2, 40);
      pointLight.position.copy(orb.position);
      pointLight.castShadow = true;
      scene.add(pointLight);
      lights.push(pointLight);
    }
  }

  function buildSkeletalMachinery(scene) {
    var frameColor = 0x666666;
    var machinePositions = [
      { center: [-15, 10, -15], size: 12 },
      { center: [15, 10, 15], size: 14 }
    ];

    for (var i = 0; i < machinePositions.length; i++) {
      var config = machinePositions[i];
      var s = config.size;
      var c = config.center;

      var verticesX = [
        [c[0] - s, c[1], c[2] - s],
        [c[0] + s, c[1], c[2] - s],
        [c[0] + s, c[1], c[2] + s],
        [c[0] - s, c[1], c[2] + s],
        [c[0], c[1] + s, c[2]]
      ];

      var edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [0, 4], [1, 4], [2, 4], [3, 4]
      ];

      for (var e = 0; e < edges.length; e++) {
        var edge = edges[e];
        var v1 = verticesX[edge[0]];
        var v2 = verticesX[edge[1]];
        var geom = new THREE.BufferGeometry();
        var pos = new Float32Array([v1[0], v1[1], v1[2], v2[0], v2[1], v2[2]]);
        geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        var mat = new THREE.LineBasicMaterial({ color: frameColor, linewidth: 2 });
        var line = new THREE.LineSegments(geom, mat);
        scene.add(line);
        meshes.push(line);
      }
    }
  }

  function buildChemicalSpills(scene) {
    var spillMaterial = new THREE.MeshStandardMaterial({
      color: 0x001100,
      emissive: 0x00dd00,
      emissiveIntensity: 0.3,
      roughness: 0.9
    });

    var spillPositions = [
      [-20, 0.2, 0],
      [15, 0.2, -25],
      [5, 0.2, 25],
      [-10, 0.2, 20]
    ];

    for (var i = 0; i < spillPositions.length; i++) {
      var pos = spillPositions[i];
      var geometry = new THREE.BoxGeometry(15 + Math.random() * 10, 0.4, 12 + Math.random() * 8);
      var spill = new THREE.Mesh(geometry, spillMaterial);
      spill.position.set(pos[0], pos[1], pos[2]);
      spill.receiveShadow = true;
      scene.add(spill);
      meshes.push(spill);
    }
  }

  function buildContainmentBarrels(scene) {
    var barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x332200,
      roughness: 0.6,
      metalness: 0.4
    });

    var clusterPositions = [
      [-25, 2, 25],
      [25, 2, -25],
      [0, 2, -30]
    ];

    for (var i = 0; i < clusterPositions.length; i++) {
      var cluster = clusterPositions[i];
      for (var x = -1; x <= 1; x++) {
        for (var z = -1; z <= 1; z++) {
          var geometry = new THREE.CylinderGeometry(2, 2, 4, 8);
          var barrel = new THREE.Mesh(geometry, barrelMaterial);
          barrel.position.set(cluster[0] + x * 5, cluster[1] + 2, cluster[2] + z * 5);
          barrel.castShadow = true;
          barrel.receiveShadow = true;
          scene.add(barrel);
          meshes.push(barrel);
        }
      }
    }
  }

  function buildCollapsedRoof(scene) {
    var roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.85,
      metalness: 0.15
    });

    var debrisCount = 8;
    for (var i = 0; i < debrisCount; i++) {
      var geometry = new THREE.BoxGeometry(12, 3, 10);
      var debris = new THREE.Mesh(geometry, roofMaterial);
      debris.position.set(
        (Math.random() - 0.5) * 60,
        18 + Math.random() * 8,
        (Math.random() - 0.5) * 60
      );
      debris.rotation.x = (Math.random() - 0.5) * 0.8;
      debris.rotation.z = (Math.random() - 0.5) * 0.8;
      debris.castShadow = true;
      debris.receiveShadow = true;
      scene.add(debris);
      meshes.push(debris);
    }
  }

  function init(scene, camera) {
    meshes = [];
    lights = [];
    pulseObjects = [];

    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x1a1a1a, 80, 150);

    var ambientLight = new THREE.AmbientLight(0x1a3a1a, 0.3);
    scene.add(ambientLight);
    lights.push(ambientLight);

    buildDecayingWalls(scene);
    buildChemicalVats(scene);
    buildBrokenCatwalks(scene);
    buildEmergencyLights(scene);
    buildSkeletalMachinery(scene);
    buildChemicalSpills(scene);
    buildContainmentBarrels(scene);
    buildCollapsedRoof(scene);
  }

  function update(delta) {
    timeAccumulator += delta;

    for (var i = 0; i < pulseObjects.length; i++) {
      var obj = pulseObjects[i];
      var pulseMag = 0.3 + Math.sin(timeAccumulator * 3 + i) * 0.2;
      obj.material.emissiveIntensity = pulseMag;

      if (obj.parent && obj.parent.isLight === undefined) {
        var lightChild = null;
        for (var j = 0; j < lights.length; j++) {
          if (lights[j].position.equals(obj.position)) {
            lightChild = lights[j];
            break;
          }
        }
        if (lightChild) {
          lightChild.intensity = 0.8 + Math.sin(timeAccumulator * 2.5 + i) * 0.4;
        }
      }
    }

    var flicker = Math.sin(timeAccumulator * 8) * 0.5 + 0.5;
    for (var k = 0; k < lights.length; k++) {
      if (lights[k].isAmbientLight === undefined) {
        lights[k].intensity = (0.8 + flicker * 0.4) * (lights[k].intensity > 1 ? 1 : 0.3);
      }
    }
  }

  function reset() {
    for (var i = 0; i < meshes.length; i++) {
      if (meshes[i].geometry) {
        meshes[i].geometry.dispose();
      }
      if (meshes[i].material) {
        meshes[i].material.dispose();
      }
    }
    meshes = [];
    lights = [];
    pulseObjects = [];
    timeAccumulator = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
