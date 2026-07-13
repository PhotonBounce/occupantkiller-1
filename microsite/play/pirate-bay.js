window.PirateBay = (function() { 'use strict';

var scene, camera;
var cove = {};
var animations = [];
var time = 0;

function init(sceneRef, cameraRef) {
  scene = sceneRef;
  camera = cameraRef;
  time = 0;
  animations = [];

  // Hidden cove cliffs - tall BoxGeometry rock walls surrounding bay
  var cliffGeometry = new THREE.BoxGeometry(200, 150, 50);
  var cliffMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3f35 });

  var cliffNorth = new THREE.Mesh(cliffGeometry, cliffMaterial);
  cliffNorth.position.set(0, 75, -100);
  cliffNorth.castShadow = true;
  cliffNorth.receiveShadow = true;
  scene.add(cliffNorth);
  cove.cliffNorth = cliffNorth;

  var cliffSouth = new THREE.Mesh(cliffGeometry, cliffMaterial);
  cliffSouth.position.set(0, 75, 100);
  cliffSouth.castShadow = true;
  cliffSouth.receiveShadow = true;
  scene.add(cliffSouth);
  cove.cliffSouth = cliffSouth;

  var cliffEast = new THREE.Mesh(new THREE.BoxGeometry(50, 150, 200), cliffMaterial);
  cliffEast.position.set(100, 75, 0);
  cliffEast.castShadow = true;
  cliffEast.receiveShadow = true;
  scene.add(cliffEast);
  cove.cliffEast = cliffEast;

  var cliffWest = new THREE.Mesh(new THREE.BoxGeometry(50, 150, 200), cliffMaterial);
  cliffWest.position.set(-100, 75, 0);
  cliffWest.castShadow = true;
  cliffWest.receiveShadow = true;
  scene.add(cliffWest);
  cove.cliffWest = cliffWest;

  // Water - animated BoxGeometry bay surface with wave oscillation
  var waterGeometry = new THREE.BoxGeometry(180, 1, 180);
  var waterMaterial = new THREE.MeshStandardMaterial({ color: 0x1a5f7a, roughness: 0.2, metalness: 0.3 });
  var water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.position.set(0, 0, 0);
  water.receiveShadow = true;
  scene.add(water);
  cove.water = water;
  cove.waterOriginalY = water.position.y;

  animations.push({
    target: water,
    type: 'wave',
    amplitude: 0.5,
    frequency: 1.2,
    originalY: water.position.y
  });

  // Pirate galleons - BoxGeometry hulls with CylinderGeometry masts
  createGalleon(0, 2, -40, -0.3);
  createGalleon(-50, 2, 20, 0.5);
  createGalleon(45, 2, 10, -0.2);

  // Wooden docks - BoxGeometry planks on CylinderGeometry supports
  createDock(-60, -30);
  createDock(-60, 0);
  createDock(-60, 30);

  // Cannon emplacements - CylinderGeometry barrels on BoxGeometry carriages
  createCannonEmplacement(-70, 5, -35);
  createCannonEmplacement(-70, 5, 35);
  createCannonEmplacement(70, 5, -40);

  // Treasure cave - BoxGeometry cavern entrance with SphereGeometry gems
  createTreasureCave(80, 10, -60);

  // Skull and crossbones flags - BoxGeometry flagpole + flag panels
  createSkullFlag(-45, 40, -70);
  createSkullFlag(55, 40, 60);

  // Rum barrel stacks - CylinderGeometry barrel towers
  createBarrelStack(-80, 2, 55);
  createBarrelStack(75, 2, -55);

  // Crow's nest lookout - CylinderGeometry perch near cliff top
  createCrowsNest(85, 130, -80);

  // Rope bridge - LineSegments cables + BoxGeometry planks
  createRopeBridge(-50, 35, -60, 50, 35, -50);

  // Bonfire on shore - animated SphereGeometry fire with CylinderGeometry base
  createBonfire(0, 5, 75);

  // Lighting
  var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(50, 100, 50);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.camera.left = -200;
  directionalLight.shadow.camera.right = 200;
  directionalLight.shadow.camera.top = 200;
  directionalLight.shadow.camera.bottom = -200;
  scene.add(directionalLight);

  return true;
}

function createGalleon(x, y, z, rotY) {
  var group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  // Hull
  var hullGeo = new THREE.BoxGeometry(25, 15, 60);
  var hullMat = new THREE.MeshLambertMaterial({ color: 0x3d2f24 });
  var hull = new THREE.Mesh(hullGeo, hullMat);
  hull.position.y = 5;
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);

  // Main mast
  var mastGeo = new THREE.CylinderGeometry(1, 1, 40, 8);
  var mastMat = new THREE.MeshLambertMaterial({ color: 0x8b6f47 });
  var mast = new THREE.Mesh(mastGeo, mastMat);
  mast.position.set(0, 25, 0);
  mast.castShadow = true;
  mast.receiveShadow = true;
  group.add(mast);

  // Sails - ConeGeometry sections
  var sailGeo = new THREE.ConeGeometry(8, 20, 4);
  var sailMat = new THREE.MeshLambertMaterial({ color: 0xd4a574 });
  var sail1 = new THREE.Mesh(sailGeo, sailMat);
  sail1.position.set(-5, 20, -5);
  sail1.rotation.z = 0.3;
  sail1.castShadow = true;
  sail1.receiveShadow = true;
  group.add(sail1);

  var sail2 = new THREE.Mesh(sailGeo, sailMat);
  sail2.position.set(5, 15, -15);
  sail2.rotation.z = -0.3;
  sail2.castShadow = true;
  sail2.receiveShadow = true;
  group.add(sail2);

  // Rigging - LineSegments
  var rigPoints = [
    new THREE.Vector3(0, 40, 0),
    new THREE.Vector3(-12, 15, -30),
    new THREE.Vector3(0, 40, 0),
    new THREE.Vector3(12, 15, -30),
    new THREE.Vector3(0, 40, 0),
    new THREE.Vector3(-8, 20, 30)
  ];
  var rigGeo = new THREE.BufferGeometry().setFromPoints(rigPoints);
  var rigMat = new THREE.LineBasicMaterial({ color: 0x444444 });
  var rigging = new THREE.LineSegments(rigGeo, rigMat);
  group.add(rigging);

  animations.push({
    target: group,
    type: 'sway',
    amplitude: 0.2,
    frequency: 0.8
  });

  scene.add(group);
}

function createDock(x, z) {
  var group = new THREE.Group();
  group.position.set(x, 0, z);

  // Support pillars - CylinderGeometry
  for (var i = 0; i < 4; i++) {
    var pillarGeo = new THREE.CylinderGeometry(1.5, 1.8, 15, 8);
    var pillarMat = new THREE.MeshLambertMaterial({ color: 0x6b5d52 });
    var pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(-15 + i * 10, -7, 0);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    group.add(pillar);
  }

  // Planks - BoxGeometry
  for (var i = 0; i < 3; i++) {
    var plankGeo = new THREE.BoxGeometry(40, 1, 4);
    var plankMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
    var plank = new THREE.Mesh(plankGeo, plankMat);
    plank.position.y = 2;
    plank.position.z = -6 + i * 6;
    plank.castShadow = true;
    plank.receiveShadow = true;
    group.add(plank);
  }

  scene.add(group);
}

function createCannonEmplacement(x, y, z) {
  var group = new THREE.Group();
  group.position.set(x, y, z);

  // Carriage - BoxGeometry
  var carriageGeo = new THREE.BoxGeometry(8, 4, 6);
  var carriageMat = new THREE.MeshLambertMaterial({ color: 0x3d2f24 });
  var carriage = new THREE.Mesh(carriageGeo, carriageMat);
  carriage.position.y = 2;
  carriage.castShadow = true;
  carriage.receiveShadow = true;
  group.add(carriage);

  // Cannon barrel - CylinderGeometry
  var barrelGeo = new THREE.CylinderGeometry(0.8, 0.9, 12, 8);
  var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
  var barrel = new THREE.Mesh(barrelGeo, barrelMat);
  barrel.position.set(0, 4, 0);
  barrel.rotation.z = 0.3;
  barrel.castShadow = true;
  barrel.receiveShadow = true;
  group.add(barrel);

  // Wheels - CylinderGeometry
  for (var i = 0; i < 2; i++) {
    var wheelGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.8, 8);
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x4a3f35 });
    var wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(-3 + i * 6, 1, 0);
    wheel.castShadow = true;
    wheel.receiveShadow = true;
    group.add(wheel);
  }

  animations.push({
    target: barrel,
    type: 'rotate',
    axis: 'z',
    amplitude: 0.15,
    frequency: 0.5
  });

  scene.add(group);
}

function createTreasureCave(x, y, z) {
  var group = new THREE.Group();
  group.position.set(x, y, z);

  // Cave entrance - BoxGeometry
  var entranceGeo = new THREE.BoxGeometry(20, 25, 8);
  var entranceMat = new THREE.MeshLambertMaterial({ color: 0x2a2420 });
  var entrance = new THREE.Mesh(entranceGeo, entranceMat);
  entrance.castShadow = true;
  entrance.receiveShadow = true;
  group.add(entrance);

  // Gem clusters - SphereGeometry
  for (var i = 0; i < 5; i++) {
    var gemGeo = new THREE.SphereGeometry(1.5, 8, 8);
    var gemMat = new THREE.MeshStandardMaterial({ color: Math.random() > 0.5 ? 0xff00ff : 0x00ffff, emissive: 0x0088ff, roughness: 0.2, metalness: 0.8 });
    var gem = new THREE.Mesh(gemGeo, gemMat);
    gem.position.set(-8 + i * 4, -5 + Math.sin(i) * 3, 0);
    gem.castShadow = true;
    gem.receiveShadow = true;
    group.add(gem);

    animations.push({
      target: gem,
      type: 'bob',
      amplitude: 0.8,
      frequency: 1.5 + i * 0.3
    });
  }

  // Gold coin piles - BoxGeometry stacks
  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
      var coinGeo = new THREE.BoxGeometry(0.8, 0.2, 0.8);
      var coinMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
      var coin = new THREE.Mesh(coinGeo, coinMat);
      coin.position.set(-6 + i * 6, -3 + j * 0.3, 2);
      coin.castShadow = true;
      coin.receiveShadow = true;
      group.add(coin);
    }
  }

  scene.add(group);
}

function createSkullFlag(x, y, z) {
  var group = new THREE.Group();
  group.position.set(x, y, z);

  // Flagpole - CylinderGeometry
  var poleGeo = new THREE.CylinderGeometry(0.5, 0.5, 30, 8);
  var poleMat = new THREE.MeshLambertMaterial({ color: 0x8b6f47 });
  var pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 15;
  pole.castShadow = true;
  pole.receiveShadow = true;
  group.add(pole);

  // Flag - BoxGeometry panels
  var flagGeo = new THREE.BoxGeometry(12, 8, 0.5);
  var flagMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  var flag = new THREE.Mesh(flagGeo, flagMat);
  flag.position.set(8, 28, 0);
  flag.castShadow = true;
  flag.receiveShadow = true;
  group.add(flag);

  // Skull - SphereGeometry
  var skullGeo = new THREE.SphereGeometry(2, 8, 8);
  var skullMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
  var skull = new THREE.Mesh(skullGeo, skullMat);
  skull.position.set(8, 28, 1);
  skull.castShadow = true;
  skull.receiveShadow = true;
  group.add(skull);

  // Crossbones - BoxGeometry
  var boneGeo = new THREE.BoxGeometry(6, 0.6, 0.5);
  var boneMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
  var bone1 = new THREE.Mesh(boneGeo, boneMat);
  bone1.position.set(8, 25, 1);
  bone1.rotation.z = 0.3;
  bone1.castShadow = true;
  bone1.receiveShadow = true;
  group.add(bone1);

  var bone2 = new THREE.Mesh(boneGeo, boneMat);
  bone2.position.set(8, 25, 1);
  bone2.rotation.z = -0.3;
  bone2.castShadow = true;
  bone2.receiveShadow = true;
  group.add(bone2);

  animations.push({
    target: flag,
    type: 'flutter',
    amplitude: 0.3,
    frequency: 2
  });

  scene.add(group);
}

function createBarrelStack(x, y, z) {
  var group = new THREE.Group();
  group.position.set(x, y, z);

  for (var i = 0; i < 4; i++) {
    var barrelGeo = new THREE.CylinderGeometry(2, 2, 3, 8);
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    var barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.y = i * 3.2;
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    group.add(barrel);

    // Band around barrel - BoxGeometry
    var bandGeo = new THREE.BoxGeometry(4.5, 0.4, 4.5);
    var bandMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var band = new THREE.Mesh(bandGeo, bandMat);
    band.position.set(0, i * 3.2, 0);
    band.castShadow = true;
    band.receiveShadow = true;
    group.add(band);
  }

  scene.add(group);
}

function createCrowsNest(x, y, z) {
  var group = new THREE.Group();
  group.position.set(x, y, z);

  // Mast section - CylinderGeometry
  var mastGeo = new THREE.CylinderGeometry(1.2, 1.2, 15, 8);
  var mastMat = new THREE.MeshLambertMaterial({ color: 0x8b6f47 });
  var mast = new THREE.Mesh(mastGeo, mastMat);
  mast.position.y = -7;
  mast.castShadow = true;
  mast.receiveShadow = true;
  group.add(mast);

  // Perch platform - CylinderGeometry
  var perchGeo = new THREE.CylinderGeometry(4, 4, 0.8, 8);
  var perchMat = new THREE.MeshLambertMaterial({ color: 0x6b5d52 });
  var perch = new THREE.Mesh(perchGeo, perchMat);
  perch.position.y = 5;
  perch.castShadow = true;
  perch.receiveShadow = true;
  group.add(perch);

  // Guard post - BoxGeometry rails
  for (var i = 0; i < 4; i++) {
    var railGeo = new THREE.BoxGeometry(0.4, 2, 0.4);
    var railMat = new THREE.MeshLambertMaterial({ color: 0x3d2f24 });
    var rail = new THREE.Mesh(railGeo, railMat);
    var angle = (i / 4) * Math.PI * 2;
    rail.position.set(Math.cos(angle) * 3.8, 6.5, Math.sin(angle) * 3.8);
    rail.castShadow = true;
    rail.receiveShadow = true;
    group.add(rail);
  }

  scene.add(group);
}

function createRopeBridge(x1, y1, z1, x2, y2, z2) {
  var group = new THREE.Group();
  group.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);

  var dx = x2 - x1;
  var dz = z2 - z1;
  var dist = Math.sqrt(dx * dx + dz * dz);
  var angle = Math.atan2(dz, dx);

  // Rope cables - LineSegments
  var cablePoints = [
    new THREE.Vector3(-dist / 2, 5, 0),
    new THREE.Vector3(dist / 2, 5, 0),
    new THREE.Vector3(-dist / 2, -5, 0),
    new THREE.Vector3(dist / 2, -5, 0)
  ];
  var cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
  var cableMat = new THREE.LineBasicMaterial({ color: 0x6b5d52 });
  var cables = new THREE.LineSegments(cableGeo, cableMat);
  cables.rotation.z = angle;
  group.add(cables);

  // Planks - BoxGeometry
  for (var i = 0; i < 8; i++) {
    var plankGeo = new THREE.BoxGeometry(2, 0.8, dist / 8);
    var plankMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
    var plank = new THREE.Mesh(plankGeo, plankMat);
    plank.position.x = -dist / 2 + (i + 0.5) * (dist / 8);
    plank.rotation.z = angle;
    plank.castShadow = true;
    plank.receiveShadow = true;
    group.add(plank);
  }

  scene.add(group);
}

function createBonfire(x, y, z) {
  var group = new THREE.Group();
  group.position.set(x, y, z);

  // Log base - CylinderGeometry
  var logGeo = new THREE.CylinderGeometry(2, 2, 3, 8);
  var logMat = new THREE.MeshLambertMaterial({ color: 0x3d2f24 });
  var log = new THREE.Mesh(logGeo, logMat);
  log.castShadow = true;
  log.receiveShadow = true;
  group.add(log);

  // Fire - SphereGeometry animated cluster
  for (var i = 0; i < 5; i++) {
    var fireGeo = new THREE.SphereGeometry(1.5, 8, 8);
    var fireColor = i < 2 ? 0xff6600 : 0xffaa00;
    var fireMat = new THREE.MeshLambertMaterial({ color: fireColor, emissive: fireColor });
    var fire = new THREE.Mesh(fireGeo, fireMat);
    var angle = (i / 5) * Math.PI * 2;
    fire.position.set(Math.cos(angle) * 2, 3 + i * 0.8, Math.sin(angle) * 2);
    fire.castShadow = true;
    fire.receiveShadow = true;
    group.add(fire);

    animations.push({
      target: fire,
      type: 'flicker',
      amplitude: 0.5,
      frequency: 3 + Math.random() * 2,
      originalY: fire.position.y
    });
  }

  scene.add(group);
}

function update(delta) {
  time += delta;

  var i;
  for (i = 0; i < animations.length; i++) {
    var anim = animations[i];

    if (anim.type === 'wave') {
      anim.target.position.y = anim.originalY + Math.sin(time * anim.frequency) * anim.amplitude;
      anim.target.scale.z = 1 + Math.cos(time * anim.frequency * 0.8) * 0.05;
    }

    if (anim.type === 'sway') {
      anim.target.rotation.z = Math.sin(time * anim.frequency) * anim.amplitude;
      anim.target.rotation.x = Math.cos(time * anim.frequency * 0.7) * anim.amplitude * 0.5;
    }

    if (anim.type === 'bob') {
      anim.target.position.y = anim.target.position.y + Math.sin(time * anim.frequency) * anim.amplitude * delta;
    }

    if (anim.type === 'flutter') {
      anim.target.rotation.z = Math.sin(time * anim.frequency) * anim.amplitude;
      anim.target.rotation.y = Math.cos(time * anim.frequency * 0.6) * anim.amplitude * 0.3;
    }

    if (anim.type === 'flicker') {
      var flicker = 0.8 + Math.sin(time * anim.frequency + Math.random()) * 0.2;
      anim.target.position.y = anim.originalY + Math.sin(time * anim.frequency * 1.5) * anim.amplitude;
      anim.target.scale.set(flicker, flicker, flicker);
    }

    if (anim.type === 'rotate') {
      if (anim.axis === 'z') {
        anim.target.rotation.z = 0.3 + Math.sin(time * anim.frequency) * anim.amplitude;
      }
    }
  }
}

function reset() {
  time = 0;
  animations = [];

  if (scene && scene.children) {
    var objectsToRemove = [];
    var i;
    for (i = scene.children.length - 1; i >= 0; i--) {
      var child = scene.children[i];
      if (child !== camera && !(child instanceof THREE.Light)) {
        objectsToRemove.push(child);
      }
    }

    for (i = 0; i < objectsToRemove.length; i++) {
      scene.remove(objectsToRemove[i]);
    }
  }

  cove = {};
}

return {
  init: init,
  update: update,
  reset: reset
};

}());
