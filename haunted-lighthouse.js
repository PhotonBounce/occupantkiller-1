window.HauntedLighthouse = (function() {
  'use strict';

  var scene;
  var camera;
  var sceneObjects = [];
  var lightbeamCone;
  var fireSphere;
  var ritualCircle;
  var boatMesh;
  var bellSphere;
  var currentFogDensity = 0.03;
  var ritualPulseTime = 0;
  var boatBobTime = 0;
  var bellRingTime = 0;
  var lastHKeyTime = 0;
  var lastLKeyTime = 0;
  var hPressed = false;
  var lPressed = false;
  var isVisible = true;
  var hudElement;

  // HUD state
  var cultMembersDown = 0;
  var weaponsCacheFound = false;
  var lighthouseSecured = false;

  // Key event tracking
  var keyState = {};

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    sceneObjects = [];
    cultMembersDown = 0;
    weaponsCacheFound = false;
    lighthouseSecured = false;

    // Setup fog
    scene.fog = new THREE.FogExp2(0x1a2a2a, currentFogDensity);

    // Setup lighting
    var ambientLight = new THREE.AmbientLight(0x444466, 0.6);
    scene.add(ambientLight);
    sceneObjects.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(50, 100, 50);
    scene.add(directionalLight);
    sceneObjects.push(directionalLight);

    // Create terrain (rocky island base)
    var terrainGeom = new THREE.BoxGeometry(200, 15, 200);
    var terrainMat = new THREE.MeshPhongMaterial({ color: 0x4a5a3a });
    var terrain = new THREE.Mesh(terrainGeom, terrainMat);
    terrain.position.y = -7;
    terrain.receiveShadow = true;
    scene.add(terrain);
    sceneObjects.push(terrain);

    // Create ocean surrounding (flat dark box)
    var oceanGeom = new THREE.BoxGeometry(400, 2, 400);
    var oceanMat = new THREE.MeshPhongMaterial({ color: 0x0a1a2a });
    var ocean = new THREE.Mesh(oceanGeom, oceanMat);
    ocean.position.y = -20;
    scene.add(ocean);
    sceneObjects.push(ocean);

    // Create lighthouse tower (tall cylinder with white striped bands)
    var towerGeom = new THREE.CylinderGeometry(12, 12, 120, 32);
    var towerMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee });
    var tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.set(0, 60, 0);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    sceneObjects.push(tower);

    // Add stripe bands to tower (white and dark)
    for (var i = 0; i < 8; i++) {
      var stripeGeom = new THREE.CylinderGeometry(13, 13, 4, 32);
      var stripeMat = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
      var stripe = new THREE.Mesh(stripeGeom, stripeMat);
      stripe.position.set(0, 30 + (i * 15), 0);
      scene.add(stripe);
      sceneObjects.push(stripe);
    }

    // Light room at top (glass cylinder + rotating beam cone)
    var lightRoomGeom = new THREE.CylinderGeometry(10, 10, 12, 32);
    var lightRoomMat = new THREE.MeshPhongMaterial({ color: 0x88aa99, wireframe: true });
    var lightRoom = new THREE.Mesh(lightRoomGeom, lightRoomMat);
    lightRoom.position.set(0, 126, 0);
    scene.add(lightRoom);
    sceneObjects.push(lightRoom);

    // Rotating beam cone
    var beamGeom = new THREE.ConeGeometry(15, 40, 16);
    var beamMat = new THREE.MeshPhongMaterial({ color: 0xffff99, emissive: 0xffff00, wireframe: false });
    lightbeamCone = new THREE.Mesh(beamGeom, beamMat);
    lightbeamCone.position.set(0, 128, 0);
    lightbeamCone.rotation.x = Math.PI / 2;
    scene.add(lightbeamCone);
    sceneObjects.push(lightbeamCone);

    // Keeper's cottage (box building at base)
    var cottageGeom = new THREE.BoxGeometry(30, 20, 30);
    var cottageMat = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    var cottage = new THREE.Mesh(cottageGeom, cottageMat);
    cottage.position.set(-50, 10, 20);
    cottage.castShadow = true;
    cottage.receiveShadow = true;
    scene.add(cottage);
    sceneObjects.push(cottage);

    // Weathervane on cottage (box arrow on cylinder)
    var vaneBaseGeom = new THREE.CylinderGeometry(2, 2, 15, 16);
    var vaneMat = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var vaneBase = new THREE.Mesh(vaneBaseGeom, vaneMat);
    vaneBase.position.set(-50, 30, 20);
    scene.add(vaneBase);
    sceneObjects.push(vaneBase);

    var arrowGeom = new THREE.BoxGeometry(10, 2, 1);
    var arrowMat = new THREE.MeshPhongMaterial({ color: 0xffaa00 });
    var arrow = new THREE.Mesh(arrowGeom, arrowMat);
    arrow.position.set(-50, 38, 20);
    scene.add(arrow);
    sceneObjects.push(arrow);

    // Dock pier (flat box extending over water)
    var dockGeom = new THREE.BoxGeometry(40, 3, 60);
    var dockMat = new THREE.MeshPhongMaterial({ color: 0x5a4a3a });
    var dock = new THREE.Mesh(dockGeom, dockMat);
    dock.position.set(60, 2, -40);
    dock.receiveShadow = true;
    scene.add(dock);
    sceneObjects.push(dock);

    // Rowing boat at dock (small box boat)
    var boatGeom = new THREE.BoxGeometry(12, 6, 25);
    var boatMat = new THREE.MeshPhongMaterial({ color: 0xaa5533 });
    boatMesh = new THREE.Mesh(boatGeom, boatMat);
    boatMesh.position.set(60, 6, -30);
    boatMesh.castShadow = true;
    scene.add(boatMesh);
    sceneObjects.push(boatMesh);

    // Supply barrels (cylinder stacks near dock)
    for (var j = 0; j < 3; j++) {
      var barrelGeom = new THREE.CylinderGeometry(4, 4, 8, 16);
      var barrelMat = new THREE.MeshPhongMaterial({ color: 0x7a5a3a });
      var barrel = new THREE.Mesh(barrelGeom, barrelMat);
      barrel.position.set(70 + (j * 10), 5, -40);
      scene.add(barrel);
      sceneObjects.push(barrel);
    }

    // Fire brazier (cylinder + sphere fire)
    var brazierGeom = new THREE.CylinderGeometry(8, 8, 3, 32);
    var brazierMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var brazier = new THREE.Mesh(brazierGeom, brazierMat);
    brazier.position.set(-50, 12, -50);
    scene.add(brazier);
    sceneObjects.push(brazier);

    var fireGeom = new THREE.SphereGeometry(6, 16, 16);
    var fireMat = new THREE.MeshPhongMaterial({ color: 0xff6633, emissive: 0xff4400 });
    fireSphere = new THREE.Mesh(fireGeom, fireMat);
    fireSphere.position.set(-50, 18, -50);
    scene.add(fireSphere);
    sceneObjects.push(fireSphere);

    // Ritual circle on ground (LineSegments pentagon + stone cylinder pillars)
    var ritualCenter = new THREE.Vector3(30, 0.5, 30);
    var ritualRadius = 40;
    var pentagonPoints = [];
    for (var k = 0; k < 5; k++) {
      var angle = (k / 5) * Math.PI * 2;
      var x = ritualCenter.x + Math.cos(angle) * ritualRadius;
      var z = ritualCenter.z + Math.sin(angle) * ritualRadius;
      pentagonPoints.push(new THREE.Vector3(x, 1, z));
    }
    pentagonPoints.push(pentagonPoints[0]);

    var lineGeom = new THREE.BufferGeometry().setFromPoints(pentagonPoints);
    var lineMat = new THREE.LineBasicMaterial({ color: 0xaa00ff, linewidth: 3 });
    ritualCircle = new THREE.LineSegments(lineGeom, lineMat);
    scene.add(ritualCircle);
    sceneObjects.push(ritualCircle);

    // Stone pillars at pentagon points
    for (var p = 0; p < 5; p++) {
      var pillarGeom = new THREE.CylinderGeometry(3, 3, 12, 16);
      var pillarMat = new THREE.MeshPhongMaterial({ color: 0x5a5a5a });
      var pillar = new THREE.Mesh(pillarGeom, pillarMat);
      pillar.position.copy(pentagonPoints[p]);
      pillar.position.y = 6;
      scene.add(pillar);
      sceneObjects.push(pillar);
    }

    // Wooden cross/totem (cylinder pole + box crossarm)
    var poleGeom = new THREE.CylinderGeometry(2, 2, 40, 16);
    var poleMat = new THREE.MeshPhongMaterial({ color: 0x6b4423 });
    var pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.set(20, 20, -80);
    scene.add(pole);
    sceneObjects.push(pole);

    var crossGeom = new THREE.BoxGeometry(20, 3, 2);
    var crossMat = new THREE.MeshPhongMaterial({ color: 0x6b4423 });
    var crossarm = new THREE.Mesh(crossGeom, crossMat);
    crossarm.position.set(20, 30, -80);
    scene.add(crossarm);
    sceneObjects.push(crossarm);

    // Foghorn (large cylinder pointing out)
    var hornGeom = new THREE.CylinderGeometry(4, 5, 20, 16);
    var hornMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var horn = new THREE.Mesh(hornGeom, hornMat);
    horn.position.set(0, 110, -15);
    horn.rotation.z = Math.PI / 3;
    scene.add(horn);
    sceneObjects.push(horn);

    // Signal bell (hemisphere sphere + cylinder clapper)
    var bellGeom = new THREE.SphereGeometry(6, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    var bellMat = new THREE.MeshPhongMaterial({ color: 0xcccc00 });
    bellSphere = new THREE.Mesh(bellGeom, bellMat);
    bellSphere.position.set(15, 100, 15);
    scene.add(bellSphere);
    sceneObjects.push(bellSphere);

    var clapperGeom = new THREE.CylinderGeometry(2, 2, 6, 12);
    var clapperMat = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var clapper = new THREE.Mesh(clapperGeom, clapperMat);
    clapper.position.set(15, 94, 15);
    scene.add(clapper);
    sceneObjects.push(clapper);

    // Sea cave entrance (box dark opening in cliff)
    var caveGeom = new THREE.BoxGeometry(15, 20, 8);
    var caveMat = new THREE.MeshPhongMaterial({ color: 0x0a0a0a });
    var cave = new THREE.Mesh(caveGeom, caveMat);
    cave.position.set(-85, 8, -60);
    scene.add(cave);
    sceneObjects.push(cave);

    // Gulls (small sphere clusters near top)
    for (var g = 0; g < 5; g++) {
      var gullGeom = new THREE.SphereGeometry(1.5, 8, 8);
      var gullMat = new THREE.MeshPhongMaterial({ color: 0xdddddd });
      var gull = new THREE.Mesh(gullGeom, gullMat);
      var angle = (g / 5) * Math.PI * 2;
      gull.position.set(Math.cos(angle) * 25, 140 + Math.random() * 5, Math.sin(angle) * 25);
      scene.add(gull);
      sceneObjects.push(gull);
    }

    // Create cult members (box figures with cone hoods)
    for (var c = 0; c < 5; c++) {
      var bodyGeom = new THREE.BoxGeometry(6, 12, 4);
      var bodyMat = new THREE.MeshPhongMaterial({ color: 0x330033 });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.set(-20 + c * 15, 6, 40);
      scene.add(body);
      sceneObjects.push(body);

      var hoodGeom = new THREE.ConeGeometry(4, 10, 8);
      var hoodMat = new THREE.MeshPhongMaterial({ color: 0x220022 });
      var hood = new THREE.Mesh(hoodGeom, hoodMat);
      hood.position.set(-20 + c * 15, 18, 40);
      scene.add(hood);
      sceneObjects.push(hood);
    }

    // Armed smugglers at dock
    for (var s = 0; s < 3; s++) {
      var smugglerBodyGeom = new THREE.BoxGeometry(5, 10, 3);
      var smugglerMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
      var smuggler = new THREE.Mesh(smugglerBodyGeom, smugglerMat);
      smuggler.position.set(50 + s * 12, 6, -50);
      scene.add(smuggler);
      sceneObjects.push(smuggler);
    }

    // Cult leader at top of lighthouse
    var leaderBodyGeom = new THREE.BoxGeometry(6, 12, 4);
    var leaderMat = new THREE.MeshPhongMaterial({ color: 0x550055, emissive: 0x220033 });
    var leader = new THREE.Mesh(leaderBodyGeom, leaderMat);
    leader.position.set(0, 130, 0);
    scene.add(leader);
    sceneObjects.push(leader);

    var leaderHoodGeom = new THREE.ConeGeometry(4, 10, 8);
    var leaderHoodMat = new THREE.MeshPhongMaterial({ color: 0x330044 });
    var leaderHood = new THREE.Mesh(leaderHoodGeom, leaderHoodMat);
    leaderHood.position.set(0, 140, 0);
    scene.add(leaderHood);
    sceneObjects.push(leaderHood);

    // Setup keyboard listeners
    document.addEventListener('keydown', function(e) {
      var key = e.key.toLowerCase();
      var now = Date.now();

      if (key === 'h') {
        if (!hPressed) {
          lastHKeyTime = now;
          hPressed = true;
        }
      } else if (key === 'l') {
        if (hPressed && (now - lastHKeyTime < 400)) {
          toggleVisibility();
          lPressed = true;
        } else {
          lPressed = false;
        }
      }
    });

    document.addEventListener('keyup', function(e) {
      var key = e.key.toLowerCase();
      if (key === 'h') {
        hPressed = false;
      } else if (key === 'l') {
        lPressed = false;
      }
    });

    // Create HUD element
    createHUD();
    updateHUD();
  }

  function createHUD() {
    if (hudElement) {
      document.body.removeChild(hudElement);
    }

    hudElement = document.createElement('div');
    hudElement.style.position = 'fixed';
    hudElement.style.top = '20px';
    hudElement.style.left = '20px';
    hudElement.style.color = '#00ff00';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.fontSize = '14px';
    hudElement.style.textShadow = '0 0 10px #00ff00';
    hudElement.style.zIndex = '1000';
    hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hudElement.style.padding = '10px';
    hudElement.style.border = '1px solid #00ff00';
    document.body.appendChild(hudElement);
  }

  function updateHUD() {
    if (hudElement) {
      var weaponsStatus = weaponsCacheFound ? 'FOUND' : 'NOT FOUND';
      var lighthouseStatus = lighthouseSecured ? 'YES' : 'NO';

      hudElement.innerHTML = 'CULT MEMBERS DOWN: ' + cultMembersDown + '/10<br>' +
                            'WEAPONS CACHE: ' + weaponsStatus + '<br>' +
                            'LIGHTHOUSE SECURED: ' + lighthouseStatus + '<br>' +
                            '<span style="color: #ffff00;">[H+L] TOGGLE HUD</span>';
    }
  }

  function toggleVisibility() {
    isVisible = !isVisible;

    if (hudElement) {
      hudElement.style.display = isVisible ? 'block' : 'none';
      if (isVisible) {
        showNotification('HUD ENABLED');
      } else {
        showNotification('HUD DISABLED');
      }
    }
  }

  function showNotification(message) {
    var notif = document.createElement('div');
    notif.style.position = 'fixed';
    notif.style.bottom = '20px';
    notif.style.right = '20px';
    notif.style.color = '#ffff00';
    notif.style.fontFamily = 'monospace';
    notif.style.fontSize = '12px';
    notif.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    notif.style.padding = '8px';
    notif.style.border = '1px solid #ffff00';
    notif.style.zIndex = '1001';
    notif.innerHTML = message;
    document.body.appendChild(notif);

    setTimeout(function() {
      if (notif.parentNode) {
        document.body.removeChild(notif);
      }
    }, 2000);
  }

  function update(delta) {
    if (!scene || !camera) return;

    // Rotate lighthouse beam
    if (lightbeamCone) {
      lightbeamCone.rotation.y += delta * 0.5;
    }

    // Flicker fire
    if (fireSphere) {
      var flicker = 0.8 + Math.sin(Date.now() * 0.005) * 0.2;
      fireSphere.scale.set(flicker, flicker, flicker);
    }

    // Ritual circle pulse
    ritualPulseTime += delta;
    if (ritualCircle && ritualCircle.material) {
      var pulseIntensity = 0.5 + Math.sin(ritualPulseTime * 3) * 0.5;
      ritualCircle.material.linewidth = 1 + pulseIntensity * 3;
    }

    // Fog roll
    if (scene.fog) {
      currentFogDensity = 0.03 + Math.sin(Date.now() * 0.0005) * 0.01;
      scene.fog.density = currentFogDensity;
    }

    // Boat bob
    if (boatMesh) {
      boatBobTime += delta;
      boatMesh.position.y = 6 + Math.sin(boatBobTime * 2) * 0.8;
    }

    // Bell occasional ring
    if (bellSphere) {
      bellRingTime += delta;
      var ringAmplitude = Math.max(0, Math.sin(bellRingTime * 8 - 10) * 0.3);
      bellSphere.position.z = 15 + ringAmplitude;
    }
  }

  function reset() {
    // Remove all scene objects
    for (var i = 0; i < sceneObjects.length; i++) {
      scene.remove(sceneObjects[i]);
    }
    sceneObjects = [];

    // Reset state
    cultMembersDown = 0;
    weaponsCacheFound = false;
    lighthouseSecured = false;
    isVisible = true;
    ritualPulseTime = 0;
    boatBobTime = 0;
    bellRingTime = 0;

    // Remove HUD
    if (hudElement && hudElement.parentNode) {
      document.body.removeChild(hudElement);
      hudElement = null;
    }

    // Remove event listeners would happen naturally in scene cleanup
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
