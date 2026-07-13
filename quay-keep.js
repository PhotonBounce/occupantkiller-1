window.QuayKeep = (function() {
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
        // Stone quay wall foundation
        var wallGeom = new THREE.BoxGeometry(60, 8, 4);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var wall = new THREE.Mesh(wallGeom, wallMat);
        wall.position.set(0, 4, -28);
        scene.add(wall);
        objects.push(wall);

        // Eastern quay extension
        var eastWallGeom = new THREE.BoxGeometry(8, 6, 30);
        var eastWall = new THREE.Mesh(eastWallGeom, wallMat);
        eastWall.position.set(28, 3, 0);
        scene.add(eastWall);
        objects.push(eastWall);

        // Western quay extension
        var westWall = new THREE.Mesh(eastWallGeom, wallMat);
        westWall.position.set(-28, 3, 0);
        scene.add(westWall);
        objects.push(westWall);

        // Iron ring post 1 (cylinder)
        var ringGeom = new THREE.CylinderGeometry(1.2, 1.2, 5, 16);
        var ironMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var ring1 = new THREE.Mesh(ringGeom, ironMat);
        ring1.position.set(-20, 6.5, -26);
        scene.add(ring1);
        objects.push(ring1);

        // Iron ring post 2
        var ring2 = new THREE.Mesh(ringGeom, ironMat);
        ring2.position.set(-5, 6.5, -26);
        scene.add(ring2);
        objects.push(ring2);

        // Iron ring post 3
        var ring3 = new THREE.Mesh(ringGeom, ironMat);
        ring3.position.set(10, 6.5, -26);
        scene.add(ring3);
        objects.push(ring3);

        // Iron ring post 4
        var ring4 = new THREE.Mesh(ringGeom, ironMat);
        ring4.position.set(25, 6.5, -26);
        scene.add(ring4);
        objects.push(ring4);

        // Harbour master's tower base
        var towerBaseGeom = new THREE.CylinderGeometry(6, 7, 2, 12);
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0xA0826D });
        var towerBase = new THREE.Mesh(towerBaseGeom, stoneMat);
        towerBase.position.set(-20, 1, 18);
        scene.add(towerBase);
        objects.push(towerBase);

        // Tower main shaft
        var towerShaftGeom = new THREE.CylinderGeometry(5, 5, 14, 12);
        var towerShaft = new THREE.Mesh(towerShaftGeom, stoneMat);
        towerShaft.position.set(-20, 9, 18);
        scene.add(towerShaft);
        objects.push(towerShaft);

        // Tower top cap (cone)
        var towerCapGeom = new THREE.ConeGeometry(5.5, 4, 12);
        var towerCap = new THREE.Mesh(towerCapGeom, ironMat);
        towerCap.position.set(-20, 17, 18);
        scene.add(towerCap);
        objects.push(towerCap);

        // Dock crane arm (horizontal box)
        var craneArmGeom = new THREE.BoxGeometry(24, 2, 2);
        var metalMat = new THREE.MeshLambertMaterial({ color: 0x556B6B });
        var craneArm = new THREE.Mesh(craneArmGeom, metalMat);
        craneArm.position.set(0, 14, 15);
        scene.add(craneArm);
        objects.push(craneArm);

        // Crane post (vertical cylinder)
        var cranePostGeom = new THREE.CylinderGeometry(1.5, 1.5, 12, 10);
        var cranePost = new THREE.Mesh(cranePostGeom, metalMat);
        cranePost.position.set(-18, 8, 15);
        scene.add(cranePost);
        objects.push(cranePost);

        // Cable lines from crane (LineSegments for visual cables)
        var cableGeom = new THREE.BufferGeometry();
        var cableVertices = new Float32Array([
            0, 14, 15,    10, 2, 20,
            0, 14, 15,    -10, 2, 20,
            0, 14, 15,    18, 2, 15
        ]);
        cableGeom.setAttribute('position', new THREE.BufferAttribute(cableVertices, 3));
        var lineMat = new THREE.LineBasicMaterial({ color: 0xDEB887 });
        var cables = new THREE.LineSegments(cableGeom, lineMat);
        cables.position.set(0, 0, 0);
        scene.add(cables);
        objects.push(cables);

        // Moored patrol boat 1 (flat box hull)
        var boatHullGeom = new THREE.BoxGeometry(8, 2, 16);
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var boat1 = new THREE.Mesh(boatHullGeom, boatMat);
        boat1.position.set(-15, 0.5, -8);
        scene.add(boat1);
        objects.push(boat1);

        // Boat superstructure 1 (small box)
        var boatSuperGeom = new THREE.BoxGeometry(5, 3, 4);
        var boat1Super = new THREE.Mesh(boatSuperGeom, new THREE.MeshLambertMaterial({ color: 0x36454F }));
        boat1Super.position.set(-15, 3, -6);
        scene.add(boat1Super);
        objects.push(boat1Super);

        // Moored patrol boat 2 (flat box hull)
        var boat2 = new THREE.Mesh(boatHullGeom, boatMat);
        boat2.position.set(8, 0.5, -12);
        scene.add(boat2);
        objects.push(boat2);

        // Boat superstructure 2
        var boat2Super = new THREE.Mesh(boatSuperGeom, new THREE.MeshLambertMaterial({ color: 0x36454F }));
        boat2Super.position.set(8, 3, -10);
        scene.add(boat2Super);
        objects.push(boat2Super);

        // Chain boom sphere post 1 (sphere at harbour mouth)
        var boomPostGeom = new THREE.SphereGeometry(2, 8, 8);
        var boomMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var boomPost1 = new THREE.Mesh(boomPostGeom, boomMat);
        boomPost1.position.set(-18, 1, 28);
        scene.add(boomPost1);
        objects.push(boomPost1);

        // Chain boom sphere post 2
        var boomPost2 = new THREE.Mesh(boomPostGeom, boomMat);
        boomPost2.position.set(18, 1, 28);
        scene.add(boomPost2);
        objects.push(boomPost2);

        // Chain boom connecting line (LineSegments)
        var boomChainGeom = new THREE.BufferGeometry();
        var boomVertices = new Float32Array([
            -18, 1, 28,    18, 1, 28,
            -18, 2, 28,    -18, 1.5, 25,
            18, 2, 28,     18, 1.5, 25
        ]);
        boomChainGeom.setAttribute('position', new THREE.BufferAttribute(boomVertices, 3));
        var chainMat = new THREE.LineBasicMaterial({ color: 0x696969 });
        var boomChain = new THREE.LineSegments(boomChainGeom, chainMat);
        scene.add(boomChain);
        objects.push(boomChain);

        // Storage warehouse box
        var warehouseGeom = new THREE.BoxGeometry(20, 10, 12);
        var warehouseMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var warehouse = new THREE.Mesh(warehouseGeom, warehouseMat);
        warehouse.position.set(20, 5, -15);
        scene.add(warehouse);
        objects.push(warehouse);

        // Harbour beacon (cone shape on tower top)
        var beaconGeom = new THREE.ConeGeometry(1.5, 3, 10);
        var beaconMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var beacon = new THREE.Mesh(beaconGeom, beaconMat);
        beacon.position.set(-20, 20, 18);
        scene.add(beacon);
        objects.push(beacon);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light from above
        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(30, 40, 30);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animate beacon rotation
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].position && objects[i].position.x === -20 &&
                objects[i].position.y > 19 && objects[i].position.y < 21) {
                objects[i].rotation.y += 0.03;
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
