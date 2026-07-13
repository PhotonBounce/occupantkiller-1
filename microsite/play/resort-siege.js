window.ResortSiege = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var resortObjects = [];
  var animatedObjects = [];
  var time = 0;

  var materials = {
    concrete: new THREE.MeshLambertMaterial({ color: 0xcccccc }),
    water: new THREE.MeshLambertMaterial({ color: 0x1e90ff, emissive: 0x0066cc }),
    sand: new THREE.MeshLambertMaterial({ color: 0xffd700 }),
    white: new THREE.MeshLambertMaterial({ color: 0xffffff }),
    wood: new THREE.MeshLambertMaterial({ color: 0x8b4513 }),
    palm: new THREE.MeshLambertMaterial({ color: 0x228b22 }),
    neon: new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 0.8 }),
    red: new THREE.MeshLambertMaterial({ color: 0xff0000 }),
    steel: new THREE.MeshLambertMaterial({ color: 0x696969 }),
    tile: new THREE.MeshLambertMaterial({ color: 0x87ceeb })
  };

  var init = function(s, c) {
    scene = s;
    camera = c;
    resortObjects = [];
    animatedObjects = [];
    time = 0;

    // Ground: sand and grass
    var groundGeom = new THREE.BoxGeometry(300, 0.5, 300);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0xf0e68c });
    var ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.y = -5;
    scene.add(ground);
    resortObjects.push(ground);

    // Main hotel tower (5 stories)
    buildMainHotel(new THREE.Vector3(0, 0, 0));

    // Swimming pool complex
    buildPoolArea(new THREE.Vector3(-60, 0, -80));

    // Beach umbrellas and loungers
    buildBeachArea(new THREE.Vector3(80, 0, 100));

    // Villa bungalows
    buildBungalows(new THREE.Vector3(-100, 0, 80));

    // Marina dock
    buildMarina(new THREE.Vector3(120, 0, -60));

    // Casino wing
    buildCasinoWing(new THREE.Vector3(50, 0, 40));

    // Tropical garden
    buildGardenPath(new THREE.Vector3(-80, 0, 20));

    // Helipad on main tower roof
    buildHelipad(new THREE.Vector3(0, 35, 20));

    // Water slide tower
    buildWaterSlideTower(new THREE.Vector3(-30, 0, -100));

    // Beachfront bar
    buildBeachBar(new THREE.Vector3(100, 0, 60));

    // Outdoor dining
    buildDiningTables(new THREE.Vector3(20, 0, 70));

    // Garden fountain
    buildFountain(new THREE.Vector3(-60, 0, -40));

    // Security booth
    buildSecurityBooth(new THREE.Vector3(0, 0, 140));

    // Overturned room service cart
    buildCartWreckage(new THREE.Vector3(30, 0, 5));

    // Barricaded lobby
    buildBarricade(new THREE.Vector3(-10, 0, -5));

    // SWAT staging area
    buildSWATStaging(new THREE.Vector3(140, 0, 80));

    // Ambient lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 80, 100);
    scene.add(directionalLight);
  };

  var buildMainHotel = function(pos) {
    // Main tower body (15m tall, tiered balconies)
    var towerGeom = new THREE.BoxGeometry(40, 60, 30);
    var towerMat = new THREE.MeshLambertMaterial({ color: 0xe8e8e8 });
    var tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.copy(pos);
    tower.position.y = 30;
    scene.add(tower);
    resortObjects.push(tower);

    // Tiered balconies
    for (var i = 0; i < 5; i++) {
      var balconyGeom = new THREE.BoxGeometry(48, 1, 35);
      var balcony = new THREE.Mesh(balconyGeom, materials.white);
      balcony.position.copy(pos);
      balcony.position.y = 12 + i * 10;
      scene.add(balcony);
      resortObjects.push(balcony);
    }

    // Roof structure
    var roofGeom = new THREE.BoxGeometry(42, 2, 32);
    var roof = new THREE.Mesh(roofGeom, materials.concrete);
    roof.position.copy(pos);
    roof.position.y = 65;
    scene.add(roof);
    resortObjects.push(roof);
  };

  var buildPoolArea = function(pos) {
    // Pool water
    var poolGeom = new THREE.BoxGeometry(60, 3, 40);
    var pool = new THREE.Mesh(poolGeom, materials.water);
    pool.position.copy(pos);
    pool.position.y = -1.5;
    scene.add(pool);
    resortObjects.push(pool);
    animatedObjects.push({ object: pool, type: 'water' });

    // Pool deck tiles
    var deckGeom = new THREE.BoxGeometry(80, 0.3, 60);
    var deck = new THREE.Mesh(deckGeom, materials.tile);
    deck.position.copy(pos);
    deck.position.y = 0;
    scene.add(deck);
    resortObjects.push(deck);

    // Lounge chairs
    for (var i = 0; i < 4; i++) {
      var loungeBase = new THREE.BoxGeometry(4, 0.5, 10);
      var lounge = new THREE.Mesh(loungeBase, materials.wood);
      lounge.position.copy(pos);
      lounge.position.x += -20 + i * 15;
      lounge.position.y = 0.5;
      lounge.position.z -= 20;
      scene.add(lounge);
      resortObjects.push(lounge);

      var backrest = new THREE.BoxGeometry(4, 5, 1);
      var back = new THREE.Mesh(backrest, materials.white);
      back.position.copy(lounge.position);
      back.position.y = 3;
      back.position.z -= 5;
      back.rotation.z = 0.4;
      scene.add(back);
      resortObjects.push(back);
    }

    // Pool bar area with stools
    buildPoolBar(pos);
  };

  var buildPoolBar = function(pos) {
    var barGeom = new THREE.BoxGeometry(20, 1, 8);
    var bar = new THREE.Mesh(barGeom, materials.concrete);
    bar.position.copy(pos);
    bar.position.y = 1;
    bar.position.z += 25;
    scene.add(bar);
    resortObjects.push(bar);

    // Bar stools
    for (var i = 0; i < 4; i++) {
      var stoolSeatGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16);
      var stool = new THREE.Mesh(stoolSeatGeom, materials.red);
      stool.position.copy(bar.position);
      stool.position.x += -7 + i * 5;
      stool.position.y += 2;
      scene.add(stool);
      resortObjects.push(stool);

      var legGeom = new THREE.CylinderGeometry(0.3, 0.3, 2.5, 8);
      var leg = new THREE.Mesh(legGeom, materials.steel);
      leg.position.copy(stool.position);
      leg.position.y -= 1.25;
      scene.add(leg);
      resortObjects.push(leg);
    }
  };

  var buildBeachArea = function(pos) {
    // Beach umbrellas
    for (var i = 0; i < 6; i++) {
      var umbrellaX = -30 + i * 12;

      // Umbrella pole
      var poleGeom = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
      var pole = new THREE.Mesh(poleGeom, materials.wood);
      pole.position.set(pos.x + umbrellaX, pos.y + 4, pos.z);
      scene.add(pole);
      resortObjects.push(pole);

      // Umbrella canvas (cone)
      var canopyGeom = new THREE.ConeGeometry(5, 1, 16);
      var canopy = new THREE.Mesh(canopyGeom, new THREE.MeshLambertMaterial({ color: 0xff69b4 }));
      canopy.position.set(pos.x + umbrellaX, pos.y + 8.5, pos.z);
      scene.add(canopy);
      resortObjects.push(canopy);
      animatedObjects.push({ object: canopy, type: 'umbrella' });
    }

    // Sun loungers
    for (var j = 0; j < 8; j++) {
      var loungeX = -50 + (j % 4) * 20;
      var loungeZ = pos.z - (Math.floor(j / 4) * 15);

      var loungeGeom = new THREE.BoxGeometry(3, 0.3, 8);
      var lounge = new THREE.Mesh(loungeGeom, materials.wood);
      lounge.position.set(pos.x + loungeX, pos.y + 0.3, loungeZ);
      scene.add(lounge);
      resortObjects.push(lounge);

      var backGeom = new THREE.BoxGeometry(3, 4, 0.5);
      var back = new THREE.Mesh(backGeom, materials.white);
      back.position.set(pos.x + loungeX, pos.y + 2.5, loungeZ - 3.5);
      back.rotation.z = 0.3;
      scene.add(back);
      resortObjects.push(back);
    }
  };

  var buildBungalows = function(pos) {
    // Create 6 villa bungalows
    for (var i = 0; i < 6; i++) {
      var bungX = (i % 3) * 35;
      var bungZ = Math.floor(i / 3) * 30;
      var bungPos = new THREE.Vector3(pos.x + bungX, pos.y, pos.z + bungZ);

      // Main bungalow body
      var bodyGeom = new THREE.BoxGeometry(12, 8, 15);
      var body = new THREE.Mesh(bodyGeom, new THREE.MeshLambertMaterial({ color: 0xdaa520 }));
      body.position.copy(bungPos);
      body.position.y = 4;
      scene.add(body);
      resortObjects.push(body);

      // Palm-leaf roof (cone)
      var roofGeom = new THREE.ConeGeometry(10, 6, 8);
      var roof = new THREE.Mesh(roofGeom, materials.palm);
      roof.position.copy(bungPos);
      roof.position.y = 11;
      roof.rotation.y = Math.random() * Math.PI * 2;
      scene.add(roof);
      resortObjects.push(roof);
      animatedObjects.push({ object: roof, type: 'palm' });

      // Front deck
      var deckGeom = new THREE.BoxGeometry(14, 0.3, 5);
      var deck = new THREE.Mesh(deckGeom, materials.wood);
      deck.position.copy(bungPos);
      deck.position.y = 0.5;
      deck.position.z += 10;
      scene.add(deck);
      resortObjects.push(deck);
    }
  };

  var buildMarina = function(pos) {
    // Dock structure
    var dockGeom = new THREE.BoxGeometry(50, 1.5, 20);
    var dock = new THREE.Mesh(dockGeom, materials.wood);
    dock.position.copy(pos);
    dock.position.y = 2;
    scene.add(dock);
    resortObjects.push(dock);

    // Pilings
    for (var i = 0; i < 8; i++) {
      var pilingGeom = new THREE.CylinderGeometry(1, 1.5, 8, 16);
      var piling = new THREE.Mesh(pilingGeom, materials.concrete);
      piling.position.copy(pos);
      piling.position.x += -20 + i * 7;
      piling.position.y = -2;
      scene.add(piling);
      resortObjects.push(piling);
    }

    // Yacht hulls
    for (var j = 0; j < 3; j++) {
      var hullGeom = new THREE.BoxGeometry(8, 5, 18);
      var hull = new THREE.Mesh(hullGeom, new THREE.MeshLambertMaterial({ color: 0xfffacd }));
      hull.position.copy(pos);
      hull.position.x += -15 + j * 20;
      hull.position.z += 15;
      hull.position.y = 3;
      scene.add(hull);
      resortObjects.push(hull);

      var cabinGeom = new THREE.BoxGeometry(6, 4, 10);
      var cabin = new THREE.Mesh(cabinGeom, materials.white);
      cabin.position.copy(hull.position);
      cabin.position.y += 4;
      scene.add(cabin);
      resortObjects.push(cabin);
    }
  };

  var buildCasinoWing = function(pos) {
    // Main casino structure
    var casinoGeom = new THREE.BoxGeometry(35, 20, 30);
    var casinoMat = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
    var casino = new THREE.Mesh(casinoGeom, casinoMat);
    casino.position.copy(pos);
    casino.position.y = 10;
    scene.add(casino);
    resortObjects.push(casino);

    // Neon accent strips (emissive)
    var neonGeom = new THREE.BoxGeometry(35, 1, 30);
    var neonStrip1 = new THREE.Mesh(neonGeom, materials.neon);
    neonStrip1.position.copy(pos);
    neonStrip1.position.y = 20;
    scene.add(neonStrip1);
    resortObjects.push(neonStrip1);
    animatedObjects.push({ object: neonStrip1, type: 'beacon' });

    var neonStrip2 = new THREE.Mesh(neonGeom, materials.neon);
    neonStrip2.position.copy(pos);
    neonStrip2.position.y = 0;
    scene.add(neonStrip2);
    resortObjects.push(neonStrip2);
    animatedObjects.push({ object: neonStrip2, type: 'beacon' });

    // Entrance columns
    for (var i = 0; i < 2; i++) {
      var colGeom = new THREE.CylinderGeometry(2, 2, 20, 16);
      var col = new THREE.Mesh(colGeom, materials.concrete);
      col.position.copy(pos);
      col.position.x += (i === 0 ? -14 : 14);
      col.position.y = 10;
      col.position.z -= 15;
      scene.add(col);
      resortObjects.push(col);
    }
  };

  var buildGardenPath = function(pos) {
    // Stone path (series of boxes)
    for (var i = 0; i < 8; i++) {
      var stoneGeom = new THREE.BoxGeometry(4, 0.2, 4);
      var stone = new THREE.Mesh(stoneGeom, materials.concrete);
      stone.position.copy(pos);
      stone.position.z += i * 6;
      scene.add(stone);
      resortObjects.push(stone);
    }

    // Palm trees along path
    for (var j = 0; j < 5; j++) {
      var palmX = pos.x + (j % 2 === 0 ? -8 : 8);
      var palmZ = pos.z + j * 10;

      // Trunk
      var trunkGeom = new THREE.CylinderGeometry(1, 1.5, 12, 8);
      var trunk = new THREE.Mesh(trunkGeom, materials.wood);
      trunk.position.set(palmX, pos.y + 6, palmZ);
      scene.add(trunk);
      resortObjects.push(trunk);

      // Fronds (cones)
      var frondGeom = new THREE.ConeGeometry(6, 4, 8);
      var frond = new THREE.Mesh(frondGeom, materials.palm);
      frond.position.set(palmX, pos.y + 13, palmZ);
      frond.rotation.y = Math.random() * Math.PI * 2;
      scene.add(frond);
      resortObjects.push(frond);
      animatedObjects.push({ object: frond, type: 'palm' });
    }
  };

  var buildHelipad = function(pos) {
    // Helipad platform
    var padGeom = new THREE.BoxGeometry(30, 0.5, 30);
    var padMat = new THREE.MeshLambertMaterial({ color: 0x800080 });
    var pad = new THREE.Mesh(padGeom, padMat);
    pad.position.copy(pos);
    scene.add(pad);
    resortObjects.push(pad);
    animatedObjects.push({ object: pad, type: 'helipad' });

    // Markings (H circle)
    var ringGeom = new THREE.CylinderGeometry(12, 12, 0.1, 32);
    var ringMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    var ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.copy(pos);
    ring.position.y += 0.3;
    scene.add(ring);
    resortObjects.push(ring);

    // Beacon light
    var beaconGeom = new THREE.SphereGeometry(1, 8, 8);
    var beaconMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1 });
    var beacon = new THREE.Mesh(beaconGeom, beaconMat);
    beacon.position.copy(pos);
    beacon.position.y += 2;
    scene.add(beacon);
    resortObjects.push(beacon);
    animatedObjects.push({ object: beacon, type: 'beacon' });
  };

  var buildWaterSlideTower = function(pos) {
    // Tower frame
    var frameGeom = new THREE.BoxGeometry(15, 25, 15);
    var frame = new THREE.Mesh(frameGeom, new THREE.MeshLambertMaterial({ color: 0x4169e1 }));
    frame.position.copy(pos);
    frame.position.y = 12.5;
    scene.add(frame);
    resortObjects.push(frame);

    // Slide sections (cylinders)
    var startY = 25;
    for (var i = 0; i < 4; i++) {
      var slideGeom = new THREE.CylinderGeometry(3, 3, 8, 16);
      var slide = new THREE.Mesh(slideGeom, new THREE.MeshLambertMaterial({ color: 0xffa500 }));
      slide.position.copy(pos);
      slide.position.y = startY - i * 8;
      slide.rotation.z = 0.3;
      scene.add(slide);
      resortObjects.push(slide);
    }

    // Exit pool
    var poolGeom = new THREE.BoxGeometry(20, 1, 25);
    var pool = new THREE.Mesh(poolGeom, materials.water);
    pool.position.copy(pos);
    pool.position.y = -1.5;
    pool.position.z += 20;
    scene.add(pool);
    resortObjects.push(pool);
  };

  var buildBeachBar = function(pos) {
    // Bar counter
    var counterGeom = new THREE.BoxGeometry(18, 1.5, 6);
    var counter = new THREE.Mesh(counterGeom, materials.wood);
    counter.position.copy(pos);
    counter.position.y = 1;
    scene.add(counter);
    resortObjects.push(counter);

    // Bar front
    var frontGeom = new THREE.BoxGeometry(20, 3, 1);
    var front = new THREE.Mesh(frontGeom, new THREE.MeshLambertMaterial({ color: 0xd2b48c }));
    front.position.copy(pos);
    front.position.y = 1.5;
    front.position.z -= 3;
    scene.add(front);
    resortObjects.push(front);

    // Serving area
    var servGeom = new THREE.BoxGeometry(8, 1, 4);
    var serv = new THREE.Mesh(servGeom, materials.concrete);
    serv.position.copy(pos);
    serv.position.y = 1.5;
    serv.position.z += 5;
    scene.add(serv);
    resortObjects.push(serv);

    // Roof (cone)
    var roofGeom = new THREE.ConeGeometry(12, 6, 8);
    var roof = new THREE.Mesh(roofGeom, new THREE.MeshLambertMaterial({ color: 0xffe4b5 }));
    roof.position.copy(pos);
    roof.position.y = 6;
    scene.add(roof);
    resortObjects.push(roof);
  };

  var buildDiningTables = function(pos) {
    // Outdoor dining tables
    for (var i = 0; i < 6; i++) {
      var tableX = -25 + (i % 3) * 25;
      var tableZ = pos.z + Math.floor(i / 3) * 20;

      var tableGeom = new THREE.BoxGeometry(10, 0.5, 10);
      var table = new THREE.Mesh(tableGeom, materials.wood);
      table.position.set(pos.x + tableX, pos.y + 0.8, tableZ);
      scene.add(table);
      resortObjects.push(table);

      // Table legs
      for (var j = 0; j < 4; j++) {
        var legX = tableX + (j < 2 ? -4 : 4);
        var legZ = tableZ + (j % 2 === 0 ? -4 : 4);

        var legGeom = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8);
        var leg = new THREE.Mesh(legGeom, materials.steel);
        leg.position.set(pos.x + legX, pos.y + 0.75, legZ);
        scene.add(leg);
        resortObjects.push(leg);
      }

      // Chairs
      for (var k = 0; k < 4; k++) {
        var chairX = tableX + (k < 2 ? -6 : 6);
        var chairZ = tableZ + (k % 2 === 0 ? -6 : 6);

        var chairGeom = new THREE.BoxGeometry(2, 2, 2);
        var chair = new THREE.Mesh(chairGeom, new THREE.MeshLambertMaterial({ color: 0xbdb76b }));
        chair.position.set(pos.x + chairX, pos.y + 1, chairZ);
        scene.add(chair);
        resortObjects.push(chair);
      }
    }
  };

  var buildFountain = function(pos) {
    // Basin (cylinder)
    var basinGeom = new THREE.CylinderGeometry(8, 10, 1.5, 32);
    var basin = new THREE.Mesh(basinGeom, materials.concrete);
    basin.position.copy(pos);
    basin.position.y = 0.75;
    scene.add(basin);
    resortObjects.push(basin);

    // Center pillar
    var pillarGeom = new THREE.CylinderGeometry(2, 2, 8, 16);
    var pillar = new THREE.Mesh(pillarGeom, materials.concrete);
    pillar.position.copy(pos);
    pillar.position.y = 4;
    scene.add(pillar);
    resortObjects.push(pillar);

    // Water drops (spheres)
    for (var i = 0; i < 20; i++) {
      var dropGeom = new THREE.SphereGeometry(0.4, 6, 6);
      var drop = new THREE.Mesh(dropGeom, materials.water);
      drop.position.copy(pos);
      drop.userData.baseY = pos.y + 8;
      drop.userData.angle = (i / 20) * Math.PI * 2;
      drop.userData.radius = 3;
      scene.add(drop);
      resortObjects.push(drop);
      animatedObjects.push({ object: drop, type: 'fountain' });
    }
  };

  var buildSecurityBooth = function(pos) {
    var boothGeom = new THREE.BoxGeometry(6, 4, 6);
    var booth = new THREE.Mesh(boothGeom, materials.concrete);
    booth.position.copy(pos);
    booth.position.y = 2;
    scene.add(booth);
    resortObjects.push(booth);

    // Roof
    var roofGeom = new THREE.BoxGeometry(7, 1, 7);
    var roof = new THREE.Mesh(roofGeom, materials.steel);
    roof.position.copy(pos);
    roof.position.y = 5;
    scene.add(roof);
    resortObjects.push(roof);
  };

  var buildCartWreckage = function(pos) {
    // Overturned cart base
    var cartGeom = new THREE.BoxGeometry(3, 2, 5);
    var cart = new THREE.Mesh(cartGeom, materials.steel);
    cart.position.copy(pos);
    cart.position.y = 1;
    cart.rotation.z = 0.5;
    scene.add(cart);
    resortObjects.push(cart);

    // Scattered items
    for (var i = 0; i < 5; i++) {
      var itemGeom = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      var item = new THREE.Mesh(itemGeom, new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }));
      item.position.set(pos.x + (Math.random() - 0.5) * 8, pos.y + 2 + i * 0.5, pos.z + (Math.random() - 0.5) * 6);
      item.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      scene.add(item);
      resortObjects.push(item);
    }
  };

  var buildBarricade = function(pos) {
    // Barricade furniture and boxes
    for (var i = 0; i < 3; i++) {
      var barGeom = new THREE.BoxGeometry(8, 4, 1.5);
      var bar = new THREE.Mesh(barGeom, materials.red);
      bar.position.copy(pos);
      bar.position.y = 2;
      bar.position.z -= i * 2;
      scene.add(bar);
      resortObjects.push(bar);
    }

    // Sandbags
    for (var j = 0; j < 6; j++) {
      var bagGeom = new THREE.BoxGeometry(1.5, 0.8, 0.8);
      var bag = new THREE.Mesh(bagGeom, new THREE.MeshLambertMaterial({ color: 0x8b7355 }));
      bag.position.copy(pos);
      bag.position.y = 0.4 + (j % 2) * 1;
      bag.position.x += -6 + j * 2;
      scene.add(bag);
      resortObjects.push(bag);
    }
  };

  var buildSWATStaging = function(pos) {
    // SWAT vehicles (tactical)
    for (var i = 0; i < 3; i++) {
      var vehicleGeom = new THREE.BoxGeometry(8, 4, 15);
      var vehicleMat = new THREE.MeshLambertMaterial({ color: 0x2f2f2f });
      var vehicle = new THREE.Mesh(vehicleGeom, vehicleMat);
      vehicle.position.copy(pos);
      vehicle.position.x += -15 + i * 18;
      vehicle.position.y = 2;
      scene.add(vehicle);
      resortObjects.push(vehicle);

      // Vehicle turret/equipment mount
      var turretGeom = new THREE.CylinderGeometry(1.5, 2, 3, 8);
      var turret = new THREE.Mesh(turretGeom, materials.steel);
      turret.position.copy(vehicle.position);
      turret.position.y += 3;
      scene.add(turret);
      resortObjects.push(turret);
    }

    // Staging equipment boxes
    for (var j = 0; j < 8; j++) {
      var boxGeom = new THREE.BoxGeometry(2.5, 2.5, 2.5);
      var boxMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
      var box = new THREE.Mesh(boxGeom, boxMat);
      box.position.set(pos.x + (j % 4) * 4, pos.y + 1.25, pos.z - Math.floor(j / 4) * 5);
      scene.add(box);
      resortObjects.push(box);
    }
  };

  var update = function(delta) {
    time += delta;

    for (var i = 0; i < animatedObjects.length; i++) {
      var anim = animatedObjects[i];

      if (anim.type === 'water') {
        anim.object.position.y = -1.5 + Math.sin(time * 3) * 0.1;
      } else if (anim.type === 'umbrella') {
        anim.object.rotation.z = Math.sin(time * 0.5) * 0.1;
      } else if (anim.type === 'palm') {
        anim.object.rotation.x = Math.sin(time * 0.8) * 0.05;
        anim.object.rotation.y = Math.sin(time * 0.6) * 0.08;
      } else if (anim.type === 'beacon') {
        var blink = (Math.sin(time * 4) + 1) / 2;
        anim.object.material.emissiveIntensity = blink;
      } else if (anim.type === 'fountain') {
        var drop = anim.object;
        var angle = drop.userData.angle + time * 2;
        var radius = drop.userData.radius;
        drop.position.x = drop.userData.baseY * Math.cos(angle) - drop.userData.baseY;
        drop.position.y = drop.userData.baseY + Math.sin(time * 4 + drop.userData.angle) * 2;
        drop.position.z = drop.userData.baseY * Math.sin(angle);
      } else if (anim.type === 'helipad') {
        anim.object.rotation.z += 0.01;
      }
    }
  };

  var reset = function() {
    time = 0;
    for (var i = 0; i < resortObjects.length; i++) {
      resortObjects[i].position.set(resortObjects[i].userData.initX || 0, resortObjects[i].userData.initY || 0, resortObjects[i].userData.initZ || 0);
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
