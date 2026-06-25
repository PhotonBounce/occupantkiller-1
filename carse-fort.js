window.CarseFort = (function() {
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
        buildFort();
    }

    function buildFort() {
        // Earthwork mound base
        var moundGeom = new THREE.BoxGeometry(60, 12, 50);
        var moundMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var mound = new THREE.Mesh(moundGeom, moundMat);
        mound.position.set(0, 6, 0);
        scene.add(mound);
        objects.push(mound);

        // Palisade wall ring - left side
        var wallLeftGeom = new THREE.BoxGeometry(8, 15, 40);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var wallLeft = new THREE.Mesh(wallLeftGeom, wallMat);
        wallLeft.position.set(-26, 19, 0);
        scene.add(wallLeft);
        objects.push(wallLeft);

        // Palisade wall ring - right side
        var wallRightGeom = new THREE.BoxGeometry(8, 15, 40);
        var wallRight = new THREE.Mesh(wallRightGeom, wallMat);
        wallRight.position.set(26, 19, 0);
        scene.add(wallRight);
        objects.push(wallRight);

        // Palisade wall ring - front
        var wallFrontGeom = new THREE.BoxGeometry(48, 15, 8);
        var wallFront = new THREE.Mesh(wallFrontGeom, wallMat);
        wallFront.position.set(0, 19, -24);
        scene.add(wallFront);
        objects.push(wallFront);

        // Palisade wall ring - back
        var wallBackGeom = new THREE.BoxGeometry(48, 15, 8);
        var wallBack = new THREE.Mesh(wallBackGeom, wallMat);
        wallBack.position.set(0, 19, 24);
        scene.add(wallBack);
        objects.push(wallBack);

        // Gate watchtower - left pillar
        var pillarLeftGeom = new THREE.CylinderGeometry(4, 4, 22, 8);
        var pillarMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var pillarLeft = new THREE.Mesh(pillarLeftGeom, pillarMat);
        pillarLeft.position.set(-12, 20, -24);
        scene.add(pillarLeft);
        objects.push(pillarLeft);

        // Gate watchtower - right pillar
        var pillarRightGeom = new THREE.CylinderGeometry(4, 4, 22, 8);
        var pillarRight = new THREE.Mesh(pillarRightGeom, pillarMat);
        pillarRight.position.set(12, 20, -24);
        scene.add(pillarRight);
        objects.push(pillarRight);

        // Gate watchtower - parapet connecting
        var parapetGeom = new THREE.BoxGeometry(28, 6, 6);
        var parapetMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var parapet = new THREE.Mesh(parapetGeom, parapetMat);
        parapet.position.set(0, 28, -24);
        scene.add(parapet);
        objects.push(parapet);

        // Drawbridge - box bridge
        var bridgeGeom = new THREE.BoxGeometry(16, 2, 12);
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var bridge = new THREE.Mesh(bridgeGeom, bridgeMat);
        bridge.position.set(0, 13, -30);
        bridge.rotation.z = 0.3;
        scene.add(bridge);
        objects.push(bridge);

        // Drawbridge winch - cylinder drum
        var winchGeom = new THREE.CylinderGeometry(3, 3, 8, 12);
        var winchMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var winch = new THREE.Mesh(winchGeom, winchMat);
        winch.position.set(0, 16, -20);
        winch.rotation.z = Math.PI / 2;
        scene.add(winch);
        objects.push(winch);

        // Drawbridge chain
        var chainPoints = [
            new THREE.Vector3(0, 13, -30),
            new THREE.Vector3(0, 16, -20),
            new THREE.Vector3(0, 13, -10)
        ];
        var chainGeom = new THREE.BufferGeometry().setFromPoints(chainPoints);
        var chainMat = new THREE.LineBasicMaterial({ color: 0x4A4A4A, linewidth: 2 });
        var chain = new THREE.LineSegments(chainGeom, chainMat);
        scene.add(chain);
        objects.push(chain);

        // Tidal flood gate - box gate
        var gateGeom = new THREE.BoxGeometry(20, 10, 3);
        var gateMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var gate = new THREE.Mesh(gateGeom, gateMat);
        gate.position.set(0, 12, -36);
        scene.add(gate);
        objects.push(gate);

        // Tidal flood gate - locking bars
        var bar1Points = [
            new THREE.Vector3(-8, 10, -35),
            new THREE.Vector3(-8, 10, -37)
        ];
        var bar1Geom = new THREE.BufferGeometry().setFromPoints(bar1Points);
        var barMat = new THREE.LineBasicMaterial({ color: 0x2F4F4F, linewidth: 3 });
        var bar1 = new THREE.LineSegments(bar1Geom, barMat);
        scene.add(bar1);
        objects.push(bar1);

        var bar2Points = [
            new THREE.Vector3(8, 10, -35),
            new THREE.Vector3(8, 10, -37)
        ];
        var bar2Geom = new THREE.BufferGeometry().setFromPoints(bar2Points);
        var bar2 = new THREE.LineSegments(bar2Geom, barMat);
        scene.add(bar2);
        objects.push(bar2);

        // Field artillery position - barrel
        var barrelGeom = new THREE.CylinderGeometry(1.5, 1.8, 14, 8);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.position.set(20, 18, -15);
        barrel.rotation.z = 0.4;
        scene.add(barrel);
        objects.push(barrel);

        // Field artillery position - mount
        var mountGeom = new THREE.BoxGeometry(8, 6, 8);
        var mountMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var mount = new THREE.Mesh(mountGeom, mountMat);
        mount.position.set(20, 12, -15);
        scene.add(mount);
        objects.push(mount);

        // Crop field minefield - field plots
        var fieldGeom = new THREE.BoxGeometry(10, 0.5, 10);
        var fieldMat = new THREE.MeshLambertMaterial({ color: 0x8B7500 });
        var field = new THREE.Mesh(fieldGeom, fieldMat);
        field.position.set(-20, 19.5, 10);
        scene.add(field);
        objects.push(field);

        // Minefield mine markers
        var mineGeom = new THREE.SphereGeometry(1.5, 8, 8);
        var mineMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var mine1 = new THREE.Mesh(mineGeom, mineMat);
        mine1.position.set(-25, 21, 8);
        scene.add(mine1);
        objects.push(mine1);

        var mine2 = new THREE.Mesh(mineGeom, mineMat);
        mine2.position.set(-15, 21, 12);
        scene.add(mine2);
        objects.push(mine2);

        var mine3 = new THREE.Mesh(mineGeom, mineMat);
        mine3.position.set(-20, 21, 15);
        scene.add(mine3);
        objects.push(mine3);

        // Emergency raft escape - box raft
        var raftGeom = new THREE.BoxGeometry(12, 2, 8);
        var raftMat = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
        var raft = new THREE.Mesh(raftGeom, raftMat);
        raft.position.set(-30, 8, 30);
        scene.add(raft);
        objects.push(raft);

        // Emergency raft - barrel floats
        var floatGeom = new THREE.CylinderGeometry(2, 2, 5, 8);
        var floatMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var float1 = new THREE.Mesh(floatGeom, floatMat);
        float1.position.set(-22, 5, 28);
        float1.rotation.z = Math.PI / 2;
        scene.add(float1);
        objects.push(float1);

        var float2 = new THREE.Mesh(floatGeom, floatMat);
        float2.position.set(-22, 5, 32);
        float2.rotation.z = Math.PI / 2;
        scene.add(float2);
        objects.push(float2);

        // Additional decorative cone - watchtower roof peak
        var roofGeom = new THREE.ConeGeometry(5, 8, 8);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0xCD5C5C });
        var roof = new THREE.Mesh(roofGeom, roofMat);
        roof.position.set(0, 33, -24);
        scene.add(roof);
        objects.push(roof);

        // Lighting
        var ambLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambLight);
        lights.push(ambLight);

        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(40, 40, 40);
        scene.add(dirLight);
        lights.push(dirLight);

        var pointLight = new THREE.PointLight(0xFFD700, 0.5);
        pointLight.position.set(-30, 25, -20);
        scene.add(pointLight);
        lights.push(pointLight);
    }

    function update(delta) {
        // Animate winch rotation
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry && objects[i].geometry.type === 'CylinderGeometry') {
                if (objects[i].position.y > 15 && objects[i].position.y < 17) {
                    objects[i].rotation.x += 0.02;
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
