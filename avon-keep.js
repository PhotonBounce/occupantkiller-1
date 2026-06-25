window.AvonKeep = (function() {
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
        // River terrain - curved box
        var terrainGeom = new THREE.BoxGeometry(80, 4, 60);
        var terrainMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, -2, 0);
        scene.add(terrain);
        objects.push(terrain);

        // River water surface
        var riverGeom = new THREE.BoxGeometry(20, 0.5, 60);
        var riverMat = new THREE.MeshLambertMaterial({ color: 0x4A90E2 });
        var river = new THREE.Mesh(riverGeom, riverMat);
        river.position.set(0, 0, 0);
        scene.add(river);
        objects.push(river);

        // Water-mill main building
        var millGeom = new THREE.BoxGeometry(14, 12, 10);
        var millMat = new THREE.MeshLambertMaterial({ color: 0xD2691E });
        var mill = new THREE.Mesh(millGeom, millMat);
        mill.position.set(-18, 6, 15);
        scene.add(mill);
        objects.push(mill);

        // Water-mill wheel
        var wheelGeom = new THREE.CylinderGeometry(8, 8, 2, 16);
        var wheelMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.position.set(-18, 4, 20);
        wheel.rotation.z = Math.PI / 2;
        scene.add(wheel);
        objects.push(wheel);

        // Drawbridge main structure
        var bridgeGeom = new THREE.BoxGeometry(16, 1, 12);
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var bridge = new THREE.Mesh(bridgeGeom, bridgeMat);
        bridge.position.set(20, 3, 0);
        scene.add(bridge);
        objects.push(bridge);

        // Drawbridge chains (left)
        var chainLeftGeom = new THREE.BufferGeometry();
        var chainLeftPos = new Float32Array([
            -8, 4, 0,
            -8, 12, 0
        ]);
        chainLeftGeom.setAttribute('position', new THREE.BufferAttribute(chainLeftPos, 3));
        var chainMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var chainLeft = new THREE.LineSegments(chainLeftGeom, chainMat);
        chainLeft.position.set(20, 0, 0);
        scene.add(chainLeft);
        objects.push(chainLeft);

        // Drawbridge chains (right)
        var chainRightGeom = new THREE.BufferGeometry();
        var chainRightPos = new Float32Array([
            8, 4, 0,
            8, 12, 0
        ]);
        chainRightGeom.setAttribute('position', new THREE.BufferAttribute(chainRightPos, 3));
        var chainRight = new THREE.LineSegments(chainRightGeom, chainMat);
        chainRight.position.set(20, 0, 0);
        scene.add(chainRight);
        objects.push(chainRight);

        // Portcullis gate arch (box frame)
        var archGeom = new THREE.BoxGeometry(14, 16, 1);
        var archMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var arch = new THREE.Mesh(archGeom, archMat);
        arch.position.set(0, 8, -20);
        scene.add(arch);
        objects.push(arch);

        // Portcullis grating
        var gratingGeom = new THREE.BufferGeometry();
        var gratingPos = new Float32Array([
            -6, 0, 0, -6, 14, 0,
            -2, 0, 0, -2, 14, 0,
            2, 0, 0, 2, 14, 0,
            6, 0, 0, 6, 14, 0
        ]);
        gratingGeom.setAttribute('position', new THREE.BufferAttribute(gratingPos, 3));
        var gratingMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var grating = new THREE.LineSegments(gratingGeom, gratingMat);
        grating.position.set(0, 2, -20);
        scene.add(grating);
        objects.push(grating);

        // Magazine building (raised on stilts)
        var magazineGeom = new THREE.BoxGeometry(12, 10, 10);
        var magazineMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var magazine = new THREE.Mesh(magazineGeom, magazineMat);
        magazine.position.set(-25, 12, -18);
        scene.add(magazine);
        objects.push(magazine);

        // Magazine stilts (left)
        var stiltLeftGeom = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
        var stiltMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var stiltLeft = new THREE.Mesh(stiltLeftGeom, stiltMat);
        stiltLeft.position.set(-21, 4, -15);
        scene.add(stiltLeft);
        objects.push(stiltLeft);

        // Magazine stilts (right)
        var stiltRightGeom = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
        var stiltRight = new THREE.Mesh(stiltRightGeom, stiltMat);
        stiltRight.position.set(-29, 4, -15);
        scene.add(stiltRight);
        objects.push(stiltRight);

        // Patrol boat hull (left mooring)
        var boatLeftGeom = new THREE.BoxGeometry(8, 3, 4);
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x800020 });
        var boatLeft = new THREE.Mesh(boatLeftGeom, boatMat);
        boatLeft.position.set(-15, 1.5, -25);
        scene.add(boatLeft);
        objects.push(boatLeft);

        // Patrol boat mooring rope (left)
        var mooreLeftGeom = new THREE.BufferGeometry();
        var mooreLPos = new Float32Array([
            -15, 3, -25,
            -15, 1, -22
        ]);
        mooreLeftGeom.setAttribute('position', new THREE.BufferAttribute(mooreLPos, 3));
        var mooreMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var mooreLeft = new THREE.LineSegments(mooreLeftGeom, mooreMat);
        scene.add(mooreLeft);
        objects.push(mooreLeft);

        // Patrol boat hull (right mooring)
        var boatRightGeom = new THREE.BoxGeometry(8, 3, 4);
        var boatRight = new THREE.Mesh(boatRightGeom, boatMat);
        boatRight.position.set(15, 1.5, -25);
        scene.add(boatRight);
        objects.push(boatRight);

        // Patrol boat mooring rope (right)
        var mooreRightGeom = new THREE.BufferGeometry();
        var mooreRPos = new Float32Array([
            15, 3, -25,
            15, 1, -22
        ]);
        mooreRightGeom.setAttribute('position', new THREE.BufferAttribute(mooreRPos, 3));
        var mooreRight = new THREE.LineSegments(mooreRightGeom, mooreMat);
        scene.add(mooreRight);
        objects.push(mooreRight);

        // Underwater chain boom (left anchor)
        var anchorLeftGeom = new THREE.CylinderGeometry(1, 1, 6, 8);
        var anchorMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var anchorLeft = new THREE.Mesh(anchorLeftGeom, anchorMat);
        anchorLeft.position.set(-10, -1, 25);
        scene.add(anchorLeft);
        objects.push(anchorLeft);

        // Underwater chain boom (right anchor)
        var anchorRightGeom = new THREE.CylinderGeometry(1, 1, 6, 8);
        var anchorRight = new THREE.Mesh(anchorRightGeom, anchorMat);
        anchorRight.position.set(10, -1, 25);
        scene.add(anchorRight);
        objects.push(anchorRight);

        // Chain boom grating
        var boomGeom = new THREE.BufferGeometry();
        var boomPos = new Float32Array([
            -10, 0.5, 25,
            10, 0.5, 25,
            -10, -0.5, 25,
            10, -0.5, 25
        ]);
        boomGeom.setAttribute('position', new THREE.BufferAttribute(boomPos, 3));
        var boomMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var boom = new THREE.LineSegments(boomGeom, boomMat);
        scene.add(boom);
        objects.push(boom);

        // Fish-weir observation platform
        var weirGeom = new THREE.BoxGeometry(16, 1.5, 14);
        var weirMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var weir = new THREE.Mesh(weirGeom, weirMat);
        weir.position.set(0, 8, 28);
        scene.add(weir);
        objects.push(weir);

        // Weir observation posts (left)
        var weirPostLeftGeom = new THREE.CylinderGeometry(0.8, 0.8, 10, 8);
        var postMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var weirPostLeft = new THREE.Mesh(weirPostLeftGeom, postMat);
        weirPostLeft.position.set(-7, 3, 25);
        scene.add(weirPostLeft);
        objects.push(weirPostLeft);

        // Weir observation posts (right)
        var weirPostRightGeom = new THREE.CylinderGeometry(0.8, 0.8, 10, 8);
        var weirPostRight = new THREE.Mesh(weirPostRightGeom, postMat);
        weirPostRight.position.set(7, 3, 25);
        scene.add(weirPostRight);
        objects.push(weirPostRight);

        // Central keep tower
        var towerGeom = new THREE.CylinderGeometry(5, 6, 20, 16);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(0, 10, 0);
        scene.add(tower);
        objects.push(tower);

        // Tower top cone
        var coneGeom = new THREE.ConeGeometry(5.5, 8, 16);
        var coneMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var cone = new THREE.Mesh(coneGeom, coneMat);
        cone.position.set(0, 24, 0);
        scene.add(cone);
        objects.push(cone);

        // Observation sphere on tower
        var sphereGeom = new THREE.SphereGeometry(2, 8, 8);
        var sphereMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var sphere = new THREE.Mesh(sphereGeom, sphereMat);
        sphere.position.set(0, 28, 0);
        scene.add(sphere);
        objects.push(sphere);

        // Add lights
        var light1 = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        light1.position.set(30, 25, 30);
        scene.add(light1);
        lights.push(light1);

        var light2 = new THREE.AmbientLight(0xFFFFFF, 0.5);
        scene.add(light2);
        lights.push(light2);
    }

    function update(delta) {
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].rotation) {
                    if (i === 3) {
                        objects[i].rotation.z += delta * 0.3;
                    }
                }
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
