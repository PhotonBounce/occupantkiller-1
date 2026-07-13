window.ZincMine = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var cableDrum = null;

    function buildMineExterior() {
        var terrainGeometry = new THREE.BoxGeometry(500, 80, 500);
        var terrainMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
        terrain.position.y = -50;
        terrain.castShadow = true;
        terrain.receiveShadow = true;
        scene.add(terrain);
        objects.push(terrain);

        for (var i = 0; i < 15; i++) {
            var oreGeometry = new THREE.SphereGeometry(8 + Math.random() * 5, 8, 8);
            var oreMaterial = new THREE.MeshLambertMaterial({ color: 0x6b7c9e, metalness: 0.7 });
            var ore = new THREE.Mesh(oreGeometry, oreMaterial);
            ore.position.set((Math.random() - 0.5) * 400, 10 + Math.random() * 20, (Math.random() - 0.5) * 400);
            ore.castShadow = true;
            ore.receiveShadow = true;
            scene.add(ore);
            objects.push(ore);
        }

        for (var j = 0; j < 20; j++) {
            var rockGeometry = new THREE.BoxGeometry(15 + Math.random() * 20, 10 + Math.random() * 15, 15 + Math.random() * 20);
            var rockMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            var rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set((Math.random() - 0.5) * 450, 5 + Math.random() * 10, (Math.random() - 0.5) * 450);
            rock.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
            rock.castShadow = true;
            rock.receiveShadow = true;
            scene.add(rock);
            objects.push(rock);
        }
    }

    function buildShaftTower() {
        var baseGeometry = new THREE.BoxGeometry(60, 120, 60);
        var metalMaterial = new THREE.MeshLambertMaterial({ color: 0x555566 });
        var base = new THREE.Mesh(baseGeometry, metalMaterial);
        base.position.set(0, 60, 0);
        base.castShadow = true;
        base.receiveShadow = true;
        scene.add(base);
        objects.push(base);

        var leftLegGeometry = new THREE.BoxGeometry(15, 150, 15);
        var leftLeg = new THREE.Mesh(leftLegGeometry, metalMaterial);
        leftLeg.position.set(-40, 75, 0);
        leftLeg.castShadow = true;
        leftLeg.receiveShadow = true;
        scene.add(leftLeg);
        objects.push(leftLeg);

        var rightLegGeometry = new THREE.BoxGeometry(15, 150, 15);
        var rightLeg = new THREE.Mesh(rightLegGeometry, metalMaterial);
        rightLeg.position.set(40, 75, 0);
        rightLeg.castShadow = true;
        rightLeg.receiveShadow = true;
        scene.add(rightLeg);
        objects.push(rightLeg);

        var beamGeometry = new THREE.BoxGeometry(100, 12, 12);
        var beam1 = new THREE.Mesh(beamGeometry, metalMaterial);
        beam1.position.set(0, 130, 0);
        beam1.castShadow = true;
        beam1.receiveShadow = true;
        scene.add(beam1);
        objects.push(beam1);

        var drumGeometry = new THREE.CylinderGeometry(25, 25, 40, 16, 8);
        var drumMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        cableDrum = new THREE.Mesh(drumGeometry, drumMaterial);
        cableDrum.position.set(0, 140, 0);
        cableDrum.rotation.z = Math.PI / 2;
        cableDrum.castShadow = true;
        cableDrum.receiveShadow = true;
        scene.add(cableDrum);
        objects.push(cableDrum);

        var shaftGeometry = new THREE.BoxGeometry(50, 200, 50);
        var shaftMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        shaft.position.set(0, -100, 0);
        shaft.castShadow = true;
        shaft.receiveShadow = true;
        scene.add(shaft);
        objects.push(shaft);

        for (var i = 0; i < 8; i++) {
            var cableGeometry = new THREE.BoxGeometry(2, 160, 2);
            var cableMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
            var cable = new THREE.Mesh(cableGeometry, cableMaterial);
            var angle = (i / 8) * Math.PI * 2;
            cable.position.set(Math.cos(angle) * 20, 50, Math.sin(angle) * 20);
            cable.castShadow = true;
            cable.receiveShadow = true;
            scene.add(cable);
            objects.push(cable);
        }
    }

    function buildTunnelEntrance() {
        var archBaseGeometry = new THREE.BoxGeometry(100, 12, 30);
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var archBase = new THREE.Mesh(archBaseGeometry, stoneMaterial);
        archBase.position.set(-150, 50, -200);
        archBase.castShadow = true;
        archBase.receiveShadow = true;
        scene.add(archBase);
        objects.push(archBase);

        var leftPillarGeometry = new THREE.BoxGeometry(15, 80, 30);
        var leftPillar = new THREE.Mesh(leftPillarGeometry, stoneMaterial);
        leftPillar.position.set(-210, 40, -200);
        leftPillar.castShadow = true;
        leftPillar.receiveShadow = true;
        scene.add(leftPillar);
        objects.push(leftPillar);

        var rightPillarGeometry = new THREE.BoxGeometry(15, 80, 30);
        var rightPillar = new THREE.Mesh(rightPillarGeometry, stoneMaterial);
        rightPillar.position.set(-90, 40, -200);
        rightPillar.castShadow = true;
        rightPillar.receiveShadow = true;
        scene.add(rightPillar);
        objects.push(rightPillar);

        var archTopGeometry = new THREE.ConeGeometry(60, 40, 16);
        var archTop = new THREE.Mesh(archTopGeometry, stoneMaterial);
        archTop.position.set(-150, 110, -200);
        archTop.castShadow = true;
        archTop.receiveShadow = true;
        scene.add(archTop);
        objects.push(archTop);

        for (var i = 0; i < 6; i++) {
            var timberGeometry = new THREE.BoxGeometry(90, 8, 8);
            var timberMaterial = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
            var timber = new THREE.Mesh(timberGeometry, timberMaterial);
            timber.position.set(-150, 30 + i * 15, -200);
            timber.castShadow = true;
            timber.receiveShadow = true;
            scene.add(timber);
            objects.push(timber);
        }

        var tunnelOpenGeometry = new THREE.BoxGeometry(70, 60, 40);
        var tunnelMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
        var tunnelOpen = new THREE.Mesh(tunnelOpenGeometry, tunnelMaterial);
        tunnelOpen.position.set(-150, 30, -200);
        tunnelOpen.castShadow = true;
        tunnelOpen.receiveShadow = true;
        scene.add(tunnelOpen);
        objects.push(tunnelOpen);
    }

    function buildOreCrusher() {
        var crusherBodyGeometry = new THREE.BoxGeometry(100, 80, 80);
        var machineryMaterial = new THREE.MeshLambertMaterial({ color: 0x7a6b5d });
        var crusherBody = new THREE.Mesh(crusherBodyGeometry, machineryMaterial);
        crusherBody.position.set(180, 40, 0);
        crusherBody.castShadow = true;
        crusherBody.receiveShadow = true;
        scene.add(crusherBody);
        objects.push(crusherBody);

        var drumGeometry = new THREE.CylinderGeometry(30, 30, 60, 12, 6);
        var drum = new THREE.Mesh(drumGeometry, machineryMaterial);
        drum.position.set(180, 50, 0);
        drum.rotation.z = Math.PI / 2;
        drum.castShadow = true;
        drum.receiveShadow = true;
        scene.add(drum);
        objects.push(drum);

        var hopper1Geometry = new THREE.ConeGeometry(40, 50, 8);
        var hopperMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var hopper1 = new THREE.Mesh(hopper1Geometry, hopperMaterial);
        hopper1.position.set(180, 110, 0);
        hopper1.castShadow = true;
        hopper1.receiveShadow = true;
        scene.add(hopper1);
        objects.push(hopper1);

        for (var i = 0; i < 5; i++) {
            var beltGeometry = new THREE.BoxGeometry(150, 12, 20);
            var beltMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
            var belt = new THREE.Mesh(beltGeometry, beltMaterial);
            belt.position.set(0, 20 + i * 20, 0);
            belt.castShadow = true;
            belt.receiveShadow = true;
            scene.add(belt);
            objects.push(belt);
        }

        var outletGeometry = new THREE.BoxGeometry(60, 50, 50);
        var outlet = new THREE.Mesh(outletGeometry, hopperMaterial);
        outlet.position.set(250, 15, 0);
        outlet.castShadow = true;
        outlet.receiveShadow = true;
        scene.add(outlet);
        objects.push(outlet);

        for (var j = 0; j < 8; j++) {
            var frameGeometry = new THREE.BoxGeometry(8, 80, 8);
            var frameMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
            var frame = new THREE.Mesh(frameGeometry, frameMaterial);
            var angle = (j / 8) * Math.PI * 2;
            frame.position.set(180 + Math.cos(angle) * 50, 40, Math.sin(angle) * 50);
            frame.castShadow = true;
            frame.receiveShadow = true;
            scene.add(frame);
            objects.push(frame);
        }
    }

    function buildTailingsPond() {
        var pondGeometry = new THREE.BoxGeometry(400, 20, 300);
        var pondMaterial = new THREE.MeshLambertMaterial({ color: 0xa9b9cc });
        var pond = new THREE.Mesh(pondGeometry, pondMaterial);
        pond.position.set(-200, -5, 200);
        pond.castShadow = true;
        pond.receiveShadow = true;
        scene.add(pond);
        objects.push(pond);

        for (var i = 0; i < 12; i++) {
            var rippleGeometry = new THREE.SphereGeometry(15 + Math.random() * 10, 6, 6);
            var rippleMaterial = new THREE.MeshLambertMaterial({ color: 0x8a9aac });
            var ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);
            ripple.position.set(-200 + (Math.random() - 0.5) * 350, 5 + Math.random() * 3, 200 + (Math.random() - 0.5) * 250);
            ripple.castShadow = true;
            ripple.receiveShadow = true;
            scene.add(ripple);
            objects.push(ripple);
        }

        var damGeometry = new THREE.BoxGeometry(400, 60, 40);
        var damMaterial = new THREE.MeshLambertMaterial({ color: 0x664d33 });
        var dam = new THREE.Mesh(damGeometry, damMaterial);
        dam.position.set(-200, 30, 400);
        dam.castShadow = true;
        dam.receiveShadow = true;
        scene.add(dam);
        objects.push(dam);

        for (var j = 0; j < 10; j++) {
            var reinforceGeometry = new THREE.BoxGeometry(8, 50, 400);
            var reinforceMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
            var reinforce = new THREE.Mesh(reinforceGeometry, reinforceMaterial);
            reinforce.position.set(-200 + (j - 4.5) * 45, 30, 400);
            reinforce.castShadow = true;
            reinforce.receiveShadow = true;
            scene.add(reinforce);
            objects.push(reinforce);
        }
    }

    function buildWorkerFacility() {
        var facilityGeometry = new THREE.BoxGeometry(120, 60, 80);
        var facilityMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var facility = new THREE.Mesh(facilityGeometry, facilityMaterial);
        facility.position.set(100, 30, -250);
        facility.castShadow = true;
        facility.receiveShadow = true;
        scene.add(facility);
        objects.push(facility);

        var roofGeometry = new THREE.ConeGeometry(80, 40, 4);
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0xc04040 });
        var roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(100, 80, -250);
        roof.castShadow = true;
        roof.receiveShadow = true;
        scene.add(roof);
        objects.push(roof);

        for (var i = 0; i < 4; i++) {
            var windowGeometry = new THREE.BoxGeometry(15, 15, 5);
            var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x4a90e2 });
            var window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(50 - i * 35, 40, -295);
            window.castShadow = true;
            window.receiveShadow = true;
            scene.add(window);
            objects.push(window);
        }

        var changeRoomGeometry = new THREE.BoxGeometry(80, 40, 60);
        var changeRoom = new THREE.Mesh(changeRoomGeometry, facilityMaterial);
        changeRoom.position.set(100, 20, -320);
        changeRoom.castShadow = true;
        changeRoom.receiveShadow = true;
        scene.add(changeRoom);
        objects.push(changeRoom);

        var doorGeometry = new THREE.BoxGeometry(20, 30, 5);
        var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(40, 15, -350);
        door.castShadow = true;
        door.receiveShadow = true;
        scene.add(door);
        objects.push(door);
    }

    function buildDefenses() {
        var wallGeometry = new THREE.BoxGeometry(300, 40, 15);
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
        wall1.position.set(-100, 20, -350);
        wall1.castShadow = true;
        wall1.receiveShadow = true;
        scene.add(wall1);
        objects.push(wall1);

        var wall2Geometry = new THREE.BoxGeometry(15, 40, 300);
        var wall2 = new THREE.Mesh(wall2Geometry, wallMaterial);
        wall2.position.set(-350, 20, -100);
        wall2.castShadow = true;
        wall2.receiveShadow = true;
        scene.add(wall2);
        objects.push(wall2);

        var wall3 = new THREE.Mesh(wall2Geometry, wallMaterial);
        wall3.position.set(150, 20, -100);
        wall3.castShadow = true;
        wall3.receiveShadow = true;
        scene.add(wall3);
        objects.push(wall3);

        var wall4 = new THREE.Mesh(wallGeometry, wallMaterial);
        wall4.position.set(-100, 20, 150);
        wall4.castShadow = true;
        wall4.receiveShadow = true;
        scene.add(wall4);
        objects.push(wall4);

        for (var i = 0; i < 6; i++) {
            var towerGeometry = new THREE.BoxGeometry(30, 60, 30);
            var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
            var tower = new THREE.Mesh(towerGeometry, towerMaterial);
            var xPos = -300 + i * 100;
            tower.position.set(xPos, 30, -320);
            tower.castShadow = true;
            tower.receiveShadow = true;
            scene.add(tower);
            objects.push(tower);
        }

        for (var j = 0; j < 6; j++) {
            var cornerTowerGeometry = new THREE.ConeGeometry(20, 60, 8);
            var cornerTower = new THREE.Mesh(cornerTowerGeometry, wallMaterial);
            var positions = [
                [-350, -200],
                [150, -200],
                [-350, 150],
                [150, 150],
                [-350, -350],
                [150, -350]
            ];
            var pos = positions[j];
            cornerTower.position.set(pos[0], 30, pos[1]);
            cornerTower.castShadow = true;
            cornerTower.receiveShadow = true;
            scene.add(cornerTower);
            objects.push(cornerTower);
        }
    }

    function buildStorage() {
        for (var i = 0; i < 5; i++) {
            for (var j = 0; j < 8; j++) {
                var ingotGeometry = new THREE.BoxGeometry(25, 25, 25);
                var ingotMaterial = new THREE.MeshLambertMaterial({ color: 0x7a8fa3 });
                var ingot = new THREE.Mesh(ingotGeometry, ingotMaterial);
                ingot.position.set(250 + i * 30, 10 + j * 30, 100);
                ingot.castShadow = true;
                ingot.receiveShadow = true;
                scene.add(ingot);
                objects.push(ingot);
            }
        }
    }

    function buildProcessing() {
        for (var i = 0; i < 6; i++) {
            var tankGeometry = new THREE.CylinderGeometry(25, 25, 80, 12, 8);
            var tankMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
            var tank = new THREE.Mesh(tankGeometry, tankMaterial);
            tank.position.set(-300 + i * 80, 40, 100);
            tank.castShadow = true;
            tank.receiveShadow = true;
            scene.add(tank);
            objects.push(tank);

            var pipeGeometry = new THREE.BoxGeometry(8, 40, 8);
            var pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
            var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
            pipe.position.set(-300 + i * 80, 20, 120);
            pipe.castShadow = true;
            pipe.receiveShadow = true;
            scene.add(pipe);
            objects.push(pipe);
        }
    }

    function buildPumping() {
        var pumpGeometry = new THREE.CylinderGeometry(20, 20, 60, 12, 6);
        var pumpMaterial = new THREE.MeshLambertMaterial({ color: 0xd4a574 });
        var pump = new THREE.Mesh(pumpGeometry, pumpMaterial);
        pump.position.set(-250, 30, 250);
        pump.castShadow = true;
        pump.receiveShadow = true;
        scene.add(pump);
        objects.push(pump);

        var housingGeometry = new THREE.BoxGeometry(60, 80, 60);
        var housingMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var housing = new THREE.Mesh(housingGeometry, housingMaterial);
        housing.position.set(-250, 40, 250);
        housing.castShadow = true;
        housing.receiveShadow = true;
        scene.add(housing);
        objects.push(housing);

        for (var i = 0; i < 4; i++) {
            var outletGeometry = new THREE.BoxGeometry(15, 15, 50);
            var outletMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
            var outlet = new THREE.Mesh(outletGeometry, outletMaterial);
            var angle = (i / 4) * Math.PI * 2;
            outlet.position.set(-250 + Math.cos(angle) * 40, 30, 250 + Math.sin(angle) * 40);
            outlet.castShadow = true;
            outlet.receiveShadow = true;
            scene.add(outlet);
            objects.push(outlet);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 150, 100);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var pointLight1 = new THREE.PointLight(0xff8844, 0.6, 300);
        pointLight1.position.set(180, 100, 0);
        pointLight1.castShadow = true;
        scene.add(pointLight1);
        lights.push(pointLight1);

        var pointLight2 = new THREE.PointLight(0x6699ff, 0.5, 250);
        pointLight2.position.set(-250, 60, 250);
        pointLight2.castShadow = true;
        scene.add(pointLight2);
        lights.push(pointLight2);

        var pointLight3 = new THREE.PointLight(0x88ff66, 0.4, 200);
        pointLight3.position.set(100, 80, -250);
        pointLight3.castShadow = true;
        scene.add(pointLight3);
        lights.push(pointLight3);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        cableDrum = null;
        buildMineExterior();
        buildShaftTower();
        buildTunnelEntrance();
        buildOreCrusher();
        buildTailingsPond();
        buildWorkerFacility();
        buildDefenses();
        buildStorage();
        buildProcessing();
        buildPumping();
        setupLighting();
    }

    function update(delta) {
        if (cableDrum) {
            cableDrum.rotation.y += delta * 2;
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
        cableDrum = null;
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
