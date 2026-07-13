window.WarzoneMall = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var lights = [];
  var animations = [];
  var insurgents = [];

  var COLORS = {
    concrete: 0xCCCCCC,
    storefront: 0x336699,
    emergency: 0xFF2200,
    fire: 0xFF6600,
    debris: 0x888888,
    insurgent: 0x333333,
    glass: 0x4488BB
  };

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    lights = [];
    animations = [];
    insurgents = [];

    // Main corridor floor - wide mall hallway
    var floorGeometry = new THREE.BoxGeometry(40, 0.5, 80);
    var floorMaterial = new THREE.MeshLambertMaterial({ color: COLORS.concrete });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.25;
    floor.position.z = 0;
    scene.add(floor);
    objects.push(floor);

    // Ceiling with collapsed sections
    var ceilingGeometry = new THREE.BoxGeometry(40, 0.4, 80);
    var ceilingMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.y = 12;
    scene.add(ceiling);
    objects.push(ceiling);

    // Left corridor wall
    var leftWallGeometry = new THREE.BoxGeometry(0.5, 12, 80);
    var wallMaterial = new THREE.MeshLambertMaterial({ color: COLORS.concrete });
    var leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.x = -20;
    leftWall.position.y = 6;
    scene.add(leftWall);
    objects.push(leftWall);

    // Right corridor wall
    var rightWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    rightWall.position.x = 20;
    rightWall.position.y = 6;
    scene.add(rightWall);
    objects.push(rightWall);

    // Store front 1 - left side with broken glass
    var storefront1X = -15;
    var storefront1Z = -25;
    createStorefront(storefront1X, storefront1Z, 'Electronics');

    // Store front 2 - right side
    createStorefront(15, -25, 'Fashion');

    // Store front 3 - left side deeper
    createStorefront(-15, 15, 'Furniture');

    // Store front 4 - right side deeper
    createStorefront(15, 15, 'Sports');

    // Central atrium with collapsed skylight
    createAtrium(0, 25);

    // Food court area
    createFoodCourt(0, -40);

    // Overturned merchandise and debris
    createDebrisField(-10, 0);
    createDebrisField(10, 10);

    // Barricade of furniture
    createBarricade(0, 5);

    // Burning trash cans
    createBurningTrashCan(-8, 0);
    createBurningTrashCan(8, -10);

    // Elevator shaft
    createElevatorShaft(-18, 40);

    // Emergency lighting strips
    createEmergencyLights();

    // Escalator structure
    createEscalators(12, 8);

    // Mannequins for cover
    createMannequin(-5, 20);
    createMannequin(5, 30);
    createMannequin(-10, -35);

    // Insurgent spawn positions
    createInsurgentSpawns();

    // Ambient light
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    lights.push(ambientLight);

    // Emergency red light
    var emergencyLight = new THREE.PointLight(COLORS.emergency, 1.5, 50);
    emergencyLight.position.set(0, 8, 0);
    scene.add(emergencyLight);
    lights.push(emergencyLight);

    // Fire glow light
    var fireLight = new THREE.PointLight(COLORS.fire, 2, 40);
    fireLight.position.set(-8, 2, 0);
    scene.add(fireLight);
    lights.push(fireLight);

    // Second fire light
    var fireLight2 = new THREE.PointLight(COLORS.fire, 1.8, 35);
    fireLight2.position.set(8, 2, -10);
    scene.add(fireLight2);
    lights.push(fireLight2);
  }

  function createStorefront(x, z, name) {
    // Storefront frame
    var frameGeometry = new THREE.BoxGeometry(8, 8, 0.4);
    var frameMaterial = new THREE.MeshLambertMaterial({ color: COLORS.storefront });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(x, 4, z);
    scene.add(frame);
    objects.push(frame);

    // Broken glass - multiple pieces
    var glassGeometry = new THREE.BoxGeometry(3.5, 3.5, 0.01);
    var glassMaterial = new THREE.MeshLambertMaterial({
      color: COLORS.glass,
      transparent: true,
      opacity: 0.3
    });

    var glass1 = new THREE.Mesh(glassGeometry, glassMaterial);
    glass1.position.set(x - 2, 6, z + 0.2);
    scene.add(glass1);
    objects.push(glass1);

    var glass2 = new THREE.Mesh(glassGeometry, glassMaterial);
    glass2.position.set(x + 2, 5, z + 0.2);
    scene.add(glass2);
    objects.push(glass2);

    // Store interior depth box
    var interiorGeometry = new THREE.BoxGeometry(7.5, 7.5, 6);
    var interiorMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var interior = new THREE.Mesh(interiorGeometry, interiorMaterial);
    interior.position.set(x, 4, z - 3);
    scene.add(interior);
    objects.push(interior);
  }

  function createAtrium(x, z) {
    // Atrium floor
    var atriumFloorGeometry = new THREE.BoxGeometry(20, 0.3, 20);
    var atriumMaterial = new THREE.MeshLambertMaterial({ color: COLORS.concrete });
    var atriumFloor = new THREE.Mesh(atriumFloorGeometry, atriumMaterial);
    atriumFloor.position.set(x, 4, z);
    scene.add(atriumFloor);
    objects.push(atriumFloor);

    // Collapsed skylight frame
    var skylightGeometry = new THREE.BoxGeometry(18, 0.5, 18);
    var skylightMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var skylight = new THREE.Mesh(skylightGeometry, skylightMaterial);
    skylight.position.set(x, 10.5, z);
    scene.add(skylight);
    objects.push(skylight);

    // Collapsed roof debris
    var debris1Geometry = new THREE.BoxGeometry(4, 0.3, 6);
    var debrisMaterial = new THREE.MeshLambertMaterial({ color: COLORS.debris });
    var debris1 = new THREE.Mesh(debris1Geometry, debrisMaterial);
    debris1.position.set(x - 6, 5, z);
    debris1.rotation.z = 0.3;
    scene.add(debris1);
    objects.push(debris1);

    var debris2 = new THREE.Mesh(debris1Geometry, debrisMaterial);
    debris2.position.set(x + 5, 5.5, z + 5);
    debris2.rotation.z = -0.4;
    scene.add(debris2);
    objects.push(debris2);
  }

  function createFoodCourt(x, z) {
    // Food court main area
    var foodFloorGeometry = new THREE.BoxGeometry(15, 0.3, 12);
    var foodMaterial = new THREE.MeshLambertMaterial({ color: 0xBBBBBB });
    var foodFloor = new THREE.Mesh(foodFloorGeometry, foodMaterial);
    foodFloor.position.set(x, 0.15, z);
    scene.add(foodFloor);
    objects.push(foodFloor);

    // Overturned tables (BoxGeometry as flat rectangles)
    var tableGeometry = new THREE.BoxGeometry(3, 0.2, 2);
    var tableMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

    for (var i = 0; i < 4; i++) {
      var table = new THREE.Mesh(tableGeometry, tableMaterial);
      table.position.set(x - 5 + i * 4, 0.5, z + (i % 2) * 3);
      table.rotation.z = Math.PI / 4 + i * 0.2;
      scene.add(table);
      objects.push(table);
    }

    // Food court counter
    var counterGeometry = new THREE.BoxGeometry(8, 1.5, 0.5);
    var counterMaterial = new THREE.MeshLambertMaterial({ color: 0xFFAA00 });
    var counter = new THREE.Mesh(counterGeometry, counterMaterial);
    counter.position.set(x, 0.75, z - 5);
    scene.add(counter);
    objects.push(counter);
  }

  function createDebrisField(x, z) {
    // Scattered boxes and debris
    var debrisGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
    var debrisMaterial = new THREE.MeshLambertMaterial({ color: COLORS.debris });

    for (var i = 0; i < 5; i++) {
      var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
      debris.position.set(
        x + (Math.random() - 0.5) * 8,
        0.5 + i * 0.8,
        z + (Math.random() - 0.5) * 6
      );
      debris.rotation.x = Math.random() * 0.3;
      debris.rotation.z = Math.random() * 0.3;
      scene.add(debris);
      objects.push(debris);
    }
  }

  function createBarricade(x, z) {
    // Furniture barricade
    var barricadeGeometry = new THREE.BoxGeometry(6, 2, 0.5);
    var barricadeMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    var barricade = new THREE.Mesh(barricadeGeometry, barricadeMaterial);
    barricade.position.set(x, 1, z);
    scene.add(barricade);
    objects.push(barricade);

    // Stacked boxes
    var boxGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    var boxMaterial = new THREE.MeshLambertMaterial({ color: COLORS.debris });
    for (var i = 0; i < 3; i++) {
      var box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.set(x - 2 + i * 1.5, 1.8 + i * 1.2, z);
      scene.add(box);
      objects.push(box);
    }
  }

  function createBurningTrashCan(x, z) {
    // Trash can cylinder
    var canGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1.2, 8);
    var canMaterial = new THREE.MeshLambertMaterial({ color: COLORS.insurgent });
    var trashCan = new THREE.Mesh(canGeometry, canMaterial);
    trashCan.position.set(x, 0.6, z);
    scene.add(trashCan);
    objects.push(trashCan);

    // Fire glow (sphere)
    var fireGeometry = new THREE.SphereGeometry(0.6, 8, 8);
    var fireMaterial = new THREE.MeshLambertMaterial({
      color: COLORS.fire,
      emissive: COLORS.fire,
      emissiveIntensity: 0.8
    });
    var fire = new THREE.Mesh(fireGeometry, fireMaterial);
    fire.position.set(x, 1.2, z);
    fire.scale.set(1, 1.5, 1);
    scene.add(fire);
    objects.push(fire);

    // Store fire reference for animation
    animations.push({
      type: 'fire',
      object: fire,
      initialScale: fire.scale.clone()
    });
  }

  function createElevatorShaft(x, z) {
    // Elevator shaft back wall
    var shaftGeometry = new THREE.BoxGeometry(3, 10, 0.4);
    var shaftMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.set(x, 5, z);
    scene.add(shaft);
    objects.push(shaft);

    // Elevator doors
    var doorGeometry = new THREE.BoxGeometry(1.4, 2.2, 0.1);
    var doorMaterial = new THREE.MeshLambertMaterial({ color: COLORS.concrete });
    var door1 = new THREE.Mesh(doorGeometry, doorMaterial);
    door1.position.set(x - 0.75, 1.2, z + 0.2);
    scene.add(door1);
    objects.push(door1);

    var door2 = new THREE.Mesh(doorGeometry, doorMaterial);
    door2.position.set(x + 0.75, 1.2, z + 0.2);
    scene.add(door2);
    objects.push(door2);
  }

  function createEmergencyLights() {
    // Emergency light strips along corridor
    var lightGeometry = new THREE.BoxGeometry(0.3, 0.2, 30);
    var lightMaterial = new THREE.MeshLambertMaterial({
      color: COLORS.emergency,
      emissive: COLORS.emergency,
      emissiveIntensity: 0.6
    });

    var leftLights = new THREE.Mesh(lightGeometry, lightMaterial);
    leftLights.position.set(-19.5, 11.5, 0);
    scene.add(leftLights);
    objects.push(leftLights);

    var rightLights = new THREE.Mesh(lightGeometry, lightMaterial);
    rightLights.position.set(19.5, 11.5, 0);
    scene.add(rightLights);
    objects.push(rightLights);

    // Emergency lights animation
    animations.push({
      type: 'pulse',
      object: leftLights,
      initialIntensity: 0.6
    });
    animations.push({
      type: 'pulse',
      object: rightLights,
      initialIntensity: 0.6
    });
  }

  function createEscalators(x, z) {
    // Escalator frame
    var escalatorGeometry = new THREE.BoxGeometry(2, 0.3, 4);
    var escalatorMaterial = new THREE.MeshLambertMaterial({ color: COLORS.concrete });

    // Bottom escalator
    var escalator1 = new THREE.Mesh(escalatorGeometry, escalatorMaterial);
    escalator1.position.set(x, 2, z);
    escalator1.rotation.z = 0.35;
    scene.add(escalator1);
    objects.push(escalator1);

    // Top escalator
    var escalator2 = new THREE.Mesh(escalatorGeometry, escalatorMaterial);
    escalator2.position.set(x, 6, z + 3);
    escalator2.rotation.z = 0.35;
    scene.add(escalator2);
    objects.push(escalator2);

    // Escalator steps
    var stepGeometry = new THREE.BoxGeometry(2, 0.15, 0.3);
    var stepMaterial = new THREE.MeshLambertMaterial({ color: 0x999999 });
    for (var i = 0; i < 6; i++) {
      var step = new THREE.Mesh(stepGeometry, stepMaterial);
      step.position.set(x, 2.5 + i * 0.5, z + i * 0.6);
      scene.add(step);
      objects.push(step);
    }
  }

  function createMannequin(x, z) {
    // Mannequin torso
    var torsoGeometry = new THREE.BoxGeometry(0.5, 1.2, 0.3);
    var torsoMaterial = new THREE.MeshLambertMaterial({ color: 0xDDBB99 });
    var torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
    torso.position.set(x, 1.5, z);
    scene.add(torso);
    objects.push(torso);

    // Mannequin head
    var headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    var headMaterial = new THREE.MeshLambertMaterial({ color: 0xDDBB99 });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(x, 2.8, z);
    scene.add(head);
    objects.push(head);

    // Mannequin arms
    var armGeometry = new THREE.BoxGeometry(0.15, 0.8, 0.15);
    var armMaterial = new THREE.MeshLambertMaterial({ color: 0xDDBB99 });
    var leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(x - 0.4, 1.8, z);
    leftArm.rotation.z = 0.3;
    scene.add(leftArm);
    objects.push(leftArm);

    var rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(x + 0.4, 1.8, z);
    rightArm.rotation.z = -0.3;
    scene.add(rightArm);
    objects.push(rightArm);
  }

  function createInsurgentSpawns() {
    // Define spawn points for insurgent patrols
    insurgents = [
      {
        position: new THREE.Vector3(-12, 1.5, -20),
        targetPath: [
          new THREE.Vector3(-12, 1.5, -20),
          new THREE.Vector3(-12, 1.5, 20),
          new THREE.Vector3(12, 1.5, 20),
          new THREE.Vector3(12, 1.5, -20)
        ],
        pathIndex: 0,
        speed: 3
      },
      {
        position: new THREE.Vector3(12, 1.5, 10),
        targetPath: [
          new THREE.Vector3(12, 1.5, 10),
          new THREE.Vector3(-12, 1.5, 10),
          new THREE.Vector3(-12, 1.5, -30),
          new THREE.Vector3(12, 1.5, -30)
        ],
        pathIndex: 0,
        speed: 2.5
      }
    ];
  }

  function update(delta) {
    if (!scene) return;

    // Update fire animations
    for (var i = 0; i < animations.length; i++) {
      var anim = animations[i];

      if (anim.type === 'fire') {
        var flicker = 0.8 + Math.sin(Date.now() * 0.01) * 0.3;
        anim.object.scale.copy(anim.initialScale).multiplyScalar(flicker);
      }

      if (anim.type === 'pulse') {
        var pulse = 0.4 + Math.sin(Date.now() * 0.008) * 0.4;
        anim.object.material.emissiveIntensity = pulse;
      }
    }

    // Update insurgent positions
    for (var i = 0; i < insurgents.length; i++) {
      var insurgent = insurgents[i];
      var currentTarget = insurgent.targetPath[insurgent.pathIndex];
      var direction = currentTarget.clone().sub(insurgent.position);

      if (direction.length() < 1) {
        insurgent.pathIndex = (insurgent.pathIndex + 1) % insurgent.targetPath.length;
      } else {
        direction.normalize();
        insurgent.position.add(direction.multiplyScalar(insurgent.speed * delta));
      }
    }

    // Falling debris effect
    if (Math.random() > 0.98) {
      var debrisGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      var debrisMaterial = new THREE.MeshLambertMaterial({ color: COLORS.debris });
      var fallingDebris = new THREE.Mesh(debrisGeometry, debrisMaterial);
      fallingDebris.position.set(
        (Math.random() - 0.5) * 30,
        11,
        (Math.random() - 0.5) * 60
      );
      fallingDebris.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        -5,
        0
      );
      scene.add(fallingDebris);
      objects.push(fallingDebris);

      // Remove after falling
      setTimeout(function() {
        scene.remove(fallingDebris);
        objects.splice(objects.indexOf(fallingDebris), 1);
      }, 3000);
    }

    // Update falling debris
    for (var i = objects.length - 1; i >= 0; i--) {
      if (objects[i].velocity) {
        objects[i].position.add(objects[i].velocity.clone().multiplyScalar(delta));
        objects[i].velocity.y -= 9.8 * delta;

        if (objects[i].position.y < -5) {
          scene.remove(objects[i]);
          objects.splice(i, 1);
        }
      }
    }
  }

  function reset() {
    if (!scene) return;

    // Remove all objects
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];

    // Remove all lights
    for (var i = lights.length - 1; i >= 0; i--) {
      scene.remove(lights[i]);
    }
    lights = [];

    animations = [];
    insurgents = [];
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getInsurgents: function() { return insurgents; },
    getObjects: function() { return objects; }
  };
}());
