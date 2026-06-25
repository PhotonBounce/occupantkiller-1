window.CreranFort = (function() {
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
        // Loch terrain base - shallow Argyll loch
        var terrainGeom = new THREE.BoxGeometry(120, 8, 120);
        var terrainMat = new THREE.MeshLambertMaterial({ color: 0x1a4d2e });
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, -5, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Barcaldine Castle tower - medieval box tower
        var towerGeom = new THREE.BoxGeometry(12, 20, 12);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(-20, 5, -15);
        scene.add(tower);
        objects.push(tower);

        // Bailey wall surrounding castle
        var wallGeom = new THREE.BoxGeometry(40, 6, 2);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0xa0826d });
        var wall1 = new THREE.Mesh(wallGeom, wallMat);
        wall1.position.set(-20, 2, -30);
        scene.add(wall1);
        objects.push(wall1);

        var wall2 = new THREE.Mesh(wallGeom, wallMat);
        wall2.position.set(-20, 2, 0);
        scene.add(wall2);
        objects.push(wall2);

        var wall3 = new THREE.BoxGeometry(2, 6, 30);
        var wall3m = new THREE.Mesh(wall3, wallMat);
        wall3m.position.set(-40, 2, -15);
        scene.add(wall3m);
        objects.push(wall3m);

        // Seaweed farm platform - floating observation deck
        var platformGeom = new THREE.BoxGeometry(20, 2, 20);
        var platformMat = new THREE.MeshLambertMaterial({ color: 0x2d5a3d });
        var platform = new THREE.Mesh(platformGeom, platformMat);
        platform.position.set(25, 2, 20);
        scene.add(platform);
        objects.push(platform);

        // Lookout post on platform
        var postGeom = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
        var postMat = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 });
        var post = new THREE.Mesh(postGeom, postMat);
        post.position.set(25, 6, 20);
        scene.add(post);
        objects.push(post);

        // Underwater cable farm - LineSegments for cables
        var cableGeom = new THREE.BufferGeometry();
        var cablePoints = [
            new THREE.Vector3(10, -2, -20),
            new THREE.Vector3(15, -8, -18),
            new THREE.Vector3(20, -3, -16),
            new THREE.Vector3(12, -6, -22)
        ];
        cableGeom.setFromPoints(cablePoints);
        var cableMat = new THREE.LineBasicMaterial({ color: 0x444444 });
        var cables = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cables);
        objects.push(cables);

        // Control bunker for cable farm
        var bunkerGeom = new THREE.BoxGeometry(8, 5, 8);
        var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
        bunker.position.set(15, 1, -20);
        scene.add(bunker);
        objects.push(bunker);

        // Fish farm cage - cylinder frames
        var cageGeom = new THREE.CylinderGeometry(5, 5, 3, 8);
        var cageMat = new THREE.MeshLambertMaterial({ color: 0x4a7c7e });
        var cage = new THREE.Mesh(cageGeom, cageMat);
        cage.position.set(-10, 1, 25);
        scene.add(cage);
        objects.push(cage);

        // Fish in cage - sphere
        var fishGeom = new THREE.SphereGeometry(0.8, 8, 8);
        var fishMat = new THREE.MeshLambertMaterial({ color: 0xffa500 });
        var fish = new THREE.Mesh(fishGeom, fishMat);
        fish.position.set(-10, 2, 25);
        scene.add(fish);
        objects.push(fish);

        // Guard hut at farm
        var hutGeom = new THREE.BoxGeometry(6, 4, 6);
        var hutMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var hut = new THREE.Mesh(hutGeom, hutMat);
        hut.position.set(-10, 2, 15);
        scene.add(hut);
        objects.push(hut);

        // Creagan road viaduct - bridge span
        var bridgeGeom = new THREE.BoxGeometry(30, 3, 4);
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var bridge = new THREE.Mesh(bridgeGeom, bridgeMat);
        bridge.position.set(5, 8, 0);
        scene.add(bridge);
        objects.push(bridge);

        // Viaduct piers - cylinders
        var pierGeom = new THREE.CylinderGeometry(2, 2.5, 12, 8);
        var pierMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var pier1 = new THREE.Mesh(pierGeom, pierMat);
        pier1.position.set(-8, 1, 0);
        scene.add(pier1);
        objects.push(pier1);

        var pier2 = new THREE.Mesh(pierGeom, pierMat);
        pier2.position.set(18, 1, 0);
        scene.add(pier2);
        objects.push(pier2);

        // Highland cattle droving trail - stone dyke walls
        var dykeGeom = new THREE.BoxGeometry(60, 4, 2);
        var dykeMat = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
        var dyke1 = new THREE.Mesh(dykeGeom, dykeMat);
        dyke1.position.set(0, 2, -35);
        scene.add(dyke1);
        objects.push(dyke1);

        var dyke2 = new THREE.Mesh(dykeGeom, dykeMat);
        dyke2.position.set(0, 2, 35);
        scene.add(dyke2);
        objects.push(dyke2);

        // Tidal race gun position - box emplacement
        var emplacementGeom = new THREE.BoxGeometry(10, 3, 10);
        var emplacementMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var emplacement = new THREE.Mesh(emplacementGeom, emplacementMat);
        emplacement.position.set(30, 2, -25);
        scene.add(emplacement);
        objects.push(emplacement);

        // Gun barrel - cone pointing into channel
        var barrelGeom = new THREE.ConeGeometry(1, 6, 8);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.position.set(30, 4, -25);
        barrel.rotation.z = Math.PI / 2;
        scene.add(barrel);
        objects.push(barrel);

        // Add lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(40, 30, 40);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation placeholder
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
