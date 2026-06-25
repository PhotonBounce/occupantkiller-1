window.AweCamp = (function() {
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
        // Kilchurn Castle keep (tall box tower)
        var keepGeometry = new THREE.BoxGeometry(8, 20, 8);
        var keepMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var keepMesh = new THREE.Mesh(keepGeometry, keepMaterial);
        keepMesh.position.set(-25, 10, -20);
        scene.add(keepMesh);
        objects.push(keepMesh);

        // Castle curtain wall segment 1
        var wallGeometry = new THREE.BoxGeometry(30, 12, 2);
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x9B8B6B });
        var wallMesh1 = new THREE.Mesh(wallGeometry, wallMaterial);
        wallMesh1.position.set(-10, 6, -15);
        scene.add(wallMesh1);
        objects.push(wallMesh1);

        // Castle curtain wall segment 2
        var wallMesh2 = new THREE.Mesh(wallGeometry, wallMaterial);
        wallMesh2.position.set(-10, 6, 5);
        scene.add(wallMesh2);
        objects.push(wallMesh2);

        // Railway viaduct arch 1
        var archGeometry = new THREE.BoxGeometry(4, 3, 6);
        var archMaterial = new THREE.MeshLambertMaterial({ color: 0x704020 });
        var archMesh1 = new THREE.Mesh(archGeometry, archMaterial);
        archMesh1.position.set(5, 12, -18);
        scene.add(archMesh1);
        objects.push(archMesh1);

        // Railway viaduct arch 2
        var archMesh2 = new THREE.Mesh(archGeometry, archMaterial);
        archMesh2.position.set(15, 12, -18);
        scene.add(archMesh2);
        objects.push(archMesh2);

        // Railway viaduct deck on top
        var deckGeometry = new THREE.BoxGeometry(25, 1, 6);
        var deckMaterial = new THREE.MeshLambertMaterial({ color: 0x5A5A5A });
        var deckMesh = new THREE.Mesh(deckGeometry, deckMaterial);
        deckMesh.position.set(10, 15, -18);
        scene.add(deckMesh);
        objects.push(deckMesh);

        // Gun platform on viaduct
        var gunPlatformGeometry = new THREE.BoxGeometry(6, 2, 5);
        var gunMaterial = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
        var gunPlatform = new THREE.Mesh(gunPlatformGeometry, gunMaterial);
        gunPlatform.position.set(10, 17, -18);
        scene.add(gunPlatform);
        objects.push(gunPlatform);

        // Cruachan dam face
        var damGeometry = new THREE.BoxGeometry(40, 25, 3);
        var damMaterial = new THREE.MeshLambertMaterial({ color: 0xA0A0A0 });
        var damMesh = new THREE.Mesh(damGeometry, damMaterial);
        damMesh.position.set(20, 12, 25);
        scene.add(damMesh);
        objects.push(damMesh);

        // Hydroelectric intake pipe 1
        var pipeGeometry = new THREE.CylinderGeometry(1.5, 1.5, 15, 12);
        var pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var pipeMesh1 = new THREE.Mesh(pipeGeometry, pipeMaterial);
        pipeMesh1.position.set(10, 8, 28);
        scene.add(pipeMesh1);
        objects.push(pipeMesh1);

        // Hydroelectric intake pipe 2
        var pipeMesh2 = new THREE.Mesh(pipeGeometry, pipeMaterial);
        pipeMesh2.position.set(20, 8, 28);
        scene.add(pipeMesh2);
        objects.push(pipeMesh2);

        // Hydroelectric intake pipe 3
        var pipeMesh3 = new THREE.Mesh(pipeGeometry, pipeMaterial);
        pipeMesh3.position.set(30, 8, 28);
        scene.add(pipeMesh3);
        objects.push(pipeMesh3);

        // Underwater passage tunnel from dam to loch
        var tunnelGeometry = new THREE.CylinderGeometry(2, 2, 35, 16);
        var tunnelMaterial = new THREE.MeshLambertMaterial({ color: 0x2A4A6A });
        var tunnelMesh = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
        tunnelMesh.rotation.z = Math.PI / 2;
        tunnelMesh.position.set(30, 2, 15);
        scene.add(tunnelMesh);
        objects.push(tunnelMesh);

        // Pass of Brander cliff side 1
        var cliffGeometry = new THREE.BoxGeometry(3, 18, 25);
        var cliffMaterial = new THREE.MeshLambertMaterial({ color: 0x6B5A4A });
        var cliffMesh1 = new THREE.Mesh(cliffGeometry, cliffMaterial);
        cliffMesh1.position.set(-30, 9, 5);
        scene.add(cliffMesh1);
        objects.push(cliffMesh1);

        // Pass of Brander cliff side 2
        var cliffMesh2 = new THREE.Mesh(cliffGeometry, cliffMaterial);
        cliffMesh2.position.set(-32, 9, -5);
        scene.add(cliffMesh2);
        objects.push(cliffMesh2);

        // Boulder ready to drop from cliff 1
        var boulderGeometry = new THREE.SphereGeometry(2, 8, 8);
        var boulderMaterial = new THREE.MeshLambertMaterial({ color: 0x5A4A3A });
        var boulderMesh1 = new THREE.Mesh(boulderGeometry, boulderMaterial);
        boulderMesh1.position.set(-28, 17, 8);
        scene.add(boulderMesh1);
        objects.push(boulderMesh1);

        // Boulder ready to drop from cliff 2
        var boulderMesh2 = new THREE.Mesh(boulderGeometry, boulderMaterial);
        boulderMesh2.position.set(-28, 16, -8);
        scene.add(boulderMesh2);
        objects.push(boulderMesh2);

        // Floating command center barge hull
        var bargeGeometry = new THREE.BoxGeometry(18, 4, 10);
        var bargeMaterial = new THREE.MeshLambertMaterial({ color: 0x2A3A4A });
        var bargeMesh = new THREE.Mesh(bargeGeometry, bargeMaterial);
        bargeMesh.position.set(0, 3, -30);
        scene.add(bargeMesh);
        objects.push(bargeMesh);

        // Barge mast (cylinder)
        var mastGeometry = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
        var mastMaterial = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
        var mastMesh = new THREE.Mesh(mastGeometry, mastMaterial);
        mastMesh.position.set(0, 10, -30);
        scene.add(mastMesh);
        objects.push(mastMesh);

        // Barge bridge superstructure
        var bridgeGeometry = new THREE.BoxGeometry(10, 3, 5);
        var bridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x3A4A5A });
        var bridgeMesh = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        bridgeMesh.position.set(0, 7, -30);
        scene.add(bridgeMesh);
        objects.push(bridgeMesh);

        // Perimeter sensor post 1
        var sensorGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
        var sensorMaterial = new THREE.MeshLambertMaterial({ color: 0x1A1A2A });
        var sensorMesh1 = new THREE.Mesh(sensorGeometry, sensorMaterial);
        sensorMesh1.position.set(28, 4, -28);
        scene.add(sensorMesh1);
        objects.push(sensorMesh1);

        // Perimeter sensor post 2
        var sensorMesh2 = new THREE.Mesh(sensorGeometry, sensorMaterial);
        sensorMesh2.position.set(28, 4, 28);
        scene.add(sensorMesh2);
        objects.push(sensorMesh2);

        // Perimeter sensor wire fence along loch shore
        var fencePoints = [];
        fencePoints.push(new THREE.Vector3(28, 3, -28));
        fencePoints.push(new THREE.Vector3(28, 3, 28));
        var fenceGeometry = new THREE.BufferGeometry().setFromPoints(fencePoints);
        var lineMaterial = new THREE.LineBasicMaterial({ color: 0x00AA00, linewidth: 2 });
        var fenceWire = new THREE.LineSegments(fenceGeometry, lineMaterial);
        scene.add(fenceWire);
        objects.push(fenceWire);

        // Cone watchtower 1 on castle
        var watchtowerGeometry = new THREE.ConeGeometry(2, 8, 8);
        var watchtowerMaterial = new THREE.MeshLambertMaterial({ color: 0x7A6A5A });
        var watchtowerMesh1 = new THREE.Mesh(watchtowerGeometry, watchtowerMaterial);
        watchtowerMesh1.position.set(-25, 22, -20);
        scene.add(watchtowerMesh1);
        objects.push(watchtowerMesh1);

        // Cone watchtower 2 on viaduct
        var watchtowerMesh2 = new THREE.Mesh(watchtowerGeometry, watchtowerMaterial);
        watchtowerMesh2.position.set(10, 19, -18);
        scene.add(watchtowerMesh2);
        objects.push(watchtowerMesh2);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for dramatic shadows
        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(15, 20, 10);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate rotating boulder on cliff
        if (objects.length > 14) {
            objects[14].rotation.x += delta * 0.3;
            objects[14].rotation.z += delta * 0.2;
        }

        // Animate barge swaying
        if (objects.length > 17) {
            objects[17].position.y = 3 + Math.sin(Date.now() * 0.001) * 0.5;
        }

        // Animate mast rotation
        if (objects.length > 19) {
            objects[19].rotation.y += delta * 0.1;
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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
