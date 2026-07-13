window.AncientColosseum = (function() {
  'use strict';

  var sceneRef;
  var cameraRef;
  var sceneObjects = [];
  var enemies = [];
  var trapDoors = [];
  var torchFlames = [];
  var crowdFigures = [];
  var keybindState = { lastA: 0, lastC: 0, isActive: false };
  var gameState = { round: 1, opponentsDown: 0, crowdApproval: 50 };
  var hudElement = null;

  // Colors
  var sandstone = 0xD4A574;
  var darkSandstone = 0xA0826D;
  var stone = 0x808080;
  var gold = 0xFFD700;
  var blood = 0x8B0000;
  var fleshTone = 0xC2A878;

  function createArenaWall() {
    // Elliptical arena wall made of box segments forming oval shape with archway gaps
    var wallGroup = new THREE.Group();
    var wallSegments = [];

    // Create oval wall using box segments
    var archCount = 8;
    var majorRadius = 50;
    var minorRadius = 35;
    var wallHeight = 30;
    var wallThickness = 3;
    var segmentCount = 40;

    for (var i = 0; i < segmentCount; i++) {
      var angle = (i / segmentCount) * Math.PI * 2;
      var nextAngle = ((i + 1) / segmentCount) * Math.PI * 2;

      var x1 = Math.cos(angle) * majorRadius;
      var z1 = Math.sin(angle) * minorRadius;
      var x2 = Math.cos(nextAngle) * majorRadius;
      var z2 = Math.sin(nextAngle) * minorRadius;

      // Skip segments for archway gaps
      var skipArchway = false;
      for (var a = 0; a < archCount; a++) {
        var archAngle = (a / archCount) * Math.PI * 2;
        var archWidth = Math.PI * 2 / archCount * 0.3;
        if (Math.abs(angle - archAngle) < archWidth) {
          skipArchway = true;
          break;
        }
      }

      if (!skipArchway) {
        var segmentLength = Math.sqrt(
          Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2)
        );
        var midX = (x1 + x2) / 2;
        var midZ = (z1 + z2) / 2;
        var segmentAngle = Math.atan2(z2 - z1, x2 - x1);

        var geometry = new THREE.BoxGeometry(
          segmentLength,
          wallHeight,
          wallThickness
        );
        var material = new THREE.MeshPhongMaterial({
          color: darkSandstone,
          side: THREE.DoubleSide
        });
        var wall = new THREE.Mesh(geometry, material);
        wall.position.set(midX, wallHeight / 2, midZ);
        wall.rotation.y = segmentAngle;
        wallGroup.add(wall);
        wallSegments.push(wall);
      }
    }

    return { mesh: wallGroup, segments: wallSegments };
  }

  function createTieredSeating() {
    var seatingGroup = new THREE.Group();
    var rowCount = 8;
    var segmentsPerRow = 24;
    var innerRadius = 55;
    var rowHeight = 3;
    var rowDepth = 4;
    var angle = 60 * (Math.PI / 180);

    for (var row = 0; row < rowCount; row++) {
      var radius = innerRadius + row * rowDepth;
      var yOffset = row * rowHeight;

      for (var seg = 0; seg < segmentsPerRow; seg++) {
        var segAngle = (seg / segmentsPerRow) * Math.PI * 2;
        var nextSegAngle = ((seg + 1) / segmentsPerRow) * Math.PI * 2;

        var x1 = Math.cos(segAngle) * radius;
        var z1 = Math.sin(segAngle) * radius;
        var x2 = Math.cos(nextSegAngle) * (radius + rowDepth);
        var z2 = Math.sin(nextSegAngle) * (radius + rowDepth);

        var segmentLength = Math.sqrt(
          Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2)
        );
        var midX = (x1 + x2) / 2;
        var midZ = (z1 + z2) / 2;
        var segmentAngle = Math.atan2(z2 - z1, x2 - x1);

        var geometry = new THREE.BoxGeometry(
          segmentLength,
          rowHeight * 0.8,
          rowDepth * 0.9
        );
        var material = new THREE.MeshPhongMaterial({
          color: sandstone,
          side: THREE.DoubleSide
        });
        var seat = new THREE.Mesh(geometry, material);
        seat.position.set(midX, yOffset, midZ);
        seat.rotation.y = segmentAngle;
        seat.rotation.z = angle;
        seatingGroup.add(seat);
      }
    }

    return seatingGroup;
  }

  function createArenaSandFloor() {
    var geometry = new THREE.BoxGeometry(100, 0.5, 70);
    var material = new THREE.MeshPhongMaterial({
      color: 0xC9B896,
      side: THREE.DoubleSide
    });
    var floor = new THREE.Mesh(geometry, material);
    floor.position.y = 0;
    return floor;
  }

  function createAncientStoneColumns() {
    var columnGroup = new THREE.Group();
    var archCount = 8;

    for (var i = 0; i < archCount; i++) {
      var angle = (i / archCount) * Math.PI * 2;
      var x = Math.cos(angle) * 48;
      var z = Math.sin(angle) * 33;

      // Main column
      var geometry = new THREE.CylinderGeometry(2, 2.5, 28, 16);
      var material = new THREE.MeshPhongMaterial({
        color: darkSandstone,
        side: THREE.DoubleSide
      });
      var column = new THREE.Mesh(geometry, material);
      column.position.set(x, 14, z);
      columnGroup.add(column);

      // Capital (top)
      var capitalGeom = new THREE.CylinderGeometry(3, 2, 1.5, 16);
      var capital = new THREE.Mesh(capitalGeom, material);
      capital.position.set(x, 28.75, z);
      columnGroup.add(capital);

      // Base
      var baseGeom = new THREE.CylinderGeometry(3.5, 3, 1, 16);
      var base = new THREE.Mesh(baseGeom, material);
      base.position.set(x, 0.5, z);
      columnGroup.add(base);
    }

    return columnGroup;
  }

  function createHypogeum() {
    var hypGroup = new THREE.Group();

    // Main shaft going down
    var shaftGeom = new THREE.BoxGeometry(40, 20, 30);
    var stoneMat = new THREE.MeshPhongMaterial({
      color: stone,
      side: THREE.DoubleSide
    });
    var shaft = new THREE.Mesh(shaftGeom, stoneMat);
    shaft.position.y = -10;
    hypGroup.add(shaft);

    // Entrance ramp
    var rampGeom = new THREE.BoxGeometry(15, 2, 25);
    var ramp = new THREE.Mesh(rampGeom, stoneMat);
    ramp.position.set(0, -2, -35);
    ramp.rotation.z = 0.3;
    hypGroup.add(ramp);

    // Grates/cages (small boxes for animal cages)
    for (var i = 0; i < 4; i++) {
      var cageGeom = new THREE.BoxGeometry(6, 5, 6);
      var cageMat = new THREE.MeshPhongMaterial({
        color: 0x4A4A4A,
        wireframe: false,
        side: THREE.DoubleSide
      });
      var cage = new THREE.Mesh(cageGeom, cageMat);
      cage.position.set(-12 + i * 8, -8, 0);
      hypGroup.add(cage);
    }

    return hypGroup;
  }

  function createTrapDoor() {
    var doorGroup = new THREE.Group();

    var panelGeom = new THREE.BoxGeometry(8, 0.3, 8);
    var stoneMat = new THREE.MeshPhongMaterial({
      color: darkSandstone,
      side: THREE.DoubleSide
    });
    var panel = new THREE.Mesh(panelGeom, stoneMat);
    doorGroup.add(panel);

    var hingeGeom = new THREE.BoxGeometry(0.5, 1, 8.5);
    var hingeMat = new THREE.MeshPhongMaterial({
      color: gold,
      side: THREE.DoubleSide
    });
    var hinge = new THREE.Mesh(hingeGeom, hingeMat);
    hinge.position.z = 4.5;
    doorGroup.add(hinge);

    doorGroup.userData = { openTime: 0, isOpen: false };

    return doorGroup;
  }

  function createTorchBracket() {
    var torchGroup = new THREE.Group();

    // Bracket (cylinder)
    var bracketGeom = new THREE.CylinderGeometry(0.4, 0.5, 3, 12);
    var metalMat = new THREE.MeshPhongMaterial({
      color: gold,
      side: THREE.DoubleSide
    });
    var bracket = new THREE.Mesh(bracketGeom, metalMat);
    torchGroup.add(bracket);

    // Flame (cone)
    var flameGeom = new THREE.ConeGeometry(1.5, 3, 12);
    var flameMat = new THREE.MeshPhongMaterial({
      color: 0xFF6347,
      emissive: 0xFF4500,
      emissiveIntensity: 0.6,
      side: THREE.DoubleSide
    });
    var flame = new THREE.Mesh(flameGeom, flameMat);
    flame.position.y = 2;
    torchGroup.add(flame);

    torchGroup.userData = {
      flameRef: flame,
      baseY: torchGroup.position.y,
      flickerTime: 0
    };

    return torchGroup;
  }

  function createCrowdFigure() {
    var figureGroup = new THREE.Group();

    // Head
    var headGeom = new THREE.SphereGeometry(0.4, 8, 8);
    var skinMat = new THREE.MeshPhongMaterial({
      color: fleshTone,
      side: THREE.DoubleSide
    });
    var head = new THREE.Mesh(headGeom, skinMat);
    head.position.y = 1.6;
    figureGroup.add(head);

    // Body
    var bodyGeom = new THREE.BoxGeometry(0.5, 1, 0.3);
    var tunicMat = new THREE.MeshPhongMaterial({
      color: 0xCD853F,
      side: THREE.DoubleSide
    });
    var body = new THREE.Mesh(bodyGeom, tunicMat);
    body.position.y = 0.8;
    figureGroup.add(body);

    figureGroup.userData = {
      baseY: figureGroup.position.y,
      bobTime: Math.random() * Math.PI * 2,
      bobSpeed: 2 + Math.random() * 2
    };

    return figureGroup;
  }

  function createEnemy() {
    var enemyGroup = new THREE.Group();

    // Head
    var headGeom = new THREE.SphereGeometry(0.45, 8, 8);
    var armorMat = new THREE.MeshPhongMaterial({
      color: 0x696969,
      side: THREE.DoubleSide
    });
    var head = new THREE.Mesh(headGeom, armorMat);
    head.position.y = 1.7;
    enemyGroup.add(head);

    // Armor body
    var armorGeom = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    var armor = new THREE.Mesh(armorGeom, armorMat);
    armor.position.y = 0.8;
    enemyGroup.add(armor);

    // Weapon indicator (small box)
    var weaponGeom = new THREE.BoxGeometry(0.2, 0.8, 0.1);
    var weaponMat = new THREE.MeshPhongMaterial({
      color: 0x2F4F4F,
      side: THREE.DoubleSide
    });
    var weapon = new THREE.Mesh(weaponGeom, weaponMat);
    weapon.position.set(0.4, 1, 0);
    enemyGroup.add(weapon);

    enemyGroup.userData = {
      health: 100,
      moveSpeed: 8 + Math.random() * 5,
      moveTimer: 0,
      moveDir: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        0,
        (Math.random() - 0.5) * 2
      ).normalize()
    };

    return enemyGroup;
  }

  function init(scene, camera) {
    sceneRef = scene;
    cameraRef = camera;

    // Set up scene
    scene.background = new THREE.Color(0x8B7355);
    scene.fog = new THREE.Fog(0xAA9977, 200, 400);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xFFE4B5, 0.6);
    scene.add(ambientLight);
    sceneObjects.push(ambientLight);

    var sunLight = new THREE.DirectionalLight(0xFFF8DC, 0.7);
    sunLight.position.set(50, 80, 50);
    sunLight.castShadow = true;
    sunLight.shadow.camera.left = -150;
    sunLight.shadow.camera.right = 150;
    sunLight.shadow.camera.top = 150;
    sunLight.shadow.camera.bottom = -150;
    scene.add(sunLight);
    sceneObjects.push(sunLight);

    // Arena components
    var wallData = createArenaWall();
    scene.add(wallData.mesh);
    sceneObjects.push(wallData.mesh);

    var seating = createTieredSeating();
    scene.add(seating);
    sceneObjects.push(seating);

    var floor = createArenaSandFloor();
    scene.add(floor);
    sceneObjects.push(floor);

    var columns = createAncientStoneColumns();
    scene.add(columns);
    sceneObjects.push(columns);

    var hypogeum = createHypogeum();
    scene.add(hypogeum);
    sceneObjects.push(hypogeum);

    // Trap doors
    for (var i = 0; i < 3; i++) {
      var trapDoor = createTrapDoor();
      trapDoor.position.set(-15 + i * 15, 0.25, -10 + Math.random() * 10);
      scene.add(trapDoor);
      sceneObjects.push(trapDoor);
      trapDoors.push(trapDoor);
    }

    // Torch brackets with flames
    var archCount = 8;
    for (var i = 0; i < archCount; i++) {
      var angle = (i / archCount) * Math.PI * 2;
      var x = Math.cos(angle) * 48;
      var z = Math.sin(angle) * 33;

      var torch = createTorchBracket();
      torch.position.set(x, 20, z);
      scene.add(torch);
      sceneObjects.push(torch);
      torchFlames.push(torch);
    }

    // Crowd figures in seating
    for (var row = 1; row < 7; row += 2) {
      for (var i = 0; i < 12; i++) {
        var angle = (i / 12) * Math.PI * 2;
        var radius = 55 + row * 4;
        var x = Math.cos(angle) * radius;
        var z = Math.sin(angle) * radius;
        var y = row * 3 + 1;

        var crowd = createCrowdFigure();
        crowd.position.set(x, y, z);
        scene.add(crowd);
        sceneObjects.push(crowd);
        crowdFigures.push(crowd);
      }
    }

    // Enemies (gladiators with weapons)
    for (var i = 0; i < 3; i++) {
      var enemy = createEnemy();
      var angle = (i / 3) * Math.PI * 2 + Math.PI / 6;
      enemy.position.set(
        Math.cos(angle) * 20,
        2,
        Math.sin(angle) * 15
      );
      scene.add(enemy);
      sceneObjects.push(enemy);
      enemies.push(enemy);
    }

    // Create HUD
    createHUD();

    // Set up keyboard handling
    document.addEventListener('keydown', handleKeyDown);
  }

  function createHUD() {
    if (hudElement) {
      document.body.removeChild(hudElement);
    }

    hudElement = document.createElement('div');
    hudElement.id = 'ancient-colosseum-hud';
    hudElement.style.position = 'fixed';
    hudElement.style.top = '10px';
    hudElement.style.left = '10px';
    hudElement.style.color = '#FFD700';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.fontSize = '16px';
    hudElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
    hudElement.style.zIndex = '1000';

    var statusText = 'ROUND: ' + gameState.round + '/5\n';
    statusText += 'OPPONENTS DOWN: ' + gameState.opponentsDown + '\n';
    statusText += 'CROWD APPROVAL: ' + gameState.crowdApproval + '%\n';
    statusText += (keybindState.isActive ? '[A+C] ACTIVE' : '[Press A then C to toggle]');

    hudElement.textContent = statusText;
    document.body.appendChild(hudElement);
  }

  function handleKeyDown(event) {
    var key = event.key.toUpperCase();

    if (key === 'A') {
      keybindState.lastA = Date.now();
    }

    if (key === 'C') {
      var now = Date.now();
      if (now - keybindState.lastA < 400) {
        keybindState.isActive = !keybindState.isActive;
        createHUD();
      }
      keybindState.lastC = now;
    }
  }

  function update(delta) {
    if (!sceneRef) return;

    // Update torch flames (flicker)
    for (var i = 0; i < torchFlames.length; i++) {
      var torch = torchFlames[i];
      torch.userData.flickerTime += delta;

      var flame = torch.userData.flameRef;
      var flicker = 0.4 + Math.sin(torch.userData.flickerTime * 8) * 0.2;
      flame.material.emissiveIntensity = flicker;

      flame.position.y = 2 + Math.sin(torch.userData.flickerTime * 6) * 0.3;
    }

    // Update trap doors (open/close on timer)
    for (var i = 0; i < trapDoors.length; i++) {
      var door = trapDoors[i];
      door.userData.openTime += delta;

      if (door.userData.openTime > 3 && !door.userData.isOpen) {
        door.userData.isOpen = true;
      } else if (door.userData.openTime > 5) {
        door.userData.isOpen = false;
        door.userData.openTime = 0;
      }

      var targetRotation = door.userData.isOpen ? -Math.PI / 2 : 0;
      door.rotation.z += (targetRotation - door.rotation.z) * 0.1;
    }

    // Update crowd figures (bob with excitement)
    for (var i = 0; i < crowdFigures.length; i++) {
      var crowd = crowdFigures[i];
      crowd.userData.bobTime += delta * crowd.userData.bobSpeed;

      var bobAmount = Math.sin(crowd.userData.bobTime) * 0.5;
      crowd.position.y = crowd.userData.baseY + bobAmount;

      // Random cheering bounces
      if (Math.sin(crowd.userData.bobTime) > 0.9) {
        crowd.position.y += Math.random() * 0.3;
      }
    }

    // Update enemies (move around, occasional random direction)
    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      enemy.userData.moveTimer += delta;

      // Change direction occasionally
      if (enemy.userData.moveTimer > 2 + Math.random() * 3) {
        enemy.userData.moveDir = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          0,
          (Math.random() - 0.5) * 2
        ).normalize();
        enemy.userData.moveTimer = 0;
      }

      // Move within arena bounds
      var newX = enemy.position.x + enemy.userData.moveDir.x * enemy.userData.moveSpeed * delta;
      var newZ = enemy.position.z + enemy.userData.moveDir.z * enemy.userData.moveSpeed * delta;

      var distFromCenter = Math.sqrt(newX * newX + (newZ * newZ * 1.2) * (newZ * newZ * 1.2));
      if (distFromCenter < 30) {
        enemy.position.x = newX;
        enemy.position.z = newZ;
      }

      // Face direction of movement
      if (enemy.userData.moveDir.length() > 0) {
        var targetAngle = Math.atan2(enemy.userData.moveDir.x, enemy.userData.moveDir.z);
        enemy.rotation.y += (targetAngle - enemy.rotation.y) * 0.05;
      }
    }

    // Update game state (simulate action)
    if (keybindState.isActive) {
      gameState.crowdApproval = Math.min(100, gameState.crowdApproval + delta * 5);
    } else {
      gameState.crowdApproval = Math.max(0, gameState.crowdApproval - delta * 2);
    }

    updateHUD();
  }

  function updateHUD() {
    if (hudElement) {
      var statusText = 'ROUND: ' + gameState.round + '/5\n';
      statusText += 'OPPONENTS DOWN: ' + gameState.opponentsDown + '\n';
      statusText += 'CROWD APPROVAL: ' + Math.floor(gameState.crowdApproval) + '%\n';
      statusText += (keybindState.isActive ? '[A+C] ACTIVE' : '[Press A then C to toggle]');
      hudElement.textContent = statusText;
    }
  }

  function reset() {
    // Remove all scene objects
    for (var i = 0; i < sceneObjects.length; i++) {
      sceneRef.remove(sceneObjects[i]);
    }
    sceneObjects = [];

    // Clear arrays
    enemies = [];
    trapDoors = [];
    torchFlames = [];
    crowdFigures = [];

    // Reset game state
    gameState.round = 1;
    gameState.opponentsDown = 0;
    gameState.crowdApproval = 50;
    keybindState.isActive = false;

    // Remove HUD
    if (hudElement && document.body.contains(hudElement)) {
      document.body.removeChild(hudElement);
      hudElement = null;
    }

    // Remove event listeners
    document.removeEventListener('keydown', handleKeyDown);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
