window.HauntedGalleon = (function() {
  'use strict';

  var scene, camera, renderer, canvas;
  var ship, ghostCrew = [], fogSpheres = [], emissiveObjects = [];
  var shipGroup, ghostsGroup, fogGroup;
  var keysPressed = {};
  var lastKeyTime = 0;
  var hudVisible = true;
  var spectresBanished = 0;
  var treasureSecured = false;
  var hudCanvas, hudContext;
  var animations = [];

  function init(container) {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.02);

    // Camera setup
    camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      10000
    );
    camera.position.set(0, 20, 50);
    camera.lookAt(0, 10, 0);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    container.appendChild(renderer.domElement);

    canvas = renderer.domElement;

    // Lighting
    var ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0x666666, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    var pointLight = new THREE.PointLight(0x00ff00, 0.5, 200);
    pointLight.position.set(-30, 20, -40);
    scene.add(pointLight);

    // Groups
    shipGroup = new THREE.Group();
    ghostsGroup = new THREE.Group();
    fogGroup = new THREE.Group();
    scene.add(shipGroup);
    scene.add(ghostsGroup);
    scene.add(fogGroup);

    // Build ship objects
    buildShipHull();
    buildMainDeck();
    buildMizzenmast();
    buildForemast();
    buildTornSails();
    buildCrowsNest();
    buildShipsWheel();
    buildCannonBattery();
    buildTreasureChest();
    buildGhostCrew();
    buildSkeletonCaptain();
    buildFogEffect();
    buildAnchor();
    buildCargoHatchOpen();
    buildShipsBell();
    buildCannonballPile();
    buildGhostFireLanterns();

    // HUD Canvas
    setupHUD(container);

    // Keyboard input
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);

    // Start animation loop
    animate();
  }

  function buildShipHull() {
    var hullGeometry = new THREE.BoxGeometry(20, 15, 60);
    var hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      roughness: 0.9,
      metalness: 0.1
    });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.y = -5;
    hull.castShadow = true;
    hull.receiveShadow = true;
    shipGroup.add(hull);
  }

  function buildMainDeck() {
    var deckGeometry = new THREE.BoxGeometry(18, 1, 55);
    var deckMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d1f0f,
      roughness: 0.95,
      metalness: 0.05
    });
    var deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.y = 8;
    deck.castShadow = true;
    deck.receiveShadow = true;
    shipGroup.add(deck);

    // Planking with LineSegments
    var plankingGeometry = new THREE.BufferGeometry();
    var plankVertices = [];
    for (var i = 0; i < 6; i++) {
      var yPos = 8 + (i - 2.5) * 0.3;
      plankVertices.push(-9, yPos, -27.5);
      plankVertices.push(9, yPos, -27.5);
    }
    plankingGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(plankVertices), 3));
    var plankingMaterial = new THREE.LineBasicMaterial({ color: 0x1a0f00, linewidth: 2 });
    var planking = new THREE.LineSegments(plankingGeometry, plankingMaterial);
    shipGroup.add(planking);
  }

  function buildMizzenmast() {
    var mastGeometry = new THREE.CylinderGeometry(0.8, 0.8, 40, 8);
    var mastMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a0f00,
      roughness: 0.8,
      metalness: 0.2
    });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(0, 25, 10);
    mast.castShadow = true;
    mast.receiveShadow = true;
    shipGroup.add(mast);

    // Rigging
    var riggingGeometry = new THREE.BufferGeometry();
    var riggingVertices = [];
    for (var i = 0; i < 4; i++) {
      var angle = (Math.PI * 2 / 4) * i;
      var x = Math.cos(angle) * 3;
      var z = Math.sin(angle) * 3;
      riggingVertices.push(0, 20, 10);
      riggingVertices.push(x, 10, 10 + z);
    }
    riggingGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(riggingVertices), 3));
    var riggingMaterial = new THREE.LineBasicMaterial({ color: 0x444444 });
    var rigging = new THREE.LineSegments(riggingGeometry, riggingMaterial);
    shipGroup.add(rigging);
  }

  function buildForemast() {
    var mastGeometry = new THREE.CylinderGeometry(0.6, 0.6, 35, 8);
    var mastMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a0f00,
      roughness: 0.8,
      metalness: 0.2
    });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(0, 23, -20);
    mast.castShadow = true;
    mast.receiveShadow = true;
    shipGroup.add(mast);

    var riggingGeometry = new THREE.BufferGeometry();
    var riggingVertices = [];
    for (var i = 0; i < 4; i++) {
      var angle = (Math.PI * 2 / 4) * i;
      var x = Math.cos(angle) * 2.5;
      var z = Math.sin(angle) * 2.5;
      riggingVertices.push(0, 18, -20);
      riggingVertices.push(x, 8, -20 + z);
    }
    riggingGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(riggingVertices), 3));
    var riggingMaterial = new THREE.LineBasicMaterial({ color: 0x444444 });
    var rigging = new THREE.LineSegments(riggingGeometry, riggingMaterial);
    shipGroup.add(rigging);
  }

  function buildTornSails() {
    var sail1Geometry = new THREE.BoxGeometry(1, 20, 15);
    var sailMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.8,
      metalness: 0,
      side: THREE.DoubleSide
    });
    var sail1 = new THREE.Mesh(sail1Geometry, sailMaterial);
    sail1.position.set(5, 20, 10);
    sail1.rotation.z = 0.3;
    sail1.castShadow = true;
    sail1.receiveShadow = true;
    shipGroup.add(sail1);

    var sail2 = new THREE.Mesh(sail1Geometry, sailMaterial);
    sail2.position.set(-5, 20, 10);
    sail2.rotation.z = -0.3;
    sail2.castShadow = true;
    sail2.receiveShadow = true;
    shipGroup.add(sail2);

    var sail3Geometry = new THREE.BoxGeometry(1, 18, 12);
    var sail3 = new THREE.Mesh(sail3Geometry, sailMaterial);
    sail3.position.set(4, 18, -20);
    sail3.rotation.z = 0.25;
    sail3.castShadow = true;
    sail3.receiveShadow = true;
    shipGroup.add(sail3);

    var sail4 = new THREE.Mesh(sail3Geometry, sailMaterial);
    sail4.position.set(-4, 18, -20);
    sail4.rotation.z = -0.25;
    sail4.castShadow = true;
    sail4.receiveShadow = true;
    shipGroup.add(sail4);

    animations.push({
      target: sail1,
      property: 'rotation.z',
      start: 0.3,
      end: 0.5,
      duration: 3
    });
    animations.push({
      target: sail2,
      property: 'rotation.z',
      start: -0.3,
      end: -0.5,
      duration: 3
    });
  }

  function buildCrowsNest() {
    var nestGeometry = new THREE.CylinderGeometry(2, 2, 1, 8);
    var nestMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d1f0f,
      roughness: 0.8
    });
    var nest = new THREE.Mesh(nestGeometry, nestMaterial);
    nest.position.set(0, 42, 10);
    nest.castShadow = true;
    nest.receiveShadow = true;
    shipGroup.add(nest);

    var railGeometry = new THREE.BoxGeometry(4, 1.5, 4);
    var railMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a0f00,
      roughness: 0.8
    });
    var rail = new THREE.Mesh(railGeometry, railMaterial);
    rail.position.set(0, 42.5, 10);
    rail.castShadow = true;
    rail.receiveShadow = true;
    shipGroup.add(rail);
  }

  function buildShipsWheel() {
    var hubGeometry = new THREE.CylinderGeometry(1, 1, 0.5, 16);
    var hubMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a0f00,
      roughness: 0.7
    });
    var hub = new THREE.Mesh(hubGeometry, hubMaterial);
    hub.position.set(0, 9, 25);
    hub.rotation.z = Math.PI / 2;
    hub.castShadow = true;
    hub.receiveShadow = true;
    shipGroup.add(hub);

    var spokeGeometry = new THREE.BufferGeometry();
    var spokeVertices = [];
    for (var i = 0; i < 6; i++) {
      var angle = (Math.PI * 2 / 6) * i;
      var x = Math.cos(angle) * 3.5;
      var z = Math.sin(angle) * 3.5;
      spokeVertices.push(0, 9, 25);
      spokeVertices.push(x, 9, 25 + z);
    }
    spokeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(spokeVertices), 3));
    var spokeMaterial = new THREE.LineBasicMaterial({ color: 0x3d2817, linewidth: 3 });
    var spokes = new THREE.LineSegments(spokeGeometry, spokeMaterial);
    shipGroup.add(spokes);

    animations.push({
      target: hub,
      type: 'rotation',
      axis: 'z',
      speed: 0.02
    });
  }

  function buildCannonBattery() {
    for (var i = 0; i < 4; i++) {
      var yPos = 5 + i * 2.5;
      var side = i < 2 ? -1 : 1;
      var xPos = side * 8;

      var cannonGeometry = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
      var cannonMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.6,
        metalness: 0.7
      });
      var cannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
      cannon.rotation.z = Math.PI / 2;
      cannon.position.set(xPos, yPos, -15 + (i % 2) * 10);
      cannon.castShadow = true;
      cannon.receiveShadow = true;
      shipGroup.add(cannon);
    }
  }

  function buildTreasureChest() {
    for (var i = 0; i < 3; i++) {
      var chestGeometry = new THREE.BoxGeometry(3, 2, 2);
      var chestMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b6914,
        roughness: 0.5,
        metalness: 0.6,
        emissive: 0xffd700,
        emissiveIntensity: 0.3
      });
      var chest = new THREE.Mesh(chestGeometry, chestMaterial);
      chest.position.set(-8 + i * 3, 9, 15);
      chest.castShadow = true;
      chest.receiveShadow = true;
      shipGroup.add(chest);
      emissiveObjects.push(chest);
    }
  }

  function buildGhostCrew() {
    for (var i = 0; i < 6; i++) {
      var angle = (Math.PI * 2 / 6) * i;
      var x = Math.cos(angle) * 10;
      var z = Math.sin(angle) * 10;

      var bodyGeometry = new THREE.BoxGeometry(1, 3, 1);
      var ghostMaterial = new THREE.MeshStandardMaterial({
        color: 0x0066ff,
        emissive: 0x0099ff,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.7,
        roughness: 0.5,
        metalness: 0.3
      });
      var body = new THREE.Mesh(bodyGeometry, ghostMaterial);
      body.position.y = 10;
      body.castShadow = true;
      body.receiveShadow = true;

      var headGeometry = new THREE.SphereGeometry(0.7, 8, 8);
      var head = new THREE.Mesh(headGeometry, ghostMaterial);
      head.position.y = 2.2;
      body.add(head);

      var ghostGroup = new THREE.Group();
      ghostGroup.add(body);
      ghostGroup.position.set(x, 0, z);
      ghostsGroup.add(ghostGroup);
      ghostCrew.push({
        group: ghostGroup,
        body: body,
        floatOffset: Math.random() * Math.PI * 2
      });
      emissiveObjects.push(body);
      emissiveObjects.push(head);
    }
  }

  function buildSkeletonCaptain() {
    var bodyGeometry = new THREE.BoxGeometry(1.2, 3.5, 1);
    var captainMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7,
      metalness: 0.2
    });
    var body = new THREE.Mesh(bodyGeometry, captainMaterial);
    body.position.set(0, 10, -25);
    body.castShadow = true;
    body.receiveShadow = true;
    ghostsGroup.add(body);

    var skullGeometry = new THREE.SphereGeometry(0.9, 8, 8);
    var skullMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.8,
      metalness: 0.1
    });
    var skull = new THREE.Mesh(skullGeometry, skullMaterial);
    skull.position.y = 2.2;
    body.add(skull);

    var armGeometry = new THREE.BoxGeometry(0.4, 2.5, 0.4);
    var armMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.6,
      metalness: 0.5
    });
    var arm = new THREE.Mesh(armGeometry, armMaterial);
    arm.position.set(0.7, 1, 0);
    body.add(arm);

    animations.push({
      target: arm,
      type: 'armWave',
      property: 'rotation.z',
      start: -0.3,
      end: 0.5,
      duration: 2
    });
  }

  function buildFogEffect() {
    for (var i = 0; i < 12; i++) {
      var fogGeometry = new THREE.SphereGeometry(15 + Math.random() * 20, 4, 4);
      var fogMaterial = new THREE.MeshBasicMaterial({
        color: 0x444455,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
      });
      var fog = new THREE.Mesh(fogGeometry, fogMaterial);
      fog.position.set(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 40 + 15,
        (Math.random() - 0.5) * 100
      );
      fogGroup.add(fog);
      fogSpheres.push({
        mesh: fog,
        rotationSpeed: (Math.random() - 0.5) * 0.0005
      });
    }
  }

  function buildAnchor() {
    var chainGeometry = new THREE.CylinderGeometry(0.3, 0.3, 20, 6);
    var chainMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.6,
      metalness: 0.8
    });
    var chain = new THREE.Mesh(chainGeometry, chainMaterial);
    chain.position.set(-12, 8, 20);
    chain.castShadow = true;
    chain.receiveShadow = true;
    shipGroup.add(chain);

    var anchorGeometry = new THREE.BoxGeometry(2, 0.5, 2);
    var anchorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.5,
      metalness: 0.9
    });
    var anchor = new THREE.Mesh(anchorGeometry, anchorMaterial);
    anchor.position.set(-12, -2, 20);
    anchor.castShadow = true;
    anchor.receiveShadow = true;
    shipGroup.add(anchor);
  }

  function buildCargoHatchOpen() {
    var hatchGeometry = new THREE.BoxGeometry(6, 0.5, 8);
    var hatchMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d1f0f,
      roughness: 0.9
    });
    var hatch = new THREE.Mesh(hatchGeometry, hatchMaterial);
    hatch.position.set(0, 8.3, -15);
    hatch.rotation.z = 0.4;
    hatch.castShadow = true;
    hatch.receiveShadow = true;
    shipGroup.add(hatch);
  }

  function buildShipsBell() {
    var bellGeometry = new THREE.CylinderGeometry(1.5, 1.8, 2, 16);
    var bellMaterial = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      emissive: 0xff6600,
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.9
    });
    var bell = new THREE.Mesh(bellGeometry, bellMaterial);
    bell.position.set(0, 30, 28);
    bell.castShadow = true;
    bell.receiveShadow = true;
    shipGroup.add(bell);
    emissiveObjects.push(bell);

    animations.push({
      target: bell,
      type: 'ring',
      property: 'rotation.z',
      amplitude: 0.2,
      duration: 2
    });
  }

  function buildCannonballPile() {
    var ballMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.7,
      metalness: 0.6
    });
    for (var i = 0; i < 12; i++) {
      var ballGeometry = new THREE.SphereGeometry(0.6, 8, 8);
      var ball = new THREE.Mesh(ballGeometry, ballMaterial);
      ball.position.set(
        -6 + (i % 4) * 1.3,
        9 + Math.floor(i / 4) * 1.3,
        8
      );
      ball.castShadow = true;
      ball.receiveShadow = true;
      shipGroup.add(ball);
    }
  }

  function buildGhostFireLanterns() {
    for (var i = 0; i < 4; i++) {
      var lanternGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
      var lanternMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.8
      });
      var lantern = new THREE.Mesh(lanternGeometry, lanternMaterial);
      var sideX = i < 2 ? -10 : 10;
      var sideZ = -25 + (i % 2) * 30;
      lantern.position.set(sideX, 12, sideZ);
      lantern.castShadow = true;
      lantern.receiveShadow = true;
      shipGroup.add(lantern);

      var flameGeometry = new THREE.SphereGeometry(0.8, 8, 8);
      var flameMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.8
      });
      var flame = new THREE.Mesh(flameGeometry, flameMaterial);
      flame.position.y = 1.2;
      lantern.add(flame);
      emissiveObjects.push(flame);

      animations.push({
        target: flame,
        type: 'flicker',
        property: 'material.emissiveIntensity',
        min: 0.4,
        max: 0.9,
        speed: 0.05
      });
    }
  }

  function setupHUD(container) {
    hudCanvas = document.createElement('canvas');
    hudCanvas.width = 300;
    hudCanvas.height = 150;
    hudContext = hudCanvas.getContext('2d');

    var hudDiv = document.createElement('div');
    hudDiv.id = 'hud-container';
    hudDiv.style.position = 'absolute';
    hudDiv.style.top = '10px';
    hudDiv.style.left = '10px';
    hudDiv.style.fontFamily = 'monospace';
    hudDiv.style.fontSize = '16px';
    hudDiv.style.color = '#00ff00';
    hudDiv.style.textShadow = '0 0 10px #00ff00';
    hudDiv.style.zIndex = '1000';
    hudDiv.style.display = hudVisible ? 'block' : 'none';
    container.appendChild(hudDiv);

    function updateHUD() {
      hudDiv.innerHTML = 'SPECTRES BANISHED: ' + spectresBanished + '/6<br>' +
        'TREASURE SECURED: ' + (treasureSecured ? 'YES' : 'NO') + '<br>' +
        'CURSE: ' + (spectresBanished >= 6 ? 'BROKEN' : 'ACTIVE');
    }

    updateHUD();
    window.updateHUD = updateHUD;
  }

  function onKeyDown(event) {
    keysPressed[event.key.toUpperCase()] = true;
    var now = Date.now();

    if (event.key.toUpperCase() === 'H' && now - lastKeyTime > 400) {
      lastKeyTime = now;
    } else if (event.key.toUpperCase() === 'G' && keysPressed['H'] && now - lastKeyTime < 400) {
      hudVisible = !hudVisible;
      var hudDiv = document.getElementById('hud-container');
      if (hudDiv) {
        hudDiv.style.display = hudVisible ? 'block' : 'none';
      }
      lastKeyTime = 0;
      keysPressed = {};
    }
  }

  function onKeyUp(event) {
    keysPressed[event.key.toUpperCase()] = false;
  }

  function onWindowResize() {
    var container = renderer.domElement.parentElement;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  function update() {
    var time = Date.now() * 0.001;

    // Ship rocks on waves
    shipGroup.rotation.z = Math.sin(time * 0.5) * 0.02;
    shipGroup.position.y = Math.sin(time * 0.3) * 0.5;

    // Ghost crew floats and drifts
    for (var i = 0; i < ghostCrew.length; i++) {
      var ghost = ghostCrew[i];
      ghost.group.position.y = 12 + Math.sin(time + ghost.floatOffset) * 2;
      ghost.group.rotation.y += 0.005;
    }

    // Fog swirls
    for (var i = 0; i < fogSpheres.length; i++) {
      var fog = fogSpheres[i];
      fog.mesh.rotation.x += fog.rotationSpeed;
      fog.mesh.rotation.y += fog.rotationSpeed * 0.7;
    }

    // Process animations
    for (var i = 0; i < animations.length; i++) {
      var anim = animations[i];

      if (anim.type === 'rotation') {
        if (anim.axis === 'z') {
          anim.target.rotation.z += anim.speed;
        }
      } else if (anim.type === 'armWave') {
        anim.target.rotation.z = Math.sin(time * 0.5) * 0.4;
      } else if (anim.type === 'ring') {
        anim.target.rotation.z = Math.sin(time) * anim.amplitude;
      } else if (anim.type === 'flicker') {
        var baseIntensity = (anim.min + anim.max) / 2;
        var variance = Math.sin(time * 4 + Math.random()) * (anim.max - anim.min) * 0.5;
        if (anim.target.material && anim.target.material.emissiveIntensity !== undefined) {
          anim.target.material.emissiveIntensity = baseIntensity + variance;
        }
      } else {
        // Linear interpolation for simple animations
        var elapsed = (time * 1000) % (anim.duration * 1000);
        var progress = (elapsed / (anim.duration * 1000)) % 1;
        if (progress < 0.5) {
          progress = progress * 2;
          setNestedProperty(anim.target, anim.property, anim.start + (anim.end - anim.start) * progress);
        } else {
          progress = (progress - 0.5) * 2;
          setNestedProperty(anim.target, anim.property, anim.end + (anim.start - anim.end) * progress);
        }
      }
    }

    renderer.render(scene, camera);
  }

  function setNestedProperty(obj, prop, value) {
    var parts = prop.split('.');
    var current = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }

  function animate() {
    requestAnimationFrame(animate);
    update();
  }

  function reset() {
    if (renderer && renderer.domElement.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement);
    }
    if (scene) {
      scene.traverse(function(child) {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
    }
    scene = null;
    camera = null;
    renderer = null;
    ghostCrew = [];
    fogSpheres = [];
    emissiveObjects = [];
    animations = [];
    keysPressed = {};
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', onWindowResize);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
