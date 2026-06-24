window.DataCenter = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var lastKeyPress = null;
  var keyPressTime = 0;
  var isVisible = false;
  var hudElement = null;

  var gameState = {
    serversWiped: 0,
    totalServers: 6,
    dataExfiltration: 0,
    securityDown: 0,
    totalEnemy: 0
  };

  var animationRefs = {
    coolingFans: [],
    dataLights: [],
    pulseTime: 0
  };

  function createServerRack(x, y, z) {
    var group = new THREE.Group();

    var rackGeometry = new THREE.BoxGeometry(0.8, 2.4, 0.6);
    var rackMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var rackMesh = new THREE.Mesh(rackGeometry, rackMaterial);
    rackMesh.position.set(0, 0, 0);
    group.add(rackMesh);

    for (var i = 0; i < 4; i++) {
      var panelGeometry = new THREE.BoxGeometry(0.75, 0.5, 0.05);
      var panelMaterial = new THREE.MeshPhongMaterial({
        color: 0x003366,
        emissive: 0x0066ff,
        shininess: 100
      });
      var panelMesh = new THREE.Mesh(panelGeometry, panelMaterial);
      panelMesh.position.set(0, -1.0 + i * 0.55, 0.3);
      group.add(panelMesh);

      for (var j = 0; j < 3; j++) {
        var lightGeometry = new THREE.SphereGeometry(0.06, 8, 8);
        var lightMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        var lightMesh = new THREE.Mesh(lightGeometry, lightMaterial);
        lightMesh.position.set(-0.2 + j * 0.2, -1.0 + i * 0.55, 0.35);
        group.add(lightMesh);

        animationRefs.dataLights.push({
          mesh: lightMesh,
          originalColor: 0x00ff00,
          time: Math.random() * 2,
          pattern: Math.floor(Math.random() * 3)
        });
      }
    }

    group.position.set(x, y, z);
    scene.add(group);
    sceneObjects.push(group);

    return group;
  }

  function createCoolingUnit(x, y, z) {
    var group = new THREE.Group();

    var housingGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 16);
    var housingMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
    var housingMesh = new THREE.Mesh(housingGeometry, housingMaterial);
    group.add(housingMesh);

    var fanGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.15, 16);
    var fanMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var fanMesh = new THREE.Mesh(fanGeometry, fanMaterial);
    fanMesh.position.set(0, 0.6, 0);
    group.add(fanMesh);

    animationRefs.coolingFans.push({
      mesh: fanMesh,
      speed: 8
    });

    var fanGeometry2 = new THREE.CylinderGeometry(0.4, 0.4, 0.15, 16);
    var fanMesh2 = new THREE.Mesh(fanGeometry2, fanMaterial);
    fanMesh2.position.set(0, -0.6, 0);
    group.add(fanMesh2);

    animationRefs.coolingFans.push({
      mesh: fanMesh2,
      speed: 8
    });

    group.position.set(x, y, z);
    scene.add(group);
    sceneObjects.push(group);

    return group;
  }

  function createRaisedFloorPanel(x, y, z) {
    var group = new THREE.Group();

    var panelGeometry = new THREE.BoxGeometry(1.2, 0.2, 1.2);
    var panelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var panelMesh = new THREE.Mesh(panelGeometry, panelMaterial);
    group.add(panelMesh);

    var edgeGeometry = new THREE.BoxGeometry(1.2, 0.05, 0.1);
    var edgeMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    for (var i = 0; i < 4; i++) {
      var edgeMesh = new THREE.Mesh(edgeGeometry, edgeMaterial);
      var angle = (i * Math.PI) / 2;
      edgeMesh.position.set(
        Math.cos(angle) * 0.55,
        0.12,
        Math.sin(angle) * 0.55
      );
      edgeMesh.rotation.z = angle;
      group.add(edgeMesh);
    }

    group.position.set(x, y, z);
    scene.add(group);
    sceneObjects.push(group);

    return group;
  }

  function createUPSArray(x, y, z) {
    var group = new THREE.Group();

    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 2; j++) {
        var upsGeometry = new THREE.BoxGeometry(0.6, 1.0, 0.6);
        var upsMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a2e });
        var upsMesh = new THREE.Mesh(upsGeometry, upsMaterial);
        upsMesh.position.set(-0.7 + i * 0.8, j * 1.1, 0);
        group.add(upsMesh);

        var indicatorGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        var indicatorMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        var indicatorMesh = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        indicatorMesh.position.set(-0.7 + i * 0.8, j * 1.1 + 0.4, 0.35);
        group.add(indicatorMesh);
      }
    }

    group.position.set(x, y, z);
    scene.add(group);
    sceneObjects.push(group);

    return group;
  }

  function createPatchPanel(x, y, z) {
    var group = new THREE.Group();

    var backGeometry = new THREE.BoxGeometry(2.0, 1.5, 0.1);
    var backMaterial = new THREE.MeshPhongMaterial({ color: 0x0a0a0a });
    var backMesh = new THREE.Mesh(backGeometry, backMaterial);
    group.add(backMesh);

    var points = [];
    for (var i = 0; i < 12; i++) {
      var yPos = 0.6 - (i / 11) * 1.4;
      for (var j = 0; j < 16; j++) {
        var xPos = -0.9 + (j / 15) * 1.8;

        var portGeometry = new THREE.SphereGeometry(0.04, 6, 6);
        var portMaterial = new THREE.MeshPhongMaterial({ color: 0xff6600 });
        var portMesh = new THREE.Mesh(portGeometry, portMaterial);
        portMesh.position.set(xPos, yPos, 0.1);
        group.add(portMesh);

        points.push(new THREE.Vector3(xPos, yPos, 0.1));
      }
    }

    for (var k = 0; k < points.length - 16; k++) {
      if ((k + 1) % 16 !== 0) {
        var lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
          points[k].x, points[k].y, points[k].z,
          points[k + 16].x, points[k + 16].y, points[k + 16].z
        ]), 3));
        var lineMaterial = new THREE.LineBasicMaterial({ color: 0xff6600, linewidth: 2 });
        var line = new THREE.LineSegments(lineGeometry, lineMaterial);
        group.add(line);
      }
    }

    group.position.set(x, y, z);
    scene.add(group);
    sceneObjects.push(group);

    return group;
  }

  function createCableTray(x, y, z) {
    var group = new THREE.Group();

    var frameGeometry = new THREE.BoxGeometry(3.0, 0.2, 0.2);
    var frameMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });

    var frame1 = new THREE.Mesh(frameGeometry, frameMaterial);
    frame1.position.set(0, 0.1, 0);
    group.add(frame1);

    var frame2 = new THREE.Mesh(frameGeometry, frameMaterial);
    frame2.position.set(0, 0.1, -0.3);
    group.add(frame2);

    var crossGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.3);
    for (var i = 0; i < 5; i++) {
      var crossMesh = new THREE.Mesh(crossGeometry, frameMaterial);
      crossMesh.position.set(-1.2 + i * 0.6, 0.1, -0.15);
      group.add(crossMesh);
    }

    for (var j = 0; j < 6; j++) {
      var cableGeometry = new THREE.CylinderGeometry(0.08, 0.08, 3.0, 12);
      var cableMaterial = new THREE.MeshPhongMaterial({ color: 0x6666cc });
      var cableMesh = new THREE.Mesh(cableGeometry, cableMaterial);
      cableMesh.rotation.z = Math.PI / 2;
      cableMesh.position.set(0, 0.3 + j * 0.15, 0);
      group.add(cableMesh);
    }

    group.position.set(x, y, z);
    scene.add(group);
    sceneObjects.push(group);

    return group;
  }

  function createSecurityDesk(x, y, z) {
    var group = new THREE.Group();

    var deskGeometry = new THREE.BoxGeometry(1.5, 0.8, 0.8);
    var deskMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
    var deskMesh = new THREE.Mesh(deskGeometry, deskMaterial);
    deskMesh.position.set(0, 0, 0);
    group.add(deskMesh);

    var monitorGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.1);
    var monitorMaterial = new THREE.MeshPhongMaterial({
      color: 0x003366,
      emissive: 0x0099ff,
      shininess: 100
    });
    var monitorMesh = new THREE.Mesh(monitorGeometry, monitorMaterial);
    monitorMesh.position.set(0, 0.8, 0);
    group.add(monitorMesh);

    animationRefs.dataLights.push({
      mesh: monitorMesh,
      originalColor: 0x0099ff,
      time: Math.random() * 2,
      pattern: 1
    });

    var chairGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 12);
    var chairMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var chairMesh = new THREE.Mesh(chairGeometry, chairMaterial);
    chairMesh.position.set(0.8, 0, 0);
    group.add(chairMesh);

    group.position.set(x, y, z);
    scene.add(group);
    sceneObjects.push(group);

    return group;
  }

  function createEnemy(x, y, z, type) {
    var group = new THREE.Group();

    var bodyGeometry = new THREE.BoxGeometry(0.4, 1.0, 0.3);
    var bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    var bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.set(0, 0, 0);
    group.add(bodyMesh);

    var headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    var headMaterial = new THREE.MeshPhongMaterial({ color: 0xffccaa });
    var headMesh = new THREE.Mesh(headGeometry, headMaterial);
    headMesh.position.set(0, 0.65, 0);
    group.add(headMesh);

    if (type === 'armed') {
      var gunGeometry = new THREE.BoxGeometry(0.08, 0.3, 0.1);
      var gunMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
      var gunMesh = new THREE.Mesh(gunGeometry, gunMaterial);
      gunMesh.position.set(0.25, 0.2, 0);
      gunMesh.rotation.z = Math.PI / 6;
      group.add(gunMesh);
    }

    group.position.set(x, y, z);
    group.userData = { type: type, health: 1 };
    scene.add(group);
    sceneObjects.push(group);

    return group;
  }

  function updateDataLights(delta) {
    animationRefs.pulseTime += delta;

    for (var i = 0; i < animationRefs.dataLights.length; i++) {
      var light = animationRefs.dataLights[i];
      light.time += delta;

      var intensity = 0;
      if (light.pattern === 0) {
        intensity = Math.abs(Math.sin(light.time * 4)) > 0.5 ? 1 : 0.2;
      } else if (light.pattern === 1) {
        intensity = Math.sin(light.time * 3) * 0.5 + 0.5;
      } else {
        intensity = (Math.sin(light.time * 6) + 1) / 2;
      }

      if (light.mesh.material.emissive !== undefined) {
        var colorVal = light.originalColor === 0x0099ff ? 0x0099ff : 0x00ff00;
        light.mesh.material.emissive.setHex(intensity > 0.5 ? colorVal : 0x000000);
      } else {
        light.mesh.material.color.setHex(intensity > 0.5 ? light.originalColor : 0x003333);
      }
    }
  }

  function updateCoolingFans(delta) {
    for (var i = 0; i < animationRefs.coolingFans.length; i++) {
      var fan = animationRefs.coolingFans[i];
      fan.mesh.rotation.y += fan.speed * delta;
    }
  }

  function updateHUD() {
    if (!hudElement) return;

    var content = 'SERVER RACKS WIPED: ' + gameState.serversWiped + '/' + gameState.totalServers + '<br>' +
                  'DATA EXFILTRATED: ' + Math.floor(gameState.dataExfiltration) + '%<br>' +
                  'SECURITY DOWN: ' + gameState.securityDown;

    hudElement.innerHTML = content;
  }

  function showHUDNotification(message) {
    if (!hudElement) return;

    var notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '50%';
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';
    notification.style.backgroundColor = 'rgba(0, 255, 100, 0.8)';
    notification.style.color = '#000000';
    notification.style.padding = '20px 40px';
    notification.style.fontSize = '24px';
    notification.style.fontFamily = 'monospace';
    notification.style.fontWeight = 'bold';
    notification.style.zIndex = '10000';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(function() {
      notification.remove();
    }, 2000);
  }

  function toggleDataCenter() {
    isVisible = !isVisible;
    var message = isVisible ? 'DATA CENTER ENTERED' : 'DATA CENTER EXITED';
    showHUDNotification(message);

    if (isVisible) {
      gameState.dataExfiltration += 0.5;
    }
  }

  function handleKeyDown(event) {
    var now = Date.now();

    if (event.key === 'd' || event.key === 'D') {
      if (lastKeyPress === 'd' && now - keyPressTime < 400) {
        toggleDataCenter();
        lastKeyPress = null;
      } else {
        lastKeyPress = 'd';
        keyPressTime = now;
      }
    } else if (event.key === 'c' || event.key === 'C') {
      if (lastKeyPress === 'd' && now - keyPressTime < 400) {
        toggleDataCenter();
        lastKeyPress = null;
      }
    } else {
      lastKeyPress = null;
    }
  }

  var init = function(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    sceneObjects = [];
    animationRefs.coolingFans = [];
    animationRefs.dataLights = [];
    gameState.serversWiped = 0;
    gameState.dataExfiltration = 0;
    gameState.securityDown = 0;

    scene.background = new THREE.Color(0x0a1428);
    scene.fog = new THREE.Fog(0x1a2638, 20, 60);

    var light = new THREE.AmbientLight(0x4499ff, 0.6);
    scene.add(light);
    sceneObjects.push(light);

    var directionalLight = new THREE.DirectionalLight(0xccddff, 0.8);
    directionalLight.position.set(5, 8, 5);
    scene.add(directionalLight);
    sceneObjects.push(directionalLight);

    var pointLight = new THREE.PointLight(0x0099ff, 0.5, 30);
    pointLight.position.set(0, 2, 0);
    scene.add(pointLight);
    sceneObjects.push(pointLight);

    createServerRack(-4, 1.2, -8);
    createServerRack(-2, 1.2, -8);
    createServerRack(0, 1.2, -8);
    createServerRack(2, 1.2, -8);
    createServerRack(4, 1.2, -8);
    createServerRack(6, 1.2, -8);

    createCoolingUnit(-5, 0.9, -2);
    createCoolingUnit(5, 0.9, -2);

    for (var i = 0; i < 6; i++) {
      for (var j = 0; j < 4; j++) {
        createRaisedFloorPanel(-5 + i * 2.5, -0.1, -10 + j * 2.5);
      }
    }

    createUPSArray(8, 0.6, -8);
    createPatchPanel(-8, 1.5, 0);
    createCableTray(0, 3.5, -5);
    createSecurityDesk(-7, 0.4, 3);

    createEnemy(-6, 0.5, 5, 'technician');
    createEnemy(-2, 0.5, 6, 'armed');
    createEnemy(3, 0.5, 5, 'technician');
    createEnemy(7, 0.5, 4, 'armed');

    gameState.totalEnemy = 4;

    hudElement = document.createElement('div');
    hudElement.id = 'data-center-hud';
    hudElement.style.position = 'fixed';
    hudElement.style.top = '20px';
    hudElement.style.right = '20px';
    hudElement.style.color = '#00ff00';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.fontSize = '14px';
    hudElement.style.textShadow = '0 0 10px #00ff00';
    hudElement.style.zIndex = '100';
    hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hudElement.style.padding = '10px 15px';
    hudElement.style.border = '1px solid #00ff00';
    document.body.appendChild(hudElement);

    document.addEventListener('keydown', handleKeyDown);

    updateHUD();
  };

  var update = function(delta) {
    if (!scene) return;

    updateDataLights(delta);
    updateCoolingFans(delta);
    updateHUD();

    if (isVisible) {
      gameState.dataExfiltration += delta * 5;
      if (gameState.dataExfiltration > 100) {
        gameState.dataExfiltration = 100;
      }
    }
  };

  var reset = function() {
    for (var i = 0; i < sceneObjects.length; i++) {
      scene.remove(sceneObjects[i]);
    }
    sceneObjects = [];
    animationRefs.coolingFans = [];
    animationRefs.dataLights = [];

    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }

    document.removeEventListener('keydown', handleKeyDown);

    isVisible = false;
    lastKeyPress = null;
    gameState.serversWiped = 0;
    gameState.dataExfiltration = 0;
    gameState.securityDown = 0;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
