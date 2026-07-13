window.HauntedVillage = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var allGameObjects = [];
  var enemies = [];
  var keysPressed = {};
  var lastHPress = 0;
  var hVToggleActive = false;
  var hudElement = null;
  var ritualDisrupted = false;
  var cultistsKilled = 0;
  var entitiesBanished = 0;
  var bonfire = null;
  var ritualCircle = null;
  var fogLanterns = [];
  var time = 0;

  function createGameObject(geometry, material, position, scale, rotation) {
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    if (scale) {
      mesh.scale.set(scale.x, scale.y, scale.z);
    }
    if (rotation) {
      mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    }
    scene.add(mesh);
    allGameObjects.push(mesh);
    return mesh;
  }

  function createLineSegments(points, color, linewidth) {
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    var material = new THREE.LineBasicMaterial({ color: color, linewidth: linewidth });
    var line = new THREE.LineSegments(geometry, material);
    scene.add(line);
    allGameObjects.push(line);
    return line;
  }

  function createCottage(x, z) {
    var mainMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3728, emissive: 0x1a1410 });
    var roofMaterial = new THREE.MeshPhongMaterial({ color: 0x2a1810, emissive: 0x0a0a0a });
    var brokenMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1515, emissive: 0x000000 });

    var cottage = new THREE.Group();

    var mainBox = new THREE.Mesh(
      new THREE.BoxGeometry(6, 5, 6),
      mainMaterial
    );
    mainBox.position.y = 2.5;
    cottage.add(mainBox);
    allGameObjects.push(mainBox);
    scene.add(mainBox);

    var roofGeom = new THREE.BoxGeometry(6.5, 0.8, 6.5);
    var roof = new THREE.Mesh(roofGeom, roofMaterial);
    roof.position.y = 5.4;
    cottage.add(roof);
    allGameObjects.push(roof);
    scene.add(roof);

    var brokenWallGeom = new THREE.BoxGeometry(2, 3, 0.5);
    var brokenWall = new THREE.Mesh(brokenWallGeom, brokenMaterial);
    brokenWall.position.set(x + 3, 3, z + 2.5);
    scene.add(brokenWall);
    allGameObjects.push(brokenWall);

    cottage.position.set(x, 0, z);
    return cottage;
  }

  function createHeadstone(x, z) {
    var geometry = new THREE.BoxGeometry(1, 3, 0.3);
    var material = new THREE.MeshPhongMaterial({ color: 0x6b7280, emissive: 0x2a2a2a });
    var headstone = new THREE.Mesh(geometry, material);
    headstone.position.set(x, 1.5, z);
    scene.add(headstone);
    allGameObjects.push(headstone);
    return headstone;
  }

  function createCemetery(centerX, centerZ) {
    var fencePoints = [];
    var fenceSize = 30;
    var steps = 16;
    for (var i = 0; i <= steps; i++) {
      var angle = (i / steps) * Math.PI * 2;
      var x1 = centerX + Math.cos(angle) * fenceSize;
      var z1 = centerZ + Math.sin(angle) * fenceSize;
      var x2 = centerX + Math.cos(angle) * fenceSize;
      var z2 = centerZ + Math.sin(angle) * fenceSize;
      fencePoints.push(x1, 0, z1);
      fencePoints.push(x2, 2.5, z2);
    }
    createLineSegments(fencePoints, 0x2a2a2a, 2);

    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 5; col++) {
        var headX = centerX - 10 + col * 5;
        var headZ = centerZ - 8 + row * 4;
        createHeadstone(headX, headZ);
      }
    }
  }

  function createRitualCircle(x, z) {
    var circleGeometry = new THREE.CylinderGeometry(10, 10, 0.2, 32);
    var circleMaterial = new THREE.MeshPhongMaterial({
      color: 0x3a1a4a,
      emissive: 0x6b2d9b,
      emissiveIntensity: 0.4
    });
    var circle = new THREE.Mesh(circleGeometry, circleMaterial);
    circle.position.set(x, 0.1, z);
    scene.add(circle);
    allGameObjects.push(circle);

    var runeSize = 1.5;
    var runePositions = [
      { x: x - 5, z: z - 5 },
      { x: x + 5, z: z - 5 },
      { x: x - 5, z: z + 5 },
      { x: x + 5, z: z + 5 }
    ];

    for (var i = 0; i < runePositions.length; i++) {
      var runeGeometry = new THREE.BoxGeometry(runeSize, runeSize, 0.1);
      var runeMaterial = new THREE.MeshPhongMaterial({
        color: 0x5a1a7a,
        emissive: 0x9b4db3,
        emissiveIntensity: 0.6
      });
      var rune = new THREE.Mesh(runeGeometry, runeMaterial);
      rune.position.set(runePositions[i].x, 0.2, runePositions[i].z);
      scene.add(rune);
      allGameObjects.push(rune);
    }

    ritualCircle = circle;
    return circle;
  }

  function createDeadTree(x, z) {
    var trunkGeometry = new THREE.CylinderGeometry(0.8, 1.2, 12, 8);
    var trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x2a1a0a, emissive: 0x1a0a00 });
    var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 6, z);
    scene.add(trunk);
    allGameObjects.push(trunk);

    var branchPoints = [];
    var branchAngles = [0, 1.5, 3, 4.5];
    for (var i = 0; i < branchAngles.length; i++) {
      var angle = branchAngles[i];
      var baseX = x + Math.cos(angle) * 1;
      var baseZ = z + Math.sin(angle) * 1;
      var tipX = x + Math.cos(angle) * 6;
      var tipZ = z + Math.sin(angle) * 6;
      branchPoints.push(baseX, 8, baseZ);
      branchPoints.push(tipX, 10, tipZ);
    }
    createLineSegments(branchPoints, 0x1a0a00, 1);

    return trunk;
  }

  function createWell(x, z) {
    var shaftGeometry = new THREE.CylinderGeometry(3, 3.5, 6, 8);
    var stoneMaterial = new THREE.MeshPhongMaterial({ color: 0x5a5a5a, emissive: 0x2a2a2a });
    var shaft = new THREE.Mesh(shaftGeometry, stoneMaterial);
    shaft.position.set(x, 3, z);
    scene.add(shaft);
    allGameObjects.push(shaft);

    var roofGeometry = new THREE.BoxGeometry(5, 2, 5);
    var roof = new THREE.Mesh(roofGeometry, stoneMaterial);
    roof.position.set(x, 6.5, z);
    scene.add(roof);
    allGameObjects.push(roof);

    return shaft;
  }

  function createFogLantern(x, z) {
    var postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
    var postMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a, emissive: 0x0a0a0a });
    var post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(x, 2, z);
    scene.add(post);
    allGameObjects.push(post);

    var lanternGeometry = new THREE.CylinderGeometry(1.2, 1.2, 1.5, 6);
    var lanternMaterial = new THREE.MeshPhongMaterial({
      color: 0x3a3a3a,
      emissive: 0x4a4a4a,
      emissiveIntensity: 0.3
    });
    var lantern = new THREE.Mesh(lanternGeometry, lanternMaterial);
    lantern.position.set(x, 4.5, z);
    scene.add(lantern);
    allGameObjects.push(lantern);

    var glowGeometry = new THREE.SphereGeometry(0.8, 8, 8);
    var glowMaterial = new THREE.MeshPhongMaterial({
      color: 0x6b8b6b,
      emissive: 0x9bafaf,
      emissiveIntensity: 0.5
    });
    var glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(x, 4.5, z);
    scene.add(glow);
    allGameObjects.push(glow);

    fogLanterns.push({
      lantern: lantern,
      glow: glow,
      post: post,
      baseX: x,
      baseZ: z
    });

    return lantern;
  }

  function createBonfire(x, z) {
    var fireGeometry = new THREE.ConeGeometry(2, 4, 8);
    var fireMaterial = new THREE.MeshPhongMaterial({
      color: 0xff4500,
      emissive: 0xff8c00,
      emissiveIntensity: 0.8
    });
    var fire = new THREE.Mesh(fireGeometry, fireMaterial);
    fire.position.set(x, 2, z);
    scene.add(fire);
    allGameObjects.push(fire);

    var glowGeometry = new THREE.SphereGeometry(3, 8, 8);
    var glowMaterial = new THREE.MeshPhongMaterial({
      color: 0xff6633,
      emissive: 0xff4500,
      emissiveIntensity: 0.6
    });
    var glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(x, 3, z);
    scene.add(glow);
    allGameObjects.push(glow);

    bonfire = {
      fire: fire,
      glow: glow,
      baseX: x,
      baseZ: z,
      baseY: 2
    };

    return fire;
  }

  function createCultist(x, y, z) {
    var bodyGeometry = new THREE.BoxGeometry(1.2, 2.5, 0.8);
    var bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x3a0a3a, emissive: 0x1a0a1a });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, y + 1.25, z);
    scene.add(body);
    allGameObjects.push(body);

    var hoodGeometry = new THREE.BoxGeometry(1.4, 1.2, 0.9);
    var hood = new THREE.Mesh(hoodGeometry, bodyMaterial);
    hood.position.set(x, y + 2.8, z);
    scene.add(hood);
    allGameObjects.push(hood);

    var enemy = {
      body: body,
      hood: hood,
      health: 1,
      position: { x: x, y: y, z: z }
    };

    enemies.push(enemy);
    return enemy;
  }

  function createSummonedEntity(x, y, z) {
    var sphereGeometry = new THREE.SphereGeometry(1.2, 8, 8);
    var sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x6b0b9b,
      emissive: 0xff1493,
      emissiveIntensity: 0.8
    });
    var orb = new THREE.Mesh(sphereGeometry, sphereMaterial);
    orb.position.set(x, y, z);
    scene.add(orb);
    allGameObjects.push(orb);

    var robeGeometry = new THREE.ConeGeometry(1.5, 2, 8);
    var robeMaterial = new THREE.MeshPhongMaterial({
      color: 0x5a0b7a,
      emissive: 0xaa1aa0,
      emissiveIntensity: 0.5
    });
    var robe = new THREE.Mesh(robeGeometry, robeMaterial);
    robe.position.set(x, y - 1, z);
    scene.add(robe);
    allGameObjects.push(robe);

    var enemy = {
      orb: orb,
      robe: robe,
      health: 2,
      position: { x: x, y: y, z: z }
    };

    enemies.push(enemy);
    return enemy;
  }

  function updateHUD() {
    if (hudElement) {
      var status = ritualDisrupted ? 'YES' : 'NO';
      hudElement.innerHTML = '<div style="font-family: monospace; font-size: 16px; color: #00ff00; text-shadow: 0 0 10px #00ff00;">' +
        'RITUAL DISRUPTED: ' + status + '<br>' +
        'CULTISTS DOWN: ' + cultistsKilled + '/8<br>' +
        'ENTITIES BANISHED: ' + entitiesBanished + '/2' +
        '</div>';
    }
  }

  function handleKeyDown(event) {
    keysPressed[event.key] = true;

    if (event.key === 'h' || event.key === 'H') {
      var now = Date.now();
      if (now - lastHPress < 400) {
        if (keysPressed['v'] || keysPressed['V']) {
          hVToggleActive = !hVToggleActive;
          if (hudElement) {
            hudElement.style.display = hVToggleActive ? 'block' : 'none';
          }
        }
      }
      lastHPress = now;
    }
  }

  function handleKeyUp(event) {
    keysPressed[event.key] = false;
  }

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;

    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.FogExp2(0x0a0a1a, 0.08);

    var ambientLight = new THREE.AmbientLight(0x4a4a6a, 0.4);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0x8b7b9b, 0.3);
    directionalLight.position.set(20, 30, 20);
    scene.add(directionalLight);

    var pointLight = new THREE.PointLight(0xff6633, 0.5, 100);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    createCottage(-15, -20);
    createCottage(15, -20);
    createCottage(-15, 20);
    createCottage(15, 20);

    createCemetery(-30, 0);

    createRitualCircle(0, 0);

    createDeadTree(-25, -15);
    createDeadTree(25, -15);
    createDeadTree(-25, 15);
    createDeadTree(25, 15);

    createWell(-20, 5);
    createWell(20, -5);

    createFogLantern(-10, -10);
    createFogLantern(10, -10);
    createFogLantern(-10, 10);
    createFogLantern(10, 10);

    createBonfire(0, 0);

    createCultist(-8, 0, -5);
    createCultist(8, 0, -5);
    createCultist(-5, 0, 5);
    createCultist(5, 0, 5);
    createCultist(-12, 0, 8);
    createCultist(12, 0, 8);
    createCultist(0, 0, -12);
    createCultist(0, 0, 12);

    createSummonedEntity(0, 3, -20);
    createSummonedEntity(0, 3, 20);

    hudElement = document.createElement('div');
    hudElement.id = 'game-hud';
    hudElement.style.position = 'fixed';
    hudElement.style.top = '20px';
    hudElement.style.left = '20px';
    hudElement.style.display = 'block';
    hudElement.style.zIndex = '100';
    hudElement.style.padding = '10px';
    hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hudElement.style.border = '2px solid #00ff00';
    document.body.appendChild(hudElement);

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    updateHUD();

    return {
      init: init,
      update: update,
      reset: reset
    };
  }

  function update(delta) {
    time += delta;

    if (bonfire) {
      var fireFlicker = Math.sin(time * 8) * 0.4 + 0.6;
      bonfire.fire.scale.y = 0.8 + fireFlicker * 0.4;
      bonfire.glow.material.emissiveIntensity = 0.4 + fireFlicker * 0.4;
    }

    for (var i = 0; i < fogLanterns.length; i++) {
      var lantern = fogLanterns[i];
      var sway = Math.sin(time * 2 + i) * 0.5;
      lantern.lantern.position.x = lantern.baseX + sway * 0.3;
      lantern.glow.position.x = lantern.baseX + sway * 0.3;
      var glowIntensity = Math.sin(time * 3 + i) * 0.3 + 0.4;
      lantern.glow.material.emissiveIntensity = glowIntensity;
    }

    if (ritualCircle) {
      var pulseIntensity = Math.sin(time * 4) * 0.5 + 0.5;
      ritualCircle.material.emissiveIntensity = 0.2 + pulseIntensity * 0.4;
    }

    var rayOrigin = new THREE.Vector3(0, 0, -1);
    rayOrigin.applyQuaternion(camera.quaternion);
    rayOrigin.add(camera.position);

    var raycaster = new THREE.Raycaster(camera.position, camera.getWorldDirection(new THREE.Vector3()));

    if (keysPressed[' '] || keysPressed['w'] || keysPressed['W']) {
      for (var j = 0; j < enemies.length; j++) {
        var enemy = enemies[j];
        var targetPos = new THREE.Vector3(enemy.position.x, enemy.position.y, enemy.position.z);
        var distance = camera.position.distanceTo(targetPos);
        if (distance < 50) {
          var dirToEnemy = new THREE.Vector3().subVectors(targetPos, camera.position).normalize();
          var viewDir = camera.getWorldDirection(new THREE.Vector3());
          var dotProduct = dirToEnemy.dot(viewDir);
          if (dotProduct > 0.7) {
            enemy.health -= delta;
            if (enemy.health <= 0) {
              if (enemy.body) {
                cultistsKilled += 1;
              } else {
                entitiesBanished += 1;
              }
              var index = enemies.indexOf(enemy);
              if (index > -1) {
                enemies.splice(index, 1);
              }
              updateHUD();
            }
          }
        }
      }
    }

    if (cultistsKilled >= 8 && entitiesBanished >= 2) {
      ritualDisrupted = true;
      updateHUD();
    }
  }

  function reset() {
    for (var i = 0; i < allGameObjects.length; i++) {
      scene.remove(allGameObjects[i]);
    }
    allGameObjects = [];
    enemies = [];
    fogLanterns = [];
    bonfire = null;
    ritualCircle = null;
    cultistsKilled = 0;
    entitiesBanished = 0;
    ritualDisrupted = false;
    time = 0;
    updateHUD();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
