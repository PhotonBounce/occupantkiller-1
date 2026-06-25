window.SalvageMission = (function() {
  'use strict';

  var scene, camera;
  var objects = [];
  var materials = [];
  var hud = null;
  var hudCanvas = null;
  var hudTexture = null;

  var animations = {
    kelpSwayPhase: 0,
    fishSchoolPhase: 0,
    bubblePhases: [],
    torchFlickerPhase: 0,
    rivalDiverPhase: 0
  };

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    objects = [];
    materials = [];
    animations.kelpSwayPhase = 0;
    animations.fishSchoolPhase = 0;
    animations.bubblePhases = [0, 0, 0, 0];
    animations.torchFlickerPhase = 0;
    animations.rivalDiverPhase = 0;

    // 1. Ocean floor - deep dark blue flat box
    var oceanFloorGeom = new THREE.BoxGeometry(400, 0.3, 400);
    var oceanFloorMat = new THREE.MeshPhongMaterial({ color: 0x0a1a2e });
    materials.push(oceanFloorMat);
    var oceanFloor = new THREE.Mesh(oceanFloorGeom, oceanFloorMat);
    oceanFloor.position.y = -0.15;
    oceanFloor.name = 'oceanFloor';
    scene.add(oceanFloor);
    objects.push(oceanFloor);

    // 2. Sunken warship hull - large dark gray box at angle
    var hullGeom = new THREE.BoxGeometry(80, 12, 20);
    var hullMat = new THREE.MeshPhongMaterial({ color: 0x2a2a3a });
    materials.push(hullMat);
    var hull = new THREE.Mesh(hullGeom, hullMat);
    hull.position.set(0, 6, 0);
    hull.rotation.z = 0.2;
    hull.name = 'hull';
    scene.add(hull);
    objects.push(hull);

    // 3. Ship superstructure - bridge box
    var bridgeGeom = new THREE.BoxGeometry(12, 8, 10);
    var bridgeMat = new THREE.MeshPhongMaterial({ color: 0x1a1a2a });
    materials.push(bridgeMat);
    var bridge = new THREE.Mesh(bridgeGeom, bridgeMat);
    bridge.position.set(20, 16, 0);
    bridge.name = 'bridge';
    scene.add(bridge);
    objects.push(bridge);

    // Gun turret box
    var turretGeom = new THREE.BoxGeometry(8, 5, 8);
    var turretMat = new THREE.MeshPhongMaterial({ color: 0x1a1a2a });
    materials.push(turretMat);
    var turret = new THREE.Mesh(turretGeom, turretMat);
    turret.position.set(-25, 14, 0);
    turret.name = 'turret';
    scene.add(turret);
    objects.push(turret);

    // Mast pole (tall thin box)
    var mastGeom = new THREE.BoxGeometry(1.5, 25, 1.5);
    var mastMat = new THREE.MeshPhongMaterial({ color: 0x0a0a1a });
    materials.push(mastMat);
    var mast = new THREE.Mesh(mastGeom, mastMat);
    mast.position.set(5, 20, 0);
    mast.name = 'mast';
    scene.add(mast);
    objects.push(mast);

    // 4. Ship interior openings - dark gap (cutaway section)
    var gapGeom = new THREE.BoxGeometry(30, 8, 15);
    var gapMat = new THREE.MeshPhongMaterial({ color: 0x050a0f });
    materials.push(gapMat);
    var gap = new THREE.Mesh(gapGeom, gapMat);
    gap.position.set(0, 8, 0);
    gap.name = 'shipGap';
    scene.add(gap);
    objects.push(gap);

    // 5. Diver 1 - black wetsuit (body box + helmet sphere + tank)
    addDiver(-15, 8, -12, 0x000000);

    // Diver 2
    addDiver(-18, 5, -8, 0x000000);

    // Diver 3
    addDiver(-12, 6, 8, 0x000000);

    // Diver 4
    addDiver(-20, 4, 15, 0x000000);

    // 6. Rival diver figures - red wetsuits (3 of them)
    addDiver(25, 8, -18, 0xff0000, true);
    addDiver(28, 5, -15, 0xff0000, true);
    addDiver(22, 6, -20, 0xff0000, true);

    // 7. Submersible vehicle - yellow submarine
    var subBodyGeom = new THREE.BoxGeometry(15, 6, 8);
    var subMat = new THREE.MeshPhongMaterial({ color: 0xffdd00 });
    materials.push(subMat);
    var subBody = new THREE.Mesh(subBodyGeom, subMat);
    subBody.position.set(-50, 8, -30);
    subBody.name = 'submarine';
    scene.add(subBody);
    objects.push(subBody);

    // Propeller disc
    var propGeom = new THREE.BoxGeometry(0.5, 4, 4);
    var propMat = new THREE.MeshPhongMaterial({ color: 0xccaa00 });
    materials.push(propMat);
    var prop = new THREE.Mesh(propGeom, propMat);
    prop.position.set(-57.5, 8, -30);
    prop.name = 'propeller';
    scene.add(prop);
    objects.push(prop);

    // Viewport sphere
    var viewGeom = new THREE.SphereGeometry(2, 16, 16);
    var viewMat = new THREE.MeshPhongMaterial({ color: 0x0088ff });
    materials.push(viewMat);
    var viewport = new THREE.Mesh(viewGeom, viewMat);
    viewport.position.set(-42, 10, -30);
    viewport.name = 'viewport';
    scene.add(viewport);
    objects.push(viewport);

    // 8. Armored strongbox - gold trimmed heavy metal
    var boxGeom = new THREE.BoxGeometry(6, 4, 4);
    var boxMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
    materials.push(boxMat);
    var strongbox = new THREE.Mesh(boxGeom, boxMat);
    strongbox.position.set(5, 3, 5);
    strongbox.name = 'strongbox';
    scene.add(strongbox);
    objects.push(strongbox);

    // Gold trim emissive edge (small box)
    var trimGeom = new THREE.BoxGeometry(6.2, 0.3, 4.2);
    var trimMat = new THREE.MeshPhongMaterial({ color: 0xffaa00, emissive: 0xffaa00 });
    materials.push(trimMat);
    var trim = new THREE.Mesh(trimGeom, trimMat);
    trim.position.set(5, 4.5, 5);
    trim.name = 'boxTrim';
    scene.add(trim);
    objects.push(trim);

    // 9. Cutting torch effect - bright emissive sphere
    var torchGeom = new THREE.SphereGeometry(0.4, 8, 8);
    var torchMat = new THREE.MeshPhongMaterial({
      color: 0xffff00,
      emissive: 0xffaa00,
      emissiveIntensity: 1.0
    });
    materials.push(torchMat);
    var torch = new THREE.Mesh(torchGeom, torchMat);
    torch.position.set(-15, 8.5, -10);
    torch.name = 'torch';
    scene.add(torch);
    objects.push(torch);

    // 10. Coral formations - 8 clusters (orange/pink/purple irregular stacks)
    var coralColors = [0xff6b35, 0xf7931e, 0xff69b4, 0xda70d6];
    var coralPositions = [
      { x: 30, z: -35 }, { x: -40, z: 20 }, { x: 45, z: 15 },
      { x: -50, z: -40 }, { x: 60, z: 5 }, { x: -60, z: 30 },
      { x: 70, z: -20 }, { x: -35, z: -50 }
    ];

    for (var i = 0; i < coralPositions.length; i++) {
      var coralColor = coralColors[i % coralColors.length];
      addCoralCluster(coralPositions[i].x, 0.5, coralPositions[i].z, coralColor);
    }

    // 11. Kelp forest - 5 groups of swaying stalks
    var kelpPositions = [
      { x: -30, z: -15 }, { x: 15, z: -30 }, { x: -50, z: 10 },
      { x: 35, z: 20 }, { x: -15, z: 35 }
    ];

    for (var i = 0; i < kelpPositions.length; i++) {
      addKelpGroup(kelpPositions[i].x, kelpPositions[i].z);
    }

    // 12. Fish school - 20 small flat boxes
    for (var i = 0; i < 20; i++) {
      var fishGeom = new THREE.BoxGeometry(0.8, 0.3, 0.3);
      var fishMat = new THREE.MeshPhongMaterial({ color: 0x1a5c2a });
      materials.push(fishMat);
      var fish = new THREE.Mesh(fishGeom, fishMat);
      fish.position.set(
        Math.random() * 60 - 30,
        Math.random() * 15 + 5,
        Math.random() * 60 - 30
      );
      fish.name = 'fish_' + i;
      scene.add(fish);
      objects.push(fish);
    }

    // 13. Bubbles rising from divers
    for (var d = 0; d < 4; d++) {
      for (var b = 0; b < 6; b++) {
        var bubbleGeom = new THREE.SphereGeometry(0.15, 8, 8);
        var bubbleMat = new THREE.MeshPhongMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 });
        materials.push(bubbleMat);
        var bubble = new THREE.Mesh(bubbleGeom, bubbleMat);
        bubble.userData.diverIndex = d;
        bubble.userData.bubbleIndex = b;
        scene.add(bubble);
        objects.push(bubble);
      }
    }

    // 14. Depth charge - cylinder-ish box with warning markings
    var chargeGeom = new THREE.BoxGeometry(2, 3.5, 2);
    var chargeMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    materials.push(chargeMat);
    var charge = new THREE.Mesh(chargeGeom, chargeMat);
    charge.position.set(50, 0.5, -45);
    charge.name = 'depthCharge';
    scene.add(charge);
    objects.push(charge);

    // Warning stripe (thin box)
    var stripeGeom = new THREE.BoxGeometry(2.1, 0.4, 2.1);
    var stripeMat = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    materials.push(stripeMat);
    var stripe = new THREE.Mesh(stripeGeom, stripeMat);
    stripe.position.set(50, 2, -45);
    stripe.name = 'chargeStripe';
    scene.add(stripe);
    objects.push(stripe);

    // 15. Anchor chain - series of linked flat boxes
    for (var i = 0; i < 8; i++) {
      var linkGeom = new THREE.BoxGeometry(1, 0.8, 0.3);
      var linkMat = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
      materials.push(linkMat);
      var link = new THREE.Mesh(linkGeom, linkMat);
      link.position.set(-35, 18 - (i * 2.5), -8);
      link.name = 'chainLink_' + i;
      scene.add(link);
      objects.push(link);
    }

    // 16. Salvage crane cable - thin box line from surface to ship
    var cableGeom = new THREE.BoxGeometry(0.2, 80, 0.2);
    var cableMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
    materials.push(cableMat);
    var cable = new THREE.Mesh(cableGeom, cableMat);
    cable.position.set(-60, 40, 0);
    cable.name = 'cable';
    scene.add(cable);
    objects.push(cable);

    // Crane hook box at end
    var hookGeom = new THREE.BoxGeometry(3, 2, 1);
    var hookMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
    materials.push(hookMat);
    var hook = new THREE.Mesh(hookGeom, hookMat);
    hook.position.set(-60, 10, 0);
    hook.name = 'craneHook';
    scene.add(hook);
    objects.push(hook);

    // Create HUD
    createHUD();
  }

  function addDiver(x, y, z, suitColor, isRival) {
    // Body (box)
    var bodyGeom = new THREE.BoxGeometry(1.2, 2.5, 0.8);
    var bodyMat = new THREE.MeshPhongMaterial({ color: suitColor });
    materials.push(bodyMat);
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(x, y, z);
    body.name = 'diver_body';
    scene.add(body);
    objects.push(body);

    // Helmet (sphere)
    var helmetGeom = new THREE.SphereGeometry(0.5, 16, 16);
    var helmetMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    materials.push(helmetMat);
    var helmet = new THREE.Mesh(helmetGeom, helmetMat);
    helmet.position.set(x, y + 1.8, z);
    helmet.name = 'diver_helmet';
    scene.add(helmet);
    objects.push(helmet);

    // Tank on back (small box)
    var tankGeom = new THREE.BoxGeometry(0.5, 1.8, 0.4);
    var tankMat = new THREE.MeshPhongMaterial({ color: 0x0066cc });
    materials.push(tankMat);
    var tank = new THREE.Mesh(tankGeom, tankMat);
    tank.position.set(x, y, z - 0.8);
    tank.name = 'diver_tank';
    scene.add(tank);
    objects.push(tank);

    if (isRival) {
      helmet.userData.isRival = true;
      body.userData.isRival = true;
      tank.userData.isRival = true;
    }
  }

  function addCoralCluster(x, y, z, color) {
    for (var i = 0; i < 3; i++) {
      var coralGeom = new THREE.BoxGeometry(
        Math.random() * 2 + 1,
        Math.random() * 3 + 2,
        Math.random() * 2 + 1
      );
      var coralMat = new THREE.MeshPhongMaterial({ color: color });
      materials.push(coralMat);
      var coral = new THREE.Mesh(coralGeom, coralMat);
      coral.position.set(
        x + (Math.random() - 0.5) * 3,
        y + (i * 1.5),
        z + (Math.random() - 0.5) * 3
      );
      coral.name = 'coral_' + x + '_' + z + '_' + i;
      scene.add(coral);
      objects.push(coral);
    }
  }

  function addKelpGroup(x, z) {
    for (var i = 0; i < 4; i++) {
      var stalkGeom = new THREE.BoxGeometry(0.3, 20, 0.3);
      var stalkMat = new THREE.MeshPhongMaterial({ color: 0x1a5c2a });
      materials.push(stalkMat);
      var stalk = new THREE.Mesh(stalkGeom, stalkMat);
      stalk.position.set(
        x + (i - 1.5) * 1.5,
        10,
        z
      );
      stalk.userData.kelpIndex = i;
      stalk.userData.kelpGroupX = x;
      stalk.userData.kelpGroupZ = z;
      stalk.name = 'kelp_' + x + '_' + z + '_' + i;
      scene.add(stalk);
      objects.push(stalk);
    }
  }

  function createHUD() {
    hudCanvas = document.createElement('canvas');
    hudCanvas.width = 512;
    hudCanvas.height = 128;
    var ctx = hudCanvas.getContext('2d');

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 512, 128);

    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('STRONGBOX STATUS: SECURED', 10, 30);
    ctx.fillText('DIVERS ACTIVE: 4', 10, 60);
    ctx.fillText('O2 LEVEL: 100%', 10, 90);

    hudTexture = new THREE.CanvasTexture(hudCanvas);
    var hudGeom = new THREE.BoxGeometry(2, 0.5, 0.01);
    var hudMat = new THREE.MeshPhongMaterial({ map: hudTexture });
    materials.push(hudMat);
    hud = new THREE.Mesh(hudGeom, hudMat);
    hud.position.set(-4, 2.5, 0);
    hud.renderOrder = 10;
    scene.add(hud);
  }

  function update(delta) {
    animations.kelpSwayPhase += delta * 0.5;
    animations.fishSchoolPhase += delta * 0.3;
    animations.torchFlickerPhase += delta * 8;
    animations.rivalDiverPhase += delta * 0.5;

    // Kelp sway animation
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.name && obj.name.indexOf('kelp_') === 0) {
        var amplitude = 0.15;
        obj.rotation.z = Math.sin(animations.kelpSwayPhase + (obj.userData.kelpIndex || 0)) * amplitude;
      }
    }

    // Fish school circular motion
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.name && obj.name.indexOf('fish_') === 0) {
        var fishIndex = parseInt(obj.name.split('_')[1]);
        var radius = 15;
        var angle = animations.fishSchoolPhase + (fishIndex / 20) * Math.PI * 2;
        var centerX = 0;
        var centerZ = 0;
        obj.position.x = centerX + Math.cos(angle) * radius;
        obj.position.z = centerZ + Math.sin(angle) * radius;
        obj.rotation.y = angle;
      }
    }

    // Diver bubbles floating upward
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.name && obj.geometry.type === 'SphereGeometry' && obj.userData.bubbleIndex !== undefined) {
        var diverIndex = obj.userData.diverIndex || 0;
        var bubbleIndex = obj.userData.bubbleIndex || 0;
        var phase = animations.bubblePhases[diverIndex] + (bubbleIndex * 0.1);
        var bubbleY = (phase % 30) - 15;

        if (diverIndex === 0) {
          obj.position.set(-15 + (Math.random() - 0.5) * 0.5, -5 + bubbleY, -10);
        } else if (diverIndex === 1) {
          obj.position.set(-18 + (Math.random() - 0.5) * 0.5, -5 + bubbleY, -8);
        } else if (diverIndex === 2) {
          obj.position.set(-12 + (Math.random() - 0.5) * 0.5, -5 + bubbleY, 8);
        } else {
          obj.position.set(-20 + (Math.random() - 0.5) * 0.5, -5 + bubbleY, 15);
        }
      }
    }
    animations.bubblePhases[0] += delta * 3;
    animations.bubblePhases[1] += delta * 2.8;
    animations.bubblePhases[2] += delta * 3.2;
    animations.bubblePhases[3] += delta * 2.9;

    // Torch flicker effect
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.name === 'torch') {
        var flicker = 0.5 + Math.sin(animations.torchFlickerPhase) * 0.5;
        obj.material.emissiveIntensity = flicker;
      }
    }

    // Submersible moves toward ship
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.name === 'submarine') {
        obj.position.x = -50 + Math.sin(animations.rivalDiverPhase * 0.5) * 15;
      }
    }

    // Rival divers approach strongbox
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.userData && obj.userData.isRival && obj.name === 'diver_body') {
        var progress = (Math.sin(animations.rivalDiverPhase) + 1) * 0.5;
        var startX = 25 + (Math.floor(Math.random() * 3) - 1) * 3;
        obj.position.x = startX - progress * 20;
      }
    }
  }

  function reset() {
    // Dispose geometry and materials
    for (var i = 0; i < objects.length; i++) {
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
      scene.remove(obj);
    }

    for (var i = 0; i < materials.length; i++) {
      materials[i].dispose();
    }

    if (hudTexture) {
      hudTexture.dispose();
    }
    if (hud) {
      scene.remove(hud);
    }

    objects = [];
    materials = [];
    hud = null;
    hudCanvas = null;
    hudTexture = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
