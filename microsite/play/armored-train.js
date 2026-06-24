window.ArmoredTrain = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var trainGroup = null;
  var animatedObjects = [];

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;
    trainGroup = new THREE.Group();
    scene.add(trainGroup);
    animatedObjects = [];

    // Locomotive engine
    var engineBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 2.0, 4.0),
      new THREE.MeshStandardMaterial({ color: 0x333322 })
    );
    engineBody.position.set(0, 1.0, 0);
    engineBody.castShadow = true;
    engineBody.receiveShadow = true;
    trainGroup.add(engineBody);

    var smokestack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 3.0, 16),
      new THREE.MeshStandardMaterial({ color: 0x222211 })
    );
    smokestack.position.set(0.5, 3.0, -0.5);
    smokestack.castShadow = true;
    trainGroup.add(smokestack);

    var steamParticle = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xCCCCCC, transparent: true, opacity: 0.6 })
    );
    steamParticle.position.set(0.5, 4.2, -0.5);
    steamParticle.scale.set(0.1, 0.1, 0.1);
    trainGroup.add(steamParticle);
    animatedObjects.push({ type: 'steam', mesh: steamParticle, time: 0 });

    // Armored car carriage 1
    var car1 = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 2.0, 5.0),
      new THREE.MeshStandardMaterial({ color: 0x445533 })
    );
    car1.position.set(0, 1.0, -6.5);
    car1.castShadow = true;
    car1.receiveShadow = true;
    trainGroup.add(car1);

    // Armored car carriage 2
    var car2 = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 2.0, 5.0),
      new THREE.MeshStandardMaterial({ color: 0x445533 })
    );
    car2.position.set(0, 1.0, -13.0);
    car2.castShadow = true;
    car2.receiveShadow = true;
    trainGroup.add(car2);

    // Rail gun turret car
    var turretCar = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 2.0, 5.0),
      new THREE.MeshStandardMaterial({ color: 0x334433 })
    );
    turretCar.position.set(0, 1.0, -19.5);
    turretCar.castShadow = true;
    turretCar.receiveShadow = true;
    trainGroup.add(turretCar);

    var turretRotor = new THREE.Group();
    turretRotor.position.set(0, 2.0, -19.5);
    trainGroup.add(turretRotor);

    var turretBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.2, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x555544 })
    );
    turretBase.castShadow = true;
    turretRotor.add(turretBase);

    var gunBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 5.0, 16),
      new THREE.MeshStandardMaterial({ color: 0x555544 })
    );
    gunBarrel.rotation.z = Math.PI / 2;
    gunBarrel.position.set(2.5, 0, 0);
    gunBarrel.castShadow = true;
    turretRotor.add(gunBarrel);
    animatedObjects.push({ type: 'turret', mesh: turretRotor, time: 0 });

    // Troop transport car
    var troopCar = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 2.0, 5.0),
      new THREE.MeshStandardMaterial({ color: 0x334433 })
    );
    troopCar.position.set(0, 1.0, -26.0);
    troopCar.castShadow = true;
    troopCar.receiveShadow = true;
    trainGroup.add(troopCar);

    // Door opening representations (using box cutouts)
    var doorFrame1 = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.6, 0.2, -2.4),
        new THREE.Vector3(-0.6, 1.6, -2.4),
        new THREE.Vector3(-0.6, 1.6, -2.4),
        new THREE.Vector3(0.6, 1.6, -2.4),
        new THREE.Vector3(0.6, 1.6, -2.4),
        new THREE.Vector3(0.6, 0.2, -2.4),
        new THREE.Vector3(0.6, 0.2, -2.4),
        new THREE.Vector3(-0.6, 0.2, -2.4)
      ]),
      new THREE.LineBasicMaterial({ color: 0x223322 })
    );
    doorFrame1.position.set(0, 1.0, -26.0);
    trainGroup.add(doorFrame1);

    // Anti-aircraft gun platform
    var aaPlatform = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.6, 5.0),
      new THREE.MeshStandardMaterial({ color: 0x334433 })
    );
    aaPlatform.position.set(0, 1.3, -32.5);
    aaPlatform.castShadow = true;
    aaPlatform.receiveShadow = true;
    trainGroup.add(aaPlatform);

    var aaRotor = new THREE.Group();
    aaRotor.position.set(0, 2.2, -32.5);
    trainGroup.add(aaRotor);

    var aaBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.6, 16),
      new THREE.MeshStandardMaterial({ color: 0x554433 })
    );
    aaBase.castShadow = true;
    aaRotor.add(aaBase);

    var aaBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 3.5, 12),
      new THREE.MeshStandardMaterial({ color: 0x554433 })
    );
    aaBarrel.rotation.z = Math.PI / 3;
    aaBarrel.position.set(1.5, 0.8, 0);
    aaBarrel.castShadow = true;
    aaRotor.add(aaBarrel);
    animatedObjects.push({ type: 'aagun', mesh: aaRotor, time: 0 });

    // Command car
    var commandCar = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 2.2, 5.0),
      new THREE.MeshStandardMaterial({ color: 0x334455 })
    );
    commandCar.position.set(0, 1.0, -39.0);
    commandCar.castShadow = true;
    commandCar.receiveShadow = true;
    trainGroup.add(commandCar);

    var antennaArray = new THREE.Group();
    antennaArray.position.set(0, 3.2, -39.0);
    trainGroup.add(antennaArray);

    for (var i = 0; i < 3; i++) {
      var antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x555555 })
      );
      antenna.position.set(-0.6 + i * 0.6, 0, 0);
      antenna.castShadow = true;
      antennaArray.add(antenna);
    }

    var screen1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.6, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x001100, emissive: 0x00FF00, emissiveIntensity: 0.3 })
    );
    screen1.position.set(-0.7, 1.8, 2.4);
    trainGroup.add(screen1);

    var screen2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.6, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x001100, emissive: 0x00FF00, emissiveIntensity: 0.3 })
    );
    screen2.position.set(0.7, 1.8, 2.4);
    trainGroup.add(screen2);

    // Fuel/ammo car
    var fuelCar = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 5.0, 16),
      new THREE.MeshStandardMaterial({ color: 0x553322 })
    );
    fuelCar.rotation.z = Math.PI / 2;
    fuelCar.position.set(0, 1.2, -45.5);
    fuelCar.castShadow = true;
    fuelCar.receiveShadow = true;
    trainGroup.add(fuelCar);

    var cratePile = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.2, 2.0),
      new THREE.MeshStandardMaterial({ color: 0x663344 })
    );
    cratePile.position.set(0, 2.5, -45.5);
    cratePile.castShadow = true;
    cratePile.receiveShadow = true;
    trainGroup.add(cratePile);

    // Train tracks (parallel rails)
    var trackLeft = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-1.5, 0.0, 10),
        new THREE.Vector3(-1.5, 0.0, -55)
      ]),
      new THREE.LineBasicMaterial({ color: 0x666655, linewidth: 3 })
    );
    trainGroup.add(trackLeft);

    var trackRight = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(1.5, 0.0, 10),
        new THREE.Vector3(1.5, 0.0, -55)
      ]),
      new THREE.LineBasicMaterial({ color: 0x666655, linewidth: 3 })
    );
    trainGroup.add(trackRight);

    // Station platform
    var platform = new THREE.Mesh(
      new THREE.BoxGeometry(8.0, 0.6, 12.0),
      new THREE.MeshStandardMaterial({ color: 0x665544 })
    );
    platform.position.set(0, -0.3, -60);
    platform.castShadow = true;
    platform.receiveShadow = true;
    trainGroup.add(platform);

    // Mountain tunnel entrance
    var tunnelOpening = new THREE.Mesh(
      new THREE.BoxGeometry(6.0, 5.0, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x444433 })
    );
    tunnelOpening.position.set(0, 2.5, -80);
    tunnelOpening.castShadow = true;
    trainGroup.add(tunnelOpening);

    // Bridge crossing
    var bridgeSpan = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 0.8, 8.0),
      new THREE.MeshStandardMaterial({ color: 0x665544 })
    );
    bridgeSpan.position.set(0, 1.0, 25);
    bridgeSpan.castShadow = true;
    bridgeSpan.receiveShadow = true;
    trainGroup.add(bridgeSpan);

    var bridgeSupport1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 6.0, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x554433 })
    );
    bridgeSupport1.position.set(-2.2, -2.0, 25);
    bridgeSupport1.castShadow = true;
    trainGroup.add(bridgeSupport1);

    var bridgeSupport2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 6.0, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x554433 })
    );
    bridgeSupport2.position.set(2.2, -2.0, 25);
    bridgeSupport2.castShadow = true;
    trainGroup.add(bridgeSupport2);

    // Steam vents
    var vent1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, 2.0, 12),
      new THREE.MeshStandardMaterial({ color: 0x666655 })
    );
    vent1.position.set(-3.0, 0.5, 40);
    vent1.castShadow = true;
    trainGroup.add(vent1);

    var ventSteam1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xDDDDDD, transparent: true, opacity: 0.5 })
    );
    ventSteam1.position.set(-3.0, 2.8, 40);
    ventSteam1.scale.set(0.1, 0.1, 0.1);
    trainGroup.add(ventSteam1);
    animatedObjects.push({ type: 'ventsteam', mesh: ventSteam1, time: 0 });

    var vent2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, 2.0, 12),
      new THREE.MeshStandardMaterial({ color: 0x666655 })
    );
    vent2.position.set(3.0, 0.5, 45);
    vent2.castShadow = true;
    trainGroup.add(vent2);

    var ventSteam2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xDDDDDD, transparent: true, opacity: 0.5 })
    );
    ventSteam2.position.set(3.0, 2.8, 45);
    ventSteam2.scale.set(0.1, 0.1, 0.1);
    trainGroup.add(ventSteam2);
    animatedObjects.push({ type: 'ventsteam', mesh: ventSteam2, time: 0 });

    // Searchlight mounting
    var searchlightMount = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 2.0, 12),
      new THREE.MeshStandardMaterial({ color: 0x555544 })
    );
    searchlightMount.position.set(-2.5, 2.0, -70);
    searchlightMount.castShadow = true;
    trainGroup.add(searchlightMount);

    var searchlightRotor = new THREE.Group();
    searchlightRotor.position.set(-2.5, 3.0, -70);
    trainGroup.add(searchlightRotor);

    var searchlightLens = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xFFFF88, emissive: 0xFFFF00, emissiveIntensity: 0.4 })
    );
    searchlightLens.castShadow = true;
    searchlightRotor.add(searchlightLens);
    animatedObjects.push({ type: 'searchlight', mesh: searchlightRotor, time: 0 });

    // Enemy saboteur TNT on tracks
    var tntBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xAA2211, emissive: 0x551100, emissiveIntensity: 0.2 })
    );
    tntBox.position.set(0, 0.3, 5);
    tntBox.castShadow = true;
    tntBox.receiveShadow = true;
    trainGroup.add(tntBox);
    animatedObjects.push({ type: 'tnt', mesh: tntBox, time: 0 });

    return trainGroup;
  }

  function update(delta) {
    if (!trainGroup) {
      return;
    }

    // Train drifts slowly along z-axis
    trainGroup.position.z += delta * 0.5;

    // Update animated objects
    for (var i = 0; i < animatedObjects.length; i++) {
      var obj = animatedObjects[i];
      obj.time += delta;

      if (obj.type === 'steam') {
        var steamScale = 0.1 + Math.sin(obj.time * 3) * 0.08;
        obj.mesh.scale.set(steamScale, steamScale, steamScale);
      } else if (obj.type === 'turret') {
        obj.mesh.rotation.y = Math.sin(obj.time * 0.8) * (Math.PI / 4);
      } else if (obj.type === 'aagun') {
        obj.mesh.rotation.y = obj.time * 1.2;
      } else if (obj.type === 'ventsteam') {
        var ventScale = 0.1 + Math.sin(obj.time * 2.5) * 0.06;
        obj.mesh.scale.set(ventScale, ventScale, ventScale);
      } else if (obj.type === 'searchlight') {
        obj.mesh.rotation.y = Math.sin(obj.time * 1.5) * (Math.PI / 3);
      } else if (obj.type === 'tnt') {
        var tntIntensity = Math.abs(Math.sin(obj.time * 4)) > 0.5 ? 0.5 : 0.2;
        obj.mesh.material.emissiveIntensity = tntIntensity;
      }
    }
  }

  function reset() {
    if (trainGroup && scene) {
      scene.remove(trainGroup);
      trainGroup = null;
      animatedObjects = [];
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
