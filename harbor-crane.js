window.HarborCrane = (function() {
  'use strict';

  // State
  var scene = null;
  var camera = null;
  var objects = [];
  var keysPressed = {};
  var lastHKeyTime = 0;
  var huVisible = false;
  var craneHeight = 65;
  var bombTimer = 720; // 12 minutes in seconds
  var levelsCleaned = 0;

  // Animation state
  var time = 0;
  var trolleyPos = 0;
  var containerY = 0;
  var boomRotation = 0;
  var radiationPulse = 0;

  // Keybind state for H+C combo
  var hPressed = false;

  // Add object to tracking array
  function addObject(obj) {
    objects.push(obj);
    scene.add(obj);
    return obj;
  }

  // Create HUD text element
  function createHUDElement() {
    var hudDiv = document.createElement('div');
    hudDiv.id = 'harbor-hud';
    hudDiv.style.cssText = 'position:fixed;top:20px;left:20px;color:#00ff00;font-family:monospace;font-size:14px;z-index:9999;text-shadow:0 0 10px #00ff00;display:none;';
    hudDiv.innerHTML = '<div style="line-height:1.6;">CRANE HEIGHT: 65m<br>BOMB TIMER: T-12:00<br>CRANE LEVELS CLEARED: 0/5</div>';
    document.body.appendChild(hudDiv);
    return hudDiv;
  }

  // Update HUD
  function updateHUD() {
    var minutes = Math.floor(bombTimer / 60);
    var seconds = Math.floor(bombTimer % 60);
    var timeStr = (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    var hud = document.getElementById('harbor-hud');
    if (hud) {
      hud.innerHTML = '<div style="line-height:1.6;">CRANE HEIGHT: ' + craneHeight + 'm<br>BOMB TIMER: T-' + timeStr + '<br>CRANE LEVELS CLEARED: ' + levelsCleaned + '/5</div>';
    }
  }

  // Handle key input for H+C combo
  function setupKeybinds() {
    document.addEventListener('keydown', function(e) {
      if (e.key.toUpperCase() === 'H') {
        var now = Date.now();
        if (now - lastHKeyTime < 400) {
          huVisible = !huVisible;
          var hud = document.getElementById('harbor-hud');
          if (hud) {
            hud.style.display = huVisible ? 'block' : 'none';
          }
          hPressed = false;
        } else {
          hPressed = true;
          lastHKeyTime = now;
          setTimeout(function() { hPressed = false; }, 400);
        }
      }
      if (e.key.toUpperCase() === 'C' && hPressed) {
        huVisible = !huVisible;
        var hud = document.getElementById('harbor-hud');
        if (hud) {
          hud.style.display = huVisible ? 'block' : 'none';
        }
        hPressed = false;
      }
      keysPressed[e.key.toLowerCase()] = true;
    });

    document.addEventListener('keyup', function(e) {
      keysPressed[e.key.toLowerCase()] = false;
    });
  }

  // Create crane portal frame (two tall box legs)
  function createCraneFrame() {
    var material = new THREE.MeshPhongMaterial({ color: 0xffcc00 });

    // Left leg
    var leftLeg = new THREE.Mesh(new THREE.BoxGeometry(1.5, 50, 1.5), material);
    leftLeg.position.set(-15, 25, 0);
    addObject(leftLeg);

    // Right leg
    var rightLeg = new THREE.Mesh(new THREE.BoxGeometry(1.5, 50, 1.5), material);
    rightLeg.position.set(15, 25, 0);
    addObject(rightLeg);

    // Horizontal spreader box connecting legs
    var spreader = new THREE.Mesh(new THREE.BoxGeometry(32, 2, 2), material);
    spreader.position.set(0, 50, 0);
    addObject(spreader);

    return { leftLeg: leftLeg, rightLeg: rightLeg, spreader: spreader };
  }

  // Create crane boom/jib
  function createBoom() {
    var material = new THREE.MeshPhongMaterial({ color: 0xffcc00 });

    // Main boom box extending out
    var boom = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 2), material);
    boom.position.set(0, 48, 15);
    boom.name = 'boom';
    addObject(boom);

    return boom;
  }

  // Create trolley on boom
  function createTrolley() {
    var material = new THREE.MeshPhongMaterial({ color: 0xffaa00 });
    var trolley = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 1.5), material);
    trolley.position.set(0, 48, 15);
    trolley.name = 'trolley';
    addObject(trolley);
    return trolley;
  }

  // Create spreader bar with container locks
  function createSpreader() {
    var material = new THREE.MeshPhongMaterial({ color: 0xccaa00 });
    var spreader = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 2.5), material);
    spreader.position.set(0, 10, 15);
    addObject(spreader);

    // Cylinder corner locks
    var lockMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var lockGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 8);
    var corners = [
      [-1.25, 0.5, -1.25],
      [1.25, 0.5, -1.25],
      [-1.25, 0.5, 1.25],
      [1.25, 0.5, 1.25]
    ];
    corners.forEach(function(pos) {
      var lock = new THREE.Mesh(lockGeom, lockMaterial);
      lock.position.set(pos[0], pos[1], pos[2]);
      spreader.add(lock);
    });

    spreader.name = 'spreader';
    return spreader;
  }

  // Create operator cab
  function createCab() {
    var material = new THREE.MeshPhongMaterial({ color: 0xffcc00 });
    var cab = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 2), material);
    cab.position.set(-12, 49, 0);
    addObject(cab);

    // Window panels (transparent boxes)
    var windowMaterial = new THREE.MeshPhongMaterial({ color: 0x8888cc, transparent: true, opacity: 0.3 });
    var window1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 0.1), windowMaterial);
    window1.position.set(0, 0.3, 1.05);
    cab.add(window1);

    var window2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 0.1), windowMaterial);
    window2.position.set(0, 0.3, -1.05);
    cab.add(window2);

    cab.name = 'cab';
    return cab;
  }

  // Create utility ladder with LineSegments rungs
  function createLadder() {
    var material = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 });
    var geometry = new THREE.BufferGeometry();

    // Vertical sides
    var positions = [];
    for (var i = 0; i < 10; i++) {
      var y = 5 + i * 4;
      // Left rung
      positions.push(-15.5, y, 0.5);
      positions.push(-14.5, y, 0.5);
      // Right rung
      positions.push(-15.5, y, -0.5);
      positions.push(-14.5, y, -0.5);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    var ladder = new THREE.LineSegments(geometry, material);
    addObject(ladder);

    return ladder;
  }

  // Create crane rail tracks on wharf
  function createTracks() {
    var material = new THREE.MeshPhongMaterial({ color: 0x666666 });

    // Track strip 1
    var track1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 40), material);
    track1.position.set(-16, 0.1, 0);
    addObject(track1);

    // Track strip 2
    var track2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 40), material);
    track2.position.set(16, 0.1, 0);
    addObject(track2);

    return { track1: track1, track2: track2 };
  }

  // Create counterweight at rear
  function createCounterweight() {
    var material = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var counterweight = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 3), material);
    counterweight.position.set(0, 46, -10);
    addObject(counterweight);
    return counterweight;
  }

  // Create container stack
  function createContainers() {
    var colors = [0xff0000, 0x0000ff, 0x00ff00];
    var containers = [];

    for (var i = 0; i < 3; i++) {
      var material = new THREE.MeshPhongMaterial({ color: colors[i % 3] });
      var container = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.5, 5), material);
      container.position.set(8 + i * 3, 1.25 + i * 2.5, 0);
      addObject(container);
      containers.push(container);
    }

    return containers;
  }

  // Create ship alongside
  function createShip() {
    var material = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var ship = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 20), material);
    ship.position.set(0, 2, -25);
    addObject(ship);

    // Ship superstructure
    var superMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var super1 = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 4), superMaterial);
    super1.position.set(0, 4, -20);
    ship.add(super1);

    return ship;
  }

  // Create wharf surface
  function createWharf() {
    var material = new THREE.MeshPhongMaterial({ color: 0x888888 });
    var wharf = new THREE.Mesh(new THREE.BoxGeometry(50, 0.5, 40), material);
    wharf.position.set(0, -0.25, 0);
    addObject(wharf);
    return wharf;
  }

  // Create cable drum winch
  function createWinch() {
    var material = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var winch = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.8, 16), material);
    winch.position.set(0, 47, 2);
    winch.rotation.z = Math.PI / 2;
    addObject(winch);
    return winch;
  }

  // Create anti-collision lights
  function createLights() {
    var material = new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0xff0000 });

    var light1 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), material);
    light1.position.set(-20, 52, 15);
    light1.name = 'collisionLight';
    addObject(light1);

    var light2 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), material);
    light2.position.set(20, 52, 15);
    light2.name = 'collisionLight';
    addObject(light2);

    return [light1, light2];
  }

  // Create maintenance platform
  function createPlatform() {
    var material = new THREE.MeshPhongMaterial({ color: 0xffcc00 });
    var platform = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 2), material);
    platform.position.set(-15, 30, 2);
    addObject(platform);
    return platform;
  }

  // Create secondary crane
  function createSecondaryCrane() {
    var material = new THREE.MeshPhongMaterial({ color: 0xddaa00 });

    // Smaller boom
    var boom = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 1.5), material);
    boom.position.set(20, 25, 15);
    addObject(boom);

    // Smaller hook
    var hook = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
    hook.position.set(20, 20, 15);
    addObject(hook);

    return { boom: boom, hook: hook };
  }

  // Create dirty bomb container
  function createBombContainer() {
    var material = new THREE.MeshPhongMaterial({ color: 0xff6600, emissive: 0xff3300 });
    var container = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), material);
    container.position.set(0, 12, 15);
    container.name = 'bombContainer';
    addObject(container);

    // Radiation hazard symbol with LineSegments
    var lineGeom = new THREE.BufferGeometry();
    var positions = [];

    // Three triangular hazard symbols
    var scale = 0.5;
    for (var i = 0; i < 3; i++) {
      var angle = (i * 2 * Math.PI / 3);
      // Triangle outline
      var x1 = Math.cos(angle) * scale;
      var z1 = Math.sin(angle) * scale;
      var x2 = Math.cos(angle + 2.09) * scale;
      var z2 = Math.sin(angle + 2.09) * scale;
      var x3 = Math.cos(angle + 4.18) * scale;
      var z3 = Math.sin(angle + 4.18) * scale;

      positions.push(x1, 0, z1, x2, 0, z2);
      positions.push(x2, 0, z2, x3, 0, z3);
      positions.push(x3, 0, z3, x1, 0, z1);
    }

    lineGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    var lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 });
    var hazardSymbol = new THREE.LineSegments(lineGeom, lineMaterial);
    container.add(hazardSymbol);

    return container;
  }

  // Create scene objects
  function createScene() {
    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 30, 10);
    scene.add(directionalLight);

    // Fog for atmosphere
    scene.fog = new THREE.Fog(0xccccdd, 100, 200);
    scene.background = new THREE.Color(0xccccdd);

    // Create all game objects
    createCraneFrame();
    createBoom();
    createTrolley();
    createSpreader();
    createCab();
    createLadder();
    createTracks();
    createCounterweight();
    createContainers();
    createShip();
    createWharf();
    createWinch();
    createLights();
    createPlatform();
    createSecondaryCrane();
    createBombContainer();
  }

  // Init function
  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];

    createScene();
    createHUDElement();
    setupKeybinds();

    // Position camera
    camera.position.set(0, 20, 30);
    camera.lookAt(0, 25, 0);
  }

  // Update function
  function update(delta) {
    time += delta;

    // Update bomb timer
    if (bombTimer > 0) {
      bombTimer -= delta;
    }

    // Trolley animation - slides back and forth
    trolleyPos = Math.sin(time * 0.5) * 10;
    var trolley = scene.getObjectByName('trolley');
    if (trolley) {
      trolley.position.x = trolleyPos;
    }

    // Container lifting animation
    containerY = Math.sin(time * 0.7) * 2;
    var bombContainer = scene.getObjectByName('bombContainer');
    if (bombContainer) {
      bombContainer.position.y = 12 + containerY;
    }

    // Radiation pulse animation
    radiationPulse = Math.sin(time * 3) * 0.3 + 0.7;
    if (bombContainer) {
      bombContainer.material.emissiveIntensity = radiationPulse;
    }

    // Boom rotation
    boomRotation = Math.sin(time * 0.3) * 0.3;
    var boom = scene.getObjectByName('boom');
    if (boom) {
      boom.rotation.z = boomRotation;
    }

    // Operator cab swaying
    var cab = scene.getObjectByName('cab');
    if (cab) {
      cab.position.x = -12 + Math.sin(time * 0.6) * 0.5;
      cab.rotation.z = Math.sin(time * 0.6) * 0.05;
    }

    // Anti-collision lights blinking
    var lights = scene.children.filter(function(obj) { return obj.name === 'collisionLight'; });
    var blink = Math.floor(time * 3) % 2;
    lights.forEach(function(light) {
      light.visible = blink === 0;
    });

    // Update HUD
    updateHUD();
  }

  // Reset function
  function reset() {
    objects.forEach(function(obj) {
      scene.remove(obj);
    });
    objects = [];

    time = 0;
    trolleyPos = 0;
    containerY = 0;
    boomRotation = 0;
    radiationPulse = 0;
    bombTimer = 720;
    levelsCleaned = 0;
    huVisible = false;

    var hud = document.getElementById('harbor-hud');
    if (hud) {
      hud.style.display = 'none';
      hud.remove();
    }

    createScene();
    createHUDElement();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
