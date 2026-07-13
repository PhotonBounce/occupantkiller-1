window.NightMarket = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var lights = [];
  var time = 0;

  var spawns = [];

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    lights = [];
    time = 0;

    // Add lighting
    var ambientLight = new THREE.AmbientLight(0x333344, 0.8);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(20, 30, 20);
    scene.add(directionalLight);
    lights.push(directionalLight);

    // Market street foundation
    var roadGeom = new THREE.BoxGeometry(40, 0.2, 60);
    var roadMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    var road = new THREE.Mesh(roadGeom, roadMat);
    road.position.y = 0;
    scene.add(road);
    meshes.push(road);

    var sidewalkGeom = new THREE.BoxGeometry(50, 0.1, 70);
    var sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });
    var sidewalk = new THREE.Mesh(sidewalkGeom, sidewalkMat);
    sidewalk.position.y = -0.05;
    scene.add(sidewalk);
    meshes.push(sidewalk);

    // Food stall row (left side)
    createFoodStall(scene, meshes, -15, 1, -10);
    createFoodStall(scene, meshes, -15, 1, -5);
    createFoodStall(scene, meshes, -15, 1, 0);
    createFoodStall(scene, meshes, -15, 1, 5);
    createFoodStall(scene, meshes, -15, 1, 10);

    // Right side food stalls
    createFoodStall(scene, meshes, 15, 1, -10);
    createFoodStall(scene, meshes, 15, 1, -5);
    createFoodStall(scene, meshes, 15, 1, 5);
    createFoodStall(scene, meshes, 15, 1, 10);

    // Paper lanterns strung across
    createLanternString(scene, meshes, -20, 8, -15, 20, 8, -15, 5);
    createLanternString(scene, meshes, -20, 8, 0, 20, 8, 0, 5);
    createLanternString(scene, meshes, -20, 8, 15, 20, 8, 15, 5);

    // Cloth canopy awnings
    var canopyGeom = new THREE.BoxGeometry(8, 0.3, 6);
    var canopyMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.6 });
    for (var i = 0; i < 6; i++) {
      var canopy = new THREE.Mesh(canopyGeom, canopyMat);
      canopy.position.set(-15 + i * 6, 2.5, -12);
      canopy.rotation.z = 0.05;
      scene.add(canopy);
      meshes.push(canopy);
    }

    // Gold shop with display cases
    createGoldShop(scene, meshes, 0, 1, 25);

    // Incense urns with smoke effect
    createIncenseUrn(scene, meshes, -8, 0.5, -15);
    createIncenseUrn(scene, meshes, 8, 0.5, -15);
    createIncenseUrn(scene, meshes, -10, 0.5, 20);
    createIncenseUrn(scene, meshes, 10, 0.5, 20);

    // Wok cooking station
    createWokStation(scene, meshes, 0, 0.5, -20);

    // Motorcycle taxi
    createMotorcycleTaxi(scene, meshes, 5, 0.5, 8);
    createMotorcycleTaxi(scene, meshes, -5, 0.5, 12);

    // Tuk-tuk vehicle
    createTukTuk(scene, meshes, 10, 0.5, -15);

    // Hanging garland lights
    createGarlandLights(scene, meshes, -10, 5, -8, 10, 5, -8, 4);
    createGarlandLights(scene, meshes, -10, 5, 8, 10, 5, 8, 4);

    // Market sign posts
    createSignPost(scene, meshes, -18, 2, 0);
    createSignPost(scene, meshes, 18, 2, 0);
    createSignPost(scene, meshes, 0, 2, 25);

    // Fish tank / water pipes
    createFishTank(scene, meshes, -5, 0.8, 18);

    // Lotus flower arrangements
    createLotusFlower(scene, meshes, 3, 1.5, 22);
    createLotusFlower(scene, meshes, -3, 1.5, 24);

    // Street food cart
    createFoodCart(scene, meshes, 8, 0.5, -8);

    // Additional stall details
    createStallCounter(scene, meshes, -15, 1, -2);
    createStallCounter(scene, meshes, 15, 1, 0);

    // Hanging decorative bowls / lantern frames
    createHangingBowl(scene, meshes, -8, 3, 5);
    createHangingBowl(scene, meshes, 8, 3, 8);

    // Define spawn points
    spawns = [
      new THREE.Vector3(-20, 2, -20),  // Market entrance
      new THREE.Vector3(-15, 2, 0),    // Food stall row
      new THREE.Vector3(15, 2, 20),    // Gold shop alley
      new THREE.Vector3(0, 2, -20),    // Cooking station
      new THREE.Vector3(20, 2, 20)     // Exit area
    ];

    return spawns;
  }

  function createFoodStall(scene, meshes, x, y, z) {
    // Stall frame - BoxGeometry
    var frameGeom = new THREE.BoxGeometry(4, 2.5, 3);
    var frameMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.7 });
    var frame = new THREE.Mesh(frameGeom, frameMat);
    frame.position.set(x, y + 1.25, z);
    scene.add(frame);
    meshes.push(frame);

    // Counter - BoxGeometry
    var counterGeom = new THREE.BoxGeometry(4.2, 0.5, 1.5);
    var counterMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.6 });
    var counter = new THREE.Mesh(counterGeom, counterMat);
    counter.position.set(x, y + 0.25, z + 1.5);
    scene.add(counter);
    meshes.push(counter);

    // Grill - CylinderGeometry
    var grillGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
    var grillMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    var grill = new THREE.Mesh(grillGeom, grillMat);
    grill.position.set(x - 1, y + 0.5, z - 0.5);
    scene.add(grill);
    meshes.push(grill);

    // Hanging pot - CylinderGeometry
    var potGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 16);
    var potMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7 });
    var pot = new THREE.Mesh(potGeom, potMat);
    pot.position.set(x + 1, y + 1.8, z);
    scene.add(pot);
    meshes.push(pot);

    // Lantern on stall - SphereGeometry
    var lanternGeom = new THREE.SphereGeometry(0.25, 8, 8);
    var lanternMat = new THREE.MeshStandardMaterial({ color: 0xFF6B1A, emissive: 0xFF6B1A, emissiveIntensity: 0.6 });
    var lantern = new THREE.Mesh(lanternGeom, lanternMat);
    lantern.position.set(x, y + 2.3, z);
    scene.add(lantern);
    meshes.push(lantern);

    // Add point light on stall
    var stallLight = new THREE.PointLight(0xFF8C42, 0.5, 10);
    stallLight.position.set(x, y + 2.2, z);
    scene.add(stallLight);
    lights.push(stallLight);
  }

  function createLanternString(scene, meshes, x1, y1, z1, x2, y2, z2, count) {
    var line = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array([x1, y1, z1, x2, y2, z2]), 3)),
      new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 1 })
    );
    scene.add(line);
    meshes.push(line);

    for (var i = 0; i < count; i++) {
      var t = i / (count - 1);
      var px = x1 + (x2 - x1) * t;
      var py = y1 + (y2 - y1) * t;
      var pz = z1 + (z2 - z1) * t;

      var color = [0xFF0000, 0xFFD700, 0xFF6B1A][i % 3];
      var lanternGeom = new THREE.SphereGeometry(0.3, 8, 8);
      var lanternMat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.7 });
      var lantern = new THREE.Mesh(lanternGeom, lanternMat);
      lantern.position.set(px, py, pz);
      scene.add(lantern);
      meshes.push(lantern);

      var light = new THREE.PointLight(color, 0.4, 8);
      light.position.copy(lantern.position);
      scene.add(light);
      lights.push(light);
    }
  }

  function createGoldShop(scene, meshes, x, y, z) {
    // Shop structure
    var shopGeom = new THREE.BoxGeometry(6, 3, 4);
    var shopMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 });
    var shop = new THREE.Mesh(shopGeom, shopMat);
    shop.position.set(x, y + 1.5, z);
    scene.add(shop);
    meshes.push(shop);

    // Display cases
    for (var i = 0; i < 3; i++) {
      var caseGeom = new THREE.BoxGeometry(1.5, 1.2, 1.5);
      var caseMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.3 });
      var goldCase = new THREE.Mesh(caseGeom, caseMat);
      goldCase.position.set(x - 2 + i * 2, y + 0.6, z);
      scene.add(goldCase);
      meshes.push(goldCase);

      // Jewelry glow - SphereGeometry
      var jewelGeom = new THREE.SphereGeometry(0.2, 8, 8);
      var jewelMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.8 });
      var jewel = new THREE.Mesh(jewelGeom, jewelMat);
      jewel.position.set(x - 2 + i * 2, y + 0.8, z);
      scene.add(jewel);
      meshes.push(jewel);

      var jewelLight = new THREE.PointLight(0xFFD700, 0.6, 6);
      jewelLight.position.copy(jewel.position);
      scene.add(jewelLight);
      lights.push(jewelLight);
    }

    // Gold shop sign
    var signGeom = new THREE.BoxGeometry(5, 0.8, 0.2);
    var signMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.5 });
    var sign = new THREE.Mesh(signGeom, signMat);
    sign.position.set(x, y + 3, z - 2);
    scene.add(sign);
    meshes.push(sign);
  }

  function createIncenseUrn(scene, meshes, x, y, z) {
    // Urn body - CylinderGeometry
    var urnGeom = new THREE.CylinderGeometry(0.3, 0.35, 0.6, 16);
    var urnMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 });
    var urn = new THREE.Mesh(urnGeom, urnMat);
    urn.position.set(x, y + 0.3, z);
    scene.add(urn);
    meshes.push(urn);

    // Incense stick - BoxGeometry (thin)
    var stickGeom = new THREE.BoxGeometry(0.05, 0.5, 0.05);
    var stickMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.6 });
    var stick = new THREE.Mesh(stickGeom, stickMat);
    stick.position.set(x, y + 0.6, z);
    scene.add(stick);
    meshes.push(stick);

    // Smoke effect - SphereGeometry (multiple small spheres)
    for (var i = 0; i < 3; i++) {
      var smokeGeom = new THREE.SphereGeometry(0.1 + i * 0.05, 6, 6);
      var smokeMat = new THREE.MeshStandardMaterial({ color: 0xAA88BB, transparent: true, opacity: 0.3 + i * 0.1 });
      var smoke = new THREE.Mesh(smokeGeom, smokeMat);
      smoke.position.set(x + (Math.random() - 0.5) * 0.3, y + 1 + i * 0.3, z + (Math.random() - 0.5) * 0.3);
      scene.add(smoke);
      meshes.push(smoke);
    }
  }

  function createWokStation(scene, meshes, x, y, z) {
    // Stove - BoxGeometry
    var stoveGeom = new THREE.BoxGeometry(1.5, 0.6, 1.5);
    var stoveMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
    var stove = new THREE.Mesh(stoveGeom, stoveMat);
    stove.position.set(x, y + 0.3, z);
    scene.add(stove);
    meshes.push(stove);

    // Wok - CylinderGeometry
    var wokGeom = new THREE.CylinderGeometry(0.4, 0.45, 0.3, 16);
    var wokMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.9 });
    var wok = new THREE.Mesh(wokGeom, wokMat);
    wok.position.set(x, y + 0.6, z);
    scene.add(wok);
    meshes.push(wok);

    // Flame effect - ConeGeometry
    var flameGeom = new THREE.ConeGeometry(0.2, 0.5, 8);
    var flameMat = new THREE.MeshStandardMaterial({ color: 0xFF4500, emissive: 0xFF6B1A, emissiveIntensity: 0.8 });
    var flame = new THREE.Mesh(flameGeom, flameMat);
    flame.position.set(x, y + 0.8, z);
    scene.add(flame);
    meshes.push(flame);

    var flameLight = new THREE.PointLight(0xFF4500, 0.8, 8);
    flameLight.position.set(x, y + 0.8, z);
    scene.add(flameLight);
    lights.push(flameLight);
  }

  function createMotorcycleTaxi(scene, meshes, x, y, z) {
    // Body - BoxGeometry
    var bodyGeom = new THREE.BoxGeometry(1.2, 0.8, 2);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0xFF6600, roughness: 0.5 });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(x, y + 0.4, z);
    scene.add(body);
    meshes.push(body);

    // Seat - BoxGeometry
    var seatGeom = new THREE.BoxGeometry(1, 0.3, 0.6);
    var seatMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4 });
    var seat = new THREE.Mesh(seatGeom, seatMat);
    seat.position.set(x, y + 0.9, z - 0.2);
    scene.add(seat);
    meshes.push(seat);

    // Wheels - CylinderGeometry
    for (var i = 0; i < 2; i++) {
      var wheelGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 16);
      var wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.6 });
      var wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x + (i === 0 ? -0.6 : 0.6), y + 0.35, z + (i === 0 ? -0.5 : 0.5));
      scene.add(wheel);
      meshes.push(wheel);
    }

    // Headlight - SphereGeometry
    var lightGeom = new THREE.SphereGeometry(0.15, 8, 8);
    var lightMat = new THREE.MeshStandardMaterial({ color: 0xFFFF99, emissive: 0xFFFF99, emissiveIntensity: 0.6 });
    var headlight = new THREE.Mesh(lightGeom, lightMat);
    headlight.position.set(x, y + 0.7, z + 1);
    scene.add(headlight);
    meshes.push(headlight);
  }

  function createTukTuk(scene, meshes, x, y, z) {
    // Cabin - BoxGeometry
    var cabinGeom = new THREE.BoxGeometry(1.5, 1.5, 2);
    var cabinMat = new THREE.MeshStandardMaterial({ color: 0x3366FF, roughness: 0.5 });
    var cabin = new THREE.Mesh(cabinGeom, cabinMat);
    cabin.position.set(x, y + 0.75, z);
    scene.add(cabin);
    meshes.push(cabin);

    // Engine - BoxGeometry (front)
    var engineGeom = new THREE.BoxGeometry(1, 0.5, 0.8);
    var engineMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
    var engine = new THREE.Mesh(engineGeom, engineMat);
    engine.position.set(x, y + 0.25, z + 1.5);
    scene.add(engine);
    meshes.push(engine);

    // Wheels
    for (var i = 0; i < 3; i++) {
      var wheelGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
      var wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.7 });
      var wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      var xOffset = (i === 0 ? -0.7 : (i === 1 ? 0.7 : 0.7));
      var zOffset = (i === 2 ? -0.8 : 0.5);
      wheel.position.set(x + xOffset, y + 0.4, z + zOffset);
      scene.add(wheel);
      meshes.push(wheel);
    }

    // Roof rack - BoxGeometry
    var rackGeom = new THREE.BoxGeometry(1.6, 0.1, 2.2);
    var rackMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.6 });
    var rack = new THREE.Mesh(rackGeom, rackMat);
    rack.position.set(x, y + 1.6, z);
    scene.add(rack);
    meshes.push(rack);
  }

  function createGarlandLights(scene, meshes, x1, y1, z1, x2, y2, z2, count) {
    var line = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array([x1, y1, z1, x2, y2, z2]), 3)),
      new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 1 })
    );
    scene.add(line);
    meshes.push(line);

    for (var i = 0; i < count; i++) {
      var t = i / (count - 1);
      var px = x1 + (x2 - x1) * t;
      var py = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * 0.5;
      var pz = z1 + (z2 - z1) * t;

      var bulbGeom = new THREE.SphereGeometry(0.1, 6, 6);
      var colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00];
      var bulbMat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length], emissive: colors[i % colors.length], emissiveIntensity: 0.8 });
      var bulb = new THREE.Mesh(bulbGeom, bulbMat);
      bulb.position.set(px, py, pz);
      scene.add(bulb);
      meshes.push(bulb);
    }
  }

  function createSignPost(scene, meshes, x, y, z) {
    // Pole - CylinderGeometry
    var poleGeom = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
    var poleMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.6 });
    var pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.set(x, y + 1.5, z);
    scene.add(pole);
    meshes.push(pole);

    // Sign board - BoxGeometry
    var signGeom = new THREE.BoxGeometry(2, 1, 0.1);
    var signMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xCC6600, emissiveIntensity: 0.4 });
    var sign = new THREE.Mesh(signGeom, signMat);
    sign.position.set(x, y + 2.5, z + 0.3);
    scene.add(sign);
    meshes.push(sign);
  }

  function createFishTank(scene, meshes, x, y, z) {
    // Tank body - BoxGeometry
    var tankGeom = new THREE.BoxGeometry(2, 1.2, 1.5);
    var tankMat = new THREE.MeshStandardMaterial({ color: 0x001a4d, transparent: true, opacity: 0.6, roughness: 0.1 });
    var tank = new THREE.Mesh(tankGeom, tankMat);
    tank.position.set(x, y + 0.6, z);
    scene.add(tank);
    meshes.push(tank);

    // Water - BoxGeometry (inside)
    var waterGeom = new THREE.BoxGeometry(1.9, 1, 1.4);
    var waterMat = new THREE.MeshStandardMaterial({ color: 0x0066CC, transparent: true, opacity: 0.3 });
    var water = new THREE.Mesh(waterGeom, waterMat);
    water.position.set(x, y + 0.6, z);
    scene.add(water);
    meshes.push(water);

    // Fish - SphereGeometry
    var fishGeom = new THREE.SphereGeometry(0.15, 8, 8);
    var fishMat = new THREE.MeshStandardMaterial({ color: 0xFF6B6B, emissive: 0xFF6B6B, emissiveIntensity: 0.3 });
    var fish = new THREE.Mesh(fishGeom, fishMat);
    fish.position.set(x - 0.4, y + 0.8, z);
    scene.add(fish);
    meshes.push(fish);
  }

  function createLotusFlower(scene, meshes, x, y, z) {
    // Stem - CylinderGeometry
    var stemGeom = new THREE.CylinderGeometry(0.05, 0.05, 1, 6);
    var stemMat = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.6 });
    var stem = new THREE.Mesh(stemGeom, stemMat);
    stem.position.set(x, y - 0.3, z);
    scene.add(stem);
    meshes.push(stem);

    // Petals - ConeGeometry (pink)
    for (var i = 0; i < 5; i++) {
      var angle = (i / 5) * Math.PI * 2;
      var petalGeom = new THREE.ConeGeometry(0.15, 0.4, 6);
      var petalMat = new THREE.MeshStandardMaterial({ color: 0xFF69B4, roughness: 0.5 });
      var petal = new THREE.Mesh(petalGeom, petalMat);
      petal.position.set(x + Math.cos(angle) * 0.2, y + 0.2, z + Math.sin(angle) * 0.2);
      petal.rotation.x = Math.PI / 4;
      scene.add(petal);
      meshes.push(petal);
    }

    // Center - SphereGeometry (yellow)
    var centerGeom = new THREE.SphereGeometry(0.12, 8, 8);
    var centerMat = new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0xFFDD00, emissiveIntensity: 0.5 });
    var center = new THREE.Mesh(centerGeom, centerMat);
    center.position.set(x, y + 0.3, z);
    scene.add(center);
    meshes.push(center);
  }

  function createFoodCart(scene, meshes, x, y, z) {
    // Cart body - BoxGeometry
    var cartGeom = new THREE.BoxGeometry(1.5, 1, 2);
    var cartMat = new THREE.MeshStandardMaterial({ color: 0xFF3333, roughness: 0.6 });
    var cart = new THREE.Mesh(cartGeom, cartMat);
    cart.position.set(x, y + 0.5, z);
    scene.add(cart);
    meshes.push(cart);

    // Wheels - CylinderGeometry
    for (var i = 0; i < 2; i++) {
      var wheelGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.15, 16);
      var wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });
      var wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x + (i === 0 ? -0.6 : 0.6), y + 0.3, z + (i === 0 ? -0.6 : 0.6));
      scene.add(wheel);
      meshes.push(wheel);
    }

    // Handle - BoxGeometry (thin pole)
    var handleGeom = new THREE.BoxGeometry(0.08, 0.8, 0.08);
    var handleMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.7 });
    var handle = new THREE.Mesh(handleGeom, handleMat);
    handle.position.set(x, y + 0.8, z + 1.2);
    scene.add(handle);
    meshes.push(handle);

    // Display case on cart - BoxGeometry
    var displayGeom = new THREE.BoxGeometry(1.3, 0.8, 1.5);
    var displayMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
    var display = new THREE.Mesh(displayGeom, displayMat);
    display.position.set(x, y + 1.1, z);
    scene.add(display);
    meshes.push(display);
  }

  function createStallCounter(scene, meshes, x, y, z) {
    var counterGeom = new THREE.BoxGeometry(3, 0.4, 1.2);
    var counterMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.6 });
    var counter = new THREE.Mesh(counterGeom, counterMat);
    counter.position.set(x, y + 0.2, z);
    scene.add(counter);
    meshes.push(counter);

    var topGeom = new THREE.BoxGeometry(3.1, 0.1, 1.3);
    var topMat = new THREE.MeshStandardMaterial({ color: 0xA0522D, roughness: 0.5 });
    var top = new THREE.Mesh(topGeom, topMat);
    top.position.set(x, y + 0.35, z);
    scene.add(top);
    meshes.push(top);
  }

  function createHangingBowl(scene, meshes, x, y, z) {
    var bowlGeom = new THREE.SphereGeometry(0.25, 8, 8);
    var bowlMat = new THREE.MeshStandardMaterial({ color: 0xCC6600, emissive: 0x994400, emissiveIntensity: 0.4 });
    var bowl = new THREE.Mesh(bowlGeom, bowlMat);
    bowl.position.set(x, y, z);
    scene.add(bowl);
    meshes.push(bowl);

    var lightGeom = new THREE.PointLight(0xCC6600, 0.3, 6);
    lightGeom.position.copy(bowl.position);
    scene.add(lightGeom);
    lights.push(lightGeom);
  }

  function update(delta) {
    time += delta;

    // Lantern swaying and pulsing
    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh.geometry && mesh.geometry.type === 'SphereGeometry' && mesh.material.emissive) {
        if (mesh.material.color.getHex && (mesh.material.color.getHex() === 0xFF0000 || mesh.material.color.getHex() === 0xFFD700 || mesh.material.color.getHex() === 0xFF6B1A)) {
          mesh.position.x += Math.sin(time * 1.5 + i) * 0.001;
          mesh.position.z += Math.cos(time * 1.2 + i) * 0.001;
          mesh.material.emissiveIntensity = 0.5 + Math.sin(time * 2 + i) * 0.3;
        }
      }
    }

    // Wok flame flicker
    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh.geometry && mesh.geometry.type === 'ConeGeometry' && mesh.material.color.getHex && mesh.material.color.getHex() === 0xFF4500) {
        mesh.scale.y = 0.8 + Math.sin(time * 5) * 0.3;
        mesh.scale.x = 0.9 + Math.cos(time * 4 + 2) * 0.2;
      }
    }

    // Incense smoke rising
    var smokeCount = 0;
    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh.geometry && mesh.geometry.type === 'SphereGeometry' && mesh.material.transparent && mesh.material.opacity < 0.5) {
        smokeCount++;
        mesh.position.y += delta * 0.3;
        mesh.position.x += Math.sin(time * 0.8 + smokeCount) * 0.01;
        if (mesh.position.y > 5) {
          mesh.position.y = 0.8;
          mesh.position.x = mesh.userData.origX || 0;
        }
      }
    }

    // Motorcycle movement
    var motoIndex = 0;
    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh.geometry && mesh.geometry.type === 'BoxGeometry' && mesh.material.color && mesh.material.color.getHex && mesh.material.color.getHex() === 0xFF6600) {
        mesh.position.z += Math.sin(time * 1 + motoIndex * 2) * 0.02;
        motoIndex++;
      }
    }

    // Tuk-tuk patrol route
    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh.geometry && mesh.geometry.type === 'BoxGeometry' && mesh.material.color && mesh.material.color.getHex && mesh.material.color.getHex() === 0x3366FF) {
        mesh.position.z += Math.sin(time * 0.5) * 0.02;
        mesh.position.x += Math.cos(time * 0.6) * 0.01;
        break;
      }
    }

    // Gold shop lights sparkling
    var goldCount = 0;
    for (var i = 0; i < lights.length; i++) {
      var light = lights[i];
      if (light.color && light.color.getHex && light.color.getHex() === 0xFFD700) {
        goldCount++;
        light.intensity = 0.4 + Math.sin(time * 3 + goldCount) * 0.3;
      }
    }

    // Hanging decorations swaying
    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh.position && mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
        if (mesh.position.y > 2.5 && mesh.position.y < 4) {
          mesh.rotation.z += Math.sin(time * 0.8 + i) * 0.002;
        }
      }
    }
  }

  function reset() {
    for (var i = meshes.length - 1; i >= 0; i--) {
      scene.remove(meshes[i]);
    }
    for (var i = lights.length - 1; i >= 0; i--) {
      scene.remove(lights[i]);
    }
    meshes = [];
    lights = [];
    time = 0;
    spawns = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
