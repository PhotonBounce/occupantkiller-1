window.TaynuiltCamp = (function() {
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
        // Bonawe iron furnace converted armory
        var furnaceBuilding = new THREE.Mesh(
            new THREE.BoxGeometry(15, 12, 20),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        furnaceBuilding.position.set(-25, 6, -20);
        scene.add(furnaceBuilding);
        objects.push(furnaceBuilding);

        var blastStack = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 4, 16, 8),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        blastStack.position.set(-20, 12, -15);
        scene.add(blastStack);
        objects.push(blastStack);

        var oreStore = new THREE.Mesh(
            new THREE.BoxGeometry(12, 10, 14),
            new THREE.MeshLambertMaterial({ color: 0xA0522D })
        );
        oreStore.position.set(-35, 5, -25);
        scene.add(oreStore);
        objects.push(oreStore);

        // Taynuilt village supply depot
        var villageHall = new THREE.Mesh(
            new THREE.BoxGeometry(18, 11, 16),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        villageHall.position.set(20, 5.5, -10);
        scene.add(villageHall);
        objects.push(villageHall);

        var vehiclePark = new THREE.Mesh(
            new THREE.BoxGeometry(22, 8, 20),
            new THREE.MeshLambertMaterial({ color: 0x708090 })
        );
        vehiclePark.position.set(25, 4, 12);
        scene.add(vehiclePark);
        objects.push(vehiclePark);

        var fuelTank1 = new THREE.Mesh(
            new THREE.CylinderGeometry(2.5, 2.5, 9, 12),
            new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
        );
        fuelTank1.position.set(18, 4.5, 5);
        scene.add(fuelTank1);
        objects.push(fuelTank1);

        // Loch Etive shore patrol base
        var stonePier = new THREE.Mesh(
            new THREE.BoxGeometry(16, 7, 24),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        stonePier.position.set(-5, 3.5, 28);
        scene.add(stonePier);
        objects.push(stonePier);

        var patrolBoat = new THREE.Mesh(
            new THREE.BoxGeometry(8, 5, 18),
            new THREE.MeshLambertMaterial({ color: 0x191970 })
        );
        patrolBoat.position.set(0, 6, 22);
        scene.add(patrolBoat);
        objects.push(patrolBoat);

        var mooringBuoy1 = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xFF6347 })
        );
        mooringBuoy1.position.set(-8, 1, 32);
        scene.add(mooringBuoy1);
        objects.push(mooringBuoy1);

        var mooringBuoy2 = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xFF6347 })
        );
        mooringBuoy2.position.set(8, 1, 35);
        scene.add(mooringBuoy2);
        objects.push(mooringBuoy2);

        // Inverawe fish farm fuel dump
        var fishCagesPlatform = new THREE.Mesh(
            new THREE.BoxGeometry(20, 6, 18),
            new THREE.MeshLambertMaterial({ color: 0x4169E1 })
        );
        fishCagesPlatform.position.set(-20, 3, 8);
        scene.add(fishCagesPlatform);
        objects.push(fishCagesPlatform);

        var fuelTank2 = new THREE.Mesh(
            new THREE.CylinderGeometry(2.2, 2.2, 8, 10),
            new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
        );
        fuelTank2.position.set(-25, 4, 2);
        scene.add(fuelTank2);
        objects.push(fuelTank2);

        var pumpHouse = new THREE.Mesh(
            new THREE.BoxGeometry(10, 9, 12),
            new THREE.MeshLambertMaterial({ color: 0x8B7355 })
        );
        pumpHouse.position.set(-12, 4.5, 15);
        scene.add(pumpHouse);
        objects.push(pumpHouse);

        // Glen Nant forest ammunition cache
        var forestClearing = new THREE.Mesh(
            new THREE.BoxGeometry(14, 10, 16),
            new THREE.MeshLambertMaterial({ color: 0x556B2F })
        );
        forestClearing.position.set(20, 5, -28);
        scene.add(forestClearing);
        objects.push(forestClearing);

        var crates = new THREE.Mesh(
            new THREE.BoxGeometry(8, 6, 10),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        crates.position.set(25, 3, -25);
        scene.add(crates);
        objects.push(crates);

        var perimeterWire = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(14, 8, -35),
                new THREE.Vector3(26, 8, -35),
                new THREE.Vector3(26, 8, -35),
                new THREE.Vector3(26, 8, -20),
                new THREE.Vector3(26, 8, -20),
                new THREE.Vector3(14, 8, -20),
                new THREE.Vector3(14, 8, -20),
                new THREE.Vector3(14, 8, -35)
            ]),
            new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        scene.add(perimeterWire);
        objects.push(perimeterWire);

        // Beinn Trilleachan granite cliff sniper nest
        var cliffLedge = new THREE.Mesh(
            new THREE.BoxGeometry(10, 6, 14),
            new THREE.MeshLambertMaterial({ color: 0xA9A9A9 })
        );
        cliffLedge.position.set(-8, 16, -8);
        scene.add(cliffLedge);
        objects.push(cliffLedge);

        var camoFrame = new THREE.Mesh(
            new THREE.ConeGeometry(5, 7, 8),
            new THREE.MeshLambertMaterial({ color: 0x228B22 })
        );
        camoFrame.position.set(-3, 18, 0);
        scene.add(camoFrame);
        objects.push(camoFrame);

        var belayWire = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-2, 24, 0),
                new THREE.Vector3(-2, 10, 0),
                new THREE.Vector3(-4, 24, 0),
                new THREE.Vector3(-4, 10, 0),
                new THREE.Vector3(-1, 24, 0),
                new THREE.Vector3(-1, 10, 0)
            ]),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        scene.add(belayWire);
        objects.push(belayWire);

        // Bonawe road junction checkpoint
        var concreteBarrier = new THREE.Mesh(
            new THREE.BoxGeometry(14, 5, 3),
            new THREE.MeshLambertMaterial({ color: 0xC0C0C0 })
        );
        concreteBarrier.position.set(0, 2.5, -15);
        scene.add(concreteBarrier);
        objects.push(concreteBarrier);

        var guardShelter = new THREE.Mesh(
            new THREE.BoxGeometry(8, 7, 8),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        guardShelter.position.set(-10, 3.5, -8);
        scene.add(guardShelter);
        objects.push(guardShelter);

        var signalingPost = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.8, 12, 8),
            new THREE.MeshLambertMaterial({ color: 0x8B0000 })
        );
        signalingPost.position.set(12, 6, -12);
        scene.add(signalingPost);
        objects.push(signalingPost);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 40, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation updates can be added here
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
