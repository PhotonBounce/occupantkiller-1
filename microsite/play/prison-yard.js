window.PrisonYard = (function() {
  'use strict';

  var scene = null;
  var objects = [];
  var animations = [];

  function createMaterial(color, emissive) {
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || 0x000000,
      metalness: 0.3,
      roughness: 0.7
    });
  }

  function addObject(mesh) {
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createGroundPlane() {
    var geometry = new THREE.BoxGeometry(200, 0.5, 200);
    var material = createMaterial(0x654321);
    var ground = new THREE.Mesh(geometry, material);
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    return addObject(ground);
  }

  function createPerimeterFence() {
    var fences = [];
    var fenceHeight = 20;
    var fenceWidth = 150;

    for (var i = 0; i < 4; i++) {
      var geometry = new THREE.BoxGeometry(fenceWidth, fenceHeight, 0.5);
      var material = createMaterial(0x444444);
      var fence = new THREE.Mesh(geometry, material);

      if (i === 0) {
        fence.position.set(0, fenceHeight / 2, -fenceWidth / 2);
      } else if (i === 1) {
        fence.position.set(0, fenceHeight / 2, fenceWidth / 2);
      } else if (i === 2) {
        fence.position.set(-fenceWidth / 2, fenceHeight / 2, 0);
      } else {
        fence.position.set(fenceWidth / 2, fenceHeight / 2, 0);
      }

      fence.castShadow = true;
      fence.receiveShadow = true;
      scene.add(fence);
      fences.push(fence);
    }
    objects.push(...fences);
    return fences;
  }

  function createGuardTower() {
    var towers = [];
    var positions = [[-60, 0, -60], [60, 0, -60], [-60, 0, 60], [60, 0, 60]];

    positions.forEach(function(pos) {
      var baseGeometry = new THREE.BoxGeometry(8, 0.5, 8);
      var baseMaterial = createMaterial(0x666666);
      var base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.set(pos[0], pos[1], pos[2]);

      var columnGeometry = new THREE.CylinderGeometry(1.5, 1.5, 25, 8);
      var columnMaterial = createMaterial(0x555555);
      var column = new THREE.Mesh(columnGeometry, columnMaterial);
      column.position.set(pos[0], 13, pos[2]);

      var platformGeometry = new THREE.BoxGeometry(10, 0.5, 10);
      var platformMaterial = createMaterial(0x777777);
      var platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.set(pos[0], 26, pos[2]);

      var roofGeometry = new THREE.ConeGeometry(6, 3, 8);
      var roofMaterial = createMaterial(0x333333);
      var roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.set(pos[0], 29.5, pos[2]);

      base.castShadow = true;
      column.castShadow = true;
      platform.castShadow = true;
      roof.castShadow = true;

      scene.add(base);
      scene.add(column);
      scene.add(platform);
      scene.add(roof);

      towers.push({ base: base, column: column, platform: platform, roof: roof, spotlight: null });
    });

    objects.push(...towers);
    return towers;
  }

  function createGuardTowerSpotlight(tower) {
    var spotGeometry = new THREE.SphereGeometry(1, 8, 8);
    var spotMaterial = createMaterial(0xffff00, 0xffff00);
    var spotlight = new THREE.Mesh(spotGeometry, spotMaterial);
    spotlight.position.copy(tower.platform.position);
    spotlight.position.y += 2;
    scene.add(spotlight);
    tower.spotlight = spotlight;

    var angle = 0;
    animations.push({
      update: function(delta) {
        angle += delta * 0.5;
        spotlight.position.x = tower.platform.position.x + Math.cos(angle) * 15;
        spotlight.position.z = tower.platform.position.z + Math.sin(angle) * 15;
      }
    });
  }

  function createPrisonBus() {
    var busGeometry = new THREE.BoxGeometry(8, 6, 15);
    var busMaterial = createMaterial(0xffff00);
    var bus = new THREE.Mesh(busGeometry, busMaterial);
    bus.position.set(50, 3, 0);
    bus.castShadow = true;
    bus.receiveShadow = true;
    scene.add(bus);

    var wheelRadius = 1.2;
    for (var i = 0; i < 4; i++) {
      var wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.6, 16);
      var wheelMaterial = createMaterial(0x111111);
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(bus.position.x + (i < 2 ? -3 : 3), wheelRadius + 0.5, bus.position.z + (i % 2 === 0 ? -4 : 4));
      scene.add(wheel);
      objects.push(wheel);
    }

    objects.push(bus);

    var busRockOffset = 0;
    animations.push({
      update: function(delta) {
        busRockOffset += delta * 2;
        bus.rotation.z = Math.sin(busRockOffset) * 0.1;
      }
    });

    return bus;
  }

  function createWaterTower() {
    var baseGeometry = new THREE.BoxGeometry(6, 0.5, 6);
    var baseMaterial = createMaterial(0x888888);
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(-50, 0, 0);

    var columnGeometry = new THREE.CylinderGeometry(1, 1, 20, 12);
    var columnMaterial = createMaterial(0x999999);
    var column = new THREE.Mesh(columnGeometry, columnMaterial);
    column.position.set(-50, 10, 0);

    var tankGeometry = new THREE.SphereGeometry(5, 16, 16);
    var tankMaterial = createMaterial(0x666666);
    var tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.position.set(-50, 25, 0);

    base.castShadow = true;
    column.castShadow = true;
    tank.castShadow = true;

    scene.add(base);
    scene.add(column);
    scene.add(tank);

    objects.push(base, column, tank);
    return { base: base, column: column, tank: tank };
  }

  function createExerciseEquipment() {
    var equipment = [];

    var benchGeometry = new THREE.BoxGeometry(6, 1.5, 2);
    var benchMaterial = createMaterial(0xaa5533);
    var bench = new THREE.Mesh(benchGeometry, benchMaterial);
    bench.position.set(-30, 1, -20);
    bench.castShadow = true;
    bench.receiveShadow = true;
    scene.add(bench);
    equipment.push(bench);

    var barGeometry = new THREE.CylinderGeometry(0.8, 0.8, 20, 12);
    var barMaterial = createMaterial(0x444444);
    var bar = new THREE.Mesh(barGeometry, barMaterial);
    bar.position.set(-30, 8, -20);
    bar.rotation.z = Math.PI / 2.2;
    bar.castShadow = true;
    scene.add(bar);
    equipment.push(bar);

    var chinupGeometry = new THREE.BoxGeometry(8, 0.8, 0.8);
    var chinupMaterial = createMaterial(0x555555);
    var chinup = new THREE.Mesh(chinupGeometry, chinupMaterial);
    chinup.position.set(-30, 14, -20);
    chinup.castShadow = true;
    scene.add(chinup);
    equipment.push(chinup);

    objects.push(...equipment);
    return equipment;
  }

  function createBasketballHoop() {
    var poleGeometry = new THREE.CylinderGeometry(0.6, 0.6, 15, 12);
    var poleMaterial = createMaterial(0x666666);
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(30, 7.5, -30);
    pole.castShadow = true;
    scene.add(pole);
    objects.push(pole);

    var rimGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 16);
    var rimMaterial = createMaterial(0xff6600);
    var rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.set(30, 14.5, -30);
    scene.add(rim);
    objects.push(rim);

    var poleSwayOffset = 0;
    animations.push({
      update: function(delta) {
        poleSwayOffset += delta * 0.8;
        pole.rotation.z = Math.sin(poleSwayOffset) * 0.05;
      }
    });

    return { pole: pole, rim: rim };
  }

  function createContrabanWorkshop() {
    var shedGeometry = new THREE.BoxGeometry(12, 8, 10);
    var shedMaterial = createMaterial(0x774422);
    var shed = new THREE.Mesh(shedGeometry, shedMaterial);
    shed.position.set(-40, 4, 40);
    shed.castShadow = true;
    shed.receiveShadow = true;
    scene.add(shed);
    objects.push(shed);

    var roofGeometry = new THREE.ConeGeometry(7, 4, 4);
    var roofMaterial = createMaterial(0x663311);
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-40, 12, 40);
    scene.add(roof);
    objects.push(roof);

    return { shed: shed, roof: roof };
  }

  function createSolitaryConfinement() {
    var blockGeometry = new THREE.BoxGeometry(20, 12, 15);
    var blockMaterial = createMaterial(0x444444);
    var block = new THREE.Mesh(blockGeometry, blockMaterial);
    block.position.set(0, 6, 50);
    block.castShadow = true;
    block.receiveShadow = true;
    scene.add(block);
    objects.push(block);

    for (var i = 0; i < 6; i++) {
      var windowGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.2);
      var windowMaterial = createMaterial(0x333333);
      var window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(-8 + i * 3, 8, 50.1);
      scene.add(window);
      objects.push(window);
    }

    return block;
  }

  function createCommissaryCart() {
    var cartGeometry = new THREE.BoxGeometry(5, 3, 7);
    var cartMaterial = createMaterial(0x996633);
    var cart = new THREE.Mesh(cartGeometry, cartMaterial);
    cart.position.set(30, 1.5, 30);
    cart.rotation.z = 0.3;
    cart.castShadow = true;
    cart.receiveShadow = true;
    scene.add(cart);
    objects.push(cart);

    for (var i = 0; i < 2; i++) {
      var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 12);
      var wheelMaterial = createMaterial(0x222222);
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(30 + (i === 0 ? -2 : 2), 0.8, 30);
      scene.add(wheel);
      objects.push(wheel);
    }

    return cart;
  }

  function createBurningMattress() {
    var mattresses = [];
    var positions = [[10, 0, 10], [-20, 0, 20], [40, 0, -10]];

    positions.forEach(function(pos) {
      var mattressGeometry = new THREE.BoxGeometry(4, 1, 7);
      var mattressMaterial = createMaterial(0x440000, 0x880000);
      var mattress = new THREE.Mesh(mattressGeometry, mattressMaterial);
      mattress.position.set(pos[0], pos[1] + 0.5, pos[2]);
      mattress.castShadow = true;
      mattress.receiveShadow = true;
      scene.add(mattress);
      mattresses.push(mattress);

      var flameGeometry = new THREE.ConeGeometry(2, 5, 8);
      var flameMaterial = createMaterial(0xff4400, 0xff8800);
      var flame = new THREE.Mesh(flameGeometry, flameMaterial);
      flame.position.set(pos[0], pos[1] + 3, pos[2]);
      scene.add(flame);
      objects.push(flame);

      var flameOffset = Math.random() * Math.PI * 2;
      animations.push({
        update: function(delta) {
          flameOffset += delta * 3;
          flame.position.y = pos[1] + 3 + Math.sin(flameOffset) * 0.5;
          flame.scale.y = 0.8 + Math.sin(flameOffset) * 0.3;
        }
      });
    });

    objects.push(...mattresses);
    return mattresses;
  }

  function createShivWorkstation() {
    var tableGeometry = new THREE.BoxGeometry(6, 1, 4);
    var tableMaterial = createMaterial(0x333333);
    var table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.set(-15, 0.5, -40);
    table.castShadow = true;
    table.receiveShadow = true;
    scene.add(table);
    objects.push(table);

    for (var i = 0; i < 3; i++) {
      var toolGeometry = new THREE.BoxGeometry(0.3, 0.1, 1.5);
      var toolMaterial = createMaterial(0x555555);
      var tool = new THREE.Mesh(toolGeometry, toolMaterial);
      tool.position.set(-15 + i * 2 - 2, 1.2, -40);
      tool.rotation.z = Math.random() * Math.PI;
      scene.add(tool);
      objects.push(tool);
    }

    return table;
  }

  function createLightsAndEnvironment() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 60, 40);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    var skyLight = new THREE.HemisphereLight(0x87ceeb, 0x444444, 0.6);
    scene.add(skyLight);
  }

  var publicAPI = {
    init: function(sceneParam) {
      scene = sceneParam;
      objects = [];
      animations = [];

      createGroundPlane();
      createPerimeterFence();

      var towers = createGuardTower();
      towers.forEach(function(tower) {
        createGuardTowerSpotlight(tower);
      });

      createPrisonBus();
      createWaterTower();
      createExerciseEquipment();
      createBasketballHoop();
      createContrabanWorkshop();
      createSolitaryConfinement();
      createCommissaryCart();
      createBurningMattress();
      createShivWorkstation();
      createLightsAndEnvironment();
    },

    update: function(delta) {
      for (var i = 0; i < animations.length; i++) {
        animations[i].update(delta);
      }
    },

    reset: function() {
      for (var i = objects.length - 1; i >= 0; i--) {
        scene.remove(objects[i]);
      }
      objects = [];
      animations = [];
    }
  };

  return publicAPI;
}());
