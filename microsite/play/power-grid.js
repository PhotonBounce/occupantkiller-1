window.PowerGrid = (function() {
  'use strict';

  var scene;
  var camera;
  var sceneObjects = [];
  var towers = [];
  var substations = [];
  var enemies = [];
  var particles = [];

  var gameState = {
    substationsDestroyed: 0,
    powerOutput: 100,
    guardsAlerted: false,
    gameActive: true,
    lastKeyTime: 0,
    pKeyPressed: false
  };

  var hudState = {
    substationsDestroyed: 0,
    powerOutput: 100,
    guardsAlerted: false
  };

  function addToScene(object) {
    scene.add(object);
    sceneObjects.push(object);
  }

  function createTransmissionTower(x, z, height) {
    var group = new THREE.Group();

    var legs = new THREE.Group();
    var legGeometry = new THREE.BoxGeometry(0.5, height, 0.5);
    var legMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });

    var leg1 = new THREE.Mesh(legGeometry, legMaterial);
    leg1.position.set(-3, height / 2, -3);
    legs.add(leg1);

    var leg2 = new THREE.Mesh(legGeometry, legMaterial);
    leg2.position.set(3, height / 2, -3);
    legs.add(leg2);

    var leg3 = new THREE.Mesh(legGeometry, legMaterial);
    leg3.position.set(-3, height / 2, 3);
    legs.add(leg3);

    var leg4 = new THREE.Mesh(legGeometry, legMaterial);
    leg4.position.set(3, height / 2, 3);
    legs.add(leg4);

    group.add(legs);

    var wireGeometry = new THREE.BufferGeometry();
    var wirePoints = [
      new THREE.Vector3(-3, height, -3),
      new THREE.Vector3(3, height, -3),
      new THREE.Vector3(3, height, 3),
      new THREE.Vector3(-3, height, 3),
      new THREE.Vector3(-3, height, -3)
    ];
    wireGeometry.setFromPoints(wirePoints);

    var wireMaterial = new THREE.LineBasicMaterial({ color: 0xFFAA00, linewidth: 2 });
    var wireLines = new THREE.LineSegments(wireGeometry, wireMaterial);
    group.add(wireLines);

    var crossbarGeometry = new THREE.BoxGeometry(8, 0.3, 0.3);
    var crossbarMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 });
    var crossbar = new THREE.Mesh(crossbarGeometry, crossbarMaterial);
    crossbar.position.y = height - 2;
    group.add(crossbar);

    group.position.set(x, 0, z);
    group.userData = {
      type: 'tower',
      originalPositions: wirePoints.map(p => p.clone()),
      wireLines: wireLines
    };

    addToScene(group);
    towers.push(group);
    return group;
  }

  function createSubstation(x, z) {
    var group = new THREE.Group();

    var baseGeometry = new THREE.BoxGeometry(8, 6, 8);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.75 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 3;
    group.add(base);

    var transformerGeometry = new THREE.CylinderGeometry(1.5, 1.5, 4, 8);
    var transformerMaterial = new THREE.MeshStandardMaterial({ color: 0xDDDD00, roughness: 0.6 });

    var t1 = new THREE.Mesh(transformerGeometry, transformerMaterial);
    t1.position.set(-2, 7, -2);
    group.add(t1);

    var t2 = new THREE.Mesh(transformerGeometry, transformerMaterial);
    t2.position.set(2, 7, -2);
    group.add(t2);

    var t3 = new THREE.Mesh(transformerGeometry, transformerMaterial);
    t3.position.set(-2, 7, 2);
    group.add(t3);

    var t4 = new THREE.Mesh(transformerGeometry, transformerMaterial);
    t4.position.set(2, 7, 2);
    group.add(t4);

    var coolerGeometry = new THREE.BoxGeometry(8, 1, 2);
    var coolerMaterial = new THREE.MeshStandardMaterial({ color: 0x666600, roughness: 0.7 });
    var cooler = new THREE.Mesh(coolerGeometry, coolerMaterial);
    cooler.position.set(0, 11.5, 0);
    group.add(cooler);

    group.position.set(x, 0, z);
    group.userData = {
      type: 'substation',
      health: 100,
      destroyed: false
    };

    addToScene(group);
    substations.push(group);
    return group;
  }

  function createControlBuilding(x, z) {
    var group = new THREE.Group();

    var wallGeometry = new THREE.BoxGeometry(12, 10, 12);
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.8 });
    var walls = new THREE.Mesh(wallGeometry, wallMaterial);
    walls.position.y = 5;
    group.add(walls);

    var roofGeometry = new THREE.ConeGeometry(8.5, 3, 4);
    var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 11.5;
    group.add(roof);

    var windowGeometry = new THREE.BoxGeometry(2, 2, 0.5);
    var windowMaterial = new THREE.MeshStandardMaterial({ color: 0x88CCFF, roughness: 0.3, emissive: 0x4488FF });

    for (var i = 0; i < 4; i++) {
      var window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(-4 + i * 3, 6, 6.5);
      group.add(window);
    }

    group.position.set(x, 0, z);
    group.userData = { type: 'control' };

    addToScene(group);
    return group;
  }

  function createPowerPole(x, z) {
    var group = new THREE.Group();

    var poleGeometry = new THREE.CylinderGeometry(0.4, 0.5, 12, 8);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.8 });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 6;
    group.add(pole);

    var crossarmGeometry = new THREE.BoxGeometry(6, 0.3, 0.3);
    var crossarmMaterial = new THREE.MeshStandardMaterial({ color: 0x7D6F5B, roughness: 0.8 });
    var crossarm = new THREE.Mesh(crossarmGeometry, crossarmMaterial);
    crossarm.position.y = 10;
    group.add(crossarm);

    var armGeometry = new THREE.BoxGeometry(4, 0.3, 0.3);
    var arm2 = new THREE.Mesh(armGeometry, crossarmMaterial);
    arm2.position.y = 9;
    arm2.rotation.z = Math.PI / 6;
    group.add(arm2);

    group.position.set(x, 0, z);
    group.userData = { type: 'pole' };

    addToScene(group);
    return group;
  }

  function createInsulator(x, z, y) {
    var group = new THREE.Group();

    var insulatorMaterial = new THREE.MeshStandardMaterial({ color: 0xE8E8E8, roughness: 0.4 });

    for (var i = 0; i < 3; i++) {
      var discGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 8);
      var disc = new THREE.Mesh(discGeometry, insulatorMaterial);
      disc.position.y = i * 0.5;
      group.add(disc);
    }

    group.position.set(x, y, z);
    group.userData = { type: 'insulator' };

    addToScene(group);
    return group;
  }

  function createWarningFence(centerX, centerZ, size) {
    var group = new THREE.Group();

    var fenceGeometry = new THREE.BoxGeometry(0.3, 2, size * 2);
    var fenceMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6600, roughness: 0.7 });

    var fence1 = new THREE.Mesh(fenceGeometry, fenceMaterial);
    fence1.position.set(size, 0, 0);
    group.add(fence1);

    var fence2 = new THREE.Mesh(fenceGeometry, fenceMaterial);
    fence2.position.set(-size, 0, 0);
    group.add(fence2);

    var fence3 = new THREE.Mesh(fenceGeometry, fenceMaterial);
    fence3.rotation.y = Math.PI / 2;
    fence3.position.set(0, 0, size);
    group.add(fence3);

    var fence4 = new THREE.Mesh(fenceGeometry, fenceMaterial);
    fence4.rotation.y = Math.PI / 2;
    fence4.position.set(0, 0, -size);
    group.add(fence4);

    var wireGeometry = new THREE.BufferGeometry();
    var wirePoints = [
      new THREE.Vector3(size, 1.5, size),
      new THREE.Vector3(-size, 1.5, size),
      new THREE.Vector3(-size, 1.5, -size),
      new THREE.Vector3(size, 1.5, -size),
      new THREE.Vector3(size, 1.5, size)
    ];
    wireGeometry.setFromPoints(wirePoints);

    var wireMaterial = new THREE.LineBasicMaterial({ color: 0xFF3300, linewidth: 2 });
    var wireLines = new THREE.LineSegments(wireGeometry, wireMaterial);
    group.add(wireLines);

    group.position.set(centerX, 0, centerZ);
    group.userData = { type: 'fence' };

    addToScene(group);
    return group;
  }

  function createEmergencyGenerator(x, z) {
    var group = new THREE.Group();

    var baseGeometry = new THREE.BoxGeometry(5, 4, 5);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 2;
    group.add(base);

    var engineGeometry = new THREE.CylinderGeometry(1, 1.2, 3, 6);
    var engineMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    var engine = new THREE.Mesh(engineGeometry, engineMaterial);
    engine.position.y = 4.5;
    group.add(engine);

    var exhaustGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 8);
    var exhaustMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 });
    var exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaust.position.set(1.5, 6, 0);
    group.add(exhaust);

    group.position.set(x, 0, z);
    group.userData = { type: 'generator' };

    addToScene(group);
    return group;
  }

  function createLightningArc(fromPos, toPos) {
    var points = [];
    var segments = 8;

    for (var i = 0; i <= segments; i++) {
      var t = i / segments;
      var x = fromPos.x + (toPos.x - fromPos.x) * t + (Math.random() - 0.5) * 2;
      var y = fromPos.y + (toPos.y - fromPos.y) * t;
      var z = fromPos.z + (toPos.z - fromPos.z) * t + (Math.random() - 0.5) * 2;
      points.push(new THREE.Vector3(x, y, z));
    }

    var arcGeometry = new THREE.BufferGeometry();
    arcGeometry.setFromPoints(points);

    var arcMaterial = new THREE.LineBasicMaterial({
      color: 0xFFFFFF,
      linewidth: 3,
      emissive: 0x00FFFF
    });

    var arc = new THREE.LineSegments(arcGeometry, arcMaterial);
    arc.userData = {
      type: 'lightning',
      duration: 0.1,
      age: 0
    };

    addToScene(arc);
    return arc;
  }

  function createParticleBurst(position) {
    for (var i = 0; i < 20; i++) {
      var particleGeometry = new THREE.SphereGeometry(0.3, 4, 4);
      var particleMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFAA00,
        emissive: 0xFF6600
      });
      var particle = new THREE.Mesh(particleGeometry, particleMaterial);

      var velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 15,
        Math.random() * 20,
        (Math.random() - 0.5) * 15
      );

      particle.position.copy(position);
      particle.userData = {
        type: 'particle',
        velocity: velocity,
        life: 1.0,
        maxLife: 1.0
      };

      addToScene(particle);
      particles.push(particle);
    }
  }

  function createEnemy(x, z, type) {
    var group = new THREE.Group();

    var bodyGeometry = new THREE.BoxGeometry(1, 2, 0.8);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    group.add(body);

    var headGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    var headMaterial = new THREE.MeshStandardMaterial({ color: 0xFFCC99, roughness: 0.5 });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.3;
    group.add(head);

    var armGeometry = new THREE.BoxGeometry(0.3, 1.5, 0.3);
    var armMaterial = new THREE.MeshStandardMaterial({ color: 0xFFCC99, roughness: 0.5 });

    var armL = new THREE.Mesh(armGeometry, armMaterial);
    armL.position.set(-0.7, 1.5, 0);
    group.add(armL);

    var armR = new THREE.Mesh(armGeometry, armMaterial);
    armR.position.set(0.7, 1.5, 0);
    group.add(armR);

    var legGeometry = new THREE.BoxGeometry(0.4, 1.2, 0.4);
    var legMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });

    var legL = new THREE.Mesh(legGeometry, legMaterial);
    legL.position.set(-0.4, 0.6, 0);
    group.add(legL);

    var legR = new THREE.Mesh(legGeometry, legMaterial);
    legR.position.set(0.4, 0.6, 0);
    group.add(legR);

    group.position.set(x, 0, z);
    group.userData = {
      type: 'enemy',
      enemyType: type,
      health: type === 'special' ? 150 : 100,
      speed: type === 'special' ? 0.08 : 0.05,
      detectionRange: 50,
      alerted: false
    };

    addToScene(group);
    enemies.push(group);
    return group;
  }

  function updateEnemies(delta) {
    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if (!enemy.userData) continue;

      var moveDir = new THREE.Vector3(
        Math.sin(Date.now() * 0.001 + i) * 0.3,
        0,
        Math.cos(Date.now() * 0.001 + i) * 0.3
      );

      enemy.position.add(moveDir.multiplyScalar(enemy.userData.speed));

      if (Math.random() < 0.02) {
        enemy.userData.alerted = true;
        gameState.guardsAlerted = true;
      }
    }
  }

  function updateWires(delta) {
    for (var i = 0; i < towers.length; i++) {
      var tower = towers[i];
      if (!tower.userData || !tower.userData.wireLines) continue;

      var positions = tower.userData.wireLines.geometry.attributes.position.array;
      var originalPositions = tower.userData.originalPositions;

      for (var j = 0; j < originalPositions.length; j++) {
        var orig = originalPositions[j];
        positions[j * 3] = orig.x + (Math.random() - 0.5) * 0.2;
        positions[j * 3 + 1] = orig.y + (Math.random() - 0.5) * 0.1;
        positions[j * 3 + 2] = orig.z + (Math.random() - 0.5) * 0.2;
      }

      tower.userData.wireLines.geometry.attributes.position.needsUpdate = true;
    }

    if (Math.random() < 0.15) {
      if (towers.length > 0 && substations.length > 0) {
        var t1 = towers[Math.floor(Math.random() * towers.length)];
        var s1 = substations[Math.floor(Math.random() * substations.length)];

        createLightningArc(
          new THREE.Vector3(t1.position.x, t1.position.y + 15, t1.position.z),
          new THREE.Vector3(s1.position.x, s1.position.y + 8, s1.position.z)
        );
      }
    }
  }

  function updateParticles(delta) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      if (!p.userData) continue;

      p.userData.velocity.y -= 9.8 * delta;
      p.position.add(p.userData.velocity.clone().multiplyScalar(delta));

      p.userData.life -= delta;
      p.material.opacity = p.userData.life / p.userData.maxLife;

      if (p.userData.life <= 0) {
        scene.remove(p);
        particles.splice(i, 1);
      }
    }

    var lightningObjects = sceneObjects.filter(function(obj) {
      return obj.userData && obj.userData.type === 'lightning';
    });

    for (var i = lightningObjects.length - 1; i >= 0; i--) {
      var lightning = lightningObjects[i];
      if (!lightning.userData) continue;

      lightning.userData.age += delta;

      if (lightning.userData.age >= lightning.userData.duration) {
        scene.remove(lightning);
        sceneObjects.splice(sceneObjects.indexOf(lightning), 1);
      }
    }
  }

  function updateHUD() {
    hudState.substationsDestroyed = gameState.substationsDestroyed;
    hudState.powerOutput = gameState.powerOutput;
    hudState.guardsAlerted = gameState.guardsAlerted;
  }

  function handleKeybind(event) {
    if (event.key.toUpperCase() === 'P') {
      var now = Date.now();
      if (now - gameState.lastKeyTime < 400) {
        if (gameState.pKeyPressed) {
          event.preventDefault();
          return;
        }
      }
      gameState.pKeyPressed = true;
      gameState.lastKeyTime = now;
    }

    if (event.key.toUpperCase() === 'G' && gameState.pKeyPressed) {
      var now = Date.now();
      if (now - gameState.lastKeyTime < 400) {
        gameState.gameActive = !gameState.gameActive;
        console.log('PowerGrid toggle: ' + (gameState.gameActive ? 'ACTIVE' : 'PAUSED'));
        gameState.pKeyPressed = false;
      }
    }

    if (Date.now() - gameState.lastKeyTime > 400) {
      gameState.pKeyPressed = false;
    }
  }

  var module = {
    init: function(inputScene, inputCamera) {
      scene = inputScene;
      camera = inputCamera;

      scene.fog = new THREE.Fog(0xAA8844, 200, 500);
      scene.background = new THREE.Color(0x8B8B7A);

      var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
      scene.add(ambientLight);

      var directionalLight = new THREE.DirectionalLight(0xFFFFDD, 0.8);
      directionalLight.position.set(100, 80, 60);
      scene.add(directionalLight);

      createTransmissionTower(-30, -30, 35);
      createTransmissionTower(30, -30, 35);
      createTransmissionTower(-30, 30, 35);
      createTransmissionTower(30, 30, 35);

      createSubstation(-20, -20);
      createSubstation(20, -20);
      createSubstation(-20, 20);
      createSubstation(20, 20);

      createControlBuilding(0, 0);

      createPowerPole(-40, 0);
      createPowerPole(0, -40);
      createPowerPole(40, 0);
      createPowerPole(0, 40);

      createInsulator(-30, -30, 20);
      createInsulator(30, -30, 20);
      createInsulator(-30, 30, 20);
      createInsulator(30, 30, 20);

      createWarningFence(-20, -20, 12);
      createWarningFence(20, -20, 12);
      createWarningFence(-20, 20, 12);
      createWarningFence(20, 20, 12);

      createEmergencyGenerator(0, -50);
      createEmergencyGenerator(-50, 0);

      createEnemy(-15, -15, 'normal');
      createEnemy(15, -15, 'normal');
      createEnemy(-15, 15, 'special');
      createEnemy(15, 15, 'normal');
      createEnemy(0, 0, 'special');

      document.addEventListener('keydown', handleKeybind);

      gameState.gameActive = true;
      gameState.substationsDestroyed = 0;
      gameState.powerOutput = 100;
      gameState.guardsAlerted = false;
    },

    update: function(delta) {
      if (!gameState.gameActive || !scene) return;

      updateWires(delta);
      updateEnemies(delta);
      updateParticles(delta);
      updateHUD();

      for (var i = 0; i < substations.length; i++) {
        var substation = substations[i];
        if (substation.userData && !substation.userData.destroyed) {
          substation.rotation.y += 0.0005;
        }
      }
    },

    reset: function() {
      document.removeEventListener('keydown', handleKeybind);

      for (var i = sceneObjects.length - 1; i >= 0; i--) {
        scene.remove(sceneObjects[i]);
      }

      sceneObjects = [];
      towers = [];
      substations = [];
      enemies = [];
      particles = [];

      gameState.gameActive = false;
      gameState.substationsDestroyed = 0;
      gameState.powerOutput = 100;
      gameState.guardsAlerted = false;
      gameState.pKeyPressed = false;
      gameState.lastKeyTime = 0;

      scene = null;
      camera = null;
    },

    getState: function() {
      return {
        substationsDestroyed: hudState.substationsDestroyed,
        powerOutput: hudState.powerOutput,
        guardsAlerted: hudState.guardsAlerted
      };
    },

    destroySubstation: function(index) {
      if (index >= 0 && index < substations.length) {
        var substation = substations[index];
        if (substation.userData && !substation.userData.destroyed) {
          substation.userData.destroyed = true;
          gameState.substationsDestroyed++;
          gameState.powerOutput = Math.max(0, gameState.powerOutput - 25);
          createParticleBurst(substation.position);
        }
      }
    }
  };

  return module;
}());
