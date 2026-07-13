window.MossDock = (function() {
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
        buildDock();
    }
    function buildDock() {
        var mossGreen = 0x2d5016;
        var darkMoss = 0x1a3009;
        var stoneGray = 0x5a5a5a;
        var algaeGreen = 0x4a6b3a;
        var logBrown = 0x4a3a2a;
        var waterGreen = 0x3d6b5f;

        var mossStone = new THREE.MeshLambertMaterial({ color: mossGreen });
        var darkMaterial = new THREE.MeshLambertMaterial({ color: darkMoss });
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: stoneGray });
        var algaeMaterial = new THREE.MeshLambertMaterial({ color: algaeGreen });
        var logMaterial = new THREE.MeshLambertMaterial({ color: logBrown });
        var waterMaterial = new THREE.MeshLambertMaterial({ color: waterGreen });

        var quayWallLeft = new THREE.Mesh(
            new THREE.BoxGeometry(8, 12, 2),
            mossStone
        );
        quayWallLeft.position.set(-25, 6, -28);
        scene.add(quayWallLeft);
        objects.push(quayWallLeft);

        var quayWallRight = new THREE.Mesh(
            new THREE.BoxGeometry(8, 12, 2),
            mossStone
        );
        quayWallRight.position.set(25, 6, -28);
        scene.add(quayWallRight);
        objects.push(quayWallRight);

        var quayWallBack = new THREE.Mesh(
            new THREE.BoxGeometry(60, 12, 2),
            darkMaterial
        );
        quayWallBack.position.set(0, 6, -32);
        scene.add(quayWallBack);
        objects.push(quayWallBack);

        var waterBase = new THREE.Mesh(
            new THREE.BoxGeometry(70, 2, 50),
            waterMaterial
        );
        waterBase.position.set(0, -1, 0);
        scene.add(waterBase);
        objects.push(waterBase);

        var logBoom1 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 30, 16),
            logMaterial
        );
        logBoom1.rotation.z = Math.PI / 2;
        logBoom1.position.set(-5, 3, 10);
        scene.add(logBoom1);
        objects.push(logBoom1);

        var logBoom2 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 30, 16),
            logMaterial
        );
        logBoom2.rotation.z = Math.PI / 2;
        logBoom2.position.set(8, 2, -8);
        scene.add(logBoom2);
        objects.push(logBoom2);

        var algaeCoveredBlock1 = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 6),
            algaeMaterial
        );
        algaeCoveredBlock1.position.set(-15, 2, 15);
        scene.add(algaeCoveredBlock1);
        objects.push(algaeCoveredBlock1);

        var algaeCoveredBlock2 = new THREE.Mesh(
            new THREE.BoxGeometry(5, 5, 5),
            algaeMaterial
        );
        algaeCoveredBlock2.position.set(18, 1.5, 20);
        scene.add(algaeCoveredBlock2);
        objects.push(algaeCoveredBlock2);

        var millBase = new THREE.Mesh(
            new THREE.BoxGeometry(12, 8, 10),
            stoneMaterial
        );
        millBase.position.set(0, 4, -18);
        scene.add(millBase);
        objects.push(millBase);

        var millWall = new THREE.Mesh(
            new THREE.BoxGeometry(10, 10, 3),
            mossStone
        );
        millWall.position.set(0, 9, -18);
        scene.add(millWall);
        objects.push(millWall);

        var wheelAxle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 14, 12),
            logMaterial
        );
        wheelAxle.rotation.z = Math.PI / 2;
        wheelAxle.position.set(0, 8, -10);
        scene.add(wheelAxle);
        objects.push(wheelAxle);

        var wheelSegment1 = new THREE.Mesh(
            new THREE.CylinderGeometry(6, 6, 1.2, 8),
            algaeMaterial
        );
        wheelSegment1.rotation.z = Math.PI / 2;
        wheelSegment1.position.set(-6, 8, -10);
        scene.add(wheelSegment1);
        objects.push(wheelSegment1);

        var wheelSegment2 = new THREE.Mesh(
            new THREE.CylinderGeometry(6, 6, 1.2, 8),
            mossStone
        );
        wheelSegment2.rotation.z = Math.PI / 2;
        wheelSegment2.position.set(6, 8, -10);
        scene.add(wheelSegment2);
        objects.push(wheelSegment2);

        var dockPost1 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.6, 8, 10),
            darkMaterial
        );
        dockPost1.position.set(-20, 4, 5);
        scene.add(dockPost1);
        objects.push(dockPost1);

        var dockPost2 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.6, 8, 10),
            darkMaterial
        );
        dockPost2.position.set(20, 4, 5);
        scene.add(dockPost2);
        objects.push(dockPost2);

        var dockPost3 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.6, 8, 10),
            mossStone
        );
        dockPost3.position.set(0, 4, 25);
        scene.add(dockPost3);
        objects.push(dockPost3);

        var dockPlank = new THREE.Mesh(
            new THREE.BoxGeometry(50, 1, 8),
            logMaterial
        );
        dockPlank.position.set(0, 3, 22);
        scene.add(dockPlank);
        objects.push(dockPlank);

        var rockFormation = new THREE.Mesh(
            new THREE.SphereGeometry(4, 8, 8),
            stoneMaterial
        );
        rockFormation.position.set(-28, 2, 12);
        scene.add(rockFormation);
        objects.push(rockFormation);

        var mossyCone = new THREE.Mesh(
            new THREE.ConeGeometry(3, 6, 12),
            algaeMaterial
        );
        mossyCone.position.set(26, 3, 8);
        scene.add(mossyCone);
        objects.push(mossyCone);

        var ambientLight = new THREE.AmbientLight(0x88aa88, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xaaffaa, 0.6);
        directionalLight.position.set(20, 25, 15);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }
    function update(delta) {
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].rotation) {
                    if (i === 11 || i === 12) {
                        objects[i].rotation.x += delta * 0.3;
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
