window.RustCanyon = (function() {
  'use strict';

  // Module state
  var scene = null;
  var camera = null;
  var environmentObjects = [];
  var dustParticles = [];
  var conveyorBelts = [];
  var movingCarts = [];
  var time = 0;

  // Material definitions
  var materials = {
    rustRed: new THREE.MeshStandardMaterial({ color: 0x8B4513, metalness: 0.4, roughness: 0.7 }),
    deepRust: new THREE.MeshStandardMaterial({ color: 0x6B3410, metalness: 0.5, roughness: 0.8 }),
    darkIron: new THREE.MeshStandardMaterial({ color: 0x3A3A3A, metalness: 0.8, roughness: 0.3 }),
    stone: new THREE.MeshStandardMaterial({ color: 0x7A6B5D, metalness: 0.1, roughness: 0.9 }),
    corroded: new THREE.MeshStandardMaterial({ color: 0xA0522D, metalness: 0.6, roughness: 0.6 }),
    dustRed: new THREE.MeshStandardMaterial({ color: 0xCD5C5C, metalness: 0.2, roughness: 0.8 })
  };

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    environmentObjects = [];
    dustParticles = [];
    conveyorBelts = [];
    movingCarts = [];
    time = 0;

    // Set scene background
    scene.background = new THREE.Color(0x4a2c2a);
    scene.fog = new THREE.Fog(0x4a2c2a, 120, 200);

    // Add ambient lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light (sun)
    var sunLight = new THREE.DirectionalLight(0xffa500, 0.8);
    sunLight.position.set(50, 60, 40);
    sunLight.castShadow = true;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // Build canyon floor and walls
    buildCanyonFloor();
    buildCanyonWalls();

    // Build mining equipment and structures
    buildOreProcessingBuilding();
    buildConveyorSystems();
    buildMiningEquipment();
    buildOreCarts();
    buildSuspensionBridge();
    buildSnipersPerches();
    buildBlastCraters();
    buildRockyOutcroppings();

    // Create dust particle system
    createDustParticles();
  }

  function buildCanyonFloor() {
    // Canyon floor base
    var floorGeom = new THREE.BoxGeometry(80, 2, 80);
    var floor = new THREE.Mesh(floorGeom, materials.deepRust);
    floor.position.y = 0;
    floor.castShadow = true;
    floor.receiveShadow = true;
    scene.add(floor);
    environmentObjects.push(floor);

    // Scattered rocks on floor
    for (var i = 0; i < 8; i++) {
      var rockGeom = new THREE.SphereGeometry(2 + Math.random() * 3, 6, 6);
      var rock = new THREE.Mesh(rockGeom, materials.stone);
      rock.position.x = (Math.random() - 0.5) * 70;
      rock.position.y = 3;
      rock.position.z = (Math.random() - 0.5) * 70;
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
      environmentObjects.push(rock);
    }
  }

  function buildCanyonWalls() {
    // Left canyon wall with terraces
    for (var t = 0; t < 4; t++) {
      var terraceHeight = 12 + t * 15;
      var terraceDepth = 10 + t * 2;
      var terraceX = -35 - t * 5;

      var terraceGeom = new THREE.BoxGeometry(15, 3, terraceDepth);
      var terrace = new THREE.Mesh(terraceGeom, materials.rustRed);
      terrace.position.x = terraceX;
      terrace.position.y = terraceHeight;
      terrace.position.z = -35;
      terrace.castShadow = true;
      terrace.receiveShadow = true;
      scene.add(terrace);
      environmentObjects.push(terrace);
    }

    // Right canyon wall with terraces
    for (var t = 0; t < 4; t++) {
      var terraceHeight = 12 + t * 15;
      var terraceDepth = 10 + t * 2;
      var terraceX = 35 + t * 5;

      var terraceGeom = new THREE.BoxGeometry(15, 3, terraceDepth);
      var terrace = new THREE.Mesh(terraceGeom, materials.corroded);
      terrace.position.x = terraceX;
      terrace.position.y = terraceHeight;
      terrace.position.z = 35;
      terrace.castShadow = true;
      terrace.receiveShadow = true;
      scene.add(terrace);
      environmentObjects.push(terrace);
    }

    // Back canyon wall - solid
    var backWallGeom = new THREE.BoxGeometry(80, 60, 5);
    var backWall = new THREE.Mesh(backWallGeom, materials.deepRust);
    backWall.position.y = 30;
    backWall.position.z = -40;
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    scene.add(backWall);
    environmentObjects.push(backWall);

    // Front canyon wall - solid
    var frontWallGeom = new THREE.BoxGeometry(80, 60, 5);
    var frontWall = new THREE.Mesh(frontWallGeom, materials.rustRed);
    frontWall.position.y = 30;
    frontWall.position.z = 40;
    frontWall.castShadow = true;
    frontWall.receiveShadow = true;
    scene.add(frontWall);
    environmentObjects.push(frontWall);
  }

  function buildOreProcessingBuilding() {
    // Main building structure at canyon floor
    var buildingGeom = new THREE.BoxGeometry(18, 20, 16);
    var building = new THREE.Mesh(buildingGeom, materials.darkIron);
    building.position.set(0, 10, 0);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    environmentObjects.push(building);

    // Smokestack
    var stackGeom = new THREE.CylinderGeometry(2.5, 3, 18, 8);
    var stack = new THREE.Mesh(stackGeom, materials.corroded);
    stack.position.set(5, 20, -6);
    stack.castShadow = true;
    stack.receiveShadow = true;
    scene.add(stack);
    environmentObjects.push(stack);

    // Processing equipment cylinder
    var equipGeom = new THREE.CylinderGeometry(3, 3.5, 12, 12);
    var equip = new THREE.Mesh(equipGeom, materials.rustRed);
    equip.position.set(-6, 8, 5);
    equip.castShadow = true;
    equip.receiveShadow = true;
    scene.add(equip);
    environmentObjects.push(equip);
  }

  function buildConveyorSystems() {
    // Conveyor belt 1: descending left wall
    var belt1Elements = [];
    for (var i = 0; i < 5; i++) {
      var beltGeom = new THREE.BoxGeometry(3, 0.8, 12);
      var belt = new THREE.Mesh(beltGeom, materials.darkIron);
      belt.position.set(-32, 50 - i * 10, -20);
      belt.rotation.z = Math.PI / 8;
      belt.castShadow = true;
      belt.receiveShadow = true;
      scene.add(belt);
      belt1Elements.push(belt);
      environmentObjects.push(belt);
    }
    conveyorBelts.push({ elements: belt1Elements, speed: 0.05, offset: 0 });

    // Conveyor belt 2: descending right wall
    var belt2Elements = [];
    for (var i = 0; i < 5; i++) {
      var beltGeom = new THREE.BoxGeometry(3, 0.8, 12);
      var belt = new THREE.Mesh(beltGeom, materials.darkIron);
      belt.position.set(32, 50 - i * 10, 20);
      belt.rotation.z = -Math.PI / 8;
      belt.castShadow = true;
      belt.receiveShadow = true;
      scene.add(belt);
      belt2Elements.push(belt);
      environmentObjects.push(belt);
    }
    conveyorBelts.push({ elements: belt2Elements, speed: 0.05, offset: 0 });

    // Conveyor support structures (chains of boxes)
    for (var i = 0; i < 8; i++) {
      var supportGeom = new THREE.BoxGeometry(1.5, 8, 1.5);
      var support = new THREE.Mesh(supportGeom, materials.corroded);
      support.position.set(-35 + i * 10, 40 - i * 5, -25);
      support.castShadow = true;
      support.receiveShadow = true;
      scene.add(support);
      environmentObjects.push(support);
    }
  }

  function buildMiningEquipment() {
    // Excavator bucket at terrace
    var bucketGeom = new THREE.BoxGeometry(8, 5, 6);
    var bucket = new THREE.Mesh(bucketGeom, materials.rustRed);
    bucket.position.set(-25, 28, -20);
    bucket.rotation.z = 0.3;
    bucket.castShadow = true;
    bucket.receiveShadow = true;
    scene.add(bucket);
    environmentObjects.push(bucket);

    // Excavator arm (cylinder)
    var armGeom = new THREE.CylinderGeometry(0.8, 0.8, 15, 8);
    var arm = new THREE.Mesh(armGeom, materials.darkIron);
    arm.position.set(-15, 30, -18);
    arm.rotation.z = 0.5;
    arm.castShadow = true;
    arm.receiveShadow = true;
    scene.add(arm);
    environmentObjects.push(arm);

    // Excavator cab
    var cabGeom = new THREE.BoxGeometry(4, 4, 4);
    var cab = new THREE.Mesh(cabGeom, materials.corroded);
    cab.position.set(-18, 35, -16);
    cab.castShadow = true;
    cab.receiveShadow = true;
    scene.add(cab);
    environmentObjects.push(cab);

    // Drill tower
    var drillBaseGeom = new THREE.CylinderGeometry(3, 4, 8, 8);
    var drillBase = new THREE.Mesh(drillBaseGeom, materials.darkIron);
    drillBase.position.set(20, 10, -25);
    drillBase.castShadow = true;
    drillBase.receiveShadow = true;
    scene.add(drillBase);
    environmentObjects.push(drillBase);

    var drillHeadGeom = new THREE.CylinderGeometry(1.5, 1.5, 6, 8);
    var drillHead = new THREE.Mesh(drillHeadGeom, materials.rustRed);
    drillHead.position.set(20, 18, -25);
    drillHead.castShadow = true;
    drillHead.receiveShadow = true;
    scene.add(drillHead);
    environmentObjects.push(drillHead);
  }

  function buildOreCarts() {
    // Ore cart train 1 - derailed on canyon floor
    for (var i = 0; i < 3; i++) {
      var cartGeom = new THREE.BoxGeometry(6, 3.5, 4);
      var cart = new THREE.Mesh(cartGeom, materials.rustRed);
      cart.position.set(-15 + i * 8, 2, 15);
      cart.rotation.z = 0.1 * i;
      cart.castShadow = true;
      cart.receiveShadow = true;
      scene.add(cart);
      environmentObjects.push(cart);

      // Wheels (spheres)
      for (var w = 0; w < 2; w++) {
        var wheelGeom = new THREE.SphereGeometry(1, 8, 8);
        var wheel = new THREE.Mesh(wheelGeom, materials.darkIron);
        wheel.position.set(-15 + i * 8 + (w === 0 ? -2.5 : 2.5), 1, 15);
        wheel.castShadow = true;
        wheel.receiveShadow = true;
        scene.add(wheel);
        environmentObjects.push(wheel);
      }
    }

    // Ore cart train 2 - on track on elevated terrace
    for (var i = 0; i < 2; i++) {
      var cartGeom = new THREE.BoxGeometry(6, 3.5, 4);
      var cart = new THREE.Mesh(cartGeom, materials.corroded);
      cart.position.set(15 + i * 8, 28, -30);
      cart.castShadow = true;
      cart.receiveShadow = true;
      scene.add(cart);
      movingCarts.push(cart);
      environmentObjects.push(cart);
    }

    // Cart for animation tracking
    var trackingCart = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials.dustRed);
    trackingCart.visible = false;
    scene.add(trackingCart);
    movingCarts.push(trackingCart);
  }

  function buildSuspensionBridge() {
    // Bridge cables (cylinders)
    var cableLeftGeom = new THREE.CylinderGeometry(0.4, 0.4, 60, 6);
    var cableLeft = new THREE.Mesh(cableLeftGeom, materials.darkIron);
    cableLeft.position.set(-28, 35, 0);
    cableLeft.rotation.z = 0.2;
    cableLeft.castShadow = true;
    cableLeft.receiveShadow = true;
    scene.add(cableLeft);
    environmentObjects.push(cableLeft);

    var cableRightGeom = new THREE.CylinderGeometry(0.4, 0.4, 60, 6);
    var cableRight = new THREE.Mesh(cableRightGeom, materials.darkIron);
    cableRight.position.set(28, 35, 0);
    cableRight.rotation.z = -0.2;
    cableRight.castShadow = true;
    cableRight.receiveShadow = true;
    scene.add(cableRight);
    environmentObjects.push(cableRight);

    // Bridge deck
    var deckGeom = new THREE.BoxGeometry(8, 1, 50);
    var deck = new THREE.Mesh(deckGeom, materials.corroded);
    deck.position.y = 30;
    deck.castShadow = true;
    deck.receiveShadow = true;
    scene.add(deck);
    environmentObjects.push(deck);

    // Bridge railings (box segments)
    for (var i = 0; i < 5; i++) {
      var railGeom = new THREE.BoxGeometry(0.5, 3, 1);
      var railLeft = new THREE.Mesh(railGeom, materials.rustRed);
      railLeft.position.set(-4.5, 33, -20 + i * 10);
      railLeft.castShadow = true;
      railLeft.receiveShadow = true;
      scene.add(railLeft);
      environmentObjects.push(railLeft);

      var railRight = new THREE.Mesh(railGeom, materials.rustRed);
      railRight.position.set(4.5, 33, -20 + i * 10);
      railRight.castShadow = true;
      railRight.receiveShadow = true;
      scene.add(railRight);
      environmentObjects.push(railRight);
    }
  }

  function buildSnipersPerches() {
    // Sniper perch 1 - left wall high point
    var perch1BaseGeom = new THREE.BoxGeometry(8, 2, 8);
    var perch1Base = new THREE.Mesh(perch1BaseGeom, materials.stone);
    perch1Base.position.set(-35, 62, -30);
    perch1Base.castShadow = true;
    perch1Base.receiveShadow = true;
    scene.add(perch1Base);
    environmentObjects.push(perch1Base);

    var perch1ShieldGeom = new THREE.BoxGeometry(4, 5, 1.5);
    var perch1Shield = new THREE.Mesh(perch1ShieldGeom, materials.corroded);
    perch1Shield.position.set(-35, 66, -35);
    perch1Shield.castShadow = true;
    perch1Shield.receiveShadow = true;
    scene.add(perch1Shield);
    environmentObjects.push(perch1Shield);

    // Sniper perch 2 - right wall high point
    var perch2BaseGeom = new THREE.BoxGeometry(8, 2, 8);
    var perch2Base = new THREE.Mesh(perch2BaseGeom, materials.stone);
    perch2Base.position.set(35, 62, 30);
    perch2Base.castShadow = true;
    perch2Base.receiveShadow = true;
    scene.add(perch2Base);
    environmentObjects.push(perch2Base);

    var perch2ShieldGeom = new THREE.BoxGeometry(4, 5, 1.5);
    var perch2Shield = new THREE.Mesh(perch2ShieldGeom, materials.corroded);
    perch2Shield.position.set(35, 66, 35);
    perch2Shield.castShadow = true;
    perch2Shield.receiveShadow = true;
    scene.add(perch2Shield);
    environmentObjects.push(perch2Shield);

    // Sniper perch 3 - middle height
    var perch3BaseGeom = new THREE.BoxGeometry(6, 1.5, 6);
    var perch3Base = new THREE.Mesh(perch3BaseGeom, materials.stone);
    perch3Base.position.set(0, 45, -35);
    perch3Base.castShadow = true;
    perch3Base.receiveShadow = true;
    scene.add(perch3Base);
    environmentObjects.push(perch3Base);
  }

  function buildBlastCraters() {
    // Crater 1 - deep depression with rim
    var craterRimGeom = new THREE.CylinderGeometry(8, 6, 1, 12);
    var craterRim1 = new THREE.Mesh(craterRimGeom, materials.rustRed);
    craterRim1.position.set(-20, 1, -15);
    craterRim1.castShadow = true;
    craterRim1.receiveShadow = true;
    scene.add(craterRim1);
    environmentObjects.push(craterRim1);

    // Crater 2
    var craterRim2 = new THREE.Mesh(craterRimGeom, materials.corroded);
    craterRim2.position.set(20, 1, 15);
    craterRim2.castShadow = true;
    craterRim2.receiveShadow = true;
    scene.add(craterRim2);
    environmentObjects.push(craterRim2);

    // Crater 3
    var craterRim3 = new THREE.Mesh(new THREE.CylinderGeometry(6, 4.5, 0.8, 10), materials.deepRust);
    craterRim3.position.set(0, 1, -25);
    craterRim3.castShadow = true;
    craterRim3.receiveShadow = true;
    scene.add(craterRim3);
    environmentObjects.push(craterRim3);
  }

  function buildRockyOutcroppings() {
    // Rocky outcroppings for cover
    for (var i = 0; i < 6; i++) {
      var rockGeom = new THREE.SphereGeometry(4 + Math.random() * 2, 6, 6);
      var rock = new THREE.Mesh(rockGeom, materials.stone);
      rock.position.x = -35 + i * 14;
      rock.position.y = 8;
      rock.position.z = -30 + Math.sin(i) * 20;
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
      environmentObjects.push(rock);
    }

    // Ore deposit boulders
    for (var i = 0; i < 5; i++) {
      var boulderGeom = new THREE.BoxGeometry(5, 6, 4);
      var boulder = new THREE.Mesh(boulderGeom, materials.corroded);
      boulder.position.x = -30 + i * 15;
      boulder.position.y = 5;
      boulder.position.z = 20 + Math.random() * 15;
      boulder.rotation.x = Math.random() * 0.5;
      boulder.rotation.z = Math.random() * 0.5;
      boulder.castShadow = true;
      boulder.receiveShadow = true;
      scene.add(boulder);
      environmentObjects.push(boulder);
    }
  }

  function createDustParticles() {
    var dustGeometry = new THREE.SphereGeometry(0.3, 4, 4);
    var dustMaterial = new THREE.MeshStandardMaterial({
      color: 0xCD5C5C,
      transparent: true,
      opacity: 0.4,
      emissive: 0x8B4513
    });

    for (var i = 0; i < 40; i++) {
      var dust = new THREE.Mesh(dustGeometry, dustMaterial);
      dust.position.set(
        (Math.random() - 0.5) * 80,
        Math.random() * 50,
        (Math.random() - 0.5) * 80
      );
      dust.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.3) * 2,
          (Math.random() - 0.5) * 8
        ),
        life: Math.random() * 0.8 + 0.5,
        maxLife: 1.2
      };
      scene.add(dust);
      dustParticles.push(dust);
    }
  }

  function update(delta) {
    time += delta;

    // Update conveyor belt animations
    for (var i = 0; i < conveyorBelts.length; i++) {
      var belt = conveyorBelts[i];
      belt.offset += belt.speed;
      for (var j = 0; j < belt.elements.length; j++) {
        var elem = belt.elements[j];
        elem.position.y -= (belt.offset - belt.lastOffset) * 0.5;
      }
      belt.lastOffset = belt.offset;
    }

    // Move ore carts along circular path
    for (var i = 0; i < movingCarts.length; i++) {
      var cart = movingCarts[i];
      var cartTime = time * 0.3 + i;
      var radius = 20;
      cart.position.x = 20 + Math.cos(cartTime) * radius;
      cart.position.z = -25 + Math.sin(cartTime) * radius * 0.6;
    }

    // Update dust particles with swirling motion
    for (var i = 0; i < dustParticles.length; i++) {
      var dust = dustParticles[i];
      var ud = dust.userData;

      // Add swirling force
      var swirl = Math.sin(time * 0.5 + i) * 0.3;
      ud.velocity.x += swirl * 0.02;
      ud.velocity.z += Math.cos(time * 0.4 + i) * 0.02;

      // Update position
      dust.position.add(ud.velocity.clone().multiplyScalar(delta * 0.5));

      // Wrap around if out of bounds
      if (dust.position.x < -40 || dust.position.x > 40) dust.position.x = -dust.position.x;
      if (dust.position.z < -40 || dust.position.z > 40) dust.position.z = -dust.position.z;
      if (dust.position.y < 0) dust.position.y = 50;
      if (dust.position.y > 60) dust.position.y = 0;

      // Fade in/out
      ud.life -= delta;
      if (ud.life <= 0) {
        ud.life = ud.maxLife;
        dust.position.set(
          (Math.random() - 0.5) * 80,
          Math.random() * 50,
          (Math.random() - 0.5) * 80
        );
      }
      dust.material.opacity = (ud.life / ud.maxLife) * 0.4;
    }
  }

  function reset() {
    // Remove all objects from scene
    for (var i = 0; i < environmentObjects.length; i++) {
      scene.remove(environmentObjects[i]);
    }
    for (var i = 0; i < dustParticles.length; i++) {
      scene.remove(dustParticles[i]);
    }
    environmentObjects = [];
    dustParticles = [];
    conveyorBelts = [];
    movingCarts = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
