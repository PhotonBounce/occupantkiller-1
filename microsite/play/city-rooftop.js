window.CityRooftop = (function() {
  'use strict';

  var meshes = [];
  var targetMesh = null;
  var helicopterSpotlight = null;
  var neonSigns = [];
  var acUnits = [];
  var pigeons = [];
  var windFlags = [];
  var cityLights = [];
  var time = 0;
  var targetPosition = { x: 0, y: 0, z: 0 };
  var targetVelocity = { x: 0.5, y: 0, z: 0 };

  var colors = {
    concrete: 0x888888,
    acWhite: 0xEEEEEE,
    waterTowerBrown: 0x8B6914,
    antennaMetal: 0x666666,
    neonPink: 0xFF1493,
    nightSky: 0x1A1A2E,
    steelGray: 0x444444,
    darkConcrete: 0x555555,
    roofEdge: 0x333333
  };

  function createBuilding(scene, x, y, z, width, depth, height) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshStandardMaterial({
      color: colors.concrete,
      roughness: 0.8,
      metalness: 0.1
    });
    var building = new THREE.Mesh(geometry, material);
    building.position.set(x, y, z);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    meshes.push(building);
    return building;
  }

  function createRooftop(scene, x, y, z, width, depth) {
    var geometry = new THREE.BoxGeometry(width, 0.5, depth);
    var material = new THREE.MeshStandardMaterial({
      color: colors.darkConcrete,
      roughness: 0.9,
      metalness: 0.05
    });
    var rooftop = new THREE.Mesh(geometry, material);
    rooftop.position.set(x, y, z);
    rooftop.castShadow = true;
    rooftop.receiveShadow = true;
    scene.add(rooftop);
    meshes.push(rooftop);
    return rooftop;
  }

  function createWaterTower(scene, x, y, z) {
    var geometry = new THREE.CylinderGeometry(2, 2, 4, 16);
    var material = new THREE.MeshStandardMaterial({
      color: colors.waterTowerBrown,
      roughness: 0.7,
      metalness: 0.3
    });
    var tower = new THREE.Mesh(geometry, material);
    tower.position.set(x, y, z);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    meshes.push(tower);

    var topGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.3, 16);
    var topMaterial = new THREE.MeshStandardMaterial({
      color: colors.roofEdge,
      roughness: 0.6,
      metalness: 0.4
    });
    var top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.set(x, y + 2.3, z);
    top.castShadow = true;
    top.receiveShadow = true;
    scene.add(top);
    meshes.push(top);

    return tower;
  }

  function createAntennaMast(scene, x, y, z) {
    var poleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 6, 8);
    var metalMaterial = new THREE.MeshStandardMaterial({
      color: colors.antennaMetal,
      roughness: 0.4,
      metalness: 0.9
    });
    var pole = new THREE.Mesh(poleGeometry, metalMaterial);
    pole.position.set(x, y + 3, z);
    pole.castShadow = true;
    pole.receiveShadow = true;
    scene.add(pole);
    meshes.push(pole);

    var points = [
      new THREE.Vector3(x, y + 5, z),
      new THREE.Vector3(x + 1.5, y + 6.5, z),
      new THREE.Vector3(x - 1.5, y + 6.5, z),
      new THREE.Vector3(x, y + 5, z)
    ];
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var material = new THREE.LineBasicMaterial({ color: colors.antennaMetal, linewidth: 2 });
    var lines = new THREE.LineSegments(geometry, material);
    scene.add(lines);
    meshes.push(lines);

    return pole;
  }

  function createACUnit(scene, x, y, z) {
    var mainGeometry = new THREE.BoxGeometry(1.5, 0.8, 1.5);
    var metalMaterial = new THREE.MeshStandardMaterial({
      color: colors.acWhite,
      roughness: 0.5,
      metalness: 0.6
    });
    var unit = new THREE.Mesh(mainGeometry, metalMaterial);
    unit.position.set(x, y, z);
    unit.castShadow = true;
    unit.receiveShadow = true;
    scene.add(unit);
    meshes.push(unit);
    acUnits.push(unit);

    var fanGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 16);
    var fan = new THREE.Mesh(fanGeometry, metalMaterial);
    fan.position.set(x, y + 0.5, z);
    fan.castShadow = true;
    fan.receiveShadow = true;
    scene.add(fan);
    meshes.push(fan);
    acUnits.push(fan);

    return unit;
  }

  function createSkylight(scene, x, y, z) {
    var geometry = new THREE.BoxGeometry(1.2, 0.1, 1.2);
    var material = new THREE.MeshStandardMaterial({
      color: 0xAAAAAA,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.6
    });
    var skylight = new THREE.Mesh(geometry, material);
    skylight.position.set(x, y, z);
    skylight.castShadow = true;
    skylight.receiveShadow = true;
    scene.add(skylight);
    meshes.push(skylight);
    return skylight;
  }

  function createRailing(scene, x, y, z, length, isVertical) {
    var posts = [];
    var postCount = Math.ceil(length / 1.5);

    for (var i = 0; i < postCount; i++) {
      var offsetX = isVertical ? 0 : (i * (length / postCount) - length / 2);
      var offsetZ = isVertical ? (i * (length / postCount) - length / 2) : 0;

      var postGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
      var material = new THREE.MeshStandardMaterial({
        color: colors.steelGray,
        roughness: 0.6,
        metalness: 0.7
      });
      var post = new THREE.Mesh(postGeometry, material);
      post.position.set(x + offsetX, y + 0.5, z + offsetZ);
      post.castShadow = true;
      post.receiveShadow = true;
      scene.add(post);
      meshes.push(post);
      posts.push(post);
    }

    var railGeometry = new THREE.BoxGeometry(length, 0.08, 0.1);
    var railMaterial = new THREE.MeshStandardMaterial({
      color: colors.steelGray,
      roughness: 0.6,
      metalness: 0.7
    });
    var rail = new THREE.Mesh(railGeometry, railMaterial);
    rail.position.set(x, y + 1, z);
    rail.castShadow = true;
    rail.receiveShadow = true;
    scene.add(rail);
    meshes.push(rail);

    return posts;
  }

  function createSatelliteDish(scene, x, y, z) {
    var supportGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
    var metalMaterial = new THREE.MeshStandardMaterial({
      color: colors.antennaMetal,
      roughness: 0.5,
      metalness: 0.8
    });
    var support = new THREE.Mesh(supportGeometry, metalMaterial);
    support.position.set(x, y + 0.75, z);
    support.castShadow = true;
    support.receiveShadow = true;
    scene.add(support);
    meshes.push(support);

    var dishGeometry = new THREE.SphereGeometry(1.2, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    var dish = new THREE.Mesh(dishGeometry, metalMaterial);
    dish.position.set(x, y + 1.8, z);
    dish.rotation.x = 0.4;
    dish.rotation.z = 0.2;
    dish.castShadow = true;
    dish.receiveShadow = true;
    scene.add(dish);
    meshes.push(dish);

    return dish;
  }

  function createVentilationPipe(scene, x, y, z) {
    var pipeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
    var pipeMaterial = new THREE.MeshStandardMaterial({
      color: colors.steelGray,
      roughness: 0.7,
      metalness: 0.6
    });
    var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe.position.set(x, y + 0.75, z);
    pipe.castShadow = true;
    pipe.receiveShadow = true;
    scene.add(pipe);
    meshes.push(pipe);

    var capGeometry = new THREE.ConeGeometry(0.35, 0.4, 8);
    var capMaterial = new THREE.MeshStandardMaterial({
      color: colors.roofEdge,
      roughness: 0.6,
      metalness: 0.5
    });
    var cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.set(x, y + 1.5, z);
    cap.castShadow = true;
    cap.receiveShadow = true;
    scene.add(cap);
    meshes.push(cap);

    return pipe;
  }

  function createNeonSign(scene, x, y, z, width) {
    var signGeometry = new THREE.BoxGeometry(width, 0.3, 0.1);
    var signMaterial = new THREE.MeshStandardMaterial({
      color: colors.neonPink,
      emissive: colors.neonPink,
      emissiveIntensity: 0.7,
      roughness: 0.3,
      metalness: 0.8
    });
    var sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(x, y, z);
    sign.castShadow = true;
    sign.receiveShadow = true;
    scene.add(sign);
    meshes.push(sign);
    neonSigns.push({
      mesh: sign,
      baseIntensity: 0.7,
      flickerSpeed: 3 + Math.random() * 2
    });

    return sign;
  }

  function createStairs(scene, x, y, z) {
    var stepCount = 5;
    var stepHeight = 0.3;
    var stepDepth = 0.4;

    for (var i = 0; i < stepCount; i++) {
      var stepGeometry = new THREE.BoxGeometry(2, stepHeight, stepDepth);
      var stepMaterial = new THREE.MeshStandardMaterial({
        color: colors.concrete,
        roughness: 0.8,
        metalness: 0.1
      });
      var step = new THREE.Mesh(stepGeometry, stepMaterial);
      step.position.set(x, y + (i * stepHeight), z + (i * stepDepth));
      step.castShadow = true;
      step.receiveShadow = true;
      scene.add(step);
      meshes.push(step);
    }
  }

  function createWindFlag(scene, x, y, z) {
    var flagGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.02);
    var flagMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6B35,
      roughness: 0.5,
      metalness: 0.2
    });
    var flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(x, y, z);
    flag.castShadow = true;
    flag.receiveShadow = true;
    scene.add(flag);
    meshes.push(flag);
    windFlags.push({
      mesh: flag,
      baseRotation: flag.rotation.y,
      frequency: 2 + Math.random()
    });

    return flag;
  }

  function createTargetFigure(scene, startX, startY, startZ) {
    var bodyGeometry = new THREE.BoxGeometry(0.4, 1.5, 0.3);
    var skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xCC8855,
      roughness: 0.6,
      metalness: 0.1
    });
    var body = new THREE.Mesh(bodyGeometry, skinMaterial);
    body.position.set(startX, startY + 0.75, startZ);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    meshes.push(body);

    var headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    var head = new THREE.Mesh(headGeometry, skinMaterial);
    head.position.set(startX, startY + 2.2, startZ);
    head.castShadow = true;
    head.receiveShadow = true;
    scene.add(head);
    meshes.push(head);

    var armGeometry = new THREE.BoxGeometry(0.2, 1, 0.2);
    var armMaterial = new THREE.MeshStandardMaterial({
      color: 0xDD9966,
      roughness: 0.6,
      metalness: 0.1
    });
    var leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(startX - 0.5, startY + 1, startZ);
    leftArm.castShadow = true;
    leftArm.receiveShadow = true;
    scene.add(leftArm);
    meshes.push(leftArm);

    var rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(startX + 0.5, startY + 1, startZ);
    rightArm.castShadow = true;
    rightArm.receiveShadow = true;
    scene.add(rightArm);
    meshes.push(rightArm);

    var legGeometry = new THREE.BoxGeometry(0.2, 0.9, 0.2);
    var legMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7,
      metalness: 0.1
    });
    var leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(startX - 0.2, startY + 0.3, startZ);
    leftLeg.castShadow = true;
    leftLeg.receiveShadow = true;
    scene.add(leftLeg);
    meshes.push(leftLeg);

    var rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(startX + 0.2, startY + 0.3, startZ);
    rightLeg.castShadow = true;
    rightLeg.receiveShadow = true;
    scene.add(rightLeg);
    meshes.push(rightLeg);

    targetMesh = body;
    targetPosition.x = startX;
    targetPosition.y = startY;
    targetPosition.z = startZ;

    return {
      body: body,
      head: head,
      leftArm: leftArm,
      rightArm: rightArm,
      leftLeg: leftLeg,
      rightLeg: rightLeg
    };
  }

  function createPigeon(scene, x, y, z) {
    var bodyGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    var birdMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.8,
      metalness: 0.1
    });
    var body = new THREE.Mesh(bodyGeometry, birdMaterial);
    body.position.set(x, y, z);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    meshes.push(body);

    var headGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    var head = new THREE.Mesh(headGeometry, birdMaterial);
    head.position.set(x + 0.08, y + 0.05, z);
    head.castShadow = true;
    head.receiveShadow = true;
    scene.add(head);
    meshes.push(head);

    return {
      body: body,
      head: head,
      startX: x,
      startY: y,
      startZ: z,
      vx: (Math.random() - 0.5) * 2,
      vz: (Math.random() - 0.5) * 2
    };
  }

  function createHelicopterSpotlight(scene) {
    var light = new THREE.SpotLight(0xFFFFFF, 1.5, 150, Math.PI / 6, 0.8, 2);
    light.position.set(40, 60, 20);
    light.target.position.set(25, 20, 0);
    light.castShadow = true;
    scene.add(light);
    scene.add(light.target);

    helicopterSpotlight = light;
    return light;
  }

  function createCityLights(scene) {
    var positions = [
      { x: -80, y: 5, z: -60 },
      { x: -70, y: 8, z: 50 },
      { x: 60, y: 6, z: -70 },
      { x: 75, y: 7, z: 40 },
      { x: -50, y: 4, z: 80 },
      { x: 40, y: 6, z: 70 }
    ];

    positions.forEach(function(pos) {
      var light = new THREE.PointLight(0xFFCCFF, 0.3, 200);
      light.position.set(pos.x, pos.y, pos.z);
      scene.add(light);
      cityLights.push(light);
    });
  }

  function init(scene, camera) {
    time = 0;
    meshes = [];
    neonSigns = [];
    acUnits = [];
    pigeons = [];
    windFlags = [];
    cityLights = [];

    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(50, 40, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    var building1 = createBuilding(scene, 0, -5, 0, 20, 20, 30);
    var rooftop1 = createRooftop(scene, 0, 15, 0, 20, 20);

    var building2 = createBuilding(scene, 30, -6, 0, 18, 18, 32);
    var rooftop2 = createRooftop(scene, 30, 16, 0, 18, 18);

    var building3 = createBuilding(scene, -35, -7, 0, 22, 22, 28);
    var rooftop3 = createRooftop(scene, -35, 14, 0, 22, 22);

    var building4 = createBuilding(scene, 0, -6, 40, 16, 16, 26);
    var rooftop4 = createRooftop(scene, 0, 13, 40, 16, 16);

    var building5 = createBuilding(scene, 30, -5, 45, 20, 20, 30);
    var rooftop5 = createRooftop(scene, 30, 15, 45, 20, 20);

    var building6 = createBuilding(scene, -30, -8, 35, 18, 18, 24);
    var rooftop6 = createRooftop(scene, -30, 12, 35, 18, 18);

    var building7 = createBuilding(scene, -60, -4, 10, 24, 24, 35);
    var rooftop7 = createRooftop(scene, -60, 17.5, 10, 24, 24);

    var building8 = createBuilding(scene, 60, -7, -20, 20, 20, 28);
    var rooftop8 = createRooftop(scene, 60, 14, -20, 20, 20);

    createWaterTower(scene, 5, 16, 5);
    createWaterTower(scene, 28, 17, 10);
    createWaterTower(scene, -32, 15, 5);

    createAntennaMast(scene, 10, 15, -8);
    createAntennaMast(scene, -25, 14, 15);
    createAntennaMast(scene, 35, 16, 25);

    createACUnit(scene, 5, 15.5, 8);
    createACUnit(scene, 3, 15.5, -6);
    createACUnit(scene, -3, 15.5, 10);
    createACUnit(scene, 28, 16.5, 8);
    createACUnit(scene, 32, 16.5, -5);
    createACUnit(scene, -28, 14.5, 8);
    createACUnit(scene, -35, 14.5, 10);
    createACUnit(scene, 58, 14.5, -8);

    createSkylight(scene, 8, 15.25, 2);
    createSkylight(scene, -5, 15.25, 12);
    createSkylight(scene, 28, 16.25, 5);
    createSkylight(scene, -32, 14.25, -5);

    createRailing(scene, 10, 15, 10.5, 16, false);
    createRailing(scene, 30, 16, 9.5, 14, false);
    createRailing(scene, -35, 14, 11.5, 20, false);

    createSatelliteDish(scene, -8, 15, 6);
    createSatelliteDish(scene, 25, 16, -8);
    createSatelliteDish(scene, -32, 14, 12);

    createVentilationPipe(scene, 0, 15, -10);
    createVentilationPipe(scene, 15, 16, 8);
    createVentilationPipe(scene, -20, 14, 15);
    createVentilationPipe(scene, 32, 16, 10);

    createNeonSign(scene, 62, 15, -18, 12);
    createNeonSign(scene, -65, 18, 12, 14);
    createNeonSign(scene, 10, 16, 48, 10);

    createStairs(scene, 12, 15, 18);
    createStairs(scene, -28, 14, 25);

    createWindFlag(scene, -55, 18, 8);
    createWindFlag(scene, 50, 15, -18);

    createTargetFigure(scene, 0, 15, 0);

    for (var i = 0; i < 8; i++) {
      var px = (Math.random() - 0.5) * 80;
      var pz = (Math.random() - 0.5) * 80;
      var py = 25 + Math.random() * 15;
      pigeons.push(createPigeon(scene, px, py, pz));
    }

    createHelicopterSpotlight(scene);
    createCityLights(scene);
  }

  function update(delta) {
    time += delta;

    if (targetMesh) {
      targetPosition.x += targetVelocity.x * delta;
      targetPosition.z += targetVelocity.z * delta;

      if (targetPosition.x > 50 || targetPosition.x < -70) {
        targetVelocity.x *= -1;
      }
      if (targetPosition.z > 50 || targetPosition.z < -20) {
        targetVelocity.z *= -1;
      }

      targetMesh.position.x = targetPosition.x;
      targetMesh.position.z = targetPosition.z;
    }

    neonSigns.forEach(function(sign) {
      var flicker = Math.sin(time * sign.flickerSpeed) * 0.3 + 0.7;
      sign.mesh.material.emissiveIntensity = sign.baseIntensity * flicker;
    });

    acUnits.forEach(function(unit) {
      if (unit.rotation) {
        unit.rotation.y += 0.02;
      }
    });

    pigeons.forEach(function(pigeon) {
      pigeon.body.position.x += pigeon.vx * delta;
      pigeon.body.position.z += pigeon.vz * delta;
      pigeon.head.position.x = pigeon.body.position.x + 0.08;
      pigeon.head.position.z = pigeon.body.position.z;

      if (Math.random() > 0.98) {
        pigeon.vx = (Math.random() - 0.5) * 3;
        pigeon.vz = (Math.random() - 0.5) * 3;
      }

      if (pigeon.body.position.x > 50 || pigeon.body.position.x < -80) {
        pigeon.vx *= -1;
      }
      if (pigeon.body.position.z > 50 || pigeon.body.position.z < -80) {
        pigeon.vz *= -1;
      }
    });

    windFlags.forEach(function(flag) {
      flag.mesh.rotation.z = Math.sin(time * flag.frequency) * 0.3;
    });

    if (helicopterSpotlight) {
      helicopterSpotlight.position.x = 40 + Math.sin(time * 0.3) * 30;
      helicopterSpotlight.position.z = 20 + Math.cos(time * 0.25) * 25;
      helicopterSpotlight.target.position.x = helicopterSpotlight.position.x - 15;
      helicopterSpotlight.target.position.z = helicopterSpotlight.position.z - 10;
    }

    cityLights.forEach(function(light, idx) {
      var flicker = Math.sin(time * (0.5 + idx * 0.1)) * 0.1 + 0.3;
      light.intensity = Math.max(0.1, 0.3 + flicker);
    });
  }

  function reset() {
    meshes.forEach(function(mesh) {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(function(m) { m.dispose(); });
        } else {
          mesh.material.dispose();
        }
      }
    });
    meshes = [];
    neonSigns = [];
    acUnits = [];
    pigeons = [];
    windFlags = [];
    cityLights = [];
    targetMesh = null;
    helicopterSpotlight = null;
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
