window.ToxicJungle = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animatedObjects = [];
  var time = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    animatedObjects = [];
    time = 0;

    // 1. Dense jungle canopy - tall tree trunks with leafy tops
    for (var i = 0; i < 12; i++) {
      var angle = (Math.PI * 2 * i) / 12;
      var radius = 40 + Math.random() * 20;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var trunkGeometry = new THREE.CylinderGeometry(1.5, 2, 20, 8);
      var trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4A3728 });
      var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(x, 10, z);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      scene.add(trunk);
      objects.push(trunk);

      var leafGeometry = new THREE.SphereGeometry(8, 8, 8);
      var leafMaterial = new THREE.MeshLambertMaterial({ color: 0x1A5C1A });
      var leafTop = new THREE.Mesh(leafGeometry, leafMaterial);
      leafTop.position.set(x, 25, z);
      leafTop.castShadow = true;
      leafTop.receiveShadow = true;
      leafTop.scale.y = 0.8;
      scene.add(leafTop);
      objects.push(leafTop);
    }

    // 2. Toxic waste barrels with hazard stripes
    for (var i = 0; i < 5; i++) {
      var angle = (Math.PI * 2 * i) / 5;
      var radius = 30;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var barrelGeometry = new THREE.CylinderGeometry(1.2, 1.2, 3, 12);
      var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x33AA33 });
      var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.position.set(x, 1.5, z);
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      scene.add(barrel);
      objects.push(barrel);

      var stripeGeometry = new THREE.CylinderGeometry(1.25, 1.25, 0.1, 12);
      var stripeMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
      var stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.set(x, 2.5, z);
      stripe.castShadow = true;
      scene.add(stripe);
      objects.push(stripe);

      var lidGeometry = new THREE.CylinderGeometry(1.3, 1.3, 0.2, 12);
      var lidMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
      var lid = new THREE.Mesh(lidGeometry, lidMaterial);
      lid.position.set(x, 3.1, z);
      lid.castShadow = true;
      scene.add(lid);
      objects.push(lid);

      animatedObjects.push({
        object: lid,
        type: 'wobble',
        startY: lid.position.y,
        amplitude: 0.15,
        speed: 3 + Math.random() * 2
      });
    }

    // 3. Bubbling toxic pools - flat boxes animated
    for (var i = 0; i < 4; i++) {
      var angle = (Math.PI * 2 * i) / 4;
      var radius = 50;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var poolGeometry = new THREE.BoxGeometry(12, 0.3, 12);
      var poolMaterial = new THREE.MeshLambertMaterial({
        color: 0x39FF14,
        emissive: 0x39FF14,
        emissiveIntensity: 0.3
      });
      var pool = new THREE.Mesh(poolGeometry, poolMaterial);
      pool.position.set(x, 0.15, z);
      pool.castShadow = true;
      pool.receiveShadow = true;
      scene.add(pool);
      objects.push(pool);

      animatedObjects.push({
        object: pool,
        type: 'pulse',
        baseIntensity: 0.3,
        minIntensity: 0.2,
        maxIntensity: 0.6,
        speed: 2 + Math.random()
      });
    }

    // 4. Abandoned research outpost - BoxGeometry buildings
    var buildingGeometry = new THREE.BoxGeometry(10, 8, 12);
    var buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(-35, 4, 0);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    objects.push(building);

    // Windows for the building
    for (var i = 0; i < 2; i++) {
      for (var j = 0; j < 3; j++) {
        var windowGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.1);
        var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
        var window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(-35 + (i - 0.5) * 3, 3 + j * 2, 6.1);
        scene.add(window);
        objects.push(window);
      }
    }

    // 5. Toxic gas vents - CylinderGeometry pipes emissive green
    for (var i = 0; i < 3; i++) {
      var x = -40 + i * 20;
      var z = -30;

      var ventGeometry = new THREE.CylinderGeometry(0.8, 0.8, 8, 16);
      var ventMaterial = new THREE.MeshLambertMaterial({
        color: 0x00FF44,
        emissive: 0x00FF44,
        emissiveIntensity: 0.4
      });
      var vent = new THREE.Mesh(ventGeometry, ventMaterial);
      vent.position.set(x, 4, z);
      vent.castShadow = true;
      vent.receiveShadow = true;
      scene.add(vent);
      objects.push(vent);

      animatedObjects.push({
        object: vent,
        type: 'scale_burst',
        baseScale: 1,
        maxScale: 1.3,
        speed: 2.5 + Math.random()
      });
    }

    // 6. Mutant plant enemies - ConeGeometry spiky forms
    for (var i = 0; i < 4; i++) {
      var angle = (Math.PI * 2 * i) / 4;
      var radius = 35;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var plantGeometry = new THREE.ConeGeometry(2, 5, 8);
      var plantMaterial = new THREE.MeshLambertMaterial({ color: 0x2D8A2D });
      var plant = new THREE.Mesh(plantGeometry, plantMaterial);
      plant.position.set(x, 2.5, z);
      plant.castShadow = true;
      plant.receiveShadow = true;
      scene.add(plant);
      objects.push(plant);
    }

    // 7. Rope bridge over toxic river - BoxGeometry planks and CylinderGeometry posts
    var postLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 6, 8),
      new THREE.MeshLambertMaterial({ color: 0x8B7355 })
    );
    postLeft.position.set(-15, 3, 20);
    postLeft.castShadow = true;
    scene.add(postLeft);
    objects.push(postLeft);

    var postRight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 6, 8),
      new THREE.MeshLambertMaterial({ color: 0x8B7355 })
    );
    postRight.position.set(15, 3, 20);
    postRight.castShadow = true;
    scene.add(postRight);
    objects.push(postRight);

    for (var i = 0; i < 8; i++) {
      var plankGeometry = new THREE.BoxGeometry(0.3, 0.1, 2);
      var plankMaterial = new THREE.MeshLambertMaterial({ color: 0xA0826D });
      var plank = new THREE.Mesh(plankGeometry, plankMaterial);
      plank.position.set(-15 + (i / 7) * 30, 4.2, 20);
      plank.castShadow = true;
      plank.receiveShadow = true;
      scene.add(plank);
      objects.push(plank);
    }

    // 8. Chemical storage tanks - CylinderGeometry large metallic
    for (var i = 0; i < 2; i++) {
      var tankGeometry = new THREE.CylinderGeometry(3, 3.5, 6, 16);
      var tankMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
      var tank = new THREE.Mesh(tankGeometry, tankMaterial);
      tank.position.set(-20 + i * 40, 3, -20);
      tank.castShadow = true;
      tank.receiveShadow = true;
      scene.add(tank);
      objects.push(tank);
    }

    // 9. Warning signs - BoxGeometry flat red panels
    for (var i = 0; i < 4; i++) {
      var angle = (Math.PI * 2 * i) / 4;
      var radius = 45;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var signGeometry = new THREE.BoxGeometry(2, 2.5, 0.1);
      var signMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
      var sign = new THREE.Mesh(signGeometry, signMaterial);
      sign.position.set(x, 2, z);
      sign.castShadow = true;
      sign.receiveShadow = true;
      sign.lookAt(0, 2, 0);
      scene.add(sign);
      objects.push(sign);

      animatedObjects.push({
        object: sign,
        type: 'rotate_slow',
        axis: new THREE.Vector3(0, 1, 0),
        speed: 0.3
      });
    }

    // 10. Contamination zone markers - CylinderGeometry poles with glowing SphereGeometry tops
    for (var i = 0; i < 5; i++) {
      var angle = (Math.PI * 2 * i) / 5;
      var radius = 55;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
      var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
      var pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(x, 2, z);
      pole.castShadow = true;
      scene.add(pole);
      objects.push(pole);

      var markerGeometry = new THREE.SphereGeometry(0.6, 8, 8);
      var markerMaterial = new THREE.MeshLambertMaterial({
        color: 0x00FF00,
        emissive: 0x00FF00,
        emissiveIntensity: 0.5
      });
      var marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(x, 4.2, z);
      marker.castShadow = true;
      scene.add(marker);
      objects.push(marker);

      animatedObjects.push({
        object: marker,
        type: 'pulse_emissive',
        baseMaterial: markerMaterial,
        minIntensity: 0.3,
        maxIntensity: 0.8,
        speed: 1.5 + Math.random()
      });
    }

    // 11. Fallen tree logs creating obstacles - CylinderGeometry horizontal
    for (var i = 0; i < 3; i++) {
      var angle = (Math.PI * 2 * i) / 3;
      var radius = 25;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var logGeometry = new THREE.CylinderGeometry(1, 1, 15, 12);
      var logMaterial = new THREE.MeshLambertMaterial({ color: 0x5C3D1F });
      var log = new THREE.Mesh(logGeometry, logMaterial);
      log.position.set(x, 1, z);
      log.rotation.z = Math.PI / 2;
      log.castShadow = true;
      log.receiveShadow = true;
      scene.add(log);
      objects.push(log);
    }

    // 12. Lab ruins with scattered equipment - BoxGeometry tables/equipment
    for (var i = 0; i < 3; i++) {
      var tableGeometry = new THREE.BoxGeometry(3, 1, 3);
      var tableMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
      var table = new THREE.Mesh(tableGeometry, tableMaterial);
      table.position.set(-30 + i * 10, 0.5, -15);
      table.castShadow = true;
      table.receiveShadow = true;
      scene.add(table);
      objects.push(table);

      var equipGeometry = new THREE.BoxGeometry(1, 1.5, 1);
      var equipMaterial = new THREE.MeshLambertMaterial({ color: 0x999999 });
      var equip = new THREE.Mesh(equipGeometry, equipMaterial);
      equip.position.set(-30 + i * 10, 1.3, -15 - 2);
      equip.castShadow = true;
      equip.receiveShadow = true;
      scene.add(equip);
      objects.push(equip);
    }

    // 13. Additional structure - research tower BoxGeometry
    var towerGeometry = new THREE.BoxGeometry(4, 12, 4);
    var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(35, 6, 0);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    objects.push(tower);

    // 14. Containment barrier - BoxGeometry fence sections
    for (var i = 0; i < 8; i++) {
      var angle = (Math.PI * 2 * i) / 8;
      var radius = 60;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var fenceGeometry = new THREE.BoxGeometry(5, 2, 0.2);
      var fenceMaterial = new THREE.MeshLambertMaterial({ color: 0x990000 });
      var fence = new THREE.Mesh(fenceGeometry, fenceMaterial);
      fence.position.set(x, 1, z);
      fence.rotation.y = angle;
      fence.castShadow = true;
      fence.receiveShadow = true;
      scene.add(fence);
      objects.push(fence);
    }

    // 15. Toxic mist vortex indicator - ConeGeometry spinner
    var vortexGeometry = new THREE.ConeGeometry(4, 8, 12);
    var vortexMaterial = new THREE.MeshLambertMaterial({
      color: 0x39FF14,
      emissive: 0x39FF14,
      emissiveIntensity: 0.2
    });
    var vortex = new THREE.Mesh(vortexGeometry, vortexMaterial);
    vortex.position.set(0, 4, -40);
    vortex.castShadow = true;
    vortex.receiveShadow = true;
    scene.add(vortex);
    objects.push(vortex);

    animatedObjects.push({
      object: vortex,
      type: 'spin',
      axis: new THREE.Vector3(0, 1, 0),
      speed: 1.5
    });
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < animatedObjects.length; i++) {
      var anim = animatedObjects[i];
      var obj = anim.object;

      if (anim.type === 'wobble') {
        var wobble = Math.sin(time * anim.speed) * anim.amplitude;
        obj.position.y = anim.startY + wobble;
      } else if (anim.type === 'pulse') {
        var pulseFactor = (Math.sin(time * anim.speed) + 1) / 2;
        var intensity = anim.minIntensity + (anim.maxIntensity - anim.minIntensity) * pulseFactor;
        obj.material.emissiveIntensity = intensity;
      } else if (anim.type === 'scale_burst') {
        var burstFactor = (Math.sin(time * anim.speed) + 1) / 2;
        var scaleY = anim.baseScale + (anim.maxScale - anim.baseScale) * burstFactor;
        obj.scale.y = scaleY;
      } else if (anim.type === 'rotate_slow') {
        obj.rotation.y += anim.speed * delta;
      } else if (anim.type === 'pulse_emissive') {
        var pulseEmis = (Math.sin(time * anim.speed) + 1) / 2;
        var emisIntensity = anim.minIntensity + (anim.maxIntensity - anim.minIntensity) * pulseEmis;
        obj.material.emissiveIntensity = emisIntensity;
      } else if (anim.type === 'spin') {
        obj.rotation.y += anim.speed * delta;
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    animatedObjects = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
