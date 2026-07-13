window.TideGate = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var beaconLight = null;
    var waterMeshes = [];
    var animTime = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        waterMeshes = [];
        animTime = 0;
        buildTidalZone();
        buildTidalFlats();
        buildFloodGates();
        buildCauseway();
        buildSeaWall();
        buildLighthouse();
        buildFishingVillage();
        buildMilitaryBase();
        buildObstacles();
        buildTidePools();
        setupLighting();
    }

    function buildTidalZone() {
        var tidalBrown = 0x6B4423;
        var waveOffset = 0.3;

        for (var x = -40; x < 40; x += 8) {
            for (var z = -60; z < 60; z += 8) {
                var flatGeom = new THREE.BoxGeometry(8, 0.5, 8);
                var flatMat = new THREE.MeshLambertMaterial({ color: tidalBrown });
                var flat = new THREE.Mesh(flatGeom, flatMat);
                flat.position.set(x, -2.5, z);
                scene.add(flat);
                objects.push(flat);
            }
        }
    }

    function buildTidalFlats() {
        var mudBrown = 0x5A3A1A;
        var sandYellow = 0x8B7355;

        for (var i = 0; i < 20; i++) {
            var flatGeom = new THREE.BoxGeometry(12 + Math.random() * 8, 0.3, 10 + Math.random() * 6);
            var mat = new THREE.MeshLambertMaterial({ color: Math.random() > 0.5 ? mudBrown : sandYellow });
            var flat = new THREE.Mesh(flatGeom, mat);
            flat.position.set(-80 + Math.random() * 160, -3, -100 + Math.random() * 100);
            flat.rotation.y = Math.random() * Math.PI;
            scene.add(flat);
            objects.push(flat);
        }
    }

    function buildFloodGates() {
        var gateGray = 0x404040;
        var metalGray = 0x606060;

        for (var i = 0; i < 4; i++) {
            var gateGeom = new THREE.BoxGeometry(6, 18, 0.8);
            var gateMat = new THREE.MeshLambertMaterial({ color: gateGray });
            var gate = new THREE.Mesh(gateGeom, gateMat);
            gate.position.set(-8 + i * 5, 6, 25);
            scene.add(gate);
            objects.push(gate);

            var gearGeom = new THREE.CylinderGeometry(2.5, 2.5, 1, 16);
            var gearMat = new THREE.MeshLambertMaterial({ color: metalGray });
            var gear = new THREE.Mesh(gearGeom, gearMat);
            gear.position.set(gate.position.x, 12, gate.position.z + 2);
            scene.add(gear);
            objects.push(gear);
        }

        for (var i = 0; i < 3; i++) {
            var gateGeom = new THREE.BoxGeometry(6, 18, 0.8);
            var gateMat = new THREE.MeshLambertMaterial({ color: gateGray });
            var gate = new THREE.Mesh(gateGeom, gateMat);
            gate.position.set(-8 + i * 5, 6, -25);
            scene.add(gate);
            objects.push(gate);

            var gearGeom = new THREE.CylinderGeometry(2.5, 2.5, 1, 16);
            var gearMat = new THREE.MeshLambertMaterial({ color: metalGray });
            var gear = new THREE.Mesh(gearGeom, gearMat);
            gear.position.set(gate.position.x, 12, gate.position.z - 2);
            scene.add(gear);
            objects.push(gear);
        }
    }

    function buildCauseway() {
        var roadGray = 0x303030;
        var railGray = 0x505050;

        var roadGeom = new THREE.BoxGeometry(12, 0.8, 80);
        var roadMat = new THREE.MeshLambertMaterial({ color: roadGray });
        var road = new THREE.Mesh(roadGeom, roadMat);
        road.position.set(0, 1, 0);
        scene.add(road);
        objects.push(road);

        for (var z = -40; z < 40; z += 4) {
            var railGeom = new THREE.BoxGeometry(0.6, 1.5, 3);
            var railMat = new THREE.MeshLambertMaterial({ color: railGray });
            var railL = new THREE.Mesh(railGeom, railMat);
            railL.position.set(-6.5, 1.5, z);
            scene.add(railL);
            objects.push(railL);

            var railR = new THREE.Mesh(railGeom, railMat);
            railR.position.set(6.5, 1.5, z);
            scene.add(railR);
            objects.push(railR);
        }

        for (var z = -38; z < 40; z += 8) {
            var supportGeom = new THREE.CylinderGeometry(0.4, 0.6, 3, 8);
            var supportMat = new THREE.MeshLambertMaterial({ color: 0x202020 });
            for (var x = -5; x <= 5; x += 5) {
                var support = new THREE.Mesh(supportGeom, supportMat);
                support.position.set(x, -0.5, z);
                scene.add(support);
                objects.push(support);
            }
        }
    }

    function buildSeaWall() {
        var wallGray = 0x4A4A4A;
        var darkSeaGreen = 0x1B3F3F;

        for (var i = 0; i < 2; i++) {
            var wallGeom = new THREE.BoxGeometry(2, 16, 120);
            var wallMat = new THREE.MeshLambertMaterial({ color: wallGray });
            var wall = new THREE.Mesh(wallGeom, wallMat);
            wall.position.set(i === 0 ? -35 : 35, 5, 0);
            scene.add(wall);
            objects.push(wall);
        }

        for (var z = -60; z < 60; z += 10) {
            var waterGeom = new THREE.BoxGeometry(70, 12, 8);
            var waterMat = new THREE.MeshLambertMaterial({ color: darkSeaGreen });
            var water = new THREE.Mesh(waterGeom, waterMat);
            water.position.set(0, 3, z);
            scene.add(water);
            objects.push(water);
            waterMeshes.push(water);
        }
    }

    function buildLighthouse() {
        var lightGray = 0xF5F5F5;
        var darkRed = 0x8B0000;
        var metalGray = 0x505050;

        var towerGeom = new THREE.CylinderGeometry(3, 3.5, 35, 16);
        var towerMat = new THREE.MeshLambertMaterial({ color: lightGray });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(60, 10, -70);
        scene.add(tower);
        objects.push(tower);

        var roofGeom = new THREE.ConeGeometry(3.5, 6, 16);
        var roofMat = new THREE.MeshLambertMaterial({ color: darkRed });
        var roof = new THREE.Mesh(roofGeom, roofMat);
        roof.position.set(60, 29, -70);
        scene.add(roof);
        objects.push(roof);

        var beaconGeom = new THREE.SphereGeometry(1.2, 8, 8);
        var beaconMat = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
        beaconLight = new THREE.Mesh(beaconGeom, beaconMat);
        beaconLight.position.set(60, 32, -70);
        scene.add(beaconLight);
        objects.push(beaconLight);

        var lanternRingGeom = new THREE.CylinderGeometry(2, 2, 0.5, 16);
        var lanternMat = new THREE.MeshLambertMaterial({ color: metalGray });
        var lantern = new THREE.Mesh(lanternRingGeom, lanternMat);
        lantern.position.set(60, 28, -70);
        scene.add(lantern);
        objects.push(lantern);

        for (var i = 0; i < 4; i++) {
            var platformGeom = new THREE.BoxGeometry(8, 0.4, 1.5);
            var platformMat = new THREE.MeshLambertMaterial({ color: metalGray });
            var platform = new THREE.Mesh(platformGeom, platformMat);
            platform.position.set(60, 15 + i * 5, -70);
            scene.add(platform);
            objects.push(platform);
        }
    }

    function buildFishingVillage() {
        var houseWood = 0x8B4513;
        var houseDark = 0x654321;
        var roofRed = 0xA52A2A;
        var boatBrown = 0x6B4423;

        for (var i = 0; i < 6; i++) {
            var houseGeom = new THREE.BoxGeometry(5, 4, 6);
            var houseMat = new THREE.MeshLambertMaterial({ color: houseWood });
            var house = new THREE.Mesh(houseGeom, houseMat);
            house.position.set(-45 + i * 8, 2, -80 + (i % 2) * 10);
            scene.add(house);
            objects.push(house);

            var roofGeom = new THREE.ConeGeometry(3.5, 3, 4);
            var roofMat = new THREE.MeshLambertMaterial({ color: roofRed });
            var roof = new THREE.Mesh(roofGeom, roofMat);
            roof.position.set(house.position.x, 5.5, house.position.z);
            scene.add(roof);
            objects.push(roof);

            var doorGeom = new THREE.BoxGeometry(1.5, 2.5, 0.3);
            var doorMat = new THREE.MeshLambertMaterial({ color: houseDark });
            var door = new THREE.Mesh(doorGeom, doorMat);
            door.position.set(house.position.x, 2, house.position.z + 3.2);
            scene.add(door);
            objects.push(door);
        }

        for (var i = 0; i < 4; i++) {
            var boatGeom = new THREE.BoxGeometry(4, 2, 8);
            var boatMat = new THREE.MeshLambertMaterial({ color: boatBrown });
            var boat = new THREE.Mesh(boatGeom, boatMat);
            boat.position.set(-60 + i * 6, 1, -60);
            scene.add(boat);
            objects.push(boat);

            var motorGeom = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
            var motorMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
            var motor = new THREE.Mesh(motorGeom, motorMat);
            motor.position.set(boat.position.x, 2.5, boat.position.z);
            scene.add(motor);
            objects.push(motor);
        }

        for (var i = 0; i < 3; i++) {
            var rackGeom = new THREE.BoxGeometry(4, 5, 0.8);
            var rackMat = new THREE.MeshLambertMaterial({ color: boatBrown });
            var rack = new THREE.Mesh(rackGeom, rackMat);
            rack.position.set(-20 + i * 8, 2.5, -85);
            scene.add(rack);
            objects.push(rack);

            var lineGeom = new THREE.BufferGeometry();
            var linePositions = [];
            for (var j = 0; j < 8; j++) {
                var xPos = rack.position.x - 2 + (j % 2) * 4;
                linePositions.push(xPos, 0, rack.position.z);
                linePositions.push(xPos, 5, rack.position.z);
            }
            lineGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
            var lineMat = new THREE.LineBasicMaterial({ color: 0xCCCCCC });
            var lines = new THREE.LineSegments(lineGeom, lineMat);
            lines.position.set(0, 2.5, 0);
            scene.add(lines);
            objects.push(lines);
        }
    }

    function buildMilitaryBase() {
        var militaryGray = 0x505050;
        var darkGray = 0x303030;
        var concreteLt = 0x707070;

        for (var i = 0; i < 5; i++) {
            var barricadeGeom = new THREE.BoxGeometry(4, 1.2, 0.6);
            var barricadeMat = new THREE.MeshLambertMaterial({ color: militaryGray });
            var barricade = new THREE.Mesh(barricadeGeom, barricadeMat);
            barricade.position.set(-15 + i * 8, 0.6, 50);
            barricade.rotation.z = Math.PI * 0.1;
            scene.add(barricade);
            objects.push(barricade);
        }

        for (var i = 0; i < 3; i++) {
            var postGeom = new THREE.CylinderGeometry(0.8, 1, 6, 12);
            var postMat = new THREE.MeshLambertMaterial({ color: darkGray });
            var post = new THREE.Mesh(postGeom, postMat);
            post.position.set(-30 + i * 15, 3, 35);
            scene.add(post);
            objects.push(post);

            var roofGeom = new THREE.ConeGeometry(1.5, 1.5, 12);
            var roofMat = new THREE.MeshLambertMaterial({ color: militaryGray });
            var roof = new THREE.Mesh(roofGeom, roofMat);
            roof.position.set(post.position.x, 7, post.position.z);
            scene.add(roof);
            objects.push(roof);
        }

        var bunkerGeom = new THREE.BoxGeometry(8, 3, 12);
        var bunkerMat = new THREE.MeshLambertMaterial({ color: concreteLt });
        var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
        bunker.position.set(50, 1.5, 60);
        scene.add(bunker);
        objects.push(bunker);

        var gunMountGeom = new THREE.BoxGeometry(1.5, 0.8, 2);
        var gunMat = new THREE.MeshLambertMaterial({ color: darkGray });
        var gunMount = new THREE.Mesh(gunMountGeom, gunMat);
        gunMount.position.set(bunker.position.x, 3.5, bunker.position.z);
        scene.add(gunMount);
        objects.push(gunMount);

        var radarGeom = new THREE.CylinderGeometry(2, 2, 0.8, 16);
        var radarMat = new THREE.MeshLambertMaterial({ color: militaryGray });
        var radar = new THREE.Mesh(radarGeom, radarMat);
        radar.position.set(55, 6, 65);
        scene.add(radar);
        objects.push(radar);
    }

    function buildObstacles() {
        var metalGray = 0x606060;
        var darkGreen = 0x2F4F2F;

        for (var i = 0; i < 12; i++) {
            var postGeom = new THREE.CylinderGeometry(0.6, 0.8, 5 + Math.random() * 4, 8);
            var postMat = new THREE.MeshLambertMaterial({ color: metalGray });
            var post = new THREE.Mesh(postGeom, postMat);
            post.position.set(-70 + Math.random() * 140, 2.5, -40 + Math.random() * 60);
            scene.add(post);
            objects.push(post);

            var barnacleGeom = new THREE.SphereGeometry(0.3, 4, 4);
            var barnacleMat = new THREE.MeshLambertMaterial({ color: darkGreen });
            for (var j = 0; j < 3; j++) {
                var barnacle = new THREE.Mesh(barnacleGeom, barnacleMat);
                barnacle.position.set(post.position.x + (Math.random() - 0.5) * 1.5, post.position.y + Math.random() * 4, post.position.z + (Math.random() - 0.5) * 1.5);
                scene.add(barnacle);
                objects.push(barnacle);
            }
        }

        var patrolBoatGeom = new THREE.BoxGeometry(5, 2, 12);
        var boatMat = new THREE.MeshLambertMaterial({ color: militaryGray });
        var patrolBoat = new THREE.Mesh(patrolBoatGeom, boatMat);
        patrolBoat.position.set(70, 2, 20);
        scene.add(patrolBoat);
        objects.push(patrolBoat);

        var turretGeom = new THREE.CylinderGeometry(1.2, 1.2, 1.5, 12);
        var turretMat = new THREE.MeshLambertMaterial({ color: 0x303030 });
        var turret = new THREE.Mesh(turretGeom, turretMat);
        turret.position.set(patrolBoat.position.x, patrolBoat.position.y + 2, patrolBoat.position.z);
        scene.add(turret);
        objects.push(turret);

        var gunGeom = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
        var gunMat = new THREE.MeshLambertMaterial({ color: 0x202020 });
        var gun = new THREE.Mesh(gunGeom, gunMat);
        gun.position.set(turret.position.x, turret.position.y + 1, turret.position.z + 2);
        gun.rotation.x = Math.PI * 0.15;
        scene.add(gun);
        objects.push(gun);

        var militaryGray = 0x505050;
    }

    function buildTidePools() {
        var darkWater = 0x1B5E5E;
        var seaLife = 0x00AA66;

        for (var i = 0; i < 8; i++) {
            var poolGeom = new THREE.BoxGeometry(6, 1.5, 5);
            var poolMat = new THREE.MeshLambertMaterial({ color: darkWater });
            var pool = new THREE.Mesh(poolGeom, poolMat);
            pool.position.set(-50 + i * 15, -2, -50);
            scene.add(pool);
            objects.push(pool);

            for (var j = 0; j < 4; j++) {
                var lifeGeom = new THREE.SphereGeometry(0.4, 4, 4);
                var lifeMat = new THREE.MeshLambertMaterial({ color: seaLife });
                var life = new THREE.Mesh(lifeGeom, lifeMat);
                life.position.set(pool.position.x + (Math.random() - 0.5) * 4, pool.position.y + 0.5, pool.position.z + (Math.random() - 0.5) * 3);
                scene.add(life);
                objects.push(life);
            }

            var rocksGeom = new THREE.SphereGeometry(0.6, 4, 4);
            var rocksMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
            for (var k = 0; k < 3; k++) {
                var rock = new THREE.Mesh(rocksGeom, rocksMat);
                rock.position.set(pool.position.x + (Math.random() - 0.5) * 5, pool.position.y + 0.3, pool.position.z + (Math.random() - 0.5) * 4);
                scene.add(rock);
                objects.push(rock);
            }
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.7);
        directionalLight.position.set(100, 80, 100);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var beaconPointLight = new THREE.PointLight(0xFFFF00, 1, 150);
        beaconPointLight.position.set(60, 32, -70);
        scene.add(beaconPointLight);
        lights.push(beaconPointLight);

        var militaryLight = new THREE.PointLight(0xFFFFCC, 0.6, 100);
        militaryLight.position.set(50, 8, 60);
        scene.add(militaryLight);
        lights.push(militaryLight);
    }

    function update(delta) {
        animTime += delta;

        if (beaconLight) {
            beaconLight.rotation.y += delta * 4;
        }

        for (var i = 0; i < waterMeshes.length; i++) {
            var baseY = 3;
            waterMeshes[i].position.y = baseY + Math.sin(animTime + i) * 1.2;
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
        waterMeshes = [];
        scene = null;
        camera = null;
        beaconLight = null;
        animTime = 0;
    }

    return { init: init, update: update, reset: reset };
}());
