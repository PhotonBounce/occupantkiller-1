var WarMemorial = (function() {
  'use strict';

  var scene = null;
  var objects = [];
  var animations = [];

  function createScene() {
    if (!scene) {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a2e);
      scene.fog = new THREE.Fog(0x1a1a2e, 200, 800);
    }
    return scene;
  }

  function createGraniteObelisk() {
    var geometry = new THREE.ConeGeometry(3, 25, 8);
    var material = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.7,
      metalness: 0.1
    });
    var obelisk = new THREE.Mesh(geometry, material);
    obelisk.position.set(0, 12.5, 0);
    obelisk.castShadow = true;
    obelisk.receiveShadow = true;
    scene.add(obelisk);
    objects.push(obelisk);
    return obelisk;
  }

  function createEternalFlame() {
    var geometry = new THREE.ConeGeometry(1, 3, 8);
    var material = new THREE.MeshBasicMaterial({
      color: 0xff6b00,
      wireframe: false
    });
    var flame = new THREE.Mesh(geometry, material);
    flame.position.set(0, 30, 0);
    flame.scale.set(1, 1, 1);
    scene.add(flame);
    objects.push(flame);

    animations.push({
      object: flame,
      property: 'scale',
      animate: function(time) {
        var scale = 1 + Math.sin(time * 0.005) * 0.3;
        this.object.scale.set(scale, scale, scale);
      }
    });

    return flame;
  }

  function createHelmetMemorials() {
    var helmets = [];
    var rows = 5;
    var cols = 6;
    var spacing = 4;
    var startX = -(cols - 1) * spacing / 2;
    var startZ = -(rows - 1) * spacing / 2;

    for (var i = 0; i < rows; i++) {
      for (var j = 0; j < cols; j++) {
        var helmetGeometry = new THREE.ConeGeometry(0.8, 0.5, 16);
        var helmetMaterial = new THREE.MeshStandardMaterial({
          color: 0x3d3d3d,
          roughness: 0.6,
          metalness: 0.4
        });
        var helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.set(
          startX + j * spacing,
          1,
          startZ + i * spacing
        );
        helmet.castShadow = true;
        helmet.receiveShadow = true;
        scene.add(helmet);
        objects.push(helmet);
        helmets.push(helmet);

        var rifleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
        var rifleMaterial = new THREE.MeshStandardMaterial({
          color: 0x2c2c2c,
          roughness: 0.7,
          metalness: 0.2
        });
        var rifle = new THREE.Mesh(rifleGeometry, rifleMaterial);
        rifle.position.set(
          startX + j * spacing,
          2.5,
          startZ + i * spacing
        );
        rifle.rotation.z = Math.PI / 6;
        rifle.castShadow = true;
        rifle.receiveShadow = true;
        scene.add(rifle);
        objects.push(rifle);
      }
    }

    return helmets;
  }

  function createStoneArchway() {
    var archwayGroup = new THREE.Group();

    var leftPillar = new THREE.BoxGeometry(2, 12, 2);
    var pillarMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.8,
      metalness: 0.05
    });
    var leftArch = new THREE.Mesh(leftPillar, pillarMaterial);
    leftArch.position.set(-8, 6, 0);
    leftArch.castShadow = true;
    leftArch.receiveShadow = true;
    archwayGroup.add(leftArch);

    var rightArch = new THREE.Mesh(leftPillar, pillarMaterial);
    rightArch.position.set(8, 6, 0);
    rightArch.castShadow = true;
    rightArch.receiveShadow = true;
    archwayGroup.add(rightArch);

    var topBeam = new THREE.BoxGeometry(18, 2, 2);
    var topBeamMesh = new THREE.Mesh(topBeam, pillarMaterial);
    topBeamMesh.position.set(0, 12, 0);
    topBeamMesh.castShadow = true;
    topBeamMesh.receiveShadow = true;
    archwayGroup.add(topBeamMesh);

    archwayGroup.position.set(0, 0, -30);
    scene.add(archway);
    objects.push(archwayGroup);

    return archwayGroup;
  }

  function createSunkenAmphitheaterSteps() {
    var stepsGroup = new THREE.Group();

    for (var i = 0; i < 8; i++) {
      var stepGeometry = new THREE.BoxGeometry(20 - i * 2, 0.5, 2);
      var stepMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.8,
        metalness: 0.05
      });
      var step = new THREE.Mesh(stepGeometry, stepMaterial);
      step.position.set(0, -1 - i * 1, 10 + i * 2);
      step.castShadow = true;
      step.receiveShadow = true;
      stepsGroup.add(step);
      objects.push(step);
    }

    stepsGroup.position.set(0, 0, 20);
    scene.add(stepsGroup);

    return stepsGroup;
  }

  function createBronzeStatuePedestal() {
    var pedestalGeometry = new THREE.BoxGeometry(4, 6, 4);
    var pedestalMaterial = new THREE.MeshStandardMaterial({
      color: 0x704214,
      roughness: 0.6,
      metalness: 0.5
    });
    var pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
    pedestal.position.set(15, 3, 0);
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    scene.add(pedestal);
    objects.push(pedestal);

    var statueGeometry = new THREE.ConeGeometry(1.5, 4, 12);
    var statueMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b6914,
      roughness: 0.5,
      metalness: 0.7
    });
    var statue = new THREE.Mesh(statueGeometry, statueMaterial);
    statue.position.set(15, 9, 0);
    statue.castShadow = true;
    statue.receiveShadow = true;
    scene.add(statue);
    objects.push(statue);

    return pedestal;
  }

  function createDedicationWall() {
    var wallGeometry = new THREE.BoxGeometry(12, 6, 0.5);
    var wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.9,
      metalness: 0.05
    });
    var wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(-15, 3, 0);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    objects.push(wall);

    return wall;
  }

  function createCannonReplicas() {
    var cannons = [];

    for (var i = 0; i < 2; i++) {
      var cannonBarrel = new THREE.CylinderGeometry(0.3, 0.35, 4, 12);
      var cannonMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.7,
        metalness: 0.8
      });
      var barrel = new THREE.Mesh(cannonBarrel, cannonMaterial);
      barrel.rotation.z = Math.PI / 6;
      barrel.position.set(-12 + i * 24, 2, -20);
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      scene.add(barrel);
      objects.push(barrel);
      cannons.push(barrel);

      var wheelGeometry = new THREE.CylinderGeometry(1, 1, 0.3, 16);
      var wheel = new THREE.Mesh(wheelGeometry, cannonMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(-12 + i * 24, 1, -20);
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      scene.add(wheel);
      objects.push(wheel);
    }

    return cannons;
  }

  function createMilitaryFlags() {
    var flags = [];

    for (var i = 0; i < 4; i++) {
      var poleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 8, 12);
      var poleMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.8,
        metalness: 0.3
      });
      var pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(-10 + i * 8, 4, 15);
      pole.castShadow = true;
      pole.receiveShadow = true;
      scene.add(pole);
      objects.push(pole);

      var flagGeometry = new THREE.BoxGeometry(2, 1.5, 0.05);
      var flagMaterial = new THREE.MeshStandardMaterial({
        color: 0xcc0000,
        roughness: 0.6,
        metalness: 0.1
      });
      var flag = new THREE.Mesh(flagGeometry, flagMaterial);
      flag.position.set(-10 + i * 8 + 1.5, 6.5, 15);
      flag.castShadow = true;
      flag.receiveShadow = true;
      scene.add(flag);
      objects.push(flag);
      flags.push(flag);

      (function(flagObj) {
        animations.push({
          object: flagObj,
          property: 'rotation',
          animate: function(time) {
            this.object.rotation.z = Math.sin(time * 0.003) * 0.2;
          }
        });
      })(flag);
    }

    return flags;
  }

  function createMemorialPoolWithWreaths() {
    var poolGeometry = new THREE.CylinderGeometry(5, 5, 0.5, 32);
    var poolMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3a4a,
      roughness: 0.3,
      metalness: 0.2
    });
    var pool = new THREE.Mesh(poolGeometry, poolMaterial);
    pool.position.set(0, 0.25, -25);
    pool.castShadow = true;
    pool.receiveShadow = true;
    scene.add(pool);
    objects.push(pool);

    var wreaths = [];
    for (var i = 0; i < 3; i++) {
      var wreathGeometry = new THREE.TorusGeometry(0.5, 0.15, 16, 32);
      var wreathMaterial = new THREE.MeshStandardMaterial({
        color: 0x228b22,
        roughness: 0.6,
        metalness: 0.05
      });
      var wreath = new THREE.Mesh(wreathGeometry, wreathMaterial);
      wreath.position.set(-2 + i * 2, 0.5, -25);
      wreath.rotation.x = Math.PI / 4;
      wreath.castShadow = true;
      wreath.receiveShadow = true;
      scene.add(wreath);
      objects.push(wreath);
      wreaths.push(wreath);

      (function(wreathObj, index) {
        animations.push({
          object: wreathObj,
          property: 'position',
          animate: function(time) {
            this.object.position.y = 0.5 + Math.sin(time * 0.002 + index * 2) * 0.3;
            this.object.position.x = -2 + index * 2 + Math.cos(time * 0.0015 + index) * 0.5;
          }
        });
      })(wreath, i);
    }

    return pool;
  }

  function createSpotlights() {
    var spotlights = [];

    for (var i = 0; i < 3; i++) {
      var light = new THREE.SpotLight(0xffffff, 100, 150, Math.PI / 4, 0.5, 1.5);
      light.position.set(-20 + i * 20, 30, -50);
      light.target.position.set(-20 + i * 20, 0, 0);
      light.castShadow = true;
      scene.add(light);
      scene.add(light.target);
      spotlights.push(light);

      (function(lightObj, index) {
        animations.push({
          object: lightObj,
          property: 'angle',
          animate: function(time) {
            var angle = Math.PI / 6 + Math.sin(time * 0.002 + index * 2) * Math.PI / 12;
            this.object.angle = angle;
          }
        });
      })(light, i);
    }

    return spotlights;
  }

  function createDecorativeElements() {
    var elements = [];

    var baseGeometry = new THREE.BoxGeometry(40, 0.5, 40);
    var baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.8,
      metalness: 0.05
    });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, -0.25, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    objects.push(base);
    elements.push(base);

    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var x = Math.cos(angle) * 18;
      var z = Math.sin(angle) * 18;

      var lightGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      var lightMaterial = new THREE.MeshStandardMaterial({
        color: 0xffff99,
        roughness: 0.4,
        metalness: 0.2,
        emissive: 0xffff00,
        emissiveIntensity: 0.5
      });
      var lightOrb = new THREE.Mesh(lightGeometry, lightMaterial);
      lightOrb.position.set(x, 4, z);
      lightOrb.castShadow = true;
      lightOrb.receiveShadow = true;
      scene.add(lightOrb);
      objects.push(lightOrb);
      elements.push(lightOrb);
    }

    return elements;
  }

  function init(sceneInput) {
    if (sceneInput) {
      scene = sceneInput;
    } else {
      createScene();
    }

    createGraniteObelisk();
    createEternalFlame();
    createHelmetMemorials();
    var archway = createStoneArchway();
    createSunkenAmphitheaterSteps();
    createBronzeStatuePedestal();
    createDedicationWall();
    createCannonReplicas();
    createMilitaryFlags();
    createMemorialPoolWithWreaths();
    createSpotlights();
    createDecorativeElements();

    return scene;
  }

  function update(time) {
    for (var i = 0; i < animations.length; i++) {
      if (animations[i].animate) {
        animations[i].animate(time);
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].parent) {
        objects[i].parent.remove(objects[i]);
      }
    }
    objects = [];
    animations = [];
    scene = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
