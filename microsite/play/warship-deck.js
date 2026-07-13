window.WarshipDeck = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var gameTime = 0;
  var crewKilled = 0;
  var mainGunArmed = true;
  var commsActive = true;
  var airSupportTime = 360; // 6 minutes in seconds

  var sceneObjects = [];
  var enemies = [];
  var hudElement = null;

  var gameActive = true;
  var lastKeyTime = 0;
  var wPressed = false;

  // Add object to tracking array
  function trackObject(obj) {
    sceneObjects.push(obj);
    scene.add(obj);
    return obj;
  }

  // Create main gun turret (cylinder base + rotating box barrel)
  function createMainGunTurret() {
    var group = new THREE.Group();

    // Turret base (cylinder)
    var baseGeometry = new THREE.CylinderGeometry(3, 3.5, 1.2, 16);
    var baseMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.6;
    group.add(base);

    // Barrel (box)
    var barrelGeometry = new THREE.BoxGeometry(0.8, 0.6, 8);
    var barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(0, 0.3, 4);
    barrel.castShadow = true;
    group.add(barrel);
    barrel.userData.isBarrel = true;

    group.position.set(0, 2, -12);
    group.userData.isTurret = true;
    group.userData.barrel = barrel;

    return trackObject(group);
  }

  // Create radar mast with rotating dish
  function createRadarMast() {
    var group = new THREE.Group();

    // Mast pole (cylinder)
    var mastGeometry = new THREE.CylinderGeometry(0.3, 0.3, 14, 8);
    var mastMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.y = 7;
    group.add(mast);

    // Radar dish (box rotated to look like dish)
    var dishGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.4, 16);
    var dishMaterial = new THREE.MeshPhongMaterial({ color: 0xcccc00 });
    var dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.position.set(0, 14, 0);
    dish.castShadow = true;
    group.add(dish);
    dish.userData.isDish = true;

    group.position.set(2, 1, -8);
    group.userData.isRadar = true;
    group.userData.dish = dish;

    return trackObject(group);
  }

  // Create bridge superstructure
  function createBridge() {
    var group = new THREE.Group();

    // Main tower block
    var towerGeometry = new THREE.BoxGeometry(4, 6, 4);
    var towerMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.y = 3;
    tower.castShadow = true;
    group.add(tower);

    // Windows (box cutouts represented by dark boxes)
    var windowGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.2);
    var windowMaterial = new THREE.MeshPhongMaterial({ color: 0x001a33 });
    for (var i = 0; i < 4; i++) {
      var window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(-1.5 + i * 1.2, 4, 2.1);
      group.add(window);
    }
    for (var j = 0; j < 4; j++) {
      var window2 = new THREE.Mesh(windowGeometry, windowMaterial);
      window2.position.set(-1.5 + j * 1.2, 2, 2.1);
      group.add(window2);
    }

    group.position.set(-3, 0, -2);
    group.userData.isBridge = true;

    return trackObject(group);
  }

  // Create torpedo launchers
  function createTorpedoLaunchers() {
    var group = new THREE.Group();

    // Left launcher tubes
    for (var i = 0; i < 3; i++) {
      var tubeGeometry = new THREE.CylinderGeometry(0.6, 0.6, 5, 8);
      var tubeMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
      var tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      tube.rotation.z = 0.3;
      tube.position.set(-6, 1 + i * 1.5, -5 + i * 0.5);
      tube.castShadow = true;
      group.add(tube);
    }

    // Right launcher tubes
    for (var j = 0; j < 3; j++) {
      var tube2Geometry = new THREE.CylinderGeometry(0.6, 0.6, 5, 8);
      var tube2Material = new THREE.MeshPhongMaterial({ color: 0x555555 });
      var tube2 = new THREE.Mesh(tube2Geometry, tube2Material);
      tube2.rotation.z = -0.3;
      tube2.position.set(6, 1 + j * 1.5, -5 + j * 0.5);
      tube2.castShadow = true;
      group.add(tube2);
    }

    group.userData.isTorpedo = true;
    return trackObject(group);
  }

  // Create life raft containers
  function createLifeRafts() {
    var group = new THREE.Group();

    // Left side rafts
    for (var i = 0; i < 2; i++) {
      var raftGeometry = new THREE.BoxGeometry(2, 2, 1.5);
      var raftMaterial = new THREE.MeshPhongMaterial({ color: 0xff6600 });
      var raft = new THREE.Mesh(raftGeometry, raftMaterial);
      raft.position.set(-8.5, 1.5, -10 + i * 3);
      raft.castShadow = true;
      group.add(raft);
    }

    // Right side rafts
    for (var j = 0; j < 2; j++) {
      var raft2Geometry = new THREE.BoxGeometry(2, 2, 1.5);
      var raft2Material = new THREE.MeshPhongMaterial({ color: 0xff6600 });
      var raft2 = new THREE.Mesh(raft2Geometry, raft2Material);
      raft2.position.set(8.5, 1.5, -10 + j * 3);
      raft2.castShadow = true;
      group.add(raft2);
    }

    group.userData.isLifeRaft = true;
    return trackObject(group);
  }

  // Create anchor chains hanging from bow
  function createAnchorChains() {
    var group = new THREE.Group();

    var chainLinks = 5;
    for (var i = 0; i < chainLinks; i++) {
      var linkGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.8, 6);
      var linkMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
      var link = new THREE.Mesh(linkGeometry, linkMaterial);
      link.position.set(0, 4 - i * 1, 10);
      group.add(link);
    }

    group.position.set(-5, 0, 0);
    group.userData.isChain = true;
    return trackObject(group);
  }

  // Create ship deck hull
  function createHull() {
    var group = new THREE.Group();

    // Main deck platform (large flat box)
    var deckGeometry = new THREE.BoxGeometry(16, 0.8, 30);
    var deckMaterial = new THREE.MeshPhongMaterial({ color: 0x3a3a3a });
    var deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.y = 0;
    deck.receiveShadow = true;
    group.add(deck);

    // Raised side rails (left)
    var railGeometry = new THREE.BoxGeometry(0.5, 1.5, 30);
    var railMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
    var railLeft = new THREE.Mesh(railGeometry, railMaterial);
    railLeft.position.set(-8.25, 0.9, 0);
    railLeft.castShadow = true;
    group.add(railLeft);

    // Raised side rails (right)
    var railRight = new THREE.Mesh(railGeometry, railMaterial);
    railRight.position.set(8.25, 0.9, 0);
    railRight.castShadow = true;
    group.add(railRight);

    // Raised superstructure deck
    var superGeometry = new THREE.BoxGeometry(6, 0.4, 5);
    var superMaterial = new THREE.MeshPhongMaterial({ color: 0x3a3a3a });
    var superDeck = new THREE.Mesh(superGeometry, superMaterial);
    superDeck.position.set(0, 2.4, -8);
    superDeck.castShadow = true;
    group.add(superDeck);

    group.userData.isHull = true;
    return trackObject(group);
  }

  // Create enemy crew members
  function createEnemyCrewMember(posX, posZ) {
    var group = new THREE.Group();

    // Body (box)
    var bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    var bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x001a4d }); // Navy blue
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    group.add(body);

    // Head (small sphere)
    var headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    var headMaterial = new THREE.MeshPhongMaterial({ color: 0xffcc99 });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.4, 0);
    head.castShadow = true;
    group.add(head);

    // Arm (box)
    var armGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    var armMaterial = new THREE.MeshPhongMaterial({ color: 0xffcc99 });
    var armLeft = new THREE.Mesh(armGeometry, armMaterial);
    armLeft.position.set(-0.4, 0.8, 0);
    group.add(armLeft);

    var armRight = new THREE.Mesh(armGeometry, armMaterial);
    armRight.position.set(0.4, 0.8, 0);
    group.add(armRight);

    group.position.set(posX, 0.4, posZ);
    group.userData.isEnemy = true;
    group.userData.alive = true;

    enemies.push(group);
    return trackObject(group);
  }

  // Create wake spray effect (moving spheres)
  function createWakeSpray() {
    var group = new THREE.Group();

    for (var i = 0; i < 8; i++) {
      var sphereGeometry = new THREE.SphereGeometry(0.3, 6, 6);
      var sphereMaterial = new THREE.MeshPhongMaterial({
        color: 0xccddff,
        transparent: true,
        opacity: 0.6
      });
      var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(-6 + i * 1.5, 0.5, 20);
      group.add(sphere);
    }

    group.userData.isWake = true;
    return trackObject(group);
  }

  // Create ocean fog and lighting
  function setupEnvironment() {
    // Sky and fog
    var skyGeometry = new THREE.BoxGeometry(200, 200, 200);
    var skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x87ceeb,
      side: THREE.BackSide
    });
    var skyBox = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skyBox);
    sceneObjects.push(skyBox);

    // Fog
    scene.fog = new THREE.Fog(0x87ceeb, 100, 200);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    sceneObjects.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);
    sceneObjects.push(directionalLight);

    // Ocean water (visual reference)
    var oceanGeometry = new THREE.BoxGeometry(300, 40, 300);
    var oceanMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a4d6d,
      shininess: 100
    });
    var ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
    ocean.position.y = -20;
    ocean.receiveShadow = true;
    scene.add(ocean);
    sceneObjects.push(ocean);
  }

  // Update HUD display
  function updateHUD() {
    var minutes = Math.floor(airSupportTime / 60);
    var seconds = Math.pad(airSupportTime % 60, 2);

    var hudText = 'MAIN GUN: ' + (mainGunArmed ? 'ARMED' : 'DISABLED') +
                  ' | COMMS: ' + (commsActive ? 'ACTIVE' : 'JAMMED') +
                  ' | AIR SUPPORT IN: ' + minutes + ':' + seconds +
                  ' | CREW DOWN: ' + crewKilled;

    if (hudElement) {
      hudElement.textContent = hudText;
    }
  }

  // Setup HUD
  function setupHUD() {
    hudElement = document.createElement('div');
    hudElement.style.position = 'fixed';
    hudElement.style.top = '10px';
    hudElement.style.left = '10px';
    hudElement.style.color = '#00ff00';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.fontSize = '14px';
    hudElement.style.zIndex = '1000';
    hudElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
    hudElement.style.backgroundColor = 'rgba(0,0,0,0.5)';
    hudElement.style.padding = '8px 12px';
    hudElement.style.border = '1px solid #00ff00';
    document.body.appendChild(hudElement);
  }

  // Pad number with zeros
  Math.pad = function(num, size) {
    var s = num + '';
    while (s.length < size) s = '0' + s;
    return s;
  };

  // Handle W+D keybind
  function setupControls() {
    document.addEventListener('keydown', function(e) {
      if (e.key === 'w' || e.key === 'W') {
        if (Date.now() - lastKeyTime > 400) {
          wPressed = true;
          lastKeyTime = Date.now();
        }
      }
      if ((e.key === 'd' || e.key === 'D') && wPressed && Date.now() - lastKeyTime < 400) {
        toggleWeapons();
        wPressed = false;
      }
    });

    document.addEventListener('keyup', function(e) {
      if (e.key === 'w' || e.key === 'W') {
        if (Date.now() - lastKeyTime > 400) {
          wPressed = false;
        }
      }
    });
  }

  // Toggle main gun and communications
  function toggleWeapons() {
    mainGunArmed = !mainGunArmed;
    commsActive = !commsActive;
    var notification = 'WEAPONS ' + (mainGunArmed ? 'ARMED' : 'DISABLED');
    showNotification(notification);
  }

  // Show HUD notification
  function showNotification(message) {
    var notif = document.createElement('div');
    notif.textContent = message;
    notif.style.position = 'fixed';
    notif.style.top = '50%';
    notif.style.left = '50%';
    notif.style.transform = 'translate(-50%, -50%)';
    notif.style.color = '#ff0000';
    notif.style.fontFamily = 'monospace';
    notif.style.fontSize = '24px';
    notif.style.zIndex = '1001';
    notif.style.textShadow = '2px 2px 8px rgba(0,0,0,0.9)';
    notif.style.animation = 'fadeOut 2s ease-in forwards';
    document.body.appendChild(notif);

    // Add fade out animation
    var style = document.createElement('style');
    style.textContent = '@keyframes fadeOut { 0% { opacity: 1; } 100% { opacity: 0; } }';
    document.head.appendChild(style);

    setTimeout(function() {
      notif.remove();
    }, 2000);
  }

  // Initialize module
  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    gameTime = 0;
    crewKilled = 0;
    mainGunArmed = true;
    commsActive = true;
    airSupportTime = 360;
    sceneObjects = [];
    enemies = [];
    gameActive = true;

    // Setup environment
    setupEnvironment();

    // Create ship components
    createHull();
    createMainGunTurret();
    createRadarMast();
    createBridge();
    createTorpedoLaunchers();
    createLifeRafts();
    createAnchorChains();
    createWakeSpray();

    // Create enemy crew
    createEnemyCrewMember(-4, -8);
    createEnemyCrewMember(2, -6);
    createEnemyCrewMember(0, 0);
    createEnemyCrewMember(-6, 2);
    createEnemyCrewMember(5, 5);
    createEnemyCrewMember(-3, 8);

    // Setup HUD and controls
    setupHUD();
    setupControls();

    updateHUD();
  }

  // Update animation loop
  function update(delta) {
    if (!gameActive) return;

    gameTime += delta;

    // Update air support countdown
    if (airSupportTime > 0) {
      airSupportTime -= delta;
      if (airSupportTime < 0) {
        airSupportTime = 0;
        showNotification('AIR SUPPORT INBOUND - MISSION FAILED');
        gameActive = false;
      }
    }

    // Find turret and rotate barrel
    for (var i = 0; i < sceneObjects.length; i++) {
      var obj = sceneObjects[i];

      if (obj.userData.isTurret && obj.userData.barrel) {
        obj.rotation.y += delta * 0.3;
        obj.userData.barrel.rotation.x = Math.sin(gameTime * 0.5) * 0.3;
      }

      // Rotate radar dish
      if (obj.userData.isRadar && obj.userData.dish) {
        obj.userData.dish.rotation.y += delta * 2;
      }

      // Rock ship gently
      if (obj.userData.isHull) {
        obj.position.y = Math.sin(gameTime * 0.5) * 0.3;
      }

      // Animate wake spray
      if (obj.userData.isWake) {
        obj.position.z = 20 - (gameTime * 3 % 40);
        for (var j = 0; j < obj.children.length; j++) {
          var spray = obj.children[j];
          spray.position.y = 0.5 + Math.sin(gameTime * 2 + j) * 0.3;
          spray.scale.x = 1 + Math.sin(gameTime * 3 + j) * 0.3;
          spray.scale.y = spray.scale.x;
          spray.scale.z = spray.scale.x;
        }
      }
    }

    // Update HUD
    updateHUD();
  }

  // Reset module
  function reset() {
    gameActive = false;
    airSupportTime = 0;

    // Remove all tracked objects from scene
    for (var i = 0; i < sceneObjects.length; i++) {
      scene.remove(sceneObjects[i]);
    }
    sceneObjects = [];
    enemies = [];

    // Remove HUD
    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
    }
    hudElement = null;
  }

  // Public API
  return {
    init: init,
    update: update,
    reset: reset
  };
}());
