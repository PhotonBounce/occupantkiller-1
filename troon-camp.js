window.TroonCamp = (function() {
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
        // Troon Harbour Naval Patrol
        var harbourWall = new THREE.Mesh(
            new THREE.BoxGeometry(8, 3, 2),
            new THREE.MeshLambertMaterial({ color: 0x888888 })
        );
        harbourWall.position.set(-25, 1.5, -28);
        scene.add(harbourWall);
        objects.push(harbourWall);

        var patrolBoat = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 6, 8),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        patrolBoat.position.set(-20, 1, -30);
        scene.add(patrolBoat);
        objects.push(patrolBoat);

        var buoy1 = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xFF6600 })
        );
        buoy1.position.set(-15, 1, -32);
        scene.add(buoy1);
        objects.push(buoy1);

        var netCables = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-25, 2, -28),
                new THREE.Vector3(-15, 1, -32)
            ]),
            new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 })
        );
        scene.add(netCables);
        objects.push(netCables);

        // Royal Troon Golf Club Command Post
        var clubhouse = new THREE.Mesh(
            new THREE.BoxGeometry(6, 5, 6),
            new THREE.MeshLambertMaterial({ color: 0xC19A6B })
        );
        clubhouse.position.set(5, 2.5, -20);
        scene.add(clubhouse);
        objects.push(clubhouse);

        var caddieHed = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2, 3),
            new THREE.MeshLambertMaterial({ color: 0x8B6914 })
        );
        caddieHed.position.set(8, 1, -18);
        scene.add(caddieHed);
        objects.push(caddieHed);

        var waterTank = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 4, 8),
            new THREE.MeshLambertMaterial({ color: 0x4A90E2 })
        );
        waterTank.position.set(12, 2, -22);
        scene.add(waterTank);
        objects.push(waterTank);

        // Troon Beach Landing Defenses
        var pillbox1 = new THREE.Mesh(
            new THREE.BoxGeometry(4, 2, 4),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        pillbox1.position.set(-8, 1, 5);
        scene.add(pillbox1);
        objects.push(pillbox1);

        var antiTank = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
        );
        antiTank.position.set(-2, 0.8, 8);
        scene.add(antiTank);
        objects.push(antiTank);

        var cableBarrier = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-8, 2.5, 5),
                new THREE.Vector3(-2, 2.5, 8)
            ]),
            new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 3 })
        );
        scene.add(cableBarrier);
        objects.push(cableBarrier);

        // Lady Isle Bird Reserve Observation
        var clifftopHide = new THREE.Mesh(
            new THREE.BoxGeometry(3, 3, 3),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        clifftopHide.position.set(20, 2, 15);
        scene.add(clifftopHide);
        objects.push(clifftopHide);

        var sensorBuoy = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x00CC00 })
        );
        sensorBuoy.position.set(25, 1, 18);
        scene.add(sensorBuoy);
        objects.push(sensorBuoy);

        var cableNet = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(20, 3, 15),
                new THREE.Vector3(25, 2, 18)
            ]),
            new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 2 })
        );
        scene.add(cableNet);
        objects.push(cableNet);

        // Barassie Shore Battery
        var batteryEmplacement = new THREE.Mesh(
            new THREE.BoxGeometry(5, 2, 5),
            new THREE.MeshLambertMaterial({ color: 0x5C5C5C })
        );
        batteryEmplacement.position.set(-18, 1, 25);
        scene.add(batteryEmplacement);
        objects.push(batteryEmplacement);

        var gunBarrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.4, 8, 6),
            new THREE.MeshLambertMaterial({ color: 0x1C1C1C })
        );
        gunBarrel.rotation.z = Math.PI / 6;
        gunBarrel.position.set(-18, 3, 25);
        scene.add(gunBarrel);
        objects.push(gunBarrel);

        var magazine = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2, 3),
            new THREE.MeshLambertMaterial({ color: 0x404040 })
        );
        magazine.position.set(-15, 1, 22);
        scene.add(magazine);
        objects.push(magazine);

        // Loans Village Checkpoint
        var concreteBarrier = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1.5, 1),
            new THREE.MeshLambertMaterial({ color: 0xAAAAAA })
        );
        concreteBarrier.position.set(10, 0.75, 28);
        scene.add(concreteBarrier);
        objects.push(concreteBarrier);

        var guardTower = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.2, 5, 8),
            new THREE.MeshLambertMaterial({ color: 0x4A4A4A })
        );
        guardTower.position.set(15, 2.5, 30);
        scene.add(guardTower);
        objects.push(guardTower);

        var sandbagPos = new THREE.Mesh(
            new THREE.BoxGeometry(2, 1, 2),
            new THREE.MeshLambertMaterial({ color: 0xD2B48C })
        );
        sandbagPos.position.set(12, 0.5, 32);
        scene.add(sandbagPos);
        objects.push(sandbagPos);

        // Dundonald Castle Relay Station
        var medievalTower = new THREE.Mesh(
            new THREE.BoxGeometry(3, 6, 3),
            new THREE.MeshLambertMaterial({ color: 0x704214 })
        );
        medievalTower.position.set(-30, 3, 10);
        scene.add(medievalTower);
        objects.push(medievalTower);

        var signalMast = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 7, 6),
            new THREE.MeshLambertMaterial({ color: 0x2C2C2C })
        );
        signalMast.position.set(-30, 5, 10);
        scene.add(signalMast);
        objects.push(signalMast);

        var weatherDome = new THREE.Mesh(
            new THREE.SphereGeometry(1, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
        );
        weatherDome.position.set(-30, 7.5, 10);
        scene.add(weatherDome);
        objects.push(weatherDome);

        // Symington Cross Ambush
        var roadJunction = new THREE.Mesh(
            new THREE.BoxGeometry(6, 0.5, 6),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        roadJunction.position.set(28, 0.25, -5);
        scene.add(roadJunction);
        objects.push(roadJunction);

        var iedCharge = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xFF0000 })
        );
        iedCharge.position.set(30, 1, -3);
        scene.add(iedCharge);
        objects.push(iedCharge);

        var tripwire = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(28, 1.5, -5),
                new THREE.Vector3(30, 1.5, -3)
            ]),
            new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 })
        );
        scene.add(tripwire);
        objects.push(tripwire);

        // Lighting
        var mainLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        mainLight.position.set(20, 30, 20);
        scene.add(mainLight);
        lights.push(mainLight);

        var ambientLight = new THREE.AmbientLight(0x444444, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);
    }
    function update(delta) {
        // Animation can be added here
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
