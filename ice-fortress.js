window.IceFortress = (function() {
  'use strict';

  var sceneRef = null;
  var cameraRef = null;
  var allObjects = [];
  var isActive = false;
  var auroraAngle = 0;
  var searchlightAngle = 0;
  var snowcatPosition = 0;
  var particleEmitters = [];
  var keybindTimeout = null;
  var lastKeyWasI = false;

  var HUD = {
    breached: false,
    commandSystems: 0,
    defendersEliminated: 0
  };

  function createArcticFortress(scene) {
    var fortress = {};
    var fortressGroup = new THREE.Group();

    // Outer ice wall perimeter
    var wallMaterial = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.7
    });
    var wallNorthGeometry = new THREE.BoxGeometry(100, 15, 3);
    var wallNorth = new THREE.Mesh(wallNorthGeometry, wallMaterial);
    wallNorth.position.set(0, 8, -50);
    fortressGroup.add(wallNorth);
    allObjects.push(wallNorth);

    var wallSouthGeometry = new THREE.BoxGeometry(100, 15, 3);
    var wallSouth = new THREE.Mesh(wallSouthGeometry, wallMaterial);
    wallSouth.position.set(0, 8, 50);
    fortressGroup.add(wallSouth);
    allObjects.push(wallSouth);

    var wallEastGeometry = new THREE.BoxGeometry(3, 15, 100);
    var wallEast = new THREE.Mesh(wallEastGeometry, wallMaterial);
    wallEast.position.set(50, 8, 0);
    fortressGroup.add(wallEast);
    allObjects.push(wallEast);

    var wallWestGeometry = new THREE.BoxGeometry(3, 15, 100);
    var wallWest = new THREE.Mesh(wallWestGeometry, wallMaterial);
    wallWest.position.set(-50, 8, 0);
    fortressGroup.add(wallWest);
    allObjects.push(wallWest);

    // Ice battlements on walls
    var battlementMaterial = new THREE.MeshBasicMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.8
    });
    for (var i = -8; i <= 8; i++) {
      var batt = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 3), battlementMaterial);
      batt.position.set(i * 10, 18, -50);
      fortressGroup.add(batt);
      allObjects.push(batt);
    }
    for (var j = -8; j <= 8; j++) {
      var batt2 = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 3), battlementMaterial);
      batt2.position.set(i * 10, 18, 50);
      fortressGroup.add(batt2);
      allObjects.push(batt2);
    }

    // Ice corner towers
    var towerMaterial = new THREE.MeshBasicMaterial({
      color: 0x66bbee,
      transparent: true,
      opacity: 0.75
    });
    var towerGeometry = new THREE.CylinderGeometry(5, 6, 25, 16);

    var towerNW = new THREE.Mesh(towerGeometry, towerMaterial);
    towerNW.position.set(-48, 13, -48);
    fortressGroup.add(towerNW);
    allObjects.push(towerNW);

    var towerNE = new THREE.Mesh(towerGeometry, towerMaterial);
    towerNE.position.set(48, 13, -48);
    fortressGroup.add(towerNE);
    allObjects.push(towerNE);

    var towerSW = new THREE.Mesh(towerGeometry, towerMaterial);
    towerSW.position.set(-48, 13, 48);
    fortressGroup.add(towerSW);
    allObjects.push(towerSW);

    var towerSE = new THREE.Mesh(towerGeometry, towerMaterial);
    towerSE.position.set(48, 13, 48);
    fortressGroup.add(towerSE);
    allObjects.push(towerSE);

    // Frozen gate arch
    var pillarGeometry = new THREE.BoxGeometry(6, 20, 4);
    var pillarMaterial = new THREE.MeshBasicMaterial({
      color: 0x99ddff,
      transparent: true,
      opacity: 0.8
    });
    var pillarLeft = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillarLeft.position.set(-10, 10, -50);
    fortressGroup.add(pillarLeft);
    allObjects.push(pillarLeft);

    var pillarRight = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillarRight.position.set(10, 10, -50);
    fortressGroup.add(pillarRight);
    allObjects.push(pillarRight);

    var lintelGeometry = new THREE.BoxGeometry(20, 3, 4);
    var lintelMaterial = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.75
    });
    var lintel = new THREE.Mesh(lintelGeometry, lintelMaterial);
    lintel.position.set(0, 21, -50);
    fortressGroup.add(lintel);
    allObjects.push(lintel);

    // Central command ice building
    var commandGeometry = new THREE.BoxGeometry(30, 18, 25);
    var commandMaterial = new THREE.MeshBasicMaterial({
      color: 0x4488cc
    });
    var commandBuilding = new THREE.Mesh(commandGeometry, commandMaterial);
    commandBuilding.position.set(0, 9, 0);
    fortressGroup.add(commandBuilding);
    allObjects.push(commandBuilding);

    // Blue-tinted windows on command building
    var windowGeometry = new THREE.BoxGeometry(2, 2, 0.5);
    var windowMaterial = new THREE.MeshBasicMaterial({
      color: 0x0066ff,
      emissive: 0x0044aa
    });
    for (var wx = -10; wx <= 10; wx += 8) {
      for (var wy = 2; wy <= 12; wy += 6) {
        var window1 = new THREE.Mesh(windowGeometry, windowMaterial);
        window1.position.set(wx, wy, 12.5);
        fortressGroup.add(window1);
        allObjects.push(window1);
      }
    }

    // Ice staircase
    var stairMaterial = new THREE.MeshBasicMaterial({
      color: 0x77bbdd,
      transparent: true,
      opacity: 0.8
    });
    for (var s = 0; s < 8; s++) {
      var stairGeometry = new THREE.BoxGeometry(8, 2, 2);
      var stair = new THREE.Mesh(stairGeometry, stairMaterial);
      stair.position.set(-40, 2 + s * 2.5, -30 + s * 2);
      fortressGroup.add(stair);
      allObjects.push(stair);
    }

    // Snow drift banks against walls
    var driftMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6
    });
    var driftGeometry = new THREE.BoxGeometry(12, 4, 8);
    var drift1 = new THREE.Mesh(driftGeometry, driftMaterial);
    drift1.position.set(-45, 2, -50);
    fortressGroup.add(drift1);
    allObjects.push(drift1);

    var drift2 = new THREE.Mesh(driftGeometry, driftMaterial);
    drift2.position.set(45, 2, -50);
    fortressGroup.add(drift2);
    allObjects.push(drift2);

    // Ice sculpture decorations
    var sculptMaterial = new THREE.MeshBasicMaterial({
      color: 0x99eeff,
      transparent: true,
      opacity: 0.7
    });
    var sculpt1Geometry = new THREE.ConeGeometry(3, 8, 8);
    var sculpt1 = new THREE.Mesh(sculpt1Geometry, sculptMaterial);
    sculpt1.position.set(-35, 4, 0);
    fortressGroup.add(sculpt1);
    allObjects.push(sculpt1);

    var sculpt2Geometry = new THREE.BoxGeometry(4, 6, 4);
    var sculpt2 = new THREE.Mesh(sculpt2Geometry, sculptMaterial);
    sculpt2.position.set(35, 4, 10);
    fortressGroup.add(sculpt2);
    allObjects.push(sculpt2);

    // Generator building
    var genGeometry = new THREE.BoxGeometry(10, 8, 10);
    var genMaterial = new THREE.MeshBasicMaterial({
      color: 0x6699dd
    });
    var genBuilding = new THREE.Mesh(genGeometry, genMaterial);
    genBuilding.position.set(30, 4, -30);
    fortressGroup.add(genBuilding);
    allObjects.push(genBuilding);

    var exhaustGeometry = new THREE.CylinderGeometry(2, 2, 6, 8);
    var exhaustMaterial = new THREE.MeshBasicMaterial({
      color: 0x888888
    });
    var exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaust.position.set(32, 11, -30);
    fortressGroup.add(exhaust);
    allObjects.push(exhaust);

    // Satellite uplink dome
    var domeGeometry = new THREE.SphereGeometry(4, 16, 16);
    var domeMaterial = new THREE.MeshBasicMaterial({
      color: 0x3366cc,
      transparent: true,
      opacity: 0.8
    });
    var dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.set(-30, 12, 35);
    fortressGroup.add(dome);
    allObjects.push(dome);

    var platformGeometry = new THREE.BoxGeometry(10, 1, 10);
    var platformMaterial = new THREE.MeshBasicMaterial({
      color: 0x5588cc
    });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(-30, 2, 35);
    fortressGroup.add(platform);
    allObjects.push(platform);

    // Underground entry hatch
    var hatchGeometry = new THREE.BoxGeometry(6, 0.5, 6);
    var hatchMaterial = new THREE.MeshBasicMaterial({
      color: 0x444444
    });
    var hatch = new THREE.Mesh(hatchGeometry, hatchMaterial);
    hatch.position.set(0, 0.25, 30);
    fortressGroup.add(hatch);
    allObjects.push(hatch);

    var handleGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
    var handleMaterial = new THREE.MeshBasicMaterial({
      color: 0x555555
    });
    var handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0, 2, 30);
    fortressGroup.add(handle);
    allObjects.push(handle);

    // Aurora borealis effect (colored LineSegments)
    var auroraPoints = [];
    for (var a = 0; a <= 360; a += 10) {
      var rad = a * Math.PI / 180;
      auroraPoints.push(
        new THREE.Vector3(Math.cos(rad) * 60, 40 + Math.sin(rad * 2) * 10, Math.sin(rad) * 60)
      );
    }
    var auroraGeometry = new THREE.BufferGeometry().setFromPoints(auroraPoints);
    var auroraLine = new THREE.LineSegments(
      auroraGeometry,
      new THREE.LineBasicMaterial({ color: 0x00ff88 })
    );
    fortressGroup.add(auroraLine);
    allObjects.push(auroraLine);
    fortress.auroraLine = auroraLine;

    // Searchlight on ice tower
    var searchlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff99,
      emissive: 0xffff00
    });
    var searchGeometry = new THREE.CylinderGeometry(1.5, 1.5, 4, 12);
    var searchlight = new THREE.Mesh(searchGeometry, searchlightMaterial);
    searchlight.position.set(48, 22, -48);
    fortressGroup.add(searchlight);
    allObjects.push(searchlight);
    fortress.searchlight = searchlight;

    var beamGeometry = new THREE.ConeGeometry(15, 30, 16);
    var beamMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff88,
      transparent: true,
      opacity: 0.3
    });
    var beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(48, 10, -48);
    fortressGroup.add(beam);
    allObjects.push(beam);
    fortress.beam = beam;

    // Supply snowcat vehicle
    var snowcatBody = new THREE.Mesh(
      new THREE.BoxGeometry(8, 4, 12),
      new THREE.MeshBasicMaterial({ color: 0xdddddd })
    );
    snowcatBody.position.set(0, 3, -35);
    fortressGroup.add(snowcatBody);
    allObjects.push(snowcatBody);
    fortress.snowcatBody = snowcatBody;

    var trackGeometry = new THREE.CylinderGeometry(2, 2, 10, 12);
    var trackMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    var trackLeft = new THREE.Mesh(trackGeometry, trackMaterial);
    trackLeft.position.set(-5, 1.5, -35);
    trackLeft.rotation.z = Math.PI / 2;
    fortressGroup.add(trackLeft);
    allObjects.push(trackLeft);

    var trackRight = new THREE.Mesh(trackGeometry, trackMaterial);
    trackRight.position.set(5, 1.5, -35);
    trackRight.rotation.z = Math.PI / 2;
    fortressGroup.add(trackRight);
    allObjects.push(trackRight);

    // Freeze-dried supply cache
    var cacheGeometry = new THREE.BoxGeometry(5, 3, 5);
    var cacheMaterial = new THREE.MeshBasicMaterial({
      color: 0xbbddff,
      transparent: true,
      opacity: 0.85
    });
    var cache1 = new THREE.Mesh(cacheGeometry, cacheMaterial);
    cache1.position.set(-20, 1.5, 40);
    fortressGroup.add(cache1);
    allObjects.push(cache1);

    var cache2 = new THREE.Mesh(cacheGeometry, cacheMaterial);
    cache2.position.set(-20, 5, 40);
    fortressGroup.add(cache2);
    allObjects.push(cache2);

    var cache3 = new THREE.Mesh(cacheGeometry, cacheMaterial);
    cache3.position.set(-20, 8.5, 40);
    fortressGroup.add(cache3);
    allObjects.push(cache3);

    scene.add(fortressGroup);
    fortress.group = fortressGroup;
    return fortress;
  }

  function createEnemies(scene) {
    var enemies = [];

    var tacticsMaterial = new THREE.MeshBasicMaterial({
      color: 0xf5f5f5
    });

    // Arctic special forces figures
    for (var e = 0; e < 5; e++) {
      var figure = new THREE.Group();
      var bodyGeometry = new THREE.BoxGeometry(1.5, 3, 1);
      var body = new THREE.Mesh(bodyGeometry, tacticsMaterial);
      figure.add(body);
      allObjects.push(body);

      var headGeometry = new THREE.SphereGeometry(0.6, 8, 8);
      var head = new THREE.Mesh(headGeometry, tacticsMaterial);
      head.position.y = 2;
      figure.add(head);
      allObjects.push(head);

      var x = (Math.random() - 0.5) * 60;
      var z = (Math.random() - 0.5) * 60;
      figure.position.set(x, 2, z);
      scene.add(figure);
      allObjects.push(figure);
      enemies.push(figure);
    }

    // Snipers in towers
    for (var s = 0; s < 2; s++) {
      var sniper = new THREE.Group();
      var sniperBody = new THREE.Mesh(new THREE.BoxGeometry(1, 2.5, 0.8), tacticsMaterial);
      sniper.add(sniperBody);
      allObjects.push(sniperBody);

      var sniperHead = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), tacticsMaterial);
      sniperHead.position.y = 1.5;
      sniper.add(sniperHead);
      allObjects.push(sniperHead);

      var pos = s === 0 ? -48 : 48;
      sniper.position.set(pos, 20, -48);
      scene.add(sniper);
      allObjects.push(sniper);
      enemies.push(sniper);
    }

    return enemies;
  }

  function createSnowfallParticles(scene) {
    var particleGroup = new THREE.Group();
    var particleGeometry = new THREE.BufferGeometry();
    var particleCount = 500;
    var positions = new Float32Array(particleCount * 3);

    for (var p = 0; p < particleCount; p++) {
      positions[p * 3] = (Math.random() - 0.5) * 150;
      positions[p * 3 + 1] = Math.random() * 80;
      positions[p * 3 + 2] = (Math.random() - 0.5) * 150;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.3,
      transparent: true,
      opacity: 0.7
    });
    var particles = new THREE.Points(particleGeometry, particleMaterial);
    particleGroup.add(particles);
    scene.add(particleGroup);
    allObjects.push(particleGroup);
    allObjects.push(particles);

    return {
      group: particleGroup,
      particles: particles,
      positions: positions
    };
  }

  function updateAurora(fortress, delta) {
    auroraAngle += delta * 0.5;
    if (fortress.auroraLine) {
      var colors = [0x00ff88, 0x0088ff, 0xff00ff];
      var colorIdx = Math.floor((auroraAngle / 2) % 3);
      fortress.auroraLine.material.color.setHex(colors[colorIdx]);
    }
  }

  function updateSearchlight(fortress, delta) {
    searchlightAngle += delta * 0.8;
    if (fortress.beam) {
      var angle = searchlightAngle % (Math.PI * 2);
      fortress.beam.rotation.y = angle;
      fortress.beam.position.x = 48 + Math.cos(angle) * 10;
      fortress.beam.position.z = -48 + Math.sin(angle) * 10;
    }
  }

  function updateSnowcat(fortress, delta) {
    snowcatPosition += delta * 20;
    if (snowcatPosition > 200) {
      snowcatPosition = -100;
    }
    if (fortress.snowcatBody) {
      fortress.snowcatBody.position.z = -35 + snowcatPosition;
    }
  }

  function updateSnowfall(particleData, delta) {
    if (!particleData || !particleData.particles) return;

    var positions = particleData.positions;
    for (var i = 0; i < positions.length; i += 3) {
      positions[i + 1] -= delta * 15;
      if (positions[i + 1] < -5) {
        positions[i + 1] = 80;
      }
    }
    particleData.particles.geometry.attributes.position.needsUpdate = true;
  }

  function showHUD() {
    var hudText = 'ICE FORTRESS BREACHED: ' + (HUD.breached ? 'YES' : 'NO') + '\n' +
                  'COMMAND SYSTEMS DOWN: ' + HUD.commandSystems + '/4\n' +
                  'DEFENDERS ELIMINATED: ' + HUD.defendersEliminated + '/20';
    console.log(hudText);
  }

  function onKeyDown(evt) {
    if (evt.key === 'i' || evt.key === 'I') {
      if (!lastKeyWasI) {
        lastKeyWasI = true;
        if (keybindTimeout) {
          clearTimeout(keybindTimeout);
        }
        keybindTimeout = setTimeout(function() {
          lastKeyWasI = false;
        }, 400);
      } else if (evt.key === 'f' || evt.key === 'F') {
        isActive = !isActive;
        lastKeyWasI = false;
        if (keybindTimeout) {
          clearTimeout(keybindTimeout);
        }
        console.log(isActive ? 'Ice Fortress ACTIVATED' : 'Ice Fortress DEACTIVATED');
        showHUD();
      }
      return;
    }

    if ((evt.key === 'f' || evt.key === 'F') && lastKeyWasI) {
      isActive = !isActive;
      lastKeyWasI = false;
      if (keybindTimeout) {
        clearTimeout(keybindTimeout);
      }
      console.log(isActive ? 'Ice Fortress ACTIVATED' : 'Ice Fortress DEACTIVATED');
      showHUD();
    }
  }

  var publicAPI = {
    init: function(scene, camera) {
      sceneRef = scene;
      cameraRef = camera;

      // Arctic atmosphere
      scene.fog = new THREE.Fog(0xccddff, 200, 500);
      scene.background = new THREE.Color(0xccddff);

      // Ice blue ambient light
      var ambientLight = new THREE.AmbientLight(0x88bbdd, 0.8);
      scene.add(ambientLight);
      allObjects.push(ambientLight);

      // Aurora directional light
      var auroraLight = new THREE.DirectionalLight(0x00ff88, 0.3);
      auroraLight.position.set(50, 40, 50);
      scene.add(auroraLight);
      allObjects.push(auroraLight);

      // Create fortress structures
      var fortress = createArcticFortress(scene);

      // Create enemies
      var enemies = createEnemies(scene);

      // Create snowfall
      var snowfall = createSnowfallParticles(scene);
      particleEmitters.push(snowfall);

      // Keybind listener
      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', onKeyDown);
      }

      return {
        fortress: fortress,
        enemies: enemies,
        snowfall: snowfall
      };
    },

    update: function(delta) {
      if (!isActive || !sceneRef) return;

      var fortress = publicAPI._fortress;
      if (!fortress) {
        fortress = {
          auroraLine: sceneRef.children.find(function(c) { return c instanceof THREE.LineSegments; })
        };
        publicAPI._fortress = fortress;
      }

      updateAurora(fortress, delta);
      updateSearchlight(fortress, delta);
      updateSnowcat(fortress, delta);

      for (var i = 0; i < particleEmitters.length; i++) {
        updateSnowfall(particleEmitters[i], delta);
      }
    },

    reset: function() {
      for (var i = allObjects.length - 1; i >= 0; i--) {
        var obj = allObjects[i];
        if (obj && typeof obj.removeFromParent === 'function') {
          obj.removeFromParent();
        } else if (obj && obj.parent) {
          obj.parent.remove(obj);
        }
      }
      allObjects = [];
      particleEmitters = [];
      isActive = false;
      HUD.breached = false;
      HUD.commandSystems = 0;
      HUD.defendersEliminated = 0;
      if (typeof window !== 'undefined' && keybindTimeout) {
        clearTimeout(keybindTimeout);
      }
    }
  };

  return publicAPI;
}());
