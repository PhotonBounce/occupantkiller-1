window.NeonDistrict = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animationState = {
    time: 0,
    neonFlicker: {},
    dronePaths: {},
    vehicleBob: {},
    holoRotate: {},
    streetShimmer: 0,
    clubPulse: 0
  };

  function init(inScene, inCamera) {
    scene = inScene;
    camera = inCamera;
    objects = [];
    animationState.time = 0;

    // Skyscraper blocks - tall dark buildings with neon window strips
    var skyscraper1 = new THREE.Group();
    var buildingGeom1 = new THREE.BoxGeometry(20, 80, 15);
    var buildingMat1 = new THREE.MeshStandardMaterial({ color: 0x1A1A2E });
    var building1 = new THREE.Mesh(buildingGeom1, buildingMat1);
    building1.position.set(-40, 40, -30);
    skyscraper1.add(building1);

    var windowStripGeom = new THREE.BoxGeometry(22, 3, 2);
    var windowStripMat = new THREE.MeshStandardMaterial({
      color: 0x00FFFF,
      emissive: 0x00FFFF,
      emissiveIntensity: 0.6
    });
    var windowStrip1 = new THREE.Mesh(windowStripGeom, windowStripMat);
    windowStrip1.position.set(-40, 30, -31);
    skyscraper1.add(windowStrip1);

    var windowStrip2 = new THREE.Mesh(windowStripGeom, windowStripMat);
    windowStrip2.position.set(-40, 50, -31);
    skyscraper1.add(windowStrip2);

    scene.add(skyscraper1);
    objects.push({ mesh: skyscraper1, type: 'building' });
    animationState.neonFlicker['building1'] = { intensity: 0.6, phase: Math.random() * Math.PI * 2 };

    // Skyscraper 2
    var skyscraper2 = new THREE.Group();
    var building2 = new THREE.Mesh(buildingGeom1, buildingMat1);
    building2.position.set(40, 40, -30);
    skyscraper2.add(building2);

    var windowStripMat2 = new THREE.MeshStandardMaterial({
      color: 0xFF0077,
      emissive: 0xFF0077,
      emissiveIntensity: 0.6
    });
    var windowStrip3 = new THREE.Mesh(windowStripGeom, windowStripMat2);
    windowStrip3.position.set(40, 30, -31);
    skyscraper2.add(windowStrip3);

    var windowStrip4 = new THREE.Mesh(windowStripGeom, windowStripMat2);
    windowStrip4.position.set(40, 50, -31);
    skyscraper2.add(windowStrip4);

    scene.add(skyscraper2);
    objects.push({ mesh: skyscraper2, type: 'building' });
    animationState.neonFlicker['building2'] = { intensity: 0.6, phase: Math.random() * Math.PI * 2 };

    // Neon sign billboards - alternating pink and cyan
    var billboardGroup = new THREE.Group();
    var billboardGeom = new THREE.BoxGeometry(25, 8, 1);

    var billboard1Mat = new THREE.MeshStandardMaterial({
      color: 0xFF0077,
      emissive: 0xFF0077,
      emissiveIntensity: 0.7
    });
    var billboard1 = new THREE.Mesh(billboardGeom, billboard1Mat);
    billboard1.position.set(-50, 50, 20);
    billboard1.rotation.y = Math.PI * 0.25;
    billboardGroup.add(billboard1);
    animationState.neonFlicker['billboard1'] = { intensity: 0.7, phase: Math.random() * Math.PI * 2 };

    var billboard2Mat = new THREE.MeshStandardMaterial({
      color: 0x00FFFF,
      emissive: 0x00FFFF,
      emissiveIntensity: 0.7
    });
    var billboard2 = new THREE.Mesh(billboardGeom, billboard2Mat);
    billboard2.position.set(50, 50, 20);
    billboard2.rotation.y = -Math.PI * 0.25;
    billboardGroup.add(billboard2);
    animationState.neonFlicker['billboard2'] = { intensity: 0.7, phase: Math.random() * Math.PI * 2 };

    scene.add(billboardGroup);
    objects.push({ mesh: billboardGroup, type: 'billboard' });

    // Rain-slicked street - wet ground with emissive reflections
    var streetGeom = new THREE.BoxGeometry(150, 0.5, 150);
    var streetMat = new THREE.MeshStandardMaterial({
      color: 0x111122,
      emissive: 0x222244,
      emissiveIntensity: 0.2,
      metalness: 0.8,
      roughness: 0.1
    });
    var street = new THREE.Mesh(streetGeom, streetMat);
    street.position.set(0, 0, 0);
    scene.add(street);
    objects.push({ mesh: street, type: 'street' });

    // Hovering vehicle platforms - slowly bobbing
    var vehicleGroup = new THREE.Group();
    var vehicleGeom = new THREE.BoxGeometry(12, 2, 8);
    var vehicleMat = new THREE.MeshStandardMaterial({ color: 0x223344 });

    var vehicle1 = new THREE.Mesh(vehicleGeom, vehicleMat);
    vehicle1.position.set(-20, 10, 0);
    vehicleGroup.add(vehicle1);
    animationState.vehicleBob['vehicle1'] = { baseY: 10, phase: 0 };

    var vehicle2 = new THREE.Mesh(vehicleGeom, vehicleMat);
    vehicle2.position.set(20, 12, 10);
    vehicleGroup.add(vehicle2);
    animationState.vehicleBob['vehicle2'] = { baseY: 12, phase: Math.PI * 0.5 };

    scene.add(vehicleGroup);
    objects.push({ mesh: vehicleGroup, type: 'vehicle' });

    // Holographic street advertising - rotating spheres with emissive
    var holoGroup = new THREE.Group();
    var holoGeom = new THREE.SphereGeometry(2, 16, 16);
    var holoMat = new THREE.MeshStandardMaterial({
      color: 0x00AAFF,
      emissive: 0x00AAFF,
      emissiveIntensity: 0.8,
      wireframe: true
    });

    var holo1 = new THREE.Mesh(holoGeom, holoMat);
    holo1.position.set(-30, 5, 30);
    holoGroup.add(holo1);
    animationState.holoRotate['holo1'] = { phase: 0, rotationSpeed: 1.5 };

    var holo2 = new THREE.Mesh(holoGeom, holoMat);
    holo2.position.set(30, 5, 30);
    holoGroup.add(holo2);
    animationState.holoRotate['holo2'] = { phase: Math.PI, rotationSpeed: 1.2 };

    scene.add(holoGroup);
    objects.push({ mesh: holoGroup, type: 'holo' });

    // Gang territory markers - spray-paint poles (CylinderGeometry)
    var gangGroup = new THREE.Group();
    var poleGeom = new THREE.CylinderGeometry(0.8, 0.8, 6, 8);
    var poleMat = new THREE.MeshStandardMaterial({ color: 0xFF2200 });

    var pole1 = new THREE.Mesh(poleGeom, poleMat);
    pole1.position.set(-35, 3, 20);
    gangGroup.add(pole1);

    var pole2 = new THREE.Mesh(poleGeom, poleMat);
    pole2.position.set(35, 3, 20);
    gangGroup.add(pole2);

    scene.add(gangGroup);
    objects.push({ mesh: gangGroup, type: 'gang' });

    // Underground club entrance - dark box with neon arch
    var clubGroup = new THREE.Group();
    var clubEntranceGeom = new THREE.BoxGeometry(10, 6, 3);
    var clubEntranceMat = new THREE.MeshStandardMaterial({ color: 0x330011 });
    var clubEntrance = new THREE.Mesh(clubEntranceGeom, clubEntranceMat);
    clubEntrance.position.set(0, 3, -40);
    clubGroup.add(clubEntrance);

    // Neon arch over entrance
    var archGeom = new THREE.CylinderGeometry(5, 5, 0.3, 16, 1, true);
    var archMat = new THREE.MeshStandardMaterial({
      color: 0xFF00AA,
      emissive: 0xFF00AA,
      emissiveIntensity: 0.8
    });
    var arch = new THREE.Mesh(archGeom, archMat);
    arch.position.set(0, 6, -40);
    clubGroup.add(arch);

    scene.add(clubGroup);
    objects.push({ mesh: clubGroup, type: 'club' });
    animationState.clubPulse = { intensity: 0.8, phase: 0 };

    // Black market stalls - boxes with colorful goods
    var stallGroup = new THREE.Group();
    var stallGeom = new THREE.BoxGeometry(4, 3, 4);

    var stallColors = [0xFF6699, 0x00DD99, 0xFFAA00, 0x6600FF];
    var stallPositions = [[-15, 1.5, 50], [0, 1.5, 52], [15, 1.5, 50], [-7, 1.5, 58]];

    for (var i = 0; i < stallPositions.length; i++) {
      var stallMat = new THREE.MeshStandardMaterial({
        color: stallColors[i],
        emissive: stallColors[i],
        emissiveIntensity: 0.5
      });
      var stall = new THREE.Mesh(stallGeom, stallMat);
      stall.position.set(stallPositions[i][0], stallPositions[i][1], stallPositions[i][2]);
      stallGroup.add(stall);
      animationState.neonFlicker['stall' + i] = { intensity: 0.5, phase: Math.random() * Math.PI * 2 };
    }

    scene.add(stallGroup);
    objects.push({ mesh: stallGroup, type: 'stall' });

    // Police drone patrols - sphere with blue light, orbiting
    var droneGroup = new THREE.Group();
    var droneGeom = new THREE.SphereGeometry(1.5, 12, 12);
    var droneMat = new THREE.MeshStandardMaterial({
      color: 0x334455,
      emissive: 0x0000FF,
      emissiveIntensity: 0.6
    });

    var drone1 = new THREE.Mesh(droneGeom, droneMat);
    drone1.position.set(25, 30, 0);
    droneGroup.add(drone1);
    animationState.dronePaths['drone1'] = { centerX: 25, centerZ: 0, radius: 15, phase: 0, speed: 0.5 };

    var drone2 = new THREE.Mesh(droneGeom, droneMat);
    drone2.position.set(-25, 35, 10);
    droneGroup.add(drone2);
    animationState.dronePaths['drone2'] = { centerX: -25, centerZ: 10, radius: 12, phase: Math.PI, speed: 0.4 };

    scene.add(droneGroup);
    objects.push({ mesh: droneGroup, type: 'drone' });

    // Electrical junction box - with sparking effect
    var junctionGeom = new THREE.BoxGeometry(2, 3, 2);
    var junctionMat = new THREE.MeshStandardMaterial({ color: 0x333322 });
    var junction = new THREE.Mesh(junctionGeom, junctionMat);
    junction.position.set(-50, 1.5, 0);
    scene.add(junction);
    objects.push({ mesh: junction, type: 'junction' });

    // Sparking effect - yellow lines
    var sparkGeom = new THREE.BufferGeometry();
    var sparkPositions = new Float32Array([
      -50, 4, 0,   -49, 5, 1,
      -50, 4, 0,   -51, 5, -1,
      -50, 4, 0,   -50, 5.5, 0
    ]);
    sparkGeom.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    var sparkMat = new THREE.LineBasicMaterial({ color: 0xFFFF00, linewidth: 2 });
    var sparks = new THREE.LineSegments(sparkGeom, sparkMat);
    scene.add(sparks);
    objects.push({ mesh: sparks, type: 'sparks' });

    // Rooftop sniper nest
    var rooftopGeom = new THREE.BoxGeometry(6, 1, 6);
    var rooftopMat = new THREE.MeshStandardMaterial({ color: 0x1A1A1A });
    var rooftop = new THREE.Mesh(rooftopGeom, rooftopMat);
    rooftop.position.set(40, 81, -30);
    scene.add(rooftop);
    objects.push({ mesh: rooftop, type: 'rooftop' });

    // Street food vendor carts - with warm light
    var vendorGroup = new THREE.Group();
    var cartGeom = new THREE.BoxGeometry(3, 2, 3);
    var cartMat = new THREE.MeshStandardMaterial({ color: 0x884422 });

    var cart1 = new THREE.Mesh(cartGeom, cartMat);
    cart1.position.set(-25, 1, -50);
    vendorGroup.add(cart1);

    var lightGeom = new THREE.BoxGeometry(4, 0.5, 0.5);
    var lightMat = new THREE.MeshStandardMaterial({
      color: 0xFFAA44,
      emissive: 0xFFAA44,
      emissiveIntensity: 0.6
    });
    var light1 = new THREE.Mesh(lightGeom, lightMat);
    light1.position.set(-25, 3, -50);
    vendorGroup.add(light1);
    animationState.neonFlicker['vendor1'] = { intensity: 0.6, phase: Math.random() * Math.PI * 2 };

    var cart2 = new THREE.Mesh(cartGeom, cartMat);
    cart2.position.set(25, 1, -50);
    vendorGroup.add(cart2);

    var light2 = new THREE.Mesh(lightGeom, lightMat);
    light2.position.set(25, 3, -50);
    vendorGroup.add(light2);
    animationState.neonFlicker['vendor2'] = { intensity: 0.6, phase: Math.random() * Math.PI * 2 };

    scene.add(vendorGroup);
    objects.push({ mesh: vendorGroup, type: 'vendor' });

    // Back alley escape routes - narrow corridors
    var alleyGroup = new THREE.Group();
    var alleyGeom = new THREE.BoxGeometry(4, 6, 20);
    var alleyMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

    var alley1 = new THREE.Mesh(alleyGeom, alleyMat);
    alley1.position.set(-60, 3, 0);
    alleyGroup.add(alley1);

    var alley2 = new THREE.Mesh(alleyGeom, alleyMat);
    alley2.position.set(60, 3, 0);
    alleyGroup.add(alley2);

    scene.add(alleyGroup);
    objects.push({ mesh: alleyGroup, type: 'alley' });

    // Cyberpunk graffiti art wall - dark wall with emissive art lines
    var graffGroup = new THREE.Group();
    var wallGeom = new THREE.BoxGeometry(30, 8, 0.5);
    var wallMat = new THREE.MeshStandardMaterial({ color: 0x221122 });
    var wall = new THREE.Mesh(wallGeom, wallMat);
    wall.position.set(-75, 4, 0);
    graffGroup.add(wall);

    // Graffiti art lines
    var graffGeom = new THREE.BufferGeometry();
    var graffPositions = new Float32Array([
      -75, 0, 1,    -75, 3, 1,
      -75, 3, 1,    -70, 5, 1,
      -70, 5, 1,    -80, 7, 1,
      -80, 2, 1,    -65, 2, 1,
      -65, 2, 1,    -70, 6, 1
    ]);
    graffGeom.setAttribute('position', new THREE.BufferAttribute(graffPositions, 3));
    var graffMat = new THREE.LineBasicMaterial({
      color: 0xFF1493,
      emissive: 0xFF1493,
      emissiveIntensity: 0.7,
      linewidth: 3
    });
    var graffArt = new THREE.LineSegments(graffGeom, graffMat);
    graffGroup.add(graffArt);

    scene.add(graffGroup);
    objects.push({ mesh: graffGroup, type: 'graffiti' });
  }

  function update(delta) {
    animationState.time += delta;

    // Neon signs flicker - oscillate emissive intensity independently
    var flickerSpeed = 8;
    for (var key in animationState.neonFlicker) {
      if (animationState.neonFlicker.hasOwnProperty(key)) {
        var flick = animationState.neonFlicker[key];
        flick.phase += flickerSpeed * delta;
        flick.intensity = 0.4 + 0.4 * Math.sin(flick.phase + Math.random() * 0.5);

        // Apply to materials
        if (key.indexOf('building') === 0) {
          for (var i = 0; i < objects.length; i++) {
            if (objects[i].type === 'building') {
              var children = objects[i].mesh.children;
              for (var j = 1; j < children.length; j++) {
                if (children[j].material && children[j].material.emissiveIntensity !== undefined) {
                  children[j].material.emissiveIntensity = flick.intensity;
                }
              }
            }
          }
        }
        if (key.indexOf('billboard') === 0) {
          for (var i = 0; i < objects.length; i++) {
            if (objects[i].type === 'billboard') {
              var children = objects[i].mesh.children;
              for (var j = 0; j < children.length; j++) {
                if (children[j].material && children[j].material.emissiveIntensity !== undefined) {
                  children[j].material.emissiveIntensity = flick.intensity;
                }
              }
            }
          }
        }
        if (key.indexOf('stall') === 0) {
          for (var i = 0; i < objects.length; i++) {
            if (objects[i].type === 'stall') {
              var children = objects[i].mesh.children;
              for (var j = 0; j < children.length; j++) {
                if (children[j].material && children[j].material.emissiveIntensity !== undefined) {
                  children[j].material.emissiveIntensity = flick.intensity;
                }
              }
            }
          }
        }
        if (key.indexOf('vendor') === 0) {
          for (var i = 0; i < objects.length; i++) {
            if (objects[i].type === 'vendor') {
              var children = objects[i].mesh.children;
              for (var j = 0; j < children.length; j++) {
                if (children[j].material && children[j].material.emissiveIntensity !== undefined) {
                  if (children[j].material.emissiveIntensity > 0.5) {
                    children[j].material.emissiveIntensity = flick.intensity;
                  }
                }
              }
            }
          }
        }
      }
    }

    // Police drones orbit
    for (var key in animationState.dronePaths) {
      if (animationState.dronePaths.hasOwnProperty(key)) {
        var path = animationState.dronePaths[key];
        path.phase += path.speed * delta;
        var droneX = path.centerX + path.radius * Math.cos(path.phase);
        var droneZ = path.centerZ + path.radius * Math.sin(path.phase);

        for (var i = 0; i < objects.length; i++) {
          if (objects[i].type === 'drone') {
            var children = objects[i].mesh.children;
            var droneIndex = key === 'drone1' ? 0 : 1;
            if (children[droneIndex]) {
              children[droneIndex].position.x = droneX;
              children[droneIndex].position.z = droneZ;
            }
          }
        }
      }
    }

    // Holographic ads rotate and shimmer
    for (var key in animationState.holoRotate) {
      if (animationState.holoRotate.hasOwnProperty(key)) {
        var holo = animationState.holoRotate[key];
        holo.phase += holo.rotationSpeed * delta;

        for (var i = 0; i < objects.length; i++) {
          if (objects[i].type === 'holo') {
            var children = objects[i].mesh.children;
            var holoIndex = key === 'holo1' ? 0 : 1;
            if (children[holoIndex]) {
              children[holoIndex].rotation.x += 0.8 * delta;
              children[holoIndex].rotation.y += 1.2 * delta;
              children[holoIndex].rotation.z += 0.6 * delta;
              if (children[holoIndex].material) {
                children[holoIndex].material.emissiveIntensity = 0.5 + 0.3 * Math.sin(holo.phase);
              }
            }
          }
        }
      }
    }

    // Hovering vehicles bob
    for (var key in animationState.vehicleBob) {
      if (animationState.vehicleBob.hasOwnProperty(key)) {
        var bob = animationState.vehicleBob[key];
        bob.phase += 1.5 * delta;
        var bobAmount = bob.baseY + 2 * Math.sin(bob.phase);

        for (var i = 0; i < objects.length; i++) {
          if (objects[i].type === 'vehicle') {
            var children = objects[i].mesh.children;
            var vehicleIndex = key === 'vehicle1' ? 0 : 1;
            if (children[vehicleIndex]) {
              children[vehicleIndex].position.y = bobAmount;
            }
          }
        }
      }
    }

    // Rain reflections shimmer on street
    animationState.streetShimmer += 2 * delta;
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].type === 'street') {
        if (objects[i].mesh.material) {
          objects[i].mesh.material.emissiveIntensity = 0.2 + 0.1 * Math.sin(animationState.streetShimmer);
        }
      }
    }

    // Underground club pulses with music beat (~2Hz)
    animationState.clubPulse.phase += 2 * Math.PI * 2 * delta;
    var clubIntensity = 0.4 + 0.4 * Math.sin(animationState.clubPulse.phase);
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].type === 'club') {
        var children = objects[i].mesh.children;
        for (var j = 0; j < children.length; j++) {
          if (children[j].material && children[j].material.emissive) {
            if (children[j].material.color.r > 0.5) {
              children[j].material.emissiveIntensity = clubIntensity;
            }
          }
        }
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].mesh && objects[i].mesh.parent) {
        objects[i].mesh.parent.remove(objects[i].mesh);
      }
    }
    objects = [];
    animationState.time = 0;
    animationState.neonFlicker = {};
    animationState.dronePaths = {};
    animationState.vehicleBob = {};
    animationState.holoRotate = {};
    animationState.streetShimmer = 0;
    animationState.clubPulse = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
