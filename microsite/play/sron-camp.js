window.SronCamp = (function() {
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
        // Nose-shaped headland rock mass: cluster of box and sphere rocks
        var rock1Geom = new THREE.BoxGeometry(8, 12, 10);
        var rock1Mat = new THREE.MeshLambertMaterial({ color: 0x6b6b5f });
        var rock1 = new THREE.Mesh(rock1Geom, rock1Mat);
        rock1.position.set(-15, 5, -20);
        rock1.rotation.z = 0.3;
        scene.add(rock1);
        objects.push(rock1);

        var rock2Geom = new THREE.SphereGeometry(5, 8, 8);
        var rock2Mat = new THREE.MeshLambertMaterial({ color: 0x7a7a6e });
        var rock2 = new THREE.Mesh(rock2Geom, rock2Mat);
        rock2.position.set(-8, 8, -25);
        scene.add(rock2);
        objects.push(rock2);

        var rock3Geom = new THREE.BoxGeometry(6, 8, 7);
        var rock3Mat = new THREE.MeshLambertMaterial({ color: 0x696359 });
        var rock3 = new THREE.Mesh(rock3Geom, rock3Mat);
        rock3.position.set(0, 6, -28);
        rock3.rotation.z = -0.2;
        scene.add(rock3);
        objects.push(rock3);

        var rock4Geom = new THREE.SphereGeometry(4, 8, 8);
        var rock4Mat = new THREE.MeshLambertMaterial({ color: 0x808078 });
        var rock4 = new THREE.Mesh(rock4Geom, rock4Mat);
        rock4.position.set(8, 7, -22);
        scene.add(rock4);
        objects.push(rock4);

        // Cliff-edge firing position: box embrasure wall
        var embrasureGeom = new THREE.BoxGeometry(14, 4, 2);
        var embrasureMat = new THREE.MeshLambertMaterial({ color: 0x5a5a52 });
        var embrasure = new THREE.Mesh(embrasureGeom, embrasureMat);
        embrasure.position.set(0, 12, -15);
        scene.add(embrasure);
        objects.push(embrasure);

        // Firing ports (box cutouts)
        var portGeom = new THREE.BoxGeometry(2, 2, 1);
        var portMat = new THREE.MeshLambertMaterial({ color: 0x3a3a36 });
        var port1 = new THREE.Mesh(portGeom, portMat);
        port1.position.set(-4, 12, -14.5);
        scene.add(port1);
        objects.push(port1);

        var port2 = new THREE.Mesh(portGeom, portMat);
        port2.position.set(4, 12, -14.5);
        scene.add(port2);
        objects.push(port2);

        // Sea-spray-powered desalination unit: cylinder tank
        var tankGeom = new THREE.CylinderGeometry(4, 4, 8, 12);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x4a5a6a });
        var tank = new THREE.Mesh(tankGeom, tankMat);
        tank.position.set(20, 6, -10);
        scene.add(tank);
        objects.push(tank);

        // Desalination processor: box unit adjacent to tank
        var processorGeom = new THREE.BoxGeometry(6, 6, 5);
        var processorMat = new THREE.MeshLambertMaterial({ color: 0x5a6a7a });
        var processor = new THREE.Mesh(processorGeom, processorMat);
        processor.position.set(28, 5, -10);
        scene.add(processor);
        objects.push(processor);

        // Rope ladder cliff descent: cylinder side poles
        var poleGeom = new THREE.CylinderGeometry(0.5, 0.5, 20, 8);
        var poleMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var pole1 = new THREE.Mesh(poleGeom, poleMat);
        pole1.position.set(-5, 5, 5);
        scene.add(pole1);
        objects.push(pole1);

        var pole2 = new THREE.Mesh(poleGeom, poleMat);
        pole2.position.set(5, 5, 5);
        scene.add(pole2);
        objects.push(pole2);

        // Rope ladder rungs: LineSegments
        var rungMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        for (var i = 0; i < 8; i++) {
            var rungGeometry = new THREE.BoxGeometry(11, 0.4, 0.4);
            var rung = new THREE.Mesh(rungGeometry, rungMaterial);
            rung.position.set(0, 15 - (i * 2.5), 5);
            scene.add(rung);
            objects.push(rung);
        }

        // Tidal pool grenade cache: sphere grenades in box rock pool
        var poolGeom = new THREE.BoxGeometry(8, 3, 8);
        var poolMat = new THREE.MeshLambertMaterial({ color: 0x6a7a8a });
        var pool = new THREE.Mesh(poolGeom, poolMat);
        pool.position.set(-20, 2, 10);
        scene.add(pool);
        objects.push(pool);

        var grenadeGeom = new THREE.SphereGeometry(0.8, 6, 6);
        var grenadeMat = new THREE.MeshLambertMaterial({ color: 0x2a4a2a });
        for (var j = 0; j < 5; j++) {
            var grenade = new THREE.Mesh(grenadeGeom, grenadeMat);
            grenade.position.set(-20 + (j - 2) * 1.5, 3, 10);
            scene.add(grenade);
            objects.push(grenade);
        }

        // Sea-bird nest concealment: sphere clusters on ledge boxes
        var ledgeGeom = new THREE.BoxGeometry(6, 2, 6);
        var ledgeMat = new THREE.MeshLambertMaterial({ color: 0x7a8a9a });
        var ledge = new THREE.Mesh(ledgeGeom, ledgeMat);
        ledge.position.set(15, 14, 15);
        scene.add(ledge);
        objects.push(ledge);

        var nestGeom = new THREE.SphereGeometry(1.2, 8, 8);
        var nestMat = new THREE.MeshLambertMaterial({ color: 0x8b6f47 });
        for (var k = 0; k < 4; k++) {
            var nestBird = new THREE.Mesh(nestGeom, nestMat);
            nestBird.position.set(15 + (k - 1.5) * 1.8, 16, 15);
            scene.add(nestBird);
            objects.push(nestBird);
        }

        // Storm-proof command bunker: thick box walls half-buried
        var bunkerWall1Geom = new THREE.BoxGeometry(12, 6, 2);
        var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x4a4a42 });
        var bunkerWall1 = new THREE.Mesh(bunkerWall1Geom, bunkerMat);
        bunkerWall1.position.set(-10, 8, 25);
        scene.add(bunkerWall1);
        objects.push(bunkerWall1);

        var bunkerWall2Geom = new THREE.BoxGeometry(2, 6, 10);
        var bunkerWall2 = new THREE.Mesh(bunkerWall2Geom, bunkerMat);
        bunkerWall2.position.set(-16, 8, 20);
        scene.add(bunkerWall2);
        objects.push(bunkerWall2);

        var bunkerRoof = new THREE.Mesh(bunkerWall1Geom, bunkerMat);
        bunkerRoof.position.set(-10, 11, 25);
        scene.add(bunkerRoof);
        objects.push(bunkerRoof);

        // Interior command post box
        var commandGeom = new THREE.BoxGeometry(8, 4, 6);
        var commandMat = new THREE.MeshLambertMaterial({ color: 0x3a3a36 });
        var command = new THREE.Mesh(commandGeom, commandMat);
        command.position.set(-10, 6, 20);
        scene.add(command);
        objects.push(command);

        // Observation cone on bunker roof
        var obsGeom = new THREE.ConeGeometry(2, 3, 8);
        var obsMat = new THREE.MeshLambertMaterial({ color: 0x5a5a52 });
        var obs = new THREE.Mesh(obsGeom, obsMat);
        obs.position.set(-10, 14, 25);
        scene.add(obs);
        objects.push(obs);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 25, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation loop placeholder
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
