var Catacombs = (function() {
  'use strict';

  var scene = null;
  var sceneObjects = [];
  var animations = [];

  function init(threeScene) {
    scene = threeScene;
    sceneObjects = [];
    animations = [];

    // Stone wall material (ossuary)
    var stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x6B6B6B,
      metalness: 0.1,
      roughness: 0.8
    });

    var boneWhite = new THREE.MeshStandardMaterial({
      color: 0xF5E6D3,
      metalness: 0.0,
      roughness: 0.9
    });

    var candle = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      emissive: 0xFF8C00,
      emissiveIntensity: 0.6
    });

    var darkWood = new THREE.MeshStandardMaterial({
      color: 0x2C1810,
      metalness: 0.0,
      roughness: 0.9
    });

    var water = new THREE.MeshStandardMaterial({
      color: 0x1E3A5F,
      metalness: 0.3,
      roughness: 0.2,
      transparent: true,
      opacity: 0.7
    });

    var metal = new THREE.MeshStandardMaterial({
      color: 0x4A4A4A,
      metalness: 0.8,
      roughness: 0.2
    });

    // 1. Main catacomb ceiling arch
    var ceilingArchGeometry = new THREE.CylinderGeometry(20, 20, 40, 16, 8);
    var ceilingArch = new THREE.Mesh(ceilingArchGeometry, stoneMaterial);
    ceilingArch.position.set(0, 15, 0);
    ceilingArch.scale.set(1, 0.3, 1);
    scene.add(ceilingArch);
    sceneObjects.push(ceilingArch);

    // 2. Stone walls (left and right side walls)
    var wallGeometry = new THREE.BoxGeometry(2, 25, 60);
    var leftWall = new THREE.Mesh(wallGeometry, stoneMaterial);
    leftWall.position.set(-20, 10, 0);
    scene.add(leftWall);
    sceneObjects.push(leftWall);

    var rightWall = new THREE.Mesh(wallGeometry, stoneMaterial);
    rightWall.position.set(20, 10, 0);
    scene.add(rightWall);
    sceneObjects.push(rightWall);

    // 3. Skull wall niche with bone arrangement (ossuary)
    var skullWallGeometry = new THREE.BoxGeometry(15, 20, 2);
    var skullWall = new THREE.Mesh(skullWallGeometry, stoneMaterial);
    skullWall.position.set(0, 10, -25);
    scene.add(skullWall);
    sceneObjects.push(skullWall);

    // 4-9. Stacked bone niches (6 niches of bones)
    for (var i = 0; i < 6; i++) {
      var boneStackGeometry = new THREE.BoxGeometry(2, 2, 1.5);
      var boneStack = new THREE.Mesh(boneStackGeometry, boneWhite);
      boneStack.position.set(-5 + i * 2, 5 + i * 3, -24);
      scene.add(boneStack);
      sceneObjects.push(boneStack);
    }

    // 10. Candlelit altar (candle in center)
    var candleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
    var candleStick = new THREE.Mesh(candleGeometry, candle);
    candleStick.position.set(0, 1, 10);
    scene.add(candleStick);
    sceneObjects.push(candleStick);

    // 11. Candle flame (small cone)
    var flameGeometry = new THREE.ConeGeometry(0.2, 0.8, 8);
    var flame = new THREE.Mesh(flameGeometry, candle);
    flame.position.set(0, 2.8, 10);
    scene.add(flame);
    sceneObjects.push(flame);
    // Animate candle flicker
    animations.push({
      object: flame,
      type: 'flicker',
      baseY: 2.8,
      time: 0
    });

    // 12. Altar table (wooden base)
    var altarGeometry = new THREE.BoxGeometry(4, 0.5, 3);
    var altar = new THREE.Mesh(altarGeometry, darkWood);
    altar.position.set(0, 0.5, 10);
    scene.add(altar);
    sceneObjects.push(altar);

    // 13. Radio operator station (control box with antenna)
    var radioBoxGeometry = new THREE.BoxGeometry(2, 1.5, 1.5);
    var radioBox = new THREE.Mesh(radioBoxGeometry, metal);
    radioBox.position.set(-10, 1.5, 15);
    scene.add(radioBox);
    sceneObjects.push(radioBox);

    // 14. Radio antenna (cylinder rotating)
    var antennaGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
    var antenna = new THREE.Mesh(antennaGeometry, metal);
    antenna.position.set(-10, 4.5, 15);
    scene.add(antenna);
    sceneObjects.push(antenna);
    // Animate antenna rotation
    animations.push({
      object: antenna,
      type: 'rotate',
      axis: 'y',
      speed: 0.03
    });

    // 15. Weapon cache (hidden behind false wall - stone box)
    var cacheGeometry = new THREE.BoxGeometry(3, 2, 1);
    var weaponCache = new THREE.Mesh(cacheGeometry, stoneMaterial);
    weaponCache.position.set(18, 5, -20);
    scene.add(weaponCache);
    sceneObjects.push(weaponCache);

    // 16. Flooded lower chamber water surface
    var waterGeometry = new THREE.CylinderGeometry(25, 25, 0.5, 32);
    var waterSurface = new THREE.Mesh(waterGeometry, water);
    waterSurface.position.set(0, -8, 0);
    scene.add(waterSurface);
    sceneObjects.push(waterSurface);
    // Animate water ripple
    animations.push({
      object: waterSurface,
      type: 'ripple',
      baseY: -8,
      time: 0
    });

    // 17. Rope pulley lift (vertical rope with platform)
    var ropeGeometry = new THREE.CylinderGeometry(0.05, 0.05, 8, 8);
    var rope = new THREE.Mesh(ropeGeometry, metal);
    rope.position.set(12, 4, -15);
    scene.add(rope);
    sceneObjects.push(rope);

    // 18. Pulley platform (lifts up and down)
    var platformGeometry = new THREE.BoxGeometry(2, 0.3, 2);
    var platform = new THREE.Mesh(platformGeometry, darkWood);
    platform.position.set(12, 2, -15);
    scene.add(platform);
    sceneObjects.push(platform);
    // Animate platform lift
    animations.push({
      object: platform,
      type: 'lift',
      baseY: 2,
      range: 4,
      time: 0
    });

    // 19. Ossuary arrangement (skull sphere in center)
    var skullGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    var skull = new THREE.Mesh(skullGeometry, boneWhite);
    skull.position.set(0, 3, -10);
    scene.add(skull);
    sceneObjects.push(skull);

    // 20. Secret meeting table
    var tableGeometry = new THREE.BoxGeometry(6, 0.8, 3);
    var meetingTable = new THREE.Mesh(tableGeometry, darkWood);
    meetingTable.position.set(-15, 1, 5);
    scene.add(meetingTable);
    sceneObjects.push(meetingTable);

    // 21. Graffiti wall (resistance slogans - represented by stone surface)
    var graffitiWallGeometry = new THREE.BoxGeometry(10, 8, 0.5);
    var graffitiWall = new THREE.Mesh(graffitiWallGeometry, stoneMaterial);
    graffitiWall.position.set(15, 8, 28);
    scene.add(graffitiWall);
    sceneObjects.push(graffitiWall);

    // 22. Additional dripping water effect (animated sphere)
    var dropGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    var waterDrop = new THREE.Mesh(dropGeometry, water);
    waterDrop.position.set(5, 15, -20);
    scene.add(waterDrop);
    sceneObjects.push(waterDrop);
    // Animate water drop
    animations.push({
      object: waterDrop,
      type: 'drip',
      baseY: 15,
      startY: 15,
      time: 0
    });

    return {
      objectCount: sceneObjects.length,
      animationCount: animations.length
    };
  }

  function update(deltaTime) {
    for (var i = 0; i < animations.length; i++) {
      var anim = animations[i];

      if (anim.type === 'flicker') {
        anim.time += deltaTime;
        var flickerAmount = Math.sin(anim.time * 8) * 0.15;
        anim.object.position.y = anim.baseY + flickerAmount;
        anim.object.scale.y = 0.8 + Math.sin(anim.time * 10) * 0.2;
      }

      if (anim.type === 'rotate') {
        anim.object.rotation[anim.axis] += anim.speed;
      }

      if (anim.type === 'ripple') {
        anim.time += deltaTime;
        var rippleAmount = Math.sin(anim.time * 3) * 0.2;
        anim.object.position.y = anim.baseY + rippleAmount;
      }

      if (anim.type === 'lift') {
        anim.time += deltaTime;
        var liftAmount = Math.sin(anim.time * 1.5) * anim.range;
        anim.object.position.y = anim.baseY + liftAmount;
      }

      if (anim.type === 'drip') {
        anim.time += deltaTime;
        if (anim.time > 2) {
          anim.time = 0;
          anim.object.position.y = anim.startY;
        } else {
          var dropAmount = Math.max(0, anim.startY - anim.time * 5);
          anim.object.position.y = anim.startY - dropAmount;
        }
      }
    }
  }

  function reset() {
    for (var i = 0; i < sceneObjects.length; i++) {
      scene.remove(sceneObjects[i]);
    }
    sceneObjects = [];
    animations = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
