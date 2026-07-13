window.GarvellachBase = (function() {
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
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        lights.push(ambientLight);
        scene.add(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 40, 20);
        lights.push(directionalLight);
        scene.add(directionalLight);

        var terrain = new THREE.Mesh(
            new THREE.BoxGeometry(80, 5, 80),
            new THREE.MeshLambertMaterial({ color: 0x2d5016 })
        );
        terrain.position.set(0, -2.5, 0);
        objects.push(terrain);
        scene.add(terrain);

        var dunChonnuillWall1 = new THREE.Mesh(
            new THREE.BoxGeometry(20, 8, 2),
            new THREE.MeshLambertMaterial({ color: 0x5a4a3a })
        );
        dunChonnuillWall1.position.set(-8, 4, -20);
        objects.push(dunChonnuillWall1);
        scene.add(dunChonnuillWall1);

        var dunChonnuillWall2 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 8, 18),
            new THREE.MeshLambertMaterial({ color: 0x5a4a3a })
        );
        dunChonnuillWall2.position.set(2, 4, -12);
        objects.push(dunChonnuillWall2);
        scene.add(dunChonnuillWall2);

        var lookoutPost = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 3.5, 12, 12),
            new THREE.MeshLambertMaterial({ color: 0x4a3a2a })
        );
        lookoutPost.position.set(-15, 6, -22);
        objects.push(lookoutPost);
        scene.add(lookoutPost);

        var beehiveCell1 = new THREE.Mesh(
            new THREE.BoxGeometry(4, 5, 4),
            new THREE.MeshLambertMaterial({ color: 0x6b5d4f })
        );
        beehiveCell1.position.set(12, 2.5, -15);
        objects.push(beehiveCell1);
        scene.add(beehiveCell1);

        var beehiveCell2 = new THREE.Mesh(
            new THREE.BoxGeometry(4, 5, 4),
            new THREE.MeshLambertMaterial({ color: 0x7a6d5f })
        );
        beehiveCell2.position.set(18, 2.5, -14);
        objects.push(beehiveCell2);
        scene.add(beehiveCell2);

        var supplyCapsule = new THREE.Mesh(
            new THREE.SphereGeometry(2.5, 16, 16),
            new THREE.MeshLambertMaterial({ color: 0x1a3a1a })
        );
        supplyCapsule.position.set(15, 1, -10);
        objects.push(supplyCapsule);
        scene.add(supplyCapsule);

        var accessTunnel = new THREE.Mesh(
            new THREE.BoxGeometry(3, 3, 8),
            new THREE.MeshLambertMaterial({ color: 0x3a2a1a })
        );
        accessTunnel.position.set(20, 1.5, -5);
        objects.push(accessTunnel);
        scene.add(accessTunnel);

        var seastackBase = new THREE.Mesh(
            new THREE.CylinderGeometry(4, 5, 15, 8),
            new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
        );
        seastackBase.position.set(-25, 7.5, 15);
        objects.push(seastackBase);
        scene.add(seastackBase);

        var sniperPlatform = new THREE.Mesh(
            new THREE.BoxGeometry(8, 2, 8),
            new THREE.MeshLambertMaterial({ color: 0x5a5a5a })
        );
        sniperPlatform.position.set(-25, 16, 15);
        objects.push(sniperPlatform);
        scene.add(sniperPlatform);

        var sonarBuoy1 = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 12, 12),
            new THREE.MeshLambertMaterial({ color: 0x1a1a4a })
        );
        sonarBuoy1.position.set(-10, 0.5, 25);
        objects.push(sonarBuoy1);
        scene.add(sonarBuoy1);

        var sonarBuoy2 = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 12, 12),
            new THREE.MeshLambertMaterial({ color: 0x1a1a4a })
        );
        sonarBuoy2.position.set(5, 0.5, 28);
        objects.push(sonarBuoy2);
        scene.add(sonarBuoy2);

        var detectionCable = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-10, 0.5, 25),
                new THREE.Vector3(5, 0.5, 28)
            ]),
            new THREE.LineBasicMaterial({ color: 0x0a0a5a, linewidth: 2 })
        );
        objects.push(detectionCable);
        scene.add(detectionCable);

        var seaplaneRunway = new THREE.Mesh(
            new THREE.BoxGeometry(30, 1, 6),
            new THREE.MeshLambertMaterial({ color: 0x8a7a6a })
        );
        seaplaneRunway.position.set(0, 0.5, -30);
        objects.push(seaplaneRunway);
        scene.add(seaplaneRunway);

        var mooringPost = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 6, 8),
            new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
        );
        mooringPost.position.set(-12, 3, -28);
        objects.push(mooringPost);
        scene.add(mooringPost);

        var approachCableLeft = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-15, 5, -35),
                new THREE.Vector3(-12, 3, -28)
            ]),
            new THREE.LineBasicMaterial({ color: 0x5a5a3a, linewidth: 2 })
        );
        objects.push(approachCableLeft);
        scene.add(approachCableLeft);

        var approachCableRight = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(15, 5, -35),
                new THREE.Vector3(12, 3, -28)
            ]),
            new THREE.LineBasicMaterial({ color: 0x5a5a3a, linewidth: 2 })
        );
        objects.push(approachCableRight);
        scene.add(approachCableRight);

        var bunkerMain = new THREE.Mesh(
            new THREE.BoxGeometry(12, 6, 10),
            new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
        );
        bunkerMain.position.set(25, 3, 0);
        objects.push(bunkerMain);
        scene.add(bunkerMain);

        var ventilationShaft = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
        );
        ventilationShaft.position.set(20, 7, 3);
        objects.push(ventilationShaft);
        scene.add(ventilationShaft);

        var blastDoor = new THREE.Mesh(
            new THREE.BoxGeometry(4, 5, 0.5),
            new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
        );
        blastDoor.position.set(31, 2.5, -4);
        objects.push(blastDoor);
        scene.add(blastDoor);

        var gunEmplacement = new THREE.Mesh(
            new THREE.BoxGeometry(10, 3, 8),
            new THREE.MeshLambertMaterial({ color: 0x3a3a2a })
        );
        gunEmplacement.position.set(-30, 1.5, 8);
        objects.push(gunEmplacement);
        scene.add(gunEmplacement);

        var gunBarrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 14, 8),
            new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
        );
        gunBarrel.rotation.z = Math.PI / 6;
        gunBarrel.position.set(-32, 4, 10);
        objects.push(gunBarrel);
        scene.add(gunBarrel);

        var ammoHoist1 = new THREE.Mesh(
            new THREE.BoxGeometry(3, 4, 3),
            new THREE.MeshLambertMaterial({ color: 0x5a5a4a })
        );
        ammoHoist1.position.set(-25, 2, 5);
        objects.push(ammoHoist1);
        scene.add(ammoHoist1);

        var ammoHoist2 = new THREE.Mesh(
            new THREE.BoxGeometry(3, 4, 3),
            new THREE.MeshLambertMaterial({ color: 0x5a5a4a })
        );
        ammoHoist2.position.set(-28, 2, 12);
        objects.push(ammoHoist2);
        scene.add(ammoHoist2);

        var watchTower = new THREE.Mesh(
            new THREE.ConeGeometry(3, 10, 8),
            new THREE.MeshLambertMaterial({ color: 0x5a4a3a })
        );
        watchTower.position.set(10, 5, 20);
        objects.push(watchTower);
        scene.add(watchTower);

        var defensiveWall = new THREE.Mesh(
            new THREE.BoxGeometry(15, 4, 1),
            new THREE.MeshLambertMaterial({ color: 0x6a5a4a })
        );
        defensiveWall.position.set(8, 2, 28);
        objects.push(defensiveWall);
        scene.add(defensiveWall);
    }

    function update(delta) {
        if (objects.length > 0) {
            var watchTowerIndex = objects.length - 2;
            if (watchTowerIndex >= 0 && objects[watchTowerIndex]) {
                objects[watchTowerIndex].rotation.y += 0.3 * delta;
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
