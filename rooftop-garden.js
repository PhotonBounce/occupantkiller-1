window.RooftopGarden = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var animations = [];
  var assassins = [];
  var vips = [];

  function createBox(width, height, depth, color, x, y, z) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function createCylinder(radiusTop, radiusBottom, height, color, x, y, z) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 16);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function createSphere(radius, color, x, y, z) {
    var geometry = new THREE.SphereGeometry(radius, 16, 16);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function createCone(radius, height, color, x, y, z) {
    var geometry = new THREE.ConeGeometry(radius, height, 16);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function createLineSegments(points, color) {
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    var material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
    var mesh = new THREE.LineSegments(geometry, material);
    return mesh;
  }

  function createPlanter(x, y, z) {
    var planter = createBox(1.5, 0.6, 1.5, 0x8B6914, x, y, z);
    planter.castShadow = true;
    planter.receiveShadow = true;
    planter.userData.type = 'planter';

    var soil = createBox(1.4, 0.05, 1.4, 0x654321, x, y + 0.35, z);
    soil.castShadow = true;

    var plant1 = createSphere(0.35, 0x336633, x - 0.3, y + 0.7, z - 0.3);
    plant1.castShadow = true;
    plant1.userData.spawnPoint = true;

    var plant2 = createSphere(0.4, 0x2d5a2d, x + 0.4, y + 0.75, z + 0.2);
    plant2.castShadow = true;

    var plant3 = createSphere(0.3, 0x3d7a3d, x + 0.1, y + 0.65, z - 0.5);
    plant3.castShadow = true;

    objects.push(planter, soil, plant1, plant2, plant3);
    animations.push({ object: plant1, type: 'sway' });
    animations.push({ object: plant2, type: 'sway' });
    animations.push({ object: plant3, type: 'sway' });

    return planter;
  }

  function createPergola(x, z) {
    var material = new THREE.MeshStandardMaterial({ color: 0xF5F5F0 });

    var col1 = createBox(0.3, 3, 0.3, 0xF5F5F0, x, 1.5, z);
    col1.castShadow = true;
    col1.receiveShadow = true;

    var col2 = createBox(0.3, 3, 0.3, 0xF5F5F0, x + 2, 1.5, z);
    col2.castShadow = true;
    col2.receiveShadow = true;

    var col3 = createBox(0.3, 3, 0.3, 0xF5F5F0, x, 1.5, z + 2.5);
    col3.castShadow = true;
    col3.receiveShadow = true;

    var col4 = createBox(0.3, 3, 0.3, 0xF5F5F0, x + 2, 1.5, z + 2.5);
    col4.castShadow = true;
    col4.receiveShadow = true;

    var beam1 = createBox(2.3, 0.2, 0.2, 0xE8E8E0, x + 1, 3, z + 0.1);
    beam1.castShadow = true;
    beam1.receiveShadow = true;

    var beam2 = createBox(2.3, 0.2, 0.2, 0xE8E8E0, x + 1, 3, z + 2.4);
    beam2.castShadow = true;
    beam2.receiveShadow = true;

    var lattice1 = createLineSegments([
      x, 2.5, z, x + 2, 3, z + 2.5,
      x, 2.5, z + 2.5, x + 2, 3, z
    ], 0xD4D4C8);

    objects.push(col1, col2, col3, col4, beam1, beam2, lattice1);
    animations.push({ object: col1, type: 'shade' });
    col1.userData.spawnPoint = true;

    return { col1: col1, col2: col2 };
  }

  function createGreenhouse(x, z) {
    var frame1 = createBox(3, 0.3, 0.3, 0xE8E8E0, x, 2.8, z);
    frame1.castShadow = true;

    var frame2 = createBox(0.3, 2.5, 0.3, 0xE8E8E0, x + 1.5, 2, z);
    frame2.castShadow = true;

    var panel1 = createBox(1.5, 2.2, 0.01, 0x99CCFF, x + 0.5, 2, z - 0.2);
    panel1.castShadow = true;
    panel1.userData.type = 'greenhouse';

    var panel2 = createBox(1.5, 2.2, 0.01, 0x99CCFF, x + 2.5, 2, z - 0.2);
    panel2.castShadow = true;
    panel2.userData.type = 'greenhouse';

    objects.push(frame1, frame2, panel1, panel2);
    animations.push({ object: panel1, type: 'reflect' });
    animations.push({ object: panel2, type: 'reflect' });

    return frame1;
  }

  function createServiceKitchen(x, z) {
    var counter = createBox(3, 0.9, 1.2, 0x8B7355, x, 0.45, z);
    counter.castShadow = true;
    counter.receiveShadow = true;
    counter.userData.type = 'kitchen';
    counter.userData.spawnPoint = true;

    var shelf = createBox(3, 1.5, 0.5, 0x654321, x, 1.2, z + 0.8);
    shelf.castShadow = true;

    var equipment = createBox(0.8, 1.2, 0.6, 0x666666, x - 1.2, 0.6, z);
    equipment.castShadow = true;

    objects.push(counter, shelf, equipment);

    return counter;
  }

  function createElevatorShaft(x, z) {
    var shaft = createBox(1, 0.1, 1, 0xCCCCCC, x, 0.05, z);
    shaft.receiveShadow = true;
    shaft.userData.type = 'elevator';
    shaft.userData.spawnPoint = true;

    var door = createBox(0.95, 2.2, 0.05, 0x555555, x, 1.1, z - 0.5);
    door.castShadow = true;

    objects.push(shaft, door);

    return shaft;
  }

  function createBarCounter(x, z) {
    var bar = createBox(2.5, 1, 0.8, 0x8B6914, x, 0.5, z);
    bar.castShadow = true;
    bar.receiveShadow = true;
    bar.userData.type = 'bar';

    var bottles = [];
    for (var i = 0; i < 5; i++) {
      var bottle = createCylinder(0.1, 0.1, 0.6, 0x2d5016, x - 0.8 + i * 0.4, 1.3, z);
      bottle.castShadow = true;
      bottles.push(bottle);
      objects.push(bottle);
    }

    var glass1 = createSphere(0.08, 0xCCEEFF, x - 0.3, 1.15, z + 0.3);
    glass1.castShadow = true;

    var glass2 = createSphere(0.08, 0xCCEEFF, x + 0.3, 1.15, z + 0.2);
    glass2.castShadow = true;

    objects.push(bar, glass1, glass2);
    animations.push({ object: glass1, type: 'bounce' });

    return bar;
  }

  function createFirePit(x, z) {
    var ring = createCylinder(1.2, 1.2, 0.15, 0x555555, x, 0.075, z);
    ring.castShadow = true;
    ring.receiveShadow = true;

    var wood = createBox(0.2, 0.8, 0.2, 0x3d2817, x - 0.2, 0.4, z);
    wood.castShadow = true;

    var flame = createCone(0.5, 1, 0xFF6600, x, 0.8, z);
    flame.castShadow = true;
    flame.userData.type = 'fire';

    objects.push(ring, wood, flame);
    animations.push({ object: flame, type: 'flicker' });

    return ring;
  }

  function createVIPSeating(x, z) {
    var table = createBox(1.5, 0.8, 1.5, 0xC0A080, x, 0.4, z);
    table.castShadow = true;
    table.receiveShadow = true;
    table.userData.type = 'vip_table';

    var chair1 = createBox(0.5, 0.9, 0.5, 0xD4AF37, x - 0.8, 0.45, z - 0.8);
    chair1.castShadow = true;
    chair1.userData.vip = true;

    var chair2 = createBox(0.5, 0.9, 0.5, 0xD4AF37, x + 0.8, 0.45, z + 0.8);
    chair2.castShadow = true;
    chair2.userData.vip = true;

    var barrier1 = createBox(0.2, 0.8, 1.5, 0xD4AF37, x - 1.2, 0.4, z);
    barrier1.castShadow = true;

    var barrier2 = createBox(0.2, 0.8, 1.5, 0xD4AF37, x + 1.2, 0.4, z);
    barrier2.castShadow = true;

    objects.push(table, chair1, chair2, barrier1, barrier2);
    vips.push({ object: chair1, protected: true });
    vips.push({ object: chair2, protected: true });

    return table;
  }

  function createPottedTree(x, z) {
    var pot = createCone(0.5, 0.6, 0x8B4513, x, 0.3, z);
    pot.castShadow = true;
    pot.receiveShadow = true;

    var trunk = createCylinder(0.15, 0.2, 2, 0x654321, x, 1.3, z);
    trunk.castShadow = true;

    var canopy = createSphere(0.8, 0x1d4d1d, x, 2.8, z);
    canopy.castShadow = true;

    objects.push(pot, trunk, canopy);
    animations.push({ object: canopy, type: 'sway' });

    return canopy;
  }

  function createHelicopterMarker(x, z) {
    var marker = createBox(4, 0.05, 4, 0xFFCC00, x, 0.025, z);
    marker.receiveShadow = true;
    marker.userData.type = 'helipad';

    var stripe1 = createBox(0.3, 0.01, 4, 0xFF0000, x - 1.5, 0.03, z);
    var stripe2 = createBox(0.3, 0.01, 4, 0xFF0000, x + 1.5, 0.03, z);

    objects.push(marker, stripe1, stripe2);

    return marker;
  }

  function createFlowerBedBorder(x, z, width, depth) {
    var border = createBox(width, 0.15, depth, 0x8B6914, x, 0.075, z);
    border.castShadow = true;
    border.receiveShadow = true;

    var edging = createLineSegments([
      x - width / 2, 0.15, z - depth / 2,
      x + width / 2, 0.15, z - depth / 2,
      x + width / 2, 0.15, z - depth / 2,
      x + width / 2, 0.15, z + depth / 2,
      x + width / 2, 0.15, z + depth / 2,
      x - width / 2, 0.15, z + depth / 2,
      x - width / 2, 0.15, z + depth / 2,
      x - width / 2, 0.15, z - depth / 2
    ], 0xA0826D);

    objects.push(border, edging);

    return border;
  }

  function createAssassin(x, y, z) {
    var head = createSphere(0.2, 0x333333, x, y + 0.7, z);
    head.castShadow = true;

    var body = createBox(0.3, 0.6, 0.25, 0x222222, x, y + 0.25, z);
    body.castShadow = true;

    var leg1 = createBox(0.15, 0.5, 0.2, 0x1a1a1a, x - 0.1, y - 0.15, z);
    leg1.castShadow = true;

    var leg2 = createBox(0.15, 0.5, 0.2, 0x1a1a1a, x + 0.1, y - 0.15, z);
    leg2.castShadow = true;

    var assassin = {
      head: head,
      body: body,
      leg1: leg1,
      leg2: leg2,
      position: new THREE.Vector3(x, y, z),
      active: true,
      patrolTime: 0
    };

    objects.push(head, body, leg1, leg2);
    assassins.push(assassin);

    return assassin;
  }

  function init(scene, camera) {
    objects = [];
    lights = [];
    animations = [];
    assassins = [];
    vips = [];

    var sunLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
    sunLight.position.set(10, 15, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    scene.add(sunLight);
    lights.push(sunLight);

    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var rooftop = createBox(25, 0.1, 25, 0xCCCCCC, 0, 0, 0);
    rooftop.receiveShadow = true;
    rooftop.userData.type = 'rooftop';
    scene.add(rooftop);
    objects.push(rooftop);

    var northWall = createBox(25, 2, 0.3, 0xAAAAAA, 0, 1, -12.5);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    scene.add(northWall);
    objects.push(northWall);

    var southWall = createBox(25, 2, 0.3, 0xAAAAAA, 0, 1, 12.5);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    scene.add(southWall);
    objects.push(southWall);

    var eastWall = createBox(0.3, 2, 25, 0xAAAAAA, 12.5, 1, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    scene.add(eastWall);
    objects.push(eastWall);

    var westWall = createBox(0.3, 2, 25, 0xAAAAAA, -12.5, 1, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    scene.add(westWall);
    objects.push(westWall);

    createPlanter(-6, 0.3, -8);
    createPlanter(-2, 0.3, -8);
    createPlanter(2, 0.3, -8);
    createPlanter(6, 0.3, -8);

    createPlanter(-6, 0.3, -2);
    createPlanter(6, 0.3, -2);

    createPlanter(-6, 0.3, 4);
    createPlanter(-2, 0.3, 4);
    createPlanter(2, 0.3, 4);
    createPlanter(6, 0.3, 4);

    for (var i = 0; i < objects.length; i++) {
      scene.add(objects[i]);
    }

    createPergola(-8, -5);
    createPergola(2, -5);
    createPergola(-8, 4);
    createPergola(2, 4);

    createGreenhouse(8, -3);

    createServiceKitchen(-10, 7);

    createElevatorShaft(10, 10);

    createBarCounter(-2, 8);

    createFirePit(6, 9);

    createVIPSeating(-6, 8);
    createVIPSeating(4, -10);

    createPottedTree(-8, 2);
    createPottedTree(8, 2);
    createPottedTree(0, -6);

    createHelicopterMarker(0, -11);

    createFlowerBedBorder(-4, 0, 3, 10);
    createFlowerBedBorder(4, 0, 3, 10);

    createAssassin(-4, 0.5, 6);
    createAssassin(6, 0.5, -4);
    createAssassin(8, 0.5, 5);

    for (var j = 0; j < objects.length; j++) {
      scene.add(objects[j]);
    }
  }

  function update(delta) {
    for (var i = 0; i < animations.length; i++) {
      var anim = animations[i];

      if (anim.type === 'sway') {
        var swayAmount = Math.sin(Date.now() * 0.0005 + i * 0.2) * 0.02;
        if (anim.object.userData.originalRotZ === undefined) {
          anim.object.userData.originalRotZ = anim.object.rotation.z;
        }
        anim.object.rotation.z = anim.object.userData.originalRotZ + swayAmount;
      }

      if (anim.type === 'flicker') {
        var flicker = Math.random() * 0.3;
        anim.object.scale.y = 0.9 + flicker;
        var color = 0xFF6600 + Math.floor(Math.random() * 0x110000);
        if (anim.object.material) {
          anim.object.material.color.setHex(color);
        }
      }

      if (anim.type === 'reflect') {
        var reflect = Math.sin(Date.now() * 0.001) * 0.05;
        if (anim.object.userData.originalOpacity === undefined) {
          anim.object.userData.originalOpacity = 0.3;
        }
        anim.object.material.opacity = anim.object.userData.originalOpacity + reflect;
      }

      if (anim.type === 'bounce') {
        var bounce = Math.abs(Math.sin(Date.now() * 0.003)) * 0.1;
        if (anim.object.userData.originalY === undefined) {
          anim.object.userData.originalY = anim.object.position.y;
        }
        anim.object.position.y = anim.object.userData.originalY + bounce;
      }

      if (anim.type === 'shade') {
        var shade = Math.sin(Date.now() * 0.0008 + i) * 0.1;
        if (anim.object.userData.originalPosX === undefined) {
          anim.object.userData.originalPosX = anim.object.position.x;
        }
        anim.object.position.x = anim.object.userData.originalPosX + shade;
      }
    }

    for (var a = 0; a < assassins.length; a++) {
      var assassin = assassins[a];
      if (!assassin.active) continue;

      assassin.patrolTime += delta;
      var patrolDuration = 4;
      var patrolPhase = Math.floor(assassin.patrolTime / patrolDuration) % 4;
      var phaseFraction = (assassin.patrolTime % patrolDuration) / patrolDuration;

      var targetPos = new THREE.Vector3(0, 0.5, 0);
      switch (patrolPhase) {
        case 0:
          targetPos.set(-6 + phaseFraction * 4, 0.5, -8);
          break;
        case 1:
          targetPos.set(-2 + phaseFraction * 8, 0.5, -2);
          break;
        case 2:
          targetPos.set(6 - phaseFraction * 4, 0.5, 4);
          break;
        case 3:
          targetPos.set(2 - phaseFraction * 8, 0.5, 8);
          break;
      }

      var moveSpeed = 2;
      var direction = targetPos.clone().sub(assassin.position).normalize();
      assassin.position.addScaledVector(direction, moveSpeed * delta);

      assassin.head.position.copy(assassin.position).y += 0.7;
      assassin.body.position.copy(assassin.position).y += 0.25;
      assassin.leg1.position.copy(assassin.position).y -= 0.15;
      assassin.leg2.position.copy(assassin.position).y -= 0.15;

      var bodyLookTarget = assassin.position.clone().add(direction.multiplyScalar(2));
      assassin.body.lookAt(bodyLookTarget);
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].parent) {
        objects[i].parent.remove(objects[i]);
      }
    }

    for (var l = 0; l < lights.length; l++) {
      if (lights[l].parent) {
        lights[l].parent.remove(lights[l]);
      }
    }

    objects = [];
    lights = [];
    animations = [];
    assassins = [];
    vips = [];
  }

  return {
    init: init,
    update: update,
    reset: reset,
    objects: objects,
    assassins: assassins,
    vips: vips
  };
}());
