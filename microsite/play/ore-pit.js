window.OrePit = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var excavatorBucket = null;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        buildPitTerracing();
        buildExcavators();
        buildOreVeins();
        buildHaulRoad();
        buildProcessingPlant();
        buildControlCenter();
        buildDefenses();
        buildSurveyMarkers();
        setupLighting();
    }

    function buildPitTerracing() {
        var colors = [0x8B4513, 0x996633, 0xA0522D, 0x8B5A2B, 0x654321];
        var level5 = new THREE.Mesh(
            new THREE.BoxGeometry(200, 15, 200),
            new THREE.MeshLambertMaterial({ color: colors[0] })
        );
        level5.position.y = 0;
        level5.position.z = 0;
        scene.add(level5);
        objects.push(level5);

        var level4 = new THREE.Mesh(
            new THREE.BoxGeometry(160, 15, 160),
            new THREE.MeshLambertMaterial({ color: colors[1] })
        );
        level4.position.y = 20;
        scene.add(level4);
        objects.push(level4);

        var level3 = new THREE.Mesh(
            new THREE.BoxGeometry(120, 15, 120),
            new THREE.MeshLambertMaterial({ color: colors[2] })
        );
        level3.position.y = 40;
        scene.add(level3);
        objects.push(level3);

        var level2 = new THREE.Mesh(
            new THREE.BoxGeometry(80, 15, 80),
            new THREE.MeshLambertMaterial({ color: colors[3] })
        );
        level2.position.y = 60;
        scene.add(level2);
        objects.push(level2);

        var level1 = new THREE.Mesh(
            new THREE.BoxGeometry(40, 20, 40),
            new THREE.MeshLambertMaterial({ color: colors[4] })
        );
        level1.position.y = 80;
        scene.add(level1);
        objects.push(level1);

        var edge5a = new THREE.Mesh(
            new THREE.BoxGeometry(200, 18, 10),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        edge5a.position.y = -8;
        edge5a.position.z = 105;
        scene.add(edge5a);
        objects.push(edge5a);

        var edge5b = new THREE.Mesh(
            new THREE.BoxGeometry(200, 18, 10),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        edge5b.position.y = -8;
        edge5b.position.z = -105;
        scene.add(edge5b);
        objects.push(edge5b);

        var edge5c = new THREE.Mesh(
            new THREE.BoxGeometry(10, 18, 200),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        edge5c.position.y = -8;
        edge5c.position.x = 105;
        scene.add(edge5c);
        objects.push(edge5c);

        var edge5d = new THREE.Mesh(
            new THREE.BoxGeometry(10, 18, 200),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        edge5d.position.y = -8;
        edge5d.position.x = -105;
        scene.add(edge5d);
        objects.push(edge5d);

        var edge4a = new THREE.Mesh(
            new THREE.BoxGeometry(160, 18, 10),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        edge4a.position.y = 12;
        edge4a.position.z = 85;
        scene.add(edge4a);
        objects.push(edge4a);

        var edge4b = new THREE.Mesh(
            new THREE.BoxGeometry(160, 18, 10),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        edge4b.position.y = 12;
        edge4b.position.z = -85;
        scene.add(edge4b);
        objects.push(edge4b);

        var edge3a = new THREE.Mesh(
            new THREE.BoxGeometry(120, 18, 10),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        edge3a.position.y = 32;
        edge3a.position.z = 65;
        scene.add(edge3a);
        objects.push(edge3a);

        var edge2a = new THREE.Mesh(
            new THREE.BoxGeometry(80, 18, 10),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        edge2a.position.y = 52;
        edge2a.position.z = 45;
        scene.add(edge2a);
        objects.push(edge2a);
    }

    function buildExcavators() {
        var cabGeometry = new THREE.BoxGeometry(15, 12, 20);
        var cabMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var cab = new THREE.Mesh(cabGeometry, cabMaterial);
        cab.position.set(-60, 30, -50);
        scene.add(cab);
        objects.push(cab);

        var baseGeometry = new THREE.BoxGeometry(25, 8, 30);
        var baseMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(-60, 12, -50);
        scene.add(base);
        objects.push(base);

        var boomGeometry = new THREE.BoxGeometry(8, 8, 50);
        var boomMaterial = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var boom = new THREE.Mesh(boomGeometry, boomMaterial);
        boom.position.set(-60, 35, -30);
        boom.rotation.z = -0.3;
        scene.add(boom);
        objects.push(boom);

        var stickGeometry = new THREE.BoxGeometry(6, 6, 35);
        var stickMaterial = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var stick = new THREE.Mesh(stickGeometry, stickMaterial);
        stick.position.set(-60, 25, -5);
        stick.rotation.z = -0.4;
        scene.add(stick);
        objects.push(stick);

        var wheelGeometry = new THREE.CylinderGeometry(8, 8, 6, 16);
        var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var wheel1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel1.position.set(-75, 8, -40);
        wheel1.rotation.z = Math.PI / 2;
        scene.add(wheel1);
        objects.push(wheel1);

        var wheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel2.position.set(-75, 8, -60);
        wheel2.rotation.z = Math.PI / 2;
        scene.add(wheel2);
        objects.push(wheel2);

        var wheel3 = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel3.position.set(-45, 8, -40);
        wheel3.rotation.z = Math.PI / 2;
        scene.add(wheel3);
        objects.push(wheel3);

        var wheel4 = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel4.position.set(-45, 8, -60);
        wheel4.rotation.z = Math.PI / 2;
        scene.add(wheel4);
        objects.push(wheel4);

        var bucketGeometry = new THREE.BoxGeometry(18, 14, 16);
        var bucketMaterial = new THREE.MeshLambertMaterial({ color: 0xCD5C5C });
        excavatorBucket = new THREE.Mesh(bucketGeometry, bucketMaterial);
        excavatorBucket.position.set(-60, 18, 15);
        scene.add(excavatorBucket);
        objects.push(excavatorBucket);

        var excavator2Cab = new THREE.Mesh(cabGeometry, cabMaterial);
        excavator2Cab.position.set(50, 30, 60);
        scene.add(excavator2Cab);
        objects.push(excavator2Cab);

        var excavator2Base = new THREE.Mesh(baseGeometry, baseMaterial);
        excavator2Base.position.set(50, 12, 60);
        scene.add(excavator2Base);
        objects.push(excavator2Base);

        var excavator2Boom = new THREE.Mesh(boomGeometry, boomMaterial);
        excavator2Boom.position.set(50, 35, 80);
        excavator2Boom.rotation.z = -0.2;
        scene.add(excavator2Boom);
        objects.push(excavator2Boom);
    }

    function buildOreVeins() {
        var veinMaterial = new THREE.MeshLambertMaterial({ color: 0xD2691E });
        var vein1 = new THREE.Mesh(
            new THREE.BoxGeometry(160, 20, 8),
            veinMaterial
        );
        vein1.position.set(0, 35, 82);
        scene.add(vein1);
        objects.push(vein1);

        var vein2 = new THREE.Mesh(
            new THREE.BoxGeometry(160, 20, 8),
            veinMaterial
        );
        vein2.position.set(0, 25, 82);
        scene.add(vein2);
        objects.push(vein2);

        var vein3 = new THREE.Mesh(
            new THREE.BoxGeometry(10, 30, 160),
            veinMaterial
        );
        vein3.position.set(82, 30, 0);
        scene.add(vein3);
        objects.push(vein3);

        var vein4 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 25, 120),
            veinMaterial
        );
        vein4.position.set(62, 50, 0);
        scene.add(vein4);
        objects.push(vein4);

        var vein5 = new THREE.Mesh(
            new THREE.BoxGeometry(120, 18, 8),
            veinMaterial
        );
        vein5.position.set(0, 45, 62);
        scene.add(vein5);
        objects.push(vein5);
    }

    function buildHaulRoad() {
        var rampMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var ramp1 = new THREE.Mesh(
            new THREE.BoxGeometry(80, 8, 100),
            rampMaterial
        );
        ramp1.position.set(0, 10, 0);
        ramp1.rotation.z = -0.15;
        scene.add(ramp1);
        objects.push(ramp1);

        var ramp2 = new THREE.Mesh(
            new THREE.BoxGeometry(70, 8, 90),
            rampMaterial
        );
        ramp2.position.set(-30, 28, 20);
        ramp2.rotation.z = -0.15;
        scene.add(ramp2);
        objects.push(ramp2);

        var ramp3 = new THREE.Mesh(
            new THREE.BoxGeometry(60, 8, 80),
            rampMaterial
        );
        ramp3.position.set(-50, 46, 40);
        ramp3.rotation.z = -0.15;
        scene.add(ramp3);
        objects.push(ramp3);

        var ramp4 = new THREE.Mesh(
            new THREE.BoxGeometry(50, 8, 70),
            rampMaterial
        );
        ramp4.position.set(-60, 64, 60);
        ramp4.rotation.z = -0.15;
        scene.add(ramp4);
        objects.push(ramp4);

        var truck1Body = new THREE.Mesh(
            new THREE.BoxGeometry(20, 15, 40),
            new THREE.MeshLambertMaterial({ color: 0xDAA520 })
        );
        truck1Body.position.set(0, 25, 30);
        scene.add(truck1Body);
        objects.push(truck1Body);

        var truck1Wheel1 = new THREE.Mesh(
            new THREE.CylinderGeometry(6, 6, 5, 12),
            new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
        );
        truck1Wheel1.position.set(-12, 9, 15);
        truck1Wheel1.rotation.z = Math.PI / 2;
        scene.add(truck1Wheel1);
        objects.push(truck1Wheel1);

        var truck1Wheel2 = new THREE.Mesh(
            new THREE.CylinderGeometry(6, 6, 5, 12),
            new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
        );
        truck1Wheel2.position.set(12, 9, 15);
        truck1Wheel2.rotation.z = Math.PI / 2;
        scene.add(truck1Wheel2);
        objects.push(truck1Wheel2);

        var truck1Wheel3 = new THREE.Mesh(
            new THREE.CylinderGeometry(6, 6, 5, 12),
            new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
        );
        truck1Wheel3.position.set(-12, 9, 45);
        truck1Wheel3.rotation.z = Math.PI / 2;
        scene.add(truck1Wheel3);
        objects.push(truck1Wheel3);

        var truck1Wheel4 = new THREE.Mesh(
            new THREE.CylinderGeometry(6, 6, 5, 12),
            new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
        );
        truck1Wheel4.position.set(12, 9, 45);
        truck1Wheel4.rotation.z = Math.PI / 2;
        scene.add(truck1Wheel4);
        objects.push(truck1Wheel4);

        var truck2Body = new THREE.Mesh(
            new THREE.BoxGeometry(20, 15, 40),
            new THREE.MeshLambertMaterial({ color: 0xDAA520 })
        );
        truck2Body.position.set(-30, 43, 50);
        scene.add(truck2Body);
        objects.push(truck2Body);

        var truck2Wheel1 = new THREE.Mesh(
            new THREE.CylinderGeometry(6, 6, 5, 12),
            new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
        );
        truck2Wheel1.position.set(-42, 27, 35);
        truck2Wheel1.rotation.z = Math.PI / 2;
        scene.add(truck2Wheel1);
        objects.push(truck2Wheel1);

        var truck2Wheel2 = new THREE.Mesh(
            new THREE.CylinderGeometry(6, 6, 5, 12),
            new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
        );
        truck2Wheel2.position.set(-18, 27, 35);
        truck2Wheel2.rotation.z = Math.PI / 2;
        scene.add(truck2Wheel2);
        objects.push(truck2Wheel2);

        var truck3Body = new THREE.Mesh(
            new THREE.BoxGeometry(20, 15, 40),
            new THREE.MeshLambertMaterial({ color: 0xDAA520 })
        );
        truck3Body.position.set(-50, 61, 70);
        scene.add(truck3Body);
        objects.push(truck3Body);

        var truck4Body = new THREE.Mesh(
            new THREE.BoxGeometry(20, 15, 40),
            new THREE.MeshLambertMaterial({ color: 0xDAA520 })
        );
        truck4Body.position.set(40, 20, 10);
        scene.add(truck4Body);
        objects.push(truck4Body);
    }

    function buildProcessingPlant() {
        var building1 = new THREE.Mesh(
            new THREE.BoxGeometry(60, 40, 50),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        building1.position.set(-120, 25, 0);
        scene.add(building1);
        objects.push(building1);

        var building2 = new THREE.Mesh(
            new THREE.BoxGeometry(50, 35, 45),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        building2.position.set(-120, 22, 60);
        scene.add(building2);
        objects.push(building2);

        var building3 = new THREE.Mesh(
            new THREE.BoxGeometry(45, 30, 40),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        building3.position.set(-120, 20, -60);
        scene.add(building3);
        objects.push(building3);

        var crusher = new THREE.Mesh(
            new THREE.CylinderGeometry(12, 12, 8, 16),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        crusher.position.set(-120, 48, 0);
        scene.add(crusher);
        objects.push(crusher);

        var crusherjaw = new THREE.Mesh(
            new THREE.BoxGeometry(20, 15, 8),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        crusherjaw.position.set(-120, 40, 0);
        scene.add(crusherjaw);
        objects.push(crusherjaw);

        var conveyor1 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 8, 80),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        conveyor1.position.set(-120, 15, 20);
        conveyor1.rotation.z = 0.2;
        scene.add(conveyor1);
        objects.push(conveyor1);

        var bin1 = new THREE.Mesh(
            new THREE.BoxGeometry(40, 50, 35),
            new THREE.MeshLambertMaterial({ color: 0xA9A9A9 })
        );
        bin1.position.set(-120, 35, 100);
        scene.add(bin1);
        objects.push(bin1);

        var pipe1 = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 3, 50, 8),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        pipe1.position.set(-105, 30, 30);
        pipe1.rotation.x = Math.PI / 2;
        scene.add(pipe1);
        objects.push(pipe1);
    }

    function buildControlCenter() {
        var baseBuilding = new THREE.Mesh(
            new THREE.BoxGeometry(50, 25, 45),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        baseBuilding.position.set(120, 25, 100);
        scene.add(baseBuilding);
        objects.push(baseBuilding);

        var upper = new THREE.Mesh(
            new THREE.BoxGeometry(40, 15, 35),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        upper.position.set(120, 42, 100);
        scene.add(upper);
        objects.push(upper);

        var window1 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 6, 2),
            new THREE.MeshLambertMaterial({ color: 0x87CEEB })
        );
        window1.position.set(110, 45, 117);
        scene.add(window1);
        objects.push(window1);

        var window2 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 6, 2),
            new THREE.MeshLambertMaterial({ color: 0x87CEEB })
        );
        window2.position.set(130, 45, 117);
        scene.add(window2);
        objects.push(window2);

        var window3 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 6, 2),
            new THREE.MeshLambertMaterial({ color: 0x87CEEB })
        );
        window3.position.set(110, 45, 83);
        scene.add(window3);
        objects.push(window3);

        var window4 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 6, 2),
            new THREE.MeshLambertMaterial({ color: 0x87CEEB })
        );
        window4.position.set(130, 45, 83);
        scene.add(window4);
        objects.push(window4);

        var antenna = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 20, 8),
            new THREE.MeshLambertMaterial({ color: 0xA9A9A9 })
        );
        antenna.position.set(120, 60, 100);
        scene.add(antenna);
        objects.push(antenna);

        var base1 = new THREE.Mesh(
            new THREE.BoxGeometry(5, 10, 5),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        base1.position.set(140, 15, 115);
        scene.add(base1);
        objects.push(base1);

        var base2 = new THREE.Mesh(
            new THREE.BoxGeometry(5, 10, 5),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        base2.position.set(100, 15, 115);
        scene.add(base2);
        objects.push(base2);
    }

    function buildDefenses() {
        var sandbag1 = new THREE.Mesh(
            new THREE.BoxGeometry(40, 6, 8),
            new THREE.MeshLambertMaterial({ color: 0xD2B48C })
        );
        sandbag1.position.set(0, 3, 120);
        scene.add(sandbag1);
        objects.push(sandbag1);

        var sandbag2 = new THREE.Mesh(
            new THREE.BoxGeometry(40, 6, 8),
            new THREE.MeshLambertMaterial({ color: 0xD2B48C })
        );
        sandbag2.position.set(0, 3, -120);
        scene.add(sandbag2);
        objects.push(sandbag2);

        var sandbag3 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 6, 40),
            new THREE.MeshLambertMaterial({ color: 0xD2B48C })
        );
        sandbag3.position.set(120, 3, 0);
        scene.add(sandbag3);
        objects.push(sandbag3);

        var sandbag4 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 6, 40),
            new THREE.MeshLambertMaterial({ color: 0xD2B48C })
        );
        sandbag4.position.set(-120, 3, 0);
        scene.add(sandbag4);
        objects.push(sandbag4);

        var gunpost1 = new THREE.Mesh(
            new THREE.CylinderGeometry(4, 4, 25, 12),
            new THREE.MeshLambertMaterial({ color: 0x36454F })
        );
        gunpost1.position.set(0, 15, 125);
        scene.add(gunpost1);
        objects.push(gunpost1);

        var gunpost2 = new THREE.Mesh(
            new THREE.CylinderGeometry(4, 4, 25, 12),
            new THREE.MeshLambertMaterial({ color: 0x36454F })
        );
        gunpost2.position.set(0, 15, -125);
        scene.add(gunpost2);
        objects.push(gunpost2);

        var gunpost3 = new THREE.Mesh(
            new THREE.CylinderGeometry(4, 4, 25, 12),
            new THREE.MeshLambertMaterial({ color: 0x36454F })
        );
        gunpost3.position.set(125, 15, 0);
        scene.add(gunpost3);
        objects.push(gunpost3);

        var gunpost4 = new THREE.Mesh(
            new THREE.CylinderGeometry(4, 4, 25, 12),
            new THREE.MeshLambertMaterial({ color: 0x36454F })
        );
        gunpost4.position.set(-125, 15, 0);
        scene.add(gunpost4);
        objects.push(gunpost4);

        var gunbarrel1 = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 15, 8),
            new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
        );
        gunbarrel1.position.set(0, 30, 125);
        gunbarrel1.rotation.z = 0.3;
        scene.add(gunbarrel1);
        objects.push(gunbarrel1);

        var gunbarrel2 = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 15, 8),
            new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
        );
        gunbarrel2.position.set(0, 30, -125);
        gunbarrel2.rotation.z = -0.3;
        scene.add(gunbarrel2);
        objects.push(gunbarrel2);

        var barrier1 = new THREE.Mesh(
            new THREE.BoxGeometry(50, 10, 5),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        barrier1.position.set(50, 5, 100);
        scene.add(barrier1);
        objects.push(barrier1);

        var barrier2 = new THREE.Mesh(
            new THREE.BoxGeometry(50, 10, 5),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        barrier2.position.set(-50, 5, -100);
        scene.add(barrier2);
        objects.push(barrier2);

        var crater1 = new THREE.Mesh(
            new THREE.SphereGeometry(35, 12, 8),
            new THREE.MeshLambertMaterial({ color: 0x654321 })
        );
        crater1.position.set(80, -15, -80);
        crater1.scale.y = 0.3;
        scene.add(crater1);
        objects.push(crater1);

        var crater2 = new THREE.Mesh(
            new THREE.SphereGeometry(25, 10, 8),
            new THREE.MeshLambertMaterial({ color: 0x654321 })
        );
        crater2.position.set(-80, -12, 80);
        crater2.scale.y = 0.3;
        scene.add(crater2);
        objects.push(crater2);
    }

    function buildSurveyMarkers() {
        var pole1 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 20, 8),
            new THREE.MeshLambertMaterial({ color: 0xFFFF00 })
        );
        pole1.position.set(60, 10, 60);
        scene.add(pole1);
        objects.push(pole1);

        var flag1 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 5, 1),
            new THREE.MeshLambertMaterial({ color: 0xFF0000 })
        );
        flag1.position.set(64, 20, 60);
        scene.add(flag1);
        objects.push(flag1);

        var pole2 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 18, 8),
            new THREE.MeshLambertMaterial({ color: 0xFFFF00 })
        );
        pole2.position.set(-60, 10, -60);
        scene.add(pole2);
        objects.push(pole2);

        var flag2 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 5, 1),
            new THREE.MeshLambertMaterial({ color: 0xFF0000 })
        );
        flag2.position.set(-56, 19, -60);
        scene.add(flag2);
        objects.push(flag2);

        var pole3 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 16, 8),
            new THREE.MeshLambertMaterial({ color: 0xFFFF00 })
        );
        pole3.position.set(80, 10, 0);
        scene.add(pole3);
        objects.push(pole3);

        var flag3 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 5, 1),
            new THREE.MeshLambertMaterial({ color: 0xFF0000 })
        );
        flag3.position.set(84, 18, 0);
        scene.add(flag3);
        objects.push(flag3);

        var pole4 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 14, 8),
            new THREE.MeshLambertMaterial({ color: 0xFFFF00 })
        );
        pole4.position.set(0, 10, 80);
        scene.add(pole4);
        objects.push(pole4);

        var flag4 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 5, 1),
            new THREE.MeshLambertMaterial({ color: 0xFF0000 })
        );
        flag4.position.set(4, 17, 80);
        scene.add(flag4);
        objects.push(flag4);
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(100, 150, 100);
        scene.add(directionalLight);
        lights.push(directionalLight);

        var directionalLight2 = new THREE.DirectionalLight(0xFFFFCC, 0.4);
        directionalLight2.position.set(-100, 100, -100);
        scene.add(directionalLight2);
        lights.push(directionalLight2);

        var pointLight1 = new THREE.PointLight(0xFFFF99, 0.5, 150);
        pointLight1.position.set(-120, 50, 0);
        scene.add(pointLight1);
        lights.push(pointLight1);
    }

    function update(delta) {
        if (excavatorBucket !== null) {
            excavatorBucket.rotation.y += delta * 0.3;
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var i = 0; i < lights.length; i++) {
            scene.remove(lights[i]);
        }
        objects = [];
        lights = [];
        excavatorBucket = null;
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
