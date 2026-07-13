window.AztecTemple = (function() {
  'use strict';

  var objects = [];
  var torchLights = [];
  var jaguarEyes = [];
  var serpentEyes = [];
  var cenoteWater = null;
  var fireAnimations = [];

  function createPyramidBase(scene) {
    var material = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.8 });
    var geometry = new THREE.BoxGeometry(60, 2, 60);
    var base = new THREE.Mesh(geometry, material);
    base.position.y = 0;
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    objects.push(base);
    return base;
  }

  function createPyramidLayers(scene) {
    var layers = [];
    var materials = [
      new THREE.MeshStandardMaterial({ color: 0x9B8B5C, roughness: 0.7 }),
      new THREE.MeshStandardMaterial({ color: 0x8B7B4C, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: 0x7B6B3C, roughness: 0.9 })
    ];

    for (var i = 0; i < 4; i++) {
      var width = 50 - (i * 10);
      var geometry = new THREE.BoxGeometry(width, 5, width);
      var material = materials[i % 3];
      var layer = new THREE.Mesh(geometry, material);
      layer.position.y = 2 + (i * 5);
      layer.castShadow = true;
      layer.receiveShadow = true;
      scene.add(layer);
      objects.push(layer);
      layers.push(layer);
    }
    return layers;
  }

  function createTemple(scene) {
    var material = new THREE.MeshStandardMaterial({ color: 0xA0826D, roughness: 0.6 });
    var geometry = new THREE.BoxGeometry(25, 12, 20);
    var temple = new THREE.Mesh(geometry, material);
    temple.position.y = 24;
    temple.position.z = -12;
    temple.castShadow = true;
    temple.receiveShadow = true;
    scene.add(temple);
    objects.push(temple);
    return temple;
  }

  function createSacrificalAltar(scene) {
    var altarMat = new THREE.MeshStandardMaterial({ color: 0x6B4423, roughness: 0.9 });
    var altarGeo = new THREE.BoxGeometry(8, 4, 6);
    var altar = new THREE.Mesh(altarGeo, altarMat);
    altar.position.y = 23;
    altar.position.z = -12;
    altar.castShadow = true;
    altar.receiveShadow = true;
    scene.add(altar);
    objects.push(altar);

    var bloodGrooves = createBloodGrooves(scene, altar);
    return altar;
  }

  function createBloodGrooves(scene, altar) {
    var groovesMat = new THREE.LineBasicMaterial({ color: 0x8B0000, linewidth: 2 });
    var groovesGeo = new THREE.BufferGeometry();
    var positions = new Float32Array([
      -4, 4, -3,  4, 4, -3,
      -4, 4, 0,   4, 4, 0,
      -4, 4, 3,   4, 4, 3,
      -2, 4, -3,  -2, 4, 3,
      0, 4, -3,   0, 4, 3,
      2, 4, -3,   2, 4, 3
    ]);
    groovesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var grooves = new THREE.LineSegments(groovesMat, groovesGeo);
    grooves.position.copy(altar.position);
    scene.add(grooves);
    objects.push(grooves);
    return grooves;
  }

  function createSerpentHeadPillars(scene) {
    var pillars = [];
    var positions = [
      { x: -15, z: -5 },
      { x: 15, z: -5 },
      { x: -15, z: -18 },
      { x: 15, z: -18 }
    ];

    positions.forEach(function(pos) {
      var serpentMat = new THREE.MeshStandardMaterial({ color: 0x3D5C2C, roughness: 0.7 });
      var pillarGeo = new THREE.CylinderGeometry(2, 2.5, 15, 6);
      var pillar = new THREE.Mesh(pillarGeo, serpentMat);
      pillar.position.set(pos.x, 8, pos.z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
      objects.push(pillar);
      pillars.push(pillar);

      var headGeo = new THREE.ConeGeometry(2.5, 3, 6);
      var head = new THREE.Mesh(headGeo, serpentMat);
      head.position.set(pos.x, 23, pos.z);
      head.rotation.z = Math.PI / 2;
      head.castShadow = true;
      head.receiveShadow = true;
      scene.add(head);
      objects.push(head);

      var eyeMat = new THREE.MeshStandardMaterial({ color: 0x00FF00, emissive: 0x00FF00, emissiveIntensity: 0.3 });
      var eyeGeo = new THREE.SphereGeometry(0.5, 8, 8);
      var eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(pos.x + 2, 23.5, pos.z);
      scene.add(eye);
      objects.push(eye);
      serpentEyes.push({ mesh: eye, intensity: 0.3, direction: 1 });
    });

    return pillars;
  }

  function createJaguarStatue(scene) {
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
    var bodyGeo = new THREE.BoxGeometry(6, 8, 10);
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(-25, 5, 10);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    objects.push(body);

    var headGeo = new THREE.SphereGeometry(3, 8, 8);
    var head = new THREE.Mesh(headGeo, bodyMat);
    head.position.set(-25, 12, 15);
    head.castShadow = true;
    head.receiveShadow = true;
    scene.add(head);
    objects.push(head);

    var eyeMat = new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0xFFFF00, emissiveIntensity: 0.5 });
    var eyeGeo = new THREE.SphereGeometry(0.8, 8, 8);
    var leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-26.5, 13, 17.5);
    scene.add(leftEye);
    objects.push(leftEye);
    jaguarEyes.push({ mesh: leftEye, intensity: 0.5, direction: 1 });

    var rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(-23.5, 13, 17.5);
    scene.add(rightEye);
    objects.push(rightEye);
    jaguarEyes.push({ mesh: rightEye, intensity: 0.5, direction: 1 });

    return body;
  }

  function createCalendarDisc(scene) {
    var discMat = new THREE.MeshStandardMaterial({ color: 0x9B8B6B, roughness: 0.6 });
    var discGeo = new THREE.CylinderGeometry(8, 8, 0.5, 20);
    var disc = new THREE.Mesh(discGeo, discMat);
    disc.position.set(25, 23, -12);
    disc.castShadow = true;
    disc.receiveShadow = true;
    scene.add(disc);
    objects.push(disc);

    var carvingMat = new THREE.LineBasicMaterial({ color: 0x4A3728, linewidth: 1 });
    var carvingGeo = new THREE.BufferGeometry();
    var positions = [];
    for (var i = 0; i < 20; i++) {
      var angle = (i / 20) * Math.PI * 2;
      var x = Math.cos(angle) * 7;
      var z = Math.sin(angle) * 7;
      var x2 = Math.cos(angle) * 8;
      var z2 = Math.sin(angle) * 8;
      positions.push(x, 0, z, x2, 0, z2);
    }
    carvingGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    var carvings = new THREE.LineSegments(carvingMat, carvingGeo);
    carvings.position.copy(disc.position);
    scene.add(carvings);
    objects.push(carvings);

    return disc;
  }

  function createCenote(scene) {
    var waterMat = new THREE.MeshStandardMaterial({
      color: 0x1E4D6B,
      metalness: 0.4,
      roughness: 0.2,
      emissive: 0x0A2A3E,
      emissiveIntensity: 0.2
    });
    var waterGeo = new THREE.CylinderGeometry(15, 15, 0.3, 32);
    var water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(30, 0.5, 25);
    water.receiveShadow = true;
    scene.add(water);
    objects.push(water);
    cenoteWater = water;

    var wallMat = new THREE.MeshStandardMaterial({ color: 0x5C4436, roughness: 0.9 });
    var wallGeo = new THREE.CylinderGeometry(14.8, 14.8, 8, 32);
    var wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(30, -4, 25);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    objects.push(wall);

    return water;
  }

  function createObsidianMirror(scene) {
    var mirrorMat = new THREE.MeshStandardMaterial({
      color: 0x1A1A1A,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x333333,
      emissiveIntensity: 0.3
    });
    var mirrorGeo = new THREE.SphereGeometry(3, 16, 16);
    var mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
    mirror.position.set(-30, 15, -15);
    mirror.castShadow = true;
    mirror.receiveShadow = true;
    scene.add(mirror);
    objects.push(mirror);
    return mirror;
  }

  function createRelieflWalls(scene) {
    var wallMat = new THREE.MeshStandardMaterial({ color: 0x7B6B5B, roughness: 0.75 });
    var wallGeo = new THREE.BoxGeometry(50, 8, 1);
    var walls = [];

    var positions = [
      { x: 0, z: 35 },
      { x: 0, z: -35 },
      { x: 35, z: 0 },
      { x: -35, z: 0 }
    ];

    positions.forEach(function(pos) {
      var wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(pos.x, 10, pos.z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
      objects.push(wall);
      walls.push(wall);
    });

    return walls;
  }

  function createTorchPoles(scene) {
    var torches = [];
    var positions = [
      { x: -20, z: 20 },
      { x: 20, z: 20 },
      { x: -20, z: -25 },
      { x: 20, z: -25 }
    ];

    positions.forEach(function(pos) {
      var poleMat = new THREE.MeshStandardMaterial({ color: 0x2C1810, roughness: 0.9 });
      var poleGeo = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
      var pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(pos.x, 6, pos.z);
      pole.castShadow = true;
      pole.receiveShadow = true;
      scene.add(pole);
      objects.push(pole);

      var flameMat = new THREE.MeshStandardMaterial({
        color: 0xFF6B00,
        emissive: 0xFF4500,
        emissiveIntensity: 0.8
      });
      var flameGeo = new THREE.ConeGeometry(1.2, 3, 8);
      var flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(pos.x, 14, pos.z);
      scene.add(flame);
      objects.push(flame);

      var torchLight = new THREE.PointLight(0xFF6B00, 1.5, 20);
      torchLight.position.set(pos.x, 14, pos.z);
      torchLight.castShadow = true;
      scene.add(torchLight);
      torchLights.push({ light: torchLight, flame: flame, intensity: 1.5, flicker: 0 });
    });

    return torches;
  }

  function createJungleOvergrowth(scene) {
    var vines = [];
    var vineCount = 8;

    for (var i = 0; i < vineCount; i++) {
      var vineMat = new THREE.MeshStandardMaterial({ color: 0x2D4A2B, roughness: 0.8 });
      var vineGeo = new THREE.CylinderGeometry(0.3, 0.3, 20, 4);
      var vine = new THREE.Mesh(vineGeo, vineMat);
      var angle = (i / vineCount) * Math.PI * 2;
      vine.position.set(
        Math.cos(angle) * 35,
        5,
        Math.sin(angle) * 35
      );
      vine.rotation.z = Math.random() * 0.5;
      vine.castShadow = true;
      vine.receiveShadow = true;
      scene.add(vine);
      objects.push(vine);
      vines.push(vine);
    }

    return vines;
  }

  function createStoneStairs(scene) {
    var stairs = [];
    var material = new THREE.MeshStandardMaterial({ color: 0x8B7D6B, roughness: 0.85 });

    for (var i = 0; i < 8; i++) {
      var stairGeo = new THREE.BoxGeometry(40 - (i * 2), 1.2, 2);
      var stair = new THREE.Mesh(stairGeo, material);
      stair.position.set(0, 2 + (i * 1.2), -30 + (i * 2));
      stair.castShadow = true;
      stair.receiveShadow = true;
      scene.add(stair);
      objects.push(stair);
      stairs.push(stair);
    }

    return stairs;
  }

  function init(scene, camera) {
    objects = [];
    torchLights = [];
    jaguarEyes = [];
    serpentEyes = [];
    fireAnimations = [];

    createPyramidBase(scene);
    createPyramidLayers(scene);
    createTemple(scene);
    createSacrificalAltar(scene);
    createSerpentHeadPillars(scene);
    createJaguarStatue(scene);
    createCalendarDisc(scene);
    createCenote(scene);
    createObsidianMirror(scene);
    createRelieflWalls(scene);
    createTorchPoles(scene);
    createJungleOvergrowth(scene);
    createStoneStairs(scene);
  }

  function update(delta) {
    var time = Date.now() * 0.001;

    torchLights.forEach(function(torch) {
      torch.flicker += Math.random() * 0.1 - 0.05;
      torch.flicker = Math.max(0.5, Math.min(1.5, torch.flicker));
      torch.light.intensity = torch.intensity * torch.flicker;
      torch.flame.material.emissiveIntensity = 0.6 + (torch.flicker * 0.2);
    });

    jaguarEyes.forEach(function(eye) {
      eye.intensity += eye.direction * 0.05;
      if (eye.intensity > 1) {
        eye.intensity = 1;
        eye.direction = -1;
      } else if (eye.intensity < 0.3) {
        eye.intensity = 0.3;
        eye.direction = 1;
      }
      eye.mesh.material.emissiveIntensity = eye.intensity;
    });

    serpentEyes.forEach(function(eye) {
      eye.intensity += eye.direction * 0.03;
      if (eye.intensity > 0.8) {
        eye.intensity = 0.8;
        eye.direction = -1;
      } else if (eye.intensity < 0.2) {
        eye.intensity = 0.2;
        eye.direction = 1;
      }
      eye.mesh.material.emissiveIntensity = eye.intensity;
    });

    if (cenoteWater) {
      var rippleScale = 1 + Math.sin(time * 3) * 0.05;
      cenoteWater.scale.set(rippleScale, 1, rippleScale);
    }

    objects.forEach(function(obj) {
      if (obj.userData && obj.userData.wobble) {
        obj.position.y += Math.sin(time * 2) * 0.01;
      }
    });
  }

  function reset() {
    objects.forEach(function(obj) {
      if (obj.parent) {
        obj.parent.remove(obj);
      }
    });

    torchLights.forEach(function(torch) {
      if (torch.light.parent) {
        torch.light.parent.remove(torch.light);
      }
    });

    objects = [];
    torchLights = [];
    jaguarEyes = [];
    serpentEyes = [];
    fireAnimations = [];
    cenoteWater = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
