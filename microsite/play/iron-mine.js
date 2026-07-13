window.IronMine = (function() {
  'use strict';

  var objects = [];
  var animationState = {
    crusherRotation: 0,
    fanRotation: 0,
    cartPosition: 0,
    hoistHeight: 0,
    conveyorOffset: 0,
    detonatorPullback: 0
  };

  var init = function(scene, camera) {
    objects = [];

    // 1. MAIN ORE CART on rails
    var cartGroup = new THREE.Group();
    var cartBody = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 4),
      new THREE.MeshPhongMaterial({ color: 0x8B4513 })
    );
    cartBody.position.y = 0.8;
    var cartWheel1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16),
      new THREE.MeshPhongMaterial({ color: 0x333333 })
    );
    cartWheel1.rotation.z = Math.PI / 2;
    cartWheel1.position.set(-1, 0.5, -1);
    var cartWheel2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16),
      new THREE.MeshPhongMaterial({ color: 0x333333 })
    );
    cartWheel2.rotation.z = Math.PI / 2;
    cartWheel2.position.set(-1, 0.5, 1);
    var cartWheel3 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16),
      new THREE.MeshPhongMaterial({ color: 0x333333 })
    );
    cartWheel3.rotation.z = Math.PI / 2;
    cartWheel3.position.set(1, 0.5, -1);
    var cartWheel4 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16),
      new THREE.MeshPhongMaterial({ color: 0x333333 })
    );
    cartWheel4.rotation.z = Math.PI / 2;
    cartWheel4.position.set(1, 0.5, 1);
    cartGroup.add(cartBody);
    cartGroup.add(cartWheel1);
    cartGroup.add(cartWheel2);
    cartGroup.add(cartWheel3);
    cartGroup.add(cartWheel4);
    cartGroup.position.set(0, 0, 0);
    scene.add(cartGroup);
    objects.push(cartGroup);

    // 2. STAMPING MILL CRUSHER - vertical cylinders
    var crusherGroup = new THREE.Group();
    var crusherStamp1 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 2.5, 16),
      new THREE.MeshPhongMaterial({ color: 0x4a4a4a })
    );
    crusherStamp1.position.set(-2, 3, 0);
    var crusherStamp2 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 2.5, 16),
      new THREE.MeshPhongMaterial({ color: 0x4a4a4a })
    );
    crusherStamp2.position.set(2, 3, 0);
    var crusherBase = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.5, 3),
      new THREE.MeshPhongMaterial({ color: 0x5a5a5a })
    );
    crusherBase.position.set(0, 0.25, 0);
    crusherGroup.add(crusherStamp1);
    crusherGroup.add(crusherStamp2);
    crusherGroup.add(crusherBase);
    crusherGroup.position.set(-15, 0, -10);
    scene.add(crusherGroup);
    objects.push(crusherGroup);

    // 3. VENTILATION FAN SHAFT - spinning cylinder with blades
    var fanGroup = new THREE.Group();
    var fanShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 6, 8),
      new THREE.MeshPhongMaterial({ color: 0x333333 })
    );
    fanShaft.rotation.z = Math.PI / 2;
    var fanBlade1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 3, 0.1),
      new THREE.MeshPhongMaterial({ color: 0x666666 })
    );
    fanBlade1.position.set(0, 1.5, 0);
    var fanBlade2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 3, 0.1),
      new THREE.MeshPhongMaterial({ color: 0x666666 })
    );
    fanBlade2.position.set(0, -1.5, 0);
    fanGroup.add(fanShaft);
    fanGroup.add(fanBlade1);
    fanGroup.add(fanBlade2);
    fanGroup.position.set(10, 8, -15);
    scene.add(fanGroup);
    objects.push(fanGroup);

    // 4. BLASTING POWDER CACHE - stacked boxes
    var powderCacheGroup = new THREE.Group();
    var powderBox1 = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 1.5),
      new THREE.MeshPhongMaterial({ color: 0xC0C0C0 })
    );
    powderBox1.position.set(0, 0.75, 0);
    var powderBox2 = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 1.5),
      new THREE.MeshPhongMaterial({ color: 0xC0C0C0 })
    );
    powderBox2.position.set(0, 2.25, 0);
    var powderBox3 = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 1.5),
      new THREE.MeshPhongMaterial({ color: 0xC0C0C0 })
    );
    powderBox3.position.set(0, 3.75, 0);
    powderCacheGroup.add(powderBox1);
    powderCacheGroup.add(powderBox2);
    powderCacheGroup.add(powderBox3);
    powderCacheGroup.position.set(20, 0, 5);
    scene.add(powderCacheGroup);
    objects.push(powderCacheGroup);

    // 5. FOREMAN'S OFFICE - small structure with roof
    var officeGroup = new THREE.Group();
    var officeWalls = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 3),
      new THREE.MeshPhongMaterial({ color: 0x8B4513 })
    );
    officeWalls.position.y = 1.5;
    var officeRoof = new THREE.Mesh(
      new THREE.ConeGeometry(3.5, 1.5, 4),
      new THREE.MeshPhongMaterial({ color: 0x654321 })
    );
    officeRoof.position.y = 3.25;
    var officeFloor = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.2, 3),
      new THREE.MeshPhongMaterial({ color: 0x6B4423 })
    );
    officeFloor.position.y = 0.1;
    officeGroup.add(officeWalls);
    officeGroup.add(officeRoof);
    officeGroup.add(officeFloor);
    officeGroup.position.set(-25, 0, 15);
    scene.add(officeGroup);
    objects.push(officeGroup);

    // 6. UNDERGROUND RESERVOIR - large sphere
    var reservoir = new THREE.Mesh(
      new THREE.SphereGeometry(5, 32, 32),
      new THREE.MeshPhongMaterial({ color: 0x1a4d7a, transparent: true, opacity: 0.6 })
    );
    reservoir.position.set(15, -5, -20);
    scene.add(reservoir);
    objects.push(reservoir);

    // 7. HOIST ELEVATOR CAGE - vertical movement
    var hoistGroup = new THREE.Group();
    var cageFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2, 3, 2),
      new THREE.MeshPhongMaterial({ color: 0x8B0000 })
    );
    var cageDoor1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 3, 2),
      new THREE.MeshPhongMaterial({ color: 0xA52A2A })
    );
    cageDoor1.position.x = -1;
    var cageDoor2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 3, 2),
      new THREE.MeshPhongMaterial({ color: 0xA52A2A })
    );
    cageDoor2.position.x = 1;
    hoistGroup.add(cageFrame);
    hoistGroup.add(cageDoor1);
    hoistGroup.add(cageDoor2);
    hoistGroup.position.set(-30, 2, 0);
    scene.add(hoistGroup);
    objects.push(hoistGroup);

    // 8. ORE SORTING CONVEYOR - angled cylinder
    var conveyorGroup = new THREE.Group();
    var conveyorBelt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 12, 8),
      new THREE.MeshPhongMaterial({ color: 0x555555 })
    );
    conveyorBelt.rotation.z = Math.PI / 6;
    var conveyorFrame1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 13, 2),
      new THREE.MeshPhongMaterial({ color: 0x444444 })
    );
    conveyorFrame1.rotation.z = Math.PI / 6;
    conveyorFrame1.position.x = -1;
    var conveyorFrame2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 13, 2),
      new THREE.MeshPhongMaterial({ color: 0x444444 })
    );
    conveyorFrame2.rotation.z = Math.PI / 6;
    conveyorFrame2.position.x = 1;
    conveyorGroup.add(conveyorBelt);
    conveyorGroup.add(conveyorFrame1);
    conveyorGroup.add(conveyorFrame2);
    conveyorGroup.position.set(5, 5, 15);
    scene.add(conveyorGroup);
    objects.push(conveyorGroup);

    // 9. SUPPORT TIMBER ARCHES - cone shapes forming arch
    var archGroup = new THREE.Group();
    var arch1 = new THREE.Mesh(
      new THREE.ConeGeometry(2, 0.5, 8),
      new THREE.MeshPhongMaterial({ color: 0x654321 })
    );
    arch1.position.set(-5, 6, 0);
    arch1.rotation.z = Math.PI / 2;
    var arch2 = new THREE.Mesh(
      new THREE.ConeGeometry(2, 0.5, 8),
      new THREE.MeshPhongMaterial({ color: 0x654321 })
    );
    arch2.position.set(5, 6, 0);
    arch2.rotation.z = Math.PI / 2;
    var archConnector = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.3, 0.5),
      new THREE.MeshPhongMaterial({ color: 0x8B6914 })
    );
    archConnector.position.set(0, 6, 0);
    archGroup.add(arch1);
    archGroup.add(arch2);
    archGroup.add(archConnector);
    archGroup.position.set(0, 2, -25);
    scene.add(archGroup);
    objects.push(archGroup);

    // 10. EMERGENCY DETONATOR PLUNGER - cylindrical handle
    var detonatorGroup = new THREE.Group();
    var plungerHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 2, 8),
      new THREE.MeshPhongMaterial({ color: 0xFF0000 })
    );
    plungerHandle.position.y = 1;
    var plungerButton = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 16, 16),
      new THREE.MeshPhongMaterial({ color: 0xFFFF00 })
    );
    plungerButton.position.y = 2.5;
    var plungerBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.5, 1.5),
      new THREE.MeshPhongMaterial({ color: 0x333333 })
    );
    plungerBase.position.y = 0;
    detonatorGroup.add(plungerHandle);
    detonatorGroup.add(plungerButton);
    detonatorGroup.add(plungerBase);
    detonatorGroup.position.set(25, 0, 20);
    scene.add(detonatorGroup);
    objects.push(detonatorGroup);

    // 11. RAIL TRACKS - line segments forming grid
    var trackMaterial = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });
    var trackGeometry = new THREE.BufferGeometry();
    var trackPositions = new Float32Array([
      -40, 1, -40, 40, 1, -40,
      -40, 1, -20, 40, 1, -20,
      -40, 1, 0, 40, 1, 0,
      -40, 1, 20, 40, 1, 20,
      -40, 1, 40, 40, 1, 40
    ]);
    trackGeometry.setAttribute('position', new THREE.BufferAttribute(trackPositions, 3));
    var tracks = new THREE.LineSegments(trackGeometry, trackMaterial);
    scene.add(tracks);
    objects.push(tracks);

    // 12. MINING ORE PILES - spheres clustered
    var orePile1 = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 16, 16),
      new THREE.MeshPhongMaterial({ color: 0xA0522D })
    );
    orePile1.position.set(-20, 1.5, 25);
    scene.add(orePile1);
    objects.push(orePile1);

    var orePile2 = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      new THREE.MeshPhongMaterial({ color: 0x8B4513 })
    );
    orePile2.position.set(-18, 1.2, 27);
    scene.add(orePile2);
    objects.push(orePile2);

    var orePile3 = new THREE.Mesh(
      new THREE.SphereGeometry(1.8, 16, 16),
      new THREE.MeshPhongMaterial({ color: 0x954535 })
    );
    orePile3.position.set(-22, 1.8, 26);
    scene.add(orePile3);
    objects.push(orePile3);

    // 13. SUPPORT PILLARS - vertical cylinders
    var pillar1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 8, 12),
      new THREE.MeshPhongMaterial({ color: 0x696969 })
    );
    pillar1.position.set(-30, 4, -30);
    scene.add(pillar1);
    objects.push(pillar1);

    var pillar2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 8, 12),
      new THREE.MeshPhongMaterial({ color: 0x696969 })
    );
    pillar2.position.set(30, 4, -30);
    scene.add(pillar2);
    objects.push(pillar2);

    var pillar3 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 8, 12),
      new THREE.MeshPhongMaterial({ color: 0x696969 })
    );
    pillar3.position.set(-30, 4, 30);
    scene.add(pillar3);
    objects.push(pillar3);

    // 14. MINE CART FULL OF ORE - ore load boxes
    var oreLoadGroup = new THREE.Group();
    var ore1 = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.8, 1.2),
      new THREE.MeshPhongMaterial({ color: 0xA0522D })
    );
    ore1.position.set(-0.5, 1.8, -0.5);
    var ore2 = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.8, 1.2),
      new THREE.MeshPhongMaterial({ color: 0x8B4513 })
    );
    ore2.position.set(0.5, 1.8, 0.5);
    var ore3 = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.8, 1.2),
      new THREE.MeshPhongMaterial({ color: 0x954535 })
    );
    ore3.position.set(-0.5, 2.8, 0.5);
    oreLoadGroup.add(ore1);
    oreLoadGroup.add(ore2);
    oreLoadGroup.add(ore3);
    oreLoadGroup.position.set(0, 0, 0);
    scene.add(oreLoadGroup);
    objects.push(oreLoadGroup);

    // 15. MINE LAMP POST - cone light fixture
    var lampGroup = new THREE.Group();
    var lampPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 4, 8),
      new THREE.MeshPhongMaterial({ color: 0x333333 })
    );
    lampPost.position.y = 2;
    var lampShade = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 1, 8),
      new THREE.MeshPhongMaterial({ color: 0xFFD700 })
    );
    lampShade.position.y = 4.5;
    lampGroup.add(lampPost);
    lampGroup.add(lampShade);
    lampGroup.position.set(-35, 0, -20);
    scene.add(lampGroup);
    objects.push(lampGroup);

    // 16. BONUS - Rock formation (ConeGeometry)
    var rockFormation = new THREE.Mesh(
      new THREE.ConeGeometry(3, 4, 6),
      new THREE.MeshPhongMaterial({ color: 0x5a4a3a })
    );
    rockFormation.position.set(20, 2, -35);
    scene.add(rockFormation);
    objects.push(rockFormation);
  };

  var update = function(delta) {
    if (objects.length === 0) return;

    // Animate crusher - oscillate vertically
    animationState.crusherRotation += delta * 3;
    if (objects[1]) {
      var crusherStamps = objects[1].children;
      if (crusherStamps[0]) {
        crusherStamps[0].position.y = 3 + Math.sin(animationState.crusherRotation) * 0.5;
      }
      if (crusherStamps[1]) {
        crusherStamps[1].position.y = 3 + Math.sin(animationState.crusherRotation + Math.PI / 4) * 0.5;
      }
    }

    // Animate fan - spin rotation
    animationState.fanRotation += delta * 5;
    if (objects[2]) {
      objects[2].rotation.z = animationState.fanRotation;
    }

    // Animate cart - move along rails
    animationState.cartPosition += delta * 2;
    if (animationState.cartPosition > 80) {
      animationState.cartPosition = -40;
    }
    if (objects[0]) {
      objects[0].position.x = -40 + animationState.cartPosition;
    }

    // Animate hoist - up and down
    animationState.hoistHeight = Math.sin(animationState.crusherRotation * 0.5) * 5;
    if (objects[5]) {
      objects[5].position.y = 2 + animationState.hoistHeight;
    }

    // Animate conveyor belt - surface scroll
    animationState.conveyorOffset += delta * 2;
    if (objects[6]) {
      objects[6].rotation.y = animationState.conveyorOffset * 0.3;
    }

    // Animate detonator plunger - slight pulse
    animationState.detonatorPullback = Math.sin(animationState.crusherRotation * 0.3) * 0.3;
    if (objects[9]) {
      var plungerChildren = objects[9].children;
      if (plungerChildren[0]) {
        plungerChildren[0].position.y = 1 + animationState.detonatorPullback;
      }
      if (plungerChildren[1]) {
        plungerChildren[1].position.y = 2.5 + animationState.detonatorPullback;
      }
    }

    // Animate ore piles - slight rotation
    if (objects[11]) {
      objects[11].rotation.y += delta * 0.5;
    }
    if (objects[12]) {
      objects[12].rotation.y -= delta * 0.3;
    }
    if (objects[13]) {
      objects[13].rotation.y += delta * 0.4;
    }

    // Bobbing lights
    if (objects[15]) {
      objects[15].position.y = 0 + Math.sin(animationState.crusherRotation * 0.8) * 0.2;
    }
  };

  var reset = function() {
    for (var i = objects.length - 1; i >= 0; i--) {
      var obj = objects[i];
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          for (var j = 0; j < obj.material.length; j++) {
            obj.material[j].dispose();
          }
        } else {
          obj.material.dispose();
        }
      }
      if (obj.parent) {
        obj.parent.remove(obj);
      }
    }
    objects = [];
    animationState = {
      crusherRotation: 0,
      fanRotation: 0,
      cartPosition: 0,
      hoistHeight: 0,
      conveyorOffset: 0,
      detonatorPullback: 0
    };
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
