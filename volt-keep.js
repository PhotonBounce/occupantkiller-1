window.VoltKeep = (function() {
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
        // Central Tesla coil tower - cylinder stack with sphere top
        var coilBase = new THREE.Mesh(
            new THREE.CylinderGeometry(8, 10, 6, 32),
            new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
        );
        coilBase.position.set(0, 3, 0);
        scene.add(coilBase);
        objects.push(coilBase);

        var coilMid = new THREE.Mesh(
            new THREE.CylinderGeometry(6, 8, 5, 32),
            new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
        );
        coilMid.position.set(0, 10, 0);
        scene.add(coilMid);
        objects.push(coilMid);

        var coilTop = new THREE.Mesh(
            new THREE.SphereGeometry(5, 32, 32),
            new THREE.MeshLambertMaterial({ color: 0x00ff88 })
        );
        coilTop.position.set(0, 17, 0);
        scene.add(coilTop);
        objects.push(coilTop);

        // Left transformer tower
        var leftTowerBase = new THREE.Mesh(
            new THREE.BoxGeometry(5, 8, 5),
            new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        leftTowerBase.position.set(-20, 4, -15);
        scene.add(leftTowerBase);
        objects.push(leftTowerBase);

        var leftTowerMid = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 3, 6, 32),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        leftTowerMid.position.set(-20, 12, -15);
        scene.add(leftTowerMid);
        objects.push(leftTowerMid);

        var leftTowerTop = new THREE.Mesh(
            new THREE.SphereGeometry(3, 32, 32),
            new THREE.MeshLambertMaterial({ color: 0xff6600 })
        );
        leftTowerTop.position.set(-20, 18, -15);
        scene.add(leftTowerTop);
        objects.push(leftTowerTop);

        // Right transformer tower
        var rightTowerBase = new THREE.Mesh(
            new THREE.BoxGeometry(5, 8, 5),
            new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        rightTowerBase.position.set(20, 4, -15);
        scene.add(rightTowerBase);
        objects.push(rightTowerBase);

        var rightTowerMid = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 3, 6, 32),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        rightTowerMid.position.set(20, 12, -15);
        scene.add(rightTowerMid);
        objects.push(rightTowerMid);

        var rightTowerTop = new THREE.Mesh(
            new THREE.SphereGeometry(3, 32, 32),
            new THREE.MeshLambertMaterial({ color: 0xff6600 })
        );
        rightTowerTop.position.set(20, 18, -15);
        scene.add(rightTowerTop);
        objects.push(rightTowerTop);

        // Generator building - box structure
        var genBuilding = new THREE.Mesh(
            new THREE.BoxGeometry(15, 10, 12),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        genBuilding.position.set(0, 5, 20);
        scene.add(genBuilding);
        objects.push(genBuilding);

        // Generator cooling cone
        var genCone = new THREE.Mesh(
            new THREE.ConeGeometry(6, 8, 32),
            new THREE.MeshLambertMaterial({ color: 0x666666 })
        );
        genCone.position.set(0, 14, 20);
        scene.add(genCone);
        objects.push(genCone);

        // Electrical arc sphere cluster - left side
        var arcSphere1 = new THREE.Mesh(
            new THREE.SphereGeometry(2, 32, 32),
            new THREE.MeshLambertMaterial({ color: 0x00ffff })
        );
        arcSphere1.position.set(-15, 22, 5);
        scene.add(arcSphere1);
        objects.push(arcSphere1);

        var arcSphere2 = new THREE.Mesh(
            new THREE.SphereGeometry(1.8, 32, 32),
            new THREE.MeshLambertMaterial({ color: 0x00ff88 })
        );
        arcSphere2.position.set(-12, 24, 6);
        scene.add(arcSphere2);
        objects.push(arcSphere2);

        // Electrical arc sphere cluster - right side
        var arcSphere3 = new THREE.Mesh(
            new THREE.SphereGeometry(2, 32, 32),
            new THREE.MeshLambertMaterial({ color: 0x00ffff })
        );
        arcSphere3.position.set(15, 22, 5);
        scene.add(arcSphere3);
        objects.push(arcSphere3);

        var arcSphere4 = new THREE.Mesh(
            new THREE.SphereGeometry(1.8, 32, 32),
            new THREE.MeshLambertMaterial({ color: 0x00ff88 })
        );
        arcSphere4.position.set(12, 24, 6);
        scene.add(arcSphere4);
        objects.push(arcSphere4);

        // Power line mast cylinder
        var mastCylinder = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 20, 16),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        mastCylinder.position.set(-25, 10, 10);
        scene.add(mastCylinder);
        objects.push(mastCylinder);

        // Power lines (LineSegments)
        var lineGeometry = new THREE.BufferGeometry();
        var linePositions = new Float32Array([
            -25, 20, 10,
            0, 17, 0,
            0, 17, 0,
            20, 18, -15,
            20, 18, -15,
            25, 20, 10
        ]);
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        var lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
        var powerLines = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(powerLines);
        objects.push(powerLines);

        // Lighting setup
        var mainLight = new THREE.PointLight(0x00ffff, 1.5, 100);
        mainLight.position.set(0, 25, 0);
        scene.add(mainLight);
        lights.push(mainLight);

        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);
    }

    function update(delta) {
        if (!scene || objects.length === 0) return;

        // Rotate central sphere
        if (objects[2]) {
            objects[2].rotation.y += delta * 0.5;
        }

        // Pulse glow spheres
        if (objects[11]) {
            objects[11].scale.x = 1 + Math.sin(Date.now() * 0.003) * 0.2;
            objects[11].scale.y = objects[11].scale.x;
            objects[11].scale.z = objects[11].scale.x;
        }

        if (objects[13]) {
            objects[13].scale.x = 1 + Math.sin(Date.now() * 0.003 + Math.PI) * 0.2;
            objects[13].scale.y = objects[13].scale.x;
            objects[13].scale.z = objects[13].scale.x;
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
