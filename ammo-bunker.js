window.AmmoBunker = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var bunkerGroup = null;
  var cranePosition = 0;
  var ventFanAngle = 0;
  var warningLightStates = [];

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    bunkerGroup = new THREE.Group();
    scene.add(bunkerGroup);

    // Underground bunker foundation - deep concrete floor
    var floorGeometry = new THREE.BoxGeometry(200, 0.5, 300);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -5;
    floor.castShadow = true;
    floor.receiveShadow = true;
    bunkerGroup.add(floor);

    // Yellow hazard striping on floor
    var stripeGeometry = new THREE.BoxGeometry(200, 0.051, 3);
    var stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.6 });
    for (var i = 0; i < 20; i++) {
      var stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.set(0, -4.98, -140 + i * 15);
      stripe.castShadow = true;
      stripe.receiveShadow = true;
      bunkerGroup.add(stripe);
    }

    // Concrete ceiling - heavily reinforced
    var ceilingGeometry = new THREE.BoxGeometry(200, 1.5, 300);
    var ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 });
    var ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.y = 25;
    ceiling.castShadow = true;
    ceiling.receiveShadow = true;
    bunkerGroup.add(ceiling);

    // North and south bunker walls - reinforced concrete
    var wallGeometry = new THREE.BoxGeometry(200, 25, 2);
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.85 });

    var northWall = new THREE.Mesh(wallGeometry, wallMaterial);
    northWall.position.set(0, 10, 150);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    bunkerGroup.add(northWall);

    var southWall = new THREE.Mesh(wallGeometry, wallMaterial);
    southWall.position.set(0, 10, -150);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    bunkerGroup.add(southWall);

    // East and west bunker walls
    var sideWallGeometry = new THREE.BoxGeometry(2, 25, 300);
    var eastWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    eastWall.position.set(100, 10, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    bunkerGroup.add(eastWall);

    var westWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    westWall.position.set(-100, 10, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    bunkerGroup.add(westWall);

    // Entrance blast doors - massive steel slabs
    var blastDoorGeometry = new THREE.BoxGeometry(40, 20, 2);
    var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.9, roughness: 0.2 });

    var leftDoor = new THREE.Mesh(blastDoorGeometry, doorMaterial);
    leftDoor.position.set(-25, 10, -145);
    leftDoor.castShadow = true;
    leftDoor.receiveShadow = true;
    bunkerGroup.add(leftDoor);

    var rightDoor = new THREE.Mesh(blastDoorGeometry, doorMaterial);
    rightDoor.position.set(25, 10, -145);
    rightDoor.castShadow = true;
    rightDoor.receiveShadow = true;
    bunkerGroup.add(rightDoor);

    // Entrance portal frame - thick reinforced concrete
    var portalGeometry = new THREE.BoxGeometry(95, 22, 3);
    var portalMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.85 });
    var portal = new THREE.Mesh(portalGeometry, portalMaterial);
    portal.position.set(0, 10, -148);
    portal.castShadow = true;
    portal.receiveShadow = true;
    bunkerGroup.add(portal);

    // Ammunition storage bay walls - lined with reinforcement
    var bayCount = 4;
    for (var b = 0; b < bayCount; b++) {
      var xOffset = -60 + b * 40;
      var bayWallGeometry = new THREE.BoxGeometry(35, 20, 2);
      var bayWallMaterial = new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.8 });

      var bayWall = new THREE.Mesh(bayWallGeometry, bayWallMaterial);
      bayWall.position.set(xOffset, 10, 0);
      bayWall.castShadow = true;
      bayWall.receiveShadow = true;
      bunkerGroup.add(bayWall);

      // Bay number marker
      var bayNumberGeometry = new THREE.BoxGeometry(3, 3, 0.2);
      var bayNumberMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
      var bayNumber = new THREE.Mesh(bayNumberGeometry, bayNumberMaterial);
      bayNumber.position.set(xOffset, 8, 1.5);
      bayNumber.castShadow = true;
      bunkerGroup.add(bayNumber);
    }

    // Artillery shell stacks - cylindrical shells
    var shellRadii = [0.4, 0.35, 0.3];
    for (var s = 0; s < 12; s++) {
      var shellX = -70 + (s % 4) * 30;
      var shellZ = -80 + Math.floor(s / 4) * 40;

      for (var r = 0; r < shellRadii.length; r++) {
        var shellGeometry = new THREE.CylinderGeometry(shellRadii[r], shellRadii[r], 2.5, 16);
        var shellMaterial = new THREE.MeshStandardMaterial({ color: 0xcc6600, metalness: 0.7, roughness: 0.3 });
        var shell = new THREE.Mesh(shellGeometry, shellMaterial);
        shell.position.set(shellX, -2.5 + r * 2.8, shellZ);
        shell.castShadow = true;
        shell.receiveShadow = true;
        bunkerGroup.add(shell);
      }
    }

    // Missile storage cradles - horizontal racks with missiles
    for (var m = 0; m < 6; m++) {
      var cradleX = 30 + m * 15;

      // Cradle frame
      var cradleGeometry = new THREE.BoxGeometry(12, 2, 3);
      var cradleMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });
      var cradle = new THREE.Mesh(cradleGeometry, cradleMaterial);
      cradle.position.set(cradleX, -1, 80);
      cradle.castShadow = true;
      cradle.receiveShadow = true;
      bunkerGroup.add(cradle);

      // Missile on cradle
      var missileGeometry = new THREE.CylinderGeometry(0.25, 0.3, 8, 12);
      var missileMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
      var missile = new THREE.Mesh(missileGeometry, missileMaterial);
      missile.rotation.z = Math.PI / 2;
      missile.position.set(cradleX, 1.5, 80);
      missile.castShadow = true;
      missile.receiveShadow = true;
      bunkerGroup.add(missile);

      // Missile nose cone
      var noseGeometry = new THREE.ConeGeometry(0.2, 1, 12);
      var noseMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.9 });
      var nose = new THREE.Mesh(noseGeometry, noseMaterial);
      nose.rotation.z = Math.PI / 2;
      nose.position.set(cradleX + 4.5, 1.5, 80);
      nose.castShadow = true;
      bunkerGroup.add(nose);
    }

    // Bomb carts - trolleys on tracks
    for (var c = 0; c < 4; c++) {
      var cartX = -50 + c * 35;

      var cartBodyGeometry = new THREE.BoxGeometry(8, 6, 4);
      var cartMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6 });
      var cartBody = new THREE.Mesh(cartBodyGeometry, cartMaterial);
      cartBody.position.set(cartX, 2, 30);
      cartBody.castShadow = true;
      cartBody.receiveShadow = true;
      bunkerGroup.add(cartBody);

      // Cart wheels
      for (var w = 0; w < 4; w++) {
        var wheelX = cartX - 3 + (w % 2) * 6;
        var wheelZ = 27 + Math.floor(w / 2) * 6;
        var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 16);
        var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
        var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wheelX, 0.8, wheelZ);
        wheel.castShadow = true;
        bunkerGroup.add(wheel);
      }
    }

    // Overhead crane rail system - I-beam structure
    var beamGeometry = new THREE.BoxGeometry(180, 1, 2);
    var beamMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8, roughness: 0.3 });
    var beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(0, 23, 0);
    beam.castShadow = true;
    beam.receiveShadow = true;
    bunkerGroup.add(beam);

    // Crane trolley
    var trolleyGeometry = new THREE.BoxGeometry(15, 1.5, 3);
    var trolleyMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7 });
    window.AmmoBunker.trolley = new THREE.Mesh(trolleyGeometry, trolleyMaterial);
    window.AmmoBunker.trolley.position.set(0, 22.5, 0);
    window.AmmoBunker.trolley.castShadow = true;
    window.AmmoBunker.trolley.receiveShadow = true;
    bunkerGroup.add(window.AmmoBunker.trolley);

    // Chain hoist - LineSegments
    var hookPoints = [
      new THREE.Vector3(0, 22, 0),
      new THREE.Vector3(0, 15, 0),
      new THREE.Vector3(0, 15, 0),
      new THREE.Vector3(0, 5, 0)
    ];
    var chainGeometry = new THREE.BufferGeometry().setFromPoints(hookPoints);
    var chainMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa, linewidth: 3 });
    var chainHoist = new THREE.LineSegments(chainGeometry, chainMaterial);
    bunkerGroup.add(chainHoist);

    // Ventilation ducts - overhead runs
    for (var d = 0; d < 3; d++) {
      var ductZ = -60 + d * 60;
      var ductGeometry = new THREE.BoxGeometry(150, 1.2, 1.2);
      var ductMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 });
      var duct = new THREE.Mesh(ductGeometry, ductMaterial);
      duct.position.set(0, 23.5, ductZ);
      duct.castShadow = true;
      duct.receiveShadow = true;
      bunkerGroup.add(duct);

      // Ventilation fan with spinning blades
      var fanX = 60;
      var fanGeometry = new THREE.CylinderGeometry(2, 2, 0.4, 16);
      var fanMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6 });
      window.AmmoBunker['fan' + d] = new THREE.Mesh(fanGeometry, fanMaterial);
      window.AmmoBunker['fan' + d].position.set(fanX, 24, ductZ);
      window.AmmoBunker['fan' + d].castShadow = true;
      bunkerGroup.add(window.AmmoBunker['fan' + d]);

      // Fan blades
      for (var blade = 0; blade < 3; blade++) {
        var bladeGeometry = new THREE.BoxGeometry(0.3, 1.8, 0.1);
        var bladeMaterial = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.5 });
        var blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.position.set(fanX, 24, ductZ);
        blade.rotation.y = (blade * Math.PI * 2) / 3;
        blade.castShadow = true;
        bunkerGroup.add(blade);
      }
    }

    // Dehumidifier units - boxed equipment
    for (var dehum = 0; dehum < 3; dehum++) {
      var dehumX = -70 + dehum * 70;
      var dehumGeometry = new THREE.BoxGeometry(6, 8, 4);
      var dehumMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.75 });
      var dehumUnit = new THREE.Mesh(dehumGeometry, dehumMaterial);
      dehumUnit.position.set(dehumX, 4, -120);
      dehumUnit.castShadow = true;
      dehumUnit.receiveShadow = true;
      bunkerGroup.add(dehumUnit);
    }

    // Emergency fire suppression heads - spheres
    var suppHeadCount = 0;
    for (var fx = -80; fx <= 80; fx += 30) {
      for (var fz = -120; fz <= 120; fz += 40) {
        var headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        var headMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600, metalness: 0.7 });
        var head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(fx, 23, fz);
        head.castShadow = true;
        bunkerGroup.add(head);
        suppHeadCount++;
      }
    }

    // Blast wall baffles - angled walls for protection
    for (var baf = 0; baf < 4; baf++) {
      var baffleZ = -100 + baf * 60;
      var baffleGeometry = new THREE.BoxGeometry(200, 4, 1);
      var baffleMaterial = new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.8 });
      var baffle = new THREE.Mesh(baffleGeometry, baffleMaterial);
      baffle.position.set(0, 2, baffleZ);
      baffle.rotation.z = Math.PI / 12;
      baffle.castShadow = true;
      baffle.receiveShadow = true;
      bunkerGroup.add(baffle);
    }

    // Electrical panel room
    var panelRoomGeometry = new THREE.BoxGeometry(15, 12, 8);
    var panelMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.8 });
    var panelRoom = new THREE.Mesh(panelRoomGeometry, panelMaterial);
    panelRoom.position.set(80, 6, -100);
    panelRoom.castShadow = true;
    panelRoom.receiveShadow = true;
    bunkerGroup.add(panelRoom);

    // Electrical panels inside room
    for (var panel = 0; panel < 4; panel++) {
      var panelX = 72 + (panel % 2) * 16;
      var panelY = 2 + Math.floor(panel / 2) * 8;
      var panelGeometry = new THREE.BoxGeometry(4, 6, 0.5);
      var panelInMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6 });
      var panelIn = new THREE.Mesh(panelGeometry, panelInMaterial);
      panelIn.position.set(panelX, panelY, -96);
      panelIn.castShadow = true;
      bunkerGroup.add(panelIn);
    }

    // Forklift - vehicle for moving supplies
    var forkX = -75;
    var forkY = 0.8;
    var forkZ = -50;

    // Forklift body
    var forkBodyGeometry = new THREE.BoxGeometry(3, 3, 5);
    var forkMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.6 });
    var forkBody = new THREE.Mesh(forkBodyGeometry, forkMaterial);
    forkBody.position.set(forkX, forkY + 1.5, forkZ);
    forkBody.castShadow = true;
    bunkerGroup.add(forkBody);

    // Forklift forks
    var forkTineGeometry = new THREE.BoxGeometry(0.3, 1.5, 3);
    for (var tine = 0; tine < 2; tine++) {
      var tineOffset = (tine - 0.5) * 1.2;
      var forkTine = new THREE.Mesh(forkTineGeometry, forkMaterial);
      forkTine.position.set(forkX + tineOffset, forkY, forkZ + 2);
      forkTine.castShadow = true;
      bunkerGroup.add(forkTine);
    }

    // Forklift wheels
    for (var fw = 0; fw < 4; fw++) {
      var fwX = forkX - 1 + (fw % 2) * 2;
      var fwZ = forkZ - 2 + Math.floor(fw / 2) * 4;
      var forkWheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.5, 12);
      var forkWheelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      var forkWheel = new THREE.Mesh(forkWheelGeometry, forkWheelMaterial);
      forkWheel.rotation.z = Math.PI / 2;
      forkWheel.position.set(fwX, 0.6, fwZ);
      forkWheel.castShadow = true;
      bunkerGroup.add(forkWheel);
    }

    // Pallet stacks of crates
    for (var pallet = 0; pallet < 8; pallet++) {
      var palletX = -60 + (pallet % 4) * 35;
      var palletZ = 100 + Math.floor(pallet / 4) * 20;

      for (var crate = 0; crate < 3; crate++) {
        var crateGeometry = new THREE.BoxGeometry(4, 3, 4);
        var crateMaterial = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.7 });
        var crate = new THREE.Mesh(crateGeometry, crateMaterial);
        crate.position.set(palletX, -2.5 + crate * 3.2, palletZ);
        crate.castShadow = true;
        crate.receiveShadow = true;
        bunkerGroup.add(crate);
      }
    }

    // Emergency exit lighting strips - bright indicators
    for (var exit = 0; exit < 6; exit++) {
      var exitZ = -130 + exit * 50;
      var lightStripGeometry = new THREE.BoxGeometry(200, 0.3, 0.3);
      var lightMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00 });
      var lightStrip = new THREE.Mesh(lightStripGeometry, lightMaterial);
      lightStrip.position.set(0, 23.5, exitZ);
      bunkerGroup.add(lightStrip);
    }

    // Warning beacon lights - pulsing red
    for (var beacon = 0; beacon < 4; beacon++) {
      var beaconX = -70 + beacon * 50;
      var beaconGeometry = new THREE.SphereGeometry(0.5, 12, 12);
      var beaconMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000 });
      var beaconLight = new THREE.Mesh(beaconGeometry, beaconMaterial);
      beaconLight.position.set(beaconX, 22, 120);
      beaconLight.castShadow = true;
      bunkerGroup.add(beaconLight);
      warningLightStates.push({ mesh: beaconLight, material: beaconMaterial });
    }

    // Tunnel connection walkway
    var walkwayGeometry = new THREE.BoxGeometry(8, 0.3, 150);
    var walkwayMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.75 });
    var walkway = new THREE.Mesh(walkwayGeometry, walkwayMaterial);
    walkway.position.set(0, -4.85, 0);
    walkway.castShadow = true;
    walkway.receiveShadow = true;
    bunkerGroup.add(walkway);
  };

  var update = function(delta) {
    if (!bunkerGroup || !window.AmmoBunker.trolley) return;

    // Crane traverse - slow back and forth movement
    cranePosition += delta * 15;
    var traverseAmount = Math.sin(cranePosition) * 80;
    window.AmmoBunker.trolley.position.x = traverseAmount;

    // Ventilation fan spin - continuous rotation
    ventFanAngle += delta * 8;
    for (var f = 0; f < 3; f++) {
      if (window.AmmoBunker['fan' + f]) {
        window.AmmoBunker['fan' + f].rotation.x = ventFanAngle;
      }
    }

    // Warning light pulse effect
    var pulseAmount = Math.sin(cranePosition * 2) * 0.5 + 0.5;
    for (var b = 0; b < warningLightStates.length; b++) {
      var beaconState = warningLightStates[b];
      var intensity = 0.5 + pulseAmount * 0.8;
      beaconState.material.emissiveIntensity = intensity;
    }
  };

  var reset = function() {
    cranePosition = 0;
    ventFanAngle = 0;
    warningLightStates = [];

    if (bunkerGroup && scene) {
      scene.remove(bunkerGroup);
    }

    bunkerGroup = null;
    window.AmmoBunker.trolley = null;
    for (var f = 0; f < 3; f++) {
      window.AmmoBunker['fan' + f] = null;
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
