window.StormPort = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var waveOffsets = [];
    var lightRotation = 0;

    function buildHarborLayout() {
        var waterGeom = new THREE.BoxGeometry(400, 20, 300);
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x1a3a4a });
        var water = new THREE.Mesh(waterGeom, waterMat);
        water.position.set(0, -5, 0);
        water.castShadow = true;
        water.receiveShadow = true;
        scene.add(water);
        objects.push(water);
        waveOffsets.push({ obj: water, baseY: -5, amplitude: 2, frequency: 0.5, phase: 0 });

        var dockGeom = new THREE.BoxGeometry(450, 8, 250);
        var dockMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var dock = new THREE.Mesh(dockGeom, dockMat);
        dock.position.set(0, -10, -180);
        dock.castShadow = true;
        dock.receiveShadow = true;
        scene.add(dock);
        objects.push(dock);

        var northDock = new THREE.Mesh(dockGeom, dockMat);
        northDock.position.set(0, -10, 180);
        northDock.castShadow = true;
        northDock.receiveShadow = true;
        scene.add(northDock);
        objects.push(northDock);

        var eastDock = new THREE.BoxGeometry(250, 8, 200);
        var eastMesh = new THREE.Mesh(eastDock, dockMat);
        eastMesh.position.set(220, -10, 0);
        eastMesh.castShadow = true;
        eastMesh.receiveShadow = true;
        scene.add(eastMesh);
        objects.push(eastMesh);

        var westDock = new THREE.Mesh(eastDock, dockMat);
        westDock.position.set(-220, -10, 0);
        westDock.castShadow = true;
        westDock.receiveShadow = true;
        scene.add(westDock);
        objects.push(westDock);

        var floodWater1 = new THREE.BoxGeometry(200, 8, 120);
        var floodMat = new THREE.MeshLambertMaterial({ color: 0x0f2a3a });
        var flood1 = new THREE.Mesh(floodWater1, floodMat);
        flood1.position.set(150, -8, -140);
        flood1.castShadow = true;
        flood1.receiveShadow = true;
        scene.add(flood1);
        objects.push(flood1);
        waveOffsets.push({ obj: flood1, baseY: -8, amplitude: 1.5, frequency: 0.6, phase: 1.5 });

        var flood2 = new THREE.Mesh(floodWater1, floodMat);
        flood2.position.set(-140, -8, 120);
        flood2.castShadow = true;
        flood2.receiveShadow = true;
        scene.add(flood2);
        objects.push(flood2);
        waveOffsets.push({ obj: flood2, baseY: -8, amplitude: 1.5, frequency: 0.6, phase: 2.0 });

        var shoreGeom = new THREE.BoxGeometry(180, 5, 150);
        var shoreMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var shore = new THREE.Mesh(shoreGeom, shoreMat);
        shore.position.set(-250, -12, 50);
        shore.castShadow = true;
        shore.receiveShadow = true;
        scene.add(shore);
        objects.push(shore);
    }

    function buildStormDamage() {
        var roofGap1Geom = new THREE.BoxGeometry(80, 2, 60);
        var damMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var roofGap1 = new THREE.Mesh(roofGap1Geom, damMat);
        roofGap1.position.set(120, 45, -100);
        scene.add(roofGap1);
        objects.push(roofGap1);

        var roofGap2 = new THREE.Mesh(roofGap1Geom, damMat);
        roofGap2.position.set(-100, 48, 90);
        roofGap2.rotation.z = 0.3;
        scene.add(roofGap2);
        objects.push(roofGap2);

        var detachedPanel = new THREE.BoxGeometry(40, 30, 3);
        var panelMat = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
        var panel = new THREE.Mesh(detachedPanel, panelMat);
        panel.position.set(80, 35, -80);
        panel.rotation.z = 0.5;
        scene.add(panel);
        objects.push(panel);

        var crumbleBrick = new THREE.BoxGeometry(15, 15, 15);
        var brickMat = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });
        for (var i = 0; i < 12; i++) {
            var brick = new THREE.Mesh(crumbleBrick, brickMat);
            brick.position.set(-120 + Math.random() * 40, 30 + Math.random() * 20, -100 + Math.random() * 60);
            scene.add(brick);
            objects.push(brick);
        }
    }

    function buildNavalVessels() {
        var destroyerHull = new THREE.BoxGeometry(80, 30, 200);
        var hullMat = new THREE.MeshLambertMaterial({ color: 0x2a2a3a });
        var destroyer = new THREE.Mesh(destroyerHull, hullMat);
        destroyer.position.set(-150, 10, 100);
        destroyer.rotation.z = 1.2;
        destroyer.castShadow = true;
        destroyer.receiveShadow = true;
        scene.add(destroyer);
        objects.push(destroyer);

        var propellerGeom = new THREE.CylinderGeometry(12, 12, 4, 16);
        var propMat = new THREE.MeshLambertMaterial({ color: 0x4a4a5a });
        var prop1 = new THREE.Mesh(propellerGeom, propMat);
        prop1.position.set(-155, 18, 80);
        prop1.rotation.x = Math.PI / 2;
        scene.add(prop1);
        objects.push(prop1);

        var prop2 = new THREE.Mesh(propellerGeom, propMat);
        prop2.position.set(-145, 18, 120);
        prop2.rotation.x = Math.PI / 2;
        scene.add(prop2);
        objects.push(prop2);

        var boatHull = new THREE.BoxGeometry(40, 18, 90);
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x3a3a4a });
        var boat = new THREE.Mesh(boatHull, boatMat);
        boat.position.set(180, -8, -120);
        boat.rotation.z = 0.4;
        boat.castShadow = true;
        boat.receiveShadow = true;
        scene.add(boat);
        objects.push(boat);

        var pilothouse = new THREE.BoxGeometry(25, 20, 30);
        var pilotMat = new THREE.MeshLambertMaterial({ color: 0x4a4a5a });
        var pilot = new THREE.Mesh(pilothouse, pilotMat);
        pilot.position.set(185, 5, -100);
        scene.add(pilot);
        objects.push(pilot);

        var freighter = new THREE.BoxGeometry(60, 40, 180);
        var freightMat = new THREE.MeshLambertMaterial({ color: 0x3a3a4a });
        var freight = new THREE.Mesh(freighter, freightMat);
        freight.position.set(80, 5, 150);
        freight.castShadow = true;
        freight.receiveShadow = true;
        scene.add(freight);
        objects.push(freight);

        var freightSuperGeom = new THREE.BoxGeometry(40, 35, 50);
        var freightSuper = new THREE.Mesh(freightSuperGeom, freightMat);
        freightSuper.position.set(90, 30, 140);
        scene.add(freightSuper);
        objects.push(freightSuper);

        var smallBoat = new THREE.BoxGeometry(20, 10, 40);
        var smallMat = new THREE.MeshLambertMaterial({ color: 0x4a5a6a });
        var small1 = new THREE.Mesh(smallBoat, smallMat);
        small1.position.set(-80, -5, 160);
        small1.rotation.z = 0.2;
        scene.add(small1);
        objects.push(small1);

        var small2 = new THREE.Mesh(smallBoat, smallMat);
        small2.position.set(120, -6, -160);
        small2.rotation.z = -0.3;
        scene.add(small2);
        objects.push(small2);
    }

    function buildPortBuildings() {
        var warehouseGeom = new THREE.BoxGeometry(150, 50, 200);
        var buildMat = new THREE.MeshLambertMaterial({ color: 0x5a5a6a });
        var warehouse = new THREE.Mesh(warehouseGeom, buildMat);
        warehouse.position.set(0, 20, -220);
        warehouse.castShadow = true;
        warehouse.receiveShadow = true;
        scene.add(warehouse);
        objects.push(warehouse);

        var authorityGeom = new THREE.BoxGeometry(100, 60, 80);
        var authMat = new THREE.MeshLambertMaterial({ color: 0x6a6a7a });
        var authority = new THREE.Mesh(authorityGeom, authMat);
        authority.position.set(200, 25, -160);
        authority.castShadow = true;
        authority.receiveShadow = true;
        scene.add(authority);
        objects.push(authority);

        var roofAuth = new THREE.BoxGeometry(105, 8, 85);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x4a4a5a });
        var rAuth = new THREE.Mesh(roofAuth, roofMat);
        rAuth.position.set(200, 65, -160);
        scene.add(rAuth);
        objects.push(rAuth);

        var floor1Geom = new THREE.BoxGeometry(95, 5, 75);
        var floorMat = new THREE.MeshLambertMaterial({ color: 0x5a5a6a });
        var floor1 = new THREE.Mesh(floor1Geom, floorMat);
        floor1.position.set(200, 5, -160);
        scene.add(floor1);
        objects.push(floor1);

        var floor2 = new THREE.Mesh(floor1Geom, floorMat);
        floor2.position.set(200, 30, -160);
        scene.add(floor2);
        objects.push(floor2);

        var storageGeom = new THREE.BoxGeometry(120, 45, 150);
        var storMat = new THREE.MeshLambertMaterial({ color: 0x5a5a6a });
        var storage = new THREE.Mesh(storageGeom, storMat);
        storage.position.set(-180, 18, 100);
        storage.castShadow = true;
        storage.receiveShadow = true;
        scene.add(storage);
        objects.push(storage);

        var smallHutGeom = new THREE.BoxGeometry(40, 25, 50);
        var hutMat = new THREE.MeshLambertMaterial({ color: 0x6a6a7a });
        var hut1 = new THREE.Mesh(smallHutGeom, hutMat);
        hut1.position.set(280, 8, 80);
        scene.add(hut1);
        objects.push(hut1);

        var hut2 = new THREE.Mesh(smallHutGeom, hutMat);
        hut2.position.set(250, 8, 150);
        scene.add(hut2);
        objects.push(hut2);
    }

    function buildDefenses() {
        var batteryGeom = new THREE.BoxGeometry(100, 15, 100);
        var batteryMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var battery = new THREE.Mesh(batteryGeom, batteryMat);
        battery.position.set(-280, -5, -150);
        battery.castShadow = true;
        battery.receiveShadow = true;
        scene.add(battery);
        objects.push(battery);

        var gunGeom = new THREE.CylinderGeometry(6, 6, 80, 12);
        var gunMat = new THREE.MeshLambertMaterial({ color: 0x3a3a4a });
        var gun1 = new THREE.Mesh(gunGeom, gunMat);
        gun1.position.set(-300, 10, -150);
        gun1.rotation.z = 0.3;
        scene.add(gun1);
        objects.push(gun1);

        var gun2 = new THREE.Mesh(gunGeom, gunMat);
        gun2.position.set(-260, 10, -140);
        gun2.rotation.z = 0.25;
        scene.add(gun2);
        objects.push(gun2);

        var gun3 = new THREE.Mesh(gunGeom, gunMat);
        gun3.position.set(-280, 10, -180);
        gun3.rotation.z = 0.35;
        scene.add(gun3);
        objects.push(gun3);

        var checkpointGeom = new THREE.BoxGeometry(80, 20, 60);
        var checkMat = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
        var checkpoint = new THREE.Mesh(checkpointGeom, checkMat);
        checkpoint.position.set(0, 5, 250);
        scene.add(checkpoint);
        objects.push(checkpoint);

        var controlBox = new THREE.BoxGeometry(50, 30, 40);
        var controlMat = new THREE.MeshLambertMaterial({ color: 0x5a5a6a });
        var control = new THREE.Mesh(controlBox, controlMat);
        control.position.set(-40, 20, 280);
        scene.add(control);
        objects.push(control);

        var barrierGeom = new THREE.BoxGeometry(15, 20, 80);
        var barrierMat = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
        for (var i = 0; i < 5; i++) {
            var barrier = new THREE.Mesh(barrierGeom, barrierMat);
            barrier.position.set(-60 + i * 30, 5, 270);
            scene.add(barrier);
            objects.push(barrier);
        }
    }

    function buildLighthouse() {
        var baseGeom = new THREE.CylinderGeometry(25, 25, 15, 16);
        var baseMat = new THREE.MeshLambertMaterial({ color: 0x8a8a8a });
        var base = new THREE.Mesh(baseGeom, baseMat);
        base.position.set(350, -3, -200);
        scene.add(base);
        objects.push(base);

        var towerGeom = new THREE.CylinderGeometry(12, 12, 200, 16);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x7a7a8a });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(350, 95, -200);
        tower.castShadow = true;
        tower.receiveShadow = true;
        scene.add(tower);
        objects.push(tower);

        var lanternGeom = new THREE.CylinderGeometry(18, 18, 20, 16);
        var lanternMat = new THREE.MeshLambertMaterial({ color: 0x6a6a7a });
        var lantern = new THREE.Mesh(lanternGeom, lanternMat);
        lantern.position.set(350, 195, -200);
        scene.add(lantern);
        objects.push(lantern);

        var coneGeom = new THREE.ConeGeometry(20, 30, 16);
        var coneMat = new THREE.MeshLambertMaterial({ color: 0x8a4a2a });
        var cone = new THREE.Mesh(coneGeom, coneMat);
        cone.position.set(350, 215, -200);
        scene.add(cone);
        objects.push(cone);

        var beaconGeom = new THREE.SphereGeometry(15, 12, 12);
        var beaconMat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
        var beacon = new THREE.Mesh(beaconGeom, beaconMat);
        beacon.position.set(350, 200, -200);
        beacon.name = 'lighthouse_beacon';
        scene.add(beacon);
        objects.push(beacon);

        var railGeom = new THREE.CylinderGeometry(20, 20, 2, 16);
        var railMat = new THREE.MeshLambertMaterial({ color: 0x5a5a6a });
        var rail = new THREE.Mesh(railGeom, railMat);
        rail.position.set(350, 185, -200);
        scene.add(rail);
        objects.push(rail);
    }

    function buildDebrisField() {
        var debrisPositions = [
            [-100, -3, 80], [50, -4, 120], [-60, -2, -140], [140, -3, -80],
            [-200, 0, 40], [200, -2, -40], [-120, -1, 200], [160, -2, 160],
            [30, -3, -200], [-180, -1, -120], [100, -2, 60], [-140, -3, -60],
            [70, -1, 40], [-220, -2, 80], [180, -3, -100], [-80, -1, 140],
            [120, -2, -160], [-160, -3, 0], [90, -1, -120], [-90, -2, 100]
        ];

        var debrisBox = new THREE.BoxGeometry(25, 20, 30);
        var debrisMat = new THREE.MeshLambertMaterial({ color: 0x5a5a6a });
        for (var i = 0; i < debrisPositions.length; i++) {
            var debris = new THREE.Mesh(debrisBox, debrisMat);
            debris.position.set(debrisPositions[i][0], debrisPositions[i][1], debrisPositions[i][2]);
            debris.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
            scene.add(debris);
            objects.push(debris);
        }

        var sphereDebris = new THREE.SphereGeometry(12, 8, 8);
        var sphereMat = new THREE.MeshLambertMaterial({ color: 0x4a5a6a });
        for (var j = 0; j < 15; j++) {
            var sphere = new THREE.Mesh(sphereDebris, sphereMat);
            sphere.position.set(-120 + Math.random() * 200, -2 + Math.random() * 5, -80 + Math.random() * 180);
            scene.add(sphere);
            objects.push(sphere);
        }

        var cylinderDebris = new THREE.CylinderGeometry(8, 8, 60, 12);
        var cylMat = new THREE.MeshLambertMaterial({ color: 0x5a5a6a });
        for (var k = 0; k < 12; k++) {
            var cyl = new THREE.Mesh(cylinderDebris, cylMat);
            cyl.position.set(-150 + Math.random() * 300, -1 + Math.random() * 8, -140 + Math.random() * 300);
            cyl.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            scene.add(cyl);
            objects.push(cyl);
        }
    }

    function buildBollards() {
        var bollardGeom = new THREE.CylinderGeometry(5, 5, 30, 12);
        var bollardMat = new THREE.MeshLambertMaterial({ color: 0x6a6a7a });

        var pier1Bollards = [
            [50, -2, -200], [100, -2, -200], [150, -2, -200], [200, -2, -200],
            [-50, -2, -200], [-100, -2, -200], [-150, -2, -200], [-200, -2, -200]
        ];

        for (var i = 0; i < pier1Bollards.length; i++) {
            var bollard = new THREE.Mesh(bollardGeom, bollardMat);
            bollard.position.set(pier1Bollards[i][0], pier1Bollards[i][1], pier1Bollards[i][2]);
            scene.add(bollard);
            objects.push(bollard);
        }

        var pier2Bollards = [
            [50, -2, 200], [100, -2, 200], [150, -2, 200], [200, -2, 200],
            [-50, -2, 200], [-100, -2, 200], [-150, -2, 200], [-200, -2, 200]
        ];

        for (var j = 0; j < pier2Bollards.length; j++) {
            var bollard2 = new THREE.Mesh(bollardGeom, bollardMat);
            bollard2.position.set(pier2Bollards[j][0], pier2Bollards[j][1], pier2Bollards[j][2]);
            scene.add(bollard2);
            objects.push(bollard2);
        }
    }

    function buildCrane() {
        var mast = new THREE.BoxGeometry(12, 180, 12);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x6a6a7a });
        var mastMesh = new THREE.Mesh(mast, mastMat);
        mastMesh.position.set(-320, 80, -80);
        mastMesh.rotation.z = 0.5;
        scene.add(mastMesh);
        objects.push(mastMesh);

        var boom = new THREE.BoxGeometry(200, 15, 15);
        var boomMat = new THREE.MeshLambertMaterial({ color: 0x5a5a6a });
        var boomMesh = new THREE.Mesh(boom, boomMat);
        boomMesh.position.set(-240, 40, -120);
        boomMesh.rotation.z = 0.3;
        scene.add(boomMesh);
        objects.push(boomMesh);

        var hook = new THREE.CylinderGeometry(4, 4, 30, 8);
        var hookMat = new THREE.MeshLambertMaterial({ color: 0x4a4a5a });
        var hookMesh = new THREE.Mesh(hook, hookMat);
        hookMesh.position.set(-180, 10, -100);
        scene.add(hookMesh);
        objects.push(hookMesh);
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(300, 300, 200);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var pointLight1 = new THREE.PointLight(0xffaa00, 1, 300);
        pointLight1.position.set(350, 200, -200);
        scene.add(pointLight1);
        lights.push(pointLight1);

        var pointLight2 = new THREE.PointLight(0xff8844, 0.6, 200);
        pointLight2.position.set(-280, 20, -150);
        scene.add(pointLight2);
        lights.push(pointLight2);

        var spotLight = new THREE.SpotLight(0xffff99, 0.5, 400, Math.PI / 6, 0.5, 1);
        spotLight.position.set(200, 100, 100);
        spotLight.target.position.set(0, 0, 0);
        scene.add(spotLight);
        scene.add(spotLight.target);
        lights.push(spotLight);
    }

    function update(delta) {
        for (var i = 0; i < waveOffsets.length; i++) {
            var wave = waveOffsets[i];
            wave.phase += wave.frequency * delta;
            wave.obj.position.y = wave.baseY + Math.sin(wave.phase) * wave.amplitude;
        }

        lightRotation += delta * 2;
        for (var j = 0; j < objects.length; j++) {
            if (objects[j].name === 'lighthouse_beacon') {
                objects[j].rotation.y = lightRotation;
            }
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
        waveOffsets = [];
        scene = null;
        camera = null;
        lightRotation = 0;
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        waveOffsets = [];
        buildHarborLayout();
        buildStormDamage();
        buildNavalVessels();
        buildPortBuildings();
        buildDefenses();
        buildLighthouse();
        buildDebrisField();
        buildBollards();
        buildCrane();
        setupLighting();
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
