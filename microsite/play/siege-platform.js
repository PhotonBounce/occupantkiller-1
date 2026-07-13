window.SiegePlatform = (function() {
  'use strict';

  var scene;
  var camera;
  var siegeParts = [];
  var animationState = {};

  var materials = {
    wood: new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.2 }),
    stone: new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.9 }),
    fire: new THREE.MeshStandardMaterial({ color: 0xFF6600, emissive: 0xFF3300, emissiveIntensity: 0.8 }),
    rope: new THREE.LineBasicMaterial({ color: 0x8B7355, linewidth: 3 }),
    wall: new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.95 })
  };

  function buildSiegeBase() {
    var baseGroup = new THREE.Group();
    baseGroup.name = 'siege-base';

    var baseGeom = new THREE.BoxGeometry(40, 2, 30);
    var base = new THREE.Mesh(baseGeom, materials.wood);
    base.position.y = 1;
    base.castShadow = true;
    baseGroup.add(base);

    var wheelGeom = new THREE.CylinderGeometry(4, 4, 3, 16);
    var wheelL = new THREE.Mesh(wheelGeom, materials.metal);
    wheelL.position.set(-15, 4, -10);
    wheelL.rotation.z = Math.PI / 2;
    baseGroup.add(wheelL);

    var wheelR = new THREE.Mesh(wheelGeom, materials.metal);
    wheelR.position.set(-15, 4, 10);
    wheelR.rotation.z = Math.PI / 2;
    baseGroup.add(wheelR);

    var wheelR2 = new THREE.Mesh(wheelGeom, materials.metal);
    wheelR2.position.set(15, 4, 10);
    wheelR2.rotation.z = Math.PI / 2;
    baseGroup.add(wheelR2);

    var wheelL2 = new THREE.Mesh(wheelGeom, materials.metal);
    wheelL2.position.set(15, 4, -10);
    wheelL2.rotation.z = Math.PI / 2;
    baseGroup.add(wheelL2);

    return baseGroup;
  }

  function buildSiegeTower() {
    var towerGroup = new THREE.Group();
    towerGroup.name = 'siege-tower';

    var levelHeight = 6;
    for (var i = 0; i < 3; i++) {
      var boxGeom = new THREE.BoxGeometry(12 - i * 2, levelHeight, 12 - i * 2);
      var levelBox = new THREE.Mesh(boxGeom, materials.wood);
      levelBox.position.y = levelHeight / 2 + i * levelHeight;
      levelBox.castShadow = true;
      towerGroup.add(levelBox);

      buildBallistaOnLevel(towerGroup, i, levelHeight);
    }

    towerGroup.position.set(0, 8, 0);
    return towerGroup;
  }

  function buildBallistaOnLevel(parent, levelIdx, levelHeight) {
    var ballistaGroup = new THREE.Group();

    var bodyGeom = new THREE.BoxGeometry(2, 1.5, 2);
    var body = new THREE.Mesh(bodyGeom, materials.metal);
    body.position.y = levelIdx * levelHeight + 4;
    ballistaGroup.add(body);

    var armGeom = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
    var arm = new THREE.Mesh(armGeom, materials.wood);
    arm.position.set(4 + levelIdx * 1.5, levelIdx * levelHeight + 5, 0);
    arm.rotation.z = Math.PI / 6;
    ballistaGroup.add(arm);

    var stringPoints = [
      new THREE.Vector3(4 + levelIdx * 1.5, levelIdx * levelHeight + 8, -1),
      new THREE.Vector3(4 + levelIdx * 1.5, levelIdx * levelHeight + 5, -1),
      new THREE.Vector3(4 + levelIdx * 1.5, levelIdx * levelHeight + 2, -1)
    ];
    var stringGeom = new THREE.BufferGeometry().setFromPoints(stringPoints);
    var stringLine = new THREE.LineSegments(stringGeom, materials.rope);
    ballistaGroup.add(stringLine);

    parent.add(ballistaGroup);
  }

  function buildBatteringRam() {
    var ramGroup = new THREE.Group();
    ramGroup.name = 'battering-ram';

    var ramGeom = new THREE.CylinderGeometry(2, 2, 20, 16);
    var ram = new THREE.Mesh(ramGeom, materials.wood);
    ram.rotation.z = Math.PI / 2;
    ram.position.set(-8, 6, -15);
    ram.castShadow = true;
    ramGroup.add(ram);

    var headGeom = new THREE.SphereGeometry(2.5, 8, 8);
    var head = new THREE.Mesh(headGeom, materials.metal);
    head.position.set(-8, 6, -24);
    ramGroup.add(head);

    var chainPoints = [
      new THREE.Vector3(-8, 16, -15),
      new THREE.Vector3(-8, 8, -15)
    ];
    var chainGeom = new THREE.BufferGeometry().setFromPoints(chainPoints);
    var chainLineL = new THREE.LineSegments(chainGeom, materials.rope);
    ramGroup.add(chainLineL);

    chainPoints = [
      new THREE.Vector3(-2, 16, -15),
      new THREE.Vector3(-2, 8, -15)
    ];
    chainGeom = new THREE.BufferGeometry().setFromPoints(chainPoints);
    var chainLineR = new THREE.LineSegments(chainGeom, materials.rope);
    ramGroup.add(chainLineR);

    return ramGroup;
  }

  function buildLadders() {
    var ladderGroup = new THREE.Group();
    ladderGroup.name = 'ladders';

    for (var i = 0; i < 4; i++) {
      var xPos = -10 + i * 8;
      var rungPoints = [];
      for (var r = 0; r < 8; r++) {
        rungPoints.push(new THREE.Vector3(xPos - 1.5, r * 2, -20));
        rungPoints.push(new THREE.Vector3(xPos + 1.5, r * 2, -20));
      }
      var rungGeom = new THREE.BufferGeometry().setFromPoints(rungPoints);
      var rungs = new THREE.LineSegments(rungGeom, materials.rope);
      ladderGroup.add(rungs);

      var sidePoints = [
        new THREE.Vector3(xPos - 1.5, 0, -20),
        new THREE.Vector3(xPos - 1.5, 16, -20)
      ];
      var sideGeom = new THREE.BufferGeometry().setFromPoints(sidePoints);
      var sideLeft = new THREE.LineSegments(sideGeom, materials.rope);
      ladderGroup.add(sideLeft);

      sidePoints = [
        new THREE.Vector3(xPos + 1.5, 0, -20),
        new THREE.Vector3(xPos + 1.5, 16, -20)
      ];
      sideGeom = new THREE.BufferGeometry().setFromPoints(sidePoints);
      var sideRight = new THREE.LineSegments(sideGeom, materials.rope);
      ladderGroup.add(sideRight);
    }

    return ladderGroup;
  }

  function buildGreekFire() {
    var fireGroup = new THREE.Group();
    fireGroup.name = 'greek-fire';

    for (var i = 0; i < 2; i++) {
      var barrelGeom = new THREE.CylinderGeometry(1.2, 1.2, 3, 12);
      var barrel = new THREE.Mesh(barrelGeom, materials.metal);
      barrel.position.set(-15 + i * 30, 12, 12);
      fireGroup.add(barrel);

      var flameGeom = new THREE.ConeGeometry(1.8, 4, 8);
      var flame = new THREE.Mesh(flameGeom, materials.fire);
      flame.position.set(-15 + i * 30, 16, 12);
      fireGroup.add(flame);
    }

    return fireGroup;
  }

  function buildArchersShield() {
    var shieldGroup = new THREE.Group();
    shieldGroup.name = 'archers-shield';

    var wallGeom = new THREE.BoxGeometry(24, 4, 1.5);
    var wall = new THREE.Mesh(wallGeom, materials.wall);
    wall.position.set(0, 10, 20);
    wall.castShadow = true;
    shieldGroup.add(wall);

    for (var i = 0; i < 6; i++) {
      var crenelGeom = new THREE.BoxGeometry(3, 3, 1);
      var crenel = new THREE.Mesh(crenelGeom, materials.stone);
      crenel.position.set(-10 + i * 4, 14, 20);
      shieldGroup.add(crenel);
    }

    return shieldGroup;
  }

  function buildCastleWall() {
    var castleGroup = new THREE.Group();
    castleGroup.name = 'castle-wall';

    var mainWallGeom = new THREE.BoxGeometry(60, 25, 3);
    var mainWall = new THREE.Mesh(mainWallGeom, materials.stone);
    mainWall.position.set(0, 12, -50);
    mainWall.castShadow = true;
    castleGroup.add(mainWall);

    for (var i = 0; i < 5; i++) {
      var breachX = -20 + i * 12;
      var rubbleGeom = new THREE.BoxGeometry(4 + Math.random() * 2, 5 + Math.random() * 3, 2);
      var rubble = new THREE.Mesh(rubbleGeom, materials.stone);
      rubble.position.set(breachX, 8 + Math.random() * 2, -48 + Math.random() * 2);
      rubble.rotation.set(Math.random() * 0.3, Math.random() * 0.3, Math.random() * 0.2);
      castleGroup.add(rubble);
    }

    return castleGroup;
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    siegeParts = [];
    animationState = { ramOffset: 0, ramDirection: 1 };

    var base = buildSiegeBase();
    scene.add(base);
    siegeParts.push(base);

    var tower = buildSiegeTower();
    scene.add(tower);
    siegeParts.push(tower);

    var ram = buildBatteringRam();
    scene.add(ram);
    siegeParts.push(ram);

    var ladders = buildLadders();
    scene.add(ladders);
    siegeParts.push(ladders);

    var fire = buildGreekFire();
    scene.add(fire);
    siegeParts.push(fire);

    var shield = buildArchersShield();
    scene.add(shield);
    siegeParts.push(shield);

    var castle = buildCastleWall();
    scene.add(castle);
    siegeParts.push(castle);

    var light = new THREE.DirectionalLight(0xffffff, 0.9);
    light.position.set(30, 40, 40);
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    scene.add(light);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  }

  function update(delta) {
    animationState.ramOffset += delta * 0.3 * animationState.ramDirection;
    if (animationState.ramOffset > 2) animationState.ramDirection = -1;
    if (animationState.ramOffset < 0) animationState.ramDirection = 1;

    var ram = scene.getObjectByName('siege-tower');
    if (ram) {
      ram.children.forEach(function(child) {
        if (child.name === 'battering-ram') {
          child.position.z += delta * 0.5 * animationState.ramDirection;
        }
      });
    }

    var tower = scene.getObjectByName('siege-tower');
    if (tower) {
      tower.rotation.y += delta * 0.1;
    }

    var fireGroup = scene.getObjectByName('greek-fire');
    if (fireGroup) {
      fireGroup.children.forEach(function(child) {
        if (child.name === undefined && child instanceof THREE.Mesh && child.material.emissive) {
          child.scale.z = 1 + Math.sin(Date.now() * 0.003) * 0.2;
        }
      });
    }
  }

  function reset() {
    siegeParts.forEach(function(part) {
      scene.remove(part);
    });
    siegeParts = [];
    animationState = { ramOffset: 0, ramDirection: 1 };
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
