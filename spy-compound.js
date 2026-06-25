window.SpyCompound = (function() {
  'use strict';

  var scene, camera, objects = {}, animations = [], hudElements = {}, keyPressLog = [], lastHPressTime = 0;

  function addBox(name, x, y, z, w, h, d, color, emissive) {
    var geom = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshStandardMaterial({ color: color || 0xffffff, emissive: emissive || 0x000000 });
    var mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects[name] = mesh;
    return mesh;
  }

  function addBoxOutline(name, x, y, z, w, h, d) {
    var geom = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
    var edges = new THREE.EdgesGeometry(geom);
    var line = new THREE.LineSegments(edges, mat);
    line.position.set(x, y, z);
    scene.add(line);
    return line;
  }

  function createCompound() {
    // 1. Compound ground — dark forest floor
    addBox('ground', 0, -0.15, 0, 400, 0.3, 400, 0x2a3a1a);

    // 2. Intelligence headquarters — large concrete box building
    var hq = addBox('hq', 0, 7.5, -30, 50, 15, 30, 0x708080);
    hq.castShadow = true;

    // 4. Server room wing — attached to HQ with emissive lights
    var serverRoom = addBox('serverRoom', 35, 5, -35, 15, 10, 12, 0x2a2a2a);
    addBox('serverRackLight1', 36, 6, -32, 3, 5, 1, 0x2a2a2a, 0x00ff00);
    addBox('serverRackLight2', 36, 6, -38, 3, 5, 1, 0x2a2a2a, 0x00ff00);

    // 9. Cipher machine room window — visible room with emissive screens
    var cipherRoom = addBox('cipherRoom', -40, 6, -25, 12, 8, 15, 0x3a3a2a);
    addBox('cipherScreen1', -38, 7, -20, 2, 3, 0.5, 0x1a1a1a, 0xff0000);
    addBox('cipherScreen2', -38, 7, -30, 2, 3, 0.5, 0x1a1a1a, 0xff0000);

    // 3. Satellite uplink towers — 3 lattice structures with dishes
    createSatelliteTower('tower1', -60, 0, 80, 0xff8800);
    createSatelliteTower('tower2', 60, 0, 80, 0xff8800);
    createSatelliteTower('tower3', 0, 0, 120, 0xff8800);

    // 10. Guard dog kennel
    var kennel = addBox('kennel', -50, 1, 30, 10, 4, 8, 0x8b4513);
    addBox('dog1', -48, 1.5, 28, 2, 2, 3, 0x3a2a1a);
    addBox('dog2', -52, 1.5, 32, 2, 2, 3, 0x3a2a1a);

    // 11. Perimeter fence — chain-link segments with razor wire
    createFenceSegment(-100, 0, 60);
    createFenceSegment(-100, 0, -60);
    createFenceSegment(100, 0, 60);
    createFenceSegment(100, 0, -60);

    // 12. Guard tower sentries — 3 elevated platforms
    createGuardTower('guardTower1', -80, 0, -50);
    createGuardTower('guardTower2', 80, 0, -50);
    createGuardTower('guardTower3', 0, 0, -100);

    // 13. Emergency shredder room
    var shredderRoom = addBox('shredderRoom', 45, 2, 20, 8, 6, 8, 0x5a4a3a);
    createShredderAnimation();

    // 14. Cold War era vehicles — 2 sedans, 1 military truck
    createSedanCar('sedan1', -70, 0.8, -80, 0x1a1a3a);
    createSedanCar('sedan2', -80, 0.8, -75, 0x2a1a1a);
    createMilitaryTruck('truck1', 70, 1, -85);

    // 15. Underground tunnel entrance
    createTunnelEntrance(-20, 0, 50);

    // 16. Radio antenna forest — 4 tall poles with cross-arms
    createAntennaPole('antenna1', -40, 0, -70, 0x404040);
    createAntennaPole('antenna2', -30, 0, -65, 0x404040);
    createAntennaPole('antenna3', 30, 0, -70, 0x404040);
    createAntennaPole('antenna4', 40, 0, -65, 0x404040);

    // 5. KGB counterintel agents — 5 closing in from perimeter
    createKGBAgent('kgb1', -85, 0.7, 40, 0);
    createKGBAgent('kgb2', 85, 0.7, 45, 1);
    createKGBAgent('kgb3', -75, 0.7, -90, 2);
    createKGBAgent('kgb4', 75, 0.7, -85, 3);
    createKGBAgent('kgb5', 0, 0.7, 130, 4);

    // 6. CIA operative figures — 3 blue-gray, one escorting defector
    createCIAOperative('cia1', -5, 0.7, -15, 0);
    createCIAOperative('cia2', 5, 0.7, -15, 1);
    createCIAOperative('cia3', -10, 0.7, -10, 2);

    // 7. Defector figure — civilian box, escorted toward extraction
    createDefector('defector', 0, 0.7, -5);

    // 8. Extraction helicopter — north landing zone
    createHelicopter('helicopter', -30, 5, 90);
  }

  function createSatelliteTower(name, x, y, z, color) {
    var baseHeight = 30;
    var strut1 = addBox(name + '_strut1', x - 3, y + baseHeight / 2, z, 1, baseHeight, 1, color);
    var strut2 = addBox(name + '_strut2', x + 3, y + baseHeight / 2, z, 1, baseHeight, 1, color);
    var strut3 = addBox(name + '_strut3', x, y + baseHeight / 2, z - 3, 1, baseHeight, 1, color);
    var strut4 = addBox(name + '_strut4', x, y + baseHeight / 2, z + 3, 1, baseHeight, 1, color);

    var dish = addBox(name + '_dish', x, y + baseHeight + 2, z, 8, 1, 8, 0xcccccc);
    dish.castShadow = true;

    animations.push({
      type: 'rotate',
      object: dish,
      axis: 'y',
      speed: 0.5
    });
  }

  function createFenceSegment(x, y, z) {
    var fence = addBox('fence_' + x + '_' + z, x, y + 2, z, 2, 4, 0.2, 0x333333);
    var razorWire = addBox('razorWire_' + x + '_' + z, x, y + 4.2, z, 2, 0.1, 0.1, 0xff0000);
  }

  function createGuardTower(name, x, y, z) {
    var platform = addBox(name + '_platform', x, y + 8, z, 6, 0.5, 6, 0x555555);
    var support1 = addBox(name + '_support1', x - 2.5, y + 4, z - 2.5, 0.5, 8, 0.5, 0x444444);
    var support2 = addBox(name + '_support2', x + 2.5, y + 4, z - 2.5, 0.5, 8, 0.5, 0x444444);
    var support3 = addBox(name + '_support3', x - 2.5, y + 4, z + 2.5, 0.5, 8, 0.5, 0x444444);
    var support4 = addBox(name + '_support4', x + 2.5, y + 4, z + 2.5, 0.5, 8, 0.5, 0x444444);

    var guard = addBox(name + '_guard', x, y + 8.5, z, 1, 1.5, 1, 0x1a1a1a);
    var spotlight = addBox(name + '_spotlight', x + 1, y + 9, z, 0.5, 0.5, 0.5, 0xffffcc, 0xffff00);

    animations.push({
      type: 'spotlightSweep',
      spotlight: spotlight,
      centerX: x,
      centerZ: z,
      radius: 50
    });
  }

  function createShredderAnimation() {
    var paper = addBox('shredderPaper', 45, 3, 20, 0.1, 0.5, 8, 0xeeeeee, 0xffaa00);
    animations.push({
      type: 'fall',
      object: paper,
      speed: 2,
      minY: 1,
      maxY: 5
    });
  }

  function createSedanCar(name, x, y, z, color) {
    var body = addBox(name + '_body', x, y + 1, z, 4, 2, 8, color);
    var roof = addBox(name + '_roof', x, y + 2.5, z, 3.5, 1, 4, color);
    addBox(name + '_wheel1', x - 1.5, y + 0.4, z - 2, 0.8, 0.8, 0.8, 0x000000);
    addBox(name + '_wheel2', x + 1.5, y + 0.4, z - 2, 0.8, 0.8, 0.8, 0x000000);
    addBox(name + '_wheel3', x - 1.5, y + 0.4, z + 2, 0.8, 0.8, 0.8, 0x000000);
    addBox(name + '_wheel4', x + 1.5, y + 0.4, z + 2, 0.8, 0.8, 0.8, 0x000000);
  }

  function createMilitaryTruck(name, x, y, z) {
    var cab = addBox(name + '_cab', x, y + 1.5, z, 3, 3, 4, 0x2a4a2a);
    var bed = addBox(name + '_bed', x, y + 1, z + 6, 4, 2, 8, 0x3a5a3a);
    addBox(name + '_wheel1', x - 2, y + 0.4, z - 1, 0.8, 0.8, 0.8, 0x000000);
    addBox(name + '_wheel2', x + 2, y + 0.4, z - 1, 0.8, 0.8, 0.8, 0x000000);
    addBox(name + '_wheel3', x - 2, y + 0.4, z + 6, 1, 1, 1, 0x000000);
    addBox(name + '_wheel4', x + 2, y + 0.4, z + 6, 1, 1, 1, 0x000000);
  }

  function createTunnelEntrance(x, y, z) {
    var hatch = addBox('tunnelHatch', x, y + 0.2, z, 4, 0.4, 4, 0x1a1a1a);
    var stair1 = addBox('tunnelStair1', x - 1, y - 1, z + 1, 2, 0.5, 2, 0x4a4a4a);
    var stair2 = addBox('tunnelStair2', x - 1, y - 2.5, z + 2.5, 2, 0.5, 2, 0x4a4a4a);
  }

  function createAntennaPole(name, x, y, z, color) {
    var pole = addBox(name + '_pole', x, y + 15, z, 0.5, 30, 0.5, color);
    var crossArm1 = addBox(name + '_arm1', x + 2, y + 15, z, 4, 0.3, 0.3, color);
    var crossArm2 = addBox(name + '_arm2', x, y + 15, z + 2, 0.3, 0.3, 4, color);

    var light = addBox(name + '_light', x, y + 30, z, 0.5, 0.5, 0.5, 0xffff00, 0xffff00);
    animations.push({
      type: 'blink',
      object: light,
      interval: 0.5
    });
  }

  function createKGBAgent(name, x, y, z, index) {
    var body = addBox(name + '_body', x, y + 1, z, 1.2, 2, 0.6, 0x1a1a1a);
    var head = addBox(name + '_head', x, y + 2.5, z, 0.8, 0.8, 0.8, 0x3a2a1a);
    var trench = addBox(name + '_trench', x, y + 0.8, z, 1.4, 1.5, 0.7, 0x2a1a1a);

    var targetX = -60 + index * 30;
    var targetZ = 30;

    animations.push({
      type: 'moveToward',
      object: body,
      targetX: targetX,
      targetZ: targetZ,
      speed: 0.3,
      children: [name + '_head', name + '_trench']
    });
  }

  function createCIAOperative(name, x, y, z, index) {
    var body = addBox(name + '_body', x, y + 1, z, 1, 2, 0.5, 0x4a5a7a);
    var head = addBox(name + '_head', x, y + 2.4, z, 0.7, 0.7, 0.7, 0x6a5a4a);
    var gear = addBox(name + '_gear', x - 0.4, y + 0.8, z, 0.3, 0.8, 0.4, 0x333333);
  }

  function createDefector(name, x, y, z) {
    var body = addBox(name + '_body', x, y + 0.9, z, 0.9, 1.8, 0.5, 0x8a7a6a);
    var head = addBox(name + '_head', x, y + 2.2, z, 0.6, 0.6, 0.6, 0x9a8a7a);
    var briefcase = addBox(name + '_case', x + 0.6, y + 0.7, z, 0.3, 0.5, 0.2, 0x3a1a1a);

    animations.push({
      type: 'moveToward',
      object: body,
      targetX: -25,
      targetZ: 95,
      speed: 0.4,
      children: [name + '_head', name + '_case']
    });
  }

  function createHelicopter(name, x, y, z) {
    var fuselage = addBox(name + '_fuselage', x, y, z, 6, 3, 12, 0x2a4a5a);
    var rotor = addBox(name + '_rotor', x, y + 2.5, z, 20, 0.2, 1, 0x3a5a6a);
    var tailRotor = addBox(name + '_tailRotor', x, y + 2, z + 7, 1, 0.2, 4, 0x3a5a6a);
    var skid1 = addBox(name + '_skid1', x - 4, y - 1.5, z - 3, 1, 0.3, 3, 0x1a1a1a);
    var skid2 = addBox(name + '_skid2', x + 4, y - 1.5, z - 3, 1, 0.3, 3, 0x1a1a1a);

    animations.push({
      type: 'rotate',
      object: rotor,
      axis: 'y',
      speed: 2
    });

    animations.push({
      type: 'rotate',
      object: tailRotor,
      axis: 'z',
      speed: 2.5
    });

    animations.push({
      type: 'helicopterLiftOff',
      fuselage: fuselage,
      startY: y,
      targetY: y + 40,
      speed: 2
    });
  }

  function createHUD() {
    var hudCanvas = document.createElement('canvas');
    hudCanvas.id = 'spyCompoundHUD';
    hudCanvas.style.position = 'absolute';
    hudCanvas.style.top = '20px';
    hudCanvas.style.left = '20px';
    hudCanvas.style.color = '#00ff00';
    hudCanvas.style.fontFamily = 'monospace';
    hudCanvas.style.fontSize = '14px';
    hudCanvas.style.zIndex = '1000';
    hudCanvas.textContent = 'DEFECTOR STATUS: MOVING\nKGB CLOSING IN: 5\nEXTRACTION: 60s';
    document.body.appendChild(hudCanvas);

    var div = document.createElement('div');
    div.id = 'spyCompoundHUDText';
    div.style.position = 'absolute';
    div.style.top = '20px';
    div.style.left = '20px';
    div.style.color = '#00ff00';
    div.style.fontFamily = 'monospace';
    div.style.fontSize = '14px';
    div.style.textShadow = '0 0 10px #00ff00';
    div.style.zIndex = '1000';
    div.innerHTML = 'DEFECTOR STATUS: MOVING<br/>KGB CLOSING IN: 5<br/>EXTRACTION: 60s';
    document.body.appendChild(div);

    hudElements.hud = div;
  }

  function handleHUDToggle(e) {
    if (e.key === 'h' || e.key === 'H') {
      var now = Date.now();
      if (now - lastHPressTime < 400) {
        keyPressLog.push('h');
        if (keyPressLog.length >= 2 && keyPressLog[keyPressLog.length - 1] === 'h' && keyPressLog[keyPressLog.length - 2] === 'h') {
          keyPressLog = [];
          document.addEventListener('keypress', function checkQ(e2) {
            if ((e2.key === 'q' || e2.key === 'Q') && Date.now() - now < 400) {
              if (hudElements.hud) {
                hudElements.hud.style.display = hudElements.hud.style.display === 'none' ? 'block' : 'none';
              }
              document.removeEventListener('keypress', checkQ);
            }
          });
        }
      }
      lastHPressTime = now;
    }
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 200, 400);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 60, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    createCompound();
    createHUD();

    document.addEventListener('keypress', handleHUDToggle);
  }

  function update(delta) {
    var i;
    for (i = 0; i < animations.length; i++) {
      var anim = animations[i];

      if (anim.type === 'rotate') {
        if (anim.axis === 'y') {
          anim.object.rotation.y += anim.speed * delta;
        } else if (anim.axis === 'z') {
          anim.object.rotation.z += anim.speed * delta;
        }
      }

      if (anim.type === 'moveToward') {
        var dx = anim.targetX - anim.object.position.x;
        var dz = anim.targetZ - anim.object.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0.5) {
          anim.object.position.x += (dx / dist) * anim.speed * delta;
          anim.object.position.z += (dz / dist) * anim.speed * delta;

          if (anim.children) {
            var j;
            for (j = 0; j < anim.children.length; j++) {
              var child = objects[anim.children[j]];
              if (child) {
                child.position.x += (dx / dist) * anim.speed * delta;
                child.position.z += (dz / dist) * anim.speed * delta;
              }
            }
          }
        }
      }

      if (anim.type === 'spotlightSweep') {
        anim.angle = (anim.angle || 0) + 1.5 * delta;
        anim.spotlight.position.x = anim.centerX + Math.cos(anim.angle) * anim.radius;
        anim.spotlight.position.z = anim.centerZ + Math.sin(anim.angle) * anim.radius;
      }

      if (anim.type === 'fall') {
        anim.object.position.y -= anim.speed * delta;
        if (anim.object.position.y <= anim.minY) {
          anim.object.position.y = anim.maxY;
        }
      }

      if (anim.type === 'blink') {
        anim.time = (anim.time || 0) + delta;
        if (anim.time > anim.interval) {
          anim.object.material.emissive.setHex(anim.object.material.emissive.getHex() === 0xffff00 ? 0x000000 : 0xffff00);
          anim.time = 0;
        }
      }

      if (anim.type === 'helicopterLiftOff') {
        if (anim.fuselage.position.y < anim.targetY) {
          anim.fuselage.position.y += anim.speed * delta;
        }
      }
    }
  }

  function reset() {
    var key;
    for (key in objects) {
      if (objects.hasOwnProperty(key)) {
        scene.remove(objects[key]);
      }
    }
    objects = {};
    animations = [];

    if (hudElements.hud) {
      hudElements.hud.parentNode.removeChild(hudElements.hud);
    }
    hudElements = {};

    document.removeEventListener('keypress', handleHUDToggle);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
