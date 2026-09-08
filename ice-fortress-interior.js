window.IceFortressInterior = (function() {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var scene = null;
  var camera = null;
  var renderer = null;
  var sceneObjects = [];
  var animationState = {
    warlordNeutralized: false,
    cryoWeaponsDestroyed: 0,
    prisonersFdeed: 0
  };
  var hudCanvas = null;
  var hudContext = null;
  var keyPressLog = [];
  var lastKeyPressTime = 0;

  var THEME_COLOR_ICE_LIGHT = 0xe0f6ff;
  var THEME_COLOR_ICE_BLUE = 0x4da6ff;
  var THEME_COLOR_ICE_DARK = 0x0066cc;
  var THEME_COLOR_EMISSIVE = 0x7fbfff;

  function init(canvasElement) {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: own renderer, was crashing/launching over the main game */

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a4d7a);
    scene.fog = new THREE.Fog(0x1a4d7a, 100, 500);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 30);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    createLighting();
    createSceneObjects();
    createHUD();
    setupEventListeners();
  }

  function createLighting() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 40, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -80;
    directionalLight.shadow.camera.right = 80;
    directionalLight.shadow.camera.top = 80;
    directionalLight.shadow.camera.bottom = -80;
    scene.add(directionalLight);

    var bluePointLight = new THREE.PointLight(0x4da6ff, 1.2, 60);
    bluePointLight.position.set(0, 20, 0);
    scene.add(bluePointLight);
  }

  function createSceneObjects() {
    // 1. Ice floor
    var floorGeometry = new THREE.BoxGeometry(80, 1, 80);
    var floorMaterial = new THREE.MeshStandardMaterial({
      color: THEME_COLOR_ICE_LIGHT,
      emissive: 0x4da6ff,
      emissiveIntensity: 0.15,
      roughness: 0.2,
      metalness: 0.3
    });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    floor.castShadow = true;
    scene.add(floor);
    sceneObjects.push(floor);

    // 2. Ice walls (4 walls)
    var wallGeometry = new THREE.BoxGeometry(80, 40, 1);
    var wallMaterial = new THREE.MeshStandardMaterial({
      color: THEME_COLOR_ICE_BLUE,
      emissive: THEME_COLOR_EMISSIVE,
      emissiveIntensity: 0.2,
      roughness: 0.3,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85
    });

    var wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall1.position.z = -40;
    wall1.position.y = 20;
    wall1.castShadow = true;
    scene.add(wall1);
    sceneObjects.push(wall1);

    var wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall2.position.z = 40;
    wall2.position.y = 20;
    wall2.castShadow = true;
    scene.add(wall2);
    sceneObjects.push(wall2);

    var wall3 = new THREE.Mesh(new THREE.BoxGeometry(1, 40, 80), wallMaterial);
    wall3.position.x = -40;
    wall3.position.y = 20;
    wall3.castShadow = true;
    scene.add(wall3);
    sceneObjects.push(wall3);

    var wall4 = new THREE.Mesh(new THREE.BoxGeometry(1, 40, 80), wallMaterial);
    wall4.position.x = 40;
    wall4.position.y = 20;
    wall4.castShadow = true;
    scene.add(wall4);
    sceneObjects.push(wall4);

    // 3. Frozen throne
    var throneBase = new THREE.Mesh(
      new THREE.BoxGeometry(12, 3, 12),
      new THREE.MeshStandardMaterial({
        color: THEME_COLOR_ICE_BLUE,
        emissive: THEME_COLOR_EMISSIVE,
        emissiveIntensity: 0.3,
        roughness: 0.2
      })
    );
    throneBase.position.set(0, 2, -20);
    throneBase.castShadow = true;
    scene.add(throneBase);
    sceneObjects.push(throneBase);

    var throneSeat = new THREE.Mesh(
      new THREE.BoxGeometry(8, 2, 8),
      new THREE.MeshStandardMaterial({
        color: THEME_COLOR_ICE_LIGHT,
        emissive: THEME_COLOR_EMISSIVE,
        emissiveIntensity: 0.4,
        roughness: 0.15
      })
    );
    throneSeat.position.set(0, 5, -20);
    throneSeat.castShadow = true;
    scene.add(throneSeat);
    sceneObjects.push(throneSeat);

    var throneBack = new THREE.Mesh(
      new THREE.BoxGeometry(10, 12, 2),
      new THREE.MeshStandardMaterial({
        color: THEME_COLOR_ICE_BLUE,
        emissive: THEME_COLOR_EMISSIVE,
        emissiveIntensity: 0.35,
        roughness: 0.2
      })
    );
    throneBack.position.set(0, 10, -26);
    throneBack.castShadow = true;
    scene.add(throneBack);
    sceneObjects.push(throneBack);

    // 4. Ice pillars (6 tall cylinders)
    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var x = Math.cos(angle) * 25;
      var z = Math.sin(angle) * 25;

      var pillarGeometry = new THREE.CylinderGeometry(2, 2.5, 35, 16);
      var pillarMaterial = new THREE.MeshStandardMaterial({
        color: THEME_COLOR_ICE_LIGHT,
        emissive: THEME_COLOR_EMISSIVE,
        emissiveIntensity: 0.25,
        roughness: 0.2,
        metalness: 0.1
      });
      var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(x, 17.5, z);
      pillar.castShadow = true;
      scene.add(pillar);
      sceneObjects.push(pillar);
    }

    // 5. Cryogenic weapon pods (4 cylinders with weapons)
    for (var i = 0; i < 4; i++) {
      var podX = (i % 2) * 20 - 10;
      var podZ = Math.floor(i / 2) * 20 - 10;

      var podGeometry = new THREE.CylinderGeometry(3, 3, 15, 8);
      var podMaterial = new THREE.MeshStandardMaterial({
        color: THEME_COLOR_ICE_DARK,
        emissive: 0xff00ff,
        emissiveIntensity: 0.4,
        roughness: 0.25
      });
      var pod = new THREE.Mesh(podGeometry, podMaterial);
      pod.position.set(podX, 10, podZ);
      pod.castShadow = true;
      scene.add(pod);
      sceneObjects.push(pod);
    }

    // 6. Ice stalactites (hanging cones)
    for (var i = 0; i < 8; i++) {
      var staleX = (Math.random() - 0.5) * 60;
      var staleZ = (Math.random() - 0.5) * 60;

      var coneGeometry = new THREE.ConeGeometry(1.5, 6, 8);
      var coneMaterial = new THREE.MeshStandardMaterial({
        color: THEME_COLOR_ICE_LIGHT,
        emissive: THEME_COLOR_EMISSIVE,
        emissiveIntensity: 0.2,
        roughness: 0.25
      });
      var cone = new THREE.Mesh(coneGeometry, coneMaterial);
      cone.position.set(staleX, 38, staleZ);
      cone.castShadow = true;
      scene.add(cone);
      sceneObjects.push(cone);
    }

    // 7. Frozen prisoners (box + sphere in ice)
    for (var i = 0; i < 3; i++) {
      var prisonerX = -20 + i * 20;
      var prisonerZ = 15;

      // Ice block around prisoner
      var iceBlockGeometry = new THREE.BoxGeometry(4, 8, 4);
      var iceBlockMaterial = new THREE.MeshStandardMaterial({
        color: THEME_COLOR_ICE_BLUE,
        emissive: 0x0099ff,
        emissiveIntensity: 0.2,
        roughness: 0.3,
        transparent: true,
        opacity: 0.7
      });
      var iceBlock = new THREE.Mesh(iceBlockGeometry, iceBlockMaterial);
      iceBlock.position.set(prisonerX, 4, prisonerZ);
      iceBlock.castShadow = true;
      scene.add(iceBlock);
      sceneObjects.push(iceBlock);

      // Prisoner figure inside
      var prisonerBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 3, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x8b4513 })
      );
      prisonerBody.position.set(prisonerX, 4.5, prisonerZ);
      scene.add(prisonerBody);
      sceneObjects.push(prisonerBody);

      var prisonerHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xc9a876 })
      );
      prisonerHead.position.set(prisonerX, 7, prisonerZ);
      scene.add(prisonerHead);
      sceneObjects.push(prisonerHead);
    }

    // 8. Arctic warlord figure
    var warlordBodyGeometry = new THREE.BoxGeometry(3, 5, 2);
    var warlordMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d5a3d,
      emissive: 0x4da6ff,
      emissiveIntensity: 0.2
    });
    var warlordBody = new THREE.Mesh(warlordBodyGeometry, warlordMaterial);
    warlordBody.position.set(0, 3, -20);
    warlordBody.castShadow = true;
    scene.add(warlordBody);
    sceneObjects.push(warlordBody);

    var warlordHead = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xc9a876,
        emissive: 0x4da6ff,
        emissiveIntensity: 0.1
      })
    );
    warlordHead.position.set(0, 7.5, -20);
    warlordHead.castShadow = true;
    scene.add(warlordHead);
    sceneObjects.push(warlordHead);

    // Fur shoulders (extra box layers)
    var furMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.8
    });
    var furLeft = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 3), furMaterial);
    furLeft.position.set(-2.5, 5.5, -20);
    scene.add(furLeft);
    sceneObjects.push(furLeft);

    var furRight = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 3), furMaterial);
    furRight.position.set(2.5, 5.5, -20);
    scene.add(furRight);
    sceneObjects.push(furRight);

    // 9. Guard soldiers (5 ice-armor guards)
    for (var i = 0; i < 5; i++) {
      var guardAngle = (i / 5) * Math.PI * 2;
      var guardX = Math.cos(guardAngle) * 15;
      var guardZ = Math.sin(guardAngle) * 15;

      var guardBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 4, 1),
        new THREE.MeshStandardMaterial({
          color: THEME_COLOR_ICE_BLUE,
          emissive: THEME_COLOR_EMISSIVE,
          emissiveIntensity: 0.2,
          roughness: 0.25
        })
      );
      guardBody.position.set(guardX, 2.5, guardZ);
      guardBody.castShadow = true;
      scene.add(guardBody);
      sceneObjects.push(guardBody);

      var guardHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xc9a876,
          emissive: 0x4da6ff,
          emissiveIntensity: 0.1
        })
      );
      guardHead.position.set(guardX, 5.5, guardZ);
      guardHead.castShadow = true;
      scene.add(guardHead);
      sceneObjects.push(guardHead);
    }

    // 10. Crystal chandelier
    var chandelierCenterGeometry = new THREE.SphereGeometry(2, 16, 16);
    var chandelierMaterial = new THREE.MeshStandardMaterial({
      color: THEME_COLOR_EMISSIVE,
      emissive: THEME_COLOR_EMISSIVE,
      emissiveIntensity: 0.5,
      roughness: 0.1,
      metalness: 0.8
    });
    var chandelierCenter = new THREE.Mesh(chandelierCenterGeometry, chandelierMaterial);
    chandelierCenter.position.set(0, 30, 0);
    scene.add(chandelierCenter);
    sceneObjects.push(chandelierCenter);

    // Chandelier arms with LineSegments
    var chandelierGeometry = new THREE.BufferGeometry();
    var chandelierPoints = [];
    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      chandelierPoints.push(new THREE.Vector3(0, 30, 0));
      chandelierPoints.push(new THREE.Vector3(
        Math.cos(angle) * 8,
        25,
        Math.sin(angle) * 8
      ));
    }
    chandelierGeometry.setFromPoints(chandelierPoints);
    var chandelierLines = new THREE.LineSegments(
      chandelierGeometry,
      new THREE.LineBasicMaterial({ color: THEME_COLOR_EMISSIVE, linewidth: 2 })
    );
    scene.add(chandelierLines);
    sceneObjects.push(chandelierLines);

    // 11. Cryo-weapon rack
    var rackGeometry = new THREE.BoxGeometry(20, 10, 3);
    var rackMaterial = new THREE.MeshStandardMaterial({
      color: THEME_COLOR_ICE_DARK,
      emissive: 0x0066cc,
      emissiveIntensity: 0.15,
      roughness: 0.3
    });
    var weaponRack = new THREE.Mesh(rackGeometry, rackMaterial);
    weaponRack.position.set(20, 6, 0);
    weaponRack.castShadow = true;
    scene.add(weaponRack);
    sceneObjects.push(weaponRack);

    // Weapon tubes on rack
    for (var i = 0; i < 4; i++) {
      var tubeGeometry = new THREE.CylinderGeometry(0.8, 0.8, 8, 6);
      var tubeMaterial = new THREE.MeshStandardMaterial({
        color: THEME_COLOR_ICE_BLUE,
        emissive: 0xff00ff,
        emissiveIntensity: 0.3,
        roughness: 0.2
      });
      var tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      tube.position.set(15 + i * 1.5, 6, 0);
      tube.castShadow = true;
      scene.add(tube);
      sceneObjects.push(tube);
    }

    // 12. Ice tunnel entrance (box arch)
    var archLeftGeometry = new THREE.BoxGeometry(2, 15, 2);
    var archMaterial = new THREE.MeshStandardMaterial({
      color: THEME_COLOR_ICE_BLUE,
      emissive: THEME_COLOR_EMISSIVE,
      emissiveIntensity: 0.25,
      roughness: 0.2
    });
    var archLeft = new THREE.Mesh(archLeftGeometry, archMaterial);
    archLeft.position.set(-8, 8, 35);
    archLeft.castShadow = true;
    scene.add(archLeft);
    sceneObjects.push(archLeft);

    var archRight = new THREE.Mesh(archLeftGeometry, archMaterial);
    archRight.position.set(8, 8, 35);
    archRight.castShadow = true;
    scene.add(archRight);
    sceneObjects.push(archRight);

    var archTop = new THREE.Mesh(new THREE.BoxGeometry(18, 2, 2), archMaterial);
    archTop.position.set(0, 17, 35);
    archTop.castShadow = true;
    scene.add(archTop);
    sceneObjects.push(archTop);

    // 13. Treasure chest cluster
    for (var i = 0; i < 3; i++) {
      var chestX = -10 + i * 10;
      var chestGeometry = new THREE.BoxGeometry(4, 3, 4);
      var chestMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        roughness: 0.8
      });
      var chest = new THREE.Mesh(chestGeometry, chestMaterial);
      chest.position.set(chestX, 2, 25);
      chest.castShadow = true;
      scene.add(chest);
      sceneObjects.push(chest);

      // Chest lid with glow
      var lidGeometry = new THREE.BoxGeometry(4, 1, 4);
      var lidMaterial = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xff8800,
        emissiveIntensity: 0.3,
        roughness: 0.4
      });
      var lid = new THREE.Mesh(lidGeometry, lidMaterial);
      lid.position.set(chestX, 4.5, 25);
      lid.castShadow = true;
      scene.add(lid);
      sceneObjects.push(lid);
    }

    // 14. Blizzard effect (semi-transparent sphere particles)
    var particleGroup = new THREE.Group();
    for (var i = 0; i < 20; i++) {
      var particleGeometry = new THREE.SphereGeometry(0.3, 4, 4);
      var particleMaterial = new THREE.MeshStandardMaterial({
        color: THEME_COLOR_ICE_LIGHT,
        emissive: THEME_COLOR_EMISSIVE,
        emissiveIntensity: 0.15,
        transparent: true,
        opacity: 0.6
      });
      var particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(
        (Math.random() - 0.5) * 80,
        Math.random() * 40,
        (Math.random() - 0.5) * 80
      );
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        -0.05,
        (Math.random() - 0.5) * 0.1
      );
      particleGroup.add(particle);
    }
    scene.add(particleGroup);
    sceneObjects.push(particleGroup);

    // 15. Torch sconces (cylinder posts + emissive sphere fire)
    for (var i = 0; i < 4; i++) {
      var torchCorner = i;
      var torchX = (torchCorner % 2) * 70 - 35;
      var torchZ = Math.floor(torchCorner / 2) * 70 - 35;

      var torchPostGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 6);
      var torchPostMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        roughness: 0.8
      });
      var torchPost = new THREE.Mesh(torchPostGeometry, torchPostMaterial);
      torchPost.position.set(torchX, 4, torchZ);
      torchPost.castShadow = true;
      scene.add(torchPost);
      sceneObjects.push(torchPost);

      // Torch fire (blue-white emissive)
      var flameGeometry = new THREE.SphereGeometry(1.2, 8, 8);
      var flameMaterial = new THREE.MeshStandardMaterial({
        color: 0x87ceeb,
        emissive: 0x7fbfff,
        emissiveIntensity: 0.6,
        roughness: 0.3
      });
      var flame = new THREE.Mesh(flameGeometry, flameMaterial);
      flame.position.set(torchX, 9, torchZ);
      scene.add(flame);
      sceneObjects.push(flame);
    }

    // 16. Map table
    var tableGeometry = new THREE.BoxGeometry(15, 1, 10);
    var tableMaterial = new THREE.MeshStandardMaterial({
      color: THEME_COLOR_ICE_BLUE,
      emissive: 0x0099ff,
      emissiveIntensity: 0.2,
      roughness: 0.25
    });
    var mapTable = new THREE.Mesh(tableGeometry, tableMaterial);
    mapTable.position.set(-20, 1, 0);
    mapTable.castShadow = true;
    scene.add(mapTable);
    sceneObjects.push(mapTable);

    // Territory grid on table
    var gridGeometry = new THREE.BufferGeometry();
    var gridPoints = [];
    for (var x = -7; x <= 7; x += 2) {
      gridPoints.push(new THREE.Vector3(x - 20, 1.2, -5));
      gridPoints.push(new THREE.Vector3(x - 20, 1.2, 5));
    }
    for (var z = -5; z <= 5; z += 2) {
      gridPoints.push(new THREE.Vector3(-27, 1.2, z));
      gridPoints.push(new THREE.Vector3(-13, 1.2, z));
    }
    gridGeometry.setFromPoints(gridPoints);
    var gridLines = new THREE.LineSegments(
      gridGeometry,
      new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 1 })
    );
    scene.add(gridLines);
    sceneObjects.push(gridLines);

    // 17. Signal mirror (flat box, emissive flashing)
    var mirrorGeometry = new THREE.BoxGeometry(3, 3, 0.2);
    var mirrorMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.4,
      roughness: 0.1,
      metalness: 0.9
    });
    var signalMirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
    signalMirror.position.set(25, 15, -20);
    signalMirror.rotation.y = Math.PI / 4;
    signalMirror.castShadow = true;
    scene.add(signalMirror);
    sceneObjects.push(signalMirror);
  }

  function createHUD() {
    hudCanvas = document.createElement('canvas');
    hudCanvas.width = window.innerWidth;
    hudCanvas.height = window.innerHeight;
    hudCanvas.style.position = 'absolute';
    hudCanvas.style.top = '0';
    hudCanvas.style.left = '0';
    hudCanvas.style.pointerEvents = 'none';
    document.body.appendChild(hudCanvas);

    hudContext = hudCanvas.getContext('2d');
  }

  function updateHUD() {
    hudContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
    hudContext.fillRect(0, 0, hudCanvas.width, hudCanvas.height);

    hudContext.fillStyle = '#7fbfff';
    hudContext.font = 'bold 24px Arial';

    var hudTexts = [
      'WARLORD NEUTRALIZED: ' + (animationState.warlordNeutralized ? 'YES' : 'NO'),
      'CRYO WEAPONS DESTROYED: ' + animationState.cryoWeaponsDestroyed + '/4',
      'PRISONERS FREED: ' + animationState.prisonersFdeed + '/3'
    ];

    for (var i = 0; i < hudTexts.length; i++) {
      hudContext.fillText(hudTexts[i], 20, 40 + i * 40);
    }

    hudContext.font = 'bold 16px Arial';
    hudContext.fillText('Press I then F to toggle HUD', 20, hudCanvas.height - 20);
  }

  function setupEventListeners() {
    window.addEventListener('keydown', function(e) {
      var key = e.key.toUpperCase();
      var now = Date.now();

      if (now - lastKeyPressTime > 400) {
        keyPressLog = [key];
      } else {
        keyPressLog.push(key);
      }

      lastKeyPressTime = now;

      if (keyPressLog.length >= 2 && keyPressLog[keyPressLog.length - 2] === 'I' && keyPressLog[keyPressLog.length - 1] === 'F') {
        animationState.cryoWeaponsDestroyed = animationState.cryoWeaponsDestroyed < 4
          ? animationState.cryoWeaponsDestroyed + 1
          : 0;
      }
    });

    window.addEventListener('resize', function() {
      var width = window.innerWidth;
      var height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      hudCanvas.width = width;
      hudCanvas.height = height;
    });
  }

  function update() {
    // Animate ice pillars with pulsing glow
    for (var i = 1; i <= 6; i++) {
      if (sceneObjects[i]) {
        var pulse = Math.sin(Date.now() * 0.003) * 0.15 + 0.25;
        sceneObjects[i].material.emissiveIntensity = pulse;
      }
    }

    // Blizzard particles drift
    if (sceneObjects[sceneObjects.length - 6]) {
      var particleGroup = sceneObjects[sceneObjects.length - 6];
      particleGroup.children.forEach(function(particle) {
        particle.position.add(particle.userData.velocity);
        if (particle.position.y < 0) {
          particle.position.y = 40;
        }
        if (Math.abs(particle.position.x) > 50) {
          particle.position.x = (Math.random() - 0.5) * 80;
        }
        if (Math.abs(particle.position.z) > 50) {
          particle.position.z = (Math.random() - 0.5) * 80;
        }
      });
    }

    // Crystal chandelier sways
    if (sceneObjects[sceneObjects.length - 9]) {
      var chandelier = sceneObjects[sceneObjects.length - 9];
      chandelier.position.x = Math.sin(Date.now() * 0.001) * 2;
      chandelier.position.z = Math.cos(Date.now() * 0.001) * 1.5;
    }

    // Torch flames flicker
    var torchStartIndex = sceneObjects.length - 8;
    for (var i = 0; i < 4; i++) {
      var flameIdx = torchStartIndex + i;
      if (sceneObjects[flameIdx]) {
        var flicker = Math.random() * 0.3 + 0.4;
        sceneObjects[flameIdx].material.emissiveIntensity = flicker;
      }
    }

    // Signal mirror flash
    if (sceneObjects[sceneObjects.length - 1]) {
      var mirror = sceneObjects[sceneObjects.length - 1];
      var flashIntensity = Math.sin(Date.now() * 0.004) * 0.3 + 0.4;
      mirror.material.emissiveIntensity = Math.max(0, flashIntensity);
    }

    updateHUD();

    if (renderer) renderer.render(scene, camera);
  }

  function reset() {
    while (sceneObjects.length > 0) {
      var obj = sceneObjects.pop();
      if (obj && obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj && obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) { mat.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
      if (obj && obj.parent) {
        obj.parent.remove(obj);
      }
    }

    animationState = {
      warlordNeutralized: false,
      cryoWeaponsDestroyed: 0,
      prisonersFdeed: 0
    };
    keyPressLog = [];
    lastKeyPressTime = 0;

    if (hudCanvas && hudCanvas.parentNode) {
      hudCanvas.parentNode.removeChild(hudCanvas);
    }
    hudCanvas = null;
    hudContext = null;

    scene = null;
    camera = null;
    renderer = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
