window.KilmacolmBase = (function() {
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
        buildBase();
    }

    function buildBase() {
        // Kilmacolm village strongpoint
        var house1 = new THREE.Mesh(
            new THREE.BoxGeometry(5, 4, 5),
            new THREE.MeshLambertMaterial({ color: 0x8b7355 })
        );
        house1.position.set(-25, 2, -20);
        scene.add(house1);
        objects.push(house1);

        var house2 = new THREE.Mesh(
            new THREE.BoxGeometry(5, 4, 5),
            new THREE.MeshLambertMaterial({ color: 0xa0826d })
        );
        house2.position.set(-20, 2, -22);
        scene.add(house2);
        objects.push(house2);

        var barrier1 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 2, 1),
            new THREE.MeshLambertMaterial({ color: 0x606060 })
        );
        barrier1.position.set(-15, 1, -18);
        scene.add(barrier1);
        objects.push(barrier1);

        var tower1 = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
        );
        tower1.position.set(-22, 4, -15);
        scene.add(tower1);
        objects.push(tower1);

        // Duchal Moor radar station
        var opsBuilding = new THREE.Mesh(
            new THREE.BoxGeometry(10, 3, 8),
            new THREE.MeshLambertMaterial({ color: 0x7a7a7a })
        );
        opsBuilding.position.set(10, 1.5, -18);
        scene.add(opsBuilding);
        objects.push(opsBuilding);

        var radarDome = new THREE.Mesh(
            new THREE.SphereGeometry(4, 16, 16),
            new THREE.MeshLambertMaterial({ color: 0xcccccc })
        );
        radarDome.position.set(15, 5, -18);
        scene.add(radarDome);
        objects.push(radarDome);

        var generatorBox = new THREE.Mesh(
            new THREE.BoxGeometry(6, 3, 5),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        generatorBox.position.set(20, 1.5, -15);
        scene.add(generatorBox);
        objects.push(generatorBox);

        // Gryffe valley ambush
        var railwayCut = new THREE.Mesh(
            new THREE.BoxGeometry(12, 3, 2),
            new THREE.MeshLambertMaterial({ color: 0x5a4a3a })
        );
        railwayCut.position.set(-5, 1.5, 15);
        scene.add(railwayCut);
        objects.push(railwayCut);

        var stoneWall = new THREE.Mesh(
            new THREE.BoxGeometry(2, 3, 10),
            new THREE.MeshLambertMaterial({ color: 0x8b8680 })
        );
        stoneWall.position.set(0, 1.5, 18);
        scene.add(stoneWall);
        objects.push(stoneWall);

        var iedCharge1 = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 12, 12),
            new THREE.MeshLambertMaterial({ color: 0xff0000 })
        );
        iedCharge1.position.set(-3, 0.8, 16);
        scene.add(iedCharge1);
        objects.push(iedCharge1);

        var iedCharge2 = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 12, 12),
            new THREE.MeshLambertMaterial({ color: 0xff3333 })
        );
        iedCharge2.position.set(2, 0.8, 19);
        scene.add(iedCharge2);
        objects.push(iedCharge2);

        var commandWire = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-3, 1.5, 16),
                new THREE.Vector3(2, 1.5, 19)
            ]),
            new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 2 })
        );
        scene.add(commandWire);
        objects.push(commandWire);

        // Kilmacolm Cross checkpoint
        var crossPlinth = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2, 3),
            new THREE.MeshLambertMaterial({ color: 0x888888 })
        );
        crossPlinth.position.set(25, 1, 10);
        scene.add(crossPlinth);
        objects.push(crossPlinth);

        var armedBarrier = new THREE.Mesh(
            new THREE.BoxGeometry(6, 1.5, 1),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        armedBarrier.position.set(28, 0.75, 12);
        scene.add(armedBarrier);
        objects.push(armedBarrier);

        var watchTower = new THREE.Mesh(
            new THREE.ConeGeometry(3, 7, 8),
            new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
        );
        watchTower.position.set(30, 3.5, 8);
        scene.add(watchTower);
        objects.push(watchTower);

        // Muirshiel Country Park FOB
        var visitorsCenter = new THREE.Mesh(
            new THREE.BoxGeometry(8, 3, 6),
            new THREE.MeshLambertMaterial({ color: 0xc0a080 })
        );
        visitorsCenter.position.set(-15, 1.5, -5);
        scene.add(visitorsCenter);
        objects.push(visitorsCenter);

        var vehicleCompound = new THREE.Mesh(
            new THREE.BoxGeometry(10, 2, 8),
            new THREE.MeshLambertMaterial({ color: 0x9a8a6a })
        );
        vehicleCompound.position.set(-8, 1, 0);
        scene.add(vehicleCompound);
        objects.push(vehicleCompound);

        var fuelTank = new THREE.Mesh(
            new THREE.CylinderGeometry(2.5, 2.5, 6, 12),
            new THREE.MeshLambertMaterial({ color: 0xffcc00 })
        );
        fuelTank.position.set(-5, 3, 5);
        scene.add(fuelTank);
        objects.push(fuelTank);

        // Green Water reservoir OP
        var clifftopOp = new THREE.Mesh(
            new THREE.BoxGeometry(4, 3, 4),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        clifftopOp.position.set(10, 1.5, 25);
        scene.add(clifftopOp);
        objects.push(clifftopOp);

        var floatSensor1 = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 10, 10),
            new THREE.MeshLambertMaterial({ color: 0x00aa00 })
        );
        floatSensor1.position.set(8, 0.3, 27);
        scene.add(floatSensor1);
        objects.push(floatSensor1);

        var floatSensor2 = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 10, 10),
            new THREE.MeshLambertMaterial({ color: 0x00cc00 })
        );
        floatSensor2.position.set(12, 0.3, 28);
        scene.add(floatSensor2);
        objects.push(floatSensor2);

        var cableGrid = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(8, 0.5, 27),
                new THREE.Vector3(12, 0.5, 28)
            ]),
            new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 1 })
        );
        scene.add(cableGrid);
        objects.push(cableGrid);

        // Finlaystone House command HQ
        var estateMansion = new THREE.Mesh(
            new THREE.BoxGeometry(12, 5, 10),
            new THREE.MeshLambertMaterial({ color: 0x8b4513 })
        );
        estateMansion.position.set(-30, 2.5, 5);
        scene.add(estateMansion);
        objects.push(estateMansion);

        var walledGarden = new THREE.Mesh(
            new THREE.BoxGeometry(2, 3, 12),
            new THREE.MeshLambertMaterial({ color: 0x654321 })
        );
        walledGarden.position.set(-27, 1.5, 15);
        scene.add(walledGarden);
        objects.push(walledGarden);

        var commsMast = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 12, 8),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        commsMast.position.set(-25, 6, 10);
        scene.add(commsMast);
        objects.push(commsMast);

        // Duchal Castle ruin stronghold
        var ruinedTower = new THREE.Mesh(
            new THREE.BoxGeometry(7, 8, 7),
            new THREE.MeshLambertMaterial({ color: 0x704020 })
        );
        ruinedTower.position.set(25, 4, -5);
        scene.add(ruinedTower);
        objects.push(ruinedTower);

        var courtyardWall = new THREE.Mesh(
            new THREE.BoxGeometry(2, 4, 14),
            new THREE.MeshLambertMaterial({ color: 0x6a3810 })
        );
        courtyardWall.position.set(20, 2, 0);
        scene.add(courtyardWall);
        objects.push(courtyardWall);

        var turretCap = new THREE.Mesh(
            new THREE.ConeGeometry(2.5, 4, 8),
            new THREE.MeshLambertMaterial({ color: 0x553311 })
        );
        turretCap.position.set(28, 10, -3);
        scene.add(turretCap);
        objects.push(turretCap);

        // Add lights
        var light1 = new THREE.DirectionalLight(0xffffff, 0.8);
        light1.position.set(20, 30, 20);
        scene.add(light1);
        lights.push(light1);

        var light2 = new THREE.AmbientLight(0xcccccc, 0.4);
        scene.add(light2);
        lights.push(light2);
    }

    function update(delta) {
        // Animate objects if needed
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                // Optional rotation for visual interest
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
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
