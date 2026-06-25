window.SaltcoatsKeep = (function() {
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
        buildKeep();
    }

    function buildKeep() {
        // Saltcoats Beach Landing Defense
        var seaWall = new THREE.Mesh(
            new THREE.BoxGeometry(40, 8, 6),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        seaWall.position.set(-25, 4, -28);
        scene.add(seaWall);
        objects.push(seaWall);

        var antiTank1 = new THREE.Mesh(
            new THREE.SphereGeometry(3, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        antiTank1.position.set(-20, 3, -20);
        scene.add(antiTank1);
        objects.push(antiTank1);

        var antiTank2 = new THREE.Mesh(
            new THREE.SphereGeometry(3, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        antiTank2.position.set(0, 3, -22);
        scene.add(antiTank2);
        objects.push(antiTank2);

        var cableBarrier = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-25, 5, -18),
                new THREE.Vector3(15, 5, -18)
            ]),
            new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 })
        );
        scene.add(cableBarrier);
        objects.push(cableBarrier);

        // North Ayrshire Museum Garrison
        var victorianChurch = new THREE.Mesh(
            new THREE.BoxGeometry(16, 20, 14),
            new THREE.MeshLambertMaterial({ color: 0xA0522D })
        );
        victorianChurch.position.set(-20, 10, 5);
        scene.add(victorianChurch);
        objects.push(victorianChurch);

        var graveyard = new THREE.Mesh(
            new THREE.BoxGeometry(18, 1, 12),
            new THREE.MeshLambertMaterial({ color: 0x556B2F })
        );
        graveyard.position.set(-18, 0.5, 18);
        scene.add(graveyard);
        objects.push(graveyard);

        var bellTower = new THREE.Mesh(
            new THREE.CylinderGeometry(4, 4.5, 18, 16),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        bellTower.position.set(-10, 9, 8);
        scene.add(bellTower);
        objects.push(bellTower);

        // Stevenston Chemical Works
        var factory1 = new THREE.Mesh(
            new THREE.BoxGeometry(22, 12, 18),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        factory1.position.set(10, 6, -8);
        scene.add(factory1);
        objects.push(factory1);

        var bunker1 = new THREE.Mesh(
            new THREE.BoxGeometry(12, 10, 10),
            new THREE.MeshLambertMaterial({ color: 0x404040 })
        );
        bunker1.position.set(25, 5, 0);
        scene.add(bunker1);
        objects.push(bunker1);

        var ventStack1 = new THREE.Mesh(
            new THREE.CylinderGeometry(2.5, 3, 14, 12),
            new THREE.MeshLambertMaterial({ color: 0x4A4A4A })
        );
        ventStack1.position.set(15, 7, 5);
        scene.add(ventStack1);
        objects.push(ventStack1);

        var ventStack2 = new THREE.Mesh(
            new THREE.CylinderGeometry(2.5, 3, 14, 12),
            new THREE.MeshLambertMaterial({ color: 0x4A4A4A })
        );
        ventStack2.position.set(22, 7, -5);
        scene.add(ventStack2);
        objects.push(ventStack2);

        // Kerelaw Castle Ruin Keep
        var ruinTower = new THREE.Mesh(
            new THREE.BoxGeometry(10, 16, 10),
            new THREE.MeshLambertMaterial({ color: 0x8B7355 })
        );
        ruinTower.position.set(-5, 8, -8);
        scene.add(ruinTower);
        objects.push(ruinTower);

        var enclosure = new THREE.Mesh(
            new THREE.BoxGeometry(20, 8, 16),
            new THREE.MeshLambertMaterial({ color: 0x996633 })
        );
        enclosure.position.set(-8, 4, 2);
        scene.add(enclosure);
        objects.push(enclosure);

        var turret = new THREE.Mesh(
            new THREE.ConeGeometry(3.5, 9, 12),
            new THREE.MeshLambertMaterial({ color: 0x654321 })
        );
        turret.position.set(2, 12, -5);
        scene.add(turret);
        objects.push(turret);

        // Caledonian Road Checkpoint
        var concreteBarrier1 = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 3),
            new THREE.MeshLambertMaterial({ color: 0x7F7F7F })
        );
        concreteBarrier1.position.set(8, 2, 10);
        scene.add(concreteBarrier1);
        objects.push(concreteBarrier1);

        var concreteBarrier2 = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 3),
            new THREE.MeshLambertMaterial({ color: 0x7F7F7F })
        );
        concreteBarrier2.position.set(16, 2, 12);
        scene.add(concreteBarrier2);
        objects.push(concreteBarrier2);

        var guardTower = new THREE.Mesh(
            new THREE.CylinderGeometry(3.5, 4, 12, 16),
            new THREE.MeshLambertMaterial({ color: 0x5C5C5C })
        );
        guardTower.position.set(20, 6, 8);
        scene.add(guardTower);
        objects.push(guardTower);

        var sandbagNest = new THREE.Mesh(
            new THREE.BoxGeometry(8, 3, 8),
            new THREE.MeshLambertMaterial({ color: 0xD2B48C })
        );
        sandbagNest.position.set(12, 1.5, 20);
        scene.add(sandbagNest);
        objects.push(sandbagNest);

        // Dalgarven Mill Relay
        var millStone = new THREE.Mesh(
            new THREE.BoxGeometry(14, 10, 14),
            new THREE.MeshLambertMaterial({ color: 0xAA8866 })
        );
        millStone.position.set(-12, 5, 15);
        scene.add(millStone);
        objects.push(millStone);

        var wheelStub = new THREE.Mesh(
            new THREE.CylinderGeometry(5, 5, 2, 16),
            new THREE.MeshLambertMaterial({ color: 0x704214 })
        );
        wheelStub.position.set(-8, 7, 20);
        scene.add(wheelStub);
        objects.push(wheelStub);

        var signalMast = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.8, 16, 12),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        signalMast.position.set(0, 8, 20);
        scene.add(signalMast);
        objects.push(signalMast);

        // Seamill Shore OP
        var clifftopOP = new THREE.Mesh(
            new THREE.BoxGeometry(12, 6, 10),
            new THREE.MeshLambertMaterial({ color: 0x8B8680 })
        );
        clifftopOP.position.set(8, 3, 25);
        scene.add(clifftopOP);
        objects.push(clifftopOP);

        var sensorBuoy1 = new THREE.Mesh(
            new THREE.SphereGeometry(2, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xFF6347 })
        );
        sensorBuoy1.position.set(15, 2, 30);
        scene.add(sensorBuoy1);
        objects.push(sensorBuoy1);

        var sensorBuoy2 = new THREE.Mesh(
            new THREE.SphereGeometry(2, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xFF6347 })
        );
        sensorBuoy2.position.set(25, 2, 28);
        scene.add(sensorBuoy2);
        objects.push(sensorBuoy2);

        var cableNet = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(10, 1, 28),
                new THREE.Vector3(20, 1, 32)
            ]),
            new THREE.LineBasicMaterial({ color: 0x4169E1, linewidth: 2 })
        );
        scene.add(cableNet);
        objects.push(cableNet);

        // Ashgrove Farm Supply Base
        var farmhouse = new THREE.Mesh(
            new THREE.BoxGeometry(12, 8, 10),
            new THREE.MeshLambertMaterial({ color: 0xCD853F })
        );
        farmhouse.position.set(2, 4, -15);
        scene.add(farmhouse);
        objects.push(farmhouse);

        var fuelTank = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 3.5, 8, 16),
            new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
        );
        fuelTank.position.set(12, 4, -12);
        scene.add(fuelTank);
        objects.push(fuelTank);

        var equipStore = new THREE.Mesh(
            new THREE.BoxGeometry(10, 7, 9),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        equipStore.position.set(8, 3.5, -5);
        scene.add(equipStore);
        objects.push(equipStore);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 25, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation updates here if needed
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
