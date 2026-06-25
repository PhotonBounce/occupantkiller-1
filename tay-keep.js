window.TayKeep = (function() {
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
        // Main tower keep (tall box at center)
        var keepGeometry = new THREE.BoxGeometry(20, 50, 20);
        var keepMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var keepMesh = new THREE.Mesh(keepGeometry, keepMaterial);
        keepMesh.position.set(0, 25, 0);
        scene.add(keepMesh);
        objects.push(keepMesh);

        // Curtain wall (long box around keep)
        var wallGeometry = new THREE.BoxGeometry(60, 15, 40);
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
        wallMesh.position.set(0, 7, 0);
        scene.add(wallMesh);
        objects.push(wallMesh);

        // Tay bridge box section 1
        var bridgeGeometry = new THREE.BoxGeometry(15, 8, 30);
        var bridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var bridgeMesh = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        bridgeMesh.position.set(-25, 4, 0);
        scene.add(bridgeMesh);
        objects.push(bridgeMesh);

        // Tay bridge box section 2
        var bridge2Mesh = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        bridge2Mesh.position.set(25, 4, 0);
        scene.add(bridge2Mesh);
        objects.push(bridge2Mesh);

        // Bridge pier 1 (cylinder)
        var pierGeometry = new THREE.CylinderGeometry(5, 6, 20, 8);
        var pierMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var pier1Mesh = new THREE.Mesh(pierGeometry, pierMaterial);
        pier1Mesh.position.set(-20, 10, -15);
        scene.add(pier1Mesh);
        objects.push(pier1Mesh);

        // Bridge pier 2 (cylinder)
        var pier2Mesh = new THREE.Mesh(pierGeometry, pierMaterial);
        pier2Mesh.position.set(-20, 10, 15);
        scene.add(pier2Mesh);
        objects.push(pier2Mesh);

        // Bridge pier 3 (cylinder)
        var pier3Mesh = new THREE.Mesh(pierGeometry, pierMaterial);
        pier3Mesh.position.set(20, 10, -15);
        scene.add(pier3Mesh);
        objects.push(pier3Mesh);

        // Bridge pier 4 (cylinder)
        var pier4Mesh = new THREE.Mesh(pierGeometry, pierMaterial);
        pier4Mesh.position.set(20, 10, 15);
        scene.add(pier4Mesh);
        objects.push(pier4Mesh);

        // River patrol galley hull (box)
        var galleyGeometry = new THREE.BoxGeometry(12, 6, 25);
        var galleyMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
        var galleyMesh = new THREE.Mesh(galleyGeometry, galleyMaterial);
        galleyMesh.position.set(-30, 3, -25);
        scene.add(galleyMesh);
        objects.push(galleyMesh);

        // Galley oar pole 1 (cylinder)
        var oarGeometry = new THREE.CylinderGeometry(1, 1, 18, 6);
        var oarMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var oar1Mesh = new THREE.Mesh(oarGeometry, oarMaterial);
        oar1Mesh.position.set(-35, 5, -25);
        oar1Mesh.rotation.z = Math.PI / 4;
        scene.add(oar1Mesh);
        objects.push(oar1Mesh);

        // Galley oar pole 2 (cylinder)
        var oar2Mesh = new THREE.Mesh(oarGeometry, oarMaterial);
        oar2Mesh.position.set(-25, 5, -25);
        oar2Mesh.rotation.z = Math.PI / 4;
        scene.add(oar2Mesh);
        objects.push(oar2Mesh);

        // Salmon fishing weir wall (box)
        var weirGeometry = new THREE.BoxGeometry(40, 6, 3);
        var weirMaterial = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var weirMesh = new THREE.Mesh(weirGeometry, weirMaterial);
        weirMesh.position.set(0, 3, -28);
        scene.add(weirMesh);
        objects.push(weirMesh);

        // Fish trap line segments (obstacle barrier)
        var trapPoints = [];
        trapPoints.push(new THREE.Vector3(-18, 5, -28));
        trapPoints.push(new THREE.Vector3(-18, 8, -28));
        trapPoints.push(new THREE.Vector3(-14, 5, -28));
        trapPoints.push(new THREE.Vector3(-14, 8, -28));
        trapPoints.push(new THREE.Vector3(-10, 5, -28));
        trapPoints.push(new THREE.Vector3(-10, 8, -28));
        trapPoints.push(new THREE.Vector3(-6, 5, -28));
        trapPoints.push(new THREE.Vector3(-6, 8, -28));
        trapPoints.push(new THREE.Vector3(-2, 5, -28));
        trapPoints.push(new THREE.Vector3(-2, 8, -28));
        trapPoints.push(new THREE.Vector3(2, 5, -28));
        trapPoints.push(new THREE.Vector3(2, 8, -28));
        trapPoints.push(new THREE.Vector3(6, 5, -28));
        trapPoints.push(new THREE.Vector3(6, 8, -28));
        trapPoints.push(new THREE.Vector3(10, 5, -28));
        trapPoints.push(new THREE.Vector3(10, 8, -28));
        trapPoints.push(new THREE.Vector3(14, 5, -28));
        trapPoints.push(new THREE.Vector3(14, 8, -28));
        trapPoints.push(new THREE.Vector3(18, 5, -28));
        trapPoints.push(new THREE.Vector3(18, 8, -28));
        var trapGeometry = new THREE.BufferGeometry().setFromPoints(trapPoints);
        var trapMaterial = new THREE.LineBasicMaterial({ color: 0x228B22 });
        var trapMesh = new THREE.LineSegments(trapGeometry, trapMaterial);
        scene.add(trapMesh);
        objects.push(trapMesh);

        // Flood-warning signal tower (cylinder tower)
        var signalGeometry = new THREE.CylinderGeometry(4, 5, 35, 8);
        var signalMaterial = new THREE.MeshLambertMaterial({ color: 0x808000 });
        var signalMesh = new THREE.Mesh(signalGeometry, signalMaterial);
        signalMesh.position.set(30, 17, -20);
        scene.add(signalMesh);
        objects.push(signalMesh);

        // Warning lamp (sphere at tower top)
        var lampGeometry = new THREE.SphereGeometry(3, 16, 16);
        var lampMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
        var lampMesh = new THREE.Mesh(lampGeometry, lampMaterial);
        lampMesh.position.set(30, 40, -20);
        scene.add(lampMesh);
        objects.push(lampMesh);

        // Toll-gate gatehouse (box)
        var gateGeometry = new THREE.BoxGeometry(18, 20, 12);
        var gateMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var gateMesh = new THREE.Mesh(gateGeometry, gateMaterial);
        gateMesh.position.set(-35, 10, 20);
        scene.add(gateMesh);
        objects.push(gateMesh);

        // Toll-gate drop arm (cylinder)
        var armGeometry = new THREE.CylinderGeometry(2, 2, 20, 6);
        var armMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var armMesh = new THREE.Mesh(armGeometry, armMaterial);
        armMesh.position.set(-35, 20, 20);
        armMesh.rotation.z = Math.PI / 6;
        scene.add(armMesh);
        objects.push(armMesh);

        // River artillery battery gun mount (box)
        var gunMountGeometry = new THREE.BoxGeometry(16, 5, 10);
        var gunMountMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var gunMountMesh = new THREE.Mesh(gunMountGeometry, gunMountMaterial);
        gunMountMesh.position.set(30, 2.5, 25);
        scene.add(gunMountMesh);
        objects.push(gunMountMesh);

        // Gun barrel 1 (cylinder)
        var barrelGeometry = new THREE.CylinderGeometry(1.5, 1.8, 16, 8);
        var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });
        var barrel1Mesh = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel1Mesh.position.set(25, 8, 25);
        barrel1Mesh.rotation.z = Math.PI / 12;
        scene.add(barrel1Mesh);
        objects.push(barrel1Mesh);

        // Gun barrel 2 (cylinder)
        var barrel2Mesh = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel2Mesh.position.set(35, 8, 25);
        barrel2Mesh.rotation.z = Math.PI / 12;
        scene.add(barrel2Mesh);
        objects.push(barrel2Mesh);

        // Defensive cone tower (cone on top of keep)
        var coneGeometry = new THREE.ConeGeometry(10, 15, 8);
        var coneMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        var coneMesh = new THREE.Mesh(coneGeometry, coneMaterial);
        coneMesh.position.set(0, 60, 0);
        scene.add(coneMesh);
        objects.push(coneMesh);

        // Riverside beacon sphere
        var beaconGeometry = new THREE.SphereGeometry(2.5, 12, 12);
        var beaconMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var beaconMesh = new THREE.Mesh(beaconGeometry, beaconMaterial);
        beaconMesh.position.set(-30, 25, 20);
        scene.add(beaconMesh);
        objects.push(beaconMesh);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light (sun from above)
        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(50, 40, 30);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        if (!scene) return;

        // Rotate warning lamp
        if (objects.length > 15) {
            objects[15].rotation.y += 0.02;
        }

        // Animate galley
        if (objects.length > 8) {
            objects[8].position.z += 0.05;
            if (objects[8].position.z > 20) {
                objects[8].position.z = -30;
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
