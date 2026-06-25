window.FellCamp = (function() {
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
        // Stone cairn navigation marker 1 (stacked spheres and boxes)
        var cairnBase1 = new THREE.BoxGeometry(2, 1, 2);
        var cairnMat1 = new THREE.MeshLambertMaterial({ color: 0x8b8680 });
        var cairnMesh1 = new THREE.Mesh(cairnBase1, cairnMat1);
        cairnMesh1.position.set(-25, 0.5, -20);
        scene.add(cairnMesh1);
        objects.push(cairnMesh1);

        var cairnSphere1 = new THREE.SphereGeometry(1.2, 16, 16);
        var cairnSphereMat1 = new THREE.MeshLambertMaterial({ color: 0xa39f99 });
        var cairnSphereMesh1 = new THREE.Mesh(cairnSphere1, cairnSphereMat1);
        cairnSphereMesh1.position.set(-25, 2, -20);
        scene.add(cairnSphereMesh1);
        objects.push(cairnSphereMesh1);

        var cairnTop1 = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        var cairnTopMat1 = new THREE.MeshLambertMaterial({ color: 0x9a9590 });
        var cairnTopMesh1 = new THREE.Mesh(cairnTop1, cairnTopMat1);
        cairnTopMesh1.position.set(-25, 3.5, -20);
        scene.add(cairnTopMesh1);
        objects.push(cairnTopMesh1);

        // Stone cairn navigation marker 2
        var cairnBase2 = new THREE.BoxGeometry(2, 1, 2);
        var cairnMat2 = new THREE.MeshLambertMaterial({ color: 0x8b8680 });
        var cairnMesh2 = new THREE.Mesh(cairnBase2, cairnMat2);
        cairnMesh2.position.set(20, 0.5, 25);
        scene.add(cairnMesh2);
        objects.push(cairnMesh2);

        var cairnSphere2 = new THREE.SphereGeometry(1, 16, 16);
        var cairnSphereMat2 = new THREE.MeshLambertMaterial({ color: 0xa39f99 });
        var cairnSphereMesh2 = new THREE.Mesh(cairnSphere2, cairnSphereMat2);
        cairnSphereMesh2.position.set(20, 2, 25);
        scene.add(cairnSphereMesh2);
        objects.push(cairnSphereMesh2);

        // Moorland patrol post structure (cylindrical tower)
        var postBase = new THREE.CylinderGeometry(3, 4, 1, 16);
        var postBaseMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
        var postBaseMesh = new THREE.Mesh(postBase, postBaseMat);
        postBaseMesh.position.set(0, 0.5, 0);
        scene.add(postBaseMesh);
        objects.push(postBaseMesh);

        var postTower = new THREE.CylinderGeometry(2.5, 2.5, 6, 16);
        var postTowerMat = new THREE.MeshLambertMaterial({ color: 0x5a5a4a });
        var postTowerMesh = new THREE.Mesh(postTower, postTowerMat);
        postTowerMesh.position.set(0, 4, 0);
        scene.add(postTowerMesh);
        objects.push(postTowerMesh);

        var postRoof = new THREE.ConeGeometry(3, 2, 16);
        var postRoofMat = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
        var postRoofMesh = new THREE.Mesh(postRoof, postRoofMat);
        postRoofMesh.position.set(0, 8, 0);
        scene.add(postRoofMesh);
        objects.push(postRoofMesh);

        // Peat smoke fire pit 1 (glow sphere + box hearth)
        var fireHearthBox1 = new THREE.BoxGeometry(3, 0.5, 3);
        var fireHearthMat1 = new THREE.MeshLambertMaterial({ color: 0x2a2a1a });
        var fireHearthMesh1 = new THREE.Mesh(fireHearthBox1, fireHearthMat1);
        fireHearthMesh1.position.set(-15, 0.25, 10);
        scene.add(fireHearthMesh1);
        objects.push(fireHearthMesh1);

        var fireSmokeGlow1 = new THREE.SphereGeometry(1.5, 16, 16);
        var fireSmokeMat1 = new THREE.MeshLambertMaterial({ color: 0xcc9966, emissive: 0x664422 });
        var fireSmokeMesh1 = new THREE.Mesh(fireSmokeGlow1, fireSmokeMat1);
        fireSmokeMesh1.position.set(-15, 2, 10);
        scene.add(fireSmokeMesh1);
        objects.push(fireSmokeMesh1);

        // Peat smoke fire pit 2
        var fireHearthBox2 = new THREE.BoxGeometry(3, 0.5, 3);
        var fireHearthMat2 = new THREE.MeshLambertMaterial({ color: 0x2a2a1a });
        var fireHearthMesh2 = new THREE.Mesh(fireHearthBox2, fireHearthMat2);
        fireHearthMesh2.position.set(15, 0.25, -15);
        scene.add(fireHearthMesh2);
        objects.push(fireHearthMesh2);

        var fireSmokeGlow2 = new THREE.SphereGeometry(1.5, 16, 16);
        var fireSmokeMat2 = new THREE.MeshLambertMaterial({ color: 0xcc9966, emissive: 0x664422 });
        var fireSmokeMesh2 = new THREE.Mesh(fireSmokeGlow2, fireSmokeMat2);
        fireSmokeMesh2.position.set(15, 2, -15);
        scene.add(fireSmokeMesh2);
        objects.push(fireSmokeMesh2);

        // Supply drop zone marker (central cylinder)
        var dropZoneCylinder = new THREE.CylinderGeometry(4, 4, 0.3, 16);
        var dropZoneMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var dropZoneMesh = new THREE.Mesh(dropZoneCylinder, dropZoneMat);
        dropZoneMesh.position.set(0, 0.15, -25);
        scene.add(dropZoneMesh);
        objects.push(dropZoneMesh);

        // Mist-shrouded low walls
        var wallSegment1 = new THREE.BoxGeometry(8, 1.5, 0.8);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x696055 });
        var wallMesh1 = new THREE.Mesh(wallSegment1, wallMat);
        wallMesh1.position.set(-18, 0.75, 15);
        scene.add(wallMesh1);
        objects.push(wallMesh1);

        var wallSegment2 = new THREE.BoxGeometry(0.8, 1.5, 8);
        var wallMesh2 = new THREE.Mesh(wallSegment2, wallMat);
        wallMesh2.position.set(-14, 0.75, 10);
        scene.add(wallMesh2);
        objects.push(wallMesh2);

        var wallSegment3 = new THREE.BoxGeometry(6, 1.2, 0.8);
        var wallMesh3 = new THREE.Mesh(wallSegment3, wallMat);
        wallMesh3.position.set(12, 0.6, -8);
        scene.add(wallMesh3);
        objects.push(wallMesh3);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0x7a7a6a, 0.7);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light (moorland sun)
        var dirLight = new THREE.DirectionalLight(0xccccbb, 0.8);
        dirLight.position.set(30, 20, 20);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animate fire glow pulsing
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (obj.material && obj.material.emissive) {
                var pulse = 0.5 + 0.3 * Math.sin(delta * 3);
                obj.material.emissive.setScalar(pulse);
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
