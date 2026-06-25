window.WemyssBayCamp = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        buildCamp();
    }

    function buildCamp() {
        // Wemyss Bay Station Ferry Terminal Control
        var stationBuilding = new THREE.Mesh(
            new THREE.BoxGeometry(12, 8, 10),
            new THREE.MeshLambertMaterial({ color: 0xd4a574 })
        );
        stationBuilding.position.set(-25, 4, -20);
        scene.add(stationBuilding);
        objects.push(stationBuilding);

        var ferryDock = new THREE.Mesh(
            new THREE.BoxGeometry(20, 3, 15),
            new THREE.MeshLambertMaterial({ color: 0x8b7355 })
        );
        ferryDock.position.set(-20, 1.5, 5);
        scene.add(ferryDock);
        objects.push(ferryDock);

        var loadingCrane = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 16, 8),
            new THREE.MeshLambertMaterial({ color: 0x666666 })
        );
        loadingCrane.position.set(-15, 8, 10);
        scene.add(loadingCrane);
        objects.push(loadingCrane);

        // Skelmorlie Castle - Commanding Fortress
        var castellatedMansion = new THREE.Mesh(
            new THREE.BoxGeometry(18, 12, 14),
            new THREE.MeshLambertMaterial({ color: 0xa0522d })
        );
        castellatedMansion.position.set(8, 6, -18);
        scene.add(castellatedMansion);
        objects.push(castellatedMansion);

        var walledGarden = new THREE.Mesh(
            new THREE.BoxGeometry(25, 4, 20),
            new THREE.MeshLambertMaterial({ color: 0x8b4513 })
        );
        walledGarden.position.set(15, 2, -5);
        scene.add(walledGarden);
        objects.push(walledGarden);

        var castleTower = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 3, 20, 6),
            new THREE.MeshLambertMaterial({ color: 0x556b2f })
        );
        castleTower.position.set(12, 10, -20);
        scene.add(castleTower);
        objects.push(castleTower);

        // Clyde Shore Defense Line
        var pillboxOne = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 6),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        pillboxOne.position.set(-10, 2, 25);
        scene.add(pillboxOne);
        objects.push(pillboxOne);

        var pillboxTwo = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 6),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        pillboxTwo.position.set(5, 2, 28);
        scene.add(pillboxTwo);
        objects.push(pillboxTwo);

        var antiTankOne = new THREE.Mesh(
            new THREE.SphereGeometry(2, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x404040 })
        );
        antiTankOne.position.set(-5, 1, 20);
        scene.add(antiTankOne);
        objects.push(antiTankOne);

        var antiTankTwo = new THREE.Mesh(
            new THREE.SphereGeometry(2, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x404040 })
        );
        antiTankTwo.position.set(10, 1, 22);
        scene.add(antiTankTwo);
        objects.push(antiTankTwo);

        var beachCable = new THREE.LineSegments(
            new THREE.BufferGeometry().setAttribute('position',
                new THREE.BufferAttribute(new Float32Array([
                    -15, 0.5, 18,  15, 0.5, 18,
                    -15, 0.5, 18,  -15, 0.5, 24,
                    15, 0.5, 18,   15, 0.5, 24,
                    -15, 0.5, 24,  15, 0.5, 24
                ]), 3)),
            new THREE.MeshLambertMaterial({ color: 0xffd700 })
        );
        scene.add(beachCable);
        objects.push(beachCable);

        // Kelly Cut Reservoir OP
        var damStructure = new THREE.Mesh(
            new THREE.BoxGeometry(16, 7, 4),
            new THREE.MeshLambertMaterial({ color: 0xd3d3d3 })
        );
        damStructure.position.set(0, 3.5, -30);
        scene.add(damStructure);
        objects.push(damStructure);

        var cliffHut = new THREE.Mesh(
            new THREE.BoxGeometry(5, 4, 5),
            new THREE.MeshLambertMaterial({ color: 0x8b7500 })
        );
        cliffHut.position.set(10, 7, -28);
        scene.add(cliffHut);
        objects.push(cliffHut);

        var cableSensor = new THREE.LineSegments(
            new THREE.BufferGeometry().setAttribute('position',
                new THREE.BufferAttribute(new Float32Array([
                    -8, 3.5, -30,  8, 3.5, -30,
                    0, 3.5, -30,   0, 9, -30,
                    -8, 3.5, -30,  -8, 8, -30,
                    8, 3.5, -30,   8, 8, -30
                ]), 3)),
            new THREE.MeshLambertMaterial({ color: 0xff6347 })
        );
        scene.add(cableSensor);
        objects.push(cableSensor);

        // Lunderston Bay Beach Interdiction
        var sandbagOne = new THREE.Mesh(
            new THREE.BoxGeometry(8, 2, 3),
            new THREE.MeshLambertMaterial({ color: 0xcd853f })
        );
        sandbagOne.position.set(-12, 1, 15);
        scene.add(sandbagOne);
        objects.push(sandbagOne);

        var sandbagTwo = new THREE.Mesh(
            new THREE.BoxGeometry(8, 2, 3),
            new THREE.MeshLambertMaterial({ color: 0xcd853f })
        );
        sandbagTwo.position.set(12, 1, 16);
        scene.add(sandbagTwo);
        objects.push(sandbagTwo);

        var underwaterMine = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x2f4f4f })
        );
        underwaterMine.position.set(-8, -2, 18);
        scene.add(underwaterMine);
        objects.push(underwaterMine);

        var netBarrier = new THREE.LineSegments(
            new THREE.BufferGeometry().setAttribute('position',
                new THREE.BufferAttribute(new Float32Array([
                    -20, 0, 12,  20, 0, 12,
                    -20, 0, 12,  -20, 2, 12,
                    20, 0, 12,   20, 2, 12,
                    -20, 2, 12,  20, 2, 12
                ]), 3)),
            new THREE.MeshLambertMaterial({ color: 0x4169e1 })
        );
        scene.add(netBarrier);
        objects.push(netBarrier);

        // Inverkip Power Station Ruins
        var coolingTowerStub = new THREE.Mesh(
            new THREE.BoxGeometry(14, 18, 12),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        coolingTowerStub.position.set(20, 9, 5);
        scene.add(coolingTowerStub);
        objects.push(coolingTowerStub);

        var adminBlock = new THREE.Mesh(
            new THREE.BoxGeometry(10, 6, 8),
            new THREE.MeshLambertMaterial({ color: 0x778899 })
        );
        adminBlock.position.set(28, 3, 0);
        scene.add(adminBlock);
        objects.push(adminBlock);

        var fuelTank = new THREE.Mesh(
            new THREE.CylinderGeometry(4, 4, 12, 8),
            new THREE.MeshLambertMaterial({ color: 0x8b4513 })
        );
        fuelTank.position.set(25, 6, 12);
        scene.add(fuelTank);
        objects.push(fuelTank);

        // Noddsdale Water Valley Ambush
        var glenTrack = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1, 16),
            new THREE.MeshLambertMaterial({ color: 0x8b7355 })
        );
        glenTrack.position.set(-28, 0.5, 0);
        scene.add(glenTrack);
        objects.push(glenTrack);

        var stonewallCover = new THREE.Mesh(
            new THREE.BoxGeometry(12, 3, 2),
            new THREE.MeshLambertMaterial({ color: 0xa9a9a9 })
        );
        stonewallCover.position.set(-30, 1.5, -8);
        scene.add(stonewallCover);
        objects.push(stonewallCover);

        var iedCharge = new THREE.Mesh(
            new THREE.SphereGeometry(1, 6, 6),
            new THREE.MeshLambertMaterial({ color: 0x8b0000 })
        );
        iedCharge.position.set(-25, 1.5, -5);
        scene.add(iedCharge);
        objects.push(iedCharge);

        // Haylie Brae Ridge Relay
        var stoneShelter = new THREE.Mesh(
            new THREE.BoxGeometry(7, 3, 6),
            new THREE.MeshLambertMaterial({ color: 0xc0c0c0 })
        );
        stoneShelter.position.set(-5, 1.5, -15);
        scene.add(stoneShelter);
        objects.push(stoneShelter);

        var signalMast = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 14, 6),
            new THREE.MeshLambertMaterial({ color: 0x2f4f4f })
        );
        signalMast.position.set(0, 7, -10);
        scene.add(signalMast);
        objects.push(signalMast);

        var weatherDome = new THREE.Mesh(
            new THREE.SphereGeometry(2.5, 16, 16),
            new THREE.MeshLambertMaterial({ color: 0xfffacd })
        );
        weatherDome.position.set(5, 12, -12);
        scene.add(weatherDome);
        objects.push(weatherDome);

        // Add lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 25, 25);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation placeholder
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
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
