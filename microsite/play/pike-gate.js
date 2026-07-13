window.PikeGate = (function() {
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
        buildGate();
    }

    function buildGate() {
        var leftTowerBase = new THREE.Mesh(
            new THREE.CylinderGeometry(8, 10, 20, 16),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        leftTowerBase.position.set(-25, 10, -15);
        scene.add(leftTowerBase);
        objects.push(leftTowerBase);

        var leftTowerSpike = new THREE.Mesh(
            new THREE.ConeGeometry(5, 12, 16),
            new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        leftTowerSpike.position.set(-25, 30, -15);
        scene.add(leftTowerSpike);
        objects.push(leftTowerSpike);

        var rightTowerBase = new THREE.Mesh(
            new THREE.CylinderGeometry(8, 10, 20, 16),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        rightTowerBase.position.set(25, 10, -15);
        scene.add(rightTowerBase);
        objects.push(rightTowerBase);

        var rightTowerSpike = new THREE.Mesh(
            new THREE.ConeGeometry(5, 12, 16),
            new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        rightTowerSpike.position.set(25, 30, -15);
        scene.add(rightTowerSpike);
        objects.push(rightTowerSpike);

        var gateWallLeft = new THREE.Mesh(
            new THREE.BoxGeometry(6, 22, 3),
            new THREE.MeshLambertMaterial({ color: 0xA0522D })
        );
        gateWallLeft.position.set(-10, 11, -15);
        scene.add(gateWallLeft);
        objects.push(gateWallLeft);

        var gateWallRight = new THREE.Mesh(
            new THREE.BoxGeometry(6, 22, 3),
            new THREE.MeshLambertMaterial({ color: 0xA0522D })
        );
        gateWallRight.position.set(10, 11, -15);
        scene.add(gateWallRight);
        objects.push(gateWallRight);

        var portcullisFrame = new THREE.Mesh(
            new THREE.BoxGeometry(18, 20, 1),
            new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
        );
        portcullisFrame.position.set(0, 10, -10);
        scene.add(portcullisFrame);
        objects.push(portcullisFrame);

        var portcullisPoints = [];
        for (var i = -9; i <= 9; i += 3) {
            portcullisPoints.push(new THREE.Vector3(i, 15, -10));
            portcullisPoints.push(new THREE.Vector3(i, 0, -10));
        }
        var portcullisGeom = new THREE.BufferGeometry().setFromPoints(portcullisPoints);
        var portcullisLines = new THREE.LineSegments(
            portcullisGeom,
            new THREE.LineBasicMaterial({ color: 0x8B7355 })
        );
        scene.add(portcullisLines);
        objects.push(portcullisLines);

        var bridgeLeft = new THREE.Mesh(
            new THREE.BoxGeometry(4, 2, 16),
            new THREE.MeshLambertMaterial({ color: 0x654321 })
        );
        bridgeLeft.position.set(-6, 3, 10);
        scene.add(bridgeLeft);
        objects.push(bridgeLeft);

        var bridgeRight = new THREE.Mesh(
            new THREE.BoxGeometry(4, 2, 16),
            new THREE.MeshLambertMaterial({ color: 0x654321 })
        );
        bridgeRight.position.set(6, 3, 10);
        scene.add(bridgeRight);
        objects.push(bridgeRight);

        var bridgeRailing = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 16, 8),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        bridgeRailing.position.set(-9, 5, 10);
        bridgeRailing.rotation.z = Math.PI / 2;
        scene.add(bridgeRailing);
        objects.push(bridgeRailing);

        var moatWall = new THREE.Mesh(
            new THREE.BoxGeometry(32, 8, 2),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        moatWall.position.set(0, 4, 25);
        scene.add(moatWall);
        objects.push(moatWall);

        var pikeRack1 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 3, 8),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        pikeRack1.position.set(-18, 2, 5);
        scene.add(pikeRack1);
        objects.push(pikeRack1);

        var pike1 = new THREE.Mesh(
            new THREE.ConeGeometry(0.3, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xC0C0C0 })
        );
        pike1.position.set(-18, 6, 5);
        pike1.rotation.x = -0.3;
        scene.add(pike1);
        objects.push(pike1);

        var pikeRack2 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 3, 8),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        pikeRack2.position.set(18, 2, 5);
        scene.add(pikeRack2);
        objects.push(pikeRack2);

        var pike2 = new THREE.Mesh(
            new THREE.ConeGeometry(0.3, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xC0C0C0 })
        );
        pike2.position.set(18, 6, 5);
        pike2.rotation.x = -0.3;
        scene.add(pike2);
        objects.push(pike2);

        var watch = new THREE.Mesh(
            new THREE.SphereGeometry(3, 16, 16),
            new THREE.MeshLambertMaterial({ color: 0x8B6914 })
        );
        watch.position.set(0, 28, -20);
        scene.add(watch);
        objects.push(watch);

        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(15, 20, 10);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += delta * 0.1;
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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
