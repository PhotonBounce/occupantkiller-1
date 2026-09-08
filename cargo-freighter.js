window.CargoFreighter = (function() {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var scene, camera, renderer, canvas;
  var shipObjects = [];
  var crewMembers = [];
  var pirateAttackers = [];
  var craneBooms = [];
  var grappleLines = [];
  var navigationLights = [];
  var animationFrameId;
  var clock;

  var state = {
    piratesRepelled: 0,
    cargoSecure: true,
    maydaySent: false,
    hudVisible: false
  };

  var keybindState = {
    cPressed: false,
    cPressTime: 0,
    fPressed: false
  };

  function init(canvasElement) {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: own renderer, was crashing/launching over the main game */

    canvas = canvasElement;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 500, 2000);

    camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      10000
    );
    camera.position.set(100, 80, 150);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;

    clock = new THREE.Clock();

    createLighting();
    createShip();
    createContainers();
    createBridge();
    createCraneBooms();
    createFunnel();
    createAnchorChain();
    createLifeRings();
    createCrewMembers();
    createPirates();
    createSpeedboat();
    createGrappleLines();
    createHatch();
    createRadarMast();
    createNavigationLights();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleWindowResize);

    animate();
  }

  function createLighting() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(200, 300, 200);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 1000;
    directionalLight.shadow.camera.left = -300;
    directionalLight.shadow.camera.right = 300;
    directionalLight.shadow.camera.top = 300;
    directionalLight.shadow.camera.bottom = -300;
    scene.add(directionalLight);

    var hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x000000, 0.3);
    scene.add(hemisphereLight);
  }

  function createShip() {
    var hullGeometry = new THREE.BoxGeometry(250, 40, 60);
    var hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7,
      metalness: 0.3
    });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.y = -20;
    hull.castShadow = true;
    hull.receiveShadow = true;
    scene.add(hull);
    shipObjects.push(hull);

    var deckGeometry = new THREE.BoxGeometry(250, 2, 60);
    var deckMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.8,
      metalness: 0.2
    });
    var deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.y = 1;
    deck.castShadow = true;
    deck.receiveShadow = true;
    scene.add(deck);
    shipObjects.push(deck);
  }

  function createContainers() {
    var containerColors = [0xFF6B6B, 0x4ECDC4, 0xFFE66D, 0x95E1D3, 0xC7CEEA];
    var containerSize = 12;
    var spacing = 14;

    var portX = -80;
    var starboardX = 80;

    for (var row = 0; row < 3; row++) {
      for (var stack = 0; stack < 3; stack++) {
        var z = -30 + row * spacing;
        var y = 5 + stack * spacing;
        var colorIdx = (row + stack) % containerColors.length;

        var containerGeo = new THREE.BoxGeometry(containerSize, containerSize, containerSize);
        var containerMat = new THREE.MeshStandardMaterial({
          color: containerColors[colorIdx],
          roughness: 0.6,
          metalness: 0.4
        });

        var containerPort = new THREE.Mesh(containerGeo, containerMat);
        containerPort.position.set(portX, y, z);
        containerPort.castShadow = true;
        containerPort.receiveShadow = true;
        scene.add(containerPort);
        shipObjects.push(containerPort);

        var containerStarboard = new THREE.Mesh(containerGeo, containerMat);
        containerStarboard.position.set(starboardX, y, z);
        containerStarboard.castShadow = true;
        containerStarboard.receiveShadow = true;
        scene.add(containerStarboard);
        shipObjects.push(containerStarboard);
      }
    }
  }

  function createBridge() {
    var bridgeGeometry = new THREE.BoxGeometry(50, 60, 40);
    var bridgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.3
    });
    var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.position.set(-95, 40, 0);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    scene.add(bridge);
    shipObjects.push(bridge);

    var windowsGeometry = new THREE.BoxGeometry(40, 15, 5);
    var windowsMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a3a,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x0066ff,
      emissiveIntensity: 0.3
    });
    var windows = new THREE.Mesh(windowsGeometry, windowsMaterial);
    windows.position.set(-95, 50, 22);
    windows.castShadow = true;
    windows.receiveShadow = true;
    scene.add(windows);
    shipObjects.push(windows);
  }

  function createCraneBooms() {
    var cranePositions = [-50, 20];

    cranePositions.forEach(function(xPos) {
      var baseGeometry = new THREE.BoxGeometry(8, 15, 8);
      var baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.6,
        metalness: 0.5
      });
      var base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.set(xPos, 20, 0);
      base.castShadow = true;
      base.receiveShadow = true;
      scene.add(base);
      shipObjects.push(base);

      var boomGeometry = new THREE.BoxGeometry(60, 6, 6);
      var boomMaterial = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        roughness: 0.7,
        metalness: 0.4
      });
      var boom = new THREE.Mesh(boomGeometry, boomMaterial);
      boom.position.set(xPos + 30, 35, 0);
      boom.castShadow = true;
      boom.receiveShadow = true;
      scene.add(boom);
      shipObjects.push(boom);

      craneBooms.push({
        boom: boom,
        basePosition: xPos,
        initialRotation: 0
      });

      var hookGeometry = new THREE.BoxGeometry(4, 6, 4);
      var hookMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.5,
        metalness: 0.7
      });
      var hook = new THREE.Mesh(hookGeometry, hookMaterial);
      hook.position.set(xPos + 55, 28, 0);
      hook.castShadow = true;
      hook.receiveShadow = true;
      scene.add(hook);
      shipObjects.push(hook);
    });
  }

  function createFunnel() {
    var funnelGeometry = new THREE.CylinderGeometry(12, 15, 50, 16);
    var funnelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.2,
      emissive: 0x444444,
      emissiveIntensity: 0.5
    });
    var funnel = new THREE.Mesh(funnelGeometry, funnelMaterial);
    funnel.position.set(-75, 55, 0);
    funnel.castShadow = true;
    funnel.receiveShadow = true;
    scene.add(funnel);
    shipObjects.push(funnel);

    var rimGeometry = new THREE.CylinderGeometry(14, 12, 2, 16);
    var rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.8,
      metalness: 0.3
    });
    var rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.set(-75, 76, 0);
    rim.castShadow = true;
    rim.receiveShadow = true;
    scene.add(rim);
    shipObjects.push(rim);
  }

  function createAnchorChain() {
    var chainMaterial = new THREE.LineBasicMaterial({
      color: 0x888888,
      linewidth: 3
    });
    var chainGeometry = new THREE.BufferGeometry();
    var chainPoints = [
      new THREE.Vector3(-120, 15, 0),
      new THREE.Vector3(-120, -20, 0),
      new THREE.Vector3(-120, -30, 20)
    ];
    chainGeometry.setFromPoints(chainPoints);
    var chainLine = new THREE.LineSegments(chainGeometry, chainMaterial);
    scene.add(chainLine);
    shipObjects.push(chainLine);
  }

  function createLifeRings() {
    var ringPositions = [-60, -20, 20, 60];
    ringPositions.forEach(function(xPos) {
      var ringGeometry = new THREE.TorusGeometry(8, 2, 8, 16);
      var ringMaterial = new THREE.MeshStandardMaterial({
        color: 0xff6666,
        roughness: 0.6,
        metalness: 0.4
      });
      var ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.set(xPos, 15, 32);
      ring.rotation.y = Math.PI / 4;
      ring.castShadow = true;
      ring.receiveShadow = true;
      scene.add(ring);
      shipObjects.push(ring);
    });
  }

  function createCrewMembers() {
    var crewCount = 4;
    for (var i = 0; i < crewCount; i++) {
      var bodyGeometry = new THREE.BoxGeometry(4, 12, 4);
      var bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xffcc99,
        roughness: 0.7,
        metalness: 0.1
      });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(-40 + i * 30, 10, -15);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);

      var headGeometry = new THREE.SphereGeometry(3, 8, 8);
      var headMaterial = new THREE.MeshStandardMaterial({
        color: 0xffcc99,
        roughness: 0.6,
        metalness: 0.1
      });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(-40 + i * 30, 18, -15);
      head.castShadow = true;
      head.receiveShadow = true;
      scene.add(head);

      crewMembers.push({
        body: body,
        head: head,
        initialX: -40 + i * 30,
        initialY: 10
      });
      shipObjects.push(body);
      shipObjects.push(head);
    }
  }

  function createPirates() {
    var pirateCount = 6;
    for (var i = 0; i < pirateCount; i++) {
      var bodyGeometry = new THREE.BoxGeometry(4, 12, 4);
      var bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.7,
        metalness: 0.2
      });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(-90 + i * 8, -5 + i * 3, -35);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);

      var headGeometry = new THREE.SphereGeometry(3, 8, 8);
      var headMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b6f47,
        roughness: 0.7,
        metalness: 0.1
      });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(-90 + i * 8, 3 + i * 3, -35);
      head.castShadow = true;
      head.receiveShadow = true;
      scene.add(head);

      pirateAttackers.push({
        body: body,
        head: head,
        startX: -90 + i * 8,
        startY: -5 + i * 3,
        startZ: -35,
        climbProgress: Math.random() * 0.3,
        repelled: false
      });
      shipObjects.push(body);
      shipObjects.push(head);
    }
  }

  function createSpeedboat() {
    var boatHullGeometry = new THREE.BoxGeometry(30, 8, 12);
    var boatHullMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.8,
      metalness: 0.3
    });
    var boatHull = new THREE.Mesh(boatHullGeometry, boatHullMaterial);
    boatHull.position.set(-110, -5, -50);
    boatHull.castShadow = true;
    boatHull.receiveShadow = true;
    scene.add(boatHull);
    shipObjects.push(boatHull);

    var outboardGeometry = new THREE.CylinderGeometry(2, 2, 15, 8);
    var outboardMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.7,
      metalness: 0.5
    });
    var outboard = new THREE.Mesh(outboardGeometry, outboardMaterial);
    outboard.position.set(-125, -10, -50);
    outboard.rotation.z = Math.PI / 6;
    outboard.castShadow = true;
    outboard.receiveShadow = true;
    scene.add(outboard);
    shipObjects.push(outboard);
  }

  function createGrappleLines() {
    var linePositions = [0, 1, 2, 3, 4, 5];
    linePositions.forEach(function(idx) {
      var lineMaterial = new THREE.LineBasicMaterial({
        color: 0x666666,
        linewidth: 2
      });
      var lineGeometry = new THREE.BufferGeometry();
      var linePoints = [
        new THREE.Vector3(-85 + idx * 8, -5, -35),
        new THREE.Vector3(-85 + idx * 8, 20, -15)
      ];
      lineGeometry.setFromPoints(linePoints);
      var line = new THREE.LineSegments(lineGeometry, lineMaterial);
      scene.add(line);
      grappleLines.push({
        line: line,
        pirateIdx: idx
      });
      shipObjects.push(line);
    });
  }

  function createHatch() {
    var hatchGeometry = new THREE.BoxGeometry(80, 2, 40);
    var hatchMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.7,
      metalness: 0.3
    });
    var hatch = new THREE.Mesh(hatchGeometry, hatchMaterial);
    hatch.position.set(20, 3, 0);
    hatch.castShadow = true;
    hatch.receiveShadow = true;
    scene.add(hatch);
    shipObjects.push(hatch);
  }

  function createRadarMast() {
    var mastGeometry = new THREE.CylinderGeometry(2, 2, 80, 8);
    var mastMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.6,
      metalness: 0.5
    });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(-85, 75, 0);
    mast.castShadow = true;
    mast.receiveShadow = true;
    scene.add(mast);
    shipObjects.push(mast);

    var antennaMaterial = new THREE.LineBasicMaterial({
      color: 0xffff00,
      linewidth: 2
    });
    var antennaGeometry = new THREE.BufferGeometry();
    var antennaPoints = [
      new THREE.Vector3(-85, 115, 0),
      new THREE.Vector3(-70, 110, 0),
      new THREE.Vector3(-85, 115, 0),
      new THREE.Vector3(-100, 110, 0)
    ];
    antennaGeometry.setFromPoints(antennaPoints);
    var antenna = new THREE.LineSegments(antennaGeometry, antennaMaterial);
    scene.add(antenna);
    shipObjects.push(antenna);
  }

  function createNavigationLights() {
    var portLightGeometry = new THREE.SphereGeometry(3, 8, 8);
    var redMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.6
    });
    var portLight = new THREE.Mesh(portLightGeometry, redMaterial);
    portLight.position.set(-120, 10, -32);
    portLight.castShadow = true;
    scene.add(portLight);
    navigationLights.push({
      light: portLight,
      isRed: true,
      blinkTime: 0
    });
    shipObjects.push(portLight);

    var starboardLightGeometry = new THREE.SphereGeometry(3, 8, 8);
    var greenMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.6
    });
    var starboardLight = new THREE.Mesh(starboardLightGeometry, greenMaterial);
    starboardLight.position.set(-120, 10, 32);
    starboardLight.castShadow = true;
    scene.add(starboardLight);
    navigationLights.push({
      light: starboardLight,
      isRed: false,
      blinkTime: 0
    });
    shipObjects.push(starboardLight);
  }

  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    var deltaTime = clock.getDelta();

    updateCraneBooms(deltaTime);
    updateFunnelSmoke(deltaTime);
    updatePirates(deltaTime);
    updateCrewMovement(deltaTime);
    updateNavigationLights(deltaTime);
    updateShipRocking(deltaTime);

    if (renderer) renderer.render(scene, camera);
  }

  function updateCraneBooms(deltaTime) {
    craneBooms.forEach(function(crane, idx) {
      var time = clock.getElapsedTime();
      crane.boom.rotation.z = Math.sin(time * 0.5 + idx) * 0.3;
      crane.boom.rotation.x = Math.sin(time * 0.3) * 0.1;
    });
  }

  function updateFunnelSmoke(deltaTime) {
    var funnels = scene.children.filter(function(obj) {
      return obj.geometry && obj.geometry.type === 'CylinderGeometry' && obj.position.x < -70;
    });
    funnels.forEach(function(funnel) {
      var time = clock.getElapsedTime();
      var intensity = 0.5 + Math.sin(time * 2) * 0.3;
      funnel.material.emissiveIntensity = intensity;
    });
  }

  function updatePirates(deltaTime) {
    pirateAttackers.forEach(function(pirate) {
      if (!pirate.repelled) {
        pirate.climbProgress += deltaTime * 0.15;
        if (pirate.climbProgress > 1) {
          pirate.climbProgress = 1;
        }
        var climbHeight = pirate.startY + pirate.climbProgress * 35;
        pirate.body.position.y = climbHeight;
        pirate.head.position.y = climbHeight + 8;
      }
    });
  }

  function updateCrewMovement(deltaTime) {
    crewMembers.forEach(function(crew) {
      var time = clock.getElapsedTime();
      var moveDistance = Math.sin(time * 1.5) * 5;
      crew.body.position.x = crew.initialX + moveDistance;
      crew.head.position.x = crew.initialX + moveDistance;
    });
  }

  function updateNavigationLights(deltaTime) {
    navigationLights.forEach(function(light) {
      light.blinkTime += deltaTime;
      if (light.blinkTime > 2) {
        light.blinkTime = 0;
      }
      var intensity = light.blinkTime < 1 ? 0.8 : 0.1;
      light.light.material.emissiveIntensity = intensity;
    });
  }

  function updateShipRocking(deltaTime) {
    var time = clock.getElapsedTime();
    scene.rotation.z = Math.sin(time * 0.5) * 0.02;
  }

  function update(deltaTime) {
    if (renderer) {
      if (renderer) renderer.render(scene, camera);
    }
  }

  function handleKeyDown(event) {
    var now = Date.now();

    if (event.key.toLowerCase() === 'c') {
      if (!keybindState.cPressed) {
        keybindState.cPressed = true;
        keybindState.cPressTime = now;
      }
    }

    if (event.key.toLowerCase() === 'f') {
      if (keybindState.cPressed && (now - keybindState.cPressTime < 400)) {
        state.hudVisible = !state.hudVisible;
        updateHUD();
      }
      keybindState.fPressed = true;
    }
  }

  function handleKeyUp(event) {
    if (event.key.toLowerCase() === 'c') {
      keybindState.cPressed = false;
    }
    if (event.key.toLowerCase() === 'f') {
      keybindState.fPressed = false;
    }
  }

  function updateHUD() {
    var hudElement = document.getElementById('cargo-freighter-hud');
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'cargo-freighter-hud';
      hudElement.style.position = 'absolute';
      hudElement.style.top = '20px';
      hudElement.style.left = '20px';
      hudElement.style.color = '#ffffff';
      hudElement.style.fontFamily = 'monospace';
      hudElement.style.fontSize = '14px';
      hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      hudElement.style.padding = '10px';
      hudElement.style.borderRadius = '4px';
      hudElement.style.zIndex = '1000';
      document.body.appendChild(hudElement);
    }

    if (state.hudVisible) {
      var pirateLine = 'PIRATES REPELLED: ' + state.piratesRepelled + '/6';
      var cargoLine = 'CARGO CONTAINERS SECURE: ' + (state.cargoSecure ? 'YES' : 'NO');
      var maydayLine = 'MAYDAY SENT: ' + (state.maydaySent ? 'YES' : 'NO');
      hudElement.textContent = pirateLine + '\n' + cargoLine + '\n' + maydayLine;
      hudElement.style.display = 'block';
    } else {
      hudElement.style.display = 'none';
    }
  }

  function handleWindowResize() {
    if (camera && renderer) {
      var width = canvas.clientWidth;
      var height = canvas.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
  }

  function reset() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('resize', handleWindowResize);

    shipObjects.forEach(function(obj) {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) {
            mat.dispose();
          });
        } else {
          obj.material.dispose();
        }
      }
    });

    if (renderer) {
      renderer.dispose();
    }

    scene.clear();
    shipObjects = [];
    crewMembers = [];
    pirateAttackers = [];
    craneBooms = [];
    grappleLines = [];
    navigationLights = [];

    state = {
      piratesRepelled: 0,
      cargoSecure: true,
      maydaySent: false,
      hudVisible: false
    };

    keybindState = {
      cPressed: false,
      cPressTime: 0,
      fPressed: false
    };
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
