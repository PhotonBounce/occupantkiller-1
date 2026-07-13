window.SewageTunnels = (function() {
  'use strict';

  var scene;
  var camera;
  var sceneObjects = [];
  var animatedObjects = [];
  var enemies = [];
  var hudElement = null;
  var isInitialized = false;

  // HUD state
  var hudState = {
    contrabandSeized: 0,
    smugglersDown: 0,
    tunnelsMapped: 0
  };

  // Keybind tracking for S+T combo
  var lastKeyPress = null;
  var keyBindTimeout = 400;

  // ============================================================================
  // Initialization
  // ============================================================================

  var init = function(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    if (isInitialized) {
      reset();
    }

    // Set up environment
    scene.background = new THREE.Color(0x1a1a1a);
    scene.fog = new THREE.Fog(0x2d3d2d, 8, 50);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0x4a5a4a, 0.4);
    scene.add(ambientLight);
    sceneObjects.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0x5a6a5a, 0.3);
    directionalLight.position.set(10, 15, 10);
    scene.add(directionalLight);
    sceneObjects.push(directionalLight);

    // Create tunnel sections
    createTunnelCorridors();
    createSewageChannels();
    createMaintenanceCatwalks();
    createLadderRungs();
    createSewerGrates();
    createValveWheels();
    createStorageCaches();
    createJunctionChambers();

    // Animated elements
    createAnimatedSewageFlow();
    createAnimatedRats();
    createDrippingWater();

    // Create enemies
    createEnemies();

    // Set up HUD
    setupHUD();

    // Set up keybind listener
    setupKeybindListener();

    isInitialized = true;
  };

  // ============================================================================
  // Tunnel Architecture
  // ============================================================================

  var createTunnelCorridors = function() {
    // Create circular tunnel sections (cylinder rings forming corridors)
    var positions = [
      { x: 0, y: 0, z: 0 },
      { x: 15, y: 0, z: 0 },
      { x: 30, y: 0, z: 0 },
      { x: 30, y: 0, z: 15 },
      { x: 30, y: 0, z: 30 }
    ];

    positions.forEach(function(pos) {
      var geometry = new THREE.CylinderGeometry(4, 4, 10, 16, 8, true);
      var material = new THREE.MeshStandardMaterial({
        color: 0x3a4a3a,
        metalness: 0.3,
        roughness: 0.7,
        emissive: 0x1a2a1a
      });
      var tunnel = new THREE.Mesh(geometry, material);
      tunnel.position.set(pos.x, pos.y, pos.z);
      tunnel.rotation.z = Math.PI / 2;
      scene.add(tunnel);
      sceneObjects.push(tunnel);
    });
  };

  var createSewageChannels = function() {
    // Recessed flat boxes with emissive green liquid effect
    var positions = [
      { x: 0, y: -2, z: 0 },
      { x: 15, y: -2, z: 0 },
      { x: 30, y: -2, z: 0 },
      { x: 30, y: -2, z: 15 },
      { x: 30, y: -2, z: 30 }
    ];

    positions.forEach(function(pos, idx) {
      var geometry = new THREE.BoxGeometry(2, 1.5, 8);
      var material = new THREE.MeshStandardMaterial({
        color: 0x2d5a2d,
        metalness: 0.2,
        roughness: 0.5,
        emissive: 0x3d7a3d,
        emissiveIntensity: 0.6
      });
      var channel = new THREE.Mesh(geometry, material);
      channel.position.set(pos.x, pos.y, pos.z);
      channel.userData.idx = idx;
      scene.add(channel);
      sceneObjects.push(channel);
      animatedObjects.push({ type: 'channel', mesh: channel, time: 0 });
    });
  };

  var createMaintenanceCatwalks = function() {
    // Metal box walkways above channels
    var positions = [
      { x: 0, y: 2.5, z: -2 },
      { x: 15, y: 2.5, z: -2 },
      { x: 30, y: 2.5, z: -2 },
      { x: 30, y: 2.5, z: 13 },
      { x: 30, y: 2.5, z: 28 }
    ];

    positions.forEach(function(pos) {
      var geometry = new THREE.BoxGeometry(1.2, 0.3, 6);
      var material = new THREE.MeshStandardMaterial({
        color: 0x4a5a4a,
        metalness: 0.8,
        roughness: 0.3,
        emissive: 0x1a2a1a
      });
      var catwalk = new THREE.Mesh(geometry, material);
      catwalk.position.set(pos.x, pos.y, pos.z);
      scene.add(catwalk);
      sceneObjects.push(catwalk);
    });
  };

  var createLadderRungs = function() {
    // Box rung segments on walls
    var positions = [
      { x: -2.2, y: 0, z: 0 },
      { x: -2.2, y: 2, z: 0 },
      { x: -2.2, y: 4, z: 0 },
      { x: -2.2, y: 6, z: 0 },
      { x: 2.2, y: 1, z: 30 },
      { x: 2.2, y: 3, z: 30 },
      { x: 2.2, y: 5, z: 30 }
    ];

    positions.forEach(function(pos) {
      var geometry = new THREE.BoxGeometry(0.3, 0.4, 3.5);
      var material = new THREE.MeshStandardMaterial({
        color: 0x3a4a3a,
        metalness: 0.6,
        roughness: 0.5
      });
      var rung = new THREE.Mesh(geometry, material);
      rung.position.set(pos.x, pos.y, pos.z);
      scene.add(rung);
      sceneObjects.push(rung);
    });
  };

  var createSewerGrates = function() {
    // Simulate grates with LineSegments grid
    var positions = [
      { x: 0, y: -3.5, z: 0 },
      { x: 30, y: -3.5, z: 30 }
    ];

    positions.forEach(function(pos) {
      var geometry = new THREE.BufferGeometry();
      var vertices = [];

      for (var i = -3; i <= 3; i += 1) {
        for (var j = -4; j <= 4; j += 1) {
          vertices.push(i, 0, j);
        }
      }

      var lines = [];
      for (var i = 0; i < vertices.length; i += 3) {
        if (i + 3 < vertices.length) lines.push(i, i + 3);
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
      geometry.setIndex(lines);

      var material = new THREE.LineBasicMaterial({ color: 0x2a3a2a });
      var grate = new THREE.LineSegments(geometry, material);
      grate.position.set(pos.x, pos.y, pos.z);
      scene.add(grate);
      sceneObjects.push(grate);
    });
  };

  var createValveWheels = function() {
    // Torus-like cylinder + box handles
    var positions = [
      { x: 8, y: 2, z: -3.5 },
      { x: 23, y: 2, z: -3.5 },
      { x: 30, y: 2, z: 8 }
    ];

    positions.forEach(function(pos) {
      // Torus (wheel)
      var torusGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.4, 16, 4);
      var torusMaterial = new THREE.MeshStandardMaterial({
        color: 0x5a6a5a,
        metalness: 0.7,
        roughness: 0.4
      });
      var torus = new THREE.Mesh(torusGeometry, torusMaterial);
      torus.position.set(pos.x, pos.y, pos.z);
      scene.add(torus);
      sceneObjects.push(torus);

      // Handle (box)
      var handleGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
      var handleMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a4a3a,
        metalness: 0.6,
        roughness: 0.5
      });
      var handle = new THREE.Mesh(handleGeometry, handleMaterial);
      handle.position.set(pos.x, pos.y + 1, pos.z);
      scene.add(handle);
      sceneObjects.push(handle);
    });
  };

  var createStorageCaches = function() {
    // Box stacks of contraband
    var positions = [
      { x: -3, y: 0, z: 5 },
      { x: 5, y: 0, z: 25 },
      { x: 28, y: 0, z: 10 }
    ];

    positions.forEach(function(pos) {
      for (var i = 0; i < 3; i++) {
        var geometry = new THREE.BoxGeometry(1.5, 0.8, 1.5);
        var material = new THREE.MeshStandardMaterial({
          color: 0x4a3a2a,
          metalness: 0.3,
          roughness: 0.8,
          emissive: 0x2a1a0a
        });
        var cache = new THREE.Mesh(geometry, material);
        cache.position.set(pos.x, pos.y + i * 1, pos.z);
        scene.add(cache);
        sceneObjects.push(cache);
      }
    });
  };

  var createJunctionChambers = function() {
    // Wider cylindrical rooms at junctions
    var positions = [
      { x: 15, y: 0, z: -8 },
      { x: 30, y: 0, z: 22 }
    ];

    positions.forEach(function(pos) {
      var geometry = new THREE.CylinderGeometry(5.5, 5.5, 8, 16, 8, true);
      var material = new THREE.MeshStandardMaterial({
        color: 0x3a4a3a,
        metalness: 0.3,
        roughness: 0.7,
        emissive: 0x1a2a1a
      });
      var chamber = new THREE.Mesh(geometry, material);
      chamber.position.set(pos.x, pos.y, pos.z);
      chamber.rotation.z = Math.PI / 2;
      scene.add(chamber);
      sceneObjects.push(chamber);
    });
  };

  // ============================================================================
  // Animated Elements
  // ============================================================================

  var createAnimatedSewageFlow = function() {
    // Sewage flow ripples with emissive green intensity pulses
    // Already added to animatedObjects in createSewageChannels
  };

  var createAnimatedRats = function() {
    // Small sphere+box composites moving along wall paths
    var pathPositions = [
      [
        { x: -3, y: 1, z: 0 },
        { x: -3, y: 1, z: 10 },
        { x: -3, y: 1, z: 20 }
      ],
      [
        { x: 3, y: 1, z: 5 },
        { x: 15, y: 1, z: 5 },
        { x: 27, y: 1, z: 5 }
      ]
    ];

    pathPositions.forEach(function(path) {
      var bodyGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      var bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        metalness: 0.2,
        roughness: 0.8,
        emissive: 0x0a0a0a
      });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);

      var tailGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.8);
      var tailMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        metalness: 0.2,
        roughness: 0.8
      });
      var tail = new THREE.Mesh(tailGeometry, tailMaterial);
      tail.position.z = -0.5;
      body.add(tail);

      body.position.copy(path[0]);
      scene.add(body);
      sceneObjects.push(body);

      animatedObjects.push({
        type: 'rat',
        mesh: body,
        path: path,
        pathIndex: 0,
        time: 0,
        speed: 1.5
      });
    });
  };

  var createDrippingWater = function() {
    // Sphere drops falling from ceiling
    var dropPositions = [
      { x: 5, y: 3.5, z: 0 },
      { x: 20, y: 3.5, z: 10 },
      { x: 28, y: 3.5, z: 25 }
    ];

    dropPositions.forEach(function(pos) {
      var geometry = new THREE.SphereGeometry(0.15, 8, 8);
      var material = new THREE.MeshStandardMaterial({
        color: 0x4a6a7a,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x1a3a4a
      });
      var drop = new THREE.Mesh(geometry, material);
      drop.position.set(pos.x, pos.y, pos.z);
      scene.add(drop);
      sceneObjects.push(drop);

      animatedObjects.push({
        type: 'drop',
        mesh: drop,
        startY: pos.y,
        minY: -5,
        time: 0,
        speed: 3
      });
    });
  };

  // ============================================================================
  // Enemies
  // ============================================================================

  var createEnemies = function() {
    // Armed smugglers and cartel lookouts hidden in alcoves
    var enemyPositions = [
      { x: 10, y: 1, z: -3.8, type: 'lookout' },
      { x: 25, y: 1, z: -3.8, type: 'smuggler' },
      { x: 32, y: 1, z: 18, type: 'lookout' }
    ];

    enemyPositions.forEach(function(pos) {
      // Create enemy body (dark box figure)
      var bodyGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.6);
      var bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.2,
        roughness: 0.9,
        emissive: 0x0a0a0a
      });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(pos.x, pos.y, pos.z);

      // Create head
      var headGeometry = new THREE.SphereGeometry(0.35, 8, 8);
      var headMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        metalness: 0.1,
        roughness: 0.8
      });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1;
      body.add(head);

      scene.add(body);
      sceneObjects.push(body);

      var enemy = {
        mesh: body,
        type: pos.type,
        health: 100,
        position: { x: pos.x, y: pos.y, z: pos.z },
        isAlive: true,
        patrolTime: 0,
        patrolRange: 3
      };
      enemies.push(enemy);
      animatedObjects.push({
        type: 'enemy',
        mesh: body,
        enemy: enemy,
        time: 0
      });
    });
  };

  // ============================================================================
  // HUD
  // ============================================================================

  var setupHUD = function() {
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'sewage-tunnels-hud';
      hudElement.style.cssText = [
        'position: fixed',
        'top: 20px',
        'left: 20px',
        'color: #4a7a4a',
        'font-family: monospace',
        'font-size: 14px',
        'z-index: 1000',
        'text-shadow: 0 0 10px rgba(74, 122, 74, 0.8)',
        'line-height: 1.6'
      ].join(';');
      document.body.appendChild(hudElement);
    }
    updateHUD();
  };

  var updateHUD = function() {
    if (hudElement) {
      hudElement.innerHTML = [
        'CONTRABAND SEIZED: ' + hudState.contrabandSeized + '/5',
        'SMUGGLERS DOWN: ' + hudState.smugglersDown,
        'TUNNELS MAPPED: ' + hudState.tunnelsMapped + '/4'
      ].join('<br>');
    }
  };

  var showKeybindNotification = function(message) {
    var notification = document.createElement('div');
    notification.style.cssText = [
      'position: fixed',
      'top: 50%',
      'left: 50%',
      'transform: translate(-50%, -50%)',
      'background: rgba(26, 26, 26, 0.9)',
      'border: 2px solid #4a7a4a',
      'color: #4a7a4a',
      'padding: 20px 40px',
      'font-family: monospace',
      'font-size: 16px',
      'z-index: 2000',
      'text-shadow: 0 0 10px rgba(74, 122, 74, 0.8)',
      'white-space: nowrap'
    ].join(';');
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(function() {
      notification.remove();
    }, 2000);
  };

  // ============================================================================
  // Keybind Handler
  // ============================================================================

  var setupKeybindListener = function() {
    document.addEventListener('keydown', function(event) {
      var key = event.key.toUpperCase();

      if (key === 'S') {
        if (lastKeyPress === 'S') {
          lastKeyPress = null;
          return;
        }
        lastKeyPress = 'S';
        setTimeout(function() {
          if (lastKeyPress === 'S') {
            lastKeyPress = null;
          }
        }, keyBindTimeout);
      } else if (key === 'T' && lastKeyPress === 'S') {
        lastKeyPress = null;
        handleSwitchKeybind();
      }
    });
  };

  var handleSwitchKeybind = function() {
    // Toggle visibility of all scene objects (simple toggle for demo)
    showKeybindNotification('[S+T] THERMAL VISION ACTIVATED');

    // Flash effect - reduce fog momentarily
    var originalFogColor = scene.fog.color.clone();
    scene.fog.color.set(0x1a3a2a);

    setTimeout(function() {
      scene.fog.color.copy(originalFogColor);
    }, 500);
  };

  // ============================================================================
  // Update Loop
  // ============================================================================

  var update = function(delta) {
    if (!isInitialized) return;

    animatedObjects.forEach(function(obj) {
      if (obj.type === 'channel') {
        // Pulsing emissive intensity for sewage flow
        obj.time += delta * 2;
        var intensity = 0.4 + Math.sin(obj.time) * 0.3;
        obj.mesh.material.emissiveIntensity = 0.6 + intensity;
      } else if (obj.type === 'rat') {
        // Move rat along path
        obj.time += delta * obj.speed;
        var pathLength = obj.path.length;
        var totalDistance = pathLength - 1;
        var currentDistance = (obj.time % (totalDistance * 2)) > totalDistance ?
          totalDistance - ((obj.time % (totalDistance * 2)) - totalDistance) :
          obj.time % (totalDistance * 2);

        var segmentIndex = Math.floor(currentDistance);
        var segmentProgress = currentDistance - segmentIndex;

        if (segmentIndex < pathLength - 1) {
          var start = obj.path[segmentIndex];
          var end = obj.path[segmentIndex + 1];
          obj.mesh.position.x = start.x + (end.x - start.x) * segmentProgress;
          obj.mesh.position.y = start.y + (end.y - start.y) * segmentProgress;
          obj.mesh.position.z = start.z + (end.z - start.z) * segmentProgress;
        }
      } else if (obj.type === 'drop') {
        // Falling water droplets
        obj.time += delta * obj.speed;
        var newY = obj.startY - obj.time;

        if (newY < obj.minY) {
          obj.time = 0;
          newY = obj.startY;
        }
        obj.mesh.position.y = newY;
      } else if (obj.type === 'enemy') {
        // Simple enemy patrol
        obj.time += delta;
        var enemy = obj.enemy;
        if (enemy.isAlive) {
          var patrol = Math.sin(obj.time * 0.5) * enemy.patrolRange;
          obj.mesh.position.x = enemy.position.x + patrol;
        }
      }
    });
  };

  // ============================================================================
  // Reset
  // ============================================================================

  var reset = function() {
    // Remove all scene objects
    sceneObjects.forEach(function(obj) {
      scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(m) { m.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
    });

    sceneObjects = [];
    animatedObjects = [];
    enemies = [];

    // Reset HUD state
    hudState = {
      contrabandSeized: 0,
      smugglersDown: 0,
      tunnelsMapped: 0
    };
    updateHUD();

    // Remove keybind listener (optional - typically not needed for reset)
    lastKeyPress = null;
  };

  // ============================================================================
  // Public API
  // ============================================================================

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
