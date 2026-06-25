window.GlenFort = (function() {
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
        // Castle tower with crenellations
        var towerGeom = new THREE.CylinderGeometry(8, 8, 25, 16);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(0, 12.5, 0);
        scene.add(tower);
        objects.push(tower);

        // Crenellated top (box)
        var crenelGeom = new THREE.BoxGeometry(18, 3, 18);
        var crenelMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var crenel = new THREE.Mesh(crenelGeom, crenelMat);
        crenel.position.set(0, 27, 0);
        scene.add(crenel);
        objects.push(crenel);

        // Peat bog trench 1 (sunken box)
        var bogGeom1 = new THREE.BoxGeometry(12, 4, 20);
        var bogMat1 = new THREE.MeshLambertMaterial({ color: 0x3D2817 });
        var bog1 = new THREE.Mesh(bogGeom1, bogMat1);
        bog1.position.set(-25, -2, 0);
        scene.add(bog1);
        objects.push(bog1);

        // Peat bog trench 2
        var bogGeom2 = new THREE.BoxGeometry(12, 4, 20);
        var bogMat2 = new THREE.MeshLambertMaterial({ color: 0x3D2817 });
        var bog2 = new THREE.Mesh(bogGeom2, bogMat2);
        bog2.position.set(25, -2, 0);
        scene.add(bog2);
        objects.push(bog2);

        // Standing stone 1 (tall thin box)
        var stoneGeom1 = new THREE.BoxGeometry(2, 18, 2);
        var stoneMat1 = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var stone1 = new THREE.Mesh(stoneGeom1, stoneMat1);
        stone1.position.set(-20, 9, -22);
        scene.add(stone1);
        objects.push(stone1);

        // Standing stone 2
        var stoneGeom2 = new THREE.BoxGeometry(2, 18, 2);
        var stoneMat2 = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var stone2 = new THREE.Mesh(stoneGeom2, stoneMat2);
        stone2.position.set(20, 9, -22);
        scene.add(stone2);
        objects.push(stone2);

        // Standing stone 3
        var stoneGeom3 = new THREE.BoxGeometry(2, 18, 2);
        var stoneMat3 = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var stone3 = new THREE.Mesh(stoneGeom3, stoneMat3);
        stone3.position.set(-20, 9, 22);
        scene.add(stone3);
        objects.push(stone3);

        // Standing stone 4
        var stoneGeom4 = new THREE.BoxGeometry(2, 18, 2);
        var stoneMat4 = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var stone4 = new THREE.Mesh(stoneGeom4, stoneMat4);
        stone4.position.set(20, 9, 22);
        scene.add(stone4);
        objects.push(stone4);

        // Bagpipe soldier body (cylinder)
        var bodyGeom = new THREE.CylinderGeometry(1.5, 1.5, 6, 12);
        var bodyMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.set(-30, 3, 15);
        scene.add(body);
        objects.push(body);

        // Bagpipe soldier head (sphere)
        var headGeom = new THREE.SphereGeometry(1.2, 16, 16);
        var headMat = new THREE.MeshLambertMaterial({ color: 0xD4A574 });
        var head = new THREE.Mesh(headGeom, headMat);
        head.position.set(-30, 8, 15);
        scene.add(head);
        objects.push(head);

        // Clan banner pole 1 (cylinder)
        var poleGeom1 = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
        var poleMat1 = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
        var pole1 = new THREE.Mesh(poleGeom1, poleMat1);
        pole1.position.set(-15, 6, 25);
        scene.add(pole1);
        objects.push(pole1);

        // Clan banner flag 1 (box)
        var bannerGeom1 = new THREE.BoxGeometry(4, 3, 0.3);
        var bannerMat1 = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        var banner1 = new THREE.Mesh(bannerGeom1, bannerMat1);
        banner1.position.set(-13, 10, 25);
        scene.add(banner1);
        objects.push(banner1);

        // Clan banner pole 2
        var poleGeom2 = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
        var poleMat2 = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
        var pole2 = new THREE.Mesh(poleGeom2, poleMat2);
        pole2.position.set(15, 6, 25);
        scene.add(pole2);
        objects.push(pole2);

        // Clan banner flag 2
        var bannerGeom2 = new THREE.BoxGeometry(4, 3, 0.3);
        var bannerMat2 = new THREE.MeshLambertMaterial({ color: 0x0000FF });
        var banner2 = new THREE.Mesh(bannerGeom2, bannerMat2);
        banner2.position.set(17, 10, 25);
        scene.add(banner2);
        objects.push(banner2);

        // Highland cone peak 1 (decorative)
        var peakGeom1 = new THREE.ConeGeometry(6, 10, 16);
        var peakMat1 = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var peak1 = new THREE.Mesh(peakGeom1, peakMat1);
        peak1.position.set(-28, 5, -28);
        scene.add(peak1);
        objects.push(peak1);

        // Highland cone peak 2
        var peakGeom2 = new THREE.ConeGeometry(6, 10, 16);
        var peakMat2 = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var peak2 = new THREE.Mesh(peakGeom2, peakMat2);
        peak2.position.set(28, 5, -28);
        scene.add(peak2);
        objects.push(peak2);

        // Ground platform (large box base)
        var groundGeom = new THREE.BoxGeometry(60, 1, 60);
        var groundMat = new THREE.MeshLambertMaterial({ color: 0x6B4423 });
        var ground = new THREE.Mesh(groundGeom, groundMat);
        ground.position.set(0, -0.5, 0);
        scene.add(ground);
        objects.push(ground);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var pointLight = new THREE.PointLight(0xFFFFCC, 0.8);
        pointLight.position.set(0, 20, 0);
        scene.add(pointLight);
        lights.push(pointLight);
    }

    function update(delta) {
        // Animate banners
        if (objects.length > 12) {
            objects[11].rotation.z += 0.02;
            objects[13].rotation.z += 0.02;
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
