window.RustPalace = (function() {
  'use strict';

  var scene = null;
  var rustGroup = null;
  var chandeliers = [];
  var drippingWater = [];
  var thrones = [];
  var armorPieces = [];
  var time = 0;

  var buildWalls = function() {
    var wallMaterial = new THREE.MeshPhongMaterial({ color: 0xb8410e });

    var backWall = new THREE.Mesh(new THREE.BoxGeometry(60, 40, 2), wallMaterial);
    backWall.position.z = -25;
    rustGroup.add(backWall);

    var leftWall = new THREE.Mesh(new THREE.BoxGeometry(2, 40, 50), wallMaterial);
    leftWall.position.x = -30;
    rustGroup.add(leftWall);

    var rightWall = new THREE.Mesh(new THREE.BoxGeometry(2, 40, 50), wallMaterial);
    rightWall.position.x = 30;
    rustGroup.add(rightWall);

    var floor = new THREE.Mesh(new THREE.BoxGeometry(60, 1, 50), new THREE.MeshPhongMaterial({ color: 0x8b3a0e }));
    floor.position.y = -15;
    rustGroup.add(floor);
  };

  var buildThrones = function() {
    var throneBackMaterial = new THREE.MeshPhongMaterial({ color: 0xa0420f });
    var seatMaterial = new THREE.MeshPhongMaterial({ color: 0x9d3f0d });

    var createThrone = function(posX, posZ) {
      var throneGroup = new THREE.Group();

      var seat = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 6), seatMaterial);
      seat.position.y = 3;
      throneGroup.add(seat);

      var back = new THREE.Mesh(new THREE.BoxGeometry(6, 12, 1), throneBackMaterial);
      back.position.y = 10;
      back.position.z = -2.5;
      throneGroup.add(back);

      var armLeft = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 1), throneBackMaterial);
      armLeft.position.x = -3.5;
      armLeft.position.y = 6;
      throneGroup.add(armLeft);

      var armRight = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 1), throneBackMaterial);
      armRight.position.x = 3.5;
      armRight.position.y = 6;
      throneGroup.add(armRight);

      var legFront = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 1), throneBackMaterial);
      legFront.position.z = 2.5;
      legFront.position.y = 0;
      throneGroup.add(legFront);

      throneGroup.position.set(posX, -11, posZ);
      rustGroup.add(throneGroup);
      thrones.push(throneGroup);
    };

    createThrone(-12, -15);
    createThrone(12, -15);
  };

  var buildChandeliers = function() {
    var chandMaterial = new THREE.MeshPhongMaterial({ color: 0xc0430f });
    var candleMaterial = new THREE.MeshPhongMaterial({ color: 0xffeb3b });

    var createChandelier = function(posX, posZ) {
      var chandGroup = new THREE.Group();

      var main = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 8), chandMaterial);
      chandGroup.add(main);

      var candle1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 8), candleMaterial);
      candle1.position.set(1.5, -2, 0);
      chandGroup.add(candle1);

      var candle2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 8), candleMaterial);
      candle2.position.set(-1.5, -2, 0);
      chandGroup.add(candle2);

      var candle3 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 8), candleMaterial);
      candle3.position.set(0, -2, 1.5);
      chandGroup.add(candle3);

      var chain = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5, 6), chandMaterial);
      chain.position.y = 2.5;
      chandGroup.add(chain);

      chandGroup.position.set(posX, 15, posZ);
      rustGroup.add(chandGroup);
      chandeliers.push(chandGroup);
    };

    createChandelier(-15, -10);
    createChandelier(0, -5);
    createChandelier(15, -12);
  };

  var buildArmor = function() {
    var armorMaterial = new THREE.MeshPhongMaterial({ color: 0xa55a2a });

    var createArmorStand = function(posX, posZ) {
      var armorGroup = new THREE.Group();

      var helmet = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 12), armorMaterial);
      helmet.position.y = 6;
      armorGroup.add(helmet);

      var chest = new THREE.Mesh(new THREE.BoxGeometry(2.5, 4, 2), armorMaterial);
      chest.position.y = 2;
      armorGroup.add(chest);

      var armLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 8), armorMaterial);
      armLeft.position.set(-2, 2, 0);
      armLeft.rotation.z = Math.PI / 6;
      armorGroup.add(armLeft);

      var armRight = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 8), armorMaterial);
      armRight.position.set(2, 2, 0);
      armRight.rotation.z = -Math.PI / 6;
      armorGroup.add(armRight);

      var legLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 8), armorMaterial);
      legLeft.position.set(-1, -2, 0);
      armorGroup.add(legLeft);

      var legRight = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 8), armorMaterial);
      legRight.position.set(1, -2, 0);
      armorGroup.add(legRight);

      armorGroup.position.set(posX, -10, posZ);
      rustGroup.add(armorGroup);
      armorPieces.push(armorGroup);
    };

    createArmorStand(-20, 10);
    createArmorStand(20, 8);
  };

  var buildWaterDrops = function() {
    var waterMaterial = new THREE.MeshPhongMaterial({ color: 0xd4553c, emissive: 0x6b2c1c });

    var createWaterStream = function(posX, posZ, baseY) {
      var drops = [];
      for (var i = 0; i < 6; i++) {
        var drop = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), waterMaterial);
        drop.position.set(posX, baseY - i * 2, posZ);
        rustGroup.add(drop);
        drops.push({
          mesh: drop,
          startY: baseY,
          index: i
        });
      }
      drippingWater.push(drops);
    };

    createWaterStream(-15, -20, 18);
    createWaterStream(5, -22, 19);
    createWaterStream(18, -18, 17);
  };

  var buildCrumbling = function() {
    var crumbleMaterial = new THREE.MeshPhongMaterial({ color: 0x8b3a0e });

    var debris1 = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 8), crumbleMaterial);
    debris1.position.set(-10, -5, 0);
    debris1.rotation.z = 0.3;
    rustGroup.add(debris1);

    var debris2 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.2, 6, 8), crumbleMaterial);
    debris2.position.set(12, -8, 5);
    debris2.rotation.z = 0.5;
    rustGroup.add(debris2);

    var debris3 = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 5), crumbleMaterial);
    debris3.position.set(-5, -12, 12);
    debris3.rotation.x = 0.4;
    rustGroup.add(debris3);
  };

  var init = function(sceneRef, camera) {
    scene = sceneRef;
    rustGroup = new THREE.Group();
    scene.add(rustGroup);

    buildWalls();
    buildThrones();
    buildChandeliers();
    buildArmor();
    buildWaterDrops();
    buildCrumbling();

    scene.background = new THREE.Color(0x1a1a1a);
    var light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(20, 30, 10);
    scene.add(light);

    var ambientLight = new THREE.AmbientLight(0x8b7355, 0.4);
    scene.add(ambientLight);
  };

  var update = function(delta) {
    time += delta;

    for (var i = 0; i < chandeliers.length; i++) {
      chandeliers[i].rotation.x = Math.sin(time * 0.3) * 0.1;
      chandeliers[i].rotation.z = Math.cos(time * 0.25) * 0.08;
    }

    for (var j = 0; j < drippingWater.length; j++) {
      var drops = drippingWater[j];
      for (var k = 0; k < drops.length; k++) {
        var drop = drops[k];
        var waveY = Math.sin(time * 2 + drop.index) * 2;
        drop.mesh.position.y = drop.startY - drop.index * 2 + waveY;
      }
    }

    for (var t = 0; t < thrones.length; t++) {
      thrones[t].rotation.y = Math.sin(time * 0.1) * 0.05;
    }

    for (var a = 0; a < armorPieces.length; a++) {
      armorPieces[a].rotation.z = Math.sin(time * 0.15) * 0.06;
    }
  };

  var reset = function() {
    if (rustGroup && scene) {
      scene.remove(rustGroup);
      rustGroup = null;
      chandeliers = [];
      drippingWater = [];
      thrones = [];
      armorPieces = [];
      time = 0;
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
