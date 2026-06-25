window.BenmoreFort = (function() {
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
        buildFort();
    }

    function buildFort() {
        // Benmore House military HQ
        var hqWalls = new THREE.Mesh(
            new THREE.BoxGeometry(8, 6, 8),
            new THREE.MeshLambertMaterial({color: 0x8B7355})
        );
        hqWalls.position.set(-25, 3, -25);
        scene.add(hqWalls);
        objects.push(hqWalls);

        var hqGarden = new THREE.Mesh(
            new THREE.BoxGeometry(15, 0.5, 15),
            new THREE.MeshLambertMaterial({color: 0x654321})
        );
        hqGarden.position.set(-25, 0.25, -25);
        scene.add(hqGarden);
        objects.push(hqGarden);

        var waterTower = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 2, 7, 8),
            new THREE.MeshLambertMaterial({color: 0x696969})
        );
        waterTower.position.set(-20, 3.5, -28);
        scene.add(waterTower);
        objects.push(waterTower);

        // Younger Botanic Garden perimeter defense
        var boundaryWall = new THREE.Mesh(
            new THREE.BoxGeometry(40, 3, 0.5),
            new THREE.MeshLambertMaterial({color: 0x8B7355})
        );
        boundaryWall.position.set(0, 1.5, -20);
        scene.add(boundaryWall);
        objects.push(boundaryWall);

        var mainGateLeft = new THREE.Mesh(
            new THREE.BoxGeometry(2, 4, 2),
            new THREE.MeshLambertMaterial({color: 0x654321})
        );
        mainGateLeft.position.set(-3, 2, -15);
        scene.add(mainGateLeft);
        objects.push(mainGateLeft);

        var mainGateRight = new THREE.Mesh(
            new THREE.BoxGeometry(2, 4, 2),
            new THREE.MeshLambertMaterial({color: 0x654321})
        );
        mainGateRight.position.set(3, 2, -15);
        scene.add(mainGateRight);
        objects.push(mainGateRight);

        var sentryBox = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1.2, 3, 6),
            new THREE.MeshLambertMaterial({color: 0xA9A9A9})
        );
        sentryBox.position.set(10, 1.5, -18);
        scene.add(sentryBox);
        objects.push(sentryBox);

        // Benmore summit artillery battery
        var emplacementStone = new THREE.Mesh(
            new THREE.BoxGeometry(6, 1, 6),
            new THREE.MeshLambertMaterial({color: 0x808080})
        );
        emplacementStone.position.set(20, 0.5, -10);
        scene.add(emplacementStone);
        objects.push(emplacementStone);

        var gunBarrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.4, 4, 8),
            new THREE.MeshLambertMaterial({color: 0x2F4F4F})
        );
        gunBarrel.rotation.z = Math.PI / 6;
        gunBarrel.position.set(20, 2.5, -10);
        scene.add(gunBarrel);
        objects.push(gunBarrel);

        var magazineBunker = new THREE.Mesh(
            new THREE.BoxGeometry(5, 2.5, 5),
            new THREE.MeshLambertMaterial({color: 0x696969})
        );
        magazineBunker.position.set(22, 1.25, -5);
        scene.add(magazineBunker);
        objects.push(magazineBunker);

        // Am Binnein ridge relay
        var ridgeShelter = new THREE.Mesh(
            new THREE.BoxGeometry(4, 2, 4),
            new THREE.MeshLambertMaterial({color: 0x8B7355})
        );
        ridgeShelter.position.set(-10, 1, 15);
        scene.add(ridgeShelter);
        objects.push(ridgeShelter);

        var signalMast = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 6, 6),
            new THREE.MeshLambertMaterial({color: 0xFFD700})
        );
        signalMast.position.set(-10, 3, 15);
        scene.add(signalMast);
        objects.push(signalMast);

        var weatherRadome = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 8, 8),
            new THREE.MeshLambertMaterial({color: 0xE6E6FA})
        );
        weatherRadome.position.set(-10, 6.5, 15);
        scene.add(weatherRadome);
        objects.push(weatherRadome);

        // Cowal Highland Games field FOB
        var stoneCastle = new THREE.Mesh(
            new THREE.BoxGeometry(10, 5, 10),
            new THREE.MeshLambertMaterial({color: 0x8B4513})
        );
        stoneCastle.position.set(25, 2.5, 10);
        scene.add(stoneCastle);
        objects.push(stoneCastle);

        var fieldHospital = new THREE.Mesh(
            new THREE.BoxGeometry(8, 3, 6),
            new THREE.MeshLambertMaterial({color: 0xF5F5DC})
        );
        fieldHospital.position.set(30, 1.5, 5);
        scene.add(fieldHospital);
        objects.push(fieldHospital);

        var flagpoleMast = new THREE.Mesh(
            new THREE.ConeGeometry(0.5, 5, 8),
            new THREE.MeshLambertMaterial({color: 0xFF4500})
        );
        flagpoleMast.position.set(28, 2.5, 15);
        scene.add(flagpoleMast);
        objects.push(flagpoleMast);

        // Glenbranter plantation ambush
        var treecover = new THREE.Mesh(
            new THREE.BoxGeometry(12, 4, 12),
            new THREE.MeshLambertMaterial({color: 0x228B22})
        );
        treecover.position.set(-20, 2, 10);
        scene.add(treecover);
        objects.push(treecover);

        var hiddenTrack = new THREE.Mesh(
            new THREE.BoxGeometry(3, 0.3, 8),
            new THREE.MeshLambertMaterial({color: 0x8B6914})
        );
        hiddenTrack.position.set(-22, 0.15, 12);
        scene.add(hiddenTrack);
        objects.push(hiddenTrack);

        var iedCharges = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 6, 6),
            new THREE.MeshLambertMaterial({color: 0x000000})
        );
        iedCharges.position.set(-20, 0.8, 8);
        scene.add(iedCharges);
        objects.push(iedCharges);

        var wireGeom = new THREE.BufferGeometry();
        var wirePositions = new Float32Array([
            -20, 0.8, 8,
            -22, 2, 10
        ]);
        wireGeom.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
        var commandWire = new THREE.LineSegments(
            wireGeom,
            new THREE.LineBasicMaterial({color: 0x000000, linewidth: 2})
        );
        scene.add(commandWire);
        objects.push(commandWire);

        // River Cur crossing demolition
        var stoneBridge = new THREE.Mesh(
            new THREE.BoxGeometry(4, 2, 12),
            new THREE.MeshLambertMaterial({color: 0xA0826D})
        );
        stoneBridge.position.set(5, 1, 25);
        scene.add(stoneBridge);
        objects.push(stoneBridge);

        var explosiveCharge = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 6, 6),
            new THREE.MeshLambertMaterial({color: 0xFF6347})
        );
        explosiveCharge.position.set(5, 2, 28);
        scene.add(explosiveCharge);
        objects.push(explosiveCharge);

        var detonatorWireGeom = new THREE.BufferGeometry();
        var detonatorPositions = new Float32Array([
            5, 2, 28,
            2, 3, 30
        ]);
        detonatorWireGeom.setAttribute('position', new THREE.BufferAttribute(detonatorPositions, 3));
        var detonatorWire = new THREE.LineSegments(
            detonatorWireGeom,
            new THREE.LineBasicMaterial({color: 0xFF0000, linewidth: 2})
        );
        scene.add(detonatorWire);
        objects.push(detonatorWire);

        var wireShelter = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2, 3),
            new THREE.MeshLambertMaterial({color: 0x696969})
        );
        wireShelter.position.set(2, 1, 30);
        scene.add(wireShelter);
        objects.push(wireShelter);

        // Clachan Farm supply cache
        var farmhouse = new THREE.Mesh(
            new THREE.BoxGeometry(6, 3, 6),
            new THREE.MeshLambertMaterial({color: 0xCD853F})
        );
        farmhouse.position.set(-5, 1.5, -5);
        scene.add(farmhouse);
        objects.push(farmhouse);

        var dieselTank = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.2, 3, 8),
            new THREE.MeshLambertMaterial({color: 0x2F4F4F})
        );
        dieselTank.position.set(-8, 1.5, -2);
        scene.add(dieselTank);
        objects.push(dieselTank);

        var hiddenStore = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 2, 2.5),
            new THREE.MeshLambertMaterial({color: 0x556B2F})
        );
        hiddenStore.position.set(-2, 1, -8);
        scene.add(hiddenStore);
        objects.push(hiddenStore);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 40, 30);
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
